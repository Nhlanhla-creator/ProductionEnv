"use client"

import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import FundingApplicationsList from "./FundingApplicationsList"
import FundingApplication from "./FundingApplication"
import ApplicationSummary from "./application-summary"
import { auth, db } from "../../firebaseConfig"

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

  if (currentView === 'list') {
    return (
      <FundingApplicationsList
        onViewSummary={handleViewSummary}
        onEditApplication={handleEditApplication}
        onCreateNew={handleCreateNew}
        embedded={embedded}
      />
    )
  }

  if (currentView === 'edit') {
    return (
      <FundingApplication
        applicationId={selectedApplicationId}
        isNew={selectedApplicationId === null}
        onBack={handleBackToList}
        onNavigateToMatches={onNavigateToMatches || handleBackToList}
        onAnalysisComplete={handleAnalysisComplete}
      />
    )
  }

  if (currentView === 'summary') {
    return (
      <ApplicationSummary
        formData={selectedApplicationData?.formData}
        onEdit={handleEditFromSummary}
        onBack={handleBackToList}
      />
    )
  }

  return (
    <FundingApplicationsList
      onViewSummary={handleViewSummary}
      onEditApplication={handleEditApplication}
      onCreateNew={handleCreateNew}
      embedded={embedded}
    />
  )
}

export default FundingApplicationManager