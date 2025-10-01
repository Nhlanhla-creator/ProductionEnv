"use client"
import { useState, useEffect } from "react"
import {
  Download,
  Database,
  Users,
  FileText,
  X,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Archive,
  Shield,
  Trash2,
  Eye,
  Settings,
  ExternalLink,
} from "lucide-react"
import styles from "./admin-settings.module.css"

function BackupExportData() {
  const [loading, setLoading] = useState(true)
  const [selectedExportType, setSelectedExportType] = useState(null)
  const [exportProgress, setExportProgress] = useState({})
  const [showGDPRModal, setShowGDPRModal] = useState(false)

  const [systemInfo, setSystemInfo] = useState({
    databaseSize: "2.4 GB",
    totalRecords: 156789,
    lastBackup: "2024-06-25 02:00 AM",
    backupSize: "1.8 GB",
    retentionPeriod: "90 days",
    storageUsed: "67%",
  })

  const [exportTypes, setExportTypes] = useState([
    {
      id: "users",
      name: "User Data",
      description: "Export all user profiles and registration data",
      icon: <Users size={24} />,
      recordCount: 1247,
      estimatedSize: "45 MB",
      formats: ["CSV", "Excel", "JSON"],
      lastExport: "2024-06-20",
      status: "ready"
    },
    {
      id: "applications",
      name: "Application Data", 
      description: "Export all application submissions and statuses",
      icon: <FileText size={24} />,
      recordCount: 342,
      estimatedSize: "128 MB",
      formats: ["Excel", "PDF", "JSON"],
      lastExport: "2024-06-22",
      status: "ready"
    },
    {
      id: "payments",
      name: "Payment Reports",
      description: "Export payment transactions and invoices",
      icon: <CreditCard size={24} />,
      recordCount: 1089,
      estimatedSize: "23 MB",
      formats: ["CSV", "Excel", "PDF"],
      lastExport: "2024-06-24",
      status: "ready"
    },
    {
      id: "documents",
      name: "Document Metadata",
      description: "Export document information and compliance data",
      icon: <Archive size={24} />,
      recordCount: 2156,
      estimatedSize: "89 MB",
      formats: ["Excel", "CSV"],
      lastExport: "2024-06-18",
      status: "ready"
    },
    {
      id: "audit",
      name: "Audit Logs",
      description: "Export system activity and audit trail",
      icon: <Shield size={24} />,
      recordCount: 45678,
      estimatedSize: "156 MB",
      formats: ["CSV", "JSON"],
      lastExport: "2024-06-21",
      status: "ready"
    }
  ])

  const [backupSchedules, setBackupSchedules] = useState([
    {
      id: 1,
      name: "Daily Incremental Backup",
      schedule: "Daily at 2:00 AM",
      status: "active",
      lastRun: "2024-06-25 02:00 AM",
      nextRun: "2024-06-26 02:00 AM",
      type: "incremental",
      retention: "30 days"
    },
    {
      id: 2,
      name: "Weekly Full Backup",
      schedule: "Sunday at 1:00 AM",
      status: "active", 
      lastRun: "2024-06-23 01:00 AM",
      nextRun: "2024-06-30 01:00 AM",
      type: "full",
      retention: "90 days"
    },
    {
      id: 3,
      name: "Monthly Archive Backup",
      schedule: "1st of month at 12:00 AM",
      status: "active",
      lastRun: "2024-06-01 00:00 AM",
      nextRun: "2024-07-01 00:00 AM", 
      type: "archive",
      retention: "1 year"
    }
  ])

  const [gdprSettings, setGdprSettings] = useState({
    autoAnonymize: true,
    retentionPeriod: "2",
    deleteInactiveAfter: "1",
    enableDataPortability: true,
    enableRightToErasure: true,
    logDataRequests: true,
  })

  const [recentExports, setRecentExports] = useState([
    {
      id: 1,
      type: "User Data",
      format: "Excel",
      requestedBy: "Admin User",
      requestedAt: "2024-06-24 14:30",
      completedAt: "2024-06-24 14:32",
      fileSize: "42 MB",
      status: "completed",
      downloadUrl: "#"
    },
    {
      id: 2,
      type: "Payment Reports",
      format: "PDF",
      requestedBy: "Finance Manager",
      requestedAt: "2024-06-23 10:15",
      completedAt: "2024-06-23 10:18",
      fileSize: "18 MB",
      status: "completed",
      downloadUrl: "#"
    },
    {
      id: 3,
      type: "Application Data",
      format: "CSV",
      requestedBy: "Operations Team",
      requestedAt: "2024-06-22 16:45",
      completedAt: null,
      fileSize: null,
      status: "failed",
      downloadUrl: null
    }
  ])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleExport = (exportType, format) => {
    setExportProgress({
      [exportType.id]: {
        status: "processing",
        progress: 0,
        format: format
      }
    })

    // Simulate export progress
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setTimeout(() => {
          setExportProgress({
            [exportType.id]: {
              status: "completed",
              progress: 100,
              format: format,
              downloadUrl: "#"
            }
          })
        }, 500)
      } else {
        setExportProgress({
          [exportType.id]: {
            status: "processing",
            progress: Math.min(progress, 95),
            format: format
          }
        })
      }
    }, 500)
  }

  const handleBackupNow = (schedule) => {
    if (window.confirm(`Start ${schedule.name} now? This may take several minutes.`)) {
      alert(`${schedule.name} started. You will be notified when it completes.`)
    }
  }

  const handleToggleSchedule = (scheduleId) => {
    setBackupSchedules(backupSchedules.map(schedule =>
      schedule.id === scheduleId 
        ? { ...schedule, status: schedule.status === "active" ? "paused" : "active" }
        : schedule
    ))
  }

  const handleDownloadExport = (exportId) => {
    alert(`Downloading export file...`)
  }

  const handleDeleteExport = (exportId) => {
    if (window.confirm("Are you sure you want to delete this export?")) {
      setRecentExports(recentExports.filter(exp => exp.id !== exportId))
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "#2ecc71"
      case "active": return "#2ecc71"
      case "processing": return "#f39c12"
      case "failed": return "#e74c3c"
      case "paused": return "#95a5a6"
      default: return "#3498db"
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Backup & Export Data...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Backup & Export Data</h1>
          <p className={styles.subtitle}>Manage data backups, exports, and compliance settings</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.storageInfo}>
            <Database size={16} />
            <span>Database Size: {systemInfo.databaseSize}</span>
          </div>
          <button 
            className={styles.secondaryButton}
            onClick={() => setShowGDPRModal(true)}
          >
            <Shield size={16} />
            GDPR Settings
          </button>
        </div>
      </div>

      <div className={styles.settingsContent}>
        {/* System Overview */}
        <div className={styles.settingsCard}>
          <h3>System Overview</h3>
          <div className={styles.systemOverviewGrid}>
            <div className={styles.overviewItem}>
              <div className={styles.overviewLabel}>Total Records</div>
              <div className={styles.overviewValue}>{systemInfo.totalRecords.toLocaleString()}</div>
            </div>
            <div className={styles.overviewItem}>
              <div className={styles.overviewLabel}>Last Backup</div>
              <div className={styles.overviewValue}>{systemInfo.lastBackup}</div>
            </div>
            <div className={styles.overviewItem}>
              <div className={styles.overviewLabel}>Backup Size</div>
              <div className={styles.overviewValue}>{systemInfo.backupSize}</div>
            </div>
            <div className={styles.overviewItem}>
              <div className={styles.overviewLabel}>Storage Used</div>
              <div className={styles.overviewValue}>{systemInfo.storageUsed}</div>
            </div>
          </div>
        </div>

        {/* Export Data */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <h3>Export Data</h3>
            <span className={styles.exportNote}>Select data type and format to export</span>
          </div>
          
          <div className={styles.exportGrid}>
            {exportTypes.map(exportType => (
              <div key={exportType.id} className={styles.exportCard}>
                <div className={styles.exportHeader}>
                  <div className={styles.exportIcon}>
                    {exportType.icon}
                  </div>
                  <div className={styles.exportInfo}>
                    <h4>{exportType.name}</h4>
                    <p>{exportType.description}</p>
                    <div className={styles.exportMeta}>
                      <span>{exportType.recordCount.toLocaleString()} records</span>
                      <span>Est. {exportType.estimatedSize}</span>
                      <span>Last: {exportType.lastExport}</span>
                    </div>
                  </div>
                </div>

                {exportProgress[exportType.id] ? (
                  <div className={styles.exportProgress}>
                    <div className={styles.progressHeader}>
                      <span>Exporting as {exportProgress[exportType.id].format}...</span>
                      <span>{Math.round(exportProgress[exportType.id].progress)}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ width: `${exportProgress[exportType.id].progress}%` }}
                      ></div>
                    </div>
                    {exportProgress[exportType.id].status === "completed" && (
                      <button 
                        className={styles.downloadBtn}
                        onClick={() => handleDownloadExport(exportType.id)}
                      >
                        <Download size={14} />
                        Download
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={styles.exportActions}>
                    {exportType.formats.map(format => (
                      <button
                        key={format}
                        className={styles.exportFormatBtn}
                        onClick={() => handleExport(exportType, format)}
                      >
                        <Download size={14} />
                        Export {format}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled Backups */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <h3>Scheduled Backups</h3>
            <button className={styles.secondaryButton}>
              <Settings size={16} />
              Configure Schedules
            </button>
          </div>
          
          <div className={styles.backupScheduleList}>
            {backupSchedules.map(schedule => (
              <div key={schedule.id} className={styles.scheduleItem}>
                <div className={styles.scheduleInfo}>
                  <div className={styles.scheduleName}>{schedule.name}</div>
                  <div className={styles.scheduleDetails}>
                    <span className={styles.scheduleTime}>
                      <Clock size={14} />
                      {schedule.schedule}
                    </span>
                    <span className={styles.scheduleType}>{schedule.type}</span>
                    <span className={styles.scheduleRetention}>Retention: {schedule.retention}</span>
                  </div>
                  <div className={styles.scheduleTimestamps}>
                    <span>Last: {schedule.lastRun}</span>
                    <span>Next: {schedule.nextRun}</span>
                  </div>
                </div>
                <div className={styles.scheduleActions}>
                  <div 
                    className={styles.scheduleStatus}
                    style={{ color: getStatusColor(schedule.status) }}
                  >
                    {schedule.status === "active" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    {schedule.status}
                  </div>
                  <button 
                    className={styles.actionBtn}
                    onClick={() => handleBackupNow(schedule)}
                    title="Run Now"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button 
                    className={styles.actionBtn}
                    onClick={() => handleToggleSchedule(schedule.id)}
                    title={schedule.status === "active" ? "Pause" : "Resume"}
                  >
                    {schedule.status === "active" ? "Pause" : "Resume"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Exports */}
        <div className={styles.settingsCard}>
          <h3>Recent Export History</h3>
          <div className={styles.exportsHistory}>
            {recentExports.map(exportItem => (
              <div key={exportItem.id} className={styles.exportHistoryItem}>
                <div className={styles.exportDetails}>
                  <div className={styles.exportName}>{exportItem.type}</div>
                  <div className={styles.exportMeta}>
                    <span>Format: {exportItem.format}</span>
                    <span>By: {exportItem.requestedBy}</span>
                    <span>Requested: {exportItem.requestedAt}</span>
                    {exportItem.fileSize && <span>Size: {exportItem.fileSize}</span>}
                  </div>
                </div>
                <div className={styles.exportStatus}>
                  <span 
                    className={styles.statusBadge}
                    style={{ 
                      backgroundColor: getStatusColor(exportItem.status) + "20",
                      color: getStatusColor(exportItem.status)
                    }}
                  >
                    {exportItem.status}
                  </span>
                  <div className={styles.exportActions}>
                    {exportItem.status === "completed" && (
                      <button 
                        className={styles.actionBtn}
                        onClick={() => handleDownloadExport(exportItem.id)}
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                    )}
                    <button 
                      className={styles.actionBtn}
                      onClick={() => handleDeleteExport(exportItem.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GDPR Compliance Quick Actions */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <h3>GDPR Compliance</h3>
            <Shield size={20} className={styles.sectionIcon} />
          </div>
          
          <div className={styles.gdprQuickActions}>
            <div className={styles.gdprAction}>
              <div className={styles.gdprActionInfo}>
                <h4>Data Retention Policy</h4>
                <p>Automatically delete user data after {gdprSettings.retentionPeriod} years of inactivity</p>
              </div>
              <div className={styles.gdprActionStatus}>
                {gdprSettings.autoAnonymize ? "Enabled" : "Disabled"}
              </div>
            </div>
            <div className={styles.gdprAction}>
              <div className={styles.gdprActionInfo}>
                <h4>Data Portability</h4>
                <p>Allow users to export their personal data in machine-readable format</p>
              </div>
              <div className={styles.gdprActionStatus}>
                {gdprSettings.enableDataPortability ? "Enabled" : "Disabled"}
              </div>
            </div>
            <div className={styles.gdprAction}>
              <div className={styles.gdprActionInfo}>
                <h4>Right to Erasure</h4>
                <p>Enable users to request deletion of their personal data</p>
              </div>
              <div className={styles.gdprActionStatus}>
                {gdprSettings.enableRightToErasure ? "Enabled" : "Disabled"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GDPR Settings Modal */}
      {showGDPRModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>GDPR Compliance Settings</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowGDPRModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.gdprSettings}>
                <div className={styles.toggleItem}>
                  <label className={styles.toggleLabel}>
                    <input 
                      type="checkbox" 
                      checked={gdprSettings.autoAnonymize}
                      onChange={(e) => setGdprSettings({...gdprSettings, autoAnonymize: e.target.checked})}
                    />
                    <span className={styles.toggleSlider}></span>
                    <div className={styles.toggleText}>
                      <strong>Automatic Data Anonymization</strong>
                      <span>Remove personally identifiable information from exports</span>
                    </div>
                  </label>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Delete inactive user data after:</label>
                  <select 
                    value={gdprSettings.retentionPeriod}
                    onChange={(e) => setGdprSettings({...gdprSettings, retentionPeriod: e.target.value})}
                    className={styles.formSelect}
                  >
                    <option value="1">1 year</option>
                    <option value="2">2 years</option>
                    <option value="3">3 years</option>
                    <option value="5">5 years</option>
                  </select>
                </div>

                <div className={styles.toggleItem}>
                  <label className={styles.toggleLabel}>
                    <input 
                      type="checkbox" 
                      checked={gdprSettings.enableDataPortability}
                      onChange={(e) => setGdprSettings({...gdprSettings, enableDataPortability: e.target.checked})}
                    />
                    <span className={styles.toggleSlider}></span>
                    <div className={styles.toggleText}>
                      <strong>Enable Data Portability</strong>
                      <span>Allow users to download their data</span>
                    </div>
                  </label>
                </div>

                <div className={styles.toggleItem}>
                  <label className={styles.toggleLabel}>
                    <input 
                      type="checkbox" 
                      checked={gdprSettings.enableRightToErasure}
                      onChange={(e) => setGdprSettings({...gdprSettings, enableRightToErasure: e.target.checked})}
                    />
                    <span className={styles.toggleSlider}></span>
                    <div className={styles.toggleText}>
                      <strong>Enable Right to Erasure</strong>
                      <span>Allow users to request data deletion</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.secondaryButton}
                onClick={() => setShowGDPRModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.primaryButton}
                onClick={() => {
                  setShowGDPRModal(false)
                  alert("GDPR settings saved successfully!")
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BackupExportData