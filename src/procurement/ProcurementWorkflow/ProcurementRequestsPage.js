"use client"

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Eye,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  ArrowRight,
  ChevronRight,
  DollarSign,
  Calendar,
  Layers,
  Send,
  Users,
} from "lucide-react"
import { auth, db } from "../../firebaseConfig"
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"

const STAGES = [
  { id: "applications", label: "1. Applications", short: "Applications", color: "#3B82F6" },
  { id: "shortlisting", label: "2. Shortlisting", short: "Shortlisting", color: "#8B5CF6" },
  { id: "selection", label: "3. Selection", short: "Selection", color: "#F59E0B" },
  { id: "contracting", label: "4. Contracting", short: "Contracting", color: "#EC4899" },
  { id: "buying", label: "5. Buying / PO", short: "Buying", color: "#10B981" },
  { id: "closeout", label: "6. Closeout", short: "Closeout", color: "#6B7280" },
]

const SAMPLE_REQUESTS = [
  {
    id: "req_mining_ppe_01",
    reference: "RFP-2026-088",
    title: "Specialized Flame-Retardant Mining PPE & Safety Wear",
    category: "PPE & Safety Equipment",
    budget: "R 4,500,000",
    stage: "shortlisting",
    bidsCount: 6,
    closingDate: "2026-10-24",
    status: "Active",
    leadBuyer: "Sipho Dube",
    geographicScope: "Mpumalanga & Limpopo",
    minBBBEE: "Level 1 or 2",
    createdAt: "2026-09-18",
  },
  {
    id: "req_yellow_fleet_02",
    reference: "RFQ-2026-102",
    title: "Articulated Dump Trucks & Excavator Wet Hire Services",
    category: "Industrial Equipment & Spares",
    budget: "R 18,200,000",
    stage: "selection",
    bidsCount: 4,
    closingDate: "2026-10-15",
    status: "In Review",
    leadBuyer: "Kagiso Molefe",
    geographicScope: "Host Municipalities (Kathu / Gamagara)",
    minBBBEE: "Level 1 (51% Black Owned)",
    createdAt: "2026-09-02",
  },
  {
    id: "req_conveyor_rollers_03",
    reference: "RFP-2026-114",
    title: "Overhaul & Maintenance of Coal Washing Conveyor Pulleys",
    category: "Engineering & Fabrication",
    budget: "R 6,800,000",
    stage: "contracting",
    bidsCount: 3,
    closingDate: "2026-09-30",
    status: "Contract Drafting",
    leadBuyer: "Sipho Dube",
    geographicScope: "eMalahleni / Witbank",
    minBBBEE: "Level 1 to 4",
    createdAt: "2026-08-20",
  },
  {
    id: "req_it_sensors_04",
    reference: "RFQ-2026-120",
    title: "ATEX Certified Wireless Vibration Telemetry Sensors",
    category: "Information Technology",
    budget: "R 2,400,000",
    stage: "buying",
    bidsCount: 2,
    closingDate: "2026-09-10",
    status: "PO Pending",
    leadBuyer: "Lerato Khumalo",
    geographicScope: "National",
    minBBBEE: "Level 1",
    createdAt: "2026-08-15",
  },
]

export default function ProcurementRequestsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("list") // "list" | "pipeline" | "create"
  const [requests, setRequests] = useState(SAMPLE_REQUESTS)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStage, setSelectedStage] = useState("all")

  // New Request Form State
  const [newRequest, setNewRequest] = useState({
    title: "",
    category: "PPE & Safety Equipment",
    budget: "",
    closingDate: "",
    geographicScope: "Local / Host Community",
    minBBBEE: "Level 1 or 2",
    description: "",
    deliveryMode: "On-site",
  })

  const handleCreateRequest = (e) => {
    e.preventDefault()
    if (!newRequest.title.trim()) return

    const created = {
      id: `req_${Date.now()}`,
      reference: `RFP-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: newRequest.title,
      category: newRequest.category,
      budget: newRequest.budget || "R 1,000,000",
      stage: "applications",
      bidsCount: 0,
      closingDate: newRequest.closingDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      status: "Active",
      leadBuyer: "Corporate Procurement Lead",
      geographicScope: newRequest.geographicScope,
      minBBBEE: newRequest.minBBBEE,
      createdAt: new Date().toISOString().split("T")[0],
    }

    setRequests([created, ...requests])
    setActiveTab("list")
    setNewRequest({
      title: "",
      category: "PPE & Safety Equipment",
      budget: "",
      closingDate: "",
      geographicScope: "Local / Host Community",
      minBBBEE: "Level 1 or 2",
      description: "",
      deliveryMode: "On-site",
    })
  }

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat = selectedCategory === "all" || r.category === selectedCategory
    const matchesStage = selectedStage === "all" || r.stage === selectedStage
    return matchesSearch && matchesCat && matchesStage
  })

  return (
    <div style={{ padding: "24px 32px", minHeight: "100vh", background: "#FAF7F2", color: "#4A352F" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <Briefcase size={26} color="#4A352F" />
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "#4A352F" }}>
              Procurement Opportunities & Tenders
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#8D6E63" }}>
            Issue product or service requests (RFPs / RFQs) to pre-qualified suppliers and manage submissions across the 6-stage lifecycle.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            style={{
              padding: "9px 18px",
              background: "#4A352F",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={16} /> New RFP / RFQ
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #E8D5C4", marginBottom: "20px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("list")}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "list" ? "3px solid #4A352F" : "3px solid transparent",
            color: activeTab === "list" ? "#4A352F" : "#8D6E63",
            fontWeight: activeTab === "list" ? 700 : 500,
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          All Requests ({requests.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pipeline")}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "pipeline" ? "3px solid #4A352F" : "3px solid transparent",
            color: activeTab === "pipeline" ? "#4A352F" : "#8D6E63",
            fontWeight: activeTab === "pipeline" ? 700 : 500,
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          6-Stage Procurement Pipeline
        </button>

        {activeTab === "create" && (
          <button
            type="button"
            style={{
              padding: "12px 20px",
              background: "none",
              border: "none",
              borderBottom: "3px solid #4A352F",
              color: "#4A352F",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Create New Requisition
          </button>
        )}
      </div>

      {/* VIEW 1: REQUISITION LIST TABLE */}
      {activeTab === "list" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "20px" }}>
          {/* Filter Bar */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 280px" }}>
              <Search size={15} color="#8D6E63" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search requisitions by title, ref, or commodity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 32px",
                  borderRadius: "6px",
                  border: "1px solid #D7CCC8",
                  fontSize: "0.85rem",
                  color: "#4A352F",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #D7CCC8",
                fontSize: "0.85rem",
                color: "#4A352F",
                background: "#FFFFFF",
              }}
            >
              <option value="all">All Stages</option>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "#FAF7F2", borderBottom: "2px solid #E6D7C3", color: "#5D4037" }}>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Ref & Requisition</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Category</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Est. Budget</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Lifecycle Stage</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Bids Intake</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Closing Date</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const stageObj = STAGES.find((s) => s.id === req.stage) || STAGES[0]
                  return (
                    <tr
                      key={req.id}
                      style={{
                        borderBottom: "1px solid #F0EAE1",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAF7F2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8D6E63" }}>{req.reference}</div>
                        <div style={{ fontWeight: 600, color: "#4A352F", marginTop: "2px" }}>{req.title}</div>
                        <div style={{ fontSize: "0.75rem", color: "#A89482", marginTop: "2px" }}>{req.geographicScope}</div>
                      </td>

                      <td style={{ padding: "14px", color: "#6D4C41" }}>{req.category}</td>

                      <td style={{ padding: "14px", fontWeight: 700, color: "#2E7D32" }}>{req.budget}</td>

                      <td style={{ padding: "14px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            background: `${stageObj.color}15`,
                            color: stageObj.color,
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          {stageObj.label}
                        </span>
                      </td>

                      <td style={{ padding: "14px" }}>
                        <span style={{ fontWeight: 700, color: "#4A352F" }}>{req.bidsCount}</span> qualified bids
                      </td>

                      <td style={{ padding: "14px", color: "#6D4C41" }}>{req.closingDate}</td>

                      <td style={{ padding: "14px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => navigate("/procurement/matches")}
                          style={{
                            padding: "6px 12px",
                            background: "#FAF7F2",
                            border: "1px solid #D7CCC8",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            color: "#4A352F",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          View Matches
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: 6-STAGE PIPELINE BOARD */}
      {activeTab === "pipeline" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", overflowX: "auto" }}>
          {STAGES.map((stage) => {
            const stageRequests = requests.filter((r) => r.stage === stage.id)
            return (
              <div
                key={stage.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E6D7C3",
                  borderRadius: "8px",
                  padding: "14px",
                  minWidth: "190px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4A352F" }}>{stage.short}</div>
                  <span
                    style={{
                      background: `${stage.color}20`,
                      color: stage.color,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "10px",
                    }}
                  >
                    {stageRequests.length}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {stageRequests.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        background: "#FAF7F2",
                        border: "1px solid #E8D5C4",
                        borderRadius: "6px",
                        padding: "10px",
                        fontSize: "0.8rem",
                      }}
                    >
                      <div style={{ fontSize: "0.7rem", color: "#8D6E63", fontWeight: 700 }}>{r.reference}</div>
                      <div style={{ fontWeight: 600, color: "#4A352F", marginTop: "2px" }}>{r.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "#2E7D32", fontWeight: 700, marginTop: "4px" }}>{r.budget}</div>
                      <div style={{ fontSize: "0.7rem", color: "#8D6E63", marginTop: "4px" }}>
                        Bids: <strong>{r.bidsCount}</strong>
                      </div>
                    </div>
                  ))}

                  {stageRequests.length === 0 && (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "#A89482", fontSize: "0.75rem", fontStyle: "italic" }}>
                      No requisitions in this stage
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* VIEW 3: CREATE REQUISITION FORM */}
      {activeTab === "create" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E6D7C3", borderRadius: "10px", padding: "24px", maxWidth: "800px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: 700, color: "#4A352F" }}>
            Create New Product / Service Requisition (RFP / RFQ)
          </h3>

          <form onSubmit={handleCreateRequest} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#5D4037", marginBottom: "4px" }}>
                Requisition Title / Commodity Scope *
              </label>
              <input
                type="text"
                placeholder="e.g. Supply and Delivery of Industrial Lubricants & Greases"
                value={newRequest.title}
                onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                required
                style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #C8B6A6", fontSize: "0.85rem", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#5D4037", marginBottom: "4px" }}>
                  Product / Service Category *
                </label>
                <select
                  value={newRequest.category}
                  onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #C8B6A6", fontSize: "0.85rem", background: "#FFFFFF" }}
                >
                  <option value="PPE & Safety Equipment">PPE & Safety Equipment</option>
                  <option value="Industrial Equipment & Spares">Industrial Equipment & Spares</option>
                  <option value="Engineering & Fabrication">Engineering & Fabrication</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Logistics & Freight">Logistics & Freight</option>
                  <option value="Facilities Management">Facilities Management</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#5D4037", marginBottom: "4px" }}>
                  Estimated Contract Budget (ZAR)
                </label>
                <input
                  type="text"
                  placeholder="e.g. R 2,500,000"
                  value={newRequest.budget}
                  onChange={(e) => setNewRequest({ ...newRequest, budget: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #C8B6A6", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#5D4037", marginBottom: "4px" }}>
                  Geographic Sourcing Preference
                </label>
                <select
                  value={newRequest.geographicScope}
                  onChange={(e) => setNewRequest({ ...newRequest, geographicScope: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #C8B6A6", fontSize: "0.85rem", background: "#FFFFFF" }}
                >
                  <option value="Local / Host Community">Local / Host Community (Mining Perimeter)</option>
                  <option value="Provincial">Provincial</option>
                  <option value="National">National (South Africa)</option>
                  <option value="Cross-border / SADC">Cross-border / SADC</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#5D4037", marginBottom: "4px" }}>
                  Minimum B-BBEE Recognition Gate
                </label>
                <select
                  value={newRequest.minBBBEE}
                  onChange={(e) => setNewRequest({ ...newRequest, minBBBEE: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #C8B6A6", fontSize: "0.85rem", background: "#FFFFFF" }}
                >
                  <option value="Level 1 or 2">Level 1 or 2 (Preferred)</option>
                  <option value="Level 1 to 4">Level 1 to 4 (Enterprise Baseline)</option>
                  <option value="Any Compliant Level">Any Compliant Level</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                type="submit"
                style={{
                  padding: "10px 20px",
                  background: "#4A352F",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Publish Requisition
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                style={{
                  padding: "10px 18px",
                  background: "#FFFFFF",
                  color: "#4A352F",
                  border: "1px solid #C8B6A6",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
