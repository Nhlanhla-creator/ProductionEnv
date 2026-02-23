// AdminDashboard.jsx - Fixed Chart Layouts
"use client";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  AreaChart,
  Area,
} from "recharts";
import {
  DollarSign,
  Users,
  TrendingUp,
  Activity,
  CheckCircle,
  Cpu,
  BarChart3,
  Zap,
  AlertCircle,
  Target,
} from "lucide-react";
import styles from "./admin-dashboard.module.css";
import { collection, query, where, getDocs, getCountFromServer, orderBy } from "firebase/firestore";
import { db } from "../../firebaseConfig";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

//2. User Composition

// 2. Platform Activity
const platformActivity = [
  { month: "Jan", applications: 310, matches: 45, messages: 2800 },
  { month: "Feb", applications: 350, matches: 55, messages: 3200 },
  { month: "Mar", applications: 380, matches: 62, messages: 3800 },
  { month: "Apr", applications: 420, matches: 70, messages: 4200 },
  { month: "May", applications: 455, matches: 78, messages: 4500 },
  { month: "Jun", applications: 490, matches: 85, messages: 4800 },
];

// 3. Financial Performance
const revenueOpex = [
  { month: "Jan", revenue: 320000, opex: 220000 },
  { month: "Feb", revenue: 350000, opex: 240000 },
  { month: "Mar", revenue: 380000, opex: 250000 },
  { month: "Apr", revenue: 400000, opex: 260000 },
  { month: "May", revenue: 420000, opex: 280000 },
  { month: "Jun", revenue: 450000, opex: 290000 },
];

const costBreakdown = [
  { category: "Infra", value: 22, amount: 61600 },
  { category: "Tools", value: 18, amount: 50400 },
  { category: "Team", value: 40, amount: 112000 },
  { category: "Marketing", value: 20, amount: 56000 },
];

// 4. System Health
const systemHealth = [
  { day: "Mon", uptime: 99.8, latency: 820 },
  { day: "Tue", uptime: 99.9, latency: 790 },
  { day: "Wed", uptime: 99.7, latency: 850 },
  { day: "Thu", uptime: 99.9, latency: 810 },
  { day: "Fri", uptime: 99.6, latency: 880 },
  { day: "Sat", uptime: 99.8, latency: 830 },
  { day: "Sun", uptime: 99.9, latency: 800 },
];

// 5. AI Usage
const aiUsage = [
  { week: "W1", calls: 3200, cost: 1600 },
  { week: "W2", calls: 4200, cost: 2100 },
  { week: "W3", calls: 5200, cost: 2600 },
  { week: "W4", calls: 4800, cost: 2400 },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
  }).format(value);

function MetricCard({ title, value, subtitle, icon, trend, size = "medium" }) {
  const isPositive = trend > 0;
  return (
    <div
      className={`${styles.metricCard} ${size === "large" ? styles.metricCardLarge : ""}`}
    >
      <div className={styles.metricHeader}>
        <div className={styles.metricIcon}>{icon}</div>
        <span className={styles.metricTitle}>{title}</span>
        {trend !== undefined && (
          <div
            className={`${styles.trendIndicator} ${isPositive ? styles.trendUp : styles.trendDown}`}
          >
            {isPositive ? "↗" : "↘"} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className={styles.metricValue}>{value}</div>
      {subtitle && <div className={styles.metricSubtitle}>{subtitle}</div>}
    </div>
  );
}

function SimpleGauge({ value, label, size = "medium" }) {
  return (
    <div className={styles.simpleGauge}>
      <div className={styles.gaugeValue}>{value}%</div>
      <div className={styles.gaugeLabel}>{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userTypes, setUserTypes] = useState([]);
  const [userGrowth, setUserGrowth] = useState(() => {
    const initialData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      initialData.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        total: 0, // This is NEW users in that month
        mau: 0,
      });
    }
    return initialData;
  });
  const [growthLoading, setGrowthLoading] = useState(true);
  const [showActiveUsersModal, setShowActiveUsersModal] = useState(false);
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [loadingActiveUsers, setLoadingActiveUsers] = useState(false);

  useEffect(() => {
    const fetchUserCounts = async () => {
      try {
        const [smes, funders, catalysts, interns, advisors] = await Promise.all(
          [
            getCount("universalProfiles"),
            getCount("MyuniversalProfiles"),
            getCount("catalystProfiles"),
            getCount("internProfiles"),
            getCount("advisorProfiles"),
          ],
        );

        // Your color scheme
        const colors = ["#a67c52", "#7d5a50", "#c8b6a6", "#e6d7c3", "#8a7968"];

        setUserTypes([
          { name: "SMEs", value: smes, color: colors[0] },
          { name: "Funders", value: funders, color: colors[1] },
          { name: "Interns", value: interns, color: colors[2] },
          { name: "Catalysts", value: catalysts, color: colors[3] },
          { name: "Advisors", value: advisors, color: colors[4] },
        ]);
      } catch (error) {
        console.error("Error fetching user counts:", error);
        // Fallback to dummy data
        setUserTypes([
          { name: "SMEs", value: 1430, color: "#a67c52" },
          { name: "Investors", value: 330, color: "#7d5a50" },
          { name: "Interns", value: 360, color: "#c8b6a6" },
          { name: "Catalysts", value: 80, color: "#e6d7c3" },
          { name: "Advisors", value: 20, color: "#8a7968" },
        ]);
      }
    };

    const getCount = async (collectionName) => {
      try {
        const coll = collection(db, collectionName);
        const snapshot = await getCountFromServer(coll);
        return snapshot.data().count;
      } catch {
        return 0;
      }
    };

    fetchUserCounts();
  }, []);

  const [mauTrend, setMauTrend] = useState(0);
  const [currentMau, setCurrentMau] = useState(0); // ADD THIS STATE

  useEffect(() => {
    const calculateMauTrend = async () => {
      // Use cached trend if less than 1 hour old
      const cachedTrend = localStorage.getItem("mauTrend");
      const cachedTime = localStorage.getItem("mauTrendTime");

      if (
        cachedTrend &&
        cachedTime &&
        Date.now() - parseInt(cachedTime) < 60 * 60 * 1000
      ) {
        setMauTrend(parseFloat(cachedTrend));
        return;
      }

      try {
        // Get total users
        const totalSnapshot = await getCountFromServer(collection(db, "users"));
        const totalUsers = totalSnapshot.data().count;

        // Get active users in last 14 days
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const activeQuery = query(
          collection(db, "users"),
          where("lastActiveAt", ">=", fourteenDaysAgo),
        );

        const activeSnapshot = await getCountFromServer(activeQuery);
        const currentMau = activeSnapshot.data().count;

        // ✅ STORE current MAU for the card
        setCurrentMau(currentMau);

        // Get active users from 15-28 days ago (previous period)
        const twentyEightDaysAgo = new Date();
        twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

        const previousQuery = query(
          collection(db, "users"),
          where("lastActiveAt", ">=", twentyEightDaysAgo),
          where("lastActiveAt", "<", fourteenDaysAgo),
        );

        const previousSnapshot = await getCountFromServer(previousQuery);
        const previousMau = previousSnapshot.data().count;

        // Calculate trend
        let trend = 0;
        if (previousMau > 0) {
          trend = ((currentMau - previousMau) / previousMau) * 100;
        } else if (currentMau > 0) {
          trend = 100;
        }

        const roundedTrend = parseFloat(trend.toFixed(1));
        setMauTrend(roundedTrend);

        // Cache it
        localStorage.setItem("mauTrend", roundedTrend.toString());
        localStorage.setItem("mauTrendTime", Date.now().toString());
      } catch (error) {
        console.log("Error calculating metrics:", error);
      }
    };

    calculateMauTrend();
  }, []);

  useEffect(() => {
    const fetchUserGrowth = async () => {
      setGrowthLoading(true);
      const growthData = [];

      // Get last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);

        const monthName = date.toLocaleDateString("en-US", { month: "short" });
        const year = date.getFullYear();
        const month = date.getMonth();

        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 1);

        let total = 0;
        let mau = 0;

        try {
          // Get NEW users in this month
          const usersQuery = query(
            collection(db, "users"),
            where("createdAt", ">=", startOfMonth),
            where("createdAt", "<", endOfMonth),
          );

          const registrationsSnapshot = await getCountFromServer(usersQuery);
          total = registrationsSnapshot.data().count;

          // ✅ FIX: Different logic for current month vs past months
          if (i === 0) {
            // Current month
            // Use TODAY's 14-day window (same as card)
            const today = new Date();
            const fourteenDaysAgo = new Date(today);
            fourteenDaysAgo.setDate(today.getDate() - 14);

            const activeQuery = query(
              collection(db, "users"),
              where("lastActiveAt", ">=", fourteenDaysAgo),
            );

            const activeSnapshot = await getCountFromServer(activeQuery);
            mau = activeSnapshot.data().count;

            console.log(
              `✅ Current month (${monthName}) using today's logic:`,
              {
                period: `${fourteenDaysAgo.toLocaleDateString()} to ${today.toLocaleDateString()}`,
                mau,
              },
            );
          } else {
            // Past months: use month-end 14-day window
            const monthEnd = new Date(year, month + 1, 0);
            const fourteenDaysBeforeMonthEnd = new Date(monthEnd);
            fourteenDaysBeforeMonthEnd.setDate(monthEnd.getDate() - 14);

            const activeQuery = query(
              collection(db, "users"),
              where("lastActiveAt", ">=", fourteenDaysBeforeMonthEnd),
              where("lastActiveAt", "<=", monthEnd),
            );

            const activeSnapshot = await getCountFromServer(activeQuery);
            mau = activeSnapshot.data().count;
          }
        } catch (error) {
          console.error(`Error for ${monthName}:`, error);
          mau = Math.round(total * 0.7);
        }

        growthData.push({
          month: monthName,
          total: total,
          mau: mau,
        });
      }

      setUserGrowth(growthData);
      setGrowthLoading(false);
    };

    fetchUserGrowth();
  }, []);

  const [totalUsersCount, setTotalUsersCount] = useState(0);

  useEffect(() => {
    const getCurrentMetrics = async () => {
      try {
        // Get total users (for percentage)
        const totalSnapshot = await getCountFromServer(collection(db, "users"));
        setTotalUsersCount(totalSnapshot.data().count);

        // Get current active users
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const activeQuery = query(
          collection(db, "users"),
          where("lastActiveAt", ">=", fourteenDaysAgo),
        );

        const activeSnapshot = await getCountFromServer(activeQuery);
        setCurrentMau(activeSnapshot.data().count);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    getCurrentMetrics();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const handleActiveUsersClick = async () => {
    setShowActiveUsersModal(true);
    setLoadingActiveUsers(true);

    try {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const activeQuery = query(
        collection(db, "users"),
        where("lastActiveAt", ">=", fourteenDaysAgo),
        orderBy("lastActiveAt", "desc"),
      );

      const querySnapshot = await getDocs(activeQuery);

      const users = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.firstName || "Unknown",
          email: data.email || "No email",
          lastActive: data.lastActiveAt?.toDate(),
          currentPlan: data?.currentPlan?.name || "N/A",
        };
      });

      setActiveUsersList(users);
    } catch (error) {
      console.error("Error fetching active users:", error);
    } finally {
      setLoadingActiveUsers(false);
    }
  };

  const fetchActiveUsers = async () => {
    console.log("🔍 Fetching active users...");
    setLoadingActiveUsers(true);

    try {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      console.log("Fetching users active since:", fourteenDaysAgo);

      const q = query(
        collection(db, "users"),
        where("lastActiveAt", ">=", fourteenDaysAgo),
        orderBy("lastActiveAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      console.log("Found users:", querySnapshot.size);

      const users = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        lastActive: doc.data().lastActiveAt?.toDate(),
      }));

      setActiveUsersList(users);
    } catch (error) {
      console.error("❌ Error:", error);
    } finally {
      setLoadingActiveUsers(false);
    }
  };

  // Derived metrics
  const latestRevenue = revenueOpex[revenueOpex.length - 1].revenue;
  const latestOpex = revenueOpex[revenueOpex.length - 1].opex;
  const totalUsers = userGrowth.reduce((sum, month) => sum + month.total, 0); // Total of all users
  const mau = currentMau;
  const grossMargin = Math.round(
    ((latestRevenue - latestOpex) / latestRevenue) * 100,
  );
  const latestMatches = platformActivity[platformActivity.length - 1].matches;
  const avgUptime = 99.4;
  const burnRate = 83000;
  const runway = 9.5;
  const cac = 48;
  const verifiedSMEs = 72;
  const aiCostPerCall = 0.23;
  const errorRate = 0.8;

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.dashboardTitle}>Admin Dashboard</h1>
          <p className={styles.dashboardSubtitle}>
            Key business metrics at a glance
          </p>
        </div>
        <button className={styles.dateButton}>Last 30 Days</button>
      </div>

      {/* Primary KPIs */}
      <div className={styles.primaryKPIs}>
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(latestRevenue)}
          subtitle={`${grossMargin}% gross margin`}
          icon={<DollarSign size={18} />}
          trend={8.2}
          size="large"
        />

        <div
          onClick={() => handleActiveUsersClick()}
          style={{ cursor: "pointer" }}
        >
          <MetricCard
            title="Active Users"
            value={currentMau.toLocaleString()}
            subtitle={`${totalUsersCount > 0 ? Math.round((currentMau / totalUsersCount) * 100) : 0}% of total`}
            icon={<Users size={18} />}
            trend={mauTrend}
            size="large"
          />
        </div>

        <MetricCard
          title="Successful Matches"
          value={latestMatches}
          subtitle="SME ↔ Funder connections"
          icon={<CheckCircle size={18} />}
          trend={15.8}
        />

        <MetricCard
          title="Platform Uptime"
          value={`${avgUptime}%`}
          subtitle="30-day reliability"
          icon={<Activity size={18} />}
        />
      </div>

      {/* Secondary KPIs */}
      <div className={styles.secondaryKPIs}>
        <MetricCard
          title="Customer Acquisition Cost"
          value={formatCurrency(cac)}
          subtitle="Cost per new user"
          icon={<Target size={16} />}
          trend={-5.3}
        />

        <MetricCard
          title="Monthly Burn Rate"
          value={formatCurrency(burnRate)}
          subtitle={`${runway} months runway`}
          icon={<TrendingUp size={16} />}
        />

        <MetricCard
          title="AI Cost Efficiency"
          value={formatCurrency(aiCostPerCall)}
          subtitle="Cost per API call"
          icon={<Zap size={16} />}
          trend={-12.1}
        />

        <MetricCard
          title="System Health"
          value={`${errorRate}%`}
          subtitle="Error rate"
          icon={<AlertCircle size={16} />}
          trend={-25.0}
        />
      </div>

      <div className={styles.chartsGrid}>
        {/* Chart 1: User Growth (Left) + User Composition (Right) */}
        <div className={styles.chartRow}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>User Growth Trend</h3>
              <Users size={16} />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#a67c52"
                  fill="#a67c52"
                  fillOpacity={0.2}
                  name="Total Users"
                />
                <Area
                  type="monotone"
                  dataKey="mau"
                  stroke="#7d5a50"
                  fill="#7d5a50"
                  fillOpacity={0.2}
                  name="Active Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>User Composition</h3>
              <BarChart3 size={16} />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={userTypes}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {userTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} users`, "Count"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Financial Performance (Left) + Cost Breakdown (Right) */}
        <div className={styles.chartRow}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>Revenue vs Operating Costs</h3>
              <DollarSign size={16} />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenueOpex}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#a67c52"
                  strokeWidth={3}
                  name="Revenue"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="opex"
                  stroke="#7d5a50"
                  strokeWidth={2}
                  name="Operating Costs"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>Operating Cost Breakdown</h3>
              <TrendingUp size={16} />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={costBreakdown} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  horizontal={false}
                />
                <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="category" width={80} />
                <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                <Bar dataKey="value" fill="#a67c52" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Platform Activity (Left) + System Health (Right) */}
        <div className={styles.chartRow}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>Platform Activity</h3>
              <Activity size={16} />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={platformActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar
                  yAxisId="left"
                  dataKey="applications"
                  fill="#a67c52"
                  name="Applications"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="matches"
                  fill="#7d5a50"
                  name="Matches"
                  radius={[2, 2, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="messages"
                  stroke="#c8b6a6"
                  name="Messages"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>System Performance</h3>
              <Cpu size={16} />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={systemHealth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" />
                <YAxis
                  yAxisId="left"
                  domain={[99, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[700, 900]}
                />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="uptime"
                  stroke="#2ecc71"
                  strokeWidth={3}
                  name="Uptime %"
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="latency"
                  stroke="#a67c52"
                  strokeWidth={2}
                  name="Latency (ms)"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: AI Usage & Efficiency - Full Width */}
        <div className={styles.chartRow}>
          <div className={styles.chartCardFull}>
            <div className={styles.chartHeader}>
              <h3>AI Usage & Cost Efficiency</h3>
              <Zap size={16} />
            </div>
            <div className={styles.aiMetrics}>
              <div className={styles.aiChart}>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={aiUsage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "cost"
                          ? [formatCurrency(value), "Cost"]
                          : [value, name]
                      }
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="calls"
                      fill="#a67c52"
                      name="API Calls"
                      radius={[2, 2, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cost"
                      stroke="#7d5a50"
                      strokeWidth={2}
                      name="Cost (ZAR)"
                      dot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.aiGauges}>
                <div className={styles.gaugeGroup}>
                  <SimpleGauge value={97.8} label="AI Success Rate" />
                  <SimpleGauge value={72} label="Verified SMEs" />
                  <SimpleGauge value={98} label="Data Integrity" />
                  <SimpleGauge value={63} label="Cache Hit Rate" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {showActiveUsersModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowActiveUsersModal(false)}
          >
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>Active Users (Last 14 Days)</h2>
                <button onClick={() => setShowActiveUsersModal(false)}>
                  ×
                </button>
              </div>

              {loadingActiveUsers ? (
                <div className={styles.loadingSpinner}>Loading users...</div>
              ) : (
                <>
                  <div className={styles.modalStats}>
                    <span>Total: {activeUsersList.length} users</span>
                    <span>Updated: {new Date().toLocaleDateString()}</span>
                  </div>

                  <div className={styles.userTable}>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Company</th>
                          <th>CurrentPlan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeUsersList.map((user) => (
                          <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.currentPlan}</td>
                            <td>
                              {user.lastActive?.toLocaleDateString() ||
                                "Unknown"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
