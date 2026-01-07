// pages/EmailVerification.js
import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { sendEmailVerification, onAuthStateChanged, signOut } from 'firebase/auth';
import { Mail, CheckCircle, Loader2, LogOut, ArrowLeft, Home } from 'lucide-react';

export default function EmailVerification() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        // If no user, redirect to auth
        navigate('/auth');
        return;
      }
      
      // Reload user to get fresh emailVerified status
      await currentUser.reload();
      const refreshedUser = auth.currentUser;
      
      if (refreshedUser.emailVerified) {
        // If email is already verified, redirect to appropriate dashboard
        // You might want to fetch user roles here to determine where to go
        navigate('/dashboard'); // Default dashboard
      }
    });

    return unsubscribe;
  }, [navigate]);

  const resendVerification = async () => {
    if (!user) return;
    
    setSending(true);
    try {
      await sendEmailVerification(user);
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (error) {
      console.error('Error sending verification:', error);
      alert('Error sending verification email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const checkVerification = async () => {
    if (!user) return;
    
    setChecking(true);
    try {
      await user.reload();
      const updatedUser = auth.currentUser;
      
      if (updatedUser.emailVerified) {
        // Email verified - navigate to dashboard
        navigate('/dashboard');
      } else {
        alert('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      alert('Error checking verification status.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const goToHome = () => {
    navigate('/');
  };

  // Show loading while checking auth state
  if (user === null) {
    return (
      <div className="verification-page">
        <div className="verification-card">
          <div className="loading-state">
            <Loader2 className="animate-spin" size={48} />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // This shouldn't happen due to useEffect, but just in case
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="verification-page">
      <div className="verification-card">
        <div className="verification-header">
          <button 
            onClick={goToHome}
            className="home-button"
            title="Go to Home"
          >
            <Home size={20} />
          </button>
          
          <div className="verification-icon">
            <Mail size={48} />
          </div>
          <h2>Verify Your Email</h2>
          <p className="verification-subtitle">
            We've sent a verification email to:
          </p>
          <p className="user-email">{user.email}</p>
        </div>
        
        <div className="verification-instructions">
          <p>
            <strong>Important:</strong> Please check your inbox and click the verification link to activate your account.
            If you don't see the email, check your spam folder.
          </p>
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            You need to verify your email before you can access your dashboard.
          </p>
        </div>
        
        <div className="verification-actions">
          <button 
            onClick={checkVerification} 
            disabled={checking}
            className="check-button"
          >
            {checking ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Checking...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                I've Verified My Email
              </>
            )}
          </button>
          
          <button 
            onClick={resendVerification} 
            disabled={sending}
            className="resend-button"
          >
            {sending ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Sending...
              </>
            ) : (
              <>
                <Mail size={16} />
                Resend Verification Email
              </>
            )}
          </button>
          
          <div className="secondary-actions">
            <button 
              onClick={() => navigate('/auth')}
              className="back-button"
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>
            
            <button 
              onClick={handleLogout}
              className="logout-button"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
        
        {sent && (
          <div className="success-message">
            <CheckCircle size={16} />
            Verification email sent! Please check your inbox.
          </div>
        )}
        
        <div className="verification-tips">
          <h4>Didn't receive the email?</h4>
          <ul>
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Wait a few minutes and try again</li>
            <li>Add noreply@yourdomain.com to your contacts</li>
            <li>If still not working, contact support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}