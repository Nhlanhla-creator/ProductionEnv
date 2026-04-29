import React, { useState, useEffect } from 'react';

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.recipient-group')) {
        setShowRecipientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const styles = {
    createEventForm: {
      background: 'linear-gradient(135deg, #EFEBE9, #D7CCC8)',
      borderRadius: '20px',
      padding: '30px',
      maxWidth: '600px',
      margin: '0 auto',
      boxShadow: '0 20px 60px rgba(58, 35, 20, 0.15), 0 8px 25px rgba(92, 57, 33, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      border: '1px solid rgba(140, 104, 66, 0.2)'
    },
    heading: {
      color: '#3E2723',
      fontSize: '1.8rem',
      fontWeight: '800',
      margin: '0 0 30px 0',
      textShadow: '0 2px 4px rgba(58, 35, 20, 0.1)',
      letterSpacing: '-1px',
      textAlign: 'center'
    },
    formGroup: {
      marginBottom: '20px'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '15px',
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      color: '#3E2723',
      fontWeight: '600',
      fontSize: '0.95rem'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid rgba(140, 104, 66, 0.2)',
      borderRadius: '12px',
      background: 'rgba(245, 240, 232, 0.6)',
      color: '#3E2723',
      fontSize: '1rem',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid rgba(140, 104, 66, 0.2)',
      borderRadius: '12px',
      background: 'rgba(245, 240, 232, 0.6)',
      color: '#3E2723',
      fontSize: '1rem',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      boxSizing: 'border-box'
    },
    collapsible: {
      marginBottom: '15px',
      border: '1px solid rgba(140, 104, 66, 0.2)',
      borderRadius: '12px',
      background: 'rgba(245, 240, 232, 0.3)',
      overflow: 'hidden'
    },
    collapsibleHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 20px',
      background: 'rgba(140, 104, 66, 0.1)',
      cursor: 'pointer',
      color: '#3E2723',
      fontWeight: '600',
      transition: 'all 0.3s ease'
    },
    recipientSelectContainer: {
      position: 'relative',
      width: '100%'
    },
    recipientDropdown: {
      position: 'absolute',
      top: '100%',
      left: '0',
      right: '0',
      background: 'white',
      border: '2px solid #8D6E63',
      borderTop: 'none',
      borderRadius: '0 0 12px 12px',
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(58, 35, 20, 0.2)'
    },
    recipientOption: {
      padding: '12px 16px',
      cursor: 'pointer',
      color: '#3E2723',
      transition: 'background-color 0.2s ease',
      borderBottom: '1px solid rgba(140, 104, 66, 0.1)'
    },
    tip: {
      marginTop: '8px',
      fontSize: '0.85rem',
      color: '#8D6E63',
      fontStyle: 'italic'
    },
    formActions: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'flex-end',
      marginTop: '30px',
      paddingTop: '20px',
      borderTop: '2px solid rgba(140, 104, 66, 0.1)'
    },
    cancelBtn: {
      padding: '12px 24px',
      border: '2px solid rgba(140, 104, 66, 0.3)',
      borderRadius: '12px',
      background: 'rgba(140, 104, 66, 0.1)',
      color: '#3E2723',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      minWidth: '120px'
    },
    submitBtn: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #8D6E63, #5D4037)',
      color: '#EFEBE9',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      minWidth: '120px',
      boxShadow: '0 4px 15px rgba(58, 35, 20, 0.3)'
    }
  };

  return (
    <div style={styles.createEventForm}>
      <h2 style={styles.heading}>Create Event</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Meeting Purpose</label>
          <input
            style={styles.input}
            type="text"
            name="title"
            value={eventData.title}
            onChange={handleChange}
            placeholder="Enter meeting purpose"
            required
          />
        </div>

        <div style={styles.collapsible}>
          <div 
            style={styles.collapsibleHeader} 
            onClick={() => setShowRecipient(!showRecipient)}
            onMouseEnter={(e) => e.target.style.background = 'rgba(140, 104, 66, 0.15)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(140, 104, 66, 0.1)'}
          >
            <span>To</span>
            <span style={{ fontSize: '0.8rem', color: '#8D6E63' }}>
              {showRecipient ? '▲' : '▼'}
            </span>
          </div>
          {showRecipient && (
            <div style={{ padding: '20px' }}>
              <div style={styles.formGroup} className="recipient-group">
                <div style={styles.recipientSelectContainer}>
                  <input
                    style={styles.input}
                    type="text"
                    value={eventData.toName}
                    onChange={handleRecipientInput}
                    onFocus={() => setShowRecipientDropdown(true)}
                    placeholder="Search or select recipient"
                  />
                  {showRecipientDropdown && filteredRecipients.length > 0 && (
                    <div style={styles.recipientDropdown}>
                      {filteredRecipients.map((recipient, index) => (
                        <div
                          key={index}
                          style={styles.recipientOption}
                          onClick={() => selectRecipient(recipient)}
                          onMouseEnter={(e) => e.target.style.background = 'rgba(140, 104, 66, 0.1)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          {recipient.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={styles.tip}>💡 Select who this meeting is for</div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Date</label>
            <input 
              style={styles.input}
              type="date" 
              name="date" 
              value={eventData.date} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Time</label>
            <input 
              style={styles.input}
              type="time" 
              name="time" 
              value={eventData.time} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Duration</label>
            <select 
              style={styles.select}
              name="duration" 
              value={eventData.duration} 
              onChange={handleChange}
            >
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
              <option value="120">2 hours</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div style={styles.collapsible}>
          <div 
            style={styles.collapsibleHeader} 
            onClick={() => setShowLocation(!showLocation)}
            onMouseEnter={(e) => e.target.style.background = 'rgba(140, 104, 66, 0.15)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(140, 104, 66, 0.1)'}
          >
            <span>Location</span>
            <span style={{ fontSize: '0.8rem', color: '#8D6E63' }}>
              {showLocation ? '▲' : '▼'}
            </span>
          </div>
          {showLocation && (
            <div style={{ padding: '20px' }}>
              <div style={styles.formGroup}>
                <input
                  style={styles.input}
                  type="text"
                  name="location"
                  placeholder="Enter location (e.g., Conference Room A, Virtual, etc.)"
                  value={eventData.location}
                  onChange={handleChange}
                />
                <div style={styles.tip}>💡 Meetings with locations are more likely to start on time!</div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.collapsible}>
          <div 
            style={styles.collapsibleHeader} 
            onClick={() => setShowAvailability(!showAvailability)}
            onMouseEnter={(e) => e.target.style.background = 'rgba(140, 104, 66, 0.15)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(140, 104, 66, 0.1)'}
          >
            <span>Availability</span>
            <span style={{ fontSize: '0.8rem', color: '#8D6E63' }}>
              {showAvailability ? '▲' : '▼'}
            </span>
          </div>
          {showAvailability && (
            <div style={{ padding: '20px' }}>
              <div style={styles.formGroup}>
                <p style={{ margin: 0, color: '#3E2723' }}>
                  Available: {eventData.availability}
                </p>
                <div style={styles.tip}>💡 Your default availability window</div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.collapsible}>
          <div 
            style={styles.collapsibleHeader} 
            onClick={() => setShowHost(!showHost)}
            onMouseEnter={(e) => e.target.style.background = 'rgba(140, 104, 66, 0.15)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(140, 104, 66, 0.1)'}
          >
            <span>Host</span>
            <span style={{ fontSize: '0.8rem', color: '#8D6E63' }}>
              {showHost ? '▲' : '▼'}
            </span>
          </div>
          {showHost && (
            <div style={{ padding: '20px' }}>
              <div style={styles.formGroup}>
                <input
                  style={styles.input}
                  type="text"
                  name="host"
                  value={eventData.host}
                  onChange={handleChange}
                  placeholder="Meeting host"
                />
                <div style={styles.tip}>💡 Who will be hosting this meeting</div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.formActions}>
          <button 
            type="button" 
            onClick={onCancel} 
            style={styles.cancelBtn}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(140, 104, 66, 0.2)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(58, 35, 20, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(140, 104, 66, 0.1)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            style={styles.submitBtn}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #A1887F, #8D6E63)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(58, 35, 20, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #8D6E63, #5D4037)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(58, 35, 20, 0.3)';
            }}
          >
            Create Event
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventForm;