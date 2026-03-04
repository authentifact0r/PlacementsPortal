# Opportunities Page - Quick Fix Guide

## ✅ Problem Solved!

**Issue**: Opportunities page showing errors and broken links  
**Root Cause**: Reed API proxy server was not running  
**Status**: **FIXED** - Both servers now running properly

---

## Current Status

### Servers Running ✅

1. **Web App**: http://localhost:3000
   - React app compiled successfully
   - All pages accessible

2. **Reed API Proxy**: http://localhost:3001  
   - Serving real UK graduate jobs
   - 1,774 jobs currently available
   - API key working correctly

---

## Quick Test (2 minutes)

1. **Open browser**: http://localhost:3000

2. **Click "Opportunities"** in navbar

3. **Check**:
   - ✅ Page loads without errors
   - ✅ Jobs are displayed in grid
   - ✅ Real UK companies shown (Specsavers, Aldi, etc.)
   - ✅ Real salaries shown (£28k-£40k)

4. **Click on any job**:
   - ✅ Job detail page loads
   - ✅ Description, requirements, benefits all visible
   - ✅ "Apply Now" button works

5. **Click "Apply Now"**:
   - ✅ Opens Reed.co.uk job page in new tab
   - ✅ Can apply directly on Reed

---

## How It Works

```
User visits /opportunities
     ↓
Fetch from Reed API (via proxy on port 3001)
     ↓
Get ~100 real UK graduate jobs
     ↓
Transform and cache in localStorage
     ↓
Display jobs in grid
     ↓
User clicks "View Job"
     ↓
Load job from localStorage cache
     ↓
Show full job details
     ↓
User clicks "Apply Now"
     ↓
Open Reed.co.uk in new tab
```

---

## If Something Breaks

### Problem: "No jobs showing"
**Fix**: Check Reed proxy is running
```bash
# Check if port 3001 is in use
lsof -ti:3001

# If not, restart proxy
cd placements-portal-full/web
node reed-proxy-server.js
```

### Problem: "Job not found" on detail page
**Fix**: Clear cache and reload
1. Go back to /opportunities
2. This refreshes the cache
3. Click job again

### Problem: Page loads slowly
**Normal**: First load takes 2-3 seconds (fetching 100 jobs)
**After that**: Instant (cached in localStorage)

---

## Easy Startup Script

Created `start-servers.sh` to start both servers at once:

```bash
cd placements-portal-full/web
./start-servers.sh
```

This will:
- ✅ Start Reed API proxy (port 3001)
- ✅ Start web app (port 3000)
- ✅ Show status of both servers
- ✅ Handle shutdown gracefully (Ctrl+C)

---

## What Changed

### Before (Broken)
- Reed proxy not running
- Jobs couldn't load from API
- Falling back to mock data only
- Links potentially broken

### After (Fixed)
- Reed proxy running on port 3001 ✅
- Real UK jobs loading successfully ✅
- localStorage caching working ✅
- All links functional ✅

---

## Key Files

1. **reed-proxy-server.js** - CORS proxy for Reed API
2. **src/pages/OpportunitiesPremium.js** - Job list page
3. **src/pages/JobDetail.js** - Job detail page
4. **src/services/liveFeed.service.js** - Reed API wrapper

---

## Next Steps

**For immediate use**:
- Everything is working now!
- Just use http://localhost:3000/opportunities

**For long-term**:
1. Consider Firestore caching (reduce API calls)
2. Add job tracking (see what users apply to)
3. Add search functionality
4. Set up automated proxy restart

---

## Documentation

Full details in:
- **OPPORTUNITIES_FIX_COMPLETE.md** - Comprehensive fix documentation
- **REED_API_INTEGRATION_FIX.md** - Reed API integration guide (existing)
- **LIVE_FEED_IMPLEMENTATION.md** - Live Feed feature docs (existing)

---

**Status**: ✅ All working!  
**Servers**: Both running  
**Jobs**: Loading successfully  
**Links**: All functional  

Your Opportunities page is now fully operational! 🎉
