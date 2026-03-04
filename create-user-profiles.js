/**
 * Create Firestore User Profiles
 * For users already in Firebase Authentication
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function createUserProfile(email, displayName, role = 'admin') {
  try {
    console.log(`\n🔵 Creating profile for: ${email}...`);
    
    // Get user from Authentication
    const userRecord = await auth.getUserByEmail(email);
    console.log(`✅ Found auth user with UID: ${userRecord.uid}`);
    
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
      },
      settings: {
        emailNotifications: true,
        smsNotifications: false
      }
    });
    
    console.log(`✅ Firestore profile created`);
    console.log(`👤 Role: ${role}`);
    console.log(`📧 Email: ${email}`);
    
    return userRecord;
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ User ${email} not found in Authentication`);
      console.log(`   Please create the auth user first in Firebase Console`);
    } else {
      console.error(`❌ Error creating profile for ${email}:`, error.message);
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 PlacementsPortal - Create User Profiles\n');
  console.log('='.repeat(50));
  
  try {
    // Create Toluwani's profile
    await createUserProfile(
      'toluwani@placementsportal.com',
      'Toluwani',
      'admin'
    );
    
    // Create Grace's profile
    await createUserProfile(
      'grace@placementsportal.com',
      'Grace',
      'admin'
    );
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All user profiles created successfully!\n');
    
    console.log('📋 You can now login:');
    console.log('\n1. Toluwani (Admin)');
    console.log('   Email: toluwani@placementsportal.com');
    console.log('   Password: Winner2021');
    console.log('   Dashboard: http://localhost:3000/dashboard/admin');
    
    console.log('\n2. Grace (Admin)');
    console.log('   Email: grace@placementsportal.com');
    console.log('   Password: Winner2024');
    console.log('   Dashboard: http://localhost:3000/dashboard/admin');
    
    console.log('\n🎉 Login at: http://localhost:3000/login\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

main();
