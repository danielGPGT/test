/**
 * SIMPLIFIED DYNAMIC CHARGE FORM
 * Streamlined, user-friendly form for creating/editing charges
 * Progressive disclosure, compact design, better UX
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { DayOfWeekSelector } from '@/components/ui/day-of-week-selector'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type {
  DynamicCharge,
  ChargeType,
  CalculationType,
  ChargeCondition,
  ChargeTier,
  DayOfWeekSelection
} from '@/types/unified-inventory'
import {
  CHARGE_TYPE_LABELS,
  daySelectionToArray,
  arrayToDaySelection
} from '@/types/unified-inventory'

interface DynamicChargeFormProps {
  charge?: DynamicCharge
  onSave: (charge: DynamicCharge) => void
  onCancel: () => void
}

export function DynamicChargeFormSimple({ charge, onSave, onCancel }: DynamicChargeFormProps) {
  const [formData, setFormData] = useState<DynamicCharge>(
    charge || {
      id: `ch-${Date.now()}`,
      charge_name: '',
      charge_type: 'commission',
      calculation_type: 'percentage',
      calculation_config: {},
      applied_to: 'base_price',
      direction: 'add',
      timing: 'immediate',
      conditions: [],
      display_in_breakdown: true,
      include_in_selling_price: true,
      tax_exempt: false,
      mandatory: false,
      active: true
    }
  )

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showConditions, setShowConditions] = useState(charge?.conditions && charge.conditions.length > 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const updateField = <K extends keyof DynamicCharge>(key: K, value: DynamicCharge[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const updateConfigField = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      calculation_config: { ...prev.calculation_config, [key]: value }
    }))
  }

  // Auto-set direction based on charge type
  const handleChargeTypeChange = (type: ChargeType) => {
    updateField('charge_type', type)
    // Auto-set direction
    if (type === 'discount' || type === 'commission') {
      updateField('direction', 'subtract')
    } else {
      updateField('direction', 'add')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Info - Compact */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Charge Name *</Label>
            <Input
              value={formData.charge_name}
              onChange={(e) => updateField('charge_name', e.target.value)}
              placeholder="e.g., VAT"
              required
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Type *</Label>
            <Select value={formData.charge_type} onValueChange={handleChargeTypeChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHARGE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Calculation Method */}
        <div className="space-y-1.5">
          <Label className="text-sm">How to Calculate *</Label>
          <Select value={formData.calculation_type} onValueChange={(v) => updateField('calculation_type', v as CalculationType)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage (e.g., 20% VAT)</SelectItem>
              <SelectItem value="fixed_amount">Fixed Amount (e.g., $50 fee)</SelectItem>
              <SelectItem value="per_person">Per Person (e.g., $10/person)</SelectItem>
              <SelectItem value="per_person_per_night">Per Person Per Night (e.g., $5/person/night)</SelectItem>
              <SelectItem value="per_unit">Per Unit (e.g., $100/vehicle)</SelectItem>
              <SelectItem value="tiered">Tiered/Volume Based</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Calculation Value */}
        {formData.calculation_type === 'percentage' && (
          <div className="space-y-1.5">
            <Label className="text-sm">Percentage (%) *</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.calculation_config.percentage ? formData.calculation_config.percentage * 100 : ''}
                onChange={(e) => updateConfigField('percentage', parseFloat(e.target.value) / 100 || 0)}
                placeholder="e.g., 20"
                required
                className="h-9"
              />
              <span className="text-sm text-muted-foreground self-center">%</span>
            </div>
          </div>
        )}

        {formData.calculation_type === 'fixed_amount' && (
          <div className="space-y-1.5">
            <Label className="text-sm">Amount *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.calculation_config.fixed_amount || ''}
              onChange={(e) => updateConfigField('fixed_amount', parseFloat(e.target.value) || 0)}
              placeholder="e.g., 50"
              required
              className="h-9"
            />
          </div>
        )}

        {(['per_person', 'per_person_per_night', 'per_unit'] as CalculationType[]).includes(formData.calculation_type) && (
          <div className="space-y-1.5">
            <Label className="text-sm">Amount Per Unit *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.calculation_config.amount_per_unit || ''}
              onChange={(e) => updateConfigField('amount_per_unit', parseFloat(e.target.value) || 0)}
              placeholder="e.g., 10"
              required
              className="h-9"
            />
          </div>
        )}

        {formData.calculation_type === 'tiered' && (
          <TieredPricingBuilder
            tiers={formData.calculation_config.tiers || []}
            onChange={(tiers) => updateConfigField('tiers', tiers)}
          />
        )}
      </div>

      <Separator />

      {/* Conditions Toggle */}
      <div className="flex items-center justify-between py-2">
        <div>
          <Label className="text-sm font-medium">Add Conditions</Label>
          <p className="text-xs text-muted-foreground">When should this charge apply?</p>
        </div>
        <Switch
          checked={showConditions}
          onCheckedChange={setShowConditions}
        />
      </div>

      {showConditions && (
        <ConditionsBuilder
          conditions={formData.conditions || []}
          onChange={(conditions) => updateField('conditions', conditions)}
        />
      )}

      <Separator />

      {/* Advanced Options Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full"
      >
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        Advanced Options
      </button>

      {showAdvanced && (
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Display in Breakdown</Label>
              <Switch
                checked={formData.display_in_breakdown}
                onCheckedChange={(v) => updateField('display_in_breakdown', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Tax Exempt</Label>
              <Switch
                checked={formData.tax_exempt}
                onCheckedChange={(v) => updateField('tax_exempt', v)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Applied To</Label>
            <Select value={formData.applied_to} onValueChange={(v) => updateField('applied_to', v as any)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base_price">Base Price</SelectItem>
                <SelectItem value="subtotal">Subtotal</SelectItem>
                <SelectItem value="total">Total</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Timing</Label>
            <Select value={formData.timing} onValueChange={(v) => updateField('timing', v as any)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="on_confirmation">On Confirmation</SelectItem>
                <SelectItem value="on_payment">On Payment</SelectItem>
                <SelectItem value="on_service_date">On Service Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Min Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.calculation_config.min_amount || ''}
                onChange={(e) => updateConfigField('min_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="h-8 text-xs"
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Max Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.calculation_config.max_amount || ''}
                onChange={(e) => updateConfigField('max_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="h-8 text-xs"
                placeholder="Optional"
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {charge ? 'Update' : 'Create'} Charge
        </Button>
      </div>
    </form>
  )
}

// Tiered Pricing Builder Component
function TieredPricingBuilder({ tiers, onChange }: { tiers: ChargeTier[], onChange: (tiers: ChargeTier[]) => void }) {
  const addTier = () => {
    const lastTier = tiers[tiers.length - 1]
    const newMinValue = lastTier ? (lastTier.max_value || lastTier.min_value) + 1 : 1

    onChange([
      ...tiers,
      {
        min_value: newMinValue,
        rate: 0,
        calculation_type: 'percentage'
      }
    ])
  }

  const updateTier = (index: number, updates: Partial<ChargeTier>) => {
    onChange(tiers.map((t, i) => i === index ? { ...t, ...updates } : t))
  }

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Volume Tiers *</Label>
        <Button type="button" variant="outline" size="sm" onClick={addTier} className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Add Tier
        </Button>
      </div>

      {tiers.map((tier, index) => (
        <div key={index} className="grid grid-cols-5 gap-2 p-2 bg-muted/30 rounded text-xs">
          <Input
            type="number"
            min="0"
            value={tier.min_value}
            onChange={(e) => updateTier(index, { min_value: parseInt(e.target.value) || 0 })}
            placeholder="Min"
            className="h-8 text-xs"
          />
          <Input
            type="number"
            min="0"
            value={tier.max_value || ''}
            onChange={(e) => updateTier(index, { max_value: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Max (∞)"
            className="h-8 text-xs"
          />
          <Input
            type="number"
            step="0.01"
            value={tier.rate}
            onChange={(e) => updateTier(index, { rate: parseFloat(e.target.value) || 0 })}
            placeholder="Rate"
            className="h-8 text-xs"
          />
          <Select
            value={tier.calculation_type}
            onValueChange={(v) => updateTier(index, { calculation_type: v as any })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">%</SelectItem>
              <SelectItem value="fixed_amount">$</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeTier(index)}
            className="h-8 text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  )
}

// Conditions Builder Component
function ConditionsBuilder({ conditions, onChange }: { conditions: ChargeCondition[], onChange: (conditions: ChargeCondition[]) => void }) {
  const addCondition = () => {
    onChange([
      ...conditions,
      {
        condition_type: 'day_of_week',
        operator: 'in',
        value: []
      }
    ])
  }

  const updateCondition = (index: number, updates: Partial<ChargeCondition>) => {
    onChange(conditions.map((c, i) => i === index ? { ...c, ...updates } : c))
  }

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index))
  }

  const [daySelection, setDaySelection] = useState<Record<number, DayOfWeekSelection>>({})

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Conditions</Label>
        <Button type="button" variant="outline" size="sm" onClick={addCondition} className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      {conditions.map((condition, index) => (
        <div key={index} className="p-2 bg-muted/30 rounded space-y-2">
          <div className="flex items-center justify-between">
            <Select value={condition.condition_type} onValueChange={(v) => updateCondition(index, { condition_type: v as any })}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day_of_week">Day of Week</SelectItem>
                <SelectItem value="date_range">Date Range</SelectItem>
                <SelectItem value="quantity">Quantity</SelectItem>
                <SelectItem value="nights">Number of Nights</SelectItem>
                <SelectItem value="lead_time">Lead Time (days)</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeCondition(index)}
              className="h-8 text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {condition.condition_type === 'day_of_week' && (
            <DayOfWeekSelector
              value={daySelection[index] || arrayToDaySelection(condition.value as any || [])}
              onChange={(selection) => {
                setDaySelection(prev => ({ ...prev, [index]: selection }))
                updateCondition(index, { value: daySelectionToArray(selection) })
              }}
              label=""
            />
          )}

          {condition.condition_type === 'date_range' && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={condition.value || ''}
                onChange={(e) => updateCondition(index, { value: e.target.value })}
                className="h-8 text-xs"
              />
              <Input
                type="date"
                value={condition.value_max || ''}
                onChange={(e) => updateCondition(index, { value_max: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          )}

          {['quantity', 'nights', 'lead_time'].includes(condition.condition_type) && (
            <div className="grid grid-cols-3 gap-2">
              <Select value={condition.operator || 'greater_than'} onValueChange={(v) => updateCondition(index, { operator: v as any })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="greater_than">{'>'}</SelectItem>
                  <SelectItem value="less_than">{'<'}</SelectItem>
                  <SelectItem value="equals">{'='}</SelectItem>
                  <SelectItem value="between">Between</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={condition.value || ''}
                onChange={(e) => updateCondition(index, { value: parseInt(e.target.value) || 0 })}
                placeholder="Value"
                className="h-8 text-xs"
              />
              {condition.operator === 'between' && (
                <Input
                  type="number"
                  value={condition.value_max || ''}
                  onChange={(e) => updateCondition(index, { value_max: parseInt(e.target.value) || 0 })}
                  placeholder="Max"
                  className="h-8 text-xs"
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

