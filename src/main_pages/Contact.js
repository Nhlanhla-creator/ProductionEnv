import React, { useState } from 'react';
import { 
  FaPaperPlane, 
  FaCircle, 
  FaRegDotCircle, 
  FaCheck, 
  FaSpinner,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaWhatsapp,
  FaLinkedin,
  FaTwitter,
  FaInstagram,
  FaBuilding
} from 'react-icons/fa';
import { 
  FiMapPin, 
  FiMail, 
  FiPhone, 
  FiClock, 
  FiSend,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
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
      if (!formData.name.trim()) throw new Error('Name is required');
      if (!formData.email.trim()) throw new Error('Email is required');
      if (!formData.message.trim()) throw new Error('Message is required');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      const app = getApp();
      const functions = getFunctions(app);
      const submitContactForm = httpsCallable(functions, 'submitContactForm');
      
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
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      
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

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .contact-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(117, 74, 45, 0.2);
        }
        .contact-card .icon-wrap {
          transition: all 0.3s ease;
        }
        .contact-card:hover .icon-wrap {
          transform: scale(1.1) rotate(-5deg);
        }
        .social-icon:hover {
          transform: translateY(-3px);
          color: #754A2D;
        }
        input:hover, textarea:hover {
          border-color: #BCAE9C;
        }
        input:focus, textarea:focus {
          border-color: #754A2D;
          box-shadow: 0 0 0 4px rgba(117, 74, 45, 0.08);
        }
      `}</style>
      <Header />
      
      <div style={styles.content}>
        {/* Contact Info Cards - Top Section */}
        <div style={styles.contactInfoGrid}>
          <div style={styles.contactInfoCard} className="contact-card">
            <div style={styles.contactIconWrap} className="icon-wrap">
              <FaPhoneAlt size={24} color="#754A2D" />
            </div>
            <h4 style={styles.contactCardTitle}>Phone</h4>
            <p style={styles.contactCardText}>+27 87 265 4893</p>
            <p style={styles.contactCardSubtext}>Mon-Fri, 9am - 5pm</p>
          </div>

          <div style={styles.contactInfoCard} className="contact-card">
            <div style={styles.contactIconWrap} className="icon-wrap">
              <FaEnvelope size={24} color="#754A2D" />
            </div>
            <h4 style={styles.contactCardTitle}>Email</h4>
            <p style={styles.contactCardText}>hello@bigmarketplace.africa</p>
            <p style={styles.contactCardSubtext}>We reply within 24 hours</p>
          </div>

          <div style={styles.contactInfoCard} className="contact-card">
            <div style={styles.contactIconWrap} className="icon-wrap">
              <FaMapMarkerAlt size={24} color="#754A2D" />
            </div>
            <h4 style={styles.contactCardTitle}>Location</h4>
            <p style={styles.contactCardText}>2040 Broadacres Dr</p>
            <p style={styles.contactCardSubtext}>Fourways, Gauteng, South Africa</p>
          </div>
        </div>

        {/* Main Form Section */}
        <div style={styles.formContainer}>
          <div style={styles.decorativeShape1}></div>
          <div style={styles.decorativeShape2}></div>
          <div style={styles.dots}>
            <FaCircle />
            <FaRegDotCircle />
            <FaCircle />
          </div>
          
          <div style={styles.headerSection}>
            <div style={styles.headerIconWrap}>
              <FaPaperPlane size={28} color="#754A2D" />
            </div>
            <div>
              <h2 style={styles.title}>Let's Connect</h2>
              <p style={styles.subtitle}>We'd love to hear from you</p>
            </div>
          </div>

          <div style={styles.introMessage}>
            <span style={styles.introIcon}>💡</span>
            <div>
              At BIG Marketplace, your success is our priority. As your trusted partner, we are dedicated to helping your business grow, adapt, and thrive in an ever-changing landscape. Let's achieve greatness together.
            </div>
          </div>
          
          {error && (
            <div style={styles.errorMessage}>
              <FiAlertCircle size={20} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
          
          {isSubmitted ? (
            <div style={styles.successMessage}>
              <div style={styles.successIconWrap}>
                <FiCheckCircle size={48} color="#754A2D" />
              </div>
              <h3 style={styles.successTitle}>Message Sent! 🎉</h3>
              <p style={styles.successText}>{successMessage}</p>
              <div style={styles.emailNote}>
                <FaEnvelope size={16} color="#754A2D" />
                <span>We've sent a confirmation to <strong>{formData.email}</strong></span>
              </div>
              <div style={styles.emailNote}>
                <FiClock size={16} color="#754A2D" />
                <span>Our team will respond within 24 hours</span>
              </div>
              <button 
                style={styles.newMessageButton}
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#5A3420';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#372C27';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <FaPaperPlane size={16} />
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name *</label>
                  <input 
                    type="text" 
                    name="name"
                    placeholder="Enter your full name" 
                    style={styles.input} 
                    value={formData.name}
                    onChange={handleChange}
                    required 
                    disabled={isSending}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email Address *</label>
                  <input 
                    type="email" 
                    name="email"
                    placeholder="you@example.com" 
                    style={styles.input} 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                    disabled={isSending}
                  />
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Subject</label>
                <input 
                  type="text" 
                  name="subject"
                  placeholder="What is this regarding?" 
                  style={styles.input}
                  value={formData.subject}
                  onChange={handleChange}
                  disabled={isSending}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Message *</label>
                <textarea 
                  name="message"
                  placeholder="Tell us how we can help you..." 
                  rows="5" 
                  style={styles.textarea} 
                  value={formData.message}
                  onChange={handleChange}
                  required
                  disabled={isSending}
                />
              </div>
              
              <button 
                type="submit" 
                style={isSending ? { ...styles.submitButton, opacity: 0.7, cursor: 'not-allowed' } : styles.submitButton}
                disabled={isSending}
                onMouseEnter={(e) => !isSending && Object.assign(e.currentTarget.style, { 
                  backgroundColor: '#5A3420',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 25px rgba(117, 74, 45, 0.35)',
                })}
                onMouseLeave={(e) => {
                  if (!isSending) {
                    e.currentTarget.style.backgroundColor = '#754A2D';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(117, 74, 45, 0.25)';
                  }
                }}
              >
                {isSending ? (
                  <>
                    <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend size={18} />
                    Send Message
                  </>
                )}
              </button>
              
              <div style={styles.formFooter}>
                <span>* Required fields</span>
                <span>|</span>
                <span>We'll respond within 24 hours</span>
              </div>
            </form>
          )}
        </div>

        {/* Social & Business Hours Section */}
        <div style={styles.bottomSection}>
          <div style={styles.businessHours}>
            <div style={styles.businessHoursIcon}>
              <FiClock size={24} color="#754A2D" />
            </div>
            <div>
              <h4 style={styles.businessHoursTitle}>Business Hours</h4>
              <p style={styles.businessHoursText}>Monday - Friday: 9:00 AM - 5:00 PM</p>
              <p style={styles.businessHoursText}>Saturday - Sunday: Closed</p>
            </div>
          </div>

          <div style={styles.socialLinks}>
            <h4 style={styles.socialTitle}>Follow Us</h4>
            <div style={styles.socialIcons}>
              <a href="#" style={styles.socialIcon} className="social-icon">
                <FaWhatsapp size={22} />
              </a>
              <a href="#" style={styles.socialIcon} className="social-icon">
                <FaLinkedin size={22} />
              </a>
              <a href="#" style={styles.socialIcon} className="social-icon">
                <FaTwitter size={22} />
              </a>
              <a href="#" style={styles.socialIcon} className="social-icon">
                <FaInstagram size={22} />
              </a>
            </div>
          </div>

          <div style={styles.buildingInfo}>
            <FaBuilding size={20} color="#754A2D" />
            <span style={styles.buildingText}>BIG Marketplace • 2040 Broadacres Dr, Fourways</span>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundImage: 'linear-gradient(rgba(242, 240, 230, 0.92), rgba(242, 240, 230, 0.85)), url(/background10.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem 1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  
  // Contact Info Cards
  contactInfoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
    width: '100%',
    marginBottom: '2.5rem',
  },
  contactInfoCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '1.5rem',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(28,20,16,0.06)',
    border: '1px solid #EAE2D8',
    transition: 'all 0.3s ease',
    cursor: 'default',
  },
  contactIconWrap: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgba(117, 74, 45, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
    transition: 'all 0.3s ease',
  },
  contactCardTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#7A6A5E',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '4px',
  },
  contactCardText: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1C1410',
    marginBottom: '2px',
  },
  contactCardSubtext: {
    fontSize: '0.8rem',
    color: '#7A6A5E',
    margin: 0,
  },

  // Form Container
  formContainer: {
    maxWidth: '900px',
    width: '100%',
    marginBottom: '2.5rem',
    padding: '2.5rem 3rem',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: '24px',
    border: '1px solid #EAE2D8',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(28,20,16,0.08)',
    backdropFilter: 'blur(10px)',
  },
  decorativeShape1: {
    position: 'absolute',
    top: '-60px',
    right: '-60px',
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    border: '2px solid #754A2D',
    opacity: '0.05',
  },
  decorativeShape2: {
    position: 'absolute',
    bottom: '-40px',
    left: '-40px',
    width: '100px',
    height: '100px',
    border: '2px dashed #BCAE9C',
    transform: 'rotate(45deg)',
    opacity: '0.06',
  },
  dots: {
    position: 'absolute',
    right: '30px',
    top: '30px',
    color: '#9E6E3C',
    opacity: '0.06',
    fontSize: '1.8rem',
    display: 'flex',
    gap: '4px',
  },
  headerSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  headerIconWrap: {
    width: '60px',
    height: '60px',
    borderRadius: '16px',
    backgroundColor: 'rgba(117, 74, 45, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#1C1410',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#7A6A5E',
    margin: 0,
  },
  introMessage: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    backgroundColor: 'rgba(117, 74, 45, 0.04)',
    padding: '1.2rem 1.5rem',
    borderRadius: '12px',
    borderLeft: '4px solid #754A2D',
    marginBottom: '2rem',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: '#372C27',
  },
  introIcon: {
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  
  // Form Elements
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#372C27',
    marginBottom: '0.4rem',
  },
  input: {
    width: '100%',
    padding: '0.9rem 1.2rem',
    borderRadius: '12px',
    border: '2px solid #EAE2D8',
    backgroundColor: 'white',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    color: '#1C1410',
  },
  textarea: {
    width: '100%',
    padding: '0.9rem 1.2rem',
    borderRadius: '12px',
    border: '2px solid #EAE2D8',
    backgroundColor: 'white',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    minHeight: '150px',
    resize: 'vertical',
    color: '#1C1410',
  },
  submitButton: {
    width: '100%',
    padding: '1rem',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#754A2D',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.8rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(117, 74, 45, 0.25)',
    letterSpacing: '0.02em',
  },
  formFooter: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginTop: '1.2rem',
    fontSize: '0.8rem',
    color: '#7A6A5E',
  },
  
  // Error & Success
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: 'rgba(190, 59, 42, 0.08)',
    border: '1px solid #BE3B2A',
    borderRadius: '12px',
    padding: '1rem 1.5rem',
    marginBottom: '1.5rem',
    color: '#BE3B2A',
    fontSize: '0.95rem',
  },
  successMessage: {
    textAlign: 'center',
    padding: '2rem 1.5rem',
  },
  successIconWrap: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(117, 74, 45, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
  },
  successTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#1C1410',
    marginBottom: '0.5rem',
  },
  successText: {
    fontSize: '1rem',
    color: '#372C27',
    marginBottom: '1rem',
    lineHeight: '1.6',
  },
  emailNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    color: '#7A6A5E',
    marginBottom: '0.3rem',
  },
  newMessageButton: {
    marginTop: '1.5rem',
    padding: '0.8rem 2rem',
    backgroundColor: '#372C27',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s ease',
  },

  // Bottom Section
  bottomSection: {
    width: '100%',
    maxWidth: '900px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '1.5rem',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: '16px',
    padding: '1.5rem 2rem',
    border: '1px solid #EAE2D8',
    backdropFilter: 'blur(8px)',
  },
  businessHours: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  businessHoursIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: 'rgba(117, 74, 45, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  businessHoursTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#1C1410',
    margin: 0,
  },
  businessHoursText: {
    fontSize: '0.8rem',
    color: '#7A6A5E',
    margin: 0,
  },
  socialLinks: {
    textAlign: 'center',
  },
  socialTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#1C1410',
    marginBottom: '0.5rem',
  },
  socialIcons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
  },
  socialIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(117, 74, 45, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#372C27',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
  },
  buildingInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
  },
  buildingText: {
    fontSize: '0.85rem',
    color: '#7A6A5E',
  },
};

export default ContactFormPage;