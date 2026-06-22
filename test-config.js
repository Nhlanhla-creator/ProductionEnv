// test-config.js
const admin = require('firebase-admin');

const serviceAccount = require("C:/Users/linde/Documents/tuts-7ea8c-firebase-adminsdk-xcz2v-aa8421e220.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Test if we can get user info
async function testConfig() {
  try {
    const email = 'fake@email.com';
    const user = await admin.auth().getUserByEmail(email);
    console.log('✅ User found:', user.uid);
    return user;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('⚠️ User not found. Creating test user...');
      try {
        const newUser = await admin.auth().createUser({
          email: 'fake@email.com',
          password: 'Test123456',
          emailVerified: true
        });
        console.log('✅ Test user created:', newUser.uid);
        return newUser;
      } catch (createError) {
        console.error('❌ Cannot create user:', createError.message);
      }
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testConfig();