"use client"
import React, { useState } from 'react'
import { Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'
import FormField from "./form-field"
import './UniversalProfile.css';
import {deliveryModes} from '../ProductApplication/applicationOptions'

const categoryOptions = [
  { value: "Generalist", label: "Generalist" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Automotive", label: "Automotive" },
  { value: "Banking, Finance & Insurance", label: "Banking, Finance & Insurance" },
  { value: "Beauty / Cosmetics / Personal Care", label: "Beauty / Cosmetics / Personal Care" },
  { value: "Construction", label: "Construction" },
  { value: "Consulting", label: "Consulting" },
  { value: "Creative Arts / Design", label: "Creative Arts / Design" },
  { value: "Customer Service", label: "Customer Service" },
  { value: "Education & Training", label: "Education & Training" },
  { value: "Engineering", label: "Engineering" },
  { value: "Environmental / Natural Sciences", label: "Environmental / Natural Sciences" },
  { value: "Government / Public Sector", label: "Government / Public Sector" },
  { value: "Healthcare / Medical", label: "Healthcare / Medical" },
  { value: "Hospitality / Tourism", label: "Hospitality / Tourism" },
  { value: "Human Resources", label: "Human Resources" },
  { value: "Information Technology (IT)", label: "Information Technology (IT)" },
  { value: "Infrastructure", label: "Infrastructure" },
  { value: "Legal / Law", label: "Legal / Law" },
  { value: "Logistics / Supply Chain", label: "Logistics / Supply Chain" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Marketing / Advertising / PR", label: "Marketing / Advertising / PR" },
  { value: "Media / Journalism / Broadcasting", label: "Media / Journalism / Broadcasting" },
  { value: "Mining", label: "Mining" },
  { value: "Energy", label: "Energy" },
  { value: "Oil & Gas", label: "Oil & Gas" },
  { value: "Non-Profit / NGO", label: "Non-Profit / NGO" },
  { value: "Property / Real Estate", label: "Property / Real Estate" },
  { value: "Retail / Wholesale", label: "Retail / Wholesale" },
  { value: "Safety & Security / Police / Defence", label: "Safety & Security / Police / Defence" },
  { value: "Sales", label: "Sales" },
  { value: "Science & Research", label: "Science & Research" },
  { value: "Social Services / Social Work", label: "Social Services / Social Work" },
  { value: "Sports / Recreation / Fitness", label: "Sports / Recreation / Fitness" },
  { value: "Telecommunications", label: "Telecommunications" },
  { value: "Transport", label: "Transport" },
  { value: "Utilities (Water, Electricity, Waste)", label: "Utilities (Water, Electricity, Waste)" },
]

const industryOptions = categoryOptions

// MultiSelect component - Fixed sizing
// MultiSelect component - Fixed scrolling and sizing
function MultiSelect({ options, selected = [], onChange, label, placeholder }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdown = () => setIsOpen(!isOpen)
  const closeDropdown = () => setIsOpen(false)

  const handleSelect = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={toggleDropdown}
        style={{
          border: '1px solid #d6c4a8',
          borderRadius: '6px',
          padding: '10px 14px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '44px',
          backgroundColor: 'white',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8B4513'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
      >
        {selected && selected.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
            {selected.map((cat) => (
              <span
                key={cat}
                style={{ 
                  backgroundColor: '#f0e8d8', 
                  padding: '4px 12px', 
                  borderRadius: '14px', 
                  fontSize: '13px',
                  color: '#5c3a1e',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {options.find((opt) => opt.value === cat)?.label || cat}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: '#999', fontSize: '14px' }}>{placeholder || `Select ${label}`}</span>
        )}
        {isOpen ? <ChevronUp size={20} color="#5c3a1e" /> : <ChevronDown size={20} color="#5c3a1e" />}
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', 
          top: 'calc(100% + 4px)', 
          left: 0, 
          right: 0,
          backgroundColor: 'white', 
          border: '1px solid #d6c4a8', 
          borderRadius: '6px',
          marginTop: '4px', 
          zIndex: 9999, 
          maxHeight: '280px',  // Increased to show more items
          overflow: 'auto',    // Enables scrolling
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          minWidth: '250px'
        }}>
          <div style={{ padding: '4px' }}>
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                style={{
                  padding: '10px 14px', 
                  cursor: 'pointer',
                  backgroundColor: selected.includes(option.value) ? '#fdf6ed' : 'white',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  borderBottom: '1px solid #f5f0e8',
                  fontSize: '14px',
                  borderRadius: '4px',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => {
                  if (!selected.includes(option.value)) {
                    e.currentTarget.style.backgroundColor = '#faf5ef'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected.includes(option.value)) {
                    e.currentTarget.style.backgroundColor = 'white'
                  }
                }}
              >
                <div style={{
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '4px',
                  border: `2px solid ${selected.includes(option.value) ? '#8B4513' : '#d1d5db'}`,
                  backgroundColor: selected.includes(option.value) ? '#8B4513' : 'white',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {selected.includes(option.value) && (
                    <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                  )}
                </div>
                <span style={{ color: '#3d2b1f' }}>{option.label}</span>
              </div>
            ))}
          </div>
          <div style={{ 
            padding: '10px', 
            borderTop: '1px solid #d6c4a8',
            backgroundColor: '#fdfaf5',
            borderRadius: '0 0 6px 6px',
            position: 'sticky',
            bottom: 0
          }}>
            <button 
              type="button" 
              onClick={closeDropdown} 
              style={{
                width: '100%', 
                padding: '10px',
                backgroundColor: '#8B4513',
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5c3a1e'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8B4513'}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Yes/No dropdown - Fixed sizing
const YesNoDropdown = ({ value, onChange }) => (
  <select
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    style={{
      width: '100%',
      padding: '10px 14px',
      border: '1px solid #d6c4a8',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      color: '#3d2b1f',
      minHeight: '44px',
      cursor: 'pointer'
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = '#8B4513'
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,69,19,0.1)'
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = '#d6c4a8'
      e.currentTarget.style.boxShadow = 'none'
    }}
  >
    <option value="">Select...</option>
    <option value="Yes">Yes</option>
    <option value="No">No</option>
  </select>
)

// Section wrapper component
const Section = ({ title, description, children }) => (
  <div style={{
    marginBottom: '24px',
    padding: '24px',
    backgroundColor: '#fdfaf5',
    borderRadius: '8px',
    border: '1px solid #d6c4a8',
    transition: 'border-color 0.2s'
  }}>
    <div style={{ marginBottom: '16px' }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: '700',
        color: '#5c3a1e',
        margin: 0,
        marginBottom: description ? '4px' : '0'
      }}>
        {title}
      </h3>
      {description && (
        <p style={{
          fontSize: '12px',
          color: '#8B6F47',
          margin: 0
        }}>
          {description}
        </p>
      )}
    </div>
    {children}
  </div>
)

// Section header with add button
const SectionHeader = ({ title, onAdd, addLabel }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px'
  }}>
    <h4 style={{
      fontSize: '14px',
      fontWeight: '600',
      color: '#5c3a1e',
      margin: 0
    }}>
      {title}
    </h4>
    {onAdd && (
      <button
        type="button"
        onClick={onAdd}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 18px',
          backgroundColor: '#f0e8d8',
          color: '#5c3a1e',
          border: 'none',
          borderRadius: '4px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0d5c0'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0e8d8'}
      >
        <Plus size={16} /> {addLabel}
      </button>
    )}
  </div>
)

// Table header style
const thStyle = {
  padding: '10px 12px',
  textAlign: 'left',
  color: '#ffffff',
  fontWeight: '600',
  fontSize: '11px',
  borderBottom: '2px solid #3d2b1f',
  backgroundColor: '#5c3a1e',
  whiteSpace: 'nowrap'
}

// Main component
export default function ProductsServices({ data = {}, updateData }) {
  const [showExplanation, setShowExplanation] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleCheckboxChange = (name, value) => {
    const currentValues = data[name] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]
    updateData({ [name]: newValues })
  }

  const handleOfferingTypeChange = (e) => {
    const value = e.target.value
    updateData({
      offeringType: value,
      ...(!value.includes('products') && { productCategories: [] }),
      ...(!value.includes('services') && { serviceCategories: [] })
    })
  }

  // Products
  const addProductCategory = () => {
    const productCategories = data.productCategories || []
    updateData({ productCategories: [...productCategories, { categories: [], products: [] }] })
  }
  const updateProductCategory = (index, field, value) => {
    const productCategories = [...(data.productCategories || [])]
    productCategories[index] = { ...productCategories[index], [field]: value }
    updateData({ productCategories })
  }
  const removeProductCategory = (index) => {
    const productCategories = [...(data.productCategories || [])]
    productCategories.splice(index, 1)
    updateData({ productCategories })
  }
  const addProduct = (categoryIndex) => {
    const productCategories = [...(data.productCategories || [])]
    productCategories[categoryIndex].products = [...(productCategories[categoryIndex].products || []), { name: "", description: "" }]
    updateData({ productCategories })
  }
  const updateProduct = (categoryIndex, productIndex, field, value) => {
    const productCategories = [...(data.productCategories || [])]
    productCategories[categoryIndex].products[productIndex] = { ...productCategories[categoryIndex].products[productIndex], [field]: value }
    updateData({ productCategories })
  }
  const removeProduct = (categoryIndex, productIndex) => {
    const productCategories = [...(data.productCategories || [])]
    productCategories[categoryIndex].products.splice(productIndex, 1)
    updateData({ productCategories })
  }

  // Services
  const addServiceCategory = () => {
    const serviceCategories = data.serviceCategories || []
    updateData({ serviceCategories: [...serviceCategories, { categories: [], services: [] }] })
  }
  const updateServiceCategory = (index, field, value) => {
    const serviceCategories = [...(data.serviceCategories || [])]
    serviceCategories[index] = { ...serviceCategories[index], [field]: value }
    updateData({ serviceCategories })
  }
  const removeServiceCategory = (index) => {
    const serviceCategories = [...(data.serviceCategories || [])]
    serviceCategories.splice(index, 1)
    updateData({ serviceCategories })
  }
  const addService = (categoryIndex) => {
    const serviceCategories = [...(data.serviceCategories || [])]
    serviceCategories[categoryIndex].services = [...(serviceCategories[categoryIndex].services || []), { name: "", description: "" }]
    updateData({ serviceCategories })
  }
  const updateService = (categoryIndex, serviceIndex, field, value) => {
    const serviceCategories = [...(data.serviceCategories || [])]
    serviceCategories[categoryIndex].services[serviceIndex] = { ...serviceCategories[categoryIndex].services[serviceIndex], [field]: value }
    updateData({ serviceCategories })
  }
  const removeService = (categoryIndex, serviceIndex) => {
    const serviceCategories = [...(data.serviceCategories || [])]
    serviceCategories[categoryIndex].services.splice(serviceIndex, 1)
    updateData({ serviceCategories })
  }

  // Clients
  const addClient = () => {
    const keyClients = data.keyClients || []
    updateData({ keyClients: [...keyClients, { 
      name: "", 
      clientType: "",
      contactNumber: "",
      industries: [], 
      revenuePercentage: "", 
      revenueGrowthPotential: "" 
    }] })
  }
  const updateClient = (index, field, value) => {
    const keyClients = [...(data.keyClients || [])]
    keyClients[index] = { ...keyClients[index], [field]: value }
    updateData({ keyClients })
  }
  const removeClient = (index) => {
    const keyClients = [...(data.keyClients || [])]
    keyClients.splice(index, 1)
    updateData({ keyClients })
  }

  // Total revenue % validation
  const totalRevenuePercent = (data.keyClients || []).reduce((sum, c) => {
    const val = parseFloat(c.revenuePercentage) || 0
    return sum + val
  }, 0)
  const revenueOver100 = totalRevenuePercent > 100

  const showProducts = data.offeringType === 'products' || data.offeringType === 'both'
  const showServices = data.offeringType === 'services' || data.offeringType === 'both'

  // Helper to get category labels
  const getCategoryLabels = (categories) => {
    if (!categories || categories.length === 0) return 'No categories'
    return categories.map(cat => categoryOptions.find(o => o.value === cat)?.label || cat).join(', ')
  }

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '20px' 
      }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: '700',
          color: '#5c3a1e',
          margin: 0
        }}>
          Products & Services
        </h2>
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          style={{
            padding: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
            color: '#5c3a1e'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0e8d8'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title={showExplanation ? "Hide explanation" : "Show explanation"}
        >
          {showExplanation ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px'
        }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1e40af',
            margin: '0 0 8px 0'
          }}>
            📋 Products & Services - Guidance
          </h4>
          <p style={{
            color: '#1e40af',
            margin: '0 0 8px 0',
            fontSize: '12px',
            lineHeight: '1.6'
          }}>
            This section helps us <strong>match your business with the right funders, corporates, and service providers</strong>.
            Please provide clear and structured information about what your company offers.
          </p>
          <ul style={{
            color: '#1e40af',
            margin: 0,
            paddingLeft: '20px',
            fontSize: '12px',
            lineHeight: '1.8'
          }}>
            <li>Select whether you offer products, services, or both</li>
            <li>Organize your offerings into categories</li>
            <li>Provide clear descriptions for each item</li>
            <li>Include delivery standards and target market information</li>
          </ul>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 1: Offerings */}
      {/* ============================================================ */}
      <Section title="Section 1: Add Product or Service">
        <FormField label="What does your business offer?" required>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {[
              { value: 'products', label: 'Products only' },
              { value: 'services', label: 'Services only' },
              { value: 'both', label: 'Both products and services' },
            ].map(({ value, label }) => (
              <label key={value} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#3d2b1f'
              }}>
                <input
                  type="radio"
                  name="offeringType"
                  value={value}
                  checked={data.offeringType === value}
                  onChange={handleOfferingTypeChange}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#8B4513',
                    cursor: 'pointer'
                  }}
                  required
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </FormField>

        {/* Products Table - Simple flat table */}
        {showProducts && (
          <div style={{ marginTop: '20px' }}>
            <SectionHeader 
              title="Products" 
              onAdd={addProductCategory} 
              addLabel="Add Category" 
            />
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-brown-200 rounded-lg" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Product Name</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle} style={{ width: '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.productCategories || []).map((category, categoryIndex) => (
                    <React.Fragment key={categoryIndex}>
                      {/* Category header row */}
                      <tr className="bg-brown-100">
                        <td colSpan="4" style={{ 
                          padding: '8px 12px', 
                          fontWeight: '600',
                          color: '#5c3a1e',
                          fontSize: '13px',
                          borderBottom: '2px solid #d6c4a8'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                              <MultiSelect 
                                options={categoryOptions} 
                                selected={category.categories || []} 
                                onChange={(value) => updateProductCategory(categoryIndex, "categories", value)} 
                                label="categories"
                                placeholder="Select product categories..."
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => addProduct(categoryIndex)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 14px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  backgroundColor: '#f0e8d8',
                                  color: '#5c3a1e',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0d5c0'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0e8d8'}
                              >
                                <Plus size={14} /> Add Product
                              </button>
                              <button
                                type="button"
                                onClick={() => removeProductCategory(categoryIndex)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 14px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                              >
                                <Trash2 size={14} /> Remove Category
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                      {/* Product rows */}
                      {(category.products || []).length === 0 ? (
                        <tr className={categoryIndex % 2 === 0 ? "bg-white" : "bg-brown-50/30"}>
                          <td colSpan="4" style={{
                            textAlign: 'center',
                            padding: '20px',
                            color: '#999',
                            fontSize: '12px'
                          }}>
                            No products in this category. Click "Add Product" to add one.
                          </td>
                        </tr>
                      ) : (
                        (category.products || []).map((product, productIndex) => (
                          <tr key={`${categoryIndex}-${productIndex}`} className={productIndex % 2 === 0 ? "bg-white" : "bg-brown-50/30"}>
                            <td className="px-3 py-2 border-b" style={{ fontSize: '12px', color: '#5c3a1e' }}>
                              {getCategoryLabels(category.categories)}
                            </td>
                            <td className="px-3 py-2 border-b">
                              <input
                                type="text"
                                value={product.name}
                                onChange={(e) => updateProduct(categoryIndex, productIndex, "name", e.target.value)}
                                placeholder="Product name"
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: '1px solid #d6c4a8',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  outline: 'none',
                                  color: '#3d2b1f',
                                  transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
                              />
                            </td>
                            <td className="px-3 py-2 border-b">
                              <textarea
                                value={product.description}
                                onChange={(e) => updateProduct(categoryIndex, productIndex, "description", e.target.value)}
                                placeholder="Description"
                                rows={2}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: '1px solid #d6c4a8',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  outline: 'none',
                                  resize: 'vertical',
                                  fontFamily: 'inherit',
                                  color: '#3d2b1f',
                                  transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
                              />
                            </td>
                            <td className="px-3 py-2 border-b" style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => removeProduct(categoryIndex, productIndex)}
                                style={{
                                  padding: '6px',
                                  color: '#dc2626',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  borderRadius: '4px',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </React.Fragment>
                  ))}
                  {(data.productCategories || []).length === 0 && (
                    <tr>
                      <td colSpan="4" style={{
                        textAlign: 'center',
                        padding: '32px',
                        color: '#999',
                        fontSize: '13px',
                        backgroundColor: '#fdfaf5'
                      }}>
                        No product categories added yet. Click "Add Category" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Services Table - Simple flat table */}
        {showServices && (
          <div style={{ marginTop: '20px' }}>
            <SectionHeader 
              title="Services" 
              onAdd={addServiceCategory} 
              addLabel="Add Category" 
            />
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-brown-200 rounded-lg" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Service Name</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle} style={{ width: '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.serviceCategories || []).map((category, categoryIndex) => (
                    <React.Fragment key={categoryIndex}>
                      {/* Category header row */}
                      <tr className="bg-brown-100">
                        <td colSpan="4" style={{ 
                          padding: '8px 12px', 
                          fontWeight: '600',
                          color: '#5c3a1e',
                          fontSize: '13px',
                          borderBottom: '2px solid #d6c4a8'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                              <MultiSelect 
                                options={categoryOptions} 
                                selected={category.categories || []} 
                                onChange={(value) => updateServiceCategory(categoryIndex, "categories", value)} 
                                label="categories"
                                placeholder="Select service categories..."
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => addService(categoryIndex)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 14px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  backgroundColor: '#f0e8d8',
                                  color: '#5c3a1e',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0d5c0'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0e8d8'}
                              >
                                <Plus size={14} /> Add Service
                              </button>
                              <button
                                type="button"
                                onClick={() => removeServiceCategory(categoryIndex)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 14px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                              >
                                <Trash2 size={14} /> Remove Category
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                      {/* Service rows */}
                      {(category.services || []).length === 0 ? (
                        <tr className={categoryIndex % 2 === 0 ? "bg-white" : "bg-brown-50/30"}>
                          <td colSpan="4" style={{
                            textAlign: 'center',
                            padding: '20px',
                            color: '#999',
                            fontSize: '12px'
                          }}>
                            No services in this category. Click "Add Service" to add one.
                          </td>
                        </tr>
                      ) : (
                        (category.services || []).map((service, serviceIndex) => (
                          <tr key={`${categoryIndex}-${serviceIndex}`} className={serviceIndex % 2 === 0 ? "bg-white" : "bg-brown-50/30"}>
                            <td className="px-3 py-2 border-b" style={{ fontSize: '12px', color: '#5c3a1e' }}>
                              {getCategoryLabels(category.categories)}
                            </td>
                            <td className="px-3 py-2 border-b">
                              <input
                                type="text"
                                value={service.name}
                                onChange={(e) => updateService(categoryIndex, serviceIndex, "name", e.target.value)}
                                placeholder="Service name"
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: '1px solid #d6c4a8',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  outline: 'none',
                                  color: '#3d2b1f',
                                  transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
                              />
                            </td>
                            <td className="px-3 py-2 border-b">
                              <textarea
                                value={service.description}
                                onChange={(e) => updateService(categoryIndex, serviceIndex, "description", e.target.value)}
                                placeholder="Description"
                                rows={2}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: '1px solid #d6c4a8',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  outline: 'none',
                                  resize: 'vertical',
                                  fontFamily: 'inherit',
                                  color: '#3d2b1f',
                                  transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
                              />
                            </td>
                            <td className="px-3 py-2 border-b" style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => removeService(categoryIndex, serviceIndex)}
                                style={{
                                  padding: '6px',
                                  color: '#dc2626',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  borderRadius: '4px',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </React.Fragment>
                  ))}
                  {(data.serviceCategories || []).length === 0 && (
                    <tr>
                      <td colSpan="4" style={{
                        textAlign: 'center',
                        padding: '32px',
                        color: '#999',
                        fontSize: '13px',
                        backgroundColor: '#fdfaf5'
                      }}>
                        No service categories added yet. Click "Add Category" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>

      {/* ============================================================ */}
      {/* SECTION 2: Delivery Standards */}
      {/* ============================================================ */}
      <Section title="Section 2: Delivery Standards">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <FormField label="Preferred Delivery Mode" required>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {deliveryModes.map(mode => (
                  <label key={mode} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#3d2b1f'
                  }}>
                    <input
                      type="checkbox"
                      checked={(data.deliveryModes || []).includes(mode)}
                      onChange={() => handleCheckboxChange('deliveryModes', mode)}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#8B4513',
                        cursor: 'pointer'
                      }}
                    />
                    {mode}
                  </label>
                ))}
              </div>
            </FormField>
          </div>

          <div>
            <FormField label="Lead Time (from contract award to start)" required>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#5c3a1e',
                    marginBottom: '4px'
                  }}>
                    Minimum Time
                  </label>
                  <div style={{ display: 'flex' }}>
                    <input
                      type="number"
                      name="minLeadTime"
                      value={data.minLeadTime || ""}
                      onChange={handleChange}
                      placeholder="e.g., 2"
                      min="0"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #d6c4a8',
                        borderRadius: '4px 0 0 4px',
                        fontSize: '13px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        color: '#3d2b1f'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
                    />
                    <select
                      name="minLeadTimeUnit"
                      value={data.minLeadTimeUnit || "days"}
                      onChange={handleChange}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d6c4a8',
                        borderLeft: 'none',
                        borderRadius: '0 4px 4px 0',
                        backgroundColor: 'white',
                        fontSize: '13px',
                        outline: 'none',
                        cursor: 'pointer',
                        color: '#3d2b1f'
                      }}
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#5c3a1e',
                    marginBottom: '4px'
                  }}>
                    Maximum Time
                  </label>
                  <div style={{ display: 'flex' }}>
                    <input
                      type="number"
                      name="maxLeadTime"
                      value={data.maxLeadTime || ""}
                      onChange={handleChange}
                      placeholder="e.g., 5"
                      min="0"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #d6c4a8',
                        borderRadius: '4px 0 0 4px',
                        fontSize: '13px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        color: '#3d2b1f'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
                    />
                    <select
                      name="maxLeadTimeUnit"
                      value={data.maxLeadTimeUnit || "days"}
                      onChange={handleChange}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d6c4a8',
                        borderLeft: 'none',
                        borderRadius: '0 4px 4px 0',
                        backgroundColor: 'white',
                        fontSize: '13px',
                        outline: 'none',
                        cursor: 'pointer',
                        color: '#3d2b1f'
                      }}
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>
              </div>
              {(data.minLeadTime || data.maxLeadTime) && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px 14px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '4px',
                  border: '1px solid #bfdbfe'
                }}>
                  <p style={{
                    fontSize: '12px',
                    color: '#1e40af',
                    margin: 0
                  }}>
                    <strong>Delivery timeframe:</strong> {
                      data.minLeadTime && data.maxLeadTime
                        ? `${data.minLeadTime} ${data.minLeadTimeUnit} - ${data.maxLeadTime} ${data.maxLeadTimeUnit}`
                        : data.minLeadTime
                          ? `Minimum ${data.minLeadTime} ${data.minLeadTimeUnit}`
                          : `Maximum ${data.maxLeadTime} ${data.maxLeadTimeUnit}`
                    }
                  </p>
                </div>
              )}
            </FormField>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/* SECTION 3: Target Market */}
      {/* ============================================================ */}
      <Section title="Section 3: Target Market">
        <FormField label="Target Market" required>
          <textarea
            name="targetMarket"
            value={data.targetMarket || ""}
            onChange={handleChange}
            rows={3}
            placeholder="e.g., NGO Contracts and youth development programs, Corporate / IAD departments seeking online training delivery, Government departments, education and youth development..."
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #d6c4a8',
              borderRadius: '4px',
              fontSize: '13px',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              color: '#3d2b1f',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
            required
          />
        </FormField>
      </Section>

      {/* ============================================================ */}
      {/* SECTION 4: Key Clients - Table format */}
      {/* ============================================================ */}
      <Section 
        title="Section 4: Key Clients / Customers"
        description="Optional — list your current notable clients and their revenue contribution."
      >
        {/* Revenue total indicator */}
        {(data.keyClients || []).length > 0 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: revenueOver100 ? '#fff1f0' : totalRevenuePercent === 100 ? '#f0faf0' : '#fdf6ee',
            border: `1px solid ${revenueOver100 ? '#ffccc7' : totalRevenuePercent === 100 ? '#b7eb8f' : '#d6c4a8'}`,
            color: revenueOver100 ? '#cf1322' : totalRevenuePercent === 100 ? '#389e0d' : '#5c3a1e',
          }}>
            <span>
              {revenueOver100
                ? `⚠️ Total revenue exceeds 100% (${totalRevenuePercent}%)`
                : totalRevenuePercent === 100
                  ? `✅ Total revenue allocation: ${totalRevenuePercent}%`
                  : `Revenue allocated: ${totalRevenuePercent}% of 100%`}
            </span>
          </div>
        )}

        <SectionHeader 
          title="Clients" 
          onAdd={addClient} 
          addLabel="Add Client" 
        />

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-brown-200 rounded-lg" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={thStyle}>Client Name</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Revenue %</th>
                <th style={thStyle}>Industry</th>
                <th style={thStyle}>Growth Potential</th>
                <th style={thStyle} style={{ width: '50px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data.keyClients || []).map((client, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-brown-50/30"}>
                  <td className="px-3 py-2 border-b">
                    <input
                      type="text"
                      value={client.name || ""}
                      onChange={(e) => updateClient(index, "name", e.target.value)}
                      placeholder="Client name"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #d6c4a8',
                        borderRadius: '4px',
                        fontSize: '12px',
                        outline: 'none',
                        color: '#3d2b1f',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
                    />
                  </td>
                  <td className="px-3 py-2 border-b">
                    <select
                      value={client.clientType || ""}
                      onChange={(e) => updateClient(index, "clientType", e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #d6c4a8',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: 'white',
                        outline: 'none',
                        color: '#3d2b1f',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
                    >
                      <option value="">Select</option>
                      <option value="Government">Government</option>
                      <option value="Private">Private</option>
                      <option value="NGO / Non-Profit">NGO / Non-Profit</option>
                      <option value="International Organisation">International Organisation</option>
                      <option value="Other">Other</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 border-b">
                    <input
                      type="text"
                      value={client.contactNumber || ""}
                      onChange={(e) => updateClient(index, "contactNumber", e.target.value)}
                      placeholder="Contact number"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #d6c4a8',
                        borderRadius: '4px',
                        fontSize: '12px',
                        outline: 'none',
                        color: '#3d2b1f',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
                    />
                  </td>
                  <td className="px-3 py-2 border-b">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        value={client.revenuePercentage || ""}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, Number(e.target.value)))
                          updateClient(index, "revenuePercentage", val === 0 ? "" : String(val))
                        }}
                        placeholder="%"
                        min="0"
                        max="100"
                        style={{
                          width: '70px',
                          padding: '8px 10px',
                          border: '1px solid #d6c4a8',
                          borderRadius: '4px',
                          fontSize: '12px',
                          outline: 'none',
                          color: '#3d2b1f',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
                      />
                      <span style={{ fontSize: '12px', color: '#5c3a1e', fontWeight: '600' }}>%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 border-b" style={{ minWidth: '160px' }}>
                    <MultiSelect
                      options={industryOptions}
                      selected={client.industries || []}
                      onChange={(value) => updateClient(index, "industries", value)}
                      label="industries"
                      placeholder="Select..."
                    />
                  </td>
                  <td className="px-3 py-2 border-b">
                    <YesNoDropdown
                      value={client.revenueGrowthPotential || ""}
                      onChange={(val) => updateClient(index, "revenueGrowthPotential", val)}
                    />
                    {client.revenueGrowthPotential === "Yes" && (
                      <textarea
                        value={client.revenueGrowthDetails || ""}
                        onChange={(e) => updateClient(index, "revenueGrowthDetails", e.target.value)}
                        placeholder="Growth details..."
                        rows={1}
                        style={{
                          width: '100%',
                          marginTop: '6px',
                          padding: '6px 10px',
                          border: '1px solid #d6c4a8',
                          borderRadius: '4px',
                          fontSize: '11px',
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          color: '#3d2b1f',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 border-b" style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => removeClient(index)}
                      style={{
                        padding: '6px',
                        color: '#dc2626',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {(data.keyClients || []).length === 0 && (
                <tr>
                  <td colSpan="7" style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#999',
                    fontSize: '13px',
                    backgroundColor: '#fdfaf5'
                  }}>
                    No clients added yet. Click "Add Client" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}