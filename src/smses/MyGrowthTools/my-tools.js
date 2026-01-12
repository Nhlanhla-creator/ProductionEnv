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
  ExternalLink,
  Clock,
  CheckCircle,
  MessageSquare,
  Paperclip,
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

  const colors = {
    darkBrown: "#372C27",
    mediumBrown: "#5D4037",
    lightBrown: "#8D6E63",
    accentGold: "#A67C52",
    offWhite: "#F5F2F0",
    cream: "#EFEBE9",
    lightTan: "#D7CCC8",
    darkText: "#2C2927",
    lightText: "#F5F2F0",
    gradientStart: "#4A352F",
    gradientEnd: "#7D5A50",
  }

  const styles = {
    container: {
      padding: "0 0.5rem",
      fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
      background: colors.offWhite,
      minHeight: "calc(100vh - 100px)",
      width: "100%",
      maxWidth: "100%",
      overflow: "visible",
    },
    betaNotice: {
      background: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)",
      color: "#065F46",
      border: "2px solid #34D399",
      borderRadius: "16px",
      padding: "1.25rem 2rem",
      margin: "0 auto 2rem auto",
      width: "100%",
      maxWidth: "100%",
      fontWeight: 600,
      fontSize: "1rem",
      textAlign: "center",
      boxShadow: "0 8px 24px rgba(52, 211, 153, 0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.75rem",
    },
    pageHeader: {
      background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`,
      borderRadius: "20px",
      padding: "2.5rem 2rem",
      marginBottom: "2rem",
      boxShadow: `0 8px 32px ${colors.darkBrown}15`,
      border: `1px solid ${colors.lightTan}`,
      width: "100%",
    },
    headerContent: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "1.5rem",
      width: "100%",
    },
    headerText: {
      flex: "1",
      minWidth: "250px",
    },
    pageTitle: {
      fontSize: "2.25rem",
      fontWeight: "800",
      background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      margin: "0 0 0.75rem 0",
      letterSpacing: "-0.5px",
    },
    pageSubtitle: {
      fontSize: "1.1rem",
      color: colors.mediumBrown,
      lineHeight: "1.5",
      margin: "0",
    },
    headerActions: {
      display: "flex",
      gap: "1rem",
    },
    shopMoreBtn: {
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      border: "none",
      padding: "0.875rem 1.75rem",
      borderRadius: "10px",
      fontWeight: "700",
      fontSize: "0.95rem",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      boxShadow: `0 4px 16px ${colors.accentGold}30`,
      whiteSpace: "nowrap",
    },
    controlsSection: {
      background: colors.offWhite,
      borderRadius: "16px",
      padding: "1.5rem",
      marginBottom: "2rem",
      boxShadow: `0 4px 16px ${colors.darkBrown}10`,
      border: `1px solid ${colors.lightTan}`,
      width: "100%",
    },
    searchContainer: {
      position: "relative",
      marginBottom: "1.5rem",
      width: "100%",
      maxWidth: "500px",
    },
    searchIcon: {
      position: "absolute",
      left: "1rem",
      top: "50%",
      transform: "translateY(-50%)",
      color: colors.accentGold,
      width: "1.25rem",
      height: "1.25rem",
    },
    searchInput: {
      width: "100%",
      padding: "0.875rem 1rem 0.875rem 3rem",
      borderRadius: "10px",
      border: `2px solid ${colors.lightTan}`,
      fontSize: "0.95rem",
      transition: "all 0.3s ease",
      background: colors.cream,
      color: colors.darkText,
    },
    filtersContainer: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      flexWrap: "wrap",
      width: "100%",
    },
    filterIcon: {
      color: colors.accentGold,
      width: "1.25rem",
      height: "1.25rem",
    },
    filterButtons: {
      display: "flex",
      gap: "0.5rem",
      flexWrap: "wrap",
      flex: "1",
    },
    filterBtn: {
      padding: "0.625rem 1.25rem",
      borderRadius: "20px",
      border: `2px solid ${colors.lightTan}`,
      background: colors.offWhite,
      color: colors.mediumBrown,
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontSize: "0.85rem",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      gap: "0.375rem",
      whiteSpace: "nowrap",
    },
    filterBtnActive: {
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      borderColor: colors.accentGold,
      boxShadow: `0 4px 12px ${colors.accentGold}30`,
    },
    filterCount: {
      background: "rgba(255, 255, 255, 0.2)",
      padding: "0.125rem 0.375rem",
      borderRadius: "10px",
      fontSize: "0.7rem",
      fontWeight: "700",
    },
    toolsSection: {
      marginBottom: "2.5rem",
      width: "100%",
    },
    toolsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
      gap: "1.5rem",
      width: "100%",
    },
    toolCard: {
      background: colors.offWhite,
      borderRadius: "18px",
      padding: "1.75rem",
      boxShadow: `0 8px 24px ${colors.darkBrown}10`,
      border: `2px solid ${colors.lightTan}`,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",
      overflow: "hidden",
      width: "100%",
    },
    toolCardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "1.25rem",
      width: "100%",
    },
    toolIconContainer: {
      width: "3.5rem",
      height: "3.5rem",
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
      borderRadius: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: colors.accentGold,
      border: `2px solid ${colors.lightTan}`,
    },
    toolStatus: {
      display: "flex",
      alignItems: "center",
    },
    statusBadge: {
      padding: "0.375rem 0.875rem",
      borderRadius: "18px",
      fontSize: "0.7rem",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      display: "flex",
      alignItems: "center",
      gap: "0.375rem",
    },
    statusDelivered: {
      background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
      color: "#15803d",
      border: "1px solid #86efac",
    },
    statusProcessing: {
      background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
      color: "#92400E",
      border: "1px solid #FCD34D",
    },
    statusIcon: {
      width: "0.875rem",
      height: "0.875rem",
    },
    toolCardBody: {
      marginBottom: "1.75rem",
      width: "100%",
    },
    toolTitle: {
      fontSize: "1.375rem",
      fontWeight: "700",
      color: colors.darkBrown,
      margin: "0 0 0.375rem 0",
      lineHeight: "1.3",
    },
    toolPackage: {
      color: colors.accentGold,
      fontSize: "0.95rem",
      fontWeight: "600",
      marginBottom: "0.875rem",
    },
    toolDescription: {
      color: colors.mediumBrown,
      lineHeight: "1.5",
      marginBottom: "1.25rem",
      fontSize: "0.9rem",
    },
    toolFeatures: {
      marginBottom: "1.25rem",
    },
    featuresTitle: {
      fontSize: "0.95rem",
      fontWeight: "700",
      color: colors.darkBrown,
      marginBottom: "0.625rem",
    },
    featuresList: {
      listStyle: "none",
      padding: "0",
      margin: "0",
    },
    featureItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: "0.375rem",
      marginBottom: "0.375rem",
      fontSize: "0.85rem",
      color: colors.mediumBrown,
      lineHeight: "1.4",
    },
    featureCheck: {
      width: "0.875rem",
      height: "0.875rem",
      color: colors.accentGold,
      flexShrink: 0,
      marginTop: "0.125rem",
    },
    featureItemMore: {
      fontStyle: "italic",
      color: colors.accentGold,
      fontWeight: "600",
    },
    // NEW: Specifications section
    toolSpecifications: {
      marginBottom: "1.25rem",
      padding: "1rem",
      background: `${colors.accentGold}10`,
      border: `2px solid ${colors.accentGold}30`,
      borderRadius: "10px",
    },
    specsTitle: {
      fontSize: "0.95rem",
      fontWeight: "700",
      color: colors.darkBrown,
      marginBottom: "0.625rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    specsText: {
      fontSize: "0.85rem",
      color: colors.mediumBrown,
      lineHeight: "1.5",
      marginBottom: "0.75rem",
      whiteSpace: "pre-wrap",
    },
    specsFiles: {
      display: "flex",
      flexDirection: "column",
      gap: "0.375rem",
    },
    specFileItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.5rem",
      background: colors.cream,
      borderRadius: "6px",
      fontSize: "0.8rem",
      color: colors.darkBrown,
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    toolDeliverables: {
      marginBottom: "1.25rem",
    },
    deliverablesTitle: {
      fontSize: "0.95rem",
      fontWeight: "700",
      color: colors.darkBrown,
      marginBottom: "0.625rem",
    },
    deliverablesList: {
      display: "flex",
      flexDirection: "column",
      gap: "0.375rem",
    },
    deliverableItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.625rem",
      padding: "0.625rem",
      background: colors.cream,
      borderRadius: "8px",
      border: `1px solid ${colors.lightTan}`,
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    deliverableIcon: {
      width: "1.125rem",
      height: "1.125rem",
      color: colors.accentGold,
      flexShrink: 0,
    },
    deliverableInfo: {
      flex: "1",
    },
    deliverableName: {
      fontSize: "0.85rem",
      fontWeight: "600",
      color: colors.darkBrown,
      display: "block",
    },
    deliverableMeta: {
      fontSize: "0.7rem",
      color: colors.mediumBrown,
    },
    downloadLink: {
      color: colors.accentGold,
      textDecoration: "none",
      display: "flex",
      alignItems: "center",
      gap: "0.375rem",
      fontWeight: "600",
      fontSize: "0.8rem",
    },
    toolCardFooter: {
      borderTop: `1px solid ${colors.lightTan}`,
      paddingTop: "1.25rem",
      width: "100%",
    },
    toolMeta: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "0.875rem",
      flexWrap: "wrap",
      gap: "0.875rem",
      width: "100%",
    },
    purchaseInfo: {
      display: "flex",
      alignItems: "center",
      gap: "0.375rem",
      color: colors.mediumBrown,
      fontSize: "0.85rem",
    },
    metaIcon: {
      width: "0.875rem",
      height: "0.875rem",
    },
    amountInfo: {
      fontSize: "1.125rem",
      fontWeight: "700",
      color: colors.accentGold,
    },
    toolActions: {
      display: "flex",
      gap: "0.875rem",
    },
    actionBtn: {
      flex: "1",
      padding: "0.75rem 1.25rem",
      borderRadius: "8px",
      fontWeight: "600",
      fontSize: "0.85rem",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.375rem",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    actionBtnSecondary: {
      background: colors.cream,
      color: colors.mediumBrown,
      border: `2px solid ${colors.lightTan}`,
    },
    actionBtnPrimary: {
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      border: "none",
      boxShadow: `0 4px 12px ${colors.accentGold}30`,
    },
    actionIcon: {
      width: "0.875rem",
      height: "0.875rem",
    },
    emptyState: {
      textAlign: "center",
      padding: "3rem 1.5rem",
      background: colors.offWhite,
      borderRadius: "18px",
      border: `2px dashed ${colors.lightTan}`,
      color: colors.mediumBrown,
      width: "100%",
    },
    emptyIcon: {
      width: "3.5rem",
      height: "3.5rem",
      color: colors.lightBrown,
      marginBottom: "1.25rem",
    },
    emptyTitle: {
      fontSize: "1.375rem",
      fontWeight: "700",
      color: colors.darkBrown,
      marginBottom: "0.875rem",
    },
    emptyDescription: {
      fontSize: "0.95rem",
      lineHeight: "1.5",
      marginBottom: "1.5rem",
      maxWidth: "500px",
      margin: "0 auto 1.5rem auto",
    },
    emptyCtaBtn: {
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      border: "none",
      padding: "0.875rem 1.75rem",
      borderRadius: "10px",
      fontWeight: "700",
      fontSize: "0.95rem",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.375rem",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      boxShadow: `0 4px 16px ${colors.accentGold}30`,
    },
    summarySection: {
      marginTop: "2.5rem",
      width: "100%",
    },
    summaryCard: {
      background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`,
      borderRadius: "18px",
      padding: "2rem",
      boxShadow: `0 8px 32px ${colors.darkBrown}15`,
      border: `1px solid ${colors.lightTan}`,
      width: "100%",
    },
    summaryTitle: {
      fontSize: "1.5rem",
      fontWeight: "700",
      color: colors.darkBrown,
      textAlign: "center",
      marginBottom: "1.75rem",
    },
    summaryStats: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "1.5rem",
      width: "100%",
    },
    statItem: {
      textAlign: "center",
      padding: "1.25rem",
      background: colors.offWhite,
      borderRadius: "14px",
      border: `1px solid ${colors.lightTan}`,
      boxShadow: `0 4px 12px ${colors.darkBrown}08`,
    },
    statNumber: {
      fontSize: "2rem",
      fontWeight: "800",
      color: colors.accentGold,
      marginBottom: "0.375rem",
      lineHeight: "1",
    },
    statLabel: {
      fontSize: "0.8rem",
      fontWeight: "600",
      color: colors.mediumBrown,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    noFilesMessage: {
      padding: "0.875rem",
      background: "#FEF3C7",
      border: "2px solid #FCD34D",
      borderRadius: "8px",
      color: "#92400E",
      fontSize: "0.85rem",
      textAlign: "center",
      marginTop: "0.875rem",
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
            status: data.deliveryStatus || "processing",
            purchaseDate: data.createdAt?.toDate?.() || new Date(data.createdAt),
            description: getToolDescription(data),
            features: getToolFeatures(data),
            deliverables: data.deliverables || [],
            // NEW: Add specifications
            specifications: data.customerSpecifications || null,
            specificationFiles: data.specificationFiles || [],
            category: data.category || getCategoryFromType(data.type),
            amount: data.totalAmount || 0,
            transactionRef: data.transactionRef,
            deliveryStatus: data.deliveryStatus || "processing",
            deliveredAt: data.deliveredAt?.toDate?.(),
          }
          tools.push(tool)
        })
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

  const handleDownload = (url, filename) => {
    window.open(url, '_blank')
  }

  const handleShopMore = () => {
    window.location.href = "/growth/shop-tools"
  }

  const getStatusBadge = (deliveryStatus) => {
    if (deliveryStatus === "delivered") {
      return (
        <div style={{ ...styles.statusBadge, ...styles.statusDelivered }}>
          <CheckCircle style={styles.statusIcon} />
          Delivered
        </div>
      )
    } else {
      return (
        <div style={{ ...styles.statusBadge, ...styles.statusProcessing }}>
          <Clock style={styles.statusIcon} />
          Processing
        </div>
      )
    }
  }

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "300px",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <div
            style={{
              width: "70px",
              height: "70px",
              border: `4px solid ${colors.lightTan}`,
              borderTop: `4px solid ${colors.accentGold}`,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          ></div>
          <p style={{ color: colors.mediumBrown, fontSize: "1.125rem", fontWeight: "600" }}>Loading your tools...</p>
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
      {/* Beta Notice */}
      <div style={styles.betaNotice}>
        <CheckCircle className="w-6 h-6" style={{ color: "#065F46" }} />
        <span>
          <strong>✅ Files Delivered:</strong> Download your growth tools directly from this page once they've been processed and delivered by our team.
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
                e.currentTarget.style.boxShadow = `0 8px 24px ${colors.accentGold}40`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = `0 4px 16px ${colors.accentGold}30`
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
              e.currentTarget.style.borderColor = colors.accentGold
              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accentGold}1A`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.lightTan
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
                    e.currentTarget.style.borderColor = colors.lightTan
                    e.currentTarget.style.background = colors.cream
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFilter !== option.id) {
                    e.currentTarget.style.borderColor = colors.lightTan
                    e.currentTarget.style.background = colors.offWhite
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
                e.currentTarget.style.boxShadow = `0 8px 24px ${colors.accentGold}40`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = `0 4px 16px ${colors.accentGold}30`
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
                  e.currentTarget.style.transform = "translateY(-6px)"
                  e.currentTarget.style.boxShadow = `0 16px 40px ${colors.darkBrown}26`
                  e.currentTarget.style.borderColor = colors.lightBrown
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = `0 8px 24px ${colors.darkBrown}10`
                  e.currentTarget.style.borderColor = colors.lightTan
                }}
              >
                <div style={styles.toolCardHeader}>
                  <div style={styles.toolIconContainer}>{tool.icon}</div>
                  <div style={styles.toolStatus}>
                    {getStatusBadge(tool.deliveryStatus)}
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
                  
                  {/* NEW: Show Customer Specifications */}
                  {(tool.specifications || (tool.specificationFiles && tool.specificationFiles.length > 0)) && (
                    <div style={styles.toolSpecifications}>
                      <h4 style={styles.specsTitle}>
                        <MessageSquare size={16} />
                        Your Specifications
                      </h4>
                      {tool.specifications && (
                        <div style={styles.specsText}>{tool.specifications}</div>
                      )}
                      {tool.specificationFiles && tool.specificationFiles.length > 0 && (
                        <div style={styles.specsFiles}>
                          <div style={{ fontSize: "0.8rem", fontWeight: "600", color: colors.darkBrown, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <Paperclip size={14} />
                            Reference Files ({tool.specificationFiles.length})
                          </div>
                          {tool.specificationFiles.map((file, idx) => (
                            <div 
                              key={idx} 
                              style={styles.specFileItem}
                              onClick={() => handleDownload(file.url, file.name)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = colors.lightTan
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = colors.cream
                              }}
                            >
                              <FileText size={14} color={colors.accentGold} />
                              <span style={{ flex: 1 }}>{file.name}</span>
                              <Download size={12} color={colors.accentGold} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Show Deliverables if Delivered */}
                  {tool.deliveryStatus === "delivered" && tool.deliverables && tool.deliverables.length > 0 ? (
                    <div style={styles.toolDeliverables}>
                      <h4 style={styles.deliverablesTitle}>📥 Your Files (Ready to Download):</h4>
                      <div style={styles.deliverablesList}>
                        {tool.deliverables.map((deliverable, index) => (
                          <div 
                            key={index} 
                            style={styles.deliverableItem}
                            onClick={() => handleDownload(deliverable.url, deliverable.name)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = colors.lightTan
                              e.currentTarget.style.transform = "translateX(5px)"
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = colors.cream
                              e.currentTarget.style.transform = "translateX(0)"
                            }}
                          >
                            <Download style={styles.deliverableIcon} />
                            <div style={styles.deliverableInfo}>
                              <span style={styles.deliverableName}>{deliverable.name}</span>
                              <span style={styles.deliverableMeta}>
                                {deliverable.size} • Click to download
                              </span>
                            </div>
                            <ExternalLink size={16} color={colors.accentGold} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : tool.deliveryStatus === "processing" ? (
                    <div style={styles.noFilesMessage}>
                      <Clock size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
                      <strong>Files are being prepared...</strong> You'll receive an email when they're ready to download.
                    </div>
                  ) : null}
                </div>
                <div style={styles.toolCardFooter}>
                  <div style={styles.toolMeta}>
                    <div style={styles.purchaseInfo}>
                      <Calendar style={styles.metaIcon} />
                      <span>Purchased {new Date(tool.purchaseDate).toLocaleDateString()}</span>
                    </div>
                    {tool.amount > 0 && (
                      <div style={styles.amountInfo}>
                        <span>R{tool.amount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  {tool.deliveryStatus === "delivered" && tool.deliveredAt && (
                    <div style={{ fontSize: "0.8rem", color: colors.mediumBrown, marginTop: "0.5rem", textAlign: "center" }}>
                      ✅ Delivered on {new Date(tool.deliveredAt).toLocaleDateString()}
                    </div>
                  )}
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
                  {purchasedTools.filter(t => t.deliveryStatus === "delivered").length}
                </div>
                <div style={styles.statLabel}>Tools Delivered</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>
                  R{purchasedTools.reduce((sum, tool) => sum + (tool.amount || 0), 0).toLocaleString()}
                </div>
                <div style={styles.statLabel}>Total Investment</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>{new Set(purchasedTools.map((tool) => tool.category)).size}</div>
                <div style={styles.statLabel}>Categories Covered</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyToolsPage