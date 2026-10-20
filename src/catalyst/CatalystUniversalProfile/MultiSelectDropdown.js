"use client"

import React, { useState, useEffect, useRef } from "react"

export default function MultiSelectDropdown({
  options = [],
  selected = [],
  onChange,
  placeholder = "Select options...",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggle = (value) => {
    if (disabled) return
    const isSel = selected.includes(value)
    if (isSel) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const removeTag = (e, value) => {
    e.stopPropagation()
    if (disabled) return
    onChange(selected.filter((v) => v !== value))
  }

  const getLabel = (value) => {
    const found = options.find((o) => (o.value !== undefined ? o.value === value : o.id === value))
    return found ? (found.label || found.name) : value
  }

  const normalizedOptions = options.map((opt) => ({
    value: opt.value !== undefined ? opt.value : opt.id,
    label: opt.label || opt.name || opt.value || opt.id,
    description: opt.description,
  }))

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => !disabled && setIsOpen((p) => !p)}
        style={{
          border: isOpen ? "1.5px solid #795548" : "1px solid #d7ccc8",
          borderRadius: "6px",
          padding: "6px 10px",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "6px",
          minHeight: "42px",
          backgroundColor: disabled ? "#f5f5f5" : "#ffffff",
          fontSize: "14px",
          boxShadow: isOpen ? "0 0 0 2px rgba(121, 85, 72, 0.15)" : "none",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        }}
      >
        {selected.length === 0 ? (
          <span style={{ color: "#a1887f", fontSize: "13px" }}>{placeholder}</span>
        ) : (
          selected.map((val) => (
            <span
              key={val}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                backgroundColor: "#f3ebe0",
                border: "1px solid #d7ccc8",
                color: "#4e342e",
                borderRadius: "14px",
                padding: "3px 10px",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              {getLabel(val)}
              {!disabled && (
                <span
                  onClick={(e) => removeTag(e, val)}
                  style={{
                    cursor: "pointer",
                    lineHeight: 1,
                    opacity: 0.7,
                    fontSize: "13px",
                    fontWeight: "bold",
                    marginLeft: "2px",
                  }}
                  title="Remove"
                >
                  ✕
                </span>
              )}
            </span>
          ))
        )}
        <span
          style={{
            marginLeft: "auto",
            color: "#8d6e63",
            fontSize: "11px",
            paddingLeft: "6px",
          }}
        >
          {isOpen ? "▲" : "▼"}
        </span>
      </div>

      {isOpen && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: "#ffffff",
            border: "1px solid #d7ccc8",
            borderRadius: "6px",
            zIndex: 1050,
            maxHeight: "260px",
            overflowY: "auto",
            boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
          }}
        >
          {normalizedOptions.map((option) => {
            const isSel = selected.includes(option.value)
            return (
              <div
                key={option.value}
                onClick={() => toggle(option.value)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  backgroundColor: isSel ? "#f3ebe0" : "#ffffff",
                  fontSize: "13px",
                  color: "#3e2723",
                  borderBottom: "1px solid #f5ede6",
                  transition: "background-color 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSel) e.currentTarget.style.backgroundColor = "#faf6f2"
                }}
                onMouseLeave={(e) => {
                  if (!isSel) e.currentTarget.style.backgroundColor = "#ffffff"
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "3px",
                    flexShrink: 0,
                    border: `1.5px solid ${isSel ? "#795548" : "#bcaaa4"}`,
                    backgroundColor: isSel ? "#795548" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSel && (
                    <span style={{ color: "white", fontSize: "10px", fontWeight: "bold" }}>
                      ✓
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: isSel ? "600" : "400" }}>{option.label}</span>
                  {option.description && (
                    <span style={{ fontSize: "11px", color: "#8d6e63" }}>
                      {option.description}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          <div
            style={{
              padding: "6px 10px",
              borderTop: "1px solid #d7ccc8",
              position: "sticky",
              bottom: 0,
              backgroundColor: "#fcfaf8",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                padding: "4px 12px",
                backgroundColor: "#795548",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
