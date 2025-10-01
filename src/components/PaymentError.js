import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentError = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') || 'An unknown error occurred';
  const checkoutId = searchParams.get('checkoutId');

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#fef2f2"
    }}>
      <div style={{
        textAlign: "center",
        padding: "3rem",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        maxWidth: "500px"
      }}>
        <div style={{ fontSize: "4rem", color: "#ef4444", marginBottom: "1rem" }}>❌</div>
        
        <h2 style={{ 
          fontSize: "1.8rem", 
          fontWeight: "600", 
          color: "#dc2626", 
          marginBottom: "1rem" 
        }}>
          Payment Error
        </h2>
        
        <p style={{ color: "#6b7280", marginBottom: "1rem", lineHeight: "1.5" }}>
          {reason}
        </p>
        
        {checkoutId && (
          <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginBottom: "2rem" }}>
            Checkout ID: {checkoutId}
          </p>
        )}
        
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600"
            }}
          >
            Go to Dashboard
          </button>
          
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600"
            }}
          >
            Go Back
          </button>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600"
            }}
          >
            Try Again
          </button>
        </div>
        
        <div style={{ marginTop: "2rem", padding: "1rem", background: "#f9fafb", borderRadius: "8px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
            What can you do?
          </h3>
          <ul style={{ textAlign: "left", color: "#6b7280", fontSize: "0.875rem", lineHeight: "1.5" }}>
            <li>• Check your internet connection</li>
            <li>• Verify your payment method details</li>
            <li>• Try a different payment method</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentError;