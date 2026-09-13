import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "../../firebaseConfig";

import "./EventData.css";

const EventData = () => {
 
  const [stats, setStats] =
  useState({
    incoming: 0,
    requested: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    rescheduled: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeEvents = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          setStats({
            created: 0,
            completed: 0,
            rescheduled: 0,
            cancelled: 0,
          });

          setLoading(false);
          return;
        }

        const eventsQuery = query(
          collection(db, "smeCalendarEvents"),
          where("smeId", "==", user.uid)
        );

        unsubscribeEvents = onSnapshot(
          eventsQuery,
          (querySnapshot) => {
          let incoming = 0;
let requested = 0;
let scheduled = 0;
let completed = 0;
let cancelled = 0;
let rescheduled = 0;


querySnapshot.forEach(
  (docSnap) => {
    const data =
      docSnap.data();

    const status =
      String(
        data.status || ""
      ).toLowerCase();


    if (status === "pending") {
      const outgoing =
        data.createdBy ===
          user.uid &&
        Boolean(data.to) &&
        data.isInvitation !==
          true;

      const incomingRequest =
        data.isInvitation ===
          true ||
        (
          data.createdBy &&
          data.createdBy !==
            user.uid
        );

      if (outgoing) {
        requested += 1;
      }

      if (incomingRequest) {
        incoming += 1;
      }
    }


    if (
      status === "scheduled"
    ) {
      scheduled += 1;
    }


    if (
      status === "completed"
    ) {
      completed += 1;
    }


    if (
      status === "cancelled"
    ) {
      cancelled += 1;
    }


    if (
      status ===
        "rescheduled" ||
      data.wasRescheduled ===
        true ||
      Boolean(
        data.rescheduledAt
      ) ||
      Number(
        data.rescheduleCount ||
          0
      ) > 0
    ) {
      rescheduled += 1;
    }
  }
);


setStats({
  incoming,
  requested,
  scheduled,
  completed,
  cancelled,
  rescheduled,
});
            setLoading(false);
          },
          (error) => {
            console.error(
              "Error fetching calendar statistics:",
              error
            );

            setLoading(false);
          }
        );
      }
    );

    return () => {
      unsubscribeAuth();

      if (unsubscribeEvents) {
        unsubscribeEvents();
      }
    };
  }, []);

  const cards = [
    {
      title: "Events Scheduled",
      value: stats.created,
      description:
        "Scheduled events awaiting completion",
      className: "scheduled-card",
    },
    {
      title: "Events Completed",
      value: stats.completed,
      description:
        "Events successfully completed",
      className: "completed-card",
    },
    {
      title: "Events Cancelled",
      value: stats.cancelled,
      description:
        "Events that were cancelled",
      className: "cancelled-card",
    },
    {
      title: "Events Rescheduled",
      value: stats.rescheduled,
      description:
        "Events moved to another date or time",
      className: "rescheduled-card",
    },
  ];

  return (
    <div className="event-data-container">
      <div className="event-data-pipeline">
        {cards.map((card) => (
          <article
            key={card.title}
            className={`pipeline-card ${card.className}`}
          >
            <div className="pipeline-card-top">
              <div className="pipeline-value">
                {loading ? "—" : card.value}
              </div>

              <span className="pipeline-dot" />
            </div>

            <div className="pipeline-title">
              {card.title}
            </div>

            <div className="pipeline-description">
              {card.description}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default EventData;