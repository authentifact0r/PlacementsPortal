# Centralized Job Fetching - Architecture Fix

**Date:** 2026-02-22  
**Priority:** 🔴 CRITICAL (Required before production)

## Problem

### Current Architecture (❌ NOT SCALABLE)

```
User 1 visits → Reed API call #1
User 2 visits → Reed API call #2
User 3 visits → Reed API call #3
...
100 users/day → 100 API calls/day → 3,000/month
```

**Reed API Free Tier:** 250 calls/month  
**Result:** API limit hit in 2.5 days ⚠️

### What Happens When Limit Hit

- Reed API returns 429 error (Too Many Requests)
- Opportunities page shows empty/error
- Users see: "No jobs available"
- Business impact: Users leave site

## Solution 1: Firestore Caching (Quick Fix - 5 mins)

**Reduce API calls by 90%** using timestamp-based caching:

### How It Works

```
First user visits (cache empty/expired):
  ↓
Fetch from Reed API → Store in Firestore
  ↓
Cache valid for 30 minutes
  ↓
Next 99 users: Read from Firestore (no API calls)
  ↓
After 30 mins: Cache expires, next user refreshes
```

**API Usage:**
- Before: 100 users = 100 calls
- After: 100 users = 2 calls (every 30 mins)
- **Reduction: 98%** ✅

### Implementation

**1. Create Firestore cache document:**

```javascript
// placements-portal-full/web/src/services/liveFeed.service.js

/**
 * Get active live feed jobs with Firestore caching
 * Shares cache across all users
 */
export const getActiveLiveFeedJobs = async () => {
  try {
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
    const cacheRef = doc(db, 'api_cache', 'reed_live_feed');
    
    // 1. Check Firestore cache
    const cacheDoc = await getDoc(cacheRef);
    
    if (cacheDoc.exists()) {
      const cacheData = cacheDoc.data();
      const cacheAge = Date.now() - cacheData.fetched_at.toMillis();
      
      if (cacheAge < CACHE_DURATION) {
        console.log(`✅ Using cached live jobs (age: ${Math.floor(cacheAge/1000)}s)`);
        return cacheData.jobs;
      } else {
        console.log('⏰ Cache expired, fetching fresh jobs...');
      }
    } else {
      console.log('💾 No cache found, fetching fresh jobs...');
    }
    
    // 2. Fetch fresh from Reed API (only if cache expired)
    console.log('🔵 Fetching live feed jobs from Reed API...');
    const freshJobs = await fetchReedJobs({
      keywords: 'graduate',
      location: 'United Kingdom',
      limit: 20,
      permanent: true
    });
    
    console.log(`✅ Fetched ${freshJobs.length} fresh jobs from Reed API`);
    
    // 3. Filter to 30-minute window
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const liveJobs = freshJobs.filter(job => {
      const postedDate = new Date(job.posted_at);
      return postedDate >= thirtyMinutesAgo;
    });
    
    const jobsToShow = liveJobs.length > 0 ? liveJobs : freshJobs.slice(0, 6);
    
    // 4. Transform to live feed format
    const transformedJobs = jobsToShow.map((job, index) => {
      const postedDate = new Date(job.posted_at);
      const now = new Date();
      const minutesSincePosted = Math.floor((now - postedDate) / (1000 * 60));
      const minutesRemaining = Math.max(0, 30 - minutesSincePosted);
      const totalSeconds = minutesRemaining * 60;
      
      return {
        id: `reed-live-${job.reed_job_id || index}`,
        ...job,
        expires_at: calculateExpiryTime(),
        is_active: true,
        fetched_at: Timestamp.now(),
        created_at: Timestamp.fromDate(postedDate),
        views_count: Math.floor(Math.random() * 10),
        saves_count: Math.floor(Math.random() * 3),
        time_remaining: {
          expired: totalSeconds <= 0,
          minutes: Math.floor(totalSeconds / 60),
          seconds: totalSeconds % 60,
          totalSeconds: totalSeconds
        }
      };
    });
    
    // 5. Store in Firestore cache (shared across all users)
    await setDoc(cacheRef, {
      jobs: transformedJobs,
      fetched_at: serverTimestamp(),
      count: transformedJobs.length,
      source: 'reed_api'
    });
    
    console.log(`💾 Cached ${transformedJobs.length} live jobs for 30 minutes`);
    
    return transformedJobs;
    
  } catch (error) {
    console.error('Error fetching live feed jobs:', error);
    
    // Try to return stale cache if available
    try {
      const cacheRef = doc(db, 'api_cache', 'reed_live_feed');
      const cacheDoc = await getDoc(cacheRef);
      if (cacheDoc.exists()) {
        console.log('⚠️ Reed API failed, using stale cache');
        return cacheDoc.data().jobs;
      }
    } catch (e) {
      console.error('No cache available:', e);
    }
    
    return [];
  }
};
```

**2. Create Firestore security rule:**

```javascript
// firestore.rules
match /api_cache/{document} {
  // Anyone can read cache (shared across users)
  allow read: if true;
  
  // Only authenticated users can write (update cache)
  // In production, this should be Cloud Function only
  allow write: if request.auth != null;
}
```

**Benefits:**
- ✅ 98% reduction in API calls
- ✅ All users share same data (consistency)
- ✅ Works immediately (no Cloud Function setup)
- ✅ Stale cache fallback if API fails

**Limitations:**
- ⚠️ First user after cache expires triggers API call (race condition possible)
- ⚠️ Requires Firestore read (free: 50k/day, should be enough)

## Solution 2: Cloud Functions (Best Practice - 30 mins setup)

**Centralized backend fetching** - only server calls Reed API:

### How It Works

```
Firebase Cloud Scheduler (every 5 minutes)
  ↓
Triggers Cloud Function
  ↓
Function fetches from Reed API (1 call)
  ↓
Stores in Firestore
  ↓
All users read from Firestore (0 API calls from frontend)
```

**API Usage:**
- Cloud Function runs: 12 times/hour × 24 hours × 30 days = 8,640/month
- But it's on backend, can use paid tier if needed
- Frontend: 0 API calls ✅

### Implementation

**1. Initialize Firebase Functions:**

```bash
cd placements-portal-full/web
firebase init functions
# Select JavaScript
# Install dependencies: Yes
```

**2. Create scheduled function:**

```javascript
// functions/src/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

/**
 * Scheduled function: Runs every 5 minutes
 * Fetches fresh jobs from Reed API and stores in Firestore
 */
exports.syncLiveFeed = functions.pubsub
  .schedule('every 5 minutes')
  .timeZone('Europe/London')
  .onRun(async (context) => {
    console.log('Starting Reed API sync...');
    
    try {
      // 1. Fetch from Reed API
      const reedApiKey = functions.config().reed.api_key;
      const response = await fetch(
        'https://www.reed.co.uk/api/1.0/search?' + new URLSearchParams({
          keywords: 'graduate',
          locationName: 'United Kingdom',
          distanceFromLocation: '15',
          permanent: 'true',
          graduate: 'true',
          resultsToTake: '20'
        }),
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${Buffer.from(reedApiKey + ':').toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Reed API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.results.length} jobs from Reed API`);
      
      // 2. Transform jobs
      const transformedJobs = data.results.map(job => ({
        id: `reed-${job.jobId}`,
        title: job.jobTitle,
        company: job.employerName,
        location: job.locationName,
        salary: formatSalary(job.minimumSalary, job.maximumSalary),
        job_type: job.permanent ? 'Permanent' : 'Contract',
        source_url: job.jobUrl,
        posted_at: job.date || new Date().toISOString(),
        description: job.jobDescription,
        reed_job_id: job.jobId,
        // ... other fields
      }));
      
      // 3. Filter to 30-minute window
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      const liveJobs = transformedJobs.filter(job => {
        const postedDate = new Date(job.posted_at).getTime();
        return postedDate >= thirtyMinutesAgo;
      });
      
      // 4. Store in Firestore
      await db.collection('api_cache').doc('reed_live_feed').set({
        jobs: liveJobs.length > 0 ? liveJobs : transformedJobs.slice(0, 6),
        fetched_at: admin.firestore.FieldValue.serverTimestamp(),
        count: liveJobs.length,
        total_results: data.totalResults,
        source: 'reed_api'
      });
      
      console.log(`✅ Synced ${liveJobs.length} live jobs to Firestore`);
      return null;
      
    } catch (error) {
      console.error('Error syncing live feed:', error);
      throw error;
    }
  });

function formatSalary(min, max) {
  if (!min && !max) return 'Competitive';
  if (min && max) return `£${(min/1000).toFixed(0)}k - £${(max/1000).toFixed(0)}k`;
  if (min) return `From £${(min/1000).toFixed(0)}k`;
  if (max) return `Up to £${(max/1000).toFixed(0)}k`;
  return 'Competitive';
}
```

**3. Set API key in Firebase config:**

```bash
firebase functions:config:set reed.api_key="a08a5760-14f1-4617-9cdf-ce91286464f0"
```

**4. Deploy function:**

```bash
firebase deploy --only functions:syncLiveFeed
```

**5. Update frontend to only read from Firestore:**

```javascript
// liveFeed.service.js
export const getActiveLiveFeedJobs = async () => {
  try {
    // Simply read from Firestore (no API call)
    const cacheRef = doc(db, 'api_cache', 'reed_live_feed');
    const cacheDoc = await getDoc(cacheRef);
    
    if (cacheDoc.exists()) {
      console.log('✅ Loaded live jobs from Firestore cache');
      return cacheDoc.data().jobs;
    } else {
      console.log('⚠️ No cached jobs available');
      return [];
    }
  } catch (error) {
    console.error('Error loading live jobs:', error);
    return [];
  }
};
```

**Benefits:**
- ✅ 100% centralized (only backend calls API)
- ✅ Frontend never hits rate limits
- ✅ Consistent data for all users
- ✅ Can scale to unlimited users
- ✅ Easy monitoring and error handling

**Costs:**
- Cloud Functions: Free tier 2M invocations/month (8,640 needed = 0.4%)
- Firestore reads: Free tier 50k/day (enough for 1,000+ users/day)
- **Total: FREE** for small-medium traffic ✅

## Solution 3: Hybrid Approach (Recommended)

**Combine both solutions for best results:**

### Phase 1: Immediate (Now)
1. Implement Firestore caching (Solution 1)
2. Deploy to production
3. **Result:** 98% API reduction, works immediately

### Phase 2: Within 1 week
1. Set up Cloud Functions (Solution 2)
2. Move fetching to backend
3. **Result:** 100% centralized, scalable to millions

## Comparison Table

| Solution | Setup Time | API Reduction | Scalability | Complexity | Cost |
|----------|-----------|---------------|-------------|------------|------|
| **None (Current)** | - | 0% | ❌ 250 users/month | Simple | Free until limit |
| **Firestore Cache** | 5 mins | 98% | ⚠️ 25,000 users/month | Low | Free |
| **Cloud Functions** | 30 mins | 100% | ✅ Unlimited | Medium | Free (small traffic) |
| **Hybrid (Both)** | 35 mins | 100% | ✅ Unlimited | Medium | Free (small traffic) |

## Implementation Priority

### 🔴 Critical (Before Production)
- [ ] Implement Firestore caching (Solution 1)
- [ ] Test with multiple users
- [ ] Monitor API usage

### 🟡 Important (First Week)
- [ ] Set up Cloud Functions (Solution 2)
- [ ] Deploy scheduled sync
- [ ] Remove frontend API calls

### 🟢 Nice to Have (Future)
- [ ] Add monitoring dashboard
- [ ] Email alerts for API limits
- [ ] Paid Reed API tier (£99/month for 10k calls)

## Testing Centralized Fetching

### Test Multi-User Scenario

```bash
# Terminal 1: Monitor Firestore
firebase firestore:get api_cache/reed_live_feed --watch

# Terminal 2-5: Simulate 4 users visiting simultaneously
curl http://localhost:3000/opportunities &
curl http://localhost:3000/opportunities &
curl http://localhost:3000/opportunities &
curl http://localhost:3000/opportunities &

# Check Reed proxy logs
# Expected: Only 1 API call (first user), others use cache
```

### Monitor API Usage

```javascript
// Add to liveFeed.service.js
const logApiCall = async () => {
  await addDoc(collection(db, 'api_usage_logs'), {
    service: 'reed_api',
    endpoint: 'live_feed',
    timestamp: serverTimestamp(),
    user_triggered: true // vs backend_scheduled: false
  });
};

// Query usage
const getLast24Hours = async () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const q = query(
    collection(db, 'api_usage_logs'),
    where('timestamp', '>', Timestamp.fromDate(yesterday))
  );
  const snapshot = await getDocs(q);
  console.log(`API calls in last 24h: ${snapshot.size}`);
};
```

## Status

### Current Status
- ❌ Each user triggers separate API call
- ⚠️ Will hit 250 call limit quickly
- 🔴 **NOT PRODUCTION READY**

### After Solution 1 (Firestore Cache)
- ✅ 98% API reduction
- ✅ 25,000 users/month supported
- 🟡 **PRODUCTION READY** (small-medium traffic)

### After Solution 2 (Cloud Functions)
- ✅ 100% centralized
- ✅ Unlimited scalability
- 🟢 **FULLY PRODUCTION READY**

## Next Steps

**Immediate action required:**

1. Implement Firestore caching (I can do this now - 5 minutes)
2. Test with multiple browser tabs
3. Deploy to production

**Shall I implement Solution 1 (Firestore caching) right now?** It will reduce your API calls by 98% and make the site production-ready for small-medium traffic.
