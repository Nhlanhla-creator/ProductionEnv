"use client"

import React, { useState, useEffect, useRef } from "react"
import { Search, ChevronDown, ChevronUp, X, Check } from "lucide-react"

/**
 * CMFSelectDropdown
 * Reusable single-select & multi-select dropdown matching BIG UniversalProfile styling.
 * 
 * Props:
 * - options: string[] | { value: string, label: string, desc?: string }[]
 * - value: string | string[] (controlled value)
 * - onChange: (newValue: string | string[]) => void
 * - multiple: boolean (default false)
 * - placeholder: string
 * - searchable: boolean (auto-enabled if options > 6)
 * - disabled?: boolean
 */
export default function CMFSelectDropdown({
  options = [],
  value,
  onChange,
  multiple = false,
  placeholder = "Select an option...",
  searchable = undefined,
  disabled = false,
  id
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef(null)

  // Normalize options to { value, label, desc }
  const normalizedOptions = React.useMemo(() => {
    return options.map(opt => {
      if (typeof opt === "string") {
        return { value: opt, label: opt, desc: "" }
      }
      return {
        value: opt.value ?? opt.label,
        label: opt.label ?? opt.value,
        desc: opt.desc || ""
      }
    })
  }, [options])

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Filter options by search term
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions
    const term = searchTerm.toLowerCase()
    return normalizedOptions.filter(o =>
      o.label.toLowerCase().includes(term) || (o.desc && o.desc.toLowerCase().includes(term))
    )
  }, [normalizedOptions, searchTerm])

  const selectedList = React.useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : []
    }
    return value !== undefined && value !== null && value !== "" ? [value] : []
  }, [multiple, value])

  const shouldShowSearch = searchable !== undefined ? searchable : normalizedOptions.length > 6

  // Handlers
  const handleToggle = (optValue) => {
    if (disabled) return
    if (multiple) {
      const current = Array.isArray(value) ? [...value] : []
      if (current.includes(optValue)) {
        onChange(current.filter(v => v !== optValue))
      } else {
        onChange([...current, optValue])
      }
    } else {
      onChange(optValue)
      setIsOpen(false)
    }
  }

  const handleRemoveTag = (e, optValue) => {
    e.stopPropagation()
    if (disabled) return
    if (multiple) {
      const current = Array.isArray(value) ? [...value] : []
      onChange(current.filter(v => v !== optValue))
    } else {
      onChange("")
    }
  }

  const handleSelectAll = (e) => {
    e.stopPropagation()
    if (!multiple || disabled) return
    const allValues = normalizedOptions.map(o => o.value)
    onChange(allValues)
  }

  const handleClearAll = (e) => {
    e.stopPropagation()
    if (disabled) return
    if (multiple) {
      onChange([])
    } else {
      onChange("")
    }
  }

  const getOptionLabel = (val) => {
    const found = normalizedOptions.find(o => o.value === val)
    return found ? found.label : val
  }

  return (
    <div
      ref={dropdownRef}
      id={id}
      data-cmf-dropdown="true"
      style={{ position: "relative", width: "100%", userSelect: "none" }}
    >
      {/* Trigger Box */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen(prev => !prev)
        }}
        style={{
          border: isOpen ? "1px solid #8d6e63" : "1px solid #d7ccc8",
          borderRadius: "8px",
          padding: "6px 10px",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "6px",
          minHeight: "40px",
          backgroundColor: disabled ? "#f5f5f5" : "#ffffff",
          fontSize: "13px",
          boxShadow: isOpen ? "0 0 0 2px rgba(141, 110, 99, 0.15)" : "none",
          transition: "all 0.15s ease",
          boxSizing: "border-box"
        }}
      >
        {selectedList.length === 0 ? (
          <span style={{ color: "#a1887f", fontSize: "13px" }}>{placeholder}</span>
        ) : multiple ? (
          selectedList.map(val => (
            <span
              key={val}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                backgroundColor: "#f3ebe0",
                border: "1px solid #d6c4a8",
                color: "#6b4c2a",
                borderRadius: "12px",
                padding: "2px 8px",
                fontSize: "12px",
                fontWeight: "500"
              }}
            >
              {getOptionLabel(val)}
              <span
                onClick={(e) => handleRemoveTag(e, val)}
                style={{
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  opacity: 0.75,
                  fontSize: "12px",
                  marginLeft: "2px"
                }}
                title="Remove"
              >
                ✕
              </span>
            </span>
          ))
        ) : (
          <span style={{ color: "#3d2b1f", fontSize: "13px", fontWeight: "600" }}>
            {getOptionLabel(selectedList[0])}
          </span>
        )}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", color: "#8d6e63" }}>
          {selectedList.length > 0 && !disabled && (
            <span
              onClick={handleClearAll}
              title="Clear selection"
              style={{
                fontSize: "11px",
                color: "#a1887f",
                cursor: "pointer",
                padding: "0 4px",
                lineHeight: 1
              }}
            >
              <X size={13} />
            </span>
          )}
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            backgroundColor: "#ffffff",
            border: "1px solid #d7ccc8",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(62, 39, 35, 0.15)",
            zIndex: 1100,
            maxHeight: "280px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {/* Search Header if applicable */}
          {shouldShowSearch && (
            <div style={{ padding: "8px 10px", borderBottom: "1px solid #f0e6da", display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#faf7f2" }}>
              <Search size={14} color="#8d6e63" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search options..."
                autoFocus
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "12px",
                  color: "#4a352f"
                }}
              />
              {searchTerm && (
                <X
                  size={12}
                  color="#8d6e63"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSearchTerm("")
                  }}
                />
              )}
            </div>
          )}

          {/* Multi-select Quick Action Bar */}
          {multiple && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 12px",
              borderBottom: "1px solid #f5ede6",
              backgroundColor: "#fdfaf7",
              fontSize: "11px",
              color: "#8d6e63"
            }}>
              <span>{selectedList.length} of {normalizedOptions.length} selected</span>
              <div style={{ display: "flex", gap: "10px" }}>
                <span
                  onClick={handleSelectAll}
                  style={{ cursor: "pointer", fontWeight: "600", color: "#8b5e3c" }}
                >
                  Select All
                </span>
                <span
                  onClick={handleClearAll}
                  style={{ cursor: "pointer", color: "#a1887f" }}
                >
                  Clear
                </span>
              </div>
            </div>
          )}

          {/* Options List */}
          <div style={{ overflowY: "auto", flex: 1, padding: "4px 0" }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: "12px", textAlign: "center", fontSize: "12px", color: "#a1887f" }}>
                No matching options found
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selectedList.includes(option.value)
                return (
                  <div
                    key={option.value}
                    onClick={() => handleToggle(option.value)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      backgroundColor: isSelected ? "#fdf6ee" : "transparent",
                      fontSize: "13px",
                      color: "#3d2b1f",
                      transition: "background-color 0.12s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "#faf5ef"
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"
                    }}
                  >
                    {/* Checkbox (multiple) or Radio (single) */}
                    <div
                      style={{
                        width: multiple ? "16px" : "14px",
                        height: multiple ? "16px" : "14px",
                        borderRadius: multiple ? "3px" : "50%",
                        flexShrink: 0,
                        border: `1px solid ${isSelected ? "#8b5e3c" : "#ccc"}`,
                        backgroundColor: isSelected ? "#8b5e3c" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {isSelected && (
                        multiple ? (
                          <span style={{ color: "#ffffff", fontSize: "10px", fontWeight: "bold" }}>✓</span>
                        ) : (
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#ffffff" }} />
                        )
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: isSelected ? "600" : "400", fontSize: "13px" }}>
                        {option.label}
                      </div>
                      {option.desc && (
                        <div style={{ fontSize: "11px", color: "#8d6e63", marginTop: "2px" }}>
                          {option.desc}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Sticky Footer */}
          <div style={{ padding: "6px 10px", borderTop: "1px solid #f0e6da", backgroundColor: "#ffffff", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                width: "100%",
                padding: "6px 12px",
                backgroundColor: "#8B4513",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
                transition: "opacity 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
