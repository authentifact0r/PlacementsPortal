/**
 * PlacementPortal — Firestore Seed Script
 * ─────────────────────────────────────────
 * Populates every collection with realistic test data so all four
 * dashboards render with live content immediately after running.
 *
 * Prerequisites:
 *   1. Download your Firebase service account key from:
 *      Firebase Console → Project Settings → Service Accounts → Generate new private key
 *      Save the file as:  web/serviceAccountKey.json
 *   OR set the env var:   GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
 *
 * Usage:
 *   npm run seed          ← from the web/ directory
 *   node scripts/seedFirestore.js
 *
 * The script is SAFE TO RE-RUN — it skips collections that already have data
 * unless you pass --force:
 *   node scripts/seedFirestore.js --force
 */

'use strict';

const path = require('path');
const fs   = require('fs');

// ─── Admin SDK Initialisation ──────────────────────────────────────────────
let admin;
try {
  admin = require('firebase-admin');
} catch {
  console.error('❌  firebase-admin not found. Run: npm install --save-dev firebase-admin');
  process.exit(1);
}

const keyPath = path.resolve(__dirname, '..', 'serviceAccountKey.json');
const force   = process.argv.includes('--force');

let app;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  app = admin.initializeApp({ credential: admin.credential.applicationDefault() });
  console.log('🔑  Using GOOGLE_APPLICATION_CREDENTIALS');
} else if (fs.existsSync(keyPath)) {
  const serviceAccount = require(keyPath);
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('🔑  Using serviceAccountKey.json');
} else {
  console.error(`
❌  No Firebase credentials found.

Please do ONE of the following:

  A) Download your service account key from Firebase Console:
     Firebase Console → Project Settings → Service Accounts → Generate new private key
     Save it as:  web/serviceAccountKey.json

  B) Set the GOOGLE_APPLICATION_CREDENTIALS environment variable:
     export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json

Then re-run:  npm run seed
`);
  process.exit(1);
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// ─── Helpers ──────────────────────────────────────────────────────────────

const ts = (daysFromNow = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return admin.firestore.Timestamp.fromDate(d);
};

const past = (daysAgo) => ts(-daysAgo);

async function collectionEmpty(colName) {
  const snap = await db.collection(colName).limit(1).get();
  return snap.empty;
}

async function batchWrite(records) {
  // Firestore batch limit is 500 ops; chunk if needed
  const chunks = [];
  for (let i = 0; i < records.length; i += 490) {
    chunks.push(records.slice(i, i + 490));
  }
  for (const chunk of chunks) {
    const batch = db.batch();
    for (const { col, id, data } of chunk) {
      const ref = id ? db.collection(col).doc(id) : db.collection(col).doc();
      batch.set(ref, data, { merge: true });
    }
    await batch.commit();
  }
}

// ─── Seed Data Definitions ────────────────────────────────────────────────

function buildUsers() {
  return [
    // Admin
    {
      col: 'users', id: 'admin-001',
      data: {
        displayName: 'Platform Admin',
        email: 'admin@placementsportal.com',
        role: 'admin',
        status: 'active',
        createdAt: past(90)
      }
    },

    // Coaches
    {
      col: 'users', id: 'coach-001',
      data: {
        displayName: 'Dr. Amara Osei',
        email: 'a.osei@placementsportal.com',
        role: 'coach',
        status: 'active',
        specialisms: ['CV Review', 'Interview Prep', 'Career Planning'],
        createdAt: past(60)
      }
    },
    {
      col: 'users', id: 'coach-002',
      data: {
        displayName: 'Marcus Webb',
        email: 'm.webb@placementsportal.com',
        role: 'coach',
        status: 'active',
        specialisms: ['Interview Prep', 'Skills Assessment'],
        createdAt: past(55)
      }
    },

    // Employers
    {
      col: 'users', id: 'employer-001',
      data: {
        displayName: 'BuildTech Solutions',
        email: 'hr@buildtech.com',
        role: 'employer',
        company: 'BuildTech Solutions',
        sector: 'Civil Engineering',
        status: 'active',
        createdAt: past(45)
      }
    },
    {
      col: 'users', id: 'employer-002',
      data: {
        displayName: 'TechFlow Systems',
        email: 'talent@techflow.com',
        role: 'employer',
        company: 'TechFlow Systems',
        sector: 'Technology',
        status: 'active',
        createdAt: past(40)
      }
    },
    {
      col: 'users', id: 'employer-003',
      data: {
        displayName: 'DesignPro Ltd',
        email: 'careers@designpro.co.uk',
        role: 'employer',
        company: 'DesignPro Ltd',
        sector: 'Architecture & Design',
        status: 'active',
        createdAt: past(38)
      }
    },

    // Students
    {
      col: 'users', id: 'student-001',
      data: {
        displayName: 'Sarah Mitchell',
        email: 's.mitchell@uni.ac.uk',
        role: 'student',
        course: 'MEng Civil Engineering',
        major: 'Civil Engineering',
        year: 'Final Year',
        status: 'active',
        progress: 75,
        goals: ['Land placement at BuildTech', 'Improve interview skills'],
        createdAt: past(30)
      }
    },
    {
      col: 'users', id: 'student-002',
      data: {
        displayName: 'James Kumar',
        email: 'j.kumar@uni.ac.uk',
        role: 'student',
        course: 'MSc Computer Science',
        major: 'Computer Science',
        year: 'Penultimate',
        status: 'active',
        progress: 90,
        goals: ['Secure internship at tech company', 'Build portfolio'],
        createdAt: past(28)
      }
    },
    {
      col: 'users', id: 'student-003',
      data: {
        displayName: 'Emma Thompson',
        email: 'e.thompson@uni.ac.uk',
        role: 'student',
        course: 'BSc Business Management',
        major: 'Business Management',
        year: 'Final Year',
        status: 'active',
        progress: 40,
        goals: ['Explore project management roles', 'Networking'],
        createdAt: past(25)
      }
    },
    {
      col: 'users', id: 'student-004',
      data: {
        displayName: 'Alex Patel',
        email: 'a.patel@uni.ac.uk',
        role: 'student',
        course: 'BEng Structural Engineering',
        major: 'Structural Engineering',
        year: 'Final Year',
        status: 'active',
        progress: 60,
        goals: ['Graduate scheme at Arup', 'Chartership pathway'],
        createdAt: past(22)
      }
    },
    {
      col: 'users', id: 'student-005',
      data: {
        displayName: 'Priya Sharma',
        email: 'p.sharma@uni.ac.uk',
        role: 'student',
        course: 'MSc Data Science',
        major: 'Data Science',
        year: 'Penultimate',
        status: 'active',
        progress: 55,
        goals: ['Data analyst role', 'Python & SQL mastery'],
        createdAt: past(20)
      }
    },
    {
      col: 'users', id: 'graduate-001',
      data: {
        displayName: 'Liam Okafor',
        email: 'l.okafor@alumni.ac.uk',
        role: 'graduate',
        course: 'MEng Mechanical Engineering',
        status: 'active',
        progress: 100,
        createdAt: past(15)
      }
    }
  ];
}

function buildOpportunities() {
  return [
    {
      col: 'opportunities', id: 'opp-001',
      data: {
        title: 'Graduate Civil Engineer',
        employerId: 'employer-001',
        company: 'BuildTech Solutions',
        location: { city: 'London', remote: false },
        type: 'graduate',
        category: 'Civil Engineering',
        salary: { min: 28000, max: 34000, currency: 'GBP' },
        description: 'Exciting graduate opportunity to work on major infrastructure projects across the UK. You will be joining a supportive team and gaining chartered status through ICE.',
        requirements: ['Civil Engineering degree (2:1 or above)', 'Proficiency in AutoCAD', 'Strong communication skills'],
        status: 'active',
        applications: 8,
        views: 145,
        featured: true,
        createdAt: past(20),
        updatedAt: past(5),
        expiresAt: ts(40)
      }
    },
    {
      col: 'opportunities', id: 'opp-002',
      data: {
        title: 'Software Engineer Internship',
        employerId: 'employer-002',
        company: 'TechFlow Systems',
        location: { city: 'Manchester', remote: true },
        type: 'internship',
        category: 'Technology',
        salary: { min: 22000, max: 26000, currency: 'GBP' },
        description: 'Join our product team for a 12-month placement. Work on live React & Node.js applications used by thousands of customers.',
        requirements: ['CS or related degree', 'Experience with JavaScript', 'Passion for user experience'],
        status: 'active',
        applications: 14,
        views: 230,
        featured: false,
        createdAt: past(15),
        updatedAt: past(3),
        expiresAt: ts(30)
      }
    },
    {
      col: 'opportunities', id: 'opp-003',
      data: {
        title: 'Junior Structural Engineer',
        employerId: 'employer-001',
        company: 'BuildTech Solutions',
        location: { city: 'Birmingham', remote: false },
        type: 'graduate',
        category: 'Civil Engineering',
        salary: { min: 26000, max: 30000, currency: 'GBP' },
        description: 'Support senior engineers on structural design projects including residential, commercial, and infrastructure work.',
        requirements: ['Structural Engineering degree', 'Knowledge of Eurocodes', 'Revit or Tekla experience a plus'],
        status: 'active',
        applications: 5,
        views: 89,
        featured: false,
        createdAt: past(12),
        updatedAt: past(2),
        expiresAt: ts(50)
      }
    },
    {
      col: 'opportunities', id: 'opp-004',
      data: {
        title: 'Data Analyst — Graduate Scheme',
        employerId: 'employer-002',
        company: 'TechFlow Systems',
        location: { city: 'London', remote: true },
        type: 'graduate',
        category: 'Technology',
        salary: { min: 30000, max: 36000, currency: 'GBP' },
        description: 'Our 2-year graduate scheme places you in our data analytics division. Training in Python, SQL, Tableau, and cloud platforms.',
        requirements: ['Data Science, Maths, or Statistics degree', 'Python or R experience', 'Analytical mindset'],
        status: 'active',
        applications: 11,
        views: 198,
        featured: true,
        createdAt: past(10),
        updatedAt: past(1),
        expiresAt: ts(60)
      }
    },
    {
      col: 'opportunities', id: 'opp-005',
      data: {
        title: 'Architectural Technician',
        employerId: 'employer-003',
        company: 'DesignPro Ltd',
        location: { city: 'Bristol', remote: false },
        type: 'graduate',
        category: 'Architecture & Design',
        salary: { min: 24000, max: 28000, currency: 'GBP' },
        description: 'Exciting role in a growing architecture practice. You will be producing technical drawings, specifications, and supporting planning applications.',
        requirements: ['Architecture or Architectural Technology degree', 'AutoCAD and Revit proficiency', 'Portfolio required'],
        status: 'active',
        applications: 3,
        views: 67,
        featured: false,
        createdAt: past(8),
        updatedAt: past(1),
        expiresAt: ts(45)
      }
    },
    {
      col: 'opportunities', id: 'opp-006',
      data: {
        title: 'Project Management Graduate',
        employerId: 'employer-003',
        company: 'DesignPro Ltd',
        location: { city: 'London', remote: false },
        type: 'graduate',
        category: 'Business & Management',
        salary: { min: 27000, max: 32000, currency: 'GBP' },
        description: 'Support the delivery of design and construction projects from inception to completion. Ideal for business or engineering graduates with strong organisation skills.',
        requirements: ['Business, Engineering, or related degree', 'Strong communication skills', 'Experience with project management tools'],
        status: 'active',
        applications: 7,
        views: 112,
        featured: false,
        createdAt: past(6),
        updatedAt: past(0),
        expiresAt: ts(55)
      }
    }
  ];
}

function buildApplications() {
  return [
    {
      col: 'applications', id: 'app-001',
      data: {
        studentId: 'student-001',
        studentName: 'Sarah Mitchell',
        employerId: 'employer-001',
        opportunityId: 'opp-001',
        jobTitle: 'Graduate Civil Engineer',
        qualification: 'MEng Civil Engineering',
        status: 'shortlisted',
        coverLetter: 'I am passionate about infrastructure and believe I would be a strong asset to the BuildTech team...',
        submittedAt: past(18),
        updatedAt: past(5)
      }
    },
    {
      col: 'applications', id: 'app-002',
      data: {
        studentId: 'student-002',
        studentName: 'James Kumar',
        employerId: 'employer-002',
        opportunityId: 'opp-002',
        jobTitle: 'Software Engineer Internship',
        qualification: 'MSc Computer Science',
        status: 'interview',
        coverLetter: 'I have been building React applications for 2 years and am excited about the opportunity at TechFlow...',
        submittedAt: past(12),
        updatedAt: past(3)
      }
    },
    {
      col: 'applications', id: 'app-003',
      data: {
        studentId: 'student-005',
        studentName: 'Priya Sharma',
        employerId: 'employer-002',
        opportunityId: 'opp-004',
        jobTitle: 'Data Analyst — Graduate Scheme',
        qualification: 'MSc Data Science',
        status: 'submitted',
        submittedAt: past(5),
        updatedAt: past(5)
      }
    },
    {
      col: 'applications', id: 'app-004',
      data: {
        studentId: 'student-004',
        studentName: 'Alex Patel',
        employerId: 'employer-001',
        opportunityId: 'opp-003',
        jobTitle: 'Junior Structural Engineer',
        qualification: 'BEng Structural Engineering',
        status: 'reviewing',
        submittedAt: past(9),
        updatedAt: past(2)
      }
    },
    {
      col: 'applications', id: 'app-005',
      data: {
        studentId: 'student-001',
        studentName: 'Sarah Mitchell',
        employerId: 'employer-001',
        opportunityId: 'opp-003',
        jobTitle: 'Junior Structural Engineer',
        qualification: 'MEng Civil Engineering',
        status: 'submitted',
        submittedAt: past(7),
        updatedAt: past(7)
      }
    },
    {
      col: 'applications', id: 'app-006',
      data: {
        studentId: 'student-003',
        studentName: 'Emma Thompson',
        employerId: 'employer-003',
        opportunityId: 'opp-006',
        jobTitle: 'Project Management Graduate',
        qualification: 'BSc Business Management',
        status: 'submitted',
        submittedAt: past(4),
        updatedAt: past(4)
      }
    },
    {
      col: 'applications', id: 'app-007',
      data: {
        studentId: 'graduate-001',
        studentName: 'Liam Okafor',
        employerId: 'employer-001',
        opportunityId: 'opp-001',
        jobTitle: 'Graduate Civil Engineer',
        qualification: 'MEng Mechanical Engineering',
        status: 'placed',
        submittedAt: past(25),
        updatedAt: past(10)
      }
    }
  ];
}

function buildCoachingSessions() {
  return [
    // Completed past sessions
    {
      col: 'coachingSessions', id: 'cs-001',
      data: {
        coachId: 'coach-001',
        studentId: 'student-001',
        studentName: 'Sarah Mitchell',
        studentEmail: 's.mitchell@uni.ac.uk',
        sessionType: 'CV Review',
        date: past(14),
        time: '14:00',
        duration: 60,
        status: 'completed',
        rating: 5,
        notes: 'Reviewed civil engineering CV. Suggested tailoring for BuildTech role.',
        coachNote: 'Strong candidate. Needs to highlight project work more prominently.',
        createdAt: past(15),
        updatedAt: past(14)
      }
    },
    {
      col: 'coachingSessions', id: 'cs-002',
      data: {
        coachId: 'coach-001',
        studentId: 'student-002',
        studentName: 'James Kumar',
        studentEmail: 'j.kumar@uni.ac.uk',
        sessionType: 'Interview Prep',
        date: past(7),
        time: '10:00',
        duration: 45,
        status: 'completed',
        rating: 5,
        notes: 'Mock interview for TechFlow software engineering role.',
        coachNote: 'Excellent technical answers. Work on STAR technique for behavioural questions.',
        createdAt: past(8),
        updatedAt: past(7)
      }
    },
    {
      col: 'coachingSessions', id: 'cs-003',
      data: {
        coachId: 'coach-002',
        studentId: 'student-004',
        studentName: 'Alex Patel',
        studentEmail: 'a.patel@uni.ac.uk',
        sessionType: 'Career Planning',
        date: past(5),
        time: '11:00',
        duration: 60,
        status: 'completed',
        rating: 4,
        notes: 'Discussed pathway to ICE Chartership.',
        createdAt: past(6),
        updatedAt: past(5)
      }
    },

    // Upcoming confirmed sessions
    {
      col: 'coachingSessions', id: 'cs-004',
      data: {
        coachId: 'coach-001',
        studentId: 'student-003',
        studentName: 'Emma Thompson',
        studentEmail: 'e.thompson@uni.ac.uk',
        sessionType: 'Career Planning',
        date: ts(2),
        time: '15:30',
        duration: 60,
        status: 'confirmed',
        notes: 'Exploring project management opportunities.',
        createdAt: past(3),
        updatedAt: past(1)
      }
    },
    {
      col: 'coachingSessions', id: 'cs-005',
      data: {
        coachId: 'coach-001',
        studentId: 'student-005',
        studentName: 'Priya Sharma',
        studentEmail: 'p.sharma@uni.ac.uk',
        sessionType: 'CV Review',
        date: ts(4),
        time: '13:00',
        duration: 45,
        status: 'confirmed',
        notes: 'Reviewing data science CV for analyst roles.',
        createdAt: past(2),
        updatedAt: past(1)
      }
    },
    {
      col: 'coachingSessions', id: 'cs-006',
      data: {
        coachId: 'coach-002',
        studentId: 'student-001',
        studentName: 'Sarah Mitchell',
        studentEmail: 's.mitchell@uni.ac.uk',
        sessionType: 'Interview Prep',
        date: ts(6),
        time: '10:00',
        duration: 60,
        status: 'confirmed',
        notes: 'Follow-up mock interview for BuildTech shortlist.',
        createdAt: past(2),
        updatedAt: past(0)
      }
    },
    {
      col: 'coachingSessions', id: 'cs-007',
      data: {
        coachId: 'coach-002',
        studentId: 'student-002',
        studentName: 'James Kumar',
        studentEmail: 'j.kumar@uni.ac.uk',
        sessionType: 'Skills Assessment',
        date: ts(8),
        time: '14:00',
        duration: 60,
        status: 'pending',
        notes: 'Requested by student for technical skills gap analysis.',
        createdAt: past(1),
        updatedAt: past(0)
      }
    }
  ];
}

function buildEvents() {
  return [
    {
      col: 'events', id: 'event-001',
      data: {
        title: 'Graduate Recruitment Fair 2026',
        location: 'ExCeL London',
        type: 'career-fair',
        status: 'upcoming',
        date: ts(20),
        time: '10:00 - 18:00',
        capacity: 1200,
        registered: 487,
        description: 'Meet 200+ top UK employers hiring graduates across engineering, tech, and business.',
        createdBy: 'admin-001',
        createdAt: past(30),
        updatedAt: past(5)
      }
    },
    {
      col: 'events', id: 'event-002',
      data: {
        title: 'National Apprenticeship Show',
        location: 'ExCeL London',
        type: 'exhibition',
        status: 'upcoming',
        date: ts(44),
        time: '09:30 - 16:30',
        capacity: 800,
        registered: 213,
        description: 'Explore apprenticeship opportunities across all sectors.',
        createdBy: 'admin-001',
        createdAt: past(25),
        updatedAt: past(3)
      }
    },
    {
      col: 'events', id: 'event-003',
      data: {
        title: 'Civil Engineering & Infrastructure Careers Expo',
        location: 'ExCeL London',
        type: 'exhibition',
        status: 'upcoming',
        date: ts(27),
        time: '10:00 - 17:00',
        capacity: 600,
        registered: 134,
        description: 'Specialist event for civil and structural engineering graduates.',
        createdBy: 'admin-001',
        createdAt: past(20),
        updatedAt: past(2)
      }
    },
    {
      col: 'events', id: 'event-004',
      data: {
        title: 'Tech Talent London — Graduate Edition',
        location: 'ExCeL London',
        type: 'networking',
        status: 'upcoming',
        date: ts(54),
        time: '11:00 - 19:00',
        capacity: 500,
        registered: 89,
        description: 'Connect with tech startups and scale-ups hiring graduates in software, data, and product.',
        createdBy: 'admin-001',
        createdAt: past(15),
        updatedAt: past(1)
      }
    },
    {
      col: 'events', id: 'event-005',
      data: {
        title: 'CV & Interview Masterclass',
        location: 'Online (Zoom)',
        type: 'workshop',
        status: 'upcoming',
        date: ts(7),
        time: '18:00 - 19:30',
        capacity: 200,
        registered: 76,
        description: 'Free 90-minute session covering what employers really want to see and how to ace your interview.',
        createdBy: 'coach-001',
        createdAt: past(10),
        updatedAt: past(1)
      }
    }
  ];
}

function buildVideoPitches() {
  return [
    {
      col: 'video_pitches', id: 'vp-001',
      data: {
        userId: 'student-001',
        userName: 'Sarah Mitchell',
        title: 'Civil Engineer — Graduate Pitch',
        duration: 48,
        status: 'pending',
        url: '',
        createdAt: past(3),
        updatedAt: past(3)
      }
    },
    {
      col: 'video_pitches', id: 'vp-002',
      data: {
        userId: 'student-002',
        userName: 'James Kumar',
        title: 'Software Engineer — Internship Pitch',
        duration: 55,
        status: 'pending',
        url: '',
        createdAt: past(2),
        updatedAt: past(2)
      }
    },
    {
      col: 'video_pitches', id: 'vp-003',
      data: {
        userId: 'graduate-001',
        userName: 'Liam Okafor',
        title: 'Mechanical Engineer — Graduate Pitch',
        duration: 42,
        status: 'approved',
        url: '',
        createdAt: past(10),
        updatedAt: past(4)
      }
    }
  ];
}

function buildCvOptimizations() {
  return [
    {
      col: 'cv_optimizations', id: 'cv-001',
      data: {
        userId: 'student-001',
        userName: 'Sarah Mitchell',
        originalText: 'Civil engineering graduate with experience in...',
        optimizedText: 'Driven MEng Civil Engineering graduate with proven experience in AutoCAD, site management, and structural design...',
        status: 'completed',
        tokensUsed: 1240,
        createdAt: past(8)
      }
    },
    {
      col: 'cv_optimizations', id: 'cv-002',
      data: {
        userId: 'student-002',
        userName: 'James Kumar',
        originalText: 'CS student looking for software engineering internship...',
        optimizedText: 'MSc Computer Science candidate with hands-on experience in React, Node.js, and Python...',
        status: 'completed',
        tokensUsed: 980,
        createdAt: past(5)
      }
    }
  ];
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱  PlacementPortal — Firestore Seed\n');

  const collections = [
    { name: 'users',            records: buildUsers() },
    { name: 'opportunities',    records: buildOpportunities() },
    { name: 'applications',     records: buildApplications() },
    { name: 'coachingSessions', records: buildCoachingSessions() },
    { name: 'events',           records: buildEvents() },
    { name: 'video_pitches',    records: buildVideoPitches() },
    { name: 'cv_optimizations', records: buildCvOptimizations() }
  ];

  for (const { name, records } of collections) {
    const isEmpty = await collectionEmpty(name);

    if (!isEmpty && !force) {
      console.log(`⏭️   Skipped  ${name} (already has data — use --force to overwrite)`);
      continue;
    }

    await batchWrite(records);
    console.log(`✅  Seeded   ${name} (${records.length} records)`);
  }

  console.log('\n🎉  Seed complete!\n');
  console.log('👉  Open your app and log in as any seeded user.');
  console.log('    All dashboards should now show live Firestore data.\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err.message);
  console.error(err);
  process.exit(1);
});
