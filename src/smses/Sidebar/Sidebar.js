"use client"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  BarChart,
  Home,
  User,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Handshake,
  ShoppingCart,
  Wrench,
  Calendar,
  CreditCard,
  FileBox,
  Users,
  Building,
  CircleDollarSign,
  BookOpen,
  Mail,
  Menu,
  X,
  HelpCircle,
  PenTool,
  UserCheck,
  GraduationCap,
  Target,
  PieChart,
  Layers,
  Activity,
  Users as PeopleIcon,
  Globe,
  Shield,
  Lightbulb,
} from "lucide-react"
import { auth } from "../../firebaseConfig"
import { db } from "../../firebaseConfig"
import { getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { doc } from "firebase/firestore"
import "./Sidebar.css"

// Custom Funding Icon
const FundingIcon = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const Sidebar = ({ companyName = "Company Name" }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const [expandedMenus, setExpandedMenus] = useState({})
  const [activeItem, setActiveItem] = useState("")
  const [user, setUser] = useState(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userName, setUserName] = useState("User")
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        try {
          const userDocRef = doc(db, "universalProfiles", currentUser.uid)
          const userDocSnap = await getDoc(userDocRef)
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data()
            const registeredName =
              userData.entityOverview?.registeredName ||
              userData.registeredName ||
              currentUser.displayName ||
              currentUser.email?.split("@")[0]
            setUserName(registeredName || "Company")
          } else {
            console.log("User document not found!")
            setUserName(currentUser.displayName || currentUser.email?.split("@")[0] || "Company")
          }
        } catch (error) {
          console.error("Error getting username:", error)
          setUserName(currentUser.displayName || currentUser.email?.split("@")[0] || "Company")
        }
      } else {
        setUserName("ACME INC")
      }
    })
    return () => unsubscribeAuth()
  }, [])

  // Update date every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Load collapsed state from localStorage on component mount
  useEffect(() => {
    const savedCollapsedState = localStorage.getItem("sidebarCollapsed")
    if (savedCollapsedState !== null) {
      setIsCollapsed(JSON.parse(savedCollapsedState))
    }
  }, [])

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed))
    if (isCollapsed) {
      document.body.classList.add("sidebar-collapsed")
    } else {
      document.body.classList.remove("sidebar-collapsed")
    }
  }, [isCollapsed])

  // Update active menu based on current path
  useEffect(() => {
    const path = location.pathname
    setActiveItem(path)
    
    const newExpandedMenus = {}
    menuItems.forEach((item) => {
      if (item.hasSubmenu) {
        // Check if current path matches any submenu item OR starts with the submenu base path
        const isInThisSubmenu = item.subItems.some((sub) => {
          return sub.route === path || path.startsWith(sub.route)
        })
        if (isInThisSubmenu) {
          newExpandedMenus[item.id] = true
        }
      }
    })
    setExpandedMenus(newExpandedMenus)
  }, [location.pathname]) // Removed activeItem dependency to prevent blocking

  const menuItems = [
    { id: "home", label: "Home", icon: <Home size={18} />, route: "/HomePage" },
    {
      id: "profile",
      label: "My Profile",
      icon: <User size={18} />,
      route: "/profile",
    },
    {
      id: "dashboard",
      label: "My BIG Score",
      icon: <BarChart size={18} />,
      route: "/dashboard",
    },
    // {
    //   id: "applications",
    //   label: "My Applications",
    //   icon: <Briefcase size={18} />,
    //   route: "/applications",
    //   hasSubmenu: true,
    //   subItems: [
    //     {
    //       id: "funding-applications",
    //       label: "Funding & Support",
    //       icon: <FundingIcon size={16} />,
    //       route: "/applications/funding",
    //     },
    //     {
    //       id: "product-applications",
    //       label: "Products & Services",
    //       icon: <ShoppingCart size={16} />,
    //       route: "/applications/product",
    //     },
    //     {
    //       id: "advisory-applications",
    //       label: "Advisory/Board Member",
    //       icon: <UserCheck size={16} />,
    //       route: "/applications/advisory",
    //     },
    //     {
    //       id: "intern-application",
    //       label: "Intern",
    //       icon: <GraduationCap size={16} />,
    //       route: "/applications/intern",
    //     },
    //   ],
    // },
    
   
    {
      id: "matches",
      label: "My Matches",
      icon: <Handshake size={18} />,
      route: "/matches",
      hasSubmenu: true,
      subItems: [
        {
          id: "customer-matches",
          label: "Customers",
          icon: <Users size={16} />,
          route: "/customer-matches",
        },
        {
          id: "supplier-matches",
          label: "Suppliers",
          icon: <Building size={16} />,
          route: "/supplier-matches",
        },
        {
          id: "funder-matches",
          label: "Funders",
          icon: <CircleDollarSign size={16} />,
          route: "/funding-matches",
        },
        {
          id: "support-matches",
          label: "Catalysts",
          icon: <HelpCircle size={16} />,
          route: "/support-program-matches",
        },
        {
          id: "advisor-matches",
          label: "Advisors",
          icon: <UserCheck size={16} />,
          route: "/find-advisors",
        },
        {
          id: "intern-matches",
          label: "Intern",
          icon: <GraduationCap size={16} />,
          route: "/intern-matches-page",
        },
      ],
    },
    {
      id: "growth-tools",
      label: "My Growth Suite",
      icon: <Wrench size={18} />,
      route: "/growth",
      hasSubmenu: true,
      subItems: [
        {
          id: "strategy-execution",
          label: "Strategy & Execution",
          icon: <Target size={16} />,
          route: "/Strategy",
        },
        {
          id: "financial-performance",
          label: "Financial Performance",
          icon: <PieChart size={16} />,
          route: "/FinancialPerformance",
        },
        {
          id: "capital-structure",
          label: "Capital Structure & Investment Performance",
          icon: <Layers size={16} />,
          route: "/CapitalStructure",
        },
        {
          id: "operational-strength",
          label: "Operational Performance",
          icon: <Activity size={16} />,
          route: "/OperationalStrength",
        },
        {
          id: "people",
          label: "People",
          icon: <PeopleIcon size={16} />,
          route: "/People",
        },
        {
          id: "social-environmental",
          label: "Social & Environmental Impact",
          icon: <Globe size={16} />,
          route: "/SocialImpact",
        },
        {
          id: "marketing-sales",
          label: "Marketing & Sales Funnel",
          icon: <BarChart size={16} />,
          route: "/MarketingSales",
        },
      
      
      ],
    },
     {
      id: "insights",
      label: "BIG Insights",
      icon: <Lightbulb size={18} />,
      route: "/insights",
    },
      // {
      //     id: "shop-tools",
      //     label: "My Tools and Templates",
      //     icon: <Wrench size={16} />,
      //     route: "/growth/shop",
      //   },
    {
      id: "documents",
      label: "My Documents",
      icon: <FileBox size={18} />,
      route: "/my-documents",
    },
    {
      id: "messages",
      label: "My Messages",
      icon: <Mail size={18} />,
      route: "/messages",
    },
    {
      id: "calendar",
      label: "My Calendar",
      icon: <Calendar size={18} />,
      route: "/calendar",
    },
    {
      id: "billing",
      label: "Billing & Payments",
      icon: <CreditCard size={18} />,
      route: "/billing",
      hasSubmenu: true,
      subItems: [
         {
          id: "billing-info",
          label: "Billing Information",
          icon: <FileText size={16} />,
          route: "/billing/info",
        },
       
        {
          id: "subscriptions",
          label: "Subscriptions",
          icon: <BookOpen size={16} />,
          route: "/billing/subscriptions",
        },
         {
          id: "tool-orders",
          label: "Billing History",
          icon: <PenTool size={16} />,
          route: "/billing/growth-tools-orders",
        },
       
      ],
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={18} />,
      route: "/settings",
    },
  ]

  const handleItemClick = (item) => {
    if (item.hasSubmenu) {
      const newExpandedMenus = { ...expandedMenus }
      newExpandedMenus[item.id] = !expandedMenus[item.id]
      setExpandedMenus(newExpandedMenus)
    } else {
      navigate(item.route)
      setActiveItem(item.route)
      if (window.innerWidth <= 768) {
        setIsCollapsed(true)
      }
    }
  }

  const handleSubItemClick = (subItem, e) => {
    console.log('Clicking:', subItem.label, 'Route:', subItem.route)
    e.stopPropagation()
    
    // Set active immediately to prevent reset
    setActiveItem(subItem.route)
    
    // Keep the parent menu expanded
    const parentMenu = menuItems.find(item => 
      item.hasSubmenu && item.subItems.some(sub => sub.route === subItem.route)
    )
    if (parentMenu) {
      setExpandedMenus(prev => ({
        ...prev,
        [parentMenu.id]: true
      }))
    }
    
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

  // Check if menu item is active (only for direct route match, not submenu)
  const isMenuItemActive = (item) => {
    return activeItem === item.route
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className={`sidebar-mobile-toggle ${isCollapsed ? "sidebar-collapsed" : ""}`}>
        <button onClick={toggleSidebar} className="mobile-toggle-btn">
          {isCollapsed ? <Menu size={24} /> : <X size={24} />}
          <span className="mobile-toggle-text">Menu</span>
        </button>
      </div>
      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`} style={{
        width: isCollapsed ? '70px' : '265px', // Increased from 255px to 280px
        minWidth: isCollapsed ? '70px' : '265px'
      }}>
        {/* Header */}
        <div className="company-header">
          <div className="logo-circle">{getCompanyInitials(userName)}</div>
          {!isCollapsed && (
            <div className="company-info">
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "20px",
                  color: "white",
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                  margin: 0,
                }}
              >
                {userName}
              </div>
              <div className="dashboard-title">SMSE Dashboard</div>
            </div>
          )}
        </div>
        {/* Toggle Button */}
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        {/* Menu */}
        <div className="menu-container">
          <nav className="menu" role="navigation">
            {menuItems.map((item, index) => (
              <div
                key={item.id}
                className={`menu-item ${isMenuItemActive(item) ? "active" : ""} ${
                  item.hasSubmenu ? "has-submenu" : ""
                } ${item.hasSubmenu && expandedMenus[item.id] ? "expanded" : ""}`}
                style={{
                  "--index": index,
                  backgroundColor: isMenuItemActive(item) ? '#b89f8d' : 'transparent',
                  borderRadius: isMenuItemActive(item) ? '8px' : '0',
                  color: isMenuItemActive(item) ? 'white' : 'inherit'
                }}
                onClick={() => handleItemClick(item)}
              >
                <div className="menu-item-wrapper">
                  <div className="menu-icon-container">{item.icon}</div>
                  {!isCollapsed && (
                    <>
                      <span className="menu-label">{item.label}</span>
                      {item.hasSubmenu && (
                        <div className="submenu-toggle">
                          <ChevronDown size={16} className={expandedMenus[item.id] ? "rotated" : ""} />
                        </div>
                      )}
                    </>
                  )}
                </div>
                {/* Tooltip for collapsed state */}
                {isCollapsed && <div className="sidebar-tooltip">{item.label}</div>}
                {/* Submenu */}
                {item.hasSubmenu && expandedMenus[item.id] && !isCollapsed && (
                  <div className="submenu" style={{ paddingLeft: "10px" }}>
                    {item.subItems.map((subItem) => (
                      <div
                        key={subItem.id}
                        className={`submenu-item ${activeItem === subItem.route ? "active" : ""}`}
                        style={{
                          backgroundColor: activeItem === subItem.route ? '#b89f8d' : 'transparent',
                          borderRadius: activeItem === subItem.route ? '6px' : '0',
                          color: activeItem === subItem.route ? 'white' : 'inherit'
                        }}
                        onClick={(e) => handleSubItemClick(subItem, e)}
                      >
                        <div className="submenu-icon">{subItem.icon}</div>
                        <span className="submenu-label">{subItem.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
        {/* Footer - Logout */}
        <div className="logout-section" onClick={() => navigate("/auth")}>
          <div className="logout-icon">
            <LogOut size={18} />
          </div>
          {!isCollapsed && <span className="logout-label">Sign Out</span>}
          {isCollapsed && <div className="sidebar-tooltip">Sign Out</div>}
        </div>
      </div>
    </>
  )
}

export default Sidebar