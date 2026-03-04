/**
 * Setup Admin User Profiles
 * Creates Firestore profiles for Toluwani and Grace
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// User details with their UIDs
const users = [
  {
    uid: '2yhzWCsCz6cGMvXeqNyuR61sw442',
    email: 'toluwani@placementsportal.com',
    displayName: 'Toluwani',
    role: 'admin'
  },
  {
    uid: 'G5T1mO7vXdd44ITrn6SAqBy2bPV2',
    email: 'grace@placementsportal.com',
    displayName: 'Grace',
    role: 'admin'
  }
];

async function createProfile(user) {
  try {
    console.log(`\n🔵 Creating profile for ${user.displayName}...`);
    
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      profile: {
        firstName: user.displayName,
        lastName: '',
        phone: '',
        bio: '',
        skills: [],
        experience: [],
        education: []
      },
      tokens: {
        cv_optimizer: 10 // Give them 10 free tokens
      },
      settings: {
        emailNotifications: true,
        smsNotifications: false
      }
    });
    
    console.log(`✅ Profile created for ${user.displayName}`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    
  } catch (error) {
    console.error(`❌ Error creating profile for ${user.displayName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 PlacementsPortal - Setup Admin Profiles\n');
  console.log('='.repeat(60));
  
  try {
    for (const user of users) {
      await createProfile(user);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All admin profiles created successfully!\n');
    
    console.log('📋 Login Credentials:\n');
    
    console.log('1. Toluwani (Admin)');
    console.log('   Email: toluwani@placementsportal.com');
    console.log('   Password: Winner2021');
    console.log('   UID: 2yhzWCsCz6cGMvXeqNyuR61sw442');
    console.log('   Dashboard: http://localhost:3000/dashboard/admin\n');
    
    console.log('2. Grace (Admin)');
    console.log('   Email: grace@placementsportal.com');
    console.log('   Password: Winner2024');
    console.log('   UID: G5T1mO7vXdd44ITrn6SAqBy2bPV2');
    console.log('   Dashboard: http://localhost:3000/dashboard/admin\n');
    
    console.log('🎉 Ready to login at: http://localhost:3000/login\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

main();
