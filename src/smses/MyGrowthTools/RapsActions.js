import React from "react";

const RapsActions = () => {
  return (
    <div style={{ 
      padding: "40px", 
      maxWidth: "1200px", 
      margin: "0 auto", 
      marginTop: "80px",
      backgroundColor: "#fdfcfb",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "30px",
        paddingBottom: "20px",
        borderBottom: "2px solid #e8ddd4",
      }}>
        <div>
          <h1 style={{ color: "#5d4037", fontSize: "28px", fontWeight: "700", margin: 0 }}>
            RAPs Actions
          </h1>
          <p style={{ color: "#8d6e63", fontSize: "15px", margin: "8px 0 0 0" }}>
            Track and manage action items from your RAP meetings
          </p>
        </div>
      </div>

      {/* Placeholder Content */}
      <div style={{ 
        backgroundColor: "#f7f3f0", 
        borderRadius: "8px", 
        padding: "40px",
        textAlign: "center",
        border: "2px dashed #d7ccc8",
      }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
        <h2 style={{ color: "#5d4037", marginBottom: "12px" }}>Coming Soon</h2>
        <p style={{ color: "#8d6e63", fontSize: "16px", maxWidth: "400px", margin: "0 auto" }}>
          The RAPs Actions dashboard is being built.
          This will track action items, owners, status, and due dates.
        </p>
      </div>
    </div>
  );
};

export default RapsActions;