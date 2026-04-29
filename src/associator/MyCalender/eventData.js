

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import './eventData.css';
import { onAuthStateChanged } from 'firebase/auth';

const EventData = () => {
  const [stats, setStats] = useState({
    created: 0,
    completed: 0,
    rescheduled: 0,
    cancelled: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const eventsQuery = query(
          collection(db, 'smeCalendarEvents'),
          where('funderId', '==', user.uid)
        );
        const querySnapshot = await getDocs(eventsQuery);

        let created = 0;
        let completed = 0;
        let rescheduled = 0;
        let cancelled = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const status = data.status?.toLowerCase() || '';
          
          if (status === 'scheduled') created++;
          if (status === 'completed') completed++;
          if (status === 'cancelled') cancelled++;
          if (data.createdAt && data.updatedAt && data.createdAt !== data.updatedAt) rescheduled++;
        });

        setStats({ created, completed, rescheduled, cancelled });
      } catch (error) {
        console.error('Error fetching event stats:', error);
      }
    });

    return () => unsubscribe();
  }, []);

   const cards = [
    {
      title: 'Events scheduled',
      value: stats.created,
      description: 'Scheduled events awaiting completion',
      className: 'created-card',
    },
    {
      title: 'Events Completed',
      value: stats.completed,
      description: 'Events successfully finished',
      className: 'completed-card',
    },
    {
      title: 'Events Cancelled',
      value: stats.cancelled,
      description: 'Events that got called off',
      className: 'cancelled-card',
    },
   
  ];


  return (
    <div className="event-data-container">
      <div className="event-data-pipeline">
        {cards.map((card, index) => (
          <div key={index} className={`pipeline-card ${card.className}`}>
            <div className="pipeline-value">{card.value}</div>
            <div className="pipeline-title">{card.title}</div>
            <div className="pipeline-tooltip">{card.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventData;