// hooks/useSettings.js

import { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  handleFirebaseError,
} from "../utils/validationHelpers";

/**
 * Custom hook for managing settings across different profile types
 * @param {string} profileType - Type of profile (advisor, investor, catalyst, sme)
 * @returns {Object} Settings state and handlers
 */
export const useSettings = (profileType = "default") => {
  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    firstName: "",
    lastName: "",
    phone: "",
    bio: "",
    notifications: true,
    sms: false,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    language: "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    marketingEmails: false,
    darkMode: false,
    twoFactorAuth: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData((prev) => ({
            ...prev,
            email: data.email || "",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            phone: data.phone || "",
            bio: data.bio || "",
            displayName: data.displayName || "",
            notifications: data.notifications ?? true,
            sms: data.sms ?? false,
            marketingEmails: data.marketingEmails ?? false,
            darkMode: data.darkMode ?? false,
            language: data.language || "en",
            timezone:
              data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            twoFactorAuth: data.twoFactorAuth ?? false,
          }));
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setMessage(`Error loading data: ${handleFirebaseError(error)}`);
      }
    };

    loadUserData();
  }, []);

  /**
   * Handle input changes
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Validate account form data
   */
  const validateAccountForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.firstName?.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = "Last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Validate password form data
   */
  const validatePasswordForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (!validatePassword(formData.newPassword)) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (
      !validatePasswordMatch(formData.newPassword, formData.confirmPassword)
    ) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Save account information
   */
  const handleSaveAccount = async () => {
    if (!validateAccountForm()) {
      setMessage("Please fix the errors before saving");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      const { currentPassword, newPassword, confirmPassword, ...safeData } =
        formData;

      await updateDoc(doc(db, "users", user.uid), {
        ...safeData,
        updatedAt: Date.now(),
      });

      setMessage("Account settings saved successfully!");
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      console.error("Error saving account:", error);
      setMessage(`Error: ${handleFirebaseError(error)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle password change
   */
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      setMessage("Please fix the errors before changing password");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        formData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, formData.newPassword);

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setMessage("Password updated successfully!");
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      console.error("Error changing password:", error);
      if (error.code === "auth/wrong-password") {
        setErrors({ currentPassword: "Incorrect current password" });
      }
      setMessage(`Error: ${handleFirebaseError(error)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete user account
   */
  const handleDeleteAccount = async () => {
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      // Delete user document
      await deleteDoc(doc(db, "users", user.uid));

      // Delete authentication account
      await deleteUser(user);

      // Sign out
      await auth.signOut();

      return true;
    } catch (error) {
      console.error("Error deleting account:", error);
      throw new Error(handleFirebaseError(error));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Soft delete a role
   */
  const handleDeleteRole = async (roleToDelete) => {
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error("User profile not found");
      }

      const userData = userDocSnap.data();

      // Remove role from roleArray
      let updatedRoleArray = [];
      if (userData.roleArray && Array.isArray(userData.roleArray)) {
        updatedRoleArray = userData.roleArray.filter((r) => r !== roleToDelete);
      }

      // Remove role from role string
      let updatedRoleString = "";
      if (userData.role && typeof userData.role === "string") {
        const rolesSplit = userData.role.split(",").map((r) => r.trim());
        const filteredRoles = rolesSplit.filter((r) => r !== roleToDelete);
        updatedRoleString = filteredRoles.join(",");
      }

      // Add role to deletedRoles map with timestamp
      const updatedRolesMap = { ...(userData.roles || {}) };
      updatedRolesMap[roleToDelete] = {
        deletedStatus: true,
        deletedAt: Date.now(),
      };

      // Update Firestore
      await updateDoc(userDocRef, {
        roleArray: updatedRoleArray,
        role: updatedRoleString,
        roles: updatedRolesMap,
        updatedAt: Date.now(),
      });

      return true;
    } catch (error) {
      console.error("Error deleting role:", error);
      throw new Error(handleFirebaseError(error));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset form to initial state
   */
  const handleReset = () => {
    setFormData((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
    setErrors({});
    setMessage("");
  };

  return {
    formData,
    loading,
    message,
    errors,
    handleInputChange,
    handleSaveAccount,
    handlePasswordChange,
    handleDeleteAccount,
    handleDeleteRole,
    handleReset,
  };
};