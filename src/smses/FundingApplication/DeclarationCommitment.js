import FormField from "./FormField";
import FileUpload from "./FileUpload";
import "./FundingApplication.css" ;

export const renderDeclarationCommitment = (data, updateFormData) => {
  const handleChange = (e) => {
    const { name, checked } = e.target;
    updateFormData("declarationCommitment", { [name]: checked });
  };

  const handleFileChange = (name, files) => {
    updateFormData("declarationCommitment", { [name]: files });
  };

  return (
    <>
      <h2>Declaration & Commitment</h2>

      <div className="info-box">
        <h3>Declaration of Intent</h3>
        <p>
          I hereby declare my intention to participate fully in the funding or support program if selected. I
          understand that my active participation and commitment are essential for the success of this initiative.
        </p>
        <div className="form-field">
          <label className="form-checkbox-label">
            <input
              type="checkbox"
              name="confirmIntent"
              checked={data.confirmIntent || false}
              onChange={handleChange}
              className="form-checkbox"
              required
            />
            <span>I confirm my intent to participate fully in the program</span>
          </label>
        </div>
      </div>

      <div className="info-box">
        <h3>Reporting Requirements</h3>
        <p>
          I understand that if selected for funding or support, I will be required to provide regular progress reports
          and financial updates as specified in the program guidelines. I commit to meeting all reporting deadlines
          and providing accurate information.
        </p>
        <div className="form-field">
          <label className="form-checkbox-label">
            <input
              type="checkbox"
              name="commitReporting"
              checked={data.commitReporting || false}
              onChange={handleChange}
              className="form-checkbox"
              required
            />
            <span>I commit to fulfilling all reporting requirements</span>
          </label>
        </div>
      </div>

      <div className="info-box">
        <h3>Consent to Share Profile</h3>
        <p>
          I consent to having my business profile and application information shared with relevant funders, partners,
          and support organizations for the purpose of assessment, matching with opportunities, and providing
          appropriate support.
        </p>
        <div className="form-field">
          <label className="form-checkbox-label">
            <input
              type="checkbox"
              name="consentShare"
              checked={data.consentShare || false}
              onChange={handleChange}
              className="form-checkbox"
              required
            />
            <span>I consent to the sharing of my profile with relevant funders and partners</span>
          </label>
        </div>
      </div>

    
    </>
  );
};