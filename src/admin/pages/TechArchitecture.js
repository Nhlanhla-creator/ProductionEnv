import React from "react";

const TechArchitecture = () => {
  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>04 TECH ARCHITECTURE</h1>

      <div style={styles.columns}>
        {/* COLUMN 1 */}
        <div style={styles.column}>
          <Item label="Database Schema" />
          <Item label="Firebase / Supabase" />
          <Item label="APIs" />
          <Item label="Security Auth" />
          <Item label="DevOps Deployment" />
          <Item label="Cost Management" />
        </div>
      </div>
    </div>
  );
};

const Item = ({ label }) => (
  <div style={styles.item}>{label}</div>
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
    fontWeight: 600,
    marginBottom: 16,
    color: "#4a352f",
  },
  columns: {
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
    cursor: "default",
    fontWeight: 500,
    color: "#4a352f",
  },
};

export default TechArchitecture;
