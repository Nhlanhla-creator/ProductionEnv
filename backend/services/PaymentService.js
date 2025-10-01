const axios = require("axios")
const crypto = require("crypto")

class PaymentService {
  constructor() {
    // Load environment variables with validation
    this.entityId = process.env.PEACH_ENTITY_ID?.trim()
    this.clientId = process.env.PEACH_CLIENT_ID?.trim()
    this.clientSecret = process.env.PEACH_CLIENT_SECRET?.trim()
    this.merchantId = process.env.PEACH_MERCHANT_ID?.trim()

    // Use the same entity ID for recurring
    this.recurringEntityId = this.entityId

    // API endpoints - SANDBOX configuration
    this.authEndpoint = "https://sandbox-dashboard.peachpayments.com/api/oauth/token"
    this.checkoutEndpoint = process.env.PEACH_CHECKOUT_ENDPOINT || "https://testsecure.peachpayments.com"
    this.recurringEndpoint = "https://testsecure.peachpayments.com"

    // Frontend URL for redirects (your ngrok URL)
    this.frontendUrl = process.env.FRONTEND_URL || "https://www.bigmarketplace.africa"

    console.log("🔧 PaymentService initialized with:", {
      entityId: this.entityId ? `****${this.entityId.slice(-4)}` : "NOT SET",
      clientId: this.clientId ? `****${this.clientId.slice(-4)}` : "NOT SET",
      merchantId: this.merchantId ? `****${this.merchantId.slice(-4)}` : "NOT SET",
      recurringEntityId: this.recurringEntityId ? `****${this.recurringEntityId.slice(-4)}` : "NOT SET",
      authEndpoint: this.authEndpoint,
      checkoutEndpoint: this.checkoutEndpoint,
      recurringEndpoint: this.recurringEndpoint,
      frontendUrl: this.frontendUrl,
      environment: "SANDBOX - EmailJS FRONTEND + DATABASE PERSISTENCE",
    })

    // Validate required configuration
    const missingVars = []
    if (!this.entityId) missingVars.push("PEACH_ENTITY_ID")
    if (!this.clientId) missingVars.push("PEACH_CLIENT_ID")
    if (!this.clientSecret) missingVars.push("PEACH_CLIENT_SECRET")
    if (!this.merchantId) missingVars.push("PEACH_MERCHANT_ID")

    if (missingVars.length > 0) {
      console.error("❌ Missing required Peach Payments configuration:")
      missingVars.forEach((varName) => {
        console.error(`${varName}: NOT SET`)
      })
      throw new Error(`Missing required Peach Payments configuration: ${missingVars.join(", ")}`)
    }
  }

  async getAccessToken() {
    try {
      console.log("🔐 Getting access token from SANDBOX:", this.authEndpoint)

      const response = await axios.post(
        this.authEndpoint,
        {
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          merchantId: this.merchantId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      )

      console.log("🔐 Access token response status:", response.status)
      console.log("✅ Access token obtained successfully from sandbox")

      if (!response.data.access_token) {
        throw new Error("No access token in response")
      }

      return response.data.access_token
    } catch (error) {
      console.error("❌ Payment auth error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        endpoint: this.authEndpoint,
        config: {
          clientId: this.clientId ? "SET" : "NOT SET",
          clientSecret: this.clientSecret ? "SET" : "NOT SET",
          merchantId: this.merchantId ? "SET" : "NOT SET",
        },
      })
      throw new Error(`Payment authentication failed: ${error.response?.data?.message || error.message}`)
    }
  }

  async createPaymentSession(paymentData) {
    try {
      console.log("💳 Creating one-time payment session with data:", {
        amount: paymentData.amount,
        currency: paymentData.currency,
        userId: paymentData.userId,
        customerEmail: paymentData.customerEmail,
        actionType: paymentData.actionType,
        toolName: paymentData.toolName,
      })

      // Validate input data
      if (!paymentData.amount || paymentData.amount <= 0) {
        throw new Error("Invalid amount: must be greater than 0")
      }
      if (!paymentData.userId) {
        throw new Error("User ID is required")
      }

      const token = await this.getAccessToken()
      const merchantTransactionId = paymentData.orderId || `PAY-${Date.now()}-${paymentData.userId.slice(0, 8)}`
      const nonce = crypto.randomBytes(16).toString("hex").toUpperCase()

      // ENHANCED: Success URL with all necessary data for database saving
      const successUrl =
        `${this.frontendUrl}/payment/results?` +
        new URLSearchParams({
          status: "success",
          type: "payment",
          userId: paymentData.userId,
          merchantTxnId: merchantTransactionId,
          amount: paymentData.amount.toString(),
          currency: paymentData.currency || "ZAR",
          toolName: paymentData.toolName || "",
          toolCategory: paymentData.toolCategory || "",
          customerEmail: paymentData.customerEmail || "",
          checkoutId: "WILL_BE_REPLACED", // Will be updated with actual checkoutId
        }).toString()

      const payload = {
        authentication: {
          entityId: this.entityId,
        },
        amount: Number(paymentData.amount).toFixed(2),
        currency: paymentData.currency || "ZAR",
        paymentType: "DB",
        merchantTransactionId: merchantTransactionId,
        nonce: nonce,
        customer: {
          email: paymentData.customerEmail || "customer@example.com",
          givenName: paymentData.customerName?.split(" ")[0] || "Customer",
          surname: paymentData.customerName?.split(" ").slice(1).join(" ") || "User",
        },
        billing: {
          country: "ZA",
        },
        customParameters: {
          userId: paymentData.userId,
          toolName: paymentData.toolName || "",
          toolCategory: paymentData.toolCategory || "",
          actionType: paymentData.actionType || "one_time",
          customerEmail: paymentData.customerEmail || "",
          // Add more data for database saving
          saveToDatabase: "true",
          paymentFlow: "one_time_purchase"
        },
        shopperResultUrl: successUrl,
        // NO notificationUrl since backend not accessible via webhook
      }

      const requestUrl = `${this.checkoutEndpoint}/v2/checkout`

      console.log("📤 Sending one-time payment request:", {
        url: requestUrl,
        entityId: this.entityId,
        merchantTransactionId: merchantTransactionId,
        amount: payload.amount,
        redirectUrl: successUrl,
        mode: "FRONTEND_EMAILJS_WITH_DATABASE",
      })

      const response = await axios.post(requestUrl, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Origin: this.frontendUrl,
        },
        timeout: 30000,
      })

      console.log("✅ One-time payment session created:", {
        checkoutId: response.data.checkoutId,
        status: response.status,
        mode: "FRONTEND_EMAILJS_WITH_DATABASE",
      })

      if (!response.data.checkoutId) {
        throw new Error("No checkout ID received from Peach Payments")
      }

      return {
        success: true,
        checkoutId: response.data.checkoutId,
        merchantTransactionId: merchantTransactionId,
        entityId: this.entityId,
        checkoutEndpoint: this.checkoutEndpoint,
        redirectUrl: `${this.checkoutEndpoint}/checkout/${response.data.checkoutId}`,
        orderId: merchantTransactionId,
        // Additional data for frontend
        paymentData: {
          userId: paymentData.userId,
          amount: paymentData.amount,
          currency: paymentData.currency || "ZAR",
          toolName: paymentData.toolName,
          toolCategory: paymentData.toolCategory,
          customerEmail: paymentData.customerEmail
        }
      }
    } catch (error) {
      console.error("❌ One-time payment session creation error:", error)
      
      if (error.response) {
        console.error("🔍 FULL ERROR RESPONSE:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        })
      }
      
      throw this.handlePaymentError(error)
    }
  }

  async createSubscriptionPaymentSession(subscriptionData) {
    try {
      console.log("💳 Creating subscription payment session with data:", {
        userId: subscriptionData.userId,
        planName: subscriptionData.planName,
        billingCycle: subscriptionData.billingCycle,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency,
      })

      // Validate input data
      if (!subscriptionData.amount || subscriptionData.amount <= 0) {
        throw new Error("Invalid amount: must be greater than 0")
      }
      if (!subscriptionData.userId) {
        throw new Error("User ID is required")
      }
      if (!subscriptionData.planName) {
        throw new Error("Plan name is required")
      }
      if (!subscriptionData.billingCycle) {
        throw new Error("Billing cycle is required")
      }

      const token = await this.getAccessToken()
      const merchantTransactionId = `SUB-${Date.now()}-${subscriptionData.userId.slice(0, 8)}`
      const nonce = crypto.randomBytes(16).toString("hex").toUpperCase()

      // ENHANCED: Success URL with all subscription data for database saving
      const successUrl =
        `${this.frontendUrl}/payment/results?` +
        new URLSearchParams({
          status: "success",
          type: "subscription",
          userId: subscriptionData.userId,
          merchantTxnId: merchantTransactionId,
          amount: subscriptionData.amount.toString(),
          currency: subscriptionData.currency || "ZAR",
          planName: subscriptionData.planName,
          cycle: subscriptionData.billingCycle,
          customerEmail: subscriptionData.customerEmail || "",
          customerName: subscriptionData.customerName || "",
        }).toString()

      // Use regular payment (DB) for initial subscription payment
      const payload = {
        authentication: {
          entityId: this.entityId,
        },
        amount: Number(subscriptionData.amount).toFixed(2),
        currency: subscriptionData.currency || "ZAR",
        paymentType: "DB", // Regular payment for subscription activation
        merchantTransactionId: merchantTransactionId,
        nonce: nonce,
        customer: {
          email: subscriptionData.customerEmail || "customer@example.com",
          givenName: subscriptionData.customerName?.split(" ")[0] || "Customer",
          surname: subscriptionData.customerName?.split(" ").slice(1).join(" ") || "User",
        },
        billing: {
          country: "ZA",
        },
        customParameters: {
          userId: subscriptionData.userId,
          planName: subscriptionData.planName,
          billingCycle: subscriptionData.billingCycle,
          actionType: "subscription",
          subscriptionType: "initial_payment",
          customerEmail: subscriptionData.customerEmail || "",
          customerName: subscriptionData.customerName || "",
          // Add more data for database saving
          saveToDatabase: "true",
          paymentFlow: "subscription_activation"
        },
        shopperResultUrl: successUrl,
        // NO notificationUrl since backend not accessible via webhook
      }

      const requestUrl = `${this.checkoutEndpoint}/v2/checkout`

      console.log("📤 Sending subscription payment request:", {
        url: requestUrl,
        entityId: this.entityId,
        merchantTransactionId: merchantTransactionId,
        amount: payload.amount,
        paymentType: payload.paymentType,
        planName: subscriptionData.planName,
        billingCycle: subscriptionData.billingCycle,
        redirectUrl: successUrl,
        mode: "FRONTEND_EMAILJS_WITH_DATABASE",
      })

      const response = await axios.post(requestUrl, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Origin: this.frontendUrl,
        },
        timeout: 30000,
      })

      console.log("✅ Subscription payment session created:", {
        checkoutId: response.data.checkoutId,
        status: response.status,
        paymentType: "DB (subscription activation)",
        mode: "FRONTEND_EMAILJS_WITH_DATABASE",
      })

      if (!response.data.checkoutId) {
        throw new Error("No checkout ID received from Peach Payments")
      }

      return {
        success: true,
        checkoutId: response.data.checkoutId,
        merchantTransactionId: merchantTransactionId,
        entityId: this.entityId,
        checkoutEndpoint: this.checkoutEndpoint,
        redirectUrl: `${this.checkoutEndpoint}/checkout/${response.data.checkoutId}`,
        orderId: merchantTransactionId,
        subscriptionType: "initial_payment",
        requiresCardRegistration: false,
        // Additional data for frontend
        subscriptionData: {
          userId: subscriptionData.userId,
          planName: subscriptionData.planName,
          billingCycle: subscriptionData.billingCycle,
          amount: subscriptionData.amount,
          currency: subscriptionData.currency || "ZAR",
          customerEmail: subscriptionData.customerEmail,
          customerName: subscriptionData.customerName
        }
      }
    } catch (error) {
      console.error("❌ Subscription payment session creation error:", error)
      
      if (error.response) {
        console.error("🔍 FULL SUBSCRIPTION ERROR RESPONSE:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        })
      }
      
      throw this.handlePaymentError(error)
    }
  }

  async verifyPayment(checkoutId) {
    try {
      console.log("🔍 Verifying payment for checkout:", checkoutId)

      if (!checkoutId) {
        throw new Error("Checkout ID is required")
      }

      const token = await this.getAccessToken()
      const requestUrl = `${this.checkoutEndpoint}/v1/checkouts/${checkoutId}/payment`

      console.log("🔍 Making verification request to:", requestUrl)

      const response = await axios.get(requestUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      })

      console.log("🔍 Payment verification response:", {
        resultCode: response.data.result?.code,
        transactionId: response.data.id,
        amount: response.data.amount,
        registrationId: response.data.registrationId ? "****" + response.data.registrationId.slice(-4) : "None",
        customParameters: response.data.customParameters
      })

      const isSuccess = response.data.result?.code?.match(/^000\./)

      return {
        success: !!isSuccess,
        transactionId: response.data.id,
        amount: response.data.amount,
        currency: response.data.currency,
        resultCode: response.data.result?.code,
        resultDescription: response.data.result?.description,
        merchantTransactionId: response.data.merchantTransactionId,
        customParameters: response.data.customParameters,
        registrationId: response.data.registrationId,
        cardBrand: response.data.paymentBrand,
        cardLast4: response.data.last4Digits,
        entityIdUsed: this.entityId,
        // Extract payment data for database saving
        paymentData: {
          userId: response.data.customParameters?.userId,
          toolName: response.data.customParameters?.toolName,
          toolCategory: response.data.customParameters?.toolCategory,
          planName: response.data.customParameters?.planName,
          billingCycle: response.data.customParameters?.billingCycle,
          actionType: response.data.customParameters?.actionType,
          customerEmail: response.data.customParameters?.customerEmail
        }
      }
    } catch (error) {
      console.error("❌ Payment verification error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      })

      if (error.response?.status === 404) {
        throw new Error("Payment not found")
      } else {
        throw new Error(`Payment verification failed: ${error.response?.data?.result?.description || error.message}`)
      }
    }
  }

  async getPaymentStatus(checkoutId) {
    try {
      console.log("📊 Getting payment status for checkout:", checkoutId)
      const verification = await this.verifyPayment(checkoutId)

      console.log("📊 Payment verification result:", {
        success: verification.success,
        status: verification.success ? "completed" : "failed",
        transactionId: verification.transactionId,
        paymentData: verification.paymentData
      })

      return {
        success: verification.success,
        status: verification.success ? "completed" : "failed",
        transactionId: verification.transactionId,
        amount: verification.amount,
        currency: verification.currency,
        resultCode: verification.resultCode,
        resultDescription: verification.resultDescription,
        merchantTransactionId: verification.merchantTransactionId,
        customParameters: verification.customParameters,
        registrationId: verification.registrationId,
        cardBrand: verification.cardBrand,
        cardLast4: verification.cardLast4,
        entityIdUsed: this.entityId,
        paymentData: verification.paymentData
      }
    } catch (error) {
      console.error("❌ Payment status check error:", error)
      return {
        success: false,
        status: "error",
        error: error.message,
      }
    }
  }

  handlePaymentError(error) {
    if (error.response?.status === 400) {
      const errorDetail = error.response.data?.result?.description || error.response.data?.message || "Bad request"
      return new Error(`Invalid payment data: ${errorDetail}`)
    } else if (error.response?.status === 401) {
      return new Error("Payment authentication failed - check your credentials")
    } else if (error.response?.status === 403) {
      return new Error("Payment access denied - check your entity ID and domain allowlist")
    } else if (error.response?.status === 415) {
      return new Error("Unsupported media type - check request format")
    } else if (error.response?.status >= 500) {
      return new Error("Payment service temporarily unavailable")
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return new Error("Unable to connect to payment service")
    } else if (error.code === "ETIMEDOUT") {
      return new Error("Payment service timeout - please try again")
    } else {
      return new Error(`Payment operation failed: ${error.message}`)
    }
  }
}

module.exports = PaymentService