/**
 * jobSync.js — Scheduled background sync for external job data.
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │  ARCHITECTURE                                                        │
 * │                                                                      │
 * │  Cloud Scheduler (24h) ─► jobSync function ─► External API           │
 * │                                      │                               │
 * │                                      ▼                               │
 * │                               Deduplication                          │
 * │                               (job_url hash)                         │
 * │                                      │                               │
 * │                                      ▼                               │
 * │                              Normalization                           │
 * │                              (→ JobListing)                          │
 * │                                      │                               │
 * │                                      ▼                               │
 * │                        Firestore `jobs` collection                   │
 * │                         + api_cache sync_meta                        │
 * │                                                                      │
 * │  COST CONTROLS                                                       │
 * │    • Single daily execution via Cloud Scheduler                      │
 * │    • api_cache/sync_meta tracks last run → prevents duplicate calls  │
 * │    • Batched Firestore writes (max 500 per batch)                    │
 * │    • Staleness expiry auto-marks old listings as expired             │
 * │                                                                      │
 * │  ERROR HANDLING                                                      │
 * │    • try/catch around every API call and Firestore write             │
 * │    • Errors logged to Cloud Logging (→ Crashlytics via alert)        │
 * │    • On failure, portal serves last-known cached data                │
 * │    • sync_meta stores error details for admin dashboard              │
 * └───────────────────────────────────────────────────────────────────────┘
 */

const admin = require('firebase-admin');
const axios = require('axios');
const crypto = require('crypto');

// ── Lazy Firestore reference (admin.initializeApp() is called in index.js) ────
let _db = null;
function getDb() {
  if (!_db) _db = admin.firestore();
  return _db;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const JOBS_COLLECTION     = 'jobs';
const SYNC_META_DOC       = 'api_cache/job_sync_meta';
const BATCH_SIZE          = 450;  // Firestore limit is 500; leave headroom
const STALENESS_DAYS      = 30;   // Jobs older than this get marked expired
const MAX_RESULTS_PER_RUN = 250;  // Raised to pull more jobs per run

// ── Supported API adapters ────────────────────────────────────────────────────
// Each adapter normalises the external API's response to our JobListing schema.
// To add a new provider, just add another adapter here.

const API_ADAPTERS = {

  /**
   * Reed UK Jobs API
   * Docs: https://www.reed.co.uk/developers/jobseeker
   * Auth: Basic auth with API key (password blank)
   */
  reed: {
    name: 'Reed UK',
    fetch: async (config) => {
      const { apiKey, keywords = 'graduate', location = 'United Kingdom', maxResults = 50 } = config;
      if (!apiKey) throw new Error('REED_API_KEY not configured');

      const credentials = Buffer.from(`${apiKey}:`).toString('base64');
      const params = new URLSearchParams({
        keywords,
        locationName: location,
        resultsToTake: String(Math.min(maxResults, MAX_RESULTS_PER_RUN)),
      });

      const response = await axios.get(
        `https://www.reed.co.uk/api/1.0/search?${params}`,
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      return (response.data.results || []).map(normalizeReedJob);
    },
  },

  /**
   * SerpApi Jobs (Google Jobs scraper)
   * Docs: https://serpapi.com/google-jobs-api
   */
  serpapi: {
    name: 'SerpApi (Google Jobs)',
    fetch: async (config) => {
      const { apiKey, query = 'graduate jobs UK', location = 'United Kingdom', maxResults = 50 } = config;
      if (!apiKey) throw new Error('SERPAPI_KEY not configured');

      const params = new URLSearchParams({
        engine: 'google_jobs',
        q: query,
        location,
        api_key: apiKey,
        num: String(Math.min(maxResults, MAX_RESULTS_PER_RUN)),
      });

      const response = await axios.get(
        `https://serpapi.com/search.json?${params}`,
        { timeout: 20000 }
      );

      return (response.data.jobs_results || []).map(normalizeSerpApiJob);
    },
  },

  /**
   * JobsPikr Data Feeds API
   * Docs: https://app.jobspikr.com/public_api_details
   * User plan: Data Feeds — Starter (1,400 credits, 200/day)
   *
   * The API uses an Elasticsearch-style query body with `search_query_json`.
   * Format confirmed via the Query Builder at:
   * https://app.jobspikr.com/organizations/authentifactor/query_builder
   */
  jobspikr: {
    name: 'JobsPikr',
    fetch: async (config) => {
      const { clientId, clientSecret, query = 'graduate', country = 'United Kingdom', maxResults = 50 } = config;
      if (!clientId || !clientSecret) throw new Error('JOBSPIKR credentials not configured');

      const limit = Math.min(maxResults, MAX_RESULTS_PER_RUN);

      // Date range: last 30 days
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
      const dateLte = now.toISOString().split('T')[0];       // e.g. "2026-03-08"
      const dateGte = thirtyDaysAgo.toISOString().split('T')[0]; // e.g. "2026-02-06"

      // Build the Elasticsearch-style query body (matches Query Builder output)
      const buildQueryBody = (jobTitleQuery) => ({
        client_id: clientId,
        client_auth_key: clientSecret,
        format: 'json',
        size: limit,
        dataset: ['job_board', 'f500'],
        search_query_json: {
          bool: {
            must: [
              // Job title filter
              {
                query_string: {
                  fields: ['job_title', 'inferred_job_title'],
                  query: jobTitleQuery,
                },
              },
              // Job type — accept all
              {
                query_string: {
                  default_field: 'job_type',
                  query: '*',
                },
              },
              // Company name — accept all
              {
                query_string: {
                  default_field: 'company_name',
                  query: '*',
                },
              },
              // Country filter
              {
                bool: {
                  should: [
                    {
                      bool: {
                        must: [
                          {
                            query_string: {
                              fields: ['inferred_country'],
                              query: `"${country}"`,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              // Date range — last 30 days
              {
                range: {
                  post_date: {
                    gte: dateGte,
                    lte: dateLte,
                  },
                },
              },
            ],
            must_not: [
              // Exclude unspecified company names
              {
                query_string: {
                  default_field: 'company_name',
                  query: 'Unspecified',
                },
              },
            ],
          },
        },
      });

      // Try the query with the specific search term first, then a broader one
      const queries = [query, 'graduate OR intern OR placement'];

      for (const q of queries) {
        try {
          const body = buildQueryBody(q);
          console.log(`[JobsPikr] POST /v2/data with search_query_json, job_title="${q}", country="${country}", size=${limit}`);

          const response = await axios.post(
            'https://api.jobspikr.com/v2/data',
            body,
            { timeout: 30000, headers: { 'Content-Type': 'application/json' } }
          );

          console.log(`[JobsPikr] Response status=${response.status}, keys=${JSON.stringify(Object.keys(response.data || {}))}`);

          // Extract jobs from response (try several possible keys)
          const jobs = response.data.job_data
            || response.data.data
            || response.data.results
            || response.data.jobs
            || response.data.records
            || [];

          if (Array.isArray(jobs) && jobs.length > 0) {
            console.log(`[JobsPikr] ✅ Got ${jobs.length} jobs for query "${q}"`);
            return jobs.map(normalizeJobsPikrJob);
          }

          console.log(`[JobsPikr] Query "${q}" returned 0 jobs. Body: ${JSON.stringify(response.data).slice(0, 500)}`);
        } catch (err) {
          const status = err.response?.status || 'network';
          const body = JSON.stringify(err.response?.data || err.message).slice(0, 500);
          console.warn(`[JobsPikr] Query "${q}" failed (${status}): ${body}`);
        }
      }

      console.warn('[JobsPikr] All queries failed — check credentials at https://app.jobspikr.com/my/api_keys');
      return [];
    },
  },
};


// ═════════════════════════════════════════════════════════════════════════════
//  NORMALIZERS — Map external API JSON → our Firestore JobListing schema
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Our canonical JobListing schema (matches the existing opportunities collection):
 * {
 *   title, company, location: { city, remote },
 *   type, category, salary: { min, max, currency },
 *   description, requirements: [],
 *   status, source, sourceUrl, sourceJobId,
 *   dedupeHash, expiresAt, createdAt, updatedAt,
 *   syncedAt, syncSource
 * }
 */

/** Safely create a Firestore Timestamp from any date-like value. */
function safeTimestamp(value) {
  try {
    if (!value) return defaultExpiry();
    const d = new Date(value);
    if (isNaN(d.getTime())) return defaultExpiry();
    return admin.firestore.Timestamp.fromMillis(d.getTime());
  } catch (_) {
    return defaultExpiry();
  }
}

function defaultExpiry() {
  return admin.firestore.Timestamp.fromMillis(Date.now() + STALENESS_DAYS * 86400000);
}

function normalizeReedJob(job) {
  const minSalary = job.minimumSalary || job.yearlyMinimumSalary || null;
  const maxSalary = job.maximumSalary || job.yearlyMaximumSalary || null;

  return {
    title:       job.jobTitle || 'Untitled',
    company:     job.employerName || 'Unknown',
    location: {
      city:   job.locationName || 'United Kingdom',
      remote: !!(job.locationName && job.locationName.toLowerCase().includes('remote')),
    },
    type:        inferJobType(job.jobTitle, job.contractType),
    category:    inferCategory(job.jobTitle),
    salary: {
      min:      minSalary ? Math.round(minSalary) : null,
      max:      maxSalary ? Math.round(maxSalary) : null,
      currency: 'GBP',
    },
    description:  job.jobDescription || '',
    requirements: [],
    status:       'active',
    source:       'reed',
    sourceUrl:    job.jobUrl || `https://www.reed.co.uk/jobs/${job.jobId}`,
    sourceJobId:  String(job.jobId || ''),
    dedupeHash:   generateDedupeHash('reed', job.jobId, job.jobUrl),
    applications: 0,
    views:        0,
    featured:     false,
    expiresAt:    safeTimestamp(job.expirationDate),
  };
}

function normalizeSerpApiJob(job) {
  const extensions = job.detected_extensions || {};

  return {
    title:       job.title || 'Untitled',
    company:     job.company_name || 'Unknown',
    location: {
      city:   job.location || 'United Kingdom',
      remote: !!(job.location && job.location.toLowerCase().includes('remote')),
    },
    type:        inferJobType(job.title, extensions.schedule_type),
    category:    inferCategory(job.title),
    salary: {
      min:      extensions.salary_min || null,
      max:      extensions.salary_max || null,
      currency: 'GBP',
    },
    description:  job.description || '',
    requirements: job.job_highlights?.find(h => h.title === 'Qualifications')?.items || [],
    status:       'active',
    source:       'serpapi',
    sourceUrl:    job.share_link || job.apply_options?.[0]?.link || `https://www.google.com/search?q=${encodeURIComponent((job.title || '') + ' ' + (job.company_name || '') + ' job')}&ibp=htl;jobs`,
    sourceJobId:  job.job_id || '',
    dedupeHash:   generateDedupeHash('serpapi', job.job_id, job.share_link),
    applications: 0,
    views:        0,
    featured:     false,
    expiresAt:    defaultExpiry(),
  };
}

function normalizeJobsPikrJob(job) {
  return {
    title:       job.job_title || 'Untitled',
    company:     job.company_name || 'Unknown',
    location: {
      city:   job.city || job.inferred_city || 'Unknown',
      remote: !!(job.job_type && job.job_type.toLowerCase().includes('remote')),
    },
    type:        inferJobType(job.job_title, job.job_type),
    category:    job.category || inferCategory(job.job_title),
    salary: {
      min:      null,
      max:      null,
      currency: 'GBP',
    },
    description:  job.job_description || '',
    requirements: [],
    status:       'active',
    source:       'jobspikr',
    sourceUrl:    job.url || '',
    sourceJobId:  job.uniq_id || '',
    dedupeHash:   generateDedupeHash('jobspikr', job.uniq_id, job.url),
    applications: 0,
    views:        0,
    featured:     false,
    expiresAt:    defaultExpiry(),
  };
}


// ═════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═════════════════════════════════════════════════════════════════════════════

/** Generate a deterministic hash for deduplication. */
function generateDedupeHash(source, jobId, url) {
  const raw = `${source}::${jobId || ''}::${url || ''}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

/** Infer job type from title + contract type string. */
function inferJobType(title, contractType) {
  const combined = `${title} ${contractType || ''}`.toLowerCase();
  if (combined.includes('internship') || combined.includes('intern') || combined.includes('placement')) return 'internship';
  if (combined.includes('graduate') || combined.includes('grad scheme')) return 'graduate';
  if (combined.includes('contract') || combined.includes('freelance'))  return 'contract';
  if (combined.includes('part-time') || combined.includes('part time')) return 'part-time';
  return 'full-time';
}

/** Infer category from job title. */
function inferCategory(title) {
  const lower = (title || '').toLowerCase();
  if (/software|developer|engineer|frontend|backend|fullstack|devops|sre/.test(lower))     return 'Technology';
  if (/data|analyst|machine learning|ai|ml/.test(lower))                                    return 'Data & Analytics';
  if (/design|ux|ui|creative|graphic/.test(lower))                                          return 'Design';
  if (/finance|accounting|audit|banking/.test(lower))                                       return 'Finance';
  if (/marketing|seo|content|social media/.test(lower))                                     return 'Marketing';
  if (/civil|structural|mechanical|electrical|construction|architect/.test(lower))           return 'Engineering';
  if (/project|management|business|consulting/.test(lower))                                 return 'Management';
  if (/legal|law|solicitor|compliance/.test(lower))                                         return 'Legal';
  if (/medical|health|pharma|clinical/.test(lower))                                         return 'Healthcare';
  if (/sales|account|business development/.test(lower))                                     return 'Sales';
  if (/hr|recruit|people|talent/.test(lower))                                               return 'Human Resources';
  return 'General';
}


// ═════════════════════════════════════════════════════════════════════════════
//  MAIN SYNC FUNCTION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * syncJobsFromApi — The core sync engine called by the scheduled Cloud Function.
 *
 * Steps:
 *  1. Check sync_meta to see when we last ran (cost guard)
 *  2. Fetch jobs from each configured provider
 *  3. Deduplicate against existing jobs in Firestore (via dedupeHash)
 *  4. Batch-write new jobs
 *  5. Expire stale jobs
 *  6. Update sync_meta with run details
 *
 * @returns {Object} Summary: { newJobs, skippedDuplicates, expiredJobs, errors }
 */
async function syncJobsFromApi() {
  const runStart = Date.now();
  const summary  = { newJobs: 0, skippedDuplicates: 0, expiredJobs: 0, errors: [], providers: [] };

  // ── Step 1: Cost guard — don't re-run if we already synced recently ─────────
  const db = getDb();
  const metaRef  = db.doc(SYNC_META_DOC);
  const metaSnap = await metaRef.get();
  const metaData = metaSnap.exists ? metaSnap.data() : {};

  if (metaData.lastRunAt) {
    const lastRun    = metaData.lastRunAt.toDate ? metaData.lastRunAt.toDate() : new Date(metaData.lastRunAt);
    const hoursSince = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);

    // If we ran less than 20 hours ago, skip (allows some overlap with the 24h schedule)
    if (hoursSince < 20) {
      console.log(`[jobSync] Skipping — last run was ${hoursSince.toFixed(1)}h ago (< 20h threshold)`);
      return { ...summary, skipped: true, reason: `Last run ${hoursSince.toFixed(1)}h ago` };
    }
  }

  // ── Step 2: Build provider configs from environment ─────────────────────────
  const providerConfigs = [];

  // ── Reed search strategy — broad keywords × major locations, 100 results each ─
  // Fewer total calls but each pulls more results (up to 100). Runs in parallel.
  const REED_SEARCHES = [
    // Engineering (broad terms, high volume)
    { keywords: 'graduate engineer',                          location: 'England' },
    { keywords: 'graduate civil engineer structural',         location: 'England' },
    { keywords: 'graduate mechanical engineer',               location: 'England' },
    { keywords: 'graduate electrical engineer',               location: 'England' },
    { keywords: 'engineering placement year in industry',     location: 'England' },
    // Technology (broad terms)
    { keywords: 'graduate software developer',                location: 'England' },
    { keywords: 'junior developer',                           location: 'England' },
    { keywords: 'graduate data analyst',                      location: 'England' },
    { keywords: 'graduate data scientist',                    location: 'England' },
    { keywords: 'graduate cyber security',                    location: 'England' },
    { keywords: 'IT graduate scheme',                         location: 'England' },
    // Business, Finance, Consulting
    { keywords: 'graduate accountant',                        location: 'England' },
    { keywords: 'graduate finance analyst',                   location: 'England' },
    { keywords: 'graduate business analyst',                  location: 'England' },
    { keywords: 'graduate management consultant',             location: 'England' },
    { keywords: 'graduate actuary auditor',                   location: 'England' },
    // Marketing, HR, Sales, Legal
    { keywords: 'graduate marketing',                         location: 'England' },
    { keywords: 'graduate HR recruitment',                    location: 'England' },
    { keywords: 'graduate sales',                             location: 'England' },
    { keywords: 'trainee solicitor paralegal graduate',       location: 'England' },
    // Other professional
    { keywords: 'graduate project manager',                   location: 'England' },
    { keywords: 'graduate supply chain logistics',            location: 'England' },
    { keywords: 'graduate quantity surveyor',                 location: 'England' },
    { keywords: 'graduate environmental consultant',          location: 'England' },
    { keywords: 'graduate healthcare',                        location: 'England' },
    // Catch-all broad searches (different locations for variety)
    { keywords: 'graduate scheme',                            location: 'London' },
    { keywords: 'graduate scheme',                            location: 'Manchester' },
    { keywords: 'graduate scheme',                            location: 'Birmingham' },
    { keywords: 'graduate scheme',                            location: 'Bristol' },
    { keywords: 'graduate scheme',                            location: 'Leeds' },
    { keywords: 'graduate scheme',                            location: 'Scotland' },
    { keywords: 'graduate trainee',                           location: 'England' },
    { keywords: 'graduate placement',                         location: 'England' },
    { keywords: 'graduate programme',                         location: 'England' },
    { keywords: 'year in industry placement',                 location: 'England' },
    { keywords: 'internship undergraduate',                   location: 'England' },
  ];

  // Reed (primary — each search pulls up to 100 results, runs in parallel batches)
  if (process.env.REED_API_KEY) {
    for (const s of REED_SEARCHES) {
      providerConfigs.push({
        adapter: 'reed',
        config: {
          apiKey: process.env.REED_API_KEY,
          keywords: s.keywords,
          location: s.location,
          maxResults: 100,
        },
      });
    }
  }

  // SerpApi (optional — expanded searches, still within 250/month free tier)
  if (process.env.SERPAPI_KEY) {
    const serpSearches = [
      { query: 'graduate engineer civil mechanical electrical UK',     location: 'United Kingdom' },
      { query: 'junior developer data analyst graduate UK',            location: 'United Kingdom' },
      { query: 'graduate scheme 2025 2026 UK',                        location: 'United Kingdom' },
      { query: 'graduate accountant finance business analyst UK',      location: 'United Kingdom' },
      { query: 'graduate marketing HR sales trainee UK',               location: 'United Kingdom' },
      { query: 'placement year internship undergraduate UK',           location: 'United Kingdom' },
    ];
    for (const s of serpSearches) {
      providerConfigs.push({
        adapter: 'serpapi',
        config: {
          apiKey: process.env.SERPAPI_KEY,
          query: s.query,
          location: s.location,
          maxResults: 30,
        },
      });
    }
  }

  // JobsPikr (optional) — expanded searches across more verticals
  if (process.env.JOBSPIKR_CLIENT_ID && process.env.JOBSPIKR_CLIENT_SECRET) {
    const jpSearches = [
      { query: 'graduate engineer civil mechanical electrical' },
      { query: 'junior developer data analyst software' },
      { query: 'graduate scheme trainee programme' },
      { query: 'graduate accountant finance business analyst' },
      { query: 'graduate marketing HR sales consultant' },
      { query: 'placement intern undergraduate year in industry' },
    ];
    for (const s of jpSearches) {
      providerConfigs.push({
        adapter: 'jobspikr',
        config: {
          clientId: process.env.JOBSPIKR_CLIENT_ID,
          clientSecret: process.env.JOBSPIKR_CLIENT_SECRET,
          query: s.query,
          country: 'United Kingdom',
          maxResults: 50,
        },
      });
    }
  }

  if (providerConfigs.length === 0) {
    const msg = 'No API keys configured. Set REED_API_KEY, SERPAPI_KEY, or JOBSPIKR credentials in functions/.env';
    console.error(`[jobSync] ${msg}`);
    summary.errors.push(msg);
    await updateSyncMeta(metaRef, summary, runStart);
    return summary;
  }

  // ── Step 3: Fetch from each provider (parallel batches for speed) ───────────
  let allJobs = [];
  const BATCH_CONCURRENCY = 8; // run 8 API calls at a time

  for (let i = 0; i < providerConfigs.length; i += BATCH_CONCURRENCY) {
    const batch = providerConfigs.slice(i, i + BATCH_CONCURRENCY);
    console.log(`[jobSync] Running batch ${Math.floor(i / BATCH_CONCURRENCY) + 1} (${batch.length} calls)...`);

    const results = await Promise.allSettled(
      batch.map(async ({ adapter, config }) => {
        const adapterObj = API_ADAPTERS[adapter];
        if (!adapterObj) return { name: 'unknown', jobs: [] };
        const jobs = await adapterObj.fetch(config);
        return { name: adapterObj.name, jobs, config };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { name, jobs } = result.value;
        console.log(`[jobSync] ${name} returned ${jobs.length} jobs`);
        allJobs = allJobs.concat(jobs);
        summary.providers.push({ name, count: jobs.length, status: 'ok' });
      } else {
        const errorMsg = `Provider failed: ${result.reason?.message || result.reason}`;
        console.error(`[jobSync] ${errorMsg}`);
        summary.errors.push(errorMsg);
        summary.providers.push({ name: 'unknown', count: 0, status: 'error', error: result.reason?.message });
      }
    }

    // Small delay between batches to be nice to APIs
    if (i + BATCH_CONCURRENCY < providerConfigs.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  if (allJobs.length === 0) {
    console.log('[jobSync] No jobs fetched from any provider');
    await updateSyncMeta(metaRef, summary, runStart);
    return summary;
  }

  // ── Step 4: Deduplicate against existing Firestore data ─────────────────────
  // Load all existing dedupeHashes in a single query (indexed field)
  const existingHashesSnapshot = await db.collection(JOBS_COLLECTION)
    .select('dedupeHash')
    .get();

  const existingHashes = new Set();
  existingHashesSnapshot.forEach((doc) => {
    if (doc.data().dedupeHash) existingHashes.add(doc.data().dedupeHash);
  });

  const newJobs = [];
  for (const job of allJobs) {
    if (existingHashes.has(job.dedupeHash)) {
      summary.skippedDuplicates += 1;
    } else {
      newJobs.push(job);
      existingHashes.add(job.dedupeHash); // prevent intra-batch dupes
    }
  }

  // ── Step 5: Batch-write new jobs to Firestore ──────────────────────────────
  if (newJobs.length > 0) {
    const now = admin.firestore.Timestamp.now();

    // Process in batches of BATCH_SIZE
    for (let i = 0; i < newJobs.length; i += BATCH_SIZE) {
      const chunk = newJobs.slice(i, i + BATCH_SIZE);
      const batch = db.batch();

      for (const job of chunk) {
        const ref = db.collection(JOBS_COLLECTION).doc(); // auto-ID
        batch.set(ref, {
          ...job,
          createdAt: now,
          updatedAt: now,
          syncedAt:  now,
        });
      }

      try {
        await batch.commit();
        summary.newJobs += chunk.length;
        console.log(`[jobSync] Wrote batch of ${chunk.length} jobs`);
      } catch (err) {
        const errorMsg = `Batch write failed: ${err.message}`;
        console.error(`[jobSync] ${errorMsg}`);
        summary.errors.push(errorMsg);
      }
    }
  }

  // ── Step 6: Expire stale jobs ───────────────────────────────────────────────
  try {
    const cutoff = admin.firestore.Timestamp.fromMillis(
      Date.now() - STALENESS_DAYS * 86400000
    );

    const staleSnapshot = await db.collection(JOBS_COLLECTION)
      .where('status', '==', 'active')
      .where('expiresAt', '<=', cutoff)
      .limit(BATCH_SIZE)
      .get();

    if (!staleSnapshot.empty) {
      const batch = db.batch();
      staleSnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          status: 'expired',
          updatedAt: admin.firestore.Timestamp.now(),
        });
      });
      await batch.commit();
      summary.expiredJobs = staleSnapshot.size;
      console.log(`[jobSync] Expired ${staleSnapshot.size} stale jobs`);
    }
  } catch (err) {
    console.error(`[jobSync] Expiry sweep error: ${err.message}`);
    summary.errors.push(`Expiry sweep: ${err.message}`);
  }

  // ── Step 7: Update sync metadata ───────────────────────────────────────────
  await updateSyncMeta(metaRef, summary, runStart);

  console.log(`[jobSync] Complete — ${summary.newJobs} new, ${summary.skippedDuplicates} dupes, ${summary.expiredJobs} expired, ${summary.errors.length} errors`);
  return summary;
}


/**
 * Update the sync metadata doc in api_cache.
 */
async function updateSyncMeta(metaRef, summary, runStart) {
  try {
    await metaRef.set({
      lastRunAt:   admin.firestore.Timestamp.now(),
      durationMs:  Date.now() - runStart,
      newJobs:     summary.newJobs,
      skippedDuplicates: summary.skippedDuplicates,
      expiredJobs: summary.expiredJobs,
      errorCount:  summary.errors.length,
      errors:      summary.errors.slice(0, 5), // Keep last 5 errors
      providers:   summary.providers,
      status:      summary.errors.length === 0 ? 'success' : 'partial_failure',
    }, { merge: true });
  } catch (err) {
    console.error(`[jobSync] Failed to update sync metadata: ${err.message}`);
  }
}


module.exports = {
  syncJobsFromApi,
  API_ADAPTERS,
  generateDedupeHash,
  normalizeReedJob,
  normalizeSerpApiJob,
  normalizeJobsPikrJob,
  JOBS_COLLECTION,
};
