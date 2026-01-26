import React, { useEffect } from "react"
import { createPortal } from "react-dom"

const overlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 20000,
  padding: 20,
  boxSizing: "border-box",
}

const contentWrapStyle = {
  width: "90%",
  height: "100vh",
  overflowY: "auto",
  scrollbarWidth: "none",
}

export default function Modal({ children, onClose }) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "auto"
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  const node = (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentWrapStyle} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
