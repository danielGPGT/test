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
  const { bookings, tours, listings, addBooking, cancelBooking, recordPurchaseDetails } = useData()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false)
  const [selectedBookingForPurchase, setSelectedBookingForPurchase] = useState<Booking | null>(null)
  const [formData, setFormData] = useState({
    tour_id: 0,
    listing_id: 0,
    customer_name: '',
    customer_email: '',
    quantity: 1,
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

  // Get available listings for selected tour
  const availableListings = useMemo(() => {
    if (!selectedTour) return []
    
    return listings
      .filter(l => l.tour_id === selectedTour.id)
      .map(l => ({
        ...l,
        available: l.quantity - l.sold
      }))
      .filter(l => {
        // Inventory: must have availability
        if (l.purchase_type === 'inventory') {
          return l.available > 0
        }
        // Buy-to-order: always show (flexible capacity)
        return true
      })
  }, [selectedTour, listings])

  // Get selected listing
  const selectedListing = useMemo(() => 
    availableListings.find(l => l.id === formData.listing_id),
    [availableListings, formData.listing_id]
  )

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
    if (!selectedListing) return

    const totalPrice = selectedListing.selling_price * formData.quantity

    addBooking({
      listing_id: formData.listing_id,
      customer_name: formData.customer_name,
      customer_email: formData.customer_email,
      quantity: formData.quantity,
      total_price: totalPrice,
    })

    setIsCreateOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      tour_id: 0,
      listing_id: 0,
      customer_name: '',
      customer_email: '',
      quantity: 1,
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
                      <span className="text-muted-foreground">Occupancy:</span>
                      <p className="font-medium capitalize">{selectedListing.occupancy_type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Selling Price:</span>
                      <p className="font-medium text-primary">{formatCurrency(selectedListing.selling_price)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Board Type:</span>
                      <p className="font-medium capitalize">{selectedListing.board_type.replace('_', ' ')}</p>
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
                  {formData.quantity > 0 && (
                    <div className="mt-4 p-3 bg-background rounded-md border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Price:</span>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(selectedListing.selling_price * formData.quantity)}
                        </span>
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
                <Label htmlFor="listing_id">Room Type & Occupancy *</Label>
                <Select
                  value={formData.listing_id.toString()}
                  onValueChange={(value) => setFormData({ ...formData, listing_id: parseInt(value) })}
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
                          <span>
                            {listing.roomName} - {listing.occupancy_type.charAt(0).toUpperCase() + listing.occupancy_type.slice(1)}
                          </span>
                          <span className="ml-4 text-xs text-muted-foreground">
                            {formatCurrency(listing.selling_price)} • {listing.purchase_type === 'inventory' 
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

              <div className="grid gap-2">
                <Label htmlFor="quantity">Number of Rooms *</Label>
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
                      ? `Maximum: ${selectedListing.available} rooms available (hard limit)`
                      : `Target remaining: ${selectedListing.available} (flexible - can exceed for buy-to-order)`}
                  </p>
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
                  !formData.customer_name || 
                  !formData.customer_email ||
                  formData.quantity < 1
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

