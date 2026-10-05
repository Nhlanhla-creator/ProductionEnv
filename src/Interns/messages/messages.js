import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import MessagesComponent from 'components/Messages/MessagesComponent';

const InternMessages = () => {
  const [recipientsList, setRecipientsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipients = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const recipientsMap = new Map();

        // SPONSORS from Intern Table (where I am the intern)
        const sponsorsQuery = query(
          collection(db, "internshipApplications"),
          where("applicantId", "==", user.uid)
        );
        const sponsorsSnapshot = await getDocs(sponsorsQuery);
        sponsorsSnapshot.forEach(doc => {
          const data = doc.data();
          const id = data.sponsorId;
          const name = data.sponsorName;
          if (id && name && !recipientsMap.has(id)) {
            recipientsMap.set(id, { id, name });
          }
        });

        setRecipientsList(Array.from(recipientsMap.values()));
      } catch (error) {
        console.error("Error fetching recipients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipients();
  }, []);

  const config = {
    showSidebarOffset: false,
    supportAttachments: true,
    showSearchIcon: true,
    hasRecipientDropdown: true,
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Loading...</div>;
  }

  return <MessagesComponent config={config} recipientsList={recipientsList} />;
};

export default InternMessages;