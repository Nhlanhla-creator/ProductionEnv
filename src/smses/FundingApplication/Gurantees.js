import "./FundingApplication.css";
import { useState } from "react";
import FormField from "./FormField";
import FileUpload from "./FileUpload";

// Level 1: Security Category options
const SECURITY_CATEGORIES = [
  { value: "revenueBacked", label: "Revenue-Backed Security" },
  { value: "paymentSecurity", label: "Payment Security" },
  { value: "assetSecurity", label: "Asset Security" },
  { value: "institutionalSupport", label: "Institutional Support" },
  { value: "existingFinancing", label: "Existing Financing / Existing Security" },
  { value: "other", label: "Other" },
];

// Level 2: Security Instrument options, dependent on Level 1 category
const INSTRUMENTS_BY_CATEGORY = {
  revenueBacked: [
    "Signed Customer Contract",
    "Master Service Agreement",
    "Framework Agreement",
    "Supply Agreement",
    "Service Level Agreement",
    "Preferred Supplier Agreement",
    "Panel Appointment",
    "Distribution Agreement",
    "Licensing Agreement",
    "Purchase Order",
    "Blanket Purchase Order",
    "Call-Off Order",
    "Work Order",
    "Delivery Order",
    "Offtake Agreement",
    "Subscription Agreement",
    "Maintenance Contract",
    "Managed Services Contract",
    "Government Contract",
    "SOE Contract",
    "Municipal Contract",
    "Multi-Year Service Agreement",
  ],
  paymentSecurity: [
    "Letter of Credit",
    "Standby Letter of Credit",
    "Bank Guarantee",
    "Performance Guarantee",
    "Advance Payment Guarantee",
    "Bid Bond",
    "Performance Bond",
    "Retention Bond",
    "Parent Company Guarantee",
    "Corporate Guarantee",
    "Shareholder Guarantee",
    "Director Guarantee",
    "Third-Party Guarantee",
    "Trade Credit Insurance",
    "Export Credit Insurance",
    "Political Risk Insurance",
    "Contract Frustration Insurance",
  ],
  assetSecurity: [
    "Property",
    "Land",
    "Buildings",
    "Vehicles",
    "Equipment",
    "Plant and Machinery",
    "Inventory / Stock",
    "Raw Materials",
    "Accounts Receivable",
    "Intellectual Property",
    "Trademarks",
    "Patents",
    "Software Assets",
    "Licensing Rights",
    "Cession of Receivables",
    "General Notarial Bond",
    "Special Notarial Bond",
    "Lien",
    "Pledge",
  ],
  institutionalSupport: [
    "Approved Government Grant",
    "Incentive Approval",
    "Subsidy Approval",
    "Grant Award Letter",
    "Approved Supplier Status",
    "Preferred Supplier Status",
    "ESD Programme Participation",
    "Corporate Sponsorship",
    "Accelerator Acceptance",
    "Incubator Support Letter",
    "DFI Support Letter",
    "Development Partner Commitment",
  ],
  existingFinancing: [
    "Factoring Agreement",
    "Invoice Discounting Facility",
    "Receivables Finance Facility",
    "Supply Chain Finance Facility",
    "Asset Finance Agreement",
    "Lease Finance Agreement",
    "Existing Bank Security",
    "Existing Cession",
    "Existing Guarantee",
    "Existing Security Registration",
    "Existing Charge",
  ],
};

// Common counterparty types
const COUNTERPARTY_TYPES = [
  "Private Company",
  "Public Company",
  "Government / Public Sector",
  "State-Owned Entity (SOE)",
  "Bank / Financial Institution",
  "Development Finance Institution (DFI)",
  "Individual",
  "NGO / Non-Profit",
  "Other",
];

const createEmptyInstrument = () => ({
  id: `si_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  category: "",
  instrument: "",
  instrumentOther: "",
  files: [],
  counterpartyName: "",
  counterpartyType: "",
  counterpartyTypeOther: "",
  value: "",
  startDate: "",
  endDate: "",
  paymentTerms: "",
  isSigned: "",
  isCurrent: "",
  isAssignable: "",
  isFunderConsentRequired: "",
  notes: "",
});

export const renderGuarantees = (data = {}, updateFormData) => {
  const instruments = (data && data.securityInstruments) || [];

  const saveInstruments = (updated) => {
    updateFormData("guarantees", { securityInstruments: updated });
  };

  const addInstrument = () => {
    saveInstruments([...instruments, createEmptyInstrument()]);
  };

  const removeInstrument = (id) => {
    saveInstruments(instruments.filter((item) => item.id !== id));
  };

  const updateInstrumentField = (id, field, value) => {
    const updated = instruments.map((item) => {
      if (item.id !== id) return item;

      const next = { ...item, [field]: value };

      // Reset dependent fields when the category changes
      if (field === "category") {
        next.instrument = "";
        next.instrumentOther = "";
      }

      // Reset counterparty type free-text when a non-"Other" type is picked
      if (field === "counterpartyType" && value !== "Other") {
        next.counterpartyTypeOther = "";
      }

      return next;
    });

    saveInstruments(updated);
  };

  const handleInstrumentFileChange = (id, files) => {
    updateInstrumentField(id, "files", files);
  };

  const renderInstrumentYesNo = (instrument, fieldName, label) => (
    <FormField label={label}>
      <div className="radio-group">
        <label className="form-radio-label">
          <input
            type="radio"
            name={`${instrument.id}_${fieldName}`}
            value="yes"
            checked={instrument[fieldName] === "yes"}
            onChange={() => updateInstrumentField(instrument.id, fieldName, "yes")}
            className="form-radio"
          />
          <span>Yes</span>
        </label>
        <label className="form-radio-label">
          <input
            type="radio"
            name={`${instrument.id}_${fieldName}`}
            value="no"
            checked={instrument[fieldName] === "no"}
            onChange={() => updateInstrumentField(instrument.id, fieldName, "no")}
            className="form-radio"
          />
          <span>No</span>
        </label>
      </div>
    </FormField>
  );

  const renderInstrumentCard = (instrument, index) => {
    const categoryLabel =
      SECURITY_CATEGORIES.find((c) => c.value === instrument.category)?.label || "";
    const instrumentOptions = INSTRUMENTS_BY_CATEGORY[instrument.category] || [];

    return (
      <div className="security-instrument-card" key={instrument.id}>
        <div className="instrument-header">
          <span className="instrument-header-title">
            {categoryLabel
              ? `${index + 1}. ${categoryLabel}${instrument.instrument ? ` — ${instrument.instrument}` : ""}`
              : `${index + 1}. New Security Instrument`}
          </span>
          <button
            type="button"
            className="remove-instrument-btn"
            onClick={() => removeInstrument(instrument.id)}
            aria-label="Remove security instrument"
          >
            ✕ Remove
          </button>
        </div>

        <div className="instrument-grid-two-col">
          <FormField label="Security Category">
            <select
              className="form-select"
              value={instrument.category}
              onChange={(e) => updateInstrumentField(instrument.id, "category", e.target.value)}
            >
              <option value="">Select a category...</option>
              {SECURITY_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </FormField>

          {instrument.category === "other" ? (
            <FormField label="Please specify the security instrument">
              <input
                type="text"
                className="form-input"
                value={instrument.instrumentOther}
                onChange={(e) => updateInstrumentField(instrument.id, "instrumentOther", e.target.value)}
                placeholder="Describe the security instrument"
              />
            </FormField>
          ) : (
            <FormField label="Security Instrument">
              <select
                className="form-select"
                value={instrument.instrument}
                onChange={(e) => updateInstrumentField(instrument.id, "instrument", e.target.value)}
                disabled={!instrument.category}
              >
                <option value="">
                  {instrument.category ? "Select an instrument..." : "Select a category first"}
                </option>
                {instrumentOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </div>

        <div style={{ marginTop: "1rem" }}>
          <FileUpload
            label="Upload Supporting Documents (e.g. contract, PO, delivery schedule, pricing schedule)"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
            onChange={(files) => handleInstrumentFileChange(instrument.id, files)}
            value={instrument.files || []}
            multiple="true"
          />
        </div>

        <div className="instrument-grid-two-col" style={{ marginTop: "1rem" }}>
          <FormField label="Counterparty Name">
            <input
              type="text"
              className="form-input"
              value={instrument.counterpartyName}
              onChange={(e) => updateInstrumentField(instrument.id, "counterpartyName", e.target.value)}
              placeholder="e.g. Company or institution name"
            />
          </FormField>

          <FormField label="Counterparty Type">
            <select
              className="form-select"
              value={instrument.counterpartyType}
              onChange={(e) => updateInstrumentField(instrument.id, "counterpartyType", e.target.value)}
            >
              <option value="">Select a type...</option>
              {COUNTERPARTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {instrument.counterpartyType === "Other" && (
          <div style={{ marginTop: "1rem" }}>
            <FormField label="Please specify counterparty type">
              <input
                type="text"
                className="form-input"
                value={instrument.counterpartyTypeOther}
                onChange={(e) => updateInstrumentField(instrument.id, "counterpartyTypeOther", e.target.value)}
              />
            </FormField>
          </div>
        )}

        <div className="instrument-grid-two-col" style={{ marginTop: "1rem" }}>
          <FormField label="Contract / Security Value (R)">
            <input
              type="text"
              className="form-input"
              value={instrument.value}
              onChange={(e) => updateInstrumentField(instrument.id, "value", e.target.value)}
              placeholder="e.g. R500,000"
            />
          </FormField>

          <FormField label="Payment Terms (if applicable)">
            <input
              type="text"
              className="form-input"
              value={instrument.paymentTerms}
              onChange={(e) => updateInstrumentField(instrument.id, "paymentTerms", e.target.value)}
              placeholder="e.g. 30 days from invoice"
            />
          </FormField>
        </div>

        <div className="instrument-grid-two-col" style={{ marginTop: "1rem" }}>
          <FormField label="Start Date">
            <input
              type="date"
              className="form-input"
              value={instrument.startDate}
              onChange={(e) => updateInstrumentField(instrument.id, "startDate", e.target.value)}
            />
          </FormField>

          <FormField label="End Date / Expiry Date">
            <input
              type="date"
              className="form-input"
              value={instrument.endDate}
              onChange={(e) => updateInstrumentField(instrument.id, "endDate", e.target.value)}
            />
          </FormField>
        </div>

        <div className="instrument-grid-two-col" style={{ marginTop: "1rem" }}>
          {renderInstrumentYesNo(instrument, "isSigned", "Is the document signed?")}
          {renderInstrumentYesNo(instrument, "isCurrent", "Is the document current?")}
        </div>

        <div className="instrument-grid-two-col" style={{ marginTop: "1rem" }}>
          {renderInstrumentYesNo(instrument, "isAssignable", "Is assignment / cession allowed?")}
          {renderInstrumentYesNo(instrument, "isFunderConsentRequired", "Is funder consent required?")}
        </div>

        <div style={{ marginTop: "1rem" }}>
          <FormField label="Notes / Comments">
            <textarea
              className="form-textarea"
              value={instrument.notes}
              onChange={(e) => updateInstrumentField(instrument.id, "notes", e.target.value)}
              placeholder="Any additional context about this security instrument"
              rows={3}
            />
          </FormField>
        </div>
      </div>
    );
  };

  return (
    <>
      <h2>Guarantees & Collateral</h2>
      <p className="section-description">
        Add every contract, purchase order, guarantee, collateral or existing security arrangement
        that strengthens your funding profile. For each item, select a category and instrument type,
        upload the supporting document, and provide a few key details. You can add as many security
        instruments as apply to your business.
      </p>

      <div className="security-instruments-list">
        {instruments.length === 0 && (
          <div className="empty-state">
            No security instruments added yet. Click "+ Add Security Instrument" below to get started.
          </div>
        )}

        {instruments.map((instrument, index) => renderInstrumentCard(instrument, index))}
      </div>

      <button type="button" className="add-instrument-btn" onClick={addInstrument}>
        + Add Security Instrument
      </button>

      {/* Information Box */}
      <div style={{
        backgroundColor: "#faf8f6",
        border: "2px solid #8d6e63",
        borderRadius: "8px",
        padding: "16px",
        margin: "20px 0",
        display: "flex",
        alignItems: "start",
        gap: "12px"
      }}>
        <div style={{
          backgroundColor: "#8d6e63",
          color: "white",
          borderRadius: "50%",
          width: "24px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          fontWeight: "bold",
          flexShrink: 0
        }}>
          💡
        </div>
        <div>
          <h4 style={{
            color: "#5d4037",
            margin: "0 0 8px 0",
            fontSize: "16px",
            fontWeight: "600"
          }}>
            Why Guarantees & Collateral Matter to Investors
          </h4>
          <p style={{
            color: "#6d4c41",
            margin: "0",
            fontSize: "14px",
            lineHeight: "1.5"
          }}>
            <strong>Risk Reduction:</strong> Security instruments like contracts, guarantees and collateral
            significantly reduce investment risk. A smaller contract with clean payment terms and clear
            assignment rights can be more fundable than a larger contract with harsh terms — so the more
            detail and documentation you provide, the better funders can assess your profile.
          </p>
        </div>
      </div>

      <style>{`
        .security-instruments-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .empty-state {
          background: #faf8f6;
          border: 1px dashed #d7ccc8;
          border-radius: 8px;
          padding: 2rem 1.5rem;
          text-align: center;
          color: #8d6e63;
          font-size: 0.95rem;
        }

        .security-instrument-card {
          background: white;
          border: 1px solid #e8ddd6;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 4px rgba(141, 110, 99, 0.1);
        }

        .instrument-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e8ddd6;
        }

        .instrument-header-title {
          font-weight: 600;
          color: #5d4037;
          font-size: 1rem;
        }

        .remove-instrument-btn {
          background: transparent;
          border: 1px solid #d7ccc8;
          color: #a1887f;
          border-radius: 6px;
          padding: 0.35rem 0.75rem;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .remove-instrument-btn:hover {
          background: #fbe9e7;
          border-color: #e57373;
          color: #c62828;
        }

        .add-instrument-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #8d6e63;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0.7rem 1.4rem;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 1.5rem;
        }

        .add-instrument-btn:hover {
          background: #6d4c41;
        }

        .instrument-grid-two-col {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1rem;
        }

        .form-select,
        .form-input,
        .form-textarea {
          width: 100%;
          padding: 0.55rem 0.75rem;
          border: 1px solid #d7ccc8;
          border-radius: 6px;
          font-size: 0.9rem;
          color: #3e2723;
          background-color: white;
          font-family: inherit;
          box-sizing: border-box;
        }

        .form-select:focus,
        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #8d6e63;
          box-shadow: 0 0 0 2px rgba(141, 110, 99, 0.15);
        }

        .form-textarea {
          resize: vertical;
        }

        .section-description {
          color: #6d4c41;
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 2rem;
          padding: 1rem;
          background-color: #f3e8dc;
          border-radius: 6px;
          border-left: 4px solid #8d6e63;
        }

        .radio-group {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .form-radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          color: #5d4037;
        }

        .form-radio {
          width: 1rem;
          height: 1rem;
          accent-color: #8d6e63;
        }

        .form-radio:checked {
          background-color: #8d6e63;
          border-color: #8d6e63;
        }

        @media (max-width: 768px) {
          .instrument-grid-two-col {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .security-instrument-card {
            padding: 1rem;
          }

          .instrument-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
};

const Guarantees = ({ data = {}, updateData }) => {
  return renderGuarantees(data, updateData);
};

export default Guarantees;