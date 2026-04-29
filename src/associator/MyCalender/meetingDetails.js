import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import { Check, X, Clock, Calendar, MapPin, Info } from 'lucide-react';
import './meetingDetails.css';

const MeetingDetails = ({ meeting, onAction, onClose }) => {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [allSlots, setAllSlots] = useState([]);
  const [responseMessage, setResponseMessage] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sponsorName, setSponsorName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchSponsorDetails = async () => {
      try {
        if (meeting?.sponsorId) {
          const sponsorRef = doc(db, "universalProfiles", meeting.sponsorId);
          const sponsorSnap = await getDoc(sponsorRef);

          if (sponsorSnap.exists()) {
            const data = sponsorSnap.data();
            const name = data?.registerName || data?.contactName || 'Sponsor';
            setSponsorName(name);
          } else {
            setSponsorName(meeting?.sponsorName || 'Sponsor');
          }
        } else {
          setSponsorName(meeting?.sponsorName || 'Sponsor');
        }
      } catch (err) {
        console.error('Failed to fetch sponsor details:', err);
        setSponsorName(meeting?.sponsorName || 'Sponsor');
      }
    };

    const fetchAvailableSlots = async () => {
      try {
        if (meeting?.applicationId) {
          const appRef = doc(db, "internshipApplications", meeting.applicationId);
          const appSnap = await getDoc(appRef);

          if (appSnap.exists()) {
            const appData = appSnap.data();
            if (appData.availableDates) {
              const slots = appData.availableDates.map(slot => ({
                id: `${meeting.applicationId}-${slot.date}`,
                date: new Date(slot.date),
                timeSlots: slot.timeSlots || [{ 
                  start: "09:00", 
                  end: "17:00",
                  timeZone: slot.timeZone || "Africa/Johannesburg"
                }],
                timeZone: slot.timeZone || "Africa/Johannesburg",
                status: slot.status || "available"
              }));
              setAllSlots(slots);

              // If this is a scheduled meeting, mark that slot as selected
              if (meeting.date) {
                const meetingDateStr = meeting.date.toISOString().split('T')[0];
                const selected = slots.find(slot => 
                  slot.date.toISOString().split('T')[0] === meetingDateStr
                );
                if (selected) setSelectedSlot(selected);
              }
            }
          }
        } else if (meeting?.date) {
          // For existing calendar events without application reference
          setAllSlots([{
            id: meeting.id,
            date: meeting.date,
            timeSlots: [meeting.timeSlot || { 
              start: "09:00", 
              end: "17:00",
              timeZone: meeting.timeZone || "Africa/Johannesburg"
            }],
            timeZone: meeting.timeZone || "Africa/Johannesburg",
            status: meeting.status || "scheduled"
          }]);
          setSelectedSlot({
            id: meeting.id,
            date: meeting.date,
            timeSlots: [meeting.timeSlot || { 
              start: "09:00", 
              end: "17:00",
              timeZone: meeting.timeZone || "Africa/Johannesburg"
            }],
            timeZone: meeting.timeZone || "Africa/Johannesburg",
            status: meeting.status || "scheduled"
          });
        }
      } catch (err) {
        console.error('Failed to fetch available slots:', err);
      }
    };

    fetchSponsorDetails();
    fetchAvailableSlots();
  }, [meeting]);

  const formatTimeSlot = (timeSlot) => {
    if (!timeSlot || !timeSlot.start || !timeSlot.end) return 'No time specified';
    return `${timeSlot.start} - ${timeSlot.end}`;
  };

  const formatDate = (date) => {
    if (!date) return 'No date specified';
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleAccept = async () => {
    if (!selectedSlot) {
      setResponseMessage('Please select a time slot');
      setShowResponse(true);
      return;
    }

    setIsProcessing(true);
    try {
      // Update the application's interview details
      if (meeting.applicationId) {
        await updateDoc(doc(db, "internshipApplications", meeting.applicationId), {
          'interviewDetails.date': selectedSlot.date.toISOString(),
          'interviewDetails.time': selectedSlot.timeSlots[0].start,
          'interviewDetails.location': meeting.location,
          'status': 'Interview Scheduled',
          'updatedAt': new Date().toISOString()
        });
      }

      // Update the calendar event if it exists
      if (meeting.id && meeting.id.startsWith('internCalendarEvents')) {
        await updateDoc(doc(db, "internCalendarEvents", meeting.id), {
          scheduledDate: selectedSlot.date.toISOString(),
          scheduledTimeSlot: selectedSlot.timeSlots[0],
          status: 'confirmed',
          updatedAt: new Date().toISOString()
        });
      }

      showResponseMessage('Meeting confirmed!');
      if (onAction) {
        onAction(meeting.id, 'confirmed');
      }
    } catch (error) {
      console.error("Error confirming meeting:", error);
      showResponseMessage('Failed to confirm meeting. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      // Update the application status if this is from an application
      if (meeting.applicationId) {
        await updateDoc(doc(db, "internshipApplications", meeting.applicationId), {
          'status': 'Interview Declined',
          'updatedAt': new Date().toISOString()
        });
      }

      // Update the calendar event if it exists
      if (meeting.id && meeting.id.startsWith('internCalendarEvents')) {
        await updateDoc(doc(db, "internCalendarEvents", meeting.id), {
          status: 'declined',
          updatedAt: new Date().toISOString()
        });
      }

      showResponseMessage('Meeting declined.');
      if (onAction) {
        onAction(meeting.id, 'declined');
      }
    } catch (error) {
      console.error("Error declining meeting:", error);
      showResponseMessage('Failed to decline meeting. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const showResponseMessage = (message) => {
    setResponseMessage(message);
    setShowResponse(true);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="meeting-details-container">
      <div className="meeting-details-card">
        <div className="meeting-header">
          <h2>{meeting.title}</h2>
          <button className="close-btn" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#5A3921" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="meeting-content">
          <div className="meeting-info">
            <div className="info-row">
              <div className="info-label">
                <Info size={20} />
                <span>Sponsor</span>
              </div>
              <div className="info-value">{sponsorName}</div>
            </div>

            <div className="info-row">
              <div className="info-label">
                <MapPin size={20} />
                <span>Location</span>
              </div>
              <div className="info-value">{meeting.location}</div>
            </div>

            <div className="info-row">
              <div className="info-label">
                <Calendar size={20} />
                <span>Available Slots</span>
              </div>
              <div className="info-value slots-container">
                {allSlots.length > 0 ? (
                  allSlots.map((slot, index) => (
                    <div
                      key={index}
                      className={`time-slot ${selectedSlot?.id === slot.id ? 'selected' : ''} ${slot.status}`}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      <div className="slot-date">{formatDate(slot.date)}</div>
                      <div className="slot-time">
                        {slot.timeSlots && slot.timeSlots.length > 0 ?
                          formatTimeSlot(slot.timeSlots[0]) : 'No time specified'}
                        ({slot.timeZone || 'No timezone specified'})
                      </div>
                      {selectedSlot?.id === slot.id && (
                        <div className="slot-status">Selected</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="time-slot">
                    <div className="slot-date">{formatDate(meeting.date)}</div>
                    <div className="slot-time">
                      {meeting.timeSlots && meeting.timeSlots.length > 0 ?
                        formatTimeSlot(meeting.timeSlots[0]) : 'No time specified'}
                      ({meeting.timeZone || 'No timezone specified'})
                    </div>
                    <div className="slot-status">Scheduled</div>
                  </div>
                )}
              </div>
            </div>

            <div className="info-row">
              <div className="info-label">
                <Clock size={20} />
                <span>Your Notes</span>
              </div>
              <div className="info-value">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this meeting..."
                  className="notes-textarea"
                />
              </div>
            </div>
          </div>

          {showResponse ? (
            <div className="response-message">
              <p>{responseMessage}</p>
              <button onClick={handleClose} className="close-message-btn">
                Close
              </button>
            </div>
          ) : (
            <div className="meeting-actions">
              <button
                className="accept-btn"
                onClick={handleAccept}
                disabled={isProcessing}
              >
                {isProcessing ? 'Confirming...' : 'Confirm Meeting'}
              </button>
              <button
                className="reject-btn"
                onClick={handleReject}
                disabled={isProcessing}
              >
                {isProcessing ? 'Declining...' : 'Decline Invitation'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingDetails;