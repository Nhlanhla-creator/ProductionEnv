"use client"

import React, { useState } from "react"
import { Plus, Trash2, UserPlus, ShieldCheck, Mail, Phone, MapPin, Globe } from "lucide-react"
import FormField from "./FormField"
import styles from "./catalyst-universal-profile.module.css"
import {
  SALUTATION_TITLES,
  CONTACT_RESPONSIBILITIES,
  PREFERRED_CONTACT_METHODS,
  PUBLIC_ENQUIRY_OPTIONS,
  PUBLIC_LOCATION_VISIBILITY,
  SOUTH_AFRICAN_PROVINCES,
} from "./catalystTaxonomy"

const threeColGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "1.25rem",
}

const twoColGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "1.25rem",
}

export default function CatalystContactDetails({ data = {}, updateData, isLocked = false }) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const val = type === "checkbox" ? checked : value

    if (name === "usePrimaryEmail" && checked) {
      updateData({
        usePrimaryEmail: true,
        businessEmail: data.primaryEmail || "",
      })
      return
    }

    updateData({ [name]: val })
  }

  const handlePrimaryEmailChange = (e) => {
    const newEmail = e.target.value
    const updates = { primaryEmail: newEmail }
    if (data.usePrimaryEmail) {
      updates.businessEmail = newEmail
    }
    updateData(updates)
  }

  const togglePrimaryResponsibility = (respId) => {
    const current = Array.isArray(data.primaryResponsibilities) ? data.primaryResponsibilities : []
    const updated = current.includes(respId)
      ? current.filter((id) => id !== respId)
      : [...current, respId]
    updateData({ primaryResponsibilities: updated })
  }

  // Repeatable additional contacts
  const additionalContacts = Array.isArray(data.additionalContacts) ? data.additionalContacts : []

  const addContact = () => {
    const newContact = {
      id: Date.now().toString(),
      title: "Mr",
      name: "",
      surname: "",
      position: "",
      responsibilities: [],
      email: "",
      mobile: "",
    }
    updateData({ additionalContacts: [...additionalContacts, newContact] })
  }

  const removeContact = (id) => {
    updateData({
      additionalContacts: additionalContacts.filter((c) => c.id !== id),
    })
  }

  const updateAdditionalContact = (id, field, value) => {
    const updated = additionalContacts.map((c) => {
      if (c.id === id) {
        return { ...c, [field]: value }
      }
      return c
    })
    updateData({ additionalContacts: updated })
  }

  const toggleAdditionalContactResponsibility = (id, respId) => {
    const contact = additionalContacts.find((c) => c.id === id)
    if (!contact) return
    const current = Array.isArray(contact.responsibilities) ? contact.responsibilities : []
    const updatedResp = current.includes(respId)
      ? current.filter((r) => r !== respId)
      : [...current, respId]
    updateAdditionalContact(id, "responsibilities", updatedResp)
  }

  const sectionHeadingStyle = {
    borderBottom: "2px solid #795548",
    marginBottom: "1.25rem",
    marginTop: "1.75rem",
    paddingBottom: "6px",
  }

  const sectionHeadingTextStyle = {
    fontSize: "16px",
    fontWeight: "700",
    color: "#5d4037",
    margin: 0,
    letterSpacing: "0.2px",
  }

  return (
    <div className={styles.productApplicationContainer}>
      <h2 className={styles.productApplicationHeading}>Contact Details & Public Presence</h2>

      <div
        style={{
          backgroundColor: "#f8f5f2",
          borderLeft: "4px solid #795548",
          padding: "12px 16px",
          borderRadius: "4px",
          marginBottom: "1.5rem",
          color: "#5d4037",
          fontSize: "14px",
        }}
      >
        <strong>Guidance:</strong> Provide one primary accountable contact for administrative and platform notifications. Public enquiry contacts and discovery location visibility are configured separately to protect private direct details.
      </div>

      <div className={styles.formContent}>
        {/* ============================================================ */}
        {/* 1. General Organisation Contact Information */}
        {/* ============================================================ */}
        <div style={sectionHeadingStyle}>
          <h3 style={sectionHeadingTextStyle}>1. General Organisation Contact & Office Location</h3>
        </div>

        <div className={styles.gridContainer} style={threeColGrid}>
          <FormField
            label="General Enquiry Email"
            required
            tooltip="General organisation enquiry email (e.g. info@catalyst.org)."
          >
            <input
              type="email"
              name="businessEmail"
              value={data.businessEmail || ""}
              onChange={handleChange}
              placeholder="info@hub.example.org"
              className={styles.formInput}
              required
              disabled={isLocked}
            />
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "#6d4c41",
                marginTop: "6px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="usePrimaryEmail"
                checked={!!data.usePrimaryEmail}
                onChange={handleChange}
                style={{ accentColor: "#795548" }}
              />
              Use primary contact email
            </label>
          </FormField>

          <FormField
            label="General Office Telephone"
            tooltip="General switchboard or office phone number with country dialling code."
          >
            <div style={{ display: "flex", gap: "6px" }}>
              <select
                name="businessTelCountryCode"
                value={data.businessTelCountryCode || "+27"}
                onChange={handleChange}
                className={styles.formSelect}
                style={{ width: "90px", flexShrink: 0 }}
              >
                <option value="+27">+27 (ZA)</option>
                <option value="+267">+267 (BW)</option>
                <option value="+264">+264 (NA)</option>
                <option value="+254">+254 (KE)</option>
                <option value="+234">+234 (NG)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+1">+1 (US)</option>
              </select>
              <input
                type="tel"
                name="businessTel"
                value={data.businessTel || ""}
                onChange={handleChange}
                placeholder="10 555 0100"
                className={styles.formInput}
                disabled={isLocked}
              />
            </div>
          </FormField>

          <FormField
            label="Country of Office"
            required
            tooltip="Country where the catalyst operating office is located."
          >
            <select
              name="country"
              value={data.country || "South Africa"}
              onChange={handleChange}
              className={styles.formSelect}
              required
            >
              <option value="South Africa">South Africa</option>
              <option value="Botswana">Botswana</option>
              <option value="Namibia">Namibia</option>
              <option value="Kenya">Kenya</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Other">Other</option>
            </select>
          </FormField>

          <FormField
            label="Province / Region"
            required
            tooltip="Region or province of the operating office."
          >
            {data.country === "South Africa" ? (
              <select
                name="province"
                value={data.province || "Gauteng"}
                onChange={handleChange}
                className={styles.formSelect}
                required
              >
                {SOUTH_AFRICAN_PROVINCES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="province"
                value={data.province || ""}
                onChange={handleChange}
                placeholder="Region / State"
                className={styles.formInput}
                required
              />
            )}
          </FormField>

          <FormField
            label="City or Town"
            required
            tooltip="Office locality / municipality."
          >
            <input
              type="text"
              name="city"
              value={data.city || ""}
              onChange={handleChange}
              placeholder="e.g. Johannesburg"
              className={styles.formInput}
              required
            />
          </FormField>

          <FormField
            label="Physical Street Address"
            tooltip="Street address (not public unless full address visibility is selected)."
          >
            <textarea
              name="physicalAddress"
              value={data.physicalAddress || ""}
              onChange={handleChange}
              rows={2}
              placeholder="Building, Street, Suburb, Postal Code"
              className={styles.formTextarea}
            />
          </FormField>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <FormField
            label="Postal Address"
            tooltip="Postal destination if different from physical location."
          >
            <div style={{ display: "flex", gap: "16px", marginBottom: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#5d4037", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="postalAddressChoice"
                  value="same_as_physical"
                  checked={data.postalAddressChoice === "same_as_physical" || !data.postalAddressChoice}
                  onChange={handleChange}
                  style={{ accentColor: "#795548" }}
                />
                Same as physical address
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#5d4037", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="postalAddressChoice"
                  value="different"
                  checked={data.postalAddressChoice === "different"}
                  onChange={handleChange}
                  style={{ accentColor: "#795548" }}
                />
                Different postal address
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#5d4037", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="postalAddressChoice"
                  value="not_provided"
                  checked={data.postalAddressChoice === "not_provided"}
                  onChange={handleChange}
                  style={{ accentColor: "#795548" }}
                />
                Not provided
              </label>
            </div>
            {data.postalAddressChoice === "different" && (
              <textarea
                name="postalAddress"
                value={data.postalAddress || ""}
                onChange={handleChange}
                rows={2}
                placeholder="P.O. Box / Private Bag, Suburb, Postal Code"
                className={styles.formTextarea}
              />
            )}
          </FormField>
        </div>

        {/* ============================================================ */}
        {/* 2. Primary Accountable Contact */}
        {/* ============================================================ */}
        <div style={sectionHeadingStyle}>
          <h3 style={sectionHeadingTextStyle}>2. Primary Accountable Contact</h3>
        </div>

        <div className={styles.gridContainer} style={threeColGrid}>
          <FormField
            label="Title"
            tooltip="Preferred salutation."
          >
            <select
              name="primaryTitle"
              value={data.primaryTitle || "Mr"}
              onChange={handleChange}
              className={styles.formSelect}
            >
              {SALUTATION_TITLES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="First / Given Name"
            required
            tooltip="Primary accountable contact's given name."
          >
            <input
              type="text"
              name="primaryName"
              value={data.primaryName || ""}
              onChange={handleChange}
              placeholder="e.g. Nomsa"
              className={styles.formInput}
              required
            />
          </FormField>

          <FormField
            label="Surname"
            required
            tooltip="Primary accountable contact's surname."
          >
            <input
              type="text"
              name="primarySurname"
              value={data.primarySurname || ""}
              onChange={handleChange}
              placeholder="e.g. Dlamini"
              className={styles.formInput}
              required
            />
          </FormField>

          <FormField
            label="Position / Job Title"
            required
            tooltip="Actual job title within the catalyst organisation or unit."
          >
            <input
              type="text"
              name="primaryPosition"
              value={data.primaryPosition || ""}
              onChange={handleChange}
              placeholder="e.g. Hub Director / Programme Manager"
              className={styles.formInput}
              required
            />
          </FormField>

          <FormField
            label="Direct Mobile / Phone"
            required
            tooltip="Preferred direct phone number (mobile or fixed direct line)."
          >
            <div style={{ display: "flex", gap: "6px" }}>
              <select
                name="primaryMobileCountryCode"
                value={data.primaryMobileCountryCode || "+27"}
                onChange={handleChange}
                className={styles.formSelect}
                style={{ width: "90px", flexShrink: 0 }}
              >
                <option value="+27">+27 (ZA)</option>
                <option value="+267">+267 (BW)</option>
                <option value="+264">+264 (NA)</option>
                <option value="+254">+254 (KE)</option>
                <option value="+234">+234 (NG)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+1">+1 (US)</option>
              </select>
              <input
                type="tel"
                name="primaryMobile"
                value={data.primaryMobile || ""}
                onChange={handleChange}
                placeholder="82 555 0100"
                className={styles.formInput}
                required
              />
            </div>
          </FormField>

          <FormField
            label="Direct Primary Email"
            required
            tooltip="Direct email used for platform administration and notifications."
          >
            <input
              type="email"
              name="primaryEmail"
              value={data.primaryEmail || ""}
              onChange={handlePrimaryEmailChange}
              placeholder="nomsa@hub.example.org"
              className={styles.formInput}
              required
            />
          </FormField>

          <FormField
            label="Preferred Contact Channel"
            tooltip="Preferred communication method for urgent notifications."
          >
            <select
              name="preferredContactMethod"
              value={data.preferredContactMethod || "email"}
              onChange={handleChange}
              className={styles.formSelect}
            >
              {PREFERRED_CONTACT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Contact Responsibilities Multi-Select */}
        <div style={{ marginTop: "1rem" }}>
          <FormField
            label="Contact Functional Responsibilities"
            required
            tooltip="Functions and accountabilities handled by this primary contact."
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
              {CONTACT_RESPONSIBILITIES.map((resp) => {
                const isSelected = Array.isArray(data.primaryResponsibilities) && data.primaryResponsibilities.includes(resp.id)
                return (
                  <button
                    type="button"
                    key={resp.id}
                    onClick={() => togglePrimaryResponsibility(resp.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "16px",
                      border: `1.5px solid ${isSelected ? "#795548" : "#d7ccc8"}`,
                      backgroundColor: isSelected ? "#f3ebe0" : "#ffffff",
                      color: isSelected ? "#4e342e" : "#5d4037",
                      fontSize: "13px",
                      fontWeight: isSelected ? "600" : "400",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {resp.label} {isSelected && "✓"}
                  </button>
                )
              })}
            </div>
          </FormField>
        </div>

        {/* ============================================================ */}
        {/* 3. Additional Responsible Contacts */}
        {/* ============================================================ */}
        <div style={sectionHeadingStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={sectionHeadingTextStyle}>3. Additional Responsible Contacts</h3>
            <button
              type="button"
              onClick={addContact}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                backgroundColor: "#795548",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              <UserPlus size={15} /> Add Responsible Contact
            </button>
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "#6d4c41", margin: "0 0 1rem 0" }}>
          Record additional team members (e.g. reporting officers, finance leads, programme coordinators). Adding a contact here records operational responsibility and does not grant account access.
        </p>

        {additionalContacts.length === 0 ? (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fcfaf8",
              border: "1px dashed #d7ccc8",
              borderRadius: "6px",
              textAlign: "center",
              color: "#8d6e63",
              fontSize: "14px",
            }}
          >
            No additional contacts added yet. Click &quot;Add Responsible Contact&quot; above to include additional team members.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {additionalContacts.map((contact, index) => (
              <div
                key={contact.id}
                style={{
                  border: "1px solid #d7ccc8",
                  borderRadius: "6px",
                  padding: "1rem",
                  backgroundColor: "#ffffff",
                  position: "relative",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", borderBottom: "1px solid #f3e5dc", paddingBottom: "6px" }}>
                  <span style={{ fontWeight: "700", color: "#5d4037", fontSize: "14px" }}>
                    Contact #{index + 1}: {contact.name ? `${contact.name} ${contact.surname}` : "New Team Member"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeContact(contact.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#c62828",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>

                <div className={styles.gridContainer} style={threeColGrid}>
                  <FormField label="Title">
                    <select
                      value={contact.title || "Mr"}
                      onChange={(e) => updateAdditionalContact(contact.id, "title", e.target.value)}
                      className={styles.formSelect}
                    >
                      {SALUTATION_TITLES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Given Name" required>
                    <input
                      type="text"
                      value={contact.name || ""}
                      onChange={(e) => updateAdditionalContact(contact.id, "name", e.target.value)}
                      placeholder="e.g. Sipho"
                      className={styles.formInput}
                      required
                    />
                  </FormField>

                  <FormField label="Surname" required>
                    <input
                      type="text"
                      value={contact.surname || ""}
                      onChange={(e) => updateAdditionalContact(contact.id, "surname", e.target.value)}
                      placeholder="e.g. Zulu"
                      className={styles.formInput}
                      required
                    />
                  </FormField>

                  <FormField label="Position / Role" required>
                    <input
                      type="text"
                      value={contact.position || ""}
                      onChange={(e) => updateAdditionalContact(contact.id, "position", e.target.value)}
                      placeholder="e.g. Reporting Officer"
                      className={styles.formInput}
                      required
                    />
                  </FormField>

                  <FormField label="Direct Email" required>
                    <input
                      type="email"
                      value={contact.email || ""}
                      onChange={(e) => updateAdditionalContact(contact.id, "email", e.target.value)}
                      placeholder="sipho@hub.example.org"
                      className={styles.formInput}
                      required
                    />
                  </FormField>

                  <FormField label="Mobile / Telephone">
                    <input
                      type="tel"
                      value={contact.mobile || ""}
                      onChange={(e) => updateAdditionalContact(contact.id, "mobile", e.target.value)}
                      placeholder="+27 83 555 0100"
                      className={styles.formInput}
                    />
                  </FormField>
                </div>

                <div style={{ marginTop: "0.5rem" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#5d4037", display: "block", marginBottom: "4px" }}>
                    Responsibilities:
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {CONTACT_RESPONSIBILITIES.map((resp) => {
                      const isSel = Array.isArray(contact.responsibilities) && contact.responsibilities.includes(resp.id)
                      return (
                        <button
                          type="button"
                          key={resp.id}
                          onClick={() => toggleAdditionalContactResponsibility(contact.id, resp.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            border: `1px solid ${isSel ? "#795548" : "#ccc"}`,
                            backgroundColor: isSel ? "#f3ebe0" : "#fff",
                            color: isSel ? "#4e342e" : "#555",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          {resp.label} {isSel && "✓"}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. Public Presence & Visibility Settings */}
        {/* ============================================================ */}
        <div style={sectionHeadingStyle}>
          <h3 style={sectionHeadingTextStyle}>4. Public Profile Visibility & Enquiries</h3>
        </div>

        <div className={styles.gridContainer} style={threeColGrid}>
          <FormField
            label="Organisation LinkedIn Page"
            tooltip="Public LinkedIn organisation or hub page."
          >
            <input
              type="url"
              name="linkedInPage"
              value={data.linkedInPage || ""}
              onChange={handleChange}
              placeholder="https://linkedin.com/company/example"
              className={styles.formInput}
            />
          </FormField>

          <FormField
            label="Published Enquiry Contact"
            tooltip="Which contact information is published on public programme listings for SME enquiries."
          >
            <select
              name="publicEnquiryContact"
              value={data.publicEnquiryContact || "general"}
              onChange={handleChange}
              className={styles.formSelect}
            >
              {PUBLIC_ENQUIRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Public Office Location Visibility"
            required
            tooltip="Controls how much of your physical office location is visible on discovery and matching cards."
          >
            <select
              name="publicLocationVisibility"
              value={data.publicLocationVisibility || "city_region"}
              onChange={handleChange}
              className={styles.formSelect}
              required
            >
              {PUBLIC_LOCATION_VISIBILITY.map((vis) => (
                <option key={vis.value} value={vis.value}>
                  {vis.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>
    </div>
  )
}