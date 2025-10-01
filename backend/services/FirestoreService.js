const admin = require("firebase-admin")

class FirestoreService {
  constructor() {
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
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

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
      })

      console.log("🔥 Firebase Admin initialized successfully")
    }

    this.db = admin.firestore()
    // FIXED: Configure Firestore to ignore undefined properties
    this.db.settings({ ignoreUndefinedProperties: true })
  }

  // ENHANCED: Helper function to clean data and remove undefined values
  cleanFirestoreData(data) {
    if (!data || typeof data !== 'object') {
      return data
    }

    const cleaned = {}
    Object.keys(data).forEach(key => {
      const value = data[key]
      
      // Skip undefined, null, and string "undefined" values
      if (value === undefined || value === null || value === "undefined") {
        console.log(`🧹 Removing undefined field: ${key}`)
        return
      }
      
      // Handle nested objects
      if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        const cleanedNested = this.cleanFirestoreData(value)
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested
        }
      } else {
        cleaned[key] = value
      }
    })
    
    return cleaned
  }

  // ENHANCED: Better subscription handling with data cleaning
  async updateUserSubscription(userId, subscriptionData) {
    try {
      console.log("💾 Updating user subscription:", { userId, subscriptionData })

      if (!userId) {
        console.error("❌ No userId provided for subscription update")
        return null
      }

      const userRef = this.db.collection("users").doc(userId)

      // Check if user document exists first
      const userDoc = await userRef.get()

      // FIXED: Clean subscription data to remove undefined values
      const cleanSubscriptionData = this.cleanFirestoreData(subscriptionData)

      const enhancedSubscriptionData = {
        ...cleanSubscriptionData,
        updatedAt: new Date().toISOString(),
        // Ensure these critical fields are set
        isActive: cleanSubscriptionData.isActive !== undefined ? cleanSubscriptionData.isActive : true,
        status: cleanSubscriptionData.status || "active",
        planName: cleanSubscriptionData.planName || "Premium Plan",
        billingCycle: cleanSubscriptionData.billingCycle || "monthly"
      }

      if (!userDoc.exists) {
        console.log("👤 User document doesn't exist, creating it first...")

        // Create user document with basic info
        const newUserData = this.cleanFirestoreData({
          userId: userId,
          createdAt: new Date().toISOString(),
          email: cleanSubscriptionData.customerEmail || "unknown@example.com",
          subscription: enhancedSubscriptionData,
          // Add subscription status at user level for easy querying
          hasActiveSubscription: enhancedSubscriptionData.isActive,
          subscriptionPlan: enhancedSubscriptionData.planName,
          subscriptionStatus: enhancedSubscriptionData.status
        })

        await userRef.set(newUserData)
        console.log("✅ User document created with subscription data")
      } else {
        // Update existing user document
        const updateData = this.cleanFirestoreData({
          subscription: enhancedSubscriptionData,
          lastUpdated: new Date().toISOString(),
          // Update subscription status at user level
          hasActiveSubscription: enhancedSubscriptionData.isActive,
          subscriptionPlan: enhancedSubscriptionData.planName,
          subscriptionStatus: enhancedSubscriptionData.status,
          // If email is provided, update it
          ...(cleanSubscriptionData.customerEmail && { email: cleanSubscriptionData.customerEmail })
        })

        await userRef.update(updateData)
        console.log("✅ User subscription updated successfully")
      }

      // ALSO save to dedicated subscriptions collection for better querying
      try {
        const subscriptionRef = this.db.collection("subscriptions").doc(userId)
        
        const cleanSubscriptionForCollection = this.cleanFirestoreData({
          userId: userId,
          ...enhancedSubscriptionData,
          // Additional metadata
          updatedAt: new Date().toISOString()
        })
        
        await subscriptionRef.set(cleanSubscriptionForCollection, { merge: true })
        console.log("✅ Subscription also saved to subscriptions collection")
      } catch (subError) {
        console.error("⚠️ Failed to save to subscriptions collection:", subError)
      }

      return userId
    } catch (error) {
      console.error("❌ Error updating user subscription:", error)
      return null
    }
  }

  // ENHANCED: Better payment record handling with data cleaning
  async savePaymentRecord(paymentData) {
    try {
      console.log("💾 Saving payment record:", paymentData)

      if (!paymentData.userId) {
        console.error("❌ No userId provided for payment record")
        return null
      }

      const paymentRef = this.db.collection("payments").doc()
      
      // FIXED: Clean payment data before saving
      const cleanedPaymentData = this.cleanFirestoreData(paymentData)
      
      const paymentRecord = this.cleanFirestoreData({
        ...cleanedPaymentData,
        id: paymentRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Ensure status is set
        status: cleanedPaymentData.status || "pending",
        // Set default values for common fields that might be undefined
        amount: cleanedPaymentData.amount || 0,
        currency: cleanedPaymentData.currency || "ZAR",
        type: cleanedPaymentData.type || "payment"
      })

      console.log("🧹 Cleaned payment record:", paymentRecord)

      await paymentRef.set(paymentRecord)
      console.log("✅ Payment record saved with ID:", paymentRef.id)

      // ALSO update user's payment history
      try {
        const userRef = this.db.collection("users").doc(paymentData.userId)
        const userUpdateData = this.cleanFirestoreData({
          [`payments.${paymentRef.id}`]: {
            amount: cleanedPaymentData.amount || 0,
            currency: cleanedPaymentData.currency || "ZAR",
            status: cleanedPaymentData.status || "pending",
            createdAt: paymentRecord.createdAt,
            ...(cleanedPaymentData.toolName && { toolName: cleanedPaymentData.toolName }),
            ...(cleanedPaymentData.planName && { planName: cleanedPaymentData.planName })
          },
          lastPayment: paymentRecord.createdAt,
          lastUpdated: new Date().toISOString()
        })
        
        await userRef.update(userUpdateData)
        console.log("✅ User payment history updated")
      } catch (userError) {
        console.log("⚠️ Could not update user payment history:", userError.message)
      }

      return paymentRef.id
    } catch (error) {
      console.error("❌ Error saving payment record:", error)
      console.error("❌ Original payment data:", paymentData)
      return null
    }
  }

  // ENHANCED: Better payment record updates with data cleaning
  async updatePaymentRecord(updateData) {
    try {
      console.log("💾 Updating payment record:", updateData)

      if (!updateData.checkoutId && !updateData.transactionId) {
        console.log("⚠️ No checkout ID or transaction ID provided for payment update")
        return null
      }

      // Find payment by checkout ID or transaction ID
      let paymentsQuery = this.db.collection("payments").limit(1)
      
      if (updateData.checkoutId) {
        paymentsQuery = paymentsQuery.where("checkoutId", "==", updateData.checkoutId)
      } else if (updateData.transactionId) {
        paymentsQuery = paymentsQuery.where("transactionId", "==", updateData.transactionId)
      }

      const paymentsResult = await paymentsQuery.get()

      if (paymentsResult.empty) {
        console.log("⚠️ No payment record found, creating new one")
        // Create new payment record instead of failing
        const newPaymentData = this.cleanFirestoreData({
          checkoutId: updateData.checkoutId,
          transactionId: updateData.transactionId,
          status: updateData.status || "completed",
          completedAt: updateData.completedAt || new Date().toISOString(),
          amount: updateData.amount || 0,
          currency: updateData.currency || "ZAR",
          userId: updateData.userId,
          type: "one_time",
          ...(updateData.toolName && { toolName: updateData.toolName }),
          ...(updateData.planName && { planName: updateData.planName })
        })
        
        return this.savePaymentRecord(newPaymentData)
      }

      const paymentDoc = paymentsResult.docs[0]
      
      // FIXED: Clean update data before saving
      const cleanedUpdateData = this.cleanFirestoreData({
        ...updateData,
        updatedAt: new Date().toISOString()
      })

      await paymentDoc.ref.update(cleanedUpdateData)
      console.log("✅ Payment record updated successfully")

      // Update user's payment history if userId is available
      if (updateData.userId || paymentDoc.data().userId) {
        try {
          const userId = updateData.userId || paymentDoc.data().userId
          const userRef = this.db.collection("users").doc(userId)
          
          const userUpdateData = this.cleanFirestoreData({
            [`payments.${paymentDoc.id}.status`]: updateData.status || "completed",
            [`payments.${paymentDoc.id}.completedAt`]: updateData.completedAt || new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          })
          
          await userRef.update(userUpdateData)
          console.log("✅ User payment history updated")
        } catch (userError) {
          console.log("⚠️ Could not update user payment history:", userError.message)
        }
      }

      return paymentDoc.id
    } catch (error) {
      console.error("❌ Error updating payment record:", error)
      return null
    }
  }

  // ENHANCED: Better subscription record handling with data cleaning
  async saveSubscriptionRecord(subscriptionData) {
    try {
      console.log("💾 Saving subscription record:", subscriptionData)

      if (!subscriptionData.userId) {
        console.error("❌ No userId provided for subscription record")
        return null
      }

      // Use userId as document ID for easier querying
      const subscriptionRef = this.db.collection("subscriptions").doc(subscriptionData.userId)
      
      // FIXED: Clean subscription data before saving
      const cleanedSubscriptionData = this.cleanFirestoreData(subscriptionData)
      
      const subscriptionRecord = this.cleanFirestoreData({
        ...cleanedSubscriptionData,
        id: subscriptionData.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Ensure required fields
        status: cleanedSubscriptionData.status || "active",
        isActive: cleanedSubscriptionData.isActive !== undefined ? cleanedSubscriptionData.isActive : true
      })

      await subscriptionRef.set(subscriptionRecord, { merge: true })
      console.log("✅ Subscription record saved with ID:", subscriptionData.userId)
      return subscriptionData.userId
    } catch (error) {
      console.error("❌ Error saving subscription record:", error)
      return null
    }
  }

  // ENHANCED: Get user subscription with better error handling
  async getUserSubscription(userId) {
    try {
      console.log("🔍 Getting user subscription:", userId)

      if (!userId) {
        console.error("❌ No userId provided")
        return null
      }

      // First try to get from user document
      const userRef = this.db.collection("users").doc(userId)
      const userDoc = await userRef.get()

      if (userDoc.exists) {
        const userData = userDoc.data()
        if (userData.subscription) {
          console.log("✅ Found subscription in user document")
          return userData.subscription
        }
      }

      // Fallback: try dedicated subscriptions collection
      const subscriptionRef = this.db.collection("subscriptions").doc(userId)
      const subscriptionDoc = await subscriptionRef.get()

      if (subscriptionDoc.exists) {
        console.log("✅ Found subscription in subscriptions collection")
        return subscriptionDoc.data()
      }

      console.log("ℹ️ No subscription found for user:", userId)
      return null
    } catch (error) {
      console.error("❌ Error getting user subscription:", error)
      return null
    }
  }

  // NEW: Check if user has active subscription (quick method)
  async hasActiveSubscription(userId) {
    try {
      console.log("🔍 Checking active subscription for:", userId)

      if (!userId) {
        return false
      }

      const userRef = this.db.collection("users").doc(userId)
      const userDoc = await userRef.get()

      if (!userDoc.exists) {
        return false
      }

      const userData = userDoc.data()
      
      // Check user-level subscription flags first (faster)
      if (userData.hasActiveSubscription === true && userData.subscriptionStatus === "active") {
        console.log("✅ User has active subscription (quick check)")
        return true
      }

      // Fallback: check subscription object
      if (userData.subscription && userData.subscription.isActive && userData.subscription.status === "active") {
        console.log("✅ User has active subscription (detailed check)")
        return true
      }

      console.log("ℹ️ User does not have active subscription")
      return false
    } catch (error) {
      console.error("❌ Error checking active subscription:", error)
      return false
    }
  }

  // ENHANCED: Get payment record with better search
  async getPaymentRecord(identifier) {
    try {
      console.log("🔍 Getting payment record for:", identifier)

      if (!identifier) {
        return null
      }

      // Try to find by checkoutId first
      let paymentsQuery = await this.db.collection("payments")
        .where("checkoutId", "==", identifier)
        .limit(1)
        .get()

      if (!paymentsQuery.empty) {
        const paymentDoc = paymentsQuery.docs[0]
        console.log("✅ Found payment by checkoutId")
        return {
          id: paymentDoc.id,
          ...paymentDoc.data(),
        }
      }

      // Try to find by transactionId
      paymentsQuery = await this.db.collection("payments")
        .where("transactionId", "==", identifier)
        .limit(1)
        .get()

      if (!paymentsQuery.empty) {
        const paymentDoc = paymentsQuery.docs[0]
        console.log("✅ Found payment by transactionId")
        return {
          id: paymentDoc.id,
          ...paymentDoc.data(),
        }
      }

      // Try to find by merchantTransactionId
      paymentsQuery = await this.db.collection("payments")
        .where("merchantTransactionId", "==", identifier)
        .limit(1)
        .get()

      if (!paymentsQuery.empty) {
        const paymentDoc = paymentsQuery.docs[0]
        console.log("✅ Found payment by merchantTransactionId")
        return {
          id: paymentDoc.id,
          ...paymentDoc.data(),
        }
      }

      console.log("💳 No payment record found for identifier:", identifier)
      return null
    } catch (error) {
      console.error("❌ Error getting payment record:", error)
      return null
    }
  }

  // NEW: Get user's payment history
  async getUserPayments(userId, limit = 10) {
    try {
      console.log("🔍 Getting payment history for user:", userId)

      if (!userId) {
        return []
      }

      const paymentsQuery = await this.db.collection("payments")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get()

      const payments = []
      paymentsQuery.forEach(doc => {
        payments.push({
          id: doc.id,
          ...doc.data()
        })
      })

      console.log(`✅ Found ${payments.length} payments for user`)
      return payments
    } catch (error) {
      console.error("❌ Error getting user payments:", error)
      return []
    }
  }

  // ENHANCED: Save card registration with better error handling and data cleaning
  async saveCardRegistration(userId, cardData) {
    try {
      console.log("💳 Saving card registration:", { userId, cardData })

      if (!userId) {
        console.error("❌ No userId provided for card registration")
        return null
      }

      const cardRef = this.db.collection("users").doc(userId).collection("cards").doc()
      
      // FIXED: Clean card data before saving
      const cleanedCardData = this.cleanFirestoreData(cardData)
      
      const cardRecord = this.cleanFirestoreData({
        ...cleanedCardData,
        id: cardRef.id,
        userId: userId,
        createdAt: new Date().toISOString(),
        isActive: true
      })

      await cardRef.set(cardRecord)
      console.log("✅ Card registration saved with ID:", cardRef.id)

      // Update user document to indicate they have saved cards
      try {
        const userRef = this.db.collection("users").doc(userId)
        const userUpdateData = this.cleanFirestoreData({
          hasSavedCards: true,
          lastCardAdded: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        })
        
        await userRef.update(userUpdateData)
        console.log("✅ User document updated with card info")
      } catch (userError) {
        console.log("⚠️ Could not update user document:", userError.message)
      }

      return cardRef.id
    } catch (error) {
      console.error("❌ Error saving card registration:", error)
      return null
    }
  }

  // NEW: Deactivate user subscription with data cleaning
  async deactivateSubscription(userId, reason = "cancelled") {
    try {
      console.log("🚫 Deactivating subscription for user:", userId)

      if (!userId) {
        console.error("❌ No userId provided")
        return false
      }

      const userRef = this.db.collection("users").doc(userId)
      const subscriptionRef = this.db.collection("subscriptions").doc(userId)

      const deactivationData = this.cleanFirestoreData({
        isActive: false,
        status: "cancelled",
        deactivatedAt: new Date().toISOString(),
        deactivationReason: reason,
        updatedAt: new Date().toISOString()
      })

      // Update user document
      const userUpdateData = this.cleanFirestoreData({
        subscription: deactivationData,
        hasActiveSubscription: false,
        subscriptionStatus: "cancelled",
        lastUpdated: new Date().toISOString()
      })
      
      await userRef.update(userUpdateData)

      // Update subscriptions collection
      await subscriptionRef.update(deactivationData)

      console.log("✅ Subscription deactivated successfully")
      return true
    } catch (error) {
      console.error("❌ Error deactivating subscription:", error)
      return false
    }
  }

  // Helper method to test database connection
  async testConnection() {
    try {
      console.log("🧪 Testing Firestore connection...")
      const testRef = this.db.collection("test").doc("connection")
      const testData = this.cleanFirestoreData({
        timestamp: new Date().toISOString(),
        test: true,
      })
      
      await testRef.set(testData)
      await testRef.delete()
      console.log("✅ Firestore connection test successful")
      return true
    } catch (error) {
      console.error("❌ Firestore connection test failed:", error)
      return false
    }
  }

  // NEW: Clean up old test data
  async cleanupTestData() {
    try {
      console.log("🧹 Cleaning up test data...")
      
      const testRef = this.db.collection("test")
      const snapshot = await testRef.get()
      
      const batch = this.db.batch()
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      
      await batch.commit()
      console.log("✅ Test data cleaned up")
      return true
    } catch (error) {
      console.error("❌ Error cleaning up test data:", error)
      return false
    }
  }

  // NEW: Get subscription statistics
  async getSubscriptionStats() {
    try {
      console.log("📊 Getting subscription statistics...")

      const activeSubscriptions = await this.db.collection("subscriptions")
        .where("isActive", "==", true)
        .where("status", "==", "active")
        .get()

      const totalSubscriptions = await this.db.collection("subscriptions").get()

      const stats = {
        totalSubscriptions: totalSubscriptions.size,
        activeSubscriptions: activeSubscriptions.size,
        inactiveSubscriptions: totalSubscriptions.size - activeSubscriptions.size,
        timestamp: new Date().toISOString()
      }

      console.log("✅ Subscription stats:", stats)
      return stats
    } catch (error) {
      console.error("❌ Error getting subscription stats:", error)
      return null
    }
  }

  // NEW: Bulk save method with error recovery
  async bulkSave(collection, documents) {
    try {
      console.log(`📦 Bulk saving ${documents.length} documents to ${collection}`)
      
      const batch = this.db.batch()
      const collectionRef = this.db.collection(collection)
      
      documents.forEach(doc => {
        const cleanDoc = this.cleanFirestoreData(doc)
        const docRef = doc.id ? collectionRef.doc(doc.id) : collectionRef.doc()
        batch.set(docRef, cleanDoc, { merge: true })
      })
      
      await batch.commit()
      console.log(`✅ Bulk save completed for ${documents.length} documents`)
      return true
    } catch (error) {
      console.error("❌ Error in bulk save:", error)
      return false
    }
  }

  // NEW: Data validation helper
  validateRequiredFields(data, requiredFields) {
    const missing = []
    requiredFields.forEach(field => {
      if (!data[field] || data[field] === undefined || data[field] === "undefined") {
        missing.push(field)
      }
    })
    
    if (missing.length > 0) {
      console.error(`❌ Missing required fields: ${missing.join(', ')}`)
      return { valid: false, missing }
    }
    
    return { valid: true, missing: [] }
  }
}

module.exports = new FirestoreService()