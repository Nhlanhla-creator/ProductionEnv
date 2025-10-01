"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Check, Search } from 'lucide-react'
import styles from "./advisor.module.css"

export default function AdvisorFilter({ onFilterChange, filters, onClose }) {
  const [location, setLocation] = useState(filters.location || "")
  const [matchScore, setMatchScore] = useState(filters.matchScore || 50)
  const [expertise, setExpertise] = useState(filters.expertise || [])
  const [sectors, setSectors] = useState(filters.sectors || [])
  const [engagementTypes, setEngagementTypes] = useState(filters.engagementTypes || [])
  const [compensationModel, setCompensationModel] = useState(filters.compensationModel || "")
  const [availability, setAvailability] = useState(filters.availability || "")
  const [sortBy, setSortBy] = useState(filters.sortBy || "")
  const [isExpertiseDropdownOpen, setIsExpertiseDropdownOpen] = useState(false)
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false)
  const [isEngagementDropdownOpen, setIsEngagementDropdownOpen] = useState(false)
  const [quickSearch, setQuickSearch] = useState("")

  const locations = [
    "South Africa",
    "Cape Town",
    "Johannesburg",
    "Pretoria",
    "Durban",
    "Port Elizabeth",
    "Bloemfontein",
    "International",
  ]

  const expertiseOptions = [
    "Finance & Accounting",
    "Marketing & Sales",
    "Technology & Product",
    "Operations & Strategy",
    "Legal & Compliance",
    "HR & Talent",
    "Business Development",
    "International Expansion",
  ]

  const sectorOptions = [
    "Technology",
    "FinTech",
    "HealthTech",
    "EdTech",
    "AgriTech",
    "Manufacturing",
    "Healthcare",
    "Education",
    "Retail",
    "Energy",
  ]

  const engagementTypeOptions = [
    "Strategic Advisor",
    "Board Member",
    "Mentor/Coach",
    "Technical Advisor",
    "Industry Expert",
    "Investor Relations",
  ]

  const compensationOptions = [
    "Pro-bono",
    "Equity",
    "Hourly Rate",
    "Equity + Cash",
    "Retainer",
    "Performance-based",
  ]

  const availabilityOptions = [
    "Immediate",
    "Within 1 month",
    "Within 3 months",
    "Flexible",
    "Project-based",
  ]

  const sortOptions = [
    "Match Score (High to Low)",
    "Match Score (Low to High)",
    "Response Rate (High to Low)",
    "Availability (Soonest First)",
    "Alphabetical",
  ]

  const handleExpertiseChange = (expertise_item) => {
    if (expertise.includes(expertise_item)) {
      setExpertise(expertise.filter((e) => e !== expertise_item))
    } else {
      setExpertise([...expertise, expertise_item])
    }
  }

  const handleSectorChange = (sector) => {
    if (sectors.includes(sector)) {
      setSectors(sectors.filter((s) => s !== sector))
    } else {
      setSectors([...sectors, sector])
    }
  }

  const handleEngagementChange = (engagement) => {
    if (engagementTypes.includes(engagement)) {
      setEngagementTypes(engagementTypes.filter((e) => e !== engagement))
    } else {
      setEngagementTypes([...engagementTypes, engagement])
    }
  }

  const handleClearFilters = () => {
    setLocation("")
    setMatchScore(50)
    setExpertise([])
    setSectors([])
    setEngagementTypes([])
    setCompensationModel("")
    setAvailability("")
    setSortBy("")
    setQuickSearch("")
  }

  const handleApplyFilters = () => {
    const filterData = {
      location,
      matchScore,
      expertise,
      sectors,
      engagementTypes,
      compensationModel,
      availability,
      sortBy,
      quickSearch,
    }
    onFilterChange(filterData)
    onClose()
  }

  return (
    <div className={styles.filterContent}>
      <div className={styles.quickSearchContainer}>
        <Search size={14} />
        <input
          type="text"
          placeholder="Quick search advisors..."
          className={styles.quickSearchInput}
          value={quickSearch}
          onChange={(e) => setQuickSearch(e.target.value)}
        />
      </div>

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
            <input
              type="range"
              min="0"
              max="100"
              value={matchScore}
              onChange={(e) => setMatchScore(Number.parseInt(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.sliderValue}>{matchScore}%</div>
          </div>
        </div>

        <div className={styles.filterCard}>
          <h3 className={styles.filterTitle}>Functional Expertise</h3>
          <div className={styles.dropdownContainer}>
            <button
              className={`${styles.multiSelectButton} ${expertise.length ? styles.multiSelectActive : ""}`}
              onClick={() => setIsExpertiseDropdownOpen(!isExpertiseDropdownOpen)}
            >
              {expertise.length ? `${expertise.length} selected` : "Select Expertise"}
              {isExpertiseDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {isExpertiseDropdownOpen && (
              <div className={styles.dropdownMenu}>
                {expertiseOptions.map((expertiseItem) => (
                  <div key={expertiseItem} className={styles.dropdownItem}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={expertise.includes(expertiseItem)}
                        onChange={() => handleExpertiseChange(expertiseItem)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxText}>{expertiseItem}</span>
                      {expertise.includes(expertiseItem) && <Check size={14} className={styles.checkboxIcon} />}
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
          <h3 className={styles.filterTitle}>Sector Focus</h3>
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
          <h3 className={styles.filterTitle}>Engagement Type</h3>
          <div className={styles.dropdownContainer}>
            <button
              className={`${styles.multiSelectButton} ${engagementTypes.length ? styles.multiSelectActive : ""}`}
              onClick={() => setIsEngagementDropdownOpen(!isEngagementDropdownOpen)}
            >
              {engagementTypes.length ? `${engagementTypes.length} selected` : "Select Engagement Types"}
              {isEngagementDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {isEngagementDropdownOpen && (
              <div className={styles.dropdownMenu}>
                {engagementTypeOptions.map((engagement) => (
                  <div key={engagement} className={styles.dropdownItem}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={engagementTypes.includes(engagement)}
                        onChange={() => handleEngagementChange(engagement)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxText}>{engagement}</span>
                      {engagementTypes.includes(engagement) && <Check size={14} className={styles.checkboxIcon} />}
                    </label>
                  </div>
                ))}
                <div className={styles.dropdownActions}>
                  <button onClick={() => setIsEngagementDropdownOpen(false)} className={styles.dropdownButton}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.filterCard}>
          <h3 className={styles.filterTitle}>Compensation Model</h3>
          <select
            className={styles.filterSelect}
            value={compensationModel}
            onChange={(e) => setCompensationModel(e.target.value)}
          >
            <option value="">All Compensation Models</option>
            {compensationOptions.map((comp) => (
              <option key={comp} value={comp}>
                {comp}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterCard}>
          <h3 className={styles.filterTitle}>Availability</h3>
          <select className={styles.filterSelect} value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <option value="">All Availability</option>
            {availabilityOptions.map((avail) => (
              <option key={avail} value={avail}>
                {avail}
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
        <button className={styles.applyFiltersButton} onClick={handleApplyFilters}>
          Apply Filters
        </button>
      </div>
    </div>
  )
}
