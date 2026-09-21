"use client";

import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

import { db } from "../../firebaseConfig";
import EventData from "./event-data";
import Meetings from "./meetings";
import { CALENDAR_ROLES } from "../../utils/calendarRoles";
import { resolveCounterpartProfile } from "../../utils/counterpartProfile";

import "./Calendar.css";

const Calendar = ({ role = "sme" }) => {
  const roleConfig = CALENDAR_ROLES[role] || CALENDAR_ROLES.sme;

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
            recipientsMap.set(id, { id, name, ...extra });
          }
        };

        const snapshots = await Promise.all(
          roleConfig.matches.map((match) =>
            getDocs(
              query(
                collection(db, match.collection),
                where(match.myField, "==", user.uid)
              )
            )
          )
        );

        // Names not already stored on the application doc get resolved
        // afterwards against every role's profile collection.
        const pendingLookups = [];

        snapshots.forEach((snapshot, index) => {
          const match = roleConfig.matches[index];

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const counterpartId = data[match.counterpartField];

            const directName =
              (match.nameFields || []).map((f) => data[f]).find(Boolean) ||
              null;

            if (directName) {
              addRecipient(counterpartId, directName, { type: match.type });
            } else if (counterpartId) {
              pendingLookups.push({ id: counterpartId, type: match.type });
            }
          });
        });

        if (pendingLookups.length > 0) {
          const resolved = await Promise.all(
            pendingLookups.map(({ id }) => resolveCounterpartProfile(id))
          );

          resolved.forEach(({ name }, index) => {
            const { id, type } = pendingLookups[index];
            addRecipient(id, name || type, { type });
          });
        }

        const recipients = Array.from(recipientsMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setMatchesList(recipients);
      } catch (error) {
        console.error("Error fetching recipients for calendar:", error);
      } finally {
        setLoadingRecipients(false);
      }
    });

    return () => unsubscribe();
  }, [role, roleConfig]);

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