"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from "firebase/firestore"
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getFunctions, httpsCallable } from "firebase/functions"
import { db, auth } from "../../../firebaseConfig"

const IS_PROD = process.env.NODE_ENV === "production"
const LOCAL_MATCHING_URL = "http://localhost:8000/api/funders/analyze"
const USE_CLOUD_FUNCTION = true // Set to false to switch back to local backend for matching in dev environment

const storage = getStorage()

// ── Normalization & Filtering Helpers ─────────────────────────────────────────
function normalizeToArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.trim();
    if (!cleaned) return [];
    return cleaned.split(/\s*,\s*/).map(i => i.trim()).filter(Boolean);
  }
  return [];
}

function normalizeAmount(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const cleaned = value.toString().replace(/[R$,\s]/g, "").replace(/[^\d.]/g, "");
  return parseFloat(cleaned) || 0;
}

function funderIsComplete(funder) {
  return funder.sectorFocus?.length > 0 && funder.investmentStage?.length > 0 && funder.investmentFocus;
}

const hasSectorOverlap = (smeSectors, funderSectors) => {
  if (!smeSectors || smeSectors.length === 0) return true;
  if (!funderSectors || funderSectors.length === 0) return false;
  
  const smeSet = new Set(smeSectors.map(s => s.toLowerCase().trim()));
  return funderSectors.some(fs => {
    const cleanFs = fs.toLowerCase().trim();
    return cleanFs === "all sectors" || cleanFs === "general" || smeSet.has(cleanFs);
  });
};

const hasStageOverlap = (smeStage, funderStages) => {
  if (!smeStage) return true;
  if (!funderStages || funderStages.length === 0) return false;
  
  const cleanSme = smeStage.toLowerCase().trim();
  return funderStages.some(fs => fs.toLowerCase().trim() === cleanSme);
};

const ticketSizeFits = (amountRequested, minTicket, maxTicket) => {
  if (!amountRequested || amountRequested <= 0) return true;
  if (minTicket <= 0 && maxTicket <= 0) return true;
  
  if (minTicket > 0 && amountRequested < minTicket * 0.5) return false;
  if (maxTicket > 0 && amountRequested > maxTicket * 2.0) return false;
  return true;
};

const passHighLevelFilter = (funder, sme) => {
  if (!funderIsComplete(funder)) return false;
  
  const smeSectors = normalizeToArray(sme.economicSectors);
  if (!hasSectorOverlap(smeSectors, funder.sectorFocus)) return false;
  
  if (!hasStageOverlap(sme.fundingStage, funder.investmentStage)) return false;
  
  if (!ticketSizeFits(sme.amountRequested, funder.minTicket, funder.maxTicket)) return false;
  
  return true;
};

const normalizeFunder = (docId, data) => {
  const fd = data.formData || {};
  const generalPrefs = fd.generalInvestmentPreference || {};
  const fundManage = fd.fundManageOverview || {};
  const entity = fd.entityOverview || {};
  const contact = fd.contactDetails || {};
  const funds = fd.fundDetails?.funds || [];

  const sectorFocus = normalizeToArray(generalPrefs.sectorFocus);
  const investmentStage = normalizeToArray(generalPrefs.investmentStage);
  const geographicFocus = normalizeToArray(generalPrefs.geographicFocus);
  const selectedProvinces = normalizeToArray(generalPrefs.selectedProvinces);
  const investmentFocus = generalPrefs.investmentFocus || "";

  let minTicket = 0;
  let maxTicket = 0;
  funds.forEach(f => {
    const fMin = normalizeAmount(f.minimumTicket || f.minTicket);
    const fMax = normalizeAmount(f.maximumTicket || f.maxTicket);
    if (fMin > 0 && (minTicket === 0 || fMin < minTicket)) minTicket = fMin;
    if (fMax > 0 && fMax > maxTicket) maxTicket = fMax;
  });

  const supportOffered = normalizeToArray(fundManage.additionalSupport);

  return {
    id: docId,
    name: fundManage.registeredName || fundManage.tradingName || contact.registeredName || "Unnamed Funder",
    email: contact.businessEmail || contact.email || "",
    province: entity.province || "",
    city: entity.city || "",
    sectorFocus,
    investmentStage,
    geographicFocus,
    selectedProvinces,
    investmentFocus,
    minTicket,
    maxTicket,
    supportOffered,
    riskAppetite: generalPrefs.riskAppetite || "",
    legalEntityFit: generalPrefs.legalEntityFit || "",
    briefDescription: fundManage.briefDescription || "",
    yearsInOperation: fundManage.yearsInOperation || "",
    numberOfInvestments: fundManage.numberOfInvestments || "",
    valueDeployed: fundManage.valueDeployed || "",
  };
};


const EMPTY_FORM = {
  applicationOverview: {
    submissionChannel: "Online Portal",
    applicationDate: new Date().toISOString().split("T")[0],
  },
  useOfFunds: {
    fundingItems: [{ category: "", subArea: "", description: "", amount: "" }],
  },
  enterpriseReadiness: { barriers: [] },
  financialOverview: {},
  guarantees: {},
  growthPotential: {},
  socialImpact: {},
  documentUpload: {},
  declarationCommitment: {
    confirmIntent: false,
    commitReporting: false,
    consentShare: false,
  },
}

const EMPTY_COMPLETED = {
  applicationOverview: false,
  useOfFunds: false,
  enterpriseReadiness: false,
  financialOverview: false,
  guarantees: false,
  growthPotential: false,
  socialImpact: false,
  documentUpload: false,
  declarationCommitment: false,
}

const documentsList = [
  { id: "budgetDocuments", label: "5 Year Budget", required: true },
  { id: "bankConfirmation", label: "Bank Details Confirmation Letter", required: true },
  { id: "financialStatements", label: "Financial Statements", required: true },
  { id: "programReports", label: "Previous Program Reports", required: false },
  { id: "loanAgreements", label: "Loan Agreements", required: false },
  { id: "supportLetters", label: "Support Letters / Endorsements", required: false },
  { id: "impactStatement", label: "Optional Impact Statement", required: false },
]

const sectionValidations = {
  applicationOverview: (data) => {
    const required = ["applicationType", "fundingStage", "urgency", "preferredStartDate"]
    return required.every((f) => data?.[f] !== undefined && data?.[f] !== null && data?.[f] !== "")
  },
  useOfFunds: (data) => {
    if (!data || !Array.isArray(data.fundingItems) || data.fundingItems.length === 0) return false
    const allItemsValid = data.fundingItems.every(
      (item) => item.category?.trim() && item.subArea?.trim() && item.description?.trim() && item.amount?.trim()
    )
    if (!allItemsValid) return false
    if (!Array.isArray(data.fundingInstruments) || data.fundingInstruments.length === 0) return false
    if (!Array.isArray(data.funderTypes) || data.funderTypes.length === 0) return false
    const parse = (val) => Number.parseInt((val || "").replace(/[^\d]/g, "")) || 0
    const requested = parse(data.amountRequested)
    const total = (data.fundingItems || []).reduce((sum, item) => sum + parse(item.amount), 0)
    if (requested !== total || requested <= 0) return false
    if (!data.personalEquity || isNaN(parse(data.personalEquity))) return false
    return true
  },
  enterpriseReadiness: (data) => {
    if (!data) return false
    const requiredRadios = [
      "hasBusinessPlan", "hasFinancials", "hasPitchDeck", "hasMvp",
      "hasTraction", "hasGuarantees", "hasMentor", "hasAdvisors",
      "previousSupport", "hasPayingCustomers",
    ]
    for (const field of requiredRadios) {
      if (!data[field]) return false
    }
    if (data.hasBusinessPlan === "yes" && (!Array.isArray(data.businessPlanFile) || data.businessPlanFile.length === 0)) return false
    if (data.hasFinancials === "yes" && (!Array.isArray(data.financialsFile) || data.financialsFile.length === 0)) return false
    if (data.hasPitchDeck === "yes" && (!Array.isArray(data.pitchDeckFile) || data.pitchDeckFile.length === 0)) return false
    if (data.hasMvp === "yes" && !data.mvpDetails?.trim()) return false
    if (data.hasTraction === "yes" && !data.tractionDetails?.trim()) return false
    if (data.hasGuarantees === "yes" && (!Array.isArray(data.guaranteeFile) || data.guaranteeFile.length === 0)) return false
    if (data.hasMentor === "yes" && !data.mentorDetails?.trim()) return false
    if (data.hasAdvisors === "yes") {
      if (!data.advisorsDetails?.trim()) return false
      if (!data.advisorsMeetRegularly) return false
      if (data.advisorsMeetRegularly === "yes" && !data.advisorsMeetingFrequency?.trim()) return false
    }
    if ((data.barriers || []).includes("other") && !data.otherBarrierDetails?.trim()) return false
    if (data.previousSupport === "yes" && (!data.previousSupportDetails?.trim() || !data.previousSupportSource?.trim())) return false
    if (data.hasPayingCustomers === "yes" && !data.payingCustomersDetails?.trim()) return false
    return true
  },
  financialOverview: (data) => {
    const required = ["generatesRevenue", "profitabilityStatus", "hasAccountingSoftware"]
    const basic = required.every((f) => data?.[f] !== undefined && data?.[f] !== null && data?.[f] !== "")
    if (!basic) return false
    if (data.generatesRevenue === "yes" && (!data.annualRevenue || data.annualRevenue === "")) return false
    return true
  },
  guarantees: () => true,
  growthPotential: (data) => {
    const required = ["marketShare", "qualityImprovement", "greenTech", "localisation", "regionalSpread", "personalRisk", "empowerment", "employment"]
    const radioValid = required.every((f) => data?.[f] === "yes" || data?.[f] === "no")
    if (!radioValid) return false
    if (data.marketShare === "yes" && !data.marketShareDetails?.trim()) return false
    if (data.qualityImprovement === "yes" && !data.qualityImprovementDetails?.trim()) return false
    if (data.greenTech === "yes" && !data.greenTechDetails?.trim()) return false
    if (data.localisation === "yes" && !data.localisationDetails?.trim()) return false
    if (data.regionalSpread === "yes" && !data.regionalSpreadDetails?.trim()) return false
    if (data.personalRisk === "yes" && !data.personalRiskDetails?.trim()) return false
    if (data.empowerment === "yes" && !data.empowermentDetails?.trim()) return false
    if (data.employment === "yes") {
      if (data.employmentIncreaseDirect === undefined || data.employmentIncreaseDirect === null || data.employmentIncreaseDirect === "") return false
      if (data.employmentIncreaseIndirect === undefined || data.employmentIncreaseIndirect === null || data.employmentIncreaseIndirect === "") return false
    }
    return true
  },
  socialImpact: (data) => {
    const required = ["jobsToCreate", "csiCsrSpend", "blackOwnership", "womenOwnership", "youthOwnership", "disabledOwnership"]
    const basic = required.every((f) => data?.[f] !== undefined && data?.[f] !== null && data?.[f] !== "")
    if (!basic) return false
    const pctFields = ["blackOwnership", "womenOwnership", "youthOwnership", "disabledOwnership"]
    const pctValid = pctFields.every((f) => {
      const v = Number.parseFloat(data[f])
      return !isNaN(v) && v >= 0 && v <= 100
    })
    return pctValid
  },
  documentUpload: (data) => {
    const required = documentsList.filter((d) => d.required)
    return required.every((doc) => {
      const files = data?.[doc.id] || []
      return files.length > 0
    })
  },
  declarationCommitment: (data) => {
    if (!data) return false
    return data.confirmIntent === true && data.commitReporting === true && data.consentShare === true
  },
}

export const useFundingApplications = ({
  applicationId = null,
  isNew = false,
  onNavigateToMatches,
} = {}) => {
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [completedSections, setCompletedSections] = useState(EMPTY_COMPLETED)
  const [currentDocId, setCurrentDocId] = useState(applicationId)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(null)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const lastSaved = useRef(JSON.parse(JSON.stringify(EMPTY_FORM)))

  // ── Auth ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null))
    return unsub
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
    setFormData(JSON.parse(JSON.stringify(EMPTY_FORM)))
    setCompletedSections({ ...EMPTY_COMPLETED })
    setCurrentDocId(null)
    setHasUnsavedChanges(false)
    setIsSubmitted(false)
    lastSaved.current = JSON.parse(JSON.stringify(EMPTY_FORM))
  }

  const applyLoadedData = (data, docId) => {
    const form = {}
    Object.keys(EMPTY_FORM).forEach((key) => {
      form[key] = data[key] ? { ...EMPTY_FORM[key], ...data[key] } : { ...EMPTY_FORM[key] }
    })
    setFormData(form)
    lastSaved.current = JSON.parse(JSON.stringify(form))

    const completed = data.completedSections || {}
    setCompletedSections({ ...EMPTY_COMPLETED, ...completed })
    setCurrentDocId(docId)
    setHasUnsavedChanges(false)

    if (data.status === "submitted") setIsSubmitted(true)
  }

  const loadApplication = async () => {
    if (!user || !applicationId) return
    try {
      setIsLoading(true)
      const snap = await getDoc(doc(db, "fundingApplicationsV2", applicationId))
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
    const docRef = await addDoc(collection(db, "fundingApplicationsV2"), {
      userId: user.uid,
      userEmail: user.email,
      status: "in_progress",
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    })
    setCurrentDocId(docRef.id)
    return docRef.id
  }

  // ── Upload files and replace with URLs ──────────────────────────────────────
  const uploadFilesAndReplaceWithURLs = async (data, pathPrefix) => {
    const uploadRecursive = async (item, prefix) => {
      if (item instanceof File) {
        const fileRef = ref(storage, `fundingApplications/${currentDocId || "new"}/${prefix}`)
        await uploadBytes(fileRef, item)
        return await getDownloadURL(fileRef)
      } else if (Array.isArray(item)) {
        return await Promise.all(item.map((entry, idx) => uploadRecursive(entry, `${prefix}/${idx}`)))
      } else if (typeof item === "object" && item !== null) {
        const updated = {}
        for (const key in item) {
          updated[key] = await uploadRecursive(item[key], `${prefix}/${key}`)
        }
        return updated
      } else {
        return item
      }
    }
    return await uploadRecursive(data, pathPrefix)
  }

  // ── Save section ──────────────────────────────────────────────────────────────
  const saveSectionToFirebase = useCallback(
    async (sectionName, markCompleted = false) => {
      if (!user) return false
      try {
        setSaveStatus("saving")
        const docId = await ensureDocId()
        const docRef = doc(db, "fundingApplicationsV2", docId)

        const base = {
          lastUpdated: serverTimestamp(),
          userId: user.uid,
          userEmail: user.email,
          status: "in_progress",
        }

        const sectionData = formData[sectionName] || {}
        const uploaded = await uploadFilesAndReplaceWithURLs(sectionData, `${sectionName}`)

        let payload = { ...base, [sectionName]: uploaded }

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
    // Show progress overlay immediately during file uploads / preparation
    setAnalysisProgress({ stage: "gettingReady", fundersCount: 0 })
    try {
      const docId = await ensureDocId()

      // Fetch user's entityOverview from universalProfiles
      let entityOverview = {}
      try {
        const upSnap = await getDoc(doc(db, "universalProfiles", user.uid))
        if (upSnap.exists()) {
          entityOverview = upSnap.data().entityOverview || {}
        }
      } catch (err) {
        console.error("Error fetching universal profile on submission:", err)
      }

      // Upload all sections
      const uploadedData = {}
      for (const key of Object.keys(EMPTY_FORM)) {
        uploadedData[key] = await uploadFilesAndReplaceWithURLs(formData[key] || {}, key)
      }

      const docRef = doc(db, "fundingApplicationsV2", docId)
      await setDoc(
        docRef,
        {
          ...uploadedData,
          entityOverview,
          userId: user.uid,
          userEmail: user.email,
          status: "submitted",
          submittedAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          completedSections,
          applicationType: "funding",
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
      setAnalysisProgress(null)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [user, formData, completedSections, currentDocId])

  const triggerAIMatching = (docId) => {
    return new Promise(async (resolve) => {
      try {
        // 1. Fetch SME Universal Profile to get entityOverview (sectors, description, etc)
        let entityOverview = {}
        try {
          const upSnap = await getDoc(doc(db, "universalProfiles", user.uid))
          if (upSnap.exists()) {
            entityOverview = upSnap.data().entityOverview || {}
          }
        } catch (err) {
          console.error("Error fetching universal profile for AI matching:", err)
        }

        // Construct SME profile data
        const sme = {
          smeId: user.uid,
          applicationId: docId,
          economicSectors: entityOverview.economicSectors || [],
          province: entityOverview.province || "",
          location: entityOverview.location || "",
          businessDescription: entityOverview.businessDescription || entityOverview.briefDescription || "",
          fundingStage: formData.applicationOverview?.fundingStage || "",
          amountRequested: normalizeAmount(formData.useOfFunds?.amountRequested),
          fundingInstruments: formData.useOfFunds?.fundingInstruments || [],
          supportNeeded: formData.applicationOverview?.supportFormat ? [formData.applicationOverview.supportFormat] : [],
        }

        // 2. Fetch all funder profiles
        let allFunders = []
        try {
          const snapshot = await getDocs(collection(db, "MyuniversalProfiles"))
          snapshot.forEach((d) => {
            const normalized = normalizeFunder(d.id, d.data())
            allFunders.push(normalized)
          })
        } catch (err) {
          console.error("Error fetching funder profiles:", err)
        }

        const totalCount = allFunders.length

        // 3. High-level filtering
        const filteredFunders = allFunders.filter((funder) => passHighLevelFilter(funder, sme))

        // Update progress overlay with actual funder count
        setAnalysisProgress({ stage: "gettingReady", fundersCount: totalCount })
        await new Promise((r) => setTimeout(r, 5000))

        // STEP 3: Show "Searching For Matches" and start the fetch
        setAnalysisProgress({ stage: "searching", fundersCount: totalCount })

        const controller = new AbortController()

        const fetchPromise = (USE_CLOUD_FUNCTION || IS_PROD)
          ? (async () => {
              const fn = httpsCallable(getFunctions(), "analyzeFundingMatches")
              const { data } = await fn({ applicationId: docId })
              return data
            })()
          : (async () => {
              const response = await fetch(LOCAL_MATCHING_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  applicationId: docId,
                  funders: filteredFunders,
                  totalCount: totalCount,
                }),
                signal: controller.signal,
              })
              if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to analyze funding matches")
              }
              const data = await response.json()
              return data
            })()

        // STEP 4: Race — if fetch takes >15s, switch to "Almost There"
        const fifteenSecondTimer = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 15000)
        )

        try {
          await Promise.race([fetchPromise, fifteenSecondTimer])
        } catch (raceErr) {
          if (raceErr.message === "timeout") {
            setAnalysisProgress({ stage: "wrappingUp" })
            const abortTimer = setTimeout(() => controller.abort(), 30000)
            controller._timeoutId = abortTimer
            await fetchPromise.catch(() => {})
            clearTimeout(abortTimer)
          }
        }

        setAnalysisComplete(true)

        // After 1.5s, trigger redirection and resolve promise
        setTimeout(() => {
          setAnalysisProgress(null)
          setAnalysisComplete(false)
          onNavigateToMatches?.()
          resolve()
        }, 1500)
      } catch (err) {
        console.error("AI matching failed:", err)
        setAnalysisProgress(null)
        onNavigateToMatches?.()
        resolve()
      }
    })
  }

  // ── Form helpers ──────────────────────────────────────────────────────────────
  const updateFormData = useCallback((section, data) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        [section]: { ...(prev[section] || {}), ...data },
      }
      const changed = JSON.stringify(next) !== JSON.stringify(lastSaved.current)
      setHasUnsavedChanges(changed)
      return next
    })
  }, [])

  const validate = useCallback(
    (sectionId) => sectionValidations[sectionId]?.(formData[sectionId]) ?? true,
    [formData]
  )

  const validateAll = useCallback(
    () => Object.keys(sectionValidations).every((id) => sectionValidations[id](formData[id])),
    [formData]
  )

  const getInvalidSections = useCallback(() => {
    const sectionLabels = {
      applicationOverview: "Application Overview",
      useOfFunds: "Use of Funds",
      enterpriseReadiness: "Enterprise Readiness",
      financialOverview: "Financial Overview",
      guarantees: "Guarantees",
      growthPotential: "Growth Potential",
      socialImpact: "Social Impact",
      documentUpload: "Document Upload",
      declarationCommitment: "Declaration & Commitment",
    }
    return Object.entries(sectionValidations)
      .filter(([id]) => !sectionValidations[id](formData[id]))
      .map(([id]) => sectionLabels[id] || id)
  }, [formData])

  const discardChanges = useCallback(async () => {
    await loadApplication()
  }, [applicationId, user])

  return {
    // state
    user,
    formData,
    completedSections,
    currentDocId,
    hasUnsavedChanges,
    saveStatus,
    isLoading,
    analysisProgress,
    analysisComplete,
    isSubmitted,
    // actions
    updateFormData,
    saveSectionToFirebase,
    submitApplication,
    discardChanges,
    validate,
    validateAll,
    getInvalidSections,
    setIsSubmitted,
    setCompletedSections,
  }
}