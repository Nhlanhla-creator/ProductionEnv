"use client"

import React, { useState, useEffect } from "react"
import FormField from "./FormField"
import styles from "./catalyst-universal-profile.module.css"
import { db } from "../../firebaseConfig"
import { collection, getDocs } from "firebase/firestore"
import {
  ORGANISATION_TYPES,
  ORGANISATIONAL_ARRANGEMENTS,
  LEGAL_ENTITIES_SA,
  REGISTRATION_IDENTIFIER_TYPES,
  COMPANY_SIZES,
  INDUSTRY_SECTORS_CATALYST,
  HOW_DID_YOU_HEAR,
  CATALYST_ACTIVITIES,
} from "./catalystTaxonomy"

const industryAssociationsList = [
  { value: "SA Township Traders Association", label: "SA Township Traders Association" },
  { value: "Minerals Council South Africa", label: "Minerals Council South Africa" },
  { value: "Junior Mining Council (JEMD-linked)", label: "Junior Mining Council (JEMD-linked)" },
  { value: "Mandela Mining Precinct", label: "Mandela Mining Precinct" },
  { value: "African Chamber of Commerce and Industry", label: "African Chamber of Commerce and Industry" },
  { value: "Black Business Council", label: "Black Business Council" },
  { value: "South African Renewable Energy Council (SAREC)", label: "South African Renewable Energy Council (SAREC)" },
  { value: "SAPICS: Supply Chain Institute of Southern Africa", label: "SAPICS: Supply Chain Institute of Southern Africa" },
  { value: "Manufacturing Circle", label: "Manufacturing Circle" },
  { value: "Southern African Renewable Energy Council (SAWEA / SA-PVIA)", label: "Southern African Renewable Energy Council (SAWEA / SA-PVIA)" },
  { value: "South African Institute of Black Property Practitioners", label: "South African Institute of Black Property Practitioners" },
  { value: "South African Venture Capital and Private Equity Association (SAVCA)", label: "South African Venture Capital and Private Equity Association (SAVCA)" },
  { value: "SA SME Fund", label: "SA SME Fund" },
  { value: "Endeva (SA / global ESO-backed networks)", label: "Endeva (SA / global ESO-backed networks)" },
  { value: "Regional Enterprise Support Network", label: "Regional Enterprise Support Network" },
  { value: "Other", label: "Other" },
]

const sponsorTypes = [
  { value: "CMF", label: "CMF" },
  { value: "Investor", label: "Investor" },
  { value: "Advisor", label: "Advisor" },
]

const sponsorDirectory = {
  CMF: [
    { value: "cmf_001", label: "Ubuntu Capital Markets Fund" },
    { value: "cmf_002", label: "Kagiso Enterprise Fund" },
  ],
  Investor: [
    { value: "inv_001", label: "Sanlam Investment Holdings" },
    { value: "inv_002", label: "Mineworkers Investment Company" },
  ],
  Advisor: [
    { value: "adv_001", label: "Thabo Mokoena Advisory" },
    { value: "adv_002", label: "Nkosi & Associates" },
  ],
}

const threeColGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "1.25rem",
}

function YesNoPillRadio({ name, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "16px" }}>
      {["yes", "no"].map((opt) => (
        <label
          key={opt}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 20px",
            borderRadius: "6px",
            border: `2px solid ${value === opt ? "#795548" : "#ccc"}`,
            backgroundColor: value === opt ? "#f8f5f2" : "white",
            cursor: "pointer",
            fontWeight: value === opt ? "600" : "400",
            color: value === opt ? "#4e342e" : "#555",
            fontSize: "14px",
            transition: "all 0.2s ease",
            userSelect: "none",
          }}
        >
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={(e) => onChange(e.target.value)}
            style={{ display: "none" }}
          />
          <span
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              flexShrink: 0,
              border: `2px solid ${value === opt ? "#795548" : "#ccc"}`,
              backgroundColor: value === opt ? "#795548" : "transparent",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {value === opt && (
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "white" }} />
            )}
          </span>
          {opt === "yes" ? "Yes" : "No"}
        </label>
      ))}
    </div>
  )
}

function MultiSelectDropdown({ options, selected = [], onChange, placeholder = "Select options..." }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-multiselect]")) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const removeTag = (e, value) => {
    e.stopPropagation()
    onChange(selected.filter((v) => v !== value))
  }

  const getLabel = (value) => options.find((o) => o.value === value)?.label || value

  return (
    <div style={{ position: "relative" }} data-multiselect="true">
      <div
        onClick={() => setIsOpen((p) => !p)}
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "6px 10px",
          cursor: "pointer",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "4px",
          minHeight: "40px",
          backgroundColor: "white",
          fontSize: "14px",
        }}
      >
        {selected.length === 0 ? (
          <span style={{ color: "#999" }}>{placeholder}</span>
        ) : (
          selected.map((val) => (
            <span
              key={val}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: "#f3ebe0",
                border: "1px solid #d6c4a8",
                color: "#6b4c2a",
                borderRadius: "12px",
                padding: "2px 10px",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              {getLabel(val)}
              <span
                onClick={(e) => removeTag(e, val)}
                style={{ cursor: "pointer", lineHeight: 1, opacity: 0.7, fontSize: "12px" }}
              >
                ✕
              </span>
            </span>
          ))
        )}
        <span style={{ marginLeft: "auto", color: "#999", fontSize: "12px" }}>{isOpen ? "▲" : "▼"}</span>
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            marginTop: "4px",
            zIndex: 1000,
            maxHeight: "260px",
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {options.map((option) => {
            const isSel = selected.includes(option.value)
            return (
              <div
                key={option.value}
                onClick={() => toggle(option.value)}
                style={{
                  padding: "9px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  backgroundColor: isSel ? "#fdf6ee" : "white",
                  fontSize: "14px",
                  color: "#3d2b1f",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "3px",
                    flexShrink: 0,
                    border: `1px solid ${isSel ? "#795548" : "#ccc"}`,
                    backgroundColor: isSel ? "#795548" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSel && <span style={{ color: "white", fontSize: "10px", fontWeight: "bold" }}>✓</span>}
                </div>
                <span>{option.label}</span>
              </div>
            )
          })}
          <div style={{ padding: "8px", borderTop: "1px solid #eee", position: "sticky", bottom: 0, backgroundColor: "white" }}>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "#795548",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CatalystEntityOverview({ data = {}, updateData, isLocked = false }) {
  const [dynamicSponsors, setDynamicSponsors] = useState(null)

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const collections = {
          CMF: "cmfProfiles",
          Investor: "MyuniversalProfiles",
          Catalyst: "catalystProfiles",
          Advisor: "advisorProfiles",
        }
        const loadedSponsors = {}
        for (const [type, collName] of Object.entries(collections)) {
          const qSnap = await getDocs(collection(db, collName))
          const list = []
          qSnap.forEach((docSnap) => {
            const docData = docSnap.data()
            let label = ""
            if (type === "CMF" || type === "Investor" || type === "Catalyst") {
              label =
                docData?.entityOverview?.tradingName ||
                docData?.entityOverview?.registeredName ||
                docData?.formData?.entityOverview?.tradingName ||
                docData?.formData?.entityOverview?.registeredName ||
                docData?.contactDetails?.contactName ||
                docData?.contactDetails?.primaryContactName ||
                docData?.formData?.contactDetails?.contactName ||
                docData?.formData?.contactDetails?.primaryContactName ||
                docData?.registeredName ||
                docSnap.id
            } else if (type === "Advisor") {
              label =
                docData?.personalProfessionalOverview?.fullName ||
                docData?.formData?.personalProfessionalOverview?.fullName ||
                docData?.contactDetails?.contactName ||
                docData?.formData?.contactDetails?.contactName ||
                docData?.name ||
                docSnap.id
            }
            list.push({ value: docSnap.id, label: label })
          })
          loadedSponsors[type] = list
        }
        setDynamicSponsors(loadedSponsors)
      } catch (err) {
        console.error("Error loading dynamic sponsors:", err)
      }
    }
    fetchSponsors()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleMultiSelectChange = (field, value) => {
    updateData({ [field]: value })
  }

  const handleAssociationInclusionChange = (associationValue, inclusionChoice) => {
    const existingInclusions = data.associationInclusions || {}
    updateData({
      associationInclusions: {
        ...existingInclusions,
        [associationValue]: inclusionChoice,
      },
    })
  }

  const isHosted = data.organisationalArrangement === "unit_within_parent"
  const memberOfAssociation = data.memberOfAssociation
  const isOnboarding = sessionStorage.getItem("isOnboarding") === "true"
  const sponsorType = data.sponsorType || ""
  const sponsorOptions = (dynamicSponsors && dynamicSponsors[sponsorType]) || sponsorDirectory[sponsorType] || []
  const selectedSponsorLabel = sponsorOptions.find((s) => s.value === data.sponsorName)?.label || ""

  const handleSponsorTypeChange = (e) => {
    updateData({ sponsorType: e.target.value, sponsorName: "", sponsorViewPermission: "" })
  }

  const handleSponsorNameChange = (e) => {
    updateData({ sponsorName: e.target.value, sponsorViewPermission: "" })
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
      <h2 className={styles.productApplicationHeading}>Catalyst Organisation Profile</h2>

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
        <strong>Guidance:</strong> Describe the organisation behind your programmes. If you are a university unit or corporate department, select the hosted arrangement to link your parent organisation instead of creating a separate legal identity.
      </div>

      <div className={styles.formContent}>
        {/* ============================================================ */}
        {/* 1. Organisational Structure & Arrangement */}
        {/* ============================================================ */}
        <div style={sectionHeadingStyle}>
          <h3 style={sectionHeadingTextStyle}>1. Institutional Identity & Arrangement</h3>
        </div>

        <div className={styles.gridContainer} style={threeColGrid}>
          <FormField
            label="Organisation Type"
            required
            tooltip="Institution category; distinct from legal structure."
          >
            <select
              name="organisationType"
              value={data.organisationType || ""}
              onChange={handleChange}
              className={styles.formSelect}
              required
              disabled={isLocked}
            >
              <option value="">Select Organisation Type</option>
              {ORGANISATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {data.organisationType === "other" && (
              <input
                type="text"
                name="organisationTypeOther"
                value={data.organisationTypeOther || ""}
                onChange={handleChange}
                placeholder="Specify organisation type..."
                className={styles.formInput}
                style={{ marginTop: "6px" }}
              />
            )}
          </FormField>

          <FormField
            label="Organisational Arrangement"
            required
            tooltip="Whether you operate independently or within a parent entity."
          >
            <select
              name="organisationalArrangement"
              value={data.organisationalArrangement || "standalone"}
              onChange={handleChange}
              className={styles.formSelect}
              required
              disabled={isLocked}
            >
              {ORGANISATIONAL_ARRANGEMENTS.map((arr) => (
                <option key={arr.value} value={arr.value}>
                  {arr.label}
                </option>
              ))}
            </select>
          </FormField>

          {isHosted && (
            <FormField
              label="Unit / Department Name"
              required
              tooltip="Name of hosted operating catalyst unit (e.g. Entrepreneurship Hub, Incubation Centre)."
            >
              <input
                type="text"
                name="unitOrDepartmentName"
                value={data.unitOrDepartmentName || ""}
                onChange={handleChange}
                placeholder="e.g. University Entrepreneurship Hub"
                className={styles.formInput}
                required
                disabled={isLocked}
              />
            </FormField>
          )}

          {isHosted && (
            <FormField
              label="Parent Organisation"
              required
              tooltip="Legal host of the operating unit (e.g. Ubuntu University, Corporate Parent)."
            >
              <input
                type="text"
                name="parentOrganisation"
                value={data.parentOrganisation || ""}
                onChange={handleChange}
                placeholder="e.g. Ubuntu University"
                className={styles.formInput}
                required
                disabled={isLocked}
              />
            </FormField>
          )}

          <FormField
            label="Registered Legal Name"
            required
            tooltip="Legal name of responsible organisation (hosted units inherit parent legal name)."
          >
            <input
              type="text"
              name="registeredName"
              value={data.registeredName || ""}
              onChange={handleChange}
              placeholder={isHosted ? "Parent legal entity name" : "Registered legal name"}
              className={styles.formInput}
              required
              disabled={isLocked}
            />
          </FormField>

          <FormField
            label="Trading / Public Display Name"
            tooltip="Public display name; legal name remains retained on file."
          >
            <input
              type="text"
              name="tradingName"
              value={data.tradingName || ""}
              onChange={handleChange}
              placeholder="Display name shown to applicants"
              className={styles.formInput}
              disabled={isLocked}
            />
          </FormField>
        </div>

        {/* ============================================================ */}
        {/* 2. Legal Registration & Classification */}
        {/* ============================================================ */}
        <div style={sectionHeadingStyle}>
          <h3 style={sectionHeadingTextStyle}>2. Legal Establishment & Registration</h3>
        </div>

        <div className={styles.gridContainer} style={threeColGrid}>
          <FormField
            label="Country of Registration"
            required
            tooltip="Country where the entity was legally established."
          >
            <select
              name="countryOfRegistration"
              value={data.countryOfRegistration || "South Africa"}
              onChange={handleChange}
              className={styles.formSelect}
              required
              disabled={isLocked}
            >
              <option value="South Africa">South Africa</option>
              <option value="Botswana">Botswana</option>
              <option value="Namibia">Namibia</option>
              <option value="Kenya">Kenya</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Ghana">Ghana</option>
              <option value="Rwanda">Rwanda</option>
              <option value="Other">Other</option>
            </select>
          </FormField>

          <FormField
            label="Legal Structure / Form"
            required
            tooltip="Legal structure of responsible entity (hosted units inherit parent structure)."
          >
            <select
              name="legalEntityType"
              value={data.legalEntityType || ""}
              onChange={handleChange}
              className={styles.formSelect}
              required
              disabled={isLocked}
            >
              <option value="">Select Legal Structure</option>
              {LEGAL_ENTITIES_SA.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {data.legalEntityType === "other" && (
              <input
                type="text"
                name="legalEntityTypeOther"
                value={data.legalEntityTypeOther || ""}
                onChange={handleChange}
                placeholder="Specify legal structure..."
                className={styles.formInput}
                style={{ marginTop: "6px" }}
              />
            )}
          </FormField>

          <FormField
            label="Registration Identifier Type"
            tooltip="Kind of establishment reference appropriate to the legal structure."
          >
            <select
              name="registrationIdentifierType"
              value={data.registrationIdentifierType || "company_cc"}
              onChange={handleChange}
              className={styles.formSelect}
              disabled={isLocked}
            >
              {REGISTRATION_IDENTIFIER_TYPES.map((idType) => (
                <option key={idType.value} value={idType.value}>
                  {idType.label}
                </option>
              ))}
            </select>
          </FormField>

          {data.registrationIdentifierType !== "no_identifier" && (
            <FormField
              label={
                data.registrationIdentifierType === "trust"
                  ? "Trust Reference Number"
                  : data.registrationIdentifierType === "statutory"
                  ? "Statutory Reference / Act"
                  : "Registration / Identifier Number"
              }
              required
              tooltip="Applicable official identifier. Never demand a hosted unit registration number."
            >
              <input
                type="text"
                name="registrationNumber"
                value={data.registrationNumber || ""}
                onChange={handleChange}
                placeholder="e.g. 2020/123456/07"
                className={styles.formInput}
                required
                disabled={isLocked}
              />
            </FormField>
          )}

          <FormField
            label="Year Established"
            tooltip="Year organisation or operating unit began operations (four-digit year)."
          >
            <input
              type="number"
              name="yearEstablished"
              value={data.yearEstablished || ""}
              onChange={handleChange}
              className={styles.formInput}
              min="1800"
              max={new Date().getFullYear()}
              placeholder="e.g. 2018"
            />
          </FormField>

          <FormField
            label="Industry Sector"
            tooltip="Primary organisation sector (distinct from programme target sectors)."
          >
            <select
              name="industrySector"
              value={data.industrySector || ""}
              onChange={handleChange}
              className={styles.formSelect}
            >
              <option value="">Select Industry Sector</option>
              {INDUSTRY_SECTORS_CATALYST.map((sector) => (
                <option key={sector.value} value={sector.value}>
                  {sector.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Company / Unit Size"
            tooltip="Staff count for organisation or hosted operating unit."
          >
            <select
              name="companySize"
              value={data.companySize || ""}
              onChange={handleChange}
              className={styles.formSelect}
            >
              <option value="">Select Staff Count</option>
              {COMPANY_SIZES.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Website (URL)"
            tooltip="Organisation or unit website."
          >
            <input
              type="url"
              name="website"
              value={data.website || ""}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="https://hub.example.org"
            />
          </FormField>

          <FormField
            label="How did you hear about us?"
            tooltip="Optional platform acquisition source."
          >
            <select
              name="referralSource"
              value={data.referralSource || ""}
              onChange={handleChange}
              className={styles.formSelect}
            >
              <option value="">Select referral source</option>
              {HOW_DID_YOU_HEAR.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
            {data.referralSource === "other" && (
              <input
                type="text"
                name="referralSourceOther"
                value={data.referralSourceOther || ""}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="Please specify..."
                style={{ marginTop: "6px" }}
              />
            )}
          </FormField>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <FormField
            label="Brief Description & Enterprise Support Role"
            required
            tooltip="Describe your role in enterprise support, mandate, and background (suggested 50–150 words)."
          >
            <textarea
              name="briefDescription"
              value={data.briefDescription || ""}
              onChange={handleChange}
              className={styles.formTextarea}
              rows={4}
              placeholder="Describe your organisation's track record and mission in supporting entrepreneurs..."
              required
            />
          </FormField>
        </div>

        {/* ============================================================ */}
        {/* 3. Catalyst Activities Selection */}
        {/* ============================================================ */}
        <div style={sectionHeadingStyle}>
          <h3 style={sectionHeadingTextStyle}>3. Active Catalyst Offerings</h3>
        </div>

        <p style={{ fontSize: "14px", color: "#6d4c41", marginBottom: "10px" }}>
          Configured enterprise support tracks available for your programme workspace:
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "1.5rem" }}>
          {CATALYST_ACTIVITIES.map((act) => {
            const isChecked = Array.isArray(data.catalystActivities) && data.catalystActivities.includes(act.id)
            return (
              <label
                key={act.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: `2px solid ${isChecked ? "#795548" : "#ccc"}`,
                  backgroundColor: isChecked ? "#f3ebe0" : "#fff",
                  color: isChecked ? "#4e342e" : "#555",
                  fontWeight: isChecked ? "600" : "400",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    const current = Array.isArray(data.catalystActivities) ? data.catalystActivities : []
                    const updated = e.target.checked
                      ? [...current, act.id]
                      : current.filter((x) => x !== act.id)
                    updateData({ catalystActivities: updated })
                  }}
                  style={{ accentColor: "#795548" }}
                />
                {act.label}
              </label>
            )
          })}
        </div>

        {/* ============================================================ */}
        {/* 4. Industry Associations & Ecosystem Inclusion */}
        {/* ============================================================ */}
        <div style={sectionHeadingStyle}>
          <h3 style={sectionHeadingTextStyle}>4. Industry Associations & Ecosystem Inclusion</h3>
        </div>

        <div className={styles.gridContainer} style={threeColGrid}>
          <FormField
            label="Member of an industry association?"
            tooltip="Declared organisation affiliations."
          >
            <YesNoPillRadio
              name="memberOfAssociation"
              value={memberOfAssociation}
              onChange={(value) => updateData({ memberOfAssociation: value })}
            />
          </FormField>

          {memberOfAssociation === "yes" && (
            <FormField
              label="Select your association(s)"
              tooltip="Associations your organisation belongs to."
            >
              <MultiSelectDropdown
                options={industryAssociationsList}
                selected={Array.isArray(data.industryAssociations) ? data.industryAssociations : []}
                onChange={(value) => handleMultiSelectChange("industryAssociations", value)}
                placeholder="Select associations..."
              />
            </FormField>
          )}

          {memberOfAssociation === "yes" &&
            Array.isArray(data.industryAssociations) &&
            data.industryAssociations.includes("Other") && (
              <FormField label="Specify other association">
                <input
                  type="text"
                  name="industryAssociationsOther"
                  value={data.industryAssociationsOther || ""}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="Specify association name..."
                />
              </FormField>
            )}
        </div>

        {/* Per-association ecosystem inclusion setting */}
        {memberOfAssociation === "yes" &&
          Array.isArray(data.industryAssociations) &&
          data.industryAssociations.length > 0 && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                backgroundColor: "#f8f5f2",
                border: "1px solid #d7ccc8",
                borderRadius: "6px",
              }}
            >
              <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "14px", color: "#5d4037" }}>
                Ecosystem Inclusion Preferences:
              </h4>
              <p style={{ fontSize: "13px", color: "#6d4c41", margin: "0 0 1rem 0" }}>
                Specify whether you request inclusion in each association’s discoverable member ecosystem directory.
              </p>
              <div style={{ display: "grid", gap: "8px" }}>
                {data.industryAssociations.map((assoc) => (
                  <div
                    key={assoc}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 12px",
                      backgroundColor: "#ffffff",
                      borderRadius: "4px",
                      border: "1px solid #e8d8cf",
                    }}
                  >
                    <span style={{ fontSize: "14px", fontWeight: "500", color: "#4e342e" }}>
                      {assoc}
                    </span>
                    <select
                      value={data.associationInclusions?.[assoc] || "do_not_include"}
                      onChange={(e) => handleAssociationInclusionChange(assoc, e.target.value)}
                      style={{
                        padding: "4px 8px",
                        fontSize: "13px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        color: "#5d4037",
                      }}
                    >
                      <option value="do_not_include">Do not include</option>
                      <option value="request_inclusion">Request ecosystem inclusion</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* ============================================================ */}
        {/* 5. Sponsor Relationship & Permissions */}
        {/* ============================================================ */}
        {!isOnboarding && (
          <>
            <div style={sectionHeadingStyle}>
              <h3 style={sectionHeadingTextStyle}>5. Sponsor Connection & Access Permission</h3>
            </div>

            <div className={styles.gridContainer} style={threeColGrid}>
              <FormField
                label="Working with a specific sponsor?"
                tooltip="Link an existing funder or corporate sponsor to your account."
              >
                <select
                  name="sponsorType"
                  value={sponsorType}
                  onChange={handleSponsorTypeChange}
                  className={styles.formSelect}
                >
                  <option value="">Select sponsor type</option>
                  {sponsorTypes.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </FormField>

              {sponsorType && (
                <FormField label={`Which ${sponsorType}?`}>
                  <select
                    name="sponsorName"
                    value={data.sponsorName || ""}
                    onChange={handleSponsorNameChange}
                    className={styles.formSelect}
                  >
                    <option value="">{`Select ${sponsorType}...`}</option>
                    {sponsorOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              {sponsorType && data.sponsorName && (
                <FormField label="Permission to view your profile?">
                  <YesNoPillRadio
                    name="sponsorViewPermission"
                    value={data.sponsorViewPermission}
                    onChange={(value) => updateData({ sponsorViewPermission: value })}
                  />
                </FormField>
              )}
            </div>

            {data.sponsorViewPermission === "yes" && selectedSponsorLabel && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px 14px",
                  backgroundColor: "#f0f7f0",
                  borderLeft: "4px solid #4CAF50",
                  borderRadius: "4px",
                  fontSize: "13px",
                  color: "#2e7d32",
                }}
              >
                <strong>📌 Confirmed:</strong> {selectedSponsorLabel} is authorized to view your profile progress.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}