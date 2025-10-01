"use client"
import { useState, useEffect } from "react"
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Check,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  RefreshCw,
  DollarSign,
} from "lucide-react"
import styles from "./admin-settings.module.css"

function PaymentGatewaySettings() {
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState({})
  const [showAddPlanModal, setShowAddPlanModal] = useState(false)
  const [showEditPlanModal, setShowEditPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [testMode, setTestMode] = useState(true)

  const [paymentSettings, setPaymentSettings] = useState({
    processor: "stripe",
    currency: "ZAR",
    testMode: true,
    webhookUrl: "https://platform.co.za/webhooks/stripe",
    apiKeys: {
      test: {
        publishable: "pk_test_51HdS...",
        secret: "sk_test_51HdS...",
      },
      live: {
        publishable: "pk_live_51HdS...",
        secret: "sk_live_51HdS...",
      }
    },
    plans: [
      { 
        id: 1, 
        name: "Basic Plan", 
        price: 500, 
        interval: "monthly", 
        features: ["Access to platform", "Basic support", "Up to 5 applications"],
        isActive: true,
        stripeId: "price_basic_monthly"
      },
      { 
        id: 2, 
        name: "Premium Plan", 
        price: 1200, 
        interval: "monthly", 
        features: ["Everything in Basic", "Priority support", "Unlimited applications", "Analytics dashboard"],
        isActive: true,
        stripeId: "price_premium_monthly"
      },
      { 
        id: 3, 
        name: "Enterprise Plan", 
        price: 2500, 
        interval: "monthly", 
        features: ["Everything in Premium", "Custom integrations", "Dedicated support", "Custom branding"],
        isActive: true,
        stripeId: "price_enterprise_monthly"
      },
    ],
    invoiceSettings: {
      companyName: "Innovation Platform (Pty) Ltd",
      address: "123 Business Street\nCape Town, 8001\nSouth Africa",
      taxNumber: "9876543210",
      email: "billing@platform.co.za",
      phone: "+27 21 123 4567",
      footer: "Thank you for your business!",
    },
    reminderSchedule: {
      first: 3, // days before due date
      second: 1, // days before due date
      overdue: 7, // days after due date
    }
  })

  const [connectionStatus, setConnectionStatus] = useState({
    stripe: { connected: true, lastSync: "2024-06-25 08:30" },
    paypal: { connected: false, lastSync: null },
    payfast: { connected: false, lastSync: null },
  })

  const [newPlan, setNewPlan] = useState({
    name: "",
    price: "",
    interval: "monthly",
    features: [],
    newFeature: "",
  })

  const processors = [
    { value: "stripe", label: "Stripe", supported: true },
    { value: "paypal", label: "PayPal", supported: true },
    { value: "payfast", label: "PayFast", supported: true },
    { value: "paystack", label: "Paystack", supported: false },
  ]

  const currencies = [
    { value: "ZAR", label: "South African Rand (ZAR)", symbol: "R" },
    { value: "USD", label: "US Dollar (USD)", symbol: "$" },
    { value: "EUR", label: "Euro (EUR)", symbol: "€" },
    { value: "GBP", label: "British Pound (GBP)", symbol: "£" },
  ]

  const intervals = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "annually", label: "Annually" },
  ]

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const togglePassword = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleProcessorChange = (processor) => {
    setPaymentSettings({
      ...paymentSettings,
      processor
    })
  }

  const handleTestConnection = async (processor) => {
    // Simulate connection test
    alert(`Testing connection to ${processor}...`)
    setTimeout(() => {
      setConnectionStatus({
        ...connectionStatus,
        [processor]: {
          connected: true,
          lastSync: new Date().toLocaleString()
        }
      })
      alert(`Successfully connected to ${processor}!`)
    }, 2000)
  }

  const handleSaveApiKeys = () => {
    alert("API keys saved successfully!")
  }

  const handleAddPlan = () => {
    if (!newPlan.name || !newPlan.price) {
      alert("Please fill in all required fields")
      return
    }

    const plan = {
      id: Math.max(...paymentSettings.plans.map(p => p.id)) + 1,
      name: newPlan.name,
      price: parseFloat(newPlan.price),
      interval: newPlan.interval,
      features: newPlan.features,
      isActive: true,
      stripeId: `price_${newPlan.name.toLowerCase().replace(/\s+/g, '_')}_${newPlan.interval}`
    }

    setPaymentSettings({
      ...paymentSettings,
      plans: [...paymentSettings.plans, plan]
    })

    setNewPlan({
      name: "",
      price: "",
      interval: "monthly",
      features: [],
      newFeature: "",
    })
    setShowAddPlanModal(false)
  }

  const handleEditPlan = (plan) => {
    setEditingPlan({ ...plan, newFeature: "" })
    setShowEditPlanModal(true)
  }

  const handleUpdatePlan = () => {
    setPaymentSettings({
      ...paymentSettings,
      plans: paymentSettings.plans.map(plan => 
        plan.id === editingPlan.id ? editingPlan : plan
      )
    })
    setShowEditPlanModal(false)
    setEditingPlan(null)
  }

  const handleDeletePlan = (planId) => {
    if (window.confirm("Are you sure you want to delete this plan?")) {
      setPaymentSettings({
        ...paymentSettings,
        plans: paymentSettings.plans.filter(plan => plan.id !== planId)
      })
    }
  }

  const handleTogglePlan = (planId) => {
    setPaymentSettings({
      ...paymentSettings,
      plans: paymentSettings.plans.map(plan =>
        plan.id === planId 
          ? { ...plan, isActive: !plan.isActive }
          : plan
      )
    })
  }

  const addFeature = (planObj, setPlanObj, featureField = "newFeature") => {
    if (!planObj[featureField].trim()) return
    
    setPlanObj({
      ...planObj,
      features: [...planObj.features, planObj[featureField].trim()],
      [featureField]: ""
    })
  }

  const removeFeature = (planObj, setPlanObj, index) => {
    setPlanObj({
      ...planObj,
      features: planObj.features.filter((_, i) => i !== index)
    })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  const getCurrentCurrencySymbol = () => {
    const currency = currencies.find(c => c.value === paymentSettings.currency)
    return currency ? currency.symbol : "R"
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Payment Gateway Settings...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Payment Gateway Settings</h1>
          <p className={styles.subtitle}>Configure payment processors, plans, and billing settings</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.statusIndicator}>
            <CheckCircle size={16} className={styles.successIcon} />
            <span>Connected to {paymentSettings.processor}</span>
          </div>
        </div>
      </div>

      <div className={styles.settingsContent}>
        {/* Payment Processor Configuration */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <h3>Payment Processor Configuration</h3>
            <div className={styles.testModeToggle}>
              <label className={styles.toggleLabel}>
                <input 
                  type="checkbox" 
                  checked={testMode}
                  onChange={(e) => setTestMode(e.target.checked)}
                />
                <span className={styles.toggleSlider}></span>
                Test Mode
              </label>
            </div>
          </div>

          <div className={styles.processorGrid}>
            {processors.map(processor => (
              <div 
                key={processor.value} 
                className={`${styles.processorCard} ${paymentSettings.processor === processor.value ? styles.selected : ''} ${!processor.supported ? styles.disabled : ''}`}
                onClick={() => processor.supported && handleProcessorChange(processor.value)}
              >
                <div className={styles.processorHeader}>
                  <h4>{processor.label}</h4>
                  {!processor.supported && <span className={styles.comingSoon}>Coming Soon</span>}
                  {connectionStatus[processor.value]?.connected && (
                    <CheckCircle size={16} className={styles.successIcon} />
                  )}
                </div>
                {processor.supported && (
                  <div className={styles.processorActions}>
                    <button 
                      className={styles.secondaryButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTestConnection(processor.value)
                      }}
                    >
                      <RefreshCw size={14} />
                      Test Connection
                    </button>
                    {connectionStatus[processor.value]?.lastSync && (
                      <span className={styles.lastSync}>
                        Last sync: {connectionStatus[processor.value].lastSync}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Currency</label>
              <select 
                value={paymentSettings.currency} 
                onChange={(e) => setPaymentSettings({...paymentSettings, currency: e.target.value})}
                className={styles.formSelect}
              >
                {currencies.map(currency => (
                  <option key={currency.value} value={currency.value}>{currency.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Webhook URL</label>
              <div className={styles.webhookInput}>
                <input 
                  type="text"
                  value={paymentSettings.webhookUrl}
                  onChange={(e) => setPaymentSettings({...paymentSettings, webhookUrl: e.target.value})}
                  className={styles.formInput}
                />
                <button 
                  className={styles.actionBtn}
                  onClick={() => copyToClipboard(paymentSettings.webhookUrl)}
                  title="Copy URL"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* API Keys Section */}
          <div className={styles.apiKeysSection}>
            <h4>{testMode ? 'Test' : 'Live'} API Keys</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Publishable Key</label>
                <div className={styles.passwordInput}>
                  <input 
                    type={showPassword.publishable ? "text" : "password"}
                    value={testMode ? paymentSettings.apiKeys.test.publishable : paymentSettings.apiKeys.live.publishable}
                    className={styles.formInput}
                    onChange={(e) => {
                      const mode = testMode ? 'test' : 'live'
                      setPaymentSettings({
                        ...paymentSettings,
                        apiKeys: {
                          ...paymentSettings.apiKeys,
                          [mode]: {
                            ...paymentSettings.apiKeys[mode],
                            publishable: e.target.value
                          }
                        }
                      })
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => togglePassword('publishable')}
                    className={styles.passwordToggle}
                  >
                    {showPassword.publishable ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Secret Key</label>
                <div className={styles.passwordInput}>
                  <input 
                    type={showPassword.secret ? "text" : "password"}
                    value={testMode ? paymentSettings.apiKeys.test.secret : paymentSettings.apiKeys.live.secret}
                    className={styles.formInput}
                    onChange={(e) => {
                      const mode = testMode ? 'test' : 'live'
                      setPaymentSettings({
                        ...paymentSettings,
                        apiKeys: {
                          ...paymentSettings.apiKeys,
                          [mode]: {
                            ...paymentSettings.apiKeys[mode],
                            secret: e.target.value
                          }
                        }
                      })
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => togglePassword('secret')}
                    className={styles.passwordToggle}
                  >
                    {showPassword.secret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <button className={styles.primaryButton} onClick={handleSaveApiKeys}>
              <Save size={16} />
              Save API Keys
            </button>
          </div>
        </div>

        {/* Payment Plans */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <h3>Payment Plans</h3>
            <button 
              className={styles.primaryButton}
              onClick={() => setShowAddPlanModal(true)}
            >
              <Plus size={16} />
              Add Plan
            </button>
          </div>
          
          <div className={styles.plansGrid}>
            {paymentSettings.plans.map(plan => (
              <div key={plan.id} className={`${styles.planCard} ${!plan.isActive ? styles.inactive : ''}`}>
                <div className={styles.planHeader}>
                  <h4>{plan.name}</h4>
                  <div className={styles.planActions}>
                    <button
                      className={`${styles.toggleBtn} ${plan.isActive ? styles.active : styles.inactive}`}
                      onClick={() => handleTogglePlan(plan.id)}
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button 
                      className={styles.actionBtn}
                      onClick={() => handleEditPlan(plan)}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className={styles.actionBtn}
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className={styles.planPrice}>
                  <span className={styles.currency}>{getCurrentCurrencySymbol()}</span>
                  <span className={styles.amount}>{plan.price}</span>
                  <span className={styles.interval}>/{plan.interval}</span>
                </div>
                <div className={styles.planFeatures}>
                  {plan.features.map((feature, index) => (
                    <div key={index} className={styles.feature}>
                      <Check size={14} className={styles.checkIcon} />
                      {feature}
                    </div>
                  ))}
                </div>
                <div className={styles.planMeta}>
                  <span className={styles.stripeId}>ID: {plan.stripeId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Settings */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <h3>Invoice Settings</h3>
            <button className={styles.secondaryButton}>
              <Eye size={16} />
              Preview Invoice
            </button>
          </div>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Company Name</label>
              <input 
                type="text" 
                value={paymentSettings.invoiceSettings.companyName}
                onChange={(e) => setPaymentSettings({
                  ...paymentSettings,
                  invoiceSettings: {
                    ...paymentSettings.invoiceSettings,
                    companyName: e.target.value
                  }
                })}
                className={styles.formInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Tax Number</label>
              <input 
                type="text" 
                value={paymentSettings.invoiceSettings.taxNumber}
                onChange={(e) => setPaymentSettings({
                  ...paymentSettings,
                  invoiceSettings: {
                    ...paymentSettings.invoiceSettings,
                    taxNumber: e.target.value
                  }
                })}
                className={styles.formInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Billing Email</label>
              <input 
                type="email" 
                value={paymentSettings.invoiceSettings.email}
                onChange={(e) => setPaymentSettings({
                  ...paymentSettings,
                  invoiceSettings: {
                    ...paymentSettings.invoiceSettings,
                    email: e.target.value
                  }
                })}
                className={styles.formInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Phone Number</label>
              <input 
                type="tel" 
                value={paymentSettings.invoiceSettings.phone}
                onChange={(e) => setPaymentSettings({
                  ...paymentSettings,
                  invoiceSettings: {
                    ...paymentSettings.invoiceSettings,
                    phone: e.target.value
                  }
                })}
                className={styles.formInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Company Address</label>
              <textarea 
                value={paymentSettings.invoiceSettings.address}
                onChange={(e) => setPaymentSettings({
                  ...paymentSettings,
                  invoiceSettings: {
                    ...paymentSettings.invoiceSettings,
                    address: e.target.value
                  }
                })}
                className={styles.formTextarea}
                rows={3}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Invoice Footer</label>
              <textarea 
                value={paymentSettings.invoiceSettings.footer}
                onChange={(e) => setPaymentSettings({
                  ...paymentSettings,
                  invoiceSettings: {
                    ...paymentSettings.invoiceSettings,
                    footer: e.target.value
                  }
                })}
                className={styles.formTextarea}
                rows={2}
                placeholder="Thank you message or additional notes"
              />
            </div>
          </div>
        </div>

        {/* Payment Reminders */}
        <div className={styles.settingsCard}>
          <h3>Payment Reminder Schedule</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>First Reminder (days before due)</label>
              <input 
                type="number" 
                value={paymentSettings.reminderSchedule.first}
                onChange={(e) => setPaymentSettings({
                  ...paymentSettings,
                  reminderSchedule: {
                    ...paymentSettings.reminderSchedule,
                    first: parseInt(e.target.value)
                  }
                })}
                className={styles.formInput}
                min="1"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Final Reminder (days before due)</label>
              <input 
                type="number" 
                value={paymentSettings.reminderSchedule.second}
                onChange={(e) => setPaymentSettings({
                  ...paymentSettings,
                  reminderSchedule: {
                    ...paymentSettings.reminderSchedule,
                    second: parseInt(e.target.value)
                  }
                })}
                className={styles.formInput}
                min="1"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Overdue Notice (days after due)</label>
              <input 
                type="number" 
                value={paymentSettings.reminderSchedule.overdue}
                onChange={(e) => setPaymentSettings({
                  ...paymentSettings,
                  reminderSchedule: {
                    ...paymentSettings.reminderSchedule,
                    overdue: parseInt(e.target.value)
                  }
                })}
                className={styles.formInput}
                min="1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Plan Modal */}
      {showAddPlanModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Add New Payment Plan</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowAddPlanModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Plan Name *</label>
                  <input
                    type="text"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                    className={styles.formInput}
                    placeholder="e.g., Professional Plan"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Price *</label>
                  <input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({...newPlan, price: e.target.value})}
                    className={styles.formInput}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Billing Interval</label>
                  <select
                    value={newPlan.interval}
                    onChange={(e) => setNewPlan({...newPlan, interval: e.target.value})}
                    className={styles.formSelect}
                  >
                    {intervals.map(interval => (
                      <option key={interval.value} value={interval.value}>{interval.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.featuresSection}>
                <label>Plan Features</label>
                <div className={styles.featureInput}>
                  <input
                    type="text"
                    value={newPlan.newFeature}
                    onChange={(e) => setNewPlan({...newPlan, newFeature: e.target.value})}
                    className={styles.formInput}
                    placeholder="Enter a feature"
                    onKeyPress={(e) => e.key === 'Enter' && addFeature(newPlan, setNewPlan)}
                  />
                  <button 
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => addFeature(newPlan, setNewPlan)}
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
                <div className={styles.featuresList}>
                  {newPlan.features.map((feature, index) => (
                    <div key={index} className={styles.featureItem}>
                      <Check size={14} className={styles.checkIcon} />
                      <span>{feature}</span>
                      <button 
                        type="button"
                        className={styles.removeFeatureBtn}
                        onClick={() => removeFeature(newPlan, setNewPlan, index)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.secondaryButton}
                onClick={() => setShowAddPlanModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.primaryButton}
                onClick={handleAddPlan}
              >
                <Save size={16} />
                Create Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentGatewaySettings