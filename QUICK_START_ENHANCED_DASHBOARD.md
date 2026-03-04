# Quick Start - Enhanced Dashboard

## ✅ What's New (Feb 22, 2026)

### 1. "Video Pitch" → "Elevated Pitch" (Renamed everywhere)
- Navbar: "Elevated Pitch Studio"
- Dashboard tab: "Elevated Pitch"
- Studio page: "Create Your 60-Second Elevated Pitch"

### 2. Job Tracking Service (NEW)
- Tracks when students click on jobs
- Tracks when students apply to jobs
- Calculates conversion rates
- Provides analytics for admin dashboard

### 3. Enhanced Student Dashboard (NEW)
- 3 stat cards: Pending Tasks, Applications, New Jobs
- Manage Jobs Board (like your screenshot)
- My Tasks section
- Quick Links sidebar
- Events timeline
- Your Progress tracking

---

## 🚀 How to Use Enhanced Dashboard

### Option 1: Replace Current Dashboard (Recommended)

Edit `src/App.js` line 31:

```javascript
// BEFORE
import StudentProfile from './pages/StudentProfile';

// AFTER  
import StudentProfile from './pages/StudentProfileEnhanced';
```

Save and refresh browser. Done! ✅

### Option 2: Add as Separate Route

Keep both dashboards available:

In `src/App.js`, add new route after line 137:

```javascript
<Route
  path="/dashboard/enhanced"
  element={
    <ProtectedRoute allowedRoles={['student', 'graduate']}>
      <StudentProfileEnhanced />
    </ProtectedRoute>
  }
/>
```

Access at: `/dashboard/enhanced`

---

## 📊 Job Tracking Usage

### Track Job Click (when user views job)

In `OpportunitiesPremium.js` or `JobDetail.js`:

```javascript
import jobTrackingService from '../services/jobTracking.service';

const handleJobClick = async (job) => {
  if (currentUser) {
    await jobTrackingService.trackJobClick(currentUser.uid, {
      jobId: job.jobId,
      jobTitle: job.jobTitle,
      company: job.employerName,
      location: job.locationName,
      source: 'reed'
    });
  }
  navigate(`/opportunities/${job.jobId}`);
};
```

### Track Job Application (when user applies)

```javascript
const handleApply = async (job) => {
  if (currentUser) {
    await jobTrackingService.trackJobApplication(currentUser.uid, {
      jobId: job.jobId,
      jobTitle: job.jobTitle,
      company: job.employerName
    }, {
      method: 'external',
      clickedBefore: true
    });
  }
  window.open(job.jobUrl, '_blank');
};
```

---

## 🔐 Firestore Security Rules

Add to `firestore.rules`:

```
// Job Tracking
match /job_clicks/{clickId} {
  allow read, write: if request.auth != null && 
                     request.resource.data.userId == request.auth.uid;
}

match /job_applications/{applicationId} {
  allow read, write: if request.auth != null && 
                     request.resource.data.userId == request.auth.uid;
}
```

Deploy:
```bash
firebase deploy --only firestore:rules
```

---

## 🧪 Quick Test

1. **Test Renaming**:
   - Login as student
   - Check navbar shows "Elevated Pitch Studio" ✅
   - Go to dashboard, check tab says "Elevated Pitch" ✅

2. **Test Enhanced Dashboard**:
   - Use Option 1 or 2 above
   - Visit `/dashboard/student` or `/dashboard/enhanced`
   - See 3 colorful stat cards at top ✅
   - See "Manage Jobs Board" with Claim/View buttons ✅
   - See "My Tasks" section ✅
   - See Quick Links sidebar ✅

3. **Test Job Tracking** (after integration):
   - Browse /opportunities
   - Click a job
   - Check Firestore `job_clicks` collection ✅
   - Apply to job
   - Check Firestore `job_applications` collection ✅

---

## 📁 Files

### Created (3)
- `src/services/jobTracking.service.js` - Track clicks & applications
- `src/pages/StudentProfileEnhanced.js` - New dashboard
- `ELEVATED_PITCH_AND_DASHBOARD_UPGRADE.md` - Full docs

### Modified (6)
- `src/components/NavbarSaaS.js` - "Elevated Pitch"
- `src/pages/StudentProfile.js` - "Elevated Pitch"
- `src/pages/VideoPitchStudio.js` - "Elevated Pitch"
- `src/dashboards/OperatorDashboard.js` - "Elevated Pitches"
- `src/services/videoPitch.service.js` - Comment update
- `src/App.js` - Import StudentProfileEnhanced

---

## 🎯 Current Status

- ✅ Renaming complete (all "Video Pitch" → "Elevated Pitch")
- ✅ Job tracking service ready
- ✅ Enhanced dashboard created
- ✅ Import added to App.js
- ⏳ **Choose Option 1 or 2 above to activate**
- ⏳ Integrate tracking into job pages (5 mins)
- ⏳ Deploy Firestore rules (2 mins)

---

## 💡 Next Session

When you're ready:
1. Choose which dashboard version to use
2. Integrate job tracking into OpportunitiesPremium.js
3. Deploy Firestore security rules
4. Test full flow: Browse → Click → Apply → Check Analytics

---

**Server**: http://localhost:3000 (starting now...)  
**Documentation**: See `ELEVATED_PITCH_AND_DASHBOARD_UPGRADE.md` for details
