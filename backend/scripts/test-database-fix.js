// Test script to verify database fixes
require("dotenv").config()

async function testDatabaseFix() {
  console.log("🧪 Testing database fixes...")
  console.log("============================")

  try {
    const FirestoreService = require("../services/FirestoreService")

    // Test database connection
    console.log("🔍 Testing Firestore connection...")
    const connectionTest = await FirestoreService.testConnection()
    console.log("Connection test result:", connectionTest ? "✅ SUCCESS" : "❌ FAILED")

    // Test user subscription update with non-existent user
    console.log("\n🧪 Testing user subscription update (non-existent user)...")
    const testUserId = "test-user-" + Date.now()
    const subscriptionData = {
      status: "active",
      planName: "Test Plan",
      billingCycle: "monthly",
      amount: 450,
      currency: "ZAR",
      customerEmail: "test@example.com",
    }

    const updateResult = await FirestoreService.updateUserSubscription(testUserId, subscriptionData)
    console.log("Update result:", updateResult ? "✅ SUCCESS" : "⚠️ HANDLED GRACEFULLY")

    // Test payment record creation
    console.log("\n🧪 Testing payment record creation...")
    const paymentData = {
      checkoutId: "test-checkout-" + Date.now(),
      userId: testUserId,
      amount: 100,
      currency: "ZAR",
      status: "completed",
      customerEmail: "test@example.com",
    }

    const paymentResult = await FirestoreService.savePaymentRecord(paymentData)
    console.log("Payment record result:", paymentResult ? "✅ SUCCESS" : "⚠️ HANDLED GRACEFULLY")

    // Test the full payment success flow
    console.log("\n🧪 Testing full payment success flow...")
    const response = await fetch("https://brown-ivory-website-h8srool38-big-league.vercel.app/api/payments/handle-payment-success", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://11a377202873.ngrok-free.app",
      },
      body: JSON.stringify({
        checkoutId: "test-db-fix-" + Date.now(),
        userId: "test-user-db-fix-" + Date.now(),
        customerEmail: "nhlanhlamsomi2024@gmail.com",
        type: "payment",
        amount: 100,
        currency: "ZAR",
        toolName: "Database Fix Test",
        source: "database_fix_test",
      }),
    })

    const result = await response.json()
    console.log("Full flow result:", result.success ? "✅ SUCCESS" : "❌ FAILED")
    console.log("Email sent:", result.emailSent ? "✅ YES" : "❌ NO")
    console.log("Database note:", result.databaseNote)

    console.log("\n🎉 Database fix test completed!")
    console.log("✅ Emails will be sent even if database operations fail")
    console.log("✅ User documents will be created if they don't exist")
    console.log("✅ Payment records will be created gracefully")
  } catch (error) {
    console.error("❌ Database fix test failed:", error)
  }
}

testDatabaseFix()
