"use client"

import { useState, useEffect } from "react"

const PeachPaymentsCheckout = ({ orderData, userId, onSuccess, onError, onCancel }) => {
  const [checkoutId, setCheckoutId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Create checkout session when component mounts
  useEffect(() => {
    createCheckoutSession()
  }, [orderData, userId])

  const createCheckoutSession = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🚀 Creating checkout session for:", orderData)

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || "https://e362a417aae0.ngrok-free.app"}/api/payments/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: orderData.amount,
            currency: orderData.currency || "ZAR",
            userId: userId,
            planName: orderData.planName,
            billingCycle: orderData.billingCycle || "one-time",
            actionType: orderData.actionType || "purchase",
            toolName: orderData.toolName,
            toolCategory: orderData.toolCategory,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create checkout session")
      }

      const data = await response.json()
      console.log("✅ Checkout session created:", data)

      if (data.success && data.checkoutId) {
        setCheckoutId(data.checkoutId)
        // Initialize Peach Payments widget
        initializePeachPayments(data.checkoutId)
      } else {
        throw new Error("Invalid checkout response")
      }
    } catch (error) {
      console.error("❌ Error creating checkout session:", error)
      setError(error.message)
      if (onError) onError(error)
    } finally {
      setLoading(false)
    }
  }

  const initializePeachPayments = (checkoutId) => {
    // Load Peach Payments script if not already loaded
    if (!window.Checkout) {
      const script = document.createElement("script")
      script.src = "https://checkout.peachpayments.com/js/checkout.js"
      script.async = true
      script.onload = () => renderCheckout(checkoutId)
      script.onerror = () => {
        setError("Failed to load payment system")
        if (onError) onError(new Error("Failed to load payment system"))
      }
      document.body.appendChild(script)
    } else {
      renderCheckout(checkoutId)
    }
  }

  const renderCheckout = (checkoutId) => {
    try {
      console.log("🎨 Rendering checkout with ID:", checkoutId)

      const checkout = window.Checkout.initiate({
        checkoutId: checkoutId,
        key: process.env.REACT_APP_PEACH_ENTITY_ID || "8ac7a4c89806ea2e01980a5ef7ed0470",
        options: {
          theme: {
            brand: {
              primary: "#A67C52", // Your accent gold color
              secondary: "#372C27", // Your dark brown color
            },
            cards: {
              background: "#F5F2F0", // Your off-white color
              backgroundHover: "#EFEBE9", // Your cream color
            },
          },
          enableCancelButton: true,
          enableAmountField: true,
          enableCardBrandDisplay: true,
        },
        events: {
          onCompleted: (event) => {
            console.log("✅ Payment completed:", event)
            if (onSuccess) onSuccess(event)
          },
          onCancelled: (event) => {
            console.log("❌ Payment cancelled:", event)
            if (onCancel) onCancel(event)
          },
          onExpired: (event) => {
            console.log("⏰ Payment expired:", event)
            if (onError) onError(new Error("Payment session expired"))
          },
          onError: (event) => {
            console.error("❌ Payment error:", event)
            if (onError) onError(new Error(event.message || "Payment failed"))
          },
        },
      })

      // Render the checkout form
      checkout.render("#peach-checkout-container")
    } catch (error) {
      console.error("❌ Error rendering checkout:", error)
      setError("Failed to initialize payment form")
      if (onError) onError(error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading payment form...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-600 text-xl mr-3">⚠️</div>
          <div>
            <h3 className="text-red-800 font-semibold">Payment Error</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={createCheckoutSession}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{orderData.planName}</span>
          <span className="font-semibold">R{(orderData.amount / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Peach Payments Checkout Container */}
      <div id="peach-checkout-container" className="min-h-[400px]">
        {/* Peach Payments form will be rendered here */}
      </div>

      {/* Security Notice */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>🔒 Your payment is secured by Peach Payments</p>
      </div>
    </div>
  )
}

export default PeachPaymentsCheckout
