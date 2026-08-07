"use client";

import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaEdit, FaSave, FaTimes, FaPlus } from "react-icons/fa";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useLocation } from "react-router-dom";

const functions = getFunctions();

// ============================================
// CATEGORY OPTIONS (Single Select)
// ============================================
const categoryOptions = [
  { name: "Strategy & Execution", color: "#2196F3", bg: "#E3F2FD" },
  { name: "Financial Performance", color: "#FF9800", bg: "#FFF3E0" },
  { name: "Operational Performance", color: "#9C27B0", bg: "#F3E5F5" },
  { name: "People", color: "#FF5722", bg: "#FBE9E7" },
  { name: "ESG Impact", color: "#8BC34A", bg: "#F1F8E9" },
  { name: "Marketing & Sales", color: "#E91E63", bg: "#FCE4EC" },
  { name: "Overall Company Health", color: "#4CAF50", bg: "#E8F5E9" },
];

// ============================================
// DEPARTMENT OPTIONS (Multi-Select)
// ============================================
const departmentOptions = [
  { name: "Marketing", color: "#E91E63", bg: "#FCE4EC" },
  { name: "Finance", color: "#FF9800", bg: "#FFF3E0" },
  { name: "Operations", color: "#9C27B0", bg: "#F3E5F5" },
  { name: "Human Resources", color: "#FF5722", bg: "#FBE9E7" },
  { name: "Sales", color: "#4CAF50", bg: "#E8F5E9" },
  { name: "Information Technology", color: "#2196F3", bg: "#E3F2FD" },
  { name: "Legal", color: "#795548", bg: "#EFEBE9" },
  { name: "Research & Development", color: "#607D8B", bg: "#ECEFF1" },
  { name: "Customer Support", color: "#009688", bg: "#E0F2F1" },
  { name: "Product", color: "#3F51B5", bg: "#E8EAF6" },
];

const GovernanceCalendar = ({ activeSection, isInvestorView }) => {
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("Processing...");
  const [notification, setNotification] = useState(null);
  const [showDoubleBookingWarning, setShowDoubleBookingWarning] = useState(false);
  const [pendingMeetingData, setPendingMeetingData] = useState(null);
  const [conflictingMeetingData, setConflictingMeetingData] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showRecurringDeleteModal, setShowRecurringDeleteModal] = useState(false);
  const [recurringDeleteMeeting, setRecurringDeleteMeeting] = useState(null);
  const [rescheduleMeeting, setRescheduleMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [rescheduleData, setRescheduleData] = useState({
    newDate: "",
    newTime: "",
    reason: "",
  });

  // Tabs state
  const [activeTab, setActiveTab] = useState("overview");
  const [editingField, setEditingField] = useState(null);
  const [tempEditValue, setTempEditValue] = useState("");
  const [showQuickAddAction, setShowQuickAddAction] = useState(false);
  const [quickActionForm, setQuickActionForm] = useState({
    title: "",
    assignedTo: "",
    dueDate: "",
    status: "In Progress",
  });

  // Department options with colors
  const departmentOptionsOld = [
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
  const [newDepartmentColor, setNewDepartmentColor] = useState("#607D8B");
  
  const [formData, setFormData] = useState({
    title: "",
    category: categoryOptions[0].name,
    department: departmentOptionsOld[0].name,
    departments: [],
    purpose: "",
    participants: [],
    repeatType: "none",
    startDate: "",
    endDate: "",
    time: "10:00",
  });
  
  const [errors, setErrors] = useState({});

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    category: categoryOptions[0].name,
    department: "",
    departments: [],
    purpose: "",
    participants: [],
    repeatType: "none",
    startDate: "",
    time: "",
  });
    
  const allDepartments = [...departmentOptions, ...customDepartments];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [userProfile, setUserProfile] = useState(null);

  // Helper functions for departments
  const getDepartmentColor = (deptName) => {
    const found = allDepartments.find(d => d.name === deptName);
    return found?.color || "#757575";
  };

  const getDepartmentBg = (deptName) => {
    const found = allDepartments.find(d => d.name === deptName);
    return found?.bg || "#EEEEEE";
  };

  // Toggle department selection in add form
  const toggleDepartment = (deptName) => {
    const current = formData.departments || [];
    if (current.includes(deptName)) {
      setFormData({ ...formData, departments: current.filter(d => d !== deptName) });
    } else {
      setFormData({ ...formData, departments: [...current, deptName] });
    }
  };

  // Toggle department selection in edit form
  const toggleEditDepartment = (deptName) => {
    const current = editFormData.departments || [];
    if (current.includes(deptName)) {
      setEditFormData({ ...editFormData, departments: current.filter(d => d !== deptName) });
    } else {
      setEditFormData({ ...editFormData, departments: [...current, deptName] });
    }
  };

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
    const params = new URLSearchParams(location.search);
    const meetingId = params.get("meeting");
    
    if (meetingId && meetings.length > 0) {
      const meeting = meetings.find(m => m.id === meetingId);
      if (meeting) {
        setShowDetailsModal(meeting);
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
    const newColor = newDepartmentColor || getRandomColor();
    setCustomDepartments([
      ...customDepartments,
      {
        name: newDepartmentName.trim(),
        color: newColor,
        bg: getRandomBgColor(newColor),
      },
    ]);
    setNewDepartmentName("");
    setNewDepartmentColor("#607D8B");
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

  // Get department colors for a meeting (for calendar dots)
  const getMeetingDepartmentColors = (meeting) => {
    if (!meeting.departments || meeting.departments.length === 0) {
      return [meeting.categoryColor || meeting.departmentColor || "#757575"];
    }
    return meeting.departments.map(dept => getDepartmentColor(dept));
  };
  
  const generateInstances = (startDate, endDate, repeatType) => {
    const instances = [];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    const maxEndDate = new Date(start);
    maxEndDate.setFullYear(maxEndDate.getFullYear() + 1);
    
    const actualEnd = end && end < maxEndDate ? end : maxEndDate;
    
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
      let maxIterations = 52;
      let iterations = 0;
      
      while ((!end || current <= actualEnd) && iterations < maxIterations) {
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
      let maxIterations = 12;
      let iterations = 0;
      
      while ((!end || current <= actualEnd) && iterations < maxIterations) {
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
    
    if (repeatType === "quarterly") {
      let current = new Date(start);
      let maxIterations = 4;
      let iterations = 0;
      
      while ((!end || current <= actualEnd) && iterations < maxIterations) {
        if (current >= today) {
          instances.push({
            instanceId: generateId(),
            date: current.toISOString(),
            time: formData.time,
            status: "scheduled",
          });
        }
        current.setMonth(current.getMonth() + 3);
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
      const selectedCategory = categoryOptions.find(c => c.name === formData.category);
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
        category: formData.category,
        department: formData.department,
        categoryColor: selectedCategory?.color || "#757575",
        categoryBg: selectedCategory?.bg || "#EEEEEE",
        departmentColor: selectedDepartment?.color || "#757575",
        departmentBg: selectedDepartment?.bg || "#EEEEEE",
        departments: formData.departments || [],
        purpose: formData.purpose,
        participants: formData.participants,
        isRecurring: formData.repeatType !== "none",
        recurrencePattern: formData.repeatType !== "none" ? formData.repeatType : null,
        recurrenceInterval: formData.repeatType !== "none" ? 1 : null,
        instances: instances,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        highlights: "",
        lowlights: "",
        risks: "",
        headsUp: "",
        actions: [],
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
        category: categoryOptions[0].name,
        department: departmentOptionsOld[0].name,
        departments: [],
        purpose: "",
        participants: [],
        repeatType: "none",
        startDate: "",
        endDate: "",
        time: "10:00",
      });
      setErrors({});
      setShowAddModal(false);
      
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
      const departmentsText = newMeeting.departments.length > 0 
        ? newMeeting.departments.join(", ")
        : 'No departments specified';
      const recurrenceText = newMeeting.isRecurring 
        ? `🔄 Repeats ${newMeeting.recurrencePattern === 'weekly' ? 'Weekly' : 
                        newMeeting.recurrencePattern === 'monthly' ? 'Monthly' : 
                        'Quarterly'}` 
        : '';
      
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
      
      const isDoubleBooked = conflictingMeetingData !== null && conflictingMeetingData.length > 0;
      const notificationEmoji = isDoubleBooked ? "⚠️" : "✅";
      const notificationType = isDoubleBooked ? "warning" : "success";
      const notificationSubject = isDoubleBooked ? "Double-Booked" : "Confirmed";
      
      setNotification({ 
        type: notificationType, 
        message: `${notificationEmoji} "${formData.title}" ${isDoubleBooked ? 'double-booked' : 'confirmed'} for ${formattedDate} at ${meetingTime}` 
      });
      setTimeout(() => setNotification(null), 5000);
      
      let notificationContent = `Dear ${userName},

Your meeting "${formData.title}" has been successfully added to your calendar.`;

      if (isDoubleBooked && conflictingMeetingData?.length > 0) {
        notificationContent += `\n\n⚠️ Notice: You already have ${conflictingMeetingData.length} other meeting${conflictingMeetingData.length > 1 ? 's' : ''} scheduled at the same time:\n\n`;
        
        conflictingMeetingData.forEach((meeting, index) => {
          notificationContent += `${index + 1}. "${meeting.title}" (${meeting.category || meeting.department})\n`;
        });
        
        notificationContent += `\nPlease check your calendar and manage your schedule accordingly.`;
      }

      notificationContent += `\n\n📋 Meeting Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Date: ${formattedDate}
⏰ Time: ${meetingTime}
📂 Category: ${formData.category}
📁 Departments: ${departmentsText}
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
            department: formData.category,
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
      setLoading(false);
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
      const selectedCategory = categoryOptions.find(c => c.name === formData.category);
      
      setPendingMeetingData({
        title: formData.title,
        category: formData.category,
        categoryColor: selectedCategory?.color || "#757575",
        time: formData.time,
        date: formattedDateForCheck,
        purpose: formData.purpose,
      });
      
      setConflictingMeetingData(conflictingMeetings);
      setShowDoubleBookingWarning(true);
      return;
    }
    
    await proceedWithBooking();
  };

  // Open edit modal with meeting data
  const handleEditMeeting = (meeting) => {
    setEditingMeeting(meeting);
    
    const firstInstance = meeting.instances?.[0];
    const instanceDate = firstInstance ? new Date(firstInstance.date) : new Date();
    
    setEditFormData({
      title: meeting.title || "",
      category: meeting.category || categoryOptions[0].name,
      department: meeting.department || departmentOptionsOld[0].name,
      departments: meeting.departments || [],
      purpose: meeting.purpose || "",
      participants: meeting.participants || [],
      repeatType: meeting.recurrencePattern || "none",
      startDate: instanceDate.toISOString().split('T')[0],
      time: firstInstance?.time || "10:00",
    });
    
    setShowEditModal(true);
  };

  // Update participant in edit form
  const updateEditParticipant = (index, field, value) => {
    const updated = [...editFormData.participants];
    updated[index] = { ...updated[index], [field]: value };
    setEditFormData({ ...editFormData, participants: updated });
  };

  // Add participant to edit form
  const addEditParticipant = () => {
    setEditFormData({
      ...editFormData,
      participants: [...editFormData.participants, { name: "", email: "" }],
    });
  };

  // Remove participant from edit form
  const removeEditParticipant = (index) => {
    const updated = editFormData.participants.filter((_, i) => i !== index);
    setEditFormData({ ...editFormData, participants: updated });
  };

  const saveEditedMeeting = async () => {
    if (!editingMeeting || !currentUser) return;
    
    setLoading(true);
    setLoadingMessage("Saving changes...");
    
    try {
      const originalMeeting = { ...editingMeeting };
      
      const selectedCategory = categoryOptions.find(c => c.name === editFormData.category);
      const categoryColor = selectedCategory?.color || "#757575";
      const categoryBg = selectedCategory?.bg || "#EEEEEE";
      
      const selectedDepartment = allDepartments.find(d => d.name === editFormData.department);
      const departmentColor = selectedDepartment?.color || "#757575";
      const departmentBg = selectedDepartment?.bg || "#EEEEEE";
      
      const updatedMeeting = {
        ...editingMeeting,
        title: editFormData.title,
        category: editFormData.category,
        department: editFormData.department,
        categoryColor: categoryColor,
        categoryBg: categoryBg,
        departmentColor: departmentColor,
        departmentBg: departmentBg,
        departments: editFormData.departments || [],
        purpose: editFormData.purpose,
        participants: editFormData.participants,
        isRecurring: editFormData.repeatType !== "none",
        recurrencePattern: editFormData.repeatType !== "none" ? editFormData.repeatType : null,
        updatedAt: new Date().toISOString(),
      };
      
      const oldDate = updatedMeeting.instances?.[0]?.date;
      const oldTime = updatedMeeting.instances?.[0]?.time;
      
      if (updatedMeeting.instances && updatedMeeting.instances.length > 0) {
        const newDate = new Date(editFormData.startDate);
        updatedMeeting.instances[0].date = newDate.toISOString();
        updatedMeeting.instances[0].time = editFormData.time;
      }
      
      const newDate = updatedMeeting.instances?.[0]?.date;
      const newTime = updatedMeeting.instances?.[0]?.time;
      
      const titleChanged = originalMeeting.title !== updatedMeeting.title;
      const dateChanged = oldDate !== newDate;
      const timeChanged = oldTime !== newTime;
      const categoryChanged = originalMeeting.category !== updatedMeeting.category;
      const departmentChanged = originalMeeting.department !== updatedMeeting.department;
      const departmentsChanged = JSON.stringify(originalMeeting.departments) !== JSON.stringify(updatedMeeting.departments);
      const participantsChanged = JSON.stringify(originalMeeting.participants) !== JSON.stringify(updatedMeeting.participants);
      
      const hasChanges = titleChanged || dateChanged || timeChanged || categoryChanged || departmentChanged || departmentsChanged || participantsChanged;
      
      if (!hasChanges) {
        setNotification({ type: "info", message: "No changes were made." });
        setShowEditModal(false);
        setEditingMeeting(null);
        setLoading(false);
        return;
      }
      
      const updatedMeetings = meetings.map(m => 
        m.id === editingMeeting.id ? updatedMeeting : m
      );
      
      setMeetings(updatedMeetings);
      
      const calendarRef = doc(db, "governanceCalendar", currentUser.uid);
      await setDoc(calendarRef, {
        meetings: updatedMeetings,
        updatedAt: new Date().toISOString(),
        userId: currentUser.uid,
      }, { merge: true });
      
      const formattedOldDate = oldDate ? new Date(oldDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }) : "TBD";
      
      const formattedNewDate = newDate ? new Date(newDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }) : "TBD";
      
      let changes = [];
      if (titleChanged) changes.push(`Title changed to "${updatedMeeting.title}"`);
      if (dateChanged) changes.push(`Date changed from ${formattedOldDate} to ${formattedNewDate}`);
      if (timeChanged) changes.push(`Time changed from ${oldTime} to ${newTime}`);
      if (categoryChanged) changes.push(`Category changed to ${updatedMeeting.category}`);
      if (departmentChanged) changes.push(`Department changed to ${updatedMeeting.department}`);
      if (departmentsChanged) changes.push(`Departments updated`);
      if (participantsChanged) changes.push(`Participants updated`);
      
      const changeSummary = changes.join("; ");
      
      let userName = "User";
      try {
        const profileRef = doc(db, "universalProfiles", currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          userName = data.entityOverview?.registeredName || 
                     data.contactDetails?.contactName ||
                     currentUser.displayName ||
                     "User";
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
      
      const recipients = [];
      let ownerEmail = null;
      
      try {
        const userDocRef = await getDoc(doc(db, "users", currentUser.uid));
        if (userDocRef.exists()) {
          ownerEmail = userDocRef.data().email;
        }
      } catch (error) {
        console.error("Error fetching owner email:", error);
      }
      
      if (ownerEmail) {
        recipients.push({ email: ownerEmail, name: userName, isOrganizer: true });
      }
      
      if (updatedMeeting.participants && updatedMeeting.participants.length > 0) {
        updatedMeeting.participants.forEach(p => {
          if (p.email && p.email.trim()) {
            recipients.push({
              email: p.email.trim(),
              name: p.name || "Participant",
              isOrganizer: false,
            });
          }
        });
      }
      
      for (const recipient of recipients) {
        try {
          const notificationContent = `Dear ${recipient.name},\n\n` +
            `The meeting "${updatedMeeting.title}" has been updated.\n\n` +
            `📋 Changes:\n${changeSummary}\n\n` +
            `${recipient.isOrganizer ? 'Your meeting has been updated successfully.' : 'Please review the updated meeting details.'}\n\n` +
            `Best regards,\nBIG Marketplace Team 🌍`;
          
          await addDoc(collection(db, "messages"), {
            to: recipient.isOrganizer ? currentUser.uid : updatedMeeting.participants.find(p => p.email === recipient.email)?.id || recipient.email,
            toName: recipient.name,
            from: "system",
            fromName: "BIG Marketplace",
            subject: `📅 Meeting Updated: ${updatedMeeting.title}`,
            content: notificationContent,
            date: new Date().toISOString(),
            read: false,
            type: "inbox",
            meetingId: updatedMeeting.id,
            linkTo: "/governance-calendar",
          });
          
          console.log(`✅ Update notification sent to: ${recipient.name}`);
        } catch (error) {
          console.error(`❌ Failed to send update notification to ${recipient.name}:`, error);
        }
      }
      
      let senderName = "User";
      try {
        const profileRef = doc(db, "universalProfiles", currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          senderName = data.entityOverview?.registeredName || 
                       data.contactDetails?.contactName ||
                       currentUser.displayName ||
                       "User";
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
      
      for (const recipient of recipients) {
        try {
          const functions = getFunctions();
          const sendMeetingUpdateEmail = httpsCallable(functions, 'sendGovernanceMeetingUpdateEmail');
          
          await sendMeetingUpdateEmail({
            to: recipient.email,
            name: recipient.name,
            meetingTitle: updatedMeeting.title,
            changes: changeSummary,
            meetingDate: formattedNewDate,
            meetingTime: newTime || "TBD",
            department: updatedMeeting.category || updatedMeeting.department,
            isOrganizer: recipient.isOrganizer,
            linkTo: "https://www.bigmarketplace.africa/governance-calendar"
          });
          
          console.log(`✅ Meeting update email sent to: ${recipient.email}`);
        } catch (emailError) {
          console.error(`❌ Failed to send meeting update email to ${recipient.email}:`, emailError);
        }
      }
      
      setNotification({
        type: "success",
        message: `✅ "${updatedMeeting.title}" updated successfully!`,
      });
      setTimeout(() => setNotification(null), 3000);
      
      setShowEditModal(false);
      setEditingMeeting(null);
      
    } catch (error) {
      console.error("Error updating meeting:", error);
      setNotification({
        type: "error",
        message: "Failed to update meeting. Please try again.",
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
        return;
      }
    }
    
    setLoading(true);
    setLoadingMessage("Deleting meeting...");
   
    try {
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
            
            await sendGovernanceMeetingCancellation({
              to: currentUser.uid,
              meetingTitle: deletedMeeting.title,
              meetingDate: formattedDate,
              meetingTime: meetingTime,
              department: deletedMeeting.category || deletedMeeting.department,
              purpose: deletedMeeting.purpose,
              isRecurring: deletedMeeting.isRecurring || false,
              participants: deletedMeeting.participants || []
            });
            
            console.log("✅ Meeting cancellation email sent to organizer and participants");
          } catch (emailError) {
            console.error("Failed to send meeting cancellation email:", emailError);
          }
        }
        
        setNotification({ 
          type: "warning", 
          message: `❌ "${deletedMeeting.title}" has been cancelled` 
        });
        setTimeout(() => setNotification(null), 5000);
        
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
📂 Category: ${deletedMeeting.category || deletedMeeting.department}
📁 Departments: ${deletedMeeting.departments?.join(", ") || "None"}
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
  
  const getMeetingColor = (meeting) => meeting.categoryColor || meeting.departmentColor || "#757575";
  
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
  
  const handleOpenAddModal = (date = null) => {
    let targetDate = date || selectedDate || new Date();
    
    if (date instanceof Date) {
      targetDate = date;
    }
    
    if (targetDate >= today) {
      setFormData(prev => ({
        ...prev,
        startDate: targetDate.toISOString().split('T')[0],
      }));
    }
    setShowAddModal(true);
  };

  // ============================================
  // DETAILS MODAL WITH TABS
  // ============================================
  
  // Save meeting field (highlights, lowlights, risks, headsUp)
  const saveMeetingField = async (meetingId, field, value) => {
    if (!currentUser) return;
    
    try {
      const updatedMeetings = meetings.map(m => {
        if (m.id === meetingId) {
          return { ...m, [field]: value };
        }
        return m;
      });
      
      setMeetings(updatedMeetings);
      
      const calendarRef = doc(db, "governanceCalendar", currentUser.uid);
      await setDoc(calendarRef, {
        meetings: updatedMeetings,
        updatedAt: new Date().toISOString(),
        userId: currentUser.uid,
      }, { merge: true });
      
      // Update the modal data
      setShowDetailsModal(prev => ({ ...prev, [field]: value }));
      setEditingField(null);
      
      setNotification({
        type: "success",
        message: "Field updated successfully!",
      });
      setTimeout(() => setNotification(null), 2000);
      
    } catch (error) {
      console.error("Error saving field:", error);
      setNotification({
        type: "error",
        message: "Failed to update field. Please try again.",
      });
    }
  };

  // Quick add action
  const handleQuickAddAction = async () => {
    if (!showDetailsModal || !quickActionForm.title.trim()) {
      setNotification({
        type: "error",
        message: "Please fill in the action title.",
      });
      return;
    }

    const newAction = {
      id: Date.now().toString(),
      title: quickActionForm.title.trim(),
      description: "",
      assignedTo: quickActionForm.assignedTo || "",
      dueDate: quickActionForm.dueDate || "",
      status: quickActionForm.status || "In Progress",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revisedDate: null,
    };

    try {
      const updatedMeetings = meetings.map(m => {
        if (m.id === showDetailsModal.id) {
          return {
            ...m,
            actions: [...(m.actions || []), newAction],
          };
        }
        return m;
      });

      setMeetings(updatedMeetings);

      const calendarRef = doc(db, "governanceCalendar", currentUser.uid);
      await setDoc(calendarRef, {
        meetings: updatedMeetings,
        updatedAt: new Date().toISOString(),
        userId: currentUser.uid,
      }, { merge: true });

      // Update the modal data
      const updatedModal = { ...showDetailsModal };
      updatedModal.actions = [...(showDetailsModal.actions || []), newAction];
      setShowDetailsModal(updatedModal);

      setQuickActionForm({
        title: "",
        assignedTo: "",
        dueDate: "",
        status: "In Progress",
      });
      setShowQuickAddAction(false);

      setNotification({
        type: "success",
        message: "Action added successfully!",
      });
      setTimeout(() => setNotification(null), 2000);

    } catch (error) {
      console.error("Error adding action:", error);
      setNotification({
        type: "error",
        message: "Failed to add action. Please try again.",
      });
    }
  };

  // Get action stats
  const getActionStats = (meeting) => {
    const actions = meeting?.actions || [];
    const open = actions.filter(a => a.status === "open" || a.status === "Not Done").length;
    const inProgress = actions.filter(a => a.status === "in-progress" || a.status === "In Progress").length;
    const completed = actions.filter(a => a.status === "completed" || a.status === "Done").length;
    const overdue = actions.filter(a => {
      if (a.status === "completed" || a.status === "Done") return false;
      if (!a.dueDate) return false;
      return new Date(a.dueDate) < new Date();
    }).length;
    return { open, inProgress, completed, overdue };
  };

  // Get status display for actions in modal
  const getActionStatusDisplay = (status) => {
    const statusMap = {
      "open": { label: "Open", color: "#E65100", bg: "#FFF3E0" },
      "in-progress": { label: "In Progress", color: "#0D47A1", bg: "#E3F2FD" },
      "completed": { label: "Done", color: "#2E7D32", bg: "#E8F5E9" },
      "Not Done": { label: "Not Done", color: "#C62828", bg: "#FFEBEE" },
      "In Progress": { label: "In Progress", color: "#E65100", bg: "#FFF3E0" },
      "Done": { label: "Done", color: "#2E7D32", bg: "#E8F5E9" },
    };
    return statusMap[status] || statusMap["open"];
  };

  // Format date for display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
    marginTop: "20px",
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
    maxWidth: "700px",
    maxHeight: "90vh",
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
  
  // Details Modal with Tabs Styles
  const detailsModalStyles = {
    backgroundColor: "white",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "800px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  };
  
  const tabContainerStyles = {
    display: "flex",
    borderBottom: "2px solid #e8ddd4",
    padding: "0 24px",
    gap: "4px",
  };
  
  const tabStyles = (isActive) => ({
    padding: "12px 20px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: isActive ? "600" : "500",
    color: isActive ? "#7d5a50" : "#8d6e63",
    borderBottom: isActive ? "3px solid #7d5a50" : "3px solid transparent",
    transition: "all 0.2s ease",
    background: "none",
    border: "none",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  });
  
  const tabContentStyles = {
    padding: "24px",
    maxHeight: "55vh",
    overflowY: "auto",
  };
  
  const editableFieldStyles = {
    backgroundColor: "#f7f3f0",
    padding: "12px 16px",
    borderRadius: "6px",
    marginBottom: "12px",
    border: "1px solid #e8ddd4",
    minHeight: "60px",
    fontSize: "14px",
    color: "#4a352f",
    lineHeight: "1.6",
    width: "100%",
    fontFamily: "inherit",
    resize: "vertical",
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
    flexWrap: "wrap",
  };
  
  const detailsDeleteButtonStyles = {
    padding: "10px 20px",
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
  };
  
  const detailsCloseButtonStyles = {
    padding: "10px 20px",
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
    spin: {
      animation: 'spin 1s linear infinite',
    },
  };

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
        <button onClick={() => handleOpenAddModal(null)} style={addButtonStyles} disabled={isInvestorView}>
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
                {day.meetings.slice(0, 3).map((meeting, idx) => {
                  const colors = getMeetingDepartmentColors(meeting);
                  return colors.slice(0, 3).map((color, colorIdx) => (
                    <div
                      key={`${idx}-${colorIdx}`}
                      style={eventDotStyles(color)}
                      title={`${meeting.title}${meeting.departments?.length > 0 ? ` - ${meeting.departments.join(", ")}` : ''}`}
                    />
                  ));
                })}
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
            {!isInvestorView && selectedDate >= today && (
              <button
                onClick={() => handleOpenAddModal(selectedDate)}
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
            const hasFutureInstance = meeting.instances?.some(instance => {
              return new Date(instance.date) >= new Date();
            });
            
            const isPastMeeting = !hasFutureInstance;
            const instance = meeting.instances?.find(inst => {
              const instDate = new Date(inst.date);
              return instDate.toDateString() === selectedDate.toDateString();
            });
            
            const participantCount = meeting.participants?.length || 0;
            
            return (
              <div
                key={idx}
                style={meetingItemStyles(meeting.categoryColor || meeting.departmentColor, meeting.categoryBg || meeting.departmentBg)}
                onClick={() => setShowDetailsModal(meeting)}
              >
                <div style={meetingTitleStyles}>
                  <span>{meeting.title}</span>
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
                  <span>{meeting.category || meeting.department}</span>
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
                      <span>🔄 {meeting.recurrencePattern === "weekly" ? "Weekly" : 
                                  meeting.recurrencePattern === "monthly" ? "Monthly" : 
                                  "Quarterly"}</span>
                    </>
                  )}
                </div>
                <div style={purposePreviewStyles}>
                  {meeting.purpose.length > 100 ? meeting.purpose.substring(0, 100) + "..." : meeting.purpose}
                </div>
                {meeting.departments && meeting.departments.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                    {meeting.departments.map((dept, deptIdx) => (
                      <span key={deptIdx} style={{
                        fontSize: "9px",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        backgroundColor: getDepartmentBg(dept),
                        color: getDepartmentColor(dept),
                        fontWeight: "500",
                        display: "inline-block",
                        border: `1px solid ${getDepartmentColor(dept)}40`,
                      }}>
                        {dept}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
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
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#5d4037" }}>
              {[...new Set(meetings.flatMap(m => m.departments || []))].length}
            </div>
            <div style={{ fontSize: "12px", color: "#8d6e63" }}>Active Departments</div>
          </div>
        </div>
      </div>
      
      {/* ============================================ */}
      {/* DETAILS MODAL WITH TABS */}
      {/* ============================================ */}
      {showDetailsModal && (
        <div style={modalOverlayStyles} onClick={() => setShowDetailsModal(null)}>
          <div style={detailsModalStyles} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={modalHeaderStyles}>
              <div>
                <h3 style={modalTitleStyles}>{showDetailsModal.title}</h3>
                <div style={{ fontSize: "13px", color: "#8d6e63", marginTop: "4px" }}>
                  {showDetailsModal.category || showDetailsModal.department}
                  {" • "}
                  {showDetailsModal.instances?.[0]?.date
                    ? new Date(showDetailsModal.instances[0].date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "No date"}
                  {" • "}
                  {showDetailsModal.instances?.[0]?.time || "Time TBD"}
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(null)} style={closeButtonStyles}>
                ×
              </button>
            </div>

            {/* Tabs */}
            <div style={tabContainerStyles}>
              <button
                style={tabStyles(activeTab === "overview")}
                onClick={() => setActiveTab("overview")}
              >
                📋 Overview
              </button>
              <button
                style={tabStyles(activeTab === "performance")}
                onClick={() => setActiveTab("performance")}
              >
                📊 Performance
              </button>
              <button
                style={tabStyles(activeTab === "actions")}
                onClick={() => setActiveTab("actions")}
              >
                ✅ Actions
              </button>
            </div>

            {/* Tab Content */}
            <div style={tabContentStyles}>
              {/* ===================== TAB 1: OVERVIEW ===================== */}
              {activeTab === "overview" && (
                <div>
                  <div style={departmentColorStripStyles(showDetailsModal.categoryColor || showDetailsModal.departmentColor)} />
                  
                  {/* Meeting Details */}
                  <div style={detailsSectionStyles}>
                    <div style={detailsLabelStyles}>Meeting Details</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#8d6e63" }}>Category</div>
                        <div style={{ fontSize: "14px", color: "#4a352f", fontWeight: "500" }}>
                          {showDetailsModal.category || showDetailsModal.department}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#8d6e63" }}>Departments</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                          {showDetailsModal.departments && showDetailsModal.departments.length > 0 ? (
                            showDetailsModal.departments.map((dept, idx) => (
                              <span key={idx} style={{
                                fontSize: "11px",
                                padding: "2px 10px",
                                borderRadius: "12px",
                                backgroundColor: getDepartmentBg(dept),
                                color: getDepartmentColor(dept),
                                fontWeight: "500",
                                display: "inline-block",
                                border: `1px solid ${getDepartmentColor(dept)}40`,
                              }}>
                                {dept}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: "#8d6e63", fontSize: "13px" }}>No departments specified</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#8d6e63" }}>Date</div>
                        <div style={{ fontSize: "14px", color: "#4a352f", fontWeight: "500" }}>
                          {showDetailsModal.instances?.[0]?.date
                            ? new Date(showDetailsModal.instances[0].date).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "TBD"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#8d6e63" }}>Time</div>
                        <div style={{ fontSize: "14px", color: "#4a352f", fontWeight: "500" }}>
                          {showDetailsModal.instances?.[0]?.time || "TBD"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#8d6e63" }}>Frequency</div>
                        <div style={{ fontSize: "14px", color: "#4a352f", fontWeight: "500" }}>
                          {showDetailsModal.isRecurring
                            ? showDetailsModal.recurrencePattern === "weekly" ? "Weekly" :
                              showDetailsModal.recurrencePattern === "monthly" ? "Monthly" :
                              showDetailsModal.recurrencePattern === "quarterly" ? "Quarterly" : "Custom"
                            : "One-time"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#8d6e63" }}>Location</div>
                        <div style={{ fontSize: "14px", color: "#4a352f", fontWeight: "500" }}>
                          {showDetailsModal.location || "Virtual"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Purpose */}
                  {showDetailsModal.purpose && (
                    <div style={detailsSectionStyles}>
                      <div style={detailsLabelStyles}>Purpose / Agenda</div>
                      <div style={detailsValueStyles}>{showDetailsModal.purpose}</div>
                    </div>
                  )}

                  {/* Participants */}
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

                  {/* Highlights - Editable */}
                  <div style={detailsSectionStyles}>
                    <div style={detailsLabelStyles}>
                      ⭐ Highlights
                      {editingField !== "highlights" && (
                        <button
                          onClick={() => {
                            setEditingField("highlights");
                            setTempEditValue(showDetailsModal.highlights || "");
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#7d5a50",
                            cursor: "pointer",
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <FaEdit size={12} /> Edit
                        </button>
                      )}
                    </div>
                    {editingField === "highlights" ? (
                      <div>
                        <textarea
                          value={tempEditValue}
                          onChange={(e) => setTempEditValue(e.target.value)}
                          style={editableFieldStyles}
                          placeholder="Enter highlights from this meeting..."
                          rows="3"
                        />
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                          <button
                            onClick={() => saveMeetingField(showDetailsModal.id, "highlights", tempEditValue)}
                            style={{
                              padding: "6px 16px",
                              backgroundColor: "#7d5a50",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "13px",
                            }}
                          >
                            <FaSave size={12} /> Save
                          </button>
                          <button
                            onClick={() => setEditingField(null)}
                            style={{
                              padding: "6px 16px",
                              backgroundColor: "#e6d7c3",
                              color: "#4a352f",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "13px",
                            }}
                          >
                            <FaTimes size={12} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        backgroundColor: "#f7f3f0",
                        padding: "12px 16px",
                        borderRadius: "6px",
                        minHeight: "40px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                        color: showDetailsModal.highlights ? "#4a352f" : "#bdbdbd",
                        fontStyle: showDetailsModal.highlights ? "normal" : "italic",
                      }}>
                        {showDetailsModal.highlights || "No highlights added yet. Click Edit to add."}
                      </div>
                    )}
                  </div>

                  {/* Lowlights - Editable */}
                  <div style={detailsSectionStyles}>
                    <div style={detailsLabelStyles}>
                      ⚠️ Lowlights
                      {editingField !== "lowlights" && (
                        <button
                          onClick={() => {
                            setEditingField("lowlights");
                            setTempEditValue(showDetailsModal.lowlights || "");
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#7d5a50",
                            cursor: "pointer",
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <FaEdit size={12} /> Edit
                        </button>
                      )}
                    </div>
                    {editingField === "lowlights" ? (
                      <div>
                        <textarea
                          value={tempEditValue}
                          onChange={(e) => setTempEditValue(e.target.value)}
                          style={editableFieldStyles}
                          placeholder="Enter lowlights from this meeting..."
                          rows="3"
                        />
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                          <button
                            onClick={() => saveMeetingField(showDetailsModal.id, "lowlights", tempEditValue)}
                            style={{
                              padding: "6px 16px",
                              backgroundColor: "#7d5a50",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "13px",
                            }}
                          >
                            <FaSave size={12} /> Save
                          </button>
                          <button
                            onClick={() => setEditingField(null)}
                            style={{
                              padding: "6px 16px",
                              backgroundColor: "#e6d7c3",
                              color: "#4a352f",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "13px",
                            }}
                          >
                            <FaTimes size={12} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        backgroundColor: "#f7f3f0",
                        padding: "12px 16px",
                        borderRadius: "6px",
                        minHeight: "40px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                        color: showDetailsModal.lowlights ? "#4a352f" : "#bdbdbd",
                        fontStyle: showDetailsModal.lowlights ? "normal" : "italic",
                      }}>
                        {showDetailsModal.lowlights || "No lowlights added yet. Click Edit to add."}
                      </div>
                    )}
                  </div>

                  {/* Risks - Editable */}
                  <div style={detailsSectionStyles}>
                    <div style={detailsLabelStyles}>
                      🚨 Risks
                      {editingField !== "risks" && (
                        <button
                          onClick={() => {
                            setEditingField("risks");
                            setTempEditValue(showDetailsModal.risks || "");
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#7d5a50",
                            cursor: "pointer",
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <FaEdit size={12} /> Edit
                        </button>
                      )}
                    </div>
                    {editingField === "risks" ? (
                      <div>
                        <textarea
                          value={tempEditValue}
                          onChange={(e) => setTempEditValue(e.target.value)}
                          style={editableFieldStyles}
                          placeholder="Enter risks identified from this meeting..."
                          rows="3"
                        />
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                          <button
                            onClick={() => saveMeetingField(showDetailsModal.id, "risks", tempEditValue)}
                            style={{
                              padding: "6px 16px",
                              backgroundColor: "#7d5a50",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "13px",
                            }}
                          >
                            <FaSave size={12} /> Save
                          </button>
                          <button
                            onClick={() => setEditingField(null)}
                            style={{
                              padding: "6px 16px",
                              backgroundColor: "#e6d7c3",
                              color: "#4a352f",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "13px",
                            }}
                          >
                            <FaTimes size={12} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        backgroundColor: "#f7f3f0",
                        padding: "12px 16px",
                        borderRadius: "6px",
                        minHeight: "40px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                        color: showDetailsModal.risks ? "#4a352f" : "#bdbdbd",
                        fontStyle: showDetailsModal.risks ? "normal" : "italic",
                      }}>
                        {showDetailsModal.risks || "No risks added yet. Click Edit to add."}
                      </div>
                    )}
                  </div>

                  {/* Heads-up - Editable */}
                  <div style={detailsSectionStyles}>
                    <div style={detailsLabelStyles}>
                      🔔 Heads-up
                      {editingField !== "headsUp" && (
                        <button
                          onClick={() => {
                            setEditingField("headsUp");
                            setTempEditValue(showDetailsModal.headsUp || "");
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#7d5a50",
                            cursor: "pointer",
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <FaEdit size={12} /> Edit
                        </button>
                      )}
                    </div>
                    {editingField === "headsUp" ? (
                      <div>
                        <textarea
                          value={tempEditValue}
                          onChange={(e) => setTempEditValue(e.target.value)}
                          style={editableFieldStyles}
                          placeholder="Enter important updates or alerts for this meeting..."
                          rows="3"
                        />
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                          <button
                            onClick={() => saveMeetingField(showDetailsModal.id, "headsUp", tempEditValue)}
                            style={{
                              padding: "6px 16px",
                              backgroundColor: "#7d5a50",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "13px",
                            }}
                          >
                            <FaSave size={12} /> Save
                          </button>
                          <button
                            onClick={() => setEditingField(null)}
                            style={{
                              padding: "6px 16px",
                              backgroundColor: "#e6d7c3",
                              color: "#4a352f",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "13px",
                            }}
                          >
                            <FaTimes size={12} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        backgroundColor: "#f7f3f0",
                        padding: "12px 16px",
                        borderRadius: "6px",
                        minHeight: "40px",
                        border: "1px solid #e8ddd4",
                        fontSize: "14px",
                        color: showDetailsModal.headsUp ? "#4a352f" : "#bdbdbd",
                        fontStyle: showDetailsModal.headsUp ? "normal" : "italic",
                      }}>
                        {showDetailsModal.headsUp || "No heads-up added yet. Click Edit to add."}
                      </div>
                    )}
                  </div>

                  {/* Created At */}
                  <div style={detailsSectionStyles}>
                    <div style={detailsLabelStyles}>Created</div>
                    <div style={detailsValueStyles}>
                      {new Date(showDetailsModal.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== TAB 2: PERFORMANCE ===================== */}
              {activeTab === "performance" && (
                <div>
                  <div style={departmentColorStripStyles(showDetailsModal.categoryColor || showDetailsModal.departmentColor)} />
                  
                  {/* Financial Performance */}
                  <div style={detailsSectionStyles}>
                    <div style={detailsLabelStyles}>💰 Financial Performance</div>
                    <div style={{
                      backgroundColor: "#f7f3f0",
                      padding: "20px",
                      borderRadius: "6px",
                      textAlign: "center",
                      border: "1px solid #e8ddd4",
                    }}>
                      <div style={{ fontSize: "14px", color: "#8d6e63" }}>
                        Not connected yet
                      </div>
                      <div style={{ fontSize: "12px", color: "#bdbdbd", marginTop: "4px" }}>
                        Connect Financial Performance module to see data.
                      </div>
                    </div>
                  </div>

                  {/* Operational Performance */}
                  <div style={detailsSectionStyles}>
                    <div style={detailsLabelStyles}>🔧 Operational Performance</div>
                    <div style={{
                      backgroundColor: "#f7f3f0",
                      padding: "20px",
                      borderRadius: "6px",
                      textAlign: "center",
                      border: "1px solid #e8ddd4",
                    }}>
                      <div style={{ fontSize: "14px", color: "#8d6e63" }}>
                        Not connected yet
                      </div>
                      <div style={{ fontSize: "12px", color: "#bdbdbd", marginTop: "4px" }}>
                        Connect Operational Performance module to see data.
                      </div>
                    </div>
                  </div>

                  {/* People Performance */}
                  <div style={detailsSectionStyles}>
                    <div style={detailsLabelStyles}>👥 People Performance</div>
                    <div style={{
                      backgroundColor: "#f7f3f0",
                      padding: "20px",
                      borderRadius: "6px",
                      textAlign: "center",
                      border: "1px solid #e8ddd4",
                    }}>
                      <div style={{ fontSize: "14px", color: "#8d6e63" }}>
                        Not connected yet
                      </div>
                      <div style={{ fontSize: "12px", color: "#bdbdbd", marginTop: "4px" }}>
                        Connect People module to see data.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== TAB 3: ACTIONS ===================== */}
              {activeTab === "actions" && (
                <div>
                  <div style={departmentColorStripStyles(showDetailsModal.categoryColor || showDetailsModal.departmentColor)} />
                  
                  {/* Action Stats */}
                  {(() => {
                    const stats = getActionStats(showDetailsModal);
                    const total = stats.open + stats.inProgress + stats.completed;
                    return (
                      <div style={detailsSectionStyles}>
                        <div style={detailsLabelStyles}>📊 Action Statistics</div>
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                          gap: "12px",
                        }}>
                          <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#FFF3E0", borderRadius: "6px" }}>
                            <div style={{ fontSize: "20px", fontWeight: "700", color: "#E65100" }}>{stats.open}</div>
                            <div style={{ fontSize: "11px", color: "#8d6e63" }}>Open</div>
                          </div>
                          <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#E3F2FD", borderRadius: "6px" }}>
                            <div style={{ fontSize: "20px", fontWeight: "700", color: "#0D47A1" }}>{stats.inProgress}</div>
                            <div style={{ fontSize: "11px", color: "#8d6e63" }}>In Progress</div>
                          </div>
                          <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#E8F5E9", borderRadius: "6px" }}>
                            <div style={{ fontSize: "20px", fontWeight: "700", color: "#2E7D32" }}>{stats.completed}</div>
                            <div style={{ fontSize: "11px", color: "#8d6e63" }}>Done</div>
                          </div>
                          <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#FFEBEE", borderRadius: "6px" }}>
                            <div style={{ fontSize: "20px", fontWeight: "700", color: "#C62828" }}>{stats.overdue}</div>
                            <div style={{ fontSize: "11px", color: "#8d6e63" }}>Overdue</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quick Add Action */}
                  <div style={detailsSectionStyles}>
                    <div style={detailsLabelStyles}>
                      ➕ Add Action
                      {!showQuickAddAction && (
                        <button
                          onClick={() => setShowQuickAddAction(true)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#7d5a50",
                            cursor: "pointer",
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <FaPlus size={12} /> Quick Add
                        </button>
                      )}
                    </div>
                    {showQuickAddAction ? (
                      <div style={{
                        backgroundColor: "#f7f3f0",
                        padding: "16px",
                        borderRadius: "6px",
                        border: "1px solid #e8ddd4",
                      }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div style={{ gridColumn: "1 / -1" }}>
                            <input
                              type="text"
                              placeholder="Action Title *"
                              value={quickActionForm.title}
                              onChange={(e) => setQuickActionForm({ ...quickActionForm, title: e.target.value })}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "2px solid #e8ddd4",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontFamily: "inherit",
                                boxSizing: "border-box",
                              }}
                            />
                          </div>
                          <div>
                            <select
                              value={quickActionForm.assignedTo}
                              onChange={(e) => setQuickActionForm({ ...quickActionForm, assignedTo: e.target.value })}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "2px solid #e8ddd4",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontFamily: "inherit",
                                backgroundColor: "white",
                              }}
                            >
                              <option value="">Unassigned</option>
                              {(showDetailsModal.participants || []).map((p, idx) => {
                                const name = typeof p === "string" ? p : p.name || p.email || "Participant";
                                return (
                                  <option key={idx} value={name}>
                                    {name}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <div>
                            <input
                              type="date"
                              value={quickActionForm.dueDate}
                              onChange={(e) => setQuickActionForm({ ...quickActionForm, dueDate: e.target.value })}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "2px solid #e8ddd4",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontFamily: "inherit",
                                boxSizing: "border-box",
                              }}
                            />
                          </div>
                          <div>
                            <select
                              value={quickActionForm.status}
                              onChange={(e) => setQuickActionForm({ ...quickActionForm, status: e.target.value })}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "2px solid #e8ddd4",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontFamily: "inherit",
                                backgroundColor: "white",
                              }}
                            >
                              <option value="In Progress">In Progress</option>
                              <option value="Not Done">Not Done</option>
                              <option value="Done">Done</option>
                            </select>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                          <button
                            onClick={handleQuickAddAction}
                            style={{
                              padding: "6px 16px",
                              backgroundColor: "#7d5a50",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "13px",
                            }}
                          >
                            <FaPlus size={12} /> Add Action
                          </button>
                          <button
                            onClick={() => {
                              setShowQuickAddAction(false);
                              setQuickActionForm({
                                title: "",
                                assignedTo: "",
                                dueDate: "",
                                status: "In Progress",
                              });
                            }}
                            style={{
                              padding: "6px 16px",
                              backgroundColor: "#e6d7c3",
                              color: "#4a352f",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "13px",
                            }}
                          >
                            <FaTimes size={12} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        backgroundColor: "#f7f3f0",
                        padding: "12px 16px",
                        borderRadius: "6px",
                        border: "1px solid #e8ddd4",
                        fontSize: "13px",
                        color: "#8d6e63",
                        fontStyle: "italic",
                        textAlign: "center",
                      }}>
                        Click "Quick Add" to add a new action
                      </div>
                    )}
                  </div>

                  {/* Action List */}
                  <div style={detailsSectionStyles}>
                    <div style={detailsLabelStyles}>📋 Actions</div>
                    {showDetailsModal.actions && showDetailsModal.actions.length > 0 ? (
                      <div>
                        {showDetailsModal.actions.slice(0, 10).map((action) => {
                          const statusInfo = getActionStatusDisplay(action.status);
                          const isOverdue = action.dueDate && action.status !== "Done" && action.status !== "completed" && new Date(action.dueDate) < new Date();
                          return (
                            <div
                              key={action.id}
                              style={{
                                padding: "10px 12px",
                                backgroundColor: "#f7f3f0",
                                borderRadius: "6px",
                                marginBottom: "6px",
                                borderLeft: `4px solid ${isOverdue ? "#f44336" : statusInfo.color}`,
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "13px", fontWeight: "500", color: "#4a352f" }}>
                                  {action.title}
                                  {isOverdue && (
                                    <span style={{ color: "#f44336", fontSize: "11px", fontWeight: "600", marginLeft: "8px" }}>
                                      ⚠️ Overdue
                                    </span>
                                  )}
                                </span>
                                <span
                                  style={{
                                    fontSize: "11px",
                                    padding: "2px 8px",
                                    borderRadius: "10px",
                                    backgroundColor: statusInfo.bg,
                                    color: statusInfo.color,
                                  }}
                                >
                                  {statusInfo.label}
                                </span>
                              </div>
                              {action.assignedTo && (
                                <div style={{ fontSize: "11px", color: "#8d6e63", marginTop: "2px" }}>
                                  👤 {action.assignedTo} {action.dueDate && `• 📅 ${formatDateDisplay(action.dueDate)}`}
                                </div>
                              )}
                              {action.revisedDate && (
                                <div style={{ fontSize: "10px", color: "#bdbdbd", marginTop: "2px" }}>
                                  Revised: {formatDateDisplay(action.revisedDate)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {showDetailsModal.actions.length > 10 && (
                          <div style={{ fontSize: "12px", color: "#8d6e63", marginTop: "4px", textAlign: "center" }}>
                            +{showDetailsModal.actions.length - 10} more actions
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        fontSize: "13px",
                        color: "#8d6e63",
                        fontStyle: "italic",
                        textAlign: "center",
                        padding: "20px",
                        backgroundColor: "#f7f3f0",
                        borderRadius: "6px",
                        border: "1px solid #e8ddd4",
                      }}>
                        No actions created yet.
                      </div>
                    )}
                  </div>

                  {/* View All Actions Button */}
                  <div style={{ marginTop: "16px" }}>
                    <button
                      onClick={() => {
                        setShowDetailsModal(null);
                        window.location.href = `/raps-actions?meeting=${showDetailsModal.id}`;
                      }}
                      style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor: "#7d5a50",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      📋 View All Actions in RAPS
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div style={modalFooterStyles}>
              {(() => {
                const isPastMeeting = showDetailsModal.instances?.[0]?.date 
                  ? new Date(showDetailsModal.instances[0].date) < new Date()
                  : false;
                return (
                  <>
                    {!isPastMeeting && !isInvestorView && (
                      <>
                        <button
                          onClick={() => {
                            setShowDetailsModal(null);
                            handleEditMeeting(showDetailsModal);
                          }}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#2196F3",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "500",
                            fontSize: "13px",
                          }}
                        >
                          ✏️ Edit Meeting
                        </button>
                        <button
                          onClick={() => {
                            setShowDetailsModal(null);
                            setShowDeleteConfirm(showDetailsModal.id);
                          }}
                          style={detailsDeleteButtonStyles}
                        >
                          Delete Meeting
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setShowDetailsModal(null);
                        window.location.href = `/raps-overview?meeting=${showDetailsModal.id}`;
                      }}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#e6d7c3",
                        color: "#4a352f",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "500",
                        fontSize: "13px",
                      }}
                    >
                      📋 View Full Overview
                    </button>
                    <button onClick={() => setShowDetailsModal(null)} style={detailsCloseButtonStyles}>
                      Close
                    </button>
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
                      borderLeft: `4px solid ${meeting.categoryColor || meeting.departmentColor || "#757575"}`,
                      marginBottom: index < conflictingMeetingData.length - 1 ? "8px" : "0",
                    }}
                  >
                    <div><strong>{meeting.title}</strong></div>
                    <div style={{ fontSize: "13px", color: "#6d5a4f" }}>
                      {meeting.category || meeting.department} • {
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
                  borderLeft: `4px solid ${pendingMeetingData?.categoryColor || "#757575"}`,
                }}>
                  <div><strong>{pendingMeetingData?.title}</strong></div>
                  <div style={{ fontSize: "13px", color: "#6d5a4f" }}>
                    {pendingMeetingData?.category || pendingMeetingData?.department} • {pendingMeetingData?.time}
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

      {/* Edit Meeting Modal */}
      {showEditModal && editingMeeting && (
        <div style={modalOverlayStyles} onClick={() => setShowEditModal(false)}>
          <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyles}>
              <h3 style={modalTitleStyles}>✏️ Edit Meeting</h3>
              <button onClick={() => setShowEditModal(false)} style={closeButtonStyles}>×</button>
            </div>
            <div style={modalBodyStyles}>
              {/* Meeting Title */}
              <div style={formGroupStyles}>
                <label style={labelStyles}>Meeting Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Q4 Board Meeting, Strategy Review"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  style={inputStyles(false)}
                />
              </div>
              
              {/* Category - Single Select */}
              <div style={formGroupStyles}>
                <label style={labelStyles}>Category *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "8px", border: "2px solid #e8ddd4", borderRadius: "6px", minHeight: "50px", backgroundColor: "white" }}>
                  {categoryOptions.map((cat) => (
                    <div
                      key={cat.name}
                      onClick={() => setEditFormData({ ...editFormData, category: cat.name })}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 14px",
                        cursor: "pointer",
                        backgroundColor: editFormData.category === cat.name ? cat.bg : "#f7f3f0",
                        border: editFormData.category === cat.name ? `2px solid ${cat.color}` : "2px solid transparent",
                        borderRadius: "20px",
                        transition: "all 0.2s ease",
                        fontWeight: editFormData.category === cat.name ? "600" : "400",
                        color: editFormData.category === cat.name ? cat.color : "#4a352f",
                      }}
                    >
                      <div style={{ width: "16px", height: "16px", borderRadius: "4px", backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Departments - Multi-Select */}
              <div style={formGroupStyles}>
                <label style={labelStyles}>Departments</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "8px", border: "2px solid #e8ddd4", borderRadius: "6px", minHeight: "50px", backgroundColor: "white" }}>
                  {allDepartments.map((dept) => {
                    const isSelected = editFormData.departments?.includes(dept.name) || false;
                    return (
                      <div
                        key={dept.name}
                        onClick={() => toggleEditDepartment(dept.name)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          cursor: "pointer",
                          backgroundColor: isSelected ? dept.bg : "#f7f3f0",
                          border: isSelected ? `2px solid ${dept.color}` : "2px solid transparent",
                          transition: "all 0.2s ease",
                          fontSize: "13px",
                          fontWeight: isSelected ? "600" : "400",
                          color: isSelected ? dept.color : "#4a352f",
                        }}
                      >
                        <div style={{ width: "14px", height: "14px", borderRadius: "3px", backgroundColor: dept.color }} />
                        <span>{dept.name}</span>
                        {isSelected && <span style={{ marginLeft: "4px", fontSize: "12px" }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Purpose */}
              <div style={formGroupStyles}>
                <label style={labelStyles}>Purpose of Meeting *</label>
                <textarea
                  rows="3"
                  placeholder="What is the goal of this meeting?"
                  value={editFormData.purpose}
                  onChange={(e) => setEditFormData({ ...editFormData, purpose: e.target.value })}
                  style={textareaStyles(false)}
                />
              </div>
              
              {/* Participants */}
              <div style={formGroupStyles}>
                <label style={labelStyles}>Participants</label>
                {editFormData.participants.map((participant, index) => (
                  <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={participant.name || ""}
                      onChange={(e) => updateEditParticipant(index, "name", e.target.value)}
                      style={{ flex: 1, ...inputStyles(false) }}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={participant.email || ""}
                      onChange={(e) => updateEditParticipant(index, "email", e.target.value)}
                      style={{ flex: 1, ...inputStyles(false) }}
                    />
                    <button
                      type="button"
                      onClick={() => removeEditParticipant(index)}
                      style={{ padding: "8px 12px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEditParticipant}
                  style={{ padding: "8px 16px", backgroundColor: "#e6d7c3", color: "#4a352f", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px", marginTop: "8px" }}
                >
                  + Add Participant
                </button>
              </div>
              
              {/* Date & Time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div style={formGroupStyles}>
                  <label style={labelStyles}>Date *</label>
                  <input
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    style={inputStyles(false)}
                  />
                </div>
                <div style={formGroupStyles}>
                  <label style={labelStyles}>Time *</label>
                  <input
                    type="time"
                    value={editFormData.time}
                    onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                    style={inputStyles(false)}
                  />
                </div>
              </div>
              
              {/* Repeat Type */}
              <div style={formGroupStyles}>
                <label style={labelStyles}>Repeat Frequency</label>
                <select
                  value={editFormData.repeatType}
                  onChange={(e) => setEditFormData({ ...editFormData, repeatType: e.target.value })}
                  style={selectStyles(false)}
                >
                  <option value="none">One-time meeting</option>
                  <option value="weekly">Weekly (every 7 days)</option>
                  <option value="monthly">Monthly (same date each month)</option>
                  <option value="quarterly">Quarterly (every 3 months)</option>
                </select>
              </div>

              <div style={modalFooterStyles}>
                <button onClick={() => setShowEditModal(false)} style={cancelButtonStyles}>
                  Cancel
                </button>
                <button onClick={saveEditedMeeting} disabled={loading} style={submitButtonStyles}>
                  {loading ? "Saving..." : "Save Changes"}
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