const admin = require("firebase-admin")

class SafeFirestoreService {
  constructor() {
    this.initialized = false
    this.db = null
    this.mode = "safe"

    try {
      // Check if Firebase environment variables are present
      const requiredVars = ["FIREBASE_PROJECT_ID", "FIREBASE_PRIVATE_KEY", "FIREBASE_CLIENT_EMAIL"]

      const missingVars = requiredVars.filter((varName) => !process.env[varName])

      if (missingVars.length > 0) {
        console.log("⚠️ SafeFirestoreService: Missing Firebase variables:", missingVars)
        console.log("⚠️ SafeFirestoreService: Running in mock mode")
        this.mode = "mock"
        return
      }

      // Try to initialize Firebase
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(
          process.env.FIREBASE_CLIENT_EMAIL,
        )}`,
      }

      // Initialize Firebase Admin if not already initialized
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID,
        })
      }

      this.db = admin.firestore()
      this.initialized = true
      this.mode = "firebase"
      console.log("✅ SafeFirestoreService: Firebase initialized successfully")
    } catch (error) {
      console.error("❌ SafeFirestoreService: Firebase initialization failed:", error.message)
      console.log("⚠️ SafeFirestoreService: Falling back to mock mode")
      this.mode = "mock"
      this.initialized = false
    }
  }

  static getStatus() {
    const instance = new SafeFirestoreService()
    return {
      initialized: instance.initialized,
      hasDatabase: instance.initialized,
      projectId: process.env.FIREBASE_PROJECT_ID || "not-configured",
      mode: instance.mode,
    }
  }

  async savePaymentRecord(data) {
    if (this.mode === "mock") {
      console.log("🔄 SafeFirestoreService (MOCK): savePaymentRecord called with:", data)
      return "mock-payment-id-" + Date.now()
    }

    try {
      const docRef = await this.db.collection("payments").add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      console.log("✅ SafeFirestoreService: Payment record saved with ID:", docRef.id)
      return docRef.id
    } catch (error) {
      console.error("❌ SafeFirestoreService: Error saving payment record:", error)
      throw error
    }
  }

  async updatePaymentRecord(data) {
    if (this.mode === "mock") {
      console.log("🔄 SafeFirestoreService (MOCK): updatePaymentRecord called with:", data)
      return true
    }

    try {
      const { checkoutId, ...updateData } = data
      const querySnapshot = await this.db.collection("payments").where("checkoutId", "==", checkoutId).get()

      if (querySnapshot.empty) {
        console.log("⚠️ SafeFirestoreService: No payment record found for checkoutId:", checkoutId)
        return false
      }

      const doc = querySnapshot.docs[0]
      await doc.ref.update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      console.log("✅ SafeFirestoreService: Payment record updated for checkoutId:", checkoutId)
      return true
    } catch (error) {
      console.error("❌ SafeFirestoreService: Error updating payment record:", error)
      throw error
    }
  }

  async saveSubscriptionRecord(data) {
    if (this.mode === "mock") {
      console.log("🔄 SafeFirestoreService (MOCK): saveSubscriptionRecord called with:", data)
      return "mock-subscription-id-" + Date.now()
    }

    try {
      const docRef = await this.db.collection("subscriptions").add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      console.log("✅ SafeFirestoreService: Subscription record saved with ID:", docRef.id)
      return docRef.id
    } catch (error) {
      console.error("❌ SafeFirestoreService: Error saving subscription record:", error)
      throw error
    }
  }

  async updateUserSubscription(userId, data) {
    if (this.mode === "mock") {
      console.log("🔄 SafeFirestoreService (MOCK): updateUserSubscription called with:", { userId, data })
      return true
    }

    try {
      const userRef = this.db.collection("users").doc(userId)
      await userRef.set(
        {
          subscription: {
            ...data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
        },
        { merge: true },
      )

      console.log("✅ SafeFirestoreService: User subscription updated for userId:", userId)
      return true
    } catch (error) {
      console.error("❌ SafeFirestoreService: Error updating user subscription:", error)
      throw error
    }
  }

  async saveCardRegistration(userId, data) {
    if (this.mode === "mock") {
      console.log("🔄 SafeFirestoreService (MOCK): saveCardRegistration called with:", { userId, data })
      return true
    }

    try {
      const cardRef = this.db.collection("users").doc(userId).collection("cards").doc()
      await cardRef.set({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      console.log("✅ SafeFirestoreService: Card registration saved for userId:", userId)
      return cardRef.id
    } catch (error) {
      console.error("❌ SafeFirestoreService: Error saving card registration:", error)
      throw error
    }
  }

  async getUserSubscription(userId) {
    if (this.mode === "mock") {
      console.log("🔄 SafeFirestoreService (MOCK): getUserSubscription called with:", userId)
      return null
    }

    try {
      const userDoc = await this.db.collection("users").doc(userId).get()
      if (userDoc.exists) {
        const userData = userDoc.data()
        return userData.subscription || null
      }
      return null
    } catch (error) {
      console.error("❌ SafeFirestoreService: Error getting user subscription:", error)
      throw error
    }
  }

  async getPaymentRecord(checkoutId) {
    if (this.mode === "mock") {
      console.log("🔄 SafeFirestoreService (MOCK): getPaymentRecord called with:", checkoutId)
      return null
    }

    try {
      const querySnapshot = await this.db.collection("payments").where("checkoutId", "==", checkoutId).get()

      if (querySnapshot.empty) {
        return null
      }

      const doc = querySnapshot.docs[0]
      return { id: doc.id, ...doc.data() }
    } catch (error) {
      console.error("❌ SafeFirestoreService: Error getting payment record:", error)
      throw error
    }
  }
}

module.exports = new SafeFirestoreService()
