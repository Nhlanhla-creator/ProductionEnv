// Script to simulate what happens when a payment is successful
require("dotenv").config()

async function simulateSuccessfulPayment() {
  console.log("🎯 Simulating Successful Payment Flow")
  console.log("====================================")

  const backendUrl = "https://brown-ivory-website-h8srool38-big-league.vercel.app"
  const ngrokUrl = "https://11a377202873.ngrok-free.app"

  // Simulate what the NEW frontend component should send
  const paymentSuccessData = {
    checkoutId: "a892ddfaa64a4c0ebae4fde568335ff8", // Your actual checkout ID
    merchantTxnId: "a892ddfaa64a4c0ebae4fde568335ff8",
    userId: "user-" + Date.now(),
    type: "payment",
    amount: 100,
    currency: "ZAR",
    customerEmail: "nhlanhlamsomi2024@gmail.com",
    userEmail: "nhlanhlamsomi2024@gmail.com",
    toolName: "Growth Tool",
    transactionId: "a892ddfaa64a4c0ebae4fde568335ff8",
    source: "simulated_success",
    timestamp: new Date().toISOString(),
    paymentType: "one_time",
  }

  console.log("📤 Sending payment success notification...")
  console.log("Data:", JSON.stringify(paymentSuccessData, null, 2))

  try {
    const response = await fetch(`${backendUrl}/api/payments/handle-payment-success`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: ngrokUrl,
      },
      body: JSON.stringify(paymentSuccessData),
    })

    if (response.ok) {
      const result = await response.json()
      console.log("\n✅ SUCCESS! Backend Response:")
      console.log("- Success:", result.success)
      console.log("- Email Sent:", result.emailSent)
      console.log("- Email Address:", result.emailAddress)
      console.log("- Message ID:", result.emailResult?.messageId)

      if (result.emailSent) {
        console.log("\n🎉 EMAIL SENT SUCCESSFULLY!")
        console.log("📧 Check nhlanhlamsomi2024@gmail.com for the email")
        console.log("📧 Also check spam/junk folder")
      } else {
        console.log("\n❌ Email was not sent")
        console.log("Error:", result.emailResult?.error)
      }
    } else {
      console.log("❌ HTTP Error:", response.status, response.statusText)
      const errorText = await response.text()
      console.log("Error details:", errorText)
    }
  } catch (error) {
    console.log("❌ Request failed:", error.message)
  }

  console.log("\n🔧 This is what your NEW frontend component should do automatically!")
  console.log("The old component only calls /verify-payment-status (which fails)")
  console.log("The new component calls /handle-payment-success (which works and sends emails)")
}

simulateSuccessfulPayment()
