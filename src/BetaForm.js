import React, { useState } from 'react';
import {
  User,
  Mail,
  Briefcase,
  Building,
  Link,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { db, doc, setDoc } from './firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import emailjs from 'emailjs-com';

const roleOptions = [
  { value: '', label: 'Select your role...' },
  { value: 'SME', label: 'SME' },
  { value: 'Investor', label: 'Investor' },
  { value: 'Corporate Support Partner', label: 'Corporate Support Partner' },
  { value: 'Accelerator / Incubator', label: 'Accelerator / Incubator' }
];
const SERVICE_ID = 'service_qq3gamc';
const TEMPLATE_ID = 'template_i839czs';
const USER_ID = 'ErJSJm0e4qKwyNzIE';

const BetaSignupForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: '',
    businessName: '',
    businessWebsite: '',
    goal: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (submitStatus) setSubmitStatus(null);
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Enter a valid email';
    if (!formData.role) newErrors.role = 'Select your role';
    if (!formData.goal.trim()) newErrors.goal = 'Describe your goal';
    else if (formData.goal.trim().length < 10) newErrors.goal = 'Goal must be at least 10 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkEmailExists = async (email) => {
    try {
      const q = query(collection(db, 'betaSignups'), where('email', '==', email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Email check error:', error);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      if (await checkEmailExists(formData.email)) {
        setSubmitStatus('duplicate');
        return;
      }

      const signupId = `beta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const betaSignupData = {
        ...formData,
        email: formData.email.trim().toLowerCase(),
        fullName: formData.fullName.trim(),
        businessName: formData.businessName.trim() || null,
        businessWebsite: formData.businessWebsite.trim() || null,
        goal: formData.goal.trim(),
        submittedAt: new Date().toISOString(),
        status: 'pending',
        id: signupId
      };

      // Save to Firestore
      await setDoc(doc(db, 'betaSignups', signupId), betaSignupData);

      // Send auto-reply via EmailJS
      try {
        const response = await emailjs.send(
          SERVICE_ID,
          TEMPLATE_ID,
          {
            to_name: formData.fullName,
            to_email: formData.email,
            message: `Thank you for signing up for our beta program, ${formData.fullName}! We'll be in touch soon.`,
          },
          USER_ID
        );
        console.log('Email sent successfully:', response);
      } catch (emailError) {
        console.error('EmailJS failed:', emailError);
      }

      // Update UI state
      setSubmitStatus('success');
      setShowPopup(true);
      setFormData({ fullName: '', email: '', role: '', businessName: '', businessWebsite: '', goal: '' });
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Styles
  const styles = {
    // Base page styles
    page: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '2rem',
      backgroundColor: '#fefae0',
      boxSizing: 'border-box'
    },
    
    // Container styles
    container: {
      width: '100%',
      maxWidth: '700px',
      background: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #ffebcd',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },
    
    // Header styles
    header: {
      background: 'linear-gradient(135deg, #5d4037, #3e2723)',
      color: '#f3e5dc',
      padding: '2rem',
      textAlign: 'center',
      borderTopLeftRadius: '16px',
      borderTopRightRadius: '16px'
    },
    
    // Form styles
    form: {
      padding: '2rem'
    },
    
    // Footer styles
    footer: {
      textAlign: 'center',
      padding: '1rem 2rem 2rem',
      fontSize: '0.9rem',
      color: '#8d6e63'
    },
    
    // Form group styles
    formGroup: {
      marginBottom: '1.5rem'
    },
    
    label: {
      fontWeight: '600',
      display: 'block',
      marginBottom: '0.5rem',
      color: '#5d4037',
      paddingLeft: '0.5rem'
    },
    
    optional: {
      fontWeight: 'normal',
      color: '#999',
      fontSize: '0.9em'
    },
    
    // Input wrapper styles
    inputWrapper: {
      position: 'relative'
    },
    
    // Input icon styles
    inputIcon: {
      position: 'absolute',
      left: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#8d6e63',
      width: '18px',
      height: '18px',
      pointerEvents: 'none',
      transition: 'all 0.3s ease'
    },
    
    // Base input styles
    input: {
      width: '100%',
      padding: '0.75rem 1rem 0.75rem 2.8rem',
      marginLeft: '35px',
      border: '2px solid #e8d8cf',
      borderRadius: '8px',
      backgroundColor: '#f8f5f2',
      fontSize: '1rem',
      color: '#3e2723',
      outline: 'none',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box'
    },
    
    // Textarea styles
    textarea: {
      width: '100%',
      padding: '0.75rem 1rem 0.75rem 2.8rem',
      border: '2px solid #e8d8cf',
      borderRadius: '8px',
      backgroundColor: '#f8f5f2',
      fontSize: '1rem',
      color: '#3e2723',
      outline: 'none',
      minHeight: '120px',
      resize: 'vertical',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box'
    },
    
    // Textarea icon styles
    textareaIcon: {
      position: 'absolute',
      left: '8px',
      top: '16px',
      color: '#8d6e63',
      width: '18px',
      height: '18px',
      pointerEvents: 'none',
      transition: 'all 0.3s ease'
    },
    
    // Focus styles
    focus: {
      borderColor: '#a1887f',
      boxShadow: '0 0 0 3px rgba(161, 136, 127, 0.1)'
    },
    
    // Error text styles
    errorText: {
      color: '#dc2626',
      marginTop: '0.25rem',
      fontSize: '0.875rem',
      paddingLeft: '0.5rem'
    },
    
    // Submit button styles
    submitButton: {
      width: '100%',
      padding: '1rem',
      background: 'linear-gradient(to right, #8d6e63, #6d4c41)',
      color: 'white',
      fontSize: '1rem',
      fontWeight: 'bold',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'transform 0.2s ease, opacity 0.2s ease'
    },
    
    submitButtonHover: {
      transform: 'scale(1.03)'
    },
    
    submitButtonDisabled: {
      opacity: '0.6',
      cursor: 'not-allowed',
      transform: 'none'
    },
    
    // Alert styles
    alert: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '1rem',
      borderRadius: '8px',
      fontSize: '0.95rem',
      marginTop: '1rem'
    },
    
    alertSuccess: {
      backgroundColor: '#e6ffed',
      color: '#256029'
    },
    
    alertWarning: {
      backgroundColor: '#fff8e1',
      color: '#b26a00'
    },
    
    alertError: {
      backgroundColor: '#fdecea',
      color: '#b91c1c'
    },
    
    // Popup overlay styles
    popupOverlay: {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '1000',
      padding: '1rem'
    },
    
    // Popup styles
    popup: {
      background: '#fff',
      padding: '2rem',
      borderRadius: '12px',
      maxWidth: '500px',
      width: '100%',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
      textAlign: 'center',
      color: '#3e2723',
      margin: '1rem'
    },
    
    // Popup close button styles
    popupCloseButton: {
      marginTop: '1.5rem',
      padding: '0.75rem 1.5rem',
      backgroundColor: '#6d4c41',
      color: 'white',
      fontWeight: 'bold',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    
    popupCloseButtonHover: {
      backgroundColor: '#5d4037',
      transform: 'translateY(-1px)'
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1>Join Our Beta</h1>
          <p>Be part of something extraordinary</p>
          <p>Glad you're interested in the beta! To get you set up with the right access and support, please send me the following:</p>
        </div>

        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name *</label>
            <div style={styles.inputWrapper}>
              <User style={styles.inputIcon} />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Full Name"
                style={{
                  ...styles.input,
                  ...(errors.fullName ? { borderColor: '#dc2626' } : {})
                }}
              />
            </div>
            {errors.fullName && <p style={styles.errorText}>{errors.fullName}</p>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address *</label>
            <div style={styles.inputWrapper}>
              <Mail style={styles.inputIcon} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email Address"
                style={{
                  ...styles.input,
                  ...(errors.email ? { borderColor: '#dc2626' } : {})
                }}
              />
            </div>
            {errors.email && <p style={styles.errorText}>{errors.email}</p>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Role / Category *</label>
            <div style={styles.inputWrapper}>
              <Briefcase style={styles.inputIcon} />
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleInputChange}
                style={{
                  ...styles.input,
                  ...(errors.role ? { borderColor: '#dc2626' } : {})
                }}
              >
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            {errors.role && <p style={styles.errorText}>{errors.role}</p>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Business Name *</label>
            <div style={styles.inputWrapper}>
              <Building style={styles.inputIcon} />
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Business Name"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Business Website or LinkedIn <span style={styles.optional}>(optional)</span></label>
            <div style={styles.inputWrapper}>
              <Link style={styles.inputIcon} />
              <input
                type="text"
                name="businessWebsite"
                value={formData.businessWebsite}
                onChange={handleInputChange}
                placeholder="Business Website or LinkedIn"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Main Goal or Challenge *</label>
            <div style={styles.inputWrapper}>
              <MessageSquare style={styles.textareaIcon} />
              <textarea
                name="goal"
                value={formData.goal}
                onChange={handleInputChange}
                rows={4}
                placeholder="Main Goal or Challenge"
                style={{
                  ...styles.textarea,
                  ...(errors.goal ? { borderColor: '#dc2626' } : {})
                }}
              />
            </div>
            {errors.goal && <p style={styles.errorText}>{errors.goal}</p>}
          </div>

          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            style={{
              ...styles.submitButton,
              ...(isSubmitting ? styles.submitButtonDisabled : {}),
              ':hover': !isSubmitting ? styles.submitButtonHover : {}
            }}
          >
            {isSubmitting ? 'Checking & Submitting...' : 'Join Beta Program'}
          </button>

          {submitStatus === 'success' && (
            <div style={{ ...styles.alert, ...styles.alertSuccess }}>
              <CheckCircle />
              <span>Thank you! Your beta application has been submitted successfully.</span>
            </div>
          )}

          {submitStatus === 'duplicate' && (
            <div style={{ ...styles.alert, ...styles.alertWarning }}>
              <AlertCircle />
              <span>This email address is already registered for the beta program.</span>
            </div>
          )}

          {submitStatus === 'error' && (
            <div style={{ ...styles.alert, ...styles.alertError }}>
              <AlertCircle />
              <span>Oops! Something went wrong. Please try again.</span>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <p>We'll review your application and get back to you within 48 hours.</p>
        </div>

        {showPopup && <SuccessPopup onClose={() => setShowPopup(false)} styles={styles} />}
      </div>
    </div>
  );
};

const SuccessPopup = ({ onClose, styles }) => (
  <div style={styles.popupOverlay}>
    <div style={styles.popup}>
      <h2>You're In 🎉</h2>
      <p>
        I'll get you early access and a tailored walkthrough based on your role.<br />
        If there's anything specific you want the platform to help you with, just say the word — we want this to be as valuable as possible.
      </p>
      <p>
        Expect your invite and next steps within 2 days. Looking forward to having you on board!
      </p>
      <button 
        onClick={onClose} 
        style={styles.popupCloseButton}
      >
        Close
      </button>
    </div>
  </div>
);

export default BetaSignupForm;