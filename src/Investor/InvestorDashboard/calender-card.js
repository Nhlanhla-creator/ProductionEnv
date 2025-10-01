"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { CalendarIcon, Plus, X, ChevronLeft, ChevronRight, Mail } from "lucide-react"
import styles from "./calender-card.module.css"
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";

export function CalendarCard() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showFullCalendar, setShowFullCalendar] = useState(false)
  const [showDeadlineModal, setShowDeadlineModal] = useState(false)
  const [newDeadline, setNewDeadline] = useState({ title: "", date: "", type: "meeting" })
  const [deadlines, setDeadlines] = useState([
    { date: 15, title: "Tax Submission", type: "deadline" },
    { date: 30, title: "Compliance Review", type: "deadline" },
  ])
  const [upcomingEvents, setUpcomingEvents] = useState([
    { title: "Investor Meetup", date: "May 15, 2023", type: "meeting" },
  ])
  const [isOutlookConnected, setIsOutlookConnected] = useState(false)
  const [isIconBouncing, setIsIconBouncing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showEventList, setShowEventList] = useState(true)

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    const bounceInterval = setInterval(() => {
      setIsIconBouncing(true)
      setTimeout(() => setIsIconBouncing(false), 1000)
    }, 5000)
    return () => clearInterval(bounceInterval)
  }, [])

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "smeCalendarEvents"), where("funderId", "==", user.uid)); // Optional filter
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => doc.data());

      const newDeadlines = fetched.map(ev => ({
        date: new Date(ev.date).getDate(), // for calendar dots
        title: ev.title,
        type: ev.type,
      }));

      const newUpcoming = fetched.map(ev => ({
        title: ev.title,
        date: new Date(ev.date).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric"
        }),
        type: ev.type,
      }));

      setDeadlines(newDeadlines);
      setUpcomingEvents(newUpcoming);
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    if (showFullCalendar || showDeadlineModal) {
      document.body.classList.add("modal-open")
    } else {
      document.body.classList.remove("modal-open")
    }
    return () => {
      document.body.classList.remove("modal-open")
    }
  }, [showFullCalendar, showDeadlineModal])

  const handleDayClick = (day) => {
    setNewDeadline({
      title: "",
      date: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(
        2,
        "0",
      )}`,
      type: "meeting",
    })
    setShowDeadlineModal(true)
    setShowEventList(false)
    setShowFullCalendar(false)
  }

  const addDeadline = () => {
    if (newDeadline.title.trim() && newDeadline.date) {
      const day = new Date(newDeadline.date).getDate()
      setDeadlines([...deadlines, { date: day, title: newDeadline.title, type: newDeadline.type }])
      const formattedDate = new Date(newDeadline.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      setUpcomingEvents([
        ...upcomingEvents,
        {
          title: newDeadline.title,
          date: formattedDate,
          type: newDeadline.type,
        },
      ])
      setShowDeadlineModal(false)
      setNewDeadline({ title: "", date: "", type: "meeting" })
      setShowEventList(true)
    }
  }

  const handleOutlookConnect = () => {
    setIsOutlookConnected(!isOutlookConnected)
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const renderFullCalendarModal = () => {
    if (!showFullCalendar) return null

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContainer}>
          <div className={styles.modalHeader}>
            <h3>Calendar</h3>
            <button className={styles.closeBtn} onClick={() => setShowFullCalendar(false)}>
              <X size={20} />
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.fullCalendar}>
              <div className={styles.monthNavigation}>
                <button className={styles.monthNavBtn} onClick={goToPreviousMonth}>
                  <ChevronLeft size={20} />
                </button>
                <span className={styles.currentMonthFull}>
                  {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
                </span>
                <button className={styles.monthNavBtn} onClick={goToNextMonth}>
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className={styles.fullCalendarGrid}>
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                  <div key={day} className={styles.dayHeaderFull}>
                    {day.substring(0, 3)}
                  </div>
                ))}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className={styles.emptyDayFull}></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const isDeadline = deadlines.some((d) => d.date === day)
                  const isToday =
                    day === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear()
                  return (
                    <div
                      key={`day-${day}`}
                      className={`${styles.calendarDayFull} ${isDeadline ? styles.hasEvent : ""} ${isToday ? styles.today : ""
                        }`}
                      onClick={() => handleDayClick(day)}
                    >
                      <span className={styles.dayNumber}>{day}</span>
                      {isDeadline && (
                        <div className={styles.dayEvents}>
                          {deadlines
                            .filter((d) => d.date === day)
                            .map((deadline, idx) => (
                              <div key={idx} className={styles.dayEventIndicator}>
                                {deadline.title}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button
              className={styles.addEventBtnFull}
              onClick={() => {
                setShowDeadlineModal(true)
                setShowEventList(true)
                setShowFullCalendar(false)
              }}
            >
              <Plus size={16} /> Add Event
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderAddEventModal = () => {
    if (!showDeadlineModal) return null

    return (
      <div className={styles.modalOverlay}>
        <div className={`${styles.modalContainer} ${styles.eventModal}`}>
          <div className={styles.modalHeader}>
            <h3>{showEventList ? "Upcoming Events" : "New Event"}</h3>
            <button
              className={styles.closeBtn}
              onClick={() => {
                setShowDeadlineModal(false)
                setShowEventList(true)
              }}
            >
              <X size={20} />
            </button>
          </div>
          <div className={styles.modalBody}>
            {showEventList ? (
              <>
                <div className={styles.eventsListModal}>
                  <h4>Upcoming Events</h4>
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event, index) => (
                      <div key={index} className={`${styles.eventItemModal} ${styles[event.type]}`}>
                        <div className={styles.eventIndicator}></div>
                        <div className={styles.eventDetails}>
                          <span className={styles.eventTitle}>{event.title}</span>
                          <span className={styles.eventDate}>{event.date}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.noEvents}>No upcoming events</p>
                  )}
                </div>
                <div className={styles.modalFooter}>
                  <button className={styles.continueBtn} onClick={() => setShowEventList(false)}>
                    Add New Event
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.formGroup}>
                  <label>Title</label>
                  <input
                    type="text"
                    value={newDeadline.title}
                    onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
                    placeholder="Enter event title"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Date</label>
                  <input
                    type="date"
                    value={newDeadline.date}
                    onChange={(e) => setNewDeadline({ ...newDeadline, date: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Event Type</label>
                  <select
                    value={newDeadline.type}
                    onChange={(e) => setNewDeadline({ ...newDeadline, type: e.target.value })}
                  >
                    <option value="meeting">Meeting</option>
                    <option value="deadline">Deadline</option>
                    <option value="workshop">Workshop</option>
                  </select>
                </div>
                <div className={styles.modalFooter}>
                  <button className={styles.cancelBtn} onClick={() => setShowEventList(true)}>
                    Back
                  </button>
                  <button className={styles.saveBtn} onClick={addDeadline}>
                    Add Event
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.calendarCard}>
        <div className={styles.cardHeader}>
          <h3>Calendar & Events</h3>
          <button
            className={`${styles.outlookBtn} ${isOutlookConnected ? styles.connected : ""}`}
            onClick={handleOutlookConnect}
            title={isOutlookConnected ? "Connected to Outlook" : "Connect to Outlook"}
          >
            <Mail size={20} />
            {isOutlookConnected && <span className={styles.connectedIndicator}></span>}
          </button>
        </div>

        <div className={styles.monthHeader}>
          <button className={styles.monthNavBtn} onClick={goToPreviousMonth}>
            <ChevronLeft size={16} />
          </button>
          <span className={styles.currentMonth}>
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </span>
          <button className={styles.monthNavBtn} onClick={goToNextMonth}>
            <ChevronRight size={16} />
          </button>
          <button
            className={`${styles.viewCalendarBtn} ${isIconBouncing ? styles.bounce : ""}`}
            onClick={() => setShowFullCalendar(true)}
            onMouseEnter={() => setIsIconBouncing(true)}
            onMouseLeave={() => setIsIconBouncing(false)}
          >
            <CalendarIcon size={20} />
          </button>
        </div>

        <div className={styles.upcomingSection}>
          <h4>Upcoming</h4>
          <div className={styles.eventsList}>
            {upcomingEvents.map((event, index) => (
              <div key={index} className={`${styles.eventItem} ${styles[event.type]}`}>
                <div className={styles.eventIndicator}></div>
                <div className={styles.eventDetails}>
                  <span className={styles.eventTitle}>{event.title}</span>
                  <span className={styles.eventDate}>{event.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          className={styles.addEventBtn}
          onClick={() => {
            setShowDeadlineModal(true)
            setShowEventList(true)
          }}
        >
          <Plus size={14} /> Add Event
        </button>
      </div>

      {isMounted && (
        <>
          {showFullCalendar && createPortal(renderFullCalendarModal(), document.body)}
          {showDeadlineModal && createPortal(renderAddEventModal(), document.body)}
        </>
      )}
    </>
  )
}
