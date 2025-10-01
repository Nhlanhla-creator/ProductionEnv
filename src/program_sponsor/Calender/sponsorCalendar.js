import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from './modal.js';
import CreateEventForm from './createEventForm.js';
import MeetingDetails from './meetingDetails.js';
import './meetings.css';
import { db } from '../../firebaseConfig.js';
import { getAuth } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';

const CalendarPopup = ({ events, availabilities, onClose, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);
    return days;
  };

  const getEventsForDate = (day) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => {
      const eventDate = new Date(event.date);
      const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
      return eventDateStr === dateStr;
    });
  };

  const getAvailabilityForDate = (day) => {
    if (!day || !availabilities) return null;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return availabilities.find(avail => {
      const availDate = new Date(avail.date);
      const availDateStr = `${availDate.getFullYear()}-${String(availDate.getMonth() + 1).padStart(2, '0')}-${String(availDate.getDate()).padStart(2, '0')}`;
      return availDateStr === dateStr;
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    if (!day) return;
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    onDateSelect && onDateSelect(clickedDate);
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="calendar-popup">
      <div className="calendar-header">
        <button onClick={goToPreviousMonth}><ChevronLeft size={20} /></button>
        <h3>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
        <button onClick={goToNextMonth}><ChevronRight size={20} /></button>
      </div>

      <div className="calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const availability = getAvailabilityForDate(day);
          const hasEvents = dayEvents.length > 0;
          const hasAvailability = availability?.timeSlots?.length > 0;
          const isSelected = selectedDate &&
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentDate.getMonth() &&
            selectedDate.getFullYear() === currentDate.getFullYear();

          return (
            <div
              key={index}
              className={`calendar-day ${hasEvents ? 'has-events' : ''} ${hasAvailability ? 'has-availability' : ''} ${isSelected ? 'selected' : ''}`}
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
                    <div className="availability-indicator" title={`Available: ${availability.timeSlots[0].start} - ${availability.timeSlots[0].end}`}>
                      📅
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className="selected-date-events">
          <h4>Events on {selectedDate.toDateString()}:</h4>
          {getEventsForDate(selectedDate.getDate()).map(event => (
            <div key={event.id} className="calendar-event-item">
              <span className={`event-status ${event.status}`}></span>
              <span>{event.title} - {event.location}</span>
            </div>
          ))}

          {/* Show availability safely */}
          {(() => {
            const availability = getAvailabilityForDate(selectedDate.getDate());
            if (availability?.timeSlots?.length > 0) {
              return (
                <div className="availability-info">
                  <h5>Available Time:</h5>
                  <p>{availability.timeSlots[0].start} - {availability.timeSlots[0].end} ({availability.timeZone})</p>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      <button className="close-calendar" onClick={onClose}>Close</button>
    </div>
  );
};

const Meetings = ({ stats, setStats }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [smeNames, setSmeNames] = useState({}); // Store SME names by ID

  // Function to fetch SME name
  const fetchSmeName = async (smeId) => {
    try {
      if (!smeId) return 'SME';

      // Check if we already have this name cached
      if (smeNames[smeId]) return smeNames[smeId];

      const smeRef = doc(db, "universalProfiles", smeId);
      const smeSnap = await getDoc(smeRef);

      if (smeSnap.exists()) {
        const data = smeSnap.data();
        const name = data?.entityOverview?.registeredName ||
          data?.entityOverview?.tradingName ||
          data?.contactDetails?.contactName ||
          'SME';

        // Cache the name
        setSmeNames(prev => ({ ...prev, [smeId]: name }));
        return name;
      }
      return 'SME';
    } catch (err) {
      console.error('Error fetching SME name:', err);
      return 'SME';
    }
  };

  // Function to determine requester info
  const getRequesterInfo = (meeting) => {
    // For program sponsors, meetings are typically requested by SMEs
    if (meeting.smeId) {
      return {
        requestedBy: 'SME',
        requesterName: meeting.smeName || 'SME'
      };
    }
    
    // If it's from another program sponsor
    if (meeting.sponsorId || meeting.type === 'sponsor') {
      return {
        requestedBy: 'Program Sponsor',
        requesterName: meeting.sponsorName || 'Program Sponsor'
      };
    }
    
    // Default fallback
    return {
      requestedBy: 'SME',
      requesterName: meeting.smeName || 'SME'
    };
  };

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "smeCalendarEvents"),
      where("funderId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const meetingsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
        const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();

        // Fetch SME name
        const smeName = await fetchSmeName(data.smeId);

        return {
          id: doc.id,
          title: data.title || "Meeting",
          smeName: smeName,
          date: scheduledDate,
          timeSlots: data.scheduledTimeSlot ? [data.scheduledTimeSlot] : [],
          timeZone: data.scheduledTimeSlot?.timeZone || "Africa/Johannesburg",
          location: data.location || "Virtual",
          status: data.status || "scheduled",
          smeId: data.smeId,
          funderId: data.funderId,
          createdAt,
          updatedAt
        };
      }));

      // Filter out meetings without a scheduled date
      const validMeetings = meetingsData.filter(meeting => meeting.date !== null);

      setMeetings(validMeetings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateEvent = (newEvent) => {
    setMeetings([...meetings, newEvent]);
    setStats(prev => ({ ...prev, created: prev.created + 1 }));
    setShowCreateModal(false);
  };

  const handleMeetingAction = (id, action) => {
    const updatedMeetings = meetings.map(meeting => {
      if (meeting.id === id) {
        return { ...meeting, status: action };
      }
      return meeting;
    });

    setMeetings(updatedMeetings);

    if (action === 'completed') {
      setStats(prev => ({ ...prev, completed: prev.completed + 1 }));
    } else if (action === 'cancelled') {
      setStats(prev => ({ ...prev, cancelled: prev.cancelled + 1 }));
    } else if (action === 'rescheduled') {
      setStats(prev => ({ ...prev, rescheduled: prev.rescheduled + 1 }));
    }

    setSelectedMeeting(null);
  };

  const filteredMeetings = meetings.filter(meeting => {
    const meetingDate = meeting.date;
    const now = new Date();

    if (activeTab === 'upcoming') {
      return meetingDate > now && meeting.status === 'scheduled';
    } else if (activeTab === 'past') {
      return meetingDate < now;
    } else if (activeTab === 'pending') {
      return meeting.status === 'pending';
    }
    return true;
  });

  const formatMeetingTime = (meeting) => {
    if (!meeting.date) return "No date scheduled";

    return meeting.date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ` (${meeting.timeZone})`;
  };

  if (loading) {
    return <div className="loading-container">Loading meetings...</div>;
  }

  return (
    <div className="meetings-container" style={{ width: '100%', maxWidth: '100%' }}>
      <div className="meetings-header">
        <h2>Meetings</h2>
        <div className="header-buttons">
          <button
            className="create-event-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            Create Event
          </button>
          <button
            className="calendar-btn"
            onClick={() => setShowCalendar(true)}
          >
            <CalendarIcon size={16} />
            Calendar
          </button>
        </div>
      </div>

      <div className="meetings-tabs">
        <button
          className={activeTab === 'upcoming' ? 'active' : ''}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={activeTab === 'pending' ? 'active' : ''}
          onClick={() => setActiveTab('pending')}
        >
          Pending
        </button>
        <button
          className={activeTab === 'past' ? 'active' : ''}
          onClick={() => setActiveTab('past')}
        >
          Past
        </button>
      </div>

      <div className="table-container">
        <table className="meetings-table">
          <thead>
            <tr>
              <th>Meeting Purpose</th>
              <th>Requested By</th>
              <th>Requester Name</th>
              <th>Date & Time</th>
              <th>Location</th>
              <th>Status</th>
              <th>Action</th>
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
              filteredMeetings.map(meeting => {
                const requesterInfo = getRequesterInfo(meeting);
                return (
                  <tr key={meeting.id}>
                    <td className="event-title" data-label="Meeting Purpose">{meeting.title}</td>
                    <td data-label="Requested By">{requesterInfo.requestedBy}</td>
                    <td data-label="Requester Name">{requesterInfo.requesterName}</td>
                    <td className="event-date" data-label="Date">
                      {formatMeetingTime(meeting)}
                    </td>
                    <td className="event-location" data-label="Location">{meeting.location}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${meeting.status}`}>
                        {meeting.status}
                      </span>
                    </td>
                    <td data-label="Action">
                      <button
                        className="view-meeting-btn"
                        onClick={() => setSelectedMeeting(meeting)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <CreateEventForm
            onSubmit={handleCreateEvent}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {showCalendar && (
        <Modal onClose={() => setShowCalendar(false)}>
          <CalendarPopup
            events={meetings}
            onClose={() => setShowCalendar(false)}
          />
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
  );
};

export default Meetings;