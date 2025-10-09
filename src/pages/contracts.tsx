import { useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useData, Contract, BoardType, BoardOption, AttritionStage, CancellationStage, PaymentSchedule } from '@/contexts/data-context'
import { Plus, Trash2, AlertTriangle, Ban, DollarSign as DollarIcon, Receipt, Coffee, Calendar as CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { BOARD_TYPE_LABELS } from '@/lib/pricing'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function Contracts() {
  const { contracts, hotels, tours, addContract, updateContract, deleteContract } = useData()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [formData, setFormData] = useState({
    hotel_id: 0,
    contract_name: '',
    start_date: '',
    end_date: '',
    total_rooms: 0,
    base_rate: 0,
    currency: 'EUR',
    tour_ids: [] as number[],
    days_of_week: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
    min_nights: 1,
    max_nights: 14,
    tax_rate: 0,
    city_tax_per_person_per_night: 0,
    resort_fee_per_night: 0,
    supplier_commission_rate: 0,
    board_options: [] as BoardOption[],
    pre_shoulder_rates: [] as number[],
    post_shoulder_rates: [] as number[],
    attrition_stages: [] as AttritionStage[],
    cancellation_stages: [] as CancellationStage[],
    contracted_payment_total: 0,
    payment_schedule: [] as PaymentSchedule[],
    notes: '',
  })
  
  // State for adding board options
  const [boardTypeInput, setBoardTypeInput] = useState<BoardType>('room_only')
  const [boardCostInput, setBoardCostInput] = useState('')
  
  // State for adding shoulder night rates
  const [preShoulderInput, setPreShoulderInput] = useState('')
  const [postShoulderInput, setPostShoulderInput] = useState('')
  
  // State for adding attrition stages
  const [attritionDateInput, setAttritionDateInput] = useState('')
  const [attritionPercentInput, setAttritionPercentInput] = useState('')
  
  // State for adding cancellation stages
  const [cancellationDateInput, setCancellationDateInput] = useState('')
  const [cancellationPenaltyInput, setCancellationPenaltyInput] = useState('')
  const [cancellationDescInput, setCancellationDescInput] = useState('')
  
  // State for adding payment schedules
  const [paymentDateInput, setPaymentDateInput] = useState('')
  const [paymentAmountInput, setPaymentAmountInput] = useState('')

  const columns = [
    { header: 'ID', accessor: 'id', width: 60 },
    { header: 'Hotel', accessor: 'hotelName' },
    { header: 'Contract Name', accessor: 'contract_name' },
    { header: 'Start Date', accessor: 'start_date', format: 'date' as const },
    { header: 'End Date', accessor: 'end_date', format: 'date' as const },
    { header: 'Total Rooms', accessor: 'total_rooms' },
    { header: 'Base Rate', accessor: 'base_rate', format: 'currency' as const },
    { header: 'Currency', accessor: 'currency' },
    { header: 'Min Nights', accessor: 'min_nights' },
    { header: 'Max Nights', accessor: 'max_nights' },
    { header: 'Actions', accessor: 'actions', type: 'actions' as const, actions: ['view', 'edit', 'delete'] },
  ]

  const handleCreate = () => {
    // Basic validation
    if (formData.hotel_id === 0) {
      toast.error('Please select a hotel')
      return
    }
    if (!formData.contract_name.trim()) {
      toast.error('Please enter a contract name')
      return
    }
    if (!formData.start_date || !formData.end_date) {
      toast.error('Please enter start and end dates')
      return
    }
    
    // Create the contract
    console.log('Creating contract with tour_ids:', formData.tour_ids)
    addContract(formData)
    toast.success('Contract created successfully')
    setIsCreateOpen(false)
    setFormData({
      hotel_id: 0,
      contract_name: '',
      start_date: '',
      end_date: '',
      total_rooms: 0,
      base_rate: 0,
      currency: 'EUR',
      tour_ids: [],
      days_of_week: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
      min_nights: 1,
      max_nights: 14,
      tax_rate: 0,
      city_tax_per_person_per_night: 0,
      resort_fee_per_night: 0,
      supplier_commission_rate: 0,
      board_options: [],
      pre_shoulder_rates: [],
      post_shoulder_rates: [],
      attrition_stages: [],
      cancellation_stages: [],
      contracted_payment_total: 0,
      payment_schedule: [],
      notes: '',
    })
    setBoardTypeInput('room_only')
    setBoardCostInput('')
    setPreShoulderInput('')
    setPostShoulderInput('')
    setAttritionDateInput('')
    setAttritionPercentInput('')
    setCancellationDateInput('')
    setCancellationPenaltyInput('')
    setCancellationDescInput('')
    setPaymentDateInput('')
    setPaymentAmountInput('')
  }

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract)
    setFormData({
      hotel_id: contract.hotel_id,
      contract_name: contract.contract_name,
      start_date: contract.start_date,
      end_date: contract.end_date,
      total_rooms: contract.total_rooms,
      base_rate: contract.base_rate,
      currency: contract.currency,
      tour_ids: contract.tour_ids || [],
      days_of_week: contract.days_of_week || { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
      min_nights: contract.min_nights ?? 1,
      max_nights: contract.max_nights ?? 14,
      tax_rate: contract.tax_rate || 0,
      city_tax_per_person_per_night: contract.city_tax_per_person_per_night || 0,
      resort_fee_per_night: contract.resort_fee_per_night || 0,
      supplier_commission_rate: contract.supplier_commission_rate || 0,
      board_options: contract.board_options || [],
      pre_shoulder_rates: contract.pre_shoulder_rates || [],
      post_shoulder_rates: contract.post_shoulder_rates || [],
      attrition_stages: contract.attrition_stages || [],
      cancellation_stages: contract.cancellation_stages || [],
      contracted_payment_total: contract.contracted_payment_total || 0,
      payment_schedule: contract.payment_schedule || [],
      notes: contract.notes || '',
    })
    setIsEditOpen(true)
  }

  const handleUpdate = () => {
    if (editingContract) {
      updateContract(editingContract.id, formData)
      setIsEditOpen(false)
      setEditingContract(null)
      setFormData({
        hotel_id: 0,
        contract_name: '',
        start_date: '',
        end_date: '',
        total_rooms: 0,
        base_rate: 0,
        currency: 'EUR',
        tour_ids: [],
        days_of_week: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
        min_nights: 1,
        max_nights: 14,
        tax_rate: 0,
        city_tax_per_person_per_night: 0,
        resort_fee_per_night: 0,
        supplier_commission_rate: 0,
        board_options: [],
        pre_shoulder_rates: [],
        post_shoulder_rates: [],
        attrition_stages: [],
        cancellation_stages: [],
        contracted_payment_total: 0,
        payment_schedule: [],
        notes: '',
      })
      setBoardTypeInput('room_only')
      setBoardCostInput('')
      setPreShoulderInput('')
      setPostShoulderInput('')
      setAttritionDateInput('')
      setAttritionPercentInput('')
      setCancellationDateInput('')
      setCancellationPenaltyInput('')
      setCancellationDescInput('')
      setPaymentDateInput('')
      setPaymentAmountInput('')
    }
  }

  const handleDelete = (contract: Contract) => {
    if (confirm(`Are you sure you want to delete "${contract.contract_name}"?`)) {
      deleteContract(contract.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Contracts</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Contract</DialogTitle>
              <DialogDescription>Add a new contract to the system.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
              <div className="grid gap-2">
                <Label htmlFor="contract_name">Contract Name</Label>
                <Input
                  id="contract_name"
                  value={formData.contract_name}
                  onChange={(e) => setFormData({ ...formData, contract_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Link to Tours (Optional)</Label>
                <div className="border rounded-lg p-3 space-y-2">
                  {tours.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No tours available</div>
                  ) : (
                    tours.map(tour => (
                      <div key={tour.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tour-${tour.id}`}
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
                          htmlFor={`tour-${tour.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {tour.name} ({tour.start_date} - {tour.end_date})
                        </label>
                      </div>
                    ))
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Leave empty to make this contract available for all tours
                  </p>
                </div>
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
                  onChange={(e) => setFormData({ ...formData, total_rooms: parseInt(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="base_rate">Base Rate</Label>
                <Input
                  id="base_rate"
                  type="number"
                  step="0.01"
                  value={formData.base_rate}
                  onChange={(e) => setFormData({ ...formData, base_rate: parseFloat(e.target.value) })}
                />
              </div>
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
              
              <Accordion type="multiple" defaultValue={["taxes", "board", "payments"]} className="w-full">
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
                          onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
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
                          onChange={(e) => setFormData({ ...formData, city_tax_per_person_per_night: parseFloat(e.target.value) })}
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
                          onChange={(e) => setFormData({ ...formData, resort_fee_per_night: parseFloat(e.target.value) })}
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
                          onChange={(e) => setFormData({ ...formData, supplier_commission_rate: parseFloat(e.target.value) })}
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
                        // Check if board type already exists
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
                          <span>-{index + 1}: {rate}€</span>
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
                          <span>+{index + 1}: {rate}€</span>
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
                        checked={formData.days_of_week[key]}
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
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        title="Hotel Contracts"
        columns={columns}
        data={contracts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchable
      />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>Update contract information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-hotel_id">Hotel *</Label>
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
            <div className="grid gap-2">
              <Label htmlFor="edit-contract_name">Contract Name</Label>
              <Input
                id="edit-contract_name"
                value={formData.contract_name}
                onChange={(e) => setFormData({ ...formData, contract_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-start_date">Start Date *</Label>
              <Input
                id="edit-start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-end_date">End Date *</Label>
              <Input
                id="edit-end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-total_rooms">Total Rooms</Label>
              <Input
                id="edit-total_rooms"
                type="number"
                value={formData.total_rooms}
                onChange={(e) => setFormData({ ...formData, total_rooms: parseInt(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-base_rate">Base Rate</Label>
              <Input
                id="edit-base_rate"
                type="number"
                step="0.01"
                value={formData.base_rate}
                onChange={(e) => setFormData({ ...formData, base_rate: parseFloat(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-currency">Currency</Label>
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
            <div className="grid gap-2">
              <Label htmlFor="edit-tax_rate">VAT/Sales Tax Rate (%)</Label>
              <Input
                id="edit-tax_rate"
                type="number"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-city_tax">City Tax (per person per night)</Label>
              <Input
                id="edit-city_tax"
                type="number"
                step="0.01"
                value={formData.city_tax_per_person_per_night}
                onChange={(e) => setFormData({ ...formData, city_tax_per_person_per_night: parseFloat(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-resort_fee">Resort/Facility Fee (per room per night)</Label>
              <Input
                id="edit-resort_fee"
                type="number"
                step="0.01"
                value={formData.resort_fee_per_night}
                onChange={(e) => setFormData({ ...formData, resort_fee_per_night: parseFloat(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-supplier_commission">Supplier Commission / Discount (%)</Label>
              <Input
                id="edit-supplier_commission"
                type="number"
                step="0.01"
                value={formData.supplier_commission_rate}
                onChange={(e) => setFormData({ ...formData, supplier_commission_rate: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Commission/discount you receive from hotel (reduces your cost)
              </p>
            </div>
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
                      checked={formData.days_of_week[key]}
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
                <Label htmlFor="edit-min_nights">Min Nights</Label>
                <Input
                  id="edit-min_nights"
                  type="number"
                  min={1}
                  value={formData.min_nights}
                  onChange={(e) => setFormData({ ...formData, min_nights: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-max_nights">Max Nights</Label>
                <Input
                  id="edit-max_nights"
                  type="number"
                  min={1}
                  value={formData.max_nights}
                  onChange={(e) => setFormData({ ...formData, max_nights: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            {/* Board/Meal Plan Options */}
            <div className="space-y-4 border-t pt-4">
              <div>
                <h4 className="font-semibold mb-2">Board/Meal Plan Options</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Define available meal plans and their additional costs
                </p>
              </div>
              
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
                      // Check if board type already exists
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
            
            {/* Shoulder Night Rates */}
            <div className="space-y-4 border-t pt-4">
              <div>
                <h4 className="font-semibold mb-2">Shoulder Night Rates (Optional)</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Define rates for nights before/after the contract period
                </p>
              </div>
              
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
                        <span>-{index + 1}: {rate}€</span>
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
                        <span>+{index + 1}: {rate}€</span>
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

            {/* Attrition Stages */}
            <div className="space-y-4 border-t pt-4">
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
                            <span className="text-muted-foreground">- {stage.penalty_description}</span>
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

            {/* Payment Tracking */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <DollarIcon className="h-4 w-4 text-green-600" />
                <h4 className="font-semibold">Payment Schedule</h4>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-contracted_total">Contracted Payment Total</Label>
                <Input
                  id="edit-contracted_total"
                  type="number"
                  step="0.01"
                  value={formData.contracted_payment_total}
                  onChange={(e) => setFormData({ ...formData, contracted_payment_total: parseFloat(e.target.value) || 0 })}
                />
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

            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

