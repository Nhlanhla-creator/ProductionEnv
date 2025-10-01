"use client"
import "./custom-button.css"

export const Button = ({ children, onClick, disabled = false, className = "" }) => {
  return (
    <button onClick={onClick} disabled={disabled} className={`custom-button ${className}`}>
      {children}
    </button>
  )
}
