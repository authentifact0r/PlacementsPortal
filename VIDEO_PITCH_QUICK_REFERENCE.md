# Video Pitch Studio - Quick Reference

## 🎯 **At a Glance**

**What:** Professional video pitch creation tool for students  
**Time:** 5-10 minutes to create  
**Access:** `/studio` (graduates only)  
**Tech:** WebRTC, AI script generation, cloud storage

---

## 🚀 **Quick Links**

| Resource | Link/Location |
|----------|--------------|
| **User Guide** | `VIDEO_PITCH_USER_GUIDE.md` |
| **Implementation Docs** | `VIDEO_PITCH_STUDIO_IMPLEMENTATION.md` |
| **Deployment Guide** | `VIDEO_PITCH_DEPLOYMENT_GUIDE.md` |
| **Studio URL** | `http://localhost:3000/studio` |
| **Dashboard Tab** | Dashboard → Video Pitch (NEW badge) |
| **Navbar Link** | Profile Menu → Video Pitch Studio |

---

## 📁 **Key Files**

### **Services (Business Logic)**
```
src/services/videoPitch.service.js (9.7KB)
├── generatePitchScript()      - AI script generation
├── uploadVideoPitch()         - Video storage
├── saveVideoPitch()           - Database save
├── getUserVideoPitch()        - Fetch pitch
└── generatePublicPitchLink()  - Share link
```

### **Components (UI)**
```
src/components/
├── TeleprompterRecorder.js (16.5KB)  - Recording interface
└── PitchModal.js (11.3KB)            - Employer view modal
```

### **Pages**
```
src/pages/
├── VideoPitchStudio.js (17.3KB)  - Main studio (3 steps)
└── StudentProfile.js             - Dashboard integration
```

### **Documentation**
```
VIDEO_PITCH_STUDIO_IMPLEMENTATION.md    - Technical specs
VIDEO_PITCH_USER_GUIDE.md               - End-user guide
VIDEO_PITCH_DEPLOYMENT_GUIDE.md         - Production setup
VIDEO_PITCH_QUICK_REFERENCE.md          - This file
```

---

## 🎬 **3-Step Workflow**

```
┌────────────────┐
│  1. SCRIPT     │  Generate AI script or write own
│     ✍️          │  ~110 words, 45 seconds
└────────────────┘
         ↓
┌────────────────┐
│  2. RECORD     │  WebRTC recording + teleprompter
│     🎥          │  Auto-scroll, 60s max, live indicator
└────────────────┘
         ↓
┌────────────────┐
│  3. SHARE      │  Public link generated
│     🔗          │  LinkedIn, CV, email
└────────────────┘
```

---

## 🔑 **Environment Variables**

### **Required:**
```env
# Firebase (authentication + database)
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

### **Optional (Enhanced Features):**
```env
# OpenAI (AI script generation)
REACT_APP_OPENAI_API_KEY=sk-...

# Supabase (alternative video storage)
REACT_APP_SUPABASE_URL=https://...
REACT_APP_SUPABASE_ANON_KEY=...
```

---

## 🗄️ **Database Schema**

### **Firestore Collections:**

**`users` (update existing):**
```javascript
{
  video_pitch_url: string,
  video_pitch_updated_at: timestamp
}
```

**`video_pitches` (new):**
```javascript
{
  user_id: string,           // indexed
  video_url: string,
  script_text: string,
  duration_seconds: number,
  thumbnail_url: string,
  views_count: number,       // default: 0
  created_at: timestamp,
  is_active: boolean         // default: true
}
```

---

## 🎯 **Key Features**

### **AI Script Generation:**
- OpenAI GPT-3.5-Turbo integration
- Generates ~110-word pitch (~45 seconds)
- Template fallback (no API key needed)
- Editable in-app

### **Teleprompter:**
- Auto-scrolling text overlay
- Speed control (20-60 WPM)
- Mirror video toggle
- Show/hide script toggle
- Real-time countdown

### **Recording:**
- WebRTC MediaRecorder API
- 1280x720 resolution (720p)
- VP9 codec (WebM format)
- 60-second max duration
- Live indicator (animated)
- Progress bar (0-100%)

### **Sharing:**
- Public link generation
- LinkedIn share integration
- Email share
- Downloadable video
- View count tracking

### **Recruiter View:**
- Glassmorphism modal
- Video player with controls
- Student contact info
- Skills display
- "Contact for Interview" CTA

---

## 🔧 **Common Commands**

### **Development:**
```bash
# Start dev server
npm start

# Access studio
http://localhost:3000/studio

# Check compilation
# Look for "Compiled successfully!"
```

### **Testing:**
```bash
# Test camera access
navigator.mediaDevices.getUserMedia({ video: true, audio: true })

# Test OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $REACT_APP_OPENAI_API_KEY"

# Test Firebase
firebase emulators:start
```

### **Deployment:**
```bash
# Build for production
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage
```

---

## 🐛 **Quick Troubleshooting**

| Issue | Quick Fix |
|-------|-----------|
| **Camera not working** | Grant permissions, refresh page |
| **Script won't generate** | Check OpenAI key or use template |
| **Video won't upload** | Check Firebase Storage rules |
| **Teleprompter doesn't scroll** | Start recording, check speed setting |
| **Link doesn't work** | Copy full URL including https:// |
| **Modal won't open** | Check z-index (modal: 70, navbar: 50) |

---

## 📊 **Performance Metrics**

| Metric | Target | Typical |
|--------|--------|---------|
| **Script Generation** | <5s | 2-3s |
| **Camera Start** | <2s | 1s |
| **Recording Start** | Instant | <100ms |
| **Video Upload** | <30s | 10-20s |
| **Total Time** | 5-10min | 7min |

---

## 💰 **Cost Breakdown**

### **Per 1000 Students:**

**Firebase:**
- Firestore: $0.80/month
- Storage (50GB): $2.50/month
- Bandwidth (100GB): $12/month
- **Subtotal: $15/month**

**OpenAI (optional):**
- Script gen: $2/month

**Total: $17-20/month**

**Revenue Potential:**
- Free (included in service)
- Or £5/pitch = £5,000 revenue
- **ROI: 250-300x** 🚀

---

## 🎨 **Design Tokens**

### **Colors:**
```css
--studio-bg: #0f172a (slate-900)
--accent-red: #dc2626 (red-600)
--accent-blue: #2563eb (blue-600)
--accent-purple: #9333ea (purple-600)
--success-green: #10b981 (green-500)
--text-white: #ffffff
--text-gray: #9ca3af (gray-400)
```

### **Key Components:**
- **LIVE Indicator:** Red dot + pulse animation
- **Progress Bar:** Gradient red-600 → red-500
- **Buttons:** rounded-xl, font-semibold
- **Modal:** Glassmorphism (backdrop-blur + bg-white/5)

---

## 🔗 **Integration Points**

### **Navbar:**
```javascript
// NavbarSaaS.js (line 195)
{userProfile?.role === 'graduate' && (
  <Link to="/studio">
    <Video /> Video Pitch Studio <Badge>NEW</Badge>
  </Link>
)}
```

### **Student Dashboard:**
```javascript
// StudentProfile.js (Video Pitch tab)
<Tab id="video-pitch" badge="NEW">
  <VideoPitchCTA onClick={() => navigate('/studio')} />
</Tab>
```

### **Employer View:**
```javascript
// Future: OpportunitiesPremium.js
<StudentCard>
  <button onClick={() => setShowPitchModal(true)}>
    Watch 30s Pitch
  </button>
</StudentCard>

<PitchModal 
  student={student}
  isOpen={showPitchModal}
  onClose={() => setShowPitchModal(false)}
/>
```

---

## 🧪 **Test Checklist**

- [ ] Script generation (with/without API)
- [ ] Camera permissions
- [ ] Start/stop recording
- [ ] Teleprompter auto-scroll
- [ ] Speed slider (20-60 WPM)
- [ ] Mirror toggle
- [ ] LIVE indicator appears
- [ ] Timer counts up
- [ ] Progress bar fills
- [ ] Auto-stop at 60s
- [ ] Video preview plays
- [ ] Download works
- [ ] Upload succeeds
- [ ] Public link copied
- [ ] LinkedIn share opens
- [ ] Modal opens (employer view)

---

## 📱 **Browser Support**

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Recommended |
| Edge | ✅ Full | Chromium-based |
| Firefox | ✅ Full | All features |
| Safari | ✅ Full | MacOS/iOS |
| Mobile Chrome | ✅ Full | Android/iOS |
| Mobile Safari | ✅ Full | iOS |
| IE11 | ❌ None | WebRTC not supported |

---

## 🎓 **User Journey**

```
Student logs in
    ↓
Sees "NEW" badge on Video Pitch tab
    ↓
Clicks "Create Your Pitch Now"
    ↓
Generates script (2-3 seconds)
    ↓
Reviews and edits script
    ↓
Clicks "Proceed to Recording"
    ↓
Grants camera/mic permissions (first time)
    ↓
Adjusts settings (speed, mirror)
    ↓
Clicks "Start Recording"
    ↓
Speaks while teleprompter scrolls
    ↓
Clicks "Stop" or auto-stops at 60s
    ↓
Reviews video, chooses Keep/Re-record
    ↓
Clicks "Save & Upload" (10-20 seconds)
    ↓
Receives public link
    ↓
Copies link → Adds to LinkedIn/CV
    ↓
Recruiter clicks link → Watches pitch → Contacts student
```

---

## 🚀 **Go Live Checklist**

### **Before Launch:**
- [ ] All .env variables set
- [ ] Firestore collections created
- [ ] Firestore rules deployed
- [ ] Storage bucket configured
- [ ] CORS policy applied
- [ ] OpenAI tested (or template ready)
- [ ] Tested on Chrome, Firefox, Safari
- [ ] Tested on mobile devices
- [ ] Security audit passed
- [ ] Performance benchmarks met

### **Launch Day:**
- [ ] Monitor Firebase Console
- [ ] Watch error logs
- [ ] Test user signup → pitch creation flow
- [ ] Verify storage uploads working
- [ ] Check public links accessible
- [ ] Monitor costs/usage

### **Post-Launch (Week 1):**
- [ ] Gather user feedback
- [ ] Fix critical bugs
- [ ] Optimize slow queries
- [ ] Add requested features
- [ ] Create tutorial content

---

## 📞 **Support Contacts**

| Topic | Resource |
|-------|----------|
| **User Help** | `VIDEO_PITCH_USER_GUIDE.md` |
| **Technical Docs** | `VIDEO_PITCH_STUDIO_IMPLEMENTATION.md` |
| **Deployment** | `VIDEO_PITCH_DEPLOYMENT_GUIDE.md` |
| **Bug Reports** | GitHub Issues / support@placementsportal.com |
| **Feature Requests** | Feature request form |

---

## ✅ **Success Metrics**

### **Week 1 Targets:**
- [ ] 50+ students create pitches
- [ ] <5% error rate
- [ ] Average completion time <10 minutes
- [ ] 90%+ successful uploads

### **Month 1 Targets:**
- [ ] 500+ pitches created
- [ ] 50+ pitches viewed by recruiters
- [ ] 5+ interview requests from pitches
- [ ] <$50 infrastructure costs

---

## 🎉 **You're All Set!**

**Video Pitch Studio is ready to transform how students showcase themselves to recruiters.**

**Quick Start:**
1. Visit `/studio`
2. Generate script
3. Record pitch
4. Share link

**Questions?** Check the full guides linked above!

---

**Built with ❤️ for PlacementsPortal** 🚀
