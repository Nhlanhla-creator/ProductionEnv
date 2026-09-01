"use client"
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Search, Copy,
  ArrowUp, ArrowDown, Star, AlertTriangle, CheckCircle, Circle
} from 'lucide-react'
import FormField from "./form-field"
import './UniversalProfile.css';
import {
  deliveryModes,
  productDeliveryRoleOptions,
  serviceOperatingModelOptions,
  commercialDeliveryPatternOptions,
  deliveryPatternConfig,
  leadTimeUnitOptions,
  geographicCoverageOptions,
  industriesServedOptions,
  customerTypeOptions,
  applicationGroups,
  clientTypeOptions,
  referencePermissionOptions,
  growthPotentialOptions,
} from './applicationOptions'
import { taxonomyLeaves, searchTaxonomy, getLeafById, capabilityProfiles } from './taxonomyData'

// ============================================================================
// Developer Brief v1 (29 July 2026) — Products & Services Taxonomy
//
// Core product decision this file implements: Sector describes where an SME
// can operate. Offering category describes what the SME actually provides.
// The offering category controls the taxonomy trigger; industry/sector ranks
// suggestions and adds context but never defines the offering itself.
//
// Each saved product/service is now a self-contained "offering" (Section 4.2)
// with its own taxonomy category, delivery model and industries, rather than
// a flat table grouped under a re-used industry-style Category field.
// ============================================================================

const industryOptions = industriesServedOptions.map((v) => ({ value: v, label: v }))

let _offeringSeq = 0
const newOfferingId = () => `offering_${Date.now()}_${(_offeringSeq++).toString(36)}`

const emptyOffering = (offeringType) => ({
  id: newOfferingId(),
  offeringType, // 'Product' | 'Service'
  taxonomyLeafId: null,
  breadcrumb: '',
  customCategoryRequest: '',
  name: '',
  description: '',
  isPrimary: false,
  deliveryRole: [],
  commercialPattern: [],
  deliveryStandard: '', // value from the dynamic deliveryPatternConfig options
  minLeadTime: '',
  minLeadTimeUnit: 'Calendar days',
  maxLeadTime: '',
  maxLeadTimeUnit: 'Calendar days',
  dependsOnScope: false,
  scopeExplanation: '',
  geographicCoverage: [],
  industries: [],
  industryApplications: [],
  collapsed: false,
})

// ---------------------------------------------------------------------------
// Shared style tokens (kept identical to the original file's palette)
// ---------------------------------------------------------------------------
const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #d6c4a8',
  borderRadius: '6px',
  fontSize: '13px',
  outline: 'none',
  color: '#3d2b1f',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  backgroundColor: 'white',
}
const focusHandlers = {
  onFocus: (e) => { e.currentTarget.style.borderColor = '#8B4513'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,69,19,0.1)' },
  onBlur: (e) => { e.currentTarget.style.borderColor = '#d6c4a8'; e.currentTarget.style.boxShadow = 'none' },
}

const pillStyle = (active) => ({
  padding: '4px 10px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: '600',
  border: `1px solid ${active ? '#8B4513' : '#d6c4a8'}`,
  backgroundColor: active ? '#8B4513' : 'white',
  color: active ? 'white' : '#5c3a1e',
  cursor: 'pointer',
  userSelect: 'none',
  whiteSpace: 'nowrap',
})

// MultiSelect component for dropdown-style multi-select
function MultiSelect({ options, selected = [], onChange, label, placeholder, isTagMode = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  const toggleDropdown = () => setIsOpen(!isOpen)
  const closeDropdown = () => setIsOpen(false)

  const handleSelect = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width })
    }
  }, [isOpen])

  useEffect(() => {
    const updateCoords = () => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width })
      }
    }
    window.addEventListener('resize', updateCoords)
    window.addEventListener('scroll', updateCoords, true)
    return () => {
      window.removeEventListener('resize', updateCoords)
      window.removeEventListener('scroll', updateCoords, true)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && triggerRef.current && !triggerRef.current.contains(event.target)) {
        if (event.target.closest('[data-multiselect-portal="true"]')) return
        closeDropdown()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const optionList = options.map(opt => typeof opt === 'string' ? { value: opt, label: opt } : opt)

  return (
    <div ref={triggerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={toggleDropdown}
        style={{
          border: '1px solid #d6c4a8', borderRadius: '6px', padding: '10px 14px', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '44px',
          backgroundColor: 'white', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8B4513'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
      >
        {selected && selected.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
            {selected.map((cat) => (
              <span key={cat} style={{
                backgroundColor: '#f0e8d8', padding: '4px 12px', borderRadius: '14px', fontSize: '13px',
                color: '#5c3a1e', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}>
                {optionList.find((opt) => opt.value === cat)?.label || cat}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: '#999', fontSize: '14px' }}>{placeholder || `Select ${label}`}</span>
        )}
        {isOpen ? <ChevronUp size={20} color="#5c3a1e" /> : <ChevronDown size={20} color="#5c3a1e" />}
      </div>

      {isOpen && createPortal(
        <div
          data-multiselect-portal="true"
          style={{
            position: 'absolute', top: `${coords.top + 4}px`, left: `${coords.left}px`, width: `${coords.width}px`,
            backgroundColor: 'white', border: '1px solid #d6c4a8', borderRadius: '6px', zIndex: 99999,
            maxHeight: '280px', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', minWidth: '250px'
          }}
        >
          <div style={{ padding: '4px' }}>
            {optionList.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  backgroundColor: selected.includes(option.value) ? '#fdf6ed' : 'white',
                  display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f5f0e8',
                  fontSize: '14px', borderRadius: '4px', transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => { if (!selected.includes(option.value)) e.currentTarget.style.backgroundColor = '#faf5ef' }}
                onMouseLeave={(e) => { if (!selected.includes(option.value)) e.currentTarget.style.backgroundColor = 'white' }}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '4px',
                  border: `2px solid ${selected.includes(option.value) ? '#8B4513' : '#d1d5db'}`,
                  backgroundColor: selected.includes(option.value) ? '#8B4513' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {selected.includes(option.value) && <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>}
                </div>
                <span style={{ color: '#3d2b1f' }}>{option.label}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px', borderTop: '1px solid #d6c4a8', backgroundColor: '#fdfaf5', borderRadius: '0 0 6px 6px', position: 'sticky', bottom: 0 }}>
            <button
              type="button"
              onClick={closeDropdown}
              style={{ width: '100%', padding: '10px', backgroundColor: '#8B4513', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'background-color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5c3a1e'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8B4513'}
            >
              Done
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TaxonomySearch — Section 4.3 / 5.1
// Searchable, search-first Offering Category selector. Begins suggesting after
// two characters, shows breadcrumb + definition + examples, never restricts by
// profile industry (industries only re-rank), and offers "Suggest a category"
// without blocking completion when nothing matches.
// ---------------------------------------------------------------------------
function TaxonomySearch({ offeringType, value, breadcrumb, onSelect, onRequestCustomCategory, industryHints }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customText, setCustomText] = useState('')
  const triggerRef = useRef(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  const results = useMemo(
    () => searchTaxonomy(query, { offeringType, industryHints }),
    [query, offeringType, industryHints]
  )

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width })
    }
  }, [isOpen, query])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && triggerRef.current && !triggerRef.current.contains(event.target)) {
        if (event.target.closest('[data-taxonomy-portal="true"]')) return
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const selectLeaf = (leaf) => {
    onSelect(leaf)
    setQuery('')
    setIsOpen(false)
    setShowCustomForm(false)
  }

  const submitCustomCategory = () => {
    if (!customText.trim()) return
    onRequestCustomCategory(customText.trim())
    setCustomText('')
    setShowCustomForm(false)
    setIsOpen(false)
  }

  // Selected state (Section 5.1): show full breadcrumb, definition and a Change action.
  if (value && !isOpen) {
    const leaf = getLeafById(value)
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
        padding: '12px 14px', border: '1px solid #d6c4a8', borderRadius: '6px', backgroundColor: '#fdf6ed'
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#5c3a1e' }}>{breadcrumb}</div>
          {leaf?.definition && <div style={{ fontSize: '11px', color: '#8B6F47', marginTop: '2px' }}>{leaf.definition}</div>}
        </div>
        <button type="button" onClick={() => setIsOpen(true)} style={{
          padding: '6px 14px', fontSize: '12px', fontWeight: '600', color: '#5c3a1e',
          backgroundColor: '#f0e8d8', border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap'
        }}>
          Change
        </button>
      </div>
    )
  }

  return (
    <div ref={triggerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} color="#8B6F47" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
          placeholder="Start typing what your business provides..."
          style={{ ...inputStyle, paddingLeft: '36px' }}
          {...focusHandlers}
        />
      </div>

      {isOpen && createPortal(
        <div
          data-taxonomy-portal="true"
          style={{
            position: 'absolute', top: `${coords.top + 4}px`, left: `${coords.left}px`, width: `${Math.max(coords.width, 320)}px`,
            backgroundColor: 'white', border: '1px solid #d6c4a8', borderRadius: '6px', zIndex: 99999,
            maxHeight: '360px', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }}
        >
          {query.trim().length < 2 ? (
            <div style={{ padding: '16px', fontSize: '12px', color: '#8B6F47' }}>
              Keep typing (e.g. "aircon", "cleaning", "PPE", "irrigation") — suggestions appear after 2 characters.
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '14px' }}>
              <div style={{ fontSize: '12px', color: '#8B6F47', marginBottom: '10px' }}>
                No close match found for "{query}".
              </div>
              {!showCustomForm ? (
                <button type="button" onClick={() => setShowCustomForm(true)} style={{
                  fontSize: '12px', fontWeight: '600', color: '#8B4513', background: 'none', border: 'none', cursor: 'pointer', padding: 0
                }}>
                  Can't find it? Suggest a category
                </button>
              ) : (
                <div>
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    rows={2}
                    placeholder="Describe what your business provides (5-160 characters)"
                    maxLength={160}
                    style={{ ...inputStyle, fontSize: '12px', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  <button type="button" onClick={submitCustomCategory} disabled={customText.trim().length < 5} style={{
                    marginTop: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', color: 'white',
                    backgroundColor: customText.trim().length < 5 ? '#d6c4a8' : '#8B4513', border: 'none', borderRadius: '4px',
                    cursor: customText.trim().length < 5 ? 'not-allowed' : 'pointer'
                  }}>
                    Submit for review
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              {results.map((leaf) => (
                <div
                  key={leaf.id}
                  onClick={() => selectLeaf(leaf)}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f5f0e8' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#faf5ef'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#5c3a1e' }}>{leaf.breadcrumb}</div>
                  {leaf.leafOptions.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#8B6F47', marginTop: '2px' }}>
                      e.g. {leaf.leafOptions.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
              ))}
              <div style={{ padding: '10px 14px', borderTop: '1px solid #d6c4a8', backgroundColor: '#fdfaf5' }}>
                {!showCustomForm ? (
                  <button type="button" onClick={() => setShowCustomForm(true)} style={{
                    fontSize: '12px', fontWeight: '600', color: '#8B4513', background: 'none', border: 'none', cursor: 'pointer', padding: 0
                  }}>
                    Can't find it? Suggest a category
                  </button>
                ) : (
                  <div>
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      rows={2}
                      placeholder="Describe what your business provides (5-160 characters)"
                      maxLength={160}
                      style={{ ...inputStyle, fontSize: '12px', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                    <button type="button" onClick={submitCustomCategory} disabled={customText.trim().length < 5} style={{
                      marginTop: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', color: 'white',
                      backgroundColor: customText.trim().length < 5 ? '#d6c4a8' : '#8B4513', border: 'none', borderRadius: '4px',
                      cursor: customText.trim().length < 5 ? 'not-allowed' : 'pointer'
                    }}>
                      Submit for review
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

// Yes/No dropdown — still used for a couple of simple boolean-style fields.
const YesNoDropdown = ({ value, onChange }) => (
  <select
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    style={{ ...inputStyle, minHeight: '44px', cursor: 'pointer' }}
    {...focusHandlers}
  >
    <option value="">Select...</option>
    <option value="Yes">Yes</option>
    <option value="No">No</option>
  </select>
)

// Section wrapper component
const Section = ({ title, description, children }) => (
  <div style={{
    marginBottom: '24px', padding: '24px', backgroundColor: '#fdfaf5', borderRadius: '8px',
    border: '1px solid #d6c4a8', transition: 'border-color 0.2s'
  }}>
    <div style={{ marginBottom: '16px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#5c3a1e', margin: 0, marginBottom: description ? '4px' : '0' }}>
        {title}
      </h3>
      {description && <p style={{ fontSize: '12px', color: '#8B6F47', margin: 0 }}>{description}</p>}
    </div>
    {children}
  </div>
)

// Section header with add button
const SectionHeader = ({ title, onAdd, addLabel }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#5c3a1e', margin: 0 }}>{title}</h4>
    {onAdd && (
      <button
        type="button"
        onClick={onAdd}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', backgroundColor: '#f0e8d8',
          color: '#5c3a1e', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: '600',
          cursor: 'pointer', transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0d5c0'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0e8d8'}
      >
        <Plus size={16} /> {addLabel}
      </button>
    )}
  </div>
)

const thStyle = {
  padding: '10px 12px', textAlign: 'left', color: '#ffffff', fontWeight: '600', fontSize: '11px',
  borderBottom: '2px solid #3d2b1f', backgroundColor: '#5c3a1e', whiteSpace: 'nowrap'
}

// ---------------------------------------------------------------------------
// Capability status (Section 4.2 / 18) — computed client-side from what has
// been captured so far. "Verified" is intentionally never auto-assigned here;
// it is set once BIG (or an automated check) has confirmed the evidence, which
// happens outside this form.
// ---------------------------------------------------------------------------
function computeCapabilityStatus(offering) {
  const hasCategory = !!offering.taxonomyLeafId || !!offering.customCategoryRequest
  const hasBasics = offering.name.trim().length >= 2 && offering.description.trim().length >= 20
  const hasDelivery = offering.deliveryRole.length > 0
  const hasIndustries = offering.industries.length > 0

  if (!hasCategory && !hasBasics) return 'Not started'
  if (hasCategory && hasBasics && hasDelivery && hasIndustries) return 'Basic complete'
  if (offering.taxonomyLeafId && (!hasBasics || !hasDelivery || !hasIndustries)) return 'Needs update'
  return 'In progress'
}

const statusStyle = {
  'Not started': { bg: '#f3f4f6', fg: '#6b7280' },
  'In progress': { bg: '#fef3c7', fg: '#92400e' },
  'Basic complete': { bg: '#dcfce7', fg: '#166534' },
  'Needs update': { bg: '#fee2e2', fg: '#991b1b' },
  'Verified': { bg: '#dbeafe', fg: '#1e40af' },
}

// Section 6.1 depth rules -> which application groups (Section 11.3) are relevant.
function applicationGroupsForDepth(depth) {
  if (depth <= 0) return []
  if (depth === 1) return applicationGroups.filter((g) => ['People and facilities', 'General'].includes(g.group))
  if (depth === 2) return applicationGroups.filter((g) => ['Plant and technical support', 'People and facilities', 'Infrastructure and utilities', 'General'].includes(g.group))
  if (depth === 3) return applicationGroups.filter((g) => g.group !== 'Production value chain')
  return applicationGroups // depth 4 - Full
}

const depthHint = {
  0: null,
  1: 'Facility/site type',
  2: 'System, environment or application',
  3: 'Operation, process and production area',
  4: 'Commodity, method, process route and production area',
}

// ---------------------------------------------------------------------------
// Completion Checklist Component
// ---------------------------------------------------------------------------
function CompletionChecklist({ offering }) {
  const items = [
    {
      id: 'category',
      label: 'Offering category selected',
      done: !!offering.taxonomyLeafId || !!offering.customCategoryRequest
    },
    {
      id: 'name',
      label: 'Name provided (min 2 chars)',
      done: offering.name.trim().length >= 2
    },
    {
      id: 'description',
      label: 'Description provided (min 20 chars)',
      done: offering.description.trim().length >= 20
    },
    {
      id: 'deliveryRole',
      label: 'Delivery role/model selected',
      done: offering.deliveryRole.length > 0
    },
    {
      id: 'industries',
      label: 'Industries served selected',
      done: offering.industries.length > 0
    }
  ]

  const completed = items.filter(i => i.done).length
  const total = items.length

  return (
    <div style={{
      padding: '10px 14px',
      backgroundColor: '#f8f5f0',
      borderRadius: '6px',
      border: '1px solid #e8ddd0',
      marginBottom: '14px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px'
      }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#5c3a1e' }}>
          Completion Progress
        </span>
        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          color: completed === total ? '#166534' : '#92400e',
          backgroundColor: completed === total ? '#dcfce7' : '#fef3c7',
          padding: '2px 10px',
          borderRadius: '999px'
        }}>
          {completed}/{total}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '4px 12px' }}>
        {items.map((item) => (
          <div key={item.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            color: item.done ? '#166534' : '#6b7280'
          }}>
            {item.done ? (
              <CheckCircle size={12} color="#166534" />
            ) : (
              <Circle size={12} color="#6b7280" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// OfferingCard — Section 4.2. A collapsible card per saved offering, driven end
// to end by the selected taxonomy leaf (Section 6, "trigger engine").
// ---------------------------------------------------------------------------
function OfferingCard({ offering, index, total, onUpdate, onRemove, onDuplicate, onMoveUp, onMoveDown, onSetPrimary, onToggleCollapse, duplicateWarning }) {
  const leaf = offering.taxonomyLeafId ? getLeafById(offering.taxonomyLeafId) : null
  const depth = leaf ? leaf.depthLevel : 0
  const patternKey = leaf ? leaf.deliveryPattern : 'generic_onsite_virtual_hybrid'
  const pattern = deliveryPatternConfig[patternKey] || deliveryPatternConfig.generic_onsite_virtual_hybrid
  const relevantGroups = applicationGroupsForDepth(depth)
  const capabilityProfile = leaf ? capabilityProfiles[leaf.capabilityProfile] : null
  const status = computeCapabilityStatus(offering)
  const sStyle = statusStyle[status]

  const roleOptions = offering.offeringType === 'Product' ? productDeliveryRoleOptions : serviceOperatingModelOptions
  const roleFieldLabel = offering.offeringType === 'Product' ? 'Product delivery role' : 'Service operating model'

  const leadTimeInvalid = offering.minLeadTime && offering.maxLeadTime &&
    Number(offering.minLeadTime) > Number(offering.maxLeadTime) &&
    offering.minLeadTimeUnit === offering.maxLeadTimeUnit

  const missing = []
  if (!offering.taxonomyLeafId && !offering.customCategoryRequest) missing.push('offering category')
  if (offering.name.trim().length < 2) missing.push('name')
  if (offering.description.trim().length < 20) missing.push('description')
  if (offering.deliveryRole.length === 0) missing.push('delivery model')
  if (offering.industries.length === 0) missing.push('at least one industry')

  return (
    <div style={{ border: '1px solid #d6c4a8', borderRadius: '8px', marginBottom: '14px', backgroundColor: 'white', overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        padding: '12px 16px', backgroundColor: '#fdf6ed', cursor: 'pointer'
      }} onClick={() => onToggleCollapse()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <span style={{
            padding: '3px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap',
            backgroundColor: offering.offeringType === 'Product' ? '#e0e7ff' : '#fce7f3',
            color: offering.offeringType === 'Product' ? '#3730a3' : '#9d174d'
          }}>
            {offering.offeringType.toUpperCase()}
          </span>
          {offering.isPrimary && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700', color: '#8B4513' }}>
              <Star size={12} fill="#8B4513" /> PRIMARY
            </span>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#5c3a1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {offering.name || 'Untitled offering'}
            </div>
            <div style={{ fontSize: '11px', color: '#8B6F47', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {offering.breadcrumb || offering.customCategoryRequest || 'No category selected yet'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: '700', backgroundColor: sStyle.bg, color: sStyle.fg, whiteSpace: 'nowrap' }}>
            {status}
          </span>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMoveUp() }} disabled={index === 0} title="Move up"
            style={{ padding: '4px', background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1, color: '#5c3a1e' }}>
            <ArrowUp size={16} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMoveDown() }} disabled={index === total - 1} title="Move down"
            style={{ padding: '4px', background: 'none', border: 'none', cursor: index === total - 1 ? 'default' : 'pointer', opacity: index === total - 1 ? 0.3 : 1, color: '#5c3a1e' }}>
            <ArrowDown size={16} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate() }} title="Duplicate"
            style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#5c3a1e' }}>
            <Copy size={16} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onRemove() }} title="Remove"
            style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
            <Trash2 size={16} />
          </button>
          {offering.collapsed ? <ChevronDown size={18} color="#5c3a1e" /> : <ChevronUp size={18} color="#5c3a1e" />}
        </div>
      </div>

      {!offering.collapsed && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Completion Checklist */}
          <CompletionChecklist offering={offering} />

          {duplicateWarning && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 12px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px' }}>
              <AlertTriangle size={14} color="#c2410c" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '11px', color: '#9a3412' }}>
                This looks similar to another offering (same category, name and industries overlap). Cross-sector reuse is expected — but if this is accidental, consider linking industries to the existing offering instead of creating a duplicate.
              </span>
            </div>
          )}

          {/* Offering Category — Section 5.1 - Full width */}
          <FormField label="Offering category" required>
            <TaxonomySearch
              offeringType={offering.offeringType === 'Product' ? 'products' : 'services'}
              value={offering.taxonomyLeafId}
              breadcrumb={offering.breadcrumb}
              industryHints={offering.industries}
              onSelect={(leafNode) => onUpdate({
                taxonomyLeafId: leafNode.id,
                breadcrumb: leafNode.breadcrumb,
                customCategoryRequest: '',
              })}
              onRequestCustomCategory={(text) => onUpdate({
                taxonomyLeafId: null,
                breadcrumb: '',
                customCategoryRequest: text,
              })}
            />
            <p style={{ fontSize: '10px', color: '#8B6F47', marginTop: '4px', marginBottom: 0 }}>
              Choose the closest category. You can still use your own product or service name below.
            </p>
            {offering.customCategoryRequest && (
              <div style={{ marginTop: '6px', padding: '6px 10px', backgroundColor: '#fdf6ed', border: '1px dashed #d6c4a8', borderRadius: '4px', fontSize: '11px', color: '#5c3a1e' }}>
                Submitted for review: "{offering.customCategoryRequest}". This offering is saved as <strong>pending review</strong> and will not block the rest of your profile.
              </div>
            )}
          </FormField>

          {/* Name & description & primary - Side by side in 2 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Name of your product or service" required>
              <input
                type="text"
                value={offering.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="e.g., 24/7 Industrial Aircon Response"
                maxLength={120}
                style={inputStyle}
                {...focusHandlers}
              />
              <p style={{ fontSize: '10px', color: '#a08a6d', margin: '4px 0 0 0', textAlign: 'right' }}>{offering.name.length}/120</p>
            </FormField>
            <FormField label="Primary offering">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#3d2b1f', minHeight: '44px' }}>
                <input type="radio" name="isPrimaryOffering" checked={offering.isPrimary} onChange={() => onSetPrimary()} style={{ width: '18px', height: '18px', accentColor: '#8B4513', cursor: 'pointer' }} />
                Set as this business's primary offering
              </label>
            </FormField>
          </div>

          {/* Description - Full width */}
          <FormField label="Description" required>
            <textarea
              value={offering.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={2}
              placeholder="What is provided, for whom, and what problem it solves"
              maxLength={1000}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              {...focusHandlers}
            />
            <p style={{ fontSize: '10px', color: '#a08a6d', margin: '4px 0 0 0', textAlign: 'right' }}>{offering.description.length}/1000 (min 20)</p>
          </FormField>

          {/* Delivery role & Commercial pattern - Side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label={roleFieldLabel} required>
              <MultiSelect 
                options={roleOptions.map((o) => ({ value: o.value, label: o.label }))} 
                selected={offering.deliveryRole} 
                onChange={(v) => onUpdate({ deliveryRole: v })} 
                placeholder={`Select ${roleFieldLabel.toLowerCase()}...`}
              />
            </FormField>
            <FormField label="Contract / commercial delivery pattern">
              <MultiSelect 
                options={commercialDeliveryPatternOptions} 
                selected={offering.commercialPattern} 
                onChange={(v) => onUpdate({ commercialPattern: v })} 
                placeholder="Select commercial delivery patterns..."
              />
            </FormField>
          </div>

          {/* Delivery Standards — Section 10 */}
          <div style={{ padding: '12px 14px', backgroundColor: '#fdfaf5', borderRadius: '6px', border: '1px solid #eee0cc' }}>
            <h5 style={{ fontSize: '11px', fontWeight: '700', color: '#5c3a1e', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Delivery standards
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label={pattern.fieldLabel} required>
                <MultiSelect 
                  options={pattern.options} 
                  selected={offering.deliveryStandard ? [offering.deliveryStandard] : []} 
                  onChange={(v) => onUpdate({ deliveryStandard: v[v.length - 1] || '' })} 
                  placeholder={`Select ${pattern.fieldLabel.toLowerCase()}...`}
                />
              </FormField>
              <FormField label="Geographic delivery coverage">
                <MultiSelect 
                  options={geographicCoverageOptions} 
                  selected={offering.geographicCoverage} 
                  onChange={(v) => onUpdate({ geographicCoverage: v })} 
                  placeholder="Select geographic coverage..."
                />
              </FormField>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#3d2b1f', marginBottom: '8px' }}>
                <input type="checkbox" checked={offering.dependsOnScope} onChange={(e) => onUpdate({ dependsOnScope: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#8B4513', cursor: 'pointer' }} />
                A typical lead-time range can't reasonably be supplied ("Depends on scope")
              </label>

              {offering.dependsOnScope ? (
                <textarea
                  value={offering.scopeExplanation}
                  onChange={(e) => onUpdate({ scopeExplanation: e.target.value })}
                  rows={2}
                  placeholder="Explain what drives lead time for this offering"
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', fontSize: '12px' }}
                  {...focusHandlers}
                />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: '#5c3a1e', marginBottom: '3px' }}>Minimum time</label>
                    <div style={{ display: 'flex' }}>
                      <input type="number" min="0" value={offering.minLeadTime} onChange={(e) => onUpdate({ minLeadTime: e.target.value })}
                        placeholder="e.g., 2" style={{ ...inputStyle, borderRadius: '4px 0 0 4px', flex: 1, fontSize: '12px' }} {...focusHandlers} />
                      <select value={offering.minLeadTimeUnit} onChange={(e) => onUpdate({ minLeadTimeUnit: e.target.value })}
                        style={{ padding: '6px 8px', border: '1px solid #d6c4a8', borderLeft: 'none', borderRadius: '0 4px 4px 0', backgroundColor: 'white', fontSize: '11px', cursor: 'pointer', color: '#3d2b1f' }}>
                        {leadTimeUnitOptions.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: '#5c3a1e', marginBottom: '3px' }}>Maximum time</label>
                    <div style={{ display: 'flex' }}>
                      <input type="number" min="0" value={offering.maxLeadTime} onChange={(e) => onUpdate({ maxLeadTime: e.target.value })}
                        placeholder="e.g., 5" style={{ ...inputStyle, borderRadius: '4px 0 0 4px', flex: 1, fontSize: '12px' }} {...focusHandlers} />
                      <select value={offering.maxLeadTimeUnit} onChange={(e) => onUpdate({ maxLeadTimeUnit: e.target.value })}
                        style={{ padding: '6px 8px', border: '1px solid #d6c4a8', borderLeft: 'none', borderRadius: '0 4px 4px 0', backgroundColor: 'white', fontSize: '11px', cursor: 'pointer', color: '#3d2b1f' }}>
                        {leadTimeUnitOptions.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  {leadTimeInvalid && (
                    <div style={{ gridColumn: '1 / -1', fontSize: '10px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} /> Minimum time may not exceed maximum time.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Industries served — Full width */}
          <FormField label="Industries served" required>
            <MultiSelect options={industryOptions} selected={offering.industries} onChange={(v) => onUpdate({ industries: v })} label="industries" placeholder="Select the industries this offering serves..." />
            <p style={{ fontSize: '10px', color: '#8B6F47', marginTop: '4px', marginBottom: 0 }}>
              Selecting Mining, for example, ranks mining-relevant categories higher elsewhere in this form — it never hides other categories.
            </p>
          </FormField>

          {/* Industry application — Section 6.1/11.3 */}
          {relevantGroups.length > 0 && (
            <FormField label="In which industries can this offering be used?">
              {depthHint[depth] && (
                <p style={{ fontSize: '10px', color: '#8B6F47', margin: '0 0 6px 0' }}>Ask only for: {depthHint[depth]}</p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {relevantGroups.map((g) => (
                  <div key={g.group}>
                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#8B6F47', marginBottom: '4px' }}>{g.group}</div>
                    <MultiSelect
                      options={g.values}
                      selected={offering.industryApplications.filter((val) => g.values.includes(val))}
                      onChange={(v) => {
                        const others = offering.industryApplications.filter((val) => !g.values.includes(val))
                        onUpdate({ industryApplications: [...others, ...v] })
                      }}
                      placeholder={`Select ${g.group}...`}
                    />
                  </div>
                ))}
              </div>
            </FormField>
          )}

          {/* Capability preview — Section 12, informational only */}
          {capabilityProfile && (
            <div style={{ padding: '8px 12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#1e40af', marginBottom: '2px' }}>
                Capability profile this will generate: {capabilityProfile.label}
              </div>
              <div style={{ fontSize: '10px', color: '#1e40af' }}>{capabilityProfile.focus}</div>
            </div>
          )}

          {missing.length > 0 && (
            <div style={{ fontSize: '10px', color: '#92400e', backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '6px 10px' }}>
              Still needed before this offering can be marked complete: {missing.join(', ')}.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ProductsServices({ data = {}, updateData }) {
  const [showExplanation, setShowExplanation] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleOfferingTypeChange = (e) => {
    updateData({ offeringType: e.target.value })
  }

  const offerings = data.offerings || []
  const showProducts = data.offeringType === 'products' || data.offeringType === 'both'
  const showServices = data.offeringType === 'services' || data.offeringType === 'both'

  // ---- Offerings CRUD -------------------------------------------------
  const addOffering = (offeringType) => {
    updateData({ offerings: [...offerings, emptyOffering(offeringType)] })
  }
  const updateOffering = (id, patch) => {
    updateData({ offerings: offerings.map((o) => (o.id === id ? { ...o, ...patch } : o)) })
  }
  const removeOffering = (id) => {
    updateData({ offerings: offerings.filter((o) => o.id !== id) })
  }
  const duplicateOffering = (id) => {
    const source = offerings.find((o) => o.id === id)
    if (!source) return
    const copy = { ...source, id: newOfferingId(), isPrimary: false, name: source.name ? `${source.name} (copy)` : source.name }
    const idx = offerings.findIndex((o) => o.id === id)
    const next = [...offerings]
    next.splice(idx + 1, 0, copy)
    updateData({ offerings: next })
  }
  const moveOffering = (id, direction) => {
    const idx = offerings.findIndex((o) => o.id === id)
    const swapWith = idx + direction
    if (swapWith < 0 || swapWith >= offerings.length) return
    const next = [...offerings]
    ;[next[idx], next[swapWith]] = [next[swapWith], next[idx]]
    updateData({ offerings: next })
  }
  const setPrimaryOffering = (id) => {
    updateData({ offerings: offerings.map((o) => ({ ...o, isPrimary: o.id === id })) })
  }
  const toggleCollapse = (id) => {
    updateData({ offerings: offerings.map((o) => (o.id === id ? { ...o, collapsed: !o.collapsed } : o)) })
  }

  // Section 14: duplicate warning when category, name and industries materially overlap.
  const duplicateIds = useMemo(() => {
    const flagged = new Set()
    for (let i = 0; i < offerings.length; i++) {
      for (let j = i + 1; j < offerings.length; j++) {
        const a = offerings[i], b = offerings[j]
        if (!a.taxonomyLeafId || a.taxonomyLeafId !== b.taxonomyLeafId) continue
        if (a.name.trim().toLowerCase() !== b.name.trim().toLowerCase() || !a.name.trim()) continue
        const overlap = a.industries.some((ind) => b.industries.includes(ind))
        if (overlap) { flagged.add(a.id); flagged.add(b.id) }
      }
    }
    return flagged
  }, [offerings])

  const productOfferings = offerings.filter((o) => o.offeringType === 'Product')
  const serviceOfferings = offerings.filter((o) => o.offeringType === 'Service')

  // ---- Section 2: Target Market summary (Section 13.1) ----------------
  const allIndustries = [...new Set(offerings.flatMap((o) => o.industries))]
  const allGeography = [...new Set(offerings.flatMap((o) => o.geographicCoverage))]
  const allApplications = [...new Set(offerings.flatMap((o) => o.industryApplications))]
  const offeringSummaries = offerings.filter((o) => o.name).map((o) => `${o.name} (${o.breadcrumb || o.customCategoryRequest || 'category pending'}${o.deliveryRole.length ? ' — ' + o.deliveryRole.join(', ') : ''})`)
  const customerTypes = data.customerTypes || []
  const hasAnySummaryData = Boolean(customerTypes.length || allIndustries.length || allGeography.length || allApplications.length || offeringSummaries.length)

  // ---- Section 4: Key Clients ------------------------------------------
  const addClient = () => {
    const keyClients = data.keyClients || []
    updateData({
      keyClients: [...keyClients, {
        name: "", clientType: "", contactName: "", contactRole: "", contactEmail: "", contactNumber: "",
        industries: [], revenuePercentage: "", offeringsDelivered: [], deliveryStart: "", deliveryEnd: "",
        referencePermission: "", growthPotential: "", growthDetails: "",
      }]
    })
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

  const totalRevenuePercent = (data.keyClients || []).reduce((sum, c) => sum + (parseFloat(c.revenuePercentage) || 0), 0)
  const revenueOver100 = totalRevenuePercent > 100

  const offeringNameOptions = offerings.filter((o) => o.name).map((o) => o.name)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#5c3a1e', margin: 0 }}>Products & Services</h2>
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', transition: 'background-color 0.2s', color: '#5c3a1e' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0e8d8'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title={showExplanation ? "Hide explanation" : "Show explanation"}
        >
          {showExplanation ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {showExplanation && (
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', margin: '0 0 8px 0' }}>📋 Products & Services — Guidance</h4>
          <p style={{ color: '#1e40af', margin: '0 0 8px 0', fontSize: '12px', lineHeight: '1.6' }}>
            This section helps us <strong>match your business with the right funders, corporates, and service providers</strong> by
            capturing <strong>what you actually provide</strong> — not just the industries you work in. Search for your offering
            below (e.g. "aircon repair", "PPE", "hoist hire"); your industries and delivery details are captured separately and
            apply to that offering wherever it's used.
          </p>
          <ul style={{ color: '#1e40af', margin: 0, paddingLeft: '20px', fontSize: '12px', lineHeight: '1.8' }}>
            <li>One offering can serve several industries — you don't need to duplicate it per sector.</li>
            <li>Keep your own commercial name and description; the category is only used for matching.</li>
            <li>Can't find your category? Suggest one — it won't block the rest of your profile.</li>
            <li>Mark one offering as your primary offering.</li>
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
              <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#3d2b1f' }}>
                <input type="radio" name="offeringType" value={value} checked={data.offeringType === value} onChange={handleOfferingTypeChange}
                  style={{ width: '18px', height: '18px', accentColor: '#8B4513', cursor: 'pointer' }} required />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </FormField>

        {showProducts && (
          <div style={{ marginTop: '20px' }}>
            <SectionHeader title="Products" onAdd={() => addOffering('Product')} addLabel="Add Product" />
            {productOfferings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#999', fontSize: '13px', backgroundColor: '#fdfaf5', borderRadius: '8px', border: '1px dashed #d6c4a8' }}>
                No products added yet. Click "Add Product" and search for what your business provides.
              </div>
            ) : (
              productOfferings.map((offering) => (
                <OfferingCard
                  key={offering.id}
                  offering={offering}
                  index={offerings.findIndex((o) => o.id === offering.id)}
                  total={offerings.length}
                  duplicateWarning={duplicateIds.has(offering.id)}
                  onUpdate={(patch) => updateOffering(offering.id, patch)}
                  onRemove={() => removeOffering(offering.id)}
                  onDuplicate={() => duplicateOffering(offering.id)}
                  onMoveUp={() => moveOffering(offering.id, -1)}
                  onMoveDown={() => moveOffering(offering.id, 1)}
                  onSetPrimary={() => setPrimaryOffering(offering.id)}
                  onToggleCollapse={() => toggleCollapse(offering.id)}
                />
              ))
            )}
          </div>
        )}

        {showServices && (
          <div style={{ marginTop: '20px' }}>
            <SectionHeader title="Services" onAdd={() => addOffering('Service')} addLabel="Add Service" />
            {serviceOfferings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#999', fontSize: '13px', backgroundColor: '#fdfaf5', borderRadius: '8px', border: '1px dashed #d6c4a8' }}>
                No services added yet. Click "Add Service" and search for what your business provides.
              </div>
            ) : (
              serviceOfferings.map((offering) => (
                <OfferingCard
                  key={offering.id}
                  offering={offering}
                  index={offerings.findIndex((o) => o.id === offering.id)}
                  total={offerings.length}
                  duplicateWarning={duplicateIds.has(offering.id)}
                  onUpdate={(patch) => updateOffering(offering.id, patch)}
                  onRemove={() => removeOffering(offering.id)}
                  onDuplicate={() => duplicateOffering(offering.id)}
                  onMoveUp={() => moveOffering(offering.id, -1)}
                  onMoveDown={() => moveOffering(offering.id, 1)}
                  onSetPrimary={() => setPrimaryOffering(offering.id)}
                  onToggleCollapse={() => toggleCollapse(offering.id)}
                />
              ))
            )}
          </div>
        )}
      </Section>

      {/* ============================================================ */}
      {/* SECTION 2: Target Market */}
      {/* ============================================================ */}
      <Section title="Section 2: Target Market">
        <FormField label="Customer types">
          <MultiSelect 
            options={customerTypeOptions} 
            selected={customerTypes} 
            onChange={(v) => updateData({ customerTypes: v })} 
            placeholder="Select customer types..."
          />
        </FormField>

        {hasAnySummaryData && (
          <div style={{ marginTop: '16px', marginBottom: '16px', padding: '14px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px' }}>
            <h5 style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Generated summary — from your offerings above
            </h5>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#1e40af', lineHeight: '1.8' }}>
              {customerTypes.length > 0 && <li><strong>Customer types:</strong> {customerTypes.join(', ')}</li>}
              {allIndustries.length > 0 && <li><strong>Industries served:</strong> {allIndustries.join(', ')}</li>}
              {allGeography.length > 0 && <li><strong>Geographic markets:</strong> {allGeography.join(', ')}</li>}
              {allApplications.length > 0 && <li><strong>Client applications:</strong> {allApplications.join(', ')}</li>}
              {offeringSummaries.length > 0 && <li><strong>Offering category &amp; delivery model:</strong> {offeringSummaries.join('; ')}</li>}
            </ul>
          </div>
        )}

        <FormField label="Anything else about your target customers?" required>
          <textarea
            name="targetMarket"
            value={data.targetMarket || ""}
            onChange={handleChange}
            rows={3}
            placeholder="Add anything important about the customers you are targeting that is not already captured above."
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            {...focusHandlers}
            required
          />
        </FormField>
      </Section>

      {/* ============================================================ */}
      {/* SECTION 3: Key Clients - Table format */}
      {/* ============================================================ */}
      <Section title="Section 3: Key Clients / Customers" description="Optional — evidence of relevant delivery history, linked to the offerings above.">
        {(data.keyClients || []).length > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '4px', marginBottom: '16px',
            fontSize: '12px', fontWeight: '600',
            backgroundColor: revenueOver100 ? '#fff1f0' : totalRevenuePercent === 100 ? '#f0faf0' : '#fdf6ee',
            border: `1px solid ${revenueOver100 ? '#ffccc7' : totalRevenuePercent === 100 ? '#b7eb8f' : '#d6c4a8'}`,
            color: revenueOver100 ? '#cf1322' : totalRevenuePercent === 100 ? '#389e0d' : '#5c3a1e',
          }}>
            <span>
              {revenueOver100 ? `⚠️ Total revenue exceeds 100% (${totalRevenuePercent}%)`
                : totalRevenuePercent === 100 ? `✅ Total revenue allocation: ${totalRevenuePercent}%`
                : `Revenue allocated: ${totalRevenuePercent}% of 100%`}
            </span>
          </div>
        )}

        <SectionHeader title="Clients" onAdd={addClient} addLabel="Add Client" />

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-brown-200 rounded-lg" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={thStyle}>Client Name</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Revenue %</th>
                <th style={thStyle}>Industry</th>
                <th style={thStyle}>Offerings Delivered</th>
                <th style={thStyle}>Delivery Period</th>
                <th style={thStyle}>Reference</th>
                <th style={thStyle}>Growth Potential</th>
                <th style={thStyle} style={{ width: '50px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data.keyClients || []).map((client, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-brown-50/30"}>
                  <td className="px-3 py-2 border-b">
                    <input type="text" value={client.name || ""} onChange={(e) => updateClient(index, "name", e.target.value)} placeholder="Client name"
                      style={{ ...inputStyle, padding: '8px 10px', fontSize: '12px', minWidth: '140px' }} {...focusHandlers} />
                  </td>
                  <td className="px-3 py-2 border-b">
                    <select value={client.clientType || ""} onChange={(e) => updateClient(index, "clientType", e.target.value)}
                      style={{ ...inputStyle, padding: '8px 10px', fontSize: '12px', cursor: 'pointer' }} {...focusHandlers}>
                      <option value="">Select</option>
                      {clientTypeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 border-b" style={{ minWidth: '180px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <input type="text" value={client.contactName || ""} onChange={(e) => updateClient(index, "contactName", e.target.value)} placeholder="Contact name"
                        style={{ ...inputStyle, padding: '6px 10px', fontSize: '11px' }} {...focusHandlers} />
                      <input type="text" value={client.contactRole || ""} onChange={(e) => updateClient(index, "contactRole", e.target.value)} placeholder="Role"
                        style={{ ...inputStyle, padding: '6px 10px', fontSize: '11px' }} {...focusHandlers} />
                      <input type="email" value={client.contactEmail || ""} onChange={(e) => updateClient(index, "contactEmail", e.target.value)} placeholder="Email"
                        style={{ ...inputStyle, padding: '6px 10px', fontSize: '11px' }} {...focusHandlers} />
                      <input type="text" value={client.contactNumber || ""} onChange={(e) => updateClient(index, "contactNumber", e.target.value)} placeholder="Phone"
                        style={{ ...inputStyle, padding: '6px 10px', fontSize: '11px' }} {...focusHandlers} />
                    </div>
                  </td>
                  <td className="px-3 py-2 border-b">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="number" min="0" max="100" value={client.revenuePercentage || ""} onChange={(e) => {
                          const val = Math.min(100, Math.max(0, Number(e.target.value)))
                          updateClient(index, "revenuePercentage", val === 0 ? "" : String(val))
                        }} placeholder="%" style={{ ...inputStyle, width: '64px', padding: '8px 10px', fontSize: '12px' }} {...focusHandlers} />
                      <span style={{ fontSize: '12px', color: '#5c3a1e', fontWeight: '600' }}>%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 border-b" style={{ minWidth: '170px' }}>
                    <MultiSelect options={industryOptions} selected={client.industries || []} onChange={(v) => updateClient(index, "industries", v)} label="industries" placeholder="Select..." />
                  </td>
                  <td className="px-3 py-2 border-b" style={{ minWidth: '170px' }}>
                    {offeringNameOptions.length === 0 ? (
                      <span style={{ fontSize: '11px', color: '#a08a6d' }}>Add an offering above first</span>
                    ) : (
                      <MultiSelect options={offeringNameOptions} selected={client.offeringsDelivered || []} onChange={(v) => updateClient(index, "offeringsDelivered", v)} placeholder="Select offerings..." />
                    )}
                  </td>
                  <td className="px-3 py-2 border-b" style={{ minWidth: '170px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <input type="date" value={client.deliveryStart || ""} onChange={(e) => updateClient(index, "deliveryStart", e.target.value)}
                        style={{ ...inputStyle, padding: '6px 10px', fontSize: '11px' }} {...focusHandlers} />
                      <input type="date" value={client.deliveryEnd || ""} onChange={(e) => updateClient(index, "deliveryEnd", e.target.value)}
                        style={{ ...inputStyle, padding: '6px 10px', fontSize: '11px' }} {...focusHandlers} />
                    </div>
                  </td>
                  <td className="px-3 py-2 border-b">
                    <select value={client.referencePermission || ""} onChange={(e) => updateClient(index, "referencePermission", e.target.value)}
                      style={{ ...inputStyle, padding: '8px 10px', fontSize: '12px', cursor: 'pointer' }} {...focusHandlers}>
                      <option value="">Select</option>
                      {referencePermissionOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 border-b">
                    <select value={client.growthPotential || ""} onChange={(e) => updateClient(index, "growthPotential", e.target.value)}
                      style={{ ...inputStyle, padding: '8px 10px', fontSize: '12px', cursor: 'pointer' }} {...focusHandlers}>
                      <option value="">Select</option>
                      {growthPotentialOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    {(client.growthPotential === 'High' || client.growthPotential === 'Medium') && (
                      <textarea value={client.growthDetails || ""} onChange={(e) => updateClient(index, "growthDetails", e.target.value)} placeholder="Growth details..." rows={1}
                        style={{ ...inputStyle, marginTop: '6px', padding: '6px 10px', fontSize: '11px', resize: 'vertical', fontFamily: 'inherit' }} {...focusHandlers} />
                    )}
                  </td>
                  <td className="px-3 py-2 border-b" style={{ textAlign: 'center' }}>
                    <button type="button" onClick={() => removeClient(index)} style={{ padding: '6px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {(data.keyClients || []).length === 0 && (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '13px', backgroundColor: '#fdfaf5' }}>
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