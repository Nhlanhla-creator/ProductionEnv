"use client";
import { useState, useEffect } from "react";
import "./LoginRegister.css";
import RetrieveAccount from "./RetrieveAccount.js";
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
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { onAuthStateChanged, deleteUser } from "firebase/auth";
import NDASignupPopup from "../NDAsign";
import TermsConditionsCheckbox from "./Ts&cs";
import FormInput from "./FormInput";
import RoleCard from "./RoleCard";
import AdvisorCriteriaModal from "./AdvisorCriteriaModal";

// Role cards configuration
const ROLE_CARDS = [
  {
    id: "SMSEs",
    title: "Small Medium and Social Enterprise",
    icon: <Briefcase size={20} />,
    hoverInfo:
      "Access funding opportunities to accelerate your growth journey.",
  },
  {
    id: "Investor",
    title: "Funder/Investors",
    icon: <TrendingUp size={20} />,
    hoverInfo:
      "Discover investment opportunities, connect with promising startups",
  },
  {
    id: "Interns",
    title: "Interns",
    icon: <GraduationCap size={20} />,
    hoverInfo: "Gain valuable experience, learn from industry experts",
  },
  {
    id: "Advisors",
    title: "Advisor",
    icon: <Users size={20} />,
    hoverInfo: "Offer your expertise to growing businesses",
  },
  {
    id: "Accelerators",
    title: "Catalyst",
    icon: <Building2 size={20} />,
    hoverInfo: "Connect with innovative startups, provide mentorship",
  },
  {
    id: "ProgramSponsor",
    title: "Program Sponsor",
    icon: <Award size={20} />,
    hoverInfo: "Offer jobs to interns, support entrepreneurial programs",
  },
];

// Error message mapping
const ERROR_MESSAGES = {
  "auth/invalid-credential": "❌ Invalid email or password. Please try again.",
  "auth/wrong-password": "❌ Invalid email or password. Please try again.",
  "auth/user-not-found": "❌ Invalid email or password. Please try again.",
  "auth/email-already-in-use":
    "📧 This email is already registered. Try logging in or resetting your password.",
  "auth/weak-password": "🔒 Password should be at least 6 characters.",
  "auth/invalid-email": "📧 Please enter a valid email address.",
  "auth/user-disabled":
    "🚫 This account has been disabled. Please contact support.",
  "auth/too-many-requests": "⏳ Too many attempts. Please try again later.",
  "auth/network-request-failed":
    "📡 Network error. Please check your connection.",
  "auth/operation-not-allowed":
    "⚙️ This operation is not allowed. Please contact support.",
  "auth/requires-recent-login":
    "🔐 Please log in again to complete this action.",
  "permission-denied": "🚫 You don't have permission to perform this action.",
  "not-found": "🔍 Requested data not found.",
  unavailable: "🔄 Service temporarily unavailable. Please try again.",
};

export default function LoginRegister() {
  const navigate = useNavigate();
  const location = useLocation();

  // State declarations
  const [isRegistering, setIsRegistering] = useState(
    new URLSearchParams(location.search).get("mode") === "login"
  );
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roles, setRoles] = useState([]);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [showNDA, setShowNDA] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [ndaComplete, setNdaComplete] = useState(false);
  const [showAdvisorCriteria, setShowAdvisorCriteria] = useState(false);
  const [roleSelectionModal, setRoleSelectionModal] = useState({
    show: false,
    roles: [],
  });
  const [resumingRegistration, setResumingRegistration] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Utility functions
  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const getCustomErrorMessage = (error) => {
    if (!error?.code)
      return "🔧 An unexpected error occurred. Please try again.";
    return (
      ERROR_MESSAGES[error.code] || "❌ Something went wrong. Please try again."
    );
  };

  const getRoleIcon = (roleValue) => {
    const iconMap = {
      "Small and Medium Social Enterprises": <Briefcase size={16} />,
      SMSEs: <Briefcase size={16} />,
      SMSE: <Briefcase size={16} />,
      SMEs: <Briefcase size={16} />,
      Investor: <Rocket size={16} />,
      Advisors: <Users size={16} />,
      Accelerators: <Building2 size={16} />,
      Catalyst: <Building2 size={16} />,
      Interns: <GraduationCap size={16} />,
      ProgramSponsor: <Award size={16} />,
       Admin: <TrendingUp size={16} />
    };
    return iconMap[roleValue] || <Smile size={16} />;
  };

  const navigateToRoleDashboard = (role) => {
    const routeMap = {
      Investor: "/investor-profile",
      INVESTOR: "/investor-profile",
      "Small and Medium Social Enterprises": "/profile",
      SMSEs: "/profile",
      SMSE: "/profile",
      SMEs: "/profile",
      "SME/BUSINESS": "/profile",
      Advisors: "/advisor-profile",
      ADVISOR: "/advisor-profile",
      Accelerators: "/support-profile",
      Catalyst: "/support-profile",
      Interns: "/intern-profile",
      INTERN: "/intern-profile",
      ProgramSponsor: "/program-sponsor-profile",
      PROGRAM_SPONSOR: "/program-sponsor-profile",
      // admin
       Admin: "/admin/dashboard",
    admin: "/admin/dashboard",
    ADMIN: "/admin/dashboard",
    };
    navigate(routeMap[role] || "/auth");
  };

  // Event handlers
  const handleRoleSelect = (roleId) => {
    if (roleId === "Advisors") {
      setShowAdvisorCriteria(true);
      return;
    }
    setRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId]
    );
    setErrors((prev) => ({ ...prev, role: "" }));
  };

  const handleAdvisorCriteriaAccept = () => {
    setShowAdvisorCriteria(false);
    setRoles((prev) =>
      prev.includes("Advisors")
        ? prev.filter((r) => r !== "Advisors")
        : [...prev, "Advisors"]
    );
    setErrors((prev) => ({ ...prev, role: "" }));
  };

  const handleForgotPassword = async () => {
    setResetMessage("");
    setResetError("");

    if (!validateEmail(resetEmail)) {
      setResetError("Enter a valid email address.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("✅ Reset link sent! Check your inbox.");
      setResetEmail("");
    } catch (error) {
      console.error("Reset error:", error);
      setResetError(getCustomErrorMessage(error));
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    const newErrors = {};

    if (!validateEmail(email)) newErrors.email = "Enter your email";
    if (username.trim() === "") newErrors.username = "Enter your username";
    if (password.length < 6)
      newErrors.password = "Password should be (at least 6 characters)";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match!";
    if (roles.length === 0) newErrors.role = "Please select at least one role.";
    if (!agreeToTerms)
      newErrors.terms = "Please agree to the Terms & Conditions";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    setErrors({});
    setAuthError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await sendEmailVerification(user);
      setCodeSent(true);

      const ndaData = {
        email,
        username,
        role: roles.join(","),
        roleArray: roles,
        password,
        uid: user.uid,
        termsAccepted: true,
        termsAcceptedDate: new Date().toISOString(),
      };
      setRegistrationData(ndaData);
    } catch (error) {
      console.error("Registration error:", error);
      setAuthError(getCustomErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setErrors({});
    setAuthError("");

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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setAuthError(
          "Registration incomplete. Please complete your registration."
        );
        setResumingRegistration(true);
        setIsRegistering(true);
        setCodeSent(true);

        setRegistrationData({
          email: user.email,
          username: "",
          uid: user.uid,
          termsAccepted: false,
          termsAcceptedDate: null,
          roleArray: [],
        });

        setShowNDA(true);
        setIsLoading(false);
        return;
      }

      const userData = userDocSnap.data();
      let activeRoles = [];
      let deletedRoles = [];

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

      if (Array.isArray(userData.roleArray)) {
        userData.roleArray.forEach((r) => {
          if (!activeRoles.find((ar) => ar.name === r)) {
            activeRoles.push({ name: r });
          }
        });
      }

      if (typeof userData.role === "string") {
        userData.role.split(",").forEach((r) => {
          const roleName = r.trim();
          if (!activeRoles.find((ar) => ar.name === roleName)) {
            activeRoles.push({ name: roleName });
          }
        });
      }

      const allRoles = [...activeRoles, ...deletedRoles];
      setRoleSelectionModal({ show: true, roles: allRoles });

      if (activeRoles.length === 1) {
        setRoleSelectionModal({ show: false, roles: [] });
        navigateToRoleDashboard(activeRoles[0].name);
      }

      if (activeRoles.length === 0 && deletedRoles.length > 0) {
        navigate("/RetrieveAccount", {
          state: { roleToRetrieve: deletedRoles[0].name },
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(getCustomErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setCheckingVerification(true);
    setErrors({});

    try {
      await auth.currentUser.reload();
      const user = auth.currentUser;

      if (user.emailVerified) {
        setIsEmailVerified(true);
        setShowNDA(true);
      } else {
        setErrors({
          verificationCode:
            "Please verify your email first. Check your inbox and click the verification link.",
        });
      }
    } catch (error) {
      console.error("Verification check error:", error);
      setErrors({
        verificationCode:
          "Error checking verification status. Please try again.",
      });
    } finally {
      setCheckingVerification(false);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setAuthError("Verification email sent! Please check your inbox.");
      }
    } catch (error) {
      console.error("Error resending verification:", error);
      setAuthError(getCustomErrorMessage(error));
    }
  };

  // Add these helper functions at the end of the file

const getRoleDashboardName = (role) => {
  const dashboardMap = {
    "Small and Medium Social Enterprises": "SMSEs Dashboard",
    SMSEs: "SMSEs Dashboard",
    SMSE: "SMSEs Dashboard",
    SME: "SMSEs Dashboard",
    "SME/BUSINESS": "SMSEs Dashboard",
    Investor: "Investor Dashboard",
    Advisors: "Advisor Dashboard",
    Accelerators: "Catalyst Dashboard",
    Catalyst: "Catalyst Dashboard",
    Interns: "Intern Dashboard",
    ProgramSponsor: "Program Sponsor Dashboard",
//admin
     Admin: "Admin Dashboard",
    admin: "Admin Dashboard",
    ADMIN: "Admin Dashboard",
  };
  return dashboardMap[role] || role;
};

const getRoleDescription = (role) => {
  const descriptionMap = {
    "Small and Medium Social Enterprises":
      "Access funding, growth tools, and partnerships",
    SMSEs: "Access funding, growth tools, and partnerships",
    SMSE: "Access funding, growth tools, and partnerships",
    SME: "Access funding, growth tools, and partnerships",
    Investor: "Discover investment opportunities and manage portfolio",
    Advisors: "Connect with businesses and offer expertise",
    Accelerators: "Support startups and drive innovation",
    Catalyst: "Support startups and drive innovation",
    Interns: "Access internship opportunities and career development",
    ProgramSponsor: "Manage intern programs and track placements",
    //admin
      Admin: "Manage platform users, settings, and analytics",
    admin: "Manage platform users, settings, and analytics",
  };
  return descriptionMap[role] || "Access your dashboard";
};

// Add handleRegistrationComplete function
const handleRegistrationComplete = async (ndaData) => {
  if (ndaData.cancelled) {
    setShowNDA(false);
    if (auth.currentUser) {
      try {
        await deleteUser(auth.currentUser);
        setAuthError("Registration cancelled. Your account has been removed.");
        setEmail("");
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setRoles([]);
        setCodeSent(false);
        setRegistrationData(null);
        setAgreeToTerms(false);
      } catch (error) {
        console.error("Error deleting user account:", error);
        setAuthError(
          "Registration cancelled, but there was an error cleaning up. Please contact support."
        );
      }
    }
    return;
  }

  try {
    if (!auth.currentUser) {
      setAuthError("User authentication lost. Please try again.");
      return;
    }

    if (!username || username.trim() === "") {
      setAuthError("Please provide a username to complete registration.");
      setShowNDA(false);
      return;
    }

    if (roles.length === 0) {
      setAuthError("Please select at least one role to complete registration.");
      setShowNDA(false);
      return;
    }

    if (!agreeToTerms) {
      setAuthError(
        "Please agree to the Terms & Conditions to complete registration."
      );
      setShowNDA(false);
      return;
    }

    const finalUsername = username.trim();

    await setDoc(doc(db, "users", auth.currentUser.uid), {
      email: email,
      username: finalUsername,
      role: roles.join(","),
      roleArray: roles,
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
      registrationCompleted: true,
    });

    setNdaComplete(true);
    setShowNDA(false);

    if (roles.length > 1) {
      setRoleSelectionModal({ show: true, roles: roles });
    } else {
      navigateToRoleDashboard(roles[0]);
    }
  } catch (error) {
    console.error("Error saving user data:", error);
    setAuthError(getCustomErrorMessage(error));
  }
};

const handleAdvisorCriteriaCancel = () => {
  setShowAdvisorCriteria(false);
};

  // Effects
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsEmailVerified(user.emailVerified);
      } else {
        setIsEmailVerified(false);
      }
    });
    return () => unsubscribe();
  }, [isRegistering]);

  useEffect(() => {
    const checkIncompleteRegistration = async () => {
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          setResumingRegistration(true);
          setIsRegistering(true);
          setCodeSent(true);

          setEmail(auth.currentUser.email || "");
          setRegistrationData({
            email: auth.currentUser.email,
            username: "",
            uid: auth.currentUser.uid,
            termsAccepted: false,
            termsAcceptedDate: null,
            roleArray: [],
          });
          setShowNDA(true);
        }
      }
    };
    checkIncompleteRegistration();
  }, [auth.currentUser]);

  useEffect(() => {
    setAuthError("");
  }, [isRegistering]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && !isLoading) {
        if (!isRegistering) {
          handleLogin();
        } else if (!codeSent) {
          handleRegister();
        } else if (codeSent && !isEmailVerified) {
          handleVerify();
        }
      }

      if (e.key === "Escape") {
        if (showForgotPasswordModal) setShowForgotPasswordModal(false);
        if (showAdvisorCriteria) setShowAdvisorCriteria(false);
        if (roleSelectionModal.show)
          setRoleSelectionModal({ show: false, roles: [] });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isRegistering, codeSent, isLoading]);

  // Render functions
  const renderRoleSelectionModal = () => {
    if (!roleSelectionModal.show) return null;

    return (
      <div className="modal-overlay">
        <div className="dashboard-selection-modal">
          <button
            className="modal-close"
            onClick={() => setRoleSelectionModal({ show: false, roles: [] })}
          >
            <X size={20} />
          </button>

          <div className="modal-header">
            <div className="modal-icon">
              <Users size={28} color="white" />
            </div>
            <h3>Choose Dashboard</h3>
            <p>
              You have multiple roles. Select which dashboard you'd like to
              access.
            </p>
          </div>

          <div className="role-options">
            {roleSelectionModal.roles.map((r, index) => {
              const isDeleted = r.deletedStatus || false;
              const daysAgo =
                isDeleted && r.deletedAt
                  ? Math.floor(
                      (Date.now() - r.deletedAt) / (1000 * 60 * 60 * 24)
                    )
                  : null;

              const roleObj =
                typeof r === "string" ? { name: r, deletedStatus: false } : r;

              return (
                <button
                  key={roleObj.name || index}
                  className={`role-option ${isDeleted ? "deleted" : ""}`}
                  onClick={() => {
                    if (isDeleted) {
                      localStorage.setItem(
                        "selectedDeletedRole",
                        JSON.stringify(r)
                      );
                      window.location.href = "/RetrieveAccount";
                    } else {
                      navigateToRoleDashboard(roleObj.name);
                    }
                  }}
                >
                  <div className="role-option-icon">{getRoleIcon(r.name)}</div>
                  <div className="role-option-info">
                    <div className="role-option-name">
                      {getRoleDashboardName(r.name)}
                    </div>
                    <div className="role-option-description">
                      {isDeleted
                        ? `Deleted ${daysAgo} day${
                            daysAgo !== 1 ? "s" : ""
                          } ago`
                        : getRoleDescription(r.name)}
                    </div>
                  </div>
                  <div className="role-option-arrow">→</div>
                </button>
              );
            })}
          </div>

          <div className="info-note">
            <div className="info-icon">i</div>
            <p>
              <strong>Tip:</strong> You can always switch between dashboards by
              clicking your profile picture in the header.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderForgotPasswordModal = () => {
    if (!showForgotPasswordModal) return null;

    return (
      <div className="modal-overlay">
        <div className="forgot-password-modal">
          <h3>Reset Your Password</h3>
          <p>Enter your registered email and we'll send you a reset link.</p>

          <input
            type="email"
            placeholder="Enter your email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
          />

          {resetError && <p className="error-text">{resetError}</p>}
          {resetMessage && <p className="success-text">{resetMessage}</p>}

          <div className="modal-actions">
            <button className="primary-btn" onClick={handleForgotPassword}>
              Send Reset Link
            </button>
            <button
              className="secondary-btn"
              onClick={() => setShowForgotPasswordModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderVerificationStep = () => (
    <div className="form-step">
      <div className="verification-message">
        <p>✨ We sent a verification link to your email! ✨</p>
        <p>
          Please check your inbox and click the verification link, then click
          "I've verified my email" below.
        </p>
      </div>

      {errors.verificationCode && (
        <p className="error-text">{errors.verificationCode}</p>
      )}

      <button
        className="primary-btn verify-btn"
        onClick={handleVerify}
        disabled={checkingVerification}
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

      <button className="secondary-btn" onClick={resendVerificationEmail}>
        Resend verification email
      </button>
    </div>
  );

  const renderRegisterForm = () => (
    <form
      className="form-step"
      onSubmit={(e) => {
        e.preventDefault();
        handleRegister();
      }}
    >
      <FormInput
        type="text"
        placeholder="Your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        icon={User}
        error={errors.username}
      />

      <FormInput
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={Mail}
        error={errors.email}
      />

      <FormInput
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={Lock}
        error={errors.password}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
      />

      <FormInput
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        icon={Lock}
        error={errors.confirmPassword}
        showPassword={showConfirmPassword}
        onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
      />

      <div className="role-selection">
        <label>I am a:</label>
        <div className="role-cards-grid">
          {ROLE_CARDS.map((card) => (
            <RoleCard
              key={card.id}
              {...card}
              isSelected={roles.includes(card.id)}
              onClick={handleRoleSelect}
            />
          ))}
        </div>
        {errors.role && <p className="error-text">{errors.role}</p>}
      </div>

      <TermsConditionsCheckbox
        agreeToTerms={agreeToTerms}
        setAgreeToTerms={setAgreeToTerms}
        error={errors.terms}
      />

      <button type="submit" className="primary-btn" disabled={isLoading}>
        {isLoading ? (
          <span className="loading-button">
            <Loader2 className="animate-spin" size={16} />
            Creating Account...
          </span>
        ) : (
          <>
            Create Account <Rocket size={16} />
          </>
        )}
      </button>
    </form>
  );

  const renderLoginForm = () => (
    <form
      className="form-step"
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
    >
      <FormInput
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={Mail}
        error={errors.email}
      />

      <FormInput
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={Lock}
        error={errors.password}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
      />

      <button type="submit" className="primary-btn" disabled={isLoading}>
        {isLoading ? (
          <span className="loading-button">
            <Loader2 className="animate-spin" size={16} />
            Logging in...
          </span>
        ) : (
          <>
            Login! <Smile size={16} />
          </>
        )}
      </button>
    </form>
  );

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="form-side">
          <div className="form-header">
            <h2>{isRegistering ? "Create Your Account!" : "Welcome Back!"}</h2>
            <div
              className={`icon-container ${
                isRegistering ? "register" : "login"
              }`}
            >
              {isRegistering ? <Rocket size={24} /> : <Smile size={24} />}
            </div>
          </div>

          {authError && <div className="auth-error">{authError}</div>}

          <div className="form-box">
            {isRegistering
              ? codeSent
                ? renderVerificationStep()
                : renderRegisterForm()
              : renderLoginForm()}
          </div>

          <p className="switch-link">
            {isRegistering ? (
              <>
                "Already a member of the BIG Circle"?{" "}
                <span onClick={() => setIsRegistering(false)}>Login</span>
              </>
            ) : (
              <>
                New to the family?{" "}
                <span onClick={() => setIsRegistering(true)}>Join us!</span>
              </>
            )}
          </p>

          {!isRegistering && (
            <p
              className="forgot-password-link"
              onClick={() => setShowForgotPasswordModal(true)}
            >
              Forgot your password?
            </p>
          )}
        </div>

        {/* Welcome Side */}
        <div className={`welcome-side ${isRegistering ? "top-aligned" : ""}`}>
          <div className="welcome-content">
            <h1>Welcome Home!</h1>
            <p>
              Delivering integrated solutions through expert consulting, market
              access, investor connections, and impactful community engagement.
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

      {/* Modals */}
      {showAdvisorCriteria && (
        <AdvisorCriteriaModal
          onAccept={handleAdvisorCriteriaAccept}
          onCancel={handleAdvisorCriteriaCancel}
        />
      )}

      {renderForgotPasswordModal()}
      {renderRoleSelectionModal()}

      {/* NDA Popup */}
      {showNDA && registrationData && (
        <NDASignupPopup
          registrationData={registrationData}
          onRegistrationComplete={handleRegistrationComplete}
        />
      )}
    </div>
  );
}

