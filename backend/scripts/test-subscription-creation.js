// Test script for subscription creation
require("dotenv").config()

async function testSubscriptionCreation() {
  console.log("🧪 Testing subscription creation...")

  try {
    const PaymentService = require("../services/PaymentService")
    const paymentService = new PaymentService()

    console.log("✅ PaymentService initialized successfully")

    // Test subscription payment session creation
    console.log("\n💳 Testing subscription payment session creation...")
    const subscriptionData = {
      userId: "test-user-123",
      planName: "Standard Plan",
      billingCycle: "monthly",
      amount: 450.0,
      currency: "ZAR",
      customerEmail: "nhlanhlamsomi2024@gmail.com",
      customerName: "Test User",
    }

    const session = await paymentService.createSubscriptionPaymentSession(subscriptionData)
    console.log("✅ Subscription payment session created successfully")
    console.log("Checkout ID:", session.checkoutId)
    console.log("Redirect URL:", session.redirectUrl)
    console.log("Subscription Type:", session.subscriptionType)
    console.log("Requires Card Registration:", session.requiresCardRegistration)

    return session
  } catch (error) {
    console.error("❌ Test failed:", error.message)
    throw error
  }
}

// Run the test
testSubscriptionCreation()
  .then((result) => {
    console.log("\n🎉 Subscription creation test passed!")
    console.log("✅ The createSubscriptionPaymentSession method is now working")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Subscription creation test failed:", error.message)
    process.exit(1)
  })
