"use client"

import { useState, useEffect, useCallback, createContext, useContext } from "react"
import { auth } from "../../firebaseConfig"

export const BUYER_ROLES = {
  CPO: {
    id: "CPO",
    label: "Chief Procurement Officer / Lead Buyer",
    shortLabel: "CPO / Lead",
    badgeColor: "#2E7D32",
    description: "Full administrative and financial authorization for tenders, stage-gate sign-offs, and profile governance.",
  },
  SHEQ_LEAD: {
    id: "SHEQ_LEAD",
    label: "Technical & SHEQ Lead Reviewer",
    shortLabel: "SHEQ Lead",
    badgeColor: "#1565C0",
    description: "Evaluates technical capabilities, health & safety, statutory compliance files, and technical gates.",
  },
  ESD_LEAD: {
    id: "ESD_LEAD",
    label: "Enterprise & Supplier Development Lead",
    shortLabel: "ESD Lead",
    badgeColor: "#D4AF37",
    description: "Manages developmental cohorts, 5C baselines, interventions, and supplier commercial readiness progression.",
  },
  AUDITOR: {
    id: "AUDITOR",
    label: "Internal Auditor / Executive Viewer",
    shortLabel: "Auditor / Read-Only",
    badgeColor: "#6D4C41",
    description: "Read-only oversight across all supplier scoring, interactions, stage decisions, and compliance logs.",
  },
}

const LOCAL_STORAGE_RBAC_KEY = "procurement_active_subrole_v1"

export function useProcurementRBAC() {
  const [activeSubRole, setActiveSubRole] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_RBAC_KEY)
      if (saved && BUYER_ROLES[saved]) return saved
    } catch {}
    return "CPO"
  })

  const setSubRole = useCallback((roleId) => {
    if (BUYER_ROLES[roleId]) {
      setActiveSubRole(roleId)
      try {
        localStorage.setItem(LOCAL_STORAGE_RBAC_KEY, roleId)
      } catch {}
    }
  }, [])

  // Derived capability permissions based on active sub-role
  const permissions = {
    // Stage Gate Approvals
    canApproveStageGates: activeSubRole === "CPO" || activeSubRole === "SHEQ_LEAD",
    canRejectStageGates: activeSubRole === "CPO" || activeSubRole === "SHEQ_LEAD",
    
    // RFI & Interactions
    canIssueRFI: activeSubRole !== "AUDITOR",
    canResolveRFI: activeSubRole === "CPO" || activeSubRole === "SHEQ_LEAD",
    
    // ESD Cohorts
    canManageCohorts: activeSubRole === "CPO" || activeSubRole === "ESD_LEAD",
    canAssignInterventions: activeSubRole === "CPO" || activeSubRole === "ESD_LEAD",
    canAdvanceCommercialStage: activeSubRole === "CPO" || activeSubRole === "ESD_LEAD",

    // Universal Profile & Demand Configuration
    canEditBuyerProfile: activeSubRole === "CPO",

    // External Portal Handoffs
    canManagePortalHandoff: activeSubRole === "CPO" || activeSubRole === "SHEQ_LEAD" || activeSubRole === "ESD_LEAD",

    // Audit & Reporting
    canExportAuditReports: true, // All roles can export for audit transparency

    // Read-only indicator
    isReadOnly: activeSubRole === "AUDITOR",
  }

  const roleMeta = BUYER_ROLES[activeSubRole] || BUYER_ROLES.CPO

  return {
    activeSubRole,
    setSubRole,
    permissions,
    roleMeta,
    availableRoles: Object.values(BUYER_ROLES),
  }
}
