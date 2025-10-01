// Test script specifically for ngrok frontend
require("dotenv").config()

async function testNgrokEmailFlow() {
  console.log("🧪 Testing email flow with ngrok frontend...")

  const ngrokUrl = "https://11a377202873.ngrok-free.app" // Your ngrok URL
  const backendUrl = "https://brown-ivory-website-h8srool38-big-league.vercel.app"

  // Test data that simulates what your frontend should send
  const testPaymentData = {
    checkoutId: "test-ngrok-checkout-123",
    merchantTxnId: "TEST-NGROK-MERCHANT-123",
    userId: "test-ngrok-user-456",
    type: "payment",
    amount: 100,
    currency: "ZAR",
    customerEmail: "nhlanhlamsomi2024@gmail.com",
    userEmail: "nhlanhlamsomi2024@gmail.com",
    toolName: "Test Growth Tool",
    transactionId: "TEST-NGROK-TRANSACTION-789",
    source: "ngrok_test",
    timestamp: new Date().toISOString(),
    paymentType: "one_time",
  }

  try {
    console.log("📤 Sending payment success notification to backend...")
    const response = await fetch(`${backendUrl}/api/payments/handle-payment-success`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: ngrokUrl, // Simulate request from ngrok frontend
      },
      body: JSON.stringify(testPaymentData),
    })

    const result = await response.json()
    console.log("✅ Backend response:", result)

    if (result.emailSent) {
      console.log("✅ Email was sent successfully!")
      console.log("📧 Email result:", result.emailResult)
    } else {
      console.log("❌ Email was NOT sent")
    }

    // Test subscription flow too
    const testSubscriptionData = {
      ...testPaymentData,
      type: "subscription",
      planName: "Test Plan",
      cycle: "monthly",
      paymentType: "subscription",
    }

    console.log("\n📤 Testing subscription flow...")
    const subResponse = await fetch(`${backendUrl}/api/payments/handle-payment-success`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: ngrokUrl,
      },
      body: JSON.stringify(testSubscriptionData),
    })

    const subResult = await subResponse.json()
    console.log("✅ Subscription backend response:", subResult)

    if (subResult.emailSent) {
      console.log("✅ Subscription email was sent successfully!")
    } else {
      console.log("❌ Subscription email was NOT sent")
    }
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

testNgrokEmailFlow()
