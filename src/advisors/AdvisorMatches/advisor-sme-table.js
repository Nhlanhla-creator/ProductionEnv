"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { BarChart3, MapPin, Calendar, Filter, X, Info, Eye } from "lucide-react"
import { collection, getDocs, query, where, serverTimestamp, doc, setDoc, getDoc, addDoc } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "../../firebaseConfig"
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { API_KEYS } from "../../API";
import emailjs from '@emailjs/browser';

/* ════════════════════════════════════════════════════════════════════════
   This is the ADVISOR-side table: an advisor reviewing the businesses (SMEs)
   that applied to work with them (rows come from AdvisorApplications where
   advisorId === the signed-in advisor). It is a different component from
   the SME-side "find an advisor" AdvisorTable, but the two must agree on
   what a stage is called and where a match record lives — otherwise a
   stage set here shows up unrecognized over there.

   Two things changed from the old version of this file:

   1. AdvisoryMatches is no longer written to. It was a third collection
      that nothing downstream reads; keeping it in sync with the two real
      records (AdvisorApplications + SmeAdvisorApplications) was just an
      extra way for the data to drift.

   2. The stage vocabulary and doc-id scheme below now match what the
      SME-side AdvisorTable exports (ADVISOR_STATUSES, normalizeAdvisorStatus,
      smeAdvisorId, advisorSmeId, SME_ADVISOR_COLLECTION,
      ADVISOR_SME_COLLECTION). If that file is importable from here, prefer
      `import { ... } from "./path/to/find-advisors/AdvisorTable"` over this
      duplicated copy — until then, keep the two lists identical by hand.
   ════════════════════════════════════════════════════════════════════════ */
const ADVISOR_SME_COLLECTION = "AdvisorApplications"     // advisor's view of the match
const SME_ADVISOR_COLLECTION = "SmeAdvisorApplications"  // SME's view of the match
const advisorSmeId = (advisorId, smeId) => `${advisorId}_${smeId}`
const smeAdvisorId = (smeId, advisorId) => `${smeId}_${advisorId}`

const ADVISOR_STATUSES = [
  "New Match", "Viewed", "Shortlisted", "Contacted", "Under Review",
  "Interviewing", "Accepted", "Engaged/Placed", "Declined", "Closed",
]
const LEGACY_STATUS_ALIASES = {
  Match: "New Match", Matched: "New Match", Confirmed: "Accepted",
  "Deal Successful": "Engaged/Placed", "Deal Declined": "Declined", Pending: "Contacted",
}
const normalizeAdvisorStatus = (s) => LEGACY_STATUS_ALIASES[s] || s || "New Match"

// Stages this table lets the advisor move an application *to*. An
// application arrives here already at "Contacted" (that's what the SME-side
// table sets when the business applies), so the earlier states aren't
// offered — the advisor only moves it forward from there, or out.
const ADVISOR_ACTIONABLE_STAGES = [
  { id: "under_review", name: "Under Review" },
  { id: "interviewing", name: "Interviewing" },
  { id: "accepted", name: "Accepted" },
  { id: "engaged_placed", name: "Engaged/Placed" },
  { id: "declined", name: "Declined" },
  { id: "closed", name: "Closed" },
]

// Which fields a given stage shows in the "Update Stage" modal.
const getStageFields = (stageName) => {
  const baseFields = { showMessage: true, showMeeting: true, showTermSheet: false, showAvailability: false }
  switch (stageName) {
    case "Under Review":
      return { ...baseFields, showAvailability: true }
    case "Interviewing":
      return { ...baseFields, showAvailability: true }
    case "Accepted":
      return { ...baseFields, showAvailability: true, showTermSheet: true }
    case "Engaged/Placed":
      return { ...baseFields, showMeeting: false, showTermSheet: true }
    case "Declined":
      return { ...baseFields, showMeeting: false }
    case "Closed":
      return { ...baseFields, showMeeting: false }
    default:
      return baseFields
  }
}

// How long the "Update Stage" button waits for the server to acknowledge the
// write before handing control back to the user. Firestore persists the
// write locally the instant it's issued and replays it when the connection
// recovers, so past this point there's nothing useful left to block on.
const STAGE_WRITE_GRACE_MS = 6000
const NOTIFICATION_TIMEOUT_MS = 6000

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

const TruncatedText = ({ text, maxLines = 2, maxLength = 25 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span style={{ color: "#999" }}>{text || "-"}</span>
  }

  const shouldTruncate = text.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`

  const toggleExpanded = (e) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div
      style={{
        lineHeight: "1.2",
        maxHeight: isExpanded ? "none" : `${maxLines * 1.2}em`,
        overflow: "hidden",
      }}
    >
      <span
        style={{
          wordBreak: "break-word",
          overflowWrap: "break-word",
          display: "-webkit-box",
          WebkitLineClamp: isExpanded ? "none" : maxLines,
          WebkitBoxOrient: "vertical",
          overflow: isExpanded ? "visible" : "hidden",
        }}
      >
        {displayText}
      </span>
      {shouldTruncate && (
        <button
          style={{
            background: "none",
            border: "none",
            color: "#a67c52",
            cursor: "pointer",
            fontSize: "0.6rem",
            marginLeft: "4px",
            textDecoration: "underline",
            padding: "0",
            display: "block",
            marginTop: "2px",
          }}
          onClick={toggleExpanded}
        >
          {isExpanded ? "Less" : "See more"}
        </button>
      )}
    </div>
  )
}

const getScoreColor = (score) => {
  if (score >= 80) return "#22c55e"
  if (score >= 60) return "#f59e0b"
  return "#ef4444"
}

const STATUS_TYPES = {
  "New Match": { color: "#F5F0E1", textColor: "#7D5A50" },
  Viewed: { color: "#EFEBE9", textColor: "#5D4037" },
  Shortlisted: { color: "#FFF3E0", textColor: "#F57C00" },
  Contacted: { color: "#E8EAF6", textColor: "#3949AB" },
  "Under Review": { color: "#E3F2FD", textColor: "#1565C0" },
  Interviewing: { color: "#F3E5F5", textColor: "#7B1FA2" },
  Accepted: { color: "#E8F5E8", textColor: "#388E3C" },
  "Engaged/Placed": { color: "#E0F2F1", textColor: "#00695C" },
  Declined: { color: "#FFEBEE", textColor: "#D32F2F" },
  Closed: { color: "#EEEEEE", textColor: "#616161" },
}

const getStatusStyle = (status) => {
  return STATUS_TYPES[normalizeAdvisorStatus(status)] || { color: "#F5F5F5", textColor: "#666666" }
}

// Converts proposed availability into the shape the SME's calendar expects,
// including the start time folded into the Date itself (the SME calendar
// reads slot.date.getHours()). Mirrors SupportSMETable's version exactly —
// keep the two in sync.
const buildMeetingAvailableDates = (availabilityList, fallbackMeetingTime, timeZone) => {
  const slots = []

  if (Array.isArray(availabilityList) && availabilityList.length > 0) {
    availabilityList.forEach((availability) => {
      if (!availability?.date) return
      const date = availability.date instanceof Date ? new Date(availability.date) : new Date(availability.date)
      if (isNaN(date.getTime())) return

      const timeSlots = Array.isArray(availability.timeSlots) ? availability.timeSlots : []
      const firstTime = timeSlots[0]
      if (firstTime?.start) {
        const [hour, minute] = firstTime.start.split(":").map(Number)
        if (Number.isFinite(hour) && Number.isFinite(minute)) date.setHours(hour, minute, 0, 0)
      }

      slots.push({
        date: date.toISOString(),
        timeSlots,
        timeZone: availability.timeZone || timeZone,
        status: "available",
      })
    })
    return slots
  }

  if (fallbackMeetingTime) {
    const startDate = new Date(fallbackMeetingTime)
    if (!isNaN(startDate.getTime())) {
      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000)
      const pad = (number) => String(number).padStart(2, "0")
      slots.push({
        date: startDate.toISOString(),
        timeSlots: [{ start: `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`, end: `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}` }],
        timeZone,
        status: "available",
      })
    }
  }

  return slots
}

// Resolves the advisor's display name from advisorProfiles, then writes the
// inbox + sent message pair. Mirrors SupportSMETable's sendMessageToSME.
const sendMessageToSME = async ({ advisorUser, sme, applicationId, subject, content, attachments = [], attachmentNames = [] }) => {
  if (!content?.trim() && attachments.length === 0) return null

  let advisorName = advisorUser.displayName || advisorUser.email?.split("@")[0] || "Advisor"

  try {
    const profileSnap = await getDoc(doc(db, "advisorProfiles", advisorUser.uid))
    if (profileSnap.exists()) {
      const contact = profileSnap.data().formData?.contactDetails || {}
      const fullName = `${contact.name || ""} ${contact.surname || ""}`.trim()
      advisorName = fullName || advisorName
    }
  } catch (error) {
    console.error("Could not load Advisor name:", error)
  }

  const messagePayload = {
    from: advisorUser.uid,
    fromName: advisorName,
    to: sme.userId || sme.id,
    toName: sme.name,
    subject,
    content: content || "",
    attachments,
    attachmentNames,
    date: new Date().toISOString(),
    applicationId,
  }

  await Promise.all([
    addDoc(collection(db, "messages"), { ...messagePayload, type: "inbox", read: false, sender: advisorName }),
    addDoc(collection(db, "messages"), { ...messagePayload, type: "sent", read: true, sender: "You" }),
  ])

  return advisorName
}

export function AdvisorTable({ filters, stageFilter, onMatchesCountChange }) {
  const [advisors, setAdvisors] = useState([])
  const [selectedAdvisor, setSelectedAdvisor] = useState(null)
  const [modalType, setModalType] = useState(null)
  const [message, setMessage] = useState("")
  const [meetingTime, setMeetingTime] = useState("")
  const [meetingLocation, setMeetingLocation] = useState("")
  const [meetingPurpose, setMeetingPurpose] = useState("")
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nextStage, setNextStage] = useState("")
  const [showStageModal, setShowStageModal] = useState(false)
  const [selectedAdvisorForStage, setSelectedAdvisorForStage] = useState(null)
  // Rows whose write is still in flight with the server, keyed by smeId.
  const [syncingRows, setSyncingRows] = useState({})
  const [availabilities, setAvailabilities] = useState([])
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [tempDates, setTempDates] = useState([])
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" })
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [bigScoreData, setBigScoreData] = useState({
    pis: { score: 0, color: "#4E342E" },
    compliance: { score: 0, color: "#8D6E63" },
    legitimacy: { score: 0, color: "#5D4037" },
    fundability: { score: 0, color: "#3E2723" },
    leadership: { score: 0, color: "#4E342E" },
  })
  const [showFilters, setShowFilters] = useState(false)
  const [localFilters, setLocalFilters] = useState({
    location: "",
    matchScore: 50,
    minValue: "",
    maxValue: "",
    instruments: [],
    stages: [],
    sectors: [],
    supportTypes: [],
    smeType: "",
    sortBy: "",
  })
  const [termSheetFile, setTermSheetFile] = useState(null)

  // Guards setState calls that resolve after unmount (a slow write can
  // outlive the screen it was started from).
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  // Notifications clear themselves rather than sitting on screen forever.
  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => {
      if (isMountedRef.current) setNotification(null)
    }, NOTIFICATION_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [notification])

  const modalHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    paddingBottom: "16px",
    borderBottom: "2px solid #E8D5C4"
  }

  const modalTitleStyle = {
    fontSize: "28px",
    fontWeight: "800",
    color: "#3e2723",
    margin: 0
  }

  const modalCloseButtonStyle = {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#666",
    padding: "4px",
    borderRadius: "4px",
    transition: "color 0.2s ease"
  }

  const modalBodyStyle = {
    marginBottom: "24px",
    maxHeight: "400px",
    overflowY: "auto"
  }

  const modalActionsStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #E8D5C4"
  }

  const cancelButtonStyle = {
    padding: "12px 24px",
    backgroundColor: "#e6d7c3",
    color: "#4a352f",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "16px",
    transition: "all 0.2s ease"
  }

  const loadApplicationAvailability = (application) => {
    if (application.availableDates) {
      const appAvailabilities = application.availableDates.map((avail) => ({
        ...avail,
        date: new Date(avail.date),
      }))
      setAvailabilities(appAvailabilities)
    } else {
      setAvailabilities([])
    }
  }

  const handleDateSelect = (dates) => {
    setTempDates(dates || [])
  }

  const handleTimeChange = (field, value) => {
    setTimeSlot((prev) => ({ ...prev, [field]: value }))
  }

  const saveSelectedDates = async () => {
    const newAvailabilities = [
      ...availabilities,
      ...tempDates
        .filter((date) => !availabilities.some((a) => a.date.getTime() === date.getTime()))
        .map((date) => ({
          date,
          timeSlots: [{ ...timeSlot }],
          timeZone,
          status: "available",
        })),
    ]

    setAvailabilities(newAvailabilities)

    if (selectedAdvisor) {
      try {
        const availabilityData = newAvailabilities.map((avail) => ({
          date: avail.date.toISOString(),
          timeSlots: avail.timeSlots,
          timeZone: avail.timeZone,
          status: avail.status,
        }))

        const advisorId = auth.currentUser.uid
        const smeId = selectedAdvisor.id

        // setDoc + merge, not updateDoc — updateDoc rejects outright on a
        // document that doesn't exist yet.
        await Promise.all([
          setDoc(doc(db, ADVISOR_SME_COLLECTION, advisorSmeId(advisorId, smeId)), {
            availableDates: availabilityData,
            updatedAt: new Date().toISOString(),
          }, { merge: true }),
          setDoc(doc(db, SME_ADVISOR_COLLECTION, smeAdvisorId(smeId, advisorId)), {
            availableDates: availabilityData,
            updatedAt: new Date().toISOString(),
          }, { merge: true }),
        ])
      } catch (error) {
        console.error("Error updating availabilities:", error)
        setNotification({
          type: "error",
          message: "Failed to update availability dates",
        })
      }
    }

    setTempDates([])
    setShowCalendarModal(false)
  }

  const removeAvailability = async (dateToRemove) => {
    const updatedAvailabilities = availabilities.filter((item) => item.date.getTime() !== dateToRemove.getTime())

    setAvailabilities(updatedAvailabilities)

    if (selectedAdvisor) {
      try {
        const availabilityData = updatedAvailabilities.map((avail) => ({
          date: avail.date.toISOString(),
          timeSlots: avail.timeSlots,
          timeZone: avail.timeZone,
        }))

        const advisorId = auth.currentUser.uid
        const smeId = selectedAdvisor.id

        await Promise.all([
          setDoc(doc(db, ADVISOR_SME_COLLECTION, advisorSmeId(advisorId, smeId)), {
            availableDates: availabilityData,
            updatedAt: new Date().toISOString(),
          }, { merge: true }),
          setDoc(doc(db, SME_ADVISOR_COLLECTION, smeAdvisorId(smeId, advisorId)), {
            availableDates: availabilityData,
            updatedAt: new Date().toISOString(),
          }, { merge: true }),
        ])
      } catch (error) {
        console.error("Error updating availabilities:", error)
        setNotification({
          type: "error",
          message: "Failed to update availability dates",
        })
      }
    }
  }

  const hasAvailability = (advisor) => {
    return advisor.availableDates && advisor.availableDates.length > 0
  }

  useEffect(() => {
    const fetchAdvisorApplications = async () => {
      const user = auth.currentUser
      if (!user) return

      try {
        const advisorId = user.uid
        const q = query(collection(db, ADVISOR_SME_COLLECTION), where("advisorId", "==", advisorId))
        const snapshot = await getDocs(q)
        const advisorMatches = snapshot.docs.map((doc) => {
          const data = doc.data()
          setBigScoreData({
            pis: { score: data.pis || 0, color: getScoreColor(data.pis || 0) },
            compliance: { score: data.compliance || 0, color: getScoreColor(data.compliance || 0) },
            legitimacy: { score: data.legitimacy || 0, color: getScoreColor(data.legitimacy || 0) },
            fundability: { score: data.fundability || 0, color: getScoreColor(data.fundability || 0) },
            leadership: { score: data.leadership || 0, color: getScoreColor(data.leadership || 0) },
          })

          const availabilityData = data.availableDates ? data.availableDates.map((avail) => ({
            ...avail,
            date: new Date(avail.date),
          })) : []

          const normalizedStatus = normalizeAdvisorStatus(data.status || "New Match")

          return {
            id: data.smeId,
            userId: data.smeUserId || data.smeId,
            name: data.smeName,
            location: data.smeLocation,
            sector: data.smeSector,
            fundingStage: data.smeStage,
            supportRequired: data.smeSupport,
            bigScore: data.bigScore,
            revenueBand: data.revenue || "N/A",
            compensationModel: data.advisorCompensationModel,
            applicationDate: data.createdAt?.toDate().toLocaleDateString() || "N/A",
            matchPercentage: data.matchPercentage || 70,
            matchBreakdown: data.breakdown || {},
            status: normalizedStatus,
            pipelineStage: normalizedStatus,
            availableDates: availabilityData,
          }
        })

        setAdvisors(advisorMatches)
        setLoading(false)

        if (onMatchesCountChange) {
          onMatchesCountChange(advisorMatches.length)
        }
      } catch (error) {
        console.error("Failed to fetch advisor applications:", error)
        setAdvisors([])
        setLoading(false)

        if (onMatchesCountChange) {
          onMatchesCountChange(0)
        }
      }
    }

    fetchAdvisorApplications()
  }, [onMatchesCountChange])

  const handleFilterChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setLocalFilters({
      location: "",
      matchScore: 50,
      minValue: "",
      maxValue: "",
      instruments: [],
      stages: [],
      sectors: [],
      supportTypes: [],
      smeType: "",
      sortBy: "",
    })
  }

  const applyFilters = () => {
    setShowFilters(false)
  }

  const handleStageAction = (advisor) => {
    setSelectedAdvisorForStage(advisor)
    setShowStageModal(true)
    setNextStage("")
    setMessage("")
    setMeetingTime("")
    setMeetingLocation("")
    setMeetingPurpose("")
    setTermSheetFile(null)
    setFormErrors({})

    loadApplicationAvailability(advisor)
  }

  const breakdownItemStyle = (matched, label) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    background: matched ? '#E8F5E8' : '#FFEBEE',
    borderRadius: '6px',
    color: matched ? '#388E3C' : '#D32F2F',
    fontSize: '0.875rem',
    marginBottom: '0.5rem',
    borderLeft: `4px solid ${matched ? '#388E3C' : '#D32F2F'}`
  })

  const resetStageModal = () => {
    setSelectedAdvisorForStage(null)
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

  // Optimistic stage move: paints the new status straight into local state,
  // so the row responds the instant the advisor confirms rather than after
  // the server replies.
  const applyLocalStatus = useCallback((smeId, status) => {
    setAdvisors((prev) => prev.map((a) => (a.id === smeId ? { ...a, status, pipelineStage: status } : a)))
  }, [])

  // Puts the row back if the server ultimately rejects the write.
  const revertLocalStatus = useCallback((smeId, previousStatus) => {
    setAdvisors((prev) => prev.map((a) => (a.id === smeId ? { ...a, status: previousStatus, pipelineStage: previousStatus } : a)))
  }, [])

  const markSyncing = useCallback((smeId, value) => {
    setSyncingRows((prev) => {
      if (value) return { ...prev, [smeId]: true }
      const { [smeId]: _dropped, ...rest } = prev
      return rest
    })
  }, [])

  const handleStageUpdate = async () => {
    const sme = selectedAdvisorForStage
    if (!sme) return

    const stageFields = getStageFields(nextStage)
    const errors = {}

    if (!nextStage) {
      errors.nextStage = "Please select a stage"
    }
    if (stageFields.showMessage && !message.trim()) {
      errors.message = "Please provide a message"
    }

    // A meeting request is enabled when this stage exposes either the
    // meeting section or the availability section, and only fires if the
    // advisor actually proposed a date/time.
    const meetingFeatureEnabled = stageFields.showMeeting || stageFields.showAvailability
    const hasMeetingSlot = Boolean(meetingTime) || availabilities.length > 0
    const meetingRequested = meetingFeatureEnabled && hasMeetingSlot
    const proposedMeetingSlots = buildMeetingAvailableDates(availabilities, meetingTime, timeZone)

    if (meetingRequested) {
      if (stageFields.showMeeting) {
        if (!meetingLocation.trim()) errors.meetingLocation = "Please provide a meeting location"
        if (!meetingPurpose.trim()) errors.meetingPurpose = "Please provide a meeting purpose"
      }
      if (proposedMeetingSlots.length === 0) {
        errors.availabilities = "Please propose at least one meeting date and time"
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const user = auth.currentUser
    if (!user) {
      setNotification({ type: "error", message: "You've been signed out. Please sign in again." })
      return
    }

    const advisorId = user.uid
    const smeId = sme.id
    const previousStatus = sme.status
    const chosenStage = nextStage
    const messageText = message
    const meetingLoc = meetingLocation?.trim() || "Virtual"
    const meetingPurp = meetingPurpose?.trim() || "Advisory Meeting"
    const termSheetFileToUpload = termSheetFile

    const documentId = advisorSmeId(advisorId, smeId)
    const smeDocumentId = smeAdvisorId(smeId, advisorId)

    setIsSubmitting(true)

    const performWrite = async () => {
      const basePayload = {
        advisorId,
        smeId,
        smeName: sme.name,
        status: chosenStage,
        pipelineStage: chosenStage,
        updatedAt: serverTimestamp(),
        lastActivity: new Date().toISOString(),
        ...(messageText && { lastMessage: messageText }),
      }

      let attachmentUrl = null
      if (stageFields.showTermSheet && termSheetFileToUpload) {
        const storageRef = ref(storage, `advisor_termsheets/${smeId}/${Date.now()}_${termSheetFileToUpload.name}`)
        const snap = await uploadBytes(storageRef, termSheetFileToUpload)
        attachmentUrl = await getDownloadURL(snap.ref)
        basePayload.termSheetUrl = attachmentUrl
        basePayload.termSheetName = termSheetFileToUpload.name
      }

      // Resolve the advisor's display name once, reused for the calendar
      // event, the in-app message and the email notification.
      let advisorName = user.displayName || user.email?.split("@")[0] || "Advisor"
      try {
        const profileSnap = await getDoc(doc(db, "advisorProfiles", advisorId))
        if (profileSnap.exists()) {
          const contact = profileSnap.data().formData?.contactDetails || {}
          advisorName = `${contact.name || ""} ${contact.surname || ""}`.trim() || advisorName
        }
      } catch (err) {
        console.warn("Could not load advisor display name:", err)
      }

      if (meetingRequested) {
        // Deterministic ID so a retried write can't create duplicate
        // meeting requests.
        const meetingEventId = `advisor_${documentId}`

        const calendarEvent = {
          smeId: sme.userId || smeId,
          smeName: sme.name,
          advisorId,
          requesterId: advisorId,
          requesterName: advisorName,
          requesterType: "Advisor",
          createdBy: advisorId,
          createdByName: advisorName,
          advisorApplicationId: documentId,
          applicationId: documentId,
          title: meetingPurp,
          purpose: meetingPurp,
          description: messageText?.trim() || `Meeting request from ${advisorName}`,
          location: meetingLoc,
          availableDates: proposedMeetingSlots,
          timeZone: proposedMeetingSlots[0]?.timeZone || timeZone,
          status: "pending",
          meetingStatus: "pending",
          requestType: "meeting_request",
          source: "advisor",
          isInvitation: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }

        await setDoc(doc(db, "smeCalendarEvents", meetingEventId), calendarEvent, { merge: true })

        basePayload.meetingRequestId = meetingEventId
        basePayload.meetingStatus = "pending"
        basePayload.meetingDetails = {
          time: meetingTime,
          location: meetingLoc,
          purpose: meetingPurp,
          availableDates: proposedMeetingSlots,
        }
      }

      // setDoc + merge, not updateDoc — updateDoc rejects outright when the
      // document doesn't exist yet, which used to surface as a silent
      // failure whenever the application record hadn't been created with
      // exactly this ID.
      await Promise.all([
        setDoc(doc(db, ADVISOR_SME_COLLECTION, documentId), basePayload, { merge: true }),
        setDoc(doc(db, SME_ADVISOR_COLLECTION, smeDocumentId), basePayload, { merge: true }),
      ])

      if (messageText?.trim()) {
        try {
          const subject = meetingRequested
            ? `Meeting Request - ${sme.name}`
            : `Application Update: ${chosenStage}`
          const content = meetingRequested
            ? `${messageText}\n\nA meeting has been requested.\n\nPurpose: ${meetingPurp}\nLocation: ${meetingLoc}\n\nPlease open your Calendar to select and confirm one of the proposed time slots.`
            : messageText
          await sendMessageToSME({ advisorUser: user, sme, applicationId: documentId, subject, content })
        } catch (messageError) {
          console.error("Stage saved but in-app message failed:", messageError)
        }
      }

      // Best-effort email notification — never blocks or fails the stage
      // update itself.
      try {
        const emailjsConfig = {
          serviceId: API_KEYS.SERVICE_ID_MESSAGES,
          templateId: API_KEYS.TEMPLATE_ID_MESSAGES,
          publicKey: API_KEYS.PUBLIC_KEY_ID_MESSAGES,
        }
        if (!window.emailjs) {
          emailjs.init(emailjsConfig.publicKey)
          window.emailjs = emailjs
        }

        let smeEmail = null
        try {
          const universalProfileSnap = await getDoc(doc(db, "universalProfiles", smeId))
          if (universalProfileSnap.exists()) {
            const profileData = universalProfileSnap.data()
            smeEmail = profileData.email ||
              profileData.contactDetails?.email ||
              profileData.contactEmail ||
              profileData.businessEmail ||
              profileData.personalEmail
          }
        } catch (fetchError) {
          console.error("Error fetching SME email:", fetchError)
        }
        if (!smeEmail) smeEmail = "support@bigmarketplace.africa"

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (emailRegex.test(smeEmail)) {
          let emailMessage = chosenStage === "Declined"
            ? `Dear ${sme.name},\n\nWe regret to inform you that your application has been moved to the "${chosenStage}" stage.\n\n`
            : `Dear ${sme.name},\n\nYour application has progressed to the "${chosenStage}" stage.\n\n`

          if (messageText) emailMessage += `Message from ${advisorName}:\n${messageText}\n\n`

          if (meetingRequested) {
            emailMessage += `Meeting Details:\n- Location: ${meetingLoc}\n- Purpose: ${meetingPurp}\n\n`
            emailMessage += `Available Meeting Times:\n`
            proposedMeetingSlots.forEach((slot, idx) => {
              const slotDate = new Date(slot.date)
              const dateStr = slotDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
              const timeStr = slot.timeSlots?.[0] ? `${slot.timeSlots[0].start} - ${slot.timeSlots[0].end} ${slot.timeZone}` : "Time not specified"
              emailMessage += `${idx + 1}. ${dateStr} (${timeStr})\n`
            })
            emailMessage += `\nPlease reply with your preferred meeting time from the above options.\n\n`
          }

          emailMessage += `Best regards,\n${advisorName}\nBIG Marketplace Africa`

          const templateParams = {
            to_email: smeEmail,
            subject: `Application Stage Update: ${chosenStage}`,
            from_name: advisorName,
            date: new Date().toLocaleDateString(),
            message: emailMessage,
            portal_url: `https://www.bigmarketplace.africa/applications/${documentId}`,
            has_attachments: attachmentUrl ? "true" : "false",
            attachments_count: attachmentUrl ? "1" : "0",
          }

          await window.emailjs.send(emailjsConfig.serviceId, emailjsConfig.templateId, templateParams, emailjsConfig.publicKey)
        }
      } catch (emailError) {
        console.error("Email notification failed:", emailError)
      }
    }

    const tracked = performWrite().then(() => ({ status: "ok" })).catch((error) => ({ status: "error", error }))

    // Optimistic: the row moves now, not after the round trip.
    applyLocalStatus(smeId, chosenStage)
    markSyncing(smeId, true)

    const outcome = await Promise.race([
      tracked,
      new Promise((resolve) => setTimeout(() => resolve({ status: "pending" }), STAGE_WRITE_GRACE_MS)),
    ])

    if (!isMountedRef.current) return

    setIsSubmitting(false)
    setShowStageModal(false)
    resetStageModal()

    if (outcome.status === "ok") {
      markSyncing(smeId, false)
      setNotification({ type: "success", message: `${sme.name} moved to ${chosenStage} successfully` })
      return
    }

    if (outcome.status === "error") {
      markSyncing(smeId, false)
      revertLocalStatus(smeId, previousStatus)
      console.error("Detailed error:", outcome.error)
      setNotification({ type: "error", message: `Failed to update status: ${outcome.error?.message || "unknown error"}` })
      return
    }

    // Still pending — Firestore has the write queued locally and will replay
    // it as soon as the connection allows, so let the advisor carry on and
    // only come back to them if it eventually fails.
    setNotification({ type: "info", message: `${sme.name} moved to ${chosenStage} — still syncing to the server.` })

    tracked.then((result) => {
      if (!isMountedRef.current) return
      markSyncing(smeId, false)
      if (result.status === "error") {
        revertLocalStatus(smeId, previousStatus)
        console.error("Stage update error (deferred):", result.error)
        setNotification({ type: "error", message: `${sme.name} couldn't be saved and has been put back to ${previousStatus}.` })
      } else {
        setNotification({ type: "success", message: `${sme.name} moved to ${chosenStage} successfully` })
      }
    })
  }

  const handleViewDetails = (advisor) => {
    setSelectedAdvisor(advisor)
    setModalType("view")
  }

  const handleBigScoreClick = (advisor) => {
    setSelectedAdvisor(advisor)
    setModalType("bigScore")
  }

  const handleScoreBreakdown = (advisor) => {
    setSelectedAdvisor(advisor)
    setModalType("scoreBreakdown")
  }

  const resetModal = () => {
    setSelectedAdvisor(null)
    setModalType(null)
    setMessage("")
    setMeetingTime("")
    setMeetingLocation("")
    setMeetingPurpose("")
    setFormErrors({})
  }

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(62, 39, 35, 0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    animation: "fadeIn 0.3s ease-out",
    backdropFilter: "blur(4px)",
  }

  const modalContentStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "40px",
    maxWidth: "900px",
    width: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    border: "none",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
    position: "relative",
  }

  const tableHeaderStyle = {
    background: "#4a352f",
    color: "#faf7f2",
    padding: "0.75rem",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "0.72rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    position: "sticky",
    top: "0",
    zIndex: "10",
    borderBottom: "1px solid #5d4037",
    borderRight: "1px solid #6b5148",
    lineHeight: "1.25",
    verticalAlign: "middle",
  }

  const tableCellStyle = {
    padding: "0.75rem",
    borderBottom: "1px solid #e6d7c3",
    borderRight: "1px solid #f0e6da",
    fontSize: "0.8rem",
    verticalAlign: "top",
    color: "#4a352f",
    lineHeight: "1.35",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  }

  const matchContainerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.2rem",
  }

  const progressBarStyle = {
    width: "52px",
    height: "5px",
    background: "#e6d7c3",
    borderRadius: "999px",
    overflow: "hidden",
  }

  const progressFillStyle = {
    height: "100%",
    background: "linear-gradient(90deg, #48BB78, #68d391)",
    transition: "width 0.3s ease",
  }

  const matchScoreStyle = {
    fontWeight: "600",
    color: "#5D2A0A",
    fontSize: "0.7rem",
  }

  const statusBadgeStyle = {
    padding: "0.3rem 0.55rem",
    borderRadius: "999px",
    fontSize: "0.68rem",
    fontWeight: "600",
    display: "inline-block",
    whiteSpace: "nowrap",
  }

  if (loading) {
    return (
      <div className="w-full p-6">
        <div className="rounded-2xl border border-[#e6d7c3] bg-white p-12 text-center text-sm font-medium text-[#7d5a50] shadow-sm">
          Loading business applications...
        </div>
      </div>
    )
  }

  const currentStageFields = getStageFields(nextStage)

  return (
    <div className="w-full space-y-4 p-6" style={{ maxWidth: "100vw", overflowX: "hidden" }}>
      <div className="flex items-center justify-between gap-4 rounded-t-2xl border border-b-0 border-[#e6d7c3] bg-[#faf7f2] p-4 shadow-sm">

        <button
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7d5a50] to-[#4a352f] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-lg"
        >
          <Filter size={14} />
          Filter Applications
        </button>
      </div>

      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium ${
            notification.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : notification.type === "info"
                ? "border-[#e8c99a] bg-[#fff8ed] text-[#8a5a12]"
                : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 text-current opacity-50 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      <div
        className="overflow-x-auto rounded-b-2xl border border-[#e6d7c3] bg-white shadow-lg"
        style={{
          width: "100%",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            fontSize: "0.8rem",
            backgroundColor: "#ffffff",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: "8%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "13%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>
                SMSE
                <br />
                Name
              </th>
              <th style={tableHeaderStyle}>Location</th>
              <th style={tableHeaderStyle}>Sector</th>
              <th style={tableHeaderStyle}>
                Funding
                <br />
                Stage
              </th>
              <th style={tableHeaderStyle}>
                Support
                <br />
                Required
              </th>
              <th style={tableHeaderStyle}>
                Revenue
                <br />
                Band
              </th>
              <th style={tableHeaderStyle}>
                Compensation
                <br />
                Model
              </th>
              <th style={tableHeaderStyle}>
                Application
                <br />
                Date
              </th>
              <th style={tableHeaderStyle}>Match %</th>
              <th style={tableHeaderStyle}>BIG Score</th>
              <th style={tableHeaderStyle}>Status</th>
              <th style={{ ...tableHeaderStyle, borderRight: "none" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {advisors.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f5f0e1]">
                      <Info size={32} className="text-[#7d5a50] opacity-50" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-[#4a352f]">No Business Applications Yet</p>
                      <p className="mt-1 text-sm text-[#7d5a50]">
                        Businesses that apply to work with you will appear here.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              advisors.map((advisor) => {
                const currentStatus = normalizeAdvisorStatus(advisor.pipelineStage || advisor.status)
                const statusStyle = getStatusStyle(currentStatus)
                const isSyncing = !!syncingRows[advisor.id]
                return (
                  <tr key={advisor.id} className="transition-colors hover:bg-[#fdf8f4]" style={{ borderBottom: "1px solid #e6d7c3" }}>
                    <td style={tableCellStyle}>
                      <button
                        onClick={() => handleViewDetails(advisor)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#a67c52",
                          textDecoration: "underline",
                          cursor: "pointer",
                          fontWeight: "500",
                          padding: "0",
                          fontSize: "0.80rem",
                          textAlign: "left",
                          wordBreak: "break-word",
                          width: "100%",
                          lineHeight: "1.2",
                        }}
                      >
                        {advisor.name}
                      </button>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "0.8rem" }}>
                        <MapPin size={8} />
                        <span style={{ wordBreak: "break-word" }}>{advisor.location}</span>
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={advisor.sector} maxLines={2} maxLength={20} />
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={advisor.fundingStage} maxLength={15} />
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={advisor.supportRequired} maxLength={20} />
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={advisor.revenueBand} maxLength={12} />
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={advisor.compensationModel} maxLength={15} />
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "0.7rem" }}>
                        <Calendar size={8} />
                        <span style={{ wordBreak: "break-word" }}>{advisor.applicationDate}</span>
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={matchContainerStyle}>
                        <div style={progressBarStyle}>
                          <div style={{
                            ...progressFillStyle,
                            width: `${advisor.matchPercentage}%`
                          }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={matchScoreStyle}>{advisor.matchPercentage}%</span>
                          <Eye
                            size={14}
                            style={{ cursor: 'pointer', color: '#a67c52' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAdvisor(advisor);
                              setModalType("matchBreakdown");
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={matchContainerStyle}>
                        <div style={progressBarStyle}>
                          <div
                            style={{
                              ...progressFillStyle,
                              width: `${advisor.bigScore}%`,
                              background: `linear-gradient(90deg, ${getScoreColor(advisor.bigScore)}, ${getScoreColor(advisor.bigScore)}aa)`,
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{
                            ...matchScoreStyle,
                            color: getScoreColor(advisor.bigScore)
                          }}>
                            {advisor.bigScore}%
                          </span>
                          <Eye
                            size={14}
                            style={{
                              cursor: 'pointer',
                              color: getScoreColor(advisor.bigScore)
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAdvisor(advisor);
                              setModalType("bigScoreBreakdown");
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <span
                        style={{
                          ...statusBadgeStyle,
                          backgroundColor: statusStyle.color,
                          color: statusStyle.textColor,
                        }}
                      >
                        {currentStatus}
                      </span>
                      {isSyncing && (
                        <div style={{ fontSize: "0.65rem", color: "#a89482", fontStyle: "italic", marginTop: "2px" }}>
                          syncing…
                        </div>
                      )}
                    </td>
                    <td style={{ ...tableCellStyle, borderRight: "none" }}>
                      <button
                        onClick={() => handleStageAction(advisor)}
                        style={{
                          padding: "6px 8px",
                          background: "linear-gradient(135deg, #7d5a50, #4a352f)",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          width: "100%",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Update Stage
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedAdvisor && modalType === "matchBreakdown" && (
        <div style={modalOverlayStyle} onClick={resetModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>
                Match Score Breakdown - {selectedAdvisor.name}
              </h3>
              <button onClick={resetModal} style={modalCloseButtonStyle}>
                ✖
              </button>
            </div>

            <div style={modalBodyStyle}>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: '#5D2A0A', marginBottom: '0.5rem' }}>
                  Match score: {selectedAdvisor.matchPercentage}%
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedAdvisor.matchBreakdown && Object.entries(selectedAdvisor.matchBreakdown).map(([key, criteria]) => (
                    <div key={key} style={breakdownItemStyle(criteria.matched, key)}>
                      <span style={{ fontWeight: '500' }}>{formatLabel(key)}</span>
                      <span>
                        {criteria.matched ? (
                          <span style={{ color: '#388E3C' }}>✓ Matched</span>
                        ) : (
                          <span style={{ color: '#D32F2F' }}>✗ Not matched</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: '#F5EBE0',
                padding: '1rem',
                borderRadius: '8px',
                marginTop: '1rem'
              }}>
                <p style={{ fontSize: '0.875rem', color: '#5D2A0A' }}>
                  This score represents how well this advisor matches your specific needs and criteria.
                </p>
              </div>
            </div>

            <div style={modalActionsStyle}>
              <button
                onClick={resetModal}
                style={cancelButtonStyle}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAdvisor && modalType === "bigScoreBreakdown" && (
        <div style={modalOverlayStyle} onClick={resetModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>
                BIG Score Breakdown - {selectedAdvisor.name}
              </h3>
              <button onClick={resetModal} style={modalCloseButtonStyle}>
                ✖
              </button>
            </div>

            <div style={modalBodyStyle}>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: '#5D2A0A', marginBottom: '0.5rem' }}>
                  BIG Score: {selectedAdvisor.bigScore}%
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {Object.entries(bigScoreData).map(([key, data]) => (
                    <div key={key} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: '#F5F5F5',
                      borderRadius: '6px',
                      color: '#333',
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem',
                      borderLeft: `4px solid ${data.color}`
                    }}>
                      <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                        {key === 'pis' ? 'PIS Score' : key}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '60px',
                          height: '6px',
                          background: '#E0E0E0',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${data.score}%`,
                            height: '100%',
                            background: data.color,
                            borderRadius: '3px'
                          }} />
                        </div>
                        <span style={{
                          fontWeight: '600',
                          color: data.color,
                          minWidth: '35px',
                          textAlign: 'right'
                        }}>
                          {data.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: '#F5EBE0',
                padding: '1rem',
                borderRadius: '8px',
                marginTop: '1rem'
              }}>
                <p style={{ fontSize: '0.875rem', color: '#5D2A0A' }}>
                  The BIG Score evaluates advisory readiness across key dimensions: PIS (Performance Indicators), Compliance, Legitimacy, and Fundability.
                </p>
              </div>
            </div>

            <div style={modalActionsStyle}>
              <button
                onClick={resetModal}
                style={cancelButtonStyle}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showFilters && (
        <div style={modalOverlayStyle} onClick={() => setShowFilters(false)}>
          <div style={{ ...modalContentStyle, maxWidth: "800px" }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}
            >
              <h3 style={{ fontSize: "28px", fontWeight: "800", color: "#3e2723", margin: 0 }}>
                Filter Advisory Applications
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                <X size={24} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#4a352f",
                    marginBottom: "12px",
                  }}
                >
                  Location
                </label>
                <select
                  value={localFilters.location}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #c8b6a6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: "#f5f0e1",
                  }}
                >
                  <option value="">All Locations</option>
                  <option value="cape-town">Cape Town</option>
                  <option value="johannesburg">Johannesburg</option>
                  <option value="durban">Durban</option>
                  <option value="pretoria">Pretoria</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#4a352f",
                    marginBottom: "12px",
                  }}
                >
                  Sector
                </label>
                <select
                  value={localFilters.sectors[0] || ""}
                  onChange={(e) => handleFilterChange("sectors", e.target.value ? [e.target.value] : [])}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #c8b6a6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: "#f5f0e1",
                  }}
                >
                  <option value="">All Sectors</option>
                  <option value="tech">Technology</option>
                  <option value="agri">Agriculture</option>
                  <option value="cleantech">CleanTech</option>
                  <option value="healthtech">HealthTech</option>
                  <option value="edtech">EdTech</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#4a352f",
                    marginBottom: "12px",
                  }}
                >
                  Funding Stage
                </label>
                <select
                  value={localFilters.stages[0] || ""}
                  onChange={(e) => handleFilterChange("stages", e.target.value ? [e.target.value] : [])}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #c8b6a6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: "#f5f0e1",
                  }}
                >
                  <option value="">All Stages</option>
                  <option value="pre-seed">Pre-Seed</option>
                  <option value="seed">Seed</option>
                  <option value="series-a">Series A</option>
                  <option value="series-b">Series B</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#4a352f",
                    marginBottom: "12px",
                  }}
                >
                  Minimum Match Score: {localFilters.matchScore}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localFilters.matchScore}
                  onChange={(e) => handleFilterChange("matchScore", Number.parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    height: "8px",
                    borderRadius: "4px",
                    background: "#e6d7c3",
                    outline: "none",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "#7d5a50",
                    marginTop: "4px",
                  }}
                >
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
              <button
                onClick={clearFilters}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#e6d7c3",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <X size={16} />
                Clear All
              </button>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setShowFilters(false)}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#c8b6a6",
                    color: "#4a352f",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={applyFilters}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#a67c52",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Filter size={16} />
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedAdvisor && modalType === "view" && (
        <div style={modalOverlayStyle} onClick={resetModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}
            >
              <h3 style={{ fontSize: "28px", fontWeight: "800", color: "#3e2723", margin: 0 }}>
                {selectedAdvisor.name} - Application Details
              </h3>
              <button
                onClick={resetModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                <X size={24} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
              <div>
                <h4 style={{ fontSize: "18px", fontWeight: "600", color: "#4a352f", marginBottom: "16px" }}>
                  Basic Information
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <strong>Location:</strong> {selectedAdvisor.location}
                  </div>
                  <div>
                    <strong>Sector:</strong> {selectedAdvisor.sector}
                  </div>
                  <div>
                    <strong>Application Date:</strong> {selectedAdvisor.applicationDate}
                  </div>
                  <div>
                    <strong>Status:</strong> {normalizeAdvisorStatus(selectedAdvisor.status)}
                  </div>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: "18px", fontWeight: "600", color: "#4a352f", marginBottom: "16px" }}>
                  Business Details
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <strong>Funding Stage:</strong> {selectedAdvisor.fundingStage}
                  </div>
                  <div>
                    <strong>Revenue Band:</strong> {selectedAdvisor.revenueBand}
                  </div>
                  <div>
                    <strong>Compensation Model:</strong> {selectedAdvisor.compensationModel}
                  </div>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: "18px", fontWeight: "600", color: "#4a352f", marginBottom: "16px" }}>
                  Support Requirements
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <strong>Support Required:</strong> {selectedAdvisor.supportRequired}
                  </div>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: "18px", fontWeight: "600", color: "#4a352f", marginBottom: "16px" }}>
                  Evaluation Scores
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <strong>Match Score:</strong>{" "}
                    <span style={{ color: getScoreColor(selectedAdvisor.matchPercentage) }}>
                      {selectedAdvisor.matchPercentage}%
                    </span>
                  </div>
                  <div>
                    <strong>BIG Score:</strong>{" "}
                    <span style={{ color: getScoreColor(selectedAdvisor.bigScore) }}>{selectedAdvisor.bigScore}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}>
              <button
                onClick={() => handleBigScoreClick(selectedAdvisor)}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#a67c52",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <BarChart3 size={16} />
                View BIG Score Breakdown
              </button>
              <button
                onClick={resetModal}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#e6d7c3",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAdvisor && modalType === "bigScore" && (
        <div style={modalOverlayStyle} onClick={resetModal}>
          <div style={{ ...modalContentStyle, maxWidth: "1000px" }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}
            >
              <h3 style={{ fontSize: "32px", fontWeight: "800", color: "#3e2723", margin: 0 }}>BIG Score Breakdown</h3>
              <div
                style={{
                  backgroundColor: getScoreColor(selectedAdvisor.bigScore),
                  color: "white",
                  borderRadius: "50%",
                  width: "100px",
                  height: "100px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  fontWeight: "800",
                  boxShadow: "0 12px 32px rgba(93, 64, 55, 0.4)",
                }}
              >
                {selectedAdvisor.bigScore}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#f8f5f3",
                padding: "24px",
                borderRadius: "16px",
                marginBottom: "32px",
                border: "2px solid #8d6e63",
              }}
            >
              <p
                style={{
                  fontSize: "20px",
                  color: "#5d4037",
                  marginBottom: "16px",
                  lineHeight: "1.6",
                  fontWeight: "500",
                }}
              >
                The BIG Score is a comprehensive evaluation of {selectedAdvisor.name}'s advisory readiness across key
                dimensions:
              </p>
              <div
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#4E342E" }}></div>
                  <span style={{ fontWeight: "600", color: "#3e2723" }}>PIS Score (15%)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#8D6E63" }}></div>
                  <span style={{ fontWeight: "600", color: "#3e2723" }}>Compliance (35%)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#5D4037" }}></div>
                  <span style={{ fontWeight: "600", color: "#3e2723" }}>Legitimacy (15%)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#3E2723" }}></div>
                  <span style={{ fontWeight: "600", color: "#3e2723" }}>Fundability (35%)</span>
                </div>
              </div>
            </div>

            {Object.entries(bigScoreData).map(([key, data]) => (
              <div
                key={key}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "20px",
                  padding: "32px",
                  marginBottom: "24px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
                  border: `2px solid ${data.color}20`,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)"
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "24px",
                        fontWeight: "700",
                        textTransform: "capitalize",
                        color: "#3e2723",
                      }}
                    >
                      {key === "pis" ? "PIS Score" : `${key} Score`}
                    </h4>
                    <p style={{ margin: "8px 0 0 0", fontSize: "16px", color: "#666", fontWeight: "400" }}>
                      {key === "pis" && "Performance indicators and strategic metrics"}
                      {key === "compliance" && "Legal and regulatory documentation completeness"}
                      {key === "legitimacy" && "Professional presentation and market credibility"}
                      {key === "fundability" && "Investment readiness and growth potential"}
                      {key === "leadership" && "Management team quality and experience"}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "36px",
                        fontWeight: "800",
                        color: data.color,
                        textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      {data.score}%
                    </div>
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        backgroundColor: `${data.color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `3px solid ${data.color}`,
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: data.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "20px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "10px",
                    overflow: "hidden",
                    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: `${data.score}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${data.color}, ${data.color}dd)`,
                      borderRadius: "10px",
                      transition: "width 2s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                        animation: "shimmer 2s infinite",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div
              style={{
                backgroundColor: "#f3e5f5",
                padding: "24px",
                borderRadius: "16px",
                marginTop: "32px",
                marginBottom: "32px",
                border: "2px solid #ce93d8",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <Info size={24} style={{ color: "#5d4037" }} />
                <p style={{ margin: 0, color: "#5d4037", fontSize: "16px", lineHeight: "1.5", fontWeight: "500" }}>
                  The BIG Score is calculated using a weighted average: PIS (15%) + Compliance (35%) + Legitimacy (15%)
                  + Fundability (35%)
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={resetModal}
                style={{
                  background: "linear-gradient(135deg, #5d4037 0%, #4e342e 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "16px 32px",
                  fontSize: "18px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(93, 64, 55, 0.3)",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)"
                  e.target.style.boxShadow = "0 8px 24px rgba(93, 64, 55, 0.4)"
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)"
                  e.target.style.boxShadow = "0 4px 16px rgba(93, 64, 55, 0.3)"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAdvisor && modalType === "scoreBreakdown" && (
        <div style={modalOverlayStyle} onClick={resetModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}
            >
              <h3 style={{ fontSize: "28px", fontWeight: "800", color: "#3e2723", margin: 0 }}>
                Score Breakdown - {selectedAdvisor.name}
              </h3>
              <button
                onClick={resetModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "12px",
                  border: `3px solid ${getScoreColor(selectedAdvisor.matchPercentage)}`,
                }}
              >
                <h4 style={{ fontSize: "18px", fontWeight: "600", color: "#4a352f", marginBottom: "16px" }}>
                  Match Score
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div
                    style={{
                      fontSize: "36px",
                      fontWeight: "800",
                      color: getScoreColor(selectedAdvisor.matchPercentage),
                    }}
                  >
                    {selectedAdvisor.matchPercentage}%
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        width: "100%",
                        height: "12px",
                        backgroundColor: "#e9ecef",
                        borderRadius: "6px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${selectedAdvisor.matchPercentage}%`,
                          height: "100%",
                          backgroundColor: getScoreColor(selectedAdvisor.matchPercentage),
                          borderRadius: "6px",
                          transition: "width 1s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: "14px", color: "#666", marginTop: "12px" }}>
                  Overall compatibility between advisor expertise and SMSE needs
                </p>
              </div>

              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "12px",
                  border: `3px solid ${getScoreColor(selectedAdvisor.bigScore)}`,
                }}
              >
                <h4 style={{ fontSize: "18px", fontWeight: "600", color: "#4a352f", marginBottom: "16px" }}>
                  BIG Score
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div
                    style={{
                      fontSize: "36px",
                      fontWeight: "800",
                      color: getScoreColor(selectedAdvisor.bigScore),
                    }}
                  >
                    {selectedAdvisor.bigScore}%
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        width: "100%",
                        height: "12px",
                        backgroundColor: "#e9ecef",
                        borderRadius: "6px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${selectedAdvisor.bigScore}%`,
                          height: "100%",
                          backgroundColor: getScoreColor(selectedAdvisor.bigScore),
                          borderRadius: "6px",
                          transition: "width 1s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: "14px", color: "#666", marginTop: "12px" }}>
                  Comprehensive evaluation across PIS, compliance, legitimacy, and fundability
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h4 style={{ fontSize: "20px", fontWeight: "600", color: "#4a352f", marginBottom: "16px" }}>
                Detailed BIG Score Components
              </h4>
              <div style={{ display: "grid", gap: "16px" }}>
                {Object.entries(bigScoreData).map(([key, data]) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px",
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e9ecef",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          textTransform: "capitalize",
                          marginBottom: "8px",
                        }}
                      >
                        {key === "pis" ? "PIS" : key}
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          backgroundColor: "#f1f3f4",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${data.score}%`,
                            height: "100%",
                            backgroundColor: data.color,
                            borderRadius: "4px",
                            transition: "width 1s ease",
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: data.color,
                        marginLeft: "16px",
                        minWidth: "60px",
                        textAlign: "right",
                      }}
                    >
                      {data.score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}>
              <button
                onClick={() => handleBigScoreClick(selectedAdvisor)}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#a67c52",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <BarChart3 size={16} />
                View Full BIG Score
              </button>
              <button
                onClick={resetModal}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#e6d7c3",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showCalendarModal && (
        <div style={{ ...modalOverlayStyle, zIndex: 1100 }} onClick={() => setShowCalendarModal(false)}>
          <div style={{ ...modalContentStyle, maxWidth: "800px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#3e2723", margin: 0 }}>
                Select Available Dates
              </h3>
              <button
                onClick={() => setShowCalendarModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
                Time Zone
              </label>
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              >
                <option value="Africa/Johannesburg">South Africa Time (SAST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
                Time Slot
              </label>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "4px" }}>Start Time</label>
                  <input
                    type="time"
                    value={timeSlot.start}
                    onChange={(e) => handleTimeChange("start", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "4px" }}>End Time</label>
                  <input
                    type="time"
                    value={timeSlot.end}
                    onChange={(e) => handleTimeChange("end", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
                Select Dates
              </label>
              <DayPicker
                mode="multiple"
                selected={tempDates}
                onSelect={handleDateSelect}
                fromDate={new Date()}
                styles={{
                  caption: { color: "#4a352f", fontWeight: "bold" },
                  day_selected: { backgroundColor: "#5d4037", color: "white" },
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
                Selected Availability
              </h4>
              {tempDates.length > 0 ? (
                <div style={{
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "12px",
                  maxHeight: "200px",
                  overflowY: "auto"
                }}>
                  {tempDates.map((date, index) => (
                    <div key={index} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0"
                    }}>
                      <span>
                        {date.toLocaleDateString("en-US", {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                        {timeSlot.start && timeSlot.end && (
                          <span style={{ color: "#666", marginLeft: "8px" }}>
                            {timeSlot.start} - {timeSlot.end}
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => setTempDates(tempDates.filter((d, i) => i !== index))}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ff4444",
                          cursor: "pointer",
                          padding: "4px"
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#666", fontStyle: "italic" }}>No dates selected yet</p>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                onClick={() => setShowCalendarModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "transparent",
                  color: "#666",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveSelectedDates}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#5d4037",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
                disabled={tempDates.length === 0}
              >
                Save Availability
              </button>
            </div>
          </div>
        </div>
      )}

      {showStageModal && selectedAdvisorForStage && (
        <div style={modalOverlayStyle} onClick={() => setShowStageModal(false)}>
          <div style={{ ...modalContentStyle, maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#3e2723", margin: "0 0 8px 0" }}>
                Update Application Stage
              </h3>
              <p style={{ fontSize: "16px", color: "#666", margin: 0 }}>{selectedAdvisorForStage.name}</p>
              <p style={{ fontSize: "12px", color: "#a89482", margin: "4px 0 0 0" }}>
                Currently: {normalizeAdvisorStatus(selectedAdvisorForStage.pipelineStage || selectedAdvisorForStage.status)}
              </p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#4a352f",
                  marginBottom: "12px",
                }}
              >
                Select Next Stage:
              </label>
              <select
                value={nextStage}
                onChange={(e) => {
                  setNextStage(e.target.value)
                  if (e.target.value) {
                    setFormErrors({ ...formErrors, nextStage: "" })
                  }
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: formErrors.nextStage ? "2px solid #dc2626" : "2px solid #c8b6a6",
                  borderRadius: "8px",
                  fontSize: "16px",
                  backgroundColor: "#f5f0e1",
                }}
              >
                <option value="">Choose a stage...</option>
                {ADVISOR_ACTIONABLE_STAGES.map((stage) => (
                  <option key={stage.id} value={stage.name}>
                    {stage.name}
                  </option>
                ))}
              </select>
              {formErrors.nextStage && (
                <p style={{ color: "#dc2626", fontSize: "14px", marginTop: "8px" }}>{formErrors.nextStage}</p>
              )}
            </div>

            {nextStage && (
              <>
                {currentStageFields.showMessage && (
                  <div style={{ marginBottom: "24px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#4a352f",
                        marginBottom: "12px",
                      }}
                    >
                      Message to SMSE:
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value)
                        if (e.target.value.trim()) {
                          setFormErrors({ ...formErrors, message: "" })
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: formErrors.message ? "2px solid #dc2626" : "2px solid #c8b6a6",
                        borderRadius: "8px",
                        minHeight: "100px",
                        resize: "vertical",
                        fontSize: "16px",
                        fontFamily: "inherit",
                        backgroundColor: "#f5f0e1",
                      }}
                      placeholder="Enter your message..."
                    />
                    {formErrors.message && (
                      <p style={{ color: "#dc2626", fontSize: "14px", marginTop: "8px" }}>{formErrors.message}</p>
                    )}
                  </div>
                )}
                {currentStageFields.showAvailability && (
                  <div style={{
                    backgroundColor: "#f8f5f3",
                    padding: "20px",
                    borderRadius: "12px",
                    marginBottom: "24px"
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "16px"
                    }}>
                      <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#4a352f" }}>
                        Your Availability
                      </h4>
                      <button
                        onClick={() => setShowCalendarModal(true)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#5d4037",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <Calendar size={14} />
                        Add Dates
                      </button>
                    </div>

                    {availabilities.length > 0 ? (
                      <div style={{
                        border: "1px solid #eee",
                        borderRadius: "8px",
                        maxHeight: "200px",
                        overflowY: "auto"
                      }}>
                        {availabilities.map((availability, index) => (
                          <div key={index} style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 12px",
                            borderBottom: "1px solid #f0f0f0"
                          }}>
                            <div>
                              <div style={{ fontWeight: "500" }}>
                                {availability.date.toLocaleDateString("en-US", {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              {availability.timeSlots?.[0] && (
                                <div style={{ fontSize: "12px", color: "#666" }}>
                                  {availability.timeSlots[0].start} - {availability.timeSlots[0].end} ({availability.timeZone})
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => removeAvailability(availability.date)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ff4444",
                                cursor: "pointer",
                                padding: "4px"
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "#666", fontStyle: "italic" }}>No availability slots added yet</p>
                    )}
                    {formErrors.availabilities && (
                      <p style={{ color: "#dc2626", fontSize: "14px", marginTop: "8px" }}>
                        {formErrors.availabilities}
                      </p>
                    )}
                  </div>
                )}

                {currentStageFields.showMeeting && (
                  <div
                    style={{ backgroundColor: "#f8f5f3", padding: "20px", borderRadius: "12px", marginBottom: "24px" }}
                  >
                    <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#4a352f", marginBottom: "16px" }}>
                      Schedule Meeting
                    </h4>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#4a352f",
                            marginBottom: "8px",
                          }}
                        >
                          Meeting Time:
                        </label>
                        <input
                          type="datetime-local"
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "2px solid #c8b6a6",
                            borderRadius: "6px",
                            fontSize: "14px",
                            backgroundColor: "white",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#4a352f",
                            marginBottom: "8px",
                          }}
                        >
                          Location:
                        </label>
                        <input
                          type="text"
                          value={meetingLocation}
                          onChange={(e) => {
                            setMeetingLocation(e.target.value)
                            if (e.target.value.trim()) {
                              setFormErrors({ ...formErrors, meetingLocation: "" })
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: formErrors.meetingLocation ? "2px solid #dc2626" : "2px solid #c8b6a6",
                            borderRadius: "6px",
                            fontSize: "14px",
                            backgroundColor: "white",
                          }}
                          placeholder="Office, Virtual, etc."
                        />
                        {formErrors.meetingLocation && (
                          <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                            {formErrors.meetingLocation}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#4a352f",
                          marginBottom: "8px",
                        }}
                      >
                        Meeting Purpose:
                      </label>
                      <input
                        type="text"
                        value={meetingPurpose}
                        onChange={(e) => {
                          setMeetingPurpose(e.target.value)
                          if (e.target.value.trim()) {
                            setFormErrors({ ...formErrors, meetingPurpose: "" })
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: formErrors.meetingPurpose ? "2px solid #dc2626" : "2px solid #c8b6a6",
                          borderRadius: "6px",
                          fontSize: "14px",
                          backgroundColor: "white",
                        }}
                        placeholder="Initial discussion, strategy review, etc."
                      />
                      {formErrors.meetingPurpose && (
                        <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                          {formErrors.meetingPurpose}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {currentStageFields.showTermSheet && (
                  <div style={{ marginBottom: "24px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#4a352f",
                        marginBottom: "12px",
                      }}
                    >
                      Term Sheet Upload:
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setTermSheetFile(e.target.files[0])}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "2px solid #c8b6a6",
                        borderRadius: "8px",
                        fontSize: "14px",
                        backgroundColor: "#f5f0e1",
                      }}
                    />
                    {termSheetFile && (
                      <p style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
                        Selected: {termSheetFile.name}
                      </p>
                    )}
                    <p style={{ fontSize: "11px", color: "#a89482", marginTop: "6px" }}>
                      Uploads in the background — you don't need to wait on this screen.
                    </p>
                  </div>
                )}
              </>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                onClick={() => {
                  setShowStageModal(false)
                  resetStageModal()
                }}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "transparent",
                  color: "#666",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "16px",
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleStageUpdate}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#5d4037",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Stage"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}