"use client"
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import RequestOverview from "./RequestOverview";
import MatchingPreferences from "./MatchingPreferences";
import "./ProductApplication.css";

const ProductApplicationFlow = () => {
    const [currentStep, setCurrentStep] = useState('request-overview');
    const [applicationData, setApplicationData] = useState({
        requestOverview: {},
        matchingPreferences: {}
    });
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const loadDraft = async () => {
            const user = getAuth().currentUser;
            if (!user) {
                navigate('/login');
                return;
            }

            try {
                // Try to load saved application from Firestore
                const userDoc = await getDoc(doc(db, "productApplications", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setApplicationData({
                        requestOverview: data.requestOverview || {},
                        matchingPreferences: data.matchingPreferences || {}
                    });
                }

                // Also check localStorage for recent draft
                const localDraft = localStorage.getItem('applicationDraft');
                if (localDraft) {
                    const draftData = JSON.parse(localDraft);
                    setApplicationData(prev => ({
                        ...prev,
                        requestOverview: { ...prev.requestOverview, ...draftData }
                    }));
                }

                // Check if we're coming from a specific step
                if (location.state?.step) {
                    setCurrentStep(location.state.step);
                }
            } catch (error) {
                console.error("Error loading draft:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDraft();
    }, [navigate, location.state]);

    const updateApplicationData = (section, data) => {
        setApplicationData(prev => ({
            ...prev,
            [section]: { ...prev[section], ...data }
        }));
    };

    const handleSaveDraft = async () => {
        try {
            const user = getAuth().currentUser;
            if (!user) return;

            // Save to Firestore as draft
            await setDoc(doc(db, "productApplications", user.uid), {
                ...applicationData,
                updatedAt: new Date().toISOString(),
                status: "draft",
                userId: user.uid
            }, { merge: true });

            console.log("Draft saved successfully");
        } catch (error) {
            console.error("Error saving draft:", error);
        }
    };

    const handleStepComplete = () => {
        if (currentStep === 'request-overview') {
            setCurrentStep('matching-preferences');
            handleSaveDraft();
        }
    };

    const handleSubmit = async () => {
        try {
            const user = getAuth().currentUser;
            if (!user) {
                console.error("No user logged in");
                return;
            }

            const applicationData = {
                ...formData,
                matchingPreferences: formData,
                updatedAt: serverTimestamp(),
                applicationType: "product",
                status: "submitted"
            };

            await setDoc(doc(db, "productApplications", user.uid), applicationData, { merge: true });

            console.log("Application saved successfully");

            // MODIFIED: Handle embedded mode
            if (embedded && onNavigateToMatches) {
                // Stay in tabbed interface, switch to matches tab
                onNavigateToMatches();
            } else {
                // Original navigation
                navigate('/supplier/matches', {
                    state: {
                        newApplicationSubmitted: true,
                        applicationId: user.uid
                    }
                });
            }

        } catch (error) {
            console.error("Error saving application:", error);
        }
    };

    if (isLoading) {
        return <div className="loading-container">Loading application...</div>;
    }

    return (
        <div className="product-application-flow">
            {/* Progress indicator */}
            <div className="progress-indicator">
                <div className="progress-steps">
                    {['request-overview', 'matching-preferences'].map((step, index) => (
                        <div key={step} className={`step ${currentStep === step ? 'active' : ''}`}>
                            <div className="step-number">
                                {index + 1}
                            </div>
                            <div className="step-label">
                                {step === 'request-overview' ? 'Request Details' : 'Preferences'}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="progress-line"></div>
            </div>

            {/* Step content */}
            <div className="step-content">
                {currentStep === 'request-overview' && (
                    <RequestOverview
                        data={applicationData.requestOverview}
                        updateData={(data) => updateApplicationData('requestOverview', data)}
                        onSaveAndContinue={handleStepComplete}
                    />
                )}

                {currentStep === 'matching-preferences' && (
                    <MatchingPreferences
                        data={applicationData.matchingPreferences}
                        updateData={(data) => updateApplicationData('matchingPreferences', data)}
                        onSubmit={() => {
                            // Final submission will be handled by MatchingPreferences component
                            handleSaveDraft();
                        }}
                    />
                )}
            </div>

            {/* Navigation buttons */}
            <div className="navigation-buttons">
                {currentStep === 'matching-preferences' && (
                    <button
                        type="button"
                        onClick={() => setCurrentStep('request-overview')}
                        className="btn btn-secondary"
                    >
                        ← Back to Request Details
                    </button>
                )}

                <div style={{ flex: 1 }}></div>

                <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="btn btn-outline"
                >
                    Save Draft
                </button>

                {/* MODIFIED: Cancel button for embedded mode */}
                <button
                    type="button"
                    onClick={() => {
                        if (embedded && onNavigateToMatches) {
                            onNavigateToMatches(); // Switch back to matches tab
                        } else {
                            navigate('/supplier/matches'); // Original navigation
                        }
                    }}
                    className="btn btn-secondary"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

// Add these styles to your ProductApplication.css or create inline styles
const styles = `
.product-application-flow {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.progress-indicator {
  position: relative;
  margin-bottom: 3rem;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
  position: relative;
  z-index: 2;
}

.step {
  position: relative;
  z-index: 2;
  text-align: center;
}

.step-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #F5EBE0;
  border: 2px solid #E8D5C4;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8D6E63;
  font-weight: bold;
  margin: 0 auto 0.5rem;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background: #5D2A0A;
  border-color: #5D2A0A;
  color: white;
}

.step-label {
  font-size: 0.875rem;
  color: #8D6E63;
  font-weight: 500;
}

.step.active .step-label {
  color: #5D2A0A;
  font-weight: 600;
}

.progress-line {
  position: absolute;
  top: 18px;
  left: 0;
  right: 0;
  height: 2px;
  background: #E8D5C4;
  z-index: 1;
}

.step-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid #E8D5C4;
  box-shadow: 0 4px 6px rgba(93, 42, 10, 0.05);
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #E8D5C4;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.btn-secondary {
  background: #F5EBE0;
  color: #5D2A0A;
  border: 1px solid #E8D5C4;
}

.btn-secondary:hover {
  background: #E8D5C4;
}

.btn-outline {
  background: transparent;
  color: #5D2A0A;
  border: 1px solid #5D2A0A;
}

.btn-outline:hover {
  background: #5D2A0A;
  color: white;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  color: #5D2A0A;
  font-size: 1.125rem;
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

export default ProductApplicationFlow;