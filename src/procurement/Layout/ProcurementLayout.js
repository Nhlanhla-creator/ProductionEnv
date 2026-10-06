import React, { useState, useEffect } from "react"
import ProcurementSidebar from "./ProcurementSidebar"
import ProcurementHeader from "./ProcurementHeader"
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

        <div style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  )
}
