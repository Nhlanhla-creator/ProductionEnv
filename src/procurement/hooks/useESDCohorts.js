"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"

const LOCAL_STORAGE_COHORTS_KEY = "procurement_esd_cohorts_v1"

const INITIAL_COHORTS = [
  {
    id: "cohort_mining_2026",
    name: "2026 Host Community Mining Consumables Accelerator",
    sponsor: "Anglo American Enterprise Development Fund",
    objective: "Develop local Black-owned manufacturers and safety equipment suppliers to achieve Tier 1 commercial readiness for mine shutdown tenders.",
    category: "Industrial Equipment & PPE",
    sites: ["Gauteng", "Mpumalanga (Witbank Site)"],
    startDate: "2026-03-01",
    endDate: "2026-11-30",
    budgetEnvelope: "R 4,500,000",
    owner: "Nhlanhla Mthembu (ESD Lead)",
    status: "Active", // Active | Planned | Graduated
    members: [
      {
        supplierId: "sup_ppe_01",
        supplierName: "Bokamoso Safety & Industrial PPE (Pty) Ltd",
        category: "PPE & Safety Equipment",
        location: "Witbank, Mpumalanga",
        baselineScore: 54,
        currentScore: 78,
        baselineCoverage: 60,
        currentCoverage: 90,
        primaryConstraint: "Capability (ISO 45001 Certification)",
        activeIntervention: "ISO 45001 Audit Readiness & SHEQ Coaching",
        commercialStage: "Tendered", // Matched | Introduced | Tendered | Portal Submission | Buyer Registration | Awarded | No Progression
        entryDate: "2026-03-15",
        interventions: [
          {
            id: "int_01",
            gap: "Lack of accredited ISO 45001 Occupational Health certification",
            intervention: "SHEQ Systems Coaching & Pre-audit Assessment",
            provider: "SABS Technical Advisory Services",
            owner: "Nhlanhla Mthembu",
            dueDate: "2026-08-30",
            evidenceRequired: "Stage 2 SABS Audit Clearance Certificate",
            fundingSource: "Sponsor Grant (R 120,000)",
            status: "Completed",
          },
          {
            id: "int_02",
            gap: "Order fulfillment working capital for bulk reflective wear",
            intervention: "Revolving Purchase Order Working Capital Facility",
            provider: "Anglo Enterprise Growth Fund",
            owner: "Sbonelo Khumalo",
            dueDate: "2026-10-15",
            evidenceRequired: "Approved Facility Agreement & Guarantee",
            fundingSource: "Revolving Debt (R 650,000)",
            status: "In Progress",
          },
        ],
      },
      {
        supplierId: "sup_eng_02",
        supplierName: "Vuka Precision Engineering & Tooling",
        category: "Industrial Equipment & Spares",
        location: "Middelburg, Mpumalanga",
        baselineScore: 48,
        currentScore: 71,
        baselineCoverage: 50,
        currentCoverage: 80,
        primaryConstraint: "Capacity (CNC Milling Fleet)",
        activeIntervention: "Machinery Lease Subsidy & Operator Training",
        commercialStage: "Portal Submission",
        entryDate: "2026-03-20",
        interventions: [
          {
            id: "int_03",
            gap: "Demonstrated production turnaround exceeding 14 days",
            intervention: "Equipment Modernisation & CNC Operator Upskilling",
            provider: "Tooling Association of South Africa",
            owner: "Nhlanhla Mthembu",
            dueDate: "2026-09-15",
            evidenceRequired: "Demonstrated 5-day cycle time report",
            fundingSource: "Capital Grant (R 350,000)",
            status: "Completed",
          },
        ],
      },
      {
        supplierId: "sup_fac_03",
        supplierName: "Kasi Green Industrial Waste & Logistics",
        category: "Cleaning & Waste Management",
        location: "Emalahleni, Mpumalanga",
        baselineScore: 42,
        currentScore: 66,
        baselineCoverage: 40,
        currentCoverage: 75,
        primaryConstraint: "Compliance (Waste Management License)",
        activeIntervention: "Environmental Compliance Legal Mentorship",
        commercialStage: "Introduced",
        entryDate: "2026-04-10",
        interventions: [
          {
            id: "int_04",
            gap: "Hazardous waste transit permit missing",
            intervention: "Statutory Environmental Permitting Support",
            provider: "EnviroLegal Consult Africa",
            owner: "Lindelani Dlamini",
            dueDate: "2026-10-30",
            evidenceRequired: "DFFE Approved Waste Transit License",
            fundingSource: "ESD Incubation Voucher (R 85,000)",
            status: "In Progress",
          },
        ],
      },
    ],
  },
  {
    id: "cohort_digital_2026",
    name: "2026 Women-in-Tech & Digital Services Pipeline",
    sponsor: "Anglo Digital Innovation Hub",
    objective: "Scale Black women-owned IT and cybersecurity firms to deliver on corporate software and cloud maintenance contracts.",
    category: "Information Technology",
    sites: ["Gauteng (Johannesburg)", "National"],
    startDate: "2026-05-01",
    endDate: "2026-12-15",
    budgetEnvelope: "R 3,200,000",
    owner: "Nhlanhla Mthembu",
    status: "Active",
    members: [],
  },
]

export function useESDCohorts() {
  const [cohorts, setCohorts] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_COHORTS_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return INITIAL_COHORTS
  })

  const [activeCohortId, setActiveCohortId] = useState("cohort_mining_2026")
  const [loading, setLoading] = useState(false)

  // Fetch from Firestore if user is authenticated
  useEffect(() => {
    const fetchCohorts = async () => {
      const user = auth.currentUser
      if (!user) return

      try {
        setLoading(true)
        const q = query(collection(db, "esdCohorts"))
        const snap = await getDocs(q).catch(() => null)
        if (snap && !snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          setCohorts(list)
          localStorage.setItem(LOCAL_STORAGE_COHORTS_KEY, JSON.stringify(list))
        }
      } catch (err) {
        console.warn("[useESDCohorts] Remote fetch fallback to local:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCohorts()
  }, [])

  // Create new cohort
  const addCohort = useCallback((cohortData) => {
    const newCohort = {
      id: `cohort_${Date.now()}`,
      ...cohortData,
      status: cohortData.status || "Active",
      members: [],
      createdAt: new Date().toISOString(),
    }

    setCohorts((prev) => {
      const next = [newCohort, ...prev]
      try {
        localStorage.setItem(LOCAL_STORAGE_COHORTS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
    setActiveCohortId(newCohort.id)
    return newCohort
  }, [])

  // Add Member to active cohort
  const addMemberToCohort = useCallback((cohortId, supplier, baselineData) => {
    const newMember = {
      supplierId: supplier.id,
      supplierName: supplier.name,
      category: supplier.offeringCategory || "General",
      location: supplier.location || "Gauteng",
      baselineScore: baselineData.baselineScore || supplier.bigScore || 50,
      currentScore: supplier.bigScore || baselineData.baselineScore || 50,
      baselineCoverage: baselineData.baselineCoverage || supplier.verifiedCoverage || 60,
      currentCoverage: supplier.verifiedCoverage || 60,
      primaryConstraint: baselineData.primaryConstraint || "Capability Gap",
      activeIntervention: baselineData.activeIntervention || "Incubation & Diagnostic Audit",
      commercialStage: "Matched",
      entryDate: new Date().toISOString().split("T")[0],
      interventions: [],
    }

    setCohorts((prev) => {
      const next = prev.map((c) => {
        if (c.id === cohortId) {
          if (c.members.some((m) => m.supplierId === supplier.id)) return c
          return { ...c, members: [...c.members, newMember] }
        }
        return c
      })
      try {
        localStorage.setItem(LOCAL_STORAGE_COHORTS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  // Add intervention to member
  const addInterventionToMember = useCallback((cohortId, supplierId, interventionData) => {
    const newInt = {
      id: `int_${Date.now()}`,
      ...interventionData,
      status: interventionData.status || "In Progress",
    }

    setCohorts((prev) => {
      const next = prev.map((c) => {
        if (c.id === cohortId) {
          const updatedMembers = c.members.map((m) => {
            if (m.supplierId === supplierId) {
              return {
                ...m,
                activeIntervention: newInt.intervention,
                interventions: [...(m.interventions || []), newInt],
              }
            }
            return m
          })
          return { ...c, members: updatedMembers }
        }
        return c
      })
      try {
        localStorage.setItem(LOCAL_STORAGE_COHORTS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  // Update commercial progression stage
  const updateMemberStage = useCallback((cohortId, supplierId, newStage, reason = "") => {
    setCohorts((prev) => {
      const next = prev.map((c) => {
        if (c.id === cohortId) {
          const updatedMembers = c.members.map((m) => {
            if (m.supplierId === supplierId) {
              return {
                ...m,
                commercialStage: newStage,
                noProgressionReason: newStage === "No Progression" ? reason : undefined,
              }
            }
            return m
          })
          return { ...c, members: updatedMembers }
        }
        return c
      })
      try {
        localStorage.setItem(LOCAL_STORAGE_COHORTS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  // Update intervention status (e.g. mark Completed or In Progress)
  const updateInterventionStatus = useCallback((cohortId, supplierId, interventionId, newStatus) => {
    setCohorts((prev) => {
      const next = prev.map((c) => {
        if (c.id === cohortId) {
          const updatedMembers = c.members.map((m) => {
            if (m.supplierId === supplierId) {
              const updatedInts = (m.interventions || []).map((it) => {
                if (it.id === interventionId) {
                  return { ...it, status: newStatus }
                }
                return it
              })
              return { ...m, interventions: updatedInts }
            }
            return m
          })
          return { ...c, members: updatedMembers }
        }
        return c
      })
      try {
        localStorage.setItem(LOCAL_STORAGE_COHORTS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  // Remove member from cohort
  const removeMemberFromCohort = useCallback((cohortId, supplierId) => {
    setCohorts((prev) => {
      const next = prev.map((c) => {
        if (c.id === cohortId) {
          return { ...c, members: c.members.filter((m) => m.supplierId !== supplierId) }
        }
        return c
      })
      try {
        localStorage.setItem(LOCAL_STORAGE_COHORTS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const activeCohort = cohorts.find((c) => c.id === activeCohortId) || cohorts[0]

  return {
    cohorts,
    activeCohort,
    activeCohortId,
    setActiveCohortId,
    loading,
    addCohort,
    addMemberToCohort,
    addInterventionToMember,
    updateInterventionStatus,
    removeMemberFromCohort,
    updateMemberStage,
  }
}
