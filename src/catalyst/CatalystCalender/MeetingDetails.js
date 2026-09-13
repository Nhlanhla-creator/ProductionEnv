import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar as CalendarIcon, Plus, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import Modal from './Modal';
import CreateEventForm from './CreateEventForm';
import MeetingDetails from './MeetingDetails';
import { db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Color palette
const colors = {
  darkBrown: '#5D4037',
  mediumBrown: '#8D6E63',
  lightBrown: '#D7CCC8',
  cream: '#EFEBE9',
  accentBrown: '#A1887F',
  textDark: '#3E2723',
  textLight: '#EFEBE9'
};

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInRow = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

// Styled components
const MeetingsContainer = styled.div`
  background: linear-gradient(135deg, ${colors.cream}, ${colors.lightBrown});
  border-radius: 20px;
  padding: 30px;
  box-shadow: 
    0 20px 60px rgba(58, 35, 20, 0.15),
    0 8px 25px rgba(92, 57, 33, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(140, 104, 66, 0.2);
  min-height: 600px;
  animation: ${fadeInUp} 0.6s ease-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 3px solid ${colors.accentBrown};
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -3px;
    left: 0;
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, ${colors.mediumBrown}, ${colors.darkBrown});
    border-radius: 2px;
  }
`;

const Title = styled.h2`
  color: ${colors.textDark};
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0;
  text-shadow: 0 2px 4px rgba(58, 35, 20, 0.1);
  letter-spacing: -1px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 15px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, ${colors.mediumBrown}, ${colors.darkBrown});
  color: ${colors.textLight};
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(58, 35, 20, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    background: linear-gradient(135deg, ${colors.accentBrown}, ${colors.mediumBrown});
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(58, 35, 20, 0.4);
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 5px;
  margin-bottom: 25px;
  background: rgba(140, 104, 66, 0.1);
  padding: 8px;
  border-radius: 16px;
  border: 1px solid rgba(140, 104, 66, 0.2);
`;

const TabButton = styled.button`
  flex: 1;
  padding: 14px 20px;
  border: none;
  background: transparent;
  color: ${colors.textDark};
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    background: rgba(140, 104, 66, 0.15);
    color: ${colors.textDark};
  }

  &.active {
    background: linear-gradient(135deg, ${colors.mediumBrown}, ${colors.darkBrown});
    color: ${colors.textLight};
    box-shadow: 0 4px 15px rgba(58, 35, 20, 0.2);
    transform: translateY(-1px);
  }
`;

const TableContainer = styled.div`
  background: rgba(245, 240, 232, 0.4);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(140, 104, 66, 0.15);
  overflow-x: auto;
  box-shadow: inset 0 2px 8px rgba(58, 35, 20, 0.05);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: transparent;
`;

const TableHead = styled.thead`
  background: linear-gradient(135deg, ${colors.mediumBrown}, ${colors.darkBrown});
`;

const TableHeader = styled.th`
  padding: 18px 16px;
  text-align: left;
  color: ${colors.textLight};
  font-weight: 700;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: none;
  position: relative;

  &:first-child {
    border-radius: 12px 0 0 12px;
  }

  &:last-child {
    border-radius: 0 12px 12px 0;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(245, 240, 232, 0.3), transparent);
  }
`;

const TableRow = styled.tr`
  background: rgba(245, 240, 232, 0.3);
  border-bottom: 1px solid rgba(140, 104, 66, 0.1);
  transition: all 0.3s ease;
  animation: ${slideInRow} 0.3s ease-out;
  animation-fill-mode: both;

  &:hover {
    background: rgba(245, 240, 232, 0.6);
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(58, 35, 20, 0.1);
  }

  &:nth-child(even) {
    background: rgba(237, 228, 211, 0.3);
  }

  &:nth-child(even):hover {
    background: rgba(237, 228, 211, 0.6);
  }
`;

const TableCell = styled.td`
  padding: 16px;
  color: ${colors.textDark};
  font-size: 0.95rem;
  font-weight: 500;
  border: none;
  vertical-align: middle;
`;

const DatesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DateChip = styled.span`
  font-size: 0.82rem;
  color: ${colors.darkBrown};
  background: rgba(140, 104, 66, 0.12);
  border-radius: 8px;
  padding: 3px 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
`;

const DateChipStatus = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: ${props => {
    switch (props.status) {
      case 'scheduled': return '#2e7d32';
      case 'unavailable': return '#c62828';
      default: return '#8D6E63';
    }
  }};
`;

const MoreDatesLink = styled.span`
  font-size: 0.78rem;
  color: ${colors.mediumBrown};
  font-weight: 600;
  cursor: default;
`;

const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white;
  background-color: ${props => {
    switch (props.status) {
      case 'scheduled': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      case 'completed': return '#2196F3';
      default: return '#9E9E9E';
    }
  }};
`;

const ViewButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, ${colors.mediumBrown}, ${colors.darkBrown});
  color: ${colors.textLight};
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, ${colors.accentBrown}, ${colors.mediumBrown});
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(58, 35, 20, 0.3);
  }
`;

const NoMeetings = styled.td`
  text-align: center;
  padding: 30px;
  color: ${colors.mediumBrown};
  font-weight: 600;
`;

// Calendar Components
const CalendarModal = styled.div`
  width: 98vw;
  height: 85vh;
  max-width: none;
  background: linear-gradient(135deg, ${colors.cream}, ${colors.lightBrown});
  border-radius: 20px;
  padding: 25px;
  box-shadow: 
    0 20px 60px rgba(58, 35, 20, 0.15),
    0 8px 25px rgba(92, 57, 33, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(140, 104, 66, 0.2);
  display: flex;
  flex-direction: column;
  margin: 0;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 3px solid ${colors.accentBrown};
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -3px;
    left: 0;
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, ${colors.mediumBrown}, ${colors.darkBrown});
    border-radius: 2px;
  }
`;

const CalendarTitle = styled.h2`
  color: ${colors.textDark};
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0;
  text-shadow: 0 2px 4px rgba(58, 35, 20, 0.1);
  letter-spacing: -1px;
`;

const CalendarNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const NavButton = styled.button`
  background: rgba(140, 104, 66, 0.1);
  border: 1px solid rgba(140, 104, 66, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  color: ${colors.textDark};
  transition: all 0.3s ease;
  display: flex;
  align-items: center;

  &:hover {
    background: rgba(140, 104, 66, 0.2);
    transform: scale(1.05);
  }
`;

const CalendarActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const TodayButton = styled.button`
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, ${colors.mediumBrown}, ${colors.darkBrown});
  color: ${colors.textLight};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, ${colors.accentBrown}, ${colors.mediumBrown});
    transform: translateY(-2px);
  }
`;

const ViewSelect = styled.select`
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(140, 104, 66, 0.3);
  background: rgba(245, 240, 232, 0.8);
  color: ${colors.textDark};
  font-weight: 500;
`;

const CalendarContent = styled.div`
  flex: 1;
  overflow: auto;
  width: 100%;
`;

// Month View Components
const MonthView = styled.div`
  width: 100%;
  height: 100%;
  background: rgba(245, 240, 232, 0.4);
  border-radius: 16px;
  padding: 15px;
  border: 1px solid rgba(140, 104, 66, 0.15);
  box-shadow: inset 0 2px 8px rgba(58, 35, 20, 0.05);
`;

const MonthHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: 700;
  color: ${colors.textDark};
  padding: 0.5rem 0;
  text-transform: uppercase;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
`;

const MonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(100px, auto);
  gap: 5px;
  height: calc(100% - 30px);
`;

const MonthDay = styled.div`
  background: rgba(245, 240, 232, 0.6);
  border-radius: 8px;
  padding: 8px;
  border: 1px solid rgba(140, 104, 66, 0.1);
  transition: all 0.3s ease;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &:hover {
    background: rgba(140, 104, 66, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(58, 35, 20, 0.1);
  }

  &.other-month {
    color: #aaa;
    background: rgba(245, 240, 232, 0.3);
  }

  &.today {
    background: rgba(140, 104, 66, 0.1);
    border: 1px solid rgba(140, 104, 66, 0.3);
  }
`;

const DayNumber = styled.div`
  font-weight: 700;
  color: ${colors.textDark};
  margin-bottom: 5px;
  text-align: right;
`;

const DayEvents = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow-y: auto;
  padding-right: 2px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(140, 104, 66, 0.3);
    border-radius: 2px;
  }
`;

const CalendarEvent = styled.div`
  padding: 6px;
  border-radius: 6px;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: ${props => {
    switch (props.status) {
      case 'scheduled': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      case 'completed': return '#2196F3';
      default: return '#9E9E9E';
    }
  }};

  &:hover {
    opacity: 0.9;
    transform: translateX(2px);
  }
`;

const EventTime = styled.div`
  font-weight: 600;
  margin-bottom: 2px;
  font-size: 0.7rem;
`;

const EventTitle = styled.div`
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Week View Components
const WeekView = styled.div`
  width: 100%;
  height: 100%;
  background: rgba(245, 240, 232, 0.4);
  border-radius: 16px;
  padding: 15px;
  border: 1px solid rgba(140, 104, 66, 0.15);
  box-shadow: inset 0 2px 8px rgba(58, 35, 20, 0.05);
`;

const WeekHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 10px;
`;

const WeekdayHeader = styled.div`
  padding: 0.5rem;
  border-bottom: 2px solid ${colors.accentBrown};

  &.today {
    background: rgba(140, 104, 66, 0.1);
    border-radius: 8px 8px 0 0;
  }
`;

const WeekdayName = styled.div`
  font-size: 0.9rem;
  color: ${colors.textDark};
  font-weight: 600;
  text-transform: uppercase;
`;

const WeekdayDate = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${colors.textDark};
`;

const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(100px, auto);
  gap: 5px;
  height: calc(100% - 50px);
`;

const WeekdayCell = styled.div`
  background: rgba(245, 240, 232, 0.6);
  border-radius: 8px;
  padding: 8px;
  border: 1px solid rgba(140, 104, 66, 0.1);
  min-height: 100px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(140, 104, 66, 0.3);
    border-radius: 2px;
  }

  &.today {
    background: rgba(140, 104, 66, 0.1);
    border: 1px solid rgba(140, 104, 66, 0.3);
  }
`;

// Day View Components
const DayView = styled.div`
  width: 100%;
  height: 100%;
  background: rgba(245, 240, 232, 0.4);
  border-radius: 16px;
  padding: 15px;
  border: 1px solid rgba(140, 104, 66, 0.15);
  box-shadow: inset 0 2px 8px rgba(58, 35, 20, 0.05);
`;

const DayHeader = styled.div`
  padding: 0.5rem;
  margin-bottom: 15px;
  border-bottom: 2px solid ${colors.accentBrown};
`;

const DayTitle = styled.h3`
  color: ${colors.textDark};
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
`;

const TimeSlots = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 60px);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(140, 104, 66, 0.3);
    border-radius: 3px;
  }
`;

const HourRow = styled.div`
  display: flex;
  min-height: 60px;
  border-bottom: 1px solid rgba(140, 104, 66, 0.1);
`;

const HourLabel = styled.div`
  width: 80px;
  padding: 0.5rem;
  text-align: right;
  font-size: 0.9rem;
  color: ${colors.textDark};
  font-weight: 600;
`;

const HourEvents = styled.div`
  flex: 1;
  padding: 0.5rem;
  position: relative;
`;

const EventCounterpart = styled.div`
  font-size: 0.7rem;
  opacity: 0.9;
`;

// ─── Date formatting for the "Dates Requested" column ──────────────────────
// Shows the catalyst exactly which dates/times they proposed and each one's
// current status — "available" (still open), "scheduled" (SME picked this
// one), "unavailable" (SME picked a different slot, per MeetingDetails.jsx's
// handleAccept, which marks every non-chosen slot "unavailable").
const formatSlotChip = (slot) => {
  const dateLabel = slot.date instanceof Date && !isNaN(slot.date)
    ? slot.date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
    : 'Date TBC';
  const timeLabel = slot.timeSlots?.[0]?.start
    ? ` · ${slot.timeSlots[0].start}${slot.timeSlots[0].end ? `–${slot.timeSlots[0].end}` : ''}`
    : '';
  return `${dateLabel}${timeLabel}`;
};

const MAX_VISIBLE_DATE_CHIPS = 3;

// Main Component — Catalyst variant.
//
// Same shape as the SME-facing Meetings.jsx, adapted for the catalyst's
// perspective: the catalyst is always the requester (never the recipient),
// so every meeting here is one *they* sent, and the "counterpart" worth
// showing is the SME on the other end, not themselves.
const Meetings = ({ stats, setStats, matchesList }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarView, setCalendarView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [smeCache, setSmeCache] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const now = useMemo(() => new Date(), []);

  // Cache SME names to avoid duplicate fetches.
  //
  // Same anti-loop shape as the SME-side file: a lookup miss is cached as
  // `null` (not omitted), and the "already looked up" check is `id in cache`
  // rather than a truthy check — otherwise a confirmed miss gets re-queried
  // on every fetch, which produces a new cache object every time, which
  // (if this were a dependency of the effect below) would retrigger it
  // forever. See fetchMeetings' useEffect comment for the full story.
  const fetchSmeDetails = useCallback(async (smeIds) => {
    const uniqueIds = [...new Set(smeIds.filter(id => id && !(id in smeCache)))];

    if (uniqueIds.length === 0) return smeCache;

    try {
      const profilesRef = collection(db, "MyuniversalProfiles");
      const queries = uniqueIds.map(id =>
        query(profilesRef, where("__name__", "==", id))
      );

      const snapshots = await Promise.all(queries.map(q => getDocs(q)));
      const newCache = { ...smeCache };

      snapshots.forEach((snapshot, index) => {
        const smeId = uniqueIds[index];

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const formData = doc.data()?.formData;

          let smeName = '';
          if (formData?.entityOverview?.registeredName) {
            smeName = formData.entityOverview.registeredName;
          } else if (formData?.entityOverview?.tradingName) {
            smeName = formData.entityOverview.tradingName;
          } else if (formData?.contactDetails?.primaryContactName) {
            smeName = formData.contactDetails.primaryContactName;
          } else {
            smeName = 'Business';
          }

          newCache[smeId] = smeName;
        } else {
          // Not found — cache a sentinel so this id is never re-queried.
          newCache[smeId] = null;
        }
      });

      setSmeCache(newCache);
      return newCache;
    } catch (err) {
      console.warn("Error fetching SME details:", err);
      return smeCache;
    }
  }, [smeCache]);

  // Firestore listener — catalyst's own sent requests.
  useEffect(() => {
    setLoading(true);
    const auth = getAuth();

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const fetchMeetings = async () => {
        try {
          // Catalyst requests only ever land in smeCalendarEvents (see
          // SupportSMETable.jsx's performWrite) — there's no catalyst
          // equivalent of the SME-side's supplierCalendarEvents collection,
          // so unlike the SME variant this only queries one collection.
          const smeSnapshot = await getDocs(
            query(collection(db, "smeCalendarEvents"), where("catalystId", "==", user.uid))
          );

          const smeIds = [];
          const meetingsData = [];

          smeSnapshot.docs.forEach(docSnap => {
            const data = docSnap.data();

            // From the catalyst's own view, the counterpart is always the
            // SME the request was sent to — not the catalyst themselves.
            // (The SME-side file uses data.catalystId as the counterpart
            // because a catalyst request arrives *at* the SME; here the
            // catalyst *is* data.catalystId, so that field is useless as an
            // "other party" pointer.)
            const smeId = data.smeId;

            if (smeId && !data.smeName) {
              smeIds.push(smeId);
            }

            const slots = (data.availableDates || []).map(slot => ({
              ...slot,
              date: slot.date?.toDate ? slot.date.toDate() : new Date(slot.date),
              status: slot.status || 'available'
            }));

            meetingsData.push({
              docId: docSnap.id,
              id: `${docSnap.ref.parent.id}-${docSnap.id}`,

              name: data.title || data.purpose || "Meeting",

              smeId,

              smeName: data.smeName || "",

              location: data.location || "Virtual",
              purpose: data.purpose || "",

              slots,

              status: data.status || data.meetingStatus || "pending",

              collection: docSnap.ref.parent.id,

              catalystApplicationId: data.catalystApplicationId || data.applicationId,
            });
          });

          const cache = await fetchSmeDetails(smeIds);

          const enhancedMeetings = meetingsData.map((meeting) => ({
            ...meeting,
            smeName: meeting.smeName || cache[meeting.smeId] || 'Business',
            // Kept for compatibility with MeetingDetails.jsx, which reads
            // meeting.requesterType / meeting.requesterName — from the
            // catalyst's own perspective the "requester" shown there should
            // read as the business the request concerns, not a role label.
            requesterType: 'SME',
            requesterName: meeting.smeName || cache[meeting.smeId] || 'Business',
            requesterId: meeting.smeId,
          }));

          setMeetings(enhancedMeetings || []);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching meetings:", error);
          setLoading(false);
        }
      };

      fetchMeetings();

      let timeoutId;
      const debouncedUpdate = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(fetchMeetings, 1000);
      };

      const unsub = onSnapshot(
        query(collection(db, "smeCalendarEvents"), where("catalystId", "==", user.uid)),
        debouncedUpdate
      );

      return () => {
        unsub();
        clearTimeout(timeoutId);
      };
    });

    return () => unsubscribeAuth();
    // Deliberately not depending on fetchSmeDetails — same reasoning as the
    // SME-side file: that callback's identity changes on every cache update,
    // and depending on it here would tear down and resubscribe the auth +
    // snapshot listeners on every single fetch, producing an endless
    // "Loading meetings..." state. fetchMeetings always calls the current
    // fetchSmeDetails via closure, so nothing goes stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredMeetings = useMemo(() => {
    if (!meetings || !Array.isArray(meetings)) return [];

    return meetings.filter(meeting => {
      if (!meeting.slots || meeting.slots.length === 0) return false;

      const hasValidDates = meeting.slots.some(slot => slot.date instanceof Date);
      if (!hasValidDates) return false;

      switch (activeTab) {
        case 'upcoming':
          return meeting.status === 'scheduled' &&
                 meeting.slots.some(slot => slot.date > now);
        case 'past':
          return meeting.status === 'completed' ||
                 meeting.slots.every(slot => slot.date < now);
        case 'pending':
          return meeting.status === 'pending' ||
                 meeting.slots.some(slot => slot.status === 'available');
        default:
          return true;
      }
    });
  }, [meetings, activeTab, now]);

  const calendarMeetings = useMemo(() => {
    if (!meetings || !Array.isArray(meetings)) return [];

    return meetings.flatMap(meeting => {
      if (!meeting.slots || !Array.isArray(meeting.slots)) return [];

      return meeting.slots.map(slot => ({
        ...meeting,
        slot,
        dateKey: slot.date.toDateString(),
        hourKey: `${slot.date.getDate()}-${slot.date.getHours()}`
      }));
    });
  }, [meetings]);

  // Manual "Create Event" — adapted so the catalyst is always the requester
  // writing catalystId onto the doc, targeting a chosen SME (newEvent.to),
  // matching the same shape SupportSMETable's performWrite produces. The
  // original SME-side version wrote smeId: user.uid, which would be wrong
  // here (the catalyst is not the SME).
  const handleCreateEvent = useCallback(async (newEvent) => {
    setSubmitting(true);
    setNotification(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setNotification({ type: "error", message: "User not authenticated" });
        setSubmitting(false);
        return;
      }

      const dateString = newEvent.date;
      const timeString = newEvent.time;

      if (!dateString || !timeString) {
        setNotification({ type: "error", message: "Please select a date and time" });
        setSubmitting(false);
        return;
      }
      if (!newEvent.to) {
        setNotification({ type: "error", message: "Please select a business (SME) for this meeting" });
        setSubmitting(false);
        return;
      }

      const [year, month, day] = dateString.split('-');
      const [hours, minutes] = timeString.split(':');

      const eventDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours) || 0,
        parseInt(minutes) || 0
      );

      if (isNaN(eventDate.getTime())) {
        setNotification({ type: "error", message: "Invalid date/time format" });
        setSubmitting(false);
        return;
      }

      let catalystName = user.displayName || "Catalyst";
      try {
        const profileRef = doc(db, "catalystProfiles", user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          catalystName = data.catalystName || data.name || catalystName;
        }
      } catch (error) {
        console.error("Error fetching catalyst name:", error);
      }

      let smeName = newEvent.toName || "Business";
      try {
        const profileRef = doc(db, "MyuniversalProfiles", newEvent.to);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          smeName = data.formData?.entityOverview?.registeredName ||
                    data.formData?.entityOverview?.tradingName ||
                    smeName;
        }
      } catch (error) {
        console.error("Error fetching SME details:", error);
      }

      const eventData = {
        title: newEvent.title || "Meeting",
        purpose: newEvent.title || "Meeting",
        location: newEvent.location || "Virtual",
        description: newEvent.description || "",

        catalystId: user.uid,
        requesterId: user.uid,
        requesterName: catalystName,
        requesterType: "Catalyst",
        createdBy: user.uid,
        createdByName: catalystName,

        smeId: newEvent.to,
        smeName: smeName,

        createdAt: new Date().toISOString(),
        status: "pending",
        meetingStatus: "pending",

        availableDates: [
          {
            date: eventDate.toISOString(),
            timeSlots: [{ start: timeString, end: timeString }],
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            status: "available"
          }
        ]
      };

      const eventRef = await addDoc(collection(db, "smeCalendarEvents"), eventData);

      const savedEvent = {
        docId: eventRef.id,
        id: `smeCalendarEvents-${eventRef.id}`,
        name: eventData.title,
        smeId: newEvent.to,
        smeName: smeName,
        location: eventData.location,
        purpose: eventData.purpose,
        slots: [{
          date: eventDate,
          timeSlots: eventData.availableDates[0].timeSlots,
          timeZone: eventData.availableDates[0].timeZone,
          status: 'available'
        }],
        status: "pending",
        collection: "smeCalendarEvents",
        requesterType: 'SME',
        requesterName: smeName,
        requesterId: newEvent.to,
      };

      setMeetings(prev => [...(prev || []), savedEvent]);
      setStats(prev => ({ ...prev, created: prev.created + 1 }));
      setShowCreateModal(false);

      setNotification({ type: "success", message: "✅ Meeting request sent!" });
      setTimeout(() => setNotification(null), 3000);

    } catch (error) {
      console.error("Error creating event:", error);
      setNotification({ type: "error", message: "❌ Failed to send meeting request. Please try again." });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setSubmitting(false);
    }
  }, [setStats]);

  const handleMeetingAction = useCallback(async (id, action) => {
    try {
      const meetingToUpdate = meetings.find(m => m.id === id);

      if (!meetingToUpdate) {
        console.error("Meeting not found");
        return;
      }

      if (action === 'scheduled') {
        setMeetings(prev => prev.map(meeting =>
          meeting.id === id ? { ...meeting, status: 'scheduled' } : meeting
        ));
        setStats(prev => ({ ...prev, scheduled: prev.scheduled + 1 }));
      } else if (action === 'completed') {
        setMeetings(prev => prev.map(meeting =>
          meeting.id === id ? { ...meeting, status: 'completed' } : meeting
        ));
        setStats(prev => ({ ...prev, completed: prev.completed + 1 }));
      } else if (action === 'cancelled') {
        setMeetings(prev => prev.map(meeting =>
          meeting.id === id ? { ...meeting, status: 'cancelled' } : meeting
        ));
        setStats(prev => ({ ...prev, cancelled: prev.cancelled + 1 }));
      }
    } catch (error) {
      console.error("Error handling meeting action:", error);
    } finally {
      setSelectedMeeting(null);
    }
  }, [meetings, setStats]);

  const renderDayView = useCallback(() => {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const dayMeetings = calendarMeetings
      .filter(({ slot }) => slot.date >= dayStart && slot.date <= dayEnd)
      .sort((a, b) => a.slot.date - b.slot.date);

    const meetingsByHour = {};
    dayMeetings.forEach(meeting => {
      const hour = meeting.slot.date.getHours();
      if (!meetingsByHour[hour]) meetingsByHour[hour] = [];
      meetingsByHour[hour].push(meeting);
    });

    return (
      <DayView>
        <DayHeader>
          <DayTitle>
            {currentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </DayTitle>
        </DayHeader>
        <TimeSlots>
          {Array.from({ length: 24 }).map((_, hour) => (
            <HourRow key={hour}>
              <HourLabel>
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </HourLabel>
              <HourEvents>
                {(meetingsByHour[hour] || []).map((meeting, idx) => (
                  <CalendarEvent key={idx} status={meeting.status}>
                    <EventTime>
                      {meeting.slot.date.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </EventTime>
                    <EventTitle>{meeting.name}</EventTitle>
                    <EventCounterpart>{meeting.smeName}</EventCounterpart>
                  </CalendarEvent>
                ))}
              </HourEvents>
            </HourRow>
          ))}
        </TimeSlots>
      </DayView>
    );
  }, [currentDate, calendarMeetings]);

  const renderWeekView = useCallback(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekMeetingsByDay = Array(7).fill().map(() => []);

    calendarMeetings.forEach(meeting => {
      const dayIndex = Math.floor(
        (meeting.slot.date - startOfWeek) / (24 * 60 * 60 * 1000)
      );

      if (dayIndex >= 0 && dayIndex < 7) {
        weekMeetingsByDay[dayIndex].push(meeting);
      }
    });

    return (
      <WeekView>
        <WeekHeader>
          {Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <WeekdayHeader key={i} className={isToday ? 'today' : ''}>
                <WeekdayName>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </WeekdayName>
                <WeekdayDate>{day.getDate()}</WeekdayDate>
              </WeekdayHeader>
            );
          })}
        </WeekHeader>
        <WeekGrid>
          {weekMeetingsByDay.map((dayMeetings, dayIdx) => {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + dayIdx);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <WeekdayCell key={dayIdx} className={isToday ? 'today' : ''}>
                {dayMeetings
                  .sort((a, b) => a.slot.date - b.slot.date)
                  .map((meeting, idx) => (
                    <CalendarEvent key={idx} status={meeting.status}>
                      <EventTime>
                        {meeting.slot.date.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </EventTime>
                      <EventTitle>{meeting.name}</EventTitle>
                    </CalendarEvent>
                  ))}
              </WeekdayCell>
            );
          })}
        </WeekGrid>
      </WeekView>
    );
  }, [currentDate, calendarMeetings]);

  const renderMonthView = useCallback(() => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const monthMeetingsByDay = {};
    calendarMeetings.forEach(meeting => {
      if (
        meeting.slot.date.getMonth() === currentDate.getMonth() &&
        meeting.slot.date.getFullYear() === currentDate.getFullYear()
      ) {
        const day = meeting.slot.date.getDate();
        if (!monthMeetingsByDay[day]) monthMeetingsByDay[day] = [];
        monthMeetingsByDay[day].push(meeting);
      }
    });

    return (
      <MonthView>
        <MonthHeader>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day}>{day}</div>
          ))}
        </MonthHeader>
        <MonthGrid>
          {Array.from({ length: 42 }).map((_, i) => {
            let day, className = '';

            if (i < startDay) {
              day = i + 1;
              className = 'other-month';
            } else if (i < startDay + daysInMonth) {
              day = i - startDay + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              if (date.toDateString() === new Date().toDateString()) {
                className = 'today';
              }
            } else {
              day = i - startDay - daysInMonth + 1;
              className = 'other-month';
            }

            return (
              <MonthDay key={i} className={className}>
                <DayNumber>{day}</DayNumber>
                <DayEvents>
                  {(monthMeetingsByDay[day] || []).map((meeting, idx) => (
                    <CalendarEvent key={idx} status={meeting.status}>
                      <EventTime>
                        {meeting.slot.date.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </EventTime>
                      <EventTitle>{meeting.name}</EventTitle>
                    </CalendarEvent>
                  ))}
                </DayEvents>
              </MonthDay>
            );
          })}
        </MonthGrid>
      </MonthView>
    );
  }, [currentDate, calendarMeetings]);

  const navigateDate = useCallback((direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      const increment = direction === 'next' ? 1 : -1;

      switch (calendarView) {
        case 'day': newDate.setDate(newDate.getDate() + increment); break;
        case 'week': newDate.setDate(newDate.getDate() + (increment * 7)); break;
        case 'month': newDate.setMonth(newDate.getMonth() + increment); break;
      }

      return newDate;
    });
  }, [calendarView]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const calendarContent = useMemo(() => {
    switch (calendarView) {
      case 'day': return renderDayView();
      case 'week': return renderWeekView();
      case 'month': return renderMonthView();
      default: return renderMonthView();
    }
  }, [calendarView, renderDayView, renderWeekView, renderMonthView]);

  const mainContent = useMemo(() => (
    <>
      <Header>
        <Title>Meetings</Title>
        <HeaderActions>
          <Button onClick={() => setShowCalendar(true)}>
            <CalendarIcon size={16} />
            Calendar
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Request Meeting
          </Button>
        </HeaderActions>
      </Header>

      <Tabs>
        {['upcoming', 'pending', 'past'].map(tab => (
          <TabButton
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </TabButton>
        ))}
      </Tabs>

      <TableContainer>
        <Table>
          <TableHead>
            <tr>
              <TableHeader>Meeting Purpose</TableHeader>
              <TableHeader>Business (SME)</TableHeader>
              <TableHeader>Dates Requested</TableHeader>
              <TableHeader>Location</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Action</TableHeader>
            </tr>
          </TableHead>
          <tbody>
            {filteredMeetings.length === 0 ? (
              <tr>
                <NoMeetings colSpan="6">
                  No {activeTab} meetings found
                </NoMeetings>
              </tr>
            ) : (
              filteredMeetings.map((meeting, index) => {
                const visibleSlots = meeting.slots.slice(0, MAX_VISIBLE_DATE_CHIPS);
                const hiddenCount = meeting.slots.length - visibleSlots.length;

                return (
                  <TableRow key={`${meeting.id}-${index}`}>
                    <TableCell>{meeting.name}</TableCell>
                    <TableCell>{meeting.smeName}</TableCell>
                    <TableCell>
                      <DatesList>
                        {visibleSlots.map((slot, i) => (
                          <DateChip key={i}>
                            {formatSlotChip(slot)}
                            <DateChipStatus status={slot.status}>
                              {slot.status === 'scheduled'
                                ? 'Confirmed'
                                : slot.status === 'unavailable'
                                  ? 'Not chosen'
                                  : 'Proposed'}
                            </DateChipStatus>
                          </DateChip>
                        ))}
                        {hiddenCount > 0 && (
                          <MoreDatesLink>+{hiddenCount} more date{hiddenCount > 1 ? 's' : ''}</MoreDatesLink>
                        )}
                      </DatesList>
                    </TableCell>
                    <TableCell>{meeting.location}</TableCell>
                    <TableCell>
                      <StatusBadge status={meeting.status}>
                        {meeting.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <ViewButton onClick={() => setSelectedMeeting(meeting)}>
                        <Eye size={16} />
                        View
                      </ViewButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </tbody>
        </Table>
      </TableContainer>
    </>
  ), [activeTab, filteredMeetings]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        color: colors.textDark
      }}>
        Loading meetings...
      </div>
    );
  }

  return (
    <MeetingsContainer>
      {mainContent}

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <CreateEventForm
            onSubmit={handleCreateEvent}
            onCancel={() => setShowCreateModal(false)}
            previousRecipients={matchesList}
          />
        </Modal>
      )}

      {selectedMeeting && (
        <Modal onClose={() => setSelectedMeeting(null)}>
          {/*
            NOTE: MeetingDetails.jsx's Accept/Decline flow was written for
            the *recipient* of a request (the SME) to pick a slot. From the
            catalyst's own "Meetings" view they're looking at a request they
            sent — accepting/declining their own request doesn't make sense.
            This wasn't part of what was asked for this pass, so it's left
            wired as-is; flag if you want a read-only or "Cancel Request"
            variant for this view instead.
          */}
          <MeetingDetails
            meeting={selectedMeeting}
            onAction={handleMeetingAction}
            onClose={() => setSelectedMeeting(null)}
          />
        </Modal>
      )}

      {showCalendar && (
        <Modal onClose={() => setShowCalendar(false)}>
          <CalendarModal>
            <CalendarHeader>
              <CalendarNavigation>
                <NavButton onClick={() => navigateDate('prev')}>
                  <ChevronLeft size={20} />
                </NavButton>
                <CalendarTitle>
                  {calendarView === 'month' &&
                    currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  {calendarView === 'week' &&
                    `${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                    ${new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000)
                      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  {calendarView === 'day' &&
                    currentDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                </CalendarTitle>
                <NavButton onClick={() => navigateDate('next')}>
                  <ChevronRight size={20} />
                </NavButton>
              </CalendarNavigation>
              <CalendarActions>
                <TodayButton onClick={goToToday}>Today</TodayButton>
                <ViewSelect
                  value={calendarView}
                  onChange={(e) => setCalendarView(e.target.value)}
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </ViewSelect>
              </CalendarActions>
            </CalendarHeader>
            <CalendarContent>
              {calendarContent}
            </CalendarContent>
          </CalendarModal>
        </Modal>
      )}

      {submitting && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "32px 40px",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              border: "4px solid #f3e5f5",
              borderTop: "4px solid #7d5a50",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }} />
            <p style={{ color: "#4a352f", fontSize: "16px", fontWeight: "500", margin: 0 }}>
              Sending meeting request...
            </p>
          </div>
        </div>
      )}
    </MeetingsContainer>
  );
};

export default Meetings;