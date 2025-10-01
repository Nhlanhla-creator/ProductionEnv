// Debug script to trace the payment flow
require("dotenv").config()

async function debugPaymentFlow() {
  console.log("🔍 Debugging payment flow...")

  // Test the payment success handler endpoint directly
  const testPaymentData = {
    checkoutId: "test-checkout-123",
    merchantTxnId: "TEST-MERCHANT-123",
    userId: "test-user-456",
    type: "payment",
    amount: 100,
    currency: "ZAR",
    customerEmail: "nhlanhlamsomi2024@gmail.com",
    toolName: "Test Growth Tool",
    transactionId: "TEST-TRANSACTION-789",
    source: "debug_test",
  }

  try {
    const response = await fetch("https://brown-ivory-website-h8srool38-big-league.vercel.app/api/payments/handle-payment-success", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPaymentData),
    })

    const result = await response.json()
    console.log("✅ Payment success handler response:", result)

    if (result.emailSent) {
      console.log("✅ Email was sent successfully!")
    } else {
      console.log("❌ Email was NOT sent")
    }
  } catch (error) {
    console.error("❌ Error testing payment success handler:", error)
  }

  // Test subscription flow
  const testSubscriptionData = {
    checkoutId: "test-sub-checkout-123",
    merchantTxnId: "TEST-SUB-MERCHANT-123",
    userId: "test-user-456",
    type: "subscription",
    planName: "Test Plan",
    cycle: "monthly",
    amount: 450,
    currency: "ZAR",
    customerEmail: "nhlanhlamsomi2024@gmail.com",
    transactionId: "TEST-SUB-TRANSACTION-789",
    source: "debug_test",
  }

  try {
    const response = await fetch("https://brown-ivory-website-h8srool38-big-league.vercel.app/api/payments/handle-payment-success", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testSubscriptionData),
    })

    const result = await response.json()
    console.log("✅ Subscription success handler response:", result)

    if (result.emailSent) {
      console.log("✅ Subscription email was sent successfully!")
    } else {
      console.log("❌ Subscription email was NOT sent")
    }
  } catch (error) {
    console.error("❌ Error testing subscription success handler:", error)
  }
}

debugPaymentFlow()
