"use client"

import React, { useState, useEffect } from 'react';
import Meetings from './Meetings';
import './Calendar.css';
import { db } from '../../firebaseConfig'
import Upsell from '../../components/Upsell/Upsell'
import useSubscriptionPlan from "../../hooks/useSubscriptionPlan" 

const InvestorCalendar = () => {
  const [events, setEvents] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { currentPlan, subscriptionLoading } = useSubscriptionPlan()

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
    // Sample data initialization (deferred until subscription check completes)
    if (subscriptionLoading) return

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
  }, [subscriptionLoading]);



  const getContainerStyles = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    padding: `72px 20px 20px ${isSidebarCollapsed ? "80px" : "280px"}`,
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
    backgroundColor: "#f8f9fa",
  })

  if (subscriptionLoading) {
    return (
      <div style={getContainerStyles()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center", color: "#6d4c41" }}>
            <h2>Checking subscription...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (currentPlan === 'basic') {
    return (
      <Upsell
        title={"Calendar"}
        subtitle={"Schedule meetings and manage events. Available on Engage & Partner plans."}
        features={["Create & manage meetings","Send invitations & track RSVPs","Sync with external calendars","Meeting notes & attachments"]}
        variant={"center"}
        expandedWidth={280}
        collapsedWidth={80}
        plans={["Engage", "Partner"]}
        upgradeMessage={"Upgrade to Engage or Partner to enable the calendar with meeting scheduling, RSVPs, and external calendar sync."}
        primaryLabel={"View Available Plans"}
      />
    )
  }

  return (
    <div className="calendar-system" style={getContainerStyles()}>
      <div className="dashboard-content">
        <div className="dashboard-panels">
          <div className="meetings-panel">
            <Meetings events={events} setEvents={setEvents} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorCalendar;