/**
 * Create User Accounts Script
 * Creates test users for PlacementsPortal
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function createUser(email, password, displayName, role = 'student') {
  try {
    console.log(`\n🔵 Creating user: ${displayName} (${email})...`);
    
    // Create authentication user
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: true
    });
    
    console.log(`✅ Auth user created with UID: ${userRecord.uid}`);
    
    // Create Firestore profile
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      displayName: displayName,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      profile: {
        firstName: displayName.split(' ')[0],
        lastName: displayName.split(' ')[1] || '',
        phone: '',
        bio: '',
        skills: [],
        experience: [],
        education: []
      },
      tokens: {
        cv_optimizer: 0
      }
    });
    
    console.log(`✅ Firestore profile created`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Role: ${role}`);
    
    return userRecord;
    
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`⚠️  User ${email} already exists`);
      
      // Get existing user
      const existingUser = await auth.getUserByEmail(email);
      console.log(`ℹ️  Existing UID: ${existingUser.uid}`);
      
      // Update password
      await auth.updateUser(existingUser.uid, {
        password: password
      });
      console.log(`✅ Password updated to: ${password}`);
      
      // Update Firestore profile
      await db.collection('users').doc(existingUser.uid).set({
        displayName: displayName,
        role: role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      console.log(`✅ Profile updated`);
      
      return existingUser;
    } else {
      console.error(`❌ Error creating user ${email}:`, error.message);
      throw error;
    }
  }
}

async function main() {
  console.log('🚀 PlacementsPortal - User Creation Script\n');
  console.log('='.repeat(50));
  
  try {
    // Create Toluwani (Admin)
    await createUser(
      'toluwani@placementsportal.com',
      'Winner2021',
      'Toluwani',
      'admin'
    );
    
    // Create Grace (Admin)
    await createUser(
      'grace@placementsportal.com',
      'Winner2024',
      'Grace',
      'admin'
    );
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All users created successfully!\n');
    
    console.log('📋 Login Credentials:');
    console.log('\n1. Toluwani (Admin)');
    console.log('   Email: toluwani@placementsportal.com');
    console.log('   Password: Winner2021');
    console.log('   Dashboard: http://localhost:3000/dashboard/admin');
    
    console.log('\n2. Grace (Admin)');
    console.log('   Email: grace@placementsportal.com');
    console.log('   Password: Winner2024');
    console.log('   Dashboard: http://localhost:3000/dashboard/admin');
    
    console.log('\n🎉 You can now login at: http://localhost:3000/login\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

main();
