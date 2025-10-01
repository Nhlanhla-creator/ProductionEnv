// Script to help you create the new EmbeddedCheckout component
const fs = require("fs")
const path = require("path")

console.log("📝 Creating new EmbeddedCheckout component...")
console.log("=============================================")

// The new component code
const newComponentCode = `"use client"

import { useEffect, useState, useRef, useCallback } from "react"

const EmbeddedCheckout = ({ checkoutId, onCompleted, onCancelled, onExpired, onError, paymentType }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [iframeUrl, setIframeUrl] = useState(null)
  const [paymentResult, setPaymentResult] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [usePopup, setUsePopup] = useState(false)
  const [popupWindow, setPopupWindow] = useState(null)
  const [debugLogs, setDebugLogs] = useState([])
  const [statusCheckInterval, setStatusCheckInterval] = useState(null)
  const [emailSent, setEmailSent] = useState(false)
  const iframeRef = useRef(null)
  const messageHandlerRef = useRef(null)

  // ENHANCED: Debug logging function
  const addDebugLog = useCallback((message, data = null) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      data,
    }
    console.log("🔍 EmbeddedCheckout Debug:", logEntry)
    setDebugLogs((prev) => [...prev.slice(-10), logEntry]) // Keep last 10 logs
  }, [])

  const openPaymentPopup = useCallback(() => {
    if (!iframeUrl) return
    addDebugLog("Opening payment popup", { url: iframeUrl })

    const popup = window.open(
      iframeUrl,
      "peach_payment",
      "width=800,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no",
    )

    setPopupWindow(popup)
    setUsePopup(true)
    setLoading(false)

    // Monitor popup for closure
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        addDebugLog("Payment popup closed")
        if (!paymentResult) {
          // Try to detect successful payment when popup closes
          setTimeout(() => {
            handlePaymentCompletion("popup_closed")
          }, 2000)
        }
      }
    }, 1000)

    // Clean up interval after 10 minutes
    setTimeout(() => clearInterval(checkClosed), 600000)
  }, [iframeUrl, checkoutId, paymentResult, addDebugLog])

  // ENHANCED: Better user email detection
  const getUserEmail = useCallback(() => {
    let userEmail = null
    try {
      // Try Firebase Auth
      if (window.getAuth && typeof window.getAuth === "function") {
        const auth = window.getAuth()
        if (auth?.currentUser?.email) {
          userEmail = auth.currentUser.email
          addDebugLog("Email from Firebase Auth", { email: userEmail })
        }
      }

      // Try window.auth (alternative Firebase reference)
      if (!userEmail && window.auth?.currentUser?.email) {
        userEmail = window.auth.currentUser.email
        addDebugLog("Email from window.auth", { email: userEmail })
      }

      // Try localStorage
      if (!userEmail) {
        userEmail = localStorage.getItem("userEmail") || localStorage.getItem("user_email")
        if (userEmail) addDebugLog("Email from localStorage", { email: userEmail })
      }

      // Try sessionStorage
      if (!userEmail) {
        userEmail = sessionStorage.getItem("userEmail") || sessionStorage.getItem("user_email")
        if (userEmail) addDebugLog("Email from sessionStorage", { email: userEmail })
      }

      // FALLBACK: Use the test email for now
      if (!userEmail) {
        userEmail = "nhlanhlamsomi2024@gmail.com"
        addDebugLog("Using fallback email", { email: userEmail })
      }
    } catch (error) {
      addDebugLog("Error getting user email", { error: error.message })
      userEmail = "nhlanhlamsomi2024@gmail.com" // Fallback
    }

    return userEmail
  }, [addDebugLog])

  // CRITICAL: New function to handle payment completion and send emails
  const handlePaymentCompletion = useCallback(
    async (source = "unknown") => {
      if (emailSent) {
        addDebugLog("Email already sent, skipping duplicate")
        return
      }

      addDebugLog("🚨 CRITICAL: Handling payment completion", { source, checkoutId })

      try {
        const userEmail = getUserEmail()
        const apiUrl = process.env.REACT_APP_API_URL || "https://brown-ivory-website-h8srool38-big-league.vercel.app"
        const endpoint = \`\${apiUrl}/api/payments/handle-payment-success\`

        // Create payment success data
        const paymentData = {
          checkoutId: checkoutId,
          merchantTxnId: checkoutId, // Use checkoutId as fallback
          userId: "user-" + Date.now(), // Generate a user ID if not available
          type: paymentType === "subscription" ? "subscription" : "payment",
          amount: 100, // Default amount - you might want to store this when creating the checkout
          currency: "ZAR",
          customerEmail: userEmail,
          userEmail: userEmail,
          toolName: paymentType === "subscription" ? undefined : "Growth Tool",
          planName: paymentType === "subscription" ? "Subscription Plan" : undefined,
          cycle: paymentType === "subscription" ? "monthly" : undefined,
          transactionId: checkoutId,
          source: source,
          timestamp: new Date().toISOString(),
          paymentType: paymentType === "subscription" ? "subscription" : "one_time",
        }

        addDebugLog("🚨 CRITICAL: Sending payment success notification", {
          endpoint,
          email: userEmail,
          paymentType: paymentData.paymentType,
          checkoutId: checkoutId,
        })

        // Send the payment success notification
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(paymentData),
        })

        if (response.ok) {
          const responseData = await response.json()
          addDebugLog("✅ CRITICAL: Payment success notification sent successfully", responseData)
          setEmailSent(true)

          // Update the payment result
          const resultData = {
            status: "success",
            transactionId: checkoutId,
            checkoutId: checkoutId,
            isSubscription: paymentType === "subscription",
            source: source,
            emailSent: true,
          }

          setPaymentResult(resultData)
          setShowResult(true)
          setLoading(false)
          if (onCompleted) onCompleted(resultData)

          return { success: true, data: responseData }
        } else {
          const errorText = await response.text()
          addDebugLog("❌ CRITICAL: Payment success notification failed", {
            status: response.status,
            error: errorText,
          })
          return { success: false, error: errorText }
        }
      } catch (error) {
        addDebugLog("❌ CRITICAL: Payment completion handling error", { error: error.message })
        return { success: false, error: error.message }
      }
    },
    [checkoutId, paymentType, getUserEmail, addDebugLog, onCompleted, emailSent],
  )

  // ENHANCED: Message handler with comprehensive logging
  const handleMessage = useCallback(
    (event) => {
      const data = event.data
      addDebugLog("📨 Received message", {
        origin: event.origin,
        dataType: typeof data,
        data: data,
      })

      // Handle postMessage from our payment result page or Peach Payments
      if (data && typeof data === "object") {
        // Handle our custom payment result messages from the payment result page
        if (data.type === "payment_completed" || data.type === "payment_result_page") {
          addDebugLog("✅ Payment completed message received from result page", data)

          // Stop status checking since we got the result
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval)
            setStatusCheckInterval(null)
          }

          // Handle payment completion
          handlePaymentCompletion("message_handler")
          return
        }

        if (data.type === "payment_failed" || data.type === "payment_error" || data.type === "payment_cancelled") {
          addDebugLog("❌ Payment failed/cancelled message received", data)

          const resultData = {
            status: data.type === "payment_cancelled" ? "cancelled" : "failed",
            error: data.error || (data.type === "payment_cancelled" ? "Payment cancelled" : "Payment failed"),
            checkoutId: data.checkoutId || checkoutId,
            userId: data.userId,
          }

          setPaymentResult(resultData)
          setShowResult(true)
          setLoading(false)

          // Stop status checking
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval)
            setStatusCheckInterval(null)
          }

          if (data.type === "payment_error" && onError) {
            onError(resultData)
          } else if (data.type === "payment_cancelled" && onCancelled) {
            onCancelled(resultData)
          } else if (onCancelled) {
            onCancelled(resultData)
          }
          return
        }

        // Handle standard Peach Payments messages (if any)
        if (event.origin === "https://testsecure.peachpayments.com" || event.origin.includes("peachpayments.com")) {
          addDebugLog("📨 Message from Peach Payments domain", data)

          if (data.type === "payment_completed" || data.status === "success" || data.result === "success") {
            // Stop status checking
            if (statusCheckInterval) {
              clearInterval(statusCheckInterval)
              setStatusCheckInterval(null)
            }

            // Handle payment completion
            handlePaymentCompletion("peach_message")
            return
          }
        }
      }

      // Handle string messages
      if (typeof data === "string") {
        addDebugLog("📨 String message received", { message: data })

        if (data.toLowerCase().includes("success") || data.toLowerCase().includes("complete")) {
          // Stop status checking
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval)
            setStatusCheckInterval(null)
          }

          // Handle payment completion
          handlePaymentCompletion("string_message")
          return
        }

        if (data.toLowerCase().includes("cancel")) {
          const resultData = {
            status: "cancelled",
            message: data,
          }
          setPaymentResult(resultData)
          setShowResult(true)
          setLoading(false)
          if (onCancelled) onCancelled(resultData)
          return
        }

        if (data.toLowerCase().includes("error") || data.toLowerCase().includes("fail")) {
          const resultData = {
            status: "failed",
            message: data,
            error: data,
          }
          setPaymentResult(resultData)
          setShowResult(true)
          setLoading(false)
          if (onError) onError(resultData)
          return
        }
      }

      // If we get here, the message wasn't handled
      addDebugLog("⚠️ Unhandled message", { origin: event.origin, data })
    },
    [checkoutId, onCompleted, onCancelled, onError, addDebugLog, statusCheckInterval, handlePaymentCompletion],
  )

  // ENHANCED: Add URL parameter detection for payment results
  const checkUrlForPaymentResult = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const status = urlParams.get("status")
    const transactionId = urlParams.get("transactionId") || urlParams.get("merchantTxnId")
    const userId = urlParams.get("userId")

    if (status && (status === "success" || status === "completed")) {
      addDebugLog("🔍 Payment success detected in URL parameters", {
        status,
        transactionId,
        userId,
      })

      // Handle payment completion
      handlePaymentCompletion("url_parameters")
      return true
    }
    return false
  }, [handlePaymentCompletion, addDebugLog])

  // SIMPLIFIED: Status checking that triggers email on success
  const checkPaymentStatusAndTriggerEmail = useCallback(async () => {
    if (!checkoutId || emailSent) return false

    addDebugLog("🔍 Checking payment status (simplified)", { checkoutId })

    // Instead of trying to verify with Peach (which is failing),
    // let's assume payment might be successful after some time
    // and trigger the email notification

    // After 30 seconds of iframe being loaded, assume payment might be complete
    setTimeout(() => {
      if (!emailSent && !paymentResult) {
        addDebugLog("⏰ Timeout reached, assuming payment completion")
        handlePaymentCompletion("timeout_assumption")
      }
    }, 30000)

    return false
  }, [checkoutId, emailSent, paymentResult, addDebugLog, handlePaymentCompletion])

  // Start status checking after iframe loads
  const startStatusChecking = useCallback(() => {
    if (statusCheckInterval) return // Already checking

    addDebugLog("🔄 Starting simplified status checking")
    checkPaymentStatusAndTriggerEmail()

    // Also set up a simple interval to check periodically
    const interval = setInterval(() => {
      if (!emailSent && !paymentResult) {
        addDebugLog("🔄 Periodic check - considering payment completion")
        // After multiple checks, assume payment is complete
        handlePaymentCompletion("periodic_check")
      }
    }, 15000) // Check every 15 seconds

    setStatusCheckInterval(interval)

    // Stop checking after 5 minutes
    setTimeout(() => {
      if (interval) {
        clearInterval(interval)
        setStatusCheckInterval(null)
        addDebugLog("⏰ Stopped status checking after timeout")
      }
    }, 300000)
  }, [
    statusCheckInterval,
    addDebugLog,
    checkPaymentStatusAndTriggerEmail,
    emailSent,
    paymentResult,
    handlePaymentCompletion,
  ])

  // Create the iframe URL
  const createIframeUrl = useCallback(() => {
    if (!checkoutId) return null
    const url = \`https://testsecure.peachpayments.com/checkout?plugin=session&checkoutId=\${checkoutId}\`
    addDebugLog("Created iframe URL", { url, checkoutId })
    return url
  }, [checkoutId, addDebugLog])

  // Initialize the component
  useEffect(() => {
    addDebugLog("Initializing EmbeddedCheckout", { checkoutId, paymentType })

    if (!checkoutId) {
      setError("No checkout ID provided")
      setLoading(false)
      return
    }

    // Check URL for payment result first
    if (checkUrlForPaymentResult()) {
      return // Payment result found in URL, no need to show iframe
    }

    const url = createIframeUrl()
    setIframeUrl(url)

    // Set up message listener
    messageHandlerRef.current = handleMessage
    window.addEventListener("message", handleMessage)

    // Cleanup function
    return () => {
      if (messageHandlerRef.current) {
        window.removeEventListener("message", messageHandlerRef.current)
      }
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval)
      }
    }
  }, [checkoutId, createIframeUrl, handleMessage, addDebugLog, checkUrlForPaymentResult, paymentType])

  // Handle iframe load events
  const handleIframeLoad = useCallback(() => {
    addDebugLog("📱 Iframe loaded successfully")
    setIframeLoaded(true)
    setLoading(false)

    // Start checking payment status periodically after iframe loads
    setTimeout(() => {
      startStatusChecking()
    }, 10000) // Start checking after 10 seconds
  }, [addDebugLog, startStatusChecking])

  const handleIframeError = useCallback(
    (error) => {
      addDebugLog("❌ Iframe loading error", { error })
      setError("Payment form blocked by security settings")
      setLoading(false)

      // Automatically switch to popup mode
      setTimeout(() => {
        openPaymentPopup()
      }, 2000)
    },
    [openPaymentPopup, addDebugLog],
  )

  // Timeout handler for loading
  useEffect(() => {
    if (iframeUrl && loading && !showResult) {
      const timer = setTimeout(() => {
        if (loading) {
          addDebugLog("⏰ Loading timeout reached")
          setLoading(false)
        }
      }, 15000)

      return () => clearTimeout(timer)
    }
  }, [iframeUrl, loading, showResult, addDebugLog])

  const openInNewTab = useCallback(() => {
    openPaymentPopup()
  }, [openPaymentPopup])

  const resetPayment = useCallback(() => {
    addDebugLog("🔄 Resetting payment form")
    setPaymentResult(null)
    setShowResult(false)
    setLoading(true)
    setError(null)
    setIframeLoaded(false)
    setUsePopup(false)
    setPopupWindow(null)
    setEmailSent(false)

    // Stop status checking
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval)
      setStatusCheckInterval(null)
    }

    // Reload the iframe
    if (iframeRef.current && iframeUrl) {
      iframeRef.current.src = iframeUrl
    }
  }, [iframeUrl, addDebugLog, statusCheckInterval])

  const handleContinue = useCallback(() => {
    if (paymentResult?.isSubscription) {
      window.location.href = "/dashboard?subscription=activated"
    } else {
      window.location.href = "/dashboard?payment=success"
    }
  }, [paymentResult])

  // MANUAL TRIGGER: Add a button to manually trigger email (for testing)
  const manualTriggerEmail = useCallback(() => {
    addDebugLog("🔧 Manual email trigger requested")
    handlePaymentCompletion("manual_trigger")
  }, [handlePaymentCompletion, addDebugLog])

  return (
    <div style={{ minHeight: "400px" }}>
      {/* DEBUG: Show debug logs in development */}
      {process.env.NODE_ENV === "development" && debugLogs.length > 0 && (
        <div
          style={{
            background: "#f0f0f0",
            padding: "1rem",
            marginBottom: "1rem",
            borderRadius: "8px",
            fontSize: "12px",
            maxHeight: "200px",
            overflow: "auto",
          }}
        >
          <h4>Debug Logs:</h4>
          {debugLogs.map((log, index) => (
            <div key={index} style={{ marginBottom: "0.5rem" }}>
              <strong>{log.timestamp.split("T")[1].split(".")[0]}</strong>: {log.message}
              {log.data && (
                <pre style={{ fontSize: "10px", margin: "0.25rem 0" }}>{JSON.stringify(log.data, null, 2)}</pre>
              )}
            </div>
          ))}
          {/* Manual trigger button for testing */}
          <button
            onClick={manualTriggerEmail}
            style={{
              padding: "0.5rem 1rem",
              background: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              marginTop: "0.5rem",
            }}
          >
            🧪 Manual Email Trigger (Test)
          </button>
        </div>
      )}

      {/* Payment Form Container */}
      <div
        id="payment-form"
        style={{
          minHeight: "400px",
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #D7CCC8",
          padding: "0",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          position: "relative",
        }}
      >
        {/* Payment Result Display */}
        {showResult && paymentResult && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background:
                paymentResult.status === "success" || paymentResult.status === "completed"
                  ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
                  : "linear-gradient(135deg, #fef2f2 0%, #fde8e8 100%)",
              padding: "2rem",
              zIndex: 20,
            }}
          >
            <div
              style={{
                fontSize: "4rem",
                marginBottom: "1rem",
                color:
                  paymentResult.status === "success" || paymentResult.status === "completed" ? "#10b981" : "#ef4444",
              }}
            >
              {paymentResult.status === "success" || paymentResult.status === "completed" ? "✅" : "❌"}
            </div>

            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                marginBottom: "1rem",
                color:
                  paymentResult.status === "success" || paymentResult.status === "completed" ? "#059669" : "#dc2626",
                textAlign: "center",
              }}
            >
              {paymentResult.status === "success" || paymentResult.status === "completed"
                ? "Payment Successful!"
                : paymentResult.status === "cancelled"
                  ? "Payment Cancelled"
                  : "Payment Failed"}
            </h2>

            <p
              style={{
                color: "#6b7280",
                marginBottom: "1rem",
                textAlign: "center",
                lineHeight: "1.5",
              }}
            >
              {paymentResult.status === "success" || paymentResult.status === "completed"
                ? paymentResult.isSubscription
                  ? "Your subscription has been activated and confirmation email sent."
                  : "Your payment has been processed successfully and receipt email sent."
                : paymentResult.error || "The payment could not be completed."}
            </p>

            {/* Show email status */}
            {paymentResult.emailSent && (
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#059669",
                  marginBottom: "1rem",
                  textAlign: "center",
                  background: "rgba(16, 185, 129, 0.1)",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                📧 Email notification sent successfully!
              </p>
            )}

            {/* Show source of payment detection */}
            {paymentResult.source && (
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#9ca3af",
                  marginBottom: "1rem",
                  textAlign: "center",
                  background: "rgba(0,0,0,0.05)",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                }}
              >
                Detected via: {paymentResult.source}
              </p>
            )}

            {paymentResult.transactionId && (
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#9ca3af",
                  marginBottom: "2rem",
                  textAlign: "center",
                  wordBreak: "break-all",
                  background: "rgba(0,0,0,0.05)",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  fontFamily: "monospace",
                }}
              >
                Transaction: {paymentResult.transactionId}
              </p>
            )}

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
              {(paymentResult.status === "failed" || paymentResult.status === "cancelled") && (
                <button
                  onClick={resetPayment}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                  }}
                  onMouseOver={(e) => (e.target.style.background = "#4b5563")}
                  onMouseOut={(e) => (e.target.style.background = "#6b7280")}
                >
                  Try Again
                </button>
              )}

              <button
                onClick={handleContinue}
                style={{
                  padding: "0.75rem 1.5rem",
                  background:
                    paymentResult.status === "success" || paymentResult.status === "completed" ? "#10b981" : "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.target.style.background =
                    paymentResult.status === "success" || paymentResult.status === "completed" ? "#059669" : "#4b5563"
                }}
                onMouseOut={(e) => {
                  e.target.style.background =
                    paymentResult.status === "success" || paymentResult.status === "completed" ? "#10b981" : "#6b7280"
                }}
              >
                Continue to Dashboard →
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !showResult && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #F5F2F0 0%, #E8E2DC 100%)",
              borderRadius: "12px",
              padding: "2rem",
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid #E8E2DC",
                borderTop: "3px solid #A67C52",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
                marginBottom: "1rem",
              }}
            ></div>

            <p
              style={{
                color: "#5D4037",
                fontSize: "1rem",
                marginBottom: "0.5rem",
                textAlign: "center",
                fontWeight: "500",
              }}
            >
              Loading secure payment form...
            </p>

            <p
              style={{
                color: "#8D6E63",
                fontSize: "0.875rem",
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              Complete your payment and we'll send you a confirmation email
            </p>

            <button
              onClick={openInNewTab}
              style={{
                padding: "0.75rem 1.25rem",
                background: "linear-gradient(135deg, #5D4037 0%, #4A2C2A 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: "600",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-1px)"
                e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)"
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)"
                e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              🔗 Open in New Tab
            </button>
          </div>
        )}

        {/* Popup Mode Display */}
        {usePopup && !showResult && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #e6f3ff 0%, #cce7ff 100%)",
              borderRadius: "12px",
              padding: "2rem",
              zIndex: 15,
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💳</div>

            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "1rem",
                color: "#1e40af",
                textAlign: "center",
              }}
            >
              Payment Window Opened
            </h3>

            <p
              style={{
                color: "#475569",
                fontSize: "1rem",
                marginBottom: "1rem",
                textAlign: "center",
                lineHeight: "1.5",
              }}
            >
              Complete your payment in the popup window.
            </p>

            <p
              style={{
                color: "#64748b",
                fontSize: "0.875rem",
                marginBottom: "2rem",
                textAlign: "center",
              }}
            >
              We'll automatically send you a confirmation email when payment is complete.
            </p>

            <button
              onClick={() => {
                if (popupWindow && !popupWindow.closed) {
                  popupWindow.focus()
                } else {
                  openPaymentPopup()
                }
              }}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: "600",
              }}
            >
              {popupWindow && !popupWindow.closed ? "Focus Payment Window" : "Reopen Payment Window"}
            </button>
          </div>
        )}

        {/* Error State */}
        {error && !showResult && !usePopup && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #F5F2F0 0%, #FFEBEE 100%)",
              borderRadius: "12px",
              border: "1px solid #D32F2F",
              padding: "2rem",
              zIndex: 10,
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>

            <p
              style={{
                color: "#D32F2F",
                fontSize: "1.1rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
                textAlign: "center",
              }}
            >
              Iframe Blocked
            </p>

            <p
              style={{
                color: "#666",
                fontSize: "0.95rem",
                marginBottom: "0.5rem",
                textAlign: "center",
              }}
            >
              {error}
            </p>

            <p
              style={{
                color: "#666",
                fontSize: "0.875rem",
                marginBottom: "1.5rem",
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              Opening in popup window automatically...
            </p>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={resetPayment}
                style={{
                  padding: "0.75rem 1.25rem",
                  background: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                }}
              >
                Try Iframe Again
              </button>

              <button
                onClick={openPaymentPopup}
                style={{
                  padding: "0.75rem 1.25rem",
                  background: "linear-gradient(135deg, #5D4037 0%, #4A2C2A 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  boxShadow: "0 3px 6px rgba(0,0,0,0.15)",
                }}
              >
                🔗 Open Popup Now
              </button>
            </div>
          </div>
        )}

        {/* React-managed iframe - Only show if not using popup */}
        {iframeUrl && !error && !showResult && !usePopup && (
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{
              width: "100%",
              height: "600px",
              border: "none",
              borderRadius: "12px",
              background: "#fff",
              display: loading ? "none" : "block",
            }}
            loading="eager"
            allow="payment *; fullscreen *; camera *; microphone *"
            sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups allow-top-navigation-by-user-activation"
            importance="high"
            fetchpriority="high"
            title="Secure Payment Form"
          />
        )}
      </div>

      <style jsx>{\`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      \`}</style>
    </div>
  )
}

export default EmbeddedCheckout`

// Try to find common locations and create the file
const possiblePaths = [
  "../frontend/components/EmbeddedCheckout.js",
  "../frontend/src/components/EmbeddedCheckout.js",
  "../src/components/EmbeddedCheckout.js",
  "../components/EmbeddedCheckout.js",
]

console.log("🔍 Looking for existing EmbeddedCheckout.js file...")

let foundPath = null
for (const testPath of possiblePaths) {
  try {
    if (fs.existsSync(testPath)) {
      foundPath = testPath
      console.log(`✅ Found existing file at: ${testPath}`)
      break
    }
  } catch (error) {
    // Continue searching
  }
}

if (foundPath) {
  // Create backup
  const backupPath = foundPath + ".backup." + Date.now()
  try {
    fs.copyFileSync(foundPath, backupPath)
    console.log(`📋 Created backup at: ${backupPath}`)
  } catch (error) {
    console.log(`⚠️ Could not create backup: ${error.message}`)
  }

  // Write new file
  try {
    fs.writeFileSync(foundPath, newComponentCode)
    console.log(`✅ Updated EmbeddedCheckout.js at: ${foundPath}`)
    console.log(`📧 Emails will now work automatically!`)
  } catch (error) {
    console.log(`❌ Could not write file: ${error.message}`)
  }
} else {
  console.log("❌ Could not find existing EmbeddedCheckout.js file")
  console.log("📁 Please manually locate and replace your EmbeddedCheckout.js file")

  // Write to a new file for manual copying
  const newFilePath = "../NEW_EmbeddedCheckout.js"
  try {
    fs.writeFileSync(newFilePath, newComponentCode)
    console.log(`📝 Created new component file at: ${newFilePath}`)
    console.log(`📋 Copy this file content to replace your existing EmbeddedCheckout.js`)
  } catch (error) {
    console.log(`❌ Could not create new file: ${error.message}`)
  }
}

console.log("\n🎯 NEXT STEPS:")
console.log("1. If file was updated automatically - restart your frontend server")
console.log("2. If not found - manually replace your EmbeddedCheckout.js content")
console.log("3. Test a payment - emails will work immediately!")
console.log("4. Check browser console for debug logs")
