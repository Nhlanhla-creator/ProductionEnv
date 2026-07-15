"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Eye, X, Trophy, Users, Building, TrendingUp } from "lucide-react";
import { SupportSMETable } from "./support-sme-table";
import { auth, db } from "../../firebaseConfig";
import { mapStatusToStageId } from "./stageConfig";

// ─── Successful Deals Table ───────────────────────────────────────────────────
// NOTE: with feedback #1 applied in SupportSMETable (admitted SMEs no longer
// appear in the matching table), the primary home for these records is now
// the My Cohorts page. This tab is kept as a lightweight secondary view fed
// from whatever SupportSMETable last loaded, using the same shared stage
// vocabulary so "Admitted" here always matches "Admitted" everywhere else.
const SuccessfulSupportDealsTable = ({ successfulDeals }) => {
  const [selectedDeal, setSelectedDeal] = useState(null);

  const getStatusColor = (status) => {
    const stageId = mapStatusToStageId(status);
    if (stageId === "admitted") return "#1B5E20";
    if (stageId === "withdrawn") return "#616161";
    if (stageId === "declined") return "#B45309";
    return "#666";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-ZA", {
        year: "numeric", month: "short", day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <style>{`.stt-th { color: #4a352f !important; }`}</style>
      <div className="overflow-x-auto rounded-xl border border-[#E8D5C4] shadow-sm">
        <table className="w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-[#F0E6D9]">
              {["Business Name", "Funding", "Equity", "Start Date", "Sector", "Location", "Status", "Actions"].map((header, idx) => (
                <th key={header} className={`stt-th py-3 px-3 text-left font-semibold text-xs uppercase tracking-wider ${idx < 7 ? 'border-r border-[#E8D5C4]' : ''}`}>
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
                    <p className="text-gray-400 text-sm">Deals reaching Admitted status will appear here — see My Cohorts for the full view</p>
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
                      {mapStatusToStageId(deal.currentStatus) === "admitted" ? "Admitted" : deal.currentStatus}
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
            <div className="space-y-4">
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
  );
};

// ─── Main Tabbed Component ─────────────────────────────────────────────────────
const SupportTabbedTables = ({ filters, stageFilter, loading, onStageOverride }) => {
  const [activeTab, setActiveTab] = useState("my-matches");
  const [successfulDeals, setSuccessfulDeals] = useState([]);
  const [smeMatches, setSmeMatches] = useState([]);
  const isFirstLoad = useRef(true);

  const extractSuccessfulDeals = (smes) =>
    smes
      .filter((sme) => mapStatusToStageId(sme.currentStatus || sme.pipelineStage) === "admitted")
      .map((sme) => ({
        id: sme.id,
        smseName: sme.name,
        fundingRequired: sme.fundingRequired,
        equityOffered: sme.equityOffered,
        startDate: sme.applicationDate,
        sector: sme.sector,
        location: sme.location,
        guarantees: sme.guarantees,
        servicesRequired: sme.servicesRequired,
        currentStatus: sme.currentStatus || sme.pipelineStage,
      }));

  useEffect(() => {
    if (smeMatches.length > 0) setSuccessfulDeals(extractSuccessfulDeals(smeMatches));
  }, [smeMatches]);

  const handleSMEsLoaded = useCallback((smes) => {
    setSmeMatches(smes);
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (window.catalystNotifications?.checkForChanges) {
      window.catalystNotifications.checkForChanges(smes);
    }
  }, []);

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex mb-0 bg-gradient-to-r from-[#F5EBE0] to-[#FAF5EF] rounded-t-2xl p-2 border border-[#E8D5C4] border-b-0 shadow-sm">
        {[
          { id: "my-matches", icon: <Users size={18} />, label: "Pipeline Matches", count: smeMatches.length },
          { id: "successful-deals", icon: <Trophy size={18} />, label: "Admitted", count: successfulDeals.length },
        ].map(({ id, icon, label, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-300
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
        {activeTab === "my-matches" && (
          <SupportSMETable
            filters={filters}
            stageFilter={stageFilter}
            onSMEsLoaded={handleSMEsLoaded}
            onStageOverride={onStageOverride}
          />
        )}
        {activeTab === "successful-deals" && (
          <div className="p-6">
            <SuccessfulSupportDealsTable successfulDeals={successfulDeals} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportTabbedTables;