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
import { AlertTriangle, Ban, Receipt, Coffee, Calendar as CalendarIcon, DollarSign as DollarIcon, Trash2, Bed, Percent, Users } from 'lucide-react'
import { BoardType, BoardOption, AttritionStage, CancellationStage, PaymentSchedule, RoomAllocation, RoomGroup, OccupancyRate } from '@/contexts/data-context'
import { BOARD_TYPE_LABELS } from '@/lib/pricing'
import { toast } from 'sonner'

interface ContractFormProps {
  formData: {
    hotel_id: number
    contract_name: string
    start_date: string
    end_date: string
    total_rooms: number
    base_rate: number
    currency: string
    room_allocations?: RoomAllocation[]
    pricing_strategy?: 'per_occupancy' | 'flat_rate'
    occupancy_rates?: OccupancyRate[]
    markup_percentage?: number
    shoulder_markup_percentage?: number
    days_of_week?: { mon: boolean; tue: boolean; wed: boolean; thu: boolean; fri: boolean; sat: boolean; sun: boolean }
    min_nights?: number
    max_nights?: number
    tax_rate: number
    city_tax_per_person_per_night: number
    resort_fee_per_night: number
    supplier_commission_rate: number
    board_options: BoardOption[]
    pre_shoulder_rates: number[]
    post_shoulder_rates: number[]
    attrition_stages: AttritionStage[]
    cancellation_stages: CancellationStage[]
    contracted_payment_total: number
    payment_schedule: PaymentSchedule[]
    notes: string
  }
  setFormData: (data: any) => void
  hotels: any[]
  selectedHotel?: any
  boardTypeInput: BoardType
  setBoardTypeInput: (value: BoardType) => void
  boardCostInput: string
  setBoardCostInput: (value: string) => void
  preShoulderInput: string
  setPreShoulderInput: (value: string) => void
  postShoulderInput: string
  setPostShoulderInput: (value: string) => void
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
  selectedHotel,
  boardTypeInput,
  setBoardTypeInput,
  boardCostInput,
  setBoardCostInput,
  preShoulderInput,
  setPreShoulderInput,
  postShoulderInput,
  setPostShoulderInput,
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
  return (
    <div className="grid gap-4 py-4">
      {!isEditing && (
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
        <Label htmlFor="base_rate">Base Rate (Reference)</Label>
        <Input
          id="base_rate"
          type="number"
          step="0.01"
          value={formData.base_rate}
          onChange={(e) => setFormData({ ...formData, base_rate: parseFloat(e.target.value) || 0 })}
        />
        <p className="text-xs text-muted-foreground">
          Default/reference rate (will be overridden by occupancy rates if using per-occupancy pricing)
        </p>
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
                    const roomGroup = selectedHotel?.room_groups?.find((rg: RoomGroup) => rg.id === allocation.room_group_id)
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md border">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{roomGroup?.room_type || allocation.room_group_id}</Badge>
                          <span className="text-sm font-medium">{allocation.quantity} rooms</span>
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
                    )
                  })}
                </div>
              )}
              
              {selectedHotel && selectedHotel.room_groups && selectedHotel.room_groups.length > 0 && (
                <div className="p-3 bg-background rounded-md border border-dashed space-y-2">
                  <p className="text-sm font-medium">Add Room Allocation</p>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(value) => {
                        const quantity = prompt('How many rooms of this type?')
                        if (quantity && parseInt(quantity) > 0) {
                          const newAllocation: RoomAllocation = {
                            room_group_id: value,
                            quantity: parseInt(quantity)
                          }
                          setFormData({
                            ...formData,
                            room_allocations: [...(formData.room_allocations || []), newAllocation]
                          })
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedHotel.room_groups.map((rg: RoomGroup) => (
                          <SelectItem key={rg.id} value={rg.id}>
                            {rg.room_type} (Capacity: {rg.capacity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Example: 10× Standard Double, 5× Deluxe Suite
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
              
              <div className="grid gap-2">
                <Label>Shoulder Nights Markup (%)</Label>
                <Input
                  type="number"
                  step="1"
                  value={(formData.shoulder_markup_percentage || 0.30) * 100}
                  onChange={(e) => setFormData({ ...formData, shoulder_markup_percentage: (parseFloat(e.target.value) || 30) / 100 })}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">
                  Default: 30% (lower markup for pre/post tour nights)
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
      
        {/* Shoulder Night Rates */}
        <AccordionItem value="shoulder">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Shoulder Night Rates
              {((formData.pre_shoulder_rates?.length || 0) + (formData.post_shoulder_rates?.length || 0)) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {(formData.pre_shoulder_rates?.length || 0) + (formData.post_shoulder_rates?.length || 0)}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
        
        {/* Pre-Shoulder Rates */}
        <div className="space-y-2">
          <Label>Pre-Shoulder Rates (nights before start date)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Rate for night -1"
              value={preShoulderInput}
              onChange={(e) => setPreShoulderInput(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (preShoulderInput) {
                  setFormData({
                    ...formData,
                    pre_shoulder_rates: [...formData.pre_shoulder_rates, parseFloat(preShoulderInput)]
                  })
                  setPreShoulderInput('')
                }
              }}
            >
              Add
            </Button>
          </div>
          {formData.pre_shoulder_rates.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.pre_shoulder_rates.map((rate, index) => (
                <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                  <span>-{index + 1}: {rate}{formData.currency}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newRates = [...formData.pre_shoulder_rates]
                      newRates.splice(index, 1)
                      setFormData({ ...formData, pre_shoulder_rates: newRates })
                    }}
                    className="ml-1 text-destructive hover:text-destructive/80"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Post-Shoulder Rates */}
        <div className="space-y-2">
          <Label>Post-Shoulder Rates (nights after end date)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Rate for night +1"
              value={postShoulderInput}
              onChange={(e) => setPostShoulderInput(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (postShoulderInput) {
                  setFormData({
                    ...formData,
                    post_shoulder_rates: [...formData.post_shoulder_rates, parseFloat(postShoulderInput)]
                  })
                  setPostShoulderInput('')
                }
              }}
            >
              Add
            </Button>
          </div>
          {formData.post_shoulder_rates.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.post_shoulder_rates.map((rate, index) => (
                <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                  <span>+{index + 1}: {rate}{formData.currency}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newRates = [...formData.post_shoulder_rates]
                      newRates.splice(index, 1)
                      setFormData({ ...formData, post_shoulder_rates: newRates })
                    }}
                    className="ml-1 text-destructive hover:text-destructive/80"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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
