import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import Modal from './Modal';
import CreateEventForm from './CreateEventForm';
import MeetingDetails from './MeetingDetails';
import { db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

// Main Component
const Meetings = ({ stats, setStats }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarView, setCalendarView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = getAuth().onAuthStateChanged(async (user) => {
      if (!user) return;

      const q1 = query(collection(db, "smeCalendarEvents"), where("smeId", "==", user.uid));
      const q2 = query(collection(db, "supplierCalendarEvents"), where("supplierId", "==", user.uid));

      const processCombinedSnapshot = async (snapshot1, snapshot2) => {
        const allDocs = [...snapshot1.docs, ...snapshot2.docs];
        const groupedMeetings = {};

        for (const docSnap of allDocs) {
          const data = docSnap.data();
          const counterpartId = data.customerId || data.funderId;
          const groupKey = `${counterpartId}-${data.title}`;

          if (!groupedMeetings[groupKey]) {
            let requesterName = '';
            let requesterType = '';
            let requesterId = '';

            // Determine requester type and ID
            if (data.funderId) {
              requesterType = 'Investor';
              requesterId = data.funderId;
            } else if (data.customerId) {
              requesterType = 'Customer';
              requesterId = data.customerId;
            } else if (data.smeId) {
              requesterType = 'SME';
              requesterId = data.smeId;
            } else if (docSnap.ref.parent.id === 'supplierCalendarEvents') {
              requesterType = 'Supplier';
            } else {
              requesterType = 'SME';
            }

            // Fetch requester details if we have an ID
            if (requesterId) {
              try {
                const requesterDoc = await getDoc(doc(db, "MyuniversalProfiles", requesterId));
                if (requesterDoc.exists()) {
                  const formData = requesterDoc.data()?.formData;
                  
                  // For SME, get the registeredName from entityOverview
                  if (requesterType === 'SME') {
                    requesterName = formData?.entityOverview?.registeredName || 
                    formData?.contactDetails?.primaryContactName||'SME';
                  } 
                  // For Investor, get from fundManageOverview
                  else if (requesterType === 'Investor') {
                    requesterName = formData?.fundManageOverview?.registeredName || 
                                   formData?.contactDetails?.primaryContactName || 
                                   'Investor';
                  }
                  // For Customer, get from appropriate section
                  else if (requesterType === 'Customer') {
                    requesterName = formData?.entityOverview?.registeredName ||
                                   formData?.contactDetails?.primaryContactName || 
                                   'Customer';
                  }
                  // Fallback for any other type
                  else {
                    requesterName = formData?.entityOverview?.registeredName ||
                                   formData?.contactDetails?.primaryContactName || 
                                   requesterType;
                  }
                }
              } catch (err) {
                console.warn("Error fetching requester details:", err);
                requesterName = requesterType; // Fallback to type
              }
            }

            // If we still don't have a name, use the type
            if (!requesterName) {
              requesterName = requesterType;
            }

            groupedMeetings[groupKey] = {
              id: groupKey,
              docId: docSnap.id,
              name: data.title || 'Meeting',
              requesterName,
              requesterType,
              requesterId,
              counterpartId,
              smeAppId: data.smeAppId,
              investorAppId: data.investorAppId,
              location: data.location || 'Virtual',
              slots: [],
              isExpanded: false,
              status: data.status || 'pending',
              collection: docSnap.ref.parent.id
            };
          }

          (data.availableDates || []).forEach(slot => {
            const parsedDate = slot.date?.toDate ? slot.date.toDate() : new Date(slot.date);
            groupedMeetings[groupKey].slots.push({
              id: `${docSnap.id}-${slot.date}`,
              ...slot,
              date: parsedDate,
              location: data.location,
              status: slot.status || 'available'
            });
          });

          if (data.status) {
            groupedMeetings[groupKey].status = data.status;
          }
        }

        setMeetings(Object.values(groupedMeetings));
        setLoading(false);
      };

      let snapshot1, snapshot2;
      let hasSnapshot1 = false;
      let hasSnapshot2 = false;

      const unsub1 = onSnapshot(q1, (snap) => {
        snapshot1 = snap;
        hasSnapshot1 = true;
        if (hasSnapshot1 && hasSnapshot2) {
          processCombinedSnapshot(snapshot1, snapshot2);
        }
      });

      const unsub2 = onSnapshot(q2, (snap) => {
        snapshot2 = snap;
        hasSnapshot2 = true;
        if (hasSnapshot1 && hasSnapshot2) {
          processCombinedSnapshot(snapshot1, snapshot2);
        }
      });

      return () => {
        unsub1();
        unsub2();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const handleCreateEvent = (newEvent) => {
    setMeetings([...meetings, newEvent]);
    setStats(prev => ({ ...prev, created: prev.created + 1 }));
    setShowCreateModal(false);
  };

  const handleMeetingAction = async (id, action) => {
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

        const updatedMeetings = meetings.map(meeting => {
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
        }).filter(Boolean);

        setMeetings(updatedMeetings);
        setStats(prev => ({ ...prev, scheduled: prev.scheduled + 1 }));
      } else if (action === 'completed') {
        const updatedMeetings = meetings.map(meeting => {
          if (meeting.id === id) {
            return { ...meeting, status: 'completed' };
          }
          return meeting;
        });
        setMeetings(updatedMeetings);
        setStats(prev => ({ ...prev, completed: prev.completed + 1 }));
      } else if (action === 'cancelled') {
        const updatedMeetings = meetings.map(meeting => {
          if (meeting.id === id) {
            return { ...meeting, status: 'cancelled' };
          }
          return meeting;
        });
        setMeetings(updatedMeetings);
        setStats(prev => ({ ...prev, cancelled: prev.cancelled + 1 }));
      }
    } catch (error) {
      console.error("Error handling meeting action:", error);
    } finally {
      setSelectedMeeting(null);
    }
  };

  const filteredMeetings = meetings.filter(meeting => {
    const now = new Date();
    const validSlots = meeting.slots.filter(slot => slot.date instanceof Date);

    if (validSlots.length === 0) return false;

    if (activeTab === 'upcoming') {
      return meeting.status === 'scheduled' && 
             validSlots.some(slot => slot.date > now);
    } else if (activeTab === 'past') {
      return meeting.status === 'completed' || 
             validSlots.every(slot => slot.date < now);
    } else if (activeTab === 'pending') {
      return meeting.status === 'pending' || 
             validSlots.some(slot => slot.status === 'pending');
    }
    return true;
  });

  // Calendar functions
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (calendarView === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderDayView = () => {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayMeetings = meetings.flatMap(meeting => 
      meeting.slots
        .filter(slot => slot.date >= dayStart && slot.date <= dayEnd)
        .map(slot => ({ ...meeting, slot }))
        .sort((a, b) => a.slot.date - b.slot.date));

    return (
      <DayView>
        <DayHeader>
          <DayTitle>
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </DayTitle>
        </DayHeader>
        <TimeSlots>
          {Array.from({ length: 24 }).map((_, hour) => {
            const hourStart = new Date(currentDate);
            hourStart.setHours(hour, 0, 0, 0);
            
            const hourEnd = new Date(currentDate);
            hourEnd.setHours(hour, 59, 59, 999);
            
            const hourMeetings = dayMeetings.filter(
              ({ slot }) => slot.date >= hourStart && slot.date <= hourEnd
            );

            return (
              <HourRow key={hour}>
                <HourLabel>
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </HourLabel>
                <HourEvents>
                  {hourMeetings.map((meeting, idx) => (
                    <CalendarEvent key={idx} status={meeting.status}>
                      <EventTime>
                        {meeting.slot.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </EventTime>
                      <EventTitle>{meeting.name}</EventTitle>
                      <EventCounterpart>{meeting.requesterName}</EventCounterpart>
                    </CalendarEvent>
                  ))}
                </HourEvents>
              </HourRow>
            );
          })}
        </TimeSlots>
      </DayView>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const weekMeetings = meetings.flatMap(meeting => 
      meeting.slots
        .filter(slot => slot.date >= startOfWeek && slot.date <= endOfWeek)
        .map(slot => ({ ...meeting, slot })));

    return (
      <WeekView>
        <WeekHeader>
          {Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <WeekdayHeader key={i} className={isToday ? 'today' : ''}>
                <WeekdayName>{day.toLocaleDateString('en-US', { weekday: 'short' })}</WeekdayName>
                <WeekdayDate>{day.getDate()}</WeekdayDate>
              </WeekdayHeader>
            );
          })}
        </WeekHeader>
        <WeekGrid>
          {Array.from({ length: 7 }).map((_, dayIdx) => {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + dayIdx);
            const isToday = day.toDateString() === new Date().toDateString();
            
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);
            
            const dayMeetings = weekMeetings
              .filter(({ slot }) => slot.date >= dayStart && slot.date <= dayEnd)
              .sort((a, b) => a.slot.date - b.slot.date);

            return (
              <WeekdayCell key={dayIdx} className={isToday ? 'today' : ''}>
                {dayMeetings.map((meeting, idx) => (
                  <CalendarEvent key={idx} status={meeting.status}>
                    <EventTime>
                      {meeting.slot.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
  };

  const renderMonthView = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    const nextMonthDays = 42 - (daysInMonth + startDay);
    
    const monthMeetings = meetings.flatMap(meeting => 
      meeting.slots.map(slot => ({ ...meeting, slot })));

    return (
      <MonthView>
        <MonthHeader>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day}>{day}</div>
          ))}
        </MonthHeader>
        <MonthGrid>
          {Array.from({ length: startDay }).map((_, i) => {
            const day = prevMonthDays - startDay + i + 1;
            return (
              <MonthDay key={`prev-${i}`} className="other-month">
                <DayNumber>{day}</DayNumber>
              </MonthDay>
            );
          })}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = date.toDateString() === new Date().toDateString();
            
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            
            const dayMeetings = monthMeetings
              .filter(({ slot }) => slot.date >= dayStart && slot.date <= dayEnd)
              .sort((a, b) => a.slot.date - b.slot.date);

            return (
              <MonthDay key={`current-${i}`} className={isToday ? 'today' : ''}>
                <DayNumber>{day}</DayNumber>
                <DayEvents>
                  {dayMeetings.map((meeting, idx) => (
                    <CalendarEvent 
                      key={idx} 
                      status={meeting.status}
                      title={`${meeting.name} with ${meeting.requesterName} at ${meeting.slot.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    >
                      <EventTime>
                        {meeting.slot.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </EventTime>
                      <EventTitle>{meeting.name}</EventTitle>
                    </CalendarEvent>
                  ))}
                </DayEvents>
              </MonthDay>
            );
          })}
          
          {Array.from({ length: nextMonthDays }).map((_, i) => {
            const day = i + 1;
            return (
              <MonthDay key={`next-${i}`} className="other-month">
                <DayNumber>{day}</DayNumber>
              </MonthDay>
            );
          })}
        </MonthGrid>
      </MonthView>
    );
  };

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
        <TabButton
          className={activeTab === 'upcoming' ? 'active' : ''}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </TabButton>
        <TabButton
          className={activeTab === 'pending' ? 'active' : ''}
          onClick={() => setActiveTab('pending')}
        >
          Pending
        </TabButton>
        <TabButton
          className={activeTab === 'past' ? 'active' : ''}
          onClick={() => setActiveTab('past')}
        >
          Past
        </TabButton>
      </Tabs>

      <TableContainer>
        <Table>
          <TableHead>
            <tr>
              <TableHeader>Meeting Purpose</TableHeader>
              <TableHeader>Requested By</TableHeader>
              <TableHeader>Requester Name</TableHeader>
              <TableHeader>Dates</TableHeader>
              <TableHeader>Location</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Action</TableHeader>
            </tr>
          </TableHead>
          <tbody>
            {filteredMeetings.length === 0 ? (
              <tr>
                <NoMeetings colSpan="7">
                  No {activeTab} meetings found
                </NoMeetings>
              </tr>
            ) : (
              filteredMeetings.map((meeting, index) => (
                <TableRow key={index} className={meeting.status}>
                  <TableCell>{meeting.name}</TableCell>
                  <TableCell>{meeting.requesterType}</TableCell>
                  <TableCell>{meeting.requesterName}</TableCell>
                  <TableCell>
                    <span style={{ color: colors.mediumBrown, fontWeight: 600 }}>
                      {meeting.slots.length} available slots
                    </span>
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
              ))
            )}
          </tbody>
        </Table>
      </TableContainer>

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <CreateEventForm
            onSubmit={handleCreateEvent}
            onCancel={() => setShowCreateModal(false)}
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
        <Modal onClose={() => setShowCalendar(false)}>
          <CalendarModal>
            <CalendarHeader>
              <CalendarNavigation>
                <NavButton onClick={() => navigateDate('prev')}>
                  <ChevronLeft size={20} />
                </NavButton>
                <CalendarTitle>
                  {calendarView === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  {calendarView === 'week' && `${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                    ${new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  {calendarView === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
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
              {calendarView === 'day' && renderDayView()}
              {calendarView === 'week' && renderWeekView()}
              {calendarView === 'month' && renderMonthView()}
            </CalendarContent>
          </CalendarModal>
        </Modal>
      )}
    </MeetingsContainer>
  );
};

export default Meetings;