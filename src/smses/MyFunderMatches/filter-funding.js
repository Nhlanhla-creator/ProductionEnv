"use client"

import { useState, useEffect } from "react"
import { Slider } from "./slider"
import { Filter, X, ChevronDown, ChevronUp, Check, Search } from "lucide-react"
import styles from "./funding.module.css"

export function FilterFunding({ onFilterChange, filters }) {
  const [location, setLocation] = useState(filters.location || "")
  const [matchScore, setMatchScore] = useState([filters.matchScore ?? 50])
  const [minValue, setMinValue] = useState(filters.minValue || "")
  const [maxValue, setMaxValue] = useState(filters.maxValue || "")
  const [instruments, setInstruments] = useState(filters.instruments || [])
  const [stages, setStages] = useState(filters.stages || [])
  const [sectors, setSectors] = useState(filters.sectors || [])
  const [supportTypes, setSupportTypes] = useState(filters.supportTypes || [])
  const [funderType, setFunderType] = useState(filters.funderType || "")
  const [sortBy, setSortBy] = useState(filters.sortBy || "")
  const [isStageDropdownOpen, setIsStageDropdownOpen] = useState(false)
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false)
  const [isInstrumentsDropdownOpen, setIsInstrumentsDropdownOpen] = useState(false)
  const [isSupportDropdownOpen, setIsSupportDropdownOpen] = useState(false)
  const [isFilterVisible, setIsFilterVisible] = useState(false)
  const [activeFilters, setActiveFilters] = useState([])

  // Update parent component when filters change
  useEffect(() => {
    onFilterChange({
      location,
      matchScore: matchScore[0],
      minValue,
      maxValue,
      instruments,
      stages,
      sectors,
      supportTypes,
      funderType,
      sortBy,
    })

    // Update active filters for display
    const newActiveFilters = [];
    if (location) newActiveFilters.push({ type: "location", value: location });
    if (matchScore[0] !== 50) newActiveFilters.push({ type: "matchScore", value: `${matchScore[0]}%+` });
    if (minValue) newActiveFilters.push({ type: "minValue", value: `Min: R${minValue}` });
    if (maxValue) newActiveFilters.push({ type: "maxValue", value: `Max: R${maxValue}` });
    instruments.forEach((inst) => newActiveFilters.push({ type: "instrument", value: inst }));
    stages.forEach((stage) => newActiveFilters.push({ type: "stage", value: stage }));
    sectors.forEach((sector) => newActiveFilters.push({ type: "sector", value: sector }));
    supportTypes.forEach((support) => newActiveFilters.push({ type: "support", value: support }));
    if (funderType) newActiveFilters.push({ type: "funderType", value: funderType });
    if (sortBy) newActiveFilters.push({ type: "sortBy", value: sortBy });

    setActiveFilters(newActiveFilters)
  }, [location, matchScore, minValue, maxValue, instruments, stages, sectors, supportTypes, funderType, sortBy])

  const handleInstrumentChange = (instrument) => {
    if (instruments.includes(instrument)) {
      setInstruments(instruments.filter((i) => i !== instrument))
    } else {
      setInstruments([...instruments, instrument])
    }
  }

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

  const removeFilter = (type, value) => {
    switch (type) {
      case "location":
        setLocation("")
        break
      case "matchScore":
        setMatchScore([50])
        break
      case "minValue":
        setMinValue("")
        break
      case "maxValue":
        setMaxValue("")
        break
      case "instrument":
        setInstruments(instruments.filter((i) => i !== value))
        break
      case "stage":
        setStages(stages.filter((s) => s !== value))
        break
      case "sector":
        setSectors(sectors.filter((s) => s !== value))
        break
      case "support":
        setSupportTypes(supportTypes.filter((s) => s !== value))
        break
      case "funderType":
        setFunderType("")
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

  const instrumentOptions = ["Equity", "Debt", "Grant", "Convertible Note", "Blended Finance", "Quasi-Equity"]

  const stageOptions = ["Pre-seed", "Seed", "Series A", "Growth", "Maturity", "Turnaround"]

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

  const supportOptions = ["Mentorship", "Technical Assistance", "Market Access", "Network Access", "ESG Support"]

  const funderTypeOptions = [
    "Venture Capital",
    "Angel Investor",
    "Bank",
    "Development Finance Institution",
    "Corporate Investor",
    "Government Agency",
    "Impact Investor",
  ]

  const sortOptions = [
    "Match Score (High to Low)",
    "Match Score (Low to High)",
    "Deadline (Soonest First)",
    "Amount (High to Low)",
    "Amount (Low to High)",
  ]

  const handleClearFilters = () => {
    setLocation("")
    setMatchScore([50])
    setMinValue("")
    setMaxValue("")
    setInstruments([])
    setStages([])
    setSectors([])
    setSupportTypes([])
    setFunderType("")
    setSortBy("")
  }

  const handleApplyFilters = () => {
    onFilterChange({
      location,
      matchScore: matchScore[0],
      minValue,
      maxValue,
      instruments,
      stages,
      sectors,
      supportTypes,
      funderType,
      sortBy,
    });
  };

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
          <input type="text" placeholder="Quick search funders..." className={styles.quickSearchInput} />
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
            <h3 className={styles.filterTitle}>Investment Range</h3>
            <div className={styles.rangeInputs}>
              <div className={styles.inputWithPrefix}>
                <span className={styles.inputPrefix}>R</span>
                <input
                  type="number"
                  placeholder="Min"
                  className={styles.filterInput}
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                />
              </div>
              <div className={styles.inputWithPrefix}>
                <span className={styles.inputPrefix}>R</span>
                <input
                  type="number"
                  placeholder="Max"
                  className={styles.filterInput}
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.filterCard}>
            <h3 className={styles.filterTitle}>Preferred Instruments</h3>
            <div className={styles.dropdownContainer}>
              <button
                className={`${styles.multiSelectButton} ${instruments.length ? styles.multiSelectActive : ""}`}
                onClick={() => setIsInstrumentsDropdownOpen(!isInstrumentsDropdownOpen)}
              >
                {instruments.length ? `${instruments.length} selected` : "Select Instruments"}
                {isInstrumentsDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {isInstrumentsDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {instrumentOptions.map((instrument) => (
                    <div key={instrument} className={styles.dropdownItem}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={instruments.includes(instrument)}
                          onChange={() => handleInstrumentChange(instrument)}
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxText}>{instrument}</span>
                        {instruments.includes(instrument) && <Check size={14} className={styles.checkboxIcon} />}
                      </label>
                    </div>
                  ))}
                  <div className={styles.dropdownActions}>
                    <button onClick={() => setIsInstrumentsDropdownOpen(false)} className={styles.dropdownButton}>
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.filterCard}>
            <h3 className={styles.filterTitle}>Stage Focus</h3>
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
            <h3 className={styles.filterTitle}>Funder Type</h3>
            <select className={styles.filterSelect} value={funderType} onChange={(e) => setFunderType(e.target.value)}>
              <option value="">All Funder Types</option>
              {funderTypeOptions.map((type) => (
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
          <button className={styles.applyFiltersButton} onClick={handleApplyFilters}>Apply Filters</button>
        </div>
      </div>
    </div>
  )
}