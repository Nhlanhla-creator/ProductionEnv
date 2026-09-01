// src/components/DeliveryStandards.js
"use client"

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { deliveryStandards, contractPatterns, geographicCoverage } from './applicationOptions'
import MultiSelect from './MultiSelect'

export default function DeliveryStandards({ categoryId, data = {}, updateData }) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Determine which delivery standard set to show based on category
  const getDeliveryStandardType = (catId) => {
    if (!catId) return 'field_technical'
    
    const categoryMap = {
      // Professional / digital
      'accounting_services': 'professional_digital',
      'audit_services': 'professional_digital',
      'legal_services': 'professional_digital',
      'strategy_consulting': 'professional_digital',
      'software_services': 'professional_digital',
      'platform_services': 'professional_digital',
      'it_support': 'professional_digital',
      'cybersecurity': 'professional_digital',
      'data_analytics': 'professional_digital',
      
      // Field / technical
      'mechanical_maintenance': 'field_technical',
      'electrical_maintenance': 'field_technical',
      'hvac_refrigeration': 'field_technical',
      'conveyor_services': 'field_technical',
      'shutdown_turnaround': 'field_technical',
      'pumps_piping': 'field_technical',
      'welding_fabrication': 'field_technical',
      'condition_monitoring': 'field_technical',
      'instrumentation_control': 'field_technical',
      'cleaning_services': 'field_technical',
      'waste_management': 'field_technical',
      'landscaping': 'field_technical',
      'general_building_maintenance': 'field_technical',
      'pest_control': 'field_technical',
      
      // Physical product
      'mro_parts': 'physical_product',
      'electrical_components': 'physical_product',
      'hydraulic_pneumatic': 'physical_product',
      'ppe_safety_supplies': 'physical_product',
      'industrial_chemicals': 'physical_product',
      'general_stores': 'physical_product',
      'production_machinery': 'physical_product',
      'mobile_equipment': 'physical_product',
      'agricultural_equipment': 'physical_product',
      
      // Product with installation
      'hvac_installation': 'product_installation',
      'pumps_installation': 'product_installation',
      
      // Equipment hire
      'lifting_rigging': 'equipment_hire',
      'access_equipment': 'equipment_hire',
      'power_equipment': 'equipment_hire',
      'earthmoving_equipment': 'equipment_hire',
      
      // Training
      'technical_training': 'training',
      'workplace_readiness': 'training',
      'compliance_training': 'training',
      'apprenticeships': 'training',
      
      // Medical
      'occupational_health': 'medical_service',
      'onsite_medical': 'medical_service',
      'mobile_clinics': 'medical_service',
      'emergency_response': 'medical_service',
      
      // Construction / project
      'building_works': 'construction_project',
      'civil_works': 'construction_project',
      'roads_earthworks': 'construction_project',
      'mechanical_works': 'construction_project',
      'electrical_works': 'construction_project',
      'project_management': 'construction_project',
      
      'default': 'field_technical'
    }
    
    return categoryMap[catId] || 'field_technical'
  }

  const standardType = getDeliveryStandardType(categoryId)
  const standard = deliveryStandards[standardType] || deliveryStandards.field_technical

  const handleCheckboxChange = (field, value) => {
    const current = data[field] || []
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    updateData({ [field]: updated })
  }

  const handleSelectChange = (field, value) => {
    updateData({ [field]: value })
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#5c3a1e',
          margin: 0,
        }}>
          Delivery Standards
        </h4>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: 'none',
            border: 'none',
            color: '#8B6F47',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {showAdvanced ? 'Hide advanced' : 'Show advanced'}
          <ChevronDown size={14} style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none' }} />
        </button>
      </div>

      {/* Main delivery standard */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '600',
          color: '#5c3a1e',
          marginBottom: '4px',
        }}>
          {standard.label}
        </label>
        <select
          value={data.deliveryStandard || ''}
          onChange={(e) => handleSelectChange('deliveryStandard', e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #d6c4a8',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white',
            outline: 'none',
          }}
        >
          <option value="">Select...</option>
          {standard.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Lead time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            color: '#5c3a1e',
            marginBottom: '4px',
          }}>
            Minimum Lead Time
          </label>
          <div style={{ display: 'flex' }}>
            <input
              type="number"
              value={data.minLeadTime || ''}
              onChange={(e) => updateData({ minLeadTime: e.target.value })}
              placeholder="e.g., 2"
              min="0"
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d6c4a8',
                borderRadius: '4px 0 0 4px',
                fontSize: '13px',
                outline: 'none',
                color: '#3d2b1f',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
            />
            <select
              value={data.minLeadTimeUnit || 'days'}
              onChange={(e) => updateData({ minLeadTimeUnit: e.target.value })}
              style={{
                padding: '8px 12px',
                border: '1px solid #d6c4a8',
                borderLeft: 'none',
                borderRadius: '0 4px 4px 0',
                backgroundColor: 'white',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
                color: '#3d2b1f'
              }}
            >
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            color: '#5c3a1e',
            marginBottom: '4px',
          }}>
            Maximum Lead Time
          </label>
          <div style={{ display: 'flex' }}>
            <input
              type="number"
              value={data.maxLeadTime || ''}
              onChange={(e) => updateData({ maxLeadTime: e.target.value })}
              placeholder="e.g., 5"
              min="0"
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d6c4a8',
                borderRadius: '4px 0 0 4px',
                fontSize: '13px',
                outline: 'none',
                color: '#3d2b1f',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
            />
            <select
              value={data.maxLeadTimeUnit || 'days'}
              onChange={(e) => updateData({ maxLeadTimeUnit: e.target.value })}
              style={{
                padding: '8px 12px',
                border: '1px solid #d6c4a8',
                borderLeft: 'none',
                borderRadius: '0 4px 4px 0',
                backgroundColor: 'white',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
                color: '#3d2b1f'
              }}
            >
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Geographic coverage */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '600',
          color: '#5c3a1e',
          marginBottom: '4px',
        }}>
          Geographic Delivery Coverage
        </label>
        <MultiSelect
          options={geographicCoverage}
          selected={data.geographicCoverage || []}
          onChange={(value) => updateData({ geographicCoverage: value })}
          placeholder="Select coverage areas..."
        />
      </div>

      {/* Advanced fields */}
      {showAdvanced && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fdfaf5',
          borderRadius: '6px',
          border: '1px solid #f0e8d8',
          marginTop: '12px',
        }}>
          <h5 style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#5c3a1e',
            margin: '0 0 12px 0',
          }}>
            Additional Delivery Details
          </h5>
          
          {/* Contract pattern */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#5c3a1e',
              marginBottom: '4px',
            }}>
              Contract / Commercial Pattern
            </label>
            <select
              value={data.contractPattern || ''}
              onChange={(e) => updateData({ contractPattern: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #d6c4a8',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                outline: 'none',
              }}
            >
              <option value="">Select pattern...</option>
              {contractPatterns.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Depends on scope */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#5c3a1e',
            }}>
              <input
                type="checkbox"
                checked={data.dependsOnScope || false}
                onChange={(e) => updateData({ dependsOnScope: e.target.checked })}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#8B4513',
                  cursor: 'pointer',
                }}
              />
              Lead time depends on scope
            </label>
            {data.dependsOnScope && (
              <textarea
                value={data.dependsOnScopeExplanation || ''}
                onChange={(e) => updateData({ dependsOnScopeExplanation: e.target.value })}
                placeholder="Explain why lead time depends on scope..."
                rows={2}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '8px 12px',
                  border: '1px solid #d6c4a8',
                  borderRadius: '4px',
                  fontSize: '12px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  color: '#3d2b1f',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d6c4a8'}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}