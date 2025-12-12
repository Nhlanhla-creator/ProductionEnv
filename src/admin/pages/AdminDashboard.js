// AdminDashboard.jsx - Fixed Chart Layouts
"use client"
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  AreaChart,
  Area,
} from "recharts"
import {
  DollarSign,
  Users,
  TrendingUp,
  Activity,
  CheckCircle,
  Cpu,
  BarChart3,
  Shield,
  Zap,
  Clock,
  AlertCircle,
  Target,
  MessageSquare,
} from "lucide-react"
import styles from "./admin-dashboard.module.css"


const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]

// 1. User Growth & Composition
const userGrowth = [
  { month: "Jan", total: 1200, mau: 580 },
  { month: "Feb", total: 1350, mau: 640 },
  { month: "Mar", total: 1520, mau: 720 },
  { month: "Apr", total: 1780, mau: 860 },
  { month: "May", total: 1980, mau: 980 },
  { month: "Jun", total: 2200, mau: 1130 },
]

const userTypes = [
  { name: "SMEs", value: 1430, color: "#a67c52" },
  { name: "Funders", value: 330, color: "#7d5a50" },
  { name: "Service Providers", value: 360, color: "#c8b6a6" },
  { name: "Catalysts", value: 80, color: "#e6d7c3" },
]

// 2. Platform Activity
const platformActivity = [
  { month: "Jan", applications: 310, matches: 45, messages: 2800 },
  { month: "Feb", applications: 350, matches: 55, messages: 3200 },
  { month: "Mar", applications: 380, matches: 62, messages: 3800 },
  { month: "Apr", applications: 420, matches: 70, messages: 4200 },
  { month: "May", applications: 455, matches: 78, messages: 4500 },
  { month: "Jun", applications: 490, matches: 85, messages: 4800 },
]

// 3. Financial Performance
const revenueOpex = [
  { month: "Jan", revenue: 320000, opex: 220000 },
  { month: "Feb", revenue: 350000, opex: 240000 },
  { month: "Mar", revenue: 380000, opex: 250000 },
  { month: "Apr", revenue: 400000, opex: 260000 },
  { month: "May", revenue: 420000, opex: 280000 },
  { month: "Jun", revenue: 450000, opex: 290000 },
]

const costBreakdown = [
  { category: "Infra", value: 22, amount: 61600 },
  { category: "Tools", value: 18, amount: 50400 },
  { category: "Team", value: 40, amount: 112000 },
  { category: "Marketing", value: 20, amount: 56000 },
]

// 4. System Health
const systemHealth = [
  { day: "Mon", uptime: 99.8, latency: 820 },
  { day: "Tue", uptime: 99.9, latency: 790 },
  { day: "Wed", uptime: 99.7, latency: 850 },
  { day: "Thu", uptime: 99.9, latency: 810 },
  { day: "Fri", uptime: 99.6, latency: 880 },
  { day: "Sat", uptime: 99.8, latency: 830 },
  { day: "Sun", uptime: 99.9, latency: 800 },
]

// 5. AI Usage
const aiUsage = [
  { week: "W1", calls: 3200, cost: 1600 },
  { week: "W2", calls: 4200, cost: 2100 },
  { week: "W3", calls: 5200, cost: 2600 },
  { week: "W4", calls: 4800, cost: 2400 },
]


const formatCurrency = (value) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0 }).format(value)

function MetricCard({ title, value, subtitle, icon, trend, size = "medium" }) {
  const isPositive = trend > 0
  return (
    <div className={`${styles.metricCard} ${size === "large" ? styles.metricCardLarge : ""}`}>
      <div className={styles.metricHeader}>
        <div className={styles.metricIcon}>{icon}</div>
        <span className={styles.metricTitle}>{title}</span>
        {trend !== undefined && (
          <div className={`${styles.trendIndicator} ${isPositive ? styles.trendUp : styles.trendDown}`}>
            {isPositive ? "↗" : "↘"} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className={styles.metricValue}>{value}</div>
      {subtitle && <div className={styles.metricSubtitle}>{subtitle}</div>}
    </div>
  )
}

function SimpleGauge({ value, label, size = "medium" }) {
  return (
    <div className={styles.simpleGauge}>
      <div className={styles.gaugeValue}>{value}%</div>
      <div className={styles.gaugeLabel}>{label}</div>
    </div>
  )
}


export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  // Derived metrics
  const latestRevenue = revenueOpex[revenueOpex.length - 1].revenue
  const latestOpex = revenueOpex[revenueOpex.length - 1].opex
  const totalUsers = userGrowth[userGrowth.length - 1].total
  const mau = userGrowth[userGrowth.length - 1].mau
  const grossMargin = Math.round(((latestRevenue - latestOpex) / latestRevenue) * 100)
  const latestMatches = platformActivity[platformActivity.length - 1].matches
  const avgUptime = 99.4
  const burnRate = 83000
  const runway = 9.5
  const cac = 48
  const verifiedSMEs = 72
  const aiCostPerCall = 0.23
  const errorRate = 0.8

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.dashboardTitle}>Admin Dashboard</h1>
          <p className={styles.dashboardSubtitle}>Key business metrics at a glance</p>
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

        <MetricCard
          title="Active Users"
          value={mau.toLocaleString()}
          subtitle={`${Math.round((mau / totalUsers) * 100)}% of total`}
          icon={<Users size={18} />}
          trend={12.5}
          size="large"
        />

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
                <Area type="monotone" dataKey="total" stroke="#a67c52" fill="#a67c52" fillOpacity={0.2} name="Total Users" />
                <Area type="monotone" dataKey="mau" stroke="#7d5a50" fill="#7d5a50" fillOpacity={0.2} name="Active Users" />
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {userTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
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
                <Line type="monotone" dataKey="revenue" stroke="#a67c52" strokeWidth={3} name="Revenue" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="opex" stroke="#7d5a50" strokeWidth={2} name="Operating Costs" dot={{ r: 4 }} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="category" width={80} />
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
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
                <Bar yAxisId="left" dataKey="applications" fill="#a67c52" name="Applications" radius={[2, 2, 0, 0]} />
                <Bar yAxisId="left" dataKey="matches" fill="#7d5a50" name="Matches" radius={[2, 2, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="messages" stroke="#c8b6a6" name="Messages" strokeWidth={2} />
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
                <YAxis yAxisId="left" domain={[99, 100]} tickFormatter={(value) => `${value}%`} />
                <YAxis yAxisId="right" orientation="right" domain={[700, 900]} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="uptime" stroke="#2ecc71" strokeWidth={3} name="Uptime %" dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#a67c52" strokeWidth={2} name="Latency (ms)" dot={{ r: 3 }} />
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
                    <Tooltip formatter={(value, name) => 
                      name === 'cost' ? [formatCurrency(value), 'Cost'] : [value, name]
                    } />
                    <Bar yAxisId="left" dataKey="calls" fill="#a67c52" name="API Calls" radius={[2, 2, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#7d5a50" strokeWidth={2} name="Cost (ZAR)" dot={{ r: 4 }} />
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
      </div>
    </div>
  )
}