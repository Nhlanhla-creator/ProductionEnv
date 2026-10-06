"use client"

import { useState, useEffect, useCallback } from "react"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { evaluateBuyerProfileState } from "../UniversalProfile/buyerProfileState"

const LOCAL_STORAGE_KEY = "procurement_buyer_universal_profile_v1"

export const COMPLETE_BUYER_PROFILE = {
  organisation: {
    legalName: "Anglo American Inyosi Coal (Pty) Ltd",
    tradingName: "Anglo American Supply Chain & Operations",
    registrationNumber: "2005/012345/07",
    entityType: "Large Corporate / Enterprise",
    industry: "Mining & Metals",
    ownershipGroup: "Anglo American plc",
    headquartersProvince: "Gauteng, South Africa",
    operatingGeographies: ["Gauteng", "Mpumalanga", "Limpopo"],
    primaryContact: {
      name: "Sbonelo Khumalo",
      email: "sbonelo.khumalo@anglo.com",
      phone: "+27 11 373 6111",
      siteAddress: "55 Marshall Street, Johannesburg, 2001",
    },
  },
  objectives: {
    primaryGoal: "esd_development",
    selectedObjectives: ["pre_vet", "build_pipeline", "improve_onboarding", "manage_esd", "fast_track_rfp"],
    targetSpendLocal: "45",
    targetSpendDiverse: "35",
    sourcingHorizon: "immediate",
    successMeasures: {
      targetVerifiedPercent: "85%",
      targetLocalSpendPercent: "45%",
      annualSupplierIntake: "120 qualified suppliers/yr",
    },
    strategicFocusAreas: ["Host Community Sourcing", "Local Black-Owned SMME Incubation", "Zero Environmental Incidents"],
    esgFocus: "High Priority (Decarbonisation, Water Stewardship, Community Safety)",
  },
  demandContext: {
    categories: [
      "PPE & Safety Equipment",
      "Industrial Equipment & Spares",
      "Facilities Management",
      "Logistics & Freight",
      "Electrical Services",
      "Engineering & Fabrication",
    ],
    geographyType: "Provincial (Operational Sites + Host Communities)",
    selectedProvinces: ["Gauteng", "Mpumalanga", "Limpopo"],
    localRadius: "Within 50km host community radius",
    annualSpendRange: "R 50,000,000 - R 250,000,000",
    annualSourcingBudget: "R 180,000,000",
    typicalOrderRange: "R 100,000 - R 5,000,000",
    paymentTerms: "30 Days from Invoice",
    preferredSupplierModel: "preferred_panel",
    deliveryModePreference: "On-Site Delivery with MHSA Escort",
    onboardingInstructions: "Suppliers must maintain verified CIPC status, active SARS Tax PIN, valid COIDA letter of good standing, and MHSA compliant safety files prior to site entry.",
    urgentDemandCategories: ["PPE & Safety Equipment", "Industrial Equipment & Spares"],
  },
  requirements: {
    minBBBEELevel: "Level 1 to 4 (Enterprise Baseline)",
    mandatoryCIPC: true,
    mandatoryTax: true,
    mandatoryCOIDA: true,
    mandatoryBank: true,
    minOperatingYears: "2 years",
    minInsurance: "R 5,000,000 Public Liability",
    sheqRequirement: "High Risk (Mining / Heavy Industrial)",
    requiredAccreditations: [
      "ISO 9001 (Quality Management)",
      "ISO 45001 (Occupational Health & Safety)",
      "Mine Health & Safety Act (MHSA) Compliance",
      "COIDA Letter of Good Standing",
      "SARS Tax Compliance PIN",
    ],
    strictness: "Strict Statutory Hard-Gate (Zero Exceptions)",
    disqualificationRules: "Deregistered CIPC status, expired SARS PIN, or fatal safety non-compliance",
  },
  decisionProcess: {
    approverRole: "Sbonelo Khumalo (Head of Procurement / CPO)",
    procurementOfficerName: "Sbonelo Khumalo",
    procurementOfficerEmail: "approver@anglo.com",
    approvalThreshold: "R 5,000,000 Single Order Limit",
    technicalReviewer: "Lindelani Dlamini (Senior Technical Engineer)",
    technicalReviewerEmail: "sheq@anglo.com",
    esdManager: "Nhlanhla Mthembu (ESD Program Lead)",
    esdManagerEmail: "esd@anglo.com",
    workflowType: "Three-Way Approval Hierarchy (Sourcing, Technical, ESD)",
    conflictOfInterestMandatory: true,
  },
  currentEnvironment: {
    primaryERP: "SAP S/4HANA",
    vendorMasterEmail: "vendormaster@anglo.com",
    portalUrl: "https://suppliers.angloamerican.com/registration",
    portalName: "SAP S/4HANA Vendor Master",
    coexistenceAcknowledged: true,
    zeroScrapingPolicy: true,
    handoffMechanism: "Secure API / Structured CSV Hand-off",
    exportFormat: "CSV / JSON Encrypted Package",
    onboardingInstructions: "Upload CIPC certificate, verified Tax Pin, valid COIDA letter, and banking confirmation less than 3 months old to Anglo American SAP Vendor Portal.",
  },
  dataConsent: {
    strictEvidenceMinimisation: true,
    agreedToBenchmark: true,
    rfpDirectContactAuthorized: true,
    retentionPeriod: "5 Years (Standard Corporate Audit)",
    policySignedBy: "Sbonelo Khumalo",
    signatoryTitle: "Chief Procurement Officer",
    signedAt: new Date().toISOString(),
  },
}

const INITIAL_PROFILE = COMPLETE_BUYER_PROFILE

export function useBuyerProfile() {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return INITIAL_PROFILE
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Fetch from Firestore if user is authenticated
  useEffect(() => {
    const fetchFromFirestore = async () => {
      const user = auth.currentUser
      if (!user) return

      try {
        setLoading(true)
        const docRef = doc(db, "universalProfiles", user.uid)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          const remoteData = snap.data()
          if (remoteData.procurementProfile) {
            setProfile(remoteData.procurementProfile)
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteData.procurementProfile))
          }
        }
      } catch (err) {
        console.warn("[useBuyerProfile] Could not fetch remote profile, using local draft:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchFromFirestore()
  }, [])

  // Update a single section
  const updateSection = useCallback((sectionKey, sectionData) => {
    setProfile((prev) => {
      const next = { ...prev, [sectionKey]: sectionData }
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  // Persist to Firestore and localStorage
  const saveProfile = useCallback(async () => {
    setSaving(true)
    setSaveSuccess(false)

    try {
      // Always save to localStorage for instant client persistence
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile))

      const user = auth.currentUser
      if (user) {
        const docRef = doc(db, "universalProfiles", user.uid)
        await setDoc(
          docRef,
          {
            procurementProfile: profile,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3500)
    } catch (err) {
      console.error("[useBuyerProfile] Failed to save profile:", err)
    } finally {
      setSaving(false)
    }
  }, [profile])

  // One-click seed profile with 100% complete corporate information & passport ruleset
  const seedCompleteProfile = useCallback(async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      setProfile(COMPLETE_BUYER_PROFILE)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(COMPLETE_BUYER_PROFILE))

      const user = auth.currentUser
      if (user) {
        const docRef = doc(db, "universalProfiles", user.uid)
        await setDoc(
          docRef,
          {
            procurementProfile: COMPLETE_BUYER_PROFILE,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3500)
      return true
    } catch (err) {
      console.error("[useBuyerProfile] Failed to seed complete profile:", err)
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  // Evaluated state & completion checklist
  const stateInfo = evaluateBuyerProfileState(profile)

  return {
    profile,
    stateInfo,
    loading,
    saving,
    saveSuccess,
    updateSection,
    saveProfile,
    seedCompleteProfile,
  }
}
