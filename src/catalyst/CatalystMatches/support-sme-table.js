"use client"

import { useState, useEffect } from "react"
import { BarChart3, MapPin, Calendar, Filter, X, Eye } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { serverTimestamp, doc, updateDoc, getDoc, addDoc, collection } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "../../firebaseConfig"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { usePortfolio } from "../../context/PortfolioContext"

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
  "New Application":  { bg: "bg-blue-100",  text: "text-blue-700" },
  "Under Review":     { bg: "bg-orange-100", text: "text-orange-700" },
  "In Review":        { bg: "bg-purple-100", text: "text-purple-700" },
  Shortlisted:        { bg: "bg-green-100",  text: "text-green-700" },
  "Funding Approved": { bg: "bg-green-100",  text: "text-[#2d5016]" },
  Rejected:           { bg: "bg-red-100",    text: "text-red-700" },
}
const getStatusClasses = (status) => STATUS_TYPES[status] || { bg: "bg-gray-100", text: "text-gray-600" }

const PIPELINE_STAGES = {
  MATCH:              { label: "Match",            next: "Application Sent" },
  "APPLICATION SENT": { label: "Application Sent", next: "Evaluation" },
  EVALUATION:         { label: "Evaluation",       next: "Due Diligence" },
  "DUE DILIGENCE":    { label: "Due Diligence",    next: "Decision" },
  DECISION:           { label: "Decision",          next: "Support Approved" },
  "SUPPORT APPROVED": { label: "Support Approved", next: "Active Support" },
  "ACTIVE SUPPORT":   { label: "Active Support",   next: "N/A" },
  "SUPPORT DECLINED": { label: "Support Declined", next: "N/A" },
}
const getNextStage = (stage) => {
  if (stage?.toUpperCase() === "SUPPORT APPROVED") return "Approved/Declined"
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
              <div className={`h-2.5 rounded bg-white/20 ${["animate-shimmer-d1","animate-shimmer-d2","animate-shimmer-d3","animate-shimmer-d4","animate-shimmer-d5","animate-shimmer","animate-shimmer-d1","animate-shimmer-d2","animate-shimmer-d3","animate-shimmer-d4","animate-shimmer-d5","animate-shimmer","animate-shimmer-d1","animate-shimmer-d2"][i]} bg-shimmer-dark bg-shimmer`} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 6 }).map((_, row) => (
          <tr key={row} className="border-b border-lightTan">
            {Array.from({ length: COLS }).map((_, col) => (
              <td key={col} className="py-1.5 px-0.5 border-r border-lightTan align-top">
                <div className={`h-3 rounded bg-shimmer-light bg-shimmer ${
                  ["animate-shimmer","animate-shimmer-d1","animate-shimmer-d2","animate-shimmer-d3","animate-shimmer-d4","animate-shimmer-d5"][col % 6]
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
export function SupportSMETable({ filters, stageFilter, onSMEsLoaded }) {
  const [smes, setSmes] = useState([])
  const [selectedSME, setSelectedSME] = useState(null)
  const [modalType, setModalType] = useState(null)
  const [message, setMessage] = useState("")
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState(null)
  const [showStageModal, setShowStageModal] = useState(false)
  const [selectedSMEForStage, setSelectedSMEForStage] = useState(null)
  const [updatedStages, setUpdatedStages] = useState({})
  const [nextStage, setNextStage] = useState("")
  const [meetingTime, setMeetingTime] = useState("")
  const [meetingLocation, setMeetingLocation] = useState("")
  const [meetingPurpose, setMeetingPurpose] = useState("")
  const [termSheetFile, setTermSheetFile] = useState(null)
  const [availabilities, setAvailabilities] = useState([])
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [tempDates, setTempDates] = useState([])
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" })
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [showMatchBreakdown, setShowMatchBreakdown] = useState(false)
  const [selectedAcceleratorForBreakdown, setSelectedAcceleratorForBreakdown] = useState(null)
  const [bigScoreData, setBigScoreData] = useState({
    pis:        { score: 0, color: "#4E342E" },
    compliance: { score: 0, color: "#8D6E63" },
    legitimacy: { score: 0, color: "#5D4037" },
    fundability:{ score: 0, color: "#3E2723" },
    leadership: { score: 0, color: "#4E342E" },
  })
  const [showFilters, setShowFilters] = useState(false)
  const [localFilters, setLocalFilters] = useState({
    location: "", matchScore: 50, minValue: "", maxValue: "",
    instruments: [], stages: [], sectors: [], supportTypes: [], smeType: "", sortBy: "",
  })
  const [supportAgreementStatuses, setSupportAgreementStatuses] = useState({})

  const applicationStages = [
    { id: "evaluation",      name: "Evaluation",      color: "#3b82f6" },
    { id: "due_diligence",   name: "Due Diligence",   color: "#8b5cf6" },
    { id: "decision",        name: "Decision",         color: "#f59e0b" },
    { id: "support_approved",name: "Support Approved", color: "#06b6d4" },
    { id: "active_support",  name: "Active Support",  color: "#10b981" },
    { id: "support_declined",name: "Support Declined", color: "#ef4444" },
  ]

  const getStageFields = (stageName) => {
    const base = { showMessage: true, showMeeting: true, showTermSheet: false, showAvailability: false }
    switch (stageName) {
      case "Evaluation":      return { ...base, showAvailability: true }
      case "Due Diligence":   return { ...base, showAvailability: true }
      case "Decision":        return { ...base, showAvailability: true }
      case "Support Approved":return { ...base, showTermSheet: true, showAvailability: true }
      case "Active Support":  return { ...base, showTermSheet: true, showAvailability: false }
      case "Support Declined":return { ...base, showMeeting: false, showAvailability: false }
      default: return base
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
      const entity  = a.profile?.entityOverview || {}
      const funding = a.profile?.useOfFunds    || {}
      const multiProgram = enriched.filter((e) => e.smeId === a.smeId).length > 1
      return {
        file_id:         a.docId,
        id:              a.smeId,
        programIndex:    a.programIndex,
        name:            (entity.registeredName || a.smeName || "N/A") +
                         (multiProgram ? ` (Program ${parseInt(a.programIndex) + 1})` : ""),
        location:        entity.location || a.location || "N/A",
        sector:          (entity.economicSectors || []).join(", ") || a.sector || "N/A",
        fundingStage:    entity.operationStage   || a.fundingStage    || "-",
        fundingRequired: funding.amountRequested || a.fundingRequired || "-",
        equityOffered:   funding.equityType      || a.equityOffered   || "-",
        guarantees:      a.guarantees            || "-",
        supportRequired: a.supportRequired       || "-",
        servicesRequired:a.servicesRequired      || "-",
        applicationDate: a.applicationDate
          ? new Date(a.applicationDate).toLocaleDateString()
          : a.createdAt?.seconds
            ? new Date(a.createdAt.seconds * 1000).toLocaleDateString()
            : "-",
        matchPercentage: a.matchPercentage || 0,
        bigScore:        a.bigScore        || 0,
        compliance:      a.compliance      || 0,
        legitimacy:      a.legitimacy      || 0,
        fundability:     a.fundability     || 0,
        pis:             a.pis             || 0,
        currentStatus:   a.status          || a.pipelineStage || "New Application",
        pipelineStage:   a.pipelineStage   || a.status        || "New Application",
        nextStage:       a.nextStage       || "Evaluation",
        action:          "Application Received",
        availableDates:  (a.availableDates || []).map((av) => ({ ...av, date: new Date(av.date) })),
        acceleratorName: a.acceleratorName || "N/A",
        programName:     a.programName     || `Program ${parseInt(a.programIndex) + 1}`,
      }
    }
    const mapped = enriched.map(mapRow)
    if (!stageFilter) { setSmes(mapped); onSMEsLoaded?.(mapped); return }
    const stageMapping = {
      initial:     ["new application", "application sent", "match", "matched", "matching"],
      application: ["new application", "application sent"],
      review:      ["under review", "in review", "evaluation"],
      approved:    ["due diligence", "shortlisted"],
      supported:   ["support approved"],
      funding:     ["funding approved", "decision"],
      active:      ["active support"],
      termsheet:   ["term sheet"],
      closed:      ["deal closed"],
      rejected:    ["rejected", "withdrawn", "declined", "support declined"],
    }
    const allOtherStages = [
      ...stageMapping.application,
      ...stageMapping.review,
      ...stageMapping.approved,
      ...stageMapping.supported,
      ...stageMapping.funding,
      ...stageMapping.active,
      ...stageMapping.termsheet,
      ...stageMapping.closed,
      ...stageMapping.rejected,
    ]
    let filtered
    if (stageFilter === "initial") {
      // "Matching" card = ALL applications (pipeline.initial === total count)
      filtered = mapped
    } else {
      const valid = stageMapping[stageFilter] || []
      filtered = mapped.filter((s) =>
        valid.includes((s.pipelineStage || "").toLowerCase()) ||
        valid.includes((s.currentStatus || "").toLowerCase())
      )
    }
    setSmes(filtered)
    // Always pass the full mapped set to the parent for notification tracking.
    // Passing the filtered subset caused the notification system to treat
    // disappearing IDs (due to filtering) as stage-changes → spurious badges.
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
  const currentStage = updatedStages[`${sme.id}_${sme.programIndex}`] || sme.pipelineStage
  if (currentStage !== "Support Approved") return null

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
      if (!meetingPurpose.trim())  errors.meetingPurpose  = "Please provide a meeting purpose"
    }
    if (stageFields.showAvailability && !availabilities.length) errors.availabilities = "Please select at least one available date"
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setIsSubmitting(true)
    try {
      const user = auth.currentUser
      if (!user) throw new Error("User not authenticated")
      const catalystId  = user.uid
      const smeId       = selectedSMEForStage.id
      const programIndex= selectedSMEForStage.programIndex || "0"
      const documentId  = `${catalystId}_${smeId}_${programIndex}`
      const documentsmeId = `${smeId}_${catalystId}_${programIndex}`
      let attachmentUrl = null
      if (termSheetFile) {
        const storageRef = ref(storage, `support_termsheets/${smeId}/${termSheetFile.name}`)
        const snapshot   = await uploadBytes(storageRef, termSheetFile)
        attachmentUrl    = await getDownloadURL(snapshot.ref)
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
      const docRef     = doc(db, "catalystApplications", documentId)
      const docSnapshot= await getDoc(docRef)
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
      setSmes((prev) => {
        const next = prev.map((s) =>
          s.id === smeId && s.programIndex === programIndex
            ? { ...s, status: nextStage, nextStage: computedNextStage, pipelineStage: nextStage,
                ...(message && { lastMessage: message }),
                ...(stageFields.showMeeting && { meetingDetails: { time: meetingTime, location: meetingLocation, purpose: meetingPurpose } }),
                ...(updateData.availableDates && { availableDates: updateData.availableDates }) }
            : s
        )
        onSMEsLoaded?.(next)
        return next
      })
      setUpdatedStages((prev) => ({ ...prev, [`${smeId}_${programIndex}`]: nextStage }))
      setNotification({ type: "success", message: `Application status updated to ${nextStage} successfully` })
      setShowStageModal(false)
      resetStageModal()
      const subject = `Update: ${nextStage} Stage for Your Application`
      // Replace the content building section with this more detailed version:
let content = `Dear ${selectedSMEForStage.name},\n\nWe are pleased to inform you that your application has progressed to the "${nextStage}" stage.\n\n${message}`

if (currentStageFields.showMeeting && meetingLocation && meetingPurpose) {
  content += `\n\nMeeting Details:\n- Location: ${meetingLocation}\n- Purpose: ${meetingPurpose}`
}

if (attachmentUrl) {
  content += `\n\nSupport Agreement Document:\nPlease review the attached support agreement document using the link below:\n${attachmentUrl}\n\nKindly review and respond with your acceptance or decline of the agreement terms.`
}

if (currentStageFields.showAvailability && availabilities.length > 0) {
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

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const handleViewDetails = (sme) => { setSelectedSME(sme); setModalType("view") }
  const handleBigScoreClick = (sme) => {
    setBigScoreData({
      compliance:  { score: sme.compliance  || 0, color: "#8D6E63" },
      legitimacy:  { score: sme.legitimacy  || 0, color: "#5D4037" },
      fundability: { score: sme.fundability || 0, color: "#3E2723" },
      pis:         { score: sme.pis         || 0, color: "#4E342E" },
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
      fundingStage:     { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      ticketSize:       { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      geographicFit:    { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      sectorMatch:      { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      instrumentFit:    { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      supportMatch:     { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
      legalEntityFit:   { score: 0, maxScore: 12.5, matched: false, description: "", details: {} },
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
    const normalizeList  = (v) => toArray(v).flatMap(item => item.split(/\s*,\s*/)).map(normalizeToken).filter(Boolean)
    const normalize      = (val) => Array.isArray(val) ? val.map(v => v.toLowerCase().trim()) : val?.toLowerCase().trim()
    const cleanCurrency  = (value) => { if (!value) return 0; return parseFloat(value.toString().replace(/[^0-9.]/g, "")) || 0 }
    const cleanString    = (input) => {
      if (Array.isArray(input)) return input.map(str => typeof str === "string" ? str.replace(/[_-]/g, " ").toLowerCase() : str)
      if (typeof input === "string") return input.replace(/[_-]/g, " ").toLowerCase()
      return input
    }
    const checkGeographicMatch = (smeLocation, acceleratorGeoData) => {
      const smeProvince         = normalize(smeProfileData.entityOverview?.province)
      const smeCountry          = cleanString(smeProfileData.entityOverview?.location) || "not specified"
      const accelGeoFocus       = acceleratorGeoData.geographicFocus || []
      const accelSelectedCountries = cleanString(acceleratorGeoData.selectedCountries) || []
      const accelSelectedProvinces = cleanString(acceleratorGeoData.selectedProvinces) || []
      if (accelGeoFocus.includes("global")) return true
      if (accelGeoFocus.includes("regional_emea") || accelGeoFocus.includes("regional_na") || accelGeoFocus.includes("regional_apac")) return true
      if (accelGeoFocus.includes("country_specific")) return accelSelectedCountries.includes(smeCountry) || accelSelectedCountries.includes(smeLocation)
      if (accelGeoFocus.includes("province_specific")) return accelSelectedProvinces.includes(smeProvince)
      return false
    }

    const programData = program || catalystFormData?.programmeDetails?.programs?.[0] || {}
    const matchPrefs  = catalystFormData?.generalMatchingPreference || {}

    // 1. Funding Stage
    const smeStage = smeProfileData.entityOverview?.operationStage
    const accelStage = matchPrefs.programStage
    const stageMatch = normalize(smeStage) === normalize(accelStage)
    breakdown.fundingStage.details = { smeValue: smeStage, accelValue: accelStage }
    breakdown.fundingStage.matched = stageMatch
    if (stageMatch) { breakdown.fundingStage.score = 12.5; matched++ }

    // 2. Ticket Size
    const smeAmountRequested = cleanCurrency(smeProfileData.useOfFunds?.amountRequested)
    const accelMinTicket     = cleanCurrency(programData.minimumSupport || 0)
    const accelMaxTicket     = cleanCurrency(programData.maximumSupport || 0)
    const ticketMatch        = smeAmountRequested >= accelMinTicket && smeAmountRequested <= accelMaxTicket
    breakdown.ticketSize.details = { smeValue: smeAmountRequested, accelValue: `${accelMinTicket}–${accelMaxTicket}` }
    breakdown.ticketSize.matched = ticketMatch
    if (ticketMatch) { breakdown.ticketSize.score = 12.5; matched++ }

    // 3. Geographic Fit
    const smeLocation = cleanString(smeProfileData.entityOverview?.location)
    const geoMatch    = checkGeographicMatch(smeLocation, matchPrefs)
    breakdown.geographicFit.details = { smeValue: smeLocation, accelValue: matchPrefs.geographicFocus }
    breakdown.geographicFit.matched = geoMatch
    if (geoMatch) { breakdown.geographicFit.score = 12.5; matched++ }

    // 4. Sector Match
    const smeSectors  = smeProfileData.entityOverview?.economicSectors
    const accelSectors = matchPrefs.sectorFocus
    const sectorMatch  = hasOverlap(smeSectors, accelSectors)
    breakdown.sectorMatch.details = { smeValue: normalizeSectors(smeSectors).join(", "), accelValue: normalizeSectors(accelSectors).join(", ") }
    breakdown.sectorMatch.matched = sectorMatch
    if (sectorMatch) { breakdown.sectorMatch.score = 12.5; matched++ }

    // 5. Instrument Fit
    const smeInstrumentRaw   = smeProfileData.useOfFunds?.fundingInstruments
    const accelInstrumentRaw = programData.supportType || matchPrefs.supportFocusSubtype || matchPrefs.supportFocusType
    const instrumentMatch    = hasOverlap(smeInstrumentRaw, accelInstrumentRaw)
    breakdown.instrumentFit.details = { smeValue: normalizeList(smeInstrumentRaw).join(", "), accelValue: normalizeList(accelInstrumentRaw).join(", ") }
    breakdown.instrumentFit.matched = instrumentMatch
    if (instrumentMatch) { breakdown.instrumentFit.score = 12.5; matched++ }

    // 6. Support Match
    const smeSupportCategory  = smeProfileData.useOfFunds?.additionalSupportFocus
    const smeSupportSubtype   = smeProfileData.useOfFunds?.additionalSupportFocusSubtype
    const accelSupportCategory = programData.supportFocusType || matchPrefs.supportFocus
    const accelSupportSubtype  = programData.supportFocusSubtype || matchPrefs.supportFocusSubtype
    let supportMatchScore = 0, supportMatched = false
    if (smeSupportSubtype && accelSupportSubtype && smeSupportSubtype === accelSupportSubtype) {
      supportMatchScore = 12.5; supportMatched = true; matched++
    } else if (smeSupportCategory && accelSupportCategory && smeSupportCategory === accelSupportCategory) {
      supportMatchScore = 6.25; supportMatched = true
    }
    breakdown.supportMatch.details = {
      smeValue:  smeSupportSubtype  ? `${smeSupportCategory} – ${smeSupportSubtype}`  : smeSupportCategory,
      accelValue: accelSupportSubtype ? `${accelSupportCategory} – ${accelSupportSubtype}` : accelSupportCategory,
    }
    breakdown.supportMatch.score   = supportMatchScore
    breakdown.supportMatch.matched = supportMatched

    // 7. Legal Entity Fit
    const smeLegal   = smeProfileData.entityOverview?.legalStructure
    const accelLegal = matchPrefs.legalEntityFit
    const legalMatch = normalize(smeLegal) === normalize(accelLegal)
    breakdown.legalEntityFit.details = { smeValue: smeLegal, accelValue: accelLegal }
    breakdown.legalEntityFit.matched = legalMatch
    if (legalMatch) { breakdown.legalEntityFit.score = 12.5; matched++ }

    // 8. Revenue Threshold
    const smeRevenue      = cleanCurrency(smeProfileData.financialOverview?.annualRevenue)
    const accelThreshold  = cleanCurrency(programData.minimumSupport || "0")
    const revenueMatch    = smeRevenue >= accelThreshold
    breakdown.revenueThreshold.details = { smeValue: smeRevenue, accelValue: accelThreshold }
    breakdown.revenueThreshold.matched = revenueMatch
    if (revenueMatch) { breakdown.revenueThreshold.score = 12.5; matched++ }

    return { score: Math.round((matched / totalFields) * 100), breakdown }
  }

  // ── Match breakdown ────────────────────────────────────────────────────────
  const handleViewMatchBreakdown = (sme) => {
    try {
      const contextEntry   = enriched.find((a) => a.smeId === sme.id && a.programIndex === sme.programIndex)
      const smeProfileData = contextEntry?.profile || {}
      const programs       = catalystFormData?.programmeDetails?.programs || []
      const program        = programs[parseInt(sme.programIndex)] || programs[0] || null
      const matchResult    = calculateMatchScore(smeProfileData, catalystFormData, program)
      setSelectedAcceleratorForBreakdown({ ...sme, matchPercentage: matchResult.score, matchBreakdown: matchResult.breakdown })
      setShowMatchBreakdown(true)
    } catch (err) {
      console.error("Error computing match breakdown:", err)
      setNotification({ type: "error", message: "Failed to load match breakdown." })
    }
  }

  const currentStageFields = getStageFields(nextStage)

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
        <div className={`px-3 py-3 rounded-md mb-5 text-[0.8rem] border ${
          notification.type === "success"
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
              <col style={{ width: "60px" }} />  {/* Guarantees */}
              <col style={{ width: "75px" }} />  {/* Support Required */}
              <col style={{ width: "70px" }} />  {/* Services Required */}
              <col style={{ width: "65px" }} />  {/* Application Date */}
              <col style={{ width: "50px" }} />  {/* Match % */}
              <col style={{ width: "55px" }} />  {/* BIG Score */}
              <col style={{ width: "70px" }} />  {/* Current Status */}
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
                  const currentStatus  = updatedStages[sme.id] || sme.pipelineStage || sme.currentStatus
                  const statusClasses  = getStatusClasses(currentStatus)
                  return (
                    <tr key={`${sme.id}_${sme.programIndex}`} className="border-b border-lightTan hover:bg-cream/50">
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
                        <button
                          onClick={() => handleStageAction(sme)}
                          className="px-1.5 py-0.5 bg-mediumBrown text-white border-none rounded cursor-pointer text-[0.7rem] font-medium w-full whitespace-nowrap hover:bg-darkBrown transition-colors"
                        >
                          Set Stage
                        </button>
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
                { label: "Location", key: "location", options: [["", "All Locations"], ["cape-town","Cape Town"], ["johannesburg","Johannesburg"], ["durban","Durban"], ["pretoria","Pretoria"]] },
                { label: "Sector",   key: "sector",   options: [["", "All Sectors"], ["tech","Technology"], ["agri","Agriculture"], ["cleantech","CleanTech"], ["healthtech","HealthTech"], ["edtech","EdTech"]] },
                { label: "Funding Stage", key: "stages", options: [["","All Stages"], ["pre-seed","Pre-Seed"], ["seed","Seed"], ["series-a","Series A"], ["series-b","Series B"]] },
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
          <div className={MODAL_BOX} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[28px] font-extrabold text-darkBrown m-0">BIG Score Breakdown</h3>
              <div className="bg-mediumBrown text-white rounded-full w-20 h-20 flex items-center justify-center text-[28px] font-extrabold shadow-[0_8px_24px_rgba(93,64,55,0.3)]">
                {calculateTotalScore()}
              </div>
            </div>
            <p className="text-lg text-mediumBrown mb-8 leading-relaxed">
              The BIG Score is a comprehensive evaluation of {selectedSME.name}'s support readiness across four key dimensions:
            </p>
            {Object.entries(bigScoreData).map(([key, data]) => (
              <div key={key} className="bg-gray-50 rounded-2xl p-7 mb-7 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="m-0 text-xl font-bold capitalize">{key} Score</h4>
                  <span className="text-[28px] font-extrabold" style={{ color: data.color }}>{data.score}%</span>
                </div>
                <div className="w-full h-4 bg-cream rounded-full overflow-hidden shadow-inner">
                  <div className="h-full rounded-full transition-all duration-[1500ms] ease-out"
                    style={{ width: `${data.score}%`, backgroundColor: data.color }} />
                </div>
              </div>
            ))}
            <div className="flex justify-end">
              <button onClick={resetModal} className={BTN_PRIMARY}>Close</button>
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
                {["start","end"].map((f) => (
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

            {/* Stage select */}
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
                {/* Message */}
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

                {/* Availability */}
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

                {/* Meeting details */}
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

                {/* Term sheet upload */}
                {currentStageFields.showTermSheet && (
                  <div className="mb-6">
                    <label className={LABEL}>Support Agreement Upload:</label>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setTermSheetFile(e.target.files[0])}
                      className="w-full px-4 py-3 border-2 border-[#c8b6a6] rounded-lg text-sm bg-[#f5f0e1]" />
                    {termSheetFile && <p className="text-sm text-gray-500 mt-2">Selected: {termSheetFile.name}</p>}
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

      {/* ── Match Breakdown Modal ───────────────────────────────────────────── */}
      {showMatchBreakdown && selectedAcceleratorForBreakdown && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setShowMatchBreakdown(false)}>
          <div className="bg-white rounded-xl max-w-[800px] w-[95%] max-h-[90vh] overflow-y-auto shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-lightTan bg-[#F5EBE0]">
              <h3 className="m-0 text-[1.1rem] font-semibold text-[#5D2A0A]">
                Match Breakdown — {selectedAcceleratorForBreakdown.name}
              </h3>
              <button onClick={() => setShowMatchBreakdown(false)} className="bg-transparent border-none text-[1.5rem] cursor-pointer text-[#5D2A0A] hover:opacity-70">✖</button>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Overall score */}
              <div className="text-center mb-8 pb-4 border-b-2 border-lightTan">
                <div className="text-5xl font-bold mb-2"
                  style={{ color: selectedAcceleratorForBreakdown.matchPercentage >= 80 ? "#388E3C" : selectedAcceleratorForBreakdown.matchPercentage >= 60 ? "#F57C00" : "#D32F2F" }}>
                  {selectedAcceleratorForBreakdown.matchPercentage || 0}%
                </div>
                <p className="text-base text-lightBrown m-0">Overall Match Score</p>
              </div>

              {/* Breakdown cards */}
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

            {/* Footer */}
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