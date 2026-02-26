import "./FundingApplication.css";
import { useState } from "react";
import FormField from "./FormField";
import FileUpload from "./FileUpload";

export const renderGuarantees = (data = {}, updateFormData) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    const newData = { [name]: type === "checkbox" ? checked : value };
    
    // Clear related file uploads when "no" is selected
    if (value === "no") {
      const fileFieldName = name + "Files";
      newData[fileFieldName] = [];
    }
    
    updateFormData("guarantees", newData);
  };

  const handleFileChange = (name, files) => {
    updateFormData("guarantees", { [name]: files });
  };

  const renderYesNoQuestion = (fieldName, label, tooltip = null) => (
    <div className="guarantee-item">
      <FormField label={label} tooltip={tooltip}>
        <div className="radio-group">
          <label className="form-radio-label">
            <input
              type="radio"
              name={fieldName}
              value="yes"
              checked={(data && data[fieldName]) === "yes"}
              onChange={handleChange}
              className="form-radio"
            />
            <span>Yes</span>
          </label>
          <label className="form-radio-label">
            <input
              type="radio"
              name={fieldName}
              value="no"
              checked={(data && data[fieldName]) === "no"}
              onChange={handleChange}
              className="form-radio"
            />
            <span>No</span>
          </label>
        </div>
      </FormField>

      {(data && data[fieldName]) === "yes" && (
        <div style={{ marginTop: "1rem", marginLeft: "1rem" }}>
          <FileUpload
            label={`Upload ${label} Documents`}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
            onChange={(files) => handleFileChange(fieldName + "Files", files)}
            value={(data && data[fieldName + "Files"]) || []}
            multiple="true"
          />
        </div>
      )}
    </div>
  );

  return (
    <>
      <h2>Guarantees</h2>
      <p className="section-description">
        Please indicate which types of guarantees or security instruments your business has access to. 
        These help reduce investment risk and can significantly improve your funding prospects.
      </p>

      {/* Forward Contracts (Revenue Guarantees) */}
      <div className="guarantee-section">
        <h3 className="guarantee-category-title">Forward Contracts (Revenue Guarantees)</h3>
        <div className="guarantee-category">
          <div className="guarantee-grid">
            {renderYesNoQuestion(
              "signedCustomerContracts",
              "Signed customer contracts with clear payment terms",
              "Contracts with customers that include specific payment schedules and terms"
            )}
            
            {renderYesNoQuestion(
              "purchaseOrders",
              "Purchase orders (POs) from reputable buyers",
              "Official purchase orders from established, creditworthy customers"
            )}
            
            {renderYesNoQuestion(
              "offtakeAgreements",
              "Offtake agreements (common in agriculture, mining, manufacturing)",
              "Pre-arranged contracts for the sale of future production output"
            )}
            
            {renderYesNoQuestion(
              "subscriptionRevenue",
              "Subscription revenue from signed clients",
              "Recurring revenue contracts with committed subscribers or clients"
            )}
          </div>
        </div>
      </div>

      {/* Payment of Credit Guarantees */}
      <div className="guarantee-section">
        <h3 className="guarantee-category-title">Payment of Credit Guarantees</h3>
        <div className="guarantee-category">
          <div className="guarantee-grid">
            {renderYesNoQuestion(
              "letterOfGuarantee",
              "Letter of guarantee or letter of credit from a financial institution",
              "Formal guarantees issued by banks or financial institutions"
            )}
            
            {renderYesNoQuestion(
              "thirdPartyGuarantees",
              "Third-party payment guarantees (e.g. parent company guarantees for a subsidiary)",
              "Guarantees from parent companies or other third parties to secure payments"
            )}
            
            {renderYesNoQuestion(
              "factoringAgreements",
              "Factoring agreements (where receivables are already secured against finance)",
              "Arrangements where receivables are sold to a factor for immediate cash"
            )}
            
            {renderYesNoQuestion(
              "suretyBonds",
              "Surety bonds on contracts or performance",
              "Bonds that guarantee contract performance or completion of work"
            )}
          </div>
        </div>
      </div>

      {/* Government or Institutional Support */}
      <div className="guarantee-section">
        <h3 className="guarantee-category-title">Government or Institutional Support</h3>
        <div className="guarantee-category">
          <div className="guarantee-grid">
            {renderYesNoQuestion(
              "governmentContracts",
              "Government contracts or grants (especially multi-year ones)",
              "Contracts or grants from government entities, particularly those with multi-year terms"
            )}
            
            {renderYesNoQuestion(
              "approvedSupplierStatus",
              "Approved supplier status (on a municipal or SOE vendor list)",
              "Official recognition as an approved supplier for government or state-owned enterprises"
            )}
            
            {renderYesNoQuestion(
              "incubatorGuarantees",
              "Incubator or accelerator guarantees (e.g. shared services or guaranteed funding if milestones are hit)",
              "Support guarantees from business incubators or accelerator programs"
            )}
            
            {renderYesNoQuestion(
              "exportCreditGuarantees",
              "Export credit guarantees (for businesses doing cross-border trade)",
              "Credit guarantees specifically for export transactions and cross-border trade"
            )}
          </div>
        </div>
      </div>

      {/* Asset-backed Guarantees */}
      <div className="guarantee-section">
        <h3 className="guarantee-category-title">Asset-backed Guarantees</h3>
        <div className="guarantee-category">
          <div className="guarantee-grid">
            {renderYesNoQuestion(
              "liensCollateral",
              "Liens, collateral, security interests",
              "Legal claims on assets that secure debt or obligations"
            )}
            
            {renderYesNoQuestion(
              "securedAssets",
              "Secured assets used in contract delivery (equipment, stock, IP)",
              "Physical or intellectual property assets that secure contract performance"
            )}
            
            {renderYesNoQuestion(
              "retentionGuarantees",
              "Retention guarantees (e.g. a portion of contract held until performance is completed)",
              "Arrangements where payment is retained until contract completion or performance milestones"
            )}
          </div>
        </div>
      </div>

      {/* Export Credit or Trade Insurance Cover */}
      <div className="guarantee-section">
        <h3 className="guarantee-category-title">Export Credit or Trade Insurance Cover</h3>
        <div className="guarantee-category">
          <div className="guarantee-grid">
            {renderYesNoQuestion(
              "exportCreditInsurance",
              "Export credit or trade insurance cover",
              "Insurance coverage that protects against export credit risks and trade-related losses"
            )}
          </div>
        </div>
      </div>

      {/* Factoring or Receivables Finance Agreements */}
      <div className="guarantee-section">
        <h3 className="guarantee-category-title">Factoring or Receivables Finance Agreements</h3>
        <div className="guarantee-category">
          <div className="guarantee-grid">
            {renderYesNoQuestion(
              "receivablesFinancing",
              "Factoring agreements or receivables-backed financing",
              "Financial arrangements where receivables are used as collateral or sold for immediate cash"
            )}
          </div>
        </div>
      </div>

      {/* Personal or Third-Party Guarantees */}
      <div className="guarantee-section">
        <h3 className="guarantee-category-title">Personal or Third-Party Guarantees</h3>
        <div className="guarantee-category">
          <div className="guarantee-grid">
            {renderYesNoQuestion(
              "personalSurety",
              "Personal surety from directors or shareholders",
              "Personal guarantees provided by company directors or shareholders"
            )}
            
            {renderYesNoQuestion(
              "corporateGuarantees",
              "Corporate guarantees from a partner or holding company",
              "Guarantees provided by partner companies or holding companies"
            )}
          </div>
        </div>
      </div>

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
            Why Guarantees Matter to Investors
          </h4>
          <p style={{
            color: "#6d4c41",
            margin: "0",
            fontSize: "14px",
            lineHeight: "1.5"
          }}>
            <strong>Risk Reduction:</strong> Guarantees significantly reduce investment risk by providing security 
            against potential losses. Having any of these guarantees makes your business more attractive to investors 
            and can lead to better funding terms, lower interest rates, and higher approval rates.
          </p>
        </div>
      </div>

      <style>{`
        .guarantee-section {
          margin-bottom: 2rem;
          border: 1px solid #d7ccc8;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(141, 110, 99, 0.1);
        }

        .guarantee-category-title {
          background: linear-gradient(135deg,rgb(244, 235, 232) 0%,rgb(176, 166, 163) 100%);
          color: white;
          margin: 0;
          padding: 1rem 1.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-bottom: 1px solid #5d4037;
        }

        .guarantee-category {
          padding: 1.5rem;
          background: #faf8f6;
        }

        .guarantee-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .guarantee-item {
          background: white;
          padding: 1.25rem;
          border-radius: 8px;
          border: 1px solid #e8ddd6;
          box-shadow: 0 1px 4px rgba(141, 110, 99, 0.1);
          transition: all 0.2s ease;
        }

        .guarantee-item:hover {
          box-shadow: 0 2px 8px rgba(141, 110, 99, 0.15);
          border-color: #d7ccc8;
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
          .guarantee-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .guarantee-item {
            padding: 1rem;
          }
          
          .guarantee-category {
            padding: 1rem;
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