"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import Modal from "./Modal.js"
import CreateEventForm from "./CreateEventForm.js"
import MeetingDetails from "./MeetingDetails.js"
import "./Meetings.css"
import { db } from "../../firebaseConfig.js" // Adjust the import path as necessary
import { getAuth } from "firebase/auth"
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"

const CalendarPopup = ({ events, availabilities, onClose, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) days.push(day)
    return days
  }

  const getEventsForDate = (day) => {
    if (!day) return []
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}`
      return eventDateStr === dateStr
    })
  }

  const getAvailabilityForDate = (day) => {
    if (!day || !availabilities) return null
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return availabilities.find((avail) => {
      const availDate = new Date(avail.date)
      const availDateStr = `${availDate.getFullYear()}-${String(availDate.getMonth() + 1).padStart(2, "0")}-${String(availDate.getDate()).padStart(2, "0")}`
      return availDateStr === dateStr
    })
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDateClick = (day) => {
    if (!day) return
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(clickedDate)
    onDateSelect && onDateSelect(clickedDate)
  }

  const days = getDaysInMonth(currentDate)

  return (
    <div className="calendar-popup">
      <div className="calendar-header">
        <button onClick={goToPreviousMonth}>
          <ChevronLeft size={20} />
        </button>
        <h3>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button onClick={goToNextMonth}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="calendar-weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day)
          const availability = getAvailabilityForDate(day)
          const hasEvents = dayEvents.length > 0
          const hasAvailability = availability?.timeSlots?.length > 0
          const isSelected =
            selectedDate &&
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentDate.getMonth() &&
            selectedDate.getFullYear() === currentDate.getFullYear()

          return (
            <div
              key={index}
              className={`calendar-day ${hasEvents ? "has-events" : ""} ${hasAvailability ? "has-availability" : ""} ${isSelected ? "selected" : ""}`}
              onClick={() => handleDateClick(day)}
            >
              {day && (
                <>
                  <span className="day-number">{day}</span>
                  {hasEvents && (
                    <div className="event-indicators">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div key={i} className={`event-dot ${event.status}`} title={event.title}></div>
                      ))}
                      {dayEvents.length > 3 && <span className="more-events">+{dayEvents.length - 3}</span>}
                    </div>
                  )}
                  {hasAvailability && (
                    <div
                      className="availability-indicator"
                      title={`Available: ${availability.timeSlots[0].start} - ${availability.timeSlots[0].end}`}
                    >
                      📅
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {selectedDate && (
        <div className="selected-date-events">
          <h4>Events on {selectedDate.toDateString()}:</h4>
          {getEventsForDate(selectedDate.getDate()).map((event) => (
            <div key={event.id} className="calendar-event-item">
              <span className={`event-status ${event.status}`}></span>
              <span>
                {event.title} - {event.location}
              </span>
            </div>
          ))}

          {/* Show availability safely */}
          {(() => {
            const availability = getAvailabilityForDate(selectedDate.getDate())
            if (availability?.timeSlots?.length > 0) {
              return (
                <div className="availability-info">
                  <h5>Available Time:</h5>
                  <p>
                    {availability.timeSlots[0].start} - {availability.timeSlots[0].end} ({availability.timeZone})
                  </p>
                </div>
              )
            }
            return null
          })()}
        </div>
      )}

      <button className="close-calendar" onClick={onClose}>
        Close
      </button>
    </div>
  )
}

const Meetings = ({ stats, setStats }) => {
  const [activeTab, setActiveTab] = useState("upcoming")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 7)),
  })
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          const hasCollapsedClass = document.body.classList.contains("sidebar-collapsed")
          setIsSidebarCollapsed(hasCollapsedClass)
        }
      })
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    // Check initial state
    setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const unsubscribeAuth = getAuth().onAuthStateChanged(async (user) => {
      if (!user) return

      // Query both collections
      const q1 = query(collection(db, "smeCalendarEvents"), where("smeId", "==", user.uid))
      const q2 = query(collection(db, "supplierCalendarEvents"), where("supplierId", "==", user.uid))

      const processCombinedSnapshot = async (snapshot1, snapshot2) => {
        const allDocs = [...snapshot1.docs, ...snapshot2.docs]
        const groupedMeetings = {}

        for (const docSnap of allDocs) {
          const data = docSnap.data()
          const counterpartId = data.customerId || data.funderId
          const groupKey = `${counterpartId}-${data.title}`

          if (!groupedMeetings[groupKey]) {
            let requesterName = ""
            let requesterType = ""
            let requesterId = ""

            // Determine requester type and ID
            if (data.funderId) {
              requesterType = "Investor"
              requesterId = data.funderId
            } else if (data.customerId) {
              requesterType = "Customer"
              requesterId = data.customerId
            } else if (data.smeId) {
              requesterType = "SME"
              requesterId = data.smeId
            } else if (docSnap.ref.parent.id === "supplierCalendarEvents") {
              requesterType = "Supplier"
            } else {
              requesterType = "SME"
            }

            // Fetch requester details if we have an ID
            if (requesterId) {
              try {
                const requesterDoc = await getDoc(doc(db, "MyuniversalProfiles", requesterId))
                if (requesterDoc.exists()) {
                  const formData = requesterDoc.data()?.formData

                  // For SME, get the registeredName from entityOverview
                  if (requesterType === "SME") {
                    requesterName =
                      formData?.entityOverview?.registeredName || formData?.contactDetails?.primaryContactName || "SME"
                  }
                  // For Investor, get from fundManageOverview
                  else if (requesterType === "Investor") {
                    requesterName =
                      formData?.fundManageOverview?.registeredName ||
                      formData?.contactDetails?.primaryContactName ||
                      "Investor"
                  }
                  // For Customer, get from appropriate section
                  else if (requesterType === "Customer") {
                    requesterName =
                      formData?.entityOverview?.registeredName ||
                      formData?.contactDetails?.primaryContactName ||
                      "Customer"
                  }
                  // Fallback for any other type
                  else {
                    requesterName =
                      formData?.entityOverview?.registeredName ||
                      formData?.contactDetails?.primaryContactName ||
                      requesterType
                  }
                }
              } catch (err) {
                console.warn("Error fetching requester details:", err)
                requesterName = requesterType // Fallback to type
              }
            }

            // If we still don't have a name, use the type
            if (!requesterName) {
              requesterName = requesterType
            }

            groupedMeetings[groupKey] = {
              id: groupKey,
              docId: docSnap.id,
              title: data.title || "Meeting", // Keep title for backward compatibility
              meetingPurpose: data.title || "Meeting", // Add meetingPurpose
              requesterName,
              requesterType,
              requesterId,
              counterpartId,
              smeAppId: data.smeAppId,
              investorAppId: data.investorAppId,
              location: data.location || "Virtual",
              slots: [],
              isExpanded: false,
              status: data.status || "pending",
              collection: docSnap.ref.parent.id,
              date: null, // Will be set based on slots
              timeSlots: [],
              timeZone: "Africa/Johannesburg",
            }
          }
          // Process available dates/slots
          ;(data.availableDates || []).forEach((slot) => {
            const parsedDate = slot.date?.toDate ? slot.date.toDate() : new Date(slot.date)
            groupedMeetings[groupKey].slots.push({
              id: `${docSnap.id}-${slot.date}`,
              ...slot,
              date: parsedDate,
              location: data.location,
              status: slot.status || "available",
            })
          })

          // Set the earliest date as the main date for compatibility with existing code
          if (groupedMeetings[groupKey].slots.length > 0) {
            const sortedSlots = groupedMeetings[groupKey].slots.sort((a, b) => a.date - b.date)
            groupedMeetings[groupKey].date = sortedSlots[0].date
            groupedMeetings[groupKey].timeSlots = sortedSlots.map((slot) => ({
              start: slot.startTime || "TBD",
              end: slot.endTime || "TBD",
              timeZone: slot.timeZone || "Africa/Johannesburg",
            }))
          }

          if (data.status) {
            groupedMeetings[groupKey].status = data.status
          }
        }

        setMeetings(Object.values(groupedMeetings))
        setLoading(false)
      }

      let snapshot1, snapshot2
      let hasSnapshot1 = false
      let hasSnapshot2 = false

      const unsub1 = onSnapshot(q1, (snap) => {
        snapshot1 = snap
        hasSnapshot1 = true
        if (hasSnapshot1 && hasSnapshot2) {
          processCombinedSnapshot(snapshot1, snapshot2)
        }
      })

      const unsub2 = onSnapshot(q2, (snap) => {
        snapshot2 = snap
        hasSnapshot2 = true
        if (hasSnapshot1 && hasSnapshot2) {
          processCombinedSnapshot(snapshot1, snapshot2)
        }
      })

      return () => {
        unsub1()
        unsub2()
      }
    })

    return () => unsubscribeAuth()
  }, [])

  const handleCreateEvent = (newEvent) => {
    setMeetings([...meetings, newEvent])
    setStats((prev) => ({ ...prev, created: prev.created + 1 }))
    setShowCreateModal(false)
  }

  const handleMeetingAction = (id, action) => {
    const updatedMeetings = meetings.map((meeting) => {
      if (meeting.id === id) {
        return { ...meeting, status: action }
      }
      return meeting
    })

    setMeetings(updatedMeetings)

    if (action === "completed") {
      setStats((prev) => ({ ...prev, completed: prev.completed + 1 }))
    } else if (action === "cancelled") {
      setStats((prev) => ({ ...prev, cancelled: prev.cancelled + 1 }))
    } else if (action === "rescheduled") {
      setStats((prev) => ({ ...prev, rescheduled: prev.rescheduled + 1 }))
    }

    setSelectedMeeting(null)
  }

  const filteredMeetings = meetings.filter((meeting) => {
    const now = new Date()
    const validSlots = meeting.slots.filter((slot) => slot.date instanceof Date)

    if (validSlots.length === 0) return false

    if (activeTab === "upcoming") {
      return meeting.status === "scheduled" && validSlots.some((slot) => slot.date > now)
    } else if (activeTab === "past") {
      return meeting.status === "completed" || validSlots.every((slot) => slot.date < now)
    } else if (activeTab === "pending") {
      return meeting.status === "pending" || validSlots.some((slot) => slot.status === "pending")
    } else if (activeTab === "range") {
      return validSlots.some((slot) => slot.date >= dateRange.start && slot.date <= dateRange.end)
    }
    return true
  })

  const formatMeetingTime = (meeting) => {
    if (!meeting.slots || meeting.slots.length === 0) return "No date scheduled"

    // Show the first available slot's date and time
    const firstSlot = meeting.slots.sort((a, b) => a.date - b.date)[0]
    return (
      firstSlot.date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + ` (${firstSlot.timeZone || meeting.timeZone})`
    )
  }

  if (loading) {
    return <div className="loading-container">Loading meetings...</div>
  }

  return (
    <div
      className="meetings-container"
      style={{
        paddingLeft: isSidebarCollapsed ? "100px" : "270px",
        transition: "padding-left 0.3s ease",
      }}
    >
      <div className="meetings-header">
        <h2>Meetings</h2>
        <div className="header-buttons">
          <button className="calendar-btn" onClick={() => setShowCalendar(true)}>
            <CalendarIcon size={16} />
            Calendar
          </button>
        </div>
      </div>

      <div className="meetings-tabs">
        <button className={activeTab === "upcoming" ? "active" : ""} onClick={() => setActiveTab("upcoming")}>
          Upcoming
        </button>
        <button className={activeTab === "pending" ? "active" : ""} onClick={() => setActiveTab("pending")}>
          Pending
        </button>
        <button className={activeTab === "past" ? "active" : ""} onClick={() => setActiveTab("past")}>
          Past
        </button>
        <button className={activeTab === "range" ? "active" : ""} onClick={() => setActiveTab("range")}>
          Date Range
        </button>
      </div>

      {activeTab === "range" && (
        <div className="date-range-selector">
          <input
            type="date"
            value={dateRange.start.toISOString().split("T")[0]}
            onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.end.toISOString().split("T")[0]}
            onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
          />
        </div>
      )}

      <div className="table-container">
        <table className="meetings-table" style={{ fontSize: "0.875rem" }}>
          <thead>
            <tr>
              <th style={{ fontSize: "0.8rem", padding: "12px 8px" }}>Meeting Purpose</th>
              <th style={{ fontSize: "0.8rem", padding: "12px 8px", minWidth: "80px" }}>Requested By</th>
              <th style={{ fontSize: "0.8rem", padding: "12px 8px" }}>Requester Name</th>
              <th style={{ fontSize: "0.8rem", padding: "12px 8px" }}>Date & Time</th>
              <th style={{ fontSize: "0.8rem", padding: "12px 8px" }}>Location</th>
              <th style={{ fontSize: "0.8rem", padding: "12px 8px" }}>Status</th>
              <th style={{ fontSize: "0.8rem", padding: "12px 8px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredMeetings.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-meetings">
                  No {activeTab} meetings found
                </td>
              </tr>
            ) : (
              filteredMeetings.map((meeting) => (
                <tr key={meeting.id} style={{ fontSize: "0.875rem" }}>
                  <td className="event-title" data-label="Meeting Purpose" style={{ padding: "12px 8px" }}>
                    {meeting.meetingPurpose || meeting.title}
                  </td>
                  <td
                    className="event-requester-type"
                    data-label="Requested By"
                    style={{ padding: "12px 8px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                  >
                    {meeting.requesterType}
                  </td>
                  <td className="event-requester-name" data-label="Requester Name" style={{ padding: "12px 8px" }}>
                    {meeting.requesterName}
                  </td>
                  <td className="event-date" data-label="Date" style={{ padding: "12px 8px" }}>
                    {meeting.slots.length > 0 ? (
                      <span style={{ color: "#8D6E63", fontWeight: 600, fontSize: "0.8rem" }}>
                        {meeting.slots.length} available slots
                      </span>
                    ) : (
                      "No dates available"
                    )}
                  </td>
                  <td className="event-location" data-label="Location" style={{ padding: "12px 8px" }}>
                    {meeting.location}
                  </td>
                  <td data-label="Status" style={{ padding: "12px 8px" }}>
                    <span className={`status-badge ${meeting.status}`} style={{ fontSize: "0.75rem" }}>
                      {meeting.status}
                    </span>
                  </td>
                  <td data-label="Action" style={{ padding: "12px 8px" }}>
                    <button
                      className="view-meeting-btn"
                      onClick={() => setSelectedMeeting(meeting)}
                      style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <CreateEventForm onSubmit={handleCreateEvent} onCancel={() => setShowCreateModal(false)} />
        </Modal>
      )}

      {showCalendar && (
        <Modal onClose={() => setShowCalendar(false)}>
          <CalendarPopup events={meetings} onClose={() => setShowCalendar(false)} />
        </Modal>
      )}

      {selectedMeeting && (
        <Modal onClose={() => setSelectedMeeting(null)}>
          <MeetingDetails
            meeting={selectedMeeting}
            onAction={handleMeetingAction}
            onClose={() => setSelectedMeeting(null)}
          />
        </Modal>
      )}
    </div>
  )
}

export default Meetings
