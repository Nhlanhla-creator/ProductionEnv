import React from 'react';
import FormField from './FormField';
import { responseMethods } from './applicationOptions';
import "./ProductApplication.css";

const ContactSubmission = ({ data = {}, updateData }) => {
  const formData = {
    contactName: '',
    contactRole: '',
    businessName: '',
    email: '',
    phone: '',
    responseMethod: '',
    declaration: false,
    ...data
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    updateData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  return (
    <div className="contact-submission-form">
      <h2>Contact & Submission</h2>
      
      <div className="grid-container">
        <FormField label="Contact Person Name" required>
          <input
            type="text"
            name="contactName"
            value={formData.contactName || ''}
            onChange={handleChange}
            className="form-input"
          />
        </FormField>

        <FormField label="Role" required>
          <input
            type="text"
            name="contactRole"
            value={formData.contactRole || ''}
            onChange={handleChange}
            className="form-input"
          />
        </FormField>

        <FormField label="Business Name" required>
          <input
            type="text"
            name="businessName"
            value={formData.businessName || ''}
            onChange={handleChange}
            className="form-input"
          />
        </FormField>

        <FormField label="Email" required>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            className="form-input"
          />
        </FormField>

        <FormField label="Phone Number" required>
          <input
            type="number"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            className="form-input"
          />
        </FormField>

        <FormField label="Preferred Response Method" required>
          <select
            name="responseMethod"
            value={formData.responseMethod || ''}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select method</option>
            {responseMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField>
        <label className="checkbox-item">
          <input
            type="checkbox"
            name="declaration"
            checked={formData.declaration || false}
            onChange={handleChange}
          />
          I confirm information is accurate and agree to be matched.
        </label>
      </FormField>
    </div>
  );
};

export default ContactSubmission;