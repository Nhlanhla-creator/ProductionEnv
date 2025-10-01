// Script to check and fix environment variables
console.log("🔍 Checking environment variables...")

const requiredVars = ["PEACH_ENTITY_ID", "PEACH_CLIENT_ID", "PEACH_CLIENT_SECRET", "PEACH_MERCHANT_ID"]

console.log("Current environment variables:")
requiredVars.forEach((varName) => {
  const value = process.env[varName]
  console.log(`${varName}: ${value ? "✅ SET" : "❌ NOT SET"}`)
  if (value) {
    console.log(`  Value: ${value.substring(0, 8)}...`)
  }
})

// Check if variables are being loaded
console.log("\n🔧 Debugging tips:")
console.log("1. Make sure your .env file is in the root directory")
console.log("2. Restart your server after changing .env")
console.log("3. Check for extra spaces or quotes in .env values")
console.log('4. Make sure you\'re using require("dotenv").config() at the top of your main file')
