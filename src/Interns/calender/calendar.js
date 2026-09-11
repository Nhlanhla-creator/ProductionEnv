import React, { useState, useEffect } from 'react';
import EventData from './eventData';
import Meetings from './internCalendar';
import './calendar.css';
import { getAuth } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    created: 0,
    completed: 0,
    rescheduled: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Listen to real events from Firebase
    const q = query(
      collection(db, "internCalendarEvents"),
      where("internId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
      
      // Update stats
      const created = eventsData.length;
      const completed = eventsData.filter(e => e.status === 'completed' || e.status === 'confirmed').length;
      const cancelled = eventsData.filter(e => e.status === 'cancelled' || e.status === 'declined').length;
      const rescheduled = eventsData.filter(e => e.rescheduled === true).length;
      
      setStats({ created, completed, rescheduled, cancelled });
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="calendar-system" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="calendar-system">
      <div className="dashboard-content">
        <EventData stats={stats} />
        <div className="dashboard-panels">
          <div className="meetings-panel">
            <Meetings 
              events={events} 
              setEvents={setEvents} 
              stats={stats} 
              setStats={setStats} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;