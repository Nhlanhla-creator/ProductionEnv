import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronUp, FaCalendarAlt } from "react-icons/fa";

const RapsActions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    action: "all",
    byWhom: "all",
    byWhen: "all",
    revisedDate: "all",
    status: "all",
  });
  const [showFilterDropdown, setShowFilterDropdown] = useState(null);
  const [showCalendarPicker, setShowCalendarPicker] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [editingAction, setEditingAction] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
    status: "In Progress",
  });

  // Get meeting ID from URL
  const getMeetingId = () => {
    const params = new URLSearchParams(location.search);
    return params.get("meeting");
  };

  const filterMeetingId = getMeetingId();

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

  // Load meetings
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
  }, [currentUser]);

  // Format date to dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get meeting date
  const getMeetingDate = (meeting) => {
    if (meeting.instances && meeting.instances.length > 0) {
      return formatDate(meeting.instances[0].date);
    }
    return "No date";
  };

  // Get unique values for each filter
  const getFilterOptions = (field) => {
    const options = new Set();
    const allActions = getAllActionsRaw();
    allActions.forEach((action) => {
      let value = "";
      switch(field) {
        case "category":
          value = action.meetingCategory || "Uncategorized";
          break;
        case "action":
          value = action.title || "Untitled";
          break;
        case "byWhom":
          value = action.assignedTo || "Unassigned";
          break;
        case "status":
          value = action.status || "Not Done";
          break;
        default:
          return;
      }
      if (value) options.add(value);
    });
    return ["all", ...Array.from(options)];
  };

  // Get all actions raw (without filters)
  const getAllActionsRaw = () => {
    let allActions = [];
    let filteredMeetings = meetings;

    // Meeting filter (from URL)
    if (filterMeetingId) {
      filteredMeetings = filteredMeetings.filter((meeting) => meeting.id === filterMeetingId);
    }

    filteredMeetings.forEach((meeting) => {
      const actions = meeting.actions || [];
      actions.forEach((action) => {
        allActions.push({
          ...action,
          meetingTitle: meeting.title,
          meetingCategory: meeting.category || meeting.department,
          meetingDepartments: meeting.departments || [],
          meetingId: meeting.id,
          meetingColor: meeting.categoryColor || meeting.departmentColor || "#757575",
          meetingDate: meeting.instances?.[0]?.date || null,
          meetingDateFormatted: getMeetingDate(meeting),
        });
      });
    });
    
    return allActions;
  };

  // Get all actions with filters applied
  const getAllActions = () => {
    let allActions = [];
    let filteredMeetings = meetings;

    // Search filter
    if (searchTerm.trim()) {
      filteredMeetings = filteredMeetings.filter((meeting) =>
        meeting.title?.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
    }

    // Meeting filter (from URL)
    if (filterMeetingId) {
      filteredMeetings = filteredMeetings.filter((meeting) => meeting.id === filterMeetingId);
    }

    filteredMeetings.forEach((meeting) => {
      const actions = meeting.actions || [];
      actions.forEach((action) => {
        let shouldInclude = true;
        
        // Category filter
        if (filters.category !== "all") {
          const category = meeting.category || meeting.department || "Uncategorized";
          shouldInclude = category === filters.category;
        }
        
        // Action filter
        if (filters.action !== "all" && shouldInclude) {
          shouldInclude = (action.title || "Untitled") === filters.action;
        }
        
        // By Whom filter
        if (filters.byWhom !== "all" && shouldInclude) {
          const assignee = action.assignedTo || "Unassigned";
          shouldInclude = assignee === filters.byWhom;
        }
        
        // By When filter (calendar date)
        if (filters.byWhen !== "all" && shouldInclude) {
          if (filters.byWhen === "No Date") {
            shouldInclude = !action.dueDate;
          } else {
            const actionDate = action.dueDate ? formatDate(action.dueDate) : null;
            shouldInclude = actionDate === filters.byWhen;
          }
        }
        
        // Revised Date filter (calendar date)
        if (filters.revisedDate !== "all" && shouldInclude) {
          if (filters.revisedDate === "No Revision") {
            shouldInclude = !action.revisedDate;
          } else {
            const revisedDate = action.revisedDate ? formatDate(action.revisedDate) : null;
            shouldInclude = revisedDate === filters.revisedDate;
          }
        }
        
        // Status filter
        if (filters.status !== "all" && shouldInclude) {
          shouldInclude = (action.status || "Not Done") === filters.status;
        }
        
        if (shouldInclude) {
          allActions.push({
            ...action,
            meetingTitle: meeting.title,
            meetingCategory: meeting.category || meeting.department,
            meetingDepartments: meeting.departments || [],
            meetingId: meeting.id,
            meetingColor: meeting.categoryColor || meeting.departmentColor || "#757575",
            meetingDate: meeting.instances?.[0]?.date || null,
            meetingDateFormatted: getMeetingDate(meeting),
          });
        }
      });
    });
    
    // Sort
    if (sortConfig.key) {
      allActions.sort((a, b) => {
        let aVal, bVal;
        switch(sortConfig.key) {
          case "category":
            aVal = a.meetingCategory || "Uncategorized";
            bVal = b.meetingCategory || "Uncategorized";
            break;
          case "action":
            aVal = a.title || "";
            bVal = b.title || "";
            break;
          case "byWhom":
            aVal = a.assignedTo || "";
            bVal = b.assignedTo || "";
            break;
          case "byWhen":
            aVal = a.dueDate || "";
            bVal = b.dueDate || "";
            break;
          case "revisedDate":
            aVal = a.revisedDate || "";
            bVal = b.revisedDate || "";
            break;
          case "status":
            aVal = a.status || "";
            bVal = b.status || "";
            break;
          default:
            return 0;
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return allActions;
  };

  const allActions = getAllActions();

  // Status badge
  const getStatusBadge = (status) => {
    const styles = {
      "Not Done": { bg: "#FFEBEE", color: "#C62828", label: "Not Done" },
      "In Progress": { bg: "#FFF3E0", color: "#E65100", label: "In Progress" },
      "Done": { bg: "#E8F5E9", color: "#2E7D32", label: "Done" },
    };
    const s = styles[status] || styles["Not Done"];
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

  // Check if action is overdue
  const isOverdue = (action) => {
    if (!action.dueDate) return false;
    if (action.status === "Done") return false;
    const today = new Date();
    const dueDate = new Date(action.dueDate);
    return dueDate < today;
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

  // Save meetings to Firestore
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

  // Add action
  const handleAddAction = async () => {
    if (!selectedMeetingId || !formData.title.trim()) {
      setNotification({
        type: "error",
        message: "Please select a meeting and fill in all required fields.",
      });
      return;
    }

    setSubmitting(true);

    const newAction = {
      id: Date.now().toString(),
      title: formData.title.trim(),
      description: formData.description.trim() || "",
      assignedTo: formData.assignedTo || "",
      dueDate: formData.dueDate || "",
      status: formData.status || "In Progress",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revisedDate: null,
    };

    const updatedMeetings = meetings.map((meeting) => {
      if (meeting.id === selectedMeetingId) {
        return {
          ...meeting,
          actions: [...(meeting.actions || []), newAction],
        };
      }
      return meeting;
    });

    const success = await saveMeetings(updatedMeetings);
    if (success) {
      setNotification({
        type: "success",
        message: "Action added successfully!",
      });
      setShowAddModal(false);
      setSelectedMeetingId(null);
      setFormData({
        title: "",
        description: "",
        assignedTo: "",
        dueDate: "",
        status: "In Progress",
      });
      setTimeout(() => setNotification(null), 3000);
    }
    setSubmitting(false);
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

    setSubmitting(true);

    const updatedMeetings = meetings.map((meeting) => {
      if (meeting.id === editingAction.meetingId) {
        return {
          ...meeting,
          actions: (meeting.actions || []).map((action) => {
            if (action.id === editingAction.action.id) {
              const dueDateChanged = action.dueDate !== formData.dueDate;
              let revisedDate = action.revisedDate;
              
              if (dueDateChanged) {
                revisedDate = new Date().toISOString().split('T')[0];
              }

              let status = formData.status;
              if (status !== "Done") {
                const today = new Date();
                const dueDate = new Date(formData.dueDate);
                if (dueDate < today) {
                  status = "Not Done";
                } else if (dueDate >= today && status !== "Done") {
                  status = "In Progress";
                }
              }

              return {
                ...action,
                title: formData.title.trim(),
                description: formData.description.trim() || "",
                assignedTo: formData.assignedTo || "",
                dueDate: formData.dueDate || "",
                status: status,
                updatedAt: new Date().toISOString(),
                revisedDate: revisedDate,
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
      setNotification({
        type: "success",
        message: "Action updated successfully!",
      });
      setShowEditModal(false);
      setEditingAction(null);
      setFormData({
        title: "",
        description: "",
        assignedTo: "",
        dueDate: "",
        status: "In Progress",
      });
      setTimeout(() => setNotification(null), 3000);
    }
    setSubmitting(false);
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
      setNotification({
        type: "warning",
        message: "Action deleted successfully.",
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Toggle action status
  const toggleActionStatus = async (meetingId, action) => {
    let newStatus;
    if (action.status === "Done") {
      newStatus = "In Progress";
    } else {
      newStatus = "Done";
    }

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
  const openAddModal = () => {
    if (meetings.length === 0) {
      setNotification({
        type: "warning",
        message: "No meetings found. Create a meeting first.",
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    if (filterMeetingId && meetings.some(m => m.id === filterMeetingId)) {
      setSelectedMeetingId(filterMeetingId);
    } else {
      setSelectedMeetingId(meetings[0].id);
    }
    
    setFormData({
      title: "",
      description: "",
      assignedTo: "",
      dueDate: "",
      status: "In Progress",
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
      status: action.status || "In Progress",
    });
    setShowEditModal(true);
  };

  // Navigate to meeting
  const navigateToMeeting = (meetingId) => {
    navigate(`/governance-calendar?meeting=${meetingId}`);
  };

  // Get selected meeting
  const getSelectedMeeting = () => {
    return meetings.find(m => m.id === selectedMeetingId) || null;
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setShowFilterDropdown(null);
    setShowCalendarPicker(null);
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Calendar component for date filters
  const CalendarPicker = ({ field, onSelect, onClose }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const getDaysInMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const goToPreviousMonth = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const formatted = formatDate(date.toISOString());
      setSelectedDate(formatted);
      onSelect(formatted);
      onClose();
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
      <div style={{
        position: "absolute",
        top: "100%",
        left: 0,
        marginTop: "4px",
        backgroundColor: "white",
        border: "2px solid #e8ddd4",
        borderRadius: "8px",
        padding: "16px",
        zIndex: 100,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        width: "280px",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}>
          <button
            onClick={goToPreviousMonth}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              color: "#5d4037",
              padding: "4px 8px",
            }}
          >
            ‹
          </button>
          <span style={{ fontWeight: "600", color: "#5d4037" }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={goToNextMonth}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              color: "#5d4037",
              padding: "4px 8px",
            }}
          >
            ›
          </button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
          marginBottom: "8px",
        }}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} style={{
              textAlign: "center",
              fontSize: "11px",
              fontWeight: "600",
              color: "#8d6e63",
              padding: "4px",
            }}>
              {day}
            </div>
          ))}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
        }}>
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} style={{ padding: "4px" }} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = selectedDate === formatDate(date.toISOString());
            
            return (
              <div
                key={day}
                onClick={() => handleDateClick(day)}
                style={{
                  textAlign: "center",
                  padding: "6px 4px",
                  cursor: "pointer",
                  borderRadius: "4px",
                  backgroundColor: isSelected ? "#7d5a50" : isToday ? "#f0e6d9" : "transparent",
                  color: isSelected ? "white" : isToday ? "#5d4037" : "#4a352f",
                  fontWeight: isSelected || isToday ? "600" : "400",
                  fontSize: "13px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#f7f3f0";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = isToday ? "#f0e6d9" : "transparent";
                  }
                }}
              >
                {day}
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: "1px solid #e8ddd4",
          display: "flex",
          justifyContent: "space-between",
        }}>
          <button
            onClick={() => {
              onSelect("No Date");
              onClose();
            }}
            style={{
              padding: "4px 12px",
              backgroundColor: "#f5f5f5",
              border: "1px solid #e8ddd4",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              color: "#4a352f",
            }}
          >
            No Date
          </button>
          <button
            onClick={() => {
              onSelect("all");
              onClose();
            }}
            style={{
              padding: "4px 12px",
              backgroundColor: "#f5f5f5",
              border: "1px solid #e8ddd4",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              color: "#4a352f",
            }}
          >
            Clear
          </button>
        </div>
      </div>
    );
  };

  // Filter dropdown component
  const FilterDropdown = ({ field, label, options, currentValue, isDateFilter = false }) => {
    const isOpen = showFilterDropdown === field;
    const isCalendarOpen = showCalendarPicker === field;
    const isActive = currentValue !== "all";
    
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
            color: isActive ? "#0D47A1" : "#4a352f",
            fontWeight: isActive ? "600" : "600",
            padding: "4px 8px",
            borderRadius: "4px",
            backgroundColor: isActive ? "#E3F2FD" : "transparent",
          }}
          onClick={() => {
            if (isDateFilter) {
              setShowCalendarPicker(isCalendarOpen ? null : field);
              setShowFilterDropdown(null);
            } else {
              setShowFilterDropdown(isOpen ? null : field);
              setShowCalendarPicker(null);
            }
          }}
        >
          {isDateFilter && <FaCalendarAlt size={10} style={{ marginRight: "2px" }} />}
          {label}
          {isActive && <span style={{ fontSize: "10px", marginLeft: "4px" }}>●</span>}
          {isCalendarOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
        </div>
        
        {isCalendarOpen && isDateFilter && (
          <CalendarPicker
            field={field}
            onSelect={(value) => handleFilterChange(field, value)}
            onClose={() => setShowCalendarPicker(null)}
          />
        )}
        
        {isOpen && !isDateFilter && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: "4px",
              backgroundColor: "white",
              border: "2px solid #e8ddd4",
              borderRadius: "6px",
              minWidth: "180px",
              maxHeight: "250px",
              overflowY: "auto",
              zIndex: 100,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              padding: "4px 0",
            }}
            onMouseLeave={() => setShowFilterDropdown(null)}
          >
            {options.map((option) => (
              <div
                key={option}
                style={{
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: "13px",
                  backgroundColor: currentValue === option ? "#E3F2FD" : "white",
                  color: currentValue === option ? "#0D47A1" : "#4a352f",
                  fontWeight: currentValue === option ? "600" : "400",
                }}
                onClick={() => handleFilterChange(field, option)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f5f5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = currentValue === option ? "#E3F2FD" : "white";
                }}
              >
                {option === "all" ? `All ${label}s` : option}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Styles
  const containerStyles = {
    padding: "40px",
    maxWidth: "1200px",
    margin: "0 auto",
    marginTop: "5px",
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

  const searchContainerStyles = {
    display: "flex",
    alignItems: "center",
    flex: 1,
    maxWidth: "300px",
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

  const masterTableStyles = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
    backgroundColor: "white",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  };

  const tableHeaderStyles = {
    padding: "12px 16px",
    textAlign: "left",
    backgroundColor: "#f0e6d9",
    color: "#4a352f",
    fontWeight: "600",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "2px solid #d7ccc8",
  };

  const tableCellStyles = {
    padding: "12px 16px",
    borderBottom: "1px solid #f0e6d9",
    verticalAlign: "middle",
  };

  const tableActionStyles = {
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
    cursor: submitting ? "not-allowed" : "pointer",
    fontWeight: "500",
    fontSize: "14px",
    opacity: submitting ? 0.6 : 1,
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
            <h1 style={titleStyles}>RAP Action Centre</h1>
            <p style={subtitleStyles}>Manage all Governance Meeting Actions</p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
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
            <button onClick={openAddModal} style={addButtonStyles}>
              <FaPlus size={14} /> New Action
            </button>
          </div>
        </div>

        {/* Master Table */}
        {allActions.length === 0 ? (
          <div style={emptyStateStyles}>
            <div style={emptyIconStyles}>📋</div>
            <h3 style={{ color: "#5d4037" }}>No actions found</h3>
            <p style={{ color: "#8d6e63", marginBottom: "16px" }}>
              {meetings.length === 0
                ? "Create your first meeting to start adding actions."
                : "No actions match your current filters."}
            </p>
          </div>
        ) : (
          <table style={masterTableStyles}>
            <thead>
              <tr>
                <th style={tableHeaderStyles}>
                  <FilterDropdown
                    field="category"
                    label="Category"
                    options={getFilterOptions("category")}
                    currentValue={filters.category}
                  />
                </th>
                <th style={tableHeaderStyles}>
                  <FilterDropdown
                    field="action"
                    label="Action"
                    options={getFilterOptions("action")}
                    currentValue={filters.action}
                  />
                </th>
                <th style={tableHeaderStyles}>
                  <FilterDropdown
                    field="byWhom"
                    label="By Whom"
                    options={getFilterOptions("byWhom")}
                    currentValue={filters.byWhom}
                  />
                </th>
                <th style={tableHeaderStyles}>
                  <FilterDropdown
                    field="byWhen"
                    label="By When"
                    options={[]}
                    currentValue={filters.byWhen}
                    isDateFilter={true}
                  />
                </th>
                <th style={tableHeaderStyles}>
                  <FilterDropdown
                    field="revisedDate"
                    label="Revised Date"
                    options={[]}
                    currentValue={filters.revisedDate}
                    isDateFilter={true}
                  />
                </th>
                <th style={tableHeaderStyles}>
                  <FilterDropdown
                    field="status"
                    label="Status"
                    options={getFilterOptions("status")}
                    currentValue={filters.status}
                  />
                </th>
                <th style={{ ...tableHeaderStyles, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allActions.map((action) => {
                const overdue = isOverdue(action);
                const dueDateColor = getDueDateColor(action.dueDate);

                return (
                  <tr key={action.id}>
                    <td 
                      style={{ ...tableCellStyles, cursor: "pointer" }}
                      onClick={() => navigateToMeeting(action.meetingId)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f7f3f0";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ 
                          width: "10px", 
                          height: "10px", 
                          borderRadius: "50%", 
                          backgroundColor: action.meetingColor 
                        }} />
                        <div>
                          <div style={{ fontWeight: "500", color: "#4a352f" }}>
                            {action.meetingCategory || "Uncategorized"}
                          </div>
                          <div style={{ fontSize: "11px", color: "#8d6e63" }}>
                            {action.meetingTitle}
                          </div>
                          <div style={{ fontSize: "10px", color: "#bdbdbd" }}>
                            {action.meetingDateFormatted}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={tableCellStyles}>
                      <div style={{ fontWeight: "500", color: "#4a352f" }}>
                        {action.title}
                        {overdue && (
                          <span style={{ color: "#f44336", fontSize: "11px", fontWeight: "600", marginLeft: "8px" }}>
                            ⚠️ Overdue
                          </span>
                        )}
                      </div>
                      {action.description && (
                        <div style={{ fontSize: "12px", color: "#8d6e63", marginTop: "2px" }}>
                          {action.description}
                        </div>
                      )}
                    </td>
                    <td style={tableCellStyles}>
                      {action.assignedTo || "Unassigned"}
                    </td>
                    <td style={tableCellStyles}>
                      {action.dueDate ? (
                        <span style={{ color: dueDateColor, fontWeight: "500" }}>
                          {formatDate(action.dueDate)}
                        </span>
                      ) : (
                        "No due date"
                      )}
                    </td>
                    <td style={tableCellStyles}>
                      {action.revisedDate ? (
                        <span style={{ color: "#5d4037" }}>
                          {formatDate(action.revisedDate)}
                        </span>
                      ) : (
                        <span style={{ color: "#bdbdbd" }}>—</span>
                      )}
                    </td>
                    <td style={tableCellStyles}>
                      {getStatusBadge(action.status)}
                    </td>
                    <td style={{ ...tableCellStyles, textAlign: "center" }}>
                      <div style={tableActionStyles}>
                        <button
                          onClick={() => toggleActionStatus(action.meetingId, action)}
                          style={{
                            ...iconButtonStyles,
                            color: action.status === "Done" ? "#4CAF50" : "#8d6e63",
                            fontSize: "18px",
                          }}
                          title={action.status === "Done" ? "Reopen" : "Mark as Done"}
                        >
                          {action.status === "Done" ? "✅" : "☐"}
                        </button>
                        <button
                          onClick={() => openEditModal(action.meetingId, action)}
                          style={{ ...iconButtonStyles, color: "#2196F3" }}
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteAction(action.meetingId, action.id)}
                          style={{ ...iconButtonStyles, color: "#f44336" }}
                          title="Delete"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Add Action Modal */}
        {showAddModal && (
          <div style={modalOverlayStyles} onClick={() => setShowAddModal(false)}>
            <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
              <div style={modalHeaderStyles}>
                <h3 style={modalTitleStyles}>Add New Action</h3>
                <button onClick={() => setShowAddModal(false)} style={closeButtonStyles}>
                  ×
                </button>
              </div>

              <div>
                <div style={formGroupStyles}>
                  <label style={labelStyles}>Select Meeting *</label>
                  <select
                    value={selectedMeetingId || ""}
                    onChange={(e) => setSelectedMeetingId(e.target.value)}
                    style={selectStyles}
                  >
                    <option value="">Select a meeting...</option>
                    {meetings.map((meeting) => (
                      <option key={meeting.id} value={meeting.id}>
                        {meeting.title} ({meeting.category || "Uncategorized"}) - {getMeetingDate(meeting)}
                      </option>
                    ))}
                  </select>
                </div>

                {getSelectedMeeting() && (
                  <>
                    <div style={{ marginBottom: "12px", fontSize: "13px", color: "#8d6e63" }}>
                      Meeting: <strong style={{ color: "#4a352f" }}>{getSelectedMeeting().title}</strong>
                      {getSelectedMeeting().category && (
                        <span style={{ marginLeft: "8px", display: "inline-block", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", backgroundColor: getSelectedMeeting().categoryBg || "#f0e6d9", color: getSelectedMeeting().categoryColor || "#4a352f" }}>
                          {getSelectedMeeting().category}
                        </span>
                      )}
                      <span style={{ marginLeft: "8px", fontSize: "11px", color: "#8d6e63" }}>
                        📅 {getMeetingDate(getSelectedMeeting())}
                      </span>
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
                      <label style={labelStyles}>By Whom (Assigned To)</label>
                      <select
                        value={formData.assignedTo}
                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                        style={selectStyles}
                      >
                        <option value="">Unassigned</option>
                        {(getSelectedMeeting().participants || []).map((p, idx) => {
                          const name = typeof p === "string" ? p : p.name || p.email || "Participant";
                          return (
                            <option key={idx} value={name}>
                              {name}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div style={formGroupStyles}>
                      <label style={labelStyles}>By When (Due Date)</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        style={inputStyles(false)}
                      />
                    </div>

                    <div style={formGroupStyles}>
                      <label style={labelStyles}>Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        style={selectStyles}
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Not Done">Not Done</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>

                    <div style={modalButtonContainerStyles}>
                      <button onClick={() => setShowAddModal(false)} style={cancelButtonStyles}>
                        Cancel
                      </button>
                      <button onClick={handleAddAction} disabled={submitting} style={submitButtonStyles}>
                        {submitting ? "Adding..." : "Add Action"}
                      </button>
                    </div>
                  </>
                )}
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
                <label style={labelStyles}>By Whom (Assigned To)</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  style={selectStyles}
                >
                  <option value="">Unassigned</option>
                  {getFilterOptions("byWhom").filter(a => a !== "all").map((assignee) => (
                    <option key={assignee} value={assignee}>
                      {assignee}
                    </option>
                  ))}
                </select>
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>By When (Due Date)</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  style={inputStyles(false)}
                />
              </div>

              <div style={formGroupStyles}>
                <label style={labelStyles}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={selectStyles}
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Not Done">Not Done</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div style={modalButtonContainerStyles}>
                <button onClick={() => setShowEditModal(false)} style={cancelButtonStyles}>
                  Cancel
                </button>
                <button onClick={handleEditAction} disabled={submitting} style={submitButtonStyles}>
                  {submitting ? "Saving..." : "Update Action"}
                </button>
              </div>
            </div>
          </div>
        )}
        <a
          href="/governance-calendar"
          style={{
            color: "#7d5a50",
            fontSize: "14px",
            textDecoration: "none",
            fontWeight: "500",
            display: "inline-block",
            marginTop: "20px",
          }}
        >
          ← Back to Calendar
        </a>
      </div>
    </>
  );
};

export default RapsActions;