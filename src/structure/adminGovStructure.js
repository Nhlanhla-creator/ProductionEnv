// structure/adminGovStructure.js

export const ADMIN_GOV_STRUCTURE = [
  {
    id: "board-governance",
    name: "Board Governance",
    type: "folder",
    icon: "🏛️",
    children: [
      { id: "board-minutes", name: "Board Minutes", type: "file", icon: "📄", path: ["Admin Governance", "Board Governance", "Board Minutes"] },
      { id: "board-charter", name: "Board Charter", type: "file", icon: "📄", path: ["Admin Governance", "Board Governance", "Board Charter"] },
      { id: "board-members", name: "Board Members", type: "file", icon: "📄", path: ["Admin Governance", "Board Governance", "Board Members"] },
      { id: "meeting-schedule", name: "Meeting Schedule", type: "file", icon: "📅", path: ["Admin Governance", "Board Governance", "Meeting Schedule"] },
    ]
  },
  {
    id: "equity-structure",
    name: "Equity Structure",
    type: "folder",
    icon: "⚖️",
    children: [
      { id: "shareholders", name: "Shareholders Agreement", type: "file", icon: "📄", path: ["Admin Governance", "Equity Structure", "Shareholders Agreement"] },
      { id: "cap-table", name: "Cap Table", type: "file", icon: "📊", path: ["Admin Governance", "Equity Structure", "Cap Table"] },
      { id: "vesting-schedule", name: "Vesting Schedule", type: "file", icon: "📄", path: ["Admin Governance", "Equity Structure", "Vesting Schedule"] },
    ]
  },
  {
    id: "risk-compliance",
    name: "Risk & Compliance",
    type: "folder",
    icon: "⚠️",
    children: [
      { id: "risk-register", name: "Risk Register", type: "file", icon: "📋", path: ["Admin Governance", "Risk & Compliance", "Risk Register"] },
      { id: "compliance-checklist", name: "Compliance Checklist", type: "file", icon: "✅", path: ["Admin Governance", "Risk & Compliance", "Compliance Checklist"] },
      { id: "audit-reports", name: "Audit Reports", type: "file", icon: "📊", path: ["Admin Governance", "Risk & Compliance", "Audit Reports"] },
      { id: "policy-documents", name: "Policy Documents", type: "file", icon: "📄", path: ["Admin Governance", "Risk & Compliance", "Policy Documents"] },
    ]
  },
  {
    id: "legal-documents",
    name: "Legal Documents",
    type: "folder",
    icon: "⚖️",
    children: [
      { id: "articles-association", name: "Articles of Association", type: "file", icon: "📄", path: ["Admin Governance", "Legal Documents", "Articles of Association"] },
      { id: "memorandum", name: "Memorandum of Incorporation", type: "file", icon: "📄", path: ["Admin Governance", "Legal Documents", "Memorandum of Incorporation"] },
      { id: "contracts", name: "Contracts & Agreements", type: "file", icon: "📄", path: ["Admin Governance", "Legal Documents", "Contracts & Agreements"] },
    ]
  }
];