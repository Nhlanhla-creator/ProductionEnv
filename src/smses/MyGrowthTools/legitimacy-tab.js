"use client"
import { useState } from "react"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { Check, ShoppingCart, Globe, Palette, Monitor, TrendingUp, Star } from "lucide-react"
import EmbeddedCheckout from "../../components/EmbeddedCheckout"

// UPDATED: Use the new one-time checkout function
const createOneTimeCheckout = async (amount, currency, userId, toolName, toolCategory) => {
  try {
    console.log('💳 Creating one-time checkout for growth tool:', { amount, currency, userId, toolName, toolCategory });
    
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

const LegitimacyTab = () => {
  const [activeSubTab, setActiveSubTab] = useState("digital")
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
    success: "#10b981",
    error: "#dc2626",
  }

  const legitimacyCategories = {
    digital: {
      name: "Digital Foundation",
      scoreArea: "Online Presence",
      description: "Get your business online with professional infrastructure.",
      icon: <Globe size={24} />,
      items: [
        {
          name: "1-year Hosting",
          description: "Reliable web hosting service for your business website",
          price: 1500,
          deliveryTime: "24-48 hours"
        },
        {
          name: "Domain Registration",
          description: "Professional domain name registration for 1 year",
          price: 500,
          deliveryTime: "24-48 hours"
        },
        {
          name: "Business Email Accounts (5)",
          description: "Up to 5 professional business email accounts",
          price: 2500,
          deliveryTime: "24-48 hours"
        },
      ],
      bundlePrice: 4500,
    },
    branding: {
      name: "First Impressions",
      scoreArea: "Professional Brand Identity",
      description: "Establish a professional brand that builds trust and credibility.",
      icon: <Palette size={24} />,
      items: [
        {
          name: "Logo Design",
          description: "2 logo concepts with 3 rounds of revisions",
          price: 2000,
          deliveryTime: "3-5 business days"
        },
        {
          name: "Brand Board",
          description: "Complete brand colors, fonts, and style guide",
          price: 1000,
          deliveryTime: "3-5 business days"
        },
        {
          name: "Business Card Template",
          description: "Professional business card design template",
          price: 500,
          deliveryTime: "3-5 business days"
        },
        {
          name: "Email Signature Template",
          description: "Branded email signature for your team",
          price: 300,
          deliveryTime: "3-5 business days"
        },
        {
          name: "Company Brochure/Flyer",
          description: "Marketing collateral design",
          price: 800,
          deliveryTime: "3-5 business days"
        },
        {
          name: "Letterhead Design",
          description: "Professional letterhead template",
          price: 400,
          deliveryTime: "3-5 business days"
        },
      ],
      bundlePrice: 5000,
    },
    presence: {
      name: "Digital Presence",
      scoreArea: "Online Credibility",
      description: "Bring your brand to life online with professional digital assets.",
      icon: <Monitor size={24} />,
      items: [
        {
          name: "Starter Website (5 pages)",
          description: "Professional 5-page website with responsive design",
          price: 4000,
          deliveryTime: "5-7 business days"
        },
        {
          name: "LinkedIn Company Page",
          description: "Complete LinkedIn company page setup and optimization",
          price: 1000,
          deliveryTime: "5-7 business days"
        },
        {
          name: "Leadership Social Media Kit",
          description: "Profile and banner templates for leadership team",
          price: 1000,
          deliveryTime: "5-7 business days"
        },
      ],
      bundlePrice: 6000,
    },
    visibility: {
      name: "Legitimacy Accelerator",
      scoreArea: "Trust & Visibility",
      description: "Boost trust and visibility with strategic marketing tools.",
      icon: <TrendingUp size={24} />,
      items: [
        {
          name: "Google Business Profile Setup",
          description: "Complete Google Business Profile with SEO optimization",
          price: 2000,
          deliveryTime: "7-10 business days"
        },
        {
          name: "30-sec Explainer Video",
          description: "Professional animated explainer video for your business",
          price: 3000,
          deliveryTime: "7-10 business days"
        },
        {
          name: "Press Release Draft",
          description: "Professional press release for business announcement",
          price: 1000,
          deliveryTime: "7-10 business days"
        },
      ],
      bundlePrice: 6000,
    },
    complete: {
      name: "Full Legitimacy Booster",
      scoreArea: "Complete Solution",
      description: "Get all four packs at a discounted rate for maximum impact.",
      icon: <Star size={24} />,
      items: [
        {
          name: "Complete Legitimacy Bundle",
          description: "All 4 packs (Digital Foundation, First Impressions, Digital Presence, and Legitimacy Accelerator) at 20% discount.",
          price: 17200,
          deliveryTime: "7-14 business days",
          isBundle: true
        },
      ],
      bundlePrice: 17200,
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
    const category = legitimacyCategories[activeSubTab]
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

    // Check if all items are selected and bundle price exists (excluding the complete bundle tab)
    if (activeSubTab !== "complete" && selectedCount === category.items.length && category.bundlePrice) {
      total = category.bundlePrice
    } else {
      total = selectedPrices.reduce((sum, price) => sum + price, 0)
    }

    return { total, selectedCount }
  }

  const { total, selectedCount } = calculateTotal()

  const getSelectedItemsList = () => {
    const category = legitimacyCategories[activeSubTab]
    const selectedItemsList = []
    category.items.forEach((item, itemIdx) => {
      const key = `${activeSubTab}-${itemIdx}`
      if (selectedItems[key]) {
        selectedItemsList.push(`${category.name}: ${item.name}`)
      }
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
      const category = legitimacyCategories[activeSubTab]
      const selectedItemsList = getSelectedItemsList()
      const result = await createOneTimeCheckout(
        total,
        "ZAR",
        user.uid,
        `${category.name}`,
        "Legitimacy Tools"
      )

      if (!result || !result.checkoutId) {
        throw new Error("Invalid response from checkout service.")
      }

      const transactionRef = result.orderId || `legitimacy_${Date.now()}_${user.uid.slice(0, 8)}`

      const db = getFirestore()
      const purchaseData = {
        userId: user.uid,
        userEmail: user.email,
        packageName: `Legitimacy - ${category.name}`,
        items: selectedItemsList,
        totalAmount: total,
        transactionRef: transactionRef,
        checkoutId: result.checkoutId,
        status: "Pending",
        createdAt: serverTimestamp(),
        type: "legitimacy_tools",
        deliveryStatus: "pending",
        selectedCount: selectedCount,
        packageDetails: {
          scoreArea: category.scoreArea,
          deliveryTime: category.items[0]?.deliveryTime || "24-48 hours"
        }
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
    console.log("Legitimacy payment completed:", event)
    setPaymentProcessing(true)

    try {
      const category = legitimacyCategories[activeSubTab]
      const selectedItemsList = getSelectedItemsList()

      await fetch(`${process.env.REACT_APP_API_URL}/api/payments/handle-payment-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutId: event.checkoutId,
          transactionId: event.transactionId,
          userId: getAuth().currentUser?.uid,
          type: 'payment',
          toolName: category.name,
          amount: total,
          currency: 'ZAR',
          customerEmail: getAuth().currentUser?.email,
          selectedItems: selectedItemsList,
          selectedCount: selectedCount
        })
      });

      alert(`🎉 Payment Successful!\n\n${category.name} purchased successfully!\n\n${selectedCount} item${selectedCount !== 1 ? "s" : ""} selected\nTotal: R${total.toLocaleString()}\n\nYour legitimacy tools will be delivered within the specified timeframe.\n\nYou'll receive a confirmation email shortly.`)
      
    } catch (emailError) {
      console.warn('⚠️ Failed to send email notification:', emailError);
      alert("Payment successful! Your legitimacy tools will be delivered within 24 hours.")
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

  const currentCategory = legitimacyCategories[activeSubTab]
  
  // Calculate bundle savings (excluding complete bundle tab)
  const individualTotal = activeSubTab !== "complete" 
    ? currentCategory.items.reduce((sum, item) => sum + item.price, 0)
    : 0
  const bundleSavings = currentCategory.bundlePrice && activeSubTab !== "complete" 
    ? individualTotal - currentCategory.bundlePrice 
    : 0

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Boost Your Legitimacy Score</h2>
        <p style={styles.subtitle}>Look the part, get taken seriously.</p>
        <p style={styles.description}>
          A strong online presence and brand builds trust. If your business looks real, funders and clients will believe
          it is.
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={styles.subTabsContainer}>
        {Object.entries(legitimacyCategories).map(([key, category], index, array) => (
          <button
            key={key}
            onClick={() => setActiveSubTab(key)}
            style={{
              ...styles.subTab,
              ...(activeSubTab === key ? styles.subTabActive : {}),
              borderRight: index === array.length - 1 ? "none" : `1px solid ${colors.lightTan}`,
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
            <span style={{ textAlign: "center", fontSize: "0.85rem" }}>{category.name}</span>
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
              const isLastItem = itemIndex === currentCategory.items.length - 1
              
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
                    {isLastItem && !item.isBundle && currentCategory.bundlePrice && bundleSavings > 0 && (
                      <p style={styles.bundleNote}>
                        Select all items for R{currentCategory.bundlePrice.toLocaleString()} (Save R{bundleSavings.toLocaleString()})
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
                💰 Bundle savings: R{bundleSavings.toLocaleString()}
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
                {currentCategory.name}
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
              toolName={currentCategory.name}
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
        
        @media (max-width: 768px) {
          .subTabsContainer {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default LegitimacyTab