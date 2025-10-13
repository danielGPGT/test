/**
 * UNIFIED CONTRACT FORM
 * Polymorphic contract form that works for ALL inventory types
 * Conditionally shows type-specific sections (hotel costs, etc.)
 */

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
} from '@/components/ui/accordion'
import { Trash2, Percent, Receipt, Coffee, Package, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { 
  UnifiedContract, 
  InventoryItem, 
  BoardType
} from '@/types/unified-inventory'
import { BOARD_TYPE_LABELS } from '@/types/unified-inventory'
import { DynamicChargesManager } from '@/components/dynamic-charges'
import { DayOfWeekSelector } from '@/components/ui/day-of-week-selector'
import { recordToDaySelection, daySelectionToRecord } from '@/types/unified-inventory'

interface UnifiedContractFormProps {
  item: InventoryItem
  contract?: UnifiedContract
  suppliers: Array<{ id: number; name: string; active: boolean }>
  tours: Array<{ id: number; name: string; start_date: string; end_date: string }>
  onSave: (data: Partial<UnifiedContract>) => void
  onCancel: () => void
  onCreateAllocations?: (contractId: number, allocations: Array<{
    category_ids: string[]
    quantity: number
    allocation_pool_id: string
    label: string
    description?: string
    valid_from?: string
    valid_to?: string
  }>) => void
}

export function UnifiedContractForm({
  item,
  contract,
  suppliers,
  tours,
  onSave,
  onCancel,
  onCreateAllocations
}: UnifiedContractFormProps) {
  const [formData, setFormData] = useState<Partial<UnifiedContract>>({
    item_id: item.id,
    supplier_id: contract?.supplier_id || (suppliers.length > 0 ? suppliers[0].id : 0),
    tour_ids: contract?.tour_ids || [],
    contract_name: contract?.contract_name || '',
    valid_from: contract?.valid_from || '',
    valid_to: contract?.valid_to || '',
    currency: contract?.currency || 'EUR',
    pricing_strategy: contract?.pricing_strategy || 'per_unit',
    markup_percentage: contract?.markup_percentage || 0.60,
    tax_rate: contract?.tax_rate || 0.12,
    service_fee: contract?.service_fee || 0,
    dynamic_charges: contract?.dynamic_charges || [],
    hotel_costs: item.item_type === 'hotel' ? (contract?.hotel_costs || {
      city_tax_per_person_per_night: 0,
      resort_fee_per_night: 0,
      supplier_commission_rate: 0.10,
      board_options: []
    }) : undefined,
    days_of_week: contract?.days_of_week,
    min_nights: contract?.min_nights,
    max_nights: contract?.max_nights,
    attrition_stages: contract?.attrition_stages || [],
    cancellation_stages: contract?.cancellation_stages || [],
    payment_schedule: contract?.payment_schedule || [],
    notes: contract?.notes || '',
    active: contract?.active !== undefined ? contract.active : true
  })

  // Allocation management state
  const [contractAllocations, setContractAllocations] = useState<Array<{
    id?: number
    category_ids: string[]
    quantity: number
    allocation_pool_id: string
    label: string
    description?: string
    valid_from?: string
    valid_to?: string
  }>>([])

  const [allocationForm, setAllocationForm] = useState({
    category_ids: [] as string[],
    quantity: 0,
    allocation_pool_id: '',
    label: '',
    description: '',
    valid_from: '',
    valid_to: ''
  })

  // Board option inputs (for hotels)
  const [boardTypeInput, setBoardTypeInput] = useState<BoardType>('bed_breakfast')
  const [boardCostInput, setBoardCostInput] = useState('')


  const updateField = (field: keyof UnifiedContract, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateHotelCost = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      hotel_costs: { ...prev.hotel_costs, [field]: value }
    }))
  }


  const addBoardOption = () => {
    if (!boardCostInput) {
      toast.error('Please enter board cost')
      return
    }

    const exists = formData.hotel_costs?.board_options?.some(o => o.board_type === boardTypeInput)
    if (exists) {
      toast.error('This board type is already added')
      return
    }

    updateHotelCost('board_options', [
      ...(formData.hotel_costs?.board_options || []),
      {
        board_type: boardTypeInput,
        additional_cost: parseFloat(boardCostInput)
      }
    ])

    setBoardCostInput('')
    toast.success('Board option added')
  }

  const removeBoardOption = (index: number) => {
    updateHotelCost(
      'board_options',
      formData.hotel_costs?.board_options?.filter((_, i) => i !== index)
    )
  }

  // Allocation management functions
  const addAllocation = () => {
    if (allocationForm.category_ids.length === 0 || !allocationForm.quantity || !allocationForm.allocation_pool_id) {
      toast.error('Please fill in all required allocation fields')
      return
    }

    const newAllocation = {
      ...allocationForm,
      id: Date.now() // Temporary ID for form management
    }

    setContractAllocations([...contractAllocations, newAllocation])
    
    // Reset form
    setAllocationForm({
      category_ids: [],
      quantity: 0,
      allocation_pool_id: '',
      label: '',
      description: '',
      valid_from: '',
      valid_to: ''
    })

    toast.success('Allocation added')
  }

  const removeAllocation = (index: number) => {
    const newAllocations = [...contractAllocations]
    newAllocations.splice(index, 1)
    setContractAllocations(newAllocations)
  }

  const handleSubmit = () => {
    if (!formData.supplier_id || formData.supplier_id === 0) {
      toast.error('Please select a supplier')
      return
    }
    if (!formData.contract_name || formData.contract_name.trim() === '') {
      toast.error('Please enter a contract name')
      return
    }
    if (!formData.valid_from || !formData.valid_to) {
      toast.error('Please enter validity dates')
      return
    }
    if (formData.valid_to < formData.valid_from) {
      toast.error('End date must be after start date')
      return
    }

    console.log('💾 Saving contract:', formData)
    onSave(formData)
  }


  return (
    <div className="space-y-4">
      {/* Warning if no suppliers */}
      {suppliers.filter(s => s.active).length === 0 && (
        <div className="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 rounded-md">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            ⚠️ No active suppliers found. Please create a supplier first.
          </p>
        </div>
      )}

      {/* Basic Info */}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Supplier *</Label>
          <Select
            value={formData.supplier_id?.toString() || '0'}
            onValueChange={(value) => updateField('supplier_id', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.filter(s => s.active).length === 0 ? (
                <SelectItem value="0" disabled>
                  No active suppliers - create one first
                </SelectItem>
              ) : (
                suppliers.filter(s => s.active).map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {suppliers.filter(s => s.active).length > 0 && (
            <p className="text-xs text-muted-foreground">
              Selected: {suppliers.find(s => s.id === formData.supplier_id)?.name || 'None'}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label>Contract Name *</Label>
          <Input
            value={formData.contract_name}
            onChange={(e) => updateField('contract_name', e.target.value)}
            placeholder="e.g., F1 Weekend Block 2025"
          />
        </div>

        {/* Tour Linking */}
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
                      id={`tour-${tour.id}`}
                      checked={formData.tour_ids?.includes(tour.id) || false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateField('tour_ids', [...(formData.tour_ids || []), tour.id])
                        } else {
                          updateField('tour_ids', (formData.tour_ids || []).filter(id => id !== tour.id))
                        }
                      }}
                    />
                    <label
                      htmlFor={`tour-${tour.id}`}
                      className="text-sm font-medium leading-none cursor-pointer flex-1"
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

        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label>Valid From *</Label>
            <Input
              type="date"
              value={formData.valid_from}
              onChange={(e) => updateField('valid_from', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Valid To *</Label>
            <Input
              type="date"
              value={formData.valid_to}
              onChange={(e) => updateField('valid_to', e.target.value)}
              min={formData.valid_from}
            />
          </div>
          <div className="grid gap-2">
            <Label>Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => updateField('currency', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="AED">AED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Accordion Sections */}
      <Accordion type="multiple" defaultValue={["allocations", "markup"]} className="border rounded-lg">

        {/* Allocations Section */}
        <AccordionItem value="allocations">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Allocations
              {contractAllocations.length > 0 && (
                <Badge variant="secondary" className="ml-2">{contractAllocations.length}</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Create allocations for this contract. These will be used to generate rates automatically.
              </p>
              
              {/* Existing Allocations */}
              {contractAllocations.length > 0 && (
                <div className="space-y-2">
                  {contractAllocations.map((allocation, index) => (
                    <div key={allocation.id || index} className="flex items-center justify-between p-3 bg-muted rounded-md border">
                      <div className="flex items-center gap-2 flex-wrap">
                        {allocation.label && (
                          <Badge variant="default" className="text-xs">{allocation.label}</Badge>
                        )}
                        {allocation.allocation_pool_id && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            Pool: {allocation.allocation_pool_id}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {allocation.category_ids.length} categories
                        </Badge>
                        <span className="text-sm font-medium">{allocation.quantity} units</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAllocation(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add Allocation Form */}
              <div className="p-3 bg-background rounded-md border border-dashed space-y-3">
                <p className="text-sm font-medium">Add Allocation</p>
                
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Label (optional)</Label>
                      <Input
                        type="text"
                        placeholder="e.g., Standard Rooms"
                        value={allocationForm.label}
                        onChange={(e) => setAllocationForm({ ...allocationForm, label: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Quantity *</Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Units"
                        value={allocationForm.quantity || ''}
                        onChange={(e) => setAllocationForm({ ...allocationForm, quantity: parseInt(e.target.value) || 0 })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Categories *</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.categories.map(category => {
                        const isSelected = allocationForm.category_ids.includes(category.id)
                        return (
                          <div key={category.id} className="flex items-center gap-1.5">
                            <Checkbox
                              id={`allocation-category-${category.id}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setAllocationForm({
                                    ...allocationForm,
                                    category_ids: [...allocationForm.category_ids, category.id]
                                  })
                                } else {
                                  setAllocationForm({
                                    ...allocationForm,
                                    category_ids: allocationForm.category_ids.filter(id => id !== category.id)
                                  })
                                }
                              }}
                            />
                            <label
                              htmlFor={`allocation-category-${category.id}`}
                              className="text-xs cursor-pointer"
                            >
                              {category.category_name}
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Allocation Pool ID *</Label>
                    <Input
                      type="text"
                      placeholder="e.g., dec-2025-standard-pool"
                      value={allocationForm.allocation_pool_id}
                      onChange={(e) => setAllocationForm({ ...allocationForm, allocation_pool_id: e.target.value })}
                      className="h-8 text-xs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use same Pool ID across contracts to share inventory
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Valid From</Label>
                      <Input
                        type="date"
                        value={allocationForm.valid_from}
                        onChange={(e) => setAllocationForm({ ...allocationForm, valid_from: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Valid To</Label>
                      <Input
                        type="date"
                        value={allocationForm.valid_to}
                        onChange={(e) => setAllocationForm({ ...allocationForm, valid_to: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={allocationForm.description}
                      onChange={(e) => setAllocationForm({ ...allocationForm, description: e.target.value })}
                      placeholder="Optional description"
                      className="h-16 text-xs"
                    />
                  </div>
                </div>
                
                <Button size="sm" onClick={addAllocation} className="w-full h-8 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Allocation
                </Button>
              </div>
              
              {/* Generate Allocations Button */}
              {contractAllocations.length > 0 && onCreateAllocations && contract && (
                <div className="border-t pt-3">
                  <Button 
                    size="sm" 
                    onClick={() => onCreateAllocations(contract.id, contractAllocations)}
                    className="w-full h-8 text-xs bg-green-600 hover:bg-green-700"
                  >
                    <Package className="h-3 w-3 mr-1" />
                    Generate Allocations ({contractAllocations.length})
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    Create allocations from the contract form data
                  </p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Markup Settings */}
        <AccordionItem value="markup">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Markup & Pricing
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 pt-2">
              <div className="grid gap-2">
                <Label>Default Markup (%)</Label>
                <Input
                  type="number"
                  step="1"
                  value={(formData.markup_percentage || 0) * 100}
                  onChange={(e) => updateField('markup_percentage', (parseFloat(e.target.value) || 60) / 100)}
                  placeholder="60"
                />
                <p className="text-xs text-muted-foreground">
                  Default markup applied to rates created from this contract
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Taxes & Fees */}
        <AccordionItem value="taxes">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Taxes & Fees
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 pt-2">
              <div className="grid gap-2">
                <Label>VAT/Sales Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={(formData.tax_rate || 0) * 100}
                  onChange={(e) => updateField('tax_rate', (parseFloat(e.target.value) || 0) / 100)}
                  placeholder="12"
                />
              </div>

              {formData.service_fee !== undefined && (
                <div className="grid gap-2">
                  <Label>Service Fee (flat fee)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.service_fee}
                    onChange={(e) => updateField('service_fee', parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}

              {/* Hotel-specific costs */}
              {item.item_type === 'hotel' && formData.hotel_costs && (
                <>
                  <div className="grid gap-2">
                    <Label>City Tax (per person per night)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.hotel_costs.city_tax_per_person_per_night || 0}
                      onChange={(e) => updateHotelCost('city_tax_per_person_per_night', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Resort Fee (per room per night)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.hotel_costs.resort_fee_per_night || 0}
                      onChange={(e) => updateHotelCost('resort_fee_per_night', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Supplier Commission / Discount (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={(formData.hotel_costs.supplier_commission_rate || 0) * 100}
                      onChange={(e) => updateHotelCost('supplier_commission_rate', (parseFloat(e.target.value) || 0) / 100)}
                      placeholder="10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Commission/discount you receive from supplier (reduces your cost)
                    </p>
                  </div>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Board Options (Hotels Only) */}
        {item.item_type === 'hotel' && formData.hotel_costs && (
          <AccordionItem value="board">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                Board/Meal Options
                {(formData.hotel_costs.board_options?.length || 0) > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {formData.hotel_costs.board_options?.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4 pt-2">
                {/* Existing board options */}
                {formData.hotel_costs.board_options && formData.hotel_costs.board_options.length > 0 && (
                  <div className="space-y-2">
                    {formData.hotel_costs.board_options.map((option, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md border">
                        <div className="flex items-center gap-3">
                          <Badge>{BOARD_TYPE_LABELS[option.board_type]}</Badge>
                          <span className="text-sm font-medium">
                            +{option.additional_cost} {formData.currency}/person
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBoardOption(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add board option */}
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
                    placeholder="Cost per person"
                    value={boardCostInput}
                    onChange={(e) => setBoardCostInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addBoardOption}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Constraints (Hotels mainly) */}
        {item.item_type === 'hotel' && (
          <AccordionItem value="constraints">
            <AccordionTrigger className="px-4 hover:no-underline">
              Booking Constraints
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Min Nights</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.min_nights || ''}
                      onChange={(e) => updateField('min_nights', parseInt(e.target.value) || undefined)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Max Nights</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.max_nights || ''}
                      onChange={(e) => updateField('max_nights', parseInt(e.target.value) || undefined)}
                    />
                  </div>
                </div>

                {/* Days of Week Selector */}
                <div className="grid gap-2">
                  <DayOfWeekSelector
                    value={recordToDaySelection(formData.days_of_week)}
                    onChange={(selection) => updateField('days_of_week', daySelectionToRecord(selection))}
                    label="Valid Days of Week"
                  />
                  <p className="text-xs text-muted-foreground">
                    Select which days of the week this contract is valid for. All days are selected by default.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Dynamic Charges */}
      <DynamicChargesManager
        charges={formData.dynamic_charges || []}
        onChange={(charges) => updateField('dynamic_charges', charges)}
        title="Contract Charges"
        description="Define taxes, fees, discounts, commissions, and surcharges for this contract"
      />

      {/* Notes */}
      <div className="grid gap-2">
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Internal notes about this contract"
          rows={3}
        />
      </div>


      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          {contract ? 'Update' : 'Create'} Contract
        </Button>
      </div>
    </div>
  )
}

