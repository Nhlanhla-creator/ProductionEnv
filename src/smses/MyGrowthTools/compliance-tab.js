"use client"
import { useState, useRef, useEffect } from "react"
import { Users, ArrowRight, CheckCircle, Clock, Shield, FileText, ChevronDown, ShoppingCart, X, AlertCircle } from "lucide-react"
import { getAuth } from "firebase/auth"
import { db, storage } from "../../firebaseConfig"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import emailjs from "@emailjs/browser"

const ComplianceTab = ({ paystackLoaded, isPaymentLoading, setIsPaymentLoading, initializePayment, publicKey }) => {
  const [selectedServices, setSelectedServices] = useState({})
  const [showCheckout, setShowCheckout] = useState(false)
  const [showSpecsModal, setShowSpecsModal] = useState(false)
  const [specifications, setSpecifications] = useState("")
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [currentService, setCurrentService] = useState(null)
  const [paymentError, setPaymentError] = useState("")

  // Multi-select dropdown states
  const [openDropdown, setOpenDropdown] = useState(null)
  const [ownershipSelections, setOwnershipSelections] = useState({
    shareRegister: false,
    beneficialOwnership: false,
    shareholderRestructuring: false,
  })
  const [sarsSelections, setSarsSelections] = useState({
    sarsTaxRegistration: false,
    vatRegistration: false,
    payeRegistration: false,
    taxClearanceCertificate: false,
  })
  const [labourSelections, setLabourSelections] = useState({
    uifRegistration: false,
    coidaRegistration: false,
    returnsOfEarnings: false,
  })

  const dropdownRefs = useRef({})
  const buttonRefs = useRef({})
  const cardRefs = useRef({})

  const EMAILJS_SERVICE_ID = "service_hm5lzgq"
  const EMAILJS_ADMIN_TEMPLATE_ID = "template_xrrdplp"
  const EMAILJS_PUBLIC_KEY = "qzt6GK09NLvKGg8C1"

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

  const complianceServices = [
    {
      id: "cipc",
      name: "CIPC Registration & Annual Returns",
      price: 250,
      deliveryTime: "5 days",
      description: "CIPC business registration and annual returns filing service.",
      requiresMultiSelect: false,
    },
    {
      id: "ownership",
      name: "Ownership & Shareholding Structure",
      price: 250,
      deliveryTime: "5 days",
      description: "Comprehensive ownership documentation and shareholding structure services.",
      requiresMultiSelect: true,
      type: "ownership",
      options: [
        { id: "shareRegister", label: "Share register" },
        { id: "beneficialOwnership", label: "Beneficial ownership" },
        { id: "shareholderRestructuring", label: "Shareholder restructuring" },
      ],
    },
    {
      id: "sars",
      name: "SARS Tax Registrations & Clearance Certificates",
      price: 250,
      deliveryTime: "5 days",
      description: "SARS tax registrations and clearance certificate services.",
      requiresMultiSelect: true,
      type: "sars",
      options: [
        { id: "sarsTaxRegistration", label: "SARS Tax Registration" },
        { id: "vatRegistration", label: "VAT Registration" },
        { id: "payeRegistration", label: "PAYE Registration" },
        { id: "taxClearanceCertificate", label: "Tax Clearance Certificate" },
      ],
    },
    {
      id: "directors",
      name: "Director's Register",
      price: 250,
      deliveryTime: "5 days",
      description: "Register of directors and company officers.",
      requiresMultiSelect: false,
    },
    {
      id: "labour",
      name: "Labour Compliance",
      price: 250,
      deliveryTime: "5 days",
      description: "Labour compliance documentation and registration services.",
      requiresMultiSelect: true,
      type: "labour",
      options: [
        { id: "uifRegistration", label: "UIF registration & declarations" },
        { id: "coidaRegistration", label: "COIDA Registration & Annual Returns" },
        { id: "returnsOfEarnings", label: "Submission of Returns of Earnings" },
      ],
    },
    {
      id: "popia",
      name: "POPIA Compliance Documentation",
      price: 250,
      deliveryTime: "5 days",
      description: "POPIA compliance documentation and privacy policy development.",
      requiresMultiSelect: false,
    },
    {
      id: "bbbee",
      name: "B-BBEE Certification",
      price: 250,
      deliveryTime: "5 days",
      description: "B-BBEE certification and verification services.",
      requiresMultiSelect: false,
    },
  ]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown) {
        const dropdownElement = dropdownRefs.current[openDropdown]
        const buttonElement = buttonRefs.current[openDropdown]
        
        // Check if click is outside both dropdown and button
        if (dropdownElement && !dropdownElement.contains(event.target) && 
            buttonElement && !buttonElement.contains(event.target)) {
          setOpenDropdown(null)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openDropdown])

  const styles = {
    container: {
      padding: "0",
    },
    servicesGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: "1.5rem",
      marginTop: "1.5rem",
    },
    serviceCard: {
      background: colors.cream,
      borderRadius: "1rem",
      border: `1px solid ${colors.lightTan}`,
      overflow: "visible",
      transition: "all 0.3s ease",
      cursor: "pointer",
      position: "relative",
    },
    serviceCardSelected: {
      border: `2px solid ${colors.accentGold}`,
      boxShadow: `0 4px 16px ${colors.accentGold}40`,
    },
    serviceCardContent: {
      padding: "1.5rem",
    },
    serviceHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "0.75rem",
    },
    serviceName: {
      fontSize: "1.1rem",
      fontWeight: "700",
      color: colors.darkBrown,
      margin: 0,
      lineHeight: "1.4",
      flex: 1,
      paddingRight: "1rem",
    },
    servicePrice: {
      fontSize: "1.25rem",
      fontWeight: "800",
      color: colors.accentGold,
      whiteSpace: "nowrap",
    },
    serviceDescription: {
      fontSize: "0.9rem",
      color: colors.mediumBrown,
      lineHeight: "1.5",
      marginBottom: "1rem",
    },
    serviceMeta: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1rem",
      paddingTop: "0.75rem",
      borderTop: `1px solid ${colors.lightTan}`,
    },
    deliveryTime: {
      fontSize: "0.8rem",
      color: colors.mediumBrown,
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    checkboxIndicator: {
      width: "24px",
      height: "24px",
      borderRadius: "6px",
      border: `2px solid ${colors.accentGold}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: colors.offWhite,
      transition: "all 0.2s ease",
    },
    checkboxChecked: {
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      borderColor: colors.accentGold,
      color: colors.lightText,
    },
    dropdownContainer: {
      marginTop: "1rem",
      position: "relative",
    },
    dropdownButton: {
      width: "100%",
      padding: "0.75rem",
      background: colors.offWhite,
      border: `1px solid ${colors.lightTan}`,
      borderRadius: "8px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
      fontSize: "0.9rem",
      color: colors.darkBrown,
      transition: "all 0.2s ease",
    },
    dropdownMenu: {
      position: "absolute",
      top: "calc(100% + 5px)",
      left: "0",
      right: "0",
      background: colors.offWhite,
      border: `1px solid ${colors.lightTan}`,
      borderRadius: "8px",
      zIndex: 1000,
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
      overflow: "hidden",
    },
    dropdownItem: {
      padding: "0.75rem 1rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      cursor: "pointer",
      borderBottom: `1px solid ${colors.lightTan}`,
      transition: "background 0.2s ease",
    },
    dropdownCheckbox: {
      width: "20px",
      height: "20px",
      borderRadius: "4px",
      border: `2px solid ${colors.accentGold}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      background: colors.offWhite,
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
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.75rem",
      margin: "0 auto",
      minWidth: "220px",
      boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      transition: "all 0.3s ease",
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
      maxWidth: "600px",
      width: "100%",
      maxHeight: "85vh",
      overflow: "auto",
      boxShadow: `${colors.darkBrown}33 0px 24px 60px`,
      border: `1px solid ${colors.lightTan}`,
    },
    specsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
    specsTitle: { fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", fontWeight: "700", color: colors.darkBrown, margin: 0 },
    closeBtn: { background: "none", border: "none", cursor: "pointer", color: colors.mediumBrown, padding: "0.5rem", borderRadius: "50%" },
    textarea: {
      width: "100%",
      minHeight: "150px",
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
      marginBottom: "1rem",
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
      maxWidth: "500px",
      width: "100%",
      textAlign: "center",
      boxShadow: `${colors.darkBrown}33 0px 24px 60px`,
      border: `1px solid ${colors.lightTan}`,
    },
    successMessage: {
      background: colors.cream,
      borderRadius: "12px",
      padding: "1.5rem",
      marginTop: "1.5rem",
      textAlign: "left",
    },
    successText: {
      color: colors.mediumBrown,
      lineHeight: "1.6",
      margin: "0 0 1rem 0",
    },
    errorMessage: {
      background: "#FEE2E2",
      color: "#DC2626",
      padding: "0.75rem",
      borderRadius: "8px",
      marginBottom: "1rem",
      fontSize: "0.9rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
  }

  const toggleService = (serviceId, event) => {
    event.stopPropagation()
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }))
    // Close dropdown when toggling service
    if (openDropdown === serviceId) {
      setOpenDropdown(null)
    }
  }

  const toggleDropdown = (serviceId, event) => {
    event.stopPropagation()
    setOpenDropdown(openDropdown === serviceId ? null : serviceId)
  }

  const handleOptionSelect = (serviceId, optionId, setterFunction, event) => {
    event.stopPropagation()
    setterFunction(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }))
  }

  const calculateTotal = () => {
    let total = 0
    complianceServices.forEach(service => {
      if (selectedServices[service.id]) {
        total += service.price
      }
    })
    return total
  }

  const getSelectedServicesList = () => {
    const selected = []
    complianceServices.forEach(service => {
      if (selectedServices[service.id]) {
        let serviceName = service.name
        if (service.id === "ownership" && Object.values(ownershipSelections).some(v => v)) {
          const selectedOptions = Object.entries(ownershipSelections)
            .filter(([_, selected]) => selected)
            .map(([key]) => {
              const option = service.options.find(opt => opt.id === key)
              return option ? option.label : key
            })
          if (selectedOptions.length > 0) {
            serviceName += ` (${selectedOptions.join(", ")})`
          }
        }
        if (service.id === "sars" && Object.values(sarsSelections).some(v => v)) {
          const selectedOptions = Object.entries(sarsSelections)
            .filter(([_, selected]) => selected)
            .map(([key]) => {
              const option = service.options.find(opt => opt.id === key)
              return option ? option.label : key
            })
          if (selectedOptions.length > 0) {
            serviceName += ` (${selectedOptions.join(", ")})`
          }
        }
        if (service.id === "labour" && Object.values(labourSelections).some(v => v)) {
          const selectedOptions = Object.entries(labourSelections)
            .filter(([_, selected]) => selected)
            .map(([key]) => {
              const option = service.options.find(opt => opt.id === key)
              return option ? option.label : key
            })
          if (selectedOptions.length > 0) {
            serviceName += ` (${selectedOptions.join(", ")})`
          }
        }
        selected.push(serviceName)
      }
    })
    return selected
  }

  const sendAdminNotification = async (purchaseDetails) => {
    try {
      const itemsList = purchaseDetails.items.join("\n")
      
      const templateParams = {
        customer_name: purchaseDetails.customerName,
        customer_email: purchaseDetails.customerEmail,
        user_id: purchaseDetails.userId,
        tool_name: "Compliance Services",
        tool_category: "Compliance",
        currency: "ZAR",
        amount: purchaseDetails.totalAmount.toLocaleString("en-ZA"),
        transaction_id: purchaseDetails.transactionRef,
        purchase_date: purchaseDetails.purchaseDate,
        items_list: itemsList,
        items_count: purchaseDetails.items.length.toString(),
        customer_specifications: purchaseDetails.specifications || "No specifications provided",
        has_specifications: purchaseDetails.specifications ? "true" : "false",
      }

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_ADMIN_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)
      return { success: true }
    } catch (error) {
      console.error("Admin notification failed:", error)
      return { success: false }
    }
  }

  const handleProceedToPayment = () => {
    setShowSpecsModal(false)
    processPayment()
  }

  const processPayment = async () => {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      alert("Please log in to make a purchase.")
      return
    }

    const selectedServicesList = getSelectedServicesList()
    const totalAmount = calculateTotal()

    if (selectedServicesList.length === 0) {
      alert("Please select at least one service.")
      return
    }

    setPaymentProcessing(true)
    setShowCheckout(true)
    setPaymentError("")

    try {
      if (!paystackLoaded) {
        throw new Error("Payment system is still loading. Please try again.")
      }

      const transactionRef = `compliance_${Date.now()}_${user.uid.slice(0, 8)}`
      const purchaseDate = new Date().toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      // Initialize Paystack payment
      const paymentResponse = await initializePayment({
        key: publicKey,
        email: user.email,
        amount: totalAmount * 100, // Paystack uses kobo
        currency: "ZAR",
        ref: transactionRef,
        metadata: {
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: user.displayName || user.email,
            },
            {
              display_name: "Services",
              variable_name: "services",
              value: selectedServicesList.join(", "),
            },
          ],
        },
      })

      // Save purchase to Firestore after successful payment
      const purchaseData = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || "Valued Customer",
        packageName: "Compliance Services",
        items: selectedServicesList,
        totalAmount: totalAmount,
        transactionRef: transactionRef,
        status: "Success",
        createdAt: serverTimestamp(),
        type: "compliance_services",
        category: "compliance",
        selectedCount: selectedServicesList.length,
        customerSpecifications: specifications || null,
        ownershipSelections: ownershipSelections,
        sarsSelections: sarsSelections,
        labourSelections: labourSelections,
      }

      await addDoc(collection(db, "growthToolsPurchases"), purchaseData)

      await sendAdminNotification({
        customerName: user.displayName || "Valued Customer",
        customerEmail: user.email,
        userId: user.uid,
        totalAmount: totalAmount,
        transactionRef: transactionRef,
        purchaseDate: purchaseDate,
        items: selectedServicesList,
        specifications: specifications,
      })

      setPaymentProcessing(false)
      setSpecifications("")
      setSelectedServices({})
      setOwnershipSelections({
        shareRegister: false,
        beneficialOwnership: false,
        shareholderRestructuring: false,
      })
      setSarsSelections({
        sarsTaxRegistration: false,
        vatRegistration: false,
        payeRegistration: false,
        taxClearanceCertificate: false,
      })
      setLabourSelections({
        uifRegistration: false,
        coidaRegistration: false,
        returnsOfEarnings: false,
      })
    } catch (error) {
      console.error("Compliance purchase error:", error)
      setPaymentError(error.message || "Payment failed. Please try again.")
      setPaymentProcessing(false)
    }
  }

  const totalAmount = calculateTotal()
  const selectedCount = Object.values(selectedServices).filter(Boolean).length

  return (
    <div style={styles.container}>
      <div style={styles.servicesGrid}>
        {complianceServices.map((service) => {
          const isSelected = selectedServices[service.id]
          
          return (
            <div
              key={service.id}
              ref={el => cardRefs.current[service.id] = el}
              style={{
                ...styles.serviceCard,
                ...(isSelected ? styles.serviceCardSelected : {}),
              }}
              onClick={(e) => toggleService(service.id, e)}
            >
              <div style={styles.serviceCardContent}>
                <div style={styles.serviceHeader}>
                  <h4 style={styles.serviceName}>{service.name}</h4>
                  <div style={styles.servicePrice}>R{service.price.toLocaleString()}</div>
                </div>
                <p style={styles.serviceDescription}>{service.description}</p>
                <div style={styles.serviceMeta}>
                  <div style={styles.deliveryTime}>
                    <Clock size={14} />
                    <span>{service.deliveryTime}</span>
                  </div>
                  <div style={{ ...styles.checkboxIndicator, ...(isSelected ? styles.checkboxChecked : {}) }}>
                    {isSelected && <CheckCircle size={16} />}
                  </div>
                </div>

                {service.requiresMultiSelect && isSelected && (
                  <div style={styles.dropdownContainer}>
                    <button
                      ref={el => buttonRefs.current[service.id] = el}
                      style={styles.dropdownButton}
                      onClick={(e) => toggleDropdown(service.id, e)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.accentGold
                        e.currentTarget.style.background = colors.cream
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = colors.lightTan
                        e.currentTarget.style.background = colors.offWhite
                      }}
                    >
                      <span>
                        {service.type === "ownership" && Object.values(ownershipSelections).some(v => v)
                          ? `${Object.values(ownershipSelections).filter(v => v).length} selected`
                          : service.type === "sars" && Object.values(sarsSelections).some(v => v)
                          ? `${Object.values(sarsSelections).filter(v => v).length} selected`
                          : service.type === "labour" && Object.values(labourSelections).some(v => v)
                          ? `${Object.values(labourSelections).filter(v => v).length} selected`
                          : "Select options..."}
                      </span>
                      <ChevronDown size={16} style={{ transform: openDropdown === service.id ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                    </button>
                    {openDropdown === service.id && (
                      <div 
                        ref={el => dropdownRefs.current[service.id] = el}
                        style={styles.dropdownMenu}
                      >
                        {service.type === "ownership" && service.options.map((option) => (
                          <div
                            key={option.id}
                            style={styles.dropdownItem}
                            onClick={(e) => handleOptionSelect(service.id, option.id, setOwnershipSelections, e)}
                            onMouseEnter={(e) => e.currentTarget.style.background = colors.cream}
                            onMouseLeave={(e) => e.currentTarget.style.background = colors.offWhite}
                          >
                            <div style={styles.dropdownCheckbox}>
                              {ownershipSelections[option.id] && <CheckCircle size={12} />}
                            </div>
                            <span>{option.label}</span>
                          </div>
                        ))}
                        {service.type === "sars" && service.options.map((option) => (
                          <div
                            key={option.id}
                            style={styles.dropdownItem}
                            onClick={(e) => handleOptionSelect(service.id, option.id, setSarsSelections, e)}
                            onMouseEnter={(e) => e.currentTarget.style.background = colors.cream}
                            onMouseLeave={(e) => e.currentTarget.style.background = colors.offWhite}
                          >
                            <div style={styles.dropdownCheckbox}>
                              {sarsSelections[option.id] && <CheckCircle size={12} />}
                            </div>
                            <span>{option.label}</span>
                          </div>
                        ))}
                        {service.type === "labour" && service.options.map((option) => (
                          <div
                            key={option.id}
                            style={styles.dropdownItem}
                            onClick={(e) => handleOptionSelect(service.id, option.id, setLabourSelections, e)}
                            onMouseEnter={(e) => e.currentTarget.style.background = colors.cream}
                            onMouseLeave={(e) => e.currentTarget.style.background = colors.offWhite}
                          >
                            <div style={styles.dropdownCheckbox}>
                              {labourSelections[option.id] && <CheckCircle size={12} />}
                            </div>
                            <span>{option.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedCount > 0 && (
        <div style={styles.totalSection}>
          <h3 style={styles.totalTitle}>Your Compliance Package</h3>
          <div style={styles.totalAmount}>R{totalAmount.toLocaleString()}</div>
          <p style={{ margin: "0 0 1.5rem 0", opacity: "0.9" }}>
            {selectedCount} service{selectedCount !== 1 ? "s" : ""} selected
          </p>

          <button
            style={styles.buyButton}
            onClick={() => setShowSpecsModal(true)}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-3px)"
              e.target.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.3)"
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)"
              e.target.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.2)"
            }}
          >
            <ShoppingCart size={20} />
            Request Services
          </button>
        </div>
      )}

      {showSpecsModal && (
        <div style={styles.specsModal} onClick={() => setShowSpecsModal(false)}>
          <div style={styles.specsContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.specsHeader}>
              <h2 style={styles.specsTitle}>Request Assistance</h2>
              <button style={styles.closeBtn} onClick={() => setShowSpecsModal(false)}>
                <X size={24} />
              </button>
            </div>

            <p style={{ color: colors.mediumBrown, marginBottom: "1rem", lineHeight: "1.6" }}>
              You have requested for assistance with Compliance Services. Please enter any additional details/instructions in the field below.
            </p>

            <textarea
              style={styles.textarea}
              placeholder="Example: I need assistance with CIPC registration and B-BBEE certification. My business operates in the manufacturing sector with 25 employees..."
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
            />

            <div style={styles.successMessage}>
              <p style={styles.successText}>
                <strong>Important Information:</strong><br /><br />
                It will take approximately 5 days to assist, once payment has been made.<br /><br />
                You can forward any queries to <strong>help@bigmarketplace.africa</strong> at any time.<br /><br />
                Once payment is confirmed, your request will be forwarded to our compliance team for processing.
              </p>
            </div>

            <button style={styles.saveBtn} onClick={handleProceedToPayment}>
              <ShoppingCart size={20} />
              Proceed to Payment
            </button>
          </div>
        </div>
      )}

      {showCheckout && (
        <div style={styles.checkoutModal}>
          <div style={styles.checkoutContent}>
            <h2 style={{ color: colors.darkBrown, marginBottom: "1rem" }}>
              {paymentProcessing ? "Processing Your Request" : "Request Submitted!"}
            </h2>

            {paymentProcessing ? (
              <>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    border: `4px solid ${colors.lightTan}`,
                    borderTop: `4px solid ${colors.accentGold}`,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "1rem auto",
                  }}
                ></div>
                <p style={{ color: colors.mediumBrown, marginTop: "1rem" }}>
                  Please wait while we process your request...
                </p>
              </>
            ) : (
              <>
                {paymentError && (
                  <div style={styles.errorMessage}>
                    <AlertCircle size={18} />
                    {paymentError}
                  </div>
                )}
                <CheckCircle size={48} color={colors.accentGold} style={{ margin: "0 auto 1rem auto" }} />
                <div style={styles.successMessage}>
                  <p style={styles.successText}>
                    <strong>✓ Request Submitted Successfully!</strong><br /><br />
                    You have requested for assistance with Compliance Services.<br /><br />
                    <strong>What happens next:</strong><br />
                    • Your request has been forwarded to our compliance team<br />
                    • It will take approximately 5 days to assist<br />
                    • You'll receive updates via email<br /><br />
                    For any queries, contact: <strong>help@bigmarketplace.africa</strong>
                  </p>
                </div>
                <button
                  style={styles.saveBtn}
                  onClick={() => {
                    setShowCheckout(false)
                    setPaymentProcessing(false)
                    setPaymentError("")
                  }}
                >
                  Close
                </button>
              </>
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

export default ComplianceTab