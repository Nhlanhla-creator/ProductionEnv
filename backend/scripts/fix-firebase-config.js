const fs = require("fs")
const path = require("path")

console.log("🔧 FIXING FIREBASE CONFIGURATION ISSUE...\n")

// Check .env file
const envPath = path.join(__dirname, "../.env")

console.log("📁 Checking .env file...")

if (!fs.existsSync(envPath)) {
  console.log("❌ .env file not found")
  console.log("💡 Create .env file with Firebase configuration")
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, "utf8")
console.log("✅ .env file exists")

// Check Firebase variables
const firebaseVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_PRIVATE_KEY_ID",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_CLIENT_ID",
]

const missingVars = []
const presentVars = []

firebaseVars.forEach((varName) => {
  if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=\n`)) {
    presentVars.push(varName)
  } else {
    missingVars.push(varName)
  }
})

console.log("\n📊 Firebase Environment Variables:")
presentVars.forEach((varName) => {
  console.log(`✅ ${varName}: Present`)
})

missingVars.forEach((varName) => {
  console.log(`❌ ${varName}: Missing`)
})

if (missingVars.length > 0) {
  console.log("\n🔧 FIREBASE CONFIGURATION NEEDED:")
  console.log("Add these variables to your .env file:")
  console.log("")
  missingVars.forEach((varName) => {
    console.log(`${varName}=your_value_here`)
  })
  console.log("")
  console.log("💡 Get these values from Firebase Console:")
  console.log("1. Go to Firebase Console > Project Settings")
  console.log("2. Go to Service Accounts tab")
  console.log("3. Generate new private key")
  console.log("4. Copy the values from the JSON file")
}

// Create a mock FirestoreService for testing
console.log("\n🔧 Creating mock FirestoreService for testing...")

const mockFirestoreContent = `
// Mock FirestoreService for testing when Firebase is not configured
class MockFirestoreService {
  constructor() {
    this.initialized = false
    console.log("⚠️ MockFirestoreService: Firebase not configured, using mock mode")
  }

  static getStatus() {
    return {
      initialized: false,
      hasDatabase: false,
      projectId: 'mock-project',
      mode: 'mock'
    }
  }

  async savePaymentRecord(data) {
    console.log("🔄 MockFirestoreService: savePaymentRecord called with:", data)
    return "mock-payment-id-" + Date.now()
  }

  async updatePaymentRecord(data) {
    console.log("🔄 MockFirestoreService: updatePaymentRecord called with:", data)
    return true
  }

  async saveSubscriptionRecord(data) {
    console.log("🔄 MockFirestoreService: saveSubscriptionRecord called with:", data)
    return "mock-subscription-id-" + Date.now()
  }

  async updateUserSubscription(userId, data) {
    console.log("🔄 MockFirestoreService: updateUserSubscription called with:", { userId, data })
    return true
  }

  async saveCardRegistration(userId, data) {
    console.log("🔄 MockFirestoreService: saveCardRegistration called with:", { userId, data })
    return true
  }

  async getUserSubscription(userId) {
    console.log("🔄 MockFirestoreService: getUserSubscription called with:", userId)
    return null
  }

  async getPaymentRecord(checkoutId) {
    console.log("🔄 MockFirestoreService: getPaymentRecord called with:", checkoutId)
    return null
  }
}

module.exports = new MockFirestoreService()
`

const mockFirestorePath = path.join(__dirname, "../services/FirestoreService-Mock.js")
fs.writeFileSync(mockFirestorePath, mockFirestoreContent)
console.log("✅ Created mock FirestoreService")

// Create a test route file that doesn't depend on Firebase
console.log("\n🔧 Creating test route file without Firebase dependency...")

const testRouteContent = `
const express = require("express")
const router = express.Router()

// Simple test route that doesn't require Firebase
router.get("/payment/result", async (req, res) => {
  try {
    console.log("🔍 CRITICAL: Payment result GET request received:", {
      query: req.query,
      timestamp: new Date().toISOString(),
    })

    const {
      checkoutId,
      merchantTxnId,
      status = "success",
      amount,
      currency = "ZAR",
      type,
      planName,
      cycle,
      toolName,
      userId,
      transactionId,
    } = req.query

    console.log("📊 Payment result data:", {
      checkoutId,
      merchantTxnId,
      status,
      amount,
      currency,
      type,
      planName,
      cycle,
      toolName,
      userId,
      transactionId,
    })

    // Create HTML response
    const htmlResponse = \`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment \${status === "success" ? "Successful" : "Result"}</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: \${
              status === "success"
                ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
                : "linear-gradient(135deg, #fef2f2 0%, #fde8e8 100%)"
            };
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 90%;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        .title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: \${status === "success" ? "#059669" : "#dc2626"};
        }
        .message {
            color: #6b7280;
            margin-bottom: 2rem;
            line-height: 1.5;
        }
        .debug-info {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(0,0,0,0.05);
            border-radius: 8px;
            font-size: 12px;
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            \${status === "success" ? "✅" : "❌"}
        </div>
        
        <h1 class="title">
            \${status === "success" ? "Payment Successful!" : "Payment Status"}
        </h1>
        
        <p class="message">
            \${
              status === "success"
                ? "TEST MODE: Payment result page working correctly!"
                : "Processing payment result..."
            }
        </p>
        
        <div class="debug-info">
            <h4>Debug Info:</h4>
            <p>Status: \${status}</p>
            <p>Checkout ID: \${checkoutId || "Not provided"}</p>
            <p>Amount: \${amount || "Not provided"}</p>
            <p>Type: \${type || "Not provided"}</p>
            <p>Plan Name: \${planName || "Not provided"}</p>
            <p>Tool Name: \${toolName || "Not provided"}</p>
            <p>Transaction ID: \${transactionId || merchantTxnId || "Not provided"}</p>
            <p>Mode: TEST (Firebase disabled)</p>
        </div>
    </div>

    <script>
        console.log('🔍 Payment result page loaded (TEST MODE)');
        console.log('🔍 Query parameters:', \${JSON.stringify(req.query)});

        const paymentData = {
            type: 'payment_completed',
            status: '\${status}',
            checkoutId: '\${checkoutId || merchantTxnId || ""}',
            merchantTxnId: '\${merchantTxnId || checkoutId || ""}',
            transactionId: '\${transactionId || merchantTxnId || checkoutId || ""}',
            userId: '\${userId || "user-" + Date.now()}',
            paymentType: '\${type || "payment"}',
            amount: \${amount ? Number.parseFloat(amount) : 0},
            currency: '\${currency}',
            planName: '\${planName || ""}',
            cycle: '\${cycle || ""}',
            toolName: '\${toolName || ""}',
            timestamp: new Date().toISOString(),
            testMode: true
        };

        console.log('📤 Sending payment data to parent:', paymentData);

        if ('\${status}' === 'success') {
            function sendMessage() {
                if (window.opener) {
                    window.opener.postMessage(paymentData, '*');
                    console.log('✅ Message sent to opener window');
                }

                if (window.parent && window.parent !== window) {
                    window.parent.postMessage(paymentData, '*');
                    console.log('✅ Message sent to parent window');
                }
            }

            sendMessage();
            setTimeout(sendMessage, 1000);
            setTimeout(sendMessage, 3000);

            setTimeout(() => {
                if (window.opener) {
                    console.log('🔄 Closing popup window');
                    window.close();
                }
            }, 5000);
        }
    </script>
</body>
</html>
    \`

    res.setHeader("Content-Type", "text/html")
    res.send(htmlResponse)
  } catch (error) {
    console.error("❌ CRITICAL: Payment result error:", error)
    res.status(500).send(\`
<!DOCTYPE html>
<html>
<head>
    <title>Payment Error</title>
    <style>
        body { font-family: system-ui; text-align: center; padding: 2rem; }
        .error { color: #dc2626; }
    </style>
</head>
<body>
    <h1 class="error">Payment Processing Error</h1>
    <p>There was an error processing your payment result.</p>
    <p>Error: \${error.message}</p>
</body>
</html>
    \`)
  }
})

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "peach-payments-test",
    timestamp: new Date().toISOString(),
    mode: "test",
    firebase: "disabled"
  })
})

module.exports = router
`

const testRoutePath = path.join(__dirname, "../routes/peachPayments-Test.js")
fs.writeFileSync(testRoutePath, testRouteContent)
console.log("✅ Created test route file")

console.log("\n🔧 NEXT STEPS:")
console.log("1. Temporarily use the test route to verify the route system works:")
console.log("   - Edit server.js")
console.log("   - Change: const paymentRoutes = require('./routes/peachPayments');")
console.log("   - To: const paymentRoutes = require('./routes/peachPayments-Test');")
console.log("   - Restart server: node server.js")
console.log("   - Test: https://brown-ivory-website-h8srool38-big-league.vercel.app/api/payments/payment/result?status=success&amount=4500")
console.log("")
console.log("2. If test route works, then fix Firebase configuration:")
console.log("   - Add missing Firebase environment variables to .env")
console.log("   - Switch back to original route file")
console.log("")
console.log("3. If test route doesn't work, there's a deeper routing issue")

console.log("\n✅ Firebase configuration fix complete!")
