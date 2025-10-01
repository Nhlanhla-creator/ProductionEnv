"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import styles from "./top-matches.module.css";

export function SMEApplicationsTable({ selectedCategory: initialCategory = "SME Applications" }) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const q = query(collection(db, "smeApplications"), where("smeId", "==", user.uid));
        const snapshot = await getDocs(q);

        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().fundName,
          investmentType: doc.data().investmentType,
          match: doc.data().matchPercentage,
          location: doc.data().location,
          stageFocus: doc.data().stage,
          sector: doc.data().sector,
          fundingNeeded: doc.data().fundingNeeded,
          applicationDate: doc.data().applicationDate,
          status: doc.data().status
        }));

        setApplications(results);
      } catch (error) {
        console.error("Failed to load applications:", error);
      }
    };

    if (selectedCategory === "SMSE Applications") {
      fetchApplications();
    }
  }, [selectedCategory]);

  const getStatusClass = (status) => {
    if (["New", "Open", "Available", "Accepting", "Application Received"].some(s => status.includes(s))) {
      return styles.statusPositive;
    } else if (["Limited", "Reviewing", "Due", "Negotiating"].some(s => status.includes(s))) {
      return styles.statusPending;
    } else {
      return styles.statusNeutral;
    }
  };

  const getMatchClass = (match) => {
    if (match >= 90) return styles.matchExcellent;
    if (match >= 80) return styles.matchGood;
    return styles.matchAverage;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
    <h3>Approved SMSE Applications</h3>
        <div className={styles.categoryTabs}>
          <button
            className={`${styles.categoryTab} ${selectedCategory === "SMSE Applications" ? styles.active : ""}`}
            onClick={() => setSelectedCategory("SMSE Applications")}
          >
            SMSE Applications
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>SMSE Name</th>
              <th>Investment Type</th>
              <th>% Match</th>
              <th>Location</th>
              <th>Stage/Focus</th>
              <th>Sector</th>
              <th>Funding Needed</th>
              <th>Application Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan="9">No submitted applications yet.</td>
              </tr>
            ) : (
              applications.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td>{item.name}</td>
                  <td>{item.investmentType}</td>
                  <td className={getMatchClass(item.match)}>{item.match}%</td>
                  <td>{item.location}</td>
                  <td>{item.stageFocus}</td>
                  <td>{item.sector}</td>
                  <td>{item.fundingNeeded}</td>
                  <td>{item.applicationDate}</td>
                  <td>
                    <span className={getStatusClass(item.status)}>
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
