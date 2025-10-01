"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import './UniversalProfile.css';

export default function FormField({ label, children, required = false, tooltip = null, className = "" }) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-center mb-1">
        <label className="block text-sm font-medium text-brown-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {tooltip && (
          <div className="relative ml-2">
            <Info
              className="w-4 h-4 text-brown-400 cursor-help"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            />
            {showTooltip && (
              <div className="absolute z-10 w-64 p-2 text-xs bg-brown-800 text-white rounded shadow-lg -left-32 top-6">
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
