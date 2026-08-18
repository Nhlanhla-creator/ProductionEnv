const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDfcXO4GbNdPFY7qGbjwH1z3A78FwXiFAE",
  authDomain: "tuts-7ea8c.firebaseapp.com",
  projectId: "tuts-7ea8c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

async function inspect() {
  console.log("--- FETCHING FROM universalProfiles ---");
  const upSnap = await db.collection("universalProfiles").limit(5).get();
  upSnap.forEach(doc => {
    const data = doc.data();
    console.log(`Document ID: ${doc.id}`);
    console.log(`registeredName: ${data.entityOverview?.registeredName || data.registeredName}`);
    console.log(`bigScore type: ${typeof data.bigScore}, value:`, data.bigScore);
    console.log(`keys at root: ${Object.keys(data).join(", ")}`);
    if (data.bigScore && typeof data.bigScore === 'object') {
      console.log(`bigScore fields:`, data.bigScore);
    }
    console.log("------------------------");
  });

  console.log("\n--- FETCHING FROM bigEvaluations ---");
  const beSnap = await db.collection("bigEvaluations").limit(5).get();
  beSnap.forEach(doc => {
    const data = doc.data();
    console.log(`Document ID: ${doc.id}`);
    console.log(`smeName: ${data.smeName}`);
    console.log(`scores:`, data.scores);
    console.log("------------------------");
  });

  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
