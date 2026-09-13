const admin = require("firebase-admin");

const serviceAccount = require(
  "C:/Users/linde/Documents/tuts-7ea8c-firebase-adminsdk-xcz2v-aa8421e220.json"
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function recreateUserWithOldUid(oldUid, email, password) {
  try {
    console.log("Project:", serviceAccount.project_id);
    console.log("Creating user...");
    console.log("UID:", oldUid);
    console.log("Email:", email);

    const userRecord = await admin.auth().createUser({
      uid: oldUid,
      email: email,
      password: password,
      emailVerified: false,
    });

    console.log("\n✅ User successfully created");
    console.log("UID:", userRecord.uid);
    console.log("Email:", userRecord.email);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error creating user:");
    console.error(error);
    process.exit(1);
  }
}

const [oldUid, email, password] = process.argv.slice(2);

if (!oldUid || !email || !password) {
  console.error(`
Usage:
node reassignuid.js <OLD_UID> <EMAIL> <PASSWORD>

Example:
node reassignuid.js abc123XYZ lindelanixaba22@gmail.com "Testing@2"
  `);

  process.exit(1);
}

recreateUserWithOldUid(oldUid, email, password);