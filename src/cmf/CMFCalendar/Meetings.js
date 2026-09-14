import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  Briefcase,
  Users,
  CheckCircle2,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import styled, { keyframes } from "styled-components";
import Modal from "./Modal";
import CreateEventForm from "./CreateEventForm";
import MeetingDetails from "./MeetingDetails";
import Availability from "./Availability";
import { db } from "../../firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import "./Meetings.css";

// Warm mocha / brown color palette
const colors = {
  darkBrown: "#5D4037",
  mediumBrown: "#8D6E63",
  lightBrown: "#D7CCC8",
  cream: "#EFEBE9",
  accentBrown: "#A1887F",
  textDark: "#3E2723",
  textLight: "#EFEBE9",
};

const STATUS_COLORS = {
  scheduled: "#2E7D32",
  pending: "#E65100",
  cancelled: "#C62828",
  completed: "#0277BD",
  past: "#78909C",
};

const getStatusColor = (status) => STATUS_COLORS[status] || "#8D6E63";

const STATUS_LABELS = {
  scheduled: "Scheduled",
  pending: "Pending",
  cancelled: "Cancelled",
  completed: "Completed",
  past: "Past",
};

const getStatusLabel = (status) => STATUS_LABELS[status] || status;

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInRow = keyframes`
  from {
    opacity: 0;
    transform: translateX(-15px);
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
  min-height: 520px;
  padding: clamp(16px, 2.2vw, 30px);
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(140, 104, 66, 0.16);
  box-shadow: 0 12px 40px rgba(58, 35, 20, 0.08);
  overflow: hidden;
  animation: ${fadeInUp} 0.45s ease-out;

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
  border-bottom: 1px solid rgba(141, 110, 99, 0.18);

  @media (max-width: 700px) {
    align-items: stretch;
  }
`;

const HeaderTitles = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.h2`
  margin: 0;
  color: ${colors.textDark};
  font-size: clamp(1.45rem, 3vw, 1.95rem);
  font-weight: 750;
  letter-spacing: -0.4px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${colors.mediumBrown};
  font-size: 0.9rem;
  font-weight: 500;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  @media (max-width: 600px) {
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
  gap: 8px;
  padding: 0 18px;
  border: none;
  border-radius: 10px;
  background: ${colors.darkBrown};
  color: white;
  font-size: 0.88rem;
  font-weight: 650;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(58, 35, 20, 0.15);

  &:hover {
    background: ${colors.mediumBrown};
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(58, 35, 20, 0.22);
  }
`;

const SecondaryButton = styled(Button)`
  background: rgba(140, 104, 66, 0.12);
  color: ${colors.textDark};
  border: 1px solid rgba(140, 104, 66, 0.3);
  box-shadow: none;

  &:hover {
    background: rgba(140, 104, 66, 0.22);
    color: ${colors.textDark};
    transform: translateY(-1px);
  }
`;

const Tabs = styled.div`
  width: 100%;
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  padding: 6px;
  background: #f7f3ef;
  border-radius: 12px;
  overflow-x: auto;
  border: 1px solid rgba(140, 104, 66, 0.12);

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(140, 104, 66, 0.3);
    border-radius: 10px;
  }
`;

const TabButton = styled.button`
  flex: 1;
  min-width: 130px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: ${colors.textDark};
  font-size: 0.88rem;
  font-weight: 650;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  text-align: center;

  &:hover {
    background: rgba(140, 104, 66, 0.14);
  }

  &.active {
    background: linear-gradient(135deg, ${colors.mediumBrown}, ${colors.darkBrown});
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(58, 35, 20, 0.2);
    transform: translateY(-1px);
  }
`;

const TableContainer = styled.div`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid rgba(140, 104, 66, 0.14);
  border-radius: 14px;
  background: #ffffff;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 7px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(141, 110, 99, 0.35);
    border-radius: 20px;
  }
`;

const Table = styled.table`
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
  background: white;
`;

const TableHead = styled.thead`
  background: linear-gradient(135deg, ${colors.mediumBrown}, ${colors.darkBrown});
`;

const TableHeader = styled.th`
  padding: 16px 14px;
  text-align: left;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.88rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: none;
  position: relative;

  &:first-child {
    border-radius: 12px 0 0 0;
    padding-left: 18px;
  }

  &:last-child {
    border-radius: 0 12px 0 0;
    padding-right: 18px;
  }
`;

const TableRow = styled.tr`
  background: rgba(245, 240, 232, 0.2);
  border-bottom: 1px solid rgba(140, 104, 66, 0.1);
  transition: all 0.25s ease;
  animation: ${slideInRow} 0.3s ease-out;
  animation-fill-mode: both;

  &:hover {
    background: rgba(245, 240, 232, 0.6);
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(58, 35, 20, 0.08);
  }

  &:nth-child(even) {
    background: rgba(237, 228, 211, 0.22);
  }

  &:nth-child(even):hover {
    background: rgba(237, 228, 211, 0.55);
  }
`;

const TableCell = styled.td`
  padding: 14px 14px;
  color: ${colors.textDark};
  font-size: 0.92rem;
  font-weight: 500;
  border: none;
  vertical-align: middle;

  &:first-child {
    padding-left: 18px;
  }
  &:last-child {
    padding-right: 18px;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white;
  background-color: ${(props) => getStatusColor(props.status)};
`;

const TypeBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 650;
  background: rgba(140, 104, 66, 0.12);
  color: ${colors.darkBrown};
  border: 1px solid rgba(140, 104, 66, 0.25);
`;

const ViewButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, ${colors.mediumBrown}, ${colors.darkBrown});
  color: #ffffff;
  border: none;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 650;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, ${colors.accentBrown}, ${colors.mediumBrown});
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(58, 35, 20, 0.25);
  }
`;

const NoMeetings = styled.td`
  text-align: center;
  padding: 40px 20px;
  color: ${colors.mediumBrown};
  font-weight: 600;
  font-size: 1rem;
`;

// Calendar Modal Components
const CalendarModal = styled.div`
  width: 100%;
  max-width: 100%;
  height: min(850px, calc(100dvh - 48px));
  max-height: calc(100dvh - 48px);
  min-height: 500px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: clamp(14px, 2vw, 24px);
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid rgba(140, 104, 66, 0.16);
  box-shadow: 0 20px 60px rgba(58, 35, 20, 0.15);
  overflow: hidden;

  @media (max-width: 700px) {
    height: calc(100dvh - 20px);
    max-height: calc(100dvh - 20px);
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
  padding: 0 44px 14px 0;
  margin-bottom: 14px;
  border-bottom: 1px solid rgba(141, 110, 99, 0.18);

  @media (max-width: 700px) {
    align-items: stretch;
    padding-right: 38px;
  }
`;

const CalendarTitle = styled.h2`
  margin: 0;
  color: ${colors.textDark};
  font-size: clamp(1.1rem, 2.5vw, 1.45rem);
  font-weight: 750;
  text-align: center;
  white-space: nowrap;
`;

const CalendarNavigation = styled.div`
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
  transition: all 0.2s ease;
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
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 650;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, ${colors.accentBrown}, ${colors.mediumBrown});
    transform: translateY(-1px);
  }
`;

const ViewSelect = styled.select`
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(140, 104, 66, 0.3);
  background: rgba(245, 240, 232, 0.85);
  color: ${colors.textDark};
  font-weight: 600;
  cursor: pointer;
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
    background: rgba(141, 110, 99, 0.3);
    border-radius: 10px;
  }
`;

const MonthView = styled.div`
  width: 100%;
  min-width: 760px;
  min-height: 100%;
  padding: 10px;
  background: #faf9f8;
  border-radius: 12px;
  border: 1px solid rgba(140, 104, 66, 0.12);
`;

const MonthHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(95px, 1fr));
  text-align: center;
  font-weight: 700;
  color: ${colors.textDark};
  padding: 8px 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const MonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(95px, 1fr));
  grid-auto-rows: minmax(105px, 1fr);
  gap: 6px;
  min-height: 560px;
`;

const MonthDay = styled.div`
  min-width: 0;
  min-height: 105px;
  display: flex;
  flex-direction: column;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(140, 104, 66, 0.1);
  background: #ffffff;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    background: #faf7f5;
    border-color: rgba(141, 110, 99, 0.35);
  }

  &.other-month {
    opacity: 0.45;
  }

  &.today {
    border: 2px solid ${colors.mediumBrown};
    background: #faf6f4;
  }
`;

const DayNumber = styled.div`
  font-weight: 700;
  color: ${colors.textDark};
  margin-bottom: 5px;
  text-align: right;
  font-size: 0.85rem;
`;

const DayEvents = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  padding: 5px 7px;
  border-radius: 6px;
  color: white;
  font-size: 0.74rem;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: ${(props) => getStatusColor(props.status)};

  ${(props) =>
    props.booked &&
    `
    border: 1.5px solid #1b5e20;
    box-shadow: 0 0 0 1px rgba(76, 175, 80, 0.35);
    font-weight: 700;
  `}

  &:hover {
    opacity: 0.92;
    transform: translateX(2px);
  }
`;

const EventTime = styled.div`
  font-weight: 650;
  font-size: 0.68rem;
`;

const EventTitle = styled.div`
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Week View
const WeekView = styled.div`
  width: 100%;
  min-height: 100%;
  background: rgba(245, 240, 232, 0.4);
  border-radius: 14px;
  padding: 14px;
  border: 1px solid rgba(140, 104, 66, 0.15);
`;

const WeekHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 10px;
`;

const WeekdayHeader = styled.div`
  padding: 8px 4px;
  border-bottom: 2px solid ${colors.accentBrown};

  &.today {
    background: rgba(140, 104, 66, 0.12);
    border-radius: 8px 8px 0 0;
  }
`;

const WeekdayName = styled.div`
  font-size: 0.8rem;
  color: ${colors.textDark};
  font-weight: 600;
  text-transform: uppercase;
`;

const WeekdayDate = styled.div`
  font-size: 1.05rem;
  font-weight: 700;
  color: ${colors.textDark};
`;

const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  min-height: 480px;
`;

const WeekdayCell = styled.div`
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  padding: 8px;
  border: 1px solid rgba(140, 104, 66, 0.1);
  min-height: 120px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.today {
    background: #faf6f4;
    border-color: ${colors.mediumBrown};
  }
`;

// Day View
const DayView = styled.div`
  width: 100%;
  min-height: 100%;
  background: rgba(245, 240, 232, 0.4);
  border-radius: 14px;
  padding: 16px;
  border: 1px solid rgba(140, 104, 66, 0.15);
`;

const DayHeader = styled.div`
  padding-bottom: 12px;
  margin-bottom: 14px;
  border-bottom: 2px solid ${colors.accentBrown};
`;

const DayTitle = styled.h3`
  color: ${colors.textDark};
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
`;

const TimeSlots = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 520px;
  overflow-y: auto;
`;

const HourRow = styled.div`
  display: flex;
  min-height: 56px;
  border-bottom: 1px solid rgba(140, 104, 66, 0.1);
`;

const HourLabel = styled.div`
  width: 75px;
  padding: 8px;
  text-align: right;
  font-size: 0.82rem;
  color: ${colors.textDark};
  font-weight: 600;
`;

const HourEvents = styled.div`
  flex: 1;
  padding: 6px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

/* =========================================================
   MAIN COMPONENT
========================================================= */
const Meetings = ({ stats, setStats, matchesList = [] }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [calendarView, setCalendarView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesterCache, setRequesterCache] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Recompute "now" every minute
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Cache requester details
  const fetchRequesterDetails = useCallback(
    async (requesterIds) => {
      const uniqueIds = [
        ...new Set(requesterIds.filter((id) => id && !(id in requesterCache))),
      ];
      if (uniqueIds.length === 0) return requesterCache;

      try {
        const newCache = { ...requesterCache };

        await Promise.all(
          uniqueIds.map(async (id) => {
            let resolvedName = null;

            // 1. Try CMF Profiles first
            try {
              const cmfSnap = await getDoc(doc(db, "cmfProfiles", `${id}_cmf`));
              if (cmfSnap.exists()) {
                const data = cmfSnap.data();
                resolvedName =
                  data?.formData?.entityOverview?.registeredName ||
                  data?.entityOverview?.registeredName ||
                  data?.formData?.contactDetails?.contactName ||
                  null;
              }
            } catch (e) {
              console.warn(`Error checking cmfProfiles for ${id}:`, e);
            }

            // 2. Try MyuniversalProfiles
            if (!resolvedName) {
              try {
                const profileSnap = await getDoc(
                  doc(db, "MyuniversalProfiles", id)
                );
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
            }

            // 3. Try users collection
            if (!resolvedName) {
              try {
                const userSnap = await getDoc(doc(db, "users", id));
                if (userSnap.exists()) {
                  const userData = userSnap.data();
                  resolvedName =
                    userData.name ||
                    userData.fullName ||
                    userData.displayName ||
                    userData.email ||
                    null;
                }
              } catch (e) {
                console.warn(`Error checking users collection for ${id}:`, e);
              }
            }

            newCache[id] = resolvedName;
          })
        );

        setRequesterCache(newCache);
        return newCache;
      } catch (err) {
        console.warn("Error fetching requester details:", err);
        return requesterCache;
      }
    },
    [requesterCache]
  );

  // Firestore listeners for CMF facilitation sessions
  useEffect(() => {
    setLoading(true);
    const auth = getAuth();

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setCurrentUserId(null);
        setMeetings([]);
        setLoading(false);
        return;
      }

      setCurrentUserId(user.uid);

      const fetchMeetings = async () => {
        try {
          // Fetch CMF-specific queries in parallel
          const [cmfSnap, createdSnap, toSnap, smeSnap] = await Promise.all([
            getDocs(
              query(
                collection(db, "smeCalendarEvents"),
                where("cmfId", "==", user.uid)
              )
            ),
            getDocs(
              query(
                collection(db, "smeCalendarEvents"),
                where("createdBy", "==", user.uid)
              )
            ),
            getDocs(
              query(
                collection(db, "smeCalendarEvents"),
                where("to", "==", user.uid)
              )
            ),
            getDocs(
              query(
                collection(db, "smeCalendarEvents"),
                where("smeId", "==", user.uid)
              )
            ),
          ]);

          // Deduplicate by doc ID
          const docsMap = new Map();
          [
            ...cmfSnap.docs,
            ...createdSnap.docs,
            ...toSnap.docs,
            ...smeSnap.docs,
          ].forEach((d) => {
            if (!docsMap.has(d.id)) {
              docsMap.set(d.id, d);
            }
          });

          const requesterIds = [];
          const meetingsData = [];

          docsMap.forEach((docSnap) => {
            const data = docSnap.data();
            const counterpartId =
              data.to && data.to !== user.uid
                ? data.to
                : data.createdBy && data.createdBy !== user.uid
                ? data.createdBy
                : data.smeId && data.smeId !== user.uid
                ? data.smeId
                : data.counterpartId || null;

            if (
              counterpartId &&
              !data.recipientName &&
              !data.toName &&
              !data.createdByName
            ) {
              requesterIds.push(counterpartId);
            }

            const slots = (data.availableDates || []).map((slot) => ({
              ...slot,
              date: slot.date?.toDate ? slot.date.toDate() : new Date(slot.date),
              status: slot.status || "available",
            }));

            const createdBy = data.createdBy || data.hostId || null;
            const recipientId = data.to || null;
            const isInvitation = data.isInvitation === true;

            let requestDirection = "other";
            if (createdBy && createdBy !== user.uid) {
              requestDirection = "incoming";
            } else if (
              createdBy === user.uid &&
              recipientId &&
              recipientId !== user.uid &&
              !isInvitation
            ) {
              requestDirection = "outgoing";
            } else if (createdBy === user.uid && !recipientId) {
              requestDirection = "personal";
            }

            meetingsData.push({
              id: docSnap.id,
              name: data.title || data.name || "Cohort Facilitation Session",
              title: data.title || data.name || "Cohort Facilitation Session",
              eventType: data.eventType || "Cohort Facilitation Session",
              location: data.location || "Virtual",
              meetingLink: data.meetingLink || "",
              description: data.description || "",
              duration: data.duration || 30,
              createdBy,
              createdByName: data.createdByName || data.host || "",
              hostName: data.host || data.createdByName || "Facilitator",
              recipientId,
              recipientName: data.recipientName || data.toName || "",
              to: recipientId,
              toName: data.toName || data.recipientName || "",
              toType: data.toType || "",
              counterpartId,
              counterpartName:
                data.toName ||
                data.recipientName ||
                data.smeName ||
                data.createdByName ||
                "",
              requestDirection,
              isInvitation,
              slots,
              scheduledDate: data.scheduledDate || null,
              scheduledTimeSlot: data.scheduledTimeSlot || null,
              status: data.status || data.meetingStatus || "pending",
              meetingStatus: data.meetingStatus || data.status || "pending",
              cmfId: data.cmfId || user.uid,
              facilitatorName: data.facilitatorName || data.host || "",
            });
          });

          // Fetch requester names
          const cache = await fetchRequesterDetails(requesterIds);

          const enhancedMeetings = meetingsData.map((meeting) => ({
            ...meeting,
            counterpartName:
              meeting.counterpartName ||
              cache[meeting.counterpartId] ||
              meeting.toName ||
              meeting.recipientName ||
              "Stakeholder",
            recipientName:
              meeting.recipientName ||
              cache[meeting.counterpartId] ||
              "Stakeholder",
          }));

          setMeetings(enhancedMeetings);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching CMF calendar meetings:", error);
          setLoading(false);
        }
      };

      fetchMeetings();

      // Debounced real-time listener
      let timeoutId;
      const debouncedUpdate = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(fetchMeetings, 800);
      };

      const unsub1 = onSnapshot(
        query(
          collection(db, "smeCalendarEvents"),
          where("cmfId", "==", user.uid)
        ),
        debouncedUpdate
      );
      const unsub2 = onSnapshot(
        query(
          collection(db, "smeCalendarEvents"),
          where("createdBy", "==", user.uid)
        ),
        debouncedUpdate
      );
      const unsub3 = onSnapshot(
        query(
          collection(db, "smeCalendarEvents"),
          where("to", "==", user.uid)
        ),
        debouncedUpdate
      );

      return () => {
        unsub1();
        unsub2();
        unsub3();
        clearTimeout(timeoutId);
      };
    });

    return () => unsubscribeAuth();
  }, [fetchRequesterDetails]);

  // Process meetings for effective status
  const processedMeetings = useMemo(() => {
    if (!Array.isArray(meetings) || !currentUserId) return [];

    return meetings.map((meeting) => {
      const validSlots = (meeting.slots || []).filter(
        (slot) => slot?.date instanceof Date && !Number.isNaN(slot.date.getTime())
      );

      const latestSlotTime =
        validSlots.length > 0
          ? Math.max(...validSlots.map((slot) => slot.date.getTime()))
          : 0;

      const isPastDue =
        latestSlotTime > 0 && latestSlotTime < now.getTime();

      const storedStatus = String(meeting.status || "pending").toLowerCase();

      let effectiveStatus = storedStatus;
      if (isPastDue) {
        effectiveStatus = "past";
      } else if (storedStatus === "completed") {
        effectiveStatus = "completed";
      } else if (storedStatus === "cancelled") {
        effectiveStatus = "cancelled";
      }

      const isOutgoingRequest =
        !isPastDue &&
        effectiveStatus === "pending" &&
        meeting.requestDirection === "outgoing";

      const isIncomingRequest =
        !isPastDue &&
        effectiveStatus === "pending" &&
        meeting.requestDirection === "incoming";

      const canRespond =
        !isPastDue &&
        effectiveStatus === "pending" &&
        meeting.requestDirection === "incoming";

      return {
        ...meeting,
        validSlots,
        latestSlotTime,
        isPastDue,
        effectiveStatus,
        isOutgoingRequest,
        isIncomingRequest,
        canRespond,
      };
    });
  }, [meetings, now, currentUserId]);

  // Filtered meetings by tab
  const filteredMeetings = useMemo(() => {
    return processedMeetings
      .filter((meeting) => {
        if (!meeting.slots || meeting.slots.length === 0) return false;

        switch (activeTab) {
          case "all":
            return true;

          case "incoming":
            return (
              meeting.isPastDue === false &&
              meeting.effectiveStatus === "pending" &&
              meeting.isIncomingRequest === true
            );

          case "requested":
            return (
              meeting.isPastDue === false &&
              meeting.effectiveStatus === "pending" &&
              meeting.isOutgoingRequest === true
            );

          case "upcoming":
            return (
              meeting.isPastDue === false &&
              meeting.effectiveStatus === "scheduled"
            );

          case "past":
            return (
              meeting.isPastDue === true ||
              meeting.effectiveStatus === "past" ||
              meeting.effectiveStatus === "completed" ||
              meeting.effectiveStatus === "cancelled"
            );

          default:
            return true;
        }
      })
      .sort((a, b) => {
        if (activeTab === "past") {
          return b.latestSlotTime - a.latestSlotTime;
        }
        return a.latestSlotTime - b.latestSlotTime;
      });
  }, [processedMeetings, activeTab]);

  // Calendar meetings flattened per slot
  const calendarMeetings = useMemo(() => {
    return processedMeetings.flatMap((meeting) => {
      if (!meeting.slots || !Array.isArray(meeting.slots)) return [];

      return meeting.slots.map((slot) => ({
        ...meeting,
        slot,
        dateKey: slot.date.toDateString(),
        hourKey: `${slot.date.getDate()}-${slot.date.getHours()}`,
      }));
    });
  }, [processedMeetings]);

  // Event Creation Handler
  const handleCreateEvent = useCallback(
    async (newEvent) => {
      setSubmitting(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          alert("User not authenticated");
          setSubmitting(false);
          return;
        }

        const proposedSlots = newEvent.proposedSlots || [];
        if (proposedSlots.length === 0) {
          throw new Error("At least one session slot is required.");
        }

        const availableDates = proposedSlots.map((slot) => {
          const [year, month, day] = slot.date.split("-");
          const [hours, minutes] = slot.time.split(":");
          const dateObj = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hours) || 0,
            parseInt(minutes) || 0
          );
          return {
            date: dateObj,
            status: "available",
            timeSlots: [{ start: slot.time, end: "" }],
          };
        });

        const firstSlot = availableDates[0];
        const hasInvitee = Boolean(newEvent.to);

        const eventData = {
          title: newEvent.title || "Cohort Facilitation Session",
          name: newEvent.title || "Cohort Facilitation Session",
          eventType: newEvent.eventType || "Cohort Facilitation Session",
          date: firstSlot.date,
          time: newEvent.proposedSlots?.[0]?.time || "",
          duration: newEvent.duration || "30",
          location: newEvent.location || "Virtual",
          meetingLink: newEvent.meetingLink || "",
          description: newEvent.description || "",
          agendaItems: newEvent.agendaItems || [],
          host: newEvent.hostName || "Capital and Market Facilitator",
          facilitatorName: newEvent.facilitatorName || newEvent.hostName || "CMF",
          cmfId: user.uid,
          createdBy: user.uid,
          createdByName: newEvent.hostName,
          role: "cmf",
          to: newEvent.to || "",
          toName: newEvent.toName || "",
          toType: newEvent.toType || "",
          recipientName: newEvent.toName || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: hasInvitee ? "pending" : "scheduled",
          meetingStatus: hasInvitee ? "pending" : "scheduled",
          smeId: user.uid,
          availableDates,
        };

        const eventRef = await addDoc(
          collection(db, "smeCalendarEvents"),
          eventData
        );

        await updateDoc(eventRef, {
          originEventId: eventRef.id,
          originCollection: "smeCalendarEvents",
        });

        if (newEvent.to) {
          await addDoc(collection(db, "smeCalendarEvents"), {
            ...eventData,
            smeId: newEvent.to,
            smeName: newEvent.toName,
            createdBy: user.uid,
            createdByName: newEvent.hostName,
            isInvitation: true,
            originEventId: eventRef.id,
            originCollection: "smeCalendarEvents",
          });

          // Also record notification
          try {
            await addDoc(collection(db, "notifications"), {
              userId: newEvent.to,
              title: "New Facilitation Session Scheduled",
              message: `${newEvent.hostName} scheduled a facilitation session: "${newEvent.title}". Please confirm your slot.`,
              type: "calendar_invite",
              eventId: eventRef.id,
              read: false,
              createdAt: serverTimestamp(),
            });
          } catch (notifErr) {
            console.warn("Notification create warning:", notifErr);
          }
        }

        if (setStats) {
          setStats((prev) => ({ ...prev, created: (prev.created || 0) + 1 }));
        }

        setShowCreateModal(false);
      } catch (error) {
        console.error("Error creating facilitation event:", error);
        alert(`Failed to create event: ${error.message}`);
      } finally {
        setSubmitting(false);
      }
    },
    [setStats]
  );

  // Meeting Action Handler (Confirm slot, Complete, Cancel)
  const handleMeetingAction = useCallback(
    async (id, action) => {
      try {
        if (action === "scheduled") {
          setMeetings((prev) =>
            prev.map((m) => (m.id === id ? { ...m, status: "scheduled" } : m))
          );
          if (setStats) {
            setStats((prev) => ({
              ...prev,
              scheduled: (prev.scheduled || 0) + 1,
            }));
          }
        } else if (action === "completed") {
          setMeetings((prev) =>
            prev.map((m) => (m.id === id ? { ...m, status: "completed" } : m))
          );
          if (setStats) {
            setStats((prev) => ({
              ...prev,
              completed: (prev.completed || 0) + 1,
            }));
          }
        } else if (action === "cancelled") {
          setMeetings((prev) =>
            prev.map((m) => (m.id === id ? { ...m, status: "cancelled" } : m))
          );
          if (setStats) {
            setStats((prev) => ({
              ...prev,
              cancelled: (prev.cancelled || 0) + 1,
            }));
          }
        }
      } catch (error) {
        console.error("Error updating meeting state:", error);
      } finally {
        setSelectedMeeting(null);
      }
    },
    [setStats]
  );

  // Calendar Views (Month, Week, Day)
  const renderMonthView = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const monthMeetingsByDay = {};
    calendarMeetings.forEach((meeting) => {
      const slotDate = meeting.slot.date;
      if (
        slotDate.getFullYear() === year &&
        slotDate.getMonth() === month
      ) {
        const day = slotDate.getDate();
        if (!monthMeetingsByDay[day]) monthMeetingsByDay[day] = [];
        monthMeetingsByDay[day].push(meeting);
      }
    });

    return (
      <MonthView>
        <MonthHeader>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </MonthHeader>
        <MonthGrid>
          {Array.from({ length: 42 }).map((_, i) => {
            let day;
            let className = "";

            if (i < startDay) {
              day = i + 1;
              className = "other-month";
            } else if (i < startDay + daysInMonth) {
              day = i - startDay + 1;
              const date = new Date(year, month, day);
              if (date.toDateString() === new Date().toDateString()) {
                className = "today";
              }
            } else {
              day = i - startDay - daysInMonth + 1;
              className = "other-month";
            }

            return (
              <MonthDay key={i} className={className}>
                <DayNumber>{day}</DayNumber>
                <DayEvents>
                  {(monthMeetingsByDay[day] || []).map((meeting, idx) => (
                    <CalendarEvent
                      key={idx}
                      status={meeting.effectiveStatus}
                      booked={meeting.status === "scheduled"}
                      onClick={() => setSelectedMeeting(meeting)}
                    >
                      <EventTime>
                        {meeting.slot.date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </EventTime>
                      <EventTitle>{meeting.title}</EventTitle>
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

  const renderWeekView = useCallback(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekMeetingsByDay = Array(7)
      .fill(null)
      .map(() => []);

    calendarMeetings.forEach((meeting) => {
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
              <WeekdayHeader key={i} className={isToday ? "today" : ""}>
                <WeekdayName>
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </WeekdayName>
                <WeekdayDate>{day.getDate()}</WeekdayDate>
              </WeekdayHeader>
            );
          })}
        </WeekHeader>
        <WeekGrid>
          {weekMeetingsByDay.map((dayMeetings, i) => {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <WeekdayCell key={i} className={isToday ? "today" : ""}>
                {dayMeetings.map((meeting, idx) => (
                  <CalendarEvent
                    key={idx}
                    status={meeting.effectiveStatus}
                    booked={meeting.status === "scheduled"}
                    onClick={() => setSelectedMeeting(meeting)}
                  >
                    <EventTime>
                      {meeting.slot.date.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </EventTime>
                    <EventTitle>{meeting.title}</EventTitle>
                  </CalendarEvent>
                ))}
              </WeekdayCell>
            );
          })}
        </WeekGrid>
      </WeekView>
    );
  }, [currentDate, calendarMeetings]);

  const renderDayView = useCallback(() => {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const dayMeetings = calendarMeetings
      .filter(({ slot }) => slot.date >= dayStart && slot.date <= dayEnd)
      .sort((a, b) => a.slot.date - b.slot.date);

    const meetingsByHour = {};
    dayMeetings.forEach((meeting) => {
      const hour = meeting.slot.date.getHours();
      if (!meetingsByHour[hour]) meetingsByHour[hour] = [];
      meetingsByHour[hour].push(meeting);
    });

    return (
      <DayView>
        <DayHeader>
          <DayTitle>
            {currentDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </DayTitle>
        </DayHeader>
        <TimeSlots>
          {Array.from({ length: 24 }).map((_, hour) => (
            <HourRow key={hour}>
              <HourLabel>
                {hour === 0
                  ? "12 AM"
                  : hour < 12
                  ? `${hour} AM`
                  : hour === 12
                  ? "12 PM"
                  : `${hour - 12} PM`}
              </HourLabel>
              <HourEvents>
                {(meetingsByHour[hour] || []).map((meeting, idx) => (
                  <CalendarEvent
                    key={idx}
                    status={meeting.effectiveStatus}
                    booked={meeting.status === "scheduled"}
                    onClick={() => setSelectedMeeting(meeting)}
                  >
                    <EventTime>
                      {meeting.slot.date.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </EventTime>
                    <EventTitle>{meeting.title}</EventTitle>
                  </CalendarEvent>
                ))}
              </HourEvents>
            </HourRow>
          ))}
        </TimeSlots>
      </DayView>
    );
  }, [currentDate, calendarMeetings]);

  const navigateDate = useCallback(
    (direction) => {
      setCurrentDate((prev) => {
        const newDate = new Date(prev);
        const increment = direction === "next" ? 1 : -1;

        switch (calendarView) {
          case "day":
            newDate.setDate(newDate.getDate() + increment);
            break;
          case "week":
            newDate.setDate(newDate.getDate() + increment * 7);
            break;
          case "month":
            newDate.setMonth(newDate.getMonth() + increment);
            break;
          default:
            break;
        }

        return newDate;
      });
    },
    [calendarView]
  );

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const calendarContent = useMemo(() => {
    switch (calendarView) {
      case "day":
        return renderDayView();
      case "week":
        return renderWeekView();
      case "month":
      default:
        return renderMonthView();
    }
  }, [calendarView, renderDayView, renderWeekView, renderMonthView]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "350px",
          color: colors.textDark,
          fontWeight: "600",
        }}
      >
        Loading CMF facilitation sessions...
      </div>
    );
  }

  return (
    <MeetingsContainer>
      {/* Header */}
      <Header>
        <HeaderTitles>
          <Title>
            <Sparkles size={24} color={colors.accentBrown} />
            CMF Facilitation Calendar
          </Title>
          <Subtitle>
            Facilitation sessions, investor demo pitches, and cohort advisory engagements
          </Subtitle>
        </HeaderTitles>

        <HeaderActions>
          <SecondaryButton onClick={() => setShowAvailabilityModal(true)}>
            <Clock size={16} />
            Office Hours
          </SecondaryButton>

          <SecondaryButton onClick={() => setShowCalendar(true)}>
            <CalendarIcon size={16} />
            Calendar Grid
          </SecondaryButton>

          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Schedule Session
          </Button>
        </HeaderActions>
      </Header>

      {/* Tabs */}
      <Tabs>
        {[
          { key: "all", label: "All Sessions" },
          { key: "incoming", label: "Incoming Requests" },
          { key: "requested", label: "Awaiting Confirmation" },
          { key: "upcoming", label: "Upcoming Facilitations" },
          { key: "past", label: "Past Sessions" },
        ].map((tab) => (
          <TabButton
            key={tab.key}
            className={activeTab === tab.key ? "active" : ""}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </TabButton>
        ))}
      </Tabs>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <tr>
              <TableHeader>Facilitation Session</TableHeader>
              <TableHeader>Stakeholder / Recipient</TableHeader>
              <TableHeader>Category / Type</TableHeader>
              <TableHeader>Proposed Slots</TableHeader>
              <TableHeader>Location</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Action</TableHeader>
            </tr>
          </TableHead>
          <tbody>
            {filteredMeetings.length === 0 ? (
              <tr>
                <NoMeetings colSpan="7">
                  {activeTab === "all" && "No facilitation sessions found."}
                  {activeTab === "incoming" &&
                    "No incoming requests requiring your facilitation review."}
                  {activeTab === "requested" &&
                    "No sessions currently awaiting stakeholder slot confirmation."}
                  {activeTab === "upcoming" &&
                    "No upcoming confirmed facilitation sessions."}
                  {activeTab === "past" && "No past facilitation sessions."}
                </NoMeetings>
              </tr>
            ) : (
              filteredMeetings.map((meeting, index) => (
                <TableRow key={`${meeting.id}-${index}`}>
                  <TableCell>
                    <div style={{ fontWeight: 700, color: colors.textDark }}>
                      {meeting.title}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Users size={15} color={colors.mediumBrown} />
                      <span>
                        {meeting.counterpartName ||
                          meeting.recipientName ||
                          "Stakeholder"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <TypeBadge>{meeting.eventType}</TypeBadge>
                  </TableCell>

                  <TableCell>
                    <span
                      style={{
                        color: colors.mediumBrown,
                        fontWeight: 650,
                      }}
                    >
                      {meeting.slots.length}{" "}
                      {meeting.slots.length === 1 ? "slot option" : "slot options"}
                    </span>
                  </TableCell>

                  <TableCell>{meeting.location}</TableCell>

                  <TableCell>
                    <StatusBadge status={meeting.effectiveStatus}>
                      {meeting.isOutgoingRequest
                        ? "Awaiting Response"
                        : meeting.isIncomingRequest
                        ? "Needs Response"
                        : getStatusLabel(meeting.effectiveStatus)}
                    </StatusBadge>
                  </TableCell>

                  <TableCell>
                    <ViewButton onClick={() => setSelectedMeeting(meeting)}>
                      <Eye size={15} />
                      {meeting.canRespond ? "Review" : "View"}
                    </ViewButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableContainer>

      {/* Modals */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <CreateEventForm
            onSubmit={handleCreateEvent}
            onCancel={() => setShowCreateModal(false)}
            previousRecipients={matchesList}
          />
        </Modal>
      )}

      {showAvailabilityModal && (
        <Modal onClose={() => setShowAvailabilityModal(false)}>
          <Availability onClose={() => setShowAvailabilityModal(false)} />
        </Modal>
      )}

      {selectedMeeting && (
        <MeetingDetails
          meeting={selectedMeeting}
          onAction={handleMeetingAction}
          onClose={() => setSelectedMeeting(null)}
        />
      )}

      {showCalendar && (
        <Modal onClose={() => setShowCalendar(false)}>
          <CalendarModal>
            <CalendarHeader>
              <CalendarNavigation>
                <NavButton onClick={() => navigateDate("prev")}>
                  <ChevronLeft size={20} />
                </NavButton>

                <CalendarTitle>
                  {calendarView === "month" &&
                    currentDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}

                  {calendarView === "week" &&
                    `${currentDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })} - ${new Date(
                      currentDate.getTime() + 6 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}`}

                  {calendarView === "day" &&
                    currentDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                </CalendarTitle>

                <NavButton onClick={() => navigateDate("next")}>
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

            <CalendarContent>{calendarContent}</CalendarContent>
          </CalendarModal>
        </Modal>
      )}

      {/* Submitting overlay */}
      {submitting && (
        <div
          style={{
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
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "32px 40px",
              borderRadius: "14px",
              textAlign: "center",
              boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "4px solid #efebe9",
                borderTop: "4px solid #5D4037",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p
              style={{
                color: "#3E2723",
                fontSize: "16px",
                fontWeight: "600",
                margin: 0,
              }}
            >
              Scheduling facilitation session...
            </p>
          </div>
        </div>
      )}
    </MeetingsContainer>
  );
};

export default Meetings;
