"use client"

import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import './Availability.css';

const Availability = ({ onSubmit, workingHours: existingHours, showAsCard = false, onEditClick }) => {
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [availabilities, setAvailabilities] = useState([]);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [tempDates, setTempDates] = useState([]);
  const [editingDate, setEditingDate] = useState(null);
  const [timeSlot, setTimeSlot] = useState({ start: '09:00', end: '17:00' });

  // Load existing hours if provided
  useEffect(() => {
    if (existingHours) {
      if (existingHours.dates) {
        setAvailabilities(existingHours.dates.map(item => ({
          ...item,
          date: new Date(item.date)
        })));
      }
      if (existingHours.timeZone) {
        setTimeZone(existingHours.timeZone);
      }
      if (existingHours.times) {
        setTimeSlot(existingHours.times);
      }
    }
  }, [existingHours]);

  const handleDateSelect = (dates) => {
    setTempDates(dates || []);
  };

  const handleTimeChange = (field, value) => {
    setTimeSlot(prev => ({ ...prev, [field]: value }));
  };

  const saveSelectedDates = () => {
    const newAvailabilities = [
      ...availabilities,
      ...tempDates
        .filter(date => !availabilities.some(a => a.date.getTime() === date.getTime()))
        .map(date => ({
          date,
          timeSlots: [{ ...timeSlot }],
          timeZone
        }))
    ];
    
    setAvailabilities(newAvailabilities);
    setTempDates([]);
    setShowCalendarModal(false);
  };

  const addTimeSlot = (date) => {
    setAvailabilities(prev =>
      prev.map(item =>
        item.date.getTime() === date.getTime()
          ? { ...item, timeSlots: [...item.timeSlots, { start: '09:00', end: '17:00' }] }
          : item
      )
    );
  };

  const updateTimeSlot = (date, slotIndex, field, value) => {
    setAvailabilities(prev =>
      prev.map(item =>
        item.date.getTime() === date.getTime()
          ? {
              ...item,
              timeSlots: item.timeSlots.map((slot, idx) =>
                idx === slotIndex ? { ...slot, [field]: value } : slot
              )
            }
          : item
      )
    );
  };

  const removeTimeSlot = (date, slotIndex) => {
    setAvailabilities(prev =>
      prev.map(item =>
        item.date.getTime() === date.getTime()
          ? {
              ...item,
              timeSlots: item.timeSlots.filter((_, idx) => idx !== slotIndex)
            }
          : item
      )
    );
  };

  const removeAvailability = (dateToRemove) => {
    setAvailabilities(prev =>
      prev.filter(item => item.date.getTime() !== dateToRemove.getTime())
    );
  };

  const editAvailability = (date) => {
    const availability = availabilities.find(a => a.date.getTime() === date.getTime());
    if (availability) {
      setTimeSlot(availability.timeSlots[0]);
      setEditingDate(date);
      setShowCalendarModal(true);
    }
  };

  const handleSave = () => {
    onSubmit({ 
      dates: availabilities,
      times: timeSlot,
      timeZone 
    });
  };

  // Card View for Dashboard
  if (showAsCard) {
    return (
      <div className="availability-card">
        <div className="card-header">
          <h3>Your Availability</h3>
          <button onClick={onEditClick} className="edit-button">
            Edit
          </button>
        </div>
        {availabilities.length > 0 ? (
          <div className="availability-summary">
            {availabilities.slice(0, 3).map((availability, index) => (
              <div key={index} className="availability-item">
                <span className="date">
                  {availability.date.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
                <span className="time">
                  {availability.timeSlots[0].start} - {availability.timeSlots[0].end}
                </span>
              </div>
            ))}
            {availabilities.length > 3 && (
              <div className="more-dates">+{availabilities.length - 3} more dates</div>
            )}
          </div>
        ) : (
          <p className="no-availability">No availability set</p>
        )}
      </div>
    );
  }

  // Full Editor View
  return (
    <div className="availability-schedule">
      <h2>Set Your Availability</h2>
      <p>Select dates and specify your available time slots</p>

      <div className="timezone-selector">
        <label>Time Zone:</label>
        <select value={timeZone} onChange={(e) => setTimeZone(e.target.value)}>
          {Intl.supportedValuesOf('timeZone').map((zone) => (
            <option key={zone} value={zone}>{zone}</option>
          ))}
        </select>
      </div>

      <div className="date-selection">
        <button 
          className="select-dates-btn" 
          onClick={() => {
            setTempDates([]);
            setEditingDate(null);
            setShowCalendarModal(true);
          }}
        >
          + Add Availability Dates
        </button>
      </div>

      {availabilities.length > 0 && (
        <div className="availability-list">
          <h3>Your Availability</h3>
          {availabilities
            .sort((a, b) => a.date - b.date)
            .map((availability, index) => (
              <div key={index} className="availability-item">
                <div className="availability-header">
                  <span className="availability-date">
                    {availability.date.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <div className="availability-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => editAvailability(availability.date)}
                    >
                      Edit
                    </button>
                    <button 
                      className="remove-btn"
                      onClick={() => removeAvailability(availability.date)}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="time-slots">
                  {availability.timeSlots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="time-slot">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => 
                          updateTimeSlot(availability.date, slotIndex, 'start', e.target.value)
                        }
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => 
                          updateTimeSlot(availability.date, slotIndex, 'end', e.target.value)
                        }
                      />
                      {availability.timeSlots.length > 1 && (
                        <button
                          className="remove-slot-btn"
                          onClick={() => removeTimeSlot(availability.date, slotIndex)}
                        >
                          ×
                        </button>
                      )}
                      {slotIndex === availability.timeSlots.length - 1 && (
                        <button
                          className="add-slot-btn"
                          onClick={() => addTimeSlot(availability.date)}
                        >
                          + Add Slot
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {showCalendarModal && (
        <div className="modal-overlay" onClick={() => setShowCalendarModal(false)}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingDate ? 'Edit Availability Date' : 'Select Available Dates'}</h2>
            <div className="time-selection-modal">
              <label>Available Time:</label>
              <div className="time-inputs">
                <input
                  type="time"
                  value={timeSlot.start}
                  onChange={(e) => handleTimeChange('start', e.target.value)}
                />
                <span>to</span>
                <input
                  type="time"
                  value={timeSlot.end}
                  onChange={(e) => handleTimeChange('end', e.target.value)}
                />
              </div>
            </div>
            <DayPicker
              mode="multiple"
              selected={editingDate ? [editingDate] : tempDates}
              onSelect={handleDateSelect}
              className="brown-calendar"
            />
            <div className="modal-actions">
              <button onClick={() => setShowCalendarModal(false)}>Cancel</button>
              <button
                className="apply-btn"
                onClick={saveSelectedDates}
                disabled={!tempDates.length && !editingDate}
              >
                {editingDate ? 'Update' : 'Save Dates'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="save-button-container">
        <button 
          className="save-btn"
          onClick={handleSave}
          disabled={availabilities.length === 0}
        >
          Save All Availability
        </button>
      </div>
    </div>
  );
};

export default Availability;