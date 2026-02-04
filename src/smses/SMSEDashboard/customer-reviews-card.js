"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Star, MessageCircle } from "lucide-react";
import { auth, db } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export function CustomerReviewsCard({ styles }) {
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [username, setUsername] = useState("");

  // Mock existing reviews data
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const unsubscribeAuth = onAuthStateChanged(
          auth,
          async (currentUser) => {
            if (!currentUser) return;

            try {
              // Step 1: Get the logged-in user's profile
              const userDocRef = doc(db, "universalProfiles", currentUser.uid);
              const userDocSnap = await getDoc(userDocRef);

              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                // Fetch the whole registeredName
                const registeredName =
                  userData.entityOverview?.registeredName ||
                  userData.registeredName;

                console.log(registeredName);

                if (registeredName) {
                  // Step 2: Use registeredName to fetch reviews
                  const reviewsCol = collection(db, "supplierReviews");
                  const q = query(
                    reviewsCol,
                    where("supplierName", "==", registeredName)
                  );
                  const reviewsSnapshot = await getDocs(q);

                  const reviewsData = reviewsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                  }));

                  setReviews(reviewsData);
                } else {
                  console.warn("No registeredName found in user profile");
                }
              } else {
                console.warn("User profile not found in universalProfiles");
              }
            } catch (error) {
              console.error("Error fetching user reviews:", error);
            }
          }
        );

        return () => unsubscribeAuth();
      } catch (error) {
        console.error("Error setting up auth listener:", error);
      }
    };

    fetchReviews();
  }, []);

  // Calculate average rating
  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  const roundedAverage = Math.round(averageRating);

  const getAverageLabel = (rating) => {
    if (reviews.length === 0) return { level: "No Reviews", color: "#757575" };
    switch (Math.round(rating)) {
      case 1:
        return { level: "Challenged", color: "#B71C1C" };
      case 2:
        return { level: "Developing", color: "#F44336" };
      case 3:
        return { level: "Fair", color: "#FF9800" };
      case 4:
        return { level: "Commended", color: "#4CAF50" };
      case 5:
        return { level: "Celebrated", color: "#1B5E20" };
      default:
        return { level: "Challenged", color: "#B71C1C" };
    }
  };

  const getReviewLevel = (rating) => {
    if (reviews.length === 0) return { level: "No Reviews", color: "#757575" };
    switch (Math.round(rating)) {
      case 1:
        return { level: "Needs Attention", color: "#B71C1C" };
      case 2:
        return { level: "Emerging Trust", color: "#F44336" };
      case 3:
        return { level: "Fair Experience", color: "#FF9800" };
      case 4:
        return { level: "Great Feedback", color: "#4CAF50" };
      case 5:
        return { level: "Outstanding", color: "#1B5E20" };
      default:
        return { level: "Needs Attention", color: "#B71C1C" };
    }
  };

  const averageLabel = getAverageLabel(averageRating);
  const reviewLevel = getReviewLevel(averageRating);

  return (
    <>
      {/* Card Container */}
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(141, 110, 99, 0.15)",
          border: "1px solid #e8ddd6",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)",
            padding: "24px 30px 20px 30px",
            color: "white",
            position: "relative",
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
            <h2
              style={{
                margin: "0",
                fontSize: "18px",
                fontWeight: "700",
                letterSpacing: "0.5px",
                whiteSpace: "nowrap",
              }}
            >
              Customer Reviews
            </h2>
            <MessageCircle size={24} style={{ opacity: 0.8 }} />
          </div>
          <p
            style={{
              margin: "0",
              fontSize: "13px",
              opacity: 0.9,
              fontWeight: 400,
            }}
          >
            Client Feedback & Ratings
          </p>
        </div>

        {/* Content */}
        <div
          style={{ padding: "24px", background: "white", textAlign: "center" }}
        >
          {/* Summary */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              marginBottom: "24px",
              padding: "16px",
              backgroundColor: "#faf8f6",
              borderRadius: "12px",
              border: "1px solid #f0ede9",
            }}
          >
            {/* Review Count */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: "800",
                  color: "#5d4037",
                  lineHeight: 1,
                }}
              >
                {reviews.length}
              </span>
              <span
                style={{
                  fontSize: "12px",
                  color: "#8d6e63",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginTop: "4px",
                }}
              >
                Reviews
              </span>
            </div>

            {/* Divider */}
            <div
              style={{
                width: "1px",
                height: "40px",
                backgroundColor: "#e8ddd6",
              }}
            />

            {/* Average Rating */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < roundedAverage ? "#FFD700" : "#e8ddd6"}
                    color={i < roundedAverage ? "#FFD700" : "#e8ddd6"}
                    style={{ marginLeft: i > 0 ? "2px" : 0 }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  color: averageLabel.color,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {reviews.length > 0
                  ? `${averageRating.toFixed(1)} ${averageLabel.level}`
                  : averageLabel.level}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: reviewLevel.color,
              color: "white",
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              boxShadow: `0 4px 12px ${reviewLevel.color}40`,
              marginBottom: "15px",
            }}
          >
            <Star size={14} />
            {reviewLevel.level}
          </div>

          {/* Action Button */}
          <button
            onClick={() => setShowReviewsModal(true)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #5d4037 0%, #4a2c20 100%)",
              color: "white",
              marginTop: "25px",
              border: "none",
              fontWeight: "600",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span>Review Breakdown</span>
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Reviews Modal */}
      {showReviewsModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
            padding: "20px",
          }}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              maxHeight: "90vh",
              overflowY: "auto",
              width: "90%",
              maxWidth: "700px",
              border: "1px solid #ccc",
            }}
          >
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #f0e0cc",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, color: "#5a3921" }}>Customer Reviews</h3>
              <button
                onClick={() => setShowReviewsModal(false)}
                style={{
                  background: "#fff",
                  border: "2px solid #ddd",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#666",
                  width: "35px",
                  height: "35px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  fontWeight: "bold",
                }}
              >
                ×
              </button>
            </div>

            {/* List of Reviews */}
            <div style={{ padding: "20px" }}>
              {reviews.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#757575",
                    padding: "40px 20px",
                  }}
                >
                  <MessageCircle
                    size={48}
                    style={{ opacity: 0.3, marginBottom: "16px" }}
                  />
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: "500",
                      marginBottom: "8px",
                    }}
                  >
                    No Reviews Yet
                  </p>
                  <p style={{ fontSize: "14px", opacity: 0.7 }}>
                    Be the first to leave a review for this supplier.
                  </p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      marginBottom: "16px",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #f0e0cc",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onClick={() => {
                      setSelectedReview(review);
                      setShowDetailModal(true);
                    }}
                  >
                    <h4 style={{ margin: 0, color: "#5a3921" }}>
                      {review.customerName}
                    </h4>
                    <p
                      style={{
                        margin: "0 0 4px 0",
                        color: "#8b6d4f",
                        fontSize: "1em",
                      }}
                    >
                      {review.feedbackTheme}
                    </p>
                    <p
                      style={{ margin: 0, color: "#a69b8f", fontSize: "0.8em" }}
                    >
                      {review.date?.seconds
                        ? new Date(
                            review.date.seconds * 1000
                          ).toLocaleDateString()
                        : review.date}
                    </p>
                    <div style={{ display: "flex" }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill={i < review.rating ? "#FFD700" : "#e8ddd6"}
                          color={i < review.rating ? "#FFD700" : "#e8ddd6"}
                        />
                      ))}
                    </div>
                    <div style={{ color: "#5a3921", lineHeight: "1.5" }}>
                      {review.comment}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Individual Review Modal */}
      {showDetailModal && selectedReview && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(90,57,33,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 30px rgba(90,57,33,0.2)",
            }}
          >
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #f0e0cc",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, color: "#5a3921" }}>Review Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: "#fff",
                  border: "2px solid #ddd",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#666",
                  width: "35px",
                  height: "35px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  fontWeight: "bold",
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 6px 0", color: "#5a3921" }}>
                    {selectedReview.name}
                  </h4>
                  <p style={{ margin: 0, color: "#a69b8f", fontSize: "0.8em" }}>
                    {new Date(
                      selectedReview.date.seconds * 1000
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: "flex" }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      fill={i < selectedReview.rating ? "#FFD700" : "#e8ddd6"}
                      color={i < selectedReview.rating ? "#FFD700" : "#e8ddd6"}
                      style={{ marginLeft: "3px" }}
                    />
                  ))}
                </div>
              </div>
              <div
                style={{
                  color: "#5a3921",
                  lineHeight: "1.6",
                  fontSize: "1.05em",
                }}
              >
                {selectedReview.comment}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
