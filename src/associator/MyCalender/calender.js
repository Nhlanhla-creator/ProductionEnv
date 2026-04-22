"use client";
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';

const AssociatorCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');

  const events = [
    { id: 1, title: 'Networking Event', date: '2024-12-15', time: '14:00', type: 'meeting' },
    { id: 2, title: 'Partnership Call', date: '2024-12-18', time: '10:30', type: 'call' },
    { id: 3, title: 'Webinar: Ecosystem Growth', date: '2024-12-20', time: '15:00', type: 'webinar' },
  ];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === dateStr);
      days.push(
        <div key={i} className="calendar-day">
          <span className="day-number">{i}</span>
          {dayEvents.map(event => (
            <div key={event.id} className={`event-indicator ${event.type}`}>
              {event.title}
            </div>
          ))}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="associator-calendar">
      <div className="calendar-header">
        <div className="calendar-title">
          <h1>Calendar</h1>
          <p>Manage your schedule and events</p>
        </div>
        <button className="create-event-btn">
          <Plus size={16} />
          Create Event
        </button>
      </div>

      <div className="calendar-controls">
        <div className="view-controls">
          <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Month</button>
          <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Week</button>
          <button className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>Day</button>
        </div>
        <div className="date-controls">
          <button onClick={prevMonth}><ChevronLeft size={20} /></button>
          <span>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button onClick={nextMonth}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-days">
          {renderCalendar()}
        </div>
      </div>

      <div className="upcoming-events">
        <h2>Upcoming Events</h2>
        <div className="events-list">
          {events.map(event => (
            <div key={event.id} className="event-card">
              <div className="event-date">
                <CalendarIcon size={20} />
                <span>{event.date}</span>
              </div>
              <div className="event-details">
                <h4>{event.title}</h4>
                <p>{event.time}</p>
              </div>
              <button className="event-action">View</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssociatorCalendar;