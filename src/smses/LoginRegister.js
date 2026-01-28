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
const [termsAcceptanceTimestamp, setTermsAcceptanceTimestamp] = useState(null);

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
// 1. Fix handleRegister - Don't show NDA immediately, wait for email verification
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
    newErrors.terms = "Please agree to the Terms & Conditions and Mutual NDA";

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
  } catch (error) {
    console.error("Registration error:", error);
    setAuthError(getCustomErrorMessage(error));
  } finally {
    setIsLoading(false);
  }
};

// Update handleVerify - save T&Cs document and redirect

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

    await new Promise(resolve => setTimeout(resolve, 100));
    await user.reload();
    const refreshedUser = auth.currentUser;
    
    // FIXED: UNCOMMENT email verification check
    if (refreshedUser.emailVerified) {
      setAuthError("Please verify your email before logging in. Check your inbox for the verification link.");
      await auth.signOut(); // Sign out unverified user
      setIsLoading(false);
      return;
    }

    // Email is verified, continue with normal login flow
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      setAuthError("Registration incomplete. Please complete your registration.");
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
        role: "", // Add role field
      });

    
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

    if (user) {
      setIsEmailVerified(true);
      
      // Full T&Cs and NDA text content
      const termsAndNDAContent = `
BIG MARKETPLACE – PLATFORM TERMS & CONDITIONS AND MUTUAL NDA

Effective Date: ${new Date().toLocaleDateString()}
Applies To: All Registered Users (SMEs, Funders, Service Providers, Corporates, Accelerators, and Interns)

PART A: MUTUAL NON-DISCLOSURE AGREEMENT (NDA)

1. Purpose
This Mutual NDA governs the protection and non-disclosure of Confidential Information exchanged between BIG Marketplace users and between each user and Brown Ivory Group Proprietary Limited ("BIG").

2. Definition of Confidential Information
"Confidential Information" includes, but is not limited to: business plans, financial information, funding requirements, investment terms, product/service data, IP, customer data, documents, and any non-public business or personal data disclosed via the platform or through follow-up communications.

3. Mutual Obligations
All parties agree to:
- Keep Confidential Information strictly confidential.
- Use it solely for evaluation or engagement within the BIG Marketplace platform.
- Not disclose it to third parties except employees or advisors who are bound by similar confidentiality obligations.

4. Permitted Disclosures
Information may be disclosed:
- To advisors who have a need to know.
- As required by law or legal process (with notice to the disclosing party).
- If already in the public domain or lawfully obtained from another source.

5. Duration
This NDA is valid:
- For two years from date of last disclosure on the platform, or
- Until the Confidential Information becomes publicly available through no fault of the receiving party.

6. Data Protection
All users agree to comply with applicable data protection laws, including POPIA. Personal Information may not be misused, shared, or processed outside the intended platform purpose without explicit consent.

7. Return or Destruction
Upon written request, users must return or delete any Confidential Information shared with them via the platform.

8. No License or IP Rights
No rights to Confidential Information or underlying IP are granted by this NDA.

9. Breach & Enforcement
Violation of this NDA may result in:
- Removal from the BIG Marketplace platform,
- Legal action and damages, and
- Blacklisting from the ecosystem.

PART B: PLATFORM TERMS & CONDITIONS

1. Introduction & Acceptance
1.1. By registering on BIG Marketplace, you agree to these Terms & Conditions and the accompanying Mutual NDA.
1.2. These terms govern the use of the BIG Marketplace platform, a trust-based ecosystem designed to match high-impact businesses with funders, service providers, and growth enablers.
1.3. All users agree to act in good faith and uphold the integrity, confidentiality, and accountability standards of the platform.

2. Universal User Responsibilities
2.1. Maintain complete, truthful, and current profile information.
2.2. Acknowledge and respect the platform's deal flow lifecycle by updating the status of every interaction (e.g., matched, declined, in negotiation, term sheet signed).
2.3. Do not engage with any party introduced via BIG Marketplace outside the platform in order to avoid fees or visibility.
2.4. Accept that BIG Marketplace reserves the right to audit usage logs and communication records where misconduct or circumvention is suspected.

3. SMEs (Small & Medium Enterprises)
3.1. Undergo BIG Score pre-vetting based on financials, operations, governance, and growth potential.
3.2. Upload necessary documentation (e.g., CIPC docs, tax clearance, financials).
3.3. Accurately update deal status, including:
- "Declined" with reason
- "Term Sheet Signed" with supporting document
- "Deal Finalized"
3.4. Acknowledge that participation in funded engagements or provider relationships may be subject to verification.

4. Funders / Investors
4.1. Agree to a standard 3% commission fee on all funding deals concluded with SMEs introduced via the platform.
4.2. Fee Triggers:
- Triggered upon term sheet signing or equivalent contractual commitment.
- Payable within 30 days of deal finalisation.
- Applies to all funding types (grants, equity, loans, convertible notes).
4.3. Obligations:
- Update all deal statuses throughout the lifecycle.
- Upload executed term sheets.
- Refrain from bypassing platform communication or execution.

5. Service Providers
5.1. May be listed on the platform following vetting (as applicable).
5.2. Agree to pay a referral or success fee on new SME engagements sourced through BIG Marketplace, if and when a commercial transaction occurs.
5.3. Commit to:
- Delivering services aligned with scope and professional ethics
- Participating in quality reviews and satisfaction ratings
- Not circumventing the platform once matched with a business

6. Corporates / Accelerators / Incubators
6.1. May access the SME database via:
- Monthly or annual enterprise subscription
- API integration (where technically feasible and contractually agreed)
6.2. Agree to:
- Mark all SME engagements with outcomes (e.g., shortlisted, accepted into program, declined).
- Participate in platform usage reviews and engagement tracking.
6.3. Fees:
- No success-based commission is charged unless separately agreed upon.
- Customized pricing and licensing may apply for premium features (e.g., scoring access, custom filters, analytics dashboards).
6.4. Corporates engaging SMEs for ESD/CSR/Procurement purposes must:
- Respect the pre-vetting system
- Provide updates on funded or contracted SMEs
- Use data only for permitted sourcing activities (no data scraping, resale, or off-platform marketing)

7. Data Usage, Privacy & Confidentiality
7.1. All users are bound by the Mutual Non-Disclosure Agreement (Part A) and data privacy regulations (POPIA/GDPR compliant).
7.2. BIG Marketplace will not share confidential user data without consent, except to facilitate matchmaking or regulatory compliance.
7.3. The platform may use anonymized or aggregated data to improve AI matching, user experience, and market insights.

8. Breach & Dispute Resolution
8.1. Any form of circumvention, data misuse, or failure to pay applicable fees constitutes a material breach.
8.2. Breaches may result in:
- Immediate account suspension
- Legal action to recover fees or damages
- Blacklisting from the platform
8.3. Disputes shall be resolved first via internal mediation. If unresolved, disputes will be referred to arbitration under South African commercial law.

9. Amendments & Acceptance
9.1. BIG Marketplace may amend these terms periodically.
9.2. Users will be notified of changes and must accept updated terms to continue using the platform.

FINAL ACKNOWLEDGEMENT
By using this platform, you confirm that you:
- Have read and understood these Terms & Conditions and the Mutual NDA
- Agree to be bound by them
- Agree to maintain confidentiality of all information shared on the platform
- Acknowledge the fee structures and responsibilities applicable to your stakeholder category
      `.trim();
      
      // Save user data with T&Cs acceptance
      const finalRoleString = roles.join(",");
      const acceptanceTimestamp = termsAcceptanceTimestamp || new Date().toISOString();
      
      await setDoc(doc(db, "users", user.uid), {
        email: email,
        username: username,
        role: finalRoleString,
        roleArray: roles,
        termsAccepted: true,
        termsAcceptedDate: acceptanceTimestamp,
        termsVersion: "2.0",
        termsContent: "BIG Marketplace Platform Terms & Conditions and Mutual NDA",
        ndaAccepted: true,
        ndaAcceptedDate: acceptanceTimestamp,
        createdAt: new Date(),
        registrationCompleted: true,
      });

      // Save complete T&Cs acceptance document with full text
      await setDoc(doc(db, "termsAcceptance", user.uid), {
        userInfo: {
          email: email,
          username: username,
          role: finalRoleString,
          roleArray: roles,
        },
        termsAccepted: true,
        ndaAccepted: true,
        acceptanceDate: acceptanceTimestamp,
        termsVersion: "2.0",
        fullTermsContent: termsAndNDAContent, // ADDED: Full T&Cs text
        ipAddress: null, // Can be added if needed
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });

      // Navigate to dashboard
      if (roles.length > 1) {
        setRoleSelectionModal({ show: true, roles: roles });
      } else {
        navigateToRoleDashboard(roles[0]);
      }
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

    const finalUsername = registrationData?.username || username.trim();
    const finalRoles = registrationData?.roleArray || roles;
    const finalRoleString = registrationData?.role || roles.join(",");

    if (!finalUsername || finalUsername === "") {
      setAuthError("Please provide a username to complete registration.");
      setShowNDA(false);
      return;
    }

    if (!finalRoles || finalRoles.length === 0) {
      setAuthError("Please select at least one role to complete registration.");
      setShowNDA(false);
      return;
    }

    if (!agreeToTerms) {
      setAuthError("Please agree to the Terms & Conditions to complete registration.");
      setShowNDA(false);
      return;
    }

    // Save user data with agreement info
    await setDoc(doc(db, "users", auth.currentUser.uid), {
      email: registrationData?.email || email,
      username: finalUsername,
      role: finalRoleString,
      roleArray: finalRoles,
      ndaAgreed: true,
      ndaAgreedDate: new Date().toISOString(),
      termsAccepted: agreeToTerms,
      termsAcceptedDate: new Date().toISOString(),
      createdAt: new Date(),
      termsVersion: "1.0",
      termsContent: "BIG Marketplace Platform Terms & Conditions",
      registrationCompleted: true,
    });

    setNdaComplete(true);
    setShowNDA(false);

    // Navigate to dashboard
    if (finalRoles.length > 1) {
      setRoleSelectionModal({ show: true, roles: finalRoles });
    } else {
      navigateToRoleDashboard(finalRoles[0]);
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
    const user = auth.currentUser;
    if (!user || !user.emailVerified) return;

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      // User verified email but didn't complete registration
      setAuthError("Registration incomplete. Please log out and register again.");
      await auth.signOut();
    }
  };

  checkIncompleteRegistration();
}, [auth.currentUser]);

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
  onAcceptanceTimestampChange={setTermsAcceptanceTimestamp}
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
      {/* {showNDA && registrationData && (
        <NDASignupPopup
          registrationData={registrationData}
          onRegistrationComplete={handleRegistrationComplete}
        />
      )} */}
    </div>
  );
}
