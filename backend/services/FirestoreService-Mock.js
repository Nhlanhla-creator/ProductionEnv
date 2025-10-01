
// Mock FirestoreService for testing when Firebase is not configured
class MockFirestoreService {
  constructor() {
    this.initialized = false
    console.log("⚠️ MockFirestoreService: Firebase not configured, using mock mode")
  }

  static getStatus() {
    return {
      initialized: false,
      hasDatabase: false,
      projectId: 'mock-project',
      mode: 'mock'
    }
  }

  async savePaymentRecord(data) {
    console.log("🔄 MockFirestoreService: savePaymentRecord called with:", data)
    return "mock-payment-id-" + Date.now()
  }

  async updatePaymentRecord(data) {
    console.log("🔄 MockFirestoreService: updatePaymentRecord called with:", data)
    return true
  }

  async saveSubscriptionRecord(data) {
    console.log("🔄 MockFirestoreService: saveSubscriptionRecord called with:", data)
    return "mock-subscription-id-" + Date.now()
  }

  async updateUserSubscription(userId, data) {
    console.log("🔄 MockFirestoreService: updateUserSubscription called with:", { userId, data })
    return true
  }

  async saveCardRegistration(userId, data) {
    console.log("🔄 MockFirestoreService: saveCardRegistration called with:", { userId, data })
    return true
  }

  async getUserSubscription(userId) {
    console.log("🔄 MockFirestoreService: getUserSubscription called with:", userId)
    return null
  }

  async getPaymentRecord(checkoutId) {
    console.log("🔄 MockFirestoreService: getPaymentRecord called with:", checkoutId)
    return null
  }
}

module.exports = new MockFirestoreService()
