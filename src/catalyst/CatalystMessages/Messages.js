"use client";

import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { db } from "../../firebaseConfig";
import MessagesComponent from "../../components/Messages/MessagesComponent";

const CatalystMessages = () => {
  const [recipientsList, setRecipientsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRecipientsList([]);
        setLoading(false);
        return;
      }

      try {
        const recipientsMap = new Map();

        // Businesses matched/application-linked to this Catalyst
        const applicationsQuery = query(
          collection(db, "catalystApplications"),
          where("catalystId", "==", user.uid)
        );

        const snapshot = await getDocs(applicationsQuery);

        snapshot.forEach((applicationDoc) => {
          const data = applicationDoc.data();

          const id = data.smeId;

          const name =
            data.smeName ||
            data.businessName ||
            data.registeredName ||
            "Business";

          if (id && !recipientsMap.has(id)) {
            recipientsMap.set(id, {
              id,
              name,
            });
          }
        });

        console.log(
          "Catalyst message recipients:",
          Array.from(recipientsMap.values())
        );

        setRecipientsList(Array.from(recipientsMap.values()));
      } catch (error) {
        console.error("Error loading Catalyst recipients:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const config = {
    showSidebarOffset: false,
    supportAttachments: false,
    showSearchIcon: true,
    hasRecipientDropdown: true,
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <MessagesComponent
      config={config}
      recipientsList={recipientsList}
    />
  );
};

export default CatalystMessages;