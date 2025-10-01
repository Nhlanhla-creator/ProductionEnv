import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Eye, ChevronLeft, ChevronRight, X, Clock, Check } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import Modal from './modal';
import CreateEventForm from './createEventForm';
import MeetingDetails from './meetingDetails';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';

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
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'declined': return '#F44336';
      case 'completed': return '#2196F3';
      default: return '#9E9E9E';
    }
  }};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;

  &.accept {
    background-color: #4CAF50;
    &:hover {
      background-color: #3e8e41;
      transform: scale(1.1);
    }
  }

  &.decline {
    background-color: #F44336;
    &:hover {
      background-color: #d32f2f;
      transform: scale(1.1);
    }
  }

  &.view {
    background: linear-gradient(135deg, ${colors.mediumBrown}, ${colors.darkBrown});
    &:hover {
      background: linear-gradient(135deg, ${colors.accentBrown}, ${colors.mediumBrown});
      transform: scale(1.1);
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const NewBadge = styled.span`
  background-color: #FF9800;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
  text-transform: uppercase;
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
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'declined': return '#F44336';
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

const EventSponsor = styled.div`
  font-size: 0.7rem;
  opacity: 0.9;
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

const Meetings = ({ stats, setStats }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarView, setCalendarView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sponsorNames, setSponsorNames] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchSponsorName = async (sponsorId) => {
    try {
      if (!sponsorId) return 'Program Sponsor';
      if (sponsorNames[sponsorId]) return sponsorNames[sponsorId];

      const sponsorRef = doc(db, "sponsorProfiles", sponsorId);
      const sponsorSnap = await getDoc(sponsorRef);

      if (sponsorSnap.exists()) {
        const data = sponsorSnap.data();
        const name = data?.organizationName || data?.contactName || 'Program Sponsor';
        setSponsorNames(prev => ({ ...prev, [sponsorId]: name }));
        return name;
      }
      return 'Program Sponsor';
    } catch (err) {
      console.error('Error fetching sponsor name:', err);
      return 'Program Sponsor';
    }
  };

  const getRequesterInfo = (meeting) => {
    // For interns, the people they interact with are SME, Program Sponsor, and other Interns
    if (meeting.sponsorId) {
      return {
        requestedBy: 'Program Sponsor',
        requesterName: meeting.sponsorName || 'Program Sponsor'
      };
    }
    
    // If it's from an SME (could be determined by other fields)
    if (meeting.smeId || meeting.type === 'sme') {
      return {
        requestedBy: 'SME',
        requesterName: meeting.smeName || 'SME'
      };
    }
    
    // If it's from another intern
    if (meeting.internId || meeting.type === 'intern') {
      return {
        requestedBy: 'Intern',
        requesterName: meeting.internName || 'Intern'
      };
    }
    
    // Default fallback
    return {
      requestedBy: 'Program Sponsor',
      requesterName: meeting.sponsorName || 'Program Sponsor'
    };
  };

  useEffect(() => {
    const unsubscribeAuth = getAuth().onAuthStateChanged(async (user) => {
      if (!user) return;

      // Query for calendar events first
      const q = query(
        collection(db, "internCalendarEvents"),
        where("internId", "==", user.uid)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const meetingsData = await Promise.all(snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const scheduledDate = data.scheduledDate?.toDate ? data.scheduledDate.toDate() : 
                            (data.scheduledDate ? new Date(data.scheduledDate) : null);
          const sponsorName = await fetchSponsorName(data.sponsorId);
          
          return {
            id: doc.id,
            title: data.title || `Meeting with ${sponsorName}`,
            sponsorName,
            sponsorId: data.sponsorId,
            date: scheduledDate,
            timeSlot: data.scheduledTimeSlot || { 
              start: "09:00", 
              end: "17:00",
              timeZone: "Africa/Johannesburg"
            },
            location: data.location || "Virtual",
            status: data.status || "confirmed",
            notes: data.notes || "",
            applicationId: data.applicationId,
            type: "event",
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
          };
        }));

        // Now query for applications with available dates
        const applicationsQuery = query(
          collection(db, "internshipApplications"),
          where("applicantId", "==", user.uid),
          where("status", "in", ["Contacted/Interview", "Interview Scheduled"])
        );

        const appUnsubscribe = onSnapshot(applicationsQuery, async (appSnapshot) => {
          const availabilityMap = new Map();
          
          for (const doc of appSnapshot.docs) {
            const data = doc.data();
            const sponsorName = await fetchSponsorName(data.sponsorId);
            
            // Only process if we don't already have a scheduled meeting with this sponsor
            const hasScheduledMeeting = meetingsData.some(
              m => m.sponsorId === data.sponsorId && m.status === 'confirmed'
            );
            
            if (!hasScheduledMeeting && data.availableDates && data.availableDates.length > 0) {
              availabilityMap.set(data.sponsorId, {
                ...data,
                docId: doc.id,
                sponsorName
              });
            }
          }

          // Convert the map to availability meetings
          const availabilityMeetings = [];
          for (const [sponsorId, appData] of availabilityMap) {
            for (const availability of appData.availableDates) {
              try {
                const date = new Date(availability.date);
                
                if (availability.timeSlots && availability.timeSlots.length > 0) {
                  for (const timeSlot of availability.timeSlots) {
                    availabilityMeetings.push({
                      id: `${appData.docId}-${availability.date}-${timeSlot.start}-${timeSlot.end}`,
                      title: `Interview with ${appData.sponsorName}`,
                      sponsorName: appData.sponsorName,
                      sponsorId: appData.sponsorId,
                      date,
                      timeSlot,
                      timeZone: availability.timeZone || "Africa/Johannesburg",
                      location: appData.interviewDetails?.location || "Virtual",
                      status: "pending",
                      applicationId: appData.docId,
                      type: "availability",
                      allSlots: appData.availableDates.map(slot => ({
                        date: new Date(slot.date),
                        timeSlots: slot.timeSlots || [{ 
                          start: "09:00", 
                          end: "17:00",
                          timeZone: slot.timeZone || "Africa/Johannesburg"
                        }],
                        timeZone: slot.timeZone || "Africa/Johannesburg",
                        status: slot.status || "available"
                      }))
                    });
                  }
                } else {
                  availabilityMeetings.push({
                    id: `${appData.docId}-${availability.date}`,
                    title: `Interview with ${appData.sponsorName}`,
                    sponsorName: appData.sponsorName,
                    sponsorId: appData.sponsorId,
                    date,
                    timeSlot: { 
                      start: "09:00", 
                      end: "17:00",
                      timeZone: availability.timeZone || "Africa/Johannesburg"
                    },
                    location: appData.interviewDetails?.location || "Virtual",
                    status: "pending",
                    applicationId: appData.docId,
                    type: "availability",
                    allSlots: appData.availableDates.map(slot => ({
                      date: new Date(slot.date),
                      timeSlots: slot.timeSlots || [{ 
                        start: "09:00", 
                        end: "17:00",
                        timeZone: slot.timeZone || "Africa/Johannesburg"
                      }],
                      timeZone: slot.timeZone || "Africa/Johannesburg",
                      status: slot.status || "available"
                    }))
                  });
                }
              } catch (error) {
                console.error("Error processing availability:", error);
              }
            }
          }

          // Combine both scheduled meetings and availability slots
          const allMeetings = [...meetingsData, ...availabilityMeetings]
            .filter(meeting => meeting.date !== null)
            .sort((a, b) => a.date - b.date);

          setMeetings(allMeetings);
          setLoading(false);
        });

        return () => appUnsubscribe();
      });

      return () => unsubscribe();
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
      setIsProcessing(true);
      const meeting = meetings.find(m => m.id === id);
      
      if (action === 'accept') {
        if (meeting?.type === 'availability') {
          // Create a new calendar event for accepted availability
          const newEvent = {
            title: meeting.title,
            internId: getAuth().currentUser.uid,
            sponsorId: meeting.sponsorId,
            applicationId: meeting.applicationId,
            scheduledDate: meeting.date.toISOString(),
            scheduledTimeSlot: meeting.timeSlot,
            location: meeting.location,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await addDoc(collection(db, "internCalendarEvents"), newEvent);
          
          // Update the application status
          await updateDoc(doc(db, "internshipApplications", meeting.applicationId), {
            'interviewDetails.date': meeting.date.toISOString(),
            'interviewDetails.time': meeting.timeSlot.start,
            'interviewDetails.location': meeting.location,
            'status': 'Interview Scheduled',
            'updatedAt': new Date().toISOString()
          });
        } else {
          // Update existing calendar event
          await updateDoc(doc(db, "internCalendarEvents", id), {
            status: 'confirmed',
            updatedAt: new Date().toISOString()
          });
        }
        
        setMeetings(prev => prev.map(m => 
          m.id === id ? { ...m, status: 'confirmed' } : 
          m.sponsorId === meeting.sponsorId && m.type === 'availability' ? { ...m, status: 'declined' } : m
        ));
      } 
      else if (action === 'decline') {
        if (meeting.type === 'availability') {
          // Just update the application status
          await updateDoc(doc(db, "internshipApplications", meeting.applicationId), {
            'status': 'Interview Declined',
            'updatedAt': new Date().toISOString()
          });
        } else {
          // Update calendar event
          await updateDoc(doc(db, "internCalendarEvents", id), {
            status: 'declined',
            updatedAt: new Date().toISOString()
          });
        }
        
        setMeetings(prev => prev.map(m => 
          m.id === id ? { ...m, status: 'declined' } : m
        ));
      }

      setSelectedMeeting(null);
    } catch (error) {
      console.error("Error updating meeting status:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredMeetings = meetings.filter(meeting => {
    const meetingDate = meeting.date;
    const now = new Date();

    if (activeTab === 'upcoming') {
      return meetingDate > now && (meeting.status === 'confirmed' || meeting.status === 'scheduled');
    } else if (activeTab === 'pending') {
      return meeting.status === 'pending';
    } else if (activeTab === 'past') {
      return meetingDate < now;
    }
    return true;
  });

  const formatMeetingTime = (meeting) => {
    if (!meeting.date) return "No date scheduled";
    
    const dateStr = meeting.date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    
    const timeStr = meeting.timeSlot ? 
      `${meeting.timeSlot.start} - ${meeting.timeSlot.end}` : 
      "No time specified";
    
    return `${dateStr} at ${timeStr} (${meeting.timeSlot?.timeZone || meeting.timeZone || "Africa/Johannesburg"})`;
  };

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
    
    const dayMeetings = meetings.filter(meeting => 
      meeting.date >= dayStart && meeting.date <= dayEnd
    ).sort((a, b) => a.date - b.date);

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
              meeting => meeting.date >= hourStart && meeting.date <= hourEnd
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
                        {meeting.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </EventTime>
                      <EventTitle>{meeting.title}</EventTitle>
                      <EventSponsor>{meeting.sponsorName}</EventSponsor>
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
    
    const weekMeetings = meetings.filter(meeting => 
      meeting.date >= startOfWeek && meeting.date <= endOfWeek
    );

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
              .filter(meeting => meeting.date >= dayStart && meeting.date <= dayEnd)
              .sort((a, b) => a.date - b.date);

            return (
              <WeekdayCell key={dayIdx} className={isToday ? 'today' : ''}>
                {dayMeetings.map((meeting, idx) => (
                  <CalendarEvent key={idx} status={meeting.status}>
                    <EventTime>
                      {meeting.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
  };

  const renderMonthView = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    const nextMonthDays = 42 - (daysInMonth + startDay);
    
    const monthMeetings = meetings;

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
              .filter(meeting => meeting.date >= dayStart && meeting.date <= dayEnd)
              .sort((a, b) => a.date - b.date);

            return (
              <MonthDay key={`current-${i}`} className={isToday ? 'today' : ''}>
                <DayNumber>{day}</DayNumber>
                <DayEvents>
                  {dayMeetings.map((meeting, idx) => (
                    <CalendarEvent 
                      key={idx} 
                      status={meeting.status}
                      title={`${meeting.title} with ${meeting.sponsorName} at ${meeting.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    >
                      <EventTime>
                        {meeting.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </EventTime>
                      <EventTitle>{meeting.title}</EventTitle>
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
        <Title>My Meeting Invitations</Title>
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
              <TableHeader>Date & Time</TableHeader>
              <TableHeader>Location</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Actions</TableHeader>
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
              filteredMeetings.map((meeting, index) => {
                const requesterInfo = getRequesterInfo(meeting);
                return (
                  <TableRow key={index} className={meeting.status}>
                    <TableCell>
                      {meeting.title}
                      {meeting.type === 'availability' && (
                        <NewBadge>New</NewBadge>
                      )}
                    </TableCell>
                    <TableCell>{requesterInfo.requestedBy}</TableCell>
                    <TableCell>{requesterInfo.requesterName}</TableCell>
                    <TableCell>{formatMeetingTime(meeting)}</TableCell>
                    <TableCell>{meeting.location}</TableCell>
                    <TableCell>
                      <StatusBadge status={meeting.status}>
                        {meeting.status}
                        {meeting.status === 'pending' && <Clock size={14} />}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <ActionButtons>
                        <ActionButton 
                          className="view" 
                          onClick={() => setSelectedMeeting(meeting)}
                        >
                          <Eye size={16} />
                        </ActionButton>
                        {meeting.status === 'pending' && (
                          <>
                            <ActionButton 
                              className="accept" 
                              onClick={() => handleMeetingAction(meeting.id, 'accept')}
                            >
                              <Check size={16} />
                            </ActionButton>
                            <ActionButton 
                              className="decline" 
                              onClick={() => handleMeetingAction(meeting.id, 'decline')}
                            >
                              <X size={16} />
                            </ActionButton>
                          </>
                        )}
                      </ActionButtons>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </tbody>
        </Table>
      </TableContainer>

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <CreateEventForm
            onSubmit={handleCreateEvent}
            onCancel={() => setShowCreateModal(false)}
            isIntern="true"
          />
        </Modal>
      )}

      {selectedMeeting && (
        <Modal onClose={() => setSelectedMeeting(null)}>
          <MeetingDetails
            meeting={selectedMeeting}
            onAction={handleMeetingAction}
            onClose={() => setSelectedMeeting(null)}
            isIntern="true"
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