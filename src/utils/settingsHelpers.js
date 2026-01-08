
/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate password strength
 * @param {string} password
 * @returns {boolean}
 */
export const validatePassword = (password) => {
  if (!password) return false;
  return password.length >= 6;
};

/**
 * Validate password match
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {boolean}
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!password || !confirmPassword) return false;
  return password === confirmPassword;
};

/**
 * Validate phone number format
 * @param {string} phone
 * @returns {boolean}
 */
export const validatePhone = (phone) => {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
};

/**
 * Validate required field
 * @param {string} value
 * @returns {boolean}
 */
export const validateRequired = (value) => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

/**
 * Validate string length
 * @param {string} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export const validateLength = (value, min = 0, max = Infinity) => {
  if (!value) return min === 0;
  const length = value.trim().length;
  return length >= min && length <= max;
};

/**
 * Handle Firebase errors and return user-friendly messages
 * @param {Error} error
 * @returns {string}
 */
export const handleFirebaseError = (error) => {
  const errorMessages = {
    "auth/email-already-in-use": "This email is already registered",
    "auth/invalid-email": "Invalid email address",
    "auth/operation-not-allowed": "Operation not allowed",
    "auth/weak-password": "Password is too weak",
    "auth/user-disabled": "This account has been disabled",
    "auth/user-not-found": "No account found with this email",
    "auth/wrong-password": "Incorrect password",
    "auth/too-many-requests": "Too many attempts. Please try again later",
    "auth/requires-recent-login":
      "Please sign in again to complete this action",
    "auth/network-request-failed": "Network error. Please check your connection",
    "permission-denied": "You don't have permission to perform this action",
    "not-found": "The requested resource was not found",
    "already-exists": "This resource already exists",
    "failed-precondition": "Operation failed. Please try again",
    "aborted": "Operation was aborted",
    "out-of-range": "Value is out of range",
    "unimplemented": "This feature is not implemented yet",
    "internal": "Internal server error. Please try again",
    "unavailable": "Service is currently unavailable",
    "data-loss": "Data loss occurred",
    "unauthenticated": "You must be signed in to perform this action",
  };

  // Check if error has a code
  if (error?.code) {
    return errorMessages[error.code] || error.message || "An error occurred";
  }

  // Return the error message if available
  return error?.message || "An unexpected error occurred";
};

/**
 * Sanitize user input
 * @param {string} input
 * @returns {string}
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .slice(0, 500); // Limit length
};

/**
 * Format phone number for display
 * @param {string} phone
 * @returns {string}
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
};

/**
 * Debounce function for input validation
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check if user has specific role
 * @param {Object} userData
 * @param {string} role
 * @returns {boolean}
 */
export const hasRole = (userData, role) => {
  if (!userData || !role) return false;

  // Check roleArray
  if (Array.isArray(userData.roleArray)) {
    if (userData.roleArray.includes(role)) return true;
  }

  // Check role string
  if (typeof userData.role === "string") {
    const roles = userData.role.split(",").map((r) => r.trim());
    if (roles.includes(role)) return true;
  }

  // Check roles object
  if (userData.roles && typeof userData.roles === "object") {
    if (userData.roles[role] && !userData.roles[role].deletedStatus) {
      return true;
    }
  }

  return false;
};

/**
 * Get all active roles for a user
 * @param {Object} userData
 * @returns {Array<string>}
 */
export const getActiveRoles = (userData) => {
  if (!userData) return [];

  const activeRoles = new Set();

  // From roles object
  if (userData.roles && typeof userData.roles === "object") {
    Object.keys(userData.roles).forEach((role) => {
      if (!userData.roles[role].deletedStatus) {
        activeRoles.add(role);
      }
    });
  }

  // From roleArray
  if (Array.isArray(userData.roleArray)) {
    userData.roleArray.forEach((role) => activeRoles.add(role));
  }

  // From role string
  if (typeof userData.role === "string") {
    userData.role.split(",").forEach((role) => {
      const trimmed = role.trim();
      if (trimmed) activeRoles.add(trimmed);
    });
  }

  return Array.from(activeRoles);
};

/**
 * Check if account is marked for deletion
 * @param {Object} userData
 * @returns {boolean}
 */
export const isAccountMarkedForDeletion = (userData) => {
  if (!userData || !userData.deletedAt) return false;

  const deletedAt = new Date(userData.deletedAt);
  const now = new Date();
  const daysSinceDelete = Math.floor(
    (now - deletedAt) / (1000 * 60 * 60 * 24)
  );

  return daysSinceDelete < 30;
};

/**
 * Calculate days until permanent deletion
 * @param {Object} userData
 * @returns {number}
 */
export const getDaysUntilPermanentDeletion = (userData) => {
  if (!userData || !userData.deletedAt) return 0;

  const deletedAt = new Date(userData.deletedAt);
  const now = new Date();
  const daysSinceDelete = Math.floor(
    (now - deletedAt) / (1000 * 60 * 60 * 24)
  );

  return Math.max(0, 30 - daysSinceDelete);
};

/**
 * Validate form data object
 * @param {Object} formData
 * @param {Object} rules
 * @returns {Object} errors
 */
export const validateForm = (formData, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const rule = rules[field];
    const value = formData[field];

    if (rule.required && !validateRequired(value)) {
      errors[field] = rule.requiredMessage || `${field} is required`;
    } else if (rule.email && value && !validateEmail(value)) {
      errors[field] = rule.emailMessage || "Invalid email format";
    } else if (rule.minLength && !validateLength(value, rule.minLength)) {
      errors[field] =
        rule.minLengthMessage ||
        `Must be at least ${rule.minLength} characters`;
    } else if (
      rule.maxLength &&
      !validateLength(value, 0, rule.maxLength)
    ) {
      errors[field] =
        rule.maxLengthMessage ||
        `Must be no more than ${rule.maxLength} characters`;
    } else if (rule.phone && value && !validatePhone(value)) {
      errors[field] = rule.phoneMessage || "Invalid phone number";
    } else if (rule.custom && !rule.custom(value, formData)) {
      errors[field] = rule.customMessage || "Invalid value";
    }
  });

  return errors;
};

/**
 * Format timestamp to readable date
 * @param {number} timestamp
 * @returns {string}
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Safe JSON parse with fallback
 * @param {string} jsonString
 * @param {*} fallback
 * @returns {*}
 */
export const safeJsonParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return fallback;
  }
};