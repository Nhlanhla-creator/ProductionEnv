"use client"

import { useState, useEffect } from "react"
import { BarChart3, MapPin, Calendar, Filter, X } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { collection, getDocs, query, where, serverTimestamp, doc, updateDoc, getDoc, addDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "../../firebaseConfig"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

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

// Text truncation component with line limit
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

// Score color function
const getScoreColor = (score) => {
  if (score >= 80) return "#22c55e" // Green
  if (score >= 60) return "#f59e0b" // Orange
  return "#ef4444" // Red
}

// Status definitions with colors
const STATUS_TYPES = {
  "New Application": {
    color: "#E3F2FD",
    textColor: "#1976D2",
  },
  "Under Review": {
    color: "#FFF3E0",
    textColor: "#F57C00",
  },
  "In Review": {
    color: "#F3E5F5",
    textColor: "#7B1FA2",
  },
  Shortlisted: {
    color: "#E8F5E8",
    textColor: "#388E3C",
  },
  "Funding Approved": {
    color: "#E8F5E8",
    textColor: "#2d5016",
  },
  Rejected: {
    color: "#FFEBEE",
    textColor: "#D32F2F",
  },
}

const getStatusStyle = (status) => {
  return STATUS_TYPES[status] || { color: "#F5F5F5", textColor: "#666666" }
}

const PIPELINE_STAGES = {
  MATCH: {
    label: "Match",
    next: "Application Sent",
  },
  "APPLICATION SENT": {
    label: "Application Sent",
    next: "Evaluation",
  },
  EVALUATION: {
    label: "Evaluation",
    next: "Due Diligence",
  },
  "DUE DILIGENCE": {
    label: "Due Diligence",
    next: "Decision",
  },
  DECISION: {
    label: "Decision",
    next: "Support Approved",
  },
  "SUPPORT APPROVED": {
    label: "Support Approved",
    next: "Active Support",
  },
  "ACTIVE SUPPORT": {
    label: "Active Support",
    next: "N/A",
  },
  "SUPPORT DECLINED": {
    label: "Support Declined",
    next: "N/A",
  },
};



const getNextStage = (currentStage) => {
  const stageKey = currentStage?.toUpperCase();

  if (stageKey === "SUPPORT APPROVED") {
    return "Approved/Declined"; // 👈 Special case override
  }

  return PIPELINE_STAGES[stageKey]?.next || "N/A";
};

export function SupportSMETable({ filters, stageFilter, onSMEsLoaded  }) {
  const [smes, setSmes] = useState([])
  const [selectedSME, setSelectedSME] = useState(null)
  const [modalType, setModalType] = useState(null)
  const [message, setMessage] = useState("")
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nextStage, setNextStage] = useState("")
  const [showStageModal, setShowStageModal] = useState(false)
  const [selectedSMEForStage, setSelectedSMEForStage] = useState(null)
  const [updatedStages, setUpdatedStages] = useState({})
  const [meetingTime, setMeetingTime] = useState("")
  const [meetingLocation, setMeetingLocation] = useState("")
  const [meetingPurpose, setMeetingPurpose] = useState("")
  const [termSheetFile, setTermSheetFile] = useState(null)

  // ✅ Added availability management state (same as advisor table)
  const [availabilities, setAvailabilities] = useState([])
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [tempDates, setTempDates] = useState([])
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" })
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)

  
  const [bigScoreData, setBigScoreData] = useState({
    pis: { score: 0, color: "#4E342E" }, // PIS first as requested
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

  // ✅ Updated application stages to match advisor code structure
  const applicationStages = [
    { id: "evaluation", name: "Evaluation", color: "#3b82f6" },
    { id: "due_diligence", name: "Due Diligence", color: "#8b5cf6" },
    { id: "decision", name: "Decision", color: "#f59e0b" },
    { id: "support_approved", name: "Support Approved", color: "#06b6d4" },
    { id: "active_support", name: "Active Support", color: "#10b981" },
    { id: "support_declined", name: "Support Declined", color: "#ef4444" },
  ]

  // ✅ Function to determine which fields to show based on stage (same as advisor)
  const getStageFields = (stageName) => {
    const baseFields = {
      showMessage: true,
      showMeeting: true,
      showTermSheet: false,
      showAvailability: false,
    }

    switch (stageName) {
      case "Evaluation":
        return { ...baseFields, showTermSheet: false, showAvailability: true }
      case "Due Diligence":
        return { ...baseFields, showTermSheet: false, showAvailability: true }
      case "Decision":
        return { ...baseFields, showTermSheet: false, showAvailability: true }
      case "Support Approved":
        return { ...baseFields, showTermSheet: true, showAvailability: true }
      case "Active Support":
        return { ...baseFields, showTermSheet: true, showAvailability: false }
      case "Support Declined":
        return { ...baseFields, showTermSheet: false, showAvailability: false }
      default:
        return baseFields
    }
  }

  // ✅ Added availability management functions (same as advisor table)
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

    if (selectedSMEForStage) {
      try {
        const availabilityData = newAvailabilities.map((avail) => ({
          date: avail.date.toISOString(),
          timeSlots: avail.timeSlots,
          timeZone: avail.timeZone,
          status: avail.status,
        }))

        // Update catalystApplications collection
        const docId = `${auth.currentUser.uid}_${selectedSMEForStage.id}`
        await updateDoc(doc(db, "catalystApplications", docId), {
          availableDates: availabilityData,
          updatedAt: new Date().toISOString(),
        })

        // Also update smeCatalystApplications collection
        const smeDocRef = doc(db, "smeCatalystApplications", docId)
        await updateDoc(smeDocRef, {
          availableDates: availabilityData,
          updatedAt: new Date().toISOString(),
        })
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

    if (selectedSMEForStage) {
      try {
        const availabilityData = updatedAvailabilities.map((avail) => ({
          date: avail.date.toISOString(),
          timeSlots: avail.timeSlots,
          timeZone: avail.timeZone,
        }))

        // Update both collections
        const docId = `${auth.currentUser.uid}_${selectedSMEForStage.id}`
        await updateDoc(doc(db, "catalystApplications", docId), {
          availableDates: availabilityData,
          updatedAt: new Date().toISOString(),
        })

        const smeDocRef = doc(db, "smeCatalystApplications", docId)
        await updateDoc(smeDocRef, {
          availableDates: availabilityData,
          updatedAt: new Date().toISOString(),
        })
      } catch (error) {
        console.error("Error updating availabilities:", error)
        setNotification({
          type: "error",
          message: "Failed to update availability dates",
        })
      }
    }
  }

  const hasAvailability = (sme) => {
    return sme.availableDates && sme.availableDates.length > 0
  }

  // ✅ Updated to use stage action instead of action change
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

    // Load availability data when opening stage modal
    loadApplicationAvailability(sme)
  }

  // ✅ Added reset function for stage modal
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

  useEffect(() => {
   const fetchCatalystApplications = async () => {
      setLoading(true)
      try {
        const user = auth.currentUser
        if (!user) throw new Error("No logged-in user")

        // Query all applications where the catalystId matches the current user
        const q = query(
          collection(db, "catalystApplications"),
          where("catalystId", "==", user.uid)
        )

        const snapshot = await getDocs(q)
        
        // Group applications by SME ID and program index
        const applicationsBySME = {}
        
        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          const [catalystId, smeId, programIndex] = doc.id.split('_')
          
          if (!applicationsBySME[smeId]) {
            applicationsBySME[smeId] = {}
          }
          
          // Store application with program index as key
          applicationsBySME[smeId][programIndex || '0'] = data
        })

        // Fetch SME details for each unique SME and create application entries
        const fetchedSMEs = await Promise.all(
          Object.keys(applicationsBySME).map(async (smeId) => {
            // Get all program applications for this SME
            const programApplications = applicationsBySME[smeId]
            
            // Fetch SME profile data once
            const smeDoc = await getDoc(doc(db, "universalProfiles", smeId))
            const smeData = smeDoc.exists() ? smeDoc.data() : {}
            const entity = smeData.entityOverview || {}
            const funding = smeData.useOfFunds || {}

            // Create an application entry for each program
            return Object.entries(programApplications).map(([programIndex, data]) => ({
              file_id: `${user.uid}_${smeId}_${programIndex}`,
              id: smeId,
              programIndex: programIndex,
              name: `${entity.registeredName || "N/A"}${Object.keys(programApplications).length > 1 ? ` (Program ${parseInt(programIndex)+1})` : ""}`,
              location: entity.location || "N/A",
              sector: (entity.economicSectors || []).join(", ") || "N/A",
              fundingStage: entity.operationStage || "-",
              fundingRequired: funding.amountRequested || "-",
              equityOffered: funding.equityType || "-",
              guarantees: data.guarantees || "-",
              supportRequired: data.supportRequired || "-",
              servicesRequired: data.servicesRequired || "-",
              applicationDate: new Date(data.createdAt?.toDate?.() || Date.now()).toLocaleDateString(),
              matchPercentage: data.matchPercentage || 0,
              bigScore: data.bigScore || 0,
              currentStatus: data.status || "New Application",
              pipelineStage: data.pipelineStage || "New Application",
              nextStage: data.nextStage || "Evaluation",
              action: "Application Received",
              availableDates: data.availableDates
                ? data.availableDates.map((avail) => ({
                    ...avail,
                    date: new Date(avail.date),
                  }))
                : [],
              acceleratorName: data.acceleratorName || "N/A",
              programName: data.programName || `Program ${parseInt(programIndex)+1}`,
            }))
          })
        )

        // Flatten the array of arrays into a single array of applications
        const flattenedSMEs = fetchedSMEs.flat()

        // Filter by stage if provided
        if (stageFilter) {
          const stageMapping = {
            initial: ["New Application"],
            application: ["New Application"],
            review: ["Under Review", "In Review"],
            approved: ["Shortlisted"],
            funding: ["Funding Approved"],
            active: ["Active Support"],
            rejected: ["Rejected"],
          }

          const validStages = stageMapping[stageFilter] || []
          setSmes(flattenedSMEs.filter(
            (sme) => validStages.includes(sme.currentStatus) || validStages.includes(sme.action),
          ))
        } else {
          setSmes(flattenedSMEs)
        }
      } catch (err) {
        console.error("Error fetching catalyst applications:", err)
        setNotification({ type: "error", message: "Failed to load applications." })
      } finally {
        setLoading(false)
      }
    }

    fetchCatalystApplications()
  }, [stageFilter])

    useEffect(() => {
    if (smes.length > 0 && onSMEsLoaded) {
      onSMEsLoaded(smes);
    }
  }, [smes, onSMEsLoaded]);

  const handleFilterChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setLocalFilters({
      location: "",
      matchScore: 50,
      minFunding: "",
      maxFunding: "",
      instruments: [],
      stages: [],
      sectors: [],
      supportTypes: [],
      smeType: "",
      sortBy: "",
    })
  }

  const applyFilters = () => {
    // Apply filtering logic here
    console.log("Applying filters:", localFilters)
    setShowFilters(false)
  }

  // ✅ Updated stage update function to match advisor code structure
const handleStageUpdate = async () => {
    const stageFields = getStageFields(nextStage)
    const errors = {}

    if (!nextStage) {
      errors.nextStage = "Please select a stage"
    }
    if (stageFields.showMessage && !message.trim()) {
      errors.message = "Please provide a message"
    }
    if (stageFields.showMeeting) {
      if (!meetingLocation.trim()) {
        errors.meetingLocation = "Please provide a meeting location"
      }
      if (!meetingPurpose.trim()) {
        errors.meetingPurpose = "Please provide a meeting purpose"
      }
    }

    if (stageFields.showAvailability && !availabilities.length) {
      errors.availabilities = "Please select at least one available date"
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)

    try {
      const user = auth.currentUser
      if (!user) throw new Error("User not authenticated")

      const catalystId = user.uid
      const smeId = selectedSMEForStage.id
      const programIndex = selectedSMEForStage.programIndex || '0'

      // Use the full document ID including program index
      const documentId = `${catalystId}_${smeId}_${programIndex}`
      const documentsmeId = `${smeId}_${catalystId}_${programIndex}`

      let attachmentUrl = null
      if (termSheetFile) {
        const storageRef = ref(storage, `support_termsheets/${selectedSMEForStage.id}/${termSheetFile.name}`)
        const snapshot = await uploadBytes(storageRef, termSheetFile)
        attachmentUrl = await getDownloadURL(snapshot.ref)
      }

      const computedNextStage = getNextStage(nextStage)

      const updateData = {
        status: nextStage,
        pipelineStage: nextStage,
        nextStage: computedNextStage,
        updatedAt: serverTimestamp(),
        ...(message && { lastMessage: message }),
        ...(stageFields.showMeeting && {
          meetingDetails: {
            time: meetingTime,
            location: meetingLocation,
            purpose: meetingPurpose,
          },
        }),
      }

      if (stageFields.showAvailability && availabilities.length > 0) {
        const availabilityData = availabilities.map((avail) => ({
          date: avail.date.toISOString(),
          timeSlots: avail.timeSlots,
          timeZone: avail.timeZone,
          status: avail.status,
        }))
        updateData.availableDates = availabilityData
      }

      const docRef = doc(db, "catalystApplications", documentId)
      const docSnapshot = await getDoc(docRef)
      if (!docSnapshot.exists()) {
        throw new Error(`Document with ID ${documentId} does not exist in catalystApplications`)
      }

      await updateDoc(docRef, updateData)

      try {
        const smeDocRef = doc(db, "smeCatalystApplications", documentsmeId)
        await updateDoc(smeDocRef, {
          status: nextStage,
          nextStage: computedNextStage,
          ...(updateData.availableDates && { availableDates: updateData.availableDates }),
        })
      } catch (matchError) {
        console.warn("Could not update related collections:", matchError.message)
      }

      if (stageFields.showMeeting && meetingLocation && meetingPurpose) {
        try {
          await addDoc(collection(db, "smeCalendarEvents"), {
            smeId: smeId,
            catalystId: catalystId,
            title: meetingPurpose,
            date: meetingTime,
            location: meetingLocation,
            type: "support_meeting",
            createdAt: new Date().toISOString(),
            ...(updateData.availableDates && { availableDates: updateData.availableDates }),
          })
        } catch (calendarError) {
          console.error("Error creating calendar event:", calendarError)
        }
      }

      setSmes((prevSmes) =>
        prevSmes.map((sme) =>
          sme.id === smeId && sme.programIndex === programIndex
            ? {
                ...sme,
                status: nextStage,
                nextStage: computedNextStage,
                pipelineStage: nextStage,
                ...(message && { lastMessage: message }),
                ...(stageFields.showMeeting && {
                  meetingDetails: {
                    time: meetingTime,
                    location: meetingLocation,
                    purpose: meetingPurpose,
                  },
                }),
                ...(updateData.availableDates && { availableDates: updateData.availableDates }),
              }
            : sme,
        ),
      )

      setUpdatedStages((prev) => ({ ...prev, [`${smeId}_${programIndex}`]: nextStage }))

      setNotification({
        type: "success",
        message: `Application status updated to ${nextStage} successfully`,
      })

      setShowStageModal(false)
      resetStageModal()

      const subject = `Update: ${nextStage} Stage for Your Application`
      let content = `Dear ${selectedSMEForStage.name},\n\nWe are pleased to inform you that your application has progressed to the "${nextStage}" stage.\n\n${message}`

      if (stageFields.showMeeting) {
        content += `\n\nMeeting Details:\n- Location: ${meetingLocation}\n- Purpose: ${meetingPurpose}`
      }

      if (stageFields.showAvailability && availabilities.length > 0) {
        content += `\n\nAvailable Meeting Times:\n`
        content += availabilities
          .map((avail, idx) => {
            const dateStr = avail.date.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
            const timeStr = avail.timeSlots?.[0]
              ? `${avail.timeSlots[0].start} - ${avail.timeSlots[0].end} ${avail.timeZone}`
              : "Time not specified"
            return `${idx + 1}. ${dateStr} (${timeStr})`
          })
          .join("\n")

        content += `\n\nPlease reply with your preferred meeting time from the above options.`
      }

      content += `\n\nBest regards,\nSupport Team`

      const messagePayload = {
        to: smeId,
        from: catalystId,
        subject,
        content,
        date: new Date().toISOString(),
        read: false,
        type: "inbox",
        applicationId: `${catalystId}_${smeId}_${programIndex}`,
        attachments: attachmentUrl ? [attachmentUrl] : [],
        ...(updateData.availableDates && { availableDates: updateData.availableDates }),
      }

      const sentMessagePayload = {
        ...messagePayload,
        read: true,
        type: "sent",
      }

      await Promise.all([
        addDoc(collection(db, "messages"), messagePayload),
        addDoc(collection(db, "messages"), sentMessagePayload),
      ])
    } catch (error) {
      console.error("Detailed error:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      })

      setNotification({
        type: "error",
        message: `Failed to update status: ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewDetails = (sme) => {
    setSelectedSME(sme)
    setModalType("view")
  }

  const handleBigScoreClick = (sme) => {
    // Generate random scores for demo purposes
    const complianceScore = Math.floor(Math.random() * 30) + 60
    const legitimacyScore = Math.floor(Math.random() * 20) + 75
    const fundabilityScore = Math.floor(Math.random() * 25) + 65
    const pisScore = Math.floor(Math.random() * 15) + 80

    setBigScoreData({
      compliance: { score: complianceScore, color: "#8D6E63" },
      legitimacy: { score: legitimacyScore, color: "#5D4037" },
      fundability: { score: fundabilityScore, color: "#3E2723" },
      pis: { score: pisScore, color: "#4E342E" },
    })

    setSelectedSME(sme)
    setModalType("bigScore")
  }

  const resetModal = () => {
    setSelectedSME(null)
    setModalType(null)
    setMessage("")
    setFormErrors({})
  }

  // Calculate total score
  const calculateTotalScore = () => {
    const { compliance, legitimacy, fundability, pis } = bigScoreData
    return Math.round(compliance.score * 0.35 + legitimacy.score * 0.15 + fundability.score * 0.35 + pis.score * 0.15)
  }

  // Enhanced Modal Overlay Style with animation
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

  // Enhanced Modern Modal Content Style
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

  // ✅ Updated style constants but keeping compact design
  const tableHeaderStyle = {
    background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
    color: "#FEFCFA",
    padding: "0.35rem 0.15rem",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "0.7rem", // Increased from 0.55rem
    letterSpacing: "0.2px",
    textTransform: "uppercase",
    position: "sticky",
    top: "0",
    zIndex: "10",
    borderBottom: "2px solid #1a0c02",
    borderRight: "1px solid #1a0c02",
    lineHeight: "1.1",
    verticalAlign: "top",
  }

  const tableCellStyle = {
    padding: "0.35rem 0.15rem",
    borderBottom: "1px solid #E8D5C4",
    borderRight: "1px solid #E8D5C4",
    fontSize: "0.75rem", // Increased from 0.6rem
    verticalAlign: "top",
    color: "#5d2a0a",
    lineHeight: "1.2",
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
    width: "25px",
    height: "3px",
    background: "#E8D5C4",
    borderRadius: "2px",
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
    fontSize: "0.7rem", // Increased from 0.55rem
  }

  const statusBadgeStyle = {
    padding: "0.1rem 0.2rem",
    borderRadius: "3px",
    fontSize: "0.65rem", // Increased from 0.5rem
    fontWeight: "500",
    display: "inline-block",
    whiteSpace: "nowrap",
  }

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading applications...</div>
  }

  const currentStageFields = getStageFields(nextStage)

  return (
    <div style={{ padding: "20px", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>

        <button
          onClick={() => setShowFilters(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 20px",
            backgroundColor: "#a67c52",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "0.8rem",
            boxShadow: "0 2px 6px rgba(166, 124, 82, 0.3)",
          }}
        >
          <Filter size={14} />
          Filter Applications
        </button>
      </div>

      {notification && (
        <div
          style={{
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "20px",
            backgroundColor: notification.type === "success" ? "#d4edda" : "#f8d7da",
            color: notification.type === "success" ? "#155724" : "#721c24",
            border: `1px solid ${notification.type === "success" ? "#c3e6cb" : "#f5c6cb"}`,
            fontSize: "0.8rem",
          }}
        >
          {notification.message}
        </div>
      )}

      {/* ✅ Restored ALL original columns with compact design */}
      <div
        style={{
          borderRadius: "6px",
          border: "1px solid #E8D5C4",
          boxShadow: "0 3px 20px rgba(139, 69, 19, 0.08)",
          width: "100%",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            fontSize: "0.75rem",
            backgroundColor: "#FEFCFA",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: "70px" }} /> {/* SMSE Name */}
            <col style={{ width: "60px" }} /> {/* Location */}
            <col style={{ width: "55px" }} /> {/* Sector */}
            <col style={{ width: "60px" }} /> {/* Funding Stage */}
            <col style={{ width: "65px" }} /> {/* Funding Required */}
            <col style={{ width: "55px" }} /> {/* Equity Offered */}
            <col style={{ width: "60px" }} /> {/* Guarantees */}
            <col style={{ width: "75px" }} /> {/* Support Required */}
            <col style={{ width: "70px" }} /> {/* Services Required */}
            <col style={{ width: "65px" }} /> {/* Application Date */}
            <col style={{ width: "50px" }} /> {/* Match % */}
            <col style={{ width: "55px" }} /> {/* BIG Score */}
            <col style={{ width: "70px" }} /> {/* Current Status */}
            <col style={{ width: "60px" }} /> {/* Action */}
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
                Funding
                <br />
                Required
              </th>
              <th style={tableHeaderStyle}>
                Equity
                <br />
                Offered
              </th>
              <th style={tableHeaderStyle}>Guarantees</th>
              <th style={tableHeaderStyle}>
                Support
                <br />
                Required
              </th>
              <th style={tableHeaderStyle}>
                Services
                <br />
                Required
              </th>
              <th style={tableHeaderStyle}>
                Application
                <br />
                Date
              </th>
              <th style={tableHeaderStyle}>Match %</th>
              <th style={tableHeaderStyle}>BIG Score</th>
              <th style={tableHeaderStyle}>
                Current
                <br />
                Status
              </th>
              <th style={{ ...tableHeaderStyle, borderRight: "none" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {smes.length === 0 ? (
              <tr>
                <td colSpan="14" style={{ ...tableCellStyle, textAlign: "center", color: "#666" }}>
                  No applications received yet
                </td>
              </tr>
            ) : (
              smes.map((sme) => {
                const currentStatus = updatedStages[sme.id] || sme.pipelineStage || sme.currentStatus
                const statusStyle = getStatusStyle(currentStatus)
                return (
                  <tr key={sme.id} style={{ borderBottom: "1px solid #E8D5C4" }}>
                    <td style={tableCellStyle}>
                      <button
                        onClick={() => handleViewDetails(sme)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#a67c52",
                          textDecoration: "underline",
                          cursor: "pointer",
                          fontWeight: "500",
                          padding: "0",
                          fontSize: "0.75rem",
                          textAlign: "left",
                          wordBreak: "break-word",
                          width: "100%",
                          lineHeight: "1.2",
                        }}
                      >
                        {sme.name}
                      </button>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "0.75rem" }}>
                        <MapPin size={8} />
                        <span style={{ wordBreak: "break-word" }}>{sme.location}</span>
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={sme.sector} maxLines={2} maxLength={8} />
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={sme.fundingStage} maxLength={8} />
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={sme.fundingRequired} maxLength={10} />
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={sme.equityOffered} maxLength={8} />
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={sme.guarantees} maxLength={8} />
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={sme.supportRequired} maxLength={12} />
                    </td>
                    <td style={tableCellStyle}>
                      <TruncatedText text={sme.servicesRequired} maxLength={10} />
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "0.7rem" }}>
                        <Calendar size={8} />
                        <span style={{ wordBreak: "break-word" }}>{sme.applicationDate}</span>
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={matchContainerStyle}>
                        <div style={progressBarStyle}>
                          <div style={{ ...progressFillStyle, width: `${sme.matchPercentage}%` }} />
                        </div>
                        <span style={matchScoreStyle}>{sme.matchPercentage}%</span>
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={matchContainerStyle}>
                        <div style={progressBarStyle}>
                          <div
                            style={{
                              ...progressFillStyle,
                              width: `${sme.bigScore}%`,
                              background: `linear-gradient(90deg, ${getScoreColor(sme.bigScore)}, ${getScoreColor(sme.bigScore)}aa)`,
                            }}
                          />
                        </div>
                        <button
                          onClick={() => handleBigScoreClick(sme)}
                          style={{
                            background: "none",
                            border: "none",
                            color: getScoreColor(sme.bigScore),
                            textDecoration: "underline",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "1px",
                            fontWeight: "600",
                            fontSize: "0.75rem",
                          }}
                        >
                          {sme.bigScore}%
                          <BarChart3 size={8} />
                        </button>
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
                    </td>
                    <td style={{ ...tableCellStyle, borderRight: "none" }}>
                      <button
                        onClick={() => handleStageAction(sme)}
                        style={{
                          padding: "3px 5px",
                          backgroundColor: "#5d4037",
                          color: "white",
                          border: "none",
                          borderRadius: "3px",
                          cursor: "pointer",
                          fontSize: "0.7rem",
                          fontWeight: "500",
                          width: "100%",
                          whiteSpace: "nowrap",
                        }}
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

      {/* Filter Modal */}
      {showFilters && (
        <div style={modalOverlayStyle} onClick={() => setShowFilters(false)}>
          <div style={{ ...modalContentStyle, maxWidth: "800px" }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}
            >
              <h3 style={{ fontSize: "28px", fontWeight: "800", color: "#3e2723", margin: 0 }}>
                Filter Support Applications
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

      {/* BIG Score Modal */}
      {selectedSME && modalType === "bigScore" && (
        <div style={modalOverlayStyle} onClick={resetModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}
            >
              <h3 style={{ fontSize: "28px", fontWeight: "800", color: "#3e2723", margin: 0 }}>BIG Score Breakdown</h3>
              <div
                style={{
                  backgroundColor: "#5d4037",
                  color: "white",
                  borderRadius: "50%",
                  width: "80px",
                  height: "80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  fontWeight: "800",
                  boxShadow: "0 8px 24px rgba(93, 64, 55, 0.3)",
                }}
              >
                {calculateTotalScore()}
              </div>
            </div>
            <p style={{ fontSize: "18px", color: "#5d4037", marginBottom: "32px", lineHeight: "1.6" }}>
              The BIG Score is a comprehensive evaluation of {selectedSME.name}'s support readiness across four key
              dimensions:
            </p>
            {/* Score breakdown sections */}
            {Object.entries(bigScoreData).map(([key, data]) => (
              <div
                key={key}
                style={{
                  backgroundColor: "#fafafa",
                  borderRadius: "16px",
                  padding: "28px",
                  marginBottom: "28px",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
                  border: "1px solid #e8e8e8",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: "20px", fontWeight: "700", textTransform: "capitalize" }}>
                    {key} Score
                  </h4>
                  <span style={{ fontSize: "28px", fontWeight: "800", color: data.color }}>{data.score}%</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "16px",
                    backgroundColor: "#efebe9",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div
                    style={{
                      width: `${data.score}%`,
                      height: "100%",
                      backgroundColor: data.color,
                      borderRadius: "8px",
                      transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  ></div>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={resetModal}
                style={{
                  backgroundColor: "#5d4037",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "16px 32px",
                  fontSize: "18px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(93, 64, 55, 0.3)",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendarModal && (
        <div style={{ ...modalOverlayStyle, zIndex: 1100 }} onClick={() => setShowCalendarModal(false)}>
          <div style={{ ...modalContentStyle, maxWidth: "800px" }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}
            >
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
              <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>Selected Availability</h4>
              {tempDates.length > 0 ? (
                <div
                  style={{
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    padding: "12px",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {tempDates.map((date, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <span>
                        {date.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
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
                          padding: "4px",
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
                  cursor: "pointer",
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
                  cursor: "pointer",
                }}
                disabled={tempDates.length === 0}
              >
                Save Availability
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Updated Stage Action Modal to match advisor code structure */}
      {showStageModal && selectedSMEForStage && (
        <div style={modalOverlayStyle} onClick={() => setShowStageModal(false)}>
          <div style={{ ...modalContentStyle, maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#3e2723", margin: "0 0 8px 0" }}>
                Update Application Stage
              </h3>
              <p style={{ fontSize: "16px", color: "#666", margin: 0 }}>{selectedSMEForStage.name}</p>
            </div>

            {/* Stage Selection */}
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
                {applicationStages.map((stage) => (
                  <option key={stage.id} value={stage.name}>
                    {stage.name}
                  </option>
                ))}
              </select>
              {formErrors.nextStage && (
                <p style={{ color: "#dc2626", fontSize: "14px", marginTop: "8px" }}>{formErrors.nextStage}</p>
              )}
            </div>

            {/* Conditional Fields Based on Selected Stage */}
            {nextStage && (
              <>
                {/* Message - Always show */}
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

                {/* Availability Section */}
                {currentStageFields.showAvailability && (
                  <div
                    style={{
                      backgroundColor: "#f8f5f3",
                      padding: "20px",
                      borderRadius: "12px",
                      marginBottom: "24px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#4a352f" }}>Your Availability</h4>
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
                          gap: "4px",
                        }}
                      >
                        <Calendar size={14} />
                        Add Dates
                      </button>
                    </div>
                    {availabilities.length > 0 ? (
                      <div
                        style={{
                          border: "1px solid #eee",
                          borderRadius: "8px",
                          maxHeight: "200px",
                          overflowY: "auto",
                        }}
                      >
                        {availabilities.map((availability, index) => (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 12px",
                              borderBottom: "1px solid #f0f0f0",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: "500" }}>
                                {availability.date.toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                              {availability.timeSlots?.[0] && (
                                <div style={{ fontSize: "12px", color: "#666" }}>
                                  {availability.timeSlots[0].start} - {availability.timeSlots[0].end} (
                                  {availability.timeZone})
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
                                padding: "4px",
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

                {/* Meeting Details - Show for most stages */}
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

                {/* Term Sheet Upload - Only show for specific stages */}
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
                      Support Agreement Upload:
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
                  </div>
                )}
              </>
            )}

            {/* Action Buttons */}
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

      <style>{`
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