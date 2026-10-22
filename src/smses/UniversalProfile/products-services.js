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

const industryOptions = industriesServedOptions.map((v) => ({ value: v, label: v }))

let _offeringSeq = 0
const newOfferingId = () => `offering_${Date.now()}_${(_offeringSeq++).toString(36)}`

const emptyOffering = (offeringType) => ({
  id: newOfferingId(),
  offeringType,
  taxonomyLeafId: null,
  breadcrumb: '',
  categoryValue: '',
  customCategory: '',
  customCategoryRequest: '',
  name: '',
  description: '',
  isPrimary: false,
  deliveryRole: [],
  commercialPattern: [],
  deliveryStandard: '',
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

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
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

// 3-per-row responsive grid helper
const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }
const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }

// ─────────────────────────────────────────────────────────────────────────────
// MultiSelect (unchanged behaviour, tightened styling)
// ─────────────────────────────────────────────────────────────────────────────
function MultiSelect({ options, selected = [], onChange, label, placeholder }) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  const toggleDropdown = () => setIsOpen(!isOpen)
  const closeDropdown = () => setIsOpen(false)
  const handleSelect = (value) => {
    onChange(selected.includes(value) ? selected.filter((i) => i !== value) : [...selected, value])
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

  const optionList = options.map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt))

  return (
    <div ref={triggerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={toggleDropdown}
        style={{
          border: '1px solid #d6c4a8', borderRadius: '6px', padding: '9px 12px', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '40px',
          backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8B4513'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
      >
        {selected && selected.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1 }}>
            {selected.slice(0, 2).map((cat) => (
              <span key={cat} style={{
                backgroundColor: '#f0e8d8', padding: '2px 8px', borderRadius: '12px', fontSize: '11px',
                color: '#5c3a1e', fontWeight: '500',
              }}>
                {optionList.find((o) => o.value === cat)?.label || cat}
              </span>
            ))}
            {selected.length > 2 && (
              <span style={{ fontSize: '11px', color: '#8B4513', fontWeight: '600' }}>+{selected.length - 2}</span>
            )}
          </div>
        ) : (
          <span style={{ color: '#999', fontSize: '13px' }}>{placeholder || `Select ${label}`}</span>
        )}
        {isOpen ? <ChevronUp size={16} color="#5c3a1e" /> : <ChevronDown size={16} color="#5c3a1e" />}
      </div>

      {isOpen && createPortal(
        <div
          data-multiselect-portal="true"
          style={{
            position: 'absolute', top: `${coords.top + 4}px`, left: `${coords.left}px`, width: `${Math.max(coords.width, 240)}px`,
            backgroundColor: 'white', border: '1px solid #d6c4a8', borderRadius: '6px', zIndex: 99999,
            maxHeight: '260px', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }}
        >
          <div style={{ padding: '4px' }}>
            {optionList.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                style={{
                  padding: '8px 12px', cursor: 'pointer',
                  backgroundColor: selected.includes(option.value) ? '#fdf6ed' : 'white',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  fontSize: '13px', borderRadius: '4px',
                }}
                onMouseEnter={(e) => { if (!selected.includes(option.value)) e.currentTarget.style.backgroundColor = '#faf5ef' }}
                onMouseLeave={(e) => { if (!selected.includes(option.value)) e.currentTarget.style.backgroundColor = 'white' }}
              >
                <div style={{
                  width: '16px', height: '16px', borderRadius: '3px',
                  border: `2px solid ${selected.includes(option.value) ? '#8B4513' : '#d1d5db'}`,
                  backgroundColor: selected.includes(option.value) ? '#8B4513' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {selected.includes(option.value) && <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
                </div>
                <span style={{ color: '#3d2b1f' }}>{option.label}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '8px', borderTop: '1px solid #d6c4a8', backgroundColor: '#fdfaf5', position: 'sticky', bottom: 0 }}>
            <button
              type="button"
              onClick={closeDropdown}
              style={{ width: '100%', padding: '8px', backgroundColor: '#8B4513', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
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

// ─────────────────────────────────────────────────────────────────────────────
// CategorySelect — DROPDOWN-ONLY searchable list, no free text to invent new
// values. Users pick from the existing taxonomy. A small "Suggest a category"
// escape hatch still exists but writes into `customCategoryRequest` (pending
// review), not into the category itself.
// ─────────────────────────────────────────────────────────────────────────────
function CategorySelect({ offeringType, value, breadcrumb, customValue, onSelect, onRequestCustom }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const triggerRef = useRef(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  const categoryLabel = offeringType === 'Product' ? 'Product Category' : 'Service Category'

  const allLeaves = useMemo(() => {
    const wanted = offeringType === 'Product' ? 'Product' : 'Service'
    return taxonomyLeaves.filter((leaf) => leaf.offeringTypes.includes(wanted))
  }, [offeringType])

  const results = useMemo(() => {
    const q = (query || '').trim().toLowerCase()
    if (!q) return allLeaves
    return allLeaves.filter((leaf) =>
      leaf.category.toLowerCase().includes(q) ||
      leaf.domain.toLowerCase().includes(q) ||
      leaf.searchTerms.some((t) => t.includes(q))
    )
  }, [query, allLeaves])

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width })
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && triggerRef.current && !triggerRef.current.contains(event.target)) {
        if (event.target.closest('[data-category-portal="true"]')) return
        setIsOpen(false)
        setShowCustomInput(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const submitCustom = () => {
    if (customInput.trim().length < 5) return
    onRequestCustom(customInput.trim())
    setCustomInput('')
    setShowCustomInput(false)
    setIsOpen(false)
  }

  const displayValue = customValue
    ? `Custom: ${customValue} (pending review)`
    : breadcrumb || ''

  return (
    <div ref={triggerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          border: '1px solid #d6c4a8', borderRadius: '6px', padding: '9px 12px', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '40px',
          backgroundColor: 'white',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8B4513'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
      >
        <span style={{
          color: displayValue ? '#3d2b1f' : '#999',
          fontSize: '13px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {displayValue || `Select ${categoryLabel.toLowerCase()}...`}
        </span>
        {isOpen ? <ChevronUp size={16} color="#5c3a1e" /> : <ChevronDown size={16} color="#5c3a1e" />}
      </div>

      {isOpen && createPortal(
        <div
          data-category-portal="true"
          style={{
            position: 'absolute', top: `${coords.top + 4}px`, left: `${coords.left}px`, width: `${Math.max(coords.width, 320)}px`,
            backgroundColor: 'white', border: '1px solid #d6c4a8', borderRadius: '6px', zIndex: 99999,
            maxHeight: '360px', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }}
        >
          <div style={{ padding: '8px', borderBottom: '1px solid #e8ddd0', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#8B6F47" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search categories..."
                autoFocus
                style={{ ...inputStyle, paddingLeft: '32px', fontSize: '12px', padding: '7px 10px 7px 32px' }}
              />
            </div>
          </div>

          <div>
            {results.length === 0 ? (
              <div style={{ padding: '16px', fontSize: '12px', color: '#8B6F47' }}>
                No matching category found.
              </div>
            ) : (
              results.slice(0, 40).map((leaf) => (
                <div
                  key={leaf.id}
                  onClick={() => { onSelect(leaf); setIsOpen(false); setQuery('') }}
                  style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f5f0e8' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#faf5ef'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#5c3a1e' }}>{leaf.category}</div>
                  <div style={{ fontSize: '10px', color: '#8B6F47', marginTop: '1px' }}>{leaf.domain}</div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '8px 12px', borderTop: '1px solid #e8ddd0', backgroundColor: '#fdfaf5' }}>
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                style={{ fontSize: '11px', fontWeight: '600', color: '#8B4513', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Can't find it? Suggest a category
              </button>
            ) : (
              <div>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  rows={2}
                  maxLength={160}
                  placeholder="Describe what your business provides (5–160 chars)"
                  style={{ ...inputStyle, fontSize: '12px', resize: 'vertical', fontFamily: 'inherit', padding: '6px 10px' }}
                />
                <button
                  type="button"
                  onClick={submitCustom}
                  disabled={customInput.trim().length < 5}
                  style={{
                    marginTop: '6px', padding: '5px 12px', fontSize: '11px', fontWeight: '600', color: 'white',
                    backgroundColor: customInput.trim().length < 5 ? '#d6c4a8' : '#8B4513',
                    border: 'none', borderRadius: '4px',
                    cursor: customInput.trim().length < 5 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Submit for review
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const Section = ({ title, description, children }) => (
  <div style={{
    marginBottom: '20px', padding: '20px', backgroundColor: '#fdfaf5', borderRadius: '8px',
    border: '1px solid #d6c4a8',
  }}>
    <div style={{ marginBottom: '14px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#5c3a1e', margin: 0, marginBottom: description ? '4px' : '0' }}>
        {title}
      </h3>
      {description && <p style={{ fontSize: '12px', color: '#8B6F47', margin: 0 }}>{description}</p>}
    </div>
    {children}
  </div>
)

const SectionHeader = ({ title, onAdd, addLabel }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
    <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#5c3a1e', margin: 0 }}>{title}</h4>
    {onAdd && (
      <button
        type="button"
        onClick={onAdd}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', backgroundColor: '#f0e8d8',
          color: '#5c3a1e', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0d5c0'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0e8d8'}
      >
        <Plus size={14} /> {addLabel}
      </button>
    )}
  </div>
)

const thStyle = {
  padding: '8px 10px', textAlign: 'left', color: '#ffffff', fontWeight: '600', fontSize: '10px',
  borderBottom: '2px solid #3d2b1f', backgroundColor: '#5c3a1e', whiteSpace: 'nowrap'
}

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

function applicationGroupsForDepth(depth) {
  if (depth <= 0) return []
  if (depth === 1) return applicationGroups.filter((g) => ['People and facilities', 'General'].includes(g.group))
  if (depth === 2) return applicationGroups.filter((g) => ['Plant and technical support', 'People and facilities', 'Infrastructure and utilities', 'General'].includes(g.group))
  if (depth === 3) return applicationGroups.filter((g) => g.group !== 'Production value chain')
  return applicationGroups
}

const depthHint = {
  0: null, 1: 'Facility/site type', 2: 'System, environment or application',
  3: 'Operation, process and production area', 4: 'Commodity, method, process route and production area',
}

function CompletionChecklist({ offering }) {
  const items = [
    { id: 'category', label: 'Category', done: !!offering.taxonomyLeafId || !!offering.customCategoryRequest },
    { id: 'name', label: 'Name', done: offering.name.trim().length >= 2 },
    { id: 'description', label: 'Description', done: offering.description.trim().length >= 20 },
    { id: 'deliveryRole', label: 'Delivery model', done: offering.deliveryRole.length > 0 },
    { id: 'industries', label: 'Industries', done: offering.industries.length > 0 },
  ]
  const completed = items.filter((i) => i.done).length
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', backgroundColor: '#f8f5f0', borderRadius: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '11px', fontWeight: '600', color: '#5c3a1e' }}>Progress:</span>
      {items.map((item) => (
        <span key={item.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: item.done ? '#166534' : '#6b7280' }}>
          {item.done ? <CheckCircle size={11} /> : <Circle size={11} />}
          {item.label}
        </span>
      ))}
      <span style={{
        marginLeft: 'auto', fontSize: '10px', fontWeight: '700',
        color: completed === items.length ? '#166534' : '#92400e',
        backgroundColor: completed === items.length ? '#dcfce7' : '#fef3c7',
        padding: '2px 8px', borderRadius: '999px',
      }}>
        {completed}/{items.length}
      </span>
    </div>
  )
}

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

  return (
    <div style={{ border: '1px solid #d6c4a8', borderRadius: '8px', marginBottom: '12px', backgroundColor: 'white', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 14px', backgroundColor: '#fdf6ed' }}>
        <div onClick={() => onToggleCollapse()} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, cursor: 'pointer' }}>
          <span style={{
            padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '700',
            backgroundColor: offering.offeringType === 'Product' ? '#e0e7ff' : '#fce7f3',
            color: offering.offeringType === 'Product' ? '#3730a3' : '#9d174d'
          }}>
            {offering.offeringType.toUpperCase()}
          </span>
          {offering.isPrimary && <Star size={12} fill="#8B4513" color="#8B4513" />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#5c3a1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {offering.name || 'Untitled offering'}
            </div>
            <div style={{ fontSize: '10px', color: '#8B6F47', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {offering.breadcrumb || offering.customCategoryRequest || 'No category yet'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '9px', fontWeight: '700', backgroundColor: sStyle.bg, color: sStyle.fg }}>
            {status}
          </span>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMoveUp() }} disabled={index === 0} title="Move up" style={{ padding: '3px', background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1, color: '#5c3a1e' }}><ArrowUp size={14} /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMoveDown() }} disabled={index === total - 1} title="Move down" style={{ padding: '3px', background: 'none', border: 'none', cursor: index === total - 1 ? 'default' : 'pointer', opacity: index === total - 1 ? 0.3 : 1, color: '#5c3a1e' }}><ArrowDown size={14} /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate() }} title="Duplicate" style={{ padding: '3px', background: 'none', border: 'none', cursor: 'pointer', color: '#5c3a1e' }}><Copy size={14} /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onRemove() }} title="Remove" style={{ padding: '3px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={14} /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onToggleCollapse() }} style={{ padding: '3px', background: 'none', border: 'none', cursor: 'pointer', color: '#5c3a1e' }}>
            {offering.collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!offering.collapsed && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <CompletionChecklist offering={offering} />

          {duplicateWarning && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '6px 10px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px' }}>
              <AlertTriangle size={12} color="#c2410c" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '10px', color: '#9a3412' }}>
                Looks similar to another offering. If accidental, link industries to the existing one instead.
              </span>
            </div>
          )}

          {/* Row: Category + Name + Primary (3 cols) */}
          <div style={grid3}>
            <FormField label={offering.offeringType === 'Product' ? 'Product Category' : 'Service Category'} required>
              <CategorySelect
                offeringType={offering.offeringType}
                value={offering.taxonomyLeafId}
                breadcrumb={offering.breadcrumb}
                customValue={offering.customCategoryRequest || offering.customCategory || ''}
                onSelect={(leafNode) => onUpdate({
                  taxonomyLeafId: leafNode.id,
                  breadcrumb: leafNode.breadcrumb,
                  customCategory: '',
                  customCategoryRequest: '',
                })}
                onRequestCustom={(text) => onUpdate({
                  taxonomyLeafId: null,
                  breadcrumb: '',
                  customCategory: text,
                  customCategoryRequest: text,
                })}
              />
            </FormField>

            <FormField label="Name of product or service" required>
              <input
                type="text"
                value={offering.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="e.g., 24/7 Industrial Aircon Response"
                maxLength={120}
                style={inputStyle}
                {...focusHandlers}
              />
            </FormField>

            <FormField label="Primary offering">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#3d2b1f', minHeight: '40px' }}>
                <input type="radio" name="isPrimaryOffering" checked={offering.isPrimary} onChange={() => onSetPrimary()} style={{ width: '16px', height: '16px', accentColor: '#8B4513', cursor: 'pointer' }} />
                Set as primary
              </label>
            </FormField>
          </div>

          {/* Row: Description full width */}
          <FormField label="Description" required>
            <textarea
              value={offering.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={2}
              placeholder="What is provided, for whom, and what problem it solves"
              maxLength={1000}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', fontSize: '12px' }}
              {...focusHandlers}
            />
            <p style={{ fontSize: '10px', color: '#a08a6d', margin: '2px 0 0 0', textAlign: 'right' }}>{offering.description.length}/1000 (min 20)</p>
          </FormField>

          {/* Row: Delivery role + Commercial pattern (2 cols) */}
          <div style={grid2}>
            <FormField label={roleFieldLabel} required>
              <MultiSelect
                options={roleOptions.map((o) => ({ value: o.value, label: o.label }))}
                selected={offering.deliveryRole}
                onChange={(v) => onUpdate({ deliveryRole: v })}
                placeholder={`Select...`}
              />
            </FormField>
            <FormField label="Commercial delivery pattern">
              <MultiSelect
                options={commercialDeliveryPatternOptions}
                selected={offering.commercialPattern}
                onChange={(v) => onUpdate({ commercialPattern: v })}
                placeholder="Select..."
              />
            </FormField>
          </div>

          {/* Delivery Standards section */}
          <div style={{ marginTop: '4px', paddingTop: '12px', borderTop: '2px solid #d6c4a8' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#5c3a1e', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              📦 Delivery Standards
            </h4>

            {/* Row: Delivery mode + Coverage + Lead time (3 cols) */}
            <div style={grid3}>
              <FormField label={pattern.fieldLabel} required>
                <MultiSelect
                  options={pattern.options}
                  selected={offering.deliveryStandard ? [offering.deliveryStandard] : []}
                  onChange={(v) => onUpdate({ deliveryStandard: v[v.length - 1] || '' })}
                  placeholder="Select..."
                />
              </FormField>

              <FormField label="Geographic coverage">
                <MultiSelect
                  options={geographicCoverageOptions}
                  selected={offering.geographicCoverage}
                  onChange={(v) => onUpdate({ geographicCoverage: v })}
                  placeholder="Select..."
                />
              </FormField>

              <FormField label="Lead time">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#3d2b1f', marginBottom: '4px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={offering.dependsOnScope}
                    onChange={(e) => onUpdate({ dependsOnScope: e.target.checked })}
                    style={{ width: '13px', height: '13px', accentColor: '#8B4513', cursor: 'pointer' }}
                  />
                  Depends on scope
                </label>

                {offering.dependsOnScope ? (
                  <input
                    type="text"
                    value={offering.scopeExplanation}
                    onChange={(e) => onUpdate({ scopeExplanation: e.target.value })}
                    placeholder="What drives lead time?"
                    style={{ ...inputStyle, fontSize: '11px', padding: '7px 10px' }}
                    {...focusHandlers}
                  />
                ) : (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      value={offering.minLeadTime}
                      onChange={(e) => onUpdate({ minLeadTime: e.target.value })}
                      placeholder="Min"
                      style={{ ...inputStyle, flex: '0 0 70px', fontSize: '11px', padding: '7px 8px' }}
                      {...focusHandlers}
                    />
                    <span style={{ fontSize: '11px', color: '#8B6F47' }}>to</span>
                    <input
                      type="number"
                      min="0"
                      value={offering.maxLeadTime}
                      onChange={(e) => onUpdate({ maxLeadTime: e.target.value })}
                      placeholder="Max"
                      style={{ ...inputStyle, flex: '0 0 70px', fontSize: '11px', padding: '7px 8px' }}
                      {...focusHandlers}
                    />
                    <select
                      value={offering.minLeadTimeUnit}
                      onChange={(e) => onUpdate({ minLeadTimeUnit: e.target.value, maxLeadTimeUnit: e.target.value })}
                      style={{
                        flex: 1, padding: '7px 8px', border: '1px solid #d6c4a8', borderRadius: '4px',
                        backgroundColor: 'white', fontSize: '11px', cursor: 'pointer', color: '#3d2b1f',
                      }}
                    >
                      {leadTimeUnitOptions.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                )}

                {leadTimeInvalid && (
                  <p style={{ fontSize: '10px', color: '#dc2626', margin: '4px 0 0 0' }}>
                    Min cannot exceed max.
                  </p>
                )}
              </FormField>
            </div>
          </div>

          {/* Industries Served section */}
          <div style={{ marginTop: '4px', paddingTop: '12px', borderTop: '2px solid #d6c4a8' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#5c3a1e', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🏭 Industries Served
            </h4>
            <FormField label="Select industries" required>
              <MultiSelect options={industryOptions} selected={offering.industries} onChange={(v) => onUpdate({ industries: v })} label="industries" placeholder="Select the industries this offering serves..." />
            </FormField>
          </div>

          {relevantGroups.length > 0 && (
            <div style={{ marginTop: '4px', paddingTop: '12px', borderTop: '2px solid #d6c4a8' }}>
              <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#5c3a1e', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Client Application Areas
              </h4>
              {depthHint[depth] && (
                <p style={{ fontSize: '10px', color: '#8B6F47', margin: '0 0 8px 0' }}>Ask only for: {depthHint[depth]}</p>
              )}
              <div style={grid2}>
                {relevantGroups.map((g) => (
                  <FormField key={g.group} label={g.group}>
                    <MultiSelect
                      options={g.values}
                      selected={offering.industryApplications.filter((val) => g.values.includes(val))}
                      onChange={(v) => {
                        const others = offering.industryApplications.filter((val) => !g.values.includes(val))
                        onUpdate({ industryApplications: [...others, ...v] })
                      }}
                      placeholder={`Select ${g.group}...`}
                    />
                  </FormField>
                ))}
              </div>
            </div>
          )}

          {capabilityProfile && (
            <div style={{ padding: '6px 10px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', fontSize: '10px', color: '#1e40af' }}>
              <strong>Capability profile:</strong> {capabilityProfile.label} — {capabilityProfile.focus}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProductsServices({ data = {}, updateData }) {
  const [showExplanation, setShowExplanation] = useState(false)
  const [expandedContacts, setExpandedContacts] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const offerings = data.offerings || []
  const showProducts = data.offeringType === 'products' || data.offeringType === 'both'
  const showServices = data.offeringType === 'services' || data.offeringType === 'both'

  const addOffering = (offeringType) => updateData({ offerings: [...offerings, emptyOffering(offeringType)] })
  const updateOffering = (id, patch) => updateData({ offerings: offerings.map((o) => (o.id === id ? { ...o, ...patch } : o)) })
  const removeOffering = (id) => updateData({ offerings: offerings.filter((o) => o.id !== id) })
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
  const setPrimaryOffering = (id) => updateData({ offerings: offerings.map((o) => ({ ...o, isPrimary: o.id === id })) })
  const toggleCollapse = (id) => updateData({ offerings: offerings.map((o) => (o.id === id ? { ...o, collapsed: !o.collapsed } : o)) })

  const duplicateIds = useMemo(() => {
    const flagged = new Set()
    for (let i = 0; i < offerings.length; i++) {
      for (let j = i + 1; j < offerings.length; j++) {
        const a = offerings[i], b = offerings[j]
        if (!a.taxonomyLeafId || a.taxonomyLeafId !== b.taxonomyLeafId) continue
        if (a.name.trim().toLowerCase() !== b.name.trim().toLowerCase() || !a.name.trim()) continue
        if (a.industries.some((ind) => b.industries.includes(ind))) { flagged.add(a.id); flagged.add(b.id) }
      }
    }
    return flagged
  }, [offerings])

  const productOfferings = offerings.filter((o) => o.offeringType === 'Product')
  const serviceOfferings = offerings.filter((o) => o.offeringType === 'Service')
  const customerTypes = data.customerTypes || []

  const allIndustries = [...new Set(offerings.flatMap((o) => o.industries))]
  const allGeography = [...new Set(offerings.flatMap((o) => o.geographicCoverage))]
  const allApplications = [...new Set(offerings.flatMap((o) => o.industryApplications))]
  const offeringSummaries = offerings.filter((o) => o.name).map((o) => `${o.name} (${o.breadcrumb || o.customCategoryRequest || 'category pending'}${o.deliveryRole.length ? ' — ' + o.deliveryRole.join(', ') : ''})`)
  const hasAnySummaryData = Boolean(customerTypes.length || allIndustries.length || allGeography.length || allApplications.length || offeringSummaries.length)

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#5c3a1e', margin: 0 }}>Products &amp; Services</h2>
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#5c3a1e' }}
          title={showExplanation ? "Hide guidance" : "Show guidance"}
        >
          {showExplanation ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {showExplanation && (
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '12px', color: '#1e40af', lineHeight: '1.6' }}>
          <strong>📋 Guidance:</strong> Pick categories from the dropdown to keep matching consistent. One offering can serve several industries. Your own commercial name and description are still yours — the category is only used for matching.
        </div>
      )}

      <Section title="Section 1: Add Product or Service">
        <FormField label="What does your business offer?" required>
          <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
            {[
              { value: 'products', label: 'Products only' },
              { value: 'services', label: 'Services only' },
              { value: 'both', label: 'Both' },
            ].map(({ value, label }) => (
              <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#3d2b1f' }}>
                <input type="radio" name="offeringType" value={value} checked={data.offeringType === value} onChange={(e) => updateData({ offeringType: e.target.value })}
                  style={{ width: '16px', height: '16px', accentColor: '#8B4513', cursor: 'pointer' }} required />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </FormField>

        {showProducts && (
          <div style={{ marginTop: '16px' }}>
            <SectionHeader title="Products" onAdd={() => addOffering('Product')} addLabel="Add Product" />
            {productOfferings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#999', fontSize: '12px', backgroundColor: '#fdfaf5', borderRadius: '8px', border: '1px dashed #d6c4a8' }}>
                No products added yet. Click "Add Product".
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
          <div style={{ marginTop: '16px' }}>
            <SectionHeader title="Services" onAdd={() => addOffering('Service')} addLabel="Add Service" />
            {serviceOfferings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#999', fontSize: '12px', backgroundColor: '#fdfaf5', borderRadius: '8px', border: '1px dashed #d6c4a8' }}>
                No services added yet. Click "Add Service".
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

      <Section title="Section 2: Target Market">
        <div style={grid2}>
          <FormField label="Customer types">
            <MultiSelect
              options={customerTypeOptions}
              selected={customerTypes}
              onChange={(v) => updateData({ customerTypes: v })}
              placeholder="Select customer types..."
            />
          </FormField>
        </div>

        {hasAnySummaryData && (
          <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '11px', color: '#1e40af', lineHeight: '1.7' }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Generated summary:</strong>
            {customerTypes.length > 0 && <div><strong>Customer types:</strong> {customerTypes.join(', ')}</div>}
            {allIndustries.length > 0 && <div><strong>Industries:</strong> {allIndustries.join(', ')}</div>}
            {allGeography.length > 0 && <div><strong>Geographic markets:</strong> {allGeography.join(', ')}</div>}
            {allApplications.length > 0 && <div><strong>Client applications:</strong> {allApplications.join(', ')}</div>}
            {offeringSummaries.length > 0 && <div><strong>Offerings:</strong> {offeringSummaries.join('; ')}</div>}
          </div>
        )}

        <div style={{ marginTop: '12px' }}>
          <FormField label="Anything else about your target customers?" required>
            <textarea
              name="targetMarket"
              value={data.targetMarket || ""}
              onChange={handleChange}
              rows={2}
              placeholder="Add anything important about the customers you are targeting that is not already captured above."
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', fontSize: '12px' }}
              {...focusHandlers}
              required
            />
          </FormField>
        </div>
      </Section>

      <Section title="Section 3: Key Clients / Customers" description="Optional — evidence of relevant delivery history.">
        {(data.keyClients || []).length > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '4px', marginBottom: '12px',
            fontSize: '11px', fontWeight: '600',
            backgroundColor: revenueOver100 ? '#fff1f0' : totalRevenuePercent === 100 ? '#f0faf0' : '#fdf6ee',
            border: `1px solid ${revenueOver100 ? '#ffccc7' : totalRevenuePercent === 100 ? '#b7eb8f' : '#d6c4a8'}`,
            color: revenueOver100 ? '#cf1322' : totalRevenuePercent === 100 ? '#389e0d' : '#5c3a1e',
          }}>
            {revenueOver100 ? `⚠️ Total exceeds 100% (${totalRevenuePercent}%)`
              : totalRevenuePercent === 100 ? `✅ Full revenue allocated (${totalRevenuePercent}%)`
              : `Revenue allocated: ${totalRevenuePercent}% of 100%`}
          </div>
        )}

        <SectionHeader title="Clients" onAdd={addClient} addLabel="Add Client" />

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-brown-200 rounded-lg" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={thStyle}>Client</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Revenue %</th>
                <th style={thStyle}>Industry</th>
                <th style={thStyle}>Offerings</th>
                <th style={thStyle}>Period</th>
                <th style={thStyle}>Reference</th>
                <th style={thStyle}>Growth</th>
                <th style={{ ...thStyle, width: '40px' }}>×</th>
              </tr>
            </thead>
            <tbody>
              {(data.keyClients || []).map((client, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-brown-50/30"}>
                  <td className="px-2 py-1 border-b">
                    <input type="text" value={client.name || ""} onChange={(e) => updateClient(index, "name", e.target.value)} placeholder="Client name"
                      style={{ ...inputStyle, padding: '6px 8px', fontSize: '11px', minWidth: '120px' }} {...focusHandlers} />
                  </td>
                  <td className="px-2 py-1 border-b">
                    <select value={client.clientType || ""} onChange={(e) => updateClient(index, "clientType", e.target.value)}
                      style={{ ...inputStyle, padding: '6px 8px', fontSize: '11px', cursor: 'pointer' }} {...focusHandlers}>
                      <option value="">Select</option>
                      {clientTypeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1 border-b" style={{ minWidth: '140px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#3d2b1f', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {client.contactName || 'No contact'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedContacts(prev => ({ ...prev, [index]: !prev[index] }))}
                          style={{ padding: '1px 6px', fontSize: '9px', fontWeight: '600', backgroundColor: '#f0e8d8', color: '#5c3a1e', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                        >
                          {expandedContacts[index] ? '▲' : '▼'}
                        </button>
                      </div>
                      {expandedContacts[index] && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '6px', backgroundColor: '#f9f7f3', borderRadius: '4px' }}>
                          <input type="text" value={client.contactName || ""} onChange={(e) => updateClient(index, "contactName", e.target.value)} placeholder="Contact name" style={{ ...inputStyle, padding: '4px 8px', fontSize: '10px' }} {...focusHandlers} />
                          <input type="text" value={client.contactRole || ""} onChange={(e) => updateClient(index, "contactRole", e.target.value)} placeholder="Role" style={{ ...inputStyle, padding: '4px 8px', fontSize: '10px' }} {...focusHandlers} />
                          <input type="email" value={client.contactEmail || ""} onChange={(e) => updateClient(index, "contactEmail", e.target.value)} placeholder="Email" style={{ ...inputStyle, padding: '4px 8px', fontSize: '10px' }} {...focusHandlers} />
                          <input type="text" value={client.contactNumber || ""} onChange={(e) => updateClient(index, "contactNumber", e.target.value)} placeholder="Phone" style={{ ...inputStyle, padding: '4px 8px', fontSize: '10px' }} {...focusHandlers} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1 border-b">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="number" min="0" max="100" value={client.revenuePercentage || ""} onChange={(e) => {
                          const val = Math.min(100, Math.max(0, Number(e.target.value)))
                          updateClient(index, "revenuePercentage", val === 0 ? "" : String(val))
                        }} placeholder="%" style={{ ...inputStyle, width: '56px', padding: '6px 8px', fontSize: '11px' }} {...focusHandlers} />
                      <span style={{ fontSize: '11px', color: '#5c3a1e', fontWeight: '600' }}>%</span>
                    </div>
                  </td>
                  <td className="px-2 py-1 border-b" style={{ minWidth: '150px' }}>
                    <MultiSelect options={industryOptions} selected={client.industries || []} onChange={(v) => updateClient(index, "industries", v)} label="industries" placeholder="Select..." />
                  </td>
                  <td className="px-2 py-1 border-b" style={{ minWidth: '150px' }}>
                    {offeringNameOptions.length === 0 ? (
                      <span style={{ fontSize: '10px', color: '#a08a6d' }}>Add an offering first</span>
                    ) : (
                      <MultiSelect options={offeringNameOptions} selected={client.offeringsDelivered || []} onChange={(v) => updateClient(index, "offeringsDelivered", v)} placeholder="Select..." />
                    )}
                  </td>
                  <td className="px-2 py-1 border-b" style={{ minWidth: '140px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <input type="date" value={client.deliveryStart || ""} onChange={(e) => updateClient(index, "deliveryStart", e.target.value)}
                        style={{ ...inputStyle, padding: '4px 6px', fontSize: '10px' }} {...focusHandlers} />
                      <input type="date" value={client.deliveryEnd || ""} onChange={(e) => updateClient(index, "deliveryEnd", e.target.value)}
                        style={{ ...inputStyle, padding: '4px 6px', fontSize: '10px' }} {...focusHandlers} />
                    </div>
                  </td>
                  <td className="px-2 py-1 border-b">
                    <select value={client.referencePermission || ""} onChange={(e) => updateClient(index, "referencePermission", e.target.value)}
                      style={{ ...inputStyle, padding: '6px 8px', fontSize: '11px', cursor: 'pointer' }} {...focusHandlers}>
                      <option value="">Select</option>
                      {referencePermissionOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1 border-b">
                    <select value={client.growthPotential || ""} onChange={(e) => updateClient(index, "growthPotential", e.target.value)}
                      style={{ ...inputStyle, padding: '6px 8px', fontSize: '11px', cursor: 'pointer' }} {...focusHandlers}>
                      <option value="">Select</option>
                      {growthPotentialOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1 border-b" style={{ textAlign: 'center' }}>
                    <button type="button" onClick={() => removeClient(index)} style={{ padding: '4px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {(data.keyClients || []).length === 0 && (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: '#999', fontSize: '12px', backgroundColor: '#fdfaf5' }}>
                    No clients added yet. Click "Add Client".
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