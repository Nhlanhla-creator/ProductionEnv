import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import styled from "styled-components";

import {
  CalendarDays,
  Clock3,
  MapPin,
  UserRound,
  UsersRound,
  FileText,
} from "lucide-react";

import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../../firebaseConfig";

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

  box-shadow:
    0 20px 60px rgba(62, 39, 35, 0.14);

  overflow: hidden;
`;

const FormHeader = styled.div`
  padding: 22px 24px 18px;

  border-bottom:
    1px solid rgba(93, 64, 55, 0.1);
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

  margin-bottom: 20px;

  padding: 14px 16px;

  border-radius: 12px;

  background: #f7f4f2;

  border: 1px solid rgba(141, 110, 99, 0.16);
`;

const SenderIcon = styled.div`
  width: 40px;
  height: 40px;

  flex: 0 0 40px;

  display: flex;

  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #5d4037;

  color: #ffffff;
`;

const SenderInformation = styled.div`
  min-width: 0;
`;

const SenderLabel = styled.div`
  color: #967f77;

  font-size: 0.72rem;

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

  grid-template-columns:
    repeat(2, minmax(0, 1fr));

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

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus {
    border-color: #8d6e63;

    box-shadow:
      0 0 0 3px rgba(141, 110, 99, 0.12);
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

  &:focus {
    border-color: #8d6e63;

    box-shadow:
      0 0 0 3px rgba(141, 110, 99, 0.12);
  }
`;

const TextArea = styled.textarea`
  display: block;

  width: 100%;

  min-width: 0;

  min-height: 110px;

  padding: 12px;

  border-radius: 10px;

  border: 1px solid #d9d0cc;

  resize: vertical;

  outline: none;

  background: #ffffff;

  color: #3e2723;

  font-family: inherit;

  font-size: 0.9rem;

  line-height: 1.5;

  &:focus {
    border-color: #8d6e63;

    box-shadow:
      0 0 0 3px rgba(141, 110, 99, 0.12);
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

  border-top:
    1px solid rgba(93, 64, 55, 0.1);

  @media (max-width: 500px) {
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }
`;

const Button = styled.button`
  min-height: 42px;

  padding: 0 18px;

  border-radius: 9px;

  border: none;

  cursor: pointer;

  font-size: 0.88rem;

  font-weight: 650;

  transition:
    transform 0.18s ease,
    background 0.18s ease;

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

  background: #5d4037;

  &:hover:not(:disabled) {
    background: #795548;
    transform: translateY(-1px);
  }
`;

/* =========================================================
   COMPONENT
========================================================= */

const CreateEventForm = ({
  onSubmit,
  onCancel,
  previousRecipients = [],
}) => {
  const [sender, setSender] = useState({
    id: "",
    name: "",
    email: "",
  });

  const [loadingSender, setLoadingSender] =
    useState(true);

  const [error, setError] = useState("");

  const [formData, setFormData] =
  useState({
    title: "",
    to: "",
    toName: "",
    duration: "30",
    location: "Virtual",
    description: "",
  });

  const [proposedSlots, setProposedSlots] =
  useState([
    {
      id: Date.now(),
      date: "",
      time: "",
    },
  ]);

  const minDate = useMemo(() => {
    const now = new Date();

    const localDate = new Date(
      now.getTime() -
        now.getTimezoneOffset() * 60000
    );

    return localDate
      .toISOString()
      .split("T")[0];
  }, []);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          setSender({
            id: "",
            name: "Not signed in",
            email: "",
          });

          setLoadingSender(false);

          return;
        }

        let senderName =
          user.displayName ||
          user.email?.split("@")[0] ||
          "User";

        let senderEmail = user.email || "";

        try {
          const profileSnap = await getDoc(
            doc(
              db,
              "MyuniversalProfiles",
              user.uid
            )
          );

          if (profileSnap.exists()) {
            const profile =
              profileSnap.data();

            senderName =
              profile?.formData?.entityOverview
                ?.registeredName ||
              profile?.formData?.contactDetails
                ?.primaryContactName ||
              profile?.formData?.contactDetails
                ?.contactName ||
              profile?.formData?.personalDetails
                ?.fullName ||
              profile?.formData?.fundManageOverview
                ?.registeredName ||
              user.displayName ||
              senderName;

            senderEmail =
              profile?.formData?.contactDetails
                ?.email ||
              profile?.email ||
              user.email ||
              "";
          }
        } catch (err) {
          console.error(
            "Error retrieving sender:",
            err
          );
        }

        setSender({
          id: user.uid,
          name: senderName,
          email: senderEmail,
        });

        setLoadingSender(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleRecipientChange = (event) => {
    const recipientId =
      event.target.value;

    const recipient =
      previousRecipients.find(
        (item) =>
          item.id === recipientId
      );

    setFormData((previous) => ({
      ...previous,
      to: recipientId,
      toName: recipient?.name || "",
    }));
  };

  const updateProposedSlot = (
  id,
  field,
  value
) => {
  setProposedSlots((previous) =>
    previous.map((slot) =>
      slot.id === id
        ? {
            ...slot,
            [field]: value,
          }
        : slot
    )
  );
};


const addProposedSlot = () => {
  setProposedSlots((previous) => [
    ...previous,
    {
      id: `${Date.now()}-${Math.random()}`,
      date: "",
      time: "",
    },
  ]);
};


const removeProposedSlot = (id) => {
  setProposedSlots((previous) => {
    // Always keep at least one date option
    if (previous.length <= 1) {
      return previous;
    }

    return previous.filter(
      (slot) => slot.id !== id
    );
  });
};


const calculateEndTime = (
  startTime,
  durationMinutes
) => {
  if (!startTime) return "";

  const [hours, minutes] =
    startTime
      .split(":")
      .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return "";
  }

  const totalMinutes =
    hours * 60 +
    minutes +
    Number(durationMinutes || 30);

  const endHours =
    Math.floor(totalMinutes / 60) % 24;

  const endMinutes =
    totalMinutes % 60;

  return `${String(endHours).padStart(
    2,
    "0"
  )}:${String(endMinutes).padStart(
    2,
    "0"
  )}`;
};
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.title.trim()) {
      setError(
        "Please enter an event title."
      );
      return;
    }

   if (
  !proposedSlots.length ||
  proposedSlots.some(
    (slot) =>
      !slot.date ||
      !slot.time
  )
) {
  setError(
    "Please complete every proposed date and time."
  );

  return;
}


// Prevent duplicate date/time choices
const uniqueSlots =
  new Set(
    proposedSlots.map(
      (slot) =>
        `${slot.date}_${slot.time}`
    )
  );

if (
  uniqueSlots.size !==
  proposedSlots.length
) {
  setError(
    "You have added the same date and time more than once."
  );

  return;
}

    if (!formData.location.trim()) {
      setError(
        "Please provide a meeting location."
      );
      return;
    }

    const timeZone =
  Intl.DateTimeFormat()
    .resolvedOptions()
    .timeZone;


const availableDates =
  proposedSlots.map(
    (slot) => {
      const [
        year,
        month,
        day,
      ] = slot.date
        .split("-")
        .map(Number);

      const [
        hours,
        minutes,
      ] = slot.time
        .split(":")
        .map(Number);

      const date =
        new Date(
          year,
          month - 1,
          day,
          hours,
          minutes,
          0,
          0
        );

      return {
        date:
          date.toISOString(),

        timeSlots: [
          {
            start:
              slot.time,

            end:
              calculateEndTime(
                slot.time,
                formData.duration
              ),
          },
        ],

        timeZone,

        status:
          "available",
      };
    }
  );


    await onSubmit({
  ...formData,

  // Legacy compatibility:
  // existing code may still read
  // date/time.
  date:
    proposedSlots[0].date,

  time:
    proposedSlots[0].time,

  availableDates,

  senderId:
    sender.id,

  senderName:
    sender.name,

  senderEmail:
    sender.email,
});
  };

  return (
    <FormContainer>
      <FormHeader>
        <FormTitle>
          Create Event
        </FormTitle>

        <FormSubtitle>
          Schedule a meeting and optionally
          invite one of your matches.
        </FormSubtitle>
      </FormHeader>

      <FormBody onSubmit={handleSubmit}>
        <SenderCard>
          <SenderIcon>
            <UserRound size={19} />
          </SenderIcon>

          <SenderInformation>
            <SenderLabel>
              From
            </SenderLabel>

            <SenderName>
              {loadingSender
                ? "Loading sender..."
                : sender.name}
            </SenderName>
          </SenderInformation>
        </SenderCard>

        <FormGrid>
          <FullWidth>
            <FormGroup>
              <Label htmlFor="title">
                <FileText size={15} />
                Event title
              </Label>

              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Partnership discussion"
                maxLength={120}
              />
            </FormGroup>
          </FullWidth>

          <FullWidth>
            <FormGroup>
              <Label htmlFor="to">
                <UsersRound size={15} />
                Invite
              </Label>

              <Select
                id="to"
                name="to"
                value={formData.to}
                onChange={
                  handleRecipientChange
                }
              >
                <option value="">
                  No invitee — personal event
                </option>

                {previousRecipients.map(
                  (recipient) => (
                    <option
                      key={recipient.id}
                      value={recipient.id}
                    >
                      {recipient.name}
                      {recipient.type
                        ? ` — ${recipient.type}`
                        : ""}
                    </option>
                  )
                )}
              </Select>
            </FormGroup>
          </FullWidth>

          <FullWidth>
  <FormGroup>
    <Label>
      <CalendarDays size={15} />
      Proposed meeting dates
    </Label>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {proposedSlots.map(
        (slot, index) => (
          <div
            key={slot.id}
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr auto",
              gap: "10px",
              alignItems: "center",
              padding: "12px",
              border:
                "1px solid #e2d8d3",
              borderRadius: "10px",
              background: "#faf8f7",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#8d6e63",
                  marginBottom: "5px",
                }}
              >
                OPTION {index + 1}
              </div>

              <Input
                type="date"
                min={minDate}
                value={slot.date}
                onChange={(e) =>
                  updateProposedSlot(
                    slot.id,
                    "date",
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#8d6e63",
                  marginBottom: "5px",
                }}
              >
                TIME
              </div>

              <Input
                type="time"
                value={slot.time}
                onChange={(e) =>
                  updateProposedSlot(
                    slot.id,
                    "time",
                    e.target.value
                  )
                }
              />
            </div>

            {proposedSlots.length >
              1 && (
              <button
                type="button"
                onClick={() =>
                  removeProposedSlot(
                    slot.id
                  )
                }
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  border:
                    "1px solid #e0caca",
                  background: "#fff",
                  color: "#b13c3c",
                  cursor: "pointer",
                  marginTop: "20px",
                }}
              >
                ×
              </button>
            )}
          </div>
        )
      )}

      {formData.to && (
        <button
          type="button"
          onClick={
            addProposedSlot
          }
          style={{
            alignSelf:
              "flex-start",
            border:
              "1px dashed #8d6e63",
            background:
              "#faf7f5",
            color:
              "#5d4037",
            padding:
              "9px 14px",
            borderRadius:
              "8px",
            cursor:
              "pointer",
            fontWeight:
              650,
          }}
        >
          + Add another date
        </button>
      )}

      {formData.to && (
        <div
          style={{
            fontSize: "12px",
            color: "#8d6e63",
          }}
        >
          The invitee will choose
          one of these options.
        </div>
      )}
    </div>
  </FormGroup>
</FullWidth>

          <FormGroup>
            <Label htmlFor="duration">
              <Clock3 size={15} />
              Duration
            </Label>

            <Select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
            >
              <option value="15">
                15 minutes
              </option>

              <option value="30">
                30 minutes
              </option>

              <option value="45">
                45 minutes
              </option>

              <option value="60">
                1 hour
              </option>

              <option value="90">
                1 hour 30 minutes
              </option>

              <option value="120">
                2 hours
              </option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="location">
              <MapPin size={15} />
              Location
            </Label>

            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Virtual, office, Zoom..."
            />
          </FormGroup>

          <FullWidth>
            <FormGroup>
              <Label htmlFor="description">
                <FileText size={15} />
                Description
              </Label>

              <TextArea
                id="description"
                name="description"
                value={
                  formData.description
                }
                onChange={handleChange}
                placeholder="Add meeting details, agenda or anything the invitee should know..."
              />
            </FormGroup>
          </FullWidth>
        </FormGrid>

        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}

        <FormActions>
          <CancelButton
            type="button"
            onClick={onCancel}
          >
            Cancel
          </CancelButton>

          <SubmitButton
            type="submit"
            disabled={loadingSender}
          >
            Create Event
          </SubmitButton>
        </FormActions>
      </FormBody>
    </FormContainer>
  );
};

export default CreateEventForm;