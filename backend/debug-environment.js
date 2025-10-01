// Debug script to check environment variables
require("dotenv").config()

console.log("🔍 Environment Variable Debug Script")
console.log("=====================================")

const requiredVars = ["PEACH_ENTITY_ID", "PEACH_CLIENT_ID", "PEACH_CLIENT_SECRET", "PEACH_MERCHANT_ID"]

console.log("\n📋 Checking required Peach Payments variables:")
let allSet = true

requiredVars.forEach((varName) => {
  const value = process.env[varName]
  const isSet = !!value
  allSet = allSet && isSet

  console.log(`${varName}: ${isSet ? "✅" : "❌"} ${isSet ? "SET" : "NOT SET"}`)

  if (isSet) {
    console.log(`  Preview: ${value.substring(0, 8)}...${value.substring(value.length - 4)}`)
    console.log(`  Length: ${value.length} characters`)

    // Check for common issues
    if (value.startsWith(" ") || value.endsWith(" ")) {
      console.log("  ⚠️  WARNING: Value has leading/trailing spaces")
    }
    if (value.includes("\n")) {
      console.log("  ⚠️  WARNING: Value contains newline characters")
    }
  }
  console.log("")
})

console.log(`\n🎯 Overall Status: ${allSet ? "✅ All variables set" : "❌ Missing variables"}`)

if (!allSet) {
  console.log("\n🔧 Troubleshooting Steps:")
  console.log("1. Check your .env file exists in the project root")
  console.log("2. Verify variable names match exactly (case sensitive)")
  console.log("3. Remove any quotes around values in .env file")
  console.log("4. Restart your server after making changes")
  console.log('5. Make sure require("dotenv").config() is at the top of your main file')
}

// Test PaymentService initialization
console.log("\n🧪 Testing PaymentService initialization...")
try {
  const PaymentService = require("./services/PaymentService")
  const paymentService = new PaymentService()
  console.log("✅ PaymentService initialized successfully")
} catch (error) {
  console.log("❌ PaymentService initialization failed:", error.message)
}
