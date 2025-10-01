"use client"
import "./universalProfile.css"

const ProgramSponsorInstructions = ({ data, updateData, onComplete }) => {
  return (
    <div className="instructions-container">
      <h2 className="instructions-heading">Instructions</h2>
      <hr className="instructions-divider" />

      <div className="instruction-section">
        <h3 className="instruction-title">Welcome to Program Sponsor Registration</h3>
        <p className="instruction-text">
          Thank you for choosing to partner with us as a Program Sponsor. This comprehensive registration process will
          help us understand your organization and programs better, enabling us to provide you with the best possible
          service, support, and matching capabilities for your internship and training programs.
        </p>
      </div>

      <div className="instruction-section">
        <h3 className="instruction-title">Registration Process Overview:</h3>
        <ol className="instruction-list">
          <li>
            <strong>Entity Overview:</strong> Provide basic organizational information including your
            entity name, type (SETA, Corporate, NPO, Government), registration details, and geographical coverage
            areas. This helps us categorize and route your programs appropriately.
          </li>
          <li>
            <strong>Contact Details:</strong> Submit primary and secondary contact information for
            seamless communication, coordination, and emergency contact purposes. We require both administrative and
            program-specific contacts to ensure efficient operations.
          </li>
          <li>
            <strong>Program Details :</strong> Detailed information about your specific internship/training
            programs including duration, stipend structures, placement volumes, SME contributions, and reporting
            preferences. This critical section helps us match candidates effectively.
          </li>
          <li>
            <strong>Declaration & Consent :</strong> Review and accept legal agreements, data processing
            consent, and partnership terms required for formal collaboration and compliance with applicable
            regulations.
          </li>
        </ol>
      </div>
    </div>
  )
}

export default ProgramSponsorInstructions
