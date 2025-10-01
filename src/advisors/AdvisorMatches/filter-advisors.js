"use client"

import { useState, useEffect } from "react"
import { Slider } from "./slider"
import { Filter, X, ChevronDown, ChevronUp, Check, Search } from 'lucide-react'
import styles from "./advisor-funding.module.css";

export function FilterAdvisors({ onFilterChange, filters }) {
  const [location, setLocation] = useState(filters.location || "")
  const [matchScore, setMatchScore] = useState([filters.matchScore || 50])
  const [minExperience, setMinExperience] = useState(filters.minExperience || "")
  const [maxExperience, setMaxExperience] = useState(filters.maxExperience || "")
  const [expertiseAreas, setExpertiseAreas] = useState(filters.expertiseAreas || [])
  const [advisoryTypes, setAdvisoryTypes] = useState(filters.advisoryTypes || [])
  const [sectors, setSectors] = useState(filters.sectors || [])
  const [supportTypes, setSupportTypes] = useState(filters.supportTypes || [])
  const [advisorType, setAdvisorType] = useState(filters.advisorType || "")
  const [sortBy, setSortBy] = useState(filters.sortBy || "")
  const [isAdvisoryDropdownOpen, setIsAdvisoryDropdownOpen] = useState(false)
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false)
  const [isExpertiseDropdownOpen, setIsExpertiseDropdownOpen] = useState(false)
  const [isSupportDropdownOpen, setIsSupportDropdownOpen] = useState(false)
  const [isFilterVisible, setIsFilterVisible] = useState(false)
  const [activeFilters, setActiveFilters] = useState([])

  // Update parent component when filters change
  useEffect(() => {
    onFilterChange({
      location,
      matchScore: matchScore[0],
      minExperience,
      maxExperience,
      expertiseAreas,
      advisoryTypes,
      sectors,
      supportTypes,
      advisorType,
      sortBy,
    })

    // Update active filters for display
    const newActiveFilters = []
    if (location) newActiveFilters.push({ type: "location", value: location })
    if (matchScore[0] !== 50) newActiveFilters.push({ type: "matchScore", value: `${matchScore[0]}%+` })
    if (minExperience) newActiveFilters.push({ type: "minExperience", value: `Min: ${minExperience} years` })
    if (maxExperience) newActiveFilters.push({ type: "maxExperience", value: `Max: ${maxExperience} years` })
    expertiseAreas.forEach((area) => newActiveFilters.push({ type: "expertise", value: area }))
    advisoryTypes.forEach((type) => newActiveFilters.push({ type: "advisory", value: type }))
    sectors.forEach((sector) => newActiveFilters.push({ type: "sector", value: sector }))
    supportTypes.forEach((support) => newActiveFilters.push({ type: "support", value: support }))
    if (advisorType) newActiveFilters.push({ type: "advisorType", value: advisorType })
    if (sortBy) newActiveFilters.push({ type: "sortBy", value: sortBy })

    setActiveFilters(newActiveFilters)
  }, [location, matchScore, minExperience, maxExperience, expertiseAreas, advisoryTypes, sectors, supportTypes, advisorType, sortBy])

  const handleExpertiseChange = (expertise) => {
    if (expertiseAreas.includes(expertise)) {
      setExpertiseAreas(expertiseAreas.filter((e) => e !== expertise))
    } else {
      setExpertiseAreas([...expertiseAreas, expertise])
    }
  }

  const handleAdvisoryChange = (advisory) => {
    if (advisoryTypes.includes(advisory)) {
      setAdvisoryTypes(advisoryTypes.filter((a) => a !== advisory))
    } else {
      setAdvisoryTypes([...advisoryTypes, advisory])
    }
  }

  const handleSectorChange = (sector) => {
    if (sectors.includes(sector)) {
      setSectors(sectors.filter((s) => s !== sector))
    } else {
      setSectors([...sectors, sector])
    }
  }

  const handleSupportChange = (support) => {
    if (supportTypes.includes(support)) {
      setSupportTypes(supportTypes.filter((s) => s !== support))
    } else {
      setSupportTypes([...supportTypes, support])
    }
  }

  const removeFilter = (type, value) => {
    switch (type) {
      case "location":
        setLocation("")
        break
      case "matchScore":
        setMatchScore([50])
        break
      case "minExperience":
        setMinExperience("")
        break
      case "maxExperience":
        setMaxExperience("")
        break
      case "expertise":
        setExpertiseAreas(expertiseAreas.filter((e) => e !== value))
        break
      case "advisory":
        setAdvisoryTypes(advisoryTypes.filter((a) => a !== value))
        break
      case "sector":
        setSectors(sectors.filter((s) => s !== value))
        break
      case "support":
        setSupportTypes(supportTypes.filter((s) => s !== value))
        break
      case "advisorType":
        setAdvisorType("")
        break
      case "sortBy":
        setSortBy("")
        break
      default:
        break
    }
  }

  const locations = [
    "South Africa",
    "Namibia",
    "Botswana",
    "Zimbabwe",
    "Mozambique",
    "Lesotho",
    "Eswatini",
    "Zambia",
    "Malawi",
    "Angola",
  ]

  const expertiseOptions = ["Strategy", "Finance", "Marketing", "Operations", "Technology", "Legal", "HR", "Sales"]

  const advisoryOptions = ["Board Advisory", "Strategic Advisory", "Operational Advisory", "Technical Advisory", "Mentorship"]

  const sectorOptions = [
    "ICT",
    "Agriculture",
    "Energy",
    "Manufacturing",
    "Retail",
    "Healthcare",
    "Education",
    "Financial Services",
    "Tourism",
    "Mining",
  ]

  const supportOptions = ["Mentorship", "Network Access", "Strategic Planning", "Market Access", "Funding Guidance"]

  const advisorTypeOptions = [
    "Industry Expert",
    "Former Executive",
    "Serial Entrepreneur",
    "Investor",
    "Academic",
    "Consultant",
  ]

  const sortOptions = [
    "Match Score (High to Low)",
    "Match Score (Low to High)",
    "Experience (Most to Least)",
    "Experience (Least to Most)",
    "Rating (High to Low)",
  ]

  const handleClearFilters = () => {
    setLocation("")
    setMatchScore([50])
    setMinExperience("")
    setMaxExperience("")
    setExpertiseAreas([])
    setAdvisoryTypes([])
    setSectors([])
    setSupportTypes([])
    setAdvisorType("")
    setSortBy("")
  }

  const toggleFilterVisibility = () => {
    setIsFilterVisible(!isFilterVisible)
  }

  return (
    <div className={styles.filterSection}>
      <div className={styles.filterHeader}>
        <button className={styles.filterToggle} onClick={toggleFilterVisibility}>
          <Filter size={16} />
          <span>Filters</span>
          {activeFilters.length > 0 && <span className={styles.filterBadge}>{activeFilters.length}</span>}
          {isFilterVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <div className={styles.quickSearch}>
          <Search size={14} />
          <input type="text" placeholder="Quick search advisors..." className={styles.quickSearchInput} />
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className={styles.activeFiltersContainer}>
          <div className={styles.activeFiltersHeader}>
            <span>Active Filters:</span>
            <button className={styles.clearAllButton} onClick={handleClearFilters}>
              Clear All
            </button>
          </div>
          <div className={styles.activeFiltersList}>
            {activeFilters.map((filter, index) => (
              <div key={index} className={styles.activeFilterTag}>
                <span>{filter.value}</span>
                <button className={styles.removeFilterButton} onClick={() => removeFilter(filter.type, filter.value)}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`${styles.filterContent} ${isFilterVisible ? styles.filterVisible : ""}`}>
        <div className={styles.filterGrid}>
          <div className={styles.filterCard}>
            <h3 className={styles.filterTitle}>Location</h3>
            <select className={styles.filterSelect} value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterCard}>
            <h3 className={styles.filterTitle}>Min Match Score (%)</h3>
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

          <div className={styles.filterCard}>
            <h3 className={styles.filterTitle}>Experience Range (Years)</h3>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                placeholder="Min"
                className={styles.filterInput}
                value={minExperience}
                onChange={(e) => setMinExperience(e.target.value)}
              />
              <input
                type="number"
                placeholder="Max"
                className={styles.filterInput}
                value={maxExperience}
                onChange={(e) => setMaxExperience(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.filterCard}>
            <h3 className={styles.filterTitle}>Expertise Areas</h3>
            <div className={styles.dropdownContainer}>
              <button
                className={`${styles.multiSelectButton} ${expertiseAreas.length ? styles.multiSelectActive : ""}`}
                onClick={() => setIsExpertiseDropdownOpen(!isExpertiseDropdownOpen)}
              >
                {expertiseAreas.length ? `${expertiseAreas.length} selected` : "Select Expertise"}
                {isExpertiseDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {isExpertiseDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {expertiseOptions.map((expertise) => (
                    <div key={expertise} className={styles.dropdownItem}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={expertiseAreas.includes(expertise)}
                          onChange={() => handleExpertiseChange(expertise)}
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxText}>{expertise}</span>
                        {expertiseAreas.includes(expertise) && <Check size={14} className={styles.checkboxIcon} />}
                      </label>
                    </div>
                  ))}
                  <div className={styles.dropdownActions}>
                    <button onClick={() => setIsExpertiseDropdownOpen(false)} className={styles.dropdownButton}>
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.filterCard}>
            <h3 className={styles.filterTitle}>Advisory Type</h3>
            <div className={styles.dropdownContainer}>
              <button
                className={`${styles.multiSelectButton} ${advisoryTypes.length ? styles.multiSelectActive : ""}`}
                onClick={() => setIsAdvisoryDropdownOpen(!isAdvisoryDropdownOpen)}
              >
                {advisoryTypes.length ? `${advisoryTypes.length} selected` : "Select Types"}
                {isAdvisoryDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {isAdvisoryDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {advisoryOptions.map((advisory) => (
                    <div key={advisory} className={styles.dropdownItem}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={advisoryTypes.includes(advisory)}
                          onChange={() => handleAdvisoryChange(advisory)}
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxText}>{advisory}</span>
                        {advisoryTypes.includes(advisory) && <Check size={14} className={styles.checkboxIcon} />}
                      </label>
                    </div>
                  ))}
                  <div className={styles.dropdownActions}>
                    <button onClick={() => setIsAdvisoryDropdownOpen(false)} className={styles.dropdownButton}>
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.filterCard}>
            <h3 className={styles.filterTitle}>Sector</h3>
            <div className={styles.dropdownContainer}>
              <button
                className={`${styles.multiSelectButton} ${sectors.length ? styles.multiSelectActive : ""}`}
                onClick={() => setIsSectorDropdownOpen(!isSectorDropdownOpen)}
              >
                {sectors.length ? `${sectors.length} selected` : "Select Sectors"}
                {isSectorDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {isSectorDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {sectorOptions.map((sector) => (
                    <div key={sector} className={styles.dropdownItem}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={sectors.includes(sector)}
                          onChange={() => handleSectorChange(sector)}
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxText}>{sector}</span>
                        {sectors.includes(sector) && <Check size={14} className={styles.checkboxIcon} />}
                      </label>
                    </div>
                  ))}
                  <div className={styles.dropdownActions}>
                    <button onClick={() => setIsSectorDropdownOpen(false)} className={styles.dropdownButton}>
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.filterCard}>
            <h3 className={styles.filterTitle}>Support Offered</h3>
            <div className={styles.dropdownContainer}>
              <button
                className={`${styles.multiSelectButton} ${supportTypes.length ? styles.multiSelectActive : ""}`}
                onClick={() => setIsSupportDropdownOpen(!isSupportDropdownOpen)}
              >
                {supportTypes.length ? `${supportTypes.length} selected` : "Select Support Types"}
                {isSupportDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {isSupportDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {supportOptions.map((support) => (
                    <div key={support} className={styles.dropdownItem}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={supportTypes.includes(support)}
                          onChange={() => handleSupportChange(support)}
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxText}>{support}</span>
                        {supportTypes.includes(support) && <Check size={14} className={styles.checkboxIcon} />}
                      </label>
                    </div>
                  ))}
                  <div className={styles.dropdownActions}>
                    <button onClick={() => setIsSupportDropdownOpen(false)} className={styles.dropdownButton}>
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.filterCard}>
            <h3 className={styles.filterTitle}>Advisor Type</h3>
            <select className={styles.filterSelect} value={advisorType} onChange={(e) => setAdvisorType(e.target.value)}>
              <option value="">All Advisor Types</option>
              {advisorTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterCard}>
            <h3 className={styles.filterTitle}>Sort by</h3>
            <select className={styles.filterSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="">Default Sorting</option>
              {sortOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.filterActions}>
          <button className={styles.clearFiltersButton} onClick={handleClearFilters}>
            Clear All Filters
          </button>
          <button className={styles.applyFiltersButton}>Apply Filters</button>
        </div>
      </div>
    </div>
  )
}
