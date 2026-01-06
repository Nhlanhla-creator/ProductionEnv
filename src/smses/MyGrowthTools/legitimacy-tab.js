"use client"
import { useState } from "react"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { Check, ShoppingCart, Globe, Palette, Monitor, TrendingUp, Star, CreditCard } from "lucide-react"
import EmbeddedCheckout from "../../components/EmbeddedCheckout"

const createOneTimeCheckout = async (amount, currency, userId, toolName, toolCategory) => {
  try {
    console.log('💳 Creating one-time checkout:', { amount, currency, userId, toolName, toolCategory });
    
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
    console.log('✅ Checkout response:', data);

    if (!data.success) {
      throw new Error(data.error || 'Failed to create checkout');
    }

    return data;
  } catch (error) {
    console.error('❌ Checkout error:', error);
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
  const [eBusinessCardUsers, setEBusinessCardUsers] = useState(1) // For eBusiness card user count

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
    ebusinesscard: {
      name: "eBusiness Cards",
      scoreArea: "Digital Networking",
      description: "Professional digital business cards for your team - pricing based on your subscription tier.",
      icon: <CreditCard size={24} />,
      items: [
        {
          name: "Freemium Plan",
          description: "R299 per annum for 1 user, additional R199 per extra user per annum",
          basePrice: 299,
          additionalUserPrice: 199,
          includedUsers: 1,
          deliveryTime: "24 hours",
          tier: "freemium"
        },
        {
          name: "Standard Plan",
          description: "Free for 2 users whilst subscribed, additional R150 per extra user per annum",
          basePrice: 0,
          additionalUserPrice: 150,
          includedUsers: 2,
          deliveryTime: "24 hours",
          tier: "standard",
          requiresSubscription: true
        },
        {
          name: "Premium Plan",
          description: "Free for up to 5 users whilst subscribed, additional R75 per extra user per annum",
          basePrice: 0,
          additionalUserPrice: 75,
          includedUsers: 5,
          deliveryTime: "24 hours",
          tier: "premium",
          requiresSubscription: true
        },
        {
          name: "Enterprise Plan (11-25 users)",
          description: "R70 per user per annum. For 25+ users, contact us for custom pricing",
          basePrice: 70,
          additionalUserPrice: 70,
          includedUsers: 0,
          minUsers: 11,
          maxUsers: 25,
          deliveryTime: "48 hours",
          tier: "enterprise"
        },
      ],
      bundlePrice: null,
      isEBusinessCard: true
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
          description: "All 4 packs at 20% discount (excluding eBusiness Cards).",
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
    userSelector: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      marginTop: "1rem",
      padding: "1rem",
      background: `${colors.cream}`,
      borderRadius: "8px",
      border: `1px solid ${colors.lightTan}`,
    },
    userButton: {
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      border: `2px solid ${colors.accentGold}`,
      background: colors.offWhite,
      color: colors.darkBrown,
      fontSize: "1.2rem",
      fontWeight: "bold",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    userCount: {
      fontSize: "1.2rem",
      fontWeight: "600",
      color: colors.darkBrown,
      minWidth: "40px",
      textAlign: "center",
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
      boxShadow: `${colors.darkBrown}33 0px 24px 60px`,
      border: `1px solid ${colors.lightTan}`,
      position: "relative",
    },
  }

  // Calculate eBusiness card price based on user count
  const calculateEBusinessCardPrice = (item, users) => {
    const userCount = Math.max(item.minUsers || 1, users)
    
    if (item.tier === "enterprise") {
      if (userCount > 25) {
        return "Custom Pricing"
      }
      return item.basePrice * userCount
    }
    
    if (userCount <= item.includedUsers) {
      return item.basePrice
    }
    
    const extraUsers = userCount - item.includedUsers
    return item.basePrice + (extraUsers * item.additionalUserPrice)
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
        if (category.isEBusinessCard) {
          const price = calculateEBusinessCardPrice(item, eBusinessCardUsers)
          if (typeof price === 'number') {
            selectedPrices.push(price)
          }
        } else {
          selectedPrices.push(item.price)
        }
        selectedCount++
      }
    })

    if (activeSubTab !== "complete" && activeSubTab !== "ebusinesscard" && selectedCount === category.items.length && category.bundlePrice) {
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
        if (category.isEBusinessCard) {
          selectedItemsList.push(`${category.name}: ${item.name} (${eBusinessCardUsers} user${eBusinessCardUsers !== 1 ? 's' : ''})`)
        } else {
          selectedItemsList.push(`${category.name}: ${item.name}`)
        }
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

      // Add eBusiness card specific data
      if (category.isEBusinessCard) {
        purchaseData.eBusinessCard = {
          userCount: eBusinessCardUsers
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
      setEBusinessCardUsers(1) // Reset user count
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
  
  const individualTotal = activeSubTab !== "complete" && !currentCategory.isEBusinessCard
    ? currentCategory.items.reduce((sum, item) => sum + item.price, 0)
    : 0
  const bundleSavings = currentCategory.bundlePrice && activeSubTab !== "complete" && !currentCategory.isEBusinessCard
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
              const isEBusinessCard = currentCategory.isEBusinessCard
              const price = isEBusinessCard ? calculateEBusinessCardPrice(item, eBusinessCardUsers) : item.price
              
              return (
                <tr
                  key={key}
                  style={{
                    ...styles.itemRow,
                    ...(isSelected ? styles.itemRowSelected : {}),
                  }}
                  onClick={() => !isEBusinessCard && toggleItem(itemIndex)} // Only toggle if not eBusiness card row
                  onMouseEnter={(e) => {
                    if (!isSelected && !isEBusinessCard) {
                      e.currentTarget.style.backgroundColor = colors.cream
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !isEBusinessCard) {
                      e.currentTarget.style.backgroundColor = colors.offWhite
                    }
                  }}
                >
                  <td style={styles.td}>
                    <div style={styles.checkboxContainer} onClick={(e) => {
                      if (isEBusinessCard) {
                        e.stopPropagation()
                        toggleItem(itemIndex)
                      }
                    }}>
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
                        {item.requiresSubscription && (
                          <div style={{ fontSize: "0.75rem", color: colors.accentGold, marginTop: "0.25rem", fontStyle: "italic" }}>
                            ⭐ Requires active subscription
                          </div>
                        )}
                      </div>
                    </div>
                    {/* User selector for eBusiness cards */}
                    {isEBusinessCard && isSelected && (
                      <div style={styles.userSelector} onClick={(e) => e.stopPropagation()}>
                        <button
                          style={styles.userButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            setEBusinessCardUsers(Math.max((item.minUsers || 1), eBusinessCardUsers - 1))
                          }}
                          disabled={eBusinessCardUsers <= (item.minUsers || 1)}
                        >
                          -
                        </button>
                        <div>
                          <div style={styles.userCount}>{eBusinessCardUsers}</div>
                          <div style={{ fontSize: "0.7rem", color: colors.mediumBrown }}>
                            {eBusinessCardUsers === 1 ? "user" : "users"}
                          </div>
                        </div>
                        <button
                          style={styles.userButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!item.maxUsers || eBusinessCardUsers < item.maxUsers) {
                              setEBusinessCardUsers(eBusinessCardUsers + 1)
                            }
                          }}
                          disabled={item.maxUsers && eBusinessCardUsers >= item.maxUsers}
                        >
                          +
                        </button>
                        {item.maxUsers && eBusinessCardUsers >= item.maxUsers && (
                          <div style={{ fontSize: "0.75rem", color: colors.mediumBrown, marginLeft: "0.5rem" }}>
                            For 25+ users, contact us for custom pricing
                          </div>
                        )}
                      </div>
                    )}
                    {isLastItem && !item.isBundle && !isEBusinessCard && currentCategory.bundlePrice && bundleSavings > 0 && (
                      <p style={styles.bundleNote}>
                        Select all items for R{currentCategory.bundlePrice.toLocaleString()} (Save R{bundleSavings.toLocaleString()})
                      </p>
                    )}
                  </td>
                  <td style={styles.td}>
                    <p style={styles.itemDescription}>{item.description}</p>
                  </td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <span style={styles.itemPrice}>
                      {typeof price === 'number' ? `R${price.toLocaleString()}` : price}
                      {isEBusinessCard && typeof price === 'number' && (
                        <div style={{ fontSize: "0.7rem", marginTop: "0.25rem", fontWeight: "normal" }}>
                          per annum
                        </div>
                      )}
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
          <h3 style={styles.totalTitle}>Your {currentCategory.name}</h3>
          <div style={styles.totalAmount}>R{total.toLocaleString()}</div>
          <p style={{ margin: "0 0 1.5rem 0", opacity: "0.9" }}>
            {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
            {currentCategory.isEBusinessCard && (
              <span style={{ display: "block", marginTop: "0.5rem", fontSize: "0.9rem" }}>
                👥 {eBusinessCardUsers} user{eBusinessCardUsers !== 1 ? "s" : ""}
              </span>
            )}
            {activeSubTab !== "complete" && !currentCategory.isEBusinessCard && selectedCount === currentCategory.items.length && bundleSavings > 0 && (
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
                {currentCategory.isEBusinessCard && ` • ${eBusinessCardUsers} user${eBusinessCardUsers !== 1 ? 's' : ''}`}
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
      `}</style>
    </div>
  )
}

export default LegitimacyTab