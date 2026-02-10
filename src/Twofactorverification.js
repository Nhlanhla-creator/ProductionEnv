import React, { useState } from 'react';
import { Shield, X } from 'lucide-react';
import * as OTPAuth from 'otpauth';

const TwoFactorVerification = ({ isOpen, onVerify, onClose, secret }) => {
  const colors = {
    lightBrown: "#f5f0e1",
    mediumBrown: "#e6d7c3",
    accentBrown: "#c8b6a6",
    primaryBrown: "#a67c52",
    darkBrown: "#7d5a50",
    textBrown: "#4a352f",
    backgroundBrown: "#faf7f2",
    paleBrown: "#f0e6d9",
  };

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Login - Verifying 2FA');
      console.log('Secret from DB:', secret);
      console.log('Code entered:', code);
      
      // Create TOTP instance with EXACT same parameters as setup
      const totp = new OTPAuth.TOTP({
        issuer: 'BIGMarketplace',
        label: 'User',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret, // Use the string directly
      });

      // Generate what the current token should be for debugging
      const currentToken = totp.generate();
      console.log('Current valid token:', currentToken);
      console.log('User entered:', code);

      // Verify the token with a reasonable window
      const delta = totp.validate({
        token: code,
        window: 10, // ±5 minutes for debugging, reduce to 2 in production
      });

      console.log('Validation delta:', delta);

      if (delta !== null) {
        console.log('2FA verification successful!');
        onVerify(true);
      } else {
        console.log('2FA verification failed');
        setError(`Invalid code. Expected: ${currentToken}. Please check your authenticator app and ensure device time is correct.`);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error verifying 2FA:', err);
      setError(`Verification failed: ${err.message}`);
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleVerify();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(4px)",
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "20px",
        padding: "32px",
        maxWidth: "420px",
        width: "90%",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
        border: "1px solid #e8ddd6",
        position: "relative",
      }}>
        <button 
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: colors.darkBrown,
            padding: "4px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            width: "50px",
            height: "50px",
            backgroundColor: colors.darkBrown,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px auto",
            boxShadow: "0 6px 20px rgba(141, 110, 99, 0.3)",
          }}>
            <Shield size={24} color="white" />
          </div>
          <h3 style={{
            margin: "0 0 6px 0",
            fontSize: "20px",
            fontWeight: "700",
            color: colors.textBrown,
          }}>
            Two-Factor Authentication
          </h3>
          <p style={{
            margin: 0,
            fontSize: "13px",
            color: colors.darkBrown,
            lineHeight: 1.4,
          }}>
            Enter the code from your authenticator app
          </p>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <input
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyPress={handleKeyPress}
            maxLength={6}
            autoFocus
            style={{
              width: "100%",
              padding: "16px",
              border: `2px solid ${error ? '#dc2626' : colors.mediumBrown}`,
              borderRadius: "12px",
              fontSize: "24px",
              textAlign: "center",
              letterSpacing: "12px",
              fontWeight: "600",
              fontFamily: "'Courier New', monospace",
              backgroundColor: "white",
              color: colors.textBrown,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <p style={{
              color: "#dc2626",
              fontSize: "0.875rem",
              marginTop: "8px",
              marginBottom: 0,
              textAlign: "center",
            }}>
              {error}
            </p>
          )}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: colors.darkBrown,
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "15px",
            cursor: loading || code.length !== 6 ? "not-allowed" : "pointer",
            opacity: loading || code.length !== 6 ? 0.6 : 1,
          }}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        <p style={{
          textAlign: "center",
          marginTop: "16px",
          fontSize: "13px",
          color: "#6b7280",
        }}>
          Lost access to your authenticator? Contact support.
        </p>

        {/* Time sync warning */}
        <div style={{
          marginTop: "16px",
          padding: "12px",
          backgroundColor: "#fef3c7",
          border: "1px solid #fde68a",
          borderRadius: "8px",
          fontSize: "12px",
          color: "#92400e",
        }}>
          <strong>Tip:</strong> Make sure your device time is set to automatic. TOTP codes are time-sensitive.
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerification;