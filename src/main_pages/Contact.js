import React, { useState } from 'react';
import { FaPaperPlane, FaCircle, FaRegDotCircle, FaCheck, FaSpinner } from 'react-icons/fa';
import Header from './Header'; 
import Footer from './Footer'; 
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

const ContactFormPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);
    
    try {
      // Validate input
      if (!formData.name.trim()) throw new Error('Name is required');
      if (!formData.email.trim()) throw new Error('Email is required');
      if (!formData.message.trim()) throw new Error('Message is required');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Get Firebase functions instance
      const app = getApp();
      const functions = getFunctions(app);
      
      // Call the Firebase Cloud Function
      const submitContactForm = httpsCallable(functions, 'submitContactForm');
      
      console.log('Sending form data:', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim()
      });

      const result = await submitContactForm({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim()
      });

      const { data } = result;
      
      if (data.success) {
        setIsSubmitted(true);
        setSuccessMessage(data.message || 'Message sent successfully! Check your email for confirmation.');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        
        console.log('Form submitted successfully:', data);
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      
      // Handle different types of errors
      if (err.code === 'functions/internal') {
        setError('Server error: ' + (err.message || 'Please try again.'));
      } else if (err.code === 'functions/unavailable') {
        setError('Network error. Please check your connection.');
      } else if (err.code === 'functions/not-found') {
        setError('Contact service is currently unavailable. Please email us directly at hello@bigmarketplace.africa');
      } else if (err.code === 'functions/permission-denied') {
        setError('Permission denied. Please refresh the page.');
      } else {
        setError(err.message || 'Failed to send message. Please try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  // ... (keep all your existing styles exactly as you had them)
  // Make sure you keep ALL the style objects from your original file

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <Header />
      
      <div style={styles.content}>
        <div style={styles.formContainer}>
          <div style={styles.decorativeShape1}></div>
          <div style={styles.decorativeShape2}></div>
          <div style={styles.dots}>
            <FaCircle />
            <FaRegDotCircle />
            <FaCircle />
          </div>
          
          <h2 style={styles.title}>
            <FaPaperPlane />
            Send Us a Message
          </h2>

          <div style={styles.introMessage}>
            At BIG Marketplace, your success is our priority. As your trusted partner, we are dedicated to helping your business grow, adapt, and thrive in an ever-changing landscape. Let's achieve greatness together. Get in touch with us today to start your journey toward sustainable success.
          </div>
          
          {error && (
            <div style={styles.errorMessage}>
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}
          
          {isSubmitted ? (
            <div style={styles.successMessage}>
              <FaCheck style={styles.successIcon} />
              <div style={styles.successText}>✅ Success!</div>
              <div>{successMessage}</div>
              <div style={styles.emailNote}>
                We've sent a confirmation to <strong>{formData.email}</strong><br />
                Our team will respond within 24 hours.
              </div>
              <button 
                style={{ 
                  ...styles.submitButton, 
                  marginTop: '1rem',
                  backgroundColor: '#372C27'
                }}
                onClick={() => {
                  setIsSubmitted(false);
                  setError(null);
                  setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    message: ''
                  });
                }}
                onMouseEnter={(e) => Object.assign(e.target.style, { 
                  backgroundColor: '#1a130e',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 5px 15px rgba(117, 74, 45, 0.3)',
                })}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#372C27';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <input 
                  type="text" 
                  name="name"
                  placeholder="Your Name *" 
                  style={styles.input} 
                  value={formData.name}
                  onChange={handleChange}
                  required 
                  disabled={isSending}
                />
              </div>
              
              <div style={styles.formGroup}>
                <input 
                  type="email" 
                  name="email"
                  placeholder="Your Email *" 
                  style={styles.input} 
                  value={formData.email}
                  onChange={handleChange}
                  required 
                  disabled={isSending}
                />
              </div>
              
              <div style={styles.formGroup}>
                <input 
                  type="text" 
                  name="subject"
                  placeholder="Subject (Optional)" 
                  style={styles.input}
                  value={formData.subject}
                  onChange={handleChange}
                  disabled={isSending}
                />
              </div>
              
              <div style={styles.formGroup}>
                <textarea 
                  name="message"
                  placeholder="Your Message *" 
                  rows="6" 
                  style={{...styles.input, minHeight: '180px'}} 
                  value={formData.message}
                  onChange={handleChange}
                  required
                  disabled={isSending}
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                style={isSending ? { ...styles.submitButton, backgroundColor: '#BCAE9C', cursor: 'not-allowed' } : styles.submitButton}
                disabled={isSending}
                onMouseEnter={(e) => !isSending && Object.assign(e.target.style, { 
                  backgroundColor: '#754A2D',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 5px 15px rgba(117, 74, 45, 0.3)',
                })}
                onMouseLeave={(e) => {
                  if (!isSending) {
                    e.target.style.backgroundColor = '#9E6E3C';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                {isSending ? (
                  <>
                    <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane /> Send Message
                  </>
                )}
              </button>
              
              <div style={{ textAlign: 'center', marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
                <p>* Required fields</p>
                <p>We'll send a confirmation to your email and respond within 24 hours</p>
              </div>
            </form>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

// Make sure you include ALL your style objects here
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundImage: 'linear-gradient(rgba(242, 240, 230, 0.38), rgba(242, 240, 230, 0.09)), url(/background10.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    fontFamily: "'Neue Haas Grotesk Text Pro', sans-serif",
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  formContainer: {
    maxWidth: '800px',
    width: '100%',
    margin: '2rem 0',
    padding: '3rem',
    backgroundColor: 'rgba(242, 240, 230, 0.85)',
    borderRadius: '20px',
    border: '2px dashed #9E6E3C',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(55, 44, 39, 0.15)',
    backdropFilter: 'blur(2px)',
  },
  decorativeShape1: {
    position: 'absolute',
    top: '-30px',
    right: '-30px',
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    border: '2px solid #754A2D',
    opacity: '0.3',
  },
  decorativeShape2: {
    position: 'absolute',
    bottom: '-20px',
    left: '-20px',
    width: '80px',
    height: '80px',
    border: '2px dashed #BCAE9C',
    transform: 'rotate(45deg)',
    opacity: '0.4',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '600',
    color: '#372C27',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    position: 'relative',
    zIndex: '1',
    textAlign: 'center',
  },
  introMessage: {
    color: '#372C27',
    fontSize: '1rem',
    lineHeight: '1.6',
    marginBottom: '2rem',
    textAlign: 'center',
    position: 'relative',
    zIndex: '1',
    backgroundColor: 'rgba(242, 240, 230, 0.7)',
    padding: '1.5rem',
    borderRadius: '12px',
    borderLeft: '4px solid #9E6E3C',
  },
  formGroup: {
    marginBottom: '1.8rem',
    position: 'relative',
    zIndex: '1',
  },
  input: {
    width: '100%',
    padding: '1.2rem',
    borderRadius: '12px',
    border: '2px solid #BCAE9C',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    fontFamily: "'Neue Haas Grotesk Text Pro', sans-serif",
    fontSize: '1rem',
    transition: 'all 0.3s ease',
  },
  submitButton: {
    width: '100%',
    padding: '1.2rem',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#9E6E3C',
    color: '#F2F0E6',
    fontSize: '1.1rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.8rem',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  dots: {
    position: 'absolute',
    right: '30px',
    top: '40px',
    color: '#9E6E3C',
    opacity: '0.1',
    fontSize: '1.5rem',
  },
  successMessage: {
    backgroundColor: 'rgba(158, 110, 60, 0.1)',
    border: '2px solid #9E6E3C',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '2rem',
    textAlign: 'center',
    color: '#372C27',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  errorMessage: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    border: '2px solid #e74c3c',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
    color: '#c0392b',
    fontSize: '0.95rem',
    lineHeight: '1.5',
  },
  successIcon: {
    color: '#9E6E3C',
    fontSize: '2.5rem',
  },
  successText: {
    fontSize: '1.2rem',
    fontWeight: '500',
  },
  emailNote: {
    fontSize: '0.9rem',
    fontStyle: 'italic',
    opacity: '0.8',
    marginTop: '1rem',
    textAlign: 'center',
  },
};

export default ContactFormPage;