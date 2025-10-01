"use client"
import { useState, useEffect } from "react"
import {
  Workflow,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Check,
  Clock,
  ArrowRight,
  FileText,
  Users,
  Settings,
} from "lucide-react"
import styles from "./admin-settings.module.css"

function ApprovalWorkflows() {
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  const [approvalWorkflows, setApprovalWorkflows] = useState([
    {
      id: 1,
      applicationType: "funding_application",
      displayName: "Funding Application",
      workflow: "multi_stage",
      stages: [
        { stage: 1, approver: "Finance Team", timeLimit: 5, description: "Initial financial review" },
        { stage: 2, approver: "Investment Committee", timeLimit: 10, description: "Final investment decision" },
      ],
      requiredDocs: ["business_plan", "financial_statements", "nda", "company_profile"],
      isActive: true,
    },
    {
      id: 2,
      applicationType: "advisory_application",
      displayName: "Advisory Application",
      workflow: "single_approval",
      stages: [
        { stage: 1, approver: "Advisory Board", timeLimit: 7, description: "Advisory suitability review" },
      ],
      requiredDocs: ["company_profile", "nda"],
      isActive: true,
    },
    {
      id: 3,
      applicationType: "product_application",
      displayName: "Product Application",
      workflow: "auto_approve",
      stages: [],
      requiredDocs: ["product_specs", "nda"],
      isActive: true,
    },
  ])

  const [rejectionTemplates, setRejectionTemplates] = useState([
    { id: 1, title: "Incomplete Documentation", content: "Your application lacks required documentation. Please submit all required documents and reapply." },
    { id: 2, title: "Eligibility Criteria Not Met", content: "Your application does not meet our current eligibility criteria for this program." },
    { id: 3, title: "Insufficient Business Plan", content: "The business plan provided lacks sufficient detail for proper evaluation. Please provide a more comprehensive business plan." },
    { id: 4, title: "Financial Requirements", content: "The financial information provided does not meet our minimum requirements for this funding opportunity." },
  ])

  const [newWorkflow, setNewWorkflow] = useState({
    applicationType: "",
    displayName: "",
    workflow: "single_approval",
    stages: [{ stage: 1, approver: "", timeLimit: 7, description: "" }],
    requiredDocs: [],
  })

  const [newTemplate, setNewTemplate] = useState({
    title: "",
    content: "",
  })

  const applicationTypes = [
    { value: "funding_application", label: "Funding Application" },
    { value: "advisory_application", label: "Advisory Application" },
    { value: "product_application", label: "Product Application" },
    { value: "partnership_application", label: "Partnership Application" },
    { value: "mentorship_application", label: "Mentorship Application" },
  ]

  const workflowTypes = [
    { value: "auto_approve", label: "Auto Approve", description: "Applications are automatically approved" },
    { value: "single_approval", label: "Single Approval", description: "One approval stage required" },
    { value: "multi_stage", label: "Multi-Stage Approval", description: "Multiple approval stages" },
  ]

  const documentTypes = [
    "business_plan", "financial_statements", "nda", "company_profile", 
    "product_specs", "team_profiles", "market_analysis", "pitch_deck",
    "legal_documents", "compliance_certificates"
  ]

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleAddWorkflow = () => {
    if (!newWorkflow.applicationType || !newWorkflow.displayName) {
      alert("Please fill in all required fields")
      return
    }

    const workflow = {
      id: Math.max(...approvalWorkflows.map(w => w.id)) + 1,
      ...newWorkflow,
      isActive: true,
    }

    setApprovalWorkflows([...approvalWorkflows, workflow])
    setNewWorkflow({
      applicationType: "",
      displayName: "",
      workflow: "single_approval",
      stages: [{ stage: 1, approver: "", timeLimit: 7, description: "" }],
      requiredDocs: [],
    })
    setShowAddModal(false)
  }

  const handleEditWorkflow = (workflow) => {
    setEditingWorkflow({ ...workflow })
    setShowEditModal(true)
  }

  const handleUpdateWorkflow = () => {
    setApprovalWorkflows(approvalWorkflows.map(workflow => 
      workflow.id === editingWorkflow.id ? editingWorkflow : workflow
    ))
    setShowEditModal(false)
    setEditingWorkflow(null)
  }

  const handleDeleteWorkflow = (workflowId) => {
    if (window.confirm("Are you sure you want to delete this workflow?")) {
      setApprovalWorkflows(approvalWorkflows.filter(workflow => workflow.id !== workflowId))
    }
  }

  const handleToggleWorkflow = (workflowId) => {
    setApprovalWorkflows(approvalWorkflows.map(workflow =>
      workflow.id === workflowId 
        ? { ...workflow, isActive: !workflow.isActive }
        : workflow
    ))
  }

  const addStage = (workflow) => {
    const newStage = {
      stage: workflow.stages.length + 1,
      approver: "",
      timeLimit: 7,
      description: ""
    }
    return {
      ...workflow,
      stages: [...workflow.stages, newStage]
    }
  }

  const removeStage = (workflow, stageIndex) => {
    return {
      ...workflow,
      stages: workflow.stages.filter((_, index) => index !== stageIndex)
        .map((stage, index) => ({ ...stage, stage: index + 1 }))
    }
  }

  const handleDocumentToggle = (workflow, docType) => {
    const updatedDocs = workflow.requiredDocs.includes(docType)
      ? workflow.requiredDocs.filter(doc => doc !== docType)
      : [...workflow.requiredDocs, docType]
    
    return { ...workflow, requiredDocs: updatedDocs }
  }

  const handleAddTemplate = () => {
    if (!newTemplate.title || !newTemplate.content) {
      alert("Please fill in all fields")
      return
    }

    const template = {
      id: Math.max(...rejectionTemplates.map(t => t.id)) + 1,
      ...newTemplate,
    }

    setRejectionTemplates([...rejectionTemplates, template])
    setNewTemplate({ title: "", content: "" })
    setShowTemplateModal(false)
  }

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      setRejectionTemplates(rejectionTemplates.filter(template => template.id !== templateId))
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Approval Workflows...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Approval Workflows</h1>
          <p className={styles.subtitle}>Configure application approval processes and requirements</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.primaryButton}
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            Add Workflow
          </button>
        </div>
      </div>

      <div className={styles.settingsContent}>
        {/* Active Workflows */}
        <div className={styles.workflowGrid}>
          {approvalWorkflows.map(workflow => (
            <div key={workflow.id} className={styles.workflowCard}>
              <div className={styles.workflowHeader}>
                <div className={styles.workflowTitle}>
                  <h3>{workflow.displayName}</h3>
                  <span className={`${styles.workflowBadge} ${styles[workflow.workflow]}`}>
                    {workflow.workflow.replace('_', ' ')}
                  </span>
                </div>
                <div className={styles.workflowActions}>
                  <button
                    className={`${styles.toggleBtn} ${workflow.isActive ? styles.active : styles.inactive}`}
                    onClick={() => handleToggleWorkflow(workflow.id)}
                  >
                    {workflow.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button 
                    className={styles.actionBtn}
                    onClick={() => handleEditWorkflow(workflow)}
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    className={styles.actionBtn}
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {workflow.workflow !== "auto_approve" && (
                <div className={styles.workflowStages}>
                  <h4>Approval Stages</h4>
                  <div className={styles.stagesFlow}>
                    {workflow.stages.map((stage, index) => (
                      <div key={stage.stage} className={styles.stageFlowItem}>
                        <div className={styles.stageNumber}>{stage.stage}</div>
                        <div className={styles.stageInfo}>
                          <strong>{stage.approver}</strong>
                          <span>{stage.timeLimit} days</span>
                          {stage.description && <p>{stage.description}</p>}
                        </div>
                        {index < workflow.stages.length - 1 && (
                          <ArrowRight size={16} className={styles.stageArrow} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.requiredDocs}>
                <h4>Required Documents ({workflow.requiredDocs.length})</h4>
                <div className={styles.docGrid}>
                  {workflow.requiredDocs.map(doc => (
                    <span key={doc} className={styles.docTag}>
                      <FileText size={12} />
                      {doc.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Rejection Templates */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <h3>Rejection Reason Templates</h3>
            <button 
              className={styles.secondaryButton}
              onClick={() => setShowTemplateModal(true)}
            >
              <Plus size={16} />
              Add Template
            </button>
          </div>
          
          <div className={styles.templateList}>
            {rejectionTemplates.map(template => (
              <div key={template.id} className={styles.templateItem}>
                <div className={styles.templateContent}>
                  <h4>{template.title}</h4>
                  <p>{template.content}</p>
                </div>
                <div className={styles.templateActions}>
                  <button className={styles.actionBtn}>
                    <Edit size={14} />
                  </button>
                  <button 
                    className={styles.actionBtn}
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Workflow Modal */}
      {showAddModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Add New Workflow</h3>
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
                  <label>Application Type *</label>
                  <select
                    value={newWorkflow.applicationType}
                    onChange={(e) => setNewWorkflow({...newWorkflow, applicationType: e.target.value})}
                    className={styles.formSelect}
                  >
                    <option value="">Select application type</option>
                    {applicationTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Display Name *</label>
                  <input
                    type="text"
                    value={newWorkflow.displayName}
                    onChange={(e) => setNewWorkflow({...newWorkflow, displayName: e.target.value})}
                    className={styles.formInput}
                    placeholder="Enter display name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Workflow Type</label>
                  <select
                    value={newWorkflow.workflow}
                    onChange={(e) => setNewWorkflow({...newWorkflow, workflow: e.target.value})}
                    className={styles.formSelect}
                  >
                    {workflowTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {newWorkflow.workflow !== "auto_approve" && (
                <div className={styles.stagesSection}>
                  <h4>Approval Stages</h4>
                  {newWorkflow.stages.map((stage, index) => (
                    <div key={index} className={styles.stageForm}>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label>Approver</label>
                          <input
                            type="text"
                            value={stage.approver}
                            onChange={(e) => {
                              const updatedStages = [...newWorkflow.stages]
                              updatedStages[index].approver = e.target.value
                              setNewWorkflow({...newWorkflow, stages: updatedStages})
                            }}
                            className={styles.formInput}
                            placeholder="Enter approver name/role"
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Time Limit (days)</label>
                          <input
                            type="number"
                            value={stage.timeLimit}
                            onChange={(e) => {
                              const updatedStages = [...newWorkflow.stages]
                              updatedStages[index].timeLimit = parseInt(e.target.value)
                              setNewWorkflow({...newWorkflow, stages: updatedStages})
                            }}
                            className={styles.formInput}
                            min="1"
                          />
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Description</label>
                        <input
                          type="text"
                          value={stage.description}
                          onChange={(e) => {
                            const updatedStages = [...newWorkflow.stages]
                            updatedStages[index].description = e.target.value
                            setNewWorkflow({...newWorkflow, stages: updatedStages})
                          }}
                          className={styles.formInput}
                          placeholder="Describe this approval stage"
                        />
                      </div>
                      {newWorkflow.stages.length > 1 && (
                        <button
                          type="button"
                          className={styles.removeStageBtn}
                          onClick={() => setNewWorkflow(removeStage(newWorkflow, index))}
                        >
                          <X size={14} />
                          Remove Stage
                        </button>
                      )}
                    </div>
                  ))}
                  {newWorkflow.workflow === "multi_stage" && (
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => setNewWorkflow(addStage(newWorkflow))}
                    >
                      <Plus size={14} />
                      Add Stage
                    </button>
                  )}
                </div>
              )}

              <div className={styles.documentsSection}>
                <h4>Required Documents</h4>
                <div className={styles.documentCheckboxes}>
                  {documentTypes.map(docType => (
                    <label key={docType} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={newWorkflow.requiredDocs.includes(docType)}
                        onChange={() => setNewWorkflow(handleDocumentToggle(newWorkflow, docType))}
                      />
                      {docType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                  ))}
                </div>
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
                onClick={handleAddWorkflow}
              >
                <Save size={16} />
                Create Workflow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Template Modal */}
      {showTemplateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Add Rejection Template</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowTemplateModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Template Title *</label>
                <input
                  type="text"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})}
                  className={styles.formInput}
                  placeholder="Enter template title"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Template Content *</label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                  className={styles.formTextarea}
                  rows={4}
                  placeholder="Enter rejection message template"
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.secondaryButton}
                onClick={() => setShowTemplateModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.primaryButton}
                onClick={handleAddTemplate}
              >
                <Save size={16} />
                Add Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApprovalWorkflows