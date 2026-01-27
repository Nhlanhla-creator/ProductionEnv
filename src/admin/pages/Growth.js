import React, { useState } from "react";
import { ChevronRight } from "lucide-react";

const Growth = () => {
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
    "Strategy Vision": {
      items: [
        "Vision Mission",
        "Platform Thesis",
        "Unicorn Roadmap",
        "Market Problem Definition",
        "Competitive Analysis",
        "ESG ESD Strategy",
        "Expansion Roadmap",
        "Financial Models",
        "Budgets Forecasts"
      ]
    },

    "Finance & Funding": {
      items: [
        "Funding Rounds",
        "Investor Decks",
        "Grant Applications",
        "Revenue Models"
      ],
      children: {
        "Funding Rounds": ["Pre-Seed", "Seed", "Series A"]
      }
    },

    "Marketing & Branding": {
      items: [
        "Brand Positioning",
        "Website Content",
        "Thought Leadership",
        "BIG Pulse",
        "Campaigns",
        "Partnerships Comms",
        "Asset Design & Templates"
      ],
      children: {
        "Asset Design & Templates": [
          "Brand Guidelines",
          "Logos",
          "UI Designs",
          "Pitch Visuals",
          "Diagrams"
        ]
      }
    }
  };

  return (
    <div style={{ padding: 24, background: colors.backgroundBrown }}>
      <h2 style={{ color: colors.textBrown, marginBottom: 16 }}>
        01 GROWTH
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
          GROWTH
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
          {selectedSection ? (
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
                {structure[selectedSection].children?.[item] && (
                  <ChevronRight size={14} />
                )}
              </div>
            ))
          ) : (
            <div style={{ color: colors.darkBrown }}>
              Select a section
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
                  style={{
                    padding: "10px",
                    marginBottom: 6,
                    borderRadius: 6,
                    border: `1px solid ${colors.accentBrown}`,
                    background: colors.backgroundBrown,
                    color: colors.textBrown
                  }}
                >
                  {child}
                </div>
              )
            )
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

export default Growth;
