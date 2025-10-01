"use client"
import { useState, useEffect } from "react"
import {
  Settings,
  Users,
  Workflow,
  CreditCard,
  Mail,
  Server,
  Download,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Check,
  Shield,
  Clock,
  FileText,
  Database,
  Key,
  Bell,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Copy,
  ExternalLink,
} from "lucide-react"
import styles from "./admin-settings.module.css"

function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("admin-users")
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [showPassword, setShowPassword] = useState({})
  const [searchTerm, setSearchTerm] = useState("")

  // Mock data states
  const [adminUsers, setAdminUsers] = useState([
    {
      id: 1,
      name: "John Smith",
      email: "john@platform.co.za",
      role: "Super Admin",
      permissions: ["all"],
      lastLogin: "2024-06-24",
      status: "active",
      twoFaEnabled: true,
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@platform.co.za",
      role: "Moderator",
      permissions: ["approve_applications", "manage_users"],
      lastLogin: "2024-06-23",
      status: "active",
      twoFaEnabled: false,
    },
    {
      id: 3,
      name: "Mike Wilson",
      email: "mike@platform.co.za",
      role: "Viewer",
      permissions: ["view_only"],
      lastLogin: "2024-06-20",
      status: "inactive",
      twoFaEnabled: true,
    },
  ])

  const [approvalWorkflows, setApprovalWorkflows] = useState([
    {
      id: 1,
      applicationType: "funding_application",
      workflow: "multi_stage",
      stages: [
        { stage: 1, approver: "Finance Team", timeLimit: 5 },
        { stage: 2, approver: "Investment Committee", timeLimit: 10 },
      ],
      requiredDocs: ["business_plan", "financial_statements", "nda"],
    },
    {
      id: 2,
      applicationType: "advisory_application",
      workflow: "single_approval",
      stages: [
        { stage: 1, approver: "Advisory Board", timeLimit: 7 },
      ],
      requiredDocs: ["company_profile", "nda"],
    },
  ])

  const [paymentSettings, setPaymentSettings] = useState({
    processor: "stripe",
    currency: "ZAR",
    plans: [
      { id: 1, name: "Basic Plan", price: 500, interval: "monthly" },
      { id: 2, name: "Premium Plan", price: 1200, interval: "monthly" },
      { id: 3, name: "Enterprise Plan", price: 2500, interval: "monthly" },
    ],
    invoiceSettings: {
      companyName: "Innovation Platform",
      address: "123 Business St, Cape Town, South Africa",
      taxNumber: "TAX123456789",
    },
  })

  const [emailTemplates, setEmailTemplates] = useState([
    {
      id: 1,
      name: "Welcome Email - SME",
      subject: "Welcome to Innovation Platform",
      type: "welcome",
      userType: "sme",
      content: "Dear {{name}}, Welcome to our platform...",
      lastModified: "2024-06-20",
    },
    {
      id: 2,
      name: "Application Approved",
      subject: "Your application has been approved",
      type: "approval",
      userType: "all",
      content: "Congratulations {{name}}, your {{application_type}} has been approved...",
      lastModified: "2024-06-15",
    },
  ])

  const [systemConfig, setSystemConfig] = useState({
    platformName: "Innovation Platform",
    maxFileSize: 10, // MB
    allowedFileTypes: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".zip"],
    sessionTimeout: 120, // minutes
    backupFrequency: "daily",
    maintenanceMode: false,
    apiRateLimit: 1000, // requests per hour
  })

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleSaveChanges = () => {
    setUnsavedChanges(false)
    alert("Settings saved successfully!")
  }

  const togglePassword = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const AdminUserManagement = () => (
    <div className={styles.settingsSection}>
      <div className={styles.sectionHeader}>
        <h2>Admin User Management</h2>
        <button className={styles.primaryButton}>
          <Plus size={16} />
          Add Admin User
        </button>
      </div>

      <div className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <h3>Current Admin Users</h3>
          <div className={styles.searchContainer}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search admin users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.settingsTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Last Login</th>
                <th>2FA</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.roleBadge} ${styles[user.role.replace(' ', '').toLowerCase()]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.lastLogin}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${user.twoFaEnabled ? styles.enabled : styles.disabled}`}>
                      {user.twoFaEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button className={styles.actionBtn} title="Edit">
                        <Edit size={14} />
                      </button>
                      <button className={styles.actionBtn} title="Reset Password">
                        <Key size={14} />
                      </button>
                      <button className={styles.actionBtn} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.settingsCard}>
        <h3>Role Permissions</h3>
        <div className={styles.permissionMatrix}>
          <div className={styles.permissionRow}>
            <span className={styles.permissionLabel}>Approve Applications</span>
            <div className={styles.permissionControls}>
              <label><input type="checkbox" defaultChecked /> Super Admin</label>
              <label><input type="checkbox" defaultChecked /> Moderator</label>
              <label><input type="checkbox" /> Viewer</label>
            </div>
          </div>
          <div className={styles.permissionRow}>
            <span className={styles.permissionLabel}>Manage Payments</span>
            <div className={styles.permissionControls}>
              <label><input type="checkbox" defaultChecked /> Super Admin</label>
              <label><input type="checkbox" /> Moderator</label>
              <label><input type="checkbox" /> Viewer</label>
            </div>
          </div>
          <div className={styles.permissionRow}>
            <span className={styles.permissionLabel}>System Settings</span>
            <div className={styles.permissionControls}>
              <label><input type="checkbox" defaultChecked /> Super Admin</label>
              <label><input type="checkbox" /> Moderator</label>
              <label><input type="checkbox" /> Viewer</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const ApprovalWorkflows = () => (
    <div className={styles.settingsSection}>
      <div className={styles.sectionHeader}>
        <h2>Application Approval Workflows</h2>
        <button className={styles.primaryButton}>
          <Plus size={16} />
          Add Workflow
        </button>
      </div>

      {approvalWorkflows.map(workflow => (
        <div key={workflow.id} className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <h3>{workflow.applicationType.replace('_', ' ').toUpperCase()}</h3>
            <div className={styles.workflowType}>
              <span className={styles.workflowBadge}>{workflow.workflow.replace('_', ' ')}</span>
            </div>
          </div>

          <div className={styles.workflowStages}>
            <h4>Approval Stages</h4>
            {workflow.stages.map(stage => (
              <div key={stage.stage} className={styles.stageItem}>
                <div className={styles.stageNumber}>{stage.stage}</div>
                <div className={styles.stageDetails}>
                  <strong>{stage.approver}</strong>
                  <span>Time limit: {stage.timeLimit} days</span>
                </div>
                <button className={styles.actionBtn}>
                  <Edit size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className={styles.requiredDocs}>
            <h4>Required Documents</h4>
            <div className={styles.docList}>
              {workflow.requiredDocs.map(doc => (
                <span key={doc} className={styles.docTag}>
                  {doc.replace('_', ' ')}
                  <X size={12} />
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div className={styles.settingsCard}>
        <h3>Rejection Reason Templates</h3>
        <div className={styles.templateList}>
          <div className={styles.templateItem}>
            <span>Incomplete documentation</span>
            <button className={styles.actionBtn}><Edit size={14} /></button>
          </div>
          <div className={styles.templateItem}>
            <span>Does not meet eligibility criteria</span>
            <button className={styles.actionBtn}><Edit size={14} /></button>
          </div>
          <div className={styles.templateItem}>
            <span>Insufficient business plan details</span>
            <button className={styles.actionBtn}><Edit size={14} /></button>
          </div>
        </div>
        <button className={styles.secondaryButton}>
          <Plus size={16} />
          Add Template
        </button>
      </div>
    </div>
  )

  const PaymentGatewaySettings = () => (
    <div className={styles.settingsSection}>
      <div className={styles.sectionHeader}>
        <h2>Payment Gateway Settings</h2>
        <div className={styles.statusIndicator}>
          <CheckCircle size={16} className={styles.successIcon} />
          <span>Connected to Stripe</span>
        </div>
      </div>

      <div className={styles.settingsCard}>
        <h3>Payment Processor Configuration</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Payment Processor</label>
            <select value={paymentSettings.processor} className={styles.formSelect}>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="payfast">PayFast</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Currency</label>
            <select value={paymentSettings.currency} className={styles.formSelect}>
              <option value="ZAR">South African Rand (ZAR)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>API Key</label>
            <div className={styles.passwordInput}>
              <input 
                type={showPassword.apiKey ? "text" : "password"} 
                value="sk_test_••••••••••••••••"
                className={styles.formInput}
                readOnly
              />
              <button 
                type="button" 
                onClick={() => togglePassword('apiKey')}
                className={styles.passwordToggle}
              >
                {showPassword.apiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.settingsCard}>
        <h3>Payment Plans</h3>
        <div className={styles.plansList}>
          {paymentSettings.plans.map(plan => (
            <div key={plan.id} className={styles.planItem}>
              <div className={styles.planDetails}>
                <h4>{plan.name}</h4>
                <span className={styles.planPrice}>R{plan.price}/{plan.interval}</span>
              </div>
              <div className={styles.actionButtons}>
                <button className={styles.actionBtn}><Edit size={14} /></button>
                <button className={styles.actionBtn}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
        <button className={styles.secondaryButton}>
          <Plus size={16} />
          Add Plan
        </button>
      </div>

      <div className={styles.settingsCard}>
        <h3>Invoice Settings</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Company Name</label>
            <input 
              type="text" 
              value={paymentSettings.invoiceSettings.companyName}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Company Address</label>
            <textarea 
              value={paymentSettings.invoiceSettings.address}
              className={styles.formTextarea}
              rows={3}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Tax Number</label>
            <input 
              type="text" 
              value={paymentSettings.invoiceSettings.taxNumber}
              className={styles.formInput}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const EmailTemplates = () => (
    <div className={styles.settingsSection}>
      <div className={styles.sectionHeader}>
        <h2>Email Templates</h2>
        <button className={styles.primaryButton}>
          <Plus size={16} />
          Create Template
        </button>
      </div>

      <div className={styles.templateGrid}>
        {emailTemplates.map(template => (
          <div key={template.id} className={styles.templateCard}>
            <div className={styles.templateHeader}>
              <h3>{template.name}</h3>
              <div className={styles.templateMeta}>
                <span className={styles.templateType}>{template.type}</span>
                <span className={styles.userType}>{template.userType}</span>
              </div>
            </div>
            <div className={styles.templateContent}>
              <strong>Subject:</strong> {template.subject}
              <div className={styles.templatePreview}>
                {template.content.substring(0, 100)}...
              </div>
            </div>
            <div className={styles.templateFooter}>
              <span className={styles.lastModified}>Modified: {template.lastModified}</span>
              <div className={styles.templateActions}>
                <button className={styles.actionBtn} title="Preview">
                  <Eye size={14} />
                </button>
                <button className={styles.actionBtn} title="Edit">
                  <Edit size={14} />
                </button>
                <button className={styles.actionBtn} title="Copy">
                  <Copy size={14} />
                </button>
                <button className={styles.actionBtn} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.settingsCard}>
        <h3>Email Signature</h3>
        <textarea 
          className={styles.formTextarea}
          rows={6}
          placeholder="Enter your email signature here..."
          defaultValue="Best regards,
Innovation Platform Team
Email: info@platform.co.za
Phone: +27 11 123 4567
Website: www.platform.co.za"
        />
      </div>
    </div>
  )

  const SystemConfigurations = () => (
    <div className={styles.settingsSection}>
      <div className={styles.sectionHeader}>
        <h2>System Configurations</h2>
        <div className={styles.maintenanceToggle}>
          <label className={styles.toggleLabel}>
            <input 
              type="checkbox" 
              checked={systemConfig.maintenanceMode}
              onChange={(e) => setSystemConfig({...systemConfig, maintenanceMode: e.target.checked})}
            />
            <span className={styles.toggleSlider}></span>
            Maintenance Mode
          </label>
        </div>
      </div>

      <div className={styles.settingsCard}>
        <h3>Platform Settings</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Platform Name</label>
            <input 
              type="text" 
              value={systemConfig.platformName}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Session Timeout (minutes)</label>
            <input 
              type="number" 
              value={systemConfig.sessionTimeout}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>API Rate Limit (requests/hour)</label>
            <input 
              type="number" 
              value={systemConfig.apiRateLimit}
              className={styles.formInput}
            />
          </div>
        </div>
      </div>

      <div className={styles.settingsCard}>
        <h3>File Upload Settings</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Maximum File Size (MB)</label>
            <input 
              type="number" 
              value={systemConfig.maxFileSize}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Allowed File Types</label>
            <div className={styles.fileTypesList}>
              {systemConfig.allowedFileTypes.map(type => (
                <span key={type} className={styles.fileTypeTag}>
                  {type}
                  <X size={12} />
                </span>
              ))}
            </div>
            <button className={styles.secondaryButton}>Add File Type</button>
          </div>
        </div>
      </div>

      <div className={styles.settingsCard}>
        <h3>Backup Settings</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Backup Frequency</label>
            <select value={systemConfig.backupFrequency} className={styles.formSelect}>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Last Backup</label>
            <div className={styles.backupStatus}>
              <CheckCircle size={16} className={styles.successIcon} />
              <span>2024-06-25 02:00 AM</span>
              <button className={styles.secondaryButton}>
                <RefreshCw size={14} />
                Backup Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const BackupExportData = () => (
    <div className={styles.settingsSection}>
      <div className={styles.sectionHeader}>
        <h2>Backup & Export Data</h2>
        <div className={styles.storageInfo}>
          <Database size={16} />
          <span>Database Size: 2.4 GB</span>
        </div>
      </div>

      <div className={styles.settingsCard}>
        <h3>Export Data</h3>
        <div className={styles.exportGrid}>
          <div className={styles.exportItem}>
            <div className={styles.exportIcon}>
              <Users size={24} />
            </div>
            <div className={styles.exportDetails}>
              <h4>User Data</h4>
              <p>Export all user profiles and registration data</p>
            </div>
            <button className={styles.exportButton}>
              <Download size={16} />
              Export CSV
            </button>
          </div>
          <div className={styles.exportItem}>
            <div className={styles.exportIcon}>
              <FileText size={24} />
            </div>
            <div className={styles.exportDetails}>
              <h4>Application Data</h4>
              <p>Export all application submissions and statuses</p>
            </div>
            <button className={styles.exportButton}>
              <Download size={16} />
              Export Excel
            </button>
          </div>
          <div className={styles.exportItem}>
            <div className={styles.exportIcon}>
              <CreditCard size={24} />
            </div>
            <div className={styles.exportDetails}>
              <h4>Payment Reports</h4>
              <p>Export payment transactions and invoices</p>
            </div>
            <button className={styles.exportButton}>
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className={styles.settingsCard}>
        <h3>Scheduled Backups</h3>
        <div className={styles.backupSchedule}>
          <div className={styles.scheduleItem}>
            <div className={styles.scheduleInfo}>
              <Clock size={16} />
              <span>Daily Backup - 2:00 AM</span>
            </div>
            <span className={styles.scheduleStatus}>Active</span>
          </div>
          <div className={styles.scheduleItem}>
            <div className={styles.scheduleInfo}>
              <Clock size={16} />
              <span>Weekly Full Backup - Sunday 1:00 AM</span>
            </div>
            <span className={styles.scheduleStatus}>Active</span>
          </div>
        </div>
      </div>

      <div className={styles.settingsCard}>
        <h3>GDPR Compliance</h3>
        <div className={styles.gdprTools}>
          <div className={styles.gdprItem}>
            <h4>Data Retention Policy</h4>
            <p>Automatically delete user data after specified periods</p>
            <div className={styles.retentionSettings}>
              <label>
                Delete inactive users after:
                <select className={styles.formSelect}>
                  <option value="1">1 year</option>
                  <option value="2">2 years</option>
                  <option value="3">3 years</option>
                </select>
              </label>
            </div>
          </div>
          <div className={styles.gdprItem}>
            <h4>Data Anonymization</h4>
            <p>Remove personally identifiable information from exported data</p>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" />
              Enable automatic anonymization for exports
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  const settingsTabs = [
    { id: "admin-users", label: "Admin Users", icon: Users, component: AdminUserManagement },
    { id: "workflows", label: "Workflows", icon: Workflow, component: ApprovalWorkflows },
    { id: "payments", label: "Payments", icon: CreditCard, component: PaymentGatewaySettings },
    { id: "emails", label: "Email Templates", icon: Mail, component: EmailTemplates },
    { id: "system", label: "System Config", icon: Server, component: SystemConfigurations },
    { id: "backup", label: "Backup & Export", icon: Download, component: BackupExportData },
  ]

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Admin Settings...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Admin Settings</h1>
          <p className={styles.subtitle}>Configure platform settings and manage system preferences</p>
        </div>
        <div className={styles.headerActions}>
          {unsavedChanges && (
            <button className={styles.saveButton} onClick={handleSaveChanges}>
              <Save size={16} />
              Save Changes
            </button>
          )}
        </div>
      </div>

      <div className={styles.settingsLayout}>
        <nav className={styles.settingsNav}>
          {settingsTabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.navTab} ${activeTab === tab.id ? styles.active : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.settingsContent}>
          {settingsTabs.find(tab => tab.id === activeTab)?.component()}
        </div>
      </div>
    </div>
  )
}

export default AdminSettings