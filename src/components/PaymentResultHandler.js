// src/components/PaymentResultHandler.js
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const PaymentResultHandler = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handlePaymentResult = async () => {
      // Get all the parameters from the URL
      const type = searchParams.get('type');
      const userId = searchParams.get('userId');
      const merchantTxnId = searchParams.get('merchantTxnId');
      const status = searchParams.get('status');
      const transactionId = searchParams.get('transactionId');
      const registrationId = searchParams.get('registrationId');
      
      // Extract checkoutId from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      let checkoutId = urlParams.get('checkoutId');

      console.log('🔄 Payment result received:', {
        type,
        userId,
        merchantTxnId,
        checkoutId,
        status,
        transactionId,
        registrationId,
        fullUrl: window.location.href
      });

      try {
        // If we already have status from URL parameters, handle it directly
        if (status) {
          if (status === 'success') {
            if (type === 'registration') {
              // Handle card registration success
              localStorage.removeItem('pendingCardRegistration');
              window.location.href = '/payment-methods?success=true';
            } else {
              // Handle payment success
              window.location.href = `/payment-success?transactionId=${transactionId || checkoutId || merchantTxnId}`;
            }
            return;
          } else if (status === 'failed') {
            // Handle failure
            window.location.href = `/payment-error?reason=${encodeURIComponent('Payment was not successful')}`;
            return;
          }
        }

        // If no status in URL, verify with backend
        const apiUrl = process.env.REACT_APP_API_URL || 'https://brown-ivory-website-h8srool38-big-league.vercel.app';
        
        let response;
        if (checkoutId) {
          // Verify using checkoutId
          response = await fetch(`${apiUrl}/api/payments/verify/${checkoutId}?userId=${userId}&type=${type}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } else if (merchantTxnId) {
          // Verify using merchantTxnId
          response = await fetch(`${apiUrl}/api/payments/verify-result?merchantTxnId=${merchantTxnId}&userId=${userId}&type=${type}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } else {
          throw new Error('No checkout ID or merchant transaction ID found');
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        console.log('✅ Payment verification result:', result);

        // Redirect based on the result
        if (result.success) {
          if (type === 'registration') {
            localStorage.removeItem('pendingCardRegistration');
            window.location.href = '/payment-methods?success=true';
          } else {
            window.location.href = `/payment-success?transactionId=${result.transactionId || checkoutId || merchantTxnId}`;
          }
        } else {
          window.location.href = `/payment-error?reason=${encodeURIComponent(result.error || 'Payment verification failed')}`;
        }

      } catch (error) {
        console.error('❌ Payment result processing error:', error);
        window.location.href = `/payment-error?reason=${encodeURIComponent(error.message)}`;
      }
    };

    handlePaymentResult();
  }, [searchParams]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
    }}>
      <div style={{
        textAlign: "center",
        padding: "3rem",
        background: "white",
        borderRadius: "16px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        maxWidth: "450px",
        width: "90%"
      }}>
        {/* Loading Spinner */}
        <div style={{
          width: "80px",
          height: "80px",
          border: "6px solid #f3f4f6",
          borderTop: "6px solid #A67C52",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 2rem auto"
        }}></div>
        
        <h2 style={{ 
          fontSize: "1.75rem", 
          fontWeight: "700", 
          marginBottom: "1rem",
          color: "#1f2937",
          background: "linear-gradient(135deg, #A67C52 0%, #8B5A3C 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Processing Payment Result
        </h2>
        
        <p style={{ 
          color: "#6b7280", 
          marginBottom: "2rem",
          lineHeight: "1.6",
          fontSize: "1.1rem"
        }}>
          Please wait while we verify your payment and redirect you to the results page...
        </p>

        <div style={{
          background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
          padding: "1.5rem",
          borderRadius: "12px",
          fontSize: "0.875rem",
          color: "#6b7280",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ marginBottom: "0.5rem", fontWeight: "600" }}>
            🔒 Secure Payment Processing
          </div>
          If this takes too long, please contact our support team.
        </div>

        {/* Progress indicator */}
        <div style={{
          marginTop: "2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <div style={{
            width: "8px",
            height: "8px",
            background: "#A67C52",
            borderRadius: "50%",
            animation: "pulse 1.5s ease-in-out infinite"
          }}></div>
          <div style={{
            width: "8px",
            height: "8px",
            background: "#A67C52",
            borderRadius: "50%",
            animation: "pulse 1.5s ease-in-out infinite 0.2s"
          }}></div>
          <div style={{
            width: "8px",
            height: "8px",
            background: "#A67C52",
            borderRadius: "50%",
            animation: "pulse 1.5s ease-in-out infinite 0.4s"
          }}></div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 80%, 100% { 
                transform: scale(0.8);
                opacity: 0.5;
              }
              40% { 
                transform: scale(1);
                opacity: 1;
              }
            }
          `
        }} />
      </div>
    </div>
  );
};

export default PaymentResultHandler;