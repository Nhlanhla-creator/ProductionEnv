"use client"

import { useState, useEffect } from "react"
import { Slider } from "./slider"
import styles from "./sup-filter.module.css"

export function FilterSuppliers() {
  const [location, setLocation] = useState("")
  const [matchScore, setMatchScore] = useState([50])
  const [minValue, setMinValue] = useState("")
  const [maxValue, setMaxValue] = useState("")
  const [entityType, setEntityType] = useState("")
  const [sectors, setSectors] = useState([])
  const [bbbeeLevel, setBbbeeLevel] = useState("")
  const [procurementCategories, setProcurementCategories] = useState([])
  const [availability, setAvailability] = useState("")
  const [sortBy, setSortBy] = useState("")

  const handleSectorChange = (sector) => {
    if (sectors.includes(sector)) {
      setSectors(sectors.filter((s) => s !== sector))
    } else {
      setSectors([...sectors, sector])
    }
    // Auto-close dropdown after selection
    setTimeout(() => {
      const dropdown = document.getElementById("sector-dropdown")
      dropdown?.classList.add("hidden")
    }, 150)
  }

  const handleProcurementChange = (category) => {
    if (procurementCategories.includes(category)) {
      setProcurementCategories(procurementCategories.filter((c) => c !== category))
    } else {
      setProcurementCategories([...procurementCategories, category])
    }
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
    setLocation("")
    setMatchScore([50])
    setMinValue("")
    setMaxValue("")
    setEntityType("")
    setSectors([])
    setBbbeeLevel("")
    setProcurementCategories([])
    setAvailability("")
    setSortBy("")
  }

  const applyFilters = () => {
    // Implementation for applying filters
    console.log({
      location,
      matchScore,
      minValue,
      maxValue,
      entityType,
      sectors,
      bbbeeLevel,
      procurementCategories,
      availability,
      sortBy
    })
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
      </div>

      <div className={styles.filterGrid}>
        {/* Location Dropdown */}
        <div className={styles.filterCard}>
          <h3 className={styles.filterTitle}>📍 Location</h3>
          <select
            className={styles.filterSelect}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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
              value={matchScore}
              onValueChange={setMatchScore}
              className={styles.brownSlider}
            />
            <div className={styles.sliderValue}>{matchScore[0]}%</div>
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
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
            />
            <input
              type="text"
              placeholder="Max Amount"
              className={styles.filterInput}
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
            />
          </div>
        </div>

        {/* Entity Type */}
        <div className={styles.filterCard}>
          <h3 className={styles.filterTitle}>🏢 Entity Type</h3>
          <select
            className={styles.filterSelect}
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
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
              {sectors.length ? `${sectors.length} sector${sectors.length > 1 ? 's' : ''} selected` : "Select Sectors"}
            </button>
            <div id="sector-dropdown" className={`hidden ${styles.dropdownMenu}`}>
              {industryOptions.map((sector) => (
                <div key={sector} className={styles.dropdownItem}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={sectors.includes(sector)}
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
            value={bbbeeLevel}
            onChange={(e) => setBbbeeLevel(e.target.value)}
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
                  checked={procurementCategories.includes(category)}
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
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
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
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
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
          onClick={applyFilters}
        >
          Apply Filters
        </button>
      </div>
    </div>
  )
}