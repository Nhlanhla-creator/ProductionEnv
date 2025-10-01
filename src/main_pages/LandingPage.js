"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import {
  FaArrowRight,
  FaUsers,
  FaUserTie,
  FaHandHoldingHeart,
  FaChevronRight,
  FaLightbulb,
  FaHandshake,
  FaTimes,
  FaPaperPlane,
  FaCheck,
  FaBullseye,
  FaChartBar,
  FaExclamationTriangle,
  FaDesktop,
  FaClock
} from "react-icons/fa"
import { MdCorporateFare, MdTrendingUp } from "react-icons/md"
import "./LandingPage.css"
import { useNavigate } from "react-router-dom"
import Chatbox from "./Chatbox"

const images = {
  heroBg: "https://www.shutterstock.com/image-photo/group-business-people-outlines-lit-600nw-2145032061.jpg",
  ecosystem:
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  scoreMeter:
    "https://images.unsplash.com/photo-1581093450021-4a7360e9a7e0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  pathway:
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  africaMap:
    "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  testimonial1: "https://randomuser.me/api/portraits/women/44.jpg",
  testimonial2: "https://randomuser.me/api/portraits/men/32.jpg",
  testimonial3: "https://randomuser.me/api/portraits/women/68.jpg",
  bigScore: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  trustImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  collaboration: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
}

const colors = {
  primary: "#754A2D",
  secondary: "#9E6E3C",
  dark: "#372C27",
  light: "#F2F0E6",
  neutral: "#D3D2CE",
  accent: "#BCAE9C",
  scoreBg: "#F8F4EF",
}

// Countdown Timer Component - Made fully responsive
const CountdownTimer = ({ isMobile = false, onCountdownEnd }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Set the target date to October 1, 2025
      const targetDate = new Date('October 1, 2025 00:00:00')
      const now = new Date()
      const difference = targetDate - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        })
      } else {
        // Countdown has ended
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        })
        onCountdownEnd()
      }
    }

    const timer = setInterval(calculateTimeLeft, 1000)
    calculateTimeLeft() // Initial calculation

    return () => clearInterval(timer)
  }, [onCountdownEnd])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      gap: isMobile ? '8px' : '15px', 
      marginTop: '15px',
      flexWrap: 'wrap'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          backgroundColor: colors.primary,
          color: colors.light,
          padding: isMobile ? '6px 8px' : '8px 12px',
          borderRadius: '6px',
          fontWeight: '700',
          fontSize: isMobile ? '1rem' : '1.2rem',
          minWidth: isMobile ? '45px' : '60px'
        }}>
          {timeLeft.days}
        </div>
        <div style={{ 
          fontSize: isMobile ? '0.6rem' : '0.7rem', 
          marginTop: '5px', 
          color: colors.dark 
        }}>
          DAYS
        </div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <div style={{
          backgroundColor: colors.primary,
          color: colors.light,
          padding: isMobile ? '6px 8px' : '8px 12px',
          borderRadius: '6px',
          fontWeight: '700',
          fontSize: isMobile ? '1rem' : '1.2rem',
          minWidth: isMobile ? '45px' : '60px'
        }}>
          {timeLeft.hours}
        </div>
        <div style={{ 
          fontSize: isMobile ? '0.6rem' : '0.7rem', 
          marginTop: '5px', 
          color: colors.dark 
        }}>
          HOURS
        </div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <div style={{
          backgroundColor: colors.primary,
          color: colors.light,
          padding: isMobile ? '6px 8px' : '8px 12px',
          borderRadius: '6px',
          fontWeight: '700',
          fontSize: isMobile ? '1rem' : '1.2rem',
          minWidth: isMobile ? '45px' : '60px'
        }}>
          {timeLeft.minutes}
        </div>
        <div style={{ 
          fontSize: isMobile ? '0.6rem' : '0.7rem', 
          marginTop: '5px', 
          color: colors.dark 
        }}>
          MINUTES
        </div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <div style={{
          backgroundColor: colors.primary,
          color: colors.light,
          padding: isMobile ? '6px 8px' : '8px 12px',
          borderRadius: '6px',
          fontWeight: '700',
          fontSize: isMobile ? '1rem' : '1.2rem',
          minWidth: isMobile ? '45px' : '60px'
        }}>
          {timeLeft.seconds}
        </div>
        <div style={{ 
          fontSize: isMobile ? '0.6rem' : '0.7rem', 
          marginTop: '5px', 
          color: colors.dark 
        }}>
          SECONDS
        </div>
      </div>
    </div>
  )
}

const RegistrationModal = ({ onClose, navigate, isMobile }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: isMobile ? "20px" : "30px",
          maxWidth: isMobile ? "90%" : "600px",
          width: "90%",
          boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            color: colors.dark,
          }}
        >
          ×
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <FaClock size={isMobile ? 24 : 32} color={colors.secondary} style={{ marginRight: "15px" }} />
          <h2
            style={{
              fontSize: isMobile ? "1.2rem" : "1.5rem",
              color: colors.primary,
              margin: 0,
            }}
          >
            Registrations Open October 1, 2025
          </h2>
        </div>

        <div
          style={{
            backgroundColor: `${colors.light}80`,
            padding: "15px",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: isMobile ? "0.85rem" : "0.95rem",
              lineHeight: "1.6",
              color: colors.dark,
            }}
          >
            We're excited that you're interested in joining the BIG Marketplace! Our platform will be open for registrations starting October 1, 2025.
          </p>
        </div>

        <p
          style={{
            fontSize: isMobile ? "0.8rem" : "0.9rem",
            lineHeight: "1.6",
            color: colors.dark,
            marginBottom: "25px",
          }}
        >
          Countdown to registration:
        </p>

        <CountdownTimer isMobile={isMobile} />

        <p
          style={{
            fontSize: isMobile ? "0.8rem" : "0.9rem",
            lineHeight: "1.6",
            color: colors.dark,
            marginBottom: "25px",
            fontStyle: "italic",
          }}
        >
          In the meantime, feel free to explore our demo and learn more about how BIG Marketplace works.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <button
            onClick={onClose}
            style={{
              backgroundColor: "transparent",
              color: colors.dark,
              border: `1px solid ${colors.dark}`,
              padding: "10px 25px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "600",
              transition: "all 0.3s ease",
              width: isMobile ? "100%" : "auto",
            }}
          >
            Close
          </button>
          <Link
            to="/HowItWorks"
            style={{
              backgroundColor: colors.primary,
              color: "white",
              border: "none",
              padding: "10px 25px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "600",
              transition: "all 0.3s ease",
              textDecoration: "none",
              display: "inline-block",
              textAlign: "center",
              width: isMobile ? "100%" : "auto",
            }}
            onClick={onClose}
          >
            View Demo
          </Link>
        </div>
      </div>
    </div>
  )
}

const LandingPage = () => {
  const navigate = useNavigate()

  const [showScroll, setShowScroll] = useState(false)
  const [expandedAbout, setExpandedAbout] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const checkScrollTop = () => {
    if (!showScroll && window.pageYOffset > 400) {
      setShowScroll(true)
    } else if (showScroll && window.pageYOffset <= 400) {
      setShowScroll(false)
    }
  }

  useEffect(() => {
    window.addEventListener("scroll", checkScrollTop)
    return () => window.removeEventListener("scroll", checkScrollTop)
  }, [])

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCountdownEnd = () => {
    setIsRegistrationOpen(true)
  }

  const handleLoginClick = () => {
    if (isRegistrationOpen) {
      navigate("/loginRegister")
    } else {
      setShowRegistrationModal(true)
    }
  }

  const handleGetStartedClick = () => {
    if (isRegistrationOpen) {
      navigate("/loginRegister")
    } else {
      setShowRegistrationModal(true)
    }
  }

  const isMobile = windowWidth <= 768

  // Benefit card data for consistent structure
  const benefitCards = [
    {
      title: "SMSEs",
      icon: <FaUsers size={24} color={colors.primary} />,
      color: colors.primary,
      tagline: "Be Seen. Be Matched. Grow.",
      description: "Get matched with the right funders, service providers, and strategic support — all through one universal profile and your BIG Score.",
      howItWorksLink: "/HowItWorksSMSE",
      tooltip: "SMSEs = Small, Medium and Social Enterprises."
    },
    {
      title: "Investors",
      icon: <FaUserTie size={24} color={colors.secondary}  />,
      color: colors.secondary,
      tagline: "Discover. Verify. Invest.",
      description: "Access verified, investment-ready SMEs with transparent scoring, compliance checks, and predictive insights",
      howItWorksLink: "/HowItWorksInvestors",
      tooltip: "Investors include venture capitalists, angel investors, impact investors, and other funding institutions looking for investment-ready businesses."
    },
    {
      title: "Corporates",
      icon: <MdCorporateFare size={24} color={colors.dark} />,
      color: colors.dark,
      tagline: "Source. Partner. Amplify impact.",
      description: "Accelerate CSI & ESD impact by sourcing verified SMSEs that align with your goals.",
      howItWorksLink: "/HowItWorksCorporates",
      tooltip: "Corporates include large companies looking for suppliers, partners, or investment opportunities through their CSI, ESD or procurement programs."
    },
    {
      title: "Catalysts",
      icon: <FaHandHoldingHeart size={24} color={colors.primary} />,
      color: colors.accent,
      tagline: "Accelerate.Mentor. Fund. Track.",
      description: "Whether you're an incubator, accelerator, or donor — support high-potential SMEs and monitor cohort outcomes via the BIG Score.",
      howItWorksLink: "/HowItWorksCatalysts",
      tooltip: "Support partners include incubators, accelerators, development agencies and other organizations that support SMSE growth."
    },
    {
      title: "Advisors",
      icon: <FaUserTie size={24} color={colors.primary}/>,
      color: "#5A5A5A",
      tagline: "Guide. Mentor. Get Recognized.",
      description: "Connect with businesses that need your expertise and grow your advisory practice.",
      howItWorksLink: "/HowItWorksAdvisors",
      tooltip: "Join as a strategic advisor or board candidate. Get matched to businesses that need your skills — and get recognized."
    },
    {
      title: "Interns",
      icon: <FaUsers size={24} color="#A8A8A8" />, // Silver color
      color: "#A8A8A8", // Light gray
      tagline: "Learn. Grow. Get Experience.",
      description: "Gain valuable experience by working with high-potential SMEs and building your professional network.",
      howItWorksLink: "/HowItWorksInterns",
      tooltip: "Students and recent graduates looking to gain practical experience with African businesses."
    }
  ]

  return (
    <div
      className="landing-page"
      style={{
        backgroundColor: colors.light,
        fontFamily: "'Neue Haas Grotesk Text Pro', sans-serif",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <style>
        {`
          .benefit-card {
            position: relative;
          }
          .benefit-card .tooltip {
            visibility: hidden;
            opacity: 0;
            width: 100%;
            background-color: ${colors.dark};
            color: #fff;
            text-align: center;
            border-radius: 4px;
            padding: 10px;
            position: absolute;
            z-index: 1;
            bottom: 100%;
            left: 0;
            transition: all 0.3s ease;
            font-size: 0.8rem;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
          }
          .benefit-card:hover .tooltip {
            visibility: visible;
            opacity: 1;
          }
        `}
      </style>

      {showRegistrationModal && <RegistrationModal onClose={() => setShowRegistrationModal(false)} navigate={navigate} isMobile={isMobile} />}

      {/* Desktop View Recommendation Notice */}
      {isMobile && (
        <div
          style={{
            backgroundColor: colors.primary,
            color: colors.light,
            padding: "10px 15px",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            position: "sticky",
            top: 0,
            zIndex: 1000,
          }}
        >
          <FaDesktop />
          <span>For the best experience, we recommend viewing this website on a laptop or desktop computer.</span>
        </div>
      )}

      <Header onLoginClick={handleLoginClick} />

      {/* Hero Section */}
      <section
        style={{
          background: `linear-gradient(90deg, ${colors.dark} 0%, rgba(55, 44, 39, 0.7) 50%, rgba(55, 44, 39, 0.15) 100%), url(${images.heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: isMobile ? "30px 15px" : "40px 20px",
          color: colors.light,
          position: "relative",
          minHeight: isMobile ? "60vh" : "55vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            width: "100%",
            position: "relative",
            height: "100%",
          }}
        >
          {/* Updated Registration Notice with Countdown */}
          <div
            style={{
              position: isMobile ? "relative" : "absolute",
              bottom: isMobile ? "10px" : "40px",
              right: isMobile ? "0" : "-130px",
              backgroundColor: isRegistrationOpen ? "rgba(34, 197, 94, 0.2)" : "rgba(223, 34, 34, 0.2)",
              padding: isMobile ? "8px 12px" : "10px 15px",
              borderRadius: "6px",
              maxWidth: isMobile ? "100%" : "350px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              borderLeft: `3px solid ${isRegistrationOpen ? "#22c55e" : "#ff4d4d"}`,
              zIndex: 5,
              marginTop: isMobile ? "20px" : "0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "5px",
              }}
            >
              <FaClock
                style={{
                  color: "white",
                  marginRight: "8px",
                  fontSize: isMobile ? "0.8rem" : "1rem",
                }}
              />
              <span
                style={{
                  color: "white",
                  fontSize: isMobile ? "15px" : "17px",
                  fontWeight: "600",
                }}
              >
                {isRegistrationOpen ? "Registrations Now Open!" : "Registrations Open October 1, 2025"}
              </span>
            </div>
            {!isRegistrationOpen ? (
              <>
                <p
                  style={{
                    margin: "5px 0 0 0",
                    color: "white",
                    fontSize: isMobile ? "0.7rem" : "0.8rem",
                    lineHeight: "1.3",
                  }}
                >
                  Countdown to registration:
                </p>
                <CountdownTimer isMobile={isMobile} onCountdownEnd={handleCountdownEnd} />
              </>
            ) : (
              <p
                style={{
                  margin: "5px 0 0 0",
                  color: "white",
                  fontSize: isMobile ? "0.7rem" : "0.8rem",
                  lineHeight: "1.3",
                }}
              >
                Join BIG Marketplace today and start growing your business!
              </p>
            )}
          </div>

          <div style={{ textAlign: "left" }}>
            <h1
              style={{
                fontSize: isMobile ? "clamp(1.8rem, 8vw, 2.5rem)" : "2.5rem",
                fontWeight: "600",
                lineHeight: "1.2",
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                margin: "0 0 20px 0",
                maxWidth: "100%",
              }}
            >
              Grow Bold. Fund Smart. Scale Fast.
            </h1>

            <p
              style={{
                fontSize: isMobile ? "clamp(1rem, 5vw, 1.3rem)" : "1.5rem",
                margin: "0 0 20px 0",
                opacity: 0.9,
              }}
            >
              Africa's AI-powered platform connecting high-growth businesses to funders, services, and strategic support—through one universal profile and the trusted BIG Score.
            </p>

            <div
              style={{
                display: "flex",
                gap: "15px",
                flexWrap: "wrap",
                marginBottom: "20px",
              }}
            >
              <button
                onClick={handleGetStartedClick}
                style={{
                  backgroundColor: colors.secondary,
                  color: colors.light,
                  padding: isMobile ? "10px 20px" : "12px 30px",
                  borderRadius: "50px",
                  fontWeight: "700",
                  textDecoration: "none",
                  transition: "all 0.3s ease",
                  border: "none",
                  cursor: "pointer",
                  fontSize: isMobile ? "clamp(0.8rem, 3.5vw, 0.9rem)" : "inherit",
                }}
              >
                {isRegistrationOpen ? "Join Now" : "Get Matched Now"}
              </button>
              <Link
                to="/HowItWorks"
                style={{
                  backgroundColor: "transparent",
                  color: colors.light,
                  border: `2px solid ${colors.secondary}`,
                  padding: isMobile ? "10px 20px" : "12px 30px",
                  borderRadius: "50px",
                  fontWeight: "600",
                  textDecoration: "none",
                  transition: "all 0.3s ease",
                  fontSize: isMobile ? "clamp(0.8rem, 3.5vw, 0.9rem)" : "inherit",
                  display: "inline-block",
                }}
              >
                See Demo
              </Link>
            </div>

            <div
              style={{
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  fontSize: isMobile ? "clamp(1.5rem, 6vw, 2rem)" : "2.1rem",
                  fontWeight: "900",
                  lineHeight: "1.2",
                  margin: "0 0 10px 0",
                }}
              >
                <span style={{ color: colors.primary }}>BIG</span> on Ideas.{" "}
                <span style={{ color: colors.primary }}>BIG</span> on Growth.{" "}
                <span style={{ color: colors.primary }}>BIG</span> on Impact.
              </h2>
            </div>

            <p
              style={{
                fontSize: isMobile ? "clamp(0.9rem, 4vw, 1rem)" : "1rem",
                margin: "0",
                fontWeight: "500",
              }}
            >
              Used by investors, funders, and corporates to assess trust and readiness.
            </p>
          </div>
        </div>
      </section>

      {/* Purpose Section - Now with light background (swapped from Who Benefits) */}
      <section
        style={{
          padding: "50px 20px",
          position: "relative",
          backgroundColor: colors.light,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "20px",
            background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
            clipPath: "polygon(0 0, 100% 0, 100% 70%, 0 100%)",
          }}
        ></div>

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? "1.8rem" : "2.2rem",
              fontWeight: "700",
              marginBottom: "40px",
              textAlign: "center",
              color: colors.dark,
              textTransform: "uppercase",
            }}
          >
            OUR PURPOSE: BUILDING AFRICA'S TRUST ECONOMY
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "25px",
              marginBottom: "30px",
            }}
          >
            {/* Vision */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "25px",
                textAlign: "center",
                boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
                borderTop: `4px solid ${colors.primary}`,
              }}
            >
              <div
                style={{
                  backgroundColor: `${colors.primary}20`,
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 15px",
                  border: `2px solid ${colors.primary}`,
                }}
              >
                <FaBullseye size={24} color={colors.primary} />
              </div>
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: "700",
                  marginBottom: "12px",
                  color: colors.dark,
                  textTransform: "uppercase",
                }}
              >
                Our Vision
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                  color: colors.dark,
                }}
              >
                <strong>To corporatise Africa's boldest SMEs.</strong>
              </p>
            </div>

            {/* Mission */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "25px",
                textAlign: "center",
                boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
                borderTop: `4px solid ${colors.secondary}`,
              }}
            >
              <div
                style={{
                  backgroundColor: `${colors.secondary}20`,
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 15px",
                  border: `2px solid ${colors.secondary}`,
                }}
              >
                <FaHandshake size={24} color={colors.secondary} />
              </div>
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: "700",
                  marginBottom: "12px",
                  color: colors.dark,
                  textTransform: "uppercase",
                }}
              >
                Our Mission
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                  color: colors.dark,
                }}
              >
                <strong>To give Africa's boldest businesses the credibility, connections, and capital they need — and a seat at every table that matters.</strong>
              </p>
            </div>

            {/* Promise */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "25px",
                textAlign: "center",
                boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
                borderTop: `4px solid ${colors.accent}`,
              }}
            >
              <div
                style={{
                  backgroundColor: `${colors.accent}20`,
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 15px",
                  border: `2px solid ${colors.accent}`,
                }}
              >
                <FaLightbulb size={24} color={colors.accent} />
              </div>
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: "700",
                  marginBottom: "12px",
                  color: colors.dark,
                  textTransform: "uppercase",
                }}
              >
                Our Promise
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                  color: colors.dark,
                }}
              >
                <strong>To make growth accessible — not accidental — for Africa's most promising enterprises.</strong>
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: isMobile ? "1rem" : "1.1rem",
                fontWeight: "600",
                marginBottom: "25px",
                color: colors.primary,
                textTransform: "uppercase",
              }}
            >
              We're building a continent-wide trust economy. Join us.
            </p>

            <button
              onClick={handleGetStartedClick}
              style={{
                backgroundColor: colors.primary,
                color: colors.light,
                padding: "12px 30px",
                borderRadius: "50px",
                fontWeight: "700",
                textDecoration: "none",
                display: "inline-block",
                transition: "all 0.3s ease",
                textTransform: "uppercase",
                border: "none",
                cursor: "pointer",
              }}
            >
              {isRegistrationOpen ? "Register Now" : "Be BIG. Join the Movement"}
            </button>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "20px",
            background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
            clipPath: "polygon(0 30%, 100% 0, 100% 100%, 0 100%)",
          }}
        ></div>
      </section>

      {/* Who Benefits Section - Now with dark background (swapped from Purpose) */}
      <section
        style={{
          padding: "50px 20px",
          position: "relative",
          background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.primary} 100%), url(${images.africaMap})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: colors.light,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "20px",
            background: `linear-gradient(to right, ${colors.secondary}, ${colors.accent})`,
            clipPath: isMobile ? "none" : "polygon(0 0, 100% 0, 100% 70%, 0 100%)",
          }}
        ></div>

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: isMobile ? "1.8rem" : "2.2rem",
              fontWeight: "700",
              marginBottom: isMobile ? "30px" : "50px",
              color: colors.light,
              textTransform: "uppercase",
            }}
          >
            Who Benefits From <span style={{ color: colors.secondary }}>BIG</span>?
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "15px",
            }}
          >
            {benefitCards.map((card, index) => (
              <div
                key={index}
                className="benefit-card"
                style={{
                  backgroundColor: "rgba(255,255,255,0.9)",
                  borderRadius: "8px",
                  padding: isMobile ? "15px" : "20px",
                  textAlign: "center",
                  boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                  borderTop: `4px solid ${card.color}`,
                  transition: "transform 0.3s ease",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <div className="tooltip">
                  {card.tooltip}
                </div>
                <div
                  style={{
                    backgroundColor: `${card.color}20`,
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 10px",
                    border: `2px solid ${card.color}`,
                  }}
                >
                  {card.icon}
                </div>
                <h3
                  style={{
                    fontSize: isMobile ? "1rem" : "1.1rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                    color: colors.dark,
                    textTransform: "uppercase",
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontSize: isMobile ? "0.8rem" : "0.9rem",
                    fontWeight: "600",
                    color: card.color,
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  {card.tagline}
                </p>
                <p
                  style={{
                    fontSize: isMobile ? "0.7rem" : "0.75rem",
                    color: colors.dark,
                    marginBottom: "12px",
                    flexGrow: 1,
                  }}
                >
                  {card.description}
                </p>
                <div style={{ marginTop: "auto" }}>
                  <Link
                    to={card.howItWorksLink}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      color: card.color,
                      fontWeight: "600",
                      textDecoration: "none",
                      transition: "all 0.3s ease",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      fontSize: isMobile ? "0.7rem" : "0.8rem",
                    }}
                  >
                    How It Works <FaChevronRight style={{ marginLeft: "5px", fontSize: "0.7rem" }} />
                  </Link>
                  <button
                    onClick={handleGetStartedClick}
                    style={{
                      backgroundColor: card.color,
                      color: card.color === colors.dark || card.color === colors.primary ? colors.light : colors.dark,
                      padding: "6px 15px",
                      borderRadius: "50px",
                      fontWeight: "600",
                      textDecoration: "none",
                      display: "inline-block",
                      transition: "all 0.3s ease",
                      textTransform: "uppercase",
                      border: "none",
                      cursor: "pointer",
                      fontSize: isMobile ? "0.7rem" : "0.8rem",
                      width: "100%",
                    }}
                  >
                    {isRegistrationOpen ? "Join Now" : "Get Started"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "20px",
            background: `linear-gradient(to right, ${colors.accent}, ${colors.neutral})`,
            clipPath: isMobile ? "none" : "polygon(0 30%, 100% 0, 100% 100%, 0 100%)",
          }}
        ></div>
      </section>

      {/* What is BIG Marketplace Section */}
      <section
        style={{
          padding: "50px 20px",
          position: "relative",
          background: `linear-gradient(135deg, ${colors.neutral} 0%, ${colors.light} 100%)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "20px",
            background: `linear-gradient(to right, ${colors.secondary}, ${colors.primary})`,
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 70%)",
          }}
        ></div>

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "40px",
              alignItems: "center",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "2.2rem",
                  fontWeight: "700",
                  marginBottom: "15px",
                  color: colors.dark,
                  textTransform: "uppercase",
                }}
              >
                MEET BIG MARKETPLACE — AFRICA'S TRUST LAYER FOR GROWTH
              </h2>
              <p
                style={{
                  fontSize: "1.1rem",
                  marginBottom: "25px",
                  color: colors.dark,
                  textTransform: "uppercase",
                }}
              >
                One profile. One score. Many doors.
              </p>

              <div style={{ marginBottom: "25px" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                  <FaCheck style={{ color: colors.primary, marginRight: "10px" }} />
                  <span style={{ color: colors.dark }}>
                    <strong>Get matched</strong> to funders, service providers, and strategic support that fit your growth stage.
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                  <FaCheck style={{ color: colors.primary, marginRight: "10px" }} />
                  <span style={{ color: colors.dark }}>
                    <strong>See your BIG Score</strong> — and what to improve — before applying.
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                  <FaCheck style={{ color: colors.primary, marginRight: "10px" }} />
                  <span style={{ color: colors.dark }}>
                    <strong>Boost trust and traction</strong> with verified compliance and investor-grade profiling.
                  </span>
                </div>
              </div>

              <p
                style={{
                  fontSize: "1rem",
                  marginBottom: "25px",
                  color: colors.dark,
                }}
              >
                Whether you're a bold SME, a funder, a support partner, or a corporate leader — <strong>BIG Marketplace connects you to who (and what) you need to grow faster, smarter, and with less risk.</strong>
              </p>

              {!expandedAbout && (
                <button
                  onClick={() => setExpandedAbout(true)}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: colors.primary,
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    fontSize: "0.9rem",
                    textTransform: "uppercase",
                  }}
                  >
                  Learn More <FaChevronRight style={{ marginLeft: "5px" }} />
                </button>
              )}

              {expandedAbout && (
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.7)",
                    padding: "15px",
                    borderRadius: "8px",
                    marginBottom: "15px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.9rem",
                      lineHeight: "1.6",
                      color: colors.dark,
                      marginBottom: "12px",
                    }}
                  >
                    BIG Marketplace was founded to solve one problem: Africa's SMEs lack trust, not potential. We
                    combine data, partnerships, and technology to create a fair, transparent ecosystem where:
                  </p>
                  <ul
                    style={{
                      listStyleType: "disc",
                      paddingLeft: "20px",
                      marginBottom: "12px",
                    }}
                  >
                    <li style={{ marginBottom: "6px" }}>SMSEs prove their credibility.</li>
                    <li style={{ marginBottom: "6px" }}>
                      Funders find verified opportunities.
                    </li>
                    <li style={{ marginBottom: "6px" }}>Corporates maximize impact.</li>
                  </ul>
                </div>
              )}
            </div>

            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "15px",
                boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <img
                src={images.ecosystem || "/placeholder.svg"}
                alt="BIG Marketplace Ecosystem"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "4px",
                }}
              />
              <p
                style={{
                  fontSize: "0.8rem",
                  color: colors.dark,
                  marginTop: "10px",
                  fontStyle: "italic",
                  textTransform: "uppercase",
                }}
              >
                The BIG Marketplace ecosystem connects verified businesses to funders, support partners, corporates, and strategic advisors — all in one place.
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "20px",
            background: `linear-gradient(to right, ${colors.dark}, ${colors.accent})`,
            clipPath: "polygon(0 0, 100% 30%, 100% 100%, 0 100%)",
          }}
        ></div>
      </section>

      {/* BIG Score Section - Clean and Consistent */}
      <section
        style={{
          padding: "60px 20px",
          position: "relative",
          backgroundColor: colors.scoreBg,
          backgroundImage:
            "radial-gradient(circle at 10% 20%, rgba(188, 174, 156, 0.1) 0%, rgba(188, 174, 156, 0.05) 90%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "20px",
            background: `linear-gradient(to right, ${colors.accent}, ${colors.neutral})`,
            clipPath: "polygon(0 0, 100% 0, 100% 70%, 0 100%)",
          }}
        ></div>

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "40px",
            }}
          >
            <h2
              style={{
                fontSize: "2.2rem",
                fontWeight: "700",
                marginBottom: "15px",
                color: colors.dark,
                textTransform: "uppercase",
              }}
            >
              THE <span style={{ color: colors.primary }}>BIG</span> YOUR BUSINESS CREDIBILITY ENGINE
            </h2>
            <p
              style={{
                fontSize: "1rem",
                color: colors.dark,
                maxWidth: "800px",
                margin: "0 auto",
                textTransform: "uppercase",
              }}
            >
              A COMPREHENSIVE AI-Driven score THAT EVALUATES YOUR BUSINESS ACROSS MULTIPLE DIMENSIONS
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "30px",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "25px",
                boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
                borderTop: `4px solid ${colors.primary}`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  backgroundColor: `${colors.primary}20`,
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 15px",
                  border: `2px solid ${colors.primary}`,
                }}
              >
                <FaChartBar size={24} color={colors.primary} />
              </div>
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: "700",
                  marginBottom: "12px",
                  color: colors.dark,
                  textTransform: "uppercase",
                }}
              >
                How It Works
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: colors.dark,
                  marginBottom: "15px",
                }}
              >
                The BIG Score combines data across four core areas to evaluate how investment-ready your business is:
              </p>
              <ul
                style={{
                  listStyleType: "none",
                  padding: 0,
                  margin: "0 0 15px 0",
                  textAlign: "left",
                }}
              >
                <li style={{ marginBottom: "8px", display: "flex", alignItems: "flex-start" }}>
                  <FaCheck style={{ color: colors.primary, marginRight: "8px", flexShrink: 0, marginTop: "3px" }} />
                  <span style={{ fontSize: "0.85rem" }}>Financial health: Revenue trends, profitability</span>
                </li>
                <li style={{ marginBottom: "8px", display: "flex", alignItems: "flex-start" }}>
                  <FaCheck style={{ color: colors.primary, marginRight: "8px", flexShrink: 0, marginTop: "3px" }} />
                  <span style={{ fontSize: "0.85rem" }}>Operational maturity: Systems, processes</span>
                </li>
                <li style={{ marginBottom: "8px", display: "flex", alignItems: "flex-start" }}>
                  <FaCheck style={{ color: colors.primary, marginRight: "8px", flexShrink: 0, marginTop: "3px" }} />
                  <span style={{ fontSize: "0.85rem" }}>Compliance status: Legal, regulatory</span>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start" }}>
                  <FaCheck style={{ color: colors.primary, marginRight: "8px", flexShrink: 0, marginTop: "3px" }} />
                  <span style={{ fontSize: "0.85rem" }}>Growth potential: Market opportunity</span>
                </li>
              </ul>
            </div>

            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "25px",
                boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
                borderTop: `4px solid ${colors.secondary}`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  backgroundColor: `${colors.secondary}20`,
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 15px",
                  border: `2px solid ${colors.secondary}`,
                }}
              >
                <MdTrendingUp size={24} color={colors.secondary} />
              </div>
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: "700",
                  marginBottom: "12px",
                  color: colors.dark,
                  textTransform: "uppercase",
                }}
              >
                What It Unlocks
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: colors.dark,
                  marginBottom: "15px",
                }}
              >
                Your BIG Score opens doors to opportunities matched to your business's current stage and potential.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginBottom: "15px",
                }}
              >
                <div
                  style={{
                    backgroundColor: `${colors.primary}1A`,
                    padding: "10px",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      color: colors.primary,
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    Funding
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: `${colors.primary}1A`,
                    padding: "10px",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      color: colors.primary,
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      textTransform: "uppercase"
                    }}
                  >
                    Partnerships
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: `${colors.primary}1A`,
                    padding: "10px",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      color: colors.primary,
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      textTransform: "uppercase"
                    }}
                  >
                    Compliance Confidence
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: `${colors.dark}10`,
                    padding: "10px",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      color: colors.primary,
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      textTransform: "uppercase"
                    }}
                  >
                    Strategic Guidance
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
            }}
          >
            <Link
              to="/BigScorePage"
              style={{
                backgroundColor: colors.primary,
                color: colors.light,
                padding: "12px 30px",
                borderRadius: "50px",
                fontWeight: "600",
                textDecoration: "none",
                display: "inline-block",
                transition: "all 0.3s ease",
                textTransform: "uppercase",
              }}
            >
              SEE HOW YOUR SCORE IS CALCULATED
            </Link>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "20px",
            background: `linear-gradient(to right, ${colors.secondary}, ${colors.primary})`,
            clipPath: "polygon(0 30%, 100% 0, 100% 100%, 0 100%)",
          }}
        ></div>
      </section>

      {/* Don't Qualify Section */}
      <section
        style={{
          padding: "50px 20px",
          position: "relative",
          backgroundColor: colors.light,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "20px",
            background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 70%)",
          }}
        ></div>

        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "40px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "15px",
                boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
              }}
            >
              <img
                src={images.pathway || "/placeholder.svg"}
                alt="Pathway to Success"
                style={{
                  width: "100%",
                  height: "auto",
                }}
              />
            </div>

            <div>
              <h2
                style={{
                  fontSize: "2.2rem",
                  fontWeight: "700",
                  marginBottom: "15px",
                  color: colors.dark,
                  textTransform: "uppercase",
                }}
              >
                Don't Qualify Yet? We've Got You.
              </h2>
              <p
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  marginBottom: "15px",
                  color: colors.primary,
                  textTransform: "uppercase",
                }}
              >
                BIG Doesn't Shut Doors — It Shows You Where To Go.
              </p>
              <p
                style={{
                  fontSize: "1rem",
                  lineHeight: "1.6",
                  marginBottom: "15px",
                  color: colors.dark,
                }}
              >
                If your score is low, we'll guide you to:
              </p>
              <ul
                style={{
                  listStyleType: "disc",
                  paddingLeft: "20px",
                  marginBottom: "15px",
                }}
              >
                <li style={{ marginBottom: "6px" }}>Accelerators to refine your model.</li>
                <li style={{ marginBottom: "6px" }}>Mentors to fix compliance gaps.</li>
                <li style={{ marginBottom: "6px" }}>Incubators to prep for funding.</li>
              </ul>
              <p
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  color: colors.primary,
                  marginBottom: "25px",
                  textTransform: "uppercase",
                }}
              >
                BIG Is More Than A Marketplace. It's A Pathway.
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "20px",
            background: `linear-gradient(to right, ${colors.accent}, ${colors.neutral})`,
            clipPath: "polygon(0 0, 100% 30%, 100% 100%, 0 100%)",
          }}
        ></div>
      </section>

      {/* Why Trust Us Section - Compact */}
      <section
        style={{
          padding: "40px 20px",
          position: "relative",
          backgroundColor: colors.light,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "20px",
            background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
            clipPath: "polygon(0 0, 100% 0, 100% 70%, 0 100%)",
          }}
        ></div>

        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              marginBottom: "30px",
              color: colors.dark,
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            WHY TRUST <span style={{ color: colors.primary }}>BIG</span> MARKETPLACE
          </h2>
          
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: "30px",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "1rem",
                  lineHeight: "1.6",
                  color: colors.dark,
                  marginBottom: "25px",
                  textAlign: "center",
                }}
              >
                BIG Marketplace is built on more than technology — it's built on insight, experience, and deep collaboration across Africa's growth ecosystem.
              </p>

              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "15px" }}>
                  <div style={{ flexShrink: 0, marginRight: "15px" }}>
                    <div
                      style={{
                        backgroundColor: `${colors.primary}20`,
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${colors.primary}`,
                      }}
                    >
                      <FaUsers size={14} color={colors.primary} />
                    </div>
                  </div>
                  <div>
                    <h4
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        marginBottom: "5px",
                        color: colors.primary,
                      }}
                    >
                      Built With, Not Just For
                    </h4>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        lineHeight: "1.5",
                        color: colors.dark,
                      }}
                    >
                      Before writing code, we consulted 30+ stakeholders to design a platform grounded in African entrepreneurs' realities.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "15px" }}>
                  <div style={{ flexShrink: 0, marginRight: "15px" }}>
                    <div
                      style={{
                        backgroundColor: `${colors.secondary}20`,
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${colors.secondary}`,
                      }}
                    >
                      <FaChartBar size={14} color={colors.secondary} />
                    </div>
                  </div>
                  <div>
                    <h4
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        marginBottom: "5px",
                        color: colors.secondary,
                      }}
                    >
                      Decades of Expertise
                    </h4>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        lineHeight: "1.5",
                        color: colors.dark,
                      }}
                    >
                      Our team brings decades of experience in SME growth, finance, and innovation.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, marginRight: "15px" }}>
                    <div
                      style={{
                        backgroundColor: `${colors.accent}20`,
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${colors.accent}`,
                      }}
                    >
                      <FaHandshake size={14} color={colors.accent} />
                    </div>
                  </div>
                  <div>
                    <h4
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        marginBottom: "5px",
                        color: colors.accept,
                      }}
                    >
                      Solving for More
                    </h4>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        lineHeight: "1.5",
                        color: colors.dark,
                      }}
                    >
                      We're not just solving for access - we're solving for readiness, trust, and scale.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "15px",
              }}
            >
              <img
                src={images.trustImage}
                alt="Trust and Collaboration"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "8px",
                  maxHeight: "200px",
                  objectFit: "cover",
                }}
              />
              <img
                src={images.collaboration}
                alt="Stakeholder Collaboration"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "8px",
                  maxHeight: "200px",
                  objectFit: "cover",
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "20px",
            background: `linear-gradient(to right, ${colors.accent}, ${colors.neutral})`,
            clipPath: "polygon(0 30%, 100% 0, 100% 100%, 0 100%)",
          }}
        ></div>
      </section>

      {/* Scroll to top button */}
      {showScroll && (
        <button
          onClick={scrollTop}
          style={{
            position: "fixed",
            bottom: isMobile ? "20px" : "30px",
            right: isMobile ? "20px" : "30px",
            backgroundColor: colors.primary,
            color: "white",
            width: isMobile ? "40px" : "50px",
            height: isMobile ? "40px" : "50px",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            zIndex: 100,
          }}
        >
          <FaArrowRight style={{ transform: "rotate(-90deg)" }} />
        </button>
      )}

      {/* Include the Chatbox component */}
      <Chatbox />

      <Footer />
    </div>
  )
}

export default LandingPage