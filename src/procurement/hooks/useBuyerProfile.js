"use client"

import { useState, useEffect, useCallback } from "react"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { evaluateBuyerProfileState } from "../UniversalProfile/buyerProfileState"

const LOCAL_STORAGE_KEY = "procurement_buyer_universal_profile_v1"

const INITIAL_PROFILE = {
  organisation: {
    legalName: "Anglo American Inyosi Coal (Pty) Ltd",
    tradingName: "Anglo American Supply Chain",
    industry: "Mining & Metals",
    ownershipGroup: "Anglo American plc",
    operatingGeographies: ["Gauteng", "Mpumalanga", "Limpopo"],
    primaryContact: {
      name: "Sbonelo Khumalo",
      email: "sbonelo.khumalo@anglo.com",
      phone: "+27 11 373 6111",
      siteAddress: "55 Marshall Street, Johannesburg",
    },
  },
  objectives: {
    selectedObjectives: ["pre_vet", "build_pipeline", "improve_onboarding", "manage_esd"],
    successMeasures: {
      targetVerifiedPercent: "85%",
      targetLocalSpendPercent: "45%",
      annualSupplierIntake: "120 suppliers/yr",
    },
  },
  currentEnvironment: {
    primaryERP: "SAP S/4HANA",
    vendorMasterEmail: "vendormaster@anglo.com",
    portalUrl: "https://suppliers.angloamerican.com/registration",
    onboardingInstructions: "Upload CIPC certificate, verified Tax Pin, valid COIDA letter, and banking confirmation less than 3 months old.",
    coexistenceAcknowledged: true,
  },
  demandContext: {
    categories: [
      "Information Technology",
      "Facilities Management",
      "Logistics & Freight",
      "Industrial Equipment & Spares",
    ],
    annualSpendRange: "R 50M - R 250M",
    typicalOrderRange: "R 100k - R 5M",
    localRadius: "50km host community radius",
    deliveryModePreference: "Hybrid",
  },
  requirements: {
    minBBBEELevel: "Level 1 to 4 (Enterprise Baseline)",
    mandatoryCIPC: true,
    mandatoryTax: true,
    mandatoryCOIDA: true,
    mandatoryBank: true,
    minYearsOperating: "1 year",
    sheqRequirement: "High Risk (Mining / Heavy Industrial)",
  },
  decisionProcess: {
    approverRole: "Sbonelo Khumalo (CPO)",
    approvalThreshold: "R 5,000,000",
    technicalReviewer: "Lindelani Dlamini (SHEQ Lead)",
    esdManager: "Nhlanhla Mthembu (ESD Lead)",
  },
  dataConsent: {
    strictEvidenceMinimisation: true,
    agreedToBenchmark: true,
    retentionPeriod: "5 Years (Standard Corporate Audit)",
    policySignedBy: "Sbonelo Khumalo",
  },
}

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
  }
}
