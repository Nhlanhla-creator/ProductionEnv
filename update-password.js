// update-password.js
const admin = require('firebase-admin');

const serviceAccount = require("C:/Users/linde/Documents/tuts-7ea8c-firebase-adminsdk-xcz2v-aa8421e220.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function updatePassword(email, newPassword) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, {
      password: newPassword
    });
    console.log(`✅ Password updated for ${email}`);
    console.log(`New password: ${newPassword}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const email = process.argv[2] || 'info@khanyisaagri.co.za';
const newPassword = process.argv[3] || 'NewSecurePassword123!';

updatePassword(email, newPassword);