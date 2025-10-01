"use client"

import { useState } from "react"
import { ChevronDown, Star, X } from "lucide-react"
import styles from "./review.module.css"

export function CustomerReviewsCard() {
  const [showReviewsModal, setShowReviewsModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const ratings = [
    {
      name: "Michael Thompson",
      rating: 4,
      date: "Apr 15, 2023",
      comment:
        "Great service and support! The team was very responsive to our needs and provided excellent guidance throughout the entire process.",
      company: "Thompson Enterprises",
      position: "CEO",
    },
    {
      name: "Priya Patel",
      rating: 4,
      date: "Apr 2, 2023",
      comment:
        "Very responsive team. They addressed all our concerns promptly and provided valuable insights for our business growth.",
      company: "Patel Innovations",
      position: "COO",
    },
    {
      name: "James Wilson",
      rating: 5,
      date: "Mar 28, 2023",
      comment:
        "Excellent service from start to finish. The team understood our requirements perfectly and delivered beyond our expectations.",
      company: "Wilson Technologies",
      position: "Director",
    },
  ]

  return (
    <>
      <div className={`ratings-card compact rounded-lg ${showReviewsModal ? "blurred" : ""}`}>
        <div className="ratings-wrapper">
   <  div
  style={{
    padding: '23px',
    borderBottom: '1px solid var(--light-brown)',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center' // vertically center the h3 if needed
  }}
  >
  <h3
    style={{
      fontSize: '15px',
      fontWeight: 600,
      color: '#5d4037',
      margin: 0,
      position: 'relative'
    }}
  >
    SMSES Reviews & Ratings
  </h3>
</div>

          <div className="ratings-summary flex items-center justify-between">
            <div className="ratings-count flex flex-col items-center">
              <span className="text-2xl font-bold">25</span>
              <span className="text-sm">Reviews</span>
            </div>
            <div className="average-rating flex flex-col items-center">
              <div className="stars flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < 4 ? styles.accentBrown : styles.paleBrown}
                  />
                ))}
              </div>
              <span className="text-sm">4.0 Average</span>
            </div>
          </div>

       <div
  style={{
    
    height: "100%", // or a specific height like "300px"
  }}
>
  {/* Other content goes here */}

  <button
    style={{
      marginTop: "57px",
       width: "100%",
         padding: "10px 16px",
           borderRadius: "7px",
      
    }}
    onClick={() => setShowReviewsModal(true)}
  >
    View More
    <ChevronDown style={{ marginLeft: "8px", display: "inline-block" }} size={16} />
  </button>
</div>

        </div>
      </div>

      {showReviewsModal && (
        <div className="reviews-modal-overlay">
          <div className="reviews-popup">
            <div className="reviews-popup-header">
              <h3>Customer Reviews</h3>
              <button
                className="reviews-popup-close"
                onClick={() => setShowReviewsModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="reviews-popup-body">
              <div className="reviews-list">
                {ratings.map((review, index) => (
                  <div key={index} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <h4>{review.name}</h4>
                        <p className="reviewer-company">
                          {review.company} • {review.position}
                        </p>
                        <p className="review-date">{review.date}</p>
                      </div>
                      <div className="review-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < review.rating ? styles.accentBrown : styles.paleBrown}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="review-comment">
                      {review.comment}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedReview && (
        <div className="reviews-modal-overlay">
          <div className="reviews-popup">
            <div className="reviews-popup-header">
              <h3>Review Details</h3>
              <button
                className="reviews-popup-close"
                onClick={() => setShowDetailModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="reviews-popup-body">
              <div className="review-item">
                <div className="review-header">
                  <div className="reviewer-info">
                    <h4>{selectedReview.name}</h4>
                    <p className="reviewer-company">
                      {selectedReview.company} • {selectedReview.position}
                    </p>
                    <p className="review-date">{selectedReview.date}</p>
                  </div>
                  <div className="review-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < selectedReview.rating ? styles.accentBrown : styles.paleBrown}
                      />
                    ))}
                  </div>
                </div>
                <div className="review-comment">
                  {selectedReview.comment}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
