const express = require("express")
const path = require("path")

console.log("🔍 DEBUGGING ROUTE ISSUE...\n")

// Step 1: Check route file
console.log("📁 Step 1: Checking route file...")
const routeFilePath = path.join(__dirname, "../routes/peachPayments.js")

try {
  const fs = require("fs")
  const routeContent = fs.readFileSync(routeFilePath, "utf8")

  console.log("✅ Route file exists and is readable")
  console.log("📊 File size:", routeContent.length, "characters")

  // Check for the specific route
  if (routeContent.includes('router.get("/payment/result"') || routeContent.includes("router.get('/payment/result'")) {
    console.log("✅ GET /payment/result route found in file")
  } else {
    console.log("❌ GET /payment/result route NOT found in file")

    // Look for similar routes
    const getRoutes = routeContent.match(/router\.get\(['"](.*?)['"],/g)
    if (getRoutes) {
      console.log("📋 Found GET routes:")
      getRoutes.forEach((route) => console.log("   ", route))
    }
  }

  // Check for syntax errors
  try {
    require(routeFilePath)
    console.log("✅ Route file has no syntax errors")
  } catch (syntaxError) {
    console.log("❌ Route file has syntax errors:", syntaxError.message)
  }
} catch (error) {
  console.log("❌ Cannot read route file:", error.message)
}

// Step 2: Test route mounting
console.log("\n📦 Step 2: Testing route mounting...")

try {
  const paymentRoutes = require(routeFilePath)
  const testApp = express()

  // Add logging middleware
  testApp.use((req, res, next) => {
    console.log(`🔍 Request: ${req.method} ${req.path}`)
    next()
  })

  testApp.use("/api/payments", paymentRoutes)

  console.log("✅ Routes mounted successfully")

  // Step 3: Test with actual request
  console.log("\n🌐 Step 3: Testing with actual request...")

  const testPort = 8002
  const server = testApp.listen(testPort, () => {
    console.log(`✅ Test server running on port ${testPort}`)

    // Make test request
    const http = require("http")
    const testPath = "/api/payments/payment/result?status=success&amount=4500"
    const fullUrl = `http://localhost:${testPort}${testPath}`

    console.log("🔍 Testing:", fullUrl)

    const req = http.get(fullUrl, (res) => {
      console.log("📊 Status:", res.statusCode)
      console.log("📊 Headers:", Object.keys(res.headers))

      let data = ""
      res.on("data", (chunk) => (data += chunk))

      res.on("end", () => {
        if (res.statusCode === 200) {
          console.log("✅ SUCCESS: Route works in isolation!")
          console.log("📄 Response type:", res.headers["content-type"])

          if (data.includes("Payment Successful")) {
            console.log("✅ Correct payment success response")
          }

          console.log("\n🔧 DIAGNOSIS: Route works in isolation")
          console.log("The issue might be:")
          console.log("1. Server not restarted after route changes")
          console.log("2. Different route file being loaded")
          console.log("3. Route path mismatch")
          console.log("4. Middleware interfering")
        } else if (res.statusCode === 404) {
          console.log("❌ FAILED: Route not found even in isolation")
          console.log("📄 Response:", data)

          console.log("\n🔧 DIAGNOSIS: Route registration issue")
          console.log("The route is not being registered correctly")
        } else {
          console.log(`⚠️ Unexpected status: ${res.statusCode}`)
          console.log("📄 Response:", data.substring(0, 500))
        }

        server.close()

        // Step 4: Check actual server
        console.log("\n🌐 Step 4: Testing actual server...")
        testActualServer()
      })
    })

    req.on("error", (error) => {
      console.error("❌ Test request failed:", error.message)
      server.close()
    })
  })
} catch (error) {
  console.error("❌ Route mounting failed:", error.message)
  console.error("Stack:", error.stack)
}

function testActualServer() {
  const http = require("http")
  const actualUrl = "https://brown-ivory-website-h8srool38-big-league.vercel.app/api/payments/payment/result?status=success&amount=4500"

  console.log("🔍 Testing actual server:", actualUrl)

  const req = http.get(actualUrl, (res) => {
    console.log("📊 Actual server status:", res.statusCode)

    let data = ""
    res.on("data", (chunk) => (data += chunk))

    res.on("end", () => {
      if (res.statusCode === 200) {
        console.log("✅ SUCCESS: Actual server route works!")
        console.log("🎉 The issue has been resolved!")
      } else if (res.statusCode === 404) {
        console.log("❌ FAILED: Actual server route still returns 404")
        console.log("📄 Response:", data)

        console.log("\n🔧 FINAL DIAGNOSIS:")
        console.log("The route works in isolation but not on actual server")
        console.log("This suggests:")
        console.log("1. Server needs to be restarted")
        console.log("2. Different version of route file is being used")
        console.log("3. Route mounting path is different")
        console.log("4. Caching issue")

        console.log("\n💡 SOLUTIONS:")
        console.log("1. Stop the server (Ctrl+C)")
        console.log("2. Restart: node server.js")
        console.log("3. Wait for full startup")
        console.log("4. Test again")
      } else {
        console.log(`⚠️ Actual server unexpected status: ${res.statusCode}`)
      }

      process.exit(0)
    })
  })

  req.on("error", (error) => {
    if (error.code === "ECONNREFUSED") {
      console.log("❌ Actual server is not running")
      console.log("Please start the server first: node server.js")
    } else {
      console.error("❌ Actual server request failed:", error.message)
    }
    process.exit(1)
  })

  setTimeout(() => {
    console.log("⏰ Actual server test timeout")
    process.exit(1)
  }, 5000)
}
