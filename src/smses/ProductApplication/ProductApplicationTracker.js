"use client"

import React from 'react'
import { CheckCircle, ChevronRight } from 'lucide-react'
import { sections } from "./applicationOptions"
import './ProductApplication.css'

const ProductApplicationTracker = ({ 
  activeSection, 
  completedSections = {}, 
  onSectionChange,
  embedded = false 
}) => {
  const handleClick = (sectionId) => {
    if (onSectionChange) {
      onSectionChange(sectionId)
    }
  }

  return (
    <div 
      className="profile-tracker" 
      style={{
        width: "100%",
        maxWidth: "100%",
        overflowX: "auto",
        padding: embedded ? "5px 0" : "10px 0",
        margin: embedded ? "0 0 15px 0" : "20px 0",
        boxSizing: "border-box",
        backgroundColor: embedded ? "#fff" : "transparent",
        borderRadius: embedded ? "6px" : "0",
        border: embedded ? "1px solid #e0e0e0" : "none",
      }}
    >
      <div 
        className="profile-tracker-inner" 
        style={{
          display: "flex",
          gap: embedded ? "4px" : "8px",
          justifyContent: "center",
          alignItems: "center",
          minWidth: "max-content",
          padding: "0 10px",
        }}
      >
        {sections.map((section, index) => (
          <React.Fragment key={section.id}>
            <button
              onClick={() => handleClick(section.id)}
              type="button"
              className={`profile-tracker-button ${
                activeSection === section.id ? "active" : ""
              } ${
                completedSections[section.id] ? "completed" : "pending"
              }`}
              style={{
                minWidth: embedded ? "80px" : "100px",
                maxWidth: embedded ? "120px" : "190px",
                padding: embedded ? "6px 4px" : "10px 8px",
                fontSize: embedded ? "0.7rem" : "clamp(0.7rem, 1.5vw, 0.9rem)",
                lineHeight: 1.2,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                wordBreak: "break-word",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                minHeight: embedded ? "45px" : "60px",
                backgroundColor: embedded ? "#f5f5f5" : "inherit",
                border: embedded ? "1px solid #ddd" : "none",
                borderRadius: embedded ? "4px" : "0",
              }}
            >
              {section.label.split("\n").map((line, i) => (
                <span 
                  key={i} 
                  style={{ 
                    display: "block", 
                    margin: "1px 0", 
                    fontSize: embedded ? "0.65rem" : "inherit" 
                  }}
                >
                  {line}
                </span>
              ))}
              {completedSections[section.id] && (
                <CheckCircle 
                  style={{ 
                    position: "absolute", 
                    top: 2, 
                    right: 2, 
                    width: embedded ? "12px" : "16px", 
                    height: embedded ? "12px" : "16px" 
                  }} 
                />
              )}
            </button>

            {/* Optional visual separator between steps */}
            {index < sections.length - 1 && (
              <div
                style={{
                  width: embedded ? "12px" : "20px",
                  height: "2px",
                  backgroundColor: completedSections[section.id] ? "#4CAF50" : "#ddd",
                  transition: "background-color 0.3s ease",
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default ProductApplicationTracker