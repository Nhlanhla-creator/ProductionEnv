import React, { useState, useEffect } from 'react';
import { InlineWidget } from 'react-calendly';
import { auth, db } from "../../src/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const BookSession = () => {
  const [showCalendly, setShowCalendly] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Get user email from Firestore
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Try to get email from users collection
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserEmail(userData.email || currentUser.email || '');
          } else {
            // Fallback to auth email
            setUserEmail(currentUser.email || '');
          }
        }
      } catch (error) {
        console.error("Error fetching user email:", error);
        // Fallback to auth email if available
        if (auth.currentUser?.email) {
          setUserEmail(auth.currentUser.email);
        }
      }
    };

    getUserEmail();
  }, []);

  return (
    <div style={styles.container}>
      <button 
        style={styles.bookButton}
        onClick={() => setShowCalendly(true)}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = '0 4px 12px rgba(184, 139, 88, 0.3)';
          e.target.style.background = 'linear-gradient(135deg, #A67C4A 0%, #C29563 100%)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 2px 8px rgba(184, 139, 88, 0.2)';
          e.target.style.background = 'linear-gradient(135deg, #B88B58 0%, #D4A574 100%)';
        }}
        onMouseDown={(e) => {
          e.target.style.transform = 'translateY(0)';
        }}
      >
        Book Session
      </button>
      
      {showCalendly && (
        <>
          <div style={styles.overlay} onClick={() => setShowCalendly(false)} />
          
          <div style={styles.calendlyContainer}>
            <div style={styles.calendlyHeader}>
              <h3 style={styles.headerText}>Book Your Session</h3>
              <button 
                style={styles.closeButton}
                onClick={() => setShowCalendly(false)}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#e9ecef';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                ×
              </button>
            </div>
            
            <div style={styles.calendlyWrapper}>
              <InlineWidget 
                url="https://calendly.com/lerato-bigmarketplace/big-marketplace-session"
                styles={{
                  height: '100%',
                  width: '100%'
                }}
                prefill={{
                  email: userEmail,
                  name: '' // You can add name if available
                }}
                pageSettings={{
                  backgroundColor: 'ffffff',
                  hideEventTypeDetails: false,
                  hideGdprBanner: true,
                  primaryColor: '8B4513',
                  textColor: '1d1d1f'
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    display: 'inline-block',
  },
  bookButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #B88B58 0%, #D4A574 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(184, 139, 88, 0.2)',
    whiteSpace: 'nowrap'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  calendlyContainer: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '800px',
    height: '80%',
    backgroundColor: 'white',
    borderRadius: '12px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  calendlyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  headerText: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#666',
    transition: 'background-color 0.2s',
  },
  calendlyWrapper: {
    flex: 1,
  },
};

export default BookSession;