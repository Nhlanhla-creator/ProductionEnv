// Script to verify PaymentService methods
console.log("🔍 Verifying PaymentService methods...")

try {
  const PaymentService = require("../services/PaymentService")
  const paymentService = new PaymentService()

  console.log("\n📋 Available methods:")
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(paymentService))
  methods.forEach((method) => {
    if (typeof paymentService[method] === "function" && !method.startsWith("_")) {
      console.log(`✅ ${method}`)
    }
  })

  // Check specifically for the subscription method
  if (typeof paymentService.createSubscriptionPaymentSession === "function") {
    console.log("\n✅ createSubscriptionPaymentSession method EXISTS")
  } else {
    console.log("\n❌ createSubscriptionPaymentSession method MISSING")
    console.log("🔧 Run: node scripts/manual-add-subscription-method.js")
  }

  // Check for other required methods
  const requiredMethods = ["createPaymentSession", "verifyPayment", "getPaymentStatus", "getAccessToken"]

  console.log("\n📋 Required methods check:")
  requiredMethods.forEach((method) => {
    if (typeof paymentService[method] === "function") {
      console.log(`✅ ${method}`)
    } else {
      console.log(`❌ ${method} - MISSING`)
    }
  })
} catch (error) {
  console.error("❌ Error loading PaymentService:", error.message)
}
