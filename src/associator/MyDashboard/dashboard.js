"use client";
import React, { useState } from 'react';
import { 
  Users, 
  Handshake, 
  TrendingUp, 
  Calendar, 
  MessageSquare, 
  Network, 
  Briefcase, 
  UserCheck, 
  UserPlus,
  Activity,
  ArrowUp,
  DollarSign,
  CheckCircle,
  Cpu,
  BarChart3,
  Zap,
  AlertCircle,
  Target
} from 'lucide-react';
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
  AreaChart,
  Area,
} from "recharts";

// ---------- MOCK DATA (No Backend) ----------

// 1. User Composition (SMEs, Catalysts, Advisors, Investors)
const userComposition = [
  { name: "SMEs", value: 1430, color: "#a67c52" },
  { name: "Investors", value: 330, color: "#7d5a50" },
  { name: "Catalysts", value: 80, color: "#e6d7c3" },
  { name: "Advisors", value: 20, color: "#8a7968" },
];

// 2. User Growth Trend (Monthly)
const userGrowth = [
  { month: "Jan", total: 180, mau: 120 },
  { month: "Feb", total: 220, mau: 160 },
  { month: "Mar", total: 280, mau: 210 },
  { month: "Apr", total: 340, mau: 260 },
  { month: "May", total: 390, mau: 310 },
  { month: "Jun", total: 450, mau: 370 },
];

// 3. Platform Activity
const platformActivity = [
  { month: "Jan", applications: 310, matches: 45, messages: 2800 },
  { month: "Feb", applications: 350, matches: 55, messages: 3200 },
  { month: "Mar", applications: 380, matches: 62, messages: 3800 },
  { month: "Apr", applications: 420, matches: 70, messages: 4200 },
  { month: "May", applications: 455, matches: 78, messages: 4500 },
  { month: "Jun", applications: 490, matches: 85, messages: 4800 },
];

// 4. Recent Activities (Mock)
const recentActivities = [
  { id: 1, type: 'connection', message: 'You connected with TechStars Africa', time: '2 hours ago' },
  { id: 2, type: 'message', message: 'New message from GrowthHub Partners', time: '5 hours ago' },
  { id: 3, type: 'match', message: 'New match: Innovation Fund', time: '1 day ago' },
  { id: 4, type: 'event', message: 'Webinar: Ecosystem Building', time: '2 days ago' },
];

// 5. Recommended Connections
const recommendedConnections = [
  { id: 1, name: 'Innovation Hub SA', role: 'Catalyst', roleType: 'Technology Incubator', avatar: '🏢' },
  { id: 2, name: 'Venture Capital Group', role: 'Investor', roleType: 'Investment Firm', avatar: '💼' },
  { id: 3, name: 'Entrepreneurship Academy', role: 'Advisor', roleType: 'Education Partner', avatar: '🎓' },
];

// ---------- Helper Functions ----------
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0 }).format(value);

// ---------- Active Users Modal ----------
function ActiveUsersModal({ onClose }) {
  const mockActiveUsers = [
    { id: 1, name: "John SME", email: "john@sme.com", role: "SME", lastActive: "2024-03-15" },
    { id: 2, name: "Sarah Investor", email: "sarah@investor.com", role: "Investor", lastActive: "2024-03-14" },
    { id: 3, name: "Mike Catalyst", email: "mike@catalyst.org", role: "Catalyst", lastActive: "2024-03-14" },
    { id: 4, name: "Emma Advisor", email: "emma@advisor.com", role: "Advisor", lastActive: "2024-03-13" },
  ];

  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    content: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '800px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      paddingBottom: '12px',
      borderBottom: '1px solid #f0e6d9',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#7d5a50',
    },
    stats: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '20px',
      padding: '12px',
      backgroundColor: '#faf7f2',
      borderRadius: '8px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      textAlign: 'left',
      padding: '12px',
      backgroundColor: '#f5ede4',
      color: '#4a352f',
      fontWeight: '600',
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #f0e6d9',
      color: '#4a352f',
    },
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h2 style={{ margin: 0, color: '#4a352f' }}>Active Users (Last 14 Days)</h2>
          <button style={modalStyles.closeButton} onClick={onClose}>×</button>
        </div>
        <div style={modalStyles.stats}>
          <span>Total: {mockActiveUsers.length} users</span>
          <span>Updated: {new Date().toLocaleDateString()}</span>
        </div>
        <table style={modalStyles.table}>
          <thead>
            <tr>
              <th style={modalStyles.th}>Name</th>
              <th style={modalStyles.th}>Email</th>
              <th style={modalStyles.th}>Role</th>
              <th style={modalStyles.th}>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {mockActiveUsers.map((user) => (
              <tr key={user.id}>
                <td style={modalStyles.td}>{user.name}</td>
                <td style={modalStyles.td}>{user.email}</td>
                <td style={modalStyles.td}>{user.role}</td>
                <td style={modalStyles.td}>{user.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Metric Card Component ----------
function MetricCard({ title, value, subtitle, icon, trend, size = "medium" }) {
  const isPositive = trend > 0;
  
  const cardStyles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: size === 'large' ? '24px' : '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      borderTop: `3px solid ${trend ? (isPositive ? '#2ecc71' : '#e74c3c') : '#a67c52'}`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px',
    },
    icon: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      backgroundColor: '#faf7f2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#a67c52',
    },
    title: {
      fontSize: '14px',
      color: '#7d5a50',
      fontWeight: '500',
      flex: 1,
    },
    trend: {
      fontSize: '12px',
      fontWeight: '600',
      padding: '2px 8px',
      borderRadius: '12px',
      backgroundColor: isPositive ? '#e8f5e8' : '#fdeaea',
      color: isPositive ? '#2e7d32' : '#c62828',
    },
    value: {
      fontSize: size === 'large' ? '32px' : '28px',
      fontWeight: '700',
      color: '#4a352f',
      marginBottom: '8px',
    },
    subtitle: {
      fontSize: '13px',
      color: '#7d5a50',
    },
  };

  return (
    <div style={cardStyles.container}>
      <div style={cardStyles.header}>
        <div style={cardStyles.icon}>{icon}</div>
        <span style={cardStyles.title}>{title}</span>
        {trend !== undefined && (
          <div style={cardStyles.trend}>
            {isPositive ? "↗" : "↘"} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={cardStyles.value}>{value}</div>
      {subtitle && <div style={cardStyles.subtitle}>{subtitle}</div>}
    </div>
  );
}

// ---------- Main Associator Dashboard Component ----------
export default function AssociatorDashboard() {
  const [showActiveUsersModal, setShowActiveUsersModal] = useState(false);

  // Derived metrics from mock data
  const totalUsers = userComposition.reduce((sum, type) => sum + type.value, 0);
  const currentMau = 370;
  const mauTrend = 12.5;
  const latestMatches = platformActivity[platformActivity.length - 1].matches;
  const avgUptime = 99.4;
  const networkGrowth = 23;

  const handleActiveUsersClick = () => {
    setShowActiveUsersModal(true);
  };

  const styles = {
    dashboard: {
      padding: '24px',
      background: '#f5f7fa',
      minHeight: '100vh',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#4a352f',
      margin: '0 0 8px 0',
    },
    subtitle: {
      color: '#7d5a50',
      margin: 0,
    },
    growthBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: '#e8f5e8',
      color: '#2e7d32',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '500',
    },
    primaryKPIs: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '24px',
    },
    secondaryKPIs: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '32px',
    },
    chartsGrid: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    },
    chartRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '24px',
    },
    chartCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    chartCardFull: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      gridColumn: '1 / -1',
    },
    chartHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      paddingBottom: '12px',
      borderBottom: '1px solid #f0e6d9',
    },
    chartTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#4a352f',
      margin: 0,
    },
    activitiesList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    activityItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: '#faf7f2',
      borderRadius: '8px',
      transition: 'background 0.2s',
    },
    activityIcon: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityDetails: {
      flex: 1,
    },
    activityMessage: {
      margin: '0 0 4px 0',
      fontSize: '14px',
      color: '#4a352f',
    },
    activityTime: {
      fontSize: '12px',
      color: '#7d5a50',
    },
    viewAllBtn: {
      background: 'none',
      border: 'none',
      color: '#a67c52',
      fontSize: '13px',
      cursor: 'pointer',
      marginTop: '16px',
      padding: '8px',
      width: '100%',
      textAlign: 'center',
      transition: 'all 0.2s',
    },
    recommendationsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    recommendationCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: '#faf7f2',
      borderRadius: '8px',
      transition: 'all 0.2s',
    },
    recAvatar: {
      width: '48px',
      height: '48px',
      background: 'linear-gradient(135deg, #a67c52, #7d5a50)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
    },
    recInfo: {
      flex: 1,
    },
    recName: {
      margin: '0 0 4px 0',
      fontSize: '15px',
      fontWeight: '600',
      color: '#4a352f',
    },
    recRole: {
      margin: '0 0 8px 0',
      fontSize: '12px',
      color: '#7d5a50',
    },
    connectBtn: {
      background: '#a67c52',
      color: 'white',
      border: 'none',
      padding: '6px 16px',
      borderRadius: '6px',
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    summaryStats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '20px',
    },
    summaryItem: {
      textAlign: 'center',
      padding: '16px',
      background: '#faf7f2',
      borderRadius: '8px',
    },
    summaryLabel: {
      display: 'block',
      fontSize: '13px',
      color: '#7d5a50',
      marginBottom: '8px',
    },
    summaryValue: {
      display: 'block',
      fontSize: '20px',
      fontWeight: '600',
      color: '#4a352f',
    },
    positive: {
      color: '#2e7d32',
    },
  };

  // Activity icon colors
  const getActivityIconStyle = (type) => {
    const baseStyle = { ...styles.activityIcon };
    switch(type) {
      case 'connection':
        return { ...baseStyle, background: '#e3f2fd', color: '#1976d2' };
      case 'message':
        return { ...baseStyle, background: '#f3e5f5', color: '#7b1fa2' };
      case 'match':
        return { ...baseStyle, background: '#e8f5e8', color: '#2e7d32' };
      case 'event':
        return { ...baseStyle, background: '#fff3e0', color: '#ed6c02' };
      default:
        return { ...baseStyle, background: '#faf7f2', color: '#a67c52' };
    }
  };

  return (
    <div style={styles.dashboard}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Associator Dashboard</h1>
          <p style={styles.subtitle}>Your ecosystem hub. Network, collaborate, and build meaningful partnerships.</p>
        </div>
        <div style={styles.growthBadge}>
          <ArrowUp size={14} />
          Network +{networkGrowth}%
        </div>
      </div>

      {/* Primary KPIs */}
      <div style={styles.primaryKPIs}>
        <MetricCard
          title="Total SMEs"
          value={userComposition.find(u => u.name === "SMEs").value.toLocaleString()}
          subtitle="Active businesses"
          icon={<Briefcase size={18} />}
          trend={8.5}
          size="large"
        />

        <div onClick={handleActiveUsersClick} style={{ cursor: 'pointer' }}>
          <MetricCard
            title="Active Users"
            value={currentMau.toLocaleString()}
            subtitle={`${Math.round((currentMau / totalUsers) * 100)}% of total`}
            icon={<Users size={18} />}
            trend={mauTrend}
            size="large"
          />
        </div>

        <MetricCard
          title="Successful Matches"
          value={latestMatches}
          subtitle="SME ↔ Investor connections"
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

      {/* Secondary KPIs - Focus on all 4 user types */}
      <div style={styles.secondaryKPIs}>
        <MetricCard
          title="Total Investors"
          value={userComposition.find(u => u.name === "Investors").value.toLocaleString()}
          subtitle="Funding partners"
          icon={<TrendingUp size={16} />}
          trend={5.2}
        />
        <MetricCard
          title="Total Catalysts"
          value={userComposition.find(u => u.name === "Catalysts").value.toLocaleString()}
          subtitle="Ecosystem enablers"
          icon={<Network size={16} />}
          trend={12.0}
        />
        <MetricCard
          title="Total Advisors"
          value={userComposition.find(u => u.name === "Advisors").value.toLocaleString()}
          subtitle="Mentors & experts"
          icon={<UserCheck size={16} />}
          trend={3.8}
        />
        <MetricCard
          title="Monthly Applications"
          value={platformActivity[platformActivity.length - 1].applications.toLocaleString()}
          subtitle="New submissions"
          icon={<UserPlus size={16} />}
          trend={18.2}
        />
      </div>

      <div style={styles.chartsGrid}>
        {/* Chart 1: User Growth (Left) + User Composition (Right) */}
        <div style={styles.chartRow}>
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>User Growth Trend</h3>
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

          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>User Composition</h3>
              <BarChart3 size={16} />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={userComposition}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {userComposition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Platform Activity (Full Width) */}
        <div style={styles.chartRow}>
          <div style={styles.chartCardFull}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>Platform Activity</h3>
              <Activity size={16} />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={platformActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="applications" fill="#a67c52" name="Applications" radius={[2, 2, 0, 0]} />
                <Bar dataKey="matches" fill="#7d5a50" name="Matches" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Recent Activities & Recommended Connections */}
        <div style={styles.chartRow}>
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>Recent Activities</h3>
              <Activity size={16} />
            </div>
            <div style={styles.activitiesList}>
              {recentActivities.map((activity) => (
                <div key={activity.id} style={styles.activityItem}>
                  <div style={getActivityIconStyle(activity.type)}>
                    {activity.type === 'connection' && <Network size={14} />}
                    {activity.type === 'message' && <MessageSquare size={14} />}
                    {activity.type === 'match' && <Handshake size={14} />}
                    {activity.type === 'event' && <Calendar size={14} />}
                  </div>
                  <div style={styles.activityDetails}>
                    <p style={styles.activityMessage}>{activity.message}</p>
                    <span style={styles.activityTime}>{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <button style={styles.viewAllBtn}>View All Activities →</button>
          </div>

          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>Recommended Connections</h3>
              <Users size={16} />
            </div>
            <div style={styles.recommendationsList}>
              {recommendedConnections.map((connection) => (
                <div key={connection.id} style={styles.recommendationCard}>
                  <div style={styles.recAvatar}>{connection.avatar}</div>
                  <div style={styles.recInfo}>
                    <h4 style={styles.recName}>{connection.name}</h4>
                    <p style={styles.recRole}>{connection.roleType || connection.role}</p>
                    <button style={styles.connectBtn}>Connect</button>
                  </div>
                </div>
              ))}
            </div>
            <button style={styles.viewAllBtn}>Discover More →</button>
          </div>
        </div>

        {/* Chart 4: Ecosystem Snapshot */}
        <div style={styles.chartRow}>
          <div style={styles.chartCardFull}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>Ecosystem Snapshot</h3>
              <TrendingUp size={16} />
            </div>
            <div style={styles.summaryStats}>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Total Active Users</span>
                <span style={styles.summaryValue}>{totalUsers.toLocaleString()}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>This Month Matches</span>
                <span style={styles.summaryValue}>{latestMatches}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Applications</span>
                <span style={styles.summaryValue}>{platformActivity[platformActivity.length - 1].applications}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Success Rate</span>
                <span style={{ ...styles.summaryValue, ...styles.positive }}>+{mauTrend}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Users Modal */}
      {showActiveUsersModal && <ActiveUsersModal onClose={() => setShowActiveUsersModal(false)} />}
    </div>
  );
}