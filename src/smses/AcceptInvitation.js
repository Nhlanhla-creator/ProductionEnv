"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { 
  doc, getDoc, updateDoc, query, 
  where, getDocs, collection, setDoc,
  arrayUnion, limit 
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { 
  Building2, Users, Mail, CheckCircle, 
  User, Lock, AlertTriangle, Loader2,
  ArrowRight, Shield, Key, Briefcase,
  Calendar, Eye, EyeOff, LogIn
} from "lucide-react";

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get("token");
  
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionStep, setActionStep] = useState("view"); // view, login, register
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: ""
  });
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  useEffect(() => {
    const loadInvitation = async () => {
      try {
        if (!token) {
          setError("No invitation token provided.");
          setLoading(false);
          return;
        }
        
        console.log("Loading invitation with token:", token);
        
        // Find invitation by token
        const q = query(
          collection(db, "invitations"),
          where("token", "==", token),
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError("Invalid or expired invitation link.");
          setLoading(false);
          return;
        }
        
        const invitationDoc = querySnapshot.docs[0];
        const invitationData = invitationDoc.data();
        
        // Check if expired
        if (new Date(invitationData.expiresAt) < new Date()) {
          setError("This invitation has expired.");
          setLoading(false);
          return;
        }
        
        // Check if already used
        if (invitationData.status !== 'pending') {
          setError("This invitation has already been used.");
          setLoading(false);
          return;
        }
        
        setInvitation({
          id: invitationDoc.id,
          ...invitationData
        });
        
        // Auto-fill login email
        setLoginData(prev => ({ ...prev, email: invitationData.email }));
        
        setLoading(false);
        
      } catch (err) {
        console.error("Error loading invitation:", err);
        setError("Failed to load invitation. Please check your connection.");
        setLoading(false);
      }
    };
    
    loadInvitation();
  }, [token]);
  
  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setError("Please enter both email and password.");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginData.email,
        loginData.password
      );
      
      const user = userCredential.user;
      
      // Check if logged in user matches invitation email
      if (user.email !== invitation.email) {
        setError(`Please log in with ${invitation.email} to accept this invitation.`);
        setLoading(false);
        return;
      }
      
      // Process the invitation acceptance
      await acceptInvitation(user);
      
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Failed to log in. Please check your credentials.");
      setLoading(false);
    }
  };
  
  const handleRegister = async () => {
    // Validate form
    if (!formData.username.trim()) {
      setError("Please enter a username.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        invitation.email,
        formData.password
      );
      
      const user = userCredential.user;
      
      // Process the invitation acceptance
      await acceptInvitation(user, formData.username);
      
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to create account.");
      setLoading(false);
    }
  };
  
  const acceptInvitation = async (user, username = null) => {
    try {
      // Create user document if it doesn't exist
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create new user document
        await setDoc(userRef, {
          email: invitation.email,
          username: username || user.email.split('@')[0],
          companyId: invitation.companyId,
          userRole: invitation.role,
          roleArray: [invitation.role],
          createdAt: new Date().toISOString(),
          joinedAt: new Date().toISOString(),
          profileComplete: false
        });
      } else {
        // Update existing user document
        await updateDoc(userRef, {
          companyId: invitation.companyId,
          userRole: invitation.role,
          joinedAt: new Date().toISOString(),
          ...(username && { username: username })
        });
        
        // Add role to roleArray if not already present
        const userData = userSnap.data();
        const existingRoles = userData.roleArray || [];
        if (!existingRoles.includes(invitation.role)) {
          await updateDoc(userRef, {
            roleArray: [...existingRoles, invitation.role]
          });
        }
      }
      
      // Update company members list
      const companyRef = doc(db, "companies", invitation.companyId);
      const companySnap = await getDoc(companyRef);
      
      if (companySnap.exists()) {
        const companyData = companySnap.data();
        const members = companyData.members || [];
        
        if (!members.includes(user.uid)) {
          await updateDoc(companyRef, {
            members: arrayUnion(user.uid),
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      // Mark invitation as accepted
      await updateDoc(doc(db, "invitations", invitation.id), {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        acceptedBy: user.uid
      });
      
      setSuccess(`Successfully joined ${invitation.companyName} as ${invitation.role}!`);
      
      // Redirect based on role
      setTimeout(() => {
        const dashboardMap = {
          'owner': '/profile',
          'companyadmin': '/profile',
          'manager': '/profile',
          'employee': '/profile',
          'viewer': '/profile'
        };
        
        navigate(dashboardMap[invitation.role] || '/profile');
      }, 2000);
      
    } catch (err) {
      console.error("Error accepting invitation:", err);
      throw new Error("Failed to process invitation.");
    }
  };
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: '#faf7f2'
      }}>
        <Loader2 size={40} className="animate-spin" color="#a67c52" />
        <p style={{ color: '#6b7280' }}>Loading invitation...</p>
      </div>
    );
  }
  
  if (error && !invitation) {
    return (
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#faf7f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          padding: '2rem',
          textAlign: 'center' 
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <AlertTriangle size={28} color="#dc2626" />
          </div>
          <h2 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Invitation Error</h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>{error}</p>
          <Link 
            to="/"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#a67c52',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#faf7f2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ 
        maxWidth: '500px', 
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#a67c52',
          color: 'white',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <Building2 size={28} />
          </div>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
            Join {invitation?.companyName}
          </h2>
          <p style={{ margin: 0, opacity: 0.9 }}>
            You've been invited as a {invitation?.role}
          </p>
        </div>
        
        {/* Content */}
        <div style={{ padding: '2rem' }}>
          {success ? (
            <div style={{ 
              backgroundColor: '#f0fdf4', 
              color: '#059669',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle size={20} />
              {success}
            </div>
          ) : (
            <>
              {/* Invitation Details Card */}
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  marginBottom: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #e9ecef'
                }}>
                  <Mail size={18} color="#6b7280" />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Email</p>
                    <p style={{ margin: 0, fontWeight: '500', color: '#4a352f' }}>{invitation?.email}</p>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  marginBottom: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #e9ecef'
                }}>
                  <Briefcase size={18} color="#6b7280" />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Role</p>
                    <p style={{ margin: 0, fontWeight: '500', color: '#4a352f' }}>{invitation?.role}</p>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  marginBottom: '1rem' 
                }}>
                  <Shield size={18} color="#6b7280" />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Invited by</p>
                    <p style={{ margin: 0, fontWeight: '500', color: '#4a352f' }}>{invitation?.invitedByName}</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                      {invitation?.invitedByEmail}
                    </p>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e9ecef'
                }}>
                  <Calendar size={18} color="#6b7280" />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Expires</p>
                    <p style={{ margin: 0, fontWeight: '500', color: '#4a352f' }}>
                      {new Date(invitation?.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Action Selection */}
              {actionStep === 'view' ? (
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ 
                    color: '#4a352f', 
                    marginBottom: '1.5rem',
                    fontSize: '1.25rem'
                  }}>
                    How would you like to proceed?
                  </h3>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1rem',
                    marginBottom: '2rem'
                  }}>
                    <button
                      onClick={() => setActionStep('login')}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: '#f8f9fa',
                        color: '#4a352f',
                        border: '2px solid #a67c52',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#a67c52';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#f8f9fa';
                        e.target.style.color = '#4a352f';
                      }}
                    >
                      <LogIn size={18} />
                      I already have an account
                    </button>
                    
                    <button
                      onClick={() => setActionStep('register')}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: '#a67c52',
                        color: 'white',
                        border: '2px solid #a67c52',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#8b6b45'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#a67c52'}
                    >
                      <User size={18} />
                      Create a new account
                    </button>
                  </div>
                  
                  <div style={{ 
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid #e5e7eb',
                    textAlign: 'center'
                  }}>
                    <p style={{ 
                      margin: '0 0 0.5rem 0', 
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      Invitation Code
                    </p>
                    <div style={{
                      backgroundColor: '#f5f5f5',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      letterSpacing: '1px',
                      border: '1px dashed #d1d5db',
                      marginBottom: '0.5rem'
                    }}>
                      {invitation?.token}
                    </div>
                    <p style={{ 
                      margin: '0', 
                      color: '#9ca3af',
                      fontSize: '0.75rem'
                    }}>
                      You can also enter this code during registration
                    </p>
                  </div>
                </div>
              ) : actionStep === 'login' ? (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <button
                      onClick={() => setActionStep('view')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      ← Back
                    </button>
                    <h3 style={{ 
                      color: '#4a352f', 
                      margin: 0,
                      fontSize: '1.25rem'
                    }}>
                      Log In to Accept
                    </h3>
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      color: '#4a352f',
                      fontWeight: '500'
                    }}>
                      <Mail size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      Email
                    </label>
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        backgroundColor: '#fafafa',
                        color: '#4a352f',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      disabled
                    />
                  </div>
                  
                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      color: '#4a352f',
                      fontWeight: '500'
                    }}>
                      <Lock size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          backgroundColor: '#fafafa',
                          color: '#4a352f',
                          outline: 'none',
                          boxSizing: 'border-box',
                          paddingRight: '3rem'
                        }}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer'
                        }}
                      >
                        {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      backgroundColor: '#a67c52',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'background-color 0.2s',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        Log In & Accept Invitation
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                // Registration Form
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <button
                      onClick={() => setActionStep('view')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      ← Back
                    </button>
                    <h3 style={{ 
                      color: '#4a352f', 
                      margin: 0,
                      fontSize: '1.25rem'
                    }}>
                      Create Your Account
                    </h3>
                  </div>
                  
                  <div style={{ 
                    backgroundColor: '#f0f9ff', 
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    border: '1px solid #e0f2fe'
                  }}>
                    <p style={{ 
                      margin: '0 0 0.5rem 0', 
                      color: '#0369a1',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      Your email
                    </p>
                    <p style={{ 
                      margin: 0, 
                      color: '#4a352f',
                      fontWeight: '500'
                    }}>
                      {invitation?.email}
                    </p>
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      color: '#4a352f',
                      fontWeight: '500'
                    }}>
                      <User size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        backgroundColor: '#fafafa',
                        color: '#4a352f',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      placeholder="Choose a username"
                    />
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      color: '#4a352f',
                      fontWeight: '500'
                    }}>
                      <Lock size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          backgroundColor: '#fafafa',
                          color: '#4a352f',
                          outline: 'none',
                          boxSizing: 'border-box',
                          paddingRight: '3rem'
                        }}
                        placeholder="Create a password (min. 6 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer'
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      color: '#4a352f',
                      fontWeight: '500'
                    }}>
                      <Lock size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      Confirm Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          backgroundColor: '#fafafa',
                          color: '#4a352f',
                          outline: 'none',
                          boxSizing: 'border-box',
                          paddingRight: '3rem'
                        }}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer'
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      backgroundColor: '#a67c52',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'background-color 0.2s',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account & Join Company
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {error && (
                <div style={{ 
                  backgroundColor: '#fef2f2', 
                  color: '#dc2626',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginTop: '1.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertTriangle size={18} />
                  {error}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: '1.5rem 2rem',
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #e9ecef',
          textAlign: 'center'
        }}>
          <p style={{ 
            margin: 0, 
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            By accepting this invitation, you agree to join {invitation?.companyName}
          </p>
        </div>
      </div>
    </div>
  );
}