# CLAUDE.md — PlacementsPortal
> Mac development reference. Last updated: 2026-02-22 after Linux → Mac migration.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | **Create React App** (React 18, NOT Next.js) |
| Routing | React Router v6 |
| Styling | Tailwind CSS 3 + PostCSS + custom CSS modules |
| Animation | Framer Motion |
| Charts | Recharts |
| Auth & DB | Firebase 10 (Auth, Firestore, Storage, Functions) |
| Payments | Stripe (react-stripe-js) |
| Jobs API | Reed.co.uk API (proxied via `reed-proxy-server.js`) |
| Font | Plus Jakarta Sans (@fontsource) |
| Forms | Formik + Yup |

---

## File Structure

```
web/
├── src/
│   ├── App.js                        ← Router, role-based routing, ProtectedRoute
│   ├── index.js                      ← React root entry point
│   ├── contexts/
│   │   ├── AuthContext.js            ← Firebase Auth state, signup/login/logout
│   │   └── ToastContext.js           ← Global toast notifications
│   ├── components/                   ← Shared UI components (Navbar, Footer, Modals…)
│   ├── dashboards/
│   │   ├── StudentDashboard.js       ← Student role UI (mock data — TODO: Firebase)
│   │   ├── EmployerDashboard.js      ← Employer role UI (mock data — TODO: Firebase)
│   │   ├── OperatorDashboard.js      ← Admin/Operator UI (mock data — TODO: Firebase)
│   │   ├── CoachesDashboard.js       ← Coach role UI (mock data — TODO: Firebase)
│   │   ├── AdminDashboard.js         ← Legacy admin UI
│   │   └── AdminDashboardPremium.js  ← Premium admin UI
│   ├── pages/                        ← Public-facing pages (Home, Opportunities, etc.)
│   ├── services/
│   │   ├── firebase.js               ← Firebase init (reads from .env)
│   │   ├── liveFeed.service.js       ← Reed API + LinkedIn feed integration
│   │   ├── opportunity.service.js    ← Job listings
│   │   ├── videoPitch.service.js     ← Video pitch upload/AI feedback
│   │   ├── cvOptimizer.service.js    ← CV AI review (stub — TODO: real AI integration)
│   │   ├── event.service.js          ← Events/bookings
│   │   ├── jobTracking.service.js    ← Job application tracking
│   │   └── liveFeed.service.js       ← Live activity feed
│   ├── styles/
│   │   └── mobile-optimizations.css
│   └── utils/                        ← Empty — placeholder for shared utilities
├── public/
│   ├── index.html                    ← HTML shell with SEO meta tags
│   ├── manifest.json
│   └── assets/
│       ├── images/
│       │   ├── testimonials/         ← Add testimonial headshots here
│       │   └── partners/             ← Add partner logos here (see DEPLOYMENT_SUMMARY.md)
│       └── videos/
│           └── hero-background.mp4  ← MISSING — add hero video here (HIGH priority)
├── .env                              ← Local secrets — never commit
├── .env.example                      ← Template for new installs
├── .gitignore
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── firebase.json                     ← Firebase Hosting + Firestore config
├── firestore.rules                   ← Firestore security rules
├── reed-proxy-server.js              ← CORS proxy for Reed Jobs API (Node/Express)
├── start-servers.sh                  ← Convenience script: starts both servers
└── [*.md files]                      ← Feature documentation from dev history
```

---

## Dev Commands

### Start development (React app only)
```bash
cd ~/Desktop/PlacementPortal/web
npm start
# → http://localhost:3000
```

### Start Reed API proxy (required for job listings)
```bash
# In a SEPARATE terminal tab:
cd ~/Desktop/PlacementPortal/web
node reed-proxy-server.js
# → http://localhost:3001
```

### Start both at once (recommended)
```bash
cd ~/Desktop/PlacementPortal/web
chmod +x start-servers.sh
./start-servers.sh
```

### Production build
```bash
cd ~/Desktop/PlacementPortal/web
npm run build
# Output → build/ folder (deploy this to Firebase Hosting)
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools   # once only
firebase login
npm run build
firebase deploy
```

---

## Environment Variables

All variables must be set in `.env` (copy from `.env.example`). CRA only exposes variables prefixed `REACT_APP_` to the browser bundle.

| Variable | Used In | Status | Where to get it |
|----------|---------|--------|-----------------|
| `REACT_APP_FIREBASE_API_KEY` | `src/services/firebase.js` | ✅ Set | Firebase Console → Project Settings |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | `src/services/firebase.js` | ✅ Set | Firebase Console |
| `REACT_APP_FIREBASE_PROJECT_ID` | `src/services/firebase.js` | ✅ Set | Firebase Console |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | `src/services/firebase.js` | ✅ Set | Firebase Console |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | `src/services/firebase.js` | ✅ Set | Firebase Console |
| `REACT_APP_FIREBASE_APP_ID` | `src/services/firebase.js` | ✅ Set | Firebase Console |
| `REACT_APP_FIREBASE_MEASUREMENT_ID` | `src/services/firebase.js` | ✅ Set | Firebase Console |
| `REACT_APP_REED_API_KEY` | `src/services/liveFeed.service.js` | ✅ Set | reed.co.uk/developers |
| `REED_API_KEY` | `reed-proxy-server.js` | ✅ Set | Same as above |
| `REACT_APP_REED_API_ENDPOINT` | `src/services/liveFeed.service.js` | ✅ Set | `http://localhost:3001/api/reed` |
| `REACT_APP_OPENAI_API_KEY` | `src/services/videoPitch.service.js` | ⚠️ STUB | platform.openai.com/api-keys |
| `REACT_APP_SUPABASE_URL` | `src/services/videoPitch.service.js` | ⚠️ STUB | supabase.com/dashboard |
| `REACT_APP_SUPABASE_ANON_KEY` | `src/services/videoPitch.service.js` | ⚠️ STUB | supabase.com/dashboard |
| `REACT_APP_LINKEDIN_API_ENDPOINT` | `src/services/liveFeed.service.js` | ⚠️ STUB | rapidapi.com |
| `REACT_APP_RAPIDAPI_KEY` | `src/services/liveFeed.service.js` | ⚠️ STUB | rapidapi.com |
| `REACT_APP_ENV` | General | ✅ Set | `development` or `production` |

---

## Role-Based Routing

Routes are protected by `ProtectedRoute` in `App.js`. User role is stored in Firestore under `/users/{uid}`.

| Role | Dashboard Route | Component |
|------|----------------|-----------|
| `student` / `graduate` | `/dashboard/student/*` | `StudentProfileEnhancedV2` |
| `employer` | `/dashboard/employer/*` | `EmployerDashboard` |
| `coach` | `/dashboard/coach/*` | `CoachesDashboard` |
| `admin` | `/dashboard/admin/*` | `OperatorDashboard` |

Login → `/dashboard` → auto-redirects based on role.

---

## Git — First-Time Setup (run on your Mac)

Git was initialised and all source files were staged during migration. Run this once in your terminal:

```bash
cd ~/Desktop/PlacementPortal/web
git commit -m "chore: initial Mac migration commit"

# Optional — push to GitHub:
git remote add origin https://github.com/YOUR_USERNAME/PlacementPortal.git
git branch -M main
git push -u origin main
```

---

## Admin Scripts (require serviceAccountKey.json)

`setup-admins.js`, `create-users.js`, and `create-user-profiles.js` use Firebase Admin SDK.
They require a `serviceAccountKey.json` file which is **not committed to Git** for security.

To generate it:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `serviceAccountKey.json` in the project root (`web/`)
4. **Never commit this file** (already in `.gitignore`)

Then run:
```bash
node setup-admins.js
```

---

## Build Audit Results (2026-02-22)

Build status: **✅ Compiled successfully** (zero errors)

Bundle sizes (gzip):
- JS: `442.76 kB` — main chunk
- CSS: `21.77 kB`

### Warnings to address (non-blocking)

| File | Issue | Priority |
|------|-------|----------|
| `src/dashboards/OperatorDashboard.js` | Unused imports: `CheckSquare`, `AreaChart`, `Area`, `AlertCircle` | Low |
| `src/dashboards/CoachesDashboard.js` | Multiple unused state setters and imports | Low |
| `src/pages/StudentProfileEnhanced.js` | Unused icon imports, unused state vars | Low |
| `src/contexts/AuthContext.js` | `signInWithRedirect`, `getRedirectResult` imported but unused | Low |
| `src/pages/Contact.js` / `StudentSupport.js` | `<a href="#">` — invalid accessible href | Medium |
| Multiple dashboards | `useEffect` missing dependencies array | Medium |
| `src/App.js` | `StudentProfileEnhanced` imported but unused | Low |

---

## Known Incomplete Integrations (TODOs)

16 `TODO` comments exist across the codebase — all are Firebase/backend wiring stubs:

- **All dashboards** use mock data. Firebase `onSnapshot` / `getDocs` calls need implementing.
- `src/services/cvOptimizer.service.js` — AI integration is a stub (needs OpenAI key)
- `src/services/videoPitch.service.js` — Supabase storage upload is a stub
- `src/services/liveFeed.service.js` — LinkedIn/RapidAPI endpoint is a stub
- `src/pages/Contact.js` — form submission needs a Firebase Cloud Function
- `src/components/CoachingBookingModal.js` — booking needs a real backend call
- `src/pages/PublicPitchPage.js` — pitch data needs fetching from Firestore

---

## Missing Assets (from DEPLOYMENT_SUMMARY.md)

| File path | Purpose | Priority |
|-----------|---------|----------|
| `public/assets/videos/hero-background.mp4` | Homepage hero loop video | HIGH |
| `public/assets/images/partners/*.png` | Partner logo carousel | MEDIUM |
| `public/assets/images/testimonials/*.jpg` | Testimonial headshots | MEDIUM |

---

## Migration Notes

- **From**: Linux UTM VM (`/home/moltbot/...`)
- **To**: macOS native (`~/Desktop/PlacementPortal/web`)
- **Linux-specific paths in source**: None found — clean migration ✅
- **Platform-specific npm scripts**: None — all standard CRA scripts ✅
- **node_modules**: Freshly installed on Mac (`npm install` already done)
- **Firebase credentials**: Moved from hardcoded strings → `process.env.REACT_APP_*` ✅
- **Reed API key**: Moved from hardcoded string → `process.env.REED_API_KEY` ✅
