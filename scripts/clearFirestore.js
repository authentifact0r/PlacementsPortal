/**
 * PlacementPortal — Firestore Clear Script
 * ─────────────────────────────────────────
 * Deletes all seed data from every collection so you can re-seed
 * from scratch.
 *
 * ⚠️  This only deletes documents whose IDs match the seed script's
 *     known IDs (prefixed: admin-, coach-, employer-, student-, etc.)
 *     It will NOT touch any real user data you've added manually.
 *
 * Usage:
 *   npm run clear             ← careful — destructive!
 *   node scripts/clearFirestore.js
 */

'use strict';

const path = require('path');
const fs   = require('fs');

let admin;
try {
  admin = require('firebase-admin');
} catch {
  console.error('❌  firebase-admin not found. Run: npm install --save-dev firebase-admin');
  process.exit(1);
}

const keyPath = path.resolve(__dirname, '..', 'serviceAccountKey.json');

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
} else if (fs.existsSync(keyPath)) {
  admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
} else {
  console.error('❌  No Firebase credentials found. See scripts/seedFirestore.js for setup instructions.');
  process.exit(1);
}

const db = admin.firestore();

// All document IDs created by the seed script
const SEED_IDS = {
  users:            ['admin-001', 'coach-001', 'coach-002', 'employer-001', 'employer-002', 'employer-003', 'student-001', 'student-002', 'student-003', 'student-004', 'student-005', 'graduate-001'],
  opportunities:    ['opp-001', 'opp-002', 'opp-003', 'opp-004', 'opp-005', 'opp-006'],
  applications:     ['app-001', 'app-002', 'app-003', 'app-004', 'app-005', 'app-006', 'app-007'],
  coachingSessions: ['cs-001', 'cs-002', 'cs-003', 'cs-004', 'cs-005', 'cs-006', 'cs-007'],
  events:           ['event-001', 'event-002', 'event-003', 'event-004', 'event-005'],
  video_pitches:    ['vp-001', 'vp-002', 'vp-003'],
  cv_optimizations: ['cv-001', 'cv-002']
};

async function clear() {
  console.log('\n🗑️   PlacementPortal — Clearing Firestore seed data\n');

  for (const [col, ids] of Object.entries(SEED_IDS)) {
    const batch = db.batch();
    for (const id of ids) {
      batch.delete(db.collection(col).doc(id));
    }
    await batch.commit();
    console.log(`🧹  Cleared  ${col} (${ids.length} documents)`);
  }

  console.log('\n✅  All seed data cleared.');
  console.log('    Run  npm run seed  to re-populate.\n');
  process.exit(0);
}

clear().catch(err => {
  console.error('\n❌  Clear failed:', err.message);
  process.exit(1);
});
