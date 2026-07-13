
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { FaEdit, FaCalendarAlt, FaUsers, FaClipboardList, FaArrowRight, FaCheckCircle, FaClock, FaExclamationTriangle } from "react-icons/fa";

const RapsOverview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);

  // Get meeting ID from URL
  const getMeetingId = () => {
    const params = new URLSearchParams(location.search);
    return params.get("meeting");
  };

  const meetingId = getMeetingId();

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

  // Load meeting
  useEffect(() => {
    if (!currentUser || !meetingId) {
      if (!meetingId) {
        setNotification({
          type: "error",
          message: "No meeting ID provided.",
        });
        setLoading(false);
      }
      return;
    }

    const loadMeeting = async () => {
      setLoading(true);
      try {
        const calendarRef = doc(db, "governanceCalendar", currentUser.uid);
        const calendarSnap = await getDoc(calendarRef);

        if (calendarSnap.exists()) {
          const data = calendarSnap.data();
          const meetings = data.meetings || [];
          const found = meetings.find(m => m.id === meetingId);

          if (found) {
            setMeeting(found);
          } else {
            setNotification({
              type: "error",
              message: "Meeting not found.",
            });
          }
        } else {
          setNotification({
            type: "error",
            message: "No meetings found.",
          });
        }
      } catch (error) {
        console.error("Error loading meeting:", error);
        setNotification({
          type: "error",
          message: "Failed to load meeting. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadMeeting();
  }, [currentUser, meetingId]);

  // Get meeting status
  const getMeetingStatus = (meeting) => {
    if (!meeting || !meeting.instances || meeting.instances.length === 0) {
      return "Unknown";
    }

    const today = new Date();
    const firstInstance = new Date(meeting.instances[0].date);

    if (firstInstance > today) {
      return "Upcoming";
    } else if (firstInstance < today) {
      return "Past";
    } else {
      return "Today";
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Upcoming":
        return "#4CAF50";
      case "Today":
        return "#FF9800";
      case "Past":
        return "#9E9E9E";
      default:
        return "#757575";
    }
  };

  // Calculate readiness (dummy for now)
  const calculateReadiness = (meeting) => {
    if (!meeting) return 0;
    const actions = meeting.actions || [];
    if (actions.length === 0) return 0;
    
    const completed = actions.filter(a => a.status === "completed").length;
    return Math.round((completed / actions.length) * 100);
  };

  // Calculate progress
  const calculateProgress = (meeting) => {
    const actions = meeting?.actions || [];
    if (actions.length === 0) return { percentage: 0, completed: 0, total: 0 };
    
    const completed = actions.filter(a => a.status === "completed").length;
    return {
      percentage: Math.round((completed / actions.length) * 100),
      completed,
      total: actions.length
    };
  };

  // Get action stats
  const getActionStats = (meeting) => {
    const actions = meeting?.actions || [];
    const open = actions.filter(a => a.status === "open").length;
    const inProgress = actions.filter(a => a.status === "in-progress").length;
    const completed = actions.filter(a => a.status === "completed").length;
    const overdue = actions.filter(a => {
      if (a.status === "completed") return false;
      if (!a.dueDate) return false;
      return new Date(a.dueDate) < new Date();
    }).length;
    
    return { open, inProgress, completed, overdue };
  };

  // Get previous meeting (for recurring)
  const getPreviousMeeting = (meeting) => {
    if (!meeting || !meeting.instances || meeting.instances.length < 2) return null;
    
    const sorted = [...meeting.instances].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted.length > 1 ? sorted[1] : null;
  };

  // Styles
  const containerStyles = {
    padding: "40px",
    maxWidth: "1000px",
    margin: "0 auto",
    marginTop: "80px",
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
    fontSize: "24px",
    fontWeight: "700",
    margin: 0,
  };

  const subtitleStyles = {
    color: "#8d6e63",
    fontSize: "14px",
    margin: "4px 0 0 0",
  };

  const cardStyles = {
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #e8ddd4",
    padding: "20px",
    marginBottom: "16px",
  };

  const cardTitleStyles = {
    fontSize: "13px",
    fontWeight: "600",
    color: "#8d6e63",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "12px",
  };

  const gridTwoStyles = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  };

  const gridThreeStyles = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "16px",
  };

  const statusBadgeStyles = (status) => ({
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: getStatusColor(status) + "20",
    color: getStatusColor(status),
    display: "inline-block",
  });

  const chipStyles = {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#f7f3f0",
    borderRadius: "16px",
    fontSize: "13px",
    color: "#4a352f",
    margin: "4px 4px 0 0",
  };

  const progressBarStyles = (percentage) => ({
    width: "100%",
    height: "8px",
    backgroundColor: "#f0e6d9",
    borderRadius: "4px",
    overflow: "hidden",
    marginTop: "8px",
  });

  const progressFillStyles = (percentage) => ({
    width: `${percentage}%`,
    height: "100%",
    backgroundColor: percentage === 100 ? "#4CAF50" : "#7d5a50",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  });

  const statNumberStyles = {
    fontSize: "24px",
    fontWeight: "700",
    color: "#5d4037",
  };

  const statLabelStyles = {
    fontSize: "12px",
    color: "#8d6e63",
    fontWeight: "500",
  };

  const quickActionButtonStyles = {
    padding: "8px 16px",
    backgroundColor: "#f7f3f0",
    border: "1px solid #e8ddd4",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#4a352f",
    transition: "all 0.2s",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  };

  const backButtonStyles = {
    padding: "8px 16px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    color: "#7d5a50",
    fontWeight: "500",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
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

  // Loading state
  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: "center", padding: "40px", color: "#8d6e63" }}>
          Loading meeting details...
        </div>
      </div>
    );
  }

  // No meeting ID
  if (!meetingId) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
          <h2 style={{ color: "#5d4037" }}>No Meeting Selected</h2>
          <p style={{ color: "#8d6e63" }}>
            Please select a meeting from the Governance Calendar.
          </p>
          <button
            onClick={() => navigate("/governance-calendar")}
            style={quickActionButtonStyles}
          >
            ← Back to Calendar
          </button>
        </div>
      </div>
    );
  }

  // Meeting not found
  if (!meeting) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <h2 style={{ color: "#5d4037" }}>Meeting Not Found</h2>
          <p style={{ color: "#8d6e63" }}>
            The meeting you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => navigate("/governance-calendar")}
            style={quickActionButtonStyles}
          >
            ← Back to Calendar
          </button>
        </div>
      </div>
    );
  }

  const status = getMeetingStatus(meeting);
  const statusColor = getStatusColor(status);
  const readiness = calculateReadiness(meeting);
  const progress = calculateProgress(meeting);
  const actionStats = getActionStats(meeting);
  const previousMeeting = getPreviousMeeting(meeting);

  return (
    <div style={containerStyles}>
      {/* Notification */}
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
          <button
            onClick={() => navigate("/governance-calendar")}
            style={backButtonStyles}
          >
            ← Back to Calendar
          </button>
          <h1 style={titleStyles}>{meeting.title}</h1>
          <div style={subtitleStyles}>
            {meeting.department} • {meeting.instances?.[0]?.date
              ? new Date(meeting.instances[0].date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "No date"}
            {" • "}
            <span style={statusBadgeStyles(status)}>{status}</span>
          </div>
        </div>
      </div>

      {/* Task 3: Meeting Header Info */}
      <div style={cardStyles}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Meeting Date
            </div>
            <div style={{ fontSize: "15px", color: "#4a352f", fontWeight: "500" }}>
              {meeting.instances?.[0]?.date
                ? new Date(meeting.instances[0].date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "TBD"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Time
            </div>
            <div style={{ fontSize: "15px", color: "#4a352f", fontWeight: "500" }}>
              {meeting.instances?.[0]?.time || "TBD"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Status
            </div>
            <div style={{ fontSize: "15px", color: "#4a352f", fontWeight: "500" }}>
              <span style={statusBadgeStyles(status)}>{status}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Frequency
            </div>
            <div style={{ fontSize: "15px", color: "#4a352f", fontWeight: "500" }}>
              {meeting.isRecurring
                ? meeting.recurrencePattern === "weekly" ? "Weekly" : "Monthly"
                : "One-time"}
            </div>
          </div>
        </div>
      </div>

      {/* Task 4: Purpose Card */}
      {meeting.purpose && (
        <div style={cardStyles}>
          <div style={cardTitleStyles}>Purpose</div>
          <p style={{ margin: 0, fontSize: "15px", color: "#4a352f", lineHeight: "1.6" }}>
            {meeting.purpose}
          </p>
        </div>
      )}

      {/* Task 5: Participants */}
      <div style={cardStyles}>
        <div style={cardTitleStyles}>
          <FaUsers style={{ marginRight: "6px" }} />
          Participants
        </div>
        <div>
          {meeting.participants && meeting.participants.length > 0 ? (
            meeting.participants.map((p, idx) => {
              const name = typeof p === "string" ? p : p.name || p.email || "Participant";
              return (
                <span key={idx} style={chipStyles}>
                  {name}
                </span>
              );
            })
          ) : (
            <span style={{ color: "#8d6e63", fontSize: "14px" }}>
              No participants specified
            </span>
          )}
        </div>
      </div>

      {/* Task 6: Meeting Information */}
      <div style={cardStyles}>
        <div style={cardTitleStyles}>Meeting Information</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Department
            </div>
            <div style={{ fontSize: "14px", color: "#4a352f" }}>
              {meeting.department || "Not specified"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Created By
            </div>
            <div style={{ fontSize: "14px", color: "#4a352f" }}>
              {meeting.createdBy || "Unknown"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Created Date
            </div>
            <div style={{ fontSize: "14px", color: "#4a352f" }}>
              {meeting.createdAt
                ? new Date(meeting.createdAt).toLocaleDateString()
                : "Unknown"}
            </div>
          </div>
          {meeting.isRecurring && (
            <div>
              <div style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Recurring
              </div>
              <div style={{ fontSize: "14px", color: "#4a352f" }}>
                {meeting.recurrencePattern === "weekly" ? "Weekly" : "Monthly"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task 7: Readiness Section */}
      <div style={cardStyles}>
        <div style={cardTitleStyles}>Meeting Readiness</div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#5d4037" }}>
              {readiness}%
            </div>
            <div style={progressBarStyles(readiness)}>
              <div style={progressFillStyles(readiness)} />
            </div>
          </div>
          <div style={{ fontSize: "13px", color: "#8d6e63" }}>
            {readiness === 100 ? "✅ Ready for meeting" : "Some items need attention"}
          </div>
        </div>
        <div style={{ marginTop: "12px", padding: "12px 16px", backgroundColor: "#f7f3f0", borderRadius: "6px" }}>
          <div style={{ fontSize: "12px", color: "#8d6e63" }}>
            <span style={{ color: "#4CAF50" }}>✔</span> Meeting created
            <br />
            {readiness > 0 ? (
              <span style={{ color: "#4CAF50" }}>✔</span>
            ) : (
              <span style={{ color: "#FF9800" }}>◐</span>
            )} Actions defined
            <br />
            {readiness >= 50 ? (
              <span style={{ color: "#4CAF50" }}>✔</span>
            ) : (
              <span style={{ color: "#FF9800" }}>◐</span>
            )} Actions completed ({progress.completed}/{progress.total})
          </div>
        </div>
      </div>

      {/* Task 8: Actions Summary */}
      <div style={cardStyles}>
        <div style={{ cardTitleStyles, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Actions</span>
          <button
            onClick={() => navigate(`/raps-actions?meeting=${meeting.id}`)}
            style={{
              background: "none",
              border: "none",
              color: "#7d5a50",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            View All <FaArrowRight size={12} />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "12px" }}>
          <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#FFF3E0", borderRadius: "6px" }}>
            <div style={statNumberStyles}>{actionStats.open}</div>
            <div style={statLabelStyles}>Open</div>
          </div>
          <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#E3F2FD", borderRadius: "6px" }}>
            <div style={statNumberStyles}>{actionStats.inProgress}</div>
            <div style={statLabelStyles}>In Progress</div>
          </div>
          <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#E8F5E9", borderRadius: "6px" }}>
            <div style={statNumberStyles}>{actionStats.completed}</div>
            <div style={statLabelStyles}>Completed</div>
          </div>
          <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#FFEBEE", borderRadius: "6px" }}>
            <div style={statNumberStyles}>{actionStats.overdue}</div>
            <div style={statLabelStyles}>Overdue</div>
          </div>
        </div>
      </div>

      {/* Task 9: Previous Meeting */}
      {previousMeeting && (
        <div style={cardStyles}>
          <div style={cardTitleStyles}>Previous Meeting</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <div style={{ fontSize: "15px", fontWeight: "500", color: "#4a352f" }}>
                {new Date(previousMeeting.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div style={{ fontSize: "13px", color: "#8d6e63" }}>
                Time: {previousMeeting.time || "TBD"}
              </div>
            </div>
            <span style={statusBadgeStyles("Past")}>Completed</span>
          </div>
        </div>
      )}

      {/* Task 13: Quick Actions */}
      <div style={{ ...cardStyles, border: "2px solid #e8ddd4" }}>
        <div style={cardTitleStyles}>Quick Actions</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <button
            onClick={() => navigate(`/governance-calendar`)}
            style={quickActionButtonStyles}
          >
            <FaCalendarAlt /> Open Calendar
          </button>
          <button
            onClick={() => navigate(`/raps-actions?meeting=${meeting.id}`)}
            style={quickActionButtonStyles}
          >
            <FaClipboardList /> Manage Actions
          </button>
          <button
            onClick={() => navigate(`/governance-calendar`)}
            style={quickActionButtonStyles}
          >
            <FaEdit /> Edit Meeting
          </button>
        </div>
      </div>

      {/* Task 10-12: Placeholders for Future */}
      <div style={{ ...cardStyles, border: "2px dashed #e8ddd4", backgroundColor: "#faf8f5" }}>
        <div style={{ textAlign: "center", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#8d6e63", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Results, Risks & Documents
          </div>
          <p style={{ fontSize: "13px", color: "#8d6e63", margin: "8px 0 0 0" }}>
            This section will display Financial Performance metrics, Operational KPIs, Risks, and Documents once the Growth Suite modules are connected.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RapsOverview;