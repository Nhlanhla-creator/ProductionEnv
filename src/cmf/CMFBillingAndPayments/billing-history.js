// src/cmf/CMFBillingAndPayments/billing-history.js
"use client";

import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import ReusableBillingHistory from "../../components/Subscriptions/BillingHistory";

const CMFBillingHistory = () => {
  const [initialData, setInitialData] = useState({
    email: "",
    fullName: "",
    companyName: "",
  });

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const fetchCMFData = async () => {
      try {
        const db = getFirestore();
        const cmfRef = doc(db, "cmfProfiles", `${user.uid}_cmf`);
        const cmfSnap = await getDoc(cmfRef);

        let entityData = null;
        if (cmfSnap.exists()) {
          entityData = cmfSnap.data()?.formData || cmfSnap.data();
        } else {
          const altSnap = await getDoc(doc(db, "cmfProfiles", user.uid));
          if (altSnap.exists()) {
            entityData = altSnap.data()?.formData || altSnap.data();
          }
        }

        if (entityData) {
          setInitialData({
            companyName: entityData.entityOverview?.registeredName || entityData.entityOverview?.tradingName || "",
            fullName: entityData.contactDetails?.contactName || user.displayName || "",
            email: entityData.contactDetails?.email || user.email || "",
          });
        } else {
          setInitialData({
            companyName: user.displayName || "",
            fullName: user.displayName || "",
            email: user.email || "",
          });
        }
      } catch (err) {
        console.error("Failed to prefetch CMF profile for billing history:", err);
      }
    };

    fetchCMFData();
  }, []);

  return (
    <ReusableBillingHistory
      userType="cmf"
      showSidebarSpacing={true}
      companyName={initialData.companyName}
      fullName={initialData.fullName}
      email={initialData.email}
    />
  );
};

export default CMFBillingHistory;
