"use client";
import React, { useState } from 'react';
import { TrendingUp, Users, Activity, BarChart3, Download, Calendar } from 'lucide-react';

const AssociatorInsights = () => {
  const [timeRange, setTimeRange] = useState('30d');

  const metrics = [
    { label: 'Network Growth', value: '+156', change: '+23%', icon: <Users size={20} /> },
    { label: 'Engagement Rate', value: '78%', change: '+12%', icon: <Activity size={20} /> },
    { label: 'Connection Requests', value: '42', change: '+8', icon: <TrendingUp size={20} /> },
    { label: 'Partnerships Formed', value: '12', change: '+5', icon: <BarChart3 size={20} /> },
  ];

  const recentInsights = [
    { id: 1, title: 'Q4 Ecosystem Growth Report', date: '2024-12-10', views: 234, type: 'report' },
    { id: 2, title: 'Top Industries for Collaboration', date: '2024-12-05', views: 189, type: 'analysis' },
    { id: 3, title: 'Network Impact Metrics', date: '2024-11-28', views: 156, type: 'dashboard' },
    { id: 4, title: 'Member Satisfaction Survey', date: '2024-11-20', views: 312, type: 'survey' },
  ];

  return (
    <div className="associator-insights">
      <div className="insights-header">
        <div>
          <h1>BIG Insights</h1>
          <p>Analytics and intelligence for your ecosystem activities</p>
        </div>
        <div className="insights-controls">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="export-btn">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-icon">{metric.icon}</div>
            <div className="metric-info">
              <h3>{metric.value}</h3>
              <p>{metric.label}</p>
              <span className={`metric-change ${metric.change.startsWith('+') ? 'positive' : 'negative'}`}>
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="insights-grid">
        <div className="chart-container">
          <div className="chart-header">
            <h2>Network Growth Over Time</h2>
            <Calendar size={16} />
          </div>
          <div className="chart-placeholder">
            <div className="placeholder-bars">
              <div className="bar" style={{ height: '60px' }}></div>
              <div className="bar" style={{ height: '80px' }}></div>
              <div className="bar" style={{ height: '45px' }}></div>
              <div className="bar" style={{ height: '95px' }}></div>
              <div className="bar" style={{ height: '70px' }}></div>
              <div className="bar" style={{ height: '110px' }}></div>
              <div className="bar" style={{ height: '85px' }}></div>
            </div>
            <p className="chart-note">Interactive chart coming soon</p>
          </div>
        </div>

        <div className="reports-container">
          <h2>Recent Insights & Reports</h2>
          <div className="reports-list">
            {recentInsights.map((insight) => (
              <div key={insight.id} className="report-item">
                <div className="report-info">
                  <h4>{insight.title}</h4>
                  <div className="report-meta">
                    <span>{insight.date}</span>
                    <span>{insight.views} views</span>
                  </div>
                </div>
                <button className="view-report">View →</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="recommendations">
        <h2>AI-Powered Recommendations</h2>
        <div className="recommendations-list">
          <div className="recommendation-card">
            <p>Based on your activity, you might want to connect with:</p>
            <div className="rec-tags">
              <span>Tech Startups</span>
              <span>Impact Investors</span>
              <span>Mentorship Programs</span>
            </div>
          </div>
          <div className="recommendation-card">
            <p>Upcoming events you might be interested in:</p>
            <div className="rec-tags">
              <span>Ecosystem Summit 2025</span>
              <span>Networking Mixer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssociatorInsights;