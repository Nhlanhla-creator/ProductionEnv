import React, { useState, useEffect, useRef } from "react";
import { HelpCircle, ChevronDown, X, Check, Award } from "lucide-react";
import "./UniversalProfile.css";
import FormField from "./form-field";
import { auth } from "../../firebaseConfig";
import { checkIsNGO } from "./ngoTaxonomy";

const currencies = [
  { value: "ZAR", label: "ZAR - South African Rand" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "NGN", label: "NGN - Nigerian Naira" },
];

const importExportOptions = [
  { value: "import", label: "Import" },
  { value: "export", label: "Export" },
  { value: "both", label: "Both" },
  { value: "none", label: "None" },
];

// ── SME Industry Accreditation options ──
const industryAccreditationOptions = [
  { value: "ISO 9001", label: "ISO 9001 – Quality Management" },
  { value: "ISO 14001", label: "ISO 14001 – Environmental Management" },
  { value: "ISO 45001", label: "ISO 45001 – Occupational Health & Safety" },
  { value: "ISO 27001", label: "ISO 27001 – Information Security" },
  { value: "CIDB", label: "CIDB – Construction Industry Development Board" },
  { value: "NHBRC", label: "NHBRC – National Home Builders Registration Council" },
  { value: "SACPCMP", label: "SACPCMP – SA Council for Project & Construction Management" },
  { value: "ECSA", label: "ECSA – Engineering Council of South Africa" },
  { value: "SABS", label: "SABS – South African Bureau of Standards" },
  { value: "FSCA", label: "FSCA – Financial Sector Conduct Authority" },
  { value: "PSIRA", label: "PSIRA – Private Security Industry Regulatory Authority" },
  { value: "SAICA", label: "SAICA – SA Institute of Chartered Accountants" },
  { value: "SAIPA", label: "SAIPA – SA Institute of Professional Accountants" },
  { value: "HPCSA", label: "HPCSA – Health Professions Council of SA" },
  { value: "Other", label: "Other (please specify)" },
];

// Smart recommendation map — suggests certificates based on entity sector / accreditation gaps
const accreditationRecommendations = {
  "Construction": ["CIDB", "NHBRC", "SACPCMP", "ISO 9001", "ISO 45001"],
  "Manufacturing": ["ISO 9001", "ISO 14001", "ISO 45001", "SABS"],
  "Engineering": ["ECSA", "ISO 9001", "ISO 45001", "SACPCMP"],
  "Information Technology (IT)": ["ISO 27001", "ISO 9001"],
  "Banking, Finance & Insurance": ["FSCA", "ISO 27001"],
  "Consulting": ["ISO 9001", "SAICA"],
  "Healthcare / Medical": ["HPCSA", "ISO 9001"],
  "Safety & Security / Police / Defence": ["PSIRA", "ISO 45001"],
  "Mining": ["ISO 45001", "ISO 9001", "ISO 14001"],
  "Energy": ["ISO 14001", "ISO 45001", "ISO 9001"],
  "Agriculture": ["ISO 14001", "SABS"],
  "Logistics / Supply Chain": ["ISO 9001", "ISO 45001"],
};

// ── NGO Sector Registrations & Accreditations ──
const ngoSectorAccreditationOptions = [
  { value: "DSD_NPO", label: "DSD – Registered Non-Profit Organisation (NPO)" },
  { value: "SARS_S18A", label: "SARS – Section 18A Tax-Deductible Approval" },
  { value: "SETA", label: "SETA – Accredited Skills Development Provider" },
  { value: "QCTO", label: "QCTO – Quality Council for Trades and Occupations" },
  { value: "DBE", label: "DBE – Department of Basic Education Registered" },
  { value: "DOH", label: "DOH / HPCSA – Department of Health / Health Professions" },
  { value: "SACSSP", label: "SACSSP – SA Council for Social Service Professions" },
  { value: "ISO 9001", label: "ISO 9001 – Quality Management System" },
  { value: "Other", label: "Other sector accreditation (specify)" },
];

// ── NGO Premises options ──
const ngoPremisesStatusOptions = [
  { value: "rented", label: "Rented / Commercial Lease" },
  { value: "owned", label: "Owned by Organisation" },
  { value: "donated", label: "Donated / Community-provided rent-free" },
  { value: "shared", label: "Shared facility / Co-located with partner" },
  { value: "remote", label: "Remote / Field-based (No fixed premises)" },
];

const ngoPremisesTypeOptions = [
  { value: "offices", label: "Administrative Offices" },
  { value: "community_center", label: "Community Centre / Hall" },
  { value: "education_center", label: "Early Childhood / School Facility" },
  { value: "care_facility", label: "Clinic / Health / Care Facility" },
  { value: "workshop", label: "Skills Workshop / Training Centre" },
  { value: "shared_hub", label: "Shared Hub / Non-Profit Incubator" },
  { value: "other", label: "Other" },
];

const milestoneDeliveryOptions = [
  { value: "all_milestones", label: "Consistently delivered all milestones on schedule" },
  { value: "most_milestones", label: "Delivered most milestones with agreed modifications" },
  { value: "some_delays", label: "Experienced some delivery delays or scope adjustments" },
  { value: "new_organisation", label: "Newly established organisation (no 12-month track record yet)" },
];

const keyRolesStatusOptions = [
  { value: "all_filled", label: "All key leadership & delivery roles filled" },
  { value: "few_vacancies", label: "1–2 key vacancies currently open" },
  { value: "multiple_vacancies", label: "Multiple key vacancies / actively recruiting" },
  { value: "volunteer_run", label: "Largely volunteer-dependent" },
];

const deliveryConstraintOptions = [
  { value: "funding", label: "Funding & grant availability" },
  { value: "staff", label: "Full-time staff capacity & retention" },
  { value: "volunteers", label: "Volunteer availability & consistency" },
  { value: "facilities", label: "Facilities, venues & community access" },
  { value: "equipment", label: "Equipment, tools & transport" },
  { value: "systems", label: "Systems, technology & reporting tools" },
  { value: "partnerships", label: "Delivery partner alignment" },
  { value: "other", label: "Other operational constraints" },
];
const MultiSelectDropdown = ({ options, selected = [], onChange, placeholder = "Select options..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  };
  const removeTag = (e, value) => { e.stopPropagation(); onChange(selected.filter((v) => v !== value)); };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full min-h-[40px] px-3 py-1.5 border rounded-md cursor-pointer flex flex-wrap items-center gap-1 bg-white"
        style={{ borderColor: "#d6c4a8" }}
      >
        {selected.length === 0 ? (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        ) : (
          selected.slice(0, 3).map((val) => {
            const label = options.find((o) => o.value === val)?.label || (val === "Other" ? "Other" : val);
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: "#f3ebe0", color: "#6b4c2a", border: "1px solid #d6c4a8" }}
              >
                {label}
                <button onClick={(e) => removeTag(e, val)} className="hover:opacity-70 transition-opacity" type="button">
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })
        )}
        {selected.length > 3 && <span className="text-xs text-brown-700">+{selected.length - 3}</span>}
        <ChevronDown className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} style={{ color: "#9c7a5a" }} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ borderColor: "#d6c4a8" }}>
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <div key={option.value} onClick={() => toggleOption(option.value)} className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm hover:bg-amber-50" style={{ color: "#3d2b1f" }}>
                <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border" style={{ borderColor: isSelected ? "#8b5e3c" : "#d6c4a8", backgroundColor: isSelected ? "#8b5e3c" : "transparent" }}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <span>{option.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const OperationsOverview = ({ data, updateData, economicSectors, isNGO: isNGOProp, allFormData }) => {
  const isNGO = typeof isNGOProp === "boolean" ? isNGOProp : checkIsNGO(allFormData || {}, auth.currentUser);
  const [formData, setFormData] = useState({});

  useEffect(() => { setFormData(data || {}); }, [data]);

  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    updateData(newData);
  };

  const renderRadioGroup = (name, currentValue, options = ["yes", "no"]) => (
    <div style={{ display: 'flex', gap: '18px', marginTop: '4px', flexWrap: 'wrap' }}>
      {options.map((val) => (
        <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', color: '#3d2b1f' }}>
          <input type="radio" name={name} value={val} checked={currentValue === val} onChange={(e) => handleInputChange(name, e.target.value)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${currentValue === val ? '#8B4513' : '#ccc'}`, backgroundColor: currentValue === val ? '#8B4513' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {currentValue === val && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }} />}
          </div>
          <span style={{ textTransform: 'capitalize' }}>{val}</span>
        </label>
      ))}
    </div>
  );

  // Clean, un-numbered Section Heading per AGENTS.md
  const SectionHeading = ({ title }) => (
    <div style={{ borderBottom: '2px solid #C19A6B', marginBottom: '12px', paddingBottom: '5px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#6B3410', margin: 0, letterSpacing: '0.3px' }}>
        {title}
      </h3>
    </div>
  );

  const inputStyle = { width: '100%', padding: '7px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' };
  const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' };

  // ─────────────────────────────────────────────────────────────────────────────
  // NGO VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (isNGO) {
    const selectedAccreditations = Array.isArray(formData.ngoAccreditations)
      ? formData.ngoAccreditations
      : [];
    const showOtherAccreditation = selectedAccreditations.includes("Other");
    const selectedConstraints = Array.isArray(formData.deliveryConstraints)
      ? formData.deliveryConstraints
      : [];
    const showOtherConstraint = selectedConstraints.includes("other");
    const hasFieldSites = formData.hasFieldSites === "yes";

    return (
      <>
        <div style={{ marginBottom: "20px" }}>
          <h2 className="text-2xl font-bold text-brown-800" style={{ marginBottom: "4px" }}>Operations Overview</h2>
          <p style={{ color: "#7d5a50", fontSize: "14px" }}>
            Delivery models, partner operations, field facilities, sector accreditations, and people capacity.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* 1. Delivery Partners & Outsourcing */}
          <div>
            <SectionHeading title="Delivery Partners & Outsourcing" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <FormField label="Do you work with implementing or delivery partners?" required>
                {renderRadioGroup("outsourcesValueChain", formData.outsourcesValueChain)}
              </FormField>
            </div>

            {formData.outsourcesValueChain === "yes" && (
              <div style={{ 
                marginTop: '12px',
                padding: '1rem', 
                backgroundColor: "#f9f7f3", 
                borderRadius: "8px", 
                border: "1px solid #d6c4a8" 
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '16px' }}>
                  <FormField label="Partner roles & outsourced delivery scope">
                    <input
                      type="text"
                      name="outsourcedServices"
                      value={formData.outsourcedServices || ""}
                      onChange={(e) => handleInputChange("outsourcedServices", e.target.value)}
                      style={inputStyle}
                      placeholder="e.g., Community outreach, training logistics, food distribution"
                    />
                  </FormField>
                  <FormField label="Annual value / funding passed to partners">
                    <input
                      type="number"
                      name="outsourcedValue"
                      value={formData.outsourcedValue || ""}
                      onChange={(e) => handleInputChange("outsourcedValue", e.target.value)}
                      min="0"
                      style={inputStyle}
                      placeholder="0"
                    />
                  </FormField>
                  <FormField label="Currency">
                    <select
                      name="outsourcedCurrency"
                      value={formData.outsourcedCurrency || "ZAR"}
                      onChange={(e) => handleInputChange("outsourcedCurrency", e.target.value)}
                      style={inputStyle}
                    >
                      {currencies.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            )}
          </div>

          {/* 2. Grant-Funded & Contracted Delivery */}
          <div>
            <SectionHeading title="Grant-Funded, Contracted & Partnership Delivery" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <FormField label="Do you deliver programmes on a grant or contract basis?" required>
                {renderRadioGroup("operatesOnContract", formData.operatesOnContract)}
              </FormField>

              {formData.operatesOnContract === "yes" && (
                <>
                  <FormField label="Total active programme / contract commitment">
                    <input
                      type="number"
                      name="totalContractValue"
                      value={formData.totalContractValue || ""}
                      onChange={(e) => handleInputChange("totalContractValue", e.target.value)}
                      min="0"
                      style={inputStyle}
                      placeholder="0"
                    />
                  </FormField>
                  <FormField label="Currency">
                    <select
                      name="contractCurrency"
                      value={formData.contractCurrency || "ZAR"}
                      onChange={(e) => handleInputChange("contractCurrency", e.target.value)}
                      style={inputStyle}
                    >
                      {currencies.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </FormField>
                </>
              )}
            </div>
          </div>

          {/* 3. Delivery Continuity & Partner Risk */}
          <div>
            <SectionHeading title="Delivery Continuity & Partner Risk" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <FormField label="Does the organisation depend on critical delivery partners, volunteers, or specialised venues?" required>
                {renderRadioGroup("multipleSuppliers", formData.multipleSuppliers)}
              </FormField>

              <FormField label="Do you have a documented operational contingency or continuity plan?" required>
                {renderRadioGroup("contingencyPlan", formData.contingencyPlan)}
              </FormField>
            </div>

            {formData.multipleSuppliers === "yes" && (
              <div style={{ 
                marginTop: '12px',
                padding: '1rem', 
                backgroundColor: "#f9f7f3", 
                borderRadius: "8px", 
                border: "1px solid #d6c4a8" 
              }}>
                <h5 style={{ color: "#3d2b1f", marginBottom: "0.75rem", fontSize: "14px", fontWeight: "600" }}>
                  Key Delivery Partners / Resource References
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  {/* Partner 1 */}
                  <div>
                    <label style={{ fontSize: "13px", color: "#5c4a3a", marginBottom: "4px", display: "block", fontWeight: "500" }}>
                      Partner 1 – Organisation Name
                    </label>
                    <input
                      type="text"
                      name="supplier1Name"
                      value={formData.supplier1Name || ""}
                      onChange={(e) => handleInputChange("supplier1Name", e.target.value)}
                      style={inputStyle}
                      placeholder="e.g. Local Municipality / Partner NGO"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", color: "#5c4a3a", marginBottom: "4px", display: "block", fontWeight: "500" }}>
                      Partner 1 – Contact Person & Role
                    </label>
                    <input
                      type="text"
                      name="supplier1Contact"
                      value={formData.supplier1Contact || ""}
                      onChange={(e) => handleInputChange("supplier1Contact", e.target.value)}
                      style={inputStyle}
                      placeholder="Contact Name & Title"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", color: "#5c4a3a", marginBottom: "4px", display: "block", fontWeight: "500" }}>
                      Partner 1 – Telephone / Email
                    </label>
                    <input
                      type="text"
                      name="supplier1Phone"
                      value={formData.supplier1Phone || ""}
                      onChange={(e) => handleInputChange("supplier1Phone", e.target.value)}
                      style={inputStyle}
                      placeholder="Phone or Email"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Premises & Field Facilities */}
          <div>
            <SectionHeading title="Premises & Field Facilities" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <FormField label="Premises tenure status" required>
                <select 
                  name="premisesStatus" 
                  value={formData.premisesStatus || ""} 
                  onChange={(e) => handleInputChange("premisesStatus", e.target.value)} 
                  style={inputStyle} 
                  required
                >
                  <option value="">Select status</option>
                  {ngoPremisesStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </FormField>

              {formData.premisesStatus === "rented" && (
                <FormField label="Lease Expiry Date">
                  <input 
                    type="date" 
                    name="leaseExpiryDate" 
                    value={formData.leaseExpiryDate || ""} 
                    onChange={(e) => handleInputChange("leaseExpiryDate", e.target.value)} 
                    style={inputStyle} 
                  />
                </FormField>
              )}

              <FormField label="Facility Type">
                <select 
                  name="premisesType" 
                  value={formData.premisesType || ""} 
                  onChange={(e) => handleInputChange("premisesType", e.target.value)} 
                  style={inputStyle}
                >
                  <option value="">Select facility</option>
                  {ngoPremisesTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Primary Facility Size (sqm)">
                <input 
                  type="number" 
                  name="premisesSize" 
                  value={formData.premisesSize || ""} 
                  onChange={(e) => handleInputChange("premisesSize", e.target.value)} 
                  min="0" 
                  style={inputStyle} 
                  placeholder="e.g. 250" 
                />
              </FormField>
            </div>

            <div style={{ marginTop: "16px" }}>
              <FormField label="Do you operate additional field sites, branches, or satellite venues?">
                <select 
                  name="hasFieldSites" 
                  value={formData.hasFieldSites || ""} 
                  onChange={(e) => handleInputChange("hasFieldSites", e.target.value)} 
                  style={inputStyle}
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </FormField>
            </div>

            {hasFieldSites && (
              <div style={{ 
                marginTop: '12px',
                padding: '1rem', 
                backgroundColor: "#f9f7f3", 
                borderRadius: "8px", 
                border: "1px solid #d6c4a8" 
              }}>
                <h5 style={{ color: "#3d2b1f", marginBottom: "0.75rem", fontSize: "14px", fontWeight: "600" }}>
                  Field Sites & Branch Locations
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <FormField label="Number of Field Sites">
                    <input 
                      type="number" 
                      name="numberOfBranches" 
                      value={formData.numberOfBranches || ""} 
                      onChange={(e) => handleInputChange("numberOfBranches", e.target.value)} 
                      min="0" 
                      style={inputStyle} 
                    />
                  </FormField>
                  <FormField label="Site Locations / Communities">
                    <input 
                      type="text" 
                      name="branchLocations" 
                      value={formData.branchLocations || ""} 
                      onChange={(e) => handleInputChange("branchLocations", e.target.value)} 
                      style={inputStyle} 
                      placeholder="e.g., Khayelitsha, Soweto, Umlazi" 
                    />
                  </FormField>
                  <FormField label="Staff & Volunteers at Sites">
                    <input 
                      type="number" 
                      name="branchStaff" 
                      value={formData.branchStaff || ""} 
                      onChange={(e) => handleInputChange("branchStaff", e.target.value)} 
                      min="0" 
                      style={inputStyle} 
                      placeholder="0" 
                    />
                  </FormField>
                </div>
              </div>
            )}
          </div>

          {/* 5. Sector Registrations & Accreditations */}
          <div>
            <SectionHeading title="Sector Registrations & Accreditations" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <FormField label="Select applicable registrations & accreditations">
                <MultiSelectDropdown
                  options={ngoSectorAccreditationOptions}
                  selected={selectedAccreditations}
                  onChange={(value) => handleInputChange("ngoAccreditations", value)}
                  placeholder="Select sector accreditations..."
                />
              </FormField>

              {showOtherAccreditation && (
                <FormField label="Please specify other sector accreditation(s)">
                  <input
                    type="text"
                    name="ngoAccreditationsOther"
                    value={formData.ngoAccreditationsOther || ""}
                    onChange={(e) => handleInputChange("ngoAccreditationsOther", e.target.value)}
                    placeholder="e.g. SACE, Local Municipal Permit..."
                    style={inputStyle}
                  />
                </FormField>
              )}
            </div>
          </div>

          {/* 6. Milestone Delivery & Scalability */}
          <div>
            <SectionHeading title="Milestone Delivery Track Record & Scalability" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <FormField label="Do you track programme outputs and beneficiary reach metrics?" required>
                {renderRadioGroup("trackPerformanceMetrics", formData.trackPerformanceMetrics)}
              </FormField>

              <FormField label="Programme milestone delivery over past 12–24 months:" required>
                <select
                  name="milestoneDeliveryTrackRecord"
                  value={formData.milestoneDeliveryTrackRecord || ""}
                  onChange={(e) => handleInputChange("milestoneDeliveryTrackRecord", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select track record</option>
                  {milestoneDeliveryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Capacity to serve more beneficiaries without reducing quality?" required>
                {renderRadioGroup("hasCapacityToIncrease", formData.hasCapacityToIncrease)}
              </FormField>
            </div>
          </div>

          {/* 7. People & Delivery Capacity (Specific to NGOs) */}
          <div style={{
            backgroundColor: "#fdfbf9",
            border: "1px solid #ebd9c8",
            borderRadius: "8px",
            padding: "20px"
          }}>
            <SectionHeading title="People & Delivery Capacity" />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <FormField label="Full-time Paid Staff">
                <input
                  type="number"
                  name="fullTimeStaff"
                  value={formData.fullTimeStaff || ""}
                  onChange={(e) => handleInputChange("fullTimeStaff", e.target.value)}
                  min="0"
                  style={inputStyle}
                  placeholder="0"
                />
              </FormField>

              <FormField label="Part-time Paid Staff">
                <input
                  type="number"
                  name="partTimeStaff"
                  value={formData.partTimeStaff || ""}
                  onChange={(e) => handleInputChange("partTimeStaff", e.target.value)}
                  min="0"
                  style={inputStyle}
                  placeholder="0"
                />
              </FormField>

              <FormField label="Active Volunteers Count">
                <input
                  type="number"
                  name="activeVolunteers"
                  value={formData.activeVolunteers || ""}
                  onChange={(e) => handleInputChange("activeVolunteers", e.target.value)}
                  min="0"
                  style={inputStyle}
                  placeholder="0"
                />
              </FormField>

              <FormField label="Volunteers & Staff 'As At' Date">
                <input
                  type="date"
                  name="staffAsAtDate"
                  value={formData.staffAsAtDate || ""}
                  onChange={(e) => handleInputChange("staffAsAtDate", e.target.value)}
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '16px', marginBottom: '16px' }}>
              <FormField label="Key Delivery Roles Status">
                <select
                  name="keyRolesStatus"
                  value={formData.keyRolesStatus || ""}
                  onChange={(e) => handleInputChange("keyRolesStatus", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select status</option>
                  {keyRolesStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Current Primary Delivery Metric & Unit">
                <input
                  type="text"
                  name="deliveryCapacityMetric"
                  value={formData.deliveryCapacityMetric || ""}
                  onChange={(e) => handleInputChange("deliveryCapacityMetric", e.target.value)}
                  placeholder="e.g. 500 learners trained per annum / 1,200 food parcels delivered monthly"
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div>
              <FormField label="Main Operational & Delivery Constraints">
                <MultiSelectDropdown
                  options={deliveryConstraintOptions}
                  selected={selectedConstraints}
                  onChange={(value) => handleInputChange("deliveryConstraints", value)}
                  placeholder="Select primary constraints..."
                />
              </FormField>
              {showOtherConstraint && (
                <div style={{ marginTop: "10px" }}>
                  <FormField label="Please specify other delivery constraint">
                    <input
                      type="text"
                      name="deliveryConstraintsOther"
                      value={formData.deliveryConstraintsOther || ""}
                      onChange={(e) => handleInputChange("deliveryConstraintsOther", e.target.value)}
                      placeholder="Specify other constraint..."
                      style={inputStyle}
                    />
                  </FormField>
                </div>
              )}
            </div>
          </div>

          {/* 8. Safety & Beneficiary Safeguarding */}
          <div>
            <SectionHeading title="Safety & Beneficiary Safeguarding" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <FormField label="Do you have formal beneficiary safeguarding / child protection policies?" required>
                {renderRadioGroup("hasSafeguardingPolicy", formData.hasSafeguardingPolicy)}
              </FormField>

              <FormField label="Do you have formal health, safety & risk procedures?" required>
                {renderRadioGroup("hasFormalProcedures", formData.hasFormalProcedures)}
              </FormField>

              <FormField label="Have you experienced any major safeguarding or operational incidents in the past 24 months?" required>
                {renderRadioGroup("hasMajorIncidents", formData.hasMajorIncidents)}
              </FormField>
            </div>
          </div>

          {/* 9. Operational Challenges */}
          <div>
            <SectionHeading title="Operational & Delivery Challenges" />
            <FormField label="What are your organisation's current delivery and operational challenges?">
              <textarea
                name="operationalChallenges"
                value={formData.operationalChallenges || ""}
                onChange={(e) => handleInputChange("operationalChallenges", e.target.value)}
                rows={4}
                placeholder="Describe key delivery challenges your organisation is experiencing (e.g. funding gaps, transport access, volunteer turnover, reporting burden, facility limitations)..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                }}
              />
            </FormField>
          </div>

        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SME DEFAULT VIEW (Cleaned un-numbered headings per AGENTS.md)
  // ─────────────────────────────────────────────────────────────────────────────
  const hasBranches = formData.hasBranches === "yes";
  const outsourcesValueChain = formData.outsourcesValueChain;
  const importExport = formData.importExport;
  const operatesOnContract = formData.operatesOnContract;
  const selectedAccreditations = Array.isArray(formData.industryAccreditations) ? formData.industryAccreditations : [];
  const showOtherAccreditation = selectedAccreditations.includes("Other");

  const suppliers = Array.isArray(formData.suppliers) ? formData.suppliers : [];
  const addSupplier = () => handleInputChange("suppliers", [...suppliers, { name: "", contact: "" }]);
  const updateSupplier = (idx, field, value) => {
    const next = [...suppliers];
    next[idx] = { ...next[idx], [field]: value };
    handleInputChange("suppliers", next);
  };
  const removeSupplier = (idx) => handleInputChange("suppliers", suppliers.filter((_, i) => i !== idx));

  // Accreditation recommendation: derive from declared sectors, filter out already-held ones
  const sectors = Array.isArray(economicSectors) && economicSectors.length > 0
    ? economicSectors
    : (Array.isArray(formData.economicSectors) ? formData.economicSectors : []);
  const heldSet = new Set(selectedAccreditations);
  const recommended = [...new Set(
    sectors.flatMap((sector) => accreditationRecommendations[sector] || [])
  )].filter((rec) => !heldSet.has(rec)).slice(0, 5);

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <h2 className="text-2xl font-bold text-brown-800" style={{ marginBottom: "4px" }}>Operations Overview</h2>
        <p style={{ color: "#7d5a50", fontSize: "14px" }}>
          Supply chain operations, facility footprint, industry accreditations, and operational capacity.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Outsourcing & Value Chain */}
        <div>
          <SectionHeading title="Outsourcing & Value Chain" />
          <div style={grid3}>
            <FormField label="Contract any part of your value chain?" required>
              {renderRadioGroup("outsourcesValueChain", formData.outsourcesValueChain)}
            </FormField>
            {outsourcesValueChain === "yes" && (
              <>
                <FormField label="Which services are outsourced?">
                  <input type="text" name="outsourcedServices" value={formData.outsourcedServices || ""} onChange={(e) => handleInputChange("outsourcedServices", e.target.value)} style={inputStyle} placeholder="Logistics, IT, etc." />
                </FormField>
                <FormField label="Annual value">
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input type="number" name="outsourcedValue" value={formData.outsourcedValue || ""} onChange={(e) => handleInputChange("outsourcedValue", e.target.value)} min="0" style={{ ...inputStyle, flex: 1 }} placeholder="0" />
                    <select name="outsourcedCurrency" value={formData.outsourcedCurrency || "ZAR"} onChange={(e) => handleInputChange("outsourcedCurrency", e.target.value)} style={{ ...inputStyle, flex: '0 0 80px', cursor: 'pointer' }}>
                      {currencies.map((c) => <option key={c.value} value={c.value}>{c.value}</option>)}
                    </select>
                  </div>
                </FormField>
              </>
            )}
          </div>
        </div>

        {/* Import / Export */}
        <div>
          <SectionHeading title="Import / Export" />
          <div style={grid3}>
            <FormField label="Import and/or Export?" required>
              <select name="importExport" value={formData.importExport || "none"} onChange={(e) => handleInputChange("importExport", e.target.value)} style={inputStyle}>
                {importExportOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </FormField>
            {importExport !== "none" && (
              <FormField label="Annual value">
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="number" name="importExportValue" value={formData.importExportValue || ""} onChange={(e) => handleInputChange("importExportValue", e.target.value)} min="0" style={{ ...inputStyle, flex: 1 }} placeholder="0" />
                  <select name="importExportCurrency" value={formData.importExportCurrency || "ZAR"} onChange={(e) => handleInputChange("importExportCurrency", e.target.value)} style={{ ...inputStyle, flex: '0 0 80px', cursor: 'pointer' }}>
                    {currencies.map((c) => <option key={c.value} value={c.value}>{c.value}</option>)}
                  </select>
                </div>
              </FormField>
            )}
          </div>
        </div>

        {/* Contract Operations */}
        <div>
          <SectionHeading title="Contract Operations" />
          <div style={grid3}>
            <FormField label="Operate on a contract basis?" required>
              {renderRadioGroup("operatesOnContract", formData.operatesOnContract)}
            </FormField>
            {operatesOnContract === "yes" && (
              <FormField label="Total contracts value">
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="number" name="totalContractValue" value={formData.totalContractValue || ""} onChange={(e) => handleInputChange("totalContractValue", e.target.value)} min="0" style={{ ...inputStyle, flex: 1 }} placeholder="0" />
                  <select name="contractCurrency" value={formData.contractCurrency || "ZAR"} onChange={(e) => handleInputChange("contractCurrency", e.target.value)} style={{ ...inputStyle, flex: '0 0 80px', cursor: 'pointer' }}>
                    {currencies.map((c) => <option key={c.value} value={c.value}>{c.value}</option>)}
                  </select>
                </div>
              </FormField>
            )}
          </div>
        </div>

        {/* Supplier & Continuity Risk */}
        <div>
          <SectionHeading title="Supplier & Continuity Risk" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            <FormField label="Rely on more than one key supplier?" required>
              {renderRadioGroup("multipleSuppliers", formData.multipleSuppliers)}
            </FormField>
            <FormField label="Documented contingency or continuity plan?" required>
              {renderRadioGroup("contingencyPlan", formData.contingencyPlan)}
            </FormField>
          </div>

          {formData.multipleSuppliers === "yes" && (
            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: "#f9f7f3", borderRadius: "8px", border: "1px solid #d6c4a8" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h5 style={{ color: "#3d2b1f", margin: 0, fontSize: "12px", fontWeight: "600" }}>Supplier References</h5>
                <button type="button" onClick={addSupplier} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', backgroundColor: '#8B4513', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                  + Add Supplier
                </button>
              </div>
              {suppliers.length === 0 ? (
                <p style={{ fontSize: '11px', color: '#999', textAlign: 'center', padding: '12px', margin: 0 }}>
                  No suppliers added yet.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                  {suppliers.map((supplier, idx) => (
                    <div key={idx} style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e8ddd0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#5c3a1e' }}>Supplier {idx + 1}</span>
                        <button type="button" onClick={() => removeSupplier(idx)} style={{ padding: '2px 8px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '3px', cursor: 'pointer', fontSize: '10px', fontWeight: '600' }}>
                          Remove
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <input type="text" value={supplier.name || ""} onChange={(e) => updateSupplier(idx, "name", e.target.value)} placeholder="Company name" style={{ ...inputStyle, padding: '5px 8px', fontSize: '11px' }} />
                        <input type="text" value={supplier.contact || ""} onChange={(e) => updateSupplier(idx, "contact", e.target.value)} placeholder="Contact" style={{ ...inputStyle, padding: '5px 8px', fontSize: '11px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Premises & Facilities */}
        <div>
          <SectionHeading title="Premises & Facilities" />
          <div style={grid3}>
            <FormField label="Premises rented or owned?" required>
              <select name="premisesStatus" value={formData.premisesStatus || ""} onChange={(e) => handleInputChange("premisesStatus", e.target.value)} style={inputStyle} required>
                <option value="">Select</option>
                <option value="owned">Owned</option>
                <option value="rented">Rented</option>
                <option value="both">Both</option>
              </select>
            </FormField>
            {(formData.premisesStatus === "rented" || formData.premisesStatus === "both") && (
              <FormField label="Lease Expiry Date">
                <input type="date" name="leaseExpiryDate" value={formData.leaseExpiryDate || ""} onChange={(e) => handleInputChange("leaseExpiryDate", e.target.value)} style={inputStyle} />
              </FormField>
            )}
            <FormField label="Type of Premises">
              <select name="premisesType" value={formData.premisesType || ""} onChange={(e) => handleInputChange("premisesType", e.target.value)} style={inputStyle}>
                <option value="">Select</option>
                <option value="offices">Offices</option>
                <option value="warehouse">Warehouse</option>
                <option value="factory">Factory</option>
                <option value="workshop">Workshop</option>
                <option value="retail">Retail Space</option>
                <option value="other">Other</option>
              </select>
            </FormField>
            <FormField label="Size (sqm)">
              <input type="number" name="premisesSize" value={formData.premisesSize || ""} onChange={(e) => handleInputChange("premisesSize", e.target.value)} min="0" style={inputStyle} placeholder="e.g., 500" />
            </FormField>
            <FormField label="Branch premises?">
              <select name="hasBranches" value={formData.hasBranches || ""} onChange={(e) => handleInputChange("hasBranches", e.target.value)} style={inputStyle}>
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </FormField>
            {hasBranches && (
              <>
                <FormField label="Number of Branches" required>
                  <input type="number" name="numberOfBranches" value={formData.numberOfBranches || ""} onChange={(e) => handleInputChange("numberOfBranches", e.target.value)} min="0" style={inputStyle} required />
                </FormField>
                <FormField label="Branch Location(s)">
                  <input type="text" name="branchLocations" value={formData.branchLocations || ""} onChange={(e) => handleInputChange("branchLocations", e.target.value)} style={inputStyle} placeholder="e.g., Cape Town, Durban" />
                </FormField>
                <FormField label="Staff at Branches">
                  <input type="number" name="branchStaff" value={formData.branchStaff || ""} onChange={(e) => handleInputChange("branchStaff", e.target.value)} min="0" style={inputStyle} placeholder="0" />
                </FormField>
              </>
            )}
          </div>
        </div>

        {/* Industry Accreditations */}
        <div>
          <SectionHeading title="Industry Accreditations (optional)" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            <FormField label="Select your accreditations">
              <MultiSelectDropdown
                options={industryAccreditationOptions}
                selected={selectedAccreditations}
                onChange={(value) => handleInputChange("industryAccreditations", value)}
                placeholder="Select accreditations..."
              />
            </FormField>

            {/* Recommendation panel next door */}
            <div style={{ padding: '12px', backgroundColor: '#fef9e7', border: '1px solid #fde68a', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Award size={14} color="#92400e" />
                <h5 style={{ fontSize: '11px', fontWeight: '700', color: '#92400e', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Recommended for you
                </h5>
              </div>
              {recommended.length === 0 ? (
                <p style={{ fontSize: '11px', color: '#92400e', margin: 0, lineHeight: '1.5' }}>
                  {sectors.length === 0
                    ? "Select your economic sectors in Entity Overview to see recommendations."
                    : "Great — you've covered the most relevant certifications for your sector."}
                </p>
              ) : (
                <>
                  <p style={{ fontSize: '11px', color: '#78350f', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                    Based on your sector, these certificates may strengthen your profile:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {recommended.map((rec) => (
                      <button
                        key={rec}
                        type="button"
                        onClick={() => handleInputChange("industryAccreditations", [...selectedAccreditations, rec])}
                        style={{ padding: '3px 8px', fontSize: '10px', fontWeight: '600', backgroundColor: 'white', color: '#92400e', border: '1px solid #fcd34d', borderRadius: '12px', cursor: 'pointer' }}
                      >
                        + {rec}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {showOtherAccreditation && (
              <FormField label="Specify other accreditation(s)">
                <input type="text" name="industryAccreditationsOther" value={formData.industryAccreditationsOther || ""} onChange={(e) => handleInputChange("industryAccreditationsOther", e.target.value)} placeholder="SETA, Industry certification..." style={inputStyle} />
              </FormField>
            )}
          </div>
        </div>

        {/* Delivery (Productivity & Reliability) */}
        <div>
          <SectionHeading title="Delivery (Productivity & Reliability)" />
          <div style={grid3}>
            <FormField label="Track operational performance metrics?" required>
              {renderRadioGroup("trackPerformanceMetrics", formData.trackPerformanceMetrics)}
            </FormField>
            <FormField label="3+ successful contracts in past 12 months?" required>
              {renderRadioGroup("threeSuccessfulDeliveries", formData.threeSuccessfulDeliveries)}
            </FormField>
            <FormField label="Capacity to increase output without compromising quality?" required>
              {renderRadioGroup("hasCapacityToIncrease", formData.hasCapacityToIncrease)}
            </FormField>
          </div>
        </div>

        {/* Safety (Risk & Compliance) */}
        <div>
          <SectionHeading title="Safety (Risk & Compliance)" />
          <div style={grid3}>
            <FormField label="Formal safety, risk, or compliance procedures?" required>
              {renderRadioGroup("hasFormalProcedures", formData.hasFormalProcedures)}
            </FormField>
            <FormField label="Major operational incidents in past 24 months?" required>
              {renderRadioGroup("hasMajorIncidents", formData.hasMajorIncidents)}
            </FormField>
          </div>
        </div>

        {/* Operational Challenges */}
        <div>
          <SectionHeading title="Operational Challenges" />
          <FormField label="What are your current operational challenges?">
            <textarea
              name="operationalChallenges"
              value={formData.operationalChallenges || ""}
              onChange={(e) => handleInputChange("operationalChallenges", e.target.value)}
              rows={3}
              placeholder="Describe any operational challenges (supply chain, capacity, skills, technology)..."
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5', padding: '8px 10px' }}
            />
          </FormField>
        </div>

      </div>
    </>
  );
};

export default OperationsOverview;