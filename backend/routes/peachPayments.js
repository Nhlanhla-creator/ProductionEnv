const express = require("express")
const router = express.Router()
const axios = require("axios")
const crypto = require("crypto")
const FirestoreService = require("../services/FirestoreService")
// REMOVED: const EmailService = require("../services/EmailService") - EmailJS handles this now
const PaymentService = require("../services/PaymentService")

const peach = new PaymentService()

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "https://brown-ivory-website-h8srool38-big-league.vercel.app",
  "https://www.bigmarketplace.africa",
].filter(Boolean)

router.use((req, res, next) => {
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  res.setHeader("Access-Control-Allow-Credentials", "true")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }
  next()
})

const processedPayments = new Set()

// ==================== UPDATED PAYMENT RESULT ROUTE ====================
// No email sending - EmailJS handles everything on frontend
router.post("/result", async (req, res) => {
  try {
    console.log('🔄 Payment result POST received:', req.body);
    console.log('🔄 Payment result query params:', req.query);
    
    const { status, type, userId, merchantTxnId, amount, currency, toolName, toolCategory, planName, cycle } = req.query;
    
    if (status === 'success') {
      console.log('✅ Payment successful - EmailJS will handle email on frontend');
      
      // SAVE TO DATABASE ONLY - EmailJS handles email
      try {
        const finalAmount = Number.parseFloat(amount) || 0;
        const finalTransactionId = merchantTxnId || `RESULT-${Date.now()}`;

        if (type === 'subscription') {
          // FIXED: Save subscription to database
          await FirestoreService.updateUserSubscription(userId, {
            status: "active",
            lastPayment: new Date().toISOString(),
            transactionId: finalTransactionId,
            planName: planName || "Premium Plan",
            billingCycle: cycle || "monthly",
            isActive: true,
            amount: finalAmount,
            currency: currency || "ZAR",
            activatedAt: new Date().toISOString(),
            nextBillingDate: calculateNextBillingDate(cycle || "monthly")
          });
          console.log('✅ Subscription saved to database');
        } else {
          // FIXED: Save payment to database
          await FirestoreService.savePaymentRecord({
            userId: userId,
            amount: finalAmount,
            currency: currency || "ZAR",
            status: "completed",
            transactionId: finalTransactionId,
            toolName: toolName || "Growth Tool",
            toolCategory: toolCategory || "",
            completedAt: new Date().toISOString(),
            type: "one_time"
          });
          console.log('✅ Payment saved to database');
        }
      } catch (dbError) {
        console.error('❌ Database save failed:', dbError);
      }
      
      console.log('✅ Payment result processed - email handled by frontend EmailJS');
      res.json({ success: true, message: 'Payment processed - email via frontend' });
    } else {
      console.log('❌ Payment failed');
      res.json({ success: false, message: 'Payment failed' });
    }
    
  } catch (error) {
    console.error('❌ Error processing payment result:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Also handle GET requests (some payment providers use GET)
router.get("/result", async (req, res) => {
  try {
    console.log('🔄 Payment result GET received:', req.query);
    
    const { status, type, userId, merchantTxnId, amount, currency, toolName, toolCategory, planName, cycle } = req.query;
    
    if (status === 'success') {
      console.log('✅ Payment successful - EmailJS will handle email on frontend');
      
      // SAVE TO DATABASE ONLY
      try {
        const finalAmount = Number.parseFloat(amount) || 0;
        const finalTransactionId = merchantTxnId || `RESULT-${Date.now()}`;

        if (type === 'subscription') {
          await FirestoreService.updateUserSubscription(userId, {
            status: "active",
            lastPayment: new Date().toISOString(),
            transactionId: finalTransactionId,
            planName: planName || "Premium Plan",
            billingCycle: cycle || "monthly",
            isActive: true,
            amount: finalAmount,
            currency: currency || "ZAR",
            activatedAt: new Date().toISOString(),
            nextBillingDate: calculateNextBillingDate(cycle || "monthly")
          });
        } else {
          await FirestoreService.savePaymentRecord({
            userId: userId,
            amount: finalAmount,
            currency: currency || "ZAR",
            status: "completed",
            transactionId: finalTransactionId,
            toolName: toolName || "Growth Tool",
            toolCategory: toolCategory || "",
            completedAt: new Date().toISOString(),
            type: "one_time"
          });
        }
      } catch (dbError) {
        console.error('❌ Database save failed:', dbError);
      }
      
      // Redirect to your frontend success page
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/results?status=success&amount=${amount}&id=${merchantTxnId}&type=${type}`);
    } else {
      console.log('❌ Payment failed');
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/results?status=failed`);
    }
    
  } catch (error) {
    console.error('❌ Error processing payment result:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// ==================== UPDATED HANDLE PAYMENT SUCCESS ====================
router.post("/handle-payment-success", async (req, res) => {
  try {
    const {
      checkoutId,
      merchantTxnId,
      userId,
      type,
      planName,
      cycle,
      amount,
      currency,
      transactionId,
      customerEmail,
      userEmail,
      toolName,
      paymentType,
      source,
    } = req.body

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      })
    }

    const paymentKey = `${checkoutId}-${merchantTxnId}-${userId}`
    if (processedPayments.has(paymentKey)) {
      return res.json({
        success: true,
        message: "Payment already processed",
        duplicate: true,
      })
    }

    processedPayments.add(paymentKey)

    const finalAmount = Number.parseFloat(amount) || 0
    const finalTransactionId = transactionId || merchantTxnId || checkoutId || "N/A"

    // REMOVED: Email sending logic - EmailJS handles this now
    console.log("📧 Email will be sent by frontend EmailJS")

    if (type === "subscription" || planName || paymentType === "subscription") {
      // FIXED: Update database with proper subscription data
      try {
        const subscriptionData = {
          status: "active",
          lastPayment: new Date().toISOString(),
          transactionId: finalTransactionId,
          planName: planName || "Premium Plan",
          billingCycle: cycle || "monthly",
          isActive: true,
          amount: finalAmount,
          currency: currency || "ZAR",
          activatedAt: new Date().toISOString(),
          nextBillingDate: calculateNextBillingDate(cycle || "monthly"),
          customerEmail: customerEmail || userEmail
        }

        // FIXED: Only add registrationId if it exists and is not undefined
        if (req.body.registrationId && req.body.registrationId !== "undefined" && req.body.registrationId !== null) {
          subscriptionData.registrationId = req.body.registrationId
        }

        await FirestoreService.updateUserSubscription(userId, subscriptionData)
        console.log("✅ Subscription saved to database successfully")
      } catch (dbError) {
        console.error("Database update failed:", dbError)
      }
    } else {
      // FIXED: Update database with proper payment data
      if (checkoutId) {
        try {
          await FirestoreService.updatePaymentRecord({
            checkoutId: checkoutId,
            status: "completed",
            transactionId: finalTransactionId,
            completedAt: new Date().toISOString(),
            amount: finalAmount,
            currency: currency || "ZAR",
            userId: userId,
            toolName: toolName,
            customerEmail: customerEmail || userEmail
          })
          console.log("✅ Payment saved to database successfully")
        } catch (dbError) {
          console.error("Database update failed:", dbError)
        }
      }
    }

    res.json({
      success: true,
      message: "Payment success processed - email handled by frontend",
      updated: true,
      emailHandledBy: "frontend-emailjs",
      amount: finalAmount,
    })
  } catch (error) {
    console.error("Error handling payment success:", error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// ==================== CREATE SUBSCRIPTION ====================
router.post("/create-subscription", async (req, res) => {
  try {
    const { userId, planName, billingCycle, amount, currency = "ZAR", customerEmail, customerName } = req.body

    if (!userId || !planName || !amount || !billingCycle) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, planName, billingCycle, and amount",
      })
    }

    if (!["monthly", "annually"].includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        error: "Invalid billing cycle (must be monthly or annually)",
      })
    }

    const numericAmount = Number.parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Amount must be a positive number",
      })
    }

    const session = await peach.createSubscriptionPaymentSession({
      userId,
      planName,
      billingCycle,
      amount: numericAmount,
      currency,
      customerEmail,
      customerName,
    })

    // FIXED: Save subscription record to database with proper data cleaning
    const subscriptionData = {
      userId,
      planName,
      billingCycle,
      amount: numericAmount,
      currency,
      checkoutId: session.checkoutId,
      merchantTransactionId: session.merchantTransactionId,
      status: "pending_payment",
      subscriptionType: "recurring",
      createdAt: new Date().toISOString(),
      nextBillingDate: calculateNextBillingDate(billingCycle),
      isActive: false,
      customerEmail: customerEmail || null,
      customerName: customerName || null
      // REMOVED: registrationId - will be added later when payment completes
    }

    await FirestoreService.saveSubscriptionRecord(subscriptionData)
    console.log("✅ Subscription record saved to database")

    res.json({
      success: true,
      checkoutId: session.checkoutId,
      merchantTransactionId: session.merchantTransactionId,
      entityId: session.entityId,
      checkoutEndpoint: session.checkoutEndpoint,
      redirectUrl: session.redirectUrl,
      orderId: session.merchantTransactionId,
      paymentType: "subscription",
      subscriptionType: "recurring",
      planName,
      billingCycle,
      requiresCardRegistration: true,
    })
  } catch (error) {
    console.error("Create subscription error:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create subscription",
    })
  }
})

// ==================== CREATE CHECKOUT ====================
router.post("/create-checkout", async (req, res) => {
  try {
    const { userId, amount, currency = "ZAR", customerEmail, customerName, toolName, toolCategory } = req.body

    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      })
    }

    const numericAmount = Number.parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Amount must be a positive number",
      })
    }

    const session = await peach.createPaymentSession({
      userId,
      amount: numericAmount,
      currency,
      customerEmail,
      customerName,
      toolName,
      toolCategory,
      actionType: "one_time",
    })

    // FIXED: Save payment record to database
    const paymentData = {
      userId,
      amount: numericAmount,
      currency,
      checkoutId: session.checkoutId,
      merchantTransactionId: session.merchantTransactionId,
      status: "pending",
      type: "one_time",
      toolName,
      toolCategory,
      customerEmail,
      customerName,
      createdAt: new Date().toISOString(),
    }

    await FirestoreService.savePaymentRecord(paymentData)
    console.log("✅ Payment record saved to database")

    res.json({
      success: true,
      checkoutId: session.checkoutId,
      merchantTransactionId: session.merchantTransactionId,
      entityId: session.entityId,
      checkoutEndpoint: session.checkoutEndpoint,
      redirectUrl: session.redirectUrl,
      orderId: session.merchantTransactionId,
      paymentType: "one_time",
    })
  } catch (error) {
    console.error("Create checkout error:", error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// ==================== UPDATED WEBHOOK HANDLER ====================
router.post("/webhook", async (req, res) => {
  try {
    console.log("🔔 Webhook received:", req.body)
    
    const {
      checkoutId,
      merchantTransactionId,
      id: transactionId,
      amount,
      currency,
      result,
      customParameters,
      paymentBrand,
      last4Digits
    } = req.body

    // Check if payment was successful
    const isSuccess = result?.code?.match(/^000\./)
    
    if (isSuccess) {
      console.log("✅ Webhook: Payment successful - EmailJS will handle email on frontend")
      
      // Get payment type from custom parameters
      const paymentType = customParameters?.actionType === "subscription" ? "subscription" : "one_time"
      
      // REMOVED: Email sending logic - EmailJS handles this now
      console.log("📧 Email will be sent by frontend EmailJS")

      // FIXED: Update database only with proper data
      try {
        if (paymentType === "subscription") {
          await FirestoreService.updateUserSubscription(customParameters?.userId || "webhook-user", {
            status: "active",
            lastPayment: new Date().toISOString(),
            transactionId: transactionId,
            planName: customParameters?.planName || "Premium Plan",
            billingCycle: customParameters?.billingCycle || "monthly",
            isActive: true,
            amount: Number.parseFloat(amount) || 0,
            currency: currency || "ZAR",
            activatedAt: new Date().toISOString(),
            nextBillingDate: calculateNextBillingDate(customParameters?.billingCycle || "monthly")
          })
          console.log("✅ Subscription updated via webhook")
        } else {
          await FirestoreService.updatePaymentRecord({
            checkoutId: checkoutId,
            status: "completed",
            transactionId: transactionId,
            completedAt: new Date().toISOString(),
            amount: Number.parseFloat(amount) || 0,
            currency: currency || "ZAR",
            userId: customParameters?.userId,
            toolName: customParameters?.toolName
          })
          console.log("✅ Payment updated via webhook")
        }
      } catch (dbError) {
        console.error("❌ Webhook database update failed:", dbError)
      }

      res.json({
        success: true,
        message: "Webhook processed successfully - email handled by frontend",
        emailHandledBy: "frontend-emailjs"
      })
    } else {
      console.log("❌ Webhook: Payment failed:", result)
      res.json({
        success: false,
        message: "Payment was not successful"
      })
    }
  } catch (error) {
    console.error("❌ Webhook processing error:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// ==================== GET USER SUBSCRIPTION STATUS ====================
router.get("/subscription/:userId", async (req, res) => {
  try {
    const { userId } = req.params
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      })
    }

    const subscription = await FirestoreService.getUserSubscription(userId)
    
    if (!subscription) {
      return res.json({
        success: true,
        hasSubscription: false,
        subscription: null
      })
    }

    // Check if subscription is still active
    const isActive = subscription.isActive && subscription.status === "active"
    
    res.json({
      success: true,
      hasSubscription: isActive,
      subscription: {
        planName: subscription.planName,
        billingCycle: subscription.billingCycle,
        amount: subscription.amount,
        currency: subscription.currency,
        status: subscription.status,
        isActive: subscription.isActive,
        activatedAt: subscription.activatedAt,
        nextBillingDate: subscription.nextBillingDate,
        lastPayment: subscription.lastPayment
      }
    })
  } catch (error) {
    console.error("Error getting subscription:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// ==================== UTILITY FUNCTIONS ====================
function calculateNextBillingDate(billingCycle) {
  const date = new Date()
  if (billingCycle === "monthly") {
    date.setMonth(date.getMonth() + 1)
  } else if (billingCycle === "annually") {
    date.setFullYear(date.getFullYear() + 1)
  }
  return date.toISOString()
}

router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "peach-payments",
    timestamp: new Date().toISOString(),
    emailService: "frontend-emailjs"
  })
})

module.exports = router