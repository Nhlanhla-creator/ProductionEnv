"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Filter,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Target,
  FileText,
  Calendar,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Star,
  Award,
  Zap,
  Lock,
  Megaphone,
  Brain,
  RefreshCw,
} from "lucide-react"
import styles from "./growth-tools-purchased.module.css"

function GrowthToolsPurchased() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("overview")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Mock analytics data
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 156750,
    totalOrders: 342,
    averageOrderValue: 458,
    conversionRate: 3.2,
    monthlyGrowth: 12.5,
    topProducts: [
      { name: "Compliance Gold Package", sales: 89, revenue: 311411 },
      { name: "Legitimacy Premium Package", sales: 67, revenue: 468933 },
      { name: "Business Plan Templates", sales: 124, revenue: 37076 },
      { name: "Fundability Silver Package", sales: 43, revenue: 107457 }
    ],
    categoryBreakdown: [
      { category: "Compliance", sales: 156, revenue: 487350, percentage: 31.1 },
      { category: "Legitimacy", sales: 134, revenue: 602866, percentage: 38.4 },
      { category: "Fundability", sales: 89, revenue: 331411, percentage: 21.1 },
      { category: "PIS", sales: 67, revenue: 146123, percentage: 9.3 }
    ]
  })

  // Mock purchase data
  const [purchaseData, setPurchaseData] = useState([
    {
      id: 1,
      customerName: "TechStart Solutions",
      customerEmail: "john@techstart.com",
      customerType: "SME",
      productName: "Compliance Gold Package",
      productType: "BIG Score Package",
      category: "Compliance",
      tier: "Gold",
      price: "R3,499",
      status: "Completed",
      paymentMethod: "Card",
      purchaseDate: "2024-06-25",
      downloadStatus: "Downloaded",
      support: "Active"
    },
    {
      id: 2,
      customerName: "GreenTech Industries",
      customerEmail: "sarah@greentech.co.za",
      customerType: "SME",
      productName: "Legitimacy Premium Package",
      productType: "BIG Score Package", 
      category: "Legitimacy",
      tier: "Premium",
      price: "R6,999",
      status: "Completed",
      paymentMethod: "EFT",
      purchaseDate: "2024-06-24",
      downloadStatus: "Downloaded",
      support: "Active"
    },
    {
      id: 3,
      customerName: "InnovateCorp",
      customerEmail: "mike@innovate.com",
      customerType: "SME",
      productName: "Business Plan Templates",
      productType: "Template",
      category: "Business Planning",
      tier: "Standard",
      price: "R299",
      status: "Completed",
      paymentMethod: "Card",
      purchaseDate: "2024-06-24",
      downloadStatus: "Downloaded",
      support: "None"
    },
    {
      id: 4,
      customerName: "Capital Ventures",
      customerEmail: "info@capitalventures.com",
      customerType: "Investor",
      productName: "Fundability Silver Package",
      productType: "BIG Score Package",
      category: "Fundability",
      tier: "Silver",
      price: "R2,499",
      status: "Pending",
      paymentMethod: "Card",
      purchaseDate: "2024-06-23",
      downloadStatus: "Pending",
      support: "Pending"
    },
    {
      id: 5,
      customerName: "Future Angels",
      customerEmail: "team@futureangels.com",
      customerType: "Investor",
      productName: "Startup Bundle",
      productType: "Bundle",
      category: "Multiple",
      tier: "Bundle",
      price: "R999",
      status: "Completed",
      paymentMethod: "EFT",
      purchaseDate: "2024-06-23",
      downloadStatus: "Downloaded",
      support: "Active"
    },
    {
      id: 6,
      customerName: "TechAccelerator",
      customerEmail: "info@techaccelerator.co.za",
      customerType: "Catalyst",
      productName: "PIS Gold Package",
      productType: "BIG Score Package",
      category: "PIS",
      tier: "Gold",
      price: "R3,999",
      status: "Completed",
      paymentMethod: "Card",
      purchaseDate: "2024-06-22",
      downloadStatus: "Downloaded",
      support: "Active"
    },
    {
      id: 7,
      customerName: "John Smith Consulting",
      customerEmail: "john.smith@strategyconsult.com",
      customerType: "Advisor",
      productName: "HR Document Templates",
      productType: "Template",
      category: "Human Resources",
      tier: "Standard",
      price: "R399",
      status: "Completed",
      paymentMethod: "Card",
      purchaseDate: "2024-06-21",
      downloadStatus: "Downloaded",
      support: "None"
    },
    {
      id: 8,
      customerName: "AI Startup Solutions",
      customerEmail: "funding@aistart.co.za",
      customerType: "SME",
      productName: "Growth Bundle",
      productType: "Bundle",
      category: "Multiple",
      tier: "Bundle",
      price: "R1,499",
      status: "Refunded",
      paymentMethod: "Card",
      purchaseDate: "2024-06-20",
      downloadStatus: "Revoked",
      support: "Closed"
    }
  ])

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const filteredPurchases = purchaseData.filter((purchase) => {
    const matchesSearch = 
      purchase.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.productName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === "all" || purchase.category === categoryFilter
    const matchesStatus = statusFilter === "all" || purchase.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPurchases = filteredPurchases.slice(startIndex, endIndex)

  const getStatusBadge = (status) => {
    const statusStyles = {
      Completed: styles.statusCompleted,
      Pending: styles.statusPending,
      Refunded: styles.statusRefunded,
      Failed: styles.statusFailed,
    }
    
    return (
      <span className={`${styles.statusBadge} ${statusStyles[status] || ""}`}>
        {status}
      </span>
    )
  }

  const getCustomerTypeBadge = (type) => {
    const typeStyles = {
      SME: styles.typeSME,
      Investor: styles.typeInvestor,
      Catalyst: styles.typeCatalyst,
      Advisor: styles.typeAdvisor,
    }
    
    return (
      <span className={`${styles.typeBadge} ${typeStyles[type] || ""}`}>
        {type}
      </span>
    )
  }

  const getCategoryIcon = (category) => {
    switch(category) {
      case "Compliance": return <Lock size={16} />
      case "Legitimacy": return <Megaphone size={16} />
      case "Fundability": return <TrendingUp size={16} />
      case "PIS": return <Brain size={16} />
      case "Business Planning": return <Target size={16} />
      case "Multiple": return <Package size={16} />
      default: return <FileText size={16} />
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Growth Tools Analytics...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Growth Tools Analytics</h1>
          <p className={styles.subtitle}>Track sales performance and customer purchases</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionButton} onClick={() => alert("Export functionality coming soon!")}>
            <Download size={16} />
            Export Report
          </button>
          <button className={styles.actionButton} onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      <div className={styles.analyticsGrid}>
        <div className={styles.analyticsCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <DollarSign size={20} />
            </div>
            <div className={styles.cardInfo}>
              <h3 className={styles.cardTitle}>Total Revenue</h3>
              <p className={styles.cardValue}>{formatCurrency(analyticsData.totalRevenue)}</p>
              <span className={styles.cardTrend}>
                <TrendingUp size={14} />
                +{analyticsData.monthlyGrowth}% this month
              </span>
            </div>
          </div>
        </div>

        <div className={styles.analyticsCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <ShoppingCart size={20} />
            </div>
            <div className={styles.cardInfo}>
              <h3 className={styles.cardTitle}>Total Orders</h3>
              <p className={styles.cardValue}>{analyticsData.totalOrders}</p>
              <span className={styles.cardTrend}>
                <TrendingUp size={14} />
                +8.2% this month
              </span>
            </div>
          </div>
        </div>

        <div className={styles.analyticsCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <Target size={20} />
            </div>
            <div className={styles.cardInfo}>
              <h3 className={styles.cardTitle}>Avg Order Value</h3>
              <p className={styles.cardValue}>{formatCurrency(analyticsData.averageOrderValue)}</p>
              <span className={styles.cardTrend}>
                <TrendingUp size={14} />
                +5.1% this month
              </span>
            </div>
          </div>
        </div>

        <div className={styles.analyticsCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <Users size={20} />
            </div>
            <div className={styles.cardInfo}>
              <h3 className={styles.cardTitle}>Conversion Rate</h3>
              <p className={styles.cardValue}>{analyticsData.conversionRate}%</p>
              <span className={styles.cardTrend}>
                <TrendingDown size={14} />
                -0.3% this month
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "overview" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <TrendingUp size={16} />
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === "purchases" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("purchases")}
        >
          <ShoppingCart size={16} />
          All Purchases
        </button>
        <button
          className={`${styles.tab} ${activeTab === "products" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <Package size={16} />
          Product Performance
        </button>
        <button
          className={`${styles.tab} ${activeTab === "customers" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("customers")}
        >
          <Users size={16} />
          Customer Insights
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className={styles.overviewContent}>
          {/* Top Products */}
          <div className={styles.topProducts}>
            <h3 className={styles.sectionTitle}>Top Performing Products</h3>
            <div className={styles.productsGrid}>
              {analyticsData.topProducts.map((product, index) => (
                <div key={index} className={styles.productCard}>
                  <div className={styles.productRank}>{index + 1}</div>
                  <div className={styles.productInfo}>
                    <h4 className={styles.productName}>{product.name}</h4>
                    <p className={styles.productStats}>
                      {product.sales} sales • {formatCurrency(product.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className={styles.categoryBreakdown}>
            <h3 className={styles.sectionTitle}>Revenue by Category</h3>
            <div className={styles.categoryGrid}>
              {analyticsData.categoryBreakdown.map((category, index) => (
                <div key={index} className={styles.categoryCard}>
                  <div className={styles.categoryHeader}>
                    <div className={styles.categoryIcon}>
                      {getCategoryIcon(category.category)}
                    </div>
                    <h4 className={styles.categoryName}>{category.category}</h4>
                  </div>
                  <div className={styles.categoryStats}>
                    <p className={styles.categoryRevenue}>{formatCurrency(category.revenue)}</p>
                    <p className={styles.categorySales}>{category.sales} sales</p>
                    <div className={styles.categoryProgress}>
                      <div 
                        className={styles.categoryProgressBar}
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <p className={styles.categoryPercentage}>{category.percentage}% of total</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "purchases" && (
        <div className={styles.purchasesContent}>
          {/* Controls */}
          <div className={styles.controls}>
            <div className={styles.searchContainer}>
              <Search size={20} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search customers, products, or emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.filtersContainer}>
              <div className={styles.filterGroup}>
                <Filter size={16} />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Categories</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Legitimacy">Legitimacy</option>
                  <option value="Fundability">Fundability</option>
                  <option value="PIS">PIS</option>
                  <option value="Business Planning">Business Planning</option>
                  <option value="Multiple">Multiple</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Refunded">Refunded</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Purchases Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Purchase Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentPurchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>
                      <div className={styles.customerCell}>
                        <div className={styles.customerInfo}>
                          <span className={styles.customerName}>{purchase.customerName}</span>
                          <span className={styles.customerEmail}>{purchase.customerEmail}</span>
                        </div>
                        {getCustomerTypeBadge(purchase.customerType)}
                      </div>
                    </td>
                    <td>
                      <div className={styles.productCell}>
                        <span className={styles.productName}>{purchase.productName}</span>
                        <span className={styles.productType}>{purchase.productType} • {purchase.tier}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.categoryCell}>
                        {getCategoryIcon(purchase.category)}
                        <span>{purchase.category}</span>
                      </div>
                    </td>
                    <td className={styles.price}>{purchase.price}</td>
                    <td>{getStatusBadge(purchase.status)}</td>
                    <td>{formatDate(purchase.purchaseDate)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => alert(`Viewing details for order ${purchase.id}`)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => alert(`More actions for order ${purchase.id}`)}
                          title="More Actions"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={styles.pagination}>
            <div className={styles.paginationInfo}>
              Showing {startIndex + 1} to {Math.min(endIndex, filteredPurchases.length)} of {filteredPurchases.length} results
            </div>
            <div className={styles.paginationControls}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={styles.paginationBtn}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <span className={styles.pageNumber}>
                {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={styles.paginationBtn}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className={styles.productsContent}>
          <h3 className={styles.sectionTitle}>Product Performance Analysis</h3>
          <div className={styles.comingSoon}>
            <Package size={48} />
            <h4>Product Analytics Coming Soon</h4>
            <p>Detailed product performance metrics and insights will be available here.</p>
          </div>
        </div>
      )}

      {activeTab === "customers" && (
        <div className={styles.customersContent}>
          <h3 className={styles.sectionTitle}>Customer Insights</h3>
          <div className={styles.comingSoon}>
            <Users size={48} />
            <h4>Customer Analytics Coming Soon</h4>
            <p>Customer behavior analysis and segmentation insights will be available here.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default GrowthToolsPurchased