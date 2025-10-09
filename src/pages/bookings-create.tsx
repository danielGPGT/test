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
import { useData, OccupancyType, Rate, Contract, BookingRoom } from '@/contexts/data-context'
import { ShoppingCart, Trash2, Building2, DoorOpen, TrendingUp, DollarSign, Percent, Package, Check, Calendar, User } from 'lucide-react'
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
  pricePerRoom: number
  totalPrice: number
}

// Compact Room Rate Card
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
  const availableOccupancies = useMemo(() => {
    // Get room capacity from the hotel's room group data
    const roomGroupId = roomGroup.rates[0]?.rate.room_group_id
    const hotel = roomGroup.rates[0]?.hotel
    
    let roomCapacity = 2 // Default fallback
    
    if (hotel && roomGroupId) {
      const roomGroupData = hotel.room_groups?.find((rg: any) => rg.id === roomGroupId)
      roomCapacity = roomGroupData?.capacity || 2
    }
    
    // Generate all occupancies up to room capacity
    const allOccupancies: OccupancyType[] = []
    if (roomCapacity >= 1) allOccupancies.push('single')
    if (roomCapacity >= 2) allOccupancies.push('double')
    if (roomCapacity >= 3) allOccupancies.push('triple')
    if (roomCapacity >= 4) allOccupancies.push('quad')
    
    return allOccupancies
  }, [roomGroup.rates])
  
  const [selectedQty, setSelectedQty] = useState(1)
  const [selectedOcc, setSelectedOcc] = useState<OccupancyType>(availableOccupancies[0] || 'double')
  const [selectedRateId, setSelectedRateId] = useState<number | undefined>(undefined)
  const [sortBy, setSortBy] = useState<'margin' | 'price'>('margin')
  
  const contractOptions = useMemo(() => {
    // Get all unique contracts from room group rates
    const uniqueContracts = new Map<number, typeof roomGroup.rates[0]>()
    roomGroup.rates.forEach(rateItem => {
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
      .sort((a, b) => {
        if (sortBy === 'price') {
          return a.costPerRoom - b.costPerRoom // Best price first
        } else {
          return b.marginPerRoom - a.marginPerRoom // Highest margin first
        }
      })
  }, [roomGroup.rates, nights, selectedOcc, sortBy])
  
  useEffect(() => {
    if (contractOptions.length > 0) {
      const isValid = contractOptions.some(opt => opt.rate.id === selectedRateId)
      if (!isValid) {
        setSelectedRateId(contractOptions[0].rate.id)
      }
    }
  }, [contractOptions, selectedRateId])
  
  const selectedRateItem = contractOptions.find(r => r.rate.id === selectedRateId) || contractOptions[0]
  
  // Count unique sources (contracts + buy-to-order)
  const uniqueSources = useMemo(() => {
    const contractIds = new Set()
    roomGroup.rates.forEach(r => {
      const id = r.contract?.id || ((r as any).isBuyToOrder ? 'bto' : 'unknown')
      contractIds.add(id)
    })
    return contractIds.size
  }, [roomGroup.rates])
  
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
  
  return (
    <div className="border rounded-lg">
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
                <span className="font-medium">
                  {roomGroup.rates.some(r => (r as any).isBuyToOrder) ? 'On request' : roomGroup.totalAvailable}
                </span>
                {!roomGroup.rates.some(r => (r as any).isBuyToOrder) && ' available'}
              </span>
              <Separator orientation="vertical" className="h-3" />
              <span>
                <span className="font-medium">{uniqueSources}</span> source{uniqueSources > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="font-medium text-sm">{formatCurrency(roomGroup.minPrice)}</div>
            <div className="text-muted-foreground">from</div>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible className="border-0">
        <AccordionItem value="contracts" className="border-0">
          <AccordionTrigger className="px-3 py-2 text-xs hover:no-underline">
            <div className="flex items-center justify-between w-full pr-2">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                Select Contract ({contractOptions.length} for {selectedOcc})
              </span>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant={sortBy === 'margin' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-5 text-[9px] px-1.5"
                  onClick={() => setSortBy('margin')}
                >
                  Margin
                </Button>
                <Button
                  variant={sortBy === 'price' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-5 text-[9px] px-1.5"
                  onClick={() => setSortBy('price')}
                >
                  Price
                </Button>
              </div>
            </div>
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
                const bestLabel = sortBy === 'price' ? 'Best Price' : 'Best Margin'
                
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium truncate">{option.contract.contract_name}</span>
                          {isBest && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">{bestLabel}</Badge>}
                          {option.isBuyToOrder && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-orange-500 text-orange-600">
                              Buy-to-Order
                            </Badge>
                          )}
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
                          <span>
                            {option.isBuyToOrder ? 'On request' : `${option.available} avail`}
                          </span>
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
              className="h-8 text-xs"
              placeholder={selectedRateItem?.isBuyToOrder ? "Quantity" : undefined}
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

export function BookingsCreate() {
  const navigate = useNavigate()
  const { bookings, tours, rates, contracts, hotels, addBooking } = useData()
  
  // Booking state
  const [selectedTourId, setSelectedTourId] = useState(0)
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  
  // Customer details
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  
  // Filters
  const [filterOccupancy, setFilterOccupancy] = useState<OccupancyType | 'all'>('all')
  const [filterBoardType, setFilterBoardType] = useState<string>('all')
  const [filterRoomType, setFilterRoomType] = useState<string>('all')

  const selectedTour = useMemo(() => 
    tours.find(t => t.id === selectedTourId),
    [tours, selectedTourId]
  )

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
      .filter(rate => rate.hotel_id && !rate.contract_id) // Buy-to-order rates
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

  const addToCart = (rateItem: NonNullable<typeof availableRates[0]>, quantity: number, occupancyType: OccupancyType) => {
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
      rate,
      contract: effectiveContract,
      quantity,
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

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0)
  }, [cart])

  const cartRoomCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  const handleCreateBooking = () => {
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
    
    const rooms: BookingRoom[] = cart.map(item => {
      const hotel = hotels.find(h => h.id === (item.rate.hotel_id || item.contract.hotel_id))
      const isBuyToOrder = !item.contract.id || item.contract.contract_name === 'Buy-to-Order'
      
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
        price_per_room: item.pricePerRoom,
        total_price: item.totalPrice,
        purchase_status: isBuyToOrder ? 'pending_purchase' : 'not_required'
      }
    })
    
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
    navigate('/bookings')
  }

  const canCreateBooking = selectedTour && cart.length > 0 && customerName && customerEmail

  return (
    <div className="min-h-screen pt-0 bg-background">


      <div className="container mx-auto px-4 py-6">
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
                        {tours.map(tour => (
                          <SelectItem key={tour.id} value={tour.id.toString()}>
                            {tour.name} ({tour.start_date} to {tour.end_date})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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

            {/* Available Rooms */}
            {nights > 0 && (
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
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{hotel.roomGroups.length} room type{hotel.roomGroups.length > 1 ? 's' : ''}</span>
                            <Badge variant="outline" className="text-xs">
                              {hotel.roomGroups.some(rg => rg.rates.some(r => (r as any).isBuyToOrder)) 
                                ? 'On request' 
                                : `${Array.from(hotel.allocationMap.values()).reduce((sum, avail) => sum + avail, 0)} total`
                              }
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-3 bg-card pt-2 space-y-2">
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
            )}
          </div>

          {/* Sticky Cart Panel - Right Side */}
          <div className="lg:col-span-1">
            <div className="sticky top-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Cart ({cart.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Your cart is empty</p>
                      <p className="text-xs mt-1">Add rooms to get started</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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
                      
                      {/* Cart Summary */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Rooms:</span>
                          <span className="font-medium">{cartRoomCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Nights:</span>
                          <span className="font-medium">{nights}</span>
                        </div>
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

