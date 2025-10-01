"use client"
import { useState } from "react"
import { Plus, X } from "lucide-react"
import FormField from "./FormField";
import FileUpload from "./FileUpload";
import styles from "./InvestorUniversalProfile.module.css";

export default function ContactDetails({ data = {}, updateData }) {
  const [showSecondaryContact, setShowSecondaryContact] = useState(false)
  const [sameAsPhysical, setSameAsPhysical] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    updateData({ [name]: type === "checkbox" ? checked : value })
  }

  const handlePhysicalAddressChange = (e) => {
    const { value } = e.target
    updateData({ physicalAddress: value })
    
    // If "same as physical" is checked, also update postal address
    if (sameAsPhysical) {
      updateData({ postalAddress: value })
    }
  }

  const handleSameAsPhysicalChange = (e) => {
    const isChecked = e.target.checked
    setSameAsPhysical(isChecked)
    
    // If checked, copy physical address to postal address
    if (isChecked && data.physicalAddress) {
      updateData({ postalAddress: data.physicalAddress })
    }
    // If unchecked, clear postal address
    else if (!isChecked) {
      updateData({ postalAddress: "" })
    }
  }

  const handleFileChange = (name, files) => {
    updateData({ [name]: files })
  }

  const toggleSecondaryContact = () => {
    setShowSecondaryContact(!showSecondaryContact)
    // If hiding secondary contact, clear the data
    if (showSecondaryContact) {
      updateData({
        secondaryContactTitle: "",
        secondaryContactName: "",
        secondaryContactSurname: "",
        secondaryContactPosition: "",
        secondaryContactMobile: "",
        secondaryContactEmail: ""
      })
    }
  }

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: showSecondaryContact ? '#dc3545' : '#8b4513',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '16px'
  }

  return (
    <div>
      <h2 className={`${styles.title} text-2xl font-bold mb-6`}>Contact Information</h2>

      <div className={`${styles.grid} grid grid-cols-1 md:grid-cols-2 gap-6`}>
        <div>
          <h3 className={`${styles.subtitle} text-lg font-semibold mb-4`}>Business Contact Info</h3>

          <FormField label="Business Tel" required>
            <input
              type="text"
              name="businessTel"
              value={data.businessTel || ""}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </FormField>

          <FormField label="Email (e.g info@)" required>
            <input
              type="email"
              name="businessEmail"
              value={data.businessEmail || ""}
              onChange={handleChange}
              placeholder="info@company.com"
              className={styles.input}
              required
            />
          </FormField>

          <FormField label="Physical Address" required>
            <textarea
              name="physicalAddress"
              value={data.physicalAddress || ""}
              onChange={handlePhysicalAddressChange}
              rows={3}
              className={styles.input}
              required
            ></textarea>
          </FormField>

          <FormField label="Postal Address" required>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Same as Physical Address Checkbox */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '8px'
              }}>
                <input
                  type="checkbox"
                  id="sameAsPhysical"
                  checked={sameAsPhysical}
                  onChange={handleSameAsPhysicalChange}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#8b4513',
                    cursor: 'pointer'
                  }}
                />
                <label 
                  htmlFor="sameAsPhysical" 
                  style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  Same as physical address
                </label>
              </div>
              
              <textarea
                name="postalAddress"
                value={data.postalAddress || ""}
                onChange={handleChange}
                rows={3}
                className={styles.input}
                required
                disabled={sameAsPhysical}
                style={{
                  backgroundColor: sameAsPhysical ? '#f9fafb' : '',
                  cursor: sameAsPhysical ? 'not-allowed' : 'text',
                  opacity: sameAsPhysical ? 0.7 : 1
                }}
              ></textarea>
            </div>
          </FormField>

          <FormField label="Website">
            <input
              type="url"
              name="website"
              value={data.website || ""}
              onChange={handleChange}
              placeholder="https://"
              className={styles.input}
            />
          </FormField>

          <FormField label="LinkedIn Page">
            <input
              type="url"
              name="linkedin"
              value={data.linkedin || ""}
              onChange={handleChange}
              placeholder="https://linkedin.com/company/..."
              className={styles.input}
            />
          </FormField>
        </div>

        <div>
          <h3 className={`${styles.subtitle} text-lg font-semibold mb-4`}>Primary Contact</h3>

          <FormField label="Title" required>
            <select
              name="primaryContactTitle"
              value={data.primaryContactTitle || ""}
              onChange={handleChange}
              className={styles.input}
              required
            >
              <option value="">Select</option>
              <option value="mr">Mr</option>
              <option value="mrs">Mrs</option>
              <option value="ms">Ms</option>
              <option value="dr">Dr</option>
              <option value="prof">Prof</option>
            </select>
          </FormField>

          <FormField label="Name" required>
            <input
              type="text"
              name="primaryContactName"
              value={data.primaryContactName || ""}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </FormField>

          <FormField label="Surname" required>
            <input
              type="text"
              name="primaryContactSurname"
              value={data.primaryContactSurname || ""}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </FormField>

          <FormField label="Position" required>
            <input
              type="text"
              name="primaryContactPosition"
              value={data.primaryContactPosition || ""}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </FormField>

          <FormField label="Mobile" required>
            <input
              type="text"
              name="primaryContactMobile"
              value={data.primaryContactMobile || ""}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </FormField>

          <FormField label="Email" required>
            <input
              type="email"
              name="primaryContactEmail"
              value={data.primaryContactEmail || ""}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </FormField>

          {/* Add/Remove Secondary Contact Button */}
          <button
            type="button"
            onClick={toggleSecondaryContact}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.target.style.opacity = '0.9'
              e.target.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '1'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            {showSecondaryContact ? (
              <>
                <X size={16} />
                Remove Secondary Contact
              </>
            ) : (
              <>
                <Plus size={16} />
                Add More Contact
              </>
            )}
          </button>

          {/* Secondary Contact Section - Only show when toggled */}
          {showSecondaryContact && (
            <div style={{ 
              marginTop: '24px',
              padding: '20px',
              backgroundColor: '#faf8f5',
              borderRadius: '8px',
              border: '1px solid #e8d5b7'
            }}>
              <h3 className={`${styles.subtitle} text-lg font-semibold mb-4`}>Secondary Contact</h3>

              <FormField label="Title">
                <select
                  name="secondaryContactTitle"
                  value={data.secondaryContactTitle || ""}
                  onChange={handleChange}
                  className={styles.input}
                >
                  <option value="">Select</option>
                  <option value="mr">Mr</option>
                  <option value="mrs">Mrs</option>
                  <option value="ms">Ms</option>
                  <option value="dr">Dr</option>
                  <option value="prof">Prof</option>
                </select>
              </FormField>

              <FormField label="Name">
                <input
                  type="text"
                  name="secondaryContactName"
                  value={data.secondaryContactName || ""}
                  onChange={handleChange}
                  className={styles.input}
                />
              </FormField>

              <FormField label="Surname">
                <input
                  type="text"
                  name="secondaryContactSurname"
                  value={data.secondaryContactSurname || ""}
                  onChange={handleChange}
                  className={styles.input}
                />
              </FormField>

              <FormField label="Position">
                <input
                  type="text"
                  name="secondaryContactPosition"
                  value={data.secondaryContactPosition || ""}
                  onChange={handleChange}
                  className={styles.input}
                />
              </FormField>

              <FormField label="Mobile">
                <input
                  type="text"
                  name="secondaryContactMobile"
                  value={data.secondaryContactMobile || ""}
                  onChange={handleChange}
                  className={styles.input}
                />
              </FormField>

              <FormField label="Email">
                <input
                  type="email"
                  name="secondaryContactEmail"
                  value={data.secondaryContactEmail || ""}
                  onChange={handleChange}
                  className={styles.input}
                />
              </FormField>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}