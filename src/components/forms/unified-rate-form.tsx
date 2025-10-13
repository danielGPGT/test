// 🎯 UNIFIED RATE FORM - Proof of Concept
// This component replaces both hotel rate form and service rate form
// It adapts based on the inventory item type

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type {
  InventoryItem,
  UnifiedContract,
  UnifiedRate,
  OccupancyType,
  BoardType,
  ServiceDirection,
} from '@/types/unified-inventory'
import {
  BOARD_TYPE_LABELS,
  DIRECTION_LABELS,
  hasHotelCosts,
} from '@/types/unified-inventory'

interface UnifiedRateFormProps {
  item: InventoryItem
  contract?: UnifiedContract
  tours: any[]
  existingRate?: UnifiedRate
  allocations?: Array<{ id: number; item_id: number; allocation_pool_id: string; active: boolean }> // Add allocations prop
  onSave: (rateData: Partial<UnifiedRate>) => void
  onCancel: () => void
}

export function UnifiedRateForm({
  item,
  contract,
  tours,
  existingRate,
  allocations = [],
  onSave,
  onCancel
}: UnifiedRateFormProps) {
  // Form state
  const [formData, setFormData] = useState<Partial<UnifiedRate>>({
    item_id: item.id,
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
    active: true,
    inactive_reason: '',
    
    // Polymorphic details
    rate_details: {
      // Hotel-specific (will be populated if hotel)
      occupancy_type: undefined,
      board_type: undefined,
      board_cost: 0,
      board_included: true,
      
      // Service-specific (will be populated if service)
      direction: undefined,
      paired_rate_id: undefined,
      pricing_unit: undefined,
    },
    
    // Cost overrides
    cost_overrides: {
      override_costs: false,
      tax_rate: 0,
      city_tax_per_person_per_night: 0,
      resort_fee_per_night: 0,
      supplier_commission_rate: 0,
    }
  })

  // Load existing rate data
  useEffect(() => {
    if (existingRate) {
      setFormData(existingRate)
    }
  }, [existingRate])

  // Get available pool IDs from allocations for this item
  const availablePools = useMemo(() => {
    if (!item) return []
    
    // Get all allocations for this item
    const itemAllocations = allocations.filter(a => a.item_id === item.id && a.active)
    
    // Extract unique pool IDs from allocations
    const poolIds = [...new Set(itemAllocations.map(a => a.allocation_pool_id).filter(Boolean))]
    
    return poolIds
  }, [item, allocations])

  // Handle form changes
  const updateField = (field: keyof UnifiedRate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateRateDetail = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      rate_details: {
        ...prev.rate_details,
        [field]: value
      }
    }))
  }


  // Calculate board cost (for hotels)
  const calculateBoardCost = (): number => {
    if (item.item_type !== 'hotel') return 0
    
    const occupancy = formData.rate_details?.occupancy_type
    const boardType = formData.rate_details?.board_type
    
    if (!occupancy || !boardType) return 0
    
    const peoplePerRoom = occupancy === 'single' ? 1 : occupancy === 'double' ? 2 : occupancy === 'triple' ? 3 : 4
    
    // If buy-to-order, use manually entered board cost
    if (!contract) {
      return (formData.rate_details?.board_cost || 0) * peoplePerRoom
    }
    
    // If contract with overrides, use override cost
    if (formData.cost_overrides?.override_costs && formData.rate_details?.board_cost) {
      return formData.rate_details.board_cost
    }
    
    // Get from contract board options
    const boardOption = contract.hotel_costs?.board_options?.find(
      o => o.board_type === boardType
    )
    
    return boardOption ? boardOption.additional_cost * peoplePerRoom : 0
  }

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.category_id) {
      alert('Please select a category')
      return false
    }
    
    if (!formData.base_rate || formData.base_rate <= 0) {
      alert('Please enter a valid base rate')
      return false
    }
    
    // Hotel-specific validation
    if (item.item_type === 'hotel') {
      if (!formData.rate_details?.occupancy_type) {
        alert('Please select occupancy type')
        return false
      }
      if (!formData.rate_details?.board_type) {
        alert('Please select board type')
        return false
      }
    }
    
    // Service-specific validation
    if (['ticket', 'transfer', 'activity', 'meal', 'venue', 'transport', 'experience', 'other'].includes(item.item_type)) {
      const category = item.categories.find(c => c.id === formData.category_id)
      if (category?.pricing_behavior.directional && !formData.rate_details?.direction) {
        alert('Please select direction for this service')
        return false
      }
    }
    
    // Buy-to-order validation
    if (!contract) {
      if (!formData.valid_from || !formData.valid_to) {
        alert('Buy-to-order rates require validity dates')
        return false
      }
      if (item.item_type === 'hotel' && (!formData.min_nights || !formData.max_nights)) {
        alert('Buy-to-order rates require min/max nights')
        return false
      }
    }
    
    return true
  }

  const handleSubmit = () => {
    if (!validateForm()) return
    
    // Calculate selling price
    
    // Build rate data
    const rateData: Partial<UnifiedRate> = {
      ...formData,
      item_type: item.item_type,
      contract_id: contract?.id,
      selling_price: formData.base_rate! * (1 + formData.markup_percentage!),
      estimated_costs: !contract,
    }
    
    onSave(rateData)
  }

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="p-3 bg-muted/30 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {contract 
                ? `${contract.contract_name} • ${contract.currency}`
                : `${item.name} • Buy-to-Order (Estimated Costs)`
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
                {category.capacity_info.max_pax && ` (Max: ${category.capacity_info.max_pax} pax)`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* HOTEL-SPECIFIC FIELDS */}
      {item.item_type === 'hotel' && (
        <>
          {/* Occupancy Type */}
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

          {/* Board Type */}
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
                {contract && hasHotelCosts(contract) ? (
                  contract.hotel_costs.board_options?.map(option => (
                    <SelectItem key={option.board_type} value={option.board_type}>
                      {BOARD_TYPE_LABELS[option.board_type]}
                      {option.additional_cost > 0 && ` (+${formatCurrency(option.additional_cost)}/person)`}
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
              <p className="text-xs text-muted-foreground">
                Cost per person for {formData.rate_details?.board_type ? BOARD_TYPE_LABELS[formData.rate_details.board_type] : 'meals'}
              </p>
            </div>
          )}
        </>
      )}

      {/* SERVICE-SPECIFIC FIELDS */}
      {['ticket', 'transfer', 'activity', 'meal', 'venue', 'transport', 'experience', 'other'].includes(item.item_type) && (() => {
        const selectedCategory = item.categories.find(c => c.id === formData.category_id)
        const isDirectional = selectedCategory?.pricing_behavior.directional
        
        return (
          <>
            {/* Direction (for directional services like transfers) */}
            {isDirectional && (
              <div className="grid gap-2">
                <Label>Direction *</Label>
                <Select
                  value={formData.rate_details?.direction}
                  onValueChange={(value: ServiceDirection) => updateRateDetail('direction', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategory?.pricing_behavior.directions?.map(dir => (
                      <SelectItem key={dir} value={dir}>
                        {DIRECTION_LABELS[dir]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select the direction for this service
                </p>
              </div>
            )}
            
            {/* Pricing Unit Display */}
            <div className="p-3 bg-muted/30 rounded-md">
              <p className="text-sm font-medium">Pricing Unit</p>
              <p className="text-xs text-muted-foreground">
                This service is priced: <strong>{selectedCategory?.pricing_behavior.pricing_mode}</strong>
              </p>
            </div>
          </>
        )
      })()}

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
              {availablePools.map((poolId: string, idx: number) => (
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
            placeholder="e.g., dec-2025-double-pool"
          />
        )}
        
        {formData.allocation_pool_id && (
          <p className="text-xs text-green-600">
            ✓ This rate will share inventory with other rates in pool: <strong>{formData.allocation_pool_id}</strong>
          </p>
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
          />
        )}
      </div>

      {/* Validity Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            Valid From
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
            Valid To
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

      {/* Min/Max Nights (Hotels and relevant services) */}
      {(item.item_type === 'hotel' || formData.min_nights !== undefined) && (
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
      )}

      {/* Base Rate */}
      <div className="grid gap-2">
        <Label>Base Rate per {item.item_type === 'hotel' ? 'Night' : 'Unit'} ({formData.currency}) *</Label>
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
          value={formData.markup_percentage! * 100}
          onChange={(e) => updateField('markup_percentage', (parseFloat(e.target.value) || 0) / 100)}
          placeholder="60"
        />
      </div>

      {/* Cost Preview (for hotels) */}
      {item.item_type === 'hotel' && formData.base_rate && formData.base_rate > 0 && (
        <div className="p-3 rounded-md border bg-muted/30 text-sm space-y-1">
          <p className="font-semibold mb-2">Cost Preview (1 night)</p>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base Room Rate:</span>
            <span>{formatCurrency(formData.base_rate)}</span>
          </div>
          {(() => {
            const boardCost = calculateBoardCost()
            if (boardCost > 0) {
              return (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {formData.rate_details?.board_type && BOARD_TYPE_LABELS[formData.rate_details.board_type]}:
                  </span>
                  <span>+{formatCurrency(boardCost)}</span>
                </div>
              )
            }
            return null
          })()}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Selling Price ({(formData.markup_percentage! * 100).toFixed(0)}% markup):</span>
            <span className="text-green-600">
              {formatCurrency((formData.base_rate + calculateBoardCost()) * (1 + formData.markup_percentage!))}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          {existingRate ? 'Update Rate' : 'Create Rate'}
        </Button>
      </div>
    </div>
  )
}

