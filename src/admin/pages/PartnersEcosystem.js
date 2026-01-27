import React, { useState } from "react";
import { ChevronRight } from "lucide-react";

const PartnersEcosystem = () => {
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const colors = {
    lightBrown: "#f5f0e1",
    mediumBrown: "#e6d7c3",
    accentBrown: "#c8b6a6",
    primaryBrown: "#a67c52",
    darkBrown: "#7d5a50",
    textBrown: "#4a352f",
    backgroundBrown: "#faf7f2",
    paleBrown: "#f0e6d9"
  };

  const structure = {
    "Funders Investors": {
      items: []
    },

    "Service Providers": {
      items: [
        "onboarded-vendors",
        "vendor-agreements",
        "vendor-communications"
      ]
    },

    "Corporates ESD": {
      items: []
    },

    "Government": {
      items: []
    },

    "MOUs Agreements": {
      items: []
    },

    "Product Platform": {
      items: [
        "Product Overview",
        "Feature Roadmap",
        "MVP Definition",
        "SME Onboarding",
        "BIG Score"
      ],
      children: {
        "SME Onboarding": ["Overview & Definitions"],
        "BIG Score": ["Scoring Logic"]
      }
    }
  };

  const deepChildren = {
    "Scoring Logic": [
      "BIG Score Methodology",
      "Scoring Logic Rules",
      "Lifecycle Models",
      "Validation Framework",
      "AI / ML Models",
      "Training Data",
      "Funder Feedback"
    ]
  };

  return (
    <div style={{ padding: 24, background: colors.backgroundBrown }}>
      <h2 style={{ color: colors.textBrown, marginBottom: 16 }}>
        02 PARTNERS ECOSYSTEM
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 260px 300px 1fr",
          border: `1px solid ${colors.accentBrown}`,
          borderRadius: 10,
          overflow: "hidden",
          background: colors.lightBrown
        }}
      >
        {/* COLUMN 1 */}
        <div
          style={{
            padding: 16,
            borderRight: `1px solid ${colors.accentBrown}`,
            background: colors.paleBrown,
            fontWeight: 600,
            color: colors.textBrown
          }}
        >
          PARTNERS ECOSYSTEM
        </div>

        {/* COLUMN 2 */}
        <div
          style={{
            padding: 16,
            borderRight: `1px solid ${colors.accentBrown}`
          }}
        >
          {Object.keys(structure).map((section) => (
            <div
              key={section}
              onClick={() => {
                setSelectedSection(section);
                setSelectedItem(null);
              }}
              style={{
                padding: "10px",
                marginBottom: 6,
                borderRadius: 6,
                cursor: "pointer",
                background:
                  selectedSection === section
                    ? colors.mediumBrown
                    : "transparent",
                color: colors.textBrown,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              {section}
              <ChevronRight size={16} />
            </div>
          ))}
        </div>

        {/* COLUMN 3 */}
        <div
          style={{
            padding: 16,
            borderRight: `1px solid ${colors.accentBrown}`
          }}
        >
          {selectedSection &&
          structure[selectedSection].items.length > 0 ? (
            structure[selectedSection].items.map((item) => (
              <div
                key={item}
                onClick={() => setSelectedItem(item)}
                style={{
                  padding: "10px",
                  marginBottom: 6,
                  borderRadius: 6,
                  cursor: "pointer",
                  background:
                    selectedItem === item
                      ? colors.mediumBrown
                      : colors.backgroundBrown,
                  border: `1px solid ${colors.accentBrown}`,
                  color: colors.textBrown,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                {item}
                {(structure[selectedSection].children?.[item] ||
                  deepChildren[item]) && (
                  <ChevronRight size={14} />
                )}
              </div>
            ))
          ) : (
            <div style={{ color: colors.darkBrown }}>
              Select a category
            </div>
          )}
        </div>

        {/* COLUMN 4 */}
        <div style={{ padding: 16 }}>
          {selectedSection &&
          selectedItem &&
          structure[selectedSection].children?.[selectedItem] ? (
            structure[selectedSection].children[selectedItem].map(
              (child) => (
                <div
                  key={child}
                  onClick={() => setSelectedItem(child)}
                  style={{
                    padding: "10px",
                    marginBottom: 6,
                    borderRadius: 6,
                    border: `1px solid ${colors.accentBrown}`,
                    background: colors.backgroundBrown,
                    color: colors.textBrown,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  {child}
                  {deepChildren[child] && (
                    <ChevronRight size={14} />
                  )}
                </div>
              )
            )
          ) : deepChildren[selectedItem] ? (
            deepChildren[selectedItem].map((item) => (
              <div
                key={item}
                style={{
                  padding: "10px",
                  marginBottom: 6,
                  borderRadius: 6,
                  border: `1px solid ${colors.accentBrown}`,
                  background: colors.backgroundBrown,
                  color: colors.textBrown
                }}
              >
                {item}
              </div>
            ))
          ) : (
            <div style={{ color: colors.darkBrown }}>
              Select an item to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnersEcosystem;
