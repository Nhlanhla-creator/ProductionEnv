// Script to monitor payment requests in real-time
require("dotenv").config()

const express = require("express")
const app = express()

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  console.log("Headers:", req.headers)
  console.log("Body:", req.body)
  next()
})

// Monitor the payment success endpoint specifically
app.post("/api/payments/handle-payment-success", (req, res) => {
  console.log("🚨 PAYMENT SUCCESS REQUEST RECEIVED:")
  console.log("Body:", JSON.stringify(req.body, null, 2))
  console.log("Headers:", JSON.stringify(req.headers, null, 2))

  // Forward to actual endpoint
  const actualUrl = "https://brown-ivory-website-h8srool38-big-league.vercel.app/api/payments/handle-payment-success"
  fetch(actualUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("✅ Response from actual endpoint:", data)
      res.json(data)
    })
    .catch((error) => {
      console.error("❌ Error forwarding request:", error)
      res.status(500).json({ error: error.message })
    })
})

app.listen(3001, () => {
  console.log("🔍 Payment monitor running on port 3001")
  console.log("Update your frontend to use http://localhost:3001 as API_URL to monitor requests")
})
