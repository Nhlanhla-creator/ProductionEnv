"use client"

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { auth, db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const NeedHelp = ({ disabled }) => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSending, setHelpSending] = useState(false);
  const [helpSent, setHelpSent] = useState(false);
  const [error, setError] = useState(null);
  const helpRef = useRef(null);
  const [userEmail, setUserEmail] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(false);

  // Fetch user info when modal opens
  useEffect(() => {
    if (showHelpModal) {
      fetchUserInfo();
    }
  }, [showHelpModal]);

  const fetchUserInfo = async () => {
    try {
      setLoadingUserInfo(true);
      const user = auth.currentUser;
      
      if (!user) {
        setUserInfo(null);
        setUserEmail('anonymous@user.com');
        return;
      }

      setUserEmail(user.email || 'anonymous@user.com');

      let info = {
        uid: user.uid,
        email: user.email || 'Not provided',
        displayName: user.displayName || 'Unknown User',
        registeredName: null,
        phone: null,
        companyName: null,
        userType: 'unknown',
        profileType: 'unknown'
      };

      // Try universalProfiles first
      try {
        const universalProfileRef = doc(db, "universalProfiles", user.uid);
        const universalSnap = await getDoc(universalProfileRef);
        if (universalSnap.exists()) {
          const data = universalSnap.data();
          info = {
            ...info,
            displayName: user.displayName || data?.entityOverview?.registeredName || data?.formData?.business?.registeredName || data?.formData?.applicant?.fullName || 'Unknown User',
            registeredName: data?.entityOverview?.registeredName || data?.formData?.business?.registeredName || null,
            phone: data?.entityOverview?.phone || data?.formData?.business?.phone || data?.formData?.applicant?.phone || null,
            companyName: data?.formData?.business?.registeredName || data?.entityOverview?.registeredName || null,
            userType: data?.userType || 'sme',
            profileType: 'universal'
          };
          setUserInfo(info);
          setLoadingUserInfo(false);
          return;
        }
      } catch (err) {
        console.log('Error fetching universal profile:', err);
      }

      // Try catalystProfiles
      try {
        const catalystProfileRef = doc(db, "catalystProfiles", user.uid);
        const catalystSnap = await getDoc(catalystProfileRef);
        if (catalystSnap.exists()) {
          const data = catalystSnap.data();
          info = {
            ...info,
            displayName: user.displayName || data?.formData?.business?.registeredName || data?.formData?.applicant?.fullName || 'Unknown User',
            registeredName: data?.formData?.business?.registeredName || null,
            phone: data?.formData?.business?.phone || data?.formData?.applicant?.phone || null,
            companyName: data?.formData?.business?.registeredName || null,
            userType: 'catalyst',
            profileType: 'catalyst'
          };
          setUserInfo(info);
          setLoadingUserInfo(false);
          return;
        }
      } catch (err) {
        console.log('Error fetching catalyst profile:', err);
      }

      // Try advisorProfiles
      try {
        const advisorProfileRef = doc(db, "advisorProfiles", user.uid);
        const advisorSnap = await getDoc(advisorProfileRef);
        if (advisorSnap.exists()) {
          const data = advisorSnap.data();
          info = {
            ...info,
            displayName: user.displayName || data?.formData?.personalInfo?.fullName || data?.fullName || 'Unknown User',
            phone: data?.formData?.personalInfo?.phone || data?.phone || null,
            userType: 'advisor',
            profileType: 'advisor'
          };
          setUserInfo(info);
          setLoadingUserInfo(false);
          return;
        }
      } catch (err) {
        console.log('Error fetching advisor profile:', err);
      }

      // Fallback - just use auth info
      setUserInfo(info);
      setLoadingUserInfo(false);

    } catch (error) {
      console.error('Error fetching user info:', error);
      setUserInfo(null);
      setLoadingUserInfo(false);
    }
  };

  const handleHelpSubmit = async () => {
    if (!helpMessage.trim()) return;

    setHelpSending(true);
    setError(null);

    try {
      const user = auth.currentUser;
      const functions = getFunctions();
      const sendSupportEmail = httpsCallable(functions, 'sendSupportEmail');

      const email = user?.email || 'anonymous@user.com';
      const displayName = userInfo?.displayName || user?.displayName || 'Unknown User';

      // Call the cloud function
      const result = await sendSupportEmail({
        userEmail: email,
        userName: displayName,
        userUid: userInfo?.uid || user?.uid || 'Not logged in',
        userPhone: userInfo?.phone || 'Not provided',
        userRegisteredName: userInfo?.registeredName || 'Not provided',
        userCompany: userInfo?.companyName || 'Not provided',
        userType: userInfo?.userType || 'Unknown',
        userProfileType: userInfo?.profileType || 'Unknown',
        message: helpMessage,
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
        platform: 'BIG Marketplace'
      });

      console.log('Support email sent:', result.data);

      setHelpSent(true);
      setHelpMessage('');

      setTimeout(() => {
        setHelpSent(false);
        setShowHelpModal(false);
      }, 3000);

    } catch (err) {
      console.error('Help request sending error:', err);
      setError(err.message || 'Failed to send help request. Please try again.');
    } finally {
      setHelpSending(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={helpRef}>
      <button
        onClick={() => !disabled && setShowHelpModal(!showHelpModal)}
        title={disabled ? undefined : "Need help?"}
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
                  <p style={{ fontSize: '13px', color: '#155724', marginTop: '8px' }}>
                    We've also sent a confirmation to your email.
                  </p>
                </div>
              ) : (
                <>
                  {/* User info summary */}
                  <div style={{
                    background: 'linear-gradient(135deg, #fdf8f6 0%, #f3e8dc 100%)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #d6b88a',
                    marginBottom: '16px',
                  }}>
                    <p style={{
                      margin: '0 0 4px 0',
                      color: '#5d4037',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}>
                      👤 Account Info
                    </p>
                    {loadingUserInfo ? (
                      <p style={{ fontSize: '12px', color: '#8d6e63', margin: '0' }}>Loading your account info...</p>
                    ) : userInfo ? (
                      <div style={{ fontSize: '12px', color: '#6d4c41' }}>
                        <p style={{ margin: '2px 0' }}><strong>Name:</strong> {userInfo.displayName}</p>
                        <p style={{ margin: '2px 0' }}><strong>Email:</strong> {userInfo.email}</p>
                        {userInfo.registeredName && <p style={{ margin: '2px 0' }}><strong>Business:</strong> {userInfo.registeredName}</p>}
                        <p style={{ margin: '2px 0' }}><strong>Profile Type:</strong> {userInfo.profileType}</p>
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#8d6e63', margin: '0' }}>Please sign in to include your account info</p>
                    )}
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
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NeedHelp;