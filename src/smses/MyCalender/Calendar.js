"use client"

import React, { useState, useEffect } from 'react';
import EventData from './event-data';
import Meetings from './meetings';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    // Check initial state
    checkSidebarState()

    // Watch for changes
    const observer = new MutationObserver(checkSidebarState)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

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

  const getContainerStyles = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    padding: `70px 20px 20px ${isSidebarCollapsed ? "100px" : "270px"}`,
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
    backgroundColor: "#f8f9fa",
  })

  return (
    <div className="calendar-system" style={getContainerStyles()}>
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