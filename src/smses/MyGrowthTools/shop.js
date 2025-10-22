"use client"
import { useState, useEffect } from "react"
import { Package, Target, Settings, Lock, Megaphone, TrendingUp, Brain, Users, ChevronDown } from "lucide-react"
import ComplianceTab from "./compliance-tab"
import LegitimacyTab from "./legitimacy-tab"
import FundabilityTab from "./fundability-tab"
import GovernanceTab from "./governance-tab"

const ShopToolsPage = () => {
  const [activeTab, setActiveTab] = useState("compliance")
  const [paystackLoaded, setPaystackLoaded] = useState(false)
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [showScoreDropdown, setShowScoreDropdown] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Define a new color palette for dark brown shades
  const colors = {
    darkBrown: "#372C27", // Deep coffee/espresso
    mediumBrown: "#5D4037", // Rich, warm brown
    lightBrown: "#8D6E63", // Muted, earthy brown
    accentGold: "#A67C52", // Golden brown for highlights
    offWhite: "#F5F2F0", // Soft off-white for text/backgrounds
    cream: "#EFEBE9", // Slightly darker cream
    lightTan: "#D7CCC8", // Very light tan for borders
    darkText: "#2C2927", // Very dark text on light backgrounds
    lightText: "#F5F2F0", // Light text on dark backgrounds
    gradientStart: "#4A352F",
    gradientEnd: "#7D5A50",
  }

  // Load Paystack script with better error handling
  useEffect(() => {
    const loadPaystackScript = () => {
      return new Promise((resolve, reject) => {
        if (window.PaystackPop) {
          setPaystackLoaded(true)
          resolve(true)
          return
        }
        const existingScript = document.querySelector('script[src*="paystack"]')
        if (existingScript) {
          existingScript.remove()
        }
        const script = document.createElement("script")
        script.src = "https://js.paystack.co/v1/inline.js"
        script.async = true
        script.onload = () => {
          setTimeout(() => {
            if (window.PaystackPop) {
              setPaystackLoaded(true)
              resolve(true)
            } else {
              reject(new Error("Paystack not available after script load"))
            }
          }, 100)
        }
        script.onerror = (error) => {
          console.error("Failed to load Paystack script:", error)
          reject(error)
        }
        document.head.appendChild(script)
      })
    }

    loadPaystackScript().catch((error) => {
      console.error("Paystack loading failed:", error)
      setPaystackLoaded(false)
    })

    // Read tab from URL query parameter
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get("tab")
    if (tab) {
      setActiveTab(tab)
    }

    // Check sidebar state
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    // Check initial state
    checkSidebarState()

    // Watch for changes
    const observer = new MutationObserver(checkSidebarState)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => {
      const paystackScript = document.querySelector('script[src*="paystack"]')
      if (paystackScript && paystackScript.parentNode) {
        paystackScript.parentNode.removeChild(paystackScript)
      }
      observer.disconnect()
    }
  }, [])

  const getContentStyles = () => ({
    marginLeft: isSidebarCollapsed ? "80px" : "250px",
    padding: "0 1rem 0 0.5rem",
    fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
    background: colors.offWhite,
    minHeight: "100vh",
    width: isSidebarCollapsed ? "calc(100vw - 110px)" : "calc(100vw - 280px)",
    maxWidth: "none",
    transition: "all 0.3s ease",
  })

  // Inline styles object with new dark brown theme
  const styles = {
    container: getContentStyles(),
    betaNotice: {
      background: "linear-gradient(135deg, #FFF3CD 0%, #FFF8E1 100%)",
      color: "#856404",
      border: "2px solid #FFC107",
      borderRadius: "12px",
      padding: "1rem 1.5rem",
      margin: "20px auto 1.5rem auto",
      width: "100%",
      maxWidth: "none",
      fontWeight: 600,
      fontSize: "1rem",
      textAlign: "center",
      boxShadow: "0 4px 12px rgba(255, 193, 7, 0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
    },
    heroSection: {
      backgroundImage: `linear-gradient(rgba(${Number.parseInt(colors.darkBrown.slice(1, 3), 16)}, ${Number.parseInt(
        colors.darkBrown.slice(3, 5),
        16,
      )}, ${Number.parseInt(colors.darkBrown.slice(5, 7), 16)}, 0.7), rgba(${Number.parseInt(
        colors.darkBrown.slice(1, 3),
        16,
      )}, ${Number.parseInt(colors.darkBrown.slice(3, 5), 16)}, ${Number.parseInt(
        colors.darkBrown.slice(5, 7),
        16,
      )}, 0.9)), url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      padding: "5rem 2rem",
      borderRadius: "1rem",
      marginBottom: "2rem",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
      position: "relative",
      overflow: "hidden",
    },
    heroContent: {
      maxWidth: "100%",
      margin: "0 auto",
      textAlign: "center",
      color: colors.lightText,
      position: "relative",
      zIndex: "2",
    },
    heroBadge: {
      display: "inline-block",
      backgroundColor: `rgba(${Number.parseInt(colors.lightText.slice(1, 3), 16)}, ${Number.parseInt(
        colors.lightText.slice(3, 5),
        16,
      )}, ${Number.parseInt(colors.lightText.slice(5, 7), 16)}, 0.2)`,
      color: colors.lightText,
      padding: "0.6rem 1.2rem",
      borderRadius: "2rem",
      fontSize: "0.9rem",
      fontWeight: "600",
      marginBottom: "1rem",
      backdropFilter: "blur(6px)",
      border: `1px solid rgba(${Number.parseInt(colors.lightText.slice(1, 3), 16)}, ${Number.parseInt(
        colors.lightText.slice(3, 5),
        16,
      )}, ${Number.parseInt(colors.lightText.slice(5, 7), 16)}, 0.3)`,
    },
    heroTitle: {
      fontSize: "3rem",
      fontWeight: "800",
      lineHeight: "1.2",
      marginBottom: "1.5rem",
      textShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
    },
    heroDescription: {
      fontSize: "1.25rem",
      maxWidth: "800px",
      margin: "0 auto 2.5rem",
      lineHeight: "1.6",
      opacity: "0.95",
    },
    heroButtons: {
      display: "flex",
      gap: "1.5rem",
      justifyContent: "center",
      flexWrap: "wrap",
    },
    heroButton: {
      background: colors.offWhite,
      color: colors.darkBrown,
      border: "none",
      padding: "0.9rem 2rem",
      borderRadius: "0.75rem",
      cursor: "pointer",
      fontWeight: "700",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    },
    heroButtonSecondary: {
      background: "transparent",
      color: colors.lightText,
      border: `2px solid ${colors.lightText}`,
      padding: "0.9rem 2rem",
      borderRadius: "0.75rem",
      cursor: "pointer",
      fontWeight: "700",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      transition: "all 0.3s ease",
      position: "relative",
    },
    dropdown: {
      position: "absolute",
      top: "100%",
      left: "0",
      width: "100%",
      background: colors.offWhite,
      borderRadius: "0.75rem",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
      zIndex: "10",
      marginTop: "0.5rem",
      overflow: "hidden",
    },
    dropdownItem: {
      padding: "0.9rem 1.5rem",
      color: colors.darkBrown,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      transition: "all 0.2s ease",
    },
    dropdownItemHover: {
      background: colors.lightTan,
    },
    navTabs: {
      margin: "2.5rem 0 1.5rem 0",
      borderBottom: `2px solid ${colors.lightTan}`,
    },
    navTabsContainer: {
      display: "flex",
      gap: "0",
      background: colors.darkBrown,
      borderRadius: "1rem 1rem 0 0",
      overflow: "hidden",
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
    },
    navTab: {
      display: "flex",
      alignItems: "center",
      gap: "0.6rem",
      padding: "1.8rem 2.5rem",
      background: colors.mediumBrown,
      color: colors.offWhite,
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "1.05rem",
      transition: "all 0.3s ease",
      borderBottom: "3px solid transparent",
      flex: "1",
      justifyContent: "center",
      whiteSpace: "nowrap",
    },
    navTabActive: {
      background: colors.offWhite,
      color: colors.darkBrown,
      borderBottomColor: colors.accentGold,
      boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.1)",
    },
    contentArea: {
      background: colors.offWhite,
      borderRadius: "0 0 1rem 1rem",
      padding: "2rem 2rem 2.5rem 0.5rem",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
      border: `1px solid ${colors.lightTan}`,
      borderTop: "none",
    },
    sectionHeader: {
      textAlign: "left",
      marginBottom: "3.5rem",
    },
    sectionTitle: {
      fontSize: "2.8rem",
      fontWeight: "800",
      background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      margin: "0 0 1.2rem 0",
      letterSpacing: "-1px",
    },
    sectionSubtitle: {
      fontSize: "1.25rem",
      color: colors.mediumBrown,
      margin: "0 0 2.5rem 0",
      maxWidth: "700px",
      lineHeight: "1.6",
      textAlign: "left",
    },
    sectionDivider: {
      width: "100px",
      height: "5px",
      background: `linear-gradient(90deg, ${colors.accentGold}, ${colors.lightBrown})`,
      borderRadius: "3px",
      margin: "0",
    },
    differenceSection: {
      backgroundImage: `linear-gradient(rgba(${Number.parseInt(colors.darkBrown.slice(1, 3), 16)}, ${Number.parseInt(
        colors.darkBrown.slice(3, 5),
        16,
      )}, ${Number.parseInt(colors.darkBrown.slice(5, 7), 16)}, 0.85), rgba(${Number.parseInt(
        colors.darkBrown.slice(1, 3),
        16,
      )}, ${Number.parseInt(colors.darkBrown.slice(3, 5), 16)}, ${Number.parseInt(
        colors.darkBrown.slice(5, 7),
        16,
      )}, 0.95)), url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      borderRadius: "1rem",
      padding: "4rem 2.5rem",
      margin: "3.5rem 0",
      textAlign: "center",
      color: colors.lightText,
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
    },
    differenceContent: {
      position: "relative",
      zIndex: "2",
      maxWidth: "900px",
      margin: "0 auto",
    },
    differenceTitle: {
      fontSize: "2.8rem",
      fontWeight: "800",
      marginBottom: "1.5rem",
      textShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
    },
    differenceDescription: {
      fontSize: "1.2rem",
      lineHeight: "1.7",
      marginBottom: "2rem",
      opacity: "0.95",
    },
    differenceTagline: {
      fontSize: "1.1rem",
      fontStyle: "italic",
      marginBottom: "2.5rem",
      opacity: "0.85",
    },
    ctaBtn: {
      background: colors.offWhite,
      color: colors.darkBrown,
      border: "none",
      padding: "0.9rem 2rem",
      borderRadius: "0.75rem",
      cursor: "pointer",
      fontWeight: "700",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.75rem",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
      height: "50px",
    },
    finalCtaSection: {
      background: `linear-gradient(135deg, ${colors.gradientStart} 0%, ${colors.gradientEnd} 100%)`,
      color: colors.lightText,
      borderRadius: "1.5rem",
      padding: "3rem",
      textAlign: "center",
      marginTop: "4rem",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
    },
    finalCtaTitle: {
      fontSize: "2rem",
      fontWeight: "bold",
      marginBottom: "1.5rem",
    },
    finalCtaDescription: {
      color: colors.cream,
      marginBottom: "2rem",
      maxWidth: "40rem",
      marginLeft: "auto",
      marginRight: "auto",
      lineHeight: "1.6",
    },
    finalCtaButtons: {
      display: "flex",
      gap: "1.5rem",
      justifyContent: "center",
      flexWrap: "wrap",
    },
  }

  const publicKey = "pk_test_e99e9d341c8fa3182737cd26c5838dece90e3ed9"

  const initializePayment = async (config) => {
    if (!paystackLoaded || !window.PaystackPop) {
      throw new Error("Paystack not loaded")
    }
    return new Promise((resolve, reject) => {
      try {
        const handler = window.PaystackPop.setup({
          ...config,
          callback: (response) => {
            setIsPaymentLoading(false)
            resolve(response)
          },
          onClose: () => {
            setIsPaymentLoading(false)
            reject(new Error("Payment cancelled"))
          },
        })
        if (handler && typeof handler.openIframe === "function") {
          handler.openIframe()
        } else {
          throw new Error("Paystack handler not properly initialized")
        }
      } catch (error) {
        setIsPaymentLoading(false)
        reject(error)
      }
    })
  }

  const handleMyPurchases = () => {
    window.location.href = "/growth/my-tools"
  }

  const handleBrowseAll = () => {
    setShowScoreDropdown(!showScoreDropdown)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setShowScoreDropdown(false)
  }

  const handleTalkToAdvisor = () => {
    window.location.href = "/applications/advisory"
  }

  // Props to pass to each tab component
  const tabProps = {
    paystackLoaded,
    isPaymentLoading,
    setIsPaymentLoading,
    initializePayment,
    publicKey,
  }

  return (
    <div style={styles.container}>
      {/* Beta Testing Notice */}
      <div style={styles.betaNotice}>
        <Settings className="w-5 h-5" style={{ color: "#856404" }} />
        <span>
          <strong>Beta Testing Phase:</strong> This Growth Tools Shop is currently unavailable in beta testing. Features
          and pricing may change before final release.
        </span>
      </div>

      {/* Hero Section */}
      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>BIG Growth Suite</div>
          <h1 style={styles.heroTitle}>Your Shortcut to a higher BIG Score</h1>
          <p style={styles.heroDescription}>
            Unlock business growth with curated tools, policies, and templates—targeted to the exact areas funders care
            about most. Build credibility. Boost readiness. Secure funding faster.
          </p>
          <div style={styles.heroButtons}>
            <button
              style={styles.heroButton}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              onClick={handleMyPurchases}
            >
              <Package className="w-5 h-5" />
              My Purchases
            </button>
            <div style={{ position: "relative" }}>
              <button
                style={styles.heroButtonSecondary}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                onClick={handleBrowseAll}
              >
                <TrendingUp className="w-5 h-5" />
                Improve My BIG Score
                <ChevronDown className="w-5 h-5" />
              </button>
              {showScoreDropdown && (
                <div style={styles.dropdown}>
                  <div
                    style={{
                      ...styles.dropdownItem,
                      ...styles.dropdownItemHover,
                    }}
                    onClick={() => handleTabChange("compliance")}
                  >
                    <Lock className="w-5 h-5" />
                    Compliance
                  </div>
                  <div
                    style={{
                      ...styles.dropdownItem,
                      ...styles.dropdownItemHover,
                    }}
                    onClick={() => handleTabChange("legitimacy")}
                  >
                    <Megaphone className="w-5 h-5" />
                    Legitimacy
                  </div>
                  <div
                    style={{
                      ...styles.dropdownItem,
                      ...styles.dropdownItemHover,
                    }}
                    onClick={() => handleTabChange("fundability")}
                  >
                    <TrendingUp className="w-5 h-5" />
                    Capital Appeal
                  </div>
                  <div
                    style={{
                      ...styles.dropdownItem,
                      ...styles.dropdownItemHover,
                    }}
                    onClick={() => handleTabChange("governance")}
                  >
                    <Brain className="w-5 h-5" />
                    Governance
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={styles.navTabs}>
        <div style={styles.navTabsContainer}>
          <button
            onClick={() => setActiveTab("compliance")}
            style={{
              ...styles.navTab,
              ...(activeTab === "compliance" ? styles.navTabActive : {}),
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "compliance") {
                e.currentTarget.style.background = colors.lightBrown
                e.currentTarget.style.color = colors.darkText
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "compliance") {
                e.currentTarget.style.background = colors.mediumBrown
                e.currentTarget.style.color = colors.offWhite
              }
            }}
          >
            <Lock className="w-5 h-5" />
            Compliance
          </button>
          <button
            onClick={() => setActiveTab("legitimacy")}
            style={{
              ...styles.navTab,
              ...(activeTab === "legitimacy" ? styles.navTabActive : {}),
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "legitimacy") {
                e.currentTarget.style.background = colors.lightBrown
                e.currentTarget.style.color = colors.darkText
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "legitimacy") {
                e.currentTarget.style.background = colors.mediumBrown
                e.currentTarget.style.color = colors.offWhite
              }
            }}
          >
            <Megaphone className="w-5 h-5" />
            Legitimacy
          </button>
          <button
            onClick={() => setActiveTab("fundability")}
            style={{
              ...styles.navTab,
              ...(activeTab === "fundability" ? styles.navTabActive : {}),
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "fundability") {
                e.currentTarget.style.background = colors.lightBrown
                e.currentTarget.style.color = colors.darkText
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "fundability") {
                e.currentTarget.style.background = colors.mediumBrown
                e.currentTarget.style.color = colors.offWhite
              }
            }}
          >
            <TrendingUp className="w-5 h-5" />
            Capital Appeal
          </button>
          <button
            onClick={() => setActiveTab("governance")}
            style={{
              ...styles.navTab,
              ...(activeTab === "governance" ? styles.navTabActive : {}),
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "governance") {
                e.currentTarget.style.background = colors.lightBrown
                e.currentTarget.style.color = colors.darkText
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "governance") {
                e.currentTarget.style.background = colors.mediumBrown
                e.currentTarget.style.color = colors.offWhite
              }
            }}
          >
            <Brain className="w-5 h-5" />
            Governance
          </button>
          <button
            onClick={() => setActiveTab("all-toolkits")}
            style={{
              ...styles.navTab,
              ...(activeTab === "all-toolkits" ? styles.navTabActive : {}),
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "all-toolkits") {
                e.currentTarget.style.background = colors.lightBrown
                e.currentTarget.style.color = colors.darkText
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "all-toolkits") {
                e.currentTarget.style.background = colors.mediumBrown
                e.currentTarget.style.color = colors.offWhite
              }
            }}
          >
            <Package className="w-5 h-5" />
            All Toolkits
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={styles.contentArea}>
        {activeTab === "all-toolkits" ? (
          <>
            <h2 style={styles.sectionTitle}>All Growth Toolkits</h2>
            <p style={styles.sectionSubtitle}>Explore all available tools to boost every aspect of your BIG Score.</p>
            <div style={styles.sectionDivider}></div>
            <div style={{ marginTop: "2.5rem" }}>
              <ComplianceTab {...tabProps} />
              <div style={{ margin: "3rem 0", borderBottom: `1px dashed ${colors.lightTan}` }}></div>
              <LegitimacyTab {...tabProps} />
              <div style={{ margin: "3rem 0", borderBottom: `1px dashed ${colors.lightTan}` }}></div>
              <FundabilityTab {...tabProps} />
              <div style={{ margin: "3rem 0", borderBottom: `1px dashed ${colors.lightTan}` }}></div>
              <GovernanceTab {...tabProps} />
            </div>
          </>
        ) : (
          <>
            {activeTab === "compliance" && (
              <ComplianceTab
                paystackLoaded={paystackLoaded}
                isPaymentLoading={isPaymentLoading}
                setIsPaymentLoading={setIsPaymentLoading}
                initializePayment={initializePayment}
                publicKey={publicKey}
              />
            )}
            {activeTab === "legitimacy" && (
              <LegitimacyTab
                paystackLoaded={paystackLoaded}
                isPaymentLoading={isPaymentLoading}
                setIsPaymentLoading={setIsPaymentLoading}
                initializePayment={initializePayment}
                publicKey={publicKey}
              />
            )}
            {activeTab === "fundability" && (
              <FundabilityTab
                paystackLoaded={paystackLoaded}
                isPaymentLoading={isPaymentLoading}
                setIsPaymentLoading={setIsPaymentLoading}
                initializePayment={initializePayment}
                publicKey={publicKey}
              />
            )}
            {activeTab === "governance" && (
              <GovernanceTab
                paystackLoaded={paystackLoaded}
                isPaymentLoading={isPaymentLoading}
                setIsPaymentLoading={setIsPaymentLoading}
                initializePayment={initializePayment}
                publicKey={publicKey}
              />
            )}
          </>
        )}

        {/* The BIG Difference Section */}
        <div style={styles.differenceSection}>
          <div style={styles.differenceContent}>
            <h2 style={styles.differenceTitle}>THE BIG DIFFERENCE</h2>
            <p style={styles.differenceDescription}>
              We don't just help you start – we help you succeed. Our tools are specifically designed to boost your BIG
              Score, making your business more attractive to funders, corporates, and investors.
            </p>
            <p style={styles.differenceTagline}>Let's build your business success story together.</p>
            <button
              style={styles.ctaBtn}
              onClick={handleMyPurchases}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              View My Purchases
            </button>
          </div>
        </div>

        {/* Final CTA Section */}
        <div style={styles.finalCtaSection}>
          <Target className="w-12 h-12 mx-auto mb-4" />
          <h3 style={styles.finalCtaTitle}>Ready to boost your BIG Score?</h3>
          <p style={styles.finalCtaDescription}>
            Choose a toolkit that speaks directly to funders, corporates, and investors.
          </p>
          <div style={styles.finalCtaButtons}>
            <button
              style={styles.heroButton}
              onClick={handleMyPurchases}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <Package className="w-5 h-5" />
              My Purchases
            </button>
            <div style={{ position: "relative" }}>
              <button
                style={styles.heroButtonSecondary}
                onClick={handleBrowseAll}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <TrendingUp className="w-5 h-5" />
                Improve My BIG Score
                <ChevronDown className="w-5 h-5" />
              </button>
              {showScoreDropdown && (
                <div style={styles.dropdown}>
                  <div
                    style={{
                      ...styles.dropdownItem,
                      ...styles.dropdownItemHover,
                    }}
                    onClick={() => handleTabChange("compliance")}
                  >
                    <Lock className="w-5 h-5" />
                    Compliance
                  </div>
                  <div
                    style={{
                      ...styles.dropdownItem,
                      ...styles.dropdownItemHover,
                    }}
                    onClick={() => handleTabChange("legitimacy")}
                  >
                    <Megaphone className="w-5 h-5" />
                    Legitimacy
                  </div>
                  <div
                    style={{
                      ...styles.dropdownItem,
                      ...styles.dropdownItemHover,
                    }}
                    onClick={() => handleTabChange("fundability")}
                  >
                    <TrendingUp className="w-5 h-5" />
                    Capital Appeal
                  </div>
                  <div
                    style={{
                      ...styles.dropdownItem,
                      ...styles.dropdownItemHover,
                    }}
                    onClick={() => handleTabChange("governance")}
                  >
                    <Brain className="w-5 h-5" />
                    Governance
                  </div>
                </div>
              )}
            </div>
            <button
              style={styles.heroButtonSecondary}
              onClick={handleTalkToAdvisor}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <Users className="w-5 h-5" />
              Talk to a Growth Advisor
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShopToolsPage
