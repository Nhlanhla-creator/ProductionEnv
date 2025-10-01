"use client"
import { useState, useEffect } from "react"
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import jsPDF from "jspdf"
import "jspdf-autotable"

// Define your consistent color palette
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
  featureCheck: "#A67C52", // Accent gold for checkmarks
  featureCross: "#D32F2F", // Red for cross marks
}

const billingStyles = {
  statusBadgeSuccess: {
    backgroundColor: colors.cream,
    color: colors.darkBrown,
    padding: "0.35rem 0.8rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "capitalize",
    border: `1px solid ${colors.lightTan}`,
  },
  invoiceBtnGreen: {
    backgroundColor: colors.accentGold,
    color: colors.lightText,
    border: "none",
    padding: "0.5rem 0.85rem",
    fontSize: "0.75rem",
    borderRadius: "0.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    transition: "all 0.3s ease",
    fontWeight: 500,
    boxShadow: `0 2px 4px ${colors.accentGold}33`,
  },
  invoiceBtnGreenHover: {
    backgroundColor: colors.mediumBrown,
    transform: "translateY(-1px)",
    boxShadow: `0 4px 8px ${colors.accentGold}4D`,
  },
  tableResponsive: {
    width: "100%",
    overflowX: "auto",
    backgroundColor: colors.offWhite,
    borderRadius: "1rem",
    padding: "1rem",
    border: `1px solid ${colors.lightTan}`,
  },
  transactionTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.875rem",
    backgroundColor: colors.offWhite,
    borderRadius: "0.75rem",
    overflow: "hidden",
    border: `1px solid ${colors.lightTan}`,
    boxShadow: `0 4px 12px ${colors.darkBrown}1A`,
  },
  transactionThTd: {
    padding: "1rem 1.25rem",
    border: `1px solid ${colors.lightTan}`,
    textAlign: "left",
    verticalAlign: "middle",
    color: colors.darkBrown,
  },
  transactionTh: {
    backgroundColor: colors.cream,
    fontWeight: 600,
    color: colors.darkBrown,
    fontSize: "0.85rem",
    letterSpacing: "0.025em",
  },
  transactionId: {
    fontFamily: "monospace",
    fontSize: "0.75rem",
    backgroundColor: colors.offWhite,
    padding: "0.25rem 0.5rem",
    borderRadius: "0.375rem",
    color: colors.darkBrown,
    border: `1px solid ${colors.lightTan}`,
  },
  datetimeCell: {
    display: "flex",
    flexDirection: "column",
    fontSize: "0.875rem",
    color: colors.mediumBrown, // Adjusted for consistency
  },
  amountFree: {
    color: colors.featureCheck, // Green for free
    fontWeight: 600,
  },
  amountPaid: {
    color: colors.darkBrown,
    fontWeight: 600,
  },
  statusBadge: {
    display: "inline-block",
    padding: "0.35rem 0.8rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "capitalize",
    border: "1px solid",
  },
  statusSuccess: {
    backgroundColor: "#dcfce7", // Keeping original green for success for now, as no direct equivalent in new palette
    color: "#15803d",
    borderColor: "#bbf7d0",
  },
  statusCancelled: {
    backgroundColor: colors.cream,
    color: colors.mediumBrown,
    borderColor: colors.lightTan,
  },
  statusActive: {
    backgroundColor: colors.cream,
    color: colors.mediumBrown,
    borderColor: colors.lightTan,
  },
  actionButtons: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  downloadBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    backgroundColor: colors.accentGold,
    color: colors.lightText,
    border: "none",
    padding: "0.5rem 0.85rem",
    fontSize: "0.75rem",
    borderRadius: "0.5rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: 500,
    boxShadow: `0 2px 4px ${colors.accentGold}33`,
  },
  downloadBtnHover: {
    backgroundColor: colors.mediumBrown,
    transform: "translateY(-1px)",
    boxShadow: `0 4px 8px ${colors.accentGold}4D`,
  },
  viewBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    backgroundColor: colors.mediumBrown,
    color: colors.lightText,
    border: "none",
    padding: "0.5rem 0.85rem",
    fontSize: "0.75rem",
    borderRadius: "0.5rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: 500,
    boxShadow: `0 2px 4px ${colors.mediumBrown}33`,
  },
  viewBtnHover: {
    backgroundColor: colors.darkBrown,
    transform: "translateY(-1px)",
    boxShadow: `0 4px 8px ${colors.mediumBrown}4D`,
  },
  cancelledText: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: colors.mediumBrown,
    fontStyle: "italic",
  },
  freeText: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: colors.mediumBrown,
    fontStyle: "italic",
  },
  billingContainer: {
    maxWidth: "none",
    margin: "5rem 2rem 2rem 280px", // Left margin for sidebar space
    padding: "0",
    backgroundColor: colors.offWhite,
    borderRadius: "1.25rem",
    boxShadow: `0 10px 25px ${colors.darkBrown}1A`,
    border: `1px solid ${colors.lightTan}`,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: colors.darkBrown,
    marginBottom: "2rem",
    letterSpacing: "-0.025em",
  },
  tabNavigation: {
    display: "flex",
    backgroundColor: colors.cream,
    borderBottom: `1px solid ${colors.lightTan}`,
    padding: "0",
  },
  tabButton: {
    padding: "1rem 2rem",
    fontWeight: 600,
    textAlign: "center",
    transition: "all 0.3s ease",
    cursor: "pointer",
    border: "none",
    fontSize: "0.9rem",
    letterSpacing: "0.025em",
    position: "relative",
    color: colors.mediumBrown,
  },
  tabButtonActive: {
    backgroundColor: colors.accentGold,
    color: colors.lightText,
    boxShadow: `inset 0 2px 4px ${colors.darkBrown}1A`,
  },
  tabButtonInactive: {
    backgroundColor: "transparent",
    color: colors.darkBrown,
  },
  tabButtonInactiveHover: {
    backgroundColor: colors.cream,
    color: colors.darkBrown,
  },
  tabContent: {
    padding: "2.5rem 3rem",
    backgroundColor: colors.offWhite,
  },
  formGroup: {
    marginBottom: "1.5rem",
  },
  formLabel: {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: colors.darkBrown,
    marginBottom: "0.75rem",
    letterSpacing: "0.025em",
  },
  formInput: {
    display: "block",
    width: "100%",
    padding: "0.875rem 1.25rem",
    marginBottom: "0.5rem",
    borderRadius: "0.5rem",
    border: `2px solid ${colors.lightTan}`,
    transition: "all 0.3s ease",
    fontSize: "0.875rem",
    backgroundColor: colors.offWhite,
    color: colors.darkBrown,
  },
  formError: {
    color: colors.featureCross,
    fontSize: "0.875rem",
    marginBottom: "0.75rem",
    fontWeight: 500,
  },
  button: {
    display: "block",
    width: "100%",
    padding: "1rem 1.5rem",
    backgroundColor: colors.accentGold,
    color: colors.lightText,
    borderRadius: "0.5rem",
    marginTop: "2rem",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "0.9rem",
    letterSpacing: "0.025em",
    boxShadow: `0 4px 12px ${colors.accentGold}4D`,
  },
  buttonHover: {
    backgroundColor: colors.mediumBrown,
    transform: "translateY(-2px)",
    boxShadow: `0 6px 16px ${colors.accentGold}66`,
  },
  paymentMethodContainer: {
    padding: "2rem",
    backgroundColor: colors.cream,
    borderRadius: "0.75rem",
    border: `1px solid ${colors.lightTan}`,
    marginBottom: "2rem",
  },
  paymentMethodTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: colors.darkBrown,
    marginBottom: "1rem",
  },
  emptyState: {
    padding: "3rem 2rem",
    textAlign: "center",
    backgroundColor: colors.cream,
    borderRadius: "0.75rem",
    border: `1px solid ${colors.lightTan}`,
    color: colors.mediumBrown,
    fontStyle: "italic",
    fontSize: "0.95rem",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(1, 1fr)",
    gap: "1.5rem",
    marginTop: "2rem",
  },
  summaryCard: {
    padding: "1.5rem",
    textAlign: "center",
    borderRadius: "0.75rem",
    border: "1px solid",
  },
  summaryCardSuccess: {
    backgroundColor: colors.cream, // Using cream for a softer success look
    borderColor: colors.lightTan,
  },
  summaryCardFailed: {
    backgroundColor: colors.cream, // Using cream for a softer failed look
    borderColor: colors.lightTan,
  },
  summaryCardCancelled: {
    backgroundColor: colors.cream, // Using cream for a softer cancelled look
    borderColor: colors.lightTan,
  },
  summaryValue: {
    fontSize: "1.75rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
  },
  summaryValueSuccess: {
    color: colors.featureCheck,
  },
  summaryValueFailed: {
    color: colors.featureCross,
  },
  summaryValueCancelled: {
    color: colors.mediumBrown,
  },
  summaryLabel: {
    fontSize: "0.875rem",
    fontWeight: 600,
    letterSpacing: "0.025em",
  },
  summaryLabelSuccess: {
    color: colors.darkBrown,
  },
  summaryLabelFailed: {
    color: colors.darkBrown,
  },
  summaryLabelCancelled: {
    color: colors.darkBrown,
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "1rem",
  },
  tierBadge: {
    padding: "0.35rem 0.8rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "capitalize",
  },
  tierPremium: {
    backgroundColor: colors.cream,
    color: colors.mediumBrown,
    border: `1px solid ${colors.lightTan}`,
  },
  tierSilver: {
    backgroundColor: colors.offWhite,
    color: colors.darkBrown,
    border: `1px solid ${colors.lightTan}`,
  },
  tierGold: {
    backgroundColor: colors.cream,
    color: colors.mediumBrown,
    border: `1px solid ${colors.lightTan}`,
  },
  "@media (min-width: 768px)": {
    formRow: {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
    summaryGrid: {
      gridTemplateColumns: "repeat(4, 1fr)",
    },
  },
}

const BillingInfo = ({
  email: initialEmail = "",
  fullName: initialFullName = "",
  companyName: initialCompanyName = "",
  setEmail: setParentEmail = () => {},
  setFullName: setParentFullName = () => {},
  setCompanyName: setParentCompanyName = () => {},
}) => {
  const [activeTab, setActiveTab] = useState("billing-history")
  const [firebaseData, setFirebaseData] = useState({})
  // Local editable state
  const [email, setEmail] = useState(initialEmail)
  const [fullName, setFullName] = useState(initialFullName)
  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [country, setCountry] = useState("South Africa")
  const [stateRegion, setStateRegion] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [taxId, setTaxId] = useState("")
  const [emailInvoices, setEmailInvoices] = useState(false)
  const [errors, setErrors] = useState({})
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [growthTools, setGrowthTools] = useState([])
  const [loadingGrowthTools, setLoadingGrowthTools] = useState(true)

  // Sync local state with parent setters
  useEffect(() => {
    setParentEmail(email)
  }, [email, setParentEmail])

  useEffect(() => {
    setParentFullName(fullName)
  }, [fullName, setParentFullName])

  useEffect(() => {
    setParentCompanyName(companyName)
  }, [companyName, setParentCompanyName])

  const validate = () => {
    const newErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) newErrors.email = "Email is required"
    else if (!emailRegex.test(email)) newErrors.email = "Enter a valid email"
    if (!fullName) newErrors.fullName = "Full name is required"
    if (!companyName) newErrors.companyName = "Company name is required"
    if (!country) newErrors.country = "Country is required"
    if (!stateRegion) newErrors.stateRegion = "State/Region is required"
    if (!address) newErrors.address = "Address is required"
    if (!city) newErrors.city = "City is required"
    if (!postalCode) newErrors.postalCode = "Postal code is required"
    if (!taxId) newErrors.taxId = "Tax ID is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validate()) {
      alert("Billing information saved successfully!")
    }
  }

  // Enhanced invoice generation for Success Fee transactions
  function generateSuccessFeeInvoicePDF(transaction) {
    const doc = new jsPDF()
    // Header
    doc.setFontSize(20)
    doc.setTextColor(colors.darkBrown)
    doc.text("SUCCESS FEE INVOICE", 14, 25)

    // Company details
    doc.setFontSize(10)
    doc.setTextColor(colors.mediumBrown)
    doc.text("MyUniversal Business Intelligence", 14, 35)
    doc.text("2040 Broadacres Drive", 14, 40)
    doc.text("Dainfern, Sandton, GP, 2055", 14, 45)
    doc.text("South Africa", 14, 50)

    // Invoice details
    doc.setFont("Helvetica", "bold")
    doc.text("Invoice Date:", 140, 35)
    doc.text("Invoice ID:", 140, 40)
    doc.text("Transaction ID:", 140, 45)
    doc.setFont("Helvetica", "normal")
    doc.text(transaction.date || new Date().toLocaleDateString(), 175, 35)
    doc.text(transaction.invoiceId || transaction.id || "SF-001", 175, 40)
    doc.text(transaction.transactionId || transaction.id || "TXN-001", 175, 45)

    // Bill to
    doc.setFont("Helvetica", "bold")
    doc.text("BILL TO:", 14, 65)
    doc.setFont("Helvetica", "normal")
    doc.text(transaction.companyName || companyName || "Client Company", 14, 70)
    doc.text(transaction.fullName || fullName || "Client Name", 14, 75)
    doc.text("Business Address", 14, 80)
    doc.text("City, Province, Postal Code", 14, 85)

    // Table header
    doc.setFillColor(colors.cream)
    doc.rect(14, 95, 182, 10, "F")
    doc.setTextColor(colors.darkBrown)
    doc.setFont("Helvetica", "bold")
    doc.text("DESCRIPTION", 16, 102)
    doc.text("DEAL VALUE", 80, 102)
    doc.text("FEE RATE", 120, 102)
    doc.text("AMOUNT", 160, 102)

    // Table content
    doc.setFont("Helvetica", "normal")
    doc.text("Success Fee - " + (transaction.investor || "Investment Deal"), 16, 112)
    doc.text("ZAR " + (transaction.dealValue || "5,100,000.00"), 80, 112)
    doc.text("3%", 120, 112)
    doc.text("ZAR " + (transaction.successFeeAmount || "153,000.00"), 160, 112)

    // Totals
    const amount = Number.parseFloat(transaction.successFeeAmount?.replace(/[^\d.]/g, "") || "153000")
    const vat = amount * 0.15
    const total = amount + vat
    doc.line(14, 125, 196, 125)
    doc.text("SUBTOTAL", 130, 135)
    doc.text("ZAR " + amount.toFixed(2), 170, 135)
    doc.text("VAT (15%)", 130, 142)
    doc.text("ZAR " + vat.toFixed(2), 170, 142)
    doc.setFillColor(colors.lightBrown)
    doc.rect(14, 150, 182, 10, "F")
    doc.setFont("Helvetica", "bold")
    doc.text("TOTAL", 130, 157)
    doc.text("ZAR " + total.toFixed(2), 170, 157)

    // Footer
    doc.setFont("Helvetica", "normal")
    doc.setFontSize(9)
    doc.text("Payment Terms: Net 30 days", 14, 175)
    doc.text("Thank you for your business!", 14, 185)
    return doc
  }

  // Enhanced invoice generation for Growth Tools
  function generateGrowthToolInvoicePDF(transaction) {
    const doc = new jsPDF()
    // Header
    doc.setFontSize(20)
    doc.setTextColor(colors.darkBrown)
    doc.text("GROWTH TOOLS INVOICE", 14, 25)

    // Company details
    doc.setFontSize(10)
    doc.setTextColor(colors.mediumBrown)
    doc.text("MyUniversal Business Intelligence", 14, 35)
    doc.text("2040 Broadacres Drive", 14, 40)
    doc.text("Dainfern, Sandton, GP, 2055", 14, 45)
    doc.text("South Africa", 14, 50)

    // Invoice details
    doc.setFont("Helvetica", "bold")
    doc.text("Invoice Date:", 140, 35)
    doc.text("Invoice ID:", 140, 40)
    doc.setFont("Helvetica", "normal")
    doc.text(transaction.date || new Date().toLocaleDateString(), 175, 35)
    doc.text(transaction.invoiceId || transaction.id || "GT-001", 175, 40)

    // Bill to
    doc.setFont("Helvetica", "bold")
    doc.text("BILL TO:", 14, 65)
    doc.setFont("Helvetica", "normal")
    doc.text(transaction.companyName || companyName || "Client Company", 14, 70)
    doc.text(transaction.fullName || fullName || "Client Name", 14, 75)
    doc.text("Business Address", 14, 80)
    doc.text("City, Province, Postal Code", 14, 85)

    // Table header
    doc.setFillColor(colors.cream)
    doc.rect(14, 95, 182, 10, "F")
    doc.setTextColor(colors.darkBrown)
    doc.setFont("Helvetica", "bold")
    doc.text("DESCRIPTION", 16, 102)
    doc.text("TIER", 100, 102)
    doc.text("QTY", 130, 102)
    doc.text("AMOUNT", 160, 102)

    // Table content
    doc.setFont("Helvetica", "normal")
    doc.text(transaction.package || "Growth Tool Package", 16, 112)
    doc.text(transaction.tier || "Premium", 100, 112)
    doc.text("1", 130, 112)
    doc.text("ZAR " + (transaction.price || "4,999.99"), 160, 112)

    // Totals
    const amount = Number.parseFloat(transaction.price?.replace(/[^\d.]/g, "") || "4999.99")
    const vat = amount * 0.15
    const total = amount + vat
    doc.line(14, 125, 196, 125)
    doc.text("SUBTOTAL", 130, 135)
    doc.text("ZAR " + amount.toFixed(2), 170, 135)
    doc.text("VAT (15%)", 130, 142)
    doc.text("ZAR " + vat.toFixed(2), 170, 142)
    doc.setFillColor(colors.lightBrown)
    doc.rect(14, 150, 182, 10, "F")
    doc.setFont("Helvetica", "bold")
    doc.text("TOTAL", 130, 157)
    doc.text("ZAR " + total.toFixed(2), 170, 157)

    // Footer
    doc.setFont("Helvetica", "normal")
    doc.setFontSize(9)
    doc.text("Payment Terms: Immediate", 14, 175)
    doc.text("Thank you for your business!", 14, 185)
    return doc
  }

  // Standard subscription invoice generation
  function generateInvoicePDF(transaction) {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.setTextColor(colors.mediumBrown)
    doc.text("INVOICE", 14, 20)
    doc.setFontSize(10)
    doc.text("2040 Broadacres Drive", 14, 30)
    doc.text("Dainfern", 14, 35)
    doc.text("Sandton, GP, 2055", 14, 40)

    doc.setFontSize(10)
    doc.setFont("Helvetica", "bold")
    doc.text("Invoice Date:", 140, 30)
    doc.text("Invoice:", 140, 35)
    doc.setFont("Helvetica", "normal")
    doc.text(transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : "-", 165, 30)
    const invoiceId = transaction.invoiceId || transaction.id || "N/A"
    doc.setFontSize(9)
    doc.text(doc.splitTextToSize(invoiceId, 30), 165, 35)

    doc.setFont("Helvetica", "bold")
    doc.text("BILL TO:", 14, 50)
    doc.setFont("Helvetica", "normal")
    doc.text(transaction.fullName || "Customer Name", 14, 55)
    doc.text(transaction.companyName || "-", 14, 60)
    doc.text("11 Crescent Drive, Melrose Arch", 14, 65)
    doc.text("Johannesburg, GP, 2196", 14, 70)

    doc.setFillColor(colors.cream) // light beige
    doc.rect(14, 80, 182, 8, "F")
    doc.setTextColor(colors.mediumBrown)
    doc.setFontSize(10)
    doc.text("DESCRIPTION", 16, 85)
    doc.text("QUANTITY", 96, 85)
    doc.text("RATE", 136, 85)
    doc.text("AMOUNT", 176, 85)

    doc.setTextColor(colors.darkBrown)
    doc.text(transaction.plan + " Subscription", 16, 95)
    doc.text("1.00", 98, 95)
    doc.text(`R${transaction.amount?.toFixed(2) || "0.00"}`, 136, 95)
    doc.text(`R${transaction.amount?.toFixed(2) || "0.00"}`, 176, 95)

    const subtotal = transaction.amount || 0
    const taxRate = 0.15
    const vat = subtotal * taxRate
    const total = subtotal + vat

    doc.line(14, 105, 196, 105) // separator
    doc.setFont("Helvetica", "normal")
    doc.text("SUBTOTAL", 150, 112)
    doc.text(`R${subtotal.toFixed(2)}`, 180, 112, { align: "right" })
    doc.text("TAX RATE", 150, 118)
    doc.text("15.00%", 180, 118, { align: "right" })
    doc.text("VAT", 150, 124)
    doc.text(`R${vat.toFixed(2)}`, 180, 124, { align: "right" })

    doc.setFillColor(colors.lightBrown)
    doc.rect(14, 130, 182, 8, "F")
    doc.setFont("Helvetica", "bold")
    doc.setTextColor(colors.darkBrown)
    doc.text("TOTAL", 150, 136)
    doc.text(`R${total.toFixed(2)}`, 180, 136, { align: "right" })

    // Terms & Banking
    doc.setFont("Helvetica", "normal")
    doc.setTextColor(colors.mediumBrown)
    doc.setFontSize(9)
    doc.text("Terms & Conditions", 14, 150)
    doc.text("Payment is due within 7 days", 150, 150)
    doc.text("BANKING DETAILS.", 14, 160)
    doc.text("BRANCH - Rivonia branch", 14, 165)
    doc.text("BRANCH CODE 19630500", 14, 170)
    doc.text("BANK ACCOUNT - 1145498108", 14, 175)
    doc.text("Send Proof of payment to", 150, 165)
    doc.text("thando.moutlana@gmail.com", 150, 170) // Keeping original email as it's specific
    doc.setFontSize(10)
    doc.setTextColor(colors.darkBrown)
    doc.text("THANK YOU FOR YOUR BUSINESS!", 105, 190, { align: "center" })
    return doc
  }

  // Utility to download the invoice PDF
  function downloadInvoice(transaction) {
    const doc = generateInvoicePDF(transaction)
    doc.save(`Invoice_${transaction.invoiceId || transaction.id || "unknown"}.pdf`)
  }

  function downloadSuccessFeeInvoice(transaction) {
    const doc = generateSuccessFeeInvoicePDF(transaction)
    doc.save(`SuccessFee_Invoice_${transaction.invoiceId || transaction.id || "unknown"}.pdf`)
  }

  function downloadGrowthToolInvoice(transaction) {
    const doc = generateGrowthToolInvoicePDF(transaction)
    doc.save(`GrowthTool_Invoice_${transaction.invoiceId || transaction.id || "unknown"}.pdf`)
  }

  // Mock data for Success Fee History
  const mockSuccessFeeData = [
    {
      id: "SF001",
      transactionId: "INF-001",
      investor: "InfoTech Ventures",
      dealValue: "5,100,000.00",
      successFeeAmount: "153,000.00",
      date: "2025-06-10",
      time: "14:30",
      status: "Paid",
      invoiceId: "INF-001",
    },
    {
      id: "SF002",
      transactionId: "WIL-002",
      investor: "WillieTech Capital",
      dealValue: "6,500,000.00",
      successFeeAmount: "195,000.00",
      date: "2025-06-15",
      time: "09:45",
      status: "Pending",
      invoiceId: "WIL-002",
    },
  ]

  // Mock data for Growth Tools with invoice IDs
  const mockGrowthToolsData = [
    {
      id: "GT001",
      invoiceId: "INF-001",
      package: "Boost Your Compliance Score",
      tier: "Premium",
      price: "4,999.99",
      date: "2025-06-12",
      status: "Paid",
    },
    {
      id: "GT002",
      invoiceId: "INF-002",
      package: "Boost Your Fundability Score",
      tier: "Silver",
      price: "2,499.99",
      date: "2025-06-18",
      status: "Pending",
    },
  ]

  useEffect(() => {
    const auth = getAuth()
    let unsubscribeAuth
    const fetchHistory = async (user) => {
      setLoadingHistory(true)
      try {
        if (!user) {
          setHistory([])
          setLoadingHistory(false)
          return
        }
        const db = getFirestore()
        const transactionsRef = collection(db, "subscriptions")
        const q = query(transactionsRef, where("userId", "==", user.uid))
        const querySnapshot = await getDocs(q)
        const transactions = []
        // Gather all existing invoiceNumbers for this user/company
        const invoiceNumbers = {}
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data()
          const base = (data.companyName || data.fullName || "USR").substring(0, 3).toUpperCase()
          if (!invoiceNumbers[base]) invoiceNumbers[base] = []
          if (data.invoiceNumber) {
            // Extract the numeric part and store it
            const match = data.invoiceNumber.match(new RegExp(`^${base}(\\d{3})$`))
            if (match) {
              invoiceNumbers[base].push(Number(match[1]))
            }
          }
        })

        // Now assign missing invoiceNumbers, ensuring uniqueness and correct sequence
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data()
          const base = (data.companyName || data.fullName || "USR").substring(0, 3).toUpperCase()
          if (!data.invoiceNumber) {
            // Find the next available number for this base
            let nextNum = 1
            if (invoiceNumbers[base] && invoiceNumbers[base].length > 0) {
              nextNum = Math.max(...invoiceNumbers[base]) + 1
            }
            const invoiceNumber = `${base}${String(nextNum).padStart(3, "0")}`
            // Save to Firestore
            const docRef = doc(db, "subscriptions", docSnap.id)
            await updateDoc(docRef, { invoiceNumber })
            data.invoiceNumber = invoiceNumber
            // Update our local tracker
            if (!invoiceNumbers[base]) invoiceNumbers[base] = []
            invoiceNumbers[base].push(nextNum)
          }
          transactions.push({ id: docSnap.id, ...data })
        }

        // Sort by date descending
        transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setHistory(transactions)
      } catch (error) {
        setHistory([])
      }
      setLoadingHistory(false)
    }

    unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      fetchHistory(user)
    })

    return () => {
      if (unsubscribeAuth) unsubscribeAuth()
    }
  }, [])

  useEffect(() => {
    const fetchGrowthTools = async () => {
      setLoadingGrowthTools(true)
      try {
        const auth = getAuth()
        const user = auth.currentUser
        if (!user) {
          setGrowthTools([])
          setLoadingGrowthTools(false)
          return
        }
        const db = getFirestore()
        const purchasesRef = collection(db, "growthToolsPurchases")
        const q = query(purchasesRef, where("userId", "==", user.uid))
        const querySnapshot = await getDocs(q)
        const purchases = []
        querySnapshot.forEach((doc) => {
          purchases.push({ id: doc.id, ...doc.data() })
        })
        purchases.sort(
          (a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt),
        )
        setGrowthTools(purchases)
      } catch (error) {
        setGrowthTools([])
      }
      setLoadingGrowthTools(false)
    }
    fetchGrowthTools()
  }, [])

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.offWhite }}>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @media (max-width: 1024px) {
          .billing-container {
            margin-left: 250px !important;
          }
        }
        @media (max-width: 768px) {
          .billing-container {
            margin: 1rem !important;
          }
        }
      `}</style>
      <div style={billingStyles.billingContainer} className="billing-container">
        <div style={billingStyles.tabNavigation}>
          {["billing-history", "billing-info", "payment-methods"].map((tab) => (
            <button
              key={tab}
              style={{
                ...billingStyles.tabButton,
                ...(activeTab === tab ? billingStyles.tabButtonActive : billingStyles.tabButtonInactive),
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) {
                  Object.assign(e.target.style, billingStyles.tabButtonInactiveHover)
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) {
                  Object.assign(e.target.style, billingStyles.tabButtonInactive)
                }
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "billing-history"
                ? "Subscription History"
                : tab === "billing-info"
                  ? "Success Fee History"
                  : "Growth Tools"}
            </button>
          ))}
        </div>
        <div style={billingStyles.tabContent}>
          {/* Success Fee History Tab */}
          {activeTab === "billing-info" && (
            <div>
              <h2 style={billingStyles.sectionTitle}>Success Fee History</h2>
              <div style={billingStyles.tableResponsive}>
                <table style={billingStyles.transactionTable}>
                  <thead>
                    <tr>
                      <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>
                        Transaction ID
                      </th>
                      <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Investor</th>
                      <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Deal Value</th>
                      <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>
                        Success Fee Amount
                      </th>
                      <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Date & Time</th>
                      <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Invoice</th>
                      <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>
                        Payment Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockSuccessFeeData.map((transaction) => (
                      <tr key={transaction.id}>
                        <td style={billingStyles.transactionThTd}>
                          <span style={billingStyles.transactionId}>{transaction.transactionId}</span>
                        </td>
                        <td style={billingStyles.transactionThTd}>
                          <span style={{ fontWeight: 600 }}>{transaction.investor}</span>
                        </td>
                        <td style={billingStyles.transactionThTd}>
                          <span style={billingStyles.amountPaid}>ZAR {transaction.dealValue}</span>
                        </td>
                        <td style={billingStyles.transactionThTd}>
                          <span style={billingStyles.amountPaid}>ZAR {transaction.successFeeAmount}</span>
                        </td>
                        <td style={billingStyles.transactionThTd}>
                          <div style={billingStyles.datetimeCell}>
                            <span>{transaction.date}</span>
                            <span style={{ fontSize: "0.85em", color: colors.mediumBrown }}>{transaction.time}</span>
                          </div>
                        </td>
                        <td style={billingStyles.transactionThTd}>
                          {transaction.status === "Paid" ? (
                            <div style={billingStyles.actionButtons}>
                              <button
                                style={billingStyles.downloadBtn}
                                onMouseEnter={(e) => Object.assign(e.target.style, billingStyles.downloadBtnHover)}
                                onMouseLeave={(e) => Object.assign(e.target.style, billingStyles.downloadBtn)}
                                onClick={() => downloadSuccessFeeInvoice(transaction)}
                              >
                                📄 Download
                              </button>
                              <button
                                style={billingStyles.viewBtn}
                                onMouseEnter={(e) => Object.assign(e.target.style, billingStyles.viewBtnHover)}
                                onMouseLeave={(e) => Object.assign(e.target.style, billingStyles.viewBtn)}
                                onClick={() => {
                                  try {
                                    const doc = generateSuccessFeeInvoicePDF(transaction)
                                    doc.output("dataurlnewwindow")
                                  } catch {
                                    alert("Preview failed, please download instead.")
                                  }
                                }}
                              >
                                👁️ View
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: colors.mediumBrown, fontWeight: 600, fontSize: "0.95em" }}>
                              Awaiting Payment
                            </span>
                          )}
                        </td>
                        <td style={billingStyles.transactionThTd}>
                          <span
                            style={{
                              ...billingStyles.statusBadge,
                              ...(transaction.status === "Paid"
                                ? billingStyles.statusSuccess
                                : billingStyles.statusCancelled),
                            }}
                          >
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Growth Tools Tab */}
          {activeTab === "payment-methods" && (
            <div>
              <h2 style={billingStyles.sectionTitle}>Growth Tools Purchases</h2>
              <div style={billingStyles.tableResponsive}>
                <table style={billingStyles.transactionTable}>
                  <thead>
                    <tr>
                      <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Invoice ID</th>
                      <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Package</th>
                      <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Tier</th>
                      <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Price</th>
                      <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Date</th>
                      <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Invoice</th>
                      <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockGrowthToolsData.map((tool) => (
                      <tr key={tool.id}>
                        <td style={billingStyles.transactionThTd}>
                          <span style={billingStyles.transactionId}>{tool.invoiceId}</span>
                        </td>
                        <td style={billingStyles.transactionThTd}>
                          <span style={{ fontWeight: 600 }}>{tool.package}</span>
                        </td>
                        <td style={billingStyles.transactionThTd}>
                          <span
                            style={{
                              ...billingStyles.tierBadge,
                              ...(tool.tier === "Premium" ? billingStyles.tierPremium : billingStyles.tierSilver),
                            }}
                          >
                            {tool.tier}
                          </span>
                        </td>
                        <td style={billingStyles.transactionThTd}>
                          <span style={billingStyles.amountPaid}>ZAR {tool.price}</span>
                        </td>
                        <td style={billingStyles.transactionThTd}>
                          <span>{tool.date}</span>
                        </td>
                        <td style={billingStyles.transactionThTd}>
                          {tool.status === "Paid" ? (
                            <div style={billingStyles.actionButtons}>
                              <button
                                style={billingStyles.downloadBtn}
                                onMouseEnter={(e) => Object.assign(e.target.style, billingStyles.downloadBtnHover)}
                                onMouseLeave={(e) => Object.assign(e.target.style, billingStyles.downloadBtn)}
                                onClick={() => downloadGrowthToolInvoice(tool)}
                              >
                                📄 Download
                              </button>
                              <button
                                style={billingStyles.viewBtn}
                                onMouseEnter={(e) => Object.assign(e.target.style, billingStyles.viewBtnHover)}
                                onMouseLeave={(e) => Object.assign(e.target.style, billingStyles.viewBtn)}
                                onClick={() => {
                                  try {
                                    const doc = generateGrowthToolInvoicePDF(tool)
                                    doc.output("dataurlnewwindow")
                                  } catch {
                                    alert("Preview failed, please download instead.")
                                  }
                                }}
                              >
                                👁️ View
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: colors.mediumBrown, fontWeight: 600, fontSize: "0.95em" }}>
                              Processing
                            </span>
                          )}
                        </td>
                        <td style={billingStyles.transactionThTd}>
                          <span
                            style={{
                              ...billingStyles.statusBadge,
                              ...(tool.status === "Paid" ? billingStyles.statusSuccess : billingStyles.statusCancelled),
                            }}
                          >
                            {tool.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Subscription History Tab */}
          {activeTab === "billing-history" && (
            <div>
              <h2 style={billingStyles.sectionTitle}>Subscription History</h2>
              {loadingHistory ? (
                <div
                  style={{
                    ...billingStyles.emptyState,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: `2px solid ${colors.lightTan}`,
                      borderTop: `2px solid ${colors.accentGold}`,
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>
                  <span>Loading...</span>
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
              ) : (
                <div style={billingStyles.tableResponsive}>
                  <table style={billingStyles.transactionTable}>
                    <thead>
                      <tr>
                        <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Invoice ID</th>
                        <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Plan</th>
                        <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Cycle</th>
                        <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Amount</th>
                        <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>
                          Date & Time
                        </th>
                        <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>Invoice</th>
                        <th style={{ ...billingStyles.transactionThTd, ...billingStyles.transactionTh }}>
                          Payment Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length > 0 ? (
                        history.map((entry) => {
                          const dateObj = new Date(entry.createdAt)
                          const date = dateObj.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                          const time = dateObj.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                          return (
                            <tr key={entry.id}>
                              <td style={billingStyles.transactionThTd}>
                                <span style={billingStyles.transactionId}>
                                  {entry.invoiceNumber
                                    ? entry.invoiceNumber
                                    : entry.id
                                      ? entry.id.slice(0, 8) + "..."
                                      : "N/A"}
                                </span>
                              </td>
                              <td style={billingStyles.transactionThTd}>
                                <div>
                                  <span style={{ fontWeight: 600 }}>{entry.plan}</span>
                                  {entry.action && (
                                    <div
                                      style={{
                                        padding: "0.25rem 0.6rem",
                                        backgroundColor: colors.cream,
                                        color: colors.accentGold,
                                        borderRadius: "0.375rem",
                                        fontSize: "0.7rem",
                                        fontWeight: 600,
                                        marginTop: "0.25rem",
                                        display: "inline-block",
                                      }}
                                    >
                                      {entry.action}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={billingStyles.transactionThTd}>
                                <span
                                  style={{
                                    padding: "0.35rem 0.8rem",
                                    backgroundColor: colors.accentGold,
                                    color: colors.lightText,
                                    borderRadius: "9999px",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  {entry.cycle}
                                </span>
                              </td>
                              <td style={billingStyles.transactionThTd}>
                                <span style={entry.amount === 0 ? billingStyles.amountFree : billingStyles.amountPaid}>
                                  {entry.amount === 0 ? "Free" : `ZAR ${entry.amount}.00`}
                                </span>
                              </td>
                              <td style={billingStyles.transactionThTd}>
                                <div style={billingStyles.datetimeCell}>
                                  <span>{date}</span>
                                  <span style={{ fontSize: "0.85em", color: colors.mediumBrown }}>{time}</span>
                                </div>
                              </td>
                              <td style={billingStyles.transactionThTd}>
                                <div style={billingStyles.actionButtons}>
                                  {["Success", "Paid", "Active"].includes(entry.status) && entry.amount > 0 ? (
                                    <>
                                      <button
                                        style={billingStyles.downloadBtn}
                                        onMouseEnter={(e) =>
                                          Object.assign(e.target.style, billingStyles.downloadBtnHover)
                                        }
                                        onMouseLeave={(e) => Object.assign(e.target.style, billingStyles.downloadBtn)}
                                        onClick={() => downloadInvoice(entry)}
                                      >
                                        📄 <span>Download</span>
                                      </button>
                                      <button
                                        style={billingStyles.viewBtn}
                                        onMouseEnter={(e) => Object.assign(e.target.style, billingStyles.viewBtnHover)}
                                        onMouseLeave={(e) => Object.assign(e.target.style, billingStyles.viewBtn)}
                                        onClick={() => {
                                          try {
                                            const doc = generateInvoicePDF(entry)
                                            doc.output("dataurlnewwindow")
                                          } catch {
                                            alert("Preview failed, please download instead.")
                                          }
                                        }}
                                      >
                                        👁️ <span>View</span>
                                      </button>
                                    </>
                                  ) : entry.status === "Cancelled" ? (
                                    <span style={billingStyles.cancelledText}>No Invoice</span>
                                  ) : (
                                    <span style={billingStyles.freeText}>Free Plan</span>
                                  )}
                                </div>
                              </td>
                              <td style={billingStyles.transactionThTd}>
                                <span style={billingStyles.statusBadgeSuccess}>
                                  {entry.status === "Success" ? "Paid" : entry.status}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} style={billingStyles.emptyState}>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "1rem",
                              }}
                            >
                              <div style={{ fontSize: "3rem" }}>📄</div>
                              <span>No subscription history available yet.</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div
                    style={{
                      ...billingStyles.formLabel,
                      marginTop: "1.5rem",
                      padding: "1rem",
                      backgroundColor: colors.cream,
                      borderRadius: "0.5rem",
                      border: `1px solid ${colors.lightTan}`,
                    }}
                  >
                    💡 <strong>Note:</strong> Invoices are available for successful payments only.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BillingInfo