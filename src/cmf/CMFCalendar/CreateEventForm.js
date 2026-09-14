import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  CalendarDays,
  Clock3,
  MapPin,
  UserRound,
  UsersRound,
  FileText,
  Briefcase,
  Link as LinkIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "./CreateEventForm.css";

/* =========================================================
   STYLES
========================================================= */

const FormContainer = styled.div`
  width: min(760px, 100%);
  max-width: 100%;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid rgba(93, 64, 55, 0.12);
  box-shadow: 0 20px 60px rgba(62, 39, 35, 0.14);
  overflow: hidden;
`;

const FormHeader = styled.div`
  padding: 22px 24px 18px;
  border-bottom: 1px solid rgba(93, 64, 55, 0.1);
  background: linear-gradient(135deg, rgba(250, 247, 242, 0.95), rgba(245, 240, 225, 0.95));
`;

const FormTitle = styled.h2`
  margin: 0;
  color: #3e2723;
  font-size: clamp(1.35rem, 3vw, 1.7rem);
  font-weight: 750;
`;

const FormSubtitle = styled.p`
  margin: 5px 0 0;
  color: #8d6e63;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const FormBody = styled.form`
  padding: 22px 24px 24px;
  max-height: min(75dvh, 720px);
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d7ccc8;
    border-radius: 10px;
  }

  @media (max-width: 600px) {
    padding: 18px;
  }
`;

const SenderCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 20px;
  border-radius: 12px;
  background: #fbf9f8;
  border: 1px solid #ede5e1;
`;

const SenderIcon = styled.div`
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background: #5d4037;
`;

const SenderMeta = styled.div`
  min-width: 0;
  flex: 1;
`;

const SenderLabel = styled.div`
  color: #8d6e63;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
`;

const SenderName = styled.div`
  margin-top: 2px;
  color: #3e2723;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
`;

const FormGroup = styled.div`
  min-width: 0;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 7px;
  color: #4e342e;
  font-size: 0.85rem;
  font-weight: 650;

  svg {
    color: #8d6e63;
  }
`;

const Input = styled.input`
  display: block;
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #d9d0cc;
  outline: none;
  background: #ffffff;
  color: #3e2723;
  font-size: 0.9rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: #8d6e63;
    box-shadow: 0 0 0 3px rgba(141, 110, 99, 0.12);
  }
`;

const Select = styled.select`
  display: block;
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #d9d0cc;
  outline: none;
  background: #ffffff;
  color: #3e2723;
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: #8d6e63;
    box-shadow: 0 0 0 3px rgba(141, 110, 99, 0.12);
  }
`;

const Textarea = styled.textarea`
  display: block;
  width: 100%;
  min-width: 0;
  min-height: 100px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #d9d0cc;
  outline: none;
  background: #ffffff;
  color: #3e2723;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;

  &:focus {
    border-color: #8d6e63;
    box-shadow: 0 0 0 3px rgba(141, 110, 99, 0.12);
  }
`;

const SlotRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const RemoveSlotButton = styled.button`
  background: none;
  border: none;
  color: #d32f2f;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.2s ease;

  &:hover {
    background: #ffebee;
  }
`;

const AddSlotButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f5f0e1;
  color: #7d5a50;
  border: 1px dashed #a67c52;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: #e6d7c3;
    color: #4a352f;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 16px;
  padding: 11px 13px;
  border-radius: 8px;
  color: #9a3535;
  background: #fff4f4;
  border: 1px solid #f0cccc;
  font-size: 0.84rem;
`;

const FormActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid rgba(93, 64, 55, 0.1);

  @media (max-width: 500px) {
    flex-direction: column-reverse;
    button {
      width: 100%;
    }
  }
`;

const Button = styled.button`
  min-height: 42px;
  padding: 0 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 650;
  transition: transform 0.18s ease, background 0.18s ease;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  color: #5d4037;
  background: #ffffff;
  border: 1px solid #cbbdb8;

  &:hover:not(:disabled) {
    background: #f7f4f2;
  }
`;

const SubmitButton = styled(Button)`
  color: #ffffff;
  background: linear-gradient(135deg, #a67c52, #7d5a50);
  box-shadow: 0 4px 12px rgba(166, 124, 82, 0.25);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #8c6842, #5d4037);
    transform: translateY(-1px);
  }
`;

/* =========================================================
   CMF EVENT TYPES
========================================================= */

const CMF_EVENT_TYPES = [
  "Cohort Facilitation Session",
  "SME Advisory & Deal Readiness",
  "Investor Pitch / Demo Day",
  "Capital Structuring & Due Diligence Sync",
  "Market Access & Growth Workshop",
  "Facility & Fund Monitoring Review",
  "General Facilitation Meeting",
];

/* =========================================================
   COMPONENT
========================================================= */

const CreateEventForm = ({ onSubmit, onCancel, previousRecipients = [] }) => {
  const [sender, setSender] = useState({
    id: "",
    name: "Capital & Market Facilitator",
    email: "",
  });

  const [loadingSender, setLoadingSender] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    eventType: "Cohort Facilitation Session",
    to: "",
    toName: "",
    toType: "",
    duration: "45",
    location: "Virtual (Zoom / Meet)",
    meetingLink: "",
    description: "",
  });

  const [proposedSlots, setProposedSlots] = useState([
    {
      id: Date.now(),
      date: "",
      time: "",
    },
  ]);

  const minDate = useMemo(() => {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localDate.toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSender({
          id: "",
          name: "Not signed in",
          email: "",
        });
        setLoadingSender(false);
        return;
      }

      let senderName = user.displayName || user.email?.split("@")[0] || "Capital & Market Facilitator";
      let senderEmail = user.email || "";

      try {
        // Try CMF Profile first
        const customCmfId = `${user.uid}_cmf`;
        let profileSnap = await getDoc(doc(db, "cmfProfiles", customCmfId));
        if (!profileSnap.exists()) {
          profileSnap = await getDoc(doc(db, "cmfProfiles", user.uid));
        }
        if (!profileSnap.exists()) {
          profileSnap = await getDoc(doc(db, "MyuniversalProfiles", user.uid));
        }

        if (profileSnap.exists()) {
          const profile = profileSnap.data();
          senderName =
            profile?.formData?.entityOverview?.registeredName ||
            profile?.formData?.entityOverview?.tradingName ||
            profile?.formData?.contactDetails?.contactName ||
            profile?.formData?.contactDetails?.primaryContactName ||
            profile?.entityOverview?.registeredName ||
            profile?.contactDetails?.contactName ||
            user.displayName ||
            senderName;

          senderEmail =
            profile?.formData?.contactDetails?.email ||
            profile?.contactDetails?.email ||
            profile?.email ||
            user.email ||
            "";
        }
      } catch (err) {
        console.error("Error retrieving CMF sender details:", err);
      }

      setSender({
        id: user.uid,
        name: senderName,
        email: senderEmail,
      });
      setLoadingSender(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRecipientChange = (e) => {
    const selectedId = e.target.value;
    const selectedRecipient = previousRecipients.find((r) => r.id === selectedId);

    setFormData((prev) => ({
      ...prev,
      to: selectedId,
      toName: selectedRecipient?.name || "",
      toType: selectedRecipient?.type || "",
    }));
  };

  const handleAddSlot = () => {
    setProposedSlots((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        date: "",
        time: "",
      },
    ]);
  };

  const handleRemoveSlot = (id) => {
    if (proposedSlots.length <= 1) return;
    setProposedSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSlotChange = (id, field, value) => {
    setProposedSlots((prev) =>
      prev.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Please enter a session title.");
      return;
    }

    if (!formData.to) {
      setError("Please select a recipient stakeholder (Cohort SME, Investor, or Partner).");
      return;
    }

    // Validate proposed slots
    const validSlots = proposedSlots.filter((s) => s.date && s.time);
    if (validSlots.length === 0) {
      setError("Please provide at least one complete proposed date and time slot.");
      return;
    }

    const submissionData = {
      ...formData,
      hostName: sender.name,
      hostEmail: sender.email,
      hostId: sender.id,
      facilitatorName: sender.name,
      facilitatorRole: "cmf",
      proposedSlots: validSlots,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    onSubmit(submissionData);
  };

  return (
    <FormContainer>
      <FormHeader>
        <FormTitle>Schedule Facilitation Event</FormTitle>
        <FormSubtitle>
          Plan a cohort workshop, investor demo pitch, or SME advisory review.
        </FormSubtitle>
      </FormHeader>

      <FormBody onSubmit={handleSubmit}>
        {/* Host / Facilitator Info */}
        <SenderCard>
          <SenderIcon>
            <Briefcase size={20} />
          </SenderIcon>
          <SenderMeta>
            <SenderLabel>Facilitator / Host</SenderLabel>
            <SenderName>
              {loadingSender ? "Loading facilitator profile..." : sender.name}
            </SenderName>
          </SenderMeta>
        </SenderCard>

        <FormGrid>
          {/* Session Title */}
          <FullWidth>
            <FormGroup>
              <Label>
                <FileText size={16} /> Session Title *
              </Label>
              <Input
                type="text"
                placeholder="e.g. Cohort 2: SME Investment Readiness & Pitch Deck Review"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </FormGroup>
          </FullWidth>

          {/* Facilitation Event Type */}
          <FormGroup>
            <Label>
              <CalendarDays size={16} /> Facilitation Event Type
            </Label>
            <Select
              value={formData.eventType}
              onChange={(e) => handleInputChange("eventType", e.target.value)}
            >
              {CMF_EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </FormGroup>

          {/* Stakeholder / Recipient Selection */}
          <FormGroup>
            <Label>
              <UsersRound size={16} /> Stakeholder / Participant *
            </Label>
            <Select value={formData.to} onChange={handleRecipientChange} required>
              <option value="">Select participant / enterprise...</option>
              {previousRecipients.map((rec) => (
                <option key={rec.id} value={rec.id}>
                  {rec.name} {rec.type ? `(${rec.type})` : ""}
                </option>
              ))}
            </Select>
          </FormGroup>

          {/* Duration */}
          <FormGroup>
            <Label>
              <Clock3 size={16} /> Session Duration
            </Label>
            <Select
              value={formData.duration}
              onChange={(e) => handleInputChange("duration", e.target.value)}
            >
              <option value="15">15 Minutes (Quick Sync)</option>
              <option value="30">30 Minutes (Standard Review)</option>
              <option value="45">45 Minutes (Facilitation Deep-Dive)</option>
              <option value="60">60 Minutes (1 Hour Workshop)</option>
              <option value="90">90 Minutes (Masterclass / Cohort Pitch)</option>
              <option value="120">2 Hours (Demo Day / Extensive Due Diligence)</option>
            </Select>
          </FormGroup>

          {/* Location */}
          <FormGroup>
            <Label>
              <MapPin size={16} /> Location / Delivery Mode
            </Label>
            <Select
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
            >
              <option value="Virtual (Zoom / Google Meet)">Virtual (Zoom / Google Meet)</option>
              <option value="Virtual (Microsoft Teams)">Virtual (Microsoft Teams)</option>
              <option value="Phone Call">Phone Call</option>
              <option value="Physical (Facilitator Office)">Physical (Facilitator Office)</option>
              <option value="Physical (Client Premises)">Physical (Client Premises)</option>
              <option value="Physical (Conference Boardroom)">Physical (Conference Boardroom)</option>
            </Select>
          </FormGroup>

          {/* Virtual Meeting Link */}
          <FullWidth>
            <FormGroup>
              <Label>
                <LinkIcon size={16} /> Meeting Link / Dial-in (Optional)
              </Label>
              <Input
                type="url"
                placeholder="https://meet.google.com/... or https://zoom.us/j/..."
                value={formData.meetingLink}
                onChange={(e) => handleInputChange("meetingLink", e.target.value)}
              />
            </FormGroup>
          </FullWidth>

          {/* Proposed Date & Time Slots */}
          <FullWidth>
            <FormGroup>
              <Label>
                <CalendarDays size={16} /> Proposed Session Date & Time Slots *
              </Label>
              {proposedSlots.map((slot, index) => (
                <SlotRow key={slot.id}>
                  <Input
                    type="date"
                    min={minDate}
                    value={slot.date}
                    onChange={(e) => handleSlotChange(slot.id, "date", e.target.value)}
                    required
                  />
                  <Input
                    type="time"
                    value={slot.time}
                    onChange={(e) => handleSlotChange(slot.id, "time", e.target.value)}
                    required
                  />
                  {proposedSlots.length > 1 && (
                    <RemoveSlotButton
                      type="button"
                      onClick={() => handleRemoveSlot(slot.id)}
                      title="Remove Slot"
                    >
                      <Trash2 size={16} />
                    </RemoveSlotButton>
                  )}
                </SlotRow>
              ))}
              <AddSlotButton type="button" onClick={handleAddSlot}>
                <Plus size={15} /> Add Alternative Slot
              </AddSlotButton>
            </FormGroup>
          </FullWidth>

          {/* Agenda & Facilitation Objectives */}
          <FullWidth>
            <FormGroup>
              <Label>
                <FileText size={16} /> Session Agenda & Facilitation Objectives
              </Label>
              <Textarea
                placeholder="Outline the facilitation agenda, key milestones to review, pitch presentation format, or required prep materials..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </FormGroup>
          </FullWidth>
        </FormGrid>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <FormActions>
          <CancelButton type="button" onClick={onCancel}>
            Cancel
          </CancelButton>
          <SubmitButton type="submit">
            Schedule Facilitation Event
          </SubmitButton>
        </FormActions>
      </FormBody>
    </FormContainer>
  );
};

export default CreateEventForm;
