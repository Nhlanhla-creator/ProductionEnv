"use client"

import React, { useState, useEffect } from 'react';
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
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
  const [matchesList, setMatchesList] = useState([]);

  useEffect(() => {
    const fetchAllRecipients = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      try {
        const recipientsMap = new Map();

        // 1. SUPPLIERS (from supplierApplications where I am the customer)
        const suppliersQuery = query(
          collection(db, "supplierApplications"),
          where("customerId", "==", user.uid)
        );
        const suppliersSnapshot = await getDocs(suppliersQuery);
        suppliersSnapshot.forEach(doc => {
          const data = doc.data();
          const id = data.supplierId;
          const name = data.supplierName;
          if (id && name && !recipientsMap.has(id)) {
            recipientsMap.set(id, { id, name });
          }
        });

        // 2. CUSTOMERS (from supplierApplications where I am the supplier)
        const customersQuery = query(
          collection(db, "supplierApplications"),
          where("supplierId", "==", user.uid)
        );
        const customersSnapshot = await getDocs(customersQuery);
        customersSnapshot.forEach(doc => {
          const data = doc.data();
          const id = data.customerId;
          const name = data.customerName;
          if (id && name && !recipientsMap.has(id)) {
            recipientsMap.set(id, { id, name });
          }
        });

        // 3. ADVISORS (from SmeAdvisorApplications where I am the SME)
        const advisorsQuery = query(
          collection(db, "SmeAdvisorApplications"),
          where("smeId", "==", user.uid)
        );
        const advisorsSnapshot = await getDocs(advisorsQuery);
        advisorsSnapshot.forEach(doc => {
          const data = doc.data();
          const id = data.advisorId;
          const name = data.advisorName;
          if (id && name && !recipientsMap.has(id)) {
            recipientsMap.set(id, { id, name });
          }
        });

        // 4. FUNDERS (from smeApplications where I am the SME)
        const fundersQuery = query(
          collection(db, "smeApplications"),
          where("smeId", "==", user.uid)
        );
        const fundersSnapshot = await getDocs(fundersQuery);
        fundersSnapshot.forEach(doc => {
          const data = doc.data();
          const id = data.funderId;
          const name = data.fundName;
          if (id && name && !recipientsMap.has(id)) {
            recipientsMap.set(id, { id, name });
          }
        });

        // 5. CATALYSTS (from smeCatalystApplications where I am the SME)
        const catalystsQuery = query(
          collection(db, "smeCatalystApplications"),
          where("smeId", "==", user.uid)
        );
        const catalystsSnapshot = await getDocs(catalystsQuery);
        catalystsSnapshot.forEach(doc => {
          const data = doc.data();
          const id = data.catalystId;
          const name = data.acceleratorName;
          if (id && name && !recipientsMap.has(id)) {
            recipientsMap.set(id, { id, name });
          }
        });

        // 6. INTERNS (from internshipApplications where I am the sponsor)
        const internsQuery = query(
          collection(db, "internshipApplications"),
          where("sponsorId", "==", user.uid)
        );
        const internsSnapshot = await getDocs(internsQuery);
        internsSnapshot.forEach(doc => {
          const data = doc.data();
          const id = data.applicantId;
          const name = data.internName;
          if (id && name && !recipientsMap.has(id)) {
            recipientsMap.set(id, { id, name });
          }
        });

        // 7. SPONSORS (from internshipApplications where I am the intern)
        const sponsorsQuery = query(
          collection(db, "internshipApplications"),
          where("applicantId", "==", user.uid)
        );
        const sponsorsSnapshot = await getDocs(sponsorsQuery);
        sponsorsSnapshot.forEach(doc => {
          const data = doc.data();
          const id = data.sponsorId;
          const name = data.sponsorName;
          if (id && name && !recipientsMap.has(id)) {
            recipientsMap.set(id, { id, name });
          }
        });

        setMatchesList(Array.from(recipientsMap.values()));
        console.log(`Loaded ${recipientsMap.size} unique recipients for calendar`);

      } catch (error) {
        console.error("Error fetching recipients for calendar:", error);
      }
    };

    fetchAllRecipients();
  }, []);

  // Rest of your existing useEffect for sample events...
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
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
    backgroundColor: "#f8f9fa",
  })

  return (
    <div className="calendar-system" style={getContainerStyles()}>
      <div className="dashboard-content">
        <EventData stats={stats} />
        
        <div className="dashboard-panels">
          <div className="meetings-panel">
            <Meetings 
              events={events} 
              setEvents={setEvents} 
              stats={stats} 
              setStats={setStats}
              matchesList={matchesList}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;