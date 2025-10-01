"use client"
import "./custom-dialog.css"

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null

  return (
    <div className="dialog-overlay" onClick={() => onOpenChange(false)}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export const DialogContent = ({ children, className = "" }) => {
  return <div className={`dialog-body ${className}`}>{children}</div>
}

export const DialogHeader = ({ children }) => {
  return <div className="dialog-header">{children}</div>
}

export const DialogTitle = ({ children, className = "" }) => {
  return <h2 className={`dialog-title ${className}`}>{children}</h2>
}
