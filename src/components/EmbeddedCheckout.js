"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import emailjs from '@emailjs/browser'

const EmbeddedCheckout = ({
  checkoutId,
  onCompleted,
  onCancelled,
  onExpired,
  onError,
  paymentType = "payment",
  amount,
  planName,
  toolName,
  userEmail, // ADD THIS - user's email should be passed from parent component
  userName,   // ADD THIS - user's name should be passed from parent component
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paymentResult, setPaymentResult] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const processingRef = useRef(false)

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init("qzt6GK09NLvKGg8C1") // Your public key
  }, [])

  // Send email function - FIXED recipient email issue
  const sendConfirmationEmail = async (paymentData) => {
    try {
      console.log("📧 ============ EMAIL SENDING START ============")
      console.log("📧 Input payment data:", paymentData)

      let templateParams;
      let templateId;

      if (paymentData.isSubscription || paymentData.planName) {
        // SUBSCRIPTION EMAIL
        console.log("📧 ✅ SENDING SUBSCRIPTION EMAIL")
        
        // Calculate next payment date
        const nextPaymentDate = new Date()
        const cycle = paymentData.cycle || "monthly"
        if (cycle === "monthly") {
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)
        } else {
          nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1)
        }

        templateParams = {
          plan_name: paymentData.planName || "Premium Plan",
          billing_cycle: cycle === "monthly" ? "Monthly" : "Yearly", 
          currency: paymentData.currency || "ZAR",
          amount: String(paymentData.amount || "0"),
          transaction_id: String(paymentData.transactionId || "N/A"),
          payment_date: new Date().toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
          }),
          next_payment_date: nextPaymentDate.toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          // FIXED: Use dynamic user email
          to_email: userEmail || paymentData.customerEmail || "customer@example.com",
          to_name: userName || paymentData.customerName || "Customer",
          user_email: userEmail || paymentData.customerEmail || "customer@example.com",
          user_name: userName || paymentData.customerName || "Customer",
          // ADD: Same professional fields as growth tools
          from_name: "BIG Marketplace Africa",
          reply_to: "support@bigmarketplace.africa"
        }
        templateId = "template_xrrdplp"

      } else {
        // GROWTH TOOL EMAIL
        console.log("📧 ✅ SENDING GROWTH TOOL EMAIL")

        templateParams = {
          tool_name: paymentData.toolName || "Growth Tool",
          currency: paymentData.currency || "ZAR",
          amount: String(paymentData.amount || "0"),
          transaction_id: String(paymentData.transactionId || "N/A"),
          payment_date: new Date().toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          // FIXED: Use same email structure as subscription
          to_email: userEmail || paymentData.customerEmail || "customer@example.com",
          to_name: userName || paymentData.customerName || "Customer",
          user_email: userEmail || paymentData.customerEmail || "customer@example.com",
          user_name: userName || paymentData.customerName || "Customer",
          // ADD: More professional email fields to avoid spam
          from_name: "BIG Marketplace Africa",
          reply_to: "support@bigmarketplace.africa"
        }
        templateId = "template_z3fw55r"
      }

      console.log("📧 Final template params:", templateParams)
      console.log("📧 🚀 CALLING EMAILJS NOW...")

      // ENHANCED: Use emailjs.send with dynamic recipient
      const emailResult = await emailjs.send(
        "service_hm5lzgq",
        templateId,
        {
          ...templateParams,
          // Ensure recipient is properly set
          email: userEmail || paymentData.customerEmail || "customer@example.com"
        }
      )

      console.log("📧 ============ EMAILJS RESPONSE ============")
      console.log("📧 Status:", emailResult.status)
      console.log("📧 Text:", emailResult.text)

      if (emailResult && emailResult.status === 200) {
        console.log("✅ ============ EMAIL SUCCESS ============")
        return { success: true, messageId: emailResult.text }
      } else {
        console.error("❌ ============ EMAIL FAILED ============")
        return { success: false, error: "Email sending failed" }
      }

    } catch (emailError) {
      console.error("❌ ============ EMAIL ERROR ============")
      console.error("❌ Error object:", emailError)
      console.error("❌ Error message:", emailError.message)
      return { success: false, error: emailError.message }
    }
  }

  // ENHANCED: Handle payment completion with better debugging
  const handlePaymentCompletion = useCallback(
    async (source = "unknown", messageData = null) => {
      console.log("🎉 Payment completed!", { source, messageData })
      console.log("🔥 CHECKING IF EMAIL SHOULD BE SENT...")

      if (processingRef.current) {
        console.log("⚠️ Already processing payment completion - skipping")
        return
      }

      processingRef.current = true

      try {
        const resultData = {
          status: "success",
          transactionId: messageData?.transactionId || messageData?.checkoutId || checkoutId,
          checkoutId: messageData?.checkoutId || checkoutId,
          isSubscription: messageData?.paymentType === "subscription" || paymentType === "subscription" || messageData?.type === "subscription",
          source: source,
          amount: messageData?.amount || amount,
          planName: messageData?.planName || planName,
          toolName: messageData?.toolName || toolName,
          userId: messageData?.userId,
          currency: messageData?.currency || "ZAR",
          cycle: messageData?.cycle
        }

        console.log("💳 Payment data for email:", resultData)
        console.log("📧 IS SUBSCRIPTION?", resultData.isSubscription)
        console.log("📧 PLAN NAME:", resultData.planName)
        console.log("📧 TOOL NAME:", resultData.toolName)

        // FIXED: Single clean alert
        const itemName = resultData.isSubscription ? resultData.planName : resultData.toolName
        const alertMessage = `🎉 Payment Successful!\n\n${itemName}\nAmount: ${resultData.currency} ${resultData.amount}\n\nSending confirmation email...`
        
        // Show initial success alert
        window.alert(alertMessage)

        // FORCE EMAIL SEND - No matter what
        console.log("📧 FORCING EMAIL SEND NOW...")
        const emailResult = await sendConfirmationEmail(resultData)
        
        // FIXED: Clean follow-up alert based on email result
        setTimeout(() => {
          if (emailResult.success) {
            console.log("✅ Email sent successfully")
            window.alert("📧 Confirmation email sent successfully!")
          } else {
            console.error("❌ Email failed:", emailResult.error)
            window.alert(`⚠️ Payment successful but email failed:\n${emailResult.error}\n\nPlease contact support.`)
          }
        }, 2000)

        setPaymentResult({
          ...resultData,
          emailSent: emailResult.success
        })
        setShowResult(true)
        setLoading(false)
        
        if (onCompleted) {
          onCompleted({
            ...resultData,
            emailSent: emailResult.success
          })
        }

        return { success: true, data: resultData }

      } catch (error) {
        console.error("❌ Error handling payment completion:", error)
        window.alert("❌ Error processing payment. Please contact support.")
        return { success: false, error: error.message }
      } finally {
        // Reset processing flag after 5 seconds to prevent permanent lock
        setTimeout(() => {
          processingRef.current = false
        }, 5000)
      }
    },
    [checkoutId, paymentType, amount, planName, toolName, onCompleted, sendConfirmationEmail],
  )

  // Message handler - listens for payment success from iframe
  const handleMessage = useCallback(
    (event) => {
      console.log("📨 Received message:", event.data)
      const data = event.data

      if (data && typeof data === "object") {
        // Handle successful payment completion
        if (data.type === "payment_completed" || data.type === "payment_success") {
          console.log("✅ Processing payment success message")
          handlePaymentCompletion("payment_iframe", data)
          return
        }

        // Handle failed payments
        if (data.type === "payment_failed" || data.type === "payment_error" || data.type === "payment_cancelled") {
          console.log("❌ Processing payment failure message")
          
          const resultData = {
            status: data.type === "payment_cancelled" ? "cancelled" : "failed",
            error: data.error || (data.type === "payment_cancelled" ? "Payment cancelled" : "Payment failed"),
            checkoutId: data.checkoutId || checkoutId,
            userId: data.userId,
          }

          window.alert(`❌ ${data.type === "payment_cancelled" ? "Payment Cancelled" : "Payment Failed"}\n\n${resultData.error}`)

          setPaymentResult(resultData)
          setShowResult(true)
          setLoading(false)

          if (data.type === "payment_error" && onError) {
            onError(resultData)
          } else if (data.type === "payment_cancelled" && onCancelled) {
            onCancelled(resultData)
          }
          return
        }
      }
    },
    [checkoutId, onCompleted, onCancelled, onError, handlePaymentCompletion],
  )

  // Listen for payment completion (when iframe redirects to success page)
  useEffect(() => {
    let hasTriggered = false // Prevent multiple triggers
    
    const checkForPaymentSuccess = () => {
      if (hasTriggered) return // Don't check if already triggered
      
      try {
        const iframe = document.querySelector('iframe[title="Secure Payment Form"]')
        if (iframe && iframe.contentWindow) {
          const iframeUrl = iframe.contentWindow.location.href
          console.log("📍 Checking iframe URL:", iframeUrl)
          
          // Check if URL contains success indicators
          if (iframeUrl.includes('status=success') || iframeUrl.includes('payment_success')) {
            console.log("🎉 Payment success detected in iframe URL!")
            hasTriggered = true // Mark as triggered
            
            // Extract payment data from URL
            const urlParams = new URLSearchParams(iframeUrl.split('?')[1])
            const paymentData = {
              type: "payment_completed",
              checkoutId: urlParams.get('checkoutId') || checkoutId,
              transactionId: urlParams.get('transactionId') || urlParams.get('merchantTxnId'),
              amount: urlParams.get('amount') || amount,
              currency: urlParams.get('currency') || 'ZAR',
              paymentType: paymentType,
              planName: planName,
              toolName: toolName,
              cycle: urlParams.get('cycle')
            }
            
            console.log("🔥 TRIGGERING EMAIL SEND with data:", paymentData)
            handlePaymentCompletion("iframe_url_detection", paymentData)
          }
        }
      } catch (error) {
        // Expected error due to cross-origin restrictions - ignore
        console.log("🔍 Cross-origin iframe check (expected)")
      }
    }

    // ALSO listen for URL changes (when user gets redirected to success page)
    const checkForUrlSuccess = () => {
      if (hasTriggered) return
      
      const currentUrl = window.location.href
      console.log("📍 Checking current URL for success:", currentUrl)
      
      if (currentUrl.includes('status=success') || currentUrl.includes('payment/results?status=success')) {
        console.log("🎉 Payment success detected in current URL!")
        hasTriggered = true
        
        const urlParams = new URLSearchParams(window.location.search)
        const paymentData = {
          type: "payment_completed",
          checkoutId: urlParams.get('checkoutId') || checkoutId,
          transactionId: urlParams.get('merchantTxnId') || urlParams.get('transactionId'),
          amount: urlParams.get('amount') || amount,
          currency: urlParams.get('currency') || 'ZAR',
          paymentType: urlParams.get('type') || paymentType,
          planName: urlParams.get('planName') || planName,
          toolName: urlParams.get('toolName') || toolName,
          cycle: urlParams.get('cycle')
        }
        
        console.log("🔥 TRIGGERING EMAIL SEND from URL with data:", paymentData)
        handlePaymentCompletion("url_redirect_detection", paymentData)
      }
    }

    // Check every 2 seconds for payment success
    const interval = setInterval(() => {
      checkForPaymentSuccess()
      checkForUrlSuccess()
    }, 2000)
    
    // Also check immediately
    checkForUrlSuccess()
    
    return () => {
      clearInterval(interval)
      hasTriggered = false // Reset on cleanup
    }
  }, [checkoutId, handlePaymentCompletion, amount, paymentType, planName, toolName])

  // Initialize component
  useEffect(() => {
    if (!checkoutId) {
      setError("No checkout ID provided")
      setLoading(false)
      return
    }

    console.log("🔧 Setting up payment completion detection for checkoutId:", checkoutId)
    window.addEventListener("message", handleMessage)

    return () => {
      console.log("🔧 Cleaning up message listener")
      window.removeEventListener("message", handleMessage)
    }
  }, [checkoutId, handleMessage])

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    console.log("📄 Payment iframe loaded")
    setLoading(false)
  }, [])

  return (
    <div style={{ minHeight: "400px" }}>
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
              background: paymentResult.status === "success" 
                ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
                : "linear-gradient(135deg, #fef2f2 0%, #fde8e8 100%)",
              padding: "2rem",
              zIndex: 20,
            }}
          >
            <div style={{ 
              fontSize: "4rem", 
              marginBottom: "1rem", 
              color: paymentResult.status === "success" ? "#10b981" : "#dc2626" 
            }}>
              {paymentResult.status === "success" ? "✅" : "❌"}
            </div>

            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                marginBottom: "1rem",
                color: paymentResult.status === "success" ? "#059669" : "#dc2626",
                textAlign: "center",
              }}
            >
              {paymentResult.status === "success" ? "Payment Successful!" : "Payment Failed"}
            </h2>

            {paymentResult.status === "success" && (
              <>
                <p
                  style={{
                    color: "#6b7280",
                    marginBottom: "1rem",
                    textAlign: "center",
                    lineHeight: "1.5",
                  }}
                >
                  {paymentResult.isSubscription
                    ? `Your ${paymentResult.planName || "subscription"} has been activated.`
                    : `Your purchase of ${paymentResult.toolName || "growth tool"} was successful.`}
                </p>

                {/* Email Status Display */}
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: paymentResult.emailSent ? "#059669" : "#f59e0b",
                    marginBottom: "1rem",
                    textAlign: "center",
                    background: paymentResult.emailSent 
                      ? "rgba(16, 185, 129, 0.1)" 
                      : "rgba(245, 158, 11, 0.1)",
                    padding: "0.5rem",
                    borderRadius: "6px",
                    border: paymentResult.emailSent 
                      ? "1px solid rgba(16, 185, 129, 0.3)"
                      : "1px solid rgba(245, 158, 11, 0.3)",
                  }}
                >
                  {paymentResult.emailSent 
                    ? "📧 Confirmation email sent successfully!" 
                    : "📧 Confirmation email is being processed..."}
                </div>

                <button
                  onClick={() => (window.location.href = "/dashboard")}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                  }}
                >
                  Continue to Dashboard →
                </button>
              </>
            )}

            {paymentResult.status !== "success" && (
              <>
                <p
                  style={{
                    color: "#6b7280",
                    marginBottom: "1rem",
                    textAlign: "center",
                    lineHeight: "1.5",
                  }}
                >
                  {paymentResult.error || "There was an issue processing your payment."}
                </p>

                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                  }}
                >
                  Try Again
                </button>
              </>
            )}
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
          </div>
        )}

        {/* Error Display */}
        {error && (
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
              background: "linear-gradient(135deg, #fef2f2 0%, #fde8e8 100%)",
              padding: "2rem",
              zIndex: 15,
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "1rem", color: "#dc2626" }}>❌</div>
            <h2 style={{ color: "#dc2626", marginBottom: "1rem" }}>Payment Error</h2>
            <p style={{ color: "#6b7280", textAlign: "center" }}>{error}</p>
          </div>
        )}

        {/* TEST BUTTON - Remove in production */}
        {!showResult && !loading && (
          <div style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 30
          }}>
            <button
              onClick={() => {
                console.log("🧪 MANUAL TEST - Triggering email send")
                const testData = {
                  type: "payment_completed",
                  checkoutId: checkoutId,
                  transactionId: `TEST-${Date.now()}`,
                  amount: amount,
                  currency: "ZAR",
                  paymentType: paymentType,
                  planName: planName,
                  toolName: toolName,
                  cycle: "monthly"
                }
                handlePaymentCompletion("manual_test", testData)
              }}
              style={{
                padding: "8px 12px",
                background: "#f59e0b",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              🧪 Test Email
            </button>
          </div>
        )}

        {/* Iframe for payment */}
        {checkoutId && !error && !showResult && (
          <iframe
            src={`https://testsecure.peachpayments.com/checkout?plugin=session&checkoutId=${checkoutId}`}
            style={{
              width: "100%",
              height: "600px",
              border: "none",
              borderRadius: "12px",
              background: "#fff",
              display: loading ? "none" : "block",
            }}
            onLoad={handleIframeLoad}
            loading="eager"
            allow="payment *; fullscreen *; camera *; microphone *"
            title="Secure Payment Form"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default EmbeddedCheckout