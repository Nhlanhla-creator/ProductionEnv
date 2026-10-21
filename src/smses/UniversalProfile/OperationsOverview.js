import React, { useState, useEffect, useRef } from "react";
import { HelpCircle, ChevronDown, X, Check } from "lucide-react";
import "./UniversalProfile.css";
import FormField from "./form-field";

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

const MultiSelectDropdown = ({ options, selected = [], onChange, placeholder = "Select options..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeTag = (e, value) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full min-h-[42px] px-3 py-2 border border-brown-300 rounded-md cursor-pointer flex flex-wrap items-center gap-1 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white"
        style={{ borderColor: "#d6c4a8" }}
      >
        {selected.length === 0 ? (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        ) : (
          selected.map((val) => (
            <span
              key={val}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: "#f3ebe0", color: "#6b4c2a", border: "1px solid #d6c4a8" }}
            >
              {val === "Other" ? "Other" : val}
              <button onClick={(e) => removeTag(e, val)} className="hover:opacity-70 transition-opacity" type="button">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          style={{ color: "#9c7a5a" }}
        />
      </div>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
          style={{ borderColor: "#d6c4a8" }}
        >
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm hover:bg-amber-50 transition-colors"
                style={{ color: "#3d2b1f" }}
              >
                <div
                  className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border"
                  style={{
                    borderColor: isSelected ? "#8b5e3c" : "#d6c4a8",
                    backgroundColor: isSelected ? "#8b5e3c" : "transparent",
                  }}
                >
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

const OperationsOverview = ({ data, updateData }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setFormData(data || {});
  }, [data]);

  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    updateData(newData);
  };

  const renderRadioGroup = (name, currentValue, options = ["yes", "no"]) => (
    <div style={{ display: 'flex', gap: '24px', marginTop: '6px', flexWrap: 'wrap' }}>
      {options.map((val) => (
        <label
          key={val}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            userSelect: 'none',
            fontSize: '14px',
            fontWeight: '500',
            color: '#3d2b1f',
          }}
        >
          <input
            type="radio"
            name={name}
            value={val}
            checked={currentValue === val}
            onChange={(e) => handleInputChange(name, e.target.value)}
            style={{
              position: 'absolute',
              opacity: 0,
              width: 0,
              height: 0,
              margin: 0,
            }}
          />
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: `2px solid ${currentValue === val ? '#8B4513' : '#ccc'}`,
              backgroundColor: currentValue === val ? '#8B4513' : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease',
              boxShadow: currentValue === val ? '0 0 0 3px rgba(139,69,19,0.12)' : 'none',
            }}
          >
            {currentValue === val && (
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'white',
              }} />
            )}
          </div>
          <span style={{ textTransform: 'capitalize' }}>{val}</span>
        </label>
      ))}
    </div>
  );

  const SectionHeading = ({ number, title }) => (
    <div style={{
      borderBottom: '2px solid #C19A6B',
      marginBottom: '1.25rem',
      paddingBottom: '6px',
    }}>
      <h3 style={{
        fontSize: '15px',
        fontWeight: '700',
        color: '#6B3410',
        margin: 0,
        letterSpacing: '0.3px',
      }}>
        {number}. {title}
      </h3>
    </div>
  );

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
  };

  const hasBranches = formData.hasBranches === "yes";
  const outsourcesValueChain = formData.outsourcesValueChain;
  const importExport = formData.importExport;
  const operatesOnContract = formData.operatesOnContract;

  const selectedAccreditations = Array.isArray(formData.industryAccreditations)
    ? formData.industryAccreditations
    : [];
  const showOtherAccreditation = selectedAccreditations.includes("Other");

  // ── Dynamic suppliers ──────────────────────────────────────────────────
  const suppliers = Array.isArray(formData.suppliers) ? formData.suppliers : [];

  const addSupplier = () => {
    handleInputChange("suppliers", [...suppliers, { name: "", contact: "" }]);
  };
  const updateSupplier = (idx, field, value) => {
    const next = [...suppliers];
    next[idx] = { ...next[idx], [field]: value };
    handleInputChange("suppliers", next);
  };
  const removeSupplier = (idx) => {
    const next = suppliers.filter((_, i) => i !== idx);
    handleInputChange("suppliers", next);
  };

  return (
    <>
      <h2>Operations Overview</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* SECTION 1: Outsourcing & Value Chain */}
        <div>
          <SectionHeading number="1" title="Outsourcing & Value Chain" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <FormField label="Do you contract any part of your value chain?" required>
              {renderRadioGroup("outsourcesValueChain", formData.outsourcesValueChain)}
            </FormField>
          </div>

          {outsourcesValueChain === "yes" && (
            <div style={{
              marginTop: '12px',
              padding: '1rem',
              backgroundColor: "#f9f7f3",
              borderRadius: "8px",
              border: "1px solid #d6c4a8"
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <FormField label="Which services are outsourced?">
                  <input
                    type="text"
                    name="outsourcedServices"
                    value={formData.outsourcedServices || ""}
                    onChange={(e) => handleInputChange("outsourcedServices", e.target.value)}
                    style={inputStyle}
                    placeholder="e.g., Logistics, IT, Manufacturing"
                  />
                </FormField>
                <FormField label="Annual value of outsourced services">
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

        {/* SECTION 2: Import / Export */}
        <div>
          <SectionHeading number="2" title="Import / Export" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <FormField label="Do you Import and/or Export?" required>
              <select
                name="importExport"
                value={formData.importExport || "none"}
                onChange={(e) => handleInputChange("importExport", e.target.value)}
                style={inputStyle}
              >
                {importExportOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>

            {importExport !== "none" && (
              <>
                <FormField label="Annual value">
                  <input
                    type="number"
                    name="importExportValue"
                    value={formData.importExportValue || ""}
                    onChange={(e) => handleInputChange("importExportValue", e.target.value)}
                    min="0"
                    style={inputStyle}
                    placeholder="0"
                  />
                </FormField>
                <FormField label="Currency">
                  <select
                    name="importExportCurrency"
                    value={formData.importExportCurrency || "ZAR"}
                    onChange={(e) => handleInputChange("importExportCurrency", e.target.value)}
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

        {/* SECTION 3: Contract Operations */}
        <div>
          <SectionHeading number="3" title="Contract Operations" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <FormField label="Do you operate on a contract basis?" required>
              {renderRadioGroup("operatesOnContract", formData.operatesOnContract)}
            </FormField>

            {operatesOnContract === "yes" && (
              <>
                <FormField label="Total contracts value">
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

        {/* SECTION 4: Supplier & Continuity Risk - Dynamic suppliers */}
        <div>
          <SectionHeading number="4" title="Supplier & Continuity Risk" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <FormField label="Do you rely on more than one key supplier for critical inputs or services?" required>
              {renderRadioGroup("multipleSuppliers", formData.multipleSuppliers)}
            </FormField>

            <FormField label="Do you have a documented contingency or continuity plan?" required>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h5 style={{ color: "#3d2b1f", margin: 0, fontSize: "14px", fontWeight: "600" }}>Supplier References</h5>
                <button
                  type="button"
                  onClick={addSupplier}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '6px 12px', backgroundColor: '#8B4513', color: 'white',
                    border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  + Add Supplier
                </button>
              </div>

              {suppliers.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '16px', margin: 0 }}>
                  No suppliers added yet. Click "Add Supplier" to get started.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {suppliers.map((supplier, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto',
                        gap: '12px',
                        alignItems: 'end',
                        padding: '10px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e8ddd0'
                      }}
                    >
                      <FormField label={`Supplier ${idx + 1} - Company Name`}>
                        <input
                          type="text"
                          value={supplier.name || ""}
                          onChange={(e) => updateSupplier(idx, "name", e.target.value)}
                          style={inputStyle}
                          placeholder="Company Name"
                        />
                      </FormField>
                      <FormField label={`Supplier ${idx + 1} - Contact`}>
                        <input
                          type="text"
                          value={supplier.contact || ""}
                          onChange={(e) => updateSupplier(idx, "contact", e.target.value)}
                          style={inputStyle}
                          placeholder="Telephone No."
                        />
                      </FormField>
                      <button
                        type="button"
                        onClick={() => removeSupplier(idx)}
                        style={{
                          padding: '8px 12px', backgroundColor: '#fef2f2', color: '#dc2626',
                          border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer',
                          fontSize: '12px', fontWeight: '600', marginBottom: '16px'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 5: Premises & Facilities - with BOTH option */}
        <div>
          <SectionHeading number="5" title="Premises & Facilities" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <FormField label="Premises rented or owned?" required>
              <select
                name="premisesStatus"
                value={formData.premisesStatus || ""}
                onChange={(e) => handleInputChange("premisesStatus", e.target.value)}
                style={inputStyle}
                required
              >
                <option value="">Select</option>
                <option value="owned">Owned</option>
                <option value="rented">Rented</option>
                <option value="both">Both</option>
              </select>
            </FormField>

            {(formData.premisesStatus === "rented" || formData.premisesStatus === "both") && (
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

            <FormField label="Type of Premises">
              <select
                name="premisesType"
                value={formData.premisesType || ""}
                onChange={(e) => handleInputChange("premisesType", e.target.value)}
                style={inputStyle}
              >
                <option value="">Select</option>
                <option value="offices">Offices</option>
                <option value="warehouse">Warehouse</option>
                <option value="factory">Factory</option>
                <option value="workshop">Workshop</option>
                <option value="retail">Retail Space</option>
                <option value="other">Other</option>
              </select>
            </FormField>

            <FormField label="Size of Premises (sqm)">
              <input
                type="number"
                name="premisesSize"
                value={formData.premisesSize || ""}
                onChange={(e) => handleInputChange("premisesSize", e.target.value)}
                min="0"
                style={inputStyle}
                placeholder="e.g., 500"
              />
            </FormField>
          </div>

          <FormField label="Other premises (branches) rented or owned?">
            <select
              name="hasBranches"
              value={formData.hasBranches || ""}
              onChange={(e) => handleInputChange("hasBranches", e.target.value)}
              style={inputStyle}
            >
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </FormField>

          {hasBranches && (
            <div style={{
              marginTop: '12px',
              padding: '1rem',
              backgroundColor: "#f9f7f3",
              borderRadius: "8px",
              border: "1px solid #d6c4a8"
            }}>
              <h5 style={{ color: "#3d2b1f", marginBottom: "0.75rem", fontSize: "14px" }}>Branch Information</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <FormField label="Number of Branches" required>
                  <input
                    type="number"
                    name="numberOfBranches"
                    value={formData.numberOfBranches || ""}
                    onChange={(e) => handleInputChange("numberOfBranches", e.target.value)}
                    min="0"
                    style={inputStyle}
                    required
                  />
                </FormField>
                <FormField label="Branch Location(s)">
                  <input
                    type="text"
                    name="branchLocations"
                    value={formData.branchLocations || ""}
                    onChange={(e) => handleInputChange("branchLocations", e.target.value)}
                    style={inputStyle}
                    placeholder="e.g., Cape Town, Durban"
                  />
                </FormField>
                <FormField label="Staff at Branches">
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

        {/* SECTION 6: Industry Accreditations */}
        <div>
          <SectionHeading number="6" title="Industry Accreditations (optional)" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <FormField label="Select your accreditations">
              <MultiSelectDropdown
                options={industryAccreditationOptions}
                selected={selectedAccreditations}
                onChange={(value) => handleInputChange("industryAccreditations", value)}
                placeholder="Select accreditations..."
              />
            </FormField>

            {showOtherAccreditation && (
              <FormField label="Please specify other accreditation(s)">
                <input
                  type="text"
                  name="industryAccreditationsOther"
                  value={formData.industryAccreditationsOther || ""}
                  onChange={(e) => handleInputChange("industryAccreditationsOther", e.target.value)}
                  placeholder="e.g. SETA accreditation, Industry-specific certification..."
                  style={inputStyle}
                />
              </FormField>
            )}
          </div>
        </div>

        {/* SECTION 7: Delivery */}
        <div>
          <SectionHeading number="7" title="Delivery (Productivity & Reliability)" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <FormField label="Do you track operational performance metrics?" required>
              {renderRadioGroup("trackPerformanceMetrics", formData.trackPerformanceMetrics)}
            </FormField>
            <FormField label="Have you delivered at least three contracts successfully in the past 12 months?" required>
              {renderRadioGroup("threeSuccessfulDeliveries", formData.threeSuccessfulDeliveries)}
            </FormField>
            <FormField label="Do you have capacity to increase output without compromising quality?" required>
              {renderRadioGroup("hasCapacityToIncrease", formData.hasCapacityToIncrease)}
            </FormField>
          </div>
        </div>

        {/* SECTION 8: Safety */}
        <div>
          <SectionHeading number="8" title="Safety (Risk & Compliance)" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <FormField label="Do you have formal safety, risk, or compliance procedures?" required>
              {renderRadioGroup("hasFormalProcedures", formData.hasFormalProcedures)}
            </FormField>
            <FormField label="Have you experienced any major operational incidents in the past 24 months?" required>
              {renderRadioGroup("hasMajorIncidents", formData.hasMajorIncidents)}
            </FormField>
          </div>
        </div>

        {/* SECTION 9: Operational Challenges */}
        <div>
          <SectionHeading number="9" title="Operational Challenges" />
          <FormField label="What are your current operational challenges?">
            <textarea
              name="operationalChallenges"
              value={formData.operationalChallenges || ""}
              onChange={(e) => handleInputChange("operationalChallenges", e.target.value)}
              rows={4}
              placeholder="Describe any operational challenges your business is currently facing (e.g. supply chain disruptions, capacity constraints, skills gaps, technology limitations)"
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
};

export default OperationsOverview;