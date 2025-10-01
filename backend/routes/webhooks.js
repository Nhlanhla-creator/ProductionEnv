const express = require("express")
const router = express.Router()
const crypto = require("crypto")
const admin = require("firebase-admin")
const PeachPaymentsService = require("../services/peachPayments")

// Webhook endpoint for payment notifications
router.post("/peach-webhook", async (req, res) => {
  try {
    const signature = req.headers["x-peach-signature"]
    const payload = JSON.stringify(req.body)

    // Verify webhook signature
    if (!PeachPaymentsService.verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({ error: "Invalid signature" })
    }

    const event = req.body
    console.log("Webhook received:", event)

    // Handle different webhook events based on Peach Payments structure
    if (event.type === "PAYMENT") {
      await handlePaymentWebhook(event)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    res.status(500).json({ error: "Webhook processing failed" })
  }
})

async function handlePaymentWebhook(paymentData) {
  const merchantTransactionId = paymentData.merchantTransactionId

  try {
    // Update order status
    const orderRef = admin.firestore().collection("orders").doc(merchantTransactionId)
    const orderDoc = await orderRef.get()

    if (!orderDoc.exists) {
      console.log(`Order ${merchantTransactionId} not found`)
      return
    }

    const orderData = orderDoc.data()
    const isSuccessful = paymentData.result?.code === "000.100.110" || paymentData.result?.code === "000.000.000"

    await orderRef.update({
      status: isSuccessful ? "completed" : "failed",
      transactionId: paymentData.id,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      webhookData: paymentData,
    })

    if (isSuccessful) {
      // Handle successful payment based on action type
      if (orderData.actionType === "new_subscription" || orderData.actionType === "upgrade") {
        await activateSubscription(orderData, paymentData)
      } else if (orderData.actionType === "growth_tool_purchase") {
        await recordGrowthToolPurchase(orderData, paymentData)
      }

      // Save registration ID if this was a subscription payment
      if (paymentData.registrationId && orderData.createRegistration) {
        await savePaymentRegistration(orderData.userId, paymentData)
      }
    }

    console.log(`Order ${merchantTransactionId} ${isSuccessful ? "completed" : "failed"}`)
  } catch (error) {
    console.error(`Error handling payment webhook for ${merchantTransactionId}:`, error)
  }
}

async function activateSubscription(orderData, paymentData) {
  try {
    // Create subscription record
    const subscriptionRecord = {
      id: `sub_${Date.now()}_${orderData.userId}`,
      email: orderData.userEmail,
      plan: orderData.planName,
      cycle: orderData.billingCycle,
      amount: orderData.amount,
      fullName: orderData.customerName || "",
      companyName: "",
      createdAt: new Date().toISOString(),
      status: "Success",
      autoRenew: true,
      userId: orderData.userId,
      action: orderData.actionType,
      transactionRef: paymentData.id,
      paymentToken: paymentData.registrationId, // For recurring payments
    }

    // Save to subscriptions collection
    await admin.firestore().collection("subscriptions").doc(subscriptionRecord.id).set(subscriptionRecord)

    // Update user's current plan
    await admin
      .firestore()
      .collection("users")
      .doc(orderData.userId)
      .update({
        currentPlan: {
          name: orderData.planName,
          cycle: orderData.billingCycle,
          activeSince: new Date().toISOString(),
          status: "active",
          lastPaymentDate: new Date().toISOString(),
        },
        planUpdatedAt: new Date().toISOString(),
      })

    console.log(`Subscription activated for user ${orderData.userId}`)
  } catch (error) {
    console.error("Error activating subscription:", error)
  }
}

async function recordGrowthToolPurchase(orderData, paymentData) {
  try {
    const purchaseRecord = {
      userId: orderData.userId,
      userEmail: orderData.userEmail,
      packageName: orderData.toolName || orderData.planName,
      toolCategory: orderData.toolCategory,
      toolTier: orderData.toolTier,
      amount: orderData.amount,
      transactionRef: paymentData.id,
      status: "Success",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      type: orderData.toolCategory?.toLowerCase() + "_tools" || "growth_tools",
      deliveryStatus: "pending",
    }

    await admin.firestore().collection("growthToolsPurchases").add(purchaseRecord)
    console.log(`Growth tool purchase recorded for user ${orderData.userId}`)
  } catch (error) {
    console.error("Error recording growth tool purchase:", error)
  }
}

async function savePaymentRegistration(userId, paymentData) {
  try {
    if (!paymentData.registrationId) return

    const registrationRecord = {
      userId,
      registrationId: paymentData.registrationId,
      brand: paymentData.paymentBrand || "Unknown",
      last4: paymentData.card?.last4Digits || "****",
      expiryMonth: paymentData.card?.expiryMonth,
      expiryYear: paymentData.card?.expiryYear,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "active",
    }

    await admin.firestore().collection("paymentMethods").doc(userId).set(registrationRecord, { merge: true })
    console.log(`Payment registration saved for user ${userId}`)
  } catch (error) {
    console.error("Error saving payment registration:", error)
  }
}

module.exports = router
