import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import './MeetingDetails.css';

const MeetingDetails = ({ meeting, onAction, onClose }) => {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [allSlots, setAllSlots] = useState([]);
  const [responseMessage, setResponseMessage] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [smeName, setSmeName] = useState('');

  useEffect(() => {
    const fetchSmeDetails = async () => {
      try {
        if (meeting?.smeId) {
          // Path is "/universalProfiles/user.id"
          const smeRef = doc(db, "universalProfiles", meeting.smeId);
          const smeSnap = await getDoc(smeRef);

          if (smeSnap.exists()) {
            const data = smeSnap.data();

            // Check multiple possible name locations in the document
            const name =
              data?.entityOverview?.registeredName || // First priority
              data?.entityOverview?.tradingName ||   // Second priority
              data?.contactDetails?.contactName ||  // Third priority
              meeting?.smeName ||                  // Fallback to meeting data
              'SME';                              // Final fallback

            setSmeName(name);
          } else {
            // If document doesn't exist, use meeting.smeName if available
            setSmeName(meeting?.smeName || 'SME');
          }
        } else {
          // If no smeId, use meeting.smeName if available
          setSmeName(meeting?.smeName || 'SME');
        }
      } catch (err) {
        console.error('Failed to fetch SME details:', err);
        // If any error occurs, use meeting.smeName if available
        setSmeName(meeting?.smeName || 'SME');
      }
    };

    const fetchOriginalSlots = async () => {
      try {
        if (meeting?.id) {
          const eventRef = doc(db, "smeCalendarEvents", meeting.id);
          const eventSnap = await getDoc(eventRef);

          if (eventSnap.exists()) {
            const eventData = eventSnap.data();
            if (eventData.availableDates) {
              const slots = eventData.availableDates.map(slot => ({
                id: `${meeting.id}-${slot.date}`,
                date: new Date(slot.date),
                timeSlots: slot.timeSlots,
                timeZone: slot.timeZone || "Africa/Johannesburg",
                status: slot.status || "unavailable"
              }));
              setAllSlots(slots);

              const confirmedSlot = slots.find(slot => slot.status === "scheduled");
              if (confirmedSlot) {
                setSelectedSlot(confirmedSlot);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch original slots:', err);
      }
    };

    fetchSmeDetails();
    fetchOriginalSlots();
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

  const handleAccept = () => {
    showResponseMessage('Meeting confirmed!');
    if (onAction) {
      onAction(meeting.id, 'completed');
    }
  };

  const handleReject = () => {
    showResponseMessage('Meeting declined.');
    if (onAction) {
      onAction(meeting.id, 'cancelled');
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="#8C6842" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>SME</span>
              </div>
              <div className="info-value">{smeName}</div>
            </div>

            <div className="info-row">
              <div className="info-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.657 16.657L13.414 20.9C13.039 21.2746 13.0306 21.4852 12.0005 21.4852C11.4704 21.4852 10.962 21.2746 10.587 20.9L6.343 16.657C5.22422 15.5382 4.46234 14.1127 4.15369 12.5609C3.84504 11.009 4.00349 9.4005 4.60901 7.93871C5.21452 6.47693 6.2399 5.22749 7.55548 4.34846C8.87107 3.46943 10.4178 3.00024 12 3.00024C13.5822 3.00024 15.1289 3.46943 16.4445 4.34846C17.7601 5.22749 18.7855 6.47693 19.391 7.93871C19.9965 9.4005 20.155 11.009 19.8463 12.5609C19.5377 14.1127 18.7758 15.5382 17.657 16.657Z" stroke="#8C6842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Location</span>
              </div>
              <div className="info-value">{meeting.location}</div>
            </div>

            <div className="info-row">
              <div className="info-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#8C6842" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>Meeting Slots</span>
              </div>
              <div className="info-value slots-container">
                {allSlots.length > 0 ? (
                  allSlots.map((slot, index) => (
                    <div
                      key={index}
                      className={`time-slot ${slot.status === 'scheduled' ? 'selected' : ''} ${slot.status}`}
                    >
                      <div className="slot-date">{formatDate(slot.date)}</div>
                      <div className="slot-time">
                        {slot.timeSlots && slot.timeSlots.length > 0 ?
                          formatTimeSlot(slot.timeSlots[0]) : 'No time specified'}
                        ({slot.timeZone || 'No timezone specified'})
                      </div>
                      {slot.status === 'scheduled' && (
                        <div className="slot-status">Confirmed</div>
                      )}
                      {slot.status === 'unavailable' && (
                        <div className="slot-status">Not Selected</div>
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
                    <div className="slot-status">Confirmed</div>
                  </div>
                )}
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
                Mark as Completed
              </button>
              <button
                className="reject-btn"
                onClick={handleReject}
                disabled={isProcessing}
              >
                Cancel Meeting
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingDetails;