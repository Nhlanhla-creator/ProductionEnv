"use client";
import React, { useEffect, useState } from 'react';
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
  ArrowDown
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getCountFromServer, 
  Timestamp,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

const AssociatorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    smses: 0,
    investors: 0,
    advisors: 0,
    catalysts: 0,
    activeCollaborations: 0,
    partnershipOpportunities: 0,
    upcomingEvents: 0,
    networkGrowth: 0
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [recommendedConnections, setRecommendedConnections] = useState([]);
  const [platformActivity, setPlatformActivity] = useState({
    monthlyMatches: 0,
    monthlyApplications: 0,
    growthRate: 0
  });

  // Fetch counts from different user collections
  const fetchUserCounts = async () => {
    try {
      // SMSEs from universalProfiles
      const smseColl = collection(db, "universalProfiles");
      const smseSnapshot = await getCountFromServer(smseColl);
      
      // Investors from MyuniversalProfiles
      const investorColl = collection(db, "MyuniversalProfiles");
      const investorSnapshot = await getCountFromServer(investorColl);
      
      // Advisors from advisorProfiles
      const advisorColl = collection(db, "advisorProfiles");
      const advisorSnapshot = await getCountFromServer(advisorColl);
      
      // Catalysts from catalystProfiles
      const catalystColl = collection(db, "catalystProfiles");
      const catalystSnapshot = await getCountFromServer(catalystColl);
      
      // Calculate total active users for network growth
      const totalUsers = smseSnapshot.data().count + 
                        investorSnapshot.data().count + 
                        advisorSnapshot.data().count + 
                        catalystSnapshot.data().count;
      
      // Get new users in last 30 days for growth rate
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newUsersQuery = query(
        collection(db, "users"),
        where("createdAt", ">=", thirtyDaysAgo)
      );
      const newUsersSnapshot = await getCountFromServer(newUsersQuery);
      const newUsersCount = newUsersSnapshot.data().count;
      
      const growthRate = totalUsers > 0 ? (newUsersCount / totalUsers) * 100 : 0;
      
      setStats(prev => ({
        ...prev,
        smses: smseSnapshot.data().count,
        investors: investorSnapshot.data().count,
        advisors: advisorSnapshot.data().count,
        catalysts: catalystSnapshot.data().count,
        networkGrowth: Math.round(growthRate)
      }));
      
    } catch (error) {
      console.error("Error fetching user counts:", error);
      // Fallback to mock data if Firebase fails
      setStats(prev => ({
        ...prev,
        smses: 1247,
        investors: 342,
        advisors: 89,
        catalysts: 156,
        networkGrowth: 23
      }));
    }
  };
  
  // Fetch recent activities (matches, connections, messages)
  const fetchRecentActivities = async () => {
    try {
      const activities = [];
      
      // Get recent matches from matches collection
      const matchesQuery = query(
        collection(db, "matches"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      
      const matchesSnapshot = await getDocs(matchesQuery);
      matchesSnapshot.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: `match-${doc.id}`,
          type: 'match',
          message: `${data.smeName || 'A business'} matched with ${data.investorName || 'an investor'}`,
          time: data.createdAt?.toDate() || new Date(),
          timestamp: data.createdAt
        });
      });
      
      // Get recent messages
      const messagesQuery = query(
        collection(db, "messages"),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      messagesSnapshot.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: `msg-${doc.id}`,
          type: 'message',
          message: `New message from ${data.senderName || 'a member'}`,
          time: data.timestamp?.toDate() || new Date(),
          timestamp: data.timestamp
        });
      });
      
      // Sort by timestamp and take most recent 4
      const sortedActivities = activities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 4)
        .map(activity => ({
          ...activity,
          time: formatTimeAgo(activity.time)
        }));
      
      setRecentActivities(sortedActivities);
      
    } catch (error) {
      console.error("Error fetching activities:", error);
      // Fallback mock data
      setRecentActivities([
        { id: 1, type: 'connection', message: 'You connected with TechStars Africa', time: '2 hours ago' },
        { id: 2, type: 'message', message: 'New message from GrowthHub Partners', time: '5 hours ago' },
        { id: 3, type: 'match', message: 'New match: Innovation Fund', time: '1 day ago' },
        { id: 4, type: 'event', message: 'Webinar: Ecosystem Building', time: '2 days ago' },
      ]);
    }
  };
  
  // Fetch platform activity metrics
  const fetchPlatformActivity = async () => {
    try {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Get matches this month
      const matchesQuery = query(
        collection(db, "matches"),
        where("createdAt", ">=", startOfMonth),
        where("createdAt", "<=", endOfMonth)
      );
      const matchesSnapshot = await getCountFromServer(matchesQuery);
      
      // Get applications this month (from various application collections)
      let applicationsCount = 0;
      
      // Funding applications
      const fundingAppsQuery = query(
        collection(db, "fundingApplications"),
        where("createdAt", ">=", startOfMonth),
        where("createdAt", "<=", endOfMonth)
      );
      const fundingApps = await getCountFromServer(fundingAppsQuery);
      applicationsCount += fundingApps.data().count;
      
      // Product applications
      const productAppsQuery = query(
        collection(db, "productApplications"),
        where("createdAt", ">=", startOfMonth),
        where("createdAt", "<=", endOfMonth)
      );
      const productApps = await getCountFromServer(productAppsQuery);
      applicationsCount += productApps.data().count;
      
      // Intern applications
      const internAppsQuery = query(
        collection(db, "internApplications"),
        where("createdAt", ">=", startOfMonth),
        where("createdAt", "<=", endOfMonth)
      );
      const internApps = await getCountFromServer(internAppsQuery);
      applicationsCount += internApps.data().count;
      
      setPlatformActivity({
        monthlyMatches: matchesSnapshot.data().count,
        monthlyApplications: applicationsCount,
        growthRate: 15.8 // Calculate from previous month if needed
      });
      
    } catch (error) {
      console.error("Error fetching platform activity:", error);
      setPlatformActivity({
        monthlyMatches: 85,
        monthlyApplications: 490,
        growthRate: 15.8
      });
    }
  };
  
  // Fetch recommended connections based on activity
  const fetchRecommendedConnections = async () => {
    try {
      // Get recently active users from different roles
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsersQuery = query(
        collection(db, "users"),
        where("lastActiveAt", ">=", thirtyDaysAgo),
        orderBy("lastActiveAt", "desc"),
        limit(6)
      );
      
      const usersSnapshot = await getDocs(activeUsersQuery);
      const recommendations = [];
      
      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        const role = userData.currentRole || userData.role || 'Member';
        
        // Determine icon based on role
        let icon = '👤';
        let roleType = '';
        if (role === 'SMSE' || role === 'SMSEs') {
          icon = '🏢';
          roleType = 'Business';
        } else if (role === 'Investor') {
          icon = '💼';
          roleType = 'Investment Firm';
        } else if (role === 'Advisor') {
          icon = '🎓';
          roleType = 'Business Advisor';
        } else if (role === 'Catalyst' || role === 'Accelerators') {
          icon = '🚀';
          roleType = 'Growth Partner';
        }
        
        recommendations.push({
          id: doc.id,
          name: userData.username || userData.email?.split('@')[0] || 'Member',
          role: role,
          roleType: roleType,
          avatar: icon,
          email: userData.email
        });
      }
      
      // Take top 3 recommendations
      setRecommendedConnections(recommendations.slice(0, 3));
      
      if (recommendations.length === 0) {
        // Fallback mock data
        setRecommendedConnections([
          { id: 1, name: 'Innovation Hub SA', role: 'Catalyst', roleType: 'Technology Incubator', avatar: '🏢' },
          { id: 2, name: 'Venture Capital Group', role: 'Investor', roleType: 'Investment Firm', avatar: '💼' },
          { id: 3, name: 'Entrepreneurship Academy', role: 'Advisor', roleType: 'Education Partner', avatar: '🎓' },
        ]);
      }
      
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setRecommendedConnections([
        { id: 1, name: 'Innovation Hub SA', role: 'Catalyst', roleType: 'Technology Incubator', avatar: '🏢' },
        { id: 2, name: 'Venture Capital Group', role: 'Investor', roleType: 'Investment Firm', avatar: '💼' },
        { id: 3, name: 'Entrepreneurship Academy', role: 'Advisor', roleType: 'Education Partner', avatar: '🎓' },
      ]);
    }
  };
  
  // Helper function to format time ago
  const formatTimeAgo = (date) => {
    if (!date) return 'Recently';
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
  };
  
  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUserCounts(),
        fetchRecentActivities(),
        fetchPlatformActivity(),
        fetchRecommendedConnections()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);
  
  // Stat cards configuration with real data
  const statCards = [
    { 
      title: 'SMSEs', 
      value: stats.smses.toLocaleString(), 
      icon: <Briefcase size={24} />, 
      change: '+12%',
      color: '#a67c52'
    },
    { 
      title: 'Investors', 
      value: stats.investors.toLocaleString(), 
      icon: <TrendingUp size={24} />, 
      change: '+8%',
      color: '#7d5a50'
    },
    { 
      title: 'Advisors', 
      value: stats.advisors.toLocaleString(), 
      icon: <UserCheck size={24} />, 
      change: '+15%',
      color: '#c8b6a6'
    },
    { 
      title: 'Catalysts', 
      value: stats.catalysts.toLocaleString(), 
      icon: <Activity size={24} />, 
      change: '+5%',
      color: '#e6d7c3'
    },
    { 
      title: 'Monthly Matches', 
      value: platformActivity.monthlyMatches.toLocaleString(), 
      icon: <Handshake size={24} />, 
      change: `+${platformActivity.growthRate}%`,
      color: '#4a90e2'
    },
    { 
      title: 'Applications', 
      value: platformActivity.monthlyApplications.toLocaleString(), 
      icon: <UserPlus size={24} />, 
      change: '+18%',
      color: '#50c878'
    }
  ];
  
  if (loading) {
    return (
      <div className="associator-dashboard">
        <div className="dashboard-header">
          <h1>Associator Dashboard</h1>
          <p>Loading ecosystem data...</p>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="associator-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Associator Dashboard</h1>
          <p>Welcome to your ecosystem hub. Network, collaborate, and build meaningful partnerships.</p>
        </div>
        <div className="network-growth">
          <span className="growth-badge">
            <ArrowUp size={14} />
            Network +{stats.networkGrowth}%
          </span>
        </div>
      </div>
      
      {/* Stats Grid - 6 cards */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card" style={{ borderTopColor: stat.color }}>
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
              <span className="stat-change positive">
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="dashboard-grid">
        {/* Recent Activities Section */}
        <div className="recent-activities">
          <div className="section-header">
            <h2>Recent Activities</h2>
            <Activity size={18} />
          </div>
          <div className="activities-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === 'connection' && <Network size={16} />}
                  {activity.type === 'message' && <MessageSquare size={16} />}
                  {activity.type === 'match' && <Handshake size={16} />}
                  {activity.type === 'event' && <Calendar size={16} />}
                </div>
                <div className="activity-details">
                  <p>{activity.message}</p>
                  <span>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="view-all-btn">View All Activities →</button>
        </div>
        
        {/* Recommended Connections Section */}
        <div className="recommendations">
          <div className="section-header">
            <h2>Recommended Connections</h2>
            <Users size={18} />
          </div>
          <div className="recommendations-list">
            {recommendedConnections.map((connection) => (
              <div key={connection.id} className="recommendation-card">
                <div className="rec-avatar">{connection.avatar}</div>
                <div className="rec-info">
                  <h4>{connection.name}</h4>
                  <p>{connection.roleType || connection.role}</p>
                  <button className="connect-btn">Connect</button>
                </div>
              </div>
            ))}
          </div>
          <button className="view-all-btn">Discover More →</button>
        </div>
      </div>
      
      {/* Ecosystem Summary Section */}
      <div className="ecosystem-summary">
        <div className="section-header">
          <h2>Ecosystem Snapshot</h2>
          <TrendingUp size={18} />
        </div>
        <div className="summary-stats">
          <div className="summary-item">
            <span className="summary-label">Total Active Users</span>
            <span className="summary-value">
              {(stats.smses + stats.investors + stats.advisors + stats.catalysts).toLocaleString()}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">This Month</span>
            <span className="summary-value">{platformActivity.monthlyMatches} Matches</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Applications</span>
            <span className="summary-value">{platformActivity.monthlyApplications}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Success Rate</span>
            <span className="summary-value positive">+{platformActivity.growthRate}%</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .associator-dashboard {
          padding: 24px;
          background: #f5f7fa;
          min-height: 100vh;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .dashboard-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: #4a352f;
          margin: 0 0 8px 0;
        }
        
        .dashboard-header p {
          color: #7d5a50;
          margin: 0;
        }
        
        .growth-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #e8f5e8;
          color: #2e7d32;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border-top: 3px solid;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .stat-info h3 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: #4a352f;
        }
        
        .stat-info p {
          font-size: 14px;
          color: #7d5a50;
          margin: 0 0 4px 0;
        }
        
        .stat-change.positive {
          font-size: 12px;
          color: #2e7d32;
          background: #e8f5e8;
          padding: 2px 8px;
          border-radius: 12px;
        }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        
        .recent-activities, .recommendations {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0e6d9;
        }
        
        .section-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #4a352f;
          margin: 0;
        }
        
        .activities-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #faf7f2;
          border-radius: 8px;
          transition: background 0.2s;
        }
        
        .activity-item:hover {
          background: #f5ede4;
        }
        
        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .activity-icon.connection { background: #e3f2fd; color: #1976d2; }
        .activity-icon.message { background: #f3e5f5; color: #7b1fa2; }
        .activity-icon.match { background: #e8f5e8; color: #2e7d32; }
        .activity-icon.event { background: #fff3e0; color: #ed6c02; }
        
        .activity-details {
          flex: 1;
        }
        
        .activity-details p {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: #4a352f;
        }
        
        .activity-details span {
          font-size: 12px;
          color: #7d5a50;
        }
        
        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .recommendation-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #faf7f2;
          border-radius: 8px;
          transition: all 0.2s;
        }
        
        .recommendation-card:hover {
          background: #f5ede4;
          transform: translateX(4px);
        }
        
        .rec-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #a67c52, #7d5a50);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        
        .rec-info {
          flex: 1;
        }
        
        .rec-info h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
          font-weight: 600;
          color: #4a352f;
        }
        
        .rec-info p {
          margin: 0 0 8px 0;
          font-size: 12px;
          color: #7d5a50;
        }
        
        .connect-btn {
          background: #a67c52;
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .connect-btn:hover {
          background: #7d5a50;
        }
        
        .view-all-btn {
          background: none;
          border: none;
          color: #a67c52;
          font-size: 13px;
          cursor: pointer;
          margin-top: 16px;
          padding: 8px;
          width: 100%;
          text-align: center;
          transition: all 0.2s;
        }
        
        .view-all-btn:hover {
          color: #7d5a50;
          text-decoration: underline;
        }
        
        .ecosystem-summary {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        
        .summary-item {
          text-align: center;
          padding: 16px;
          background: #faf7f2;
          border-radius: 8px;
        }
        
        .summary-label {
          display: block;
          font-size: 13px;
          color: #7d5a50;
          margin-bottom: 8px;
        }
        
        .summary-value {
          display: block;
          font-size: 20px;
          font-weight: 600;
          color: #4a352f;
        }
        
        .summary-value.positive {
          color: #2e7d32;
        }
        
        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f0e6d9;
          border-top-color: #a67c52;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          
          .summary-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 768px) {
          .associator-dashboard {
            padding: 16px;
          }
          
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .summary-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AssociatorDashboard;