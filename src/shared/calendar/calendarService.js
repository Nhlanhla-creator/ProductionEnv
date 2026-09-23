import {
  collection, doc, writeBatch, runTransaction, addDoc, updateDoc,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../../firebaseConfig";
import { calendarRoleByRecipientType, calendarConfigs } from "./calendarConfig";
import { slotKey, toISO } from "./calendarUtils";

// Both copies share an origin ID and store their OWN calendar owner.
export async function createCalendarEvent({ newEvent, config, sender, recipients }) {
  if (!sender?.uid) throw new Error("Please sign in before creating an event.");
  const slots = newEvent.availableDates;
  if (!Array.isArray(slots) || !slots.length) throw new Error("Select at least one date and time.");
  if (!slots.every((s) => toISO(s.date) && s.timeSlots?.[0]?.start && s.timeSlots?.[0]?.end))
    throw new Error("All proposed dates must have valid start/end times.");
  if (slots.some((slot) => new Date(slot.date).getTime() < Date.now()))
    throw new Error("Meeting dates must be in the future.");

  const recipient = newEvent.to ? recipients.find((person) => person.id === newEvent.to) : null;
  if (newEvent.to && !recipient) throw new Error("Please select a recipient from your matches.");
  if (recipient?.id === sender.uid) throw new Error("You cannot invite yourself.");
  const inviteeRole = recipient ? calendarRoleByRecipientType[recipient.type] : null;
  if (recipient && !calendarConfigs[inviteeRole])
    throw new Error(`Calendar support for ${recipient.type} requires a role configuration.`);
  const inviteeConfig = recipient ? calendarConfigs[inviteeRole] : null;
  const now = new Date().toISOString();
  const hasInvitee = !!recipient;
  const localSlots = hasInvitee ? slots.map((s) => ({ ...s, status: "available" }))
    : [{ ...slots[0], status: "scheduled" }];
  const originRef = doc(collection(db, config.eventCollection));
  const inviteeRef = hasInvitee ? doc(collection(db, inviteeConfig.eventCollection)) : null;
  const first = localSlots[0];
  const base = {
    title: newEvent.title.trim(), description: newEvent.description || "",
    location: newEvent.location || "Virtual", duration: newEvent.duration || "30",
    date: first.date, time: first.timeSlots[0].start, availableDates: localSlots,
    scheduledDate: hasInvitee ? null : first.date,
    scheduledTimeSlot: hasInvitee ? null : first.timeSlots[0],
    timeZone: first.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    status: hasInvitee ? "pending" : "scheduled",
    meetingStatus: hasInvitee ? "pending" : "scheduled",
    createdBy: sender.uid, createdByName: sender.name || sender.email || config.label,
    to: recipient?.id || "", toName: recipient?.name || "", toEmail: recipient?.email || "",
    host: sender.name || config.label,
    participants: hasInvitee ? [sender.uid, recipient.id] : [sender.uid],
    originEventId: originRef.id, originCollection: config.eventCollection,
    inviteeEventId: inviteeRef?.id || null,
    createdAt: now, updatedAt: now,
    // These optional links are carried only if already established by the matching application.
    ...(recipient?.applicationId && recipient?.sourceCollection ? {
      applicationId: recipient.applicationId, applicationCollection: recipient.sourceCollection,
    } : {}),
  };
  const batch = writeBatch(db);
  const origin = {
    ...base, ownerUid: sender.uid, ownerRole: config.role, isInvitation: false,
    [config.ownerField]: sender.uid,
    [config.ownerNameField]: sender.name || config.label,
  };
  batch.set(originRef, origin);
  if (inviteeRef) {
    const invitee = {
      ...base,
      ownerUid: recipient.id, ownerRole: inviteeConfig.role, isInvitation: true,
      [inviteeConfig.ownerField]: recipient.id,
      [inviteeConfig.ownerNameField]: recipient.name || inviteeConfig.label,
    };
    // Never carry the sender's owner-field into the invitee copy, or a sender
    // could read both copies and the wrong user could appear as the owner.
    if (config.ownerField !== inviteeConfig.ownerField) delete invitee[config.ownerField];
    batch.set(inviteeRef, invitee);
  }
  await batch.commit();

  if (hasInvitee) {
    try {
      const message = {
        from: sender.uid, fromName: sender.name || config.label,
        to: recipient.id, toName: recipient.name,
        subject: `Meeting invitation: ${origin.title}`,
        content: `${sender.name || config.label} invited you to ${origin.title}. Open your calendar to choose one of the proposed times.`,
        date: now, read: false, type: "inbox", meetingId: inviteeRef.id,
        originEventId: originRef.id, originCollection: config.eventCollection,
      };
      await addDoc(collection(db, "messages"), message);
    } catch (error) { console.error("Event saved, but in-app invitation message failed:", error); }
    if (recipient.email) {
      try {
        const sendEmail = httpsCallable(getFunctions(), "sendMeetingInviteEmail");
        await sendEmail({
          to: recipient.email, name: recipient.name, senderName: origin.createdByName,
          meetingTitle: origin.title, meetingDate: newEvent.date,
          meetingTime: newEvent.time, location: origin.location,
          description: origin.description,
          linkTo: `${window.location.origin}${inviteeConfig.route}`,
        });
      } catch (error) { console.warn("Event saved, but invitation email could not be sent:", error); }
    }
  }
  return { originId: originRef.id, inviteeId: inviteeRef?.id || null };
}

export async function updateMeetingStatus({ meeting, currentUid, action, selectedSlot, declineReason = "", senderName = "" }) {
  if (!currentUid) throw new Error("Please sign in.");
  if (!meeting?.collection || !meeting.docId) throw new Error("Meeting document ID is missing.");
  const localRef = doc(db, meeting.collection, meeting.docId);
  const now = new Date().toISOString();
  let result;
  await runTransaction(db, async (transaction) => {
    const localSnap = await transaction.get(localRef);
    if (!localSnap.exists()) throw new Error("The meeting no longer exists.");
    const local = localSnap.data();
    // This checks the owner of the user's own copy, not a counterpart id.
    const legacyOwned = local.smeId === currentUid || local.funderId === currentUid || local.supplierId === currentUid;
    if ((local.ownerUid && local.ownerUid !== currentUid) || (!local.ownerUid && !legacyOwned))
      throw new Error("This meeting does not belong to your calendar.");
    const isInvitee = !!local.to && local.to === currentUid && local.createdBy !== currentUid && local.isInvitation === true;
    const currentStatus = local.status || local.meetingStatus || "pending";
    const legacyPersonalPending = currentStatus === "pending" && !local.to &&
      (local.createdBy === currentUid || (!local.createdBy && legacyOwned));
    if ((action === "scheduled" || action === "declined") && (!isInvitee || currentStatus !== "pending"))
      throw new Error("Only a pending invitation's recipient can confirm or decline it.");
    if ((action === "completed" || action === "cancelled") && currentStatus !== "scheduled" && !legacyPersonalPending)
      throw new Error("Only a scheduled meeting can be completed or cancelled.");

    let updates;
    if (action === "scheduled") {
      if (!selectedSlot) throw new Error("Choose a proposed date and time.");
      const chosenKey = slotKey(selectedSlot);
      const present = (local.availableDates || []).some((slot) => slotKey(slot) === chosenKey && slot.status === "available");
      if (!present) throw new Error("That time is no longer available. Please refresh.");
      const chosen = (local.availableDates || []).find((slot) => slotKey(slot) === chosenKey);
      updates = {
        status: "scheduled", meetingStatus: "scheduled", scheduledDate: toISO(chosen.date),
        scheduledTimeSlot: chosen.timeSlots[0],
        availableDates: local.availableDates.map((slot) => ({ ...slot, status: slotKey(slot) === chosenKey ? "scheduled" : "unavailable" })),
        updatedAt: now,
      };
    } else if (action === "declined" || action === "cancelled") {
      if (action === "declined" && !declineReason.trim()) throw new Error("Give a reason for declining.");
      updates = {
        status: "cancelled", meetingStatus: "cancelled", updatedAt: now,
        ...(action === "declined" ? { declineReason: declineReason.trim() } : {}),
      };
    } else if (action === "completed") {
      updates = { status: "completed", meetingStatus: "completed", updatedAt: now };
    } else throw new Error("Unsupported meeting action.");

    const originId = local.originEventId;
    const originCollection = local.originCollection || meeting.collection;
    const originRef = originId ? doc(db, originCollection, originId) : null;
    const isOrigin = originRef && originRef.path === localRef.path;
    const counterpartRef = !isOrigin && originRef ? originRef
      : local.inviteeEventId ? doc(db, local.inviteeCollection || meeting.collection, local.inviteeEventId) : null;
    // All transaction reads must happen before any transaction writes.
    const counterpartSnap = counterpartRef && counterpartRef.path !== localRef.path
      ? await transaction.get(counterpartRef) : null;
    if (counterpartSnap?.exists()) {
      const counterpart = counterpartSnap.data();
      if (counterpart.originEventId && counterpart.originEventId !== (originId || meeting.docId))
        throw new Error("The linked meeting has changed. Please refresh.");
      transaction.update(counterpartRef, updates);
    }
    transaction.update(localRef, updates);
    result = {
      applicationCollection: local.applicationCollection || (local.investorAppId ? "investorApplications" : local.smeAppId ? "smeApplications" : null),
      applicationId: local.applicationId || local.investorAppId || local.smeAppId || null,
      otherUid: local.createdBy === currentUid ? local.to : local.createdBy,
      title: local.title || "Meeting", action,
      localId: meeting.docId,
      counterpartId: counterpartSnap?.exists() ? counterpartRef.id : null,
    };
  });
  // Legacy application links are best-effort; failure must not roll back a confirmed meeting.
  if (result?.applicationCollection && result?.applicationId) {
    try {
      await updateDoc(doc(db, result.applicationCollection, result.applicationId), {
        meetingStatus: action === "declined" ? "cancelled" : action,
        lastUpdated: now,
      });
    } catch (error) { console.warn("Calendar saved, application status not synchronized:", error); }
  }
  if (result?.otherUid && result.otherUid !== currentUid) {
    try {
      const descriptions = { scheduled: "confirmed", declined: "declined", cancelled: "cancelled", completed: "marked as completed" };
      await addDoc(collection(db, "messages"), {
        from: currentUid, fromName: senderName || "Calendar user", to: result.otherUid,
        subject: `Meeting ${descriptions[action]}: ${result.title}`,
        content: `${senderName || "The other participant"} ${descriptions[action]} the meeting: ${result.title}.`,
        date: now, read: false, type: "inbox", meetingId: result.counterpartId || result.localId,
      });
    } catch (error) { console.error("Status saved, but message could not be sent:", error); }
  }
  return result;
}
