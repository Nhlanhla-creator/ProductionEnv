"use client"

import { useState, useEffect } from "react"
import { BarChart3, MapPin, Calendar, Filter, X, Info, Eye } from "lucide-react"
import { collection, getDocs, query, where, serverTimestamp, doc, writeBatch, updateDoc, getDoc, addDoc } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "../../firebaseConfig"
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { API_KEYS } from "../../API";
import emailjs from '@emailjs/browser';

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
  "New Match": {
    color: "#E3F2FD",
    textColor: "#1976D2",
  },
  Shortlisted: {
    color: "#FFF3E0",
    textColor: "#F57C00",
  },
  Contacted: {
    color: "#F3E5F5",
    textColor: "#7B1FA2",
  },
  Confirmed: {
    color: "#E8F5E8",
    textColor: "#388E3C",
  },
  Declined: {
    color: "#FFEBEE",
    textColor: "#D32F2F",
  },
}

const getStatusStyle = (status) => {
  return STATUS_TYPES[status] || { color: "#F5F5F5", textColor: "#666666" }
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
  const [updatedStages, setUpdatedStages] = useState({})
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

        const docId = `${auth.currentUser.uid}_${selectedAdvisor.id}`
        await updateDoc(doc(db, "AdvisorApplications", docId), {
          availableDates: availabilityData,
          updatedAt: new Date().toISOString(),
        })

        const smeDocRef = doc(db, "SmeAdvisorApplications", docId)
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

    if (selectedAdvisor) {
      try {
        const availabilityData = updatedAvailabilities.map((avail) => ({
          date: avail.date.toISOString(),
          timeSlots: avail.timeSlots,
          timeZone: avail.timeZone,
        }))

        const docId = `${auth.currentUser.uid}_${selectedAdvisor.id}`
        await updateDoc(doc(db, "AdvisorApplications", docId), {
          availableDates: availabilityData,
          updatedAt: new Date().toISOString(),
        })

        const smeDocRef = doc(db, "SmeAdvisorApplications", docId)
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

  const hasAvailability = (advisor) => {
    return advisor.availableDates && advisor.availableDates.length > 0
  }

  const applicationStages = [
    { id: "evaluation", name: "Evaluation", color: "#3b82f6" },
    { id: "due_diligence", name: "Due Diligence", color: "#8b5cf6" },
    { id: "decision", name: "Decision", color: "#f59e0b" },
    { id: "term_issue", name: "Term Issue", color: "#06b6d4" },
    { id: "deal_successful", name: "Deal Successful", color: "#10b981" },
    { id: "deal_declined", name: "Deal Declined", color: "#ef4444" },
  ]

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
      case "Term Issue":
        return { ...baseFields, showTermSheet: true, showAvailability: true }
      case "Deal Successful":
        return { 
          ...baseFields, 
          showTermSheet: true, 
          showAvailability: false,
          showMeeting: false // ✅ Hide meeting for successful deal
        }
      case "Deal Declined":
        return { 
          ...baseFields, 
          showTermSheet: false, 
          showAvailability: false,
          showMeeting: false // ✅ Hide meeting for declined deal
        }
      default:
        return baseFields
    }
  }

  useEffect(() => {
    const fetchAdvisorApplications = async () => {
      const user = auth.currentUser
      if (!user) return

      try {
        const advisorId = user.uid
        const q = query(collection(db, "AdvisorApplications"), where("advisorId", "==", advisorId))
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

          return {
            id: data.smeId,
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
            status: data.status || "New Match",
            pipelineStage: data.status || "New Match",
            action: "Application Received",
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
    console.log("Applying filters:", localFilters)
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

  const findDocumentIds = async (advisorId, smeId) => {
    const collections = ["AdvisorApplications", "AdvisoryMatches", "SmeAdvisorApplications"];
    const results = {};
    
    for (const collectionName of collections) {
      try {
        console.log(`\n=== Checking ${collectionName} ===`);
        
        const allDocs = await getDocs(collection(db, collectionName));
        console.log(`Total documents in ${collectionName}: ${allDocs.size}`);
        
        const matchingDocs = [];
        allDocs.forEach(doc => {
          const data = doc.data();
          console.log(`Document ID: ${doc.id}`, {
            advisorId: data.advisorId,
            smeId: data.smeId,
            status: data.status
          });
          
          if (data.advisorId === advisorId && data.smeId === smeId) {
            matchingDocs.push({
              id: doc.id,
              data: data
            });
          }
        });
        
        results[collectionName] = matchingDocs;
        console.log(`Found ${matchingDocs.length} matching documents in ${collectionName}`);
        
      } catch (error) {
        console.error(`Error checking ${collectionName}:`, error);
        results[collectionName] = [];
      }
    }
    
    return results;
  };

  const handleStageUpdate = async () => {
    const stageFields = getStageFields(nextStage);
    const errors = {};

    if (!nextStage) {
      errors.nextStage = "Please select a stage";
    }
    if (stageFields.showMessage && !message.trim()) {
      errors.message = "Please provide a message";
    }

    // ✅ ONLY validate meeting fields if stage is NOT successful or declined
    if (stageFields.showMeeting) {
      if (!meetingLocation.trim()) {
        errors.meetingLocation = "Please provide a meeting location";
      }
      if (!meetingPurpose.trim()) {
        errors.meetingPurpose = "Please provide a meeting purpose";
      }
    }

    if (stageFields.showAvailability && !availabilities.length) {
      errors.availabilities = "Please select at least one available date";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      const advisorId = user.uid;
      const smeId = selectedAdvisorForStage.id;

      console.log("Updating status for application:", {
        advisorId,
        smeId,
        nextStage
      });

      let attachmentUrl = null;

      if (termSheetFile) {
        const storageRef = ref(storage, `advisor_termsheets/${selectedAdvisorForStage.id}/${termSheetFile.name}`);
        const snapshot = await uploadBytes(storageRef, termSheetFile);
        attachmentUrl = await getDownloadURL(snapshot.ref);
      }

      const updateData = {
        status: nextStage,
        pipelineStage: nextStage,
        updatedAt: serverTimestamp(),
        ...(message && { lastMessage: message }),
      };

      // ✅ ONLY add meeting details if stage allows meetings
      if (stageFields.showMeeting && meetingLocation && meetingPurpose) {
        updateData.meetingDetails = {
          time: meetingTime,
          location: meetingLocation,
          purpose: meetingPurpose
        }
      }

      if (stageFields.showAvailability && availabilities.length > 0) {
        const availabilityData = availabilities.map((avail) => ({
          date: avail.date.toISOString(),
          timeSlots: avail.timeSlots,
          timeZone: avail.timeZone,
          status: avail.status,
        }));
        updateData.availableDates = availabilityData;
      }

      console.log("Update data:", updateData);

      const documentId = `${advisorId}_${smeId}`;
      const documentsmeId = `${smeId}_${advisorId}`;

      const docRef = doc(db, "AdvisorApplications", documentId);
      
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        throw new Error(`Document with ID ${documentId} does not exist in AdvisorApplications`);
      }

      await updateDoc(docRef, updateData);

      try {
        const matchesDocRef = doc(db, "AdvisoryMatches", documentsmeId);
        await updateDoc(matchesDocRef, { 
          status: nextStage,
          ...(updateData.availableDates && { availableDates: updateData.availableDates })
        });
        
        const smeDocRef = doc(db, "SmeAdvisorApplications", documentsmeId);
        await updateDoc(smeDocRef, { 
          status: nextStage,
          ...(updateData.availableDates && { availableDates: updateData.availableDates })
        });
      } catch (matchError) {
        console.warn("Could not update related collections:", matchError.message);
      }

      // ✅ ONLY create calendar event if stage allows meetings
      if (stageFields.showMeeting && meetingTime && meetingLocation && meetingPurpose) {
        try {
          await addDoc(collection(db, "smeCalendarEvents"), {
            smeId: smeId,
            advisorId: advisorId,
            title: meetingPurpose,
            date: meetingTime,
            location: meetingLocation,
            type: "advisory_meeting",
            createdAt: new Date().toISOString(),
            ...(updateData.availableDates && { availableDates: updateData.availableDates })
          });
        } catch (calendarError) {
          console.error("Error creating calendar event:", calendarError);
        }
      }

      setAdvisors(prevAdvisors => 
        prevAdvisors.map(advisor => 
          advisor.id === smeId 
            ? { 
                ...advisor, 
                status: nextStage,
                pipelineStage: nextStage,
                ...(message && { lastMessage: message }),
                ...(stageFields.showMeeting && {
                  meetingDetails: {
                    time: meetingTime,
                    location: meetingLocation,
                    purpose: meetingPurpose
                  }
                }),
                ...(updateData.availableDates && { availableDates: updateData.availableDates })
              }
            : advisor
        )
      );

      setUpdatedStages((prev) => ({ ...prev, [smeId]: nextStage }));
      setNotification({
        type: "success",
        message: `Application status updated to ${nextStage} successfully`
      });
      
      setShowStageModal(false);
      resetStageModal();
      
      let subject = `Update: ${nextStage} Stage for Your Application`;
      let content = "";

      if (nextStage === "Deal Declined") {
        content = `Dear ${selectedAdvisorForStage.name},\n\nWe regret to inform you that your application has been moved to the "${nextStage}" stage.\n\n${message}`;
      } else {
        content = `Dear ${selectedAdvisorForStage.name},\n\nWe are pleased to inform you that your application has progressed to the "${nextStage}" stage.\n\n${message}`;
      }

      // ✅ ONLY add meeting details to email if stage allows meetings
      if (stageFields.showMeeting) {
        content += `\n\nMeeting Details:\n- Date: ${new Date(meetingTime).toLocaleString()}\n- Location: ${meetingLocation}\n- Purpose: ${meetingPurpose}`;
      }

      if (stageFields.showAvailability && availabilities.length > 0) {
        content += `\n\nAvailable Meeting Times:\n`;
        content += availabilities
          .map((avail, idx) => {
            const dateStr = avail.date.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            const timeStr = avail.timeSlots?.[0]
              ? `${avail.timeSlots[0].start} - ${avail.timeSlots[0].end} ${avail.timeZone}`
              : "Time not specified";
            return `${idx + 1}. ${dateStr} (${timeStr})`;
          })
          .join("\n");
        
        content += `\n\nPlease reply with your preferred meeting time from the above options.`;
      }

      content += `\n\nBest regards,\nAdvisory Support Team`;

      const messagePayload = {
        to: smeId,
        from: advisorId,
        subject,
        content,
        date: new Date().toISOString(),
        read: false,
        type: "inbox",
        applicationId: `${advisorId}_${smeId}`,
        attachments: attachmentUrl ? [attachmentUrl] : [],
        ...(updateData.availableDates && { availableDates: updateData.availableDates })
      };

      const sentMessagePayload = {
        ...messagePayload,
        read: true,
        type: "sent",
      };

      await Promise.all([
        addDoc(collection(db, "messages"), messagePayload),
        addDoc(collection(db, "messages"), sentMessagePayload),
      ]);

      try {
        console.log("🔄 Using Feedback service configuration...");

        const emailjsConfig = {
          serviceId: API_KEYS.SERVICE_ID_MESSAGES,
          templateId: API_KEYS.TEMPLATE_ID_MESSAGES,
          publicKey: API_KEYS.PUBLIC_KEY_ID_MESSAGES
        };

        console.log("📧 Using Feedback config:", emailjsConfig);

        if (!window.emailjs) {
          emailjs.init(emailjsConfig.publicKey);
          window.emailjs = emailjs;
        }

        const user = auth.currentUser;
        const advisorName = user?.displayName || "Advisory Team";
        const smeName = selectedAdvisorForStage.name;

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

        let emailMessage = "";

        if (nextStage === "Deal Declined") {
          emailMessage = `Dear ${smeName},\n\n`;
          emailMessage += `We regret to inform you that your application has been moved to the "${nextStage}" stage.\n\n`;
        } else {
          emailMessage = `Dear ${smeName},\n\n`;
          emailMessage += `We are pleased to inform you that your application has progressed to the "${nextStage}" stage.\n\n`;
        }
        
        if (message) {
          emailMessage += `Message from ${advisorName}:\n${message}\n\n`;
        }

        // ✅ ONLY add meeting details to email if stage allows meetings
        if (stageFields.showMeeting && meetingLocation && meetingPurpose) {
          emailMessage += `Meeting Details:\n`;
          if (meetingTime) {
            emailMessage += `- Date: ${new Date(meetingTime).toLocaleString()}\n`;
          }
          emailMessage += `- Location: ${meetingLocation}\n`;
          emailMessage += `- Purpose: ${meetingPurpose}\n\n`;
        }

        if (stageFields.showAvailability && availabilities.length > 0) {
          emailMessage += `Available Meeting Times:\n`;
          availabilities.forEach((avail, idx) => {
            const dateStr = avail.date.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            const timeStr = avail.timeSlots?.[0]
              ? `${avail.timeSlots[0].start} - ${avail.timeSlots[0].end} ${avail.timeZone}`
              : "Time not specified";
            emailMessage += `${idx + 1}. ${dateStr} (${timeStr})\n`;
          });
          emailMessage += `\nPlease reply with your preferred meeting time from the above options.\n\n`;
        }

        emailMessage += `Best regards,\n${advisorName}\nAdvisory Support Team\nBIG Marketplace Africa`;

        const templateParams = {
          to_email: smeEmail,
          subject: `Application Stage Update: ${nextStage}`,
          from_name: advisorName,
          date: new Date().toLocaleDateString(),
          message: emailMessage,
          portal_url: `https://www.bigmarketplace.africa/applications/${advisorId}_${smeId}`,
          has_attachments: termSheetFile ? "true" : "false",
          attachments_count: termSheetFile ? "1" : "0"
        };

        console.log("📨 Sending with Feedback service...", templateParams);

        const response = await window.emailjs.send(
          emailjsConfig.serviceId,
          emailjsConfig.templateId,
          templateParams,
          emailjsConfig.publicKey
        );
        
        console.log("✅ Email sent successfully with Feedback service!", response);
        
        setNotification({
          type: "success",
          message: `Stage updated to ${nextStage} and notification sent successfully`
        });

      } catch (emailError) {
        console.error("❌ Email failed:", emailError);
        
        setNotification({
          type: "success", 
          message: `Stage updated to ${nextStage} successfully`
        });
      }
    } catch (error) {
      console.error("Detailed error:", error);
      
      setNotification({
        type: "error",
        message: `Failed to update status: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
    background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
    color: "#FEFCFA",
    padding: "0.4rem 0.2rem",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "0.7rem",
    letterSpacing: "0.3px",
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
    padding: "0.5rem 0.2rem",
    borderBottom: "1px solid #E8D5C4",
    borderRight: "1px solid #E8D5C4",
    fontSize: "0.8rem",
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
    width: "35px",
    height: "4px",
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
    fontSize: "0.7rem",
  }

  const statusBadgeStyle = {
    padding: "0.1rem 0.25rem",
    borderRadius: "3px",
    fontSize: "0.59rem",
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
            fontSize: "0.8rem",
            backgroundColor: "#FEFCFA",
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
              <tr style={{ borderBottom: "1px solid #E8D5C4" }}>
                <td style={{ ...tableCellStyle, color: "#ccc", textAlign: "center", padding: "2rem 0.2rem" }}>-</td>
                <td style={{ ...tableCellStyle, color: "#ccc", textAlign: "center", padding: "2rem 0.2rem" }}>-</td>
                <td style={{ ...tableCellStyle, color: "#ccc", textAlign: "center", padding: "2rem 0.2rem" }}>-</td>
                <td style={{ ...tableCellStyle, color: "#ccc", textAlign: "center", padding: "2rem 0.2rem" }}>-</td>
                <td style={{ ...tableCellStyle, color: "#ccc", textAlign: "center", padding: "2rem 0.2rem" }}>-</td>
                <td style={{ ...tableCellStyle, color: "#ccc", textAlign: "center", padding: "2rem 0.2rem" }}>-</td>
                <td style={{ ...tableCellStyle, color: "#ccc", textAlign: "center", padding: "2rem 0.2rem" }}>-</td>
                <td style={{ ...tableCellStyle, color: "#ccc", textAlign: "center", padding: "2rem 0.2rem" }}>-</td>
                <td style={{ ...tableCellStyle, color: "#ccc", textAlign: "center", padding: "2rem 0.2rem" }}>-</td>
                <td style={{ ...tableCellStyle, color: "#ccc", textAlign: "center", padding: "2rem 0.2rem" }}>-</td>
                <td style={{ ...tableCellStyle, color: "#ccc", textAlign: "center", padding: "2rem 0.2rem" }}>-</td>
                <td style={{ ...tableCellStyle, color: "#ccc", textAlign: "center", padding: "2rem 0.2rem", borderRight: "none" }}>-</td>
              </tr>
            ) : (
              advisors.map((advisor) => {
                const currentStatus = updatedStages[advisor.id] || advisor.pipelineStage || advisor.status
                const statusStyle = getStatusStyle(currentStatus)
                return (
                  <tr key={advisor.id} style={{ borderBottom: "1px solid #E8D5C4" }}>
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
                        <button
                          onClick={() => handleBigScoreClick(advisor)}
                          style={{
                            background: "none",
                            border: "none",
                            color: getScoreColor(advisor.bigScore),
                            textDecoration: "underline",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "1px",
                            fontWeight: "600",
                            fontSize: "0.8rem",
                          }}
                        >
                          {advisor.bigScore}%
                          <BarChart3 size={8} />
                        </button>
                        <button
                          onClick={() => handleScoreBreakdown(advisor)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#666",
                            textDecoration: "underline",
                            cursor: "pointer",
                            fontSize: "0.59rem",
                            marginTop: "1px",
                          }}
                        >
                          View breakdown
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
                        onClick={() => handleStageAction(advisor)}
                        style={{
                          padding: "6px 8px",
                          backgroundColor: "#5d4037",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          fontWeight: "500",
                          width: "100%",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Application Received
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {advisors.length === 0 && (
        <div
          style={{
            backgroundColor: "#f8f5f3",
            padding: "24px",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #e8d5c4",
            marginTop: "24px",
          }}
        >
          <Info size={48} style={{ color: "#a67c52", marginBottom: "16px" }} />
          <h3 style={{ color: "#5d4037", marginBottom: "8px" }}>You have not applied for any SMSEs, so there are no matches available.</h3>
          <p style={{ color: "#7d5a50" }}>
            You need to apply first. Your applications will appear here once you apply to SMSEs.
          </p>
        </div>
      )}

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
                    <strong>Status:</strong> {selectedAdvisor.status}
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