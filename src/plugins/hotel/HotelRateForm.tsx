import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  HotelBoardType, 
  OccupancyType 
} from './hotel-types'
import { InventoryItem, recordToDaySelection, daySelectionToRecord } from '@/types/unified-inventory'
import { DayOfWeekSelector } from '@/components/ui/day-of-week-selector'

interface HotelRateFormProps {
  item: InventoryItem
  contracts: Array<{ 
    id: number; 
    contract_name: string; 
    supplier_id: number;
    supplierName: string;
    valid_from: string;
    valid_to: string;
    markup_percentage: number;
    days_of_week: number[];
  }>
  rate?: {
    id?: number
    contract_id?: number
    category_id: string
    base_rate: number
    markup_percentage: number
    selling_price: number
    occupancy_type: OccupancyType
    board_type: HotelBoardType
    allocation_pool_id?: string
    valid_from: string
    valid_to: string
    days_of_week: Record<string, boolean>
    active: boolean
  }
  onSave: (rateData: any) => void
  onCancel: () => void
}

export function HotelRateForm({
  item,
  contracts,
  rate,
  onSave,
  onCancel
}: HotelRateFormProps) {
  // Form state
  const [formData, setFormData] = useState({
    contract_id: rate?.contract_id || 0,
    category_id: rate?.category_id || '',
    base_rate: rate?.base_rate || 0,
    markup_percentage: rate?.markup_percentage || 0.60,
    selling_price: rate?.selling_price || 0,
    occupancy_type: rate?.occupancy_type || 'double',
    board_type: rate?.board_type || 'bb',
    allocation_pool_id: rate?.allocation_pool_id || '',
    valid_from: rate?.valid_from || '',
    valid_to: rate?.valid_to || '',
    days_of_week: rate?.days_of_week || { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
    active: rate?.active ?? true,
  })

  // Board types
  const BOARD_TYPES: HotelBoardType[] = ['bb', 'hb', 'fb', 'ai']
  const BOARD_LABELS: Record<HotelBoardType, string> = {
    bb: 'Bed & Breakfast',
    hb: 'Half Board',
    fb: 'Full Board',
    ai: 'All Inclusive'
  }

  // Occupancy types
  const OCCUPANCY_TYPES: OccupancyType[] = ['single', 'double', 'triple', 'quad']
  const OCCUPANCY_LABELS: Record<OccupancyType, string> = {
    single: 'Single',
    double: 'Double',
    triple: 'Triple',
    quad: 'Quad'
  }

  // Calculate selling price when base rate or markup changes
  const calculateSellingPrice = (baseRate: number, markup: number) => {
    return baseRate * (1 + markup)
  }

  const handleBaseRateChange = (value: number) => {
    const sellingPrice = calculateSellingPrice(value, formData.markup_percentage)
    setFormData({
      ...formData,
      base_rate: value,
      selling_price: sellingPrice
    })
  }

  const handleMarkupChange = (value: number) => {
    const sellingPrice = calculateSellingPrice(formData.base_rate, value)
    setFormData({
      ...formData,
      markup_percentage: value,
      selling_price: sellingPrice
    })
  }

  const handleSave = () => {
    if (!formData.category_id || !formData.contract_id || formData.base_rate <= 0) {
      return
    }

    // Ensure selling price is calculated
    const finalSellingPrice = calculateSellingPrice(formData.base_rate, formData.markup_percentage)
    
    const rateData = {
      ...formData,
      selling_price: finalSellingPrice,
      item_id: item.id,
      itemName: item.name,
      item_type: 'hotel' as const,
      categoryName: item.categories.find(cat => cat.id === formData.category_id)?.category_name || '',
      supplier_id: contracts.find(c => c.id === formData.contract_id)?.supplier_id || 0,
      supplierName: contracts.find(c => c.id === formData.contract_id)?.supplierName || '',
      tour_ids: [],
      tourNames: [],
      
      // Hotel-specific rate details
      rate_details: {
        room_type: item.categories.find(cat => cat.id === formData.category_id)?.category_name || '',
        occupancy_type: formData.occupancy_type,
        board_type: formData.board_type,
        pricing_unit: 'per_room_per_night',
        capacity_info: {
          min_occupancy: getMinOccupancy(formData.occupancy_type),
          max_occupancy: getMaxOccupancy(formData.occupancy_type)
        }
      }
    }

    onSave(rateData)
  }

  const getMinOccupancy = (occupancyType: OccupancyType): number => {
    switch (occupancyType) {
      case 'single': return 1
      case 'double': return 2
      case 'triple': return 3
      case 'quad': return 4
      default: return 1
    }
  }

  const getMaxOccupancy = (occupancyType: OccupancyType): number => {
    switch (occupancyType) {
      case 'single': return 1
      case 'double': return 2
      case 'triple': return 3
      case 'quad': return 4
      default: return 2
    }
  }

  const selectedContract = contracts.find(c => c.id === formData.contract_id)

  return (
    <div className="space-y-6">
      {/* Contract Selection */}
      <div className="grid gap-4">
        <div>
          <Label htmlFor="contract">Contract *</Label>
          <Select value={formData.contract_id.toString()} onValueChange={(value) => setFormData({ ...formData, contract_id: parseInt(value) })}>
            <SelectTrigger>
              <SelectValue placeholder="Select contract" />
            </SelectTrigger>
            <SelectContent>
              {contracts.map(contract => (
                <SelectItem key={contract.id} value={contract.id.toString()}>
                  {contract.contract_name} - {contract.supplierName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedContract && (
            <p className="text-xs text-muted-foreground mt-1">
              Valid: {selectedContract.valid_from} to {selectedContract.valid_to} • 
              Markup: {((selectedContract.markup_percentage || 0) * 100).toFixed(0)}%
            </p>
          )}
        </div>
      </div>

      {/* Room Type Selection */}
      <div className="grid gap-4">
        <div>
          <Label htmlFor="room_type">Room Type *</Label>
          <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select room type" />
            </SelectTrigger>
            <SelectContent>
              {item.categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.category_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hotel-Specific Fields */}
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="occupancy">Occupancy Type *</Label>
            <Select value={formData.occupancy_type} onValueChange={(value) => setFormData({ ...formData, occupancy_type: value as OccupancyType })}>
              <SelectTrigger>
                <SelectValue placeholder="Select occupancy" />
              </SelectTrigger>
              <SelectContent>
                {OCCUPANCY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {OCCUPANCY_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="board_type">Board Type *</Label>
            <Select value={formData.board_type} onValueChange={(value) => setFormData({ ...formData, board_type: value as HotelBoardType })}>
              <SelectTrigger>
                <SelectValue placeholder="Select board type" />
              </SelectTrigger>
              <SelectContent>
                {BOARD_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {BOARD_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="grid gap-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="base_rate">Base Rate *</Label>
            <Input
              id="base_rate"
              type="number"
              step="0.01"
              min="0"
              value={formData.base_rate}
              onChange={(e) => handleBaseRateChange(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          
          <div>
            <Label htmlFor="markup">Markup %</Label>
            <Input
              id="markup"
              type="number"
              step="0.01"
              min="0"
              max="5"
              value={formData.markup_percentage}
              onChange={(e) => handleMarkupChange(parseFloat(e.target.value) || 0)}
              placeholder="0.60"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {((formData.markup_percentage || 0) * 100).toFixed(0)}% markup
            </p>
          </div>
          
          <div>
            <Label htmlFor="selling_price">Selling Price</Label>
            <Input
              id="selling_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.selling_price}
              onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Auto-calculated from base rate + markup
            </p>
          </div>
        </div>
      </div>

      {/* Allocation Pool */}
      <div className="grid gap-4">
        <div>
          <Label htmlFor="allocation_pool">Allocation Pool ID (optional)</Label>
          <Input
            id="allocation_pool"
            type="text"
            value={formData.allocation_pool_id}
            onChange={(e) => setFormData({ ...formData, allocation_pool_id: e.target.value })}
            placeholder="e.g., POOL-001"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Link this rate to a shared inventory pool
          </p>
        </div>
      </div>

      {/* Dates and Validity */}
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="valid_from">Valid From *</Label>
            <Input
              id="valid_from"
              type="date"
              value={formData.valid_from}
              onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="valid_to">Valid To *</Label>
            <Input
              id="valid_to"
              type="date"
              value={formData.valid_to}
              onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
            />
          </div>
        </div>
        
        <div>
          <Label>Valid Days</Label>
          <DayOfWeekSelector
            value={recordToDaySelection(formData.days_of_week)}
            onChange={(days) => setFormData({ ...formData, days_of_week: daySelectionToRecord(days) })}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData({ ...formData, active: checked as boolean })}
          />
          <Label htmlFor="active">Active Rate</Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {rate?.id ? 'Update Rate' : 'Create Rate'}
        </Button>
      </div>
    </div>
  )
}
