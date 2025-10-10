import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { BOARD_TYPE_LABELS } from '@/lib/pricing'
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
import { useData, OccupancyType, Rate, Contract, BookingRoom, ServiceRate } from '@/contexts/data-context'
import { ShoppingCart, Trash2, Building2, DoorOpen, Package, Calendar, User, Check, Car, Ticket, Utensils, Palmtree } from 'lucide-react'
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
  type: 'hotel'
  rate: Rate
  contract: Contract
  quantity: number
  guests_count: number
  occupancy_type: OccupancyType
  nights: number
  pricePerRoom: number
  totalPrice: number
}

// Service cart item structure
interface ServiceCartItem {
  type: 'service'
  serviceRate: ServiceRate
  quantity: number
  totalPrice: number
  date?: string // For dated services
}

// Table Row for Room Rate
function RoomRateRow({ 
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
  onAddToCart: (rateItem: any, quantity: number, occupancy: OccupancyType, guestsCount: number) => void
}) {
  const availableOccupancies = useMemo(() => {
    // Only show occupancies that have at least one ACTIVE rate in this room group
    const occupanciesWithRates = new Set<OccupancyType>()
    
    roomGroup.rates.forEach(rateItem => {
      // roomGroup.rates already contains only active rates (filtered in availableRates)
      occupanciesWithRates.add(rateItem.rate.occupancy_type)
    })
    
    // Return in standard order
    const orderedOccupancies: OccupancyType[] = []
    if (occupanciesWithRates.has('single')) orderedOccupancies.push('single')
    if (occupanciesWithRates.has('double')) orderedOccupancies.push('double')
    if (occupanciesWithRates.has('triple')) orderedOccupancies.push('triple')
    if (occupanciesWithRates.has('quad')) orderedOccupancies.push('quad')
    
    return orderedOccupancies
  }, [roomGroup.rates])
  
  const [selectedQty, setSelectedQty] = useState(1)
  const [selectedOcc, setSelectedOcc] = useState<OccupancyType>(availableOccupancies[0] || 'double')
  const [selectedRateId, setSelectedRateId] = useState<number | undefined>(undefined)
  const [guestsCount, setGuestsCount] = useState(2)
  
  // Auto-select first available occupancy if current one is not available
  useEffect(() => {
    if (availableOccupancies.length > 0 && !availableOccupancies.includes(selectedOcc)) {
      setSelectedOcc(availableOccupancies[0])
    }
  }, [availableOccupancies, selectedOcc])
  
  const contractOptions = useMemo(() => {
    // Only process rates that match the selected occupancy
    const ratesForSelectedOcc = roomGroup.rates.filter(rateItem => 
      rateItem.rate.occupancy_type === selectedOcc
    )
    
    // Get all unique contracts from filtered rates
    const uniqueContracts = new Map<number, typeof roomGroup.rates[0]>()
    ratesForSelectedOcc.forEach(rateItem => {
      const contractId = rateItem.contract?.id || 0
      if (!uniqueContracts.has(contractId)) {
        uniqueContracts.set(contractId, rateItem)
      }
    })
    
    // For each unique contract, calculate pricing for selected occupancy
    return Array.from(uniqueContracts.values()).map(rateItem => {
        const { rate } = rateItem
        
        // For buy-to-order rates, create mock contract
        let effectiveContract = rateItem.contract
        if ((rateItem as any).isBuyToOrder && !effectiveContract) {
          // Get hotel from the rateItem (already looked up in availableRates)
          const hotel = (rateItem as any).hotel
          effectiveContract = {
            id: 0,
            hotel_id: hotel?.id || rate.hotel_id || 0,
            contract_name: 'Buy-to-Order',
            currency: rate.currency || 'EUR',
            tax_rate: rate.tax_rate || 0,
            city_tax_per_person_per_night: rate.city_tax_per_person_per_night || 0,
            resort_fee_per_night: rate.resort_fee_per_night || 0,
            supplier_commission_rate: rate.supplier_commission_rate || 0,
            board_options: [],
          } as any
        }
        
        // Use stored board cost from rate, or fallback to contract
        const boardCost = rate.board_cost !== undefined ? rate.board_cost : 
          effectiveContract.board_options?.find(o => o.board_type === rate.board_type)?.additional_cost || 0
        
        // Calculate base rate for selected occupancy
        let baseRate = rate.rate // Default to stored rate
        
        // Always check for the correct occupancy rate from the contract
        if (effectiveContract.pricing_strategy === 'per_occupancy' && effectiveContract.occupancy_rates) {
          const occupancyRate = effectiveContract.occupancy_rates.find((or: any) => or.occupancy_type === selectedOcc)
          if (occupancyRate) {
            baseRate = occupancyRate.rate // Use contract's rate for this occupancy
          }
        } else if (effectiveContract.pricing_strategy === 'flat_rate') {
          baseRate = effectiveContract.base_rate // Use contract's flat rate for all occupancies
        }
        
        const breakdown = calculatePriceBreakdown(baseRate, effectiveContract, selectedOcc, nights, boardCost)
        
        const costPerRoom = breakdown.totalCost
        const sellPerRoom = costPerRoom * 1.6
        const marginPerRoom = sellPerRoom - costPerRoom
        const marginPercent = ((marginPerRoom / costPerRoom) * 100)
        
        return {
          ...rateItem,
          rate: {
            ...rate,
            occupancy_type: selectedOcc, // Use selected occupancy
            id: rate.id + (selectedOcc === 'single' ? 1000 : selectedOcc === 'double' ? 2000 : selectedOcc === 'triple' ? 3000 : 4000) // Unique ID for this occupancy
          },
          contract: effectiveContract, // Use effective contract (real or mock)
          costPerRoom,
          sellPerRoom,
          marginPerRoom,
          marginPercent,
          commissionRate: effectiveContract.supplier_commission_rate || 0,
          isBuyToOrder: (rateItem as any).isBuyToOrder || false
        }
      })
      .sort((a, b) => b.marginPerRoom - a.marginPerRoom) // Sort by best margin (highest first)
  }, [roomGroup.rates, nights, selectedOcc])
  
  useEffect(() => {
    if (contractOptions.length > 0) {
      const isValid = contractOptions.some(opt => opt.rate.id === selectedRateId)
      if (!isValid) {
        setSelectedRateId(contractOptions[0].rate.id)
      }
    }
  }, [contractOptions, selectedRateId])
  
  const selectedRateItem = contractOptions.find(r => r.rate.id === selectedRateId) || contractOptions[0]
  
  const selectedPrice = useMemo(() => {
    if (!selectedRateItem) return { cost: 0, sell: 0, margin: 0 }
    
    const { rate } = selectedRateItem
    
    // Use effective contract (handles buy-to-order)
    let effectiveContract = selectedRateItem.contract
    if ((selectedRateItem as any).isBuyToOrder && !effectiveContract) {
      // Get hotel from the rateItem (already looked up in availableRates)
      const hotel = (selectedRateItem as any).hotel
      effectiveContract = {
        id: 0,
        hotel_id: hotel?.id || rate.hotel_id || 0,
        contract_name: 'Buy-to-Order',
        currency: rate.currency || 'EUR',
        tax_rate: rate.tax_rate || 0,
        city_tax_per_person_per_night: rate.city_tax_per_person_per_night || 0,
        resort_fee_per_night: rate.resort_fee_per_night || 0,
        supplier_commission_rate: rate.supplier_commission_rate || 0,
        board_options: [],
      } as any
    }
    
    // Use stored board cost from rate, or fallback to contract
    const boardCost = rate.board_cost !== undefined ? rate.board_cost : 
      effectiveContract.board_options?.find(o => o.board_type === rate.board_type)?.additional_cost || 0
    
    // Calculate base rate for selected occupancy
    let baseRate = rate.rate // Default to stored rate
    
    // Always check for the correct occupancy rate from the contract
    if (effectiveContract.pricing_strategy === 'per_occupancy' && effectiveContract.occupancy_rates) {
      const occupancyRate = effectiveContract.occupancy_rates.find((or: any) => or.occupancy_type === selectedOcc)
      if (occupancyRate) {
        baseRate = occupancyRate.rate // Use contract's rate for this occupancy
      }
    } else if (effectiveContract.pricing_strategy === 'flat_rate') {
      baseRate = effectiveContract.base_rate // Use contract's flat rate for all occupancies
    }
    
    const breakdown = calculatePriceBreakdown(baseRate, effectiveContract, selectedOcc, nights, boardCost)
    
    const costPerRoom = breakdown.totalCost
    const sellPerRoom = costPerRoom * 1.6
    
    return {
      cost: costPerRoom * selectedQty,
      sell: sellPerRoom * selectedQty,
      margin: (sellPerRoom - costPerRoom) * selectedQty
    }
  }, [selectedRateItem, selectedQty, selectedOcc, nights])
  
  // Disable if no occupancies available
  if (availableOccupancies.length === 0) {
    return (
      <tr className="border-b">
        <td className="p-3 text-sm">{roomGroup.roomName}</td>
        <td colSpan={6} className="p-3 text-center text-xs text-muted-foreground italic">
          No active rates available
        </td>
      </tr>
    )
  }
  
  return (
    <tr className="border-b hover:bg-muted/30 transition-colors">
      {/* Room Name */}
      <td className="p-3">
        <div className="flex items-center gap-2">
          <DoorOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium text-sm">{roomGroup.roomName}</span>
        </div>
      </td>
      
      {/* Occupancy Selector */}
      <td className="p-3">
        <Select value={selectedOcc} onValueChange={(v) => setSelectedOcc(v as OccupancyType)}>
          <SelectTrigger className="h-8 text-xs w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableOccupancies.map(occ => (
              <SelectItem key={occ} value={occ} className="text-xs capitalize">
                {occ === 'single' && '1p'}
                {occ === 'double' && '2p'}
                {occ === 'triple' && '3p'}
                {occ === 'quad' && '4p'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      
      {/* Contract Selector */}
      <td className="p-3">
        {contractOptions.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">No rates</span>
        ) : (
          <Select 
            value={selectedRateId?.toString() || contractOptions[0]?.rate.id.toString()} 
            onValueChange={(v) => setSelectedRateId(parseInt(v))}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {contractOptions.map((option, idx) => {
                const isBest = idx === 0
                
                return (
                  <SelectItem key={option.rate.id} value={option.rate.id.toString()} className="text-xs">
                    {isBest && '⭐ '} {option.contract.contract_name}
                    {option.isBuyToOrder && ' 🟠'}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )}
      </td>
      
      {/* Availability */}
      <td className="p-3 text-xs text-center">
        {selectedRateItem?.isBuyToOrder ? (
          <Badge variant="outline" className="text-[10px] border-orange-500 text-orange-600">On request</Badge>
        ) : (
          <span className="font-medium">{selectedRateItem?.available || 0}</span>
        )}
      </td>
      
      {/* Price */}
      <td className="p-3 text-right">
        <div className="text-sm font-bold">{formatCurrency(selectedPrice.sell / selectedQty)}</div>
        <div className="text-[10px] text-muted-foreground">
          +{formatCurrency(selectedPrice.margin / selectedQty)} margin
        </div>
      </td>
      
      {/* Quantity */}
      <td className="p-3">
        <Input 
          type="number" 
          min={1}
          max={selectedRateItem?.isBuyToOrder ? undefined : selectedRateItem?.available || 1}
          value={selectedQty}
          onChange={(e) => {
            const newQty = Math.max(1, parseInt(e.target.value) || 1)
            if (selectedRateItem?.isBuyToOrder) {
              setSelectedQty(newQty)
            } else {
              setSelectedQty(Math.min(selectedRateItem?.available || 1, newQty))
            }
          }}
          className="h-8 text-xs w-16"
        />
      </td>
      
      {/* Guests */}
      <td className="p-3">
        <Input 
          type="number" 
          min={1}
          max={10}
          value={guestsCount}
          onChange={(e) => setGuestsCount(Math.max(1, parseInt(e.target.value) || 1))}
          className="h-8 text-xs w-16"
          placeholder="Guests"
        />
      </td>
      
      {/* Total & Action */}
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm font-bold">{formatCurrency(selectedPrice.sell)}</div>
            <div className="text-[10px] text-muted-foreground">total</div>
          </div>
          <Button 
            onClick={() => {
              if (selectedRateItem) {
                onAddToCart(selectedRateItem, selectedQty, selectedOcc, guestsCount)
              }
            }}
            size="sm"
            className="h-8 text-xs whitespace-nowrap"
            disabled={!selectedRateItem || contractOptions.length === 0}
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </td>
    </tr>
  )
}

export function BookingsCreate() {
  const navigate = useNavigate()
  const { bookings, tours, rates, contracts, hotels, addBooking, tourComponents, serviceRates, serviceInventoryTypes } = useData()
  
  // Booking state
  const [selectedTourId, setSelectedTourId] = useState(0)
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [serviceCart, setServiceCart] = useState<ServiceCartItem[]>([])
  
  // Customer details
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  
  // Filters
  const [filterOccupancy, setFilterOccupancy] = useState<OccupancyType | 'all'>('all')
  const [filterBoardType, setFilterBoardType] = useState<string>('all')
  const [filterRoomType, setFilterRoomType] = useState<string>('all')
  const [filterServiceCategory, setFilterServiceCategory] = useState<string>('all')
  
  // View toggle
  const [activeTab, setActiveTab] = useState<'hotels' | 'services'>('hotels')

  const selectedTour = useMemo(() => 
    tours.find(t => t.id === selectedTourId),
    [tours, selectedTourId]
  )

  const tourHasComponents = useMemo(() => {
    return tourComponents.filter((c: any) => c.tour_id === selectedTourId).length > 0
  }, [tourComponents, selectedTourId])

  // Auto-populate cart from tour components
  useEffect(() => {
    if (!selectedTour || !checkInDate || !tourHasComponents || cart.length > 0) return
    
    const components = tourComponents.filter((c: any) => c.tour_id === selectedTourId && c.component_type === 'accommodation')
    
    if (components.length > 0) {
      toast.info(`📦 Loading ${components.length} hotel component(s) from tour package...`)
      
      // Auto-add components to cart
      components.forEach((component: any) => {
        // Calculate check-in date from tour start + component day
        const tourStart = new Date(selectedTour.start_date)
        const componentCheckIn = new Date(tourStart)
        componentCheckIn.setDate(componentCheckIn.getDate() + (component.check_in_day - 1))
        
        // Find rates for this component
        const componentRates = availableRates.filter(item => 
          item.rate.room_group_id === component.room_group_id &&
          item.hotel?.id === component.hotel_id &&
          item.rate.board_type === component.board_type
        )
        
        if (componentRates.length > 0) {
          // Use the best margin option
          const bestRate = componentRates.sort((a, b) => {
            const marginA = (a as any).marginPerRoom || 0
            const marginB = (b as any).marginPerRoom || 0
            return marginB - marginA
          })[0]
          
          // Add to cart with default guest count of 2
          addToCart(bestRate, 1, 'double', 2)
        }
      })
    }
  }, [selectedTour, checkInDate, tourHasComponents])

  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0
    const start = new Date(checkInDate)
    const end = new Date(checkOutDate)
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  }, [checkInDate, checkOutDate])

  const availableRates = useMemo(() => {
    if (!checkInDate || !checkOutDate) return []
    
    const start = new Date(checkInDate)
    const end = new Date(checkOutDate)
    
    // STEP 1: Get inventory rates (contract-based with allocations)
    const inventoryRates = rates
      .filter(rate => rate.active !== false) // Only show active rates
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
        
        const allocation = contract.room_allocations?.find(a => a.room_group_ids.includes(rate.room_group_id))
        if (!allocation) return null
        
        // For shared allocations, count bookings across ALL room types in the pool
        const allBookedRooms = bookings
          .filter(b => b.status !== 'cancelled' && b.rooms && b.rooms.length > 0)
          .flatMap(b => b.rooms)
        
        const bookedForAllocation = allBookedRooms
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
          available,
          hotel: hotels.find(h => h.id === contract.hotel_id),
          isBuyToOrder: false
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
    
    // STEP 2: Track which room types have inventory
    const roomTypesWithInventory = new Set<string>()
    inventoryRates.forEach(item => {
      // Track by hotel + room_group_id to be specific
      const key = `${item.hotel?.id || 0}-${item.rate.room_group_id}`
      roomTypesWithInventory.add(key)
    })
    
    // STEP 3: Add buy-to-order rates ONLY for room types without inventory
    const buyToOrderRates = rates
      .filter(rate => rate.hotel_id && !rate.contract_id && rate.active !== false) // Buy-to-order rates (active only)
      .map(rate => {
        const hotel = hotels.find(h => h.id === rate.hotel_id)
        if (!hotel) return null
        
        const key = `${hotel.id}-${rate.room_group_id}`
        
        // Skip if this room type has inventory available
        if (roomTypesWithInventory.has(key)) return null
        
        // For buy-to-order, REQUIRE validity dates and night restrictions
        if (!rate.valid_from || !rate.valid_to) {
          console.warn(`Buy-to-order rate ${rate.id} missing validity dates - skipping`)
          return null
        }
        
        const rateStart = new Date(rate.valid_from)
        const rateEnd = new Date(rate.valid_to)
        if (rateStart > end || rateEnd < start) return null
        
        // Check night restrictions (required for buy-to-order)
        const rateMinNights = (rate as any).min_nights ?? 1
        const rateMaxNights = (rate as any).max_nights ?? 365
        const bookingNights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        
        if (bookingNights < rateMinNights || bookingNights > rateMaxNights) return null
        
        return {
          rate,
          contract: null as any, // No contract for buy-to-order
          available: 999, // Flexible capacity
          hotel,
          isBuyToOrder: true
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
    
    // STEP 4: Combine and filter
    return [...inventoryRates, ...buyToOrderRates]
      .filter(item => {
        if (filterOccupancy !== 'all' && item.rate.occupancy_type !== filterOccupancy) return false
        if (filterBoardType !== 'all' && item.rate.board_type !== filterBoardType) return false
        if (filterRoomType !== 'all' && item.rate.room_group_id !== filterRoomType) return false
        return true
      })
  }, [checkInDate, checkOutDate, rates, contracts, bookings, hotels, filterOccupancy, filterBoardType, filterRoomType])

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
      
      if (!hotelGroups.has(hotelId)) {
        hotelGroups.set(hotelId, {
          hotelId,
          hotelName: item.hotel?.name || '',
          roomGroups: [],
          allocationMap: new Map<string, number>() // Track allocations
        })
      }
      
      const hotelGroup = hotelGroups.get(hotelId)!
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
      const contractId = item.contract?.id || item.rate.id // Use rate.id for buy-to-order
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
      } else {
        // Buy-to-order: unique per rate
        const buyToOrderKey = `bto-${item.rate.id}`
        if (!hotelGroup.allocationMap.has(buyToOrderKey)) {
          hotelGroup.allocationMap.set(buyToOrderKey, item.available)
        }
      }
      
      // For buy-to-order rates, create a mock contract structure
      let effectiveContract = item.contract
      if (item.isBuyToOrder && !effectiveContract) {
        effectiveContract = {
          id: 0,
          hotel_id: item.rate.hotel_id || 0,
          hotelName: item.hotel?.name || '',
          contract_name: 'Buy-to-Order',
          start_date: item.rate.valid_from || '',
          end_date: item.rate.valid_to || '',
          total_rooms: 999,
          base_rate: item.rate.rate,
          currency: item.rate.currency || 'EUR',
          tax_rate: item.rate.tax_rate || 0,
          city_tax_per_person_per_night: item.rate.city_tax_per_person_per_night || 0,
          resort_fee_per_night: item.rate.resort_fee_per_night || 0,
          supplier_commission_rate: item.rate.supplier_commission_rate || 0,
          board_options: [],
        } as any
      }
      
      // Use stored board cost from rate, or fallback to contract
      const boardCost = item.rate.board_cost !== undefined ? item.rate.board_cost : 
        effectiveContract.board_options?.find((o: any) => o.board_type === item.rate.board_type)?.additional_cost || 0
      const breakdown = calculatePriceBreakdown(item.rate.rate, effectiveContract, 'double', nights, boardCost)
      const costPerRoom = breakdown.totalCost
      
      roomGroup!.minPrice = Math.min(roomGroup!.minPrice, costPerRoom)
      
      const sellPerRoom = costPerRoom * 1.6
      const margin = sellPerRoom - costPerRoom
      roomGroup!.maxMargin = Math.max(roomGroup!.maxMargin, margin)
    })
    
    return Array.from(hotelGroups.values())
      .sort((a, b) => a.hotelName.localeCompare(b.hotelName))
      .map(hotel => ({
        ...hotel,
        roomGroups: hotel.roomGroups.sort((a, b) => a.roomName.localeCompare(b.roomName))
      }))
  }, [availableRates, nights])

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

  const addToCart = (rateItem: NonNullable<typeof availableRates[0]>, quantity: number, occupancyType: OccupancyType, guestsCount: number) => {
    const { rate } = rateItem
    
    // For buy-to-order rates, create mock contract
    let effectiveContract = rateItem.contract
    if ((rateItem as any).isBuyToOrder && !effectiveContract) {
      // Get hotel from the rateItem (already looked up in availableRates)
      const hotel = (rateItem as any).hotel || hotels.find((h: any) => h.id === rate.hotel_id)
      effectiveContract = {
        id: 0,
        hotel_id: hotel?.id || rate.hotel_id || 0,
        contract_name: 'Buy-to-Order',
        currency: rate.currency || 'EUR',
        tax_rate: rate.tax_rate || 0,
        city_tax_per_person_per_night: rate.city_tax_per_person_per_night || 0,
        resort_fee_per_night: rate.resort_fee_per_night || 0,
        supplier_commission_rate: rate.supplier_commission_rate || 0,
        board_options: [],
      } as any
    }
    
    // Use stored board cost from rate, or fallback to contract
    const boardCost = rate.board_cost !== undefined ? rate.board_cost : 
      effectiveContract.board_options?.find((o: any) => o.board_type === rate.board_type)?.additional_cost || 0
    
    // Calculate base rate for selected occupancy
    let baseRate = rate.rate // Default to stored rate
    
    // Always check for the correct occupancy rate from the contract
    if (effectiveContract.pricing_strategy === 'per_occupancy' && effectiveContract.occupancy_rates) {
      const occupancyRate = effectiveContract.occupancy_rates.find((or: any) => or.occupancy_type === occupancyType)
      if (occupancyRate) {
        baseRate = occupancyRate.rate // Use contract's rate for this occupancy
      }
    } else if (effectiveContract.pricing_strategy === 'flat_rate') {
      baseRate = effectiveContract.base_rate // Use contract's flat rate for all occupancies
    }
    
    const breakdown = calculatePriceBreakdown(
      baseRate,
      effectiveContract,
      occupancyType,
      nights,
      boardCost
    )
    
    // Calculate SELL price with markup (cost * 1.6 = 60% markup)
    const costPerRoom = breakdown.totalCost
    const sellPerRoom = costPerRoom * 1.6
    const pricePerRoom = sellPerRoom  // Store sell price, not cost
    const totalPrice = pricePerRoom * quantity
    
    const cartItem: CartItem = {
      type: 'hotel',
      rate,
      contract: effectiveContract,
      quantity,
      guests_count: guestsCount,
      occupancy_type: occupancyType,
      nights,
      pricePerRoom,
      totalPrice
    }
    
    setCart([...cart, cartItem])
    
    if ((rateItem as any).isBuyToOrder) {
      toast.success(`Added ${quantity}× ${rate.roomName} (${occupancyType}) to cart - Buy-to-Order`, {
        description: 'This will require purchase confirmation from operations team'
      })
    } else {
      toast.success(`Added ${quantity}× ${rate.roomName} (${occupancyType}) to cart`)
    }
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
    toast.info('Removed from cart')
  }

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

  // Available Service Rates
  const availableServiceRates = useMemo(() => {
    if (!selectedTourId || !selectedTour) return []
    
    const tourStart = new Date(selectedTour.start_date)
    const tourEnd = new Date(selectedTour.end_date)
    
    return serviceRates
      .filter(rate => {
        // Only active rates
        if (rate.active !== true) return false
        
        // Check if service dates overlap with tour dates
        const rateStart = new Date(rate.valid_from)
        const rateEnd = new Date(rate.valid_to)
        
        // Service must overlap with tour dates (not necessarily start on check-in)
        const hasOverlap = rateStart <= tourEnd && rateEnd >= tourStart
        if (!hasOverlap) return false
        
        // Tour filtering logic:
        // Show services that are EITHER:
        // 1. Linked to the selected tour (tour_id === selectedTourId)
        // 2. Generic services (tour_id is null/undefined) - available for all tours
        // Exclude services linked to OTHER tours
        if (rate.tour_id) {
          // If rate has a tour_id, it must match the selected tour
          if (rate.tour_id !== selectedTourId) return false
        }
        // If rate.tour_id is undefined/null, it's generic and always included
        
        // Filter by category
        if (filterServiceCategory !== 'all') {
          const inventoryType = serviceInventoryTypes.find(t => t.id === rate.inventory_type_id)
          if (inventoryType?.category !== filterServiceCategory) return false
        }
        
        return true
      })
  }, [selectedTour, selectedTourId, serviceRates, serviceInventoryTypes, filterServiceCategory])

  const addServiceToCart = (serviceRate: ServiceRate, quantity: number, date?: string) => {
    const totalPrice = serviceRate.selling_price * quantity
    
    const cartItem: ServiceCartItem = {
      type: 'service',
      serviceRate,
      quantity,
      totalPrice,
      date
    }
    
    setServiceCart([...serviceCart, cartItem])
    
    // Smart pairing suggestion for transfers
    if ((serviceRate.direction === 'inbound' || serviceRate.direction === 'outbound') && serviceRate.paired_rate_id) {
      const pairedRate = serviceRates.find(r => r.id === serviceRate.paired_rate_id)
      if (pairedRate && !serviceCart.some(item => item.serviceRate.id === pairedRate.id)) {
        const directionLabel = serviceRate.direction === 'inbound' ? 'departure' : 'arrival'
        toast.success(`Added ${quantity}× ${serviceRate.categoryName} to cart`, {
          description: `💡 Don't forget to add the ${directionLabel} transfer!`,
          action: {
            label: 'Add Return',
            onClick: () => addServiceToCart(pairedRate, quantity, date)
          }
        })
        return
      }
    }
    
    toast.success(`Added ${quantity}× ${serviceRate.categoryName} to cart`)
  }

  const removeServiceFromCart = (index: number) => {
    setServiceCart(serviceCart.filter((_, i) => i !== index))
    toast.info('Service removed from cart')
  }

  const cartTotal = useMemo(() => {
    const hotelTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)
    const serviceTotal = serviceCart.reduce((sum, item) => sum + item.totalPrice, 0)
    return hotelTotal + serviceTotal
  }, [cart, serviceCart])

  const cartRoomCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])
  
  const cartServiceCount = useMemo(() => {
    return serviceCart.reduce((sum, item) => sum + item.quantity, 0)
  }, [serviceCart])

  const handleCreateBooking = () => {
    if (!selectedTour) {
      toast.error('Please select a tour')
      return
    }
    if (cart.length === 0 && serviceCart.length === 0) {
      toast.error('Cart is empty - add hotels or services')
      return
    }
    if (!customerName || !customerEmail || !customerPhone) {
      toast.error('Please enter customer details (name, email, and phone)')
      return
    }
    
    const rooms: BookingRoom[] = cart.map(item => {
      const hotel = hotels.find(h => h.id === (item.rate.hotel_id || item.contract.hotel_id))
      const isBuyToOrder = !item.contract.id || item.contract.contract_name === 'Buy-to-Order'
      
      // Recalculate the estimated cost for this room (for variance tracking)
      const boardCost = item.rate.board_cost !== undefined ? item.rate.board_cost : 
        item.contract.board_options?.find((o: any) => o.board_type === item.rate.board_type)?.additional_cost || 0
      
      let baseRate = item.rate.rate
      if (item.contract.pricing_strategy === 'per_occupancy' && item.contract.occupancy_rates) {
        const occupancyRate = item.contract.occupancy_rates.find((or: any) => or.occupancy_type === item.occupancy_type)
        if (occupancyRate) {
          baseRate = occupancyRate.rate
        }
      } else if (item.contract.pricing_strategy === 'flat_rate') {
        baseRate = item.contract.base_rate
      }
      
      const breakdown = calculatePriceBreakdown(
        baseRate,
        item.contract,
        item.occupancy_type,
        nights,
        boardCost
      )
      
      const estimatedCostPerRoom = breakdown.totalCost
      
      return {
        listing_id: 0,
        rate_id: item.rate.id,
        hotelName: item.rate.hotelName || hotel?.name || '',
        roomName: item.rate.roomName,
        contractName: item.contract.contract_name,
        occupancy_type: item.occupancy_type,
        board_type: item.rate.board_type,
        purchase_type: isBuyToOrder ? 'buy_to_order' : 'inventory',
        quantity: item.quantity,
        guests_count: item.guests_count,
        price_per_room: item.pricePerRoom,
        total_price: item.totalPrice,
        estimated_cost_per_room: estimatedCostPerRoom,
        purchase_status: isBuyToOrder ? 'pending_purchase' : 'not_required'
      }
    })
    
    addBooking({
      tour_id: selectedTourId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      nights,
      rooms,
      total_price: cartTotal
    })
    
    toast.success('Booking created successfully!')
    navigate('/bookings')
  }

  const canCreateBooking = selectedTour && (cart.length > 0 || serviceCart.length > 0) && customerName && customerEmail && customerPhone

  return (
    <div className="min-h-screen pt-0 bg-background">


      <div className="mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tour & Date Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Tour & Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div>
                    <Label className="text-sm">Tour</Label>
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
                        {tours.map(tour => {
                          const hasComponents = tourComponents.filter((c: any) => c.tour_id === tour.id).length > 0
                          return (
                            <SelectItem key={tour.id} value={tour.id.toString()}>
                              {tour.name} ({tour.start_date} to {tour.end_date})
                              {hasComponents && ' 📦'}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {tourHasComponents && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-blue-900">
                        <span className="text-lg">📦</span>
                        <div>
                          <strong>Package Tour:</strong> This tour has {tourComponents.filter((c: any) => c.tour_id === selectedTourId).length} pre-configured component(s).
                          <div className="text-xs mt-1">They will auto-populate your cart when you select dates.</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Check-in Date</Label>
                      <Input 
                        type="date" 
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Check-out Date</Label>
                      <Input 
                        type="date" 
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        min={checkInDate}
                      />
                    </div>
                  </div>

                  {nights > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                      <p className="text-sm font-medium">{nights} night{nights !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            {nights > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Occupancy</Label>
                    <Select value={filterOccupancy} onValueChange={(v) => setFilterOccupancy(v as any)}>
                      <SelectTrigger className="h-9">
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
                      <SelectTrigger className="h-9">
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
                      <SelectTrigger className="h-9">
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
            )}

            {/* Tab Navigation */}
            {nights > 0 && (
              <>
                <div className="flex gap-2 border-b mb-4">
                  <button
                    onClick={() => setActiveTab('hotels')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      activeTab === 'hotels'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Building2 className="inline h-4 w-4 mr-2" />
                    Hotels
                  </button>
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      activeTab === 'services'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Package className="inline h-4 w-4 mr-2" />
                    Services ({availableServiceRates.length})
                  </button>
                </div>
              </>
            )}

            {/* Available Rooms */}
            {nights > 0 && activeTab === 'hotels' && (
              <div className="space-y-2">
                {groupedByHotel.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No rates available for selected dates</p>
                      <p className="text-xs mt-1">Try adjusting your filters or dates</p>
                    </CardContent>
                  </Card>
                )}
                
                <Accordion type="multiple" defaultValue={groupedByHotel.map(h => `hotel-${h.hotelId}`)} className="space-y-2">
                  {groupedByHotel.map((hotel) => (
                    <AccordionItem 
                      key={hotel.hotelId} 
                      value={`hotel-${hotel.hotelId}`}
                      className="border rounded-lg overflow-hidden"
                    >
                      <AccordionTrigger className="px-3 py-2 bg-card hover:bg-muted/70 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-sm">{hotel.hotelName}</span>
                            <Badge variant="outline" className="text-xs">
                              {hotel.roomGroups.length} room{hotel.roomGroups.length > 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="text-xs">
                              {hotel.roomGroups.some(rg => rg.rates.some(r => (r as any).isBuyToOrder)) 
                                ? 'On request' 
                                : `${Array.from(hotel.allocationMap.values()).reduce((sum, avail) => sum + avail, 0)} available`
                              }
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-0 bg-card">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-muted/50 border-b">
                              <tr>
                                <th className="p-2 text-left text-xs font-medium text-muted-foreground">Room Type</th>
                                <th className="p-2 text-left text-xs font-medium text-muted-foreground">Occupancy</th>
                                <th className="p-2 text-left text-xs font-medium text-muted-foreground">Contract</th>
                                <th className="p-2 text-center text-xs font-medium text-muted-foreground">Available</th>
                                <th className="p-2 text-right text-xs font-medium text-muted-foreground">Price/Room</th>
                                <th className="p-2 text-center text-xs font-medium text-muted-foreground">Quantity</th>
                                <th className="p-2 text-center text-xs font-medium text-muted-foreground">Guests</th>
                                <th className="p-2 text-right text-xs font-medium text-muted-foreground">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {hotel.roomGroups.map((roomGroup, idx) => (
                                <RoomRateRow
                                  key={idx}
                                  roomGroup={roomGroup}
                                  nights={nights}
                                  onAddToCart={(rateItem, quantity, occupancy, guestsCount) => addToCart(rateItem, quantity, occupancy, guestsCount)}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-4">
                {/* Service Filters */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid gap-2">
                      <Label>Service Category</Label>
                      <Select value={filterServiceCategory} onValueChange={setFilterServiceCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="transfer">Transfers & Transport</SelectItem>
                          <SelectItem value="ticket">Tickets & Events</SelectItem>
                          <SelectItem value="activity">Activities & Tours</SelectItem>
                          <SelectItem value="meal">Meals & Dining</SelectItem>
                          <SelectItem value="other">Other Services</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Available Services - Grouped by Category */}
                {availableServiceRates.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No services available for this tour</p>
                      <p className="text-sm mt-2">Check Service Inventory or select a different tour</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Accordion type="multiple" defaultValue={['transfer', 'ticket', 'activity', 'meal', 'other']} className="space-y-2">
                    {['transfer', 'ticket', 'activity', 'meal', 'other'].map(category => {
                      const categoryRates = availableServiceRates.filter(rate => {
                        const inventoryType = serviceInventoryTypes.find(t => t.id === rate.inventory_type_id)
                        return inventoryType?.category === category
                      })
                      
                      if (categoryRates.length === 0) return null
                      
                      const getCategoryIcon = () => {
                        switch (category) {
                          case 'transfer': return Car
                          case 'ticket': return Ticket
                          case 'activity': return Palmtree
                          case 'meal': return Utensils
                          default: return Package
                        }
                      }
                      const CategoryIcon = getCategoryIcon()
                      
                      const categoryLabels: Record<string, string> = {
                        transfer: 'Transfers & Transport',
                        ticket: 'Tickets & Events',
                        activity: 'Activities & Tours',
                        meal: 'Meals & Dining',
                        other: 'Other Services'
                      }
                      
                      return (
                        <AccordionItem
                          key={category}
                          value={category}
                          className="border rounded-lg overflow-hidden"
                        >
                          <AccordionTrigger className="px-3 py-2 bg-card hover:bg-muted/70 hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-2">
                              <div className="flex items-center gap-2">
                                <CategoryIcon className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-sm">{categoryLabels[category]}</span>
                                <Badge variant="outline" className="text-xs">
                                  {categoryRates.length} available
                                </Badge>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-0 bg-card">
                            <div className="p-3 space-y-2">
                              {categoryRates.map((serviceRate) => {
                                const inventoryType = serviceInventoryTypes.find(t => t.id === serviceRate.inventory_type_id)
                                const margin = serviceRate.selling_price - serviceRate.base_rate
                                const marginPercent = (margin / serviceRate.base_rate) * 100
                                
                                // Format date range
                                const formatDate = (dateStr: string) => {
                                  const date = new Date(dateStr)
                                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                }
                                
                                // Get active days
                                const getActiveDays = () => {
                                  if (!serviceRate.days_of_week) return 'All days'
                                  const days = []
                                  if (serviceRate.days_of_week.monday) days.push('Mon')
                                  if (serviceRate.days_of_week.tuesday) days.push('Tue')
                                  if (serviceRate.days_of_week.wednesday) days.push('Wed')
                                  if (serviceRate.days_of_week.thursday) days.push('Thu')
                                  if (serviceRate.days_of_week.friday) days.push('Fri')
                                  if (serviceRate.days_of_week.saturday) days.push('Sat')
                                  if (serviceRate.days_of_week.sunday) days.push('Sun')
                                  return days.length === 7 ? 'All days' : days.join(', ')
                                }
                                
                                return (
                                  <div key={serviceRate.id} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <h3 className="font-semibold text-sm mb-1">{serviceRate.categoryName}</h3>
                                        <p className="text-xs text-muted-foreground mb-1">
                                          {inventoryType?.name}
                                          {serviceRate.direction && (
                                            <span className="ml-1">
                                              • <span className="font-medium capitalize">
                                                {serviceRate.direction === 'inbound' ? '→ Arrival' : 
                                                 serviceRate.direction === 'outbound' ? '← Departure' :
                                                 serviceRate.direction === 'round_trip' ? '↔ Round Trip' :
                                                 serviceRate.direction.replace('_', ' ')}
                                              </span>
                                            </span>
                                          )}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                          <Calendar className="h-3 w-3" />
                                          <span>{formatDate(serviceRate.valid_from)} - {formatDate(serviceRate.valid_to)}</span>
                                          <span>•</span>
                                          <span className="font-mono font-medium">{getActiveDays()}</span>
                                        </div>
                                        <div className="flex gap-1 flex-wrap">
                                          <Badge variant={serviceRate.inventory_type === 'contract' ? 'default' : 'outline'} className="text-xs">
                                            {serviceRate.inventory_type === 'contract' ? 'Contract' : 'Buy-to-Order'}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            {serviceRate.pricing_unit.replace('_', ' ')}
                                          </Badge>
                                          {serviceRate.inventory_type === 'contract' && serviceRate.available_quantity !== undefined && (
                                            <Badge variant="secondary" className="text-xs">
                                              {serviceRate.available_quantity} available
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="text-right">
                                        <div className="text-lg font-bold text-primary">
                                          {formatCurrency(serviceRate.selling_price)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          Cost: {formatCurrency(serviceRate.base_rate)}
                                        </div>
                                        <div className="text-xs text-green-600">
                                          +{formatCurrency(margin)} ({marginPercent.toFixed(0)}%)
                                        </div>
                                        
                                        {/* Paired Transfer Suggestion */}
                                        {serviceRate.paired_rate_id && (
                                          <div className="text-xs text-blue-600 mt-1">
                                            💡 {serviceRate.direction === 'inbound' ? 'Return available' : 'Outbound available'}
                                          </div>
                                        )}
                                        
                                        <div className="flex gap-2 items-center justify-end mt-2">
                                          <Input
                                            type="number"
                                            min={1}
                                            max={serviceRate.inventory_type === 'contract' ? serviceRate.available_quantity : undefined}
                                            defaultValue={1}
                                            className="w-16 h-8 text-xs"
                                            id={`qty-${serviceRate.id}`}
                                          />
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              const qtyInput = document.getElementById(`qty-${serviceRate.id}`) as HTMLInputElement
                                              const qty = parseInt(qtyInput?.value || '1')
                                              addServiceToCart(serviceRate, qty, checkInDate)
                                            }}
                                          >
                                            <Check className="h-3 w-3 mr-1" />
                                            Add
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
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
              </div>
            )}
          </div>

          {/* Sticky Cart Panel - Right Side */}
          <div className="lg:col-span-1">
            <div className="sticky top-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Cart ({cart.length + serviceCart.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  {cart.length === 0 && serviceCart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Your cart is empty</p>
                      <p className="text-xs mt-1">Add hotels or services</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {/* Hotel Items */}
                        {cart.map((item, index) => {
                          const hotel = hotels.find(h => h.id === item.contract.hotel_id || item.rate.hotel_id)
                          const isBuyToOrder = !item.contract.id || item.contract.contract_name === 'Buy-to-Order'
                          return (
                            <div key={index} className={`border rounded-lg p-2 ${isBuyToOrder ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200' : 'bg-muted/30'}`}>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.rate.roomName}</p>
                                  <p className="text-xs text-muted-foreground truncate">{hotel?.name}</p>
                                  <div className="flex gap-1 mt-1 flex-wrap">
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                      {BOARD_TYPE_LABELS[item.rate.board_type]}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 capitalize">
                                      {item.occupancy_type}
                                    </Badge>
                                    {isBuyToOrder && (
                                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-orange-500 text-orange-600">
                                        Buy-to-Order
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-6 w-6 flex-shrink-0"
                                  onClick={() => removeFromCart(index)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <Input 
                                  type="number" 
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => updateCartQuantity(index, parseInt(e.target.value) || 1)}
                                  className="w-16 h-7 text-xs"
                                />
                                <div className="text-right">
                                  <p className="font-bold">{formatCurrency(item.totalPrice)}</p>
                                  <p className="text-[10px] text-muted-foreground">{item.nights}n</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      <Separator />
                      
                      {/* Service Items */}
                      {serviceCart.map((item, index) => {
                        const inventoryType = serviceInventoryTypes.find(t => t.id === item.serviceRate.inventory_type_id)
                        const getDirectionIcon = () => {
                          if (item.serviceRate.direction === 'inbound') return '→'
                          if (item.serviceRate.direction === 'outbound') return '←'
                          if (item.serviceRate.direction === 'round_trip') return '↔'
                          return ''
                        }
                        return (
                          <div key={`service-${index}`} className="border rounded-lg p-2 bg-purple-50/50 dark:bg-purple-950/20 border-purple-200">
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {item.serviceRate.categoryName}
                                  {item.serviceRate.direction && (
                                    <span className="ml-1 text-purple-600">{getDirectionIcon()}</span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{inventoryType?.name}</p>
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                    {item.serviceRate.pricing_unit.replace('_', ' ')}
                                  </Badge>
                                  {item.serviceRate.direction && (
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-purple-100 text-purple-700 capitalize">
                                      {item.serviceRate.direction === 'inbound' ? 'Arrival' :
                                       item.serviceRate.direction === 'outbound' ? 'Departure' :
                                       item.serviceRate.direction.replace('_', ' ')}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-6 w-6 flex-shrink-0"
                                onClick={() => removeServiceFromCart(index)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Qty: {item.quantity}</span>
                              <div className="text-right">
                                <p className="font-bold">{formatCurrency(item.totalPrice)}</p>
                                <p className="text-[10px] text-muted-foreground">{formatCurrency(item.serviceRate.selling_price)} each</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      
                      {/* Cart Summary */}
                      <div className="space-y-2">
                        {cart.length > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Rooms:</span>
                            <span className="font-medium">{cartRoomCount} ({nights}n)</span>
                          </div>
                        )}
                        {serviceCart.length > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Services:</span>
                            <span className="font-medium">{cartServiceCount}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-primary">{formatCurrency(cartTotal)}</span>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  
                  {/* Customer Details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <User className="h-4 w-4" />
                      Customer Details
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input 
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="John Smith"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input 
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Phone *</Label>
                        <Input 
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+1 555-123-4567"
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleCreateBooking}
                    disabled={!canCreateBooking}
                    className="w-full"
                    size="lg"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Create Booking
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

