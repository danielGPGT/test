import { useState, useMemo } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData, Booking, OccupancyType, Rate, Contract, BookingRoom } from '@/contexts/data-context'
import { Plus, ShoppingCart, Trash2, Calendar, Users, Info, Check, X } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
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

// Rate Card Component (to avoid hooks in map)
function RateCard({ 
  rateItem, 
  nights, 
  onAddToCart 
}: { 
  rateItem: { rate: Rate; contract: Contract; available: number; hotel: any }
  nights: number
  onAddToCart: (quantity: number, occupancy: OccupancyType) => void
}) {
  const { rate, contract, available, hotel } = rateItem
  const [selectedQty, setSelectedQty] = useState(1)
  // Start with the rate's default occupancy, but allow user to change it
  const [selectedOcc, setSelectedOcc] = useState<OccupancyType>(rate.occupancy_type)
  
  // Calculate price preview based on selected occupancy
  const boardCost = contract.board_options?.find(o => o.board_type === rate.board_type)?.additional_cost || 0
  const baseRate = rate.rate - boardCost
  const breakdown = calculatePriceBreakdown(baseRate, contract, selectedOcc, nights, boardCost)
  const pricePerRoom = breakdown.totalCost * nights
  const totalPrice = pricePerRoom * selectedQty
  
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">{rate.roomName}</h4>
              <Badge variant="outline">{BOARD_TYPE_LABELS[rate.board_type]}</Badge>
              <Badge variant="secondary" className="capitalize">{selectedOcc}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{hotel?.name} • {contract.contract_name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              <strong>{available}</strong> room{available !== 1 ? 's' : ''} available
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalPrice)}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(pricePerRoom)} × {selectedQty} room{selectedQty !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground">{nights} night{nights !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <Separator className="my-3" />
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <Label className="text-xs">Occupancy</Label>
            <Select value={selectedOcc} onValueChange={(v) => {
              console.log('Occupancy changed to:', v)
              setSelectedOcc(v as OccupancyType)
            }}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single (1 person)</SelectItem>
                <SelectItem value="double">Double (2 people)</SelectItem>
                <SelectItem value="triple">Triple (3 people)</SelectItem>
                <SelectItem value="quad">Quad (4 people)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Quantity</Label>
            <Input 
              type="number" 
              min={1}
              max={available}
              value={selectedQty}
              onChange={(e) => setSelectedQty(Math.min(available, Math.max(1, parseInt(e.target.value) || 1)))}
              className="h-9"
            />
          </div>
        </div>
        
          <Button 
            onClick={() => {
              console.log('RateCard - Button clicked with selectedOcc:', selectedOcc)
              onAddToCart(selectedQty, selectedOcc)
            }}
            size="sm"
            className="w-full"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart ({selectedOcc})
          </Button>
      </CardContent>
    </Card>
  )
}

export function BookingsNew() {
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
        
        // Check if contract dates overlap with booking dates
        const contractStart = new Date(contract.start_date)
        const contractEnd = new Date(contract.end_date)
        
        if (contractStart > end || contractEnd < start) return null
        
        // Calculate availability from contract allocations
        const allocation = contract.room_allocations?.find(a => a.room_group_id === rate.room_group_id)
        if (!allocation) return null
        
        // Calculate already booked rooms for this rate
        const booked = bookings
          .filter(b => b.status !== 'cancelled' && b.rooms && b.rooms.length > 0)
          .flatMap(b => b.rooms)
          .filter(r => r && r.rate_id === rate.id)
          .reduce((sum, r) => sum + r.quantity, 0)
        
        const available = allocation.quantity - booked
        
        if (available <= 0) return null
        
        return {
          rate,
          contract,
          available,
          hotel: hotels.find(h => h.id === contract.hotel_id)
        }
      })
      .filter(Boolean)
      .filter(item => {
        if (!item) return false
        // Apply filters
        if (filterOccupancy !== 'all' && item.rate.occupancy_type !== filterOccupancy) return false
        if (filterBoardType !== 'all' && item.rate.board_type !== filterBoardType) return false
        if (filterRoomType !== 'all' && item.rate.room_group_id !== filterRoomType) return false
        return true
      })
  }, [checkInDate, checkOutDate, rates, contracts, bookings, hotels, filterOccupancy, filterBoardType, filterRoomType])

  // Get unique room types for filter
  const roomTypes = useMemo(() => {
    const types = new Set<string>()
    availableRates.forEach(item => {
      if (item) types.add(item.rate.room_group_id)
    })
    return Array.from(types)
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
    
    const pricePerRoom = breakdown.totalCost * nights
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
          <p className="text-muted-foreground mt-1">Search rates, add to cart, and create bookings</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) {
            // Reset on close
            setCurrentStep('tour')
            setCart([])
            setSelectedTourId(0)
            setCheckInDate('')
            setCheckOutDate('')
            setCustomerName('')
            setCustomerEmail('')
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Booking</DialogTitle>
              <DialogDescription>
                {currentStep === 'tour' && 'Select tour and dates'}
                {currentStep === 'shop' && 'Browse and add rates to cart'}
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
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Available Rates */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableRates.length === 0 && (
                    <Card>
                      <CardContent className="pt-6 text-center text-muted-foreground">
                        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No rates available for selected dates</p>
                      </CardContent>
                    </Card>
                  )}
                  {availableRates.map((item, index) => {
                    if (!item) return null
                    
                    return (
                      <RateCard
                        key={index}
                        rateItem={item}
                        nights={nights}
                        onAddToCart={(quantity, occupancy) => addToCart(item, quantity, occupancy)}
                      />
                    )
                  })}
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

