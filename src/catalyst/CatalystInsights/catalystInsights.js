"use client";

import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import {
  BarChart, PieChart, LineChart,
  TrendingUp, DollarSign, Users, Clock,
  Rocket, Target, Award, Activity
} from "lucide-react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from '../../firebaseConfig';

Chart.register(...registerables);

function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}
function useDeepCompareMemo(value) {
  const ref = useRef();
  if (!isEqual(value, ref.current)) ref.current = value;
  return ref.current;
}
const safeExtractArray = (obj, path) => {
  if (!obj) return [];
  let current = obj;
  for (const part of path.split('.')) {
    if (current[part] === undefined || current[part] === null) return [];
    current = current[part];
  }
  if (Array.isArray(current)) return current;
  if (typeof current === 'string') {
    try { const p = JSON.parse(current); if (Array.isArray(p)) return p; } catch {}
    return [current];
  }
  if (typeof current === 'object') return Object.values(current);
  return [current];
};

// ── Skeleton Components ────────────────────────────────────────────────────────

const StatCardSkeleton = () => (
  <div className="flex items-center gap-3 bg-cream rounded-xl p-4 flex-1 min-w-[140px]">
    <div className="w-10 h-10 rounded-lg bg-shimmer-light bg-shimmer animate-shimmer" />
    <div className="flex flex-col gap-2 flex-1">
      <div className="h-6 w-16 rounded bg-shimmer-light bg-shimmer animate-shimmer-d1" />
      <div className="h-3 w-24 rounded bg-shimmer-light bg-shimmer animate-shimmer-d2" />
    </div>
  </div>
);

const ChartSkeleton = ({ delay = "" }) => (
  <div className={`bg-white rounded-2xl border border-lightTan p-5 flex flex-col gap-3 min-h-[280px]`}>
    {/* Chart title */}
    <div className={`h-4 w-48 rounded bg-shimmer-light bg-shimmer ${delay || "animate-shimmer"}`} />
    {/* Fake bar chart bars */}
    <div className="flex items-end gap-2 flex-1 pt-4 pb-2">
      {[65, 40, 80, 55, 70, 45, 90].map((h, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t bg-shimmer-light bg-shimmer ${
            ["animate-shimmer","animate-shimmer-d1","animate-shimmer-d2","animate-shimmer-d3",
             "animate-shimmer-d4","animate-shimmer-d5","animate-shimmer"][i % 7]
          }`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
    {/* X-axis labels */}
    <div className="flex gap-2">
      {[4, 3, 5, 3, 4, 3, 5].map((w, i) => (
        <div key={i} className={`flex-1 h-2 rounded bg-shimmer-light bg-shimmer animate-shimmer-d${(i % 5) + 1}`} />
      ))}
    </div>
  </div>
);

const LeaderboardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-lightTan p-5 flex flex-col gap-4 min-h-[280px]">
    <div className="h-4 w-48 rounded bg-shimmer-light bg-shimmer animate-shimmer" />
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3 py-2 border-b border-lightTan last:border-0">
        <div className={`w-7 h-7 rounded-full bg-shimmer-light bg-shimmer animate-shimmer-d${i}`} />
        <div className={`flex-1 h-3 rounded bg-shimmer-light bg-shimmer animate-shimmer-d${i}`} />
        <div className={`w-20 h-3 rounded bg-shimmer-light bg-shimmer animate-shimmer-d${i + 1}`} />
      </div>
    ))}
  </div>
);

const TabSkeleton = () => (
  <div className="flex gap-2 flex-wrap">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className={`h-9 w-36 rounded-full bg-shimmer-light bg-shimmer animate-shimmer-d${i}`} />
    ))}
  </div>
);

const InsightsSkeleton = () => (
  <div className="min-h-screen bg-backgroundBrown px-5 py-6">
    {/* Header */}
    <div className="mb-6 flex flex-col gap-2">
      <div className="h-8 w-64 rounded-lg bg-shimmer-light bg-shimmer animate-shimmer" />
      <div className="h-4 w-96 rounded bg-shimmer-light bg-shimmer animate-shimmer-d1" />
    </div>

    {/* Stat cards */}
    <div className="flex flex-wrap gap-3 mb-6">
      {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
    </div>

    {/* Tabs */}
    <div className="mb-5"><TabSkeleton /></div>

    {/* Charts grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <ChartSkeleton delay="animate-shimmer" />
      <ChartSkeleton delay="animate-shimmer-d1" />
      <LeaderboardSkeleton />
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────

export function AcceleratorInsights() {
  const [activeTab, setActiveTab] = useState("program-types");
  const [catalystProfilesData, setCatalystProfilesData] = useState([]);
  const [catalystApplicationsData, setCatalystApplicationsData] = useState([]);
  const [smeCatalystApplicationsData, setSmeCatalystApplicationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const charts = useRef([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profSnap, appSnap, smeSnap] = await Promise.all([
          getDocs(query(collection(db, "catalystProfiles"))),
          getDocs(query(collection(db, "catalystApplications"))),
          getDocs(query(collection(db, "smeCatalystApplications"))),
        ]);
        setCatalystProfilesData(profSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setCatalystApplicationsData(appSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setSmeCatalystApplicationsData(smeSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Data processors (unchanged logic) ────────────────────────────────────
  const calculateAverageMatchRate = () => {
    if (!catalystApplicationsData.length) return 0;
    let total = 0, count = 0;
    catalystApplicationsData.forEach(a => {
      if (typeof a.matchPercentage === 'number' && !isNaN(a.matchPercentage)) { total += a.matchPercentage; count++; }
    });
    return count > 0 ? Math.round(total / count) : 0;
  };

  const countActivePrograms = () => catalystProfilesData.length;

  const calculateAverageFunding = () => {
    if (!catalystProfilesData.length) return 0;
    let total = 0, count = 0;
    catalystProfilesData.forEach(p => {
      safeExtractArray(p, "formData.programmeDetails.programs").forEach(prog => {
        const amt = typeof prog?.averageSupportAmount === 'number'
          ? prog.averageSupportAmount
          : parseFloat(String(prog?.averageSupportAmount || '').replace(/[^0-9.]/g, ''));
        if (!isNaN(amt)) { total += amt; count++; }
      });
    });
    return count > 0 ? Math.round(total / count) : 0;
  };

  const processBigScoreComparison = () => {
    let wT = 0, wC = 0, wOT = 0, wOC = 0;
    smeCatalystApplicationsData.forEach(a => {
      const s = a.bigScore || 0;
      if (typeof s === 'number' && !isNaN(s) && s > 0) {
        if ((a.status || '').toLowerCase().includes("support approved")) { wT += s; wC++; }
        else { wOT += s; wOC++; }
      }
    });
    return { "With Catalyst": wC > 0 ? Math.round(wT / wC) : 0, "Without Catalyst": wOC > 0 ? Math.round(wOT / wOC) : 0 };
  };

  const sectorCategoryMap = {
    "Healthcare / Nursing / Medical": "Health & Social Services",
    "NGO / Non-Profit / Community Services": "Health & Social Services",
    "Security / Emergency Services": "Health & Social Services",
    "Consulting / Business Services": "Business",
    "Human Resources / Recruitment": "Business",
    "Advertising / Marketing / PR": "Business",
    "Hospitality / Hotel / Catering": "Business",
    "Tourism / Travel / Leisure": "Business",
    "Accounting / Finance": "Finance",
    "Banking / Insurance / Investments": "Finance",
    "Legal / Law": "Law",
    "ICT / Information Technology": "Technology & Engineering",
    "Engineering (Civil, Mechanical, Electrical)": "Technology & Engineering",
    "Construction / Building / Civils": "Technology & Engineering",
    "Manufacturing / Production": "Technology & Engineering",
    "Trades / Artisans / Technical": "Technology & Engineering",
    "Telecommunications": "Technology & Engineering",
    "Education / Training / Teaching": "Science, Research & Education",
    "Science / Research / Development": "Science, Research & Education",
    "Agriculture / Forestry / Fishing": "Science, Research & Education",
    "Mining / Energy / Oil & Gas": "Science, Research & Education",
    "Generalist": "Other", "Automotive / Motor Industry": "Other",
    "Call Centre / Customer Service": "Other", "Retail / Wholesale / Sales": "Other",
    "Real Estate / Property": "Other", "Arts / Entertainment": "Other",
    "Media / Journalism / Publishing": "Other",
  };

  const categorizeSector = (sec) => {
    for (const [k, v] of Object.entries(sectorCategoryMap)) {
      if (sec.includes(k) || k.includes(sec)) return v;
    }
    const l = sec.toLowerCase();
    if (l.match(/health|care|medical|nursing|ngo|non-profit|community|security|emergency/)) return "Health & Social Services";
    if (l.match(/business|consult|hr|human resource|market|advert|hospitality|hotel|catering|tourism|travel|leisure/)) return "Business";
    if (l.match(/finance|account|bank|insurance|invest/)) return "Finance";
    if (l.match(/law|legal/)) return "Law";
    if (l.match(/tech|ict|information|engineer|construct|building|manufactur|production|trade|artisan|technical|telecom/)) return "Technology & Engineering";
    if (l.match(/science|research|develop|education|teach|train|agriculture|forestry|fishing|mining|energy|oil|gas/)) return "Science, Research & Education";
    return "Other";
  };

  const emptyIndustries = () => ({
    "Health & Social Services": 0, "Business": 0, "Finance": 0, "Law": 0,
    "Technology & Engineering": 0, "Science, Research & Education": 0, "Other": 0,
  });

  const processSmeIndustryMatchDistribution = () => {
    const cats = Object.fromEntries(Object.keys(emptyIndustries()).map(k => [k, { matched: 0, unmatched: 0, total: 0 }]));
    smeCatalystApplicationsData.forEach(a => {
      const isMatched = (a.status || '').toLowerCase().includes("support approved");
      (a.sector || '').split(',').map(s => s.trim()).filter(Boolean).forEach(sec => {
        const cat = categorizeSector(sec);
        cats[cat].total++; isMatched ? cats[cat].matched++ : cats[cat].unmatched++;
      });
    });
    return cats;
  };

  const processSupportTypeBreakdown = () => {
    const types = { grant_based: 0, mentorship: 0, training_education: 0, incubator: 0, accelerator: 0, hybrid: 0 };
    catalystProfilesData.forEach(p => {
      safeExtractArray(p, "formData.generalMatchingPreference.programStructure").forEach(t => {
        if (typeof t !== 'string') return;
        const n = t.toLowerCase();
        if (n.match(/grant|funding/)) types.grant_based++;
        else if (n.match(/mentor|coaching/)) types.mentorship++;
        else if (n.match(/training|education|learning/)) types.training_education++;
        else if (n.match(/incubat/)) types.incubator++;
        else if (n.match(/accelerat/)) types.accelerator++;
        else if (n.match(/hybrid|mixed|multiple/)) types.hybrid++;
      });
    });
    return types;
  };

  const processActiveProgramsByStage = () => {
    const stages = { Startup: 0, Scaling: 0, Growth: 0, Turnaround: 0, Mature: 0 };
    catalystProfilesData.forEach(p => {
      const s = (p.formData?.generalMatchingPreference?.programStage || '').toLowerCase();
      if (s.includes("startup")) stages.Startup++;
      else if (s.includes("scaling")) stages.Scaling++;
      else if (s.includes("growth")) stages.Growth++;
      else if (s.includes("turnaround")) stages.Turnaround++;
      else if (s.includes("mature")) stages.Mature++;
    });
    return stages;
  };

  const processApplicationVolumeOverTime = () => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const counts = Object.fromEntries(months.map(m => [m, 0]));
    catalystApplicationsData.forEach(a => {
      if (a.applicationDate) {
        try { counts[months[new Date(a.applicationDate).getMonth()]]++; } catch {}
      }
    });
    return months.map(m => ({ month: m, applications: counts[m] }));
  };

  const processLongestRunningPrograms = () =>
    catalystProfilesData
      .filter(p => p.submittedAt)
      .map(p => ({
        name: p.formData?.entityOverview?.registeredName || "Unnamed Program",
        submittedDate: new Date(p.submittedAt),
        daysSinceSubmission: Math.floor((Date.now() - new Date(p.submittedAt)) / 86400000),
      }))
      .sort((a, b) => a.submittedDate - b.submittedDate)
      .slice(0, 3);

  const processProgramsBySector = () => {
    const types = { funding_support: 0, market_access: 0, technology: 0, capacity_building: 0, social_impact: 0 };
    catalystProfilesData.forEach(p => {
      safeExtractArray(p, "formData.generalMatchingPreference.supportFocus").forEach(f => {
        if (typeof f !== 'string') return;
        const n = f.toLowerCase();
        if (n.match(/funding|financial|capital/)) types.funding_support++;
        else if (n.match(/market|access|sales|customer/)) types.market_access++;
        else if (n.match(/technology|tech|digital|software|technical/)) types.technology++;
        else if (n.match(/capacity|building|training|skills|development/)) types.capacity_building++;
        else if (n.match(/social|impact|community|esg|sustainability/)) types.social_impact++;
      });
    });
    return types;
  };

  const processTimeToAcceptance = () => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const applied = Object.fromEntries(months.map(m => [m, 0]));
    const accepted = Object.fromEntries(months.map(m => [m, 0]));
    catalystApplicationsData.forEach(a => {
      if (a.applicationDate) {
        try { applied[months[new Date(a.applicationDate).getMonth()]]++; } catch {}
      }
      if ((a.status || '').toLowerCase().includes("approved") && a.updatedAt) {
        try {
          const parts = a.updatedAt.split(' at ')[0].split(' ');
          if (parts.length >= 3) {
            const d = new Date(`${parts[0]} ${parts[1]} ${parts[2]}`);
            if (!isNaN(d)) accepted[months[d.getMonth()]]++;
          }
        } catch {}
      }
    });
    return { applied, accepted };
  };

  const processRejectedVsAcceptedApplicants = () => {
    let accepted = 0, rejected = 0;
    catalystApplicationsData.forEach(a => {
      const s = (a.status || '').toLowerCase();
      if (s.match(/approved|accept/)) accepted++;
      else if (s.match(/declined|reject/)) rejected++;
    });
    return { Accepted: accepted, Rejected: rejected };
  };

  const processAvgFundingSecuredByProgramType = () => {
    const fp = { mentorship: { t: 0, c: 0 }, grant_based: { t: 0, c: 0 }, training_education: { t: 0, c: 0 }, incubator: { t: 0, c: 0 }, accelerator: { t: 0, c: 0 }, hybrid: { t: 0, c: 0 } };
    const defaults = { incubator: 15, accelerator: 25, grant_based: 10, mentorship: 5, training_education: 8, hybrid: 12 };
    catalystProfilesData.forEach(p => {
      const amt = parseFloat(p.formData?.programmeDetails?.averageSupportAmount) || 0;
      if (!amt) return;
      safeExtractArray(p, "formData.generalMatchingPreference.programStructure").forEach(t => {
        if (typeof t !== 'string') return;
        const n = t.toLowerCase();
        const key = n.match(/mentor|coaching/) ? "mentorship" : n.match(/grant|funding/) ? "grant_based" : n.match(/training|education/) ? "training_education" : n.match(/incubat/) ? "incubator" : n.match(/accelerat/) ? "accelerator" : n.match(/hybrid|mixed/) ? "hybrid" : null;
        if (key) { fp[key].t += amt; fp[key].c++; }
      });
    });
    return Object.fromEntries(Object.entries(fp).map(([k, v]) => [k, v.c > 0 ? Math.round((v.t / v.c) / 1000000) : defaults[k]]));
  };

  const processCompletionRateByProgramType = () => {
    const stats = { mentorship: { a: 0, t: 0 }, grant_based: { a: 0, t: 0 }, training_education: { a: 0, t: 0 }, incubator: { a: 0, t: 0 }, accelerator: { a: 0, t: 0 }, hybrid: { a: 0, t: 0 } };
    const defaults = { incubator: 75, accelerator: 65, grant_based: 80, mentorship: 85, training_education: 70, hybrid: 60 };
    catalystApplicationsData.forEach(a => {
      if (!a.viewType) return;
      const n = a.viewType.toLowerCase();
      const key = n.match(/mentor|coaching/) ? "mentorship" : n.match(/grant|funding/) ? "grant_based" : n.match(/training|education/) ? "training_education" : n.match(/incubat/) ? "incubator" : n.match(/accelerat/) ? "accelerator" : n.match(/hybrid|mixed/) ? "hybrid" : null;
      if (!key) return;
      stats[key].t++;
      if ((a.status || '').toLowerCase().includes("approved")) stats[key].a++;
    });
    return Object.entries(stats).map(([type, d]) => ({ type, rate: d.t > 0 ? Math.round((d.a / d.t) * 100) : defaults[type] }));
  };

  const processAvgIntakeByIndustry = () => {
    const cats = emptyIndustries();
    catalystApplicationsData.forEach(a => {
      (a.sector || '').split(',').map(s => s.trim()).filter(Boolean).forEach(sec => { cats[categorizeSector(sec)]++; });
    });
    return cats;
  };

  const processTimeToAcceptanceDays = () => {
    const days = [];
    const mMap = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
    catalystApplicationsData.forEach(a => {
      if (!(a.status || '').toLowerCase().includes("approved") || !a.applicationDate || !a.updatedAt) return;
      try {
        const parts = a.updatedAt.split(' at ')[0].split(' ');
        if (parts.length >= 3 && mMap[parts[1]] !== undefined) {
          const accDate = new Date(parts[2], mMap[parts[1]], parts[0]);
          const d = Math.ceil(Math.abs(accDate - new Date(a.applicationDate)) / 86400000);
          if (!isNaN(d)) days.push(d);
        }
      } catch {}
    });
    return days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 15;
  };

  const insightsData = {
    matchRate: calculateAverageMatchRate(),
    averageFundingAmount: calculateAverageFunding(),
    activeFundersCount: countActivePrograms(),
    averageProcessingTime: processTimeToAcceptanceDays(),
    supportTypeBreakdown: processSupportTypeBreakdown(),
    activeProgramsByStage: processActiveProgramsByStage(),
    longestRunningPrograms: processLongestRunningPrograms(),
    programsBySector: processProgramsBySector(),
    smeIndustryMatchDistribution: processSmeIndustryMatchDistribution(),
    avgIntakeByIndustry: processAvgIntakeByIndustry(),
    bigScoreComparison: processBigScoreComparison(),
    avgFundingSecuredByProgramType: processAvgFundingSecuredByProgramType(),
    completionRateByProgramType: processCompletionRateByProgramType(),
    applicationVolumeOverTime: processApplicationVolumeOverTime(),
    timeToAcceptanceData: processTimeToAcceptance(),
    rejectedVsAcceptedApplicants: processRejectedVsAcceptedApplicants(),
  };

  const memoizedInsights = useDeepCompareMemo(insightsData);

  // ── Chart refs ────────────────────────────────────────────────────────────
  const chartRefs = {
    supportTypeBreakdown:        useRef(null),
    activeProgramsByStage:       useRef(null),
    programsBySector:            useRef(null),
    smeIndustryMatchDistribution:useRef(null),
    avgIntakeByIndustry:         useRef(null),
    bigScoreComparison:          useRef(null),
    avgFundingSecuredByProgramType: useRef(null),
    completionRateByProgramType: useRef(null),
    applicationVolumeOverTime:   useRef(null),
    timeToAcceptanceByMonth:     useRef(null),
    rejectedVsAcceptedApplicants:useRef(null),
  };

  useEffect(() => {
    if (loading) return;
    charts.current.forEach(c => c.destroy());
    charts.current = [];

    const bp = {
      primary: "#6d4c41", secondary: "#8d6e63", tertiary: "#a1887f",
      light: "#bcaaa4", lighter: "#d7ccc8", lightest: "#efebe9",
      accent1: "#5d4037", accent2: "#4e342e", accent3: "#3e2723",
    };
    const fmtLabel = (l) => l.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const createChart = (ref, config) => {
      if (!ref.current) return;
      const ctx = ref.current.getContext("2d");
      if (ctx) charts.current.push(new Chart(ctx, config));
    };
    const yScale = (title) => ({
      beginAtZero: true, max: 50,
      title: { display: true, text: title, color: bp.primary },
      ticks: { color: bp.primary, font: { size: 10 }, stepSize: 10 },
      grid: { color: bp.lighter },
    });
    const xBase = { ticks: { color: bp.primary, font: { size: 10 } }, grid: { color: bp.lighter } };

    if (activeTab === "program-types") {
      createChart(chartRefs.supportTypeBreakdown, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.supportTypeBreakdown).map(fmtLabel), datasets: [{ label: "Programs", data: Object.values(memoizedInsights.supportTypeBreakdown), backgroundColor: bp.primary, borderColor: bp.accent1, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Support Type Breakdown", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { ...xBase, title: { display: true, text: "Support Type", color: bp.primary }, ticks: { ...xBase.ticks, maxRotation: 45 } }, y: yScale("Number of Programs") } },
      });
      createChart(chartRefs.activeProgramsByStage, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.activeProgramsByStage), datasets: [{ label: "Programs", data: Object.values(memoizedInsights.activeProgramsByStage), backgroundColor: bp.secondary, borderColor: bp.primary, borderWidth: 1 }] },
        options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Active Programs by Preferred Stage", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: yScale("Number of Programs"), y: { ...xBase, title: { display: true, text: "Business Stage", color: bp.primary } } } },
      });
    }

    if (activeTab === "sector-focus") {
      createChart(chartRefs.programsBySector, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.programsBySector).map(fmtLabel), datasets: [{ label: "Programs", data: Object.values(memoizedInsights.programsBySector), backgroundColor: bp.accent1, borderColor: bp.primary, borderWidth: 1 }] },
        options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Support Focus Distribution", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: yScale("Number of Programs"), y: { ...xBase, title: { display: true, text: "Support Focus", color: bp.primary } } } },
      });
      createChart(chartRefs.smeIndustryMatchDistribution, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.smeIndustryMatchDistribution), datasets: [{ label: "Matched", data: Object.values(memoizedInsights.smeIndustryMatchDistribution).map(d => d.matched), backgroundColor: bp.primary }, { label: "Unmatched", data: Object.values(memoizedInsights.smeIndustryMatchDistribution).map(d => d.unmatched), backgroundColor: bp.lighter }] },
        options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "SME Industry Match Distribution", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { position: "top", labels: { color: bp.primary, font: { size: 10 } } } }, scales: { x: { stacked: true, beginAtZero: true, max: 100, title: { display: true, text: "Match Count", color: bp.primary }, ticks: { color: bp.primary, font: { size: 10 }, stepSize: 20 }, grid: { color: bp.lighter } }, y: { stacked: true, ...xBase, title: { display: true, text: "Industry", color: bp.primary } } } },
      });
      createChart(chartRefs.avgIntakeByIndustry, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.avgIntakeByIndustry), datasets: [{ label: "Avg. No. of SMEs", data: Object.values(memoizedInsights.avgIntakeByIndustry), backgroundColor: bp.tertiary, borderColor: bp.primary, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Avg. Intake by Industry Categories", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { ...xBase, title: { display: true, text: "Industry Categories", color: bp.primary }, ticks: { ...xBase.ticks, maxRotation: 45 } }, y: yScale("Avg. No. of SMEs") } },
      });
    }

    if (activeTab === "outcomes-effectiveness") {
      createChart(chartRefs.bigScoreComparison, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.bigScoreComparison), datasets: [{ label: "Average BIG Score", data: Object.values(memoizedInsights.bigScoreComparison), backgroundColor: [bp.lighter, bp.primary], borderColor: bp.accent1, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "BIG Score: With vs Without Catalyst", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { ...xBase, title: { display: true, text: "Catalyst Support", color: bp.primary } }, y: { beginAtZero: true, max: 100, title: { display: true, text: "Average BIG Score", color: bp.primary }, ticks: { color: bp.primary, font: { size: 10 }, stepSize: 20 }, grid: { color: bp.lighter } } } },
      });
      createChart(chartRefs.avgFundingSecuredByProgramType, {
        type: "bar",
        data: { labels: Object.keys(memoizedInsights.avgFundingSecuredByProgramType).map(fmtLabel), datasets: [{ label: "Avg Funding (ZAR)", data: Object.values(memoizedInsights.avgFundingSecuredByProgramType), backgroundColor: bp.light, borderColor: bp.primary, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Avg. Funding Secured By Program Type", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { ...xBase, title: { display: true, text: "Program", color: bp.primary }, ticks: { ...xBase.ticks, maxRotation: 45 } }, y: { beginAtZero: true, max: 50, title: { display: true, text: "Avg Funding (Millions ZAR)", color: bp.primary }, ticks: { color: bp.primary, font: { size: 10 }, callback: v => v + 'M', stepSize: 10 }, grid: { color: bp.lighter } } } },
      });
      createChart(chartRefs.completionRateByProgramType, {
        type: "bar",
        data: { labels: memoizedInsights.completionRateByProgramType.map(d => fmtLabel(d.type)), datasets: [{ label: "Approval Rate (%)", data: memoizedInsights.completionRateByProgramType.map(d => d.rate), backgroundColor: bp.primary, borderColor: bp.accent1, borderWidth: 1 }] },
        options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Approval Rate by Program Type", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { beginAtZero: true, max: 100, title: { display: true, text: "Approval Rate (%)", color: bp.primary }, ticks: { color: bp.primary, font: { size: 10 }, callback: v => v + '%', stepSize: 20 }, grid: { color: bp.lighter } }, y: { ...xBase, title: { display: true, text: "Program Type", color: bp.primary } } } },
      });
    }

    if (activeTab === "engagement-patterns") {
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      createChart(chartRefs.applicationVolumeOverTime, {
        type: "line",
        data: { labels: memoizedInsights.applicationVolumeOverTime.map(d => d.month), datasets: [{ label: "Applications", data: memoizedInsights.applicationVolumeOverTime.map(d => d.applications), borderColor: bp.primary, backgroundColor: bp.lighter, tension: 0.4, fill: true, pointBackgroundColor: bp.primary, pointRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Application Volume Over Time", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { display: false } }, scales: { x: { ...xBase, title: { display: true, text: "Month", color: bp.primary } }, y: yScale("Applications") } },
      });
      createChart(chartRefs.rejectedVsAcceptedApplicants, {
        type: "doughnut",
        data: { labels: Object.keys(memoizedInsights.rejectedVsAcceptedApplicants), datasets: [{ data: Object.values(memoizedInsights.rejectedVsAcceptedApplicants), backgroundColor: [bp.primary, bp.lighter], borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Rejected vs Accepted Applicants", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { position: "bottom", labels: { color: bp.primary, boxWidth: 8, padding: 8, font: { size: 9 } } } } },
      });
      createChart(chartRefs.timeToAcceptanceByMonth, {
        type: "line",
        data: { labels: months, datasets: [{ label: "Applications Submitted", data: months.map(m => memoizedInsights.timeToAcceptanceData.applied[m] || 0), borderColor: bp.primary, backgroundColor: 'transparent', tension: 0.4, pointBackgroundColor: bp.primary, pointRadius: 4 }, { label: "Applications Accepted", data: months.map(m => memoizedInsights.timeToAcceptanceData.accepted[m] || 0), borderColor: bp.secondary, backgroundColor: 'transparent', tension: 0.4, pointBackgroundColor: bp.secondary, pointRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Applications vs Acceptances by Month", color: bp.primary, font: { weight: "bold", size: 12 } }, legend: { position: "top", labels: { color: bp.primary, font: { size: 10 } } } }, scales: { x: { ...xBase, title: { display: true, text: "Month", color: bp.primary } }, y: yScale("Number of Applications") } },
      });
    }

    return () => { charts.current.forEach(c => c.destroy()); };
  }, [activeTab, memoizedInsights, loading]);

  // ── Tab config ─────────────────────────────────────────────────────────────
  const tabs = [
    { id: "program-types",          label: "Catalyst Types & Reach",   icon: Rocket },
    { id: "sector-focus",           label: "Sector Focus",             icon: Target },
    { id: "outcomes-effectiveness", label: "Outcomes & Effectiveness", icon: Award },
    { id: "engagement-patterns",    label: "Engagement Patterns",      icon: Activity },
  ];

  const statCards = [
    { icon: TrendingUp, value: `${memoizedInsights.matchRate}%`,                                label: "Match Rate" },
    { icon: DollarSign, value: `R${(memoizedInsights.averageFundingAmount / 1000).toFixed(0)}K`, label: "Avg. Funding" },
    { icon: Users,      value: `${memoizedInsights.activeFundersCount}`,                         label: "Active Catalysts" },
    { icon: Clock,      value: `${memoizedInsights.averageProcessingTime}d`,                     label: "Processing Time" },
  ];

  if (loading) return <InsightsSkeleton />;

  return (
    <div className="min-h-screen bg-backgroundBrown px-5 py-6 box-border">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-mediumBrown mt-0 mb-1">My BIG Insights</h1>
        <p className="text-lg text-lightBrown m-0 font-normal">
          Comprehensive analytics and insights across all your Catalyst programs
        </p>
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3 mb-6">
        {statCards.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center gap-3 bg-cream rounded-xl p-4 flex-1 min-w-[140px] shadow-sm border border-lightTan">
            <div className="w-10 h-10 rounded-lg bg-mediumBrown/10 flex items-center justify-center text-mediumBrown flex-shrink-0">
              <Icon size={18} />
            </div>
            <div>
              <div className="text-2xl font-bold text-darkBrown leading-tight">{value}</div>
              <div className="text-xs text-lightBrown mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer
              ${activeTab === id
                ? "bg-mediumBrown text-white border-mediumBrown shadow-md"
                : "bg-white text-textBrown border-lightTan hover:border-mediumBrown hover:text-mediumBrown"
              }`}
          >
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {activeTab === "program-types" && (<>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.supportTypeBreakdown} />
          </div>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.activeProgramsByStage} />
          </div>
          <div className="bg-white rounded-2xl border border-lightTan p-5 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-mediumBrown mb-4 m-0">Top 3 Longest Running Catalysts</h3>
            <div className="flex flex-col gap-0 flex-1">
              {memoizedInsights.longestRunningPrograms.map((prog, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-lightTan last:border-0">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${i === 0 ? "bg-accentGold" : i === 1 ? "bg-lightBrown" : "bg-lightTan text-textBrown"}`}>
                    #{i + 1}
                  </span>
                  <span className="flex-1 text-sm text-textBrown font-medium truncate">{prog.name}</span>
                  <span className="text-xs text-lightBrown whitespace-nowrap">{prog.daysSinceSubmission}d ago</span>
                </div>
              ))}
              {memoizedInsights.longestRunningPrograms.length === 0 && (
                <p className="text-sm text-lightBrown italic">No programs found</p>
              )}
            </div>
          </div>
        </>)}

        {activeTab === "sector-focus" && (<>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.programsBySector} />
          </div>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.smeIndustryMatchDistribution} />
          </div>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.avgIntakeByIndustry} />
          </div>
        </>)}

        {activeTab === "outcomes-effectiveness" && (<>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.bigScoreComparison} />
          </div>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.avgFundingSecuredByProgramType} />
          </div>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.completionRateByProgramType} />
          </div>
        </>)}

        {activeTab === "engagement-patterns" && (<>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.applicationVolumeOverTime} />
          </div>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.rejectedVsAcceptedApplicants} />
          </div>
          <div className="bg-white rounded-2xl border border-lightTan p-4 shadow-sm" style={{ height: 280 }}>
            <canvas ref={chartRefs.timeToAcceptanceByMonth} />
          </div>
        </>)}

      </div>
    </div>
  );
}