"use client"
import { useState, useRef, useEffect } from "react"
import { Eye, ChevronDown, Search, X, Trophy, TrendingUp, Calendar, DollarSign, FileText, Users, MapPin, GraduationCap, Briefcase, RefreshCw, BarChart3, Package, Star, MessageSquare, Send } from "lucide-react"
import AdvisoryApplication from "../../smses/AdvisorApplication/AdvisorApplication"
import { AdvisorTable } from "./advisor-table"
import { db, auth } from "../../firebaseConfig"
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore"

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
            You have not engaged any advisors, so there are no successful deals available.
          </p>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#999" }}>
            You need to engage advisors first to see your successful deals here.
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
      return "#ffd700" // Gold for filled stars
    }
    return "#e0e0e0" // Gray for empty stars
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "2px",
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

// Rating Modal Component
const RatingModal = ({ deal, isOpen, onClose, onSubmitRating }) => {
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (newRating === 0) {
      alert("Please select a rating before submitting.")
      return
    }

    setIsSubmitting(true)

    const ratingData = {
      dealId: deal.id,
      rating: newRating,
      comment: newComment,
      date: new Date().toISOString().split("T")[0],
    }

    await onSubmitRating(ratingData)
    setNewRating(0)
    setNewComment("")
    setIsSubmitting(false)
    onClose()
  }

  if (!isOpen) return null

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
    zIndex: 9999,
    animation: "fadeIn 0.3s ease-out",
    backdropFilter: "blur(4px)",
  }

  const modalContentStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "32px",
    maxWidth: "600px",
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
            Rate {deal.advisorName}
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

        {/* Current Rating Display */}
        {deal.performanceRating && (
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "16px",
              borderRadius: "12px",
              marginBottom: "24px",
              border: "1px solid #e9ecef",
            }}
          >
            <h4 style={{ margin: "0 0 8px 0", color: "#3e2723" }}>Current Rating</h4>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <StarRating rating={deal.performanceRating} readOnly={true} size={20} />
              <span style={{ fontSize: "16px", fontWeight: "600", color: "#666" }}>
                {deal.performanceRating.toFixed(1)}/5
              </span>
            </div>
            {deal.advisorFeedback && (
              <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: "14px" }}>"{deal.advisorFeedback}"</p>
            )}
          </div>
        )}

        {/* New Rating Section */}
        <div style={{ marginBottom: "24px" }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#3e2723" }}>Your Rating</h4>
          <div style={{ marginBottom: "16px" }}>
            <StarRating rating={newRating} onRatingChange={setNewRating} size={32} />
            {newRating > 0 && (
              <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: "14px" }}>
                You selected {newRating} star{newRating !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Comment Section */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "16px",
              fontWeight: "600",
              color: "#3e2723",
            }}
          >
            <MessageSquare size={16} style={{ marginRight: "8px", verticalAlign: "middle" }} />
            Add a Comment (Optional)
          </label>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your experience with this advisor..."
            style={{
              width: "100%",
              minHeight: "100px",
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
          <div
            style={{
              fontSize: "12px",
              color: "#666",
              marginTop: "4px",
              textAlign: "right",
            }}
          >
            {newComment.length}/500 characters
          </div>
        </div>

        {/* Rating History */}
        {deal.ratingHistory && deal.ratingHistory.length > 0 && (
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "16px",
              borderRadius: "12px",
              marginBottom: "24px",
              border: "1px solid #e9ecef",
            }}
          >
            <h4 style={{ margin: "0 0 12px 0", color: "#3e2723" }}>Previous Ratings</h4>
            {deal.ratingHistory.map((rating, index) => (
              <div
                key={index}
                style={{
                  padding: "8px 0",
                  borderBottom: index < deal.ratingHistory.length - 1 ? "1px solid #e0e0e0" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <StarRating rating={rating.rating} readOnly={true} size={16} />
                  <span style={{ fontSize: "12px", color: "#666" }}>{rating.date}</span>
                </div>
                <p style={{ margin: "0", fontSize: "13px", color: "#555" }}>"{rating.comment}"</p>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#f5f5f5",
              color: "#666",
              border: "2px solid #e0e0e0",
              borderRadius: "12px",
              padding: "12px 24px",
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
              borderRadius: "12px",
              padding: "12px 24px",
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
                Submit Rating
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Successful Advisor Deals Table Component
const SuccessfulAdvisorDealsTable = ({ successfulDeals = [] }) => {
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [dealToRate, setDealToRate] = useState(null)
  const [notification, setNotification] = useState(null)

  const getStatusColor = (status) => {
    switch (status) {
      case "Deal Successful":
      case "Active Contract":
        return "#4caf50"
      case "Completed":
        return "#2196f3"
      case "Under Review":
        return "#ff9800"
      default:
        return "#666"
    }
  }

  const getRatingColor = (rating) => {
    // Convert to number if it's a string
    const score = typeof rating === "string" ? Number.parseFloat(rating.split("/")[0]) : rating
    if (score >= 4.5) return "#4caf50"
    if (score >= 4.0) return "#8bc34a"
    if (score >= 3.5) return "#ff9800"
    return "#f44336"
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleViewDetails = (deal) => {
    setSelectedDeal(deal)
  }

  const handleRateDeal = (deal) => {
    setDealToRate(deal)
    setShowRatingModal(true)
  }

  const handleSubmitRating = async (ratingData) => {
    try {
      await updateDoc(doc(db, "SmeAdvisorApplications", ratingData.dealId), {
        performanceRating: ratingData.rating,
        advisorFeedback: ratingData.comment,
        lastRated: serverTimestamp(),
        ratingHistory: arrayUnion({
          rating: ratingData.rating,
          comment: ratingData.comment,
          date: new Date().toISOString(),
        }),
      })

      setNotification({
        type: "success",
        message: "Rating submitted successfully!",
      })

      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error("Error submitting rating:", error)
      setNotification({
        type: "error",
        message: "Failed to submit rating",
      })
      setTimeout(() => setNotification(null), 3000)
    }
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
    zIndex: 9999,
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
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
  }

  return (
    <>
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            padding: "1rem",
            borderRadius: "6px",
            color: "white",
            fontWeight: "500",
            zIndex: 1001,
            background: notification.type === "success" ? "#48BB78" : "#F56565",
          }}
        >
          {notification.message}
        </div>
      )}

      <div style={{ marginBottom: "24px" }}></div>

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
            fontSize: "0.75rem",
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
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "14%",
                }}
              >
                Advisor Name
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "11%",
                }}
              >
                Deal Amount
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "10%",
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
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "10%",
                }}
              >
                Completion Date
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "8%",
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
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "8%",
                }}
              >
                Location
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "7%",
                }}
              >
                Duration
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.5rem 0.3rem",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "10%",
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
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "10%",
                }}
              >
                Current Status
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "none",
                  width: "12%",
                }}
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {successfulDeals.length === 0 ? (
              <EmptyTableRow />
            ) : (
              successfulDeals.map((deal) => (
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
                      verticalAlign: "top",
                      fontSize: "0.75rem",
                      color: "#374151",
                      fontWeight: "400",
                    }}
                  >
                    {deal.advisorName}
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      fontSize: "0.75rem",
                      color: "#374151",
                      fontWeight: "400",
                    }}
                  >
                    {deal.dealAmount}
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      fontSize: "0.75rem",
                      color: "#374151",
                      fontWeight: "400",
                    }}
                  >
                    {deal.dealType}
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      fontSize: "0.75rem",
                      color: "#374151",
                      fontWeight: "400",
                    }}
                  >
                    {formatDate(deal.completionDate)}
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      fontSize: "0.75rem",
                      color: "#374151",
                      fontWeight: "400",
                    }}
                  >
                    <TruncatedText text={deal.sector} maxLength={15} />
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      fontSize: "0.75rem",
                      color: "#374151",
                      fontWeight: "400",
                    }}
                  >
                    <TruncatedText text={deal.location} maxLength={12} />
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      fontSize: "0.75rem",
                      color: "#374151",
                      fontWeight: "400",
                    }}
                  >
                    {deal.dealDuration}
                  </td>

                  <td
                    style={{
                      padding: "0.5rem 0.3rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                      <StarRating rating={Number.parseFloat(deal.performanceRating) || 0} readOnly={true} size={14} />
                      <span
                        style={{
                          color: getRatingColor(Number.parseFloat(deal.performanceRating) || 0),
                          fontWeight: "600",
                          fontSize: "0.75rem",
                        }}
                      >
                        {deal.performanceRating
                          ? typeof deal.performanceRating === "string"
                            ? deal.performanceRating
                            : deal.performanceRating.toFixed(1)
                          : "No rating"}
                      </span>
                    </div>
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
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        display: "inline-block",
                      }}
                    >
                      {deal.currentStatus}
                    </span>
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      verticalAlign: "top",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                      <button
                        onClick={() => handleViewDetails(deal)}
                        style={{
                          backgroundColor: getRatingColor(Number.parseFloat(deal.performanceRating) || 0),
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "6px 8px",
                          fontSize: "0.75rem",
                          fontWeight: "400",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => handleRateDeal(deal)}
                        style={{
                          backgroundColor: "#8d6e63",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          fontSize: "0.75rem",
                          fontWeight: "400",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Star size={12} />
                        Rate
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Rating Modal */}
      <RatingModal
        deal={dealToRate}
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmitRating={handleSubmitRating}
      />

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
                <Trophy size={32} style={{ color: "#ffd700" }} />
                Advisory Details: {selectedDeal.advisorName}
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
                  Advisory Agreement Details
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Contract Value:</strong> {selectedDeal.contractValue}
                  </div>
                  <div>
                    <strong>Deal Type:</strong> {selectedDeal.dealType}
                  </div>
                  <div>
                    <strong>Deal Structure:</strong> {selectedDeal.dealStructure || "Standard Contract"}
                  </div>
                  <div>
                    <strong>Performance Rating:</strong>
                    <span
                      style={{
                        color: getRatingColor(selectedDeal.performanceRating),
                        fontWeight: "700",
                        marginLeft: "8px",
                      }}
                    >
                      {selectedDeal.performanceRating || "Not rated"}
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
                  <Calendar size={20} />
                  Timeline & Status
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Completion Date:</strong> {formatDate(selectedDeal.completionDate)}
                  </div>
                  <div>
                    <strong>Contract Duration:</strong> {selectedDeal.dealDuration}
                  </div>
                  <div>
                    <strong>Next Renewal:</strong> {selectedDeal.nextRenewal || "N/A"}
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
                  <Users size={20} />
                  Advisor Information
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Advisor Type:</strong> {selectedDeal.advisorType || "Advisor"}
                  </div>
                  <div>
                    <strong>Sector:</strong> {selectedDeal.sector}
                  </div>
                  <div>
                    <strong>Location:</strong> {selectedDeal.location}
                  </div>
                  <div>
                    <strong>Engagement Type:</strong> {selectedDeal.engagementType || "Advisor"}
                  </div>
                </div>
              </div>
            </div>

            {/* Advisor Rating Section */}
            {selectedDeal.performanceRating && (
              <div
                style={{
                  backgroundColor: "#fff3e0",
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #ffcc02",
                  marginBottom: "24px",
                }}
              >
                <h3
                  style={{
                    color: "#e65100",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Star size={20} />
                  Advisor Rating & Feedback
                </h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "12px",
                  }}
                >
                  <StarRating rating={selectedDeal.performanceRating} readOnly={true} size={24} />
                  <span
                    style={{
                      fontSize: "20px",
                      fontWeight: "400",
                      color: getRatingColor(selectedDeal.performanceRating),
                    }}
                  >
                    {selectedDeal.performanceRating.toFixed(1)}/5
                  </span>
                </div>
                {selectedDeal.advisorFeedback && (
                  <p
                    style={{
                      fontSize: "16px",
                      color: "#333",
                      lineHeight: "1.6",
                      margin: "0",
                      fontStyle: "italic",
                    }}
                  >
                    "{selectedDeal.advisorFeedback}"
                  </p>
                )}
              </div>
            )}

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
                Advisory Services Delivered
              </h3>
              <p style={{ fontSize: "16px", color: "#333", lineHeight: "1.6", margin: 0 }}>
                {selectedDeal.serviceDelivered}
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
                Advisory Performance Summary
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
                      fontWeight: "400",
                      color: getRatingColor(selectedDeal.performanceRating),
                    }}
                  >
                    {selectedDeal.performanceRating || "N/A"}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Performance Rating</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "400", color: "#2196f3" }}>{selectedDeal.dealAmount}</div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Contract Value</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{ fontSize: "24px", fontWeight: "400", color: getStatusColor(selectedDeal.currentStatus) }}
                  >
                    {selectedDeal.currentStatus === "Active Contract" ? "ACTIVE" : "COMPLETED"}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Contract Status</div>
                </div>
                {selectedDeal.performanceRating && (
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "400",
                        color: getRatingColor(selectedDeal.performanceRating),
                      }}
                    >
                      {selectedDeal.performanceRating.toFixed(1)}/5
                    </div>
                    <div style={{ fontSize: "14px", color: "#666" }}>Advisor Rating</div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
              <button
                onClick={() => handleRateDeal(selectedDeal)}
                style={{
                  backgroundColor: "#8d6e63",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "16px 32px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Star size={20} />
                Rate This Advisor
              </button>
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
    </>
  )
}

// Main Tabbed Component for Advisors
const AdvisorTabbedTables = ({
  filters,
  onConnectionRequested,
  loading,
  onCountChange,
  applications,
  successfulDeals,
}) => {
  const [activeTab, setActiveTab] = useState("application") // Changed default to "application"
  const [myMatchesCount, setMyMatchesCount] = useState(0)
  const [successfulDealsCount, setSuccessfulDealsCount] = useState(0)

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

  useEffect(() => {
    // Update counts based on props
    setMyMatchesCount(applications?.length || 0)
    setSuccessfulDealsCount(successfulDeals?.length || 0)
  }, [applications, successfulDeals])

  const handleCountChangeWrapper = (count) => {
    setMyMatchesCount(count)
    if (onCountChange) {
      onCountChange(count)
    }
  }

  const handleConnectionRequestedWrapper = () => {
    if (onConnectionRequested) {
      onConnectionRequested()
    }
  }

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
        {/* Advisory Application Tab - FIRST */}
        <button
          onClick={() => setActiveTab("application")}
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
          <FileText size={18} />
          Advisory Application
        </button>

        {/* My Matches Tab - SECOND */}
        <button
          onClick={() => setActiveTab("my-matches")}
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
          <Users size={18} />
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
            {myMatchesCount}
          </span>
        </button>

        {/* Successful Deals Tab - THIRD */}
        <button
          onClick={() => setActiveTab("successful-deals")}
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
          <Trophy size={18} />
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
            {successfulDealsCount}
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
        {/* Advisory Application Content - FIRST */}
        {activeTab === "application" && (
          <div>
            <AdvisoryApplication />
          </div>
        )}

        {/* My Matches Content - SECOND */}
        {activeTab === "my-matches" && (
          <div>
            <AdvisorTable
              filters={filters}
              onConnectionRequested={handleConnectionRequestedWrapper}
              onCountChange={handleCountChangeWrapper}
              loading={loading}
            />
          </div>
        )}

        {/* Successful Deals Content - THIRD */}
        {activeTab === "successful-deals" && <SuccessfulAdvisorDealsTable successfulDeals={successfulDeals} />}
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

export default AdvisorTabbedTables