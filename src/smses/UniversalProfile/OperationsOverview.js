import React from "react";
import "./UniversalProfile.css"
import FormField from "./form-field";

const OperationsOverview = ({ data, updateData }) => {
  const handleInputChange = (field, value) => {
    updateData({ [field]: value });
  };

  // Proper radio group with actual input elements
  const renderRadioGroup = (name, currentValue) => (
    <div style={{ display: 'flex', gap: '24px', marginTop: '6px' }}>
      {["yes", "no"].map((val) => (
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

  return (
    <>
      <h2>Operations Overview</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* Section 1 – Supplier & Continuity Risk */}
        <div>
          <SectionHeading number="1" title="Supplier & Continuity Risk" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FormField label="Q1. Do you rely on more than one key supplier for critical inputs or services?" required>
              {renderRadioGroup("multipleSuppliers", data.multipleSuppliers)}
            </FormField>
            <FormField label="Q2. Do you have a documented contingency or continuity plan?" required>
              {renderRadioGroup("contingencyPlan", data.contingencyPlan)}
            </FormField>
          </div>
        </div>

        {/* Section 2 – Delivery */}
        <div>
          <SectionHeading number="2" title="Delivery (Productivity & Reliability)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FormField label="Q3. Do you track operational performance metrics?" required>
              {renderRadioGroup("trackPerformanceMetrics", data.trackPerformanceMetrics)}
            </FormField>
            <FormField label="Q4. Have you delivered at least three contracts successfully in the past 12 months?" required>
              {renderRadioGroup("threeSuccessfulDeliveries", data.threeSuccessfulDeliveries)}
            </FormField>
            <FormField label="Q5. Do you have capacity to increase output without compromising quality?" required>
              {renderRadioGroup("hasCapacityToIncrease", data.hasCapacityToIncrease)}
            </FormField>
          </div>
        </div>

        {/* Section 3 – Safety */}
        <div>
          <SectionHeading number="3" title="Safety (Risk & Compliance)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FormField label="Q6. Do you have formal safety, risk, or compliance procedures?" required>
              {renderRadioGroup("hasFormalProcedures", data.hasFormalProcedures)}
            </FormField>
            <FormField label="Q7. Have you experienced any major operational incidents in the past 24 months?" required>
              {renderRadioGroup("hasMajorIncidents", data.hasMajorIncidents)}
            </FormField>
          </div>
        </div>

        {/* Section 4 – Operational Challenges */}
        <div>
          <SectionHeading number="4" title="Operational Challenges" />
          <FormField label="What are your current operational challenges?">
            <textarea
              name="operationalChallenges"
              value={data.operationalChallenges || ""}
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