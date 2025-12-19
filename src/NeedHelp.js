"use client"

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { API_KEYS } from './API';
import { auth } from './firebaseConfig';

const NeedHelp = ({ disabled }) => {
  const emailjsConfig = {
    serviceId: API_KEYS.SERVICE_ID_FEEDBACK,
    templateId: API_KEYS.TEMPLATE_ID_FEEDBACK,
    autoReplyTemplateId: API_KEYS.AUTORESPONSE_TEMPLATE_FEEDBACK,
    publicKey: API_KEYS.PUBLIC_KEY_FEEDBACK
  };

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSending, setHelpSending] = useState(false);
  const [helpSent, setHelpSent] = useState(false);
  const [error, setError] = useState(null);
  const helpRef = useRef(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    emailjs.init(emailjsConfig.publicKey);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        setShowHelpModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleHelpSubmit = async () => {
    if (!helpMessage.trim()) return;

    setHelpSending(true);
    setError(null);

    try {
      const email = auth.currentUser?.email || 'anonymous@user.com';
      setUserEmail(email);

      await emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        {
          from_email: email,
          subject: 'Help Request',
          message: helpMessage,
          to_email: 'support@bigmarketplace.africa'
        },
        emailjsConfig.publicKey
      );

      if (email !== 'anonymous@user.com') {
        await emailjs.send(
          emailjsConfig.serviceId,
          emailjsConfig.autoReplyTemplateId,
          {
            from_email: email,
            subject: 'no-reply:Help Request Received'
          },
          emailjsConfig.publicKey
        );
      }

      setHelpSent(true);
      setHelpMessage('');

      setTimeout(() => {
        setHelpSent(false);
        setShowHelpModal(false);
      }, 3000);
    } catch (err) {
      console.error('Help request sending error:', err);
      setError(err.response?.text || err.message || 'Failed to send help request. Please try again.');
    } finally {
      setHelpSending(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={helpRef}>
      <button
        onClick={() => !disabled && setShowHelpModal(!showHelpModal)}
        title={disabled ? undefined : "Need help with your score?"}
        disabled={disabled}
        style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: disabled
            ? 'linear-gradient(135deg, #cccccc 0%, #aaaaaa 100%)'
            : 'linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)',
          color: 'white',
          border: 'none',
          fontWeight: '600',
          fontSize: '12px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 16px rgba(141, 110, 99, 0.3)',
          whiteSpace: 'nowrap',
          opacity: disabled ? 0.7 : 1,
          minWidth: '120px',
        }}
        onMouseOver={(e) => {
          if (!disabled) {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(141, 110, 99, 0.4)';
          }
        }}
        onMouseOut={(e) => {
          if (!disabled) {
            e.target.style.transform = 'translateY(0px)';
            e.target.style.boxShadow = '0 4px 16px rgba(141, 110, 99, 0.3)';
          }
        }}
      >
        <MessageSquare size={16} />
        <span>Need Help?</span>
      </button>

      {showHelpModal && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '999999',
          padding: '20px',
        }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowHelpModal(false);
            }
          }}
        >
          <div style={{
            position: 'relative',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            zIndex: '999999',
            width: '90%',
            maxWidth: '500px',
            overflow: 'hidden',
            border: '1px solid #e8ddd6',
          }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)',
              color: 'white',
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{
                  margin: '0 0 4px 0',
                  fontSize: '20px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <MessageSquare size={20} />
                  Need Help?
                </h3>
                <p style={{
                  margin: '0',
                  fontSize: '13px',
                  opacity: '0.9',
                }}>
                  Our team is here to assist you
                </p>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'rotate(90deg)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'rotate(0deg)';
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {helpSent ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: 'linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%)',
                  borderRadius: '8px',
                  border: '1px solid #28a745',
                }}>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#155724', margin: '0 0 8px 0' }}>
                    Help Request Sent!
                  </p>
                  <p style={{ fontSize: '14px', color: '#155724', margin: '0' }}>
                    Our team will get back to you shortly.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{
                    background: 'linear-gradient(135deg, #fdf8f6 0%, #f3e8dc 100%)',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #d6b88a',
                    marginBottom: '20px',
                  }}>
                    <p style={{
                      margin: '0 0 8px 0',
                      color: '#5d4037',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}>
                      🆘 How can we help you?
                    </p>
                    <p style={{
                      margin: '0',
                      color: '#6d4c41',
                      fontSize: '13px',
                    }}>
                      Describe your issue and we'll assist you as soon as possible.
                    </p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontWeight: '600',
                      color: '#5d4037',
                      marginBottom: '8px',
                      fontSize: '14px',
                    }}>
                      Your message:
                    </label>
                    <textarea
                      value={helpMessage}
                      onChange={(e) => setHelpMessage(e.target.value)}
                      placeholder="Describe what you need help with..."
                      rows={6}
                      maxLength={500}
                      style={{
                        width: '100%',
                        border: '2px solid #e8ddd6',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '14px',
                        color: '#5d4037',
                        resize: 'vertical',
                        minHeight: '120px',
                        transition: 'border-color 0.2s ease',
                        fontFamily: 'inherit',
                        outline: 'none',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#8d6e63';
                        e.target.style.boxShadow = '0 0 0 3px rgba(141, 110, 99, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e8ddd6';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '8px',
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#8d6e63',
                      }}>
                        {helpMessage.length}/500 characters
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div style={{
                      color: '#e74c3c',
                      fontSize: '13px',
                      marginBottom: '12px',
                      padding: '8px',
                      backgroundColor: 'rgba(231, 76, 60, 0.1)',
                      borderRadius: '4px'
                    }}>
                      {error}
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                  }}>
                    <button
                      onClick={() => setShowHelpModal(false)}
                      style={{
                        padding: '12px 24px',
                        border: '2px solid #e8ddd6',
                        background: 'white',
                        color: '#6d4c41',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.target.style.borderColor = '#d6b88a';
                        e.target.style.background = '#fdf8f6';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.borderColor = '#e8ddd6';
                        e.target.style.background = 'white';
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleHelpSubmit}
                      disabled={!helpMessage.trim() || helpSending}
                      style={{
                        padding: '12px 24px',
                        background: !helpMessage.trim() || helpSending
                          ? 'linear-gradient(135deg, #cccccc 0%, #aaaaaa 100%)'
                          : 'linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: !helpMessage.trim() || helpSending ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: !helpMessage.trim() || helpSending ? 0.6 : 1,
                      }}
                      onMouseOver={(e) => {
                        if (helpMessage.trim() && !helpSending) {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 6px 20px rgba(141, 110, 99, 0.4)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (helpMessage.trim() && !helpSending) {
                          e.target.style.transform = 'translateY(0px)';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    >
                      {helpSending ? (
                        <>
                          <div style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '50%',
                            borderTopColor: 'white',
                            animation: 'spin 1s ease-in-out infinite',
                          }}></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Send Request
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NeedHelp;