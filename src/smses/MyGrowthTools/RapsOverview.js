// src/pages/RapsOverview.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { FaUsers, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaClipboardList, FaArrowRight, FaExclamationTriangle, FaCheckCircle, FaBell } from "react-icons/fa";

const RapsOverview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);

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

  const getStatus = (meeting) => {
    if (!meeting || !meeting.instances || meeting.instances.length === 0) return "Unknown";
    const today = new Date();
    const firstInstance = new Date(meeting.instances[0].date);
    if (firstInstance > today) return "Upcoming";
    if (firstInstance < today) return "Past";
    return "Today";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Upcoming": return "#4CAF50";
      case "Today": return "#FF9800";
      case "Past": return "#9E9E9E";
      default: return "#757575";
    }
  };

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

  // Styles
  const containerStyles = {
    padding: "40px",
    maxWidth: "900px",
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

  const placeholderStyles = {
    textAlign: "center",
    padding: "20px",
    color: "#8d6e63",
    fontSize: "14px",
    fontStyle: "italic",
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

  const actionStats = meeting ? getActionStats(meeting) : { open: 0, inProgress: 0, completed: 0, overdue: 0 };

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: "center", padding: "40px", color: "#8d6e63" }}>
          Loading meeting details...
        </div>
      </div>
    );
  }

  if (!meetingId) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
          <h2 style={{ color: "#5d4037" }}>No Meeting Selected</h2>
          <p style={{ color: "#8d6e63" }}>Please select a meeting from the Governance Calendar.</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <h2 style={{ color: "#5d4037" }}>Meeting Not Found</h2>
          <p style={{ color: "#8d6e63" }}>The meeting you're looking for doesn't exist.</p>
          <button onClick={() => navigate("/governance-calendar")} style={quickActionButtonStyles}>
            ← Back to Calendar
          </button>
        </div>
      </div>
    );
  }

  const status = getStatus(meeting);

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div>
          <button onClick={() => navigate("/governance-calendar")} style={backButtonStyles}>
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

      {/* Section 1: Meeting Overview */}
      <div style={cardStyles}>
        <div style={cardTitleStyles}>Meeting Overview</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <FaCalendarAlt style={{ marginRight: "4px" }} /> Date
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
              <FaClock style={{ marginRight: "4px" }} /> Time
            </div>
            <div style={{ fontSize: "15px", color: "#4a352f", fontWeight: "500" }}>
              {meeting.instances?.[0]?.time || "TBD"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <FaMapMarkerAlt style={{ marginRight: "4px" }} /> Location
            </div>
            <div style={{ fontSize: "15px", color: "#4a352f", fontWeight: "500" }}>
              {meeting.location || "Virtual"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              🔄 Frequency
            </div>
            <div style={{ fontSize: "15px", color: "#4a352f", fontWeight: "500" }}>
              {meeting.isRecurring
                ? meeting.recurrencePattern === "weekly" ? "Weekly" :
                  meeting.recurrencePattern === "monthly" ? "Monthly" :
                  meeting.recurrencePattern === "quarterly" ? "Quarterly" : "Custom"
                : "One-time"}
            </div>
          </div>
        </div>
        {meeting.purpose && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e8ddd4" }}>
            <div style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Purpose
            </div>
            <div style={{ fontSize: "14px", color: "#4a352f", marginTop: "4px" }}>{meeting.purpose}</div>
          </div>
        )}
        {meeting.participants && meeting.participants.length > 0 && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e8ddd4" }}>
            <div style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <FaUsers style={{ marginRight: "4px" }} /> Participants
            </div>
            <div style={{ marginTop: "4px" }}>
              {meeting.participants.map((p, idx) => (
                <span key={idx} style={chipStyles}>
                  {typeof p === "string" ? p : p.name || p.email || "Participant"}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Performance Overview */}
      <div style={cardStyles}>
        <div style={cardTitleStyles}>Performance Overview</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          <div style={{ backgroundColor: "#f7f3f0", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "14px", color: "#5d4037", fontWeight: "500" }}>Financial Overview</div>
            <div style={{ fontSize: "13px", color: "#8d6e63", marginTop: "8px" }}>
              Not connected yet
            </div>
            <div style={{ fontSize: "11px", color: "#bdbdbd", marginTop: "4px" }}>
              Connect Financial Performance module
            </div>
          </div>
          <div style={{ backgroundColor: "#f7f3f0", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "14px", color: "#5d4037", fontWeight: "500" }}>Operational Overview</div>
            <div style={{ fontSize: "13px", color: "#8d6e63", marginTop: "8px" }}>
              Not connected yet
            </div>
            <div style={{ fontSize: "11px", color: "#bdbdbd", marginTop: "4px" }}>
              Connect Operational Performance module
            </div>
          </div>
          <div style={{ backgroundColor: "#f7f3f0", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "14px", color: "#5d4037", fontWeight: "500" }}>People Overview</div>
            <div style={{ fontSize: "13px", color: "#8d6e63", marginTop: "8px" }}>
              Not connected yet
            </div>
            <div style={{ fontSize: "11px", color: "#bdbdbd", marginTop: "4px" }}>
              Connect People module
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Highlights */}
      <div style={cardStyles}>
        <div style={cardTitleStyles}>Highlights</div>
        <div style={placeholderStyles}>
          <FaCheckCircle style={{ fontSize: "24px", color: "#bdbdbd", marginBottom: "8px" }} />
          <div>No highlights available.</div>
          <div style={{ fontSize: "12px", color: "#bdbdbd", marginTop: "4px" }}>
            Highlights will be generated from connected Growth Tools.
          </div>
        </div>
      </div>

      {/* Section 4: Lowlights */}
      <div style={cardStyles}>
        <div style={cardTitleStyles}>Lowlights</div>
        <div style={placeholderStyles}>
          <FaExclamationTriangle style={{ fontSize: "24px", color: "#bdbdbd", marginBottom: "8px" }} />
          <div>No lowlights available.</div>
          <div style={{ fontSize: "12px", color: "#bdbdbd", marginTop: "4px" }}>
            This section will display areas requiring management attention.
          </div>
        </div>
      </div>

      {/* Section 5: Actions Summary */}
      <div style={cardStyles}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={cardTitleStyles}>Actions Summary</div>
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
            Manage Actions <FaArrowRight size={12} />
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

      {/* Section 6: Risks */}
      <div style={cardStyles}>
        <div style={cardTitleStyles}>Risks</div>
        <div style={placeholderStyles}>
          <div>No risks available.</div>
          <div style={{ fontSize: "12px", color: "#bdbdbd", marginTop: "4px" }}>
            Risks will be displayed here once the Risk Management module is connected.
          </div>
        </div>
      </div>

      {/* Section 7: Heads-up */}
      <div style={cardStyles}>
        <div style={cardTitleStyles}>
          <FaBell style={{ marginRight: "6px" }} /> Heads-up
        </div>
        <div style={placeholderStyles}>
          <div>No updates available.</div>
          <div style={{ fontSize: "12px", color: "#bdbdbd", marginTop: "4px" }}>
            Important updates and alerts will appear here.
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ ...cardStyles, border: "2px solid #e8ddd4" }}>
        <div style={cardTitleStyles}>Quick Actions</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <button onClick={() => navigate("/governance-calendar")} style={quickActionButtonStyles}>
            <FaCalendarAlt /> Open Calendar
          </button>
          <button onClick={() => navigate(`/raps-actions?meeting=${meeting.id}`)} style={quickActionButtonStyles}>
            <FaClipboardList /> Manage Actions
          </button>
       <button 
        onClick={() => navigate(`/governance-calendar?meeting=${meeting.id}&edit=true`)} 
        style={quickActionButtonStyles}
      >
        ✏️ Edit Meeting
      </button>
        </div>
      </div>
      
    </div>

    
  );
};

export default RapsOverview;