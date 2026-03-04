/**
 * Update Grace's Role from Admin to Student
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function updateGraceRole() {
  try {
    console.log('\n🔵 Updating Grace\'s role...\n');
    
    // Get Grace's user record
    const userRecord = await auth.getUserByEmail('grace@placementsportal.com');
    const uid = userRecord.uid;
    
    console.log(`✅ Found Grace's account`);
    console.log(`   UID: ${uid}`);
    console.log(`   Email: ${userRecord.email}`);
    
    // Update Firestore profile
    await db.collection('users').doc(uid).update({
      role: 'student',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`\n✅ Role updated successfully!`);
    console.log(`   Old Role: admin`);
    console.log(`   New Role: student`);
    
    console.log(`\n📋 Login Details:`);
    console.log(`   Email: grace@placementsportal.com`);
    console.log(`   Password: Winner2024`);
    console.log(`   Dashboard: http://localhost:3000/dashboard/student`);
    
    console.log(`\n🎉 Done! Grace can now access the student dashboard.\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error(`\n❌ Error updating Grace's role:`, error.message);
    process.exit(1);
  }
}

updateGraceRole();
