// Direct test using your actual checkout ID
require("dotenv").config()

async function directEmailTest() {
  console.log("🎯 DIRECT EMAIL TEST")
  console.log("===================")

  const backendUrl = "https://brown-ivory-website-h8srool38-big-league.vercel.app"
  const actualCheckoutId = "a892ddfaa64a4c0ebae4fde568335ff8" // Your real checkout ID

  console.log("Using your actual checkout ID:", actualCheckoutId)

  // This is what your NEW frontend should send when payment completes
  const paymentSuccessData = {
    checkoutId: actualCheckoutId,
    merchantTxnId: actualCheckoutId,
    userId: "user-" + Date.now(),
    type: "payment", // or "subscription"
    amount: 100,
    currency: "ZAR",
    customerEmail: "nhlanhlamsomi2024@gmail.com",
    userEmail: "nhlanhlamsomi2024@gmail.com",
    toolName: "Growth Tool",
    transactionId: actualCheckoutId,
    source: "direct_test",
    timestamp: new Date().toISOString(),
    paymentType: "one_time",
  }

  console.log("\n📤 Calling /handle-payment-success (the working endpoint)...")

  try {
    const response = await fetch(`${backendUrl}/api/payments/handle-payment-success`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://11a377202873.ngrok-free.app",
      },
      body: JSON.stringify(paymentSuccessData),
    })

    if (response.ok) {
      const result = await response.json()
      console.log("\n✅ SUCCESS!")
      console.log("Email sent:", result.emailSent ? "YES" : "NO")
      console.log("Email address:", result.emailAddress)
      console.log("Message ID:", result.emailResult?.messageId)

      if (result.emailSent) {
        console.log("\n🎉 EMAIL SENT SUCCESSFULLY!")
        console.log("📧 Check nhlanhlamsomi2024@gmail.com")
        console.log("📧 Also check spam folder")
      }
    } else {
      console.log("❌ HTTP Error:", response.status)
      const errorText = await response.text()
      console.log("Error:", errorText)
    }
  } catch (error) {
    console.log("❌ Request failed:", error.message)
  }

  console.log("\n🔧 COMPARISON:")
  console.log("❌ Your current frontend calls: /verify-payment-status (FAILS)")
  console.log("✅ Your new frontend should call: /handle-payment-success (WORKS)")

  console.log("\n📋 NEXT STEPS:")
  console.log("1. Update your frontend EmbeddedCheckout.js component")
  console.log("2. The new component will automatically call /handle-payment-success")
  console.log("3. Emails will work immediately")
}

directEmailTest()
