import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Building2, 
  FileText, 
  DollarSign, 
  Plus, 
  Pencil, 
  Trash2,
  Star,
  MapPin,
  Calendar,
  Bed,
} from 'lucide-react'
import { useData, Rate, BoardType, OccupancyType, RoomGroup, BoardOption, AttritionStage, CancellationStage, PaymentSchedule, RoomAllocation, OccupancyRate } from '@/contexts/data-context'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { BOARD_TYPE_LABELS, calculatePriceBreakdown } from '@/lib/pricing'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from 'sonner'
import { HotelForm } from '@/components/forms/hotel-form'
import { ContractForm } from '@/components/forms/contract-form'

export function InventorySetup() {
  const { 
    hotels, contracts, rates, bookings, tours,
    addHotel, updateHotel, deleteHotel,
    addContract, updateContract, deleteContract,
    addRate, updateRate, deleteRate
  } = useData()
  
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null)
  
  // Hotel dialog state
  const [isHotelDialogOpen, setIsHotelDialogOpen] = useState(false)
  const [editingHotel, setEditingHotel] = useState<any | null>(null)
  const [hotelForm, setHotelForm] = useState({
    name: '',
    location: '',
    city: '',
    country: '',
    star_rating: 3,
    phone: '',
    email: '',
    description: '',
    room_groups: [] as RoomGroup[]
  })
  const [roomGroupForm, setRoomGroupForm] = useState({
    room_type: '',
    capacity: 2,
    description: '',
    features: ''
  })

  // Contract dialog state
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<any | null>(null)
  const [contractForm, setContractForm] = useState({
    hotel_id: 0,
    contract_name: '',
    start_date: '',
    end_date: '',
    total_rooms: 0,
    base_rate: 0,
    currency: 'EUR',
    tour_ids: [] as number[],
    room_allocations: [] as RoomAllocation[],
    pricing_strategy: 'per_occupancy' as 'per_occupancy' | 'flat_rate',
    occupancy_rates: [] as OccupancyRate[],
    markup_percentage: 0.60,
    shoulder_markup_percentage: 0.30,
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
    notes: ''
  })
  
  // Additional contract form states
  const [boardTypeInput, setBoardTypeInput] = useState<BoardType>('room_only')
  const [boardCostInput, setBoardCostInput] = useState('')
  const [preShoulderInput, setPreShoulderInput] = useState('')
  const [postShoulderInput, setPostShoulderInput] = useState('')
  const [attritionDateInput, setAttritionDateInput] = useState('')
  const [attritionPercentInput, setAttritionPercentInput] = useState('')
  const [cancellationDateInput, setCancellationDateInput] = useState('')
  const [cancellationPenaltyInput, setCancellationPenaltyInput] = useState('')
  const [cancellationDescInput, setCancellationDescInput] = useState('')
  const [paymentDateInput, setPaymentDateInput] = useState('')
  const [paymentAmountInput, setPaymentAmountInput] = useState('')
  
  // Stock state removed - now managed in contract room_allocations

  // Rate dialog state (create/edit within Inventory Setup)
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<Rate | null>(null)
  const [rateForm, setRateForm] = useState({
    room_group_id: '',
    board_type: 'bed_breakfast' as BoardType,
    occupancy_type: 'double' as OccupancyType,
    base_rate: 0,
    // Validity dates (default from contract)
    valid_from: '',
    valid_to: '',
    // Night restrictions (default from contract)
    min_nights: undefined as number | undefined,
    max_nights: undefined as number | undefined,
    // Shoulder night rates (per occupancy)
    pre_shoulder_rates: [] as number[],
    post_shoulder_rates: [] as number[],
    // Board pricing
    board_included: true,
    board_cost: 0,
    // Rate-level cost overrides (optional)
    override_costs: false,
    tax_rate: 0,
    city_tax_per_person_per_night: 0,
    resort_fee_per_night: 0,
    supplier_commission_rate: 0,
    // Markup settings
    markup_percentage: 0.60, // 60% default
    shoulder_markup_percentage: 0.30, // 30% default
  })
  
  // State for adding shoulder rates
  const [preShoulderRateInput, setPreShoulderRateInput] = useState('')
  const [postShoulderRateInput, setPostShoulderRateInput] = useState('')

  // Get selected entities
  const selectedHotel = useMemo(() => 
    hotels.find(h => h.id === selectedHotelId),
    [hotels, selectedHotelId]
  )

  const hotelContracts = useMemo(() => 
    selectedHotelId ? contracts.filter(c => c.hotel_id === selectedHotelId) : [],
    [contracts, selectedHotelId]
  )

  const selectedContract = useMemo(() =>
    hotelContracts.find(c => c.id === selectedContractId),
    [hotelContracts, selectedContractId]
  )

  const contractRates = useMemo(() =>
    selectedContractId ? rates.filter(r => r.contract_id === selectedContractId) : [],
    [rates, selectedContractId]
  )

  // contractStocks removed - now use contract.room_allocations instead

  // Calculate rooms used for each contract
  const contractRoomUsage = useMemo(() => {
    return contracts.map(contract => {
      // Count rooms from bookings with rooms array
      const roomsUsed = bookings
        .filter(b => b.status !== 'cancelled' && b.rooms && b.rooms.length > 0)
        .flatMap(b => b.rooms)
        .filter(r => {
          // Check if room belongs to this contract
          // Method 1: Match by rate's contract_id (for regular inventory bookings)
          const rate = rates.find(rt => rt.id === r.rate_id)
          if (rate && rate.contract_id === contract.id) return true
          
          // Method 2: Match by contractName (for converted buy-to-order bookings)
          // This handles cases where rate_id points to old buy-to-order rate
          if (r.contractName === contract.contract_name && r.purchase_type === 'inventory') return true
          
          return false
        })
        .reduce((sum, r) => sum + r.quantity, 0)
      
      return {
        contractId: contract.id,
        totalRooms: contract.total_rooms,
        roomsUsed,
        roomsAvailable: contract.total_rooms - roomsUsed,
        usagePercentage: contract.total_rooms > 0 ? (roomsUsed / contract.total_rooms) * 100 : 0
      }
    })
  }, [contracts, bookings, rates])

  // Stats
  const hotelStats = useMemo(() => {
    return hotels.map(h => ({
      hotel: h,
      contractCount: contracts.filter(c => c.hotel_id === h.id).length,
      roomGroupCount: h.room_groups?.length || 0
    }))
  }, [hotels, contracts])

  // Hotel handlers
  const handleOpenHotelDialog = (hotel?: any) => {
    if (hotel) {
      setEditingHotel(hotel)
      setHotelForm({
        name: hotel.name,
        location: hotel.location,
        city: hotel.city || '',
        country: hotel.country || '',
        star_rating: hotel.star_rating || 3,
        phone: hotel.phone || '',
        email: hotel.email || '',
        description: hotel.description || '',
        room_groups: hotel.room_groups || []
      })
    } else {
      setEditingHotel(null)
      setHotelForm({
        name: '',
        location: '',
        city: '',
        country: '',
        star_rating: 3,
        phone: '',
        email: '',
        description: '',
        room_groups: []
      })
    }
    setRoomGroupForm({
      room_type: '',
      capacity: 2,
      description: '',
      features: ''
    })
    setIsHotelDialogOpen(true)
  }

  const addRoomGroup = () => {
    if (!roomGroupForm.room_type) {
      toast.error('Please enter a room type')
      return
    }
    
    const newRoomGroup: RoomGroup = {
      id: `rg_${Date.now()}`,
      room_type: roomGroupForm.room_type,
      capacity: roomGroupForm.capacity,
      description: roomGroupForm.description,
      features: roomGroupForm.features
    }
    
    setHotelForm({
      ...hotelForm,
      room_groups: [...hotelForm.room_groups, newRoomGroup]
    })
    
    setRoomGroupForm({
      room_type: '',
      capacity: 2,
      description: '',
      features: ''
    })
  }

  const removeRoomGroup = (id: string) => {
    setHotelForm({
      ...hotelForm,
      room_groups: hotelForm.room_groups.filter(rg => rg.id !== id)
    })
  }

  const handleSaveHotel = () => {
    if (!hotelForm.name || !hotelForm.location) {
      alert('Please fill in all required fields')
      return
    }

    const hotelData: any = {
      name: hotelForm.name,
      location: hotelForm.location,
      city: hotelForm.city,
      country: hotelForm.country,
      star_rating: hotelForm.star_rating,
      phone: hotelForm.phone,
      email: hotelForm.email,
      description: hotelForm.description,
      room_groups: hotelForm.room_groups
    }

    if (editingHotel) {
      updateHotel(editingHotel.id, hotelData)
      toast.success('Hotel updated successfully')
    } else {
      addHotel(hotelData)
      toast.success('Hotel added successfully')
    }

    setIsHotelDialogOpen(false)
    setEditingHotel(null)
  }

  const handleDeleteHotel = (hotelId: number) => {
    const hotelContracts = contracts.filter(c => c.hotel_id === hotelId)
    if (hotelContracts.length > 0) {
      alert(`Cannot delete hotel with ${hotelContracts.length} contract(s). Please delete contracts first.`)
      return
    }

    if (confirm('Are you sure you want to delete this hotel?')) {
      deleteHotel(hotelId)
      if (selectedHotelId === hotelId) {
        setSelectedHotelId(null)
        setSelectedContractId(null)
      }
      toast.success('Hotel deleted')
    }
  }

  // Contract handlers
  const handleOpenContractDialog = (contract?: any) => {
    if (contract) {
      setEditingContract(contract)
      setContractForm({
        hotel_id: contract.hotel_id,
        contract_name: contract.contract_name,
        start_date: contract.start_date,
        end_date: contract.end_date,
        total_rooms: contract.total_rooms,
        base_rate: contract.base_rate,
        currency: contract.currency,
        tour_ids: contract.tour_ids || [],
        room_allocations: contract.room_allocations || [],
        pricing_strategy: contract.pricing_strategy || 'per_occupancy',
        occupancy_rates: contract.occupancy_rates || [],
        markup_percentage: contract.markup_percentage ?? 0.60,
        shoulder_markup_percentage: contract.shoulder_markup_percentage ?? 0.30,
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
        notes: contract.notes || ''
      })
    } else {
      setEditingContract(null)
      setContractForm({
        hotel_id: selectedHotelId || 0,
        contract_name: '',
        start_date: '',
        end_date: '',
        total_rooms: 0,
        base_rate: 0,
        currency: 'EUR',
        tour_ids: [],
        room_allocations: [],
        pricing_strategy: 'per_occupancy',
        occupancy_rates: [],
        markup_percentage: 0.60,
        shoulder_markup_percentage: 0.30,
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
        notes: ''
      })
    }
    // Reset all input fields
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
    
    setIsContractDialogOpen(true)
  }

  const handleSaveContract = () => {
    if (!contractForm.hotel_id || !contractForm.contract_name || !contractForm.start_date || !contractForm.end_date) {
      alert('Please fill in all required fields')
      return
    }

    const contractData = {
      hotel_id: contractForm.hotel_id,
      contract_name: contractForm.contract_name,
      start_date: contractForm.start_date,
      end_date: contractForm.end_date,
      total_rooms: contractForm.total_rooms,
      base_rate: contractForm.base_rate,
      currency: contractForm.currency,
      tour_ids: contractForm.tour_ids,
      room_allocations: contractForm.room_allocations,
      pricing_strategy: contractForm.pricing_strategy,
      occupancy_rates: contractForm.occupancy_rates,
      markup_percentage: contractForm.markup_percentage,
      shoulder_markup_percentage: contractForm.shoulder_markup_percentage,
      days_of_week: contractForm.days_of_week,
      min_nights: contractForm.min_nights,
      max_nights: contractForm.max_nights,
      tax_rate: contractForm.tax_rate,
      city_tax_per_person_per_night: contractForm.city_tax_per_person_per_night,
      resort_fee_per_night: contractForm.resort_fee_per_night,
      supplier_commission_rate: contractForm.supplier_commission_rate,
      board_options: contractForm.board_options,
      pre_shoulder_rates: contractForm.pre_shoulder_rates,
      post_shoulder_rates: contractForm.post_shoulder_rates,
      attrition_stages: contractForm.attrition_stages,
      cancellation_stages: contractForm.cancellation_stages,
      contracted_payment_total: contractForm.contracted_payment_total,
      payment_schedule: contractForm.payment_schedule,
      notes: contractForm.notes
    }

    if (editingContract) {
      updateContract(editingContract.id, contractData)
      toast.success('Contract updated successfully')
    } else {
      addContract(contractData)
      
      // Calculate how many rates will be auto-generated
      const roomCount = contractData.room_allocations?.length || 0
      const boardCount = contractData.board_options?.length || 1
      const occupancyCount = contractData.pricing_strategy === 'flat_rate' 
        ? 1 
        : (contractData.occupancy_rates?.length || 1)
      const expectedRates = roomCount * boardCount * occupancyCount
      
      toast.success('Contract created!', {
        description: roomCount > 0 
          ? `Auto-generating ${expectedRates} rate${expectedRates > 1 ? 's' : ''} (${roomCount} rooms × ${boardCount} boards × ${occupancyCount} occupancies)`
          : 'Add room allocations to auto-generate rates',
        duration: 5000
      })
    }

    setIsContractDialogOpen(false)
    setEditingContract(null)
  }

  const handleDeleteContract = (contractId: number) => {
    const contractRates = rates.filter(r => r.contract_id === contractId)
    
    if (contractRates.length > 0) {
      alert(`Cannot delete contract with ${contractRates.length} rate(s). Please delete those first.`)
      return
    }

    if (confirm('Are you sure you want to delete this contract?')) {
      deleteContract(contractId)
      if (selectedContractId === contractId) {
        setSelectedContractId(null)
      }
      toast.success('Contract deleted')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Setup</h1>
          <p className="text-muted-foreground mt-1">
            Manage hotels, contracts, and pricing in one place
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-240px)]">
        {/* Left Panel: Hotels */}
        <Card className="col-span-3 flex flex-col">
          <CardHeader className="flex-none">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Hotels
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => handleOpenHotelDialog()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="space-y-2">
              {hotelStats.map(({ hotel, contractCount, roomGroupCount }) => (
                <div
                  key={hotel.id}
                  onClick={() => {
                    setSelectedHotelId(hotel.id)
                    setSelectedContractId(null)
                  }}
                  className={cn(
                    "p-2 rounded-md border cursor-pointer transition-colors hover:bg-accent",
                    selectedHotelId === hotel.id && "bg-accent border-primary"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{hotel.name}</p>
                        {hotel.star_rating && (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: hotel.star_rating }).map((_, i) => (
                              <Star key={i} className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        <span className="truncate">{hotel.location}</span>
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          {contractCount}C
                        </Badge>
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          {roomGroupCount}R
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-5 w-5 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenHotelDialog(hotel)
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-5 w-5 p-0 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteHotel(hotel.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {hotels.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hotels yet. Click + to add one.
                </p>
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        {/* Middle Panel: Contracts */}
        <Card className="col-span-4 flex flex-col">
          <CardHeader className="flex-none">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {selectedHotel ? `Contracts - ${selectedHotel.name}` : 'Contracts'}
              </CardTitle>
              {selectedHotel && (
                <Button size="sm" variant="outline" onClick={() => handleOpenContractDialog()}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="space-y-2">
              {selectedHotel ? (
                hotelContracts.length > 0 ? (
                  hotelContracts.map((contract) => (
                    <div
                      key={contract.id}
                      onClick={() => setSelectedContractId(contract.id)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                        selectedContractId === contract.id && "bg-accent border-primary"
                      )}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="font-medium">{contract.contract_name}</p>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6"
                              onClick={() => handleOpenContractDialog(contract)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6 text-destructive"
                              onClick={() => handleDeleteContract(contract.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3 w-3" />
                            Base: {formatCurrency(contract.base_rate)} {contract.currency}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Bed className="h-3 w-3" />
                            {(() => {
                              const usage = contractRoomUsage.find(u => u.contractId === contract.id)
                              if (!usage) return `${contract.total_rooms} total rooms`
                              return `${usage.roomsUsed}/${contract.total_rooms} rooms used (${usage.usagePercentage.toFixed(0)}%)`
                            })()}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(() => {
                            const usage = contractRoomUsage.find(u => u.contractId === contract.id)
                            if (usage) {
                              const isHighUsage = usage.usagePercentage >= 80
                              const isMediumUsage = usage.usagePercentage >= 50
                              return (
                                <Badge 
                                  variant={isHighUsage ? "destructive" : isMediumUsage ? "default" : "secondary"} 
                                  className="text-xs"
                                >
                                  {usage.roomsAvailable} rooms available
                                </Badge>
                              )
                            }
                            return null
                          })()}
                          {contract.tax_rate && (
                            <Badge variant="secondary" className="text-xs">
                              VAT {(contract.tax_rate * 100).toFixed(0)}%
                            </Badge>
                          )}
                          {contract.city_tax_per_person_per_night && (
                            <Badge variant="secondary" className="text-xs">
                              City Tax {contract.city_tax_per_person_per_night}€
                            </Badge>
                          )}
                          {contract.resort_fee_per_night && (
                            <Badge variant="secondary" className="text-xs">
                              Resort {contract.resort_fee_per_night}€
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No contracts for this hotel
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => {
                        toast.info('Contract Management', {
                          description: 'Please use the Contracts page from the main menu to create contracts.',
                          duration: 3000
                        })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Contract
                    </Button>
                  </div>
                )
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select a hotel to view contracts
                </p>
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        {/* Right Panel: Rates */}
        <Card className="col-span-5 flex flex-col">
          <CardHeader className="flex-none">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {selectedContract 
                  ? `Rates - ${selectedContract.contract_name}` 
                  : selectedHotel 
                    ? `Buy-to-Order Rates - ${selectedHotel.name}`
                    : 'Rates'}
              </CardTitle>
              {(selectedContract || selectedHotel) && (
                <Button size="sm" variant="outline" onClick={() => {
                  setEditingRate(null)
                  setRateForm({
                    room_group_id: '',
                    board_type: 'bed_breakfast',
                    occupancy_type: 'double',
                    base_rate: selectedContract?.base_rate || 0,
                    // Default validity dates from contract
                    valid_from: selectedContract?.start_date || '',
                    valid_to: selectedContract?.end_date || '',
                    // Default night restrictions from contract
                    min_nights: undefined,
                    max_nights: undefined,
                    // Shoulder rates (per occupancy, empty by default)
                    pre_shoulder_rates: [],
                    post_shoulder_rates: [],
                    board_included: !selectedContract, // For buy-to-order, board is separate by default
                    board_cost: 0,
                    override_costs: !selectedContract, // Force overrides for buy-to-order
                    tax_rate: selectedContract?.tax_rate || 0.10,
                    city_tax_per_person_per_night: selectedContract?.city_tax_per_person_per_night || 0,
                    resort_fee_per_night: selectedContract?.resort_fee_per_night || 0,
                    supplier_commission_rate: selectedContract?.supplier_commission_rate || 0,
                    markup_percentage: 0.60,
                    shoulder_markup_percentage: 0.30,
                  })
                  setPreShoulderRateInput('')
                  setPostShoulderRateInput('')
                  setIsRateDialogOpen(true)
                }}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent>
              {selectedContract ? (
                <>
                  <Accordion type="multiple" defaultValue={["contract-details", "rates"]} className="w-full">
                    {/* Contract Details Section */}
                    <AccordionItem value="contract-details">
                      <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5" />
                          Contract Details
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="p-2 rounded-md bg-muted/30 space-y-1.5">
                          <div className="flex items-center gap-3 text-xs flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Base:</span>
                              <span className="font-medium">{formatCurrency(selectedContract.base_rate)} {selectedContract.currency}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Rooms:</span>
                              <span className="font-medium">{selectedContract.total_rooms}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Period:</span>
                              <span className="font-medium">{formatDate(selectedContract.start_date)} - {formatDate(selectedContract.end_date)}</span>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Rates Section */}
                    <AccordionItem value="rates">
                      <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Rates
                          {contractRates.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {contractRates.length}
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {contractRates.length > 0 ? (
                    <div className="space-y-1">
                      {contractRates.map((rate) => {
                        // Calculate cost breakdown for display
                        const peoplePerRoom = rate.occupancy_type === 'single' ? 1 : rate.occupancy_type === 'double' ? 2 : rate.occupancy_type === 'triple' ? 3 : 4
                        
                        // Get board cost - use override if available, otherwise from contract
                        let boardCost = 0
                        if (rate.board_included) {
                          // Get from contract board options (per person per night)
                          const boardOption = selectedContract.board_options?.find(b => b.board_type === rate.board_type)
                          if (boardOption) {
                            boardCost = boardOption.additional_cost * peoplePerRoom // Multiply by occupancy!
                          }
                        } else {
                          // Use rate's override board cost (total per room)
                          boardCost = rate.board_cost || 0
                        }
                        
                        const baseRate = rate.rate // Already the correct rate for this occupancy
                        const breakdown = calculatePriceBreakdown(baseRate, selectedContract!, rate.occupancy_type, 1, boardCost, rate)
                        
                        return (
                        <div
                          key={rate.id}
                            className="p-2 rounded border hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm truncate">{rate.roomName}</span>
                                  <Badge variant="secondary" className="text-xs shrink-0">
                                    {rate.occupancy_type === 'single' ? '1p' : rate.occupancy_type === 'double' ? '2p' : rate.occupancy_type === 'triple' ? '3p' : '4p'}
                                </Badge>
                                  <Badge variant="outline" className="text-xs shrink-0">
                                  {BOARD_TYPE_LABELS[rate.board_type] || rate.board_type}
                                </Badge>
                              </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="font-medium text-primary">
                                {formatCurrency(rate.rate)} {selectedContract.currency}
                                  </span>
                                  <span>Base: {formatCurrency(baseRate)}</span>
                                  {boardCost > 0 && <span>+Board: {formatCurrency(boardCost)}</span>}
                                  <span>Cost: {formatCurrency(breakdown.totalCost)}</span>
                            </div>
                              </div>
                              <div className="flex gap-1 ml-2">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                  className="h-6 w-6"
                                onClick={() => {
                                    setEditingRate(rate)
                                    const hasOverrides = !!(rate.tax_rate || rate.city_tax_per_person_per_night || rate.resort_fee_per_night || rate.supplier_commission_rate)
                                    setRateForm({
                                      room_group_id: rate.room_group_id,
                                      board_type: rate.board_type,
                                      occupancy_type: rate.occupancy_type,
                                      base_rate: rate.rate,
                                      // Load validity dates from rate, fallback to contract
                                      valid_from: rate.valid_from || selectedContract?.start_date || '',
                                      valid_to: rate.valid_to || selectedContract?.end_date || '',
                                      // Load night restrictions
                                      min_nights: (rate as any).min_nights,
                                      max_nights: (rate as any).max_nights,
                                      // Load shoulder rates
                                      pre_shoulder_rates: (rate as any).pre_shoulder_rates || [],
                                      post_shoulder_rates: (rate as any).post_shoulder_rates || [],
                                      board_included: rate.board_included ?? true,
                                      board_cost: rate.board_cost || 0,
                                      override_costs: hasOverrides,
                                      tax_rate: rate.tax_rate || selectedContract?.tax_rate || 0,
                                      city_tax_per_person_per_night: rate.city_tax_per_person_per_night || selectedContract?.city_tax_per_person_per_night || 0,
                                      resort_fee_per_night: rate.resort_fee_per_night || selectedContract?.resort_fee_per_night || 0,
                                      supplier_commission_rate: rate.supplier_commission_rate || selectedContract?.supplier_commission_rate || 0,
                                      markup_percentage: rate.markup_percentage ?? 0.60,
                                      shoulder_markup_percentage: rate.shoulder_markup_percentage ?? 0.30,
                                    })
                                    setPreShoulderRateInput('')
                                    setPostShoulderRateInput('')
                                    setIsRateDialogOpen(true)
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                  className="h-6 w-6"
                                onClick={() => {
                                  if (confirm(`Delete rate for ${rate.roomName}?`)) {
                                    deleteRate(rate.id)
                                    toast.success('Rate deleted')
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No rates configured
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => {
                          toast.info('Rate Management', {
                            description: 'Please use the Rates page from the main menu to create rates.',
                            duration: 3000
                          })
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Rate
                      </Button>
                    </div>
                  )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Stock section removed - now managed in contract room_allocations */}
                  </Accordion>
                </>
              ) : selectedHotel ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      💡 Buy-to-Order / Ad-hoc Rates
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      Create estimated rates for {selectedHotel.name} without a contract. You'll manually enter all costs.
                    </p>
                  </div>
                  
                  {/* Show buy-to-order rates for this hotel */}
                  {rates.filter(r => r.hotel_id === selectedHotelId && !r.contract_id).length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Buy-to-Order Rates</p>
                      {rates
                        .filter(r => r.hotel_id === selectedHotelId && !r.contract_id)
                        .map((rate) => (
                          <div
                            key={rate.id}
                            className="p-2 rounded border hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{rate.roomName}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {rate.occupancy_type === 'single' ? '1p' : rate.occupancy_type === 'double' ? '2p' : rate.occupancy_type === 'triple' ? '3p' : '4p'}
                            </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {BOARD_TYPE_LABELS[rate.board_type]}
                                  </Badge>
                                  <Badge variant="default" className="text-xs">
                                    Buy-to-Order
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="font-medium text-primary">
                                    Base: {formatCurrency(rate.rate)} {rate.currency || 'EUR'}
                                  </span>
                                  {rate.board_cost && <span>+Board: {formatCurrency(rate.board_cost)}</span>}
                                  {rate.markup_percentage && <span>Markup: {(rate.markup_percentage * 100).toFixed(0)}%</span>}
                                </div>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6"
                                  onClick={() => {
                                    setEditingRate(rate)
                                    setRateForm({
                                      room_group_id: rate.room_group_id,
                                      board_type: rate.board_type,
                                      occupancy_type: rate.occupancy_type,
                                      base_rate: rate.rate,
                                      // Load validity dates from rate (buy-to-order rates should have these)
                                      valid_from: rate.valid_from || '',
                                      valid_to: rate.valid_to || '',
                                      // Load night restrictions
                                      min_nights: (rate as any).min_nights,
                                      max_nights: (rate as any).max_nights,
                                      // Load shoulder rates
                                      pre_shoulder_rates: (rate as any).pre_shoulder_rates || [],
                                      post_shoulder_rates: (rate as any).post_shoulder_rates || [],
                                      board_included: false,
                                      board_cost: rate.board_cost || 0,
                                      override_costs: true,
                                      tax_rate: rate.tax_rate || 0.10,
                                      city_tax_per_person_per_night: rate.city_tax_per_person_per_night || 0,
                                      resort_fee_per_night: rate.resort_fee_per_night || 0,
                                      supplier_commission_rate: rate.supplier_commission_rate || 0,
                                      markup_percentage: rate.markup_percentage ?? 0.60,
                                      shoulder_markup_percentage: rate.shoulder_markup_percentage ?? 0.30,
                                    })
                                    setPreShoulderRateInput('')
                                    setPostShoulderRateInput('')
                                    setIsRateDialogOpen(true)
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6"
                                  onClick={() => {
                                    if (confirm(`Delete buy-to-order rate for ${rate.roomName}?`)) {
                                      deleteRate(rate.id)
                                      toast.success('Rate deleted')
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No buy-to-order rates yet. Click + to create estimated rates.
                    </p>
                          )}
                        </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select a hotel to view rates
                </p>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>

      {/* Create/Edit Rate Dialog */}
      {(selectedContract || selectedHotel) && (
        <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRate ? 'Edit Rate' : 'Create Rate'}</DialogTitle>
              <DialogDescription>
                {selectedContract 
                  ? `${selectedContract.contract_name} • ${selectedContract.currency}`
                  : `${selectedHotel?.name} • Buy-to-Order (Estimated Costs)`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
                              <div className="grid gap-2">
                                <Label>Room Type *</Label>
                                <Select
                  value={rateForm.room_group_id}
                  onValueChange={(value) => setRateForm({ ...rateForm, room_group_id: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a room type" />
                                  </SelectTrigger>
                                  <SelectContent>
                    {(selectedHotel?.room_groups || []).map((rg) => (
                                      <SelectItem key={rg.id} value={rg.id}>
                                        {rg.room_type} (Capacity: {rg.capacity})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="grid gap-2">
                <Label>Occupancy Type *</Label>
                <Select
                  value={rateForm.occupancy_type}
                  onValueChange={(value: OccupancyType) => setRateForm({ ...rateForm, occupancy_type: value })}
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
                <p className="text-xs text-muted-foreground">
                  Create separate rates for each occupancy type you want to offer
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Board/Meal Plan *</Label>
                <Select
                  value={rateForm.board_type}
                  onValueChange={(value: BoardType) => setRateForm({ ...rateForm, board_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a board type" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedContract ? (
                      selectedContract.board_options?.map((o) => (
                        <SelectItem key={o.board_type} value={o.board_type}>
                          {BOARD_TYPE_LABELS[o.board_type]} {o.additional_cost > 0 && `(+${o.additional_cost} ${selectedContract.currency})`}
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

              {/* Validity Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label className="text-sm flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Valid From
                  </Label>
                  <Input
                    type="date"
                    value={rateForm.valid_from}
                    onChange={(e) => setRateForm({ ...rateForm, valid_from: e.target.value })}
                    placeholder={selectedContract?.start_date}
                  />
                  {selectedContract && (
                    <p className="text-[11px] text-muted-foreground">
                      Contract: {selectedContract.start_date}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Valid To
                  </Label>
                  <Input
                    type="date"
                    value={rateForm.valid_to}
                    onChange={(e) => setRateForm({ ...rateForm, valid_to: e.target.value })}
                    placeholder={selectedContract?.end_date}
                    min={rateForm.valid_from}
                  />
                  {selectedContract && (
                    <p className="text-[11px] text-muted-foreground">
                      Contract: {selectedContract.end_date}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                {selectedContract 
                  ? 'This rate will only be available for bookings within these dates. Defaults to contract period.'
                  : '⚠️ Required for buy-to-order rates'
                }
              </p>

              {/* Night Restrictions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label className="text-sm">Min Nights</Label>
                  <Input
                    type="number"
                    min={1}
                    value={rateForm.min_nights ?? ''}
                    onChange={(e) => setRateForm({ 
                      ...rateForm, 
                      min_nights: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    placeholder={selectedContract?.min_nights?.toString() || '1'}
                  />
                  {selectedContract && (
                    <p className="text-[11px] text-muted-foreground">
                      Contract: {selectedContract.min_nights || 1}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm">Max Nights</Label>
                  <Input
                    type="number"
                    min={rateForm.min_nights || 1}
                    value={rateForm.max_nights ?? ''}
                    onChange={(e) => setRateForm({ 
                      ...rateForm, 
                      max_nights: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    placeholder={selectedContract?.max_nights?.toString() || '14'}
                  />
                  {selectedContract && (
                    <p className="text-[11px] text-muted-foreground">
                      Contract: {selectedContract.max_nights || 14}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                {selectedContract 
                  ? 'Leave empty to use contract defaults. Set values to override for this rate.'
                  : '⚠️ Required for buy-to-order rates - specify minimum and maximum nights allowed.'
                }
              </p>

              {/* Shoulder Night Rates */}
              <div className="space-y-3 pt-2">
                <div className="border-t pt-3">
                  <Label className="text-sm font-medium">Shoulder Night Rates (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Define special rates for nights outside the validity period for this occupancy type.
                  </p>
                  
                  {/* Pre-shoulder rates */}
                  <div className="space-y-2">
                    <Label className="text-xs">Pre-Shoulder Rates (Before validity period)</Label>
                    {rateForm.pre_shoulder_rates.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {rateForm.pre_shoulder_rates.map((rate, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            Day-{idx+1}: {formatCurrency(rate)}
                            <button
                              onClick={() => {
                                const newRates = rateForm.pre_shoulder_rates.filter((_, i) => i !== idx)
                                setRateForm({ ...rateForm, pre_shoulder_rates: newRates })
                              }}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Rate (e.g., 250.00)"
                        value={preShoulderRateInput}
                        onChange={(e) => setPreShoulderRateInput(e.target.value)}
                        className="text-xs h-8"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => {
                          const value = parseFloat(preShoulderRateInput)
                          if (value > 0) {
                            setRateForm({
                              ...rateForm,
                              pre_shoulder_rates: [...rateForm.pre_shoulder_rates, value]
                            })
                            setPreShoulderRateInput('')
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Post-shoulder rates */}
                  <div className="space-y-2 mt-3">
                    <Label className="text-xs">Post-Shoulder Rates (After validity period)</Label>
                    {rateForm.post_shoulder_rates.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {rateForm.post_shoulder_rates.map((rate, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            Day+{idx+1}: {formatCurrency(rate)}
                            <button
                              onClick={() => {
                                const newRates = rateForm.post_shoulder_rates.filter((_, i) => i !== idx)
                                setRateForm({ ...rateForm, post_shoulder_rates: newRates })
                              }}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Rate (e.g., 250.00)"
                        value={postShoulderRateInput}
                        onChange={(e) => setPostShoulderRateInput(e.target.value)}
                        className="text-xs h-8"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => {
                          const value = parseFloat(postShoulderRateInput)
                          if (value > 0) {
                            setRateForm({
                              ...rateForm,
                              post_shoulder_rates: [...rateForm.post_shoulder_rates, value]
                            })
                            setPostShoulderRateInput('')
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Room Rate per Night ({selectedContract?.currency || 'EUR'}) *</Label>
                                <Input
                                  type="number"
                  step="0.01"
                  value={rateForm.base_rate}
                  onChange={(e) => setRateForm({ ...rateForm, base_rate: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 300.00"
                />
                <p className="text-xs text-muted-foreground">
                  {selectedContract ? (
                    <>Enter the BASE room-only rate for {rateForm.occupancy_type === 'single' ? '1 person' : rateForm.occupancy_type === 'double' ? '2 people' : rateForm.occupancy_type === 'triple' ? '3 people' : '4 people'}. Board cost ({(() => {
                      const peoplePerRoom = rateForm.occupancy_type === 'single' ? 1 : rateForm.occupancy_type === 'double' ? 2 : rateForm.occupancy_type === 'triple' ? 3 : 4
                      const boardOption = selectedContract.board_options?.find(b => b.board_type === rateForm.board_type)
                      if (!boardOption) return '£0'
                      return `${formatCurrency(boardOption.additional_cost)}/person × ${peoplePerRoom} = ${formatCurrency(boardOption.additional_cost * peoplePerRoom)}`
                    })()}) will be added from contract.</>
                  ) : (
                    `Estimated BASE room rate for ${rateForm.occupancy_type === 'single' ? '1 person' : rateForm.occupancy_type === 'double' ? '2 people' : rateForm.occupancy_type === 'triple' ? '3 people' : '4 people'}. Enter board cost below.`
                  )}
                </p>
                              </div>

              {/* Buy-to-Order: Board Cost Field (Always Required) */}
              {!selectedContract && (
                              <div className="grid gap-2">
                  <Label>Board Cost (per person per night) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rateForm.board_cost}
                    onChange={(e) => setRateForm({ ...rateForm, board_cost: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 12.15"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cost per person for {BOARD_TYPE_LABELS[rateForm.board_type]}. Will be multiplied by occupancy.
                  </p>
                            </div>
                          )}

              {/* Cost Overrides / Estimated Costs */}
              <div className="border-t pt-3 space-y-3">
                {selectedContract ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Cost Overrides (Optional)</p>
                      <Checkbox
                        id="override_costs"
                        checked={rateForm.override_costs}
                        onCheckedChange={(checked) => setRateForm({ ...rateForm, override_costs: !!checked })}
                      />
                                    </div>
                    <p className="text-xs text-muted-foreground">
                      Override contract-level costs (taxes, commission, board) for this specific rate
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">Estimated Costs (Required for Buy-to-Order)</p>
                    <p className="text-xs text-muted-foreground">
                      Enter estimated costs since there's no contract. These will be used for pricing calculations.
                    </p>
                  </>
                )}

                {(rateForm.override_costs || !selectedContract) && (
                  <div className="ml-6 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-1">
                        <Label className="text-xs">VAT / Tax Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={rateForm.tax_rate * 100}
                          onChange={(e) => setRateForm({ ...rateForm, tax_rate: (parseFloat(e.target.value) || 0) / 100 })}
                          placeholder="e.g., 12"
                          className="h-8"
                        />
                                  </div>
                      <div className="grid gap-1">
                        <Label className="text-xs">Commission Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={rateForm.supplier_commission_rate * 100}
                          onChange={(e) => setRateForm({ ...rateForm, supplier_commission_rate: (parseFloat(e.target.value) || 0) / 100 })}
                          placeholder="e.g., 10"
                          className="h-8"
                        />
                                  </div>
                                </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-1">
                        <Label className="text-xs">City Tax (per person/night)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={rateForm.city_tax_per_person_per_night}
                          onChange={(e) => setRateForm({ ...rateForm, city_tax_per_person_per_night: parseFloat(e.target.value) || 0 })}
                          placeholder="e.g., 3"
                          className="h-8"
                        />
                            </div>
                      <div className="grid gap-1">
                        <Label className="text-xs">Resort Fee (per room/night)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={rateForm.resort_fee_per_night}
                          onChange={(e) => setRateForm({ ...rateForm, resort_fee_per_night: parseFloat(e.target.value) || 0 })}
                          placeholder="e.g., 5"
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Board Cost Override (total per room/night)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={rateForm.board_cost}
                        onChange={(e) => setRateForm({ ...rateForm, board_cost: parseFloat(e.target.value) || 0 })}
                        placeholder="Leave empty to use contract board cost"
                        className="h-8"
                      />
                      <p className="text-xs text-muted-foreground">
                        Override the board cost from contract (e.g., 24.29 for this specific rate)
                      </p>
                    </div>
                  </div>
                          )}
                        </div>

              {/* Markup Settings */}
              <div className="border-t pt-3 space-y-3">
                <p className="text-sm font-medium">Markup Settings</p>
                <p className="text-xs text-muted-foreground">
                  Define your selling price markup on the cost price
                </p>
                
                <div className="space-y-3">
                  <div className="grid gap-2">
                    <Label>Default Markup (Regular Nights) *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="1"
                        value={rateForm.markup_percentage * 100}
                        onChange={(e) => setRateForm({ ...rateForm, markup_percentage: (parseFloat(e.target.value) || 0) / 100 })}
                        placeholder="e.g., 60"
                        className="h-9"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Markup applied to regular tour nights (default: 60%)
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label>Shoulder Night Markup *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="1"
                        value={rateForm.shoulder_markup_percentage * 100}
                        onChange={(e) => setRateForm({ ...rateForm, shoulder_markup_percentage: (parseFloat(e.target.value) || 0) / 100 })}
                        placeholder="e.g., 30"
                        className="h-9"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Markup for pre/post shoulder nights (default: 30%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost preview */}
              {rateForm.base_rate > 0 && (
                <div className="p-3 rounded-md border bg-muted/30 text-sm space-y-1">
                  {(() => {
                    const peoplePerRoom = rateForm.occupancy_type === 'single' ? 1 : rateForm.occupancy_type === 'double' ? 2 : rateForm.occupancy_type === 'triple' ? 3 : 4
                    
                    // Get board cost
                    let boardCost = 0
                    if (!selectedContract) {
                      // Buy-to-order: use entered board cost (per person) * occupancy
                      boardCost = (rateForm.board_cost || 0) * peoplePerRoom
                    } else if (rateForm.override_costs && rateForm.board_cost > 0) {
                      // Contract rate with board override (total per room)
                      boardCost = rateForm.board_cost
                    } else {
                      // Get from contract's board options (per person per night)
                      const boardOption = selectedContract.board_options?.find(b => b.board_type === rateForm.board_type)
                      if (boardOption) {
                        boardCost = boardOption.additional_cost * peoplePerRoom // Multiply by occupancy!
                      }
                    }
                    
                    // Create mock contract for buy-to-order
                    const mockContract = selectedContract || {
                      tax_rate: rateForm.tax_rate,
                      city_tax_per_person_per_night: rateForm.city_tax_per_person_per_night,
                      resort_fee_per_night: rateForm.resort_fee_per_night,
                      supplier_commission_rate: rateForm.supplier_commission_rate,
                    }
                    
                    // Create mock rate object for preview
                    const mockRate = {
                      ...rateForm,
                      tax_rate: (rateForm.override_costs || !selectedContract) ? rateForm.tax_rate : undefined,
                      city_tax_per_person_per_night: (rateForm.override_costs || !selectedContract) ? rateForm.city_tax_per_person_per_night : undefined,
                      resort_fee_per_night: (rateForm.override_costs || !selectedContract) ? rateForm.resort_fee_per_night : undefined,
                      supplier_commission_rate: (rateForm.override_costs || !selectedContract) ? rateForm.supplier_commission_rate : undefined,
                    }
                    
                    const breakdown = calculatePriceBreakdown(
                      rateForm.base_rate,
                      mockContract as any,
                      rateForm.occupancy_type,
                      1,
                      boardCost,
                      mockRate as any
                    )
                    
                    const sellingPriceRegular = breakdown.totalCost * (1 + rateForm.markup_percentage)
                    const sellingPriceShoulder = breakdown.totalCost * (1 + rateForm.shoulder_markup_percentage)
                    
                    return (
                      <>
                        <div className="flex justify-between"><span className="text-muted-foreground">Base Room Rate:</span><span>{formatCurrency(rateForm.base_rate)}</span></div>
                        {boardCost > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{BOARD_TYPE_LABELS[rateForm.board_type]} ({peoplePerRoom} people):</span><span>+{formatCurrency(boardCost)}</span></div>}
                        {breakdown.supplierCommission > 0 && <div className="flex justify-between text-green-600"><span className="text-muted-foreground">Supplier Commission:</span><span>-{formatCurrency(breakdown.supplierCommission)}</span></div>}
                        {breakdown.resortFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Resort Fee:</span><span>+{formatCurrency(breakdown.resortFee)}</span></div>}
                        {breakdown.vat > 0 && <div className="flex justify-between"><span className="text-muted-foreground">VAT:</span><span>+{formatCurrency(breakdown.vat)}</span></div>}
                        {breakdown.cityTax > 0 && <div className="flex justify-between"><span className="text-muted-foreground">City Tax ({peoplePerRoom} people):</span><span>+{formatCurrency(breakdown.cityTax)}</span></div>}
                        <div className="border-t pt-2 flex justify-between font-semibold"><span>Total Cost Price:</span><span className="text-primary">{formatCurrency(breakdown.totalCost)}</span></div>
                        <div className="flex justify-between text-xs mt-2 text-muted-foreground"><span>Selling Price (Regular {(rateForm.markup_percentage * 100).toFixed(0)}%):</span><span className="font-medium text-green-600">{formatCurrency(sellingPriceRegular)}</span></div>
                        <div className="flex justify-between text-xs text-muted-foreground"><span>Selling Price (Shoulder {(rateForm.shoulder_markup_percentage * 100).toFixed(0)}%):</span><span className="font-medium text-blue-600">{formatCurrency(sellingPriceShoulder)}</span></div>
                      </>
                    )
                  })()}
                </div>
              )}
      </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRateDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                if (!rateForm.room_group_id) { toast.error('Please select a room type'); return }
                if (!rateForm.base_rate || rateForm.base_rate <= 0) { toast.error('Enter a valid base rate'); return }
                
                // Validation for buy-to-order rates
                if (!selectedContract) {
                  // Buy-to-order MUST have validity dates and night restrictions
                  if (!rateForm.valid_from || !rateForm.valid_to) {
                    toast.error('Buy-to-order rates require validity dates')
                    return
                  }
                  if (!rateForm.min_nights || !rateForm.max_nights) {
                    toast.error('Buy-to-order rates require min/max nights')
                    return
                  }
                }
                
                const rateData: any = {
                  room_group_id: rateForm.room_group_id,
                  occupancy_type: rateForm.occupancy_type,
                  board_type: rateForm.board_type,
                  rate: rateForm.base_rate,
                  // Validity dates
                  valid_from: rateForm.valid_from || undefined,
                  valid_to: rateForm.valid_to || undefined,
                  // Night restrictions
                  min_nights: rateForm.min_nights,
                  max_nights: rateForm.max_nights,
                  // Shoulder night rates (per occupancy)
                  pre_shoulder_rates: rateForm.pre_shoulder_rates.length > 0 ? rateForm.pre_shoulder_rates : undefined,
                  post_shoulder_rates: rateForm.post_shoulder_rates.length > 0 ? rateForm.post_shoulder_rates : undefined,
                  // Markup settings
                  markup_percentage: rateForm.markup_percentage,
                  shoulder_markup_percentage: rateForm.shoulder_markup_percentage,
                }

                // Contract-based rate
                if (selectedContract) {
                  rateData.contract_id = selectedContract.id
                  rateData.board_included = true // Board from contract by default
                  
                  // Add rate-level cost overrides if enabled
                  if (rateForm.override_costs) {
                    if (rateForm.tax_rate) rateData.tax_rate = rateForm.tax_rate
                    if (rateForm.city_tax_per_person_per_night) rateData.city_tax_per_person_per_night = rateForm.city_tax_per_person_per_night
                    if (rateForm.resort_fee_per_night) rateData.resort_fee_per_night = rateForm.resort_fee_per_night
                    if (rateForm.supplier_commission_rate) rateData.supplier_commission_rate = rateForm.supplier_commission_rate
                    // Add board cost override if specified
                    if (rateForm.board_cost > 0) {
                      rateData.board_cost = rateForm.board_cost
                      rateData.board_included = false // Mark as separate when overridden
                    }
                  }
                } else if (selectedHotel) {
                  // Buy-to-order rate (hotel-based, no contract)
                  rateData.hotel_id = selectedHotel.id
                  rateData.estimated_costs = true
                  rateData.board_cost = rateForm.board_cost // Per person per night
                  rateData.board_included = false // Always separate for buy-to-order
                  // Add all estimated costs
                  rateData.tax_rate = rateForm.tax_rate
                  rateData.city_tax_per_person_per_night = rateForm.city_tax_per_person_per_night
                  rateData.resort_fee_per_night = rateForm.resort_fee_per_night
                  rateData.supplier_commission_rate = rateForm.supplier_commission_rate
                  rateData.currency = 'EUR' // Default currency for buy-to-order
                }

                if (editingRate) {
                  updateRate(editingRate.id, rateData)
                  toast.success('Rate updated')
                } else {
                  addRate(rateData)
                  toast.success(selectedContract ? 'Rate created' : 'Buy-to-order rate created')
                }
                setIsRateDialogOpen(false)
              }}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Quick Actions Bar */}
      {selectedHotel && (
        <Card className="bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium">
                  Selected: <span className="text-primary">{selectedHotel.name}</span>
                  {selectedContract && (
                    <> → <span className="text-primary">{selectedContract.contract_name}</span></>
                  )}
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {hotelContracts.length} contracts • {contractRates.length} rates configured
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleOpenHotelDialog(selectedHotel)}>
                  View Hotel Details
                </Button>
                {selectedContract && (
                  <Button size="sm" variant="outline" onClick={() => handleOpenContractDialog(selectedContract)}>
                    View Contract Details
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hotel Dialog */}
      <Dialog open={isHotelDialogOpen} onOpenChange={setIsHotelDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingHotel ? 'Edit Hotel' : 'Add New Hotel'}</DialogTitle>
            <DialogDescription>
              {editingHotel ? 'Update hotel information and room types' : 'Enter hotel details and configure room types'}
            </DialogDescription>
          </DialogHeader>
          <HotelForm
            formData={hotelForm}
            setFormData={setHotelForm}
            roomGroupForm={roomGroupForm}
            setRoomGroupForm={setRoomGroupForm}
            addRoomGroup={addRoomGroup}
            removeRoomGroup={removeRoomGroup}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHotelDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveHotel}>
              {editingHotel ? 'Update Hotel' : 'Create Hotel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Dialog */}
      <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
        <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContract ? 'Edit Contract' : 'Add New Contract'}</DialogTitle>
            <DialogDescription>
              {editingContract ? 'Update contract details and pricing' : 'Configure contract terms and pricing'}
            </DialogDescription>
          </DialogHeader>
          <ContractForm
            formData={contractForm}
            setFormData={setContractForm}
            hotels={hotels}
            tours={tours}
            selectedHotel={hotels.find(h => h.id === contractForm.hotel_id)}
            boardTypeInput={boardTypeInput}
            setBoardTypeInput={setBoardTypeInput}
            boardCostInput={boardCostInput}
            setBoardCostInput={setBoardCostInput}
            preShoulderInput={preShoulderInput}
            setPreShoulderInput={setPreShoulderInput}
            postShoulderInput={postShoulderInput}
            setPostShoulderInput={setPostShoulderInput}
            attritionDateInput={attritionDateInput}
            setAttritionDateInput={setAttritionDateInput}
            attritionPercentInput={attritionPercentInput}
            setAttritionPercentInput={setAttritionPercentInput}
            cancellationDateInput={cancellationDateInput}
            setCancellationDateInput={setCancellationDateInput}
            cancellationPenaltyInput={cancellationPenaltyInput}
            setCancellationPenaltyInput={setCancellationPenaltyInput}
            cancellationDescInput={cancellationDescInput}
            setCancellationDescInput={setCancellationDescInput}
            paymentDateInput={paymentDateInput}
            setPaymentDateInput={setPaymentDateInput}
            paymentAmountInput={paymentAmountInput}
            setPaymentAmountInput={setPaymentAmountInput}
            isEditing={!!editingContract}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContractDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveContract}>
              {editingContract ? 'Update Contract' : 'Create Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

