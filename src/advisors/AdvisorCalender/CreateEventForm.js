import React, { useState, useEffect } from 'react';
import './CreateEventForm.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const CreateEventForm = ({ onSubmit, onCancel }) => {
  const [eventData, setEventData] = useState({
    title: '',
    recipient: '',
    date: '',
    time: '',
    duration: '30',
    location: '',
    description: '',
  });

  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [showLocation, setShowLocation] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchRecipients(user);
      } else {
        setLoadingRecipients(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchRecipients = async (user) => {
    if (!user) {
      setLoadingRecipients(false);
      return;
    }
    
    setLoadingRecipients(true);
    
    try {
      // Try to fetch from MyuniversalProfiles
      const profilesRef = collection(db, 'MyuniversalProfiles');
      const querySnapshot = await getDocs(profilesRef);
      
      const recipientList = [];
      
      querySnapshot.forEach((doc) => {
        if (doc.id === user.uid) return;
        
        const data = doc.data();
        const formData = data?.formData || {};
        let displayName = '';
        
        // Try all possible name fields
        if (formData.contactDetails?.primaryContactName) {
          displayName = formData.contactDetails.primaryContactName;
        } else if (formData.entityOverview?.registeredName) {
          displayName = formData.entityOverview.registeredName;
        } else if (formData.fundManageOverview?.registeredName) {
          displayName = formData.fundManageOverview.registeredName;
        } else if (formData.personalDetails?.fullName) {
          displayName = formData.personalDetails.fullName;
        } else if (data.displayName) {
          displayName = data.displayName;
        } else {
          displayName = 'User ' + doc.id.substring(0, 6);
        }
        
        let userType = 'Advisor';
        if (formData.fundManageOverview) {
          userType = 'Investor';
        } else if (formData.entityOverview) {
          userType = 'SME';
        } else if (formData.personalDetails) {
          userType = 'Individual';
        }
        
        recipientList.push({
          id: doc.id,
          name: displayName,
          type: userType,
          email: formData.contactDetails?.email || '',
        });
      });
      
      // If no recipients found in MyuniversalProfiles, try universalProfiles
      if (recipientList.length === 0) {
        try {
          const universalRef = collection(db, 'universalProfiles');
          const universalSnapshot = await getDocs(universalRef);
          
          universalSnapshot.forEach((doc) => {
            if (doc.id === user.uid) return;
            
            const data = doc.data();
            let displayName = data?.entityOverview?.registeredName || 
                             data?.contactDetails?.contactName || 
                             'User ' + doc.id.substring(0, 6);
            
            recipientList.push({
              id: doc.id,
              name: displayName,
              type: 'User',
              email: data?.contactDetails?.email || '',
            });
          });
        } catch (err) {
          console.log('No universalProfiles collection found');
        }
      }
      
      setRecipients(recipientList);
      
    } catch (error) {
      console.error('Error fetching recipients:', error);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData({ ...eventData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!eventData.recipient) {
      alert('Please select a recipient for this meeting');
      return;
    }
    
    if (!eventData.title) {
      alert('Please enter a meeting title');
      return;
    }
    
    if (!eventData.date || !eventData.time) {
      alert('Please select a date and time');
      return;
    }
    
    const selectedRecipient = recipients.find(r => r.id === eventData.recipient);
    
    const fullEvent = {
      ...eventData,
      recipientName: selectedRecipient?.name || '',
      recipientType: selectedRecipient?.type || '',
      id: Date.now().toString(),
      status: 'pending',
      dateTime: `${eventData.date}T${eventData.time}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      smeId: currentUser?.uid || '',
      // Add availableDates array for the meeting details
      availableDates: [{
        date: new Date(`${eventData.date}T${eventData.time}`),
        timeSlots: [{ start: eventData.time, end: eventData.time }],
        timeZone: 'Africa/Johannesburg',
        status: 'pending'
      }]
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
            placeholder="Enter meeting title"
            value={eventData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>To</label>
          <select
            name="recipient"
            value={eventData.recipient}
            onChange={handleChange}
            required
            className="recipient-select"
          >
            <option value="">Select a recipient...</option>
            {loadingRecipients ? (
              <option value="" disabled>Loading recipients...</option>
            ) : recipients.length === 0 ? (
              <option value="" disabled>No recipients found</option>
            ) : (
              recipients.map((recipient) => (
                <option key={recipient.id} value={recipient.id}>
                  {recipient.name} ({recipient.type})
                </option>
              ))
            )}
          </select>
          <div className="field-tip">🔑 Select who this meeting is for</div>
        </div>

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
            <select 
              name="duration" 
              value={eventData.duration} 
              onChange={handleChange}
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="collapsible">
          <div 
            className="collapsible-header" 
            onClick={() => setShowLocation(!showLocation)}
          >
            <span>🔑 Location</span>
            <span>{showLocation ? '▲' : '▼'}</span>
          </div>
          {showLocation && (
            <div className="form-group">
              <input
                type="text"
                name="location"
                placeholder="Enter location (e.g., Zoom, Google Meet, Office)"
                value={eventData.location}
                onChange={handleChange}
              />
              <div className="tip">💡 Add a meeting link or physical address</div>
            </div>
          )}
        </div>

        <div className="collapsible">
          <div 
            className="collapsible-header" 
            onClick={() => setShowDescription(!showDescription)}
          >
            <span>🗺 Description</span>
            <span>{showDescription ? '▲' : '▼'}</span>
          </div>
          {showDescription && (
            <div className="form-group">
              <textarea
                name="description"
                placeholder="Add meeting agenda or notes..."
                value={eventData.description}
                onChange={handleChange}
                rows="3"
              />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            Create Event
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventForm;