"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "./top-matches.css";

export function TopMatchesTable({ selectedCategory: initialCategory = "Funders", refreshKey = 0 }) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [funderMatches, setFunderMatches] = useState([]);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "smeApplications"),
      where("smeId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const seen = new Set();
      const results = snapshot.docs
        .map(doc => doc.data())
        .filter(app => app.status && app.status !== "Draft") // exclude drafts
        .filter(app => {
          if (seen.has(app.fundName)) return false;
          seen.add(app.fundName);
          return true;
        })
        .map(app => ({
          id: app.fundId || app.fundName,
          name: app.fundName || "Unnamed Funder",
          investmentType: app.investmentType || "N/A",
          match: app.matchPercentage || 0,
          location: app.location || "N/A",
          stageFocus: app.stage || "N/A",
          status: app.status || "Submitted",
        }));

      setFunderMatches(results);
    }, (error) => {
      console.error("Failed to load funder matches:", error);
    });

    return () => unsubscribe();
  }, [selectedCategory, refreshKey]);

  const getStatusClass = (status) => {
    if (["New", "Open", "Available", "Accepting", "Application Received"].some(s => status.includes(s))) {
      return "status-positive";
    } else if (["Limited", "Reviewing", "Due", "Negotiating"].some(s => status.includes(s))) {
      return "status-pending";
    } else {
      return "status-neutral";
    }
  };

  const getMatchClass = (match) => {
    if (match >= 90) return "match-excellent";
    if (match >= 80) return "match-good";
    return "match-average";
  };

  return (
    <div className="top-matches-container">
      <div className="top-matches-header">
        <h3>Top Matches</h3>
        <div className="category-tabs">
          <button
            className={`category-tab ${selectedCategory === "Funders" ? "active" : ""}`}
            onClick={() => setSelectedCategory("Funders")}
          >
            Funders
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="matches-table">
          <thead>
            <tr>
              <th>Funder Name</th>
              <th>Investment Type</th>
              <th>% Match</th>
              <th>Location</th>
              <th>Stage/Focus</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {funderMatches.length === 0 ? (
              <tr>
                <td colSpan="6">No submitted applications yet.</td>
              </tr>
            ) : (
              funderMatches.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? "row-even" : "row-odd"}>
                  <td className="name-cell">{item.name}</td>
                  <td>{item.investmentType}</td>
                  <td className={`match-cell ${getMatchClass(item.match)}`}>{item.match}%</td>
                  <td>{item.location}</td>
                  <td>{item.stageFocus}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
