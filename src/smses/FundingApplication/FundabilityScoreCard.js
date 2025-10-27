import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, TrendingUp, FileText, Presentation, Shield, RefreshCw, AlertCircle } from 'lucide-react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { collection, query, where, getDocs } from "firebase/firestore"
import { useFirebaseFunctions } from '../SMSEDashboard/hooks'

const FundabilityScoreCard = ({ applicationData }) => {
    const [showModal, setShowModal] = useState(false);
    const [fundabilityScore, setFundabilityScore] = useState(0);
    const [scoreBreakdown, setScoreBreakdown] = useState({});
    const [animatedScore, setAnimatedScore] = useState(0);
    const [aiEvaluationResult, setAiEvaluationResult] = useState("")
    const [isEvaluating, setIsEvaluating] = useState(false)
    const [evaluationError, setEvaluationError] = useState("")
    const [businessPlanAnalysis, setBusinessPlanAnalysis] = useState(null)
    const [pitchDeckAnalysis, setPitchDeckAnalysis] = useState(null)
    const [guaranteesAnalysis, setGuaranteesAnalysis] = useState(null)

    const { callFunction, loading, error } = useFirebaseFunctions();

    // Fetch AI evaluations for business plan, pitch deck, and guarantees
    useEffect(() => {
        const fetchAIEvaluations = async () => {
            if (!auth?.currentUser?.uid) return;

            try {
                const userId = auth.currentUser.uid;

                // Fetch Business Plan Evaluation
                const bpQuery = query(collection(db, "aiEvaluations"), where("userId", "==", userId))
                const bpSnapshot = await getDocs(bpQuery)
                if (!bpSnapshot.empty) {
                    const bpData = bpSnapshot.docs[0].data()
                    setBusinessPlanAnalysis({
                        score: bpData?.evaluation?.score || 0,
                        content: bpData?.evaluation?.content || "",
                        timestamp: bpData.timestamp
                    })
                }

                // Fetch Pitch Deck Evaluation
                const pdQuery = query(collection(db, "aiPitchEvaluations"), where("userId", "==", userId))
                const pdSnapshot = await getDocs(pdQuery)
                if (!pdSnapshot.empty) {
                    const pdData = pdSnapshot.docs[0].data()
                    setPitchDeckAnalysis({
                        score: pdData?.evaluation?.score || 0,
                        content: pdData?.evaluation?.content || "",
                        operationalScore: pdData?.evaluation?.operationalScore || 0,
                        timestamp: pdData.timestamp
                    })
                }

                // Fetch Guarantees Analysis from Fundability Evaluation
                const fundabilityQuery = query(collection(db, "aiFundabilityEvaluations"), where("userId", "==", userId))
                const fundabilitySnapshot = await getDocs(fundabilityQuery)
                if (!fundabilitySnapshot.empty) {
                    const fundabilityData = fundabilitySnapshot.docs[0].data()
                    setGuaranteesAnalysis({
                        result: fundabilityData?.result || "",
                        timestamp: fundabilityData.timestamp
                    })
                }

            } catch (error) {
                console.error("Error fetching AI evaluations:", error)
                setEvaluationError("Failed to load AI analysis data")
            }
        }

        fetchAIEvaluations();
    }, [auth?.currentUser?.uid]);

    // Parse guarantees score from AI evaluation
    const parseGuaranteesScore = (aiText) => {
        if (!aiText) return 0;
        
        const guaranteePatterns = [
            /###\s+5\.\s*Guarantees[^*]*\*\*Score:\*\*\s*(\d)/i,
            /\*\*Guarantees\s*:\s*(\d)\*\*/i,
            /Guarantees\s*:\s*(\d)/i,
            /Guarantees[^\\d]*(\\d)\/5/i
        ];
        
        for (const pattern of guaranteePatterns) {
            const match = aiText.match(pattern);
            if (match) {
                const score = parseInt(match[1]);
                return Math.min(Math.max(score, 0), 5);
            }
        }
        return 0;
    };

    // Enhanced scoring with AI data
    const calculateFundabilityScore = (data) => {
        const breakdown = {
            businessPlanAnalysis: { score: 0, max: 35, weight: 0.35, rawScore: 0, maxRaw: 5 },
            pitchDeckScore: { score: 0, max: 30, weight: 0.30, rawScore: 0, maxRaw: 5 },
            guarantees: { score: 0, max: 35, weight: 0.35, rawScore: 0, maxRaw: 5 }
        };

        // Business Plan Analysis (35%) - Using AI evaluation
        let businessPlanScore = 0;
        if (businessPlanAnalysis?.score) {
            // Convert AI score (0-100) to our scale (0-5) then to percentage
            const rawScore = (businessPlanAnalysis.score / 100) * 5;
            businessPlanScore = (rawScore / 5) * 100;
            breakdown.businessPlanAnalysis.rawScore = Math.round(rawScore * 10) / 10;
        } else {
            // Fallback to basic scoring if no AI analysis
            if (data?.enterpriseReadiness?.hasBusinessPlan === "yes") businessPlanScore += 20;
            if (data?.enterpriseReadiness?.hasMvp === "yes") businessPlanScore += 10;
            if (data?.enterpriseReadiness?.hasTraction === "yes") businessPlanScore += 15;
            if (data?.enterpriseReadiness?.hasPayingCustomers === "yes") businessPlanScore += 20;
            if (data?.financialOverview?.generatesRevenue === "yes") businessPlanScore += 15;
            if (data?.enterpriseReadiness?.hasAuditedFinancials === "yes") businessPlanScore += 20;
        }
        breakdown.businessPlanAnalysis.score = Math.min(businessPlanScore, 100);

        // Pitch Deck Score (30%) - Using AI evaluation
        let pitchDeckScore = 0;
        if (pitchDeckAnalysis?.score) {
            // Convert AI score to our scale
            const rawScore = (pitchDeckAnalysis.score / 100) * 5;
            pitchDeckScore = (rawScore / 5) * 100;
            breakdown.pitchDeckScore.rawScore = Math.round(rawScore * 10) / 10;
        } else if (pitchDeckAnalysis?.operationalScore) {
            // Use operational score if available
            const rawScore = pitchDeckAnalysis.operationalScore;
            pitchDeckScore = (rawScore / 5) * 100;
            breakdown.pitchDeckScore.rawScore = rawScore;
        } else {
            // Fallback to basic scoring
            if (data?.enterpriseReadiness?.hasPitchDeck === "yes") pitchDeckScore += 25;
            if (data?.growthPotential?.marketShare === "yes") pitchDeckScore += 15;
            if (data?.growthPotential?.employment === "yes") pitchDeckScore += 20;
            if (data?.socialImpact?.environmentalImpact && data.socialImpact.environmentalImpact !== "None specified") pitchDeckScore += 15;
            if (data?.enterpriseReadiness?.hasMentor === "yes") pitchDeckScore += 10;
            if (data?.enterpriseReadiness?.hasAdvisors === "yes") pitchDeckScore += 15;
        }
        breakdown.pitchDeckScore.score = Math.min(pitchDeckScore, 100);

        // Guarantees (35%) - Using AI evaluation
        let guaranteesScore = 0;
        if (guaranteesAnalysis?.result) {
            const rawScore = parseGuaranteesScore(guaranteesAnalysis.result);
            guaranteesScore = (rawScore / 5) * 100;
            breakdown.guarantees.rawScore = rawScore;
        } else {
            // Fallback to basic scoring
            if (data?.guarantees?.signedCustomerContracts && data.guarantees.signedCustomerContracts !== "Not provided") guaranteesScore += 25;
            if (data?.guarantees?.purchaseOrders && data.guarantees.purchaseOrders !== "Not provided") guaranteesScore += 20;
            if (data?.guarantees?.offtakeAgreements && data.guarantees.offtakeAgreements !== "Not provided") guaranteesScore += 20;
            if (data?.guarantees?.letterOfGuarantee && data.guarantees.letterOfGuarantee !== "Not provided") guaranteesScore += 15;
            if (data?.guarantees?.thirdPartyGuarantees && data.guarantees.thirdPartyGuarantees !== "Not provided") guaranteesScore += 10;
            if (data?.guarantees?.governmentContracts && data.guarantees.governmentContracts !== "Not provided") guaranteesScore += 10;
        }
        breakdown.guarantees.score = Math.min(guaranteesScore, 100);

        // Calculate weighted total score
        const totalScore = Math.round(
            (breakdown.businessPlanAnalysis.score * breakdown.businessPlanAnalysis.weight) +
            (breakdown.pitchDeckScore.score * breakdown.pitchDeckScore.weight) +
            (breakdown.guarantees.score * breakdown.guarantees.weight)
        );

        return {
            score: totalScore,
            breakdown: breakdown
        };
    };

    // Refresh AI evaluations
    const refreshAIEvaluations = async () => {
        if (!auth?.currentUser?.uid) return;

        setIsEvaluating(true);
        setEvaluationError("");

        try {
            // Trigger re-evaluation by updating the trigger flags
            const userDocRef = doc(db, "universalProfiles", auth.currentUser.uid);
            
            await updateDoc(userDocRef, {
                triggerBusinessPlanEvaluation: true,
                triggerPitchDeckEvaluation: true,
                triggerFundabilityEvaluation: true
            });

            // Wait a moment for evaluations to complete
            setTimeout(() => {
                window.location.reload(); // Simple refresh to get new data
            }, 3000);

        } catch (error) {
            console.error("Error triggering re-evaluation:", error);
            setEvaluationError("Failed to refresh evaluations");
            setIsEvaluating(false);
        }
    };

    useEffect(() => {
        if (applicationData || businessPlanAnalysis || pitchDeckAnalysis || guaranteesAnalysis) {
            const { score, breakdown } = calculateFundabilityScore(applicationData);
            setFundabilityScore(score);
            setScoreBreakdown(breakdown);
            
            // Animate score
            let start = 0;
            const duration = 1500;
            const startTime = Date.now();
            
            const animate = () => {
                const now = Date.now();
                const progress = Math.min((now - startTime) / duration, 1);
                const currentScore = Math.floor(progress * score);
                setAnimatedScore(currentScore);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        }
    }, [applicationData, businessPlanAnalysis, pitchDeckAnalysis, guaranteesAnalysis]);

    const getTierInfo = (score) => {
        if (score >= 85) return {
            status: "Excellent",
            badge: "🟢",
            tier: "Tier 1",
            description: "Investment Ready",
            color: 'linear-gradient(135deg, #4CAF50, #2E7D32)'
        };
        if (score >= 70) return {
            status: "Strong",
            badge: "🔵",
            tier: "Tier 2", 
            description: "Well Prepared",
            color: 'linear-gradient(135deg, #2196F3, #1565C0)'
        };
        if (score >= 50) return {
            status: "Developing",
            badge: "🟡",
            tier: "Tier 3",
            description: "Needs Enhancement",
            color: 'linear-gradient(135deg, #FF9800, #F57C00)'
        };
        return {
            status: "Early Stage",
            badge: "🔴",
            tier: "Tier 4",
            description: "Requires Development",
            color: 'linear-gradient(135deg, #F44336, #C62828)'
        };
    };

    const getScoreColor = (score) => {
        const tier = getTierInfo(score);
        return tier.color;
    };

    const getScoreTextColor = () => '#ffffff';

    const formatRequirementName = (key) => {
        const names = {
            businessPlanAnalysis: "Business Plan Analysis",
            pitchDeckScore: "Pitch Deck Score",
            guarantees: "Guarantees & Security"
        };
        return names[key] || key;
    };

    const getAnalysisStatus = (analysis) => {
        if (!analysis) return { text: "No AI analysis", color: "#F44336" };
        if (analysis.score >= 80) return { text: "Excellent", color: "#4CAF50" };
        if (analysis.score >= 60) return { text: "Good", color: "#FF9800" };
        return { text: "Needs Work", color: "#F44336" };
    };

    const tierInfo = getTierInfo(fundabilityScore);

    const FundabilityModal = () => {
        if (!showModal) return null;

        return createPortal(
            <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(74, 53, 47, 0.6)",
                backdropFilter: 'blur(12px)',
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 999999,
                animation: 'fadeIn 0.3s ease-out'
            }}
                onClick={() => setShowModal(false)}>

                <div style={{
                    background: 'linear-gradient(135deg, #faf7f2 0%, #f5f0e1 100%)',
                    borderRadius: "20px",
                    padding: "32px",
                    width: "90%",
                    maxWidth: "800px",
                    maxHeight: "80vh",
                    overflow: "auto",
                    position: "relative",
                    boxShadow: "0 32px 64px rgba(74, 53, 47, 0.2)",
                    border: '1px solid rgba(200, 182, 166, 0.3)',
                    animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    margin: '20px'
                }}
                    onClick={(e) => e.stopPropagation()}>

                    <button
                        onClick={() => setShowModal(false)}
                        style={{
                            position: "absolute",
                            top: "20px",
                            right: "20px",
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
                            border: "none",
                            borderRadius: "50%",
                            fontSize: "20px",
                            cursor: "pointer",
                            color: "#4a352f",
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'linear-gradient(135deg, #c8b6a6, #a67c52)'
                            e.target.style.color = '#faf7f2'
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'linear-gradient(135deg, #e6d7c3, #c8b6a6)'
                            e.target.style.color = '#4a352f'
                        }}
                    >
                        <X size={20} />
                    </button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '24px'
                    }}>
                        <TrendingUp size={28} color="#4a352f" />
                        <h3 style={{
                            color: "#4a352f",
                            fontSize: '24px',
                            fontWeight: '700',
                            margin: 0
                        }}>
                            Fundability Assessment
                        </h3>
                    </div>

                    {/* Refresh Button */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: '20px'
                    }}>
                        <button
                            onClick={refreshAIEvaluations}
                            disabled={isEvaluating}
                            style={{
                                padding: '10px 16px',
                                background: 'linear-gradient(135deg, #5d4037, #4a2c20)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: isEvaluating ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.3s ease',
                                opacity: isEvaluating ? 0.7 : 1
                            }}
                        >
                            {isEvaluating ? (
                                <>
                                    <RefreshCw size={16} className="spin" />
                                    Refreshing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={16} />
                                    Refresh AI Analysis
                                </>
                            )}
                        </button>
                    </div>

                    {/* Score Display */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        marginBottom: '32px',
                        padding: '24px',
                        background: 'linear-gradient(135deg, rgba(240, 230, 217, 0.6), rgba(245, 240, 225, 0.6))',
                        borderRadius: "16px",
                        border: '1px solid rgba(200, 182, 166, 0.2)'
                    }}>
                        <div style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            background: tierInfo.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                            fontWeight: "700",
                            color: getScoreTextColor(),
                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                        }}>
                            {animatedScore}%
                        </div>
                        <div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '8px'
                            }}>
                                <span style={{ fontSize: '20px' }}>{tierInfo.badge}</span>
                                <h4 style={{
                                    margin: 0,
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    color: '#4a352f'
                                }}>
                                    {tierInfo.tier}
                                </h4>
                            </div>
                            <p style={{
                                margin: 0,
                                color: '#7d5a50',
                                fontSize: '14px'
                            }}>
                                {tierInfo.description}
                            </p>
                        </div>
                    </div>

                    {/* AI Analysis Status */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            padding: '16px',
                            background: 'white',
                            borderRadius: '12px',
                            border: `2px solid ${getAnalysisStatus(businessPlanAnalysis).color}20`,
                            textAlign: 'center'
                        }}>
                            <FileText size={24} color={getAnalysisStatus(businessPlanAnalysis).color} />
                            <div style={{ fontWeight: '600', color: '#4a352f', margin: '8px 0 4px 0' }}>
                                Business Plan
                            </div>
                            <div style={{ 
                                fontSize: '12px', 
                                color: getAnalysisStatus(businessPlanAnalysis).color,
                                fontWeight: '600'
                            }}>
                                {getAnalysisStatus(businessPlanAnalysis).text}
                            </div>
                            {businessPlanAnalysis?.rawScore && (
                                <div style={{ fontSize: '11px', color: '#7d5a50', marginTop: '4px' }}>
                                    Score: {businessPlanAnalysis.rawScore}/5
                                </div>
                            )}
                        </div>

                        <div style={{
                            padding: '16px',
                            background: 'white',
                            borderRadius: '12px',
                            border: `2px solid ${getAnalysisStatus(pitchDeckAnalysis).color}20`,
                            textAlign: 'center'
                        }}>
                            <Presentation size={24} color={getAnalysisStatus(pitchDeckAnalysis).color} />
                            <div style={{ fontWeight: '600', color: '#4a352f', margin: '8px 0 4px 0' }}>
                                Pitch Deck
                            </div>
                            <div style={{ 
                                fontSize: '12px', 
                                color: getAnalysisStatus(pitchDeckAnalysis).color,
                                fontWeight: '600'
                            }}>
                                {getAnalysisStatus(pitchDeckAnalysis).text}
                            </div>
                            {pitchDeckAnalysis?.rawScore && (
                                <div style={{ fontSize: '11px', color: '#7d5a50', marginTop: '4px' }}>
                                    Score: {pitchDeckAnalysis.rawScore}/5
                                </div>
                            )}
                        </div>

                        <div style={{
                            padding: '16px',
                            background: 'white',
                            borderRadius: '12px',
                            border: `2px solid ${getAnalysisStatus(guaranteesAnalysis).color}20`,
                            textAlign: 'center'
                        }}>
                            <Shield size={24} color={getAnalysisStatus(guaranteesAnalysis).color} />
                            <div style={{ fontWeight: '600', color: '#4a352f', margin: '8px 0 4px 0' }}>
                                Guarantees
                            </div>
                            <div style={{ 
                                fontSize: '12px', 
                                color: getAnalysisStatus(guaranteesAnalysis).color,
                                fontWeight: '600'
                            }}>
                                {getAnalysisStatus(guaranteesAnalysis).text}
                            </div>
                            {scoreBreakdown.guarantees?.rawScore && (
                                <div style={{ fontSize: '11px', color: '#7d5a50', marginTop: '4px' }}>
                                    Score: {scoreBreakdown.guarantees.rawScore}/5
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Score Breakdown */}
                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{
                            color: "#4a352f",
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: '0 0 16px 0'
                        }}>
                            Score Breakdown
                        </h4>

                        <div style={{
                            display: 'grid',
                            gap: '16px'
                        }}>
                            {Object.entries(scoreBreakdown).map(([key, data]) => (
                                <div key={key} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '16px',
                                    background: 'rgba(250, 247, 242, 0.8)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(200, 182, 166, 0.2)'
                                }}>
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        background: tierInfo.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        {key === 'businessPlanAnalysis' ? <FileText size={12} /> : 
                                         key === 'pitchDeckScore' ? <Presentation size={12} /> : 
                                         <Shield size={12} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <span style={{
                                            color: '#4a352f',
                                            fontWeight: '600',
                                            fontSize: '14px'
                                        }}>
                                            {formatRequirementName(key)}
                                        </span>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#7d5a50',
                                            marginTop: '4px'
                                        }}>
                                            Weight: {Math.round(data.weight * 100)}%
                                            {data.rawScore > 0 && ` • AI Score: ${data.rawScore}/${data.maxRaw}`}
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{
                                            width: '80px',
                                            height: '8px',
                                            background: '#f3e8dc',
                                            borderRadius: '4px',
                                            overflow: 'hidden',
                                            border: '1px solid #d6b88a'
                                        }}>
                                            <div style={{
                                                width: `${data.score}%`,
                                                backgroundColor: data.score >= 80 ? '#4CAF50' : 
                                                              data.score >= 60 ? '#FF9800' : '#F44336',
                                                height: '100%',
                                                borderRadius: '4px',
                                                transition: 'width 0.3s ease'
                                            }}></div>
                                        </div>
                                        <span style={{
                                            fontWeight: '600',
                                            color: '#4a352f',
                                            fontSize: '14px',
                                            minWidth: '35px',
                                            textAlign: 'right'
                                        }}>
                                            {Math.round(data.score)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Error Display */}
                    {evaluationError && (
                        <div style={{
                            padding: '12px',
                            background: '#f8d7da',
                            color: '#721c24',
                            border: '1px solid #f5c6cb',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <AlertCircle size={16} />
                            {evaluationError}
                        </div>
                    )}

                    {/* Tier Information */}
                    <div style={{
                        padding: "16px",
                        background: 'linear-gradient(135deg, rgba(166, 124, 82, 0.1), rgba(125, 90, 80, 0.05))',
                        borderRadius: "12px",
                        border: '1px solid rgba(166, 124, 82, 0.2)'
                    }}>
                        <h4 style={{
                            color: "#4a352f",
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: '0 0 12px 0'
                        }}>
                            Fundability Tiers
                        </h4>

                        <div style={{
                            display: 'grid',
                            gap: '8px'
                        }}>
                            {[
                                {
                                    min: 85,
                                    badge: "🟢",
                                    name: "Tier 1: Investment Ready",
                                    desc: "Excellent fundability with strong business fundamentals and security.",
                                    current: fundabilityScore >= 85
                                },
                                {
                                    min: 70,
                                    badge: "🔵",
                                    name: "Tier 2: Well Prepared",
                                    desc: "Good fundability with solid documentation and some guarantees.",
                                    current: fundabilityScore >= 70 && fundabilityScore < 85
                                },
                                {
                                    min: 50,
                                    badge: "🟡",
                                    name: "Tier 3: Needs Enhancement",
                                    desc: "Developing fundability requiring strengthened business case.",
                                    current: fundabilityScore >= 50 && fundabilityScore < 70
                                },
                                {
                                    min: 0,
                                    badge: "🔴",
                                    name: "Tier 4: Requires Development",
                                    desc: "Early stage requiring significant business plan and security development.",
                                    current: fundabilityScore < 50
                                }
                            ].map((tier, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    gap: '12px',
                                    padding: '12px',
                                    background: tier.current ? 'rgba(255,255,255,0.3)' : 'transparent',
                                    borderRadius: '8px',
                                    border: tier.current ? '1px solid rgba(166, 124, 82, 0.3)' : 'none'
                                }}>
                                    <span style={{
                                        fontSize: '20px',
                                        alignSelf: 'flex-start'
                                    }}>
                                        {tier.badge}
                                    </span>
                                    <div>
                                        <div style={{
                                            fontWeight: '600',
                                            color: '#4a352f',
                                            marginBottom: '4px'
                                        }}>
                                            {tier.name}
                                        </div>
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#7d5a50'
                                        }}>
                                            {tier.desc}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    return (
        <>
            <div style={{
                background: 'linear-gradient(135deg, #faf7f2 0%, #f5f0e1 100%)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(74, 53, 47, 0.1), 0 8px 16px rgba(74, 53, 47, 0.06)',
                border: '1px solid rgba(200, 182, 166, 0.3)',
                position: 'relative',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                maxWidth: '400px'
            }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 32px 64px rgba(74, 53, 47, 0.15), 0 16px 32px rgba(74, 53, 47, 0.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(74, 53, 47, 0.1), 0 8px 16px rgba(74, 53, 47, 0.06)';
                }}
                onClick={() => setShowModal(true)}>

                {/* Background Pattern */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '120px',
                    height: '120px',
                    background: 'radial-gradient(circle, rgba(74, 53, 47, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    transform: 'translate(40px, -40px)'
                }} />

                <div style={{ display: "flex", alignItems: "center", gap: "20px", position: 'relative', zIndex: 2 }}>
                    <div style={{
                        width: "90px",
                        height: "90px",
                        borderRadius: "50%",
                        background: tierInfo.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        fontWeight: "700",
                        color: '#ffffff',
                        boxShadow: '0 8px 32px rgba(74, 53, 47, 0.2)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.2), transparent)',
                            borderRadius: '50%',
                            animation: 'spin 3s linear infinite'
                        }} />
                        {animatedScore}%
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px'
                        }}>
                            <TrendingUp size={20} color="#4a352f" />
                            <h3 style={{
                                margin: 0,
                                fontSize: "20px",
                                fontWeight: "600",
                                color: "#4a352f"
                            }}>
                                Fundability Score
                            </h3>
                        </div>
                        <p style={{
                            margin: "0",
                            fontSize: "14px",
                            color: "#7d5a50",
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span>{tierInfo.badge}</span> {tierInfo.tier}
                        </p>
                        <p style={{
                            margin: "4px 0 0 0",
                            fontSize: "12px",
                            color: "#7d5a50"
                        }}>
                            {tierInfo.description}
                        </p>
                        {/* AI Analysis Status Indicator */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '8px',
                            fontSize: '11px',
                            color: '#7d5a50'
                        }}>
                            <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: 
                                    businessPlanAnalysis && pitchDeckAnalysis && guaranteesAnalysis ? '#4CAF50' :
                                    businessPlanAnalysis || pitchDeckAnalysis || guaranteesAnalysis ? '#FF9800' : '#F44336'
                            }} />
                            {businessPlanAnalysis && pitchDeckAnalysis && guaranteesAnalysis ? 'AI Analysis Complete' :
                             businessPlanAnalysis || pitchDeckAnalysis || guaranteesAnalysis ? 'Partial AI Analysis' : 
                             'AI Analysis Pending'}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    style={{
                        width: '100%',
                        marginTop: '20px',
                        display: "flex",
                        alignItems: "center",
                        justifyContent: 'center',
                        gap: "8px",
                        padding: "12px 20px",
                        background: 'linear-gradient(135deg, #4a352f, #7d5a50)',
                        color: "#faf7f2",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: '0 4px 16px rgba(74, 53, 47, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 24px rgba(74, 53, 47, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 16px rgba(74, 53, 47, 0.3)';
                    }}
                >
                    View Detailed Breakdown
                    <ChevronDown size={16} />
                </button>
            </div>

            <FundabilityModal />

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(32px) scale(0.95);
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
                .spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </>
    );
};

export default FundabilityScoreCard;