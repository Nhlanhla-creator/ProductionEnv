import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import "./EventData.css";

const EventData = () => {
  const [stats, setStats] = useState({
    incoming: 0,
    requested: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    rescheduled: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs = [];

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setStats({
          incoming: 0,
          requested: 0,
          scheduled: 0,
          completed: 0,
          cancelled: 0,
          rescheduled: 0,
        });
        setLoading(false);
        return;
      }

      const eventsMap = new Map();

      const computeAndSetStats = () => {
        let incoming = 0;
        let requested = 0;
        let scheduled = 0;
        let completed = 0;
        let cancelled = 0;
        let rescheduled = 0;

        eventsMap.forEach((data) => {
          const status = String(data.status || "").toLowerCase();

          if (status === "pending") {
            const outgoing =
              data.createdBy === user.uid &&
              Boolean(data.to) &&
              data.isInvitation !== true;

            const incomingRequest =
              data.isInvitation === true ||
              (data.createdBy && data.createdBy !== user.uid);

            if (outgoing) requested += 1;
            if (incomingRequest) incoming += 1;
          }

          if (status === "scheduled") {
            scheduled += 1;
          }

          if (status === "completed") {
            completed += 1;
          }

          if (status === "cancelled") {
            cancelled += 1;
          }

          if (
            status === "rescheduled" ||
            data.wasRescheduled === true ||
            Boolean(data.rescheduledAt) ||
            Number(data.rescheduleCount || 0) > 0
          ) {
            rescheduled += 1;
          }
        });

        setStats({
          incoming,
          requested,
          scheduled,
          completed,
          cancelled,
          rescheduled,
        });
        setLoading(false);
      };

      const queries = [
        query(collection(db, "smeCalendarEvents"), where("cmfId", "==", user.uid)),
        query(collection(db, "smeCalendarEvents"), where("createdBy", "==", user.uid)),
        query(collection(db, "smeCalendarEvents"), where("to", "==", user.uid)),
        query(collection(db, "smeCalendarEvents"), where("smeId", "==", user.uid)),
      ];

      unsubs = queries.map((q) =>
        onSnapshot(
          q,
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "removed") {
                eventsMap.delete(change.doc.id);
              } else {
                eventsMap.set(change.doc.id, change.doc.data());
              }
            });
            computeAndSetStats();
          },
          (err) => {
            console.error("Error fetching CMF calendar stats:", err);
            setLoading(false);
          }
        )
      );
    });

    return () => {
      unsubscribeAuth();
      unsubs.forEach((u) => u && u());
    };
  }, []);

  const cards = [
    {
      title: "Facilitation Sessions Scheduled",
      value: stats.scheduled,
      description: "Upcoming cohort, advisory & investor sessions",
      className: "scheduled-card",
    },
    {
      title: "Pending Session Requests",
      value: stats.requested + stats.incoming,
      description: "Incoming enterprise requests & pending invites",
      className: "rescheduled-card",
    },
    {
      title: "Engagements Completed",
      value: stats.completed,
      description: "Successfully delivered facilitation sessions",
      className: "completed-card",
    },
    {
      title: "Rescheduled / Cancelled",
      value: stats.rescheduled + stats.cancelled,
      description: "Sessions moved or cancelled by participants",
      className: "cancelled-card",
    },
  ];

  return (
    <div className="event-data-container">
      <div className="event-data-pipeline">
        {cards.map((card) => (
          <article key={card.title} className={`pipeline-card ${card.className}`}>
            <div className="pipeline-card-top">
              <div className="pipeline-value">{loading ? "—" : card.value}</div>
              <span className="pipeline-dot" />
            </div>
            <div className="pipeline-title">{card.title}</div>
            <div className="pipeline-description">{card.description}</div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default EventData;
