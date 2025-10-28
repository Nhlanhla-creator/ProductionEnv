"use client"
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import FormField from "./form-field"
import FileUpload from "./file-upload"
import './UniversalProfile.css';
import {deliveryModes} from '../ProductApplication/applicationOptions'

// Updated category options for Products and Services
const categoryOptions = [
  { value: "Agriculture", label: "Agriculture" },
  { value: "Alternative Medicine", label: "Alternative Medicine" },
  { value: "Art", label: "Art" },
  { value: "Attorneys & Legal Services", label: "Attorneys & Legal Services" },
  { value: "Automotive", label: "Automotive" },
  { value: "Beauty & Fitness", label: "Beauty & Fitness" },
  { value: "Business accelerators", label: "Business accelerators" },
  { value: "Business and Professional Services", label: "Business and Professional Services" },
  { value: "Cellphone services", label: "Cellphone services" },
  { value: "Clothing and Textiles", label: "Clothing and Textiles" },
  { value: "Computers & Internet", label: "Computers & Internet" },
  { value: "Construction", label: "Construction" },
  { value: "Education", label: "Education" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Events", label: "Events" },
  { value: "Financial services", label: "Financial services" },
  { value: "Food and hospitality", label: "Food and hospitality" },
  { value: "Funeral services", label: "Funeral services" },
  { value: "Health and Wellness", label: "Health and Wellness" },
  { value: "Home & Garden", label: "Home & Garden" },
  { value: "Insurance", label: "Insurance" },
  { value: "Logistics", label: "Logistics" },
  { value: "Marketing", label: "Marketing" },
  { value: "Online shopping", label: "Online shopping" },
  { value: "Pets", label: "Pets" },
  { value: "Photography", label: "Photography" },
  { value: "Property", label: "Property" },
  { value: "Reseller", label: "Reseller" },
  { value: "Sports & Recreation", label: "Sports & Recreation" },
  { value: "Technology", label: "Technology" },
  { value: "Travel & Transport", label: "Travel & Transport" },
  { value: "Waste and Recycling", label: "Waste and Recycling" },
  { value: "Wholesale", label: "Wholesale" }
]

// Industry options for Key Clients/Customers (keeping the original ones)
const industryOptions = [
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

export default function ProductsServices({ data = {}, updateData }) {
  const [showExplanation, setShowExplanation] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleFileChange = (name, files) => {
    updateData({ [name]: files })
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
      // Clear categories that are no longer relevant
      ...(!value.includes('products') && { productCategories: [] }),
      ...(!value.includes('services') && { serviceCategories: [] })
    })
  }

  const handleMultiSelect = (name, value) => {
    const currentValues = data[name] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]

    updateData({ [name]: newValues })
  }

  const addProductCategory = () => {
    const productCategories = data.productCategories || []
    updateData({ productCategories: [...productCategories, { name: "", products: [] }] })
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
    const products = productCategories[categoryIndex].products || []
    productCategories[categoryIndex].products = [...products, { name: "", description: "" }]
    updateData({ productCategories })
  }

  const updateProduct = (categoryIndex, productIndex, field, value) => {
    const productCategories = [...(data.productCategories || [])]
    productCategories[categoryIndex].products[productIndex] = {
      ...productCategories[categoryIndex].products[productIndex],
      [field]: value,
    }
    updateData({ productCategories })
  }

  const removeProduct = (categoryIndex, productIndex) => {
    const productCategories = [...(data.productCategories || [])]
    productCategories[categoryIndex].products.splice(productIndex, 1)
    updateData({ productCategories })
  }

  const addServiceCategory = () => {
    const serviceCategories = data.serviceCategories || []
    updateData({ serviceCategories: [...serviceCategories, { name: "", services: [] }] })
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
    const services = serviceCategories[categoryIndex].services || []
    serviceCategories[categoryIndex].services = [...services, { name: "", description: "" }]
    updateData({ serviceCategories })
  }

  const updateService = (categoryIndex, serviceIndex, field, value) => {
    const serviceCategories = [...(data.serviceCategories || [])]
    serviceCategories[categoryIndex].services[serviceIndex] = {
      ...serviceCategories[categoryIndex].services[serviceIndex],
      [field]: value,
    }
    updateData({ serviceCategories })
  }

  const removeService = (categoryIndex, serviceIndex) => {
    const serviceCategories = [...(data.serviceCategories || [])]
    serviceCategories[categoryIndex].services.splice(serviceIndex, 1)
    updateData({ serviceCategories })
  }

  const addClient = () => {
    const keyClients = data.keyClients || []
    updateData({ keyClients: [...keyClients, { name: "", industry: "" }] })
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

  const showProducts = data.offeringType === 'products' || data.offeringType === 'both'
  const showServices = data.offeringType === 'services' || data.offeringType === 'both'

  return (
    <div>
      {/* Header with Eye Icon */}
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-brown-800">Products & Services</h2>
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="p-1 hover:bg-brown-100 rounded-md transition-colors inline-flex items-center justify-center"
          title={showExplanation ? "Hide explanation" : "Show explanation"}
          style={{ verticalAlign: 'middle' }}
        >
          {showExplanation ? (
            <EyeOff className="w-3.5 h-3.5 text-brown-700" strokeWidth={2.5} />
          ) : (
            <Eye className="w-3.5 h-3.5 text-brown-700" strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Explanation Box */}
      {showExplanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            📋 Products & Services Section - Guidance
          </h3>
          <p className="text-blue-700 mb-4">
            This section helps us <strong>match your business with the right funders, corporates, and service providers</strong>. 
            Please provide clear and structured information about what your company offers.
          </p>
          <ul className="list-disc list-inside space-y-2 text-blue-700">
            <li>Select whether you offer products, services, or both</li>
            <li>Organize your offerings into categories</li>
            <li>Provide clear descriptions for each item</li>
            <li>Include delivery standards and target market information</li>
          </ul>
        </div>
      )}

      {/* Section 1: Add Product or Service */}
      <div className="mb-8 p-6 bg-brown-50 rounded-lg border-2 border-brown-200">
        <h3 className="text-xl font-semibold text-brown-800 mb-4">Section 1: Add Product or Service</h3>
        
        {/* Offering Type Selection */}
        <FormField label="What does your business offer?" required>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="offeringType"
                value="products"
                checked={data.offeringType === 'products'}
                onChange={handleOfferingTypeChange}
                className="mr-3 h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300"
                required
              />
              <span className="text-brown-700">Products only</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="offeringType"
                value="services"
                checked={data.offeringType === 'services'}
                onChange={handleOfferingTypeChange}
                className="mr-3 h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300"
                required
              />
              <span className="text-brown-700">Services only</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="offeringType"
                value="both"
                checked={data.offeringType === 'both'}
                onChange={handleOfferingTypeChange}
                className="mr-3 h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300"
                required
              />
              <span className="text-brown-700">Both products and services</span>
            </label>
          </div>
        </FormField>

        {/* Product Categories */}
        {showProducts && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-brown-700">Product Categories</h4>
              <button
                type="button"
                onClick={addProductCategory}
                className="flex items-center gap-2 px-4 py-2 bg-brown-600 text-white rounded-md hover:bg-brown-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>

            {(data.productCategories || []).map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-6 p-4 bg-white rounded-lg border border-brown-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-brown-700 mb-2">
                      Category Name *
                    </label>
                    <select
                      value={category.name}
                      onChange={(e) => updateProductCategory(categoryIndex, "name", e.target.value)}
                      className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProductCategory(categoryIndex)}
                    className="ml-4 p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-brown-700">Products</label>
                    <button
                      type="button"
                      onClick={() => addProduct(categoryIndex)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Product
                    </button>
                  </div>

                  {(category.products || []).map((product, productIndex) => (
                    <div key={productIndex} className="flex gap-3 items-start p-3 bg-brown-50 rounded-md">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => updateProduct(categoryIndex, productIndex, "name", e.target.value)}
                          placeholder="Product name"
                          className="px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                          required
                        />
                        <input
                          type="text"
                          value={product.description}
                          onChange={(e) => updateProduct(categoryIndex, productIndex, "description", e.target.value)}
                          placeholder="Brief description"
                          className="px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProduct(categoryIndex, productIndex)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Service Categories */}
        {showServices && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-brown-700">Service Categories</h4>
              <button
                type="button"
                onClick={addServiceCategory}
                className="flex items-center gap-2 px-4 py-2 bg-brown-600 text-white rounded-md hover:bg-brown-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>

            {(data.serviceCategories || []).map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-6 p-4 bg-white rounded-lg border border-brown-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-brown-700 mb-2">
                      Category Name *
                    </label>
                    <select
                      value={category.name}
                      onChange={(e) => updateServiceCategory(categoryIndex, "name", e.target.value)}
                      className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeServiceCategory(categoryIndex)}
                    className="ml-4 p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-brown-700">Services</label>
                    <button
                      type="button"
                      onClick={() => addService(categoryIndex)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Service
                    </button>
                  </div>

                  {(category.services || []).map((service, serviceIndex) => (
                    <div key={serviceIndex} className="flex gap-3 items-start p-3 bg-brown-50 rounded-md">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) => updateService(categoryIndex, serviceIndex, "name", e.target.value)}
                          placeholder="Service name"
                          className="px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                          required
                        />
                        <input
                          type="text"
                          value={service.description}
                          onChange={(e) => updateService(categoryIndex, serviceIndex, "description", e.target.value)}
                          placeholder="Brief description"
                          className="px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeService(categoryIndex, serviceIndex)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Delivery Standards */}
      <div className="mb-8 p-6 bg-brown-50 rounded-lg border-2 border-brown-200">
        <h3 className="text-xl font-semibold text-brown-800 mb-4">Section 2: Delivery Standards</h3>
        
        <FormField label="Preferred Delivery Mode" required>
          <div className="checkbox-group">
            {deliveryModes.map(mode => (
              <label key={mode} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={(data.deliveryModes || []).includes(mode)}
                  onChange={() => handleCheckboxChange('deliveryModes', mode)}
                />
                {mode}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="Lead Time" required>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">
                  Minimum Time
                </label>
                <div className="flex">
                  <input
                    type="number"
                    name="minLeadTime"
                    value={data.minLeadTime || ""}
                    onChange={handleChange}
                    placeholder="e.g., 2"
                    min="0"
                    className="w-full px-3 py-2 border border-brown-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                  />
                  <select
                    name="minLeadTimeUnit"
                    value={data.minLeadTimeUnit || "days"}
                    onChange={handleChange}
                    className="px-3 py-2 border border-brown-300 border-l-0 rounded-r-md focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white"
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-brown-700 mb-1">
                  Maximum Time
                </label>
                <div className="flex">
                  <input
                    type="number"
                    name="maxLeadTime"
                    value={data.maxLeadTime || ""}
                    onChange={handleChange}
                    placeholder="e.g., 5"
                    min="0"
                    className="w-full px-3 py-2 border border-brown-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                  />
                  <select
                    name="maxLeadTimeUnit"
                    value={data.maxLeadTimeUnit || "days"}
                    onChange={handleChange}
                    className="px-3 py-2 border border-brown-300 border-l-0 rounded-r-md focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white"
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Display summary */}
            {(data.minLeadTime || data.maxLeadTime) && (
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-700">
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
          </div>
        </FormField>
      </div>
      {/* Section 3: Target Market */}
      <div className="mb-8 p-6 bg-brown-50 rounded-lg border-2 border-brown-200">
        <h3 className="text-xl font-semibold text-brown-800 mb-4">Section 3: Target Market</h3>
        
        <FormField label="Target Market" required>
          <textarea
            name="targetMarket"
            value={data.targetMarket || ""}
            onChange={handleChange}
            rows={4}
            placeholder="e.g., NGO Contracts and youth development programs, Corporate / IAD departments seeking online training delivery, Government departments, education and youth development, NGOs and foundations involved in educational access"
            className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
            required
          />
        </FormField>
      </div>
      {/* Section 4: Key Clients/Customers */}
      <div className="mb-8 p-6 bg-brown-50 rounded-lg border-2 border-brown-200">
        <h3 className="text-xl font-semibold text-brown-800 mb-4">Section 4: Key Clients/Customers (Optional)</h3>
        
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-brown-600">List your notable clients or customers</p>
          <button
            type="button"
            onClick={addClient}
            className="flex items-center gap-2 px-4 py-2 bg-brown-600 text-white rounded-md hover:bg-brown-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>

        <div className="space-y-3">
          {(data.keyClients || []).map((client, index) => (
            <div key={index} className="flex gap-3 items-start p-3 bg-white rounded-md border border-brown-200">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={client.name}
                  onChange={(e) => updateClient(index, "name", e.target.value)}
                  placeholder="Client/Customer name"
                  className="px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                />
                <select
                  value={client.industry}
                  onChange={(e) => updateClient(index, "industry", e.target.value)}
                  className="px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                >
                  <option value="">Select industry</option>
                  {industryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => removeClient(index)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}