"use client"
import { useState, useMemo, useEffect } from "react"
import {
  Search,
  Download,
  Eye,
  Check,
  Package,
  Settings,
  Target,
  Award,
  Users,
  Shield,
  ShoppingCart,
  Filter,
  Calendar,
  FileText,
  Star,
  Zap,
} from "lucide-react"
import { collection, query, where, getDocs, getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const MyToolsPage = () => {
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [purchasedTools, setPurchasedTools] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const auth = getAuth()
  const db = getFirestore()
  const user = auth.currentUser

  // Define a consistent color palette for dark brown shades
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

  // Enhanced styles for better design
  const styles = {
    container: {
      marginLeft: "280px", // Account for sidebar
      padding: "0 1.5rem 0 1.5rem", // Remove right margin, keep left/right padding
      fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
      background: colors.offWhite, // Use defined color
      minHeight: "100vh",
      width: "calc(100vw - 280px)", // Full width minus sidebar
      maxWidth: "none", // Remove max-width constraint
    },
    betaNotice: {
      background: "linear-gradient(135deg, #FFF3CD 0%, #FFF8E1 100%)",
      color: "#856404",
      border: "2px solid #FFC107",
      borderRadius: "16px",
      padding: "1.25rem 2rem",
      margin: "60px auto 3rem auto",
      width: "100%", // Full width
      maxWidth: "none", // Remove max-width constraint
      fontWeight: 600,
      fontSize: "1rem",
      textAlign: "center",
      boxShadow: "0 8px 24px rgba(255, 193, 7, 0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.75rem",
    },
    pageHeader: {
      background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`, // Use defined colors
      borderRadius: "20px",
      padding: "3rem 2.5rem",
      marginBottom: "2.5rem",
      boxShadow: `0 8px 32px ${colors.darkBrown}15`, // Use defined color
      border: `1px solid ${colors.lightTan}`, // Use defined color
    },
    headerContent: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "2rem",
    },
    headerText: {
      flex: "1",
      minWidth: "300px",
    },
    pageTitle: {
      fontSize: "2.75rem",
      fontWeight: "800",
      background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`, // Use defined colors
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      margin: "0 0 1rem 0",
      letterSpacing: "-1px",
    },
    pageSubtitle: {
      fontSize: "1.25rem",
      color: colors.mediumBrown, // Use defined color
      lineHeight: "1.6",
      margin: "0",
    },
    headerActions: {
      display: "flex",
      gap: "1rem",
    },
    shopMoreBtn: {
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`, // Use defined colors
      color: colors.lightText, // Use defined color
      border: "none",
      padding: "1rem 2rem",
      borderRadius: "12px",
      fontWeight: "700",
      fontSize: "1rem",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      boxShadow: `0 4px 16px ${colors.accentGold}30`, // Use defined color
    },
    controlsSection: {
      background: colors.offWhite, // Use defined color
      borderRadius: "16px",
      padding: "2rem",
      marginBottom: "2.5rem",
      boxShadow: `0 4px 16px ${colors.darkBrown}10`, // Use defined color
      border: `1px solid ${colors.lightTan}`, // Use defined color
    },
    searchContainer: {
      position: "relative",
      marginBottom: "2rem",
      maxWidth: "500px",
    },
    searchIcon: {
      position: "absolute",
      left: "1rem",
      top: "50%",
      transform: "translateY(-50%)",
      color: colors.accentGold, // Use defined color
      width: "1.25rem",
      height: "1.25rem",
    },
    searchInput: {
      width: "100%",
      padding: "1rem 1rem 1rem 3rem",
      borderRadius: "12px",
      border: `2px solid ${colors.lightTan}`, // Use defined color
      fontSize: "1rem",
      transition: "all 0.3s ease",
      background: colors.cream, // Use defined color
      color: colors.darkText, // Use defined color
    },
    filtersContainer: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      flexWrap: "wrap",
    },
    filterIcon: {
      color: colors.accentGold, // Use defined color
      width: "1.25rem",
      height: "1.25rem",
    },
    filterButtons: {
      display: "flex",
      gap: "0.75rem",
      flexWrap: "wrap",
    },
    filterBtn: {
      padding: "0.75rem 1.5rem",
      borderRadius: "25px",
      border: `2px solid ${colors.lightTan}`, // Use defined color
      background: colors.offWhite, // Use defined color
      color: colors.mediumBrown, // Use defined color
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontSize: "0.9rem",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    filterBtnActive: {
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`, // Use defined colors
      color: colors.lightText, // Use defined color
      borderColor: colors.accentGold, // Use defined color
      boxShadow: `0 4px 12px ${colors.accentGold}30`, // Use defined color
    },
    filterCount: {
      background: "rgba(255, 255, 255, 0.2)", // Keep for active state
      padding: "0.25rem 0.5rem",
      borderRadius: "12px",
      fontSize: "0.75rem",
      fontWeight: "700",
    },
    toolsSection: {
      marginBottom: "3rem",
    },
    toolsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
      gap: "2rem",
    },
    toolCard: {
      background: colors.offWhite, // Use defined color
      borderRadius: "20px",
      padding: "2rem",
      boxShadow: `0 8px 24px ${colors.darkBrown}10`, // Use defined color
      border: `2px solid ${colors.lightTan}`, // Use defined color
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",
      overflow: "hidden",
    },
    toolCardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "1.5rem",
    },
    toolIconContainer: {
      width: "4rem",
      height: "4rem",
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`, // Use defined colors
      borderRadius: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: colors.accentGold, // Use defined color
      border: `2px solid ${colors.lightTan}`, // Use defined color
    },
    toolStatus: {
      display: "flex",
      alignItems: "center",
    },
    statusBadge: {
      padding: "0.5rem 1rem",
      borderRadius: "20px",
      fontSize: "0.75rem",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", // Green for delivered
      color: "#15803d", // Dark green text
      border: "1px solid #86efac", // Green border
    },
    statusIcon: {
      width: "1rem",
      height: "1rem",
    },
    toolCardBody: {
      marginBottom: "2rem",
    },
    toolTitle: {
      fontSize: "1.5rem",
      fontWeight: "700",
      color: colors.darkBrown, // Use defined color
      margin: "0 0 0.5rem 0",
      lineHeight: "1.3",
    },
    toolPackage: {
      color: colors.accentGold, // Use defined color
      fontSize: "1rem",
      fontWeight: "600",
      marginBottom: "1rem",
    },
    toolDescription: {
      color: colors.mediumBrown, // Use defined color
      lineHeight: "1.6",
      marginBottom: "1.5rem",
      fontSize: "0.95rem",
    },
    toolFeatures: {
      marginBottom: "1.5rem",
    },
    featuresTitle: {
      fontSize: "1rem",
      fontWeight: "700",
      color: colors.darkBrown, // Use defined color
      marginBottom: "0.75rem",
    },
    featuresList: {
      listStyle: "none",
      padding: "0",
      margin: "0",
    },
    featureItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: "0.5rem",
      marginBottom: "0.5rem",
      fontSize: "0.9rem",
      color: colors.mediumBrown, // Use defined color
      lineHeight: "1.5",
    },
    featureCheck: {
      width: "1rem",
      height: "1rem",
      color: colors.accentGold, // Use defined color
      flexShrink: 0,
      marginTop: "0.125rem",
    },
    featureItemMore: {
      fontStyle: "italic",
      color: colors.accentGold, // Use defined color
      fontWeight: "600",
    },
    toolDeliverables: {
      marginBottom: "1.5rem",
    },
    deliverablesTitle: {
      fontSize: "1rem",
      fontWeight: "700",
      color: colors.darkBrown, // Use defined color
      marginBottom: "0.75rem",
    },
    deliverablesList: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    },
    deliverableItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      padding: "0.5rem",
      background: colors.cream, // Use defined color
      borderRadius: "8px",
      border: `1px solid ${colors.lightTan}`, // Use defined color
    },
    deliverableIcon: {
      width: "1.25rem",
      height: "1.25rem",
      color: colors.accentGold, // Use defined color
      flexShrink: 0,
    },
    deliverableInfo: {
      flex: "1",
    },
    deliverableName: {
      fontSize: "0.9rem",
      fontWeight: "600",
      color: colors.darkBrown, // Use defined color
      display: "block",
    },
    deliverableMeta: {
      fontSize: "0.75rem",
      color: colors.mediumBrown, // Use defined color
    },
    toolCardFooter: {
      borderTop: `1px solid ${colors.lightTan}`, // Use defined color
      paddingTop: "1.5rem",
    },
    toolMeta: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1rem",
      flexWrap: "wrap",
      gap: "1rem",
    },
    purchaseInfo: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      color: colors.mediumBrown, // Use defined color
      fontSize: "0.9rem",
    },
    metaIcon: {
      width: "1rem",
      height: "1rem",
    },
    amountInfo: {
      fontSize: "1.25rem",
      fontWeight: "700",
      color: colors.accentGold, // Use defined color
    },
    toolActions: {
      display: "flex",
      gap: "1rem",
    },
    actionBtn: {
      flex: "1",
      padding: "0.875rem 1.5rem",
      borderRadius: "10px",
      fontWeight: "600",
      fontSize: "0.9rem",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    actionBtnSecondary: {
      background: colors.cream, // Use defined color
      color: colors.mediumBrown, // Use defined color
      border: `2px solid ${colors.lightTan}`, // Use defined color
    },
    actionBtnPrimary: {
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`, // Use defined colors
      color: colors.lightText, // Use defined color
      border: "none",
      boxShadow: `0 4px 12px ${colors.accentGold}30`, // Use defined color
    },
    actionIcon: {
      width: "1rem",
      height: "1rem",
    },
    emptyState: {
      textAlign: "center",
      padding: "4rem 2rem",
      background: colors.offWhite, // Use defined color
      borderRadius: "20px",
      border: `2px dashed ${colors.lightTan}`, // Use defined color
      color: colors.mediumBrown, // Use defined color
    },
    emptyIcon: {
      width: "4rem",
      height: "4rem",
      color: colors.lightBrown, // Use defined color
      marginBottom: "1.5rem",
    },
    emptyTitle: {
      fontSize: "1.5rem",
      fontWeight: "700",
      color: colors.darkBrown, // Use defined color
      marginBottom: "1rem",
    },
    emptyDescription: {
      fontSize: "1rem",
      lineHeight: "1.6",
      marginBottom: "2rem",
      maxWidth: "500px",
      margin: "0 auto 2rem auto",
    },
    emptyCtaBtn: {
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`, // Use defined colors
      color: colors.lightText, // Use defined color
      border: "none",
      padding: "1rem 2rem",
      borderRadius: "12px",
      fontWeight: "700",
      fontSize: "1rem",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      boxShadow: `0 4px 16px ${colors.accentGold}30`, // Use defined color
    },
    summarySection: {
      marginTop: "3rem",
    },
    summaryCard: {
      background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`, // Use defined colors
      borderRadius: "20px",
      padding: "2.5rem",
      boxShadow: `0 8px 32px ${colors.darkBrown}15`, // Use defined color
      border: `1px solid ${colors.lightTan}`, // Use defined color
    },
    summaryTitle: {
      fontSize: "1.75rem",
      fontWeight: "700",
      color: colors.darkBrown, // Use defined color
      textAlign: "center",
      marginBottom: "2rem",
    },
    summaryStats: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "2rem",
    },
    statItem: {
      textAlign: "center",
      padding: "1.5rem",
      background: colors.offWhite, // Use defined color
      borderRadius: "16px",
      border: `1px solid ${colors.lightTan}`, // Use defined color
      boxShadow: `0 4px 12px ${colors.darkBrown}08`, // Use defined color
    },
    statNumber: {
      fontSize: "2.5rem",
      fontWeight: "800",
      color: colors.accentGold, // Use defined color
      marginBottom: "0.5rem",
      lineHeight: "1",
    },
    statLabel: {
      fontSize: "0.9rem",
      fontWeight: "600",
      color: colors.mediumBrown, // Use defined color
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
  }

  useEffect(() => {
    const loadPurchasedTools = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }
      try {
        const purchasesRef = collection(db, "growthToolsPurchases")
        const q = query(purchasesRef, where("userId", "==", user.uid), where("status", "==", "Success"))
        const querySnapshot = await getDocs(q)
        const tools = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          const tool = {
            id: doc.id,
            title: data.packageName || "Unknown Package",
            package:
              data.type === "template" ? "Templates" : data.type === "bundle" ? "Bundle Package" : "Growth Tools",
            tier: data.tier || "Standard",
            icon: getToolIcon(data.category || data.type),
            status: "delivered",
            purchaseDate: data.createdAt?.toDate?.() || new Date(data.createdAt),
            description: getToolDescription(data),
            features: getToolFeatures(data),
            deliverables: getToolDeliverables(data),
            category: data.category || getCategoryFromType(data.type),
            amount: data.amount || 0,
            transactionRef: data.transactionRef,
            deliveryStatus: data.deliveryStatus || "delivered",
          }
          tools.push(tool)
        })
        // Sort by purchase date (newest first)
        tools.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
        setPurchasedTools(tools)
      } catch (error) {
        console.error("Error loading purchased tools:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadPurchasedTools()
  }, [user, db])

  // Helper functions updated for real data
  const getToolIcon = (category) => {
    const iconMap = {
      compliance: <Shield className="w-8 h-8" />,
      legitimacy: <Award className="w-8 h-8" />,
      fundability: <Target className="w-8 h-8" />,
      governance: <Users className="w-8 h-8" />,
      templates: <FileText className="w-8 h-8" />,
      bundles: <Package className="w-8 h-8" />,
      growth_tool: <Zap className="w-8 h-8" />,
    }
    return iconMap[category?.toLowerCase()] || <Package className="w-8 h-8" />
  }
  const getToolDescription = (data) => {
    if (data.type === "template") {
      return `${data.packageName} - Professional template ready for immediate use with comprehensive documentation and implementation guides.`
    }
    if (data.type === "bundle") {
      return `${data.packageName} - Complete bundle package with multiple resources, templates, and tools for comprehensive business growth.`
    }
    return `${data.packageName} - ${data.tier} tier package with comprehensive tools, resources, and expert guidance for business development.`
  }
  const getToolFeatures = (data) => {
    const baseFeatures = [
      "Digital delivery within 24-48 hours",
      "Lifetime access to purchased content",
      "Email support included",
      "Updates and revisions as needed",
    ]
    if (data.category === "compliance" || data.packageName?.toLowerCase().includes("compliance")) {
      return [
        "Policy templates and documentation",
        "Compliance checklists and guides",
        "Legal framework alignment",
        "Implementation roadmap",
        ...baseFeatures,
      ]
    }
    if (data.category === "legitimacy" || data.packageName?.toLowerCase().includes("legitimacy")) {
      return [
        "Brand identity and design assets",
        "Marketing materials and templates",
        "Online presence optimization",
        "Professional branding kit",
        ...baseFeatures,
      ]
    }
    if (data.category === "fundability" || data.packageName?.toLowerCase().includes("fundability")) {
      return [
        "Business plan templates",
        "Financial modeling tools",
        "Investor presentation materials",
        "Funding strategy guides",
        ...baseFeatures,
      ]
    }
    if (data.category === "governance" || data.packageName?.toLowerCase().includes("governance")) {
      return [
        "Performance management tools",
        "Leadership development resources",
        "Organizational structure templates",
        "Governance frameworks",
        ...baseFeatures,
      ]
    }
    return baseFeatures
  }
  const getToolDeliverables = (data) => {
    const baseDeliverables = [
      { name: "Purchase Confirmation", type: "document", size: "1 MB" },
      { name: "Access Instructions", type: "document", size: "500 KB" },
    ]
    if (data.type === "growth_tool") {
      return [
        { name: `${data.packageName} Package`, type: "design", size: "25 MB" },
        { name: "Implementation Guide", type: "document", size: "5 MB" },
        { name: "Templates & Resources", type: "template", size: "15 MB" },
        { name: "Video Tutorials", type: "video", size: "100 MB" },
        ...baseDeliverables,
      ]
    }
    if (data.type === "template") {
      return [
        { name: `${data.packageName}`, type: "template", size: "5 MB" },
        { name: "Usage Guide", type: "document", size: "2 MB" },
        { name: "Customization Instructions", type: "document", size: "1 MB" },
        ...baseDeliverables,
      ]
    }
    if (data.type === "bundle") {
      return [
        { name: `${data.packageName} Bundle`, type: "bundle", size: "50 MB" },
        { name: "Bundle Guide", type: "document", size: "8 MB" },
        { name: "Individual Templates", type: "template", size: "30 MB" },
        { name: "Implementation Roadmap", type: "document", size: "3 MB" },
        ...baseDeliverables,
      ]
    }
    return baseDeliverables
  }
  const getCategoryFromType = (type) => {
    const typeMap = {
      growth_tool: "tools",
      template: "templates",
      bundle: "bundles",
    }
    return typeMap[type] || "tools"
  }

  const filterOptions = [
    { id: "all", label: "All Tools", count: purchasedTools.length },
    { id: "compliance", label: "Compliance", count: purchasedTools.filter((t) => t.category === "compliance").length },
    { id: "legitimacy", label: "Legitimacy", count: purchasedTools.filter((t) => t.category === "legitimacy").length },
    {
      id: "fundability",
      label: "Fundability",
      count: purchasedTools.filter((t) => t.category === "fundability").length,
    },
    { id: "governance", label: "Governance", count: purchasedTools.filter((t) => t.category === "governance").length },
    { id: "templates", label: "Templates", count: purchasedTools.filter((t) => t.category === "templates").length },
    { id: "bundles", label: "Bundles", count: purchasedTools.filter((t) => t.category === "bundles").length },
  ]

  const filteredTools = useMemo(() => {
    let filtered = purchasedTools
    if (activeFilter !== "all") {
      filtered = filtered.filter((tool) => tool.category === activeFilter)
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (tool) =>
          tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.package.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }
    return filtered
  }, [purchasedTools, activeFilter, searchQuery])

  const handleDownload = (tool) => {
    console.log("Downloading tool:", tool.title)
    // Implement download logic
    alert(`Downloading ${tool.title}...`)
  }

  const handlePreview = (tool) => {
    console.log("Previewing tool:", tool.title)
    // Implement preview logic
    alert(`Opening preview for ${tool.title}...`)
  }

  const handleShopMore = () => {
    window.location.href = "/growth/shop-tools"
  }

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              border: `4px solid ${colors.lightTan}`, // Use defined color
              borderTop: `4px solid ${colors.accentGold}`, // Use defined color
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          ></div>
          <p style={{ color: colors.mediumBrown, fontSize: "1.25rem", fontWeight: "600" }}>Loading your tools...</p>
          <style jsx>{`
            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Beta Testing Notice */}
      <div style={styles.betaNotice}>
        <Settings className="w-6 h-6" style={{ color: "#856404" }} />
        <span>
          <strong>Beta Testing Phase:</strong> Tool delivery and download features are currently unavailable in beta
          testing. This page shows your purchase history and will be fully functional at launch.
        </span>
      </div>

      {/* Header */}
      <div style={styles.pageHeader}>
        <div style={styles.headerContent}>
          <div style={styles.headerText}>
            <h1 style={styles.pageTitle}>My Growth Tools</h1>
            <p style={styles.pageSubtitle}>Access and manage all your purchased business growth tools and templates</p>
          </div>
          <div style={styles.headerActions}>
            <button
              style={styles.shopMoreBtn}
              onClick={handleShopMore}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = `0 8px 24px ${colors.accentGold}40` // Use defined color
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = `0 4px 16px ${colors.accentGold}30` // Use defined color
              }}
            >
              <ShoppingCart className="w-5 h-5" />
              Shop More Tools
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={styles.controlsSection}>
        <div style={styles.searchContainer}>
          <Search style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search your tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.accentGold // Use defined color
              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accentGold}1A` // Use defined color
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.lightTan // Use defined color
              e.currentTarget.style.boxShadow = "none"
            }}
          />
        </div>
        <div style={styles.filtersContainer}>
          <Filter style={styles.filterIcon} />
          <div style={styles.filterButtons}>
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveFilter(option.id)}
                style={{
                  ...styles.filterBtn,
                  ...(activeFilter === option.id ? styles.filterBtnActive : {}),
                }}
                onMouseEnter={(e) => {
                  if (activeFilter !== option.id) {
                    e.currentTarget.style.borderColor = colors.lightTan // Use defined color
                    e.currentTarget.style.background = colors.cream // Use defined color
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFilter !== option.id) {
                    e.currentTarget.style.borderColor = colors.lightTan // Use defined color
                    e.currentTarget.style.background = colors.offWhite // Use defined color
                  }
                }}
              >
                {option.label}
                <span
                  style={{
                    ...styles.filterCount,
                    ...(activeFilter === option.id
                      ? { background: "rgba(255, 255, 255, 0.2)", color: colors.lightText }
                      : { background: colors.cream, color: colors.mediumBrown }),
                  }}
                >
                  ({option.count})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div style={styles.toolsSection}>
        {filteredTools.length === 0 ? (
          <div style={styles.emptyState}>
            <Package style={styles.emptyIcon} />
            <h3 style={styles.emptyTitle}>
              {purchasedTools.length === 0 ? "No Tools Purchased Yet" : "No Tools Found"}
            </h3>
            <p style={styles.emptyDescription}>
              {purchasedTools.length === 0
                ? "Start building your business with our comprehensive growth tools and templates. Browse our collection of professional resources designed to boost your BIG Score."
                : "Try adjusting your search or filter criteria to find what you're looking for."}
            </p>
            <button
              style={styles.emptyCtaBtn}
              onClick={handleShopMore}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = `0 8px 24px ${colors.accentGold}40` // Use defined color
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = `0 4px 16px ${colors.accentGold}30` // Use defined color
              }}
            >
              <ShoppingCart className="w-5 h-5" />
              Browse Growth Tools
            </button>
          </div>
        ) : (
          <div style={styles.toolsGrid}>
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                style={styles.toolCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)"
                  e.currentTarget.style.boxShadow = `0 16px 40px ${colors.darkBrown}26` // Use defined color
                  e.currentTarget.style.borderColor = colors.lightBrown // Use defined color
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = `0 8px 24px ${colors.darkBrown}10` // Use defined color
                  e.currentTarget.style.borderColor = colors.lightTan // Use defined color
                }}
              >
                <div style={styles.toolCardHeader}>
                  <div style={styles.toolIconContainer}>{tool.icon}</div>
                  <div style={styles.toolStatus}>
                    <div style={styles.statusBadge}>
                      <Check style={styles.statusIcon} />
                      {tool.deliveryStatus === "delivered" ? "Delivered" : "Processing"}
                    </div>
                  </div>
                </div>
                <div style={styles.toolCardBody}>
                  <h3 style={styles.toolTitle}>{tool.title}</h3>
                  <p style={styles.toolPackage}>
                    {tool.package} • {tool.tier}
                  </p>
                  <p style={styles.toolDescription}>{tool.description}</p>
                  <div style={styles.toolFeatures}>
                    <h4 style={styles.featuresTitle}>What's Included:</h4>
                    <ul style={styles.featuresList}>
                      {tool.features.slice(0, 3).map((feature, index) => (
                        <li key={index} style={styles.featureItem}>
                          <Check style={styles.featureCheck} />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {tool.features.length > 3 && (
                        <li style={{ ...styles.featureItem, ...styles.featureItemMore }}>
                          <Star style={styles.featureCheck} />+{tool.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  </div>
                  <div style={styles.toolDeliverables}>
                    <h4 style={styles.deliverablesTitle}>Deliverables:</h4>
                    <div style={styles.deliverablesList}>
                      {tool.deliverables.slice(0, 3).map((deliverable, index) => (
                        <div key={index} style={styles.deliverableItem}>
                          <FileText style={styles.deliverableIcon} />
                          <div style={styles.deliverableInfo}>
                            <span style={styles.deliverableName}>{deliverable.name}</span>
                            <span style={styles.deliverableMeta}>
                              {deliverable.type} • {deliverable.size}
                            </span>
                          </div>
                        </div>
                      ))}
                      {tool.deliverables.length > 3 && (
                        <div style={styles.deliverableItem}>
                          <Package style={styles.deliverableIcon} />
                          <div style={styles.deliverableInfo}>
                            <span style={styles.deliverableName}>+{tool.deliverables.length - 3} more files</span>
                            <span style={styles.deliverableMeta}>Additional resources included</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div style={styles.toolCardFooter}>
                  <div style={styles.toolMeta}>
                    <div style={styles.purchaseInfo}>
                      <Calendar style={styles.metaIcon} />
                      <span>Purchased {new Date(tool.purchaseDate).toLocaleDateString()}</span>
                    </div>
                    {tool.amount > 0 && (
                      <div style={styles.amountInfo}>
                        <span>ZAR {tool.amount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div style={styles.toolActions}>
                    <button
                      style={{ ...styles.actionBtn, ...styles.actionBtnSecondary }}
                      onClick={() => handlePreview(tool)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.lightTan // Use defined color
                        e.currentTarget.style.transform = "translateY(-2px)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = colors.cream // Use defined color
                        e.currentTarget.style.transform = "translateY(0)"
                      }}
                    >
                      <Eye style={styles.actionIcon} />
                      Preview
                    </button>
                    <button
                      style={{ ...styles.actionBtn, ...styles.actionBtnPrimary }}
                      onClick={() => handleDownload(tool)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)"
                        e.currentTarget.style.boxShadow = `0 8px 20px ${colors.accentGold}40` // Use defined color
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)"
                        e.currentTarget.style.boxShadow = `0 4px 12px ${colors.accentGold}30` // Use defined color
                      }}
                    >
                      <Download style={styles.actionIcon} />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {purchasedTools.length > 0 && (
        <div style={styles.summarySection}>
          <div style={styles.summaryCard}>
            <h3 style={styles.summaryTitle}>Your Growth Journey</h3>
            <div style={styles.summaryStats}>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>{purchasedTools.length}</div>
                <div style={styles.statLabel}>Tools Purchased</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>
                  {purchasedTools.reduce((sum, tool) => sum + (tool.amount || 0), 0).toLocaleString()}
                </div>
                <div style={styles.statLabel}>Total Investment (ZAR)</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>{new Set(purchasedTools.map((tool) => tool.category)).size}</div>
                <div style={styles.statLabel}>Categories Covered</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>
                  {Math.round(
                    purchasedTools.reduce((sum, tool) => sum + (tool.amount || 0), 0) / purchasedTools.length,
                  ).toLocaleString()}
                </div>
                <div style={styles.statLabel}>Average Investment</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyToolsPage
