"use client"
import { useState } from "react"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { Check, ShoppingCart, Download } from "lucide-react"
import EmbeddedCheckout from "../../components/EmbeddedCheckout"

// Use the same one-time checkout function as other tabs
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
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutId, setCheckoutId] = useState(null)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [hoveredPackage, setHoveredPackage] = useState(null)

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
    featureCheck: "#A67C52",
    success: "#10b981",
    error: "#dc2626",
  }

  const governancePackages = [
    {
      name: "Advisory Readiness Pack",
      included: ["External Advisor Agreement Template", "Advisory Board Charter Template"],
      scoreBoost: "Helps SMEs formalize advisors (PIS < 100)",
      price: 500,
      deliveryTime: "24-48 hours"
    },
    {
      name: "Board Starter Toolkit",
      included: [
        "Board Charter Template",
        "Board Member Appointment Letter",
        "Board Meeting Agenda & Minutes Templates",
      ],
      scoreBoost: "Builds basic board structure (PIS 100-349)",
      price: 1000,
      deliveryTime: "24-48 hours"
    },
    {
      name: "Governance Policy Pack",
      included: [
        "Audit Committee TOR Template",
        "Risk Committee TOR Template",
        "Remuneration Committee TOR Template",
        "Basic Governance Policy Template",
      ],
      scoreBoost: "Supports committee setup & policy framework (PIS ≥ 350)",
      price: 1500,
      deliveryTime: "48-72 hours"
    },
    {
      name: "Governance Guide",
      included: ['PDF: "How to Build Your Board and Strengthen Oversight"'],
      scoreBoost: "Educational (light lift for SMEs at all stages)",
      price: 0,
      isFree: true,
      deliveryTime: "Instant download"
    },
  ]

  const styles = {
    container: {
      padding: "2rem 0",
      position: "relative",
    },
    header: {
      textAlign: "center",
      marginBottom: "3rem",
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
    packagesGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", // Responsive grid
      gap: "2rem",
      marginBottom: "3rem",
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "0 1rem",
    },
    packageCard: {
      background: colors.offWhite,
      borderRadius: "1.5rem", // More rounded corners
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.05)", // More prominent, layered shadow
      cursor: "pointer",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      height: "100%", // Ensure cards are same height
      overflow: "hidden", // Ensures rounded corners clip content
      border: `1px solid ${colors.lightTan}`, // Subtle border for the whole card
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    packageCardSelected: {
      borderColor: colors.accentGold,
      boxShadow: `0 15px 40px ${colors.accentGold}20, 0 6px 15px ${colors.accentGold}10`,
      transform: "translateY(-6px)",
    },
    packageCardHover: {
      transform: "translateY(-4px)",
      boxShadow: "0 12px 35px rgba(0, 0, 0, 0.2), 0 5px 12px rgba(0, 0, 0, 0.08)",
    },
    packageCardFree: {
      borderColor: colors.darkBrown,
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
    },
    freeBadge: {
      position: "absolute",
      top: "0", // Position at the top edge of the card
      left: "50%",
      transform: "translateX(-50%) translateY(-50%)", // Center horizontally and pull up by half its height
      background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      padding: "0.5rem 1rem",
      borderRadius: "20px",
      fontSize: "0.75rem",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      zIndex: 3,
      whiteSpace: "nowrap", // Prevent text wrapping
    },
    cardHeaderBackground: {
      height: "120px", // Height of the colored header
      background: `linear-gradient(135deg, ${colors.mediumBrown} 0%, ${colors.darkBrown} 100%)`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      color: colors.lightText,
      padding: "1rem",
      position: "relative",
      zIndex: 1,
      borderTopLeftRadius: "1.5rem",
      borderTopRightRadius: "1.5rem",
    },
    packageName: {
      fontSize: "clamp(1.1rem, 2vw, 1.3rem)",
      fontWeight: "700",
      lineHeight: "1.3",
      textAlign: "center",
      minHeight: "2.6em", // Consistent height for package name (approx 2 lines)
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
    },
    priceContainer: {
      background: colors.offWhite,
      borderRadius: "1rem",
      padding: "1.5rem 1rem",
      textAlign: "center",
      position: "relative",
      top: "-30px", // Overlap with the header
      zIndex: 2,
      margin: "0 1.5rem", // Horizontal margin to make it narrower than the card
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
      border: `1px solid ${colors.lightTan}`,
    },
    packagePrice: {
      fontSize: "clamp(2rem, 3vw, 2.5rem)",
      fontWeight: "800",
      color: colors.accentGold,
      margin: "0",
      lineHeight: "1",
    },
    freePrice: {
      color: colors.darkBrown,
    },
    deliveryBadge: {
      background: `linear-gradient(135deg, ${colors.accentGold}20 0%, ${colors.lightTan}40 100%)`,
      color: colors.darkBrown,
      padding: "0.4rem 0.8rem",
      borderRadius: "20px",
      fontSize: "0.75rem",
      fontWeight: 600,
      marginTop: "0.5rem",
      border: `1px solid ${colors.accentGold}40`,
    },
    featuresContainer: {
      padding: "0 2rem 2rem",
      marginTop: "-20px", // Adjust for price container overlap
      flex: "1", // Push button to bottom
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between", // Distribute space between included section and score boost
    },
    includedSection: {
      marginBottom: "1.5rem",
      flex: "1", // Allow included section to grow
    },
    includedTitle: {
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      fontWeight: "600",
      color: colors.darkBrown,
      marginBottom: "0.75rem",
    },
    includedList: {
      listStyle: "none",
      padding: "0",
      margin: "0 0 1rem 0",
    },
    includedItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: "0.5rem",
      marginBottom: "0.5rem",
      fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)",
      color: colors.darkText,
      lineHeight: "1.4",
    },
    scoreBoost: {
      background: colors.cream,
      padding: "0.75rem",
      borderRadius: "0.5rem",
      fontSize: "clamp(0.75rem, 1.5vw, 0.85rem)",
      color: colors.darkBrown,
      fontWeight: "600",
      marginBottom: "1.5rem", // Ensure consistent spacing before the button
      textAlign: "center",
    },
    buyButton: {
      width: "100%",
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      border: "none",
      padding: "1rem 2rem",
      borderRadius: "0.75rem",
      fontWeight: "700",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.75rem",
      marginTop: "auto", // Align buttons at the bottom
      minHeight: "50px", // Consistent button height
      boxShadow: `0 4px 12px ${colors.accentGold}40`,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    freeButton: {
      background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`,
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
    deliveryInfo: {
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

  const handleFreeDownload = async () => {
    try {
      const auth = getAuth()
      const user = auth.currentUser

      if (!user) {
        alert("Please log in to download the free guide.")
        return
      }

      // Save free download to Firebase
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
        packageDetails: {
          isFree: true,
          deliveryTime: "Instant download",
          features: ["PDF: How to Build Your Board and Strengthen Oversight"]
        }
      }

      await addDoc(collection(db, "growthToolsPurchases"), downloadData)

      // Send notification to backend for email
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
      setSelectedPackage(null) // Clear selection after download
    }
  }

  const handlePurchase = async (packageIndex) => {
    setSelectedPackage(packageIndex)
    const selectedPkg = governancePackages[packageIndex]

    if (selectedPkg.isFree) {
      handleFreeDownload()
      return
    }

    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      alert("Please log in to make a purchase.")
      return
    }

    setIsPaymentLoading(true)

    try {
      console.log("Creating one-time checkout for:", selectedPkg.name)

      const result = await createOneTimeCheckout(
        selectedPkg.price,
        "ZAR",
        user.uid,
        selectedPkg.name,
        "Governance Tools"
      )

      console.log("One-time checkout result:", result)

      if (!result || !result.checkoutId) {
        throw new Error("Invalid response from checkout service.")
      }

      const transactionRef = result.orderId || `governance_${Date.now()}_${user.uid.slice(0, 8)}`

      const db = getFirestore()
      const purchaseData = {
        userId: user.uid,
        userEmail: user.email,
        packageName: `Governance - ${selectedPkg.name}`,
        price: `R${selectedPkg.price}`,
        amount: selectedPkg.price,
        transactionRef: transactionRef,
        checkoutId: result.checkoutId,
        status: "Pending",
        createdAt: serverTimestamp(),
        type: "governance_tools",
        deliveryStatus: "pending",
        packageDetails: {
          scoreBoost: selectedPkg.scoreBoost,
          deliveryTime: selectedPkg.deliveryTime,
          included: selectedPkg.included
        }
      }

      await addDoc(collection(db, "growthToolsPurchases"), purchaseData)

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
    console.log("Governance tool payment completed:", event)
    setPaymentProcessing(true)

    try {
      // Send notification to backend for email
      await fetch(`${process.env.REACT_APP_API_URL}/api/payments/handle-payment-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutId: event.checkoutId,
          transactionId: event.transactionId,
          userId: getAuth().currentUser?.uid,
          type: 'payment',
          toolName: governancePackages[selectedPackage]?.name || 'Governance Tool',
          amount: governancePackages[selectedPackage]?.price || 0,
          currency: 'ZAR',
          customerEmail: getAuth().currentUser?.email
        })
      });
      console.log('✅ Email notification sent to backend');

      // Show success message
      alert(`🎉 Payment Successful!\n\n${governancePackages[selectedPackage]?.name} purchased successfully!\n\nDelivery time: ${governancePackages[selectedPackage]?.deliveryTime}\n\nYou'll receive a confirmation email shortly.`)
      
    } catch (emailError) {
      console.warn('⚠️ Failed to send email notification:', emailError);
      alert("Payment successful! Your governance tools will be delivered within 24 hours.")
    } finally {
      setShowCheckout(false)
      setSelectedPackage(null)
      setPaymentProcessing(false)
    }
  }

  const handleCheckoutCancelled = () => {
    console.log("Payment cancelled")
    setShowCheckout(false)
    setSelectedPackage(null)
    setPaymentProcessing(false)
    alert("Payment cancelled")
  }

  const handleCheckoutExpired = () => {
    console.log("Payment expired")
    setShowCheckout(false)
    setSelectedPackage(null)
    setPaymentProcessing(false)
    alert("Payment session expired. Please try again.")
  }

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

      <div style={styles.packagesGrid}>
        {governancePackages.map((pkg, index) => (
          <div
            key={index}
            style={{
              ...styles.packageCard,
              ...(selectedPackage === index ? styles.packageCardSelected : {}),
              ...(hoveredPackage === index ? styles.packageCardHover : {}),
              ...(pkg.isFree ? styles.packageCardFree : {}),
            }}
            onMouseEnter={() => setHoveredPackage(index)}
            onMouseLeave={() => setHoveredPackage(null)}
          >
          
          
            <div style={styles.cardHeaderBackground}>
              <h3 style={styles.packageName}>{pkg.name}</h3>
            </div>

            <div style={styles.priceContainer}>
              <p
                style={{
                  ...styles.packagePrice,
                  ...(pkg.isFree ? styles.freePrice : {}),
                }}
              >
                {pkg.isFree ? "Free" : `R${pkg.price.toLocaleString()}`}
              </p>
              <div style={styles.deliveryBadge}>
                ⚡ {pkg.deliveryTime}
              </div>
            </div>

            <div style={styles.featuresContainer}>
              <div style={styles.includedSection}>
                <h4 style={styles.includedTitle}>What's Included:</h4>
                <ul style={styles.includedList}>
                  {pkg.included.map((item, itemIndex) => (
                    <li key={itemIndex} style={styles.includedItem}>
                      <Check size={14} style={{ color: colors.featureCheck, flexShrink: 0, marginTop: "0.125rem" }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div style={styles.scoreBoost}>
                <strong>Why It Boosts Score:</strong> {pkg.scoreBoost}
              </div>
              <button
                style={{
                  ...styles.buyButton,
                  ...(pkg.isFree ? styles.freeButton : {}),
                  ...(isPaymentLoading && selectedPackage === index && !pkg.isFree ? styles.buyButtonProcessing : {}),
                }}
                onClick={() => handlePurchase(index)}
                disabled={isPaymentLoading && !pkg.isFree}
                onMouseEnter={(e) => {
                  if (!isPaymentLoading || pkg.isFree) {
                    e.target.style.transform = "translateY(-2px)"
                    e.target.style.boxShadow = `0 8px 20px ${pkg.isFree ? colors.darkBrown : colors.accentGold}60`
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPaymentLoading || pkg.isFree) {
                    e.target.style.transform = "translateY(0)"
                    e.target.style.boxShadow = `0 4px 12px ${pkg.isFree ? colors.darkBrown : colors.accentGold}40`
                  }
                }}
              >
                {pkg.isFree ? (
                  <>
                    <Download size={20} />
                    Get Free Guide
                  </>
                ) : (
                  <>
                    {isPaymentLoading && selectedPackage === index ? (
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
                        Buy Package
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Checkout Modal */}
      {showCheckout && checkoutId && (
        <div style={styles.checkoutModal}>
          <div style={styles.checkoutContent}>
            <h2 style={styles.checkoutHeader}>
              Complete Your Purchase
            </h2>
            
            <div style={styles.checkoutInfo}>
              <div style={styles.packageSummary}>
                🏛️ {governancePackages[selectedPackage]?.name}
              </div>
              <div style={styles.priceSummary}>
                R{governancePackages[selectedPackage]?.price.toLocaleString()}
              </div>
              <div style={styles.deliveryInfo}>
                📦 Delivered in {governancePackages[selectedPackage]?.deliveryTime}
              </div>
            </div>

            <EmbeddedCheckout
              checkoutId={checkoutId}
              onCompleted={handleCheckoutCompleted}
              onCancelled={handleCheckoutCancelled}
              onExpired={handleCheckoutExpired}
              paymentType="payment"
              amount={governancePackages[selectedPackage]?.price}
              toolName={governancePackages[selectedPackage]?.name}
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
                    setSelectedPackage(null)
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
                  🔒 Securing your governance package...
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

        /* Responsive design */
        @media (max-width: 1200px) {
          .packagesGrid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
          }
        }

        @media (max-width: 768px) {
          .packagesGrid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
            padding: 0 0.5rem !important;
          }
        }

        @media (max-width: 480px) {
          .checkoutContent {
            padding: 1rem !important;
            margin: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  )
}

export default GovernanceTab