import FormField from "./FormField";
import FileUpload from "./FileUpload";
import "./FundingApplication.css";

// Currency formatter function
const formatCurrency = (value) => {
  if (!value) return '';
  const numericValue = value.replace(/[^\d]/g, '');
  if (!numericValue) return '';
  return `R ${parseInt(numericValue).toLocaleString()}`;
};

// Parse currency value back to number for storage
const parseCurrency = (value) => {
  return value.replace(/[^\d]/g, '');
};

export const renderSocialImpact = (data, updateFormData) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle currency formatting for CSI/CSR spend and local procurement fields
    if (name === 'csiCsrSpend' || name === 'localProcurementSpend' || name === 'communityInvestmentAmount') {
      const formattedValue = formatCurrency(value);
      updateFormData("socialImpact", { [name]: formattedValue });
    } else {
      updateFormData("socialImpact", { [name]: value });
    }
  };

  const handleFileChange = (name, files) => {
    updateFormData("socialImpact", { [name]: files });
  };

  return (
    <>
      <h2>Social Impact & Alignment</h2>

      {/* First Row: Jobs Created + CSI/CSR Spend */}
      <div className="grid-container" style={{ marginBottom: '1rem' }}>
        <div>
          <FormField label="Jobs to be Created (Next 12 months)" >
            <input
              type="number"
              name="jobsToCreate"
              value={data.jobsToCreate || ""}
              onChange={handleChange}
              className="form-input"
              placeholder="Number of jobs"
              required
            />
          </FormField>
        </div>

        <div>
          <FormField label="CSI/CSR Spend" >
            <input
              type="text"
              name="csiCsrSpend"
              value={data.csiCsrSpend || ""}
              onChange={handleChange}
              className="form-input"
              placeholder="R 0"
              required
              style={{ color: data.csiCsrSpend ? 'black' : '#9CA3AF' }}
            />
          </FormField>
        </div>
      </div>

      {/* Second Row: Demographic Percentages - All on one line */}
      <div className="grid-container" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <FormField label="% Black" >
            <input
              type="number"
              name="blackOwnership"
              value={data.blackOwnership || ""}
              onChange={handleChange}
              className="form-input"
              placeholder="%"
              min="0"
              max="100"
              required
            />
          </FormField>
        </div>

        <div>
          <FormField label="% Women" >
            <input
              type="number"
              name="womenOwnership"
              value={data.womenOwnership || ""}
              onChange={handleChange}
              className="form-input"
              placeholder="%"
              min="0"
              max="100"
              required
            />
          </FormField>
        </div>

        <div>
          <FormField label="% Youth" >
            <input
              type="number"
              name="youthOwnership"
              value={data.youthOwnership || ""}
              onChange={handleChange}
              className="form-input"
              placeholder="%"
              min="0"
              max="100"
              required
            />
          </FormField>
        </div>

        <div>
          <FormField label="% Disabled" >
            <input
              type="number"
              name="disabledOwnership"
              value={data.disabledOwnership || ""}
              onChange={handleChange}
              className="form-input"
              placeholder="%"
              min="0"
              max="100"
              required
            />
          </FormField>
        </div>
      </div>

      {/* Local Value Creation Section */}
      <div style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>Local Value Creation</h3>
        
        <div className="grid-container" style={{ marginBottom: '1rem' }}>
          <div>
            <FormField label="Local Procurement Spend (Annual)" >
              <input
                type="text"
                name="localProcurementSpend"
                value={data.localProcurementSpend || ""}
                onChange={handleChange}
                className="form-input"
                placeholder="R 0"
                required
                style={{ color: data.localProcurementSpend ? 'black' : '#9CA3AF' }}
              />
            </FormField>
          </div>

          <div>
            <FormField label="Local Employees to be Hired" >
              <input
                type="number"
                name="localEmployeesHired"
                value={data.localEmployeesHired || ""}
                onChange={handleChange}
                className="form-input"
                placeholder="Number of local hires"
                required
              />
            </FormField>
          </div>
        </div>

        <div className="form-field" style={{ marginBottom: '1rem' }}>
          <FormField label="Local Value Creation Strategy">
            <textarea
              name="localValueStrategy"
              value={data.localValueStrategy || ""}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Describe your strategy for creating local value through procurement, hiring, and community engagement"
              rows={3}
            ></textarea>
          </FormField>
        </div>
      </div>

      {/* CSR/CSI Investment Section */}
      <div style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>CSR/CSI Investment</h3>
        
        <div className="grid-container" style={{ marginBottom: '1rem' }}>
          <div>
            <FormField label="Community Investment Amount (Annual)" >
              <input
                type="text"
                name="communityInvestmentAmount"
                value={data.communityInvestmentAmount || ""}
                onChange={handleChange}
                className="form-input"
                placeholder="R 0"
                required
                style={{ color: data.communityInvestmentAmount ? 'black' : '#9CA3AF' }}
              />
            </FormField>
          </div>

          <div>
            <FormField label="Number of Beneficiaries" >
              <input
                type="number"
                name="numberOfBeneficiaries"
                value={data.numberOfBeneficiaries || ""}
                onChange={handleChange}
                className="form-input"
                placeholder="Expected beneficiaries"
                required
              />
            </FormField>
          </div>
        </div>

        <div className="form-field" style={{ marginBottom: '1rem' }}>
          <FormField label="Social Investment in Communities">
            <textarea
              name="socialInvestmentCommunities"
              value={data.socialInvestmentCommunities || ""}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Describe your planned social investments in local communities, including education, healthcare, infrastructure, or skills development programs"
              rows={4}
              required
            ></textarea>
          </FormField>
        </div>

        <div className="form-field" style={{ marginBottom: '1rem' }}>
          <FormField label="CSR/CSI Focus Areas">
            <textarea
              name="csrFocusAreas"
              value={data.csrFocusAreas || ""}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Specify your key focus areas (e.g., education, healthcare, environmental conservation, youth development, etc.)"
              rows={3}
            ></textarea>
          </FormField>
        </div>
      </div>

      <div className="form-field" style={{ marginBottom: '1rem' }}>
        <FormField label="Environmental or Community Impact (if applicable)">
          <textarea
            name="environmentalImpact"
            value={data.environmentalImpact || ""}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Describe any environmental or community impact your project will have"
            rows={3}
          ></textarea>
        </FormField>
      </div>

      <div className="form-field" style={{ marginBottom: '1rem' }}>
        <FormField label="Alignment with SDGs or ESD priorities">
          <textarea
            name="sdgAlignment"
            value={data.sdgAlignment || ""}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Describe how your project aligns with Sustainable Development Goals or ESD priorities"
            rows={3}
          ></textarea>
        </FormField>
      </div>

      {/* <div className="section-divider">
        <h3>Required Documents</h3>

        <FileUpload
          label="Optional Impact Statement (free-text or upload)"
          accept=".pdf,.doc,.docx"
          onChange={(files) => handleFileChange("impactStatement", files)}
          value={data.impactStatement || []}
        />
      </div> */}
    </>
  );
};