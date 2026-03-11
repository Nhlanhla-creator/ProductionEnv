"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../../firebaseConfig"
import { AdvisorFlowPipeline } from "./advisor-flow-pipeline"
import { AdvisorTable } from "./advisor-table"
import { getDocs, collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import styles from "./advisor.module.css"
import AdvisorTabbedTables from "./advisor-tabbed-tables";
import { X, ArrowRight } from 'lucide-react'
import Upsell from "../../components/Upsell/Upsell" // Import the Upsell component
import useSubscriptionPlan from "../../hooks/useSubscriptionPlan" // Import the subscription hook

const onboardingSteps = [
  {
    title: "Welcome to Advisor Matching",
    content: "This page helps you discover and connect with experienced advisors who can guide your startup journey.",
    icon: "🎓",
  },
  {
    title: "Advisor Pipeline",
    content: "Track your advisor outreach and relationship building from initial contact to formal advisory agreements.",
    icon: "📊",
  },
  {
    title: "Advisor Insights",
    content: "Get valuable analytics about advisor engagement, industry expertise, and successful mentorship patterns.",
    icon: "📈",
  },
  {
    title: "Find Your Mentor",
    content: "Use filters to discover advisors based on industry experience, expertise areas, and availability.",
    icon: "🤝",
  },
]

// Consistent header styles with underline
const headerStyle = {
  fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
  color: '#3e2723', // Dark brown
  fontWeight: '600',
  margin: '0 0 20px 0',
  fontFamily: 'inherit',
  paddingBottom: '8px',
}

export default function SupportProgramsPage() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0)
  const [primaryMatchCount, setPrimaryMatchCount] = useState(0)
  const [stageCounts, setStageCounts] = useState({
    application: 0,
    review: 0,
    approved: 0,
    feedback: 0,
    termIssued: 0,
    dealClosed: 0,
    withdrawn: 0,
  })
  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState([])
  const [successfulDeals, setSuccessfulDeals] = useState([])
  
  // Use subscription hook
  const { currentPlan, subscriptionLoading } = useSubscriptionPlan()
  const navigate = useNavigate()

  // Initialize filters state
  const [filters, setFilters] = useState({})

  const statusToStageId = {
    "Contacted": "application",
    "Pending": "review",
    "Confirmed": "approved",
    "Approved": "approved",
    "Feedback": "feedback",
    "TermIssued": "termIssued",
    "Term Issued": "termIssued",
    "DealClosed": "dealClosed",
    "Deal Closed": "dealClosed",
    "Deal Successful": "dealClosed",
    "Withdrawn": "withdrawn",
    "Declined": "withdrawn",
    "Deal Declined": "withdrawn"
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthChecked(true)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchStageCounts = async () => {
      if (!user) return

      try {
        const snapshot = await getDocs(
          query(
            collection(db, "SmeAdvisorApplications"),
            where("smeId", "==", user.uid)
          )
        )

        const counts = {
          application: 0,
          review: 0,
          approved: 0,
          feedback: 0,
          termIssued: 0,
          dealClosed: 0,
          withdrawn: 0,
        }

        snapshot.forEach((doc) => {
          const data = doc.data()
          const status = data.status
          const stageId = statusToStageId[status]

          if (stageId && counts.hasOwnProperty(stageId)) {
            counts[stageId]++
          }
        })

        setStageCounts(counts)
      } catch (error) {
        console.error("Error fetching stage counts:", error)
      }
    }

    if (user) {
      fetchStageCounts()
    }
  }, [user])

  useEffect(() => {
    if (!user?.uid) {
      setApplications([])
      setSuccessfulDeals([])
      setLoading(false)
      return
    }

    setLoading(true)

    // Query for ALL advisor applications
    const applicationsQuery = query(
      collection(db, "SmeAdvisorApplications"),
      where("smeId", "==", user.uid)
    )

    // Query for SUCCESSFUL DEALS (Deal Successful status)
    const successfulDealsQuery = query(
      collection(db, "SmeAdvisorApplications"),
      where("smeId", "==", user.uid),
      where("status", "in", ["Deal Successful", "DealClosed", "Completed"])
    )

    const unsubscribeApplications = onSnapshot(
      applicationsQuery,
      (querySnapshot) => {
        const apps = querySnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : null
          }
        })
        setApplications(apps)
      },
      (err) => {
        console.error("Error listening to advisor applications:", err)
      }
    )

    const unsubscribeSuccessfulDeals = onSnapshot(
      successfulDealsQuery,
      (querySnapshot) => {
        const deals = querySnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : null,
            // Add deal-specific properties
            dealAmount: data.dealAmount || "Not specified",
            dealType: data.dealType || "Advisory Contract",
            completionDate: data.completionDate || data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            sector: data.advisorSector || "Not specified",
            location: data.advisorLocation || "Not specified",
            dealDuration: data.dealDuration || "12 months",
            currentStatus: data.status,
            contractValue: data.contractValue || data.dealAmount || "Not specified",
            serviceDelivered: data.serviceDescription || "Advisory Services",
            performanceRating: data.performanceRating || "4.5/5"
          }
        })
        setSuccessfulDeals(deals)
        setLoading(false)
      },
      (err) => {
        console.error("Error listening to successful advisor deals:", err)
        setLoading(false)
      }
    )

    return () => {
      unsubscribeApplications()
      unsubscribeSuccessfulDeals()
    }
  }, [user])

  const getUserSpecificKey = (baseKey) => {
    const userId = user?.uid || "guest"
    return `${baseKey}_${userId}`
  }

  // Check for popup display
  useEffect(() => {
    if (!authChecked) return

    const storageKey = getUserSpecificKey("hasSeenAdvisorPopup")
    const seenPopup = localStorage.getItem(storageKey) === "true"

    if (!seenPopup) {
      setShowWelcomePopup(true)
      localStorage.setItem(storageKey, "true")
    }
  }, [authChecked, user])

  const closePopup = () => {
    setShowWelcomePopup(false)
    setCurrentOnboardingStep(0)
  }

  const handleNextStep = () => {
    if (currentOnboardingStep < onboardingSteps.length - 1) {
      setCurrentOnboardingStep(currentOnboardingStep + 1)
    } else {
      closePopup()
    }
  }

  // Handle connection requested callback
  const handleConnectionUpdate = () => {
    // Refresh stage counts when a new connection is made
    if (user) {
      const fetchUpdatedCounts = async () => {
        try {
          const snapshot = await getDocs(
            query(
              collection(db, "SmeAdvisorApplications"),
              where("smeId", "==", user.uid)
            )
          )

          const counts = {
            application: 0,
            review: 0,
            approved: 0,
            feedback: 0,
            termIssued: 0,
            dealClosed: 0,
            withdrawn: 0,
          }

          snapshot.forEach((doc) => {
            const data = doc.data()
            const status = data.status
            const stageId = statusToStageId[status]

            if (stageId && counts.hasOwnProperty(stageId)) {
              counts[stageId]++
            }
          })

          setStageCounts(counts)
        } catch (error) {
          console.error("Error updating stage counts:", error)
        }
      }

      fetchUpdatedCounts()
    }
  }

  // Responsive container styles
  const getContainerStyles = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
    backgroundColor: "#f8f9fa",
  })

  // Combined loading check
  if (!authChecked || subscriptionLoading) {
    return (
      <div style={getContainerStyles()}>
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
          <p>{subscriptionLoading ? "Checking subscription..." : "Loading..."}</p>
        </div>
      </div>
    )
  }

  // Show Upsell for Basic plan users
  if (currentPlan === "basic") {
    return (
      <Upsell
        userType={"sme"}
        title={"Advisor Matching"}
        subtitle={"Discover and connect with experienced advisors who can guide your startup journey and provide mentorship."}
        features={[
          "Access to verified advisor database",
          "Advisor expertise and industry analytics",
          "Direct communication with mentors",
          "Deal flow pipeline tracking",
          "Advanced filtering by industry and experience"
        ]}
        variant={"center"}
        expandedWidth={280}
        collapsedWidth={80}
        plans={["Standard", "Premium"]}
        upgradeMessage={"Upgrade to Standard or Premium to access advisor matching features including direct mentor communication and expertise analytics."}
        primaryLabel={"View Available Plans"}
        onPrimary={() => navigate("/billing/subscriptions")}
      />
    )
  }

  // For Standard and Premium plans, show the regular advisor matches page
  return (
    <div style={getContainerStyles()} className={styles.pageContainer}>
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
          font-weight: 500;
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
        {/* Pipeline section with compact styling */}
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
            <AdvisorFlowPipeline
              primaryMatchCount={primaryMatchCount}
              stageCounts={stageCounts}
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
          <AdvisorTabbedTables
            onCountChange={setPrimaryMatchCount}
            onConnectionRequested={handleConnectionUpdate}
            loading={false}
            applications={applications}
            successfulDeals={successfulDeals}
          />
        </div>
      </div>
    </div>
  )
}