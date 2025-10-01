"use client"
import { useState, useEffect } from "react"
import "./LoginRegister.css"
import RetrieveAccount from './RetrieveAccount.js'
import {
  Mail,
  Lock,
  CheckCircle,
  Rocket,
  Smile,
  User,
  Briefcase,
  HeartHandshake,
  Loader2,
  Building2,
  TrendingUp,
  Users,
  GraduationCap,
  Award,
  X,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification
} from "../firebaseConfig"
import { doc, setDoc, deleteDoc } from "firebase/firestore"
import { db } from "../firebaseConfig"
import { getDoc } from "firebase/firestore"
import { onAuthStateChanged, deleteUser } from "firebase/auth"
import { useLocation } from "react-router-dom"
import NDASignupPopup from "../NDAsign"
import TermsConditionsCheckbox from "./Ts&cs"
import { Eye, EyeOff } from "lucide-react"
import { sendPasswordResetEmail } from "firebase/auth"

export default function LoginRegister() {
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const initialMode = new URLSearchParams(location.search).get("mode")
  const [isRegistering, setIsRegistering] = useState(initialMode !== "login")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetMessage, setResetMessage] = useState("")
  const [resetError, setResetError] = useState("")
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("") // Added username field
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [errors, setErrors] = useState({})
  const [role, setRole] = useState("")
  const [roles, setRoles] = useState([])
  const [isHovering, setIsHovering] = useState(false)
  const [authError, setAuthError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [showNDA, setShowNDA] = useState(false)
  const [ndaComplete, setNdaComplete] = useState(false)
  const [registrationData, setRegistrationData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)
  const [checkingVerification, setCheckingVerification] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [roleSelectionModal, setRoleSelectionModal] = useState({ show: false, roles: [] })
  const [showAdvisorCriteria, setShowAdvisorCriteria] = useState(false)
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsEmailVerified(user.emailVerified)
        // If user is logged in but email not verified, show verification message
        if (!user.emailVerified && !isRegistering) {
          setIsVerifying(true)
        } else {
          setIsVerifying(false)
        }
      } else {
        setIsEmailVerified(false)
        setIsVerifying(false)
      }
    })
    return () => unsubscribe()
  }, [isRegistering])

  
  const navigateToRoleDashboard = (role) => {
    console.log("Navigating to dashboard for role:", role) // Debug log
    
    switch (role) {
      case "Investor":
      case "INVESTOR":
        navigate("/investor-profile")
        break
      case "Small and Medium Social Enterprises":
      case "SMSEs":
      case "SMSE": // Added this case
      case "SMEs":
      case "SME/BUSINESS":
        navigate("/profile")
        break
      case "Advisors":
      case "ADVISOR":
        navigate("/advisor-profile")
        break
      case "Accelerators":
      case "Catalyst": // Added this case
        navigate("/support-profile")
        break
      case "Interns":
      case "INTERN":
        navigate("/intern-profile")
        break
      case "ProgramSponsor":
      case "PROGRAM_SPONSOR":
        navigate("/program-sponsor-profile")
        break
      default:
        console.log("Unknown role, redirecting to auth:", role)
        navigate("/auth")
    }
  }
   const RoleSelectionModal = ({ roles }) => {
  const navigate = useNavigate();

  const handleRetrieveClick = (roleName) => {
    navigate("/RetrieveAccount", { state: { roleToRetrieve: roleName } });
  }}

  const handleForgotPassword = async () => {
    setResetMessage("")
    setResetError("")
    if (!validateEmail(resetEmail)) {
      setResetError("Enter a valid email address.")
      return
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail)
      setResetMessage("✅ Reset link sent! Check your inbox.")
      setResetEmail("")
    } catch (error) {
      console.error("Reset error:", error)
      setResetError("❌ Failed to send reset email. Please try again.")
    }
  }

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email)

  const roleCards = [
    {
      id: "SMSEs",
      title: "Small Medium and Social Enterprise",
      icon: <Briefcase size={20} />,
      description: "Small and Medium Enterprises looking to scale and grow their business",
      hoverInfo: "Access funding opportunities to accelerate your growth journey.",
    },
    {
      id: "Investor",
      title: "Funder/Investors",
      icon: <TrendingUp size={20} />,
      description: "Investment professionals and funding organizations",
      hoverInfo: "Discover investment opportunities, connect with promising startups",
    },
    {
      id: "Interns",
      title: "Interns",
      icon: <GraduationCap size={20} />,
      description: "Students and early career professionals",
      hoverInfo: "Gain valuable experience, learn from industry experts",
    },
    {
      id: "Advisors",
      title: "Advisor",
      icon: <Users size={20} />,
      description: "Professional Advisors and consultants",
      hoverInfo: "Offer your expertise to growing businesses",
    },
    {
      id: "Accelerators",
      title: "Catalyst",
      icon: <Building2 size={20} />,
      description: "Corporate partners, accelerators, and incubation programs",
      hoverInfo: "Connect with innovative startups, provide mentorship",
    },
    {
      id: "ProgramSponsor",
      title: "Program Sponsor",
      icon: <Award size={20} />,
      description: "Organizations sponsoring programs and initiatives",
      hoverInfo: "Offer jobs to interns, support entrepreneurial programs",
    },
  ]

  const handleRoleSelect = (roleId) => {
    // Check if user is selecting Advisor role
    if (roleId === "Advisors") {
      setShowAdvisorCriteria(true)
      return
    }
    setRoles((prev) => (prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]))
    setErrors((prev) => ({ ...prev, role: "" }))
  }

  const handleAdvisorCriteriaAccept = () => {
    setShowAdvisorCriteria(false)
    setRoles((prev) => (prev.includes("Advisors") ? prev.filter((r) => r !== "Advisors") : [...prev, "Advisors"]))
    setErrors((prev) => ({ ...prev, role: "" }))
  }

  const handleAdvisorCriteriaCancel = () => {
    setShowAdvisorCriteria(false)
  }

  const handleRegister = async () => {
    setIsLoading(true)
    const newErrors = {}
    if (!validateEmail(email)) newErrors.email = "Enter your email"
    if (username.trim() === "") newErrors.username = "Enter your username"
    if (password.length < 6) newErrors.password = "Password should be (at least 6 characters)"
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match!"
    if (roles.length === 0) newErrors.role = "Please select at least one role."
    if (!agreeToTerms) newErrors.terms = "Please agree to the Terms & Conditions"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    setErrors({})
    setAuthError("")

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Send email verification
      await sendEmailVerification(user)
      setEmailVerificationSent(true)
      setCodeSent(true) // Show verification step

      const ndaData = {
        email: email,
        username: username,
        role: roles.join(","), // Still store as comma-separated string if needed
        roleArray: roles,
        password: password,
        uid: user.uid,
        termsAccepted: true,
        termsAcceptedDate: new Date().toISOString(),
      }
      setRegistrationData(ndaData)
    } catch (error) {
      console.error("Registration error:", error)
      setAuthError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegistrationComplete = async (ndaData) => {
    if (ndaData.cancelled) {
      setShowNDA(false)
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete()
          setAuthError("Registration cancelled")
        } catch (error) {
          console.error("Error deleting user account:", error)
        }
      }
      return
    }

    try {
      if (!auth.currentUser) {
        setAuthError("User authentication lost. Please try again.")
        return
      }

      await setDoc(doc(db, "users", auth.currentUser.uid), {
        email: email,
        username: username, // Store username instead of company
        role: roles.join(","), // Keep for legacy
        roleArray: roles, // Store properly
        ndaSigned: true,
        ndaSignedDate: new Date().toISOString(),
        termsAccepted: agreeToTerms,
        termsAcceptedDate: new Date().toISOString(),
        createdAt: new Date(),
        ndaInfo: {
          pdfUrl: ndaData.pdfUrl || null,
          signatureUrl: ndaData.signatureUrl || null,
          userId: ndaData.userId || auth.currentUser.uid,
        },
        termsVersion: "1.0",
        termsContent: "BIG Marketplace Platform Terms & Conditions",
      })

      setNdaComplete(true)
      setShowNDA(false)

      // Updated navigation logic for registration
      if (roles.length > 1) {
        // Multiple roles - show selection modal
        setRoleSelectionModal({ show: true, roles: roles })
      } else {
        // Single role - navigate directly
        navigateToRoleDashboard(roles[0])
      }
    } catch (error) {
      console.error("Error saving user data:", error)
      setAuthError("Failed to complete registration. Please try again.")
    }
  }

  const handleVerify = async () => {
    setCheckingVerification(true)
    setErrors({})
    try {
      // Reload user to get updated emailVerified status
      await auth.currentUser.reload()
      const user = auth.currentUser
      if (user.emailVerified) {
        setIsEmailVerified(true)
        setShowNDA(true) // Show NDA popup after email verification
      } else {
        setErrors({
          verificationCode: "Please verify your email first. Check your inbox and click the verification link.",
        })
      }
    } catch (error) {
      console.error("Verification check error:", error)
      setErrors({ verificationCode: "Error checking verification status. Please try again." })
    } finally {
      setCheckingVerification(false)
    }
  }

  const resendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser)
        setAuthError("Verification email sent! Please check your inbox.")
      }
    } catch (error) {
      console.error("Error resending verification:", error)
      setAuthError("Failed to resend verification email.")
    }
  }
const handleLogin = async () => {
  setIsLoading(true);
  setErrors({});
  setAuthError("");

  // 1️⃣ Basic validation
  if (!validateEmail(email)) {
    setErrors({ email: "Enter your email!" });
    setIsLoading(false);
    return;
  }
  if (!password) {
    setErrors({ password: "Enter your password!" });
    setIsLoading(false);
    return;
  }

  try {
    // 2️⃣ Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 3️⃣ Get user data from Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      setAuthError("User profile not found. Please contact support.");
      setIsLoading(false);
      return;
    }

    const userData = userDocSnap.data();
   let activeRoles = [];
let deletedRoles = [];

// 1️⃣ Check roles object first
if (userData.roles && typeof userData.roles === "object") {
  Object.keys(userData.roles).forEach((r) => {
    const roleObj = userData.roles[r];
    if (roleObj.deletedStatus === true) {
      deletedRoles.push({
        name: r,
        deletedStatus: true,
        deletedAt: roleObj.deletedAt,
      });
    } else {
      activeRoles.push({ name: r });
    }
  });
}

// 2️⃣ Merge roleArray if exists (avoid duplicates)
if (Array.isArray(userData.roleArray)) {
  userData.roleArray.forEach((r) => {
    if (!activeRoles.find((ar) => ar.name === r)) {
      activeRoles.push({ name: r });
    }
  });
}

// 3️⃣ Merge old string role (comma-separated)
if (typeof userData.role === "string") {
  userData.role.split(",").forEach((r) => {
    const roleName = r.trim();
    if (!activeRoles.find((ar) => ar.name === roleName)) {
      activeRoles.push({ name: roleName });
    }
  });
}

const allRoles = [...activeRoles, ...deletedRoles];

// 4️⃣ Set modal
setRoleSelectionModal({ show: true, roles: allRoles });


    // 7️⃣ Auto navigate if only one active role
    if (activeRoles.length === 1) {
      setRoleSelectionModal({ show: false, roles: [] });
      navigateToRoleDashboard(activeRoles[0].name);
    }

    // 8️⃣ If only deleted roles exist, go to RetrieveAccount
    if (activeRoles.length === 0 && deletedRoles.length > 0) {
      navigate("/RetrieveAccount", { state: { roleToRetrieve: deletedRoles[0].name } });
    }
  } catch (error) {
    console.error("Login error:", error);
    setAuthError(error.message);
  } finally {
    setIsLoading(false);
  }
};

  const getRoleIcon = (roleValue) => {
    switch (roleValue) {
      case "Small and Medium Social Enterprises":
      case "SMSEs":
      case "SMSEs":
      case "SMEs":
        return <Briefcase size={16} />
      case "Investor":
        return <Rocket size={16} />
      case "Advisors":
        return <Users size={16} />
      case "Accelerators":
      case "Catalyst":
        return <Building2 size={16} />
      case "Interns":
        return <GraduationCap size={16} />
      case "ProgramSponsor":
        return <Award size={16} />
      default:
        return <Smile size={16} />
    }
  }

  const getRoleDashboardName = (role) => {
    console.log("Getting dashboard name for role:", role) // Debug log
    switch (role) {
      case "Small and Medium Social Enterprises":
      case "SMSEs":
      case "SMSE":
      case "SME":
      case "SME/BUSINESS":
        return "SMSEs Dashboard" // Changed from "SMSE Dashboard" to "SMSEs Dashboard"
      case "Investor":
        return "Investor Dashboard"
      case "Advisors":
        return "Advisor Dashboard"
      case "Accelerators":
      case "Catalyst":
        return "Catalyst Dashboard"
      case "Interns":
        return "Intern Dashboard"
      case "ProgramSponsor":
        return "Program Sponsor Dashboard"
      default:
        console.log("Unknown role for dashboard name:", role) // Debug log
        return role
    }
  }

  const getRoleDescription = (role) => {
    console.log("Getting role description for:", role) // Debug log
    switch (role) {
      case "Small and Medium Social Enterprises":
      case "SMSEs":
      case "SMSE":
      case "SME":
        return "Access funding, growth tools, and partnerships"
      case "Investor":
        return "Discover investment opportunities and manage portfolio"
      case "Advisors":
        return "Connect with businesses and offer expertise"
      case "Accelerators":
      case "Catalyst":
        return "Support startups and drive innovation"
      case "Interns":
        return "Access internship opportunities and career development"
      case "ProgramSponsor":
        return "Manage intern programs and track placements"
      default:
        console.log("Unknown role for description:", role) // Debug log
        return "Access your dashboard"
    }
  }

const handleRoleClick = (roleObj) => {
  if (roleObj.deletedStatus) {
    // Deleted role → redirect to retrieval page
    window.location.href = "/retrieve-account";
    return;
  }

  // Active role → navigate to dashboard
  setRoleSelectionModal({ show: false, roles: [] });
  setTimeout(() => navigateToRoleDashboard(roleObj.name), 100);
};
  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="form-side">
          <div className="form-header">
            {authError && <div className="auth-error">{authError}</div>}
            <h2>{isRegistering ? "Create Your Account!" : "Welcome Back!"}</h2>
            <div className={`icon-container ${isRegistering ? "register" : "login"}`}>
              {isRegistering ? <Rocket size={24} /> : <Smile size={24} />}
            </div>
          </div>

          <div className="form-box">
            {isRegistering ? (
              codeSent ? (
                <div className="form-step">
                  <div className="verification-message">
                    <p>✨ We sent a verification link to your email! ✨</p>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                      Please check your inbox and click the verification link, then click "I've verified my email"
                      below.
                    </p>
                  </div>
                  {errors.verificationCode && <p className="error-text">{errors.verificationCode}</p>}
                  <button
                    className="primary-btn verify-btn"
                    onClick={handleVerify}
                    disabled={checkingVerification}
                    style={{ marginBottom: "10px" }}
                  >
                    {checkingVerification ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Checking...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        I've verified my email
                      </>
                    )}
                  </button>
                  <button
                    onClick={resendVerificationEmail}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--primary)",
                      color: "var(--primary)",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    Resend verification email
                  </button>
                </div>
              ) : (
                <div
                  className="form-step"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                    width: "100%",
                  }}
                >
                  {/* Username - Added instead of company name */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "var(--background)",
                      border: `2px solid ${errors.username ? "var(--error)" : "var(--secondary)"}`,
                      borderRadius: "12px",
                      padding: "0 15px",
                      height: "50px",
                      transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    }}
                  >
                    <div
                      style={{
                        marginRight: "12px",
                        color: "var(--primary-dark)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      style={{
                        flex: 1,
                        border: "none",
                        background: "transparent",
                        outline: "none",
                        fontSize: "15px",
                        color: "var(--text)",
                        height: "100%",
                        fontFamily: "Quicksand, sans-serif",
                      }}
                    />
                  </div>
                  {errors.username && <p className="error-text">{errors.username}</p>}

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Email */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: "var(--background)",
                        border: `2px solid ${errors.email ? "var(--error)" : "var(--secondary)"}`,
                        borderRadius: "12px",
                        padding: "0 15px",
                        height: "50px",
                        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                      }}
                    >
                      <div
                        style={{
                          marginRight: "12px",
                          color: "var(--primary-dark)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        placeholder="Your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                          flex: 1,
                          border: "none",
                          background: "transparent",
                          outline: "none",
                          fontSize: "15px",
                          color: "var(--text)",
                          height: "100%",
                          fontFamily: "Quicksand, sans-serif",
                        }}
                      />
                    </div>
                    {errors.email && <p className="error-text">{errors.email}</p>}

                    {/* Password */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: "var(--background)",
                        border: `2px solid ${errors.password ? "var(--error)" : "var(--secondary)"}`,
                        borderRadius: "12px",
                        padding: "0 15px",
                        height: "50px",
                        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                      }}
                    >
                      <div
                        style={{
                          marginRight: "12px",
                          color: "var(--primary-dark)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Lock size={18} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                          flex: 1,
                          border: "none",
                          background: "transparent",
                          outline: "none",
                          fontSize: "15px",
                          color: "var(--text)",
                          height: "100%",
                          fontFamily: "Quicksand, sans-serif",
                        }}
                      />
                      <div
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          cursor: "pointer",
                          marginLeft: "12px",
                          color: "var(--primary-dark)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </div>
                    </div>
                    {errors.password && (
                      <p
                        style={{
                          color: "var(--error)",
                          fontSize: "0.8125rem",
                          marginTop: "4px",
                          marginBottom: "0",
                        }}
                      >
                        {errors.password}
                      </p>
                    )}

                    {/* Confirm Password */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: "var(--background)",
                        border: `2px solid ${errors.confirmPassword ? "var(--error)" : "var(--secondary)"}`,
                        borderRadius: "12px",
                        padding: "0 15px",
                        height: "50px",
                        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                      }}
                    >
                      <div
                        style={{
                          marginRight: "12px",
                          color: "var(--primary-dark)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Lock size={18} />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{
                          flex: 1,
                          border: "none",
                          background: "transparent",
                          outline: "none",
                          fontSize: "15px",
                          color: "var(--text)",
                          height: "100%",
                          fontFamily: "Quicksand, sans-serif",
                        }}
                      />
                      <div
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          cursor: "pointer",
                          marginLeft: "12px",
                          color: "var(--primary-dark)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </div>
                    </div>
                    {errors.confirmPassword && (
                      <p
                        style={{
                          color: "var(--error)",
                          fontSize: "0.8125rem",
                          marginTop: "4px",
                          marginBottom: "0",
                        }}
                      >
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Role Cards - Updated to 3x2 grid with specific arrangement */}
                  <div style={{ marginBottom: "16px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "12px",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "var(--text)",
                        fontFamily: "Quicksand, sans-serif",
                      }}
                    >
                      I am a:
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "10px",
                        marginBottom: "8px",
                      }}
                    >
                      {roleCards.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => handleRoleSelect(card.id)}
                          onMouseEnter={() => setHoveredCard(card.id)}
                          onMouseLeave={() => setHoveredCard(null)}
                          style={{
                            position: "relative",
                            padding: "10px",
                            borderRadius: "12px",
                            border: `2px solid ${roles.includes(card.id) ? "#8B4513" : "#D2B48C"}`,
                            backgroundColor: roles.includes(card.id) ? "#F5E6D3" : "#FAF7F2",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            transform: hoveredCard === card.id ? "translateY(-2px)" : "translateY(0)",
                            boxShadow:
                              hoveredCard === card.id
                                ? "0 8px 25px rgba(139, 69, 19, 0.15)"
                                : "0 2px 8px rgba(139, 69, 19, 0.08)",
                            minHeight: "80px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              color: roles.includes(card.id) ? "#8B4513" : "#A0522D",
                              marginBottom: "6px",
                              transition: "color 0.3s ease",
                            }}
                          >
                            {card.icon}
                          </div>
                          <h4
                            style={{
                              margin: "0 0 2px 0",
                              fontSize: "11px",
                              fontWeight: "600",
                              color: roles.includes(card.id) ? "#8B4513" : "#A0522D",
                              fontFamily: "Quicksand, sans-serif",
                              lineHeight: "1.2",
                            }}
                          >
                            {card.title}
                          </h4>
                          {/* Hover Info Overlay - Dark Brown with White Text */}
                          {hoveredCard === card.id && (
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: "linear-gradient(135deg, #3E2723 0%, #4E342E 50%, #5D4037 100%)",
                                borderRadius: "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "10px",
                                animation: "fadeIn 0.3s ease",
                                boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.3)",
                              }}
                            >
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "10px",
                                  color: "#FFFFFF",
                                  fontFamily: "Quicksand, sans-serif",
                                  lineHeight: "1.4",
                                  textAlign: "center",
                                  fontWeight: "500",
                                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                                }}
                              >
                                {card.hoverInfo}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {errors.role && (
                      <p
                        style={{
                          color: "var(--error)",
                          fontSize: "0.8125rem",
                          marginTop: "4px",
                          marginBottom: "0",
                        }}
                      >
                        {errors.role}
                      </p>
                    )}
                  </div>

                  <TermsConditionsCheckbox
                    agreeToTerms={agreeToTerms}
                    setAgreeToTerms={setAgreeToTerms}
                    error={errors.terms}
                  />

                  <button className="primary-btn" onClick={handleRegister} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account <Rocket size={16} />
                      </>
                    )}
                  </button>

                  <p className="switch-link">
                    "Already a member of the BIG Circle"? <span onClick={() => setIsRegistering(false)}>Login</span>
                  </p>
                </div>
              )
            ) : (
              <div
                className="form-step"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  width: "100%",
                }}
              >
                {/* Email Input */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "var(--background)",
                    border: `2px solid ${errors.email ? "var(--error)" : "var(--secondary)"}`,
                    borderRadius: "12px",
                    padding: "0 15px",
                    height: "50px",
                    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                  }}
                >
                  <div
                    style={{
                      marginRight: "12px",
                      color: "var(--primary-dark)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      fontSize: "15px",
                      color: "var(--text)",
                      height: "100%",
                      fontFamily: "Quicksand, sans-serif",
                    }}
                  />
                </div>
                {errors.email && (
                  <p
                    style={{
                      color: "var(--error)",
                      fontSize: "0.8125rem",
                      marginTop: "4px",
                      marginBottom: "0",
                    }}
                  >
                    {errors.email}
                  </p>
                )}

                {/* Password Input */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "var(--background)",
                    border: `2px solid ${errors.password ? "var(--error)" : "var(--secondary)"}`,
                    borderRadius: "12px",
                    padding: "0 15px",
                    height: "50px",
                    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      marginRight: "12px",
                      color: "var(--primary-dark)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      fontSize: "15px",
                      color: "var(--text)",
                      height: "100%",
                      fontFamily: "Quicksand, sans-serif",
                    }}
                  />
                  <div
                    style={{
                      cursor: "pointer",
                      color: "var(--primary-dark)",
                      marginLeft: "12px",
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
                {errors.password && (
                  <p
                    style={{
                      color: "var(--error)",
                      fontSize: "0.8125rem",
                      marginTop: "4px",
                      marginBottom: "0",
                    }}
                  >
                    {errors.password}
                  </p>
                )}

                {isVerifying && (
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#FFF3CD",
                      border: "1px solid #FFEAA7",
                      borderRadius: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "14px",
                        color: "#856404",
                        fontWeight: "600",
                      }}
                    >
                      Email verification required
                    </p>
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "13px",
                        color: "#856404",
                      }}
                    >
                      Please check your email and click the verification link before logging in.
                    </p>
                    <button
                      onClick={resendVerificationEmail}
                      style={{
                        background: "transparent",
                        border: "1px solid #856404",
                        color: "#856404",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Resend verification email
                    </button>
                  </div>
                )}

                <button className="primary-btn" onClick={handleLogin} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login! <Smile size={16} />
                    </>
                  )}
                </button>

                <p className="switch-link">
                  New to the family? <span onClick={() => setIsRegistering(true)}>Join us!</span>
                </p>

                <p
                  className="forgot-password"
                  onClick={() => setShowForgotPasswordModal(true)}
                  style={{ cursor: "pointer" }}
                >
                  Forgot your password?
                </p>
              </div>
            )}
          </div>
        </div>

        {showForgotPasswordModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>🔒 Reset Your Password</h3>
              <p style={{ fontSize: "13px", marginBottom: "12px" }}>
                Enter your registered email and we'll send you a reset link.
              </p>
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "8px",
                  borderRadius: "8px",
                  border: "1px solid var(--secondary)",
                  fontFamily: "Quicksand, sans-serif",
                }}
              />
              {resetError && <p style={{ color: "red", fontSize: "13px" }}>{resetError}</p>}
              {resetMessage && <p style={{ color: "green", fontSize: "13px" }}>{resetMessage}</p>}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
                <button onClick={handleForgotPassword} className="primary-btn">
                  Send Reset Link
                </button>
                <button
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="secondary-btn"
                  style={{
                    backgroundColor: "#f5f5f5",
                    color: "#333",
                    border: "1px solid #ccc",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    fontFamily: "Quicksand, sans-serif",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Advisor Criteria Modal */}
        {showAdvisorCriteria && (
          <div
            className="modal-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "20px",
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "24px",
                maxWidth: "420px",
                width: "100%",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
                border: "1px solid #e8ddd6",
                position: "relative",
                animation: "slideUp 0.3s ease-out",
              }}
            >
              {/* Close X button */}
              <button
                onClick={handleAdvisorCriteriaCancel}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#8d6e63",
                  padding: "4px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f5f2f0"
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent"
                }}
              >
                <X size={18} />
              </button>

              {/* Header */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: "#8d6e63",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px auto",
                    boxShadow: "0 6px 20px rgba(141, 110, 99, 0.3)",
                  }}
                >
                  <Users size={24} color="white" />
                </div>
                <h3
                  style={{
                    margin: "0 0 6px 0",
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#4a352f",
                    fontFamily: "Quicksand, sans-serif",
                  }}
                >
                  Become a BIG Marketplace Advisor
                </h3>
                <p
                  style={{
                    margin: "0",
                    fontSize: "13px",
                    color: "#7d5a50",
                    lineHeight: "1.4",
                    fontFamily: "Quicksand, sans-serif",
                  }}
                >
                  Confirm you meet these minimum requirements:
                </p>
              </div>

              {/* Criteria List - Compact */}
              <div
                style={{
                  marginBottom: "18px",
                }}
              >
                {[
                  "Bachelor's degree or equivalent professional certification",
                  "At least 5 years of professional SME experience",
                  "No criminal convictions or professional misconduct",
                  "Passion for supporting SMEs with ethical advice",
                  "Able to provide 2 professional references",
                ].map((criterion, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 12px",
                      backgroundColor: "#faf7f2",
                      border: "1px solid #e8ddd6",
                      borderRadius: "8px",
                      marginBottom: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        backgroundColor: "#8d6e63",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ color: "white", fontSize: "10px", fontWeight: "bold" }}>✓</span>
                    </div>
                    <span
                      style={{
                        color: "#4a352f",
                        fontFamily: "Quicksand, sans-serif",
                        fontSize: "13px",
                        lineHeight: "1.3",
                      }}
                    >
                      {criterion}
                    </span>
                  </div>
                ))}
              </div>

              {/* Confirmation */}
              <div
                style={{
                  backgroundColor: "#f0e6d9",
                  border: "1px solid #c8b6a6",
                  borderRadius: "10px",
                  padding: "12px",
                  marginBottom: "18px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    margin: "0",
                    fontSize: "12px",
                    color: "#6d4c41",
                    lineHeight: "1.4",
                    fontFamily: "Quicksand, sans-serif",
                  }}
                >
                  By clicking "I Accept", you confirm meeting these requirements and agree to BIG Marketplace's Advisor
                  Code of Conduct.
                </p>
              </div>

              {/* Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={handleAdvisorCriteriaAccept}
                  style={{
                    backgroundColor: "#8d6e63",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: "Quicksand, sans-serif",
                    transition: "all 0.2s ease",
                    boxShadow: "0 3px 10px rgba(141, 110, 99, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#6d4c41"
                    e.target.style.transform = "translateY(-1px)"
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#8d6e63"
                    e.target.style.transform = "translateY(0)"
                  }}
                >
                  I Accept
                </button>
                <button
                  onClick={handleAdvisorCriteriaCancel}
                  style={{
                    backgroundColor: "transparent",
                    color: "#8d6e63",
                    border: "2px solid #8d6e63",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: "Quicksand, sans-serif",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#f5f2f0"
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent"
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Updated Role Selection Modal */}
        {roleSelectionModal.show && (
          <div
            className="modal-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "20px",
            }}
          >
            <div
              className="dashboard-selection-modal"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "32px",
                maxWidth: "480px",
                width: "100%",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
                border: "1px solid #e8ddd6",
                position: "relative",
                animation: "slideUp 0.3s ease-out",
              }}
            >
              {/* Close X button */}
              <button
                onClick={() => setRoleSelectionModal({ show: false, roles: [] })}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#8d6e63",
                  padding: "4px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f5f2f0"
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent"
                }}
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "28px",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    backgroundColor: "#8d6e63",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px auto",
                    boxShadow: "0 8px 24px rgba(141, 110, 99, 0.3)",
                  }}
                >
                  <Users size={28} color="white" />
                </div>
                <h3
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#4a352f",
                    fontFamily: "Quicksand, sans-serif",
                  }}
                >
                  Choose Dashboard
                </h3>
                <p
                  style={{
                    margin: "0",
                    fontSize: "15px",
                    color: "#7d5a50",
                    lineHeight: "1.5",
                    fontFamily: "Quicksand, sans-serif",
                  }}
                >
                  You have multiple roles. Select which dashboard you'd like to access.
                </p>
              </div>

              {/* Role Options */}
             <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "24px",
  }}
>
{roleSelectionModal.roles.map((r, index) => {
  const isDeleted = r.deletedStatus || false;
  const daysAgo = isDeleted && r.deletedAt
    ? Math.floor((Date.now() - r.deletedAt) / (1000 * 60 * 60 * 24))
    : null;
  // Ensure r is always an object with name + deletedStatus
  const roleObj = typeof r === "string" ? { name: r, deletedStatus: false } : r;

  return (
    <button
      key={roleObj.name || index}
  onClick={() => {
  if (isDeleted) {
    // Save the clicked role so RetrieveAccount knows which one to retrieve
    localStorage.setItem("selectedDeletedRole", JSON.stringify(r));
    window.location.href = "/RetrieveAccount"; // navigate to your retrieve page
  } else {
    // Ensure r is an object with name and deletedStatus
    const roleObj = typeof r === "string" ? { name: r, deletedStatus: false } : r;
    handleRoleClick(roleObj); // normal active role navigation
  }
}}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "16px 20px",
        backgroundColor: "#faf7f2",
        border: "2px solid #e8ddd6",
        borderRadius: "12px",
        cursor: "pointer",
        fontFamily: "Quicksand, sans-serif",
        fontSize: "16px",
        fontWeight: "600",
        color: "#4a352f",
        width: "100%",
        opacity: isDeleted ? 0.6 : 1,
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        if (!isDeleted) {
          e.currentTarget.style.backgroundColor = "#f0e6d9";
          e.currentTarget.style.borderColor = "#c8b6a6";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(141, 110, 99, 0.15)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isDeleted) {
          e.currentTarget.style.backgroundColor = "#faf7f2";
          e.currentTarget.style.borderColor = "#e8ddd6";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          backgroundColor: "#8d6e63",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          flexShrink: 0,
        }}
      >
        {getRoleIcon(r.name)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "2px" }}>
          {getRoleDashboardName(r.name)}
        </div>
        <div style={{ fontSize: "13px", color: "#7d5a50", fontWeight: "500" }}>
          {isDeleted
            ? `Deleted ${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`
            : getRoleDescription(r.name)}
        </div>
      </div>
      <div style={{ color: "#8d6e63", opacity: 0.7 }}>→</div>
    </button>
  );
})}


</div>

{/* Info Note */}
<div
  style={{
    backgroundColor: "#f0e6d9",
    border: "1px solid #c8b6a6",
    borderRadius: "10px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  }}
>
  <div
    style={{
      width: "20px",
      height: "20px",
      backgroundColor: "#8d6e63",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      marginTop: "1px",
    }}
  >
    <span style={{ color: "white", fontSize: "12px", fontWeight: "bold" }}>i</span>
  </div>
  <p
    style={{
      margin: "0",
      fontSize: "13px",
      color: "#6d4c41",
      lineHeight: "1.4",
      fontFamily: "Quicksand, sans-serif",
    }}
  >
    <strong>Tip:</strong> You can always switch between dashboards by clicking your profile picture in the header.
  </p>
</div>

            </div>
          </div>
        )}

        {/* Updated welcome-side with conditional alignment */}
        <div className={`welcome-side ${isRegistering ? "top-aligned" : ""}`}>
          <div className="welcome-content">
            <h1>Welcome Home!</h1>
            <p>
              Delivering integrated solutions through expert consulting, market access, investor connections, and
              impactful community engagement.
            </p>
            <div className="welcome-features">
              <div className="welcome-feature">
                <Rocket size={20} className="feature-icon" />
                <span>BIG on Ideas</span>
              </div>
              <div className="welcome-feature">
                <HeartHandshake size={20} className="feature-icon" />
                <span>BIG on Growth</span>
              </div>
              <div className="welcome-feature">
                <Briefcase size={20} className="feature-icon" />
                <span>BIG on Impact</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NDA Popup Component */}
      {showNDA && registrationData && (
        <NDASignupPopup registrationData={registrationData} onRegistrationComplete={handleRegistrationComplete} />
      )}

      {/* Custom CSS for animations and hover effects */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
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
      `}</style>
    </div>
  )
}