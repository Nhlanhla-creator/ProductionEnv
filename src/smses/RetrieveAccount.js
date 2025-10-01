"use client";

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, updateDoc, doc, getDoc, arrayUnion } from "firebase/firestore";


const RetrieveAccount = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userRoles, setUserRoles] = useState([]);      // Active roles
const [deletedRoles, setDeletedRoles] = useState([]); // Deleted roles



useEffect(() => {
  // 1️⃣ Immediately set role from location.state or localStorage
  if (location.state?.roleToRetrieve) setRole(location.state.roleToRetrieve);
  else {
    const stored = localStorage.getItem("selectedDeletedRole");
    if (stored) setRole(JSON.parse(stored).name);
  }

  // 2️⃣ Fetch other roles for delete modal or UI purposes
  const fetchRoles = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) return;

    const userData = userDocSnap.data();
    const activeRoles = [];
    const deletedRolesArr = [];

    if (userData.roles && typeof userData.roles === "object") {
      Object.keys(userData.roles).forEach((r) => {
        const roleObj = userData.roles[r];
        if (roleObj.deletedStatus === true) deletedRolesArr.push(r);
        else activeRoles.push(r);
      });
    }

    if (Array.isArray(userData.roleArray)) {
      userData.roleArray.forEach((r) => {
        if (!activeRoles.includes(r)) activeRoles.push(r);
      });
    }

    if (typeof userData.role === "string") {
      userData.role.split(",").forEach((r) => {
        const trimmed = r.trim();
        if (!activeRoles.includes(trimmed)) activeRoles.push(trimmed);
      });
    }

    setUserRoles(activeRoles);
    setDeletedRoles(deletedRolesArr);
  };

  fetchRoles();
}, [location.state]);



  const handleRetrieve = async () => {
  if (!email || !password || !role) {
    setMessage("Please fill in all fields.");
    return;
  }

  const confirmRetrieve = window.confirm(
    "Are you sure you want to retrieve your account?"
  );
  if (!confirmRetrieve) return;

  setLoading(true);
  setMessage("");

  try {
    // 1️⃣ Authenticate user
    await signInWithEmailAndPassword(auth, email, password);

    // 2️⃣ Get user document
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where(`roles.${role}.deletedStatus`, "==", true),
      where("email", "==", email)
    );
    const querySnap = await getDocs(q);

    if (querySnap.empty) {
      setMessage("No matching deleted account found.");
      setLoading(false);
      return;
    }

    // 3️⃣ Restore role and append to roleArray
    querySnap.forEach(async (docSnap) => {
      const docRef = doc(db, "users", docSnap.id);

      await updateDoc(docRef, {
        [`roles.${role}.deletedStatus`]: false, // mark role as active
        roleArray: arrayUnion(role),             // append to active roles
      });

      // 4️⃣ Update local state
      setUserRoles(prev => {
        if (!prev.includes(role)) return [...prev, role];
        return prev;
      });
      setDeletedRoles(prev => prev.filter(r => r !== role));
    });

    setMessage("Account successfully restored! You can now log in.");
    setLoading(false);

    // 5️⃣ Redirect back to login page after short delay
    setTimeout(() => navigate("/auth"), 1500);

  } catch (err) {
    console.error(err);
    setMessage("Email or password incorrect. Cannot retrieve account.");
    setLoading(false);
  }
};




  return (
    <div
      style={{
        maxWidth: 400,
        margin: "50px auto",
        padding: 20,
        border: "1px solid #ccc",
        borderRadius: 12,
      }}
    >
      <h2>Retrieve Account</h2>
      {role && (
        <p>
          Role to retrieve: <strong>{role}</strong>
        </p>
      )}
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, border: "1px solid #ccc" }}
      />
      <input
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, border: "1px solid #ccc" }}
      />
      <button
        onClick={handleRetrieve}
        disabled={loading}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 6,
          backgroundColor: "#4a352f",
          color: "white",
          fontWeight: 600,
        }}
      >
        {loading ? "Processing..." : "Retrieve Account"}
      </button>
      {message && <p style={{ marginTop: 10, color: message.includes("successfully") ? "green" : "red" }}>{message}</p>}
    </div>
  );
};

export default RetrieveAccount;
