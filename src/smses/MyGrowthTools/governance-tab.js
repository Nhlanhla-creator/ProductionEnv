"use client"
import { useState } from "react"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { Check, ShoppingCart, Download, FileText, Users, Shield } from "lucide-react"
import EmbeddedCheckout from "../../components/EmbeddedCheckout"

const createOneTimeCheckout = async (amount, currency, userId, toolName, toolCategory) => {
  try {
    console.log('💳 Creating one-time checkout for governance tool:', { amount, currency, userId, toolName, toolCategory });
    
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

const GovernanceTab = () => {
  const [activeSubTab, setActiveSubTab] = useState("legal")
  const [selectedItems, setSelectedItems] = useState({})
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutId, setCheckoutId] = useState(null)
  const [paymentProcessing, setPaymentProcessing] = useState(false)

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
  }

  const governanceCategories = {
    legal: {
      name: "Legal Boost",
      description: "Essential legal agreements that protect your business and clarify relationships.",
      icon: <FileText size={24} />,
      items: [
        {
          name: "Employment Contract (Basic)",
          description: "Covers standard employee terms & conditions.",
          price: 250,
        },
        {
          name: "NDA (Non-Disclosure Agreement)",
          description: "Protects sensitive business information.",
          price: 150,
        },
        {
          name: "MOU (Memorandum of Understanding)",
          description: "Sets out intentions between parties before formal contracts.",
          price: 150,
        },
      ],
      bundlePrice: 450,
    },
    policy: {
      name: "Policy Boost",
      description: "Comprehensive policies for workplace compliance and governance standards.",
      icon: <Shield size={24} />,
      items: [
        {
          name: "Employee Code of Conduct",
          description: "Defines expected workplace behaviour.",
          price: 500,
        },
        {
          name: "Leave Policy",
          description: "Guides leave entitlements & requests.",
          price: 500,
        },
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
        {
          name: "Remote Work Policy",
          description: "Enables clear remote work expectations.",
          price: 300,
        },
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
        {
          name: "Termination Policy",
          description: "Ensures fair and legal employee exits.",
          price: 500,
        },
        {
          name: "Performance Review Policy",
          description: "Structures performance management & reviews.",
          price: 500,
        },
      ],
    },
    board: {
      name: "Board Boost",
      description: "Build your board structure and strengthen oversight with advisory and governance tools.",
      icon: <Users size={24} />,
      items: [
        {
          name: "Advisory Readiness Pack",
          description: "External Advisor Agreement Template & Advisory Board Charter Template. Helps SMEs formalize advisors (PIS < 100).",
          price: 500,
          deliveryTime: "24-48 hours",
        },
        {
          name: "Board Starter Toolkit",
          description: "Board Charter Template, Board Member Appointment Letter, Board Meeting Agenda & Minutes Templates. Builds basic board structure (PIS 100-349).",
          price: 1000,
          deliveryTime: "24-48 hours",
        },
        {
          name: "Governance Policy Pack",
          description: "Audit Committee TOR, Risk Committee TOR, Remuneration Committee TOR, Basic Governance Policy Template. Supports committee setup & policy framework (PIS ≥ 350).",
          price: 1500,
          deliveryTime: "48-72 hours",
        },
        {
          name: "Governance Guide (FREE)",
          description: 'PDF: "How to Build Your Board and Strengthen Oversight" - Educational guide for SMEs at all stages.',
          price: 0,
          isFree: true,
          deliveryTime: "Instant download",
        },
      ],
    },
  }

  const styles = {
    container: {
      padding: "2rem 0",
    },
    header: {
      textAlign: "center",
      marginBottom: "2rem",
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
    subTabsContainer: {
      display: "flex",
      gap: "0",
      background: colors.cream,
      borderRadius: "12px",
      overflow: "hidden",
      marginBottom: "2rem",
      border: `1px solid ${colors.lightTan}`,
    },
    subTab: {
      flex: 1,
      padding: "1.5rem 1rem",
      background: colors.offWhite,
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "1rem",
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
      borderBottom: `2px solid ${colors.mediumBrown}`,
    },
    itemRow: {
      background: colors.offWhite,
      color: colors.darkText,
      transition: "all 0.3s ease",
      cursor: "pointer",
    },
    itemRowSelected: {
      backgroundColor: colors.lightTan,
      borderLeft: `4px solid ${colors.accentGold}`,
    },
    td: {
      padding: "1.25rem 1.5rem",
      borderBottom: `1px solid ${colors.lightTan}`,
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
    itemName: {
      fontWeight: "600",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      color: colors.darkBrown,
    },
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
    totalTitle: {
      fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
      fontWeight: "700",
      marginBottom: "1rem",
    },
    totalAmount: {
      fontSize: "clamp(2rem, 4vw, 2.5rem)",
      fontWeight: "800",
      marginBottom: "1.5rem",
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
      boxShadow: `0 24px 60px ${colors.darkBrown}33`,
      border: `1px solid ${colors.lightTan}`,
      position: "relative",
    },
  }

  const toggleItem = (itemIndex) => {
    const key = `${activeSubTab}-${itemIndex}`
    setSelectedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const calculateTotal = () => {
    const category = governanceCategories[activeSubTab]
    let total = 0
    let selectedCount = 0
    const legalItemsSelected = []

    category.items.forEach((item, itemIdx) => {
      const key = `${activeSubTab}-${itemIdx}`
      if (selectedItems[key]) {
        if (activeSubTab === "legal") {
          legalItemsSelected.push(item.price)
        } else {
          total += item.price
        }
        selectedCount++
      }
    })

    if (activeSubTab === "legal" && legalItemsSelected.length === 3 && category.bundlePrice) {
      total += category.bundlePrice
    } else {
      total += legalItemsSelected.reduce((sum, price) => sum + price, 0)
    }

    return { total, selectedCount }
  }

  const { total, selectedCount } = calculateTotal()

  const getSelectedItemsList = () => {
    const category = governanceCategories[activeSubTab]
    const selectedItemsList = []
    category.items.forEach((item, itemIdx) => {
      const key = `${activeSubTab}-${itemIdx}`
      if (selectedItems[key]) {
        selectedItemsList.push(`${category.name}: ${item.name}`)
      }
    })
    return selectedItemsList
  }

  const handleFreeDownload = async (itemIndex) => {
    try {
      const auth = getAuth()
      const user = auth.currentUser

      if (!user) {
        alert("Please log in to download the free guide.")
        return
      }

      const db = getFirestore()
      const downloadData = {
        userId: user.uid,
        userEmail: user.email,
        packageName: "Governance - Free Governance Guide",
        price: "Free",
        amount: 0,
        transactionRef: `free_governance_${Date.now()}_${user.uid.slice(0, 8)}`,
        status: "Success",
        createdAt: serverTimestamp(),
        type: "governance_tools",
        deliveryStatus: "pending",
      }

      await addDoc(collection(db, "growthToolsPurchases"), downloadData)

      await fetch(`${process.env.REACT_APP_API_URL}/api/payments/handle-payment-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          type: 'free_download',
          toolName: 'Free Governance Guide',
          amount: 0,
          currency: 'ZAR',
          customerEmail: user.email
        })
      });

      alert("🎉 Free Governance Guide!\n\nYour free guide will be sent to your email within 5 minutes!")
    } catch (error) {
      console.error("Free download error:", error)
      alert("Your free Governance Guide will be sent to your email within 5 minutes!")
    } finally {
      const key = `${activeSubTab}-${itemIndex}`
      setSelectedItems((prev) => ({ ...prev, [key]: false }))
    }
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

    // Check if only free item is selected
    const category = governanceCategories[activeSubTab]
    const onlyFreeSelected = category.items.every((item, idx) => {
      const key = `${activeSubTab}-${idx}`
      return !selectedItems[key] || item.isFree
    })

    if (onlyFreeSelected && total === 0) {
      // Handle free download
      category.items.forEach((item, idx) => {
        const key = `${activeSubTab}-${idx}`
        if (selectedItems[key] && item.isFree) {
          handleFreeDownload(idx)
        }
      })
      return
    }

    setIsPaymentLoading(true)

    try {
      const selectedItemsList = getSelectedItemsList()
      const result = await createOneTimeCheckout(
        total,
        "ZAR",
        user.uid,
        `${category.name} Bundle`,
        "Governance Tools"
      )

      if (!result || !result.checkoutId) {
        throw new Error("Invalid response from checkout service.")
      }

      const transactionRef = result.orderId || `governance_${Date.now()}_${user.uid.slice(0, 8)}`

      const db = getFirestore()
      const purchaseData = {
        userId: user.uid,
        userEmail: user.email,
        packageName: `${category.name} Bundle`,
        items: selectedItemsList,
        totalAmount: total,
        transactionRef: transactionRef,
        checkoutId: result.checkoutId,
        status: "Pending",
        createdAt: serverTimestamp(),
        type: "governance_tools",
        deliveryStatus: "pending",
        selectedCount: selectedCount,
      }

      await addDoc(collection(db, "growthToolsPurchases"), purchaseData)

      setCheckoutId(result.checkoutId)
      setShowCheckout(true)
    } catch (error) {
      console.error("Payment error:", error)
      alert(`Failed to initialize payment: ${error.message}`)
    } finally {
      setIsPaymentLoading(false)
    }
  }

  const handleCheckoutCompleted = async (event) => {
    console.log("Governance payment completed:", event)
    setPaymentProcessing(true)

    try {
      const selectedItemsList = getSelectedItemsList()
      const category = governanceCategories[activeSubTab]

      await fetch(`${process.env.REACT_APP_API_URL}/api/payments/handle-payment-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutId: event.checkoutId,
          transactionId: event.transactionId,
          userId: getAuth().currentUser?.uid,
          type: 'payment',
          toolName: `${category.name} Bundle`,
          amount: total,
          currency: 'ZAR',
          customerEmail: getAuth().currentUser?.email,
          selectedItems: selectedItemsList,
          selectedCount: selectedCount
        })
      });

      alert(`🎉 Payment Successful!\n\n${category.name} Bundle purchased successfully!\n\n${selectedCount} items selected\nTotal: R${total.toLocaleString()}\n\nYour documents will be delivered within 24-72 hours.\n\nYou'll receive a confirmation email shortly.`)
      
    } catch (emailError) {
      console.warn('⚠️ Failed to send email notification:', emailError);
      alert("Payment successful! Your governance tools will be delivered within 24-72 hours.")
    } finally {
      setShowCheckout(false)
      setSelectedItems({})
      setPaymentProcessing(false)
    }
  }

  const handleCheckoutCancelled = () => {
    setShowCheckout(false)
    setPaymentProcessing(false)
    alert("Payment cancelled")
  }

  const handleCheckoutExpired = () => {
    setShowCheckout(false)
    setPaymentProcessing(false)
    alert("Payment session expired. Please try again.")
  }

  const currentCategory = governanceCategories[activeSubTab]

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Boost Governance Score</h2>
        <p style={styles.subtitle}>Prove that your business has structure, leadership, and long-term thinking.</p>
        <p style={styles.description}>
          Your Governance score shows whether you're just hustling — or building an enterprise with proper structure and
          leadership.
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={styles.subTabsContainer}>
        {Object.entries(governanceCategories).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setActiveSubTab(key)}
            style={{
              ...styles.subTab,
              ...(activeSubTab === key ? styles.subTabActive : {}),
              borderRight: key === "board" ? "none" : `1px solid ${colors.lightTan}`,
            }}
            onMouseEnter={(e) => {
              if (activeSubTab !== key) {
                e.target.style.background = colors.cream
              }
            }}
            onMouseLeave={(e) => {
              if (activeSubTab !== key) {
                e.target.style.background = colors.offWhite
              }
            }}
          >
            {category.icon}
            {category.name}
          </button>
        ))}
      </div>

      {/* Items Table */}
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
              return (
                <tr
                  key={key}
                  style={{
                    ...styles.itemRow,
                    ...(isSelected ? styles.itemRowSelected : {}),
                  }}
                  onClick={() => toggleItem(itemIndex)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = colors.cream
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = colors.offWhite
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
                      <div>
                        <span style={styles.itemName}>{item.name}</span>
                        {item.deliveryTime && (
                          <div style={{ fontSize: "0.75rem", color: colors.mediumBrown, marginTop: "0.25rem" }}>
                            ⚡ {item.deliveryTime}
                          </div>
                        )}
                      </div>
                    </div>
                    {activeSubTab === "legal" && itemIndex === 2 && currentCategory.bundlePrice && (
                      <p style={styles.bundleNote}>
                        Bundle all 3 for R{currentCategory.bundlePrice} (Save R{(250 + 150 + 150) - currentCategory.bundlePrice})
                      </p>
                    )}
                  </td>
                  <td style={styles.td}>
                    <p style={styles.itemDescription}>{item.description}</p>
                  </td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <span style={styles.itemPrice}>
                      {item.isFree ? "FREE" : `R${item.price.toLocaleString()}`}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedCount > 0 && (
        <div style={styles.totalSection}>
          <h3 style={styles.totalTitle}>Your {currentCategory.name} Package</h3>
          <div style={styles.totalAmount}>R{total.toLocaleString()}</div>
          <p style={{ margin: "0 0 1.5rem 0", opacity: "0.9" }}>
            {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
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
            ) : total === 0 ? (
              <>
                <Download size={20} />
                Download Free Items
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

      {/* Checkout Modal */}
      {showCheckout && checkoutId && (
        <div style={styles.checkoutModal}>
          <div style={styles.checkoutContent}>
            <h2 style={{ textAlign: "center", color: colors.darkBrown, marginBottom: "1rem" }}>
              Complete Your Purchase
            </h2>
            
            <div style={{
              background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, color: colors.darkBrown, marginBottom: "0.5rem" }}>
                {currentCategory.name} Bundle
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: colors.accentGold, marginBottom: "0.5rem" }}>
                R{total.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.9rem", color: colors.mediumBrown, fontStyle: "italic" }}>
                {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
              </div>
            </div>

            <EmbeddedCheckout
              checkoutId={checkoutId}
              onCompleted={handleCheckoutCompleted}
              onCancelled={handleCheckoutCancelled}
              onExpired={handleCheckoutExpired}
              paymentType="payment"
              amount={total}
              toolName={`${currentCategory.name} Bundle`}
              userEmail={getAuth().currentUser?.email}
              userName={getAuth().currentUser?.displayName}
            />

            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button
                style={{
                  padding: "1rem 2rem",
                  background: `linear-gradient(135deg, ${colors.lightTan} 0%, ${colors.cream} 100%)`,
                  color: colors.darkBrown,
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
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

            {paymentProcessing && (
              <div style={{
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
                borderRadius: "24px",
              }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  border: `6px solid ${colors.lightTan}`,
                  borderTop: `6px solid ${colors.accentGold}`,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  marginBottom: "2rem",
                }}></div>
                <h3 style={{ color: colors.darkBrown, marginBottom: "1rem" }}>
                  Processing Your Purchase...
                </h3>
                <p style={{ color: colors.mediumBrown, textAlign: "center" }}>
                  Please do not close this window.
                </p>
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
      `}</style>
    </div>
  )
}

export default GovernanceTab