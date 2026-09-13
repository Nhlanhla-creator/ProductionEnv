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

// Single source of truth for status → color, shared by the table badge and
// the calendar event chips (previously duplicated in two switch statements,
// which is how 'past' got left out of one of them).
const STATUS_COLORS = {
  scheduled: '#4CAF50',
  pending: '#FF9800',
  cancelled: '#F44336',
  completed: '#2196F3',
  past: '#78909C',
};
const getStatusColor = (status) => STATUS_COLORS[status] || '#9E9E9E';

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  pending: 'Pending',
  cancelled: 'Cancelled',
  completed: 'Completed',
  past: 'Past',
};
const getStatusLabel = (status) => STATUS_LABELS[status] || status;

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
  width: 100%;
  max-width: 100%;

  min-width: 0;
  min-height: 500px;

  padding: clamp(16px, 2vw, 28px);

  border-radius: 18px;

  background: #ffffff;

  border:
    1px solid
    rgba(140, 104, 66, 0.14);

  box-shadow:
    0 12px 40px
      rgba(58, 35, 20, 0.07);

  overflow: hidden;

  animation:
    ${fadeInUp}
    0.45s ease-out;

  @media (max-width: 700px) {
    padding: 14px;
    border-radius: 14px;
  }
`;

const Header = styled.div`
  width: 100%;

  display: flex;

  justify-content: space-between;
  align-items: center;

  flex-wrap: wrap;

  gap: 16px;

  margin-bottom: 22px;

  padding-bottom: 16px;

  border-bottom:
    1px solid
    rgba(141, 110, 99, 0.18);

  @media (max-width: 650px) {
    align-items: stretch;
  }
`;

const Title = styled.h2`
  margin: 0;

  color: ${colors.textDark};

  font-size:
    clamp(1.45rem, 3vw, 1.9rem);

  font-weight: 750;

  letter-spacing: -0.4px;
`;
const HeaderActions = styled.div`
  display: flex;

  align-items: center;

  flex-wrap: wrap;

  gap: 10px;

  @media (max-width: 520px) {
    width: 100%;

    button {
      flex: 1;
      justify-content: center;
    }
  }
`;
const Button = styled.button`
  min-height: 42px;

  display: inline-flex;

  align-items: center;
  justify-content: center;

  gap: 7px;

  padding: 0 16px;

  border: none;

  border-radius: 9px;

  background: ${colors.darkBrown};

  color: white;

  font-size: 0.86rem;

  font-weight: 650;

  cursor: pointer;

  white-space: nowrap;

  transition:
    background 0.2s ease,
    transform 0.2s ease;

  &:hover {
    background:
      ${colors.mediumBrown};

    transform: translateY(-1px);
  }
`;

const Tabs = styled.div`
  width: 100%;

  display: flex;

  gap: 6px;

  margin-bottom: 18px;

  padding: 5px;

  background: #f6f2f0;

  border-radius: 10px;

  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 4px;
  }
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
  width: 100%;
  max-width: 100%;

  min-width: 0;

  overflow-x: auto;
  overflow-y: hidden;

  border:
    1px solid
    rgba(140, 104, 66, 0.13);

  border-radius: 12px;

  background: #ffffff;

  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 7px;
  }

  &::-webkit-scrollbar-thumb {
    background:
      rgba(141, 110, 99, 0.35);

    border-radius: 20px;
  }
`;

const Table = styled.table`
  width: 100%;

  min-width: 880px;

  border-collapse: collapse;

  background: white;
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

const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white;
  background-color: ${props => getStatusColor(props.status)};
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
  width: 100%;
  max-width: 100%;

  height:
    min(850px, calc(100dvh - 48px));

  max-height:
    calc(100dvh - 48px);

  min-height: 500px;

  display: flex;

  flex-direction: column;

  min-width: 0;

  padding:
    clamp(14px, 2vw, 24px);

  background: #ffffff;

  border-radius: 18px;

  border:
    1px solid
    rgba(140, 104, 66, 0.16);

  box-shadow:
    0 20px 60px
      rgba(58, 35, 20, 0.15);

  overflow: hidden;

  @media (max-width: 700px) {
    height:
      calc(100dvh - 20px);

    max-height:
      calc(100dvh - 20px);

    min-height: 0;

    border-radius: 14px;

    padding: 12px;
  }
`;

const CalendarHeader = styled.div`
  width: 100%;

  flex: 0 0 auto;

  display: flex;

  align-items: center;
  justify-content: space-between;

  flex-wrap: wrap;

  gap: 12px;

  padding:
    0 44px 14px 0;

  margin-bottom: 14px;

  border-bottom:
    1px solid
    rgba(141, 110, 99, 0.18);

  @media (max-width: 700px) {
    align-items: stretch;

    padding-right: 38px;
  }
`;

const CalendarTitle = styled.h2`
  margin: 0;

  min-width: 0;

  color: ${colors.textDark};

  font-size:
    clamp(1rem, 2.5vw, 1.45rem);

  font-weight: 750;

  text-align: center;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;
`;

const CalendarNavigation = styled.div`
  min-width: 0;

  display: flex;

  align-items: center;

  gap: 8px;

  @media (max-width: 700px) {
    width: 100%;

    justify-content: space-between;
  }
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

  align-items: center;

  gap: 8px;

  @media (max-width: 700px) {
    width: 100%;

    > * {
      flex: 1;
    }
  }
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

  width: 100%;

  min-width: 0;
  min-height: 0;

  overflow: auto;

  overscroll-behavior: contain;

  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    width: 7px;
    height: 7px;
  }

  &::-webkit-scrollbar-thumb {
    background:
      rgba(141, 110, 99, 0.3);

    border-radius: 10px;
  }
`;

// Month View Components
const MonthView = styled.div`
  width: 100%;

  min-width: 760px;

  min-height: 100%;

  padding: 10px;

  background: #faf9f8;

  border-radius: 12px;

  border:
    1px solid
    rgba(140, 104, 66, 0.12);
`;

const MonthHeader = styled.div`
  display: grid;

  grid-template-columns:
    repeat(7, minmax(95px, 1fr));

  text-align: center;

  font-weight: 700;

  color: ${colors.textDark};

  padding: 7px 0;

  font-size: 0.78rem;

  text-transform: uppercase;

  letter-spacing: 0.04em;
`;

const MonthGrid = styled.div`
  display: grid;

  grid-template-columns:
    repeat(7, minmax(95px, 1fr));

  grid-auto-rows:
    minmax(105px, 1fr);

  gap: 5px;

  min-height: 560px;
`;

const MonthDay = styled.div`
  min-width: 0;
  min-height: 105px;

  display: flex;

  flex-direction: column;

  padding: 7px;

  border-radius: 8px;

  border:
    1px solid
    rgba(140, 104, 66, 0.1);

  background: #ffffff;

  overflow: hidden;

  transition:
    border 0.2s ease,
    background 0.2s ease;

  &:hover {
    background: #faf7f5;

    border-color:
      rgba(141, 110, 99, 0.3);
  }

  &.other-month {
    opacity: 0.48;
  }

  &.today {
    border:
      2px solid
      ${colors.mediumBrown};

    background: #faf6f4;
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

// Highlighted "booked" (confirmed/scheduled) events get a bold green ring +
// glow so they visually pop out from pending/past events on the calendar.
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
  background-color: ${props => getStatusColor(props.status)};
  ${props => props.booked && `
    border: 2px solid #2E7D32;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.35), 0 2px 8px rgba(46, 125, 50, 0.45);
    font-weight: 700;
  `}

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

// Main Component
const Meetings = ({ stats, setStats, matchesList  }) => {
  const [activeTab, setActiveTab] =
  useState('incoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarView, setCalendarView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requesterCache, setRequesterCache] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
const [currentUserId, setCurrentUserId] = useState(null);


  // Recompute "now" whenever the meetings list refreshes (real-time
  // listeners keep it firing), instead of freezing it at mount. Otherwise a
  // meeting that crosses into the past during a long-open session never
  // gets reclassified.
const [now, setNow] =
  useState(() => new Date());

useEffect(() => {
  const interval = setInterval(() => {
    setNow(new Date());
  }, 60000);

  return () =>
    clearInterval(interval);
}, []);

  // Cache requester details to avoid duplicate fetches.
  //
  // IMPORTANT: `!(id in requesterCache)` — not `!requesterCache[id]` — because
  // a cache miss is stored as `null` (see below). Falsy-checking the value
  // would treat a confirmed miss as "not yet looked up" and re-query it on
  // every single call, which is exactly what was causing the infinite
  // "Loading meetings..." loop: a never-resolving cache entry produced a new
  // requesterCache object every fetch, which gave fetchRequesterDetails a new
  // identity, which retriggered the effect below, forever.
 const fetchRequesterDetails = useCallback(async (requesterIds) => {
  const uniqueIds = [...new Set(requesterIds.filter(id => id && !(id in requesterCache)))];

  if (uniqueIds.length === 0) return requesterCache;

  try {
    const newCache = { ...requesterCache };

    await Promise.all(uniqueIds.map(async (id) => {
      let resolvedName = null;

      // 1. Try MyuniversalProfiles first (registered business/entity name)
      try {
        const profileSnap = await getDoc(doc(db, "MyuniversalProfiles", id));
        if (profileSnap.exists()) {
          const formData = profileSnap.data()?.formData;
          resolvedName =
            formData?.entityOverview?.registeredName ||
            formData?.contactDetails?.primaryContactName ||
            formData?.fundManageOverview?.registeredName ||
            null;
        }
      } catch (e) {
        console.warn(`Error checking MyuniversalProfiles for ${id}:`, e);
      }

      // 2. Fall back to the users collection: name fields, then email
      if (!resolvedName) {
        try {
          const userSnap = await getDoc(doc(db, "users", id));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            resolvedName =
              userData.name ||
              userData.fullName ||
              userData.username ||
              userData.displayName ||
              userData.email ||
              null;
          }
        } catch (e) {
          console.warn(`Error checking users collection for ${id}:`, e);
        }
      }

      // null is a legitimate cached "miss" — keeps this id from being
      // re-queried on every render (see comment above on the infinite loop).
      newCache[id] = resolvedName;
    }));

    setRequesterCache(newCache);
    return newCache;
  } catch (err) {
    console.warn("Error fetching requester details:", err);
    return requesterCache;
  }
}, [requesterCache]);



  // Optimize Firestore listener
  useEffect(() => {
    setLoading(true);
    const auth = getAuth();
    
   const unsubscribeAuth =
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      setCurrentUserId(null);
      setMeetings([]);
      setLoading(false);
      return;
    }

    setCurrentUserId(user.uid);

    // rest of your existing code...

      // Fetch both collections in parallel
      const fetchMeetings = async () => {
        try {
          const [smeSnapshot, supplierSnapshot] = await Promise.all([
            getDocs(query(collection(db, "smeCalendarEvents"), where("smeId", "==", user.uid))),
            getDocs(query(collection(db, "supplierCalendarEvents"), where("supplierId", "==", user.uid)))
          ]);

          const allDocs = [...smeSnapshot.docs, ...supplierSnapshot.docs];
          
          // Collect unique requester IDs first
          const requesterIds = [];
          const meetingsData = [];
          
          allDocs.forEach(docSnap => {
            const data = docSnap.data();
           const counterpartId =
  data.catalystId ||
  data.requesterId ||
  data.customerId ||
  data.funderId ||
  (
    data.createdBy &&
    data.createdBy !== user.uid
      ? data.createdBy
      : data.to
  );
            // Only queue a lookup when the event doesn't already carry a
            // usable name (catalyst-originated requests write
            // requesterName/createdByName straight onto the doc, and their
            // profile lives in catalystProfiles, not MyuniversalProfiles —
            // querying for them here would always miss).
            if (counterpartId && !data.requesterName && !data.createdByName) {
              requesterIds.push(counterpartId);
            }

            // Parse dates once and store
            const slots = (data.availableDates || []).map(slot => ({
              ...slot,
              date: slot.date?.toDate ? slot.date.toDate() : new Date(slot.date),
              status: slot.status || 'available'
            }));

            
       const createdBy =
  data.createdBy ||
  data.requesterId ||
  null;

const recipientId =
  data.to ||
  null;

const isInvitation =
  data.isInvitation === true;


// -----------------------------------------
// DETERMINE WHICH SIDE OF REQUEST THIS IS
// -----------------------------------------
let requestDirection = "other";

// Somebody else created this copy
// and it belongs to current user's calendar
if (
  createdBy &&
  createdBy !== user.uid
) {
  requestDirection = "incoming";
}

// Current user created it for somebody else
else if (
  createdBy === user.uid &&
  recipientId &&
  recipientId !== user.uid &&
  !isInvitation
) {
  requestDirection = "outgoing";
}

// Current user's own personal calendar item
else if (
  createdBy === user.uid &&
  !recipientId
) {
  requestDirection = "personal";
}


meetingsData.push({
  // ---------------------------------------
  // FIRESTORE IDENTITY
  // ---------------------------------------
  docId: docSnap.id,

  id:
    `${docSnap.ref.parent.id}-${docSnap.id}`,

  collection:
    docSnap.ref.parent.id,


  // ---------------------------------------
  // EVENT DETAILS
  // ---------------------------------------
  name:
    data.title ||
    "Meeting",

  description:
    data.description ||
    "",

  location:
    data.location ||
    "Virtual",

  duration:
    data.duration ||
    "30",

  purpose:
    data.purpose ||
    data.description ||
    "",


  // ---------------------------------------
  // REQUEST OWNERSHIP
  // VERY IMPORTANT
  // ---------------------------------------
  createdBy,

  createdByName:
    data.createdByName ||
    data.requesterName ||
    "",

  to:
    recipientId,

  toName:
    data.toName ||
    "",

  isInvitation,

  requestDirection,


  // ---------------------------------------
  // LINK BOTH CALENDAR COPIES
  // ---------------------------------------
  originEventId:
    data.originEventId ||
    null,

  originCollection:
    data.originCollection ||
    docSnap.ref.parent.id,

  inviteeEventId:
    data.inviteeEventId ||
    null,


  // ---------------------------------------
  // COUNTERPART
  // ---------------------------------------
  counterpartId,

  counterpartName:
    createdBy === user.uid
      ? data.toName || ""
      : data.createdByName ||
        data.requesterName ||
        "",

  requesterId:
    data.requesterId ||
    (
      createdBy !== user.uid
        ? createdBy
        : counterpartId
    ),

  requesterName:
    data.requesterName ||
    data.createdByName ||
    "",


  // ---------------------------------------
  // EXISTING APPLICATION DATA
  // ---------------------------------------
  smeName:
    data.smeName ||
    "",

  smeAppId:
    data.smeAppId,

  investorAppId:
    data.investorAppId,

  catalystApplicationId:
    data.catalystApplicationId ||
    data.applicationId,


  // ---------------------------------------
  // DATES
  // ---------------------------------------
  slots,

  scheduledDate:
    data.scheduledDate ||
    null,

  scheduledTimeSlot:
    data.scheduledTimeSlot ||
    null,


  // ---------------------------------------
  // STATUS
  // ---------------------------------------
  status:
    data.status ||
    data.meetingStatus ||
    "pending",

  meetingStatus:
    data.meetingStatus ||
    data.status ||
    "pending",


  requesterType:
    data.catalystId
      ? "Catalyst"
      : data.funderId
      ? "Investor"
      : data.customerId
      ? "Customer"
      : data.supplierId
      ? "Supplier"
      : data.requesterType ||
        "SME",
});
          });

          // Fetch all requester details in batch
          const cache = await fetchRequesterDetails(requesterIds);
          
          // Enhance meetings with requester names
 const enhancedMeetings =
  meetingsData.map((meeting) => ({
    ...meeting,

    requesterName:
      meeting.requesterName ||
      cache[meeting.counterpartId] ||
      meeting.requesterType,

    counterpartName:
      meeting.counterpartName ||
      cache[meeting.counterpartId] ||
      meeting.requesterName ||
      meeting.requesterType,

    requesterId:
      meeting.requesterId ||
      meeting.counterpartId,
  }));


          setMeetings(enhancedMeetings || []);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching meetings:", error);
          setLoading(false);
        }
      };

      // Initial fetch
      fetchMeetings();

      // Set up real-time listeners with debouncing
      let timeoutId;
      const debouncedUpdate = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(fetchMeetings, 1000); // Debounce updates
      };

      const unsub1 = onSnapshot(
        query(collection(db, "smeCalendarEvents"), where("smeId", "==", user.uid)),
        debouncedUpdate
      );

      const unsub2 = onSnapshot(
        query(collection(db, "supplierCalendarEvents"), where("supplierId", "==", user.uid)),
        debouncedUpdate
      );

      return () => {
        unsub1();
        unsub2();
        clearTimeout(timeoutId);
      };
    });

    return () => unsubscribeAuth();
    // Deliberately NOT depending on fetchRequesterDetails. That callback's
    // identity changes whenever requesterCache updates (new object each
    // time), which previously retriggered this whole effect — tearing down
    // and resubscribing the auth listener and both onSnapshot listeners on
    // every single meetings fetch, which is what produced the endless
    // "Loading meetings..." state. fetchMeetings always calls the *current*
    // fetchRequesterDetails via closure, so nothing here goes stale — it's
    // just no longer a re-run trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived "effective status" ──────────────────────────────────────────
  // The stored `status` field only tells you what was last written
  // (pending/scheduled/completed/cancelled) — it says nothing about whether
  // every slot on that meeting has already passed. A meeting stuck at
  // 'pending' or 'scheduled' with dates entirely in the past should read
  // (and filter) as "past", not linger in Pending/Upcoming forever. This is
  // computed once per meetings/now change and consumed by both the table
  // tabs and the calendar.
const processedMeetings = useMemo(() => {
  if (
    !Array.isArray(meetings) ||
    !currentUserId
  ) {
    return [];
  }

  return meetings.map((meeting) => {
    const validSlots = (meeting.slots || [])
      .filter((slot) => {
        return (
          slot?.date instanceof Date &&
          !Number.isNaN(slot.date.getTime())
        );
      });

    // -----------------------------------------
    // Find the latest possible meeting date
    // -----------------------------------------
    const latestSlotTime =
      validSlots.length > 0
        ? Math.max(
            ...validSlots.map((slot) =>
              slot.date.getTime()
            )
          )
        : 0;

    // If ALL proposed dates are before now,
    // the meeting belongs in Past.
    const isPastDue =
      latestSlotTime > 0 &&
      latestSlotTime < now.getTime();

    const storedStatus = String(
      meeting.status || "pending"
    ).toLowerCase();

    // -----------------------------------------
    // PAST OVERRIDES FIRESTORE STATUS
    // -----------------------------------------
    let effectiveStatus = storedStatus;

    if (isPastDue) {
      effectiveStatus = "past";
    } else if (
      storedStatus === "completed"
    ) {
      effectiveStatus = "completed";
    } else if (
      storedStatus === "cancelled"
    ) {
      effectiveStatus = "cancelled";
    }

    // -----------------------------------------
    // OUTGOING REQUEST
    // -----------------------------------------
   const isOutgoingRequest =
  !isPastDue &&
  effectiveStatus === "pending" &&
  meeting.requestDirection ===
    "outgoing";


const isIncomingRequest =
  !isPastDue &&
  effectiveStatus === "pending" &&
  meeting.requestDirection ===
    "incoming";


const isPersonalEvent =
  meeting.requestDirection ===
    "personal";


const canRespond =
  !isPastDue &&
  effectiveStatus === "pending" &&
  meeting.requestDirection ===
    "incoming";
    return {
      ...meeting,

      validSlots,
      latestSlotTime,

      isPastDue,
      effectiveStatus,

      isOutgoingRequest,
      isIncomingRequest,
      isPersonalEvent,

      canRespond,
    };
  });
}, [
  meetings,
  now,
  currentUserId,
]);

  // Filtered meetings for the table tabs — now mutually exclusive per
  // effectiveStatus, so a past-due meeting can't simultaneously show up
  // under Pending (or Upcoming) and Past.
const filteredMeetings = useMemo(() => {
  return processedMeetings
    .filter((meeting) => {
      if (
        !meeting.slots ||
        meeting.slots.length === 0
      ) {
        return false;
      }

      switch (activeTab) {
        // -----------------------------------
        // RECEIVED AND STILL NEEDS RESPONSE
        // -----------------------------------
        case "incoming":
          return (
            meeting.isPastDue === false &&
            meeting.effectiveStatus === "pending" &&
            meeting.isIncomingRequest === true
          );

        // -----------------------------------
        // I SENT IT, WAITING FOR OTHER PARTY
        // -----------------------------------
        case "requested":
          return (
            meeting.isPastDue === false &&
            meeting.effectiveStatus === "pending" &&
            meeting.isOutgoingRequest === true
          );

        // -----------------------------------
        // CONFIRMED AND STILL IN FUTURE
        // -----------------------------------
        case "upcoming":
          return (
            meeting.isPastDue === false &&
            meeting.effectiveStatus === "scheduled"
          );

        // -----------------------------------
        // EVERYTHING WHOSE DATE HAS PASSED
        // -----------------------------------
        case "past":
          return (
            meeting.isPastDue === true ||
            meeting.effectiveStatus === "past" ||
            meeting.effectiveStatus === "completed" ||
            meeting.effectiveStatus === "cancelled"
          );

        default:
          return false;
      }
    })
    .sort((a, b) => {
      /*
       * Past:
       * newest past meeting first.
       *
       * Everything else:
       * nearest upcoming meeting first.
       */
      if (activeTab === "past") {
        return (
          b.latestSlotTime -
          a.latestSlotTime
        );
      }

      return (
        a.latestSlotTime -
        b.latestSlotTime
      );
    });
}, [
  processedMeetings,
  activeTab,
]);
  // Calendar meetings — built from processedMeetings so every slot on the
  // calendar carries the same effectiveStatus/isPastDue used by the table.
  const calendarMeetings = useMemo(() => {
    return processedMeetings.flatMap(meeting => {
      if (!meeting.slots || !Array.isArray(meeting.slots)) return [];

      return meeting.slots.map(slot => ({
        ...meeting,
        slot,
        dateKey: slot.date.toDateString(),
        hourKey: `${slot.date.getDate()}-${slot.date.getHours()}`
      }));
    });
  }, [processedMeetings]);

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

    // Validate date and time
    const dateString = newEvent.date;
    const timeString = newEvent.time;

    if (!dateString || !timeString) {
      setNotification({ type: "error", message: "Please select a date and time" });
      setSubmitting(false);
      return;
    }

    // Build date
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

    // Get sender name
   // Get sender name
let senderName = "Someone";
try {
  const profileRef = doc(db, "MyuniversalProfiles", user.uid);
  const profileSnap = await getDoc(profileRef);
  const profileData = profileSnap.exists() ? profileSnap.data() : null;

  senderName =
    profileData?.formData?.entityOverview?.registeredName ||
    profileData?.formData?.contactDetails?.primaryContactName ||
    profileData?.formData?.fundManageOverview?.registeredName ||
    null;

  // Fall back to the users collection (name/username/email) before Auth
  if (!senderName) {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (userSnap.exists()) {
      const userData = userSnap.data();
      senderName =
        userData.name ||
        userData.fullName ||
        userData.username ||
        userData.displayName ||
        userData.email ||
        null;
    }
  }

  senderName = senderName || user.displayName || user.email || "Someone";
} catch (error) {
  console.error("Error fetching sender name:", error);
  senderName = user.displayName || user.email || "Someone";
}

    // Get recipient details
    // Get recipient details — MyuniversalProfiles first, then users
    // collection (name fields, then email)
    let recipientName = newEvent.toName || "Recipient";
    let recipientEmail = newEvent.toEmail || "";

    if (newEvent.to && (!recipientEmail || recipientName === "Recipient")) {
      try {
        const profileSnap = await getDoc(doc(db, "MyuniversalProfiles", newEvent.to));
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          recipientEmail = recipientEmail ||
            data.formData?.contactDetails?.email ||
            data.formData?.entityOverview?.email ||
            data.email ||
            "";
          if (recipientName === "Recipient") {
            recipientName =
              data.formData?.entityOverview?.registeredName ||
              data.formData?.contactDetails?.primaryContactName ||
              data.formData?.fundManageOverview?.registeredName ||
              recipientName;
          }
        }
      } catch (error) {
        console.error("Error fetching recipient profile:", error);
      }
    }

    if (newEvent.to && (!recipientEmail || recipientName === "Recipient")) {
      try {
        const userDoc = await getDoc(doc(db, "users", newEvent.to));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          recipientEmail = recipientEmail || userData.email || "";
          if (recipientName === "Recipient") {
            recipientName =
              userData.name ||
              userData.fullName ||
              userData.username ||
              userData.displayName ||
              userData.email ||
              recipientName;
          }
        }
      } catch (error) {
        console.error("Error fetching user email:", error);
      }
    }

    // if (newEvent.to && !recipientEmail) {
    //   try {
    //     const userDoc = await getDoc(doc(db, "users", newEvent.to));
    //     if (userDoc.exists()) {
    //       recipientEmail = userDoc.data().email;
    //     }
    //   } catch (error) {
    //     console.error("Error fetching user email:", error);
    //   }
    // }
const incomingAvailableDates =
  Array.isArray(
    newEvent.availableDates
  )
    ? newEvent.availableDates
    : [];


if (
  incomingAvailableDates.length ===
  0
) {
  throw new Error(
    "At least one meeting date is required."
  );
}


const hasInvitee =
  Boolean(newEvent.to);


const availableDates =
  hasInvitee
    ? incomingAvailableDates.map(
        (slot) => ({
          ...slot,
          status:
            "available",
        })
      )

    // Personal event:
    // immediately scheduled
    : [
        {
          ...incomingAvailableDates[
            0
          ],
          status:
            "scheduled",
        },
      ];


const firstSlot =
  availableDates[0];


const firstTimeSlot =
  firstSlot.timeSlots?.[0];
    // ✅ BUILD EVENT DATA WITH ALL FIELDS
  const eventData = {
  title:
    newEvent.title ||
    "Meeting",

  // Keep these for backwards compatibility
  date:
    firstSlot.date,

  time:
    firstTimeSlot?.start ||
    "",

  duration:
    newEvent.duration ||
    "30",

  location:
    newEvent.location ||
    "Virtual",

  description:
    newEvent.description ||
    "",

  host:
    senderName,

  to:
    newEvent.to ||
    "",

  toName:
    recipientName,

  toEmail:
    recipientEmail,

  createdBy:
    user.uid,

  createdByName:
    senderName,

  createdAt:
    new Date()
      .toISOString(),

  updatedAt:
    new Date()
      .toISOString(),

  // Invitation waits.
  // Personal event doesn't.
  status:
    hasInvitee
      ? "pending"
      : "scheduled",

  meetingStatus:
    hasInvitee
      ? "pending"
      : "scheduled",

  smeId:
    user.uid,

  smeName:
    senderName,

  availableDates,
};
    // ✅ SAVE TO FIRESTORE
   const eventRef =
  await addDoc(
    collection(
      db,
      "smeCalendarEvents"
    ),
    eventData
  );


// The sender's event is the
// origin / source event.
await updateDoc(
  eventRef,
  {
    originEventId:
      eventRef.id,

    originCollection:
      "smeCalendarEvents",
  }
);


let inviteeEventRef =
  null;


if (newEvent.to) {
  inviteeEventRef =
    await addDoc(
      collection(
        db,
        "smeCalendarEvents"
      ),
      {
        ...eventData,

        smeId:
          newEvent.to,

        smeName:
          recipientName,

        createdBy:
          user.uid,

        createdByName:
          senderName,

        isInvitation:
          true,

        originEventId:
          eventRef.id,

        originCollection:
          "smeCalendarEvents",
      }
    );


  await updateDoc(
    eventRef,
    {
      inviteeEventId:
        inviteeEventRef.id,
    }
  );
}

    // ✅ Also save to recipient's calendar if they exist
    // if (newEvent.to) {
    //   await addDoc(collection(db, "smeCalendarEvents"), {
    //     ...eventData,
    //     smeId: newEvent.to,
    //     smeName: recipientName,
    //     createdBy: user.uid,
    //     createdByName: senderName,
    //     isInvitation: true,
    //   });
    // }

    // Update local state
    // const savedEvent = {
    //   ...newEvent,
    //   id: eventRef.id,
    //   createdAt: eventData.createdAt,
    //   requesterType: 'SME',
    //   requesterName: senderName,
    //   status: "pending",
    // };

    // setMeetings(prev => [...(prev || []), savedEvent]);
    setStats(prev => ({ ...prev, created: prev.created + 1 }));
    setShowCreateModal(false);

    // ✅ SEND EMAIL TO RECIPIENT
    if (recipientEmail) {
      try {
        const functions = getFunctions();
        const sendMeetingInviteEmail = httpsCallable(functions, 'sendMeetingInviteEmail');

        await sendMeetingInviteEmail({
          to: recipientEmail,
          name: recipientName,
          senderName: senderName,
          meetingTitle: newEvent.title || "Meeting",
          meetingDate: dateString,
          meetingTime: timeString,
          location: newEvent.location || "Virtual",
          description: newEvent.description || "",
          linkTo: "https://www.bigmarketplace.africa/calendar"
        });
        console.log("✅ Meeting invite email sent to:", recipientEmail);
      } catch (emailError) {
        console.error("❌ Failed to send meeting invite email:", emailError);
      }
    }

    setNotification({ type: "success", message: "✅ Event created successfully!" });
    setTimeout(() => setNotification(null), 3000);

  } catch (error) {
    console.error("Error creating event:", error);
    setNotification({ type: "error", message: "❌ Failed to create event. Please try again." });
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
        // Only require investorAppId for investor meetings
        if (meetingToUpdate.requesterType === 'Investor' && !meetingToUpdate.investorAppId) {
          alert('Please ensure investor details are complete before scheduling');
          return;
        }

        setMeetings(prev => prev
          .map(meeting => {
            if (meeting.id === id) {
              return { ...meeting, status: 'scheduled' };
            }
            if (
              meeting.smeAppId === meetingToUpdate.smeAppId &&
              meeting.investorAppId === meetingToUpdate.investorAppId &&
              meeting.id !== meetingToUpdate.id
            ) {
              return null;
            }
            return meeting;
          })
          .filter(Boolean)
        );
        
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

  // Optimize calendar view rendering with memoization
  const renderDayView = useCallback(() => {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayMeetings = calendarMeetings
      .filter(({ slot }) => slot.date >= dayStart && slot.date <= dayEnd)
      .sort((a, b) => a.slot.date - b.slot.date);

    // Group by hour for better performance
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
                  <CalendarEvent
                    key={idx}
                    status={meeting.effectiveStatus}
                    booked={meeting.status === 'scheduled'}
                  >
                    <EventTime>
                      {meeting.slot.date.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </EventTime>
                    <EventTitle>{meeting.name}</EventTitle>
                    <EventCounterpart>{meeting.requesterName}</EventCounterpart>
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
                    <CalendarEvent
                      key={idx}
                      status={meeting.effectiveStatus}
                      booked={meeting.status === 'scheduled'}
                    >
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
    
    // Pre-calculate meetings for the month
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
              // Previous month
              day = i + 1;
              className = 'other-month';
            } else if (i < startDay + daysInMonth) {
              // Current month
              day = i - startDay + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              if (date.toDateString() === new Date().toDateString()) {
                className = 'today';
              }
            } else {
              // Next month
              day = i - startDay - daysInMonth + 1;
              className = 'other-month';
            }
            
            return (
              <MonthDay key={i} className={className}>
                <DayNumber>{day}</DayNumber>
                <DayEvents>
                  {(monthMeetingsByDay[day] || []).map((meeting, idx) => (
                    <CalendarEvent
                      key={idx}
                      status={meeting.effectiveStatus}
                      booked={meeting.status === 'scheduled'}
                    >
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

  // Optimize calendar navigation
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

  // Memoize the calendar content based on view
  const calendarContent = useMemo(() => {
    switch (calendarView) {
      case 'day': return renderDayView();
      case 'week': return renderWeekView();
      case 'month': return renderMonthView();
      default: return renderMonthView();
    }
  }, [calendarView, renderDayView, renderWeekView, renderMonthView]);

  // Memoize the main content to prevent unnecessary re-renders
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
            Create Event
          </Button>
        </HeaderActions>
      </Header>

     <Tabs>
  {[
    {
      key: "incoming",
      label: "Incoming Requests",
    },
    {
      key: "requested",
      label: "Requested",
    },
    {
      key: "upcoming",
      label: "Upcoming",
    },
    {
      key: "past",
      label: "Past",
    },
  ].map((tab) => (
    <TabButton
      key={tab.key}
      className={
        activeTab === tab.key
          ? "active"
          : ""
      }
      onClick={() =>
        setActiveTab(tab.key)
      }
    >
      {tab.label}
    </TabButton>
  ))}
</Tabs>

      <TableContainer>
        <Table>
          <TableHead>
  <tr>
    <TableHeader>
      Meeting
    </TableHeader>

    <TableHeader>
      With
    </TableHeader>

    <TableHeader>
      Proposed Dates
    </TableHeader>

    <TableHeader>
      Location
    </TableHeader>

    <TableHeader>
      Status
    </TableHeader>

    <TableHeader>
      Action
    </TableHeader>
  </tr>
</TableHead>
          <tbody>
  {filteredMeetings.length === 0 ? (
    <tr>
      <NoMeetings colSpan="6">
        {activeTab === "incoming" &&
          "No meeting requests require your response"}

        {activeTab === "requested" &&
          "No meeting requests are awaiting a response"}

        {activeTab === "upcoming" &&
          "No upcoming meetings"}

        {activeTab === "past" &&
          "No past meetings"}
      </NoMeetings>
    </tr>
  ) : (
    filteredMeetings.map(
      (meeting, index) => (
        <TableRow
          key={`${meeting.id}-${index}`}
        >
          <TableCell>
            {meeting.name}
          </TableCell>

          <TableCell>
            {meeting.counterpartName ||
              meeting.requesterName ||
              "User"}
          </TableCell>

          <TableCell>
            <span
              style={{
                color:
                  colors.mediumBrown,
                fontWeight: 600,
              }}
            >
              {meeting.slots.length}{" "}
              {meeting.slots.length === 1
                ? "option"
                : "options"}
            </span>
          </TableCell>

          <TableCell>
            {meeting.location}
          </TableCell>

          <TableCell>
            <StatusBadge
              status={
                meeting.effectiveStatus
              }
            >
              {meeting.isOutgoingRequest
                ? "Awaiting response"
                : meeting.isIncomingRequest
                ? "Needs response"
                : getStatusLabel(
                    meeting.effectiveStatus
                  )}
            </StatusBadge>
          </TableCell>

          <TableCell>
            <ViewButton
              onClick={() =>
                setSelectedMeeting(
                  meeting
                )
              }
            >
              <Eye size={16} />

              {meeting.canRespond
                ? "Review"
                : "View"}
            </ViewButton>
          </TableCell>
        </TableRow>
      )
    )
  )}
</tbody>
        </Table>
      </TableContainer>
    </>
  ), [activeTab, filteredMeetings]);

  // Render loading state
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

  // Main render
  return (
    
    <MeetingsContainer>
      {mainContent}

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <CreateEventForm
            onSubmit={handleCreateEvent}
            onCancel={() => setShowCreateModal(false)}
            previousRecipients={matchesList}  // <-- ADD THIS LINE
          />
        </Modal>
      )}

      {selectedMeeting && (
        <Modal onClose={() => setSelectedMeeting(null)}>
          <MeetingDetails
            meeting={selectedMeeting}
            onAction={handleMeetingAction}
            onClose={() => setSelectedMeeting(null)}
          />
        </Modal>
      )}

     {showCalendar && (
  <Modal
    onClose={() =>
      setShowCalendar(false)
    }
  >
    <CalendarModal>
      <CalendarHeader>
        <CalendarNavigation>
          <NavButton
            onClick={() =>
              navigateDate("prev")
            }
          >
            <ChevronLeft size={20} />
          </NavButton>

          <CalendarTitle>
            {calendarView === "month" &&
              currentDate.toLocaleDateString(
                "en-US",
                {
                  month: "long",
                  year: "numeric",
                }
              )}

            {calendarView === "week" &&
              `${currentDate.toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                }
              )} - ${new Date(
                currentDate.getTime() +
                  6 *
                    24 *
                    60 *
                    60 *
                    1000
              ).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              )}`}

            {calendarView === "day" &&
              currentDate.toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }
              )}
          </CalendarTitle>

          <NavButton
            onClick={() =>
              navigateDate("next")
            }
          >
            <ChevronRight size={20} />
          </NavButton>
        </CalendarNavigation>

        <CalendarActions>
          <TodayButton
            onClick={goToToday}
          >
            Today
          </TodayButton>

          <ViewSelect
            value={calendarView}
            onChange={(event) =>
              setCalendarView(
                event.target.value
              )
            }
          >
            <option value="day">
              Day
            </option>

            <option value="week">
              Week
            </option>

            <option value="month">
              Month
            </option>
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
        Creating event...
      </p>
    </div>
  </div>
)}

    </MeetingsContainer>
  );
};

export default Meetings;