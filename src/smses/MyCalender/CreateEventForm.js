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

  const handleRecipientInput = (e) => {
    const inputValue = e.target.value;
    setEventData(prev => ({
      ...prev,
      toName: inputValue,
      to: '' // Clear the ID when typing manually
    }));

    // Filter recipients based on input
    if (inputValue.length > 0) {
      const filtered = previousRecipients.filter(recipient =>
        recipient.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredRecipients(filtered);
    } else {
      setFilteredRecipients(previousRecipients);
    }
    setShowRecipientDropdown(true);
  };

  const selectRecipient = (recipient) => {
    setEventData({
      ...eventData,
      to: recipient.id,
      toName: recipient.name
    });
    setShowRecipientDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullEvent = {
      ...eventData,
      id: Date.now().toString(),
      status: 'pending',
      date: `${eventData.date}T${eventData.time}`,
    };
    onSubmit(fullEvent);
  };

  return (
    <div className="create-event-form">
      <h2 className="heading">Create Event</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Meeting Title</label>
          <input
            type="text"
            name="title"
            value={eventData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="collapsible">
          <div className="collapsible-header" onClick={() => setShowRecipient(!showRecipient)}>
            <span>To</span>
            <span>{showRecipient ? '▲' : '▼'}</span>
          </div>
          {showRecipient && (
            <div className="form-group recipient-group">
              <div className="recipient-select-container">
                <input
                  type="text"
                  value={eventData.toName}
                  onChange={handleRecipientInput}
                  onFocus={() => setShowRecipientDropdown(true)}
                  placeholder="Search or select recipient"
                  className="recipient-input"
                />
                {showRecipientDropdown && filteredRecipients.length > 0 && (
                  <div className="recipient-dropdown">
                    {filteredRecipients.map((recipient, index) => (
                      <div
                        key={index}
                        className="recipient-option"
                        onClick={() => selectRecipient(recipient)}
                      >
                        {recipient.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="tip">💡 Select who this meeting is for</div>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" name="date" value={eventData.date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input type="time" name="time" value={eventData.time} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Duration</label>
            <select name="duration" value={eventData.duration} onChange={handleChange}>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="collapsible">
          <div className="collapsible-header" onClick={() => setShowLocation(!showLocation)}>
            <span>Location</span>
            <span>{showLocation ? '▲' : '▼'}</span>
          </div>
          {showLocation && (
            <div className="form-group">
              <input
                type="text"
                name="location"
                placeholder="Enter location"
                value={eventData.location}
                onChange={handleChange}
              />
              <div className="tip">💡 Meetings with locations are more likely to start on time!</div>
            </div>
          )}
        </div>

        <div className="collapsible">
          <div className="collapsible-header" onClick={() => setShowAvailability(!showAvailability)}>
            <span>Availability</span>
            <span>{showAvailability ? '▲' : '▼'}</span>
          </div>
          {showAvailability && (
            <div className="form-group">
              <p>Available: {eventData.availability}</p>
            </div>
          )}
        </div>

        <div className="collapsible">
          <div className="collapsible-header" onClick={() => setShowHost(!showHost)}>
            <span>Host</span>
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

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
          <button type="submit" className="submit-btn">Create Event</button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventForm;