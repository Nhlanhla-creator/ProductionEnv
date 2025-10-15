"use client"

import { useState, useEffect } from "react"
import { Check, X, CalendarCheck2, AlertTriangle, Info, ChevronDown, BarChart3 } from "lucide-react"
import styles from "./investor-funding.module.css"
import { db } from "../../firebaseConfig"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "../../firebaseConfig"
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, getDocs, addDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { auth } from "../../firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"
import { addInvestorNotification } from "../NotificationInvestor"
import emailjs from '@emailjs/browser'
import { API_KEYS } from "../../API"

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

export function InvestorSMETable(filters, stageFilter, onDealComplete) {
  const [availabilities, setAvailabilities] = useState([])
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [tempDates, setTempDates] = useState([])
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" })
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [smes, setSmes] = useState([])
  const [selectedSME, setSelectedSME] = useState(null)
  const [modalType, setModalType] = useState(null)
  const [message, setMessage] = useState("")
  const [meetingTime, setMeetingTime] = useState("")
  const [meetingLocation, setMeetingLocation] = useState("")
  const [meetingPurpose, setMeetingPurpose] = useState("")
  const [bigScoresMap, setBigScoresMap] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nextStage, setNextStage] = useState("")
  const [documentFile, setDocumentFile] = useState(null)
  const [showNextStageModal, setShowNextStageModal] = useState(false)
  const [selectedSMEForStage, setSelectedSMEForStage] = useState(null)
  const [updatedStages, setUpdatedStages] = useState({})
  const navigate = useNavigate()
  const [authLoading, setAuthLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [fundingAmount, setFundingAmount] = useState("")
  const [investmentType, setInvestmentType] = useState("")
  const [amountAsked, setAmountAsked] = useState("")
  const [amountApproved, setAmountApproved] = useState("")
  const [paymentDeployment, setPaymentDeployment] = useState("")
  const [defaultMessages, setDefaultMessages] = useState({
    "Under Review":
      "Dear Valued Partner,\n\nWe are pleased to inform you that your funding application has progressed to our comprehensive review stage. Our investment committee will conduct a thorough evaluation of your business proposal, financial projections, and growth potential.\n\nWe appreciate your patience during this critical assessment period and will keep you informed of our progress.\n\nBest regards,\nInvestment Review Team",
    "Funding Approved":
      "Dear Esteemed Entrepreneur,\n\nCongratulations! We are delighted to inform you that your funding application has been approved. After careful consideration of your business proposal, we are excited to support your growth journey.\n\nPlease find the funding details below for your review and confirmation.\n\nWe look forward to a successful partnership.\n\nBest regards,\nFunding Approval Team",
    Termsheet:
      "Dear Esteemed Entrepreneur,\n\nFollowing our comprehensive evaluation, we are delighted to present you with our formal term sheet for your consideration. This document outlines our proposed investment terms, conditions, and partnership structure.\n\nWe believe this partnership will create significant value for both parties and look forward to your review and feedback.\n\nKindest regards,\nInvestment Committee",
    "Deal Complete":
      "Dear Business Partner,\n\nIt is with great pleasure that we confirm the successful completion of your funding arrangement. We are excited to embark on this partnership journey and support your business growth objectives.\n\nOur team will be in contact shortly to finalize all administrative requirements and discuss next steps for our collaboration.\n\nCongratulations on this significant milestone.\n\nWarm regards,\nPartnership Team",
    "Deal Declined":
      "Dear Applicant,\n\nThank you for presenting your business opportunity to our investment committee. After careful consideration and thorough evaluation, we regret to inform you that we are unable to proceed with funding at this time.\n\nThis decision does not reflect the quality of your business concept, and we encourage you to continue pursuing your entrepreneurial goals.\n\nWe wish you success in your future endeavors.\n\nRespectfully,\nInvestment Committee",
  })
  const [bigScoreData, setBigScoreData] = useState({
    compliance: { score: 0, color: "#8D6E63" },
    legitimacy: { score: 0, color: "#5D4037" },
    fundability: { score: 0, color: "#3E2723" },
    pis: { score: 0, color: "#4E342E" },
    leadership: { score: 0, color: "#6D4C41" },
    bigScore: { score: 0, color: "#5D4037" },
  })

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

  useEffect(() => {
    setLoading(true)
    setAuthLoading(true)

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)

      if (!currentUser) {
        setLoading(false)
        setSmes([])
        return
      }

      const q = query(collection(db, "investorApplications"), where("funderId", "==", currentUser.uid))

      const unsubscribeData = onSnapshot(q, async (querySnapshot) => {
        try {
          const stagesFromFirestore = {}
          const existingSmeIds = smes.map(sme => sme.id)
          const fetchWithProfiles = await Promise.all(
            querySnapshot.docs.map(async (docSnap) => {
              const data = docSnap.data()

              // Check if this is a new application by comparing with existing ones
              const isNew = !existingSmeIds.includes(docSnap.id)
              if (isNew && data.createdAt) {
                const applicationDate = new Date(data.createdAt)
                const now = new Date()
                const isRecent = (now - applicationDate) < (24 * 60 * 60 * 1000) // Within 24 hours
                
                if (isRecent) {
                  addInvestorNotification(
                    `New application received from ${data.smeName || "an SME"}`,
                    "new_application",
                    docSnap.id,
                    data.smeName || "Unknown Company"
                  )
                }
              }

              // Convert date fields if needed
              if (data.availableDates) {
                data.availableDates = data.availableDates.map((avail) => ({
                  ...avail,
                  date: new Date(avail.date),
                }))
              }

              // Store pipeline stage if it exists
              if (data.pipelineStage) {
                stagesFromFirestore[docSnap.id] = data.pipelineStage
              }

              // Fetch the SME profile to get the fundabilityScore
              const fundabilityScore = null
              try {
                const profileRef = doc(db, "universalProfiles", data.smeId)
                const profileSnap = await getDoc(profileRef)
                if (profileSnap.exists()) {
                  const profileData = profileSnap.data()

                  // Generate random big score for demo purposes
                  const bigScore = Math.floor(Math.random() * 30) + 70

                  return {
                    id: docSnap.id,
                    ...data,
                    fundabilityScore: profileData.fundabilityScore ?? null,
                    bigScore: bigScore,
                    smeName:
                      profileData.entityOverview?.tradingName ||
                      profileData.entityOverview?.registeredName ||
                      "Unnamed Business",
                    location: formatLabel(profileData.entityOverview?.location),
                    stage: formatLabel(profileData.applicationOverview?.fundingStage),
                    focusArea: formatLabel(profileData.entityOverview?.operationStage),
                    sector: formatLabel(profileData.entityOverview?.economicSectors?.[0]),
                    fundingNeeded: profileData.useOfFunds?.amountRequested?.replace(/[^\d]/g, "") || "0",
                    applicationDate: profileData.applicationOverview?.applicationDate || "N/A",
                    investmentType: formatLabel(
                      Array.isArray(profileData.useOfFunds?.fundingInstruments)
                        ? profileData.useOfFunds.fundingInstruments.join(", ")
                        : "",
                    ),
                    pipelineStage: data.pipelineStage || null,
                    revenue: `R${Number(profileData.financialOverview?.annualRevenue || 0).toLocaleString()}`,
                    teamSize: profileData.entityOverview?.employeeCount || "N/A",
                  }
                }
              } catch (error) {
                console.error("Error fetching SME profile for", data.smeId, error)
              }

              // Return basic application data if profile fetch fails
              return {
                id: docSnap.id,
                ...data,
                smeName: data.smeName || "Unnamed Business",
                location: formatLabel(data.location),
                stage: formatLabel(data.stage),
                fundingNeeded: data.fundingNeeded || "0",
                applicationDate: data.applicationDate || "N/A",
                pipelineStage: data.pipelineStage || null,
              }
            }),
          )

          // Filter out any undefined entries and sort
          const validProfiles = fetchWithProfiles.filter(profile => profile !== undefined)
          validProfiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

          let filtered = validProfiles
          if (stageFilter) {
            const normalized = stageFilter.toLowerCase()
            filtered = validProfiles.filter((app) => (app.pipelineStage || "").toLowerCase() === normalized)
          }

          setUpdatedStages(stagesFromFirestore)
          setSmes(filtered)
          console.log("Filtered applications by stage:", stageFilter, filtered.length)
          setLoading(false)
        } catch (error) {
          console.error("Error processing applications:", error)
          setNotification({
            type: "error",
            message: "Failed to load applications",
          })
          setLoading(false)
        }
      })

      return () => unsubscribeData()
    })

    return () => unsubscribeAuth()
  }, [stageFilter])

  useEffect(() => {
    const fetchBigScores = async () => {
      try {
        const snapshot = await getDocs(collection(db, "bigEvaluations"))
        const scores = {}
        snapshot.forEach((doc) => {
          scores[doc.id] = doc.data() // Store the entire document data
        })
        setBigScoresMap(scores)
      } catch (error) {
        console.error("Error fetching BIG Scores:", error)
        setNotification({
          type: "error",
          message: "Failed to load evaluation data",
        })
      }
    }

    fetchBigScores()
  }, [])

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

    if (selectedSME) {
      try {
        const availabilityData = newAvailabilities.map((avail) => ({
          date: avail.date.toISOString(),
          timeSlots: avail.timeSlots,
          timeZone: avail.timeZone,
          status: avail.status,
        }))

        await updateDoc(doc(db, "investorApplications", selectedSME.id), {
          availableDates: availabilityData,
          updatedAt: new Date().toISOString(),
        })

        const investorAppSnap = await getDoc(doc(db, "investorApplications", selectedSME.id))
        const { smeId, funderId } = investorAppSnap.data()

        const smeQuery = query(
          collection(db, "smeApplications"),
          where("smeId", "==", smeId),
          where("funderId", "==", funderId),
        )

        const smeSnapshot = await getDocs(smeQuery)
        if (!smeSnapshot.empty) {
          const smeDocRef = smeSnapshot.docs[0].ref
          await updateDoc(smeDocRef, {
            availableDates: availabilityData,
            updatedAt: new Date().toISOString(),
          })
        }
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

    if (selectedSME) {
      try {
        const availabilityData = updatedAvailabilities.map((avail) => ({
          date: avail.date.toISOString(),
          timeSlots: avail.timeSlots,
          timeZone: avail.timeZone,
        }))

        await updateDoc(doc(db, "investorApplications", selectedSME.id), {
          availableDates: availabilityData,
          updatedAt: new Date().toISOString(),
        })

        const investorAppSnap = await getDoc(doc(db, "investorApplications", selectedSME.id))
        const { smeId, funderId } = investorAppSnap.data()

        const smeQuery = query(
          collection(db, "smeApplications"),
          where("smeId", "==", smeId),
          where("funderId", "==", funderId),
        )

        const smeSnapshot = await getDocs(smeQuery)
        if (!smeSnapshot.empty) {
          const smeDocRef = smeSnapshot.docs[0].ref
          await updateDoc(smeDocRef, {
            availableDates: availabilityData,
            updatedAt: new Date().toISOString(),
          })
        }
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

  const handleUpdateStatus = async (id, status) => {
    if (status === "Declined") {
      const confirmDecline = window.confirm(
        "Are you sure you want to decline this application? This action cannot be undone.",
      )
      if (!confirmDecline) {
        return
      }
    }

    if (modalType !== "view") {
      const errors = {}

      if (!message.trim()) {
        errors.message = "Please provide a message to the SME"
      }

      if (modalType === "approve" && !meetingTime) {
        errors.meetingTime = "Please select a meeting time"
      }

      if (modalType === "approve" && !meetingLocation.trim()) {
        errors.meetingLocation = "Please provide a meeting location"
      }

      if (modalType === "approve" && !meetingPurpose.trim()) {
        errors.meetingPurpose = "Please provide a purpose for the meeting"
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        return
      }
    }

    setIsSubmitting(true)

    try {
      const updateData = {
        status: status === "Approved" ? "Accepted" : status,
        responseMessage: message,
        updatedAt: new Date().toISOString(),
        pipelineStage: status === "Approved" ? "Under Review" : status,
      }

      // Add notification for status change
      addInvestorNotification(
        `Application status changed to ${status} for ${selectedSME.smeName}`,
        "status_change",
        id,
        selectedSME.smeName
      )

      if (status === "Approved") {
        const availabilityData = availabilities.map((avail) => ({
          date: avail.date.toISOString(),
          timeSlots: avail.timeSlots,
          timeZone: avail.timeZone,
        }))

        updateData.availableDates = availabilityData
        updateData.meetingLocation = meetingLocation
        updateData.meetingPurpose = meetingPurpose
      }

      await updateDoc(doc(db, "investorApplications", id), updateData)

      // Update local state immediately
      setUpdatedStages((prev) => ({
        ...prev,
        [id]: status === "Approved" ? "Under Review" : status,
      }))

      const investorAppSnap = await getDoc(doc(db, "investorApplications", id))
      const { smeId, funderId } = investorAppSnap.data()

      const smeQuery = query(
        collection(db, "smeApplications"),
        where("smeId", "==", smeId),
        where("funderId", "==", funderId),
      )

      const smeSnapshot = await getDocs(smeQuery)
      if (!smeSnapshot.empty) {
        const smeDocRef = smeSnapshot.docs[0].ref
        const smeUpdateData = {
          status: status === "Approved" ? "Accepted" : status,
          updatedAt: new Date().toISOString(),
        }

        if (status === "Approved") {
          smeUpdateData.availableDates = updateData.availableDates
          smeUpdateData.meetingLocation = meetingLocation
          smeUpdateData.meetingPurpose = meetingPurpose
        }

        await updateDoc(smeDocRef, smeUpdateData)
      }

      if (status === "Approved" || status === "Declined") {
        const subject = status === "Approved" ? meetingPurpose : "Declined Application"
        let content

        if (status === "Approved") {
          const rsvpLink = `${window.location.origin}/calendar`

          content = `${message}

          Meeting Details:
          Time: click to RSVP (${rsvpLink})
          Location: ${meetingLocation}

          Available Meeting Dates for this application:
          ${availabilities
            .map((avail) => {
              try {
                const dateStr =
                  avail.date instanceof Date
                    ? avail.date.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Invalid Date"

                const timeStr = avail.timeSlots?.[0]
                  ? `${avail.timeSlots[0].start} - ${avail.timeSlots[0].end} ${avail.timeZone}`
                  : "Time not specified"

                return `${dateStr} (${timeStr})`
              } catch (e) {
                return "Invalid availability entry"
              }
            })
            .join("\n")}

        Please reply with your preferred meeting time from the above options.`
        } else {
          content = message
        }

        await addDoc(collection(db, "messages"), {
          to: smeId,
          from: funderId,
          subject,
          content,
          date: new Date().toISOString(),
          read: false,
          type: "inbox",
          applicationId: selectedSME.id,
          availableDates: status === "Approved" ? updateData.availableDates : null,
        })

        await addDoc(collection(db, "messages"), {
          to: smeId,
          from: funderId,
          subject,
          content,
          date: new Date().toISOString(),
          read: true,
          type: "sent",
          applicationId: selectedSME.id,
          availableDates: status === "Approved" ? updateData.availableDates : null,
        })
      }

      if (status === "Approved") {
        await addDoc(collection(db, "smeCalendarEvents"), {
          smeId,
          funderId,
          title: meetingPurpose,
          date: meetingTime,
          location: meetingLocation,
          type: "meeting",
          createdAt: new Date().toISOString(),
        })
      }

      setNotification({
        type: "success",
        message: `Application ${status === "Approved" ? "accepted and moved to Under Review" : "declined"} successfully`,
      })

      setTimeout(() => setNotification(null), 3000)
      resetModal()
    } catch (error) {
      console.error("Error updating application:", error)
      setNotification({
        type: "error",
        message: "Failed to update application",
      })
      setUpdatedStages((prev) => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetModal = () => {
    setSelectedSME(null)
    setModalType(null)
    setMessage("")
    setMeetingTime("")
    setMeetingLocation("")
    setMeetingPurpose("")
    setFormErrors({})
    setDocumentFile(null)
    setAmountAsked("")
    setAmountApproved("")
    setPaymentDeployment("")
    setInvestmentType("")
  }

  const getStatusBadgeClass = (status) => {
    const baseClass = styles.statusBadge

    switch (status) {
      case "Accepted":
      case "scheduled":
        return `${baseClass} ${styles.statusAccepted}`
      case "Declined":
        return `${baseClass} ${styles.statusDeclined}`
      case "Application Received":
        return `${baseClass} ${styles.statusPending}`
      default:
        return baseClass
    }
  }

  const openModal = (sme, type) => {
    setSelectedSME(sme)
    setModalType(type)

    if (type === "approve") {
      loadApplicationAvailability(sme)
    }

    setMessage("")
    setMeetingTime("")
    setMeetingLocation("")
    setMeetingPurpose("")
    setFormErrors({})
    setDocumentFile(null)
    setAmountAsked("")
    setAmountApproved("")
    setPaymentDeployment("")
    setInvestmentType("")
  }

  const handleSMENameClick = async (sme) => {
    try {
      setLoading(true)

      // Fetch SME profile
      const profileRef = doc(db, "universalProfiles", sme.smeId)
      const profileSnap = await getDoc(profileRef)

      // Fetch investor profile to get required documents
      const investorProfileRef = doc(db, "MyuniversalProfile", sme.funderId)
      const investorProfileSnap = await getDoc(investorProfileRef)

      if (profileSnap.exists()) {
        const profileData = profileSnap.data()
        const investorData = investorProfileSnap.exists() ? investorProfileSnap.data() : {}

        setSelectedSME({
          ...sme,
          ...profileData, // Merge the application data with the full profile data
          investorRequiredDocuments: investorData.formData?.productsServices?.requiredDocuments || [],
        })
        setModalType("view")
      } else {
        setSelectedSME(sme)
        setModalType("view")
      }
    } catch (error) {
      console.error("Error fetching profiles:", error)
      setNotification({
        type: "error",
        message: "Failed to load profile data",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBigScoreClick = (sme) => {
    const bigScoreData = bigScoresMap[sme.smeId]

    if (bigScoreData && bigScoreData.scores) {
      setBigScoreData({
        compliance: {
          score: bigScoreData.scores.compliance || 0,
          color: "#8D6E63",
        },
        legitimacy: {
          score: bigScoreData.scores.legitimacy || 0,
          color: "#5D4037",
        },
        fundability: {
          score: bigScoreData.scores.fundability || 0,
          color: "#3E2723",
        },
        pis: {
          score: bigScoreData.scores.pis || 0,
          color: "#4E342E",
        },
        leadership: {
          score: bigScoreData.scores.leadership || 0,
          color: "#6D4C41",
        },
        bigScore: {
          score: bigScoreData.scores.bigScore || 0,
          color: "#5D4037",
        },
      })

      setSelectedSME(sme)
      setModalType("bigScore")
    } else {
      console.warn("No BIG Score data found for SME:", sme.smeId)
      setNotification({
        type: "error",
        message: "No evaluation data available for this SME",
      })
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setFormErrors({ ...formErrors, message: "Please provide a message to the SME" })
      return
    }

    setIsSubmitting(true)

    try {
      setNotification({
        type: "success",
        message: "Message sent successfully",
      })

      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      setNotification({
        type: "error",
        message: "Failed to send message",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleScheduleMeeting = async () => {
    const errors = {}

    if (!meetingTime) {
      errors.meetingTime = "Please select a meeting time"
    }

    if (!meetingLocation.trim()) {
      errors.meetingLocation = "Please provide a meeting location"
    }

    if (!meetingPurpose.trim()) {
      errors.meetingPurpose = "Please provide a purpose for the meeting"
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)

    try {
      setNotification({
        type: "success",
        message: "Meeting scheduled successfully",
      })

      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      setNotification({
        type: "error",
        message: "Failed to schedule meeting",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextStageChange = (sme) => {
    setSelectedSMEForStage(sme)
    setShowNextStageModal(true)
    setNextStage("")
    setMessage("")
    setMeetingTime("")
    setMeetingLocation("")
    setMeetingPurpose("")
    setFormErrors({})
    setDocumentFile(null)
    setFundingAmount("")
    setInvestmentType("")
    setAmountAsked("")
    setAmountApproved("")
    setPaymentDeployment("")

    loadApplicationAvailability(sme)
  }

  const deriveNextStage = (stage) => {
    switch (stage) {
      case "Under Review":
        return "Funding Approved"
      case "Funding Approved":
        return "Termsheet"
      case "Termsheet":
        return "Deal Complete"
      case "Deal Complete":
        return "Closed"
      case "Deal Declined":
        return "Closed"
      default:
        return "Pending"
    }
  }

  const sendEmailToSME = async (smeId, subject, emailMessage, attachmentUrl = null) => {
    try {
      console.log("🔄 Using EmailJS service configuration...");

      const emailjsConfig = {
        serviceId: API_KEYS.SERVICE_ID_MESSAGES,
        templateId: API_KEYS.TEMPLATE_ID_MESSAGES,
        publicKey: API_KEYS.PUBLIC_KEY_ID_MESSAGES
      };

      console.log("📧 Using EmailJS config:", emailjsConfig);

      if (!window.emailjs) {
        emailjs.init(emailjsConfig.publicKey);
        window.emailjs = emailjs;
      }

      const user = auth.currentUser;
      const investorName = user?.displayName || "Investment Team";

      let smeEmail = null;
      console.log("📋 Fetching SMSE email for:", smeId);

      try {
        const universalProfileRef = doc(db, "universalProfiles", smeId);
        const universalProfileSnap = await getDoc(universalProfileRef);
        
        if (universalProfileSnap.exists()) {
          const profileData = universalProfileSnap.data();
          console.log("📄 universalProfiles data:", profileData);
          
          smeEmail = profileData.email || 
                     profileData.contactDetails?.email ||
                     profileData.contactEmail ||
                     profileData.businessEmail ||
                     profileData.personalEmail;
          
          if (smeEmail) {
            console.log("✅ Found SMSE email:", smeEmail);
          } else {
            console.log("❌ No email found in universalProfiles");
          }
        } else {
          console.log("❌ No document in universalProfiles for:", smeId);
        }
      } catch (fetchError) {
        console.error("❌ Error fetching SMSE email:", fetchError);
      }

      if (!smeEmail) {
        console.warn("⚠️ No SMSE email found, using fallback");
        smeEmail = "support@bigmarketplace.africa";
      }

      console.log("📧 Final recipient email:", smeEmail);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(smeEmail)) {
        throw new Error(`Invalid email format: "${smeEmail}"`);
      }

      const templateParams = {
        to_email: smeEmail,
        subject: subject,
        from_name: investorName,
        date: new Date().toLocaleDateString(),
        message: emailMessage,
        portal_url: `https://www.bigmarketplace.africa/applications/${user.uid}_${smeId}`,
        has_attachments: attachmentUrl ? "true" : "false",
        attachments_count: attachmentUrl ? "1" : "0"
      };

      console.log("📨 Sending with EmailJS service...", templateParams);

      const response = await window.emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        templateParams,
        emailjsConfig.publicKey
      );
      
      console.log("✅ Email sent successfully with EmailJS service!", response);
      return true;
      
    } catch (emailError) {
      console.error("❌ Email failed:", emailError);
      return false;
    }
  }

  const handleUpdateNextStage = async () => {
    const errors = {}

    if (!nextStage) {
      errors.nextStage = "Please select a next stage"
    }

    if (!message.trim()) {
      errors.message = "Please provide a message to the SME"
    }

    if (nextStage === "Under Review") {
      if (!availabilities.length) {
        errors.availabilities = "Please select at least one available date"
      }
      if (!meetingLocation.trim()) {
        errors.meetingLocation = "Please provide a meeting location"
      }
      if (!meetingPurpose.trim()) {
        errors.meetingPurpose = "Please provide a purpose for the meeting"
      }
    }

    if (nextStage === "Funding Approved") {
      if (!amountAsked.trim()) {
        errors.amountAsked = "Please enter the amount asked"
      }
      if (!amountApproved.trim()) {
        errors.amountApproved = "Please enter the amount approved"
      }
      if (!paymentDeployment.trim()) {
        errors.paymentDeployment = "Please specify how the payment will be deployed"
      }
      if (!investmentType) {
        errors.investmentType = "Please select an investment type"
      }
    }

    if (nextStage === "Termsheet" && !documentFile) {
      errors.documentFile = "Please attach a termsheet document"
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)

    try {
      setUpdatedStages((prev) => ({ ...prev, [selectedSMEForStage.id]: nextStage }))
      const appRef = doc(db, "investorApplications", selectedSMEForStage.id)
      const nextStageValue = deriveNextStage(nextStage)

      const updateData = {
        stage: nextStage,
        nextStage: nextStageValue,
        pipelineStage: nextStage,
        updatedAt: new Date().toISOString(),
      }

      // Add notification for stage change
      addInvestorNotification(
        `Application moved to ${nextStage} for ${selectedSMEForStage.smeName}`,
        "status_change",
        selectedSMEForStage.id,
        selectedSMEForStage.smeName
      )

      // Funding Approved specific data
      if (nextStage === "Funding Approved") {
        updateData.fundingDetails = {
          amountAsked,
          amountApproved,
          paymentDeployment,
          investmentType,
          approvedAt: new Date().toISOString(),
        }
      }

      await updateDoc(appRef, updateData)

      const auth = getAuth()
      const user = auth.currentUser
      const { smeId, funderId } = (await getDoc(appRef)).data()

      const smeQuery = query(
        collection(db, "smeApplications"),
        where("smeId", "==", smeId),
        where("funderId", "==", funderId),
      )
      const smeSnapshot = await getDocs(smeQuery)
      if (!smeSnapshot.empty) {
        const smeDocRef = smeSnapshot.docs[0].ref
        await updateDoc(smeDocRef, updateData)

        if (nextStage === "Under Review") {
          const availabilityData = availabilities.map((avail) => ({
            date: avail.date.toISOString(),
            timeSlots: avail.timeSlots,
            timeZone: avail.timeZone,
            status: avail.status,
          }))

          await updateDoc(appRef, {
            availableDates: availabilityData,
            meetingLocation,
            meetingPurpose,
          })

          await updateDoc(smeDocRef, {
            availableDates: availabilityData,
            meetingLocation,
            meetingPurpose,
          })

          await addDoc(collection(db, "smeCalendarEvents"), {
            smeId,
            funderId: user.uid,
            title: meetingPurpose,
            date: availabilityData[0].date,
            location: meetingLocation,
            type: "meeting",
            createdAt: new Date().toISOString(),
            availableDates: availabilityData,
          })
        }
      }

      // Upload termsheet if applicable
      let attachmentUrl = null
      if (nextStage === "Termsheet" && documentFile) {
        const fileRef = ref(storage, `termsheets/${selectedSMEForStage.id}/${documentFile.name}`)
        const snapshot = await uploadBytes(fileRef, documentFile)
        attachmentUrl = await getDownloadURL(snapshot.ref)
      }

      if (nextStage === "Deal Complete" && onDealComplete) {
        onDealComplete()
      }

      // Compose professional message for email
      let emailSubject = ""
      let emailMessage = ""

      switch (nextStage) {
        case "Under Review":
          emailSubject = `Application Update: Under Review - ${selectedSMEForStage.smeName}`
          emailMessage = `Dear ${selectedSMEForStage.smeName},\n\n` +
            `We are pleased to inform you that your application has moved to the "Under Review" stage of our evaluation process.\n\n` +
            `${message}\n\n` +
            `Meeting Invitation:\n` +
            `Purpose: ${meetingPurpose}\n` +
            `Location: ${meetingLocation}\n` +
            `Available Time Slots:\n` +
            availabilities
              .map((avail, idx) => {
                const dateStr = avail.date.toLocaleDateString("en-US", {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
                return `${idx + 1}. ${dateStr} at ${avail.timeSlots?.[0]?.start || "TBD"} - ${avail.timeSlots?.[0]?.end || "TBD"} (${avail.timeZone})`
              })
              .join("\n") +
            `\n\nPlease reply with your preferred meeting time from the options above.\n\n` +
            `Best regards,\nInvestment Team`
          break

        case "Funding Approved":
          emailSubject = `Congratulations! Funding Approved - ${selectedSMEForStage.smeName}`
          emailMessage = `Dear ${selectedSMEForStage.smeName},\n\n` +
            `Congratulations! Your funding application has been approved.\n\n` +
            `${message}\n\n` +
            `Funding Details:\n` +
            `Amount Requested: ${amountAsked}\n` +
            `Amount Approved: ${amountApproved}\n` +
            `Investment Type: ${investmentType}\n` +
            `Payment Deployment: ${paymentDeployment}\n\n` +
            `We will be in touch shortly with the next steps.\n\n` +
            `Best regards,\nFunding Team`
          break

        case "Termsheet":
          emailSubject = `Termsheet Shared - ${selectedSMEForStage.smeName}`
          emailMessage = `Dear ${selectedSMEForStage.smeName},\n\n` +
            `We are pleased to share the termsheet for your consideration.\n\n` +
            `${message}\n\n` +
            `The attached document outlines the proposed terms of our investment. ` +
            `Please review it carefully and let us know if you have any questions.\n\n` +
            `Best regards,\nInvestment Team`
          break

        case "Deal Complete":
          emailSubject = `Congratulations! Deal Approved - ${selectedSMEForStage.smeName}`
          emailMessage = `Dear ${selectedSMEForStage.smeName},\n\n` +
            `We are delighted to inform you that your funding application has been approved!\n\n` +
            `${message}\n\n` +
            `Our team will be in touch shortly to finalize the next steps. ` +
            `Congratulations on this exciting milestone for your business.\n\n` +
            `Best regards,\nInvestment Team`
          break

        case "Deal Declined":
          emailSubject = `Update on Your Funding Application - ${selectedSMEForStage.smeName}`
          emailMessage = `Dear ${selectedSMEForStage.smeName},\n\n` +
            `Thank you for presenting your business opportunity to our investment committee. ` +
            `After careful consideration and thorough evaluation, we regret to inform you that ` +
            `we are unable to proceed with funding at this time.\n\n` +
            `${message}\n\n` +
            `This decision does not reflect the quality of your business concept, and we encourage ` +
            `you to continue pursuing your entrepreneurial goals.\n\n` +
            `We wish you success in your future endeavors.\n\n` +
            `Respectfully,\nInvestment Committee`
          break

        default:
          emailSubject = `Application Status Update: ${selectedSMEForStage.smeName}`
          emailMessage = `Dear ${selectedSMEForStage.smeName},\n\n` +
            `This is to inform you that your application status has been updated to "${nextStage}".\n\n` +
            `${message}\n\n` +
            `Best regards,\nInvestment Team`
      }

      // Send email to SME
      const emailSent = await sendEmailToSME(smeId, emailSubject, emailMessage, attachmentUrl)

      // Also create internal message in the system
      const messagePayload = {
        to: smeId,
        from: user.uid,
        subject: emailSubject,
        content: message,
        date: new Date().toISOString(),
        read: false,
        type: "inbox",
        applicationId: selectedSMEForStage.id,
        attachments: attachmentUrl ? [attachmentUrl] : [],
      }

      await Promise.all([
        addDoc(collection(db, "messages"), messagePayload),
        addDoc(collection(db, "messages"), { ...messagePayload, read: true, type: "sent" }),
      ])

      if (emailSent) {
        setNotification({
          type: "success",
          message: `Application moved to ${nextStage} and notification sent successfully`,
        })
      } else {
        setNotification({
          type: "success", 
          message: `Application moved to ${nextStage} successfully (email notification failed)`
        })
      }

      setTimeout(() => setNotification(null), 3000)
      setShowNextStageModal(false)
    } catch (error) {
      console.error("Error updating next stage:", error)
      setNotification({
        type: "error",
        message: "Failed to update next stage",
      })
      setUpdatedStages((prev) => {
        const newState = { ...prev }
        delete newState[selectedSMEForStage.id]
        return newState
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (nextStage && defaultMessages[nextStage]) {
      setMessage(defaultMessages[nextStage])
    }
  }, [nextStage])

  if (loading) {
    return <div className={styles.loadingContainer}>Loading applications...</div>
  }
  if (authLoading || loading) {
    return <div className={styles.loadingContainer}>Loading applications...</div>
  }

  // Add this condition right after the loading check
  if (!user) {
    return <div className={styles.loadingContainer}>Please log in to view applications.</div>
  }

  const getStageColor = (stage) => {
    switch (stage?.toLowerCase()) {
      case "deal complete":
      case "deal successful":
        return { backgroundColor: "#2e7d32", color: "#ffffff" }
      case "deal declined":
      case "closed":
        return { backgroundColor: "#d32f2f", color: "#ffffff" }
      case "under review":
        return { backgroundColor: "#795548", color: "#ffffff" }
      case "funding approved":
        return { backgroundColor: "#388e3c", color: "#ffffff" }
      case "termsheet":
        return { backgroundColor: "#4e342e", color: "#ffffff" }
      default:
        return { backgroundColor: "#5d4037", color: "#ffffff" }
    }
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
    maxWidth: "750px",
    width: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    border: "none",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
    position: "relative",
  }

  // Enhanced Modal Title Style
  const modalTitleStyle = {
    color: "#3e2723",
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "32px",
    paddingBottom: "20px",
    borderBottom: "3px solid #8d6e63",
    textAlign: "center",
    letterSpacing: "-0.5px",
  }

  // Enhanced Big Score Modal Style
  const bigScoreModalStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "40px",
    maxWidth: "800px",
    width: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    border: "none",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
    position: "relative",
  }

  // Enhanced Progress Bar Container Style
  const progressBarContainerStyle = {
    width: "100%",
    height: "16px",
    backgroundColor: "#efebe9",
    borderRadius: "8px",
    marginTop: "12px",
    marginBottom: "28px",
    overflow: "hidden",
    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
  }

  // Enhanced Progress Bar Style
  const getProgressBarStyle = (score, color) => ({
    width: `${score}%`,
    height: "100%",
    backgroundColor: color,
    borderRadius: "8px",
    transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    background: `linear-gradient(90deg, ${color}, ${color}dd)`,
  })

  // Enhanced Score Card Style
  const scoreCardStyle = {
    backgroundColor: "#fafafa",
    borderRadius: "16px",
    padding: "28px",
    marginBottom: "28px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
    border: "1px solid #e8e8e8",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  }

  // Enhanced Score Title Style
  const scoreTitleStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  }

  // Enhanced Score Value Style
  const scoreValueStyle = (color) => ({
    fontSize: "28px",
    fontWeight: "800",
    color: color,
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
  })

  // Enhanced Calendar Modal Style
  const calendarModalStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "40px",
    maxWidth: "600px",
    width: "95%",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5)",
    border: "none",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
  }

  // Calculate total score
  const calculateTotalScore = () => {
    const { compliance, legitimacy, fundability, pis } = bigScoreData
    return Math.round(compliance.score * 0.35 + legitimacy.score * 0.15 + fundability.score * 0.35 + pis.score * 0.15)
  }

  return (
    <div className={styles.tableSection}>
      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>{notification.message}</div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.fundingTable}>
          <thead>
            <tr>
              <th>SMSE Name</th>
              <th>Location</th>
              <th>Sector</th>
              <th>Stage</th>
              <th>Funding Required</th>
              <th>Equity Offered</th>
              <th>Gurantees</th>
              <th>Support Required</th>
              <th>Application Date</th>
              <th>% Match</th>
              <th>Big Score</th>
              <th>Status/Actions</th>
            </tr>
          </thead>
          <tbody>
            {smes.length === 0 ? (
              <tr>
                <td colSpan="11" className={styles.noApplications}>
                  No applications received yet
                </td>
              </tr>
            ) : (
              smes.map((sme) => (
                <tr key={sme.id}>
                  <td>
                    <button
                      className={styles.smeNameLink}
                      onClick={() => handleSMENameClick(sme)}
                      style={{ textDecoration: "underline", color: "#5d4037", fontWeight: "500" }}
                    >
                      {sme.smeName}
                    </button>
                  </td>
                  <td>{formatLabel(sme.location)}</td>
                  <td>{formatLabel(sme.sector)}</td>
                  <td>{formatLabel(sme.stage)}</td>
                  <td>{sme.fundingNeeded ? `R${Number(sme.fundingNeeded).toLocaleString()}` : "N/A"}</td>
                  <td>{formatLabel(sme.investmentType)}</td>
                  <td>{sme.gurantees ? formatLabel(sme.gurantees) : "N/A"}</td>
                  <td>{sme.supportRequired ? formatLabel(sme.supportRequired) : "N/A"}</td>
                  <td>{sme.applicationDate}</td>
                  <td>
                    <div className={styles.matchPercentage}>
                      <div className={styles.matchBar} style={{ width: `${sme.matchPercentage}%` }}></div>
                      <span>{sme.matchPercentage}%</span>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleBigScoreClick(sme)}
                      title="View detailed score breakdown"
                      style={{
                        color: "#5d4037",
                        textDecoration: "underline",
                        cursor: "pointer",
                        background: "none",
                        border: "none",
                        padding: 0,
                        font: "inherit",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {bigScoresMap[sme.smeId]?.scores?.bigScore ?? "N/A"}
                      <BarChart3 size={14} />
                    </button>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {updatedStages[sme.id] || sme.pipelineStage ? (
                      <button
                        className={styles.stageBadgeButton}
                        onClick={() => handleNextStageChange(sme)}
                        title="Update Stage"
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-block",
                            padding: "6px 12px",
                            borderRadius: "16px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            ...getStageColor(updatedStages[sme.id] || sme.pipelineStage),
                          }}
                        >
                          {(updatedStages[sme.id] || sme.pipelineStage) === "Application Received"
                            ? "Update Stage"
                            : updatedStages[sme.id] || sme.pipelineStage}
                        </div>
                      </button>
                    ) : (
                      <>
                        <button
                          className={styles.actionBtn}
                          title="Set Stage"
                          onClick={() => handleNextStageChange(sme)}
                          style={{
                            backgroundColor: "#5d4037",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: "28px",
                            height: "28px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: "8px",
                            cursor: "pointer",
                          }}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          className={styles.actionBtn}
                          title="Decline application"
                          onClick={() => openModal(sme, "decline")}
                          disabled={sme.status === "Declined"}
                          style={{
                            backgroundColor: "#d32f2f",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: "28px",
                            height: "28px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: sme.status === "Declined" ? "not-allowed" : "pointer",
                            opacity: sme.status === "Declined" ? 0.5 : 1,
                          }}
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedSME && modalType === "bigScore" && (
        <div style={modalOverlayStyle} onClick={resetModal}>
          <div style={bigScoreModalStyle} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "32px",
              }}
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
                {bigScoreData.bigScore?.score || "N/A"}
              </div>
            </div>

            <p style={{ fontSize: "18px", color: "#5d4037", marginBottom: "32px", lineHeight: "1.6" }}>
              The BIG Score is a comprehensive evaluation of {selectedSME.smeName}'s investment readiness.
            </p>

            {/* Compliance Score */}
            <div style={scoreCardStyle}>
              <div style={scoreTitleStyle}>
                <h4 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
                  Compliance Score (35%)
                  <span
                    style={{ display: "block", fontSize: "16px", fontWeight: "400", color: "#666", marginTop: "4px" }}
                  >
                    Legal and regulatory documentation completeness
                  </span>
                </h4>
                <span style={scoreValueStyle(bigScoreData.compliance.color)}>{bigScoreData.compliance.score}%</span>
              </div>
              <div style={progressBarContainerStyle}>
                <div style={getProgressBarStyle(bigScoreData.compliance.score, bigScoreData.compliance.color)}></div>
              </div>
            </div>

            {/* Legitimacy Score */}
            <div style={scoreCardStyle}>
              <div style={scoreTitleStyle}>
                <h4 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
                  Legitimacy Score (15%)
                  <span
                    style={{ display: "block", fontSize: "16px", fontWeight: "400", color: "#666", marginTop: "4px" }}
                  >
                    Professional presentation and market credibility
                  </span>
                </h4>
                <span style={scoreValueStyle(bigScoreData.legitimacy.color)}>{bigScoreData.legitimacy.score}%</span>
              </div>
              <div style={progressBarContainerStyle}>
                <div style={getProgressBarStyle(bigScoreData.legitimacy.score, bigScoreData.legitimacy.color)}></div>
              </div>
            </div>

            {/* Fundability Score */}
            <div style={scoreCardStyle}>
              <div style={scoreTitleStyle}>
                <h4 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
                  Fundability Score (35%)
                  <span
                    style={{ display: "block", fontSize: "16px", fontWeight: "400", color: "#666", marginTop: "4px" }}
                  >
                    Investment readiness and growth potential
                  </span>
                </h4>
                <span style={scoreValueStyle(bigScoreData.fundability.color)}>{bigScoreData.fundability.score}%</span>
              </div>
              <div style={progressBarContainerStyle}>
                <div style={getProgressBarStyle(bigScoreData.fundability.score, bigScoreData.fundability.color)}></div>
              </div>
            </div>

            {/* PIS Score */}
            <div style={scoreCardStyle}>
              <div style={scoreTitleStyle}>
                <h4 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
                  PIS Score (15%)
                  <span
                    style={{ display: "block", fontSize: "16px", fontWeight: "400", color: "#666", marginTop: "4px" }}
                  >
                    Performance indicators and strategic metrics
                  </span>
                </h4>
                <span style={scoreValueStyle(bigScoreData.pis.color)}>{bigScoreData.pis.score}%</span>
              </div>
              <div style={progressBarContainerStyle}>
                <div style={getProgressBarStyle(bigScoreData.pis.score, bigScoreData.pis.color)}></div>
              </div>
            </div>

            {/* Leadership Score Section */}
            <div style={scoreCardStyle}>
              <div style={scoreTitleStyle}>
                <h4 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
                  Leadership Score
                  <span
                    style={{ display: "block", fontSize: "16px", fontWeight: "400", color: "#666", marginTop: "4px" }}
                  >
                    Management team quality and experience
                  </span>
                </h4>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "800",
                    color: "#6D4C41",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {bigScoreData.leadership.score}%
                </span>
              </div>
              <div style={progressBarContainerStyle}>
                <div
                  style={{
                    width: `${bigScoreData.leadership.score}%`,
                    height: "100%",
                    backgroundColor: "#6D4C41",
                    borderRadius: "8px",
                    transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    background: `linear-gradient(90deg, #6D4C41, #6D4C41dd)`,
                  }}
                ></div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#f3e5f5",
                padding: "24px",
                borderRadius: "16px",
                marginTop: "32px",
                marginBottom: "32px",
                border: "1px solid #ce93d8",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <Info size={24} style={{ color: "#5d4037" }} />
                <p style={{ margin: 0, color: "#5d4037", fontSize: "16px", lineHeight: "1.5" }}>
                  The BIG Score is calculated based on a weighted average of the components above.
                </p>
              </div>
            </div>

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
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 16px rgba(93, 64, 55, 0.3)",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#4e342e"
                  e.target.style.transform = "translateY(-2px)"
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#5d4037"
                  e.target.style.transform = "translateY(0)"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSME && modalType && modalType !== "bigScore" && (
        <div style={modalOverlayStyle} onClick={resetModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalTitleStyle}>
              {modalType === "approve"
                ? "Accept Application"
                : modalType === "decline"
                  ? "Decline Application"
                  : "View SME Application"}
            </h3>
            <p className={styles.modalSMEName}>
              <strong>{selectedSME.smeName}</strong>
            </p>

            {selectedSME && modalType === "view" && (
              <div style={modalOverlayStyle} onClick={resetModal}>
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "20px",
                    padding: "40px",
                    maxWidth: "950px",
                    width: "95%",
                    maxHeight: "95vh",
                    overflowY: "auto",
                    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
                    border: "none",
                    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Enhanced Profile Header with Logo */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "32px",
                      marginBottom: "40px",
                      padding: "32px",
                      background: "linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%)",
                      borderRadius: "16px",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
                    }}
                  >
                    {selectedSME.entityOverview?.companyLogo?.[0] ? (
                      <img
                        src={selectedSME.entityOverview.companyLogo[0] || "/placeholder.svg"}
                        alt="Company Logo"
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "contain",
                          borderRadius: "12px",
                          backgroundColor: "#fff",
                          padding: "12px",
                          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100px",
                          height: "100px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "linear-gradient(135deg, #5d4037 0%, #4e342e 100%)",
                          color: "#fff",
                          fontSize: "40px",
                          fontWeight: "800",
                          borderRadius: "12px",
                          boxShadow: "0 4px 16px rgba(93, 64, 55, 0.3)",
                        }}
                      >
                        {selectedSME.smeName?.charAt(0).toUpperCase() || "S"}
                      </div>
                    )}

                    <div>
                      <h1
                        style={{
                          margin: "0 0 12px 0",
                          fontSize: "32px",
                          fontWeight: "800",
                          color: "#3e2723",
                          letterSpacing: "-0.5px",
                        }}
                      >
                        {selectedSME.entityOverview?.tradingName ||
                          selectedSME.entityOverview?.registeredName ||
                          selectedSME.smeName ||
                          "Unnamed Business"}
                      </h1>
                      <p
                        style={{
                          margin: "0 0 16px 0",
                          fontSize: "16px",
                          color: "#5d4037",
                          fontWeight: "500",
                        }}
                      >
                        {formatLabel(selectedSME.entityOverview?.economicSectors?.[0])} •{" "}
                        {formatLabel(selectedSME.entityOverview?.operationStage)} •{" "}
                        {formatLabel(selectedSME.entityOverview?.location)}
                      </p>
                      <div
                        style={{
                          display: "inline-block",
                          padding: "8px 20px",
                          background: "linear-gradient(135deg, #5d4037 0%, #4e342e 100%)",
                          color: "#fff",
                          borderRadius: "20px",
                          fontSize: "16px",
                          fontWeight: "600",
                          boxShadow: "0 4px 16px rgba(93, 64, 55, 0.3)",
                        }}
                      >
                        {selectedSME.matchPercentage}% Match
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Main Profile Content */}
                  <div style={{ padding: "0 8px" }}>
                    {/* Entity Overview Section */}
                    <div
                      style={{
                        marginBottom: "40px",
                        backgroundColor: "#fff",
                        borderRadius: "16px",
                        padding: "32px",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
                        border: "1px solid #e8e8e8",
                      }}
                    >
                      <h2
                        style={{
                          margin: "0 0 24px 0",
                          fontSize: "24px",
                          fontWeight: "700",
                          color: "#3e2723",
                          paddingBottom: "16px",
                          borderBottom: "3px solid #8d6e63",
                        }}
                      >
                        Entity Overview
                      </h2>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                          gap: "24px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Registered Name:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.entityOverview?.registeredName || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Trading Name:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.entityOverview?.tradingName || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Registration Number:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.entityOverview?.registrationNumber || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Entity Type:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {formatLabel(selectedSME.entityOverview?.entityType)}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Entity Size:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {formatLabel(selectedSME.entityOverview?.entitySize)}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Financial Year End:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.entityOverview?.financialYearEnd || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Number of Employees:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.entityOverview?.employeeCount || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Years in Operation:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.entityOverview?.yearsInOperation || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Operation Stage:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {formatLabel(selectedSME.entityOverview?.operationStage)}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Location:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {formatLabel(selectedSME.entityOverview?.location)}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Province:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {formatLabel(selectedSME.entityOverview?.province)}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Economic Sectors:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.entityOverview?.economicSectors
                              ? formatLabel(selectedSME.entityOverview.economicSectors.join(", "))
                              : "N/A"}
                          </span>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Business Description:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.entityOverview?.businessDescription || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Application Overview Section */}
                    <div
                      style={{
                        marginBottom: "40px",
                        backgroundColor: "#fff",
                        borderRadius: "16px",
                        padding: "32px",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
                        border: "1px solid #e8e8e8",
                      }}
                    >
                      <h2
                        style={{
                          margin: "0 0 24px 0",
                          fontSize: "24px",
                          fontWeight: "700",
                          color: "#3e2723",
                          paddingBottom: "16px",
                          borderBottom: "3px solid #8d6e63",
                        }}
                      >
                        Application Overview
                      </h2>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                          gap: "24px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Application Date:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.applicationOverview?.applicationDate || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Application Type:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.applicationOverview?.applicationType || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Funding Stage:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {formatLabel(selectedSME.applicationOverview?.fundingStage)}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Preferred Start Date:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.applicationOverview?.preferredStartDate || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Submission Channel:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.applicationOverview?.submissionChannel || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Support Format:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {formatLabel(selectedSME.applicationOverview?.supportFormat)}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Urgency:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {formatLabel(selectedSME.applicationOverview?.urgency)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Use of Funds Section */}
                    <div
                      style={{
                        marginBottom: "40px",
                        backgroundColor: "#fff",
                        borderRadius: "16px",
                        padding: "32px",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
                        border: "1px solid #e8e8e8",
                      }}
                    >
                      <h2
                        style={{
                          margin: "0 0 24px 0",
                          fontSize: "24px",
                          fontWeight: "700",
                          color: "#3e2723",
                          paddingBottom: "16px",
                          borderBottom: "3px solid #8d6e63",
                        }}
                      >
                        Use of Funds
                      </h2>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                          gap: "24px",
                          marginBottom: "32px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Amount Requested:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.useOfFunds?.amountRequested || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Personal Equity Contributed:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.useOfFunds?.personalEquityContributed || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Funding Instruments Preferred:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.useOfFunds?.fundingInstrumentsPreferred
                              ? formatLabel(selectedSME.useOfFunds.fundingInstrumentsPreferred.join(", "))
                              : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Type of Funder Preferred:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.useOfFunds?.typeOfFunderPreferred
                              ? formatLabel(selectedSME.useOfFunds.typeOfFunderPreferred.join(", "))
                              : "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Purpose of Funds Table */}
                      <h3
                        style={{
                          margin: "0 0 20px 0",
                          fontSize: "20px",
                          fontWeight: "600",
                          color: "#3e2723",
                        }}
                      >
                        Purpose of Funds
                      </h3>
                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            backgroundColor: "#fff",
                            borderRadius: "12px",
                            overflow: "hidden",
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                          }}
                        >
                          <thead>
                            <tr style={{ background: "linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%)" }}>
                              <th
                                style={{
                                  padding: "16px",
                                  textAlign: "left",
                                  fontWeight: "700",
                                  color: "#3e2723",
                                  borderBottom: "2px solid #e0e0e0",
                                  fontSize: "16px",
                                }}
                              >
                                Category
                              </th>
                              <th
                                style={{
                                  padding: "16px",
                                  textAlign: "left",
                                  fontWeight: "700",
                                  color: "#3e2723",
                                  borderBottom: "2px solid #e0e0e0",
                                  fontSize: "16px",
                                }}
                              >
                                Sub-area
                              </th>
                              <th
                                style={{
                                  padding: "16px",
                                  textAlign: "left",
                                  fontWeight: "700",
                                  color: "#3e2723",
                                  borderBottom: "2px solid #e0e0e0",
                                  fontSize: "16px",
                                }}
                              >
                                Description
                              </th>
                              <th
                                style={{
                                  padding: "16px",
                                  textAlign: "left",
                                  fontWeight: "700",
                                  color: "#3e2723",
                                  borderBottom: "2px solid #e0e0e0",
                                  fontSize: "16px",
                                }}
                              >
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedSME.useOfFunds?.fundingItems?.map((item, index) => (
                              <tr key={index} style={{ borderBottom: index % 2 === 0 ? "1px solid #f8f8f8" : "none" }}>
                                <td
                                  style={{
                                    padding: "16px",
                                    borderBottom: "1px solid #f0f0f0",
                                    fontSize: "15px",
                                  }}
                                >
                                  {formatLabel(item.category)}
                                </td>
                                <td
                                  style={{
                                    padding: "16px",
                                    borderBottom: "1px solid #f0f0f0",
                                    fontSize: "15px",
                                  }}
                                >
                                  {formatLabel(item.subArea)}
                                </td>
                                <td
                                  style={{
                                    padding: "16px",
                                    borderBottom: "1px solid #f0f0f0",
                                    fontSize: "15px",
                                  }}
                                >
                                  {item.description}
                                </td>
                                <td
                                  style={{
                                    padding: "16px",
                                    borderBottom: "1px solid #f0f0f0",
                                    fontSize: "15px",
                                    fontWeight: "600",
                                  }}
                                >
                                  {item.amount}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Enterprise Readiness Section */}
                    <div
                      style={{
                        marginBottom: "40px",
                        backgroundColor: "#fff",
                        borderRadius: "16px",
                        padding: "32px",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
                        border: "1px solid #e8e8e8",
                      }}
                    >
                      <h2
                        style={{
                          margin: "0 0 24px 0",
                          fontSize: "24px",
                          fontWeight: "700",
                          color: "#3e2723",
                          paddingBottom: "16px",
                          borderBottom: "3px solid #8d6e63",
                        }}
                      >
                        Enterprise Readiness
                      </h2>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                          gap: "24px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Has Business Plan:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.enterpriseReadiness?.hasBusinessPlan || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Has Pitch Deck:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.enterpriseReadiness?.hasPitchDeck || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Has MVP/Prototype:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.enterpriseReadiness?.hasMVPPrototype || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Has Traction:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.enterpriseReadiness?.hasTraction || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Has Audited Financials:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.enterpriseReadiness?.hasAuditedFinancials || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Has Mentor:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.enterpriseReadiness?.hasMentor || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Has Advisors/Board:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.enterpriseReadiness?.hasAdvisorsBoard || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Main Barriers to Growth:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.enterpriseReadiness?.mainBarriersToGrowth
                              ? formatLabel(selectedSME.enterpriseReadiness.mainBarriersToGrowth.join(", "))
                              : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Support Previously Received:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.enterpriseReadiness?.supportPreviouslyReceived || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Current Paying Customers:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.enterpriseReadiness?.currentPayingCustomers || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Overview Section */}
                    <div
                      style={{
                        marginBottom: "40px",
                        backgroundColor: "#fff",
                        borderRadius: "16px",
                        padding: "32px",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
                        border: "1px solid #e8e8e8",
                      }}
                    >
                      <h2
                        style={{
                          margin: "0 0 24px 0",
                          fontSize: "24px",
                          fontWeight: "700",
                          color: "#3e2723",
                          paddingBottom: "16px",
                          borderBottom: "3px solid #8d6e63",
                        }}
                      >
                        Financial Overview
                      </h2>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                          gap: "24px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Generates Revenue:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.financialOverview?.generatesRevenue || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Annual Revenue:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.financialOverview?.annualRevenue
                              ? `R${Number(selectedSME.financialOverview.annualRevenue).toLocaleString()}`
                              : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Current Valuation:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.financialOverview?.currentValuation
                              ? `R${Number(selectedSME.financialOverview.currentValuation).toLocaleString()}`
                              : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Profitability Status:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {formatLabel(selectedSME.financialOverview?.profitabilityStatus)}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Existing Debt or Loans:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.financialOverview?.existingDebtOrLoans
                              ? `R${Number(selectedSME.financialOverview.existingDebtOrLoans).toLocaleString()}`
                              : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Fundraising History:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.financialOverview?.fundraisingHistory || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Growth Potential Section */}
                    <div
                      style={{
                        marginBottom: "40px",
                        backgroundColor: "#fff",
                        borderRadius: "16px",
                        padding: "32px",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
                        border: "1px solid #e8e8e8",
                      }}
                    >
                      <h2
                        style={{
                          margin: "0 0 24px 0",
                          fontSize: "24px",
                          fontWeight: "700",
                          color: "#3e2723",
                          paddingBottom: "16px",
                          borderBottom: "3px solid #8d6e63",
                        }}
                      >
                        Growth Potential
                      </h2>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                          gap: "24px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Market Share:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.growthPotential?.marketShare || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Quality Improvement:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.growthPotential?.qualityImprovement || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Green Technology:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.growthPotential?.greenTechnology || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Localisation:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.growthPotential?.localisation || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Regional Spread:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.growthPotential?.regionalSpread || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Personal Risk:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.growthPotential?.personalRisk || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Empowerment:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.growthPotential?.empowerment || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Employment Increase:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.growthPotential?.employmentIncrease || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Social Impact & Alignment Section */}
                    <div
                      style={{
                        marginBottom: "40px",
                        backgroundColor: "#fff",
                        borderRadius: "16px",
                        padding: "32px",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
                        border: "1px solid #e8e8e8",
                      }}
                    >
                      <h2
                        style={{
                          margin: "0 0 24px 0",
                          fontSize: "24px",
                          fontWeight: "700",
                          color: "#3e2723",
                          paddingBottom: "16px",
                          borderBottom: "3px solid #8d6e63",
                        }}
                      >
                        Social Impact & Alignment
                      </h2>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                          gap: "24px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Jobs to be Created (Next 12 months):
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.socialImpact?.jobsToBeCreated || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Youth Ownership %:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.socialImpact?.youthOwnership || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Women Ownership %:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.socialImpact?.womenOwnership || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Black Ownership %:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.socialImpact?.blackOwnership || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Environmental or Community Impact:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.socialImpact?.environmentalCommunityImpact || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#5d4037",
                              marginBottom: "8px",
                            }}
                          >
                            Alignment with SDGs or ESD priorities:
                          </span>
                          <span style={{ fontSize: "16px", color: "#333" }}>
                            {selectedSME.socialImpact?.alignmentWithSDGs || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* New Required Documents Section */}
                    <div
                      style={{
                        marginBottom: "40px",
                        backgroundColor: "#fff",
                        borderRadius: "16px",
                        padding: "32px",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
                        border: "1px solid #e8e8e8",
                      }}
                    >
                      <h2
                        style={{
                          margin: "0 0 24px 0",
                          fontSize: "24px",
                          fontWeight: "700",
                          color: "#3e2723",
                          paddingBottom: "16px",
                          borderBottom: "3px solid #8d6e63",
                        }}
                      >
                        Submitted Documents
                      </h2>

                      {selectedSME.documents && selectedSME.documents.length > 0 ? (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                            gap: "24px",
                          }}
                        >
                          {selectedSME.documents.map((docType, index) => (
                            <div key={index}>
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "16px",
                                  fontWeight: "600",
                                  color: "#5d4037",
                                  marginBottom: "8px",
                                }}
                              >
                                {formatLabel(docType)}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Check size={16} color="#388e3c" />
                                <span style={{ fontSize: "16px", color: "#333" }}>Submitted</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: "16px",
                            backgroundColor: "#fff3e0",
                            borderRadius: "8px",
                            border: "1px solid #ffb74d",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <AlertTriangle size={20} color="#5d4037" />
                          <span style={{ fontSize: "16px", color: "#5d4037" }}>
                            No documents have been submitted yet
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Requested Documents Section */}
                    {selectedSME.investorRequiredDocuments && selectedSME.investorRequiredDocuments.length > 0 && (
                      <div
                        style={{
                          marginBottom: "40px",
                          backgroundColor: "#fff",
                          borderRadius: "16px",
                          padding: "32px",
                          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
                          border: "1px solid #e8e8e8",
                        }}
                      >
                        <h2
                          style={{
                            margin: "0 0 24px 0",
                            fontSize: "24px",
                            fontWeight: "700",
                            color: "#3e2723",
                            paddingBottom: "16px",
                            borderBottom: "3px solid #8d6e63",
                          }}
                        >
                          Required Documents
                        </h2>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                            gap: "24px",
                          }}
                        >
                          {selectedSME.investorRequiredDocuments.map((docType, index) => (
                            <div key={index}>
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "16px",
                                  fontWeight: "600",
                                  color: "#5d4037",
                                  marginBottom: "8px",
                                }}
                              >
                                {formatLabel(docType)}:
                              </span>
                              <span style={{ fontSize: "16px", color: "#333" }}>
                                {selectedSME.documents && selectedSME.documents[docType]
                                  ? "Submitted"
                                  : "Not submitted"}
                              </span>
                              {selectedSME.documents && selectedSME.documents[docType] && (
                                <a
                                  href={selectedSME.documents[docType]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "inline-block",
                                    marginTop: "8px",
                                    color: "#5d4037",
                                    textDecoration: "underline",
                                    fontSize: "14px",
                                  }}
                                >
                                  View Document
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Modal Actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "40px" }}>
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
                        transition: "all 0.3s ease",
                        boxShadow: "0 4px 16px rgba(93, 64, 55, 0.3)",
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
                      Close Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

            {modalType !== "view" && (
              <>
                <div className={styles.messageBox}>
                  <label>
                    Message to SME:
                    <div className={styles.tooltip}>
                      <Info size={14} className={styles.infoIcon} />
                      <span className={styles.tooltipText}>
                        {modalType === "approve"
                          ? "Explain why you're accepting their application and provide next steps"
                          : "Explain why you're declining their application and provide constructive feedback"}
                      </span>
                    </div>
                  </label>
                  <div className={styles.messageContainer}>
                    <textarea
                      className={`${styles.messageInput} ${formErrors.message ? styles.inputError : ""}`}
                      rows="4"
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value)
                        if (e.target.value.trim()) {
                          setFormErrors({ ...formErrors, message: null })
                        }
                      }}
                      placeholder={
                        modalType === "approve"
                          ? "We're pleased to inform you that your application has been accepted. Please find the meeting details below..."
                          : "After careful consideration, we regret to inform you that your application hasn't been successful this time because..."
                      }
                    />
                    {message && (
                      <div className={styles.messagePreview}>
                        <strong>Preview:</strong> {message.substring(0, 100)}
                        {message.length > 100 ? "..." : ""}
                      </div>
                    )}
                  </div>
                  {formErrors.message && (
                    <p className={styles.errorText}>
                      <AlertTriangle size={14} /> {formErrors.message}
                    </p>
                  )}
                </div>

                {modalType === "approve" && (
                  <div className={styles.meetingFields}>
                    <div>
                      <label>Initial discovery meeting:</label>
                      <input
                        type="text"
                        className={`${styles.meetingInput} ${formErrors.meetingPurpose ? styles.inputError : ""}`}
                        value={meetingPurpose}
                        onChange={(e) => {
                          setMeetingPurpose(e.target.value)
                          if (e.target.value.trim()) {
                            setFormErrors({ ...formErrors, meetingPurpose: null })
                          }
                        }}
                        placeholder="e.g., Initial Discussion, Due Diligence, etc."
                      />
                      {formErrors.meetingPurpose && (
                        <p className={styles.errorText}>
                          <AlertTriangle size={14} /> {formErrors.meetingPurpose}
                        </p>
                      )}
                    </div>

                    <div>
                      <label>Meeting Location:</label>
                      <input
                        type="text"
                        className={`${styles.meetingInput} ${formErrors.meetingLocation ? styles.inputError : ""}`}
                        value={meetingLocation}
                        onChange={(e) => {
                          setMeetingLocation(e.target.value)
                          if (e.target.value.trim()) {
                            setFormErrors({ ...formErrors, meetingLocation: null })
                          }
                        }}
                        placeholder="e.g., Office, Virtual Meeting, etc."
                      />
                      {formErrors.meetingLocation && (
                        <p className={styles.errorText}>
                          <AlertTriangle size={14} /> {formErrors.meetingLocation}
                        </p>
                      )}

                      {showCalendarModal && (
                        <div style={modalOverlayStyle} onClick={() => setShowCalendarModal(false)}>
                          <div style={calendarModalStyle} onClick={(e) => e.stopPropagation()}>
                            <h3
                              style={{
                                fontSize: "24px",
                                fontWeight: "700",
                                color: "#3e2723",
                                marginBottom: "24px",
                                textAlign: "center",
                              }}
                            >
                              Select Available Meeting Dates
                            </h3>

                            <div
                              style={{
                                backgroundColor: "#f8f5f3",
                                padding: "20px",
                                borderRadius: "12px",
                                marginBottom: "24px",
                                border: "1px solid #8d6e63",
                              }}
                            >
                              <label
                                style={{
                                  display: "block",
                                  fontSize: "16px",
                                  fontWeight: "600",
                                  color: "#3e2723",
                                  marginBottom: "12px",
                                }}
                              >
                                Available Time:
                              </label>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <input
                                  type="time"
                                  value={timeSlot.start}
                                  onChange={(e) => handleTimeChange("start", e.target.value)}
                                  style={{
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "2px solid #8d6e63",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#5d4037",
                                  }}
                                >
                                  to
                                </span>
                                <input
                                  type="time"
                                  value={timeSlot.end}
                                  onChange={(e) => handleTimeChange("end", e.target.value)}
                                  style={{
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "2px solid #8d6e63",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                  }}
                                />
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                marginBottom: "24px",
                              }}
                            >
                              <DayPicker
                                mode="multiple"
                                selected={tempDates}
                                onSelect={handleDateSelect}
                                style={{
                                  backgroundColor: "#ffffff",
                                  borderRadius: "12px",
                                  padding: "20px",
                                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                                  border: "1px solid #e0e0e0",
                                }}
                              />
                            </div>

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "16px",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => setShowCalendarModal(false)}
                                style={{
                                  backgroundColor: "transparent",
                                  color: "#5d4037",
                                  border: "2px solid #5d4037",
                                  borderRadius: "12px",
                                  padding: "14px 28px",
                                  fontSize: "16px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  transition: "all 0.3s ease",
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={saveSelectedDates}
                                disabled={!tempDates.length}
                                style={{
                                  background: tempDates.length
                                    ? "linear-gradient(135deg, #5d4037 0%, #4e342e 100%)"
                                    : "#ccc",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "12px",
                                  padding: "14px 28px",
                                  fontSize: "16px",
                                  fontWeight: "600",
                                  cursor: tempDates.length ? "pointer" : "not-allowed",
                                  transition: "all 0.3s ease",
                                  boxShadow: tempDates.length ? "0 4px 16px rgba(93, 64, 55, 0.3)" : "none",
                                }}
                              >
                                Save Dates ({tempDates.length})
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.availabilitySection}>
                      <label>Available Meeting Dates:</label>
                      <button
                        type="button"
                        className={styles.selectDatesBtn}
                        onClick={() => {
                          setTempDates([])
                          setShowCalendarModal(true)
                        }}
                      >
                        + Select Available Dates
                      </button>

                      {availabilities.length > 0 && (
                        <div className={styles.availabilityList}>
                          {availabilities
                            .sort((a, b) => a.date - b.date)
                            .map((availability, index) => (
                              <div key={index} className={styles.availabilityItem}>
                                <span className={styles.availabilityDate}>
                                  {availability.date.toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                <span className={styles.availabilityTime}>
                                  {availability.timeSlots[0].start} - {availability.timeSlots[0].end}
                                </span>
                                <button
                                  type="button"
                                  className={styles.removeBtn}
                                  onClick={() => removeAvailability(availability.date)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                        </div>
                      )}

                      {formErrors.availabilities && (
                        <p className={styles.errorText}>
                          <AlertTriangle size={14} /> {formErrors.availabilities}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className={styles.modalActions}>
              {modalType !== "view" && (
                <>
                  <button
                    className={modalType === "approve" ? styles.acceptBtn : styles.declineBtn}
                    onClick={() =>
                      handleUpdateStatus(selectedSME.id, modalType === "approve" ? "Approved" : "Declined")
                    }
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className={styles.loadingSpinner}></span>
                    ) : (
                      <>
                        <CalendarCheck2 size={16} /> {modalType === "approve" ? "Schedule Meeting" : "Decline"}
                      </>
                    )}
                  </button>
                </>
              )}
              <button className={styles.cancelBtn} onClick={resetModal} disabled={isSubmitting}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showNextStageModal && selectedSMEForStage && (
        <div style={modalOverlayStyle} onClick={() => setShowNextStageModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalTitleStyle}>Set Next Stage for {selectedSMEForStage.smeName}</h3>

            <div className={styles.stageSelection}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "32px",
                  justifyItems: "center",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => setNextStage("Under Review")}
                  style={{
                    padding: "20px 24px",
                    borderRadius: "16px",
                    border: nextStage === "Under Review" ? "3px solid #795548" : "2px solid #e0e0e0",
                    backgroundColor: nextStage === "Under Review" ? "#795548" : "#ffffff",
                    color: nextStage === "Under Review" ? "#ffffff" : "#3e2723",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow:
                      nextStage === "Under Review"
                        ? "0 8px 24px rgba(121, 85, 72, 0.4)"
                        : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  Under Review
                </button>
                <button
                  onClick={() => setNextStage("Funding Approved")}
                  style={{
                    padding: "20px 24px",
                    borderRadius: "16px",
                    border: nextStage === "Funding Approved" ? "3px solid #388e3c" : "2px solid #e0e0e0",
                    backgroundColor: nextStage === "Funding Approved" ? "#388e3c" : "#ffffff",
                    color: nextStage === "Funding Approved" ? "#ffffff" : "#3e2723",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow:
                      nextStage === "Funding Approved"
                        ? "0 8px 24px rgba(56, 142, 60, 0.4)"
                        : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  Funding Approved
                </button>
                <button
                  onClick={() => setNextStage("Termsheet")}
                  style={{
                    padding: "20px 24px",
                    borderRadius: "16px",
                    border: nextStage === "Termsheet" ? "3px solid #4e342e" : "2px solid #e0e0e0",
                    backgroundColor: nextStage === "Termsheet" ? "#4e342e" : "#ffffff",
                    color: nextStage === "Termsheet" ? "#ffffff" : "#3e2723",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow:
                      nextStage === "Termsheet" ? "0 8px 24px rgba(78, 52, 46, 0.4)" : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  Termsheet
                </button>
                <button
                  onClick={() => setNextStage("Deal Complete")}
                  style={{
                    padding: "20px 24px",
                    borderRadius: "16px",
                    border: nextStage === "Deal Complete" ? "3px solid #2e7d32" : "2px solid #e0e0e0",
                    backgroundColor: nextStage === "Deal Complete" ? "#2e7d32" : "#ffffff",
                    color: nextStage === "Deal Complete" ? "#ffffff" : "#3e2723",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow:
                      nextStage === "Deal Complete"
                        ? "0 8px 24px rgba(46, 125, 50, 0.4)"
                        : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  Deal Complete
                </button>
                <button
                  onClick={() => setNextStage("Deal Declined")}
                  style={{
                    padding: "20px 24px",
                    borderRadius: "16px",
                    border: nextStage === "Deal Declined" ? "3px solid #d32f2f" : "2px solid #e0e0e0",
                    backgroundColor: nextStage === "Deal Declined" ? "#d32f2f" : "#ffffff",
                    color: nextStage === "Deal Declined" ? "#ffffff" : "#3e2723",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow:
                      nextStage === "Deal Declined"
                        ? "0 8px 24px rgba(211, 47, 47, 0.4)"
                        : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  Deal Declined
                </button>
              </div>
              {formErrors.nextStage && (
                <p className={styles.errorText}>
                  <AlertTriangle size={14} /> {formErrors.nextStage}
                </p>
              )}
            </div>

            <div className={styles.messageBox}>
              <label>Message to SME:</label>
              <div style={{ position: "relative" }}>
                <textarea
                  style={{
                    width: "100%",
                    padding: "20px",
                    borderRadius: "12px",
                    border: formErrors.message ? "3px solid #d32f2f" : "2px solid #8d6e63",
                    fontSize: "16px",
                    fontFamily: "inherit",
                    resize: "vertical",
                    minHeight: "140px",
                    lineHeight: "1.6",
                  }}
                  rows="6"
                  value={message || defaultMessages[nextStage] || ""}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    if (e.target.value.trim()) {
                      setFormErrors({ ...formErrors, message: null })
                    }
                  }}
                  placeholder="Enter your professional message to the SME..."
                />
                {!message && nextStage && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "14px",
                      color: "#5d4037",
                      marginTop: "12px",
                      fontStyle: "italic",
                      padding: "12px",
                      backgroundColor: "#f3e5f5",
                      borderRadius: "8px",
                    }}
                  >
                    <Info size={16} /> Professional template message loaded. Edit to customize.
                  </div>
                )}
              </div>
              {formErrors.message && (
                <p className={styles.errorText}>
                  <AlertTriangle size={14} /> {formErrors.message}
                </p>
              )}
            </div>

            {nextStage === "Under Review" && (
              <div className={styles.meetingFields}>
                <div>
                  <label>Initial discovery meeting:</label>
                  <input
                    type="text"
                    className={`${styles.meetingInput} ${formErrors.meetingPurpose ? styles.inputError : ""}`}
                    value={meetingPurpose}
                    onChange={(e) => {
                      setMeetingPurpose(e.target.value)
                      if (e.target.value.trim()) {
                        setFormErrors({ ...formErrors, meetingPurpose: null })
                      }
                    }}
                    placeholder="e.g., Initial Discussion, Due Diligence, etc."
                  />
                  {formErrors.meetingPurpose && (
                    <p className={styles.errorText}>
                      <AlertTriangle size={14} /> {formErrors.meetingPurpose}
                    </p>
                  )}
                </div>

                <div>
                  <label>Meeting Location:</label>
                  <input
                    type="text"
                    className={`${styles.meetingInput} ${formErrors.meetingLocation ? styles.inputError : ""}`}
                    value={meetingLocation}
                    onChange={(e) => {
                      setMeetingLocation(e.target.value)
                      if (e.target.value.trim()) {
                        setFormErrors({ ...formErrors, meetingLocation: null })
                      }
                    }}
                    placeholder="e.g., Office, Virtual Meeting, etc."
                  />
                  {formErrors.meetingLocation && (
                    <p className={styles.errorText}>
                      <AlertTriangle size={14} /> {formErrors.meetingLocation}
                    </p>
                  )}

                  {showCalendarModal && (
                    <div style={modalOverlayStyle} onClick={() => setShowCalendarModal(false)}>
                      <div style={calendarModalStyle} onClick={(e) => e.stopPropagation()}>
                        <h3
                          style={{
                            fontSize: "24px",
                            fontWeight: "700",
                            color: "#3e2723",
                            marginBottom: "24px",
                            textAlign: "center",
                          }}
                        >
                          Select Available Meeting Dates
                        </h3>

                        <div
                          style={{
                            backgroundColor: "#f8f5f3",
                            padding: "20px",
                            borderRadius: "12px",
                            marginBottom: "24px",
                            border: "1px solid #8d6e63",
                          }}
                        >
                          <label
                            style={{
                              display: "block",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#3e2723",
                              marginBottom: "12px",
                            }}
                          >
                            Available Time:
                          </label>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              flexWrap: "wrap",
                            }}
                          >
                            <input
                              type="time"
                              value={timeSlot.start}
                              onChange={(e) => handleTimeChange("start", e.target.value)}
                              style={{
                                padding: "12px",
                                borderRadius: "8px",
                                border: "2px solid #8d6e63",
                                fontSize: "16px",
                                fontWeight: "500",
                              }}
                            />
                            <span
                              style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#5d4037",
                              }}
                            >
                              to
                            </span>
                            <input
                              type="time"
                              value={timeSlot.end}
                              onChange={(e) => handleTimeChange("end", e.target.value)}
                              style={{
                                padding: "12px",
                                borderRadius: "8px",
                                border: "2px solid #8d6e63",
                                fontSize: "16px",
                                fontWeight: "500",
                              }}
                            />
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "24px",
                          }}
                        >
                          <DayPicker
                            mode="multiple"
                            selected={tempDates}
                            onSelect={handleDateSelect}
                            style={{
                              backgroundColor: "#ffffff",
                              borderRadius: "12px",
                              padding: "20px",
                              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                              border: "1px solid #e0e0e0",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "16px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setShowCalendarModal(false)}
                            style={{
                              backgroundColor: "transparent",
                              color: "#5d4037",
                              border: "2px solid #5d4037",
                              borderRadius: "12px",
                              padding: "14px 28px",
                              fontSize: "16px",
                              fontWeight: "600",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={saveSelectedDates}
                            disabled={!tempDates.length}
                            style={{
                              background: tempDates.length
                                ? "linear-gradient(135deg, #5d4037 0%, #4e342e 100%)"
                                : "#ccc",
                              color: "white",
                              border: "none",
                              borderRadius: "12px",
                              padding: "14px 28px",
                              fontSize: "16px",
                              fontWeight: "600",
                              cursor: tempDates.length ? "pointer" : "not-allowed",
                              transition: "all 0.3s ease",
                              boxShadow: tempDates.length ? "0 4px 16px rgba(93, 64, 55, 0.3)" : "none",
                            }}
                          >
                            Save Dates ({tempDates.length})
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.availabilitySection}>
                  <label>Available Meeting Dates:</label>
                  <button
                    type="button"
                    className={styles.selectDatesBtn}
                    onClick={() => {
                      setTempDates([])
                      setShowCalendarModal(true)
                    }}
                  >
                    + Select Available Dates
                  </button>

                  {availabilities.length > 0 && (
                    <div className={styles.availabilityList}>
                      {availabilities
                        .sort((a, b) => a.date - b.date)
                        .map((availability, index) => (
                          <div key={index} className={styles.availabilityItem}>
                            <span className={styles.availabilityDate}>
                              {availability.date.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className={styles.availabilityTime}>
                              {availability.timeSlots[0].start} - {availability.timeSlots[0].end}
                            </span>
                            <button
                              type="button"
                              className={styles.removeBtn}
                              onClick={() => removeAvailability(availability.date)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                  {formErrors.availabilities && (
                    <p className={styles.errorText}>
                      <AlertTriangle size={14} /> {formErrors.availabilities}
                    </p>
                  )}
                </div>
              </div>
            )}

            {nextStage === "Funding Approved" && (
              <div
                style={{
                  background: "linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)",
                  padding: "32px",
                  borderRadius: "16px",
                  marginTop: "24px",
                  border: "2px solid #388e3c",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                }}
              >
                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "24px",
                      marginBottom: "24px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "12px",
                          fontWeight: "700",
                          color: "#3e2723",
                          fontSize: "16px",
                        }}
                      >
                        Amount Asked:
                      </label>
                      <input
                        type="text"
                        placeholder="Enter amount (e.g., R500,000)"
                        value={amountAsked}
                        onChange={(e) => {
                          setAmountAsked(e.target.value)
                          if (e.target.value.trim()) {
                            setFormErrors({ ...formErrors, amountAsked: null })
                          }
                        }}
                        style={{
                          padding: "16px",
                          borderRadius: "12px",
                          border: formErrors.amountAsked ? "3px solid #d32f2f" : "2px solid #388e3c",
                          width: "100%",
                          fontSize: "16px",
                          fontWeight: "500",
                          backgroundColor: "#ffffff",
                        }}
                      />
                      {formErrors.amountAsked && (
                        <p
                          style={{
                            color: "#d32f2f",
                            fontSize: "14px",
                            marginTop: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <AlertTriangle size={14} /> {formErrors.amountAsked}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "12px",
                          fontWeight: "700",
                          color: "#3e2723",
                          fontSize: "16px",
                        }}
                      >
                        Amount Approved:
                      </label>
                      <input
                        type="text"
                        placeholder="Enter amount (e.g., R450,000)"
                        value={amountApproved}
                        onChange={(e) => {
                          setAmountApproved(e.target.value)
                          if (e.target.value.trim()) {
                            setFormErrors({ ...formErrors, amountApproved: null })
                          }
                        }}
                        style={{
                          padding: "16px",
                          borderRadius: "12px",
                          border: formErrors.amountApproved ? "3px solid #d32f2f" : "2px solid #388e3c",
                          width: "100%",
                          fontSize: "16px",
                          fontWeight: "500",
                          backgroundColor: "#ffffff",
                        }}
                      />
                      {formErrors.amountApproved && (
                        <p
                          style={{
                            color: "#d32f2f",
                            fontSize: "14px",
                            marginTop: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <AlertTriangle size={14} /> {formErrors.amountApproved}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "12px",
                        fontWeight: "700",
                        color: "#3e2723",
                        fontSize: "16px",
                      }}
                    >
                      Investment Type:
                    </label>
                    <div style={{ position: "relative" }}>
                      <select
                        value={investmentType}
                        onChange={(e) => {
                          setInvestmentType(e.target.value)
                          if (e.target.value) {
                            setFormErrors({ ...formErrors, investmentType: null })
                          }
                        }}
                        style={{
                          padding: "16px",
                          borderRadius: "12px",
                          border: formErrors.investmentType ? "3px solid #d32f2f" : "2px solid #388e3c",
                          width: "100%",
                          fontSize: "16px",
                          fontWeight: "500",
                          appearance: "none",
                          backgroundColor: "#ffffff",
                          cursor: "pointer",
                        }}
                      >
                        <option value="">Select investment type</option>
                        <option value="equity">Equity (shareholding)</option>
                        <option value="debt">Debt (loan)</option>
                        <option value="grant">Grant / Donation</option>
                        <option value="convertible">Convertible Note</option>
                        <option value="blended">Strategic Partnership</option>
                        <option value="other">Other (please specify)</option>
                      </select>
                      <ChevronDown
                        size={20}
                        style={{
                          position: "absolute",
                          right: "16px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                          color: "#388e3c",
                        }}
                      />
                      {formErrors.investmentType && (
                        <p
                          style={{
                            color: "#d32f2f",
                            fontSize: "14px",
                            marginTop: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <AlertTriangle size={14} /> {formErrors.investmentType}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "12px",
                        fontWeight: "700",
                        color: "#3e2723",
                        fontSize: "16px",
                      }}
                    >
                      Payment Deployment:
                    </label>
                    <textarea
                      placeholder="Describe how the payment will be deployed (e.g., 50% upfront, 50% upon milestone completion)"
                      value={paymentDeployment}
                      onChange={(e) => {
                        setPaymentDeployment(e.target.value)
                        if (e.target.value.trim()) {
                          setFormErrors({ ...formErrors, paymentDeployment: null })
                        }
                      }}
                      style={{
                        padding: "16px",
                        borderRadius: "12px",
                        border: formErrors.paymentDeployment ? "3px solid #d32f2f" : "2px solid #388e3c",
                        width: "100%",
                        fontSize: "16px",
                        fontWeight: "500",
                        backgroundColor: "#ffffff",
                        minHeight: "120px",
                        resize: "vertical",
                        fontFamily: "inherit",
                      }}
                    />
                    {formErrors.paymentDeployment && (
                      <p
                        style={{
                          color: "#d32f2f",
                          fontSize: "14px",
                          marginTop: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <AlertTriangle size={14} /> {formErrors.paymentDeployment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {nextStage === "Termsheet" && (
              <div
                style={{
                  background: "linear-gradient(135deg, #efebe9 0%, #f3e5f5 100%)",
                  padding: "32px",
                  borderRadius: "16px",
                  marginTop: "24px",
                  border: "2px solid #8d6e63",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                }}
              >
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "12px",
                      fontWeight: "700",
                      color: "#3e2723",
                      fontSize: "18px",
                    }}
                  >
                    Attach Termsheet Document:
                  </label>
                  <input
                    type="file"
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      border: formErrors.documentFile ? "3px solid #d32f2f" : "2px solid #8d6e63",
                      width: "100%",
                      backgroundColor: "#ffffff",
                      fontSize: "16px",
                      fontWeight: "500",
                    }}
                    onChange={(e) => {
                      setDocumentFile(e.target.files[0])
                      if (e.target.files[0]) {
                        setFormErrors({ ...formErrors, documentFile: null })
                      }
                    }}
                    accept=".pdf,.doc,.docx"
                  />
                  {formErrors.documentFile && (
                    <p
                      style={{
                        color: "#d32f2f",
                        fontSize: "16px",
                        marginTop: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontWeight: "500",
                      }}
                    >
                      <AlertTriangle size={16} /> {formErrors.documentFile}
                    </p>
                  )}
                  {documentFile && (
                    <p
                      style={{
                        color: "#2e7d32",
                        fontSize: "16px",
                        marginTop: "12px",
                        fontWeight: "600",
                      }}
                    >
                      Selected file: {documentFile.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                style={{
                  background: "linear-gradient(135deg, #5d4037 0%, #4e342e 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "16px 32px",
                  fontSize: "18px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 16px rgba(93, 64, 55, 0.3)",
                }}
                onClick={handleUpdateNextStage}
                disabled={isSubmitting}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)"
                  e.target.style.boxShadow = "0 8px 24px rgba(93, 64, 55, 0.4)"
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)"
                  e.target.style.boxShadow = "0 4px 16px rgba(93, 64, 55, 0.3)"
                }}
              >
                {isSubmitting ? (
                  <span className={styles.loadingSpinner}></span>
                ) : (
                  <>
                    <Check size={18} /> Update Stage
                  </>
                )}
              </button>
              <button
                style={{
                  backgroundColor: "transparent",
                  color: "#5d4037",
                  border: "2px solid #5d4037",
                  borderRadius: "12px",
                  padding: "16px 32px",
                  fontSize: "18px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onClick={() => setShowNextStageModal(false)}
                disabled={isSubmitting}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#5d4037"
                  e.target.style.color = "white"
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "transparent"
                  e.target.style.color = "#5d4037"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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

        /* Enhanced Calendar Styling */
        .rdp {
          --rdp-cell-size: 48px;
          --rdp-accent-color: #5d4037;
          --rdp-background-color: #5d4037;
          --rdp-accent-color-dark: #4e342e;
          --rdp-background-color-dark: #4e342e;
          --rdp-outline: 2px solid var(--rdp-accent-color);
          --rdp-outline-selected: 3px solid var(--rdp-accent-color);
          margin: 0;
        }

        .rdp-months {
          display: flex;
          justify-content: center;
        }

        .rdp-month {
          margin: 0;
        }

        .rdp-table {
          margin: 0;
          max-width: none;
        }

        .rdp-head_cell {
          font-weight: 700;
          color: #5d4037;
          font-size: 16px;
          padding: 12px;
        }

        .rdp-cell {
          padding: 4px;
        }

        .rdp-button {
          border: 2px solid transparent;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.2s ease;
          width: 44px;
          height: 44px;
        }

        .rdp-button:hover {
          background-color: #efebe9;
          border-color: #8d6e63;
          transform: scale(1.05);
        }

        .rdp-button_selected {
          background-color: var(--rdp-accent-color);
          color: white;
          border-color: var(--rdp-accent-color);
          boxShadow: 0 4px 12px rgba(93, 64, 55, 0.3);
        }

        .rdp-button_selected:hover {
          background-color: var(--rdp-accent-color-dark);
          transform: scale(1.05);
        }

        .rdp-day_today {
          font-weight: 800;
          color: #5d4037;
        }

        .rdp-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .rdp-nav_button {
          border: 2px solid #8d6e63;
          border-radius: 8px;
          padding: 8px;
          background-color: white;
          color: #5d4037;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .rdp-nav_button:hover {
          background-color: #5d4037;
          color: white;
          transform: scale(1.1);
        }

        .rdp-caption_label {
          font-size: 20px;
          font-weight: 700;
          color: #3e2723;
        }
      `}</style>
    </div>
  )
}