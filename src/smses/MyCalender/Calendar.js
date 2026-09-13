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
import EventData from "./event-data";
import Meetings from "./meetings";

import "./Calendar.css";

const Calendar = () => {
  const [stats, setStats] = useState({
    created: 0,
    scheduled: 0,
    completed: 0,
    rescheduled: 0,
    cancelled: 0,
  });

  const [matchesList, setMatchesList] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setMatchesList([]);
        setLoadingRecipients(false);
        return;
      }

      setLoadingRecipients(true);

      try {
        const recipientsMap = new Map();

        const addRecipient = (id, name, extra = {}) => {
          if (!id || !name) return;

          if (!recipientsMap.has(id)) {
            recipientsMap.set(id, {
              id,
              name,
              ...extra,
            });
          }
        };

        const [
          suppliersSnapshot,
          customersSnapshot,
          advisorsSnapshot,
          fundersSnapshot,
          catalystsSnapshot,
          internsSnapshot,
          sponsorsSnapshot,
        ] = await Promise.all([
          // Supplier matches where current user is customer
          getDocs(
            query(
              collection(db, "supplierApplications"),
              where("customerId", "==", user.uid)
            )
          ),

          // Customer matches where current user is supplier
          getDocs(
            query(
              collection(db, "supplierApplications"),
              where("supplierId", "==", user.uid)
            )
          ),

          // Advisors
          getDocs(
            query(
              collection(db, "SmeAdvisorApplications"),
              where("smeId", "==", user.uid)
            )
          ),

          // Funders
          getDocs(
            query(
              collection(db, "smeApplications"),
              where("smeId", "==", user.uid)
            )
          ),

          // Catalysts
          getDocs(
            query(
              collection(db, "smeCatalystApplications"),
              where("smeId", "==", user.uid)
            )
          ),

          // Interns where current user is sponsor
          getDocs(
            query(
              collection(db, "internshipApplications"),
              where("sponsorId", "==", user.uid)
            )
          ),

          // Sponsors where current user is intern
          getDocs(
            query(
              collection(db, "internshipApplications"),
              where("applicantId", "==", user.uid)
            )
          ),
        ]);

        suppliersSnapshot.forEach((docSnap) => {
          const data = docSnap.data();

          addRecipient(
            data.supplierId,
            data.supplierName || "Supplier",
            { type: "Supplier" }
          );
        });

        customersSnapshot.forEach((docSnap) => {
          const data = docSnap.data();

          addRecipient(
            data.customerId,
            data.customerName || "Customer",
            { type: "Customer" }
          );
        });

        advisorsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();

          addRecipient(
            data.advisorId,
            data.advisorName || "Advisor",
            { type: "Advisor" }
          );
        });

        fundersSnapshot.forEach((docSnap) => {
          const data = docSnap.data();

          addRecipient(
            data.funderId,
            data.fundName || data.funderName || "Funder",
            { type: "Funder" }
          );
        });

        catalystsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();

          addRecipient(
            data.catalystId,
            data.acceleratorName ||
              data.catalystName ||
              "Catalyst",
            { type: "Catalyst" }
          );
        });

        internsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();

          addRecipient(
            data.applicantId,
            data.internName ||
              data.applicantName ||
              data.applicantEmail ||
              "Intern",
            { type: "Intern" }
          );
        });

        sponsorsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();

          addRecipient(
            data.sponsorId,
            data.sponsorName || "Sponsor",
            { type: "Sponsor" }
          );
        });

        const recipients = Array.from(
          recipientsMap.values()
        ).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setMatchesList(recipients);
      } catch (error) {
        console.error(
          "Error fetching recipients for calendar:",
          error
        );
      } finally {
        setLoadingRecipients(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="calendar-system">
      <div className="calendar-page-shell">
        <section className="calendar-stats-section">
          <EventData />
        </section>

        <section className="calendar-meetings-section">
          <Meetings
            stats={stats}
            setStats={setStats}
            matchesList={matchesList}
            loadingRecipients={loadingRecipients}
          />
        </section>
      </div>
    </main>
  );
};

export default Calendar;