"use client"
import { useState, useEffect } from "react"
import { Trophy, Users, Star, Eye, X } from "lucide-react"
import AdvisorMatchesTable from "./AdvisorMatchesTable"
import { db, auth } from "../../firebaseConfig"
import { collection, query, where, onSnapshot } from "firebase/firestore"

// Star Rating Component (for successful deals)
const StarRating = ({ rating, readOnly = true, size = 14 }) => {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((starValue) => (
        <Star
          key={starValue}
          size={size}
          style={{
            color: starValue <= (rating || 0) ? "#ffd700" : "#e0e0e0",
            fill: starValue <= (rating || 0) ? "#ffd700" : "none",
          }}
        />
      ))}
    </div>
  )
}

// Successful Advisor Deals Table Component
const SuccessfulAdvisorDealsTable = ({ successfulDeals = [] }) => {
  const [selectedDeal, setSelectedDeal] = useState(null)

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (successfulDeals.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#999" }}>
        <Trophy size={48} style={{ color: "#ddd", margin: "16px auto" }} />
        <p>No successful deals yet.</p>
        <p style={{ fontSize: "14px", marginTop: "8px" }}>When you successfully complete a deal with an advisor, it will appear here.</p>
      </div>
    )
  }

  return (
    <>
      <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #E8D5C4" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white", fontSize: "0.75rem" }}>
          <thead>
            <tr style={{ background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)", color: "#FEFCFA" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>Advisor Name</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Deal Amount</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Completion Date</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Rating</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {successfulDeals.map((deal) => (
              <tr key={deal.id} style={{ borderBottom: "1px solid #E8D5C4" }}>
                <td style={{ padding: "12px" }}>{deal.advisorName}</td>
                <td style={{ padding: "12px" }}>{deal.dealAmount || "N/A"}</td>
                <td style={{ padding: "12px" }}>{formatDate(deal.completionDate)}</td>
                <td style={{ padding: "12px" }}>
                  <span style={{ background: getStatusColor(deal.status) + "20", color: getStatusColor(deal.status), padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "500" }}>
                    {deal.status || "Completed"}
                  </span>
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <StarRating rating={deal.performanceRating || 0} />
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <button 
                    onClick={() => setSelectedDeal(deal)} 
                    style={{ background: "#5d4037", color: "white", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <Eye size={12} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deal Details Modal */}
      {selectedDeal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setSelectedDeal(null)}>
          <div style={{ background: "white", borderRadius: "12px", maxWidth: "500px", width: "90%", padding: "24px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>{selectedDeal.advisorName}</h3>
              <button onClick={() => setSelectedDeal(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: "8px" }}><strong>Deal Amount:</strong> {selectedDeal.dealAmount}</div>
            <div style={{ marginBottom: "8px" }}><strong>Completion Date:</strong> {formatDate(selectedDeal.completionDate)}</div>
            <div style={{ marginBottom: "8px" }}><strong>Status:</strong> {selectedDeal.status}</div>
            {selectedDeal.serviceDelivered && <div style={{ marginBottom: "8px" }}><strong>Services:</strong> {selectedDeal.serviceDelivered}</div>}
            <button onClick={() => setSelectedDeal(null)} style={{ marginTop: "16px", background: "#5d4037", color: "white", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", width: "100%" }}>Close</button>
          </div>
        </div>
      )}
    </>
  )
}

// Main Tabbed Component
const AdvisorTabbedTables = ({ onConnectionRequested }) => {
  const [activeTab, setActiveTab] = useState("my-matches")
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  // Track current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser)
    })
    return () => unsubscribe()
  }, [])

  // Fetch matches from smseAdvisoryMatches
  useEffect(() => {
    if (!user?.uid) {
      setMatches([])
      setLoading(false)
      return
    }

    setLoading(true)
    const q = query(
      collection(db, "smseAdvisoryMatches"),
      where("smeId", "==", user.uid)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setMatches(data)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching advisor matches:", err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.uid])

  const myMatches = matches.filter(m => m.status !== "Deal Successful")
  const successfulMatches = matches.filter(m => m.status === "Deal Successful")

  const tabStyle = (isActive) => ({
    flex: 1,
    padding: "16px 24px",
    border: "none",
    backgroundColor: isActive ? "#5d4037" : "transparent",
    color: isActive ? "white" : "#5d4037",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    borderRadius: "12px 12px 0 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.3s ease",
  })

  const handleConnectionRequestedWrapper = () => {
    if (onConnectionRequested) {
      onConnectionRequested()
    }
  }

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0" }}>
      <div style={{ display: "flex", background: "#f5f5f5", borderRadius: "12px 12px 0 0", padding: "4px" }}>
        <button onClick={() => setActiveTab("my-matches")} style={tabStyle(activeTab === "my-matches")}>
          <Users size={18} />
          Advisors
          <span style={{ background: activeTab === "my-matches" ? "rgba(255,255,255,0.2)" : "rgba(93,64,55,0.1)", borderRadius: "50%", width: "24px", height: "24px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "4px" }}>{myMatches.length}</span>
        </button>
        <button onClick={() => setActiveTab("successful-deals")} style={tabStyle(activeTab === "successful-deals")}>
          <Trophy size={18} />
          Successful Deals
          <span style={{ background: activeTab === "successful-deals" ? "rgba(255,255,255,0.2)" : "rgba(93,64,55,0.1)", borderRadius: "50%", width: "24px", height: "24px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "4px" }}>{successfulMatches.length}</span>
        </button>
      </div>

      <div style={{ background: "white", borderRadius: "0 0 16px 16px", padding: "24px", minHeight: "600px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #e8e8e8", borderTop: "none" }}>
        {activeTab === "my-matches" && (
          <AdvisorMatchesTable 
            advisors={myMatches}
            loading={loading}
            onContact={handleConnectionRequestedWrapper}
            dense={true}
          />
        )}
        {activeTab === "successful-deals" && (
          <SuccessfulAdvisorDealsTable successfulDeals={successfulMatches} />
        )}
      </div>
    </div>
  )
}

export default AdvisorTabbedTables