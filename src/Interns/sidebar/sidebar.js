"use client"
import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Home,
  User,
  BarChart,
  HeartHandshake,
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Calendar,
  FileText,
  LifeBuoy,
  Lightbulb,
} from "lucide-react"
import styles from "../../catalyst/CatalystSidebar/AcceleratorSidebar.module.css"
import { auth } from "../../firebaseConfig"
import { db } from "../../firebaseConfig"
import { getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { doc } from "firebase/firestore"
import NeedHelp from "../../NeedHelp2"

function InternSidebar({ companyName }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState({})
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [userName, setUserName] = useState(user ? user.displayName || user.email.split("@")[0] : "User")
  const [date, setDate] = useState(new Date())
  const [showHelpModal, setShowHelpModal] = useState(false)

  const menuItems = [
    { id: "home", label: "Home", icon: <Home size={18} />, route: "/HomePageInterns" },
    { id: "dashboard", label: " My BIG Score", icon: <BarChart size={18} />, route: "/intern-dashboard" },
    {
      id: "profile",
      label: "My Profile",
      icon: <User size={18} />,
      route: "/intern-profile",
    },
      {
      id: "insights",
      label: "BIG Insights",
      icon: <Lightbulb size={18} />,
      route: "/intern-insights",
    },
    {
      id: "matches",
      label: "My Matches",
      icon: <HeartHandshake size={18} />,
      route: "/intern-matches",
    },
  
    {
      id: "documents",
      label: "My Documents",
      icon: <FileText size={18} />,
      route: "/intern-documents",
    },
    {
      id: "messages",
      label: "My Messages",
      icon: <MessageSquare size={18} />,
      route: "/intern-messages",
    },
    {
      id: "calendar",
      label: "My Calendar",
      icon: <Calendar size={18} />,
      route: "/intern-calendar",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={18} />,
      route: "/intern-settings",
    },
  ]

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        try {
          const userDocRef = doc(db, "internProfiles", currentUser.uid)
          const userDocSnap = await getDoc(userDocRef)
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data()
            const registeredName =
              userData.formData?.personalOverview?.fullName ||
              userData.registeredName ||
              currentUser.displayName ||
              currentUser.email.split("@")[0]
            setUserName(registeredName || "Intern")
          } else {
            console.log("User document not found!")
            setUserName(currentUser.displayName || currentUser.email.split("@")[0] || "Intern")
          }
        } catch (error) {
          console.error("Error getting username:", error)
          setUserName(currentUser.displayName || currentUser.email.split("@")[0] || "Intern")
        }
      } else {
        setUserName("ACME INC")
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

  // Sidebar state management - FIXED to use "sidebar-collapsed" class like ProgramSponsorSidebar
  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    // Check initial state
    checkSidebarState()

    // Watch for changes
    const observer = new MutationObserver(checkSidebarState)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

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

  const handleItemClick = (item) => {
    if (item.hasSubmenu) {
      setExpandedMenus((prev) => ({
        [item.id]: !prev[item.id],
      }))
    } else {
      navigate(item.route)
      setExpandedMenus({})
      if (window.innerWidth <= 768) {
        setIsSidebarCollapsed(true)
      }
    }
  }

  const handleSubItemClick = (subItem, e) => {
    e.stopPropagation()
    navigate(subItem.route)
    if (window.innerWidth <= 768) {
      setIsSidebarCollapsed(true)
    }
  }

  // Toggle sidebar collapse state - using the same approach as ProgramSponsorSidebar
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    
    // Update the body class to match the BigInsights component
    if (newState) {
      document.body.classList.add("sidebar-collapsed");
    } else {
      document.body.classList.remove("sidebar-collapsed");
    }
  }

  const getCompanyInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  // Check if menu item is active (only for direct route match)
  const isMenuItemActive = (item) => {
    return location.pathname === item.route
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className={`${styles.mobileToggle} ${isSidebarCollapsed ? styles.collapsed : ""}`}>
        <button onClick={toggleSidebar} className={styles.mobileToggleBtn}>
          {isSidebarCollapsed ? <Menu size={24} /> : <X size={24} />}
          <span className={styles.mobileToggleText}>Menu</span>
        </button>
      </div>

      <div className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ""}`}>
        {/* Toggle Button */}
        <button className={styles.sidebarToggle} onClick={toggleSidebar}>
          {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {/* Header */}
        <div className={styles.companyHeader}>
          <div className={styles.logoCircle}>{getCompanyInitials(userName)}</div>
          {!isSidebarCollapsed && (
            <div className={styles.companyInfo}>
              <div className={styles.companyName}>{userName}</div>
              <div className={styles.dashboardTitle}>Intern Dashboard</div>
            </div>
          )}
        </div>

        {/* Menu */}
        <div className={styles.menuContainer}>
          <nav className={styles.menu} role="navigation">
            {menuItems.map((item, index) => (
              <div
                key={item.id}
                className={`${styles.menuItem}${
                  isMenuItemActive(item) ? ` ${styles.active}` : ""
                }${item.hasSubmenu ? ` ${styles.hasSubmenu}` : ""}${expandedMenus[item.id] ? ` ${styles.expanded}` : ""}
                `}
                style={{
                  "--index": index,
                  backgroundColor: isMenuItemActive(item) ? '#b89f8d' : 'transparent',
                  borderRadius: isMenuItemActive(item) ? '8px' : '0',
                  color: isMenuItemActive(item) ? 'white' : 'inherit'
                }}
                onClick={() => handleItemClick(item)}
              >
                <div className={styles.menuItemWrapper}>
                  <div className={styles.menuIconContainer}>{item.icon}</div>
                  {!isSidebarCollapsed && (
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
                {isSidebarCollapsed && <div className={styles.sidebarTooltip}>{item.label}</div>}
              </div>
            ))}
          </nav>
        </div>

        {/* Help Section */}
        <div className={styles.helpSection} onClick={() => setShowHelpModal(true)}>
          <div className={styles.helpIcon}>
            <LifeBuoy size={18} />
          </div>
          {!isSidebarCollapsed && <span className={styles.helpLabel}>Need Help?</span>}
          {isSidebarCollapsed && <div className={styles.sidebarTooltip}>Need Help?</div>}
        </div>

        {/* Logout */}
        <div className={styles.logoutSection} onClick={() => navigate("/auth")}>
          <div className={styles.logoutIcon}>
            <LogOut size={18} />
          </div>
          {!isSidebarCollapsed && <span className={styles.logoutLabel}>Sign Out</span>}
          {isSidebarCollapsed && <div className={styles.sidebarTooltip}>Sign Out</div>}
        </div>
      </div>

      {/* Need Help Modal */}
      <NeedHelp open={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </>
  )
}

export default InternSidebar