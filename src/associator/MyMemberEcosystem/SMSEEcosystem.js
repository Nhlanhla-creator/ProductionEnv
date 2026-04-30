"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Download,
  Eye,
  X,
  DollarSign,
  Building2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  TrendingUp,
  Users,
  Award,
  Globe,
  Building,
  Shield,
  Package,
  FileText,
  ExternalLink,
  FileCheck,
  Briefcase,
  Layers,
  Truck,
  Target,
  Linkedin,
  AlertTriangle,
  Clock
} from "lucide-react";
import * as XLSX from 'xlsx';

// ---------- MOCK DATA (Placeholder details - No Backend) ----------
const mockSMSEs = [
  {
    id: "1",
    username: "tech_solutions",
    email: "contact@techsolutions.co.za",
    companyName: "Tech Solutions SA",
    industry: "Technology",
    entitySize: "Small",
    location: "Cape Town",
    employees: "25",
    revenue: "R5.2M",
    founded: "2018",
    website: "https://techsolutions.co.za",
    phone: "+27 21 123 4567",
    status: "active",
    createdAt: new Date("2023-06-15"),
    description: "Leading software development company specializing in web and mobile applications for businesses across South Africa.",
    firmType: "Private Company",
    headOfficeLocation: "Cape Town, Western Cape",
    membershipStatus: "Active Member",
    // Selective public information for modal
    entityOverview: {
      registeredName: "Tech Solutions SA (Pty) Ltd",
      tradingName: "Tech Solutions SA",
      registrationNumber: "2018/123456/07",
      entityType: "Private Company",
      entitySize: "Small",
      yearsInOperation: "6 years",
      employeeCount: "25",
      location: "Cape Town",
      economicSectors: ["Technology", "Software Development"],
      businessDescription: "Leading software development company specializing in web and mobile applications for businesses across South Africa.",
      operationStage: "growth",
      financialYearEnd: "February"
    },
    productsServices: {
      offeringType: "both",
      productCategories: [
        {
          categories: ["Software Solutions"],
          products: [
            { name: "Enterprise CRM", description: "Custom CRM for large businesses" },
            { name: "Mobile Apps", description: "Cross-platform mobile applications" }
          ]
        }
      ],
      serviceCategories: [
        {
          categories: ["IT Consulting"],
          services: [
            { name: "Digital Transformation", description: "End-to-end digital strategy" }
          ]
        }
      ],
      targetMarket: "Mid to large enterprises",
      deliveryModes: ["Remote", "On-site"],
      minLeadTime: "2",
      minLeadTimeUnit: "days",
      maxLeadTime: "5",
      maxLeadTimeUnit: "days",
      keyClients: [
        { name: "ABC Corp", industries: ["Finance"], revenuePercentage: "40", revenueGrowthPotential: "Yes", revenueGrowthDetails: "Expanding to new markets" },
        { name: "XYZ Ltd", industries: ["Retail"], revenuePercentage: "35", revenueGrowthPotential: "Yes" }
      ]
    },
    // Public financial info (not private)
    financialOverview: {
      generatesRevenue: "yes",
      annualRevenue: "R5.2M",
      profitabilityStatus: "profitable",
      revenueTrend: "growing"
    },
    // Public contact (non-private)
    contactDetails: {
      contactName: "John Doe",
      email: "contact@techsolutions.co.za",
      businessPhone: "+27 21 123 4567",
      website: "https://techsolutions.co.za",
      linkedin: "https://linkedin.com/company/techsolutions"
    },
    // Documents (publicly available)
    documents: {
      companyProfile: "/docs/tech-solutions-profile.pdf",
      bbbeeCertificate: "/docs/tech-solutions-bbbee.pdf",
      taxClearance: "/docs/tech-solutions-tax.pdf"
    }
  },
  {
    id: "2",
    username: "green_energy",
    email: "info@greenenergy.co.za",
    companyName: "Green Energy Solutions",
    industry: "Manufacturing",
    entitySize: "Medium",
    location: "Johannesburg",
    employees: "85",
    revenue: "R12.8M",
    founded: "2015",
    website: "https://greenenergy.co.za",
    phone: "+27 11 987 6543",
    status: "active",
    createdAt: new Date("2023-08-22"),
    description: "Manufacturing solar panels and renewable energy solutions for residential and commercial properties.",
    firmType: "Private Company",
    headOfficeLocation: "Johannesburg, Gauteng",
    membershipStatus: "Active Member",
    entityOverview: {
      registeredName: "Green Energy Solutions (Pty) Ltd",
      tradingName: "Green Energy Solutions",
      registrationNumber: "2015/789012/07",
      entityType: "Private Company",
      entitySize: "Medium",
      yearsInOperation: "9 years",
      employeeCount: "85",
      location: "Johannesburg",
      economicSectors: ["Manufacturing", "Renewable Energy"],
      businessDescription: "Manufacturing solar panels and renewable energy solutions.",
      operationStage: "expansion",
      financialYearEnd: "December"
    },
    productsServices: {
      offeringType: "products",
      productCategories: [
        {
          categories: ["Solar Panels"],
          products: [
            { name: "Monocrystalline Panel", description: "High efficiency solar panel" },
            { name: "Polycrystalline Panel", description: "Cost-effective solar solution" }
          ]
        }
      ],
      targetMarket: "Residential and Commercial",
      deliveryModes: ["On-site", "Delivery"],
      keyClients: [
        { name: "Eskom", industries: ["Energy"], revenuePercentage: "60", revenueGrowthPotential: "Stable" }
      ]
    },
    financialOverview: {
      generatesRevenue: "yes",
      annualRevenue: "R12.8M",
      profitabilityStatus: "profitable",
      revenueTrend: "growing"
    },
    contactDetails: {
      contactName: "Sarah Johnson",
      email: "info@greenenergy.co.za",
      businessPhone: "+27 11 987 6543",
      website: "https://greenenergy.co.za",
      linkedin: "https://linkedin.com/company/greenenergy"
    },
    documents: {
      companyProfile: "/docs/green-energy-profile.pdf",
      bbbeeCertificate: "/docs/green-energy-bbbee.pdf"
    }
  },
  {
    id: "3",
    username: "retail_hub",
    email: "hello@retailhub.co.za",
    companyName: "Retail Hub",
    industry: "Retail",
    entitySize: "Small",
    location: "Durban",
    employees: "15",
    revenue: "R2.1M",
    founded: "2020",
    website: "https://retailhub.co.za",
    phone: "+27 31 456 7890",
    status: "pending",
    createdAt: new Date("2024-01-10"),
    description: "Online retail platform connecting local artisans with customers across South Africa.",
    firmType: "Sole Proprietorship",
    headOfficeLocation: "Durban, KwaZulu-Natal",
    membershipStatus: "Pending Approval",
    entityOverview: {
      registeredName: "Retail Hub",
      tradingName: "Retail Hub",
      registrationNumber: "2020/345678/07",
      entityType: "Sole Proprietorship",
      entitySize: "Small",
      yearsInOperation: "4 years",
      employeeCount: "15",
      location: "Durban",
      economicSectors: ["Retail", "E-commerce"],
      businessDescription: "Online retail platform connecting local artisans with customers.",
      operationStage: "startup",
      financialYearEnd: "March"
    },
    productsServices: {
      offeringType: "products",
      productCategories: [
        {
          categories: ["Artisan Products"],
          products: [
            { name: "Handmade Crafts", description: "Locally crafted items" },
            { name: "Home Decor", description: "Unique home accessories" }
          ]
        }
      ],
      targetMarket: "Online shoppers",
      deliveryModes: ["Delivery", "Pickup"],
      keyClients: []
    },
    financialOverview: {
      generatesRevenue: "yes",
      annualRevenue: "R2.1M",
      profitabilityStatus: "break_even",
      revenueTrend: "growing"
    },
    contactDetails: {
      contactName: "Lisa Mkhize",
      email: "hello@retailhub.co.za",
      businessPhone: "+27 31 456 7890",
      website: "https://retailhub.co.za"
    },
    documents: {}
  },
  {
    id: "4",
    username: "consult_pro",
    email: "info@consultpro.co.za",
    companyName: "Consult Pro",
    industry: "Services",
    entitySize: "Micro",
    location: "Pretoria",
    employees: "8",
    revenue: "R980K",
    founded: "2021",
    website: "https://consultpro.co.za",
    phone: "+27 12 345 6789",
    status: "active",
    createdAt: new Date("2023-11-05"),
    description: "Business consulting services specializing in SME growth strategies and operational efficiency.",
    firmType: "Close Corporation",
    headOfficeLocation: "Pretoria, Gauteng",
    membershipStatus: "Active Member",
    entityOverview: {
      registeredName: "Consult Pro CC",
      tradingName: "Consult Pro",
      registrationNumber: "2021/901234/23",
      entityType: "Close Corporation",
      entitySize: "Micro",
      yearsInOperation: "3 years",
      employeeCount: "8",
      location: "Pretoria",
      economicSectors: ["Services", "Consulting"],
      businessDescription: "Business consulting services for SME growth.",
      operationStage: "growth",
      financialYearEnd: "August"
    },
    productsServices: {
      offeringType: "services",
      serviceCategories: [
        {
          categories: ["Business Consulting"],
          services: [
            { name: "Strategy Development", description: "Growth strategy formulation" },
            { name: "Operational Efficiency", description: "Process optimization" }
          ]
        }
      ],
      targetMarket: "SMEs",
      deliveryModes: ["Remote", "On-site"],
      keyClients: [
        { name: "Local Chamber of Commerce", industries: ["Non-profit"], revenuePercentage: "25", revenueGrowthPotential: "Moderate" }
      ]
    },
    financialOverview: {
      generatesRevenue: "yes",
      annualRevenue: "R980K",
      profitabilityStatus: "profitable",
      revenueTrend: "stable"
    },
    contactDetails: {
      contactName: "Peter van der Merwe",
      email: "info@consultpro.co.za",
      businessPhone: "+27 12 345 6789",
      website: "https://consultpro.co.za",
      linkedin: "https://linkedin.com/company/consultpro"
    },
    documents: {
      companyProfile: "/docs/consult-pro-profile.pdf"
    }
  },
  {
    id: "5",
    username: "agri_fresh",
    email: "sales@agrifresh.co.za",
    companyName: "Agri Fresh",
    industry: "Services",
    entitySize: "Small",
    location: "Stellenbosch",
    employees: "32",
    revenue: "R7.5M",
    founded: "2017",
    website: "https://agrifresh.co.za",
    phone: "+27 21 876 5432",
    status: "active",
    createdAt: new Date("2023-09-18"),
    description: "Fresh produce distributor serving restaurants and retailers across the Western Cape.",
    firmType: "Private Company",
    headOfficeLocation: "Stellenbosch, Western Cape",
    membershipStatus: "Active Member",
    entityOverview: {
      registeredName: "Agri Fresh (Pty) Ltd",
      tradingName: "Agri Fresh",
      registrationNumber: "2017/567890/07",
      entityType: "Private Company",
      entitySize: "Small",
      yearsInOperation: "7 years",
      employeeCount: "32",
      location: "Stellenbosch",
      economicSectors: ["Agriculture", "Logistics"],
      businessDescription: "Fresh produce distributor serving restaurants and retailers.",
      operationStage: "expansion",
      financialYearEnd: "June"
    },
    productsServices: {
      offeringType: "both",
      productCategories: [
        {
          categories: ["Fresh Produce"],
          products: [
            { name: "Organic Vegetables", description: "Farm-fresh organic vegetables" },
            { name: "Local Fruits", description: "Seasonal fruits from local farms" }
          ]
        }
      ],
      serviceCategories: [
        {
          categories: ["Distribution"],
          services: [
            { name: "Temperature-Controlled Logistics", description: "Cold chain delivery" }
          ]
        }
      ],
      targetMarket: "Restaurants and retailers",
      deliveryModes: ["Delivery"],
      keyClients: [
        { name: "Woolworths", industries: ["Retail"], revenuePercentage: "30", revenueGrowthPotential: "High" },
        { name: "Pick n Pay", industries: ["Retail"], revenuePercentage: "25", revenueGrowthPotential: "Moderate" }
      ]
    },
    financialOverview: {
      generatesRevenue: "yes",
      annualRevenue: "R7.5M",
      profitabilityStatus: "profitable",
      revenueTrend: "growing"
    },
    contactDetails: {
      contactName: "Johannes Groenewald",
      email: "sales@agrifresh.co.za",
      businessPhone: "+27 21 876 5432",
      website: "https://agrifresh.co.za",
      linkedin: "https://linkedin.com/company/agrifresh"
    },
    documents: {
      companyProfile: "/docs/agri-fresh-profile.pdf",
      bbbeeCertificate: "/docs/agri-fresh-bbbee.pdf",
      taxClearance: "/docs/agri-fresh-tax.pdf"
    }
  }
];

const industries = ["Technology", "Manufacturing", "Retail", "Services"];

// ---------- CUSTOMER DETAILS MODAL (Selective Information + Documents Tab) ----------
const CustomerDetailsModal = ({ customer, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState("overview")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!isOpen || !customer || !mounted) return null

    // Helper functions
    const formatLabel = (value) => {
        if (!value) return "Not provided"
        if (typeof value === "boolean") return value ? "Yes" : "No"
        return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    }

    const formatArray = (arr) => {
        if (!arr) return "None"
        if (!Array.isArray(arr)) {
            if (typeof arr === 'string') return arr
            if (typeof arr === 'object') {
                try {
                    const values = Object.values(arr)
                    return values.length > 0 ? values.join(" • ") : "None"
                } catch {
                    return "None"
                }
            }
            return "None"
        }
        if (arr.length === 0) return "None"
        if (typeof arr[0] === 'object') {
            const names = arr.map(item => item.name || item.value || JSON.stringify(item)).filter(Boolean)
            return names.length > 0 ? names.join(" • ") : "None"
        }
        return arr.join(" • ")
    }

    const getOfferingTypeLabel = () => {
        const type = customer.productsServices?.offeringType
        if (type === "products") return "Products only"
        if (type === "services") return "Services only"
        if (type === "both") return "Both products and services"
        return "Not specified"
    }

    // Tabs configuration (added Documents tab at the end)
    const tabs = [
        { id: "overview", label: "Overview", icon: Building },
        { id: "products", label: "Products & Services", icon: Package },
        { id: "financial", label: "Financial", icon: DollarSign },
        { id: "documents", label: "Documents", icon: FileText },
    ]

    const renderDocumentLink = (url, label) => {
        if (!url) return null
        return (
            <div
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "linear-gradient(135deg, #a67c52, #7d5a50)", color: "#faf7f2", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer", maxWidth: "fit-content" }}
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
            >
                <FileText size={16} /><span>{label}</span><ExternalLink size={14} />
            </div>
        )
    }

    return createPortal(
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                {/* Header */}
                <div style={modalHeaderStyle}>
                    <div style={headerContentStyle}>
                        <div style={customerHeaderStyle}>
                            <h2 style={customerNameStyle}>
                                {customer.companyName}
                            </h2>
                            <div style={customerMetaStyle}>
                                <span style={entityTypeStyle}>{customer.firmType || "Not specified"}</span>
                                <span style={locationStyle}>
                                    <MapPin size={14} />
                                    {customer.headOfficeLocation || "Location not specified"}
                                </span>
                                <span style={membershipStatusStyle(customer.membershipStatus)}>
                                    {customer.membershipStatus || "Status Unknown"}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} style={closeButtonStyle}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={tabsContainerStyle}>
                        {tabs.map((tab) => {
                            const IconComponent = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        ...tabStyle,
                                        ...(activeTab === tab.id ? activeTabStyle : {}),
                                    }}
                                >
                                    <IconComponent size={16} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Content */}
                <div style={modalBodyStyle}>
                    {/* Overview Tab - Public business information */}
                    {activeTab === "overview" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}>
                                        <Building size={18} />
                                        Business Information
                                    </h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Registered Name" value={customer.entityOverview?.registeredName} />
                                        <InfoItem label="Trading Name" value={customer.entityOverview?.tradingName} />
                                        <InfoItem label="Registration Number" value={customer.entityOverview?.registrationNumber} />
                                        <InfoItem label="Entity Type" value={customer.entityOverview?.entityType} />
                                        <InfoItem label="Entity Size" value={customer.entityOverview?.entitySize} />
                                        <InfoItem label="Years in Operation" value={customer.entityOverview?.yearsInOperation} />
                                        <InfoItem label="Employee Count" value={customer.entityOverview?.employeeCount} />
                                        <InfoItem label="Location" value={customer.entityOverview?.location} />
                                    </div>
                                    {customer.entityOverview?.businessDescription && (
                                        <div style={descriptionStyle}>
                                            <strong>Business Description:</strong>
                                            <p>{customer.entityOverview.businessDescription}</p>
                                        </div>
                                    )}
                                </div>

                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}>
                                        <Award size={18} />
                                        Sector & Specialization
                                    </h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem
                                            label="Economic Sectors"
                                            value={formatArray(customer.entityOverview?.economicSectors)}
                                        />
                                        <InfoItem
                                            label="Target Market"
                                            value={customer.productsServices?.targetMarket}
                                        />
                                    </div>
                                </div>

                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}>
                                        <Clock size={18} />
                                        Operational Details
                                    </h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem
                                            label="Financial Year End"
                                            value={customer.entityOverview?.financialYearEnd}
                                        />
                                        <InfoItem
                                            label="Operation Stage"
                                            value={formatLabel(customer.entityOverview?.operationStage)}
                                        />
                                        <InfoItem
                                            label="Delivery Modes"
                                            value={formatArray(customer.productsServices?.deliveryModes)}
                                        />
                                    </div>
                                </div>

                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}>
                                        <Users size={18} />
                                        Contact Person
                                    </h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Contact Name" value={customer.contactDetails?.contactName} />
                                        <InfoItem label="Email" value={customer.contactDetails?.email} />
                                        <InfoItem label="Phone" value={customer.contactDetails?.businessPhone} />
                                        {customer.contactDetails?.linkedin && (
                                            <div style={linkItemStyle}>
                                                <strong>LinkedIn:</strong>
                                                <a href={customer.contactDetails.linkedin} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                                                    View Profile <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        )}
                                        {customer.contactDetails?.website && (
                                            <div style={linkItemStyle}>
                                                <strong>Website:</strong>
                                                <a href={customer.contactDetails.website} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                                                    Visit Website <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products & Services Tab */}
                    {activeTab === "products" && (
                        <div style={tabContentStyle}>
                            <div style={infoCardStyle}>
                                <h3 style={cardTitleStyle}>
                                    <Package size={18} />
                                    Offering Type
                                </h3>
                                <div style={infoGridStyle}>
                                    <InfoItem label="Type" value={getOfferingTypeLabel()} />
                                </div>
                            </div>

                            {/* Product Categories */}
                            {customer.productsServices?.productCategories && customer.productsServices.productCategories.length > 0 && (
                                <div style={sectionStyle}>
                                    <h3 style={sectionTitleStyle}>
                                        <Layers size={18} style={{ display: "inline", marginRight: "8px" }} />
                                        Product Categories
                                    </h3>
                                    <div style={categoriesGridStyle}>
                                        {customer.productsServices.productCategories.map((category, index) => (
                                            <div key={index} style={categoryCardStyle}>
                                                <h4 style={categoryTitleStyle}>
                                                    {category.categories?.length > 0 
                                                        ? category.categories.map(c => formatLabel(c)).join(" • ")
                                                        : "Not specified"}
                                                </h4>
                                                {category.products && category.products.length > 0 && (
                                                    <div style={productsListStyle}>
                                                        {category.products.map((product, idx) => (
                                                            <div key={idx} style={productItemStyle}>
                                                                <strong>{product.name}</strong>
                                                                {product.description && (
                                                                    <p style={productDescriptionStyle}>{product.description}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Service Categories */}
                            {customer.productsServices?.serviceCategories && customer.productsServices.serviceCategories.length > 0 && (
                                <div style={sectionStyle}>
                                    <h3 style={sectionTitleStyle}>
                                        <Briefcase size={18} style={{ display: "inline", marginRight: "8px" }} />
                                        Service Categories
                                    </h3>
                                    <div style={categoriesGridStyle}>
                                        {customer.productsServices.serviceCategories.map((category, index) => (
                                            <div key={index} style={categoryCardStyle}>
                                                <h4 style={categoryTitleStyle}>
                                                    {category.categories?.length > 0 
                                                        ? category.categories.map(c => formatLabel(c)).join(" • ")
                                                        : "Not specified"}
                                                </h4>
                                                {category.services && category.services.length > 0 && (
                                                    <div style={productsListStyle}>
                                                        {category.services.map((service, idx) => (
                                                            <div key={idx} style={productItemStyle}>
                                                                <strong>{service.name}</strong>
                                                                {service.description && (
                                                                    <p style={productDescriptionStyle}>{service.description}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Delivery Standards */}
                            {(customer.productsServices?.deliveryModes?.length > 0 || customer.productsServices?.minLeadTime || customer.productsServices?.maxLeadTime) && (
                                <div style={sectionStyle}>
                                    <h3 style={sectionTitleStyle}>
                                        <Truck size={18} style={{ display: "inline", marginRight: "8px" }} />
                                        Delivery Standards
                                    </h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Delivery Modes" value={formatArray(customer.productsServices?.deliveryModes)} />
                                        {(customer.productsServices?.minLeadTime || customer.productsServices?.maxLeadTime) && (
                                            <InfoItem 
                                                label="Lead Time" 
                                                value={
                                                    customer.productsServices?.minLeadTime && customer.productsServices?.maxLeadTime
                                                        ? `${customer.productsServices.minLeadTime} ${customer.productsServices.minLeadTimeUnit || "days"} - ${customer.productsServices.maxLeadTime} ${customer.productsServices.maxLeadTimeUnit || "days"}`
                                                        : customer.productsServices?.minLeadTime
                                                            ? `Minimum ${customer.productsServices.minLeadTime} ${customer.productsServices.minLeadTimeUnit || "days"}`
                                                            : `Maximum ${customer.productsServices.maxLeadTime} ${customer.productsServices.maxLeadTimeUnit || "days"}`
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Target Market */}
                            {customer.productsServices?.targetMarket && (
                                <div style={sectionStyle}>
                                    <h3 style={sectionTitleStyle}>
                                        <Target size={18} style={{ display: "inline", marginRight: "8px" }} />
                                        Target Market
                                    </h3>
                                    <div style={infoCardStyle}>
                                        <span style={fieldValueStyle}>{customer.productsServices.targetMarket}</span>
                                    </div>
                                </div>
                            )}

                            {/* Key Clients */}
                            {customer.productsServices?.keyClients && customer.productsServices.keyClients.length > 0 && (
                                <div style={sectionStyle}>
                                    <h3 style={sectionTitleStyle}>Key Clients / Customers</h3>
                                    {customer.productsServices.keyClients.map((client, index) => (
                                        <div key={index} style={clientCardStyle}>
                                            <strong>{client.name}</strong>
                                            {client.industries && <span>{client.industries.join(" • ")}</span>}
                                            {client.revenuePercentage && <span>{client.revenuePercentage}% of revenue</span>}
                                            {client.revenueGrowthPotential && <span>Growth: {client.revenueGrowthPotential}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Financial Tab - Public financial info (non-private) */}
                    {activeTab === "financial" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}>
                                        <DollarSign size={18} />
                                        Financial Overview
                                    </h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Generates Revenue" value={formatLabel(customer.financialOverview?.generatesRevenue)} />
                                        <InfoItem label="Annual Revenue" value={customer.financialOverview?.annualRevenue} />
                                        <InfoItem label="Profitability Status" value={formatLabel(customer.financialOverview?.profitabilityStatus)} />
                                        <InfoItem label="Revenue Trend" value={formatLabel(customer.financialOverview?.revenueTrend)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Documents Tab - Public documents */}
                    {activeTab === "documents" && (
                        <div style={tabContentStyle}>
                            <div style={infoCardStyle}>
                                <h3 style={cardTitleStyle}>
                                    <FileText size={18} />
                                    Public Documents
                                </h3>
                                <div style={documentsGridStyle}>
                                    {renderDocumentLink(customer.documents?.companyProfile, "Company Profile")}
                                    {renderDocumentLink(customer.documents?.bbbeeCertificate, "B-BBEE Certificate")}
                                    {renderDocumentLink(customer.documents?.taxClearance, "Tax Clearance Certificate")}
                                    {renderDocumentLink(customer.documents?.annualReport, "Annual Report")}
                                    {!customer.documents || Object.keys(customer.documents).length === 0 ? (
                                        <div style={emptyStateStyle}>No documents available</div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}

// Helper Components for Modal
const InfoItem = ({ label, value }) => (
    <div style={infoItemStyle}>
        <strong>{label}:</strong>
        <span>{value || "Not provided"}</span>
    </div>
)

// Modal Styles
const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
}

const modalContentStyle = {
    background: "white",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "900px",
    maxHeight: "90vh",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
}

const modalHeaderStyle = {
    background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
    color: "white",
    padding: "0",
}

const headerContentStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "24px",
}

const customerHeaderStyle = {
    flex: 1,
}

const customerNameStyle = {
    margin: "0 0 8px 0",
    fontSize: "24px",
    fontWeight: "700",
}

const customerMetaStyle = {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
}

const entityTypeStyle = {
    background: "rgba(255, 255, 255, 0.2)",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
}

const membershipStatusStyle = (status) => ({
    background: status === "Active Member" ? "rgba(76, 175, 80, 0.2)" : status === "Pending Approval" ? "rgba(255, 152, 0, 0.2)" : "rgba(255, 255, 255, 0.2)",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
})

const locationStyle = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "14px",
}

const closeButtonStyle = {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "8px",
    padding: "8px",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}

const tabsContainerStyle = {
    display: "flex",
    background: "rgba(255, 255, 255, 0.1)",
    padding: "0 24px",
    flexWrap: "wrap",
}

const tabStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    background: "none",
    border: "none",
    color: "rgba(255, 255, 255, 0.8)",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    borderBottom: "3px solid transparent",
    transition: "all 0.2s ease",
}

const activeTabStyle = {
    color: "white",
    borderBottomColor: "white",
    background: "rgba(255, 255, 255, 0.1)",
}

const modalBodyStyle = {
    padding: "0",
    maxHeight: "calc(90vh - 140px)",
    overflowY: "auto",
}

const tabContentStyle = {
    padding: "24px",
}

const gridStyle = {
    display: "grid",
    gap: "20px",
}

const infoCardStyle = {
    background: "#FEFCFA",
    border: "1px solid #E8D5C4",
    borderRadius: "8px",
    padding: "20px",
}

const cardTitleStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: "0 0 16px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#5D2A0A",
}

const infoGridStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
}

const infoItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
}

const sectionStyle = {
    marginBottom: "24px",
}

const sectionTitleStyle = {
    fontSize: "18px",
    fontWeight: "600",
    color: "#5D2A0A",
    margin: "0 0 16px 0",
    paddingBottom: "8px",
    borderBottom: "2px solid #E8D5C4",
}

const categoriesGridStyle = {
    display: "grid",
    gap: "16px",
}

const categoryCardStyle = {
    background: "#FEFCFA",
    border: "1px solid #E8D5C4",
    borderRadius: "8px",
    padding: "16px",
}

const categoryTitleStyle = {
    margin: "0 0 12px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: "#5D2A0A",
}

const productsListStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
}

const productItemStyle = {
    padding: "8px",
    background: "rgba(166, 124, 82, 0.05)",
    borderRadius: "4px",
}

const productDescriptionStyle = {
    margin: "4px 0 0 0",
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.4",
}

const clientCardStyle = {
    background: "#F5EBE0",
    border: "1px solid #E8D5C4",
    borderRadius: "6px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
}

const descriptionStyle = {
    marginTop: "16px",
    padding: "12px",
    background: "rgba(166, 124, 82, 0.05)",
    borderRadius: "6px",
    border: "1px solid #E8D5C4",
}

const emptyStateStyle = {
    textAlign: "center",
    color: "#999",
    fontStyle: "italic",
    padding: "40px",
    background: "#F9F9F9",
    borderRadius: "8px",
    border: "1px dashed #E8D5C4",
}

const linkItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
}

const linkStyle = {
    color: "#5D2A0A",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: "500",
}

const fieldValueStyle = {
    fontSize: "14px",
    color: "#4a352f",
    fontWeight: "500",
}

const documentsGridStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
}

// ---------- MAIN SMSE ECOSYSTEM COMPONENT ----------
function SMSEEcosystem() {
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [selectedSMSE, setSelectedSMSE] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [smseData] = useState(mockSMSEs);

  const activeCount = smseData.filter(s => s.status === 'active').length;
  const uniqueIndustries = new Set(smseData.map(s => s.industry).filter(i => i !== "Not specified"));
  const stats = { 
    total: smseData.length, 
    active: activeCount, 
    industries: uniqueIndustries.size, 
    avgGrowth: 23.5 
  };

  const filteredSMSEs = smseData.filter((smse) => {
    const matchesSearch =
      smse.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      smse.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      smse.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = industryFilter === "all" || smse.industry === industryFilter;
    const matchesSize = sizeFilter === "all" || smse.entitySize === sizeFilter;
    return matchesSearch && matchesIndustry && matchesSize;
  });

  const totalPages = Math.ceil(filteredSMSEs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSMSEs = filteredSMSEs.slice(startIndex, startIndex + itemsPerPage);

  const exportToExcel = () => {
    const dataToExport = filteredSMSEs.map(smse => ({
      "Business Name": smse.companyName,
      "Firm Type": smse.firmType,
      "Head Office Location": smse.headOfficeLocation,
      "Membership Status": smse.membershipStatus,
      "Email": smse.email,
      "Industry": smse.industry,
      "Entity Size": smse.entitySize,
      "Location": smse.location,
      "Employees": smse.employees,
      "Revenue": smse.revenue,
      "Status": smse.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SMSEs");
    XLSX.writeFile(workbook, `SMSEs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getMembershipStatusBadge = (status) => {
    const statusColors = {
      "Active Member": { background: '#e8f5e8', color: '#2e7d32' },
      "Pending Approval": { background: '#fff3e0', color: '#ed6c02' },
      "Suspended": { background: '#fdeaea', color: '#c62828' }
    };
    const colors = statusColors[status] || statusColors["Active Member"];
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
        background: colors.background,
        color: colors.color,
      }}>
        {status || "Unknown"}
      </span>
    );
  };

  // Styles for main component
  const styles = {
    container: {
      padding: '24px',
      background: '#f5f7fa',
      minHeight: '100vh',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px',
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#4a352f',
      margin: '0 0 8px 0',
    },
    subtitle: {
      color: '#7d5a50',
      margin: 0,
    },
    exportButton: {
      background: '#a67c52',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background 0.2s',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '20px',
      marginBottom: '32px',
    },
    statCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    statIcon: {
      color: '#a67c52',
    },
    statInfo: {
      flex: 1,
    },
    controls: {
      display: 'flex',
      gap: '16px',
      marginBottom: '24px',
      flexWrap: 'wrap',
    },
    searchContainer: {
      flex: 1,
      position: 'relative',
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#7d5a50',
    },
    searchInput: {
      width: '100%',
      padding: '10px 12px 10px 40px',
      border: '1px solid #e0d5c8',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
    },
    filters: {
      display: 'flex',
      gap: '12px',
    },
    filterSelect: {
      padding: '10px 12px',
      border: '1px solid #e0d5c8',
      borderRadius: '8px',
      fontSize: '14px',
      background: 'white',
      cursor: 'pointer',
    },
    tableContainer: {
      background: 'white',
      borderRadius: '12px',
      overflow: 'auto',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '700px',
    },
    companyCell: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    companyAvatar: {
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #a67c52, #7d5a50)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
    },
    companyName: {
      fontWeight: '600',
      color: '#4a352f',
    },
    companyEmail: {
      fontSize: '12px',
      color: '#7d5a50',
    },
    viewBtn: {
      background: 'none',
      border: 'none',
      color: '#a67c52',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px',
      padding: '6px 12px',
      borderRadius: '6px',
      transition: 'background 0.2s',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '16px',
      marginTop: '24px',
    },
    paginationBtn: {
      background: 'white',
      border: '1px solid #e0d5c8',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
    },
    pageNumber: {
      color: '#7d5a50',
      fontSize: '14px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>SMSEs in Ecosystem</h1>
          <p style={styles.subtitle}>Browse and view Small and Medium Enterprises</p>
        </div>
        <button style={styles.exportButton} onClick={exportToExcel}>
          <Download size={16} />
          Export to Excel
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <Building2 size={24} style={styles.statIcon} />
          <div style={styles.statInfo}>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.total}</h3>
            <p style={{ margin: 0, color: '#7d5a50', fontSize: '14px' }}>Total SMSEs</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <CheckCircle size={24} style={styles.statIcon} />
          <div style={styles.statInfo}>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.active}</h3>
            <p style={{ margin: 0, color: '#7d5a50', fontSize: '14px' }}>Active Members</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <TrendingUp size={24} style={styles.statIcon} />
          <div style={styles.statInfo}>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.industries}</h3>
            <p style={{ margin: 0, color: '#7d5a50', fontSize: '14px' }}>Industries</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <Award size={24} style={styles.statIcon} />
          <div style={styles.statInfo}>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#4a352f' }}>{stats.avgGrowth}%</h3>
            <p style={{ margin: 0, color: '#7d5a50', fontSize: '14px' }}>Avg. Growth Rate</p>
          </div>
        </div>
      </div>

      <div style={styles.controls}>
        <div style={styles.searchContainer}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by company name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filters}>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Industries</option>
            {industries.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Sizes</option>
            <option value="Micro">Micro (1-10)</option>
            <option value="Small">Small (11-50)</option>
            <option value="Medium">Medium (51-200)</option>
          </select>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f0e6d9', background: '#faf7f2' }}>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Business Name</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Firm Type</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Head Office Location</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Membership Status</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#4a352f' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSMSEs.map((smse) => (
              <tr key={smse.id} style={{ borderBottom: '1px solid #f0e6d9' }}>
                <td style={{ padding: '16px' }}>
                  <div style={styles.companyCell}>
                    <div style={styles.companyAvatar}>
                      {smse.companyName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={styles.companyName}>{smse.companyName}</div>
                      <div style={styles.companyEmail}>{smse.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{smse.firmType || "Not specified"}</td>
                <td style={{ padding: '16px', color: '#4a352f' }}>{smse.headOfficeLocation || "Not specified"}</td>
                <td style={{ padding: '16px' }}>{getMembershipStatusBadge(smse.membershipStatus)}</td>
                <td style={{ padding: '16px' }}>
                  <button
                    style={styles.viewBtn}
                    onClick={() => {
                      setSelectedSMSE(smse);
                      setShowViewModal(true);
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#faf7f2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <Eye size={16} /> View
                  </button>
                 </td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{ ...styles.paginationBtn, opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span style={styles.pageNumber}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{ ...styles.paginationBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {showViewModal && selectedSMSE && (
        <CustomerDetailsModal 
          customer={selectedSMSE} 
          isOpen={showViewModal} 
          onClose={() => setShowViewModal(false)} 
        />
      )}
    </div>
  );
}

export default SMSEEcosystem;