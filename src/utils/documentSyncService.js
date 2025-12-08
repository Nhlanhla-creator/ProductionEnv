import { db, storage } from '../firebaseConfig';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getDocumentId, DOCUMENT_PATHS } from './documentMapping';

export const DOCUMENT_SYNC_CONFIG = {
  "Company Letterhead": {
    sourceField: "companyLetterhead",
    sourceUpdatedAt: "companyLetterheadUpdatedAt",
    syncLocations: [
      { path: "documents.companyLetterhead", updatedAt: "documents.companyLetterheadUpdatedAt" },
      { path: "entityOverview.companyLetterhead", updatedAt: "entityOverview.companyLetterheadUpdatedAt" }
    ]
  },
  "Company Logo": {
    sourceField: "companyLogo", 
    sourceUpdatedAt: "companyLogoUpdatedAt",
    syncLocations: [
      { path: "documents.companyLogo", updatedAt: "documents.companyLogoUpdatedAt" },
      { path: "entityOverview.companyLogo", updatedAt: "entityOverview.companyLogoUpdatedAt" }
    ]
  },
  "Company Registration Certificate": {
    sourceField: "registrationCertificate",
    sourceUpdatedAt: "registrationCertificateUpdatedAt", 
    syncLocations: [
      { path: "documents.registrationCertificate", updatedAt: "documents.registrationCertificateUpdatedAt" },
      { path: "entityOverview.registrationCertificate", updatedAt: "entityOverview.registrationCertificateUpdatedAt" }
    ]
  },
  "Company Profile / Brochure": {
    sourceField: "companyProfile",
    sourceUpdatedAt: "companyProfileUpdatedAt",
    syncLocations: [
      { path: "documents.companyProfile", updatedAt: "documents.companyProfileUpdatedAt" },
      { path: "productsServices.companyProfile", updatedAt: "productsServices.companyProfileUpdatedAt" }
    ]
  },

  "5 Year Budget": {
    sourceField: "fiveYearBudget",
    sourceUpdatedAt: "fiveYearBudgetUpdatedAt",
    syncLocations: [
      { path: "documents.fiveYearBudget", updatedAt: "documents.fiveYearBudgetUpdatedAt" }
    ]
  },
  "Financial Statements": {
    sourceField: "financialStatements",
    sourceUpdatedAt: "financialStatementsUpdatedAt",
    syncLocations: [
      { path: "documents.financialStatements", updatedAt: "documents.financialStatementsUpdatedAt" }
    ]
  },

  "Tax Clearance Certificate": {
    sourceField: "taxClearanceCert", 
    sourceUpdatedAt: "taxClearanceCertUpdatedAt",
    syncLocations: [
      { path: "documents.taxClearanceCert", updatedAt: "documents.taxClearanceCertUpdatedAt" },
      { path: "legalCompliance.taxClearanceCert", updatedAt: "legalCompliance.taxClearanceCertUpdatedAt" }
    ]
  },
  "B-BBEE Certificate": {
    sourceField: "bbbeeCert",
    sourceUpdatedAt: "bbbeeCertUpdatedAt",
    syncLocations: [
      { path: "documents.bbbeeCert", updatedAt: "documents.bbbeeCertUpdatedAt" },
      { path: "legalCompliance.bbbeeCert", updatedAt: "legalCompliance.bbbeeCertUpdatedAt" }
    ]
  },
  "COIDA Letter of Good Standing": {
    sourceField: "coidaLetter",
    sourceUpdatedAt: "coidaLetterUpdatedAt",
    syncLocations: [
      { path: "documents.coidaLetter", updatedAt: "documents.coidaLetterUpdatedAt" },
      { path: "legalCompliance.coidaLetter", updatedAt: "legalCompliance.coidaLetterUpdatedAt" }
    ]
  },

  "IDs of Directors & Shareholders": {
    sourceField: "certifiedIds",
    sourceUpdatedAt: "certifiedIdsUpdatedAt",
    syncLocations: [
      { path: "documents.certifiedIds", updatedAt: "documents.certifiedIdsUpdatedAt" },
      { path: "ownershipManagement.certifiedIds", updatedAt: "ownershipManagement.certifiedIdsUpdatedAt" }
    ]
  },
  "Proof of Address": {
    sourceField: "proofOfAddress",
    sourceUpdatedAt: "proofOfAddressUpdatedAt", 
    syncLocations: [
      { path: "documents.proofOfAddress", updatedAt: "documents.proofOfAddressUpdatedAt" },
      { path: "contactDetails.proofOfAddress", updatedAt: "contactDetails.proofOfAddressUpdatedAt" }
    ]
  },

  "Business Plan": {
    sourceField: "businessPlan",
    sourceUpdatedAt: "businessPlanUpdatedAt",
    syncLocations: [
      { path: "documents.businessPlan", updatedAt: "documents.businessPlanUpdatedAt" }
    ]
  },
  "Pitch Deck": {
    sourceField: "pitchDeck",
    sourceUpdatedAt: "pitchDeckUpdatedAt",
    syncLocations: [
      { path: "documents.pitchDeck", updatedAt: "documents.pitchDeckUpdatedAt" }
    ]
  },

  "Client references / Support Letters": {
    sourceField: "clientReferences",
    sourceUpdatedAt: "clientReferencesUpdatedAt",
    syncLocations: [
      { path: "documents.clientReferences", updatedAt: "documents.clientReferencesUpdatedAt" },
      { path: "productsServices.clientReferences", updatedAt: "productsServices.clientReferencesUpdatedAt" }
    ]
  },
  "Industry Accreditations": {
    sourceField: "industryAccreditationDocs",
    sourceUpdatedAt: "industryAccreditationDocsUpdatedAt",
    syncLocations: [
      { path: "documents.industryAccreditationDocs", updatedAt: "documents.industryAccreditationDocsUpdatedAt" },
      { path: "legalCompliance.industryAccreditationDocs", updatedAt: "legalCompliance.industryAccreditationDocsUpdatedAt" }
    ]
  },

  "Bank Details Confirmation Letter": {
    sourceField: "bankConfirmationLetter",
    sourceUpdatedAt: "bankConfirmationLetterUpdatedAt",
    syncLocations: [
      { path: "documents.bankConfirmationLetter", updatedAt: "documents.bankConfirmationLetterUpdatedAt" }
    ]
  },
  "Loan Agreements": {
    sourceField: "loanAgreements",
    sourceUpdatedAt: "loanAgreementsUpdatedAt",
    syncLocations: [
      { path: "documents.loanAgreements", updatedAt: "documents.loanAgreementsUpdatedAt" }
    ]
  },
  "Guarantee/Contract": {
    sourceField: "guaranteeContract",
    sourceUpdatedAt: "guaranteeContractUpdatedAt",
    syncLocations: [
      { path: "documents.guaranteeContract", updatedAt: "documents.guaranteeContractUpdatedAt" }
    ]
  },
  "Share Register": {
    sourceField: "shareRegister",
    sourceUpdatedAt: "shareRegisterUpdatedAt",
    syncLocations: [
      { path: "documents.shareRegister", updatedAt: "documents.shareRegisterUpdatedAt" },
      { path: "ownershipManagement.shareRegister", updatedAt: "ownershipManagement.shareRegisterUpdatedAt" }
    ]
  },

  "CV": {
    sourceField: "cv",
    sourceUpdatedAt: "cvUpdatedAt",
    syncLocations: [
      { path: "documents.cv", updatedAt: "documents.cvUpdatedAt" },
      { path: "productsServices.cv", updatedAt: "productsServices.cvUpdatedAt" }
    ]
  },

  "_DEFAULT_": {
    syncLocations: [
      { path: "documents.[documentId]", updatedAt: "documents.[documentId]UpdatedAt" }
    ]
  }
};

/**
 * Get sync configuration for a specific document label
 */
export const getSyncConfig = (docLabel) => {
  const config = DOCUMENT_SYNC_CONFIG[docLabel];
  if (config) {
    return config;
  }
  
  // For unmapped documents, use default with dynamic documentId
  const documentId = getDocumentId(docLabel);
  return {
    sourceField: documentId,
    sourceUpdatedAt: `${documentId}UpdatedAt`,
    syncLocations: [
      { path: `documents.${documentId}`, updatedAt: `documents.${documentId}UpdatedAt` }
    ]
  };
};

/**
 * Upload a document with automatic synchronization
 */
export const uploadDocumentWithSync = async (docLabel, downloadURL, validationResult = null) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const userDocRef = doc(db, "universalProfiles", user.uid);
    const userDoc = await getDoc(userDocRef);
    const currentData = userDoc.exists() ? userDoc.data() : {};
    
    const syncConfig = getSyncConfig(docLabel);
    const documentId = getDocumentId(docLabel);
    const timestamp = new Date().toISOString();
    
    // Build update data for all sync locations
    const updateData = {
      updatedAt: serverTimestamp()
    };
    
    // Add document URL and timestamp to all sync locations
    syncConfig.syncLocations.forEach(location => {
      const path = location.path.replace('[documentId]', documentId);
      const updatedAtPath = location.updatedAt.replace('[documentId]', documentId);
      
      updateData[path] = downloadURL;
      updateData[updatedAtPath] = timestamp;
    });
    
    // Add verification data if provided
    if (validationResult) {
      updateData[`verification.${documentId}`] = {
        status: validationResult.status,
        message: validationResult.message,
        lastChecked: timestamp
      };
    }
    
    // Apply the updates
    await updateDoc(userDocRef, updateData);
    
    return {
      success: true,
      syncConfig,
      updateData
    };
    
  } catch (error) {
    console.error('Error uploading document with sync:', error);
    throw new Error(`Failed to upload document: ${error.message}`);
  }
};

/**
 * Delete a document with automatic synchronization
 */
export const deleteDocumentWithSync = async (docLabel) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const userDocRef = doc(db, "universalProfiles", user.uid);
    const userDoc = await getDoc(userDocRef);
    const currentData = userDoc.exists() ? userDoc.data() : {};
    
    const syncConfig = getSyncConfig(docLabel);
    const documentId = getDocumentId(docLabel);
    
    // Collect all URLs to delete from storage
    const urlsToDelete = new Set();
    
    // Check all sync locations for URLs
    syncConfig.syncLocations.forEach(location => {
      const path = location.path.replace('[documentId]', documentId);
      const url = getNestedValue(currentData, path);
      if (url && typeof url === 'string' && url.includes('firebase')) {
        urlsToDelete.add(url);
      }
    });
    
    // Delete from storage
    for (const url of urlsToDelete) {
      try {
        const fileRef = ref(storage, url);
        await deleteObject(fileRef);
      } catch (deleteError) {
        console.warn(`Could not delete document from storage (${docLabel}):`, deleteError);
      }
    }
    
    // Build update data to clear all sync locations
    const updateData = {
      updatedAt: serverTimestamp()
    };
    
    // Clear document URL and timestamp from all sync locations
    syncConfig.syncLocations.forEach(location => {
      const path = location.path.replace('[documentId]', documentId);
      const updatedAtPath = location.updatedAt.replace('[documentId]', documentId);
      
      updateData[path] = null;
      updateData[updatedAtPath] = null;
    });
    
    // Clear verification data
    updateData[`verification.${documentId}`] = null;
    
    // Apply the updates
    await updateDoc(userDocRef, updateData);
    
    return {
      success: true,
      syncConfig,
      deletedUrls: Array.from(urlsToDelete)
    };
    
  } catch (error) {
    console.error('Error deleting document with sync:', error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
};

/**
 * Sync existing document data across all locations
 */
export const syncDocumentLocations = async (docLabel) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const userDocRef = doc(db, "universalProfiles", user.uid);
    const userDoc = await getDoc(userDocRef);
    const currentData = userDoc.exists() ? userDoc.data() : {};
    
    const syncConfig = getSyncConfig(docLabel);
    const documentId = getDocumentId(docLabel);
    
    // Find the primary source URL (first non-null URL found)
    let primaryUrl = null;
    let primaryTimestamp = null;
    
    for (const location of syncConfig.syncLocations) {
      const path = location.path.replace('[documentId]', documentId);
      const url = getNestedValue(currentData, path);
      
      if (url && typeof url === 'string') {
        primaryUrl = url;
        const updatedAtPath = location.updatedAt.replace('[documentId]', documentId);
        primaryTimestamp = getNestedValue(currentData, updatedAtPath) || new Date().toISOString();
        break;
      }
    }
    
    // If no URL found, nothing to sync
    if (!primaryUrl) {
      return { success: true, message: 'No document found to sync' };
    }
    
    // Build update data to sync URL to all locations
    const updateData = {};
    let needsUpdate = false;
    
    syncConfig.syncLocations.forEach(location => {
      const path = location.path.replace('[documentId]', documentId);
      const updatedAtPath = location.updatedAt.replace('[documentId]', documentId);
      
      const currentUrl = getNestedValue(currentData, path);
      
      // If URL doesn't match primary URL, update it
      if (currentUrl !== primaryUrl) {
        updateData[path] = primaryUrl;
        updateData[updatedAtPath] = primaryTimestamp;
        needsUpdate = true;
      }
    });
    
    // Apply updates if needed
    if (needsUpdate) {
      updateData.updatedAt = serverTimestamp();
      await updateDoc(userDocRef, updateData);
      return { success: true, synced: true, updateData };
    }
    
    return { success: true, synced: false, message: 'Already in sync' };
    
  } catch (error) {
    console.error('Error syncing document locations:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync all documents across the user's profile
 */
export const syncAllDocumentLocations = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const userDocRef = doc(db, "universalProfiles", user.uid);
    const userDoc = await getDoc(userDocRef);
    const currentData = userDoc.exists() ? userDoc.data() : {};
    
    const updateData = {};
    let totalUpdates = 0;
    
    // Process each document in sync config
    for (const [docLabel, config] of Object.entries(DOCUMENT_SYNC_CONFIG)) {
      if (docLabel === '_DEFAULT_') continue;
      
      const documentId = getDocumentId(docLabel);
      let primaryUrl = null;
      let primaryTimestamp = null;
      
      // Find primary URL
      for (const location of config.syncLocations) {
        const path = location.path.replace('[documentId]', documentId);
        const url = getNestedValue(currentData, path);
        
        if (url && typeof url === 'string') {
          primaryUrl = url;
          const updatedAtPath = location.updatedAt.replace('[documentId]', documentId);
          primaryTimestamp = getNestedValue(currentData, updatedAtPath) || new Date().toISOString();
          break;
        }
      }
      
      // Sync to all locations if primary URL found
      if (primaryUrl) {
        config.syncLocations.forEach(location => {
          const path = location.path.replace('[documentId]', documentId);
          const updatedAtPath = location.updatedAt.replace('[documentId]', documentId);
          
          const currentUrl = getNestedValue(currentData, path);
          
          if (currentUrl !== primaryUrl) {
            updateData[path] = primaryUrl;
            updateData[updatedAtPath] = primaryTimestamp;
            totalUpdates++;
          }
        });
      }
    }
    
    // Apply updates if any
    if (totalUpdates > 0) {
      updateData.updatedAt = serverTimestamp();
      await updateDoc(userDocRef, updateData);
      return { success: true, synced: true, totalUpdates, updateData };
    }
    
    return { success: true, synced: false, message: 'All documents already in sync' };
    
  } catch (error) {
    console.error('Error syncing all document locations:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Helper function to get nested object values
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

/**
 * Get document URL from any sync location
 */
export const getDocumentUrlFromAnyLocation = (docLabel, profileData) => {
  const syncConfig = getSyncConfig(docLabel);
  const documentId = getDocumentId(docLabel);
  
  // Check all sync locations for the document URL
  for (const location of syncConfig.syncLocations) {
    const path = location.path.replace('[documentId]', documentId);
    const url = getNestedValue(profileData, path);
    
    if (url && typeof url === 'string') {
      return url;
    }
  }
  
  return null;
};

export default {
  DOCUMENT_SYNC_CONFIG,
  getSyncConfig,
  uploadDocumentWithSync,
  deleteDocumentWithSync,
  syncDocumentLocations,
  syncAllDocumentLocations,
  getDocumentUrlFromAnyLocation
};