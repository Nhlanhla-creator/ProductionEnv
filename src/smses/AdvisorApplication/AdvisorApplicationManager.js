"use client"

import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import ApplicationsList from "./ApplicationsList"
import AdvisorApplication from "./AdvisorApplication"
import ApplicationSummary from "./ApplicationSummary"
import { auth, db } from "../../firebaseConfig"

/**
 * AdvisorApplicationManager
 * 
 * Manages the complete advisor application lifecycle with robust navigation:
 * - List: View all advisor applications
 * - Edit: Create or edit an advisor application
 * - Summary: Review application details before submission
 * 
 * Navigation Flow:
 * list -> (create/edit) -> edit
 * list -> (view) -> summary
 * summary -> edit
 * edit -> back to list OR back to summary
 */
const AdvisorApplicationManager = ({ embedded = false, onNavigateToMatches }) => {
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
      const docRef = doc(db, "advisoryApplicationsV2", applicationId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        
        // Fetch existing universal docs if needed
        let existingUniversalDocs = {
          businessPlan: null,
          financialStatements: [],
          loading: false
        }
        
        try {
          if (data.userId) {
            const universalProfileRef = doc(db, "universalProfiles", data.userId)
            const profileSnap = await getDoc(universalProfileRef)
            if (profileSnap.exists()) {
              const profileData = profileSnap.data()
              const documents = profileData.documents || {}
              existingUniversalDocs.businessPlan = documents.businessPlan || null
              
              if (documents.financialStatements_multiple && Array.isArray(documents.financialStatements_multiple)) {
                existingUniversalDocs.financialStatements = documents.financialStatements_multiple
                  .filter(doc => doc.url && doc.url !== "")
                  .map(doc => ({ url: doc.url, customName: doc.customName || "Financial Statement" }))
              }
            }
          }
        } catch (err) {
          console.error("Error loading universal documents:", err)
        }
        
        // Return flattened structure - all fields at top level
        return {
          formData: {
            // Top-level advisory fields (previously nested in advisoryNeedsAssessment)
            advisoryRole: data.advisoryRole || [],
            functionalExpertise: data.functionalExpertise || [],
            supportFocus: data.supportFocus || [],
            sectorExperienceRequired: data.sectorExperienceRequired || "",
            compensationType: data.compensationType || "",
            timeCommitment: data.timeCommitment || "",
            engagementType: data.engagementType || "",
            meetingFormat: data.meetingFormat || "",
            location: data.location || "",
            projectDuration: data.projectDuration || "",
            bbeeLevel: data.bbeeLevel || "",
            esdProgram: data.esdProgram || false,
            ownershipPrefs: data.ownershipPrefs || [],
            compensationAmount: data.compensationAmount || "",
            maxBudget: data.maxBudget || "",
            minBudget: data.minBudget || "",
            deliveryModes: data.deliveryModes || [],
            matchingStartDate: data.matchingStartDate || "",
            startDate: data.startDate || "",
            // Document uploads
            documentUploads: data.documentUploads?.originalUploads || {}
          },
          documentSelections: {
            businessPlan: data.documentUploads?.businessPlanSource || "existing",
            latestFinancials: data.documentUploads?.latestFinancialsSource || "existing"
          },
          existingUniversalDocs: existingUniversalDocs,
          status: data.status,
          userId: data.userId,
          userEmail: data.userEmail
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
    // Set applicationId first, then load full data
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
    setForceEdit(true) // Skip auto-summary in AdvisorApplication
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
   * Automatically navigates back to list
   */
  const handleApplicationSubmitted = () => {
    handleBackToList()
    if (onNavigateToMatches) {
      onNavigateToMatches()
    }
  }

  /**
   * Handle analysis progress updates during submission
   */
  const handleAnalysisProgress = (progress) => {
    // Placeholder for future analysis progress UI
    console.log("Analysis progress:", progress)
  }

  /**
   * Handle analysis completion
   */
  const handleAnalysisComplete = async (applicationId) => {
    // Placeholder for post-analysis logic
    console.log("Analysis complete for:", applicationId)
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
      <AdvisorApplication
        embedded={embedded}
        applicationId={selectedApplicationId}
        isNew={selectedApplicationId === null}
        forceEdit={forceEdit}
        onNavigateBack={handleBackToList}
        onNavigateToMatches={onNavigateToMatches || handleBackToList}
        onAnalysisComplete={handleAnalysisComplete}
        onAnalysisProgress={handleAnalysisProgress}
      />
    )
  }

  if (currentView === 'summary') {
    return (
      <ApplicationSummary
        formData={selectedApplicationData?.formData}
        applicationId={selectedApplicationId}
        documentSelections={selectedApplicationData?.documentSelections}
        existingUniversalDocs={selectedApplicationData?.existingUniversalDocs}
        onEdit={handleEditFromSummary}
        onBack={handleBackToList}
      />
    )
  }

  // Fallback to list view
  return (
    <ApplicationsList
      onViewSummary={handleViewSummary}
      onEditApplication={handleEditApplication}
      onCreateNew={handleCreateNew}
      embedded={embedded}
    />
  )
}

export default AdvisorApplicationManager