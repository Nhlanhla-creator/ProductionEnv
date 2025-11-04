import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Edit, Printer, Check, Star, Shield, TrendingUp, User, Mail, Building, Briefcase, FileText, CheckSquare } from 'lucide-react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react';

const VerificationScoreCard = ({ profileData }) => {
    const [showModal, setShowModal] = useState(false);
    const [verificationScore, setVerificationScore] = useState(0);
    const [scoreBreakdown, setScoreBreakdown] = useState({});
    const [animatedScore, setAnimatedScore] = useState(0);
    const [verificationChecklist, setVerificationChecklist] = useState(null);

    useEffect(() => {
        if (profileData) {
            const { score, breakdown } = calculateVerificationScore(profileData);
            setVerificationScore(score);
            setScoreBreakdown(breakdown);
            setVerificationChecklist(createVerificationChecklist(profileData));
            
            // Animate score
            let start = 0;
            const duration = 1500;
            const step = (timestamp) => {
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / duration, 1);
                setAnimatedScore(Math.floor(progress * score));
                if (progress < 1) {
                    requestAnimationFrame(step);
                }
            };
            requestAnimationFrame(step);
        }
    }, [profileData]);

    const calculateVerificationScore = (profileData) => {
        const checklist = createVerificationChecklist(profileData);

        const breakdown = {
            profileCompletion: { score: 0, max: 40, weight: 0.4 },
            documentation: { score: 0, max: 60, weight: 0.6 }
        };

        // Profile Completion based on essentials
        const essentialCompleted = Object.values(checklist.essentials).filter(Boolean).length;
        const totalEssentials = Object.keys(checklist.essentials).length;
        breakdown.profileCompletion.score = (essentialCompleted / totalEssentials) * breakdown.profileCompletion.max;

        // Documentation based on the 3 specific documents
        const documentsCompleted = Object.values(checklist.documents).filter(Boolean).length;
        const totalDocuments = Object.keys(checklist.documents).length;
        breakdown.documentation.score = (documentsCompleted / totalDocuments) * breakdown.documentation.max;

        // Calculate total score
        const totalScore = Object.values(breakdown).reduce(
            (sum, category) => sum + (category.score / category.max * category.weight * 100), 0
        );

        return {
            score: Math.round(totalScore),
            breakdown: breakdown
        };
    };

    const createVerificationChecklist = (data) => {
        // Get document upload data - handle both direct and nested structures
        const documentUpload = data?.documentUpload || data;
        
        return {
            essentials: {
                contactInformation: !!data?.contactDetails?.businessEmail &&
                    !!data?.contactDetails?.primaryContactMobile,
                investmentCriteria: !!data?.fundDetails?.funds?.[0]?.minimumTicket &&
                    !!data?.fundDetails?.funds?.[0]?.maximumTicket,
                fundDetails: !!data?.fundDetails?.funds?.[0]?.fundName &&
                    !!data?.fundDetails?.funds?.[0]?.fundSize
            },
            documents: {
                registrationDocs: !!documentUpload?.registrationDocs?.length,
                idOffund: !!documentUpload?.idOffund?.length,
                fundMandate: !!documentUpload?.fundMandate?.length
            }
        };
    };

    const getTierInfo = (score) => {
        const isVerified = score >= 60;

        if (score >= 80) return {
            status: "Verified",
            badge: "🟢",
            tier: "Tier 1",
            description: "Fully Verified - Complete Profile",
            color: 'linear-gradient(135deg, #4CAF50, #2E7D32)'
        };
        if (score >= 60) return {
            status: "Verified",
            badge: "🔵",
            tier: "Tier 2",
            description: "Mostly Complete - Good Standing",
            color: 'linear-gradient(135deg, #2196F3, #1565C0)'
        };
        if (score >= 40) return {
            status: "Partially Verified",
            badge: "🟡",
            tier: "Tier 3",
            description: "Partially Complete - Needs More Info",
            color: 'linear-gradient(135deg, #FF9800, #F57C00)'
        };
        if (score >= 20) return {
            status: "Not Verified",
            badge: "🟠",
            tier: "Tier 4",
            description: "Basic Info Provided",
            color: 'linear-gradient(135deg, #FF5722, #D84315)'
        };
        return {
            status: "Not Verified",
            badge: "🔴",
            tier: "Tier 5",
            description: "Minimal Information",
            color: 'linear-gradient(135deg, #F44336, #C62828)'
        };
    };

    const getScoreColor = (score) => {
        const tier = getTierInfo(score).tier;
        if (tier === "Tier 1") return 'linear-gradient(135deg, #4CAF50, #2E7D32)';
        if (tier === "Tier 2") return 'linear-gradient(135deg, #2196F3, #1565C0)';
        if (tier === "Tier 3") return 'linear-gradient(135deg, #FF9800, #F57C00)';
        if (tier === "Tier 4") return 'linear-gradient(135deg, #FF5722, #D84315)';
        return 'linear-gradient(135deg, #F44336, #C62828)';
    };

    const getScoreTextColor = () => '#ffffff';

    const formatRequirementName = (key) => {
        const names = {
            // Essentials
            contactInformation: "Contact Information",
            investmentCriteria: "Investment Criteria",
            fundDetails: "Fund Details",
            
            // Documents
            registrationDocs: "Company Registration",
            idOffund: "Fund Lead ID",
            fundMandate: "Investment Mandate"
        };
        return names[key] || key;
    };

    const getRequirementDescription = (key) => {
        const descriptions = {
            // Essentials
            contactInformation: "Provide business email and mobile number",
            investmentCriteria: "Set minimum and maximum investment amounts",
            fundDetails: "Provide fund name and size information",
            
            // Documents
            registrationDocs: "Upload company registration documents",
            idOffund: "Upload ID documents for fund leadership",
            fundMandate: "Upload investment mandate or program brochure"
        };
        return descriptions[key] || "Complete this requirement";
    };

    const tierInfo = getTierInfo(verificationScore);

    const VerificationModal = () => {
        if (!showModal || !verificationChecklist) return null;

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
                    maxWidth: "600px",
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
                        <Shield size={28} color="#4a352f" />
                        <h3 style={{
                            color: "#4a352f",
                            fontSize: '24px',
                            fontWeight: '700',
                            margin: 0
                        }}>
                            Investor Verification
                        </h3>
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
                            <p style={{
                                margin: '4px 0 0 0',
                                color: '#7d5a50',
                                fontSize: '12px',
                                fontWeight: '500'
                            }}>
                                Verification Score: {verificationScore}%
                            </p>
                        </div>
                    </div>

                    {/* Verification Checklist */}
                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{
                            color: "#4a352f",
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: '0 0 16px 0'
                        }}>
                            Verification Checklist
                        </h4>

                        <div style={{
                            display: 'grid',
                            gap: '16px',
                            marginBottom: '24px'
                        }}>
                            {/* Essential Requirements */}
                            <div>
                                <h5 style={{
                                    color: "#4a352f",
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    margin: '0 0 12px 0'
                                }}>
                                    Profile Information
                                </h5>
                                <div style={{
                                    display: 'grid',
                                    gap: '8px'
                                }}>
                                    {Object.entries(verificationChecklist.essentials).map(([key, met]) => (
                                        <div key={key} style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '8px',
                                            padding: '12px',
                                            background: met ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                                            borderRadius: '8px',
                                            border: met ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(244, 67, 54, 0.3)'
                                        }}>
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                background: met ? '#4CAF50' : '#F44336',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                flexShrink: 0,
                                                marginTop: '2px'
                                            }}>
                                                {met ? '✓' : '✗'}
                                            </div>
                                            <div>
                                                <div style={{
                                                    color: '#4a352f',
                                                    fontWeight: '500',
                                                    marginBottom: '4px'
                                                }}>
                                                    {formatRequirementName(key)}
                                                </div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#7d5a50'
                                                }}>
                                                    {getRequirementDescription(key)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Required Documents */}
                            <div>
                                <h5 style={{
                                    color: "#4a352f",
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    margin: '0 0 12px 0'
                                }}>
                                    Required Documents
                                </h5>
                                <div style={{
                                    display: 'grid',
                                    gap: '8px'
                                }}>
                                    {Object.entries(verificationChecklist.documents).map(([key, met]) => (
                                        <div key={key} style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '8px',
                                            padding: '12px',
                                            background: met ? 'rgba(76, 175, 80, 0.1)' : 'rgba(200, 182, 166, 0.1)',
                                            borderRadius: '8px',
                                            border: met ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(200, 182, 166, 0.3)'
                                        }}>
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                background: met ? '#4CAF50' : '#7d5a50',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                flexShrink: 0,
                                                marginTop: '2px'
                                            }}>
                                                {met ? '✓' : '○'}
                                            </div>
                                            <div>
                                                <div style={{
                                                    color: '#4a352f',
                                                    fontWeight: '500',
                                                    marginBottom: '4px'
                                                }}>
                                                    {formatRequirementName(key)}
                                                </div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#7d5a50'
                                                }}>
                                                    {getRequirementDescription(key)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Verification Info */}
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
                            Verification Tiers
                        </h4>

                        <div style={{
                            display: 'grid',
                            gap: '8px'
                        }}>
                            {[
                                {
                                    min: 80,
                                    badge: "🟢",
                                    name: "Tier 1: Fully Verified",
                                    desc: "Complete profile with all documentation. Highest priority for matching.",
                                    current: verificationScore >= 80
                                },
                                {
                                    min: 60,
                                    badge: "🔵",
                                    name: "Tier 2: Mostly Complete",
                                    desc: "Most required information provided. Good match candidate.",
                                    current: verificationScore >= 60 && verificationScore < 80
                                },
                                {
                                    min: 40,
                                    badge: "🟡",
                                    name: "Tier 3: Partially Verified",
                                    desc: "Basic information available but needs more documentation.",
                                    current: verificationScore >= 40 && verificationScore < 60
                                },
                                {
                                    min: 20,
                                    badge: "🟠",
                                    name: "Tier 4: Basic Information",
                                    desc: "Some essential information provided but significant gaps remain.",
                                    current: verificationScore >= 20 && verificationScore < 40
                                },
                                {
                                    min: 0,
                                    badge: "🔴",
                                    name: "Tier 5: Incomplete",
                                    desc: "Minimal information provided. Limited matching eligibility.",
                                    current: verificationScore < 20
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
                            <Shield size={20} color="#4a352f" />
                            <h3 style={{
                                margin: 0,
                                fontSize: "20px",
                                fontWeight: "600",
                                color: "#4a352f"
                            }}>
                                Investor Verification
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

            <VerificationModal />
        </>
    );
};

export default VerificationScoreCard;