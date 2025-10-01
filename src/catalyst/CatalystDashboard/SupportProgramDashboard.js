"use client"
import { Link } from "react-router-dom"
import { Users, Award, BarChart, Calendar, Clock, CheckCircle, TrendingUp } from "lucide-react"
import styles from "./SupportProgramDashboard.module.css" // You'll need to create this CSS file

function SupportProgramDashboard() {
  // Sample data for the dashboard
  const stats = [
    { label: "Active Programs", value: 5, icon: <Award size={24} /> },
    { label: "Total Beneficiaries", value: 127, icon: <Users size={24} /> },
    { label: "Applications", value: 43, icon: <CheckCircle size={24} /> },
    { label: "Success Rate", value: "76%", icon: <TrendingUp size={24} /> },
  ]

  const upcomingEvents = [
    { id: 1, title: "Pitch Day", date: "May 15, 2025", time: "10:00 AM" },
    { id: 2, title: "Mentor Session", date: "May 18, 2025", time: "2:00 PM" },
    { id: 3, title: "Workshop: Funding Readiness", date: "May 20, 2025", time: "9:00 AM" },
  ]

  const activePrograms = [
    { id: 1, name: "Startup Accelerator", beneficiaries: 24, progress: 65 },
    { id: 2, name: "Women in Tech", beneficiaries: 18, progress: 40 },
    { id: 3, name: "Green Innovation", beneficiaries: 15, progress: 80 },
    { id: 4, name: "Youth Entrepreneurship", beneficiaries: 30, progress: 25 },
    { id: 5, name: "Rural Development", beneficiaries: 40, progress: 50 },
  ]

  const recentApplications = [
    { id: 1, company: "EcoSolutions Ltd", program: "Green Innovation", status: "Pending Review", date: "May 10, 2025" },
    { id: 2, company: "TechStart Inc", program: "Startup Accelerator", status: "Approved", date: "May 9, 2025" },
    { id: 3, company: "AgriTech Solutions", program: "Rural Development", status: "Interview", date: "May 8, 2025" },
    { id: 4, company: "WomenCode", program: "Women in Tech", status: "Approved", date: "May 7, 2025" },
  ]

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.dashboardTitle}>Support Program Dashboard</h1>

      {/* Stats Overview */}
      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.statIcon}>{stat.icon}</div>
            <div className={styles.statInfo}>
              <h3 className={styles.statValue}>{stat.value}</h3>
              <p className={styles.statLabel}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.dashboardGrid}>
        {/* Active Programs */}
        <div className={styles.dashboardCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <Award size={20} className={styles.cardIcon} /> Active Programs
            </h2>
            <Link to="/support-programs" className={styles.viewAllLink}>
              View All
            </Link>
          </div>
          <div className={styles.programsList}>
            {activePrograms.map((program) => (
              <div key={program.id} className={styles.programItem}>
                <div className={styles.programInfo}>
                  <h3 className={styles.programName}>{program.name}</h3>
                  <p className={styles.programBeneficiaries}>{program.beneficiaries} beneficiaries</p>
                </div>
                <div className={styles.programProgressWrapper}>
                  <div className={styles.programProgress}>
                    <div className={styles.programProgressBar} style={{ width: `${program.progress}%` }}></div>
                  </div>
                  <span className={styles.programProgressText}>{program.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div className={styles.dashboardCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <CheckCircle size={20} className={styles.cardIcon} /> Recent Applications
            </h2>
            <Link to="/support-applications" className={styles.viewAllLink}>
              View All
            </Link>
          </div>
          <div className={styles.applicationsList}>
            {recentApplications.map((app) => (
              <div key={app.id} className={styles.applicationItem}>
                <div className={styles.applicationInfo}>
                  <h3 className={styles.applicationCompany}>{app.company}</h3>
                  <p className={styles.applicationProgram}>Program: {app.program}</p>
                </div>
                <div className={styles.applicationMeta}>
                  <span className={`${styles.applicationStatus} ${styles[app.status.toLowerCase().replace(" ", "")]}`}>
                    {app.status}
                  </span>
                  <span className={styles.applicationDate}>{app.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className={styles.dashboardCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <Calendar size={20} className={styles.cardIcon} /> Upcoming Events
            </h2>
            <Link to="/support-calendar" className={styles.viewAllLink}>
              View All
            </Link>
          </div>
          <div className={styles.eventsList}>
            {upcomingEvents.map((event) => (
              <div key={event.id} className={styles.eventItem}>
                <div className={styles.eventInfo}>
                  <h3 className={styles.eventTitle}>{event.title}</h3>
                  <div className={styles.eventMeta}>
                    <span className={styles.eventDate}>
                      <Calendar size={14} className={styles.eventIcon} /> {event.date}
                    </span>
                    <span className={styles.eventTime}>
                      <Clock size={14} className={styles.eventIcon} /> {event.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className={styles.dashboardCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <BarChart size={20} className={styles.cardIcon} /> Performance Metrics
            </h2>
            <Link to="/support-analytics" className={styles.viewAllLink}>
              View Details
            </Link>
          </div>
          <div className={styles.metricsContent}>
            <div className={styles.metricItem}>
              <div className={styles.metricInfo}>
                <h3 className={styles.metricLabel}>Beneficiary Retention</h3>
                <p className={styles.metricValue}>92%</p>
              </div>
              <div className={styles.metricProgress}>
                <div className={styles.metricProgressBar} style={{ width: "92%" }}></div>
              </div>
            </div>
            <div className={styles.metricItem}>
              <div className={styles.metricInfo}>
                <h3 className={styles.metricLabel}>Program Completion Rate</h3>
                <p className={styles.metricValue}>78%</p>
              </div>
              <div className={styles.metricProgress}>
                <div className={styles.metricProgressBar} style={{ width: "78%" }}></div>
              </div>
            </div>
            <div className={styles.metricItem}>
              <div className={styles.metricInfo}>
                <h3 className={styles.metricLabel}>Post-Program Success</h3>
                <p className={styles.metricValue}>65%</p>
              </div>
              <div className={styles.metricProgress}>
                <div className={styles.metricProgressBar} style={{ width: "65%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupportProgramDashboard
