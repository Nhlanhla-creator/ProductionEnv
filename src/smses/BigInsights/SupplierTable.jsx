// SupplierTable.jsx
"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../../firebaseConfig" // adjust import path
import { Search, Filter, ChevronDown, ChevronUp, Download, Loader } from "lucide-react"
// import "./SupplierTable.css"

export function SupplierTable({ suppliers: propSuppliers }) {
  const [suppliers, setSuppliers] = useState([])
  const [filteredSuppliers, setFilteredSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("registeredName")
  const [sortDirection, setSortDirection] = useState("asc")
  const [filterCompleted, setFilterCompleted] = useState(true)
  const [filterMinScore, setFilterMinScore] = useState(0)
  
  // Use prop suppliers if provided, otherwise fetch
  useEffect(() => {
    if (propSuppliers && propSuppliers.length > 0) {
      setSuppliers(propSuppliers)
      setFilteredSuppliers(propSuppliers)
      setLoading(false)
    }
  }, [propSuppliers])
  
  // Calculate profile completeness score
  const calculateCompleteness = (completedSections) => {
    if (!completedSections) return 0
    const sections = Object.values(completedSections)
    const total = sections.length
    const completed = sections.filter(v => v === true).length
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  // Check if profile is a supplier
  const isSupplier = (profile) => {
    const productsServices = profile.productsServices || {}
    const entityType = productsServices.entityType || ""
    const offeringType = productsServices.offeringType || ""
    
    return entityType === "smse" && 
           (offeringType === "services" || offeringType === "products" || offeringType === "")
  }

  // Extract key supplier info
  const extractSupplierInfo = (doc) => {
    const data = doc
    const entity = data.entityOverview || {}
    const contact = data.contactDetails || {}
    const products = data.productsServices || {}
    const scores = data.bigScore || 0
    const completed = data.completedSections || {}
    const legal = data.legalCompliance || {}
    const social = data.socialImpact || {}
    const financial = data.financialOverview || {}
    
    // Get service categories
    const serviceCategories = (products.serviceCategories || [])
      .map(cat => cat.name)
      .filter(Boolean)
    
    const services = (products.services || [])
      .map(s => s.name)
      .filter(Boolean)

    return {
      id: data.uid || doc.id,
      registeredName: entity.registeredName || "Not provided",
      tradingName: entity.tradingName || entity.registeredName || "Not provided",
      registrationNumber: entity.registrationNumber || "Not provided",
      entityType: entity.entityType || "Not provided",
      entitySize: entity.entitySize || "Not provided",
      operationStage: entity.operationStage || "Not provided",
      location: entity.location || "Not provided",
      province: entity.province || "Not provided",
      yearsInOperation: entity.yearsInOperation || "0",
      employeeCount: entity.employeeCount || "0",
      businessDescription: entity.businessDescription || "",
      economicSectors: entity.economicSectors || [],
      contactName: contact.contactName || "",
      email: contact.email || "",
      mobile: contact.mobile || "",
      businessPhone: contact.businessPhone || "",
      website: contact.website || "",
      physicalAddress: contact.physicalAddress || "",
      position: contact.position || "",
      
      // Products & Services
      serviceCategories: serviceCategories,
      services: services,
      keyClients: (products.keyClients || []).map(c => c.name).filter(Boolean),
      offeringType: products.offeringType || "services",
      
      // Scores & Status
      bigScore: scores || 0,
      completeness: calculateCompleteness(completed),
      completedSections: completed,
      
      // Legal & Compliance
      taxNumber: legal.taxNumber || "",
      vatNumber: legal.vatNumber || "",
      bbbeeLevel: legal.bbbeeLevel || "",
      cipcStatus: legal.cipcStatus || "",
      
      // Social Impact
      blackOwnership: social.blackOwnership || "0",
      womenOwnership: social.womenOwnership || "0",
      youthOwnership: social.youthOwnership || "0",
      
      // Financial
      annualRevenue: financial.annualRevenue || "",
      profitabilityStatus: financial.profitabilityStatus || "",
      
      // Application Info
      applicationDate: data.applicationOverview?.applicationDate || "",
      applicationType: data.applicationOverview?.applicationType || "",
      fundingStage: data.applicationOverview?.fundingStage || "",
      urgency: data.applicationOverview?.urgency || "",
    }
  }

  // Fetch suppliers from Firebase
  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const profilesRef = collection(db, "universalProfiles")
      
      // Query for profiles with productsServices.entityType = "smse"
      // Note: Firestore queries can't filter on nested maps directly, so we fetch and filter client-side
      // For large collections, consider using a composite index or storing a flag field
      const querySnapshot = await getDocs(profilesRef)
      
      const allSuppliers = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        // Check if it's a supplier
        if (isSupplier(data)) {
          const supplierInfo = extractSupplierInfo(data)
          allSuppliers.push(supplierInfo)
        }
      })
      
      setSuppliers(allSuppliers)
      setFilteredSuppliers(allSuppliers)
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  // Apply filters and search
  useEffect(() => {
    let result = [...suppliers]
    
    // Filter by completeness
    if (filterCompleted) {
      result = result.filter(s => s.completeness >= 60)
    }
    
    // Filter by minimum score
    result = result.filter(s => s.bigScore >= filterMinScore)
    
    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter(s => 
        s.registeredName?.toLowerCase().includes(term) ||
        s.tradingName?.toLowerCase().includes(term) ||
        s.contactName?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.businessDescription?.toLowerCase().includes(term) ||
        s.serviceCategories.some(cat => cat.toLowerCase().includes(term)) ||
        s.services.some(service => service.toLowerCase().includes(term))
      )
    }
    
    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField] || ""
      const bVal = b[sortField] || ""
      
      // Handle numeric sorting
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal
      }
      
      // Handle string sorting
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      return sortDirection === "asc" 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr)
    })
    
    setFilteredSuppliers(result)
  }, [suppliers, searchTerm, sortField, sortDirection, filterCompleted, filterMinScore])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getCompletenessColor = (score) => {
    if (score >= 80) return "green"
    if (score >= 60) return "orange"
    return "red"
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "green"
    if (score >= 60) return "orange"
    return "red"
  }

  const exportCSV = () => {
    // Define headers
    const headers = [
      "Registered Name", "Trading Name", "Registration Number", "Entity Type",
      "Stage", "Location", "Years", "Employees", "Big Score", "Completeness",
      "Services", "Categories", "Email", "Contact Person", "BB-BEE Level"
    ]
    
    const rows = filteredSuppliers.map(s => [
      s.registeredName,
      s.tradingName,
      s.registrationNumber,
      s.entityType,
      s.operationStage,
      `${s.location || ""}${s.province ? `, ${s.province}` : ""}`,
      s.yearsInOperation,
      s.employeeCount,
      s.bigScore,
      `${s.completeness}%`,
      s.services.join("; "),
      s.serviceCategories.join("; "),
      s.email,
      s.contactName,
      s.bbbeeLevel
    ])
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `suppliers_export_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="supplierTableLoading spin" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 48, color: "#666" }}>
        <Loader className="spin" />
        <span>Loading suppliers...</span>
      </div>
    )
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(93, 64, 55, 0.08)", padding: "20px 24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Compact Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, marginRight: 24, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1a1a2e", margin: 0 }}>Supplier Directory</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: "13px", color: "#666" }}>
          <span>{filteredSuppliers.length} suppliers found</span>
          <span style={{ color: "#999", fontSize: "12px" }}>(out of {suppliers.length} total)</span>
        </div>
      </div>

      {/* Compact Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#999" }} />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #ddd", borderRadius: 6, fontSize: "13px", background: "#fafafa" }}
          />
        </div>
        
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px", color: "#555", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={filterCompleted}
            onChange={() => setFilterCompleted(!filterCompleted)}
          />
          <span>Completed (60%+)</span>
        </label>
        
        <select 
          value={filterMinScore} 
          onChange={(e) => setFilterMinScore(Number(e.target.value))}
          style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: "12px", background: "#fafafa", cursor: "pointer" }}
        >
          <option value="0">All Scores</option>
          <option value="60">60+</option>
          <option value="70">70+</option>
          <option value="80">80+</option>
          <option value="90">90+</option>
        </select>
        
        <button 
          onClick={exportCSV}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, background: "#fafafa", fontSize: "12px", cursor: "pointer", color: "#333" }}
        >
          <Download size={12} />
          Export
        </button>
        
        <button 
          onClick={fetchSuppliers}
          style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, background: "#fafafa", cursor: "pointer", color: "#333", display: "inline-flex", alignItems: "center" }}
        >
          <Loader size={12} />
        </button>
      </div>

      {/* Table */}
      <div style={{ width: "100%", overflowX: "auto", borderRadius: 12, border: "1px solid #E8D5C4", background: "#fff", boxShadow: "0 2px 8px rgba(93, 64, 55, 0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 900, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "25%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: "#5d4037" }}>
              <th onClick={() => handleSort("registeredName")} className="sortable" style={{ padding: "12px 14px", color: "white", backgroundColor: "#5d4037", textAlign: "left", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                Company <SortIcon field="registeredName" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th onClick={() => handleSort("entityType")} className="sortable" style={{ padding: "12px 14px", color: "white", backgroundColor: "#5d4037", textAlign: "left", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                Type <SortIcon field="entityType" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th onClick={() => handleSort("operationStage")} className="sortable" style={{ padding: "12px 14px", color: "white", backgroundColor: "#5d4037", textAlign: "left", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                Stage <SortIcon field="operationStage" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="servicesCell" style={{ padding: "12px 14px", color: "white", backgroundColor: "#5d4037", textAlign: "left", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Services</th>
              <th style={{ padding: "12px 14px", color: "white", backgroundColor: "#5d4037", textAlign: "left", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Location</th>
              <th onClick={() => handleSort("bigScore")} className="sortable scoreCell" style={{ padding: "12px 14px", color: "white", backgroundColor: "#5d4037", textAlign: "center", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                BIG Score <SortIcon field="bigScore" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th onClick={() => handleSort("completeness")} className="sortable completenessCell" style={{ padding: "12px 14px", color: "white", backgroundColor: "#5d4037", textAlign: "left", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                Complete <SortIcon field="completeness" sortField={sortField} sortDirection={sortDirection} />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "28px", textAlign: "center", color: "#8D6E63", fontStyle: "italic" }}>
                  No suppliers found matching your filters
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((supplier, idx) => {
                const pct = supplier.bigScore || 0
                return (
                  <tr
                    key={supplier.id}
                    style={{
                      borderBottom: idx < filteredSuppliers.length - 1 ? "1px solid #F0E6DA" : "none",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF7F3")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "#4A352F", fontWeight: 600 }}>
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={supplier.registeredName}
                      >
                        {supplier.registeredName}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                        <span style={{ fontSize: "10px", color: "#8D6E63", fontWeight: 500 }}>
                          {supplier.operationStage}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "#5D4037" }}>
                      <span
                        style={{
                          display: "inline-block",
                          maxWidth: "100%",
                          padding: "3px 9px",
                          background: "rgba(166,124,82,0.12)",
                          borderRadius: 12,
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "#7D5A50",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={supplier.entityType}
                      >
                        {supplier.entityType}
                      </span>
                    </td>

                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "#5D4037" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 9px",
                          background: "#d7ccc8",
                          borderRadius: 12,
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "#4a3729",
                        }}
                      >
                        {supplier.operationStage}
                      </span>
                    </td>

                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "#5D4037" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {supplier.services.slice(0, 3).map((s, i) => (
                          <span key={i} style={{ padding: "2px 8px", background: "#efebe9", borderRadius: 4, fontSize: "11px", color: "#5d4037" }}>
                            {s}
                          </span>
                        ))}
                        {supplier.services.length > 3 && (
                          <span style={{ padding: "2px 8px", background: "#f0f0f0", borderRadius: 4, fontSize: "11px", color: "#888" }}>
                            +{supplier.services.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: "13px",
                        color: "#5D4037",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={supplier.location}
                    >
                      {supplier.location || "Not specified"}
                    </td>

                    <td
                      style={{
                        padding: "12px 14px",
                        textAlign: "center",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: 12,
                          fontWeight: 600,
                          fontSize: "14px",
                          minWidth: 32,
                          textAlign: "center",
                          background: pct >= 80 ? "#e8f5e9" : pct >= 60 ? "#fff3e0" : "#fbe9e7",
                          color: pct >= 80 ? "#2e7d32" : pct >= 60 ? "#e65100" : "#c62828",
                        }}
                      >
                        {pct}
                      </span>
                    </td>

                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "#5D4037" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 8, background: "#E8D5C4", borderRadius: 4, overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              background: supplier.completeness >= 80 ? "#66bb6a" : supplier.completeness >= 60 ? "#ffa726" : "#ef5350",
                              width: `${supplier.completeness}%`,
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 600, minWidth: 35, textAlign: "right" }}>
                          {supplier.completeness}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}

// Sort Icon Component
const SortIcon = ({ field, sortField, sortDirection }) => {
  if (field !== sortField) {
    return <span className="sortIcon">↕</span>
  }
  return sortDirection === "asc" 
    ? <ChevronUp size={14} className="sortIcon" />
    : <ChevronDown size={14} className="sortIcon" />
}

<style jsx>{`
.supplierTableContainer {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.supplierTableLoading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  color: #666;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.supplierTableHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.supplierTableHeader h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.supplierTableStats {
  font-size: 14px;
  color: #666;
}

.totalSuppliers {
  color: #999;
  font-size: 12px;
}

.supplierTableFilters {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
}

.searchWrapper {
  flex: 1;
  min-width: 200px;
  position: relative;
}

.searchIcon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.searchInput {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  background: #fafafa;
}

.searchInput:focus {
  outline: none;
  border-color: #6d4c41;
  background: #fff;
}

.filterControls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.filterCheckbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #555;
  cursor: pointer;
}

.scoreFilter {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #555;
}

.scoreFilter select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  background: #fafafa;
  cursor: pointer;
}

.exportBtn, .refreshBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fafafa;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
}

.exportBtn:hover, .refreshBtn:hover {
  background: #f0f0f0;
  border-color: #bbb;
}

.refreshBtn {
  padding: 8px 10px;
}

.tableWrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #eee;
}

.supplierTable {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.supplierTable thead {
  background: #f8f6f4;
}

.supplierTable th {
  padding: 12px 14px;
  text-align: left;
  font-weight: 600;
  color: #4a3729;
  border-bottom: 2px solid #e8e0d8;
  white-space: nowrap;
  cursor: default;
}

.sortable {
  cursor: pointer !important;
  user-select: none;
}

.sortable:hover {
  background: #ede5dc;
}

.sortIcon {
  margin-left: 4px;
  opacity: 0.5;
  display: inline-block;
  vertical-align: middle;
}

.supplierTable td {
  padding: 12px 14px;
  border-bottom: 1px solid #f0ece8;
  vertical-align: middle;
}

.supplierTable tbody tr:hover {
  background: #faf8f6;
}

.companyCell {
  min-width: 180px;
}

.companyName {
  font-weight: 500;
  color: #2d1f14;
}

.tradingName {
  font-size: 12px;
  color: #888;
}

.regNumber {
  font-size: 11px;
  color: #aaa;
  font-family: monospace;
}

.entityTypeTag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  background: #e8e0d8;
  font-size: 12px;
  font-weight: 500;
  color: #4a3729;
}

.entitySize {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.stageTag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  background: #d7ccc8;
  font-size: 12px;
  font-weight: 500;
  color: #4a3729;
}

.yearsInfo {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.servicesCell {
  min-width: 180px;
}

.serviceList {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.serviceTag {
  padding: 2px 8px;
  background: #efebe9;
  border-radius: 4px;
  font-size: 11px;
  color: #5d4037;
}

.moreTag {
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 11px;
  color: #888;
}

.categoryList {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.categoryTag {
  padding: 1px 6px;
  border: 1px solid #d7ccc8;
  border-radius: 4px;
  font-size: 10px;
  color: #8d6e63;
}

.province {
  font-size: 11px;
  color: #999;
  text-transform: capitalize;
}

.scoreCell {
  text-align: center;
}

.scoreBadge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  min-width: 32px;
  text-align: center;
}

.scoreBadge.green {
  background: #e8f5e9;
  color: #2e7d32;
}

.scoreBadge.orange {
  background: #fff3e0;
  color: #e65100;
}

.scoreBadge.red {
  background: #fbe9e7;
  color: #c62828;
}

.completenessCell {
  min-width: 100px;
}

.completenessBar {
  position: relative;
  height: 20px;
  background: #f0ece8;
  border-radius: 10px;
  overflow: hidden;
  min-width: 80px;
}

.completenessFill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.completenessFill.green {
  background: #66bb6a;
}

.completenessFill.orange {
  background: #ffa726;
}

.completenessFill.red {
  background: #ef5350;
}

.completenessLabel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 600;
  color: #1a1a2e;
}

.actionsCell {
  text-align: center;
}

.viewBtn {
  padding: 4px 14px;
  border: 1px solid #8d6e63;
  border-radius: 4px;
  background: transparent;
  color: #6d4c41;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.viewBtn:hover {
  background: #8d6e63;
  color: #fff;
}

.noResults {
  padding: 40px !important;
  text-align: center !important;
  color: #999;
}

/* Modal Styles */
.supplierModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modalContent {
  background: #fff;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 32px;
  position: relative;
}

.modalClose {
  position: absolute;
  top: 16px;
  right: 20px;
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

.modalClose:hover {
  color: #333;
}

.modalHeader {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0ece8;
}

.modalHeader h2 {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 4px 0;
}

.modalTradingName {
  font-size: 14px;
  color: #888;
}

.modalGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .modalGrid {
    grid-template-columns: 1fr;
  }
}

.modalSection {
  margin-bottom: 16px;
}

.modalSection h4 {
  font-size: 14px;
  font-weight: 600;
  color: #4a3729;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0ece8;
}

.modalField {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 10px;
}

.modalField label {
  font-size: 11px;
  font-weight: 500;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modalField span, .modalField a {
  font-size: 14px;
  color: #1a1a2e;
}

.modalField a {
  color: #6d4c41;
  text-decoration: none;
}

.modalField a:hover {
  text-decoration: underline;
}

.modalTags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.modalTag {
  padding: 3px 12px;
  background: #f0ece8;
  border-radius: 12px;
  font-size: 12px;
  color: #4a3729;
}

.modalSection p {
  font-size: 14px;
  color: #444;
  line-height: 1.6;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .supplierTableContainer {
    padding: 16px;
  }
  
  .supplierTableFilters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filterControls {
    flex-wrap: wrap;
  }
  
  .supplierTable th, 
  .supplierTable td {
    padding: 8px 10px;
    font-size: 12px;
  }
  
  .companyCell {
    min-width: 120px;
  }
}`}</style>