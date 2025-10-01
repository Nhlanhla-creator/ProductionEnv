// Test script for PaymentService
require("dotenv").config()

async function testPaymentService() {
  console.log("🧪 Testing PaymentService...")

  try {
    const PaymentService = require("../services/PaymentService")
    const paymentService = new PaymentService()

    console.log("✅ PaymentService initialized successfully")

    // Test access token generation
    console.log("\n🔐 Testing access token generation...")
    const token = await paymentService.getAccessToken()
    console.log("✅ Access token generated successfully")
    console.log("Token preview:", token.substring(0, 20) + "...")

    // Test payment session creation
    console.log("\n💳 Testing payment session creation...")
    const paymentData = {
      amount: 100.0,
      currency: "ZAR",
      userId: "test-user-123",
      customerEmail: "test@example.com",
      customerName: "Test User",
      actionType: "one_time",
    }

    const session = await paymentService.createPaymentSession(paymentData)
    console.log("✅ Payment session created successfully")
    console.log("Checkout ID:", session.checkoutId)
    console.log("Redirect URL:", session.redirectUrl)

    return session
  } catch (error) {
    console.error("❌ Test failed:", error.message)
    throw error
  }
}

// Run the test
testPaymentService()
  .then((result) => {
    console.log("\n🎉 All tests passed!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Tests failed:", error.message)
    process.exit(1)
  })
