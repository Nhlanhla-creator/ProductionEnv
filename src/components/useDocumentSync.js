import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { 
  getAllDocumentLabels, 
  getDocumentId, 
  getProfileDocumentIds 
} from '../utils/documentMapping';
import { getProfileOwnerId } from '../utils/profile-context';

export const useDocumentSync = (setSubmittedDocuments, setProfileData, setFormData) => {
  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    const subscribeToProfile = async () => {
      try {
        const profileId = await getProfileOwnerId();
        if (!profileId || cancelled) return;

        unsubscribe = onSnapshot(
          doc(db, "universalProfiles", profileId),
          (docSnapshot) => {
            if (!docSnapshot.exists()) return;

            const data = docSnapshot.data();
            if (setProfileData && setSubmittedDocuments) {
              setProfileData(data);
              const allDocumentLabels = getAllDocumentLabels();
              const submitted = allDocumentLabels.filter(docLabel => {
                const documentId = getDocumentId(docLabel);
                const documentUrl = data.documents?.[documentId];
                return !!(documentUrl && documentUrl !== null && documentUrl !== '');
              });
              setSubmittedDocuments(submitted);
            }

            if (setFormData) {
              const documentsData = {};
              getProfileDocumentIds().forEach(docId => {
                const url = data.documents?.[docId];
                documentsData[docId] = url && url !== null && url !== '' ? [url] : [];
              });
              setFormData(documentsData);
            }
          },
          (error) => console.error("Error syncing profile documents:", error)
        );
      } catch (error) {
        console.error("Error resolving profile for document sync:", error);
      }
    };

    subscribeToProfile();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [setSubmittedDocuments, setProfileData, setFormData]);
};