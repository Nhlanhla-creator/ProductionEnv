import { useState, useEffect } from "react"
import { BarChart3, MapPin, Calendar, Filter, X, Eye } from "lucide-react"
import { db, auth, storage } from "../../firebaseConfig"
import { serverTimestamp, doc, updateDoc, getDoc, addDoc, collection, query, where, getDocs } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { usePortfolio } from "../../context/PortfolioContext"
import SMEDetailsModal from "./SMEDetailsModal"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatLabel = (value) => {
  if (!value) return ""
  return value.toString().split(",").map((item) => item.trim()).map((word) => {
    if (word.toLowerCase() === "ict") return "ICT"
    if (word.toLowerCase() === "southafrica" || word.toLowerCase() === "south_africa") return "South Africa"
    return word.split(/[_\s-]+/).map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ")
  }).join(", ")
}

const getScoreColor = (score) => {
  if (score >= 80) return "#22c55e"
  if (score >= 60) return "#f59e0b"
  return "#ef4444"
}

const STATUS_TYPES = {
  // current labels
  "New Application":  { bg: "bg-blue-100", text: "text-blue-700"    },
  "Application Sent": { bg: "bg-blue-100", text: "text-blue-700"    },
  "Under Review":     { bg: "bg-orange-100", text: "text-orange-700"  },
  "In Review":        { bg: "bg-purple-100", text: "text-purple-700"  },
  Evaluation:         { bg: "bg-purple-100", text: "text-purple-700"  },
  "Due Diligence":    { bg: "bg-indigo-100", text: "text-indigo-700"  },
  Shortlisted:        { bg: "bg-green-100", text: "text-green-700"   },
  Decision:           { bg: "bg-yellow-100", text: "text-yellow-700"  },
  "Term Sheet":       { bg: "bg-cyan-100", text: "text-cyan-700"    },
  Active:             { bg: "bg-green-100", text: "text-[#2d5016]"   },
  Exit:               { bg: "bg-gray-100", text: "text-gray-700"    },
  Decline:            { bg: "bg-red-100", text: "text-red-700"     },
  // legacy labels
  "Support Approved": { bg: "bg-cyan-100", text: "text-cyan-700"    },
  "Active Support":   { bg: "bg-green-100", text: "text-[#2d5016]"   },
  "Support Declined": { bg: "bg-red-100", text: "text-red-700"     },
  Rejected:           { bg: "bg-red-100", text: "text-red-700"     },
}
const getStatusClasses = (status) => STATUS_TYPES[status] || { bg: "bg-gray-100", text: "text-gray-600" }

const PIPELINE_STAGES = {
  // current
  "NEW APPLICATION":  { label: "New Application",  next: "Application Sent" },
  "APPLICATION SENT": { label: "Application Sent", next: "Evaluation"        },
  EVALUATION:         { label: "Evaluation",        next: "Due Diligence"    },
  "DUE DILIGENCE":    { label: "Due Diligence",     next: "Decision"         },
  DECISION:           { label: "Decision",          next: "Term Sheet"       },
  "TERM SHEET":       { label: "Term Sheet",        next: "Active"           },
  ACTIVE:             { label: "Active",            next: "N/A"              },
  EXIT:               { label: "Exit",              next: "N/A"              },
  DECLINE:            { label: "Decline",           next: "N/A"              },
  // legacy
  "SUPPORT APPROVED": { label: "Support Approved",  next: "Active"           },
  "ACTIVE SUPPORT":   { label: "Active Support",    next: "N/A"              },
  "SUPPORT DECLINED": { label: "Support Declined",  next: "N/A"              },
}
const getNextStage = (stage) => {
  if (stage?.toUpperCase() === "TERM SHEET") return "Active/Decline"
  return PIPELINE_STAGES[stage?.toUpperCase()]?.next || "N/A"
}

// ─── TruncatedText ─────────────────────────────────────────────────────────────
const TruncatedText = ({ text, maxLines = 2, maxLength = 25 }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  if (!text || text === "-" || text === "Not specified" || text === "Various")
    return <span className="text-gray-400">{text || "-"}</span>
  const shouldTruncate = text.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`
  return (
    <div className={`leading-[1.2] ${isExpanded ? "" : "overflow-hidden"}`}
      style={{ maxHeight: isExpanded ? "none" : `${maxLines * 1.2}em` }}>
      <span className="break-words overflow-wrap-anywhere"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: isExpanded ? "none" : maxLines,
          WebkitBoxOrient: "vertical",
          overflow: isExpanded ? "visible" : "hidden",
        }}>
        {displayText}
      </span>
      {shouldTruncate && (
        <button
          className="text-accentGold text-[0.6rem] underline cursor-pointer block mt-0.5 bg-transparent border-none p-0"
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}>
          {isExpanded ? "Less" : "See more"}
        </button>
      )}
    </div>
  )
}

// ─── Table Skeleton ────────────────────────────────────────────────────────────
const COLS = 14
const TableSkeleton = () => (
  <div className="rounded-md border border-lightTan shadow-sm w-full overflow-x-auto">
    <table className="w-full border-collapse bg-offWhite text-[0.75rem]" style={{ tableLayout: "fixed" }}>
      <thead>
        <tr>
          {Array.from({ length: COLS }).map((_, i) => (
            <th key={i} className="py-1.5 px-0.5 bg-gradient-to-br from-[#4e2106] to-darkBrown border-b-2 border-r border-[#1a0c02]">
              <div className={`h-2.5 rounded bg-white/20 ${["animate-shimmer-d1", "animate-shimmer-d2", "animate-shimmer-d3", "animate-shimmer-d4", "animate-shimmer-d5", "animate-shimmer", "animate-shimmer-d1", "animate-shimmer-d2", "animate-shimmer-d3", "animate-shimmer-d4", "animate-shimmer-d5", "animate-shimmer", "animate-shimmer-d1", "animate-shimmer-d2"][i]} bg-shimmer-dark bg-shimmer`} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 6 }).map((_, row) => (
          <tr key={row} className="border-b border-lightTan">
            {Array.from({ length: COLS }).map((_, col) => (
              <td key={col} className="py-1.5 px-0.5 border-r border-lightTan align-top">
                <div className={`h-3 rounded bg-shimmer-light bg-shimmer ${["animate-shimmer", "animate-shimmer-d1", "animate-shimmer-d2", "animate-shimmer-d3", "animate-shimmer-d4", "animate-shimmer-d5"][col % 6]
                  } ${col === 0 ? "w-3/4" : col % 3 === 0 ? "w-1/2" : "w-5/6"}`} />
               </td>
            ))}
           </tr>
        ))}
      </tbody>
    </table>
  </div>
)

// ─── Shared class strings ──────────────────────────────────────────────────────
const TH = "py-1.5 px-0.5 text-left font-semibold text-[0.7rem] uppercase tracking-[0.2px] sticky top-0 z-10 border-b-2 border-r border-[#1a0c02] align-top leading-[1.1] text-offWhite bg-gradient-to-br from-[#4e2106] to-darkBrown"
const TD = "py-1.5 px-0.5 border-b border-r border-lightTan text-[0.75rem] align-top text-textBrown leading-[1.2] break-words"
const INPUT = "w-full px-3 py-2.5 border-2 border-[#c8b6a6] rounded-lg text-base bg-[#f5f0e1] focus:outline-none focus:border-accentGold"
const INPUT_ERR = "w-full px-3 py-2.5 border-2 border-red-500 rounded-lg text-base bg-[#f5f0e1] focus:outline-none"
const MODAL_OVERLAY = "fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
const MODAL_BOX = "bg-white rounded-[20px] p-10 max-w-[900px] w-[95%] max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(62,39,35,0.5)] relative"
const LABEL = "block text-base font-semibold text-textBrown mb-3"
const BTN_PRIMARY = "px-6 py-3 bg-mediumBrown text-white border-none rounded-lg cursor-pointer font-semibold text-base hover:bg-darkBrown transition-colors"
const BTN_GHOST = "px-6 py-3 bg-transparent text-gray-500 border-2 border-gray-300 rounded-lg cursor-pointer font-medium text-base hover:border-gray-400 transition-colors"

// ─── Component ────────────────────────────────────────────────────────────────
export function SupportSMETable({ filters, stageFilter, onSMEsLoaded, onStageOverride }) {
  const [smes, setSmes] = useState([])
  const [selectedSME, setSelectedSME] = useState(null)
  const [modalType, setModalType] = useState(null)
  const [message, setMessage] = useState("")
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNDASharing, setIsNDASharing] = useState({}) 
  const [notification, setNotification] = useState(null)
  const [showStageModal, setShowStageModal] = useState(false)
  const [selectedSMEForStage, setSelectedSMEForStage] = useState(null)
  const [updatedStages, setUpdatedStages] = useState({})
  const [nextStage, setNextStage] = useState("")
  const [meetingTime, setMeetingTime] = useState("")
  const [meetingLocation, setMeetingLocation] = useState("")
  const [meetingPurpose, setMeetingPurpose] = useState("")
  const [termSheetFile, setTermSheetFile] = useState(null)
  const [sentNDAs, setSentNDAs] = useState({})
  const [availabilities, setAvailabilities] = useState([])
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [tempDates, setTempDates] = useState([])
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" })
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [showMatchBreakdown, setShowMatchBreakdown] = useState(false)
  const [selectedAcceleratorForBreakdown, setSelectedAcceleratorForBreakdown] = useState(null)
  const [showSMEDetails, setShowSMEDetails] = useState(false)
  const [selectedSMEDetails, setSelectedSMEDetails] = useState(null)
  const [bigScoreData, setBigScoreData] = useState({
    pis: { score: 0, color: "#4E342E" },
    compliance: { score: 0, color: "#8D6E63" },
    legitimacy: { score: 0, color: "#5D4037" },
    fundability: { score: 0, color: "#3E2723" },
    leadership: { score: 0, color: "#4E342E" },
  })
  const [showFilters, setShowFilters] = useState(false)
  const [localFilters, setLocalFilters] = useState({
    location: "", matchScore: 50, minValue: "", maxValue: "",
    instruments: [], stages: [], sectors: [], supportTypes: [], smeType: "", sortBy: "",
  })
  const [supportAgreementStatuses, setSupportAgreementStatuses] = useState({})

const applicationStages = [
    { id: "new_application", name: "New Application", color: "#6366f1" },
    { id: "application_sent", name: "Application Sent", color: "#3b82f6" },
    { id: "evaluation", name: "Evaluation", color: "#3b82f6" },
    { id: "due_diligence", name: "Due Diligence", color: "#8b5cf6" },
    { id: "decision", name: "Decision", color: "#f59e0b" },
    { id: "term_sheet", name: "Term Sheet", color: "#06b6d4" },
    { id: "active", name: "Active", color: "#10b981" },
    { id: "exit", name: "Exit", color: "#6b7280" },
    { id: "decline", name: "Decline", color: "#ef4444" },
  ]

const getStageFields = (stageName) => {
    switch (stageName) {
      case "New Application":
      case "Application Sent":
        return { showMessage: true, showMeeting: true,  showTermSheet: false, showAvailability: false }
      case "Evaluation":
      case "Due Diligence":
      case "Decision":
        return { showMessage: true, showMeeting: true,  showTermSheet: false, showAvailability: true  }
      case "Term Sheet":
        return { showMessage: true, showMeeting: true,  showTermSheet: true,  showAvailability: true  }
      case "Active":
        return { showMessage: true, showMeeting: false, showTermSheet: false, showAvailability: false }
      case "Decline":
        return { showMessage: true, showMeeting: false, showTermSheet: false, showAvailability: false }
      default:
        return { showMessage: true, showMeeting: true,  showTermSheet: false, showAvailability: false }
    }
  }

  // ── Availability helpers ───────────────────────────────────────────────────
  const loadApplicationAvailability = (application) => {
    if (application.availableDates) {
      setAvailabilities(application.availableDates.map((a) => ({ ...a, date: new Date(a.date) })))
    } else {
      setAvailabilities([])
    }
  }
  const handleDateSelect = (dates) => setTempDates(dates || [])
  const handleTimeChange = (field, value) => setTimeSlot((prev) => ({ ...prev, [field]: value }))
  const removeAvailability = (date) =>
    setAvailabilities((prev) => prev.filter((a) => a.date.getTime() !== date.getTime()))

  const saveSelectedDates = async () => {
    const newAvailabilities = [
      ...availabilities,
      ...tempDates
        .filter((date) => !availabilities.some((a) => a.date.getTime() === date.getTime()))
        .map((date) => ({ date, timeSlots: [{ ...timeSlot }], timeZone, status: "available" })),
    ]
    setAvailabilities(newAvailabilities)
    if (selectedSMEForStage) {
      try {
        const availabilityData = newAvailabilities.map((a) => ({
          date: a.date.toISOString(), timeSlots: a.timeSlots, timeZone: a.timeZone, status: a.status,
        }))
        const docId = `${auth.currentUser.uid}_${selectedSMEForStage.id}`
        await updateDoc(doc(db, "catalystApplications", docId), { availableDates: availabilityData, updatedAt: new Date().toISOString() })
        await updateDoc(doc(db, "smeCatalystApplications", docId), { availableDates: availabilityData, updatedAt: new Date().toISOString() })
      } catch (err) { console.error("Error updating availabilities:", err) }
    }
    setTempDates([])
    setShowCalendarModal(false)
  }

  // ── Stage action ───────────────────────────────────────────────────────────
  const handleStageAction = (sme) => {
    setSelectedSMEForStage(sme)
    setShowStageModal(true)
    setNextStage("")
    setMessage("")
    setMeetingTime("")
    setMeetingLocation("")
    setMeetingPurpose("")
    setTermSheetFile(null)
    setFormErrors({})
    loadApplicationAvailability(sme)
  }

  const resetStageModal = () => {
    setSelectedSMEForStage(null)
    setShowStageModal(false)
    setNextStage("")
    setMessage("")
    setMeetingTime("")
    setMeetingLocation("")
    setMeetingPurpose("")
    setTermSheetFile(null)
    setFormErrors({})
    setAvailabilities([])
  }

  // ── Context data ───────────────────────────────────────────────────────────
  const { enriched, catalystFormData, loading } = usePortfolio()

  useEffect(() => {
    const mapRow = (a) => {
      const entity = a.profile?.entityOverview || {}
      const funding = a.profile?.useOfFunds || {}
      const multiProgram = enriched.filter((e) => e.smeId === a.smeId).length > 1
      return {
        file_id: a.docId,
        id: a.smeId,
        programIndex: a.programIndex,
        name: (entity.registeredName || a.smeName || "N/A") +
          (multiProgram ? ` (Program ${parseInt(a.programIndex) + 1})` : ""),
        location: entity.location || a.location || "N/A",
        sector: (entity.economicSectors || []).join(", ") || a.sector || "N/A",
        fundingStage: entity.operationStage || a.fundingStage || "-",
        fundingRequired: funding.amountRequested || a.fundingRequired || "-",
        equityOffered: funding.equityType || a.equityOffered || "-",
        guarantees: a.guarantees || "-",
        supportRequired: a.supportRequired || "-",
        servicesRequired: a.servicesRequired || "-",
        applicationDate: a.applicationDate
          ? new Date(a.applicationDate).toLocaleDateString()
          : a.createdAt?.seconds
            ? new Date(a.createdAt.seconds * 1000).toLocaleDateString()
            : "-",
        matchPercentage: a.matchPercentage || 0,
        bigScore: a.bigScore || 0,
        compliance: a.compliance || 0,
        legitimacy: a.legitimacy || 0,
        fundability: a.fundability || 0,
        pis: a.pis || 0,
        currentStatus: a.status || a.pipelineStage || "New Application",
        pipelineStage: a.pipelineStage || a.status || "New Application",
        nextStage: a.nextStage || "Evaluation",
        action: "Application Received",
        availableDates: (a.availableDates || []).map((av) => ({ ...av, date: new Date(av.date) })),
        acceleratorName: a.acceleratorName || "N/A",
        programName: a.programName || `Program ${parseInt(a.programIndex) + 1}`,
      }
    }
const mapped = enriched.map((a) => {
  const row = mapRow(a)
  // Recalculate live match score so table and breakdown are always in sync
  const programs = catalystFormData?.programmeDetails?.programs || []
  const program = programs[parseInt(a.programIndex)] || programs[0] || null
  try {
    const result = calculateMatchScore(a.profile || {}, catalystFormData, program)
    row.matchPercentage = result.score
  } catch (_) { /* keep stored value on error */ }
  return row
}).sort((a, b) => b.matchPercentage - a.matchPercentage)

if (!stageFilter) { setSmes(mapped); onSMEsLoaded?.(mapped); return }
   const stageMapping = {
      initial:     ["new application", "application sent", "match", "matched", "matching"],
      application: ["new application", "application sent"],
      review:      ["under review", "in review", "evaluation"],
      approved:    ["due diligence", "shortlisted"],
      supported:   ["support approved"],
      funding:     ["decision"],
      termsheet:   ["term sheet"],
      active:      ["active", "active support", "support approved"],
      rejected:    ["decline", "support declined", "rejected", "withdrawn", "declined"],
    }
    let filtered
    if (stageFilter === "initial") {
      filtered = mapped
    } else {
      const valid = stageMapping[stageFilter] || []
      filtered = mapped.filter((s) =>
        valid.includes((s.pipelineStage || "").toLowerCase()) ||
        valid.includes((s.currentStatus || "").toLowerCase())
      )
    }
   setSmes([...filtered].sort((a, b) => b.matchPercentage - a.matchPercentage))
    onSMEsLoaded?.(mapped)
  }, [enriched, stageFilter])

  useEffect(() => {
    const fetchSupportAgreementStatuses = async () => {
      const statusMap = {}
      for (const sme of smes) {
        if (sme.file_id) {
          try {
            const docSnap = await getDoc(doc(db, "catalystApplications", sme.file_id))
            if (docSnap.exists()) {
              const data = docSnap.data()
              if (data.supportAgreementStatus) {
                statusMap[sme.file_id] = data.supportAgreementStatus
              }
            }
          } catch (error) {
            console.error("Error fetching support agreement status:", error)
          }
        }
      }
      setSupportAgreementStatuses(statusMap)
    }

    if (smes.length > 0) {
      fetchSupportAgreementStatuses()
    }
  }, [smes])

  const renderSupportAgreementStatus = (sme) => {
    const stageKey = `${sme.id}_${sme.programIndex}`
    const currentStage = updatedStages[stageKey] || sme.pipelineStage
    if (!["Term Sheet", "Support Approved"].includes(currentStage)) return null

    const status = supportAgreementStatuses[sme.file_id]
    if (!status) return (
      <span title="Awaiting SME response" style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: "16px", height: "16px", borderRadius: "50%",
        backgroundColor: "#9e9e9e", color: "white", fontSize: "10px",
        flexShrink: 0, marginLeft: "4px"
      }}>?</span>
    )

    if (status === "accepted") return (
      <span title="Support Agreement Accepted" style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: "16px", height: "16px", borderRadius: "50%",
        backgroundColor: "#4caf50", color: "white", fontSize: "10px", fontWeight: "bold",
        flexShrink: 0, marginLeft: "4px"
      }}>✓</span>
    )

    if (status === "declined") return (
      <span title="Support Agreement Declined" style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: "16px", height: "16px", borderRadius: "50%",
        backgroundColor: "#f44336", color: "white", fontSize: "10px", fontWeight: "bold",
        flexShrink: 0, marginLeft: "4px"
      }}>✗</span>
    )

    return null
  }
  
  // ── Filter helpers ─────────────────────────────────────────────────────────
  const handleFilterChange = (key, value) => setLocalFilters((prev) => ({ ...prev, [key]: value }))
  const clearFilters = () => setLocalFilters({ location: "", matchScore: 50, minFunding: "", maxFunding: "", instruments: [], stages: [], sectors: [], supportTypes: [], smeType: "", sortBy: "" })
  const applyFilters = () => { console.log("Applying filters:", localFilters); setShowFilters(false) }

  // ── Stage update ───────────────────────────────────────────────────────────
 const handleStageUpdate = async () => {
    const stageFields = getStageFields(nextStage)
    const errors = {}
    if (!nextStage) errors.nextStage = "Please select a stage"
    if (stageFields.showMessage && !message.trim()) errors.message = "Please provide a message"
    if (stageFields.showMeeting) {
      if (!meetingLocation.trim()) errors.meetingLocation = "Please provide a meeting location"
      if (!meetingPurpose.trim()) errors.meetingPurpose = "Please provide a meeting purpose"
    }
    if (stageFields.showAvailability && !availabilities.length) errors.availabilities = "Please select at least one available date"
    if (stageFields.showTermSheet && termSheetFile) {
      const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
      if (!allowed.includes(termSheetFile.type)) {
        errors.termSheetFile = "Only PDF or Word documents are accepted"
      } else if (termSheetFile.size > 10 * 1024 * 1024) {
        errors.termSheetFile = "File must be under 10 MB"
      }
    }
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setIsSubmitting(true)
    try {
      const user = auth.currentUser
      if (!user) throw new Error("User not authenticated")
      const catalystId = user.uid
      const smeId = selectedSMEForStage.id
      const programIndex = selectedSMEForStage.programIndex || "0"
      const documentId = `${catalystId}_${smeId}_${programIndex}`
      const documentsmeId = `${smeId}_${catalystId}_${programIndex}`
      let attachmentUrl = null
      if (termSheetFile) {
        const storageRef = ref(storage, `support_termsheets/${smeId}/${termSheetFile.name}`)
        const snapshot = await uploadBytes(storageRef, termSheetFile)
        attachmentUrl = await getDownloadURL(snapshot.ref)
      }
      const computedNextStage = getNextStage(nextStage)
      const updateData = {
        status: nextStage, pipelineStage: nextStage, nextStage: computedNextStage,
        updatedAt: serverTimestamp(),
        ...(message && { lastMessage: message }),
        ...(stageFields.showMeeting && { meetingDetails: { time: meetingTime, location: meetingLocation, purpose: meetingPurpose } }),
      }
      if (stageFields.showAvailability && availabilities.length > 0) {
        updateData.availableDates = availabilities.map((a) => ({
          date: a.date.toISOString(), timeSlots: a.timeSlots, timeZone: a.timeZone, status: a.status,
        }))
      }
      const docRef = doc(db, "catalystApplications", documentId)
      const docSnapshot = await getDoc(docRef)
      if (!docSnapshot.exists()) throw new Error(`Document ${documentId} does not exist`)
      await updateDoc(docRef, updateData)
      try {
        await updateDoc(doc(db, "smeCatalystApplications", documentsmeId), {
          status: nextStage, nextStage: computedNextStage,
          ...(updateData.availableDates && { availableDates: updateData.availableDates }),
        })
      } catch (e) { console.warn("Could not update smeCatalystApplications:", e.message) }
      if (stageFields.showMeeting && meetingLocation && meetingPurpose) {
        try {
          await addDoc(collection(db, "smeCalendarEvents"), {
            smeId, catalystId, title: meetingPurpose, date: meetingTime,
            location: meetingLocation, type: "support_meeting", createdAt: new Date().toISOString(),
            ...(updateData.availableDates && { availableDates: updateData.availableDates }),
          })
        } catch (e) { console.error("Error creating calendar event:", e) }
      }
      
      // Update local state with the new stage
      const stageKey = `${smeId}_${programIndex}`
      setUpdatedStages((prev) => ({ ...prev, [stageKey]: nextStage }))
      
      setSmes((prev) => {
        const next = prev.map((s) =>
          s.id === smeId && s.programIndex === programIndex
            ? {
              ...s, 
              status: nextStage, 
              nextStage: computedNextStage, 
              pipelineStage: nextStage,
              currentStatus: nextStage,
              ...(message && { lastMessage: message }),
              ...(stageFields.showMeeting && { meetingDetails: { time: meetingTime, location: meetingLocation, purpose: meetingPurpose } }),
              ...(updateData.availableDates && { availableDates: updateData.availableDates })
            }
            : s
        )
        onSMEsLoaded?.(next)
        return next
      })
      
      // Call onStageOverride to notify parent component about stage changes
      if (onStageOverride) {
        onStageOverride(
          smes.map(s => ({
            smeId: s.id,
            programIndex: s.programIndex,
            pipelineStage: s.id === smeId && s.programIndex === programIndex
              ? nextStage
              : (s.pipelineStage || s.currentStatus),
            status: s.id === smeId && s.programIndex === programIndex
              ? nextStage
              : (s.currentStatus || s.pipelineStage),
          }))
        )
      }
      
      setNotification({ type: "success", message: `Application status updated to ${nextStage} successfully` })
      setShowStageModal(false)
      resetStageModal()
      
      const subject = `Update: ${nextStage} Stage for Your Application`
      let content = `Dear ${selectedSMEForStage.name},\n\nWe are pleased to inform you that your application has progressed to the "${nextStage}" stage.\n\n${message}`

     if (stageFields.showMeeting && meetingLocation && meetingPurpose) {
        content += `\n\nMeeting Details:\n- Location: ${meetingLocation}\n- Purpose: ${meetingPurpose}`
      }

      if (attachmentUrl) {
        content += `\n\nTerm Sheet Document:\nPlease review the attached term sheet using the link below:\n${attachmentUrl}\n\nKindly review and respond with your acceptance or decline of the terms.`
      }

      if (stageFields.showAvailability && availabilities.length > 0) {
        content += `\n\nAvailable Meeting Times:\n` +
          availabilities.map((a, i) => {
            const d = a.date.toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric"
            })
            const t = a.timeSlots?.[0]
              ? `${a.timeSlots[0].start} - ${a.timeSlots[0].end} ${a.timeZone}`
              : "Time not specified"
            return `${i + 1}. ${d} (${t})`
          }).join("\n")
        content += `\n\nPlease reply with your preferred meeting time from the above options.`
      }

      content += `\n\nBest regards,\nSupport Team`
      const messagePayload = {
        to: smeId,
        from: catalystId,
        subject: `Update: ${nextStage} Stage for Your Application`,
        content,
        date: new Date().toISOString(),
        read: false,
        type: "inbox",
        applicationId: documentId,
        attachments: attachmentUrl ? [attachmentUrl] : [],
        ...(attachmentUrl && { documentUrl: attachmentUrl, documentType: "support_agreement" }),
        ...(updateData.availableDates && { availableDates: updateData.availableDates }),
      }

      await Promise.all([
        addDoc(collection(db, "messages"), messagePayload),
        addDoc(collection(db, "messages"), { ...messagePayload, read: true, type: "sent" }),
      ])
    } catch (error) {
      console.error("Stage update error:", error)
      setNotification({ type: "error", message: `Failed to update status: ${error.message}` })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load existing shared NDAs for all SMEs
useEffect(() => {
  const loadSentNDAs = async () => {
    try {
      const user = auth.currentUser
      if (!user) return

      const sharedNDAQuery = query(
        collection(db, "shared_nda"),
        where("catalystId", "==", user.uid),
        where("status", "==", "sent")
      )
      
      const snapshot = await getDocs(sharedNDAQuery)
      const sentMap = {}
      
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        const smeKey = `${data.smeId}_${data.programIndex}`
        sentMap[smeKey] = true
      })
      
      setSentNDAs(sentMap)
      console.log("Loaded sent NDAs:", sentMap)
    } catch (error) {
      console.error("Error loading sent NDAs:", error)
    }
  }

  if (auth.currentUser) {
    loadSentNDAs()
  }
}, [])

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const handleViewDetails = (sme) => {
    setSelectedSMEDetails(sme)
    setShowSMEDetails(true)
  }
  const handleBigScoreClick = (sme) => {
    setBigScoreData({
      compliance: { score: sme.compliance || 0, color: "#8D6E63" },
      legitimacy: { score: sme.legitimacy || 0, color: "#5D4037" },
      fundability: { score: sme.fundability || 0, color: "#3E2723" },
      pis: { score: sme.pis || 0, color: "#4E342E" },
    })
    setSelectedSME(sme)
    setModalType("bigScore")
  }
  const resetModal = () => { setSelectedSME(null); setModalType(null); setMessage(""); setFormErrors({}) }
  const calculateTotalScore = () => selectedSME?.bigScore || 0

  // ── Match score calculator ─────────────────────────────────────────────────
  const calculateMatchScore = (smeProfileData, catalystFormData, program = null) => {
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
      if (v == null) return []
      if (Array.isArray(v)) return v
      return v.toString().split(/[,|/]+/g).map(s => s.trim()).filter(Boolean)
    }
    const splitSectorTokens = (v) =>
      toArray(v).flatMap(item => item.split(/[,|/]+/g))
        .flatMap(item => item.split(/[_/\-\s]+/g))
        .map(s => s.replace(/\(.*?\)/g, "")).map(s => s.trim()).filter(Boolean)
    const canon = (s) => s.toLowerCase().replace(/[^a-z]/g, "")
    const SECTOR_ALIASES = {
      it: "informationtechnology", ict: "informationtechnology",
      informationtechnology: "informationtechnology",
      technology: "informationtechnology", software: "informationtechnology",
      agri: "agriculture", agriculture: "agriculture",
      forestry: "forestry", fishing: "fishing",
    }
    const COMPOSITE_EXPANSIONS = { agricultureforestryfishing: ["agriculture", "forestry", "fishing"] }
    const mapAlias = (t) => SECTOR_ALIASES[t] || t
    const normalizeSectors = (v) =>
      splitSectorTokens(v).map(canon).map(mapAlias)
        .flatMap(t => COMPOSITE_EXPANSIONS[t] ? COMPOSITE_EXPANSIONS[t] : [t]).filter(Boolean)
    const hasOverlap = (a, b) => {
      const A = new Set(normalizeSectors(a))
      for (const t of normalizeSectors(b)) if (A.has(t)) return true
      return false
    }
    const normalizeToken = (s) => s.toString().toLowerCase().trim().replace(/[_\-\s]+/g, "")
    const normalizeList = (v) => toArray(v).flatMap(item => item.split(/\s*,\s*/)).map(normalizeToken).filter(Boolean)
  const normalize = (val) => {
      const clean = (s) => s?.toString().toLowerCase().replace(/[\s_\-\/]+/g, "").trim() ?? ""
      return Array.isArray(val) ? val.map(clean) : clean(val)
    }
    const cleanCurrency = (value) => { if (!value) return 0; return parseFloat(value.toString().replace(/[^0-9.]/g, "")) || 0 }
    const cleanString = (input) => {
      if (Array.isArray(input)) return input.map(str => typeof str === "string" ? str.replace(/[_-]/g, " ").toLowerCase() : str)
      if (typeof input === "string") return input.replace(/[_-]/g, " ").toLowerCase()
      return input
    }
    const checkGeographicMatch = () => {
      const briefPrefs = catalystFormData?.programBriefMatchingPreference || {}
      const generalPrefs = catalystFormData?.generalMatchingPreference || {}

      const accelGeoFocus = toArray(briefPrefs.geographicFocus?.length ? briefPrefs.geographicFocus : generalPrefs.geographicFocus)
        .map(s => s.toLowerCase().trim())

      if (accelGeoFocus.includes("global")) return true
      if (
        accelGeoFocus.includes("regional_emea") ||
        accelGeoFocus.includes("regional_na") ||
        accelGeoFocus.includes("regional_apac")
      ) return true

      const smeCountries = toArray(smeProfileData.entityOverview?.operatingCountries)
        .map(s => s.toLowerCase().trim())
      const smeLocationFallback = (smeProfileData.entityOverview?.location || "").toLowerCase().trim()
      const smeProvinces = toArray(smeProfileData.entityOverview?.operatingProvinces)
        .map(s => s.toLowerCase().trim())
      const smeProvinceFallback = (smeProfileData.entityOverview?.province || "").toLowerCase().trim()

      if (accelGeoFocus.includes("country_specific")) {
        const accelCountries = toArray(
          briefPrefs.selectedCountries?.length ? briefPrefs.selectedCountries : generalPrefs.selectedCountries
        ).map(s => s.toLowerCase().trim().replace(/[_\-\s]+/g, ""))

        const smeCountryTokens = [...smeCountries, smeLocationFallback]
          .map(s => s.replace(/[_\-\s]+/g, ""))

        return smeCountryTokens.some(c => accelCountries.includes(c))
      }

      if (accelGeoFocus.includes("province_specific")) {
        const accelProvinces = toArray(
          briefPrefs.selectedProvinces?.length ? briefPrefs.selectedProvinces : generalPrefs.selectedProvinces
        ).map(s => s.toLowerCase().trim().replace(/[_\-\s]+/g, ""))

        const smeProvinceTokens = [...smeProvinces, smeProvinceFallback]
          .map(s => s.replace(/[_\-\s]+/g, ""))

        return smeProvinceTokens.some(p => accelProvinces.includes(p))
      }

      return false
    }
  

    const programData = program || catalystFormData?.programmeDetails?.programs?.[0] || {}
    const matchPrefs = catalystFormData?.programBriefMatchingPreference || catalystFormData?.generalMatchingPreference || {}

      // 1. Funding Stage
    const smeStage = smeProfileData.applicationOverview?.fundingStage
    const accelStageRaw = matchPrefs.businessLifecycleStage
 
    const accelStages = Array.isArray(accelStageRaw)
      ? accelStageRaw.map((s) => normalize(s)).filter(Boolean)
      : accelStageRaw
        ? [normalize(accelStageRaw)].filter(Boolean)
        : []
 
    const normSmeStage = normalize(smeStage)
    const stageMatch = !!normSmeStage && accelStages.includes(normSmeStage)
 
    breakdown.fundingStage.details = {
      smeValue: smeStage,
      accelValue: accelStages.join(", ") || accelStageRaw,
    }
    breakdown.fundingStage.matched = stageMatch
    if (stageMatch) { breakdown.fundingStage.score = 12.5; matched++ }

    // 2. Ticket Size
    const smeAmountRequested = cleanCurrency(smeProfileData.useOfFunds?.amountRequested)
    const accelMinTicket = cleanCurrency(programData.minimumSupport || 0)
    const accelMaxTicket = cleanCurrency(programData.maximumSupport || 0)
    const ticketMatch = smeAmountRequested >= accelMinTicket && smeAmountRequested <= accelMaxTicket
    breakdown.ticketSize.details = { smeValue: smeAmountRequested, accelValue: `${accelMinTicket}–${accelMaxTicket}` }
    breakdown.ticketSize.matched = ticketMatch
    if (ticketMatch) { breakdown.ticketSize.score = 12.5; matched++ }

     // 3. Geographic Fit
    const geoMatch = checkGeographicMatch()
    const smeLocationDisplay = [
      ...toArray(smeProfileData.entityOverview?.operatingCountries),
      smeProfileData.entityOverview?.location,
    ].filter(Boolean).join(", ") || "N/A"
 const briefPrefsForDisplay = catalystFormData?.programBriefMatchingPreference || {}
    const generalPrefsForDisplay = catalystFormData?.generalMatchingPreference || {}
    const accelGeoDisplay = [
      ...toArray(briefPrefsForDisplay.geographicFocus?.length ? briefPrefsForDisplay.geographicFocus : generalPrefsForDisplay.geographicFocus),
      ...toArray(briefPrefsForDisplay.selectedCountries?.length ? briefPrefsForDisplay.selectedCountries : generalPrefsForDisplay.selectedCountries),
      ...toArray(briefPrefsForDisplay.selectedProvinces?.length ? briefPrefsForDisplay.selectedProvinces : generalPrefsForDisplay.selectedProvinces),
    ].filter(Boolean).join(", ") || "N/A"
    breakdown.geographicFit.details = { smeValue: smeLocationDisplay, accelValue: accelGeoDisplay }
    breakdown.geographicFit.matched = geoMatch
    if (geoMatch) { breakdown.geographicFit.score = 12.5; matched++ }

    // 4. Sector Match
    const smeSectors = smeProfileData.entityOverview?.economicSectors
    const accelSectors = matchPrefs.sectorFocus
    const sectorMatch = hasOverlap(smeSectors, accelSectors)
    breakdown.sectorMatch.details = { smeValue: normalizeSectors(smeSectors).join(", "), accelValue: normalizeSectors(accelSectors).join(", ") }
    breakdown.sectorMatch.matched = sectorMatch
    if (sectorMatch) { breakdown.sectorMatch.score = 12.5; matched++ }

    // 5. Instrument Fit
    const smeInstrumentRaw = smeProfileData.useOfFunds?.fundingInstruments
    const accelInstrumentRaw = programData.supportType || matchPrefs.supportFocusSubtype || matchPrefs.supportFocusType
    const instrumentMatch = hasOverlap(smeInstrumentRaw, accelInstrumentRaw)
    breakdown.instrumentFit.details = { smeValue: normalizeList(smeInstrumentRaw).join(", "), accelValue: normalizeList(accelInstrumentRaw).join(", ") }
    breakdown.instrumentFit.matched = instrumentMatch
    if (instrumentMatch) { breakdown.instrumentFit.score = 12.5; matched++ }

    // 6. Support Match
    const smeSupportCategory   = smeProfileData.useOfFunds?.additionalSupportFocus
    const smeSupportSubtype    = smeProfileData.useOfFunds?.additionalSupportFocusSubtype
 const accelSupportCategory = programData.supportFocusType || matchPrefs.supportFocusType || matchPrefs.supportFocus
const accelSupportSubtype  = programData.supportFocusSubtype || matchPrefs.supportFocusSubtype || matchPrefs.supportFocusType

    const normSmeCat    = normalize(smeSupportCategory)
    const normSmeSubtype = normalize(smeSupportSubtype)
    const normAccelCat  = normalize(accelSupportCategory)
    const normAccelSubtype = normalize(accelSupportSubtype)
 
    let supportMatchScore = 0, supportMatched = false
    if (normSmeSubtype && normAccelSubtype && normSmeSubtype === normAccelSubtype) {
      supportMatchScore = 12.5; supportMatched = true; matched++
    } else if (normSmeCat && normAccelCat && (normSmeCat === normAccelCat || hasOverlap(smeSupportCategory, accelSupportCategory))) {
  supportMatchScore = 6.25; supportMatched = true
}
 
    breakdown.supportMatch.details = {
      smeValue:   smeSupportSubtype  ? `${smeSupportCategory} – ${smeSupportSubtype}`   : smeSupportCategory,
      accelValue: accelSupportSubtype ? `${accelSupportCategory} – ${accelSupportSubtype}` : accelSupportCategory,
    }
    breakdown.supportMatch.score   = supportMatchScore
    breakdown.supportMatch.matched = supportMatched

    // 7. Legal Entity Fit
    const smeLegal = smeProfileData.entityOverview?.legalStructure
    const accelLegal = matchPrefs.legalEntityFit
    const legalMatch = normalize(smeLegal) === normalize(accelLegal)
    breakdown.legalEntityFit.details = { smeValue: smeLegal, accelValue: accelLegal }
    breakdown.legalEntityFit.matched = legalMatch
    if (legalMatch) { breakdown.legalEntityFit.score = 12.5; matched++ }

    // 8. Revenue Threshold
    const smeRevenue = cleanCurrency(smeProfileData.financialOverview?.annualRevenue)
    const accelThreshold = cleanCurrency(programData.minimumSupport || "0")
    const revenueMatch = smeRevenue >= accelThreshold
    breakdown.revenueThreshold.details = { smeValue: smeRevenue, accelValue: accelThreshold }
    breakdown.revenueThreshold.matched = revenueMatch
    if (revenueMatch) { breakdown.revenueThreshold.score = 12.5; matched++ }

const totalScore = Object.values(breakdown).reduce((sum, b) => sum + (b.score || 0), 0)

return { score: Math.round(totalScore), breakdown }
  }

  // ── Match breakdown ────────────────────────────────────────────────────────
  const handleViewMatchBreakdown = (sme) => {
    try {
      const contextEntry = enriched.find((a) => a.smeId === sme.id && a.programIndex === sme.programIndex)
      const smeProfileData = contextEntry?.profile || {}
      const programs = catalystFormData?.programmeDetails?.programs || []
      const program = programs[parseInt(sme.programIndex)] || programs[0] || null
      const matchResult = calculateMatchScore(smeProfileData, catalystFormData, program)
      setSelectedAcceleratorForBreakdown({ ...sme, matchPercentage: matchResult.score, matchBreakdown: matchResult.breakdown })
      setShowMatchBreakdown(true)
    } catch (err) {
      console.error("Error computing match breakdown:", err)
      setNotification({ type: "error", message: "Failed to load match breakdown." })
    }
  }

  const currentStageFields = getStageFields(nextStage)
  
// ── Share NDA function ────────────────────────────────────────────────────────
const handleShareNDA = async (sme) => {
  const smeKey = `${sme.id}_${sme.programIndex}`
  
  try {
    setIsNDASharing(prev => ({ ...prev, [smeKey]: true }))
    
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    console.log("Sharing NDA for SME:", sme.id, sme.name)
    console.log("Current user UID:", user.uid)

    const ndaDocRef = doc(db, "ndas", user.uid)
    const ndaDoc = await getDoc(ndaDocRef)
    
    console.log("NDA document exists:", ndaDoc.exists())
    
    if (!ndaDoc.exists()) {
      setNotification({ 
        type: "error", 
        message: `No NDA found for your account. Please upload an NDA first.` 
      })
      return
    }

    const ndaData = ndaDoc.data()
    console.log("NDA document data:", ndaData)
    console.log("PDF URL:", ndaData.pdfUrl)

    if (!ndaData.pdfUrl) {
      console.error("No pdfUrl found in NDA document. Available fields:", Object.keys(ndaData))
      setNotification({ 
        type: "error", 
        message: "NDA document has no PDF URL. Please check the NDA document structure." 
      })
      return
    }

    const shareData = {
      catalystId: user.uid,
      catalystName: user.displayName || "Catalyst",
      catalystEmail: user.email,
      ndaId: ndaDoc.id,
      ndaUrl: ndaData.pdfUrl,
      ndaName: ndaData.ndaContent || ndaData.name || ndaData.fileName || "NDA Document",
      ndaUploadedAt: ndaData.dateSigned || ndaData.lastUpdated || ndaData.uploadedAt || ndaData.timestamp || ndaData.createdAt,
      
      smeId: sme.id,
      smeName: sme.name,
      
      sharedAt: serverTimestamp(),
      status: "sent",
      programIndex: sme.programIndex,
      applicationId: `${user.uid}_${sme.id}_${sme.programIndex}`
    }

    const existingShareQuery = query(
      collection(db, "shared_nda"),
      where("catalystId", "==", user.uid),
      where("smeId", "==", sme.id),
      where("programIndex", "==", sme.programIndex)
    )
    
    const existingShare = await getDocs(existingShareQuery)
    
    if (existingShare.empty) {
      await addDoc(collection(db, "shared_nda"), shareData)
      console.log("Created new share record for SME:", sme.id)
    } else {
      const shareDoc = existingShare.docs[0]
      await updateDoc(doc(db, "shared_nda", shareDoc.id), {
        ...shareData,
        updatedAt: serverTimestamp(),
        sharedAt: serverTimestamp()
      })
      console.log("Updated existing share record for SME:", sme.id)
    }

    await addDoc(collection(db, "messages"), {
      to: sme.id,
      from: user.uid,
      subject: "NDA Ready for Review",
      content: `A Non-Disclosure Agreement (NDA) has been shared with you for your application. Please review and sign it at your earliest convenience.`,
      date: new Date().toISOString(),
      read: false,
      type: "nda_share",
      ndaId: ndaDoc.id,
      ndaUrl: ndaData.pdfUrl,
      ndaName: ndaData.ndaContent || ndaData.name || ndaData.fileName || "NDA Document",
      applicationId: `${user.uid}_${sme.id}_${sme.programIndex}`,
      smeName: sme.name,
      smeId: sme.id
    })

    setSentNDAs(prev => ({
      ...prev,
      [smeKey]: true
    }))

    setNotification({ 
      type: "success", 
      message: `NDA shared successfully with ${sme.name}` 
    })

  } catch (error) {
    console.error("Error sharing NDA:", error)
    setNotification({ 
      type: "error", 
      message: `Failed to share NDA: ${error.message}` 
    })
  } finally {
    setIsNDASharing(prev => ({ ...prev, [smeKey]: false }))
  }
}

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 w-full max-w-full overflow-x-hidden">
      {/* Header row */}
      <div className="flex justify-between items-center mb-5">
        <button
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-accentGold text-white border-none rounded-md cursor-pointer font-medium text-[0.8rem] shadow-[0_2px_6px_rgba(166,124,82,0.3)] hover:bg-[#8d6a44] transition-colors"
        >
          <Filter size={14} />
          Filter Applications
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`px-3 py-3 rounded-md mb-5 text-[0.8rem] border ${notification.type === "success"
          ? "bg-green-50 text-green-800 border-green-200"
          : "bg-red-50 text-red-800 border-red-200"
          }`}>
          {notification.message}
        </div>
      )}

      {/* Table or Skeleton */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="rounded-md border border-lightTan shadow-sm w-full overflow-x-auto">
          <table className="w-full border-collapse bg-offWhite text-[0.75rem]" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "70px" }} />  {/* SMSE Name */}
              <col style={{ width: "60px" }} />  {/* Location */}
              <col style={{ width: "55px" }} />  {/* Sector */}
              <col style={{ width: "60px" }} />  {/* Funding Stage */}
              <col style={{ width: "65px" }} />  {/* Funding Required */}
              <col style={{ width: "55px" }} />  {/* Equity Offered */}
              <col style={{ width: "70px" }} />  {/* Guarantees */}
              <col style={{ width: "75px" }} />  {/* Support Required */}
              <col style={{ width: "70px" }} />  {/* Services Required */}
              <col style={{ width: "65px" }} />  {/* Application Date */}
              <col style={{ width: "50px" }} />  {/* Match % */}
              <col style={{ width: "55px" }} />  {/* BIG Score */}
              <col style={{ width: "80px" }} />  {/* Current Status */}
              <col style={{ width: "60px" }} />  {/* Action */}
            </colgroup>
            <thead>
              <tr>
                <th className={TH}>SMSE<br />Name</th>
                <th className={TH}>Location</th>
                <th className={TH}>Sector</th>
                <th className={TH}>Funding<br />Stage</th>
                <th className={TH}>Funding<br />Required</th>
                <th className={TH}>Equity<br />Offered</th>
                <th className={TH}>Guarantees</th>
                <th className={TH}>Support<br />Required</th>
                <th className={TH}>Services<br />Required</th>
                <th className={TH}>Application<br />Date</th>
                <th className={TH}>Match %</th>
                <th className={TH}>BIG Score</th>
                <th className={TH}>Current<br />Status</th>
                <th className={`${TH} border-r-0`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {smes.length === 0 ? (
                <tr>
                  <td colSpan="14" className={`${TD} text-center text-gray-400 border-r-0`}>
                    No applications received yet
                  </td>
                </tr>
              ) : (
                smes.map((sme) => {
                  // FIXED: Use composite key with programIndex for stage lookup
                  const stageKey = `${sme.id}_${sme.programIndex}`
                  const currentStatus = updatedStages[stageKey] || sme.pipelineStage || sme.currentStatus
                  const statusClasses = getStatusClasses(currentStatus)
                  return (
                    <tr key={stageKey} className="border-b border-lightTan hover:bg-cream/50">
                      {/* Name */}
                      <td className={TD}>
                        <button
                          onClick={() => handleViewDetails(sme)}
                          className="bg-transparent border-none text-accentGold underline cursor-pointer font-medium p-0 text-[0.75rem] text-left break-words w-full leading-[1.2] hover:text-[#8d6a44]"
                        >
                          {sme.name}
                        </button>
                      </td>
                      {/* Location */}
                      <td className={TD}>
                        <div className="flex items-center gap-0.5 text-[0.75rem]">
                          <MapPin size={8} className="flex-shrink-0" />
                          <span className="break-words">{sme.location}</span>
                        </div>
                      </td>
                      {/* Sector */}
                      <td className={TD}><TruncatedText text={sme.sector} maxLines={2} maxLength={8} /></td>
                      {/* Funding Stage */}
                      <td className={TD}><TruncatedText text={sme.fundingStage} maxLength={8} /></td>
                      {/* Funding Required */}
                      <td className={TD}><TruncatedText text={sme.fundingRequired} maxLength={10} /></td>
                      {/* Equity Offered */}
                      <td className={TD}><TruncatedText text={sme.equityOffered} maxLength={8} /></td>
                      {/* Guarantees */}
                      <td className={TD}><TruncatedText text={sme.guarantees} maxLength={8} /></td>
                      {/* Support Required */}
                      <td className={TD}><TruncatedText text={sme.supportRequired} maxLength={12} /></td>
                      {/* Services Required */}
                      <td className={TD}><TruncatedText text={sme.servicesRequired} maxLength={10} /></td>
                      {/* Application Date */}
                      <td className={TD}>
                        <div className="flex items-center gap-0.5 text-[0.7rem]">
                          <Calendar size={8} className="flex-shrink-0" />
                          <span className="break-words">{sme.applicationDate}</span>
                        </div>
                      </td>
                      {/* Match % */}
                      <td className={TD}>
                        <div className="flex flex-col items-start gap-0.5">
                          <div className="w-[25px] h-[3px] bg-lightTan rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-400 to-green-300 transition-all duration-300"
                              style={{ width: `${sme.matchPercentage}%` }} />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-textBrown text-[0.7rem]">{sme.matchPercentage}%</span>
                            <Eye size={12} className="cursor-pointer text-accentGold flex-shrink-0 hover:text-[#8d6a44]"
                              onClick={() => handleViewMatchBreakdown(sme)} />
                          </div>
                        </div>
                      </td>
                      {/* BIG Score */}
                      <td className={TD}>
                        <div className="flex flex-col items-start gap-0.5">
                          <div className="w-[25px] h-[3px] bg-lightTan rounded-full overflow-hidden">
                            <div className="h-full transition-all duration-300"
                              style={{ width: `${sme.bigScore}%`, background: `linear-gradient(90deg, ${getScoreColor(sme.bigScore)}, ${getScoreColor(sme.bigScore)}aa)` }} />
                          </div>
                          <button
                            onClick={() => handleBigScoreClick(sme)}
                            className="bg-transparent border-none underline cursor-pointer flex items-center gap-px font-semibold text-[0.75rem] hover:opacity-80"
                            style={{ color: getScoreColor(sme.bigScore) }}
                          >
                            {sme.bigScore}%<BarChart3 size={8} />
                          </button>
                        </div>
                       </td>
                      {/* Status */}
                      <td className={TD}>
                        <div className="flex items-center flex-wrap gap-0.5">
                          <span className={`${statusClasses.bg} ${statusClasses.text} py-0.5 px-1 rounded text-[0.65rem] font-medium inline-block whitespace-nowrap`}>
                            {currentStatus}
                          </span>
                          {renderSupportAgreementStatus(sme)}
                        </div>
                       </td>
                      {/* Action */}
                      <td className={`${TD} border-r-0`}>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleStageAction(sme)}
                            className="px-1.5 py-0.5 bg-mediumBrown text-white border-none rounded cursor-pointer text-[0.7rem] font-medium w-full whitespace-nowrap hover:bg-darkBrown transition-colors"
                          >
                            Set Stage
                          </button>

                          {/* Only show NDA button when stage is Evaluation */}
                          {(currentStatus === "Evaluation") && (
                            (() => {
                              const smeKey = `${sme.id}_${sme.programIndex}`
                              const isSharing = isNDASharing[smeKey]
                              const isSent = sentNDAs[smeKey]
                              
                              return isSent ? (
                                <button
                                  disabled
                                  className="px-1.5 py-0.5 bg-gray-400 text-white border-none rounded cursor-not-allowed text-[0.7rem] font-medium w-full whitespace-nowrap opacity-60"
                                >
                                  NDA Sent
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleShareNDA(sme)}
                                  disabled={isSharing}
                                  className="px-1.5 py-0.5 bg-mediumBrown text-white border-none rounded cursor-pointer text-[0.7rem] font-medium w-full whitespace-nowrap hover:bg-darkBrown transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isSharing ? "Sharing..." : "Share NDA"}
                                </button>
                              )
                            })()
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Filter Modal ────────────────────────────────────────────────────── */}
      {showFilters && (
        <div className={MODAL_OVERLAY} onClick={() => setShowFilters(false)}>
          <div className={`${MODAL_BOX} max-w-[800px]`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[28px] font-extrabold text-darkBrown m-0">Filter Support Applications</h3>
              <button onClick={() => setShowFilters(false)} className="bg-transparent border-none cursor-pointer text-gray-500 hover:text-gray-800"><X size={24} /></button>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-8">
              {[
                { label: "Location", key: "location", options: [["", "All Locations"], ["cape-town", "Cape Town"], ["johannesburg", "Johannesburg"], ["durban", "Durban"], ["pretoria", "Pretoria"]] },
                { label: "Sector", key: "sector", options: [["", "All Sectors"], ["tech", "Technology"], ["agri", "Agriculture"], ["cleantech", "CleanTech"], ["healthtech", "HealthTech"], ["edtech", "EdTech"]] },
                { label: "Funding Stage", key: "stages", options: [["", "All Stages"], ["pre-seed", "Pre-Seed"], ["seed", "Seed"], ["series-a", "Series A"], ["series-b", "Series B"]] },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label className={LABEL}>{label}</label>
                  <select
                    value={key === "stages" ? (localFilters.stages[0] || "") : localFilters[key]}
                    onChange={(e) => handleFilterChange(key, key === "stages" ? (e.target.value ? [e.target.value] : []) : e.target.value)}
                    className={INPUT}
                  >
                    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className={LABEL}>Minimum Match Score: {localFilters.matchScore}%</label>
                <input type="range" min="0" max="100" value={localFilters.matchScore}
                  onChange={(e) => handleFilterChange("matchScore", parseInt(e.target.value))}
                  className="w-full h-2 rounded bg-[#e6d7c3] outline-none accent-accentGold" />
                <div className="flex justify-between text-xs text-warmBrown mt-1">
                  <span>0%</span><span>100%</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between gap-4">
              <button onClick={clearFilters} className="px-6 py-3 bg-lightTan text-textBrown border-none rounded-lg cursor-pointer font-semibold flex items-center gap-2 hover:bg-[#c8b6a6] transition-colors">
                <X size={16} />Clear All
              </button>
              <div className="flex gap-3">
                <button onClick={() => setShowFilters(false)} className={BTN_GHOST}>Cancel</button>
                <button onClick={applyFilters} className={`${BTN_PRIMARY} flex items-center gap-2`}>
                  <Filter size={16} />Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BIG Score Modal ─────────────────────────────────────────────────── */}
      {selectedSME && modalType === "bigScore" && (
        <div className={MODAL_OVERLAY} onClick={resetModal}>
          <div
            className="relative bg-white rounded-[24px] w-[95%] max-w-[520px] max-h-[90vh] overflow-y-auto shadow-[0_32px_80px_rgba(62,39,35,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative rounded-t-[24px] px-8 pt-8 pb-6 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #140905 0%, #6D4C41 60%, #8D6E63 100%)" }}
            >
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute top-4 -right-2 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />

              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-[#D7B899] text-xs font-semibold uppercase tracking-widest mb-1">BIG Score</p>
                  <h3 className="text-white text-[22px] font-extrabold m-0 leading-tight">
                    {selectedSME.name}
                  </h3>
                  <p className="text-[#C4A882] text-sm mt-1 m-0">Support Readiness Breakdown</p>
                </div>

                <div className="flex flex-col items-center flex-shrink-0 ml-4">
                  <div
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                    style={{
                      background: `conic-gradient(
                        ${getScoreColor(calculateTotalScore())} ${calculateTotalScore() * 3.6}deg,
                        rgba(255,255,255,0.15) 0deg
                      )`,
                    }}
                  >
                    <div className="w-[56px] h-[56px] rounded-full bg-[#1a0c02] flex items-center justify-center">
                      <span
                        className="text-[18px] font-extrabold"
                        style={{ color: getScoreColor(calculateTotalScore()) }}
                      >
                        {calculateTotalScore()}
                      </span>
                    </div>
                  </div>
                  <span className="text-[#C4A882] text-[10px] mt-1 font-semibold uppercase tracking-wider">Overall</span>
                </div>
              </div>

              <button
                onClick={resetModal}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 border-none cursor-pointer flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all text-base z-20"
              >
                ✕
              </button>
            </div>

            <div className="px-8 py-6 flex flex-col gap-4">
              {(() => {
                const META = {
                  compliance:  { label: "Compliance",  icon: "✅", desc: "Regulatory & legal compliance",      grad: "from-[#140905] to-[#4E342E]"  },
                  legitimacy:  { label: "Legitimacy",  icon: "🏛️", desc: "Business legitimacy & verification", grad: "from-[#3E2723] to-[#6D4C41]"  },
                  fundability: { label: "Capital Appeal", icon: "💰", desc: "Investment readiness & financials",   grad: "from-[#4E342E] to-[#8D6E63]"  },
                  pis:         { label: "PIS",         icon: "📊", desc: "Public Intrest score",         grad: "from-[#5D4037] to-[#A1887F]"  },
                }
                return Object.entries(bigScoreData).map(([key, data]) => {
                  const meta = META[key] || { label: key, icon: "📈", desc: "", grad: "from-[#4e2106] to-[#8D6E63]" }
                  const score = data.score || 0
                  const color = getScoreColor(score)
                  return (
                    <div
                      key={key}
                      className="rounded-2xl overflow-hidden border border-[#e8ddd5] shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className={`bg-gradient-to-r ${meta.grad} px-5 py-3 flex justify-between items-center`}>
                        <div className="flex items-center gap-2">
                          <span className="text-base">{meta.icon}</span>
                          <div>
                            <p className="text-white text-[13px] font-bold m-0 leading-none">{meta.label} Score</p>
                            <p className="text-white/70 text-[10px] m-0 mt-0.5">{meta.desc}</p>
                          </div>
                        </div>
                        <span className="text-white text-[22px] font-extrabold leading-none">{score}%</span>
                      </div>

                      <div className="bg-[#fdf8f4] px-5 py-3">
                        <div className="flex justify-between text-[10px] text-[#9e7b65] mb-1.5 font-medium">
                          <span>0%</span>
                          <span className="font-semibold" style={{ color }}>
                            {score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Attention"}
                          </span>
                          <span>100%</span>
                        </div>
                        <div className="w-full h-3 bg-[#ede3da] rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-full rounded-full transition-all duration-[1200ms] ease-out"
                            style={{
                              width: `${score}%`,
                              background: `linear-gradient(90deg, ${color}cc, ${color})`,
                              boxShadow: `0 0 8px ${color}66`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>

            <div className="px-8 pb-7 flex justify-end">
              <button
                onClick={resetModal}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer transition-all hover:opacity-90 hover:shadow-md"
                style={{ background: "linear-gradient(135deg, #140905, #6D4C41)" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Calendar Modal ───────────────────────────────────────────────────── */}
      {showCalendarModal && (
        <div className={`${MODAL_OVERLAY} z-[1100]`} onClick={() => setShowCalendarModal(false)}>
          <div className={`${MODAL_BOX} max-w-[800px]`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-darkBrown m-0">Select Available Dates</h3>
              <button onClick={() => setShowCalendarModal(false)} className="bg-transparent border-none cursor-pointer text-gray-500 hover:text-gray-800"><X size={24} /></button>
            </div>
            <div className="mb-6">
              <label className={LABEL}>Time Zone</label>
              <select value={timeZone} onChange={(e) => setTimeZone(e.target.value)} className={INPUT}>
                <option value="Africa/Johannesburg">South Africa Time (SAST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div className="mb-6">
              <label className={LABEL}>Time Slot</label>
              <div className="flex gap-4">
                {["start", "end"].map((f) => (
                  <div key={f} className="flex-1">
                    <label className="block mb-1 text-sm capitalize">{f === "start" ? "Start" : "End"} Time</label>
                    <input type="time" value={timeSlot[f]} onChange={(e) => handleTimeChange(f, e.target.value)} className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-accentGold" />
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className={LABEL}>Select Dates</label>
              <DayPicker mode="multiple" selected={tempDates} onSelect={handleDateSelect} fromDate={new Date()}
                styles={{ caption: { color: "#4a352f", fontWeight: "bold" }, day_selected: { backgroundColor: "#5d4037", color: "white" } }} />
            </div>
            <div className="mb-6">
              <h4 className="text-base font-semibold mb-3">Selected Availability</h4>
              {tempDates.length > 0 ? (
                <div className="border border-gray-200 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                  {tempDates.map((date, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm">
                        {date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        {timeSlot.start && timeSlot.end && <span className="text-gray-500 ml-2">{timeSlot.start} – {timeSlot.end}</span>}
                      </span>
                      <button onClick={() => setTempDates(tempDates.filter((_, j) => j !== i))} className="bg-transparent border-none text-red-500 cursor-pointer p-1 hover:text-red-700"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm">No dates selected yet</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCalendarModal(false)} className={BTN_GHOST}>Cancel</button>
              <button onClick={saveSelectedDates} disabled={tempDates.length === 0} className={`${BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed`}>Save Availability</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stage Action Modal ───────────────────────────────────────────────── */}
      {showStageModal && selectedSMEForStage && (
        <div className={MODAL_OVERLAY} onClick={() => setShowStageModal(false)}>
          <div className={`${MODAL_BOX} max-w-[600px]`} onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-darkBrown m-0 mb-2">Update Application Stage</h3>
              <p className="text-base text-gray-500 m-0">{selectedSMEForStage.name}</p>
            </div>

            <div className="mb-6">
              <label className={LABEL}>Select Next Stage:</label>
              <select
                value={nextStage}
                onChange={(e) => { setNextStage(e.target.value); if (e.target.value) setFormErrors({ ...formErrors, nextStage: "" }) }}
                className={formErrors.nextStage ? INPUT_ERR : INPUT}
              >
                <option value="">Choose a stage...</option>
                {applicationStages.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              {formErrors.nextStage && <p className="text-red-600 text-sm mt-2">{formErrors.nextStage}</p>}
            </div>

            {nextStage && (
              <>
                {currentStageFields.showMessage && (
                  <div className="mb-6">
                    <label className={LABEL}>Message to SMSE:</label>
                    <textarea
                      value={message}
                      onChange={(e) => { setMessage(e.target.value); if (e.target.value.trim()) setFormErrors({ ...formErrors, message: "" }) }}
                      placeholder="Enter your message..."
                      className={`${formErrors.message ? INPUT_ERR : INPUT} min-h-[100px] resize-y font-[inherit]`}
                    />
                    {formErrors.message && <p className="text-red-600 text-sm mt-2">{formErrors.message}</p>}
                  </div>
                )}

                {currentStageFields.showAvailability && (
                  <div className="bg-[#f8f5f3] p-5 rounded-xl mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-base font-semibold text-textBrown m-0">Your Availability</h4>
                      <button onClick={() => setShowCalendarModal(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-mediumBrown text-white border-none rounded cursor-pointer text-sm hover:bg-darkBrown transition-colors">
                        <Calendar size={14} />Add Dates
                      </button>
                    </div>
                    {availabilities.length > 0 ? (
                      <div className="border border-gray-200 rounded-lg max-h-[200px] overflow-y-auto">
                        {availabilities.map((a, i) => (
                          <div key={i} className="flex justify-between items-center px-3 py-2 border-b border-gray-100 last:border-0">
                            <div>
                              <div className="font-medium text-sm">
                                {a.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                              </div>
                              {a.timeSlots?.[0] && (
                                <div className="text-xs text-gray-500">{a.timeSlots[0].start} – {a.timeSlots[0].end} ({a.timeZone})</div>
                              )}
                            </div>
                            <button onClick={() => removeAvailability(a.date)} className="bg-transparent border-none text-red-500 cursor-pointer p-1 hover:text-red-700"><X size={16} /></button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic text-sm">No availability slots added yet</p>
                    )}
                    {formErrors.availabilities && <p className="text-red-600 text-sm mt-2">{formErrors.availabilities}</p>}
                  </div>
                )}

                {currentStageFields.showMeeting && (
                  <div className="bg-[#f8f5f3] p-5 rounded-xl mb-6">
                    <h4 className="text-base font-semibold text-textBrown mb-4 m-0">Schedule Meeting</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-textBrown mb-2">Location:</label>
                        <input type="text" value={meetingLocation}
                          onChange={(e) => { setMeetingLocation(e.target.value); if (e.target.value.trim()) setFormErrors({ ...formErrors, meetingLocation: "" }) }}
                          placeholder="Office, Virtual, etc."
                          className={`${formErrors.meetingLocation ? "border-red-500" : "border-[#c8b6a6]"} w-full px-3 py-2.5 border-2 rounded-md text-sm bg-white focus:outline-none focus:border-accentGold`}
                        />
                        {formErrors.meetingLocation && <p className="text-red-600 text-xs mt-1">{formErrors.meetingLocation}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-textBrown mb-2">Meeting Purpose:</label>
                      <input type="text" value={meetingPurpose}
                        onChange={(e) => { setMeetingPurpose(e.target.value); if (e.target.value.trim()) setFormErrors({ ...formErrors, meetingPurpose: "" }) }}
                        placeholder="Initial discussion, strategy review, etc."
                        className={`${formErrors.meetingPurpose ? "border-red-500" : "border-[#c8b6a6]"} w-full px-3 py-2.5 border-2 rounded-md text-sm bg-white focus:outline-none focus:border-accentGold`}
                      />
                      {formErrors.meetingPurpose && <p className="text-red-600 text-xs mt-1">{formErrors.meetingPurpose}</p>}
                    </div>
                  </div>
                )}

                {currentStageFields.showTermSheet && (
                  <div className="mb-6">
                    <label className={LABEL}>Support Agreement Upload:</label>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setTermSheetFile(e.target.files[0])}
                      className="w-full px-4 py-3 border-2 border-[#c8b6a6] rounded-lg text-sm bg-[#f5f0e1]" />
                  {termSheetFile && !formErrors.termSheetFile && (
                      <p className="text-sm text-gray-500 mt-2">Selected: {termSheetFile.name}</p>
                    )}
                    {formErrors.termSheetFile && (
                      <p className="text-red-600 text-sm mt-2">{formErrors.termSheetFile}</p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowStageModal(false); resetStageModal() }} disabled={isSubmitting} className={BTN_GHOST}>Cancel</button>
              <button onClick={handleStageUpdate} disabled={isSubmitting} className={`${BTN_PRIMARY} disabled:opacity-60 disabled:cursor-not-allowed`}>
                {isSubmitting ? "Updating..." : "Update Stage"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSMEDetails && selectedSMEDetails && (
        <SMEDetailsModal
          sme={selectedSMEDetails}
          isOpen={showSMEDetails}
          onClose={() => { setShowSMEDetails(false); setSelectedSMEDetails(null) }}
        />
      )}

      {/* ── Match Breakdown Modal ───────────────────────────────────────────── */}
      {showMatchBreakdown && selectedAcceleratorForBreakdown && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setShowMatchBreakdown(false)}>
          <div className="bg-white rounded-xl max-w-[800px] w-[95%] max-h-[90vh] overflow-y-auto shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-lightTan bg-[#F5EBE0]">
              <h3 className="m-0 text-[1.1rem] font-semibold text-[#5D2A0A]">
                Match Breakdown — {selectedAcceleratorForBreakdown.name}
              </h3>
              <button onClick={() => setShowMatchBreakdown(false)} className="bg-transparent border-none text-[1.5rem] cursor-pointer text-[#5D2A0A] hover:opacity-70">✖</button>
            </div>

            <div className="p-6">
              <div className="text-center mb-8 pb-4 border-b-2 border-lightTan">
                <div className="text-5xl font-bold mb-2"
                  style={{ color: selectedAcceleratorForBreakdown.matchPercentage >= 80 ? "#388E3C" : selectedAcceleratorForBreakdown.matchPercentage >= 60 ? "#F57C00" : "#D32F2F" }}>
                  {selectedAcceleratorForBreakdown.matchPercentage || 0}%
                </div>
                <p className="text-base text-lightBrown m-0">Overall Match Score</p>
              </div>

              <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))" }}>
                {selectedAcceleratorForBreakdown.matchBreakdown &&
                  Object.entries(selectedAcceleratorForBreakdown.matchBreakdown).map(([key, breakdown]) => {
                    if (!breakdown || typeof breakdown !== "object") return null
                    const matched = breakdown.matched
                    const scoreColor = matched ? "#388E3C" : "#D32F2F"
                    const titles = {
                      fundingStage: "Funding Stage Match", ticketSize: "Ticket Size Compatibility",
                      geographicFit: "Geographic Fit", sectorMatch: "Sector Match",
                      instrumentFit: "Instrument Fit", supportMatch: "Support Match",
                      legalEntityFit: "Legal Entity Fit", revenueThreshold: "Revenue Threshold",
                    }
                    return (
                      <div key={key} className="bg-offWhite border border-lightTan rounded-lg p-5"
                        style={{ borderLeft: `4px solid ${scoreColor}` }}>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-[0.875rem] font-semibold text-[#5D2A0A] m-0 leading-snug flex-1">
                            {titles[key] || key}
                          </h4>
                          <span className="text-xs font-semibold ml-2 flex-shrink-0" style={{ color: scoreColor }}>
                            {matched ? "✓ Match" : "✗ No Match"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 leading-relaxed">
                          <div className="mb-1"><strong>SME Value:</strong> {breakdown.details?.smeValue || "N/A"}</div>
                          <div><strong>Catalyst Offers:</strong> {breakdown.details?.accelValue || "N/A"}</div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            <div className="flex justify-end px-6 py-5 border-t border-lightTan">
              <button onClick={() => setShowMatchBreakdown(false)}
                className="bg-[#F5EBE0] text-[#5D2A0A] border-none px-4 py-2 rounded-md cursor-pointer text-[0.8rem] hover:bg-lightTan transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}