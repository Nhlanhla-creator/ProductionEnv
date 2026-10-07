"use client"

import React, { useState, useId, cloneElement, isValidElement } from "react"
import { Info } from "lucide-react"
import styles from "./InvestorUniversalProfile.module.css"

export default function FormField({
  label,
  children,
  required = false,
  tooltip = null,
  className = "",
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const fieldId = useId()
  const control = isValidElement(children) && typeof children.type === "string"
    ? cloneElement(children, { id: children.props.id || fieldId })
    : children

  return (
    <div className={`${styles.formField} ${className}`}>
      <div className={styles.labelContainer}>
        <label className={styles.label} htmlFor={isValidElement(children) && typeof children.type === "string" ? (children.props.id || fieldId) : undefined}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
        {tooltip && (
          <div className={styles.tooltipWrapper}>
            <Info
              className={styles.tooltipIcon}
              tabIndex={0}
              aria-label="More information"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
            />
            {showTooltip && (
              <div className={styles.tooltipBox}>
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      {control}
    </div>
  )
}