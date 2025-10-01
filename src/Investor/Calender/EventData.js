import React from 'react';
import './EventData.css';

const EventData = ({ meetings = [] }) => {
  const stats = {
    created: meetings?.filter(m => m?.status === 'scheduled')?.length || 0,
    completed: meetings?.filter(m => m?.status === 'completed')?.length || 0,
    cancelled: meetings?.filter(m => m?.status === 'cancelled')?.length || 0,
    rescheduled: meetings?.filter(m => 
      m?.createdAt && m?.updatedAt && 
      new Date(m.createdAt).getTime() !== new Date(m.updatedAt).getTime()
    )?.length || 0,
  };

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
    {
      title: 'Events Rescheduled',
      value: stats.rescheduled,
      description: 'Events that were rescheduled',
      className: 'rescheduled-card',
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