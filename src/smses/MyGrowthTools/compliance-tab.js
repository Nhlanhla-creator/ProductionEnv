"use client"
import { useState } from "react"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { Check, ShoppingCart, CreditCard } from "lucide-react"
import EmbeddedCheckout from "../../components/EmbeddedCheckout"

// UPDATED: Use the new one-time checkout function
const createOneTimeCheckout = async (amount, currency, userId, toolName, toolCategory) => {
  try {
    console.log('💳 Creating one-time checkout for compliance tools:', { amount, currency, userId, toolName, toolCategory });
    
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        amount,
        currency,
        customerEmail: getAuth().currentUser?.email,
        customerName: getAuth().currentUser?.displayName,
        toolName,
        toolCategory,
        actionType: 'one_time'
      }),
    });

    const data = await response.json();
    console.log('✅ One-time checkout response:', data);

    if (!data.success) {
      throw new Error(data.error || 'Failed to create checkout');
    }

    return data;
  } catch (error) {
    console.error('❌ One-time checkout error:', error);
    throw error;
  }
};

const ComplianceTab = () => {
  const [selectedItems, setSelectedItems] = useState({})
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutId, setCheckoutId] = useState(null)
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  // Define a consistent color palette for dark brown shades
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
    featureCheck: "#A67C52",
    success: "#10b981",
    error: "#dc2626",
  }

  const complianceCategories = [
    {
      name: "Legal Templates",
      description: "Essential agreements that protect your business and clarify relationships.",
      items: [
        {
          name: "Employment Contract (Basic)",
          description: "Covers standard employee terms & conditions.",
          price: 250,
        },
        { name: "NDA (Non-Disclosure Agreement)", description: "Protects sensitive business information.", price: 150 },
        {
          name: "MOU (Memorandum of Understanding)",
          description: "Sets out intentions between parties before formal contracts.",
          price: 150,
        },
      ],
      bundlePrice: 450,
    },
    {
      name: "Policy Essentials",
      description: "Foundational policies that demonstrate compliance with labour laws & governance standards.",
      items: [
        { name: "Employee Code of Conduct", description: "Defines expected workplace behaviour.", price: 500 },
        { name: "Leave Policy", description: "Guides leave entitlements & requests.", price: 500 },
        {
          name: "Disciplinary & Grievance Policy",
          description: "Outlines fair disciplinary & complaint procedures.",
          price: 500,
        },
        {
          name: "Health & Safety Policy",
          description: "Ensures workplace compliance with OHSA requirements.",
          price: 500,
        },
        {
          name: "Privacy & Data Protection Policy",
          description: "GDPR & POPIA aligned privacy practices.",
          price: 500,
        },
      ],
    },
    {
      name: "Specialised Policies",
      description: "Advanced policies for growing businesses or specific risks.",
      items: [
        { name: "Remote Work Policy", description: "Enables clear remote work expectations.", price: 300 },
        {
          name: "Conflict of Interest Policy",
          description: "Manages ethical standards in decision making.",
          price: 300,
        },
        {
          name: "Intellectual Property Protection",
          description: "Secures ownership of creations & inventions.",
          price: 500,
        },
        {
          name: "Social Media Use Policy",
          description: "Controls reputational risk from employee online activity.",
          price: 300,
        },
        {
          name: "Expense Reimbursement Policy",
          description: "Sets out processes for employee expense claims.",
          price: 500,
        },
        {
          name: "Overtime & Compensation Policy",
          description: "Clarifies overtime approvals and payment.",
          price: 500,
        },
        { name: "Termination Policy", description: "Ensures fair and legal employee exits.", price: 500 },
        { name: "Performance Review Policy", description: "Structures performance management & reviews.", price: 500 },
      ],
    },
  ]

  const styles = {
    container: {
      padding: "2rem 0",
      position: "relative",
    },
    header: {
      textAlign: "center",
      marginBottom: "2rem", // FIXED: Reduced from 3rem to bring header up
    },
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
    tableContainer: {
      background: colors.offWhite,
      border: `2px solid ${colors.lightTan}`,
      borderRadius: "1rem",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
      overflow: "hidden",
      marginBottom: "2rem",
      transition: "all 0.3s ease",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    tableHeader: {
      background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      fontWeight: "700",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      textAlign: "left",
    },
    th: {
      padding: "1.25rem 1.5rem",
      borderBottomWidth: "2px",
      borderBottomStyle: "solid",
      borderBottomColor: colors.mediumBrown,
      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
    },
    categoryRow: {
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
      color: colors.darkBrown,
      fontWeight: "700",
      fontSize: "clamp(1rem, 1.5vw, 1.1rem)",
    },
    categoryCell: {
      padding: "1.5rem 1.5rem",
      borderBottomWidth: "2px",
      borderBottomStyle: "solid",
      borderBottomColor: colors.lightTan,
    },
    itemRow: {
      background: colors.offWhite,
      color: colors.darkText,
      transition: "all 0.3s ease",
      cursor: "pointer",
    },
    itemRowHover: {
      backgroundColor: colors.cream,
      transform: "translateX(4px)",
    },
    itemRowSelected: {
      backgroundColor: colors.lightTan,
      borderLeft: `4px solid ${colors.accentGold}`,
    },
    td: {
      padding: "1.25rem 1.5rem",
      borderBottomWidth: "1px",
      borderBottomStyle: "solid",
      borderBottomColor: colors.lightTan,
      verticalAlign: "top",
    },
    checkboxContainer: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      cursor: "pointer",
    },
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
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    checkboxChecked: {
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      borderColor: colors.accentGold,
      color: colors.lightText,
      transform: "scale(1.1)",
      boxShadow: `0 4px 8px ${colors.accentGold}40`,
    },
    itemName: {
      fontWeight: "600",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      color: colors.darkBrown,
    },
    itemDescription: {
      fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)",
      color: colors.mediumBrown,
      lineHeight: "1.4",
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
    discountNote: {
      background: `linear-gradient(135deg, ${colors.accentGold}20 0%, ${colors.lightTan}40 100%)`,
      color: colors.darkBrown,
      padding: "1.5rem",
      borderRadius: "1rem",
      textAlign: "center",
      marginTop: "2rem",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      fontWeight: "600",
      border: `2px solid ${colors.accentGold}`,
      boxShadow: `0 8px 24px ${colors.accentGold}20`,
      position: "relative",
      overflow: "hidden",
    },
    totalSection: {
      background: `linear-gradient(135deg, ${colors.gradientStart} 0%, ${colors.gradientEnd} 100%)`,
      color: colors.lightText,
      padding: "2.5rem",
      borderRadius: "1.5rem",
      textAlign: "center",
      marginTop: "3rem",
      boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)",
      position: "relative",
      overflow: "hidden",
    },
    totalTitle: {
      fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
      fontWeight: "700",
      marginBottom: "1rem",
      textShadow: "0 2px 4px rgba(0,0,0,0.3)",
    },
    totalAmount: {
      fontSize: "clamp(2rem, 4vw, 2.5rem)",
      fontWeight: "800",
      marginBottom: "1.5rem",
      textShadow: "0 2px 4px rgba(0,0,0,0.3)",
    },
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
      minHeight: "60px",
      boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    buyButtonProcessing: {
      background: `linear-gradient(135deg, ${colors.lightBrown} 0%, ${colors.lightTan} 100%)`,
      cursor: "not-allowed",
      opacity: 0.7,
      color: colors.mediumBrown,
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
      boxSizing: "border-box",
    },
    checkoutContent: {
      background: colors.offWhite,
      padding: "2rem",
      borderRadius: "24px",
      maxWidth: "600px",
      width: "100%",
      maxHeight: "90vh",
      overflow: "auto",
      boxShadow: `0 24px 60px ${colors.darkBrown}33`,
      border: `1px solid ${colors.lightTan}`,
      position: "relative",
    },
    checkoutHeader: {
      color: colors.darkBrown,
      marginBottom: "0.5rem",
      textAlign: "center",
      fontSize: "1.5rem",
      fontWeight: 700,
    },
    checkoutInfo: {
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
      borderRadius: "12px",
      padding: "1.5rem",
      marginBottom: "1.5rem",
      border: `1px solid ${colors.lightTan}`,
      textAlign: "center",
    },
    packageSummary: {
      color: colors.darkBrown,
      fontSize: "1.1rem",
      fontWeight: 600,
      marginBottom: "0.5rem",
    },
    priceSummary: {
      color: colors.accentGold,
      fontSize: "1.5rem",
      fontWeight: 800,
      marginBottom: "0.5rem",
    },
    itemsSummary: {
      color: colors.mediumBrown,
      fontSize: "0.9rem",
      fontStyle: "italic",
    },
    processingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `${colors.offWhite}F5`,
      backdropFilter: "blur(6px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1001,
      borderRadius: "24px",
      boxShadow: `inset 0 0 20px ${colors.darkBrown}20`,
    },
    processingSpinner: {
      width: "80px",
      height: "80px",
      border: `6px solid ${colors.lightTan}`,
      borderTop: `6px solid ${colors.accentGold}`,
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      marginBottom: "2rem",
    },
    processingTitle: {
      color: colors.darkBrown,
      fontSize: "1.75rem",
      fontWeight: 800,
      marginBottom: "1rem",
      textAlign: "center",
      textShadow: `0 2px 4px ${colors.darkBrown}20`,
    },
    processingText: {
      color: colors.mediumBrown,
      fontSize: "1.1rem",
      textAlign: "center",
      lineHeight: "1.6",
      maxWidth: "350px",
      fontWeight: 500,
      textShadow: `0 1px 2px ${colors.darkBrown}10`,
    },
    progressBar: {
      marginTop: "2rem",
      width: "200px",
      height: "4px",
      background: colors.lightTan,
      borderRadius: "2px",
      overflow: "hidden",
      position: "relative",
    },
    progressBarFill: {
      width: "50%",
      height: "100%",
      background: `linear-gradient(90deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      borderRadius: "2px",
      animation: "progressSlide 2s linear infinite",
    },
    cancelButton: {
      padding: "1rem 2rem",
      background: `linear-gradient(135deg, ${colors.lightTan} 0%, ${colors.cream} 100%)`,
      color: colors.darkBrown,
      border: "none",
      borderRadius: "12px",
      fontWeight: 700,
      fontSize: "1rem",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
  }

  const toggleItem = (categoryIndex, itemIndex) => {
    const key = `${categoryIndex}-${itemIndex}`
    setSelectedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const calculateTotal = () => {
    let total = 0
    let selectedCount = 0
    const legalTemplatesSelected = []

    complianceCategories.forEach((category, catIdx) => {
      category.items.forEach((item, itemIdx) => {
        const key = `${catIdx}-${itemIdx}`
        if (selectedItems[key]) {
          if (catIdx === 0) {
            legalTemplatesSelected.push(item.price)
          } else {
            total += item.price
          }
          selectedCount++
        }
      })
    })

    if (legalTemplatesSelected.length === 3 && complianceCategories[0].bundlePrice) {
      total += complianceCategories[0].bundlePrice
    } else {
      total += legalTemplatesSelected.reduce((sum, price) => sum + price, 0)
    }

    let discountEligibleCount = 0
    complianceCategories.forEach((category, catIdx) => {
      category.items.forEach((item, itemIdx) => {
        const key = `${catIdx}-${itemIdx}`
        if (selectedItems[key]) {
          if (catIdx === 0 && legalTemplatesSelected.length === 3) {
            if (itemIdx === 0) discountEligibleCount += 1
          } else {
            discountEligibleCount++
          }
        }
      })
    })

    if (discountEligibleCount > 5) {
      total = Math.round(total * 0.9)
    }

    return { total, selectedCount: discountEligibleCount }
  }

  const { total, selectedCount } = calculateTotal()

  const getSelectedItemsList = () => {
    const selectedItemsList = []
    complianceCategories.forEach((category, catIdx) => {
      category.items.forEach((item, itemIdx) => {
        const key = `${catIdx}-${itemIdx}`
        if (selectedItems[key]) {
          selectedItemsList.push(`${category.name}: ${item.name}`)
        }
      })
    })
    return selectedItemsList
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

    setIsPaymentLoading(true)

    try {
      const selectedItemsList = getSelectedItemsList()

      // UPDATED: Use the new one-time checkout function
      const result = await createOneTimeCheckout(
        total,
        "ZAR",
        user.uid,
        "Compliance Tools Custom Bundle",
        "Compliance Tools"
      )

      console.log("One-time checkout result:", result)

      if (!result || !result.checkoutId) {
        throw new Error("Invalid response from checkout service.")
      }

      const transactionRef = result.orderId || `compliance_${Date.now()}_${user.uid.slice(0, 8)}`

      // Save to Firebase
      const db = getFirestore()
      const purchaseData = {
        userId: user.uid,
        userEmail: user.email,
        packageName: "Compliance Tools Custom Bundle",
        items: selectedItemsList,
        totalAmount: total,
        transactionRef: transactionRef,
        checkoutId: result.checkoutId,
        status: "Pending",
        createdAt: serverTimestamp(),
        type: "compliance_tools",
        deliveryStatus: "pending",
        selectedCount: selectedCount,
        discountApplied: selectedCount > 5
      }

      await addDoc(collection(db, "growthToolsPurchases"), purchaseData)

      // Show embedded checkout
      setCheckoutId(result.checkoutId)
      setShowCheckout(true)
    } catch (error) {
      console.error("Payment error:", error)
      alert(`Failed to initialize payment: ${error.message}. Please try again or refresh the page.`)
    } finally {
      setIsPaymentLoading(false)
    }
  }

  const handleCheckoutCompleted = async (event) => {
    console.log("Compliance tools payment completed:", event)
    setPaymentProcessing(true)

    try {
      const selectedItemsList = getSelectedItemsList()

      // UPDATED: Send notification to backend for email
      await fetch(`${process.env.REACT_APP_API_URL}/api/payments/handle-payment-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutId: event.checkoutId,
          transactionId: event.transactionId,
          userId: getAuth().currentUser?.uid,
          type: 'payment',
          toolName: "Compliance Tools Custom Bundle",
          amount: total,
          currency: 'ZAR',
          customerEmail: getAuth().currentUser?.email,
          selectedItems: selectedItemsList,
          selectedCount: selectedCount
        })
      });
      console.log('✅ Email notification sent to backend');

      // Show success message
      alert(`🎉 Payment Successful!\n\nCompliance Tools Bundle purchased successfully!\n\n${selectedCount} items selected\nTotal: R${total.toLocaleString()}\n\nYour compliance documents will be delivered within 24 hours.\n\nYou'll receive a confirmation email shortly.`)
      
    } catch (emailError) {
      console.warn('⚠️ Failed to send email notification:', emailError);
      alert("Payment successful! Your compliance tools will be delivered within 24 hours.")
    } finally {
      setShowCheckout(false)
      setSelectedItems({})
      setPaymentProcessing(false)
    }
  }

  const handleCheckoutCancelled = () => {
    console.log("Payment cancelled")
    setShowCheckout(false)
    setPaymentProcessing(false)
    alert("Payment cancelled")
  }

  const handleCheckoutExpired = () => {
    console.log("Payment expired")
    setShowCheckout(false)
    setPaymentProcessing(false)
    alert("Payment session expired. Please try again.")
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Boost Compliance Score</h2>
        <p style={styles.subtitle}>Tick all the right boxes to prove you're a real, responsible business.</p>
        <p style={styles.description}>
          Funders and corporates want to see that you're playing by the rules — legally registered, tax compliant, and
          aligned with South Africa's labour regulations.
        </p>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.th, width: "30%" }}>Category</th>
              <th style={{ ...styles.th, width: "50%" }}>Description</th>
              <th style={{ ...styles.th, width: "20%", textAlign: "right" }}>Price (Suggested)</th>
            </tr>
          </thead>
          <tbody>
            {complianceCategories.map((category, categoryIndex) => (
              <>
                <tr key={`cat-${categoryIndex}`} style={styles.categoryRow}>
                  <td colSpan="3" style={styles.categoryCell}>
                    {category.name}
                    <p style={{ ...styles.itemDescription, color: colors.darkBrown, marginTop: "0.5rem", fontWeight: 500 }}>
                      {category.description}
                    </p>
                  </td>
                </tr>
                {category.items.map((item, itemIndex) => {
                  const key = `${categoryIndex}-${itemIndex}`
                  const isSelected = selectedItems[key]
                  return (
                    <tr
                      key={key}
                      style={{
                        ...styles.itemRow,
                        ...(isSelected ? styles.itemRowSelected : {}),
                      }}
                      onClick={() => toggleItem(categoryIndex, itemIndex)}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = styles.itemRowHover.backgroundColor
                          e.currentTarget.style.transform = styles.itemRowHover.transform
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = styles.itemRow.backgroundColor
                          e.currentTarget.style.transform = "translateX(0)"
                        }
                      }}
                    >
                      <td style={styles.td}>
                        <div style={styles.checkboxContainer}>
                          <div
                            style={{
                              ...styles.checkbox,
                              ...(isSelected ? styles.checkboxChecked : {}),
                            }}
                          >
                            {isSelected && <Check size={16} />}
                          </div>
                          <span style={styles.itemName}>{item.name}</span>
                        </div>
                        {categoryIndex === 0 && itemIndex === 2 && (
                          <p style={styles.bundleNote}>💡 Bundle all 3 for R{complianceCategories[0].bundlePrice} (Save R{(250 + 150 + 150) - complianceCategories[0].bundlePrice})</p>
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
              </>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCount > 5 && (
        <div style={styles.discountNote}>
          🎉 <strong>Discount Applied!</strong> Get 10% off when you purchase more than 5 policies.
          <br />
          <small>You're saving R{Math.round((total / 0.9) - total)} on your order!</small>
        </div>
      )}

      {selectedCount > 0 && (
        <div style={styles.totalSection}>
          <h3 style={styles.totalTitle}>Your Compliance Package</h3>
          <div style={styles.totalAmount}>R{total.toLocaleString()}</div>
          <p style={{ margin: "0 0 1.5rem 0", opacity: "0.9", fontSize: "clamp(1rem, 1.5vw, 1.1rem)" }}>
            {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
            {selectedCount > 5 && " • 10% discount applied"}
          </p>
          <button
            style={{
              ...styles.buyButton,
              ...(isPaymentLoading ? styles.buyButtonProcessing : {}),
            }}
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
                <div style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid transparent",
                  borderTop: "2px solid currentColor",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}></div>
                Processing...
              </>
            ) : (
              <>
                <ShoppingCart size={20} />
                Buy Selected Items
              </>
            )}
          </button>
        </div>
      )}

      {/* Enhanced Checkout Modal */}
      {showCheckout && checkoutId && (
        <div style={styles.checkoutModal}>
          <div style={styles.checkoutContent}>
            <h2 style={styles.checkoutHeader}>
              Complete Your Purchase
            </h2>
            
            <div style={styles.checkoutInfo}>
              <div style={styles.packageSummary}>
                📋 Compliance Tools Custom Bundle
              </div>
              <div style={styles.priceSummary}>
                R{total.toLocaleString()}
              </div>
              <div style={styles.itemsSummary}>
                {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
                {selectedCount > 5 && " • 10% discount applied"}
              </div>
            </div>

            <EmbeddedCheckout
              checkoutId={checkoutId}
              onCompleted={handleCheckoutCompleted}
              onCancelled={handleCheckoutCancelled}
              onExpired={handleCheckoutExpired}
              paymentType="payment"
              amount={total}
              toolName="Compliance Tools Custom Bundle"
              userEmail={getAuth().currentUser?.email}
              userName={getAuth().currentUser?.displayName}
            />

            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button
                style={{
                  ...styles.cancelButton,
                  opacity: paymentProcessing ? 0.5 : 1,
                }}
                onClick={() => {
                  if (!paymentProcessing) {
                    setShowCheckout(false)
                  }
                }}
                disabled={paymentProcessing}
              >
                {paymentProcessing ? "Processing..." : "Cancel"}
              </button>
            </div>

            {/* Processing Overlay */}
            {paymentProcessing && (
              <div style={styles.processingOverlay}>
                <div style={styles.processingSpinner}></div>
                <h3 style={styles.processingTitle}>
                  Processing Your Purchase...
                </h3>
                <p style={styles.processingText}>
                  🔒 Securing your compliance bundle...
                  <br />
                  <strong>Please do not close this window.</strong>
                </p>
                
                <div style={styles.progressBar}>
                  <div style={styles.progressBarFill}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes progressSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }

        /* Enhanced table responsiveness */
        @media (max-width: 768px) {
          table, thead, tbody, th, td, tr {
            display: block !important;
          }
          
          thead tr {
            position: absolute !important;
            top: -9999px !important;
            left: -9999px !important;
          }
          
          tr {
            border: 1px solid ${colors.lightTan} !important;
            border-radius: 8px !important;
            margin-bottom: 1rem !important;
            padding: 1rem !important;
            background: ${colors.offWhite} !important;
          }
          
          td {
            border: none !important;
            border-bottom: 1px solid ${colors.lightTan} !important;
            position: relative !important;
            padding-left: 50% !important;
            text-align: left !important;
          }
          
          td:before {
            content: attr(data-label) !important;
            position: absolute !important;
            left: 6px !important;
            width: 45% !important;
            padding-right: 10px !important;
            white-space: nowrap !important;
            font-weight: bold !important;
            color: ${colors.darkBrown} !important;
          }
        }

        @media (max-width: 480px) {
          .checkoutContent {
            padding: 1rem !important;
            margin: 0.5rem !important;
          }
          
          .totalSection {
            padding: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  )
}

export default ComplianceTab