"use client"
import { useState } from "react"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { Check, ShoppingCart, CreditCard } from "lucide-react"
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
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutId, setCheckoutId] = useState(null)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [hoveredPackage, setHoveredPackage] = useState(null)

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

  const legitimacyPackages = [
    {
      name: "Digital Foundation",
      subtitle: "Exist online",
      focus: "Get your business online",
      price: 4500,
      features: ["1-year hosting & domain registration", "Up to 5 business email accounts"],
      icon: "",
      deliveryTime: "24-48 hours"
    },
    {
      name: "First Impressions",
      subtitle: "Look professional",
      focus: "Establish a professional brand identity",
      price: 5000,
      features: [
        "Logo design (2 concepts, 3 revisions)",
        "Brand board (colours & fonts)",
        "Business card template",
        "Email signature template",
        "Company brochure/flyer",
        "Letterhead design",
      ],
      icon: "",
      deliveryTime: "3-5 business days"
    },
    {
      name: "Digital Presence",
      subtitle: "Show up credibly online",
      focus: "Bring your brand to life online",
      price: 6000,
      features: [
        "Starter website (5 pages)",
        "LinkedIn company page",
        "Leadership social media kit (profile & banner templates)",
      ],
      icon: "",
      deliveryTime: "5-7 business days"
    },
    {
      name: "Legitimacy Accelerator",
      subtitle: "Amplify trust with visibility",
      focus: "Boost trust with visibility",
      price: 6000,
      features: ["Google Business Profile & SEO setup", "30-sec explainer video", "1 press release draft"],
      icon: "",
      deliveryTime: "7-10 business days"
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
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "2rem",
      marginBottom: "3rem",
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "0 1rem",
    },
    packageCard: {
      background: colors.offWhite,
      borderRadius: "1.5rem",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.05)",
      cursor: "pointer",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
      border: `1px solid ${colors.lightTan}`,
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
    cardHeaderBackground: {
      height: "140px",
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
    packageIcon: {
      fontSize: "2.5rem",
      marginBottom: "0.5rem",
      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
    },
    packageName: {
      fontSize: "clamp(1.2rem, 2vw, 1.5rem)",
      fontWeight: "700",
      lineHeight: "1.3",
      textAlign: "center",
      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
    },
    priceContainer: {
      background: colors.offWhite,
      borderRadius: "1rem",
      padding: "1.5rem 1rem",
      textAlign: "center",
      position: "relative",
      top: "-30px",
      zIndex: 2,
      margin: "0 1.5rem",
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
    packageSubtitle: {
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      color: colors.mediumBrown,
      fontStyle: "italic",
      marginTop: "0.5rem",
      fontWeight: 500,
    },
    packageFocus: {
      fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)",
      color: colors.mediumBrown,
      marginTop: "0.5rem",
      minHeight: "2.5em",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
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
      marginTop: "-20px",
      flex: "1",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
    packageFeatures: {
      listStyle: "none",
      padding: "0",
      margin: "0 0 1.5rem 0",
    },
    packageFeature: {
      display: "flex",
      alignItems: "flex-start",
      gap: "0.75rem",
      marginBottom: "0.75rem",
      fontSize: "clamp(0.85rem, 1.5vw, 0.95rem)",
      color: colors.darkText,
      lineHeight: "1.5",
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
      marginTop: "auto",
      minHeight: "50px",
      boxShadow: `0 4px 12px ${colors.accentGold}40`,
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

  const handlePurchase = async (packageIndex) => {
    setSelectedPackage(packageIndex)
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      alert("Please log in to make a purchase.")
      return
    }

    setIsPaymentLoading(true)

    try {
      const selectedPkg = legitimacyPackages[packageIndex]
      console.log("Creating one-time checkout for:", selectedPkg.name)

      const result = await createOneTimeCheckout(
        selectedPkg.price,
        "ZAR",
        user.uid,
        selectedPkg.name,
        "Legitimacy Tools"
      )

      console.log("One-time checkout result:", result)

      if (!result || !result.checkoutId) {
        throw new Error("Invalid response from checkout service.")
      }

      const transactionRef = result.orderId || `legitimacy_${Date.now()}_${user.uid.slice(0, 8)}`

      const db = getFirestore()
      const purchaseData = {
        userId: user.uid,
        userEmail: user.email,
        packageName: `Legitimacy - ${selectedPkg.name}`,
        price: `R${selectedPkg.price}`,
        amount: selectedPkg.price,
        transactionRef: transactionRef,
        checkoutId: result.checkoutId,
        status: "Pending",
        createdAt: serverTimestamp(),
        type: "legitimacy_tools",
        deliveryStatus: "pending",
        packageDetails: {
          icon: selectedPkg.icon,
          subtitle: selectedPkg.subtitle,
          deliveryTime: selectedPkg.deliveryTime,
          features: selectedPkg.features
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
    console.log("Growth tool payment completed:", event)
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
          toolName: legitimacyPackages[selectedPackage]?.name || 'Growth Tool',
          amount: legitimacyPackages[selectedPackage]?.price || 0,
          currency: 'ZAR',
          customerEmail: getAuth().currentUser?.email
        })
      });
      console.log('✅ Email notification sent to backend');

      // Show success message
      alert(`🎉 Payment Successful!\n\n${legitimacyPackages[selectedPackage]?.name} purchased successfully!\n\nDelivery time: ${legitimacyPackages[selectedPackage]?.deliveryTime}\n\nYou'll receive a confirmation email shortly.`)
      
    } catch (emailError) {
      console.warn('⚠️ Failed to send email notification:', emailError);
      alert("Payment successful! Your legitimacy tools will be delivered within 24 hours.")
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
        <h2 style={styles.title}>Boost Your Legitimacy Score</h2>
        <p style={styles.subtitle}>Look the part, get taken seriously.</p>
        <p style={styles.description}>
          A strong online presence and brand builds trust. If your business looks real, funders and clients will believe
          it is.
        </p>
      </div>

      <div style={styles.packagesGrid}>
        {legitimacyPackages.map((pkg, index) => (
          <div
            key={index}
            style={{
              ...styles.packageCard,
              ...(selectedPackage === index ? styles.packageCardSelected : {}),
              ...(hoveredPackage === index ? styles.packageCardHover : {}),
            }}
            onMouseEnter={() => setHoveredPackage(index)}
            onMouseLeave={() => setHoveredPackage(null)}
          >
            <div style={styles.cardHeaderBackground}>
              <div style={styles.packageIcon}>{pkg.icon}</div>
              <h3 style={styles.packageName}>{pkg.name}</h3>
            </div>

            <div style={styles.priceContainer}>
              <p style={styles.packagePrice}>R{pkg.price.toLocaleString()}</p>
              <p style={styles.packageSubtitle}>{`"${pkg.subtitle}"`}</p>
              <p style={styles.packageFocus}>{pkg.focus}</p>
              <div style={styles.deliveryBadge}>
                ⚡ Delivered in {pkg.deliveryTime}
              </div>
            </div>

            <div style={styles.featuresContainer}>
              <ul style={styles.packageFeatures}>
                {pkg.features.map((feature, featureIndex) => (
                  <li key={featureIndex} style={styles.packageFeature}>
                    <Check size={16} style={{ color: colors.featureCheck, flexShrink: 0, marginTop: "0.125rem" }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                style={{
                  ...styles.buyButton,
                  ...(isPaymentLoading && selectedPackage === index ? styles.buyButtonProcessing : {}),
                }}
                onClick={() => handlePurchase(index)}
                disabled={isPaymentLoading}
                onMouseEnter={(e) => {
                  if (!isPaymentLoading) {
                    e.target.style.transform = "translateY(-2px)"
                    e.target.style.boxShadow = `0 8px 20px ${colors.accentGold}60`
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPaymentLoading) {
                    e.target.style.transform = "translateY(0)"
                    e.target.style.boxShadow = `0 4px 12px ${colors.accentGold}40`
                  }
                }}
              >
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
                {legitimacyPackages[selectedPackage]?.icon} {legitimacyPackages[selectedPackage]?.name}
              </div>
              <div style={styles.priceSummary}>
                R{legitimacyPackages[selectedPackage]?.price.toLocaleString()}
              </div>
              <div style={styles.deliveryInfo}>
                📦 Delivered in {legitimacyPackages[selectedPackage]?.deliveryTime}
              </div>
            </div>

            <EmbeddedCheckout
              checkoutId={checkoutId}
              onCompleted={handleCheckoutCompleted}
              onCancelled={handleCheckoutCancelled}
              onExpired={handleCheckoutExpired}
              paymentType="payment"
              amount={legitimacyPackages[selectedPackage]?.price}
              toolName={legitimacyPackages[selectedPackage]?.name}
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
                  🔒 Securing your legitimacy package...
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

export default LegitimacyTab