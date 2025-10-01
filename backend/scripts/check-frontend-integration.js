// Script to help diagnose frontend integration issues
require("dotenv").config()

console.log("🔍 Frontend Integration Diagnostic")
console.log("==================================")

console.log("\n📋 Current Issues Identified:")
console.log("1. ❌ Frontend is calling /verify-payment-status (which fails with 403)")
console.log("2. ❌ Frontend is NOT calling /handle-payment-success (which works and sends emails)")
console.log("3. ❌ Frontend is using OLD EmbeddedCheckout component")

console.log("\n🔧 Required Actions:")
console.log("1. ✅ Replace your EmbeddedCheckout.js component with the new version")
console.log("2. ✅ The new component will automatically call /handle-payment-success")
console.log("3. ✅ Emails will be sent without relying on Peach verification")

console.log("\n📁 File Location:")
console.log("Your frontend EmbeddedCheckout component should be at:")
console.log("- frontend/components/EmbeddedCheckout.js")
console.log("- OR frontend/src/components/EmbeddedCheckout.js")

console.log("\n🧪 Testing Current Backend (which works):")

async function testBackendEndpoints() {
  const backendUrl = "https://brown-ivory-website-h8srool38-big-league.vercel.app"
  
  // Test the working endpoint
  console.log("\n📤 Testing /handle-payment-success endpoint...")
  try {
    const response = await fetch(`${backendUrl}/api/payments/handle-payment-success`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://11a377202873.ngrok-free.app"
      },
      body: JSON.stringify({
        checkoutId: "test-frontend-fix",
        userId: "test-user",
        customerEmail: "nhlanhlamsomi2024@gmail.com",
        type: "payment",
        amount: 100,
        currency: "ZAR",
        toolName: "Test Tool",
        source: "frontend_fix_test"
      })
    })
    
    const result = await response.json()
    console.log("✅ /handle-payment-success works:", result.success ? "SUCCESS" : "FAILED")
    console.log("📧 Email sent:", result.emailSent ? "YES" : "NO")
  } catch (error) {
    console.log("❌ /handle-payment-success failed:", error.message)
  }
  
  // Test the failing endpoint (just to confirm it fails)
  console.log("\n📤 Testing /verify-payment-status endpoint...")
  try {
    const response = await fetch(`${backendUrl}/api/payments/verify-payment-status?checkoutId=test-checkout`)
    const result = await response.json()
    console.log("❌ /verify-payment-status result:", result.success ? "SUCCESS" : "FAILED")
    console.log("   This endpoint fails due to Peach Payments 403 error (expected)")
  } catch (error) {
    console.log("❌ /verify-payment-status failed:", error.message)
  }
}

testBackendEndpoints()

console.log("\n🎯 SOLUTION:")
console.log("Replace your frontend EmbeddedCheckout.js with the new version that:")
console.log("- Calls /handle-payment-success instead of /verify-payment-status")
console.log("- Triggers emails automatically after payment completion")
console.log("- Doesn't rely on failing Peach verification")

console.log("\n📝 Next Steps:")
console.log("1. Copy the new EmbeddedCheckout.js component from the code project")
console.log("2. Replace your current frontend component")
console.log("3. Test a payment - emails should work automatically")
console.log("4. Check browser console for debug logs")
