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
        }
    }, [profileData]);

    const calculateVerificationScore = (profileData) => {
        // Initialize breakdown with proper max values and weights
        const breakdown = {
            profileCompletion: { score: 0, max: 30, weight: 0.3 },
            documentation: { score: 0, max: 25, weight: 0.25 },
            fundDetails: { score: 0, max: 20, weight: 0.2 },
            investmentActivity: { score: 0, max: 15, weight: 0.15 },
            compliance: { score: 0, max: 10, weight: 0.1 }
        };

        // 1. Profile Completion (30%)
        if (profileData?.completedSections) {
            const completedCount = Object.values(profileData.completedSections).filter(val => val === true).length;
            const totalSections = Object.keys(profileData.completedSections).length;
            breakdown.profileCompletion.score = (completedCount / totalSections) * breakdown.profileCompletion.max;
        }

        // 2. Documentation (25%)
        let docScore = 0;
        if (profileData?.documentUpload?.registrationDocs) docScore += 10;
        if (profileData?.documentUpload?.fundMandate?.length > 0) docScore += 7;
        if (profileData?.documentUpload?.idOffund?.length > 0) docScore += 5;
        if (profileData?.entityOverview?.companyLogo) docScore += 3;
        breakdown.documentation.score = Math.min(docScore, breakdown.documentation.max);

        // 3. Fund Details (20%)
        let fundScore = 0;
        const fund = profileData?.fundDetails?.funds?.[0];
        if (fund) {
            if (fund.averageDealSize) fundScore += 4;
            if (fund.minimumTicket) fundScore += 4;
            if (fund.maximumTicket) fundScore += 4;
            if (fund.fundSizeCategory) fundScore += 3;
            if (fund.fundStructure) fundScore += 3;
            if (fund.name) fundScore += 2;
        }
        breakdown.fundDetails.score = Math.min(fundScore, breakdown.fundDetails.max);

        // 4. Investment Activity (15%)
        let activityScore = 0;
        const activity = profileData?.fundManageOverview;
        if (activity) {
            if (activity.numberOfInvestments) activityScore += 5;
            if (activity.portfolioCompanies) activityScore += 5;
            if (activity.valueDeployed) activityScore += 3;
            if (activity.yearsInOperation) activityScore += 2;
        }
        breakdown.investmentActivity.score = Math.min(activityScore, breakdown.investmentActivity.max);

        // 5. Compliance (10%)
        let complianceScore = 0;
        if (profileData?.fundManageOverview?.registrationNumber) complianceScore += 3;
        if (profileData?.fundManageOverview?.taxNumber) complianceScore += 3;
        if (profileData?.fundManageOverview?.vatRegistrationNumbers) complianceScore += 2;
        if (profileData?.declarationConsent?.accuracy) complianceScore += 1;
        if (profileData?.declarationConsent?.termsConditions) complianceScore += 1;
        breakdown.compliance.score = Math.min(complianceScore, breakdown.compliance.max);

        // Calculate total score (0-100)
        const totalScore = Object.values(breakdown).reduce(
            (sum, category) => sum + (category.score / category.max * category.weight * 100), 0);

        // Ensure no NaN values in breakdown
        Object.values(breakdown).forEach(category => {
            category.score = isNaN(category.score) ? 0 : Math.round(category.score);
        });

        return {
            score: Math.round(totalScore),
            breakdown: {
                profileCompletion: breakdown.profileCompletion,
                documentation: breakdown.documentation,
                fundDetails: breakdown.fundDetails,
                investmentActivity: breakdown.investmentActivity,
                compliance: breakdown.compliance
            }
        };
    };

    const createVerificationChecklist = (data) => {
        return {
            essentials: {
                legalRegistration: !!data?.documentUpload?.registrationDocs,
                identifiableLeadership: !!data?.documentUpload?.idOffund?.length,
                investmentCriteria: !!data?.fundDetails?.funds?.[0]?.minimumTicket &&
                    !!data?.fundDetails?.funds?.[0]?.maximumTicket,
                contactInformation: !!data?.contactDetails?.businessEmail &&
                    !!data?.contactDetails?.primaryContactMobile
            },
            supporting: {
                fundMandate: !!data?.documentUpload?.fundMandate?.length,
                trackRecord: !!data?.fundManageOverview?.portfolioCompanies,
                complianceDocs: !!data?.fundManageOverview?.registrationNumber &&
                    !!data?.fundManageOverview?.taxNumber,
                completedProfile: Object.values(data?.completedSections || {}).filter(Boolean).length >= 5
            }
        };
    };

    const getTierInfo = (score) => {
        const isVerified = score >= 70; // Verified if score is 70 or higher

        if (score >= 85) return {
            status: "Verified",
            badge: "🟢",
            tier: "Tier 1",
            description: "Fully Verified",
            color: 'linear-gradient(135deg, #4CAF50, #2E7D32)'
        };
        if (score >= 70) return {
            status: "Verified",
            badge: "🔵",
            tier: "Tier 2",
            description: "Mostly Complete",
            color: 'linear-gradient(135deg, #2196F3, #1565C0)'
        };
        if (score >= 50) return {
            status: "Not Verified",
            badge: "🟡",
            tier: "Tier 3",
            description: "Partially Verified",
            color: 'linear-gradient(135deg, #9E9E9E, #616161)'
        };
        return {
            status: "Not Verified",
            badge: "🔴",
            tier: "Tier 4",
            description: "Incomplete",
            color: 'linear-gradient(135deg, #F44336, #C62828)'
        };
    };

    const getScoreColor = (score) => {
        const tier = getTierInfo(score).name;
        if (tier === "Tier 1") return 'linear-gradient(135deg, #4CAF50, #2E7D32)';
        if (tier === "Tier 2") return 'linear-gradient(135deg, #2196F3, #1565C0)';
        if (tier === "Tier 3") return 'linear-gradient(135deg, #9E9E9E, #616161)';
        return 'linear-gradient(135deg, #F44336, #C62828)';
    };

    const getScoreTextColor = () => '#ffffff';

    const formatRequirementName = (key) => {
        const names = {
            legalRegistration: "Legal Registration",
            identifiableLeadership: "Identifiable Leadership",
            investmentCriteria: "Investment Criteria",
            contactInformation: "Contact Information",
            fundMandate: "Fund Mandate",
            trackRecord: "Track Record",
            complianceDocs: "Compliance Docs",
            completedProfile: "Completed Profile"
        };
        return names[key] || key;
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
                    maxWidth: "700px",
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
                            background: getScoreColor(verificationScore),
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
                                    {tierInfo.name}
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
                            gridTemplateColumns: '1fr 1fr',
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
                                    Essential Requirements
                                </h5>
                                <div style={{
                                    display: 'grid',
                                    gap: '8px'
                                }}>
                                    {Object.entries(verificationChecklist.essentials).map(([key, met]) => (
                                        <div key={key} style={{
                                            display: 'flex',
                                            alignItems: 'center',
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
                                                fontWeight: 'bold'
                                            }}>
                                                {met ? '✓' : '✗'}
                                            </div>
                                            <span style={{
                                                color: '#4a352f',
                                                fontWeight: '500'
                                            }}>
                                                {formatRequirementName(key)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Supporting Documentation */}
                            <div>
                                <h5 style={{
                                    color: "#4a352f",
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    margin: '0 0 12px 0'
                                }}>
                                    Supporting Documentation
                                </h5>
                                <div style={{
                                    display: 'grid',
                                    gap: '8px'
                                }}>
                                    {Object.entries(verificationChecklist.supporting).map(([key, met]) => (
                                        <div key={key} style={{
                                            display: 'flex',
                                            alignItems: 'center',
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
                                                fontWeight: 'bold'
                                            }}>
                                                {met ? '✓' : '○'}
                                            </div>
                                            <span style={{
                                                color: '#4a352f',
                                                fontWeight: '500'
                                            }}>
                                                {formatRequirementName(key)}
                                            </span>
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
                                    min: 85,
                                    badge: "🟢",
                                    name: "Tier 1: Fully Verified",
                                    desc: "Complete profile with all documentation. Highest priority for matching.",
                                    current: verificationScore >= 85
                                },
                                {
                                    min: 70,
                                    badge: "🔵",
                                    name: "Tier 2: Mostly Complete",
                                    desc: "Most required information provided. Good match candidate.",
                                    current: verificationScore >= 70 && verificationScore < 85
                                },
                                {
                                    min: 50,
                                    badge: "🟡",
                                    name: "Tier 3: Partially Verified",
                                    desc: "Basic information available but needs more documentation.",
                                    current: verificationScore >= 50 && verificationScore < 70
                                },
                                {
                                    min: 0,
                                    badge: "🔴",
                                    name: "Tier 4: Incomplete",
                                    desc: "Minimal information provided. Limited matching eligibility.",
                                    current: verificationScore < 50
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
                        {tierInfo.status}
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