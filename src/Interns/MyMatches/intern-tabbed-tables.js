"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Eye, Check, ChevronDown, ChevronUp, Filter, Search, RefreshCw, X, AlertTriangle, Trophy, TrendingUp, Calendar, DollarSign, Users, BarChart3, Package, GraduationCap, Award, Building, Star, Clock, Briefcase, MessageCircle } from "lucide-react";
import { InternTable } from "./intern-table";
import styles from "./intern.module.css";
import { collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, query, where, orderBy } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

// Text truncation component
const TruncatedText = ({ text, maxLength = 40 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span style={{ color: "#999" }}>{text || "-"}</span>;
  }

  const shouldTruncate = text.length > maxLength;
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`;

  const toggleExpanded = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };


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
  );
};
const SmsRatingModal = ({ internship, isOpen, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRatings, setExistingRatings] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Fetch existing ratings when modal opens
  useEffect(() => {
    const fetchExistingRatings = async () => {
      if (!isOpen || !internship?.sponsorId) return;
      
      setIsLoadingReviews(true);
      try {
        const ratingsRef = collection(db, "InternToSmsesRatings");
        const q = query(
          ratingsRef, 
          where("sponsorId", "==", internship.sponsorId),
          orderBy("ratedAt", "desc")
        );
        
        const ratingsSnapshot = await getDocs(q);
        const ratingsData = ratingsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setExistingRatings(ratingsData);
      } catch (error) {
        console.error("Error fetching SMS ratings:", error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchExistingRatings();
  }, [isOpen, internship]);

  // Calculate average rating
  const averageRating = existingRatings.length > 0
    ? existingRatings.reduce((sum, review) => sum + review.rating, 0) / existingRatings.length
    : 0;

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Please select a rating before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to submit a rating.");
        setIsSubmitting(false);
        return;
      }

      const ratingData = {
        internshipId: internship.id,
        sponsorId: internship.sponsorId,
        sponsorName: internship.sponsorName,
        internId: user.uid,
        internName: internship.applicantName,
        rating: rating,
        comment: comment,
        ratedAt: new Date().toISOString()
      };

      await addDoc(collection(db, "InternToSmsesRatings"), ratingData);

      // Refresh the ratings list
      const ratingsRef = collection(db, "InternToSmsesRatings");
      const q = query(ratingsRef, where("sponsorId", "==", internship.sponsorId));
      const ratingsSnapshot = await getDocs(q);
      const ratingsData = ratingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExistingRatings(ratingsData);

      alert("Rating submitted successfully!");
      setRating(0);
      setComment("");
    } catch (error) {
      console.error("Error saving rating:", error);
      alert("Failed to submit rating. Please try again.");
    }

    setIsSubmitting(false);
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setComment("");
      setShowAllReviews(false);
    }
  }, [isOpen]);

  // Star Rating Component
  const StarRating = ({ rating, onRatingChange, readOnly = false, size = 24 }) => {
    return (
      <div style={{ display: "flex", gap: "4px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => !readOnly && onRatingChange(star)}
            style={{
              background: "none",
              border: "none",
              cursor: readOnly ? "default" : "pointer",
              fontSize: `${size}px`,
              color: star <= rating ? "#d4af37" : "#d7ccc8", // Gold for selected, light brown for unselected
              padding: "0",
              transition: "color 0.2s ease"
            }}
            disabled={readOnly}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen || !internship) return null;

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
  };

  const modalContentStyle = {
    backgroundColor: "#fffef7", // Ivory background
    borderRadius: "20px",
    padding: "32px",
    maxWidth: "600px",
    width: "95%",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5)",
    border: "1px solid #d7ccc8" // Light brown border
  };

  const displayedReviews = showAllReviews ? existingRatings : existingRatings.slice(0, 3);

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "2px solid #8d6e63" // Brown border
        }}>
          <h2 style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#5d4037", // Dark brown text
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <Star size={28} style={{ color: "#d4af37" }} /> {/* Gold star */}
            Rate {internship.sponsorName}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#8d6e63", // Brown color
              padding: "8px"
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Average Rating Display */}
        <div style={{
          backgroundColor: "#f5f1e8", // Light ivory
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "24px",
          border: "1px solid #d7ccc8", // Light brown border
          textAlign: "center",
        }}>
          <h3 style={{ margin: "0 0 12px 0", color: "#5d4037" }}>Overall SMS Rating</h3>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "8px",
          }}>
            <StarRating rating={averageRating} readOnly={true} size={28} />
            <span style={{ fontSize: "24px", fontWeight: "700", color: "#5d4037" }}>
              {averageRating.toFixed(1)}/5
            </span>
          </div>
          <p style={{ margin: "0", color: "#8d6e63", fontSize: "14px" }}>
            Based on {existingRatings.length} rating{existingRatings.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Your Rating Section */}
        <div style={{
          backgroundColor: "#f9f5f0", // Warm ivory
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #a67c52", // Medium brown border
          marginBottom: "24px",
        }}>
          <h3 style={{ margin: "0 0 16px 0", color: "#5d4037" }}>Your Rating</h3>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#5d4037" }}>
              Your Rating (1-5 stars) *
            </label>
            <StarRating rating={rating} onRatingChange={setRating} size={32} />
            {rating > 0 && (
              <p style={{ margin: "8px 0 0 0", color: "#8d6e63", fontSize: "12px" }}>
                You selected {rating} star{rating !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#5d4037"
            }}>
              Your Experience (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "12px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                fontSize: "14px",
                resize: "vertical",
                backgroundColor: "#fffef7"
              }}
              placeholder="Share your experience, what you enjoyed, or any suggestions for improvement..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: "#f5f5f5",
                color: "#5d4037",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              style={{
                backgroundColor: rating === 0 ? "#d7ccc8" : "#8d6e63", // Brown when active
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: rating === 0 ? "not-allowed" : "pointer",
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
                  <Check size={16} />
                  Submit Rating
                </>
              )}
            </button>
          </div>
        </div>

        {/* Existing Reviews Section */}
        {isLoadingReviews ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#8d6e63" }}>
            <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: "10px" }} />
            <p>Loading reviews...</p>
          </div>
        ) : existingRatings.length > 0 ? (
          <div>
            <h3 style={{ margin: "0 0 16px 0", color: "#5d4037" }}>What Other Interns Say</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {displayedReviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    padding: "12px",
                    border: "1px solid #d7ccc8",
                    borderRadius: "6px",
                    backgroundColor: "#f9f5f0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div style={{ fontWeight: "600", color: "#5d4037", fontSize: "14px" }}>{review.internName}</div>
                    <div style={{ fontSize: "11px", color: "#8d6e63" }}>
                      {new Date(review.ratedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ marginBottom: "6px" }}>
                    <StarRating rating={review.rating} readOnly={true} size={16} />
                  </div>
                  {review.comment && (
                    <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#5d4037" }}>"{review.comment}"</p>
                  )}
                </div>
              ))}
            </div>
            
            {existingRatings.length > 3 && (
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#8d6e63",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "8px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                {showAllReviews ? "Show Less" : `Show All Reviews (${existingRatings.length})`}
              </button>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px", color: "#8d6e63" }}>
            <p>No reviews yet. Be the first to rate this SMS!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Successful Internships Table Component
const SuccessfulInternshipsTable = ({ refreshCount }) => {
  const [successfulInternships, setSuccessfulInternships] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postInternshipStatus, setPostInternshipStatus] = useState("");
 const [selectedSmsInternship, setSelectedSmsInternship] = useState(null);
  const [showSmsRatingModal, setShowSmsRatingModal] = useState(false);
  
 useEffect(() => { 
  const fetchSuccessfulInternships = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const applicationsSnapshot = await getDocs(collection(db, "internshipApplications"));
      const successfulApps = [];
      
      for (const docSnap of applicationsSnapshot.docs) {
        const appData = docSnap.data();
        if (
          appData.applicantId === user.uid && 
          (appData.status === "Confirmed" || appData.status === "Successfully Completed" || appData.status === "Completed")
        ) {
          // Get sponsor details
          let sponsorData = {};
          try {
            const sponsorDoc = await getDoc(doc(db, "universalProfiles", appData.sponsorId));
            if (sponsorDoc.exists()) {
              sponsorData = sponsorDoc.data();
            }
          } catch (error) {
            console.error("Error fetching sponsor data:", error);
          }

          // ⭐ FETCH SMS RATINGS: Get average rating for this SMS
          let avgRating = null;
          let reviewCount = 0;
          try {
            if (appData.sponsorId) {
              const smsRatingsRef = collection(db, "InternToSmsesRatings");
              const q = query(smsRatingsRef, where("sponsorId", "==", appData.sponsorId));
              const ratingsSnap = await getDocs(q);

              if (!ratingsSnap.empty) {
                const ratings = ratingsSnap.docs.map(r => r.data().rating || 0);
                reviewCount = ratings.length;
                avgRating = ratings.reduce((sum, r) => sum + r, 0) / reviewCount;
              }
            }
          } catch (error) {
            console.error("Error fetching ratings from InternToSmsesRatings:", error);
          }

          successfulApps.push({
            id: docSnap.id,
            ...appData,
            sponsorData,
            rating: avgRating,
            performanceRating: avgRating ? `${avgRating.toFixed(1)}/5` : "Not Rated",
            reviewsCount: reviewCount,
            absorptionStatus: appData.absorptionStatus || "Not specified"
          });
        }
      }

      setSuccessfulInternships(successfulApps);
    } catch (error) {
      console.error("Error fetching successful internships:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchSuccessfulInternships();
}, [refreshCount]);

  
  // ... rest of your functions remain exactly the same (getStatusColor, getAbsorptionColor, etc.)

  const handleUpdatePostInternshipStatus = async (internship) => {
    try {
      if (!postInternshipStatus) return;
      
      // Update the internship application with the post-internship status
      await updateDoc(doc(db, "internshipApplications", internship.id), {
        absorptionStatus: postInternshipStatus,
        statusUpdatedAt: new Date().toISOString()
      });

      // Update local state
      setSuccessfulInternships(prev => 
        prev.map(item => 
          item.id === internship.id 
            ? {...item, absorptionStatus: postInternshipStatus}
            : item
        )
      );

      setSelectedInternship(null);
      setPostInternshipStatus("");
    } catch (error) {
      console.error("Error updating post-internship status:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Currently Active':
        return '#4caf50';
      case 'Successfully Completed':
        return '#2196f3';
      case 'Confirmed':
        return '#2196f3';
      case 'Completed':
        return '#2196f3';
      case 'Under Review':
        return '#ff9800';
      default:
        return '#666';
    }
  };

  const getAbsorptionColor = (status) => {
    switch (status) {
      case 'Hired Full-time':
        return '#4caf50';
      case 'Contract Extended':
        return '#2196f3';
      case 'Under Review':
        return '#ff9800';
      case 'Not specified':
        return '#666';
      default:
        return '#666';
    }
  };

  const getRatingColor = (ratingStr) => {
    if (!ratingStr || ratingStr === "Not Rated") return '#666';
    const score = parseFloat(ratingStr.split('/')[0]);
    if (score >= 4.5) return '#4caf50';
    if (score >= 4.0) return '#8bc34a';
    if (score >= 3.5) return '#ff9800';
    return '#f44336';
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewDetails = (internship) => {
    setSelectedInternship(internship);
    setPostInternshipStatus(internship.absorptionStatus || "");
  };


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
  };

  const modalContentStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "40px",
    maxWidth: "900px",
    width: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "4rem",
        color: "#5D4037"
      }}>
        <p>Loading successful internships...</p>
      </div>
    );
  }
  return (
    <>
      <div style={{ marginBottom: '24px' }}></div>

      {successfulInternships.length === 0 ? (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "2rem",
          color: "#5D4037",
          flexDirection: "column",
          gap: "1rem"
        }}>
          <Trophy size={48} color="#8D6E63" />
          <p>No successful internships yet. When your matches are confirmed, they will appear here.</p>
        </div>
      ) : (
        <div style={{
          overflowX: "auto",
          borderRadius: "8px",
          border: "1px solid #E8D5C4",
          boxShadow: "0 4px 24px rgba(139, 69, 19, 0.08)",
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            fontSize: "0.875rem",
            backgroundColor: "#FEFCFA",
            tableLayout: "fixed"
          }}>
            <thead>
              <tr>
                <th style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: '12%'
                }}>
                  Company Name
                </th>
                <th style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: '10%'
                }}>
                  Monthly Stipend
                </th>
                <th style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: '9%'
                }}>
                  Location
                </th>
                <th style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: '10%'
                }}>
                  Completion Date
                </th>
                <th style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: '9%'
                }}>
                  Sector
                </th>
                <th style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: '8%'
                }}>
                  Duration
                </th>
                <th style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: '7%'
                }}>
                  Rating
                </th>
                <th style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: '11%'
                }}>
                  Status
                </th>
                <th style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: '10%'
                }}>
                  Post-Internship
                </th>
                <th style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "none",
                  width: '14%'
                }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {successfulInternships.map((internship) => (
                <tr key={internship.id} style={{
                  borderBottom: "1px solid #E8D5C4",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <td style={{
                    padding: "0.75rem 0.5rem",
                    borderRight: "1px solid #E8D5C4",
                    wordWrap: "break-word",
                    whiteSpace: "normal",
                    verticalAlign: "top"
                  }}>
                    <span style={{
                      color: "#a67c52",
                      fontWeight: "500",
                      lineHeight: "1.3"
                    }}>
                      <TruncatedText text={internship.sponsorName} maxLength={30} />
                    </span>
                  </td>
                  
                  <td style={{
                    padding: "0.75rem 0.5rem",
                    borderRight: "1px solid #E8D5C4",
                    verticalAlign: "top",
                    fontWeight: "600",
                    color: "#2196f3"
                  }}>
                    {internship.fundType || "Not specified"}
                  </td>
                  
                  <td style={{
                    padding: "0.75rem 0.5rem",
                    borderRight: "1px solid #E8D5C4",
                    verticalAlign: "top"
                  }}>
                    <span style={{
                      backgroundColor: "#e8f5e9",
                      color: "#2e7d32",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "600"
                    }}>
                      {internship.location}
                    </span>
                  </td>
                  
                  <td style={{
                    padding: "0.75rem 0.5rem",
                    borderRight: "1px solid #E8D5C4",
                    verticalAlign: "top",
                    fontSize: "14px"
                  }}>
                    {formatDate(internship.completionDate)}
                  </td>
                  
                  <td style={{
                    padding: "0.75rem 0.5rem",
                    borderRight: "1px solid #E8D5C4",
                    verticalAlign: "top"
                  }}>
                    <TruncatedText text={internship.sector} maxLength={20} />
                  </td>
                  
                  <td style={{
                    padding: "0.75rem 0.5rem",
                    borderRight: "1px solid #E8D5C4",
                    verticalAlign: "top",
                    fontSize: "14px"
                  }}>
                    {internship.duration || "Not specified"}
                  </td>
                  
                  <td
                      style={{
                        padding: "0.75rem 0.5rem",
                        borderRight: "1px solid #E8D5C4",
                        verticalAlign: "top",
                        textAlign: "center",
                      }}
                    >
                      <span
                        style={{
                          color: getRatingColor(internship.performanceRating),
                          fontWeight: "700",
                          fontSize: "14px",
                          display: "block",
                        }}
                      >
                        {internship.performanceRating}
                      </span>
                      {internship.reviewsCount > 0 && (
                        <span
                          style={{
                            color: "#999",
                            fontSize: "0.7rem",
                          }}
                        >
                          ({internship.reviewsCount} review
                          {internship.reviewsCount > 1 ? "s" : ""})
                        </span>
                      )}
                    </td>

                  
                  <td style={{
                    padding: "0.75rem 0.5rem",
                    borderRight: "1px solid #E8D5C4",
                    verticalAlign: "top"
                  }}>
                    <span style={{
                      backgroundColor: getStatusColor(internship.status) + '20',
                      color: getStatusColor(internship.status),
                      padding: "6px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      display: "inline-block"
                    }}>
                      {internship.status}
                    </span>
                  </td>
                  
                  <td style={{
                    padding: "0.75rem 0.5rem",
                    borderRight: "1px solid #E8D5C4",
                    verticalAlign: "top"
                  }}>
                    <span style={{
                      backgroundColor: getAbsorptionColor(internship.absorptionStatus) + '20',
                      color: getAbsorptionColor(internship.absorptionStatus),
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "600",
                      display: "inline-block"
                    }}>
                      {internship.absorptionStatus}
                    </span>
                  </td>
                  
                  <td style={{
                    padding: "0.75rem 0.5rem",
                    verticalAlign: "top",
                    textAlign: "center"
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button
                        onClick={() => handleViewDetails(internship)}
                        style={{
                          backgroundColor: "#5d4037",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 16px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          margin: "0 auto"
                        }}
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                      <button
                        onClick={() => {
                            setSelectedSmsInternship(internship);
                            setShowSmsRatingModal(true);
                          }}
                        style={{
                          backgroundColor: internship.rating ? "#8d6e63" : "#a67c52", // Brown color for rate button
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 16px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          margin: "0 auto"
                        }}
                      >
                        <Star size={14} />
                       Rate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Internship Details Modal */}
      {selectedInternship && (
        <div style={modalOverlayStyle} onClick={() => setSelectedInternship(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "32px",
              paddingBottom: "24px",
              borderBottom: "3px solid #8d6e63"
            }}>
              <h2 style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#3e2723",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <Briefcase size={32} style={{ color: "#4caf50" }} />
                Internship Experience: {selectedInternship.sponsorName}
              </h2>
              <button
                onClick={() => setSelectedInternship(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                  padding: "8px"
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Internship Overview Cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
              marginBottom: "32px"
            }}>
              <div style={{
                backgroundColor: "#f8f9fa",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e9ecef"
              }}>
                <h3 style={{
                  color: "#3e2723",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <DollarSign size={20} />
                  Financial & Performance Details
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Monthly Stipend:</strong> {selectedInternship.fundType || "Not specified"}
                  </div>
                  <div>
                    <strong>Total Earnings:</strong> {selectedInternship.contractValue || "Not specified"}
                  </div>
                  <div>
                    <strong>Internship Role:</strong> {selectedInternship.role}
                  </div>
                  <div>
                <strong>Performance Rating:</strong> 
                <span
                  style={{
                    color: getRatingColor(selectedInternship.performanceRating),
                    fontWeight: "700",
                    marginLeft: "8px",
                  }}
                >
                  {selectedInternship.performanceRating}
                </span>
                {selectedInternship.reviewsCount > 0 && (
                  <span
                    style={{
                      color: "#999",
                      fontSize: "0.8rem",
                      marginLeft: "6px",
                    }}
                  >
                    ({selectedInternship.reviewsCount} review
                    {selectedInternship.reviewsCount > 1 ? "s" : ""})
                  </span>
                )}  
          </div>

                </div>
              </div>

              <div style={{
                backgroundColor: "#f8f9fa",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e9ecef"
              }}>
                <h3 style={{
                  color: "#3e2723",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <Calendar size={20} />
                  Timeline & Structure
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Start Date:</strong> {formatDate(selectedInternship.startDate)}
                  </div>
                  <div>
                    <strong>Applied Date:</strong> {formatDate(selectedInternship.appliedDate)}
                  </div>
                  <div>
                    <strong>Duration:</strong> {selectedInternship.duration || "Not specified"}
                  </div>
                  <div>
                    <strong>Current Status:</strong>
                    <span style={{
                      backgroundColor: getStatusColor(selectedInternship.status) + "20",
                      color: getStatusColor(selectedInternship.status),
                      padding: "4px 8px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "600",
                      marginLeft: "8px"
                    }}>
                      {selectedInternship.status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: "#f8f9fa",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e9ecef"
              }}>
                <h3 style={{
                  color: "#3e2723",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <Award size={20} />
                  Learning & Development
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Sector:</strong> {selectedInternship.sector}
                  </div>
                  <div>
                    <strong>Location:</strong> {selectedInternship.location}
                  </div>
                  <div>
                    <strong>Funding:</strong> {selectedInternship.funding || "Not specified"}
                  </div>
                  <div>
                    <strong>Post-Internship Outcome:</strong>
                    <span style={{
                      backgroundColor: getAbsorptionColor(selectedInternship.absorptionStatus) + "20",
                      color: getAbsorptionColor(selectedInternship.absorptionStatus),
                      padding: "4px 8px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "600",
                      marginLeft: "8px"
                    }}>
                      {selectedInternship.absorptionStatus || "Not specified"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Post-Internship Status Update Section */}
            <div style={{
              backgroundColor: "#fff3e0",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #ffcc80",
              marginBottom: "24px"
            }}>
              <h3 style={{
                color: "#e65100",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <TrendingUp size={20} />
                Update Post-Internship Status
              </h3>
              <div style={{ display: "grid", gap: "12px" }}>
                <div>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: "#3e2723"
                  }}>
                    Post-Internship Status
                  </label>
                  <select
                    value={postInternshipStatus}
                    onChange={(e) => setPostInternshipStatus(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d7ccc8",
                      borderRadius: "8px",
                      fontSize: "16px",
                      backgroundColor: "white"
                    }}
                  >
                    <option value="">Select status...</option>
                    <option value="Hired Full-time">Hired Full-time</option>
                    <option value="Contract Extended">Contract Extended</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Not Continuing">Not Continuing</option>
                  </select>
                </div>
                <button
                  onClick={() => handleUpdatePostInternshipStatus(selectedInternship)}
                  disabled={!postInternshipStatus}
                  style={{
                    backgroundColor: postInternshipStatus ? "#5d4037" : "#ccc",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: postInternshipStatus ? "pointer" : "not-allowed",
                    transition: "all 0.3s ease"
                  }}
                >
                  Update Status
                </button>
              </div>
            </div>

            {/* Match Analysis Section */}
            {selectedInternship.matchAnalysis && (
              <div style={{
                backgroundColor: "#e8f5e9",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #4caf50",
                marginBottom: "24px"
              }}>
                <h3 style={{
                  color: "#2e7d32",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <BarChart3 size={20} />
                  Match Analysis Summary
                </h3>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px"
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: getRatingColor(`${selectedInternship.matchAnalysis.overallScore}/100`) }}>
                      {selectedInternship.matchAnalysis.overallScore}%
                    </div>
                    <div style={{ fontSize: "14px", color: "#666" }}>Overall Match Score</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#2196f3" }}>
                      {selectedInternship.fundType || "N/A"}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666" }}>Stipend</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: getAbsorptionColor(selectedInternship.absorptionStatus) }}>
                      {selectedInternship.absorptionStatus || "N/A"}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666" }}>Career Outcome</div>
                  </div>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
         <button
              onClick={() => {
                setSelectedSmsInternship(selectedInternship);
                setShowSmsRatingModal(true);
                setSelectedInternship(null); // Close the details modal when opening rating modal
              }}
              style={{
                backgroundColor: "#4caf50", // Green for SMS rating
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <Star size={18} />
              Rate This SMS
            </button>
              <button
                onClick={() => setSelectedInternship(null)}
                style={{
                  backgroundColor: "#5d4037",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      
<SmsRatingModal 
      internship={selectedSmsInternship}
      isOpen={showSmsRatingModal}
      onClose={() => setShowSmsRatingModal(false)}
    />

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
      `}</style>
    </>
  );
};

// Main Tabbed Component for Interns
const InternTabbedTables = ({ filters, stageFilter, loading, matchesCount }) => {
  const [activeTab, setActiveTab] = useState('my-matches');
  const [successfulInternshipsCount, setSuccessfulInternshipsCount] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);

  // Fetch successful internships count
  useEffect(() => {
    const fetchSuccessfulCount = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Get all applications with status "Confirmed" or "Successfully Completed"
        const applicationsSnapshot = await getDocs(collection(db, "internshipApplications"));
        let count = 0;
        
        applicationsSnapshot.forEach((doc) => {
          const appData = doc.data();
          if (appData.applicantId === user.uid && 
              (appData.status === "Confirmed" || appData.status === "Successfully Completed" || appData.status === "Completed")) {
            count++;
          }
        });

        setSuccessfulInternshipsCount(count);
      } catch (error) {
        console.error("Error fetching successful internships count:", error);
      }
    };

    fetchSuccessfulCount();
  }, [refreshCount]);

  const refreshData = () => {
    setRefreshCount(prev => prev + 1);
  };

  const tabStyle = (isActive) => ({
    flex: 1,
    padding: '16px 24px',
    border: 'none',
    backgroundColor: isActive ? '#5d4037' : 'transparent',
    color: isActive ? 'white' : '#5d4037',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderRadius: '12px 12px 0 0',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  });

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0' }}>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        marginBottom: '0',
        backgroundColor: '#f5f5f5',
        borderRadius: '12px 12px 0 0',
        padding: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <button
          onClick={() => setActiveTab('my-matches')}
          style={tabStyle(activeTab === 'my-matches')}
          onMouseEnter={(e) => {
            if (activeTab !== 'my-matches') {
              e.target.style.backgroundColor = '#8d6e63';
              e.target.style.color = 'white';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'my-matches') {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#5d4037';
            }
          }}
        >
          <Users size={18} />
          My Matches
          <span style={{
            backgroundColor: activeTab === 'my-matches' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(93, 64, 55, 0.1)',
            color: activeTab === 'my-matches' ? 'white' : '#5d4037',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '12px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '4px'
          }}>
            {matchesCount || 0}
          </span>
        </button>
        
        <button
          onClick={() => setActiveTab('successful-internships')}
          style={tabStyle(activeTab === 'successful-internships')}
          onMouseEnter={(e) => {
            if (activeTab !== 'successful-internships') {
              e.target.style.backgroundColor = '#8d6e63';
              e.target.style.color = 'white';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'successful-internships') {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#5d4037';
            }
          }}
        >
          <Trophy size={18} />
          My Internship History
          <span style={{
            backgroundColor: activeTab === 'successful-internships' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(93, 64, 55, 0.1)',
            color: activeTab === 'successful-internships' ? 'white' : '#5d4037',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '12px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '4px'
          }}>
            {successfulInternshipsCount}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0 0 16px 16px',
        padding: '24px',
        minHeight: '600px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e8e8e8',
        borderTop: 'none'
      }}>
        {activeTab === 'my-matches' && (
          <div>
            <InternTable 
              filters={filters} 
              stageFilter={stageFilter}
              onRefresh={refreshData}
            />
          </div>
        )}
        
        {activeTab === 'successful-internships' && <SuccessfulInternshipsTable refreshCount={refreshCount} />}
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
  );
};

export default InternTabbedTables;