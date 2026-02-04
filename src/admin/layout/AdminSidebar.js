"use client"
import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Zap,
  Target,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Building2,
  Workflow,
  CreditCard,
  Mail,
  Server,
  Download,
  Shield,
  QrCode,
  Globe,
  Handshake,
  UserPlus,
  ShieldCheck,
  Boxes,
  Cpu,
  Truck,
  Bug,
  FlaskConical,
  BarChart3,
} from "lucide-react"
import styles from "./admin-sidebar.module.css"
import { auth } from "../../firebaseConfig"
import { db } from "../../firebaseConfig"
import { getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { doc } from "firebase/firestore"

function AdminSidebar() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      if (typeof document !== "undefined" && document.body) {
        return document.body.classList.contains("sidebar-collapsed")
      }
      return localStorage.getItem("sidebarOpen") === "false"
    } catch (e) {
      return false
    }
  })
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState({})
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userName, setUserName] = useState("Admin")
  const [date, setDate] = useState(new Date())


    const handleLogout = async () => {
    try {
      await auth.signOut();
      // Clear any session storage
      sessionStorage.clear();
      // Clear any local storage related to auth
      localStorage.removeItem('sidebarCollapsed');
      // Navigate to login
      navigate('/LoginRegister');
    } catch (error) {
      console.error("Error signing out: ", error);
      // You might want to show a toast notification here
      alert('Error signing out. Please try again.');
    }
  };
  
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        try {
          const userDocRef = doc(db, "MyuniversalProfiles", currentUser.uid)
          const userDocSnap = await getDoc(userDocRef)

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data()
            const registeredName =
              userData.formData.entityOverview?.registeredName ||
              userData.registeredName ||
              currentUser.displayName ||
              currentUser.email.split("@")[0]
            setUserName(registeredName || "Admin")
          } else {
            console.log("User document not found!")
            setUserName(currentUser.displayName || currentUser.email.split("@")[0] || "Admin")
          }
        } catch (error) {
          console.error("Error getting username:", error)
          setUserName(currentUser.displayName || currentUser.email.split("@")[0] || "Admin")
        }
      } else {
        setUserName("ADMIN PORTAL")
      }
    })

    return () => unsubscribeAuth()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const savedCollapsedState = localStorage.getItem("adminSidebarCollapsed")
    if (savedCollapsedState !== null) {
      setIsCollapsed(JSON.parse(savedCollapsedState))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", JSON.stringify(isCollapsed))

    if (isCollapsed) {
      document.body.classList.add("admin-sidebar-collapsed")
    } else {
      document.body.classList.remove("admin-sidebar-collapsed")
    }
  }, [isCollapsed])

  useEffect(() => {
    const currentPath = location.pathname
    const newExpandedMenus = {}

    menuItems.forEach((item) => {
      if (item.hasSubmenu) {
        const shouldStayOpen = item.subItems.some(
          (subItem) => currentPath === subItem.route || currentPath.startsWith(subItem.route + "/"),
        )
        if (shouldStayOpen) {
          newExpandedMenus[item.id] = true
        }
      }
    })

    setExpandedMenus(newExpandedMenus)
  }, [location.pathname])

  const menuItems = [
   {
  id: "notion",
  label: "Shared Drive",
  icon: <FileText size={18} />,
  hasSubmenu: true,
  subItems: [
    {
      id: "admin-governance",
      label: "Admin Governance",
      icon: <ShieldCheck size={16} />,
      route: "/admin/notion/governance"
    },
    {
      id: "growth",
      label: "Growth",
      icon: <TrendingUp size={16} />,
      route: "/admin/notion/growth"
    },
    {
      id: "partners-ecosystem",
      label: "Partners Ecosystem",
      icon: <Handshake size={16} />,
      route: "/admin/notion/partners-ecosystem"
    },
    {
      id: "product-platform",
      label: "Product Platform",
      icon: <Boxes size={16} />,
      route: "/admin/notion/product-platform"
    },
    {
      id: "tech-architecture",
      label: "Tech Architecture",
      icon: <Cpu size={16} />,
      route: "/admin/notion/tech-architecture"
    },
    {
      id: "delivery",
      label: "Delivery",
      icon: <Truck size={16} />,
      route: "/admin/notion/delivery"
    },
    {
      id: "qa-testing",
      label: "QA & Testing",
      icon: <Bug size={16} />,
      route: "/admin/notion/qa-testing"
    },
    {
      id: "operations-internal",
      label: "Operations Internal",
      icon: <Settings size={16} />,
      route: "/admin/notion/operations-internal"
    },
    {
      id: "users-marketplace",
      label: "Users Marketplace",
      icon: <Users size={16} />,
      route: "/admin/notion/users-marketplace"
    },
    {
      id: "pilots-case-studies",
      label: "Pilots & Case Studies",
      icon: <FlaskConical size={16} />,
      route: "/admin/notion/pilots-case-studies"
    },
    {
      id: "reporting-analytics",
      label: "Reporting & Analytics",
      icon: <BarChart3 size={16} />,
      route: "/admin/notion/reporting-analytics"
    }
  ]
},
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: <LayoutDashboard size={18} />, 
      route: "/admin/dashboard" 
    },
     { 
      id: "ecosystem", 
      label: "Ecosystem", 
      icon: <Globe size={18} />, 
      hasSubmenu: true,
      subItems: [
        {
      id: "smes",
      label: "All SMEs",
      icon: <Building2 size={18} />,
      route: "/admin/smes",
    },
    {
      id: "investors",
      label: "All Investors",
      icon: <TrendingUp size={18} />,
      route: "/admin/investors",
    },
    {
      id: "catalysts",
      label: "All Catalysts",
      icon: <Zap size={18} />,
      route: "/admin/catalysts",
    },
    {
      id: "advisors",
      label: "All Advisors",
      icon: <Target size={18} />,
      route: "/admin/advisors",
    },
    {
      id: "interns",
      label: "All Interns",
      icon: <UserPlus size={18} />,
      route: "/admin/interns",
    },
    {
      id: "sponsors",
      label: "All Program Sponsors",
      icon: <Handshake size={18} />,
      route: "/admin/sponsors",
    },
      ]
    },
   
    {
      id: "qr-codes",
      label: "QR Codes",
      icon: <QrCode size={18} />,
      route: "/admin/qr-codes",
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      icon: <CreditCard size={18} />,
      route: "/admin/subscriptions",
    },
    {
      id: "documents",
      label: "Growth Tools Analytics",
      icon: <FileText size={18} />,
      route: "/admin/documents",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={18} />,
      hasSubmenu: true,
      subItems: [
        {
          id: "admin-users",
          label: "Admin Users",
          icon: <Users size={16} />,
          route: "/admin/settings/admin-users"
        },
        {
          id: "approval-workflows",
          label: "Approval Workflows",
          icon: <Workflow size={16} />,
          route: "/admin/settings/approval-workflows"
        },
        {
          id: "payment-gateway",
          label: "Payment Gateway",
          icon: <CreditCard size={16} />,
          route: "/admin/settings/payment-gateway"
        },
        {
          id: "email-templates",
          label: "Email Templates",
          icon: <Mail size={16} />,
          route: "/admin/settings/email-templates"
        },
        {
          id: "system-config",
          label: "System Config",
          icon: <Server size={16} />,
          route: "/admin/settings/system-config"
        },
        {
          id: "backup-export",
          label: "Backup & Export",
          icon: <Download size={16} />,
          route: "/admin/settings/backup-export"
        }
      ]
    },
  ]

  const handleItemClick = (item) => {
    if (item.hasSubmenu) {
      setExpandedMenus((prev) => ({
        ...prev,
        [item.id]: !prev[item.id],
      }))
    } else {
      navigate(item.route)
      setExpandedMenus({})

      if (window.innerWidth <= 768) {
        setIsCollapsed(true)
      }
    }
  }

  const handleSubItemClick = (subItem, e) => {
    e.stopPropagation()
    navigate(subItem.route)

    if (window.innerWidth <= 768) {
      setIsCollapsed(true)
    }
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Get company initials for logo
  const getCompanyInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className={`${styles.mobileToggle} ${isCollapsed ? styles.collapsed : ""}`}>
        <button onClick={toggleSidebar} className={styles.mobileToggleBtn}>
          {isCollapsed ? <Menu size={24} /> : <X size={24} />}
          <span className={styles.mobileToggleText}>Menu</span>
        </button>
      </div>

      <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
        {/* Toggle Button */}
        <button className={styles.sidebarToggle} onClick={toggleSidebar}>
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {/* Header */}
        <div className={styles.companyHeader}>
          <div className={styles.logoCircle}>{getCompanyInitials(userName)}</div>
          {!isCollapsed && (
            <div className={styles.companyInfo}>
              <div className={styles.companyName}>{userName}</div>
              <div className={styles.dashboardTitle}>Admin Portal</div>
            </div>
          )}
        </div>

        {/* Menu */}
        <div className={styles.menuContainer}>
          <nav className={styles.menu} role="navigation">
            {menuItems.map((item, index) => (
              <div
                key={item.id}
                className={`
                  ${styles.menuItem}
                  ${
                    location.pathname === item.route ||
                    (item.hasSubmenu && item.subItems?.some((sub) => location.pathname === sub.route))
                      ? styles.active
                      : ""
                  }
                  ${item.hasSubmenu ? styles.hasSubmenu : ""}
                  ${expandedMenus[item.id] ? styles.expanded : ""}
                `}
                onClick={() => handleItemClick(item)}
                style={{ "--index": index }}
              >
                <div className={styles.menuItemWrapper}>
                  <div className={styles.menuIconContainer}>{item.icon}</div>
                  {!isCollapsed && (
                    <>
                      <span className={styles.menuLabel}>{item.label}</span>
                      {item.hasSubmenu && (
                        <div className={styles.submenuToggle}>
                          <ChevronDown size={16} className={expandedMenus[item.id] ? styles.rotated : ""} />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Tooltip for collapsed state */}
                {isCollapsed && <div className={styles.sidebarTooltip}>{item.label}</div>}

                {/* Submenu */}
                {item.hasSubmenu && expandedMenus[item.id] && !isCollapsed && (
                  <div className={styles.submenu}>
                    {item.subItems.map((subItem) => (
                      <div
                        key={subItem.id}
                        className={`${styles.submenuItem} ${location.pathname === subItem.route ? styles.active : ""}`}
                        onClick={(e) => handleSubItemClick(subItem, e)}
                      >
                        <div className={styles.submenuIcon}>{subItem.icon}</div>
                        <span className={styles.submenuLabel}>{subItem.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div className={styles.logoutSection} onClick={handleLogout}>
          <div className={styles.logoutIcon}>
            <LogOut size={18} />
          </div>
          {!isCollapsed && <span className={styles.logoutLabel}>Sign Out</span>}
          {isCollapsed && <div className={styles.sidebarTooltip}>Sign Out</div>}
        </div>
      </div>
    </>
  )
}

export default AdminSidebar