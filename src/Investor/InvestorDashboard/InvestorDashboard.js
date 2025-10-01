"use client"

import { useState, useEffect } from "react"
import { X, ArrowRight } from 'lucide-react'

import { ApplicationTracker } from "./application-tracker"
import { LegitimacyScoreCard } from "./legitimacy-score-card"
import { ComplianceScoreCard } from "./compliance"
// import { CustomerReviewsCard } from "./customer-reviews-card"
// import { CalendarCard } from "./calender-card"
// import { SMEApplicationsTable } from "./top-matches-table"

import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"

import styles from "./InvestorDashboard.module.css"

const dashboardSteps = [
  {
    title: "Welcome to Your Dashboard",
    content: "This is your central hub for tracking applications, viewing matches, and monitoring your business metrics.",
    icon: "🏠",
  },
  {
    title: "Application Tracker",
    content: "Track the status of all your applications in one place. See which stage each application is in and what's next.",
    icon: "📊",
  },
  {
    title: "Compliance and Legitimacy",
    content: "Monitor your Legitimacy Score and Compliance Score to assess business readiness.",
    icon: "📈",
  },
]

export function Dashboard() {
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDashboardPopup, setShowDashboardPopup] = useState(false)
  const [currentDashboardStep, setCurrentDashboardStep] = useState(0)

  const user = auth.currentUser
  const userName = user ? user.email : "User"

  const getUserSpecificKey = (baseKey) => {
    const userId = auth.currentUser?.uid
    return userId ? `${baseKey}_${userId}` : baseKey
  }

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userId = auth.currentUser?.uid
        if (!userId) {
          console.error("User not logged in")
          setLoading(false)
          return
        }

        const docRef = doc(db, "universalProfiles", userId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setProfileData(docSnap.data())
        } else {
          console.error("No profile found")
        }
        setLoading(false)
      } catch (err) {
        console.error("Error fetching profile data:", err)
        setLoading(false)
      }
    }

    fetchProfileData()

    const userId = auth.currentUser?.uid
    if (userId) {
      const hasSeenDashboardPopup = localStorage.getItem(getUserSpecificKey("hasSeenDashboardPopup")) === "true"
      if (!hasSeenDashboardPopup) {
        setShowDashboardPopup(true)
        localStorage.setItem(getUserSpecificKey("hasSeenDashboardPopup"), "true")
      }
    }
  }, [])

  useEffect(() => {
    const resizableContainers = document.querySelectorAll(`.${styles.resizableCardContainer}`)

    const saveCardSizes = () => {
      resizableContainers.forEach((container, index) => {
        const width = container.style.width
        const height = container.style.height
        if (width && height) {
          localStorage.setItem(`card-${index}-size`, JSON.stringify({ width, height }))
        }
      })
    }

    resizableContainers.forEach((container, index) => {
      const savedSize = localStorage.getItem(`card-${index}-size`)
      if (savedSize) {
        const { width, height } = JSON.parse(savedSize)
        container.style.width = width
        container.style.height = height
      }
    })

    let resizeTimeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(saveCardSizes, 500)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [loading])

  const handleNextDashboardStep = () => {
    if (currentDashboardStep < dashboardSteps.length - 1) {
      setCurrentDashboardStep(currentDashboardStep + 1)
    } else {
      handleCloseDashboardPopup()
    }
  }

  const handleCloseDashboardPopup = () => {
    setShowDashboardPopup(false)
  }

  if (loading) {
    return (
      <div className={`${styles.dashboardContainer} flex items-center justify-center`}>
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className={styles.dashboardContainer}>
      {showDashboardPopup && (
        <div className="popup-overlay">
          <div className="welcome-popup dashboard-popup">
            <button className="close-popup" onClick={handleCloseDashboardPopup}>
              <X size={24} />
            </button>
            <div className="popup-content">
              <div className="popup-icon">{dashboardSteps[currentDashboardStep].icon}</div>
              <h2>{dashboardSteps[currentDashboardStep].title}</h2>
              <p>{dashboardSteps[currentDashboardStep].content}</p>

              <div className="popup-progress">
                {dashboardSteps.map((_, index) => (
                  <div key={index} className={`progress-dot ${index === currentDashboardStep ? "active" : ""}`} />
                ))}
              </div>

              <div className="popup-buttons">
                <button className="btn btn-secondary" onClick={handleCloseDashboardPopup}>
                  Close
                </button>
                {currentDashboardStep < dashboardSteps.length - 1 ? (
                  <button className="btn btn-primary" onClick={handleNextDashboardStep}>
                    Next <ArrowRight size={16} />
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleCloseDashboardPopup}>
                    Get Started
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.content}>
        <main className={styles.dashboardMain}>
          {/* Application Tracker */}
          <section className={styles.trackerSection}>
            <ApplicationTracker />
          </section>

          {/* Stats Cards Row */}
          <section className={styles.statsCardsRow}>
            <div className={styles.resizableCardContainer}>
              <LegitimacyScoreCard profileData={profileData} />
            </div>
            <div className={styles.resizableCardContainer}>
              <ComplianceScoreCard />
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
