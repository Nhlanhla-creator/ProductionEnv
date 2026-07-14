"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  Info, MapPin, Calendar, Filter, X, Eye, BarChart3, Star, 
  ChevronDown, ChevronUp, MoreVertical, CheckCircle, XCircle,
  AlertCircle, Clock, TrendingUp, Users, DollarSign, Building,
  LayoutGrid, Columns, Search, Download, MessageSquare, FileText,
  Share2, ArrowRight, ArrowUp, ArrowDown, SlidersHorizontal,
  RotateCcw, Settings, Shield, FileCheck, Target, Briefcase,
  Video, Link
} from "lucide-react";
import { db, auth, storage } from "../../firebaseConfig";
import { serverTimestamp, doc, updateDoc, getDoc, addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { usePortfolio } from "../../context/PortfolioContext";
import SMEDetailsModal from "./SMEDetailsModal";

// ─── Constants & Helpers ──────────────────────────────────────────────────────
const BIG_SCORE_LABELS = {
  excellent: { min: 80, label: "Excellent", color: "#22c55e" },
  strong: { min: 60, label: "Strong", color: "#86efac" },
  moderate: { min: 40, label: "Moderate", color: "#f59e0b" },
  weak: { min: 20, label: "Weak", color: "#ef4444" },
  critical: { min: 0, label: "Critical", color: "#dc2626" }
};

const MATCH_LABELS = {
  excellent: { min: 80, label: "Excellent Fit", stars: 5 },
  strong: { min: 60, label: "Strong Fit", stars: 4 },
  moderate: { min: 40, label: "Moderate Fit", stars: 3 },
  weak: { min: 20, label: "Weak Fit", stars: 2 },
  poor: { min: 0, label: "Poor Fit", stars: 1 }
};

const getBigScoreLabel = (score) => {
  for (const [key, value] of Object.entries(BIG_SCORE_LABELS)) {
    if (score >= value.min) return value;
  }
  return BIG_SCORE_LABELS.critical;
};

const getMatchLabel = (score) => {
  for (const [key, value] of Object.entries(MATCH_LABELS)) {
    if (score >= value.min) return value;
  }
  return MATCH_LABELS.poor;
};

const STATUS_STYLES = {
  "Matching": { bg: "#f5f0e1", text: "#7d5a50", border: "#c8b6a6", dot: "#7d5a50" },
  "Application": { bg: "#f0e6d9", text: "#4a352f", border: "#c8b6a6", dot: "#4a352f" },
  "Evaluation": { bg: "#faf7f2", text: "#7d5a50", border: "#c8b6a6", dot: "#7d5a50" },
  "Due Diligence": { bg: "#f5f0e1", text: "#4a352f", border: "#c8b6a6", dot: "#4a352f" },
  "Decision": { bg: "#f0e6d9", text: "#7d5a50", border: "#c8b6a6", dot: "#7d5a50" },
  "Term Sheet": { bg: "#faf7f2", text: "#4a352f", border: "#c8b6a6", dot: "#4a352f" },
  "Active": { bg: "#e6d7c3", text: "#4a352f", border: "#a67c52", dot: "#4a352f" },
  "Exited": { bg: "#e6d7c3", text: "#7d5a50", border: "#c8b6a6", dot: "#7d5a50" },
  "Decline": { bg: "#f0e6d9", text: "#a67c52", border: "#c8b6a6", dot: "#a67c52" },
  "On Hold": { bg: "#f5f0e1", text: "#7d5a50", border: "#c8b6a6", dot: "#7d5a50" }
};

const getStatusStyle = (status) => {
  if (!status) return STATUS_STYLES["Matching"];
  const statusLower = status.toLowerCase();
  for (const [key, value] of Object.entries(STATUS_STYLES)) {
    if (statusLower.includes(key.toLowerCase())) return value;
  }
  return { bg: "#f5f0e1", text: "#7d5a50", border: "#c8b6a6", dot: "#7d5a50" };
};

const PIPELINE_STAGES = {
  "Matching": "Application",
  "Application": "Evaluation",
  "Evaluation": "Due Diligence",
  "Due Diligence": "Decision",
  "Decision": "Term Sheet",
  "Term Sheet": "Active",
  "Active": "Exited"
};

const getNextStage = (currentStage) => {
  for (const [key, next] of Object.entries(PIPELINE_STAGES)) {
    if (currentStage?.toLowerCase().includes(key.toLowerCase())) return next;
  }
  return "Application";
};

const formatCurrency = (value) => {
  if (!value || value === "-" || value === "N/A") return value;
  const num = parseFloat(value.toString().replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return value;
  if (num >= 1000000) return `R${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `R${(num / 1000).toFixed(0)}K`;
  return `R${num}`;
};

const getStageFields = (stageName) => {
  switch (stageName) {
    case "Application":
    case "Matching":
      return { showMessage: true, showMeeting: true, showTermSheet: false, showAvailability: false };
    case "Evaluation":
    case "Due Diligence":
    case "Decision":
      return { showMessage: true, showMeeting: true, showTermSheet: false, showAvailability: true };
    case "Term Sheet":
      return { showMessage: true, showMeeting: true, showTermSheet: true, showAvailability: true };
    case "Active":
      return { showMessage: true, showMeeting: false, showTermSheet: false, showAvailability: false };
    case "Decline":
      return { showMessage: true, showMeeting: false, showTermSheet: false, showAvailability: false };
    default:
      return { showMessage: true, showMeeting: true, showTermSheet: false, showAvailability: false };
  }
};

// Small helper component so all popups can be portaled straight to <body>.
// This guarantees `position: fixed` popups are positioned against the real
// viewport instead of against some transformed ancestor further up the tree
// (which is what was causing popups to render in the wrong place / get cut off).
const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};

// ─── Component ────────────────────────────────────────────────────────────────
export function SupportSMETable({ filters, stageFilter, onSMEsLoaded, onStageOverride }) {
  const [smes, setSmes] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [columnVisibility, setColumnVisibility] = useState({
    sme: true, bigScore: true, match: true, fundingStage: true,
    fundingRequired: true, status: true, applied: true, action: true,
    location: false, sector: false, equity: false, guarantees: false,
    support: false, services: false, notes: false, assignedUser: false,
    daysInStage: false, lastActivity: false
  });
  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'bigScore', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [density, setDensity] = useState('comfortable');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    fundingStage: [], bigScoreRange: [0, 100], status: [], sector: []
  });
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [savedViews, setSavedViews] = useState([]);
  const [showSaveView, setShowSaveView] = useState(false);
  const [viewName, setViewName] = useState("");
  const [sentNDAs, setSentNDAs] = useState({});
  const [isNDASharing, setIsNDASharing] = useState({});
  const [updatedStages, setUpdatedStages] = useState({});

  // Popup states
  const [activePopup, setActivePopup] = useState(null);
  const [selectedSMEForPopup, setSelectedSMEForPopup] = useState(null);
  const [showSMEDetails, setShowSMEDetails] = useState(false);
  const [selectedSMEDetails, setSelectedSMEDetails] = useState(null);
  const [bigScoreData, setBigScoreData] = useState({
    compliance: { score: 0 }, legitimacy: { score: 0 },
    fundability: { score: 0 }, pis: { score: 0 }, leadership: { score: 0 }
  });
  const [matchBreakdownData, setMatchBreakdownData] = useState(null);
  const [stageUpdateData, setStageUpdateData] = useState({
    nextStage: "", message: "", meetingTime: "", meetingLocation: "", meetingPurpose: "", termSheetFile: null
  });
  const [stageFormErrors, setStageFormErrors] = useState({});
  const [isStageSubmitting, setIsStageSubmitting] = useState(false);
  const [availabilities, setAvailabilities] = useState([]);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [tempDates, setTempDates] = useState([]);
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" });
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const { enriched, catalystFormData, loading } = usePortfolio();

  // ─── Data Processing ────────────────────────────────────────────────────────
  useEffect(() => {
    const mapRow = (a) => {
      const entity = a.profile?.entityOverview || {};
      const funding = a.profile?.useOfFunds || {};
      const financials = a.profile?.financialOverview || {};
      const multiProgram = enriched.filter((e) => e.smeId === a.smeId).length > 1;
      
      return {
        id: a.smeId, docId: a.docId, programIndex: a.programIndex,
        name: (entity.registeredName || a.smeName || "N/A") + (multiProgram ? ` (P${parseInt(a.programIndex || 0) + 1})` : ""),
        location: entity.location || a.location || "N/A",
        province: entity.province || a.province || "N/A",
        sector: (entity.economicSectors || []).join(", ") || a.sector || "N/A",
        fundingStage: entity.operationStage || a.fundingStage || "N/A",
        fundingRequired: formatCurrency(funding.amountRequested || a.fundingRequired || "N/A"),
        fundingAmount: parseFloat((funding.amountRequested || a.fundingRequired || "0").toString().replace(/[^0-9.]/g, "")) || 0,
        equityOffered: funding.equityType || a.equityOffered || "N/A",
        guarantees: a.guarantees || "N/A",
        supportRequired: a.supportRequired || "N/A",
        servicesRequired: a.servicesRequired || "N/A",
        applicationDate: a.applicationDate ? new Date(a.applicationDate).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
        applicationDateRaw: a.applicationDate ? new Date(a.applicationDate) : null,
        matchPercentage: a.matchPercentage || 0,
        bigScore: a.bigScore || 0,
        compliance: a.compliance || 0, legitimacy: a.legitimacy || 0,
        fundability: a.fundability || 0, pis: a.pis || 0, leadership: a.leadership || 0,
        currentStatus: a.pipelineStage || a.status || "Matching",
        pipelineStage: a.pipelineStage || a.status || "Matching",
        nextStage: a.nextStage || getNextStage(a.pipelineStage || a.status),
        availableDates: a.availableDates || [],
        lastActivity: a.lastActivity || "N/A", daysInStage: a.daysInStage || 0,
        assignedUser: a.assignedUser || "Unassigned",
        notes: a.notes || "", documents: a.documents || [],
        matchBreakdown: a.matchBreakdown || null,
        userId: a.userId || a.smeId,
        email: a.email || entity.email || "N/A",
        director: entity.director || "N/A"
      };
    };

    let mapped = enriched.map(mapRow);

    if (stageFilter && stageFilter !== "initial") {
      const stageMapping = {
        matching: ["matching", "matched", "new"],
        application: ["application", "applied", "application sent", "new application"],
        evaluation: ["evaluation", "under review", "in review"],
        dueDiligence: ["due diligence", "shortlisted"],
        decision: ["decision"],
        termSheet: ["term sheet", "support approved"],
        active: ["active", "active support"],
        exited: ["exit", "exited", "completed", "graduated"],
        declined: ["decline", "declined", "rejected", "withdrawn", "support declined"]
      };
      const validStages = stageMapping[stageFilter] || [];
      if (validStages.length > 0) {
        mapped = mapped.filter(s => validStages.some(vs => (s.pipelineStage || "").toLowerCase().includes(vs)));
      }
    }

    mapped.sort((a, b) => b.bigScore - a.bigScore);
    setSmes(mapped);
    onSMEsLoaded?.(mapped);
  }, [enriched, stageFilter, catalystFormData]);

  // ─── Filtering & Sorting ────────────────────────────────────────────────────
  const filteredAndSortedSMEs = useMemo(() => {
    let result = [...smes];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(sme => 
        sme.name.toLowerCase().includes(query) || sme.sector.toLowerCase().includes(query) ||
        sme.location.toLowerCase().includes(query) || (sme.industry || "").toLowerCase().includes(query) ||
        (sme.director || "").toLowerCase().includes(query) || (sme.email || "").toLowerCase().includes(query)
      );
    }

    if (localFilters.fundingStage?.length > 0) {
      result = result.filter(sme => localFilters.fundingStage.some(stage => sme.fundingStage.toLowerCase().includes(stage.toLowerCase())));
    }

    result = result.filter(sme => sme.bigScore >= localFilters.bigScoreRange[0] && sme.bigScore <= localFilters.bigScoreRange[1]);

    if (localFilters.status?.length > 0) {
      result = result.filter(sme => localFilters.status.some(status => sme.currentStatus.toLowerCase().includes(status.toLowerCase())));
    }

    if (localFilters.sector?.length > 0) {
      result = result.filter(sme => localFilters.sector.some(sector => sme.sector.toLowerCase().includes(sector.toLowerCase())));
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key], bVal = b[sortConfig.key];
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal == null) aVal = ''; if (bVal == null) bVal = '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [smes, searchQuery, sortConfig, localFilters]);

  const totalPages = Math.ceil(filteredAndSortedSMEs.length / pageSize);
  const paginatedSMEs = filteredAndSortedSMEs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    setSortConfig(current => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const toggleColumn = (key) => setColumnVisibility(prev => ({ ...prev, [key]: !prev[key] }));

  const handleViewDetails = (sme) => {
    setSelectedSMEDetails(sme);
    setShowSMEDetails(true);
    setActivePopup(null);
  };

  // openPopup now takes a DOMRect directly (instead of an event), so it can be
  // called both from real click events AND reused later (e.g. from the Quick
  // Actions popup) without having to fabricate a fake event/rect.
  const openPopup = (type, sme, rect) => {
    let popupWidth, popupHeight;
    switch (type) {
      case 'bigScore': popupWidth = 380; popupHeight = 450; break;
      case 'match': popupWidth = 350; popupHeight = 350; break;
      case 'stage': popupWidth = 450; popupHeight = 500; break;
      case 'quickActions': popupWidth = 200; popupHeight = 250; break;
      default: popupWidth = 300; popupHeight = 300;
    }

    // Calculate position - center horizontally, below the element
    let x = rect.left + (rect.width / 2) - (popupWidth / 2);
    let y = rect.bottom + 8;

    // Adjust if goes off screen
    if (x + popupWidth > window.innerWidth - 20) x = window.innerWidth - popupWidth - 20;
    if (x < 20) x = 20;

    // If popup goes below viewport, show above the element
    if (y + popupHeight > window.innerHeight - 20) {
      y = rect.top - popupHeight - 8;
    }
    if (y < 20) y = 20;

    setSelectedSMEForPopup(sme);
    // Keep the original rect around so nested popups (opened from Quick
    // Actions) can be positioned against the same anchor.
    setActivePopup({ type, smeKey: `${sme.id}_${sme.programIndex}`, position: { x, y }, rect });

    if (type === 'bigScore') {
      setBigScoreData({
        compliance: { score: sme.compliance || 0 }, legitimacy: { score: sme.legitimacy || 0 },
        fundability: { score: sme.fundability || 0 }, pis: { score: sme.pis || 0 },
        leadership: { score: sme.leadership || 0 }
      });
    }
    if (type === 'match') {
      if (sme.matchBreakdown) {
        setMatchBreakdownData(sme.matchBreakdown);
      } else {
        try {
          const contextEntry = enriched.find((a) => a.smeId === sme.id && a.programIndex === sme.programIndex);
          const programs = catalystFormData?.programmeDetails?.programs || [];
          const program = programs[parseInt(sme.programIndex || 0)] || programs[0] || null;
          if (program && contextEntry?.profile) {
            const result = calculateMatchScore(contextEntry.profile, catalystFormData, program);
            setMatchBreakdownData(result.breakdown);
          }
        } catch (err) {
          console.error("Error computing match breakdown:", err);
        }
      }
    }
    if (type === 'stage') {
      setStageUpdateData({
        nextStage: sme.nextStage || getNextStage(sme.currentStatus),
        message: "", meetingTime: "", meetingLocation: "", meetingPurpose: "", termSheetFile: null
      });
      setStageFormErrors({});
      setAvailabilities(sme.availableDates || []);
    }
  };

  // Convenience wrapper for real DOM click events.
  const openPopupFromEvent = (type, sme, event) => {
    event.stopPropagation();
    openPopup(type, sme, event.currentTarget.getBoundingClientRect());
  };

  const closePopup = () => {
    setActivePopup(null);
    setSelectedSMEForPopup(null);
    setMatchBreakdownData(null);
    setShowCalendarPopup(false);
  };

  const handleStageUpdate = async () => {
    const stageFields = getStageFields(stageUpdateData.nextStage);
    const errors = {};
    if (!stageUpdateData.nextStage) errors.nextStage = "Please select a stage";
    if (stageFields.showMessage && !stageUpdateData.message.trim()) errors.message = "Please provide a message";
    // Meeting details are optional — scheduling a meeting is no longer a
    // requirement to advance a business to the next stage.
    if (Object.keys(errors).length > 0) { setStageFormErrors(errors); return; }
    
    setIsStageSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      const smeId = selectedSMEForPopup.id;
      const programIndex = selectedSMEForPopup.programIndex || "0";
      const documentId = `${user.uid}_${smeId}_${programIndex}`;
      
      const updateData = {
        status: stageUpdateData.nextStage, pipelineStage: stageUpdateData.nextStage,
        nextStage: getNextStage(stageUpdateData.nextStage),
        updatedAt: serverTimestamp(), lastMessage: stageUpdateData.message,
        lastActivity: new Date().toISOString()
      };

      if (stageFields.showMeeting && stageUpdateData.meetingLocation && stageUpdateData.meetingPurpose) {
        updateData.meetingDetails = {
          time: stageUpdateData.meetingTime, location: stageUpdateData.meetingLocation,
          purpose: stageUpdateData.meetingPurpose
        };
      }

      await updateDoc(doc(db, "catalystApplications", documentId), updateData);

      const stageKey = `${smeId}_${programIndex}`;
      setUpdatedStages(prev => ({ ...prev, [stageKey]: stageUpdateData.nextStage }));
      setSmes(prev => prev.map(s => 
        s.id === smeId && s.programIndex === programIndex
          ? { ...s, currentStatus: stageUpdateData.nextStage, pipelineStage: stageUpdateData.nextStage, nextStage: getNextStage(stageUpdateData.nextStage) }
          : s
      ));

      setNotification({ type: "success", message: `Application updated to ${stageUpdateData.nextStage} successfully` });
      closePopup();
    } catch (error) {
      console.error("Stage update error:", error);
      setNotification({ type: "error", message: `Failed to update status: ${error.message}` });
    } finally {
      setIsStageSubmitting(false);
    }
  };

  const handleShareNDA = async (sme) => {
    const smeKey = `${sme.id}_${sme.programIndex}`;
    try {
      setIsNDASharing(prev => ({ ...prev, [smeKey]: true }));
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const ndaDocRef = doc(db, "ndas", user.uid);
      const ndaDoc = await getDoc(ndaDocRef);
      if (!ndaDoc.exists()) { setNotification({ type: "error", message: "No NDA found." }); return; }

      const ndaData = ndaDoc.data();
      if (!ndaData.pdfUrl) { setNotification({ type: "error", message: "NDA has no PDF URL." }); return; }

      const existingShareQuery = query(collection(db, "shared_nda"), where("catalystId", "==", user.uid), where("smeId", "==", sme.id), where("programIndex", "==", sme.programIndex));
      const existingShare = await getDocs(existingShareQuery);
      
      if (existingShare.empty) {
        await addDoc(collection(db, "shared_nda"), {
          catalystId: user.uid, smeId: sme.id, smeName: sme.name,
          ndaId: ndaDoc.id, ndaUrl: ndaData.pdfUrl, ndaName: ndaData.ndaContent || "NDA Document",
          sharedAt: serverTimestamp(), status: "sent", programIndex: sme.programIndex
        });
      }

      setSentNDAs(prev => ({ ...prev, [smeKey]: true }));
      setNotification({ type: "success", message: `NDA shared with ${sme.name}` });
      closePopup();
    } catch (error) {
      setNotification({ type: "error", message: `Failed to share NDA: ${error.message}` });
    } finally {
      setIsNDASharing(prev => ({ ...prev, [smeKey]: false }));
    }
  };

  const handleExport = () => {
    try {
      const visibleCols = Object.entries(columnVisibility).filter(([_, v]) => v).map(([k]) => k);
      const headers = { sme: 'Business Name', bigScore: 'BIG Score', match: 'Match %', fundingStage: 'Funding Stage', fundingRequired: 'Funding Required', status: 'Status', applied: 'Applied Date', location: 'Location', sector: 'Sector', equity: 'Equity Offered', guarantees: 'Guarantees', support: 'Support Required', services: 'Services Required' };
      const headerRow = visibleCols.map(col => headers[col] || col).join(',');
      const dataRows = filteredAndSortedSMEs.map(sme => visibleCols.map(col => `"${String(sme[col] || '').replace(/"/g, '""')}"`).join(','));
      const csv = [headerRow, ...dataRows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `business-export-${new Date().toISOString().split('T')[0]}.csv`; link.click();
      URL.revokeObjectURL(url);
      setNotification({ type: "success", message: "Export downloaded" });
    } catch (error) {
      setNotification({ type: "error", message: "Export failed" });
    }
  };

  const calculateMatchScore = (smeProfileData, catalystFormData, program = null) => {
    const breakdown = {
      fundingStage: { score: 0, maxScore: 12.5, matched: false, details: {} },
      ticketSize: { score: 0, maxScore: 12.5, matched: false, details: {} },
      geographicFit: { score: 0, maxScore: 12.5, matched: false, details: {} },
      sectorMatch: { score: 0, maxScore: 12.5, matched: false, details: {} },
      instrumentFit: { score: 0, maxScore: 12.5, matched: false, details: {} },
      supportMatch: { score: 0, maxScore: 12.5, matched: false, details: {} },
      legalEntityFit: { score: 0, maxScore: 12.5, matched: false, details: {} },
      revenueThreshold: { score: 0, maxScore: 12.5, matched: false, details: {} }
    };
    const programData = program || catalystFormData?.programmeDetails?.programs?.[0] || {};
    const matchPrefs = catalystFormData?.programBriefMatchingPreference || catalystFormData?.generalMatchingPreference || {};
    const entity = smeProfileData.entityOverview || {};
    const funding = smeProfileData.useOfFunds || {};

    const smeStage = (entity.operationStage || "").toLowerCase();
    const accelStages = Array.isArray(matchPrefs.businessLifecycleStage) ? matchPrefs.businessLifecycleStage.map(s => s.toLowerCase()) : matchPrefs.businessLifecycleStage ? [matchPrefs.businessLifecycleStage.toLowerCase()] : [];
    if (smeStage && accelStages.some(s => smeStage.includes(s) || s.includes(smeStage))) { breakdown.fundingStage.score = 12.5; breakdown.fundingStage.matched = true; }

    const smeAmount = parseFloat((funding.amountRequested || "0").toString().replace(/[^0-9.]/g, "")) || 0;
    const minTicket = parseFloat((programData.minimumSupport || "0").toString().replace(/[^0-9.]/g, "")) || 0;
    const maxTicket = parseFloat((programData.maximumSupport || "0").toString().replace(/[^0-9.]/g, "")) || Infinity;
    if (smeAmount >= minTicket && smeAmount <= maxTicket) { breakdown.ticketSize.score = 12.5; breakdown.ticketSize.matched = true; }

    const totalScore = Object.values(breakdown).reduce((sum, b) => sum + (b.score || 0), 0);
    return { score: Math.round(totalScore), breakdown };
  };

  const getContextualAction = (sme) => {
    const status = (sme.currentStatus || "").toLowerCase();
    if (status.includes("matching")) return { label: "Review Match", icon: <Eye size={14} />, color: "#7d5a50" };
    if (status.includes("application")) return { label: "Review App", icon: <FileText size={14} />, color: "#7d5a50" };
    if (status.includes("evaluation")) return { label: "Evaluate", icon: <Search size={14} />, color: "#7d5a50" };
    if (status.includes("due diligence")) return { label: "Start DD", icon: <Shield size={14} />, color: "#7d5a50" };
    if (status.includes("decision")) return { label: "Decide", icon: <AlertCircle size={14} />, color: "#7d5a50" };
    if (status.includes("term sheet")) return { label: "Send Terms", icon: <FileCheck size={14} />, color: "#7d5a50" };
    if (status.includes("active")) return { label: "Monitor", icon: <TrendingUp size={14} />, color: "#7d5a50" };
    return { label: "Review", icon: <Eye size={14} />, color: "#7d5a50" };
  };

  const densityStyles = {
    'comfortable': { cell: 'py-3 px-3', header: 'py-3 px-3', fontSize: 'text-sm', avatarSize: 'w-8 h-8' },
    'compact': { cell: 'py-2 px-2', header: 'py-2 px-2', fontSize: 'text-xs', avatarSize: 'w-7 h-7' },
    'ultra-compact': { cell: 'py-1.5 px-1.5', header: 'py-1.5 px-1.5', fontSize: 'text-xs', avatarSize: 'w-6 h-6' }
  };
  const ds = densityStyles[density];

  useEffect(() => {
    const loadSentNDAs = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const snapshot = await getDocs(query(collection(db, "shared_nda"), where("catalystId", "==", user.uid), where("status", "==", "sent")));
        const sentMap = {};
        snapshot.docs.forEach(doc => { const data = doc.data(); sentMap[`${data.smeId}_${data.programIndex}`] = true; });
        setSentNDAs(sentMap);
      } catch (error) { console.error("Error loading sent NDAs:", error); }
    };
    if (auth.currentUser) loadSentNDAs();
  }, []);

  const saveCurrentView = () => {
    if (!viewName.trim()) return;
    setSavedViews(prev => [...prev, { name: viewName, columns: {...columnVisibility}, sort: {...sortConfig}, density }]);
    setViewName(""); setShowSaveView(false);
    setNotification({ type: "success", message: `View "${viewName}" saved!` });
  };

  const loadView = (view) => {
    setColumnVisibility(view.columns); setSortConfig(view.sort); setDensity(view.density);
    setNotification({ type: "success", message: `View "${view.name}" loaded!` });
  };

  const clearAllFilters = () => {
    setLocalFilters({ fundingStage: [], bigScoreRange: [0, 100], status: [], sector: [] });
    setSearchQuery('');
  };

  const handleDateSelect = (dates) => setTempDates(dates || []);
  const handleTimeChange = (field, value) => setTimeSlot(prev => ({ ...prev, [field]: value }));
  const removeAvailability = (date) => setAvailabilities(prev => prev.filter(a => a.date?.getTime?.() !== date?.getTime?.()));

  const saveSelectedDates = () => {
    const newAvailabilities = [
      ...availabilities,
      ...tempDates
        .filter(date => !availabilities.some(a => a.date?.getTime?.() === date.getTime?.()))
        .map(date => ({ date, timeSlots: [{ ...timeSlot }], timeZone, status: "available" }))
    ];
    setAvailabilities(newAvailabilities);
    setTempDates([]);
    setShowCalendarPopup(false);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-4 p-6">
      {notification && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${notification.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 text-current opacity-50 hover:opacity-100"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-[#faf7f2] rounded-t-2xl p-4 border border-[#e6d7c3] border-b-0 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d5a50]" />
            <input type="text" placeholder="Search by name, sector, location..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm focus:outline-none focus:border-[#7d5a50] focus:ring-2 focus:ring-[#7d5a50]/20 transition-all" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d5a50]"><X size={14} /></button>}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowColumnChooser(!showColumnChooser)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm">
                <Columns size={16} /> Columns <ChevronDown size={14} className={`transition-transform ${showColumnChooser ? 'rotate-180' : ''}`} />
              </button>
              {showColumnChooser && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColumnChooser(false)} />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-5 z-50 max-h-[500px] overflow-y-auto">
                    <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Column Visibility</h4>
                    {[{ key: 'sme', label: 'Business Name' },{ key: 'bigScore', label: 'BIG Score' },{ key: 'match', label: 'Match %' },{ key: 'status', label: 'Status' },{ key: 'action', label: 'Action' }].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-3 py-2 px-2 rounded-lg opacity-75">
                        <input type="checkbox" checked={true} disabled={true} className="rounded border-[#c8b6a6]" />
                        <span className="text-sm text-[#4a352f]">{label}</span>
                      </label>
                    ))}
                    <div className="border-t border-[#e6d7c3] my-2" />
                    {[{ key: 'fundingStage', label: 'Funding Stage' },{ key: 'fundingRequired', label: 'Funding Required' },{ key: 'applied', label: 'Applied Date' },{ key: 'location', label: 'Location' },{ key: 'sector', label: 'Sector' },{ key: 'equity', label: 'Equity Offered' },{ key: 'guarantees', label: 'Guarantees' },{ key: 'support', label: 'Support Required' },{ key: 'services', label: 'Services Required' }].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#faf7f2] cursor-pointer">
                        <input type="checkbox" checked={columnVisibility[key] || false} onChange={() => toggleColumn(key)} className="rounded border-[#c8b6a6] text-[#7d5a50]" />
                        <span className="text-sm text-[#4a352f]">{label}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            <select value={density} onChange={(e) => setDensity(e.target.value)} className="px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] cursor-pointer shadow-sm">
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
              <option value="ultra-compact">Ultra Compact</option>
            </select>

            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${showFilters ? 'bg-[#7d5a50] text-white' : 'bg-white border border-[#c8b6a6] text-[#4a352f] hover:bg-[#f5f0e1]'}`}>
              <SlidersHorizontal size={16} /> Filters
            </button>

            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#7d5a50] to-[#4a352f] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all shadow-sm">
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 p-5 bg-[#faf7f2] rounded-2xl border-2 border-[#e6d7c3] grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-[#e6d7c3]">
              <label className="block text-xs font-semibold text-[#4a352f] mb-3">BIG Score: {localFilters.bigScoreRange[0]} - {localFilters.bigScoreRange[1]}</label>
              <div className="flex items-center gap-3 mb-3">
                <input type="number" min="0" max="100" value={localFilters.bigScoreRange[0]} onChange={(e) => setLocalFilters(prev => ({ ...prev, bigScoreRange: [Math.min(parseInt(e.target.value) || 0, prev.bigScoreRange[1]), prev.bigScoreRange[1]] }))} className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                <span className="text-[#7d5a50]">to</span>
                <input type="number" min="0" max="100" value={localFilters.bigScoreRange[1]} onChange={(e) => setLocalFilters(prev => ({ ...prev, bigScoreRange: [prev.bigScoreRange[0], Math.max(parseInt(e.target.value) || 0, prev.bigScoreRange[0])] }))} className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
              </div>
              <input type="range" min="0" max="100" value={localFilters.bigScoreRange[0]} onChange={(e) => setLocalFilters(prev => ({ ...prev, bigScoreRange: [parseInt(e.target.value), prev.bigScoreRange[1]] }))} className="w-full accent-[#7d5a50]" />
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#e6d7c3]">
              <label className="block text-xs font-semibold text-[#4a352f] mb-3">Status</label>
              <div className="flex flex-wrap gap-1.5">
                {["Matching","Application","Evaluation","Due Diligence","Decision","Term Sheet","Active"].map(s => (
                  <button key={s} onClick={() => setLocalFilters(prev => ({ ...prev, status: prev.status.includes(s) ? prev.status.filter(x => x !== s) : [...prev.status, s] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.status.includes(s) ? 'bg-[#7d5a50] text-white' : 'bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]'}`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#e6d7c3]">
              <label className="block text-xs font-semibold text-[#4a352f] mb-3">Funding Stage</label>
              <div className="flex flex-wrap gap-1.5">
                {["Startup","Growth","Scale","Established"].map(s => (
                  <button key={s} onClick={() => setLocalFilters(prev => ({ ...prev, fundingStage: prev.fundingStage.includes(s) ? prev.fundingStage.filter(x => x !== s) : [...prev.fundingStage, s] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.fundingStage.includes(s) ? 'bg-[#7d5a50] text-white' : 'bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]'}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8"><div className="space-y-4">{[...Array(8)].map((_, i) => (<div key={i} className="h-10 bg-shimmer-light rounded-lg animate-shimmer" />))}</div></div>
        ) : (
          <>
            {/*
              FIX: sticky <th> only sticks relative to its nearest *scrolling*
              ancestor. The old wrapper only had `overflow-x-auto` (horizontal
              scroll only, unbounded height), so the page scrolled instead of
              this div — meaning there was never a vertical scroll happening
              inside the div for the header to stick against, and it scrolled
              away with the rest of the page.

              Giving the wrapper a fixed max-height + overflow-y-auto (via
              `overflow-auto`, which covers both axes) creates an actual
              internal scroll container, so `sticky top-0` on the header row
              now works as expected.
            */}
            <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
              <table className="w-full border-collapse" style={{ minWidth: '800px' }}>
                <thead>
                  <tr className="bg-gradient-to-r from-[#4a352f] via-[#7d5a50] to-[#4a352f]">
                    {/* Top-left corner cell is BOTH sticky-top (header) and
                        sticky-left (first column), so it needs a higher
                        z-index than plain sticky-top header cells or the
                        sticky-left body cells would otherwise cover it. */}
                    {columnVisibility.sme && <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520] sticky top-0 left-0 z-30`} style={{ backgroundColor: '#4a352f', minWidth: '150px', maxWidth: '200px' }}><button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-[#f5f0e1] transition-colors">Business Name <span className="flex flex-col -space-y-1 opacity-50"><ArrowUp size={10} /><ArrowDown size={10} /></span></button></th>}
                    {columnVisibility.bigScore && <th className={`${ds.header} text-center text-white font-semibold border-r border-[#3a2520] sticky top-0 z-20`} style={{ minWidth: '100px', backgroundColor: '#7d5a50' }}><button onClick={() => handleSort('bigScore')} className="flex items-center gap-1 mx-auto hover:text-[#f5f0e1] transition-colors">BIG Score <span className="flex flex-col -space-y-1 opacity-50"><ArrowUp size={10} /><ArrowDown size={10} /></span></button></th>}
                    {columnVisibility.match && <th className={`${ds.header} text-center text-white font-semibold border-r border-[#3a2520] sticky top-0 z-20`} style={{ minWidth: '100px', backgroundColor: '#7d5a50' }}><button onClick={() => handleSort('matchPercentage')} className="flex items-center gap-1 mx-auto hover:text-[#f5f0e1] transition-colors">Match % <span className="flex flex-col -space-y-1 opacity-50"><ArrowUp size={10} /><ArrowDown size={10} /></span></button></th>}
                    {columnVisibility.fundingStage && <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520] sticky top-0 z-20`} style={{ backgroundColor: '#7d5a50' }}>Funding Stage</th>}
                    {columnVisibility.fundingRequired && <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520] sticky top-0 z-20`} style={{ backgroundColor: '#7d5a50' }}><button onClick={() => handleSort('fundingAmount')} className="flex items-center gap-1 hover:text-[#f5f0e1] transition-colors">Funding <span className="flex flex-col -space-y-1 opacity-50"><ArrowUp size={10} /><ArrowDown size={10} /></span></button></th>}
                    {columnVisibility.status && <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520] sticky top-0 z-20`} style={{ backgroundColor: '#7d5a50' }}>Status</th>}
                    {columnVisibility.applied && <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520] sticky top-0 z-20`} style={{ backgroundColor: '#7d5a50' }}><button onClick={() => handleSort('applicationDateRaw')} className="flex items-center gap-1 hover:text-[#f5f0e1] transition-colors">Applied <span className="flex flex-col -space-y-1 opacity-50"><ArrowUp size={10} /><ArrowDown size={10} /></span></button></th>}
                    {columnVisibility.location && <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520] sticky top-0 z-20`} style={{ backgroundColor: '#7d5a50' }}>Location</th>}
                    {columnVisibility.sector && <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520] sticky top-0 z-20`} style={{ backgroundColor: '#7d5a50' }}>Sector</th>}
                    {columnVisibility.equity && <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520] sticky top-0 z-20`} style={{ backgroundColor: '#7d5a50' }}>Equity</th>}
                    {columnVisibility.guarantees && <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520] sticky top-0 z-20`} style={{ backgroundColor: '#7d5a50' }}>Guarantees</th>}
                    {columnVisibility.support && <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520] sticky top-0 z-20`} style={{ backgroundColor: '#7d5a50' }}>Support</th>}
                    {columnVisibility.services && <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520] sticky top-0 z-20`} style={{ backgroundColor: '#7d5a50' }}>Services</th>}
                    {columnVisibility.action && <th className={`${ds.header} text-center text-white font-semibold sticky top-0 z-20`} style={{ minWidth: '140px', backgroundColor: '#7d5a50' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedSMEs.length === 0 ? (
                    <tr><td colSpan={Object.values(columnVisibility).filter(Boolean).length} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-[#f5f0e1] flex items-center justify-center"><Users size={32} className="text-[#7d5a50] opacity-50" /></div>
                        <p className="text-lg font-semibold text-[#4a352f]">No Businesses Found</p>
                      </div>
                    </td></tr>
                  ) : (
                    paginatedSMEs.map((sme) => {
                      const bigScoreLabel = getBigScoreLabel(sme.bigScore);
                      const matchLabel = getMatchLabel(sme.matchPercentage);
                      const statusStyle = getStatusStyle(sme.currentStatus);
                      const contextualAction = getContextualAction(sme);
                      const smeKey = `${sme.id}_${sme.programIndex}`;
                      const currentStatus = updatedStages[smeKey] || sme.currentStatus;
                      const showNDAButton = currentStatus?.toLowerCase().includes("evaluation");
                      const ndaSent = sentNDAs[smeKey];

                      return (
                        <tr key={smeKey} className="border-b border-[#f0e6d9] hover:bg-[#fdf8f4] transition-all">
                          {columnVisibility.sme && (
                            <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f] sticky left-0 bg-white border-r border-[#f0e6d9] z-10`} style={{ minWidth: '150px', maxWidth: '200px' }}>
                              <div className="flex items-start gap-2">
                                <div className={`${ds.avatarSize} rounded-full bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5`}>{sme.name.charAt(0)}</div>
                                <button
                                  onClick={() => handleViewDetails(sme)}
                                  className="font-semibold text-xs leading-tight text-left hover:text-[#7d5a50] transition-colors"
                                  style={{ wordBreak: 'break-word', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                                >
                                  {sme.name}
                                </button>
                              </div>
                            </td>
                          )}
                          {columnVisibility.bigScore && (
                            <td className={`${ds.cell} text-center cursor-pointer`} onClick={(e) => openPopupFromEvent('bigScore', sme, e)}>
                              <div className="flex flex-col items-center gap-1">
                                <div className="relative w-11 h-11">
                                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#e6d7c3" strokeWidth="3" />
                                    <circle cx="18" cy="18" r="14" fill="none" stroke={bigScoreLabel.color} strokeWidth="3" strokeDasharray={`${sme.bigScore * 0.88} 88`} strokeLinecap="round" />
                                  </svg>
                                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: bigScoreLabel.color }}>{sme.bigScore}</span>
                                </div>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${bigScoreLabel.color}20`, color: bigScoreLabel.color }}>{bigScoreLabel.label}</span>
                              </div>
                            </td>
                          )}
                          {columnVisibility.match && (
                            <td className={`${ds.cell} text-center cursor-pointer`} onClick={(e) => openPopupFromEvent('match', sme, e)}>
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex">{[...Array(5)].map((_, i) => (<Star key={i} size={12} className={i < matchLabel.stars ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'} />))}</div>
                                <span className="text-sm font-bold text-[#4a352f]">{sme.matchPercentage}%</span>
                                <span className="text-xs text-[#7d5a50]">{matchLabel.label}</span>
                              </div>
                            </td>
                          )}
                          {columnVisibility.fundingStage && <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}><span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f5f0e1] rounded-full text-xs font-medium">{sme.fundingStage}</span></td>}
                          {columnVisibility.fundingRequired && <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}><span className="font-semibold">{sme.fundingRequired}</span></td>}
                          {columnVisibility.status && (
                            <td className={`${ds.cell}`}>
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border" style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.border }}>
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusStyle.dot }} />{currentStatus}
                              </span>
                            </td>
                          )}
                          {columnVisibility.applied && <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}><div className="flex items-center gap-1.5"><Calendar size={14} className="text-[#7d5a50]" />{sme.applicationDate}</div></td>}
                          {columnVisibility.location && <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}>{sme.location}</td>}
                          {columnVisibility.sector && <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}>{sme.sector}</td>}
                          {columnVisibility.equity && <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}>{sme.equityOffered}</td>}
                          {columnVisibility.guarantees && <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}><span className="line-clamp-1">{sme.guarantees}</span></td>}
                          {columnVisibility.support && <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}><span className="line-clamp-1">{sme.supportRequired}</span></td>}
                          {columnVisibility.services && <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}><span className="line-clamp-1">{sme.servicesRequired}</span></td>}
                          {columnVisibility.action && (
                            <td className={`${ds.cell} text-center`} style={{ minWidth: '140px' }}>
                              <div className="flex flex-col gap-1.5 items-center">
                                <button onClick={(e) => openPopupFromEvent('stage', sme, e)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:shadow-lg w-full justify-center" style={{ backgroundColor: contextualAction.color }}>
                                  {contextualAction.icon} {contextualAction.label}
                                </button>
                                <button onClick={(e) => openPopupFromEvent('quickActions', sme, e)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all w-full justify-center border" style={{ color: contextualAction.color, borderColor: contextualAction.color + '40', backgroundColor: contextualAction.color + '10' }}>
                                  <MoreVertical size={12} /> Quick Actions
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#e6d7c3] bg-[#faf7f2] rounded-b-2xl">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#4a352f]">Showing {Math.min((currentPage-1)*pageSize+1, filteredAndSortedSMEs.length)}-{Math.min(currentPage*pageSize, filteredAndSortedSMEs.length)} of {filteredAndSortedSMEs.length} Businesses</span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f]">
                  <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage===1} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">First</button>
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Prev</button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pn; if(totalPages<=5) pn=i+1; else if(currentPage<=3) pn=i+1; else if(currentPage>=totalPages-2) pn=totalPages-4+i; else pn=currentPage-2+i;
                  return <button key={pn} onClick={() => setCurrentPage(pn)} className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage===pn ? 'bg-[#7d5a50] text-white' : 'bg-white border border-[#c8b6a6] text-[#4a352f]'}`}>{pn}</button>;
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Next</button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage===totalPages} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Last</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── BIG Score Popup ─────────────────────────────────────────────────── */}
      {activePopup?.type === 'bigScore' && selectedSMEForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden animate-fadeIn"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: '380px', maxHeight: '450px', overflowY: 'auto' }}>
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">BIG Score</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[200px]">{selectedSMEForPopup.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-xl font-bold">{selectedSMEForPopup.bigScore}</div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {[{ key: 'compliance', label: 'Compliance', desc: 'Regulatory & legal standing' },
                { key: 'legitimacy', label: 'Legitimacy', desc: 'Business verification status' },
                { key: 'fundability', label: 'Fundability', desc: 'Investment readiness' },
                { key: 'pis', label: 'PIS Score', desc: 'Public Interest Score' },
                { key: 'leadership', label: 'Leadership', desc: 'Management capability' }
              ].map(({ key, label, desc }) => {
                const score = bigScoreData[key]?.score || 0;
                const lbl = getBigScoreLabel(score);
                return (
                  <div key={key} className="bg-[#faf7f2] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div><span className="text-xs font-semibold text-[#4a352f]">{label}</span><p className="text-[10px] text-[#7d5a50]">{desc}</p></div>
                      <span className="text-sm font-bold" style={{ color: lbl.color }}>{score}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#e6d7c3] rounded-full"><div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: lbl.color }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </PopupPortal>
      )}

      {/* ─── Match Breakdown Popup ───────────────────────────────────────────── */}
      {activePopup?.type === 'match' && selectedSMEForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden animate-fadeIn"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: '350px', maxHeight: '350px', overflowY: 'auto' }}>
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Match Breakdown</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[200px]">{selectedSMEForPopup.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold">{selectedSMEForPopup.matchPercentage}%</div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {matchBreakdownData ? Object.entries(matchBreakdownData).map(([key, data]) => {
                if (!data || typeof data !== 'object') return null;
                const labels = { fundingStage: "Funding Stage", ticketSize: "Ticket Size", geographicFit: "Geographic Fit", sectorMatch: "Sector Match", instrumentFit: "Instrument Fit", supportMatch: "Support Match", legalEntityFit: "Legal Entity", revenueThreshold: "Revenue Threshold" };
                return (
                  <div key={key} className={`p-3 rounded-lg border text-xs ${data.matched ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#4a352f]">{labels[key] || key}</span>
                      {data.matched ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                    </div>
                  </div>
                );
              }) : <p className="text-xs text-gray-500 text-center py-4">Loading breakdown...</p>}
            </div>
          </div>
        </PopupPortal>
      )}

      {/* ─── Stage Update Popup ───────────────────────────────────────────────── */}
      {activePopup?.type === 'stage' && selectedSMEForPopup && (() => {
        const stageFields = getStageFields(stageUpdateData.nextStage);
        return (
          <PopupPortal>
            <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
            <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden animate-fadeIn"
              style={{ top: activePopup.position.y, left: activePopup.position.x, width: '450px', maxHeight: '550px', overflowY: 'auto' }}>
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Update Stage</p>
                    <h3 className="text-sm font-bold mt-0.5 truncate max-w-[300px]">{selectedSMEForPopup.name}</h3>
                  </div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1">Select Next Stage *</label>
                  <select value={stageUpdateData.nextStage} onChange={(e) => setStageUpdateData(prev => ({ ...prev, nextStage: e.target.value }))}
                    className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${stageFormErrors.nextStage ? 'border-red-500' : 'border-[#c8b6a6]'}`}>
                    <option value="">Choose a stage...</option>
                    {Object.keys(PIPELINE_STAGES).map(s => (<option key={s} value={s}>{s}</option>))}
                    <option value="Decline">Decline</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                  {stageFormErrors.nextStage && <p className="text-red-500 text-xs mt-1">{stageFormErrors.nextStage}</p>}
                </div>

                {stageUpdateData.nextStage && (
                  <>
                    {stageFields.showMessage && (
                      <div>
                        <label className="block text-xs font-semibold text-[#4a352f] mb-1">Message to Business *</label>
                        <textarea value={stageUpdateData.message} onChange={(e) => setStageUpdateData(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Enter your message..." rows={3}
                          className={`w-full px-3 py-2 border-2 rounded-lg text-xs resize-y ${stageFormErrors.message ? 'border-red-500' : 'border-[#c8b6a6]'}`} />
                        {stageFormErrors.message && <p className="text-red-500 text-xs mt-1">{stageFormErrors.message}</p>}
                      </div>
                    )}

                    {stageFields.showMeeting && (
                      <div className="bg-[#faf7f2] rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-semibold text-[#4a352f] flex items-center gap-2"><Video size={14} /> Schedule Meeting <span className="font-normal text-[#7d5a50] normal-case">(optional)</span></h4>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Meeting Time</label>
                          <input type="datetime-local" value={stageUpdateData.meetingTime} onChange={(e) => setStageUpdateData(prev => ({ ...prev, meetingTime: e.target.value }))}
                            className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Location</label>
                          <input type="text" value={stageUpdateData.meetingLocation} onChange={(e) => setStageUpdateData(prev => ({ ...prev, meetingLocation: e.target.value }))}
                            placeholder="Office, Virtual, etc."
                            className="w-full px-3 py-2 border-2 rounded-lg text-xs border-[#c8b6a6]" />
                        </div>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Purpose</label>
                          <input type="text" value={stageUpdateData.meetingPurpose} onChange={(e) => setStageUpdateData(prev => ({ ...prev, meetingPurpose: e.target.value }))}
                            placeholder="Initial discussion, strategy review, etc."
                            className="w-full px-3 py-2 border-2 rounded-lg text-xs border-[#c8b6a6]" />
                        </div>
                      </div>
                    )}

                    {stageFields.showAvailability && (
                      <div className="bg-[#faf7f2] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-semibold text-[#4a352f] flex items-center gap-2"><Calendar size={14} /> Your Availability</h4>
                          <button onClick={() => setShowCalendarPopup(true)} className="flex items-center gap-1 px-3 py-1.5 bg-[#7d5a50] text-white rounded-lg text-xs hover:bg-[#4a352f] transition-all">
                            <Calendar size={12} /> Add Dates
                          </button>
                        </div>
                        {availabilities.length > 0 ? (
                          <div className="space-y-2 max-h-[150px] overflow-y-auto">
                            {availabilities.map((a, i) => (
                              <div key={i} className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#e6d7c3]">
                                <div>
                                  <div className="text-xs font-medium text-[#4a352f]">
                                    {a.date?.toLocaleDateString?.('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) || 'N/A'}
                                  </div>
                                  {a.timeSlots?.[0] && (
                                    <div className="text-xs text-[#7d5a50]">{a.timeSlots[0].start} - {a.timeSlots[0].end}</div>
                                  )}
                                </div>
                                <button onClick={() => removeAvailability(a.date)} className="text-red-500 hover:text-red-700 p-1"><X size={14} /></button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#7d5a50] italic">No availability added yet</p>
                        )}
                      </div>
                    )}

                    {stageFields.showTermSheet && (
                      <div>
                        <label className="block text-xs font-semibold text-[#4a352f] mb-1">Support Agreement (PDF/DOC)</label>
                        <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setStageUpdateData(prev => ({ ...prev, termSheetFile: e.target.files[0] }))}
                          className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-xs" />
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={closePopup} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-all">Cancel</button>
                  <button onClick={handleStageUpdate} disabled={isStageSubmitting} className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-xs font-medium hover:bg-[#4a352f] transition-all disabled:opacity-50">
                    {isStageSubmitting ? "Updating..." : "Update Stage"}
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Popup */}
            {showCalendarPopup && (
              <>
                <div className="fixed inset-0 z-[1100]" onClick={() => setShowCalendarPopup(false)} />
                <div className="fixed z-[1101] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-6 animate-fadeIn"
                  style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-[#4a352f]">Select Available Dates</h4>
                    <button onClick={() => setShowCalendarPopup(false)} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={18} /></button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-[#4a352f] mb-2">Time Slot</label>
                    <div className="flex gap-2">
                      <input type="time" value={timeSlot.start} onChange={(e) => handleTimeChange('start', e.target.value)} className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs" />
                      <span className="text-[#7d5a50]">to</span>
                      <input type="time" value={timeSlot.end} onChange={(e) => handleTimeChange('end', e.target.value)} className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <DayPicker mode="multiple" selected={tempDates} onSelect={handleDateSelect} fromDate={new Date()} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowCalendarPopup(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs">Cancel</button>
                    <button onClick={saveSelectedDates} disabled={tempDates.length === 0} className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-xs disabled:opacity-50">Save Dates</button>
                  </div>
                </div>
              </>
            )}
          </PopupPortal>
        );
      })()}

      {/* ─── Quick Actions Popup ──────────────────────────────────────────────── */}
      {activePopup?.type === 'quickActions' && selectedSMEForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div className="fixed z-[1001] bg-white rounded-xl shadow-2xl border border-[#e6d7c3] py-1 overflow-hidden animate-fadeIn"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: '200px' }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#e6d7c3]">
              <span className="text-xs font-semibold text-[#4a352f]">Quick Actions</span>
              <button onClick={closePopup} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={14} /></button>
            </div>
            <button onClick={() => { handleViewDetails(selectedSMEForPopup); closePopup(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Eye size={12} /> View Profile</button>
            <button onClick={() => openPopup('bigScore', selectedSMEForPopup, activePopup.rect)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><BarChart3 size={12} /> BIG Score</button>
            <button onClick={() => openPopup('match', selectedSMEForPopup, activePopup.rect)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Star size={12} /> Match Breakdown</button>
            <button onClick={() => { setNotification({ type: "success", message: "Messaging coming soon" }); closePopup(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><MessageSquare size={12} /> Send Message</button>
            {selectedSMEForPopup.currentStatus?.toLowerCase().includes("evaluation") && !sentNDAs[`${selectedSMEForPopup.id}_${selectedSMEForPopup.programIndex}`] && (
              <button onClick={() => handleShareNDA(selectedSMEForPopup)} disabled={isNDASharing[`${selectedSMEForPopup.id}_${selectedSMEForPopup.programIndex}`]} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left disabled:opacity-50">
                <Share2 size={12} /> Share NDA
              </button>
            )}
          </div>
        </PopupPortal>
      )}

      {/* ─── Business Details Modal ────────────────────────────────────────────────── */}
      {showSMEDetails && selectedSMEDetails && (
        <SMEDetailsModal sme={selectedSMEDetails} isOpen={showSMEDetails} onClose={() => { setShowSMEDetails(false); setSelectedSMEDetails(null); }} />
      )}
    </div>
  );
}

// Default export added alongside the named export above so this component
// resolves correctly whether the importing file does
// `import SupportSMETable from "./SupportSMETable"` (default) or
// `import { SupportSMETable } from "./SupportSMETable"` (named).
export default SupportSMETable;