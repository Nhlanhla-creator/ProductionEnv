import React, { useEffect, useState } from "react"
import { Lock, ArrowRight, X } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function Upsell({
  userType = "investor",
  title = "Premium Feature",
  subtitle = "Upgrade to access this feature",
  features = [],
  primaryLabel = "View Available Plans",
  onPrimary,
  variant = "card", // 'popup' or 'card'
  expandedWidth = 270,
  collapsedWidth = 100,
  plans = ["Standard", "Premium"],
  upgradeMessage = null,
  inModal = false,
  onClose,
}) {
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      if (typeof document !== "undefined" && document.body) {
        return document.body.classList.contains("sidebar-collapsed")
      }
      return localStorage.getItem("sidebarOpen") === "false"
    } catch (e) {
      return false
    }
  })

  const modalInnerStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "32px",
    maxWidth: "720px",
    width: "100%",
    boxShadow: "0 32px 64px rgba(62, 39, 35, 0.12)",
    border: "1px solid rgba(200, 182, 166, 0.18)",
    boxSizing: "border-box",
    position: "relative",
  }

  const modalCloseStyle = {
    position: "absolute",
    top: "20px",
    right: "20px",
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
    border: "none",
    borderRadius: "50%",
    fontSize: "20px",
    cursor: "pointer",
    color: "#4a352f",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease'
  }

  useEffect(() => {
    const update = () => {
      try {
        if (document && document.body) {
          setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
        } else {
          setIsSidebarCollapsed(localStorage.getItem("sidebarOpen") === "false")
        }
      } catch (e) {
        setIsSidebarCollapsed(false)
      }
    }

    // MutationObserver watches body class changes like in MyInvestments
    let observer = null
    try {
      if (document && document.body && window.MutationObserver) {
        observer = new MutationObserver(() => update())
        observer.observe(document.body, { attributes: true, attributeFilter: ["class"] })
      }
    } catch (e) {
      // noop
    }

    // Also listen to events used elsewhere in the app
    window.addEventListener("sidebarToggle", update)
    window.addEventListener("storage", update)

    return () => {
      if (observer) observer.disconnect()
      window.removeEventListener("sidebarToggle", update)
      window.removeEventListener("storage", update)
    }
  }, [])

  const effectiveLeft = `${isSidebarCollapsed ? collapsedWidth : expandedWidth}px`

  const handlePrimary = () => {
    if (typeof onPrimary === "function") return onPrimary()
    
    switch (userType) {
      case "investor":
        navigate("/investor/billing/subscriptions")
      case "sme":
        navigate("/billing/subscriptions")
      default:
        navigate("/billing/subscriptions")
    }
  }

  // Shared inner card style for consistent appearance
  const innerCardStyle = {
    padding: "60px 40px",
    textAlign: "center",
    maxWidth: "900px",
    width: "100%",
  }

  const renderInnerContent = () => (
    <div style={innerCardStyle}>
      <div
        style={{
          width: "80px",
          height: "80px",
          backgroundColor: "#efebe9",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}
      >
        <Lock size={40} color="#8D6E63" />
      </div>

      <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#372C27", marginBottom: "12px", marginTop: 0 }}>
        {title}
      </h1>

      <p style={{ fontSize: "16px", color: "#5D4037", marginBottom: "24px", lineHeight: "1.6" }}>{subtitle}</p>

      {features && features.length > 0 && (
        <div style={{ backgroundColor: "#efebe9", borderRadius: "8px", padding: "20px", marginBottom: "24px", textAlign: "left" }}>
          <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#372C27", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 0, marginBottom: "12px" }}>
            What You Get:
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {features.map((feature, idx) => (
              <li key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px", fontSize: "14px", color: "#5D4037" }}>
                <div style={{ width: "6px", height: "6px", backgroundColor: "#8D6E63", borderRadius: "50%", flexShrink: 0 }} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
          style={{
            backgroundColor: "#fafafa",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "32px",
            border: "1px solid #d7ccc8",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              color: "#8D6E63",
              margin: "0",
              lineHeight: "1.6",
            }}
          >
            <strong>Available on {plans.join(" & ")} plans</strong>
            <br />
            {upgradeMessage}
          </p>
        </div>

      <button
        onClick={handlePrimary}
        style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "14px 32px", backgroundColor: "#8D6E63", color: "#fff", border: "none", borderRadius: "6px", fontSize: "16px", fontWeight: "600", cursor: "pointer", transition: "all 0.3s ease" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#6D4C41"
          e.currentTarget.style.transform = "translateY(-2px)"
          e.currentTarget.style.boxShadow = "0 6px 12px rgba(141, 110, 99, 0.3)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#8D6E63"
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = "none"
        }}
      >
        <span>{primaryLabel}</span>
        <ArrowRight size={18} />
      </button>
    </div>
  )

  if (inModal) {
    return (
      <div
        style={{
          padding: "20px",
          boxSizing: "border-box",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={modalInnerStyle}>
          <button
            style={modalCloseStyle}
            onClick={() => onClose && onClose()}
            onMouseEnter={(e) => {
              e.target.style.background =
                "linear-gradient(135deg, #c8b6a6, #a67c52)";
              e.target.style.color = "#faf7f2";
            }}
            onMouseLeave={(e) => {
              e.target.style.background =
                "linear-gradient(135deg, #e6d7c3, #c8b6a6)";
              e.target.style.color = "#4a352f";
            }}
          >
            <X size={20} />
          </button>
          {renderInnerContent()}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        paddingTop: "40px",
        paddingLeft: effectiveLeft,
        paddingRight: "20px",
        minHeight: "100vh",
        backgroundColor: "#fafafa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        transition: "padding-left 0.3s ease",
      }}
    >
      {renderInnerContent()}
    </div>
  )
}

