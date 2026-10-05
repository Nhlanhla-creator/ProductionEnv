export const getNestedValue = (obj, path) =>
  path?.split(".").reduce((value, key) => (value == null ? null : value[key]), obj) ?? null;

export function toDate(value) {
  if (!value) return null;
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toISO(value) {
  return toDate(value)?.toISOString() ?? null;
}

export const slotStartISO = (slot) => toISO(slot?.date);
export const slotKey = (slot) => `${slotStartISO(slot) || ""}_${slot?.timeSlots?.[0]?.start || ""}`;
export const formatDateTime = (value, timeZone) => {
  const date = toDate(value);
  if (!date) return "Date unavailable";
  return date.toLocaleString(undefined, {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", ...(timeZone ? { timeZone } : {}),
  });
};

export function normalizeCalendarEvent(docSnap, userUid) {
  const data = docSnap.data();
  const ownerUid = data.ownerUid || null;
  const senderId = data.createdBy || data.requesterId || data.ownerUid ||
    (data.funderId === userUid || data.smeId === userUid || data.supplierId === userUid ? userUid : null);
  const recipientId = data.to || null;
  const isInvitation = data.isInvitation === true;
  const localCollection = docSnap.ref.parent.id;
  const slots = (Array.isArray(data.availableDates) ? data.availableDates : []).map((slot) => ({
    ...slot, date: toDate(slot.date), status: slot.status || "available",
  })).filter((slot) => !!slot.date);
  if (!slots.length) {
    const date = toDate(data.scheduledDate || data.date);
    if (date) slots.push({ date, timeSlots: [{ start: data.time || "", end: "" }],
      timeZone: data.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      status: data.status === "scheduled" ? "scheduled" : "available" });
  }
  const direction = recipientId && senderId && senderId !== userUid && (isInvitation || ownerUid === userUid)
    ? "incoming" : recipientId && senderId === userUid && !isInvitation ? "outgoing"
    : !recipientId && senderId === userUid ? "personal" : "other";
  const counterpartId = senderId === userUid ? recipientId : senderId || data.requesterId || null;
  const counterpartName = senderId === userUid
    ? data.toName || "" : data.createdByName || data.requesterName || "";
  const originCollection = data.originCollection || localCollection;
  const originEventId = data.originEventId || docSnap.id;
  const originalStatus = String(data.status || data.meetingStatus || "pending").toLowerCase();
  // Previous investor CreateEventForm saved owner-only personal events as pending.
  // No invitee can answer them; display them as scheduled without an up-front migration.
  const storedStatus = direction === "personal" && originalStatus === "pending"
    ? "scheduled" : originalStatus;
  return {
    ...data,
    id: `${localCollection}-${docSnap.id}`, // safe unique UI key, not a Firestore doc id
    docId: docSnap.id,
    collection: localCollection,
    originEventId,
    originCollection,
    slots,
    name: data.title || "Meeting",
    status: storedStatus,
    createdBy: senderId,
    to: recipientId,
    counterpartId,
    counterpartName,
    requesterId: senderId === userUid ? recipientId : senderId,
    requesterName: data.requesterName || data.createdByName || "",
    requestDirection: direction,
    scheduledDate: toDate(data.scheduledDate),
  };
}

export function effectiveMeetingStatus(meeting, now = new Date()) {
  const status = meeting.status;
  if (status === "cancelled" || status === "completed") return status;
  const slots = meeting.slots || [];
  const scheduled = meeting.scheduledDate || slots.find((s) => s.status === "scheduled")?.date;
  const latest = status === "scheduled" && scheduled
    ? toDate(scheduled)?.getTime() || 0
    : Math.max(0, ...slots.map((s) => s.date?.getTime() || 0));
  return latest > 0 && latest < now.getTime() ? "past" : status;
}

export const uniqueDocs = (documents) => Array.from(
  new Map(documents.map((snapshot) => [`${snapshot.ref.parent.id}/${snapshot.id}`, snapshot])).values()
);
