import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { AlertTriangle, Ban, Receipt, Coffee, DollarSign as DollarIcon, Trash2, Bed, Percent } from 'lucide-react'
import { BoardType, BoardOption, AttritionStage, CancellationStage, PaymentSchedule, RoomAllocation, RoomGroup, OccupancyRate } from '@/contexts/data-context'
import { BOARD_TYPE_LABELS } from '@/lib/pricing'
import { toast } from 'sonner'

interface ContractFormProps {
  formData: {
    supplier_id: number
    hotel_id: number
    contract_name: string
    start_date: string
    end_date: string
    total_rooms: number
    base_rate: number
    currency: string
    tour_ids?: number[]
    room_allocations?: RoomAllocation[]
    pricing_strategy?: 'per_occupancy' | 'flat_rate'
    occupancy_rates?: OccupancyRate[]
    markup_percentage?: number
    days_of_week?: { mon: boolean; tue: boolean; wed: boolean; thu: boolean; fri: boolean; sat: boolean; sun: boolean }
    min_nights?: number
    max_nights?: number
    tax_rate: number
    city_tax_per_person_per_night: number
    resort_fee_per_night: number
    supplier_commission_rate: number
    board_options: BoardOption[]
    attrition_stages: AttritionStage[]
    cancellation_stages: CancellationStage[]
    contracted_payment_total: number
    payment_schedule: PaymentSchedule[]
    notes: string
  }
  setFormData: (data: any) => void
  hotels: any[]
  suppliers: any[]
  tours: any[]
  selectedHotel?: any
  boardTypeInput: BoardType
  setBoardTypeInput: (value: BoardType) => void
  boardCostInput: string
  setBoardCostInput: (value: string) => void
  attritionDateInput: string
  setAttritionDateInput: (value: string) => void
  attritionPercentInput: string
  setAttritionPercentInput: (value: string) => void
  cancellationDateInput: string
  setCancellationDateInput: (value: string) => void
  cancellationPenaltyInput: string
  setCancellationPenaltyInput: (value: string) => void
  cancellationDescInput: string
  setCancellationDescInput: (value: string) => void
  paymentDateInput: string
  setPaymentDateInput: (value: string) => void
  paymentAmountInput: string
  setPaymentAmountInput: (value: string) => void
  isEditing?: boolean
}

export function ContractForm({
  formData,
  setFormData,
  hotels,
  suppliers,
  tours,
  selectedHotel,
  boardTypeInput,
  setBoardTypeInput,
  boardCostInput,
  setBoardCostInput,
  attritionDateInput,
  setAttritionDateInput,
  attritionPercentInput,
  setAttritionPercentInput,
  cancellationDateInput,
  setCancellationDateInput,
  cancellationPenaltyInput,
  setCancellationPenaltyInput,
  cancellationDescInput,
  setCancellationDescInput,
  paymentDateInput,
  setPaymentDateInput,
  paymentAmountInput,
  setPaymentAmountInput,
  isEditing = false
}: ContractFormProps) {
  // State for room allocation form
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([])
  const [allocationLabel, setAllocationLabel] = useState('')
  const [allocationQty, setAllocationQty] = useState('')
  const [allocationPoolId, setAllocationPoolId] = useState('')
  const [allocationSingleRate, setAllocationSingleRate] = useState('')
  const [allocationDoubleRate, setAllocationDoubleRate] = useState('')
  const [allocationTripleRate, setAllocationTripleRate] = useState('')
  const [allocationQuadRate, setAllocationQuadRate] = useState('')
  
  // State for flat rate allocation base rate
  const [allocationBaseRate, setAllocationBaseRate] = useState('')
  
  return (
    <div className="grid gap-4 py-4">
      {!isEditing && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="supplier_id">Supplier *</Label>
            <Select
              value={formData.supplier_id.toString()}
              onValueChange={(value) => setFormData({ ...formData, supplier_id: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.filter(s => s.active).map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name} ({supplier.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="hotel_id">Hotel *</Label>
            <Select
              value={formData.hotel_id.toString()}
              onValueChange={(value) => setFormData({ ...formData, hotel_id: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a hotel" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id.toString()}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="grid gap-2">
        <Label htmlFor="contract_name">Contract Name *</Label>
        <Input
          id="contract_name"
          value={formData.contract_name}
          onChange={(e) => setFormData({ ...formData, contract_name: e.target.value })}
          placeholder="e.g., Summer 2025"
        />
      </div>

      <div className="grid gap-2">
        <Label>Link to Tours (Optional)</Label>
        <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
          {tours.length === 0 ? (
            <div className="text-sm text-muted-foreground">No tours available</div>
          ) : (
            <>
              {tours.map(tour => (
                <div key={tour.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`contract-tour-${tour.id}`}
                    checked={formData.tour_ids?.includes(tour.id) || false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({ 
                          ...formData, 
                          tour_ids: [...(formData.tour_ids || []), tour.id] 
                        })
                      } else {
                        setFormData({ 
                          ...formData, 
                          tour_ids: (formData.tour_ids || []).filter(id => id !== tour.id) 
                        })
                      }
                    }}
                  />
                  <label
                    htmlFor={`contract-tour-${tour.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {tour.name}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({tour.start_date} - {tour.end_date})
                    </span>
                  </label>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                💡 Leave empty to make this contract available for all tours
              </p>
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="start_date">Start Date *</Label>
        <Input
          id="start_date"
          type="date"
          value={formData.start_date}
          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="end_date">End Date *</Label>
        <Input
          id="end_date"
          type="date"
          value={formData.end_date}
          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
        />
      
      </div>

      <div className="grid gap-2">
        <Label htmlFor="total_rooms">Total Rooms</Label>
        <Input
          id="total_rooms"
          type="number"
          value={formData.total_rooms}
          onChange={(e) => setFormData({ ...formData, total_rooms: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="base_rate">Base Nightly Rate (Reference)</Label>
        <Input
          id="base_rate"
          type="number"
          step="0.01"
          value={formData.base_rate}
          onChange={(e) => setFormData({ ...formData, base_rate: parseFloat(e.target.value) || 0 })}
        />

      </div>
      </div>

      <div className="grid gap-2">
        <Label>Occupancy Pricing Strategy *</Label>
        <Select
          value={formData.pricing_strategy || 'per_occupancy'}
          onValueChange={(value: 'per_occupancy' | 'flat_rate') => setFormData({ ...formData, pricing_strategy: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="per_occupancy">Per Occupancy (Different rates for 1p, 2p, 3p)</SelectItem>
            <SelectItem value="flat_rate">Flat Rate (Same rate regardless of occupancy)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {formData.pricing_strategy === 'per_occupancy' 
            ? 'Contract specifies different rates for single/double/triple occupancy'
            : 'Contract has one rate per room regardless of how many people'}
        </p>
      </div>

      {formData.pricing_strategy === 'per_occupancy' && (
        <div className="grid gap-2 p-3 bg-muted/30 rounded-md border">
          <Label>Occupancy Rates</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Enter base room rate for each occupancy type. Leave empty to skip that occupancy.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Single (1p)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 80"
                value={formData.occupancy_rates?.find(r => r.occupancy_type === 'single')?.rate || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  const existing = formData.occupancy_rates || []
                  const filtered = existing.filter(r => r.occupancy_type !== 'single')
                  if (value > 0) {
                    setFormData({ ...formData, occupancy_rates: [...filtered, { occupancy_type: 'single', rate: value }] })
                  } else {
                    setFormData({ ...formData, occupancy_rates: filtered })
                  }
                }}
              />
            </div>
            <div>
              <Label className="text-xs">Double (2p)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 100"
                value={formData.occupancy_rates?.find(r => r.occupancy_type === 'double')?.rate || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  const existing = formData.occupancy_rates || []
                  const filtered = existing.filter(r => r.occupancy_type !== 'double')
                  if (value > 0) {
                    setFormData({ ...formData, occupancy_rates: [...filtered, { occupancy_type: 'double', rate: value }] })
                  } else {
                    setFormData({ ...formData, occupancy_rates: filtered })
                  }
                }}
              />
            </div>
            <div>
              <Label className="text-xs">Triple (3p)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 115"
                value={formData.occupancy_rates?.find(r => r.occupancy_type === 'triple')?.rate || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  const existing = formData.occupancy_rates || []
                  const filtered = existing.filter(r => r.occupancy_type !== 'triple')
                  if (value > 0) {
                    setFormData({ ...formData, occupancy_rates: [...filtered, { occupancy_type: 'triple', rate: value }] })
                  } else {
                    setFormData({ ...formData, occupancy_rates: filtered })
                  }
                }}
              />
            </div>
            <div>
              <Label className="text-xs">Quad (4p)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 130"
                value={formData.occupancy_rates?.find(r => r.occupancy_type === 'quad')?.rate || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  const existing = formData.occupancy_rates || []
                  const filtered = existing.filter(r => r.occupancy_type !== 'quad')
                  if (value > 0) {
                    setFormData({ ...formData, occupancy_rates: [...filtered, { occupancy_type: 'quad', rate: value }] })
                  } else {
                    setFormData({ ...formData, occupancy_rates: filtered })
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="currency">Currency</Label>
        <Select
          value={formData.currency}
          onValueChange={(value) => setFormData({ ...formData, currency: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GBP">GBP</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Accordion type="multiple" defaultValue={["allocations", "markup", "taxes", "board"]} className="w-full">
        {/* Room Allocations Section */}
        <AccordionItem value="allocations">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4" />
              Room Allocations
              {(formData.room_allocations?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-2">{formData.room_allocations?.length}</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground">
                Allocate specific quantities per room type (replaces Stock/Allotments)
              </p>
              
              {(formData.room_allocations || []).length > 0 && (
                <div className="space-y-2">
                  {(formData.room_allocations || []).map((allocation: RoomAllocation, index: number) => {
                    const roomGroups = allocation.room_group_ids.map(id => 
                      selectedHotel?.room_groups?.find((rg: RoomGroup) => rg.id === id)
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
                                {rg?.room_type}
                              </Badge>
                            ))}
                            <span className="text-sm font-medium">{allocation.quantity} rooms (shared)</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newAllocations = [...(formData.room_allocations || [])]
                            newAllocations.splice(index, 1)
                            setFormData({ ...formData, room_allocations: newAllocations })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        </div>
                        
                        {/* Show occupancy rates */}
                        {allocation.occupancy_rates && allocation.occupancy_rates.length > 0 ? (
                          <div className="flex gap-2 flex-wrap text-xs">
                            {allocation.occupancy_rates.map((occRate, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {occRate.occupancy_type}: {occRate.rate} {formData.currency}
                              </Badge>
                            ))}
                          </div>
                        ) : allocation.base_rate !== undefined ? (
                          <div className="text-xs">
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              Base Rate: {allocation.base_rate} {formData.currency}
                            </Badge>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Using contract default rates
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              
              {selectedHotel && selectedHotel.room_groups && selectedHotel.room_groups.length > 0 && (
                <div className="p-3 bg-background rounded-md border border-dashed space-y-3">
                  <p className="text-sm font-medium">Add Room Allocation</p>
                  
                  {/* Multi-room type allocation form */}
                  <div className="space-y-2 p-3 bg-muted/30 rounded-md">
                    <Label className="text-xs">Room Types (select one or more for shared pool)</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedHotel.room_groups.map((rg: RoomGroup) => {
                        const alreadyUsed = formData.room_allocations?.some(a => 
                          a.room_group_ids.includes(rg.id)
                        )
                        const isSelected = selectedRoomTypes.includes(rg.id)
                        
                        return (
                          <div key={rg.id} className="flex items-center gap-1.5">
                            <Checkbox
                              id={`room-type-${rg.id}`}
                              checked={isSelected}
                              disabled={alreadyUsed}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedRoomTypes([...selectedRoomTypes, rg.id])
                                } else {
                                  setSelectedRoomTypes(selectedRoomTypes.filter(id => id !== rg.id))
                                }
                              }}
                            />
                            <label
                              htmlFor={`room-type-${rg.id}`}
                              className={`text-xs cursor-pointer ${alreadyUsed ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {rg.room_type}
                            </label>
                          </div>
                        )
                      })}
                    </div>
                    
                    <div className="grid gap-3 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Label (optional)</Label>
                          <Input
                            type="text"
                            placeholder="e.g., Run of House"
                            value={allocationLabel}
                            onChange={(e) => setAllocationLabel(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Quantity *</Label>
                          <Input
                            type="number"
                            min={1}
                            placeholder="Rooms"
                            value={allocationQty}
                            onChange={(e) => setAllocationQty(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      
                      {/* Allocation Pool ID */}
                      <div className="border-t pt-3">
                        <Label className="text-xs">Allocation Pool ID (for multi-rate periods)</Label>
                        <Input
                          type="text"
                          placeholder="e.g., dec-2025-double-pool"
                          value={allocationPoolId}
                          onChange={(e) => setAllocationPoolId(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Optional: Use same Pool ID across contracts to share inventory (e.g., for shoulder nights)
                        </p>
                      </div>
                      
                      {/* Occupancy Rates (optional overrides) */}
                      {formData.pricing_strategy === 'per_occupancy' && formData.occupancy_rates && formData.occupancy_rates.length > 0 && (
                        <div className="border-t pt-2">
                          <Label className="text-xs mb-2 block">Occupancy Rates (optional - overrides contract defaults)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {formData.occupancy_rates.map((occRate) => {
                              const defaultRate = occRate.rate
                              let value = ''
                              let setValue = (_val: string) => {}
                              
                              switch(occRate.occupancy_type) {
                                case 'single':
                                  value = allocationSingleRate
                                  setValue = setAllocationSingleRate
                                  break
                                case 'double':
                                  value = allocationDoubleRate
                                  setValue = setAllocationDoubleRate
                                  break
                                case 'triple':
                                  value = allocationTripleRate
                                  setValue = setAllocationTripleRate
                                  break
                                case 'quad':
                                  value = allocationQuadRate
                                  setValue = setAllocationQuadRate
                                  break
                              }
                              
                              const label = occRate.occupancy_type === 'single' ? 'Single (1p)' :
                                          occRate.occupancy_type === 'double' ? 'Double (2p)' :
                                          occRate.occupancy_type === 'triple' ? 'Triple (3p)' : 'Quad (4p)'
                              
                              return (
                                <div key={occRate.occupancy_type}>
                                  <Label className="text-[10px] text-muted-foreground">{label}</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    placeholder={`Default: ${defaultRate}`}
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className="h-7 text-xs"
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Flat Rate Base Rate (optional override) */}
                      {formData.pricing_strategy === 'flat_rate' && (
                        <div className="border-t pt-2">
                          <Label className="text-xs mb-2 block">Base Rate (optional - overrides contract default)</Label>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              placeholder={`${formData.base_rate || 0}`}
                              value={allocationBaseRate}
                              onChange={(e) => setAllocationBaseRate(e.target.value)}
                              className="h-8 text-xs"
                            />
                            <div className="text-[9px] text-muted-foreground">
                              💡 Leave empty to use contract default: {formData.base_rate || 0} {formData.currency}/night
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      className="w-full h-8 text-xs"
                      onClick={() => {
                        if (selectedRoomTypes.length === 0) {
                          toast.error('Please select at least one room type')
                          return
                        }
                        
                        const qty = parseInt(allocationQty)
                        if (!qty || qty <= 0) {
                          toast.error('Please enter a valid quantity')
                          return
                        }
                        
                        const label = allocationLabel.trim() || undefined
                        
                        // Build occupancy rates array if any were specified (for per-occupancy strategy)
                        const occupancyRates: OccupancyRate[] = []
                        if (formData.pricing_strategy === 'per_occupancy') {
                          if (allocationSingleRate) {
                            occupancyRates.push({ occupancy_type: 'single', rate: parseFloat(allocationSingleRate) })
                          }
                          if (allocationDoubleRate) {
                            occupancyRates.push({ occupancy_type: 'double', rate: parseFloat(allocationDoubleRate) })
                          }
                          if (allocationTripleRate) {
                            occupancyRates.push({ occupancy_type: 'triple', rate: parseFloat(allocationTripleRate) })
                          }
                          if (allocationQuadRate) {
                            occupancyRates.push({ occupancy_type: 'quad', rate: parseFloat(allocationQuadRate) })
                          }
                        }
                        
                        // Build allocation object based on pricing strategy
                          const newAllocation: RoomAllocation = {
                          room_group_ids: selectedRoomTypes,
                          quantity: qty,
                          label,
                          allocation_pool_id: allocationPoolId || undefined, // NEW: Pool ID for multi-rate periods
                          // For per-occupancy strategy: use occupancy_rates
                          ...(formData.pricing_strategy === 'per_occupancy' && {
                            occupancy_rates: occupancyRates.length > 0 ? occupancyRates : undefined
                          }),
                          // For flat rate strategy: use base_rate
                          ...(formData.pricing_strategy === 'flat_rate' && allocationBaseRate && {
                            base_rate: parseFloat(allocationBaseRate)
                          })
                        }
                        
                          setFormData({
                            ...formData,
                            room_allocations: [...(formData.room_allocations || []), newAllocation]
                          })
                        
                        // Clear form
                        setSelectedRoomTypes([])
                        setAllocationLabel('')
                        setAllocationQty('')
                        setAllocationPoolId('')
                        setAllocationSingleRate('')
                        setAllocationDoubleRate('')
                        setAllocationTripleRate('')
                        setAllocationQuadRate('')
                        setAllocationBaseRate('')
                        
                        toast.success('Allocation added')
                      }}
                    >
                      Add Allocation
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    💡 Select multiple room types to create a shared pool (e.g., "50 rooms - Double/Twin"). The quantity will be shared across all selected types.
                  </p>
                </div>
              )}
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
      
        {/* Board/Meal Plan Options */}
        <AccordionItem value="board">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <Coffee className="h-4 w-4" />
              Board/Meal Options
              {formData.board_options.length > 0 && (
                <Badge variant="secondary" className="ml-2">{formData.board_options.length}</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
        
        {formData.board_options.length > 0 && (
          <div className="space-y-2">
            {formData.board_options.map((option, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md border">
                <div className="flex items-center gap-3">
                  <Badge>{BOARD_TYPE_LABELS[option.board_type]}</Badge>
                  <span className="text-sm font-medium">
                    +{option.additional_cost} {formData.currency}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...formData.board_options]
                    newOptions.splice(index, 1)
                    setFormData({ ...formData, board_options: newOptions })
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <Select
            value={boardTypeInput}
            onValueChange={(value: BoardType) => setBoardTypeInput(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="room_only">Room Only</SelectItem>
              <SelectItem value="bed_breakfast">Bed & Breakfast</SelectItem>
              <SelectItem value="half_board">Half Board</SelectItem>
              <SelectItem value="full_board">Full Board</SelectItem>
              <SelectItem value="all_inclusive">All-Inclusive</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            step="0.01"
            placeholder="Additional cost"
            value={boardCostInput}
            onChange={(e) => setBoardCostInput(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (boardCostInput) {
                const exists = formData.board_options.some(o => o.board_type === boardTypeInput)
                if (exists) {
                  toast.error('This board type is already added')
                  return
                }
                setFormData({
                  ...formData,
                  board_options: [
                    ...formData.board_options,
                    {
                      board_type: boardTypeInput,
                      additional_cost: parseFloat(boardCostInput)
                    }
                  ]
                })
                setBoardCostInput('')
              }
            }}
          >
            Add
          </Button>
        </div>
              <p className="text-xs text-muted-foreground">
                Base rate: {formData.base_rate} {formData.currency} + additional cost for each board type
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      

        {/* Attrition & Cancellation */}
        <AccordionItem value="attrition">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Attrition & Cancellation
              {((formData.attrition_stages?.length || 0) + (formData.cancellation_stages?.length || 0)) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {(formData.attrition_stages?.length || 0) + (formData.cancellation_stages?.length || 0)}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-2">
              {/* Attrition Stages */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <h4 className="font-semibold">Attrition / Room Release Stages</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Define dates when you can reduce room commitments
                </p>
        
        {formData.attrition_stages.length > 0 && (
          <div className="space-y-2">
            {formData.attrition_stages.map((stage, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-md border border-orange-200">
                <div className="flex-1 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{stage.date}</Badge>
                    <span className="font-medium">Release {(stage.release_percentage * 100).toFixed(0)}%</span>
                    {formData.total_rooms > 0 && (
                      <span className="text-muted-foreground">
                        (≈{Math.floor(formData.total_rooms * stage.release_percentage)} rooms)
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newStages = [...formData.attrition_stages]
                    newStages.splice(index, 1)
                    setFormData({ ...formData, attrition_stages: newStages })
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            type="date"
            placeholder="Attrition date"
            value={attritionDateInput}
            onChange={(e) => setAttritionDateInput(e.target.value)}
            className="flex-1"
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Release %"
            value={attritionPercentInput}
            onChange={(e) => setAttritionPercentInput(e.target.value)}
            className="w-[120px]"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (attritionDateInput && attritionPercentInput) {
                setFormData({
                  ...formData,
                  attrition_stages: [
                    ...formData.attrition_stages,
                    {
                      date: attritionDateInput,
                      release_percentage: parseFloat(attritionPercentInput) / 100
                    }
                  ]
                })
                setAttritionDateInput('')
                setAttritionPercentInput('')
              }
            }}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center gap-2">
          <Ban className="h-4 w-4 text-red-600" />
          <h4 className="font-semibold">Cancellation Policy</h4>
        </div>
        <p className="text-sm text-muted-foreground">
          Penalty charges for full contract cancellation
        </p>
        
        {formData.cancellation_stages.length > 0 && (
          <div className="space-y-2">
            {formData.cancellation_stages.map((stage, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200">
                <div className="flex-1 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{stage.cutoff_date}</Badge>
                    <span className="font-medium text-red-700 dark:text-red-400">
                      {(stage.penalty_percentage * 100).toFixed(0)}% penalty
                    </span>
                    {stage.penalty_description && (
                      <span className="text-muted-foreground">
                        - {stage.penalty_description}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newStages = [...formData.cancellation_stages]
                    newStages.splice(index, 1)
                    setFormData({ ...formData, cancellation_stages: newStages })
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            type="date"
            placeholder="Cutoff date"
            value={cancellationDateInput}
            onChange={(e) => setCancellationDateInput(e.target.value)}
            className="flex-1"
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Penalty %"
            value={cancellationPenaltyInput}
            onChange={(e) => setCancellationPenaltyInput(e.target.value)}
            className="w-[120px]"
          />
          <Input
            placeholder="Description"
            value={cancellationDescInput}
            onChange={(e) => setCancellationDescInput(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (cancellationDateInput && cancellationPenaltyInput) {
                setFormData({
                  ...formData,
                  cancellation_stages: [
                    ...formData.cancellation_stages,
                    {
                      cutoff_date: cancellationDateInput,
                      penalty_percentage: parseFloat(cancellationPenaltyInput) / 100,
                      penalty_description: cancellationDescInput
                    }
                  ]
                })
                setCancellationDateInput('')
                setCancellationPenaltyInput('')
                setCancellationDescInput('')
              }
            }}
          >
            Add
          </Button>
        </div>
      </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Payment Tracking */}
        <AccordionItem value="payments">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <DollarIcon className="h-4 w-4" />
              Payment Schedule
              {formData.payment_schedule.length > 0 && (
                <Badge variant="secondary" className="ml-2">{formData.payment_schedule.length}</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
        
        <div className="grid gap-2">
          <Label htmlFor="contracted_total">Contracted Payment Total</Label>
          <Input
            id="contracted_total"
            type="number"
            step="0.01"
            value={formData.contracted_payment_total}
            onChange={(e) => setFormData({ ...formData, contracted_payment_total: parseFloat(e.target.value) || 0 })}
            placeholder="e.g., 12000"
          />
          <p className="text-xs text-muted-foreground">
            Total amount you're contracted to pay the hotel
          </p>
        </div>
        
        {formData.payment_schedule.length > 0 && (
          <div className="space-y-2">
            {formData.payment_schedule.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200">
                <div className="flex items-center gap-3 flex-1">
                  <Badge variant={payment.paid ? "default" : "outline"}>
                    {payment.payment_date}
                  </Badge>
                  <span className="font-medium">{payment.amount_due} {formData.currency}</span>
                  {payment.paid && payment.paid_date && (
                    <span className="text-xs text-green-600">Paid {payment.paid_date}</span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newSchedule = [...formData.payment_schedule]
                    newSchedule.splice(index, 1)
                    setFormData({ ...formData, payment_schedule: newSchedule })
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            type="date"
            placeholder="Payment date"
            value={paymentDateInput}
            onChange={(e) => setPaymentDateInput(e.target.value)}
            className="flex-1"
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={paymentAmountInput}
            onChange={(e) => setPaymentAmountInput(e.target.value)}
            className="w-[150px]"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (paymentDateInput && paymentAmountInput) {
                setFormData({
                  ...formData,
                  payment_schedule: [
                    ...formData.payment_schedule,
                    {
                      payment_date: paymentDateInput,
                      amount_due: parseFloat(paymentAmountInput),
                      paid: false
                    }
                  ]
                })
                setPaymentDateInput('')
                setPaymentAmountInput('')
              }
            }}
          >
            Add
          </Button>
        </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="grid gap-2">
        <Label>Days of Week (MTWTFSS)</Label>
        <div className="flex flex-wrap gap-3">
          {([
            ['mon','M'],
            ['tue','T'],
            ['wed','W'],
            ['thu','T'],
            ['fri','F'],
            ['sat','S'],
            ['sun','S'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={formData.days_of_week?.[key] ?? true}
                onCheckedChange={(checked: boolean | "indeterminate") => setFormData({
                  ...formData,
                  days_of_week: { ...formData.days_of_week, [key]: Boolean(checked) }
                })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="min_nights">Min Nights</Label>
          <Input
            id="min_nights"
            type="number"
            min={1}
            value={formData.min_nights}
            onChange={(e) => setFormData({ ...formData, min_nights: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="max_nights">Max Nights</Label>
          <Input
            id="max_nights"
            type="number"
            min={1}
            value={formData.max_nights}
            onChange={(e) => setFormData({ ...formData, max_nights: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Internal notes about this contract"
        />
      </div>
    </div>
  )
}
