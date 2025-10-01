"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function PaymentResult() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("loading")
  const [details, setDetails] = useState({})
  const [emailStatus, setEmailStatus] = useState("processing")
  const [processing, setProcessing] = useState(true)
  const [debugInfo, setDebugInfo] = useState({})

  useEffect(() => {
    const processPaymentResult = async () => {
      try {
        console.log("🎯 Payment result page loaded")
        console.log("🎯 Search params:", searchParams.toString())
        console.log("🎯 Window location:", window.location.href)
        
        // Get URL parameters
        const paymentStatus = searchParams.get("status")
        const type = searchParams.get("type")
        const userId = searchParams.get("userId")
        const merchantTxnId = searchParams.get("merchantTxnId")
        const amount = searchParams.get("amount")
        const currency = searchParams.get("currency")
        const planName = searchParams.get("planName")
        const cycle = searchParams.get("cycle")
        const toolName = searchParams.get("toolName")
        const toolCategory = searchParams.get("toolCategory")
        const transactionId = searchParams.get("transactionId") || merchantTxnId

        console.log("🎯 Extracted parameters:", {
          status: paymentStatus,
          type,
          userId,
          merchantTxnId,
          amount,
          currency,
          planName,
          cycle,
          toolName,
          toolCategory,
        })

        const paymentDetails = {
          status: paymentStatus,
          type,
          userId,
          merchantTxnId,
          amount: Number.parseFloat(amount) || 0,
          currency,
          planName,
          cycle,
          toolName,
          toolCategory,
          transactionId,
          timestamp: new Date().toISOString(),
        }

        setDetails(paymentDetails)
        setStatus(paymentStatus || "unknown")
        
        // Set debug info
        setDebugInfo({
          searchParams: searchParams.toString(),
          windowLocation: window.location.href,
          extractedParams: paymentDetails,
          apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://brown-ivory-website-h8srool38-big-league.vercel.app"
        })

        // CRITICAL: Process payment and send email if successful
        if (paymentStatus === "success") {
          console.log("✅ CRITICAL: Processing successful payment and sending email")
          
          try {
            // FIXED: Get API URL - try multiple sources
            let apiUrl = process.env.NEXT_PUBLIC_API_URL
            if (!apiUrl) {
              // Try to determine API URL from current location
              const currentHost = window.location.hostname
              if (currentHost.includes('ngrok')) {
                // If frontend is on ngrok, backend is likely on localhost:8000
                apiUrl = "https://brown-ivory-website-h8srool38-big-league.vercel.app"
              } else if (currentHost === 'localhost') {
                apiUrl = "https://brown-ivory-website-h8srool38-big-league.vercel.app"
              } else {
                // Production or other environment
                apiUrl = `${window.location.protocol}//${window.location.hostname}:8000`
              }
            }
            
            console.log("🌐 Using API URL:", apiUrl)
            
            // Prepare payment data for backend processing
            const paymentData = {
              checkoutId: merchantTxnId,
              merchantTxnId: merchantTxnId,
              userId: userId || "user-" + Date.now(),
              type: type || "payment",
              amount: Number.parseFloat(amount) || 0,
              currency: currency || "ZAR",
              planName: planName || "",
              cycle: cycle || "",
              toolName: toolName || "",
              toolCategory: toolCategory || "",
              transactionId: transactionId,
              customerEmail: "nhlanhlamsomi2024@gmail.com",
              userEmail: "nhlanhlamsomi2024@gmail.com",
              paymentType: type === "subscription" ? "subscription" : "one_time",
              source: "frontend_payment_result"
            }

            console.log("📤 Calling backend API with data:", paymentData)
            console.log("📤 API endpoint:", `${apiUrl}/api/payments/handle-payment-success`)

            // FIXED: Add proper headers including ngrok bypass
            const headers = {
              "Content-Type": "application/json",
              "Accept": "application/json",
            }

            // Add ngrok bypass header if using ngrok
            if (apiUrl.includes('ngrok')) {
              headers["ngrok-skip-browser-warning"] = "true"
            }

            // Call your backend API to process payment and send email
            const response = await fetch(`${apiUrl}/api/payments/handle-payment-success`, {
              method: "POST",
              headers: headers,
              body: JSON.stringify(paymentData),
            })

            console.log("📥 Backend response status:", response.status)
            console.log("📥 Backend response ok:", response.ok)
            console.log("📥 Backend response headers:", Object.fromEntries(response.headers.entries()))

            if (response.ok) {
              const responseData = await response.json()
              console.log("✅ Backend processing successful:", responseData)
              setEmailStatus(responseData.emailSent ? "sent" : "failed")
              
              // Send message to parent window (EmbeddedCheckout)
              const successMessage = {
                type: "payment_completed",
                status: "success",
                checkoutId: merchantTxnId,
                merchantTxnId: merchantTxnId,
                transactionId: transactionId,
                userId: userId,
                paymentType: type,
                amount: Number.parseFloat(amount) || 0,
                currency: currency,
                planName: planName,
                cycle: cycle,
                toolName: toolName,
                toolCategory: toolCategory,
                source: "payment_result_page",
                timestamp: new Date().toISOString(),
                emailSent: responseData.emailSent
              }

              // Send message to parent window
              if (window.parent && window.parent !== window) {
                window.parent.postMessage(successMessage, "*")
                console.log("📤 Message sent to parent window:", successMessage)
              }

              // Also try sending to opener (if opened in popup)
              if (window.opener) {
                window.opener.postMessage(successMessage, "*")
                console.log("📤 Message sent to opener window:", successMessage)
              }

            } else {
              const errorText = await response.text()
              console.error("❌ Backend processing failed:", response.status, response.statusText, errorText)
              setEmailStatus("failed")
              
              // Update debug info with error
              setDebugInfo(prev => ({
                ...prev,
                backendError: {
                  status: response.status,
                  statusText: response.statusText,
                  errorText: errorText,
                  url: `${apiUrl}/api/payments/handle-payment-success`
                }
              }))

              // Still send message to parent indicating payment success but email failed
              const partialSuccessMessage = {
                type: "payment_completed",
                status: "success",
                checkoutId: merchantTxnId,
                userId: userId,
                paymentType: type,
                amount: Number.parseFloat(amount) || 0,
                currency: currency,
                planName: planName,
                cycle: cycle,
                toolName: toolName,
                source: "payment_result_page",
                emailSent: false,
                emailError: `Backend error: ${response.status}`
              }

              if (window.parent && window.parent !== window) {
                window.parent.postMessage(partialSuccessMessage, "*")
              }
              if (window.opener) {
                window.opener.postMessage(partialSuccessMessage, "*")
              }
            }

          } catch (emailError) {
            console.error("❌ Error calling backend API:", emailError)
            setEmailStatus("failed")
            
            // Update debug info with error
            setDebugInfo(prev => ({
              ...prev,
              apiError: {
                message: emailError.message,
                name: emailError.name,
                stack: emailError.stack
              }
            }))

            // Still send message to parent indicating payment success but email failed
            const partialSuccessMessage = {
              type: "payment_completed",
              status: "success",
              checkoutId: merchantTxnId,
              userId: userId,
              paymentType: type,
              amount: Number.parseFloat(amount) || 0,
              currency: currency,
              planName: planName,
              cycle: cycle,
              toolName: toolName,
              source: "payment_result_page",
              emailSent: false,
              emailError: emailError.message
            }

            if (window.parent && window.parent !== window) {
              window.parent.postMessage(partialSuccessMessage, "*")
            }
            if (window.opener) {
              window.opener.postMessage(partialSuccessMessage, "*")
            }
          }

          // Set a timeout to close popup if this is a popup
          setTimeout(() => {
            if (window.opener) {
              console.log("🔄 Closing popup window")
              window.close()
            }
          }, 5000)

        } else {
          // Handle failed payments
          const failureMessage = {
            type: "payment_failed",
            status: paymentStatus || "failed",
            error: "Payment was not successful",
            checkoutId: merchantTxnId,
            userId: userId,
            source: "payment_result_page",
          }

          if (window.parent && window.parent !== window) {
            window.parent.postMessage(failureMessage, "*")
          }

          if (window.opener) {
            window.opener.postMessage(failureMessage, "*")
          }
        }

      } catch (error) {
        console.error("❌ Error processing payment result:", error)
        setStatus("error")
        setEmailStatus("failed")
        setDebugInfo(prev => ({
          ...prev,
          generalError: {
            message: error.message,
            name: error.name,
            stack: error.stack
          }
        }))
      } finally {
        setProcessing(false)
      }
    }

    // Wait a bit for search params to be available
    const timer = setTimeout(() => {
      if (searchParams.toString()) {
        processPaymentResult()
      } else {
        console.log("⚠️ No search parameters found")
        setProcessing(false)
        setStatus("error")
        setDebugInfo({
          error: "No search parameters found in URL",
          url: window.location.href
        })
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [searchParams])

  if (processing) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
          padding: "2rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "2rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textAlign: "center",
            maxWidth: "600px",
            width: "100%",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #e0f2fe",
              borderTop: "3px solid #0ea5e9",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          ></div>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1rem",
              color: "#0ea5e9",
            }}
          >
            Processing Payment...
          </h1>

          <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
            Please wait while we process your payment and send confirmation email.
          </p>

          <div style={{ fontSize: "0.875rem", color: "#9ca3af", marginBottom: "2rem" }}>
            ⏳ Verifying payment details...
            <br />
            📧 Preparing confirmation email...
            <br />
            🔗 Connecting to payment service...
          </div>

          {/* Debug Information */}
          <div style={{ 
            textAlign: "left", 
            background: "#f8f9fa", 
            padding: "1rem", 
            borderRadius: "8px",
            fontSize: "0.75rem",
            fontFamily: "monospace",
            color: "#495057"
          }}>
            <h4 style={{ margin: "0 0 0.5rem 0", color: "#212529" }}>Debug Info:</h4>
            <div>Search Params: {debugInfo.searchParams || "Loading..."}</div>
            <div>API URL: {debugInfo.apiUrl || "Determining..."}</div>
            <div>Window Location: {typeof window !== 'undefined' ? window.location.href : "Loading..."}</div>
            {debugInfo.extractedParams && (
              <div>Amount: {debugInfo.extractedParams.amount}</div>
            )}
          </div>
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

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          status === "success"
            ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
            : "linear-gradient(135deg, #fef2f2 0%, #fde8e8 100%)",
        padding: "2rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "2rem",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          textAlign: "center",
          maxWidth: "600px",
          width: "100%",
        }}
      >
        <div
          style={{
            fontSize: "4rem",
            marginBottom: "1rem",
            color: status === "success" ? "#10b981" : "#ef4444",
          }}
        >
          {status === "success" ? "✅" : status === "loading" ? "⏳" : "❌"}
        </div>

        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            marginBottom: "1rem",
            color: status === "success" ? "#059669" : "#dc2626",
          }}
        >
          {status === "success" ? "Payment Successful!" : status === "loading" ? "Processing..." : "Payment Failed"}
        </h1>

        {status === "success" && (
          <div>
            <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
              {details.type === "subscription"
                ? `Your ${details.planName || 'subscription'} has been activated.`
                : `Your purchase of ${details.toolName || 'item'} was successful.`}
            </p>

            <div
              style={{
                background: "#f9fafb",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                textAlign: "left",
              }}
            >
              <p><strong>Amount:</strong> {details.currency} {details.amount}</p>
              <p><strong>Transaction ID:</strong> {details.merchantTxnId}</p>
              {details.type === "subscription" && (
                <>
                  <p><strong>Plan:</strong> {details.planName}</p>
                  <p><strong>Billing:</strong> {details.cycle}</p>
                </>
              )}
              {details.type === "payment" && (
                <p><strong>Item:</strong> {details.toolName}</p>
              )}
            </div>

            {/* Email Status Display */}
            <div
              style={{
                fontSize: "0.875rem",
                padding: "0.75rem",
                borderRadius: "6px",
                marginBottom: "1rem",
                background: 
                  emailStatus === "sent" 
                    ? "rgba(16, 185, 129, 0.1)" 
                    : emailStatus === "failed"
                    ? "rgba(239, 68, 68, 0.1)"
                    : "rgba(59, 130, 246, 0.1)",
                border: 
                  emailStatus === "sent"
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : emailStatus === "failed"
                    ? "1px solid rgba(239, 68, 68, 0.3)"
                    : "1px solid rgba(59, 130, 246, 0.3)",
                color:
                  emailStatus === "sent"
                    ? "#059669"
                    : emailStatus === "failed"
                    ? "#dc2626"
                    : "#2563eb"
              }}
            >
              {emailStatus === "processing" && "📧 Sending confirmation email..."}
              {emailStatus === "sent" && "✅ Confirmation email sent successfully!"}
              {emailStatus === "failed" && "⚠️ Payment successful but email sending failed. Please contact support."}
            </div>
          </div>
        )}

        {status !== "success" && status !== "loading" && (
          <div>
            <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
              We were unable to process your payment. Please try again.
            </p>
            <button
              onClick={() => window.history.back()}
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
              Go Back
            </button>
          </div>
        )}

        {/* Debug Information */}
        <div style={{ 
          textAlign: "left", 
          background: "#f8f9fa", 
          padding: "1rem", 
          borderRadius: "8px",
          fontSize: "0.75rem",
          fontFamily: "monospace",
          color: "#495057",
          marginTop: "2rem"
        }}>
          <h4 style={{ margin: "0 0 0.5rem 0", color: "#212529" }}>Debug Info:</h4>
          <div>Status: {status}</div>
          <div>Email Status: {emailStatus}</div>
          <div>API URL: {debugInfo.apiUrl || "Unknown"}</div>
          <div>Search Params: {debugInfo.searchParams || "None"}</div>
          {debugInfo.backendError && (
            <div style={{ color: "#dc3545", marginTop: "0.5rem" }}>
              <strong>Backend Error:</strong><br/>
              Status: {debugInfo.backendError.status}<br/>
              Text: {debugInfo.backendError.errorText}<br/>
              URL: {debugInfo.backendError.url}
            </div>
          )}
          {debugInfo.apiError && (
            <div style={{ color: "#dc3545", marginTop: "0.5rem" }}>
              <strong>API Error:</strong><br/>
              {debugInfo.apiError.message}
            </div>
          )}
          {debugInfo.generalError && (
            <div style={{ color: "#dc3545", marginTop: "0.5rem" }}>
              <strong>General Error:</strong><br/>
              {debugInfo.generalError.message}
            </div>
          )}
          {debugInfo.error && (
            <div style={{ color: "#dc3545", marginTop: "0.5rem" }}>
              <strong>Error:</strong> {debugInfo.error}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: "1rem",
            fontSize: "0.75rem",
            color: "#9ca3af",
          }}
        >
          {status === "success" ? "This window will close automatically in 5 seconds..." : ""}
        </div>
      </div>
    </div>
  )
}