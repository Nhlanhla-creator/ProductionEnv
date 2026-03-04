import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Validates a document using the Firebase Cloud Function
 * @param {string} documentLabel - The type of document (e.g., "CV", "Company Registration Certificate")
 * @param {File} file - The file to validate
 * @param {string} registeredName - The registered company name (optional for CVs)
 * @returns {Promise<Object>} Validation result
 */
export const validateDocument = async (documentLabel, file, registeredName = "") => {
  try {
    const functions = getFunctions();
    const validateMyDocument = httpsCallable(functions, 'validateMyDocument');
    
    // Convert file to base64
    const base64File = await fileToBase64(file);
    
    // Call the Firebase function
    const result = await validateMyDocument({
      documentLabel,
      base64File,
      mimeType: file.type,
      registeredName
    });
    
    // Return the validation result
    return result.data.validationResult;
    
  } catch (error) {
    console.error("Error validating document:", error);
    
    // Special handling for CVs - be forgiving on network errors
    if (documentLabel === "CV") {
      return {
        isValid: true,
        status: "verified",
        message: "CV accepted (offline mode)",
        warnings: ["Document was accepted without AI validation due to connection issues"]
      };
    }
    
    // Re-throw the error for other document types
    throw new Error(error?.message || "Failed to validate document");
  }
};

/**
 * Validates a document with company name check (for company documents)
 * @param {string} documentLabel - The type of document
 * @param {File} file - The file to validate
 * @param {string} registeredName - The registered company name
 * @returns {Promise<Object>} Validation result
 */
export const validateCompanyDocument = async (documentLabel, file, registeredName) => {
  if (!registeredName) {
    throw new Error("Registered company name is required for company document validation");
  }
  
  return validateDocument(documentLabel, file, registeredName);
};

/**
 * Validates a CV (skips company name check)
 * @param {File} file - The CV file to validate
 * @returns {Promise<Object>} Validation result
 */
export const validateCV = async (file) => {
  return validateDocument("CV", file, ""); // Empty string for CVs
};

// Helper function to convert File to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};