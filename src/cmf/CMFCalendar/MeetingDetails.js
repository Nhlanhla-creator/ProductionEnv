import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import styled from "styled-components";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Briefcase,
  FileText,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
} from "lucide-react";
import "./MeetingDetails.css";

const DetailsModal = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(35, 25, 21, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5100;
  padding: 16px;
  backdrop-filter: blur(4px);
`;

const DetailsContent = styled.div`
  background: #ffffff;
  border-radius: 20px;
  padding: 28px;
  width: min(720px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(62, 39, 35, 0.2);
  border: 1px solid rgba(93, 64, 55, 0.12);

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #d7ccc8;
    border-radius: 10px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 22px;
  padding-bottom: 16px;
  border-bottom: 2px solid #8d6e63;
`;

const TitleArea = styled.div`
  min-width: 0;
  flex: 1;
`;

const Title = styled.h2`
  color: #3e2723;
  font-size: 1.5rem;
  margin: 0 0 6px 0;
  font-weight: 750;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: ${(props) =>
    props.status === "scheduled"
      ? "rgba(46, 125, 50, 0.15)"
      : props.status === "completed"
      ? "rgba(2, 132, 199, 0.15)"
      : props.status === "cancelled"
      ? "rgba(220, 38, 38, 0.15)"
      : "rgba(217, 119, 6, 0.15)"};
  color: ${(props) =>
    props.status === "scheduled"
      ? "#2e7d32"
      : props.status === "completed"
      ? "#0284c7"
      : props.status === "cancelled"
      ? "#dc2626"
      : "#d97706"};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.6rem;
  cursor: pointer;
  color: #8d6e63;
  padding: 4px;
  line-height: 1;
  border-radius: 50%;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
    color: #3e2723;
  }
`;

const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 4px;
  }
`;

const InfoLabel = styled.div`
  width: 140px;
  flex-shrink: 0;
  font-weight: 650;
  font-size: 0.86rem;
  color: #5d4037;
  display: flex;
  align-items: center;
  gap: 6px;

  svg {
    color: #8d6e63;
  }
`;

const InfoValue = styled.div`
  flex: 1;
  color: #3e2723;
  font-size: 0.92rem;
  line-height: 1.5;
`;

const SlotsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;

const TimeSlotCard = styled.div`
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid ${(props) => (props.selected ? "#5d4037" : "#d7ccc8")};
  background-color: ${(props) =>
    props.selected
      ? "#fbf9f8"
      : props.status === "scheduled"
      ? "rgba(46, 125, 50, 0.08)"
      : "white"};
  cursor: ${(props) => (props.clickable ? "pointer" : "default")};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => (props.clickable ? "#f5f0e1" : "inherit")};
  }
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid rgba(141, 110, 99, 0.15);
`;

const ActionBtn = styled.button`
  padding: 10px 18px;
  border-radius: 9px;
  font-weight: 650;
  font-size: 0.88rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const AcceptBtn = styled(ActionBtn)`
  background: linear-gradient(135deg, #2e7d32, #1b5e20);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);

  &:hover:not(:disabled) {
    background: #1b5e20;
    transform: translateY(-1px);
  }
`;

const CompleteBtn = styled(ActionBtn)`
  background: linear-gradient(135deg, #0284c7, #0369a1);
  color: #ffffff;

  &:hover:not(:disabled) {
    background: #0369a1;
    transform: translateY(-1px);
  }
`;

const CancelBtn = styled(ActionBtn)`
  background: #ffffff;
  color: #d32f2f;
  border: 1px solid #ffcdd2;

  &:hover:not(:disabled) {
    background: #ffebee;
  }
`;

const DeclineTextarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #d9d0cc;
  margin-top: 10px;
  font-size: 0.88rem;
  resize: vertical;
  min-height: 80px;
`;

const AlertBanner = styled.div`
  padding: 12px 14px;
  border-radius: 8px;
  background: #efebe9;
  color: #4e342e;
  font-size: 0.86rem;
  margin-bottom: 16px;
  border-left: 4px solid #8d6e63;
`;

const MeetingDetails = ({ meeting, onClose, onAction }) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [responseMessage, setResponseMessage] = useState("");

  const slots = meeting?.availableDates || meeting?.proposedSlots || [];

  const handleConfirmSlot = async () => {
    if (selectedSlotIndex === null) {
      setResponseMessage("Please select a time slot to confirm.");
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    setIsProcessing(true);
    try {
      const selectedSlot = slots[selectedSlotIndex];
      const eventDocId = meeting.docId || meeting.id;
      const eventRef = doc(db, "smeCalendarEvents", eventDocId);

      const confirmedDate = selectedSlot.date?.toISOString
        ? selectedSlot.date.toISOString()
        : String(selectedSlot.date || "");

      const updates = {
        status: "scheduled",
        meetingStatus: "scheduled",
        scheduledDate: confirmedDate,
        scheduledTime: selectedSlot.time || selectedSlot.timeSlots?.[0]?.start || "09:00",
        confirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(eventRef, updates);

      // Notify participant
      if (meeting.to || meeting.requesterId) {
        const recipientId = meeting.to === user.uid ? meeting.createdBy : meeting.to || meeting.requesterId;
        await addDoc(collection(db, "messages"), {
          from: user.uid,
          fromName: meeting.facilitatorName || meeting.hostName || "Capital & Market Facilitator",
          to: recipientId,
          toName: meeting.recipientName || meeting.toName || "Participant",
          subject: `Confirmed: ${meeting.name || meeting.title}`,
          content: `Your facilitation session has been confirmed.\n\n📅 Date: ${confirmedDate}\n⏰ Time: ${updates.scheduledTime}\n📍 Delivery: ${meeting.location || "Virtual"}\n${meeting.meetingLink ? `🔗 Link: ${meeting.meetingLink}\n` : ""}`,
          date: new Date().toISOString(),
          read: false,
          type: "inbox",
          meetingId: eventDocId,
        });
      }

      setResponseMessage("Facilitation session confirmed successfully!");
      if (onAction) onAction(meeting.id, "scheduled");
    } catch (err) {
      console.error("Error confirming facilitation session:", err);
      setResponseMessage("Failed to confirm session. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteSession = async () => {
    setIsProcessing(true);
    try {
      const eventDocId = meeting.docId || meeting.id;
      const eventRef = doc(db, "smeCalendarEvents", eventDocId);

      await updateDoc(eventRef, {
        status: "completed",
        meetingStatus: "completed",
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setResponseMessage("Session marked as completed.");
      if (onAction) onAction(meeting.id, "completed");
    } catch (err) {
      console.error("Error completing session:", err);
      setResponseMessage("Could not mark session as completed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!declineReason.trim()) {
      setResponseMessage("Please provide a reason for cancellation.");
      return;
    }

    setIsProcessing(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const eventDocId = meeting.docId || meeting.id;
      const eventRef = doc(db, "smeCalendarEvents", eventDocId);

      await updateDoc(eventRef, {
        status: "cancelled",
        meetingStatus: "cancelled",
        declineReason,
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (user && (meeting.to || meeting.requesterId)) {
        const recipientId = meeting.to === user.uid ? meeting.createdBy : meeting.to || meeting.requesterId;
        await addDoc(collection(db, "messages"), {
          from: user.uid,
          fromName: meeting.facilitatorName || meeting.hostName || "Capital & Market Facilitator",
          to: recipientId,
          toName: meeting.recipientName || meeting.toName || "Participant",
          subject: `Session Cancelled: ${meeting.name || meeting.title}`,
          content: `The facilitation session "${meeting.name || meeting.title}" has been cancelled.\n\nReason: ${declineReason}`,
          date: new Date().toISOString(),
          read: false,
          type: "inbox",
          meetingId: eventDocId,
        });
      }

      setResponseMessage("Session cancelled.");
      if (onAction) onAction(meeting.id, "cancelled");
    } catch (err) {
      console.error("Error cancelling session:", err);
      setResponseMessage("Could not cancel session.");
    } finally {
      setIsProcessing(false);
      setShowDeclineForm(false);
    }
  };

  const isPending = String(meeting?.status || "").toLowerCase() === "pending";
  const isScheduled = String(meeting?.status || "").toLowerCase() === "scheduled";

  return (
    <DetailsModal onClick={onClose}>
      <DetailsContent onClick={(e) => e.stopPropagation()}>
        <Header>
          <TitleArea>
            <Title>{meeting.name || meeting.title || "Facilitation Session"}</Title>
            <Badge status={meeting.status}>{meeting.status || "pending"}</Badge>
          </TitleArea>
          <CloseButton onClick={onClose} aria-label="Close">
            ×
          </CloseButton>
        </Header>

        {responseMessage && <AlertBanner>{responseMessage}</AlertBanner>}

        <InfoGrid>
          <InfoRow>
            <InfoLabel>
              <Briefcase size={16} /> Session Type
            </InfoLabel>
            <InfoValue>
              {meeting.eventType || meeting.facilitationType || "Cohort Facilitation"}
            </InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>
              <Users size={16} /> Facilitator
            </InfoLabel>
            <InfoValue>
              {meeting.facilitatorName || meeting.createdByName || meeting.smeName || "Capital & Market Facilitator"}
            </InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>
              <Users size={16} /> Stakeholder
            </InfoLabel>
            <InfoValue>
              {meeting.recipientName || meeting.toName || meeting.requesterName || "Participant"}
            </InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>
              <Clock size={16} /> Duration
            </InfoLabel>
            <InfoValue>{meeting.duration || 30} Minutes</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>
              <MapPin size={16} /> Location
            </InfoLabel>
            <InfoValue>{meeting.location || "Virtual"}</InfoValue>
          </InfoRow>

          {meeting.meetingLink && (
            <InfoRow>
              <InfoLabel>
                <LinkIcon size={16} /> Meeting Link
              </InfoLabel>
              <InfoValue>
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#a67c52", fontWeight: "600" }}
                >
                  {meeting.meetingLink}
                </a>
              </InfoValue>
            </InfoRow>
          )}

          {meeting.description && (
            <InfoRow>
              <InfoLabel>
                <FileText size={16} /> Agenda / Notes
              </InfoLabel>
              <InfoValue>{meeting.description}</InfoValue>
            </InfoRow>
          )}

          {/* Slots View / Picker */}
          {slots.length > 0 && (
            <div>
              <InfoLabel style={{ width: "auto", marginBottom: "8px" }}>
                <Calendar size={16} /> Proposed Session Slots
              </InfoLabel>
              <SlotsContainer>
                {slots.map((slot, idx) => {
                  const slotDate = slot.date?.toDate
                    ? slot.date.toDate().toLocaleDateString()
                    : String(slot.date || "");
                  const slotTime = slot.time || slot.timeSlots?.[0]?.start || "Slot";
                  const isSelected = selectedSlotIndex === idx;

                  return (
                    <TimeSlotCard
                      key={idx}
                      selected={isSelected}
                      clickable={isPending}
                      status={slot.status || meeting.status}
                      onClick={() => isPending && setSelectedSlotIndex(idx)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong>{slotDate}</strong> at <strong>{slotTime}</strong>
                        </div>
                        {isPending && (
                          <span style={{ fontSize: "12px", color: isSelected ? "#2e7d32" : "#8d6e63", fontWeight: "600" }}>
                            {isSelected ? "✓ Selected" : "Click to select"}
                          </span>
                        )}
                      </div>
                    </TimeSlotCard>
                  );
                })}
              </SlotsContainer>
            </div>
          )}
        </InfoGrid>

        {showDeclineForm && (
          <div style={{ marginTop: "16px", padding: "14px", background: "#fff5f5", borderRadius: "10px" }}>
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#b71c1c" }}>
              Reason for Cancelling Session:
            </label>
            <DeclineTextarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Provide a clear cancellation reason for the participant..."
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <ActionBtn onClick={() => setShowDeclineForm(false)}>Back</ActionBtn>
              <CancelBtn onClick={handleCancelSubmit} disabled={isProcessing}>
                Confirm Cancellation
              </CancelBtn>
            </div>
          </div>
        )}

        {!showDeclineForm && (
          <ActionsRow>
            {isPending && (
              <AcceptBtn onClick={handleConfirmSlot} disabled={isProcessing || selectedSlotIndex === null}>
                Confirm Selected Slot
              </AcceptBtn>
            )}

            {isScheduled && (
              <CompleteBtn onClick={handleCompleteSession} disabled={isProcessing}>
                Mark Session Completed
              </CompleteBtn>
            )}

            {(isPending || isScheduled) && (
              <CancelBtn onClick={() => setShowDeclineForm(true)} disabled={isProcessing}>
                Cancel Session
              </CancelBtn>
            )}
          </ActionsRow>
        )}
      </DetailsContent>
    </DetailsModal>
  );
};

export default MeetingDetails;
