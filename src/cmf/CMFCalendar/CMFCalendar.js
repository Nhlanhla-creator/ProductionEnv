import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import EventData from "./EventData";
import Meetings from "./Meetings";
import "./Calendar.css";

const CMFCalendar = () => {
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

        // Query CMF matches across business, funder, and catalyst match collections
        const [
          businessMatchesSnap,
          funderMatchesSnap,
          catalystMatchesSnap,
          cmfAppsSnap,
          recentEventsSnap,
        ] = await Promise.all([
          getDocs(
            query(
              collection(db, "cmfBusinessMatches"),
              where("facilitatorId", "==", user.uid)
            )
          ).catch(() => ({ docs: [] })),
          getDocs(
            query(
              collection(db, "cmfFunderMatches"),
              where("facilitatorId", "==", user.uid)
            )
          ).catch(() => ({ docs: [] })),
          getDocs(
            query(
              collection(db, "cmfCatalystMatches"),
              where("facilitatorId", "==", user.uid)
            )
          ).catch(() => ({ docs: [] })),
          getDocs(
            query(
              collection(db, "cmfApplications"),
              where("cmfId", "==", user.uid)
            )
          ).catch(() => ({ docs: [] })),
          getDocs(
            query(
              collection(db, "smeCalendarEvents"),
              where("cmfId", "==", user.uid),
              limit(50)
            )
          ).catch(() => ({ docs: [] })),
        ]);

        // Process Business / Cohort matches
        businessMatchesSnap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const id = data.smeId || data.businessId || data.userId;
          const name =
            data.businessName ||
            data.smeName ||
            data.registeredName ||
            data.companyName;
          addRecipient(id, name, { type: "Cohort SME" });
        });

        // Process Funder / Investor matches
        funderMatchesSnap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const id = data.funderId || data.investorId || data.userId;
          const name =
            data.fundName ||
            data.funderName ||
            data.investorName ||
            data.organizationName;
          addRecipient(id, name, { type: "Investor / Funder" });
        });

        // Process Catalyst matches
        catalystMatchesSnap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const id = data.catalystId || data.userId;
          const name =
            data.catalystName ||
            data.acceleratorName ||
            data.hubName;
          addRecipient(id, name, { type: "Catalyst Partner" });
        });

        // Process CMF Applications
        cmfAppsSnap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const id = data.applicantId || data.smeId || data.userId;
          const name =
            data.businessName ||
            data.applicantName ||
            data.smeName;
          addRecipient(id, name, { type: "Applicant SME" });
        });

        // Process prior meeting participants
        recentEventsSnap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.to && data.to !== user.uid) {
            addRecipient(data.to, data.toName || data.recipientName, {
              type: data.toType || "Participant",
            });
          }
          if (data.createdBy && data.createdBy !== user.uid) {
            addRecipient(
              data.createdBy,
              data.createdByName || data.host,
              { type: "Participant" }
            );
          }
        });

        const recipients = Array.from(recipientsMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setMatchesList(recipients);
      } catch (error) {
        console.error("Error fetching recipients for CMF calendar:", error);
      } finally {
        setLoadingRecipients(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="cmf-calendar-system">
      <div className="cmf-calendar-page-shell">
        <section className="cmf-calendar-stats-section">
          <EventData />
        </section>

        <section className="cmf-calendar-meetings-section">
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

export default CMFCalendar;
