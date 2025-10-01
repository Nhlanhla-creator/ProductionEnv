"use client"

import { useState, useEffect } from "react"
import "./FindMatches.css"
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

const FindMatches = () => {
    const [searchQuery, setSearchQuery] = useState("")
    const [filters, setFilters] = useState({
        location: "",
        minScore: 70,
        minInvestment: "",
        maxInvestment: "",
    })

    const [currentBusiness, setCurrentBusiness] = useState(null)
    const [investors, setInvestors] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedInvestor, setExpandedInvestor] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch current business profile
                const businessDocRef = doc(db, "universalProfiles", "Fhnsk2XxCRUSwRglOM7mOfnEuWE2")
                const businessDocSnap = await getDoc(businessDocRef)

                if (!businessDocSnap.exists()) {
                    throw new Error("Business profile not found")
                }

                const businessData = businessDocSnap.data().entityOverview
                setCurrentBusiness(businessData)

                // 2. Fetch all investors who might match
                const investorsCollectionRef = collection(db, "MyuniversalProfiles")
                const investorsQuery = query(
                    investorsCollectionRef,
                    where("entityOverview.investmentType", "!=", null)
                )

                const investorsSnapshot = await getDocs(investorsQuery)
                const matchedInvestors = []

                for (const doc of investorsSnapshot.docs) {
                    const investorData = doc.data().entityOverview
                    const funds = doc.data().productsServices?.funds || []

                    const matchScore = calculateMatchScore(businessData, { ...investorData, funds })

                    if (matchScore > 0) {
                        matchedInvestors.push({
                            id: doc.id,
                            ...investorData,
                            funds,
                            matchScore,
                            status: matchScore >= 80 ? "High" : matchScore >= 60 ? "Medium" : "Low",
                            minInvestment: investorData.ticketMin ? Number(investorData.ticketMin) : 0,
                            maxInvestment: investorData.ticketMax ? Number(investorData.ticketMax) : 0,
                        })
                    }
                }

                matchedInvestors.sort((a, b) => b.matchScore - a.matchScore)
                setInvestors(matchedInvestors)
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const calculateMatchScore = (business, investor) => {
        let score = 0

        // Economic Sector Match (40%)
        const businessSector = business.economicSector?.toLowerCase()
        if (investor.sectorFocus?.some(s => s.toLowerCase() === businessSector)) {
            score += 40
        } else if (investor.sectors?.some(s => s.toLowerCase() === businessSector)) {
            score += 40
        } else if (investor.funds?.some(fund =>
            fund.sectorFocus?.some(s => s.toLowerCase() === businessSector)
        )) {
            score += 40
        }

        // Location Match (30%)
        const businessLocation = business.location?.toLowerCase()
        if (investor.geographicFocus?.some(l => l.toLowerCase() === businessLocation)) {
            score += 30
        } else if (investor.funds?.some(fund =>
            fund.geographicFocus?.some(l => l.toLowerCase() === businessLocation)
        )) {
            score += 30
        } else if (investor.location?.toLowerCase() === businessLocation) {
            score += 20
        }

        // Operation Stage Match (30%)
        const businessStage = business.operationStage?.toLowerCase()
        if (investor.stages?.some(s => s.toLowerCase() === businessStage)) {
            score += 30
        } else if (investor.funds?.some(fund =>
            fund.stages?.some(s => s.toLowerCase() === businessStage)
        )) {
            score += 30
        }

        return score
    }

    const filteredInvestors = investors.filter(investor => {
        const matchesSearch =
            investor.registeredName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            investor.tradingName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            investor.investmentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            investor.sectorFocus?.join(" ")?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesLocation =
            !filters.location ||
            investor.geographicFocus?.includes(filters.location) ||
            investor.location === filters.location;

        const matchesScore = investor.matchScore >= filters.minScore;

        const matchesInvestmentMin =
            !filters.minInvestment ||
            investor.minInvestment >= Number(filters.minInvestment);

        const matchesInvestmentMax =
            !filters.maxInvestment ||
            investor.maxInvestment <= Number(filters.maxInvestment);

        return matchesSearch && matchesLocation && matchesScore && matchesInvestmentMin && matchesInvestmentMax;
    });

    const toggleInvestorDetails = (investorId) => {
        setExpandedInvestor(expandedInvestor === investorId ? null : investorId)
    }

    return (
        <div className="matches-container">
            <div className="matches-header">
                <h1>Investor Matches</h1>
                {currentBusiness && (
                    <div className="business-profile-card">
                        <h3>Your Business Profile</h3>
                        <div className="profile-details">
                            <p><strong>Name:</strong> {currentBusiness.registeredName || currentBusiness.tradingName || "Not specified"}</p>
                            <p><strong>Sector:</strong> {currentBusiness.economicSector || "Not specified"}</p>
                            <p><strong>Location:</strong> {currentBusiness.location || "Not specified"}</p>
                            <p><strong>Stage:</strong> {currentBusiness.operationStage || "Not specified"}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="search-filters">
                <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Search investors by name, type, or sector..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label>Location:</label>
                    <select
                        value={filters.location}
                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    >
                        <option value="">All Locations</option>
                        <option value="south_africa">South Africa</option>
                        <option value="botswana">Botswana</option>
                        <option value="nairobi">Nairobi</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Min Match: {filters.minScore}%</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.minScore}
                        onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
                    />
                </div>

                <div className="filter-group">
                    <label>Min Investment:</label>
                    <input
                        type="number"
                        placeholder="R Min"
                        value={filters.minInvestment}
                        onChange={(e) => setFilters({ ...filters, minInvestment: e.target.value })}
                    />
                </div>

                <div className="filter-group">
                    <label>Max Investment:</label>
                    <input
                        type="number"
                        placeholder="R Max"
                        value={filters.maxInvestment}
                        onChange={(e) => setFilters({ ...filters, maxInvestment: e.target.value })}
                    />
                </div>
            </div>

            <div className="results-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Finding your best investor matches...</p>
                    </div>
                ) : filteredInvestors.length > 0 ? (
                    <div className="investors-list">
                        {filteredInvestors.map((investor) => (
                            <div key={investor.id} className={`investor-card ${expandedInvestor === investor.id ? "expanded" : ""}`}>
                                <div className="investor-summary" onClick={() => toggleInvestorDetails(investor.id)}>
                                    <div className="investor-name">
                                        <h3>{investor.registeredName || investor.tradingName || "Unnamed Investor"}</h3>
                                        <span className={`match-badge ${investor.status.toLowerCase()}`}>
                                            {investor.matchScore}% Match
                                        </span>
                                    </div>
                                    <div className="investor-meta">
                                        <span><i className="fas fa-tag"></i> {investor.investmentType || "Investor"}</span>
                                        <span><i className="fas fa-map-marker-alt"></i> {investor.geographicFocus?.join(", ") || investor.location || "Various"}</span>
                                        <span><i className="fas fa-money-bill-wave"></i> {
                                            investor.minInvestment && investor.maxInvestment
                                                ? `R${investor.minInvestment.toLocaleString()} - R${investor.maxInvestment.toLocaleString()}`
                                                : "Not specified"
                                        }</span>
                                    </div>
                                    <i className={`fas fa-chevron-${expandedInvestor === investor.id ? "up" : "down"}`}></i>
                                </div>

                                {expandedInvestor === investor.id && (
                                    <div className="investor-details">
                                        <div className="detail-section">
                                            <h4>Focus Areas</h4>
                                            <p>{investor.sectorFocus?.join(", ") || investor.sectors?.join(", ") || "Various sectors"}</p>
                                        </div>

                                        <div className="detail-section">
                                            <h4>Preferred Stages</h4>
                                            <p>{investor.stages?.join(", ") || "All stages"}</p>
                                        </div>

                                        {investor.funds?.length > 0 && (
                                            <div className="detail-section">
                                                <h4>Investment Funds</h4>
                                                <div className="funds-list">
                                                    {investor.funds.map((fund, index) => (
                                                        <div key={index} className="fund-card">
                                                            <h5>{fund.name || `Fund ${index + 1}`}</h5>
                                                            <p><strong>Sectors:</strong> {fund.sectorFocus?.join(", ") || "Various"}</p>
                                                            <p><strong>Locations:</strong> {fund.geographicFocus?.join(", ") || "Various"}</p>
                                                            <p><strong>Stages:</strong> {fund.stages?.join(", ") || "Various"}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="action-buttons">
                                            <button className="connect-btn">
                                                <i className="fas fa-handshake"></i> Connect
                                            </button>
                                            <button className="save-btn">
                                                <i className="fas fa-bookmark"></i> Save
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <i className="fas fa-search"></i>
                        <h3>No matching investors found</h3>
                        <p>
                            {investors.length === 0
                                ? "We couldn't find any investors that match your business profile."
                                : "Try adjusting your search filters to see more matches."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default FindMatches