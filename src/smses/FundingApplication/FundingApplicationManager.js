"use client"

import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { Sparkles, ArrowRight } from "lucide-react"
import FundingApplicationsList from "./FundingApplicationsList"
import FundingApplication from "./FundingApplication"
import ApplicationSummary from "./application-summary"
import { auth, db } from "../../firebaseConfig"

/* Banner — links SME to the new funding flow */
const NewFlowBanner = () => (
  <>
    <style>{`
      .funding-cta-btn,
      .funding-cta-btn:link,
      .funding-cta-btn:visited,
      .funding-cta-btn:hover,
      .funding-cta-btn:active,
      .funding-cta-btn:focus {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
        text-decoration: none !important;
      }
      .funding-cta-btn svg { color: #ffffff !important; }
      .funding-cta-btn:hover {
        filter: brightness(1.08);
        transform: translateY(-1px);
      }
    `}</style>

    <div
      style={{
        margin: "16px 22px 0",
        padding: "14px 18px",
        borderRadius: 12,
        background: "linear-gradient(135deg, rgba(166,124,82,0.12), rgba(125,90,80,0.08))",
        border: "1px solid rgba(166,124,82,0.3)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <Sparkles size={18} color="#a67c52" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#4a352f" }}>
            Try the new funding flow
          </div>
          <div style={{ fontSize: 12, color: "#7d5a50", marginTop: 2 }}>
            Match one request against live investor opportunities. Reuses your profile and Vault.
          </div>
        </div>
      </div>
      <a
        href="/funding-new"
        className="funding-cta-btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 20px",
          borderRadius: 9,
          background: "linear-gradient(135deg, #8d6e63, #4a352f)",
          color: "#ffffff",
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "none",
          boxShadow: "0 4px 12px rgba(74,53,47,0.3)",
          flexShrink: 0,
        }}
      >
        Open new flow <ArrowRight size={14} />
      </a>
    </div>
  </>
)

const FundingApplicationManager = ({ embedded = false, onNavigateToMatches }) => {
  const [currentView, setCurrentView] = useState('list')
  const [selectedApplicationId, setSelectedApplicationId] = useState(null)
  const [selectedApplicationData, setSelectedApplicationData] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user)
    })
    return () => unsubscribe()
  }, [])

  const loadApplicationData = async (applicationId) => {
    try {
      setLoadingSummary(true)
      const docRef = doc(db, "fundingApplicationsV2", applicationId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          formData: data,
          status: data.status,
          userId: data.userId,
          userEmail: data.userEmail,
        }
      }
      return null
    } catch (error) {
      console.error("Error loading application data:", error)
      return null
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleViewSummary = async (applicationId) => {
    setSelectedApplicationId(applicationId)
    const fullData = await loadApplicationData(applicationId)
    if (fullData) {
      setSelectedApplicationData(fullData)
      setCurrentView('summary')
    } else {
      setSelectedApplicationId(null)
      setSelectedApplicationData(null)
      alert("Could not load application details. Please try again.")
    }
  }

  const handleEditApplication = (applicationId) => {
    setSelectedApplicationId(applicationId)
    setSelectedApplicationData(null)
    setCurrentView('edit')
  }

  const handleCreateNew = () => {
    setSelectedApplicationId(null)
    setSelectedApplicationData(null)
    setCurrentView('edit')
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setSelectedApplicationId(null)
    setSelectedApplicationData(null)
  }

  const handleEditFromSummary = () => {
    setCurrentView('edit')
  }

  const handleApplicationSubmitted = () => {
    handleBackToList()
    if (onNavigateToMatches) {
      onNavigateToMatches()
    }
  }

  const handleAnalysisComplete = async (applicationId) => {
    // console.log("Analysis complete for:", applicationId)
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Please Log In</h2>
        <p>You need to be logged in to view funding applications.</p>
      </div>
    )
  }

  return (
    <>
      <NewFlowBanner />

      {currentView === 'list' && (
        <FundingApplicationsList
          onViewSummary={handleViewSummary}
          onEditApplication={handleEditApplication}
          onCreateNew={handleCreateNew}
          embedded={embedded}
        />
      )}

      {currentView === 'edit' && (
        <FundingApplication
          applicationId={selectedApplicationId}
          isNew={selectedApplicationId === null}
          onBack={handleBackToList}
          onNavigateToMatches={onNavigateToMatches || handleBackToList}
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}

      {currentView === 'summary' && (
        <ApplicationSummary
          formData={selectedApplicationData?.formData}
          onEdit={handleEditFromSummary}
          onBack={handleBackToList}
        />
      )}
    </>
  )
}

export default FundingApplicationManager