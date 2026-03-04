import React from "react";
import "./UniversalProfile.css"
import FormField from "./form-field";

const OperationsOverview = ({ data, updateData }) => {
  const handleInputChange = (field, value) => {
    updateData("operationsOverview", { [field]: value });
  };

  const renderRadioGroup = (name, label, value) => (
    <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <input
          type="radio"
          name={name}
          value="yes"
          checked={value === "yes"}
          onChange={(e) => handleInputChange(name, e.target.value)}
          style={{ width: '16px', height: '16px' }}
        />
        <span>Yes</span>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <input
          type="radio"
          name={name}
          value="no"
          checked={value === "no"}
          onChange={(e) => handleInputChange(name, e.target.value)}
          style={{ width: '16px', height: '16px' }}
        />
        <span>No</span>
      </label>
    </div>
  );

  return (
    <>
      <h2>Operations Overview</h2>
    
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {/* Section 1 */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
            1. Supplier & Continuity Risk
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FormField label="Q1. Do you rely on more than one key supplier for critical inputs or services?" required>
              {renderRadioGroup("multipleSuppliers", data.multipleSuppliers)}
            </FormField>
            <FormField label="Q2. Do you have a documented contingency or continuity plan?" required>
              {renderRadioGroup("contingencyPlan", data.contingencyPlan)}
            </FormField>
          </div>
        </div>

        {/* Section 2 */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
            2. Delivery (Productivity & Reliability)
          </h3>
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

        {/* Section 3 */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
            3. Safety (Risk & Compliance)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FormField label="Q6. Do you have formal safety, risk, or compliance procedures?" required>
              {renderRadioGroup("hasFormalProcedures", data.hasFormalProcedures)}
            </FormField>
            <FormField label="Q7. Have you experienced any major operational incidents in the past 24 months?" required>
              {renderRadioGroup("hasMajorIncidents", data.hasMajorIncidents)}
            </FormField>
          </div>
        </div>
      </div>
    </>
  );
};

export default OperationsOverview;