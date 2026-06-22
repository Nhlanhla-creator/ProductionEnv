// admin-reset.js
const admin = require('firebase-admin');

// Initialize with your service account (you need this!)
// Go to Firebase Console -> Settings -> Service Accounts -> Generate new private key
const serviceAccount = require("C:/Users/linde/Documents/tuts-7ea8c-firebase-adminsdk-xcz2v-aa8421e220.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// SIMPLE: Generate reset link
const email = process.argv[2] || 'info@khanyisaagri.co.za';

admin.auth().generatePasswordResetLink(email)
  .then((link) => {
    console.log('\n✅ Reset link for', email);
    console.log('🔗', link);
    console.log('\nCopy this link and open in browser\n');
  })
  .catch((error) => {
    console.log('❌ Error:', error.message);
  });