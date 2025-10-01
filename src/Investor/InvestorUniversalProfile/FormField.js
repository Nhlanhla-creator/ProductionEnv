"use client"

import { useState } from "react"
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

  return (
    <div className={`${styles.formField} ${className}`}>
      <div className={styles.labelContainer}>
        <label className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
        {tooltip && (
          <div className={styles.tooltipWrapper}>
            <Info
              className={styles.tooltipIcon}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            />
            {showTooltip && (
              <div className={styles.tooltipBox}>
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
