"use client"

import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import InternApplicationsList from "./InternApplicationsList"
import InternApplication from "./internapplication"
import ApplicationSummary from "./ApplicationSummary"
import { auth, db } from "../../firebaseConfig"

/**
 * InternApplicationManager
 * 
 * Manages the complete intern application lifecycle with robust navigation:
 * - List: View all internship applications
 * - Edit: Create or edit an internship application
 * - Summary: Review application details before submission
 * 
 * Navigation Flow:
 * list -> (create/edit) -> edit
 * list -> (view) -> summary
 * summary -> edit
 * edit -> back to list OR back to summary
 */
const InternApplicationManager = ({ embedded = false, onNavigateToMatches }) => {
  // View management
  const [currentView, setCurrentView] = useState('list')
  
  // Application selection
  const [selectedApplicationId, setSelectedApplicationId] = useState(null)
  const [selectedApplicationData, setSelectedApplicationData] = useState(null)
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Force edit mode (skip auto-summary even if application is submitted)
  const [forceEdit, setForceEdit] = useState(false)

  // Loading state for summary view
  const [loadingSummary, setLoadingSummary] = useState(false)

  // Refresh trigger for the list (incremented after submit to re-fetch data)
  const [listRefreshKey, setListRefreshKey] = useState(0)

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user)
    })
    return () => unsubscribe()
  }, [])

  /**
   * Load full application data from Firebase
   * Used when transitioning to summary view
   */
  const loadApplicationData = async (applicationId) => {
    try {
      setLoadingSummary(true)
      const docRef = doc(db, "internApplicationsV2", applicationId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        
        // Return flattened structure
        return {
          formData: {
            instructions: data.instructions || {},
            jobOverview: data.jobOverview || {},
            internshipRequest: data.internshipRequest || {},
            matchingAgreement: data.matchingAgreement || {},
          },
          completedSections: data.completedSections || {},
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

  /**
   * Handle viewing application summary
   * Transitions: list -> summary
   */
  const handleViewSummary = async (applicationId, basicApplicationData) => {
    setSelectedApplicationId(applicationId)
    setForceEdit(false)
    
    // Load full application data from Firebase
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

  /**
   * Handle editing an existing application
   * Transitions: list -> edit OR summary -> edit
   */
  const handleEditApplication = (applicationId) => {
    setSelectedApplicationId(applicationId)
    setSelectedApplicationData(null)
    setForceEdit(true) // Skip auto-summary in InternApplication
    setCurrentView('edit')
  }

  /**
   * Handle creating a new application
   * Transitions: list -> edit
   */
  const handleCreateNew = () => {
    setSelectedApplicationId(null)
    setSelectedApplicationData(null)
    setForceEdit(false)
    setCurrentView('edit')
  }

  /**
   * Handle navigation back to list
   * Prevents navigation during analysis, clears application state
   * Transitions: edit -> list OR summary -> list
   */
  const handleBackToList = () => {
    console.log("(2) Arrived at app manager...")
    setCurrentView('list')
    setSelectedApplicationId(null)
    setSelectedApplicationData(null)
    setForceEdit(false)
  }

  /**
   * Handle navigation back to list after submission — also triggers list refresh
   */
  const handleBackToListAfterSubmit = () => {
    setListRefreshKey((k) => k + 1)
    setCurrentView('list')
    setSelectedApplicationId(null)
    setSelectedApplicationData(null)
    setForceEdit(false)
  }

  /**
   * Handle navigation from summary to edit
   * Used by ApplicationSummary's "Edit Application" button
   * Transitions: summary -> edit
   */
  const handleEditFromSummary = () => {
    setForceEdit(true)
    setCurrentView('edit')
  }

  /**
   * Handle application submission completion
   * Automatically navigates back to list with refresh trigger
   */
  const handleApplicationSubmitted = () => {
    handleBackToListAfterSubmit()
    if (onNavigateToMatches) {
      onNavigateToMatches()
    }
  }

  // Authentication guard
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Please Log In</h2>
        <p>You need to be logged in to view applications.</p>
      </div>
    )
  }

  // Render based on current view
  if (currentView === 'list') {
    return (
      <InternApplicationsList
        onViewSummary={handleViewSummary}
        onEditApplication={handleEditApplication}
        onCreateNew={handleCreateNew}
        embedded={embedded}
        refreshTrigger={listRefreshKey}
      />
    )
  }

  if (currentView === 'edit') {
    return (
      <InternApplication
        applicationId={selectedApplicationId}
        isNew={selectedApplicationId === null}
        onBack={handleBackToList}
        onSubmitted={handleApplicationSubmitted}
      />
    )
  }

  if (currentView === 'summary') {
    const getSummaryData = () => {
      const formData = selectedApplicationData?.formData || {}
      return {
        internshipTitle: formData.jobOverview?.internshipTitle,
        department: formData.jobOverview?.department,
        briefDescription: formData.jobOverview?.briefDescription,
        keyTasks: formData.jobOverview?.keyTasks,
        learningOutcomes: formData.jobOverview?.learningOutcomes,
        preferredSkills: formData.jobOverview?.preferredSkills,
        numberOfInterns: formData.internshipRequest?.numberOfInterns,
        internRolesText: formData.internshipRequest?.internRolesText,
        internType: formData.internshipRequest?.internType,
        hoursPerWeek: formData.internshipRequest?.hoursPerWeek,
        startDate: formData.internshipRequest?.startDate,
        duration: formData.internshipRequest?.duration,
        stipendOffered: formData.internshipRequest?.stipendOffered,
        stipendAmount: formData.internshipRequest?.stipendAmount,
        equityOrIncentives: formData.internshipRequest?.equityOrIncentives,
        reportingDepartment: formData.internshipRequest?.reportingDepartment,
        workDescription: formData.internshipRequest?.workDescription,
        canRotate: formData.internshipRequest?.canRotate,
        writtenEvaluation: formData.matchingAgreement?.writtenEvaluation,
        mentorshipSupport: formData.matchingAgreement?.mentorshipSupport,
        codeOfConduct: formData.matchingAgreement?.codeOfConduct,
        consentDeclaration: formData.matchingAgreement?.consentDeclaration,
      }
    }

    return (
      <ApplicationSummary
        formData={getSummaryData()}
        applicationId={selectedApplicationId}
        onEdit={handleEditFromSummary}
        onBack={handleBackToList}
      />
    )
  }

  // Fallback to list view
  return (
    <InternApplicationsList
      onViewSummary={handleViewSummary}
      onEditApplication={handleEditApplication}
      onCreateNew={handleCreateNew}
      embedded={embedded}
      refreshTrigger={listRefreshKey}
    />
  )
}

export default InternApplicationManager