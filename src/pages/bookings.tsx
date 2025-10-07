import { useState, useMemo } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData, Booking } from '@/contexts/data-context'
import { Plus, AlertCircle, Users, FileText, Info, CheckCircle2 } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { formatCurrency } from '@/lib/utils'

export function Bookings() {
  const { bookings, tours, listings, rates, stocks, contracts, addBooking, cancelBooking, recordPurchaseDetails } = useData()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false)
  const [selectedBookingForPurchase, setSelectedBookingForPurchase] = useState<Booking | null>(null)
  const [formData, setFormData] = useState({
    tour_id: 0,
    listing_id: 0,
    rate_id: 0, // New field for rate selection
    // New booking controls
    check_in_date: '',
    check_out_date: '',
    adults: 2,
    children: 0,
    // Customer + rooms
    customer_name: '',
    customer_email: '',
    quantity: 1,
    // Second room (optional)
    second_listing_id: 0,
    second_rate_id: 0,
    second_quantity: 0,
  })

  const [purchaseFormData, setPurchaseFormData] = useState({
    assigned_to: '',
    hotel_contact: '',
    hotel_confirmation: '',
    cost_per_room: 0,
    notes: '',
  })

  // Get selected tour
  const selectedTour = useMemo(() => 
    tours.find(t => t.id === formData.tour_id),
    [tours, formData.tour_id]
  )

  // Derived check-in/out: default to tour dates if not set
  const effectiveCheckIn = formData.check_in_date || selectedTour?.start_date || ''
  const effectiveCheckOut = formData.check_out_date || selectedTour?.end_date || ''

  // Get available listings for selected tour
  const availableListings = useMemo(() => {
    if (!selectedTour) return []
    
    return listings
      .filter(l => l.tour_id === selectedTour.id)
      .map(l => {
        // For inventory listings, check stock availability
        if (l.purchase_type === 'inventory' && l.stock_id) {
          const stock = stocks.find(s => s.id === l.stock_id)
          const sold = bookings
            .filter(b => b.listing_id === l.id && b.status !== 'cancelled')
            .reduce((sum, b) => sum + b.quantity, 0)
          return {
            ...l,
            available: stock ? stock.quantity - sold : 0
          }
        }
        // For buy-to-order or listings without stock, always show (flexible)
        return {
          ...l,
          available: 999 // Large number to indicate flexible capacity
        }
      })
      .filter(l => {
        // Inventory: must have availability
        if (l.purchase_type === 'inventory') {
          return l.available > 0
        }
        // Buy-to-order: always show (flexible capacity)
        return true
      })
  }, [selectedTour, listings, stocks, bookings])

  // Get selected listing
  const selectedListing = useMemo(() => 
    availableListings.find(l => l.id === formData.listing_id),
    [availableListings, formData.listing_id]
  )

  // Get available rates for selected listing
  const availableRates = useMemo(() => {
    if (!selectedListing) return []
    
    // For inventory listings: find rates that match the listing's contract and room group
    if (selectedListing.purchase_type === 'inventory' && selectedListing.contract_id) {
      return rates.filter(rate => 
        rate.contract_id === selectedListing.contract_id && 
        rate.room_group_id === selectedListing.room_group_id
      )
    }
    
    // For buy-to-order listings: find rates for the hotel and room group
    if (selectedListing.purchase_type === 'buy_to_order' && selectedListing.hotel_id) {
      // Find contracts for this hotel and get their rates
      const hotelContracts = contracts.filter(c => c.hotel_id === selectedListing.hotel_id)
      const contractIds = hotelContracts.map(c => c.id)
      
      return rates.filter(rate => 
        contractIds.includes(rate.contract_id) && 
        rate.room_group_id === selectedListing.room_group_id
      )
    }
    
    return []
  }, [selectedListing, rates, contracts])

  // Get available listings for second room (exclude first selected room)
  const availableSecondListings = useMemo(() => {
    if (!selectedListing) return []
    
    return availableListings.filter(l => l.id !== selectedListing.id)
  }, [availableListings, selectedListing])

  // Get selected second listing
  const selectedSecondListing = useMemo(() => 
    availableSecondListings.find(l => l.id === formData.second_listing_id),
    [availableSecondListings, formData.second_listing_id]
  )

  // Get available rates for second listing
  const availableSecondRates = useMemo(() => {
    if (!selectedSecondListing) return []
    
    // For inventory listings: find rates that match the listing's contract and room group
    if (selectedSecondListing.purchase_type === 'inventory' && selectedSecondListing.contract_id) {
      return rates.filter(rate => 
        rate.contract_id === selectedSecondListing.contract_id && 
        rate.room_group_id === selectedSecondListing.room_group_id
      )
    }
    
    // For buy-to-order listings: find rates for the hotel and room group
    if (selectedSecondListing.purchase_type === 'buy_to_order' && selectedSecondListing.hotel_id) {
      // Find contracts for this hotel and get their rates
      const hotelContracts = contracts.filter(c => c.hotel_id === selectedSecondListing.hotel_id)
      const contractIds = hotelContracts.map(c => c.id)
      
      return rates.filter(rate => 
        contractIds.includes(rate.contract_id) && 
        rate.room_group_id === selectedSecondListing.room_group_id
      )
    }
    
    return []
  }, [selectedSecondListing, rates, contracts])

  // Get selected second rate
  const selectedSecondRate = useMemo(() => 
    availableSecondRates.find(r => r.id === formData.second_rate_id),
    [availableSecondRates, formData.second_rate_id]
  )

  // Get selected rate
  const selectedRate = useMemo(() => 
    availableRates.find(r => r.id === formData.rate_id),
    [availableRates, formData.rate_id]
  )

  // Get selected contract for pricing calculations
  const selectedContract = useMemo(() => {
    if (!selectedListing) return null
    
    if (selectedListing.purchase_type === 'inventory' && selectedListing.contract_id) {
      return contracts.find(c => c.id === selectedListing.contract_id)
    }
    
    // For buy-to-order, find any contract for the hotel
    if (selectedListing.purchase_type === 'buy_to_order' && selectedListing.hotel_id) {
      return contracts.find(c => c.hotel_id === selectedListing.hotel_id)
    }
    
    return null
  }, [selectedListing, contracts])

  // Calculate price for a single room type
  const calculateRoomPrice = (rate: any, contract: any, quantity: number) => {
    if (!rate || !contract || quantity <= 0) return 0

    const checkInDate = new Date(effectiveCheckIn)
    const checkOutDate = new Date(effectiveCheckOut)
    const contractStartDate = new Date(contract.start_date)
    const contractEndDate = new Date(contract.end_date)
    
    // Calculate number of nights
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    
    let totalBasePrice = 0
    
    // Calculate base price for each night
    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkInDate)
      currentDate.setDate(currentDate.getDate() + i)
      
      let nightlyRate = rate.rate
      
      // Check if this is a shoulder night
      if (currentDate < contractStartDate) {
        // Pre-shoulder night
        const daysBefore = Math.ceil((contractStartDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
        if (contract.pre_shoulder_rates && contract.pre_shoulder_rates[daysBefore - 1]) {
          nightlyRate = contract.pre_shoulder_rates[daysBefore - 1]
        }
      } else if (currentDate > contractEndDate) {
        // Post-shoulder night
        const daysAfter = Math.ceil((currentDate.getTime() - contractEndDate.getTime()) / (1000 * 60 * 60 * 24))
        if (contract.post_shoulder_rates && contract.post_shoulder_rates[daysAfter - 1]) {
          nightlyRate = contract.post_shoulder_rates[daysAfter - 1]
        }
      }
      
      totalBasePrice += nightlyRate
    }
    
    // Apply quantity
    totalBasePrice *= quantity
    
    // Calculate taxes and fees
    let totalTaxes = 0
    let totalFees = 0
    
    // VAT/Sales tax
    if (contract.tax_rate) {
      totalTaxes += totalBasePrice * contract.tax_rate
    }
    
    // City tax per person per night
    if (contract.city_tax_per_person_per_night) {
      // Assume 2 people per room for city tax calculation
      const peoplePerRoom = 2
      totalFees += contract.city_tax_per_person_per_night * peoplePerRoom * nights * quantity
    }
    
    // Resort fee per room per night
    if (contract.resort_fee_per_night) {
      totalFees += contract.resort_fee_per_night * nights * quantity
    }
    
    return totalBasePrice + totalTaxes + totalFees
  }

  // Calculate total price including both rooms
  const calculateTotalPrice = useMemo(() => {
    if (!selectedRate || !selectedContract || !selectedTour || formData.quantity <= 0) {
      return 0
    }

    let totalPrice = calculateRoomPrice(selectedRate, selectedContract, formData.quantity)
    
    // Add second room if selected
    if (selectedSecondRate && selectedSecondListing && formData.second_quantity > 0) {
      const secondContract = selectedSecondListing.purchase_type === 'inventory' && selectedSecondListing.contract_id
        ? contracts.find(c => c.id === selectedSecondListing.contract_id)
        : contracts.find(c => c.hotel_id === selectedSecondListing.hotel_id)
      
      if (secondContract) {
        totalPrice += calculateRoomPrice(selectedSecondRate, secondContract, formData.second_quantity)
      }
    }
    
    return totalPrice
  }, [selectedRate, selectedContract, selectedTour, formData.quantity, selectedSecondRate, selectedSecondListing, formData.second_quantity, effectiveCheckIn, effectiveCheckOut, contracts])

  const columns = [
    { header: 'ID', accessor: 'id', width: 60 },
    { 
      header: 'Status', 
      accessor: 'status',
      format: 'badge' as const,
    },
    { 
      header: 'Type', 
      accessor: 'purchase_type',
      format: 'badge' as const,
    },
    { header: 'Tour', accessor: 'tourName' },
    { header: 'Room', accessor: 'roomName' },
    { header: 'Occupancy', accessor: 'occupancy_type', format: 'badge' as const },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Email', accessor: 'customer_email', truncate: true },
    { header: 'Rooms', accessor: 'quantity' },
    { header: 'Total Price', accessor: 'total_price', format: 'currency' as const },
    { header: 'Booking Date', accessor: 'booking_date', format: 'date' as const },
    { header: 'Actions', accessor: 'actions', type: 'actions' as const, actions: ['view'] },
  ]

  const handleCreate = () => {
    if (!selectedListing || !selectedRate || !selectedContract || !selectedTour) return

    // Calculate number of nights
    const checkInDate = new Date(effectiveCheckIn)
    const checkOutDate = new Date(effectiveCheckOut)
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

    // Create first booking
    const firstRoomPrice = calculateRoomPrice(selectedRate, selectedContract, formData.quantity)
    addBooking({
      listing_id: formData.listing_id,
      rate_id: formData.rate_id,
      customer_name: formData.customer_name,
      customer_email: formData.customer_email,
      quantity: formData.quantity,
      total_price: firstRoomPrice,
      // Required fields
      occupancy_type: selectedRate.occupancy_type,
      check_in_date: effectiveCheckIn,
      check_out_date: effectiveCheckOut,
      nights: nights,
    })

    // Create second booking if second room is selected
    if (selectedSecondRate && selectedSecondListing && formData.second_quantity > 0) {
      const secondContract = selectedSecondListing.purchase_type === 'inventory' && selectedSecondListing.contract_id
        ? contracts.find(c => c.id === selectedSecondListing.contract_id)
        : contracts.find(c => c.hotel_id === selectedSecondListing.hotel_id)
      
      if (secondContract) {
        const secondRoomPrice = calculateRoomPrice(selectedSecondRate, secondContract, formData.second_quantity)
        addBooking({
          listing_id: formData.second_listing_id,
          rate_id: formData.second_rate_id,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          quantity: formData.second_quantity,
          total_price: secondRoomPrice,
          // Required fields
          occupancy_type: selectedSecondRate.occupancy_type,
          check_in_date: effectiveCheckIn,
          check_out_date: effectiveCheckOut,
          nights: nights,
        })
      }
    }

    setIsCreateOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      tour_id: 0,
      listing_id: 0,
      rate_id: 0,
      check_in_date: '',
      check_out_date: '',
      adults: 2,
      children: 0,
      customer_name: '',
      customer_email: '',
      quantity: 1,
      // Second room (optional)
      second_listing_id: 0,
      second_rate_id: 0,
      second_quantity: 0,
    })
  }

  const handleCancel = (booking: Booking) => {
    if (booking.status === 'cancelled') {
      alert('This booking is already cancelled')
      return
    }

    if (confirm(`Cancel booking for ${booking.customer_name}? This will return ${booking.quantity} room(s) to inventory.`)) {
      cancelBooking(booking.id)
    }
  }

  const handleOpenPurchaseForm = (booking: Booking) => {
    if (booking.purchase_type !== 'buy_to_order') {
      alert('This booking doesn\'t require purchase entry')
      return
    }

    if (booking.purchase_status === 'purchased') {
      alert('Purchase details already entered for this booking')
      return
    }

    setSelectedBookingForPurchase(booking)
    setPurchaseFormData({
      assigned_to: '',
      hotel_contact: '',
      hotel_confirmation: '',
      cost_per_room: 0,
      notes: '',
    })
    setIsPurchaseFormOpen(true)
  }

  const handleSubmitPurchase = () => {
    if (!selectedBookingForPurchase) return

    if (!purchaseFormData.assigned_to || !purchaseFormData.hotel_contact || 
        !purchaseFormData.hotel_confirmation || purchaseFormData.cost_per_room <= 0) {
      alert('Please fill in all required fields')
      return
    }

    recordPurchaseDetails(selectedBookingForPurchase.id, purchaseFormData)
    setIsPurchaseFormOpen(false)
    setSelectedBookingForPurchase(null)
    
    const totalCost = purchaseFormData.cost_per_room * selectedBookingForPurchase.quantity
    const profit = selectedBookingForPurchase.total_price - totalCost
    
    alert(`✅ Purchase recorded successfully!\n\nBooking Status: CONFIRMED\nTotal Cost: ${formatCurrency(totalCost)}\nProfit Margin: ${formatCurrency(profit)}`)
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const confirmed = bookings.filter(b => b.status === 'confirmed').length
    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.total_price, 0)
    const totalRooms = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.quantity, 0)

    return { confirmed, totalRevenue, totalRooms }
  }, [bookings])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground mt-1">Book rooms and see real-time inventory updates</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Booking</DialogTitle>
              <DialogDescription>
                Book rooms from tour inventory. Inventory will update instantly.
              </DialogDescription>
            </DialogHeader>

            {/* Tour Information */}
            {selectedTour && (
              <Card className="bg-muted/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Tour: {selectedTour.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Dates:</span>
                      <p className="font-medium">{selectedTour.start_date} to {selectedTour.end_date}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Available Listings:</span>
                      <p className="font-medium">{availableListings.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Listing Details */}
            {selectedListing && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Selected Room
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Room Type:</span>
                      <p className="font-medium">{selectedListing.roomName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Available:</span>
                      <p className="font-medium text-green-600">
                        {selectedListing.available} rooms
                        {selectedListing.purchase_type === 'buy_to_order' && ' (flexible)'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Contract:</span>
                      <p className="font-medium text-xs">{selectedListing.contractName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium">
                        <Badge variant={selectedListing.purchase_type === 'inventory' ? 'default' : 'secondary'}>
                          {selectedListing.purchase_type === 'inventory' ? 'Inventory' : 'Buy to Order'}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  {selectedListing.purchase_type === 'buy_to_order' && (
                    <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-md border border-orange-200 dark:border-orange-800">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                        <div className="text-xs">
                          <p className="font-medium text-orange-900 dark:text-orange-100 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Buy-to-Order Notice
                          </p>
                          <p className="text-orange-700 dark:text-orange-200 mt-1">
                            This booking will be <strong>PENDING</strong> until operations team purchases these rooms from the hotel. 
                            The operations team will be notified to contact the hotel and enter purchase details.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {formData.quantity > 0 && selectedRate && selectedContract && (
                    <div className="mt-4 p-3 bg-background rounded-md border">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total Price:</span>
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(calculateTotalPrice)}
                          </span>
                        </div>
                        {selectedContract && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                              <span>Base rate:</span>
                              <span>{formatCurrency(selectedRate.rate)} per night</span>
                            </div>
                            {selectedContract.tax_rate && (
                              <div className="flex justify-between">
                                <span>Tax ({Math.round(selectedContract.tax_rate * 100)}%):</span>
                                <span>{formatCurrency(calculateTotalPrice * selectedContract.tax_rate / (1 + selectedContract.tax_rate))}</span>
                              </div>
                            )}
                            {selectedContract.city_tax_per_person_per_night && (
                              <div className="flex justify-between">
                                <span>City tax:</span>
                                <span>{formatCurrency(selectedContract.city_tax_per_person_per_night * 2 * Math.ceil((new Date(selectedTour?.end_date || '').getTime() - new Date(selectedTour?.start_date || '').getTime()) / (1000 * 60 * 60 * 24)) * formData.quantity)}</span>
                              </div>
                            )}
                            {selectedContract.resort_fee_per_night && (
                              <div className="flex justify-between">
                                <span>Resort fee:</span>
                                <span>{formatCurrency(selectedContract.resort_fee_per_night * Math.ceil((new Date(selectedTour?.end_date || '').getTime() - new Date(selectedTour?.start_date || '').getTime()) / (1000 * 60 * 60 * 24)) * formData.quantity)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Warning if no listings available */}
            {selectedTour && availableListings.length === 0 && (
              <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-orange-900 dark:text-orange-100">No availability for this tour</p>
                      <p className="text-orange-700 dark:text-orange-200 mt-1">
                        All rooms for this tour are sold out or no listings have been created yet. 
                        Create listings in the Listings page to make inventory available.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tour_id">Tour *</Label>
                <Select
                  value={formData.tour_id.toString()}
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      tour_id: parseInt(value),
                      listing_id: 0,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tour" />
                  </SelectTrigger>
                  <SelectContent>
                    {tours.map((tour) => (
                      <SelectItem key={tour.id} value={tour.id.toString()}>
                        {tour.name} ({tour.start_date})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="listing_id">Room Type *</Label>
                <Select
                  value={formData.listing_id.toString()}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    listing_id: parseInt(value),
                    rate_id: 0 // Reset rate when listing changes
                  })}
                  disabled={!selectedTour || availableListings.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      selectedTour 
                        ? availableListings.length > 0 
                          ? "Select room type" 
                          : "No available rooms"
                        : "Select a tour first"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableListings.map((listing) => (
                      <SelectItem key={listing.id} value={listing.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{listing.roomName}</span>
                          <span className="ml-4 text-xs text-muted-foreground">
                            {listing.purchase_type === 'inventory' 
                              ? `${listing.available} available`
                              : `${listing.sold} sold (flexible)`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Inventory listings shown only if available. Buy-to-order always shown (flexible capacity).
                </p>
              </div>

              {/* Rate Selection */}
              {selectedListing && (
                <div className="grid gap-2">
                  <Label htmlFor="rate_id">Rate Plan *</Label>
                  <Select
                    value={formData.rate_id.toString()}
                    onValueChange={(value) => setFormData({ ...formData, rate_id: parseInt(value) })}
                    disabled={availableRates.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        availableRates.length > 0 
                          ? "Select rate plan" 
                          : "No rates available for this room type"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRates.map((rate) => (
                        <SelectItem key={rate.id} value={rate.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {rate.occupancy_type.charAt(0).toUpperCase() + rate.occupancy_type.slice(1)} • {rate.board_type.replace('_', ' ')}
                            </span>
                            <span className="ml-4 text-xs text-muted-foreground">
                              {formatCurrency(rate.rate)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose occupancy and board type for this booking.
                  </p>
                  {availableRates.length === 0 && selectedListing && (
                    <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-950 rounded-md border border-orange-200 dark:border-orange-800">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                        <div className="text-xs">
                          <p className="font-medium text-orange-900 dark:text-orange-100">
                            No rates found for this room type
                          </p>
                          <p className="text-orange-700 dark:text-orange-200 mt-1">
                            {selectedListing.purchase_type === 'inventory' 
                              ? `No rates configured for contract ${selectedListing.contract_id} and room type ${selectedListing.room_group_id}. Please create rates in the Rates page.`
                              : `No rates configured for hotel ${selectedListing.hotel_id} and room type ${selectedListing.room_group_id}. Please create rates in the Rates page.`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Second Room Selection (Optional) */}
              {selectedListing && availableSecondListings.length > 0 && (
                <div className="grid gap-2">
                  <Label htmlFor="second_listing_id">Second Room Type (Optional)</Label>
                  <Select
                    value={formData.second_listing_id.toString()}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      second_listing_id: parseInt(value),
                      second_rate_id: 0, // Reset rate when listing changes
                      second_quantity: 0, // Reset quantity
                    })}
                    disabled={availableSecondListings.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a second room type (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSecondListings.map((listing) => (
                        <SelectItem key={listing.id} value={listing.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{listing.roomName}</span>
                            <span className="ml-4 text-xs text-muted-foreground">
                              {listing.purchase_type === 'inventory' 
                                ? `${listing.available} available`
                                : `${listing.sold} sold (flexible)`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Add a second room type to the same booking.
                  </p>
                </div>
              )}

              {/* Second Room Rate Selection */}
              {selectedSecondListing && (
                <div className="grid gap-2">
                  <Label htmlFor="second_rate_id">Second Room Rate Plan *</Label>
                  <Select
                    value={formData.second_rate_id.toString()}
                    onValueChange={(value) => setFormData({ ...formData, second_rate_id: parseInt(value) })}
                    disabled={availableSecondRates.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        availableSecondRates.length > 0 
                          ? "Select rate plan for second room" 
                          : "No rates available for this room type"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSecondRates.map((rate) => (
                        <SelectItem key={rate.id} value={rate.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {rate.occupancy_type.charAt(0).toUpperCase() + rate.occupancy_type.slice(1)} • {rate.board_type.replace('_', ' ')}
                            </span>
                            <span className="ml-4 text-xs text-muted-foreground">
                              {formatCurrency(rate.rate)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="check_in">Check-in Date</Label>
                  <Input
                    id="check_in"
                    type="date"
                    value={effectiveCheckIn}
                    onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="check_out">Check-out Date</Label>
                  <Input
                    id="check_out"
                    type="date"
                    value={effectiveCheckOut}
                    min={effectiveCheckIn || undefined}
                    onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="adults">Adults</Label>
                  <Input
                    id="adults"
                    type="number"
                    min="1"
                    value={formData.adults}
                    onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="children">Children</Label>
                  <Input
                    id="children"
                    type="number"
                    min="0"
                    value={formData.children}
                    onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">First Room Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedListing?.purchase_type === 'inventory' ? selectedListing.available : undefined}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    disabled={!selectedListing}
                  />
                  {selectedListing && (
                    <p className="text-xs text-muted-foreground">
                      {selectedListing.purchase_type === 'inventory' 
                        ? `Max: ${selectedListing.available} rooms`
                        : `Flexible capacity`}
                    </p>
                  )}
                </div>
                {selectedSecondListing && (
                  <div className="grid gap-2">
                    <Label htmlFor="second_quantity">Second Room Quantity *</Label>
                    <Input
                      id="second_quantity"
                      type="number"
                      min="1"
                      max={selectedSecondListing?.purchase_type === 'inventory' ? selectedSecondListing.available : undefined}
                      value={formData.second_quantity}
                      onChange={(e) => setFormData({ ...formData, second_quantity: parseInt(e.target.value) || 1 })}
                      disabled={!selectedSecondListing}
                    />
                    {selectedSecondListing && (
                      <p className="text-xs text-muted-foreground">
                        {selectedSecondListing.purchase_type === 'inventory' 
                          ? `Max: ${selectedSecondListing.available} rooms`
                          : `Flexible capacity`}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer_email">Customer Email *</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  placeholder="john.smith@example.com"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateOpen(false)
                resetForm()
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={
                  !formData.tour_id || 
                  !formData.listing_id || 
                  !formData.rate_id ||
                  !effectiveCheckIn ||
                  !effectiveCheckOut ||
                  !formData.customer_name || 
                  !formData.customer_email ||
                  formData.quantity < 1 ||
                  (formData.second_listing_id > 0 && (!formData.second_rate_id || formData.second_quantity < 1))
                }
              >
                Confirm Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground">Confirmed bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From confirmed bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rooms Booked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRooms}</div>
            <p className="text-xs text-muted-foreground">Total rooms sold</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Buy-to-Order Bookings Alert */}
      {bookings.some(b => b.purchase_type === 'buy_to_order' && b.purchase_status === 'pending_purchase') && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                  Pending Hotel Purchases
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-200 mt-1">
                  You have buy-to-order bookings that need rooms purchased from the hotel. 
                  Operations team must contact the hotel and enter purchase details.
                </p>
                <div className="mt-3 space-y-2">
                  {bookings
                    .filter(b => b.purchase_type === 'buy_to_order' && b.purchase_status === 'pending_purchase')
                    .map(booking => (
                      <div key={booking.id} className="flex items-center justify-between bg-background/50 rounded-md p-2">
                        <div className="text-sm">
                          <span className="font-medium">Booking #{booking.id}</span>
                          {' - '}
                          {booking.customer_name} 
                          {' - '}
                          {booking.quantity} × {booking.roomName}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleOpenPurchaseForm(booking)}
                          variant="default"
                        >
                          Enter Purchase Details
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings Table */}
      <DataTable
        title="All Bookings"
        columns={columns}
        data={bookings}
        onDelete={handleCancel}
        searchable
      />

      {/* Purchase Details Form Dialog */}
      <Dialog open={isPurchaseFormOpen} onOpenChange={setIsPurchaseFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enter Purchase Details</DialogTitle>
            <DialogDescription>
              Record the details of your hotel room purchase for this booking.
            </DialogDescription>
          </DialogHeader>

          {selectedBookingForPurchase && (
            <>
              {/* Booking Summary */}
              <Card className="bg-muted/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Customer:</span>
                      <p className="font-medium">{selectedBookingForPurchase.customer_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tour:</span>
                      <p className="font-medium">{selectedBookingForPurchase.tourName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Room:</span>
                      <p className="font-medium">{selectedBookingForPurchase.roomName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Occupancy:</span>
                      <p className="font-medium capitalize">{selectedBookingForPurchase.occupancy_type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <p className="font-medium">{selectedBookingForPurchase.quantity} rooms</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Selling Price (Total):</span>
                      <p className="font-medium text-green-600">{formatCurrency(selectedBookingForPurchase.total_price)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Form */}
              <div className="grid gap-4 py-4">
                <Accordion type="multiple" defaultValue={["team-info", "purchase-details"]} className="w-full">
                  {/* Team Information Section */}
                  <AccordionItem value="team-info">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Team & Hotel Contact
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="grid gap-2">
                          <Label htmlFor="assigned_to">
                            Purchased By (Operations Team Member) *
                          </Label>
                          <Input
                            id="assigned_to"
                            value={purchaseFormData.assigned_to}
                            onChange={(e) => setPurchaseFormData({ ...purchaseFormData, assigned_to: e.target.value })}
                            placeholder="e.g., John Smith"
                          />
                          <p className="text-xs text-muted-foreground">
                            Who from your team purchased these rooms?
                          </p>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="hotel_contact">Hotel Contact Person *</Label>
                          <Input
                            id="hotel_contact"
                            value={purchaseFormData.hotel_contact}
                            onChange={(e) => setPurchaseFormData({ ...purchaseFormData, hotel_contact: e.target.value })}
                            placeholder="e.g., Marie Dupont"
                          />
                          <p className="text-xs text-muted-foreground">
                            Who at the hotel did you work with?
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Purchase Details Section */}
                  <AccordionItem value="purchase-details">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Purchase Details & Costs
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="grid gap-2">
                          <Label htmlFor="hotel_confirmation">Hotel Confirmation Number *</Label>
                          <Input
                            id="hotel_confirmation"
                            value={purchaseFormData.hotel_confirmation}
                            onChange={(e) => setPurchaseFormData({ ...purchaseFormData, hotel_confirmation: e.target.value })}
                            placeholder="e.g., HTL-2025-12345"
                          />
                          <p className="text-xs text-muted-foreground">
                            The confirmation number provided by the hotel
                          </p>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="cost_per_room">Cost Per Room (from hotel) *</Label>
                          <Input
                            id="cost_per_room"
                            type="number"
                            step="0.01"
                            min="0"
                            value={purchaseFormData.cost_per_room}
                            onChange={(e) => setPurchaseFormData({ ...purchaseFormData, cost_per_room: parseFloat(e.target.value) || 0 })}
                            placeholder="e.g., 130.00"
                          />
                          {purchaseFormData.cost_per_room > 0 && (
                            <div className="text-sm space-y-1">
                              <p className="text-muted-foreground">
                                <strong>Total Cost:</strong> {formatCurrency(purchaseFormData.cost_per_room * selectedBookingForPurchase.quantity)}
                              </p>
                              <p className={purchaseFormData.cost_per_room * selectedBookingForPurchase.quantity <= selectedBookingForPurchase.total_price ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                <strong>Profit Margin:</strong> {formatCurrency(selectedBookingForPurchase.total_price - (purchaseFormData.cost_per_room * selectedBookingForPurchase.quantity))}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            value={purchaseFormData.notes}
                            onChange={(e) => setPurchaseFormData({ ...purchaseFormData, notes: e.target.value })}
                            placeholder="Any additional notes about this purchase..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {purchaseFormData.cost_per_room > 0 && 
               purchaseFormData.cost_per_room * selectedBookingForPurchase.quantity > selectedBookingForPurchase.total_price && (
                <Card className="border-red-500 bg-red-50 dark:bg-red-950">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-red-900 dark:text-red-100">
                          Warning: Negative Margin
                        </p>
                        <p className="text-red-700 dark:text-red-200 mt-1">
                          The cost from the hotel ({formatCurrency(purchaseFormData.cost_per_room * selectedBookingForPurchase.quantity)}) 
                          exceeds your selling price ({formatCurrency(selectedBookingForPurchase.total_price)}). 
                          You will lose {formatCurrency((purchaseFormData.cost_per_room * selectedBookingForPurchase.quantity) - selectedBookingForPurchase.total_price)} on this booking.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPurchaseFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitPurchase}>
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

