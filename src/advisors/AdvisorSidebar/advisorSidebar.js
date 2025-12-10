"use client"
import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Home,
  User,
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
import styles from "./advisor-sidebar.module.css"
import { auth } from "../../firebaseConfig"
import { db } from "../../firebaseConfig"
import { getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { doc } from "firebase/firestore"
import NeedHelp from "../../NeedHelp2"

function AdvisorSidebar({ companyName }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState({})
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userName, setUserName] = useState(user ? user.displayName || user.email.split("@")[0] : "User")
  const [date, setDate] = useState(new Date())
  const [showHelpModal, setShowHelpModal] = useState(false)
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
          const userDocRef = doc(db, "advisorProfiles", currentUser.uid)
          const userDocSnap = await getDoc(userDocRef)
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data()
            const registeredName =
              userData.formData.entityOverview?.registeredName ||
              userData.registeredName ||
              currentUser.displayName ||
              currentUser.email.split("@")[0]
            setUserName(registeredName || "Advisor")
          } else {
            console.log("User document not found!")
            setUserName(currentUser.displayName || currentUser.email.split("@")[0] || "Advisor")
          }
        } catch (error) {
          console.error("Error getting username:", error)
          setUserName(currentUser.displayName || currentUser.email.split("@")[0] || "Advisor")
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

  useEffect(() => {
    const savedCollapsedState = localStorage.getItem("advisorSidebarCollapsed")
    if (savedCollapsedState !== null) setIsCollapsed(JSON.parse(savedCollapsedState))
  }, [])

  useEffect(() => {
    localStorage.setItem("advisorSidebarCollapsed", JSON.stringify(isCollapsed))
    if (isCollapsed) document.body.classList.add("sidebar-collapsed")
    else document.body.classList.remove("sidebar-collapsed")
  }, [isCollapsed])

  const menuItems = [
    { id: "home", label: "Home", icon: <Home size={18} />, route: "/HomePageAdvisor" },
    {
      id: "profile",
      label: "My Profile",
      icon: <User size={18} />,
      route: "/advisor-profile",
    },
   
    {
      id: "matches",
      label: "My Matches",
      icon: <HeartHandshake size={18} />,
      route: "/advisor-dashboard",
    },
     {
      id: "insights",
      label: "BIG Insights",
      icon: <Lightbulb size={18} />,
      route: "/advisor-insights",
    },
    {
      id: "documents",
      label: "My Documents",
      icon: <FileText size={18} />,
      route: "/advisor-documents",
    },
    {
      id: "messages",
      label: "My Messages",
      icon: <MessageSquare size={18} />,
      route: "/advisor-messages",
    },
    {
      id: "calendar",
      label: "My Calendar",
      icon: <Calendar size={18} />,
      route: "/advisor-calendar",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={18} />,
      route: "/advisor-settings",
    },
  ]

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
              <div className={styles.dashboardTitle}>Advisor Portal</div>
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
                  backgroundColor: isMenuItemActive(item) ? "#b89f8d" : "transparent",
                  borderRadius: isMenuItemActive(item) ? "8px" : "0",
                  color: isMenuItemActive(item) ? "white" : "inherit",
                }}
                onClick={() => handleItemClick(item)}
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
                        style={{
                          backgroundColor: location.pathname === subItem.route ? "#b89f8d" : "transparent",
                          borderRadius: location.pathname === subItem.route ? "6px" : "0",
                          color: location.pathname === subItem.route ? "white" : "inherit",
                        }}
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

        {/* Help Section */}
        <div className={styles.helpSection} onClick={() => setShowHelpModal(true)}>
          <div className={styles.helpIcon}>
            <LifeBuoy size={18} />
          </div>
          {!isCollapsed && <span className={styles.helpLabel}>Need Help?</span>}
          {isCollapsed && <div className={styles.sidebarTooltip}>Need Help?</div>}
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

      {/* Need Help Modal */}
      <NeedHelp open={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </>
  )
}

export default AdvisorSidebar
