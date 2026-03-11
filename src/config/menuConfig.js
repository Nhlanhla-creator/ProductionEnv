import {
  Home,
  User,
  HeartHandshake,
  MessageSquare,
  CreditCard,
  Settings,
  Calendar,
  FileText,
  Lightbulb,
  BarChart,
  DollarSign,
  Repeat,
  Package,
  PieChart,
  Users,
  Building,
  CircleDollarSign,
  HelpCircle,
  UserCheck,
  GraduationCap,
  Wrench,
  Target,
  Activity,
  Globe,
  PenTool,
  Heart,
} from "lucide-react";

export const advisorMenuItems = [
  {
    id: "home",
    label: "Home",
    icon: <Home size={18} />,
    route: "/HomePageAdvisor",
  },
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
];

export const catalystMenuItems = [
  {
    id: "home",
    label: "Home",
    icon: <Home size={18} />,
    route: "/HomePageCatalysts",
  },
  {
    id: "profile",
    label: "My Profile",
    icon: <User size={18} />,
    route: "/support-profile",
  },
  {
    id: "matches",
    label: "My Matches",
    icon: <HeartHandshake size={18} />,
    route: "/support-matches",
  },
  {
    id: "cohorts",
    label: "My Cohorts",
    icon: <Users size={18} />,
    route: "/catalyst/cohorts",
  },
  {
    id: "investments",
    label: "My Portfolio",
    icon: <PieChart size={18} />,
    route: "/catalyst/investments",
  },
  {
    id: "insights",
    label: "BIG Insights",
    icon: <Lightbulb size={18} />,
    route: "/support-insights",
  },
  {
    id: "documents",
    label: "My Documents",
    icon: <FileText size={18} />,
    route: "/support-documents",
  },
  {
    id: "messages",
    label: "My Messages",
    icon: <MessageSquare size={18} />,
    route: "/support-messages",
  },
  {
    id: "calendar",
    label: "My Calendar",
    icon: <Calendar size={18} />,
    route: "/support-calendar",
  },
  {
    id: "billing",
    label: "Billing & Payments",
    icon: <CreditCard size={18} />,
    route: "/support/billing",
    hasSubmenu: true,
    subItems: [
      {
        id: "billing-info",
        label: "Billing Information",
        icon: <DollarSign size={16} />,
        route: "/support/billing/info",
      },
      {
        id: "subscriptions",
        label: "Subscriptions",
        icon: <Repeat size={16} />,
        route: "/support/billing/subscriptions",
      },
      {
        id: "transactions",
        label: "Billing History",
        icon: <Package size={16} />,
        route: "/support/billing/history",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings size={18} />,
    route: "/support-settings",
  },
];
export const internMenuItems = [
  {
    id: "home",
    label: "Home",
    icon: <Home size={18} />,
    route: "/HomePageInterns",
  },
  {
    id: "dashboard",
    label: "My BIG Score",
    icon: <BarChart size={18} />,
    route: "/intern-dashboard",
  },
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
];

export const investorMenuItems = [
  {
    id: "home",
    label: "Home",
    icon: <Home size={18} />,
    route: "/HomePageInvestor",
  },
  {
    id: "profile",
    label: "My Profile",
    icon: <User size={18} />,
    route: "/investor-profile",
  },
  {
    id: "matches",
    label: "My Matches",
    icon: <HeartHandshake size={18} />,
    route: "/investor-matches",
  },
  {
    id: "cohorts",
    label: "My Cohorts",
    icon: <Users size={18} />,
    route: "/my-cohorts",
  },
  {
    id: "portfolio",
    label: "My Portfolio",
    icon: <PieChart size={18} />,
    route: "/my-investments",
  },
  {
    id: "insights",
    label: "BIG Insights",
    icon: <Lightbulb size={18} />,
    route: "/investor-insights",
  },
  {
    id: "documents",
    label: "My Documents",
    icon: <FileText size={18} />,
    route: "/investor-documents",
  },
  {
    id: "messages",
    label: "My Messages",
    icon: <MessageSquare size={18} />,
    route: "/investor-messages",
  },
  {
    id: "calendar",
    label: "My Calendar",
    icon: <Calendar size={18} />,
    route: "/investor-calendar",
  },
  {
    id: "billing",
    label: "Billing & Payments",
    icon: <CreditCard size={18} />,
    route: "/investor/billing",
    hasSubmenu: true,
    subItems: [
      {
        id: "billing-info",
        label: "Billing Information",
        icon: <DollarSign size={16} />,
        route: "/investor/billing/info",
      },
      {
        id: "subscriptions",
        label: "Subscriptions",
        icon: <Repeat size={16} />,
        route: "/investor/billing/subscriptions",
      },
      {
        id: "transactions",
        label: "Billing History",
        icon: <Package size={16} />,
        route: "/investor/billing/history",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings size={18} />,
    route: "/investor-settings",
  },
];

// Add this to your existing config file
export const programSponsorMenuItems = [
  { 
    id: "home", 
    label: "Home", 
    icon: <Home size={18} />, 
    route: "/HomePageProgram" 
  },
  { 
    id: "profile", 
    label: "My Profile", 
    icon: <User size={18} />, 
    route: "/program-sponsor-profile" 
  },
  { 
    id: "insights", 
    label: "BIG Insights", 
    icon: <Lightbulb size={18} />, 
    route: "/program-sponsor-insights" 
  },
  { 
    id: "matches", 
    label: "My Matches", 
    icon: <HeartHandshake size={18} />, 
    route: "/program-sponsor-matches" 
  },
  { 
    id: "documents", 
    label: "My Documents", 
    icon: <FileText size={18} />, 
    route: "/program-sponsor-documents" 
  },
  { 
    id: "messages", 
    label: "My Messages", 
    icon: <MessageSquare size={18} />, 
    route: "/program-sponsor-messages" 
  },
  { 
    id: "calendar", 
    label: "My Calendar", 
    icon: <Calendar size={18} />, 
    route: "/program-sponsor-calendar" 
  },
  {
    id: "billing",
    label: "Billing & Payments",
    icon: <CreditCard size={18} />,
    route: "/program-sponsor/billing",
    hasSubmenu: true,
    subItems: [
      {
        id: "billing-info",
        label: "Billing Information",
        icon: <DollarSign size={16} />,
        route: "/program-sponsor/billing/info",
      },
      {
        id: "subscriptions",
        label: "Subscriptions",
        icon: <Repeat size={16} />,
        route: "/program-sponsor/billing/subscriptions",
      },
      {
        id: "transactions",
        label: "Billing History",
        icon: <Package size={16} />,
        route: "/program-sponsor/billing/history",
      },
    ],
  },
  { 
    id: "settings", 
    label: "Settings", 
    icon: <Settings size={18} />, 
    route: "/program-sponsor-settings" 
  },
];

export const smeMenuItems = [
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
  {
    id: "matches",
    label: "My Matches",
    icon: <HeartHandshake size={18} />,
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
        id: "overall-health",
        label: "Overall Company Health",
        icon: <Heart size={16} />,
        route: "/overall-company-health",
      },
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
        id: "operational-strength",
        label: "Operational Performance",
        icon: <Activity size={16} />,
        route: "/OperationalStrength",
      },
      {
        id: "people",
        label: "People",
        icon: <Users size={16} />,
        route: "/People",
      },
      {
        id: "social-environmental",
        label: "ESG Impact",
        icon: <Globe size={16} />,
        route: "/SocialImpact",
      },
      {
        id: "marketing-sales",
        label: "Marketing & Sales",
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
  {
    id: "documents",
    label: "My Documents",
    icon: <FileText size={18} />,
    route: "/my-documents",
  },
  {
    id: "messages",
    label: "My Messages",
    icon: <MessageSquare size={18} />,
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
        icon: <Repeat size={16} />,
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
];