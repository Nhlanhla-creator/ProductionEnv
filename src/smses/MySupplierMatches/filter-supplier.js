"use client"

import { useState, useEffect } from "react"
import { Slider } from "./slider"
import styles from "./sup-filter.module.css"

export function FilterSuppliers({ suppliers, onFilterChange, onClose }) {
  const [filters, setFilters] = useState({
    location: "",
    matchScore: [50],
    minValue: "",
    maxValue: "",
    entityType: "",
    sectors: [],
    bbbeeLevel: "",
    procurementCategories: [],
    availability: "",
    sortBy: "",
  })

  // Update individual filter
  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    // Apply filters immediately when they change
    applyFilters(newFilters)
  }

  const handleSectorChange = (sector) => {
    const newSectors = filters.sectors.includes(sector)
      ? filters.sectors.filter((s) => s !== sector)
      : [...filters.sectors, sector]
    
    updateFilter('sectors', newSectors)
    
    // Auto-close dropdown after selection
    setTimeout(() => {
      const dropdown = document.getElementById("sector-dropdown")
      dropdown?.classList.add("hidden")
    }, 150)
  }

  const handleProcurementChange = (category) => {
    const newCategories = filters.procurementCategories.includes(category)
      ? filters.procurementCategories.filter((c) => c !== category)
      : [...filters.procurementCategories, category]
    
    updateFilter('procurementCategories', newCategories)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById("sector-dropdown")
      const button = event.target.closest(`.${styles.multiSelectButton}`)
      
      if (!button && dropdown && !dropdown.classList.contains("hidden")) {
        dropdown.classList.add("hidden")
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const clearAllFilters = () => {
    const clearedFilters = {
      location: "",
      matchScore: [50],
      minValue: "",
      maxValue: "",
      entityType: "",
      sectors: [],
      bbbeeLevel: "",
      procurementCategories: [],
      availability: "",
      sortBy: "",
    }
    setFilters(clearedFilters)
    applyFilters(clearedFilters)
  }

  const applyFilters = (filterState = filters) => {
    if (!onFilterChange) return

    const filteredSuppliers = suppliers.filter(supplier => {
      // Location filter
      if (filterState.location && supplier.entityOverview?.location !== filterState.location) {
        return false
      }

      // Match Score filter
      if (supplier.matchPercentage < filterState.matchScore[0]) {
        return false
      }

      // BBBEE Level filter
      if (filterState.bbbeeLevel && supplier.legalCompliance?.bbbeeLevel !== filterState.bbbeeLevel) {
        return false
      }

      // Entity Type filter
      if (filterState.entityType && supplier.entityOverview?.entityType !== filterState.entityType) {
        return false
      }

      // Sectors filter
      if (filterState.sectors.length > 0) {
        const supplierSectors = supplier.entityOverview?.economicSectors || []
        const hasMatchingSector = filterState.sectors.some(sector => 
          supplierSectors.includes(sector)
        )
        if (!hasMatchingSector) return false
      }

      // Procurement Categories filter
      if (filterState.procurementCategories.length > 0) {
        const supplierCategories = [
          ...(supplier.productsServices?.productCategories || []).map(cat => cat.name || cat),
          ...(supplier.productsServices?.serviceCategories || []).map(cat => cat.name || cat)
        ]
        const hasMatchingCategory = filterState.procurementCategories.some(category =>
          supplierCategories.some(supplierCat => 
            supplierCat.toLowerCase().includes(category.toLowerCase())
          )
        )
        if (!hasMatchingCategory) return false
      }

      // Availability filter (simplified - using urgency field)
      if (filterState.availability) {
        const supplierUrgency = supplier.urgency?.toLowerCase() || ""
        const filterAvailability = filterState.availability.toLowerCase()
        
        if (filterAvailability === "immediate" && !supplierUrgency.includes("immediate")) {
          return false
        } else if (filterAvailability === "within 1 week" && !supplierUrgency.includes("week")) {
          return false
        } else if (filterAvailability === "within 1 month" && !supplierUrgency.includes("month")) {
          return false
        }
      }

      // Budget range filter (simplified - using annual revenue)
      if (filterState.minValue || filterState.maxValue) {
        const supplierRevenue = parseFloat(supplier.financialOverview?.annualRevenue?.replace(/[^\d.]/g, '')) || 0
        const minBudget = parseFloat(filterState.minValue.replace(/[^\d.]/g, '')) || 0
        const maxBudget = parseFloat(filterState.maxValue.replace(/[^\d.]/g, '')) || Infinity
        
        if (supplierRevenue < minBudget || supplierRevenue > maxBudget) {
          return false
        }
      }

      return true
    })

    // Apply sorting
    let sortedSuppliers = [...filteredSuppliers]
    if (filterState.sortBy) {
      switch (filterState.sortBy) {
        case "Match Score (High to Low)":
          sortedSuppliers.sort((a, b) => b.matchPercentage - a.matchPercentage)
          break
        case "Match Score (Low to High)":
          sortedSuppliers.sort((a, b) => a.matchPercentage - b.matchPercentage)
          break
        case "Rating (High to Low)":
          sortedSuppliers.sort((a, b) => (b.rating || 0) - (a.rating || 0))
          break
        case "Rating (Low to High)":
          sortedSuppliers.sort((a, b) => (a.rating || 0) - (b.rating || 0))
          break
        case "Date Added (Newest First)":
          sortedSuppliers.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
          break
        case "Date Added (Oldest First)":
          sortedSuppliers.sort((a, b) => new Date(a.lastActivity) - new Date(b.lastActivity))
          break
        default:
          break
      }
    }

    onFilterChange(sortedSuppliers, filterState)
  }

  const locations = [
    "South Africa", "Namibia", "Botswana", "Zimbabwe", "Mozambique",
    "Lesotho", "Eswatini", "Zambia", "Malawi", "Angola",
  ]

  const entityTypes = ["Pty Ltd", "CC", "NGO", "Co-op", "Sole Proprietor", "Partnership"]

  const industryOptions = [
    "Agriculture", "Mining", "Manufacturing", "Energy", "Construction",
    "Retail", "Transport", "Finance", "Real Estate", "ICT",
    "Tourism", "Education", "Health", "Arts", "Other Services",
  ]

  const bbbeeLevels = [
    "Level 1", "Level 2", "Level 3", "Level 4", "Level 5",
    "Level 6", "Level 7", "Level 8", "Non-Compliant",
  ]

  const procurementOptions = [
    "Services", "Goods", "Construction", "Professional Services", "IT Solutions"
  ]

  const availabilityOptions = [
    "Immediate", "Within 1 week", "Within 1 month", "Within 3 months", "Custom"
  ]

  const sortOptions = [
    "Match Score (High to Low)", "Match Score (Low to High)",
    "Rating (High to Low)", "Rating (Low to High)",
    "Date Added (Newest First)", "Date Added (Oldest First)",
  ]

  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterHeader}>
        <h1 className={styles.filterHeaderTitle}>Filter Suppliers</h1>
        <p className={styles.filterHeaderSubtitle}>Find the perfect suppliers for your business needs</p>
        {onClose && (
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ✖
          </button>
        )}
      </div>

      <div className={styles.filterGrid}>
        {/* Location Dropdown */}
        <div className={styles.filterCard}>
          <h3 className={styles.filterTitle}>📍 Location</h3>
          <select
            className={styles.filterSelect}
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
          >
            <option value="">Select Location</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Match Score Slider */}
        <div className={styles.filterCard}>
          <h3 className={styles.filterTitle}>🎯 Match Score Minimum</h3>
          <div className={styles.sliderContainer}>
            <Slider
              defaultValue={[50]}
              max={100}
              step={1}
              value={filters.matchScore}
              onValueChange={(value) => updateFilter('matchScore', value)}
              className={styles.brownSlider}
            />
            <div className={styles.sliderValue}>{filters.matchScore[0]}%</div>
          </div>
        </div>

        {/* Contract Value Range */}
        <div className={styles.filterCard}>
          <h3 className={styles.filterTitle}>💰 Contract Value Range</h3>
          <div className={styles.rangeInputs}>
            <input
              type="text"
              placeholder="Min Amount"
              className={styles.filterInput}
              value={filters.minValue}
              onChange={(e) => updateFilter('minValue', e.target.value)}
            />
            <input
              type="text"
              placeholder="Max Amount"
              className={styles.filterInput}
              value={filters.maxValue}
              onChange={(e) => updateFilter('maxValue', e.target.value)}
            />
          </div>
        </div>

        {/* Entity Type */}
        <div className={styles.filterCard}>
          <h3 className={styles.filterTitle}>🏢 Entity Type</h3>
          <select
            className={styles.filterSelect}
            value={filters.entityType}
            onChange={(e) => updateFilter('entityType', e.target.value)}
          >
            <option value="">Select Entity Type</option>
            {entityTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Sector Multi-select */}
        <div className={styles.filterCard}>
          <h3 className={styles.filterTitle}>🏭 Industry/Sector</h3>
          <div className={styles.dropdownContainer}>
            <button
              className={styles.multiSelectButton}
              onClick={(e) => {
                e.stopPropagation()
                const dropdown = document.getElementById("sector-dropdown")
                dropdown?.classList.toggle("hidden")
                e.target.classList.toggle("open")
              }}
            >
              {filters.sectors.length ? `${filters.sectors.length} sector${filters.sectors.length > 1 ? 's' : ''} selected` : "Select Sectors"}
            </button>
            <div id="sector-dropdown" className={`hidden ${styles.dropdownMenu}`}>
              {industryOptions.map((sector) => (
                <div key={sector} className={styles.dropdownItem}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={filters.sectors.includes(sector)}
                      onChange={() => handleSectorChange(sector)}
                      className={styles.checkbox}
                    />
                    {sector}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BBBEE Level */}
        <div className={styles.filterCard}>
          <h3 className={styles.filterTitle}>⭐ BBBEE Level</h3>
          <select
            className={styles.filterSelect}
            value={filters.bbbeeLevel}
            onChange={(e) => updateFilter('bbbeeLevel', e.target.value)}
          >
            <option value="">Select BBBEE Level</option>
            {bbbeeLevels.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        {/* Procurement Categories */}
        <div className={styles.filterCard}>
          <h3 className={styles.filterTitle}>📦 Procurement Category</h3>
          <div className={styles.checkboxGroup}>
            {procurementOptions.map((category) => (
              <div key={category} className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  id={`proc-${category}`}
                  checked={filters.procurementCategories.includes(category)}
                  onChange={() => handleProcurementChange(category)}
                  className={styles.checkbox}
                />
                <label htmlFor={`proc-${category}`} className={styles.checkboxLabel}>
                  {category}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className={styles.filterCard}>
          <h3 className={styles.filterTitle}>⏰ Availability</h3>
          <select
            className={styles.filterSelect}
            value={filters.availability}
            onChange={(e) => updateFilter('availability', e.target.value)}
          >
            <option value="">Select Availability</option>
            {availabilityOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className={styles.filterCard}>
          <h3 className={styles.filterTitle}>🔄 Sort By</h3>
          <select
            className={styles.filterSelect}
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
          >
            <option value="">Select Sort Option</option>
            {sortOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.filterActions}>
        <button 
          className={`${styles.filterButton} ${styles.filterButtonSecondary}`}
          onClick={clearAllFilters}
        >
          Clear All Filters
        </button>
        <button 
          className={`${styles.filterButton} ${styles.filterButtonPrimary}`}
          onClick={() => applyFilters()}
        >
          Apply Filters
        </button>
      </div>
    </div>
  )
}