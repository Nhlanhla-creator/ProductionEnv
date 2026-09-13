"use client"

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import MessagesComponent from "../../components/Messages/MessagesComponent";

const Messages = () => {
  const [recipientsList, setRecipientsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllRecipients = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const recipientsMap = new Map();

        // 1. CUSTOMERS from Customer Table (where I am the supplier)
        const customersQuery = query(
          collection(db, "supplierApplications"),
          where("supplierId", "==", user.uid)
        );
        const customersSnapshot = await getDocs(customersQuery);
        customersSnapshot.forEach(doc => {
          const data = doc.data();
          const id = data.customerId;
          const name = data.customerName;
          if (id && name && !recipientsMap.has(id)) {
            recipientsMap.set(id, { id, name });
          }
        });

        // 2. SUPPLIERS from Supplier Table (where I am the customer)
        const suppliersQuery = query(
          collection(db, "supplierApplications"),
          where("customerId", "==", user.uid)
        );
        const suppliersSnapshot = await getDocs(suppliersQuery);
        suppliersSnapshot.forEach(doc => {
          const data = doc.data();
          const id = data.supplierId;
          const name = data.supplierName;
          if (id && name && !recipientsMap.has(id)) {
            recipientsMap.set(id, { id, name });
          }
        });

        // 3. ADVISORS from Advisor Table (where I am the SME)
        const advisorsQuery = query(
          collection(db, "SmeAdvisorApplications"),
          where("smeId", "==", user.uid)
        );
        const advisorsSnapshot = await getDocs(advisorsQuery);
        advisorsSnapshot.forEach(doc => {
          const data = doc.data();
          const id = data.advisorId;
          const name = data.advisorName;
          if (id && name && !recipientsMap.has(id)) {
            recipientsMap.set(id, { id, name });
          }
        });

        // 4. FUNDERS from Funding Table (where I am the SME)
        const fundersQuery = query(
          collection(db, "smeApplications"),
          where("smeId", "==", user.uid)
        );
        const fundersSnapshot = await getDocs(fundersQuery);
        fundersSnapshot.forEach(doc => {
          const data = doc.data();
          const id = data.funderId;
          const name = data.fundName;
          if (id && name && !recipientsMap.has(id)) {
            recipientsMap.set(id, { id, name });
          }
        });

      // 5. CATALYSTS from Catalyst Table (where I am the SME)
const catalystsQuery = query(
  collection(db, "catalystApplications"),
  where("smeId", "==", user.uid)
);

const catalystsSnapshot = await getDocs(catalystsQuery);

for (const applicationDoc of catalystsSnapshot.docs) {
  const data = applicationDoc.data();

  const id = data.catalystId;

  if (!id) {
    console.warn(
      "Catalyst application missing catalystId:",
      applicationDoc.id,
      data
    );
    continue;
  }

  let name =
    data.catalystName ||
    data.acceleratorName ||
    null;

  // Fetch Catalyst's actual profile name if not stored on application
  if (!name) {
    try {
      const catalystProfile = await getDoc(
        doc(db, "catalystProfiles", id)
      );

      if (catalystProfile.exists()) {
        const profile = catalystProfile.data();

        name =
          profile.catalystName ||
          profile.name ||
          "Catalyst";
      }
    } catch (error) {
      console.error(
        "Error fetching Catalyst profile:",
        error
      );
    }
  }

  if (!recipientsMap.has(id)) {
    recipientsMap.set(id, {
      id,
      name: name || "Catalyst",
    });
  }
}

        // 6. INTERNS from Intern Table (where I am the sponsor)
        const internsQuery = query(
          collection(db, "internshipApplications"),
          where("sponsorId", "==", user.uid)
        );
        const internsSnapshot = await getDocs(internsQuery);
        internsSnapshot.forEach(doc => {
          const data = doc.data();
          const id = data.applicantId;
          const name = data.internName;
          if (id && name && !recipientsMap.has(id)) {
            recipientsMap.set(id, { id, name });
          }
        });

        // 7. SPONSORS from Intern Table (where I am the intern)
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

    fetchAllRecipients();
  }, []);

 const config = {
  showSidebarOffset: false,
  supportAttachments: true,   // was false
  showSearchIcon: true,
  hasRecipientDropdown: true,
};

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Loading...</div>;
  }

  return <MessagesComponent config={config} recipientsList={recipientsList} />;
};

export default Messages;