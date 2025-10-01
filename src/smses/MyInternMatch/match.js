"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../../firebaseConfig"
import { InternDealflowPage } from "./intern-deal-flow-pipeline.js"
import InternTabbedTables from "./intern-tabbed-tables"
import styles from "./intern.module.css"

const onboardingSteps = [
  {
    title: "Welcome to Intern Matching",
    content: "This page helps you discover and connect with potential interns who align with your team's needs.",
    icon: "🎯",
  },
  {
    title: "Deal Flow Pipeline",
    content: "Track your intern recruitment process from initial applications to interviews and onboarding.",
    icon: "📊",
  },
  {
    title: "Intern Insights",
    content: "Get valuable analytics about intern engagement, application success rates, and preferred skill sets.",
    icon: "📈",
  },
  {
    title: "Find Your Interns",
    content:
      "Use filters to discover promising candidates based on skills, availability, location, and learning goals.",
    icon: "🤝",
  },
]

// Consistent header styles with underline
const headerStyle = {
  fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
  color: "#3e2723", // Dark brown
  fontWeight: "600",
  margin: "0 0 20px 0",
  fontFamily: "inherit",
  paddingBottom: "8px",
}

export default function InternMatchesPage() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [profileMatchesCount,setProfileMatchesCount] = useState(0)
  const [activeTab, setActiveTab] = useState("my-matches")

  // Initialize filters and stage filter state
  const [filters, setFilters] = useState({})
  const [stageFilter, setStageFilter] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthChecked(true)
    })
    return () => unsubscribe()
  }, [])

  // Add sidebar detection
  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    // Check initial state
    checkSidebarState()

    // Watch for changes
    const observer = new MutationObserver(checkSidebarState)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const getUserSpecificKey = (baseKey) => {
    const userId = user?.uid || "guest"
    return `${baseKey}_${userId}`
  }

  // Check for popup display
  useEffect(() => {
    if (!authChecked) return

    const storageKey = getUserSpecificKey("hasSeenInternPopup")
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

  const handleDealComplete = () => {
    setActiveTab("successful-deals")
  }

  // Responsive container styles
  const getContainerStyles = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    padding: `80px 10px 20px ${isSidebarCollapsed ? "100px" : "250px"}`,
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
    backgroundImage: "url('../../assets/BiGBackround.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
  })

  if (!authChecked) {
    return (
      <div style={getContainerStyles()} className={styles.loadingContainer}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "200px",
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "#666",
          }}
        >
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={getContainerStyles()} className={styles.pageContainer}>
      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          padding: "0",
          margin: "0",
          boxSizing: "border-box",
        }}
        className={styles.contentWrapper}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "100%",
            padding: "5px 20px 2px 20px",
            margin: "0 0 5px 0",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            boxSizing: "border-box",
            backdropFilter: "blur(10px)",
          }}
          className={`${styles.sectionCard} ${styles.pipelineSection} ${styles.pipelineCard}`}
        >
          <div
            style={{
              width: "100%",
              overflow: "hidden",
            }}
            className={styles.sectionContent}
          >
            <h2 style={{ ...headerStyle, margin: "0 0 5px 0" }}>DealFlow Pipeline</h2>
            <InternDealflowPage profiles={profileMatchesCount} />
          </div>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: "100%",
            padding: "20px",
            margin: "0 0 20px 0",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            boxSizing: "border-box",
            backdropFilter: "blur(10px)",
          }}
          className={`${styles.sectionCard} ${styles.tableSection} ${styles.tableCard}`}
        >
          <InternTabbedTables
            filters={filters}
            stageFilter={stageFilter}
            loading={loading}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onDealComplete={handleDealComplete}
            profiles={setProfileMatchesCount}
          />
        </div>
      </div>
    </div>
  )
}
