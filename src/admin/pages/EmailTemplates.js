"use client"
import { useState, useEffect } from "react"
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Eye,
  Copy,
  Send,
  Search,
  Filter,
  FileText,
  Users,
  CheckCircle,
} from "lucide-react"
import styles from "./admin-settings.module.css"

function EmailTemplates() {
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterUserType, setFilterUserType] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [previewTemplate, setPreviewTemplate] = useState(null)

  const [emailTemplates, setEmailTemplates] = useState([
    {
      id: 1,
      name: "Welcome Email - SME",
      subject: "Welcome to Innovation Platform",
      type: "welcome",
      userType: "sme",
      content: `Dear {{name}},

Welcome to Innovation Platform! We're excited to have you join our community of innovative entrepreneurs and business leaders.

Your account has been successfully created and you can now:
• Submit funding applications
• Access our network of advisors
• Connect with potential investors
• Utilize our business resources

To get started, simply log in to your account at {{platform_url}} using your registered email address.

If you have any questions, our support team is here to help at support@platform.co.za

Best regards,
The Innovation Platform Team`,
      lastModified: "2024-06-20",
      isActive: true,
    },
    {
      id: 2,
      name: "Welcome Email - Investor",
      subject: "Welcome to Innovation Platform - Investor Portal",
      type: "welcome",
      userType: "investor",
      content: `Dear {{name}},

Welcome to Innovation Platform's Investor Portal! Thank you for joining our exclusive network of investors.

As a verified investor, you now have access to:
• Curated investment opportunities
• Detailed company profiles and financials
• Direct communication with entrepreneurs
• Investment analytics and reporting

Your investor dashboard is ready at {{platform_url}}/investor

We look forward to facilitating successful investments through our platform.

Best regards,
Investment Team
Innovation Platform`,
      lastModified: "2024-06-18",
      isActive: true,
    },
    {
      id: 3,
      name: "Application Approved",
      subject: "🎉 Your {{application_type}} has been approved!",
      type: "approval",
      userType: "all",
      content: `Dear {{name}},

Congratulations! We're pleased to inform you that your {{application_type}} has been approved.

Application Details:
• Application ID: {{application_id}}
• Submitted: {{submission_date}}
• Approved: {{approval_date}}
• Reviewer: {{reviewer_name}}

Next Steps:
{{next_steps}}

You can view your application status and next steps in your dashboard at {{platform_url}}/dashboard

Thank you for choosing Innovation Platform. We look forward to supporting your journey!

Best regards,
{{reviewer_name}}
Innovation Platform Team`,
      lastModified: "2024-06-15",
      isActive: true,
    },
    {
      id: 4,
      name: "Application Rejected",
      subject: "Update on your {{application_type}}",
      type: "rejection",
      userType: "all",
      content: `Dear {{name}},

Thank you for submitting your {{application_type}} to Innovation Platform. After careful review, we regret to inform you that we cannot approve your application at this time.

Reason for rejection:
{{rejection_reason}}

We encourage you to:
• Review our application guidelines
• Address the feedback provided
• Resubmit your application after making improvements

Our team is available to provide guidance. Please contact us at support@platform.co.za if you have any questions.

Best regards,
{{reviewer_name}}
Innovation Platform Team`,
      lastModified: "2024-06-12",
      isActive: true,
    },
    {
      id: 5,
      name: "Payment Confirmation",
      subject: "Payment Received - Invoice {{invoice_number}}",
      type: "payment",
      userType: "all",
      content: `Dear {{name}},

Thank you for your payment! This email confirms we have received your payment.

Payment Details:
• Invoice Number: {{invoice_number}}
• Amount: {{currency_symbol}}{{amount}}
• Payment Date: {{payment_date}}
• Payment Method: {{payment_method}}

Your account has been updated and all services are now active.

You can download your receipt from your dashboard at {{platform_url}}/billing

Thank you for your business!

Best regards,
Billing Team
Innovation Platform`,
      lastModified: "2024-06-10",
      isActive: true,
    },
    {
      id: 6,
      name: "NDA Reminder",
      subject: "NDA Signature Required",
      type: "reminder",
      userType: "all",
      content: `Dear {{name}},

This is a friendly reminder that you have a pending NDA (Non-Disclosure Agreement) that requires your signature.

Document: {{document_name}}
Uploaded: {{upload_date}}
Deadline: {{deadline_date}}

To complete the signing process:
1. Log in to your account at {{platform_url}}
2. Navigate to Documents > Pending NDAs
3. Review and sign the document

Please note that some platform features may be limited until all required documents are signed.

If you have any questions, please contact us at legal@platform.co.za

Best regards,
Legal Team
Innovation Platform`,
      lastModified: "2024-06-08",
      isActive: true,
    },
  ])

  const [emailSignature, setEmailSignature] = useState(`Best regards,
Innovation Platform Team
Email: info@platform.co.za
Phone: +27 11 123 4567
Website: www.platform.co.za

Follow us:
LinkedIn: linkedin.com/company/innovation-platform
Twitter: @InnovationPlatform`)

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    type: "welcome",
    userType: "all",
    content: "",
  })

  const templateTypes = [
    { value: "welcome", label: "Welcome Email", description: "Sent when users register" },
    { value: "approval", label: "Approval Email", description: "Sent when applications are approved" },
    { value: "rejection", label: "Rejection Email", description: "Sent when applications are rejected" },
    { value: "payment", label: "Payment Email", description: "Sent for payment confirmations" },
    { value: "reminder", label: "Reminder Email", description: "Sent for various reminders" },
    { value: "notification", label: "Notification Email", description: "General notifications" },
    { value: "marketing", label: "Marketing Email", description: "Promotional emails" },
  ]

  const userTypes = [
    { value: "all", label: "All Users" },
    { value: "sme", label: "SMEs" },
    { value: "investor", label: "Investors" },
    { value: "catalyst", label: "Catalysts" },
    { value: "advisor", label: "Advisors" },
  ]

  const availableVariables = [
    "{{name}}", "{{email}}", "{{company_name}}", "{{platform_url}}",
    "{{application_type}}", "{{application_id}}", "{{submission_date}}",
    "{{approval_date}}", "{{rejection_reason}}", "{{reviewer_name}}",
    "{{invoice_number}}", "{{amount}}", "{{currency_symbol}}",
    "{{payment_date}}", "{{payment_method}}", "{{document_name}}",
    "{{upload_date}}", "{{deadline_date}}", "{{next_steps}}"
  ]

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const filteredTemplates = emailTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || template.type === filterType
    const matchesUserType = filterUserType === "all" || template.userType === filterUserType
    
    return matchesSearch && matchesType && matchesUserType
  })

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      alert("Please fill in all required fields")
      return
    }

    const template = {
      id: Math.max(...emailTemplates.map(t => t.id)) + 1,
      ...newTemplate,
      lastModified: new Date().toISOString().split('T')[0],
      isActive: true,
    }

    setEmailTemplates([...emailTemplates, template])
    setNewTemplate({
      name: "",
      subject: "",
      type: "welcome",
      userType: "all",
      content: "",
    })
    setShowAddModal(false)
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate({ ...template })
    setShowEditModal(true)
  }

  const handleUpdateTemplate = () => {
    setEmailTemplates(emailTemplates.map(template => 
      template.id === editingTemplate.id 
        ? { ...editingTemplate, lastModified: new Date().toISOString().split('T')[0] }
        : template
    ))
    setShowEditModal(false)
    setEditingTemplate(null)
  }

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      setEmailTemplates(emailTemplates.filter(template => template.id !== templateId))
    }
  }

  const handleToggleTemplate = (templateId) => {
    setEmailTemplates(emailTemplates.map(template =>
      template.id === templateId 
        ? { ...template, isActive: !template.isActive }
        : template
    ))
  }

  const handlePreviewTemplate = (template) => {
    setPreviewTemplate(template)
    setShowPreviewModal(true)
  }

  const handleCopyTemplate = (template) => {
    const copy = {
      ...template,
      id: Math.max(...emailTemplates.map(t => t.id)) + 1,
      name: `${template.name} (Copy)`,
      lastModified: new Date().toISOString().split('T')[0],
    }
    setEmailTemplates([...emailTemplates, copy])
    alert("Template copied successfully!")
  }

  const handleSendTestEmail = (template) => {
    const email = prompt("Enter email address to send test:")
    if (email) {
      alert(`Test email sent to ${email}`)
    }
  }

  const insertVariable = (variable, template, setTemplate) => {
    const textarea = document.activeElement
    if (textarea && textarea.tagName === 'TEXTAREA') {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      const newText = before + variable + after
      
      setTemplate({
        ...template,
        content: newText
      })
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length
        textarea.focus()
      }, 0)
    }
  }

  const getTypeLabel = (type) => {
    const typeObj = templateTypes.find(t => t.value === type)
    return typeObj ? typeObj.label : type
  }

  const getUserTypeLabel = (userType) => {
    const userTypeObj = userTypes.find(t => t.value === userType)
    return userTypeObj ? userTypeObj.label : userType
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Email Templates...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Email Templates</h1>
          <p className={styles.subtitle}>Manage automated email templates for different user interactions</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.primaryButton}
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            Create Template
          </button>
        </div>
      </div>

      <div className={styles.settingsContent}>
        {/* Filters and Search */}
        <div className={styles.filtersSection}>
          <div className={styles.searchContainer}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterControls}>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Types</option>
              {templateTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select
              value={filterUserType}
              onChange={(e) => setFilterUserType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All User Types</option>
              {userTypes.slice(1).map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className={styles.templateGrid}>
          {filteredTemplates.map(template => (
            <div key={template.id} className={`${styles.templateCard} ${!template.isActive ? styles.inactive : ''}`}>
              <div className={styles.templateHeader}>
                <div className={styles.templateTitle}>
                  <h3>{template.name}</h3>
                  <div className={styles.templateMeta}>
                    <span className={`${styles.templateType} ${styles[template.type]}`}>
                      {getTypeLabel(template.type)}
                    </span>
                    <span className={`${styles.userType} ${styles[template.userType]}`}>
                      {getUserTypeLabel(template.userType)}
                    </span>
                  </div>
                </div>
                <div className={styles.templateStatus}>
                  <button
                    className={`${styles.toggleBtn} ${template.isActive ? styles.active : styles.inactive}`}
                    onClick={() => handleToggleTemplate(template.id)}
                  >
                    {template.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
              
              <div className={styles.templateContent}>
                <div className={styles.subjectLine}>
                  <strong>Subject:</strong> {template.subject}
                </div>
                <div className={styles.templatePreview}>
                  {template.content.substring(0, 150)}...
                </div>
              </div>
              
              <div className={styles.templateFooter}>
                <span className={styles.lastModified}>
                  Modified: {template.lastModified}
                </span>
                <div className={styles.templateActions}>
                  <button 
                    className={styles.actionBtn} 
                    title="Preview"
                    onClick={() => handlePreviewTemplate(template)}
                  >
                    <Eye size={14} />
                  </button>
                  <button 
                    className={styles.actionBtn} 
                    title="Edit"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    className={styles.actionBtn} 
                    title="Copy"
                    onClick={() => handleCopyTemplate(template)}
                  >
                    <Copy size={14} />
                  </button>
                  <button 
                    className={styles.actionBtn} 
                    title="Send Test"
                    onClick={() => handleSendTestEmail(template)}
                  >
                    <Send size={14} />
                  </button>
                  <button 
                    className={styles.actionBtn} 
                    title="Delete"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Email Signature */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <h3>Default Email Signature</h3>
            <button className={styles.secondaryButton}>
              <Save size={16} />
              Save Signature
            </button>
          </div>
          <textarea 
            className={styles.formTextarea}
            rows={8}
            value={emailSignature}
            onChange={(e) => setEmailSignature(e.target.value)}
            placeholder="Enter your default email signature..."
          />
        </div>
      </div>

      {/* Add Template Modal */}
      {showAddModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Create New Email Template</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowAddModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Template Name *</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    className={styles.formInput}
                    placeholder="e.g., Welcome Email - SME"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Subject *</label>
                  <input
                    type="text"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                    className={styles.formInput}
                    placeholder="Email subject line"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Template Type</label>
                  <select
                    value={newTemplate.type}
                    onChange={(e) => setNewTemplate({...newTemplate, type: e.target.value})}
                    className={styles.formSelect}
                  >
                    {templateTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Target User Type</label>
                  <select
                    value={newTemplate.userType}
                    onChange={(e) => setNewTemplate({...newTemplate, userType: e.target.value})}
                    className={styles.formSelect}
                  >
                    {userTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Email Content *</label>
                <div className={styles.variablesHelper}>
                  <span>Available variables:</span>
                  <div className={styles.variablesList}>
                    {availableVariables.map(variable => (
                      <button
                        key={variable}
                        type="button"
                        className={styles.variableBtn}
                        onClick={() => insertVariable(variable, newTemplate, setNewTemplate)}
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                  className={styles.formTextarea}
                  rows={12}
                  placeholder="Enter email content..."
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.secondaryButton}
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.primaryButton}
                onClick={handleAddTemplate}
              >
                <Save size={16} />
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && editingTemplate && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Edit Email Template</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Template Name</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Subject</label>
                  <input
                    type="text"
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Template Type</label>
                  <select
                    value={editingTemplate.type}
                    onChange={(e) => setEditingTemplate({...editingTemplate, type: e.target.value})}
                    className={styles.formSelect}
                  >
                    {templateTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Target User Type</label>
                  <select
                    value={editingTemplate.userType}
                    onChange={(e) => setEditingTemplate({...editingTemplate, userType: e.target.value})}
                    className={styles.formSelect}
                  >
                    {userTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Email Content</label>
                <div className={styles.variablesHelper}>
                  <span>Available variables:</span>
                  <div className={styles.variablesList}>
                    {availableVariables.map(variable => (
                      <button
                        key={variable}
                        type="button"
                        className={styles.variableBtn}
                        onClick={() => insertVariable(variable, editingTemplate, setEditingTemplate)}
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate({...editingTemplate, content: e.target.value})}
                  className={styles.formTextarea}
                  rows={12}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.secondaryButton}
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.primaryButton}
                onClick={handleUpdateTemplate}
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Email Preview: {previewTemplate.name}</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowPreviewModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.emailPreview}>
                <div className={styles.previewHeader}>
                  <strong>Subject:</strong> {previewTemplate.subject}
                </div>
                <div className={styles.previewContent}>
                  <pre>{previewTemplate.content}</pre>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.secondaryButton}
                onClick={() => setShowPreviewModal(false)}
              >
                Close
              </button>
              <button 
                className={styles.primaryButton}
                onClick={() => handleSendTestEmail(previewTemplate)}
              >
                <Send size={16} />
                Send Test Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmailTemplates