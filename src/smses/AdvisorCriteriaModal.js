import React from "react";
import { Users, X } from "lucide-react";

const AdvisorCriteriaModal = ({ onAccept, onCancel }) => {
  const criteria = [
    "Bachelor's degree or equivalent professional certification",
    "At least 5 years of professional SME experience",
    "No criminal convictions or professional misconduct",
    "Passion for supporting SMEs with ethical advice",
    "Able to provide 2 professional references",
  ];

  return (
    <div className="modal-overlay">
      <div className="advisor-criteria-modal">
        <button className="modal-close" onClick={onCancel}>
          <X size={18} />
        </button>

        <div className="modal-header">
          <div className="modal-icon">
            <Users size={24} color="white" />
          </div>
          <h3>Become a BIG Marketplace Advisor</h3>
          <p>Confirm you meet these minimum requirements:</p>
        </div>

        <div className="criteria-list">
          {criteria.map((criterion, index) => (
            <div key={index} className="criterion-item">
              <div className="criterion-check">✓</div>
              <span>{criterion}</span>
            </div>
          ))}
        </div>

        <div className="confirmation-box">
          <p>
            By clicking "I Accept", you confirm meeting these requirements
            and agree to BIG Marketplace's Advisor Code of Conduct.
          </p>
        </div>

        <div className="modal-actions">
          <button className="btn-accept" onClick={onAccept}>
            I Accept
          </button>
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvisorCriteriaModal;