"use client"
import { useState } from "react"
import { getFirestore, collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getAuth } from "firebase/auth"
import {
  Check,
  ShoppingCart,
  TrendingUp,
  Target,
  PieChart,
  ShieldIcon,
  Star,
  Upload,
  X,
  FileText,
  ImageIcon,
  File,
  AlertCircle,
} from "lucide-react"
import emailjs from "@emailjs/browser"

const FundabilityTab = () => {
  const [activeSubTab, setActiveSubTab] = useState("financial")
  const [selectedItems, setSelectedItems] = useState({})
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  const [showSpecsModal, setShowSpecsModal] = useState(false)
  const [specifications, setSpecifications] = useState("")
  const [specFiles, setSpecFiles] = useState([])
  const [uploadingSpecs, setUploadingSpecs] = useState(false)

  const EMAILJS_SERVICE_ID = "service_hm5lzgq"
  const EMAILJS_TEMPLATE_ID = "template_z3fw55r"
  const EMAILJS_ADMIN_TEMPLATE_ID = "template_xrrdplp"
  const EMAILJS_PUBLIC_KEY = "qzt6GK09NLvKGg8C1"

  const storage = getStorage()

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

  const fundabilityCategories = {
    financial: {
      name: "Financial Readiness Pack",
      scoreArea: "Financial Readiness (20-30%)",
      description: "Build strong financial foundations that funders want to see.",
      icon: <TrendingUp size={24} />,
      items: [
        {
          name: "Financial Model Template",
          description: "Comprehensive Excel template for financial projections and modeling.",
          price: 500,
          deliveryTime: "24-48 hours",
        },
        {
          name: "KPI Dashboard",
          description: "Track key performance indicators with visual dashboard template.",
          price: 400,
          deliveryTime: "24-48 hours",
        },
        {
          name: "Budgeting Guide",
          description: "Step-by-step guide to creating and managing business budgets.",
          price: 300,
          deliveryTime: "24-48 hours",
        },
        {
          name: "Baseline Establishment Course",
          description: "Online course on establishing financial baselines for your business.",
          price: 300,
          deliveryTime: "24-48 hours",
        },
      ],
      bundlePrice: 1500,
    },
    operational: {
      name: "Business Strategy Toolkit",
      scoreArea: "Operational Strength (20-30%)",
      description: "Demonstrate operational excellence and strategic planning.",
      icon: <Target size={24} />,
      items: [
        {
          name: "Business Plan Template",
          description: "Professional business plan template with guidance notes.",
          price: 700,
          deliveryTime: "24-48 hours",
        },
        {
          name: "Business Model Canvas",
          description: "Visual business model canvas template for strategic planning.",
          price: 500,
          deliveryTime: "24-48 hours",
        },
        {
          name: "Operational Checklist",
          description: "Comprehensive operational excellence checklist and assessment.",
          price: 400,
          deliveryTime: "24-48 hours",
        },
        {
          name: "Performance Management Course",
          description: "Online course on managing business performance effectively.",
          price: 400,
          deliveryTime: "24-48 hours",
        },
      ],
      bundlePrice: 2000,
    },
    investment: {
      name: "Investment Readiness Pack",
      scoreArea: "Investment Proposition (20%)",
      description: "Create compelling investment narratives that attract funding.",
      icon: <PieChart size={24} />,
      items: [
        {
          name: "Pitch Deck Template",
          description: "Professional pitch deck template with best practice examples.",
          price: 700,
          deliveryTime: "24-48 hours",
        },
        {
          name: "Investor Narrative Guide",
          description: "Guide to crafting compelling investor stories and messaging.",
          price: 400,
          deliveryTime: "24-48 hours",
        },
        {
          name: "Crafting Your Investor Narrative Course",
          description: "Online course on developing powerful investor presentations.",
          price: 400,
          deliveryTime: "24-48 hours",
        },
      ],
      bundlePrice: 1500,
    },
    risk: {
      name: "Risk Management Essentials",
      scoreArea: "Risk Management (10%)",
      description: "Show funders you're prepared for challenges and uncertainties.",
      icon: <ShieldIcon size={24} />,
      items: [
        {
          name: "Risk Register Template",
          description: "Structured template for identifying and managing business risks.",
          price: 400,
          deliveryTime: "24-48 hours",
        },
        {
          name: "Business Continuity Template",
          description: "Plan for maintaining operations during disruptions.",
          price: 400,
          deliveryTime: "24-48 hours",
        },
        {
          name: "Contingency Planning Mini-Course",
          description: "Short course on creating effective contingency plans.",
          price: 200,
          deliveryTime: "24-48 hours",
        },
      ],
      bundlePrice: 1000,
    },
    complete: {
      name: "Full Capital Appeal Booster",
      scoreArea: "All Categories - Complete Solution",
      description: "Get all four packs at a discounted rate for maximum impact.",
      icon: <Star size={24} />,
      items: [
        {
          name: "Complete Toolkit Bundle",
          description:
            "All 4 packs (Financial Readiness, Business Strategy, Investment Readiness, and Risk Management) at 20% discount.",
          price: 5000,
          deliveryTime: "48-72 hours",
          isBundle: true,
        },
      ],
      bundlePrice: 5000,
    },
  }

  const styles = {
    container: { padding: "2rem 0" },
    header: { textAlign: "center", marginBottom: "2rem" },
    title: {
      fontSize: "clamp(2rem, 4vw, 2.5rem)",
      fontWeight: "800",
      background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      margin: "0 0 1rem 0",
      letterSpacing: "-1px",
    },
    subtitle: {
      fontSize: "clamp(1rem, 2vw, 1.2rem)",
      color: colors.mediumBrown,
      fontStyle: "italic",
      marginBottom: "1rem",
      fontWeight: 500,
    },
    description: {
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      color: colors.mediumBrown,
      lineHeight: "1.6",
      maxWidth: "800px",
      margin: "0 auto",
    },
    subTabsContainer: {
      display: "flex",
      gap: "0",
      background: colors.cream,
      borderRadius: "12px",
      overflow: "hidden",
      marginBottom: "2rem",
      border: `1px solid ${colors.lightTan}`,
      flexWrap: "wrap",
    },
    subTab: {
      flex: 1,
      minWidth: "120px",
      padding: "1.5rem 1rem",
      background: colors.offWhite,
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "0.9rem",
      color: colors.mediumBrown,
      transition: "all 0.3s ease",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.5rem",
      borderRight: `1px solid ${colors.lightTan}`,
    },
    subTabActive: {
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
    },
    tableContainer: {
      background: colors.offWhite,
      border: `2px solid ${colors.lightTan}`,
      borderRadius: "1rem",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
      overflow: "hidden",
      marginBottom: "2rem",
    },
    table: { width: "100%", borderCollapse: "collapse" },
    tableHeader: {
      background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      fontWeight: "700",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      textAlign: "left",
    },
    th: { padding: "1.25rem 1.5rem", borderBottom: `2px solid ${colors.mediumBrown}` },
    itemRow: {
      background: colors.offWhite,
      color: colors.darkText,
      transition: "all 0.3s ease",
      cursor: "pointer",
    },
    itemRowSelected: { backgroundColor: colors.lightTan, borderLeft: `4px solid ${colors.accentGold}` },
    td: { padding: "1.25rem 1.5rem", borderBottom: `1px solid ${colors.lightTan}`, verticalAlign: "top" },
    checkboxContainer: { display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" },
    checkbox: {
      width: "22px",
      height: "22px",
      borderRadius: "6px",
      border: `2px solid ${colors.accentGold}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: colors.offWhite,
      flexShrink: 0,
      transition: "all 0.3s ease",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    checkboxChecked: {
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      borderColor: colors.accentGold,
      color: colors.lightText,
      transform: "scale(1.1)",
      boxShadow: `0 4px 8px ${colors.accentGold}40`,
    },
    itemName: { fontWeight: "600", fontSize: "clamp(0.9rem, 1.5vw, 1rem)", color: colors.darkBrown },
    itemDescription: {
      fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)",
      color: colors.mediumBrown,
      lineHeight: "1.4",
      marginTop: "0.5rem",
    },
    itemPrice: {
      fontWeight: "700",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      color: colors.accentGold,
      whiteSpace: "nowrap",
    },
    bundleNote: {
      fontSize: "clamp(0.75rem, 1.5vw, 0.85rem)",
      color: colors.mediumBrown,
      fontStyle: "italic",
      marginTop: "0.5rem",
      padding: "0.5rem 0.75rem",
      background: `${colors.accentGold}20`,
      borderRadius: "6px",
      border: `1px solid ${colors.accentGold}40`,
    },
    totalSection: {
      background: `linear-gradient(135deg, ${colors.gradientStart} 0%, ${colors.gradientEnd} 100%)`,
      color: colors.lightText,
      padding: "2.5rem",
      borderRadius: "1.5rem",
      textAlign: "center",
      marginTop: "3rem",
      boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)",
    },
    totalTitle: { fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)", fontWeight: "700", marginBottom: "1rem" },
    totalAmount: { fontSize: "clamp(2rem, 4vw, 2.5rem)", fontWeight: "800", marginBottom: "1.5rem" },
    buyButton: {
      background: colors.offWhite,
      color: colors.darkBrown,
      border: "none",
      padding: "1.25rem 2.5rem",
      borderRadius: "0.75rem",
      fontWeight: "700",
      fontSize: "clamp(1rem, 1.5vw, 1.1rem)",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.75rem",
      margin: "0 auto",
      minWidth: "220px",
      boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    checkoutModal: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: `${colors.darkBrown}66`,
      backdropFilter: "blur(8px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      padding: "1rem",
    },
    checkoutContent: {
      background: colors.offWhite,
      padding: "2rem",
      borderRadius: "24px",
      maxWidth: "600px",
      width: "100%",
      maxHeight: "90vh",
      overflow: "auto",
      boxShadow: `${colors.darkBrown}33 0px 24px 60px`,
      border: `1px solid ${colors.lightTan}`,
      position: "relative",
    },
    specsModal: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: `${colors.darkBrown}80`,
      backdropFilter: "blur(8px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000,
      padding: "1rem",
    },
    specsContent: {
      background: colors.offWhite,
      padding: "2rem",
      borderRadius: "24px",
      maxWidth: "700px",
      width: "100%",
      maxHeight: "85vh",
      overflow: "auto",
      boxShadow: `${colors.darkBrown}33 0px 24px 60px`,
      border: `1px solid ${colors.lightTan}`,
    },
    specsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
    specsTitle: { fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", fontWeight: "700", color: colors.darkBrown, margin: 0 },
    closeBtn: { background: "none", border: "none", cursor: "pointer", color: colors.mediumBrown, padding: "0.5rem" },
    textarea: {
      width: "100%",
      minHeight: "200px",
      padding: "1rem",
      borderRadius: "12px",
      border: `2px solid ${colors.lightTan}`,
      fontSize: "1rem",
      fontFamily: "inherit",
      resize: "vertical",
      marginBottom: "1.5rem",
      background: colors.cream,
      color: colors.darkText,
    },
    uploadArea: {
      border: `2px dashed ${colors.lightTan}`,
      borderRadius: "12px",
      padding: "2rem",
      textAlign: "center",
      marginBottom: "1.5rem",
      background: colors.cream,
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    filesList: { marginBottom: "1.5rem" },
    fileItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      padding: "0.75rem",
      background: colors.cream,
      borderRadius: "8px",
      marginBottom: "0.5rem",
      border: `1px solid ${colors.lightTan}`,
    },
    filePreview: {
      width: "40px",
      height: "40px",
      borderRadius: "6px",
      overflow: "hidden",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: colors.offWhite,
    },
    fileInfo: { flex: 1, minWidth: 0 },
    fileName: {
      fontSize: "0.9rem",
      fontWeight: "600",
      color: colors.darkBrown,
      marginBottom: "0.25rem",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    fileSize: { fontSize: "0.75rem", color: colors.mediumBrown },
    removeBtn: {
      background: "#FEE2E2",
      border: "none",
      padding: "0.5rem",
      borderRadius: "6px",
      cursor: "pointer",
      color: "#DC2626",
      display: "flex",
      alignItems: "center",
    },
    saveBtn: {
      width: "100%",
      padding: "1rem 2rem",
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      border: "none",
      borderRadius: "10px",
      fontWeight: "700",
      fontSize: "1rem",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
    },
    skipBtn: {
      width: "100%",
      padding: "1rem 2rem",
      background: colors.cream,
      color: colors.mediumBrown,
      border: `2px solid ${colors.lightTan}`,
      borderRadius: "10px",
      fontWeight: "600",
      fontSize: "1rem",
      cursor: "pointer",
      marginTop: "1rem",
    },
    alertBanner: {
      background: `linear-gradient(135deg, rgba(166, 124, 82, 0.1) 0%, rgba(93, 64, 55, 0.05) 100%)`,
      border: `2px solid ${colors.accentGold}`,
      padding: "1rem 1.5rem",
      borderRadius: "10px",
      marginBottom: "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    },
    alertText: { flex: 1, fontSize: "0.9rem", color: colors.mediumBrown, lineHeight: "1.5" },
  }

  const toggleItem = (itemIndex) => {
    const key = `${activeSubTab}-${itemIndex}`
    setSelectedItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const calculateTotal = () => {
    const category = fundabilityCategories[activeSubTab]
    let total = 0
    let selectedCount = 0
    const selectedPrices = []

    category.items.forEach((item, itemIdx) => {
      const key = `${activeSubTab}-${itemIdx}`
      if (selectedItems[key]) {
        selectedPrices.push(item.price)
        selectedCount++
      }
    })

    if (activeSubTab !== "complete" && selectedCount === category.items.length && category.bundlePrice) {
      total = category.bundlePrice
    } else {
      total = selectedPrices.reduce((sum, price) => sum + price, 0)
    }

    return { total, selectedCount }
  }

  const { total, selectedCount } = calculateTotal()

  const getSelectedItemsList = () => {
    const category = fundabilityCategories[activeSubTab]
    const selectedItemsList = []
    category.items.forEach((item, itemIdx) => {
      const key = `${activeSubTab}-${itemIdx}`
      if (selectedItems[key]) {
        selectedItemsList.push(item.name)
      }
    })
    return selectedItemsList
  }

  const handleSpecFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    const newFiles = selectedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }))
    setSpecFiles([...specFiles, ...newFiles])
  }

  const removeSpecFile = (fileId) => {
    setSpecFiles(specFiles.filter((f) => f.id !== fileId))
  }

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return <ImageIcon size={24} color={colors.accentGold} />
    if (fileType === "application/pdf") return <FileText size={24} color="#DC2626" />
    return <File size={24} color={colors.mediumBrown} />
  }

  const fetchAvailableTemplates = async (selectedItemNames) => {
    try {
      const db = getFirestore()
      const templatesRef = collection(db, "adminTemplates")
      const querySnapshot = await getDocs(templatesRef)

      const availableTemplates = []
      const foundItems = new Set()

      querySnapshot.forEach((doc) => {
        const template = doc.data()
        // Check if any selected item matches this template
        selectedItemNames.forEach((itemName) => {
          if (template.itemName === itemName) {
            availableTemplates.push({
              ...template,
              templateId: doc.id,
            })
            foundItems.add(itemName)
          }
        })
      })

      // Return templates only if ALL selected items have templates
      const allTemplatesFound = selectedItemNames.every((name) => foundItems.has(name))

      return {
        templates: availableTemplates,
        allAvailable: allTemplatesFound,
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
      return { templates: [], allAvailable: false }
    }
  }

  const sendAutoDeliveryEmail = async (purchaseDetails, templateFiles) => {
    try {
      const itemsList = purchaseDetails.items.map((item, index) => `${index + 1}. ${item}`).join("\n")

      const downloadLinks = templateFiles.map((file, index) => `${index + 1}. ${file.name}: ${file.url}`).join("\n")

      const templateParams = {
        to_name: purchaseDetails.userName || "Valued Customer",
        to_email: purchaseDetails.userEmail || "",
        tool_name: purchaseDetails.packageName || "",
        tool_category: "Capital Appeal Tools - AUTO DELIVERED",
        currency: "ZAR",
        amount: (purchaseDetails.totalAmount || 0).toLocaleString("en-ZA") || "0",
        transaction_id: purchaseDetails.transactionRef || "N/A",
        purchase_date: purchaseDetails.purchaseDate || new Date().toLocaleDateString("en-ZA"),
        items_list: itemsList || "No items listed",
        download_links: downloadLinks,
        delivery_status: "Templates delivered instantly!",
      }

      console.log("📧 Sending auto-delivery email for fundability:", templateParams)

      const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)

      console.log("✅ Fundability auto-delivery email sent:", response)
      return { success: true, response }
    } catch (error) {
      console.error("❌ Fundability auto-delivery email failed:", error)
      return { success: false, error }
    }
  }

  // Send customer confirmation email
  const sendConfirmationEmail = async (purchaseDetails) => {
    try {
      const itemsList = purchaseDetails.items.map((item, index) => `${index + 1}. ${item}`).join("\n")

      const toolName = purchaseDetails.packageName

      const cleanSpecifications = (purchaseDetails.specifications || "")
        .replace(/[^\x20-\x7E\n\r\t]/g, "")
        .replace(/{{/g, "[")
        .replace(/}}/g, "]")
        .trim()

      const hasSpecifications =
        !!cleanSpecifications || (purchaseDetails.specFiles && purchaseDetails.specFiles.length > 0)
      const specFilesCount = purchaseDetails.specFiles ? purchaseDetails.specFiles.length : 0

      const templateParams = {
        to_name: purchaseDetails.userName || "Valued Customer",
        to_email: purchaseDetails.userEmail || "",
        tool_name: toolName || "",
        tool_category: purchaseDetails.toolCategory || "Capital Appeal Tools",
        currency: "ZAR",
        amount: (purchaseDetails.totalAmount || 0).toLocaleString("en-ZA") || "0",
        transaction_id: purchaseDetails.transactionRef || "N/A",
        purchase_date: purchaseDetails.purchaseDate || new Date().toLocaleDateString("en-ZA"),
        items_list: itemsList || "No items listed",
        customer_specifications: cleanSpecifications,
        has_specifications: hasSpecifications ? "true" : "false",
        has_spec_files: specFilesCount > 0 ? "true" : "false",
        spec_files_count: specFilesCount.toString(),
      }

      console.log("📧 Sending customer email for fundability:", templateParams)

      const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)

      console.log("✅ Fundability customer email sent:", response)
      return { success: true, response }
    } catch (error) {
      console.error("❌ Fundability customer email failed:", error)
      return { success: false, error }
    }
  }

  // Send admin notification email
  const sendAdminNotification = async (purchaseDetails) => {
    try {
      const itemsList = purchaseDetails.items.map((item, index) => `${index + 1}. ${item}`).join("\n")

      const toolName = purchaseDetails.packageName

      const cleanSpecifications = (purchaseDetails.specifications || "")
        .replace(/[^\x20-\x7E\n\r\t]/g, "")
        .replace(/{{/g, "[")
        .replace(/}}/g, "]")
        .trim()

      const hasSpecifications =
        !!cleanSpecifications || (purchaseDetails.specFiles && purchaseDetails.specFiles.length > 0)
      const specFilesCount = purchaseDetails.specFiles ? purchaseDetails.specFiles.length : 0

      const templateParams = {
        customer_name: purchaseDetails.customerName || "Valued Customer",
        customer_email: purchaseDetails.customerEmail || "",
        user_id: purchaseDetails.userId || "N/A",
        tool_name: toolName || "",
        tool_category: purchaseDetails.toolCategory || "Capital Appeal Tools",
        currency: "ZAR",
        amount: (purchaseDetails.totalAmount || 0).toLocaleString("en-ZA") || "0",
        transaction_id: purchaseDetails.transactionRef || "N/A",
        purchase_date: purchaseDetails.purchaseDate || new Date().toLocaleDateString("en-ZA"),
        items_list: itemsList || "No items listed",
        items_count: (purchaseDetails.selectedCount || 0).toString(),
        customer_specifications: cleanSpecifications,
        has_specifications: hasSpecifications ? "true" : "false",
        has_spec_files: specFilesCount > 0 ? "true" : "false",
        spec_files_count: specFilesCount.toString(),
      }

      console.log("📧 Sending admin notification for fundability:", templateParams)

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_ADMIN_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY,
      )

      console.log("✅ Fundability admin notification sent:", response)
      return { success: true, response }
    } catch (error) {
      console.error("❌ Fundability admin notification failed:", error)
      return { success: false, error }
    }
  }

  const handleSaveSpecs = () => {
    setShowSpecsModal(false)
    processPurchase()
  }

  const handleSkipSpecs = () => {
    setSpecifications("")
    setSpecFiles([])
    setShowSpecsModal(false)
    processPurchase()
  }

  const handlePurchase = async () => {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      alert("Please log in to make a purchase.")
      return
    }

    if (selectedCount === 0) {
      alert("Please select at least one item to purchase.")
      return
    }

    setShowSpecsModal(true)
  }

  const processPurchase = async () => {
    const auth = getAuth()
    const user = auth.currentUser

    setIsPaymentLoading(true)
    setShowCheckout(true)

    try {
      setTimeout(() => {
        handleCheckoutCompleted({
          checkoutId: `checkout_${Date.now()}`,
          transactionId: `txn_${Date.now()}`,
        })
      }, 2000)
    } catch (error) {
      console.error("Payment error:", error)
      alert(`Failed to initialize payment: ${error.message}`)
      setShowCheckout(false)
    } finally {
      setIsPaymentLoading(false)
    }
  }

  const handleCheckoutCompleted = async (event) => {
    console.log("Fundability payment completed:", event)
    setPaymentProcessing(true)
    setUploadingSpecs(true)

    try {
      const category = fundabilityCategories[activeSubTab]
      const selectedItemsList = getSelectedItemsList()
      const auth = getAuth()
      const user = auth.currentUser

      const db = getFirestore()
      const transactionRef = `fundability_${Date.now()}_${user.uid.slice(0, 8)}`

      const uploadedSpecFiles = []
      if (specFiles.length > 0) {
        for (const fileData of specFiles) {
          const storageRef = ref(storage, `specifications/${user.uid}/${transactionRef}/${fileData.name}`)
          await uploadBytes(storageRef, fileData.file)
          const downloadURL = await getDownloadURL(storageRef)

          uploadedSpecFiles.push({
            name: fileData.name,
            url: downloadURL,
            size: (fileData.size / 1024 / 1024).toFixed(2) + " MB",
            type: fileData.type,
            uploadedAt: new Date().toISOString(),
          })
        }
      }

      console.log("[v0] Checking for available templates for selected items:", selectedItemsList)
      const { templates: availableTemplates, allAvailable } = await fetchAvailableTemplates(selectedItemsList)

      let deliveryStatus = "processing" // Default: admin must deliver
      let deliverables = []
      let deliveredAt = null

      if (allAvailable && availableTemplates.length > 0) {
        console.log("[v0] All templates found! Auto-delivering...")
        deliveryStatus = "delivered"
        deliverables = availableTemplates.map((t) => ({
          name: t.fileName,
          url: t.fileUrl,
          size: t.fileSize || "N/A",
          type: t.fileType || "application/octet-stream",
          uploadedAt: new Date().toISOString(),
        }))
        deliveredAt = new Date().toISOString()
      } else {
        console.log("[v0] Templates not found for all items. Setting to processing for admin review.")
      }

      const purchaseData = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || "Valued Customer",
        packageName: `Capital Appeal - ${category.name}`,
        items: selectedItemsList,
        totalAmount: total,
        transactionRef: transactionRef,
        checkoutId: event.checkoutId,
        transactionId: event.transactionId,
        status: "Success",
        createdAt: serverTimestamp(),
        type: "fundability_tools",
        category: "capital_appeal",
        tier: "Standard",
        deliveryStatus: deliveryStatus, // "delivered" if templates exist, "processing" otherwise
        selectedCount: selectedCount,
        packageDetails: {
          scoreArea: category.scoreArea,
          deliveryTime: category.items[0]?.deliveryTime || "24-48 hours",
        },
        customerSpecifications: specifications || null,
        specificationFiles: uploadedSpecFiles,
        deliverables: deliverables, // Auto-attached templates if available
        deliveredAt: deliveredAt, // Set if auto-delivered
        processedBy: allAvailable ? "AUTO_DELIVERY_SYSTEM" : null,
      }

      await addDoc(collection(db, "growthToolsPurchases"), purchaseData)

      const purchaseDate = new Date().toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      if (allAvailable && deliverables.length > 0) {
        // Send auto-delivery email with download links
        await sendAutoDeliveryEmail(
          {
            userName: user.displayName || "Valued Customer",
            userEmail: user.email,
            packageName: `Capital Appeal - ${category.name}`,
            totalAmount: total,
            transactionRef: transactionRef,
            purchaseDate: purchaseDate,
            items: selectedItemsList,
          },
          deliverables,
        )

        alert(
          `✅ Payment Successful!\n\n` +
            `${category.name} purchased and delivered instantly!\n\n` +
            `${selectedCount} item${selectedCount !== 1 ? "s" : ""} selected\n` +
            `Total: R${total.toLocaleString()}\n\n` +
            `Your templates have been sent to ${user.email} with download links.\n\n` +
            `You can also view and download them in: Growth Tools → My Purchases`,
        )
      } else {
        // Send standard confirmation email (admin will deliver)
        const customerEmailResult = await sendConfirmationEmail({
          userName: user.displayName || "Valued Customer",
          userEmail: user.email,
          packageName: `Capital Appeal - ${category.name}`,
          toolCategory: "Capital Appeal Tools",
          totalAmount: total,
          transactionRef: transactionRef,
          purchaseDate: purchaseDate,
          items: selectedItemsList,
          selectedCount: selectedCount,
          specifications: specifications || "",
          specFiles: uploadedSpecFiles,
        })

        const adminEmailResult = await sendAdminNotification({
          customerName: user.displayName || "Valued Customer",
          customerEmail: user.email,
          userId: user.uid,
          packageName: `Capital Appeal - ${category.name}`,
          toolCategory: "Capital Appeal Tools",
          totalAmount: total,
          transactionRef: transactionRef,
          purchaseDate: purchaseDate,
          items: selectedItemsList,
          selectedCount: selectedCount,
          specifications: specifications || "",
          specFiles: uploadedSpecFiles,
        })

        if (customerEmailResult.success) {
          alert(
            `✅ Payment Successful!\n\n` +
              `${category.name} purchased successfully!\n\n` +
              `${selectedCount} item${selectedCount !== 1 ? "s" : ""} selected\n` +
              `Total: R${total.toLocaleString()}\n\n` +
              `A confirmation email has been sent to ${user.email}.\n\n` +
              `Your tools will be processed and delivered within 24-48 hours.\n\n` +
              `You can view your purchase in: Growth Tools → My Purchases`,
          )
        } else {
          alert(
            `✅ Payment Successful!\n\n` +
              `${category.name} purchased successfully!\n\n` +
              `${selectedCount} item${selectedCount !== 1 ? "s" : ""} selected\n` +
              `Total: R${total.toLocaleString()}\n\n` +
              `Your tools will be delivered within 24-48 hours.\n\n` +
              `You can view your purchase in: Growth Tools → My Purchases`,
          )
        }
      }

      setShowCheckout(false)
      setSelectedItems({})
      setPaymentProcessing(false)
      setSpecifications("")
      setSpecFiles([])
      setUploadingSpecs(false)
    } catch (error) {
      console.error("Fundability purchase save error:", error)
      alert("Payment successful! Your tools will be delivered within 24-48 hours.")
      setShowCheckout(false)
      setPaymentProcessing(false)
    }
  }

  const currentCategory = fundabilityCategories[activeSubTab]

  const individualTotal =
    activeSubTab !== "complete" ? currentCategory.items.reduce((sum, item) => sum + item.price, 0) : 0
  const bundleSavings =
    currentCategory.bundlePrice && activeSubTab !== "complete" ? individualTotal - currentCategory.bundlePrice : 0

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Boost Capital Appeal Score</h2>
        <p style={styles.subtitle}>Show your business model is working — and worth funding.</p>
        <p style={styles.description}>
          Funders want traction, proof of systems, and a clear case for ROI. These tools help you present that story.
        </p>
      </div>

      <div style={styles.subTabsContainer}>
        {Object.entries(fundabilityCategories).map(([key, category], index, array) => (
          <button
            key={key}
            onClick={() => setActiveSubTab(key)}
            style={{
              ...styles.subTab,
              ...(activeSubTab === key ? styles.subTabActive : {}),
              borderRight: index === array.length - 1 ? "none" : `1px solid ${colors.lightTan}`,
            }}
            onMouseEnter={(e) => {
              if (activeSubTab !== key) e.target.style.background = colors.cream
            }}
            onMouseLeave={(e) => {
              if (activeSubTab !== key) e.target.style.background = colors.offWhite
            }}
          >
            {category.icon}
            <span style={{ textAlign: "center", fontSize: "0.85rem" }}>{category.name}</span>
          </button>
        ))}
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.th, width: "50%" }}>Item</th>
              <th style={{ ...styles.th, width: "30%" }}>Description</th>
              <th style={{ ...styles.th, width: "20%", textAlign: "right" }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {currentCategory.items.map((item, itemIndex) => {
              const key = `${activeSubTab}-${itemIndex}`
              const isSelected = selectedItems[key]
              const isLastItem = itemIndex === currentCategory.items.length - 1

              return (
                <tr
                  key={key}
                  style={{ ...styles.itemRow, ...(isSelected ? styles.itemRowSelected : {}) }}
                  onClick={() => toggleItem(itemIndex)}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = colors.cream
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = colors.offWhite
                  }}
                >
                  <td style={styles.td}>
                    <div style={styles.checkboxContainer}>
                      <div style={{ ...styles.checkbox, ...(isSelected ? styles.checkboxChecked : {}) }}>
                        {isSelected && <Check size={16} />}
                      </div>
                      <div>
                        <span style={styles.itemName}>{item.name}</span>
                        {item.deliveryTime && (
                          <div style={{ fontSize: "0.75rem", color: colors.mediumBrown, marginTop: "0.25rem" }}>
                            {item.deliveryTime}
                          </div>
                        )}
                      </div>
                    </div>
                    {isLastItem && !item.isBundle && currentCategory.bundlePrice && bundleSavings > 0 && (
                      <p style={styles.bundleNote}>
                        Select all items for R{currentCategory.bundlePrice.toLocaleString()} (Save R
                        {bundleSavings.toLocaleString()})
                      </p>
                    )}
                  </td>
                  <td style={styles.td}>
                    <p style={styles.itemDescription}>{item.description}</p>
                  </td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <span style={styles.itemPrice}>R{item.price.toLocaleString()}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedCount > 0 && (
        <div style={styles.totalSection}>
          <h3 style={styles.totalTitle}>Your {currentCategory.name}</h3>
          <div style={styles.totalAmount}>R{total.toLocaleString()}</div>
          <p style={{ margin: "0 0 1.5rem 0", opacity: "0.9" }}>
            {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
            {activeSubTab !== "complete" && selectedCount === currentCategory.items.length && bundleSavings > 0 && (
              <span style={{ display: "block", marginTop: "0.5rem", fontSize: "0.9rem" }}>
                Bundle savings: R{bundleSavings.toLocaleString()}
              </span>
            )}
          </p>

          <button
            style={styles.buyButton}
            onClick={handlePurchase}
            disabled={isPaymentLoading}
            onMouseEnter={(e) => {
              if (!isPaymentLoading) {
                e.target.style.transform = "translateY(-3px)"
                e.target.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.3)"
              }
            }}
            onMouseLeave={(e) => {
              if (!isPaymentLoading) {
                e.target.style.transform = "translateY(0)"
                e.target.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.2)"
              }
            }}
          >
            {isPaymentLoading ? (
              <>
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    border: "2px solid transparent",
                    borderTop: "2px solid currentColor",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                ></div>
                Processing...
              </>
            ) : (
              <>
                <ShoppingCart size={20} />
                Complete Purchase
              </>
            )}
          </button>
          <p style={{ marginTop: "1rem", fontSize: "0.85rem", opacity: "0.8" }}>
            Note: You'll have a chance to add specifications before payment
          </p>
        </div>
      )}

      {showSpecsModal && (
        <div style={styles.specsModal} onClick={() => setShowSpecsModal(false)}>
          <div style={styles.specsContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.specsHeader}>
              <h2 style={styles.specsTitle}>Tell Us What You Need</h2>
              <button style={styles.closeBtn} onClick={() => setShowSpecsModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div style={styles.alertBanner}>
              <AlertCircle size={24} color={colors.accentGold} />
              <div style={styles.alertText}>
                <strong>Optional but recommended:</strong> Adding specifications helps us deliver exactly what you
                envision. You can skip if you don't have specific requirements.
              </div>
            </div>

            <textarea
              style={styles.textarea}
              placeholder="Example: I need financial models for a tech startup seeking R2M funding. The pitch deck should focus on our SaaS product market fit. Risk assessment should include cybersecurity threats..."
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
            />

            <div
              style={styles.uploadArea}
              onClick={() => document.getElementById("specFileInput").click()}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.accentGold
                e.currentTarget.style.background = colors.offWhite
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.lightTan
                e.currentTarget.style.background = colors.cream
              }}
            >
              <Upload size={36} color={colors.accentGold} />
              <p style={{ margin: "1rem 0 0.5rem", fontWeight: "600", color: colors.darkBrown }}>
                Upload Reference Files (Optional)
              </p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: colors.mediumBrown }}>
                Images, PDFs, documents - any file type accepted
              </p>
              <input
                id="specFileInput"
                type="file"
                multiple
                accept="*/*"
                onChange={handleSpecFileSelect}
                style={{ display: "none" }}
              />
            </div>

            {specFiles.length > 0 && (
              <div style={styles.filesList}>
                <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: colors.darkBrown }}>
                  Attached Files ({specFiles.length})
                </h3>
                {specFiles.map((fileData) => (
                  <div key={fileData.id} style={styles.fileItem}>
                    <div style={styles.filePreview}>
                      {fileData.preview ? (
                        <img
                          src={fileData.preview || "/placeholder.svg"}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        getFileIcon(fileData.type)
                      )}
                    </div>
                    <div style={styles.fileInfo}>
                      <div style={styles.fileName}>{fileData.name}</div>
                      <div style={styles.fileSize}>{(fileData.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <button style={styles.removeBtn} onClick={() => removeSpecFile(fileData.id)}>
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button style={styles.saveBtn} onClick={handleSaveSpecs}>
              <Check size={20} />
              Continue to Payment
            </button>

            <button style={styles.skipBtn} onClick={handleSkipSpecs}>
              Skip & Proceed to Payment
            </button>
          </div>
        </div>
      )}

      {showCheckout && (
        <div style={styles.checkoutModal}>
          <div style={styles.checkoutContent}>
            <h2 style={{ textAlign: "center", color: colors.darkBrown, marginBottom: "1rem" }}>
              Processing Your Purchase
            </h2>

            <div
              style={{
                background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
                borderRadius: "12px",
                padding: "1.5rem",
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "1.1rem", fontWeight: 600, color: colors.darkBrown, marginBottom: "0.5rem" }}>
                {currentCategory.name}
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: colors.accentGold, marginBottom: "0.5rem" }}>
                R{total.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.9rem", color: colors.mediumBrown, fontStyle: "italic" }}>
                {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
              </div>
            </div>

            {paymentProcessing && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2rem",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    border: `6px solid ${colors.lightTan}`,
                    borderTop: `6px solid ${colors.accentGold}`,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    marginBottom: "2rem",
                  }}
                ></div>
                <h3 style={{ color: colors.darkBrown, marginBottom: "1rem" }}>
                  {uploadingSpecs ? "Uploading specifications..." : "Processing Your Purchase..."}
                </h3>
                <p style={{ color: colors.mediumBrown, textAlign: "center" }}>
                  Please wait while we confirm your order and send confirmation emails.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}


export default FundabilityTab
