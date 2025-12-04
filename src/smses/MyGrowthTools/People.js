"use client"

import { useState, useEffect } from "react"
import { Bar, Pie, Line, Doughnut } from "react-chartjs-2"
import Sidebar from "smses/Sidebar/Sidebar"
import Header from "../DashboardHeader/DashboardHeader"
import { db, auth } from "../../firebaseConfig"
import { collection, addDoc, getDocs, updateDoc, doc, query, where } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend)

// Enhanced Dark Brown Color Palette with better contrast
const DARK_BROWN_COLORS = {
  primary: "#3E2723", // Very dark brown
  secondary: "#5D4037", // Dark brown
  tertiary: "#6D4C41", // Medium dark brown
  accent1: "#795548", // Brown
  accent2: "#8D6E63", // Light brown
  accent3: "#A1887F", // Lighter brown
  accent4: "#BCAAA4", // Very light brown
  accent5: "#D7CCC8", // Extra light brown
  complement1: "#D84315", // Dark orange-red
  complement2: "#FF5722", // Orange-red
  complement3: "#FF7043", // Light orange-red
  complement4: "#FF8A65", // Very light orange-red
  success: "#2E7D32", // Dark green
  warning: "#F57C00", // Dark orange
  error: "#C62828", // Dark red
}

// Data Entry Modal Component
const DataEntryModal = ({ isOpen, onClose, section, onSave, currentData }) => {
  const [formData, setFormData] = useState({})

  useEffect(() => {
    if (currentData) {
      setFormData(currentData)
    }
  }, [currentData])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  const renderFormFields = () => {
    switch (section) {
      case "employee-composition":
        return (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  color: DARK_BROWN_COLORS.secondary,
                  fontWeight: "bold",
                }}
              >
                Head Count:
              </label>
              <input
                type="number"
                value={formData.headCount || ""}
                onChange={(e) => setFormData({ ...formData, headCount: Number.parseInt(e.target.value) || 0 })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: `2px solid ${DARK_BROWN_COLORS.accent3}`,
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  color: DARK_BROWN_COLORS.secondary,
                  fontWeight: "bold",
                }}
              >
                Target Head Count:
              </label>
              <input
                type="number"
                value={formData.targetHeadCount || ""}
                onChange={(e) => setFormData({ ...formData, targetHeadCount: Number.parseInt(e.target.value) || 0 })}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: `2px solid ${DARK_BROWN_COLORS.accent3}`,
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: DARK_BROWN_COLORS.secondary,
                  fontWeight: "bold",
                }}
              >
                Demographics (%):
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  type="number"
                  placeholder="Female %"
                  value={formData.femalePercent || ""}
                  onChange={(e) => setFormData({ ...formData, femalePercent: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Permanent %"
                  value={formData.permanentPercent || ""}
                  onChange={(e) => setFormData({ ...formData, permanentPercent: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Local %"
                  value={formData.localPercent || ""}
                  onChange={(e) => setFormData({ ...formData, localPercent: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="African %"
                  value={formData.africanPercent || ""}
                  onChange={(e) => setFormData({ ...formData, africanPercent: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Colored %"
                  value={formData.coloredPercent || ""}
                  onChange={(e) => setFormData({ ...formData, coloredPercent: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Indian %"
                  value={formData.indianPercent || ""}
                  onChange={(e) => setFormData({ ...formData, indianPercent: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: DARK_BROWN_COLORS.secondary,
                  fontWeight: "bold",
                }}
              >
                Occupational Levels:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  type="number"
                  placeholder="Unskilled"
                  value={formData.unskilled || ""}
                  onChange={(e) => setFormData({ ...formData, unskilled: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Semi-skilled"
                  value={formData.semiSkilled || ""}
                  onChange={(e) => setFormData({ ...formData, semiSkilled: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Skilled & Jnr Mgt"
                  value={formData.skilledJnr || ""}
                  onChange={(e) => setFormData({ ...formData, skilledJnr: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Professionals & Mid Mgt"
                  value={formData.profMid || ""}
                  onChange={(e) => setFormData({ ...formData, profMid: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Snr Mgt"
                  value={formData.snrMgt || ""}
                  onChange={(e) => setFormData({ ...formData, snrMgt: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Top Mgt"
                  value={formData.topMgt || ""}
                  onChange={(e) => setFormData({ ...formData, topMgt: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: DARK_BROWN_COLORS.secondary,
                  fontWeight: "bold",
                }}
              >
                Diversity Metrics (%):
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  type="number"
                  placeholder="Female Leadership %"
                  value={formData.femaleLeadershipPercent || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, femaleLeadershipPercent: Number.parseInt(e.target.value) || 0 })
                  }
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Youth Leadership %"
                  value={formData.youthLeadershipPercent || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, youthLeadershipPercent: Number.parseInt(e.target.value) || 0 })
                  }
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="HDI Ownership %"
                  value={formData.hdiOwnershipPercent || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, hdiOwnershipPercent: Number.parseInt(e.target.value) || 0 })
                  }
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
              </div>
            </div>
          </>
        )
      case "turnover-rate":
        return (
          <>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: DARK_BROWN_COLORS.secondary,
                  fontWeight: "bold",
                }}
              >
                Select Year and Date Range:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "15px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      color: DARK_BROWN_COLORS.tertiary,
                      fontSize: "14px",
                    }}
                  >
                    Year:
                  </label>
                  <select
                    value={formData.selectedYear || new Date().getFullYear()}
                    onChange={(e) => setFormData({ ...formData, selectedYear: Number.parseInt(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: `2px solid ${DARK_BROWN_COLORS.accent3}`,
                    }}
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      color: DARK_BROWN_COLORS.tertiary,
                      fontSize: "14px",
                    }}
                  >
                    Start Month:
                  </label>
                  <select
                    value={formData.startMonth || "Jan"}
                    onChange={(e) => setFormData({ ...formData, startMonth: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: `2px solid ${DARK_BROWN_COLORS.accent3}`,
                    }}
                  >
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                      (month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      color: DARK_BROWN_COLORS.tertiary,
                      fontSize: "14px",
                    }}
                  >
                    End Month:
                  </label>
                  <select
                    value={formData.endMonth || "Dec"}
                    onChange={(e) => setFormData({ ...formData, endMonth: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: `2px solid ${DARK_BROWN_COLORS.accent3}`,
                    }}
                  >
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                      (month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: DARK_BROWN_COLORS.secondary,
                  fontWeight: "bold",
                }}
              >
                Workforce Movements ({formData.startMonth || "Jan"} - {formData.endMonth || "Dec"}{" "}
                {formData.selectedYear || new Date().getFullYear()}):
              </label>
              {(() => {
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                const startIdx = months.indexOf(formData.startMonth || "Jan")
                const endIdx = months.indexOf(formData.endMonth || "Dec")
                const selectedMonths =
                  startIdx <= endIdx
                    ? months.slice(startIdx, endIdx + 1)
                    : [...months.slice(startIdx), ...months.slice(0, endIdx + 1)]

                return selectedMonths.map((month) => (
                  <div key={month} style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "center" }}>
                    <span style={{ width: "50px", color: DARK_BROWN_COLORS.secondary, fontWeight: "bold" }}>
                      {month}:
                    </span>
                    <input
                      type="number"
                      placeholder="New Engagements"
                      value={formData[`${month.toLowerCase()}New`] || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [`${month.toLowerCase()}New`]: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      style={{
                        flex: 1,
                        padding: "6px",
                        borderRadius: "4px",
                        border: `2px solid ${DARK_BROWN_COLORS.accent3}`,
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Terminations"
                      value={formData[`${month.toLowerCase()}Term`] || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [`${month.toLowerCase()}Term`]: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      style={{
                        flex: 1,
                        padding: "6px",
                        borderRadius: "4px",
                        border: `2px solid ${DARK_BROWN_COLORS.accent3}`,
                      }}
                    />
                  </div>
                ))
              })()}
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: DARK_BROWN_COLORS.secondary,
                  fontWeight: "bold",
                }}
              >
                Reasons for Terminations (%):
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <input
                  type="number"
                  placeholder="Resigned %"
                  value={formData.resignedPercent || ""}
                  onChange={(e) => setFormData({ ...formData, resignedPercent: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Dismissed %"
                  value={formData.dismissedPercent || ""}
                  onChange={(e) => setFormData({ ...formData, dismissedPercent: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="EoC %"
                  value={formData.eocPercent || ""}
                  onChange={(e) => setFormData({ ...formData, eocPercent: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Deceased %"
                  value={formData.deceasedPercent || ""}
                  onChange={(e) => setFormData({ ...formData, deceasedPercent: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Desertion %"
                  value={formData.desertionPercent || ""}
                  onChange={(e) => setFormData({ ...formData, desertionPercent: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Retrenched %"
                  value={formData.retrenchedPercent || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, retrenchedPercent: Number.parseInt(e.target.value) || 0 })
                  }
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="VSP %"
                  value={formData.vspPercent || ""}
                  onChange={(e) => setFormData({ ...formData, vspPercent: Number.parseInt(e.target.value) || 0 })}
                  style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
              </div>
            </div>
          </>
        )
      case "employee-cost":
        return (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: DARK_BROWN_COLORS.secondary,
                  fontWeight: "bold",
                }}
              >
                Monthly Employee Cost as % of Revenue:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => (
                  <div key={month}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        color: DARK_BROWN_COLORS.tertiary,
                        fontSize: "14px",
                      }}
                    >
                      {month}:
                    </label>
                    <input
                      type="number"
                      placeholder={`${month} %`}
                      value={formData[`${month.toLowerCase()}Cost`] || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [`${month.toLowerCase()}Cost`]: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )
      case "training-spend":
        return (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: DARK_BROWN_COLORS.secondary,
                  fontWeight: "bold",
                }}
              >
                Monthly Training Spend (R):
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => (
                  <div key={month}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        color: DARK_BROWN_COLORS.tertiary,
                        fontSize: "14px",
                      }}
                    >
                      {month}:
                    </label>
                    <input
                      type="number"
                      placeholder={`${month} Amount`}
                      value={formData[`${month.toLowerCase()}Training`] || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [`${month.toLowerCase()}Training`]: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      style={{ padding: "8px", borderRadius: "4px", border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )
      case "productivity-metrics":
        return (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: DARK_BROWN_COLORS.secondary,
                  fontWeight: "bold",
                }}
              >
                Productivity Metrics:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "15px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      color: DARK_BROWN_COLORS.tertiary,
                      fontSize: "14px",
                    }}
                  >
                    Revenue per Employee (Current):
                  </label>
                  <input
                    type="number"
                    placeholder="Current Value"
                    value={formData.revenuePerEmployeeCurrent || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        revenuePerEmployeeCurrent: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: `2px solid ${DARK_BROWN_COLORS.accent3}`,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      color: DARK_BROWN_COLORS.tertiary,
                      fontSize: "14px",
                    }}
                  >
                    Revenue per Employee (Target):
                  </label>
                  <input
                    type="number"
                    placeholder="Target Value"
                    value={formData.revenuePerEmployeeTarget || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        revenuePerEmployeeTarget: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: `2px solid ${DARK_BROWN_COLORS.accent3}`,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      color: DARK_BROWN_COLORS.tertiary,
                      fontSize: "14px",
                    }}
                  >
                    Output per Employee (Current):
                  </label>
                  <input
                    type="number"
                    placeholder="Current Value"
                    value={formData.outputPerEmployeeCurrent || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        outputPerEmployeeCurrent: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: `2px solid ${DARK_BROWN_COLORS.accent3}`,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      color: DARK_BROWN_COLORS.tertiary,
                      fontSize: "14px",
                    }}
                  >
                    Output per Employee (Target):
                  </label>
                  <input
                    type="number"
                    placeholder="Target Value"
                    value={formData.outputPerEmployeeTarget || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        outputPerEmployeeTarget: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: `2px solid ${DARK_BROWN_COLORS.accent3}`,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      color: DARK_BROWN_COLORS.tertiary,
                      fontSize: "14px",
                    }}
                  >
                    Utilization Rate % (Current):
                  </label>
                  <input
                    type="number"
                    placeholder="Current %"
                    value={formData.utilizationRateCurrent || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        utilizationRateCurrent: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: `2px solid ${DARK_BROWN_COLORS.accent3}`,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      color: DARK_BROWN_COLORS.tertiary,
                      fontSize: "14px",
                    }}
                  >
                    Utilization Rate % (Target):
                  </label>
                  <input
                    type="number"
                    placeholder="Target %"
                    value={formData.utilizationRateTarget || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        utilizationRateTarget: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: `2px solid ${DARK_BROWN_COLORS.accent3}`,
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: `rgba(62, 39, 35, 0.8)`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#fdfcfb",
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "700px",
          maxHeight: "85vh",
          overflow: "auto",
          width: "90%",
          boxShadow: `0 10px 25px rgba(62, 39, 35, 0.4)`,
          border: `2px solid ${DARK_BROWN_COLORS.accent3}`,
        }}
      >
        <h3 style={{ color: DARK_BROWN_COLORS.secondary, marginTop: 0, fontSize: "24px", textAlign: "center" }}>
          {section === "employee-composition" && "Enter Employee Composition Data"}
          {section === "turnover-rate" && "Enter Turnover Data"}
          {section === "employee-cost" && "Enter Employee Cost Data"}
          {section === "training-spend" && "Enter Training Spend Data"}
          {section === "productivity-metrics" && "Enter Productivity Metrics"}
        </h3>
        <form onSubmit={handleSubmit}>
          {renderFormFields()}
          <div style={{ display: "flex", gap: "15px", justifyContent: "center", marginTop: "25px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "12px 25px",
                backgroundColor: DARK_BROWN_COLORS.accent4,
                color: DARK_BROWN_COLORS.secondary,
                border: `2px solid ${DARK_BROWN_COLORS.accent3}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "12px 25px",
                backgroundColor: DARK_BROWN_COLORS.secondary,
                color: "#fdfcfb",
                border: `2px solid ${DARK_BROWN_COLORS.secondary}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              Save Data
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Custom plugin to display percentages on pie chart
const percentagePlugin = {
  id: "percentagePlugin",
  afterDatasetsDraw(chart) {
    const { ctx, data } = chart
    chart.getDatasetMeta(0).data.forEach((datapoint, index) => {
      const { x, y } = datapoint.tooltipPosition()
      const value = data.datasets[0].data[index]
      if (value > 0) {
        ctx.save()
        ctx.font = "bold 14px Arial"
        ctx.fillStyle = "white"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(`${value}%`, x, y)
        ctx.restore()
      }
    })
  },
}

// Enhanced Employee Composition Component - ALL IN ONE ROW
// Enhanced Employee Composition Component - ALL IN ONE ROW
const EmployeeComposition = ({ activeSection, userData, onOpenModal }) => {
  if (activeSection !== "employee-composition") return null

  const defaultData = {
    headCount: 0,
    targetHeadCount: 0,
    unskilled: 0,
    semiSkilled: 0,
    skilledJnr: 0,
    profMid: 0,
    snrMgt: 0,
    topMgt: 0,
    femalePercent: 0,
    permanentPercent: 0,
    localPercent: 0,
    africanPercent: 0,
    coloredPercent: 0,
    indianPercent: 0,
    femaleLeadershipPercent: 0,
    youthLeadershipPercent: 0,
    hdiOwnershipPercent: 0,
  }

  const data = { ...defaultData, ...userData }
  const vacancies = data.targetHeadCount - data.headCount

  const occupationalData = {
    labels: ["Unskilled", "Semi-skilled", "Skilled & Jnr Mgt", "Professionals & Mid-Mgt", "Snr Mgt", "Top Mgt"],
    datasets: [
      {
        label: "Count",
        data: [data.unskilled, data.semiSkilled, data.skilledJnr, data.profMid, data.snrMgt, data.topMgt],
        backgroundColor: [
          DARK_BROWN_COLORS.primary,
          DARK_BROWN_COLORS.secondary,
          DARK_BROWN_COLORS.tertiary,
          DARK_BROWN_COLORS.accent1,
          DARK_BROWN_COLORS.accent2,
          DARK_BROWN_COLORS.accent3,
        ],
        borderColor: DARK_BROWN_COLORS.primary,
        borderWidth: 2,
      },
    ],
  }

  const genderData = {
    labels: ["Female", "Male"],
    datasets: [
      {
        data: [data.femalePercent, 100 - data.femalePercent],
        backgroundColor: [DARK_BROWN_COLORS.tertiary, DARK_BROWN_COLORS.accent4],
        borderColor: DARK_BROWN_COLORS.primary,
        borderWidth: 2,
      },
    ],
  }

  const contractData = {
    labels: ["Permanent", "Contractor"],
    datasets: [
      {
        data: [data.permanentPercent, 100 - data.permanentPercent],
        backgroundColor: [DARK_BROWN_COLORS.accent1, DARK_BROWN_COLORS.accent3],
        borderColor: DARK_BROWN_COLORS.primary,
        borderWidth: 2,
      },
    ],
  }

  const localityData = {
    labels: ["Local", "Foreign"],
    datasets: [
      {
        data: [data.localPercent, 100 - data.localPercent],
        backgroundColor: [DARK_BROWN_COLORS.secondary, DARK_BROWN_COLORS.accent5],
        borderColor: DARK_BROWN_COLORS.primary,
        borderWidth: 2,
      },
    ],
  }

  const eapData = {
    labels: ["African", "Colored", "Indian", "White"],
    datasets: [
      {
        data: [
          data.africanPercent,
          data.coloredPercent,
          data.indianPercent,
          100 - (data.africanPercent + data.coloredPercent + data.indianPercent),
        ],
        backgroundColor: [
          DARK_BROWN_COLORS.primary,
          DARK_BROWN_COLORS.tertiary,
          DARK_BROWN_COLORS.accent2,
          DARK_BROWN_COLORS.accent4,
        ],
        borderColor: DARK_BROWN_COLORS.primary,
        borderWidth: 2,
      },
    ],
  }

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "25px",
        margin: "20px 0",
        borderRadius: "12px",
        boxShadow: `0 4px 12px rgba(62, 39, 35, 0.15)`,
        border: `1px solid ${DARK_BROWN_COLORS.accent4}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: DARK_BROWN_COLORS.secondary, margin: 0, fontSize: "28px" }}>Employee Composition</h2>
        <button
          onClick={() => onOpenModal("employee-composition")}
          style={{
            padding: "12px 20px",
            backgroundColor: DARK_BROWN_COLORS.secondary,
            color: "#fdfcfb",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          📝 Enter Data
        </button>
      </div>

      {/* Top Row - Head Count, Gender, Contract, Locality, EAP */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        {/* Head Count with Target and Vacancies */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
          }}
        >
          <h3 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 15px 0", fontSize: "16px" }}>Head Count</h3>
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${DARK_BROWN_COLORS.secondary}, ${DARK_BROWN_COLORS.tertiary})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 15px auto",
              color: "#fdfcfb",
              fontSize: "28px",
              fontWeight: "bold",
              boxShadow: "0 4px 8px rgba(62, 39, 35, 0.3)",
            }}
          >
            {data.headCount}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                padding: "8px",
                borderRadius: "6px",
                border: `1px solid ${DARK_BROWN_COLORS.accent3}`,
              }}
            >
              <div style={{ fontSize: "11px", color: DARK_BROWN_COLORS.tertiary, marginBottom: "3px" }}>Target</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: DARK_BROWN_COLORS.secondary }}>
                {data.targetHeadCount}
              </div>
            </div>
            <div
              style={{
                backgroundColor: "#fff",
                padding: "8px",
                borderRadius: "6px",
                border: `1px solid ${DARK_BROWN_COLORS.accent3}`,
              }}
            >
              <div style={{ fontSize: "11px", color: DARK_BROWN_COLORS.tertiary, marginBottom: "3px" }}>Vacancies</div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: vacancies > 0 ? DARK_BROWN_COLORS.warning : DARK_BROWN_COLORS.success,
                }}
              >
                {vacancies}
              </div>
            </div>
          </div>
        </div>

        {/* Gender */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
          }}
        >
          <h3 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 15px 0", fontSize: "16px" }}>Gender</h3>
          <div style={{ height: "130px" }}>
            <Doughnut
              data={genderData}
              plugins={[percentagePlugin]}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: DARK_BROWN_COLORS.secondary,
                      font: {
                        size: 10,
                        weight: "bold",
                      },
                    },
                  },
                  tooltip: {
                    enabled: true,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Contract Type */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
          }}
        >
          <h3 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 15px 0", fontSize: "16px" }}>Contract Type</h3>
          <div style={{ height: "130px" }}>
            <Doughnut
              data={contractData}
              plugins={[percentagePlugin]}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: DARK_BROWN_COLORS.secondary,
                      font: {
                        size: 10,
                        weight: "bold",
                      },
                    },
                  },
                  tooltip: {
                    enabled: true,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Locality */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
          }}
        >
          <h3 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 15px 0", fontSize: "16px" }}>Locality</h3>
          <div style={{ height: "130px" }}>
            <Doughnut
              data={localityData}
              plugins={[percentagePlugin]}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: DARK_BROWN_COLORS.secondary,
                      font: {
                        size: 10,
                        weight: "bold",
                      },
                    },
                  },
                  tooltip: {
                    enabled: true,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* EAP % */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
          }}
        >
          <h3 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 15px 0", fontSize: "16px" }}>EAP %</h3>
          <div style={{ height: "130px" }}>
            <Doughnut
              data={eapData}
              plugins={[percentagePlugin]}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: DARK_BROWN_COLORS.secondary,
                      font: {
                        size: 9,
                        weight: "bold",
                      },
                    },
                  },
                  tooltip: {
                    enabled: true,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Second Row - ALL METRICS IN ONE ROW: Occupational Levels + Diversity Metrics */}
      <div>
        <h3 style={{ color: DARK_BROWN_COLORS.tertiary, fontSize: "18px", marginBottom: "20px" }}>
          Diversity & Leadership Metrics
        </h3>
        
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Occupational Levels - REDUCED SIZE */}
          <div
            style={{
              backgroundColor: "#f7f3f0",
              padding: "15px",
              borderRadius: "12px",
              border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
            }}
          >
            <h4 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 10px 0", fontSize: "16px", textAlign: "center" }}>
              Occupational Levels
            </h4>
            <div style={{ height: "180px" }}> {/* Reduced height from 220px */}
              <Bar
                data={occupationalData}
                options={{
                  indexAxis: "y",
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      grid: {
                        color: DARK_BROWN_COLORS.accent4,
                        drawBorder: false,
                      },
                      ticks: {
                        color: DARK_BROWN_COLORS.secondary,
                        font: {
                          size: 10, // Reduced font size
                        },
                        padding: 5,
                      },
                      title: {
                        display: false,
                      },
                    },
                    y: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        color: DARK_BROWN_COLORS.secondary,
                        font: {
                          size: 10, // Reduced font size
                          weight: "bold",
                        },
                        padding: 5,
                      },
                    },
                  },
                  layout: {
                    padding: {
                      left: 10,
                      right: 10,
                      top: 5,
                      bottom: 5,
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Diversity Metrics Row - ALL THREE IN SAME ROW */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "20px",
            }}
          >
            {/* Female Leadership */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f7f3f0",
                borderRadius: "12px",
                textAlign: "center",
                border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
              }}
            >
              <h4 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 15px 0", fontSize: "16px" }}>Female Leadership</h4>
              <div
                style={{
                  width: "140px", // Slightly reduced
                  height: "140px", // Slightly reduced
                  margin: "0 auto",
                  position: "relative",
                }}
              >
                <Doughnut
                  data={{
                    labels: ["Achieved", "Remaining"],
                    datasets: [
                      {
                        data: [data.femaleLeadershipPercent, Math.max(0, 100 - data.femaleLeadershipPercent)],
                        backgroundColor: [
                          data.femaleLeadershipPercent >= 40 ? DARK_BROWN_COLORS.success : DARK_BROWN_COLORS.warning,
                          DARK_BROWN_COLORS.accent5,
                        ],
                        borderColor: DARK_BROWN_COLORS.primary,
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    cutout: "65%", // Slightly smaller cutout
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "24px", // Slightly reduced
                      fontWeight: "bold",
                      color: DARK_BROWN_COLORS.secondary,
                    }}
                  >
                    {data.femaleLeadershipPercent}%
                  </span>
                  <div
                    style={{
                      fontSize: "13px", // Slightly reduced
                      color: DARK_BROWN_COLORS.tertiary,
                    }}
                  >
                    Target: 40%
                  </div>
                </div>
              </div>
            </div>

            {/* Youth Leadership */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f7f3f0",
                borderRadius: "12px",
                textAlign: "center",
                border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
              }}
            >
              <h4 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 15px 0", fontSize: "16px" }}>Youth Leadership</h4>
              <div
                style={{
                  width: "140px", // Slightly reduced
                  height: "140px", // Slightly reduced
                  margin: "0 auto",
                  position: "relative",
                }}
              >
                <Doughnut
                  data={{
                    labels: ["Achieved", "Remaining"],
                    datasets: [
                      {
                        data: [data.youthLeadershipPercent, Math.max(0, 100 - data.youthLeadershipPercent)],
                        backgroundColor: [
                          data.youthLeadershipPercent >= 30 ? DARK_BROWN_COLORS.success : DARK_BROWN_COLORS.warning,
                          DARK_BROWN_COLORS.accent5,
                        ],
                        borderColor: DARK_BROWN_COLORS.primary,
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    cutout: "65%", // Slightly smaller cutout
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "24px", // Slightly reduced
                      fontWeight: "bold",
                      color: DARK_BROWN_COLORS.secondary,
                    }}
                  >
                    {data.youthLeadershipPercent}%
                  </span>
                  <div
                    style={{
                      fontSize: "13px", // Slightly reduced
                      color: DARK_BROWN_COLORS.tertiary,
                    }}
                  >
                    Target: 30%
                  </div>
                </div>
              </div>
            </div>

            {/* HDI Ownership - NOW IN THE SAME ROW */}
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f7f3f0",
                borderRadius: "12px",
                textAlign: "center",
                border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
              }}
            >
              <h4 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 15px 0", fontSize: "16px" }}>HDI Ownership</h4>
              <div
                style={{
                  width: "140px", // Slightly reduced
                  height: "140px", // Slightly reduced
                  margin: "0 auto",
                  position: "relative",
                }}
              >
                <Doughnut
                  data={{
                    labels: ["Achieved", "Remaining"],
                    datasets: [
                      {
                        data: [data.hdiOwnershipPercent, Math.max(0, 100 - data.hdiOwnershipPercent)],
                        backgroundColor: [
                          data.hdiOwnershipPercent >= 50 ? DARK_BROWN_COLORS.success : DARK_BROWN_COLORS.warning,
                          DARK_BROWN_COLORS.accent5,
                        ],
                        borderColor: DARK_BROWN_COLORS.primary,
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    cutout: "65%", // Slightly smaller cutout
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "24px", // Slightly reduced
                      fontWeight: "bold",
                      color: DARK_BROWN_COLORS.secondary,
                    }}
                  >
                    {data.hdiOwnershipPercent}%
                  </span>
                  <div
                    style={{
                      fontSize: "13px", // Slightly reduced
                      color: DARK_BROWN_COLORS.tertiary,
                    }}
                  >
                    Target: 50%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// EmployeeCost Component with single line chart
const EmployeeCost = ({ activeSection, employeeCostData, onOpenModal }) => {
  if (activeSection !== "employee-cost") return null

  const defaultCostData = {
    janCost: 0,
    febCost: 0,
    marCost: 0,
    aprCost: 0,
    mayCost: 0,
    junCost: 0,
    julCost: 0,
    augCost: 0,
    sepCost: 0,
    octCost: 0,
    novCost: 0,
    decCost: 0,
  }

  const data = { ...defaultCostData, ...employeeCostData }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const costData = months.map((month) => data[`${month.toLowerCase()}Cost`] || 0)

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "25px",
        margin: "20px 0",
        borderRadius: "12px",
        boxShadow: `0 4px 12px rgba(62, 39, 35, 0.15)`,
        border: `1px solid ${DARK_BROWN_COLORS.accent4}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <h2 style={{ color: DARK_BROWN_COLORS.secondary, margin: 0, fontSize: "28px" }}>
          Employee Costs as % of Revenue
        </h2>
        <button
          onClick={() => onOpenModal("employee-cost")}
          style={{
            padding: "12px 20px",
            backgroundColor: DARK_BROWN_COLORS.tertiary,
            color: "#fdfcfb",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          📊 Enter Data
        </button>
      </div>

      <div
        style={{
          height: "400px",
          backgroundColor: "#f7f3f0",
          padding: "20px",
          borderRadius: "12px",
          border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
        }}
      >
        <Line
          data={{
            labels: months,
            datasets: [
              {
                label: "Employee Cost %",
                data: costData,
                borderColor: DARK_BROWN_COLORS.secondary,
                backgroundColor: `rgba(93, 64, 55, 0.1)`,
                borderWidth: 3,
                tension: 0.4,
                fill: true,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Cost as % of Revenue",
                  color: DARK_BROWN_COLORS.secondary,
                  font: {
                    weight: "bold",
                  },
                },
                ticks: {
                  color: DARK_BROWN_COLORS.secondary,
                  callback: function (value) {
                    return value + "%"
                  },
                },
                grid: {
                  color: DARK_BROWN_COLORS.accent4,
                },
              },
              x: {
                ticks: {
                  color: DARK_BROWN_COLORS.secondary,
                },
                grid: {
                  color: DARK_BROWN_COLORS.accent4,
                },
              },
            },
            plugins: {
              legend: {
                labels: {
                  color: DARK_BROWN_COLORS.secondary,
                  font: {
                    weight: "bold",
                  },
                },
              },
            },
          }}
        />
      </div>
    </div>
  )
}

// ShareholderBreakdown Component
const ShareholderBreakdown = ({ activeSection, shareholderData }) => {
  if (activeSection !== "shareholder-breakdown") return null

  const mainShareholderData = {
    labels: ["Founders", "Employees", "Investors", "Public"],
    datasets: [
      {
        data: [35, 15, 40, 10],
        backgroundColor: [
          DARK_BROWN_COLORS.primary,
          DARK_BROWN_COLORS.tertiary,
          DARK_BROWN_COLORS.accent2,
          DARK_BROWN_COLORS.accent4,
        ],
        borderColor: DARK_BROWN_COLORS.primary,
        borderWidth: 2,
      },
    ],
  }

  // Demographics data
  const genderData = {
    labels: ["Male", "Female", "Other"],
    datasets: [
      {
        data: shareholderData?.gender || [60, 35, 5],
        backgroundColor: [DARK_BROWN_COLORS.primary, DARK_BROWN_COLORS.tertiary, DARK_BROWN_COLORS.accent3],
        borderColor: DARK_BROWN_COLORS.primary,
        borderWidth: 2,
      },
    ],
  }

  const raceData = {
    labels: ["Black", "White", "Colored", "Indian/Asian", "Other"],
    datasets: [
      {
        data: shareholderData?.race || [40, 30, 15, 10, 5],
        backgroundColor: [
          DARK_BROWN_COLORS.primary,
          DARK_BROWN_COLORS.secondary,
          DARK_BROWN_COLORS.tertiary,
          DARK_BROWN_COLORS.accent2,
          DARK_BROWN_COLORS.accent4,
        ],
        borderColor: DARK_BROWN_COLORS.primary,
        borderWidth: 2,
      },
    ],
  }

  const nationalityData = {
    labels: ["South African", "Other African", "European", "Asian", "American", "Other"],
    datasets: [
      {
        data: shareholderData?.nationality || [70, 10, 8, 7, 3, 2],
        backgroundColor: [
          DARK_BROWN_COLORS.primary,
          DARK_BROWN_COLORS.secondary,
          DARK_BROWN_COLORS.tertiary,
          DARK_BROWN_COLORS.accent1,
          DARK_BROWN_COLORS.accent3,
          DARK_BROWN_COLORS.accent5,
        ],
        borderColor: DARK_BROWN_COLORS.primary,
        borderWidth: 2,
      },
    ],
  }

  const youthData = {
    labels: ["Youth", "Non-Youth"],
    datasets: [
      {
        data: shareholderData?.youth || [25, 75],
        backgroundColor: [DARK_BROWN_COLORS.tertiary, DARK_BROWN_COLORS.accent4],
        borderColor: DARK_BROWN_COLORS.primary,
        borderWidth: 2,
      },
    ],
  }

  const disabilityData = {
    labels: ["Disabled", "Not Disabled"],
    datasets: [
      {
        data: shareholderData?.disability || [8, 92],
        backgroundColor: [DARK_BROWN_COLORS.secondary, DARK_BROWN_COLORS.accent5],
        borderColor: DARK_BROWN_COLORS.primary,
        borderWidth: 2,
      },
    ],
  }

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "25px",
        margin: "20px 0",
        borderRadius: "12px",
        boxShadow: `0 4px 12px rgba(62, 39, 35, 0.15)`,
        border: `1px solid ${DARK_BROWN_COLORS.accent4}`,
      }}
    >
      <h2 style={{ color: DARK_BROWN_COLORS.secondary, marginTop: 0, fontSize: "28px" }}>Shareholder Breakdown</h2>
      <div
        style={{
          height: "400px",
          backgroundColor: "#f7f3f0",
          padding: "20px",
          borderRadius: "12px",
          border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
        }}
      >
        <Doughnut
          data={mainShareholderData}
          plugins={[percentagePlugin]}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "right",
                labels: {
                  color: DARK_BROWN_COLORS.secondary,
                  font: {
                    weight: "bold",
                  },
                },
              },
            },
          }}
        />
      </div>

      <h3 style={{ color: DARK_BROWN_COLORS.secondary, marginTop: "40px", fontSize: "22px" }}>
        Shareholder Demographics
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginTop: "25px",
        }}
      >
        {/* Gender Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "center",
            border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
          }}
        >
          <h4 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 15px 0", fontSize: "16px" }}>Gender</h4>
          <div style={{ height: "180px" }}>
            <Doughnut
              data={genderData}
              plugins={[percentagePlugin]}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: DARK_BROWN_COLORS.secondary,
                      font: {
                        size: 11,
                        weight: "bold",
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Race Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "center",
            border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
          }}
        >
          <h4 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 15px 0", fontSize: "16px" }}>Race</h4>
          <div style={{ height: "180px" }}>
            <Doughnut
              data={raceData}
              plugins={[percentagePlugin]}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: DARK_BROWN_COLORS.secondary,
                      font: {
                        size: 10,
                        weight: "bold",
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Nationality Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "center",
            border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
          }}
        >
          <h4 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 15px 0", fontSize: "16px" }}>Nationality</h4>
          <div style={{ height: "180px" }}>
            <Doughnut
              data={nationalityData}
              plugins={[percentagePlugin]}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: DARK_BROWN_COLORS.secondary,
                      font: {
                        size: 9,
                        weight: "bold",
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Youth Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "center",
            border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
          }}
        >
          <h4 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 15px 0", fontSize: "16px" }}>Youth</h4>
          <div style={{ height: "180px" }}>
            <Doughnut
              data={youthData}
              plugins={[percentagePlugin]}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: DARK_BROWN_COLORS.secondary,
                      font: {
                        size: 11,
                        weight: "bold",
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Disability Chart */}
        <div
          style={{
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "center",
            border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
          }}
        >
          <h4 style={{ color: DARK_BROWN_COLORS.tertiary, margin: "0 0 15px 0", fontSize: "16px" }}>Disability</h4>
          <div style={{ height: "180px" }}>
            <Doughnut
              data={disabilityData}
              plugins={[percentagePlugin]}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: DARK_BROWN_COLORS.secondary,
                      font: {
                        size: 11,
                        weight: "bold",
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Turnover Rate Component
const TurnoverRate = ({ activeSection, turnoverData, onOpenModal }) => {
  if (activeSection !== "turnover-rate") return null

  const defaultTurnoverData = {
    selectedYear: new Date().getFullYear(),
    startMonth: "Jan",
    endMonth: "Dec",
    janNew: 0,
    febNew: 0,
    marNew: 0,
    aprNew: 0,
    mayNew: 0,
    junNew: 0,
    julNew: 0,
    augNew: 0,
    sepNew: 0,
    octNew: 0,
    novNew: 0,
    decNew: 0,
    janTerm: 0,
    febTerm: 0,
    marTerm: 0,
    aprTerm: 0,
    mayTerm: 0,
    junTerm: 0,
    julTerm: 0,
    augTerm: 0,
    sepTerm: 0,
    octTerm: 0,
    novTerm: 0,
    decTerm: 0,
    resignedPercent: 0,
    dismissedPercent: 0,
    eocPercent: 0,
    deceasedPercent: 0,
    desertionPercent: 0,
    retrenchedPercent: 0,
    vspPercent: 0,
  }

  const data = { ...defaultTurnoverData, ...turnoverData }

  const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const startIdx = allMonths.indexOf(data.startMonth)
  const endIdx = allMonths.indexOf(data.endMonth)
  const selectedMonths =
    startIdx <= endIdx
      ? allMonths.slice(startIdx, endIdx + 1)
      : [...allMonths.slice(startIdx), ...allMonths.slice(0, endIdx + 1)]

  const monthLabels = selectedMonths.map((month) => `${month}-${data.selectedYear.toString().slice(-2)}`)

  const workforceData = {
    labels: monthLabels,
    datasets: [
      {
        label: "New Engagements",
        data: selectedMonths.map((month) => data[`${month.toLowerCase()}New`] || 0),
        backgroundColor: DARK_BROWN_COLORS.success,
        borderColor: "#1B5E20",
        borderWidth: 2,
      },
      {
        label: "Terminations",
        data: selectedMonths.map((month) => data[`${month.toLowerCase()}Term`] || 0),
        backgroundColor: DARK_BROWN_COLORS.error,
        borderColor: "#B71C1C",
        borderWidth: 2,
      },
    ],
  }

  const terminationReasonsData = {
    labels: ["Resigned", "Dismissed", "EoC", "Deceased", "Desertion", "Retrenched", "VSP"],
    datasets: [
      {
        data: [
          data.resignedPercent,
          data.dismissedPercent,
          data.eocPercent,
          data.deceasedPercent,
          data.desertionPercent,
          data.retrenchedPercent,
          data.vspPercent,
        ],
        backgroundColor: [
          DARK_BROWN_COLORS.primary,
          DARK_BROWN_COLORS.complement1,
          DARK_BROWN_COLORS.secondary,
          DARK_BROWN_COLORS.complement2,
          DARK_BROWN_COLORS.tertiary,
          DARK_BROWN_COLORS.accent1,
          DARK_BROWN_COLORS.accent2,
        ],
        borderColor: DARK_BROWN_COLORS.primary,
        borderWidth: 2,
      },
    ],
  }

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "25px",
        margin: "20px 0",
        borderRadius: "12px",
        boxShadow: `0 4px 12px rgba(62, 39, 35, 0.15)`,
        border: `1px solid ${DARK_BROWN_COLORS.accent4}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <h2 style={{ color: DARK_BROWN_COLORS.secondary, margin: 0, fontSize: "28px" }}>Turnover</h2>
        <button
          onClick={() => onOpenModal("turnover-rate")}
          style={{
            padding: "12px 20px",
            backgroundColor: DARK_BROWN_COLORS.tertiary,
            color: "#fdfcfb",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          📊 Enter Data
        </button>
      </div>

      <div
        style={{
          backgroundColor: "#f7f3f0",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "25px",
          border: `1px solid ${DARK_BROWN_COLORS.accent4}`,
          textAlign: "center",
        }}
      >
        <h4 style={{ color: DARK_BROWN_COLORS.tertiary, margin: 0, fontSize: "16px" }}>
          📅 Current Period: {data.startMonth} - {data.endMonth} {data.selectedYear}
        </h4>
      </div>

      <div style={{ marginBottom: "40px" }}>
        <h3 style={{ color: DARK_BROWN_COLORS.tertiary, fontSize: "20px", marginBottom: "20px" }}>
          Workforce Movements
        </h3>
        <div
          style={{
            height: "400px",
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "12px",
            border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
          }}
        >
          <Bar
            data={workforceData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  stacked: false,
                  grid: {
                    color: DARK_BROWN_COLORS.accent4,
                  },
                  ticks: {
                    color: DARK_BROWN_COLORS.secondary,
                  },
                },
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Number of Employees",
                    color: DARK_BROWN_COLORS.secondary,
                    font: {
                      weight: "bold",
                    },
                  },
                  grid: {
                    color: DARK_BROWN_COLORS.accent4,
                  },
                  ticks: {
                    color: DARK_BROWN_COLORS.secondary,
                  },
                },
              },
              plugins: {
                legend: {
                  position: "top",
                  labels: {
                    color: DARK_BROWN_COLORS.secondary,
                    font: {
                      weight: "bold",
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div>
        <h3 style={{ color: DARK_BROWN_COLORS.tertiary, fontSize: "20px", marginBottom: "20px" }}>
          Reasons for Terminations
        </h3>
        <div
          style={{
            height: "400px",
            maxWidth: "600px",
            backgroundColor: "#f7f3f0",
            padding: "20px",
            borderRadius: "12px",
            border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
          }}
        >
          <Pie
            data={terminationReasonsData}
            plugins={[percentagePlugin]}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "right",
                  labels: {
                    color: DARK_BROWN_COLORS.secondary,
                    font: {
                      weight: "bold",
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ProductivityMetrics Component with editing capability
const ProductivityMetrics = ({ activeSection, productivityData, onOpenModal }) => {
  if (activeSection !== "productivity-metrics") return null

  const defaultMetrics = {
    revenuePerEmployeeCurrent: 0,
    revenuePerEmployeeTarget: 0,
    outputPerEmployeeCurrent: 0,
    outputPerEmployeeTarget: 0,
    utilizationRateCurrent: 0,
    utilizationRateTarget: 0,
  }

  const data = { ...defaultMetrics, ...productivityData }

  const metrics = [
    {
      name: "Revenue per Employee",
      current: data.revenuePerEmployeeCurrent,
      target: data.revenuePerEmployeeTarget,
      unit: "R",
    },
    {
      name: "Output per Employee",
      current: data.outputPerEmployeeCurrent,
      target: data.outputPerEmployeeTarget,
      unit: "",
    },
    {
      name: "Utilization Rate",
      current: data.utilizationRateCurrent,
      target: data.utilizationRateTarget,
      unit: "%",
    },
  ]

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "25px",
        margin: "20px 0",
        borderRadius: "12px",
        boxShadow: `0 4px 12px rgba(62, 39, 35, 0.15)`,
        border: `1px solid ${DARK_BROWN_COLORS.accent4}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <h2 style={{ color: DARK_BROWN_COLORS.secondary, margin: 0, fontSize: "28px" }}>Productivity Metrics</h2>
        <button
          onClick={() => onOpenModal("productivity-metrics")}
          style={{
            padding: "12px 20px",
            backgroundColor: DARK_BROWN_COLORS.tertiary,
            color: "#fdfcfb",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          📊 Enter Data
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {metrics.map((metric, index) => (
          <div
            key={index}
            style={{
              padding: "20px",
              backgroundColor: "#f7f3f0",
              borderRadius: "8px",
              border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
            }}
          >
            <h3 style={{ color: DARK_BROWN_COLORS.tertiary, marginTop: 0, marginBottom: "20px" }}>{metric.name}</h3>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "15px",
              }}
            >
              <div>
                <span style={{ fontSize: "28px", fontWeight: "bold", color: DARK_BROWN_COLORS.secondary }}>
                  {metric.unit === "R" ? `${metric.unit}${metric.current.toLocaleString()}` : `${metric.current}${metric.unit}`}
                </span>
                <span style={{ display: "block", color: DARK_BROWN_COLORS.tertiary, fontSize: "14px", marginTop: "5px" }}>
                  Current
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: DARK_BROWN_COLORS.tertiary, fontSize: "14px" }}>
                  Target: {metric.unit === "R" ? `${metric.unit}${metric.target.toLocaleString()}` : `${metric.target}${metric.unit}`}
                </span>
                <div
                  style={{
                    width: "150px",
                    height: "8px",
                    backgroundColor: DARK_BROWN_COLORS.accent5,
                    marginTop: "8px",
                    borderRadius: "4px",
                  }}
                >
                  <div
                    style={{
                      width: `${metric.target > 0 ? Math.min(100, (metric.current / metric.target) * 100) : 0}%`,
                      height: "100%",
                      backgroundColor:
                        metric.current >= metric.target ? DARK_BROWN_COLORS.success : DARK_BROWN_COLORS.warning,
                      borderRadius: "4px",
                      transition: "width 0.3s ease",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// TrainingSpend Component with single line chart
const TrainingSpend = ({ activeSection, trainingSpendData, onOpenModal }) => {
  if (activeSection !== "training-spend") return null

  const defaultTrainingData = {
    janTraining: 0,
    febTraining: 0,
    marTraining: 0,
    aprTraining: 0,
    mayTraining: 0,
    junTraining: 0,
    julTraining: 0,
    augTraining: 0,
    sepTraining: 0,
    octTraining: 0,
    novTraining: 0,
    decTraining: 0,
  }

  const data = { ...defaultTrainingData, ...trainingSpendData }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const spendData = months.map((month) => data[`${month.toLowerCase()}Training`] || 0)

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "25px",
        margin: "20px 0",
        borderRadius: "12px",
        boxShadow: `0 4px 12px rgba(62, 39, 35, 0.15)`,
        border: `1px solid ${DARK_BROWN_COLORS.accent4}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <h2 style={{ color: DARK_BROWN_COLORS.secondary, margin: 0, fontSize: "28px" }}>Training Spend</h2>
        <button
          onClick={() => onOpenModal("training-spend")}
          style={{
            padding: "12px 20px",
            backgroundColor: DARK_BROWN_COLORS.tertiary,
            color: "#fdfcfb",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          📊 Enter Data
        </button>
      </div>

      <div
        style={{
          height: "400px",
          backgroundColor: "#f7f3f0",
          padding: "20px",
          borderRadius: "12px",
          border: `2px solid ${DARK_BROWN_COLORS.accent4}`,
        }}
      >
        <Line
          data={{
            labels: months,
            datasets: [
              {
                label: "Training Spend (R)",
                data: spendData,
                borderColor: DARK_BROWN_COLORS.tertiary,
                backgroundColor: `rgba(109, 76, 65, 0.1)`,
                borderWidth: 3,
                tension: 0.4,
                fill: true,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Amount (R)",
                  color: DARK_BROWN_COLORS.secondary,
                  font: {
                    weight: "bold",
                  },
                },
                ticks: {
                  color: DARK_BROWN_COLORS.secondary,
                  callback: function (value) {
                    return "R" + value.toLocaleString()
                  },
                },
                grid: {
                  color: DARK_BROWN_COLORS.accent4,
                },
              },
              x: {
                ticks: {
                  color: DARK_BROWN_COLORS.secondary,
                },
                grid: {
                  color: DARK_BROWN_COLORS.accent4,
                },
              },
            },
            plugins: {
              legend: {
                labels: {
                  color: DARK_BROWN_COLORS.secondary,
                  font: {
                    weight: "bold",
                  },
                },
              },
            },
          }}
        />
      </div>
    </div>
  )
}

// Main People Component
const People = () => {
  const [activeSection, setActiveSection] = useState("employee-composition")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalSection, setModalSection] = useState("")
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState({})
  const [turnoverData, setTurnoverData] = useState({})
  const [employeeCostData, setEmployeeCostData] = useState({})
  const [trainingSpendData, setTrainingSpendData] = useState({})
  const [productivityData, setProductivityData] = useState({})
  const [shareholderData, setShareholderData] = useState({
    gender: [60, 35, 5],
    race: [40, 30, 15, 10, 5],
    nationality: [70, 10, 8, 7, 3, 2],
    youth: [25, 75],
    disability: [8, 92],
  })

  const [isInvestorView, setIsInvestorView] = useState(false)
  const [viewingSMEId, setViewingSMEId] = useState(null)
  const [viewingSMEName, setViewingSMEName] = useState("")

  useEffect(() => {
    const investorViewMode = sessionStorage.getItem("investorViewMode")
    const smeId = sessionStorage.getItem("viewingSMEId")
    const smeName = sessionStorage.getItem("viewingSMEName")

    if (investorViewMode === "true" && smeId) {
      setIsInvestorView(true)
      setViewingSMEId(smeId)
      setViewingSMEName(smeName || "SME")
      console.log("Investor view mode activated for SME:", smeId)
    }
  }, [])

  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    checkSidebarState()

    const observer = new MutationObserver(checkSidebarState)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (isInvestorView && viewingSMEId) {
        setUser({ uid: viewingSMEId })
      } else {
        setUser(currentUser)
      }

      if (isInvestorView && viewingSMEId) {
        fetchUserData(viewingSMEId)
      } else if (currentUser) {
        fetchUserData(currentUser.uid)
      }
    })

    return () => unsubscribe()
  }, [isInvestorView, viewingSMEId])

  const fetchUserData = async (userId) => {
    try {
      // Fetch employee composition data
      const employeeQuery = query(collection(db, "employeeComposition"), where("userId", "==", userId))
      const employeeSnapshot = await getDocs(employeeQuery)
      if (!employeeSnapshot.empty) {
        setUserData(employeeSnapshot.docs[0].data())
      }

      // Fetch turnover data
      const turnoverQuery = query(collection(db, "turnoverData"), where("userId", "==", userId))
      const turnoverSnapshot = await getDocs(turnoverQuery)
      if (!turnoverSnapshot.empty) {
        setTurnoverData(turnoverSnapshot.docs[0].data())
      }

      // Fetch employee cost data
      const costQuery = query(collection(db, "employeeCostData"), where("userId", "==", userId))
      const costSnapshot = await getDocs(costQuery)
      if (!costSnapshot.empty) {
        setEmployeeCostData(costSnapshot.docs[0].data())
      }

      // Fetch training spend data
      const trainingQuery = query(collection(db, "trainingSpendData"), where("userId", "==", userId))
      const trainingSnapshot = await getDocs(trainingQuery)
      if (!trainingSnapshot.empty) {
        setTrainingSpendData(trainingSnapshot.docs[0].data())
      }

      // Fetch productivity data
      const productivityQuery = query(collection(db, "productivityMetrics"), where("userId", "==", userId))
      const productivitySnapshot = await getDocs(productivityQuery)
      if (!productivitySnapshot.empty) {
        setProductivityData(productivitySnapshot.docs[0].data())
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const handleSaveData = async (data) => {
    if (!user) return

    try {
      let collectionName = ""
      let setStateFunction = null

      switch (modalSection) {
        case "employee-composition":
          collectionName = "employeeComposition"
          setStateFunction = setUserData
          break
        case "turnover-rate":
          collectionName = "turnoverData"
          setStateFunction = setTurnoverData
          break
        case "employee-cost":
          collectionName = "employeeCostData"
          setStateFunction = setEmployeeCostData
          break
        case "training-spend":
          collectionName = "trainingSpendData"
          setStateFunction = setTrainingSpendData
          break
        case "productivity-metrics":
          collectionName = "productivityMetrics"
          setStateFunction = setProductivityData
          break
        default:
          return
      }

      const dataQuery = query(collection(db, collectionName), where("userId", "==", user.uid))
      const dataSnapshot = await getDocs(dataQuery)

      if (dataSnapshot.empty) {
        await addDoc(collection(db, collectionName), {
          ...data,
          userId: user.uid,
          createdAt: new Date(),
        })
      } else {
        const docRef = doc(db, collectionName, dataSnapshot.docs[0].id)
        await updateDoc(docRef, {
          ...data,
          updatedAt: new Date(),
        })
      }

      setStateFunction(data)
    } catch (error) {
      console.error("Error saving data:", error)
    }
  }

  const openModal = (section) => {
    setModalSection(section)
    setIsModalOpen(true)
  }

  const handleExitInvestorView = () => {
    sessionStorage.removeItem("viewingSMEId")
    sessionStorage.removeItem("viewingSMEName")
    sessionStorage.removeItem("investorViewMode")
    window.location.href = "/my-cohorts"
  }

  const getContentStyles = () => ({
    width: "100%",
    marginLeft: "0",
    backgroundColor: "#f7f3f0",
    minHeight: "100vh",
    padding: `70px 20px 20px ${isSidebarCollapsed ? "100px" : "270px"}`,
    transition: "padding 0.3s ease",
    boxSizing: "border-box",
  })

  const sectionButtons = [
    { id: "employee-composition", label: "Employee Composition" },
    { id: "employee-cost", label: "Employee Costs" },
    { id: "shareholder-breakdown", label: "Shareholders" },
    { id: "training-spend", label: "Training Spend" },
    { id: "turnover-rate", label: "Turnover Rate" },
    { id: "productivity-metrics", label: "Productivity Metrics" },
  ]

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <div style={getContentStyles()}>
        <Header />

        {isInvestorView && (
          <div
            style={{
              backgroundColor: "#e8f5e9",
              padding: "16px 20px",
              margin: "50px 0 20px 0",
              borderRadius: "8px",
              border: "2px solid #4caf50",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>👁️</span>
              <span style={{ color: "#2e7d32", fontWeight: "600", fontSize: "15px" }}>
                Investor View: Viewing {viewingSMEName}'s People Data
              </span>
            </div>
            <button
              onClick={handleExitInvestorView}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#45a049"
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#4caf50"
              }}
            >
              Back to My Cohorts
            </button>
          </div>
        )}

        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              gap: "10px",
              margin: "50px 0 20px 0",
              padding: "15px",
              backgroundColor: "#fdfcfb",
              borderRadius: "8px",
              boxShadow: `0 2px 4px rgba(62, 39, 35, 0.1)`,
              flexWrap: "wrap",
              overflowX: "auto",
            }}
          >
            {sectionButtons.map((button) => (
              <button
                key={button.id}
                onClick={() => setActiveSection(button.id)}
                style={{
                  padding: "10px 20px",
                  backgroundColor:
                    activeSection === button.id ? DARK_BROWN_COLORS.secondary : DARK_BROWN_COLORS.accent4,
                  color: activeSection === button.id ? "#fdfcfb" : DARK_BROWN_COLORS.secondary,
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.3s ease",
                  whiteSpace: "nowrap",
                  boxShadow: activeSection === button.id ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
                }}
              >
                {button.label}
              </button>
            ))}
          </div>

          <EmployeeComposition activeSection={activeSection} userData={userData} onOpenModal={openModal} />
          <EmployeeCost activeSection={activeSection} employeeCostData={employeeCostData} onOpenModal={openModal} />
          <ShareholderBreakdown activeSection={activeSection} shareholderData={shareholderData} />
          <TrainingSpend activeSection={activeSection} trainingSpendData={trainingSpendData} onOpenModal={openModal} />
          <TurnoverRate activeSection={activeSection} turnoverData={turnoverData} onOpenModal={openModal} />
          <ProductivityMetrics activeSection={activeSection} productivityData={productivityData} onOpenModal={openModal} />
        </div>
      </div>

      <DataEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        section={modalSection}
        onSave={handleSaveData}
        currentData={
          modalSection === "employee-composition"
            ? userData
            : modalSection === "turnover-rate"
              ? turnoverData
              : modalSection === "employee-cost"
                ? employeeCostData
                : modalSection === "training-spend"
                  ? trainingSpendData
                  : productivityData
        }
      />
    </div>
  )
}

export default People