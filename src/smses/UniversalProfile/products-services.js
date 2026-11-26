"use client"
import React, { useState, useEffect, useRef, useMemo, useId } from 'react'
import {
  Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Copy,
  ArrowUp, ArrowDown, Star, AlertTriangle, CheckCircle, Circle
} from 'lucide-react'
import FormField from "./form-field"
import './UniversalProfile.css';
import {
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
import {
  checkIsNGO,
  NGO_FOCUS_AREAS,
  NGO_TARGET_BENEFICIARIES,
  NGO_CHARGING_MODELS,
  NGO_PROGRAMME_STATUSES,
  NGO_DELIVERY_METHODS,
  NGO_PARTNER_TYPES,
} from './ngoTaxonomy'

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

const emptyOffering = (offeringType, isNGO = false) => ({
  id: newOfferingId(),
  offeringType, // 'Product' | 'Service' | 'Programme'
  name: '',
  description: '',
  isPrimary: false,
  taxonomyLeafId: null,
  breadcrumb: '',
  customCategoryRequest: '',
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
  // NGO-specific fields
  focusArea: '',
  secondaryFocusAreas: [],
  targetBeneficiaryGroups: [],
  chargingModel: 'free',
  programmeStatus: 'active',
  deliveryMethod: 'in_person',
  historicBeneficiariesCount: '',
  annualBeneficiariesTarget: '',
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

const optionListFor = (options) =>
  options.map((option) => typeof option === 'string' ? { value: option, label: option } : option)

const otherOption = 'Other'
const isOther = (value) => /^other$/i.test(value)
const detailsStyle = { border: '1px solid #e4d5c2', borderRadius: 6, backgroundColor: '#fff', padding: '10px 12px' }
const summaryStyle = { cursor: 'pointer', color: '#5c3a1e', fontWeight: 600, fontSize: 13 }
const fieldGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px 16px' }
const tableInputStyle = { ...inputStyle, padding: '8px 10px', fontSize: 12 }

function ChoiceWithOther({ label, options, value = '', onChange, style = inputStyle }) {
  const [editingOther, setEditingOther] = useState(false)
  const choices = optionListFor(options).filter((option) => !isOther(option.value))
  const otherSelected = editingOther || Boolean(value && !choices.some((option) => option.value === value))

  return (
    <>
      <select
        aria-label={label}
        style={style}
        value={otherSelected ? otherOption : value}
        onChange={(event) => {
          const next = event.target.value
          setEditingOther(next === otherOption)
          onChange(next)
        }}
        {...focusHandlers}
      >
        <option value="">Select</option>
        {choices.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        <option value={otherOption}>Other (specify)</option>
      </select>
      {otherSelected && (
        <input
          type="text"
          aria-label={`Specify ${label.toLowerCase()}`}
          value={isOther(value) ? '' : value}
          onChange={(event) => onChange(event.target.value || otherOption)}
          placeholder="Please specify"
          maxLength={120}
          style={{ ...style, marginTop: 6 }}
          {...focusHandlers}
        />
      )}
    </>
  )
}

function MultiSelect({ options, selected = [], onChange, label, placeholder, allowOther = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [specifyingOther, setSpecifyingOther] = useState(false)
  const [otherText, setOtherText] = useState('')
  const rootRef = useRef(null)
  const id = useId()
  const choices = optionListFor(options).filter((option) => !allowOther || !isOther(option.value))
  const savedOptions = [
    ...choices,
    ...selected.filter((value) => !choices.some((option) => option.value === value))
      .map((value) => ({ value, label: value })),
  ]
  const selection = selected.map((value) => savedOptions.find((option) => option.value === value)?.label || value)
  const title = label || placeholder || 'Select options'

  useEffect(() => {
    if (!isOpen) return
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [isOpen])

  const addOther = () => {
    const value = otherText.trim()
    if (!value) return
    const match = savedOptions.find((option) => option.label.toLowerCase() === value.toLowerCase())
    const values = selected.filter((item) => !isOther(item))
    const next = match?.value || value
    onChange(values.includes(next) ? values : [...values, next])
    setOtherText('')
    setSpecifyingOther(false)
  }

  return (
    <div ref={rootRef} onKeyDown={(event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        rootRef.current?.querySelector('button')?.focus()
      }
    }}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        aria-label={`${title}${selection.length ? `, ${selection.length} selected` : ''}`}
        onClick={() => setIsOpen((open) => !open)}
        style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, textAlign: 'left' }}
        {...focusHandlers}
      >
        <span style={{ overflowWrap: 'anywhere' }}>
          {selection.length ? selection.slice(0, 2).join(', ') : placeholder || `Select ${title}`}
          {selection.length > 2 && ` +${selection.length - 2}`}
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <div id={id} hidden={!isOpen} style={{ ...detailsStyle, marginTop: 4 }}>
        {isOpen && (
          <>
            <div style={{ maxHeight: 224, overflowY: 'auto' }}>
              {savedOptions.map((option) => (
                <label key={option.value} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={(event) => onChange(event.target.checked
                      ? [...selected, option.value]
                      : selected.filter((value) => value !== option.value))}
                  />
                  {option.label}
                </label>
              ))}
              {allowOther && (
                <button type="button" className="btn btn-secondary" onClick={() => setSpecifyingOther((show) => !show)}>
                  Other (specify)
                </button>
              )}
            </div>
            {allowOther && specifyingOther && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  type="text"
                  aria-label={`Specify another ${label || 'option'}`}
                  value={otherText}
                  maxLength={120}
                  placeholder="Please specify"
                  onChange={(event) => setOtherText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addOther()
                    }
                  }}
                  style={inputStyle}
                  {...focusHandlers}
                />
                <button type="button" className="btn btn-secondary" onClick={addOther} disabled={!otherText.trim()}>Add</button>
              </div>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsOpen(false)
                rootRef.current?.querySelector('button')?.focus()
              }}
              style={{ marginTop: 8 }}
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function ExtraDetails({ title, children }) {
  return (
    <details style={detailsStyle}>
      <summary style={summaryStyle}>{title}</summary>
      <div style={{ marginTop: 12 }}>{children}</div>
    </details>
  )
}

function TaxonomySearch({ offeringType, value, customCategory, onSelect, onRequestCustomCategory, industryHints }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customText, setCustomText] = useState('')
  const triggerRef = useRef(null)
  const panelId = useId()
  const selected = getLeafById(value)
  const results = useMemo(() => {
    if (query.trim().length >= 2) return searchTaxonomy(query, { offeringType, industryHints })
    const type = offeringType === 'products' ? 'Product' : 'Service'
    return taxonomyLeaves
      .filter((leaf) => leaf.offeringTypes.includes(type))
      .sort((first, second) => first.breadcrumb.localeCompare(second.breadcrumb))
  }, [query, offeringType, industryHints])

  useEffect(() => {
    if (!isOpen) return
    const closeOutside = (event) => {
      if (!triggerRef.current?.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [isOpen])

  const closePicker = () => {
    setQuery('')
    setIsOpen(false)
    setShowCustomForm(false)
    triggerRef.current?.querySelector('button')?.focus()
  }

  const saveCustom = () => {
    const name = customText.trim()
    if (!name) return
    onRequestCustomCategory(name)
    closePicker()
  }

  return (
    <div ref={triggerRef} onKeyDown={(event) => {
      if (isOpen && event.key === 'Escape') closePicker()
    }}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, textAlign: 'left' }}
        {...focusHandlers}
      >
        <span>{selected?.breadcrumb || customCategory || "Select an offering category"}</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <div id={panelId} hidden={!isOpen} style={{ ...detailsStyle, marginTop: 4 }}>
        {isOpen && (
          <>
            <input
              type="search"
              value={query}
              aria-label="Filter offering categories"
              placeholder="Find a category"
              onChange={(event) => setQuery(event.target.value)}
              style={{ ...inputStyle, marginBottom: 8 }}
              {...focusHandlers}
            />
            <div style={{ maxHeight: 224, overflowY: 'auto' }}>
              {results.map((leaf) => (
                <button
                  key={leaf.id}
                  type="button"
                  aria-pressed={value === leaf.id}
                  title={leaf.definition}
                  onClick={() => {
                    onSelect(leaf)
                    closePicker()
                  }}
                  style={{
                    display: 'block', textAlign: 'left', width: '100%', padding: '7px 8px',
                    cursor: 'pointer', border: 0, borderBottom: '1px solid #f0e8d8',
                    background: value === leaf.id ? '#f0e8d8' : 'white', color: '#5c3a1e',
                  }}
                >
                  {leaf.breadcrumb}
                </button>
              ))}
              {!results.length && <p style={{ fontSize: 12 }}>No matching categories.</p>}
            </div>
            <button type="button" className="btn btn-secondary"
              onClick={() => {
                setShowCustomForm((show) => !show)
                setCustomText(customCategory || '')
              }}
              style={{ marginTop: 8 }}>
              Other (specify)
            </button>
            {showCustomForm && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input type="text" aria-label="Specify offering category"
                  value={customText} maxLength={160} placeholder="Name the category"
                  onChange={(event) => setCustomText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      saveCustom()
                    }
                  }}
                  style={inputStyle} {...focusHandlers} />
                <button type="button" className="btn btn-secondary" onClick={saveCustom} disabled={!customText.trim()}>Add</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

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
          <ExtraDetails title="Completion checklist">
            <CompletionChecklist offering={offering} />
          </ExtraDetails>

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
              customCategory={offering.customCategoryRequest || offering.customCategory}
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
          <div style={fieldGrid}>
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

          <FormField label="Industries served" required>
            <MultiSelect allowOther options={industryOptions} selected={offering.industries}
              onChange={(value) => onUpdate({ industries: value })} label="Industries" placeholder="Select industries" />
          </FormField>

          <FormField label={roleFieldLabel} required>
            <MultiSelect allowOther options={roleOptions} selected={offering.deliveryRole}
              onChange={(value) => onUpdate({ deliveryRole: value })} label={roleFieldLabel} placeholder="Select delivery roles" />
          </FormField>

          <ExtraDetails title="Delivery standards, lead times and coverage">
            <div style={{ display: 'grid', gap: 12 }}>
              <FormField label="Contract / commercial delivery pattern">
                <MultiSelect allowOther options={commercialDeliveryPatternOptions} selected={offering.commercialPattern}
                  onChange={(value) => onUpdate({ commercialPattern: value })} label="Commercial delivery patterns" placeholder="Select patterns" />
              </FormField>

              {/* Delivery Standards — Section 10 */}
              <div style={{ padding: '12px 14px', backgroundColor: '#fdfaf5', borderRadius: '6px', border: '1px solid #eee0cc' }}>
                <h5 style={{ fontSize: '11px', fontWeight: '700', color: '#5c3a1e', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Delivery standards
                </h5>
                <div style={fieldGrid}>
                  <FormField label={pattern.fieldLabel} required>
                    <ChoiceWithOther label={pattern.fieldLabel} options={pattern.options} value={offering.deliveryStandard}
                      onChange={(value) => onUpdate({ deliveryStandard: value })} />
                  </FormField>
                  <FormField label="Geographic delivery coverage">
                    <MultiSelect
                      allowOther
                      label="Coverage areas"
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
                    <div style={fieldGrid}>
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

              {/* Industry application — Section 6.1/11.3 */}
              {relevantGroups.length > 0 && (
                <FormField label="In which industries can this offering be used?">
                  {depthHint[depth] && (
                    <p style={{ fontSize: '10px', color: '#8B6F47', margin: '0 0 6px 0' }}>{depthHint[depth]}</p>
                  )}
                  <div style={fieldGrid}>
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
                    <MultiSelect allowOther options={[]} label="Other applications" placeholder="Add another application"
                      selected={offering.industryApplications.filter((value) => !applicationGroups.some((group) => group.values.includes(value)))}
                      onChange={(values) => onUpdate({
                        industryApplications: [
                          ...offering.industryApplications.filter((value) => applicationGroups.some((group) => group.values.includes(value))),
                          ...values,
                        ],
                      })}
                    />
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
            </div>
          </ExtraDetails>

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
// NGO Completion Checklist Component
// ---------------------------------------------------------------------------
function computeNgoProgrammeStatus(offering) {
  const hasBasics = (offering.name || '').trim().length >= 2 && (offering.description || '').trim().length >= 20
  const hasFocus = !!offering.focusArea
  const hasBeneficiaries = (offering.targetBeneficiaryGroups || []).length > 0
  const hasDelivery = !!offering.deliveryMethod

  if (!(offering.name || '').trim() && !(offering.description || '').trim() && !hasFocus) return 'Not started'
  if (hasBasics && hasFocus && hasBeneficiaries && hasDelivery) return 'Basic complete'
  return 'In progress'
}

function NgoCompletionChecklist({ offering }) {
  const items = [
    {
      id: 'name',
      label: 'Programme name (min 2 chars)',
      done: (offering.name || '').trim().length >= 2
    },
    {
      id: 'focusArea',
      label: 'Primary focus area selected',
      done: !!offering.focusArea
    },
    {
      id: 'description',
      label: 'Description & impact (min 20 chars)',
      done: (offering.description || '').trim().length >= 20
    },
    {
      id: 'targetBeneficiaries',
      label: 'Target beneficiaries selected',
      done: (offering.targetBeneficiaryGroups || []).length > 0
    },
    {
      id: 'chargingModel',
      label: 'Access / charging model selected',
      done: !!offering.chargingModel
    },
    {
      id: 'deliveryMethod',
      label: 'Delivery method selected',
      done: !!offering.deliveryMethod
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
          Programme Completion Progress
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '4px 12px' }}>
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
// NgoProgrammeCard — Dedicated card for NGO community programmes & services
// ---------------------------------------------------------------------------
function NgoProgrammeCard({
  offering,
  index,
  total,
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onSetPrimary,
  onToggleCollapse,
  duplicateWarning
}) {
  const status = computeNgoProgrammeStatus(offering)
  const sStyle = statusStyle[status] || statusStyle['In progress']

  const focusAreaObj = NGO_FOCUS_AREAS.find((f) => f.value === offering.focusArea)
  const focusAreaLabel = focusAreaObj ? focusAreaObj.label : offering.focusArea

  const missing = []
  if ((offering.name || '').trim().length < 2) missing.push('programme name')
  if (!offering.focusArea) missing.push('primary focus area')
  if ((offering.description || '').trim().length < 20) missing.push('programme description & impact')
  if (!offering.targetBeneficiaryGroups || offering.targetBeneficiaryGroups.length === 0) missing.push('target beneficiaries')
  if (!offering.chargingModel) missing.push('access/charging model')
  if (!offering.deliveryMethod) missing.push('delivery method')

  return (
    <div style={{ border: '1px solid #d6c4a8', borderRadius: '8px', marginBottom: '14px', backgroundColor: 'white', overflow: 'hidden' }}>
      {/* Card Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: '#fdf6ed',
          cursor: 'pointer'
        }}
        onClick={() => onToggleCollapse()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <span style={{
            padding: '3px 10px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '700',
            whiteSpace: 'nowrap',
            backgroundColor: offering.offeringType === 'Service' ? '#fce7f3' : '#dcfce7',
            color: offering.offeringType === 'Service' ? '#9d174d' : '#166534'
          }}>
            {offering.offeringType === 'Service' ? 'COMMUNITY SERVICE' : 'PROGRAMME'}
          </span>
          {offering.isPrimary && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700', color: '#8B4513' }}>
              <Star size={12} fill="#8B4513" /> FLAGSHIP
            </span>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#5c3a1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {offering.name || 'Untitled Programme / Project'}
            </div>
            <div style={{ fontSize: '11px', color: '#8B6F47', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {focusAreaLabel || 'No focus area selected yet'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: '700', backgroundColor: sStyle.bg, color: sStyle.fg, whiteSpace: 'nowrap' }}>
            {status}
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoveUp() }}
            disabled={index === 0}
            title="Move up"
            style={{ padding: '4px', background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1, color: '#5c3a1e' }}
          >
            <ArrowUp size={16} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoveDown() }}
            disabled={index === total - 1}
            title="Move down"
            style={{ padding: '4px', background: 'none', border: 'none', cursor: index === total - 1 ? 'default' : 'pointer', opacity: index === total - 1 ? 0.3 : 1, color: '#5c3a1e' }}
          >
            <ArrowDown size={16} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDuplicate() }}
            title="Duplicate"
            style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#5c3a1e' }}
          >
            <Copy size={16} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            title="Remove"
            style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
          >
            <Trash2 size={16} />
          </button>
          <span style={{ color: '#8B6F47' }}>
            {offering.collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </span>
        </div>
      </div>

      {duplicateWarning && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#b45309', backgroundColor: '#fef3c7', padding: '6px 12px', borderRadius: '4px', margin: '8px 16px 0 16px' }}>
          <AlertTriangle size={14} /> Another programme with this name already exists. Consider distinguishing them.
        </div>
      )}

      {/* Card Body */}
      {!offering.collapsed && (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ExtraDetails title="Completion checklist">
            <NgoCompletionChecklist offering={offering} />
          </ExtraDetails>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid #f0e8d8' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#5c3a1e' }}>
              <input
                type="checkbox"
                checked={!!offering.isPrimary}
                onChange={() => onSetPrimary()}
                style={{ width: '16px', height: '16px', accentColor: '#8B4513', cursor: 'pointer' }}
              />
              <span>Set as Flagship / Primary Programme (featured first in funder presentations &amp; directories)</span>
            </label>
          </div>

          {/* Row 1: Programme Name and Primary Focus Area */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <FormField label="Programme / Service Name" required>
              <input
                type="text"
                value={offering.name || ""}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="e.g., Youth Coding & Robotics Academy"
                style={inputStyle}
                {...focusHandlers}
                required
              />
            </FormField>

            <FormField label="Primary Focus Area" required>
              <ChoiceWithOther label="Primary focus area" options={NGO_FOCUS_AREAS} value={offering.focusArea}
                onChange={(value) => onUpdate({ focusArea: value })} />
            </FormField>
          </div>

          {/* Row 2: Target Beneficiary Groups */}
          <FormField label="Target Beneficiary Groups" required>
            <MultiSelect
              allowOther
              options={NGO_TARGET_BENEFICIARIES}
              selected={offering.targetBeneficiaryGroups || []}
              onChange={(v) => onUpdate({ targetBeneficiaryGroups: v })}
              label="beneficiaries"
              placeholder="Select target beneficiary groups..."
            />
            <p style={{ fontSize: '10px', color: '#8B6F47', marginTop: '4px', marginBottom: 0 }}>
              Specific groups this programme was designed to reach, empower, or support.
            </p>
          </FormField>

          {/* Row 3: Description, Activities & Impact Outcomes */}
          <FormField label="Programme Description, Key Activities & Impact Outcomes" required>
            <textarea
              value={offering.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={3}
              placeholder="Detail the core activities, delivery schedule, community need addressed, and expected social or economic outcomes (min 20 characters)..."
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              {...focusHandlers}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8B6F47', marginTop: '4px' }}>
              <span>Minimum 20 characters required for profile completion.</span>
              <span style={{ color: (offering.description?.trim().length || 0) >= 20 ? '#166534' : '#92400e' }}>
                {offering.description?.trim().length || 0}/20 chars
              </span>
            </div>
          </FormField>

          {/* Row 4: Charging / Access Model, Programme Status, Delivery Method */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <FormField label="Access / Charging Model" required>
              <select
                value={offering.chargingModel || "free"}
                onChange={(e) => onUpdate({ chargingModel: e.target.value })}
                style={{ ...inputStyle, minHeight: '44px', cursor: 'pointer' }}
                {...focusHandlers}
                required
              >
                {NGO_CHARGING_MODELS.map((cm) => (
                  <option key={cm.value} value={cm.value}>{cm.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Programme Status" required>
              <select
                value={offering.programmeStatus || "active"}
                onChange={(e) => onUpdate({ programmeStatus: e.target.value })}
                style={{ ...inputStyle, minHeight: '44px', cursor: 'pointer' }}
                {...focusHandlers}
                required
              >
                {NGO_PROGRAMME_STATUSES.map((ps) => (
                  <option key={ps.value} value={ps.value}>{ps.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Delivery Method" required>
              <select
                value={offering.deliveryMethod || "in_person"}
                onChange={(e) => onUpdate({ deliveryMethod: e.target.value })}
                style={{ ...inputStyle, minHeight: '44px', cursor: 'pointer' }}
                {...focusHandlers}
                required
              >
                {NGO_DELIVERY_METHODS.map((dm) => (
                  <option key={dm.value} value={dm.value}>{dm.label}</option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Row 5: Geographic Coverage & Beneficiary Counts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <FormField label="Geographic Delivery Coverage">
              <MultiSelect
                allowOther
                options={geographicCoverageOptions}
                selected={offering.geographicCoverage || []}
                onChange={(v) => onUpdate({ geographicCoverage: v })}
                label="regions"
                placeholder="Select provinces / regions..."
              />
            </FormField>

            <FormField label="Historic Beneficiaries Reached (All time / To Date)">
              <input
                type="number"
                min="0"
                value={offering.historicBeneficiariesCount || ""}
                onChange={(e) => onUpdate({ historicBeneficiariesCount: e.target.value })}
                placeholder="e.g. 1500"
                style={inputStyle}
                {...focusHandlers}
              />
            </FormField>

            <FormField label="Annual Beneficiary Target (Current / Upcoming Year)">
              <input
                type="number"
                min="0"
                value={offering.annualBeneficiariesTarget || ""}
                onChange={(e) => onUpdate({ annualBeneficiariesTarget: e.target.value })}
                placeholder="e.g. 350"
                style={inputStyle}
                {...focusHandlers}
              />
            </FormField>
          </div>

          {missing.length > 0 && (
            <div style={{ fontSize: '10px', color: '#92400e', backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '6px 10px' }}>
              Still needed before this programme is complete: {missing.join(', ')}.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
const contactRoleOptions = [
  'Owner / Director', 'Procurement', 'Operations', 'Finance', 'Project / Programme management',
  'Account management', 'Administration',
]

function ClientDetails({ client, isNGO, offeringOptions, update }) {
  const input = (field, label, type = 'text') => (
    <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#5c3a1e' }}>
      {label}
      <input type={type} value={client[field] ?? (field === 'contactName' ? client.contactPerson || '' : '')} onChange={(event) => update(field, event.target.value)}
        style={tableInputStyle} {...focusHandlers} />
    </label>
  )

  const select = (field, label, options) => (
    <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#5c3a1e' }}>
      {label}
      <select value={client[field] || ''} onChange={(event) => update(field, event.target.value)}
        style={tableInputStyle} {...focusHandlers}>
        <option value="">Select</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
        {client[field] && !options.includes(client[field]) && <option value={client[field]}>{client[field]}</option>}
      </select>
    </label>
  )

  return (
    <div style={fieldGrid}>
      <fieldset style={detailsStyle}>
        <legend style={summaryStyle}>Contact</legend>
        {input('contactName', 'Contact name')}
        <FormField label="Contact role">
          <ChoiceWithOther label="Contact role" options={contactRoleOptions} value={client.contactRole}
            onChange={(value) => update('contactRole', value)} style={tableInputStyle} />
        </FormField>
        {input('contactEmail', 'Email', 'email')}
        {input('contactNumber', 'Phone', 'tel')}
      </fieldset>
      <fieldset style={detailsStyle}>
        <legend style={summaryStyle}>{isNGO ? 'Grant or project' : 'Delivery'}</legend>
        {isOther(client.clientType) && input('clientTypeOther', isNGO ? 'Specify partner type' : 'Specify client type')}
        <FormField label={isNGO ? 'Focus areas' : 'Industries'}>
          <MultiSelect allowOther options={isNGO ? NGO_FOCUS_AREAS : industryOptions} selected={client.industries || []}
            onChange={(value) => update('industries', value)} label={isNGO ? 'Focus areas' : 'Industries'} placeholder="Select" />
        </FormField>
        <FormField label={isNGO ? 'Programmes supported' : 'Offerings delivered'}>
          {offeringOptions.length || client.offeringsDelivered?.length ? (
            <MultiSelect options={offeringOptions} selected={client.offeringsDelivered || []}
              onChange={(value) => update('offeringsDelivered', value)}
              label={isNGO ? 'Programmes supported' : 'Offerings delivered'} placeholder="Select from catalogue" />
          ) : <span style={{ fontSize: 12 }}>Add an offering to the catalogue first.</span>}
        </FormField>
        <div style={fieldGrid}>
          {input('deliveryStart', 'Start date', 'date')}
          {input('deliveryEnd', 'End date', 'date')}
        </div>
      </fieldset>
      <fieldset style={detailsStyle}>
        <legend style={summaryStyle}>{isNGO ? 'Reference and continuation' : 'Reference and growth'}</legend>
        {select('referencePermission', 'Reference consent', referencePermissionOptions)}
        {select('growthPotential', isNGO ? 'Continuation potential' : 'Growth potential', growthPotentialOptions)}
        {(client.growthPotential === 'High' || client.growthPotential === 'Medium' || client.growthDetails) && (
          <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#5c3a1e' }}>
            {isNGO ? 'Continuation details' : 'Growth details'}
            <textarea rows={2} value={client.growthDetails || ''}
              onChange={(event) => update('growthDetails', event.target.value)}
              style={{ ...tableInputStyle, resize: 'vertical', fontFamily: 'inherit' }} {...focusHandlers} />
          </label>
        )}
      </fieldset>
    </div>
  )
}

// Main component
// ---------------------------------------------------------------------------
export default function ProductsServices({ data = {}, updateData, isNGO: isNgoProp, allFormData }) {
  const isNGO = typeof isNgoProp === "boolean" ? isNgoProp : checkIsNGO(allFormData || { productsServices: data })
  const [showExplanation, setShowExplanation] = useState(false)
  const [openOfferings, setOpenOfferings] = useState([])
  const [expandedClientIndex, setExpandedClientIndex] = useState(null)
  const clientDetailsId = useId()

  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleOfferingTypeChange = (e) => {
    updateData({ offeringType: e.target.value })
  }

  const offerings = useMemo(() => (data.offerings || []).map((offering, index) => ({
    ...offering,
    id: offering.id || `legacy-offering-${index}`,
    name: offering.name || '',
    description: offering.description || '',
    deliveryRole: offering.deliveryRole || [],
    commercialPattern: offering.commercialPattern || [],
    industries: offering.industries || [],
    industryApplications: offering.industryApplications || [],
    geographicCoverage: offering.geographicCoverage || [],
  })), [data.offerings])
  const selectedOfferingType = data.offeringType || (isNGO ? 'programmes' : '')

  const showProducts = !isNGO && (selectedOfferingType === 'products' || selectedOfferingType === 'both')
  const showProgrammes = isNGO && (selectedOfferingType === 'programmes' || selectedOfferingType === 'both')
  const showServices = isNGO
    ? (selectedOfferingType === 'services' || selectedOfferingType === 'both')
    : (selectedOfferingType === 'services' || selectedOfferingType === 'both')

  // ---- Offerings CRUD -------------------------------------------------
  const addOffering = (offeringType) => {
    const offering = emptyOffering(offeringType, isNGO)
    setOpenOfferings((ids) => [...ids, offering.id])
    updateData({ offerings: [...offerings, offering] })
  }
  const updateOffering = (id, patch) => {
    updateData({ offerings: offerings.map((o) => (o.id === id ? { ...o, ...patch } : o)) })
  }
  const removeOffering = (id) => {
    setOpenOfferings((ids) => ids.filter((openId) => openId !== id))
    updateData({ offerings: offerings.filter((o) => o.id !== id) })
  }
  const duplicateOffering = (id) => {
    const source = offerings.find((o) => o.id === id)
    if (!source) return
    const copy = { ...source, id: newOfferingId(), isPrimary: false, name: source.name ? `${source.name} (copy)` : source.name }
    const idx = offerings.findIndex((o) => o.id === id)
    const next = [...offerings]
    next.splice(idx + 1, 0, copy)
    setOpenOfferings((ids) => [...ids, copy.id])
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
    setOpenOfferings((ids) => ids.includes(id) ? ids.filter((openId) => openId !== id) : [...ids, id])
  }

  // Duplicate warning
  const duplicateIds = useMemo(() => {
    const flagged = new Set()
    for (let i = 0; i < offerings.length; i++) {
      for (let j = i + 1; j < offerings.length; j++) {
        const a = offerings[i], b = offerings[j]
        if (isNGO) {
          if (a.name && b.name && a.name.trim().toLowerCase() === b.name.trim().toLowerCase()) {
            flagged.add(a.id); flagged.add(b.id)
          }
        } else {
          if (!a.taxonomyLeafId || a.taxonomyLeafId !== b.taxonomyLeafId) continue
          if (a.name.trim().toLowerCase() !== b.name.trim().toLowerCase() || !a.name.trim()) continue
          const overlap = a.industries.some((ind) => b.industries.includes(ind))
          if (overlap) { flagged.add(a.id); flagged.add(b.id) }
        }
      }
    }
    return flagged
  }, [offerings, isNGO])

  const productOfferings = offerings.filter((o) => o.offeringType === 'Product')
  const serviceOfferings = offerings.filter((o) => o.offeringType === 'Service')
  const programmeOfferings = offerings.filter((o) => o.offeringType === 'Programme' || (!o.offeringType && isNGO))

  // ---- Section 2: Target Market / Beneficiary Reach summary -----------
  const allIndustries = [...new Set(offerings.flatMap((o) => o.industries || []))]
  const allGeography = [...new Set(offerings.flatMap((o) => o.geographicCoverage || []))]
  const allApplications = [...new Set(offerings.flatMap((o) => o.industryApplications || []))]
  const offeringSummaries = offerings.filter((o) => o.name).map((o) => `${o.name} (${o.breadcrumb || o.customCategoryRequest || 'category pending'}${o.deliveryRole?.length ? ' — ' + o.deliveryRole.join(', ') : ''})`)
  const customerTypes = data.customerTypes || []

  // NGO Specific metrics
  const allFocusAreas = isNGO
    ? [...new Set(offerings.map((o) => NGO_FOCUS_AREAS.find((f) => f.value === o.focusArea)?.label || o.focusArea).filter(Boolean))]
    : []
  const allBeneficiaryLabels = isNGO
    ? [...new Set([...customerTypes, ...offerings.flatMap((o) => o.targetBeneficiaryGroups || [])])].map((b) => NGO_TARGET_BENEFICIARIES.find((t) => t.value === b)?.label || b).filter(Boolean)
    : []
  const totalHistoricBeneficiaries = isNGO
    ? offerings.reduce((sum, o) => sum + (parseInt(o.historicBeneficiariesCount, 10) || 0), 0)
    : 0
  const totalAnnualTarget = isNGO
    ? offerings.reduce((sum, o) => sum + (parseInt(o.annualBeneficiariesTarget, 10) || 0), 0)
    : 0
  const activeProgrammesCount = isNGO
    ? offerings.filter((o) => o.programmeStatus === 'active' || !o.programmeStatus).length
    : 0

  const hasAnySummaryData = isNGO
    ? Boolean(customerTypes.length || allFocusAreas.length || allBeneficiaryLabels.length || allGeography.length || offerings.length)
    : Boolean(customerTypes.length || allIndustries.length || allGeography.length || allApplications.length || offeringSummaries.length)

  // ---- Section 3: Key Clients / Funding Partners -----------------------
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
    setExpandedClientIndex((current) => current === index ? null : current > index ? current - 1 : current)
    updateData({ keyClients })
  }

  const totalRevenuePercent = (data.keyClients || []).reduce((sum, c) => sum + (parseFloat(c.revenuePercentage) || 0), 0)
  const revenueOver100 = totalRevenuePercent > 100

  const offeringNameOptions = [...new Set(offerings.filter((o) => o.name).map((o) => o.name))]
  const clientTypes = isNGO ? NGO_PARTNER_TYPES : clientTypeOptions

  const offeringTypeOptions = isNGO
    ? [
        { value: 'programmes', label: 'Community programmes only' },
        { value: 'services', label: 'Services & training only' },
        { value: 'both', label: 'Both programmes and services' },
      ]
    : [
        { value: 'products', label: 'Products only' },
        { value: 'services', label: 'Services only' },
        { value: 'both', label: 'Both products and services' },
      ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#5c3a1e', margin: 0 }}>
          {isNGO ? "Programmes & Services" : "Products & Services"}
        </h2>
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
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', margin: '0 0 8px 0' }}>
            {isNGO ? "📋 Programmes & Services — Non-Profit Guidance" : "📋 Products & Services — Guidance"}
          </h4>
          {isNGO ? (
            <>
              <p style={{ color: '#1e40af', margin: '0 0 8px 0', fontSize: '12px', lineHeight: '1.6' }}>
                This section helps us <strong>connect your organisation with the right grantmakers, philanthropic foundations, and corporate CSI/ESD programmes</strong> by capturing <strong>the specific community programmes, social impact projects, and services you deliver</strong>.
              </p>
              <ul style={{ color: '#1e40af', margin: 0, paddingLeft: '20px', fontSize: '12px', lineHeight: '1.8' }}>
                <li>Capture each ongoing or planned programme with its focus area, target beneficiaries, and access model.</li>
                <li>Mark one key initiative as your Flagship Programme to feature prominently in partner matching and directories.</li>
                <li>Record your key funding partners, grantmakers, or donors below to substantiate your delivery track record.</li>
              </ul>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* Community Programmes & Services / Products & Services Catalogue */}
      {/* ============================================================ */}
      <Section title={isNGO ? "Community Programmes & Services" : "Products & Services Catalogue"}>
        <FormField label={isNGO ? "What does your organisation deliver?" : "What does your business offer?"} required>
          <select name="offeringType" value={selectedOfferingType} onChange={handleOfferingTypeChange}
            aria-label={isNGO ? "What does your organisation deliver?" : "What does your business offer?"}
            style={{ ...inputStyle, maxWidth: 420 }} {...focusHandlers}>
            <option value="">Select offering type</option>
            {offeringTypeOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </FormField>

        {/* NGO Programmes */}
        {showProgrammes && isNGO && (
          <div style={{ marginTop: '20px' }}>
            <SectionHeader title="Community Programmes & Projects" onAdd={() => addOffering('Programme')} addLabel="Add Programme" />
            {programmeOfferings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#999', fontSize: '13px', backgroundColor: '#fdfaf5', borderRadius: '8px', border: '1px dashed #d6c4a8' }}>
                No community programmes added yet. Click &quot;Add Programme&quot; to capture your core initiatives.
              </div>
            ) : (
              programmeOfferings.map((offering) => (
                <NgoProgrammeCard
                  key={offering.id}
                  offering={{ ...offering, collapsed: !openOfferings.includes(offering.id) }}
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

        {/* Commercial Products */}
        {showProducts && !isNGO && (
          <div style={{ marginTop: '20px' }}>
            <SectionHeader title="Products" onAdd={() => addOffering('Product')} addLabel="Add Product" />
            {productOfferings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#999', fontSize: '13px', backgroundColor: '#fdfaf5', borderRadius: '8px', border: '1px dashed #d6c4a8' }}>
                No products added yet. Click &quot;Add Product&quot; and search for what your business provides.
              </div>
            ) : (
              productOfferings.map((offering) => (
                <OfferingCard
                  key={offering.id}
                  offering={{ ...offering, collapsed: !openOfferings.includes(offering.id) }}
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

        {/* Services (Both NGO and Commercial SME) */}
        {showServices && (
          <div style={{ marginTop: '20px' }}>
            <SectionHeader
              title={isNGO ? "Direct Services & Training" : "Services"}
              onAdd={() => addOffering('Service')}
              addLabel={isNGO ? "Add Service" : "Add Service"}
            />
            {serviceOfferings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#999', fontSize: '13px', backgroundColor: '#fdfaf5', borderRadius: '8px', border: '1px dashed #d6c4a8' }}>
                {isNGO
                  ? 'No direct services added yet. Click "Add Service" to describe frontline support, counselling, or training workshops.'
                  : 'No services added yet. Click "Add Service" and search for what your business provides.'}
              </div>
            ) : (
              serviceOfferings.map((offering) => (
                isNGO ? (
                  <NgoProgrammeCard
                    key={offering.id}
                    offering={{ ...offering, collapsed: !openOfferings.includes(offering.id) }}
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
                ) : (
                  <OfferingCard
                    key={offering.id}
                    offering={{ ...offering, collapsed: !openOfferings.includes(offering.id) }}
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
                )
              ))
            )}
          </div>
        )}
      </Section>

      {/* ============================================================ */}
      {/* Beneficiary Reach & Target Communities / Target Market */}
      {/* ============================================================ */}
      <Section title={isNGO ? "Beneficiary Reach & Target Communities" : "Target Market"}>
        <FormField label={isNGO ? "Target Beneficiary Groups" : "Customer types"}>
          {isNGO ? (
            <MultiSelect
              options={NGO_TARGET_BENEFICIARIES}
              allowOther
              selected={customerTypes}
              onChange={(v) => updateData({ customerTypes: v })}
              label="beneficiary groups"
              placeholder="Select target beneficiary groups..."
            />
          ) : (
            <MultiSelect
              options={customerTypeOptions}
              allowOther
              selected={customerTypes}
              onChange={(v) => updateData({ customerTypes: v })}
              label="customer types"
              placeholder="Select customer types..."
            />
          )}
        </FormField>

        {hasAnySummaryData && (
          <ExtraDetails title={isNGO ? "Beneficiary reach summary" : "Target market summary"}>
            <div style={{ marginTop: '16px', marginBottom: '16px', padding: '14px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px' }}>
              {isNGO ? (
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#1e40af', lineHeight: '1.8' }}>
                  {allFocusAreas.length > 0 && <li><strong>Focus Areas:</strong> {allFocusAreas.join(', ')}</li>}
                  {allBeneficiaryLabels.length > 0 && <li><strong>Target Beneficiaries:</strong> {allBeneficiaryLabels.join(', ')}</li>}
                  {allGeography.length > 0 && <li><strong>Delivery Locations:</strong> {allGeography.join(', ')}</li>}
                  {offerings.length > 0 && (
                    <li>
                      <strong>Programme Scale:</strong> {offerings.length} total initiative{offerings.length === 1 ? '' : 's'} ({activeProgrammesCount} active)
                      {totalHistoricBeneficiaries > 0 ? ` · ${totalHistoricBeneficiaries.toLocaleString()} historic beneficiaries reached` : ''}
                      {totalAnnualTarget > 0 ? ` · ${totalAnnualTarget.toLocaleString()} targeted annually` : ''}
                    </li>
                  )}
                </ul>
              ) : (
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#1e40af', lineHeight: '1.8' }}>
                  {customerTypes.length > 0 && <li><strong>Customer types:</strong> {customerTypes.join(', ')}</li>}
                  {allIndustries.length > 0 && <li><strong>Industries served:</strong> {allIndustries.join(', ')}</li>}
                  {allGeography.length > 0 && <li><strong>Geographic markets:</strong> {allGeography.join(', ')}</li>}
                  {allApplications.length > 0 && <li><strong>Client applications:</strong> {allApplications.join(', ')}</li>}
                  {offeringSummaries.length > 0 && <li><strong>Offering category &amp; delivery model:</strong> {offeringSummaries.join('; ')}</li>}
                </ul>
              )}
            </div>
          </ExtraDetails>
        )}

        <div style={{ marginTop: 10 }}>
          <ExtraDetails title={isNGO ? "Community context" : "Additional target market details"}>
            <textarea
              name="targetMarket"
              aria-label={isNGO ? "Community context" : "Additional target market details"}
              value={data.targetMarket || ""}
              onChange={handleChange}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              {...focusHandlers}
            />
          </ExtraDetails>
        </div>
      </Section>

      {/* ============================================================ */}
      {/* Key Funders & Project Partners / Key Clients & Customers */}
      {/* ============================================================ */}
      <Section
        title={isNGO ? "Key Funders, Grantmakers & Project Partners" : "Key Clients & Customers"}
        description={isNGO
          ? "Optional — record your major donors, CSI partners, and grantmakers to demonstrate funding track record."
          : "Optional — evidence of relevant delivery history, linked to the offerings above."
        }
      >
        {(data.keyClients || []).length > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '4px', marginBottom: '16px',
            fontSize: '12px', fontWeight: '600',
            backgroundColor: revenueOver100 ? '#fff1f0' : totalRevenuePercent === 100 ? '#f0faf0' : '#fdf6ee',
            border: `1px solid ${revenueOver100 ? '#ffccc7' : totalRevenuePercent === 100 ? '#b7eb8f' : '#d6c4a8'}`,
            color: revenueOver100 ? '#cf1322' : totalRevenuePercent === 100 ? '#389e0d' : '#5c3a1e',
          }}>
            <span>
              {isNGO ? (
                revenueOver100 ? `⚠️ Total funding allocation exceeds 100% (${totalRevenuePercent}%)`
                  : totalRevenuePercent === 100 ? `✅ Total funding allocation: ${totalRevenuePercent}%`
                  : `Funding allocated: ${totalRevenuePercent}% of 100% organisation funding`
              ) : (
                revenueOver100 ? `⚠️ Total revenue exceeds 100% (${totalRevenuePercent}%)`
                  : totalRevenuePercent === 100 ? `✅ Total revenue allocation: ${totalRevenuePercent}%`
                  : `Revenue allocated: ${totalRevenuePercent}% of 100%`
              )}
            </span>
          </div>
        )}

        <SectionHeader
          title={isNGO ? "Funders & Project Partners" : "Clients"}
          onAdd={addClient}
          addLabel={isNGO ? "Add Funder / Partner" : "Add Client"}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-brown-200 rounded-lg" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th scope="col" style={thStyle}>{isNGO ? "Funder / Partner" : "Client Name"}</th>
                <th scope="col" style={thStyle}>{isNGO ? "Partner Type" : "Type"}</th>
                <th scope="col" style={thStyle}>{isNGO ? "Funding %" : "Revenue %"}</th>
                <th scope="col" style={thStyle}>Details</th>
                <th scope="col" style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data.keyClients || []).map((client, index) => {
                const isExpanded = expandedClientIndex === index
                const rowLabel = client.name || `${isNGO ? 'partner' : 'client'} ${index + 1}`
                const detailsId = `${clientDetailsId}-${index}`
                return (
                  <React.Fragment key={client.id || index}>
                    <tr className={index % 2 === 0 ? "bg-white" : "bg-brown-50/30"}>
                      <td className="px-3 py-2 border-b">
                        <input
                          type="text"
                          aria-label={`${isNGO ? 'Partner' : 'Client'} name ${index + 1}`}
                          value={client.name || ""}
                          onChange={(event) => updateClient(index, "name", event.target.value)}
                          placeholder={isNGO ? "Partner name" : "Client name"}
                          style={{ ...tableInputStyle, minWidth: 120 }}
                          {...focusHandlers}
                        />
                      </td>
                      <td className="px-3 py-2 border-b">
                        <select
                          aria-label={`Type for ${rowLabel}`}
                          value={client.clientType || ""}
                          onChange={(event) => {
                            const value = event.target.value
                            updateClient(index, "clientType", value)
                            if (value === otherOption) setExpandedClientIndex(index)
                          }}
                          style={{ ...tableInputStyle, minWidth: 120 }}
                          {...focusHandlers}
                        >
                          <option value="">Select type</option>
                          {clientTypes.map((type) => <option key={type} value={type}>{isOther(type) ? "Other (specify)" : type}</option>)}
                          {client.clientType && !clientTypes.includes(client.clientType) && <option value={client.clientType}>{client.clientType}</option>}
                        </select>
                      </td>
                      <td className="px-3 py-2 border-b">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          aria-label={`${isNGO ? 'Funding' : 'Revenue'} percentage for ${rowLabel}`}
                          value={client.revenuePercentage ?? ""}
                          onChange={(event) => {
                            const value = event.target.value
                            updateClient(index, "revenuePercentage", value === '' ? '' : String(Math.min(100, Math.max(0, Number(value)))))
                          }}
                          placeholder="%"
                          style={{ ...tableInputStyle, width: 75 }}
                          {...focusHandlers}
                        />
                      </td>
                      <td className="px-3 py-2 border-b">
                        <button type="button" className="btn btn-secondary" aria-expanded={isExpanded} aria-controls={detailsId}
                          onClick={() => setExpandedClientIndex(isExpanded ? null : index)}>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? "Hide details" : "Details"}
                        </button>
                      </td>
                      <td className="px-3 py-2 border-b" style={{ textAlign: 'center' }}>
                        <button type="button" aria-label={`Remove ${rowLabel}`} onClick={() => removeClient(index)}
                          style={{ padding: 6, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                    <tr id={detailsId} hidden={!isExpanded}>
                      {isExpanded && (
                        <td colSpan={5} style={{ padding: 16, background: '#fcf8f2', borderBottom: '1px solid #e4d5c2' }}>
                          <ClientDetails
                            client={client}
                            isNGO={isNGO}
                            offeringOptions={offeringNameOptions}
                            update={(field, value) => updateClient(index, field, value)}
                          />
                        </td>
                      )}
                    </tr>
                  </React.Fragment>
                )
              })}
              {(data.keyClients || []).length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#8B6F47', fontSize: 13 }}>
                    {isNGO ? "No funders or partners added." : "No clients added."}
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
