/**
 * UNIFIED RATE FORM (Production Version)
 * Enterprise-grade polymorphic rate form for ALL inventory types
 * Conditionally shows type-specific fields with full validation
 */

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Package } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import type {
  InventoryItem,
  UnifiedContract,
  UnifiedRate,
  OccupancyType,
  BoardType,
} from '@/types/unified-inventory'
import { BOARD_TYPE_LABELS } from '@/types/unified-inventory'
import { DynamicChargesManager } from '@/components/dynamic-charges'
import { DayOfWeekSelector } from '@/components/ui/day-of-week-selector'
import { recordToDaySelection, daySelectionToRecord } from '@/types/unified-inventory'
import { PoolStatusIndicator } from '@/components/allocation'
import { TimeSlotManager, GroupPricingManager } from '@/components/unified-inventory/shared'

interface UnifiedRateFormEnhancedProps {
  item: InventoryItem
  contract?: UnifiedContract
  existingRate?: UnifiedRate
  tours: Array<{ id: number; name: string }>
  existingRates?: UnifiedRate[] // Add this to access existing rates for pairing
  allocations: Array<{ id: number; item_id: number; allocation_pool_id: string; active: boolean }> // Add allocations prop
  onSave: (data: Omit<UnifiedRate, 'id' | 'selling_price' | 'itemName' | 'categoryName' | 'contractName' | 'item_type' | 'tourName' | 'created_at'>) => void
  onCancel: () => void
}

export function UnifiedRateFormEnhanced({
  item,
  contract,
  existingRate,
  tours,
  existingRates = [],
  allocations = [],
  onSave,
  onCancel
}: UnifiedRateFormEnhancedProps) {
  const [formData, setFormData] = useState<Partial<UnifiedRate>>({
    item_id: item.id,
    contract_id: contract?.id,
    category_id: '',
    tour_id: undefined,
    allocation_pool_id: undefined,
    base_rate: 0,
    markup_percentage: contract?.markup_percentage || 0.60,
    currency: contract?.currency || 'EUR',
    inventory_type: contract ? 'contract' : 'buy_to_order',
    valid_from: contract?.valid_from || '',
    valid_to: contract?.valid_to || '',
    min_nights: contract?.min_nights,
    max_nights: contract?.max_nights,
    days_of_week: contract?.days_of_week,
    active: true,
    inactive_reason: '',
    rate_details: {},
    dynamic_charges: [],
    cost_overrides: {
      override_costs: false
    }
  })

  // Toggle for custom charges
  const [useCustomCharges, setUseCustomCharges] = useState(false)

  useEffect(() => {
    if (existingRate) {
      setFormData(existingRate)
      // Enable custom charges toggle if rate has charges
      if (existingRate.dynamic_charges && existingRate.dynamic_charges.length > 0) {
        setUseCustomCharges(true)
      }
    } else {
      // Set default rate details based on item type
      if (item.item_type === 'hotel') {
        setFormData(prev => ({
          ...prev,
          rate_details: {
            occupancy_type: 'double',
            board_type: 'bed_breakfast',
            board_cost: 0,
            board_included: true
          }
        }))
      } else if (item.item_type === 'transfer') {
        setFormData(prev => ({
          ...prev,
          rate_details: {
            direction: 'inbound',
            pricing_unit: 'per_vehicle'
          }
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          rate_details: {
            pricing_unit: 'per_person'
          }
        }))
      }
    }
  }, [existingRate, item.item_type])

  const updateField = (field: keyof UnifiedRate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateRateDetail = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      rate_details: { ...prev.rate_details, [field]: value }
    }))
  }


  // Get available pool IDs from allocations for this item
  const availablePools = useMemo(() => {
    if (!item) return []
    
    // Get all allocations for this item
    const itemAllocations = allocations.filter(a => a.item_id === item.id && a.active)
    
    // Extract unique pool IDs from allocations
    const poolIds = [...new Set(itemAllocations.map(a => a.allocation_pool_id).filter(Boolean))]
    
    return poolIds
  }, [item, allocations])

  // Calculate board cost for hotels
  const calculateBoardCost = (): number => {
    if (item.item_type !== 'hotel') return 0
    
    const occupancy = formData.rate_details?.occupancy_type
    const boardType = formData.rate_details?.board_type
    
    if (!occupancy || !boardType) return 0
    
    const peoplePerRoom = occupancy === 'single' ? 1 : occupancy === 'double' ? 2 : occupancy === 'triple' ? 3 : 4
    
    // Buy-to-order: use manually entered board cost
    if (!contract) {
      return (formData.rate_details?.board_cost || 0) * peoplePerRoom
    }
    
    // Contract with overrides: use override cost
    if (formData.cost_overrides?.override_costs && formData.rate_details?.board_cost) {
      return formData.rate_details.board_cost
    }
    
    // Get from contract board options
    const boardOption = contract.hotel_costs?.board_options?.find(
      o => o.board_type === boardType
    )
    
    return boardOption ? boardOption.additional_cost * peoplePerRoom : 0
  }

  // Calculate selling price preview
  const sellingPrice = useMemo(() => {
    if (!formData.base_rate || formData.base_rate <= 0) return 0
    
    const boardCost = item.item_type === 'hotel' ? calculateBoardCost() : 0
    const totalCost = formData.base_rate + boardCost
    
    return totalCost * (1 + (formData.markup_percentage || 0))
  }, [formData.base_rate, formData.markup_percentage, formData.rate_details, item.item_type])

  const handleSubmit = () => {
    // Validation
    if (!formData.category_id) {
      toast.error('Please select a category')
      return
    }
    
    if (!formData.base_rate || formData.base_rate <= 0) {
      toast.error('Please enter a valid base rate')
      return
    }

    // Hotel-specific validation
    if (item.item_type === 'hotel') {
      if (!formData.rate_details?.occupancy_type) {
        toast.error('Please select occupancy type')
        return
      }
      if (!formData.rate_details?.board_type) {
        toast.error('Please select board type')
        return
      }
    }

    // Transfer-specific validation
    if (item.item_type === 'transfer') {
      const category = item.categories.find(c => c.id === formData.category_id)
      if (category?.pricing_behavior.directional && !formData.rate_details?.direction) {
        toast.error('Please select direction')
        return
      }
    }

    // Buy-to-order validation
    if (!contract) {
      if (!formData.valid_from || !formData.valid_to) {
        toast.error('Buy-to-order rates require validity dates')
        return
      }
    }

    onSave(formData as any)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-3 bg-muted/30 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {contract 
                ? `${contract.contract_name} • ${contract.currency}`
                : `Buy-to-Order (Estimated Costs)`
              }
            </p>
          </div>
          <Badge variant={contract ? 'default' : 'secondary'}>
            {contract ? 'Contract' : 'Buy-to-Order'}
          </Badge>
        </div>
      </div>

      {/* Category Selection */}
      <div className="grid gap-2">
        <Label>Category *</Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => updateField('category_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {item.categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.category_name}
                {category.capacity_info.max_occupancy && ` (Max: ${category.capacity_info.max_occupancy})`}
                {category.capacity_info.max_pax && ` (${category.capacity_info.min_pax}-${category.capacity_info.max_pax} pax)`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* HOTEL-SPECIFIC FIELDS */}
      {item.item_type === 'hotel' && (
        <>
          <div className="grid gap-2">
            <Label>Occupancy Type *</Label>
            <Select
              value={formData.rate_details?.occupancy_type}
              onValueChange={(value: OccupancyType) => updateRateDetail('occupancy_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Occupancy (1 person)</SelectItem>
                <SelectItem value="double">Double Occupancy (2 people)</SelectItem>
                <SelectItem value="triple">Triple Occupancy (3 people)</SelectItem>
                <SelectItem value="quad">Quad Occupancy (4 people)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Board/Meal Plan *</Label>
            <Select
              value={formData.rate_details?.board_type}
              onValueChange={(value: BoardType) => updateRateDetail('board_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contract && contract.hotel_costs?.board_options ? (
                  contract.hotel_costs.board_options.map(option => (
                    <SelectItem key={option.board_type} value={option.board_type}>
                      {BOARD_TYPE_LABELS[option.board_type]} (+{formatCurrency(option.additional_cost, contract.currency)}/person)
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="room_only">Room Only</SelectItem>
                    <SelectItem value="bed_breakfast">Bed & Breakfast</SelectItem>
                    <SelectItem value="half_board">Half Board</SelectItem>
                    <SelectItem value="full_board">Full Board</SelectItem>
                    <SelectItem value="all_inclusive">All-Inclusive</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Board Cost (Buy-to-Order only) */}
          {!contract && (
            <div className="grid gap-2">
              <Label>Board Cost (per person per night) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.rate_details?.board_cost || 0}
                onChange={(e) => updateRateDetail('board_cost', parseFloat(e.target.value) || 0)}
                placeholder="e.g., 12.15"
              />
            </div>
          )}
        </>
      )}

      {/* TRANSFER-SPECIFIC FIELDS */}
      {item.item_type === 'transfer' && (
        <div className="grid gap-2">
          <Label>Direction</Label>
          <Select
            value={formData.rate_details?.direction || 'none'}
            onValueChange={(value) => updateRateDetail('direction', value === 'none' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              <SelectItem value="one_way">One Way</SelectItem>
              <SelectItem value="inbound">Inbound (Arrival)</SelectItem>
              <SelectItem value="outbound">Outbound (Departure)</SelectItem>
              <SelectItem value="round_trip">Round Trip (Both Ways)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            For transfers: specify if this is arrival, departure, or round-trip
          </p>
        </div>
      )}

      {/* Paired Rate Linking for Inbound/Outbound Transfers */}
      {item.item_type === 'transfer' && (formData.rate_details?.direction === 'inbound' || formData.rate_details?.direction === 'outbound') && (
        <div className="grid gap-2">
          <Label>Paired Rate (Optional)</Label>
          <Select
            value={formData.rate_details?.paired_rate_id?.toString() || 'none'}
            onValueChange={(value) => updateRateDetail('paired_rate_id', value === 'none' ? undefined : parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No paired rate</SelectItem>
              {(() => {
                const currentDirection = formData.rate_details?.direction
                const oppositeDirection = currentDirection === 'inbound' ? 'outbound' : 'inbound'
                
                return existingRates
                  .filter(rate => 
                    rate.id !== existingRate?.id && // Don't include current rate
                    rate.item_id === item.id && // Same item
                    rate.rate_details?.direction === oppositeDirection // Opposite direction
                  )
                  .map(rate => (
                    <SelectItem key={rate.id} value={rate.id.toString()}>
                      {rate.categoryName} - {rate.rate_details?.direction} (AED {rate.base_rate})
                    </SelectItem>
                  ))
              })()}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Link to the opposite direction rate (e.g., inbound links to outbound)
          </p>
        </div>
      )}

      {/* Tour Linking (Optional) */}
      <div className="grid gap-2">
        <Label>Link to Tour (Optional)</Label>
        <Select
          value={formData.tour_id?.toString() || 'none'}
          onValueChange={(value) => updateField('tour_id', value === 'none' ? undefined : parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="No specific tour (generic)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Tour (Generic)</SelectItem>
            {tours.map(tour => (
              <SelectItem key={tour.id} value={tour.id.toString()}>
                {tour.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Allocation Pool ID */}
      <div className="grid gap-2 border-t pt-3">
        <Label className="flex items-center gap-2">
          <Package className="h-3 w-3" />
          Allocation Pool ID
        </Label>
        
        {availablePools.length > 0 ? (
          <Select
            value={formData.allocation_pool_id || 'none'}
            onValueChange={(value) => updateField('allocation_pool_id', value === 'none' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select pool from contract" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Pool (Separate Inventory)</SelectItem>
              {availablePools.map((poolId, idx) => (
                <SelectItem key={idx} value={poolId}>
                  {poolId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type="text"
            value={formData.allocation_pool_id || ''}
            onChange={(e) => updateField('allocation_pool_id', e.target.value || undefined)}
            placeholder="e.g., f1-premium-pool"
          />
        )}
        
        {formData.allocation_pool_id && (
          <PoolStatusIndicator 
            poolId={formData.allocation_pool_id} 
            contractId={contract?.id}
          />
        )}
      </div>

      {/* Active Status */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="rate-active"
            checked={formData.active}
            onCheckedChange={(checked) => updateField('active', !!checked)}
          />
          <label htmlFor="rate-active" className="text-sm font-medium cursor-pointer">
            Active (available for booking)
          </label>
        </div>
        {!formData.active && (
          <Input
            placeholder="Reason for deactivation"
            value={formData.inactive_reason}
            onChange={(e) => updateField('inactive_reason', e.target.value)}
            className="ml-6"
          />
        )}
      </div>

      {/* Validity Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            Valid From {!contract && '*'}
          </Label>
          <Input
            type="date"
            value={formData.valid_from}
            onChange={(e) => updateField('valid_from', e.target.value)}
          />
          {contract && (
            <p className="text-xs text-muted-foreground">
              Contract: {contract.valid_from}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            Valid To {!contract && '*'}
          </Label>
          <Input
            type="date"
            value={formData.valid_to}
            onChange={(e) => updateField('valid_to', e.target.value)}
            min={formData.valid_from}
          />
          {contract && (
            <p className="text-xs text-muted-foreground">
              Contract: {contract.valid_to}
            </p>
          )}
        </div>
      </div>

      {/* Min/Max Nights (Hotels and applicable services) */}
      {(item.item_type === 'hotel' || formData.min_nights !== undefined) && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Min Nights</Label>
              <Input
                type="number"
                min={1}
                value={formData.min_nights ?? ''}
                onChange={(e) => updateField('min_nights', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder={contract?.min_nights?.toString() || '1'}
              />
            </div>
            <div className="grid gap-2">
              <Label>Max Nights</Label>
              <Input
                type="number"
                min={formData.min_nights || 1}
                value={formData.max_nights ?? ''}
                onChange={(e) => updateField('max_nights', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder={contract?.max_nights?.toString() || '14'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Days of Week Selector - Available for ALL inventory types */}
      <div className="grid gap-2">
        <DayOfWeekSelector
          value={recordToDaySelection(formData.days_of_week)}
          onChange={(selection) => updateField('days_of_week', daySelectionToRecord(selection))}
          label="Valid Days of Week"
        />
        <p className="text-xs text-muted-foreground">
          Select which days of the week this rate is valid for. All days are selected by default.
        </p>
      </div>

      {/* Base Rate */}
      <div className="grid gap-2">
        <Label>
          Base Rate per {item.item_type === 'hotel' ? 'Night' : 'Unit'} ({formData.currency}) *
        </Label>
        <Input
          type="number"
          step="0.01"
          value={formData.base_rate}
          onChange={(e) => updateField('base_rate', parseFloat(e.target.value) || 0)}
          placeholder="e.g., 300.00"
        />
      </div>

      {/* Markup */}
      <div className="grid gap-2">
        <Label>Markup (%)</Label>
        <Input
          type="number"
          step="1"
          value={(formData.markup_percentage || 0) * 100}
          onChange={(e) => updateField('markup_percentage', (parseFloat(e.target.value) || 0) / 100)}
          placeholder="60"
        />
      </div>

      {/* Price Preview */}
      {formData.base_rate && formData.base_rate > 0 && (
        <div className="p-3 rounded-md border bg-green-50 dark:bg-green-950/30 text-sm space-y-1">
          <p className="font-semibold mb-2 text-green-800 dark:text-green-200">
            💰 Price Preview (1 {item.item_type === 'hotel' ? 'night' : 'unit'})
          </p>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base Rate:</span>
            <span className="font-mono">{formatCurrency(formData.base_rate, formData.currency)}</span>
          </div>
          {item.item_type === 'hotel' && (() => {
            const boardCost = calculateBoardCost()
            if (boardCost > 0) {
              return (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {formData.rate_details?.board_type && BOARD_TYPE_LABELS[formData.rate_details.board_type]}:
                  </span>
                  <span className="font-mono">+{formatCurrency(boardCost, formData.currency)}</span>
                </div>
              )
            }
            return null
          })()}
          <div className="border-t pt-2 mt-2 flex justify-between font-bold text-green-700 dark:text-green-300">
            <span>Selling Price ({((formData.markup_percentage || 0) * 100).toFixed(0)}% markup):</span>
            <span className="font-mono text-base">
              {formatCurrency(sellingPrice, formData.currency)}
            </span>
          </div>
        </div>
      )}

      {/* Rate-Level Dynamic Charges (Optional - Compact) */}
      <div className="border rounded-lg p-3 bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <div>
            <Label className="text-sm font-medium">Custom Charges for This Rate</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Override contract charges (advanced)
            </p>
          </div>
          <Switch
            checked={useCustomCharges}
            onCheckedChange={(checked) => {
              setUseCustomCharges(checked)
              if (!checked) {
                setFormData(prev => ({ ...prev, dynamic_charges: [] }))
              }
            }}
          />
        </div>

        {useCustomCharges && (
          <div className="mt-3 pt-3 border-t">
            <DynamicChargesManager
              charges={formData.dynamic_charges || []}
              onChange={(charges) => setFormData(prev => ({ ...prev, dynamic_charges: charges }))}
              title=""
              description=""
              compact={true}
            />
          </div>
        )}
      </div>

      {/* NEW FEATURES FOR SMALL-MID TOUR OPERATORS */}
      
      {/* Time-Based Scheduling */}
      {(item.item_type === 'activity' || item.item_type === 'meal' || item.item_type === 'ticket' || item.item_type === 'experience') && (
        <div className="border-t pt-4">
          <TimeSlotManager
            scheduleConfig={formData.rate_details?.schedule_config || {
              has_time_slots: false,
              time_slots: []
            }}
            onChange={(scheduleConfig) => {
              setFormData(prev => ({
                ...prev,
                rate_details: {
                  ...prev.rate_details,
                  schedule_config: scheduleConfig
                }
              }))
            }}
            compact={true}
          />
        </div>
      )}

      {/* Group Size Pricing */}
      <div className="border-t pt-4">
        <GroupPricingManager
          groupPricing={formData.rate_details?.group_pricing || {
            has_group_pricing: false,
            pricing_tiers: [],
            pricing_mode: 'per_person'
          }}
          onChange={(groupPricing) => {
            setFormData(prev => ({
              ...prev,
              rate_details: {
                ...prev.rate_details,
                group_pricing: groupPricing
              }
            }))
          }}
          compact={true}
        />
      </div>

      {/* Pool Status (Capacity now managed at pool level) */}
      <div className="border-t pt-4">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Pool Status</h4>
          <p className="text-sm text-muted-foreground">
            Capacity is now managed at the pool level. Select an allocation pool above to link this rate to a pool.
          </p>
          {formData.allocation_pool_id && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <PoolStatusIndicator 
                poolId={formData.allocation_pool_id}
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          {existingRate ? 'Update' : 'Create'} Rate
        </Button>
      </div>
    </div>
  )
}

