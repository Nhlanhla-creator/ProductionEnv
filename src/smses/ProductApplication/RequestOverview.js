import React from "react";
import FormField from "./FormField";
import { engagementTypes, deliveryModes, africanCountries } from "./applicationOptions";
import "./ProductApplication.css";

// Currency formatter function
const formatCurrency = (value) => {
  if (!value) return '';
  const numericValue = value.replace(/[^\d]/g, '');
  if (!numericValue) return '';
  return `R ${parseInt(numericValue).toLocaleString()}`;
};

// Parse currency value back to number for storage
const parseCurrency = (value) => {
  return value.replace(/[^\d]/g, '');
};

const RequestOverview = ({ data = {}, updateData }) => {
  // Initialize with default values
  const formData = {
    purpose: '',
    engagementType: '',
    engagementTypeOther: '',
    deliveryModes: [],
    startDate: '',
    endDate: '',
    location: '',
    minBudget: '',
    maxBudget: '',
    esdProgram: null,
    ...data
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle currency formatting for budget fields
    if (name === 'minBudget' || name === 'maxBudget') {
      const formattedValue = formatCurrency(value);
      updateData({
        ...formData,
        [name]: formattedValue
      });
    } else {
      updateData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleCheckboxChange = (field, value) => {
    const currentValues = formData[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    updateData({
      ...formData,
      [field]: newValues
    });
  };

  const handleRadioChange = (value) => {
    updateData({
      ...formData,
      esdProgram: value === 'yes'
    });
  };

  // Check if "Other" is selected in engagement type
  const showEngagementTypeOther = formData.engagementType === 'Other';

  return (
    <div className="request-overview-form">
      <h2>Request Overview</h2>

      {/* Purpose Textarea */}
      <FormField label="Purpose of Request" >
        <textarea
          name="purpose"
          value={formData.purpose}
          onChange={handleChange}
          className="form-textarea large"
          rows={4}
        />
      </FormField>

      <div className="grid-container">
        {/* Engagement Type Dropdown */}
        <FormField label="Type of Engagement" >
          <select
            name="engagementType"
            value={formData.engagementType}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select engagement type</option>
            {engagementTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </FormField>

        {/* Show specification field when "Other" is selected */}
        {showEngagementTypeOther && (
          <FormField label="Please specify engagement type" >
            <input
              type="text"
              name="engagementTypeOther"
              value={formData.engagementTypeOther}
              onChange={handleChange}
              className="form-input"
              placeholder="Please specify the type of engagement"
              required
            />
          </FormField>
        )}

        {/* Delivery Mode Checkboxes */}
        <FormField label="Preferred Delivery Mode" >
          <div className="checkbox-group">
            {deliveryModes.map(mode => (
              <label key={mode} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={formData.deliveryModes.includes(mode)}
                  onChange={() => handleCheckboxChange('deliveryModes', mode)}
                />
                {mode}
              </label>
            ))}
          </div>
        </FormField>

        {/* Date Inputs */}
        <FormField label="Start Date" >
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="form-input"
            min={new Date().toISOString().split('T')[0]}
          />
        </FormField>

        <FormField label="End Date" >
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="form-input"
            min={formData.startDate || new Date().toISOString().split('T')[0]}
          />
        </FormField>

        {/* Location Dropdown */}
        <FormField label="Location" >
          <select
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select country</option>
            {africanCountries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </FormField>

        {/* Budget Inputs with Currency Formatting */}
        <FormField label="Budget Range (ZAR)" >
          <div className="flex-row">
            <input
              type="text"
              name="minBudget"
              value={formData.minBudget}
              onChange={handleChange}
              placeholder="R 0"
              className="form-input"
              style={{ color: formData.minBudget ? 'black' : '#9CA3AF' }}
            />
            <span className="mx-2">to</span>
            <input
              type="text"
              name="maxBudget"
              value={formData.maxBudget}
              onChange={handleChange}
              placeholder="R 0"
              className="form-input"
              style={{ color: formData.maxBudget ? 'black' : '#9CA3AF' }}
            />
          </div>
        </FormField>

        {/* Radio Buttons */}
        <FormField label="Linked to ESD/CSR Program?">
          <div className="radio-group">
            <label className="radio-item">
              <input
                type="radio"
                name="esdProgram"
                checked={formData.esdProgram === true}
                onChange={() => handleRadioChange('yes')}
              />
              Yes
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="esdProgram"
                checked={formData.esdProgram === false}
                onChange={() => handleRadioChange('no')}
              />
              No
            </label>
          </div>
        </FormField>
      </div>
    </div>
  );
};

export default RequestOverview;