// DEBUGGING SCRIPT: Add this to test your token format
const PaymentService = require("./services/PaymentService")

async function debugToken() {
  try {
    console.log("🔍 Testing token generation...")

    const peach = new PaymentService()
    const token = await peach.getAccessToken()

    console.log("✅ Token received successfully:")
    console.log("Token length:", token.length)
    console.log("Token parts:", token.split(".").length)
    console.log("Token start:", token.substring(0, 50) + "...")
    console.log("Token end:", "..." + token.substring(token.length - 50))

    // Test the token format
    const parts = token.split(".")
    if (parts.length === 3) {
      console.log("✅ Valid JWT format (3 parts)")

      // Decode header and payload (for debugging)
      try {
        const header = JSON.parse(Buffer.from(parts[0], "base64url").toString())
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString())

        console.log("Token header:", header)
        console.log("Token payload (partial):", {
          iss: payload.iss,
          aud: payload.aud,
          exp: payload.exp,
          iat: payload.iat,
          entityID: payload.entityID,
          merchantId: payload.merchantId,
        })

        // Check if token is expired
        const now = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp < now) {
          console.log("⚠️ Token is expired!")
        } else {
          console.log("✅ Token is valid and not expired")
        }
      } catch (decodeError) {
        console.log("⚠️ Could not decode token parts:", decodeError.message)
      }
    } else {
      console.log("❌ Invalid JWT format - expected 3 parts, got", parts.length)
    }
  } catch (error) {
    console.error("❌ Token debug failed:", error.message)
    console.error("Full error:", error)
  }
}

// Run the debug
debugToken()
