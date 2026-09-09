import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import './MeetingDetails.css';

const MeetingDetails = ({ meeting, onAction, onClose }) => {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [allSlots, setAllSlots] = useState([]);
  const [responseMessage, setResponseMessage] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [smeName, setSmeName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [meetingDocId, setMeetingDocId] = useState(null);

  useEffect(() => {
    const fetchSmeDetails = async () => {
      try {
        if (meeting?.smeId) {
          const smeRef = doc(db, "MyuniversalProfiles", meeting.smeId);
          const smeSnap = await getDoc(smeRef);

          if (smeSnap.exists()) {
            const data = smeSnap.data();
            const formData = data?.formData || {};
            
            const name = formData?.entityOverview?.registeredName || 
                        formData?.contactDetails?.primaryContactName || 
                        formData?.entityOverview?.tradingName ||
                        meeting?.smeName || 
                        'SME';

            setSmeName(name);
          } else {
            setSmeName(meeting?.smeName || 'SME');
          }
        } else {
          setSmeName(meeting?.smeName || 'SME');
        }
      } catch (err) {
        console.error('Failed to fetch SME details:', err);
        setSmeName(meeting?.smeName || 'SME');
      }
    };

    const fetchRecipientDetails = async () => {
      try {
        if (meeting?.recipient) {
          const recipientRef = doc(db, "MyuniversalProfiles", meeting.recipient);
          const recipientSnap = await getDoc(recipientRef);

          if (recipientSnap.exists()) {
            const data = recipientSnap.data();
            const formData = data?.formData || {};
            
            const name = formData?.contactDetails?.primaryContactName ||
                        formData?.entityOverview?.registeredName ||
                        formData?.fundManageOverview?.registeredName ||
                        meeting?.recipientName || 
                        'Recipient';

            setRecipientName(name);
          } else {
            setRecipientName(meeting?.recipientName || 'Recipient');
          }
        } else {
          setRecipientName(meeting?.recipientName || 'Recipient');
        }
      } catch (err) {
        console.error('Failed to fetch recipient details:', err);
        setRecipientName(meeting?.recipientName || 'Recipient');
      }
    };

    const findMeetingDocument = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) return null;

        // First try using docId
        if (meeting.docId) {
          try {
            const docRef = doc(db, "smeCalendarEvents", meeting.docId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setMeetingDocId(meeting.docId);
              return docSnap.data();
            }
          } catch (err) {}
        }

        // Try using the id if it's a Firestore doc ID
        if (meeting.id && meeting.id.length > 10) {
          try {
            const docRef = doc(db, "smeCalendarEvents", meeting.id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setMeetingDocId(meeting.id);
              return docSnap.data();
            }
          } catch (err) {}
        }

        // Search by title and date
        if (meeting.title) {
          const q = query(
            collection(db, "smeCalendarEvents"),
            where("smeId", "==", user.uid),
            where("title", "==", meeting.title)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            setMeetingDocId(docSnap.id);
            return docSnap.data();
          }
        }

        return null;
      } catch (error) {
        console.error('Error finding meeting:', error);
        return null;
      }
    };

    const loadMeetingData = async () => {
      const data = await findMeetingDocument();
      
      if (data) {
        // Process slots from the document
        if (data.availableDates && data.availableDates.length > 0) {
          const slots = data.availableDates.map((slot, index) => ({
            id: `${meeting.id}-${index}`,
            date: new Date(slot.date),
            timeSlots: slot.timeSlots || [{ start: meeting.time || 'TBD', end: meeting.time || 'TBD' }],
            timeZone: slot.timeZone || 'Africa/Johannesburg',
            status: slot.status || data.status || 'pending'
          }));
          setAllSlots(slots);
          
          const confirmedSlot = slots.find(s => s.status === 'scheduled');
          if (confirmedSlot) {
            setSelectedSlot(confirmedSlot);
          }
        } else if (meeting.date) {
          // Single date slot
          const slot = {
            id: `${meeting.id}-0`,
            date: new Date(meeting.date),
            timeSlots: meeting.timeSlots || [{ start: meeting.time || 'TBD', end: meeting.time || 'TBD' }],
            timeZone: meeting.timeZone || 'Africa/Johannesburg',
            status: meeting.status || 'pending'
          };
          setAllSlots([slot]);
          if (meeting.status === 'scheduled') {
            setSelectedSlot(slot);
          }
        }
      } else {
        // Fallback: use meeting data directly
        if (meeting.slots && meeting.slots.length > 0) {
          setAllSlots(meeting.slots);
          const confirmedSlot = meeting.slots.find(s => s.status === 'scheduled');
          if (confirmedSlot) {
            setSelectedSlot(confirmedSlot);
          }
        } else if (meeting.date) {
          const slot = {
            id: `${meeting.id}-0`,
            date: new Date(meeting.date),
            timeSlots: meeting.timeSlots || [{ start: meeting.time || 'TBD', end: meeting.time || 'TBD' }],
            timeZone: meeting.timeZone || 'Africa/Johannesburg',
            status: meeting.status || 'pending'
          };
          setAllSlots([slot]);
        }
      }
    };

    fetchSmeDetails();
    fetchRecipientDetails();
    loadMeetingData();
  }, [meeting]);

  const formatTimeSlot = (timeSlot) => {
    if (!timeSlot || !timeSlot.start || !timeSlot.end) return 'No time specified';
    return `${timeSlot.start} - ${timeSlot.end}`;
  };

  const formatDate = (date) => {
    if (!date) return 'No date specified';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleConfirmSlot = async () => {
    setIsProcessing(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        alert('Please log in');
        return;
      }

      const docId = meetingDocId || meeting.docId || meeting.id;
      if (!docId) {
        alert('Could not find meeting document');
        return;
      }

      const meetingRef = doc(db, 'smeCalendarEvents', docId);
      
      // Update the meeting status and slot status
      await updateDoc(meetingRef, {
        status: 'scheduled',
        updatedAt: new Date().toISOString(),
        'availableDates.0.status': 'scheduled'
      });

      showResponseMessage('Meeting slot confirmed successfully!');
      if (onAction) {
        onAction(meeting.id || meeting.docId, 'scheduled');
      }
    } catch (error) {
      console.error('Error confirming slot:', error);
      alert('Failed to confirm slot. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineAll = async () => {
    setIsProcessing(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        alert('Please log in');
        return;
      }

      const docId = meetingDocId || meeting.docId || meeting.id;
      if (!docId) {
        alert('Could not find meeting document');
        return;
      }

      const meetingRef = doc(db, 'smeCalendarEvents', docId);
      
      await updateDoc(meetingRef, {
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
        'availableDates.0.status': 'cancelled'
      });

      showResponseMessage('Meeting declined successfully!');
      if (onAction) {
        onAction(meeting.id || meeting.docId, 'cancelled');
      }
    } catch (error) {
      console.error('Error declining meeting:', error);
      alert('Failed to decline meeting. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
          <h2>{meeting.title || meeting.meetingPurpose || 'Meeting'}</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="meeting-content">
          <div className="meeting-info">
            <div className="info-row">
              <div className="info-label">Role</div>
              <div className="info-value">{meeting.requesterType || 'SME'}</div>
            </div>

            <div className="info-row">
              <div className="info-label">Requested By</div>
              <div className="info-value">{recipientName || meeting.requesterName || 'Unknown'}</div>
            </div>

            <div className="info-row">
              <div className="info-label">Location</div>
              <div className="info-value">{meeting.location || 'Virtual'}</div>
            </div>

            <div className="info-row">
              <div className="info-label">Available Slots</div>
              <div className="info-value slots-container">
                {allSlots.length > 0 ? (
                  allSlots.map((slot, index) => (
                    <div key={index} className={`time-slot ${slot.status === 'scheduled' ? 'selected' : ''}`}>
                      <div className="slot-date">{formatDate(slot.date)}</div>
                      <div className="slot-time">
                        {slot.timeSlots && slot.timeSlots.length > 0 ?
                          formatTimeSlot(slot.timeSlots[0]) : 'No time specified'}
                        ({slot.timeZone || 'Africa/Johannesburg'})
                      </div>
                      <div className="slot-status">{slot.status || 'Pending'}</div>
                    </div>
                  ))
                ) : (
                  <div className="time-slot">
                    <div className="slot-date">{formatDate(meeting.date)}</div>
                    <div className="slot-time">
                      {meeting.timeSlots && meeting.timeSlots.length > 0 ?
                        formatTimeSlot(meeting.timeSlots[0]) : 'No time specified'}
                      ({meeting.timeZone || 'Africa/Johannesburg'})
                    </div>
                    <div className="slot-status">{meeting.status || 'Pending'}</div>
                  </div>
                )}
              </div>
            </div>

            {meeting.description && (
              <div className="info-row">
                <div className="info-label">Description</div>
                <div className="info-value description-text">{meeting.description}</div>
              </div>
            )}
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
                onClick={handleConfirmSlot}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Confirm Selected Slot'}
              </button>
              <button
                className="reject-btn"
                onClick={handleDeclineAll}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Decline All'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingDetails;