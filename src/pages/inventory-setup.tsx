import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { TestUnifiedInventory } from '@/components/test-unified-inventory'
import { DayOfWeekSelector } from '@/components/ui/day-of-week-selector'
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
  Plus, 
  Pencil, 
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  DollarSign,
  FileText,
  Package,
  Copy,
  Filter,
  Search,
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { useData, BoardType, OccupancyType } from '@/contexts/data-context'
import { HotelForm } from '@/components/forms/hotel-form'
import { ContractForm } from '@/components/forms/contract-form'
import { BOARD_TYPE_LABELS, calculatePriceBreakdown } from '@/lib/pricing'

interface InventorySetupProps {
  hideHeader?: boolean
}

export function InventorySetup({ hideHeader = false }: InventorySetupProps = {}) {
  const { 
    hotels, suppliers, contracts, rates, tours,
    addHotel, updateHotel,
    addContract, updateContract, deleteContract,
    addRate, updateRate, deleteRate
  } = useData()
  
  // State
  const [isHotelDialogOpen, setIsHotelDialogOpen] = useState(false)
  const [editingHotel, setEditingHotel] = useState<any | null>(null)
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<any | null>(null)
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<any | null>(null)
  const [selectedHotelForRate, setSelectedHotelForRate] = useState<any | null>(null)
  const [selectedContractForRate, setSelectedContractForRate] = useState<any | null>(null)
  
  // Filters
  const [filterTour, setFilterTour] = useState<string>('all')
  const [filterSupplier, setFilterSupplier] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Hotel form
  const [hotelForm, setHotelForm] = useState({
    name: '',
    location: '',
    city: '',
    country: '',
    star_rating: 3,
    phone: '',
    email: '',
    description: '',
    room_groups: [] as any[]
  })
  
  const [roomGroupForm, setRoomGroupForm] = useState({
    room_type: '',
    capacity: 2,
    description: '',
    features: ''
  })
  
  // Contract form (simplified state - full form handled by ContractForm component)
  const [contractForm, setContractForm] = useState<any>({
    hotel_id: 0,
    supplier_id: 0,
    tour_id: undefined,
    contract_name: '',
    valid_from: '',
    valid_to: '',
    pricing_strategy: 'per_occupancy',
    base_rate: 0,
    occupancy_rates: [],
    board_options: [],
    room_allocations: [],
    markup_percentage: 0.60,
    tax_rate: 0.12,
    supplier_commission_rate: 0.10,
    city_tax_per_person_per_night: 0,
    resort_fee_per_night: 0,
    currency: 'EUR',
    shoulder_periods: [],
    attrition_stages: [],
    cancellation_stages: [],
    payment_schedule: [],
    cancellation_policy: '',
    notes: '',
    days_of_week: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    },
    min_nights: 1,
    max_nights: 30,
    active: true
  })
  
  // Rate form
  const [rateForm, setRateForm] = useState({
    room_group_id: '',
    board_type: 'bed_breakfast' as BoardType,
    occupancy_type: 'double' as OccupancyType,
    base_rate: 0,
    tour_id: undefined as number | undefined,
    allocation_pool_id: undefined as string | undefined, // For multi-rate periods
    active: true,
    inactive_reason: '',
    valid_from: '',
    valid_to: '',
    days_of_week: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    },
    min_nights: undefined as number | undefined,
    max_nights: undefined as number | undefined,
    board_included: true,
    board_cost: 0,
    override_costs: false,
    tax_rate: 0,
    city_tax_per_person_per_night: 0,
    resort_fee_per_night: 0,
    supplier_commission_rate: 0,
    markup_percentage: 0.60,
  })
  
  
  // Form state for ContractForm component inputs
  const [boardTypeInput, setBoardTypeInput] = useState<BoardType>('bed_breakfast')
  const [boardCostInput, setBoardCostInput] = useState('')
  const [attritionDateInput, setAttritionDateInput] = useState('')
  const [attritionPercentInput, setAttritionPercentInput] = useState('')
  const [cancellationDateInput, setCancellationDateInput] = useState('')
  const [cancellationPenaltyInput, setCancellationPenaltyInput] = useState('')
  const [cancellationDescInput, setCancellationDescInput] = useState('')
  const [paymentDateInput, setPaymentDateInput] = useState('')
  const [paymentAmountInput, setPaymentAmountInput] = useState('')
  
  
  // Filtered contracts and rates
  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const matchesSupplier = filterSupplier === 'all' || contract.supplier_id.toString() === filterSupplier
      const matchesTour = filterTour === 'all' || contract.tour_ids?.includes(parseInt(filterTour))
      const matchesSearch = !searchTerm || 
        contract.contract_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSupplier && matchesTour && matchesSearch
    })
  }, [contracts, filterSupplier, filterTour, searchTerm])
  
  const filteredRates = useMemo(() => {
    return rates.filter(rate => {
      const contract = contracts.find(c => c.id === rate.contract_id)
      // Match tour: check rate.tour_id first, then contract.tour_ids, or show if no tour filter
      const matchesTour = filterTour === 'all' || 
        rate.tour_id?.toString() === filterTour ||
        contract?.tour_ids?.includes(parseInt(filterTour)) ||
        (!rate.tour_id && !contract?.tour_ids) // Include generic rates when showing all
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && rate.active) || 
        (filterStatus === 'inactive' && !rate.active)
      const matchesSearch = !searchTerm || 
        rate.roomName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesTour && matchesStatus && matchesSearch
    })
  }, [rates, contracts, filterTour, filterStatus, searchTerm])
  
  // Helper to add/remove room groups
  const addRoomGroup = () => {
    if (!roomGroupForm.room_type) {
      toast.error('Please enter a room type')
      return
    }
    
    const newRoomGroup = {
      id: `rg-${Date.now()}`,
      ...roomGroupForm
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
    setIsHotelDialogOpen(true)
  }
  
  const handleSaveHotel = () => {
    if (!hotelForm.name || !hotelForm.location) {
      toast.error('Please fill in required fields (name and location)')
      return
    }
    
    if (editingHotel) {
      updateHotel(editingHotel.id, hotelForm)
      toast.success('Hotel updated!')
    } else {
      addHotel(hotelForm)
      toast.success('Hotel created!')
    }
    setIsHotelDialogOpen(false)
  }
  
  
  // Contract handlers
  const handleOpenContractDialog = (hotel?: any, contract?: any, tourId?: number) => {
    if (contract) {
      setEditingContract(contract)
      setContractForm({
        ...contract,
        pre_shoulder_rates: contract.pre_shoulder_rates || [],
        post_shoulder_rates: contract.post_shoulder_rates || []
      })
    } else {
      setEditingContract(null)
      setContractForm({
        hotel_id: hotel?.id || 0,
        supplier_id: 0,
        tour_id: tourId,
        contract_name: '',
        valid_from: '',
        valid_to: '',
        pricing_strategy: 'per_occupancy',
        base_rate: 0,
        occupancy_rates: [],
        board_options: [],
        room_allocations: [],
        markup_percentage: 0.60,
        tax_rate: 0.12,
        supplier_commission_rate: 0.10,
        city_tax_per_person_per_night: 0,
        resort_fee_per_night: 0,
        currency: 'EUR',
        shoulder_periods: [],
        pre_shoulder_rates: [],
        post_shoulder_rates: [],
        attrition_stages: [],
        cancellation_stages: [],
        payment_schedule: [],
        cancellation_policy: '',
        notes: '',
        days_of_week: {
          mon: true,
          tue: true,
          wed: true,
          thu: true,
          fri: true,
          sat: true,
          sun: true
        },
        min_nights: 1,
        max_nights: 30,
        active: true
      })
    }
    setIsContractDialogOpen(true)
  }
  
  const handleSaveContract = () => {
    if (!contractForm.hotel_id || !contractForm.supplier_id || !contractForm.contract_name) {
      toast.error('Please fill in required fields')
      return
    }
    
    if (editingContract) {
      updateContract(editingContract.id, contractForm)
      toast.success('Contract updated!')
    } else {
      addContract(contractForm)
      toast.success('Contract created!')
    }
    setIsContractDialogOpen(false)
  }
  
  const handleDeleteContract = (contract: any) => {
    const contractRates = rates.filter(r => r.contract_id === contract.id)
    if (contractRates.length > 0) {
      toast.error(`Cannot delete contract with ${contractRates.length} rates`)
      return
    }
    
    if (confirm(`Delete contract "${contract.contract_name}"?`)) {
      deleteContract(contract.id)
      toast.success('Contract deleted')
    }
  }
  
  const handleCloneContract = (contract: any) => {
    setEditingContract(null)
    setContractForm({
      ...contract,
      contract_name: `${contract.contract_name} (Copy)`,
      valid_from: '',
      valid_to: '',
      payment_schedule: [],
      notes: `Cloned from: ${contract.contract_name}. Please update dates and payment details.`
    })
    setIsContractDialogOpen(true)
    toast.info('Review and update dates before saving', { duration: 5000 })
  }
  
  // Rate handlers
  const handleOpenRateDialog = (rate?: any, contract?: any, hotel?: any, tourId?: number) => {
    // Get hotel from contract if not directly provided
    const effectiveHotel = hotel || (contract ? hotels.find(h => h.id === contract.hotel_id) : null)
    setSelectedHotelForRate(effectiveHotel)
    setSelectedContractForRate(contract || null)
    
    if (rate) {
      setEditingRate(rate)
      setRateForm({
        room_group_id: rate.room_group_id,
        board_type: rate.board_type,
        occupancy_type: rate.occupancy_type,
        base_rate: rate.rate,
        tour_id: rate.tour_id,
        allocation_pool_id: rate.allocation_pool_id,
        active: rate.active,
        inactive_reason: rate.inactive_reason || '',
        valid_from: rate.valid_from || '',
        valid_to: rate.valid_to || '',
        days_of_week: rate.days_of_week || {
          mon: true,
          tue: true,
          wed: true,
          thu: true,
          fri: true,
          sat: true,
          sun: true
        },
        min_nights: rate.min_nights,
        max_nights: rate.max_nights,
        board_included: rate.board_included !== undefined ? rate.board_included : true,
        board_cost: rate.board_cost || 0,
        override_costs: rate.override_costs || false,
        tax_rate: rate.tax_rate || 0,
        city_tax_per_person_per_night: rate.city_tax_per_person_per_night || 0,
        resort_fee_per_night: rate.resort_fee_per_night || 0,
        supplier_commission_rate: rate.supplier_commission_rate || 0,
        markup_percentage: rate.markup_percentage || 0.60,
      })
    } else {
      setEditingRate(null)
      setRateForm({
        room_group_id: '',
        board_type: 'bed_breakfast',
        occupancy_type: 'double',
        base_rate: 0,
        tour_id: tourId,
        allocation_pool_id: undefined,
        active: true,
        inactive_reason: '',
        valid_from: contract?.start_date || '',
        valid_to: contract?.end_date || '',
        days_of_week: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: true
        },
        min_nights: contract?.min_nights,
        max_nights: contract?.max_nights,
        board_included: true,
        board_cost: 0,
        override_costs: false,
        tax_rate: 0,
        city_tax_per_person_per_night: 0,
        resort_fee_per_night: 0,
        supplier_commission_rate: 0,
        markup_percentage: contract?.markup_percentage || 0.60,
      })
    }
    setIsRateDialogOpen(true)
  }
  
  const handleSaveRate = () => {
    // Get contract from editing rate OR from selectedContractForRate (when adding new rate to contract)
    const selectedContract = editingRate?.contract_id 
      ? contracts.find(c => c.id === editingRate.contract_id)
      : selectedContractForRate
    
    if (!rateForm.room_group_id) {
      toast.error('Please select a room type')
      return
    }
    if (!rateForm.base_rate || rateForm.base_rate <= 0) {
      toast.error('Enter a valid base rate')
      return
    }
    
    // Validation for buy-to-order rates (no contract)
    if (!selectedContract && selectedHotelForRate) {
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
      tour_id: rateForm.tour_id,
      allocation_pool_id: rateForm.allocation_pool_id,
      active: rateForm.active,
      inactive_reason: rateForm.active ? undefined : rateForm.inactive_reason,
      valid_from: rateForm.valid_from || undefined,
      valid_to: rateForm.valid_to || undefined,
      days_of_week: rateForm.days_of_week,
      min_nights: rateForm.min_nights,
      max_nights: rateForm.max_nights,
      markup_percentage: rateForm.markup_percentage,
    }
    
    if (selectedContract) {
      // Contract-based rate
      rateData.contract_id = selectedContract.id
      rateData.board_included = true
      
      if (rateForm.override_costs) {
        if (rateForm.tax_rate) rateData.tax_rate = rateForm.tax_rate
        if (rateForm.city_tax_per_person_per_night) rateData.city_tax_per_person_per_night = rateForm.city_tax_per_person_per_night
        if (rateForm.resort_fee_per_night) rateData.resort_fee_per_night = rateForm.resort_fee_per_night
        if (rateForm.supplier_commission_rate) rateData.supplier_commission_rate = rateForm.supplier_commission_rate
        if (rateForm.board_cost > 0) {
          rateData.board_cost = rateForm.board_cost
          rateData.board_included = false
        }
      }
    } else if (selectedHotelForRate) {
      // Buy-to-order rate (no contract, linked to hotel)
      rateData.hotel_id = selectedHotelForRate.id
      rateData.estimated_costs = true
      rateData.board_cost = rateForm.board_cost // Per person per night
      rateData.board_included = false // Always separate for buy-to-order
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
  }
  
  const handleDeleteRate = (rate: any) => {
    if (confirm(`Delete rate for "${rate.roomName}"?`)) {
      deleteRate(rate.id)
      toast.success('Rate deleted')
    }
  }
  
  const handleCloneRate = (rate: any) => {
    // Get the contract and hotel for this rate
    const contract = contracts.find(c => c.id === rate.contract_id)
    const hotel = hotels.find(h => h.id === (rate.hotel_id || contract?.hotel_id))
    
    setEditingRate(null) // Not editing, creating new
    setSelectedHotelForRate(hotel || null)
    setSelectedContractForRate(contract || null)
    
    // Pre-fill form with cloned data, but clear dates and price for user to update
    setRateForm({
      room_group_id: rate.room_group_id,
      board_type: rate.board_type,
      occupancy_type: rate.occupancy_type,
      base_rate: 0, // Clear for user to enter new price
      tour_id: rate.tour_id,
      allocation_pool_id: rate.allocation_pool_id, // Keep same pool
      active: true,
      inactive_reason: '',
      valid_from: '', // Clear for user to enter new dates
      valid_to: '', // Clear for user to enter new dates
      days_of_week: rate.days_of_week || {
        mon: true,
        tue: true,
        wed: true,
        thu: true,
        fri: true,
        sat: true,
        sun: true
      },
      min_nights: rate.min_nights,
      max_nights: rate.max_nights,
      board_included: rate.board_included !== undefined ? rate.board_included : true,
      board_cost: rate.board_cost || 0,
      override_costs: rate.override_costs || false,
      tax_rate: rate.tax_rate || 0,
      city_tax_per_person_per_night: rate.city_tax_per_person_per_night || 0,
      resort_fee_per_night: rate.resort_fee_per_night || 0,
      supplier_commission_rate: rate.supplier_commission_rate || 0,
      markup_percentage: rate.markup_percentage || 0.60,
    })
    
    setIsRateDialogOpen(true)
    toast.info('Enter base rate and dates for the cloned rate', { duration: 3000 })
  }
  
  // Stats
  const stats = useMemo(() => {
    const totalContracts = contracts.length
    const totalRates = rates.length
    const activeRates = rates.filter(r => r.active).length
    
    return {
      hotels: hotels.length,
      contracts: totalContracts,
      rates: totalRates,
      activeRates
    }
  }, [hotels, contracts, rates])
  
  return (
    <div className="space-y-6">
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Hotel Inventory</h2>
            <p className="text-sm text-muted-foreground">
              Manage hotels, contracts, and rates
            </p>
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hotels</p>
                <p className="text-2xl font-bold">{stats.hotels}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contracts</p>
                <p className="text-2xl font-bold">{stats.contracts}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rates</p>
                <p className="text-2xl font-bold">{stats.rates}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Rates</p>
                <p className="text-2xl font-bold">{stats.activeRates}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium flex items-center gap-2">
                <Search className="h-3 w-3" />
                Search
              </Label>
              <Input
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
            
            <div className="grid gap-2">
              <Label className="text-xs font-medium flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Tour / Event
              </Label>
              <Select value={filterTour} onValueChange={setFilterTour}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tours</SelectItem>
                  {tours.map(tour => (
                    <SelectItem key={tour.id} value={tour.id.toString()}>
                      {tour.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label className="text-xs font-medium flex items-center gap-2">
                <Package className="h-3 w-3" />
                Supplier
              </Label>
              <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label className="text-xs font-medium flex items-center gap-2">
                <Filter className="h-3 w-3" />
                Status
              </Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              Showing {filteredContracts.length} contracts • {filteredRates.length} rates
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFilterTour('all')
                setFilterSupplier('all')
                setFilterStatus('all')
                setSearchTerm('')
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Content: Hotels Grouped by Tour */}
      {hotels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hotels yet. Add contracts and rates to get started.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={[]} className="space-y-2">
          {/* Generic Contracts Section (No Tour Linked) */}
          {(() => {
            const genericContracts = filteredContracts.filter(c => !c.tour_ids || c.tour_ids.length === 0)
            const genericRates = filteredRates.filter(r => {
              const contract = contracts.find(con => con.id === r.contract_id)
              return !contract?.tour_ids || contract.tour_ids.length === 0
            })
            
            return (
              <AccordionItem
                value="generic"
                className="border-2 rounded-lg bg-card"
                style={{ borderColor: 'hsl(var(--muted-foreground) / 0.2)' }}
              >
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div className="text-left">
                        <div className="font-bold text-base">Generic Hotels (No Tour)</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>Reusable across all tours</span>
                          <span>•</span>
                          <span>{genericContracts.length} {genericContracts.length === 1 ? 'contract' : 'contracts'}</span>
                          <span>•</span>
                          <span>{genericRates.length} {genericRates.length === 1 ? 'rate' : 'rates'}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">Generic</Badge>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                      These contracts and rates are not linked to any specific tour and can be used across all events.
                    </p>
                    
                    {genericContracts.length === 0 && genericRates.length === 0 ? (
                      <Card>
                        <CardContent className="py-8 text-center">
                          <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                          <h3 className="font-semibold text-lg mb-2">No Generic Inventory Yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Create contracts and rates that can be used across all tours
                          </p>
                          <div className="flex gap-2 justify-center">
                            {hotels.slice(0, 3).map(hotel => (
                              <Button
                                key={hotel.id}
                                variant="outline"
                                onClick={() => handleOpenContractDialog(hotel)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                {hotel.name}
                              </Button>
                            ))}
                            {hotels.length > 3 && (
                              <Button
                                variant="outline"
                                onClick={() => handleOpenContractDialog()}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                More...
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {/* Render generic contracts by hotel */}
                        {hotels
                          .filter(hotel => genericContracts.some(c => c.hotel_id === hotel.id))
                          .map(hotel => {
                            const hotelContracts = genericContracts.filter(c => c.hotel_id === hotel.id)
                            
                            return (
                              <div key={hotel.id} className="border-2 rounded-lg p-4">
                                {/* Hotel Header */}
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <Building2 className="h-5 w-5" />
                                    <div>
                                      <h3 className="font-bold text-base">{hotel.name}</h3>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                          {hotelContracts.length} {hotelContracts.length === 1 ? 'contract' : 'contracts'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleOpenHotelDialog(hotel)}
                                    >
                                      <Pencil className="h-3 w-3 mr-1" />
                                      Edit Hotel
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleOpenContractDialog(hotel)}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      New Contract
                                    </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenRateDialog(undefined, undefined, hotel, undefined)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Buy-to-Order Rate
                                  </Button>
                                  </div>
                                </div>
                                
                              {/* Allocation Pools Summary */}
                              {(() => {
                                // Get all pools for this hotel
                                const hotelPools = new Map<string, {
                                  poolId: string
                                  totalAllocation: number
                                  contracts: any[]
                                  rates: any[]
                                  booked: number
                                }>()
                                
                                hotelContracts.forEach(contract => {
                                  contract.room_allocations?.forEach((allocation: any) => {
                                    if (allocation.allocation_pool_id) {
                                      if (!hotelPools.has(allocation.allocation_pool_id)) {
                                        hotelPools.set(allocation.allocation_pool_id, {
                                          poolId: allocation.allocation_pool_id,
                                          totalAllocation: allocation.quantity,
                                          contracts: [],
                                          rates: [],
                                          booked: 0
                                        })
                                      }
                                      const pool = hotelPools.get(allocation.allocation_pool_id)!
                                      pool.contracts.push(contract)
                                    }
                                  })
                                })
                                
                                // Add rates to pools
                                const hotelRates = genericRates.filter(r => 
                                  r.hotel_id === hotel.id || 
                                  contracts.find(c => c.id === r.contract_id)?.hotel_id === hotel.id
                                )
                                hotelRates.forEach(rate => {
                                  if (rate.allocation_pool_id && hotelPools.has(rate.allocation_pool_id)) {
                                    hotelPools.get(rate.allocation_pool_id)!.rates.push(rate)
                                  }
                                })
                                
                                if (hotelPools.size > 0) {
                                  return (
                                    <div className="mb-4 space-y-2">
                                      <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Allocation Pools ({hotelPools.size})
                                      </h4>
                                      {Array.from(hotelPools.values()).map(pool => {
                                        const utilization = pool.totalAllocation > 0 
                                          ? (pool.booked / pool.totalAllocation) * 100 
                                          : 0
                                        const available = pool.totalAllocation - pool.booked
                                        
                                        return (
                                          <Card key={pool.poolId} className="bg-accent/30 border-accent">
                                            <CardContent className="p-3">
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                                    {pool.poolId}
                                                  </Badge>
                                                  <span className="text-xs text-muted-foreground">
                                                    {pool.contracts.length} contract{pool.contracts.length !== 1 ? 's' : ''} • {pool.rates.length} rate{pool.rates.length !== 1 ? 's' : ''}
                                                  </span>
                                                </div>
                                                <div className="text-xs font-medium">
                                                  {available}/{pool.totalAllocation} available
                                                </div>
                                              </div>
                                              <div className="w-full bg-muted rounded-full h-2">
                                                <div 
                                                  className={`h-2 rounded-full transition-all ${
                                                    utilization < 30 ? 'bg-chart-1' : 
                                                    utilization < 70 ? 'bg-chart-3' : 
                                                    'bg-destructive'
                                                  }`}
                                                  style={{ width: `${Math.min(utilization, 100)}%` }}
                                                />
                                              </div>
                                              <div className="text-xs text-muted-foreground mt-1">
                                                {utilization.toFixed(0)}% utilized
                                              </div>
                                            </CardContent>
                                          </Card>
                                        )
                                      })}
                                    </div>
                                  )
                                }
                                return null
                              })()}
                              
                              {/* Contracts List - Compact View */}
                              {hotelContracts.length > 0 && (
                                <div className="space-y-2 mb-4">
                                  <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Contracts ({hotelContracts.length})
                                  </h4>
                                  <div className="grid gap-2">
                                    {hotelContracts.map(contract => (
                                      <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                        <div>
                                          <div className="font-medium text-sm">{contract.contract_name}</div>
                                          <div className="text-xs text-muted-foreground mt-1">
                                            {contract.supplierName} • {genericRates.filter(r => r.contract_id === contract.id).length} rates • {((contract.markup_percentage || 0) * 100).toFixed(0)}% markup
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleOpenContractDialog(hotel, contract)}
                                          >
                                            <Pencil className="h-3 w-3 mr-1" />
                                            Edit
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleCloneContract(contract)}
                                          >
                                            <Copy className="h-3 w-3 mr-1" />
                                            Clone
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => handleOpenRateDialog(undefined, contract)}
                                          >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Rate
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteContract(contract)}
                                          >
                                            <Trash2 className="h-3 w-3 text-destructive" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Unified Rates Table - All Rates for This Hotel */}
                              {(() => {
                                const hotelRates = genericRates.filter(r => r.hotel_id === hotel.id || contracts.find(c => c.id === r.contract_id)?.hotel_id === hotel.id)
                                  
                                  if (hotelRates.length > 0) {
                                    return (
                                      <div className="space-y-3">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                          <DollarSign className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
                                          All Rates ({hotelRates.length})
                                        </h4>
                                        <Card>
                                          <CardContent className="p-0">
                                            <div className="overflow-x-auto">
                                              <table className="w-full text-sm">
                                                <thead style={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}>
                                                  <tr>
                                                    <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">Room Type</th>
                                                    <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">Source</th>
                                                    <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">Pool</th>
                                                    <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">Valid Dates</th>
                                                    <th className="text-center p-3 font-semibold text-xs uppercase tracking-wide">Board</th>
                                                    <th className="text-center p-3 font-semibold text-xs uppercase tracking-wide">Occupancy</th>
                                                    <th className="text-right p-3 font-semibold text-xs uppercase tracking-wide">Base Rate</th>
                                                    <th className="text-right p-3 font-semibold text-xs uppercase tracking-wide">Markup</th>
                                                    <th className="text-center p-3 font-semibold text-xs uppercase tracking-wide">Status</th>
                                                    <th className="text-center p-3 font-semibold text-xs uppercase tracking-wide">Actions</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {hotelRates.map((rate, idx) => {
                                                    const rateContract = contracts.find(c => c.id === rate.contract_id)
                                                    return (
                                                    <tr
                                                      key={rate.id}
                                                      className={`${rate.active ? 'hover:bg-muted/30' : 'opacity-50'} transition-colors`}
                                                      style={{ borderTop: idx > 0 ? '1px solid hsl(var(--border))' : 'none' }}
                                                    >
                                                      <td className="p-3">
                                                        <div className="font-medium">{rate.roomName}</div>
                                                      </td>
                                                      <td className="p-3">
                                                        {rateContract ? (
                                                          <div>
                                                            <div className="font-medium text-xs">{rateContract.contract_name}</div>
                                                            <div className="text-xs text-muted-foreground">{rateContract.supplierName}</div>
                                                          </div>
                                                        ) : (
                                                          <Badge variant="secondary" className="text-xs">
                                                            Buy-to-Order
                                                          </Badge>
                                                        )}
                                                      </td>
                                                      <td className="p-3">
                                                        {rate.allocation_pool_id ? (
                                                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                                            <Package className="h-3 w-3 mr-1" />
                                                            {rate.allocation_pool_id}
                                                          </Badge>
                                                        ) : (
                                                          <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                      </td>
                                                      <td className="p-3 text-center">
                                                        <div className="text-xs">{BOARD_TYPE_LABELS[rate.board_type]}</div>
                                                      </td>
                                                      <td className="p-3 text-center">
                                                        <Badge variant="outline" className="text-xs">
                                                          {rate.occupancy_type}
                                                        </Badge>
                                                      </td>
                                                      <td className="p-3 text-right text-muted-foreground font-mono">
                                                        {formatCurrency(rate.rate)}
                                                      </td>
                                                      <td className="p-3 text-right">
                                                        <div className="font-medium" style={{ color: 'hsl(var(--primary))' }}>
                                                          {((rate.markup_percentage || 0) * 100).toFixed(0)}%
                                                        </div>
                                                      </td>
                                                      <td className="p-3 text-center">
                                                        {rate.active ? (
                                                          <Badge className="text-xs bg-green-500 text-white">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Active
                                                          </Badge>
                                                        ) : (
                                                          <Badge variant="secondary" className="text-xs">
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                            Inactive
                                                          </Badge>
                                                        )}
                                                      </td>
                                                      <td className="p-3 text-center">
                                                        <div className="flex justify-center gap-1">
                                                          <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleOpenRateDialog(rate, undefined, hotel)}
                                                            title="Edit rate"
                                                          >
                                                            <Pencil className="h-3 w-3" />
                                                          </Button>
                                                          <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleCloneRate(rate)}
                                                            title="Clone rate"
                                                          >
                                                            <Copy className="h-3 w-3" />
                                                          </Button>
                                                          <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDeleteRate(rate)}
                                                            title="Delete rate"
                                                          >
                                                            <Trash2 className="h-3 w-3 text-destructive" />
                                                          </Button>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  )
                                                })}
                                                </tbody>
                                              </table>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      </div>
                                    )
                                  }
                                  return null
                                })()}
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })()}
          
          {/* Group by Tours */}
          {tours
            .filter(tour => filterTour === 'all' || tour.id.toString() === filterTour)
            .map(tour => {
              const tourContracts = filteredContracts.filter(c => c.tour_ids?.includes(tour.id))
              const tourRates = filteredRates.filter(r => {
                // Match if rate's tour_id matches, OR if rate's contract's tour_ids includes this tour
                if (r.tour_id === tour.id) return true
                const contract = contracts.find(con => con.id === r.contract_id)
                return contract?.tour_ids?.includes(tour.id)
              })
              
              const isEmpty = tourContracts.length === 0 && tourRates.length === 0
              
              return (
                <AccordionItem
                  key={tour.id}
                  value={`tour-${tour.id}`}
                  className="border-2 rounded-lg bg-card"
                  style={{ borderColor: 'hsl(var(--primary) / 0.2)' }}
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5" style={{ color: isEmpty ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary))' }} />
                        <div className="text-left">
                          <div className={`font-bold text-base ${isEmpty ? 'text-muted-foreground' : ''}`}>{tour.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>{new Date(tour.start_date).toLocaleDateString()} - {new Date(tour.end_date).toLocaleDateString()}</span>
                            {!isEmpty && (
                              <>
                                <span>•</span>
                                <span>{tourContracts.length} {tourContracts.length === 1 ? 'contract' : 'contracts'}</span>
                                <span>•</span>
                                <span>{tourRates.length} {tourRates.length === 1 ? 'rate' : 'rates'}</span>
                              </>
                            )}
                            {isEmpty && (
                              <>
                                <span>•</span>
                                <span className="text-orange-600 font-medium">No hotel inventory yet</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {isEmpty && <Badge variant="outline" className="text-orange-600 border-orange-600">Empty</Badge>}
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3 pt-2">
                      {/* Empty State */}
                      {isEmpty && (
                        <Card>
                          <CardContent className="py-8 text-center">
                            <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                            <h3 className="font-semibold text-lg mb-2">No Hotel Inventory for {tour.name}</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Add contracts and rates to manage hotel inventory for this tour
                            </p>
                            <div className="flex gap-3 justify-center">
                              <Button
                                variant="outline"
                                onClick={() => handleOpenContractDialog(undefined, undefined, tour.id)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Contract
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleOpenRateDialog(undefined, undefined, undefined, tour.id)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Rate
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Hotels for this tour */}
                      {!isEmpty && hotels
                        .filter(hotel => tourContracts.some(c => c.hotel_id === hotel.id))
                        .map(hotel => {
                          const hotelContracts = tourContracts.filter(c => c.hotel_id === hotel.id)
                          
                          return (
                            <div key={hotel.id} className="border-2 rounded-lg p-4">
                              {/* Hotel Header */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <Building2 className="h-5 w-5" />
                                  <div>
                                    <h3 className="font-bold text-base">{hotel.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {hotelContracts.length} {hotelContracts.length === 1 ? 'contract' : 'contracts'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenHotelDialog(hotel)}
                                  >
                                    <Pencil className="h-3 w-3 mr-1" />
                                    Edit Hotel
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleOpenContractDialog(hotel, undefined, tour.id)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    New Contract
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      // Open rate dialog without a contract (buy-to-order) with tour context
                                      handleOpenRateDialog(undefined, undefined, hotel, tour.id)
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Buy-to-Order Rate
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Allocation Pools Summary */}
                              {(() => {
                                // Get all pools for this hotel in this tour
                                const hotelPools = new Map<string, {
                                  poolId: string
                                  totalAllocation: number
                                  contracts: any[]
                                  rates: any[]
                                  booked: number
                                }>()
                                
                                hotelContracts.forEach(contract => {
                                  contract.room_allocations?.forEach((allocation: any) => {
                                    if (allocation.allocation_pool_id) {
                                      if (!hotelPools.has(allocation.allocation_pool_id)) {
                                        hotelPools.set(allocation.allocation_pool_id, {
                                          poolId: allocation.allocation_pool_id,
                                          totalAllocation: allocation.quantity,
                                          contracts: [],
                                          rates: [],
                                          booked: 0
                                        })
                                      }
                                      const pool = hotelPools.get(allocation.allocation_pool_id)!
                                      pool.contracts.push(contract)
                                    }
                                  })
                                })
                                
                                // Add rates to pools
                                const hotelTourRates = tourRates.filter(r => 
                                  r.hotel_id === hotel.id || 
                                  contracts.find(c => c.id === r.contract_id)?.hotel_id === hotel.id
                                )
                                hotelTourRates.forEach(rate => {
                                  if (rate.allocation_pool_id && hotelPools.has(rate.allocation_pool_id)) {
                                    hotelPools.get(rate.allocation_pool_id)!.rates.push(rate)
                                  }
                                })
                                
                                if (hotelPools.size > 0) {
                                  return (
                                    <div className="mb-4 space-y-2">
                                      <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Allocation Pools ({hotelPools.size})
                                      </h4>
                                      {Array.from(hotelPools.values()).map(pool => {
                                        const utilization = pool.totalAllocation > 0 
                                          ? (pool.booked / pool.totalAllocation) * 100 
                                          : 0
                                        const available = pool.totalAllocation - pool.booked
                                        
                                        return (
                                          <Card key={pool.poolId} className="bg-accent/30 border-accent">
                                            <CardContent className="p-3">
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                                    {pool.poolId}
                                                  </Badge>
                                                  <span className="text-xs text-muted-foreground">
                                                    {pool.contracts.length} contract{pool.contracts.length !== 1 ? 's' : ''} • {pool.rates.length} rate{pool.rates.length !== 1 ? 's' : ''}
                                                  </span>
                                                </div>
                                                <div className="text-xs font-medium">
                                                  {available}/{pool.totalAllocation} available
                                                </div>
                                              </div>
                                              <div className="w-full bg-muted rounded-full h-2">
                                                <div 
                                                  className={`h-2 rounded-full transition-all ${
                                                    utilization < 30 ? 'bg-chart-1' : 
                                                    utilization < 70 ? 'bg-chart-3' : 
                                                    'bg-destructive'
                                                  }`}
                                                  style={{ width: `${Math.min(utilization, 100)}%` }}
                                                />
                                              </div>
                                              <div className="text-xs text-muted-foreground mt-1">
                                                {utilization.toFixed(0)}% utilized
                                              </div>
                                            </CardContent>
                                          </Card>
                                        )
                                      })}
                                    </div>
                                  )
                                }
                                return null
                              })()}
                              
                              {/* Contracts List - Compact View */}
                              {hotelContracts.length > 0 && (
                                <div className="space-y-2 mb-4">
                                  <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Contracts ({hotelContracts.length})
                                  </h4>
                                  <div className="grid gap-2">
                                    {hotelContracts.map(contract => (
                                      <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                        <div>
                                          <div className="font-medium text-sm">{contract.contract_name}</div>
                                          <div className="text-xs text-muted-foreground mt-1">
                                            {contract.supplierName} • {tourRates.filter(r => r.contract_id === contract.id).length} rates • {((contract.markup_percentage || 0) * 100).toFixed(0)}% markup
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleOpenContractDialog(hotel, contract)}
                                          >
                                            <Pencil className="h-3 w-3 mr-1" />
                                            Edit
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleCloneContract(contract)}
                                          >
                                            <Copy className="h-3 w-3 mr-1" />
                                            Clone
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => handleOpenRateDialog(undefined, contract)}
                                          >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Rate
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteContract(contract)}
                                          >
                                            <Trash2 className="h-3 w-3 text-destructive" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Unified Rates Table - All Rates for This Hotel */}
                              {(() => {
                                const hotelRates = tourRates.filter(r => r.hotel_id === hotel.id || contracts.find(c => c.id === r.contract_id)?.hotel_id === hotel.id)
                                
                                if (hotelRates.length > 0) {
                                  return (
                                    <div className="space-y-3">
                                      <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
                                        All Rates ({hotelRates.length})
                                      </h4>
                                      <Card>
                                        <CardContent className="p-0">
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                              <thead style={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}>
                                                <tr>
                                                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">Room Type</th>
                                                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">Source</th>
                                                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">Pool</th>
                                                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">Valid Dates</th>
                                                  <th className="text-center p-3 font-semibold text-xs uppercase tracking-wide">Board</th>
                                                  <th className="text-center p-3 font-semibold text-xs uppercase tracking-wide">Occupancy</th>
                                                  <th className="text-right p-3 font-semibold text-xs uppercase tracking-wide">Base Rate</th>
                                                  <th className="text-right p-3 font-semibold text-xs uppercase tracking-wide">Markup</th>
                                                  <th className="text-center p-3 font-semibold text-xs uppercase tracking-wide">Status</th>
                                                  <th className="text-center p-3 font-semibold text-xs uppercase tracking-wide">Actions</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {hotelRates.map((rate, idx) => {
                                                  const rateContract = contracts.find(c => c.id === rate.contract_id)
                                                  return (
                                                  <tr
                                                    key={rate.id}
                                                    className={`${rate.active ? 'hover:bg-muted/30' : 'opacity-50'} transition-colors`}
                                                    style={{ borderTop: idx > 0 ? '1px solid hsl(var(--border))' : 'none' }}
                                                  >
                                                    <td className="p-3">
                                                      <div className="font-medium">{rate.roomName}</div>
                                                    </td>
                                                    <td className="p-3">
                                                      {rateContract ? (
                                                        <div>
                                                          <div className="font-medium text-xs">{rateContract.contract_name}</div>
                                                          <div className="text-xs text-muted-foreground">{rateContract.supplierName}</div>
                                                        </div>
                                                      ) : (
                                                        <Badge variant="secondary" className="text-xs">
                                                          Buy-to-Order
                                                        </Badge>
                                                      )}
                                                    </td>
                                                      <td className="p-3">
                                                        {rate.allocation_pool_id ? (
                                                          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                                            <Package className="h-3 w-3 mr-1" />
                                                            {rate.allocation_pool_id}
                                                          </Badge>
                                                        ) : (
                                                          <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                      </td>
                                                      <td className="p-3">
                                                        {rate.valid_from && rate.valid_to ? (
                                                          <div className="text-xs">
                                                            <div>{new Date(rate.valid_from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                                                            <div className="text-muted-foreground">to {new Date(rate.valid_to).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                          </div>
                                                        ) : rateContract ? (
                                                          <div className="text-xs text-muted-foreground">
                                                            <div>{new Date(rateContract.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                                                            <div>to {new Date(rateContract.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                          </div>
                                                        ) : (
                                                          <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                      </td>
                                                      <td className="p-3 text-center">
                                                        <div className="text-xs">{BOARD_TYPE_LABELS[rate.board_type]}</div>
                                                      </td>
                                                    <td className="p-3 text-center">
                                                      <Badge variant="outline" className="text-xs">
                                                        {rate.occupancy_type}
                                                      </Badge>
                                                    </td>
                                                    <td className="p-3 text-right text-muted-foreground font-mono">
                                                      {formatCurrency(rate.rate)}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                      <div className="font-medium" style={{ color: 'hsl(var(--primary))' }}>
                                                        {((rate.markup_percentage || 0) * 100).toFixed(0)}%
                                                      </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                      {rate.active ? (
                                                        <Badge className="text-xs bg-green-500 text-white">
                                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                                          Active
                                                        </Badge>
                                                      ) : (
                                                        <Badge variant="secondary" className="text-xs">
                                                          <XCircle className="h-3 w-3 mr-1" />
                                                          Inactive
                                                        </Badge>
                                                      )}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                      <div className="flex justify-center gap-1">
                                                        <Button
                                                          size="sm"
                                                          variant="ghost"
                                                          onClick={() => handleOpenRateDialog(rate, undefined, hotel)}
                                                          title="Edit rate"
                                                        >
                                                          <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                          size="sm"
                                                          variant="ghost"
                                                          onClick={() => handleCloneRate(rate)}
                                                          title="Clone rate"
                                                        >
                                                          <Copy className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                          size="sm"
                                                          variant="ghost"
                                                          onClick={() => handleDeleteRate(rate)}
                                                          title="Delete rate"
                                                        >
                                                          <Trash2 className="h-3 w-3 text-destructive" />
                                                        </Button>
                                                      </div>
                                                            </td>
                                                          </tr>
                                                  )
                                                })}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                </CardContent>
                                              </Card>
                                            </div>
                                          )
                                        }
                                        return null
                                      })()}
                            </div>
                          )
                        })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
        </Accordion>
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
            suppliers={suppliers}
            tours={tours}
            selectedHotel={hotels.find(h => h.id === contractForm.hotel_id)}
            boardTypeInput={boardTypeInput}
            setBoardTypeInput={setBoardTypeInput}
            boardCostInput={boardCostInput}
            setBoardCostInput={setBoardCostInput}
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
      
      {/* Rate Dialog - Full Complexity */}
      <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRate ? 'Edit Rate' : 'Create Rate'}</DialogTitle>
            <DialogDescription>
              {(() => {
                const selectedContract = editingRate?.contract_id 
                  ? contracts.find(c => c.id === editingRate.contract_id)
                  : selectedContractForRate
                return selectedContract 
                  ? `${selectedContract.contract_name} • ${selectedContract.currency}`
                  : `${selectedHotelForRate?.name || 'Hotel'} • Buy-to-Order (Estimated Costs)`
              })()}
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
                  {(() => {
                    // Get hotel from: selectedHotelForRate, or from editing rate's contract, or from contractForm
                    const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                    const hotel = selectedHotelForRate || 
                                 (selectedContract ? hotels.find(h => h.id === selectedContract.hotel_id) : null) ||
                                 hotels.find(h => h.id === contractForm.hotel_id)
                    
                    return hotel?.room_groups?.map((rg: any) => (
                      <SelectItem key={rg.id} value={rg.id}>
                        {rg.room_type} (Capacity: {rg.capacity})
                      </SelectItem>
                    ))
                  })()}
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
                  {(() => {
                    const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                    return selectedContract ? (
                      selectedContract.board_options?.map((o: any) => (
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
                    )
                  })()}
                </SelectContent>
              </Select>
            </div>

            {/* Tour Linking (Optional) - Only for buy-to-order or to override contract tour */}
            <div className="grid gap-2">
              <Label>Link to Tour (Optional)</Label>
              <Select
                value={rateForm.tour_id?.toString() || 'none'}
                onValueChange={(value) => setRateForm({ ...rateForm, tour_id: value === 'none' ? undefined : parseInt(value) })}
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
              <p className="text-xs text-muted-foreground">
                Link this rate to a specific tour. Leave as "No Tour" for generic rates usable across all tours.
              </p>
            </div>

            {/* Allocation Pool ID - Available for ALL rates */}
            <div className="grid gap-2 border-t pt-3">
              <Label className="text-sm flex items-center gap-2">
                <Package className="h-3 w-3" />
                Allocation Pool ID
              </Label>
              
              {(() => {
                // Get available pool IDs from current contract's allocations
                const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                const availablePools = selectedContract?.room_allocations
                  ?.filter(a => a.allocation_pool_id)
                  .map(a => a.allocation_pool_id!) || []
                
                // If contract has pools, show dropdown + manual input option
                if (availablePools.length > 0) {
                  return (
                    <>
                      <Select
                        value={rateForm.allocation_pool_id || 'none'}
                        onValueChange={(value) => setRateForm({ 
                          ...rateForm, 
                          allocation_pool_id: value === 'none' ? undefined : value 
                        })}
                      >
                        <SelectTrigger className="h-9">
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
                      <p className="text-xs text-muted-foreground">
                        Select a pool ID from this contract's allocations, or leave as "No Pool" for separate tracking.
                      </p>
                    </>
                  )
                }
                
                // No pools in contract - show manual input for buy-to-order or custom pools
                return (
                  <>
                    <Input
                      type="text"
                      value={rateForm.allocation_pool_id || ''}
                      onChange={(e) => setRateForm({ ...rateForm, allocation_pool_id: e.target.value || undefined })}
                      placeholder="e.g., dec-2025-double-pool"
                      className="h-9 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {selectedContract 
                        ? '⚠️ No pool IDs found in contract allocations. Add pool ID to contract allocation first, or enter manually for buy-to-order rates.'
                        : 'Enter a pool ID to share inventory across multiple rates (e.g., for multi-period pricing).'}
                    </p>
                  </>
                )
              })()}
              
              {rateForm.allocation_pool_id && (
                <p className="text-xs text-green-600">
                  ✓ This rate will share inventory with other rates in pool: <strong>{rateForm.allocation_pool_id}</strong>
                </p>
              )}
            </div>

            {/* Active Status */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="rate-active"
                  checked={rateForm.active}
                  onCheckedChange={(checked) => setRateForm({ ...rateForm, active: !!checked })}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="rate-active"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Active (available for booking)
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {rateForm.active 
                      ? '✓ This rate will appear in booking searches' 
                      : '⚠️ This rate will be hidden from bookings (inactive)'}
                  </p>
                </div>
              </div>

              {!rateForm.active && (
                <div className="grid gap-2 ml-6">
                  <Label className="text-xs">Reason for Deactivation (Optional)</Label>
                  <Input
                    value={rateForm.inactive_reason}
                    onChange={(e) => setRateForm({ ...rateForm, inactive_reason: e.target.value })}
                    placeholder="e.g., Seasonal closure, Maintenance, Overbooked"
                    className="h-8 text-xs"
                  />
                </div>
              )}
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
                  placeholder={(() => {
                    const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                    return selectedContract?.start_date
                  })()}
                />
                {(() => {
                  const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                  return selectedContract && (
                    <p className="text-[11px] text-muted-foreground">
                      Contract: {selectedContract.start_date}
                    </p>
                  )
                })()}
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
                  placeholder={(() => {
                    const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                    return selectedContract?.end_date
                  })()}
                  min={rateForm.valid_from}
                />
                {(() => {
                  const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                  return selectedContract && (
                    <p className="text-[11px] text-muted-foreground">
                      Contract: {selectedContract.end_date}
                    </p>
                  )
                })()}
              </div>

              {/* Days of Week Selector */}
              <div className="grid gap-2">
                <Label className="text-sm">Valid Days of Week</Label>
                <DayOfWeekSelector
                  value={{
                    monday: rateForm.days_of_week.monday,
                    tuesday: rateForm.days_of_week.tuesday,
                    wednesday: rateForm.days_of_week.wednesday,
                    thursday: rateForm.days_of_week.thursday,
                    friday: rateForm.days_of_week.friday,
                    saturday: rateForm.days_of_week.saturday,
                    sunday: rateForm.days_of_week.sunday
                  }}
                  onChange={(selection) => setRateForm({ 
                    ...rateForm, 
                    days_of_week: {
                      monday: selection.monday,
                      tuesday: selection.tuesday,
                      wednesday: selection.wednesday,
                      thursday: selection.thursday,
                      friday: selection.friday,
                      saturday: selection.saturday,
                      sunday: selection.sunday
                    }
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Select which days this rate is valid (leave all checked for any day)
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              {(() => {
                const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                return selectedContract 
                  ? 'This rate will only be available for bookings within these dates. Defaults to contract period.'
                  : '⚠️ Required for buy-to-order rates'
              })()}
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
                  placeholder={(() => {
                    const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                    return selectedContract?.min_nights?.toString() || '1'
                  })()}
                />
                {(() => {
                  const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                  return selectedContract && (
                    <p className="text-[11px] text-muted-foreground">
                      Contract: {selectedContract.min_nights || 1}
                    </p>
                  )
                })()}
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
                  placeholder={(() => {
                    const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                    return selectedContract?.max_nights?.toString() || '14'
                  })()}
                />
                {(() => {
                  const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                  return selectedContract && (
                    <p className="text-[11px] text-muted-foreground">
                      Contract: {selectedContract.max_nights || 14}
                    </p>
                  )
                })()}
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              {(() => {
                const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                return selectedContract 
                  ? 'Leave empty to use contract defaults. Set values to override for this rate.'
                  : '⚠️ Required for buy-to-order rates - specify minimum and maximum nights allowed.'
              })()}
            </p>


            <div className="grid gap-2">
              <Label>Room Rate per Night ({(() => {
                const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                return selectedContract?.currency || 'EUR'
              })()} *</Label>
              <Input
                type="number"
                step="0.01"
                value={rateForm.base_rate}
                onChange={(e) => setRateForm({ ...rateForm, base_rate: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 300.00"
              />
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                  return selectedContract ? (
                    <>Enter the BASE room-only rate for {rateForm.occupancy_type === 'single' ? '1 person' : rateForm.occupancy_type === 'double' ? '2 people' : rateForm.occupancy_type === 'triple' ? '3 people' : '4 people'}. Board cost ({(() => {
                      const peoplePerRoom = rateForm.occupancy_type === 'single' ? 1 : rateForm.occupancy_type === 'double' ? 2 : rateForm.occupancy_type === 'triple' ? 3 : 4
                      const boardOption = selectedContract.board_options?.find((b: any) => b.board_type === rateForm.board_type)
                      if (!boardOption) return '€0'
                      return `${formatCurrency(boardOption.additional_cost)}/person × ${peoplePerRoom} = ${formatCurrency(boardOption.additional_cost * peoplePerRoom)}`
                    })()}) will be added from contract.</>
                  ) : (
                    `Estimated BASE room rate for ${rateForm.occupancy_type === 'single' ? '1 person' : rateForm.occupancy_type === 'double' ? '2 people' : rateForm.occupancy_type === 'triple' ? '3 people' : '4 people'}. Enter board cost below.`
                  )
                })()}
              </p>
            </div>

            {/* Buy-to-Order: Board Cost Field (Always Required) */}
            {!contracts.find(c => c.id === editingRate?.contract_id) && (
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
              {(() => {
                const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                return selectedContract ? (
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
                )
              })()}

              {(rateForm.override_costs || !contracts.find(c => c.id === editingRate?.contract_id)) && (
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
                  {(() => {
                    const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
                    return selectedContract && (
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
                    )
                  })()}
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

              </div>
            </div>

            {/* Cost preview */}
            {rateForm.base_rate > 0 && (
              <div className="p-3 rounded-md border bg-muted/30 text-sm space-y-1">
                {(() => {
                  const selectedContract = contracts.find(c => c.id === editingRate?.contract_id)
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
                    const boardOption = selectedContract.board_options?.find((b: any) => b.board_type === rateForm.board_type)
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
                    </>
                  )
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 🧪 UNIFIED INVENTORY SYSTEM TEST COMPONENT */}
      <div className="mt-8 pt-8 border-t">
        <TestUnifiedInventory />
      </div>
    </div>
  )
}

