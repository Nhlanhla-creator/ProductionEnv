import React, { useState, useEffect } from "react"
import ProcurementSidebar from "./ProcurementSidebar"
import ProcurementHeader from "./ProcurementHeader"
import RBACRoleSwitcher from "./RBACRoleSwitcher"
import styles from "../../AdminLayout.module.css"

export default function ProcurementLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const check = () => setCollapsed(document.body.classList.contains("sidebar-collapsed"))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  return (
    <div className="app-layout" style={{ minHeight: "100vh", display: "flex", backgroundColor: "#FAF7F2" }}>
      <ProcurementSidebar />
      <div
        className={`${styles.mainContent || ""} ${collapsed ? styles.sidebarCollapsed || "" : styles.sidebarExpanded || ""}`}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          transition: "margin-left 0.25s ease",
        }}
      >
        <ProcurementHeader />
        
        {/* Workspace Pilot & RBAC Sub-Bar */}
        <div
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #E6D7C3",
            padding: "8px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#4A352F", fontWeight: 700 }}>PRISM Procurement Suite</span>
            <span style={{ color: "#D7CCC8" }}>·</span>
            <span style={{ color: "#2E7D32", fontWeight: 600 }}>Zero-Scraping ERP Coexistence</span>
            <span style={{ color: "#D7CCC8" }}>·</span>
            <span style={{ color: "#8D6E63" }}>POPIA Evidence Minimisation</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <RBACRoleSwitcher />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  )
}
