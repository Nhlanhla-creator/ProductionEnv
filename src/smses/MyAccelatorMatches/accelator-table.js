"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import {
  Check, ChevronDown, X, Eye, SlidersHorizontal, GripVertical, RotateCcw,
  Settings, Trash2, Plus, LayoutGrid, CheckCircle, MoreVertical
} from "lucide-react"
import { collection, getDocs } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { doc, setDoc, getDoc, serverTimestamp, query, where, orderBy, limit } from "firebase/firestore"
import emailjs from '@emailjs/browser';
import { API_KEYS } from "../../API"
import CatalystDetailsModal from "./accelatorDetailsModal"
import { DEFAULT_STAGES, mapStatusToStageId, getStageColors, getNextStageId } from "../../catalyst/CatalystMatches/stageConfig"

// ─────────────────────────────────────────────────────────────────────────
// Stage vocabulary — now sourced from the SAME stageConfig.js the catalyst
// side (SupportSMETable.jsx / SupportDealFlowPipeline.jsx) uses, instead of
// this file's own separate PIPELINE_STAGES list. Previously this table used
// "Match / Application Sent / Support Approved / Active Support /
// Successful Deals / Support Declined" while the catalyst side used
// "Matched / Applied / Offer / Admitted / Declined / Withdrawn" — two
// completely different vocabularies describing the same pipeline, which is
// why applications never lined up between the two sides.
//
// LEGACY_STATUS_ALIASES lets any already-written Firestore records using
// the old labels still resolve to the correct canonical stage (for
// display/coloring) without needing a data migration. New writes from this
// file now use the canonical stageConfig.js names directly.
//
// KNOWN LIMITATION: a catalyst's programme type and any stage
// customization (renames, custom stages, reordering) currently live only in
// that catalyst's own browser localStorage (see stageConfig.js), not
// Firestore — so this business-side view has no way to know about a
// specific catalyst's custom setup. What it *can* do reliably is match the
// shared BIG-default vocabulary and colors. The status badge always shows
// the actual raw status string on the record (so a catalyst's custom stage
// name like "Committee" still displays correctly, verbatim) — only the
// *color grouping* falls back to the closest canonical match.
const LEGACY_STATUS_ALIASES = {
  "Match": "Matched",
  "Application Sent": "Applied",
  "Support Approved": "Offer",
  "Active Support": "Admitted",
  "Successful Deals": "Admitted",
  "Support Declined": "Declined",
}
const normalizeStatus = (status) => LEGACY_STATUS_ALIASES[status] || status

const getStatusMeta = (status) => {
  const normalized = normalizeStatus(status)
  const stageId = mapStatusToStageId(normalized, DEFAULT_STAGES)
  const stage = DEFAULT_STAGES.find((s) => s.id === stageId) || DEFAULT_STAGES[0]
  const colors = getStageColors(stage.group)
  return { label: status || stage.name, colors, stage }
}

const getNextStageName = (currentStatus) => {
  const currentId = mapStatusToStageId(normalizeStatus(currentStatus), DEFAULT_STAGES)
  const nextId = getNextStageId(DEFAULT_STAGES, currentId)
  const stage = DEFAULT_STAGES.find((s) => s.id === nextId) || DEFAULT_STAGES[0]
  return stage.name
}

// Geographic focus options
const geographicFocusOptions = [
  { value: "global", label: "Global" },
  { value: "regional_na", label: "Regional (NA)" },
  { value: "regional_emea", label: "Regional (EMEA)" },
  { value: "regional_apac", label: "Regional (APAC)" },
  { value: "country_specific", label: "Country-specific" },
  { value: "province_specific", label: "Province Specific" },
]

// Sector focus options
const sectorFocusOptions = [
  { value: "Generalist", label: "Generalist" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Automotive", label: "Automotive" },
  { value: "Banking, Finance & Insurance", label: "Banking, Finance & Insurance" },
  { value: "Beauty / Cosmetics / Personal Care", label: "Beauty / Cosmetics / Personal Care" },
  { value: "Construction", label: "Construction" },
  { value: "Consulting", label: "Consulting" },
  { value: "Creative Arts / Design", label: "Creative Arts / Design" },
  { value: "Customer Service", label: "Customer Service" },
  { value: "Education & Training", label: "Education & Training" },
  { value: "Engineering", label: "Engineering" },
  { value: "Environmental / Natural Sciences", label: "Environmental / Natural Sciences" },
  { value: "Government / Public Sector", label: "Government / Public Sector" },
  { value: "Healthcare / Medical", label: "Healthcare / Medical" },
  { value: "Hospitality / Tourism", label: "Hospitality / Tourism" },
  { value: "Human Resources", label: "Human Resources" },
  { value: "Information Technology (IT)", label: "Information Technology (IT)" },
  { value: "Infrastructure", label: "Infrastructure" },
  { value: "Legal / Law", label: "Legal / Law" },
  { value: "Logistics / Supply Chain", label: "Logistics / Supply Chain" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Marketing / Advertising / PR", label: "Marketing / Advertising / PR" },
  { value: "Media / Journalism / Broadcasting", label: "Media / Journalism / Broadcasting" },
  { value: "Mining", label: "Mining" },
  { value: "Energy", label: "Energy" },
  { value: "Oil & Gas", label: "Oil & Gas" },
  { value: "Non-Profit / NGO", label: "Non-Profit / NGO" },
  { value: "Property / Real Estate", label: "Property / Real Estate" },
  { value: "Retail / Wholesale", label: "Retail / Wholesale" },
  { value: "Safety & Security / Police / Defence", label: "Safety & Security / Police / Defence" },
  { value: "Sales", label: "Sales" },
  { value: "Science & Research", label: "Science & Research" },
  { value: "Social Services / Social Work", label: "Social Services / Social Work" },
  { value: "Sports / Recreation / Fitness", label: "Sports / Recreation / Fitness" },
  { value: "Telecommunications", label: "Telecommunications" },
  { value: "Transport", label: "Transport" },
  { value: "Utilities (Water, Electricity, Waste)", label: "Utilities (Water, Electricity, Waste)" },
]

// Funding stage options
const fundingStageOptions = [
  { value: "Startup", label: "Startup" },
  { value: "Growth", label: "Growth" },
  { value: "Scaling", label: "Scaling" },
  { value: "Turnaround", label: "Turnaround" },
  { value: "Mature", label: "Mature" },
  { value: "any_stage", label: "Any Stage" },
]

// Support offered options
const supportOfferedOptions = [
  { value: "funding", label: "Funding Support" },
  { value: "capacity_building", label: "Capacity Building" },
  { value: "market_access", label: "Market Access" },
  { value: "technology", label: "Technology & Innovation" },
  { value: "social_impact", label: "Social Impact" },
]

const formatLabel = (value) => {
  if (!value) return ""
  return value
    .toString()
    .split(",")
    .map((item) => item.trim())
    .map((word) => {
      if (word.toLowerCase() === "ict") return "ICT"
      if (word.toLowerCase() === "southafrica" || word.toLowerCase() === "south_africa") return "South Africa"
      return word
        .split(/[_\s-]+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ")
    })
    .join(", ")
}

// ─── Column config (drag order + filters + widths) ─────────────────────────
// Every column has a filter, matching the catalyst SME table's design.
const COLUMN_DEFS = {
  match: { label: "Match %", align: "center", minWidth: "110px", filterType: "match" },
  geographicFocus: { label: "Geographic Focus", align: "left", minWidth: "108px", filterType: "geographicFocus" },
  sectorFocus: { label: "Sector Focus", align: "left", minWidth: "100px", filterType: "sectorFocus" },
  fundingStage: { label: "Funding Stage", align: "left", minWidth: "96px", filterType: "fundingStage" },
  fundingType: { label: "Funding Type", align: "left", minWidth: "96px", filterType: "fundingType" },
  ticketSize: { label: "Ticket Size", align: "left", minWidth: "92px", filterType: "ticketSize" },
  supportOffered: { label: "Support Offered", align: "left", minWidth: "108px", filterType: "supportOffered" },
  servicesOffered: { label: "Services Offered", align: "left", minWidth: "108px", filterType: "servicesOffered" },
  deadline: { label: "Deadline", align: "left", minWidth: "88px", filterType: "deadline" },
  speed: { label: "Speed (Days)", align: "left", minWidth: "100px", filterType: "speed" },
  status: { label: "Status", align: "left", minWidth: "100px", filterType: "status" },
  nextStage: { label: "Next Stage", align: "left", minWidth: "100px", filterType: "nextStage" },
}
const DEFAULT_COLUMN_ORDER = Object.keys(COLUMN_DEFS)
const DEFAULT_COLUMN_VISIBILITY = Object.fromEntries(DEFAULT_COLUMN_ORDER.map((k) => [k, true]))
const DEFAULT_DENSITY = "comfortable"

// ─── Custom Views (same model as the catalyst SME table) ──────────────────
const BUILTIN_VIEW_ID = "__default__"
const VIEWS_STORAGE_KEY = "accelerator-table-views-v1"

const sanitizeColumnOrder = (order) => {
  if (!Array.isArray(order)) return [...DEFAULT_COLUMN_ORDER]
  const known = new Set(DEFAULT_COLUMN_ORDER)
  const deduped = order.filter((key) => known.has(key))
  const missing = DEFAULT_COLUMN_ORDER.filter((key) => !deduped.includes(key))
  return [...deduped, ...missing]
}
const createDefaultViewLayout = () => ({
  columnVisibility: { ...DEFAULT_COLUMN_VISIBILITY },
  columnOrder: [...DEFAULT_COLUMN_ORDER],
  density: DEFAULT_DENSITY,
})
const createBuiltinDefaultView = () => ({ id: BUILTIN_VIEW_ID, name: "Default", description: "", builtin: true, ...createDefaultViewLayout() })
const sanitizeView = (view, fallbackId) => ({
  id: view?.id || fallbackId,
  name: (view?.name || "Untitled view").toString(),
  description: (view?.description || "").toString(),
  builtin: !!view?.builtin,
  columnVisibility: { ...DEFAULT_COLUMN_VISIBILITY, ...(view?.columnVisibility || {}) },
  columnOrder: sanitizeColumnOrder(view?.columnOrder),
  density: view?.density || DEFAULT_DENSITY,
})
const loadViewsState = () => {
  const freshDefault = () => ({ activeViewId: BUILTIN_VIEW_ID, views: { [BUILTIN_VIEW_ID]: createBuiltinDefaultView() } })
  if (typeof window === "undefined") return freshDefault()
  try {
    const saved = JSON.parse(window.localStorage.getItem(VIEWS_STORAGE_KEY) || "null")
    const rawViews = saved?.views && typeof saved.views === "object" ? saved.views : {}
    const views = {}
    Object.entries(rawViews).forEach(([id, v]) => { views[id] = sanitizeView(v, id) })
    views[BUILTIN_VIEW_ID] = views[BUILTIN_VIEW_ID]
      ? { ...views[BUILTIN_VIEW_ID], id: BUILTIN_VIEW_ID, name: "Default", builtin: true }
      : createBuiltinDefaultView()
    const activeViewId = saved?.activeViewId && views[saved.activeViewId] ? saved.activeViewId : BUILTIN_VIEW_ID
    return { activeViewId, views }
  } catch {
    return freshDefault()
  }
}
const persistViewsState = (state) => {
  if (typeof window === "undefined") return
  try { window.localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(state)) } catch {
    // Storage can fail (private browsing, quota) — table still works this session.
  }
}
const generateViewId = () => {
  try { return `view_${crypto.randomUUID()}` } catch { return `view_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }
}

const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

// Text truncation component
const TruncatedText = ({ text, maxLength = 50 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span className="text-[#a89482]">{text || "-"}</span>
  }

  const shouldTruncate = text.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`

  const toggleExpanded = (e) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <span className="leading-snug">
      <span className="break-words">{displayText}</span>
      {shouldTruncate && (
        <button onClick={toggleExpanded} className="ml-1 text-[10px] text-[#a67c52] underline hover:text-[#4a352f]">
          {isExpanded ? "Less" : "More"}
        </button>
      )}
    </span>
  )
}

export function AcceleratorTable({ filters, stageFilter, onApplicationSubmitted }) {
  const [accelerators, setAccelerators] = useState([])
  const [loading, setLoading] = useState(false)
  const [statuses, setStatuses] = useState({})
  const [pipelineStages, setPipelineStages] = useState({})
  const [notification, setNotification] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [showMatchBreakdown, setShowMatchBreakdown] = useState(false)
  const [selectedAccelerator, setSelectedAccelerator] = useState(null)
  const [showCatalystDetails, setShowCatalystDetails] = useState(false)
  const [selectedCatalystDetails, setSelectedCatalystDetails] = useState(null)

  // ─── Views (column visibility / order / density) ─────────────────────────
  const [viewsState, setViewsState] = useState(() => loadViewsState())
  const initialActiveView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]
  const [columnVisibility, setColumnVisibility] = useState(() => initialActiveView.columnVisibility)
  const [columnOrder, setColumnOrder] = useState(() => initialActiveView.columnOrder)
  const [density, setDensity] = useState(() => initialActiveView.density)

  const [showCustomizeMenu, setShowCustomizeMenu] = useState(false)
  const [customizeMenuRect, setCustomizeMenuRect] = useState(null)
  const [showNewViewForm, setShowNewViewForm] = useState(false)
  const [newViewName, setNewViewName] = useState("")
  const [newViewDescription, setNewViewDescription] = useState("")
  const [editingViewMeta, setEditingViewMeta] = useState(null)

  // Column drag-to-reorder
  const [draggedColumn, setDraggedColumn] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [dragHintRect, setDragHintRect] = useState(null)

  // Per-column header filters
  const [headerFilterOpen, setHeaderFilterOpen] = useState(null)
  const [localFilters, setLocalFilters] = useState({
    name: "", matchRange: [0, 100],
    geographicFocus: [], sectorFocus: [], fundingStage: [], fundingType: [], supportOffered: [], status: [], nextStage: [],
    ticketSize: "", servicesOffered: "", deadline: "", speed: "",
  })

  const [hoveredRowKey, setHoveredRowKey] = useState(null)
  const [rowMenu, setRowMenu] = useState(null) // { accelerator, position }

  // Company member states
  const [companyOwnerId, setCompanyOwnerId] = useState(null)
  const [isCompanyMember, setIsCompanyMember] = useState(false)
  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [userRole, setUserRole] = useState(null)

  const hasApplication = (acceleratorId) => {
    return statuses[acceleratorId] || (pipelineStages[acceleratorId] && pipelineStages[acceleratorId] !== "Matched")
  }

  const isMountedRef = useRef(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Check company membership on mount
  useEffect(() => {
    const checkCompanyMembership = async () => {
      const user = auth.currentUser
      if (!user) return

      try {
        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
          const userCompanyId = userData.companyId
          const userCompanyRole = userData.userRole

          if (userCompanyId) {
            const companyDocRef = doc(db, "companies", userCompanyId)
            const companyDocSnap = await getDoc(companyDocRef)

            if (companyDocSnap.exists()) {
              const companyData = companyDocSnap.data()
              const ownerId = companyData.createdBy

              setUserRole(userCompanyRole || 'viewer')

              if (ownerId === user.uid) {
                setIsCompanyMember(false)
                setEffectiveUserId(user.uid)
              } else {
                setIsCompanyMember(true)
                setCompanyOwnerId(ownerId)
                setEffectiveUserId(ownerId)
              }
            }
          } else {
            setIsCompanyMember(false)
            setEffectiveUserId(user.uid)
            setUserRole('owner')
          }
        }
      } catch (error) {
        console.error("Error checking company membership:", error)
        setEffectiveUserId(user.uid)
        setUserRole('owner')
      }
    }

    checkCompanyMembership()
  }, [])

  const hasTooManyMissingFields = (accelerator) => {
    const fieldsToCheck = [
      accelerator.geographicFocus,
      accelerator.sectorFocus,
      accelerator.fundingStage,
      accelerator.fundingType,
      accelerator.ticketSize,
      accelerator.supportOffered,
      accelerator.servicesOffered,
      accelerator.deadline,
      accelerator.speed
    ];

    const missingCount = fieldsToCheck.filter(field =>
      !field ||
      field === '-' ||
      field === 'Not specified' ||
      field === 'Various' ||
      field === 'unspecified' ||
      field === 'Unknown' ||
      field === 'N/A'
    ).length;

    return missingCount > 4;
  };

  // Function to send email notification to catalyst
  const sendCatalystEmailNotification = async (catalystId, smeData, accelerator) => {
    try {
      const emailjsConfig = {
        serviceId: API_KEYS.SERVICE_ID_MESSAGES,
        templateId: API_KEYS.TEMPLATE_ID_MESSAGES,
        publicKey: API_KEYS.PUBLIC_KEY_ID_MESSAGES
      };

      if (!window.emailjs) {
        emailjs.init(emailjsConfig.publicKey);
        window.emailjs = emailjs;
      }

      let catalystEmail = null;

      try {
        const catalystProfileRef = doc(db, "catalystProfiles", catalystId);
        const catalystProfileSnap = await getDoc(catalystProfileRef);

        if (catalystProfileSnap.exists()) {
          const profileData = catalystProfileSnap.data();
          catalystEmail = profileData.formData?.contactDetails?.businessEmail;

          if (!catalystEmail) {
            catalystEmail = profileData.formData?.contactDetails?.email ||
              profileData.email ||
              profileData.contactEmail;
          }
        }
      } catch (fetchError) {
        console.error("❌ Error fetching catalyst email:", fetchError);
      }

      if (!catalystEmail) {
        console.warn("⚠️ No catalyst email found, using fallback");
        catalystEmail = "support@bigmarketplace.africa";
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(catalystEmail)) {
        throw new Error(`Invalid email format: "${catalystEmail}"`);
      }

      const smeName = smeData.entityOverview?.registeredName || "An SMSE";
      const catalystName = accelerator.name || "Catalyst";

      const emailSubject = `New Application Received from ${smeName}`;

      let emailMessage = `Dear ${catalystName} Team,\n\n`;
      emailMessage += `You have received a new application from ${smeName}.\n\n`;
      emailMessage += `Application Details:\n`;
      emailMessage += `- SMSE Name: ${smeName}\n`;
      emailMessage += `- Location: ${smeData.entityOverview?.location || "Not specified"}\n`;
      emailMessage += `- Sector: ${(smeData.entityOverview?.economicSectors || []).join(", ") || "Not specified"}\n`;
      emailMessage += `- Funding Stage: ${smeData.entityOverview?.operationStage || "Not specified"}\n`;
      emailMessage += `- Funding Required: ${smeData.useOfFunds?.amountRequested || "Not specified"}\n`;
      emailMessage += `- Match Score: ${accelerator.matchPercentage || 0}%\n\n`;
      emailMessage += `You can review this application in your catalyst dashboard.\n\n`;
      emailMessage += `Best regards,\nBIG Marketplace Africa Team`;

      const templateParams = {
        to_email: catalystEmail,
        subject: emailSubject,
        from_name: "BIG Marketplace Africa",
        date: new Date().toLocaleDateString(),
        message: emailMessage,
        portal_url: `https://www.bigmarketplace.africa/catalyst/applications`,
        has_attachments: "false",
        attachments_count: "0"
      };

      const response = await window.emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        templateParams,
        emailjsConfig.publicKey
      );

      return true;
    } catch (emailError) {
      console.error("❌ Catalyst email failed:", emailError);
      return false;
    }
  }

  const fetchAccelerators = async () => {
    if (!isMountedRef.current || !effectiveUserId) return

    setLoading(true)
    try {
      const user = auth.currentUser
      if (!user) return

      const smeDoc = await getDoc(doc(db, "universalProfiles", effectiveUserId))
      const smeData = smeDoc.exists() ? smeDoc.data() : {}

      const snapshot = await getDocs(collection(db, "catalystProfiles"))

      const profiles = await Promise.all(
        snapshot.docs.flatMap(async (docSnap) => {
          const catalystId = docSnap.id

          if (catalystId === user.uid || catalystId === effectiveUserId) {
            return []
          }

          const data = docSnap.data()
          const formData = data.formData || {}
          const overview = formData.entityOverview || {}
          const programs = formData?.programmeDetails?.programs || []
          const matchPrefs = formData.generalMatchingPreference || {}

          // If no programs, create one entry with default values
          if (programs.length === 0) {
            const applicationId = `${catalystId}_${effectiveUserId}`
            const appDocRef = doc(db, "catalystApplications", applicationId)
            const appDocSnap = await getDoc(appDocRef)
            const appData = appDocSnap.exists() ? appDocSnap.data() : null

            return [
              {
                id: catalystId,
                programIndex: 0,
                name: overview.registeredName || "Unnamed",
                location: overview.province || "N/A",
                geographicFocus: matchPrefs.geographicFocus || "-",
                sectorFocus: matchPrefs.sectorFocus || "-",
                fundingStage: matchPrefs.programStage || "-",
                fundingType: matchPrefs.supportFocusSubtype || "-",
                ticketSize: "-",
                supportOffered: matchPrefs.supportFocus || "-",
                servicesOffered: matchPrefs.supportFocusSubtype || "-",
                deadline: formData.applicationBrief?.applicationWindow || "unspecified",
                speed: formData.applicationBrief?.estimatedReviewTime || "Unknown",
                matchPercentage: calculateMatchScore(smeData, formData),
                // Canonical stageConfig.js names now, matching the catalyst side directly.
                pipelineStage: appData?.pipelineStage || "Matched",
                nextStage: appData?.nextStage || "Applied",
                rawFormData: formData,
              },
            ]
          }

          return await Promise.all(
            programs.map(async (program, index) => {
              const applicationId = `${catalystId}_${effectiveUserId}_${index}`
              const appDocRef = doc(db, "catalystApplications", applicationId)
              const appDocSnap = await getDoc(appDocRef)
              const appData = appDocSnap.exists() ? appDocSnap.data() : null
              const matchResult = calculateMatchScore(smeData, formData, program)

              return {
                id: `${catalystId}_${index}`,
                originalCatalystId: catalystId,
                programIndex: index,
                name: `${overview.registeredName || "Unnamed"}${programs.length > 1 ? ` (Program ${program.name})` : ""}`,
                location: overview.province || "N/A",
                geographicFocus: matchPrefs.geographicFocus || "-",
                sectorFocus: matchPrefs.sectorFocus || "-",
                fundingStage: matchPrefs.programStage || "-",
                fundingType: program.supportType || matchPrefs.supportFocusSubtype || "-",
                ticketSize:
                  program.budget || `${program.minimumSupport || "0"} - ${program.maximumSupport || "0"}` || "-",
                supportOffered: program.supportOffered || matchPrefs.supportFocus || "-",
                servicesOffered: program.servicesOffered || matchPrefs.supportFocusSubtype || "-",
                deadline: formData.applicationBrief?.applicationWindow || "unspecified",
                speed: formData.applicationBrief?.estimatedReviewTime || "Unknown",
                matchPercentage: matchResult.score,
                matchBreakdown: matchResult.breakdown,
                pipelineStage: appData?.pipelineStage || "Matched",
                nextStage: appData?.nextStage || "Applied",
                rawFormData: formData,
              }
            }),
          )
        }),
      )

      const flattenedProfiles = profiles.flat()
      flattenedProfiles.sort((a, b) => b.matchPercentage - a.matchPercentage)
      setAccelerators(flattenedProfiles)
    } catch (err) {
      console.error("Error loading accelerator profiles:", err)
      setNotification({ type: "error", message: "Failed to load accelerator data." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    if (effectiveUserId) {
      fetchAccelerators()
    }
    return () => {
      isMountedRef.current = false
    }
  }, [filters, effectiveUserId])

  useEffect(() => {
    if (!effectiveUserId) return

    const loadStatusFromFirestore = async () => {
      const snapshot = await getDocs(collection(db, "smeCatalystApplications"))
      const statusMap = {}
      const stageMap = {}

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data()
        if (data.smeId === effectiveUserId) {
          const key = `${data.catalystId}_${data.programIndex ?? 0}`
          statusMap[key] = "Sent"
          stageMap[key] = data.status || "Applied"
        }
      })

      setStatuses(statusMap)
      setPipelineStages(stageMap)
    }

    loadStatusFromFirestore()
  }, [effectiveUserId, accelerators])

  const calculateMatchScore = (smeData, acceleratorData, program = null) => {
    const totalFields = 8
    let matched = 0

    const breakdown = {
      fundingStage: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      ticketSize: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      geographicFit: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      sectorMatch: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      instrumentFit: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      supportMatch: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      legalEntityFit: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      revenueThreshold: { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
    }

    const toArray = (v) => {
      if (v == null) return [];
      if (Array.isArray(v)) return v;
      return v.toString().split(/[,\|/]+/g).map(s => s.trim()).filter(Boolean);
    };

    const splitSectorTokens = (v) =>
      toArray(v)
        .flatMap(item => item.split(/[,\|/]+/g))
        .flatMap(item => item.split(/[_/\-\s]+/g))
        .map(s => s.replace(/\(.*?\)/g, ""))
        .map(s => s.trim())
        .filter(Boolean);

    const canon = (s) => s.toLowerCase().replace(/[^a-z]/g, "");

    const SECTOR_ALIASES = {
      it: "informationtechnology",
      ict: "informationtechnology",
      informationtechnology: "informationtechnology",
      technology: "informationtechnology",
      software: "informationtechnology",
      agri: "agriculture",
      agriculture: "agriculture",
      forestry: "forestry",
      fishing: "fishing",
    };

    const COMPOSITE_EXPANSIONS = {
      agricultureforestryfishing: ["agriculture", "forestry", "fishing"],
    };

    const mapAlias = (t) => SECTOR_ALIASES[t] || t;

    const normalizeSectors = (v) =>
      splitSectorTokens(v)
        .map(canon)
        .map(mapAlias)
        .flatMap(t => COMPOSITE_EXPANSIONS[t] ? COMPOSITE_EXPANSIONS[t] : [t])
        .filter(Boolean);

    const hasOverlap = (a, b) => {
      const A = new Set(normalizeSectors(a));
      for (const t of normalizeSectors(b)) if (A.has(t)) return true;
      return false;
    };

    const normalizeToken = (s) =>
      s.toString().toLowerCase().trim().replace(/[_\-\s]+/g, "");

    const normalizeList = (v) =>
      toArray(v)
        .flatMap(item => item.split(/\s*,\s*/))
        .map(normalizeToken)
        .filter(Boolean);

    const normalize = (val) => (Array.isArray(val) ? val.map((v) => v.toLowerCase().trim()) : val?.toLowerCase().trim())

    const cleanCurrency = (value) => {
      if (!value) return 0
      const cleaned = value.toString().replace(/[^0-9.]/g, "")
      return Number.parseFloat(cleaned) || 0
    }

    const cleanString = (input) => {
      if (Array.isArray(input)) {
        return input.map((str) => (typeof str === "string" ? str.replace(/[_-]/g, " ").toLowerCase() : str))
      }
      if (typeof input === "string") {
        return input.replace(/[_-]/g, " ").toLowerCase()
      }
      return input
    }

    const checkGeographicMatch = (smeLocation, acceleratorGeoData) => {
      const smeProvince = normalize(smeData.entityOverview?.province)
      const smeCountry = cleanString(smeData.entityOverview?.location) || "not specified"

      const accelGeoFocus = acceleratorGeoData.geographicFocus || []
      const accelSelectedCountries = cleanString(acceleratorGeoData.selectedCountries) || []
      const accelSelectedProvinces = cleanString(acceleratorGeoData.selectedProvinces) || []

      if (accelGeoFocus.includes("global")) return true
      if (
        accelGeoFocus.includes("regional_emea") ||
        accelGeoFocus.includes("regional_na") ||
        accelGeoFocus.includes("regional_apac")
      )
        return true

      if (accelGeoFocus.includes("country_specific")) {
        return accelSelectedCountries.includes(smeCountry) || accelSelectedCountries.includes(smeLocation)
      }
      if (accelGeoFocus.includes("province_specific")) {
        return accelSelectedProvinces.includes(smeProvince)
      }
      return false
    }

    const programData = program || acceleratorData?.programmeDetails?.programs?.[0] || {}

    // 1. Funding Stage Match
    const smeStage = smeData.entityOverview?.operationStage
    const accelStage = acceleratorData?.generalMatchingPreference?.programStage
    const stageMatch = normalize(smeStage) === normalize(accelStage)

    breakdown.fundingStage.details = { smeStage, accelStage, smeValue: smeStage, accelValue: accelStage }
    breakdown.fundingStage.matched = stageMatch

    if (stageMatch) {
      breakdown.fundingStage.score = 12.5
      breakdown.fundingStage.description = `Perfect match: Your ${smeStage} stage aligns with their ${accelStage} focus`
      matched++
    } else {
      breakdown.fundingStage.description = `Stage mismatch: You're in ${smeStage || "unspecified"} stage, they focus on ${accelStage || "unspecified"}`
    }

    // 2. Ticket Size Compatibility
    const smeAmountRequested = cleanCurrency(smeData.useOfFunds?.amountRequested)
    const accelMinTicket = cleanCurrency(programData.minimumSupport || 0)
    const accelMaxTicket = cleanCurrency(programData.maximumSupport || 0)
    const ticketMatch = smeAmountRequested >= accelMinTicket && smeAmountRequested <= accelMaxTicket

    breakdown.ticketSize.details = {
      smeAmountRequested,
      accelMinTicket,
      accelMaxTicket,
      smeValue: smeAmountRequested,
      accelValue: `${accelMinTicket}-${accelMaxTicket}`,
    }
    breakdown.ticketSize.matched = ticketMatch

    if (ticketMatch) {
      breakdown.ticketSize.score = 12.5
      breakdown.ticketSize.description = `Perfect fit: Your funding need (${smeAmountRequested}) fits their range (${accelMinTicket}-${accelMaxTicket})`
      matched++
    } else {
      breakdown.ticketSize.description = `Size mismatch: You need ${smeAmountRequested || "unspecified"}, they offer ${accelMinTicket}-${accelMaxTicket}`
    }

    // 3. Geographic Fit
    const smeLocation = cleanString(smeData.entityOverview?.location)
    const accelGeoData = acceleratorData.generalMatchingPreference || {}
    const geoMatch = checkGeographicMatch(smeLocation, accelGeoData)

    breakdown.geographicFit.details = {
      smeLocation,
      accelGeoData,
      smeValue: smeLocation,
      accelValue: accelGeoData.geographicFocus,
    }
    breakdown.geographicFit.matched = geoMatch

    if (geoMatch) {
      breakdown.geographicFit.score = 12.5
      breakdown.geographicFit.description = `Geographic compatibility: Your location (${smeLocation}) fits their focus areas`
      matched++
    } else {
      breakdown.geographicFit.description = `Geographic mismatch: Your location (${smeLocation}) doesn't align with their focus areas`
    }

    // 4. Sector Match
    const smeSectors = smeData.entityOverview?.economicSectors;
    const accelSectors = acceleratorData?.generalMatchingPreference?.sectorFocus;

    const sectorMatch = hasOverlap(smeSectors, accelSectors);

    breakdown.sectorMatch.details = {
      smeSectors: Array.isArray(smeSectors) ? smeSectors : toArray(smeSectors),
      accelSectors: Array.isArray(accelSectors) ? accelSectors : toArray(accelSectors),
      smeValue: normalizeSectors(smeSectors).join(", "),
      accelValue: normalizeSectors(accelSectors).join(", "),
    };
    breakdown.sectorMatch.matched = sectorMatch;

    if (sectorMatch) {
      breakdown.sectorMatch.score = 12.5;
      breakdown.sectorMatch.description =
        `Sector alignment: overlap found (${breakdown.sectorMatch.details.smeValue} ↔ ${breakdown.sectorMatch.details.accelValue})`;
      matched++;
    } else {
      breakdown.sectorMatch.description =
        `Sector mismatch: you have [${breakdown.sectorMatch.details.smeValue || "unspecified"}], they focus on [${breakdown.sectorMatch.details.accelValue || "unspecified"}]`;
    }

    // 5. Instrument Fit
    const smeInstrumentRaw = smeData.useOfFunds?.fundingInstruments;
    const accelInstrumentRaw =
      programData.supportType ||
      acceleratorData?.generalMatchingPreference?.supportFocusSubtype ||
      acceleratorData?.generalMatchingPreference?.supportFocusType;

    const instrumentMatch = hasOverlap(smeInstrumentRaw, accelInstrumentRaw);

    breakdown.instrumentFit.details = {
      smeInstrument: toArray(smeInstrumentRaw),
      accelInstrument: toArray(accelInstrumentRaw),
      smeValue: normalizeList(smeInstrumentRaw).join(", "),
      accelValue: normalizeList(accelInstrumentRaw).join(", "),
    };
    breakdown.instrumentFit.matched = instrumentMatch;

    if (instrumentMatch) {
      breakdown.instrumentFit.score = 12.5;
      breakdown.instrumentFit.description = `Instrument match: overlap found between your instruments and theirs (${breakdown.instrumentFit.details.smeValue} ↔ ${breakdown.instrumentFit.details.accelValue})`;
      matched++;
    } else {
      breakdown.instrumentFit.description = `Instrument mismatch: you have [${breakdown.instrumentFit.details.smeValue || "unspecified"}], they offer [${breakdown.instrumentFit.details.accelValue || "unspecified"}]`;
    }

    // 6. Support Match
    const smeSupportCategory = smeData.useOfFunds?.additionalSupportFocus;
    const smeSupportSubtype = smeData.useOfFunds?.additionalSupportFocusSubtype;

    const accelSupportCategory =
      programData.supportFocusType ||
      acceleratorData?.generalMatchingPreference?.supportFocus;
    const accelSupportSubtype =
      programData.supportFocusSubtype ||
      acceleratorData?.generalMatchingPreference?.supportFocusSubtype;

    let supportMatchScore = 0;
    let supportMatched = false;
    let supportDescription = "";

    if (smeSupportSubtype && accelSupportSubtype && smeSupportSubtype === accelSupportSubtype) {
      supportMatchScore = 12.5;
      supportMatched = true;
      supportDescription = `Perfect support match: Your ${smeSupportSubtype} need aligns with their ${accelSupportSubtype} offering`;
      matched++;
    } else if (smeSupportCategory && accelSupportCategory && smeSupportCategory === accelSupportCategory) {
      supportMatchScore = 6.25;
      supportMatched = true;
      supportDescription = `Partial support match: Your ${smeSupportCategory} category aligns, but subtypes may differ`;
    } else {
      supportDescription = `Support mismatch: You need ${smeSupportCategory || "unspecified"}${smeSupportSubtype ? ` - ${smeSupportSubtype}` : ""}, they offer ${accelSupportCategory || "unspecified"}${accelSupportSubtype ? ` - ${accelSupportSubtype}` : ""}`;
    }

    breakdown.supportMatch.details = {
      smeSupportCategory,
      smeSupportSubtype,
      accelSupportCategory,
      accelSupportSubtype,
      smeValue: smeSupportSubtype ? `${smeSupportCategory} - ${smeSupportSubtype}` : smeSupportCategory,
      accelValue: accelSupportSubtype ? `${accelSupportCategory} - ${accelSupportSubtype}` : accelSupportCategory,
      matchLevel: supportMatchScore === 12.5 ? "subtype" : supportMatchScore === 6.25 ? "category" : "none"
    };
    breakdown.supportMatch.score = supportMatchScore;
    breakdown.supportMatch.matched = supportMatched;
    breakdown.supportMatch.description = supportDescription;

    // 7. Legal Entity Fit
    const smeLegal = smeData.entityOverview?.legalStructure
    const accelLegal = acceleratorData?.generalMatchingPreference?.legalEntityFit
    const legalMatch = normalize(smeLegal) === normalize(accelLegal)

    breakdown.legalEntityFit.details = { smeLegal, accelLegal, smeValue: smeLegal, accelValue: accelLegal }
    breakdown.legalEntityFit.matched = legalMatch

    if (legalMatch) {
      breakdown.legalEntityFit.score = 12.5
      breakdown.legalEntityFit.description = `Legal structure compatibility: Both work with ${smeLegal}`
      matched++
    } else {
      breakdown.legalEntityFit.description = `Legal structure mismatch: You are ${smeLegal || "unspecified"}, they work with ${accelLegal || "unspecified"}`
    }

    // 8. Revenue Threshold
    const smeRevenue = cleanCurrency(smeData.financialOverview?.annualRevenue)
    const accelThreshold = cleanCurrency(programData.minimumSupport || "0")
    const revenueMatch = smeRevenue >= accelThreshold

    breakdown.revenueThreshold.details = {
      smeRevenue,
      accelThreshold,
      smeValue: smeRevenue,
      accelValue: accelThreshold,
    }
    breakdown.revenueThreshold.matched = revenueMatch

    if (revenueMatch) {
      breakdown.revenueThreshold.score = 12.5
      breakdown.revenueThreshold.description = `Revenue meets requirements: Your ${smeRevenue} exceeds their ${accelThreshold} threshold`
      matched++
    } else {
      breakdown.revenueThreshold.description = `Revenue below threshold: Your ${smeRevenue || "unspecified"} is below their ${accelThreshold} requirement`
    }

    return {
      score: Math.round((matched / totalFields) * 100),
      breakdown: breakdown,
    }
  }

  const handleApplyClick = async (accelerator) => {
    const user = auth.currentUser
    if (!user) return

    if (isCompanyMember && !['owner', 'admin'].includes(userRole)) {
      setNotification({
        type: "warning",
        message: "Only company owners and admins can submit applications.",
      })
      return
    }

    const smeUserId = effectiveUserId
    const catalystId = accelerator.originalCatalystId || accelerator.id
    const programIndex = accelerator.programIndex || 0

    try {
      const appId = `${smeUserId}_${catalystId}_${programIndex}`
      const appRef = doc(db, "catalystApplications", appId)
      const appSnap = await getDoc(appRef)

      if (appSnap.exists()) {
        const existingData = appSnap.data()
        setStatuses((prev) => ({ ...prev, [accelerator.id]: "Sent" }))
        setPipelineStages((prev) => ({ ...prev, [accelerator.id]: existingData.pipelineStage || "Applied" }))
        setNotification({ type: "info", message: `You've already applied to ${accelerator.name}` })
        setTimeout(() => setNotification(null), 3000)
        return
      }

      const smeDoc = await getDoc(doc(db, "universalProfiles", smeUserId))
      const smeData = smeDoc.exists() ? smeDoc.data() : {}

      const guarantees = smeData.guarantees || {}
      const bigDoc = await getDoc(doc(db, "bigEvaluations", smeUserId))
      const bigData = bigDoc.exists() ? bigDoc.data() : {}
      const entity = smeData.entityOverview || {}
      const funding = smeData.useOfFunds || {}

      const guaranteeGroups = {
        "Forward Contracts (Revenue Guarantees)": [
          ["signedCustomerContracts", "Signed customer contracts"],
          ["purchaseOrders", "Purchase orders"],
          ["offtakeAgreements", "Offtake agreements"],
          ["subscriptionRevenue", "Subscription revenue"],
        ],
        "Payment of Credit Guarantees": [
          ["letterOfGuarantee", "Letter of guarantee"],
          ["thirdPartyGuarantees", "Third-party guarantees"],
          ["factoringAgreements", "Factoring agreements"],
          ["suretyBonds", "Surety bonds"],
        ],
        "Government or Institutional Support": [
          ["governmentContracts", "Government contracts"],
          ["approvedSupplierStatus", "Approved supplier status"],
          ["incubatorGuarantees", "Incubator guarantees"],
          ["exportCreditGuarantees", "Export credit guarantees"],
        ],
        "Asset-backed Guarantees": [
          ["liensCollateral", "Liens or collateral"],
          ["securedAssets", "Secured assets"],
          ["retentionGuarantees", "Retention guarantees"],
        ],
        "Export Credit or Trade Insurance Cover": [["exportCreditInsurance", "Export credit or trade insurance"]],
        "Factoring or Receivables Finance Agreements": [["receivablesFinancing", "Receivables financing"]],
        "Personal or Third-Party Guarantees": [
          ["personalSurety", "Personal surety"],
          ["corporateGuarantees", "Corporate guarantees"],
        ],
      }

      const guaranteeTitles = Object.entries(guaranteeGroups)
        .filter(([_, items]) => items.some(([key]) => guarantees[key] === "yes"))
        .map(([category]) => category)

      const guaranteeSummary = guaranteeTitles.join(", ")

      // Canonical stageConfig.js name — matches the catalyst side exactly,
      // instead of the old "Application Sent" string which never lined up
      // with the catalyst side's "Applied".
      const pipelineStage = "Applied"
      const nextStage = getNextStageName(pipelineStage)

      const applicationData = {
        catalystId: catalystId,
        programIndex: programIndex,
        smeId: smeUserId,
        submittedBy: user.uid,
        submittedByRole: userRole,
        acceleratorName: accelerator.name,
        location: entity.location || "-",
        sector: (entity.economicSectors || []).join(", ") || "-",
        fundingStage: smeData.applicationOverview?.fundingStage || "-",
        fundingRequired: funding.amountRequested || "-",
        equityOffered: funding.equityType || "",
        guarantees: guaranteeSummary || "-",
        supportRequired: accelerator.supportOffered || "-",
        servicesRequired: accelerator.servicesOffered || "-",
        applicationDate: new Date().toISOString(),
        matchPercentage: accelerator.matchPercentage || 0,
        status: pipelineStage,
        pipelineStage,
        nextStage,
        createdAt: serverTimestamp(),
        bigScore: bigData.scores?.bigScore || 0,
        compliance: bigData.scores?.compliance || 0,
        fundability: bigData.scores?.fundability || 0,
        legitimacy: bigData.scores?.legitimacy || 0,
        leadership: bigData.scores?.leadership || 0,
        smeName: entity.registeredName || "-",
      }

      const catalystApp = { ...applicationData, viewType: "accelerator" }
      const smeApp = { ...applicationData, viewType: "sme" }

      await Promise.all([
        setDoc(doc(db, "catalystApplications", `${catalystId}_${smeUserId}_${programIndex}`), catalystApp),
        setDoc(doc(db, "smeCatalystApplications", appId), smeApp),
      ])

      await sendCatalystEmailNotification(catalystId, smeData, accelerator);

      setStatuses((prev) => ({ ...prev, [accelerator.id]: "Sent" }))
      setPipelineStages((prev) => ({ ...prev, [accelerator.id]: pipelineStage }))
      setNotification({
        type: "success",
        message: `Application sent to ${accelerator.name} and notification email sent!`
      })

      if (onApplicationSubmitted) onApplicationSubmitted()
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error("Failed to submit accelerator application:", error)
      setNotification({ type: "error", message: "Failed to submit application." })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleViewMatchBreakdown = (accelerator) => {
    setSelectedAccelerator(accelerator)
    setShowMatchBreakdown(true)
    setRowMenu(null)
  }

  const handleViewClick = async (accelerator) => {
    try {
      const user = auth.currentUser

      const sharedNDAQuery = query(
        collection(db, "shared_nda"),
        where("catalystId", "==", accelerator.originalCatalystId || accelerator.id),
        where("smeId", "==", user.uid),
        where("programIndex", "==", accelerator.programIndex || 0),
        limit(1)
      )

      const snapshot = await getDocs(sharedNDAQuery)

      let ndaUrl = null
      let ndaStatus = null
      let ndaSharedDate = null

      if (!snapshot.empty) {
        const ndaDoc = snapshot.docs[0]
        const ndaData = ndaDoc.data()
        ndaUrl = ndaData.ndaUrl
        ndaStatus = ndaData.status
        ndaSharedDate = ndaData.sharedAt?.toDate?.() || ndaData.sharedAt
      }

      setSelectedCatalystDetails({ ...accelerator, ndaUrl, ndaStatus, ndaSharedDate })
      setShowCatalystDetails(true)
      setRowMenu(null)
    } catch (error) {
      console.error("Error fetching NDA info:", error)
      setSelectedCatalystDetails(accelerator)
      setShowCatalystDetails(true)
      setRowMenu(null)
    }
  }

  // ─── Views actions (identical model to the catalyst SME table) ──────────
  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]

  useEffect(() => {
    setViewsState((prev) => {
      const current = prev.views[prev.activeViewId]
      if (!current) return prev
      const updated = { ...current, columnVisibility, columnOrder, density }
      const next = { ...prev, views: { ...prev.views, [prev.activeViewId]: updated } }
      persistViewsState(next)
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility, columnOrder, density])

  const switchToView = (viewId) => {
    const target = viewsState.views[viewId]
    if (!target) return
    setViewsState((prev) => {
      const next = { ...prev, activeViewId: viewId }
      persistViewsState(next)
      return next
    })
    setColumnVisibility(target.columnVisibility)
    setColumnOrder(target.columnOrder)
    setDensity(target.density)
  }

  const createNewView = () => {
    const trimmedName = newViewName.trim()
    if (!trimmedName) return
    const id = generateViewId()
    const newView = { id, name: trimmedName, description: newViewDescription.trim(), builtin: false, columnVisibility: { ...columnVisibility }, columnOrder: [...columnOrder], density }
    setViewsState((prev) => {
      const next = { activeViewId: id, views: { ...prev.views, [id]: newView } }
      persistViewsState(next)
      return next
    })
    setNewViewName("")
    setNewViewDescription("")
    setShowNewViewForm(false)
  }

  const startEditingViewMeta = (view) => setEditingViewMeta({ id: view.id, name: view.name, description: view.description, builtin: !!view.builtin })

  const saveViewMeta = () => {
    if (!editingViewMeta) return
    const trimmedName = editingViewMeta.name.trim()
    if (!trimmedName && !editingViewMeta.builtin) return
    setViewsState((prev) => {
      const existing = prev.views[editingViewMeta.id]
      if (!existing) return prev
      const updated = { ...existing, name: existing.builtin ? existing.name : trimmedName, description: editingViewMeta.description.trim() }
      const next = { ...prev, views: { ...prev.views, [editingViewMeta.id]: updated } }
      persistViewsState(next)
      return next
    })
    setEditingViewMeta(null)
  }

  const removeView = (viewId) => {
    if (viewId === BUILTIN_VIEW_ID) return
    const wasActive = viewsState.activeViewId === viewId
    setViewsState((prev) => {
      const { [viewId]: _removed, ...restViews } = prev.views
      const nextActiveId = prev.activeViewId === viewId ? BUILTIN_VIEW_ID : prev.activeViewId
      const next = { activeViewId: nextActiveId, views: restViews }
      persistViewsState(next)
      return next
    })
    if (wasActive) {
      const def = viewsState.views[BUILTIN_VIEW_ID]
      setColumnVisibility(def.columnVisibility)
      setColumnOrder(def.columnOrder)
      setDensity(def.density)
    }
  }

  const resetActiveViewToDefault = () => {
    const layout = createDefaultViewLayout()
    setColumnVisibility(layout.columnVisibility)
    setColumnOrder(layout.columnOrder)
    setDensity(layout.density)
  }

  const toggleColumn = (key) => setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }))

  // ─── Column drag-to-reorder ───────────────────────────────────────────────
  const handleColumnDragStart = (e, key) => {
    setDraggedColumn(key)
    setDragHintRect(null)
    try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", key) } catch {}
  }
  const handleColumnDragOver = (e, key) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (key !== dragOverColumn) setDragOverColumn(key)
  }
  const handleColumnDrop = (e, key) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === key) { setDraggedColumn(null); setDragOverColumn(null); return }
    setColumnOrder((prev) => {
      const next = [...prev]
      const fromIdx = next.indexOf(draggedColumn)
      const toIdx = next.indexOf(key)
      if (fromIdx === -1 || toIdx === -1) return prev
      next.splice(fromIdx, 1)
      next.splice(toIdx, 0, draggedColumn)
      return next
    })
    setDraggedColumn(null)
    setDragOverColumn(null)
  }
  const handleColumnDragEnd = () => { setDraggedColumn(null); setDragOverColumn(null) }

  const openHeaderFilter = (type, event) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    setHeaderFilterOpen((prev) => (prev?.type === type ? null : { type, rect }))
  }
  const closeHeaderFilter = () => setHeaderFilterOpen(null)

  const FilterTrigger = ({ type, active }) => (
    <button
      type="button"
      onClick={(e) => openHeaderFilter(type, e)}
      className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${active ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"}`}
      title="Filter this column"
    >
      <SlidersHorizontal size={11} />
    </button>
  )

  const openRowMenu = (accelerator, event) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    const menuWidth = 210
    let x = rect.right - menuWidth
    let y = rect.bottom + 6
    if (x < 12) x = 12
    if (y + 200 > window.innerHeight - 12) y = rect.top - 200 - 6
    setRowMenu({ accelerator, position: { x, y } })
  }

  // ─── Derived options + filtering ─────────────────────────────────────────
  const uniqueGeographic = useMemo(() => [...new Set(accelerators.map((a) => a.geographicFocus).filter((v) => v && v !== "-"))], [accelerators])
  const uniqueSectors = useMemo(() => [...new Set(accelerators.map((a) => a.sectorFocus).filter((v) => v && v !== "-"))], [accelerators])
  const uniqueFundingStages = useMemo(() => [...new Set(accelerators.map((a) => a.fundingStage).filter((v) => v && v !== "-"))], [accelerators])
  const uniqueFundingTypes = useMemo(() => [...new Set(accelerators.map((a) => a.fundingType).filter((v) => v && v !== "-"))], [accelerators])
  const uniqueSupport = useMemo(() => [...new Set(accelerators.map((a) => a.supportOffered).filter((v) => v && v !== "-"))], [accelerators])
  // Canonical BIG-default names plus whatever custom/renamed stage names
  // actually show up in the real data (e.g. a catalyst's "Committee" for a
  // Grant programme) — otherwise those couldn't be filtered by at all, even
  // though they already display correctly as the status/next-stage text.
  const statusOptions = useMemo(() => {
    const canonical = DEFAULT_STAGES.map((s) => s.name)
    const dynamicStatuses = accelerators.map((a) => pipelineStages[a.id] || a.pipelineStage).filter(Boolean)
    const dynamicNextStages = accelerators.map((a) => a.nextStage).filter(Boolean)
    return [...new Set([...canonical, ...dynamicStatuses, ...dynamicNextStages])]
  }, [accelerators, pipelineStages])

  const activeFilterCount = (localFilters.name.trim() ? 1 : 0)
    + (localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100 ? 1 : 0)
    + localFilters.geographicFocus.length + localFilters.sectorFocus.length + localFilters.fundingStage.length
    + localFilters.fundingType.length + localFilters.supportOffered.length + localFilters.status.length + localFilters.nextStage.length
    + (localFilters.ticketSize.trim() ? 1 : 0) + (localFilters.servicesOffered.trim() ? 1 : 0)
    + (localFilters.deadline.trim() ? 1 : 0) + (localFilters.speed.trim() ? 1 : 0)

  const filteredAccelerators = useMemo(() => accelerators.filter((accelerator) => {
    if (hasTooManyMissingFields(accelerator)) return false

    // Stage filter driven by clicking a card in SupportProgramsPage.jsx's
    // Dealflow Pipeline (passed down as the stageFilter prop through
    // AcceleratorTabbedTables). "Matched" here means "hasn't applied yet" —
    // there's no application record to read a status off of, so that case
    // is checked separately from the normal status lookup below.
    if (stageFilter) {
      const applied = hasApplication(accelerator.id)
      if (stageFilter === "matched") {
        if (applied) return false
      } else {
        if (!applied) return false
        const currentStatusForStage = pipelineStages[accelerator.id] || accelerator.pipelineStage
        const resolvedStageId = mapStatusToStageId(normalizeStatus(currentStatusForStage), DEFAULT_STAGES)
        if (resolvedStageId !== stageFilter) return false
      }
    }

    if (localFilters.name.trim() && !accelerator.name.toLowerCase().includes(localFilters.name.toLowerCase().trim())) return false
    if (accelerator.matchPercentage < localFilters.matchRange[0] || accelerator.matchPercentage > localFilters.matchRange[1]) return false

    if (localFilters.geographicFocus.length > 0 && !localFilters.geographicFocus.some((v) => formatLabel(accelerator.geographicFocus).toLowerCase().includes(v.toLowerCase()))) return false
    if (localFilters.sectorFocus.length > 0 && !localFilters.sectorFocus.some((v) => formatLabel(accelerator.sectorFocus).toLowerCase().includes(v.toLowerCase()))) return false
    if (localFilters.fundingStage.length > 0 && !localFilters.fundingStage.some((v) => formatLabel(accelerator.fundingStage).toLowerCase().includes(v.toLowerCase()))) return false
    if (localFilters.fundingType.length > 0 && !localFilters.fundingType.some((v) => formatLabel(accelerator.fundingType).toLowerCase().includes(v.toLowerCase()))) return false
    if (localFilters.supportOffered.length > 0 && !localFilters.supportOffered.some((v) => formatLabel(accelerator.supportOffered).toLowerCase().includes(v.toLowerCase()))) return false

    const currentStatus = pipelineStages[accelerator.id] || accelerator.pipelineStage
    if (localFilters.status.length > 0 && !localFilters.status.some((v) => (currentStatus || "").toLowerCase().includes(v.toLowerCase()))) return false
    if (localFilters.nextStage.length > 0 && !localFilters.nextStage.some((v) => (accelerator.nextStage || "").toLowerCase().includes(v.toLowerCase()))) return false

    if (localFilters.ticketSize.trim() && !(accelerator.ticketSize || "").toLowerCase().includes(localFilters.ticketSize.toLowerCase().trim())) return false
    if (localFilters.servicesOffered.trim() && !formatLabel(accelerator.servicesOffered).toLowerCase().includes(localFilters.servicesOffered.toLowerCase().trim())) return false
    if (localFilters.deadline.trim() && !(accelerator.deadline || "").toLowerCase().includes(localFilters.deadline.toLowerCase().trim())) return false
    if (localFilters.speed.trim() && !(accelerator.speed || "").toString().toLowerCase().includes(localFilters.speed.toLowerCase().trim())) return false

    return true
  }), [accelerators, localFilters, pipelineStages, stageFilter])


  const densityStyles = {
    comfortable: { cell: "py-3 px-3", header: "py-3 px-3", fontSize: "text-sm" },
    compact: { cell: "py-2 px-2", header: "py-2 px-2", fontSize: "text-xs" },
    "ultra-compact": { cell: "py-1.5 px-1.5", header: "py-1.5 px-1.5", fontSize: "text-xs" },
  }
  const ds = densityStyles[density] || densityStyles.comfortable

  const visibleColumnKeys = columnOrder.filter((key) => columnVisibility[key])

  const getFilterActive = (filterType) => {
    switch (filterType) {
      case "match": return localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100
      case "geographicFocus": return localFilters.geographicFocus.length > 0
      case "sectorFocus": return localFilters.sectorFocus.length > 0
      case "fundingStage": return localFilters.fundingStage.length > 0
      case "fundingType": return localFilters.fundingType.length > 0
      case "supportOffered": return localFilters.supportOffered.length > 0
      case "status": return localFilters.status.length > 0
      case "nextStage": return localFilters.nextStage.length > 0
      case "ticketSize": return !!localFilters.ticketSize.trim()
      case "servicesOffered": return !!localFilters.servicesOffered.trim()
      case "deadline": return !!localFilters.deadline.trim()
      case "speed": return !!localFilters.speed.trim()
      default: return false
    }
  }

  const renderCell = (key, accelerator) => {
    switch (key) {
      case "match":
        return (
          <td key={key} className={`${ds.cell} text-center border-r border-[#e6d7c3] cursor-pointer`} onClick={() => handleViewMatchBreakdown(accelerator)}>
            <div className="flex flex-col items-center gap-1 w-full max-w-[90px] mx-auto">
              <div className="flex items-center gap-1">
                <span className={`${ds.fontSize} font-semibold text-[#4a352f]`}>{accelerator.matchPercentage}%</span>
                <Eye size={12} className="text-[#a67c52]" />
              </div>
              <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#48BB78] to-[#68d391]" style={{ width: `${accelerator.matchPercentage}%` }} />
              </div>
            </div>
          </td>
        )
      case "geographicFocus":
        return <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}><TruncatedText text={formatLabel(accelerator.geographicFocus)} maxLength={30} /></td>
      case "sectorFocus":
        return <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}><TruncatedText text={formatLabel(accelerator.sectorFocus)} maxLength={25} /></td>
      case "fundingStage":
        return <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}><TruncatedText text={formatLabel(accelerator.fundingStage)} maxLength={25} /></td>
      case "fundingType":
        return <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}><TruncatedText text={formatLabel(accelerator.fundingType)} maxLength={20} /></td>
      case "ticketSize":
        return <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>{accelerator.ticketSize}</td>
      case "supportOffered":
        return <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}><TruncatedText text={formatLabel(accelerator.supportOffered)} maxLength={35} /></td>
      case "servicesOffered":
        return <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}><TruncatedText text={formatLabel(accelerator.servicesOffered)} maxLength={30} /></td>
      case "deadline":
        return <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>{accelerator.deadline || "-"}</td>
      case "speed":
        return <td key={key} className={`${ds.cell} border-r border-[#e6d7c3]`}><span className="inline-block px-2 py-1 bg-[#f5f0e1] rounded-full text-xs font-medium text-[#4a352f]">{accelerator.speed}</span></td>
      case "status": {
        const currentStatus = pipelineStages[accelerator.id] || accelerator.pipelineStage
        const meta = getStatusMeta(currentStatus)
        return (
          <td key={key} className={`${ds.cell} border-r border-[#e6d7c3]`}>
            {hasApplication(accelerator.id) ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: meta.colors.bgColor, color: meta.colors.color }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.colors.color }} />
                {meta.label}
              </span>
            ) : (
              <span className="text-xs text-[#a89482] italic">Not applied</span>
            )}
          </td>
        )
      }
      case "nextStage":
        return (
          <td key={key} className={`${ds.cell} border-r border-[#e6d7c3]`}>
            <span className="text-xs font-medium text-[#4a352f]">{hasApplication(accelerator.id) ? accelerator.nextStage : "—"}</span>
          </td>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 text-[#a67c52]">
        <p>Loading accelerators...</p>
      </div>
    )
  }

  return (
    <>
      <div className="relative" style={{ filter: showCatalystDetails || showMatchBreakdown ? "blur(2px)" : "none", transition: "filter 0.2s ease" }}>

        {isCompanyMember && (
          <div className="rounded-xl mb-6 p-4 shadow-md" style={{ backgroundColor: userRole === "viewer" ? "#fef3c7" : "#e0f2fe", border: `2px solid ${userRole === "viewer" ? "#f59e0b" : "#0369a1"}` }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🤝</span>
              <h3 className="m-0 font-bold text-lg" style={{ color: userRole === "viewer" ? "#f59e0b" : "#0369a1" }}>
                Company Catalyst Applications - Role: {userRole?.toUpperCase()}
              </h3>
            </div>
            <p className="m-0 text-sm leading-relaxed text-[#4a5568]">
              {userRole === "owner" && "You can view and manage all company catalyst applications."}
              {userRole === "admin" && "You can view and submit catalyst applications for the company."}
              {userRole === "manager" && "You can view catalyst applications and track their progress."}
              {userRole === "employee" && "You can view company catalyst applications."}
              {userRole === "viewer" && "You have read-only access to company catalyst applications."}
            </p>
          </div>
        )}

        {notification && (
          <div className="fixed top-4 right-4 p-4 rounded-lg text-white font-medium z-[1001]" style={{ background: notification.type === "success" ? "#48BB78" : notification.type === "error" ? "#F56565" : "#4299E1" }}>
            {notification.message}
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-[#faf7f2] rounded-t-2xl p-4 border border-[#e6d7c3] border-b-0 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
                <LayoutGrid size={12} className="text-[#7d5a50] flex-shrink-0" />
                Viewing: {activeView.name}
                {activeView.description && <span className="font-normal text-[#a89482]"> — {activeView.description}</span>}
              </span>
              {activeFilterCount > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#fff3e0] text-[#e65100] border border-[#e65100]/30">
                  <SlidersHorizontal size={12} /> {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                </span>
              )}
            </div>
            <div className="relative">
              <button
                onClick={(e) => {
                  if (showCustomizeMenu) { setShowCustomizeMenu(false); setCustomizeMenuRect(null) }
                  else { setCustomizeMenuRect(e.currentTarget.getBoundingClientRect()); setShowCustomizeMenu(true); setShowNewViewForm(false); setEditingViewMeta(null) }
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm"
              >
                <SlidersHorizontal size={16} /> Customize Table <ChevronDown size={14} className={`transition-transform ${showCustomizeMenu ? "rotate-180" : ""}`} />
              </button>
              {showCustomizeMenu && customizeMenuRect && (() => {
                const panelWidth = 320
                const margin = 12
                let left = customizeMenuRect.right - panelWidth
                left = Math.min(Math.max(left, margin), window.innerWidth - panelWidth - margin)
                const spaceBelow = window.innerHeight - customizeMenuRect.bottom - margin - 8
                const spaceAbove = customizeMenuRect.top - margin - 8
                const openUpward = spaceBelow < 320 && spaceAbove > spaceBelow
                const maxHeight = Math.max(200, Math.min(620, openUpward ? spaceAbove : spaceBelow))
                const top = openUpward ? undefined : customizeMenuRect.bottom + 8
                const bottom = openUpward ? window.innerHeight - customizeMenuRect.top + 8 : undefined
                const allViews = Object.values(viewsState.views).sort((a, b) => (a.builtin ? -1 : b.builtin ? 1 : a.name.localeCompare(b.name)))
                return (
                  <PopupPortal>
                    <div className="fixed inset-0 z-40" onClick={() => { setShowCustomizeMenu(false); setCustomizeMenuRect(null); setShowNewViewForm(false); setEditingViewMeta(null) }} />
                    <div className="fixed bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-5 z-50 overflow-y-auto" style={{ left, width: panelWidth, top, bottom, maxHeight }}>
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-1">Views</h4>
                      <p className="text-xs text-[#a89482] mb-3">Edits below auto-save into whichever view is selected.</p>
                      <div className="space-y-1 mb-3">
                        {allViews.map((view) => {
                          const isActive = view.id === viewsState.activeViewId
                          const isEditing = editingViewMeta?.id === view.id
                          if (isEditing) {
                            return (
                              <div key={view.id} className="p-2.5 rounded-lg border border-[#c8b6a6] bg-[#faf7f2] space-y-2">
                                {!view.builtin ? (
                                  <input autoFocus value={editingViewMeta.name} onChange={(e) => setEditingViewMeta((prev) => ({ ...prev, name: e.target.value }))} placeholder="View name" className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm" />
                                ) : (
                                  <p className="text-sm font-semibold text-[#4a352f]">Default <span className="font-normal text-[#a89482] text-xs">(name can't be changed)</span></p>
                                )}
                                <textarea value={editingViewMeta.description} onChange={(e) => setEditingViewMeta((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description (optional) — what is this view for?" rows={2} className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none" />
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setEditingViewMeta(null)} className="px-2.5 py-1 text-xs text-[#7d5a50] hover:text-[#4a352f]">Cancel</button>
                                  <button onClick={saveViewMeta} className="px-2.5 py-1 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold">Save</button>
                                </div>
                              </div>
                            )
                          }
                          return (
                            <div key={view.id} className={`flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg ${isActive ? "bg-[#f5f0e1]" : "hover:bg-[#faf7f2]"}`}>
                              <button onClick={() => switchToView(view.id)} className="flex-1 text-left min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {isActive && <CheckCircle size={12} className="text-[#7d5a50] flex-shrink-0" />}
                                  <span className={`text-sm ${isActive ? "font-semibold text-[#4a352f]" : "text-[#4a352f]"}`}>{view.name}</span>
                                  {view.builtin && <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Built-in</span>}
                                </div>
                                {view.description && <p className="text-xs text-[#a89482] mt-0.5 truncate">{view.description}</p>}
                              </button>
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <button onClick={() => startEditingViewMeta(view)} title="Rename / edit description" className="text-[#a89482] hover:text-[#7d5a50] p-1"><Settings size={13} /></button>
                                {!view.builtin && <button onClick={() => removeView(view.id)} title="Delete view" className="text-[#a89482] hover:text-red-500 p-1"><Trash2 size={13} /></button>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {showNewViewForm ? (
                        <div className="space-y-2 mb-1">
                          <input autoFocus value={newViewName} onChange={(e) => setNewViewName(e.target.value)} placeholder="New view name..." className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm" />
                          <textarea value={newViewDescription} onChange={(e) => setNewViewDescription(e.target.value)} placeholder="Description (optional) — what is this view for?" rows={2} className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none" />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setShowNewViewForm(false); setNewViewName(""); setNewViewDescription("") }} className="px-2.5 py-1 text-xs text-[#7d5a50] hover:text-[#4a352f]">Cancel</button>
                            <button onClick={createNewView} disabled={!newViewName.trim()} className="px-3 py-1.5 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold disabled:opacity-40">Create view</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setShowNewViewForm(true)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-[#c8b6a6] rounded-lg text-xs font-semibold text-[#7d5a50] hover:bg-[#faf7f2]">
                          <Plus size={13} /> New view from current layout
                        </button>
                      )}

                      <div className="border-t border-[#e6d7c3] my-4" />
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Hide/Unhide</h4>
                      <p className="text-xs text-[#a89482] mb-3 flex items-center gap-1.5">
                        <GripVertical size={12} className="flex-shrink-0" /> Tip: drag any column header in the table to reorder it.
                      </p>
                      <label className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                        <input type="checkbox" checked={true} disabled={true} className="rounded border-[#c8b6a6]" />
                        <span className="text-sm text-[#4a352f]">Catalyst Name</span>
                      </label>
                      <div className="border-t border-[#e6d7c3] my-2" />
                      {DEFAULT_COLUMN_ORDER.map((key) => (
                        <label key={key} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-[#faf7f2] cursor-pointer">
                          <input type="checkbox" checked={columnVisibility[key] || false} onChange={() => toggleColumn(key)} className="rounded border-[#c8b6a6] text-[#7d5a50]" />
                          <span className="text-sm text-[#4a352f]">{COLUMN_DEFS[key].label}</span>
                        </label>
                      ))}

                      <div className="border-t border-[#e6d7c3] my-4" />
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Density</h4>
                      <div className="flex gap-1.5">
                        {[{ key: "comfortable", label: "Comfortable" }, { key: "compact", label: "Compact" }, { key: "ultra-compact", label: "Ultra Compact" }].map((d) => (
                          <button key={d.key} onClick={() => setDensity(d.key)} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${density === d.key ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>
                            {d.label}
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-[#e6d7c3] my-4" />
                      <button onClick={resetActiveViewToDefault} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#a67c52] hover:text-[#4a352f] hover:bg-[#faf7f2] border border-[#e6d7c3]">
                        <RotateCcw size={12} /> Reset "{activeView.name}" to factory defaults
                      </button>
                    </div>
                  </PopupPortal>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-lg overflow-hidden">
          <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
            <style>{`
              .at-th { color: #faf7f2 !important; vertical-align: top !important; }
              .at-th-draggable { cursor: grab; }
              .at-th-draggable:active { cursor: grabbing; }
              .at-th-label { flex: 1 1 auto; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; overflow-wrap: break-word; line-height: 1.2; }
            `}</style>
            <table className="border-collapse text-sm" style={{ tableLayout: "auto" }}>
              <thead>
                <tr className="bg-[#4a352f]">
                  <th className="at-th py-3 px-3 text-left font-semibold uppercase tracking-wider text-xs border-r border-[#e6d7c3] sticky top-0 left-0 z-30" style={{ backgroundColor: "#4a352f", minWidth: "180px", maxWidth: "200px" }}>
                    <div className="flex items-start gap-1 min-w-0">
                      <span className="at-th-label">Catalyst Name</span>
                      <FilterTrigger type="name" active={!!localFilters.name.trim()} />
                    </div>
                  </th>

                  {visibleColumnKeys.map((key) => {
                    const col = COLUMN_DEFS[key]
                    const isDragging = draggedColumn === key
                    const isDragOver = dragOverColumn === key && draggedColumn !== key
                    return (
                      <th
                        key={key}
                        draggable
                        onDragStart={(e) => handleColumnDragStart(e, key)}
                        onDragOver={(e) => handleColumnDragOver(e, key)}
                        onDrop={(e) => handleColumnDrop(e, key)}
                        onDragEnd={handleColumnDragEnd}
                        onMouseEnter={(e) => setDragHintRect(e.currentTarget.getBoundingClientRect())}
                        onMouseLeave={() => setDragHintRect(null)}
                        className={`at-th at-th-draggable py-3 px-3 font-semibold uppercase tracking-wider text-xs border-r border-[#e6d7c3] sticky top-0 z-20 select-none transition-opacity ${col.align === "center" ? "text-center" : "text-left"} ${isDragging ? "opacity-40" : ""}`}
                        style={{ minWidth: col.minWidth, backgroundColor: isDragOver ? "#5a423b" : "#4a352f" }}
                      >
                        <div className={`flex items-start gap-1 min-w-0 ${col.align === "center" ? "justify-center" : ""}`}>
                          <GripVertical size={11} className="opacity-40 flex-shrink-0 mt-0.5" />
                          <span className="at-th-label">{col.label}</span>
                          <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} />
                        </div>
                      </th>
                    )
                  })}

                  <th className="at-th py-3 px-3 text-center font-semibold uppercase tracking-wider text-xs sticky top-0 z-20" style={{ backgroundColor: "#4a352f", minWidth: "150px" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAccelerators.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnKeys.length + 2} className="text-center py-16">
                      <span className="text-[#999] text-sm">
                        {accelerators.length === 0
                          ? "No catalyst data available"
                          : "No catalysts match the selected filters."}
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredAccelerators.map((accelerator) => {
                    const rowKey = accelerator.id
                    const applied = hasApplication(accelerator.id)
                    return (
                      <tr key={rowKey} className="border-b border-[#f0e6d9]" style={{ backgroundColor: hoveredRowKey === rowKey ? "#fdf8f4" : undefined }} onMouseEnter={() => setHoveredRowKey(rowKey)} onMouseLeave={() => setHoveredRowKey(null)}>
                        <td className={`${ds.cell} ${ds.fontSize} sticky left-0 border-r border-[#e6d7c3] z-10`} style={{ minWidth: "180px", maxWidth: "200px", backgroundColor: hoveredRowKey === rowKey ? "#fdf8f4" : "#ffffff" }}>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-[#4a352f] break-words">{accelerator.name}</span>
                            <button
                              onClick={() => handleViewClick(accelerator)}
                              className="text-[#a89482] hover:text-[#7d5a50] transition-colors flex-shrink-0"
                              aria-label={`View details for ${accelerator.name}`}
                              title="View catalyst details"
                            >
                              <Eye size={13} />
                            </button>
                          </div>
                        </td>

                        {visibleColumnKeys.map((key) => renderCell(key, accelerator))}

                        <td className={`${ds.cell} text-center`} style={{ minWidth: "150px" }}>
                          <div className="flex items-center justify-center gap-1.5">
                            {applied ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#e8f5e9] text-[#2e7d32] whitespace-nowrap">
                                <Check size={13} /> Applied
                              </span>
                            ) : (
                              <button onClick={() => handleApplyClick(accelerator)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#5D2A0A] hover:brightness-105 transition-all whitespace-nowrap">
                                Apply
                              </button>
                            )}
                            <button onClick={(e) => openRowMenu(accelerator, e)} className="p-2 rounded-lg border border-[#c8b6a6] text-[#7d5a50] hover:bg-[#f5f0e1] transition-all" aria-label="More actions">
                              <MoreVertical size={14} />
                            </button>
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

        {filteredAccelerators.length === 0 && !loading && accelerators.length === 0 && (
          <div className="flex justify-center items-center p-8 text-[#a67c52] mt-4">
            <p className="text-center text-sm">
              You have not applied for any catalysts, so there are no matches available. You need to apply first.
            </p>
          </div>
        )}
      </div>

      {/* ─── Drag-to-reorder hint tooltip ──────────────────────────────────── */}
      {dragHintRect && !draggedColumn && (
        <PopupPortal>
          <div className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal flex items-center gap-1.5" style={{ top: dragHintRect.bottom + 8, left: Math.min(Math.max(dragHintRect.left, 12), window.innerWidth - 200), width: "190px" }}>
            <GripVertical size={12} className="flex-shrink-0" /> Drag to reorder columns
          </div>
        </PopupPortal>
      )}

      {/* ─── Row quick-actions menu ─────────────────────────────────────────── */}
      {rowMenu && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1090]" onClick={() => setRowMenu(null)} />
          <div className="fixed z-[1100] bg-white rounded-xl shadow-2xl border border-[#e6d7c3] py-1" style={{ top: rowMenu.position.y, left: rowMenu.position.x, width: "200px" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#e6d7c3]">
              <span className="text-xs font-semibold text-[#4a352f]">Quick Actions</span>
              <button onClick={() => setRowMenu(null)} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={14} /></button>
            </div>
            <button onClick={() => handleViewClick(rowMenu.accelerator)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Eye size={12} /> View Catalyst Details</button>
            <button onClick={() => handleViewMatchBreakdown(rowMenu.accelerator)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><SlidersHorizontal size={12} /> Why This Match?</button>
          </div>
        </PopupPortal>
      )}

      {/* ─── Column header filter popover ──────────────────────────────────── */}
      {headerFilterOpen && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1090]" onClick={closeHeaderFilter} />
          <div className="fixed z-[1091] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-4" style={{ top: headerFilterOpen.rect.bottom + 8, left: Math.min(Math.max(headerFilterOpen.rect.left - 20, 12), window.innerWidth - 312), width: "300px", maxHeight: "70vh", overflowY: "auto" }}>
            {headerFilterOpen.type === "name" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Catalyst name</label>
                  {localFilters.name && <button onClick={() => setLocalFilters((p) => ({ ...p, name: "" }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <input autoFocus type="text" value={localFilters.name} onChange={(e) => setLocalFilters((p) => ({ ...p, name: e.target.value }))} placeholder="Search catalyst name..." className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20" />
              </>
            )}

            {headerFilterOpen.type === "match" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Match %: {localFilters.matchRange[0]} - {localFilters.matchRange[1]}</label>
                  {(localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100) && <button onClick={() => setLocalFilters((p) => ({ ...p, matchRange: [0, 100] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <input type="number" min="0" max="100" value={localFilters.matchRange[0]} onChange={(e) => setLocalFilters((p) => ({ ...p, matchRange: [Math.min(parseInt(e.target.value) || 0, p.matchRange[1]), p.matchRange[1]] }))} className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                  <span className="text-[#7d5a50]">to</span>
                  <input type="number" min="0" max="100" value={localFilters.matchRange[1]} onChange={(e) => setLocalFilters((p) => ({ ...p, matchRange: [p.matchRange[0], Math.max(parseInt(e.target.value) || 0, p.matchRange[0])] }))} className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                </div>
                <input type="range" min="0" max="100" value={localFilters.matchRange[0]} onChange={(e) => setLocalFilters((p) => ({ ...p, matchRange: [parseInt(e.target.value), p.matchRange[1]] }))} className="w-full accent-[#7d5a50]" />
              </>
            )}

            {headerFilterOpen.type === "geographicFocus" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Geographic Focus</label>
                  {localFilters.geographicFocus.length > 0 && <button onClick={() => setLocalFilters((p) => ({ ...p, geographicFocus: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {geographicFocusOptions.map((opt) => (
                    <button key={opt.value} onClick={() => setLocalFilters((p) => ({ ...p, geographicFocus: p.geographicFocus.includes(opt.label) ? p.geographicFocus.filter((x) => x !== opt.label) : [...p.geographicFocus, opt.label] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.geographicFocus.includes(opt.label) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>{opt.label}</button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === "sectorFocus" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Sector Focus</label>
                  {localFilters.sectorFocus.length > 0 && <button onClick={() => setLocalFilters((p) => ({ ...p, sectorFocus: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto">
                  {(uniqueSectors.length > 0 ? uniqueSectors.map(formatLabel) : sectorFocusOptions.map((o) => o.label)).map((label) => (
                    <button key={label} onClick={() => setLocalFilters((p) => ({ ...p, sectorFocus: p.sectorFocus.includes(label) ? p.sectorFocus.filter((x) => x !== label) : [...p.sectorFocus, label] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.sectorFocus.includes(label) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>{label}</button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === "fundingStage" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Funding Stage</label>
                  {localFilters.fundingStage.length > 0 && <button onClick={() => setLocalFilters((p) => ({ ...p, fundingStage: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {fundingStageOptions.map((opt) => (
                    <button key={opt.value} onClick={() => setLocalFilters((p) => ({ ...p, fundingStage: p.fundingStage.includes(opt.label) ? p.fundingStage.filter((x) => x !== opt.label) : [...p.fundingStage, opt.label] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.fundingStage.includes(opt.label) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>{opt.label}</button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === "fundingType" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Funding Type</label>
                  {localFilters.fundingType.length > 0 && <button onClick={() => setLocalFilters((p) => ({ ...p, fundingType: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto">
                  {uniqueFundingTypes.length === 0 && <span className="text-xs text-[#a89482]">No funding type data available</span>}
                  {uniqueFundingTypes.map(formatLabel).map((label) => (
                    <button key={label} onClick={() => setLocalFilters((p) => ({ ...p, fundingType: p.fundingType.includes(label) ? p.fundingType.filter((x) => x !== label) : [...p.fundingType, label] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.fundingType.includes(label) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>{label}</button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === "ticketSize" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Ticket Size</label>
                  {localFilters.ticketSize && <button onClick={() => setLocalFilters((p) => ({ ...p, ticketSize: "" }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <input autoFocus type="text" value={localFilters.ticketSize} onChange={(e) => setLocalFilters((p) => ({ ...p, ticketSize: e.target.value }))} placeholder="Search ticket size..." className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20" />
              </>
            )}

            {headerFilterOpen.type === "supportOffered" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Support Offered</label>
                  {localFilters.supportOffered.length > 0 && <button onClick={() => setLocalFilters((p) => ({ ...p, supportOffered: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {supportOfferedOptions.map((opt) => (
                    <button key={opt.value} onClick={() => setLocalFilters((p) => ({ ...p, supportOffered: p.supportOffered.includes(opt.label) ? p.supportOffered.filter((x) => x !== opt.label) : [...p.supportOffered, opt.label] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.supportOffered.includes(opt.label) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>{opt.label}</button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === "servicesOffered" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Services Offered</label>
                  {localFilters.servicesOffered && <button onClick={() => setLocalFilters((p) => ({ ...p, servicesOffered: "" }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <input autoFocus type="text" value={localFilters.servicesOffered} onChange={(e) => setLocalFilters((p) => ({ ...p, servicesOffered: e.target.value }))} placeholder="Search services offered..." className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20" />
              </>
            )}

            {headerFilterOpen.type === "deadline" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Deadline</label>
                  {localFilters.deadline && <button onClick={() => setLocalFilters((p) => ({ ...p, deadline: "" }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <input autoFocus type="text" value={localFilters.deadline} onChange={(e) => setLocalFilters((p) => ({ ...p, deadline: e.target.value }))} placeholder="Search deadline..." className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20" />
              </>
            )}

            {headerFilterOpen.type === "speed" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Speed (Days)</label>
                  {localFilters.speed && <button onClick={() => setLocalFilters((p) => ({ ...p, speed: "" }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <input autoFocus type="text" value={localFilters.speed} onChange={(e) => setLocalFilters((p) => ({ ...p, speed: e.target.value }))} placeholder="Search response time..." className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20" />
              </>
            )}

            {headerFilterOpen.type === "status" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Status</label>
                  {localFilters.status.length > 0 && <button onClick={() => setLocalFilters((p) => ({ ...p, status: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {statusOptions.map((s) => (
                    <button key={s} onClick={() => setLocalFilters((p) => ({ ...p, status: p.status.includes(s) ? p.status.filter((x) => x !== s) : [...p.status, s] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.status.includes(s) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>{s}</button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === "nextStage" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Next Stage</label>
                  {localFilters.nextStage.length > 0 && <button onClick={() => setLocalFilters((p) => ({ ...p, nextStage: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {statusOptions.map((s) => (
                    <button key={s} onClick={() => setLocalFilters((p) => ({ ...p, nextStage: p.nextStage.includes(s) ? p.nextStage.filter((x) => x !== s) : [...p.nextStage, s] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.nextStage.includes(s) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>{s}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </PopupPortal>
      )}

      {/* ─── Match Breakdown Modal ──────────────────────────────────────────── */}
      {mounted && showMatchBreakdown && selectedAccelerator && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-2xl max-w-[800px] w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#e6d7c3] bg-[#faf7f2]">
              <h3 className="text-lg font-semibold text-[#4a352f] m-0">Match Breakdown — {selectedAccelerator?.name || "Accelerator"}</h3>
              <button onClick={() => { setShowMatchBreakdown(false); setSelectedAccelerator(null) }} className="text-[#7d5a50] hover:text-[#4a352f] text-xl">✖</button>
            </div>
            <div className="p-6">
              <div className="text-center mb-8 pb-4 border-b-2 border-[#e6d7c3]">
                <div className="text-5xl font-bold mb-2" style={{ color: selectedAccelerator?.matchPercentage >= 80 ? "#388E3C" : selectedAccelerator?.matchPercentage >= 60 ? "#F57C00" : "#D32F2F" }}>
                  {selectedAccelerator?.matchPercentage || 0}%
                </div>
                <p className="text-[#8D6E63] m-0">Overall Match Score</p>
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))" }}>
                {selectedAccelerator?.matchBreakdown && Object.entries(selectedAccelerator.matchBreakdown).map(([key, breakdown]) => {
                  if (!breakdown || typeof breakdown !== "object") return null
                  const scoreColor = breakdown.matched ? "#388E3C" : "#D32F2F"
                  const titles = {
                    fundingStage: "Funding Stage Match", ticketSize: "Ticket Size Compatibility", geographicFit: "Geographic Fit",
                    sectorMatch: "Sector Match", instrumentFit: "Instrument Fit", supportMatch: "Support Match",
                    legalEntityFit: "Legal Entity Fit", revenueThreshold: "Revenue Threshold",
                  }
                  return (
                    <div key={key} className="bg-[#FEFCFA] border border-[#E8D5C4] rounded-lg p-5" style={{ borderLeft: `4px solid ${scoreColor}` }}>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm font-semibold text-[#5D2A0A] m-0 flex-1">{titles[key] || formatLabel(key)}</h4>
                        <span className="text-xs font-semibold ml-2" style={{ color: scoreColor }}>{breakdown.matched ? "✓ Match" : "✗ No Match"}</span>
                      </div>
                      <div className="text-xs text-[#666] leading-relaxed">
                        <div className="mb-1.5"><strong>Your Need:</strong> {breakdown.details?.smeValue || breakdown.description || "N/A"}</div>
                        <div><strong>Accelerator Offers:</strong> {breakdown.details?.accelValue || breakdown.details?.acceleratorValue || "N/A"}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 p-6 border-t border-[#e6d7c3]">
              <button onClick={() => { setShowMatchBreakdown(false); setSelectedAccelerator(null) }} className="px-4 py-2 bg-[#F5EBE0] text-[#5D2A0A] rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {mounted && showCatalystDetails && selectedCatalystDetails && (
        <CatalystDetailsModal
          catalyst={selectedCatalystDetails}
          isOpen={showCatalystDetails}
          onClose={() => { setShowCatalystDetails(false); setSelectedCatalystDetails(null) }}
        />
      )}
    </>
  )
}