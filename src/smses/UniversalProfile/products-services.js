"use client"
import { Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
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

// MultiSelect component
function MultiSelect({ options, selected, onChange, label, placeholder }) {
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
    <div style={{ position: 'relative' }}>
      <div
        onClick={toggleDropdown}
        style={{
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          padding: '10px 12px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '44px',
          backgroundColor: 'white',
          transition: 'border-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8B4513'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
      >
        {selected.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {selected.map((cat) => (
              <span
                key={cat}
                style={{ 
                  backgroundColor: '#f3ebe0', 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  fontSize: '13px',
                  color: '#6B3410',
                  fontWeight: '500'
                }}
              >
                {options.find((opt) => opt.value === cat)?.label || cat}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: '#9ca3af' }}>{placeholder || `Select ${label}`}</span>
        )}
        {isOpen ? <ChevronUp size={18} color="#6B3410" /> : <ChevronDown size={18} color="#6B3410" />}
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0,
          backgroundColor: 'white', 
          border: '1px solid #d1d5db', 
          borderRadius: '6px',
          marginTop: '4px', 
          zIndex: 1000, 
          maxHeight: '320px', 
          overflow: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ padding: '8px' }}>
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                style={{
                  padding: '10px 12px', 
                  cursor: 'pointer',
                  backgroundColor: selected.includes(option.value) ? '#fdf6ee' : 'white',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  borderRadius: '4px',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#faf5ef'}
                onMouseLeave={(e) => {
                  if (!selected.includes(option.value)) {
                    e.currentTarget.style.backgroundColor = 'white'
                  }
                }}
              >
                <div style={{
                  width: '18px', 
                  height: '18px', 
                  borderRadius: '4px',
                  border: `2px solid ${selected.includes(option.value) ? '#8B4513' : '#d1d5db'}`,
                  backgroundColor: selected.includes(option.value) ? '#8B4513' : 'white',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {selected.includes(option.value) && (
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                  )}
                </div>
                <span style={{ fontSize: '14px', color: '#1f2937' }}>{option.label}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '8px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
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
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6B3410'}
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

// CSS-safe Yes/No radio
const YesNoRadio = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: '32px' }}>
    {['Yes', 'No'].map((val) => (
      <label
        key={val}
        onClick={() => onChange(val)}
        style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          cursor: 'pointer', 
          userSelect: 'none',
          fontSize: '14px', 
          fontWeight: '500', 
          color: '#3d2b1f',
        }}
      >
        <div style={{
          width: '20px', 
          height: '20px', 
          borderRadius: '50%',
          border: `2px solid ${value === val ? '#8B4513' : '#d1d5db'}`,
          backgroundColor: value === val ? '#8B4513' : 'white',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0, 
          transition: 'all 0.2s ease',
          boxShadow: value === val ? '0 0 0 3px rgba(139,69,19,0.15)' : 'none',
        }}>
          {value === val && (
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: 'white' 
            }} />
          )}
        </div>
        <span>{val}</span>
      </label>
    ))}
  </div>
)

// Section wrapper component
const Section = ({ title, description, children }) => (
  <div style={{
    marginBottom: '28px',
    padding: '24px',
    backgroundColor: '#fdfaf5',
    borderRadius: '12px',
    border: '2px solid #e8dcc8',
    transition: 'border-color 0.2s'
  }}>
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '700',
        color: '#6B3410',
        margin: 0,
        marginBottom: description ? '6px' : '0'
      }}>
        {title}
      </h3>
      {description && (
        <p style={{
          fontSize: '14px',
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
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px'
  }}>
    <h4 style={{
      fontSize: '16px',
      fontWeight: '600',
      color: '#6B3410',
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
          gap: '8px',
          padding: '8px 18px',
          backgroundColor: '#8B4513',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6B3410'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8B4513'}
      >
        <Plus size={16} /> {addLabel}
      </button>
    )}
  </div>
)

// Category card component
const CategoryCard = ({ children, onRemove, title }) => (
  <div style={{
    marginBottom: '16px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e8dcc8',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px'
    }}>
      {title && (
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#6B3410'
        }}>
          {title}
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
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
    </div>
    {children}
  </div>
)

// Product/Service item component
const ItemCard = ({ children, onRemove }) => (
  <div style={{
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '16px',
    backgroundColor: '#faf6f0',
    borderRadius: '6px',
    marginBottom: '12px'
  }}>
    <div style={{ flex: 1 }}>
      {children}
    </div>
    <button
      type="button"
      onClick={onRemove}
      style={{
        padding: '6px',
        color: '#dc2626',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '4px',
        transition: 'background-color 0.2s',
        flexShrink: 0
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <Trash2 size={16} />
    </button>
  </div>
)

// Input with label component
const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: '12px' }}>
    {label && (
      <label style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: '600',
        color: '#6B3410',
        marginBottom: '4px'
      }}>
        {label}
      </label>
    )}
    <input
      {...props}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        outline: 'none',
        ...props.style
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#8B4513'
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,69,19,0.1)'
        if (props.onFocus) props.onFocus(e)
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#d1d5db'
        e.currentTarget.style.boxShadow = 'none'
        if (props.onBlur) props.onBlur(e)
      }}
    />
  </div>
)

const TextArea = ({ label, ...props }) => (
  <div style={{ marginBottom: '12px' }}>
    {label && (
      <label style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: '600',
        color: '#6B3410',
        marginBottom: '4px'
      }}>
        {label}
      </label>
    )}
    <textarea
      {...props}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        outline: 'none',
        resize: 'vertical',
        fontFamily: 'inherit',
        ...props.style
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#8B4513'
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,69,19,0.1)'
        if (props.onFocus) props.onFocus(e)
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#d1d5db'
        e.currentTarget.style.boxShadow = 'none'
        if (props.onBlur) props.onBlur(e)
      }}
    />
  </div>
)

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

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '24px' 
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#6B3410',
          margin: 0
        }}>
          Products & Services
        </h2>
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          style={{
            padding: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'background-color 0.2s',
            color: '#6B3410'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3ebe0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title={showExplanation ? "Hide explanation" : "Show explanation"}
        >
          {showExplanation ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          padding: '20px 24px',
          marginBottom: '28px'
        }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1e40af',
            margin: '0 0 12px 0'
          }}>
            📋 Products & Services - Guidance
          </h4>
          <p style={{
            color: '#1e40af',
            margin: '0 0 12px 0',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            This section helps us <strong>match your business with the right funders, corporates, and service providers</strong>.
            Please provide clear and structured information about what your company offers.
          </p>
          <ul style={{
            color: '#1e40af',
            margin: 0,
            paddingLeft: '20px',
            fontSize: '14px',
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
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[
              { value: 'products', label: 'Products only' },
              { value: 'services', label: 'Services only' },
              { value: 'both', label: 'Both products and services' },
            ].map(({ value, label }) => (
              <label key={value} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
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

        {/* Products & Services side by side */}
        {(showProducts || showServices) && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: showProducts && showServices ? '1fr 1fr' : '1fr', 
            gap: '24px',
            marginTop: '24px'
          }}>
            {/* Products */}
            {showProducts && (
              <div>
                <SectionHeader 
                  title="Product Categories" 
                  onAdd={addProductCategory} 
                  addLabel="Add Category" 
                />
                {(data.productCategories || []).map((category, categoryIndex) => (
                  <CategoryCard
                    key={categoryIndex}
                    onRemove={() => removeProductCategory(categoryIndex)}
                  >
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#6B3410',
                        marginBottom: '6px'
                      }}>
                        Category Name(s) *
                      </label>
                      <MultiSelect 
                        options={categoryOptions} 
                        selected={category.categories || []} 
                        onChange={(value) => updateProductCategory(categoryIndex, "categories", value)} 
                        label="categories"
                        placeholder="Select product categories..."
                      />
                    </div>

                    <div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#6B3410'
                        }}>
                          Products
                        </span>
                        <button
                          type="button"
                          onClick={() => addProduct(categoryIndex)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            fontSize: '13px',
                            fontWeight: '500',
                            backgroundColor: '#f3ebe0',
                            color: '#6B3410',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e8dcc8'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3ebe0'}
                        >
                          <Plus size={14} /> Add Product
                        </button>
                      </div>
                      {(category.products || []).map((product, productIndex) => (
                        <ItemCard
                          key={productIndex}
                          onRemove={() => removeProduct(categoryIndex, productIndex)}
                        >
                          <Input
                            type="text"
                            value={product.name}
                            onChange={(e) => updateProduct(categoryIndex, productIndex, "name", e.target.value)}
                            placeholder="Product name"
                            label="Product Name"
                            required
                          />
                          <TextArea
                            value={product.description}
                            onChange={(e) => updateProduct(categoryIndex, productIndex, "description", e.target.value)}
                            placeholder="Brief description of the product, its features, and benefits"
                            rows={3}
                            label="Description"
                            required
                          />
                        </ItemCard>
                      ))}
                      {(category.products || []).length === 0 && (
                        <div style={{
                          textAlign: 'center',
                          padding: '20px',
                          color: '#9ca3af',
                          fontSize: '14px',
                          backgroundColor: '#faf6f0',
                          borderRadius: '6px'
                        }}>
                          No products added yet. Click "Add Product" to get started.
                        </div>
                      )}
                    </div>
                  </CategoryCard>
                ))}
                {(data.productCategories || []).length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '32px',
                    color: '#9ca3af',
                    fontSize: '14px',
                    backgroundColor: '#faf6f0',
                    borderRadius: '8px'
                  }}>
                    No product categories added yet. Click "Add Category" to get started.
                  </div>
                )}
              </div>
            )}

            {/* Services */}
            {showServices && (
              <div>
                <SectionHeader 
                  title="Service Categories" 
                  onAdd={addServiceCategory} 
                  addLabel="Add Category" 
                />
                {(data.serviceCategories || []).map((category, categoryIndex) => (
                  <CategoryCard
                    key={categoryIndex}
                    onRemove={() => removeServiceCategory(categoryIndex)}
                  >
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#6B3410',
                        marginBottom: '6px'
                      }}>
                        Category Name(s) *
                      </label>
                      <MultiSelect 
                        options={categoryOptions} 
                        selected={category.categories || []} 
                        onChange={(value) => updateServiceCategory(categoryIndex, "categories", value)} 
                        label="categories"
                        placeholder="Select service categories..."
                      />
                    </div>

                    <div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#6B3410'
                        }}>
                          Services
                        </span>
                        <button
                          type="button"
                          onClick={() => addService(categoryIndex)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            fontSize: '13px',
                            fontWeight: '500',
                            backgroundColor: '#f3ebe0',
                            color: '#6B3410',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e8dcc8'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3ebe0'}
                        >
                          <Plus size={14} /> Add Service
                        </button>
                      </div>
                      {(category.services || []).map((service, serviceIndex) => (
                        <ItemCard
                          key={serviceIndex}
                          onRemove={() => removeService(categoryIndex, serviceIndex)}
                        >
                          <Input
                            type="text"
                            value={service.name}
                            onChange={(e) => updateService(categoryIndex, serviceIndex, "name", e.target.value)}
                            placeholder="Service name"
                            label="Service Name"
                            required
                          />
                          <TextArea
                            value={service.description}
                            onChange={(e) => updateService(categoryIndex, serviceIndex, "description", e.target.value)}
                            placeholder="Brief description of the service, what it includes, and its value proposition"
                            rows={3}
                            label="Description"
                            required
                          />
                        </ItemCard>
                      ))}
                      {(category.services || []).length === 0 && (
                        <div style={{
                          textAlign: 'center',
                          padding: '20px',
                          color: '#9ca3af',
                          fontSize: '14px',
                          backgroundColor: '#faf6f0',
                          borderRadius: '6px'
                        }}>
                          No services added yet. Click "Add Service" to get started.
                        </div>
                      )}
                    </div>
                  </CategoryCard>
                ))}
                {(data.serviceCategories || []).length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '32px',
                    color: '#9ca3af',
                    fontSize: '14px',
                    backgroundColor: '#faf6f0',
                    borderRadius: '8px'
                  }}>
                    No service categories added yet. Click "Add Category" to get started.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ============================================================ */}
      {/* SECTION 2: Delivery Standards */}
      {/* ============================================================ */}
      <Section title="Section 2: Delivery Standards">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <FormField label="Preferred Delivery Mode" required>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {deliveryModes.map(mode => (
                  <label key={mode} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
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
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6B3410',
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
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px 0 0 6px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                    />
                    <select
                      name="minLeadTimeUnit"
                      value={data.minLeadTimeUnit || "days"}
                      onChange={handleChange}
                      style={{
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderLeft: 'none',
                        borderRadius: '0 6px 6px 0',
                        backgroundColor: 'white',
                        fontSize: '14px',
                        outline: 'none',
                        cursor: 'pointer'
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
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6B3410',
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
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px 0 0 6px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                    />
                    <select
                      name="maxLeadTimeUnit"
                      value={data.maxLeadTimeUnit || "days"}
                      onChange={handleChange}
                      style={{
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderLeft: 'none',
                        borderRadius: '0 6px 6px 0',
                        backgroundColor: 'white',
                        fontSize: '14px',
                        outline: 'none',
                        cursor: 'pointer'
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
                  marginTop: '12px',
                  padding: '10px 14px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '6px',
                  border: '1px solid #bfdbfe'
                }}>
                  <p style={{
                    fontSize: '14px',
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
          <TextArea
            name="targetMarket"
            value={data.targetMarket || ""}
            onChange={handleChange}
            rows={4}
            placeholder="e.g., NGO Contracts and youth development programs, Corporate / IAD departments seeking online training delivery, Government departments, education and youth development..."
            required
          />
        </FormField>
      </Section>

      {/* ============================================================ */}
      {/* SECTION 4: Key Clients */}
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
            gap: '10px',
            padding: '10px 18px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: revenueOver100 ? '#fff1f0' : totalRevenuePercent === 100 ? '#f0faf0' : '#fdf6ee',
            border: `1px solid ${revenueOver100 ? '#ffccc7' : totalRevenuePercent === 100 ? '#b7eb8f' : '#d6c4a8'}`,
            color: revenueOver100 ? '#cf1322' : totalRevenuePercent === 100 ? '#389e0d' : '#8B4513',
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(data.keyClients || []).map((client, index) => (
            <CategoryCard
              key={index}
              onRemove={() => removeClient(index)}
              title={`Client ${index + 1}`}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <Input
                  type="text"
                  value={client.name || ""}
                  onChange={(e) => updateClient(index, "name", e.target.value)}
                  placeholder="e.g., ABC Corporation"
                  label="Client / Customer Name"
                />

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6B3410',
                    marginBottom: '4px'
                  }}>
                    Client Type
                  </label>
                  <select
                    value={client.clientType || ""}
                    onChange={(e) => updateClient(index, "clientType", e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  >
                    <option value="">Select type</option>
                    <option value="Government">Government</option>
                    <option value="Private">Private</option>
                    <option value="NGO / Non-Profit">NGO / Non-Profit</option>
                    <option value="International Organisation">International Organisation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <Input
                  type="text"
                  value={client.contactNumber || ""}
                  onChange={(e) => updateClient(index, "contactNumber", e.target.value)}
                  placeholder="e.g., +27 82 123 4567"
                  label="Contact Number"
                />
              </div>

              {/* Second row - Revenue %, Industry, Revenue Potential - all in one row */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 2fr 1fr', 
                gap: '16px',
                marginTop: '8px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6B3410',
                    marginBottom: '4px'
                  }}>
                    % of Total Revenue
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      value={client.revenuePercentage || ""}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, Number(e.target.value)))
                        updateClient(index, "revenuePercentage", val === 0 ? "" : String(val))
                      }}
                      placeholder="e.g., 25"
                      min="0"
                      max="100"
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                    />
                    <span style={{
                      fontWeight: '600',
                      color: '#8B4513',
                      flexShrink: 0,
                      fontSize: '14px'
                    }}>%</span>
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6B3410',
                    marginBottom: '4px'
                  }}>
                    Industry (select all that apply)
                  </label>
                  <MultiSelect
                    options={industryOptions}
                    selected={client.industries || []}
                    onChange={(value) => updateClient(index, "industries", value)}
                    label="industries"
                    placeholder="Select industries..."
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6B3410',
                    marginBottom: '4px'
                  }}>
                    Revenue Growth Potential?
                  </label>
                  <YesNoRadio
                    value={client.revenueGrowthPotential || ""}
                    onChange={(val) => updateClient(index, "revenueGrowthPotential", val)}
                  />
                </div>
              </div>

              {/* Revenue growth details - full width if Yes */}
              {client.revenueGrowthPotential === "Yes" && (
                <div style={{ marginTop: '16px' }}>
                  <TextArea
                    value={client.revenueGrowthDetails || ""}
                    onChange={(e) => updateClient(index, "revenueGrowthDetails", e.target.value)}
                    placeholder="e.g., Expanding into new product lines, upcoming contract renewal, additional departments to onboard..."
                    rows={2}
                    label="Please elaborate on the growth opportunity"
                  />
                </div>
              )}
            </CategoryCard>
          ))}
        </div>

        {(data.keyClients || []).length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#9ca3af',
            fontSize: '14px',
            backgroundColor: '#faf6f0',
            borderRadius: '8px'
          }}>
            <p style={{ margin: 0 }}>No clients added yet. Click "Add Client" to get started.</p>
          </div>
        )}
      </Section>
    </div>
  )
}