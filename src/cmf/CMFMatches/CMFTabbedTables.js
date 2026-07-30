import React, { useState, useEffect } from "react"
import { Users, Trophy, Eye, X, Building, Search, Award } from "lucide-react"
import CMFSMETable from "./CMFSMETable"

const CMFPartnerDetailsModal = ({ partner, isOpen, onClose, type }) => {
  if (!isOpen || !partner) return null

  const getMatchColor = (pct) => {
    if (pct >= 80) return "#2e7d32"
    if (pct >= 60) return "#e65100"
    return "#c62828"
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-[550px] w-[95%] shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {type === 'funder' ? <Building size={24} className="text-[#8D6E63]" /> : <Award size={24} className="text-[#8D6E63]" />}
            <h2 className="text-xl font-bold text-[#3E2723]">{type === 'funder' ? 'Funder Details' : 'Catalyst Details'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 font-sans">
          <div>
            <h3 className="text-lg font-bold text-[#5D4037] mb-1">{partner.name}</h3>
            <p className="text-xs text-gray-500 bg-[#FAF5EF] inline-block px-2.5 py-1 rounded-md border border-[#E8D5C4] font-semibold">
              {partner.type}
            </p>
          </div>

          <div className="bg-[#FAF5EF] p-4 rounded-xl border border-[#E8D5C4] space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[#E8D5C4]/60">
              <span className="text-xs text-gray-500 font-semibold">Match Fit</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${partner.matchPercentage}%`,
                      backgroundColor: getMatchColor(partner.matchPercentage)
                    }}
                  />
                </div>
                <span className="text-sm font-bold" style={{ color: getMatchColor(partner.matchPercentage) }}>
                  {partner.matchPercentage}%
                </span>
              </div>
            </div>

            {type === 'funder' ? (
              <div className="flex justify-between items-center pb-2 border-b border-[#E8D5C4]/60">
                <span className="text-xs text-gray-500 font-semibold">Funding Range</span>
                <span className="text-sm font-semibold text-[#5D4037]">{partner.fundingRange}</span>
              </div>
            ) : (
              <div className="flex justify-between items-center pb-2 border-b border-[#E8D5C4]/60">
                <span className="text-xs text-gray-500 font-semibold">Support Focus</span>
                <span className="text-sm font-semibold text-[#5D4037]">{partner.focus}</span>
              </div>
            )}

            <div className="flex justify-between items-center pb-2 border-b border-[#E8D5C4]/60">
              <span className="text-xs text-gray-500 font-semibold">Location Focus</span>
              <span className="text-sm font-semibold text-[#5D4037]">{partner.location}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-500 font-semibold pt-0.5">Sectors Focus</span>
              <span className="text-sm font-semibold text-[#5D4037] text-right max-w-[60%]">
                {partner.sectors?.join(' • ')}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">About Organization</h4>
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              {partner.description || "No description provided."}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Details</h4>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold">Contact Person</span>
                <span className="text-sm font-semibold text-[#5D4037]">{partner.contactPerson}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold">Email Address</span>
                <span className="text-sm font-semibold text-[#5D4037] select-all">{partner.email}</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-6 py-3 bg-gradient-to-r from-[#8D6E63] to-[#5D4037] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
        >
          Close Details
        </button>
      </div>
    </div>
  )
}

const SuccessfulDealsTable = ({ successfulDeals }) => {
  const [selectedDeal, setSelectedDeal] = useState(null)

  const getStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase()
    if (statusLower.includes("active")) return "#1B5E20"
    if (statusLower.includes("exit")) return "#263238"
    if (statusLower.includes("completed")) return "#2196f3"
    if (statusLower.includes("review")) return "#E65100"
    return "#666"
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("en-ZA", {
        year: "numeric", month: "short", day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-[#E8D5C4] shadow-sm font-sans">
        <table className="w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-[#4a352f]">
              {["SMSE Name", "Funding", "Equity", "Start Date", "Sector", "Location", "Status", "Actions"].map((header, idx) => (
                <th key={header} className={`py-3 px-3 text-left text-white font-semibold text-xs uppercase tracking-wider ${idx < 7 ? 'border-r border-[#2A1A15]' : ''}`}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {successfulDeals.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Trophy size={40} className="text-[#D7CCC8]" />
                    <p className="text-gray-400 font-medium">No successful deals yet</p>
                    <p className="text-gray-400 text-sm">Deals reaching Active or Exited status will appear here</p>
                  </div>
                </td>
              </tr>
            ) : (
              successfulDeals.map((deal) => (
                <tr key={deal.id} className="border-b border-[#F0E6DC] hover:bg-[#FAF5EF] transition-all">
                  <td className="py-3 px-3 text-[#5D4037] font-medium">{deal.smseName}</td>
                  <td className="py-3 px-3 text-[#5D4037]">{deal.fundingRequired}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-1 bg-[#FFF3E0] text-[#E65100] rounded-full text-xs font-semibold">
                      {deal.equityOffered}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#5D4037] text-xs">{formatDate(deal.startDate)}</td>
                  <td className="py-3 px-3 text-[#5D4037]">{deal.sector}</td>
                  <td className="py-3 px-3 text-[#5D4037]">{deal.location}</td>
                  <td className="py-3 px-3">
                    <span 
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                      style={{ 
                        backgroundColor: `${getStatusColor(deal.currentStatus)}20`,
                        color: getStatusColor(deal.currentStatus),
                        borderColor: `${getStatusColor(deal.currentStatus)}40`
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(deal.currentStatus) }} />
                      {deal.currentStatus === "Exit" ? "Exited" : deal.currentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <button 
                      onClick={() => setSelectedDeal(deal)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8D6E63] text-white rounded-lg text-xs font-medium hover:bg-[#5D4037] transition-all"
                    >
                      <Eye size={12} />
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Deal Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] animate-fadeIn" onClick={() => setSelectedDeal(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-[500px] w-[95%] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Building size={24} className="text-[#1B5E20]" />
                <h2 className="text-xl font-bold text-[#3E2723]">Deal Details</h2>
              </div>
              <button onClick={() => setSelectedDeal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 font-sans">
              <h3 className="text-lg font-semibold text-[#8D6E63]">{selectedDeal.smseName}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs text-gray-500">Funding</span><p className="text-sm font-medium text-[#5D4037]">{selectedDeal.fundingRequired}</p></div>
                <div><span className="text-xs text-gray-500">Equity</span><p className="text-sm font-medium text-[#5D4037]">{selectedDeal.equityOffered}</p></div>
                <div><span className="text-xs text-gray-500">Start Date</span><p className="text-sm font-medium text-[#5D4037]">{formatDate(selectedDeal.startDate)}</p></div>
                <div><span className="text-xs text-gray-500">Status</span><p className="text-sm font-medium text-[#5D4037]">{selectedDeal.currentStatus}</p></div>
                <div><span className="text-xs text-gray-500">Sector</span><p className="text-sm font-medium text-[#5D4037]">{selectedDeal.sector}</p></div>
                <div><span className="text-xs text-gray-500">Location</span><p className="text-sm font-medium text-[#5D4037]">{selectedDeal.location}</p></div>
              </div>
            </div>
            <button 
              onClick={() => setSelectedDeal(null)}
              className="w-full mt-6 py-3 bg-gradient-to-r from-[#8D6E63] to-[#5D4037] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default function CMFTabbedTables({ 
  filters, 
  stageFilter, 
  smeMatches = [], 
  funderMatches = [],
  catalystMatches = [],
  loading = false, 
  onUpdateStage, 
  onStageOverride
}) {
  const [activeTab, setActiveTab] = useState("businesses")
  const [businessSubTab, setBusinessSubTab] = useState("pipeline")
  const [funderSearch, setFunderSearch] = useState("")
  const [catalystSearch, setCatalystSearch] = useState("")
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [partnerModalType, setPartnerModalType] = useState(null)

  // Separate Pipeline Matches from Successful/Active Deals
  const pipelineMatches = React.useMemo(() => {
    return smeMatches.filter((sme) => {
      const status = (sme.currentStatus || sme.pipelineStage || "").toLowerCase()
      return !status.includes("active") && !status.includes("exit") && !status.includes("admitted")
    })
  }, [smeMatches])

  const successfulDeals = React.useMemo(() => {
    return smeMatches
      .filter((sme) => {
        const status = (sme.currentStatus || sme.pipelineStage || "").toLowerCase()
        return status.includes("active") || status.includes("exit") || status.includes("admitted")
      })
      .map((sme) => ({
        id: sme.id,
        smseName: sme.name,
        fundingRequired: sme.fundingRequired,
        equityOffered: sme.equityOffered,
        startDate: sme.applicationDate,
        sector: sme.sector,
        location: sme.location,
        currentStatus: sme.currentStatus || sme.pipelineStage,
      }))
  }, [smeMatches])

  // Funder Filtering
  const filteredFunders = React.useMemo(() => {
    return funderMatches.filter((item) => {
      // Keyword search
      if (funderSearch.trim()) {
        const q = funderSearch.toLowerCase()
        const match = 
          item.name.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          item.contactPerson.toLowerCase().includes(q)
        if (!match) return false
      }

      // Location filter
      if (filters.location && filters.location !== "") {
        const locLower = filters.location.toLowerCase()
        if (!item.location.toLowerCase().includes(locLower) && item.location.toLowerCase() !== "national") return false
      }

      // Match score filter
      if (filters.matchScore && item.matchPercentage < filters.matchScore) return false

      // Sectors filter
      if (filters.sectors && filters.sectors.length > 0) {
        const hasSectorMatch = item.sectors.some(sec => 
          filters.sectors.some(fSec => fSec.toLowerCase() === sec.toLowerCase())
        )
        if (!hasSectorMatch) return false
      }

      return true
    })
  }, [funderMatches, funderSearch, filters])

  // Catalyst Filtering
  const filteredCatalysts = React.useMemo(() => {
    return catalystMatches.filter((item) => {
      // Keyword search
      if (catalystSearch.trim()) {
        const q = catalystSearch.toLowerCase()
        const match = 
          item.name.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          item.focus.toLowerCase().includes(q) ||
          item.contactPerson.toLowerCase().includes(q)
        if (!match) return false
      }

      // Location filter
      if (filters.location && filters.location !== "") {
        const locLower = filters.location.toLowerCase()
        if (!item.location.toLowerCase().includes(locLower) && item.location.toLowerCase() !== "national") return false
      }

      // Match score filter
      if (filters.matchScore && item.matchPercentage < filters.matchScore) return false

      // Sectors filter
      if (filters.sectors && filters.sectors.length > 0) {
        const hasSectorMatch = item.sectors.some(sec => 
          filters.sectors.some(fSec => fSec.toLowerCase() === sec.toLowerCase())
        )
        if (!hasSectorMatch) return false
      }

      return true
    })
  }, [catalystMatches, catalystSearch, filters])

  return (
    <div className="w-full font-sans">
      {/* Tab Navigation */}
      <div className="flex mb-0 bg-gradient-to-r from-[#F5EBE0] to-[#FAF5EF] rounded-t-2xl p-2 border border-[#E8D5C4] border-b-0 shadow-sm overflow-x-auto">
        {[
          { id: "businesses", icon: <Users size={18} />, label: "Businesses", count: pipelineMatches.length },
          { id: "funders", icon: <Building size={18} />, label: "Funders", count: filteredFunders.length },
          { id: "catalysts", icon: <Award size={18} />, label: "Catalysts", count: filteredCatalysts.length },
        ].map(({ id, icon, label, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap min-w-[140px]
              ${activeTab === id 
                ? 'bg-gradient-to-r from-[#8D6E63] to-[#5D4037] text-white shadow-lg' 
                : 'text-[#5D4037] hover:bg-white/50'}
            `}
          >
            {icon}
            {label}
            <span className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${activeTab === id ? 'bg-white/20 text-white' : 'bg-[#8D6E63]/10 text-[#5D4037]'}
            `}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-2xl border border-[#E8D5C4] border-t-0 shadow-lg">
        {/* Businesses Tab */}
        {activeTab === "businesses" && (
          <div className="space-y-0">
            {/* Sub-tab Selection */}
            <div className="flex border-b border-[#E8D5C4] px-6 pt-4 bg-[#FAF5EF]/50">
              <button
                onClick={() => setBusinessSubTab("pipeline")}
                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                  businessSubTab === "pipeline"
                    ? "border-[#8D6E63] text-[#5D4037]"
                    : "border-transparent text-gray-500 hover:text-[#5D4037]"
                }`}
              >
                Pipeline Matches ({pipelineMatches.length})
              </button>
              <button
                onClick={() => setBusinessSubTab("active")}
                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                  businessSubTab === "active"
                    ? "border-[#8D6E63] text-[#5D4037]"
                    : "border-transparent text-gray-500 hover:text-[#5D4037]"
                }`}
              >
                Active Deals ({successfulDeals.length})
              </button>
            </div>

            <div>
              {businessSubTab === "pipeline" ? (
                <CMFSMETable
                  filters={filters}
                  stageFilter={stageFilter}
                  smeMatches={pipelineMatches}
                  loading={loading}
                  onUpdateStage={onUpdateStage}
                  onStageOverride={onStageOverride}
                />
              ) : (
                <div className="p-6">
                  <SuccessfulDealsTable successfulDeals={successfulDeals} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Funder Matches View */}
        {activeTab === "funders" && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:align-center gap-4">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search funders by name, type, contact..."
                  value={funderSearch}
                  onChange={(e) => setFunderSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full rounded-xl border border-[#E8D5C4] focus:outline-none focus:ring-2 focus:ring-[#8D6E63] text-sm font-sans"
                />
                {funderSearch && (
                  <button onClick={() => setFunderSearch("")} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="text-xs text-[#8D6E63] font-semibold bg-[#FAF5EF] px-3 py-1.5 rounded-lg border border-[#E8D5C4]">
                Showing {filteredFunders.length} of {funderMatches.length} matches
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E8D5C4] shadow-sm font-sans">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-[#4a352f]">
                    {["Funder Name", "Funder Type", "Funding Ticket Size", "Location Focus", "Sectors Focus", "Match Fit", "Actions"].map((header, idx) => (
                      <th key={header} className={`py-3 px-4 text-left text-white font-semibold text-xs uppercase tracking-wider ${idx < 6 ? 'border-r border-[#2A1A15]' : ''}`}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFunders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-16 text-center text-gray-400">
                        No matched funders found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredFunders.map((funder) => (
                      <tr key={funder.id} className="border-b border-[#F0E6DC] hover:bg-[#FAF5EF] transition-all">
                        <td className="py-3 px-4 text-[#5D4037] font-bold">{funder.name}</td>
                        <td className="py-3 px-4 text-[#5D4037]">{funder.type}</td>
                        <td className="py-3 px-4 text-[#5D4037] font-semibold">{funder.fundingRange}</td>
                        <td className="py-3 px-4 text-[#5D4037]">{funder.location}</td>
                        <td className="py-3 px-4 text-[#5D4037] text-xs">
                          <div className="flex flex-wrap gap-1">
                            {funder.sectors.slice(0, 2).map((sec) => (
                              <span key={sec} className="bg-[#FAF5EF] text-[#8D6E63] border border-[#E8D5C4] px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">
                                {sec}
                              </span>
                            ))}
                            {funder.sectors.length > 2 && (
                              <span className="bg-[#FAF5EF] text-[#8D6E63] border border-[#E8D5C4] px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap font-bold" title={funder.sectors.slice(2).join(", ")}>
                                +{funder.sectors.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#2e7d32]">{funder.matchPercentage}%</span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              setSelectedPartner(funder)
                              setPartnerModalType('funder')
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8D6E63] text-white rounded-lg text-xs font-medium hover:bg-[#5D4037] transition-all"
                          >
                            <Eye size={12} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Catalyst Matches View */}
        {activeTab === "catalysts" && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:align-center gap-4">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search catalysts by name, type, focus..."
                  value={catalystSearch}
                  onChange={(e) => setCatalystSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full rounded-xl border border-[#E8D5C4] focus:outline-none focus:ring-2 focus:ring-[#8D6E63] text-sm font-sans"
                />
                {catalystSearch && (
                  <button onClick={() => setCatalystSearch("")} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="text-xs text-[#8D6E63] font-semibold bg-[#FAF5EF] px-3 py-1.5 rounded-lg border border-[#E8D5C4]">
                Showing {filteredCatalysts.length} of {catalystMatches.length} matches
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E8D5C4] shadow-sm font-sans">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-[#4a352f]">
                    {["Organization Name", "Catalyst Type", "Support Focus", "Location Focus", "Sectors Focus", "Match Fit", "Actions"].map((header, idx) => (
                      <th key={header} className={`py-3 px-4 text-left text-white font-semibold text-xs uppercase tracking-wider ${idx < 6 ? 'border-r border-[#2A1A15]' : ''}`}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalysts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-16 text-center text-gray-400">
                        No matched catalysts found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredCatalysts.map((catalyst) => (
                      <tr key={catalyst.id} className="border-b border-[#F0E6DC] hover:bg-[#FAF5EF] transition-all">
                        <td className="py-3 px-4 text-[#5D4037] font-bold">{catalyst.name}</td>
                        <td className="py-3 px-4 text-[#5D4037]">{catalyst.type}</td>
                        <td className="py-3 px-4 text-[#5D4037] font-semibold">{catalyst.focus}</td>
                        <td className="py-3 px-4 text-[#5D4037]">{catalyst.location}</td>
                        <td className="py-3 px-4 text-[#5D4037] text-xs">
                          <div className="flex flex-wrap gap-1">
                            {catalyst.sectors.slice(0, 2).map((sec) => (
                              <span key={sec} className="bg-[#FAF5EF] text-[#8D6E63] border border-[#E8D5C4] px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">
                                {sec}
                              </span>
                            ))}
                            {catalyst.sectors.length > 2 && (
                              <span className="bg-[#FAF5EF] text-[#8D6E63] border border-[#E8D5C4] px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap font-bold" title={catalyst.sectors.slice(2).join(", ")}>
                                +{catalyst.sectors.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#2e7d32]">{catalyst.matchPercentage}%</span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              setSelectedPartner(catalyst)
                              setPartnerModalType('catalyst')
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8D6E63] text-white rounded-lg text-xs font-medium hover:bg-[#5D4037] transition-all"
                          >
                            <Eye size={12} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Partner Details Modal */}
      <CMFPartnerDetailsModal
        partner={selectedPartner}
        isOpen={selectedPartner !== null}
        onClose={() => {
          setSelectedPartner(null)
          setPartnerModalType(null)
        }}
        type={partnerModalType}
      />
    </div>
  )
}
