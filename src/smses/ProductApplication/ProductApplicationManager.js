"use client"

import { useState, useEffect } from "react"
import ApplicationsList from "./ApplicationsList"
import ProductApplication from "./ProductApplication"
import ApplicationSummary from "./application-summary"
import AnalysisProgressOverlay from "./AnalysisProgressOverlay"
import { auth } from "../../firebaseConfig"
import useMatches from "../hooks/useMatches"

const ProductApplicationManager = ({ embedded = false, onNavigateToMatches }) => {
  const [currentView, setCurrentView] = useState('list')
  const [selectedApplicationId, setSelectedApplicationId] = useState(null)
  const [selectedApplicationData, setSelectedApplicationData] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  // When true, ProductApplication skips the auto-summary even if status==='submitted'
  const [forceEdit, setForceEdit] = useState(false)

  // AI analysis progress tracking
  const [analysisProgress, setAnalysisProgress] = useState(null)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [showAnalysisOverlay, setShowAnalysisOverlay] = useState(false)

  // Get refreshAiCache from useMatches hook so we can refresh after background analysis
  const { refreshAiCache } = useMatches({ enabled: true })

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user)
    })
    return () => unsubscribe()
  }, [])

  const handleViewSummary = (applicationId, applicationData) => {
    setSelectedApplicationId(applicationId)
    setSelectedApplicationData(applicationData)
    setForceEdit(false)
    setCurrentView('summary')
  }

  const handleEditApplication = (applicationId) => {
    setSelectedApplicationId(applicationId)
    setSelectedApplicationData(null)
    setForceEdit(true)          // skip auto-summary inside ProductApplication
    setCurrentView('edit')
  }

  const handleCreateNew = () => {
    setSelectedApplicationId(null)
    setSelectedApplicationData(null)
    setForceEdit(false)
    setCurrentView('edit')
  }

  const handleBackToList = () => {
    // Prevent navigation while analysis is in progress
    if (showAnalysisOverlay) return
    
    setCurrentView('list')
    setSelectedApplicationId(null)
    setSelectedApplicationData(null)
    setForceEdit(false)
    setAnalysisProgress(null)
    setAnalysisComplete(false)
    setShowAnalysisOverlay(false)
  }

  // Called when analysis starts or progress updates
  const handleAnalysisProgress = (progress) => {
    setShowAnalysisOverlay(true)
    setAnalysisProgress(progress)
    setAnalysisComplete(false)
  }

  // Called when analysis completes
  const handleAnalysisComplete = async (applicationId) => {
    setAnalysisComplete(true)
    
    // Give users a moment to see the "Complete" message
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    try {
      // Refresh the AI cache
      await refreshAiCache(applicationId)
    } catch (err) {
      // Silently handle cache refresh errors
    }
    
    // Hide overlay and navigate to matches
    setShowAnalysisOverlay(false)
    setAnalysisProgress(null)
    setAnalysisComplete(false)
  }

  // Called from ApplicationSummary's "Edit Application" button
  const handleEditFromSummary = () => {
    setForceEdit(true)          // ← this is what was missing
    setCurrentView('edit')
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Please Log In</h2>
        <p>You need to be logged in to view applications.</p>
      </div>
    )
  }

  if (currentView === 'list') {
    return (
      <ApplicationsList
        onViewSummary={handleViewSummary}
        onEditApplication={handleEditApplication}
        onCreateNew={handleCreateNew}
        embedded={embedded}
      />
    )
  }

  if (currentView === 'edit') {
    return (
      <>
        <ProductApplication
          embedded={embedded}
          applicationId={selectedApplicationId}
          forceEdit={forceEdit}               // ← new prop
          onNavigateBack={handleBackToList}
          onNavigateToMatches={onNavigateToMatches || handleBackToList}
          onNavigateToDashboard={handleBackToList}
          onAnalysisComplete={handleAnalysisComplete}
          onAnalysisProgress={handleAnalysisProgress}
        />
        <AnalysisProgressOverlay
          progress={analysisProgress}
          isComplete={analysisComplete}
        />
      </>
    )
  }

  if (currentView === 'summary') {
    return (
      <ApplicationSummary
        data={selectedApplicationData}
        applicationId={selectedApplicationId}
        onEdit={handleEditFromSummary}
        onBack={handleBackToList}
      />
    )
  }

  return (
    <ApplicationsList
      onViewSummary={handleViewSummary}
      onEditApplication={handleEditApplication}
      onCreateNew={handleCreateNew}
      embedded={embedded}
    />
  )
}

export default ProductApplicationManager