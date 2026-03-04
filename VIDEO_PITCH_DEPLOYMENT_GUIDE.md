# Video Pitch Studio - Deployment Guide

## 🚀 **Production Deployment Checklist**

This guide covers deploying the Video Pitch Studio to production with all necessary configurations.

---

## 📋 **Pre-Deployment Checklist**

### **✅ Required Services**

- [ ] Firebase project configured
- [ ] Firestore database created
- [ ] Firebase Authentication enabled
- [ ] Firebase Storage bucket created
- [ ] OpenAI API account (optional)
- [ ] Supabase project (optional, alternative to Firebase Storage)

### **✅ Environment Variables**

Create `.env.production` with:

```env
# Firebase (Required)
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# OpenAI API (Optional - for AI script generation)
REACT_APP_OPENAI_API_KEY=sk-...your_openai_key

# Supabase (Optional - alternative video storage)
REACT_APP_SUPABASE_URL=https://your_project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🗄️ **Database Setup**

### **Firestore Collections**

Create these collections in Firebase Console:

#### **1. `users` Collection (Update Schema)**
Add these fields to existing user documents:
```json
{
  "video_pitch_url": "string (nullable)",
  "video_pitch_updated_at": "timestamp (nullable)"
}
```

#### **2. `video_pitches` Collection (New)**
Document structure:
```json
{
  "user_id": "string (indexed)",
  "video_url": "string",
  "script_text": "string",
  "duration_seconds": "number",
  "thumbnail_url": "string (nullable)",
  "views_count": "number (default: 0)",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "is_active": "boolean (default: true)"
}
```

**Indexes Required:**
```
Collection: video_pitches
Fields: user_id (Ascending), is_active (Ascending)
Query Scope: Collection

Collection: video_pitches  
Fields: user_id (Ascending), created_at (Descending)
Query Scope: Collection
```

### **Firestore Security Rules**

Add to `firestore.rules`:

```javascript
// Video Pitches - Read public, write own
match /video_pitches/{pitchId} {
  // Anyone can read active pitches
  allow read: if resource.data.is_active == true;
  
  // Users can create their own pitches
  allow create: if request.auth != null 
    && request.auth.uid == request.resource.data.user_id;
  
  // Users can update their own pitches
  allow update: if request.auth != null 
    && request.auth.uid == resource.data.user_id;
  
  // Users can delete their own pitches
  allow delete: if request.auth != null 
    && request.auth.uid == resource.data.user_id;
}

// Users collection - allow updating video_pitch_url
match /users/{userId} {
  allow read: if request.auth != null;
  
  allow update: if request.auth != null 
    && request.auth.uid == userId;
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

## 📦 **Storage Configuration**

### **Option A: Firebase Storage (Recommended)**

1. **Enable Firebase Storage** in Firebase Console
2. **Create bucket:** `video-pitches/`
3. **Set CORS policy:**

Create `cors.json`:
```json
[
  {
    "origin": ["https://your-domain.com"],
    "method": ["GET", "POST", "PUT"],
    "maxAgeSeconds": 3600
  }
]
```

Apply CORS:
```bash
gsutil cors set cors.json gs://your-bucket-name.appspot.com
```

4. **Storage Security Rules:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /video-pitches/{userId}/{fileName} {
      // Anyone can read
      allow read: if true;
      
      // Authenticated users can upload their own videos
      allow write: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.size < 50 * 1024 * 1024 // 50MB max
        && request.resource.contentType.matches('video/.*');
    }
  }
}
```

Deploy:
```bash
firebase deploy --only storage
```

### **Option B: Supabase Storage (Alternative)**

1. Create Supabase project: https://supabase.com
2. Create storage bucket: `video-pitches`
3. Set bucket to **Public**
4. Update `.env`:
```env
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...
```

5. Bucket policies (in Supabase dashboard):
```sql
-- Allow public read
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'video-pitches');

-- Allow authenticated insert
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'video-pitches' AND auth.role() = 'authenticated');
```

---

## 🤖 **OpenAI API Setup (Optional)**

1. Create account: https://platform.openai.com
2. Generate API key
3. Add to `.env.production`:
```env
REACT_APP_OPENAI_API_KEY=sk-...
```

**Cost Estimate:**
- GPT-3.5-Turbo: ~$0.002 per script generation
- 1000 scripts = ~$2
- Very affordable!

**Without OpenAI:**
- System uses intelligent template generator
- Still creates professional scripts
- No API key needed

---

## 🌐 **Frontend Deployment**

### **Build for Production**

```bash
# Install dependencies
cd placements-portal-full/web
npm install

# Build production bundle
npm run build

# Output will be in build/
```

### **Deploy to Firebase Hosting**

```bash
# Initialize hosting (if not done)
firebase init hosting

# Deploy
firebase deploy --only hosting

# Your site will be live at:
# https://your-project.firebaseapp.com
```

### **Deploy to Netlify**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=build

# Or connect GitHub repo in Netlify dashboard
```

### **Deploy to Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Or connect GitHub repo in Vercel dashboard
```

---

## 🔐 **Security Hardening**

### **Content Security Policy**

Add to `public/index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;
               media-src 'self' blob: https:;
               connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://api.openai.com https://*.supabase.co;">
```

### **Environment Variable Security**

**❌ Never commit:**
- `.env` files
- API keys
- Secrets

**✅ Always:**
- Use `.env.example` template
- Store secrets in hosting platform (Vercel/Netlify secrets)
- Rotate keys regularly

### **Firebase Security**

- Enable **App Check** (prevents abuse)
- Set **usage quotas** (prevent runaway costs)
- Monitor **Firebase Console** for unusual activity

---

## 📊 **Monitoring & Analytics**

### **Firebase Analytics**

Already integrated. Track:
- Video pitch creations
- Studio page views
- Recording completions
- Share link copies

### **Custom Events**

Add to VideoPitchStudio.js:
```javascript
import { logEvent } from 'firebase/analytics';
import { analytics } from './firebase';

// Log when script generated
logEvent(analytics, 'script_generated', {
  method: 'ai' // or 'manual'
});

// Log when video recorded
logEvent(analytics, 'video_recorded', {
  duration: recordingTime
});

// Log when pitch shared
logEvent(analytics, 'pitch_shared', {
  platform: 'linkedin' // or 'email', 'cv'
});
```

### **Error Tracking**

Integrate Sentry:
```bash
npm install @sentry/react

# In index.js
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production"
});
```

---

## 🧪 **Testing Before Launch**

### **Pre-Launch Checklist**

- [ ] Test script generation (with/without OpenAI)
- [ ] Test video recording (Chrome, Firefox, Safari)
- [ ] Test video upload to storage
- [ ] Test public link sharing
- [ ] Test "Watch Pitch" button (employer view)
- [ ] Test on mobile devices
- [ ] Test with slow internet connection
- [ ] Verify Firestore writes working
- [ ] Check storage permissions
- [ ] Test authentication flow

### **Load Testing**

Test with multiple concurrent users:
```bash
# Use artillery or k6
npm install -g artillery

# Create test-load.yml
artillery run test-load.yml
```

---

## 📈 **Scaling Considerations**

### **Current Architecture (Good for 1-10K users)**
- Client-side video recording
- Direct upload to storage
- Firestore for metadata

### **If Scaling Beyond 10K users:**

**Video Processing:**
- Add Cloud Functions for:
  - Thumbnail generation
  - Video compression
  - Format conversion

**CDN:**
- Serve videos via CDN (Cloudflare, AWS CloudFront)
- Reduces storage egress costs

**Database:**
- Add caching layer (Redis)
- Implement pagination on video lists

**Cost Optimization:**
- Compress videos server-side
- Set storage lifecycle rules (auto-delete old pitches)
- Use cheaper storage tiers for old videos

---

## 💰 **Cost Estimates**

### **Monthly Costs (1000 active students)**

**Firebase:**
- Firestore reads: ~10,000/day = **$0.50/month**
- Firestore writes: ~1,000/day = **$0.30/month**
- Storage (50GB videos) = **$2.50/month**
- Bandwidth (100GB) = **$12/month**
- **Firebase Total: ~$15/month**

**OpenAI (if used):**
- 1000 script generations = **$2/month**

**Supabase (alternative):**
- Pro plan = **$25/month** (includes 100GB bandwidth)

**Total Estimate:**
- **With Firebase: ~$17-20/month**
- **With Supabase: ~$25-30/month**

**Break-even:**
- Charge £5/video pitch = need 4-6 paid users to break even
- Or include in subscription/placement fee

---

## 🚨 **Common Deployment Issues**

### **Issue 1: CORS Errors**

**Symptom:** "Cross-origin request blocked"

**Solution:**
```bash
# Update Firebase Storage CORS
gsutil cors set cors.json gs://your-bucket.appspot.com
```

### **Issue 2: OpenAI 429 Rate Limit**

**Symptom:** "Rate limit exceeded"

**Solution:**
- Implement request queueing
- Cache generated scripts
- Upgrade OpenAI tier

### **Issue 3: Large Video Files**

**Symptom:** Upload fails or times out

**Solution:**
- Add client-side compression
- Limit recording to 60 seconds
- Use lower bitrate codec

### **Issue 4: Missing Permissions**

**Symptom:** Firestore permission denied

**Solution:**
- Check security rules
- Verify user authentication
- Test with Firebase emulator first

---

## 🔄 **Post-Deployment**

### **Week 1:**
- Monitor error logs daily
- Check Firebase usage quotas
- Gather user feedback
- Fix critical bugs

### **Week 2-4:**
- Analyze usage patterns
- Optimize slow queries
- Add requested features
- A/B test improvements

### **Monthly:**
- Review costs vs. budget
- Update dependencies
- Security audit
- Performance optimization

---

## 📞 **Support & Maintenance**

### **User Support:**
- Create FAQ page
- Add in-app help tooltips
- Set up support email
- Monitor feedback channels

### **Regular Maintenance:**
- Update npm packages monthly
- Review Firebase usage
- Backup Firestore data
- Test on new browser versions

---

## ✅ **Final Deployment Command**

```bash
# 1. Build production bundle
npm run build

# 2. Deploy everything to Firebase
firebase deploy

# 3. Verify deployment
firebase hosting:channel:open live

# 4. Monitor logs
firebase logging:tail
```

---

## 🎉 **You're Live!**

Your Video Pitch Studio is now live and ready for students to use!

**Next Steps:**
1. Announce the feature (email, social media)
2. Create tutorial video
3. Monitor usage and gather feedback
4. Iterate and improve

**Questions?** Check troubleshooting section or reach out to the development team.

---

## 📚 **Additional Resources**

- Firebase Documentation: https://firebase.google.com/docs
- WebRTC API: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- OpenAI API: https://platform.openai.com/docs
- Supabase Docs: https://supabase.com/docs

Good luck with your deployment! 🚀
