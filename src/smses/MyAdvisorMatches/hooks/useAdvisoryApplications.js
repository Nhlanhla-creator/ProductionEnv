"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore"
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getFunctions, httpsCallable } from "firebase/functions"
import { db, auth } from "../../../firebaseConfig"
import { sections } from "../../AdvisorApplication/AdvisorApplication"

const IS_PROD = process.env.NODE_ENV === "production"
const LOCAL_MATCHING_URL = "http://localhost:8000/api/advisors/analyze-matches"
 
const storage = getStorage()
 
const EMPTY_FORM = {
  advisoryRole: [],
  functionalExpertise: [],
  supportFocus: [],
  sectorExperienceRequired: [],
  compensationType: "",
  timeCommitment: "",
  engagementType: "",
  meetingFormat: "",
  location: "",
  projectDuration: "",
  bbeeLevel: "",
  esdProgram: false,
  ownershipPrefs: [],
  compensationAmount: "",
  maxBudget: "",
  minBudget: "",
  deliveryModes: [],
  matchingStartDate: "",
  startDate: "",
  documentUploads: {},
}
 
const EMPTY_COMPLETED = {
  advisoryNeedsAssessment: false,
  documentUploads: false,
}
 
const EMPTY_DOC_SELECTIONS = {
  businessPlan: "existing",
  latestFinancials: "existing",
}
 
const sectionValidations = {
  advisoryNeedsAssessment: (data) =>
    !!(
      data?.advisoryRole?.length &&
      data?.functionalExpertise?.length &&
      data?.timeCommitment &&
      data?.compensationType &&
      data?.meetingFormat &&
      data?.startDate &&
      data?.projectDuration &&
      (data?.meetingFormat !== "in-person" || data?.location)
    ),
  documentUploads: () => true,
}
 
const uploadDocumentFile = async (file, path) => {
  if (typeof file === "string") return file
  if (file instanceof File) {
    const storageRef = ref(storage, path)
    const result = await uploadBytes(storageRef, file)
    return getDownloadURL(result.ref)
  }
  return null
}
 
export const useAdvisoryApplications = ({
  applicationId = null,
  isNew = false,
  onNavigateToMatches,
} = {}) => {
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [completedSections, setCompletedSections] = useState(EMPTY_COMPLETED)
  const [documentSelections, setDocumentSelections] = useState(EMPTY_DOC_SELECTIONS)
  const [existingUniversalDocs, setExistingUniversalDocs] = useState({
    businessPlan: null,
    financialStatements: [],
    loading: true,
  })
  const [currentDocId, setCurrentDocId] = useState(applicationId)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState("") // "saving" | "saved" | "error" | ""
  const [isLoading, setIsLoading] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(null)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
 
  const lastSaved = useRef({ ...EMPTY_FORM })
 
  // ── Auth ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null))
    return unsub
  }, [])
 
  // ── Universal docs ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUniversalDocs = async () => {
      const currentUser = getAuth().currentUser
      if (!currentUser) {
        setExistingUniversalDocs((prev) => ({ ...prev, loading: false }))
        return
      }
      try {
        const snap = await getDoc(doc(db, "universalProfiles", currentUser.uid))
        if (snap.exists()) {
          const docs = snap.data().documents || {}
          const financialStatements = (docs.financialStatements_multiple || [])
            .filter((d) => d.url)
            .map((d) => ({ url: d.url, customName: d.customName || "Financial Statement" }))
          setExistingUniversalDocs({
            businessPlan: docs.businessPlan || null,
            financialStatements,
            loading: false,
          })
        } else {
          setExistingUniversalDocs((prev) => ({ ...prev, loading: false }))
        }
      } catch (err) {
        console.error("Error fetching universal docs:", err)
        setExistingUniversalDocs((prev) => ({ ...prev, loading: false }))
      }
    }
    fetchUniversalDocs()
  }, [])
 
  // ── Load / reset on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    if (isNew) {
      resetToEmpty()
    } else {
      loadApplication()
    }
  }, [user, applicationId, isNew])
 
  // ── Helpers ───────────────────────────────────────────────────────────────────
  const resetToEmpty = () => {
    setFormData(EMPTY_FORM)
    setCompletedSections(EMPTY_COMPLETED)
    setDocumentSelections(EMPTY_DOC_SELECTIONS)
    setCurrentDocId(null)
    setHasUnsavedChanges(false)
    setIsSubmitted(false)
    lastSaved.current = { ...EMPTY_FORM }
  }
 
  const applyLoadedData = (data, docId) => {
    const form = {
      advisoryRole: data.advisoryRole || [],
      functionalExpertise: data.functionalExpertise || [],
      supportFocus: data.supportFocus || [],
      sectorExperienceRequired: data.sectorExperienceRequired || [],
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
      documentUploads: data.documentUploads?.originalUploads || {},
    }
    setFormData(form)
    lastSaved.current = JSON.parse(JSON.stringify(form))
 
    if (data.documentUploads) {
      setDocumentSelections({
        businessPlan: data.documentUploads.businessPlanSource || "existing",
        latestFinancials: data.documentUploads.latestFinancialsSource || "existing",
      })
    }
 
    const completed = data.completedSections || {}
    setCompletedSections(completed)
    setCurrentDocId(docId)
    setHasUnsavedChanges(false)
 
    const allComplete = sections.every((s) => completed[s.id])
    if (data.status === "submitted" || allComplete) setIsSubmitted(true)
  }
 
  const loadApplication = async () => {
    if (!user || !applicationId) return
    try {
      setIsLoading(true)
      const snap = await getDoc(doc(db, "advisoryApplicationsV2", applicationId))
      if (snap.exists()) {
        applyLoadedData(snap.data(), applicationId)
      } else {
        resetToEmpty()
      }
    } catch (err) {
      console.error("Error loading application:", err)
    } finally {
      setIsLoading(false)
    }
  }
 
  const ensureDocId = async () => {
    if (currentDocId) return currentDocId
    const docRef = await addDoc(collection(db, "advisoryApplicationsV2"), {
      userId: user.uid,
      userEmail: user.email,
      status: "in_progress",
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    })
    setCurrentDocId(docRef.id)
    return docRef.id
  }
 
  // ── Save section ──────────────────────────────────────────────────────────────
  const saveSectionToFirebase = useCallback(
    async (sectionName, markCompleted = false) => {
      if (!user) return false
      try {
        setSaveStatus("saving")
        const docId = await ensureDocId()
        const docRef = doc(db, "advisoryApplicationsV2", docId)
 
        const base = {
          lastUpdated: serverTimestamp(),
          userId: user.uid,
          userEmail: user.email,
          status: "in_progress",
        }
 
        let payload = { ...base }
 
        if (sectionName === "advisoryNeedsAssessment") {
          const fields = { ...formData }
          delete fields.documentUploads
          Object.assign(payload, fields)
          lastSaved.current = { ...lastSaved.current, ...fields }
        } else if (sectionName === "documentUploads") {
          payload.documentUploads = formData.documentUploads || {}
          lastSaved.current.documentUploads = JSON.parse(
            JSON.stringify(formData.documentUploads || {})
          )
        }
 
        if (markCompleted) {
          const updated = { ...completedSections, [sectionName]: true }
          payload.completedSections = updated
          setCompletedSections(updated)
        }
 
        await updateDoc(docRef, payload)
        setSaveStatus("saved")
        setTimeout(() => setSaveStatus(""), 2000)
        setHasUnsavedChanges(false)
        return true
      } catch (err) {
        console.error("Save error:", err)
        setSaveStatus("error")
        setTimeout(() => setSaveStatus(""), 3000)
        return false
      }
    },
    [user, formData, completedSections, currentDocId]
  )
 
  // ── Full submit ───────────────────────────────────────────────────────────────
  const submitApplication = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const docId = await ensureDocId()
 
      // Upload business plan
      let businessPlanUrl = null
      if (documentSelections.businessPlan === "new" && formData.documentUploads?.businessPlan?.length) {
        businessPlanUrl = await uploadDocumentFile(
          formData.documentUploads.businessPlan[0],
          `advisoryApplications/${docId}/businessPlan_${Date.now()}.pdf`
        )
      } else if (documentSelections.businessPlan === "existing") {
        businessPlanUrl = existingUniversalDocs.businessPlan || null
      }
 
      // Upload financials
      let latestFinancialsUrls = []
      if (documentSelections.latestFinancials === "new" && formData.documentUploads?.latestFinancials?.length) {
        latestFinancialsUrls = await Promise.all(
          formData.documentUploads.latestFinancials.map((file) =>
            uploadDocumentFile(
              file,
              `advisoryApplications/${docId}/financials_${Date.now()}_${file instanceof File ? file.name : "doc"}`
            )
          )
        )
      } else if (documentSelections.latestFinancials === "existing") {
        latestFinancialsUrls = existingUniversalDocs.financialStatements.map((d) => d.url)
      }
 
      const docRef = doc(db, "advisoryApplicationsV2", docId)
      await setDoc(
        docRef,
        {
          userId: user.uid,
          userEmail: user.email,
          status: "submitted",
          submittedAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          advisoryRole: formData.advisoryRole || [],
          functionalExpertise: formData.functionalExpertise || [],
          supportFocus: formData.supportFocus || [],
          sectorExperienceRequired: formData.sectorExperienceRequired || "",
          compensationType: formData.compensationType || "",
          timeCommitment: formData.timeCommitment || "",
          engagementType: formData.engagementType || "",
          meetingFormat: formData.meetingFormat || "",
          location: formData.location || "",
          projectDuration: formData.projectDuration || "",
          bbeeLevel: formData.bbeeLevel || "",
          esdProgram: formData.esdProgram || false,
          ownershipPrefs: formData.ownershipPrefs || [],
          compensationAmount: formData.compensationAmount || "",
          maxBudget: formData.maxBudget || "",
          minBudget: formData.minBudget || "",
          deliveryModes: formData.deliveryModes || [],
          matchingStartDate: formData.matchingStartDate || "",
          startDate: formData.startDate || "",
          documentUploads: {
            businessPlanSource: documentSelections.businessPlan || "none",
            businessPlanUrl,
            latestFinancialsSource: documentSelections.latestFinancials || "none",
            latestFinancialsUrls,
            currentBoardList: formData.documentUploads?.currentBoardList || "None",
          },
          completedSections,
          applicationType: "advisory",
          version: "2.0",
        },
        { merge: true }
      )
 
      setHasUnsavedChanges(false)
      lastSaved.current = JSON.parse(JSON.stringify(formData))
 
      // Small delay for Firestore consistency before AI matching
      await new Promise((r) => setTimeout(r, 1000))
      await triggerAIMatching(docId)
    } catch (err) {
      console.error("Submit error:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [user, formData, completedSections, documentSelections, existingUniversalDocs, currentDocId])
 
  const triggerAIMatching = async (docId) => {
    try {
      // STEP 1: Count advisor profiles
      let advisorsCount = 0
      try {
        const snapshot = await getDocs(collection(db, "advisorProfiles"))
        advisorsCount = snapshot.size
      } catch (err) {
        console.error("Error counting advisors:", err)
      }

      // STEP 2: Show "Getting Things Ready" for 5 seconds
      setAnalysisProgress({ stage: "gettingReady", advisorsCount })
      await new Promise((r) => setTimeout(r, 5000))

      // STEP 3: Show "Searching For Matches" and start the fetch
      setAnalysisProgress({ stage: "searching", advisorsCount })

      let result
      const controller = new AbortController()

      const fetchPromise = IS_PROD
        ? (async () => {
            const fn = httpsCallable(getFunctions(), "analyzeAdvisorMatches")
            const { data } = await fn({ applicationId: docId })
            return data
          })()
        : (async () => {
            const res = await fetch(LOCAL_MATCHING_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ applicationId: docId }),
              signal: controller.signal,
            })
            if (!res.ok) throw new Error(`Backend error: ${res.status}`)
            return await res.json()
          })()

      // STEP 4: Race — if fetch takes >15s, switch to "Almost There"
      const fifteenSecondTimer = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 15000)
      )

      try {
        await Promise.race([fetchPromise, fifteenSecondTimer])
      } catch (raceErr) {
        if (raceErr.message === "timeout") {
          // 15s elapsed — show "Almost There", then wait for the actual fetch
          setAnalysisProgress({ stage: "wrappingUp" })
          // Abort after 30s total from here (45s overall)
          const abortTimer = setTimeout(() => controller.abort(), 30000)
          controller._timeoutId = abortTimer
          await fetchPromise.catch(() => {})
          clearTimeout(abortTimer)
        }
      }

      setAnalysisComplete(true)

      // After 1.5s, navigate to matches page
      setTimeout(() => {
        setAnalysisProgress(null)
        setAnalysisComplete(false)
        onNavigateToMatches?.()
      }, 1500)
    } catch (err) {
      console.error("AI matching failed:", err)
      setAnalysisProgress(null)
      onNavigateToMatches?.()
    }
  }
 
  // ── Form helpers ──────────────────────────────────────────────────────────────
  const updateFormData = useCallback((_, data) => {
    setFormData((prev) => {
      const next = { ...prev, ...data }
      const changed = JSON.stringify(next) !== JSON.stringify(lastSaved.current)
      setHasUnsavedChanges(changed)
      return next
    })
  }, [])
 
  const handleDocumentSelection = useCallback((docType, choice) => {
    setDocumentSelections((prev) => ({ ...prev, [docType]: choice }))
    const key = `selected${docType.charAt(0).toUpperCase()}${docType.slice(1)}`
    updateFormData(null, { documentUploads: { [key]: choice } })
  }, [updateFormData])
 
  const validate = useCallback(
    (sectionId) => sectionValidations[sectionId]?.(formData) ?? true,
    [formData]
  )
 
  const validateAll = useCallback(
    () => Object.keys(sectionValidations).every((id) => sectionValidations[id](formData)),
    [formData]
  )
 
  const getInvalidSections = useCallback(
    () =>
      sections
        .filter((s) => !sectionValidations[s.id]?.(formData))
        .map((s) => s.label.replace(/\n/g, " ")),
    [formData]
  )
 
  const discardChanges = useCallback(async () => {
    await loadApplication()
  }, [applicationId, user])
 
  return {
    // state
    user,
    formData,
    completedSections,
    documentSelections,
    existingUniversalDocs,
    currentDocId,
    hasUnsavedChanges,
    saveStatus,
    isLoading,
    analysisProgress,
    analysisComplete,
    isSubmitted,
    // actions
    updateFormData,
    handleDocumentSelection,
    saveSectionToFirebase,
    submitApplication,
    discardChanges,
    validate,
    validateAll,
    getInvalidSections,
    setIsSubmitted,
  }
}