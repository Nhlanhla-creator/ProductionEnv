"use client"
import { useState, useEffect } from "react"
import {
  Eye,
  RefreshCw,
  X,
  Calendar,
  DollarSign,
  BarChart3,
  Package,
  Award,
  Truck,
  Star,
  MessageSquare,
  Send,
} from "lucide-react"
import { SupplierTable } from "./supplier-table" // Import your existing SupplierTable component
import { db, auth } from "../../firebaseConfig"
import { collection, addDoc, getDocs, query, where, doc, getDoc } from "firebase/firestore"

// Text truncation component
const TruncatedText = ({ text, maxLength = 40 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span style={{ color: "#999" }}>{text || "-"}</span>
  }

  const shouldTruncate = text.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`

  const toggleExpanded = (e) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div style={{ lineHeight: "1.4" }}>
      <span style={{ wordBreak: "break-word" }}>{displayText}</span>
      {shouldTruncate && (
        <button
          style={{
            background: "none",
            border: "none",
            color: "#a67c52",
            cursor: "pointer",
            fontSize: "0.75rem",
            marginLeft: "4px",
            textDecoration: "underline",
            padding: "0",
          }}
          onClick={toggleExpanded}
        >
          {isExpanded ? "Less" : "More"}
        </button>
      )}
    </div>
  )
}

const StarRating = ({ rating, onRatingChange, readOnly = false, size = 24 }) => {
  const [hoverRating, setHoverRating] = useState(0)

  const handleStarClick = (starValue) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(starValue)
    }
  }

  const handleStarHover = (starValue) => {
    if (!readOnly) {
      setHoverRating(starValue)
    }
  }

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(0)
    }
  }

  const getStarColor = (starIndex) => {
    const currentRating = hoverRating || rating
    if (starIndex <= currentRating) {
      return "#ffd700" // Gold for filled stars
    }
    return "#e0e0e0" // Gray for empty stars
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        cursor: readOnly ? "default" : "pointer",
      }}
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((starValue) => (
        <Star
          key={starValue}
          size={size}
          style={{
            color: getStarColor(starValue),
            fill: getStarColor(starValue),
            transition: "all 0.2s ease",
          }}
          onClick={() => handleStarClick(starValue)}
          onMouseEnter={() => handleStarHover(starValue)}
        />
      ))}
    </div>
  )
}

const ReviewsModal = ({ supplier, isOpen, onClose, onSubmitReview }) => {
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingReviews, setExistingReviews] = useState([])
  const [username, setUsername] = useState("")
  const [anonymousStatus, setAnonymousStatus] = useState(false)

  useEffect(() => {
    const fetchUsername = async () => {
      const user = auth.currentUser
      if (!user) return

      try {
        const usersCol = collection(db, "users")
        const q = query(usersCol, where("email", "==", user.email))
        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data()
          setUsername(userData.username || "")
        }
      } catch (error) {
        console.error("Error fetching username:", error)
      }
    }

    fetchUsername()
  }, [])

  // 🔹 2. Fetch supplier reviews
  useEffect(() => {
    if (!supplier) return

    const fetchReviews = async () => {
      try {
        const reviewsCol = collection(db, "supplierReviews")
        const q = query(reviewsCol, where("supplierName", "==", supplier.name))
        const reviewsSnapshot = await getDocs(q)
        const reviewsData = reviewsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setExistingReviews(reviewsData)
      } catch (error) {
        console.error("Error fetching reviews:", error)
      }
    }

    fetchReviews()
  }, [supplier])

  // 🔹 3. Average rating calculation
  const averageRating =
    existingReviews.length > 0
      ? existingReviews.reduce((sum, review) => sum + review.rating, 0) / existingReviews.length
      : 0

  // 🔹 4. Submit new review
  const handleSubmit = async () => {
    if (newRating === 0) {
      alert("Please select a rating before submitting.")
      return
    }

    setIsSubmitting(true)

    try {
      // Step 1: Get logged-in user
      const currentUser = auth.currentUser
      if (!currentUser) {
        alert("You must be logged in to submit a review.")
        setIsSubmitting(false)
        return
      }

      // Step 2: Fetch registeredName from universalProfiles
      const userDocRef = doc(db, "universalProfiles", currentUser.uid)
      const userDocSnap = await getDoc(userDocRef)

      let registeredName = "Anonymous"

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        registeredName =
          userData.entityOverview?.registeredName || userData.registeredName || currentUser.displayName || "Anonymous"
      }

      // Step 3: Use Anonymous if checkbox is checked
      const customerName = anonymousStatus ? "Anonymous" : registeredName

      // Step 4: Add new review
      await addDoc(collection(db, "supplierReviews"), {
        supplierName: supplier.name,
        rating: newRating,
        comment: newComment,
        date: new Date().toISOString().split("T")[0],
        customerName, // ✅ uses anonymous if checkbox is checked
      })

      // Update local state immediately
      setExistingReviews((prev) => [
        ...prev,
        {
          id: Date.now(),
          supplierName: supplier.name,
          rating: newRating,
          comment: newComment,
          date: new Date().toISOString().split("T")[0],
          customerName,
        },
      ])

      alert("Review submitted successfully!")
      setNewRating(0)
      setNewComment("")
      onClose()
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("Failed to submit review.")
    }

    setIsSubmitting(false)
  }

  if (!isOpen || !supplier) return null

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(62, 39, 35, 0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1200,
    animation: "fadeIn 0.3s ease-out",
    backdropFilter: "blur(4px)",
  }

  const modalContentStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "32px",
    maxWidth: "700px",
    width: "95%",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            paddingBottom: "16px",
            borderBottom: "2px solid #e0e0e0",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#3e2723",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Star size={24} style={{ color: "#ffd700" }} />
            Reviews for {supplier.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Average Rating Display */}
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid #e9ecef",
            textAlign: "center",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", color: "#3e2723" }}>Overall Rating</h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <StarRating rating={averageRating} readOnly={true} size={28} />
            <span style={{ fontSize: "24px", fontWeight: "700", color: "#3e2723" }}>{averageRating.toFixed(1)}/5</span>
          </div>
          <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
            Based on {existingReviews.length} customer reviews
          </p>
        </div>

        {/* Existing Reviews */}
        <div style={{ marginBottom: "32px" }}>
          <h3 style={{ margin: "0 0 16px 0", color: "#3e2723" }}>Customer Reviews</h3>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {existingReviews.map((review) => (
              <div
                key={review.id}
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  border: "1px solid #e9ecef",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <StarRating rating={review.rating} readOnly={true} size={16} />
                    <div>
                      <span style={{ fontWeight: "600", color: "#3e2723" }}>{review.customerName}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: "12px", color: "#666" }}>{review.date}</span>
                </div>
                <p style={{ margin: "0", color: "#555", fontSize: "14px", lineHeight: "1.5" }}>"{review.comment}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Review Section */}
        <div
          style={{
            backgroundColor: "#fff3e0",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #ffcc02",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#e65100" }}>Add Your Review</h3>

          {/* Rating Input */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#3e2723" }}
            >
              Your Rating
            </label>
            <StarRating rating={newRating} onRatingChange={setNewRating} size={32} />
            {newRating > 0 && (
              <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: "12px" }}>
                You selected {newRating} star{newRating !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Comment Input */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#3e2723",
              }}
            >
              <MessageSquare size={16} style={{ marginRight: "8px", verticalAlign: "middle" }} />
              Your Comment (Optional)
            </label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience with this supplier..."
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "12px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "vertical",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#5d4037")}
              onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
            />
          </div>

          <div>
            <label>
              <input type="checkbox" onChange={(e) => setAnonymousStatus(e.target.checked)} />
              Anonymous
            </label>
          </div>

          {/* Submit Button */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: "#f5f5f5",
                color: "#666",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={newRating === 0 || isSubmitting}
              style={{
                backgroundColor: newRating === 0 ? "#ccc" : "#5d4037",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: newRating === 0 ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Successful Supplier Deals Table Component
const SuccessfulSupplierDealsTable = ({ acceptedSuppliers, supplier }) => {
  const [deals, setDeals] = useState([])
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [existingReviews, setExistingReviews] = useState([])
  const [supplierReviews, setSupplierReviews] = useState([])
  const [averageRating, setAverageRating] = useState(0)

  useEffect(() => {
    if (!acceptedSuppliers || acceptedSuppliers.length === 0) {
      setDeals([])
      return
    }

    const fetchDealsWithRatings = async () => {
      const transformedDeals = await Promise.all(
        acceptedSuppliers.map(async (supplier) => {
          const supplierName =
            supplier.entityOverview?.tradingName || supplier.entityOverview?.registeredName || "Unknown Supplier"

          // Fetch reviews for this supplier
          const reviewsRef = collection(db, "supplierReviews")
          const q = query(reviewsRef, where("supplierName", "==", supplierName))
          const querySnapshot = await getDocs(q)
          const reviews = querySnapshot.docs.map((doc) => doc.data())

          // Calculate average rating
          const avgRating =
            reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : null // <-- use null to show "--" before data loads

          return {
            id: supplier.id,
            supplierName,
            dealAmount: supplier.financialOverview?.annualRevenue || "Not specified",
            dealType: supplier.productsServices?.productCategories?.[0]?.name || "Not specified",
            completionDate: supplier.lastActivity || new Date().toISOString().split("T")[0],
            sector: supplier.entityOverview?.economicSectors?.[0] || "Not specified",
            dealDuration: "Ongoing",
            servicesDelivered: Array.isArray(supplier.productsServices?.productCategories)
              ? supplier.productsServices.productCategories.map((cat) => cat.name).join(", ")
              : "Various services",
            currentStatus: "Active Contract",
            contractValue: supplier.financialOverview?.annualRevenue || "Not specified",
            nextRenewal: "To be determined",
            location: supplier.entityOverview?.location || "Not specified",
            supplierType: supplier.entityOverview?.entityType || "Not specified",
            performanceRating: avgRating !== null ? Number.parseFloat(avgRating.toFixed(1)) : null,
            bbbeeLevel: supplier.legalCompliance?.bbbeeLevel || "N/A",
            deliveryMode: Array.isArray(supplier.productsServices?.deliveryModes)
              ? supplier.productsServices.deliveryModes.join(", ")
              : "Not specified",
            paymentTerms: "Standard",
          }
        }),
      )

      setDeals(transformedDeals)
    }

    fetchDealsWithRatings()
  }, [acceptedSuppliers])

  const handleReviewsClick = (deal) => {
    setSelectedSupplier({ id: deal.id, name: deal.supplierName })
    setReviewsModalOpen(true)
  }

  const handleSubmitReview = (reviewData) => {
    console.log("Review submitted:", reviewData)
    // Here you would typically send the review to your backend
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Active Contract":
        return "#4caf50"
      case "Completed Successfully":
        return "#2196f3"
      case "Under Review":
        return "#ff9800"
      case "Pending Renewal":
        return "#9c27b0"
      default:
        return "#666"
    }
  }

  const getRatingColor = (score = 0) => {
    if (score >= 4.5) return "#4caf50"
    if (score >= 4.0) return "#8bc34a"
    if (score >= 3.5) return "#ff9800"
    return "#f44336"
  }

  const getBbbeeColor = (level) => {
    const levelNum = Number.parseInt(level.replace("Level ", ""))
    if (levelNum <= 2) return "#4caf50"
    if (levelNum <= 4) return "#ff9800"
    return "#f44336"
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount) => {
    return amount.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
  }

  const handleViewDetails = (deal) => {
    setSelectedDeal(deal)
  }

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(62, 39, 35, 0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    animation: "fadeIn 0.3s ease-out",
    backdropFilter: "blur(4px)",
  }

  const modalContentStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "40px",
    maxWidth: "900px",
    width: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 19, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
  }

  const rating = selectedDeal?.performanceRating || 0

  return (
    <div style={{ padding: "0" }}>
      <div
        style={{
          overflowX: "auto",
          borderRadius: "8px",
          border: "1px solid #E8D5C4",
          boxShadow: "0 4px 24px rgba(139, 69, 19, 0.08)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            fontSize: "0.875rem",
            backgroundColor: "#FEFCFA",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.70rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "12%",
                }}
              >
                Supplier Name
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                 fontSize: "0.70rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "10%",
                }}
              >
                Contract Value
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                    fontSize: "0.70rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "9%",
                }}
              >
                Deal Type
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                    fontSize: "0.70rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "10%",
                }}
              >
                Start Date
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                   fontSize: "0.70rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "9%",
                }}
              >
                Sector
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                   fontSize: "0.70rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "8%",
                }}
              >
                Duration
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                   fontSize: "0.70rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "8%",
                }}
              >
                BBBEE Level
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "center",
                  fontWeight: "600",
                   fontSize: "0.70rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "7%",
                }}
              >
                Rating
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                   fontSize: "0.70rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "11%",
                }}
              >
                Contract Status
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "center",
                  fontWeight: "600",
                   fontSize: "0.70rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "none",
                  width: "16%",
                }}
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {deals.length > 0 ? (
              deals.map((deal, index) => (
                <tr
                  key={deal.id}
                  style={{
                    borderBottom: "1px solid #E8D5C4",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5"
                    e.currentTarget.style.transform = "translateY(-1px)"
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white"
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      wordWrap: "break-word",
                      whiteSpace: "normal",
                      verticalAlign: "top",
                    }}
                  >
                    <span
                      style={{
                        color: "#a67c52",
                        fontWeight: "500",
                        lineHeight: "1.3",
                      }}
                    >
                      <TruncatedText text={deal.supplierName} maxLength={25} />
                    </span>
                    <div style={{ fontSize: "0.7rem", color: "#999", marginTop: "2px" }}>{deal.location}</div>
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      fontSize: "0.860rem",
                      color: "#5d2a0a",
                    }}
                  >
                    {formatCurrency(deal.dealAmount)}
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                    fontSize: "0.860rem",
                      color: "#5d2a0a",
                    }}
                  >
                    <TruncatedText text={deal.dealType} maxLength={15} />
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      fontSize: "13px",
                         color:"#5d2a0a"
                    }}
                  >
                    {formatDate(deal.completionDate)}
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                       fontSize: "13px",
                         color:"#5d2a0a"
                    }}
                  >
                    <TruncatedText text={deal.sector} maxLength={20} />
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                       fontSize: "13px",
                         color:"#5d2a0a"
                    }}
                  >
                    {deal.dealDuration}
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                    fontSize: "0.860rem",
                      color: "#5d2a0a",
                    }}
                  >
                    {deal.bbbeeLevel}
                  </td>

                  <td
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      textAlign: "center",
                      color: getRatingColor(deal.performanceRating), // ✅ use averageRating
                    }}
                  >
                    {deal.performanceRating > 0 ? `${deal.performanceRating}/5` : "0/5"}
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: getStatusColor(deal.currentStatus) + "20",
                        color: getStatusColor(deal.currentStatus),
                        padding: "6px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        display: "inline-block",
                      }}
                    >
                      {deal.currentStatus}
                    </span>
                  </td>

                  <td style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "8px",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={() => setSelectedDeal(deal)}
                        style={{
                          backgroundColor: "#5d4037",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px",
                         fontSize: "0.860rem",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleReviewsClick(deal)}
                        style={{
                          backgroundColor: "#5d4037",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Star size={12} />
                        Reviews
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="10"
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#999",
                    fontSize: "16px",
                    fontStyle: "italic",
                  }}
                >
                  No accepted suppliers yet. Suppliers will appear here once you accept them from the "My Matches" tab.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Deal Details Modal */}
      {selectedDeal && (
        <div style={modalOverlayStyle} onClick={() => setSelectedDeal(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "32px",
                paddingBottom: "24px",
                borderBottom: "3px solid #8d6e63",
              }}
            >
              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#3e2723",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <Truck size={32} style={{ color: "#4caf50" }} />
                Supplier Contract: {selectedDeal.supplierName}
              </h2>
              <button
                onClick={() => setSelectedDeal(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                  padding: "8px",
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Deal Overview Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "24px",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #e9ecef",
                }}
              >
                <h3
                  style={{
                    color: "#3e2723",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <DollarSign size={20} />
                  Contract Financial Details
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Contract Value:</strong> {formatCurrency(selectedDeal.dealAmount)}
                  </div>
                  <div>
                    <strong>Total Value:</strong> {selectedDeal.contractValue}
                  </div>
                  <div>
                    <strong>Deal Type:</strong> {selectedDeal.dealType}
                  </div>
                  <div>
                    <strong>Payment Terms:</strong> {selectedDeal.paymentTerms}
                  </div>
                  <div>
                    <strong>Performance Rating:</strong>
                    {selectedDeal.performanceRating > 0 ? `${selectedDeal.performanceRating}/5` : "0/5"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #e9ecef",
                }}
              >
                <h3
                  style={{
                    color: "#3e2723",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Calendar size={20} />
                  Contract Timeline
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Start Date:</strong> {formatDate(selectedDeal.completionDate)}
                  </div>
                  <div>
                    <strong>Contract Duration:</strong> {selectedDeal.dealDuration}
                  </div>
                  <div>
                    <strong>Next Renewal:</strong> {selectedDeal.nextRenewal}
                  </div>
                  <div>
                    <strong>Delivery Mode:</strong> {selectedDeal.deliveryMode}
                  </div>
                  <div>
                    <strong>Current Status:</strong>
                    <span
                      style={{
                        backgroundColor: getStatusColor(selectedDeal.currentStatus) + "20",
                        color: getStatusColor(selectedDeal.currentStatus),
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        marginLeft: "8px",
                      }}
                    >
                      {selectedDeal.currentStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #e9ecef",
                }}
              >
                <h3
                  style={{
                    color: "#3e2723",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Award size={20} />
                  Supplier Information
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Sector:</strong> {selectedDeal.sector}
                  </div>
                  <div>
                    <strong>Supplier Type:</strong> {selectedDeal.supplierType}
                  </div>
                  <div>
                    <strong>BBBEE Level:</strong>
                    <span
                      style={{
                        backgroundColor: getBbbeeColor(selectedDeal.bbbeeLevel) + "20",
                        color: getBbbeeColor(selectedDeal.bbbeeLevel),
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        marginLeft: "8px",
                      }}
                    >
                      {selectedDeal.bbbeeLevel}
                    </span>
                  </div>
                  <div>
                    <strong>Location:</strong> {selectedDeal.location}
                  </div>
                </div>
              </div>
            </div>

            {/* Services Delivered Section */}
            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e9ecef",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  color: "#3e2723",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Package size={20} />
                Services & Deliverables
              </h3>
              <p style={{ fontSize: "16px", color: "#333", lineHeight: "1.6", margin: 0 }}>
                {selectedDeal.servicesDelivered}
              </p>
            </div>

            {/* Key Metrics Summary */}
            <div
              style={{
                backgroundColor: "#e8f5e9",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #4caf50",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  color: "#2e7d32",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <BarChart3 size={20} />
                Contract Performance Summary
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: getRatingColor(rating), // ✅ use averageRating, not selectedDeal.performanceRating
                    }}
                  >
                    <span>{rating > 0 ? `${rating}/5` : "0/5"}</span>
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Performance Rating</div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#2196f3" }}>
                    {formatCurrency(selectedDeal.dealAmount)}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Contract Value</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: getBbbeeColor(selectedDeal.bbbeeLevel) }}>
                    {selectedDeal.bbbeeLevel}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>BBBEE Level</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{ fontSize: "24px", fontWeight: "700", color: getStatusColor(selectedDeal.currentStatus) }}
                  >
                    {selectedDeal.currentStatus === "Active Contract" ? "ACTIVE" : "COMPLETED"}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Contract Status</div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedDeal(null)}
                style={{
                  backgroundColor: "#5d4037",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "16px 32px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ReviewsModal
        supplier={selectedSupplier}
        isOpen={reviewsModalOpen}
        onClose={() => {
          setReviewsModalOpen(false)
          setSelectedSupplier(null)
        }}
        onSubmitReview={handleSubmitReview}
      />
    </div>
  )
}

// Main Tabbed Component for Suppliers
const SupplierTabbedTables = ({ onSupplierContacted, onSuppliersUpdate }) => {
  const [activeTab, setActiveTab] = useState("my-matches")
  const [allSuppliers, setAllSuppliers] = useState([])
  const [filteredSuppliers, setFilteredSuppliers] = useState([])
  const [acceptedSuppliers, setAcceptedSuppliers] = useState([])

  // Function to handle supplier updates from the SupplierTable
  const handleSuppliersUpdate = (allSuppliersData, filteredSuppliersData) => {
    setAllSuppliers(allSuppliersData)
    setFilteredSuppliers(filteredSuppliersData)

    // Filter suppliers with "Accepted" status
    const accepted = allSuppliersData.filter(
      (supplier) => supplier.status === "Accepted" || supplier.currentStage === "Accepted",
    )
    setAcceptedSuppliers(accepted)
  }

  const handleSupplierAccepted = (supplierId) => {
    // Find the supplier that was accepted
    const acceptedSupplier = allSuppliers.find((supplier) => supplier.id === supplierId)

    if (acceptedSupplier) {
      // Update the supplier's status to "Accepted"
      const updatedSupplier = {
        ...acceptedSupplier,
        status: "Accepted",
        currentStage: "Accepted",
      }

      // Remove from regular suppliers list
      const updatedAllSuppliers = allSuppliers.filter((supplier) => supplier.id !== supplierId)
      const updatedFilteredSuppliers = filteredSuppliers.filter((supplier) => supplier.id !== supplierId)

      setAllSuppliers(updatedAllSuppliers)
      setFilteredSuppliers(updatedFilteredSuppliers)

      // Add to accepted suppliers list
      setAcceptedSuppliers((prev) => [...prev, updatedSupplier])

      // Notify parent component if needed
      if (onSuppliersUpdate) {
        onSuppliersUpdate(updatedAllSuppliers, updatedFilteredSuppliers)
      }
    }
  }

  const tabStyle = (isActive) => ({
    flex: 1,
    padding: "16px 24px",
    border: "none",
    backgroundColor: isActive ? "#5d4037" : "transparent",
    color: isActive ? "white" : "#5d4037",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    borderRadius: "12px 12px 0 0",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  })

  // Calculate counts for tab badges (you can make these dynamic)
  const myMatchesCount = 18 // You can make this dynamic from props

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0" }}>
      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          marginBottom: "0",
          backgroundColor: "#f5f5f5",
          borderRadius: "12px 12px 0 0",
          padding: "4px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <button onClick={() => setActiveTab("my-matches")} style={tabStyle(activeTab === "my-matches")}>
          My Matches
          <span
            style={{
              backgroundColor: activeTab === "my-matches" ? "rgba(255, 255, 255, 0.2)" : "rgba(93, 64, 55, 0.1)",
              color: activeTab === "my-matches" ? "white" : "#5d4037",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              fontSize: "12px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "4px",
            }}
          >
            {filteredSuppliers.length}
          </span>
        </button>

        <button onClick={() => setActiveTab("successful-deals")} style={tabStyle(activeTab === "successful-deals")}>
          Successful Deals
          <span
            style={{
              backgroundColor: activeTab === "successful-deals" ? "rgba(255, 255, 255, 0.2)" : "rgba(93, 64, 55, 0.1)",
              color: activeTab === "successful-deals" ? "white" : "#5d4037",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              fontSize: "12px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "4px",
            }}
          >
            {acceptedSuppliers.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0 0 16px 16px",
          padding: "24px",
          minHeight: "600px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e8e8e8",
          borderTop: "none",
        }}
      >
        {activeTab === "my-matches" && (
          <SupplierTable
            onSupplierContacted={onSupplierContacted}
            onSuppliersUpdate={handleSuppliersUpdate}
            onSupplierAccepted={handleSupplierAccepted}
          />
        )}

        {activeTab === "successful-deals" && <SuccessfulSupplierDealsTable acceptedSuppliers={acceptedSuppliers} />}
      </div>

      {/* Enhanced styling for tab transitions */}
      <style jsx>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        /* Tab content animation */
        div[style*="backgroundColor: white"] > div {
          animation: fadeIn 0.3s ease-out;
        }
        
        /* Button hover effects */
        button:hover {
          transform: translateY(-1px);
        }
        
        /* Table row hover effects */
        tr:hover {
          transition: all 0.2s ease !important;
        }
        
        /* Input and button focus styles */
        button:focus {
          outline: 2px solid #5d4037;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}

export default SupplierTabbedTables
