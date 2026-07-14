"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Info, MapPin, Calendar, Filter, X, Eye, BarChart3, Star, 
  ChevronDown, ChevronUp, MoreVertical, CheckCircle, XCircle,
  AlertCircle, Clock, TrendingUp, Users, DollarSign, Building,
  LayoutGrid, Columns, Search, Download, MessageSquare, FileText,
  Share2, ArrowRight, ArrowUp, ArrowDown, SlidersHorizontal,
  RotateCcw, Settings, Shield, FileCheck, Target, Briefcase
} from "lucide-react";
import { db, auth, storage } from "../../firebaseConfig";
import { serverTimestamp, doc, updateDoc, getDoc, addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { usePortfolio } from "../../context/PortfolioContext";
import SMEDetailsModal from "./SMEDetailsModal";
import { getFunctions } from "firebase/functions";

// ─── Constants & Helpers ──────────────────────────────────────────────────────
const BIG_SCORE_LABELS = {
  excellent: { min: 80, label: "Excellent", color: "#22c55e", icon: "🟢" },
  strong: { min: 60, label: "Strong", color: "#86efac", icon: "🟡" },
  moderate: { min: 40, label: "Moderate", color: "#f59e0b", icon: "🟠" },
  weak: { min: 20, label: "Weak", color: "#ef4444", icon: "🔴" },
  critical: { min: 0, label: "Critical", color: "#dc2626", icon: "⭕" }
};

const MATCH_LABELS = {
  excellent: { min: 80, label: "Excellent Fit", stars: 5, color: "#22c55e" },
  strong: { min: 60, label: "Strong Fit", stars: 4, color: "#86efac" },
  moderate: { min: 40, label: "Moderate Fit", stars: 3, color: "#f59e0b" },
  weak: { min: 20, label: "Weak Fit", stars: 2, color: "#ef4444" },
  poor: { min: 0, label: "Poor Fit", stars: 1, color: "#dc2626" }
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
  "On Hold": { bg: "#f5f0e1", text: "#7d5a50", border: "#c8b6a6", dot: "#7d5a50" },
  "Rejected": { bg: "#f0e6d9", text: "#a67c52", border: "#c8b6a6", dot: "#a67c52" },
  "Withdrawn": { bg: "#f0e6d9", text: "#a67c52", border: "#c8b6a6", dot: "#a67c52" }
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

// ─── Component ────────────────────────────────────────────────────────────────
export function SupportSMETable({ filters, stageFilter, onSMEsLoaded, onStageOverride }) {
  const [smes, setSmes] = useState([]);
  const [selectedSME, setSelectedSME] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [columnVisibility, setColumnVisibility] = useState({
    sme: true,
    bigScore: true,
    match: true,
    fundingStage: true,
    fundingRequired: true,
    status: true,
    applied: true,
    action: true,
    location: false,
    sector: false,
    equity: false,
    guarantees: false,
    support: false,
    services: false,
    notes: false,
    assignedUser: false,
    daysInStage: false,
    lastActivity: false
  });
  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'bigScore', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [density, setDensity] = useState('comfortable');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    fundingStage: [],
    bigScoreRange: [0, 100],
    status: [],
    sector: [],
    dateRange: null
  });
  const [showStageModal, setShowStageModal] = useState(false);
  const [selectedSMEForStage, setSelectedSMEForStage] = useState(null);
  const [nextStage, setNextStage] = useState("");
  const [message, setMessage] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingPurpose, setMeetingPurpose] = useState("");
  const [termSheetFile, setTermSheetFile] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilities, setAvailabilities] = useState([]);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [tempDates, setTempDates] = useState([]);
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" });
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [notification, setNotification] = useState(null);
  const [showSMEDetails, setShowSMEDetails] = useState(false);
  const [selectedSMEDetails, setSelectedSMEDetails] = useState(null);
  const [bigScoreData, setBigScoreData] = useState({
    compliance: { score: 0 },
    legitimacy: { score: 0 },
    fundability: { score: 0 },
    pis: { score: 0 },
    leadership: { score: 0 }
  });
  const [modalType, setModalType] = useState(null);
  const [sentNDAs, setSentNDAs] = useState({});
  const [isNDASharing, setIsNDASharing] = useState({});
  const [updatedStages, setUpdatedStages] = useState({});
  const [supportAgreementStatuses, setSupportAgreementStatuses] = useState({});
  const [showMatchBreakdown, setShowMatchBreakdown] = useState(false);
  const [selectedAcceleratorForBreakdown, setSelectedAcceleratorForBreakdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [savedViews, setSavedViews] = useState([]);
  const [showSaveView, setShowSaveView] = useState(false);
  const [viewName, setViewName] = useState("");

  const { enriched, catalystFormData, loading } = usePortfolio();

  // ─── Data Processing ────────────────────────────────────────────────────────
  useEffect(() => {
    const mapRow = (a) => {
      const entity = a.profile?.entityOverview || {};
      const funding = a.profile?.useOfFunds || {};
      const financials = a.profile?.financialOverview || {};
      const multiProgram = enriched.filter((e) => e.smeId === a.smeId).length > 1;
      
      const mapped = {
        id: a.smeId,
        docId: a.docId,
        programIndex: a.programIndex,
        name: (entity.registeredName || a.smeName || "N/A") + 
          (multiProgram ? ` (P${parseInt(a.programIndex || 0) + 1})` : ""),
        location: entity.location || a.location || "N/A",
        province: entity.province || a.province || "N/A",
        sector: (entity.economicSectors || []).join(", ") || a.sector || "N/A",
        industry: entity.industry || "N/A",
        fundingStage: entity.operationStage || a.fundingStage || "N/A",
        fundingRequired: formatCurrency(funding.amountRequested || a.fundingRequired || "N/A"),
        fundingAmount: parseFloat((funding.amountRequested || a.fundingRequired || "0").toString().replace(/[^0-9.]/g, "")) || 0,
        equityOffered: funding.equityType || a.equityOffered || "N/A",
        guarantees: a.guarantees || "N/A",
        supportRequired: a.supportRequired || "N/A",
        servicesRequired: a.servicesRequired || "N/A",
        revenue: financials.annualRevenue || "N/A",
        employees: entity.employees || "N/A",
        companyAge: entity.companyAge || "N/A",
        applicationDate: a.applicationDate 
          ? new Date(a.applicationDate).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })
          : "N/A",
        applicationDateRaw: a.applicationDate ? new Date(a.applicationDate) : null,
        matchPercentage: a.matchPercentage || 0,
        bigScore: a.bigScore || 0,
        compliance: a.compliance || 0,
        legitimacy: a.legitimacy || 0,
        fundability: a.fundability || 0,
        pis: a.pis || 0,
        leadership: a.leadership || 0,
        currentStatus: a.pipelineStage || a.status || "Matching",
        pipelineStage: a.pipelineStage || a.status || "Matching",
        nextStage: a.nextStage || getNextStage(a.pipelineStage || a.status),
        acceleratorName: a.acceleratorName || "N/A",
        programName: a.programName || `Program ${parseInt(a.programIndex || 0) + 1}`,
        availableDates: a.availableDates || [],
        lastActivity: a.lastActivity || "N/A",
        daysInStage: a.daysInStage || 0,
        assignedUser: a.assignedUser || "Unassigned",
        notes: a.notes || "",
        documents: a.documents || [],
        matchBreakdown: a.matchBreakdown || null,
        userId: a.userId || a.smeId,
        email: a.email || entity.email || "N/A",
        director: entity.director || "N/A"
      };

      return mapped;
    };

    let mapped = enriched.map(mapRow);

    // Apply stage filter from pipeline
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
        mapped = mapped.filter(s => 
          validStages.some(vs => (s.pipelineStage || "").toLowerCase().includes(vs))
        );
      }
    }

    // Sort by BIG Score descending by default
    mapped.sort((a, b) => b.bigScore - a.bigScore);
    
    setSmes(mapped);
    onSMEsLoaded?.(mapped);
  }, [enriched, stageFilter, catalystFormData]);

  // ─── Filtering & Sorting ────────────────────────────────────────────────────
  const filteredAndSortedSMEs = useMemo(() => {
    let result = [...smes];

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(sme => 
        sme.name.toLowerCase().includes(query) ||
        sme.sector.toLowerCase().includes(query) ||
        sme.location.toLowerCase().includes(query) ||
        sme.industry.toLowerCase().includes(query) ||
        sme.director.toLowerCase().includes(query) ||
        sme.email.toLowerCase().includes(query)
      );
    }

    // Funding Stage Filter
    if (localFilters.fundingStage && localFilters.fundingStage.length > 0) {
      result = result.filter(sme => 
        localFilters.fundingStage.some(stage => 
          sme.fundingStage.toLowerCase().includes(stage.toLowerCase())
        )
      );
    }

    // BIG Score Range Filter
    result = result.filter(sme => 
      sme.bigScore >= localFilters.bigScoreRange[0] && 
      sme.bigScore <= localFilters.bigScoreRange[1]
    );

    // Status Filter
    if (localFilters.status && localFilters.status.length > 0) {
      result = result.filter(sme => 
        localFilters.status.some(status => 
          sme.currentStatus.toLowerCase().includes(status.toLowerCase())
        )
      );
    }

    // Sector Filter
    if (localFilters.sector && localFilters.sector.length > 0) {
      result = result.filter(sme => 
        localFilters.sector.some(sector => 
          sme.sector.toLowerCase().includes(sector.toLowerCase())
        )
      );
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal == null) aVal = '';
        if (bVal == null) bVal = '';
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [smes, searchQuery, sortConfig, localFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedSMEs.length / pageSize);
  const paginatedSMEs = filteredAndSortedSMEs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const toggleRowExpansion = (smeKey) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(smeKey)) {
        newSet.delete(smeKey);
      } else {
        newSet.add(smeKey);
      }
      return newSet;
    });
  };

  const toggleColumn = (key) => {
    setColumnVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleViewDetails = (sme) => {
    setSelectedSMEDetails(sme);
    setShowSMEDetails(true);
  };

  const handleStageAction = (sme) => {
    setSelectedSMEForStage(sme);
    setNextStage(sme.nextStage || getNextStage(sme.currentStatus));
    setMessage("");
    setMeetingTime("");
    setMeetingLocation("");
    setMeetingPurpose("");
    setTermSheetFile(null);
    setFormErrors({});
    setAvailabilities(sme.availableDates || []);
    setShowStageModal(true);
  };

  const handleBigScoreClick = (sme) => {
    setBigScoreData({
      compliance: { score: sme.compliance || 0 },
      legitimacy: { score: sme.legitimacy || 0 },
      fundability: { score: sme.fundability || 0 },
      pis: { score: sme.pis || 0 },
      leadership: { score: sme.leadership || 0 }
    });
    setSelectedSME(sme);
    setModalType("bigScore");
  };

  const handleViewMatchBreakdown = (sme) => {
    if (sme.matchBreakdown) {
      setSelectedAcceleratorForBreakdown(sme);
      setShowMatchBreakdown(true);
    } else {
      try {
        const contextEntry = enriched.find((a) => a.smeId === sme.id && a.programIndex === sme.programIndex);
        const smeProfileData = contextEntry?.profile || {};
        const programs = catalystFormData?.programmeDetails?.programs || [];
        const program = programs[parseInt(sme.programIndex || 0)] || programs[0] || null;
        if (program) {
          const matchResult = calculateMatchScore(smeProfileData, catalystFormData, program);
          setSelectedAcceleratorForBreakdown({ ...sme, matchPercentage: matchResult.score, matchBreakdown: matchResult.breakdown });
          setShowMatchBreakdown(true);
        }
      } catch (err) {
        console.error("Error computing match breakdown:", err);
        setNotification({ type: "error", message: "Failed to load match breakdown." });
      }
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
      
      if (!ndaDoc.exists()) {
        setNotification({ type: "error", message: "No NDA found. Please upload an NDA first." });
        return;
      }

      const ndaData = ndaDoc.data();
      if (!ndaData.pdfUrl) {
        setNotification({ type: "error", message: "NDA document has no PDF URL." });
        return;
      }

      const shareData = {
        catalystId: user.uid,
        catalystName: user.displayName || "Catalyst",
        catalystEmail: user.email,
        ndaId: ndaDoc.id,
        ndaUrl: ndaData.pdfUrl,
        ndaName: ndaData.ndaContent || ndaData.name || "NDA Document",
        smeId: sme.id,
        smeName: sme.name,
        sharedAt: serverTimestamp(),
        status: "sent",
        programIndex: sme.programIndex,
        applicationId: `${user.uid}_${sme.id}_${sme.programIndex}`
      };

      const existingShareQuery = query(
        collection(db, "shared_nda"),
        where("catalystId", "==", user.uid),
        where("smeId", "==", sme.id),
        where("programIndex", "==", sme.programIndex)
      );
      
      const existingShare = await getDocs(existingShareQuery);
      
      if (existingShare.empty) {
        await addDoc(collection(db, "shared_nda"), shareData);
      } else {
        const shareDoc = existingShare.docs[0];
        await updateDoc(doc(db, "shared_nda", shareDoc.id), {
          ...shareData,
          updatedAt: serverTimestamp()
        });
      }

      await addDoc(collection(db, "messages"), {
        to: sme.id,
        from: user.uid,
        subject: "NDA Ready for Review",
        content: "A Non-Disclosure Agreement (NDA) has been shared with you. Please review and sign it.",
        date: new Date().toISOString(),
        read: false,
        type: "nda_share",
        ndaId: ndaDoc.id,
        ndaUrl: ndaData.pdfUrl,
        applicationId: `${user.uid}_${sme.id}_${sme.programIndex}`
      });

      setSentNDAs(prev => ({ ...prev, [smeKey]: true }));
      setNotification({ type: "success", message: `NDA shared successfully with ${sme.name}` });

    } catch (error) {
      console.error("Error sharing NDA:", error);
      setNotification({ type: "error", message: `Failed to share NDA: ${error.message}` });
    } finally {
      setIsNDASharing(prev => ({ ...prev, [smeKey]: false }));
    }
  };

  const handleStageUpdate = async () => {
    const errors = {};
    if (!nextStage) errors.nextStage = "Please select a stage";
    if (!message.trim()) errors.message = "Please provide a message";
    
    if (Object.keys(errors).length > 0) { 
      setFormErrors(errors); 
      return; 
    }
    
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      const catalystId = user.uid;
      const smeId = selectedSMEForStage.id;
      const programIndex = selectedSMEForStage.programIndex || "0";
      const documentId = `${catalystId}_${smeId}_${programIndex}`;
      
      const updateData = {
        status: nextStage,
        pipelineStage: nextStage,
        nextStage: getNextStage(nextStage),
        updatedAt: serverTimestamp(),
        lastMessage: message,
        lastActivity: new Date().toISOString()
      };

      const docRef = doc(db, "catalystApplications", documentId);
      await updateDoc(docRef, updateData);

      const stageKey = `${smeId}_${programIndex}`;
      setUpdatedStages(prev => ({ ...prev, [stageKey]: nextStage }));
      
      setSmes(prev => prev.map(s => 
        s.id === smeId && s.programIndex === programIndex
          ? { ...s, currentStatus: nextStage, pipelineStage: nextStage, nextStage: getNextStage(nextStage) }
          : s
      ));

      setNotification({ type: "success", message: `Application updated to ${nextStage} successfully` });
      setShowStageModal(false);

    } catch (error) {
      console.error("Stage update error:", error);
      setNotification({ type: "error", message: `Failed to update status: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveCurrentView = () => {
    if (!viewName.trim()) return;
    const view = {
      name: viewName,
      columns: { ...columnVisibility },
      sort: { ...sortConfig },
      density,
      filters: { ...localFilters }
    };
    setSavedViews(prev => [...prev, view]);
    setViewName("");
    setShowSaveView(false);
    setNotification({ type: "success", message: `View "${viewName}" saved!` });
  };

  const loadView = (view) => {
    setColumnVisibility(view.columns);
    setSortConfig(view.sort);
    setDensity(view.density);
    setLocalFilters(view.filters);
    setNotification({ type: "success", message: `View "${view.name}" loaded!` });
  };

  const clearAllFilters = () => {
    setLocalFilters({
      fundingStage: [],
      bigScoreRange: [0, 100],
      status: [],
      sector: [],
      dateRange: null
    });
    setSearchQuery('');
    setNotification({ type: "success", message: "All filters cleared" });
  };

  const handleExport = () => {
    try {
      const visibleCols = Object.entries(columnVisibility)
        .filter(([_, visible]) => visible)
        .map(([key]) => key);
      
      const headers = {
        sme: 'SME Name',
        bigScore: 'BIG Score',
        match: 'Match %',
        fundingStage: 'Funding Stage',
        fundingRequired: 'Funding Required',
        status: 'Status',
        applied: 'Applied Date',
        location: 'Location',
        sector: 'Sector',
        equity: 'Equity Offered',
        guarantees: 'Guarantees',
        support: 'Support Required',
        services: 'Services Required',
        assignedUser: 'Assigned User',
        daysInStage: 'Days in Stage',
        lastActivity: 'Last Activity'
      };
      
      const headerRow = visibleCols.map(col => headers[col] || col).join(',');
      const dataRows = filteredAndSortedSMEs.map(sme => 
        visibleCols.map(col => {
          const value = sme[col] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      );
      
      const csv = [headerRow, ...dataRows].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sme-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      setNotification({ type: "success", message: "Export downloaded successfully" });
    } catch (error) {
      console.error("Export error:", error);
      setNotification({ type: "error", message: "Failed to export data" });
    }
  };

  // ─── Match Score Calculator ─────────────────────────────────────────────────
  const calculateMatchScore = (smeProfileData, catalystFormData, program = null) => {
    const totalFields = 8;
    let matched = 0;
    const breakdown = {
      fundingStage: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      ticketSize: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      geographicFit: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      sectorMatch: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      instrumentFit: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      supportMatch: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      legalEntityFit: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      revenueThreshold: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} }
    };

    const programData = program || catalystFormData?.programmeDetails?.programs?.[0] || {};
    const matchPrefs = catalystFormData?.programBriefMatchingPreference || catalystFormData?.generalMatchingPreference || {};
    const entity = smeProfileData.entityOverview || {};
    const funding = smeProfileData.useOfFunds || {};

    // 1. Funding Stage Match
    const smeStage = (entity.operationStage || "").toLowerCase();
    const accelStages = Array.isArray(matchPrefs.businessLifecycleStage) 
      ? matchPrefs.businessLifecycleStage.map(s => s.toLowerCase())
      : matchPrefs.businessLifecycleStage ? [matchPrefs.businessLifecycleStage.toLowerCase()] : [];
    
    if (smeStage && accelStages.some(s => smeStage.includes(s) || s.includes(smeStage))) {
      breakdown.fundingStage.score = 12.5;
      breakdown.fundingStage.matched = true;
      matched++;
    }

    // 2. Ticket Size Match
    const smeAmount = parseFloat((funding.amountRequested || "0").toString().replace(/[^0-9.]/g, "")) || 0;
    const minTicket = parseFloat((programData.minimumSupport || "0").toString().replace(/[^0-9.]/g, "")) || 0;
    const maxTicket = parseFloat((programData.maximumSupport || "0").toString().replace(/[^0-9.]/g, "")) || Infinity;
    
    if (smeAmount >= minTicket && smeAmount <= maxTicket) {
      breakdown.ticketSize.score = 12.5;
      breakdown.ticketSize.matched = true;
      matched++;
    }

    const totalScore = Object.values(breakdown).reduce((sum, b) => sum + (b.score || 0), 0);
    return { score: Math.round(totalScore), breakdown };
  };

  // ─── Contextual Actions ─────────────────────────────────────────────────────
  const getContextualAction = (sme) => {
    const status = (sme.currentStatus || "").toLowerCase();
    
    if (status.includes("matching")) {
      return { label: "Review Match", icon: <Eye size={14} />, color: "#7d5a50" };
    }
    if (status.includes("application")) {
      return { label: "Review App", icon: <FileText size={14} />, color: "#7d5a50" };
    }
    if (status.includes("evaluation")) {
      return { label: "Evaluate", icon: <Search size={14} />, color: "#7d5a50" };
    }
    if (status.includes("due diligence")) {
      return { label: "Start DD", icon: <Shield size={14} />, color: "#7d5a50" };
    }
    if (status.includes("decision")) {
      return { label: "Decide", icon: <AlertCircle size={14} />, color: "#7d5a50" };
    }
    if (status.includes("term sheet")) {
      return { label: "Send Terms", icon: <FileCheck size={14} />, color: "#7d5a50" };
    }
    if (status.includes("active")) {
      return { label: "Monitor", icon: <TrendingUp size={14} />, color: "#7d5a50" };
    }
    
    return { label: "Review", icon: <Eye size={14} />, color: "#7d5a50" };
  };

  // ─── Density Styles ─────────────────────────────────────────────────────────
  const densityStyles = {
    'comfortable': { 
      cell: 'py-3 px-3', 
      header: 'py-3 px-3', 
      fontSize: 'text-sm',
      iconSize: 16,
      avatarSize: 'w-8 h-8'
    },
    'compact': { 
      cell: 'py-2 px-2', 
      header: 'py-2 px-2', 
      fontSize: 'text-xs',
      iconSize: 14,
      avatarSize: 'w-7 h-7'
    },
    'ultra-compact': { 
      cell: 'py-1.5 px-1.5', 
      header: 'py-1.5 px-1.5', 
      fontSize: 'text-xs',
      iconSize: 12,
      avatarSize: 'w-6 h-6'
    }
  };

  const ds = densityStyles[density];

  // ─── Load saved NDAs ────────────────────────────────────────────────────────
  useEffect(() => {
    const loadSentNDAs = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const sharedNDAQuery = query(
          collection(db, "shared_nda"),
          where("catalystId", "==", user.uid),
          where("status", "==", "sent")
        );
        
        const snapshot = await getDocs(sharedNDAQuery);
        const sentMap = {};
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const smeKey = `${data.smeId}_${data.programIndex}`;
          sentMap[smeKey] = true;
        });
        
        setSentNDAs(sentMap);
      } catch (error) {
        console.error("Error loading sent NDAs:", error);
      }
    };

    if (auth.currentUser) {
      loadSentNDAs();
    }
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-4 p-6">
      {/* Notification */}
      {notification && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border animate-fadeIn ${
          notification.type === "success"
            ? "bg-green-50 text-green-800 border-green-200"
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 text-current opacity-50 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-[#faf7f2] rounded-t-2xl p-4 border border-[#e6d7c3] border-b-0 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d5a50]" />
            <input
              type="text"
              placeholder="Search by name, sector, location..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm focus:outline-none focus:border-[#7d5a50] focus:ring-2 focus:ring-[#7d5a50]/20 transition-all placeholder:text-[#7d5a50]/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d5a50] hover:text-[#4a352f]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Column Chooser */}
            <div className="relative">
              <button
                onClick={() => setShowColumnChooser(!showColumnChooser)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm"
              >
                <Columns size={16} />
                Columns
                <ChevronDown size={14} className={`transition-transform ${showColumnChooser ? 'rotate-180' : ''}`} />
              </button>
              
              {showColumnChooser && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowColumnChooser(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-5 z-50 animate-fadeIn max-h-[500px] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-[#4a352f]">Column Visibility</h4>
                      <button 
                        onClick={() => setShowColumnChooser(false)}
                        className="text-[#7d5a50] hover:text-[#4a352f]"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-[#7d5a50] uppercase tracking-wider mb-2 px-2">Required Columns</div>
                      {[
                        { key: 'sme', label: 'SME Name' },
                        { key: 'bigScore', label: 'BIG Score' },
                        { key: 'match', label: 'Match %' },
                        { key: 'status', label: 'Status' },
                        { key: 'action', label: 'Action' }
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 py-2 px-2 rounded-lg opacity-75">
                          <input type="checkbox" checked={true} disabled={true} className="rounded border-[#c8b6a6]" />
                          <span className="text-sm text-[#4a352f]">{label}</span>
                          <span className="text-xs text-[#7d5a50] ml-auto">Required</span>
                        </label>
                      ))}
                      
                      <div className="text-xs font-semibold text-[#7d5a50] uppercase tracking-wider mb-2 mt-4 px-2">Optional Columns</div>
                      {[
                        { key: 'fundingStage', label: 'Funding Stage' },
                        { key: 'fundingRequired', label: 'Funding Required' },
                        { key: 'applied', label: 'Applied Date' },
                        { key: 'location', label: 'Location' },
                        { key: 'sector', label: 'Sector' },
                        { key: 'equity', label: 'Equity Offered' },
                        { key: 'guarantees', label: 'Guarantees' },
                        { key: 'support', label: 'Support Required' },
                        { key: 'services', label: 'Services Required' },
                        { key: 'assignedUser', label: 'Assigned User' },
                        { key: 'daysInStage', label: 'Days in Stage' },
                        { key: 'lastActivity', label: 'Last Activity' }
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#faf7f2] transition-all cursor-pointer">
                          <input
                            type="checkbox"
                            checked={columnVisibility[key] || false}
                            onChange={() => toggleColumn(key)}
                            className="rounded border-[#c8b6a6] text-[#7d5a50] focus:ring-[#7d5a50]"
                          />
                          <span className="text-sm text-[#4a352f]">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Density Selector */}
            <select
              value={density}
              onChange={(e) => setDensity(e.target.value)}
              className="px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] focus:outline-none focus:border-[#7d5a50] cursor-pointer shadow-sm"
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
              <option value="ultra-compact">Ultra Compact</option>
            </select>

            {/* Save View */}
            <div className="relative">
              <button
                onClick={() => setShowSaveView(!showSaveView)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm"
              >
                <Settings size={16} />
                Views
              </button>
              
              {showSaveView && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSaveView(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-5 z-50 animate-fadeIn">
                    <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Saved Views</h4>
                    
                    {savedViews.length > 0 && (
                      <div className="space-y-1 mb-4">
                        {savedViews.map((view, idx) => (
                          <button
                            key={idx}
                            onClick={() => loadView(view)}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#4a352f] hover:bg-[#faf7f2] transition-all"
                          >
                            {view.name}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={viewName}
                        onChange={(e) => setViewName(e.target.value)}
                        placeholder="View name..."
                        className="flex-1 px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:border-[#7d5a50]"
                      />
                      <button
                        onClick={saveCurrentView}
                        disabled={!viewName.trim()}
                        className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-sm font-medium hover:bg-[#4a352f] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm
                ${showFilters 
                  ? 'bg-[#7d5a50] text-white border-[#7d5a50]' 
                  : 'bg-white border border-[#c8b6a6] text-[#4a352f] hover:bg-[#f5f0e1]'}
              `}
            >
              <SlidersHorizontal size={16} />
              Filters
              {(localFilters.fundingStage.length > 0 || localFilters.status.length > 0 || localFilters.sector.length > 0) && (
                <span className="w-5 h-5 rounded-full bg-[#a67c52] text-white text-xs flex items-center justify-center">
                  {localFilters.fundingStage.length + localFilters.status.length + localFilters.sector.length}
                </span>
              )}
            </button>

            {/* Export */}
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#7d5a50] to-[#4a352f] text-white border-none rounded-xl text-sm font-medium hover:shadow-lg transition-all shadow-sm"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-5 bg-[#faf7f2] rounded-2xl border-2 border-[#e6d7c3] animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-[#4a352f]">Filter Applications</h4>
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 text-xs text-[#7d5a50] hover:text-[#4a352f] transition-all"
              >
                <RotateCcw size={12} />
                Reset All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* BIG Score Range */}
              <div className="bg-white rounded-xl p-4 border border-[#e6d7c3]">
                <label className="block text-xs font-semibold text-[#4a352f] mb-3">
                  BIG Score Range: {localFilters.bigScoreRange[0]} - {localFilters.bigScoreRange[1]}
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localFilters.bigScoreRange[0]}
                    onChange={(e) => setLocalFilters(prev => ({ 
                      ...prev, 
                      bigScoreRange: [Math.min(parseInt(e.target.value) || 0, prev.bigScoreRange[1]), prev.bigScoreRange[1]] 
                    }))}
                    className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center focus:outline-none focus:border-[#7d5a50]"
                  />
                  <span className="text-[#7d5a50] text-sm">to</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localFilters.bigScoreRange[1]}
                    onChange={(e) => setLocalFilters(prev => ({ 
                      ...prev, 
                      bigScoreRange: [prev.bigScoreRange[0], Math.max(parseInt(e.target.value) || 0, prev.bigScoreRange[0])] 
                    }))}
                    className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center focus:outline-none focus:border-[#7d5a50]"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localFilters.bigScoreRange[0]}
                  onChange={(e) => setLocalFilters(prev => ({ 
                    ...prev, 
                    bigScoreRange: [parseInt(e.target.value), prev.bigScoreRange[1]] 
                  }))}
                  className="w-full accent-[#7d5a50]"
                />
              </div>

              {/* Status Filter */}
              <div className="bg-white rounded-xl p-4 border border-[#e6d7c3]">
                <label className="block text-xs font-semibold text-[#4a352f] mb-3">
                  Pipeline Status
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["Matching", "Application", "Evaluation", "Due Diligence", "Decision", "Term Sheet", "Active"].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        setLocalFilters(prev => ({
                          ...prev,
                          status: prev.status.includes(status) 
                            ? prev.status.filter(s => s !== status)
                            : [...prev.status, status]
                        }));
                      }}
                      className={`
                        px-2.5 py-1 rounded-full text-xs font-medium transition-all
                        ${localFilters.status.includes(status)
                          ? 'bg-[#7d5a50] text-white'
                          : 'bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]'}
                      `}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Funding Stage Filter */}
              <div className="bg-white rounded-xl p-4 border border-[#e6d7c3]">
                <label className="block text-xs font-semibold text-[#4a352f] mb-3">
                  Funding Stage
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["Startup", "Growth", "Scale", "Established"].map(stage => (
                    <button
                      key={stage}
                      onClick={() => {
                        setLocalFilters(prev => ({
                          ...prev,
                          fundingStage: prev.fundingStage.includes(stage) 
                            ? prev.fundingStage.filter(s => s !== stage)
                            : [...prev.fundingStage, stage]
                        }));
                      }}
                      className={`
                        px-2.5 py-1 rounded-full text-xs font-medium transition-all
                        ${localFilters.fundingStage.includes(stage)
                          ? 'bg-[#7d5a50] text-white'
                          : 'bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]'}
                      `}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8">
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 bg-shimmer-light bg-shimmer rounded-lg animate-shimmer" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <colgroup>
                  {columnVisibility.sme && <col style={{ width: '140px' }} />}
                  {columnVisibility.bigScore && <col style={{ width: '100px' }} />}
                  {columnVisibility.match && <col style={{ width: '100px' }} />}
                  {columnVisibility.fundingStage && <col style={{ width: '100px' }} />}
                  {columnVisibility.fundingRequired && <col style={{ width: '110px' }} />}
                  {columnVisibility.status && <col style={{ width: '130px' }} />}
                  {columnVisibility.applied && <col style={{ width: '100px' }} />}
                  {columnVisibility.action && <col style={{ width: '110px' }} />}
                </colgroup>

                <thead>
                  <tr className="bg-gradient-to-r from-[#4a352f] via-[#7d5a50] to-[#4a352f]">
                    {columnVisibility.sme && (
                      <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520] sticky left-0 bg-gradient-to-r from-[#4a352f] via-[#7d5a50] to-[#4a352f] z-20`}>
                        <button 
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-1 hover:text-[#f5f0e1] transition-colors group"
                        >
                          SME Name
                          <span className="flex flex-col -space-y-1 opacity-50 group-hover:opacity-100">
                            <ArrowUp size={10} className={sortConfig.key === 'name' && sortConfig.direction === 'asc' ? 'text-[#f5f0e1] opacity-100' : ''} />
                            <ArrowDown size={10} className={sortConfig.key === 'name' && sortConfig.direction === 'desc' ? 'text-[#f5f0e1] opacity-100' : ''} />
                          </span>
                        </button>
                      </th>
                    )}
                    {columnVisibility.bigScore && (
                      <th className={`${ds.header} text-center text-white font-semibold border-r border-[#3a2520]`}>
                        <button 
                          onClick={() => handleSort('bigScore')}
                          className="flex items-center gap-1 mx-auto hover:text-[#f5f0e1] transition-colors group"
                        >
                          BIG Score
                          <span className="flex flex-col -space-y-1 opacity-50 group-hover:opacity-100">
                            <ArrowUp size={10} className={sortConfig.key === 'bigScore' && sortConfig.direction === 'asc' ? 'text-[#f5f0e1] opacity-100' : ''} />
                            <ArrowDown size={10} className={sortConfig.key === 'bigScore' && sortConfig.direction === 'desc' ? 'text-[#f5f0e1] opacity-100' : ''} />
                          </span>
                        </button>
                      </th>
                    )}
                    {columnVisibility.match && (
                      <th className={`${ds.header} text-center text-white font-semibold border-r border-[#3a2520]`}>
                        <button 
                          onClick={() => handleSort('matchPercentage')}
                          className="flex items-center gap-1 mx-auto hover:text-[#f5f0e1] transition-colors group"
                        >
                          Match %
                          <span className="flex flex-col -space-y-1 opacity-50 group-hover:opacity-100">
                            <ArrowUp size={10} className={sortConfig.key === 'matchPercentage' && sortConfig.direction === 'asc' ? 'text-[#f5f0e1] opacity-100' : ''} />
                            <ArrowDown size={10} className={sortConfig.key === 'matchPercentage' && sortConfig.direction === 'desc' ? 'text-[#f5f0e1] opacity-100' : ''} />
                          </span>
                        </button>
                      </th>
                    )}
                    {columnVisibility.fundingStage && (
                      <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520]`}>
                        Funding Stage
                      </th>
                    )}
                    {columnVisibility.fundingRequired && (
                      <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520]`}>
                        <button 
                          onClick={() => handleSort('fundingAmount')}
                          className="flex items-center gap-1 hover:text-[#f5f0e1] transition-colors group"
                        >
                          Funding
                          <span className="flex flex-col -space-y-1 opacity-50 group-hover:opacity-100">
                            <ArrowUp size={10} className={sortConfig.key === 'fundingAmount' && sortConfig.direction === 'asc' ? 'text-[#f5f0e1] opacity-100' : ''} />
                            <ArrowDown size={10} className={sortConfig.key === 'fundingAmount' && sortConfig.direction === 'desc' ? 'text-[#f5f0e1] opacity-100' : ''} />
                          </span>
                        </button>
                      </th>
                    )}
                    {columnVisibility.status && (
                      <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520]`}>
                        Status
                      </th>
                    )}
                    {columnVisibility.applied && (
                      <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520]`}>
                        <button 
                          onClick={() => handleSort('applicationDateRaw')}
                          className="flex items-center gap-1 hover:text-[#f5f0e1] transition-colors group"
                        >
                          Applied
                          <span className="flex flex-col -space-y-1 opacity-50 group-hover:opacity-100">
                            <ArrowUp size={10} className={sortConfig.key === 'applicationDateRaw' && sortConfig.direction === 'asc' ? 'text-[#f5f0e1] opacity-100' : ''} />
                            <ArrowDown size={10} className={sortConfig.key === 'applicationDateRaw' && sortConfig.direction === 'desc' ? 'text-[#f5f0e1] opacity-100' : ''} />
                          </span>
                        </button>
                      </th>
                    )}
                    {columnVisibility.location && (
                      <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520]`}>
                        Location
                      </th>
                    )}
                    {columnVisibility.sector && (
                      <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520]`}>
                        Sector
                      </th>
                    )}
                    {columnVisibility.equity && (
                      <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520]`}>
                        Equity
                      </th>
                    )}
                    {columnVisibility.guarantees && (
                      <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520]`}>
                        Guarantees
                      </th>
                    )}
                    {columnVisibility.support && (
                      <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520]`}>
                        Support
                      </th>
                    )}
                    {columnVisibility.services && (
                      <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520]`}>
                        Services
                      </th>
                    )}
                    {columnVisibility.assignedUser && (
                      <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520]`}>
                        Assigned To
                      </th>
                    )}
                    {columnVisibility.daysInStage && (
                      <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520]`}>
                        Days
                      </th>
                    )}
                    {columnVisibility.lastActivity && (
                      <th className={`${ds.header} text-left text-white font-semibold border-r border-[#3a2520]`}>
                        Last Activity
                      </th>
                    )}
                    {columnVisibility.action && (
                      <th className={`${ds.header} text-center text-white font-semibold`}>
                        Next Action
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {paginatedSMEs.length === 0 ? (
                    <tr>
                      <td colSpan={Object.values(columnVisibility).filter(Boolean).length} 
                        className="text-center py-20">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-20 h-20 rounded-full bg-[#f5f0e1] flex items-center justify-center">
                            <Users size={32} className="text-[#7d5a50] opacity-50" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-[#4a352f]">No SMEs Found</p>
                            <p className="text-sm text-[#7d5a50] mt-1">
                              {searchQuery || Object.values(localFilters).some(f => Array.isArray(f) ? f.length > 0 : f) 
                                ? "Try adjusting your filters or search query" 
                                : "Applications will appear here when SMEs match your programme"}
                            </p>
                          </div>
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className="px-4 py-2 bg-[#f5f0e1] text-[#4a352f] rounded-xl text-sm font-medium hover:bg-[#e6d7c3] transition-all"
                            >
                              Clear Search
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedSMEs.map((sme) => {
                      const bigScoreLabel = getBigScoreLabel(sme.bigScore);
                      const matchLabel = getMatchLabel(sme.matchPercentage);
                      const statusStyle = getStatusStyle(sme.currentStatus);
                      const contextualAction = getContextualAction(sme);
                      const smeKey = `${sme.id}_${sme.programIndex}`;
                      const isExpanded = expandedRows.has(smeKey);
                      const currentStatus = updatedStages[smeKey] || sme.currentStatus;
                      const showNDAButton = currentStatus?.toLowerCase().includes("evaluation");
                      const ndaSent = sentNDAs[smeKey];
                      const isSharingNDA = isNDASharing[smeKey];

                      return (
                        <React.Fragment key={smeKey}>
                          <tr 
                            className={`
                              border-b border-[#f0e6d9] transition-all cursor-pointer
                              ${isExpanded ? 'bg-[#faf7f2]' : 'hover:bg-[#fdf8f4]'}
                            `}
                            onClick={() => toggleRowExpansion(smeKey)}
                          >
                            {/* SME Name */}
                            {columnVisibility.sme && (
                              <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f] sticky left-0 bg-white border-r border-[#f0e6d9] z-10`}
                                style={{ 
                                  backgroundColor: isExpanded ? '#faf7f2' : undefined,
                                  maxWidth: '140px'
                                }}>
                                <div className="flex items-start gap-2">
                                  <div className={`${ds.avatarSize} rounded-full bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5`}>
                                    {sme.name.charAt(0)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleViewDetails(sme); }}
                                      className="font-semibold text-[#4a352f] hover:text-[#7d5a50] hover:underline transition-colors text-left text-xs leading-tight"
                                      style={{ 
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                        display: 'block'
                                      }}
                                    >
                                      {sme.name}
                                    </button>
                                  </div>
                                </div>
                              </td>
                            )}

                            {/* BIG Score */}
                            {columnVisibility.bigScore && (
                              <td className={`${ds.cell} text-center`}>
                                <div className="flex flex-col items-center gap-1">
                                  <div className="relative w-11 h-11">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                      <circle cx="18" cy="18" r="14" fill="none" stroke="#e6d7c3" strokeWidth="3" />
                                      <circle 
                                        cx="18" cy="18" r="14" fill="none" 
                                        stroke={bigScoreLabel.color} 
                                        strokeWidth="3"
                                        strokeDasharray={`${sme.bigScore * 0.88} 88`}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000"
                                      />
                                    </svg>
                                    <span 
                                      className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                                      style={{ color: bigScoreLabel.color }}
                                    >
                                      {sme.bigScore}
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleBigScoreClick(sme); }}
                                    className="text-xs font-medium px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                                    style={{ 
                                      backgroundColor: `${bigScoreLabel.color}20`,
                                      color: bigScoreLabel.color
                                    }}
                                  >
                                    {bigScoreLabel.label}
                                  </button>
                                </div>
                              </td>
                            )}

                            {/* Match Score */}
                            {columnVisibility.match && (
                              <td className={`${ds.cell} text-center`}>
                                <div className="flex flex-col items-center gap-1">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i}
                                        size={12}
                                        className={i < matchLabel.stars ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'}
                                      />
                                    ))}
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleViewMatchBreakdown(sme); }}
                                    className="text-sm font-bold text-[#4a352f] hover:text-[#7d5a50] transition-colors"
                                  >
                                    {sme.matchPercentage}%
                                  </button>
                                  <span className="text-xs text-[#7d5a50]">{matchLabel.label}</span>
                                </div>
                              </td>
                            )}

                            {/* Funding Stage */}
                            {columnVisibility.fundingStage && (
                              <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f5f0e1] rounded-full text-xs font-medium text-[#4a352f]">
                                  {sme.fundingStage}
                                </span>
                              </td>
                            )}

                            {/* Funding Required */}
                            {columnVisibility.fundingRequired && (
                              <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}>
                                <span className="font-semibold">{sme.fundingRequired}</span>
                              </td>
                            )}

                            {/* Status */}
                            {columnVisibility.status && (
                              <td className={`${ds.cell}`}>
                                <span 
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
                                  style={{ 
                                    backgroundColor: statusStyle.bg,
                                    color: statusStyle.text,
                                    borderColor: statusStyle.border
                                  }}
                                >
                                  <span 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: statusStyle.dot }}
                                  />
                                  {currentStatus}
                                </span>
                              </td>
                            )}

                            {/* Applied Date */}
                            {columnVisibility.applied && (
                              <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}>
                                <div className="flex items-center gap-1.5">
                                  <Calendar size={14} className="text-[#7d5a50]" />
                                  {sme.applicationDate}
                                </div>
                              </td>
                            )}

                            {/* Optional Columns */}
                            {columnVisibility.location && (
                              <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}>
                                <div className="flex items-center gap-1.5">
                                  <MapPin size={14} className="text-[#7d5a50]" />
                                  {sme.location}
                                </div>
                              </td>
                            )}
                            {columnVisibility.sector && (
                              <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}>{sme.sector}</td>
                            )}
                            {columnVisibility.equity && (
                              <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}>{sme.equityOffered}</td>
                            )}
                            {columnVisibility.guarantees && (
                              <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}>
                                <span className="line-clamp-1">{sme.guarantees}</span>
                              </td>
                            )}
                            {columnVisibility.support && (
                              <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}>
                                <span className="line-clamp-1">{sme.supportRequired}</span>
                              </td>
                            )}
                            {columnVisibility.services && (
                              <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}>
                                <span className="line-clamp-1">{sme.servicesRequired}</span>
                              </td>
                            )}
                            {columnVisibility.assignedUser && (
                              <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}>{sme.assignedUser}</td>
                            )}
                            {columnVisibility.daysInStage && (
                              <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}>
                                {sme.daysInStage > 0 ? `${sme.daysInStage}d` : "N/A"}
                              </td>
                            )}
                            {columnVisibility.lastActivity && (
                              <td className={`${ds.cell} ${ds.fontSize} text-[#4a352f]`}>{sme.lastActivity}</td>
                            )}

                            {/* Action */}
                            {columnVisibility.action && (
                              <td className={`${ds.cell} text-center`}>
                                <div className="flex flex-col gap-1.5 items-center">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleStageAction(sme); }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
                                    style={{ 
                                      backgroundColor: contextualAction.color
                                    }}
                                  >
                                    {contextualAction.icon}
                                    {contextualAction.label}
                                  </button>
                                  
                                  {showNDAButton && (
                                    ndaSent ? (
                                      <span className="text-xs text-[#7d5a50] flex items-center gap-1">
                                        <CheckCircle size={12} className="text-green-500" />
                                        NDA Sent
                                      </span>
                                    ) : (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleShareNDA(sme); }}
                                        disabled={isSharingNDA}
                                        className="text-xs text-[#7d5a50] hover:text-[#4a352f] hover:underline transition-all disabled:opacity-50"
                                      >
                                        {isSharingNDA ? "Sharing..." : "Share NDA"}
                                      </button>
                                    )
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>

                          {/* Expanded Row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={Object.values(columnVisibility).filter(Boolean).length} 
                                className="bg-[#faf7f2] p-6 border-b-2 border-[#7d5a50]/20">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {/* Company Details */}
                                  <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e6d7c3]">
                                    <h4 className="text-xs font-semibold text-[#4a352f] uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <Building size={14} className="text-[#7d5a50]" />
                                      Company
                                    </h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-xs text-[#7d5a50]">Sector</span>
                                        <span className="text-xs font-medium text-[#4a352f]">{sme.sector}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-xs text-[#7d5a50]">Location</span>
                                        <span className="text-xs font-medium text-[#4a352f]">{sme.location}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-xs text-[#7d5a50]">Province</span>
                                        <span className="text-xs font-medium text-[#4a352f]">{sme.province}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Funding Details */}
                                  <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e6d7c3]">
                                    <h4 className="text-xs font-semibold text-[#4a352f] uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <DollarSign size={14} className="text-[#7d5a50]" />
                                      Funding
                                    </h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-xs text-[#7d5a50]">Required</span>
                                        <span className="text-xs font-medium text-[#4a352f]">{sme.fundingRequired}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-xs text-[#7d5a50]">Equity</span>
                                        <span className="text-xs font-medium text-[#4a352f]">{sme.equityOffered}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Support Details */}
                                  <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e6d7c3]">
                                    <h4 className="text-xs font-semibold text-[#4a352f] uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <MessageSquare size={14} className="text-[#7d5a50]" />
                                      Support
                                    </h4>
                                    <div className="space-y-2">
                                      <div>
                                        <span className="text-xs text-[#7d5a50]">Support Required</span>
                                        <p className="text-xs text-[#4a352f] mt-1 line-clamp-2">{sme.supportRequired}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-[#7d5a50]">Services Required</span>
                                        <p className="text-xs text-[#4a352f] mt-1 line-clamp-2">{sme.servicesRequired}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Quick Actions */}
                                  <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e6d7c3]">
                                    <h4 className="text-xs font-semibold text-[#4a352f] uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <Settings size={14} className="text-[#7d5a50]" />
                                      Quick Actions
                                    </h4>
                                    <div className="space-y-2">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleViewDetails(sme); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 bg-[#f5f0e1] text-[#4a352f] rounded-lg text-xs font-medium hover:bg-[#e6d7c3] transition-all"
                                      >
                                        <Eye size={14} /> View Full Profile
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleStageAction(sme); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-white rounded-lg text-xs font-medium transition-all hover:shadow-lg"
                                        style={{ backgroundColor: contextualAction.color }}
                                      >
                                        <ArrowRight size={14} /> {contextualAction.label}
                                      </button>
                                      <button className="w-full flex items-center gap-2 px-3 py-2 bg-[#f5f0e1] text-[#4a352f] rounded-lg text-xs font-medium hover:bg-[#e6d7c3] transition-all">
                                        <MessageSquare size={14} /> Send Message
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#e6d7c3] bg-[#faf7f2] rounded-b-2xl">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#4a352f]">
                  Showing <span className="font-semibold">{Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedSMEs.length)}-{Math.min(currentPage * pageSize, filteredAndSortedSMEs.length)}</span> of <span className="font-semibold">{filteredAndSortedSMEs.length}</span> SMEs
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] focus:outline-none focus:border-[#7d5a50]"
                >
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-[#7d5a50] text-white shadow-md'
                          : 'bg-white border border-[#c8b6a6] text-[#4a352f] hover:bg-[#f5f0e1]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Stage Action Modal ───────────────────────────────────────────────── */}
      {showStageModal && selectedSMEForStage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] animate-fadeIn" onClick={() => setShowStageModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-[500px] w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#4a352f]">Update Stage</h3>
                <p className="text-sm text-[#7d5a50] mt-1">{selectedSMEForStage.name}</p>
              </div>
              <button onClick={() => setShowStageModal(false)} className="text-[#7d5a50] hover:text-[#4a352f]">
                <X size={20} />
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-[#4a352f] mb-2">Next Stage</label>
              <select
                value={nextStage}
                onChange={(e) => { setNextStage(e.target.value); setFormErrors({ ...formErrors, nextStage: "" }); }}
                className={`w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-all ${
                  formErrors.nextStage ? 'border-red-500 bg-red-50' : 'border-[#c8b6a6] focus:border-[#7d5a50]'
                }`}
              >
                <option value="">Select next stage...</option>
                {Object.keys(PIPELINE_STAGES).map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
                <option value="Decline">Decline</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-[#4a352f] mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => { setMessage(e.target.value); if (e.target.value.trim()) setFormErrors({ ...formErrors, message: "" }); }}
                placeholder="Enter your message to the SME..."
                rows={4}
                className={`w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-all resize-y ${
                  formErrors.message ? 'border-red-500 bg-red-50' : 'border-[#c8b6a6] focus:border-[#7d5a50]'
                }`}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowStageModal(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleStageUpdate}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-[#7d5a50] to-[#4a352f] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Updating..." : "Update Stage"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SMSE Details Modal ───────────────────────────────────────────────── */}
      {showSMEDetails && selectedSMEDetails && (
        <SMEDetailsModal
          sme={selectedSMEDetails}
          isOpen={showSMEDetails}
          onClose={() => { setShowSMEDetails(false); setSelectedSMEDetails(null); }}
        />
      )}

      {/* ─── BIG Score Modal ─────────────────────────────────────────────────── */}
      {selectedSME && modalType === "bigScore" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] animate-fadeIn" onClick={() => { setSelectedSME(null); setModalType(null); }}>
          <div className="bg-white rounded-2xl max-w-[450px] w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">BIG Score</p>
                  <h3 className="text-lg font-bold mt-1">{selectedSME.name}</h3>
                </div>
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-2xl font-bold">{selectedSME.bigScore}</span>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {Object.entries(bigScoreData).map(([key, data]) => {
                const labels = {
                  compliance: "Compliance",
                  legitimacy: "Legitimacy",
                  fundability: "Fundability",
                  pis: "PIS Score",
                  leadership: "Leadership"
                };
                const score = data.score || 0;
                const bigLabel = getBigScoreLabel(score);
                
                return (
                  <div key={key} className="bg-[#faf7f2] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-[#4a352f]">{labels[key]}</span>
                      <span className="text-sm font-bold" style={{ color: bigLabel.color }}>{score}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#e6d7c3] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${score}%`, backgroundColor: bigLabel.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-6 pt-0">
              <button
                onClick={() => { setSelectedSME(null); setModalType(null); }}
                className="w-full py-3 bg-gradient-to-r from-[#7d5a50] to-[#4a352f] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Match Breakdown Modal ───────────────────────────────────────────── */}
      {showMatchBreakdown && selectedAcceleratorForBreakdown && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] animate-fadeIn" onClick={() => setShowMatchBreakdown(false)}>
          <div className="bg-white rounded-2xl max-w-[550px] w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Match Breakdown</p>
                  <h3 className="text-lg font-bold mt-1">{selectedAcceleratorForBreakdown.name}</h3>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{selectedAcceleratorForBreakdown.matchPercentage}%</div>
                  <div className="text-xs text-[#f5f0e1]">Match</div>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {selectedAcceleratorForBreakdown.matchBreakdown && 
                Object.entries(selectedAcceleratorForBreakdown.matchBreakdown).map(([key, data]) => {
                  if (!data || typeof data !== 'object') return null;
                  const labels = {
                    fundingStage: "Funding Stage",
                    ticketSize: "Ticket Size",
                    geographicFit: "Geographic Fit",
                    sectorMatch: "Sector Match",
                    instrumentFit: "Instrument Fit",
                    supportMatch: "Support Match",
                    legalEntityFit: "Legal Entity",
                    revenueThreshold: "Revenue Threshold"
                  };
                  
                  return (
                    <div key={key} className={`p-4 rounded-xl border ${data.matched ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#4a352f]">{labels[key] || key}</span>
                        {data.matched ? (
                          <CheckCircle size={18} className="text-green-500" />
                        ) : (
                          <XCircle size={18} className="text-red-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="p-6 pt-0">
              <button
                onClick={() => setShowMatchBreakdown(false)}
                className="w-full py-3 bg-gradient-to-r from-[#7d5a50] to-[#4a352f] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}