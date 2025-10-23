"use client"
import { useState, useRef, useEffect } from "react"
import { Eye, ChevronDown, Search, X, Trophy, TrendingUp, Calendar, DollarSign, FileText, Users, MapPin, GraduationCap, Briefcase, RefreshCw, BarChart3, Package, Star, MessageSquare, Send, Truck, Award } from "lucide-react"
import ProductServiceApplication from "../../smses/ProductApplication/ProductApplication"
import { SupplierTable } from "./supplier-table"

import { db, auth } from "../../firebaseConfig"
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, arrayUnion, serverTimestamp, addDoc, getDocs } from "firebase/firestore"

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

// Empty table row component for when there are no deals
const EmptyTableRow = () => (
  <tr style={{ borderBottom: "1px solid #E8D5C4" }}>
    <td colSpan="10" style={{ 
      padding: "2rem",
      textAlign: "center", 
      color: "#999",
      fontStyle: "italic",
      borderRight: "none"
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <Trophy size={48} style={{ color: "#ddd" }} />
        <div>
          <p style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#666" }}>
            You have not engaged any suppliers, so there are no successful deals available.
          </p>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#999" }}>
            You need to engage suppliers first to see your successful deals here.
          </p>
        </div>
      </div>
    </td>
  </tr>
)

// Star Rating Component
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
      return "#ffd700"
    }
    return "#e0e0e0"
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

// Reviews Modal Component
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

  const averageRating =
    existingReviews.length > 0
      ? existingReviews.reduce((sum, review) => sum + review.rating, 0) / existingReviews.length
      : 0

  const handleSubmit = async () => {
    if (newRating === 0) {
      alert("Please select a rating before submitting.")
      return
    }

    setIsSubmitting(true)

    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        alert("You must be logged in to submit a review.")
        setIsSubmitting(false)
        return
      }

      const userDocRef = doc(db, "universalProfiles", currentUser.uid)
      const userDocSnap = await getDoc(userDocRef)

      let registeredName = "Anonymous"

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        registeredName =
          userData.entityOverview?.registeredName || userData.registeredName || currentUser.displayName || "Anonymous"
      }

      const customerName = anonymousStatus ? "Anonymous" : registeredName

      await addDoc(collection(db, "supplierReviews"), {
        supplierName: supplier.name,
        rating: newRating,
        comment: newComment,
        date: new Date().toISOString().split("T")[0],
        customerName,
      })

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

        <div
          style={{
            backgroundColor: "#fff3e0",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #ffcc02",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#e65100" }}>Add Your Review</h3>

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
              }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Successful Supplier Deals Table Component
const SuccessfulSupplierDealsTable = ({ acceptedSuppliers }) => {
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState(null)

  const handleViewDetails = (supplier) => {
    setSelectedDeal(supplier)
  }

  const handleSubmitReview = (supplierId, rating, comment) => {
    console.log(`Review submitted for supplier ${supplierId}: ${rating} stars - ${comment}`)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Active Contract":
        return "#4caf50"
      case "Completed Successfully":
        return "#2196f3"
      case "Under Review":
        return "#ff9800"
      default:
        return "#666"
    }
  }

  const formatCurrency = (amount) => {
    if (!amount || amount === "Not specified") return "Not specified"
    const num = parseFloat(amount.toString().replace(/[^0-9.]/g, ""))
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(num)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified"
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (!acceptedSuppliers || acceptedSuppliers.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <Trophy size={48} style={{ color: "#ddd", marginBottom: "1rem" }} />
        <p style={{ fontSize: "1rem", color: "#666" }}>
          You have not engaged any suppliers, so there are no successful deals available.
        </p>
        <p style={{ fontSize: "0.9rem", color: "#999" }}>
          You need to engage suppliers first to see your successful deals here.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "0",
            backgroundColor: "#fff",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 0 0 1px #E8D5C4",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#5d4037" }}>
              <th style={{ padding: "16px", color: "white", textAlign: "left", fontWeight: "600" }}>Supplier Name</th>
              <th style={{ padding: "16px", color: "white", textAlign: "left", fontWeight: "600" }}>Deal Amount</th>
              <th style={{ padding: "16px", color: "white", textAlign: "left", fontWeight: "600" }}>Service Type</th>
              <th style={{ padding: "16px", color: "white", textAlign: "left", fontWeight: "600" }}>Completion Date</th>
              <th style={{ padding: "16px", color: "white", textAlign: "left", fontWeight: "600" }}>Status</th>
              <th style={{ padding: "16px", color: "white", textAlign: "left", fontWeight: "600" }}>Rating</th>
              <th style={{ padding: "16px", color: "white", textAlign: "center", fontWeight: "600" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {acceptedSuppliers.map((supplier, index) => (
              <tr
                key={supplier.id}
                style={{
                  borderBottom: index < acceptedSuppliers.length - 1 ? "1px solid #E8D5C4" : "none",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#faf7f3")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <td style={{ padding: "16px", fontWeight: "500" }}>{supplier.name || "Not specified"}</td>
                <td style={{ padding: "16px" }}>{formatCurrency(supplier.dealAmount || supplier.price)}</td>
                <td style={{ padding: "16px" }}>
                  <TruncatedText text={supplier.services || supplier.serviceType || "Various Services"} />
                </td>
                <td style={{ padding: "16px" }}>{formatDate(supplier.completionDate || supplier.updatedAt)}</td>
                <td style={{ padding: "16px" }}>
                  <span
                    style={{
                      backgroundColor: getStatusColor(supplier.status) + "20",
                      color: getStatusColor(supplier.status),
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {supplier.status || "Active"}
                  </span>
                </td>
                <td style={{ padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <StarRating rating={supplier.rating || 4} readOnly size={18} />
                    <span style={{ fontSize: "14px", color: "#666" }}>
                      {supplier.rating || 4}/5
                    </span>
                  </div>
                </td>
                <td style={{ padding: "16px" }}>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                    <button
                      onClick={() => handleViewDetails(supplier)}
                      style={{
                        backgroundColor: "#5d4037",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        fontSize: "13px",
                        fontWeight: "500",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = "#4a332a")}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = "#5d4037")}
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSupplier(supplier)
                        setReviewsModalOpen(true)
                      }}
                      style={{
                        backgroundColor: "#a67c52",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        fontSize: "13px",
                        fontWeight: "500",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = "#8d6e63")}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = "#a67c52")}
                    >
                      <Star size={14} />
                      Review
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedDeal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedDeal(null)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "800px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "24px", color: "#3e2723" }}>Deal Details</h2>
            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <strong>Supplier Name:</strong> {selectedDeal.name}
              </div>
              <div>
                <strong>Deal Amount:</strong> {formatCurrency(selectedDeal.dealAmount || selectedDeal.price)}
              </div>
              <div>
                <strong>Services:</strong> {selectedDeal.services || selectedDeal.serviceType || "Various Services"}
              </div>
              <div>
                <strong>Status:</strong> {selectedDeal.status || "Active"}
              </div>
              <div>
                <strong>Rating:</strong> {selectedDeal.rating || 4}/5
              </div>
            </div>
            <button
              onClick={() => setSelectedDeal(null)}
              style={{
                marginTop: "24px",
                backgroundColor: "#5d4037",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "12px 24px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
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

// Product Application Wrapper to prevent redirects
const ProductApplicationWrapper = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "400px",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        border: "2px dashed #e0e0e0"
      }}>
        <div style={{ textAlign: "center" }}>
          <RefreshCw size={32} style={{ color: "#999", marginBottom: "16px", animation: "spin 2s linear infinite" }} />
          <p style={{ color: "#666", margin: 0 }}>Loading Product Application...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      width: "100%", 
      border: "2px solid #e0e0e0",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    }}>
      <div style={{ 
        backgroundColor: "#f8f9fa", 
        padding: "16px", 
        borderBottom: "1px solid #e0e0e0",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        <FileText size={20} style={{ color: "#5d4037" }} />
        <h3 style={{ margin: 0, color: "#5d4037", fontSize: "18px" }}>Product & Service Application</h3>
      </div>
      <div style={{ padding: "0" }}>
        <ProductServiceApplication />
      </div>
    </div>
  );
};

// Main Tabbed Component for Suppliers
const SupplierTabbedTables = ({ 
  onSupplierContacted, 
  onSuppliersUpdate, 
  defaultActiveTab = "my-matches"  // Changed default to "my-matches"
}) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab)
  const [allSuppliers, setAllSuppliers] = useState([])
  const [filteredSuppliers, setFilteredSuppliers] = useState([])
  const [acceptedSuppliers, setAcceptedSuppliers] = useState([])

  // Reset active tab when defaultActiveTab prop changes
  useEffect(() => {
    console.log("Default active tab changed to:", defaultActiveTab)
    setActiveTab(defaultActiveTab)
  }, [defaultActiveTab])

  const handleTabChange = (tab) => {
    console.log("Changing tab to:", tab)
    setActiveTab(tab)
  }

  const handleSuppliersUpdate = (allSuppliersData, filteredSuppliersData) => {
    setAllSuppliers(allSuppliersData)
    setFilteredSuppliers(filteredSuppliersData)

    const accepted = allSuppliersData.filter(
      (supplier) => supplier.status === "Accepted" || supplier.currentStage === "Accepted",
    )
    setAcceptedSuppliers(accepted)

    // Pass data back to parent component
    if (onSuppliersUpdate) {
      onSuppliersUpdate(allSuppliersData, filteredSuppliersData)
    }
  }

  const handleSupplierAccepted = (supplierId) => {
    const acceptedSupplier = allSuppliers.find((supplier) => supplier.id === supplierId)

    if (acceptedSupplier) {
      const updatedSupplier = {
        ...acceptedSupplier,
        status: "Accepted",
        currentStage: "Accepted",
      }

      const updatedAllSuppliers = allSuppliers.filter((supplier) => supplier.id !== supplierId)
      const updatedFilteredSuppliers = filteredSuppliers.filter((supplier) => supplier.id !== supplierId)

      setAllSuppliers(updatedAllSuppliers)
      setFilteredSuppliers(updatedFilteredSuppliers)
      setAcceptedSuppliers((prev) => [...prev, updatedSupplier])

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
    minHeight: "56px",
    lineHeight: "1",
  })

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0" }}>
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
        <button
          onClick={() => handleTabChange("application")}
          style={tabStyle(activeTab === "application")}
          onMouseEnter={(e) => {
            if (activeTab !== "application") {
              e.target.style.backgroundColor = "#8d6e63"
              e.target.style.color = "white"
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "application") {
              e.target.style.backgroundColor = "transparent"
              e.target.style.color = "#5d4037"
            }
          }}
        >
          <FileText size={18} style={{ flexShrink: 0, display: "block" }} />
          <span style={{ whiteSpace: "nowrap", lineHeight: "1", display: "block" }}>Product & Service Application</span>
        </button>

        <button
          onClick={() => handleTabChange("my-matches")}
          style={tabStyle(activeTab === "my-matches")}
          onMouseEnter={(e) => {
            if (activeTab !== "my-matches") {
              e.target.style.backgroundColor = "#8d6e63"
              e.target.style.color = "white"
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "my-matches") {
              e.target.style.backgroundColor = "transparent"
              e.target.style.color = "#5d4037"
            }
          }}
        >
          <Users size={18} style={{ flexShrink: 0, display: "block" }} />
          <span style={{ whiteSpace: "nowrap", lineHeight: "1", display: "block" }}>My Matches</span>
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
              flexShrink: 0,
            }}
          >
            {filteredSuppliers.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange("successful-deals")}
          style={tabStyle(activeTab === "successful-deals")}
          onMouseEnter={(e) => {
            if (activeTab !== "successful-deals") {
              e.target.style.backgroundColor = "#8d6e63"
              e.target.style.color = "white"
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "successful-deals") {
              e.target.style.backgroundColor = "transparent"
              e.target.style.color = "#5d4037"
            }
          }}
        >
          <Trophy size={18} style={{ flexShrink: 0, display: "block" }} />
          <span style={{ whiteSpace: "nowrap", lineHeight: "1", display: "block" }}>Successful Deals</span>
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
              flexShrink: 0,
            }}
          >
            {acceptedSuppliers.length}
          </span>
        </button>
      </div>

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
        {activeTab === "application" && (
          <div style={{ 
            width: "100%", 
            display: "flex", 
            justifyContent: "flex-start", 
            alignItems: "flex-start" 
          }}>
            <div style={{ 
              width: "100%", 
              maxWidth: "100%", 
              margin: 0, 
              padding: 0 
            }}>
              <ProductApplicationWrapper />
            </div>
          </div>
        )}

        {activeTab === "my-matches" && (
          <div>
            <SupplierTable
              onSupplierContacted={onSupplierContacted}
              onSuppliersUpdate={handleSuppliersUpdate}
              onSupplierAccepted={handleSupplierAccepted}
            />
          </div>
        )}

        {activeTab === "successful-deals" && <SuccessfulSupplierDealsTable acceptedSuppliers={acceptedSuppliers} />}
      </div>

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
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        div[style*="backgroundColor: white"] > div {
          animation: fadeIn 0.3s ease-out;
        }
        
        button:hover {
          transform: translateY(-1px);
        }
        
        tr:hover {
          transition: all 0.2s ease !important;
        }
        
        button:focus {
          outline: 2px solid #5d4037;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}

export default SupplierTabbedTables