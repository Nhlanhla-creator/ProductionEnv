
import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { useLocation } from "react-router-dom";


const RapsActions = () => {
  const location = useLocation();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [editingAction, setEditingAction] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [navigating, setNavigating] = useState(false);
  const [expandedMeeting, setExpandedMeeting] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
    priority: "medium",
    status: "open",
  });

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

// Load meetings from Firestore
useEffect(() => {
  if (!currentUser) return;

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const calendarRef = doc(db, "governanceCalendar", currentUser.uid);
      const calendarSnap = await getDoc(calendarRef);

      if (calendarSnap.exists()) {
        const data = calendarSnap.data();
        const meetingsData = data.meetings || [];
        setMeetings(meetingsData);

        // ✅ Check for meeting query param
        const params = new URLSearchParams(location.search);
        const meetingId = params.get("meeting");
        
        if (meetingId) {
          console.log("📋 Filtering to meeting:", meetingId);
          const meeting = meetingsData.find(m => m.id === meetingId);
          if (meeting) {
            // Auto-expand the meeting
            setExpandedMeeting(meetingId);
            
            // Add a small delay to ensure DOM is ready
            setTimeout(() => {
              const element = document.getElementById(`meeting-${meetingId}`);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                // Highlight the card briefly
                element.style.transition = "box-shadow 0.3s ease";
                element.style.boxShadow = "0 0 0 3px #7d5a50";
                setTimeout(() => {
                  element.style.boxShadow = "none";
                }, 2000);
              }
            }, 500);
          }
        }
      } else {
        setMeetings([]);
      }
    } catch (error) {
      console.error("Error loading meetings:", error);
      setNotification({
        type: "error",
        message: "Failed to load meetings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  loadMeetings();
}, [currentUser, location.search]);

  
  // Calculate summary stats
  const getSummaryStats = () => {
    let open = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;
    const today = new Date();

    meetings.forEach((meeting) => {
      (meeting.actions || []).forEach((action) => {
        if (action.status === "open") open++;
        else if (action.status === "in-progress") inProgress++;
        else if (action.status === "completed") completed++;

        if (action.dueDate && (action.status === "open" || action.status === "in-progress")) {
          const dueDate = new Date(action.dueDate);
          if (dueDate < today) {
            overdue++;
          }
        }
      });
    });

    return { open, inProgress, completed, overdue };
  };

  const stats = getSummaryStats();

  // Get unique departments
  const getDepartments = () => {
    const depts = new Set();
    meetings.forEach((meeting) => {
      if (meeting.department) {
        depts.add(meeting.department);
      }
    });
    return ["all", ...Array.from(depts)];
  };

  // Filter meetings
  const getFilteredMeetings = () => {
    let filtered = meetings;

    if (searchTerm.trim()) {
      filtered = filtered.filter((meeting) =>
        meeting.title?.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(
        (meeting) => meeting.department === departmentFilter
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.map((meeting) => ({
        ...meeting,
        actions: (meeting.actions || []).filter((action) => {
          if (statusFilter === "overdue") {
            const dueDate = new Date(action.dueDate);
            const today = new Date();
            return (
              (action.status === "open" || action.status === "in-progress") &&
              dueDate < today
            );
          }
          return action.status === statusFilter;
        }),
      }));
      filtered = filtered.filter((meeting) => (meeting.actions || []).length > 0);
    }

    return filtered;
  };

  const filteredMeetings = getFilteredMeetings();

  // Save meetings
  const saveMeetings = async (updatedMeetings) => {
    try {
      const calendarRef = doc(db, "governanceCalendar", currentUser.uid);
      await setDoc(
        calendarRef,
        {
          meetings: updatedMeetings,
          updatedAt: new Date().toISOString(),
          userId: currentUser.uid,
        },
        { merge: true }
      );
      setMeetings(updatedMeetings);
      return true;
    } catch (error) {
      console.error("Error saving meetings:", error);
      setNotification({
        type: "error",
        message: "Failed to save changes. Please try again.",
      });
      return false;
    }
  };


  // Navigation handler
  const handleViewMeeting = (meetingId) => {
    setNavigating(true);
    window.location.href = `/governance-calendar?meeting=${meetingId}`;
  };

  // Get due date color
  const getDueDateColor = (dueDate) => {
    if (!dueDate) return "#8d6e63";
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "#f44336";
    if (diffDays === 0 || diffDays <= 3) return "#ff9800";
    if (diffDays <= 7) return "#ffc107";
    return "#4caf50";
  };

  const getDueDateLabel = (dueDate) => {
    if (!dueDate) return "";
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  };

  // Add action
  const handleAddAction = async () => {
    if (!selectedMeeting || !formData.title.trim()) {
      setNotification({
        type: "error",
        message: "Please fill in all required fields.",
      });
      return;
    }

    const newAction = {
      id: Date.now().toString(),
      title: formData.title.trim(),
      description: formData.description.trim() || "",
      assignedTo: formData.assignedTo || "",
      dueDate: formData.dueDate || "",
      priority: formData.priority || "medium",
      status: formData.status || "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedMeetings = meetings.map((meeting) => {
      if (meeting.id === selectedMeeting.id) {
        return {
          ...meeting,
          actions: [...(meeting.actions || []), newAction],
        };
      }
      return meeting;
    });

    const success = await saveMeetings(updatedMeetings);
    if (success) {
      setNotification({ type: "success", message: "Action added successfully!" });
      setShowAddModal(false);
      setSelectedMeeting(null);
      setFormData({
        title: "",
        description: "",
        assignedTo: "",
        dueDate: "",
        priority: "medium",
        status: "open",
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Edit action
  const handleEditAction = async () => {
    if (!editingAction || !formData.title.trim()) {
      setNotification({
        type: "error",
        message: "Please fill in all required fields.",
      });
      return;
    }

    const updatedMeetings = meetings.map((meeting) => {
      if (meeting.id === editingAction.meetingId) {
        return {
          ...meeting,
          actions: (meeting.actions || []).map((action) => {
            if (action.id === editingAction.action.id) {
              return {
                ...action,
                title: formData.title.trim(),
                description: formData.description.trim() || "",
                assignedTo: formData.assignedTo || "",
                dueDate: formData.dueDate || "",
                priority: formData.priority || "medium",
                status: formData.status || "open",
                updatedAt: new Date().toISOString(),
              };
            }
            return action;
          }),
        };
      }
      return meeting;
    });

    const success = await saveMeetings(updatedMeetings);
    if (success) {
      setNotification({ type: "success", message: "Action updated successfully!" });
      setShowEditModal(false);
      setEditingAction(null);
      setFormData({
        title: "",
        description: "",
        assignedTo: "",
        dueDate: "",
        priority: "medium",
        status: "open",
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Delete action
  const handleDeleteAction = async (meetingId, actionId) => {
    if (!window.confirm("Are you sure you want to delete this action?")) return;

    const updatedMeetings = meetings.map((meeting) => {
      if (meeting.id === meetingId) {
        return {
          ...meeting,
          actions: (meeting.actions || []).filter(
            (action) => action.id !== actionId
          ),
        };
      }
      return meeting;
    });

    const success = await saveMeetings(updatedMeetings);
    if (success) {
      setNotification({ type: "warning", message: "Action deleted successfully." });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Toggle action status
  const toggleActionStatus = async (meetingId, action) => {
    const newStatus = action.status === "completed" ? "open" : "completed";

    const updatedMeetings = meetings.map((meeting) => {
      if (meeting.id === meetingId) {
        return {
          ...meeting,
          actions: (meeting.actions || []).map((a) => {
            if (a.id === action.id) {
              return {
                ...a,
                status: newStatus,
                updatedAt: new Date().toISOString(),
              };
            }
            return a;
          }),
        };
      }
      return meeting;
    });

    await saveMeetings(updatedMeetings);
  };

  // Open add modal
  const openAddModal = (meeting) => {
    setSelectedMeeting(meeting);
    setFormData({
      title: "",
      description: "",
      assignedTo: "",
      dueDate: "",
      priority: "medium",
      status: "open",
    });
    setShowAddModal(true);
  };

  // Open edit modal
  const openEditModal = (meetingId, action) => {
    setEditingAction({ meetingId, action });
    setFormData({
      title: action.title || "",
      description: action.description || "",
      assignedTo: action.assignedTo || "",
      dueDate: action.dueDate || "",
      priority: action.priority || "medium",
      status: action.status || "open",
    });
    setShowEditModal(true);
  };

  // Toggle meeting expansion (only one at a time)
  const toggleMeeting = (meetingId) => {
    setExpandedMeeting(expandedMeeting === meetingId ? null : meetingId);
  };

  // Status badge
  const getStatusBadge = (status) => {
    const styles = {
      open: { bg: "#FFF3E0", color: "#E65100", label: "Open" },
      "in-progress": { bg: "#E3F2FD", color: "#0D47A1", label: "In Progress" },
      completed: { bg: "#E8F5E9", color: "#2E7D32", label: "Completed" },
    };
    const s = styles[status] || styles.open;
    return (
      <span
        style={{
          backgroundColor: s.bg,
          color: s.color,
          padding: "4px 10px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "600",
          display: "inline-block",
        }}
      >
        {s.label}
      </span>
    );
  };

  // Priority badge
  const getPriorityBadge = (priority) => {
    const styles = {
      low: { bg: "#F5F5F5", color: "#757575", label: "Low" },
      medium: { bg: "#FFF3E0", color: "#E65100", label: "Medium" },
      high: { bg: "#FFEBEE", color: "#C62828", label: "High" },
      critical: { bg: "#FFEBEE", color: "#B71C1C", label: "Critical" },
    };
    const s = styles[priority] || styles.medium;
    return (
      <span
        style={{
          backgroundColor: s.bg,
          color: s.color,
          padding: "2px 8px",
          borderRadius: "10px",
          fontSize: "10px",
          fontWeight: "600",
          display: "inline-block",
        }}
      >
        {s.label}
      </span>
    );
  };

  // Check if action is overdue
  const isOverdue = (action) => {
    if (!action.dueDate) return false;
    if (action.status === "completed") return false;
    const today = new Date();
    const dueDate = new Date(action.dueDate);
    return dueDate < today;
  };

  // Styles
  const containerStyles = {
    padding: "40px",
    maxWidth: "1200px",
    margin: "0 auto",
    marginTop: "0px",
    backgroundColor: "#fdfcfb",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  };

  const headerStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    paddingBottom: "20px",
    borderBottom: "2px solid #e8ddd4",
    flexWrap: "wrap",
    gap: "16px",
  };

  const titleStyles = {
    color: "#5d4037",
    fontSize: "28px",
    fontWeight: "700",
    margin: 0,
  };

  const subtitleStyles = {
    color: "#8d6e63",
    fontSize: "15px",
    margin: "4px 0 0 0",
  };

  const summaryContainerStyles = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "24px",
  };

  const summaryCardStyles = (bg, borderColor) => ({
    backgroundColor: bg || "#f7f3f0",
    padding: "16px",
    borderRadius: "8px",
    borderLeft: `4px solid ${borderColor || "#8d6e63"}`,
    textAlign: "center",
  });

  const summaryNumberStyles = {
    fontSize: "28px",
    fontWeight: "700",
    color: "#5d4037",
  };

  const summaryLabelStyles = {
    fontSize: "12px",
    color: "#8d6e63",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const filterContainerStyles = {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "24px",
    padding: "16px",
    backgroundColor: "#f7f3f0",
    borderRadius: "8px",
    border: "1px solid #e8ddd4",
    alignItems: "center",
  };

  const searchContainerStyles = {
    display: "flex",
    alignItems: "center",
    flex: 1,
    minWidth: "200px",
    backgroundColor: "white",
    borderRadius: "6px",
    border: "2px solid #e8ddd4",
    padding: "4px 12px",
  };

  const searchInputStyles = {
    flex: 1,
    border: "none",
    padding: "8px 4px",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    backgroundColor: "transparent",
  };

  const filterSelectStyles = {
    padding: "8px 12px",
    border: "2px solid #e8ddd4",
    borderRadius: "6px",
    fontSize: "13px",
    backgroundColor: "white",
    cursor: "pointer",
    fontFamily: "inherit",
    minWidth: "120px",
  };

  // ✅ Meeting Card Styles (Accordion)
  const meetingCardStyles = {
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #e8ddd4",
    marginBottom: "12px",
    overflow: "hidden",
    transition: "all 0.2s ease",
  };

  // ✅ Meeting Header Styles (clickable accordion)
  const meetingHeaderStyles = (hasOverdue) => ({
    padding: "14px 20px",
    backgroundColor: hasOverdue ? "#FFF8F0" : "#f7f3f0",
    borderBottom: "1px solid #e8ddd4",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    transition: "background 0.2s",
    borderLeft: hasOverdue ? `4px solid #f44336` : "4px solid transparent",
  });

  const meetingTitleStyles = {
    fontSize: "16px",
    fontWeight: "600",
    color: "#5d4037",
  };

  const meetingMetaStyles = {
    fontSize: "13px",
    color: "#8d6e63",
  };

  const meetingPurposeStyles = {
    fontSize: "13px",
    color: "#6d5a4f",
    marginTop: "2px",
    fontStyle: "italic",
  };

  // ✅ Meeting Summary Stats
  const meetingSummaryStyles = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "12px",
    flexWrap: "wrap",
  };

  // ✅ Expanded content
  const expandedContentStyles = {
    padding: "0 20px 20px",
  };

  const actionItemStyles = {
    padding: "10px 0",
    borderBottom: "1px solid #f5f0e8",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
  };

  const actionContentStyles = {
    flex: 1,
    minWidth: "200px",
  };

  const actionTitleStyles = {
    fontSize: "14px",
    fontWeight: "500",
    color: "#4a352f",
  };

  const actionDescriptionStyles = {
    fontSize: "13px",
    color: "#8d6e63",
    marginTop: "2px",
  };

  const actionMetaStyles = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "4px",
  };

  const actionButtonsStyles = {
    display: "flex",
    gap: "6px",
    alignItems: "center",
  };

  const iconButtonStyles = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px 6px",
    borderRadius: "4px",
    color: "#8d6e63",
    fontSize: "14px",
    transition: "all 0.2s",
  };

  const addButtonStyles = {
    padding: "8px 16px",
    backgroundColor: "#7d5a50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  };

  const emptyStateStyles = {
    textAlign: "center",
    padding: "60px 20px",
    color: "#8d6e63",
  };

  const emptyIconStyles = {
    fontSize: "48px",
    marginBottom: "16px",
  };

  // Modal styles
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
    maxWidth: "500px",
    maxHeight: "85vh",
    overflow: "auto",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    padding: "24px",
  };

  const modalHeaderStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
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

  const formGroupStyles = {
    marginBottom: "16px",
  };

  const labelStyles = {
    display: "block",
    marginBottom: "6px",
    fontWeight: "500",
    color: "#4a352f",
    fontSize: "13px",
  };

  const inputStyles = (hasError) => ({
    width: "100%",
    padding: "10px 12px",
    border: hasError ? "2px solid #f44336" : "2px solid #e8ddd4",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    boxSizing: "border-box",
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
    minHeight: "60px",
  });

  const selectStyles = {
    width: "100%",
    padding: "10px 12px",
    border: "2px solid #e8ddd4",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    backgroundColor: "white",
    cursor: "pointer",
  };

  const modalButtonContainerStyles = {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
  };

  const cancelButtonStyles = {
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

  const submitButtonStyles = {
    flex: 1,
    padding: "10px",
    backgroundColor: "#7d5a50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
  };

  const navigationOverlayStyles = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backdropFilter: "blur(4px)",
  };

  const navigationModalStyles = {
    backgroundColor: "white",
    padding: "32px 40px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    textAlign: "center",
  };

  const spinnerStyles = {
    width: "48px",
    height: "48px",
    border: "4px solid #f3e5f5",
    borderTop: "4px solid #7d5a50",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 16px",
  };

  const notificationBannerStyles = (type) => {
    const colors = {
      success: { bg: "#E8F5E9", border: "#4CAF50" },
      error: { bg: "#FFEBEE", border: "#F44336" },
      warning: { bg: "#FFF3E0", border: "#FF9800" },
      info: { bg: "#E3F2FD", border: "#2196F3" },
    };
    const color = colors[type] || colors.info;
    return {
      padding: "12px 16px",
      borderRadius: "8px",
      backgroundColor: color.bg,
      borderLeft: `4px solid ${color.border}`,
      marginBottom: "16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    };
  };

  const SpinKeyframes = () => (
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  );

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: "center", padding: "40px", color: "#8d6e63" }}>
          Loading actions...
        </div>
      </div>
    );
  }

  return (
    <>
      <SpinKeyframes />

      {navigating && (
        <div style={navigationOverlayStyles}>
          <div style={navigationModalStyles}>
            <div style={spinnerStyles} />
            <p style={{ color: "#4a352f", fontSize: "16px", fontWeight: "500", margin: 0 }}>
              Loading meeting...
            </p>
          </div>
        </div>
      )}

      <div style={containerStyles}>
        {notification && (
          <div style={notificationBannerStyles(notification.type)}>
            <span style={{ color: "#4a352f", fontSize: "14px" }}>
              {notification.message}
            </span>
            <button
              onClick={() => setNotification(null)}
              style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#8d6e63" }}
            >
              ×
            </button>
          </div>
        )}

        {/* Header */}
        <div style={headerStyles}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1 style={titleStyles}>RAP Action Centre</h1>
            </div>
            <p style={subtitleStyles}>Manage all Governance Meeting Actions</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={summaryContainerStyles}>
          <div style={summaryCardStyles("#FFF3E0", "#FF9800")}>
            <div style={summaryNumberStyles}>{stats.open}</div>
            <div style={summaryLabelStyles}>Open</div>
          </div>
          <div style={summaryCardStyles("#E3F2FD", "#2196F3")}>
            <div style={summaryNumberStyles}>{stats.inProgress}</div>
            <div style={summaryLabelStyles}>In Progress</div>
          </div>
          <div style={summaryCardStyles("#E8F5E9", "#4CAF50")}>
            <div style={summaryNumberStyles}>{stats.completed}</div>
            <div style={summaryLabelStyles}>Completed</div>
          </div>
          <div style={summaryCardStyles("#FFEBEE", "#F44336")}>
            <div style={summaryNumberStyles}>{stats.overdue}</div>
            <div style={summaryLabelStyles}>Overdue</div>
          </div>
        </div>

        {/* Filters */}
        <div style={filterContainerStyles}>
          <div style={searchContainerStyles}>
            <FaSearch size={16} color="#8d6e63" />
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={searchInputStyles}
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={filterSelectStyles}
          >
            {getDepartments().map((dept) => (
              <option key={dept} value={dept}>
                {dept === "all" ? "All Departments" : dept}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={filterSelectStyles}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {/* Meeting Cards - Accordion */}
        {filteredMeetings.length === 0 ? (
          <div style={emptyStateStyles}>
            <div style={emptyIconStyles}>📋</div>
            <h3 style={{ color: "#5d4037" }}>No actions found</h3>
            <p style={{ color: "#8d6e63", marginBottom: "16px" }}>
              {meetings.length === 0
                ? "Create your first meeting to start adding actions."
                : "No actions match your current filters."}
            </p>
            {meetings.length > 0 && (
              <button
                onClick={() => {
                  const firstMeeting = meetings[0];
                  if (firstMeeting) {
                    setExpandedMeeting(firstMeeting.id);
                    openAddModal(firstMeeting);
                  }
                }}
                style={addButtonStyles}
              >
                <FaPlus size={14} /> Create First Action
              </button>
            )}
          </div>
        ) : (
          filteredMeetings.map((meeting) => {
            const actions = meeting.actions || [];
            const hasActions = actions.length > 0;
            const totalActions = actions.length;
            const completedActions = actions.filter(a => a.status === "completed").length;
            const openActions = actions.filter(a => a.status === "open" || a.status === "in-progress").length;
            const overdueActions = actions.filter(a => isOverdue(a)).length;
            const isExpanded = expandedMeeting === meeting.id;
            const hasOverdue = overdueActions > 0;

            // Sort actions by priority
            const sortedActions = [...actions].sort((a, b) => {
              const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
              return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
            });

            return (
             <div key={meeting.id} style={meetingCardStyles}>
                <div
                  style={meetingHeaderStyles(hasOverdue)}
                  onClick={() => toggleMeeting(meeting.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "16px", color: "#8d6e63" }}>
                        {isExpanded ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}
                      </span>
                      {/* ✅ Meeting Title - Clickable */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewMeeting(meeting.id);
                        }}
                        style={{
                          color: "#5d4037",
                          textDecoration: "none",
                          cursor: "pointer",
                          background: "none",
                          border: "none",
                          fontSize: "16px",
                          fontWeight: "600",
                          padding: 0,
                        }}
                        onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                        onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                      >
                        {meeting.title}
                      </button>
                    </div>
                    <div style={meetingMetaStyles}>
                      {meeting.department} • {meeting.instances?.[0]?.date
                        ? new Date(meeting.instances[0].date).toLocaleDateString()
                        : "No date"}
                    </div>
                    {meeting.purpose && (
                      <div style={meetingPurposeStyles}>
                        "{meeting.purpose}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    {/* ✅ View Meeting Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewMeeting(meeting.id);
                      }}
                      style={{
                        padding: "4px 12px",
                        backgroundColor: "#e6d7c3",
                        color: "#4a352f",
                        borderRadius: "4px",
                        fontSize: "12px",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      View Meeting
                    </button>

                    <div style={meetingSummaryStyles}>
                      {hasOverdue && (
                        <span style={{ color: "#f44336", fontWeight: "600", fontSize: "13px" }}>
                          ⚠️ {overdueActions} Overdue
                        </span>
                      )}
                      {openActions > 0 && (
                        <span style={{ color: "#E65100", fontWeight: "500", fontSize: "13px" }}>
                          {openActions} Open
                        </span>
                      )}
                      {completedActions > 0 && (
                        <span style={{ color: "#2E7D32", fontWeight: "500", fontSize: "13px" }}>
                          ✓ {completedActions} Done
                        </span>
                      )}
                      {!hasActions && (
                        <span style={{ color: "#8d6e63", fontSize: "12px", fontStyle: "italic" }}>
                          No actions
                        </span>
                      )}
                      <span style={{ color: "#8d6e63", fontSize: "12px" }}>
                        {totalActions} action{totalActions !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ✅ Expanded Content */}
                {isExpanded && (
                  <div style={expandedContentStyles}>
                    {/* Outstanding Actions */}
                    {(() => {
                      const outstanding = actions.filter(a => a.status !== "completed");
                      if (outstanding.length > 0) {
                        return (
                          <div style={{
                            backgroundColor: "#FFF8E1",
                            padding: "10px 14px",
                            borderRadius: "6px",
                            margin: "16px 0 12px 0",
                            borderLeft: "4px solid #FF9800",
                          }}>
                            <div style={{ fontSize: "12px", fontWeight: "600", color: "#E65100", marginBottom: "4px" }}>
                              📌 Outstanding Actions
                            </div>
                            {outstanding.slice(0, 3).map((action) => (
                              <div key={action.id} style={{ fontSize: "13px", color: "#4a352f", padding: "2px 0" }}>
                                • {action.title}
                                {isOverdue(action) && (
                                  <span style={{ color: "#f44336", fontSize: "11px", fontWeight: "600", marginLeft: "6px" }}>
                                    ⚠️ Overdue
                                  </span>
                                )}
                              </div>
                            ))}
                            {outstanding.length > 3 && (
                              <div style={{ fontSize: "12px", color: "#8d6e63", marginTop: "2px" }}>
                                +{outstanding.length - 3} more outstanding
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Actions List */}
                    {hasActions ? (
                      sortedActions.map((action) => {
                        const overdue = isOverdue(action);
                        const dueDateColor = getDueDateColor(action.dueDate);
                        const dueDateLabel = getDueDateLabel(action.dueDate);

                        return (
                          <div
                            key={action.id}
                            style={{
                              ...actionItemStyles,
                              backgroundColor: overdue ? "#FFF8F0" : "transparent",
                            }}
                          >
                            <div style={actionContentStyles}>
                              <div style={actionTitleStyles}>
                                {action.title}
                                {overdue && (
                                  <span style={{ color: "#f44336", fontSize: "11px", fontWeight: "600", marginLeft: "8px" }}>
                                    ⚠️ Overdue
                                  </span>
                                )}
                              </div>
                              {action.description && (
                                <div style={actionDescriptionStyles}>
                                  {action.description}
                                </div>
                              )}
                              <div style={actionMetaStyles}>
                                {getStatusBadge(action.status)}
                                {getPriorityBadge(action.priority)}
                                {action.assignedTo && (
                                  <span style={{ fontSize: "12px", color: "#8d6e63" }}>
                                    👤 {action.assignedTo}
                                  </span>
                                )}
                                {action.dueDate && (
                                  <span style={{ fontSize: "12px", color: dueDateColor, fontWeight: "500" }}>
                                    📅 {dueDateLabel}
                                  </span>
                                )}
                                {action.createdAt && (
                                  <span style={{ fontSize: "10px", color: "#bdbdbd" }}>
                                    Created {new Date(action.createdAt).toLocaleDateString()}
                                    {action.updatedAt && action.updatedAt !== action.createdAt && (
                                      <> • Updated {new Date(action.updatedAt).toLocaleDateString()}</>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={actionButtonsStyles}>
                              <button
                                onClick={() => toggleActionStatus(meeting.id, action)}
                                style={{
                                  ...iconButtonStyles,
                                  color: action.status === "completed" ? "#4CAF50" : "#8d6e63",
                                  fontSize: "18px",
                                }}
                                title={action.status === "completed" ? "Reopen" : "Complete"}
                              >
                                {action.status === "completed" ? "✅" : "☐"}
                              </button>
                              <button
                                onClick={() => openEditModal(meeting.id, action)}
                                style={{ ...iconButtonStyles, color: "#2196F3" }}
                                title="Edit"
                              >
                                <FaEdit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteAction(meeting.id, action.id)}
                                style={{ ...iconButtonStyles, color: "#f44336" }}
                                title="Delete"
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{
                        padding: "16px",
                        textAlign: "center",
                        color: "#8d6e63",
                        fontSize: "14px",
                      }}>
                        No actions have been assigned for this meeting.
                        <br />
                        <span style={{ fontSize: "13px", fontStyle: "italic" }}>
                          Create the first action after the meeting discussion.
                        </span>
                      </div>
                    )}

                    {/* ✅ Add Action button inside expanded content */}
                    <div style={{ marginTop: "12px", textAlign: "center" }}>
                      <button
                        onClick={() => openAddModal(meeting)}
                        style={{
                          padding: "8px 20px",
                          backgroundColor: "transparent",
                          color: "#7d5a50",
                          border: "2px dashed #e8ddd4",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "500",
                          width: "100%",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f7f3f0";
                          e.currentTarget.style.borderColor = "#7d5a50";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.borderColor = "#e8ddd4";
                        }}
                      >
                        <FaPlus size={12} /> Add Action
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

 <a href="/governance-calendar"
                style={{
                  color: "#7d5a50",
                  fontSize: "14px",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                ← Back to Calendar
              </a>

        {/* Add Action Modal */}
        {showAddModal && selectedMeeting && (
          <div style={modalOverlayStyles} onClick={() => setShowAddModal(false)}>
            <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
              <div style={modalHeaderStyles}>
                <h3 style={modalTitleStyles}>Add New Action</h3>
                <button onClick={() => setShowAddModal(false)} style={closeButtonStyles}>
                  ×
                </button>
              </div>

              <div>
                <div style={{ marginBottom: "12px", fontSize: "14px", color: "#5d4037" }}>
                  Meeting: <strong>{selectedMeeting.title}</strong>
                </div>

                <div style={formGroupStyles}>
                  <label style={labelStyles}>Action Title *</label>
                  <input
                    type="text"
                    placeholder="What needs to be done?"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={inputStyles(!formData.title.trim())}
                  />
                </div>

                <div style={formGroupStyles}>
                  <label style={labelStyles}>Description</label>
                  <textarea
                    placeholder="Add more details about this action..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={textareaStyles(false)}
                  />
                </div>

                <div style={formGroupStyles}>
                  <label style={labelStyles}>Assigned To</label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    style={selectStyles}
                  >
                    <option value="">Unassigned</option>
                    {(selectedMeeting.participants || []).map((p, idx) => {
                      const name = typeof p === "string" ? p : p.name || p.email || "Participant";
                      return (
                        <option key={idx} value={name}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={formGroupStyles}>
                    <label style={labelStyles}>Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      style={selectStyles}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div style={formGroupStyles}>
                    <label style={labelStyles}>Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      style={inputStyles(false)}
                    />
                  </div>
                </div>

                <div style={formGroupStyles}>
                  <label style={labelStyles}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={selectStyles}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div style={modalButtonContainerStyles}>
                  <button onClick={() => setShowAddModal(false)} style={cancelButtonStyles}>
                    Cancel
                  </button>
                  <button onClick={handleAddAction} style={submitButtonStyles}>
                    Add Action
                  </button>
                  
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Action Modal */}
        {showEditModal && editingAction && (
          <div style={modalOverlayStyles} onClick={() => setShowEditModal(false)}>
            <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
              <div style={modalHeaderStyles}>
                <h3 style={modalTitleStyles}>Edit Action</h3>
                <button onClick={() => setShowEditModal(false)} style={closeButtonStyles}>
                  ×
                </button>
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Action Title *</label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={inputStyles(!formData.title.trim())}
                />
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Description</label>
                <textarea
                  placeholder="Add more details about this action..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={textareaStyles(false)}
                />
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Assigned To</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  style={selectStyles}
                >
                  <option value="">Unassigned</option>
                  {selectedMeeting?.participants?.map((p, idx) => {
                    const name = typeof p === "string" ? p : p.name || p.email || "Participant";
                    return (
                      <option key={idx} value={name}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={formGroupStyles}>
                  <label style={labelStyles}>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={selectStyles}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div style={formGroupStyles}>
                  <label style={labelStyles}>Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    style={inputStyles(false)}
                  />
                </div>
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={selectStyles}
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div style={modalButtonContainerStyles}>
                <button onClick={() => setShowEditModal(false)} style={cancelButtonStyles}>
                  Cancel
                </button>
                <button onClick={handleEditAction} style={submitButtonStyles}>
                  Update Action
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RapsActions;