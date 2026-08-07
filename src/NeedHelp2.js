"use client"
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { auth } from './firebaseConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';

const NeedHelp = ({ open, onClose }) => {
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSending, setHelpSending] = useState(false);
  const [helpSent, setHelpSent] = useState(false);
  const [error, setError] = useState(null);
  const helpRef = useRef(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);
// NeedHelp.js - update the error handling
const handleHelpSubmit = async () => {
  if (!helpMessage.trim()) return;

  setHelpSending(true);
  setError(null);

  try {
    const user = auth.currentUser;
    const functions = getFunctions();
    const sendSupportEmail = httpsCallable(functions, 'sendSupportEmail');

    const email = user?.email || 'anonymous@user.com';
    const displayName = user?.displayName || 'Unknown User';
    const userUid = user?.uid || 'Not logged in';

    // Call the cloud function
    const result = await sendSupportEmail({
      userEmail: email,
      userName: displayName,
      userUid: userUid,
      userPhone: 'Not provided',
      userRegisteredName: 'Not provided',
      userCompany: 'Not provided',
      userType: 'Unknown',
      userProfileType: 'Unknown',
      message: helpMessage,
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      platform: 'BIG Marketplace'
    });

    console.log('Support email sent:', result.data);

    setHelpSent(true);
    setHelpMessage('');

    setTimeout(() => {
      setHelpSent(false);
      onClose();
    }, 3000);

  } catch (err) {
    console.error('Help request sending error:', err);
    
    // User-friendly error message
    let userMessage = 'Failed to send help request. Please try again.';
    
    // Check for specific error types
    if (err.message?.includes('unauthenticated')) {
      userMessage = 'Please sign in to send a help request.';
    } else if (err.message?.includes('invalid-argument')) {
      userMessage = 'Please enter a message before sending.';
    } else if (err.message?.includes('network') || err.message?.includes('offline')) {
      userMessage = 'Network error. Please check your connection and try again.';
    }
    
    setError(userMessage);
  } finally {
    setHelpSending(false);
  }
};

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div ref={helpRef} style={{
        backgroundColor: '#372c27',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        width: '90%',
        maxWidth: '425px',
        overflow: 'hidden',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(248, 165, 110, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#372c27',
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            fontWeight: 600,
          }}>
            <MessageSquare size={20} style={{ marginRight: '12px', color: '#bcae9c' }} />
            Need Help?
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#bcae9c',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseOut={(e) => e.currentTarget.style.color = '#bcae9c'}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {helpSent ? (
            <div style={{
              textAlign: 'center',
              padding: '24px',
              backgroundColor: 'rgba(188, 174, 156, 0.1)',
              borderRadius: '14px',
              marginBottom: '16px',
              border: '1px solid rgba(248, 165, 110, 0.1)',
            }}>
              <p style={{ 
                fontWeight: '600', 
                marginBottom: '8px',
                color: '#b89f8d',
              }}>Help Request Sent!</p>
              <p style={{ color: '#c8bab4' }}>Our team will get back to you shortly.</p>
            </div>
          ) : (
            <>
              <p style={{ 
                marginBottom: '20px',
                color: '#c8bab4',
                lineHeight: '1.5',
              }}>
                Please describe your issue or question below. We'll get back to you as soon as possible.
              </p>
              
              <textarea
                value={helpMessage}
                onChange={(e) => setHelpMessage(e.target.value)}
                placeholder="Type your message here..."
                style={{
                  width: '100%',
                  minHeight: '140px',
                  padding: '12px',
                  border: '1px solid rgba(188, 174, 156, 0.3)',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  resize: 'vertical',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  color: '#ffffff',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#b89f8d';
                  e.target.style.backgroundColor = 'rgba(184, 159, 141, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(188, 174, 156, 0.3)';
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                }}
              />

              {error && (
                <p style={{ 
                  color: '#ef4444', 
                  marginBottom: '16px',
                  fontSize: '14px',
                }}>{error}</p>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
              }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
                    border: '1px solid rgba(188, 174, 156, 0.3)',
                    background: 'transparent',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    color: '#c8bab4',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(188, 174, 156, 0.1)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#c8bab4';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleHelpSubmit}
                  disabled={!helpMessage.trim() || helpSending}
                  style={{
                    padding: '10px 18px',
                    background: !helpMessage.trim() || helpSending 
                      ? 'rgba(188, 174, 156, 0.2)' 
                      : 'linear-gradient(135deg, #b89f8d 0%, rgba(184, 159, 141, 0.8) 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: !helpMessage.trim() || helpSending ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    boxShadow: !helpMessage.trim() || helpSending 
                      ? 'none' 
                      : '0 2px 8px rgba(184, 159, 141, 0.3)',
                  }}
                  onMouseOver={(e) => {
                    if (helpMessage.trim() && !helpSending) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(184, 159, 141, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (helpMessage.trim() && !helpSending) {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(184, 159, 141, 0.3)';
                    }
                  }}
                >
                  {helpSending ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send size={16} />
                      Send
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NeedHelp;