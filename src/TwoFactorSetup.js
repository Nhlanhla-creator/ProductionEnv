import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Shield, Copy, Check } from 'lucide-react';
import { db, auth } from './firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import * as OTPAuth from 'otpauth';

const TwoFactorSetup = ({ isOpen, onClose, onSuccess }) => {
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

  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [totp, setTotp] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateSecret();
    }
  }, [isOpen]);

  const generateSecret = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // Generate secret using otpauth
    const totpInstance = new OTPAuth.TOTP({
      issuer: 'BIGMarketplace',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(generateRandomSecret()),
    });

    setTotp(totpInstance);
    setSecret(totpInstance.secret.base32);

    // Generate QR code
    const otpauthURL = totpInstance.toString();
    QRCode.toDataURL(otpauthURL, (err, dataUrl) => {
      if (err) {
        console.error('Error generating QR code:', err);
        return;
      }
      setQrCode(dataUrl);
    });
  };

  // Generate random base32 secret
  const generateRandomSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify the token
      const delta = totp.validate({
        token: verificationCode,
        window: 2, // Allow 2 time steps before/after (±60 seconds)
      });

      if (delta === null) {
        setError('Invalid verification code. Please try again.');
        setLoading(false);
        return;
      }

      // Save secret to Firestore
      const user = auth.currentUser;
      await updateDoc(doc(db, 'users', user.uid), {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
        twoFactorSetupDate: new Date().toISOString()
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error enabling 2FA:', err);
      setError('Failed to enable 2FA. Please try again.');
    } finally {
      setLoading(false);
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
        maxWidth: "480px",
        width: "90%",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
        border: "1px solid #e8ddd6",
        maxHeight: "calc(100vh - 80px)",
        overflowY: "auto",
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
            Enable Two-Factor Authentication
          </h3>
          <p style={{
            margin: 0,
            fontSize: "13px",
            color: colors.darkBrown,
            lineHeight: 1.4,
          }}>
            Secure your account with an extra layer of protection
          </p>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <h4 style={{
            fontSize: "16px",
            fontWeight: "700",
            color: colors.textBrown,
            margin: "0 0 8px 0",
          }}>
            Step 1: Scan QR Code
          </h4>
          <p style={{
            fontSize: "14px",
            color: "#6b7280",
            margin: "0 0 12px 0",
            lineHeight: 1.5,
          }}>
            Use an authenticator app (Google Authenticator, Authy, etc.) to scan this QR code:
          </p>
          {qrCode && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              padding: "20px",
              backgroundColor: "white",
              border: `2px solid ${colors.mediumBrown}`,
              borderRadius: "12px",
              margin: "12px 0",
            }}>
              <img src={qrCode} alt="QR Code" style={{ maxWidth: "200px", height: "auto" }} />
            </div>
          )}
        </div>

        <div style={{ marginBottom: "24px" }}>
          <h4 style={{
            fontSize: "16px",
            fontWeight: "700",
            color: colors.textBrown,
            margin: "0 0 8px 0",
          }}>
            Step 2: Or Enter This Code Manually
          </h4>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            backgroundColor: colors.lightBrown,
            border: `2px solid ${colors.mediumBrown}`,
            borderRadius: "12px",
          }}>
            <code style={{
              flex: 1,
              fontSize: "14px",
              color: colors.textBrown,
              wordBreak: "break-all",
              fontWeight: "600",
              fontFamily: "'Courier New', monospace",
            }}>
              {secret}
            </code>
            <button
              onClick={copySecret}
              style={{
                backgroundColor: colors.primaryBrown,
                color: "white",
                border: "none",
                padding: "8px",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <h4 style={{
            fontSize: "16px",
            fontWeight: "700",
            color: colors.textBrown,
            margin: "0 0 8px 0",
          }}>
            Step 3: Enter Verification Code
          </h4>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: `2px solid ${colors.mediumBrown}`,
              borderRadius: "12px",
              fontSize: "18px",
              textAlign: "center",
              letterSpacing: "8px",
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
            }}>
              {error}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "transparent",
              color: colors.darkBrown,
              border: `2px solid ${colors.darkBrown}`,
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={loading || verificationCode.length !== 6}
            style={{
              backgroundColor: colors.darkBrown,
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: loading || verificationCode.length !== 6 ? "not-allowed" : "pointer",
              opacity: loading || verificationCode.length !== 6 ? 0.6 : 1,
            }}
          >
            {loading ? 'Verifying...' : 'Enable 2FA'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSetup;