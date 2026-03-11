"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { SupplierFlowPipeline } from "./supplier-flow-pipeline";
import SupplierTabbedTables from "./supplier-tabbed-tables";
import styles from "./supplier.module.css";
import { X, ArrowRight } from 'lucide-react';

const onboardingSteps = [
  {
    title: "Welcome to Supplier Matching",
    content: "This page helps you discover and connect with reliable suppliers and service providers who can support your business operations.",
    icon: "🔧",
  },
  {
    title: "Supplier Pipeline",
    content: "Track your supplier sourcing and procurement process from initial inquiry to contract signing and ongoing partnerships.",
    icon: "📊",
  },
  {
    title: "Supplier Insights",
    content: "Get valuable analytics about supplier performance, service quality, and successful procurement patterns to optimize your sourcing.",
    icon: "📈",
  },
  {
    title: "Find Your Suppliers",
    content: "Use filters to discover suppliers based on service type, location, ratings, and specific business requirements.",
    icon: "🤝",
  },
];

// Consistent header styles with underline
const headerStyle = {
  fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
  color: '#3e2723',
  fontWeight: '600',
  margin: '0 0 20px 0',
  fontFamily: 'inherit',
  paddingBottom: '8px',
}

export default function SupplierMatchesPage() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [contactedSuppliers, setContactedSuppliers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [defaultActiveTab, setDefaultActiveTab] = useState("my-matches"); // Set default to my-matches

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const getUserSpecificKey = (baseKey) => {
    const userId = user?.uid || "guest";
    return `${baseKey}_${userId}`;
  };

  useEffect(() => {
    const fetchContactedSuppliers = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const q = query(
        collection(db, "supplierApplications"),
        where("supplierId", "==", currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const contacted = snapshot.docs.map(doc => doc.data().customerId);
      setContactedSuppliers(contacted);
    };

    fetchContactedSuppliers();
  }, []);

  // Check for popup display
  useEffect(() => {
    if (!authChecked) return;

    const storageKey = getUserSpecificKey("hasSeenSupplierPopup");
    const seenPopup = localStorage.getItem(storageKey) === "true";

    if (!seenPopup) {
      setShowWelcomePopup(true);
      localStorage.setItem(storageKey, "true");
    }
  }, [authChecked, user]);

  const closePopup = () => {
    setShowWelcomePopup(false);
    setCurrentOnboardingStep(0);
  };

  const handleNextStep = () => {
    if (currentOnboardingStep < onboardingSteps.length - 1) {
      setCurrentOnboardingStep(currentOnboardingStep + 1);
    } else {
      closePopup();
    }
  };

  const handleSupplierContacted = (supplierId) => {
    if (!contactedSuppliers.includes(supplierId)) {
      setContactedSuppliers(prev => [...prev, supplierId]);
    }
  };

  // Function to update the suppliers list from child component
  const handleSuppliersUpdate = (allSuppliersList, filteredSuppliersList) => {
    setAllSuppliers(allSuppliersList);
    setFilteredSuppliers(filteredSuppliersList);
  };

  if (!authChecked) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          maxWidth: '100vw',
          overflowX: 'hidden',
          margin: '0',
          boxSizing: 'border-box',
          position: 'relative',
          backgroundImage: "url('../../assets/BiGBackround.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
        className={styles.loadingContainer}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: '#666'
          }}
        >
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        maxWidth: '100vw',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundImage: "url('../../assets/BiGBackround.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
      className={styles.pageContainer}
    >
      {/* Global styles for consistent headers and animations */}
      <style>{`
        :global(.${styles.sectionCard} h1),
        :global(.${styles.sectionCard} h2),
        :global(.${styles.sectionCard} h3),
        :global(.${styles.sectionCard} h4),
        :global(.${styles.sectionCard} h5),
        :global(.${styles.sectionCard} h6) {
          font-size: clamp(1.2rem, 3vw, 1.5rem) !important;
          color: #3e2723 !important;
          font-weight: 600 !important;
          margin: 0 0 16px 0 !important;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes bounce {
          from { transform: translateY(0px); }
          to { transform: translateY(-5px); }
        }
        
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
          padding: 20px;
          box-sizing: border-box;
        }
        
        .popup-content {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 500px;
          position: relative;
          overflow: hidden;
          animation: slideUp 0.4s ease-out;
        }
        
        .close-button {
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          z-index: 10;
          transition: color 0.2s;
          padding: 5px;
        }
        
        .close-button:hover {
          color: #333;
        }
        
        .popup-inner {
          padding: clamp(20px, 5vw, 40px) clamp(15px, 4vw, 30px);
          text-align: center;
          background: linear-gradient(135deg, #efebe9 0%, #d7ccc8 100%);
        }
        
        .popup-icon {
          font-size: clamp(32px, 6vw, 48px);
          margin-bottom: 20px;
          animation: bounce 1s ease infinite alternate;
        }
        
        .progress-dots {
          display: flex;
          justify-content: center;
          margin: 30px 0;
          gap: 8px;
        }
        
        .progress-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #e0e0e0;
          transition: background-color 0.3s, transform 0.3s;
        }
        
        .progress-dot.active {
          background-color: #8d6e63;
          transform: scale(1.3);
        }
        
        .button-container {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: clamp(0.8rem, 2vw, 0.9rem);
          fontWeight: 500;
          transition: all 0.2s;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-width: 120px;
        }
        
        .btn-secondary {
          border: 2px solid #8d6e63;
          background: transparent;
          color: #8d6e63;
        }
        
        .btn-secondary:hover {
          background: #8d6e63;
          color: white;
        }
        
        .btn-primary {
          border: none;
          background: #8d6e63;
          color: white;
        }
        
        .btn-primary:hover {
          background: #6d4c41;
          transform: translateY(-1px);
        }

        @media (max-width: 480px) {
          .button-container {
            flex-direction: column;
          }
          
          .btn {
            flex: none;
            width: 100%;
          }
        }
      `}</style>

      {showWelcomePopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button className="close-button" onClick={closePopup}>
              <X size={24} />
            </button>
            <div className="popup-inner">
              <div className="popup-icon">
                {onboardingSteps[currentOnboardingStep].icon}
              </div>
              <h2 style={{
                ...headerStyle,
                marginBottom: '15px'
              }}>
                {onboardingSteps[currentOnboardingStep].title}
              </h2>
              <p style={{
                marginBottom: '15px',
                color: '#3e2723',
                lineHeight: '1.6',
                margin: '0 0 15px 0',
                fontSize: 'clamp(0.9rem, 2vw, 1rem)'
              }}>
                {onboardingSteps[currentOnboardingStep].content}
              </p>
              <div className="progress-dots">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`progress-dot ${index === currentOnboardingStep ? 'active' : ''}`}
                  />
                ))}
              </div>
              <div className="button-container">
                <button className="btn btn-secondary" onClick={closePopup}>
                  Skip
                </button>
                <button className="btn btn-primary" onClick={handleNextStep}>
                  {currentOnboardingStep < onboardingSteps.length - 1 ? "Next" : "Get Started"} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          padding: '0',
          margin: '0',
          boxSizing: 'border-box'
        }}
        className={styles.contentWrapper}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '100%',
            padding: '5px 20px 2px 20px',
            margin: '0 0 5px 0',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            boxSizing: 'border-box',
            backdropFilter: 'blur(10px)'
          }}
          className={`${styles.sectionCard} ${styles.pipelineSection} ${styles.pipelineCard}`}
        >
          <div
            style={{
              width: '100%',
              overflow: 'hidden'
            }}
            className={styles.sectionContent}
          >
            <h2 style={{ ...headerStyle, margin: '0 0 5px 0' }}>DealFlow Pipeline</h2>
            <SupplierFlowPipeline
              suppliers={allSuppliers}
              filteredSuppliers={filteredSuppliers}
              contactedSuppliers={contactedSuppliers}
            />
          </div>
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: '100%',
            padding: '20px',
            margin: '0 0 20px 0',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            boxSizing: 'border-box',
            backdropFilter: 'blur(10px)'
          }}
          className={`${styles.sectionCard} ${styles.tableSection} ${styles.tableCard}`}
        >
          <SupplierTabbedTables
            onSupplierContacted={handleSupplierContacted}
            onSuppliersUpdate={handleSuppliersUpdate}
            defaultActiveTab="my-matches" // Pass the default tab
          />
        </div>
      </div>
    </div>
  );
}