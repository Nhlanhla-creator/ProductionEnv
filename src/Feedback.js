import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Star } from 'react-feather';
import { auth } from './firebaseConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';

const Feedback = () => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [error, setError] = useState(null);
  const feedbackRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (feedbackRef.current && !feedbackRef.current.contains(event.target)) {
        setShowFeedback(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFeedbackSubmit = async () => {
    if (!feedbackMessage.trim()) return;

    setFeedbackSending(true);
    setError(null);

    try {
      const user = auth.currentUser;
      const functions = getFunctions();
      const sendFeedback = httpsCallable(functions, 'sendFeedback');

      const email = user?.email || 'anonymous@user.com';
      const displayName = user?.displayName || 'Anonymous User';
      const userUid = user?.uid || 'Not logged in';

      const result = await sendFeedback({
        userEmail: email,
        userName: displayName,
        userUid: userUid,
        message: feedbackMessage,
        rating: feedbackRating,
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
        platform: 'BIG Marketplace'
      });

      console.log('Feedback sent:', result.data);

      setFeedbackSent(true);
      setFeedbackMessage('');
      setFeedbackRating(0);

      setTimeout(() => {
        setFeedbackSent(false);
        setShowFeedback(false);
      }, 3000);

    } catch (err) {
      console.error('Feedback sending error:', err);
      setError('Failed to send feedback. Please try again.');
    } finally {
      setFeedbackSending(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = i <= (hoverRating || feedbackRating);
      stars.push(
        <Star
          key={i}
          size={20}
          fill={filled ? '#F5A623' : 'none'}
          stroke={filled ? '#F5A623' : '#D1C4B0'}
          style={{
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginRight: '4px'
          }}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setFeedbackRating(i)}
        />
      );
    }
    return stars;
  };

 const styles = {
    wrapper: { 
      position: 'relative',
      marginLeft: '20px'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      background: 'linear-gradient(135deg, #9E6E3C 0%, #B8834F 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      fontSize: '0.85rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(158, 110, 60, 0.2)'
    },
    buttonHover: {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(158, 110, 60, 0.3)',
      background: 'linear-gradient(135deg, #8A5F35 0%, #A67745 100%)'
    },
    buttonActive: {
      transform: 'translateY(0)'
    },
    popup: {
      position: 'absolute',
      top: 'calc(100% + 12px)',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      width: '320px',
      zIndex: '1001',
      overflow: 'hidden',
      animation: 'fadeInUp 0.3s ease',
      border: '1px solid rgba(158, 110, 60, 0.1)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      background: 'linear-gradient(135deg, #F8F7F3 0%, #F2EEE6 100%)',
      borderBottom: '1px solid rgba(158, 110, 60, 0.1)'
    },
    headerTitle: {
      margin: '0',
      fontSize: '1rem',
      color: '#624635',
      fontWeight: '600'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#9E6E3C',
      padding: '4px',
      borderRadius: '4px',
      transition: 'all 0.2s ease'
    },
    closeButtonHover: {
      backgroundColor: 'rgba(158, 110, 60, 0.1)',
      color: '#624635'
    },
    content: {
      padding: '20px'
    },
    textarea: {
      width: '100%',
      border: '2px solid #F2EEE6',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '0.9rem',
      color: '#624635',
      resize: 'vertical',
      minHeight: '80px',
      transition: 'border-color 0.2s ease',
      fontFamily: 'inherit'
    },
    textareaFocus: {
      outline: 'none',
      borderColor: '#9E6E3C',
      boxShadow: '0 0 0 3px rgba(158, 110, 60, 0.1)'
    },
    textareaPlaceholder: {
      color: '#AAA199'
    },
    actions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '16px'
    },
    charCount: {
      fontSize: '0.75rem',
      color: '#AAA199'
    },
    submitButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: 'linear-gradient(135deg, #9E6E3C 0%, #B8834F 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '0.85rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    submitButtonHover: {
      background: 'linear-gradient(135deg, #8A5F35 0%, #A67745 100%)',
      transform: 'translateY(-1px)'
    },
    submitButtonDisabled: {
      opacity: '0.6',
      cursor: 'not-allowed'
    },
    spinner: {
      width: '14px',
      height: '14px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '50%',
      borderTopColor: 'white',
      animation: 'spin 1s ease-in-out infinite'
    },
    success: {
      textAlign: 'center',
      padding: '20px 0',
      color: '#9E6E3C'
    }
  };

  const animations = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  
  return (
    <div style={styles.wrapper} ref={feedbackRef}>
      <style>{animations}</style>

      <button
        style={styles.button}
        onClick={() => setShowFeedback(!showFeedback)}
        title="Share your feedback"
        onMouseEnter={(e) => Object.assign(e.target.style, styles.buttonHover)}
        onMouseLeave={(e) => {
          e.target.style.transform = '';
          e.target.style.boxShadow = styles.button.boxShadow;
          e.target.style.background = styles.button.background;
        }}
        onMouseDown={(e) => Object.assign(e.target.style, styles.buttonActive)}
        onMouseUp={(e) => Object.assign(e.target.style, styles.buttonHover)}
      >
        <MessageSquare size={16} />
        <span>Feedback</span>
      </button>

      {showFeedback && (
        <div style={styles.popup}>
          <div style={styles.header}>
            <h3 style={styles.headerTitle}>Share Your Feedback</h3>
            <button
              style={styles.closeButton}
              onClick={() => {
                setShowFeedback(false);
                setFeedbackSent(false);
                setError(null);
                setFeedbackRating(0);
              }}
              onMouseEnter={(e) => Object.assign(e.target.style, styles.closeButtonHover)}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '';
                e.target.style.color = styles.closeButton.color;
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={styles.content}>
            {feedbackSent ? (
              <div style={styles.success}>
                <p>Thank you for your feedback!</p>
                <p>We appreciate your input and will review it shortly.</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#624635', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
                    How would you rate your experience?
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {renderStars()}
                    <span style={{ fontSize: '0.75rem', color: '#AAA199', marginLeft: '8px' }}>
                      {feedbackRating > 0 ? `${feedbackRating} / 5` : 'Tap to rate'}
                    </span>
                  </div>
                </div>

                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="We'd love to hear your thoughts, suggestions, or any issues you've encountered..."
                  rows={4}
                  maxLength={500}
                  style={styles.textarea}
                  onFocus={(e) => Object.assign(e.target.style, styles.textareaFocus)}
                  onBlur={(e) => {
                    e.target.style.border = styles.textarea.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
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
                <div style={styles.actions}>
                  <span style={styles.charCount}>{feedbackMessage.length}/500</span>
                  <button
                    style={{
                      ...styles.submitButton,
                      ...(feedbackSending || !feedbackMessage.trim() ? styles.submitButtonDisabled : {})
                    }}
                    onClick={handleFeedbackSubmit}
                    disabled={!feedbackMessage.trim() || feedbackSending}
                    onMouseEnter={(e) => {
                      if (!feedbackSending && feedbackMessage.trim()) {
                        Object.assign(e.target.style, styles.submitButtonHover);
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = '';
                      e.target.style.background = styles.submitButton.background;
                    }}
                  >
                    {feedbackSending ? (
                      <>
                        <div style={styles.spinner}></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;