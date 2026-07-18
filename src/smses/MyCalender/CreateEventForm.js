import React, { useState, useEffect } from 'react';
import './CreateEventForm.css';

const CreateEventForm = ({ onSubmit, onCancel, previousRecipients = [] }) => {
  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '30',
    location: '',
    availability: 'Weekdays, 09:00 - 17:00',
    host: 'You',
    to: '',
    toName: '',
    toEmail: '',
    description: '',
  });

  const [showLocation, setShowLocation] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showHost, setShowHost] = useState(false);
  const [showRecipient, setShowRecipient] = useState(false);
  const [filteredRecipients, setFilteredRecipients] = useState([]);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);

  useEffect(() => {
    setFilteredRecipients(previousRecipients);
  }, [previousRecipients]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData({ ...eventData, [name]: value });
  };

  const selectRecipient = (recipient) => {
    setEventData({
      ...eventData,
      to: recipient.id,
      toName: recipient.name,
      toEmail: recipient.email || '',
    });
    setShowRecipientDropdown(false);
  };

  const handleSubmit = (e) => {
  e.preventDefault();
  
  // ✅ Log the values before submitting
  console.log("📤 Submitting event:", {
    title: eventData.title,
    date: eventData.date,
    time: eventData.time,
  });
  
  const fullEvent = {
    ...eventData,
    id: Date.now().toString(),
    status: 'pending',
    date: eventData.date,
    time: eventData.time,
  };
  onSubmit(fullEvent);
};

  return (
    <div className="create-event-form">
      <h2 className="heading">Create Event</h2>
      <form onSubmit={handleSubmit}>
        
        {/* Meeting Title */}
        <div className="form-group">
          <label>Meeting Title</label>
          <input
            type="text"
            name="title"
            placeholder="Enter meeting title"
            value={eventData.title}
            onChange={handleChange}
            required
          />
        </div>

        {/* To - Recipient */}
        <div className="form-group">
          <label>To</label>
          <div className="recipient-select" style={{ position: 'relative', width: '100%' }}>
            <select
              value={eventData.to}
              onChange={(e) => {
                const selectedId = e.target.value;
                const selectedRecipient = previousRecipients.find(r => r.id === selectedId);
                setEventData({
                  ...eventData,
                  to: selectedId,
                  toName: selectedRecipient?.name || '',
                  toEmail: selectedRecipient?.email || '',
                });
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                paddingRight: '2rem',
                borderRadius: '8px',
                border: '1px solid #D7CCC8',
                backgroundColor: '#FEFCFA',
                fontSize: '0.95rem',
                color: '#3E2723',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            >
              <option value="">Select a recipient...</option>
              {previousRecipients.map((recipient) => (
                <option key={recipient.id} value={recipient.id}>
                  {recipient.name}
                </option>
              ))}
            </select>
            <div style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#5a3921'
            }}>
              ▼
            </div>
          </div>
          <div className="tip">💡 Select who this meeting is for</div>
        </div>

        {/* Date, Time, Duration */}
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input 
              type="date" 
              name="date" 
              value={eventData.date} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input 
              type="time" 
              name="time" 
              value={eventData.time} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Duration</label>
            <select name="duration" value={eventData.duration} onChange={handleChange}>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>

        {/* Location - Collapsible */}
        <div className="collapsible">
          <div className="collapsible-header" onClick={() => setShowLocation(!showLocation)}>
            <span>📍 Location</span>
            <span>{showLocation ? '▲' : '▼'}</span>
          </div>
          {showLocation && (
            <div className="form-group">
              <input
                type="text"
                name="location"
                placeholder="Enter location (e.g., Zoom, Conference Room A)"
                value={eventData.location}
                onChange={handleChange}
              />
              <div className="tip">💡 Meetings with locations are more likely to start on time!</div>
            </div>
          )}
        </div>

        {/* Description - Collapsible */}
        <div className="collapsible">
          <div className="collapsible-header" onClick={() => setShowAvailability(!showAvailability)}>
            <span>📝 Description</span>
            <span>{showAvailability ? '▲' : '▼'}</span>
          </div>
          {showAvailability && (
            <div className="form-group">
              <textarea
                name="description"
                placeholder="Add meeting description or agenda..."
                value={eventData.description}
                onChange={handleChange}
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D7CCC8',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
          )}
        </div>

        {/* Host - Collapsible */}
        <div className="collapsible">
          <div className="collapsible-header" onClick={() => setShowHost(!showHost)}>
            <span>👤 Host</span>
            <span>{showHost ? '▲' : '▼'}</span>
          </div>
          {showHost && (
            <div className="form-group">
              <input
                type="text"
                name="host"
                value={eventData.host}
                onChange={handleChange}
              />
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
          <button type="submit" className="submit-btn">💾 Save Event</button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventForm;