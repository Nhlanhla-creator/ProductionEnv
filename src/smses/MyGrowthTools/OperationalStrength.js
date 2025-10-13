"use client"

import { useState, useEffect } from "react"
import { Bar, Line, Doughnut } from "react-chartjs-2"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import Sidebar from "smses/Sidebar/Sidebar"
import Header from "../DashboardHeader/DashboardHeader"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import ChartDataLabels from "chartjs-plugin-datalabels"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
)

// Download Modal Component - REMOVED AS PER UPDATES
// const DownloadModal = ({ isOpen, onClose, onDownload, sectionName, availableSections }) => {
//   const [selectedSections, setSelectedSections] = useState({})

//   useEffect(() => {
//     if (isOpen) {
//       const initialSelection = {}
//       availableSections.forEach((section) => {
//         initialSelection[section.key] = true
//       })
//       setSelectedSections(initialSelection)
//     }
//   }, [isOpen, availableSections])

//   const handleSectionToggle = (sectionKey) => {
//     setSelectedSections((prev) => ({
//       ...prev,
//       [sectionKey]: !prev[sectionKey],
//     }))
//   }

//   const handleDownload = () => {
//     const sectionsToDownload = Object.keys(selectedSections).filter((key) => selectedSections[key])
//     onDownload(sectionsToDownload)
//     onClose()
//   }

//   if (!isOpen) return null

//   return (
//     <div
//       style={{
//         position: "fixed",
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         backgroundColor: "rgba(0, 0, 0, 0.5)",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         zIndex: 1000,
//       }}
//     >
//       <div
//         style={{
//           backgroundColor: "#fdfcfb",
//           padding: "30px",
//           borderRadius: "12px",
//           boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
//           maxWidth: "500px",
//           width: "90%",
//           maxHeight: "80vh",
//           overflowY: "auto",
//         }}
//       >
//         <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "20px" }}>Download {sectionName} Data</h3>

//         <div style={{ marginBottom: "20px" }}>
//           <p style={{ color: "#72542b", marginBottom: "15px" }}>
//             Select the data sections you want to include in your download:
//           </p>

//           {availableSections.map((section) => (
//             <label
//               key={section.key}
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 marginBottom: "10px",
//                 cursor: "pointer",
//                 padding: "8px",
//                 borderRadius: "4px",
//                 backgroundColor: selectedSections[section.key] ? "#f7f3f0" : "transparent",
//               }}
//             >
//               <input
//                 type="checkbox"
//                 checked={selectedSections[section.key] || false}
//                 onChange={() => handleSectionToggle(section.key)}
//                 style={{ marginRight: "10px" }}
//               />
//               <span style={{ color: "#5d4037" }}>{section.label}</span>
//             </label>
//           ))}
//         </div>

//         <div
//           style={{
//             display: "flex",
//             gap: "10px",
//             justifyContent: "flex-end",
//           }}
//         >
//           <button
//             onClick={onClose}
//             style={{
//               padding: "10px 20px",
//               backgroundColor: "#e8ddd4",
//               color: "#5d4037",
//               border: "none",
//               borderRadius: "6px",
//               cursor: "pointer",
//             }}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleDownload}
//             style={{
//               padding: "10px 20px",
//               backgroundColor: "#5d4037",
//               color: "#fdfcfb",
//               border: "none",
//               borderRadius: "6px",
//               cursor: "pointer",
//             }}
//           >
//             Download JSON
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }

// KPI Dashboard Component (Updated - removed business types, added manual entry)
const KPIDashboard = ({ activeSection }) => {
  const [kpis, setKpis] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  // const [showDownloadModal, setShowDownloadModal] = useState(false) // REMOVED

  const saveKpiData = async () => {
    try {
      await setDoc(doc(db, "kpi-dashboard", "main"), { kpis })
      setShowEditForm(false)
      alert("KPI data saved successfully!")
    } catch (error) {
      console.error("Error saving KPI data:", error)
      alert("Error saving data")
    }
  }

  const loadKpiData = async () => {
    try {
      const docRef = doc(db, "kpi-dashboard", "main")
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setKpis(docSnap.data().kpis || [])
      }
    } catch (error) {
      console.error("Error loading KPI data:", error)
    }
  }

  useEffect(() => {
    loadKpiData()
  }, [])

  const updateKpi = (index, field, value) => {
    const newKpis = [...kpis]
    newKpis[index][field] = field === "name" ? value : Number.parseFloat(value) || 0
    setKpis(newKpis)
  }

  const addKpi = () => {
    setKpis([...kpis, { name: "New KPI", current: 0, target: 100 }])
  }

  const removeKpi = (index) => {
    const newKpis = kpis.filter((_, i) => i !== index)
    setKpis(newKpis)
  }

  const handleDownload = () => {
    const csvContent = [
      ["KPI Name", "Current Value", "Target Value", "Achievement %"],
      ...kpis.map((kpi) => [
        kpi.name,
        kpi.current,
        kpi.target,
        kpi.target > 0 ? ((kpi.current / kpi.target) * 100).toFixed(1) : 0,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "kpi-dashboard.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "kpi-dashboard") return null

  // const downloadSections = [
  //   { key: "raw_data", label: "Raw KPI Data" },
  //   { key: "summary", label: "Summary Statistics" },
  // ] // REMOVED

  return (
    <div
      style={{
        backgroundColor: "#faf7f2", //
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#4a352f", marginTop: 0 }}>KPI Dashboard</h2> {/* */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleDownload} //
            style={{
              padding: "8px 16px",
              backgroundColor: "#a67c52", //
              color: "#faf7f2", //
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Download CSV {/* */}
          </button>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4a352f", //
              color: "#faf7f2", //
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {showEditForm ? "Cancel" : "Edit Data"}
          </button>
        </div>
      </div>

      {/* <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        sectionName="KPI Dashboard"
        availableSections={downloadSections}
      /> */}

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1", //
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit KPI Data</h3> {/* */}
          {kpis.map((kpi, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr auto",
                gap: "10px",
                alignItems: "center",
                marginBottom: "10px",
                padding: "10px",
                backgroundColor: "#fdfcfb",
                borderRadius: "4px",
              }}
            >
              <input
                type="text"
                value={kpi.name}
                onChange={(e) => updateKpi(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="KPI Name"
              />
              <input
                type="number"
                value={kpi.current}
                onChange={(e) => updateKpi(index, "current", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Current"
              />
              <input
                type="number"
                value={kpi.target}
                onChange={(e) => updateKpi(index, "target", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Target"
              />
              <button
                onClick={() => removeKpi(index)}
                style={{
                  padding: "8px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={addKpi}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Add KPI
            </button>
            <button
              onClick={saveKpiData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {kpis.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No KPI data available. Click "Edit Data" to add your first KPI.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {kpis.map((kpi, index) => (
            <div
              key={index}
              style={{
                padding: "15px",
                backgroundColor: "#f5f0e1", //
                borderRadius: "6px",
              }}
            >
              <h3 style={{ color: "#7d5a50", marginTop: 0 }}>{kpi.name}</h3> {/* */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "15px",
                }}
              >
                <div>
                  <span style={{ fontSize: "24px", fontWeight: "bold", color: "#4a352f" }}>{kpi.current}</span> {/* */}
                  <span style={{ display: "block", color: "#7d5a50", fontSize: "14px" }}>Current</span> {/* */}
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: "#7d5a50" }}>Target: {kpi.target}</span> {/* */}
                  <div
                    style={{
                      height: "4px",
                      backgroundColor: "#e6d7c3", //
                      marginTop: "5px",
                      borderRadius: "2px",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, (kpi.current / kpi.target) * 100)}%`,
                        height: "100%",
                        backgroundColor: kpi.current >= kpi.target ? "#4CAF50" : "#FF9800",
                        borderRadius: "2px",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Productivity Measures Component
const ProductivityMeasures = ({ activeSection }) => {
  const [productivityData, setProductivityData] = useState([85, 88, 90, 87, 92, 95]) //
  const [efficiencyData, setEfficiencyData] = useState([78, 82, 85, 83, 88, 91]) //
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false) // REMOVED
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]

  const saveProductivityData = async () => {
    try {
      await setDoc(doc(db, "productivity", "main"), {
        productivityData,
        efficiencyData,
      })
      setShowEditForm(false)
      alert("Productivity data saved successfully!")
    } catch (error) {
      console.error("Error saving productivity data:", error)
      alert("Error saving data")
    }
  }

  const loadProductivityData = async () => {
    try {
      const docRef = doc(db, "productivity", "main")
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setProductivityData(data.productivityData || [0, 0, 0, 0, 0, 0])
        setEfficiencyData(data.efficiencyData || [0, 0, 0, 0, 0, 0])
      }
    } catch (error) {
      console.error("Error loading productivity data:", error)
    }
  }

  useEffect(() => {
    loadProductivityData()
  }, [])

  const updateProductivityValue = (index, value) => {
    const newData = [...productivityData]
    newData[index] = Number.parseFloat(value) || 0
    setProductivityData(newData)
  }

  const updateEfficiencyValue = (index, value) => {
    const newData = [...efficiencyData]
    newData[index] = Number.parseFloat(value) || 0
    setEfficiencyData(newData)
  }

  const handleDownload = () => {
    const csvContent = [
      ["Month", "Productivity Index", "Efficiency Ratio"],
      ...months.map((month, index) => [month, productivityData[index], efficiencyData[index]]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "productivity-measures.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "productivity") return null

  const downloadSections = [
    { key: "raw_data", label: "Monthly Productivity Data" },
    { key: "summary", label: "Productivity Analytics" },
  ]

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Productivity Measures</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleDownload} //
            style={{
              padding: "8px 16px",
              backgroundColor: "#a67c52", //
              color: "#faf7f2", //
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Download CSV {/* */}
          </button>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4a352f", //
              color: "#faf7f2", //
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {showEditForm ? "Cancel" : "Edit Data"}
          </button>
        </div>
      </div>

      {/* <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        sectionName="Productivity Measures"
        availableSections={downloadSections}
      /> */}

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1", //
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Productivity Data</h3> {/* */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <h4 style={{ color: "#7d5a50" }}>Productivity Index</h4> {/* */}
              {months.map((month, index) => (
                <div key={month} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ minWidth: "40px", color: "#72542b" }}>{month}:</span>
                  <input
                    type="number"
                    value={productivityData[index]}
                    onChange={(e) => updateProductivityValue(index, e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      width: "80px",
                    }}
                  />
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: "#7d5a50" }}>Efficiency Ratio</h4> {/* */}
              {months.map((month, index) => (
                <div key={month} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ minWidth: "40px", color: "#72542b" }}>{month}:</span>
                  <input
                    type="number"
                    value={efficiencyData[index]}
                    onChange={(e) => updateEfficiencyValue(index, e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      width: "80px",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={saveProductivityData}
            style={{
              padding: "8px 16px",
              backgroundColor: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "15px",
            }}
          >
            Save Data
          </button>
        </div>
      )}

      <div style={{ height: "400px" }}>
        <Line
          data={{
            labels: months,
            datasets: [
              {
                label: "Productivity Index",
                data: productivityData,
                borderColor: "#a67c52", //
                backgroundColor: "rgba(166, 124, 82, 0.1)", //
                borderWidth: 2,
                tension: 0.1,
                fill: true,
              },
              {
                label: "Efficiency Ratio",
                data: efficiencyData,
                borderColor: "#8b7355", //
                backgroundColor: "rgba(139, 115, 85, 0.1)", //
                borderWidth: 2,
                tension: 0.1,
                fill: true,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
              },
              title: {
                display: false,
              },
              datalabels: {
                // ADDED THIS LINE FROM UPDATES, though not explicitly marked
                display: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Index (%)",
                  color: "#7d5a50", //
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Months",
                  color: "#7d5a50", //
                },
              },
            },
          }}
        />
      </div>
    </div>
  )
}

// Unit Cost Component
const UnitCost = ({ activeSection }) => {
  const [products, setProducts] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false) // REMOVED

  const saveUnitCostData = async () => {
    try {
      await setDoc(doc(db, "unit-cost", "main"), { products })
      setShowEditForm(false)
      alert("Unit cost data saved successfully!")
    } catch (error) {
      console.error("Error saving unit cost data:", error)
      alert("Error saving data")
    }
  }

  const loadUnitCostData = async () => {
    try {
      const docRef = doc(db, "unit-cost", "main")
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setProducts(docSnap.data().products || [])
      }
    } catch (error) {
      console.error("Error loading unit cost data:", error)
    }
  }

  useEffect(() => {
    loadUnitCostData()
  }, [])

  const updateProduct = (index, field, value) => {
    const newProducts = [...products]
    newProducts[index][field] = field === "name" ? value : Number.parseFloat(value) || 0
    setProducts(newProducts)
  }

  const addProduct = () => {
    setProducts([...products, { name: "New Product", cost: 0, price: 0 }])
  }

  const removeProduct = (index) => {
    const newProducts = products.filter((_, i) => i !== index)
    setProducts(newProducts)
  }

  const handleDownload = () => {
    const csvContent = [
      ["Product Name", "Cost (R)", "Price (R)", "Margin %"],
      ...products.map((product) => [
        product.name,
        product.cost.toFixed(2),
        product.price.toFixed(2),
        product.price > 0 ? (((product.price - product.cost) / product.price) * 100).toFixed(1) : 0,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "unit-cost.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "unit-cost") return null

  const productNames = products.map((p) => p.name)
  const costData = products.map((p) => p.cost)
  const priceData = products.map((p) => p.price)

  const downloadSections = [
    { key: "raw_data", label: "Product Cost Data" },
    { key: "summary", label: "Cost Summary" },
    { key: "margins", label: "Profit Margins" },
  ]

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Unit Cost per Output</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleDownload} //
            style={{
              padding: "8px 16px",
              backgroundColor: "#a67c52", //
              color: "#faf7f2", //
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Download CSV {/* */}
          </button>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4a352f", //
              color: "#faf7f2", //
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {showEditForm ? "Cancel" : "Edit Data"}
          </button>
        </div>
      </div>

      {/* <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        sectionName="Unit Cost per Output"
        availableSections={downloadSections}
      /> */}

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1", //
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Product Data</h3> {/* */}
          {products.map((product, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr auto",
                gap: "10px",
                alignItems: "center",
                marginBottom: "10px",
                padding: "10px",
                backgroundColor: "#fdfcfb",
                borderRadius: "4px",
              }}
            >
              <input
                type="text"
                value={product.name}
                onChange={(e) => updateProduct(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Product Name"
              />
              <input
                type="number"
                value={product.cost}
                onChange={(e) => updateProduct(index, "cost", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Cost"
              />
              <input
                type="number"
                value={product.price}
                onChange={(e) => updateProduct(index, "price", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Price"
              />
              <button
                onClick={() => removeProduct(index)}
                style={{
                  padding: "8px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={addProduct}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Add Product
            </button>
            <button
              onClick={saveUnitCostData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No product data available. Click "Edit Data" to add your first product.</p>
        </div>
      ) : (
        <div style={{ height: "400px" }}>
          <Bar
            data={{
              labels: productNames,
              datasets: [
                {
                  label: "Production Cost",
                  data: costData,
                  backgroundColor: "#d4c4b0",
                  borderColor: "#5d4037",
                  borderWidth: 1,
                },
                {
                  label: "Selling Price",
                  data: priceData,
                  backgroundColor: "#9c7c5f",
                  borderColor: "#5d4037",
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top",
                },
                title: {
                  display: false,
                },
                datalabels: {
                  // ADDED THIS LINE FROM UPDATES, though not explicitly marked
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Amount (R)",
                    color: "#7d5a50", //
                  },
                },
                x: {
                  title: {
                    display: true,
                    text: "Products",
                    color: "#7d5a50", //
                  },
                },
              },
            }}
          />
        </div>
      )}
    </div>
  )
}

// Order Fulfillment Component
const OrderFulfillment = ({ activeSection }) => {
  const [metrics, setMetrics] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false) // REMOVED

  const saveOrderFulfillmentData = async () => {
    try {
      await setDoc(doc(db, "order-fulfillment", "main"), { metrics })
      setShowEditForm(false)
      alert("Order fulfillment data saved successfully!")
    } catch (error) {
      console.error("Error saving order fulfillment data:", error)
      alert("Error saving data")
    }
  }

  const loadOrderFulfillmentData = async () => {
    try {
      const docRef = doc(db, "order-fulfillment", "main")
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setMetrics(docSnap.data().metrics || [])
      }
    } catch (error) {
      console.error("Error loading order fulfillment data:", error)
    }
  }

  useEffect(() => {
    loadOrderFulfillmentData()
  }, [])

  const updateMetric = (index, field, value) => {
    const newMetrics = [...metrics]
    newMetrics[index][field] = field === "name" ? value : Number.parseFloat(value) || 0
    setMetrics(newMetrics)
  }

  const addMetric = () => {
    setMetrics([...metrics, { name: "New Metric", value: 0, target: 100 }])
  }

  const removeMetric = (index) => {
    const newMetrics = metrics.filter((_, i) => i !== index)
    setMetrics(newMetrics)
  }

  const handleDownload = () => {
    const csvContent = [
      ["Metric Name", "Current Value %", "Target Value %", "Performance %"],
      ...metrics.map((metric) => [
        metric.name,
        metric.value,
        metric.target,
        metric.target > 0 ? ((metric.value / metric.target) * 100).toFixed(1) : 0,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "order-fulfillment.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "order-fulfillment") return null

  const downloadSections = [
    { key: "raw_data", label: "Fulfillment Metrics" },
    { key: "summary", label: "Performance Summary" },
    { key: "performance", label: "Performance Analysis" },
  ]

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Order Fulfillment & Delivery Metrics</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleDownload} //
            style={{
              padding: "8px 16px",
              backgroundColor: "#a67c52", //
              color: "#faf7f2", //
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Download CSV {/* */}
          </button>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4a352f", //
              color: "#faf7f2", //
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {showEditForm ? "Cancel" : "Edit Data"}
          </button>
        </div>
      </div>

      {/* <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        sectionName="Order Fulfillment & Delivery Metrics"
        availableSections={downloadSections}
      /> */}

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1", //
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Metrics Data</h3> {/* */}
          {metrics.map((metric, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr auto",
                gap: "10px",
                alignItems: "center",
                marginBottom: "10px",
                padding: "10px",
                backgroundColor: "#fdfcfb",
                borderRadius: "4px",
              }}
            >
              <input
                type="text"
                value={metric.name}
                onChange={(e) => updateMetric(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Metric Name"
              />
              <input
                type="number"
                value={metric.value}
                onChange={(e) => updateMetric(index, "value", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Value"
              />
              <input
                type="number"
                value={metric.target}
                onChange={(e) => updateMetric(index, "target", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Target"
              />
              <button
                onClick={() => removeMetric(index)}
                style={{
                  padding: "8px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={addMetric}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Add Metric
            </button>
            <button
              onClick={saveOrderFulfillmentData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {metrics.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No metrics data available. Click "Edit Data" to add your first metric.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          {metrics.map((metric, index) => (
            <div
              key={index}
              style={{
                padding: "15px",
                backgroundColor: "#f5f0e1", //
                borderRadius: "6px",
                textAlign: "center",
              }}
            >
              <h3 style={{ color: "#7d5a50", marginTop: 0 }}>{metric.name}</h3> {/* */}
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  margin: "0 auto",
                  position: "relative",
                }}
              >
                <Doughnut
                  data={{
                    labels: ["Achieved", "Remaining"],
                    datasets: [
                      {
                        data: [metric.value, 100 - metric.value],
                        backgroundColor: [metric.value >= metric.target ? "#4CAF50" : "#FF9800", "#e8ddd4"],
                        borderColor: "#5d4037",
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    cutout: "70%",
                    plugins: {
                      legend: {
                        display: false,
                      },
                      // Use datalabels plugin to display percentages on doughnut chart
                      datalabels: {
                        formatter: (value) => `${value}%`,
                        color: "#ffffff", // Text color for labels
                        anchor: "center",
                        align: "center",
                        font: {
                          size: 12,
                          weight: "bold",
                        },
                        padding: {
                          top: 4,
                          bottom: 4,
                          left: 4,
                          right: 4,
                        },
                        borderRadius: 4,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
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
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#4a352f", //
                    }}
                  >
                    {metric.value}%
                  </span>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#7d5a50", //
                    }}
                  >
                    Target: {metric.target}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Tech Stack Component
const TechStackUsage = ({ activeSection }) => {
  const [systems, setSystems] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false) // REMOVED

  const saveTechStackData = async () => {
    try {
      await setDoc(doc(db, "tech-stack", "main"), { systems })
      setShowEditForm(false)
      alert("Tech stack data saved successfully!")
    } catch (error) {
      console.error("Error saving tech stack data:", error)
      alert("Error saving data")
    }
  }

  const loadTechStackData = async () => {
    try {
      const docRef = doc(db, "tech-stack", "main")
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setSystems(docSnap.data().systems || [])
      }
    } catch (error) {
      console.error("Error loading tech stack data:", error)
    }
  }

  useEffect(() => {
    loadTechStackData()
  }, [])

  const updateSystem = (index, field, value) => {
    const newSystems = [...systems]
    newSystems[index][field] = field === "name" ? value : Number.parseFloat(value) || 0
    setSystems(newSystems)
  }

  const addSystem = () => {
    setSystems([...systems, { name: "New System", adoption: 0, users: 0 }])
  }

  const removeSystem = (index) => {
    const newSystems = systems.filter((_, i) => i !== index)
    setSystems(newSystems)
  }

  const handleDownload = () => {
    const csvContent = [
      ["System Name", "Adoption Rate %", "Active Users"],
      ...systems.map((system) => [system.name, system.adoption, system.users]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "tech-stack-usage.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "tech-stack") return null

  const downloadSections = [
    { key: "raw_data", label: "System Data" },
    { key: "summary", label: "Adoption Summary" },
    { key: "adoption", label: "Adoption Analysis" },
  ]

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Tech Stack Usage</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleDownload} //
            style={{
              padding: "8px 16px",
              backgroundColor: "#a67c52", //
              color: "#faf7f2", //
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Download CSV {/* */}
          </button>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4a352f", //
              color: "#faf7f2", //
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {showEditForm ? "Cancel" : "Edit Data"}
          </button>
        </div>
      </div>

      {/* <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        sectionName="Tech Stack Usage"
        availableSections={downloadSections}
      /> */}

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1", //
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Tech Stack Data</h3> {/* */}
          {systems.map((system, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr auto",
                gap: "10px",
                alignItems: "center",
                marginBottom: "10px",
                padding: "10px",
                backgroundColor: "#fdfcfb",
                borderRadius: "4px",
              }}
            >
              <input
                type="text"
                value={system.name}
                onChange={(e) => updateSystem(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="System Name"
              />
              <input
                type="number"
                value={system.adoption}
                onChange={(e) => updateSystem(index, "adoption", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Adoption %"
              />
              <input
                type="number"
                value={system.users}
                onChange={(e) => updateSystem(index, "users", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Users"
              />
              <button
                onClick={() => removeSystem(index)}
                style={{
                  padding: "8px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={addSystem}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Add System
            </button>
            <button
              onClick={saveTechStackData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {systems.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No tech stack data available. Click "Edit Data" to add your first system.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {systems.map((system, index) => (
            <div
              key={index}
              style={{
                padding: "15px",
                backgroundColor: "#f5f0e1", //
                borderRadius: "6px",
              }}
            >
              <h3 style={{ color: "#7d5a50", marginTop: 0 }}>{system.name}</h3> {/* */}
              <div style={{ marginTop: "15px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <span style={{ color: "#7d5a50" }}>Adoption Rate:</span> {/* */}
                  <span style={{ fontWeight: "bold", color: "#4a352f" }}>{system.adoption}%</span> {/* */}
                </div>
                <div
                  style={{
                    height: "10px",
                    backgroundColor: "#e6d7c3", //
                    borderRadius: "5px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${system.adoption}%`,
                      height: "100%",
                      backgroundColor: "#9c7c5f",
                      borderRadius: "5px",
                    }}
                  ></div>
                </div>
              </div>
              <div style={{ marginTop: "15px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <span style={{ color: "#7d5a50" }}>Active Users:</span> {/* */}
                  <span style={{ fontWeight: "bold", color: "#4a352f" }}>{system.users}</span> {/* */}
                </div>
              </div>
              <div
                style={{
                  height: "10px",
                  backgroundColor: "#e6d7c3", //
                  borderRadius: "5px",
                  overflow: "hidden",
                  marginTop: "5px",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, (system.users / 150) * 100)}%`,
                    height: "100%",
                    backgroundColor: "#a67c52", //
                    borderRadius: "5px",
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Process Automation Component
const ProcessAutomation = ({ activeSection }) => {
  const [processes, setProcesses] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false) // REMOVED

  const saveProcessAutomationData = async () => {
    try {
      await setDoc(doc(db, "process-automation", "main"), { processes })
      setShowEditForm(false)
      alert("Process automation data saved successfully!")
    } catch (error) {
      console.error("Error saving process automation data:", error)
      alert("Error saving data")
    }
  }

  const loadProcessAutomationData = async () => {
    try {
      const docRef = doc(db, "process-automation", "main")
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setProcesses(docSnap.data().processes || [])
      }
    } catch (error) {
      console.error("Error loading process automation data:", error)
    }
  }

  useEffect(() => {
    loadProcessAutomationData()
  }, [])

  const updateProcess = (index, field, value) => {
    const newProcesses = [...processes]
    newProcesses[index][field] = field === "name" ? value : Number.parseFloat(value) || 0
    setProcesses(newProcesses)
  }

  const addProcess = () => {
    setProcesses([...processes, { name: "New Process", automation: 0 }])
  }

  const removeProcess = (index) => {
    const newProcesses = processes.filter((_, i) => i !== index)
    setProcesses(newProcesses)
  }

  const handleDownload = () => {
    const csvContent = [
      ["Process Name", "Automation Level %"],
      ...processes.map((process) => [process.name, process.automation]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "process-automation.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "process-automation") return null

  const overallIndex = processes.length > 0 ? processes.reduce((sum, p) => sum + p.automation, 0) / processes.length : 0

  const downloadSections = [
    { key: "raw_data", label: "Process Data" },
    { key: "summary", label: "Automation Summary" },
    { key: "automation_levels", label: "Automation Levels" },
  ]

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Process Automation Index</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleDownload} //
            style={{
              padding: "8px 16px",
              backgroundColor: "#a67c52", //
              color: "#faf7f2", //
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Download CSV {/* */}
          </button>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4a352f", //
              color: "#faf7f2", //
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {showEditForm ? "Cancel" : "Edit Data"}
          </button>
        </div>
      </div>

      {/* <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        sectionName="Process Automation Index"
        availableSections={downloadSections}
      /> */}

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1", //
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Process Data</h3> {/* */}
          {processes.map((process, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr auto",
                gap: "10px",
                alignItems: "center",
                marginBottom: "10px",
                padding: "10px",
                backgroundColor: "#fdfcfb",
                borderRadius: "4px",
              }}
            >
              <input
                type="text"
                value={process.name}
                onChange={(e) => updateProcess(index, "name", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Process Name"
              />
              <input
                type="number"
                value={process.automation}
                onChange={(e) => updateProcess(index, "automation", e.target.value)}
                style={{
                  padding: "8px",
                  border: "1px solid #d4c4b0",
                  borderRadius: "4px",
                }}
                placeholder="Automation %"
              />
              <button
                onClick={() => removeProcess(index)}
                style={{
                  padding: "8px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={addProcess}
              style={{
                padding: "8px 16px",
                backgroundColor: "#72542b",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Add Process
            </button>
            <button
              onClick={saveProcessAutomationData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {processes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#72542b",
          }}
        >
          <p>No process data available. Click "Edit Data" to add your first process.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "30px",
          }}
        >
          <div>
            <div
              style={{
                height: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  backgroundColor: "#e8ddd4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  border: "10px solid #9c7c5f",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}
              >
                <span
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: "#5d4037",
                  }}
                >
                  {Math.round(overallIndex)}%
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    color: "#7d5a50", //
                  }}
                >
                  Automation Index
                </span>
              </div>
            </div>
          </div>
          <div>
            {processes.map((process, index) => (
              <div key={index} style={{ marginBottom: "15px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <span style={{ color: "#7d5a50" }}>{process.name}</span> {/* */}
                  <span style={{ fontWeight: "bold", color: "#4a352f" }}>{process.automation}%</span> {/* */}
                </div>
                <div
                  style={{
                    height: "10px",
                    backgroundColor: "#e6d7c3", //
                    borderRadius: "5px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${process.automation}%`,
                      height: "100%",
                      backgroundColor: "#8b7355", //
                      borderRadius: "5px",
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Customer Retention Component
const CustomerRetention = ({ activeSection }) => {
  const [retentionData, setRetentionData] = useState([0, 0, 0, 0, 0, 0])
  const [churnData, setChurnData] = useState([0, 0, 0, 0, 0, 0])
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false) // REMOVED
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]

  const saveCustomerRetentionData = async () => {
    try {
      await setDoc(doc(db, "customer-retention", "main"), {
        retentionData,
        churnData,
      })
      setShowEditForm(false)
      alert("Customer retention data saved successfully!")
    } catch (error) {
      console.error("Error saving customer retention data:", error)
      alert("Error saving data")
    }
  }

  const loadCustomerRetentionData = async () => {
    try {
      const docRef = doc(db, "customer-retention", "main")
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setRetentionData(data.retentionData || [0, 0, 0, 0, 0, 0])
        setChurnData(data.churnData || [0, 0, 0, 0, 0, 0])
      }
    } catch (error) {
      console.error("Error loading customer retention data:", error)
    }
  }

  useEffect(() => {
    loadCustomerRetentionData()
  }, [])

  const updateRetentionValue = (index, value) => {
    const newData = [...retentionData]
    newData[index] = Number.parseFloat(value) || 0
    setRetentionData(newData)
  }

  const updateChurnValue = (index, value) => {
    const newData = [...churnData]
    newData[index] = Number.parseFloat(value) || 0
    setChurnData(newData)
  }

  const handleDownload = () => {
    const csvContent = [
      ["Month", "Retention Rate %", "Churn Rate %"],
      ...months.map((month, index) => [month, retentionData[index], churnData[index]]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "customer-retention.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (activeSection !== "customer-retention") return null

  const downloadSections = [
    { key: "raw_data", label: "Monthly Data" },
    { key: "summary", label: "Retention Summary" },
    { key: "trends", label: "Trend Analysis" },
  ]

  return (
    <div
      style={{
        backgroundColor: "#f0e6d9", //
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#5d4037", marginTop: 0 }}>Customer Retention & Churn Rates</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleDownload} //
            style={{
              padding: "8px 16px",
              backgroundColor: "#a67c52", //
              color: "#faf7f2", //
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Download CSV {/* */}
          </button>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4a352f", //
              color: "#faf7f2", //
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {showEditForm ? "Cancel" : "Edit Data"}
          </button>
        </div>
      </div>

      {/* <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        sectionName="Customer Retention & Churn Rates"
        availableSections={downloadSections}
      /> */}

      {showEditForm && (
        <div
          style={{
            backgroundColor: "#f5f0e1", //
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#7d5a50", marginTop: 0 }}>Edit Customer Retention Data</h3> {/* */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <h4 style={{ color: "#7d5a50" }}>Retention Rate (%)</h4> {/* */}
              {months.map((month, index) => (
                <div key={month} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ minWidth: "40px", color: "#72542b" }}>{month}:</span>
                  <input
                    type="number"
                    value={retentionData[index]}
                    onChange={(e) => updateRetentionValue(index, e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      width: "80px",
                    }}
                  />
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: "#7d5a50" }}>Churn Rate (%)</h4> {/* */}
              {months.map((month, index) => (
                <div key={month} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ minWidth: "40px", color: "#72542b" }}>{month}:</span>
                  <input
                    type="number"
                    value={churnData[index]}
                    onChange={(e) => updateChurnValue(index, e.target.value)}
                    style={{
                      padding: "6px",
                      border: "1px solid #d4c4b0",
                      borderRadius: "4px",
                      width: "80px",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={saveCustomerRetentionData}
            style={{
              padding: "8px 16px",
              backgroundColor: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "15px",
            }}
          >
            Save Data
          </button>
        </div>
      )}

      <div style={{ height: "400px" }}>
        <Line
          data={{
            labels: months,
            datasets: [
              {
                label: "Retention Rate (%)",
                data: retentionData,
                borderColor: "#4CAF50",
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                borderWidth: 2,
                tension: 0.1,
                fill: true,
              },
              {
                label: "Churn Rate (%)",
                data: churnData,
                borderColor: "#F44336",
                backgroundColor: "rgba(244, 67, 54, 0.1)",
                borderWidth: 2,
                tension: 0.1,
                fill: true,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
              },
              title: {
                display: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: "Rate (%)",
                  color: "#72542b",
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Months",
                  color: "#72542b",
                },
              },
            },
          }}
        />
      </div>
    </div>
  )
}

// Main Operational Strength Component
const OperationalStrength = () => {
  const [activeSection, setActiveSection] = useState("kpi-dashboard")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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
    { id: "kpi-dashboard", label: "KPI Dashboard" },
    { id: "productivity", label: "Productivity" },
    { id: "unit-cost", label: "Unit Costs" },
    { id: "order-fulfillment", label: "Order Fulfillment" },
    { id: "tech-stack", label: "Tech Stack" },
    { id: "process-automation", label: "Process Automation" },
    { id: "customer-retention", label: "Customer Retention" },
  ]

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={getContentStyles()}>
        <Header />
        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              gap: "10px",
              margin: "50px 0 20px 0",
              padding: "15px",
              backgroundColor: "#fdfcfb",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {sectionButtons.map((button) => (
              <button
                key={button.id}
                onClick={() => setActiveSection(button.id)}
                style={{
                  padding: "10px 15px",
                  backgroundColor: activeSection === button.id ? "#4a352f" : "#e6d7c3", //
                  color: activeSection === button.id ? "#faf7f2" : "#4a352f", //
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.3s ease",
                  minWidth: "120px",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                {button.label}
              </button>
            ))}
          </div>

          <KPIDashboard activeSection={activeSection} />
          <ProductivityMeasures activeSection={activeSection} />
          <UnitCost activeSection={activeSection} />
          <OrderFulfillment activeSection={activeSection} />
          <TechStackUsage activeSection={activeSection} />
          <ProcessAutomation activeSection={activeSection} />
          <CustomerRetention activeSection={activeSection} />
        </div>
      </div>
    </div>
  )
}

export default OperationalStrength
