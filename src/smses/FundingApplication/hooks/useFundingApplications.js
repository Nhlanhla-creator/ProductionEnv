"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage"
import { onAuthStateChanged } from "firebase/auth"
import { getFunctions, httpsCallable } from "firebase/functions"

import { db, auth } from "../../../firebaseConfig"

const storage = getStorage()

const USE_CLOUD_FUNCTION = true
const IS_PROD = process.env.NODE_ENV === "production"
const LOCAL_MATCHING_URL = "http://localhost:8000/api/funders/analyze"

const SECTION_LABELS = {
  applicationOverview: "Application Overview",
  useOfFunds: "Use of Funds",
  enterpriseReadiness: "Enterprise Readiness",
  guarantees: "Guarantees",
  growthPotential: "Growth Potential",
  socialImpact: "Social Impact",
  documentUpload: "Document Upload",
  declarationCommitment: "Declaration & Commitment",
}

const SECTION_IDS = Object.keys(SECTION_LABELS)

// Financial Overview belongs to Universal Profile.
// Preserve any previously saved funding data, but do not require an
// invisible financialOverview section for funding submission.
const DOCUMENTS_LIST = [
  { id: "budgetDocuments", label: "5 Year Budget", required: true },
  {
    id: "bankConfirmation",
    label: "Bank Details Confirmation Letter",
    required: true,
  },
  {
    id: "financialStatements",
    label: "Financial Statements",
    required: true,
  },
  { id: "programReports", label: "Previous Program Reports" },
  { id: "loanAgreements", label: "Loan Agreements" },
  { id: "supportLetters", label: "Support Letters / Endorsements" },
  { id: "impactStatement", label: "Impact Statement" },
]

const createEmptyForm = () => ({
  applicationOverview: {
    submissionChannel: "Online Portal",
    applicationDate: new Date().toISOString().split("T")[0],
  },
  useOfFunds: {
    fundingItems: [
      {
        category: "",
        subArea: "",
        description: "",
        amount: "",
      },
    ],
  },
  enterpriseReadiness: {
    barriers: [],
  },
  guarantees: {},
  growthPotential: {},
  socialImpact: {},
  documentUpload: {},
  declarationCommitment: {
    confirmIntent: false,
    commitReporting: false,
    consentShare: false,
  },
})

const createEmptyCompleted = () =>
  Object.fromEntries(SECTION_IDS.map((id) => [id, false]))

const createEmptyUniversalDocs = () => ({
  businessPlan: null,
  pitchDeck: null,
  financialStatements: [],
  loading: true,
})

const present = (value) =>
  value !== undefined &&
  value !== null &&
  String(value).trim() !== ""

const asText = (value) => String(value ?? "").trim()

const isYesNo = (value) => value === "yes" || value === "no"

const isFile = (value) =>
  typeof File !== "undefined" && value instanceof File

const hasDocument = (value) => {
  if (Array.isArray(value)) {
    return value.some(hasDocument)
  }

  if (typeof value === "string") {
    return value.trim().length > 0
  }

  return Boolean(
    value &&
      (isFile(value) ||
        (typeof value.url === "string" && value.url.trim()))
  )
}

const documentUrls = (value) => {
  const entries = Array.isArray(value)
    ? value
    : value
      ? [value]
      : []

  return entries
    .map((entry) =>
      typeof entry === "string" ? entry : entry?.url
    )
    .filter((url) => typeof url === "string" && url.trim())
}

const documentUrl = (value) => documentUrls(value)[0] || null

const parseCurrency = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : NaN
  }

  const cleaned = asText(value)
    .replace(/^R\s*/i, "")
    .replace(/[\s,]/g, "")

  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) {
    return NaN
  }

  return Number(cleaned)
}

const normalizeAmount = (value) => {
  const amount = parseCurrency(value)
  return Number.isFinite(amount) ? amount : 0
}

const normalizeToArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
  }

  if (typeof value === "string") {
    return value
      .split(/\s*,\s*/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

const readableField = (field) =>
  field.replace(/([A-Z])/g, " $1").toLowerCase()

// One validator shared by saving, submission, and the page.
function getIssuesForSection(
  sectionId,
  sectionData = {},
  universalDocs = {}
) {
  const data = sectionData || {}
  const issues = []

  const requireField = (field, label) => {
    if (!present(data[field])) {
      issues.push(`Please provide ${label}.`)
    }
  }

  const requireAnswer = (field, question) => {
    if (!isYesNo(data[field])) {
      issues.push(`Please answer: ${question}`)
    }
  }

  const requireDetails = (answerField, detailsField, label) => {
    if (data[answerField] === "yes") {
      requireField(detailsField, label)
    }
  }

  switch (sectionId) {
    case "applicationOverview": {
      const requiredFields = {
        applicationType: "application type",
        fundingStage: "funding stage",
        urgency: "urgency",
        preferredStartDate: "preferred start date",
      }

      Object.entries(requiredFields).forEach(([field, label]) => {
        requireField(field, label)
      })

      if (
        [
          "acceleration",
          "incubation",
          "enterprise_development",
        ].includes(data.applicationType)
      ) {
        requireField("supportFormat", "support format")
      }

      break
    }

    case "useOfFunds": {
      const requested = parseCurrency(data.amountRequested)
      const personalEquity = parseCurrency(data.personalEquity)

      if (!Number.isFinite(requested) || requested <= 0) {
        issues.push(
          "Total Amount Requested must be greater than R 0."
        )
      }

      if (!Number.isFinite(personalEquity)) {
        issues.push(
          "Enter your personal equity contribution. R 0 is allowed."
        )
      }

      requireField("equityType", "equity offered")
      requireField("fundingCategory", "funding category")

      if (data.fundingCategory === "Other") {
        requireField(
          "fundingCategoryOther",
          "your other funding category"
        )
      }

      // These dropdowns are optional in your supplied UseOfFunds UI.
      // Validate their Other descriptions only when selected.
      if (
        data.fundingCategory !== "Any" &&
        data.fundingCategory !== "Other" &&
        asText(data.fundingInstrument).startsWith("Other")
      ) {
        requireField(
          "fundingInstrumentOther",
          "your other funding instrument"
        )
      }

      if (
        data.fundingCategory !== "Other" &&
        asText(data.preferredFunderType).startsWith("Other")
      ) {
        requireField(
          "preferredFunderTypeOther",
          "your other preferred funder type"
        )
      }

      const items = Array.isArray(data.fundingItems)
        ? data.fundingItems
        : []

      if (items.length === 0) {
        issues.push("Add at least one Purpose of Funds item.")
      }

      items.forEach((item, index) => {
        const row = item || {}
        const prefix = `Purpose of Funds item ${index + 1}`

        if (!present(row.category)) {
          issues.push(`${prefix}: select a category.`)
        }

        if (!present(row.subArea)) {
          issues.push(`${prefix}: select a sub-area.`)
        }

        if (!present(row.description)) {
          issues.push(`${prefix}: enter a description.`)
        }

        const amount = parseCurrency(row.amount)

        if (!Number.isFinite(amount) || amount <= 0) {
          issues.push(
            `${prefix}: amount must be greater than R 0.`
          )
        }
      })

      const amounts = items.map((item) =>
        parseCurrency(item?.amount)
      )

      if (
        Number.isFinite(requested) &&
        amounts.length > 0 &&
        amounts.every(Number.isFinite)
      ) {
        const requestedCents = Math.round(requested * 100)
        const totalCents = amounts.reduce(
          (sum, amount) => sum + Math.round(amount * 100),
          0
        )

        if (requestedCents !== totalCents) {
          issues.push(
            `Total Amount Requested (R ${requested.toLocaleString(
              "en-ZA"
            )}) must equal Purpose of Funds (R ${(
              totalCents / 100
            ).toLocaleString("en-ZA")}).`
          )
        }
      }

      break
    }

    case "enterpriseReadiness": {
      const requiredAnswers = {
        hasBusinessPlan: "Do you have a business plan?",
        hasPitchDeck: "Do you have a pitch deck?",
        hasMvp: "Do you have an MVP/prototype?",
        hasTraction: "Do you have traction?",
        hasGuarantees: "Do you have any guarantees?",
        hasMentor: "Do you have a mentor?",
        hasAdvisors: "Do you have advisors/board?",
        previousSupport: "Have you received support previously?",
        hasPayingCustomers: "Do you currently have paying customers?",
      }

      Object.entries(requiredAnswers).forEach(
        ([field, question]) => requireAnswer(field, question)
      )

      const requiredFiles = [
        {
          answer: "hasBusinessPlan",
          field: "businessPlanFile",
          fallback: universalDocs.businessPlan,
          label: "Business Plan",
        },
        {
          answer: "hasPitchDeck",
          field: "pitchDeckFile",
          fallback: universalDocs.pitchDeck,
          label: "Pitch Deck",
        },
        {
          answer: "hasGuarantees",
          field: "guaranteeFile",
          fallback: null,
          label: "Guarantee / Contract",
        },
      ]

      requiredFiles.forEach(
        ({ answer, field, fallback, label }) => {
          if (
            data[answer] === "yes" &&
            !hasDocument(data[field]) &&
            !hasDocument(fallback)
          ) {
            issues.push(`Upload your ${label}.`)
          }
        }
      )

      const conditionalDetails = [
        ["hasMvp", "mvpDetails", "MVP/prototype details"],
        ["hasTraction", "tractionDetails", "traction details"],
        ["hasMentor", "mentorDetails", "mentor details"],
        ["hasAdvisors", "advisorsDetails", "advisor/board details"],
        [
          "previousSupport",
          "previousSupportDetails",
          "previous support details",
        ],
        [
          "previousSupport",
          "previousSupportSource",
          "previous support source",
        ],
        [
          "hasPayingCustomers",
          "payingCustomersDetails",
          "paying customer details",
        ],
      ]

      conditionalDetails.forEach(([answer, field, label]) => {
        requireDetails(answer, field, label)
      })

      if (data.hasAdvisors === "yes") {
        requireAnswer(
          "advisorsMeetRegularly",
          "Do your advisors meet regularly?"
        )

        requireDetails(
          "advisorsMeetRegularly",
          "advisorsMeetingFrequency",
          "advisor meeting frequency"
        )
      }

      if (
        Array.isArray(data.barriers) &&
        data.barriers.includes("other")
      ) {
        requireField(
          "otherBarrierDetails",
          "details of your other growth barrier"
        )
      }

      // hasFinancials is not present in the supplied Readiness UI.
      // Financial documents remain validated under Document Upload.
      break
    }

    case "guarantees": {
      // Preserve your existing policy: guarantees are optional.
      break
    }

    case "growthPotential": {
      const questions = [
        "marketShare",
        "qualityImprovement",
        "greenTech",
        "localisation",
        "regionalSpread",
        "personalRisk",
        "empowerment",
        "employment",
      ]

      questions.forEach((field) => {
        requireAnswer(field, readableField(field))

        if (field !== "employment") {
          requireDetails(
            field,
            `${field}Details`,
            `${readableField(field)} details`
          )
        }
      })

      if (data.employment === "yes") {
        requireField(
          "employmentIncreaseDirect",
          "direct employment increase"
        )

        requireField(
          "employmentIncreaseIndirect",
          "indirect employment increase"
        )
      }

      break
    }

    case "socialImpact": {
      const requiredFields = {
        jobsToCreate: "jobs to create",
        csiCsrSpend: "CSI/CSR spend",
        blackOwnership: "black ownership percentage",
        womenOwnership: "women ownership percentage",
        youthOwnership: "youth ownership percentage",
        disabledOwnership: "disabled ownership percentage",
      }

      Object.entries(requiredFields).forEach(([field, label]) => {
        requireField(field, label)
      })

      const percentageFields = [
        "blackOwnership",
        "womenOwnership",
        "youthOwnership",
        "disabledOwnership",
      ]

      percentageFields.forEach((field) => {
        if (!present(data[field])) return

        const value = Number(data[field])

        if (
          !Number.isFinite(value) ||
          value < 0 ||
          value > 100
        ) {
          issues.push(
            `${requiredFields[field]} must be between 0 and 100.`
          )
        }
      })

      break
    }

    case "documentUpload": {
      DOCUMENTS_LIST.filter((document) => document.required)
        .forEach((document) => {
          if (!hasDocument(data[document.id])) {
            issues.push(`Upload ${document.label}.`)
          }
        })

      break
    }

    case "declarationCommitment": {
      if (data.confirmIntent !== true) {
        issues.push("Please confirm your funding intent.")
      }

      if (data.commitReporting !== true) {
        issues.push("Please agree to the reporting commitment.")
      }

      if (data.consentShare !== true) {
        issues.push("Please consent to sharing your application.")
      }

      break
    }

    default:
      issues.push(`Unknown funding section: ${sectionId}`)
  }

  return issues
}

const completionForForm = (form, universalDocs) =>
  Object.fromEntries(
    SECTION_IDS.map((id) => [
      id,
      getIssuesForSection(id, form[id], universalDocs).length === 0,
    ])
  )

// Preserve your existing funder filtering.
const normalizeFunder = (docId, data) => {
  const form = data.formData || {}
  const preferences = form.generalInvestmentPreference || {}
  const overview = form.fundManageOverview || {}
  const entity = form.entityOverview || {}
  const contact = form.contactDetails || {}
  const funds = form.fundDetails?.funds || []

  let minTicket = 0
  let maxTicket = 0

  funds.forEach((fund) => {
    const minimum = normalizeAmount(
      fund.minimumTicket || fund.minTicket
    )

    const maximum = normalizeAmount(
      fund.maximumTicket || fund.maxTicket
    )

    if (
      minimum > 0 &&
      (minTicket === 0 || minimum < minTicket)
    ) {
      minTicket = minimum
    }

    if (maximum > maxTicket) {
      maxTicket = maximum
    }
  })

  return {
    id: docId,
    name:
      overview.registeredName ||
      overview.tradingName ||
      contact.registeredName ||
      "Unnamed Funder",
    email: contact.businessEmail || contact.email || "",
    province: entity.province || "",
    city: entity.city || "",
    sectorFocus: normalizeToArray(preferences.sectorFocus),
    investmentStage: normalizeToArray(preferences.investmentStage),
    geographicFocus: normalizeToArray(preferences.geographicFocus),
    selectedProvinces: normalizeToArray(
      preferences.selectedProvinces
    ),
    investmentFocus: preferences.investmentFocus || "",
    minTicket,
    maxTicket,
    supportOffered: normalizeToArray(overview.additionalSupport),
    riskAppetite: preferences.riskAppetite || "",
    legalEntityFit: preferences.legalEntityFit || "",
    briefDescription: overview.briefDescription || "",
    yearsInOperation: overview.yearsInOperation || "",
    numberOfInvestments: overview.numberOfInvestments || "",
    valueDeployed: overview.valueDeployed || "",
  }
}

const passHighLevelFilter = (funder, sme) => {
  if (
    !funder.sectorFocus.length ||
    !funder.investmentStage.length ||
    !funder.investmentFocus
  ) {
    return false
  }

  const sectors = normalizeToArray(sme.economicSectors)
    .map((sector) => sector.toLowerCase())

  if (
    sectors.length &&
    !funder.sectorFocus.some((sector) => {
      const value = sector.toLowerCase().trim()

      return (
        value === "all sectors" ||
        value === "general" ||
        sectors.includes(value)
      )
    })
  ) {
    return false
  }

  if (
    sme.fundingStage &&
    !funder.investmentStage.some(
      (stage) =>
        stage.toLowerCase().trim() ===
        sme.fundingStage.toLowerCase().trim()
    )
  ) {
    return false
  }

  if (sme.amountRequested > 0) {
    if (
      funder.minTicket > 0 &&
      sme.amountRequested < funder.minTicket * 0.5
    ) {
      return false
    }

    if (
      funder.maxTicket > 0 &&
      sme.amountRequested > funder.maxTicket * 2
    ) {
      return false
    }
  }

  return true
}

export const useFundingApplications = ({
  applicationId = null,
  isNew = false,
  onNavigateToMatches,
} = {}) => {
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState(createEmptyForm)
  const [completedSections, setCompletedSections] = useState(
    createEmptyCompleted
  )
  const [currentDocId, setCurrentDocId] = useState(applicationId)
  const [existingUniversalDocs, setExistingUniversalDocs] = useState(
    createEmptyUniversalDocs
  )

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [analysisProgress, setAnalysisProgress] = useState(null)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Refs ensure saves use current form values, including updates from
  // guarantee analysis immediately before saving.
  const formRef = useRef(formData)
  const documentIdRef = useRef(applicationId)
  const universalDocsRef = useRef(existingUniversalDocs)
  const lastSavedRef = useRef(createEmptyForm())
  const operationInFlightRef = useRef(false)

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null)
    })
  }, [])

  const applyForm = useCallback((form, documentId, submitted) => {
    formRef.current = form
    documentIdRef.current = documentId
    lastSavedRef.current = form

    setFormData(form)
    setCurrentDocId(documentId)
    setCompletedSections(
      completionForForm(form, universalDocsRef.current)
    )
    setHasUnsavedChanges(false)
    setIsSubmitted(Boolean(submitted))
    setAnalysisProgress(null)
    setAnalysisComplete(false)
    setSaveStatus("")
  }, [])

  const fetchUniversalProfile = useCallback(async (uid) => {
    const snapshot = await getDoc(
      doc(db, "universalProfiles", uid)
    )

    const profile = snapshot.exists() ? snapshot.data() : {}
    const documents = profile.documents || {}

    const universalDocs = {
      businessPlan: documentUrl(documents.businessPlan),
      pitchDeck: documentUrl(documents.pitchDeck),
      financialStatements: documentUrls(
        documents.financialStatements_multiple ||
          documents.financialStatements
      ),
      loading: false,
    }

    return { profile, universalDocs }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!user) {
        const emptyDocs = {
          ...createEmptyUniversalDocs(),
          loading: false,
        }

        universalDocsRef.current = emptyDocs
        setExistingUniversalDocs(emptyDocs)
        applyForm(createEmptyForm(), null, false)
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      let universalDocs = {
        ...createEmptyUniversalDocs(),
        loading: false,
      }

      try {
        const result = await fetchUniversalProfile(user.uid)
        universalDocs = result.universalDocs
      } catch (error) {
        console.error("Unable to load Universal Profile:", error)
      }

      if (cancelled) return

      universalDocsRef.current = universalDocs
      setExistingUniversalDocs(universalDocs)

      try {
        if (isNew || !applicationId) {
          applyForm(createEmptyForm(), null, false)
          return
        }

        const snapshot = await getDoc(
          doc(db, "fundingApplicationsV2", applicationId)
        )

        if (cancelled) return

        if (!snapshot.exists()) {
          applyForm(createEmptyForm(), null, false)
          return
        }

        const saved = snapshot.data()

        if (saved.userId && saved.userId !== user.uid) {
          throw new Error("This application belongs to another user.")
        }

        const defaults = createEmptyForm()
        const loadedForm = {}

        Object.keys(defaults).forEach((section) => {
          loadedForm[section] = {
            ...defaults[section],
            ...(saved[section] || {}),
          }
        })

        // Preserve historical data without making it a required section.
        if (saved.financialOverview) {
          loadedForm.financialOverview = saved.financialOverview
        }

        applyForm(
          loadedForm,
          applicationId,
          saved.status === "submitted"
        )
      } catch (error) {
        console.error("Unable to load funding application:", error)

        if (!cancelled) {
          setSaveStatus("error")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [
    user,
    applicationId,
    isNew,
    applyForm,
    fetchUniversalProfile,
  ])

  const ensureDocumentId = useCallback(() => {
    if (!documentIdRef.current) {
      // Allocate the ID immediately without creating an empty document.
      const applicationRef = doc(
        collection(db, "fundingApplicationsV2")
      )

      documentIdRef.current = applicationRef.id
      setCurrentDocId(applicationRef.id)
    }

    return documentIdRef.current
  }, [])

  const uploadFilesAndReplaceWithURLs = useCallback(
    async (value, uid, documentId, path) => {
      const uploadRecursive = async (item, itemPath) => {
        if (isFile(item)) {
          // Unique names prevent replacement uploads from overwriting
          // files referenced by an earlier saved application version.
          const uniqueId = doc(
            collection(db, "fundingApplicationsV2")
          ).id

          const safeName = item.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          )

          const fileRef = ref(
            storage,
            `fundingApplications/${uid}/${documentId}/${itemPath}/${uniqueId}-${safeName}`
          )

          await uploadBytes(fileRef, item)
          return getDownloadURL(fileRef)
        }

        if (Array.isArray(item)) {
          return Promise.all(
            item.map((entry, index) =>
              uploadRecursive(entry, `${itemPath}/${index}`)
            )
          )
        }

        if (item && typeof item === "object") {
          const uploaded = {}

          for (const [key, entry] of Object.entries(item)) {
            if (entry !== undefined) {
              uploaded[key] = await uploadRecursive(
                entry,
                `${itemPath}/${key}`
              )
            }
          }

          return uploaded
        }

        return item === undefined ? null : item
      }

      return uploadRecursive(value, path)
    },
    []
  )

  const requestFundabilityAnalysis = useCallback(
    async (uid, documentId, sectionId) => {
      const requestId = doc(
        collection(db, "fundingApplicationsV2")
      ).id

      // Same trigger field used by UniversalProfile.
      // Request only AFTER application data has been saved.
      await setDoc(
        doc(db, "universalProfiles", uid),
        {
          triggerFundabilityEvaluation: true,
          fundabilityEvaluationRequestId: requestId,
          fundabilityEvaluationRequestedAt: serverTimestamp(),
          fundabilityEvaluationApplicationId: documentId,
          fundabilityEvaluationSource: "fundingApplication",
          fundabilityEvaluationSection: sectionId,
        },
        { merge: true }
      )
    },
    []
  )

  const updateFormData = useCallback((section, changes) => {
    const next = {
      ...formRef.current,
      [section]: {
        ...(formRef.current[section] || {}),
        ...changes,
      },
    }

    formRef.current = next
    setFormData(next)

    // Any edit clears the saved completion indicator for that section.
    setCompletedSections((previous) => ({
      ...previous,
      [section]: false,
    }))

    setHasUnsavedChanges(true)
  }, [])

  const getSectionIssues = useCallback((sectionId) => {
    return getIssuesForSection(
      sectionId,
      formRef.current[sectionId],
      universalDocsRef.current
    )
  }, [])

  const getValidationMessages = useCallback(() => {
    return SECTION_IDS.flatMap((sectionId) =>
      getIssuesForSection(
        sectionId,
        formRef.current[sectionId],
        universalDocsRef.current
      ).map(
        (message) => `${SECTION_LABELS[sectionId]}: ${message}`
      )
    )
  }, [])

  const validate = useCallback(
    (sectionId) => getSectionIssues(sectionId).length === 0,
    [getSectionIssues]
  )

  const validateAll = useCallback(
    () => getValidationMessages().length === 0,
    [getValidationMessages]
  )

  const getInvalidSections = useCallback(() => {
    return SECTION_IDS.filter(
      (sectionId) => getSectionIssues(sectionId).length > 0
    ).map((sectionId) => SECTION_LABELS[sectionId])
  }, [getSectionIssues])

  const saveSectionToFirebase = useCallback(
    async (sectionId) => {
      const currentUser = auth.currentUser

      if (!currentUser) {
        throw new Error("Please sign in before saving.")
      }

      if (!SECTION_IDS.includes(sectionId)) {
        throw new Error(`Unknown funding section: ${sectionId}`)
      }

      if (operationInFlightRef.current) {
        throw new Error("Please wait for the current save to finish.")
      }

      operationInFlightRef.current = true
      setSaveStatus("saving")

      try {
        const documentId = ensureDocumentId()
        const applicationRef = doc(
          db,
          "fundingApplicationsV2",
          documentId
        )

        const snapshot = formRef.current
        const originalSection = snapshot[sectionId] || {}
        const issues = getIssuesForSection(
          sectionId,
          originalSection,
          universalDocsRef.current
        )
        const complete = issues.length === 0

        const uploadedSection =
          await uploadFilesAndReplaceWithURLs(
            originalSection,
            currentUser.uid,
            documentId,
            sectionId
          )

        const existing = await getDoc(applicationRef)

        if (
          existing.exists() &&
          existing.data().userId &&
          existing.data().userId !== currentUser.uid
        ) {
          throw new Error("This application belongs to another user.")
        }

        const savedCompletion = {
          ...createEmptyCompleted(),
          ...(existing.exists()
            ? existing.data().completedSections || {}
            : {}),
          [sectionId]: complete,
        }

        await setDoc(
          applicationRef,
          {
            [sectionId]: uploadedSection,
            completedSections: savedCompletion,
            userId: currentUser.uid,
            userEmail: currentUser.email || "",
            status: "in_progress",
            lastUpdated: serverTimestamp(),
            ...(!existing.exists()
              ? { createdAt: serverTimestamp() }
              : {}),
          },
          { merge: true }
        )

        // Record only the section actually saved.
        const nextSaved = {
          ...lastSavedRef.current,
          [sectionId]: uploadedSection,
        }

        lastSavedRef.current = nextSaved

        // Preserve any edits made while upload/save was running.
        const sectionUnchanged =
          formRef.current[sectionId] === originalSection

        if (sectionUnchanged) {
          const nextForm = {
            ...formRef.current,
            [sectionId]: uploadedSection,
          }

          formRef.current = nextForm
          setFormData(nextForm)
        }

        setCompletedSections((previous) => ({
          ...previous,
          [sectionId]: sectionUnchanged ? complete : false,
        }))

        const stillUnsaved = Object.keys(
          formRef.current
        ).some(
          (key) =>
            formRef.current[key] !== lastSavedRef.current[key]
        )

        setHasUnsavedChanges(stillUnsaved)
        setIsSubmitted(false)

        let analysisRequested = false
        let warning = ""

        try {
          await requestFundabilityAnalysis(
            currentUser.uid,
            documentId,
            sectionId
          )

          analysisRequested = true
        } catch (error) {
          console.error(
            "Fundability analysis request failed:",
            error
          )

          warning =
            "Your section was saved, but fundability analysis could not be requested. Save again to retry."
        }

        setSaveStatus(warning ? "saved_with_warning" : "saved")

        return {
          saved: true,
          documentId,
          complete,
          issues,
          analysisRequested,
          warning,
        }
      } catch (error) {
        console.error("Funding section save failed:", error)
        setSaveStatus("error")
        throw error
      } finally {
        operationInFlightRef.current = false
      }
    },
    [
      ensureDocumentId,
      uploadFilesAndReplaceWithURLs,
      requestFundabilityAnalysis,
    ]
  )

  const triggerAIMatching = useCallback(
    async (documentId, submittedForm, entityOverview, uid) => {
      let progressTimer
      let abortTimer

      try {
        setAnalysisComplete(false)

        const category = submittedForm.useOfFunds?.fundingCategory
        const selectedInstrument =
          submittedForm.useOfFunds?.fundingInstrument

        const instrument =
          asText(selectedInstrument).startsWith("Other")
            ? submittedForm.useOfFunds?.fundingInstrumentOther
            : selectedInstrument

        const fundingInstruments =
          category === "Any" || category === "Other"
            ? []
            : instrument
              ? [instrument]
              : normalizeToArray(
                  submittedForm.useOfFunds?.fundingInstruments
                )

        const sme = {
          smeId: uid,
          applicationId: documentId,
          economicSectors: entityOverview.economicSectors || [],
          province: entityOverview.province || "",
          location: entityOverview.location || "",
          businessDescription:
            entityOverview.businessDescription ||
            entityOverview.briefDescription ||
            "",
          fundingStage:
            submittedForm.applicationOverview?.fundingStage || "",
          amountRequested: normalizeAmount(
            submittedForm.useOfFunds?.amountRequested
          ),
          fundingCategory: category || "",
          fundingInstruments,
          preferredFunderType:
            submittedForm.useOfFunds?.preferredFunderType || "",
          supportNeeded:
            submittedForm.applicationOverview?.supportFormat
              ? [submittedForm.applicationOverview.supportFormat]
              : [],
        }

        const funderSnapshot = await getDocs(
          collection(db, "MyuniversalProfiles")
        )

        const allFunders = funderSnapshot.docs.map((snapshot) =>
          normalizeFunder(snapshot.id, snapshot.data())
        )

        const filteredFunders = allFunders.filter((funder) =>
          passHighLevelFilter(funder, sme)
        )

        const totalCount = allFunders.length

        setAnalysisProgress({
          stage: "searching",
          fundersCount: totalCount,
        })

        // This changes the displayed stage, without swallowing failures.
        progressTimer = setTimeout(() => {
          setAnalysisProgress({
            stage: "wrappingUp",
            fundersCount: totalCount,
          })
        }, 15000)

        if (USE_CLOUD_FUNCTION || IS_PROD) {
          const analyzeMatches = httpsCallable(
            getFunctions(),
            "analyzeFundingMatches"
          )

          // Preserve the existing callable contract.
          // Its backend must read the current fields from the saved app.
          await analyzeMatches({ applicationId: documentId })
        } else {
          const controller = new AbortController()

          abortTimer = setTimeout(
            () => controller.abort(),
            45000
          )

          const response = await fetch(LOCAL_MATCHING_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              applicationId: documentId,
              funders: filteredFunders,
              totalCount,
            }),
            signal: controller.signal,
          })

          if (!response.ok) {
            const errorBody = await response
              .json()
              .catch(() => ({}))

            throw new Error(
              errorBody.error ||
                "Failed to analyze funding matches."
            )
          }

          await response.json()
        }

        setAnalysisComplete(true)
        setAnalysisProgress(null)
      } catch (error) {
        setAnalysisComplete(false)
        setAnalysisProgress(null)
        throw error
      } finally {
        clearTimeout(progressTimer)
        clearTimeout(abortTimer)
      }
    },
    []
  )

  const submitApplication = useCallback(async () => {
    const currentUser = auth.currentUser

    if (!currentUser) {
      throw new Error("Please sign in before submitting.")
    }

    if (operationInFlightRef.current) {
      throw new Error("Please wait for the current save to finish.")
    }

    operationInFlightRef.current = true
    setIsLoading(true)
    setAnalysisComplete(false)
    setAnalysisProgress({
      stage: "gettingReady",
      fundersCount: 0,
    })

    let applicationSaved = false

    try {
      // Refresh profile documents for final validation.
      const { profile, universalDocs } =
        await fetchUniversalProfile(currentUser.uid)

      universalDocsRef.current = universalDocs
      setExistingUniversalDocs(universalDocs)

      const snapshot = formRef.current

      const messages = SECTION_IDS.flatMap((sectionId) =>
        getIssuesForSection(
          sectionId,
          snapshot[sectionId],
          universalDocs
        ).map(
          (message) => `${SECTION_LABELS[sectionId]}: ${message}`
        )
      )

      if (messages.length) {
        const error = new Error(
          "Please complete the required application fields."
        )

        error.validationMessages = messages
        throw error
      }

      const documentId = ensureDocumentId()
      const applicationRef = doc(
        db,
        "fundingApplicationsV2",
        documentId
      )

      const existing = await getDoc(applicationRef)

      if (
        existing.exists() &&
        existing.data().userId &&
        existing.data().userId !== currentUser.uid
      ) {
        throw new Error("This application belongs to another user.")
      }

      const uploaded = {}

      for (const [sectionId, sectionData] of Object.entries(
        snapshot
      )) {
        uploaded[sectionId] =
          await uploadFilesAndReplaceWithURLs(
            sectionData || {},
            currentUser.uid,
            documentId,
            sectionId
          )
      }

      // Include existing profile documents in saved Readiness data
      // where no application-specific replacement was supplied.
      const readiness = uploaded.enterpriseReadiness || {}

      if (
        readiness.hasBusinessPlan === "yes" &&
        !hasDocument(readiness.businessPlanFile) &&
        hasDocument(universalDocs.businessPlan)
      ) {
        readiness.businessPlanFile = [
          universalDocs.businessPlan,
        ]
      }

      if (
        readiness.hasPitchDeck === "yes" &&
        !hasDocument(readiness.pitchDeckFile) &&
        hasDocument(universalDocs.pitchDeck)
      ) {
        readiness.pitchDeckFile = [
          universalDocs.pitchDeck,
        ]
      }

      uploaded.enterpriseReadiness = readiness

      const completed = completionForForm(
        uploaded,
        universalDocs
      )

      const entityOverview = profile.entityOverview || {}

      await setDoc(
        applicationRef,
        {
          ...uploaded,
          entityOverview,
          userId: currentUser.uid,
          userEmail: currentUser.email || "",
          status: "submitted",
          submittedAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          ...(!existing.exists()
            ? { createdAt: serverTimestamp() }
            : {}),
          completedSections: completed,
          applicationType: "funding",
          version: "2.0",
        },
        { merge: true }
      )

      applicationSaved = true
      lastSavedRef.current = uploaded

      // Preserve edits made during the submission operation.
      const nextForm = { ...formRef.current }
      const nextCompleted = { ...completed }

      for (const sectionId of Object.keys(uploaded)) {
        if (
          formRef.current[sectionId] === snapshot[sectionId]
        ) {
          nextForm[sectionId] = uploaded[sectionId]
        } else {
          nextCompleted[sectionId] = false
        }
      }

      formRef.current = nextForm
      setFormData(nextForm)
      setCompletedSections(nextCompleted)
      setHasUnsavedChanges(
        Object.keys(nextForm).some(
          (key) => nextForm[key] !== uploaded[key]
        )
      )
      setIsSubmitted(true)

      let analysisWarning = ""

      try {
        await requestFundabilityAnalysis(
          currentUser.uid,
          documentId,
          "submission"
        )
      } catch (error) {
        console.error(
          "Fundability request after submission failed:",
          error
        )

        analysisWarning =
          "Your application was submitted, but fundability analysis could not be requested."
      }

      await triggerAIMatching(
        documentId,
        uploaded,
        entityOverview,
        currentUser.uid
      )

      // Navigation failures do not change submission/matching status.
      try {
        onNavigateToMatches?.()
      } catch (error) {
        console.error("Unable to navigate to matches:", error)
      }

      return {
        submitted: true,
        documentId,
        warning: analysisWarning,
      }
    } catch (error) {
      setAnalysisProgress(null)

      if (applicationSaved) {
        const matchingError = new Error(
          "Your application was submitted, but funding matching failed. Please retry matching."
        )

        matchingError.applicationSubmitted = true
        matchingError.cause = error
        throw matchingError
      }

      throw error
    } finally {
      operationInFlightRef.current = false
      setIsLoading(false)
    }
  }, [
    fetchUniversalProfile,
    ensureDocumentId,
    uploadFilesAndReplaceWithURLs,
    requestFundabilityAnalysis,
    triggerAIMatching,
    onNavigateToMatches,
  ])

  const discardChanges = useCallback(async () => {
    const currentUser = auth.currentUser
    const documentId = documentIdRef.current

    if (!currentUser || !documentId) {
      applyForm(createEmptyForm(), null, false)
      return
    }

    const snapshot = await getDoc(
      doc(db, "fundingApplicationsV2", documentId)
    )

    if (!snapshot.exists()) {
      applyForm(createEmptyForm(), null, false)
      return
    }

    const saved = snapshot.data()
    const defaults = createEmptyForm()
    const restored = {}

    Object.keys(defaults).forEach((sectionId) => {
      restored[sectionId] = {
        ...defaults[sectionId],
        ...(saved[sectionId] || {}),
      }
    })

    if (saved.financialOverview) {
      restored.financialOverview = saved.financialOverview
    }

    applyForm(
      restored,
      documentId,
      saved.status === "submitted"
    )
  }, [applyForm])

  return {
    user,
    formData,
    completedSections,
    currentDocId,
    existingUniversalDocs,
    hasUnsavedChanges,
    saveStatus,
    isLoading,
    analysisProgress,
    analysisComplete,
    isSubmitted,

    updateFormData,
    saveSectionToFirebase,
    submitApplication,
    discardChanges,

    validate,
    validateAll,
    getSectionIssues,
    getValidationMessages,
    getInvalidSections,

    setIsSubmitted,
    setCompletedSections,
  }
}