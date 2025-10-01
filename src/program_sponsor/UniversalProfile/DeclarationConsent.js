"use client"
import { useState, useEffect } from "react" // Import useEffect for initial data sync
import "./universalProfile.css"

const ProgramSponsorDeclarationConsent = ({ data, updateData }) => {
  // Initialize local state with default values for all expected fields
  // and then merge with any existing data from props.
  const [agreements, setAgreements] = useState(() => ({
    accuracy: data?.accuracy || false,
    dataProcessing: data?.dataProcessing || false,
    termsConditions: data?.termsConditions || false,
    communicationConsent: data?.communicationConsent || false,
    reportingCompliance: data?.reportingCompliance || false,
    programSponsorshipDeclaration: data?.programSponsorshipDeclaration || false, // Added this missing field
  }))

  // Use useEffect to update local state if the 'data' prop changes from parent
  useEffect(() => {
    setAgreements((prevAgreements) => ({
      ...prevAgreements, // Keep existing local state for fields not in new data
      accuracy: data?.accuracy ?? prevAgreements.accuracy,
      dataProcessing: data?.dataProcessing ?? prevAgreements.dataProcessing,
      termsConditions: data?.termsConditions ?? prevAgreements.termsConditions,
      communicationConsent: data?.communicationConsent ?? prevAgreements.communicationConsent,
      reportingCompliance: data?.reportingCompliance ?? prevAgreements.reportingCompliance,
      programSponsorshipDeclaration:
        data?.programSponsorshipDeclaration ?? prevAgreements.programSponsorshipDeclaration,
    }))
  }, [data])

  const handleAgreementChange = (key) => {
    const newAgreements = {
      ...agreements,
      [key]: !agreements[key],
    }
    setAgreements(newAgreements)
    updateData && updateData(newAgreements)
  }

  return (
    <div className="declaration-consent-container">
      <h2 className="section-heading">Declaration & Consent</h2>
      <hr className="instructions-divider" />
      <p>Please carefully review and accept the following declarations and consents to complete your registration.</p>

      <div className="consent-box">
        <h3 className="consent-title">| Declaration of Accuracy</h3>
        <p>
          I hereby declare that all information provided in this Universal Profile is true, accurate, and complete to
          the best of my knowledge. I understand that any false or misleading information may result in the rejection of
          my profile or termination of any agreements that may arise from this profile.
        </p>
        <label className="checkbox-row">
          <input type="checkbox" checked={agreements.accuracy} onChange={() => handleAgreementChange("accuracy")} />
          <span> I confirm that all information provided is accurate and complete</span>
        </label>
      </div>

      <div className="consent-box">
        <h3 className="consent-title">| Consent for Data Processing</h3>
        <p>
          I consent to the collection, processing, and storage of the personal and business information provided in this
          Universal Profile. I understand that this information will be used for the purposes of business verification,
          matching with relevant opportunities, and providing personalized recommendations and support.
        </p>
        <p>
          I understand that my information may be shared with third parties for the purposes of verification and
          matching, but only with my explicit consent for each specific instance of sharing.
        </p>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={agreements.dataProcessing}
            onChange={() => handleAgreementChange("dataProcessing")}
          />
          <span> I consent to the collection and processing of my data as described</span>
        </label>
      </div>

      <div className="consent-box">
        <h3 className="consent-title">| Consent for Communication</h3>
        <p>
          I consent to receive communications from BIG Marketplace regarding program updates, new opportunities, and
          relevant information via email or phone. I understand that I can opt-out of these communications at any time.
        </p>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={agreements.communicationConsent}
            onChange={() => handleAgreementChange("communicationConsent")}
          />
          <span> I consent to receive communications</span>
        </label>
      </div>

      <div className="consent-box">
        <h3 className="consent-title">| Reporting and Compliance Agreement</h3>
        <p>
          I agree to comply with all reporting requirements and compliance standards set forth by BIG Marketplace for
          the programs I participate in. This includes providing timely and accurate data as requested.
        </p>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={agreements.reportingCompliance}
            onChange={() => handleAgreementChange("reportingCompliance")}
          />
          <span> I agree to reporting and compliance terms</span>
        </label>
      </div>

      <div className="consent-box">
        <h3 className="consent-title">| Declaration of Program Sponsorship</h3>
        <p>
          I hereby declare that I am authorized to act as a sponsor for the programs listed and that all information
          provided is accurate and truthful to the best of my knowledge. I understand that providing false or misleading
          information may result in disqualification or other penalties.
        </p>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={agreements.programSponsorshipDeclaration}
            onChange={() => handleAgreementChange("programSponsorshipDeclaration")}
          />
          <span> I declare the above statement is true</span>
        </label>
      </div>
    </div>
  )
}

export default ProgramSponsorDeclarationConsent
