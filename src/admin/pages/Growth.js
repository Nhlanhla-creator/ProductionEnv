import React, { useState } from "react";
import { ChevronRight } from "lucide-react";

const Growth = () => {
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const resetFromSection = (section) => {
    setSelectedSection(section);
    setSelectedItem(null);
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

  const styles = {
    wrapper: {
      padding: 24,
      background: colors.backgroundBrown,
      minHeight: "100vh"
    },
    title: {
      fontSize: 24,
      color: colors.textBrown,
      marginBottom: 16
    },
    grid: {
      display: "flex",
      gap: 12
    },
    column: {
      width: 260,
      background: colors.lightBrown,
      border: `1px solid ${colors.accentBrown}`,
      borderRadius: 8,
      overflow: "hidden"
    },
    columnHeader: {
      padding: 16,
      background: colors.paleBrown,
      fontWeight: 600,
      color: colors.textBrown,
      borderBottom: `1px solid ${colors.accentBrown}`
    },
    item: {
      padding: "12px 16px",
      borderBottom: `1px solid ${colors.accentBrown}`,
      cursor: "pointer",
      color: colors.textBrown,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontWeight: 500,
      background: "transparent",
      transition: "background 0.2s"
    },
    expandable: {
      background: colors.primaryBrown
    },
    subItem: {
      padding: "10px 16px",
      borderBottom: `1px solid ${colors.accentBrown}`,
      color: colors.textBrown,
      background: colors.backgroundBrown
    }
  };

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>01 GROWTH</h2>

      <div style={styles.grid}>

        {/* COLUMN 2 - Sections */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>Sections</div>
          {Object.keys(structure).map((section) => (
            <div
              key={section}
              onClick={() => resetFromSection(section)}
              style={{
                ...styles.item,
                background: selectedSection === section ? colors.primaryBrown : "transparent"
              }}
            >
              <span>{section}</span>
              <ChevronRight
                size={16}
                style={{
                  transform: selectedSection === section ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                  opacity: 0.7
                }}
              />
            </div>
          ))}
        </div>

        {/* COLUMN 3 - Items (only shown when section is selected) */}
        {selectedSection && (
          <div style={styles.column}>
            <div style={styles.columnHeader}>{selectedSection}</div>
            {structure[selectedSection].items.map((item) => (
              <div
                key={item}
                onClick={() => setSelectedItem(item)}
                style={{
                  ...styles.item,
                  background: selectedItem === item ? colors.primaryBrown : "transparent"
                }}
              >
                <span>{item}</span>
                {structure[selectedSection].children?.[item] && (
                  <ChevronRight
                    size={14}
                    style={{
                      transform: selectedItem === item ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      opacity: 0.7
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* COLUMN 4 - Children (only shown when item with children is selected) */}
        {selectedSection &&
          selectedItem &&
          structure[selectedSection].children?.[selectedItem] && (
            <div style={styles.column}>
              <div style={styles.columnHeader}>{selectedItem}</div>
              {structure[selectedSection].children[selectedItem].map((child) => (
                <div key={child} style={styles.subItem}>
                  {child}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};

export default Growth;