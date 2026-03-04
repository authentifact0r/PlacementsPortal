/**
 * Grant Premium Access Script
 * ─────────────────────────────
 * Searches for a user by email/name in Firestore and grants them
 * full premium access for testing purposes.
 *
 * Usage:
 *   node scripts/grantPremium.js grace
 *   node scripts/grantPremium.js grace@example.com
 */

'use strict';

const path  = require('path');
const admin = require('firebase-admin');

const keyPath = path.resolve(__dirname, '..', 'serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(keyPath))
  });
}

const db = admin.firestore();

// ── Premium access payload ────────────────────────────────────────────────────
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const expiry      = admin.firestore.Timestamp.fromDate(new Date(Date.now() + ONE_YEAR_MS));

const FULL_PREMIUM = {
  studentPremium: {
    active:          true,
    status:          'active',
    stripeSubscriptionId: 'manual_grant_test',
    currentPeriodEnd: expiry
  },
  cvReview: {
    active:          true,
    status:          'active',
    stripePaymentIntentId: 'manual_grant_test',
    currentPeriodEnd: expiry
  },
  coaching: {
    active:          true,
    status:          'active',
    stripePaymentIntentId: 'manual_grant_test',
    currentPeriodEnd: expiry
  },
  aiApplier: {
    active:          true,
    status:          'active',
    stripeSubscriptionId: 'manual_grant_test',
    currentPeriodEnd: expiry
  },
  pitchTokens: {
    active: true,
    tokens: 500
  }
};

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  const query = (process.argv[2] || '').toLowerCase().trim();
  if (!query) {
    console.error('Usage: node scripts/grantPremium.js <name-or-email>');
    process.exit(1);
  }

  console.log(`\n🔍  Searching users for "${query}"...`);

  const snapshot = await db.collection('users').get();
  const matches  = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const name  = (data.displayName || data.name || data.profile?.firstName || '').toLowerCase();
    const email = (data.email || '').toLowerCase();

    if (name.includes(query) || email.includes(query)) {
      matches.push({ id: doc.id, name: data.displayName || data.name || 'Unknown', email: data.email || '', role: data.role || '' });
    }
  });

  if (matches.length === 0) {
    console.error(`❌  No users found matching "${query}"`);
    process.exit(1);
  }

  console.log(`\n✅  Found ${matches.length} matching user(s):\n`);
  matches.forEach((u, i) => {
    console.log(`  [${i}] ${u.name} — ${u.email} (${u.role}) — uid: ${u.id}`);
  });

  // Grant all matches (usually just one)
  for (const user of matches) {
    console.log(`\n💎  Granting full premium access to ${user.name} (${user.email})...`);
    await db.collection('users').doc(user.id).set(
      { premium: FULL_PREMIUM },
      { merge: true }
    );
    console.log(`✅  Done — premium.studentPremium.active = true, expires in 1 year`);
    console.log(`    Tokens granted: 500`);
  }

  console.log('\n🎉  Premium access granted. You can now test all paid features.\n');
  process.exit(0);
}

run().catch(err => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
