import React, { useState, useEffect } from "react";
import "./UniversalProfile.css";
import FormField from "./form-field";

// ── Currencies ──
const currencies = [
  { value: "ZAR", label: "ZAR - South African Rand" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "NGN", label: "NGN - Nigerian Naira" },
];

// ── Import/Export options ──
const importExportOptions = [
  { value: "import", label: "Import" },
  { value: "export", label: "Export" },
  { value: "both", label: "Both" },
  { value: "none", label: "None" },
];

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

  // Radio Group Component
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

  return (
    <>
      <h2>Operations Overview</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* ============================================================ */}
        {/* SECTION 1: Outsourcing & Value Chain - 3 per row */}
        {/* ============================================================ */}
        <div>
          <SectionHeading number="1" title="Outsourcing & Value Chain" />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
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

        {/* ============================================================ */}
        {/* SECTION 2: Import / Export - Dropdown */}
        {/* ============================================================ */}
        <div>
          <SectionHeading number="2" title="Import / Export" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
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

        {/* ============================================================ */}
        {/* SECTION 3: Contract Operations - 3 per row */}
        {/* ============================================================ */}
        <div>
          <SectionHeading number="3" title="Contract Operations" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
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

        {/* ============================================================ */}
        {/* SECTION 4: Supplier & Continuity Risk - 3 per row */}
        {/* ============================================================ */}
        <div>
          <SectionHeading number="4" title="Supplier & Continuity Risk" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
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
              <h5 style={{ color: "#3d2b1f", marginBottom: "0.75rem", fontSize: "14px" }}>Supplier References</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                {/* Supplier 1 */}
                <div>
                  <label style={{ fontSize: "13px", color: "#5c4a3a", marginBottom: "4px", display: "block", fontWeight: "500" }}>
                    Supplier 1 - Company Name
                  </label>
                  <input
                    type="text"
                    name="supplier1Name"
                    value={formData.supplier1Name || ""}
                    onChange={(e) => handleInputChange("supplier1Name", e.target.value)}
                    style={inputStyle}
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#5c4a3a", marginBottom: "4px", display: "block", fontWeight: "500" }}>
                    Supplier 1 - Contact
                  </label>
                  <input
                    type="text"
                    name="supplier1Contact"
                    value={formData.supplier1Contact || ""}
                    onChange={(e) => handleInputChange("supplier1Contact", e.target.value)}
                    style={inputStyle}
                    placeholder="Telephone No."
                  />
                </div>

                {/* Supplier 2 */}
                <div>
                  <label style={{ fontSize: "13px", color: "#5c4a3a", marginBottom: "4px", display: "block", fontWeight: "500" }}>
                    Supplier 2 - Company Name
                  </label>
                  <input
                    type="text"
                    name="supplier2Name"
                    value={formData.supplier2Name || ""}
                    onChange={(e) => handleInputChange("supplier2Name", e.target.value)}
                    style={inputStyle}
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#5c4a3a", marginBottom: "4px", display: "block", fontWeight: "500" }}>
                    Supplier 2 - Contact
                  </label>
                  <input
                    type="text"
                    name="supplier2Contact"
                    value={formData.supplier2Contact || ""}
                    onChange={(e) => handleInputChange("supplier2Contact", e.target.value)}
                    style={inputStyle}
                    placeholder="Telephone No."
                  />
                </div>

                {/* Supplier 3 */}
                <div>
                  <label style={{ fontSize: "13px", color: "#5c4a3a", marginBottom: "4px", display: "block", fontWeight: "500" }}>
                    Supplier 3 - Company Name
                  </label>
                  <input
                    type="text"
                    name="supplier3Name"
                    value={formData.supplier3Name || ""}
                    onChange={(e) => handleInputChange("supplier3Name", e.target.value)}
                    style={inputStyle}
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#5c4a3a", marginBottom: "4px", display: "block", fontWeight: "500" }}>
                    Supplier 3 - Contact
                  </label>
                  <input
                    type="text"
                    name="supplier3Contact"
                    value={formData.supplier3Contact || ""}
                    onChange={(e) => handleInputChange("supplier3Contact", e.target.value)}
                    style={inputStyle}
                    placeholder="Telephone No."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SECTION 5: Premises & Facilities - 3 per row */}
        {/* ============================================================ */}
        <div>
          <SectionHeading number="5" title="Premises & Facilities" />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <FormField label="Premises rented or owned?" required>
              <select 
                name="premisesStatus" 
                value={formData.premisesStatus || ""} 
                onChange={(e) => handleInputChange("premisesStatus", e.target.value)} 
                style={inputStyle} 
                required
              >
                <option value="">Select</option>
                <option value="rented">Rented</option>
                <option value="owned">Owned</option>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
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

        {/* ============================================================ */}
        {/* SECTION 6: Delivery (Productivity & Reliability) - 3 per row */}
        {/* ============================================================ */}
        <div>
          <SectionHeading number="6" title="Delivery (Productivity & Reliability)" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
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

        {/* ============================================================ */}
        {/* SECTION 7: Safety (Risk & Compliance) - 3 per row */}
        {/* ============================================================ */}
        <div>
          <SectionHeading number="7" title="Safety (Risk & Compliance)" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <FormField label="Do you have formal safety, risk, or compliance procedures?" required>
              {renderRadioGroup("hasFormalProcedures", formData.hasFormalProcedures)}
            </FormField>

            <FormField label="Have you experienced any major operational incidents in the past 24 months?" required>
              {renderRadioGroup("hasMajorIncidents", formData.hasMajorIncidents)}
            </FormField>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 8: Operational Challenges - Full Width */}
        {/* ============================================================ */}
        <div>
          <SectionHeading number="8" title="Operational Challenges" />

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