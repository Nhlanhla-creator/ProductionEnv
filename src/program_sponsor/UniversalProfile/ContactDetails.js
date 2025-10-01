"use client"
import { useState } from "react"
// import "./universalProfile.css" // Removed as styles are now in globals.css

const ProgramSponsorContactDetails = ({ data, updateData, onComplete }) => {
  const [formData, setFormData] = useState({
    primaryContactName: data?.primaryContactName || "",
    jobTitle: data?.jobTitle || "",
    emailAddress: data?.emailAddress || "",
    phoneNumber: data?.phoneNumber || "",
    physicalAddress: data?.physicalAddress || "", // Added physicalAddress
    city: data?.city || "", // Added city
    province: data?.province || "", // Added province
    country: data?.country || "", // Added country
    postalCode: data?.postalCode || "", // Added postalCode
    secondaryContactName: data?.secondaryContactName || "",
    secondaryEmail: data?.secondaryEmail || "",
    secondaryPhone: data?.secondaryPhone || "",
  })

  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    updateData && updateData(newData)
  }

  return (
    <div className="contact-details-container">
      <h2>Contact Details</h2>
      <div className="form-content">
        <p>
          Please provide your primary contact information and an optional secondary contact for backup communication.
        </p>
        <h3>Primary Contact Information</h3>
        <div className="form-grid-2x2">
          <div className="form-group">
            <label>Primary Contact Name *</label>
            <input
              type="text"
              placeholder="Enter full name"
              className="form-input"
              value={formData.primaryContactName}
              onChange={(e) => handleInputChange("primaryContactName", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Job Title *</label>
            <input
              type="text"
              placeholder="e.g., Program Manager"
              className="form-input"
              value={formData.jobTitle}
              onChange={(e) => handleInputChange("jobTitle", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              placeholder="Enter email address"
              className="form-input"
              value={formData.emailAddress}
              onChange={(e) => handleInputChange("emailAddress", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              placeholder="e.g., +27 11 123 4567"
              className="form-input"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
            />
          </div>
          {/* New Address Fields */}
          <div className="form-group">
            <label>Physical Address *</label>
            <input
              type="text"
              placeholder="Street Address"
              className="form-input"
              value={formData.physicalAddress}
              onChange={(e) => handleInputChange("physicalAddress", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>City *</label>
            <input
              type="text"
              placeholder="City"
              className="form-input"
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Province/State *</label>
            <input
              type="text"
              placeholder="Province/State"
              className="form-input"
              value={formData.province}
              onChange={(e) => handleInputChange("province", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Country *</label>
            <input
              type="text"
              placeholder="Country"
              className="form-input"
              value={formData.country}
              onChange={(e) => handleInputChange("country", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Postal Code *</label>
            <input
              type="text"
              placeholder="Postal Code"
              className="form-input"
              value={formData.postalCode}
              onChange={(e) => handleInputChange("postalCode", e.target.value)}
            />
          </div>
        </div>
        <h3>Secondary Contact (Optional)</h3>
        <div className="form-grid-2x2">
          <div className="form-group">
            <label>Secondary Contact Name</label>
            <input
              type="text"
              placeholder="Enter full name (optional)"
              className="form-input"
              value={formData.secondaryContactName}
              onChange={(e) => handleInputChange("secondaryContactName", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Secondary Email</label>
            <input
              type="email"
              placeholder="Enter email address (optional)"
              className="form-input"
              value={formData.secondaryEmail}
              onChange={(e) => handleInputChange("secondaryEmail", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Secondary Phone</label>
            <input
              type="tel"
              placeholder="Enter phone number (optional)"
              className="form-input"
              value={formData.secondaryPhone}
              onChange={(e) => handleInputChange("secondaryPhone", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgramSponsorContactDetails
