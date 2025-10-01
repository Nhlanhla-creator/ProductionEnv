import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

// Payment notification helper functions
const API_URL = process.env.REACT_APP_API_URL || 'https://brown-ivory-website-h8srool38-big-league.vercel.app';

const notifyPaymentSuccess = async (paymentData) => {
  try {
    console.log('📤 Notifying backend about payment success:', paymentData);
    
    const response = await fetch(`${API_URL}/api/payments/handle-payment-success`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Payment success notification sent:', result);
    return result;

  } catch (error) {
    console.error('❌ Failed to notify backend about payment success:', error);
    return { success: false, error: error.message };
  }
};

const notifyPaymentFailure = async (failureData) => {
  try {
    console.log('📤 Notifying backend about payment failure:', failureData);
    
    const response = await fetch(`${API_URL}/api/payments/handle-payment-failure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(failureData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Payment failure notification sent:', result);
    return result;

  } catch (error) {
    console.error('❌ Failed to notify backend about payment failure:', error);
    return { success: false, error: error.message };
  }
};

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('loading');
  const [paymentData, setPaymentData] = useState({});
  
  // Extract all possible parameters from URL
  const checkoutId = searchParams.get("checkoutId");
  const registrationId = searchParams.get("registrationId");
  const status = searchParams.get("status");
  const transactionId = searchParams.get("transactionId");
  const userId = searchParams.get("userId");
  const type = searchParams.get("type");
  const planName = searchParams.get("planName");
  const cycle = searchParams.get("cycle");
  const merchantTxnId = searchParams.get("merchantTxnId");
  const merchantTransactionId = searchParams.get("merchantTransactionId");
  const amount = searchParams.get("amount");
  const currency = searchParams.get("currency");
  const cardBrand = searchParams.get("cardBrand");
  const cardLast4 = searchParams.get("cardLast4");
  const resultCode = searchParams.get("resultCode");
  const resultDescription = searchParams.get("resultDescription");

  useEffect(() => {
    const processResult = async () => {
      // Simulate a short processing delay for better UX
      setTimeout(async () => {
        let isSuccessful = false;
        let resultType = 'payment';
        let successData = {};

        // Determine success based on various indicators
        if (status === 'success' || status === 'completed') {
          isSuccessful = true;
        } else if (status === 'failed' || status === 'error') {
          isSuccessful = false;
        } else if (resultCode) {
          // Peach Payments success codes start with 000.
          isSuccessful = resultCode.startsWith('000.');
        } else if (checkoutId || transactionId || merchantTxnId || merchantTransactionId) {
          // If we have payment identifiers but no explicit status, assume success
          isSuccessful = true;
        } else if (registrationId) {
          // Card registration
          isSuccessful = true;
          resultType = 'card_registration';
        }

        // Determine payment type
        if (type === 'subscription' || planName) {
          resultType = 'subscription';
        } else if (type === 'card_registration' || registrationId) {
          resultType = 'card_registration';
        } else {
          resultType = 'payment';
        }

        // Build success data
        successData = {
          transactionId: transactionId || merchantTxnId || merchantTransactionId || checkoutId,
          planName: planName,
          billingCycle: cycle,
          amount: amount,
          currency: currency || 'ZAR',
          cardBrand: cardBrand,
          cardLast4: cardLast4,
          registrationId: registrationId,
          userId: userId,
          type: resultType,
          isSubscription: resultType === 'subscription',
          isCardRegistration: resultType === 'card_registration',
          resultDescription: resultDescription,
          // Extract tool info from URL if available
          toolName: new URLSearchParams(window.location.search).get('toolName') || 
                   new URLSearchParams(window.location.search).get('planName') || 
                   (resultType === 'payment' ? 'Growth Tool' : ''),
          toolCategory: new URLSearchParams(window.location.search).get('toolCategory') || 'Growth Tools'
        };

        setPaymentData(successData);
        setPaymentStatus(isSuccessful ? 'success' : 'failed');

        // Clear any pending registration data from localStorage
        if (isSuccessful && (resultType === 'card_registration' || registrationId)) {
          localStorage.removeItem('pendingCardRegistration');
        }

        // Notify backend about the payment result
        if (isSuccessful) {
          // Notify backend about successful payment
          const notificationData = {
            checkoutId: checkoutId,
            merchantTxnId: merchantTxnId || merchantTransactionId,
            userId: userId,
            type: resultType,
            planName: planName,
            cycle: cycle,
            amount: amount,
            currency: currency || 'ZAR',
            registrationId: registrationId,
            cardBrand: cardBrand,
            cardLast4: cardLast4,
            transactionId: successData.transactionId,
            toolName: successData.toolName || 'Growth Tool', // For growth tools
            customerEmail: successData.customerEmail // If available
          };

          await notifyPaymentSuccess(notificationData);

          // Trigger app state updates
          if (resultType === 'subscription' && userId) {
            window.dispatchEvent(new CustomEvent('subscriptionUpdated', {
              detail: { 
                userId, 
                planName, 
                cycle, 
                status: 'active',
                transactionId: successData.transactionId
              }
            }));
          } else if (resultType === 'card_registration' && userId) {
            window.dispatchEvent(new CustomEvent('cardRegistered', {
              detail: { 
                userId, 
                registrationId,
                cardBrand,
                cardLast4
              }
            }));
          }
        } else {
          // Notify backend about failed payment
          const failureData = {
            checkoutId: checkoutId,
            merchantTxnId: merchantTxnId || merchantTransactionId,
            userId: userId,
            type: resultType,
            error: resultDescription || 'Payment failed'
          };

          await notifyPaymentFailure(failureData);
        }
      }, 1500); // 1.5 second delay for processing appearance
    };

    processResult();
  }, [
    checkoutId, registrationId, status, transactionId, userId, type, 
    planName, cycle, merchantTxnId, merchantTransactionId, amount, 
    currency, cardBrand, cardLast4, resultCode, resultDescription
  ]);

  const handleReturnToDashboard = () => {
    if (paymentData.isSubscription) {
      navigate('/dashboard?subscription=activated');
    } else if (paymentData.isCardRegistration) {
      navigate('/payment-methods?success=true');
    } else {
      navigate('/dashboard?payment=success');
    }
  };

  const handleRetryPayment = () => {
    navigate('/pricing');
  };

  const handleContactSupport = () => {
    // You can replace this with your support email or contact form
    window.location.href = 'mailto:support@yourcompany.com?subject=Payment Issue&body=Transaction ID: ' + (paymentData.transactionId || 'N/A');
  };

  // Loading state
  if (paymentStatus === 'loading') {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <div style={{
          textAlign: "center",
          padding: "3rem",
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
          maxWidth: "400px",
          width: "90%"
        }}>
          {/* Animated Loading Spinner */}
          <div style={{
            width: "80px",
            height: "80px",
            border: "4px solid #f3f4f6",
            borderTop: "4px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 2rem auto"
          }}></div>
          
          <h2 style={{ 
            fontSize: "1.5rem", 
            fontWeight: "600", 
            marginBottom: "1rem",
            color: "#1f2937"
          }}>
            Processing Payment...
          </h2>
          
          <p style={{ color: "#6b7280", marginBottom: "1rem", lineHeight: "1.5" }}>
            Please wait while we verify your transaction details and update your account.
          </p>
          
          <div style={{
            background: "#f8fafc",
            padding: "1rem",
            borderRadius: "10px",
            fontSize: "0.875rem",
            color: "#64748b"
          }}>
            🔒 Your payment is being securely processed
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `
          }} />
        </div>
      </div>
    );
  }

  // Success state
  if (paymentStatus === 'success') {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "1rem"
      }}>
        <div style={{
          textAlign: "center",
          padding: "3rem",
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
          maxWidth: "500px",
          width: "100%"
        }}>
          {/* Success Icon */}
          <div style={{
            width: "100px",
            height: "100px",
            background: "linear-gradient(135deg, #10b981, #059669)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 2rem auto",
            animation: "bounce 0.6s ease-out"
          }}>
            <span style={{ fontSize: "3rem", color: "white" }}>✓</span>
          </div>
          
          <h1 style={{ 
            fontSize: "2rem", 
            fontWeight: "700", 
            marginBottom: "1rem",
            color: "#1f2937",
            background: "linear-gradient(135deg, #10b981, #059669)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            {paymentData.isCardRegistration ? 'Card Registered!' :
             paymentData.isSubscription ? 'Subscription Activated!' : 
             'Payment Successful!'}
          </h1>
          
          <p style={{ 
            color: "#6b7280", 
            marginBottom: "2rem", 
            lineHeight: "1.6",
            fontSize: "1.1rem"
          }}>
            {paymentData.isCardRegistration ? 
              'Your payment method has been securely saved and is ready for future use.' :
             paymentData.isSubscription ? 
              'Welcome aboard! Your subscription is now active and your card has been saved for automatic renewals.' : 
              'Thank you! Your payment has been processed successfully and your account has been updated.'}
          </p>
          
          {/* Transaction Details */}
          {paymentData.transactionId && (
            <div style={{
              background: "#f8fafc",
              padding: "1.5rem",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              border: "1px solid #e2e8f0"
            }}>
              <h3 style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "0.5rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Transaction Details
              </h3>
              <p style={{ 
                fontSize: "0.75rem", 
                fontFamily: "Monaco, 'Lucida Console', monospace", 
                color: "#6b7280",
                wordBreak: "break-all",
                background: "white",
                padding: "0.5rem",
                borderRadius: "6px",
                border: "1px solid #e5e7eb"
              }}>
                {paymentData.transactionId}
              </p>
            </div>
          )}

          {/* Subscription Info */}
          {paymentData.isSubscription && paymentData.planName && (
            <div style={{
              background: "linear-gradient(135deg, #fef3c7, #fde68a)",
              padding: "1.5rem",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              border: "1px solid #f59e0b"
            }}>
              <h3 style={{
                fontSize: "1rem",
                fontWeight: "600",
                color: "#92400e",
                marginBottom: "0.5rem"
              }}>
                📋 Subscription Details
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#a16207", margin: "0.25rem 0" }}>
                <strong>Plan:</strong> {paymentData.planName}
              </p>
              {paymentData.billingCycle && (
                <p style={{ fontSize: "0.875rem", color: "#a16207", margin: "0.25rem 0" }}>
                  <strong>Billing:</strong> {paymentData.billingCycle}
                </p>
              )}
              {paymentData.amount && (
                <p style={{ fontSize: "0.875rem", color: "#a16207", margin: "0.25rem 0" }}>
                  <strong>Amount:</strong> {paymentData.currency} {paymentData.amount}
                </p>
              )}
            </div>
          )}

          {/* Card Registration Info */}
          {(paymentData.isSubscription || paymentData.isCardRegistration) && paymentData.registrationId && (
            <div style={{
              background: "linear-gradient(135deg, #f0f9ff, #dbeafe)",
              padding: "1.5rem",
              borderRadius: "12px",
              marginBottom: "2rem",
              border: "1px solid #3b82f6"
            }}>
              <h3 style={{
                fontSize: "1rem",
                fontWeight: "600",
                color: "#1e40af",
                marginBottom: "0.5rem"
              }}>
                💳 Payment Method Saved
              </h3>
              <p style={{ 
                color: "#1e40af", 
                fontSize: "0.875rem", 
                fontWeight: "500",
                marginBottom: "0.5rem"
              }}>
                ✅ Your card has been securely saved for {paymentData.isSubscription ? 'automatic renewals' : 'future payments'}
              </p>
              {paymentData.cardBrand && paymentData.cardLast4 && (
                <p style={{ 
                  fontSize: "0.75rem", 
                  color: "#3730a3",
                  background: "white",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  display: "inline-block"
                }}>
                  {paymentData.cardBrand} •••• •••• •••• {paymentData.cardLast4}
                </p>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <button
              onClick={handleReturnToDashboard}
              style={{
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                color: "white",
                padding: "1rem 2rem",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "1rem",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.4)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
              }}
            >
              {paymentData.isCardRegistration ? 'View Payment Methods' : 'Continue to Dashboard'} →
            </button>
            
            <button
              onClick={handleContactSupport}
              style={{
                background: "transparent",
                color: "#6b7280",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                cursor: "pointer",
                fontSize: "0.875rem",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.background = "#f9fafb";
                e.target.style.borderColor = "#9ca3af";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "transparent";
                e.target.style.borderColor = "#d1d5db";
              }}
            >
              Need help? Contact Support
            </button>
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes bounce {
                0%, 20%, 53%, 80%, 100% {
                  transform: translate3d(0,0,0);
                }
                40%, 43% {
                  transform: translate3d(0, -10px, 0);
                }
                70% {
                  transform: translate3d(0, -5px, 0);
                }
                90% {
                  transform: translate3d(0, -2px, 0);
                }
              }
            `
          }} />
        </div>
      </div>
    );
  }

  // Failed state
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #fca5a5 0%, #ef4444 100%)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "1rem"
    }}>
      <div style={{
        textAlign: "center",
        padding: "3rem",
        background: "white",
        borderRadius: "20px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
        maxWidth: "500px",
        width: "100%"
      }}>
        {/* Error Icon */}
        <div style={{
          width: "100px",
          height: "100px",
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 2rem auto"
        }}>
          <span style={{ fontSize: "3rem", color: "white" }}>✕</span>
        </div>
        
        <h1 style={{ 
          fontSize: "2rem", 
          fontWeight: "700", 
          marginBottom: "1rem",
          color: "#dc2626"
        }}>
          Payment Failed
        </h1>
        
        <p style={{ 
          color: "#6b7280", 
          marginBottom: "2rem", 
          lineHeight: "1.6",
          fontSize: "1.1rem"
        }}>
          We're sorry, but your payment could not be processed at this time. 
          Please check your payment details and try again.
        </p>

        {/* Error Details */}
        {paymentData.resultDescription && (
          <div style={{
            background: "#fef2f2",
            padding: "1.5rem",
            borderRadius: "12px",
            marginBottom: "2rem",
            border: "1px solid #fecaca"
          }}>
            <h3 style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#dc2626",
              marginBottom: "0.5rem"
            }}>
              Error Details:
            </h3>
            <p style={{ 
              fontSize: "0.875rem", 
              color: "#991b1b"
            }}>
              {paymentData.resultDescription}
            </p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <button
            onClick={handleRetryPayment}
            style={{
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              color: "white",
              padding: "1rem 2rem",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "1rem",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.4)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
            }}
          >
            Try Again
          </button>
          
          <button
            onClick={handleReturnToDashboard}
            style={{
              background: "transparent",
              color: "#6b7280",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              cursor: "pointer",
              fontSize: "0.875rem",
              transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => {
              e.target.style.background = "#f9fafb";
              e.target.style.borderColor = "#9ca3af";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "transparent";
              e.target.style.borderColor = "#d1d5db";
            }}
          >
            Return to Dashboard
          </button>
          
          <button
            onClick={handleContactSupport}
            style={{
              background: "transparent",
              color: "#dc2626",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: "1px solid #fca5a5",
              cursor: "pointer",
              fontSize: "0.875rem",
              transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => {
              e.target.style.background = "#fef2f2";
              e.target.style.borderColor = "#ef4444";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "transparent";
              e.target.style.borderColor = "#fca5a5";
            }}
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;