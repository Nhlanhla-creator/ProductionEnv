import React, { useState, useEffect } from 'react';
import EventData from './EventData';
import Meetings from './advisor-calendar';
import './Calendar.css';

const Calendar = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    created: 0,
    completed: 0,
    rescheduled: 0,
    cancelled: 0
  });

  useEffect(() => {
    const sampleEvents = [
      {
        id: '1',
        title: 'Team Meeting',
        date: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
        time: '14:00',
        duration: '60',
        location: 'Conference Room A',
        description: 'Weekly team sync',
        host: 'You',
        invitees: ['john@example.com', 'jane@example.com'],
        status: 'pending'
      },
      {
        id: '2',
        title: 'Client Call',
        date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
        time: '10:30',
        duration: '30',
        location: 'Zoom',
        description: 'Discuss project requirements',
        host: 'You',
        invitees: ['client@example.com'],
        status: 'pending'
      }
    ];

    setEvents(sampleEvents);
    setStats({
      created: 2,
      completed: 0,
      rescheduled: 0,
      cancelled: 0
    });
  }, []);

  return (
    <div className="calendar-system">
      {/* Main Dashboard */}
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