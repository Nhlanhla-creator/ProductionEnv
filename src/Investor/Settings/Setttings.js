"use client"

import { useState } from "react"

const InvestorSettings = () => {
  const [activeTab, setActiveTab] = useState("Account")
  const [showDeleteRolePopup, setShowDeleteRolePopup] = useState(false)
  const [showDeleteAccountPopup, setShowDeleteAccountPopup] = useState(false)
  const [roles, setRoles] = useState([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  const [formData, setFormData] = useState({
    account: {
      email: "investor@example.com",
      password: "••••••••••",
      name: "John Doe",
      phone: "+27 12 345 6789",
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      matchAlerts: true,
      messageAlerts: true,
      documentAlerts: true,
      newsletterSubscription: true,
    },
    privacy: {
      profileVisibility: "public",
      contactInfoVisibility: "matches",
      experienceVisibility: "public",
      allowDataSharing: true,
    },
    preferences: {
      language: "english",
      timezone: "Africa/Johannesburg",
      currency: "ZAR",
      theme: "light",
    },
  })

  const colors = {
    lightBrown: "#f5f0e1",
    mediumBrown: "#e6d7c3",
    accentBrown: "#c8b6a6",
    primaryBrown: "#a67c52",
    darkBrown: "#7d5a50",
    textBrown: "#4a352f",
    backgroundBrown: "#faf7f2",
    paleBrown: "#f0e6d9",
  }

  const handleInputChange = (section, field, value) => {
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [field]: value,
      },
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    alert("Settings saved successfully!")
  }

  const handleDeleteRole = async () => {
    setLoadingRoles(true)
    try {
      // Simulate fetching roles - replace with actual Firebase call
      setTimeout(() => {
        setRoles(["Lead Investor", "Angel Investor", "Venture Partner"])
        setLoadingRoles(false)
        setShowDeleteRolePopup(true)
      }, 1000)
    } catch (error) {
      console.error("Error fetching roles:", error)
      setLoadingRoles(false)
    }
  }

  const handleDeleteAccount = () => {
    setShowDeleteAccountPopup(true)
  }

  const confirmDeleteRole = (role) => {
    console.log("Deleting role:", role)
    setShowDeleteRolePopup(false)
    // Add actual role deletion logic here
  }

  const confirmDeleteAccount = () => {
    console.log("Deleting account")
    setShowDeleteAccountPopup(false)
    // Add actual account deletion logic here
  }

  return (
    <div
      style={{
        backgroundColor: "white",
        minHeight: "100vh",
        marginLeft: "240px", // Account for sidebar
        padding: "32px 48px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "600",
            color: colors.textBrown,
            margin: "0",
             marginTop: "5rem",
          }}
        >
          Settings
        </h1>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "40px",
        }}
      >
        <div style={{ display: "flex", gap: "32px" }}>
          {["Account", "Notifications", "Security", "Appearance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 0",
                backgroundColor: "transparent",
                border: "none",
                borderBottom: activeTab === tab ? `2px solid ${colors.primaryBrown}` : "2px solid transparent",
                color: activeTab === tab ? colors.primaryBrown : "#6b7280",
                fontSize: "16px",
                fontWeight: activeTab === tab ? "600" : "400",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === "Account" && (
          <div>
            <div style={{ marginBottom: "32px" }}>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: colors.textBrown,
                  margin: "0 0 8px 0",
                }}
              >
                Account Information
              </h2>
              <p
                style={{
                  color: colors.textBrown,
                  opacity: 0.7,
                  margin: "0 0 24px 0",
                  fontSize: "14px",
                }}
              >
                Update your basic account information
              </p>

              <div style={{ display: "grid", gap: "20px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: colors.textBrown,
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.account.email}
                    onChange={(e) => handleInputChange("account", "email", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${colors.mediumBrown}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: colors.textBrown,
                      backgroundColor: colors.backgroundBrown,
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: colors.textBrown,
                    }}
                  >
                    Password
                  </label>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <input
                      type="password"
                      value={formData.account.password}
                      onChange={(e) => handleInputChange("account", "password", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: `1px solid ${colors.mediumBrown}`,
                        borderRadius: "8px",
                        fontSize: "14px",
                        color: colors.textBrown,
                        backgroundColor: colors.backgroundBrown,
                        transition: "all 0.2s ease",
                        outline: "none",
                        flex: 1,
                      }}
                    />
                    <button
                      style={{
                        padding: "12px 24px",
                        backgroundColor: colors.accentBrown,
                        color: colors.textBrown,
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                      }}
                    >
                      Change Password
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: colors.textBrown,
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.account.name}
                    onChange={(e) => handleInputChange("account", "name", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${colors.mediumBrown}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: colors.textBrown,
                      backgroundColor: colors.backgroundBrown,
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: colors.textBrown,
                    }}
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.account.phone}
                    onChange={(e) => handleInputChange("account", "phone", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${colors.mediumBrown}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: colors.textBrown,
                      backgroundColor: colors.backgroundBrown,
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div style={{ marginTop: "48px" }}>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#dc3545",
                  margin: "0 0 16px 0",
                }}
              >
                Danger Zone
              </h3>
              <div
                style={{
                  backgroundColor: "#fefefe",
                  border: "1px solid #f3f4f6",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <div style={{ marginBottom: "20px" }}>
                  <h4
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: colors.textBrown,
                      margin: "0 0 8px 0",
                    }}
                  >
                    Delete Role
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      margin: "0 0 16px 0",
                      lineHeight: "1.5",
                    }}
                  >
                    Permanently remove one of your investor roles. This action cannot be undone.
                  </p>
                  <button
                    onClick={handleDeleteRole}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "white",
                      color: "#dc3545",
                      border: "1px solid #dc3545",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = "#dc3545"
                      e.target.style.color = "white"
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = "white"
                      e.target.style.color = "#dc3545"
                    }}
                  >
                    Delete Role
                  </button>
                </div>

                <div>
                  <h4
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: colors.textBrown,
                      margin: "0 0 8px 0",
                    }}
                  >
                    Delete Account
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      margin: "0 0 16px 0",
                      lineHeight: "1.5",
                    }}
                  >
                    Permanently delete your investor account and all associated data. This action cannot be undone.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "white",
                      color: "#dc3545",
                      border: "1px solid #dc3545",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = "#dc3545"
                      e.target.style.color = "white"
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = "white"
                      e.target.style.color = "#dc3545"
                    }}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>

            {/* Save Changes Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
              <button
                style={{
                  padding: "12px 24px",
                  backgroundColor: colors.primaryBrown,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={handleSubmit}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === "Notifications" && (
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: colors.textBrown,
                margin: "0 0 8px 0",
              }}
            >
              Notification Settings
            </h2>
            <p
              style={{
                color: colors.textBrown,
                opacity: 0.7,
                margin: "0 0 32px 0",
                fontSize: "14px",
              }}
            >
              Control how and when you receive notifications
            </p>

            <div style={{ display: "grid", gap: "24px" }}>
              {Object.entries(formData.notifications).map(([key, value]) => {
                const labels = {
                  emailNotifications: { title: "Email Notifications", desc: "Receive notifications via email" },
                  smsNotifications: { title: "SMS Notifications", desc: "Receive notifications via SMS" },
                  matchAlerts: { title: "Investment Alerts", desc: "Get notified about new investment opportunities" },
                  messageAlerts: { title: "Message Alerts", desc: "Get notified when you receive new messages" },
                  documentAlerts: {
                    title: "Document Alerts",
                    desc: "Get notified about document updates and requirements",
                  },
                  newsletterSubscription: {
                    title: "Newsletter Subscription",
                    desc: "Receive our monthly newsletter with updates and insights",
                  },
                }

                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "20px",
                      backgroundColor: "white",
                      borderRadius: "8px",
                      border: `1px solid ${colors.lightBrown}`,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: colors.textBrown,
                          margin: "0 0 4px 0",
                        }}
                      >
                        {labels[key].title}
                      </h3>
                      <p
                        style={{
                          fontSize: "13px",
                          color: colors.textBrown,
                          opacity: 0.7,
                          margin: "0",
                        }}
                      >
                        {labels[key].desc}
                      </p>
                    </div>
                    <label
                      style={{
                        position: "relative",
                        display: "inline-block",
                        width: "44px",
                        height: "24px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleInputChange("notifications", key, e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          cursor: "pointer",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: value ? colors.primaryBrown : colors.mediumBrown,
                          transition: "0.2s",
                          borderRadius: "24px",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            content: "",
                            height: "18px",
                            width: "18px",
                            left: value ? "23px" : "3px",
                            bottom: "3px",
                            backgroundColor: "white",
                            transition: "0.2s",
                            borderRadius: "50%",
                          }}
                        />
                      </span>
                    </label>
                  </div>
                )
              })}
            </div>

            {/* Save Changes Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
              <button
                style={{
                  padding: "12px 24px",
                  backgroundColor: colors.primaryBrown,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={handleSubmit}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === "Security" && (
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: colors.textBrown,
                margin: "0 0 8px 0",
              }}
            >
              Privacy & Visibility
            </h2>
            <p
              style={{
                color: colors.textBrown,
                opacity: 0.7,
                margin: "0 0 32px 0",
                fontSize: "14px",
              }}
            >
              Control who can see your profile information
            </p>

            <div style={{ display: "grid", gap: "24px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: colors.textBrown,
                  }}
                >
                  Profile Visibility
                </label>
                <select
                  value={formData.privacy.profileVisibility}
                  onChange={(e) => handleInputChange("privacy", "profileVisibility", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${colors.mediumBrown}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: colors.textBrown,
                    backgroundColor: colors.backgroundBrown,
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                >
                  <option value="public">Public - Visible to all users</option>
                  <option value="matches">Matches Only - Visible to matched SMEs</option>
                  <option value="private">Private - Limited visibility</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: colors.textBrown,
                  }}
                >
                  Contact Information Visibility
                </label>
                <select
                  value={formData.privacy.contactInfoVisibility}
                  onChange={(e) => handleInputChange("privacy", "contactInfoVisibility", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${colors.mediumBrown}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: colors.textBrown,
                    backgroundColor: colors.backgroundBrown,
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                >
                  <option value="public">Public - Visible to all users</option>
                  <option value="matches">Matches Only - Visible to matched SMEs</option>
                  <option value="private">Private - Not visible to others</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: colors.textBrown,
                  }}
                >
                  Experience & Expertise Visibility
                </label>
                <select
                  value={formData.privacy.experienceVisibility}
                  onChange={(e) => handleInputChange("privacy", "experienceVisibility", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${colors.mediumBrown}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: colors.textBrown,
                    backgroundColor: colors.backgroundBrown,
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                >
                  <option value="public">Public - Visible to all users</option>
                  <option value="matches">Matches Only - Visible to matched SMEs</option>
                  <option value="private">Private - Limited visibility</option>
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: `1px solid ${colors.lightBrown}`,
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: colors.textBrown,
                      margin: "0 0 4px 0",
                    }}
                  >
                    Data Sharing for Matching
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: colors.textBrown,
                      opacity: 0.7,
                      margin: "0",
                    }}
                  >
                    Allow your profile data to be used for improved matching algorithms
                  </p>
                </div>
                <label
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "44px",
                    height: "24px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.privacy.allowDataSharing}
                    onChange={(e) => handleInputChange("privacy", "allowDataSharing", e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      cursor: "pointer",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: formData.privacy.allowDataSharing ? colors.primaryBrown : colors.mediumBrown,
                      transition: "0.2s",
                      borderRadius: "24px",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        content: "",
                        height: "18px",
                        width: "18px",
                        left: formData.privacy.allowDataSharing ? "23px" : "3px",
                        bottom: "3px",
                        backgroundColor: "white",
                        transition: "0.2s",
                        borderRadius: "50%",
                      }}
                    />
                  </span>
                </label>
              </div>
            </div>

            {/* Save Changes Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
              <button
                style={{
                  padding: "12px 24px",
                  backgroundColor: colors.primaryBrown,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={handleSubmit}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === "Appearance" && (
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: colors.textBrown,
                margin: "0 0 8px 0",
              }}
            >
              Preferences
            </h2>
            <p
              style={{
                color: colors.textBrown,
                opacity: 0.7,
                margin: "0 0 32px 0",
                fontSize: "14px",
              }}
            >
              Customize your experience
            </p>

            <div style={{ display: "grid", gap: "24px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: colors.textBrown,
                  }}
                >
                  Language
                </label>
                <div
                  style={{
                    padding: "12px 16px",
                    border: `1px solid ${colors.mediumBrown}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: colors.textBrown,
                    backgroundColor: colors.backgroundBrown,
                  }}
                >
                  English
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: colors.textBrown,
                  }}
                >
                  Timezone
                </label>
                <select
                  value={formData.preferences.timezone}
                  onChange={(e) => handleInputChange("preferences", "timezone", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${colors.mediumBrown}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: colors.textBrown,
                    backgroundColor: colors.backgroundBrown,
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                >
                  <option value="Africa/Johannesburg">Africa/Johannesburg (GMT+2)</option>
                  <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                  <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
                  <option value="Africa/Casablanca">Africa/Casablanca (GMT+1)</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: colors.textBrown,
                  }}
                >
                  Preferred Currency
                </label>
                <select
                  value={formData.preferences.currency}
                  onChange={(e) => handleInputChange("preferences", "currency", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${colors.mediumBrown}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: colors.textBrown,
                    backgroundColor: colors.backgroundBrown,
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                >
                  <option value="ZAR">South African Rand (ZAR)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                  <option value="NGN">Nigerian Naira (NGN)</option>
                  <option value="KES">Kenyan Shilling (KES)</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: colors.textBrown,
                  }}
                >
                  Theme
                </label>
                <select
                  value={formData.preferences.theme}
                  onChange={(e) => handleInputChange("preferences", "theme", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${colors.mediumBrown}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: colors.textBrown,
                    backgroundColor: colors.backgroundBrown,
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
            </div>

            {/* Save Changes Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
              <button
                style={{
                  padding: "12px 24px",
                  backgroundColor: colors.primaryBrown,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={handleSubmit}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Role Popup */}
      {showDeleteRolePopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#dc3545",
                margin: "0 0 16px 0",
              }}
            >
              Delete Role
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: colors.textBrown,
                margin: "0 0 20px 0",
              }}
            >
              Select a role to delete. This action cannot be undone.
            </p>
            <div style={{ marginBottom: "20px" }}>
              {roles.map((role, index) => (
                <button
                  key={index}
                  onClick={() => confirmDeleteRole(role)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px 16px",
                    marginBottom: "8px",
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    color: colors.textBrown,
                    cursor: "pointer",
                    fontSize: "14px",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = "#f9fafb"
                    e.target.style.borderColor = colors.primaryBrown
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = "white"
                    e.target.style.borderColor = "#e5e7eb"
                  }}
                >
                  Delete "{role}" role
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteRolePopup(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: colors.mediumBrown,
                  color: colors.textBrown,
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Popup */}
      {showDeleteAccountPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#dc3545",
                margin: "0 0 16px 0",
              }}
            >
              Delete Account
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: colors.textBrown,
                margin: "0 0 20px 0",
              }}
            >
              Are you sure you want to delete your account? This action cannot be undone and will permanently remove all
              your data.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteAccountPopup(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: colors.mediumBrown,
                  color: colors.textBrown,
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvestorSettings
