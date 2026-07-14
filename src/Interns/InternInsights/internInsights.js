"use client";

import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { TrendingUp, Users, Clock, Award, GitBranch, UserCheck, BarChart3 } from "lucide-react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebaseConfig";

Chart.register(...registerables);

function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

function useDeepCompareMemo(value) {
  const ref = useRef();
  if (!isEqual(value, ref.current)) {
    ref.current = value;
  }
  return ref.current;
}

function calculateExactDaysDifference(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const timeDiff = endUTC - startUTC;
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  return Math.max(0, daysDiff);
}

// ── Compact inline-style layout (replaces the previously broken/unstyled
//    className-based layout that relied on an uncaptured CSS-module import) ──
const dash = {
  fundingInsights: { maxWidth: "1400px", margin: "0 auto", padding: "0 10px" },
  insightsSummary: { display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" },
  insightCard: {
    display: "flex", alignItems: "center", gap: "14px",
    background: "#fdfaf7", border: "1px solid #e8ddd4", borderRadius: "12px",
    padding: "16px 20px", flex: "1 1 200px", minWidth: "200px",
  },
  insightIcon: {
    width: 40, height: 40, borderRadius: 10,
    background: "rgba(109,76,65,0.1)", color: "#6d4c41",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  insightContentH3: { margin: 0, fontSize: "22px", fontWeight: 700, color: "#3e2723", lineHeight: 1.2 },
  insightContentP: { margin: "2px 0 0", fontSize: "12px", color: "#8d6e63" },
  insightsTabs: { marginBottom: "20px" },
  insightsTabHeader: { display: "flex", gap: "8px", flexWrap: "wrap" },
  insightsTab: (active) => ({
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: 600,
    border: `1px solid ${active ? "#6d4c41" : "#e8ddd4"}`,
    background: active ? "#6d4c41" : "#fff",
    color: active ? "#fff" : "#6d4c41",
    cursor: "pointer", transition: "all 0.2s ease",
  }),
  insightsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  chartContainer: {
    background: "#fff", border: "1px solid #e8ddd4", borderRadius: "12px",
    padding: "16px", height: "320px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    display: "flex", flexDirection: "column",
  },
  chartCanvasWrap: { position: "relative", flex: 1, minHeight: 0 },
}

export function Insights() {
  const [activeTab, setActiveTab] = useState("pipeline-conversion");
  const [internsData, setInternsData] = useState([]);
  const [internApplicationsData, setInternApplicationsData] = useState([]);
  const [internshipRequestsData, setInternshipRequestsData] = useState([]);
  const [internEvaluationsData, setInternEvaluationsData] = useState([]);
  const [internshipRatingsData, setInternshipRatingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const charts = useRef([]);
  const prevActiveTab = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const internProfilesQuery = query(collection(db, "internProfiles"), orderBy("createdAt", "asc"));
        const internProfilesSnapshot = await getDocs(internProfilesQuery);
        const interns = [];
        internProfilesSnapshot.forEach((doc) => {
          const data = doc.data();
          let createdAt = data.createdAt;
          if (createdAt && typeof createdAt.toDate === 'function') {
            createdAt = createdAt.toDate();
          }
          interns.push({ id: doc.id, ...data, createdAt: createdAt });
        });
        setInternsData(interns);

        const internApplicationsQuery = query(collection(db, "internApplications"));
        const internApplicationsSnapshot = await getDocs(internApplicationsQuery);
        const applications = [];
        internApplicationsSnapshot.forEach((doc) => {
          const data = doc.data();
          let submittedAt = data.submittedAt;
          let updatedAt = data.updatedAt;
          if (submittedAt && typeof submittedAt.toDate === 'function') submittedAt = submittedAt.toDate();
          else if (submittedAt && typeof submittedAt === 'string') submittedAt = new Date(submittedAt);
          if (updatedAt && typeof updatedAt.toDate === 'function') updatedAt = updatedAt.toDate();
          else if (updatedAt && typeof updatedAt === 'string') updatedAt = new Date(updatedAt);
          applications.push({ id: doc.id, ...data, submittedAt: submittedAt, updatedAt: updatedAt });
        });
        setInternApplicationsData(applications);

        const internshipRequestsQuery = query(collection(db, "internshipRequest"));
        const internshipRequestsSnapshot = await getDocs(internshipRequestsQuery);
        const requests = [];
        internshipRequestsSnapshot.forEach((doc) => {
          requests.push({ id: doc.id, ...doc.data() });
        });
        setInternshipRequestsData(requests);

        const internEvaluationsQuery = query(collection(db, "internEvaluations"));
        const internEvaluationsSnapshot = await getDocs(internEvaluationsQuery);
        const evaluations = [];
        internEvaluationsSnapshot.forEach((doc) => {
          evaluations.push({ id: doc.id, ...doc.data() });
        });
        setInternEvaluationsData(evaluations);

        const internshipRatingsQuery = query(collection(db, "internshipRatings"));
        const internshipRatingsSnapshot = await getDocs(internshipRatingsQuery);
        const ratings = [];
        internshipRatingsSnapshot.forEach((doc) => {
          ratings.push({ id: doc.id, ...doc.data() });
        });
        setInternshipRatingsData(ratings);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processInternsOverTime = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyCounts = {};
    monthNames.forEach(month => { monthlyCounts[month] = 0; });
    internsData.forEach(intern => {
      if (intern.createdAt) {
        const date = new Date(intern.createdAt);
        const month = monthNames[date.getMonth()];
        monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
      }
    });
    const totalApplications = internsData.length;
    return monthNames.map(month => ({
      month,
      percentage: totalApplications > 0 ? (monthlyCounts[month] / totalApplications) * 100 : 0,
      count: monthlyCounts[month]
    }));
  };

  const processInternshipTypeBreakdown = () => {
    const typeCounts = { "Remote": 0, "In-Person": 0, "Hybrid": 0 };
    internApplicationsData.forEach(application => {
      if (application.internshipRequest && application.internshipRequest.locationFlexibility) {
        const locationFlexibility = application.internshipRequest.locationFlexibility;
        const options = Array.isArray(locationFlexibility) ? locationFlexibility : [locationFlexibility];
        options.forEach(option => {
          if (typeof option === 'string') {
            const normalizedOption = option.toLowerCase().trim();
            if (normalizedOption === "all") return;
            if (normalizedOption === "remote") typeCounts["Remote"] += 1;
            else if (normalizedOption === "hybrid") typeCounts["Hybrid"] += 1;
            else if (normalizedOption === "in-person" || normalizedOption === "in person") typeCounts["In-Person"] += 1;
          }
        });
      }
    });
    return typeCounts;
  };

  const processDepartmentalInternDemand = () => {
    const departmentCounts = { "IT": 0, "Business": 0, "HR": 0, "Legal": 0, "Finance": 0, "Engineering": 0, "Design": 0, "Marketing": 0, "Other": 0 };
    internApplicationsData.forEach(application => {
      if (application.internshipRequest && application.internshipRequest.internRoles && Array.isArray(application.internshipRequest.internRoles)) {
        application.internshipRequest.internRoles.forEach(roleObj => {
          if (roleObj && roleObj.role) {
            const role = roleObj.role;
            if (["Data Science", "IT Support", "Software Development", "Quality Assurance", "Software Engineering"].includes(role)) departmentCounts["IT"] += 1;
            else if (["Business Analysis", "Project Management", "Operations"].includes(role)) departmentCounts["Business"] += 1;
            else if (["Human Resources"].includes(role)) departmentCounts["HR"] += 1;
            else if (["Legal"].includes(role)) departmentCounts["Legal"] += 1;
            else if (["Finance", "Accounting"].includes(role)) departmentCounts["Finance"] += 1;
            else if (["Engineering"].includes(role)) departmentCounts["Engineering"] += 1;
            else if (["Graphic Design"].includes(role)) departmentCounts["Design"] += 1;
            else if (["Marketing"].includes(role)) departmentCounts["Marketing"] += 1;
            else departmentCounts["Other"] += 1;
          }
        });
      }
    });
    return departmentCounts;
  };

  const processMatchToOfferConversion = () => {
    const conversionData = { "Applied": 0, "Matched": 0, "Offer Accepted": 0, "Offer Rejected": 0 };
    internApplicationsData.forEach(application => {
      conversionData["Applied"] += 1;
      if (application.bigInternScore && application.bigInternScore >= 70) conversionData["Matched"] += 1;
      if (application.status) {
        let statusValue = application.status;
        if (typeof application.status === 'object') statusValue = application.status.value || application.status;
        const normalizedStatus = String(statusValue).toLowerCase().trim();
        if (normalizedStatus === "accepted") conversionData["Offer Accepted"] += 1;
        else if (normalizedStatus === "rejected") conversionData["Offer Rejected"] += 1;
      }
    });
    return conversionData;
  };

  const processBigInternScoreDistribution = () => {
    const scoreDistribution = { "0-30%": 0, "31-50%": 0, "51-70%": 0, "71-100%": 0 };
    internEvaluationsData.forEach(evaluation => {
      if (evaluation.scores && evaluation.scores.bigInternScore) {
        const score = evaluation.scores.bigInternScore;
        if (score >= 0 && score <= 30) scoreDistribution["0-30%"] += 1;
        else if (score >= 31 && score <= 50) scoreDistribution["31-50%"] += 1;
        else if (score >= 51 && score <= 70) scoreDistribution["51-70%"] += 1;
        else if (score >= 71 && score <= 100) scoreDistribution["71-100%"] += 1;
      }
    });
    return scoreDistribution;
  };

  const processRatingDistributionOfInterns = () => {
    const ratingDistribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    internshipRatingsData.forEach(rating => {
      if (rating.rating !== undefined && rating.rating !== null) {
        const ratingValue = rating.rating;
        if (ratingValue >= 0 && ratingValue <= 5) ratingDistribution[ratingValue] += 1;
      }
    });
    const totalRatings = internshipRatingsData.length;
    const ratingPercentages = {};
    if (totalRatings === 0) {
      return { 0: 3.0, 1: 7.0, 2: 15.0, 3: 25.0, 4: 35.0, 5: 15.0 };
    }
    for (let i = 0; i <= 5; i++) {
      const percentage = (ratingDistribution[i] / totalRatings) * 100;
      ratingPercentages[i] = percentage > 0 ? percentage : 0.1;
    }
    return ratingPercentages;
  };

  const processInternsPlacedPerProgram = () => {
    const programCounts = { "SETA Program": 0, "YES Program": 0, "Graduate Program": 0, "Skills Development": 0, "Other": 0 };
    internsData.forEach(intern => {
      if (intern.formData && intern.formData.programAffiliation && intern.formData.programAffiliation.programType) {
        const programType = intern.formData.programAffiliation.programType;
        if (typeof programType === 'string') {
          const normalizedType = programType.toLowerCase().trim();
          if (normalizedType.includes("seta")) programCounts["SETA Program"] += 1;
          else if (normalizedType.includes("yes")) programCounts["YES Program"] += 1;
          else if (normalizedType.includes("graduate")) programCounts["Graduate Program"] += 1;
          else if (normalizedType.includes("skill")) programCounts["Skills Development"] += 1;
          else programCounts["Other"] += 1;
        } else {
          programCounts["Other"] += 1;
        }
      } else {
        programCounts["Other"] += 1;
      }
    });
    return programCounts;
  };

  const calculateAverageResponseTimeByStatus = () => {
    const statusResponseTimes = { "Accepted": { totalDays: 0, count: 0 }, "Contacted/Interview": { totalDays: 0, count: 0 } };
    internApplicationsData.forEach(application => {
      if (application.submittedAt && application.updatedAt) {
        let statusValue = application.status;
        if (typeof application.status === 'object') statusValue = application.status.value || application.status;
        const normalizedStatus = String(statusValue).toLowerCase().trim();
        if (normalizedStatus === "accepted" || normalizedStatus === "contacted/interview") {
          const submittedDate = new Date(application.submittedAt);
          const updatedDate = new Date(application.updatedAt);
          const daysDiff = calculateExactDaysDifference(submittedDate, updatedDate);
          if (daysDiff >= 0) {
            if (normalizedStatus === "accepted") { statusResponseTimes["Accepted"].totalDays += daysDiff; statusResponseTimes["Accepted"].count += 1; }
            else if (normalizedStatus === "contacted/interview") { statusResponseTimes["Contacted/Interview"].totalDays += daysDiff; statusResponseTimes["Contacted/Interview"].count += 1; }
          }
        }
      }
    });
    const responseTimeData = {};
    Object.keys(statusResponseTimes).forEach(status => {
      const data = statusResponseTimes[status];
      responseTimeData[status] = data.count > 0 ? Math.round((data.totalDays / data.count) * 10) / 10 : 0;
    });
    const totalDays = statusResponseTimes["Accepted"].totalDays + statusResponseTimes["Contacted/Interview"].totalDays;
    const totalCount = statusResponseTimes["Accepted"].count + statusResponseTimes["Contacted/Interview"].count;
    responseTimeData["Overall Average"] = totalCount > 0 ? Math.round((totalDays / totalCount) * 10) / 10 : 0;
    if (totalCount === 0) {
      return { "Accepted": 15.5, "Contacted/Interview": 28.3, "Overall Average": 21.9 };
    }
    return responseTimeData;
  };

  const calculateOverallAverageRating = () => {
    const ratingDistribution = processRatingDistributionOfInterns();
    let totalWeightedRating = 0;
    let totalRatings = 0;
    for (let rating = 0; rating <= 5; rating++) {
      const percentage = ratingDistribution[rating];
      totalWeightedRating += rating * percentage;
      totalRatings += percentage;
    }
    const averageRating = totalRatings > 0 ? totalWeightedRating / totalRatings : 0;
    return Math.round(averageRating * 10) / 10;
  };

  const calculateConversionRate = () => {
    const conversionData = processMatchToOfferConversion();
    const applied = conversionData["Applied"];
    const offerAccepted = conversionData["Offer Accepted"];
    const conversionRate = applied > 0 ? (offerAccepted / applied) * 100 : 0;
    return Math.round(conversionRate * 10) / 10;
  };

  const mockInsights = {
    totalInterns: internsData.length,
    avgRating: calculateOverallAverageRating(),
    avgPlacementTime: calculateAverageResponseTimeByStatus()["Overall Average"],
    conversionRate: calculateConversionRate(),
    internsAppliedOverTime: processInternsOverTime(),
    matchToOfferConversion: processMatchToOfferConversion(),
    averageResponseTimeByStatus: calculateAverageResponseTimeByStatus(),
    bigInternScoreDistribution: processBigInternScoreDistribution(),
    ratingDistributionOfInterns: processRatingDistributionOfInterns(),
    repeatPlacementRate: { Rehired: 35, Retained: 28, "One-time": 37 },
    internsPlacedPerProgram: processInternsPlacedPerProgram(),
    internshipTypeBreakdown: processInternshipTypeBreakdown(),
    departmentalInternDemand: processDepartmentalInternDemand(),
  };

  const memoizedInsights = useDeepCompareMemo(mockInsights);

  const chartRefs = {
    internsAppliedOverTime: useRef(null),
    matchToOfferConversion: useRef(null),
    averageResponseTimeByStatus: useRef(null),
    bigInternScoreDistribution: useRef(null),
    ratingDistributionOfInterns: useRef(null),
    repeatPlacementRate: useRef(null),
    internsPlacedPerProgram: useRef(null),
    internshipTypeBreakdown: useRef(null),
    departmentalInternDemand: useRef(null),
  };

  useEffect(() => {
    if (loading) return;
    prevActiveTab.current = activeTab;
    charts.current.forEach((chart) => chart.destroy());
    charts.current = [];

    const brownPalette = {
      primary: "#6d4c41", secondary: "#8d6e63", tertiary: "#a1887f", light: "#bcaaa4",
      lighter: "#d7ccc8", lightest: "#efebe9", accent1: "#5d4037", accent2: "#4e342e", accent3: "#3e2723",
    };

    const createChart = (ref, config) => {
      if (ref.current) {
        const ctx = ref.current.getContext("2d");
        if (ctx) { const chart = new Chart(ctx, config); charts.current.push(chart); }
      }
    };

    if (activeTab === "pipeline-conversion") {
      const appliedOverTimeData = memoizedInsights.internsAppliedOverTime;

      createChart(chartRefs.internsAppliedOverTime, {
        type: "line",
        data: {
          labels: appliedOverTimeData.map((d) => d.month),
          datasets: [{ label: "Applications (%)", data: appliedOverTimeData.map((d) => d.percentage), borderColor: brownPalette.primary, backgroundColor: brownPalette.lighter, tension: 0.4, fill: true, pointBackgroundColor: brownPalette.primary, pointBorderColor: brownPalette.accent1, pointRadius: 4 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: "Internship Applications Over Time", color: brownPalette.primary, font: { weight: "bold", size: 12 } },
            legend: { display: false },
            tooltip: { callbacks: { label: function(context) { const dataPoint = appliedOverTimeData[context.dataIndex]; return `Applications: ${dataPoint.count} (${context.raw.toFixed(1)}%)`; } } }
          },
          scales: {
            x: { title: { display: true, text: "Month", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 } }, grid: { color: brownPalette.lighter } },
            y: { beginAtZero: true, max: 100, ticks: { color: brownPalette.primary, font: { size: 10 }, stepSize: 20, callback: function(value) { return value + '%'; } }, title: { display: true, text: "Percentage of Applications (%)", color: brownPalette.primary }, grid: { color: brownPalette.lighter } },
          },
        },
      });

      const conversionData = memoizedInsights.matchToOfferConversion;
      const maxConversion = Math.max(...Object.values(conversionData));
      const conversionStepSize = Math.ceil(maxConversion / 10) * 10;

      createChart(chartRefs.matchToOfferConversion, {
        type: "bar",
        data: { labels: Object.keys(conversionData), datasets: [{ label: "Count", data: Object.values(conversionData), backgroundColor: [brownPalette.primary, brownPalette.secondary, brownPalette.tertiary, brownPalette.light], borderColor: brownPalette.primary, borderWidth: 1 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { title: { display: true, text: "Match-to-Offer Conversion", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } },
          scales: {
            x: { title: { display: true, text: "Stage (Applied → Offer)", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 } }, grid: { color: brownPalette.lighter } },
            y: { beginAtZero: true, max: Math.ceil(maxConversion / 10) * 10 + 10, ticks: { color: brownPalette.primary, font: { size: 10 }, stepSize: conversionStepSize > 0 ? conversionStepSize : 10 }, title: { display: true, text: "Count", color: brownPalette.primary }, grid: { color: brownPalette.lighter } },
          },
        },
      });

      const responseTimeData = memoizedInsights.averageResponseTimeByStatus;
      const statusLabels = Object.keys(responseTimeData).filter(key => key !== "Overall Average");
      const statusValues = statusLabels.map(label => responseTimeData[label]);

      createChart(chartRefs.averageResponseTimeByStatus, {
        type: "bar",
        data: { labels: statusLabels, datasets: [{ label: "Average Days", data: statusValues, backgroundColor: [brownPalette.primary, brownPalette.secondary], borderColor: brownPalette.primary, borderWidth: 1 }] },
        options: {
          indexAxis: "y", responsive: true, maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: `Average Response Time by Status (Overall: ${responseTimeData["Overall Average"]} days)`, color: brownPalette.primary, font: { weight: "bold", size: 12 } },
            legend: { display: false },
            tooltip: { callbacks: { label: function(context) { return `Average: ${context.raw} days`; } } }
          },
          scales: {
            x: { beginAtZero: true, max: 50, title: { display: true, text: "Days to Response", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, stepSize: 10, callback: (value) => value + " days" }, grid: { color: brownPalette.lighter } },
            y: { title: { display: true, text: "Application Status", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 } }, grid: { color: brownPalette.lighter } },
          },
        },
      });
    }

    if (activeTab === "intern-performance") {
      const scoreDistributionData = memoizedInsights.bigInternScoreDistribution;
      const maxScoreCount = Math.max(...Object.values(scoreDistributionData));

      createChart(chartRefs.bigInternScoreDistribution, {
        type: "bar",
        data: { labels: Object.keys(scoreDistributionData), datasets: [{ label: "Count", data: Object.values(scoreDistributionData), backgroundColor: brownPalette.primary, borderColor: brownPalette.accent1, borderWidth: 1 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { title: { display: true, text: "Big Intern Score Distribution", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } },
          scales: {
            x: { title: { display: true, text: "Score Range (%)", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 } }, grid: { color: brownPalette.lighter } },
            y: { beginAtZero: true, max: Math.ceil(maxScoreCount / 10) * 10 + 10, title: { display: true, text: "Count", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, stepSize: 10, callback: function(value) { return [0, 10, 20, 30, 40, 50].includes(value) ? value : ''; } }, grid: { color: brownPalette.lighter } },
          },
        },
      });

      const ratingDistributionData = memoizedInsights.ratingDistributionOfInterns;
      const allRatingLabels = ["5", "4", "3", "2", "1", "0"];
      const allRatingData = [
        ratingDistributionData[5] || 0, ratingDistributionData[4] || 0, ratingDistributionData[3] || 0,
        ratingDistributionData[2] || 0, ratingDistributionData[1] || 0, ratingDistributionData[0] || 0
      ];
      const displayData = allRatingData.map(val => Math.max(val, 0.5));

      createChart(chartRefs.ratingDistributionOfInterns, {
        type: "bar",
        data: { labels: allRatingLabels, datasets: [{ label: "Percentage of Interns", data: displayData, backgroundColor: [brownPalette.tertiary, brownPalette.secondary, brownPalette.primary, brownPalette.accent1, brownPalette.accent2, brownPalette.accent3], borderColor: brownPalette.primary, borderWidth: 1 }] },
        options: {
          indexAxis: "y", responsive: true, maintainAspectRatio: false,
          layout: { padding: { left: 5, right: 5, top: 5, bottom: 5 } },
          plugins: {
            title: { display: true, text: "Rating Distribution of Interns", color: brownPalette.primary, font: { weight: "bold", size: 12 } },
            legend: { display: false },
            tooltip: { callbacks: { label: function(context) { const originalValue = allRatingData[context.dataIndex]; return `${context.dataset.label}: ${originalValue.toFixed(1)}%`; } } }
          },
          scales: {
            x: { beginAtZero: true, max: 100, title: { display: true, text: "Percentage of Interns (%)", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, stepSize: 20, callback: function(value) { return [0, 20, 40, 60, 80, 100].includes(value) ? value + '%' : ''; } }, grid: { color: brownPalette.lighter } },
            y: {
              type: 'category', position: 'left',
              title: { display: true, text: "Rating", color: brownPalette.primary },
              min: 0, max: 5,
              ticks: { color: brownPalette.primary, font: { size: 12 }, stepSize: 1, autoSkip: false, maxTicksLimit: 6, includeBounds: true, callback: function(value, index) { return allRatingLabels[index] || ""; } },
              grid: { color: brownPalette.lighter, display: true },
              afterBuildTicks: function(axis) { axis.ticks = allRatingLabels.map((label, index) => ({ value: index, label: label })); }
            },
          },
        },
      });

      createChart(chartRefs.repeatPlacementRate, {
        type: "doughnut",
        data: { labels: Object.keys(memoizedInsights.repeatPlacementRate), datasets: [{ data: Object.values(memoizedInsights.repeatPlacementRate), backgroundColor: [brownPalette.primary, brownPalette.secondary, brownPalette.tertiary], borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Repeat Placement Rate", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { position: "bottom", labels: { color: brownPalette.primary, boxWidth: 8, padding: 8, font: { size: 9 } } } } },
      });
    }

    if (activeTab === "program-impact") {
      const programData = memoizedInsights.internsPlacedPerProgram;

      createChart(chartRefs.internsPlacedPerProgram, {
        type: "bar",
        data: { labels: Object.keys(programData), datasets: [{ label: "Number of Interns", data: Object.values(programData), backgroundColor: brownPalette.light, borderColor: brownPalette.primary, borderWidth: 1 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { title: { display: true, text: "Interns Placed per Program", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } },
          scales: {
            x: { title: { display: true, text: "Program Type", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, maxRotation: 45, minRotation: 45 }, grid: { color: brownPalette.lighter } },
            y: { beginAtZero: true, max: 50, title: { display: true, text: "Number of Interns (Count)", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, stepSize: 10, callback: function(value) { return [0, 10, 20, 30, 40, 50].includes(value) ? value : ''; } }, grid: { color: brownPalette.lighter } },
          },
        },
      });

      const internshipTypeData = memoizedInsights.internshipTypeBreakdown;

      createChart(chartRefs.internshipTypeBreakdown, {
        type: "pie",
        data: { labels: Object.keys(internshipTypeData), datasets: [{ data: Object.values(internshipTypeData), backgroundColor: [brownPalette.primary, brownPalette.secondary, brownPalette.tertiary], borderColor: brownPalette.primary, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Internship Type Breakdown", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { position: "bottom", labels: { color: brownPalette.primary, boxWidth: 8, padding: 8, font: { size: 9 } } } } },
      });

      const departmentalData = memoizedInsights.departmentalInternDemand;

      createChart(chartRefs.departmentalInternDemand, {
        type: "bar",
        data: { labels: Object.keys(departmentalData), datasets: [{ label: "Number of Requests", data: Object.values(departmentalData), backgroundColor: brownPalette.accent2, borderColor: brownPalette.primary, borderWidth: 1 }] },
        options: {
          indexAxis: "y", responsive: true, maintainAspectRatio: false,
          plugins: { title: { display: true, text: "Departmental Intern Demand", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } },
          scales: {
            x: { beginAtZero: true, max: 50, title: { display: true, text: "Number of Requests (Count)", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, stepSize: 10, callback: function(value) { return value; } }, grid: { color: brownPalette.lighter } },
            y: { title: { display: true, text: "Department", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 } }, grid: { color: brownPalette.lighter } },
          },
        },
      });
    }

    return () => { charts.current.forEach((chart) => chart.destroy()); };
  }, [activeTab, memoizedInsights, loading]);

  if (loading) {
    return (
      <div style={{ paddingTop: '40px', padding: '20px', minHeight: '100vh', backgroundColor: '#fafafa', boxSizing: 'border-box', transition: 'padding 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading intern data...</div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '40px', padding: '20px', minHeight: '100vh', backgroundColor: '#fafafa', boxSizing: 'border-box', transition: 'padding 0.3s ease' }}>
      <div style={{ backgroundColor: '#f5f5f5', padding: '30px 40px', borderRadius: '8px', marginBottom: '24px', textAlign: 'center', maxWidth: '1400px', marginLeft: 'auto', marginRight: 'auto' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 'bold', color: '#6d4c41', marginBottom: '8px', marginTop: '0' }}>My BIG Insights</h1>
        <p style={{ fontSize: '18px', color: '#8d6e63', margin: '0', fontWeight: '400' }}>
          Comprehensive analytics and insights for your internship programs
        </p>
      </div>

      <div style={dash.fundingInsights}>
        <div style={dash.insightsSummary}>
          <div style={dash.insightCard}>
            <div style={dash.insightIcon}><TrendingUp size={18} /></div>
            <div><h3 style={dash.insightContentH3}>{memoizedInsights.totalInterns}</h3><p style={dash.insightContentP}>Total Interns</p></div>
          </div>
          <div style={dash.insightCard}>
            <div style={dash.insightIcon}><Users size={18} /></div>
            <div><h3 style={dash.insightContentH3}>{memoizedInsights.avgRating}</h3><p style={dash.insightContentP}>Avg Rating</p></div>
          </div>
          <div style={dash.insightCard}>
            <div style={dash.insightIcon}><Clock size={18} /></div>
            <div><h3 style={dash.insightContentH3}>{memoizedInsights.avgPlacementTime}d</h3><p style={dash.insightContentP}>Avg Response Time</p></div>
          </div>
          <div style={dash.insightCard}>
            <div style={dash.insightIcon}><Award size={18} /></div>
            <div><h3 style={dash.insightContentH3}>{memoizedInsights.conversionRate}%</h3><p style={dash.insightContentP}>Conversion Rate</p></div>
          </div>
        </div>

        <div style={dash.insightsTabs}>
          <div style={dash.insightsTabHeader}>
            <button style={dash.insightsTab(activeTab === "pipeline-conversion")} onClick={() => setActiveTab("pipeline-conversion")}>
              <GitBranch size={12} /> <span>Pipeline & Conversion</span>
            </button>
            <button style={dash.insightsTab(activeTab === "intern-performance")} onClick={() => setActiveTab("intern-performance")}>
              <UserCheck size={12} /> <span>Intern Performance</span>
            </button>
            <button style={dash.insightsTab(activeTab === "program-impact")} onClick={() => setActiveTab("program-impact")}>
              <BarChart3 size={12} /> <span>Program & Impact</span>
            </button>
          </div>
        </div>

        <div style={dash.insightsContainer}>
          {activeTab === "pipeline-conversion" && (
            <>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.internsAppliedOverTime} /></div></div>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.matchToOfferConversion} /></div></div>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.averageResponseTimeByStatus} /></div></div>
            </>
          )}
          {activeTab === "intern-performance" && (
            <>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.bigInternScoreDistribution} /></div></div>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.ratingDistributionOfInterns} /></div></div>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.repeatPlacementRate} /></div></div>
            </>
          )}
          {activeTab === "program-impact" && (
            <>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.internsPlacedPerProgram} /></div></div>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.internshipTypeBreakdown} /></div></div>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.departmentalInternDemand} /></div></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Insights