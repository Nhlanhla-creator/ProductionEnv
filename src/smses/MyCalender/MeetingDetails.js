import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import styled from 'styled-components';

const MeetingDetailsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const MeetingDetailsContent = styled.div`
  background: white;
  border-radius: 20px;
  padding: 30px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
`;

const MeetingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 2px solid #8D6E63;
`;

const MeetingTitle = styled.h2`
  color: #3E2723;
  font-size: 1.8rem;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #8D6E63;
  padding: 5px;
`;

const MeetingBody = styled.div`
  display: flex;
  flex-direction: column;
`;

const InfoRow = styled.div`
  display: flex;
  margin-bottom: 20px;
`;

const InfoLabel = styled.div`
  width: 150px;
  font-weight: 600;
  color: #3E2723;
`;

const InfoValue = styled.div`
  flex: 1;
  color: #3E2723;
`;

const SlotsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
`;

const TimeSlot = styled.div`
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #D7CCC8;
  cursor: ${props => props.status === 'available' ? 'pointer' : 'default'};
  background-color: ${props => 
    props.status === 'scheduled' ? 'rgba(76, 175, 80, 0.1)' :
    props.status === 'pending' ? 'rgba(255, 152, 0, 0.1)' :
    props.status === 'cancelled' ? 'rgba(244, 67, 54, 0.1)' :
    'white'};
  ${props => props.selected && 'border: 2px solid #5D4037'};

  &:hover {
    background-color: ${props => 
      props.status === 'available' ? '#EFEBE9' : 
      props.status === 'scheduled' ? 'rgba(76, 175, 80, 0.1)' :
      props.status === 'pending' ? 'rgba(255, 152, 0, 0.1)' :
      props.status === 'cancelled' ? 'rgba(244, 67, 54, 0.1)' :
      'white'};
  }
`;

const SlotDate = styled.div`
  font-weight: 600;
  margin-bottom: 5px;
  color: #3E2723;
`;

const SlotTime = styled.div`
  color: #8D6E63;
  font-size: 0.9rem;
`;

const SlotStatus = styled.div`
  font-size: 0.8rem;
  margin-top: 5px;
  color: ${props => 
    props.status === 'scheduled' ? '#4CAF50' :
    props.status === 'pending' ? '#FF9800' :
    props.status === 'cancelled' ? '#F44336' :
    '#8D6E63'};
  font-weight: 600;
`;

const DeclineForm = styled.div`
  margin-top: 25px;
  padding: 20px;
  background: #EFEBE9;
  border-radius: 10px;
`;

const FormTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 15px;
  color: #3E2723;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #D7CCC8;
  margin-bottom: 15px;
  resize: vertical;
`;

const FormActions = styled.div`
  display: flex;
  gap: 15px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 30px;
`;

const Button = styled.button`
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AcceptButton = styled(Button)`
  background: #5D4037;
  color: white;

  &:hover:not(:disabled) {
    background: #8D6E63;
  }

  &.disabled {
    background: #D7CCC8;
  }
`;

const DeclineButton = styled(Button)`
  background: white;
  color: #5D4037;
  border: 1px solid #5D4037;

  &:hover:not(:disabled) {
    background: #EFEBE9;
  }
`;

const SubmitButton = styled(Button)`
  background: #5D4037;
  color: white;

  &:hover:not(:disabled) {
    background: #8D6E63;
  }
`;

const CancelButton = styled(Button)`
  background: white;
  color: #5D4037;
  border: 1px solid #5D4037;

  &:hover:not(:disabled) {
    background: #EFEBE9;
  }
`;

const ResponseMessage = styled.div`
  padding: 20px;
  background: #EFEBE9;
  border-radius: 10px;
  margin-top: 25px;
  text-align: center;
`;

const MeetingDetails = ({ meeting, onAction, onClose }) => {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [requesterName, setRequesterName] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    const fetchRequesterDetails = async () => {
      try {
        if (meeting?.requesterId) {
          const requesterRef = doc(db, "MyuniversalProfiles", meeting.requesterId);
          const requesterSnap = await getDoc(requesterRef);
          if (requesterSnap.exists()) {
            const data = requesterSnap.data();
            const name = data?.formData?.entityOverview?.registeredName || 
                        data?.formData?.personalDetails?.fullName || 
                        meeting.requesterType;
            setRequesterName(name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch requester details:', err);
      }
    };

    fetchRequesterDetails();

    if (meeting?.slots?.length && !selectedSlot) {
      const firstAvailable = meeting.slots.find(slot => slot.status === 'available');
      if (firstAvailable) setSelectedSlot(firstAvailable);
    }
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

  const handleAccept = async () => {
    if (!selectedSlot) {
      showResponseMessage('Please select a time slot first');
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      showResponseMessage('You must be logged in to confirm a meeting');
      return;
    }

    setIsProcessing(true);
    try {
      if (!selectedSlot?.date) throw new Error("Meeting date is missing");
      if (!selectedSlot?.timeSlots?.length) throw new Error("No time slots available");
      if (!meeting?.requesterId) throw new Error("Requester reference missing");

      const slotIdParts = selectedSlot.id.split('-');
      const calendarEventId = slotIdParts[0];

      const calendarEventRef = doc(db, meeting.collection, calendarEventId);
      const calendarEventSnap = await getDoc(calendarEventRef);

      if (!calendarEventSnap.exists()) {
        throw new Error("Calendar event not found - please refresh and try again");
      }

      const updates = {
        status: "scheduled",
        scheduledDate: selectedSlot.date.toISOString(),
        scheduledTimeSlot: selectedSlot.timeSlots[0],
        updatedAt: new Date().toISOString(),
        availableDates: calendarEventSnap.data().availableDates.map(slot => ({
          ...slot,
          status: slot.date === selectedSlot.date.toISOString() ? "scheduled" : "unavailable"
        }))
      };

      await updateDoc(calendarEventRef, updates);

      const messageContent =
        `Your meeting with ${meeting.smeName || "an SME"} has been confirmed.\n\n` +
        `📅 Date: ${formatDate(selectedSlot.date)}\n` +
        `⏰ Time: ${formatTimeSlot(selectedSlot.timeSlots[0])} (${selectedSlot.timeZone})\n` +
        `📍 Location: ${meeting.location}\n\n`;

      const confirmationMessage = {
        from: user.uid,
        fromName: meeting.smeName || "SME User",
        to: meeting.requesterId,
        toName: requesterName,
        subject: `Confirmed: ${meeting.name}`,
        content: messageContent,
        date: new Date().toISOString(),
        read: false,
        type: "inbox",
        meetingId: calendarEventId,
        timeZone: selectedSlot.timeZone
      };

      await addDoc(collection(db, "messages"), confirmationMessage);

      try {
        const calendarData = calendarEventSnap.data();
        if (calendarData.smeAppId) {
          const smeAppRef = doc(db, "smeApplications", calendarData.smeAppId);
          await updateDoc(smeAppRef, {
            meetingStatus: "scheduled",
            lastUpdated: new Date().toISOString()
          });
        }

        if (calendarData.investorAppId) {
          const investorAppRef = doc(db, "investorApplications", calendarData.investorAppId);
          await updateDoc(investorAppRef, {
            meetingStatus: "scheduled",
            lastUpdated: new Date().toISOString()
          });
        }
      } catch (updateError) {
        console.log("Application updates not critical:", updateError);
      }

      showResponseMessage('Meeting confirmed! Requester notified.');
      if (onAction) {
        onAction(selectedSlot.id, 'scheduled');
      }
    } catch (error) {
      console.error("Error in handleAccept:", error);
      showResponseMessage(`Failed to confirm meeting: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = () => {
    setShowDeclineForm(true);
  };

  const handleDeclineSubmit = async () => {
    if (!declineReason.trim()) {
      showResponseMessage('Please provide a reason for declining');
      return;
    }
    
    setIsProcessing(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        const declineMessage = {
          from: user.uid,
          fromName: meeting.smeName || "SME User",
          to: meeting.requesterId,
          toName: requesterName,
          subject: `Meeting Declined: ${meeting.name}`,
          content: `I regret to inform you that I need to decline our scheduled meeting.\n\nReason: ${declineReason}\n\nThank you for your understanding.`,
          date: new Date().toISOString(),
          read: false,
          type: "inbox",
          meetingId: meeting.id
        };
        
        await addDoc(collection(db, "messages"), declineMessage);

        const meetingRef = doc(db, meeting.collection, meeting.id);
        await updateDoc(meetingRef, {
          status: 'cancelled',
          updatedAt: new Date().toISOString()
        });
      }
      
      showResponseMessage('Meeting declined. Requester has been notified.');
      if (onAction) {
        onAction(meeting.id, 'cancelled');
      }
    } catch (error) {
      console.error("Error declining meeting:", error);
      showResponseMessage('Failed to decline meeting. Please try again.');
    } finally {
      setIsProcessing(false);
      setShowDeclineForm(false);
      setDeclineReason('');
    }
  };

  const showResponseMessage = (message) => {
    setResponseMessage(message);
    setShowResponse(true);
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <MeetingDetailsModal>
      <MeetingDetailsContent>
        <MeetingHeader>
          <MeetingTitle>{meeting.name}</MeetingTitle>
          <CloseButton onClick={handleClose}>×</CloseButton>
        </MeetingHeader>

        <MeetingBody>
          <InfoRow>
            <InfoLabel>Role</InfoLabel>
            <InfoValue>{meeting.requesterType}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>Requested By</InfoLabel>
            <InfoValue>{requesterName}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>Location</InfoLabel>
            <InfoValue>{meeting.location}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>Available Slots</InfoLabel>
            <InfoValue>
              <SlotsContainer>
                {meeting.slots.map((slot, index) => (
                  <TimeSlot
                    key={index}
                    status={slot.status}
                    selected={selectedSlot?.id === slot.id}
                    onClick={() => slot.status === 'available' && setSelectedSlot(slot)}
                  >
                    <SlotDate>{formatDate(slot.date)}</SlotDate>
                    <SlotTime>
                      {formatTimeSlot(slot.timeSlots?.[0])} ({slot.timeZone})
                    </SlotTime>
                    {slot.status === 'scheduled' && (
                      <SlotStatus status={slot.status}>Confirmed</SlotStatus>
                    )}
                  </TimeSlot>
                ))}
              </SlotsContainer>
            </InfoValue>
          </InfoRow>

          {showDeclineForm && (
            <DeclineForm>
              <FormTitle>Please provide a reason for declining</FormTitle>
              <TextArea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Please explain why you need to decline this meeting..."
              />
              <FormActions>
                <CancelButton 
                  onClick={() => {
                    setShowDeclineForm(false);
                    setDeclineReason('');
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </CancelButton>
                <SubmitButton 
                  onClick={handleDeclineSubmit} 
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Submit Decline'}
                </SubmitButton>
              </FormActions>
            </DeclineForm>
          )}

          {showResponse ? (
            <ResponseMessage>
              <p>{responseMessage}</p>
              <SubmitButton onClick={handleClose}>
                Close
              </SubmitButton>
            </ResponseMessage>
          ) : (
            !showDeclineForm && (
              <ActionButtons>
                <AcceptButton
                  onClick={handleAccept}
                  disabled={isProcessing || !selectedSlot || selectedSlot.status !== 'available'}
                  className={isProcessing || !selectedSlot || selectedSlot.status !== 'available' ? 'disabled' : ''}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Selected Slot'}
                </AcceptButton>
                <DeclineButton
                  onClick={handleDecline}
                  disabled={isProcessing}
                >
                  Decline All
                </DeclineButton>
              </ActionButtons>
            )
          )}
        </MeetingBody>
      </MeetingDetailsContent>
    </MeetingDetailsModal>
  );
};

export default MeetingDetails;