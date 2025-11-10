import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { 
  getAllDocumentLabels, 
  getDocumentId, 
  getProfileDocumentIds 
} from '../utils/documentMapping';

export const useDocumentSync = (setSubmittedDocuments, setProfileData, setFormData) => {
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(
      doc(db, "universalProfiles", user.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          
          // Sync for MyDocuments (all documents)
          if (setProfileData && setSubmittedDocuments) {
            setProfileData(data);
            
            // Use getAllDocumentLabels from documentMapping instead of DOCUMENT_PATHS
            const allDocumentLabels = getAllDocumentLabels();
            
            const submitted = allDocumentLabels.filter(docLabel => {
              const documentId = getDocumentId(docLabel);
              // Check if document exists and is not null
              const documentUrl = data.documents?.[documentId];
              return !!(documentUrl && documentUrl !== null && documentUrl !== '');
            });
            
            setSubmittedDocuments(submitted);
          }
          
          // Sync for Documents (profile documents only)
          if (setFormData) {
            const documentsData = {};
            getProfileDocumentIds().forEach(docId => {
              const url = data.documents?.[docId];
              // Only include if URL exists and is not null
              if (url && url !== null && url !== '') {
                documentsData[docId] = [url];
              } else {
                documentsData[docId] = [];
              }
            });
            setFormData(documentsData);
          }
        }
      }
    );

    return () => unsubscribe();
  }, [setSubmittedDocuments, setProfileData, setFormData]);
};