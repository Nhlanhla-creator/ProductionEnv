"use client";

import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useLocation } from "react-router-dom";

const functions = getFunctions();


const GovernanceCalendar = (activeSection, isInvestorView ) => {
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showDoubleBookingWarning, setShowDoubleBookingWarning] = useState(false);
  const [pendingMeetingData, setPendingMeetingData] = useState(null);
  const [conflictingMeetingData, setConflictingMeetingData] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Processing..."); 
  const [showRecurringDeleteModal, setShowRecurringDeleteModal] = useState(false);
  const [recurringDeleteMeeting, setRecurringDeleteMeeting] = useState(null);
  const [rescheduleMeeting, setRescheduleMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [rescheduleData, setRescheduleData] = useState({
    newDate: "",
    newTime: "",
    reason: "",
  });

  // Department options with colors
  const departmentOptions = [
    { name: "Overall Company Health", color: "#4CAF50", bg: "#E8F5E9" },
    { name: "Strategy & Execution", color: "#2196F3", bg: "#E3F2FD" },
    { name: "Financial Performance", color: "#FF9800", bg: "#FFF3E0" },
    { name: "Operational Performance", color: "#9C27B0", bg: "#F3E5F5" },
    { name: "People", color: "#FF5722", bg: "#FBE9E7" },
    { name: "ESG Impact", color: "#8BC34A", bg: "#F1F8E9" },
    { name: "Marketing & Sales", color: "#E91E63", bg: "#FCE4EC" },
  ];
  
  const [customDepartments, setCustomDepartments] = useState([]);
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    department: departmentOptions[0].name,
    purpose: "",
    participants: [],
    repeatType: "none",
    startDate: "",
    endDate: "",
    time: "10:00",
  });
  
  const [errors, setErrors] = useState({});
  
  const allDepartments = [...departmentOptions, ...customDepartments];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [userProfile, setUserProfile] = useState(null);

useEffect(() => {
  const fetchUserProfile = async () => {
    if (!currentUser) return;
    try {
      const profileRef = doc(db, "universalProfiles", currentUser.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        const name = data.entityOverview?.registeredName || 
                     data.contactDetails?.contactName ||
                     currentUser.displayName ||
                     "User";
        setUserProfile(name);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };
  fetchUserProfile();
}, [currentUser]);

  // Get current user
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
  // Check if there's a meeting query param
  const params = new URLSearchParams(location.search);
  const meetingId = params.get("meeting");
  
  if (meetingId && meetings.length > 0) {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
      // Auto-select the meeting
      setShowDetailsModal(meeting);
      // Highlight the date on the calendar
      const instance = meeting.instances?.[0];
      if (instance) {
        const date = new Date(instance.date);
        setSelectedDate(date);
        setCurrentDate(date);
      }
    }
  }
}, [location.search, meetings]);

  const getRandomColor = () => {
    const colors = ["#607D8B", "#795548", "#009688", "#673AB7", "#3F51B5", "#CDDC39", "#FFC107"];
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  };
  
  const getRandomBgColor = (color) => color + "20";
  
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };
  
  const handleAddCustomDepartment = () => {
    if (!newDepartmentName.trim()) return;
    const newColor = getRandomColor();
    setCustomDepartments([
      ...customDepartments,
      {
        name: newDepartmentName.trim(),
        color: newColor,
        bg: getRandomBgColor(newColor),
      },
    ]);
    setNewDepartmentName("");
    setShowAddDepartment(false);
  };
  
  // Load meetings from Firestore
  useEffect(() => {
    if (!currentUser) return;
    
    const loadMeetings = async () => {
      try {
        const calendarRef = doc(db, "governanceCalendar", currentUser.uid);
        const calendarSnap = await getDoc(calendarRef);
        
        if (calendarSnap.exists()) {
          setMeetings(calendarSnap.data().meetings || []);
        }
      } catch (error) {
        console.error("Error loading meetings:", error);
      }
    };
    
    loadMeetings();
  }, [currentUser]);
  
  const getMeetingsForDate = (date) => {
    const dateStr = date.toDateString();
    return meetings.filter(meeting => {
      return meeting.instances?.some(instance => {
        const instanceDate = new Date(instance.date);
        return instanceDate.toDateString() === dateStr;
      });
    });
  };
  
  const generateInstances = (startDate, endDate, repeatType) => {
    const instances = [];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    if (repeatType === "none") {
      if (start < today) {
        throw new Error("Cannot schedule meetings on past dates");
      }
      instances.push({
        instanceId: generateId(),
        date: start.toISOString(),
        time: formData.time,
        status: "scheduled",
      });
      return instances;
    }
    
    if (repeatType === "weekly") {
      let current = new Date(start);
      let maxIterations = 100;
      let iterations = 0;
      
      while ((!end || current <= end) && iterations < maxIterations) {
        if (current >= today) {
          instances.push({
            instanceId: generateId(),
            date: current.toISOString(),
            time: formData.time,
            status: "scheduled",
          });
        }
        current.setDate(current.getDate() + 7);
        iterations++;
      }
      return instances;
    }
    
    if (repeatType === "monthly") {
      let current = new Date(start);
      let maxIterations = 100;
      let iterations = 0;
      
      while ((!end || current <= end) && iterations < maxIterations) {
        if (current >= today) {
          instances.push({
            instanceId: generateId(),
            date: current.toISOString(),
            time: formData.time,
            status: "scheduled",
          });
        }
        current.setMonth(current.getMonth() + 1);
        iterations++;
      }
      return instances;
    }
    
    return instances;
  };

 const addParticipant = () => {
  console.log("Add participant clicked!");
  setFormData((prev) => {
    console.log("Current participants:", prev.participants);
    return {
      ...prev,
      participants: [...prev.participants, { name: "", email: "" }]
    };
  });
};

  // Remove a participant
  const removeParticipant = (index) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  // Update participant field
  const updateParticipant = (index, field, value) => {
    setFormData((prev) => {
      const updatedParticipants = [...prev.participants];
      updatedParticipants[index] = { ...updatedParticipants[index], [field]: value };
      return { ...prev, participants: updatedParticipants };
    });
  };

const proceedWithBooking = async () => {
  setLoading(true);
    setLoadingMessage("Booking your meeting...");


  try {
    const selectedDepartment = allDepartments.find(d => d.name === formData.department);
    let instances;
    
    try {
      instances = generateInstances(formData.startDate, formData.endDate, formData.repeatType);
    } catch (error) {
      setErrors({ startDate: error.message });
      setLoading(false);
      return;
    }
    
    if (instances.length === 0) {
      setErrors({ startDate: "No valid dates found. Please check your date range." });
      setLoading(false);
      return;
    }
    
    const newMeeting = {
      id: generateId(),
      title: formData.title,
      department: formData.department,
      departmentColor: selectedDepartment?.color || "#757575",
      departmentBg: selectedDepartment?.bg || "#EEEEEE",
      purpose: formData.purpose,
    participants: formData.participants,
    isRecurring: formData.repeatType !== "none",
      recurrencePattern: formData.repeatType !== "none" ? formData.repeatType : null,
      recurrenceInterval: formData.repeatType !== "none" ? 1 : null,
      instances: instances,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedMeetings = [...meetings, newMeeting];
    setMeetings(updatedMeetings);
    
    const calendarRef = doc(db, "governanceCalendar", currentUser.uid);
    await setDoc(calendarRef, {
      meetings: updatedMeetings,
      updatedAt: new Date().toISOString(),
      userId: currentUser.uid,
    }, { merge: true });
    
    setFormData({
      title: "",
      department: departmentOptions[0].name,
      purpose: "",
      participants: "",
      repeatType: "none",
      startDate: "",
      endDate: "",
      time: "10:00",
    });
    setErrors({});
    setShowAddModal(false);
    
    // ==================== NOTIFICATIONS ====================
    
    const formattedDate = new Date(formData.startDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    
    const meetingTime = formData.time;
    const participantText = newMeeting.participants.length > 0 
      ? newMeeting.participants.join(", ")
      : 'No participants specified';
    const recurrenceText = newMeeting.isRecurring 
      ? `🔄 Repeats ${newMeeting.recurrencePattern === 'weekly' ? 'weekly' : 'monthly'}` 
      : '';
    
    // Get user name for notification
    let userName = "User";
    try {
      const profileRef = doc(db, "universalProfiles", currentUser.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        userName = data.entityOverview?.registeredName || 
                   data.contactDetails?.contactName ||
                   data.contactDetails?.primaryContactName ||
                   currentUser.displayName ||
                   "User";
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
    
    // Determine if this is a double-booking
    const isDoubleBooked = conflictingMeetingData !== null && conflictingMeetingData.length > 0;
    const notificationEmoji = isDoubleBooked ? "⚠️" : "✅";
    const notificationType = isDoubleBooked ? "warning" : "success";
    const notificationSubject = isDoubleBooked ? "Double-Booked" : "Confirmed";
    
    // In-app banner notification
    setNotification({ 
      type: notificationType, 
      message: `${notificationEmoji} "${formData.title}" ${isDoubleBooked ? 'double-booked' : 'confirmed'} for ${formattedDate} at ${meetingTime}` 
    });
    setTimeout(() => setNotification(null), 5000);
    
    // Build notification content
    let notificationContent = `Dear ${userName},

Your meeting "${formData.title}" has been successfully added to your calendar.`;

    if (isDoubleBooked && conflictingMeetingData?.length > 0) {
      notificationContent += `\n\n⚠️ Notice: You already have ${conflictingMeetingData.length} other meeting${conflictingMeetingData.length > 1 ? 's' : ''} scheduled at the same time:\n\n`;
      
      conflictingMeetingData.forEach((meeting, index) => {
        notificationContent += `${index + 1}. "${meeting.title}" (${meeting.department})\n`;
      });
      
      notificationContent += `\nPlease check your calendar and manage your schedule accordingly.`;
    }

    notificationContent += `\n\n📋 Meeting Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Date: ${formattedDate}
⏰ Time: ${meetingTime}
🏢 Department: ${formData.department}
👥 Attendees: ${participantText}

📌 Purpose:
${formData.purpose}

${recurrenceText ? `\n${recurrenceText}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔔 Next Steps:
• Review the meeting agenda and prepare any necessary materials
• Add this meeting to your personal calendar as a backup

📎 Resources:
• View all your meetings in the Governance Calendar
• For questions or rescheduling, please contact the department lead

This is an automated notification from the BIG Marketplace Governance System.

Best regards,
BIG Marketplace Team 🌍`;

// ==================== SEND EMAIL ====================

// Get user email
let userEmail = null;
try {
  const userDocRef = await getDoc(doc(db, "users", currentUser.uid));
  if (userDocRef.exists()) {
    const userData = userDocRef.data();
    userEmail = userData.email;
  }
} catch (error) {
  console.error("Error fetching user email:", error);
}

if (userEmail) {
  try {
    const sendGovernanceMeetingConfirmation = httpsCallable(
      functions, 
      'sendGovernanceMeetingConfirmation'
    );
    
    await sendGovernanceMeetingConfirmation({
      to: currentUser.uid,
      useTestMode: false, 
      meetingTitle: formData.title,
      meetingDate: formattedDate,
      meetingTime: meetingTime,
      department: formData.department,
      participants: formData.participants,
      purpose: formData.purpose,
      isRecurring: newMeeting.isRecurring,
      recurrencePattern: newMeeting.recurrencePattern,
      isDoubleBooked: isDoubleBooked,
      conflictingMeetings: conflictingMeetingData || []
    });
    
    console.log("✅ Meeting confirmation email sent to:", userEmail);
  } catch (emailError) {
    console.error("Failed to send meeting confirmation email:", emailError);
  }
}

    // Save to Firestore messages
    await addDoc(collection(db, "messages"), {
      to: currentUser.uid,
      from: "system",
      subject: `${notificationEmoji} Meeting ${notificationSubject}: ${formData.title}`,
      content: notificationContent,
      date: new Date().toISOString(),
      read: false,
      type: "inbox",
      meetingId: newMeeting.id,
      linkTo: "/governance-calendar",
    });
    
    // ==================== END NOTIFICATIONS ====================
     setNotification({ 
      type: "success", 
      message: `✅ "${formData.title}" confirmed for ${formattedDate} at ${meetingTime}` 
    });
    
  } catch (error) {
    setNotification({ 
      type: "error", 
      message: "Failed to schedule meeting. Please try again." 
    });
  } finally {
    setLoading(false);  // ✅ Hide loading overlay
  }
};

const handleSubmit = async () => {
  if (!currentUser) {
    setNotification({ 
      type: "error", 
      message: "Please log in to add meetings." 
    });
    return;
  }
  
  const newErrors = {};
  if (!formData.title.trim()) newErrors.title = "Meeting title is required";
  if (!formData.purpose.trim()) newErrors.purpose = "Purpose is required";
  if (!formData.startDate) newErrors.startDate = "Start date is required";
  if (!formData.time) newErrors.time = "Time is required";
  
  const startDateObj = new Date(formData.startDate);
  if (startDateObj < today) {
    newErrors.startDate = "Cannot schedule meetings on past dates";
  }
  
  if (formData.endDate) {
    const endDateObj = new Date(formData.endDate);
    if (endDateObj < startDateObj) {
      newErrors.endDate = "End date cannot be before start date";
    }
  }
  
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  } 
  
  
  // ==================== DOUBLE-BOOKING CHECK (ALL CONFLICTS) ====================
  
  const formattedDateForCheck = new Date(formData.startDate);
  const conflictingMeetings = meetings.filter(meeting => {
    return meeting.instances?.some(instance => {
      const instanceDate = new Date(instance.date);
      const sameDate = instanceDate.toDateString() === formattedDateForCheck.toDateString();
      const sameTime = instance.time === formData.time;
      return sameDate && sameTime;
    });
  });
  
  if (conflictingMeetings.length > 0) {
    // Get the selected department for the new meeting
    const selectedDepartment = allDepartments.find(d => d.name === formData.department);
    
    // Prepare the pending meeting data for the modal
    setPendingMeetingData({
      title: formData.title,
      department: formData.department,
      departmentColor: selectedDepartment?.color || "#757575",
      time: formData.time,
      date: formattedDateForCheck,
      purpose: formData.purpose,
    });
    
    setConflictingMeetingData(conflictingMeetings);
    setShowDoubleBookingWarning(true);
    return; // Stop submission, wait for user decision
  }
  
  // ==================== END DOUBLE-BOOKING CHECK ====================
  
  // No conflict, proceed with booking
  await proceedWithBooking();

  setLoading(true);
  
  
  try {
    const selectedDepartment = allDepartments.find(d => d.name === formData.department);
    let instances;
    
    try {
      instances = generateInstances(formData.startDate, formData.endDate, formData.repeatType);
    } catch (error) {
      setErrors({ startDate: error.message });
      setLoading(false);
      return;
    }
    
    if (instances.length === 0) {
      setErrors({ startDate: "No valid dates found. Please check your date range." });
      setLoading(false);
      return;
    }
    
    const newMeeting = {
      id: generateId(),
      title: formData.title,
      department: formData.department,
      departmentColor: selectedDepartment?.color || "#757575",
      departmentBg: selectedDepartment?.bg || "#EEEEEE",
      purpose: formData.purpose,
      participants: formData.participants,  // ← Already an array of { name, email }
      isRecurring: formData.repeatType !== "none",
      recurrencePattern: formData.repeatType !== "none" ? formData.repeatType : null,
      recurrenceInterval: formData.repeatType !== "none" ? 1 : null,
      instances: instances,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedMeetings = [...meetings, newMeeting];
    setMeetings(updatedMeetings);
    
    const calendarRef = doc(db, "governanceCalendar", currentUser.uid);
    await setDoc(calendarRef, {
      meetings: updatedMeetings,
      updatedAt: new Date().toISOString(),
      userId: currentUser.uid,
    }, { merge: true });
    
    setFormData({
      title: "",
      department: departmentOptions[0].name,
      purpose: "",
      participants: [],
      repeatType: "none",
      startDate: "",
      endDate: "",
      time: "10:00",
    });
    setErrors({});
    setShowAddModal(false);
    
    // ==================== NOTIFICATIONS ====================
    
    const formattedDate = new Date(formData.startDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    
    const meetingTime = formData.time;
  const participantText = newMeeting.participants.length > 0 
  ? newMeeting.participants.map(p => p.name || p.email || "Participant").join(", ")
  : 'No participants specified';
    const recurrenceText = newMeeting.isRecurring 
      ? `🔄 Repeats ${newMeeting.recurrencePattern === 'weekly' ? 'weekly' : 'monthly'}` 
      : '';
    const displayName = currentUser.displayName || "User";
    
    // 1. In-app banner notification
    setNotification({ 
      type: "success", 
      message: `✅ "${formData.title}" confirmed for ${formattedDate} at ${meetingTime}` 
    });
    setTimeout(() => setNotification(null), 5000);
    
    // 2. Save to Firestore messages collection (ONCE - only inbox, no duplicate sent)
    await addDoc(collection(db, "messages"), {
      to: currentUser.uid,
      from: "system",
      subject: `✅ Meeting Confirmed: ${formData.title}`,
      content: `Dear ${userProfile || "User"},

Your "${formData.title}" meeting has been successfully added to your calendar.

📋 Meeting Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Date: ${formattedDate}
⏰ Time: ${meetingTime}
🏢 Department: ${formData.department}
👥 Attendees: ${participantText}

📌 Purpose:
${formData.purpose}

${recurrenceText ? `\n${recurrenceText}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔔 Next Steps:
• Review the meeting agenda and prepare any necessary materials
• Add this meeting to your personal calendar as a backup

📎 Resources:
• View or reschedule all your meetings in the Governance Calendar

This is an automated notification from the BIG Marketplace Governance System.

Best regards,
BIG Marketplace Team 🌍`,
      date: new Date().toISOString(),
      read: false,
      type: "inbox",
      meetingId: newMeeting.id,
      linkTo: "/governance-calendar",
    });
    
    // ==================== END NOTIFICATIONS ====================
    
  } catch (error) {
    console.error("Error saving meeting:", error);
    setNotification({ 
      type: "error", 
      message: "Failed to schedule meeting. Please try again." 
    });
  } finally {
    setLoading(false);
  }
};
  
 const handleDeleteMeeting = async (meetingId) => {
   const meeting = meetings.find(m => m.id === meetingId);
  
  if (meeting?.isRecurring) {
    const confirmDelete = window.confirm(
      `⚠️ "${meeting.title}" is a recurring meeting.\n\n` +
      `This will delete ALL ${meeting.instances?.length || 0} instances.\n\n` +
      `Are you sure?`
    );
    
    if (!confirmDelete) {
      return; // Stop here, don't delete
    }
  }
  

  setLoading(true);
    setLoadingMessage("Deleting meeting...");
 
  try {
    // Find the meeting before deleting
    const deletedMeeting = meetings.find(m => m.id === meetingId);
    
    const updatedMeetings = meetings.filter(m => m.id !== meetingId);
    setMeetings(updatedMeetings);
    
    const calendarRef = doc(db, "governanceCalendar", currentUser.uid);
    await setDoc(calendarRef, {
      meetings: updatedMeetings,
      updatedAt: new Date().toISOString(),
      userId: currentUser.uid,
    }, { merge: true });
    
    setShowDeleteConfirm(null);
    setShowDetailsModal(null);
    
    // ==================== SEND CANCELLATION EMAIL ====================
    
    if (deletedMeeting) {
      const firstInstance = deletedMeeting.instances?.[0];
      const formattedDate = firstInstance 
        ? new Date(firstInstance.date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "TBD";
      const meetingTime = firstInstance?.time || "TBD";
      
      // ✅ Get user email for the cancellation function
      let userEmail = null;
      try {
        const userDocRef = await getDoc(doc(db, "users", currentUser.uid));
        if (userDocRef.exists()) {
          const userData = userDocRef.data();
          userEmail = userData.email;
        }
      } catch (error) {
        console.error("Error fetching user email:", error);
      }
      
      if (userEmail) {
        try {
          const functions = getFunctions();
          const sendGovernanceMeetingCancellation = httpsCallable(
            functions, 
            'sendGovernanceMeetingCancellation'
          );
          
          // ✅ PASS PARTICIPANTS TO THE CANCELLATION FUNCTION
          await sendGovernanceMeetingCancellation({
            to: currentUser.uid,
            meetingTitle: deletedMeeting.title,
            meetingDate: formattedDate,
            meetingTime: meetingTime,
            department: deletedMeeting.department,
            purpose: deletedMeeting.purpose,
            isRecurring: deletedMeeting.isRecurring || false,
            participants: deletedMeeting.participants || []  // ✅ ADD THIS
          });
          
          console.log("✅ Meeting cancellation email sent to organizer and participants");
        } catch (emailError) {
          console.error("Failed to send meeting cancellation email:", emailError);
        }
      }
      
      // ==================== IN-APP NOTIFICATION ====================
      
      // 1. In-app banner notification
      setNotification({ 
        type: "warning", 
        message: `❌ "${deletedMeeting.title}" has been cancelled` 
      });
      setTimeout(() => setNotification(null), 5000);
      
      // 2. Save to Firestore messages
      const displayName = currentUser.displayName || "User";
      await addDoc(collection(db, "messages"), {
        to: currentUser.uid,
        from: "system",
        subject: `❌ Meeting Cancelled: ${deletedMeeting.title}`,
        content: `Dear ${displayName},

The meeting "${deletedMeeting.title}" has been cancelled and removed from your calendar.

📋 Cancelled Meeting Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Originally Scheduled: ${formattedDate}
⏰ Time: ${meetingTime}
🏢 Department: ${deletedMeeting.department}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Purpose:
${deletedMeeting.purpose}

⚠️ Important:
• This meeting has been removed from your calendar
• Any previously scheduled reminders have been cancelled
${deletedMeeting.isRecurring ? '• All future recurring instances have been removed' : ''}

Best regards,
BIG Marketplace Team 🌍`,
        date: new Date().toISOString(),
        read: false,
        type: "inbox",
        meetingId: deletedMeeting.id,
        linkTo: "/governance-calendar",
      });
      
      // ==================== END NOTIFICATIONS ====================
    }
   setNotification({ 
      type: "warning", 
      message: `❌ "${deletedMeeting.title}" has been cancelled` 
    });
  } catch (error) {
    setNotification({ 
      type: "error", 
      message: "Failed to delete meeting. Please try again." 
    });
  } finally {
    setLoading(false);
  }
};
  
  const getMeetingColor = (meeting) => meeting.departmentColor || "#757575";
  
  // Calendar helper functions
  const getMonthYear = () => {
    return currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  };
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const goToToday = () => {
    const d = new Date();
    setCurrentDate(d);
    setSelectedDate(d);
  };
  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const todayDate = new Date();
    
    for (let i = 0; i < firstDay; i++) {
      const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), -i);
      days.unshift({
        date: prevMonthDate,
        day: prevMonthDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
        meetings: [],
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      days.push({
        date: date,
        day: i,
        isCurrentMonth: true,
        isToday: date.toDateString() === todayDate.toDateString(),
        meetings: getMeetingsForDate(date),
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      days.push({
        date: nextMonthDate,
        day: i,
        isCurrentMonth: false,
        isToday: false,
        meetings: [],
      });
    }
    
    return days;
  };
  
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const calendarDays = generateCalendarDays();
  
  const isSelectedDate = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };
  
  const handleDateClick = (date) => {
    setSelectedDate(date);
    if (!showAddModal && date >= today) {
      setFormData(prev => ({ ...prev, startDate: date.toISOString().split('T')[0] }));
    }
  };
  
  const handleOpenAddModal = () => {
    const targetDate = selectedDate >= today ? selectedDate : new Date();
    setFormData(prev => ({ ...prev, startDate: targetDate.toISOString().split('T')[0] }));
    setShowAddModal(true);
  };
  
  const selectedMeetings = getMeetingsForDate(selectedDate);
  
  // Styles
  const containerStyles = {
    backgroundColor: "#fdfcfb",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
  };
  
  
  const keyQuestionStyles = {
    backgroundColor: "#DCDCDC",
    padding: "15px 20px",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid #5d4037",
  };
  
  const headerRowStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  };
  
  const pageTitleStyles = {
    color: "#5d4037",
    fontSize: "28px",
    fontWeight: "700",
    margin: 0,
  };
  
  const addButtonStyles = {
    padding: "10px 20px",
    backgroundColor: "#7d5a50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };
  
  const calendarHeaderStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "15px",
    borderBottom: "2px solid #e8ddd4",
    flexWrap: "wrap",
    gap: "10px",
  };
  
  const navButtonStyles = {
    padding: "8px 12px",
    backgroundColor: "#7d5a50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
  };
  
  const monthTitleStyles = {
    fontSize: "20px",
    fontWeight: "600",
    color: "#5d4037",
  };
  
  const todayButtonStyles = {
    padding: "8px 16px",
    backgroundColor: "#e6d7c3",
    color: "#4a352f",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "13px",
  };
  
  const weekdayHeaderStyles = {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    marginBottom: "10px",
  };
  
  const weekdayCellStyles = {
    padding: "12px",
    textAlign: "center",
    fontWeight: "600",
    color: "#5d4037",
    fontSize: "14px",
  };
  
  const calendarGridStyles = {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "5px",
  };
  
  const getDayCellStyles = (day) => {
    let backgroundColor = "#ffffff";
    let color = "#4a352f";
    let fontWeight = "normal";
    
    if (!day.isCurrentMonth) {
      backgroundColor = "#f5f5f5";
      color = "#bdbdbd";
    }
    
    if (day.isToday) {
      backgroundColor = "#7d5a50";
      color = "white";
      fontWeight = "bold";
    }
    
    if (isSelectedDate(day.date) && !day.isToday) {
      backgroundColor = "#e6d7c3";
      color = "#4a352f";
      fontWeight = "bold";
    }
    
    return {
      backgroundColor,
      color,
      fontWeight,
      padding: "12px 8px",
      textAlign: "center",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      border: "1px solid #e8ddd4",
      minHeight: "80px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      position: "relative",
    };
  };
  
  const dayNumberStyles = {
    fontSize: "14px",
    fontWeight: "inherit",
    marginBottom: "4px",
  };
  
  const eventDotStyles = (color) => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: color,
    margin: "2px",
    display: "inline-block",
  });
  
  const eventIndicatorsContainer = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "2px",
    marginTop: "4px",
  };
  
  const legendContainerStyles = {
    backgroundColor: "#f7f3f0",
    padding: "12px 16px",
    borderRadius: "6px",
    marginBottom: "20px",
    border: "1px solid #e8ddd4",
  };
  
  const legendTitleStyles = {
    fontSize: "12px",
    fontWeight: "600",
    color: "#5d4037",
    marginBottom: "10px",
    letterSpacing: "0.5px",
  };
  
  const legendItemsContainer = {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    alignItems: "center",
  };
  
  const legendItemStyles = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "#4a352f",
  };
  
  const legendColorBlockStyles = (color) => ({
    width: "12px",
    height: "12px",
    borderRadius: "3px",
    backgroundColor: color,
  });
  
  const meetingItemStyles = (color, bg) => ({
    padding: "12px",
    backgroundColor: bg,
    borderLeft: `4px solid ${color}`,
    borderRadius: "6px",
    marginBottom: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  });
  
  const meetingTitleStyles = {
    fontWeight: "bold",
    fontSize: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };
  
  const meetingMetaStyles = {
    fontSize: "11px",
    color: "#8d6e63",
    marginTop: "4px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  };
  
  const participantBadgeStyles = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: "2px 6px",
    borderRadius: "12px",
    fontSize: "10px",
  };
  
  const purposePreviewStyles = {
    fontSize: "12px",
    marginTop: "4px",
    color: "#4a352f",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
  
  const deleteIconStyles = {
    background: "none",
    border: "none",
    color: "#f44336",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  
  const selectedDateInfoStyles = {
    marginTop: "20px",
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: "#f7f3f0",
    borderRadius: "6px",
    border: "1px solid #e8ddd4",
  };
  
  const selectedDateTitleStyles = {
    fontSize: "16px",
    fontWeight: "600",
    color: "#5d4037",
    marginBottom: "12px",
  };
  
  const noEventsStyles = {
    color: "#8d6e63",
    fontSize: "14px",
    fontStyle: "italic",
  };
  
  // Modal Styles
  const modalOverlayStyles = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };
  
  const modalStyles = {
    backgroundColor: "white",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "550px",
    maxHeight: "85vh",
    overflow: "auto",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  };
  
  const modalHeaderStyles = {
    padding: "20px 24px",
    borderBottom: "2px solid #e8ddd4",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };
  
  const modalTitleStyles = {
    fontSize: "20px",
    fontWeight: "600",
    color: "#5d4037",
    margin: 0,
  };
  
  const closeButtonStyles = {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#8d6e63",
  };
  
  const modalBodyStyles = {
    padding: "24px",
  };
  
  const formGroupStyles = {
    marginBottom: "20px",
  };
  
  const labelStyles = {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#4a352f",
    fontSize: "14px",
  };
  
  const inputStyles = (hasError) => ({
    width: "100%",
    padding: "10px 12px",
    border: hasError ? "2px solid #f44336" : "2px solid #e8ddd4",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
  });
  
  const textareaStyles = (hasError) => ({
    width: "100%",
    padding: "10px 12px",
    border: hasError ? "2px solid #f44336" : "2px solid #e8ddd4",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    boxSizing: "border-box",
  });
  
  const selectStyles = (hasError) => ({
    width: "100%",
    padding: "10px 12px",
    border: hasError ? "2px solid #f44336" : "2px solid #e8ddd4",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    backgroundColor: "white",
    cursor: "pointer",
  });
  
  const errorTextStyles = {
    color: "#f44336",
    fontSize: "12px",
    marginTop: "4px",
  };
  
  const departmentDropdownStyles = {
    border: "2px solid #e8ddd4",
    borderRadius: "6px",
    overflow: "hidden",
  };
  
  const departmentOptionStyles = (dept, isSelected) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    cursor: "pointer",
    backgroundColor: isSelected ? dept.bg : "white",
    transition: "all 0.2s ease",
    borderBottom: "1px solid #f0e6d9",
  });
  
  const departmentColorBlockStyles = (color) => ({
    width: "20px",
    height: "20px",
    borderRadius: "4px",
    backgroundColor: color,
  });
  
  const addDepartmentButtonStyles = {
    width: "100%",
    padding: "10px",
    backgroundColor: "#f7f3f0",
    border: "2px dashed #e8ddd4",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#7d5a50",
    fontSize: "13px",
    marginTop: "8px",
  };
  
  const modalFooterStyles = {
    padding: "16px 24px",
    borderTop: "2px solid #e8ddd4",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  };
  
  const cancelButtonStyles = {
    padding: "10px 20px",
    backgroundColor: "#e6d7c3",
    color: "#4a352f",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
  };
  
  const submitButtonStyles = {
    padding: "10px 20px",
    backgroundColor: "#7d5a50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: loading ? "not-allowed" : "pointer",
    fontWeight: "600",
    fontSize: "14px",
    opacity: loading ? 0.7 : 1,
  };
  
  const repeatHelpStyles = {
    fontSize: "11px",
    color: "#8d6e63",
    marginTop: "4px",
    fontStyle: "italic",
  };
  
  // Details Modal Styles
  const detailsModalStyles = {
    backgroundColor: "white",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "500px",
    maxHeight: "85vh",
    overflow: "auto",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  };
  
  const detailsSectionStyles = {
    marginBottom: "20px",
  };
  
  const detailsLabelStyles = {
    fontSize: "11px",
    fontWeight: "600",
    color: "#8d6e63",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "6px",
  };
  
  const detailsValueStyles = {
    fontSize: "14px",
    color: "#4a352f",
    lineHeight: "1.5",
  };
  
  const participantsListStyles = {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "8px",
  };
  
  const participantTagStyles = {
    backgroundColor: "#f7f3f0",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    color: "#5d4037",
  };
  
  const recurringBadgeStyles = {
    display: "inline-block",
    backgroundColor: "#e8f5e9",
    color: "#4caf50",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "500",
  };
  
  const departmentColorStripStyles = (color) => ({
    width: "100%",
    height: "4px",
    backgroundColor: color,
    borderRadius: "2px",
    marginBottom: "16px",
  });
  
  const detailsActionButtonsStyles = {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #e8ddd4",
  };
  
  const detailsDeleteButtonStyles = {
    flex: 1,
    padding: "10px",
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
  };
  
  const detailsCloseButtonStyles = {
    flex: 1,
    padding: "10px",
    backgroundColor: "#e6d7c3",
    color: "#4a352f",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
  };
  
  const confirmOverlayStyles = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1100,
  };
  
  const confirmModalStyles = {
    backgroundColor: "white",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "400px",
    padding: "24px",
    textAlign: "center",
  };
  
  const confirmTitleStyles = {
    fontSize: "18px",
    fontWeight: "600",
    color: "#5d4037",
    marginBottom: "12px",
  };
  
  const confirmMessageStyles = {
    fontSize: "14px",
    color: "#4a352f",
    marginBottom: "20px",
  };
  
  const confirmButtonsStyles = {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  };
  
  const confirmDeleteStyles = {
    padding: "8px 20px",
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  };
  
  const confirmCancelStyles = {
    padding: "8px 20px",
    backgroundColor: "#e6d7c3",
    color: "#4a352f",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  };

  
  // Styles object
const styles = {
  container: {
    backgroundColor: "#fdfcfb",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  keyQuestion: {
    backgroundColor: "#DCDCDC",
    padding: "15px 20px",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid #5d4037",
  },
  notification: {
    padding: "12px 20px",
    borderRadius: "8px",
    marginBottom: "16px",
    color: "#4a352f",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  // ✅ ADD SPIN ANIMATION AS AN OBJECT
  spin: {
    animation: 'spin 1s linear infinite',
  },
};

// ✅ ADD KEYFRAMES AS A STYLE TAG (only once)
const SpinKeyframes = () => (
  <style>{`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}</style>
);

  // If no user is logged in, show login message
  if (!currentUser) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: "center", padding: "40px", color: "#5d4037" }}>
          <h2>Please Log In</h2>
          <p>You need to be logged in to access the Governance Calendar.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={containerStyles}>
          <SpinKeyframes />
      {/* Notification Banner */}
{notification && (
  <div style={{
    padding: "12px 20px",
    borderRadius: "8px",
    marginBottom: "16px",
    backgroundColor: notification.type === "success" ? "#E8F5E9" : 
                     notification.type === "warning" ? "#FFF3E0" : 
                     notification.type === "error" ? "#FFEBEE" : "#E3F2FD",
    borderLeft: `4px solid ${
      notification.type === "success" ? "#4CAF50" : 
      notification.type === "warning" ? "#FF9800" : 
      notification.type === "error" ? "#F44336" : "#2196F3"
    }`,
    color: "#4a352f",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  }}>
    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {notification.type === "success" && "✅"}
      {notification.type === "warning" && "⚠️"}
      {notification.type === "error" && "❌"}
      {notification.type === "info" && "ℹ️"}
      {notification.message}
    </span>
    <button
      onClick={() => setNotification(null)}
      style={{
        background: "none",
        border: "none",
        fontSize: "18px",
        cursor: "pointer",
        color: "#8d6e63",
        padding: "0 4px",
      }}
    >
      ×
    </button>
  </div>
)}
      {/* Header with Page Title and Add Button */}
      <div style={headerRowStyles}>
          <div style={{ 
            marginBottom: "24px",
            paddingBottom: "16px",
            borderBottom: "2px solid #e8ddd4",
          }}>
            <h1 style={{
              color: "#5d4037",
              fontSize: "28px",
              fontWeight: "700",
              margin: 0,
              marginBottom: "8px",
              letterSpacing: "-0.5px",
            }}>
              Governance Calendar
            </h1>
            <p style={{
              color: "#8d6e63",
              fontSize: "15px",
              fontWeight: "400",
              margin: 0,
              lineHeight: "1.5",
            }}>
              Track and manage board meetings, committee sessions, and key governance events in one place.
            </p>
          </div>
        <button onClick={handleOpenAddModal} style={addButtonStyles}>
          + Add Meeting
        </button>
      </div>
      
      {/* Calendar Header */}
      <div style={calendarHeaderStyles}>
        <button onClick={goToPreviousMonth} style={navButtonStyles}>
          <FaChevronLeft size={12} /> Prev
        </button>
        <span style={monthTitleStyles}>{getMonthYear()}</span>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={goToToday} style={todayButtonStyles}>
            Today
          </button>
          <button onClick={goToNextMonth} style={navButtonStyles}>
            Next <FaChevronRight size={12} />
          </button>
        </div>
      </div>
      
      {/* Weekday Headers */}
      <div style={weekdayHeaderStyles}>
        {weekdays.map((day) => (
          <div key={day} style={weekdayCellStyles}>
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Days Grid */}
      <div style={calendarGridStyles}>
        {calendarDays.map((day, index) => (
          <div
            key={index}
            style={getDayCellStyles(day)}
            onClick={() => handleDateClick(day.date)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span style={dayNumberStyles}>{day.day}</span>
            {day.meetings && day.meetings.length > 0 && (
              <div style={eventIndicatorsContainer}>
                {day.meetings.slice(0, 3).map((meeting, idx) => (
                  <div
                    key={idx}
                    style={eventDotStyles(getMeetingColor(meeting))}
                    title={meeting.title}
                  />
                ))}
                {day.meetings.length > 3 && (
                  <span style={{ fontSize: "10px", color: "#8d6e63" }}>
                    +{day.meetings.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Selected Date Information - Meeting Cards (Clickable) */}
      <div style={selectedDateInfoStyles}>
        <div style={selectedDateTitleStyles}>
          {selectedDate.toLocaleDateString("default", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
        {selectedMeetings.length === 0 ? (
          <div style={noEventsStyles}>
            No governance meetings scheduled for this date.
            {selectedDate >= today && (
              <button
                onClick={handleOpenAddModal}
                style={{
                  background: "none",
                  border: "none",
                  color: "#7d5a50",
                  cursor: "pointer",
                  textDecoration: "underline",
                  marginLeft: "8px",
                  fontSize: "13px",
                }}
              >
                Schedule one?
              </button>
            )}
          </div>
        ) : (
        selectedMeetings.map((meeting, idx) => {
  // ✅ Check if there are any future instances
  const hasFutureInstance = meeting.instances?.some(instance => {
    return new Date(instance.date) >= new Date();
  });
  
  // ✅ Only hide delete if ALL instances are in the past
  const isPastMeeting = !hasFutureInstance;
  const instance = meeting.instances?.find(inst => {
    const instDate = new Date(inst.date);
    return instDate.toDateString() === selectedDate.toDateString();
  });
  
  const participantCount = meeting.participants?.length || 0;
  
  return (
    <div
      key={idx}
      style={meetingItemStyles(meeting.departmentColor, meeting.departmentBg)}
      onClick={() => setShowDetailsModal(meeting)}
    >
      <div style={meetingTitleStyles}>
        <span>{meeting.title}</span>
        {/* Only show delete button for future meetings */}
        {!isPastMeeting && !isInvestorView && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(meeting.id);
            }}
            style={deleteIconStyles}
            title="Delete meeting"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#ffebee"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            ×
          </button>
        )}
      </div>
      <div style={meetingMetaStyles}>
        <span>{meeting.department}</span>
        <span>•</span>
        <span>{instance?.time || "Time TBD"}</span>
        {participantCount > 0 && (
          <>
            <span>•</span>
            <span style={participantBadgeStyles}>
              👥 {participantCount} participant{participantCount !== 1 ? "s" : ""}
            </span>
          </>
        )}
        {meeting.isRecurring && (
          <>
            <span>•</span>
            <span>🔄 {meeting.recurrencePattern === "weekly" ? "Weekly" : "Monthly"}</span>
          </>
        )}
      </div>
      <div style={purposePreviewStyles}>
        {meeting.purpose.length > 100 ? meeting.purpose.substring(0, 100) + "..." : meeting.purpose}
      </div>
    </div>
            );
          })
        )}
      </div>
      
      {/* Color Legend */}
      <div style={legendContainerStyles}>
        <div style={legendTitleStyles}>Department Color Guide</div>
        <div style={legendItemsContainer}>
          {allDepartments.map((dept) => (
            <div key={dept.name} style={legendItemStyles}>
              <div style={legendColorBlockStyles(dept.color)} />
              <span>{dept.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* KPIs Section */}
      <div style={{ backgroundColor: "#f7f3f0", padding: "20px", borderRadius: "6px" }}>
        <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px" }}>
          Governance Calendar KPIs
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
          <div style={{ backgroundColor: "#fdfcfb", padding: "15px", borderRadius: "4px", border: "2px solid #e8ddd4", textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#5d4037" }}>{meetings.length}</div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Total Meetings</div>
          </div>
          <div style={{ backgroundColor: "#fdfcfb", padding: "15px", borderRadius: "4px", border: "2px solid #e8ddd4", textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#5d4037" }}>{meetings.filter(m => m.isRecurring).length}</div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Recurring Meetings</div>
          </div>
          <div style={{ backgroundColor: "#fdfcfb", padding: "15px", borderRadius: "4px", border: "2px solid #e8ddd4", textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#5d4037" }}>{[...new Set(meetings.map(m => m.department))].length}</div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Active Departments</div>
          </div>
        </div>
      </div>
      
      {/* Add Meeting Modal */}
      {showAddModal && (
        <div style={modalOverlayStyles} onClick={() => setShowAddModal(false)}>
          <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyles}>
              <h3 style={modalTitleStyles}>Schedule Governance Meeting</h3>
              <button onClick={() => setShowAddModal(false)} style={closeButtonStyles}>×</button>
            </div>
            <div style={modalBodyStyles}>
              <div style={formGroupStyles}>
                <label style={labelStyles}>Meeting Title *</label>
                <input type="text" placeholder="e.g., Q4 Board Meeting, Strategy Review" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={inputStyles(errors.title)} />
                {errors.title && <div style={errorTextStyles}>{errors.title}</div>}
              </div>
              
              <div style={formGroupStyles}>
                <label style={labelStyles}>Department *</label>
                <div style={departmentDropdownStyles}>
                  {allDepartments.map((dept) => (
                    <div key={dept.name} onClick={() => setFormData({ ...formData, department: dept.name })} style={departmentOptionStyles(dept, formData.department === dept.name)}>
                      <div style={departmentColorBlockStyles(dept.color)} />
                      <span>{dept.name}</span>
                    </div>
                  ))}
                </div>
                {showAddDepartment ? (
                  <div style={{ marginTop: "12px" }}>
                    <input type="text" placeholder="Enter department name" value={newDepartmentName} onChange={(e) => setNewDepartmentName(e.target.value)} style={inputStyles(false)} autoFocus />
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button onClick={handleAddCustomDepartment} style={{ padding: "6px 12px", backgroundColor: "#7d5a50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Add</button>
                      <button onClick={() => setShowAddDepartment(false)} style={{ padding: "6px 12px", backgroundColor: "#e6d7c3", color: "#4a352f", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAddDepartment(true)} style={addDepartmentButtonStyles}>+ Add Custom Department</button>
                )}
              </div>
              
              <div style={formGroupStyles}>
                <label style={labelStyles}>Purpose of Meeting *</label>
                <textarea rows="3" placeholder="What is the goal of this meeting? What decisions need to be made?" value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} style={textareaStyles(errors.purpose)} />
                {errors.purpose && <div style={errorTextStyles}>{errors.purpose}</div>}
              </div>

            {/* Participants Section */}
                  <div style={formGroupStyles}>
                    <label style={labelStyles}>Participants</label>
                    
                    {/* 👇 THIS MAP RENDERS THE INPUT FIELDS */}
                    {formData.participants && formData.participants.length > 0 ? (
                      formData.participants.map((participant, index) => (
                        <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={participant.name || ""}
                            onChange={(e) => updateParticipant(index, "name", e.target.value)}
                            style={{ flex: 1, ...inputStyles(false) }}
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            value={participant.email || ""}
                            onChange={(e) => updateParticipant(index, "email", e.target.value)}
                            style={{ flex: 1, ...inputStyles(false) }}
                          />
                          <button
                            type="button"
                            onClick={() => removeParticipant(index)}
                            style={{ padding: "8px 12px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: "#8d6e63", fontSize: "13px", fontStyle: "italic" }}>
                        No participants added yet. Click "Add Participant" to invite people.
                      </p>
                    )}
                    
                    <button
                      type="button"
                      onClick={addParticipant}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#e6d7c3",
                        color: "#4a352f",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "13px",
                        marginTop: "8px",
                      }}
                    >
                      + Add Participant
                    </button>
                  </div>
              
              <div style={formGroupStyles}>
                <label style={labelStyles}>Repeat Frequency</label>
                <select value={formData.repeatType} onChange={(e) => setFormData({ ...formData, repeatType: e.target.value })} style={selectStyles(false)}>
                  <option value="none">One-time meeting</option>
                  <option value="weekly">Weekly (every 7 days)</option>
                  <option value="monthly">Monthly (same date each month)</option>
                </select>
                <div style={repeatHelpStyles}>Weekly/Monthly will schedule all future instances between start and end dates</div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div style={formGroupStyles}>
                  <label style={labelStyles}>Start Date *</label>
                  <input type="date" value={formData.startDate} min={today.toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} style={inputStyles(errors.startDate)} />
                  {errors.startDate && <div style={errorTextStyles}>{errors.startDate}</div>}
                </div>
                <div style={formGroupStyles}>
                  <label style={labelStyles}>Time *</label>
                  <input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} style={inputStyles(errors.time)} />
                  {errors.time && <div style={errorTextStyles}>{errors.time}</div>}
                </div>
              </div>
              
              {formData.repeatType !== "none" && (
                <div style={formGroupStyles}>
                  <label style={labelStyles}>End Date (optional)</label>
                  <input type="date" value={formData.endDate} min={formData.startDate || today.toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} style={inputStyles(errors.endDate)} />
                  {errors.endDate && <div style={errorTextStyles}>{errors.endDate}</div>}
                  <div style={repeatHelpStyles}>Leave empty to schedule indefinitely</div>
                </div>
              )}
            </div>
            <div style={modalFooterStyles}>
              <button onClick={() => setShowAddModal(false)} style={cancelButtonStyles}>Cancel</button>
              <button onClick={handleSubmit} disabled={loading} style={submitButtonStyles}>{loading ? "Scheduling..." : "Schedule Meeting"}</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Meeting Details Modal */}
  {showDetailsModal && (
  <div style={modalOverlayStyles} onClick={() => setShowDetailsModal(null)}>
    <div style={detailsModalStyles} onClick={(e) => e.stopPropagation()}>
      <div style={modalHeaderStyles}>
        <h3 style={modalTitleStyles}>Meeting Details</h3>
        <button onClick={() => setShowDetailsModal(null)} style={closeButtonStyles}>×</button>
      </div>
      <div style={modalBodyStyles}>
        <div style={departmentColorStripStyles(showDetailsModal.departmentColor)} />
        
        <div style={detailsSectionStyles}>
          <div style={detailsLabelStyles}>Meeting Title</div>
          <div style={detailsValueStyles}>{showDetailsModal.title}</div>
        </div>
        
        <div style={detailsSectionStyles}>
          <div style={detailsLabelStyles}>Department</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: showDetailsModal.departmentColor }} />
            <span style={detailsValueStyles}>{showDetailsModal.department}</span>
          </div>
        </div>
        
        <div style={detailsSectionStyles}>
          <div style={detailsLabelStyles}>Purpose / Agenda</div>
          <div style={detailsValueStyles}>{showDetailsModal.purpose}</div>
        </div>
        
       <div style={detailsSectionStyles}>
          <div style={detailsLabelStyles}>Participants</div>
          {showDetailsModal.participants && showDetailsModal.participants.length > 0 ? (
            <div style={participantsListStyles}>
              {showDetailsModal.participants.map((participant, idx) => (
                <span key={idx} style={participantTagStyles}>
                  {participant.name || participant.email || "Participant"}
                  {participant.email && participant.name ? ` (${participant.email})` : ''}
                </span>
              ))}
            </div>
          ) : (
            <div style={detailsValueStyles}>No participants specified</div>
          )}
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div>
            <div style={detailsLabelStyles}>Date</div>
            <div style={detailsValueStyles}>
              {new Date(selectedDate).toLocaleDateString("default", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
          <div>
            <div style={detailsLabelStyles}>Time</div>
            <div style={detailsValueStyles}>
              {showDetailsModal.instances?.find(inst => {
                const instDate = new Date(inst.date);
                return instDate.toDateString() === selectedDate.toDateString();
              })?.time || "Time TBD"}
            </div>
          </div>
        </div>
        
        {showDetailsModal.isRecurring && (
          <div style={detailsSectionStyles}>
            <div style={detailsLabelStyles}>Recurrence</div>
            <div style={recurringBadgeStyles}>
              🔄 Repeats {showDetailsModal.recurrencePattern === "weekly" ? "Weekly" : "Monthly"}
            </div>
          </div>
        )}
        
        <div style={detailsSectionStyles}>
          <div style={detailsLabelStyles}>Created</div>
          <div style={detailsValueStyles}>
            {new Date(showDetailsModal.createdAt).toLocaleDateString()}
          </div>
        </div>
        
        {/* Actions Section in Meeting Details Modal */}
<div style={detailsSectionStyles}>
  <div style={detailsLabelStyles}>Actions</div>
  {showDetailsModal.actions && showDetailsModal.actions.length > 0 ? (
    <div>
      {showDetailsModal.actions.map((action) => (
        <div
          key={action.id}
          style={{
            padding: "8px 12px",
            backgroundColor: "#f7f3f0",
            borderRadius: "6px",
            marginBottom: "6px",
            borderLeft: `4px solid ${
              action.status === "completed" ? "#4CAF50" :
              action.status === "in-progress" ? "#2196F3" : "#FF9800"
            }`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "#4a352f" }}>
              {action.title}
            </span>
            <span
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "10px",
                backgroundColor:
                  action.status === "completed" ? "#E8F5E9" :
                  action.status === "in-progress" ? "#E3F2FD" : "#FFF3E0",
                color:
                  action.status === "completed" ? "#2E7D32" :
                  action.status === "in-progress" ? "#0D47A1" : "#E65100",
              }}
            >
              {action.status === "completed" ? "Done" :
               action.status === "in-progress" ? "In Progress" : "Open"}
            </span>
          </div>
          {action.assignedTo && (
            <div style={{ fontSize: "11px", color: "#8d6e63", marginTop: "2px" }}>
              👤 {action.assignedTo}
            </div>
          )}
        </div>
      ))}
    </div>
  ) : (
    <div style={{ fontSize: "13px", color: "#8d6e63", fontStyle: "italic" }}>
      No actions created yet.
    </div>
  )}
  <div style={{ marginTop: "12px" }}>
    <button
      onClick={() => {
        window.location.href = `/raps-actions?meeting=${showDetailsModal.id}`;
      }}
      style={{
        padding: "8px 16px",
        backgroundColor: "#7d5a50",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "500",
        width: "100%",
      }}
    >
      📋 View All Actions for this Meeting
    </button>
  </div>
</div>

        {/* Action Buttons - Only show Delete for future meetings */}
        {(() => {
          const isPastMeeting = new Date(showDetailsModal.instances?.[0]?.date) < new Date();
          return (
            <>
              {!isPastMeeting && !isInvestorView && (
                <div style={detailsActionButtonsStyles}>
                  <button
                    onClick={() => {
                      setShowDetailsModal(null);
                      setShowDeleteConfirm(showDetailsModal.id);
                    }}
                    style={detailsDeleteButtonStyles}
                  >
                    Delete Meeting
                  </button>
                  <button onClick={() => setShowDetailsModal(null)} style={detailsCloseButtonStyles}>
                    Close
                  </button>
                </div>
              )}
              
              {(isPastMeeting || isInvestorView) && (
                <div style={detailsActionButtonsStyles}>
                  <button onClick={() => setShowDetailsModal(null)} style={detailsCloseButtonStyles}>
                    Close
                  </button>
                </div>
              )}
            </>
          );
        })()}
        
      </div>
    </div>
  </div>
)}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={confirmOverlayStyles} onClick={() => setShowDeleteConfirm(null)}>
          <div style={confirmModalStyles} onClick={(e) => e.stopPropagation()}>
            <div style={confirmTitleStyles}>Delete Meeting</div>
            <div style={confirmMessageStyles}>Are you sure you want to delete this meeting? This action cannot be undone.</div>
            <div style={confirmButtonsStyles}>
              <button onClick={() => setShowDeleteConfirm(null)} style={confirmCancelStyles}>Cancel</button>
              <button onClick={() => handleDeleteMeeting(showDeleteConfirm)} style={confirmDeleteStyles}>Delete</button>
            </div>
          </div>
        </div>
      )}
              
            {/* Double Booking Warning Modal */}
        {showDoubleBookingWarning && (
          <div style={modalOverlayStyles} onClick={() => setShowDoubleBookingWarning(false)}>
            <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
              <div style={modalHeaderStyles}>
                <h3 style={modalTitleStyles}>⚠️ Double Booking Warning</h3>
                <button onClick={() => setShowDoubleBookingWarning(false)} style={closeButtonStyles}>×</button>
              </div>
              <div style={modalBodyStyles}>
                <div style={{
                  backgroundColor: "#FFF3E0",
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  borderLeft: "4px solid #FF9800",
                }}>
                  <p style={{ margin: 0, color: "#E65100", fontWeight: "500" }}>
                    You already have {conflictingMeetingData?.length || 0} meeting{conflictingMeetingData?.length > 1 ? 's' : ''} scheduled at this time.
                  </p>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <p style={{ fontWeight: "600", color: "#5d4037", marginBottom: "8px" }}>
                    Existing Meeting{conflictingMeetingData?.length > 1 ? 's' : ''}:
                  </p>
                  {conflictingMeetingData?.map((meeting, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "12px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "6px",
                        borderLeft: `4px solid ${meeting.departmentColor || "#757575"}`,
                        marginBottom: index < conflictingMeetingData.length - 1 ? "8px" : "0",
                      }}
                    >
                      <div><strong>{meeting.title}</strong></div>
                      <div style={{ fontSize: "13px", color: "#6d5a4f" }}>
                        {meeting.department} • {
                          new Date(meeting.instances?.[0]?.date).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        }
                      </div>
                      <div style={{ fontSize: "12px", color: "#8d6e63", marginTop: "4px" }}>
                        {meeting.purpose}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <p style={{ fontWeight: "600", color: "#5d4037", marginBottom: "8px" }}>
                    New Meeting:
                  </p>
                  <div style={{
                    padding: "12px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "6px",
                    borderLeft: `4px solid ${pendingMeetingData?.departmentColor || "#757575"}`,
                  }}>
                    <div><strong>{pendingMeetingData?.title}</strong></div>
                    <div style={{ fontSize: "13px", color: "#6d5a4f" }}>
                      {pendingMeetingData?.department} • {pendingMeetingData?.time}
                    </div>
                    <div style={{ fontSize: "12px", color: "#8d6e63", marginTop: "4px" }}>
                      {pendingMeetingData?.purpose}
                    </div>
                  </div>
                </div>

                <div style={{
                  backgroundColor: "#FFEBEE",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "#C62828" }}>
                    ⚠️ You are about to schedule {conflictingMeetingData?.length + 1} meeting{conflictingMeetingData?.length + 1 > 1 ? 's' : ''} at the same time. 
                    This will create {conflictingMeetingData?.length} conflict{conflictingMeetingData?.length > 1 ? 's' : ''}.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => {
                      setShowDoubleBookingWarning(false);
                      proceedWithBooking();
                    }}
                    style={{
                      flex: 1,
                      padding: "12px",
                      backgroundColor: "#f00a0a",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    Yes, Double-Book All
                  </button>
                  <button
                    onClick={() => {
                      setShowDoubleBookingWarning(false);
                      setConflictingMeetingData(null);
                      setPendingMeetingData(null);
                      setLoading(false);
                    }}
                    style={{
                      flex: 1,
                      padding: "12px",
                      backgroundColor: "#e6d7c3",
                      color: "#4a352f",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    No, Cancel Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
          {loading && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              backdropFilter: "blur(4px)",
            }}>
              <div style={{
                backgroundColor: "white",
                padding: "32px 40px",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                textAlign: "center",
              }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  border: "4px solid #f3e5f5",
                  borderTop: "4px solid #7d5a50",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 16px",
                }} />
                <p style={{ color: "#4a352f", fontSize: "16px", fontWeight: "500", margin: 0 }}>
                  {loadingMessage || "Processing..."}
                </p>
              </div>
            </div>
          )}
    </div>
  );

};

export default GovernanceCalendar;