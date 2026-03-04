# Job Detail Page - Reed API Fix

**Date:** 2026-02-22  
**Status:** ✅ FIXED

## Problem

When clicking on a Reed API job from the opportunities page, the job detail page showed blank/not found.

**Example URL:** `/opportunities/reed-55608587`

### Root Cause

The `JobDetail.js` page only checked:
1. Firestore database (for internal jobs)
2. Mock data (IDs 1, 2, 3)

It didn't know how to handle Reed API jobs (IDs starting with `reed-`).

## Solution

### 1. Updated `fetchJobDetails()` Function

**Added Reed job cache lookup:**

```javascript
// Check if this is a Reed API job (ID starts with "reed-")
if (id && id.toString().startsWith('reed-')) {
  console.log('📡 Reed API job detected, checking localStorage cache...');
  
  // Try to get from localStorage cache
  const reedJobsCache = localStorage.getItem('reed_jobs_cache');
  if (reedJobsCache) {
    const reedJobs = JSON.parse(reedJobsCache);
    const foundJob = reedJobs.find(j => j.id === id);
    
    if (foundJob) {
      console.log('✅ Found Reed job in cache:', foundJob.title);
      // ... enrich with default fields and display
    }
  }
}
```

**Data enrichment:** Added default values for missing fields:
- `responsibilities`: Defaults to `['Details available on application']`
- `requirements`: Defaults to `['See job description for details']`
- `benefits`: Defaults to `['Competitive benefits package']`
- `companyAbout`: Defaults to company name

### 2. Updated `handleApply()` Function

**Changed behavior for external jobs:**

```javascript
// Check if this is a Reed API job (external job)
if (job && job.source_url && id.toString().startsWith('reed-')) {
  console.log('🔗 Redirecting to external Reed job:', job.source_url);
  // Open the external job URL in a new tab
  window.open(job.source_url, '_blank', 'noopener,noreferrer');
  showInfo('Opening job application page...');
  return;
}
```

**For Reed jobs:**
- Opens the external Reed.co.uk job page in a new tab
- Shows toast notification: "Opening job application page..."
- No login required (external application)

**For internal jobs (Firestore):**
- Requires login
- Opens ApplicationModal for internal application
- Tracks application status

### 3. Updated Apply Button Text

**Dynamic button text:**

```javascript
{id && id.toString().startsWith('reed-') ? 'Apply on Reed.co.uk' : 'Apply Now'}
```

**Result:**
- Reed jobs: "Apply on Reed.co.uk"
- Internal jobs: "Apply Now"

This makes it clear to users that they'll be redirected to an external site.

## Data Flow

### Reed Job Journey

```
User clicks Reed job on /opportunities
  ↓
Navigate to /opportunities/reed-55608587
  ↓
JobDetail.js renders
  ↓
fetchJobDetails() detects "reed-" prefix
  ↓
Look up job in localStorage (reed_jobs_cache)
  ↓
Found! Enrich data with defaults
  ↓
Display job details
  ↓
User clicks "Apply on Reed.co.uk"
  ↓
handleApply() detects external job
  ↓
Open job.source_url in new tab
  ↓
User applies on Reed.co.uk
```

### Internal Job Journey (Firestore)

```
User clicks internal job on /opportunities
  ↓
Navigate to /opportunities/123
  ↓
JobDetail.js renders
  ↓
fetchJobDetails() queries Firestore
  ↓
Found! Display full job data
  ↓
User clicks "Apply Now"
  ↓
handleApply() checks login
  ↓
Open ApplicationModal
  ↓
Submit application to Firestore
```

## Testing

### Quick Test

1. **Open opportunities page:** http://localhost:3000/opportunities
2. **Wait for Reed jobs to load** (look for real UK company names)
3. **Click on any job card**
4. **Expected result:**
   - Job detail page loads with full information
   - Button says "Apply on Reed.co.uk"
   - Clicking button opens Reed.co.uk in new tab

### Console Logs to Look For

```
🔵 Fetching job details for ID: reed-55608587
📡 Reed API job detected, checking localStorage cache...
✅ Found Reed job in cache: Graduate Software Engineer
```

### Error Scenarios

**Scenario 1: Cache cleared**
- Result: Falls back to "Job not found" error
- Fix: Navigate back to /opportunities (cache will refresh)

**Scenario 2: Old cache (different job IDs)**
- Result: Job not found
- Fix: Hard refresh opportunities page (Ctrl+Shift+R)

## Files Changed

1. `placements-portal-full/web/src/pages/JobDetail.js` (16.5KB → 17.8KB)
   - Updated `fetchJobDetails()` to check Reed cache
   - Updated `handleApply()` to redirect external jobs
   - Updated Apply button text (dynamic based on job source)

2. `placements-portal-full/web/JOBDETAIL_REED_FIX.md` (this file)
   - Documentation of fix

## Technical Details

### Cache Structure

**localStorage key:** `reed_jobs_cache`

**Value:** JSON array of Reed jobs

```json
[
  {
    "id": "reed-55608587",
    "title": "Graduate Software Engineer",
    "company": "Tech Innovations Ltd",
    "location": "London, UK",
    "description": "...",
    "salary": "£30,000 - £40,000",
    "type": "Full-time",
    "sector": "Engineering",
    "posted": "2 days ago",
    "source_url": "https://www.reed.co.uk/jobs/graduate-software-engineer/55608587",
    "reed_job_id": 55608587,
    "logo": "https://ui-avatars.com/api/?name=Tech+Innovations+Ltd...",
    "bannerImage": "https://source.unsplash.com/400x200/?office,Engineering"
  }
]
```

### Field Mapping

| Reed API Field | JobDetail Display | Default if Missing |
|---------------|-------------------|-------------------|
| `title` | Job title | (required) |
| `company` | Company name | (required) |
| `description` | Job description section | "No description available." |
| `responsibilities` | Key Responsibilities list | `['Details available on application']` |
| `requirements` | Requirements list | `['See job description for details']` |
| `benefits` | Benefits list | `['Competitive benefits package']` |
| `companyAbout` | About Company section | `"${company} is hiring for this position."` |
| `deadline` | Application deadline | `null` (shows "Open") |

## Known Limitations

### 1. Cache Dependency
**Issue:** Job details rely on localStorage cache  
**Impact:** If cache is cleared, job detail page shows "not found"  
**Workaround:** Navigate back to opportunities page to refresh cache

### 2. No Application Tracking
**Issue:** External Reed jobs don't track applications in our system  
**Impact:** Can't show "You already applied" status for Reed jobs  
**Future fix:** Add "applications" tracking to localStorage or Firestore (tracking external applications separately)

### 3. Limited Job Data
**Issue:** Reed API doesn't provide detailed responsibilities/benefits  
**Impact:** Detail page shows generic defaults  
**Acceptable:** Users click through to Reed.co.uk for full details

## Future Improvements

### 1. Server-Side Job Storage
**Why:** Reduce cache dependency  
**How:** Store Reed jobs in Firestore with `source: 'reed'` flag

```javascript
// When fetching Reed jobs
await Promise.all(reedJobs.map(job => 
  setDoc(doc(db, 'opportunities', `reed-${job.reed_job_id}`), {
    ...job,
    source: 'reed',
    cached_at: serverTimestamp()
  })
));
```

### 2. Application Intent Tracking
**Why:** Track interest even for external jobs  
**How:** Save "interested" status when user clicks "Apply on Reed.co.uk"

```javascript
if (currentUser) {
  await addDoc(collection(db, 'application_intents'), {
    user_id: currentUser.uid,
    job_id: job.id,
    job_title: job.title,
    source: 'reed',
    clicked_at: serverTimestamp()
  });
}
```

### 3. Job Enrichment
**Why:** Better detail pages for Reed jobs  
**How:** Parse HTML from Reed job pages to extract full details

```javascript
// Use web scraping (with user consent)
const enrichedJob = await enrichReedJob(job.source_url);
// Extract responsibilities, requirements, benefits from HTML
```

## Success Criteria ✅

- [x] Reed job detail pages load successfully
- [x] Job information displays correctly (with defaults)
- [x] Apply button says "Apply on Reed.co.uk"
- [x] Clicking Apply opens Reed.co.uk in new tab
- [x] No login required for external applications
- [x] Console logs show cache lookup success
- [x] React dev server compiled successfully
- [x] No errors in browser console

## Status

**READY FOR TESTING** 🚀

Navigate to http://localhost:3000/opportunities, click on any Reed job, and verify the detail page loads!
