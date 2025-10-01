import React from 'react';
import { CheckCircle } from 'lucide-react';
import { sections } from "./applicationOptions";
import { useNavigate } from "react-router-dom";
import './ProductApplication.css';

const ProductApplicationTracker = ({ 
  activeSection, 
  completedSections = {}, 
  onSectionChange 
}) => {
  const navigate = useNavigate();

  const handleClick = (sectionId) => {
    const section = sections.find(s => s.id === sectionId);
    navigate(`/applications/product/${section.path}`);
    if (onSectionChange) {
      onSectionChange(sectionId);
    }
  };

  return (
    <div className="profile-tracker">
      <div className="profile-tracker-inner">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`profile-tracker-button ${
              activeSection === section.id ? "active" : ""
            } ${
              completedSections[section.id] ? "completed" : ""
            }`}
            onClick={() => handleClick(section.id)}
          >
            <div className="tracker-label">
              {section.label.split("\n").map((line, i) => (
                <span key={i} className="tracker-label-line">{line}</span>
              ))}
            </div>
            {completedSections[section.id] && (
              <CheckCircle className="check-icon" size={14} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductApplicationTracker;