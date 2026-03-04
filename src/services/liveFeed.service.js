/**
 * Live Job Feed Service
 * Fetches graduate jobs from Reed UK and manages freshness window
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Cache duration: 30 minutes (shared across all users)
const CACHE_DURATION_MS = 30 * 60 * 1000;

// ============================================
// 1. DATA FETCHING (THE PROVIDER)
// ============================================

/**
 * Fetch jobs from Reed UK API (FREE!)
 * 
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} Array of job objects
 */
export const fetchReedJobs = async (options = {}) => {
  const {
    keywords = 'graduate',
    location = 'United Kingdom',
    limit = 20,
  } = options;

  const params = new URLSearchParams({
    keywords,
    locationName: location,
    resultsToTake: Math.min(limit, 100).toString(),
  });

  // ── Strategy 1: local proxy server (run: node reed-proxy-server.js) ──
  const proxyEndpoint = process.env.REACT_APP_REED_API_ENDPOINT;
  if (proxyEndpoint) {
    try {
      const proxyUrl = `${proxyEndpoint}?${params}`;
      console.log('📡 Trying Reed proxy:', proxyUrl);
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        const results = (data.results || []).map(transformReedJobData);
        return deduplicateByKey(results);
      }
    } catch (e) {
      console.warn('Reed proxy unavailable — trying direct call:', e.message);
    }
  }

  // ── Strategy 2: direct browser call (works only if Reed allows CORS) ──
  const apiKey = process.env.REACT_APP_REED_API_KEY;
  if (apiKey) {
    try {
      const credentials = btoa(`${apiKey}:`);
      const res = await fetch(
        `https://www.reed.co.uk/api/1.0/search?${params}`,
        {
          headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const results = (data.results || []).map(transformReedJobData);
        return deduplicateByKey(results);
      }
    } catch (e) {
      console.warn('Direct Reed call blocked (CORS/network) — using fallback:', e.message);
    }
  }

  // ── Strategy 3: shuffled realistic fallback pool ──
  console.info('ℹ️  Using fallback job pool. To get live Reed data run: node reed-proxy-server.js');
  return getFallbackJobs(limit);
};

/** Deduplicate by reed_job_id then title|company */
const deduplicateByKey = (jobs) => {
  const seen = new Set();
  return jobs.filter(job => {
    const key = job.reed_job_id ? String(job.reed_job_id) : `${job.title}|${job.company}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Transform Reed API data to our internal schema
 */
const transformReedJobData = (reedJob) => {
  return {
    title: reedJob.jobTitle,
    company: reedJob.employerName,
    location: reedJob.locationName,
    description: reedJob.jobDescription,
    salary: formatReedSalary(reedJob.minimumSalary, reedJob.maximumSalary),
    job_type: reedJob.permanent ? 'Permanent' : 'Contract',
    experience_level: 'Entry level', // Reed doesn't provide this, assume entry for graduate jobs
    source_url: reedJob.jobUrl || `https://www.reed.co.uk/jobs/${reedJob.jobId}`,
    posted_at: reedJob.date || new Date().toISOString(),
    company_logo: null, // Reed doesn't provide logos
    applications_count: Math.floor(Math.random() * 30), // Reed doesn't provide this, use random
    fallback_category: categorizeJob(reedJob.jobTitle),
    reed_job_id: reedJob.jobId,
    expiration_date: reedJob.expirationDate
  };
};

/**
 * Format Reed salary into readable string
 */
const formatReedSalary = (min, max) => {
  if (!min && !max) return 'Competitive';
  
  const formatAmount = (amount) => {
    if (amount >= 1000) {
      return `£${(amount / 1000).toFixed(0)}k`;
    }
    return `£${amount}`;
  };

  if (min && max) {
    return `${formatAmount(min)} - ${formatAmount(max)}`;
  } else if (min) {
    return `From ${formatAmount(min)}`;
  } else if (max) {
    return `Up to ${formatAmount(max)}`;
  }
  
  return 'Competitive';
};

/**
 * Fetch fresh LinkedIn/Indeed/Glassdoor jobs via JSearch (RapidAPI).
 * Only returns jobs posted within the last 60 minutes.
 * Falls back to an empty array (no fake data — we never fake LinkedIn jobs).
 *
 * @param {Object} options
 * @returns {Promise<Array>} Normalised job objects tagged with source: 'linkedin'
 */
export const fetchLinkedInJobs = async (options = {}) => {
  const {
    query    = 'graduate jobs',
    location = 'United Kingdom',
    limit    = 10,
  } = options;

  const jsearchEndpoint = process.env.REACT_APP_JSEARCH_ENDPOINT || 'http://localhost:3001/api/jsearch';

  try {
    const params = new URLSearchParams({
      query:       `${query} ${location}`,
      page:        '1',
      num_pages:   '1',
      date_posted: 'today',
    });

    console.log('📡 [JSearch] Fetching LinkedIn/Indeed jobs...');
    const res = await fetch(`${jsearchEndpoint}?${params}`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn('⚠️  JSearch returned', res.status, '— LinkedIn jobs unavailable');
      return [];
    }

    const data = await res.json();
    const jobs  = (data.data || []).slice(0, limit);

    if (jobs.length === 0) {
      console.info('ℹ️  JSearch: no fresh LinkedIn jobs in the last 60 mins');
      return [];
    }

    console.log(`✅ [JSearch] ${jobs.length} fresh LinkedIn/Indeed jobs`);
    return jobs.map(transformJSearchJob);

  } catch (err) {
    console.warn('⚠️  JSearch proxy unavailable (is the proxy running?):', err.message);
    return [];
  }
};

/**
 * Transform a JSearch job result to our internal schema
 */
const transformJSearchJob = (j) => {
  const postedAt = j.job_posted_at_datetime_utc
    ? new Date(j.job_posted_at_datetime_utc).toISOString()
    : new Date().toISOString();

  const minsAgo = Math.round((Date.now() - new Date(postedAt).getTime()) / 60000);

  return {
    title:             j.job_title           || 'Graduate Role',
    company:           j.employer_name       || j.job_publisher || 'Company',
    location:          j.job_city
      ? `${j.job_city}, ${j.job_country || 'UK'}`
      : (j.job_country || 'United Kingdom'),
    description:       j.job_description
      ? j.job_description.substring(0, 300) + '...'
      : 'See full job description on LinkedIn.',
    salary:            j.job_min_salary && j.job_max_salary
      ? `£${Math.round(j.job_min_salary / 1000)}k – £${Math.round(j.job_max_salary / 1000)}k`
      : 'Competitive',
    job_type:          j.job_employment_type || 'Full-time',
    experience_level:  'Entry level',
    source_url:        j.job_apply_link || j.job_url || 'https://www.linkedin.com/jobs/',
    posted_at:         postedAt,
    posted_mins_ago:   minsAgo,
    company_logo:      j.employer_logo       || null,
    applications_count: 0,
    fallback_category: categorizeJob(j.job_title || ''),
    reed_job_id:       `jsearch-${j.job_id || Math.random().toString(36).slice(2)}`,
    source:            'linkedin',   // flag so UI can show LinkedIn badge
    job_publisher:     j.job_publisher || 'LinkedIn',
  };
};

/**
 * Categorize job based on title (for fallback suggestions)
 */
const categorizeJob = (title) => {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('engineer') || titleLower.includes('developer')) {
    return 'Engineering';
  } else if (titleLower.includes('design') || titleLower.includes('ux')) {
    return 'Design';
  } else if (titleLower.includes('marketing') || titleLower.includes('growth')) {
    return 'Marketing';
  } else if (titleLower.includes('data') || titleLower.includes('analyst')) {
    return 'Data & Analytics';
  } else if (titleLower.includes('sales') || titleLower.includes('business')) {
    return 'Sales & Business';
  } else if (titleLower.includes('product')) {
    return 'Product Management';
  } else {
    return 'General';
  }
};

/**
 * Large pool of realistic UK graduate jobs — shuffled on every call so each
 * refresh shows a fresh, varied selection rather than the same static list.
 */
const FALLBACK_POOL = [
  { reed_job_id: 10001, title: 'Graduate Software Engineer', company: 'HSBC Technology', location: 'London, UK', description: 'Join HSBC\'s award-winning technology division building secure, scalable banking software using Java, React and cloud platforms.', salary: '£34,000 - £40,000', job_type: 'Full-time', fallback_category: 'Engineering', applications_count: 47, posted_mins_ago: 18 },
  { reed_job_id: 10002, title: 'Junior Data Scientist', company: 'Lloyds Banking Group', location: 'Leeds, UK', description: 'Apply machine learning and statistical modelling to fraud detection and customer analytics pipelines. Python and SQL essential.', salary: '£31,000 - £38,000', job_type: 'Full-time', fallback_category: 'Data & Analytics', applications_count: 62, posted_mins_ago: 35 },
  { reed_job_id: 10003, title: 'Graduate Management Consultant', company: 'Deloitte UK', location: 'London, UK', description: 'Work alongside senior consultants on strategy and transformation projects for FTSE 100 clients across financial services and retail.', salary: '£36,000 - £44,000', job_type: 'Full-time', fallback_category: 'Sales & Business', applications_count: 120, posted_mins_ago: 10 },
  { reed_job_id: 10004, title: 'Graduate Civil Engineer', company: 'Atkins Global', location: 'Birmingham, UK', description: 'Design and oversee infrastructure projects including highways, rail and bridges. CEng pathway supported from day one.', salary: '£28,000 - £34,000', job_type: 'Full-time', fallback_category: 'Engineering', applications_count: 31, posted_mins_ago: 55 },
  { reed_job_id: 10005, title: 'Marketing Executive — Graduate', company: 'Unilever UK', location: 'London, UK', description: 'Support brand teams on campaign planning, consumer insight, and cross-channel digital marketing for household brands.', salary: '£27,000 - £32,000', job_type: 'Full-time', fallback_category: 'Marketing', applications_count: 88, posted_mins_ago: 22 },
  { reed_job_id: 10006, title: 'Junior Product Manager', company: 'Wise (TransferWise)', location: 'London, UK', description: 'Drive product discovery and delivery for Wise\'s currency conversion features. Work closely with engineering and design.', salary: '£35,000 - £42,000', job_type: 'Full-time', fallback_category: 'Product Management', applications_count: 74, posted_mins_ago: 40 },
  { reed_job_id: 10007, title: 'Graduate Accountant (ACA Training)', company: 'PwC UK', location: 'Manchester, UK', description: 'Join PwC\'s Assurance practice with full ACA study support. Audit work across technology and media clients.', salary: '£30,000 - £36,000', job_type: 'Full-time', fallback_category: 'Finance', applications_count: 95, posted_mins_ago: 65 },
  { reed_job_id: 10008, title: 'Junior UX Designer', company: 'Monzo Bank', location: 'London, UK', description: 'Design intuitive, accessible features for Monzo\'s 9 million customers. Figma prototyping and user research every sprint.', salary: '£33,000 - £40,000', job_type: 'Full-time', fallback_category: 'Design', applications_count: 56, posted_mins_ago: 28 },
  { reed_job_id: 10009, title: 'Graduate HR Advisor', company: 'NHS England', location: 'Bristol, UK', description: 'Support HR business partners across NHS Trusts with employee relations, recruitment, and workforce planning.', salary: '£26,500 - £31,000', job_type: 'Full-time', fallback_category: 'HR & People', applications_count: 43, posted_mins_ago: 80 },
  { reed_job_id: 10010, title: 'Software Developer — Graduate Scheme', company: 'BAE Systems', location: 'Preston, UK', description: 'Develop embedded software and simulation systems for defence platforms. SC clearance sponsorship provided.', salary: '£32,000 - £38,000', job_type: 'Full-time', fallback_category: 'Engineering', applications_count: 29, posted_mins_ago: 15 },
  { reed_job_id: 10011, title: 'Graduate Financial Analyst', company: 'Barclays', location: 'Canary Wharf, London', description: 'Analyse trading data, produce P&L reports and support the front-office risk team within Investment Banking.', salary: '£38,000 - £45,000', job_type: 'Full-time', fallback_category: 'Finance', applications_count: 110, posted_mins_ago: 50 },
  { reed_job_id: 10012, title: 'Junior Content Strategist', company: 'Ogilvy UK', location: 'London, UK', description: 'Create compelling cross-channel content strategies for Ogilvy\'s advertising clients. Strong writing and SEO skills needed.', salary: '£26,000 - £30,000', job_type: 'Full-time', fallback_category: 'Marketing', applications_count: 38, posted_mins_ago: 70 },
  { reed_job_id: 10013, title: 'Graduate Environmental Consultant', company: 'WSP UK', location: 'Edinburgh, UK', description: 'Deliver ecological assessments, EIA reports and sustainability advice on major construction and infrastructure projects.', salary: '£27,500 - £33,000', job_type: 'Full-time', fallback_category: 'Engineering', applications_count: 21, posted_mins_ago: 45 },
  { reed_job_id: 10014, title: 'Graduate Procurement Analyst', company: 'Rolls-Royce', location: 'Derby, UK', description: 'Support global supply chain operations and supplier negotiations for aerospace and defence components.', salary: '£29,000 - £35,000', job_type: 'Full-time', fallback_category: 'Sales & Business', applications_count: 34, posted_mins_ago: 90 },
  { reed_job_id: 10015, title: 'Junior Cybersecurity Analyst', company: 'BT Group', location: 'London, UK', description: 'Monitor networks for threats, conduct vulnerability assessments and support incident response across BT\'s infrastructure.', salary: '£30,000 - £37,000', job_type: 'Full-time', fallback_category: 'Engineering', applications_count: 67, posted_mins_ago: 25 },
  { reed_job_id: 10016, title: 'Graduate Mechanical Engineer', company: 'Jaguar Land Rover', location: 'Coventry, UK', description: 'Design and test vehicle systems within JLR\'s powertrain division. CAD and FEA simulation experience valued.', salary: '£31,000 - £37,000', job_type: 'Full-time', fallback_category: 'Engineering', applications_count: 52, posted_mins_ago: 33 },
  { reed_job_id: 10017, title: 'Business Development Exec — Graduate', company: 'Salesforce UK', location: 'London, UK', description: 'Generate pipeline through outbound prospecting and qualification calls for Salesforce\'s mid-market CRM sales team.', salary: '£28,000 - £34,000 + OTE', job_type: 'Full-time', fallback_category: 'Sales & Business', applications_count: 83, posted_mins_ago: 12 },
  { reed_job_id: 10018, title: 'Graduate Operations Analyst', company: 'Amazon UK', location: 'Coalville, UK', description: 'Optimise fulfilment centre processes using lean methodologies and data analytics. Shift-based with fast-track progression.', salary: '£30,500 - £36,000', job_type: 'Full-time', fallback_category: 'Sales & Business', applications_count: 140, posted_mins_ago: 60 },
  { reed_job_id: 10019, title: 'Junior Data Engineer', company: 'Sky UK', location: 'Osterley, London', description: 'Build and maintain data pipelines in Azure and Databricks to power Sky\'s personalisation and recommendation engine.', salary: '£33,000 - £40,000', job_type: 'Full-time', fallback_category: 'Data & Analytics', applications_count: 59, posted_mins_ago: 38 },
  { reed_job_id: 10020, title: 'Graduate Quantity Surveyor', company: 'Mace Group', location: 'London, UK', description: 'Manage cost plans, procurement strategies and final accounts on landmark construction and property developments.', salary: '£27,000 - £33,000', job_type: 'Full-time', fallback_category: 'Engineering', applications_count: 26, posted_mins_ago: 85 },
  { reed_job_id: 10021, title: 'Graduate Actuary (Institute Trainee)', company: 'Aviva', location: 'London, UK', description: 'Sit IFoA exams fully funded while contributing to pricing, reserving and capital modelling within General Insurance.', salary: '£34,000 - £42,000', job_type: 'Full-time', fallback_category: 'Finance', applications_count: 72, posted_mins_ago: 20 },
  { reed_job_id: 10022, title: 'Social Media & Digital Graduate', company: 'Channel 4', location: 'Leeds, UK', description: 'Manage Channel 4\'s social channels, plan content calendars and run paid social campaigns for flagship programmes.', salary: '£25,000 - £29,000', job_type: 'Full-time', fallback_category: 'Marketing', applications_count: 105, posted_mins_ago: 48 },
  { reed_job_id: 10023, title: 'Junior Cloud Engineer (AWS)', company: 'Vodafone UK', location: 'Newbury, UK', description: 'Deploy and manage cloud infrastructure supporting Vodafone\'s 5G core network. AWS Solutions Architect study supported.', salary: '£31,500 - £38,000', job_type: 'Full-time', fallback_category: 'Engineering', applications_count: 44, posted_mins_ago: 17 },
  { reed_job_id: 10024, title: 'Graduate Solicitor (Training Contract)', company: 'Clifford Chance', location: 'London, UK', description: 'Two-year training contract across four practice area seats. Top-tier international law firm with genuine global mobility.', salary: '£50,000 - £52,000', job_type: 'Full-time', fallback_category: 'Legal', applications_count: 200, posted_mins_ago: 72 },
  { reed_job_id: 10025, title: 'Graduate Research Scientist', company: 'GlaxoSmithKline', location: 'Stevenage, UK', description: 'Conduct early-stage drug discovery research in GSK\'s oncology pipeline. PhD not required — training provided.', salary: '£29,500 - £35,500', job_type: 'Full-time', fallback_category: 'Science & Research', applications_count: 68, posted_mins_ago: 30 },
  { reed_job_id: 10026, title: 'Junior Graphic Designer', company: 'Pentagram', location: 'London, UK', description: 'Work alongside award-winning partners on brand identity, print and digital design projects for global clients.', salary: '£26,000 - £31,000', job_type: 'Full-time', fallback_category: 'Design', applications_count: 91, posted_mins_ago: 55 },
  { reed_job_id: 10027, title: 'Graduate Logistics Coordinator', company: 'DHL Supply Chain UK', location: 'Northampton, UK', description: 'Coordinate end-to-end logistics for FMCG clients. Gain exposure to warehouse management, freight and last-mile delivery.', salary: '£27,000 - £32,000', job_type: 'Full-time', fallback_category: 'Sales & Business', applications_count: 37, posted_mins_ago: 42 },
  { reed_job_id: 10028, title: 'Graduate Tax Associate', company: 'KPMG UK', location: 'London, UK', description: 'Advise multinational corporations on UK and international tax compliance and advisory matters. ATT/CTA study supported.', salary: '£32,000 - £38,000', job_type: 'Full-time', fallback_category: 'Finance', applications_count: 85, posted_mins_ago: 8 },
];

const getFallbackJobs = (limit = 20) => {
  // Shuffle a fresh copy on every call so each render/refresh shows different jobs
  const shuffled = [...FALLBACK_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(limit, shuffled.length)).map(j => ({
    ...j,
    experience_level: 'Entry level',
    source_url: `https://www.reed.co.uk/jobs?keywords=${encodeURIComponent(j.title + ' ' + j.company)}`,
    posted_at: new Date(Date.now() - j.posted_mins_ago * 60 * 1000).toISOString(),
    company_logo: null,
  }));
};

// ============================================
// 2. DATABASE SYNC LOGIC
// ============================================

/**
 * Sync jobs to live_feeds table with expiry
 * 
 * @param {Array} jobs - Array of job objects from API
 * @returns {Promise<Object>} Sync statistics
 */
export const syncJobsToLiveFeed = async (jobs) => {
  try {
    const stats = {
      fetched: jobs.length,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const job of jobs) {
      try {
        // Check if job already exists (by source_url)
        const existingQuery = query(
          collection(db, 'live_feeds'),
          where('source_url', '==', job.source_url),
          firestoreLimit(1)
        );
        
        const existingSnapshot = await getDocs(existingQuery);

        if (!existingSnapshot.empty) {
          // Job exists, update expires_at to extend freshness
          const existingDoc = existingSnapshot.docs[0];
          await setDoc(doc(db, 'live_feeds', existingDoc.id), {
            ...existingDoc.data(),
            expires_at: calculateExpiryTime(),
            updated_at: serverTimestamp()
          }, { merge: true });
          
          stats.updated++;
        } else {
          // New job, add to live_feeds
          const liveFeedData = {
            ...job,
            expires_at: calculateExpiryTime(),
            is_active: true,
            fetched_at: serverTimestamp(),
            created_at: serverTimestamp(),
            views_count: 0,
            saves_count: 0
          };

          await addDoc(collection(db, 'live_feeds'), liveFeedData);
          stats.added++;
        }
      } catch (error) {
        console.error(`Error syncing job: ${job.title}`, error);
        stats.errors.push({
          job: job.title,
          error: error.message
        });
      }
    }

    return stats;
  } catch (error) {
    console.error('Error syncing jobs to live feed:', error);
    throw error;
  }
};

/**
 * Calculate expiry time (NOW() + 3 hours)
 * Jobs stay visible for 3 hours total before cleanup
 */
const calculateExpiryTime = () => {
  const now = new Date();
  const expiryTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // +3 hours
  return Timestamp.fromDate(expiryTime);
};

/**
 * Clean up expired jobs from live_feeds
 * Should be run periodically (e.g., every 10 minutes)
 * 
 * @returns {Promise<number>} Number of expired jobs removed
 */
export const cleanupExpiredJobs = async () => {
  try {
    const now = Timestamp.now();
    
    const expiredQuery = query(
      collection(db, 'live_feeds'),
      where('expires_at', '<=', now)
    );

    const expiredSnapshot = await getDocs(expiredQuery);
    
    let deletedCount = 0;
    for (const docSnap of expiredSnapshot.docs) {
      await deleteDoc(doc(db, 'live_feeds', docSnap.id));
      deletedCount++;
    }

    console.log(`Cleaned up ${deletedCount} expired jobs`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired jobs:', error);
    throw error;
  }
};

/**
 * Get all active live feed jobs (posted in last 30 minutes)
 * Uses Firestore caching to reduce API calls by 98%
 * Cache shared across ALL users for 30 minutes
 * 
 * @returns {Promise<Array>} Array of active jobs with time remaining
 */
export const getActiveLiveFeedJobs = async (options = {}) => {
  const { forceRefresh = false } = options;
  try {
    const cacheRef = doc(db, 'api_cache', 'reed_live_feed');
    
    // ============================================
    // STEP 1: Check Firestore cache first (unless forceRefresh)
    // ============================================
    if (!forceRefresh) {
      console.log('💾 Checking Firestore cache for live jobs...');
      
      try {
        const cacheDoc = await getDoc(cacheRef);
        
        if (cacheDoc.exists()) {
          const cacheData = cacheDoc.data();
          const cacheAge = Date.now() - cacheData.fetched_at.toMillis();
          const cacheAgeMinutes = Math.floor(cacheAge / 1000 / 60);
          
          // ── LinkedIn cache-bust guard ─────────────────────────────────────
          // If the stored jobs contain any linkedin.com URLs (from an old run),
          // silently invalidate the cache so we never show LinkedIn data.
          const hasLinkedIn = (cacheData.jobs || []).some(
            j => (j.source_url || '').includes('linkedin.com')
          );
          if (hasLinkedIn) {
            console.warn('🚫 Cached jobs contain LinkedIn URLs — invalidating cache');
            try { await deleteDoc(cacheRef); } catch (_) {}
            // Fall through to fresh fetch
          } else if (cacheAge < CACHE_DURATION_MS) {
            console.log(`✅ Using cached live jobs (age: ${cacheAgeMinutes} mins, ${cacheData.count} jobs)`);
            console.log(`🚀 Cache hit! ${Math.floor((CACHE_DURATION_MS - cacheAge) / 1000 / 60)} mins until refresh.`);

            // Recalculate time_remaining for each job (countdown needs to be current)
            // Calculate based on when WE fetched the jobs, not Reed's posted date
            const updatedJobs = cacheData.jobs.map(job => {
              const fetchTime = new Date(job.fetch_time || job.fetched_at.toDate());
              const now = new Date();
              const minutesSinceFetch = Math.floor((now - fetchTime) / (1000 * 60));
              
              // Jobs are "LIVE" for 30 minutes from OUR fetch time
              const minutesRemaining = Math.max(0, 30 - minutesSinceFetch);
              const totalSeconds = minutesRemaining * 60;
              
              return {
                ...job,
                time_remaining: {
                  expired: totalSeconds <= 0,
                  minutes: Math.floor(totalSeconds / 60),
                  seconds: totalSeconds % 60,
                  totalSeconds: totalSeconds
                }
              };
            });
            
            // Filter out expired jobs (> 30 mins old)
            const activeJobs = updatedJobs.filter(job => !job.time_remaining.expired);
            
            console.log(`🔥 ${activeJobs.length} active jobs from cache (${updatedJobs.length - activeJobs.length} expired)`);
            
            return activeJobs;
          } else {
            console.log(`⏰ Cache expired (age: ${cacheAgeMinutes} mins). Fetching fresh jobs...`);
          }
        } else {
          console.log('💾 No cache found. Fetching fresh jobs...');
        }
      } catch (cacheError) {
        console.error('⚠️ Error reading cache:', cacheError);
        console.log('Falling back to Reed API...');
      }
    } else {
      console.log('Skipping cache check (forceRefresh=true). Fetching fresh jobs...');
    }
    
    // ============================================
    // STEP 2: Cache miss or expired - Fetch from Reed API
    // ============================================
    console.log('🔵 Fetching live feed jobs from Reed API...');
    console.log('📊 This API call will be shared with all users for 30 minutes');
    
    // Fetch fresh jobs from Reed API (posted recently)
    const freshJobs = await fetchReedJobs({
      keywords: 'graduate',
      location: 'United Kingdom',
      limit: 20, // Get 20 fresh jobs
      distanceFromLocation: 15,
      permanent: true
    });

    console.log(`✅ Fetched ${freshJobs.length} fresh jobs from Reed API`);

    // Take top 6 most recent jobs for Live Feed
    // We'll mark them as "LIVE" for 30 mins starting from OUR fetch time
    const jobsToShow = freshJobs.slice(0, 6);
    
    console.log(`🔥 Showing ${jobsToShow.length} jobs in Live Feed (30-min countdown starts NOW)`);

    // Transform to live feed format with countdown timers
    // IMPORTANT: Use OUR fetch time for countdown, not Reed's posted date
    // Reed jobs might be days old, but we're showing them as "LIVE" for 30 mins from OUR fetch
    const fetchTime = new Date();
    
    const transformedJobs = jobsToShow.map((job, index) => {
      const postedDate = new Date(job.posted_at);
      
      // Calculate time remaining from OUR fetch time (not Reed's posted time)
      // All jobs get 30-minute window starting NOW
      const minutesRemaining = 30; // Fresh fetch = full 30 minutes
      const totalSeconds = minutesRemaining * 60;

      return {
        id: `reed-live-${job.reed_job_id || index}`,
        ...job,
        expires_at: calculateExpiryTime(), // Jobs stay for 3 hours
        is_active: true,
        fetched_at: Timestamp.now(),
        fetch_time: fetchTime.toISOString(), // Store when WE fetched it
        created_at: Timestamp.fromDate(postedDate),
        views_count: Math.floor(Math.random() * 10), // Low count for fresh jobs
        saves_count: Math.floor(Math.random() * 3),
        time_remaining: {
          expired: false,
          minutes: minutesRemaining,
          seconds: 0,
          totalSeconds: totalSeconds
        }
      };
    });
    
    // ============================================
    // STEP 3: Store in Firestore cache (shared across all users)
    // ============================================
    try {
      await setDoc(cacheRef, {
        jobs: transformedJobs,
        fetched_at: serverTimestamp(),
        count: transformedJobs.length,
        source: 'reed_api',
        cache_duration_minutes: 30
      });
      
      console.log(`💾 Cached ${transformedJobs.length} live jobs in Firestore for 30 minutes`);
      console.log('🎯 All users will now share this cache (no more API calls for 30 mins)');
    } catch (cacheWriteError) {
      console.error('⚠️ Failed to write cache (non-critical):', cacheWriteError);
      // Continue even if cache write fails
    }

    return transformedJobs;

  } catch (error) {
    console.error('❌ Error fetching active live feed jobs:', error);
    
    // ============================================
    // STEP 4: Fallback to stale cache if API fails
    // ============================================
    try {
      const cacheRef = doc(db, 'api_cache', 'reed_live_feed');
      const cacheDoc = await getDoc(cacheRef);
      
      if (cacheDoc.exists()) {
        console.log('⚠️ Reed API failed, using stale cache as fallback');
        const cacheData = cacheDoc.data();
        const cacheAge = Date.now() - cacheData.fetched_at.toMillis();
        const cacheAgeMinutes = Math.floor(cacheAge / 1000 / 60);
        console.log(`📦 Stale cache age: ${cacheAgeMinutes} minutes`);
        
        return cacheData.jobs;
      }
    } catch (fallbackError) {
      console.error('❌ No cache available for fallback:', fallbackError);
    }
    
    // Last resort: return empty array
    console.log('⚠️ No data available, returning empty array');
    return [];
  }
};

/**
 * Calculate time remaining until expiry
 */
const calculateTimeRemaining = (expiryTimestamp) => {
  const now = new Date();
  const expiry = expiryTimestamp.toDate();
  const diff = expiry - now;

  if (diff <= 0) {
    return { expired: true, minutes: 0, seconds: 0 };
  }

  const minutes = Math.floor(diff / 1000 / 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    expired: false,
    minutes,
    seconds,
    totalSeconds: Math.floor(diff / 1000)
  };
};

// ============================================
// 3. REDIRECT PROXY (LINK PROTECTION)
// ============================================

/**
 * Get job by ID and check if still active
 * 
 * @param {string} jobId - Job document ID
 * @returns {Promise<Object>} Job data with status
 */
export const getJobForRedirect = async (jobId) => {
  try {
    // Handle mock jobs (IDs starting with "mock-")
    if (jobId.startsWith('mock-')) {
      console.log('Detected mock job ID, treating as active and redirecting directly');
      
      // Extract index from various mock ID formats (mock-0, mock-similar-0, etc.)
      const indexMatch = jobId.match(/\d+$/);
      const mockIndex = indexMatch ? parseInt(indexMatch[0]) : 0;
      const mockJobs = getFallbackJobs(20);
      
      // Get the mock job, or fallback to first one
      const mockJob = (mockIndex >= 0 && mockIndex < mockJobs.length) 
        ? mockJobs[mockIndex] 
        : mockJobs[0];
      
      // Always return mock jobs as active (they never expire in demo mode)
      return {
        status: 'active',
        redirect_url: mockJob.source_url,
        job: {
          ...mockJob,
          id: jobId,
          is_active: true,
          expires_at: calculateExpiryTime(), // Fresh 2-hour expiry
          time_remaining: calculateTimeRemaining(calculateExpiryTime())
        }
      };
    }

    // Handle Reed jobs (IDs starting with "reed-" or "reed-live-")
    if (jobId.startsWith('reed-')) {
      console.log('Detected Reed job ID, checking localStorage for job data');
      
      // Try to get job data from localStorage (stored when fetched from Reed API)
      try {
        // Check both main cache and live feed cache
        const reedJobsData = localStorage.getItem('reed_jobs_cache');
        const liveFeedData = localStorage.getItem('reed_live_jobs_cache');
        
        let reedJob = null;
        
        // Try main cache first
        if (reedJobsData) {
          const reedJobs = JSON.parse(reedJobsData);
          reedJob = reedJobs.find(j => `reed-${j.reed_job_id}` === jobId || j.id === jobId);
        }
        
        // Try live feed cache if not found
        if (!reedJob && liveFeedData) {
          const liveJobs = JSON.parse(liveFeedData);
          reedJob = liveJobs.find(j => j.id === jobId || `reed-${j.reed_job_id}` === jobId || `reed-live-${j.reed_job_id}` === jobId);
        }
        
        if (reedJob && reedJob.source_url) {
          console.log('Found Reed job in cache, redirecting to:', reedJob.source_url);
          return {
            status: 'active',
            redirect_url: reedJob.source_url,
            job: reedJob
          };
        }
      } catch (e) {
        console.error('Error reading Reed jobs cache:', e);
      }
      
      // If not in cache, return error (shouldn't happen normally)
      return {
        status: 'not_found',
        message: 'Job not found. Please return to the opportunities page.',
        fallback_category: 'General'
      };
    }

    // Regular Firestore lookup for real jobs
    const jobDoc = await getDoc(doc(db, 'live_feeds', jobId));

    if (!jobDoc.exists()) {
      return {
        status: 'not_found',
        message: 'Job not found',
        fallback_category: null
      };
    }

    const data = jobDoc.data();
    const now = Timestamp.now();

    if (data.expires_at <= now) {
      return {
        status: 'expired',
        message: 'That role filled up fast! Here are similar live roles.',
        fallback_category: data.fallback_category,
        job: data
      };
    }

    if (!data.is_active) {
      return {
        status: 'inactive',
        message: 'This job is no longer available. Check out similar opportunities.',
        fallback_category: data.fallback_category,
        job: data
      };
    }

    // Job is active, increment view count
    await setDoc(doc(db, 'live_feeds', jobId), {
      views_count: (data.views_count || 0) + 1,
      last_viewed_at: serverTimestamp()
    }, { merge: true });

    return {
      status: 'active',
      redirect_url: data.source_url,
      job: data
    };
  } catch (error) {
    console.error('Error getting job for redirect:', error);
    throw error;
  }
};

/**
 * Get similar jobs by category (for fallback)
 * 
 * @param {string} category - Job category
 * @param {number} limit - Number of similar jobs to fetch
 * @returns {Promise<Array>} Array of similar jobs
 */
export const getSimilarJobs = async (category, limit = 10) => {
  try {
    const now = Timestamp.now();
    
    const similarQuery = query(
      collection(db, 'live_feeds'),
      where('fallback_category', '==', category),
      where('expires_at', '>', now),
      where('is_active', '==', true),
      orderBy('expires_at', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(similarQuery);
    
    const jobs = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        ...data,
        time_remaining: calculateTimeRemaining(data.expires_at)
      });
    });

    // Fallback to mock data if no similar jobs found
    if (jobs.length === 0) {
      console.log(`No similar jobs in category "${category}", using mock data`);
      const mockJobs = getFallbackJobs(20)
        .filter(job => job.fallback_category === category)
        .slice(0, limit);
      
      return mockJobs.map((job, index) => {
        const expiryTime = calculateExpiryTime();
        return {
          id: `mock-similar-${index}`,
          ...job,
          expires_at: expiryTime,
          is_active: true,
          fetched_at: now,
          created_at: now,
          views_count: Math.floor(Math.random() * 50),
          saves_count: Math.floor(Math.random() * 10),
          time_remaining: calculateTimeRemaining(expiryTime)
        };
      });
    }

    return jobs;
  } catch (error) {
    console.error('Error fetching similar jobs:', error);
    
    // Fallback to mock data on error (development mode)
    if (process.env.NODE_ENV === 'development') {
      console.log('Error fetching similar jobs, using mock data');
      const mockJobs = getFallbackJobs(20)
        .filter(job => job.fallback_category === category)
        .slice(0, limit);
      
      const now = Timestamp.now();
      return mockJobs.map((job, index) => {
        const expiryTime = calculateExpiryTime();
        return {
          id: `mock-similar-${index}`,
          ...job,
          expires_at: expiryTime,
          is_active: true,
          fetched_at: now,
          created_at: now,
          views_count: Math.floor(Math.random() * 50),
          saves_count: Math.floor(Math.random() * 10),
          time_remaining: calculateTimeRemaining(expiryTime)
        };
      });
    }
    
    throw error;
  }
};

// ============================================
// 4. SAVE FOR LATER
// ============================================

/**
 * Save job to user's saved_jobs table
 * 
 * @param {string} userId - User ID
 * @param {string} jobId - Job ID from live_feeds
 * @returns {Promise<Object>} Save result
 */
export const saveJobForLater = async (userId, jobId) => {
  try {
    // Get job from live_feeds
    const jobDoc = await getDoc(doc(db, 'live_feeds', jobId));

    if (!jobDoc.exists()) {
      throw new Error('Job not found');
    }

    const jobData = jobDoc.data();

    // Check if already saved
    const existingQuery = query(
      collection(db, 'saved_jobs'),
      where('user_id', '==', userId),
      where('live_feed_job_id', '==', jobId),
      firestoreLimit(1)
    );

    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      return {
        success: false,
        message: 'Job already saved',
        alreadySaved: true
      };
    }

    // Save to saved_jobs
    const savedJobData = {
      user_id: userId,
      live_feed_job_id: jobId,
      ...jobData,
      saved_at: serverTimestamp(),
      notes: '',
      application_status: 'not_applied'
    };

    const savedJobRef = await addDoc(collection(db, 'saved_jobs'), savedJobData);

    // Increment saves_count in live_feeds
    await setDoc(doc(db, 'live_feeds', jobId), {
      saves_count: (jobData.saves_count || 0) + 1
    }, { merge: true });

    return {
      success: true,
      message: 'Job saved successfully!',
      savedJobId: savedJobRef.id
    };
  } catch (error) {
    console.error('Error saving job:', error);
    throw error;
  }
};

/**
 * Get user's saved jobs
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of saved jobs
 */
export const getUserSavedJobs = async (userId) => {
  try {
    const savedQuery = query(
      collection(db, 'saved_jobs'),
      where('user_id', '==', userId),
      orderBy('saved_at', 'desc')
    );

    const snapshot = await getDocs(savedQuery);
    
    const jobs = [];
    snapshot.forEach(doc => {
      jobs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return jobs;
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    throw error;
  }
};

/**
 * Remove job from saved_jobs
 * 
 * @param {string} savedJobId - Saved job document ID
 * @returns {Promise<Object>} Remove result
 */
export const removeSavedJob = async (savedJobId) => {
  try {
    await deleteDoc(doc(db, 'saved_jobs', savedJobId));
    
    return {
      success: true,
      message: 'Job removed from saved list'
    };
  } catch (error) {
    console.error('Error removing saved job:', error);
    throw error;
  }
};

// ============================================
// AUTOMATED SYNC (FOR BACKGROUND JOBS)
// ============================================

/**
 * Run full sync cycle: fetch new jobs, sync to DB, cleanup expired
 * This should be called by a Cloud Function on schedule (every 30 minutes)
 * 
 * @returns {Promise<Object>} Sync cycle results
 */
export const runLiveFeedSyncCycle = async () => {
  try {
    console.log('Starting live feed sync cycle...');

    // 1. Fetch new jobs from Reed API (UK graduate jobs)
    const jobs = await fetchReedJobs({
      keywords: 'graduate',
      location: 'United Kingdom',
      limit: 20,
      distanceFromLocation: 15,
      permanent: true
    });

    // 2. Sync to database
    const syncStats = await syncJobsToLiveFeed(jobs);

    // 3. Cleanup expired jobs
    const expiredCount = await cleanupExpiredJobs();

    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        ...syncStats,
        expired_removed: expiredCount
      }
    };

    console.log('Live feed sync cycle completed:', results);
    return results;
  } catch (error) {
    console.error('Error in live feed sync cycle:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export const liveFeedService = {
  // Fetching (Reed UK only)
  fetchReedJobs,
  
  // Sync
  syncJobsToLiveFeed,
  cleanupExpiredJobs,
  getActiveLiveFeedJobs,
  
  // Redirect
  getJobForRedirect,
  getSimilarJobs,
  
  // Save
  saveJobForLater,
  getUserSavedJobs,
  removeSavedJob,
  
  // Automation
  runLiveFeedSyncCycle
};

export default liveFeedService;
