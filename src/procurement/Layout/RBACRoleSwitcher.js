"use client"

import React from "react"
import { Shield, ChevronDown, Check } from "lucide-react"
import { useProcurementRBAC, BUYER_ROLES } from "../hooks/useProcurementRBAC"

export default function RBACRoleSwitcher() {
  const { activeSubRole, setSubRole, roleMeta, availableRoles } = useProcurementRBAC()
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "5px 12px",
          background: "#FFFFFF",
          border: "1px solid #D7CCC8",
          borderRadius: "20px",
          cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "#4A352F",
        }}
        title="Simulate Buyer Role Privileges (RBAC)"
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: roleMeta.badgeColor,
            display: "inline-block",
          }}
        />
        <span>RBAC Role: <strong>{roleMeta.shortLabel}</strong></span>
        <ChevronDown size={13} color="#8D6E63" />
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              zIndex: 1099,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              width: "280px",
              background: "#FFFFFF",
              borderRadius: "10px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              border: "1px solid #E6D7C3",
              zIndex: 1100,
              padding: "8px 0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "8px 14px",
                borderBottom: "1px solid #F0E6DD",
                fontSize: "0.7rem",
                color: "#8D6E63",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Simulate Buyer Role Access
            </div>

            {availableRoles.map((role) => {
              const isSelected = activeSubRole === role.id
              return (
                <div
                  key={role.id}
                  onClick={() => {
                    setSubRole(role.id)
                    setIsOpen(false)
                  }}
                  style={{
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    cursor: "pointer",
                    background: isSelected ? "rgba(74, 53, 47, 0.06)" : "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "#FAF7F2"
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: role.badgeColor,
                      marginTop: "5px",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4A352F" }}>
                      {role.label}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#8D6E63", marginTop: "2px", lineHeight: "1.3" }}>
                      {role.description}
                    </div>
                  </div>
                  {isSelected && <Check size={14} color="#4A352F" style={{ marginTop: "3px" }} />}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
