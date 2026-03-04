/**
 * Placement Portal — API Proxy Server
 * Proxies Reed and JSearch (LinkedIn/Indeed) requests to avoid CORS issues.
 *
 * Usage: node reed-proxy-server.js
 * Endpoints:
 *   GET /api/reed     — Reed UK Jobs API
 *   GET /api/jsearch  — JSearch (LinkedIn, Indeed, Glassdoor via RapidAPI)
 *   GET /health       — Health check
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');

const app  = express();
const PORT = process.env.PROXY_PORT || 3001;

app.use(cors());
app.use(express.json());

// ── API Keys ──────────────────────────────────────────────────────────────────
const REED_API_KEY    = process.env.REED_API_KEY    || '076efb18-542c-4f02-be4b-a85c64104e4d';
const RAPIDAPI_KEY    = process.env.REACT_APP_RAPIDAPI_KEY || '0652fc1e34mshc924e69768cf690p183bfbjsnb06487704beb';

// ── Reed endpoint ─────────────────────────────────────────────────────────────
app.get('/api/reed', async (req, res) => {
  try {
    console.log('\n🔵 [Reed] Request received:', req.query);

    const {
      keywords             = 'graduate',
      locationName         = 'United Kingdom',
      distanceFromLocation = '15',
      permanent            = 'true',
      graduate             = 'true',
      resultsToTake        = '20',
    } = req.query;

    const params = new URLSearchParams({
      keywords, locationName, distanceFromLocation,
      permanent, graduate, resultsToTake,
    });

    const url = `https://www.reed.co.uk/api/1.0/search?${params}`;
    console.log('📡 [Reed] Calling:', url);

    const authString = Buffer.from(`${REED_API_KEY}:`).toString('base64');
    const response   = await fetch(url, {
      headers: { 'Authorization': `Basic ${authString}`, 'Content-Type': 'application/json' },
    });

    console.log('📡 [Reed] Status:', response.status);

    if (!response.ok) {
      const err = await response.text();
      console.error('❌ [Reed] Error:', err);
      return res.status(response.status).json({ error: 'Reed API failed', details: err });
    }

    const data = await response.json();
    console.log(`✅ [Reed] ${data.totalResults} total results, returning ${data.results.length}`);
    res.json(data);

  } catch (err) {
    console.error('❌ [Reed] Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

// ── JSearch endpoint (LinkedIn / Indeed / Glassdoor via RapidAPI) ─────────────
app.get('/api/jsearch', async (req, res) => {
  try {
    console.log('\n🔵 [JSearch] Request received:', req.query);

    const {
      query       = 'graduate jobs United Kingdom',
      page        = '1',
      num_pages   = '1',
      date_posted = 'today',       // all | today | 3days | week | month
    } = req.query;

    const params = new URLSearchParams({ query, page, num_pages, date_posted });
    const url    = `https://jsearch.p.rapidapi.com/search?${params}`;
    console.log('📡 [JSearch] Calling:', url);

    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key':  RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    });

    console.log('📡 [JSearch] Status:', response.status);

    if (!response.ok) {
      const err = await response.text();
      console.error('❌ [JSearch] Error:', err);
      return res.status(response.status).json({ error: 'JSearch API failed', details: err });
    }

    const data = await response.json();
    const jobs  = data.data || [];

    // Filter to jobs posted within the last 60 minutes
    const sixtyMinsAgo = Date.now() - 60 * 60 * 1000;
    const freshJobs = jobs.filter(j => {
      if (!j.job_posted_at_datetime_utc) return true; // include if no timestamp
      return new Date(j.job_posted_at_datetime_utc).getTime() >= sixtyMinsAgo;
    });

    console.log(`✅ [JSearch] ${jobs.length} total jobs, ${freshJobs.length} posted in last 60 mins`);
    res.json({ data: freshJobs, total: freshJobs.length });

  } catch (err) {
    console.error('❌ [JSearch] Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status:   'ok',
    reed:     !!REED_API_KEY,
    jsearch:  !!RAPIDAPI_KEY,
    message:  'Proxy running — Reed ✅  JSearch/LinkedIn ✅',
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Reed endpoint:    http://localhost:${PORT}/api/reed`);
  console.log(`📡 JSearch endpoint: http://localhost:${PORT}/api/jsearch`);
  console.log(`🔑 Reed key:    ${REED_API_KEY.substring(0, 10)}...`);
  console.log(`🔑 RapidAPI key: ${RAPIDAPI_KEY.substring(0, 10)}...`);
});
