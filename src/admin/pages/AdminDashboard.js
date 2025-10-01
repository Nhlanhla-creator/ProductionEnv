"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Users,
  TrendingUp,
  Zap,
  Target,
  FileText,
  DollarSign,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  LineChart,
  CheckCircle,
  ShoppingCart,
  CreditCard,
  XCircle,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
} from "recharts"
import styles from "./admin-dashboard.module.css"

function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  // Mock data - replace with real API calls
  const [dashboardData, setDashboardData] = useState({
    userStats: {
      totalUsers: 1247,
      smes: 856,
      investors: 234,
      catalysts: 89,
      advisors: 68,
      growth: 12.5,
    },
    applicationStats: {
      totalApplications: 342,
      pending: 45,
      approved: 267,
      rejected: 30,
      growth: 8.3,
    },
    documentStats: {
      totalDocuments: 2156,
      pendingReview: 23,
      approved: 2089,
      rejected: 44,
      growth: 15.7,
    },
    revenueStats: {
      totalRevenue: 2156430, // In ZAR
      monthlyGrowth: 9.2,
      subscriptions: 1089,
      growth: 6.8,
    },
  })

  // Chart data for new users per month by type
  const [newUsersData] = useState([
    { month: 'Jan', smes: 45, investors: 12, catalysts: 6, advisors: 4 },
    { month: 'Feb', smes: 52, investors: 15, catalysts: 8, advisors: 5 },
    { month: 'Mar', smes: 48, investors: 18, catalysts: 7, advisors: 6 },
    { month: 'Apr', smes: 61, investors: 14, catalysts: 9, advisors: 7 },
    { month: 'May', smes: 58, investors: 20, catalysts: 11, advisors: 8 },
    { month: 'Jun', smes: 67, investors: 22, catalysts: 12, advisors: 9 },
  ])

  const [userTypeData] = useState([
    { name: 'SMEs', value: 856, color: '#a67c52' },
    { name: 'Investors', value: 234, color: '#7d5a50' },
    { name: 'Catalysts', value: 89, color: '#c8b6a6' },
    { name: 'Advisors', value: 68, color: '#e6d7c3' },
  ])

  // Approvals data
  const [approvalsData] = useState([
    { month: 'Jan', funding: 15, support: 8, advisory: 12 },
    { month: 'Feb', funding: 18, support: 11, advisory: 14 },
    { month: 'Mar', funding: 22, support: 9, advisory: 16 },
    { month: 'Apr', funding: 19, support: 13, advisory: 18 },
    { month: 'May', funding: 25, support: 15, advisory: 20 },
    { month: 'Jun', funding: 28, support: 17, advisory: 22 },
  ])

  // Growth tools purchased data
  const [growthToolsData] = useState([
    { month: 'Jan', compliance: 12, legitimacy: 8, fundability: 6, pis: 4 },
    { month: 'Feb', compliance: 15, legitimacy: 11, fundability: 8, pis: 6 },
    { month: 'Mar', compliance: 18, legitimacy: 14, fundability: 10, pis: 7 },
    { month: 'Apr', compliance: 16, legitimacy: 12, fundability: 9, pis: 8 },
    { month: 'May', compliance: 22, legitimacy: 16, fundability: 12, pis: 9 },
    { month: 'Jun', compliance: 25, legitimacy: 19, fundability: 14, pis: 11 },
  ])

  // Active subscriptions data
  const [subscriptionsData] = useState([
    { month: 'Jan', basic: 245, premium: 89, enterprise: 23 },
    { month: 'Feb', basic: 267, premium: 95, enterprise: 26 },
    { month: 'Mar', basic: 289, premium: 102, enterprise: 28 },
    { month: 'Apr', basic: 312, premium: 108, enterprise: 31 },
    { month: 'May', basic: 334, premium: 115, enterprise: 34 },
    { month: 'Jun', basic: 356, premium: 122, enterprise: 37 },
  ])

  // Rejections data
  const [rejectionsData] = useState([
    { month: 'Jan', applications: 8, documents: 5, funding: 3, support: 2 },
    { month: 'Feb', applications: 6, documents: 7, funding: 4, support: 1 },
    { month: 'Mar', applications: 9, documents: 4, funding: 2, support: 3 },
    { month: 'Apr', applications: 7, documents: 6, funding: 5, support: 2 },
    { month: 'May', applications: 5, documents: 8, funding: 3, support: 4 },
    { month: 'Jun', applications: 4, documents: 6, funding: 2, support: 3 },
  ])

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, color, onClick, isCurrency = false }) => (
    <div className={`${styles.statCard} ${color ? styles[color] : ""}`} onClick={onClick}>
      <div className={styles.statCardHeader}>
        <div className={styles.statCardIcon}>
          <Icon size={20} />
        </div>
        <div className={styles.statCardTrend}>
          {trend > 0 ? (
            <ArrowUpRight size={14} className={styles.trendUp} />
          ) : (
            <ArrowDownRight size={14} className={styles.trendDown} />
          )}
          <span className={trend > 0 ? styles.trendUp : styles.trendDown}>{Math.abs(trend)}%</span>
        </div>
      </div>
      <div className={styles.statCardBody}>
        <h3 className={styles.statCardValue}>
          {isCurrency ? formatCurrency(value) : value.toLocaleString()}
        </h3>
        <p className={styles.statCardTitle}>{title}</p>
        {subtitle && <p className={styles.statCardSubtitle}>{subtitle}</p>}
      </div>
    </div>
  )

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
      <div className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.dashboardTitle}>Admin Dashboard</h1>
          <p className={styles.dashboardSubtitle}>Monitor and manage your platform</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionButton} onClick={() => navigate("/admin/reports")}>
            <FileText size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Overview - Compact */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total Users"
          value={dashboardData.userStats.totalUsers}
          subtitle={`${dashboardData.userStats.smes} SMEs`}
          icon={Users}
          trend={dashboardData.userStats.growth}
          color="primary"
          onClick={() => navigate("/admin/smes")}
        />
        <StatCard
          title="Applications"
          value={dashboardData.applicationStats.totalApplications}
          subtitle={`${dashboardData.applicationStats.pending} pending`}
          icon={FileText}
          trend={dashboardData.applicationStats.growth}
          color="secondary"
          onClick={() => navigate("/admin/applications")}
        />
        <StatCard
          title="Documents"
          value={dashboardData.documentStats.totalDocuments}
          subtitle={`${dashboardData.documentStats.pendingReview} pending`}
          icon={FileText}
          trend={dashboardData.documentStats.growth}
          color="tertiary"
          onClick={() => navigate("/admin/documents")}
        />
        <StatCard
          title="Revenue"
          value={dashboardData.revenueStats.totalRevenue}
          subtitle={`${dashboardData.revenueStats.subscriptions} subs`}
          icon={DollarSign}
          trend={dashboardData.revenueStats.monthlyGrowth}
          color="success"
          onClick={() => navigate("/admin/revenue")}
          isCurrency="true"
        />
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <button className={styles.quickActionCard} onClick={() => navigate("/admin/smes")}>
            <Building2 size={24} />
            <span>Manage SMEs</span>
            <span className={styles.actionCount}>{dashboardData.userStats.smes}</span>
          </button>
          <button className={styles.quickActionCard} onClick={() => navigate("/admin/investors")}>
            <TrendingUp size={24} />
            <span>Manage Investors</span>
            <span className={styles.actionCount}>{dashboardData.userStats.investors}</span>
          </button>
          <button className={styles.quickActionCard} onClick={() => navigate("/admin/catalysts")}>
            <Zap size={24} />
            <span>Manage Catalysts</span>
            <span className={styles.actionCount}>{dashboardData.userStats.catalysts}</span>
          </button>
          <button className={styles.quickActionCard} onClick={() => navigate("/admin/advisors")}>
            <Target size={24} />
            <span>Manage Advisors</span>
            <span className={styles.actionCount}>{dashboardData.userStats.advisors}</span>
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsSection}>
        {/* New Users Per Month by Type */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>New Users Registration by Type</h3>
            <BarChart3 size={20} className={styles.chartIcon} />
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={newUsersData}>
                <XAxis dataKey="month" stroke="#7d5a50" />
                <YAxis stroke="#7d5a50" label={{ value: 'New Users', angle: -90, position: 'insideLeft' }} />
                <CartesianGrid strokeDasharray="3 3" stroke="#e6d7c3" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#faf7f2', 
                    border: '1px solid #c8b6a6',
                    borderRadius: '8px',
                    color: '#4a352f'
                  }} 
                />
                <Bar dataKey="smes" stackId="a" fill="#a67c52" name="SMEs" />
                <Bar dataKey="investors" stackId="a" fill="#7d5a50" name="Investors" />
                <Bar dataKey="catalysts" stackId="a" fill="#c8b6a6" name="Catalysts" />
                <Bar dataKey="advisors" stackId="a" fill="#e6d7c3" name="Advisors" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Type Distribution */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>User Type Distribution</h3>
            <PieChart size={20} className={styles.chartIcon} />
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={userTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#faf7f2', 
                    border: '1px solid #c8b6a6',
                    borderRadius: '8px',
                    color: '#4a352f'
                  }} 
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className={styles.chartLegend}>
              {userTypeData.map((item, index) => (
                <div key={index} className={styles.legendItem}>
                  <div 
                    className={styles.legendColor} 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Service Approvals */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Service Approvals by Month</h3>
            <CheckCircle size={20} className={styles.chartIcon} />
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={approvalsData}>
                <defs>
                  <linearGradient id="colorFunding" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a67c52" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a67c52" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorSupport" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7d5a50" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#7d5a50" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorAdvisory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c8b6a6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#c8b6a6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#7d5a50" />
                <YAxis stroke="#7d5a50" label={{ value: 'Approvals', angle: -90, position: 'insideLeft' }} />
                <CartesianGrid strokeDasharray="3 3" stroke="#e6d7c3" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#faf7f2', 
                    border: '1px solid #c8b6a6',
                    borderRadius: '8px',
                    color: '#4a352f'
                  }} 
                />
                <Area
                  type="monotone"
                  dataKey="funding"
                  stackId="1"
                  stroke="#a67c52"
                  fill="url(#colorFunding)"
                  name="Funding Approved"
                />
                <Area
                  type="monotone"
                  dataKey="support"
                  stackId="1"
                  stroke="#7d5a50"
                  fill="url(#colorSupport)"
                  name="Support Program Approved"
                />
                <Area
                  type="monotone"
                  dataKey="advisory"
                  stackId="1"
                  stroke="#c8b6a6"
                  fill="url(#colorAdvisory)"
                  name="Advisory Services Approved"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Tools Purchased */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Growth Tools Purchased</h3>
            <ShoppingCart size={20} className={styles.chartIcon} />
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={growthToolsData}>
                <XAxis dataKey="month" stroke="#7d5a50" />
                <YAxis stroke="#7d5a50" label={{ value: 'Tools Sold', angle: -90, position: 'insideLeft' }} />
                <CartesianGrid strokeDasharray="3 3" stroke="#e6d7c3" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#faf7f2', 
                    border: '1px solid #c8b6a6',
                    borderRadius: '8px',
                    color: '#4a352f'
                  }} 
                />
                <Bar dataKey="compliance" fill="#a67c52" name="Compliance Tools" />
                <Bar dataKey="legitimacy" fill="#7d5a50" name="Legitimacy Tools" />
                <Bar dataKey="fundability" fill="#c8b6a6" name="Fundability Tools" />
                <Bar dataKey="pis" fill="#e6d7c3" name="PIS Tools" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Active Subscriptions</h3>
            <CreditCard size={20} className={styles.chartIcon} />
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={subscriptionsData}>
                <XAxis dataKey="month" stroke="#7d5a50" />
                <YAxis stroke="#7d5a50" label={{ value: 'Active Subscriptions', angle: -90, position: 'insideLeft' }} />
                <CartesianGrid strokeDasharray="3 3" stroke="#e6d7c3" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#faf7f2', 
                    border: '1px solid #c8b6a6',
                    borderRadius: '8px',
                    color: '#4a352f'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="basic" 
                  stroke="#a67c52" 
                  strokeWidth={3}
                  dot={{ fill: '#a67c52', strokeWidth: 2, r: 4 }}
                  name="Basic Plan"
                />
                <Line 
                  type="monotone" 
                  dataKey="premium" 
                  stroke="#7d5a50" 
                  strokeWidth={3}
                  dot={{ fill: '#7d5a50', strokeWidth: 2, r: 4 }}
                  name="Premium Plan"
                />
                <Line 
                  type="monotone" 
                  dataKey="enterprise" 
                  stroke="#c8b6a6" 
                  strokeWidth={3}
                  dot={{ fill: '#c8b6a6', strokeWidth: 2, r: 4 }}
                  name="Enterprise Plan"
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rejections Overview */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Rejections by Category</h3>
            <XCircle size={20} className={styles.chartIcon} />
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rejectionsData}>
                <XAxis dataKey="month" stroke="#7d5a50" />
                <YAxis stroke="#7d5a50" label={{ value: 'Rejections', angle: -90, position: 'insideLeft' }} />
                <CartesianGrid strokeDasharray="3 3" stroke="#e6d7c3" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#faf7f2', 
                    border: '1px solid #c8b6a6',
                    borderRadius: '8px',
                    color: '#4a352f'
                  }} 
                />
                <Bar dataKey="applications" stackId="a" fill="#e74c3c" name="Application Rejections" />
                <Bar dataKey="documents" stackId="a" fill="#c0392b" name="Document Rejections" />
                <Bar dataKey="funding" stackId="a" fill="#a93226" name="Funding Rejections" />
                <Bar dataKey="support" stackId="a" fill="#922b21" name="Support Rejections" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard