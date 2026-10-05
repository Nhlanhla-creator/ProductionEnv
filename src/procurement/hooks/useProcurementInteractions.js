"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"

const LOCAL_STORAGE_INTERACTIONS_KEY = "procurement_interactions_v1"
const LOCAL_STORAGE_SHORTLIST_KEY = "procurement_shortlists_v1"
const LOCAL_STORAGE_DECISIONS_KEY = "procurement_stage_decisions_v1"
const LOCAL_STORAGE_HANDOFFS_KEY = "procurement_portal_handoffs_v1"

const INITIAL_MOCK_DECISIONS = [
  {
    id: "dec_101",
    supplierId: "sup_tech_01",
    supplierName: "Apex Cloud & Network Solutions",
    supplierCategory: "Information Technology",
    gateType: "Tender Readiness Gate (Commercial / SLA)",
    outcome: "Approved",
    approver: "Sbonelo Khumalo (CPO)",
    reviewer: "Lindelani Dlamini (SHEQ Lead)",
    justification: "All technical evaluation criteria satisfied. Demonstrated Tier 1 SLA uptime (>99.9%) and ISO 27001 accreditation.",
    timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "dec_102",
    supplierId: "sup_fac_02",
    supplierName: "Vuka Facilities & Industrial Services",
    supplierCategory: "Facilities Management",
    gateType: "SHEQ & Statutory Compliance Gate (COIDA / Safety / Tax)",
    outcome: "Conditional",
    conditionalRequirements: "Subject to updated 2026 COIDA letter of good standing submission within 14 calendar days.",
    approver: "Lindelani Dlamini (SHEQ Lead)",
    reviewer: "Sbonelo Khumalo (CPO)",
    justification: "Safety file approved for mining site access; administrative statutory clearance pending receipt of updated COIDA letter.",
    timestamp: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
  },
]

const INITIAL_MOCK_HANDOFFS = [
  {
    id: "handoff_101",
    supplierId: "sup_tech_01",
    supplierName: "Apex Cloud & Network Solutions",
    supplierCategory: "Information Technology",
    portalUrl: "https://suppliers.angloamerican.com/registration",
    erpSystem: "SAP S/4HANA",
    referenceNumber: "SAP-VN-2026-89412",
    status: "Approved - Vendor Code Active",
    instructions: "Upload CIPC certificate, verified Tax Pin, and banking confirmation less than 3 months old.",
    notes: "Vendor master code successfully allocated in SAP S/4HANA: 0004910291.",
    buyerOrg: "Anglo American Supply Chain",
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "handoff_102",
    supplierId: "sup_log_03",
    supplierName: "Kanyi Bulk Freight & Logistics",
    supplierCategory: "Logistics & Freight",
    portalUrl: "https://suppliers.angloamerican.com/registration",
    erpSystem: "SAP S/4HANA",
    referenceNumber: "SAP-VN-2026-90234",
    status: "Under Buyer Vendor Master Review",
    instructions: "Upload CIPC certificate, verified Tax Pin, valid COIDA letter, and banking confirmation.",
    notes: "All statutory documents uploaded to vendor portal. Awaiting banking confirmation sign-off.",
    buyerOrg: "Anglo American Supply Chain",
    updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
]

const INITIAL_MOCK_INTERACTIONS = [
  {
    id: "rfi_101",
    supplierId: "sup_tech_01",
    supplierName: "Apex Cloud & Network Solutions",
    type: "Document Clarification",
    subject: "Updated SARS Tax Compliance Pin Required",
    details: "Your tax compliance status pin expired last week. Please upload your updated 2026 SARS tax compliance pin.",
    requiresUpload: true,
    status: "Open", // Open | Submitted | Under Review | Resolved | Overdue
    createdBy: "Sbonelo Khumalo",
    buyerRole: "Procurement Manager",
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().split("T")[0],
    responses: [],
  },
  {
    id: "rfi_102",
    supplierId: "sup_fac_02",
    supplierName: "Vuka Facilities & Industrial Services",
    type: "Capacity Verification",
    subject: "On-site Shift Capacity for Mpumalanga Plant",
    details: "Please confirm concurrent staff deployment capacity for scheduled October maintenance shutdown at Plant B.",
    requiresUpload: false,
    status: "Submitted",
    createdBy: "Lindelani Dlamini",
    buyerRole: "Technical Reviewer",
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split("T")[0],
    responses: [
      {
        responder: "Vuka Facilities Admin",
        timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        content: "We can provide 45 certified technicians across 3 shifts with dedicated supervisor on-site. Documentation attached.",
        attachments: ["Vuka_Shift_Roster_Oct2026.pdf"],
      },
    ],
  },
  {
    id: "rfi_103",
    supplierId: "sup_log_03",
    supplierName: "Kanyi Bulk Freight & Logistics",
    type: "B-BBEE Audit",
    subject: "SANAS B-BBEE Certificate Verification",
    details: "Verification of Black Women Ownership percentage breakdown ahead of final shortlist recommendation.",
    requiresUpload: true,
    status: "Resolved",
    createdBy: "Sbonelo Khumalo",
    buyerRole: "Procurement Manager",
    createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split("T")[0],
    responses: [
      {
        responder: "Kanyi Logistics Director",
        timestamp: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
        content: "Uploaded latest SANAS-accredited scorecard validating 51% Black Women Ownership.",
        attachments: ["Kanyi_BBBEE_Scorecard_2026.pdf"],
      },
    ],
  },
]

export function useProcurementInteractions() {
  const [interactions, setInteractions] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_INTERACTIONS_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return INITIAL_MOCK_INTERACTIONS
  })

  const [shortlists, setShortlists] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SHORTLIST_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })

  const [loading, setLoading] = useState(false)

  // Fetch interactions from Firestore if authenticated
  useEffect(() => {
    const fetchInteractions = async () => {
      const user = auth.currentUser
      if (!user) return

      try {
        setLoading(true)
        const q = query(
          collection(db, "procurementInteractions"),
          where("buyerId", "==", user.uid),
          orderBy("createdAt", "desc")
        )
        const snap = await getDocs(q).catch(() => null)
        if (snap && !snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          setInteractions(list)
          localStorage.setItem(LOCAL_STORAGE_INTERACTIONS_KEY, JSON.stringify(list))
        }
      } catch (err) {
        console.warn("[useProcurementInteractions] Remote fetch fallback to local:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchInteractions()
  }, [])

  // Create a structured RFI
  const createRFI = useCallback(async ({
    supplierId,
    supplierName,
    type,
    subject,
    details,
    dueDate,
    requiresUpload,
  }) => {
    const user = auth.currentUser
    const buyerName = user?.displayName || "Procurement Manager"
    const buyerId = user?.uid || "guest_buyer"

    const newRFI = {
      id: `rfi_${Date.now()}`,
      supplierId,
      supplierName,
      type: type || "Information Clarification",
      subject,
      details,
      dueDate,
      requiresUpload: !!requiresUpload,
      status: "Open", // Open -> Submitted -> Under Review -> Resolved
      createdBy: buyerName,
      buyerId,
      buyerRole: "Procurement Manager",
      createdAt: new Date().toISOString(),
      responses: [],
    }

    setInteractions((prev) => {
      const next = [newRFI, ...prev]
      try {
        localStorage.setItem(LOCAL_STORAGE_INTERACTIONS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })

    // Also persist to Firestore if available
    try {
      if (user) {
        await addDoc(collection(db, "procurementInteractions"), {
          ...newRFI,
          createdAt: serverTimestamp(),
        })

        // Emit notification into messages collection for the supplier
        await addDoc(collection(db, "messages"), {
          to: supplierId,
          toName: supplierName,
          from: buyerId,
          fromName: buyerName,
          subject: `📋 New Procurement RFI: ${subject}`,
          content: details,
          date: new Date().toISOString(),
          read: false,
          type: "inbox",
          linkTo: "/supplier/interactions",
        })
      }
    } catch (err) {
      console.warn("[useProcurementInteractions] Firestore write deferred:", err)
    }

    return newRFI
  }, [])

  // Update RFI Status
  const updateRFIStatus = useCallback(async (rfiId, newStatus) => {
    setInteractions((prev) => {
      const next = prev.map((item) => (item.id === rfiId ? { ...item, status: newStatus } : item))
      try {
        localStorage.setItem(LOCAL_STORAGE_INTERACTIONS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })

    try {
      const user = auth.currentUser
      if (user && db) {
        await updateDoc(doc(db, "procurementInteractions", rfiId), {
          status: newStatus,
          updatedAt: serverTimestamp(),
        })
      }
    } catch (err) {
      // Non-fatal
    }
  }, [])

  // Add Supplier to Shortlist
  const addToShortlist = useCallback((supplier, reason = "Qualified in Matched Suppliers Grid") => {
    const user = auth.currentUser
    const item = {
      supplierId: supplier.id,
      supplierName: supplier.name,
      offeringCategory: supplier.offeringCategory,
      location: supplier.location,
      bigScore: supplier.bigScore,
      requirementFit: supplier.requirementFit,
      reason,
      shortlistedBy: user?.displayName || "Procurement Lead",
      timestamp: new Date().toISOString(),
    }

    setShortlists((prev) => {
      if (prev.some((s) => s.supplierId === supplier.id)) return prev
      const next = [item, ...prev]
      try {
        localStorage.setItem(LOCAL_STORAGE_SHORTLIST_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  // Remove from Shortlist
  const removeFromShortlist = useCallback((supplierId) => {
    setShortlists((prev) => {
      const next = prev.filter((s) => s.supplierId !== supplierId)
      try {
        localStorage.setItem(LOCAL_STORAGE_SHORTLIST_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const isShortlisted = useCallback(
    (supplierId) => shortlists.some((s) => s.supplierId === supplierId),
    [shortlists]
  )

  const [stageDecisions, setStageDecisions] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DECISIONS_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return INITIAL_MOCK_DECISIONS
  })

  const [portalHandoffs, setPortalHandoffs] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HANDOFFS_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return INITIAL_MOCK_HANDOFFS
  })

  // Record an auditable Stage-Gate Decision
  const recordStageDecision = useCallback(async (decisionData) => {
    const user = auth.currentUser
    const newDecision = {
      id: `decision_${Date.now()}`,
      ...decisionData,
      approver: decisionData.approver || user?.displayName || "Procurement Approver",
      timestamp: new Date().toISOString(),
    }

    setStageDecisions((prev) => {
      const next = [newDecision, ...prev]
      try {
        localStorage.setItem(LOCAL_STORAGE_DECISIONS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })

    try {
      if (user && db) {
        await addDoc(collection(db, "procurementStageDecisions"), {
          ...newDecision,
          buyerId: user.uid,
          createdAt: serverTimestamp(),
        })
      }
    } catch (err) {
      console.warn("[useProcurementInteractions] Firestore stage decision write deferred:", err)
    }

    return newDecision
  }, [])

  // Record / update external portal handoff
  const recordPortalHandoff = useCallback(async (handoffData) => {
    const user = auth.currentUser
    const handoff = {
      id: handoffData.id || `handoff_${Date.now()}`,
      ...handoffData,
      updatedAt: new Date().toISOString(),
    }

    setPortalHandoffs((prev) => {
      const existingIdx = prev.findIndex((h) => h.id === handoff.id || h.supplierId === handoff.supplierId)
      let next
      if (existingIdx >= 0) {
        next = [...prev]
        next[existingIdx] = handoff
      } else {
        next = [handoff, ...prev]
      }
      try {
        localStorage.setItem(LOCAL_STORAGE_HANDOFFS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })

    try {
      if (user && db) {
        await addDoc(collection(db, "procurementPortalHandoffs"), {
          ...handoff,
          buyerId: user.uid,
          updatedAt: serverTimestamp(),
        })
      }
    } catch (err) {
      console.warn("[useProcurementInteractions] Firestore portal handoff write deferred:", err)
    }

    return handoff
  }, [])

  // Update status of existing portal handoff
  const updatePortalHandoffStatus = useCallback((handoffId, newStatus) => {
    setPortalHandoffs((prev) => {
      const next = prev.map((h) => (h.id === handoffId ? { ...h, status: newStatus, updatedAt: new Date().toISOString() } : h))
      try {
        localStorage.setItem(LOCAL_STORAGE_HANDOFFS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const getDecisionsForSupplier = useCallback(
    (supplierId) => stageDecisions.filter((d) => d.supplierId === supplierId),
    [stageDecisions]
  )

  const getHandoffForSupplier = useCallback(
    (supplierId) => portalHandoffs.find((h) => h.supplierId === supplierId),
    [portalHandoffs]
  )

  return {
    interactions,
    shortlists,
    stageDecisions,
    portalHandoffs,
    loading,
    createRFI,
    updateRFIStatus,
    addToShortlist,
    removeFromShortlist,
    isShortlisted,
    recordStageDecision,
    recordPortalHandoff,
    updatePortalHandoffStatus,
    getDecisionsForSupplier,
    getHandoffForSupplier,
  }
}
