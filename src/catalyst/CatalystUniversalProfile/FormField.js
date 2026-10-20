"use client"

import { useState, useRef, useEffect } from "react"
import { Info } from "lucide-react"
import styles from "./catalyst-universal-profile.module.css"

export default function FormField({
  label,
  children,
  required = false,
  tooltip = null,
  className = "",
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipRef = useRef(null)

  // Accessible outside click listener to close tooltip
  useEffect(() => {
    if (!showTooltip) return

    const handleOutsideClick = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setShowTooltip(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowTooltip(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [showTooltip])

  const toggleTooltip = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowTooltip((prev) => !prev)
  }

  return (
    <div className={`${styles.formField} ${className}`}>
      <div className={styles.labelContainer}>
        <label className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
        {tooltip && (
          <div className={styles.tooltipWrapper} ref={tooltipRef}>
            <button
              type="button"
              className={styles.tooltipButton || styles.tooltipIcon}
              onClick={toggleTooltip}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              aria-label={`Information for ${label}`}
              aria-expanded={showTooltip}
              style={{
                background: "transparent",
                border: "none",
                padding: "2px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Info className={styles.tooltipIcon} size={15} />
            </button>
            {showTooltip && (
              <div
                className={styles.tooltipBox}
                role="tooltip"
                onClick={(e) => e.stopPropagation()}
              >
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}
