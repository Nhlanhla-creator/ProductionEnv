"use client"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"

const PaymentPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [orderData, setOrderData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const initializePayment = async () => {
      try {
        // First try to get data from navigation state
        if (location.state) {
          setOrderData(location.state.orderData)
          setUser(location.state.user)
          return
        }

        // Fallback to localStorage
        const savedOrderData = localStorage.getItem("pendingOrder")
        const savedUser = localStorage.getItem("currentUser")

        if (savedOrderData && savedUser) {
          setOrderData(JSON.parse(savedOrderData))
          setUser(JSON.parse(savedUser))
        } else {
          throw new Error("No payment data found")
        }
      } catch (err) {
        console.error("Payment initialization error:", err)
        setError(err.message)
        navigate("/", { replace: true })
      } finally {
        setLoading(false)
      }
    }

    initializePayment()
  }, [location.state, navigate])

  const handlePaymentSuccess = (result) => {
    console.log("Payment successful:", result)
    localStorage.removeItem("pendingOrder")
    
    navigate("/payment-success", {
      state: {
        transactionId: result.id || `txn_${Date.now()}`,
        orderData: orderData,
        result: result,
      },
    })
  }

  const handlePaymentError = (error) => {
    console.error("Payment error:", error)
    navigate("/payment-error", {
      state: {
        error: error.message || "Payment failed",
        orderData: orderData,
      },
    })
  }

  const handlePaymentCancel = () => {
    console.log("Payment cancelled")
    navigate(-1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading payment details...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center">
            <div className="text-red-600 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-semibold">Payment Error</h3>
              <p className="text-red-600 mt-1">{error}</p>
              <button
                onClick={() => navigate("/")}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!orderData || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center">
            <div className="text-yellow-600 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-yellow-800 font-semibold">Missing Data</h3>
              <p className="text-yellow-600 mt-1">Unable to load payment details</p>
              <button
                onClick={() => navigate("/")}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Complete Your Purchase</h1>
          <p className="mt-2 text-gray-600">Secure payment powered by Peach Payments</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <PeachPaymentsCheckout
            orderData={orderData}
            userId={user.uid}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={handlePaymentCancel}
          />
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Having trouble?{" "}
            <a href="/support" className="text-blue-600 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

const PeachPaymentsCheckout = ({ orderData, userId, onSuccess, onError, onCancel }) => {
  const [checkoutId, setCheckoutId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checkoutInitialized, setCheckoutInitialized] = useState(false)

  useEffect(() => {
    const createCheckoutSession = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL || "https://6233cda3a50b.ngrok-free.app"}/api/payments/create-checkout`,
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
          }
        )

        if (!response.ok) {
          throw new Error(await response.text())
        }

        const data = await response.json()
        
        if (data.checkoutId) {
          setCheckoutId(data.checkoutId)
          initializePeachPayments(data.checkoutId)
        } else {
          throw new Error("No checkout ID received")
        }
      } catch (err) {
        console.error("Checkout error:", err)
        setError(err.message)
        onError?.(err)
      } finally {
        setLoading(false)
      }
    }

    createCheckoutSession()

    return () => {
      if (window.Checkout) {
        try {
          window.Checkout.unmount()
        } catch (e) {
          console.log("Cleanup error:", e)
        }
      }
    }
  }, [orderData, userId, onError])

  const initializePeachPayments = (checkoutId) => {
    if (!document.getElementById("peach-checkout-container")) {
      const container = document.createElement("div")
      container.id = "peach-checkout-container"
      container.style.minHeight = "400px"
      document.querySelector("#payment-form-container").appendChild(container)
    }

    const loadScript = () => {
      if (window.Checkout) {
        renderCheckout(checkoutId)
        return
      }

      const script = document.createElement("script")
      script.src = "https://checkout.peachpayments.com/js/checkout.js"
      script.async = true
      script.onload = () => renderCheckout(checkoutId)
      script.onerror = () => {
        setError("Failed to load payment system")
        onError?.(new Error("Payment system failed to load"))
      }
      document.body.appendChild(script)
    }

    const renderCheckout = (checkoutId) => {
      try {
        const checkout = window.Checkout.initiate({
          checkoutId: checkoutId,
          key: process.env.REACT_APP_PEACH_ENTITY_ID || "8ac7a4c89806ea2e01980a5ef7ed0470",
          options: {
            theme: {
              brand: {
                primary: "#A67C52",
                secondary: "#372C27",
              },
              cards: {
                background: "#F5F2F0",
                backgroundHover: "#EFEBE9",
              },
            },
            enableCancelButton: true,
            enableAmountField: true,
            enableCardBrandDisplay: true,
          },
          events: {
            onCompleted: (event) => {
              console.log("Payment completed:", event)
              onSuccess?.(event)
            },
            onCancelled: (event) => {
              console.log("Payment cancelled:", event)
              onCancel?.(event)
            },
            onExpired: (event) => {
              console.log("Payment expired:", event)
              onError?.(new Error("Payment session expired"))
            },
            onError: (event) => {
              console.error("Payment error:", event)
              onError?.(new Error(event.message || "Payment failed"))
            },
          },
        })

        checkout.render("#peach-checkout-container")
        setCheckoutInitialized(true)
      } catch (err) {
        console.error("Checkout render error:", err)
        setError("Failed to initialize payment form")
        onError?.(err)
      }
    }

    loadScript()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Setting up secure payment...</p>
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
              onClick={() => window.location.reload()}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{orderData.planName}</span>
          <span className="font-semibold">R{(orderData.amount / 100).toFixed(2)}</span>
        </div>
      </div>

      <div id="payment-form-container">
        {!checkoutInitialized && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Loading payment form...</span>
          </div>
        )}
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        <p>🔒 Your payment is secured by Peach Payments</p>
      </div>
    </div>
  )
}

export default PaymentPage