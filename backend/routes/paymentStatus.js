const express = require("express")
const router = express.Router()
const PeachPaymentsService = require("../services/peachPayments")
const admin = require("firebase-admin")

// Get payment status endpoint
router.get("/payment-status", async (req, res) => {
  try {
    const { checkoutId } = req.query

    if (!checkoutId) {
      return res.status(400).json({
        success: false,
        message: "Missing checkout ID",
      })
    }

    // Get payment status from Peach Payments
    const paymentStatus = await PeachPaymentsService.getPaymentStatus(checkoutId)

    // Check if payment was successful
    const isSuccessful = paymentStatus.result?.code === "000.100.110" || paymentStatus.result?.code === "000.000.000"

    if (isSuccessful) {
      // Get order details from Firebase
      const ordersRef = admin.firestore().collection("orders")
      const orderQuery = await ordersRef.where("checkoutId", "==", checkoutId).get()

      let orderDetails = null
      if (!orderQuery.empty) {
        orderDetails = orderQuery.docs[0].data()
      }

      res.json({
        success: true,
        status: "completed",
        message: "Payment completed successfully",
        orderDetails,
        transactionId: paymentStatus.id,
      })
    } else {
      res.json({
        success: false,
        status: "failed",
        message: paymentStatus.result?.description || "Payment failed",
      })
    }
  } catch (error) {
    console.error("Payment status check error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to check payment status",
    })
  }
})

module.exports = router
