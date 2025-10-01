const express = require("express")
const app = express()

// Test if the route is being registered correctly
const peachPaymentsRouter = require("../routes/peachPayments")

// Add middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Register the router
app.use("/api/payments", peachPaymentsRouter)

// Test the routes
console.log("🔍 Testing route registration...")

// List all registered routes
function listRoutes(app) {
  const routes = []

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path,
      })
    } else if (middleware.name === "router") {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const method = Object.keys(handler.route.methods)[0].toUpperCase()
          const path = "/api/payments" + handler.route.path
          routes.push({ method, path })
        }
      })
    }
  })

  return routes
}

const routes = listRoutes(app)
console.log("📋 Registered routes:")
routes.forEach((route) => {
  console.log(`  ${route.method} ${route.path}`)
})

// Check if our specific route exists
const paymentResultRoute = routes.find(
  (route) => route.method === "GET" && route.path === "/api/payments/payment/result",
)

if (paymentResultRoute) {
  console.log("✅ GET /api/payments/payment/result route is registered!")
} else {
  console.log("❌ GET /api/payments/payment/result route is NOT registered!")
  console.log("Available GET routes:")
  routes
    .filter((r) => r.method === "GET")
    .forEach((route) => {
      console.log(`  ${route.path}`)
    })
}

// Start server for testing
const PORT = 8001
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`)
  console.log(`Test the route: http://localhost:${PORT}/api/payments/payment/result?status=success&amount=4500`)
})
