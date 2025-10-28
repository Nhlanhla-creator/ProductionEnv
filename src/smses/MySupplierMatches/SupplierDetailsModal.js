"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
    Building,
    Users,
    Mail,
    Phone,
    MapPin,
    Shield,
    Package,
    FileText,
    Award,
    Calendar,
    DollarSign,
    Globe,
    X,
    ExternalLink
} from "lucide-react"

const SupplierDetailsModal = ({ supplier, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState("overview")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!isOpen || !supplier || !mounted) return null

    // Helper functions
    const formatLabel = (value) => {
        if (!value) return "Not specified"
        return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    }

    const formatArray = (arr) => {
        if (!arr) return "None"
        if (!Array.isArray(arr)) {
            // If it's not an array, try to handle different cases
            if (typeof arr === 'string') return arr
            if (typeof arr === 'object') {
                try {
                    // If it's an object, try to extract values
                    const values = Object.values(arr)
                    return values.length > 0 ? values.join(" • ") : "None"
                } catch {
                    return "None"
                }
            }
            return "None"
        }
        if (arr.length === 0) return "None"

        // Handle array of objects - try to extract names or values
        if (typeof arr[0] === 'object') {
            const names = arr.map(item => item.name || item.value || JSON.stringify(item)).filter(Boolean)
            return names.length > 0 ? names.join(" • ") : "None"
        }

        return arr.join(" • ")
    }

    const formatBoolean = (value) => (value ? "Yes" : "No")

    const getFirstCategory = (productsServices) => {
        if (!productsServices) return "Not specified"

        if (Array.isArray(productsServices.productCategories) && productsServices.productCategories.length > 0) {
            const firstProductCat = productsServices.productCategories[0]
            return typeof firstProductCat === "string" ? firstProductCat : firstProductCat?.name || "Not specified"
        }

        if (Array.isArray(productsServices.serviceCategories) && productsServices.serviceCategories.length > 0) {
            const firstServiceCat = productsServices.serviceCategories[0]
            return typeof firstServiceCat === "string" ? firstServiceCat : firstServiceCat?.name || "Not specified"
        }

        return "Not specified"
    }

    const calculateOwnershipPercentages = (ownershipManagement) => {
        const result = {
            blackOwnership: 0,
            womenOwnership: 0,
            youthOwnership: 0,
            disabilityOwnership: 0,
            totalShares: 0,
        }

        const shareholders = Array.isArray(ownershipManagement?.shareholders) ? ownershipManagement.shareholders : []

        shareholders.forEach((shareholder) => {
            const shareholding = parseInt(shareholder.shareholding || "0") || 0
            result.totalShares += shareholding

            if (shareholder.race && shareholder.race.toLowerCase() === "black") {
                result.blackOwnership += shareholding
            }
            if (shareholder.gender && shareholder.gender.toLowerCase() === "female") {
                result.womenOwnership += shareholding
            }
            if (shareholder.isYouth === true) {
                result.youthOwnership += shareholding
            }
            if (shareholder.isDisabled === true) {
                result.disabilityOwnership += shareholding
            }
        })

        if (result.totalShares > 0) {
            result.blackOwnership = (result.blackOwnership / result.totalShares) * 100
            result.womenOwnership = (result.womenOwnership / result.totalShares) * 100
            result.youthOwnership = (result.youthOwnership / result.totalShares) * 100
            result.disabilityOwnership = (result.disabilityOwnership / result.totalShares) * 100
        }

        return result
    }

    const ownershipPercentages = calculateOwnershipPercentages(supplier.ownershipManagement || {})

    // Tabs configuration
    const tabs = [
        { id: "overview", label: "Overview", icon: Building },
        { id: "products", label: "Products & Services", icon: Package },
        { id: "compliance", label: "Compliance", icon: Shield },
        { id: "ownership", label: "Ownership", icon: Users },
        { id: "contact", label: "Contact", icon: Mail },
    ]

    return createPortal(
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                {/* Header */}
                <div style={modalHeaderStyle}>
                    <div style={headerContentStyle}>
                        <div style={supplierHeaderStyle}>
                            <h2 style={supplierNameStyle}>
                                {supplier.entityOverview?.tradingName || supplier.entityOverview?.registeredName}
                            </h2>
                            <div style={supplierMetaStyle}>
                                <span style={entityTypeStyle}>{supplier.entityOverview?.entityType}</span>
                                <span style={locationStyle}>
                                    <MapPin size={14} />
                                    {supplier.entityOverview?.location || "Location not specified"}
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
                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}>
                                        <Building size={18} />
                                        Business Information
                                    </h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Registered Name" value={supplier.entityOverview?.registeredName} />
                                        <InfoItem label="Trading Name" value={supplier.entityOverview?.tradingName} />
                                        <InfoItem label="Registration Number" value={supplier.entityOverview?.registrationNumber} />
                                        <InfoItem label="Entity Size" value={supplier.entityOverview?.entitySize} />
                                        <InfoItem label="Years in Operation" value={supplier.entityOverview?.yearsInOperation} />
                                        <InfoItem label="Employee Count" value={supplier.entityOverview?.employeeCount} />
                                    </div>
                                </div>

                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}>
                                        <Award size={18} />
                                        Sector & Specialization
                                    </h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem
                                            label="Economic Sectors"
                                            value={formatArray(
                                                Array.isArray(supplier.entityOverview?.economicSectors)
                                                    ? supplier.entityOverview.economicSectors
                                                    : supplier.entityOverview?.economicSectors
                                                        ? [supplier.entityOverview.economicSectors]
                                                        : []
                                            )}
                                        />
                                        <InfoItem
                                            label="Primary Category"
                                            value={getFirstCategory(supplier.productsServices)}
                                        />
                                        <InfoItem
                                            label="Target Market"
                                            value={supplier.productsServices?.targetMarket}
                                        />
                                    </div>
                                    {supplier.entityOverview?.businessDescription && (
                                        <div style={descriptionStyle}>
                                            <strong>Business Description:</strong>
                                            <p>{supplier.entityOverview.businessDescription}</p>
                                        </div>
                                    )}
                                </div>

                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}>
                                        <DollarSign size={18} />
                                        Financial Overview
                                    </h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem
                                            label="Annual Revenue"
                                            value={supplier.financialOverview?.annualRevenue}
                                        />
                                        <InfoItem
                                            label="Funding Stage"
                                            value={supplier.applicationOverview?.fundingStage}
                                        />
                                    </div>
                                </div>

                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}>
                                        <Calendar size={18} />
                                        Operational Details
                                    </h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem
                                            label="Financial Year End"
                                            value={supplier.entityOverview?.financialYearEnd}
                                        />
                                        <InfoItem
                                            label="Operation Stage"
                                            value={formatLabel(supplier.entityOverview?.operationStage)}
                                        />
                                        <InfoItem
                                            label="Delivery Modes"
                                            value={formatArray(
                                                Array.isArray(supplier.productsServices?.deliveryModes)
                                                    ? supplier.productsServices.deliveryModes
                                                    : supplier.productsServices?.deliveryModes
                                                        ? [supplier.productsServices.deliveryModes]
                                                        : []
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products & Services Tab */}
                    {activeTab === "products" && (
                        <div style={tabContentStyle}>
                            {/* Product Categories */}
                            <div style={sectionStyle}>
                                <h3 style={sectionTitleStyle}>Product Categories</h3>
                                {supplier.productsServices?.productCategories && supplier.productsServices.productCategories.length > 0 ? (
                                    <div style={categoriesGridStyle}>
                                        {supplier.productsServices.productCategories.map((category, index) => (
                                            <div key={index} style={categoryCardStyle}>
                                                <h4 style={categoryTitleStyle}>
                                                    {typeof category === 'string' ? category : category.name}
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
                                ) : (
                                    <div style={emptyStateStyle}>No product categories specified</div>
                                )}
                            </div>

                            {/* Service Categories */}
                            <div style={sectionStyle}>
                                <h3 style={sectionTitleStyle}>Service Categories</h3>
                                {supplier.productsServices?.serviceCategories && supplier.productsServices.serviceCategories.length > 0 ? (
                                    <div style={categoriesGridStyle}>
                                        {supplier.productsServices.serviceCategories.map((category, index) => (
                                            <div key={index} style={categoryCardStyle}>
                                                <h4 style={categoryTitleStyle}>
                                                    {typeof category === 'string' ? category : category.name}
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
                                ) : (
                                    <div style={emptyStateStyle}>No service categories specified</div>
                                )}
                            </div>

                            {/* Key Clients */}
                            {supplier.productsServices?.keyClients && supplier.productsServices.keyClients.length > 0 && (
                                <div style={sectionStyle}>
                                    <h3 style={sectionTitleStyle}>Key Clients</h3>
                                    <div style={clientsGridStyle}>
                                        {supplier.productsServices.keyClients.map((client, index) => (
                                            <div key={index} style={clientCardStyle}>
                                                <strong>{client.name}</strong>
                                                {client.industry && <span>{client.industry}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Compliance Tab */}
                    {activeTab === "compliance" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}>
                                        <Shield size={18} />
                                        Legal Compliance
                                    </h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="B-BBEE Level" value={supplier.legalCompliance?.bbbeeLevel} />
                                        <InfoItem label="Tax Number" value={supplier.legalCompliance?.taxNumber} />
                                        <InfoItem label="VAT Number" value={supplier.legalCompliance?.vatNumber} />
                                        <InfoItem label="CIPC Status" value={supplier.legalCompliance?.cipcStatus} />
                                        <InfoItem label="UIF Status" value={supplier.legalCompliance?.uifStatus} />
                                        <InfoItem label="COIDA Number" value={supplier.legalCompliance?.coidaNumber} />
                                    </div>
                                </div>

                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}>
                                        <Award size={18} />
                                        Certifications & Accreditations
                                    </h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem
                                            label="Industry Accreditations"
                                            value={formatArray(
                                                Array.isArray(supplier.legalCompliance?.industryAccreditations)
                                                    ? supplier.legalCompliance.industryAccreditations
                                                    : supplier.legalCompliance?.industryAccreditations
                                                        ? [supplier.legalCompliance.industryAccreditations]
                                                        : []
                                            )}
                                        />
                                        <InfoItem
                                            label="B-BBEE Certificate Renewal"
                                            value={supplier.legalCompliance?.bbbeeCertRenewalDate}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Ownership Tab */}
                    {activeTab === "ownership" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}>
                                        <Users size={18} />
                                        Ownership Structure
                                    </h3>
                                    <div style={ownershipGridStyle}>
                                        <OwnershipItem
                                            label="Black Ownership"
                                            value={`${ownershipPercentages.blackOwnership.toFixed(1)}%`}
                                        />
                                        <OwnershipItem
                                            label="Women Ownership"
                                            value={`${ownershipPercentages.womenOwnership.toFixed(1)}%`}
                                        />
                                        <OwnershipItem
                                            label="Youth Ownership"
                                            value={`${ownershipPercentages.youthOwnership.toFixed(1)}%`}
                                        />
                                        <OwnershipItem
                                            label="Disability Ownership"
                                            value={`${ownershipPercentages.disabilityOwnership.toFixed(1)}%`}
                                        />
                                    </div>
                                </div>

                                {/* Shareholders */}
                                {supplier.ownershipManagement?.shareholders && supplier.ownershipManagement.shareholders.length > 0 && (
                                    <div style={infoCardStyle}>
                                        <h3 style={cardTitleStyle}>Shareholders</h3>
                                        <div style={tableContainerStyle}>
                                            <table style={tableStyle}>
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Shareholding</th>
                                                        <th>Race</th>
                                                        <th>Gender</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {supplier.ownershipManagement.shareholders.map((shareholder, index) => (
                                                        <tr key={index}>
                                                            <td>{shareholder.name}</td>
                                                            <td>{shareholder.shareholding}%</td>
                                                            <td>{shareholder.race}</td>
                                                            <td>{shareholder.gender}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Contact Tab */}
                    {activeTab === "contact" && (
                        <div style={tabContentStyle}>
                            <div style={gridStyle}>
                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}>
                                        <Users size={18} />
                                        Primary Contact
                                    </h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Contact Name" value={supplier.contactDetails?.contactName} />
                                        <InfoItem label="Email" value={supplier.contactDetails?.email} />
                                        <InfoItem label="Phone" value={supplier.contactDetails?.businessPhone} />
                                        <InfoItem label="Mobile" value={supplier.contactDetails?.mobile} />
                                    </div>
                                </div>

                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}>
                                        <MapPin size={18} />
                                        Address
                                    </h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Physical Address" value={supplier.contactDetails?.physicalAddress} />
                                        <InfoItem label="Postal Address" value={
                                            supplier.contactDetails?.sameAsPhysical
                                                ? "Same as physical address"
                                                : supplier.contactDetails?.postalAddress
                                        } />
                                    </div>
                                </div>

                                <div style={infoCardStyle}>
                                    <h3 style={cardTitleStyle}>
                                        <Globe size={18} />
                                        Online Presence
                                    </h3>
                                    <div style={infoGridStyle}>
                                        <InfoItem label="Website" value={supplier.contactDetails?.website} />
                                        {supplier.contactDetails?.linkedin && (
                                            <div style={linkItemStyle}>
                                                <strong>LinkedIn:</strong>
                                                <a href={supplier.contactDetails.linkedin} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                                                    View Profile <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        )}
                                    </div>
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

// Helper Components
const InfoItem = ({ label, value }) => (
    <div style={infoItemStyle}>
        <strong>{label}:</strong>
        <span>{value || "Not specified"}</span>
    </div>
)

const OwnershipItem = ({ label, value }) => (
    <div style={ownershipItemStyle}>
        <strong>{label}:</strong>
        <span style={ownershipValueStyle}>{value}</span>
    </div>
)

// Styles
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

const supplierHeaderStyle = {
    flex: 1,
}

const supplierNameStyle = {
    margin: "0 0 8px 0",
    fontSize: "24px",
    fontWeight: "700",
}

const supplierMetaStyle = {
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
}

const sectionStyle = {
    marginBottom: "32px",
}

const sectionTitleStyle = {
    fontSize: "20px",
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

const clientsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px",
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

const ownershipGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
}

const ownershipItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    background: "rgba(166, 124, 82, 0.05)",
    borderRadius: "6px",
    border: "1px solid #E8D5C4",
}

const ownershipValueStyle = {
    fontWeight: "600",
    color: "#5D2A0A",
    fontSize: "16px",
}

const tableContainerStyle = {
    overflowX: "auto",
}

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
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
}

const linkStyle = {
    color: "#5D2A0A",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: "500",
}

export default SupplierDetailsModal