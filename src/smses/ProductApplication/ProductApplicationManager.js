"use client"

import { useState, useEffect } from "react"
import ApplicationsList from "./ApplicationsList"
import ProductApplication from "./ProductApplication"
import ApplicationSummary from "./application-summary"
import { auth } from "../../firebaseConfig"

const ProductApplicationManager = ({ embedded = false, onNavigateToMatches }) => {
  const [currentView, setCurrentView] = useState('list')
  const [selectedApplicationId, setSelectedApplicationId] = useState(null)
  const [selectedApplicationData, setSelectedApplicationData] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user)
      console.log("🔐 ProductApplicationManager - Auth:", user?.uid || "No user")
    })
    return () => unsubscribe()
  }, [])

  const handleViewSummary = (applicationId, applicationData) => {
    console.log("📋 Manager - View Summary:", applicationId)
    setSelectedApplicationId(applicationId)
    setSelectedApplicationData(applicationData)
    setCurrentView('summary')
  }

  const handleEditApplication = (applicationId) => {
    console.log("✏️ Manager - Edit:", applicationId)
    setSelectedApplicationId(applicationId)
    setSelectedApplicationData(null)
    setCurrentView('edit')
  }

  const handleCreateNew = () => {
    console.log("🆕 Manager - Create New")
    setSelectedApplicationId(null)
    setSelectedApplicationData(null)
    setCurrentView('edit')
  }

  const handleBackToList = () => {
    console.log("⬅️ Manager - Back to List")
    setCurrentView('list')
    setSelectedApplicationId(null)
    setSelectedApplicationData(null)
  }

  const handleEditFromSummary = () => {
    console.log("✏️ Manager - Edit from Summary")
    setCurrentView('edit')
  }

  console.log("🎯 Manager - View:", currentView, "AppId:", selectedApplicationId)

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Please Log In</h2>
        <p>You need to be logged in to view applications.</p>
      </div>
    )
  }

  // RENDER BASED ON CURRENT VIEW
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
      <ProductApplication
        embedded={embedded}
        applicationId={selectedApplicationId}
        onNavigateBack={handleBackToList}
        onNavigateToMatches={onNavigateToMatches || handleBackToList}
        onNavigateToDashboard={handleBackToList}
      />
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

  // Fallback
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