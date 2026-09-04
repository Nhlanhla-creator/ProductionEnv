import React from 'react';
import './EventData.css';

const EventData = ({ meetings = [], stats = null }) => {
  // Use provided stats or calculate from meetings
  const calculatedStats = stats || {
    created: meetings?.filter(m => m?.status === 'pending' || m?.status === 'scheduled')?.length || 0,
    scheduled: meetings?.filter(m => m?.status === 'scheduled')?.length || 0,
    completed: meetings?.filter(m => m?.status === 'completed')?.length || 0,
    cancelled: meetings?.filter(m => m?.status === 'cancelled')?.length || 0,
  };

  const cards = [
    {
      title: 'Events Created',
      value: calculatedStats.created || 0,
      description: 'Total events created',
      className: 'created-card',
    },
    {
      title: 'Events Scheduled',
      value: calculatedStats.scheduled || 0,
      description: 'Scheduled events awaiting completion',
      className: 'scheduled-card',
    },
    {
      title: 'Events Completed',
      value: calculatedStats.completed || 0,
      description: 'Events successfully finished',
      className: 'completed-card',
    },
    {
      title: 'Events Cancelled',
      value: calculatedStats.cancelled || 0,
      description: 'Events that got called off',
      className: 'cancelled-card',
    },
  ];

  return (
    <div className="event-data-container">
      <h2 className="event-data-title">Event Data</h2>
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