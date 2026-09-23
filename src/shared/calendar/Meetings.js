import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Plus, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { calendarConfigs, calendarRoleByRecipientType } from "./calendarConfig";
import { resolveProfile } from "./calendarData";
import { createCalendarEvent } from "./calendarService";
import { effectiveMeetingStatus, normalizeCalendarEvent, uniqueDocs, formatDateTime } from "./calendarUtils";
import Modal from "./Modal";
import CreateEventForm from "./CreateEventForm";
import MeetingDetails from "./MeetingDetails";
import { useUserProfile } from "./useUserProfile";

const TABS = [
  { id: "incoming", label: "Incoming Requests" },
  { id: "requested", label: "Requested" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
];
const isSameDate = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const startOfWeek = (d) => { const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()); start.setDate(start.getDate() - start.getDay()); return start; };
const fmtDate = (d) => d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export default function Meetings({ config, matchesList = [], loadingRecipients = false, onStatsChange }) {
  const { user, userName, email } = useUserProfile(config);
  const [activeTab, setActiveTab] = useState("incoming");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarView, setCalendarView] = useState("month");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(() => new Date());
  const profileNameCache = useRef(new Map());

  // Read all role-specific event sources. Each role sees its own event copies only.
  useEffect(() => {
    const listeners = [];
    let active = true;
    setMeetings([]); setLoading(true); setError("");
    const unsubscribeAuth = onAuthStateChanged(auth, (session) => {
      listeners.splice(0).forEach((unsub) => unsub());
      if (!session) {
        setMeetings([]); setLoading(false);
        return;
      }
      const sources = config.eventSources || [];
      if (!sources.length) { setMeetings([]); setLoading(false); return; }
      const byQuery = new Map();
      const awaiting = new Set(sources.map((source, index) => `${index}`));
      const refresh = () => {
        if (!active) return;
        const snapshots = uniqueDocs(Array.from(byQuery.values()).flat());
        const owned = snapshots.filter((snapshot) => {
          const data = snapshot.data();
          if (data.ownerUid && data.ownerUid !== session.uid) return false;
          if (data.ownerUid === session.uid) return true;
          // Legacy event copied to an investor under smeId by the original SME calendar.
          const hasLegacyOwner = data.smeId === session.uid || data.funderId === session.uid || data.supplierId === session.uid;
          return hasLegacyOwner;
        });
        setMeetings(owned.map((snap) => normalizeCalendarEvent(snap, session.uid)));
        if (!awaiting.size) setLoading(false);
      };
      sources.forEach((source, index) => {
        const key = `${index}`;
        const request = query(collection(db, source.collection), where(source.field, "==", session.uid));
        const unsub = onSnapshot(request, (snapshot) => {
          if (!active) return;
          byQuery.set(key, source.legacyInviteOnly
            ? snapshot.docs.filter((snap) => snap.data().isInvitation === true && snap.data().to === session.uid)
            : snapshot.docs);
          awaiting.delete(key);
          refresh();
        }, (err) => {
          if (!active) return;
          console.error(`Calendar query ${source.collection}.${source.field} failed`, err);
          setError((previous) => previous || `Some calendar events could not be loaded: ${err.message}`);
          byQuery.set(key, []); awaiting.delete(key); refresh();
        });
        listeners.push(unsub);
      });
    });
    return () => { active = false; unsubscribeAuth(); listeners.splice(0).forEach((unsub) => unsub()); };
  }, [config]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Read missing counterpart names without triggering Firestore re-subscription loops.
  useEffect(() => {
    if (!user?.uid || !meetings.length) return;
    let active = true;
    const missing = meetings.filter((meeting) => meeting.counterpartId && !meeting.counterpartName && !profileNameCache.current.has(meeting.counterpartId));
    if (!missing.length) return;
    Promise.all(missing.map(async (meeting) => {
      const counterpartConfig = meeting.createdBy === user.uid
        ? calendarConfigs[calendarRoleByRecipientType[matchesList.find((r) => r.id === meeting.counterpartId)?.type]] || config
        : config.role === "investor" ? calendarConfigs.sme : config;
      const profile = await resolveProfile(meeting.counterpartId, counterpartConfig);
      profileNameCache.current.set(meeting.counterpartId, profile.name);
    })).then(() => {
      if (active) setMeetings((previous) => previous.map((m) => ({
        ...m, counterpartName: m.counterpartName || profileNameCache.current.get(m.counterpartId) || "",
      })));
    });
    return () => { active = false; };
  }, [meetings, user?.uid, matchesList, config]);

  const processedMeetings = useMemo(() => meetings.map((meeting) => {
    const effectiveStatus = effectiveMeetingStatus(meeting, now);
    return {
      ...meeting,
      effectiveStatus,
      isIncomingRequest: effectiveStatus === "pending" && meeting.requestDirection === "incoming",
      isOutgoingRequest: effectiveStatus === "pending" && meeting.requestDirection === "outgoing",
      canRespond: effectiveStatus === "pending" && meeting.requestDirection === "incoming",
    };
  }), [meetings, now]);

  useEffect(() => {
    if (!onStatsChange) return;
    onStatsChange({
      created: meetings.filter((m) => m.createdBy === user?.uid).length,
      scheduled: meetings.filter((m) => m.status === "scheduled").length,
      completed: meetings.filter((m) => m.status === "completed").length,
      cancelled: meetings.filter((m) => m.status === "cancelled").length,
    });
  }, [meetings, onStatsChange, user?.uid]);

  const filteredMeetings = useMemo(() => processedMeetings.filter((meeting) => {
    if (activeTab === "incoming") return meeting.isIncomingRequest;
    if (activeTab === "requested") return meeting.isOutgoingRequest;
    if (activeTab === "upcoming") return meeting.effectiveStatus === "scheduled";
    return ["past", "completed", "cancelled"].includes(meeting.effectiveStatus);
  }).sort((a, b) => {
    const at = a.scheduledDate?.getTime() || Math.max(0, ...a.slots.map((s) => s.date.getTime()));
    const bt = b.scheduledDate?.getTime() || Math.max(0, ...b.slots.map((s) => s.date.getTime()));
    return activeTab === "past" ? bt - at : at - bt;
  }), [processedMeetings, activeTab]);

  // Show each offered slot while pending, only the chosen slot once scheduled.
  const calendarEntries = useMemo(() => processedMeetings.flatMap((meeting) => {
    const slots = meeting.status === "scheduled"
      ? meeting.slots.filter((slot) => slot.status === "scheduled" || (meeting.scheduledDate && slot.date.getTime() === meeting.scheduledDate.getTime()))
      : meeting.slots;
    return slots.map((slot) => ({ meeting, date: slot.date, slot }));
  }), [processedMeetings]);

  const handleCreateEvent = useCallback(async (newEvent) => {
    if (!user) throw new Error("Please sign in.");
    const recipients = await Promise.all(matchesList.map(async (person) => {
      if (!newEvent.to || person.id !== newEvent.to || person.email) return person;
      const targetConfig = calendarConfigs[calendarRoleByRecipientType[person.type]] || config;
      const profile = await resolveProfile(person.id, targetConfig);
      return { ...person, email: profile.email, name: person.name || profile.name };
    }));
    await createCalendarEvent({ newEvent, config, sender: { uid: user.uid, name: userName, email }, recipients });
    setNotice("Event created successfully.");
    setShowCreateModal(false);
  }, [user, userName, email, config, matchesList]);

  const handleAction = useCallback(() => {
    setSelectedMeeting(null);
    setNotice("Meeting updated successfully.");
  }, []);

  const navigateDate = (direction) => setCurrentDate((previous) => {
    const d = new Date(previous);
    if (calendarView === "day") d.setDate(d.getDate() + direction);
    else if (calendarView === "week") d.setDate(d.getDate() + 7 * direction);
    else d.setMonth(d.getMonth() + direction);
    return d;
  });
  const eventChip = (entry) => <button key={`${entry.meeting.id}-${entry.date.toISOString()}-${entry.slot.timeSlots?.[0]?.start || ""}`}
    type="button" className={`sc-cal-event ${entry.meeting.effectiveStatus}`}
    onClick={() => setSelectedMeeting(entry.meeting)} title={`${entry.meeting.name} · ${formatDateTime(entry.date)}`}>
    {entry.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} {entry.meeting.name}
  </button>;
  const dayEntries = (day) => calendarEntries.filter((entry) => isSameDate(entry.date, day)).sort((a,b) => a.date - b.date);

  const calendarContent = () => {
    if (calendarView === "day") {
      return <div className="sc-day-list">{Array.from({ length: 24 }, (_, hour) => <div className="sc-hour" key={hour}>
        <div className="sc-time">{String(hour).padStart(2, "0")}:00</div>
        <div className="sc-event-group">{dayEntries(currentDate).filter((entry) => entry.date.getHours() === hour).map(eventChip)}</div>
      </div>)}</div>;
    }
    if (calendarView === "week") {
      const start = startOfWeek(currentDate);
      return <><div className="sc-weekdays">{Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start); d.setDate(d.getDate() + i);
        return <div key={i} className="sc-weekday">{d.toLocaleDateString(undefined, { weekday: "short" })} {d.getDate()}</div>;
      })}</div><div className="sc-week-grid">{Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start); d.setDate(d.getDate() + i);
        return <div className={`sc-day ${isSameDate(d, new Date()) ? "today" : ""}`} key={i}>
          {dayEntries(d).map(eventChip)}</div>;
      })}</div></>;
    }
    const first = startOfWeek(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    return <><div className="sc-weekdays">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div className="sc-weekday" key={day}>{day}</div>)}</div>
      <div className="sc-month-grid">{Array.from({ length: 42 }, (_, i) => {
        const d = new Date(first); d.setDate(d.getDate() + i);
        const muted = d.getMonth() !== currentDate.getMonth();
        return <div key={d.toISOString()} className={`sc-day ${muted ? "muted" : ""} ${isSameDate(d, new Date()) ? "today" : ""}`}>
          <div className="sc-day-number">{d.getDate()}</div>{dayEntries(d).map(eventChip)}
        </div>;
      })}</div></>;
  };
  const calendarLabel = calendarView === "day" ? fmtDate(currentDate)
    : calendarView === "week" ? `${fmtDate(startOfWeek(currentDate))} – ${fmtDate(new Date(startOfWeek(currentDate).getTime() + 6 * 86400000))}`
    : currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return <section className="sc-card">
    <header className="sc-header"><h2 className="sc-title">Meetings</h2>
      <div className="sc-actions"><button className="sc-btn" onClick={() => setShowCalendar(true)}><CalendarDays size={16} />Calendar</button>
        <button className="sc-btn primary" onClick={() => setShowCreateModal(true)}><Plus size={16} />Create Event</button></div></header>
    <div className="sc-tabs" role="tablist" aria-label="Meeting status">{TABS.map((tab) => <button role="tab" aria-selected={activeTab === tab.id}
      key={tab.id} onClick={() => setActiveTab(tab.id)} className={`sc-tab ${activeTab === tab.id ? "active" : ""}`}>{tab.label}</button>)}</div>
    {notice && <div role="status" className="sc-message">{notice}</div>}
    {error && <div role="alert" className="sc-message sc-error">{error}</div>}
    {loading ? <div className="sc-empty">Loading meetings...</div> : <div className="sc-table-wrap"><table className="sc-table">
      <thead><tr><th>Meeting</th><th>With</th><th>Proposed Dates</th><th>Location</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>{filteredMeetings.length ? filteredMeetings.map((meeting) => <tr key={meeting.id}>
        <td>{meeting.name}</td><td>{meeting.counterpartName || (meeting.requestDirection === "personal" ? "Personal event" : meeting.requesterName || "User")}</td>
        <td>{meeting.slots.length} {meeting.slots.length === 1 ? "option" : "options"}</td>
        <td>{meeting.location || "Virtual"}</td>
        <td><span className={`sc-badge ${meeting.effectiveStatus}`}>{meeting.isOutgoingRequest ? "Awaiting response" : meeting.isIncomingRequest ? "Needs response" : meeting.effectiveStatus}</span></td>
        <td><button className="sc-btn" onClick={() => setSelectedMeeting(meeting)}><Eye size={15} />{meeting.canRespond ? "Review" : "View"}</button></td>
      </tr>) : <tr><td colSpan={6} className="sc-empty">{activeTab === "incoming" ? "No incoming meeting requests" : activeTab === "requested" ? "No outgoing requests awaiting a response" : activeTab === "upcoming" ? "No upcoming meetings" : "No past meetings"}</td></tr>}</tbody>
    </table></div>}
    {showCreateModal && <Modal onClose={() => setShowCreateModal(false)}>
      <CreateEventForm config={config} onSubmit={handleCreateEvent} onCancel={() => setShowCreateModal(false)}
        previousRecipients={matchesList} loadingRecipients={loadingRecipients} />
    </Modal>}
    {selectedMeeting && <Modal onClose={() => setSelectedMeeting(null)}>
      <MeetingDetails key={selectedMeeting.id} meeting={selectedMeeting} config={config} onClose={() => setSelectedMeeting(null)} onAction={handleAction} />
    </Modal>}
    {showCalendar && <Modal onClose={() => setShowCalendar(false)}><div className="sc-calendar">
      <div className="sc-cal-toolbar"><div className="sc-nav"><button className="sc-btn" onClick={() => navigateDate(-1)} aria-label="Previous"><ChevronLeft size={18} /></button>
        <h3 className="sc-cal-heading">{calendarLabel}</h3><button className="sc-btn" onClick={() => navigateDate(1)} aria-label="Next"><ChevronRight size={18} /></button></div>
        <div className="sc-actions"><button className="sc-btn" onClick={() => setCurrentDate(new Date())}>Today</button>
          <select aria-label="Calendar view" className="sc-view-select" value={calendarView} onChange={(event) => setCalendarView(event.target.value)}>
            <option value="day">Day</option><option value="week">Week</option><option value="month">Month</option>
          </select></div></div>
      {calendarContent()}
    </div></Modal>}
  </section>;
}
