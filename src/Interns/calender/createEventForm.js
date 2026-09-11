import React from 'react';
import './eventData.css';

const EventData = ({ stats = { created: 0, completed: 0, rescheduled: 0, cancelled: 0 } }) => {
  const cards = [
    {
      title: 'Events scheduled',
      value: stats.created || 0,
      description: 'Scheduled events awaiting completion',
      className: 'created-card',
    },
    {
      title: 'Events Completed',
      value: stats.completed || 0,
      description: 'Events successfully finished',
      className: 'completed-card',
    },
    {
      title: 'Events Cancelled',
      value: stats.cancelled || 0,
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