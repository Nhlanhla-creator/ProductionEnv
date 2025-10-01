// Test script for immediate email sending
require("dotenv").config()

async function testImmediateEmail() {
  console.log("🧪 Testing immediate email sending...")

  try {
    const EmailService = require("../services/EmailService")

    console.log("📧 Testing payment receipt email...")
    const receiptResult = await EmailService.sendPaymentReceipt(
      "nhlanhlamsomi2024@gmail.com",
      100.0,
      "ZAR",
      "TEST-IMMEDIATE-123",
      "Test Growth Tool",
    )

    console.log("✅ Payment receipt result:", receiptResult)

    console.log("📧 Testing subscription confirmation email...")
    const subscriptionResult = await EmailService.sendSubscriptionConfirmation(
      "nhlanhlamsomi2024@gmail.com",
      "Test Plan",
      "monthly",
      450.0,
      "TEST-SUB-IMMEDIATE-123",
    )

    console.log("✅ Subscription confirmation result:", subscriptionResult)

    console.log("🎉 All immediate email tests completed!")
  } catch (error) {
    console.error("❌ Immediate email test failed:", error)
    throw error
  }
}

// Run the test
testImmediateEmail()
  .then(() => {
    console.log("\n🎉 All tests passed!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Tests failed:", error.message)
    process.exit(1)
  })
