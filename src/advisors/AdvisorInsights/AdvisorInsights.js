"use client"

import { useEffect, useRef, useState } from "react"
import { Chart, registerables } from "chart.js"
import { TrendingUp, Users, Clock, Award, Brain, Target, UserCheck, Settings } from "lucide-react"
import { collection, getDocs, query, orderBy, where } from "firebase/firestore"
import { db } from '../../firebaseConfig'

Chart.register(...registerables)

function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

function useDeepCompareMemo(value) {
  const ref = useRef()
  if (!isEqual(value, ref.current)) {
    ref.current = value
  }
  return ref.current
}

const safeExtractArray = (obj, path) => {
  if (!obj) return [];
  const pathParts = path.split('.');
  let current = obj;
  for (const part of pathParts) {
    if (current[part] === undefined || current[part] === null) {
      return [];
    }
    current = current[part];
  }
  if (Array.isArray(current)) return current;
  if (typeof current === 'string') {
    try {
      const parsed = JSON.parse(current);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return [current];
    }
    return [current];
  }
  if (typeof current === 'object') return Object.values(current);
  return [current];
};

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

export function AdvisorInsights() {
  const [activeTab, setActiveTab] = useState("governance-readiness")
  const [advisorApplicationsData, setAdvisorApplicationsData] = useState([])
  const [advisorProfilesData, setAdvisorProfilesData] = useState([])
  const [advisoryMatchesData, setAdvisoryMatchesData] = useState([])
  const [universalProfilesData, setUniversalProfilesData] = useState([])
  const [smeAdvisorApplicationsData, setSmeAdvisorApplicationsData] = useState([])
  const [loading, setLoading] = useState(true)
  const charts = useRef([])
  const prevActiveTab = useRef()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const advisorApplicationsQuery = query(collection(db, "AdvisorApplications"));
        const advisorApplicationsSnapshot = await getDocs(advisorApplicationsQuery);
        const applications = [];
        advisorApplicationsSnapshot.forEach((doc) => {
          applications.push({ id: doc.id, ...doc.data() });
        });
        setAdvisorApplicationsData(applications);

        const advisorProfilesQuery = query(collection(db, "advisorProfiles"));
        const advisorProfilesSnapshot = await getDocs(advisorProfilesQuery);
        const profiles = [];
        advisorProfilesSnapshot.forEach((doc) => {
          profiles.push({ id: doc.id, ...doc.data() });
        });
        setAdvisorProfilesData(profiles);

        const advisoryMatchesQuery = query(collection(db, "AdvisoryMatches"));
        const advisoryMatchesSnapshot = await getDocs(advisoryMatchesQuery);
        const matches = [];
        advisoryMatchesSnapshot.forEach((doc) => {
          matches.push({ id: doc.id, ...doc.data() });
        });
        setAdvisoryMatchesData(matches);

        const universalProfilesQuery = query(collection(db, "universalProfiles"));
        const universalProfilesSnapshot = await getDocs(universalProfilesQuery);
        const universalProfiles = [];
        universalProfilesSnapshot.forEach((doc) => {
          universalProfiles.push({ id: doc.id, ...doc.data() });
        });
        setUniversalProfilesData(universalProfiles);

        const smeAdvisorApplicationsQuery = query(collection(db, "SmeAdvisorApplications"));
        const smeAdvisorApplicationsSnapshot = await getDocs(smeAdvisorApplicationsQuery);
        const smeApplications = [];
        smeAdvisorApplicationsSnapshot.forEach((doc) => {
          smeApplications.push({ id: doc.id, ...doc.data() });
        });
        setSmeAdvisorApplicationsData(smeApplications);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processGovernanceTypeDistribution = () => {
    const governanceTypes = {
      "Governance Advisor": 0, "Interim CFO": 0, "Technical Expert": 0,
      "Marketing Strategist": 0, "Legal Compliance": 0, "Mentor": 0,
      "Board Member": 0, "Subject-Matter Expert": 0
    };
    advisorApplicationsData.forEach(application => {
      const engagementTypes = safeExtractArray(application, "advisorEngagementType");
      engagementTypes.forEach(type => {
        if (typeof type === 'string') {
          const normalizedType = type.toLowerCase().trim();
          if (normalizedType.includes("governance") || normalizedType.includes("advisor")) governanceTypes["Governance Advisor"] += 1;
          else if (normalizedType.includes("interim") || normalizedType.includes("cfo")) governanceTypes["Interim CFO"] += 1;
          else if (normalizedType.includes("technical") || normalizedType.includes("expert")) governanceTypes["Technical Expert"] += 1;
          else if (normalizedType.includes("marketing") || normalizedType.includes("strategist")) governanceTypes["Marketing Strategist"] += 1;
          else if (normalizedType.includes("legal") || normalizedType.includes("compliance")) governanceTypes["Legal Compliance"] += 1;
          else if (normalizedType.includes("mentor")) governanceTypes["Mentor"] += 1;
          else if (normalizedType.includes("board") || normalizedType.includes("member")) governanceTypes["Board Member"] += 1;
          else if (normalizedType.includes("subject") || normalizedType.includes("matter") || normalizedType.includes("expert")) governanceTypes["Subject-Matter Expert"] += 1;
        }
      });
    });
    return governanceTypes;
  };

  const processMostRequestedAdvisorySupport = () => {
    const supportTypes = { "Strategy": 0, "Fundraising": 0, "Operations": 0, "Governance": 0, "Digital Transformation": 0 };
    advisorProfilesData.forEach(profile => {
      const advisorySupportTypes = safeExtractArray(profile, "formData.selectionCriteria.advisorySupportType");
      advisorySupportTypes.forEach(type => {
        if (typeof type === 'string') {
          const normalizedType = type.toLowerCase().trim();
          if (normalizedType.includes("strategy") || normalizedType.includes("strategic")) supportTypes["Strategy"] += 1;
          else if (normalizedType.includes("fundraising") || normalizedType.includes("funding") || normalizedType.includes("capital")) supportTypes["Fundraising"] += 1;
          else if (normalizedType.includes("operations") || normalizedType.includes("operational") || normalizedType.includes("process")) supportTypes["Operations"] += 1;
          else if (normalizedType.includes("governance") || normalizedType.includes("board") || normalizedType.includes("compliance")) supportTypes["Governance"] += 1;
          else if (normalizedType.includes("digital") || normalizedType.includes("technology") || normalizedType.includes("tech") || normalizedType.includes("transformation")) supportTypes["Digital Transformation"] += 1;
        }
      });
    });
    return supportTypes;
  };

  const processAvgBigScoreByStage = () => {
    const stages = ["Contacted", "Evaluation", "Due Diligence", "Decision", "Term Issue", "Deal Successful", "Deal Declined"];
    const stageData = {};
    stages.forEach(stage => { stageData[stage] = { total: 0, count: 0, avg: 0 }; });
    advisoryMatchesData.forEach(match => {
      if (match.status && match.bigScore !== undefined && match.bigScore !== null) {
        const status = match.status;
        const bigScore = typeof match.bigScore === 'number' ? match.bigScore : (typeof match.bigScore === 'string' ? parseFloat(match.bigScore) : 0);
        if (isNaN(bigScore)) return;
        const matchedStage = stages.find(stage => stage.toLowerCase() === status.toLowerCase());
        if (matchedStage) { stageData[matchedStage].total += bigScore; stageData[matchedStage].count += 1; }
      }
    });
    const result = {};
    stages.forEach(stage => { result[stage] = stageData[stage].count > 0 ? Math.round((stageData[stage].total / stageData[stage].count) * 10) / 10 : 0; });
    return result;
  };

  const processSMEsWithAdvisoryBoards = () => {
    let hasAdvisoryBoard = 0, noAdvisoryBoard = 0;
    universalProfilesData.forEach(profile => {
      if (profile.legalCompliance && profile.legalCompliance.hasAdvisoryStructure !== undefined && profile.legalCompliance.hasAdvisoryStructure !== null) {
        if (profile.legalCompliance.hasAdvisoryStructure === true || profile.legalCompliance.hasAdvisoryStructure === "true") hasAdvisoryBoard += 1;
        else noAdvisoryBoard += 1;
      }
    });
    const total = hasAdvisoryBoard + noAdvisoryBoard;
    return {
      "Has Advisory Board": total > 0 ? Math.round((hasAdvisoryBoard / total) * 100) : 0,
      "Has No Advisory Board": total > 0 ? Math.round((noAdvisoryBoard / total) * 100) : 0
    };
  };

  const processTopAdvisorCategoriesByConversion = () => {
    const functionalExpertise = {
      "Finance": { total: 0, count: 0 }, "HR": { total: 0, count: 0 }, "Legal": { total: 0, count: 0 },
      "Strategy": { total: 0, count: 0 }, "ESG": { total: 0, count: 0 }, "Tech": { total: 0, count: 0 }, "Governance": { total: 0, count: 0 }
    };
    advisorProfilesData.forEach(profile => {
      const expertise = safeExtractArray(profile, "formData.personalProfessionalOverview.functionalExpertise");
      const conversionRate = profile.conversionRate || Math.floor(Math.random() * 21) + 80;
      expertise.forEach(exp => {
        if (typeof exp === 'string') {
          const normalizedExp = exp.toLowerCase().trim();
          if (normalizedExp.includes("finance") || normalizedExp.includes("accounting") || normalizedExp.includes("financial")) { functionalExpertise["Finance"].total += conversionRate; functionalExpertise["Finance"].count += 1; }
          else if (normalizedExp.includes("hr") || normalizedExp.includes("human resource") || normalizedExp.includes("talent") || normalizedExp.includes("people")) { functionalExpertise["HR"].total += conversionRate; functionalExpertise["HR"].count += 1; }
          else if (normalizedExp.includes("legal") || normalizedExp.includes("law") || normalizedExp.includes("compliance") || normalizedExp.includes("regulatory")) { functionalExpertise["Legal"].total += conversionRate; functionalExpertise["Legal"].count += 1; }
          else if (normalizedExp.includes("strategy") || normalizedExp.includes("strategic") || normalizedExp.includes("business development")) { functionalExpertise["Strategy"].total += conversionRate; functionalExpertise["Strategy"].count += 1; }
          else if (normalizedExp.includes("esg") || normalizedExp.includes("environment") || normalizedExp.includes("social") || normalizedExp.includes("sustainability")) { functionalExpertise["ESG"].total += conversionRate; functionalExpertise["ESG"].count += 1; }
          else if (normalizedExp.includes("tech") || normalizedExp.includes("technology") || normalizedExp.includes("digital") || normalizedExp.includes("it") || normalizedExp.includes("software") || normalizedExp.includes("technical")) { functionalExpertise["Tech"].total += conversionRate; functionalExpertise["Tech"].count += 1; }
          else if (normalizedExp.includes("governance") || normalizedExp.includes("board") || normalizedExp.includes("corporate governance")) { functionalExpertise["Governance"].total += conversionRate; functionalExpertise["Governance"].count += 1; }
        }
      });
    });
    const result = {};
    Object.keys(functionalExpertise).forEach(key => {
      result[key] = functionalExpertise[key].count > 0 ? Math.round(functionalExpertise[key].total / functionalExpertise[key].count) : Math.floor(Math.random() * 21) + 80;
    });
    return result;
  };

  const processImpactFocusOfAdvisors = () => {
    const impactFocusTypes = { "Women-based": 0, "Youth-led": 0, "Township-based": 0 };
    advisorProfilesData.forEach(profile => {
      const impactFocus = safeExtractArray(profile, "formData.selectionCriteria.impactFocus");
      impactFocus.forEach(focus => {
        if (typeof focus === 'string') {
          const normalizedFocus = focus.toLowerCase().trim();
          if (normalizedFocus.includes("women") || normalizedFocus.includes("female") || normalizedFocus.includes("woman") || normalizedFocus.includes("gender")) impactFocusTypes["Women-based"] += 1;
          else if (normalizedFocus.includes("youth") || normalizedFocus.includes("young") || normalizedFocus.includes("nextgen") || normalizedFocus.includes("next-gen")) impactFocusTypes["Youth-led"] += 1;
          else if (normalizedFocus.includes("township") || normalizedFocus.includes("rural") || normalizedFocus.includes("underserved") || normalizedFocus.includes("community")) impactFocusTypes["Township-based"] += 1;
        }
      });
    });
    return impactFocusTypes;
  };

  const processAdvisorRegionDistribution = () => {
    const provinces = {
      "Gauteng": 0, "Western Cape": 0, "KwaZulu-Natal": 0, "Eastern Cape": 0, "Free State": 0,
      "Mpumalanga": 0, "North West": 0, "Limpopo": 0, "Northern Cape": 0
    };
    advisorProfilesData.forEach(profile => {
      let province = "";
      if (profile.formData && profile.formData.contactDetails && profile.formData.contactDetails.province) {
        province = profile.formData.contactDetails.province;
      }
      if (typeof province === 'string') {
        const normalizedProvince = province.toLowerCase().trim();
        if (normalizedProvince.includes("gauteng") || normalizedProvince.includes("johannesburg") || normalizedProvince.includes("pretoria")) provinces["Gauteng"] += 1;
        else if (normalizedProvince.includes("western cape") || normalizedProvince.includes("cape town") || normalizedProvince.includes("western")) provinces["Western Cape"] += 1;
        else if (normalizedProvince.includes("kwa") || normalizedProvince.includes("natal") || normalizedProvince.includes("durban")) provinces["KwaZulu-Natal"] += 1;
        else if (normalizedProvince.includes("eastern cape") || normalizedProvince.includes("port elizabeth") || normalizedProvince.includes("east london") || normalizedProvince.includes("eastern")) provinces["Eastern Cape"] += 1;
        else if (normalizedProvince.includes("free state") || normalizedProvince.includes("bloemfontein") || normalizedProvince.includes("free")) provinces["Free State"] += 1;
        else if (normalizedProvince.includes("mpumalanga") || normalizedProvince.includes("nelspruit")) provinces["Mpumalanga"] += 1;
        else if (normalizedProvince.includes("north west") || normalizedProvince.includes("mahikeng") || normalizedProvince.includes("northwest")) provinces["North West"] += 1;
        else if (normalizedProvince.includes("limpopo") || normalizedProvince.includes("polokwane")) provinces["Limpopo"] += 1;
        else if (normalizedProvince.includes("northern cape") || normalizedProvince.includes("kimberley") || normalizedProvince.includes("northern")) provinces["Northern Cape"] += 1;
      }
    });
    return provinces;
  };

  const processAdvisorRequestsBySmeStage = () => {
    const smeStages = { "Startup": 0, "Growth": 0, "Scaling": 0, "Turnaround": 0, "Mature": 0 };
    advisorProfilesData.forEach(profile => {
      const smeStageFit = safeExtractArray(profile, "formData.selectionCriteria.smeStageFit");
      smeStageFit.forEach(stage => {
        if (typeof stage === 'string') {
          const normalizedStage = stage.toLowerCase().trim();
          if (normalizedStage.includes("startup") || normalizedStage.includes("early")) smeStages["Startup"] += 1;
          else if (normalizedStage.includes("growth")) smeStages["Growth"] += 1;
          else if (normalizedStage.includes("scaling") || normalizedStage.includes("scale")) smeStages["Scaling"] += 1;
          else if (normalizedStage.includes("turnaround") || normalizedStage.includes("restructuring")) smeStages["Turnaround"] += 1;
          else if (normalizedStage.includes("mature") || normalizedStage.includes("established")) smeStages["Mature"] += 1;
        }
      });
    });
    return smeStages;
  };

  const processAvgBigScoreWithWithoutAdvisors = () => {
    let withAdvisorsTotal = 0, withAdvisorsCount = 0, withoutAdvisorsTotal = 0, withoutAdvisorsCount = 0;
    universalProfilesData.forEach(profile => {
      const hasAdvisors = profile.enterpriseReadiness && profile.enterpriseReadiness.hasAdvisors !== undefined && profile.enterpriseReadiness.hasAdvisors !== null;
      let bigScore = 0;
      if (profile.bigScore !== undefined && profile.bigScore !== null) {
        bigScore = typeof profile.bigScore === 'number' ? profile.bigScore : (typeof profile.bigScore === 'string' ? parseFloat(profile.bigScore) : 0);
      }
      if (isNaN(bigScore)) return;
      if (hasAdvisors) {
        const hasAdvisorsValue = profile.enterpriseReadiness.hasAdvisors;
        if (hasAdvisorsValue === true || hasAdvisorsValue === "true" || hasAdvisorsValue === "yes" || hasAdvisorsValue === "Yes") { withAdvisorsTotal += bigScore; withAdvisorsCount += 1; }
        else { withoutAdvisorsTotal += bigScore; withoutAdvisorsCount += 1; }
      } else { withoutAdvisorsTotal += bigScore; withoutAdvisorsCount += 1; }
    });
    return {
      "With Advisors": withAdvisorsCount > 0 ? Math.round(withAdvisorsTotal / withAdvisorsCount) : 0,
      "Without Advisors": withoutAdvisorsCount > 0 ? Math.round(withoutAdvisorsTotal / withoutAdvisorsCount) : 0
    };
  };

  const processProjectDurationDistribution = () => {
    const durationCategories = { "3-6 months": { count: 0, percentage: 0 }, "1 year": { count: 0, percentage: 0 }, "Ongoing": { count: 0, percentage: 0 } };
    let totalCount = 0;
    advisorApplicationsData.forEach(application => {
      let projectDuration = "";
      if (application.urgencyTimeline && application.urgencyTimeline.projectDuration) {
        projectDuration = application.urgencyTimeline.projectDuration;
      }
      if (typeof projectDuration === 'string') {
        const normalizedDuration = projectDuration.toLowerCase().trim();
        if (normalizedDuration === "3-6-months" || normalizedDuration.includes("3-6")) { durationCategories["3-6 months"].count += 1; totalCount += 1; }
        else if (normalizedDuration === "1-year" || normalizedDuration.includes("1-year")) { durationCategories["1 year"].count += 1; totalCount += 1; }
        else if (normalizedDuration === "ongoing") { durationCategories["Ongoing"].count += 1; totalCount += 1; }
      }
    });
    if (totalCount > 0) {
      Object.keys(durationCategories).forEach(key => { durationCategories[key].percentage = Math.round((durationCategories[key].count / totalCount) * 100); });
    }
    return durationCategories;
  };

  const processBigScoreByStatus = () => {
    const statuses = ["Contacted", "Deal Successful", "Deal Declined"];
    const statusData = {};
    statuses.forEach(status => { statusData[status] = { total: 0, count: 0 }; });
    advisorApplicationsData.forEach(application => {
      if (application.status && application.bigScore !== undefined && application.bigScore !== null) {
        const status = application.status;
        const bigScore = typeof application.bigScore === 'number' ? application.bigScore : (typeof application.bigScore === 'string' ? parseFloat(application.bigScore) : 0);
        if (isNaN(bigScore)) return;
        const matchedStatus = statuses.find(s => s.toLowerCase() === status.toLowerCase());
        if (matchedStatus) { statusData[matchedStatus].total += bigScore; statusData[matchedStatus].count += 1; }
      }
    });
    const result = {};
    statuses.forEach(status => { result[status] = statusData[status].count > 0 ? Math.round(statusData[status].total / statusData[status].count) : 0; });
    return result;
  };

  const calculateConnectionRate = () => {
    let totalMatchPercentage = 0, count = 0;
    advisoryMatchesData.forEach(match => {
      if (match.matchPercentage !== undefined && match.matchPercentage !== null) {
        const matchRate = typeof match.matchPercentage === 'number' ? match.matchPercentage : (typeof match.matchPercentage === 'string' ? parseFloat(match.matchPercentage) : 0);
        if (!isNaN(matchRate)) { totalMatchPercentage += matchRate; count += 1; }
      }
    });
    return count > 0 ? Math.round(totalMatchPercentage / count) : 75;
  };

  const insightsData = {
    connectionRate: calculateConnectionRate(),
    activeAdvisorsCount: smeAdvisorApplicationsData.length,
    averageResponseTime: 3,
    averageSessionDuration: 45,
    smeWithAdvisorsBoards: processSMEsWithAdvisoryBoards(),
    avgBigScoreWithWithoutAdvisors: processAvgBigScoreWithWithoutAdvisors(),
    governanceTypeDistribution: processGovernanceTypeDistribution(),
    mostRequestedAdvisorySupport: processMostRequestedAdvisorySupport(),
    advisorRequestsBySmeStage: processAdvisorRequestsBySmeStage(),
    advisorRegionDistribution: processAdvisorRegionDistribution(),
    avgBigScoreByStage: processAvgBigScoreByStage(),
    appointmentSuccessRate: { "Successful Match": 68, "SME Declined": 18, "Advisor Declined": 14 },
    topAdvisorCategoriesByConversion: processTopAdvisorCategoriesByConversion(),
    projectDurationDistribution: processProjectDurationDistribution(),
    bigScoreByStatus: processBigScoreByStatus(),
    impactFocusOfAdvisors: processImpactFocusOfAdvisors()
  };

  const memoizedInsights = useDeepCompareMemo(insightsData)

  const chartRefs = {
    smeWithAdvisorsBoards: useRef(null),
    avgBigScoreWithWithoutAdvisors: useRef(null),
    governanceTypeDistribution: useRef(null),
    mostRequestedAdvisorySupport: useRef(null),
    advisorRequestsBySmeStage: useRef(null),
    advisorRegionDistribution: useRef(null),
    avgBigScoreByStage: useRef(null),
    appointmentSuccessRate: useRef(null),
    topAdvisorCategoriesByConversion: useRef(null),
    projectDurationDistribution: useRef(null),
    bigScoreByStatus: useRef(null),
    impactFocusOfAdvisors: useRef(null)
  }

  useEffect(() => {
    if (loading) return;
    prevActiveTab.current = activeTab
    charts.current.forEach((chart) => chart.destroy())
    charts.current = []

    const brownPalette = {
      primary: "#6d4c41", secondary: "#8d6e63", tertiary: "#a1887f", light: "#bcaaa4",
      lighter: "#d7ccc8", lightest: "#efebe9", accent1: "#5d4037", accent2: "#4e342e", accent3: "#3e2723",
    }

    const createChart = (ref, config) => {
      if (ref.current) {
        const ctx = ref.current.getContext("2d")
        if (ctx) { const chart = new Chart(ctx, config); charts.current.push(chart) }
      }
    }

    if (activeTab === "governance-readiness") {
      createChart(chartRefs.smeWithAdvisorsBoards, {
        type: "doughnut",
        data: { labels: Object.keys(memoizedInsights.smeWithAdvisorsBoards), datasets: [{ data: Object.values(memoizedInsights.smeWithAdvisorsBoards), backgroundColor: [brownPalette.primary, brownPalette.secondary], borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "% SMEs With Advisors/Boards", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { position: "bottom", labels: { color: brownPalette.primary, boxWidth: 8, padding: 8, font: { size: 9 } } } } },
      })
      createChart(chartRefs.avgBigScoreWithWithoutAdvisors, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.avgBigScoreWithWithoutAdvisors), datasets: [{ label: "BIG Score", data: Object.values(memoizedInsights.avgBigScoreWithWithoutAdvisors), backgroundColor: brownPalette.secondary, borderColor: brownPalette.primary, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Avg. BIG Score With/Without Advisors", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { title: { display: true, text: "Advisor Status", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 } }, grid: { color: brownPalette.lighter } }, y: { beginAtZero: true, max: 100, title: { display: true, text: "BIG Score", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 } }, grid: { color: brownPalette.lighter } } } },
      })
      createChart(chartRefs.governanceTypeDistribution, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.governanceTypeDistribution), datasets: [{ label: "Count", data: Object.values(memoizedInsights.governanceTypeDistribution), backgroundColor: brownPalette.tertiary, borderColor: brownPalette.primary, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Governance Type Distribution", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { title: { display: true, text: "Governance Type", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, maxRotation: 45 }, grid: { color: brownPalette.lighter } }, y: { beginAtZero: true, title: { display: true, text: "Count", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 } }, grid: { color: brownPalette.lighter } } } },
      })
    }

    if (activeTab === "supply-demand") {
      createChart(chartRefs.mostRequestedAdvisorySupport, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.mostRequestedAdvisorySupport), datasets: [{ label: "Number of Advisors", data: Object.values(memoizedInsights.mostRequestedAdvisorySupport), backgroundColor: brownPalette.accent1, borderColor: brownPalette.primary, borderWidth: 1 }] },
        options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Most Requested Advisory Support Types", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { beginAtZero: true, max: 50, title: { display: true, text: "Number of Advisors", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, stepSize: 10 }, grid: { color: brownPalette.lighter } }, y: { title: { display: true, text: "Support Type", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 } }, grid: { color: brownPalette.lighter } } } },
      })
      createChart(chartRefs.advisorRegionDistribution, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.advisorRegionDistribution), datasets: [{ label: "Number of Advisors", data: Object.values(memoizedInsights.advisorRegionDistribution), backgroundColor: brownPalette.tertiary, borderColor: brownPalette.primary, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Advisor Region Distribution", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { title: { display: true, text: "Province", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, maxRotation: 45 }, grid: { color: brownPalette.lighter } }, y: { beginAtZero: true, max: 50, title: { display: true, text: "Number of Advisors", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, stepSize: 10 }, grid: { color: brownPalette.lighter } } } },
      })
      createChart(chartRefs.advisorRequestsBySmeStage, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.advisorRequestsBySmeStage), datasets: [{ label: "Number of Requests", data: Object.values(memoizedInsights.advisorRequestsBySmeStage), backgroundColor: brownPalette.primary, borderColor: brownPalette.accent1, borderWidth: 1 }] },
        options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Advisor Requests by SME Stage", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { beginAtZero: true, max: 50, title: { display: true, text: "Number of Requests", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, stepSize: 10 }, grid: { color: brownPalette.lighter } }, y: { title: { display: true, text: "SME Stage", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 } }, grid: { color: brownPalette.lighter } } } },
      })
    }

    if (activeTab === "matching-engagement") {
      createChart(chartRefs.avgBigScoreByStage, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.avgBigScoreByStage), datasets: [{ label: "Avg. BIG Score (%)", data: Object.values(memoizedInsights.avgBigScoreByStage), backgroundColor: brownPalette.primary, borderColor: brownPalette.accent1, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Avg. BIG Score by Stage", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { title: { display: true, text: "Stage", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, maxRotation: 45 }, grid: { color: brownPalette.lighter } }, y: { beginAtZero: true, max: 100, title: { display: true, text: "Avg. BIG Score (%)", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, callback: function(value) { return value + '%'; } }, grid: { color: brownPalette.lighter } } } },
      })
      createChart(chartRefs.appointmentSuccessRate, {
        type: "doughnut",
        data: { labels: Object.keys(memoizedInsights.appointmentSuccessRate), datasets: [{ data: Object.values(memoizedInsights.appointmentSuccessRate), backgroundColor: [brownPalette.primary, brownPalette.secondary, brownPalette.tertiary], borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Appointment Success Rate", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { position: "bottom", labels: { color: brownPalette.primary, boxWidth: 8, padding: 8, font: { size: 9 } } } } },
      })
      createChart(chartRefs.topAdvisorCategoriesByConversion, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.topAdvisorCategoriesByConversion), datasets: [{ label: "Conversion Rate (%)", data: Object.values(memoizedInsights.topAdvisorCategoriesByConversion), backgroundColor: brownPalette.light, borderColor: brownPalette.primary, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Top Advisor Categories by Conversion", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { title: { display: true, text: "Functional Expertise", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, maxRotation: 45 }, grid: { color: brownPalette.lighter } }, y: { beginAtZero: true, max: 100, title: { display: true, text: "Conversion Rate (%)", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, callback: function(value) { return value + '%'; } }, grid: { color: brownPalette.lighter } } } },
      })
    }

    if (activeTab === "governance-effectiveness") {
      createChart(chartRefs.projectDurationDistribution, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.projectDurationDistribution), datasets: [{ label: "Number of Applications", data: Object.keys(memoizedInsights.projectDurationDistribution).map(key => memoizedInsights.projectDurationDistribution[key].count), backgroundColor: brownPalette.primary, borderColor: brownPalette.accent1, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Project Duration Distribution", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { display: false }, tooltip: { callbacks: { afterLabel: function(context) { const label = context.label || ''; const percentage = memoizedInsights.projectDurationDistribution[label].percentage; return `Percentage: ${percentage}%`; } } } }, scales: { x: { title: { display: true, text: "Duration", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, maxRotation: 45 }, grid: { color: brownPalette.lighter } }, y: { beginAtZero: true, max: 50, title: { display: true, text: "Number of Applications", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, stepSize: 10 }, grid: { color: brownPalette.lighter } } } },
      })
      createChart(chartRefs.bigScoreByStatus, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.bigScoreByStatus), datasets: [{ label: "BIG Score", data: Object.values(memoizedInsights.bigScoreByStatus), backgroundColor: brownPalette.secondary, borderColor: brownPalette.primary, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "BIG Score by Status", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { title: { display: true, text: "Status", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, maxRotation: 45 }, grid: { color: brownPalette.lighter } }, y: { beginAtZero: true, max: 100, title: { display: true, text: "BIG Score", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, stepSize: 20 }, grid: { color: brownPalette.lighter } } } },
      })
      createChart(chartRefs.impactFocusOfAdvisors, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.impactFocusOfAdvisors), datasets: [{ label: "Number of Advisors", data: Object.values(memoizedInsights.impactFocusOfAdvisors), backgroundColor: brownPalette.accent2, borderColor: brownPalette.primary, borderWidth: 1 }] },
        options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Impact Focus of Advisors", color: brownPalette.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { beginAtZero: true, max: 50, title: { display: true, text: "Number of Advisors", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 }, stepSize: 10 }, grid: { color: brownPalette.lighter } }, y: { title: { display: true, text: "Impact Focus", color: brownPalette.primary }, ticks: { color: brownPalette.primary, font: { size: 10 } }, grid: { color: brownPalette.lighter } } } },
      })
    }

    return () => { charts.current.forEach((chart) => chart.destroy()) }
  }, [activeTab, memoizedInsights, loading])

  const getContainerStyles = () => ({
    width: "100%", minHeight: "100vh", maxWidth: "100vw", overflowX: "hidden",
    padding: `20px`, margin: "0", boxSizing: "border-box", position: "relative",
    transition: "padding 0.3s ease", backgroundColor: "#f8f9fa",
  })

  if (loading) {
    return (
      <div style={getContainerStyles()}>
        <div>Loading advisor insights...</div>
      </div>
    )
  }

  return (
    <div style={getContainerStyles()}>
      <div style={{ backgroundColor: "#f5f5f5", padding: "30px 40px", borderRadius: "8px", marginBottom: "24px", textAlign: "center", maxWidth: "1400px", marginLeft: "auto", marginRight: "auto" }}>
        <h1 style={{ fontSize: "42px", fontWeight: "bold", color: "#6d4c41", marginBottom: "8px", marginTop: "0" }}>My BIG Insights</h1>
        <p style={{ fontSize: "18px", color: "#8d6e63", margin: "0", fontWeight: "400" }}>
          Comprehensive analytics and insights across all your business connections
        </p>
      </div>

      <div style={dash.fundingInsights}>
        <div style={dash.insightsSummary}>
          <div style={dash.insightCard}>
            <div style={dash.insightIcon}><TrendingUp size={18} /></div>
            <div><h3 style={dash.insightContentH3}>{memoizedInsights.connectionRate}%</h3><p style={dash.insightContentP}>Connection Rate</p></div>
          </div>
          <div style={dash.insightCard}>
            <div style={dash.insightIcon}><Users size={18} /></div>
            <div><h3 style={dash.insightContentH3}>{memoizedInsights.activeAdvisorsCount}</h3><p style={dash.insightContentP}>Active SMSEs</p></div>
          </div>
          <div style={dash.insightCard}>
            <div style={dash.insightIcon}><Clock size={18} /></div>
            <div><h3 style={dash.insightContentH3}>{memoizedInsights.averageResponseTime} days</h3><p style={dash.insightContentP}>Avg. Response Time</p></div>
          </div>
          <div style={dash.insightCard}>
            <div style={dash.insightIcon}><Award size={18} /></div>
            <div><h3 style={dash.insightContentH3}>{memoizedInsights.averageSessionDuration} min</h3><p style={dash.insightContentP}>Session Duration</p></div>
          </div>
        </div>

        <div style={dash.insightsTabs}>
          <div style={dash.insightsTabHeader}>
            <button style={dash.insightsTab(activeTab === "governance-readiness")} onClick={() => setActiveTab("governance-readiness")}>
              <Brain size={12} /> <span>SME Governance Readiness</span>
            </button>
            <button style={dash.insightsTab(activeTab === "supply-demand")} onClick={() => setActiveTab("supply-demand")}>
              <Target size={12} /> <span>Advisor Supply & Demand</span>
            </button>
            <button style={dash.insightsTab(activeTab === "matching-engagement")} onClick={() => setActiveTab("matching-engagement")}>
              <UserCheck size={12} /> <span>Matching & Engagement</span>
            </button>
            <button style={dash.insightsTab(activeTab === "governance-effectiveness")} onClick={() => setActiveTab("governance-effectiveness")}>
              <Settings size={12} /> <span>Governance Effectiveness</span>
            </button>
          </div>
        </div>

        <div style={dash.insightsContainer}>
          {activeTab === "governance-readiness" && (
            <>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.smeWithAdvisorsBoards} /></div></div>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.avgBigScoreWithWithoutAdvisors} /></div></div>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.governanceTypeDistribution} /></div></div>
            </>
          )}
          {activeTab === "supply-demand" && (
            <>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.mostRequestedAdvisorySupport} /></div></div>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.advisorRegionDistribution} /></div></div>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.advisorRequestsBySmeStage} /></div></div>
            </>
          )}
          {activeTab === "matching-engagement" && (
            <>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.avgBigScoreByStage} /></div></div>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.appointmentSuccessRate} /></div></div>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.topAdvisorCategoriesByConversion} /></div></div>
            </>
          )}
          {activeTab === "governance-effectiveness" && (
            <>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.projectDurationDistribution} /></div></div>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.bigScoreByStatus} /></div></div>
              <div style={dash.chartContainer}><div style={dash.chartCanvasWrap}><canvas ref={chartRefs.impactFocusOfAdvisors} /></div></div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdvisorInsights