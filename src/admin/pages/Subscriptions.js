"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  User,
  Building2,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Mail,
  DollarSign,
  CreditCard,
  Award,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Target,
  Zap,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  Save,
} from "lucide-react"
import styles from "./subscriptions.module.css"

function Subscriptions() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tierFilter, setTierFilter] = useState("all")
  const [selectedSubscription, setSelectedSubscription] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [activeTab, setActiveTab] = useState("details")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Mock subscription data
  const [subscriptionData, setSubscriptionData] = useState([
    {
      id: 1,
      userId: "user_001",
      userName: "John Doe",
      userEmail: "john@techstart.com",
      companyName: "TechStart Solutions",
      userType: "sme",
      tier: "standard",
      status: "trial",
      price: "R450",
      billingCycle: "monthly",
      startDate: "2024-11-15",
      trialEndDate: "2025-02-15",
      nextBillingDate: "2025-02-15",
      autoRenew: true,
      paymentMethod: "Credit Card",
      features: [
        "Quarterly BIG Score updates",
        "Basic improvement tools",
        "Enhanced profile",
        "Priority matching access"
      ],
      paymentHistory: [
        { date: "2024-11-15", amount: "R0", status: "completed", type: "Trial Started" }
      ],
      usage: {
        bigScoreUpdates: 1,
        maxBigScoreUpdates: 4,
        profileViews: 234,
        matches: 12,
      }
    },
    {
      id: 2,
      userId: "user_002",
      userName: "Sarah Williams",
      userEmail: "sarah@greentech.co.za",
      companyName: "GreenTech Industries",
      userType: "sme",
      tier: "premium",
      status: "active",
      price: "R1200",
      billingCycle: "monthly",
      startDate: "2024-02-01",
      trialEndDate: "2024-05-01",
      nextBillingDate: "2025-01-01",
      autoRenew: true,
      paymentMethod: "Debit Card",
      features: [
        "Full BIG Score toolkit",
        "Premium placement",
        "Funder access",
        "Dedicated support"
      ],
      paymentHistory: [
        { date: "2024-12-01", amount: "R1200", status: "completed", type: "Monthly Payment" },
        { date: "2024-11-01", amount: "R1200", status: "completed", type: "Monthly Payment" },
        { date: "2024-10-01", amount: "R1200", status: "completed", type: "Monthly Payment" },
      ],
      usage: {
        bigScoreUpdates: 8,
        maxBigScoreUpdates: "unlimited",
        profileViews: 1247,
        matches: 45,
      }
    },
    {
      id: 3,
      userId: "user_003",
      userName: "Mike Chen",
      userEmail: "mike@investcorp.com",
      companyName: "InvestCorp Capital",
      userType: "investor",
      tier: "engage",
      status: "active",
      price: "R2000",
      billingCycle: "monthly",
      startDate: "2024-03-15",
      trialEndDate: "2024-06-15",
      nextBillingDate: "2025-01-15",
      autoRenew: true,
      paymentMethod: "Credit Card",
      features: [
        "Full profile access + filters",
        "Smart filters (stage, sector, score)",
        "Join SME deal rooms by invite",
        "Basic insights dashboard"
      ],
      paymentHistory: [
        { date: "2024-12-15", amount: "R2000", status: "completed", type: "Monthly Payment" },
        { date: "2024-11-15", amount: "R2000", status: "completed", type: "Monthly Payment" },
      ],
      usage: {
        profilesViewed: 156,
        dealRoomsJoined: 8,
        connectionsInitiated: 23,
      }
    },
    {
      id: 4,
      userId: "user_004",
      userName: "David Lee",
      userEmail: "david@venturelab.com",
      companyName: "VentureLab Partners",
      userType: "investor",
      tier: "partner",
      status: "active",
      price: "R6500",
      billingCycle: "monthly",
      startDate: "2024-01-10",
      trialEndDate: "2024-04-10",
      nextBillingDate: "2025-01-10",
      autoRenew: true,
      paymentMethod: "Bank Transfer",
      features: [
        "Full access + private deal room",
        "Priority-matching dashboard + alerts",
        "Create private deal rooms & invite SMEs",
        "Full engagement metrics + conversion data",
        "Dedicated account manager"
      ],
      paymentHistory: [
        { date: "2024-12-10", amount: "R6500", status: "completed", type: "Monthly Payment" },
        { date: "2024-11-10", amount: "R6500", status: "completed", type: "Monthly Payment" },
        { date: "2024-10-10", amount: "R6500", status: "completed", type: "Monthly Payment" },
      ],
      usage: {
        profilesViewed: 487,
        dealRoomsCreated: 15,
        dealRoomsJoined: 32,
        connectionsInitiated: 89,
      }
    },
    {
      id: 5,
      userId: "user_005",
      userName: "Emma Johnson",
      userEmail: "emma@startupco.com",
      companyName: "StartupCo",
      userType: "sme",
      tier: "basic",
      status: "active",
      price: "Free",
      billingCycle: "n/a",
      startDate: "2024-10-01",
      trialEndDate: null,
      nextBillingDate: null,
      autoRenew: false,
      paymentMethod: "n/a",
      features: [
        "1 free BIG Score",
        "Basic SME discovery",
        "Community support",
        "Success-fee matching"
      ],
      paymentHistory: [],
      usage: {
        bigScoreUpdates: 1,
        maxBigScoreUpdates: 1,
        profileViews: 45,
        matches: 3,
      }
    },
    {
      id: 6,
      userId: "user_006",
      userName: "Robert Taylor",
      userEmail: "robert@capitalgroup.com",
      companyName: "Capital Group",
      userType: "sponsor",
      tier: "partner",
      status: "active",
      price: "R6500",
      billingCycle: "monthly",
      startDate: "2024-02-20",
      trialEndDate: "2024-05-20",
      nextBillingDate: "2025-01-20",
      autoRenew: true,
      paymentMethod: "Bank Transfer",
      features: [
        "Full access + private deal room",
        "Priority-matching dashboard + alerts",
        "Create private deal rooms & invite SMEs",
        "Full engagement metrics + conversion data",
        "Dedicated account manager"
      ],
      paymentHistory: [
        { date: "2024-12-20", amount: "R6500", status: "completed", type: "Monthly Payment" },
        { date: "2024-11-20", amount: "R6500", status: "completed", type: "Monthly Payment" },
      ],
      usage: {
        profilesViewed: 298,
        dealRoomsCreated: 8,
        dealRoomsJoined: 18,
        connectionsInitiated: 54,
      }
    },
    {
      id: 7,
      userId: "user_007",
      userName: "Lisa Anderson",
      userEmail: "lisa@innovatetech.com",
      companyName: "InnovateTech",
      userType: "sme",
      tier: "standard",
      status: "cancelled",
      price: "R450",
      billingCycle: "monthly",
      startDate: "2024-08-01",
      trialEndDate: "2024-11-01",
      nextBillingDate: null,
      autoRenew: false,
      paymentMethod: "Credit Card",
      features: [
        "Quarterly BIG Score updates",
        "Basic improvement tools",
        "Enhanced profile",
        "Priority matching access"
      ],
      paymentHistory: [
        { date: "2024-11-01", amount: "R450", status: "refunded", type: "Cancellation Refund" },
        { date: "2024-11-01", amount: "R450", status: "completed", type: "Monthly Payment" },
      ],
      usage: {
        bigScoreUpdates: 2,
        maxBigScoreUpdates: 4,
        profileViews: 123,
        matches: 7,
      }
    },
  ])

  // Calculate statistics
  const stats = {
    totalSubscriptions: subscriptionData.length,
    activeSubscriptions: subscriptionData.filter(s => s.status === "active").length,
    trialSubscriptions: subscriptionData.filter(s => s.status === "trial").length,
    cancelledSubscriptions: subscriptionData.filter(s => s.status === "cancelled").length,
    totalMRR: subscriptionData
      .filter(s => s.status === "active" && s.price !== "Free")
      .reduce((acc, s) => acc + parseFloat(s.price.replace("R", "").replace(",", "")), 0),
    smeSubscriptions: subscriptionData.filter(s => s.userType === "sme").length,
    investorSubscriptions: subscriptionData.filter(s => s.userType === "investor").length,
    sponsorSubscriptions: subscriptionData.filter(s => s.userType === "sponsor").length,
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const filteredSubscriptions = subscriptionData.filter((subscription) => {
    const matchesSearch = 
      subscription.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesUserType = userTypeFilter === "all" || subscription.userType === userTypeFilter
    const matchesStatus = statusFilter === "all" || subscription.status === statusFilter
    const matchesTier = tierFilter === "all" || subscription.tier === tierFilter
    
    return matchesSearch && matchesUserType && matchesStatus && matchesTier
  })

  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSubscriptions = filteredSubscriptions.slice(startIndex, endIndex)

  const handleAction = (action, subscription) => {
    switch (action) {
      case "view":
        setSelectedSubscription(subscription)
        setShowViewModal(true)
        setActiveTab("details")
        break
      case "edit":
        setSelectedSubscription(subscription)
        setEditFormData({
          tier: subscription.tier,
          status: subscription.status,
          autoRenew: subscription.autoRenew,
          paymentMethod: subscription.paymentMethod,
        })
        setShowEditModal(true)
        break
      case "upgrade":
        alert(`Upgrading subscription for ${subscription.userName}...`)
        break
      case "downgrade":
        alert(`Downgrading subscription for ${subscription.userName}...`)
        break
      case "cancel":
        if (window.confirm(`Are you sure you want to cancel subscription for ${subscription.userName}?`)) {
          setSubscriptionData(subscriptionData.map(s => 
            s.id === subscription.id ? { ...s, status: "cancelled", autoRenew: false } : s
          ))
        }
        break
      default:
        break
    }
  }

  const handleEditSave = () => {
    setSubscriptionData(subscriptionData.map(sub => 
      sub.id === selectedSubscription.id 
        ? { 
            ...sub, 
            ...editFormData,
          } 
        : sub
    ))
    setShowEditModal(false)
    setSelectedSubscription(null)
    setEditFormData({})
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: styles.statusActive,
      trial: styles.statusTrial,
      cancelled: styles.statusCancelled,
      expired: styles.statusExpired,
      pending: styles.statusPending,
    }
    
    return (
      <span className={`${styles.statusBadge} ${statusStyles[status] || ""}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getTierBadge = (tier, userType) => {
    const tierStyles = {
      basic: styles.tierBasic,
      standard: styles.tierStandard,
      premium: styles.tierPremium,
      discover: styles.tierBasic,
      engage: styles.tierStandard,
      partner: styles.tierPremium,
    }
    
    return (
      <span className={`${styles.tierBadge} ${tierStyles[tier] || ""}`}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    )
  }

  const getUserTypeIcon = (userType) => {
    switch(userType) {
      case "sme":
        return <Building2 size={16} />
      case "investor":
        return <TrendingUp size={16} />
      case "sponsor":
        return <Award size={16} />
      default:
        return <User size={16} />
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const TabContent = ({ tab, subscription }) => {
    switch (tab) {
      case "details":
        return (
          <div className={styles.tabContent}>
            <div className={styles.detailsSection}>
              <div className={styles.detailsGrid}>
                <div className={styles.detailCard}>
                  <h4>Subscription Information</h4>
                  <div className={styles.detailItem}>
                    <span>User Type:</span>
                    <span className={styles.detailValue}>
                      {getUserTypeIcon(subscription.userType)}
                      {subscription.userType.toUpperCase()}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span>Tier:</span>
                    <span>{getTierBadge(subscription.tier, subscription.userType)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span>Status:</span>
                    <span>{getStatusBadge(subscription.status)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span>Price:</span>
                    <span className={styles.priceValue}>{subscription.price}{subscription.billingCycle !== "n/a" ? ` / ${subscription.billingCycle}` : ""}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span>Auto Renew:</span>
                    <span>{subscription.autoRenew ? "✓ Yes" : "✗ No"}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span>Payment Method:</span>
                    <span>{subscription.paymentMethod}</span>
                  </div>
                </div>

                <div className={styles.detailCard}>
                  <h4>Important Dates</h4>
                  <div className={styles.detailItem}>
                    <span>Start Date:</span>
                    <span>{formatDate(subscription.startDate)}</span>
                  </div>
                  {subscription.trialEndDate && (
                    <div className={styles.detailItem}>
                      <span>Trial End Date:</span>
                      <span>{formatDate(subscription.trialEndDate)}</span>
                    </div>
                  )}
                  {subscription.nextBillingDate && (
                    <div className={styles.detailItem}>
                      <span>Next Billing Date:</span>
                      <span>{formatDate(subscription.nextBillingDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.featuresCard}>
                <h4>Plan Features</h4>
                <ul className={styles.featuresList}>
                  {subscription.features.map((feature, index) => (
                    <li key={index}>
                      <CheckCircle size={16} className={styles.checkIcon} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )
      case "usage":
        return (
          <div className={styles.tabContent}>
            <div className={styles.usageSection}>
              <h3>Usage Statistics</h3>
              <div className={styles.usageGrid}>
                {subscription.userType === "sme" ? (
                  <>
                    <div className={styles.usageCard}>
                      <div className={styles.usageIcon}>
                        <Target size={24} />
                      </div>
                      <div className={styles.usageValue}>
                        {subscription.usage.bigScoreUpdates} / {subscription.usage.maxBigScoreUpdates}
                      </div>
                      <div className={styles.usageLabel}>BIG Score Updates</div>
                    </div>
                    <div className={styles.usageCard}>
                      <div className={styles.usageIcon}>
                        <Eye size={24} />
                      </div>
                      <div className={styles.usageValue}>{subscription.usage.profileViews}</div>
                      <div className={styles.usageLabel}>Profile Views</div>
                    </div>
                    <div className={styles.usageCard}>
                      <div className={styles.usageIcon}>
                        <Users size={24} />
                      </div>
                      <div className={styles.usageValue}>{subscription.usage.matches}</div>
                      <div className={styles.usageLabel}>Total Matches</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.usageCard}>
                      <div className={styles.usageIcon}>
                        <Eye size={24} />
                      </div>
                      <div className={styles.usageValue}>{subscription.usage.profilesViewed}</div>
                      <div className={styles.usageLabel}>Profiles Viewed</div>
                    </div>
                    {subscription.usage.dealRoomsCreated !== undefined && (
                      <div className={styles.usageCard}>
                        <div className={styles.usageIcon}>
                          <Package size={24} />
                        </div>
                        <div className={styles.usageValue}>{subscription.usage.dealRoomsCreated}</div>
                        <div className={styles.usageLabel}>Deal Rooms Created</div>
                      </div>
                    )}
                    <div className={styles.usageCard}>
                      <div className={styles.usageIcon}>
                        <Zap size={24} />
                      </div>
                      <div className={styles.usageValue}>{subscription.usage.dealRoomsJoined}</div>
                      <div className={styles.usageLabel}>Deal Rooms Joined</div>
                    </div>
                    <div className={styles.usageCard}>
                      <div className={styles.usageIcon}>
                        <Users size={24} />
                      </div>
                      <div className={styles.usageValue}>{subscription.usage.connectionsInitiated}</div>
                      <div className={styles.usageLabel}>Connections Made</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      case "payments":
        return (
          <div className={styles.tabContent}>
            <div className={styles.paymentsSection}>
              <h3>Payment History</h3>
              {subscription.paymentHistory.length > 0 ? (
                <div className={styles.paymentsTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscription.paymentHistory.map((payment, index) => (
                        <tr key={index}>
                          <td>{formatDate(payment.date)}</td>
                          <td className={styles.amountCell}>{payment.amount}</td>
                          <td>{payment.type}</td>
                          <td>{getStatusBadge(payment.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <CreditCard size={48} />
                  <p>No payment history available</p>
                </div>
              )}
            </div>
          </div>
        )
      default:
        return <div>Content not found</div>
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Subscriptions...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Subscriptions</h1>
          <p className={styles.subtitle}>Manage all subscription plans and billing</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionButton} onClick={() => alert("Export functionality coming soon!")}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Package size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.totalSubscriptions}</div>
            <div className={styles.statLabel}>Total Subscriptions</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.activeSubscriptions}</div>
            <div className={styles.statLabel}>Active Subscriptions</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Clock size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.trialSubscriptions}</div>
            <div className={styles.statLabel}>Trial Subscriptions</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <DollarSign size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>R{stats.totalMRR.toLocaleString()}</div>
            <div className={styles.statLabel}>Monthly Recurring Revenue</div>
          </div>
        </div>
      </div>

      {/* User Type Stats */}
      <div className={styles.userTypeStats}>
        <div className={styles.userTypeStat}>
          <Building2 size={20} />
          <span>{stats.smeSubscriptions} SMEs</span>
        </div>
        <div className={styles.userTypeStat}>
          <TrendingUp size={20} />
          <span>{stats.investorSubscriptions} Investors</span>
        </div>
        <div className={styles.userTypeStat}>
          <Award size={20} />
          <span>{stats.sponsorSubscriptions} Sponsors</span>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterContainer}>
          <Filter size={16} />
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Users</option>
            <option value="sme">SMEs</option>
            <option value="investor">Investors</option>
            <option value="sponsor">Sponsors</option>
          </select>
        </div>
        <div className={styles.filterContainer}>
          <Filter size={16} />
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Tiers</option>
            <option value="basic">Basic/Discover</option>
            <option value="standard">Standard/Engage</option>
            <option value="premium">Premium/Partner</option>
          </select>
        </div>
        <div className={styles.filterContainer}>
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Company</th>
              <th>Type</th>
              <th>Tier</th>
              <th>Price</th>
              <th>Status</th>
              <th>Next Billing</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSubscriptions.map((subscription) => (
              <tr key={subscription.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatar}>
                      <span>{subscription.userName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>{subscription.userName}</div>
                      <div className={styles.userEmail}>{subscription.userEmail}</div>
                    </div>
                  </div>
                </td>
                <td>{subscription.companyName}</td>
                <td>
                  <div className={styles.userTypeCell}>
                    {getUserTypeIcon(subscription.userType)}
                    <span>{subscription.userType.toUpperCase()}</span>
                  </div>
                </td>
                <td>{getTierBadge(subscription.tier, subscription.userType)}</td>
                <td className={styles.priceCell}>{subscription.price}</td>
                <td>{getStatusBadge(subscription.status)}</td>
                <td>{formatDate(subscription.nextBillingDate)}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("view", subscription)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleAction("edit", subscription)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    {subscription.status !== "cancelled" && (
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleAction("cancel", subscription)}
                        title="Cancel Subscription"
                      >
                        <X size={16} />
                      </button>
                    )}
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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredSubscriptions.length)} of {filteredSubscriptions.length} results
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

      {/* View Modal */}
      {showViewModal && selectedSubscription && (
        <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>{selectedSubscription.userName}</h2>
                <p>{selectedSubscription.companyName} • {selectedSubscription.userType.toUpperCase()}</p>
              </div>
              <button
                className={styles.closeButton}
                onClick={() => setShowViewModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalTabs}>
              <button
                className={`${styles.tab} ${activeTab === "details" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("details")}
              >
                <Package size={16} />
                Subscription Details
              </button>
              <button
                className={`${styles.tab} ${activeTab === "usage" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("usage")}
              >
                <Target size={16} />
                Usage & Stats
              </button>
              <button
                className={`${styles.tab} ${activeTab === "payments" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("payments")}
              >
                <CreditCard size={16} />
                Payment History
              </button>
            </div>

            <div className={styles.modalBody}>
              <TabContent tab={activeTab} subscription={selectedSubscription} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSubscription && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h2>Edit Subscription: {selectedSubscription.userName}</h2>
                <p>Update subscription settings</p>
              </div>
              <button
                className={styles.closeButton}
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.editForm}>
                <div className={styles.formSection}>
                  <h3>Subscription Settings</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Tier</label>
                      <select
                        value={editFormData.tier || ""}
                        onChange={(e) => setEditFormData({...editFormData, tier: e.target.value})}
                        className={styles.formSelect}
                      >
                        {selectedSubscription.userType === "sme" ? (
                          <>
                            <option value="basic">Basic</option>
                            <option value="standard">Standard</option>
                            <option value="premium">Premium</option>
                          </>
                        ) : (
                          <>
                            <option value="discover">Discover</option>
                            <option value="engage">Engage</option>
                            <option value="partner">Partner</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Status</label>
                      <select
                        value={editFormData.status || ""}
                        onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                        className={styles.formSelect}
                      >
                        <option value="active">Active</option>
                        <option value="trial">Trial</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="expired">Expired</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Payment Method</label>
                      <select
                        value={editFormData.paymentMethod || ""}
                        onChange={(e) => setEditFormData({...editFormData, paymentMethod: e.target.value})}
                        className={styles.formSelect}
                      >
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="PayPal">PayPal</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Auto Renew</label>
                      <select
                        value={editFormData.autoRenew ? "true" : "false"}
                        onChange={(e) => setEditFormData({...editFormData, autoRenew: e.target.value === "true"})}
                        className={styles.formSelect}
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleEditSave}
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Subscriptions