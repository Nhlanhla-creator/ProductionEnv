import { useState, useEffect, useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  LifeBuoy,
  LogOut,
} from "lucide-react"
import styles from "./Sidebar.module.css"
import NeedHelp from "../../../NeedHelp2"
import { useHeaderProfile } from "../../../hooks/useHeaderProfile"

function Sidebar({ 
  menuItems, 
  userName: propUserName = "User", 
  portalTitle = "Dashboard",
  userCollection = "universalProfiles",
  userNameField = "contactDetails.contactName",
  onLogout,
  storageKey = "sidebarCollapsed",
  autoExpandMenus = {}
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState(autoExpandMenus)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  // Use central hook to fetch profile name when parent doesn't pass it
  const { userName: hookUserName } = useHeaderProfile(userCollection, userNameField, "entityOverview.companyLogo", "User")
  const effectiveUserName = propUserName || hookUserName || "User"

  // Memoize menuItems to prevent unnecessary re-renders
  const memoizedMenuItems = useMemo(() => menuItems, [JSON.stringify(menuItems)])

  // Load collapse state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(storageKey)
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState))
    }
  }, [storageKey])

  // Save collapse state and update body class
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(isCollapsed))
    if (isCollapsed) {
      document.body.classList.add("sidebar-collapsed")
    } else {
      document.body.classList.remove("sidebar-collapsed")
    }
  }, [isCollapsed, storageKey])

  // Update expanded menus when the route changes.
  // Merge route-driven expansions with the existing state so
  // user toggles are preserved instead of being overridden.
  useEffect(() => {
    const currentPath = location.pathname
    const desiredExpansions = {}

    memoizedMenuItems.forEach((item) => {
      if (item.hasSubmenu && item.subItems) {
        const shouldExpand = item.subItems.some(
          (subItem) =>
            currentPath === subItem.route ||
            (subItem.route && currentPath.startsWith(subItem.route + "/"))
        )
        if (shouldExpand) desiredExpansions[item.id] = true
      }
    })

    setExpandedMenus((prev) => {
      const merged = { ...prev, ...desiredExpansions }
      if (JSON.stringify(prev) === JSON.stringify(merged)) return prev
      return merged
    })
  }, [location.pathname, memoizedMenuItems])

  // PERFECT FIX: Only "growth-tools" (My Growth Suite) navigates when clicked
  // All other items work exactly as before (only toggle submenu)
  const handleItemClick = useCallback((item) => {
    if (item.hasSubmenu) {
      // Toggle submenu expansion (for ALL items with submenu)
      setExpandedMenus((prev) => ({
        ...prev,
        [item.id]: !prev[item.id],
      }))
      // ONLY navigate for "growth-tools" (My Growth Suite)
      if (item.id === 'growth-tools' && item.route) {
        navigate(item.route)
      }
    } else if (item.route) {
      // Regular items without submenu navigate normally
      navigate(item.route)
      // Close sidebar on mobile after navigation
      if (window.innerWidth <= 768) {
        setIsCollapsed(true)
      }
    }
  }, [navigate])

  const handleSubItemClick = useCallback((subItem, e) => {
    e.stopPropagation()
    if (subItem.route) {
      navigate(subItem.route)
      // Close sidebar on mobile
      if (window.innerWidth <= 768) {
        setIsCollapsed(true)
      }
    }
  }, [navigate])

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(!isCollapsed)
  }, [isCollapsed])

  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout()
    } else {
      navigate("/auth")
    }
  }, [onLogout, navigate])

  const getInitials = useCallback((name) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }, [])

  const isMenuItemActive = useCallback((item) => {
    return location.pathname === item.route
  }, [location.pathname])

  // Memoize rendered menu items to improve performance
  const renderedMenuItems = useMemo(() => (
    memoizedMenuItems.map((item, index) => (
      <div
        key={item.id}
        className={`${styles.menuItem} ${
          isMenuItemActive(item) ? styles.active : ""
        } ${item.hasSubmenu ? styles.hasSubmenu : ""} ${
          expandedMenus[item.id] ? styles.expanded : ""
        }`}
        style={{ "--index": index }}
        onClick={() => handleItemClick(item)}
      >
        <div className={styles.menuItemWrapper}>
          <div className={styles.menuIconContainer} style={{color: isMenuItemActive(item) && 'white'}}>{item.icon}</div>
          {!isCollapsed && (
            <>
              <span className={styles.menuLabel}>{item.label}</span>
              {item.hasSubmenu && (
                <div className={styles.submenuToggle}>
                  <ChevronDown
                    size={16}
                    className={expandedMenus[item.id] ? styles.rotated : ""}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className={styles.sidebarTooltip}>{item.label}</div>
        )}

        {/* Submenu */}
        {item.hasSubmenu && expandedMenus[item.id] && !isCollapsed && (
          <div className={styles.submenu}>
            {item.subItems?.map((subItem) => (
              <div
                key={subItem.id}
                className={`${styles.submenuItem} ${
                  location.pathname === subItem.route ? styles.active : ""
                }`}
                onClick={(e) => handleSubItemClick(subItem, e)}
              >
                <div className={styles.submenuIcon}>{subItem.icon}</div>
                <span className={styles.submenuLabel}>{subItem.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    ))
  ), [memoizedMenuItems, isCollapsed, expandedMenus, isMenuItemActive, handleItemClick, handleSubItemClick, location.pathname])

  return (
    <>
      {/* Mobile Toggle */}
      <div className={`${styles.mobileToggle} ${isCollapsed ? styles.collapsed : ""}`}>
        <button onClick={toggleSidebar} className={styles.mobileToggleBtn}>
          {isCollapsed ? <Menu size={24} /> : <X size={24} />}
          <span className={styles.mobileToggleText}>Menu</span>
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
        {/* Collapse Toggle */}
        <button className={styles.sidebarToggle} onClick={toggleSidebar}>
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {/* Header */}
        <div className={styles.companyHeader}>
          <div className={styles.logoCircle}>{getInitials(effectiveUserName)}</div>
          {!isCollapsed && (
            <div className={styles.companyInfo}>
              <div className={styles.companyName}>{effectiveUserName}</div>
              <div className={styles.dashboardTitle}>{portalTitle}</div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className={styles.menuContainer}>
          <nav className={styles.menu} role="navigation">
            {renderedMenuItems}
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

      {/* Help Modal */}
      <NeedHelp open={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </>
  )
}

export default Sidebar