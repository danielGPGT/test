import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Bed, 
  Package, 
  Plus, 
  Trash2,
  Percent,
  Receipt
} from 'lucide-react'
import { 
  HotelContractMeta, 
  HotelRoomAllocation, 
  OccupancyRate,
  OccupancyType
} from './hotel-types'
import { InventoryItem, recordToDaySelection, daySelectionToRecord } from '@/types/unified-inventory'
import { DayOfWeekSelector } from '@/components/ui/day-of-week-selector'

interface HotelContractFormProps {
  item: InventoryItem
  suppliers: Array<{ id: number; name: string }>
  tours?: Array<{ id: number; name: string }>
  contract?: {
    id?: number
    contract_name: string
    supplier_id: number
    tour_ids?: number[]
    valid_from: string
    valid_to: string
    markup_percentage: number
    description?: string
    days_of_week?: Record<string, boolean>
    // Comprehensive hotel contract fields
    total_rooms?: number
    base_rate?: number
    currency?: string
    tax_rate?: number
    city_tax_per_person_per_night?: number
    resort_fee_per_night?: number
    supplier_commission_rate?: number
    min_nights?: number
    max_nights?: number
    contracted_payment_total?: number
    notes?: string
    hotel_meta?: HotelContractMeta
  }
  onSave: (contractData: any) => void
  onCancel: () => void
  onCreateAllocations?: (contractId: number, allocations: HotelRoomAllocation[]) => void
}

export function HotelContractForm({
  item,
  suppliers,
  contract,
  onSave,
  onCancel,
  onCreateAllocations
}: HotelContractFormProps) {
  // Core contract form state
  const [formData, setFormData] = useState({
    contract_name: contract?.contract_name || '',
    supplier_id: contract?.supplier_id || 0,
    tour_ids: contract?.tour_ids || [],
    valid_from: contract?.valid_from || '',
    valid_to: contract?.valid_to || '',
    markup_percentage: contract?.markup_percentage || 0.60,
    description: contract?.description || '',
    days_of_week: contract?.days_of_week || { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
    // Comprehensive hotel fields
    total_rooms: contract?.total_rooms || 0,
    base_rate: contract?.base_rate || 0,
    currency: contract?.currency || 'EUR',
    tax_rate: contract?.tax_rate || 0,
    city_tax_per_person_per_night: contract?.city_tax_per_person_per_night || 0,
    resort_fee_per_night: contract?.resort_fee_per_night || 0,
    supplier_commission_rate: contract?.supplier_commission_rate || 0,
    min_nights: contract?.min_nights || 1,
    max_nights: contract?.max_nights || 30,
    contracted_payment_total: contract?.contracted_payment_total || 0,
    notes: contract?.notes || '',
  })

  // Hotel-specific state
  const [roomAllocations, setRoomAllocations] = useState<HotelRoomAllocation[]>(
    contract?.hotel_meta?.room_allocations || []
  )
  
  const [allocationForm, setAllocationForm] = useState({
    room_group_ids: [] as string[],
    quantity: 1,
    base_rate: 0,
    label: '',
    allocation_pool_id: '',
    occupancy_rates: [] as OccupancyRate[],
  })

  const [selectedOccupancy, setSelectedOccupancy] = useState<OccupancyType>('double')
  const [occupancyRate, setOccupancyRate] = useState(0)

  // Board types for this contract (not used in this form, but available for reference)
  // const BOARD_TYPES: HotelBoardType[] = ['bb', 'hb', 'fb', 'ai']
  // const BOARD_LABELS: Record<HotelBoardType, string> = {
  //   bb: 'Bed & Breakfast',
  //   hb: 'Half Board',
  //   fb: 'Full Board',
  //   ai: 'All Inclusive'
  // }

  // Occupancy types
  const OCCUPANCY_TYPES: OccupancyType[] = ['single', 'double', 'triple', 'quad']
  const OCCUPANCY_LABELS: Record<OccupancyType, string> = {
    single: 'Single',
    double: 'Double',
    triple: 'Triple',
    quad: 'Quad'
  }

  const addRoomAllocation = () => {
    if (allocationForm.room_group_ids.length === 0 || allocationForm.quantity <= 0) {
      return
    }

    const newAllocation: HotelRoomAllocation = {
      room_group_ids: [...allocationForm.room_group_ids],
      quantity: allocationForm.quantity,
      label: allocationForm.label || undefined,
      allocation_pool_id: allocationForm.allocation_pool_id || undefined,
      occupancy_rates: allocationForm.occupancy_rates.length > 0 ? [...allocationForm.occupancy_rates] : undefined,
    }

    setRoomAllocations([...roomAllocations, newAllocation])
    
    // Reset form
    setAllocationForm({
      room_group_ids: [],
      quantity: 1,
      base_rate: 0,
      label: '',
      allocation_pool_id: '',
      occupancy_rates: [],
    })
  }

  const removeRoomAllocation = (index: number) => {
    setRoomAllocations(roomAllocations.filter((_, i) => i !== index))
  }

  const addOccupancyRate = () => {
    if (selectedOccupancy && occupancyRate > 0) {
      const newRate: OccupancyRate = {
        occupancy_type: selectedOccupancy,
        rate: occupancyRate
      }
      
      setAllocationForm({
        ...allocationForm,
        occupancy_rates: [...allocationForm.occupancy_rates, newRate]
      })
      
      setOccupancyRate(0)
    }
  }

  const removeOccupancyRate = (index: number) => {
    setAllocationForm({
      ...allocationForm,
      occupancy_rates: allocationForm.occupancy_rates.filter((_, i) => i !== index)
    })
  }

  const handleSave = () => {
    if (!formData.contract_name || !formData.supplier_id) {
      return
    }

    const contractData = {
      ...formData,
      hotel_meta: {
        room_allocations: roomAllocations,
      }
    }

    onSave(contractData)
  }

  const handleGenerateAllocations = () => {
    if (onCreateAllocations && roomAllocations.length > 0) {
      // This would be called after contract is saved
      // For now, we'll pass the allocations data
      onCreateAllocations(0, roomAllocations) // contractId will be set after save
    }
  }

  return (
    <div className="space-y-6">
      {/* Core Contract Fields */}
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contract_name">Contract Name *</Label>
            <Input
              id="contract_name"
              value={formData.contract_name}
              onChange={(e) => setFormData({ ...formData, contract_name: e.target.value })}
              placeholder="e.g., Summer 2024 Contract"
            />
          </div>
          <div>
            <Label htmlFor="supplier">Supplier *</Label>
            <Select value={formData.supplier_id.toString()} onValueChange={(value) => setFormData({ ...formData, supplier_id: parseInt(value) })}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="markup">Markup Percentage</Label>
            <Input
              id="markup"
              type="number"
              step="0.01"
              min="0"
              max="5"
              value={formData.markup_percentage}
              onChange={(e) => setFormData({ ...formData, markup_percentage: parseFloat(e.target.value) })}
              placeholder="0.60"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {((formData.markup_percentage || 0) * 100).toFixed(0)}% markup
            </p>
          </div>
          <div>
            <Label>Valid Days</Label>
            <DayOfWeekSelector
              value={recordToDaySelection(formData.days_of_week)}
              onChange={(days) => setFormData({ ...formData, days_of_week: daySelectionToRecord(days) })}
            />
          </div>
        </div>
      </div>

      {/* Comprehensive Hotel Contract Sections */}
      <Accordion type="multiple" defaultValue={["allocations", "markup", "taxes"]} className="w-full">
        <AccordionItem value="allocations">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4" />
              Room Allocations
              {roomAllocations.length > 0 && (
                <Badge variant="secondary" className="ml-2">{roomAllocations.length}</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground">
                Allocate specific quantities per room type (replaces Stock/Allotments)
              </p>
              
              {/* Existing Allocations */}
              {roomAllocations.length > 0 && (
                <div className="space-y-2">
                  {roomAllocations.map((allocation, index) => {
                    const roomGroups = allocation.room_group_ids.map(id => 
                      item.categories.find(cat => cat.id === id)
                    ).filter(Boolean)
                    
                    return (
                      <div key={index} className="p-3 bg-muted rounded-md border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {allocation.label && (
                              <Badge variant="default" className="text-xs">{allocation.label}</Badge>
                            )}
                            {allocation.allocation_pool_id && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                Pool: {allocation.allocation_pool_id}
                              </Badge>
                            )}
                            {roomGroups.map((rg, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {rg?.category_name}
                              </Badge>
                            ))}
                            <span className="text-sm font-medium">{allocation.quantity} rooms (shared)</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRoomAllocation(index)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                        
                        {/* Occupancy Rates */}
                        {allocation.occupancy_rates && allocation.occupancy_rates.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Occupancy Rates:</p>
                            <div className="flex flex-wrap gap-1">
                              {allocation.occupancy_rates.map((rate, rateIdx) => (
                                <Badge key={rateIdx} variant="outline" className="text-xs">
                                  {OCCUPANCY_LABELS[rate.occupancy_type as OccupancyType]}: ${rate.rate}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              
              {/* Add New Allocation Form */}
              <div className="p-3 bg-background rounded-md border border-dashed space-y-3">
                <p className="text-sm font-medium">Add Room Allocation</p>
                
                {/* Room Type Selection */}
                <div className="space-y-2">
                  <Label className="text-xs">Room Types (select one or more for shared pool)</Label>
                  <div className="flex flex-wrap gap-2">
                    {item.categories.map((category) => {
                      const alreadyUsed = roomAllocations.some(a => 
                        a.room_group_ids.includes(category.id)
                      )
                      const isSelected = allocationForm.room_group_ids.includes(category.id)
                      
                      return (
                        <div key={category.id} className="flex items-center gap-1.5">
                          <Checkbox
                            id={`room-type-${category.id}`}
                            checked={isSelected}
                            disabled={alreadyUsed}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAllocationForm({
                                  ...allocationForm,
                                  room_group_ids: [...allocationForm.room_group_ids, category.id]
                                })
                              } else {
                                setAllocationForm({
                                  ...allocationForm,
                                  room_group_ids: allocationForm.room_group_ids.filter(id => id !== category.id)
                                })
                              }
                            }}
                          />
                          <label
                            htmlFor={`room-type-${category.id}`}
                            className={`text-xs cursor-pointer ${alreadyUsed ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {category.category_name}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Allocation Details */}
                <div className="grid gap-3 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Label (optional)</Label>
                      <Input
                        type="text"
                        placeholder="e.g., Run of House"
                        value={allocationForm.label}
                        onChange={(e) => setAllocationForm({ ...allocationForm, label: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Pool ID (optional)</Label>
                      <Input
                        type="text"
                        placeholder="e.g., POOL-001"
                        value={allocationForm.allocation_pool_id}
                        onChange={(e) => setAllocationForm({ ...allocationForm, allocation_pool_id: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Quantity (shared across selected room types)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={allocationForm.quantity}
                      onChange={(e) => setAllocationForm({ ...allocationForm, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  
                  {/* Occupancy Rates */}
                  <div className="space-y-2">
                    <Label className="text-xs">Occupancy Rates (optional)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={selectedOccupancy} onValueChange={(value) => setSelectedOccupancy(value as OccupancyType)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Occupancy" />
                        </SelectTrigger>
                        <SelectContent>
                          {OCCUPANCY_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {OCCUPANCY_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Rate"
                        value={occupancyRate}
                        onChange={(e) => setOccupancyRate(parseFloat(e.target.value) || 0)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOccupancyRate}
                        disabled={!selectedOccupancy || occupancyRate <= 0}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {allocationForm.occupancy_rates.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {allocationForm.occupancy_rates.map((rate, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs flex items-center gap-1">
                            {OCCUPANCY_LABELS[rate.occupancy_type as OccupancyType]}: ${rate.rate}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-3 w-3 p-0"
                              onClick={() => removeOccupancyRate(idx)}
                            >
                              <Trash2 className="h-2 w-2" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRoomAllocation}
                  disabled={allocationForm.room_group_ids.length === 0 || allocationForm.quantity <= 0}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room Allocation
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Markup Settings Section */}
        <AccordionItem value="markup">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Markup Settings
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground">
                Set default markup percentages for rates created from this contract
              </p>
              
              <div className="grid gap-2">
                <Label>Regular Nights Markup (%)</Label>
                <Input
                  type="number"
                  step="1"
                  value={(formData.markup_percentage || 0.60) * 100}
                  onChange={(e) => setFormData({ ...formData, markup_percentage: (parseFloat(e.target.value) || 60) / 100 })}
                  placeholder="60"
                />
                <p className="text-xs text-muted-foreground">
                  Default: 60% (applied to rates auto-created from this contract)
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Taxes & Fees Section */}
        <AccordionItem value="taxes">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Taxes & Fees
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="grid gap-2">
                <Label htmlFor="tax_rate">VAT/Sales Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 10 for 10%"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city_tax">City Tax (per person per night)</Label>
                <Input
                  id="city_tax"
                  type="number"
                  step="0.01"
                  value={formData.city_tax_per_person_per_night}
                  onChange={(e) => setFormData({ ...formData, city_tax_per_person_per_night: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 2.50"
                />
                <p className="text-xs text-muted-foreground">
                  Mandatory government tax charged per guest per night
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="resort_fee">Resort/Facility Fee (per room per night)</Label>
                <Input
                  id="resort_fee"
                  type="number"
                  step="0.01"
                  value={formData.resort_fee_per_night}
                  onChange={(e) => setFormData({ ...formData, resort_fee_per_night: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 5.00"
                />
                <p className="text-xs text-muted-foreground">
                  Additional hotel charges (pool, gym, etc.)
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier_commission">Supplier Commission / Discount (%)</Label>
                <Input
                  id="supplier_commission"
                  type="number"
                  step="0.01"
                  value={formData.supplier_commission_rate}
                  onChange={(e) => setFormData({ ...formData, supplier_commission_rate: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 15 for 15%"
                />
                <p className="text-xs text-muted-foreground">
                  Commission/discount you receive from hotel (reduces your cost)
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Additional Contract Details */}
        <AccordionItem value="details">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Contract Details
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_rooms">Total Rooms</Label>
                  <Input
                    id="total_rooms"
                    type="number"
                    value={formData.total_rooms}
                    onChange={(e) => setFormData({ ...formData, total_rooms: parseInt(e.target.value) || 0 })}
                    placeholder="e.g., 100"
                  />
                </div>
                <div>
                  <Label htmlFor="base_rate">Base Rate</Label>
                  <Input
                    id="base_rate"
                    type="number"
                    step="0.01"
                    value={formData.base_rate}
                    onChange={(e) => setFormData({ ...formData, base_rate: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 150.00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="HUF">HUF (Ft)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="min_nights">Min Nights</Label>
                  <Input
                    id="min_nights"
                    type="number"
                    value={formData.min_nights}
                    onChange={(e) => setFormData({ ...formData, min_nights: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="max_nights">Max Nights</Label>
                  <Input
                    id="max_nights"
                    type="number"
                    value={formData.max_nights}
                    onChange={(e) => setFormData({ ...formData, max_nights: parseInt(e.target.value) || 30 })}
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contracted_payment">Contracted Payment Total</Label>
                <Input
                  id="contracted_payment"
                  type="number"
                  step="0.01"
                  value={formData.contracted_payment_total}
                  onChange={(e) => setFormData({ ...formData, contracted_payment_total: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 50000.00"
                />
                <p className="text-xs text-muted-foreground">
                  Total amount to be paid to hotel for this contract
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Contract Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes, special terms, etc."
                  rows={3}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {contract?.id ? 'Update Contract' : 'Create Contract'}
        </Button>
        {onCreateAllocations && roomAllocations.length > 0 && (
          <Button 
            variant="secondary" 
            onClick={handleGenerateAllocations}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Package className="h-4 w-4 mr-2" />
            Generate Allocations
          </Button>
        )}
      </div>
    </div>
  )
}
