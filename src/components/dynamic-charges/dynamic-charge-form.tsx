/**
 * DYNAMIC CHARGE FORM
 * Form for creating/editing dynamic charges
 * Handles all charge types, calculation methods, and conditions
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DayOfWeekSelector } from '@/components/ui/day-of-week-selector'
import { Plus, Trash2 } from 'lucide-react'
import type {
  DynamicCharge,
  ChargeType,
  CalculationType,
  AppliedTo,
  ChargeDirection,
  ChargeTiming,
  ConditionType,
  ChargeCondition,
  ChargeTier,
  DayOfWeekSelection,
  DayOfWeek
} from '@/types/unified-inventory'
import {
  CHARGE_TYPE_LABELS,
  CALCULATION_TYPE_LABELS,
  APPLIED_TO_LABELS,
  CHARGE_DIRECTION_LABELS,
  CHARGE_TIMING_LABELS,
  CONDITION_TYPE_LABELS,
  daySelectionToArray,
  arrayToDaySelection
} from '@/types/unified-inventory'

interface DynamicChargeFormProps {
  charge?: DynamicCharge
  onSave: (charge: DynamicCharge) => void
  onCancel: () => void
}

export function DynamicChargeForm({ charge, onSave, onCancel }: DynamicChargeFormProps) {
  const [formData, setFormData] = useState<DynamicCharge>(
    charge || {
      id: `ch-${Date.now()}`,
      charge_name: '',
      charge_type: 'fee',
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

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [
        ...(prev.conditions || []),
        {
          condition_type: 'date_range',
          operator: 'between',
          value: new Date().toISOString().split('T')[0]
        }
      ]
    }))
  }

  const updateCondition = (index: number, updates: Partial<ChargeCondition>) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions?.map((c, i) => i === index ? { ...c, ...updates } : c) || []
    }))
  }

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions?.filter((_, i) => i !== index) || []
    }))
  }

  const addTier = () => {
    const currentTiers = formData.calculation_config.tiers || []
    const lastTier = currentTiers[currentTiers.length - 1]
    const newMinValue = lastTier ? (lastTier.max_value || lastTier.min_value) + 1 : 1

    setFormData(prev => ({
      ...prev,
      calculation_config: {
        ...prev.calculation_config,
        tiers: [
          ...(prev.calculation_config.tiers || []),
          {
            min_value: newMinValue,
            rate: 0,
            calculation_type: 'percentage'
          }
        ]
      }
    }))
  }

  const updateTier = (index: number, updates: Partial<ChargeTier>) => {
    setFormData(prev => ({
      ...prev,
      calculation_config: {
        ...prev.calculation_config,
        tiers: prev.calculation_config.tiers?.map((t, i) => i === index ? { ...t, ...updates } : t) || []
      }
    }))
  }

  const removeTier = (index: number) => {
    setFormData(prev => ({
      ...prev,
      calculation_config: {
        ...prev.calculation_config,
        tiers: prev.calculation_config.tiers?.filter((_, i) => i !== index) || []
      }
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Define the charge name and type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="charge_name">Charge Name *</Label>
              <Input
                id="charge_name"
                value={formData.charge_name}
                onChange={(e) => updateField('charge_name', e.target.value)}
                placeholder="e.g., Weekend Surcharge"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="charge_type">Charge Type *</Label>
              <Select value={formData.charge_type} onValueChange={(v) => updateField('charge_type', v as ChargeType)}>
                <SelectTrigger id="charge_type">
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Optional description for internal reference"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Calculation */}
      <Card>
        <CardHeader>
          <CardTitle>Calculation Method</CardTitle>
          <CardDescription>How should this charge be calculated?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calculation_type">Calculation Type *</Label>
            <Select value={formData.calculation_type} onValueChange={(v) => updateField('calculation_type', v as CalculationType)}>
              <SelectTrigger id="calculation_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CALCULATION_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Percentage */}
          {formData.calculation_type === 'percentage' && (
            <div className="space-y-2">
              <Label htmlFor="percentage">Percentage (0-1) *</Label>
              <Input
                id="percentage"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.calculation_config.percentage || ''}
                onChange={(e) => updateConfigField('percentage', parseFloat(e.target.value) || 0)}
                placeholder="e.g., 0.2 for 20%"
                required
              />
              {formData.calculation_config.percentage && (
                <p className="text-sm text-muted-foreground">
                  = {(formData.calculation_config.percentage * 100).toFixed(2)}%
                </p>
              )}
            </div>
          )}

          {/* Fixed Amount */}
          {formData.calculation_type === 'fixed_amount' && (
            <div className="space-y-2">
              <Label htmlFor="fixed_amount">Fixed Amount *</Label>
              <Input
                id="fixed_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.calculation_config.fixed_amount || ''}
                onChange={(e) => updateConfigField('fixed_amount', parseFloat(e.target.value) || 0)}
                placeholder="e.g., 50"
                required
              />
            </div>
          )}

          {/* Per Unit/Person/Night */}
          {(['per_person', 'per_person_per_night', 'per_unit', 'per_unit_per_day'] as CalculationType[]).includes(formData.calculation_type) && (
            <div className="space-y-2">
              <Label htmlFor="amount_per_unit">Amount Per Unit *</Label>
              <Input
                id="amount_per_unit"
                type="number"
                step="0.01"
                min="0"
                value={formData.calculation_config.amount_per_unit || ''}
                onChange={(e) => updateConfigField('amount_per_unit', parseFloat(e.target.value) || 0)}
                placeholder="e.g., 10"
                required
              />
            </div>
          )}

          {/* Tiered */}
          {formData.calculation_type === 'tiered' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Volume Tiers *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTier}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
              </div>

              {formData.calculation_config.tiers?.map((tier, index) => (
                <Card key={index} className="p-3">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Min Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        value={tier.min_value}
                        onChange={(e) => updateTier(index, { min_value: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Max Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        value={tier.max_value || ''}
                        onChange={(e) => updateTier(index, { max_value: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="∞"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Rate</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tier.rate}
                        onChange={(e) => updateTier(index, { rate: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={tier.calculation_type}
                        onValueChange={(v) => updateTier(index, { calculation_type: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="fixed_amount">Fixed</SelectItem>
                          <SelectItem value="per_unit">Per Unit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-destructive"
                    onClick={() => removeTier(index)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remove Tier
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {/* Min/Max Bounds */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min_amount">Minimum Amount</Label>
              <Input
                id="min_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.calculation_config.min_amount || ''}
                onChange={(e) => updateConfigField('min_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_amount">Maximum Amount</Label>
              <Input
                id="max_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.calculation_config.max_amount || ''}
                onChange={(e) => updateConfigField('max_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Optional"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application */}
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>When and how to apply this charge</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="applied_to">Applied To *</Label>
              <Select value={formData.applied_to} onValueChange={(v) => updateField('applied_to', v as AppliedTo)}>
                <SelectTrigger id="applied_to">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPLIED_TO_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direction">Direction *</Label>
              <Select value={formData.direction} onValueChange={(v) => updateField('direction', v as ChargeDirection)}>
                <SelectTrigger id="direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CHARGE_DIRECTION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timing">Timing *</Label>
            <Select value={formData.timing} onValueChange={(v) => updateField('timing', v as ChargeTiming)}>
              <SelectTrigger id="timing">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHARGE_TIMING_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conditions (Optional)</CardTitle>
              <CardDescription>When should this charge apply?</CardDescription>
            </div>
            <Switch
              checked={showConditions}
              onCheckedChange={setShowConditions}
            />
          </div>
        </CardHeader>
        {showConditions && (
          <CardContent className="space-y-3">
            {formData.conditions?.map((condition, index) => (
              <ConditionEditor
                key={index}
                condition={condition}
                onChange={(updates) => updateCondition(index, updates)}
                onRemove={() => removeCondition(index)}
              />
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addCondition} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Display & Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Display & Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Display in Breakdown</Label>
              <p className="text-sm text-muted-foreground">Show to customer in price breakdown?</p>
            </div>
            <Switch
              checked={formData.display_in_breakdown}
              onCheckedChange={(v) => updateField('display_in_breakdown', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Include in Selling Price</Label>
              <p className="text-sm text-muted-foreground">Include in quoted price or add later?</p>
            </div>
            <Switch
              checked={formData.include_in_selling_price}
              onCheckedChange={(v) => updateField('include_in_selling_price', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Tax Exempt</Label>
              <p className="text-sm text-muted-foreground">Is this charge itself tax-exempt?</p>
            </div>
            <Switch
              checked={formData.tax_exempt}
              onCheckedChange={(v) => updateField('tax_exempt', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Mandatory</Label>
              <p className="text-sm text-muted-foreground">Must be applied (e.g., government tax)?</p>
            </div>
            <Switch
              checked={formData.mandatory}
              onCheckedChange={(v) => updateField('mandatory', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Active</Label>
              <p className="text-sm text-muted-foreground">Is this charge currently active?</p>
            </div>
            <Switch
              checked={formData.active}
              onCheckedChange={(v) => updateField('active', v)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accounting_code">Accounting Code</Label>
            <Input
              id="accounting_code"
              value={formData.accounting_code || ''}
              onChange={(e) => updateField('accounting_code', e.target.value)}
              placeholder="Optional - for financial reporting"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {charge ? 'Update Charge' : 'Create Charge'}
        </Button>
      </div>
    </form>
  )
}

// Condition Editor Component
function ConditionEditor({
  condition,
  onChange,
  onRemove
}: {
  condition: ChargeCondition
  onChange: (updates: Partial<ChargeCondition>) => void
  onRemove: () => void
}) {
  const [daySelection, setDaySelection] = useState<DayOfWeekSelection>(
    condition.condition_type === 'day_of_week' && Array.isArray(condition.value)
      ? arrayToDaySelection(condition.value as DayOfWeek[])
      : { monday: false, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: false }
  )

  const handleDaySelectionChange = (selection: DayOfWeekSelection) => {
    setDaySelection(selection)
    onChange({ value: daySelectionToArray(selection) })
  }

  return (
    <Card className="p-3">
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Condition Type</Label>
            <Select value={condition.condition_type} onValueChange={(v) => onChange({ condition_type: v as ConditionType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONDITION_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Operator</Label>
            <Select value={condition.operator} onValueChange={(v) => onChange({ operator: v as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="not_equals">Not Equals</SelectItem>
                <SelectItem value="greater_than">Greater Than</SelectItem>
                <SelectItem value="less_than">Less Than</SelectItem>
                <SelectItem value="between">Between</SelectItem>
                <SelectItem value="in">In</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Day of Week Selector */}
        {condition.condition_type === 'day_of_week' && (
          <DayOfWeekSelector
            value={daySelection}
            onChange={handleDaySelectionChange}
            label="Select Days"
          />
        )}

        {/* Date Range */}
        {condition.condition_type === 'date_range' && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">From Date</Label>
              <Input
                type="date"
                value={condition.value || ''}
                onChange={(e) => onChange({ value: e.target.value })}
              />
            </div>
            {condition.operator === 'between' && (
              <div className="space-y-1">
                <Label className="text-xs">To Date</Label>
                <Input
                  type="date"
                  value={condition.value_max || ''}
                  onChange={(e) => onChange({ value_max: e.target.value })}
                />
              </div>
            )}
          </div>
        )}

        {/* Numeric conditions */}
        {['quantity', 'nights', 'lead_time'].includes(condition.condition_type) && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Value</Label>
              <Input
                type="number"
                value={condition.value || ''}
                onChange={(e) => onChange({ value: parseInt(e.target.value) || 0 })}
              />
            </div>
            {condition.operator === 'between' && (
              <div className="space-y-1">
                <Label className="text-xs">Max Value</Label>
                <Input
                  type="number"
                  value={condition.value_max || ''}
                  onChange={(e) => onChange({ value_max: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}
          </div>
        )}

        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
          <Trash2 className="h-3 w-3 mr-1" />
          Remove Condition
        </Button>
      </div>
    </Card>
  )
}

