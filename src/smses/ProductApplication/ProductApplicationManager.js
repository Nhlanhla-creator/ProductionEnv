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
  // When true, ProductApplication skips the auto-summary even if status==='submitted'
  const [forceEdit, setForceEdit] = useState(false)

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
    setCurrentView('list')
    setSelectedApplicationId(null)
    setSelectedApplicationData(null)
    setForceEdit(false)
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
      <ProductApplication
        embedded={embedded}
        applicationId={selectedApplicationId}
        forceEdit={forceEdit}               // ← new prop
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