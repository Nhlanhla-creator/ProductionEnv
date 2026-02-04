import React, { useState } from "react";
import { ChevronRight } from "lucide-react";

const ProductPlatform = () => {
  const [level1, setLevel1] = useState(null);
  const [level2, setLevel2] = useState(null);
  const [level3, setLevel3] = useState(null);

  const resetFromLevel1 = (value) => {
    setLevel1(value);
    setLevel2(null);
    setLevel3(null);
  };

  const resetFromLevel2 = (value) => {
    setLevel2(value);
    setLevel3(null);
  };

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>03 PRODUCT PLATFORM</h1>

      <div style={styles.grid}>
        {/* COLUMN 1 */}
        <div style={styles.column}>
          <ExpandableItem
            label="Platform Modules"
            active={level1 === "platform-modules"}
            onClick={() => resetFromLevel1("platform-modules")}
          />
          <Item label="Messaging and alerts" />
          <Item label="Customer services" />
          <Item label="User flows" />
          <Item label="UX requirements" />
        </div>

        {/* COLUMN 2 */}
        {level1 === "platform-modules" && (
          <div style={styles.column}>
            <Item label="SME Onboarding" />
            <ExpandableItem
              label="BIG Score"
              active={level2 === "big-score"}
              onClick={() => resetFromLevel2("big-score")}
            />
            <Item label="Matching Engine" />
            <Item label="Dashboards" />
            <ExpandableItem
              label="Payments"
              active={level2 === "payments"}
              onClick={() => resetFromLevel2("payments")}
            />
            <Item label="API Integrations" />
          </div>
        )}

        {/* COLUMN 3 */}
        {level2 === "big-score" && (
          <div style={styles.column}>
            <Item label="Overview & Definitions" />
            <ExpandableItem
              label="Scoring Logic"
              active={level3 === "scoring-logic"}
              onClick={() => setLevel3("scoring-logic")}
            />
            <ExpandableItem
              label="Improve BIG Score"
              active={level3 === "improve-big-score"}
              onClick={() => setLevel3("improve-big-score")}
            />
          </div>
        )}

        {level2 === "payments" && (
          <div style={styles.column}>
            <Item label="payment-gateways" />
            <Item label="invoicing" />
            <Item label="refunds" />
          </div>
        )}

        {/* COLUMN 4 */}
        {level3 === "scoring-logic" && (
          <div style={styles.column}>
            <Item label="BIG_Score_Methodology" />
            <Item label="Scoring_Logic_Rules" />
            <Item label="Lifestyle_Models" />
            <Item label="Validation_Framework" />
            <Item label="AI_ML_Models" />
            <Item label="Training_Data" />
            <Item label="Funder_Feedback" />
          </div>
        )}

        {level3 === "improve-big-score" && (
          <div style={styles.column}>
            <Item label="Compliance Score" />
            <Item label="Legitimacy Score" />
            <Item label="Leadership Score" />
            <Item label="Governance Score" />
            <Item label="Capital Appeal Score" />
          </div>
        )}
      </div>
    </div>
  );
};

const Item = ({ label }) => (
  <div style={styles.item}>{label}</div>
);

const ExpandableItem = ({ label, onClick, active }) => (
  <div onClick={onClick} style={{ ...styles.item, ...styles.expandable }}>
    <span>{label}</span>
    <ChevronRight
      size={16}
      style={{
        transform: active ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 0.2s",
        opacity: 0.7,
      }}
    />
  </div>
);

const styles = {
  wrapper: {
    padding: 24,
    marginLeft: 280,
    background: "#faf7f2",
    minHeight: "100vh",
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  grid: {
    display: "flex",
    gap: 12,
  },
  column: {
    width: 260,
    background: "#f0e6d9",
    border: "1px solid #e0d6c8",
  },
  item: {
    padding: "10px 14px",
    borderBottom: "1px solid #e6d7c3",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontWeight: 500,
  },
  expandable: {
    background: "#fff",
  },
};

export default ProductPlatform;
