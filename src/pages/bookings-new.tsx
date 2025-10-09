import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { BOARD_TYPE_LABELS } from '@/lib/pricing'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData, Booking, OccupancyType, Rate, Contract, BookingRoom } from '@/contexts/data-context'
import { Plus, ShoppingCart, Trash2, Calendar, Info, Check, Building2, DoorOpen, TrendingUp, DollarSign, Percent, Package } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { formatCurrency } from '@/lib/utils'
import { calculatePriceBreakdown } from '@/lib/pricing'
import { toast } from 'sonner'

// Cart item structure
interface CartItem {
  rate: Rate
  contract: Contract
  quantity: number
  occupancy_type: OccupancyType
  nights: number
  pricePerRoom: number // Price per room for entire stay
  totalPrice: number // quantity × pricePerRoom
}

// Compact Room Rate Card - Shows contracts for a room type
function CompactRoomCard({ 
  roomGroup, 
  nights, 
  onAddToCart 
}: { 
  roomGroup: {
    roomGroupId: string
    roomName: string
    rates: Array<{ rate: Rate; contract: Contract; available: number; hotel: any }>
    totalAvailable: number
    minPrice: number
    maxMargin: number
  }
  nights: number
  onAddToCart: (rateItem: any, quantity: number, occupancy: OccupancyType) => void
}) {
  // Get available occupancy types from rates
  const availableOccupancies = useMemo(() => {
    const occupancies = new Set<OccupancyType>()
    roomGroup.rates.forEach(r => occupancies.add(r.rate.occupancy_type))
    return Array.from(occupancies).sort()
  }, [roomGroup.rates])
  
  const [selectedQty, setSelectedQty] = useState(1)
  const [selectedOcc, setSelectedOcc] = useState<OccupancyType>(availableOccupancies[0] || 'double')
  const [selectedRateId, setSelectedRateId] = useState<number | undefined>(undefined)
  
  // Calculate contract options based on selected occupancy
  const contractOptions = useMemo(() => {
    return roomGroup.rates
      .filter(rateItem => rateItem.rate.occupancy_type === selectedOcc)
      .map(rateItem => {
        const { rate, contract } = rateItem
        const boardCost = contract.board_options?.find(o => o.board_type === rate.board_type)?.additional_cost || 0
        const baseRate = rate.rate - boardCost
        const breakdown = calculatePriceBreakdown(baseRate, contract, selectedOcc, nights, boardCost)
        
        // breakdown.totalCost already includes all nights - don't multiply again!
        const costPerRoom = breakdown.totalCost
        const sellPerRoom = costPerRoom * 1.6
        const marginPerRoom = sellPerRoom - costPerRoom
        const marginPercent = ((marginPerRoom / costPerRoom) * 100)
        
        return {
          ...rateItem,
          costPerRoom,
          sellPerRoom,
          marginPerRoom,
          marginPercent,
          commissionRate: contract.supplier_commission_rate || 0
        }
      })
      .sort((a, b) => b.marginPerRoom - a.marginPerRoom)
  }, [roomGroup.rates, nights, selectedOcc])
  
  // Set default selected rate when contract options change or occupancy changes
  useEffect(() => {
    if (contractOptions.length > 0) {
      // If current selection is not in the list, select the first one
      const isValid = contractOptions.some(opt => opt.rate.id === selectedRateId)
      if (!isValid) {
        setSelectedRateId(contractOptions[0].rate.id)
      }
    }
  }, [contractOptions, selectedRateId])
  
  const selectedRateItem = contractOptions.find(r => r.rate.id === selectedRateId) || contractOptions[0]
  
  const selectedPrice = useMemo(() => {
    if (!selectedRateItem) return { cost: 0, sell: 0, margin: 0 }
    
    const { rate, contract } = selectedRateItem
    const boardCost = contract.board_options?.find(o => o.board_type === rate.board_type)?.additional_cost || 0
    const baseRate = rate.rate - boardCost
    const breakdown = calculatePriceBreakdown(baseRate, contract, selectedOcc, nights, boardCost)
    
    // breakdown.totalCost already includes all nights - don't multiply again!
    const costPerRoom = breakdown.totalCost
    const sellPerRoom = costPerRoom * 1.6
    
    return {
      cost: costPerRoom * selectedQty,
      sell: sellPerRoom * selectedQty,
      margin: (sellPerRoom - costPerRoom) * selectedQty
    }
  }, [selectedRateItem, selectedQty, selectedOcc, nights])
  
  return (
    <div className="border rounded-lg">
      {/* Room Header - Always Visible */}
      <div className="p-3 bg-muted/30">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <DoorOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium text-sm">{roomGroup.roomName}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {roomGroup.totalAvailable} available
              </span>
              <span>{roomGroup.rates.length} contract{roomGroup.rates.length > 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="font-medium text-sm">{formatCurrency(roomGroup.minPrice)}</div>
            <div className="text-muted-foreground">from</div>
          </div>
        </div>
      </div>

      {/* Contract Selection Accordion */}
      <Accordion type="single" collapsible className="border-0">
        <AccordionItem value="contracts" className="border-0">
          <AccordionTrigger className="px-3 py-2 text-xs hover:no-underline">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              Select Contract ({contractOptions.length} for {selectedOcc})
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3">
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {contractOptions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No contracts available for {selectedOcc} occupancy
                </p>
              )}
              {contractOptions.map((option, idx) => {
                const isSelected = selectedRateId === option.rate.id
                const isBest = idx === 0
                
                return (
                  <button
                    key={option.rate.id}
                    onClick={() => setSelectedRateId(option.rate.id)}
                    className={`w-full text-left p-2 rounded border transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30 hover:bg-accent/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium truncate">{option.contract.contract_name}</span>
                          {isBest && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Best</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(option.costPerRoom)}
                          </span>
                          <Separator orientation="vertical" className="h-3" />
                          <span className="flex items-center gap-0.5 text-green-600">
                            <Percent className="h-3 w-3" />
                            {option.marginPercent.toFixed(0)}%
                          </span>
                          <Separator orientation="vertical" className="h-3" />
                          <span>{option.available} avail</span>
                        </div>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Booking Controls */}
      <div className="p-3 space-y-2 border-t">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-muted-foreground">Occupancy</Label>
            <Select value={selectedOcc} onValueChange={(v) => setSelectedOcc(v as OccupancyType)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableOccupancies.map(occ => (
                  <SelectItem key={occ} value={occ} className="text-xs capitalize">
                    {occ} {occ === 'single' && '(1p)'}
                    {occ === 'double' && '(2p)'}
                    {occ === 'triple' && '(3p)'}
                    {occ === 'quad' && '(4p)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Quantity</Label>
            <Input 
              type="number" 
              min={1}
              max={selectedRateItem?.available || 1}
              value={selectedQty}
              onChange={(e) => setSelectedQty(Math.min(
                selectedRateItem?.available || 1, 
                Math.max(1, parseInt(e.target.value) || 1)
              ))}
              className="h-8 text-xs"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
          <div>
            <div className="text-muted-foreground">{selectedQty}× {nights}n ({selectedOcc})</div>
            <div className="font-medium text-green-600">+{formatCurrency(selectedPrice.margin)} margin</div>
            {selectedRateItem && (
              <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                {selectedRateItem.contract.contract_name}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{formatCurrency(selectedPrice.sell)}</div>
            <div className="text-muted-foreground text-[10px]">cost: {formatCurrency(selectedPrice.cost)}</div>
          </div>
        </div>
        
        <Button 
          onClick={() => {
            if (selectedRateItem) {
              onAddToCart(selectedRateItem, selectedQty, selectedOcc)
            }
          }}
          size="sm"
          className="w-full h-8 text-xs"
          disabled={!selectedRateItem || contractOptions.length === 0}
        >
          <ShoppingCart className="h-3 w-3 mr-1.5" />
          Add to Cart
        </Button>
      </div>
    </div>
  )
}

export function BookingsNew() {
  const navigate = useNavigate()
  const { bookings, tours, rates, contracts, hotels, addBooking, cancelBooking } = useData()
  
  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  
  // Booking wizard state
  const [currentStep, setCurrentStep] = useState<'tour' | 'shop' | 'cart' | 'checkout'>('tour')
  const [selectedTourId, setSelectedTourId] = useState(0)
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  
  // Customer details
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  
  // Filters for shopping
  const [filterOccupancy, setFilterOccupancy] = useState<OccupancyType | 'all'>('all')
  const [filterBoardType, setFilterBoardType] = useState<string>('all')
  const [filterRoomType, setFilterRoomType] = useState<string>('all')
  
  // View booking dialog
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null)

  const selectedTour = useMemo(() => 
    tours.find(t => t.id === selectedTourId),
    [tours, selectedTourId]
  )

  // Calculate nights
  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0
    const start = new Date(checkInDate)
    const end = new Date(checkOutDate)
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  }, [checkInDate, checkOutDate])

  // Get available rates based on tour dates
  const availableRates = useMemo(() => {
    if (!checkInDate || !checkOutDate) return []
    
    const start = new Date(checkInDate)
    const end = new Date(checkOutDate)
    
    return rates
      .map(rate => {
        const contract = contracts.find(c => c.id === rate.contract_id)
        if (!contract) return null
        
        // Filter by tour if contract is linked to specific tours
        if (contract.tour_ids && contract.tour_ids.length > 0) {
          if (!contract.tour_ids.includes(selectedTourId)) {
            return null // Contract not linked to this tour
          }
        }
        
        // Check rate validity dates (if specified), otherwise use contract dates
        const rateStart = rate.valid_from ? new Date(rate.valid_from) : new Date(contract.start_date)
        const rateEnd = rate.valid_to ? new Date(rate.valid_to) : new Date(contract.end_date)
        
        // Booking must fall within rate's validity period
        if (rateStart > end || rateEnd < start) return null
        
        // Check night restrictions (rate-level overrides contract-level)
        const rateMinNights = (rate as any).min_nights ?? contract.min_nights ?? 1
        const rateMaxNights = (rate as any).max_nights ?? contract.max_nights ?? 365
        const bookingNights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        
        if (bookingNights < rateMinNights || bookingNights > rateMaxNights) return null
        
        // Calculate availability from contract allocations
        const allocation = contract.room_allocations?.find(a => a.room_group_ids.includes(rate.room_group_id))
        if (!allocation) return null
        
        // Calculate already booked rooms for this ALLOCATION POOL
        // For shared allocations (e.g., Double/Twin), count bookings across ALL room types in the pool
        const bookedForAllocation = bookings
          .filter(b => b.status !== 'cancelled' && b.rooms && b.rooms.length > 0)
          .flatMap(b => b.rooms)
          .filter(r => {
            if (!r) return false
            
            // Method 1: Match by rate's contract_id (for regular inventory bookings)
            if (r.rate_id) {
              const bookedRate = rates.find(rt => rt.id === r.rate_id)
              if (bookedRate && 
                  bookedRate.contract_id === contract.id && 
                  allocation.room_group_ids.includes(bookedRate.room_group_id)) {
                return true
              }
            }
            
            // Method 2: Match by contractName (for converted buy-to-order bookings)
            // This handles cases where rate_id points to old buy-to-order rate that doesn't exist
            if (r.contractName === contract.contract_name && r.purchase_type === 'inventory') {
              // Try to find room_group_id by room name
              const hotel = hotels.find(h => h.id === contract.hotel_id)
              const roomGroup = hotel?.room_groups?.find(rg => rg.room_type === r.roomName)
              if (roomGroup && allocation.room_group_ids.includes(roomGroup.id)) {
                return true
              }
            }
            
            return false
          })
          .reduce((sum, r) => sum + r.quantity, 0)
        
        const available = allocation.quantity - bookedForAllocation
        
        if (available <= 0) return null
        
        return {
          rate,
          contract,
          available, // This is now the SHARED availability for all occupancies of this room type
          hotel: hotels.find(h => h.id === contract.hotel_id)
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter(item => {
        // Apply filters
        if (filterOccupancy !== 'all' && item.rate.occupancy_type !== filterOccupancy) return false
        if (filterBoardType !== 'all' && item.rate.board_type !== filterBoardType) return false
        if (filterRoomType !== 'all' && item.rate.room_group_id !== filterRoomType) return false
        return true
      })
  }, [checkInDate, checkOutDate, rates, contracts, bookings, hotels, filterOccupancy, filterBoardType, filterRoomType])

  // Group rates: Hotel -> Room -> Contracts
  const groupedByHotel = useMemo(() => {
    const hotelGroups = new Map<number, {
      hotelId: number
      hotelName: string
      roomGroups: Array<{
        roomGroupId: string
        roomName: string
        rates: typeof availableRates
        totalAvailable: number
        minPrice: number
        maxMargin: number
      }>
      allocationMap: Map<string, number> // Track allocations to avoid double-counting shared pools
    }>()
    
    availableRates.forEach(item => {
      const hotelId = item.hotel?.id || 0
      
      // Create hotel group if doesn't exist
      if (!hotelGroups.has(hotelId)) {
        hotelGroups.set(hotelId, {
          hotelId,
          hotelName: item.hotel?.name || '',
          roomGroups: [],
          allocationMap: new Map<string, number>() // Track allocations
        })
      }
      
      const hotelGroup = hotelGroups.get(hotelId)!
      
      // Find or create room group within hotel
      let roomGroup = hotelGroup.roomGroups.find(rg => rg.roomGroupId === item.rate.room_group_id)
      
      if (!roomGroup) {
        const newRoomGroup = {
          roomGroupId: item.rate.room_group_id,
          roomName: item.rate.roomName,
          rates: [],
          totalAvailable: 0,
          minPrice: Infinity,
          maxMargin: 0,
          contractAvailability: new Map<number, number>() // Track per contract
        } as any
        hotelGroup.roomGroups.push(newRoomGroup)
        roomGroup = newRoomGroup
      }
      
      roomGroup!.rates.push(item)
      
      // Track availability per contract (different occupancies share the same pool)
      const contractId = item.contract?.id || 0
      const contractAvailMap = (roomGroup! as any).contractAvailability as Map<number, number>
      
      // Set availability for this contract (all occupancies of same contract have same value)
      if (!contractAvailMap.has(contractId)) {
        contractAvailMap.set(contractId, item.available)
      }
      
      // Sum availability across unique contracts
      roomGroup!.totalAvailable = Array.from(contractAvailMap.values()).reduce((sum, avail) => sum + avail, 0)
      
      // Track allocation at hotel level to avoid double-counting shared pools
      // Create unique key: contractId + allocation (to handle shared Double/Twin pools)
      if (item.contract && item.contract.room_allocations) {
        const allocation = item.contract.room_allocations.find((a: any) => a.room_group_ids.includes(item.rate.room_group_id))
        if (allocation) {
          // Create unique allocation key (contract + all room types in allocation)
          const allocationKey = `${contractId}-${allocation.room_group_ids.sort().join('-')}`
          
          // Only add this allocation's availability once
          if (!hotelGroup.allocationMap.has(allocationKey)) {
            hotelGroup.allocationMap.set(allocationKey, item.available)
          }
        }
      }
      
      // Calculate price for comparison
      const boardCost = item.contract.board_options?.find(o => o.board_type === item.rate.board_type)?.additional_cost || 0
      const baseRate = item.rate.rate - boardCost
      const breakdown = calculatePriceBreakdown(baseRate, item.contract, 'double', nights, boardCost)
      // breakdown.totalCost already includes all nights - don't multiply again!
      const costPerRoom = breakdown.totalCost
      
      roomGroup!.minPrice = Math.min(roomGroup!.minPrice, costPerRoom)
      
      // Calculate margin
      const sellPerRoom = costPerRoom * 1.6
      const margin = sellPerRoom - costPerRoom
      roomGroup!.maxMargin = Math.max(roomGroup!.maxMargin, margin)
    })
    
    // Sort hotels by name, and rooms within each hotel
    return Array.from(hotelGroups.values())
      .sort((a, b) => a.hotelName.localeCompare(b.hotelName))
      .map(hotel => ({
        ...hotel,
        roomGroups: hotel.roomGroups.sort((a, b) => a.roomName.localeCompare(b.roomName))
      }))
  }, [availableRates, nights])

  // Get unique room types for filter
  const roomTypes = useMemo(() => {
    const typesMap = new Map<string, string>()
    availableRates.forEach(item => {
      // Store room_group_id -> roomName mapping
      if (!typesMap.has(item.rate.room_group_id)) {
        typesMap.set(item.rate.room_group_id, item.rate.roomName)
      }
    })
    return Array.from(typesMap.entries()).map(([id, name]) => ({ id, name }))
  }, [availableRates])

  // Add to cart
  const addToCart = (rateItem: NonNullable<typeof availableRates[0]>, quantity: number, occupancyType: OccupancyType) => {
    const { rate, contract } = rateItem
    
    // Calculate price
    const boardCost = contract.board_options?.find(o => o.board_type === rate.board_type)?.additional_cost || 0
    const baseRate = rate.rate - boardCost
    
    const breakdown = calculatePriceBreakdown(
      baseRate,
      contract,
      occupancyType,
      nights,
      boardCost
    )
    
    // breakdown.totalCost already includes all nights - don't multiply again!
    const pricePerRoom = breakdown.totalCost
    const totalPrice = pricePerRoom * quantity
    
    const cartItem: CartItem = {
      rate,
      contract,
      quantity,
      occupancy_type: occupancyType,
      nights,
      pricePerRoom,
      totalPrice
    }
    
    console.log('Adding to cart:', { roomName: rate.roomName, occupancy: occupancyType, price: totalPrice })
    
    setCart([...cart, cartItem])
    toast.success(`Added ${quantity}× ${rate.roomName} (${occupancyType}) to cart`)
  }

  // Remove from cart
  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
    toast.info('Removed from cart')
  }

  // Update cart quantity
  const updateCartQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(index)
      return
    }
    
    const newCart = [...cart]
    const item = newCart[index]
    item.quantity = newQuantity
    item.totalPrice = item.pricePerRoom * newQuantity
    setCart(newCart)
  }

  // Cart totals
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0)
  }, [cart])

  const cartRoomCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  // Create booking
  const handleCheckout = () => {
    if (!selectedTour) {
      toast.error('Please select a tour')
      return
    }
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }
    if (!customerName || !customerEmail) {
      toast.error('Please enter customer details')
      return
    }
    
    // Build rooms array from cart
    const rooms: BookingRoom[] = cart.map(item => {
      const hotel = hotels.find(h => h.id === item.contract.hotel_id)
      
      return {
        listing_id: 0, // No longer using listings
        rate_id: item.rate.id,
        hotelName: hotel?.name || '',
        roomName: item.rate.roomName,
        contractName: item.contract.contract_name,
        occupancy_type: item.occupancy_type,
        board_type: item.rate.board_type,
        purchase_type: 'inventory', // All from contracts for now
        quantity: item.quantity,
        price_per_room: item.pricePerRoom,
        total_price: item.totalPrice,
        purchase_status: 'not_required'
      }
    })
    
    // Create booking
    addBooking({
      tour_id: selectedTourId,
      customer_name: customerName,
      customer_email: customerEmail,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      nights,
      rooms,
      total_price: cartTotal
    })
    
    toast.success('Booking created successfully!')
    
    // Reset
    setCart([])
    setCustomerName('')
    setCustomerEmail('')
    setCurrentStep('tour')
    setSelectedTourId(0)
    setCheckInDate('')
    setCheckOutDate('')
    setIsCreateOpen(false)
  }

  // Booking table columns
  const columns = [
    { header: 'ID', accessor: 'id', width: 60 },
    { header: 'Tour', accessor: 'tourName' },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Check-in', accessor: 'check_in_date' },
    { header: 'Nights', accessor: 'nights', width: 80 },
    { header: 'Rooms', accessor: 'room_count' },
    { header: 'Total', accessor: 'total_display' },
    { header: 'Status', accessor: 'status', format: 'badge' as const },
    { header: 'Actions', accessor: 'actions', type: 'actions' as const, actions: ['view', 'delete'] },
  ]

  const bookingsWithCalculations = useMemo(() => 
    bookings.map(b => ({
      ...b,
      room_count: (b.rooms || []).reduce((sum, r) => sum + r.quantity, 0),
      total_display: formatCurrency(b.total_price)
    })),
    [bookings]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground mt-1">Search rooms, compare contracts, and create bookings for clients</p>
        </div>
        <Button onClick={() => navigate('/bookings/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Booking
        </Button>
        
        {/* Old dialog hidden - replaced by dedicated page */}
        <Dialog open={false} onOpenChange={() => {}}>
          <DialogTrigger asChild>
            <div style={{display: 'none'}} />
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Booking</DialogTitle>
              <DialogDescription>
                {currentStep === 'tour' && 'Select tour and dates'}
                {currentStep === 'shop' && 'Browse rooms and select contracts - Choose the best margin or lowest cost'}
                {currentStep === 'cart' && 'Review your cart'}
                {currentStep === 'checkout' && 'Enter customer details and confirm'}
              </DialogDescription>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-6">
              {(['tour', 'shop', 'cart', 'checkout'] as const).map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep === step 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : cart.length > 0 && step === 'cart'
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-muted border-muted-foreground/30'
                  }`}>
                    {step === 'tour' && <Calendar className="h-4 w-4" />}
                    {step === 'shop' && <ShoppingCart className="h-4 w-4" />}
                    {step === 'cart' && <ShoppingCart className="h-4 w-4" />}
                    {step === 'checkout' && <Check className="h-4 w-4" />}
                  </div>
                  {index < 3 && <div className="w-16 h-0.5 bg-muted mx-2" />}
                </div>
              ))}
            </div>

            {/* Step 1: Tour & Dates */}
            {currentStep === 'tour' && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Tour *</Label>
                    <Select value={selectedTourId.toString()} onValueChange={(v) => {
                      const tourId = parseInt(v)
                      setSelectedTourId(tourId)
                      const tour = tours.find(t => t.id === tourId)
                      if (tour) {
                        setCheckInDate(tour.start_date)
                        setCheckOutDate(tour.end_date)
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tour" />
                      </SelectTrigger>
                      <SelectContent>
                        {tours.map(tour => (
                          <SelectItem key={tour.id} value={tour.id.toString()}>
                            {tour.name} ({tour.start_date} to {tour.end_date})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Check-in Date *</Label>
                      <Input 
                        type="date" 
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Check-out Date *</Label>
                      <Input 
                        type="date" 
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        min={checkInDate}
                      />
                    </div>
                  </div>

                  {nights > 0 && (
                    <Card className="bg-blue-50 dark:bg-blue-950/30">
                      <CardContent className="pt-4">
                        <p className="text-sm"><strong>{nights}</strong> night{nights !== 1 ? 's' : ''}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <DialogFooter>
                  <Button 
                    onClick={() => setCurrentStep('shop')}
                    disabled={!selectedTourId || !checkInDate || !checkOutDate || nights < 1}
                  >
                    Continue to Browse Rates
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* Step 2: Shop for Rates */}
            {currentStep === 'shop' && (
              <div className="space-y-4">
                {/* Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Filters</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">Occupancy</Label>
                      <Select value={filterOccupancy} onValueChange={(v) => setFilterOccupancy(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="double">Double</SelectItem>
                          <SelectItem value="triple">Triple</SelectItem>
                          <SelectItem value="quad">Quad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Board Type</Label>
                      <Select value={filterBoardType} onValueChange={setFilterBoardType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="room_only">Room Only</SelectItem>
                          <SelectItem value="bed_breakfast">B&B</SelectItem>
                          <SelectItem value="half_board">Half Board</SelectItem>
                          <SelectItem value="full_board">Full Board</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Room Type</Label>
                      <Select value={filterRoomType} onValueChange={setFilterRoomType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {roomTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Available Rates - Grouped by Hotel -> Room */}
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {groupedByHotel.length === 0 && (
                    <Card>
                      <CardContent className="pt-6 text-center text-muted-foreground">
                        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No rates available for selected dates</p>
                        <p className="text-xs mt-1">Try adjusting your filters or dates</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Hotel Accordions */}
                  <Accordion type="multiple" defaultValue={groupedByHotel.map(h => `hotel-${h.hotelId}`)} className="space-y-2">
                    {groupedByHotel.map((hotel) => (
                      <AccordionItem 
                        key={hotel.hotelId} 
                        value={`hotel-${hotel.hotelId}`}
                        className="border rounded-lg overflow-hidden"
                      >
                        <AccordionTrigger className="px-3 py-2 bg-muted/50 hover:bg-muted/70 hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-sm">{hotel.hotelName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{hotel.roomGroups.length} room type{hotel.roomGroups.length > 1 ? 's' : ''}</span>
                              <Badge variant="outline" className="text-xs">
                                {Array.from(hotel.allocationMap.values()).reduce((sum, avail) => sum + avail, 0)} total
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-3 pt-2 space-y-2">
                          {hotel.roomGroups.map((roomGroup, idx) => (
                            <CompactRoomCard
                              key={idx}
                              roomGroup={roomGroup}
                              nights={nights}
                              onAddToCart={(rateItem, quantity, occupancy) => addToCart(rateItem, quantity, occupancy)}
                            />
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>

                <DialogFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep('tour')}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep('cart')}
                      disabled={cart.length === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      View Cart ({cart.length})
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            )}

            {/* Step 3: Cart Review */}
            {currentStep === 'cart' && (
              <div className="space-y-4">
                {cart.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Your cart is empty</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {cart.map((item, index) => {
                      const hotel = hotels.find(h => h.id === item.contract.hotel_id)
                      console.log(`Cart item ${index}:`, { 
                        roomName: item.rate.roomName, 
                        occupancy: item.occupancy_type, 
                        price: item.totalPrice 
                      })
                      return (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{item.rate.roomName}</h4>
                                  <Badge variant="outline">{BOARD_TYPE_LABELS[item.rate.board_type]}</Badge>
                                  <Badge variant="secondary" className="capitalize">{item.occupancy_type}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{hotel?.name}</p>
                                <p className="text-xs text-muted-foreground">{item.nights} night{item.nights !== 1 ? 's' : ''}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold">{formatCurrency(item.totalPrice)}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Input 
                                    type="number" 
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) => updateCartQuantity(index, parseInt(e.target.value) || 1)}
                                    className="w-16 h-8"
                                  />
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => removeFromCart(index)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                    
                    <Card className="bg-primary/5">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total ({cartRoomCount} room{cartRoomCount !== 1 ? 's' : ''})</span>
                          <span>{formatCurrency(cartTotal)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                <DialogFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep('shop')}>
                    Continue Shopping
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep('checkout')}
                    disabled={cart.length === 0}
                  >
                    Proceed to Checkout
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* Step 4: Checkout */}
            {currentStep === 'checkout' && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Customer Name *</Label>
                    <Input 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Customer Email *</Label>
                    <Input 
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tour:</span>
                      <span className="font-medium">{selectedTour?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dates:</span>
                      <span className="font-medium">{checkInDate} to {checkOutDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nights:</span>
                      <span className="font-medium">{nights}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rooms:</span>
                      <span className="font-medium">{cartRoomCount}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep('cart')}>
                    Back to Cart
                  </Button>
                  <Button 
                    onClick={handleCheckout}
                    disabled={!customerName || !customerEmail}
                  >
                    Confirm Booking
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Cart Badge in Header (when not in dialog) */}
      {cart.length > 0 && !isCreateOpen && (
        <Card className="border-primary">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <span className="font-medium">You have {cart.length} item{cart.length !== 1 ? 's' : ''} in your cart</span>
              </div>
              <Button onClick={() => {
                setIsCreateOpen(true)
                setCurrentStep('cart')
              }}>
                View Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings Table */}
      <DataTable
        title="All Bookings"
        columns={columns}
        data={bookingsWithCalculations}
        onView={(booking) => {
          setViewingBooking(booking)
          setIsViewOpen(true)
        }}
        onDelete={(booking) => {
          if (confirm(`Cancel booking for ${booking.customer_name}?`)) {
            cancelBooking(booking.id)
            toast.success('Booking cancelled')
          }
        }}
        searchable
      />

      {/* View Booking Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {viewingBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Booking ID</Label>
                  <p className="font-medium">#{viewingBooking.id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div>
                    <Badge variant={viewingBooking.status === 'confirmed' ? 'default' : 'secondary'}>
                      {viewingBooking.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Customer</Label>
                  <p className="font-medium">{viewingBooking.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{viewingBooking.customer_email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tour</Label>
                  <p className="font-medium">{viewingBooking.tourName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Dates</Label>
                  <p className="font-medium">{viewingBooking.check_in_date} to {viewingBooking.check_out_date}</p>
                  <p className="text-sm text-muted-foreground">{viewingBooking.nights} night{viewingBooking.nights !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total</Label>
                  <p className="text-xl font-bold text-primary">{formatCurrency(viewingBooking.total_price)}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Rooms</h3>
                <div className="space-y-2">
                  {viewingBooking.rooms.map((room, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{room.roomName}</p>
                            <p className="text-sm text-muted-foreground">{room.hotelName}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">{BOARD_TYPE_LABELS[room.board_type]}</Badge>
                              <Badge variant="secondary" className="capitalize">{room.occupancy_type}</Badge>
                              <Badge>{room.quantity}× rooms</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(room.total_price)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

