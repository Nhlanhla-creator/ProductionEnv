"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Check, Search } from "lucide-react"
import styles from "./accelerator.module.css"

export default function AcceleratorFilter({ onFilterChange, filters, onClose }) {
  const [location, setLocation] = useState(filters.location || "")
  const [matchScore, setMatchScore] = useState(filters.matchScore || 50)
  const [stages, setStages] = useState(filters.stages || [])
  const [sectors, setSectors] = useState(filters.sectors || [])
  const [supportTypes, setSupportTypes] = useState(filters.supportTypes || [])
  const [programType, setProgramType] = useState(filters.programType || "")
  const [sortBy, setSortBy] = useState(filters.sortBy || "")
  const [isStageDropdownOpen, setIsStageDropdownOpen] = useState(false)
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false)
  const [isSupportDropdownOpen, setIsSupportDropdownOpen] = useState(false)
  const [quickSearch, setQuickSearch] = useState("")

  const locations = [
    "South Africa",
    "Cape Town",
    "Johannesburg",
    "Pretoria",
    "Durban",
    "SADC Region",
    "Africa",
    "Global",
  ]

  const stageOptions = ["Pre-Seed", "Seed", "Series A", "Growth", "Scale-up", "Expansion"]

  const sectorOptions = [
    "Technology",
    "FinTech",
    "HealthTech",
    "EdTech",
    "AgriTech",
    "CleanTech",
    "E-commerce",
    "Manufacturing",
    "Healthcare",
    "Education",
  ]

  const supportOptions = [
    "Mentorship",
    "Office Space",
    "Network Access",
    "Technical Support",
    "Business Development",
    "Marketing Support",
    "Legal Support",
    "Funding Access",
  ]

  const programTypeOptions = [
    "Accelerator",
    "Incubator",
    "Corporate Program",
    "Government Initiative",
    "University Program",
    "Impact Program",
  ]

  const sortOptions = [
    "Match Score (High to Low)",
    "Match Score (Low to High)",
    "Deadline (Soonest First)",
    "Program Duration (Shortest First)",
    "Alphabetical",
  ]

  const handleStageChange = (stage) => {
    if (stages.includes(stage)) {
      setStages(stages.filter((s) => s !== stage))
    } else {
      setStages([...stages, stage])
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

  const handleClearFilters = () => {
    setLocation("")
    setMatchScore(50)
    setStages([])
    setSectors([])
    setSupportTypes([])
    setProgramType("")
    setSortBy("")
    setQuickSearch("")
  }

  const handleApplyFilters = () => {
    const filterData = {
      location,
      matchScore,
      stages,
      sectors,
      supportTypes,
      programType,
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
          placeholder="Quick search accelerators..."
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
          <h3 className={styles.filterTitle}>Program Stage</h3>
          <div className={styles.dropdownContainer}>
            <button
              className={`${styles.multiSelectButton} ${stages.length ? styles.multiSelectActive : ""}`}
              onClick={() => setIsStageDropdownOpen(!isStageDropdownOpen)}
            >
              {stages.length ? `${stages.length} selected` : "Select Stages"}
              {isStageDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {isStageDropdownOpen && (
              <div className={styles.dropdownMenu}>
                {stageOptions.map((stage) => (
                  <div key={stage} className={styles.dropdownItem}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={stages.includes(stage)}
                        onChange={() => handleStageChange(stage)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxText}>{stage}</span>
                      {stages.includes(stage) && <Check size={14} className={styles.checkboxIcon} />}
                    </label>
                  </div>
                ))}
                <div className={styles.dropdownActions}>
                  <button onClick={() => setIsStageDropdownOpen(false)} className={styles.dropdownButton}>
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
          <h3 className={styles.filterTitle}>Program Type</h3>
          <select className={styles.filterSelect} value={programType} onChange={(e) => setProgramType(e.target.value)}>
            <option value="">All Program Types</option>
            {programTypeOptions.map((type) => (
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
        <button className={styles.applyFiltersButton} onClick={handleApplyFilters}>
          Apply Filters
        </button>
      </div>
    </div>
  )
}
