import { useState } from "react";
import { Info } from "lucide-react";
import "./FundingApplication.css" ;

const FormField = ({ label, children, required, tooltip, className }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`form-field ${className}`}>
      <div className="form-field-label">
        <label>
          {label} {required && <span className="required">*</span>}
        </label>
        {tooltip && (
          <div className="form-field-tooltip">
            <Info
              className="tooltip-icon"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            />
            {showTooltip && <div className="tooltip-content">{tooltip}</div>}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

export default FormField;