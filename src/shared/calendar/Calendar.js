"use client";
import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { calendarConfigs, getCalendarConfig } from "./calendarConfig";
import { loadRecipients } from "./calendarData";
import EventData from "./EventData";
import Meetings from "./Meetings";
import "./Calendar.css";
import "./SharedCalendar.css";

// Role is selected by the dashboard route, NEVER inferred from an arbitrary event.
const Calendar = ({ role = "sme", config: overrideConfig }) => {
  const config = useMemo(() => overrideConfig || getCalendarConfig(role), [role, overrideConfig]);
  const [matchesList, setMatchesList] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [stats, setStats] = useState({ created: 0, scheduled: 0, completed: 0, cancelled: 0 });

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) { setMatchesList([]); setLoadingRecipients(false); }
        return;
      }
      setLoadingRecipients(true);
      try {
        const results = await loadRecipients(config, user.uid);
        if (active) setMatchesList(results);
      } catch (error) {
        console.error("Could not load calendar recipients:", error);
        if (active) setMatchesList([]);
      } finally { if (active) setLoadingRecipients(false); }
    });
    return () => { active = false; unsubscribe(); };
  }, [config]);

  return (
    <main className="calendar-system">
      <div className="calendar-page-shell">
        <section className="calendar-stats-section"><EventData stats={stats} /></section>
        <section className="calendar-meetings-section">
          <Meetings config={config} matchesList={matchesList} loadingRecipients={loadingRecipients} onStatsChange={setStats} />
        </section>
      </div>
    </main>
  );
};

export { calendarConfigs };
export default Calendar;
