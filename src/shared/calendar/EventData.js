import React from "react";
export default function EventData({ stats = {} }) {
  const cards = [
    { key: "created", title: "Events Created", description: "Total events you created" },
    { key: "scheduled", title: "Events Scheduled", description: "Confirmed meetings" },
    { key: "completed", title: "Events Completed", description: "Marked as completed" },
    { key: "cancelled", title: "Events Cancelled", description: "Declined or cancelled meetings" },
  ];
  return <div className="shared-calendar-stats" aria-label="Calendar statistics">
    {cards.map(({ key, title, description }) => <div key={key} className="shared-stat-card" title={description}>
      <div className="shared-stat-label">{title}</div><div className="shared-stat-value">{stats[key] ?? 0}</div>
    </div>)}
  </div>;
}
