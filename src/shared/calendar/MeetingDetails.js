import React, { useEffect, useState } from "react";
import { useUserProfile } from "./useUserProfile";
import { formatDateTime, slotKey } from "./calendarUtils";
import { updateMeetingStatus } from "./calendarService";

export default function MeetingDetails({ meeting, onAction, onClose, config }) {
  const { user, userName } = useUserProfile(config);
  const [selectedKey, setSelectedKey] = useState("");
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const slots = meeting.slots || [];
  const selectedSlot = slots.find((s) => slotKey(s) === selectedKey);

  useEffect(() => {
    setSelectedKey(slots.find((s) => s.status === "available") ?
      slotKey(slots.find((s) => s.status === "available")) : "");
    setError(""); setDeclining(false); setReason("");
  }, [meeting.id]); // new meeting resets selection

  const runAction = async (action) => {
    if (processing) return;
    setProcessing(true); setError("");
    try {
      await updateMeetingStatus({
        meeting, currentUid: user?.uid, action, selectedSlot,
        declineReason: reason, senderName: userName,
      });
      onAction?.(meeting.id, action);
    } catch (err) {
      console.error("Calendar action failed:", err);
      setError(err.message || "Could not update the meeting.");
    } finally { setProcessing(false); }
  };
  const isIncomingPending = meeting.canRespond && meeting.status === "pending";
  const isScheduled = meeting.status === "scheduled";
  return <section className="sc-detail" aria-label="Meeting details">
    <h2>{meeting.name}</h2>
    <div className="sc-detail-row"><span className="sc-detail-label">With</span>
      <span>{meeting.counterpartName || meeting.requesterName || (meeting.requestDirection === "personal" ? "Personal event" : "User")}</span></div>
    <div className="sc-detail-row"><span className="sc-detail-label">Location</span><span>{meeting.location || "Virtual"}</span></div>
    <div className="sc-detail-row"><span className="sc-detail-label">Status</span>
      <span className={`sc-badge ${meeting.effectiveStatus}`}>{meeting.effectiveStatus === "past" ? "Past" : meeting.effectiveStatus}</span></div>
    {meeting.description && <div className="sc-detail-row"><span className="sc-detail-label">Description</span><span>{meeting.description}</span></div>}
    <div className="sc-detail-row"><span className="sc-detail-label">Meeting dates</span><div>
      {slots.length === 0 ? "No available dates" : slots.map((slot) => {
        const canChoose = isIncomingPending && slot.status === "available" && slot.date?.getTime() >= Date.now();
        const key = slotKey(slot);
        return <button type="button" key={key} disabled={!canChoose}
          className={`sc-slot ${selectedKey === key && canChoose ? "selected" : ""}`}
          onClick={() => setSelectedKey(key)}>
          {canChoose && <input type="radio" readOnly checked={selectedKey === key} tabIndex={-1} />}
          <span>{formatDateTime(slot.date, slot.timeZone)}
            {slot.timeSlots?.[0]?.end ? ` – ${slot.timeSlots[0].end}` : ""}
            {slot.status === "scheduled" ? " · Confirmed" : slot.status === "unavailable" ? " · Not selected" : ""}
          </span>
        </button>;
      })}
    </div></div>
    {error && <div role="alert" className="sc-message sc-error">{error}</div>}
    {declining && <div className="sc-message">
      <label htmlFor="sc-decline-reason">Reason for declining</label>
      <textarea id="sc-decline-reason" className="sc-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
    </div>}
    <div className="sc-actions">
      {isIncomingPending && !declining && <>
        <button className="sc-btn primary" disabled={processing || !selectedSlot || selectedSlot.status !== "available" || selectedSlot.date < new Date()}
          onClick={() => runAction("scheduled")}>Confirm Selected Slot</button>
        <button className="sc-btn" disabled={processing} onClick={() => setDeclining(true)}>Decline Request</button>
      </>}
      {isIncomingPending && declining && <>
        <button className="sc-btn primary" disabled={processing || !reason.trim()} onClick={() => runAction("declined")}>Submit decline</button>
        <button className="sc-btn" disabled={processing} onClick={() => setDeclining(false)}>Back</button>
      </>}
      {isScheduled && !isIncomingPending && <>
        <button className="sc-btn primary" disabled={processing} onClick={() => runAction("completed")}>Mark Completed</button>
        <button className="sc-btn" disabled={processing} onClick={() => runAction("cancelled")}>Cancel Meeting</button>
      </>}
      {meeting.requestDirection === "outgoing" && meeting.status === "pending" && <span className="sc-message">Awaiting the invitee's response.</span>}
      <button className="sc-btn" disabled={processing} onClick={onClose}>Close</button>
    </div>
  </section>;
}
