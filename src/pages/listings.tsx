import { useState, useMemo, useEffect } from 'react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useData, Listing } from '@/contexts/data-context'
import { Plus, Info, AlertCircle, Ticket, BedDouble } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from 'sonner'

export function Listings() {
  const { listings, tours, contracts, hotels, stocks, addListing, updateListing, deleteListing } = useData()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingListing, setEditingListing] = useState<Listing | null>(null)
  const [formData, setFormData] = useState({
    tour_id: 0,
    contract_id: 0,
    hotel_id: 0,
    room_group_id: '',
    stock_id: 0,
    purchase_type: 'inventory' as 'inventory' | 'buy_to_order',
    // Legacy fields kept for type compatibility but not used in UI
    quantity: 0,
    cost_price: 0,
    selling_price: 0,
    commission_rate: 0.20,
    shoulder_night_margin: 0.25,
    sold: 0,
  })

  // Check for pre-filled data from Rates page
  useEffect(() => {
    const prefillData = sessionStorage.getItem('prefillListingFromRate')
    if (prefillData) {
      try {
        const data = JSON.parse(prefillData)
        
        // Auto-select tour that matches contract dates
        let selectedTourId = 0
        if (data.contract_id) {
          const contract = contracts.find(c => c.id === data.contract_id)
          if (contract) {
            // Find tour that overlaps with contract dates
            const matchingTour = tours.find(tour => {
              const tourStart = new Date(tour.start_date)
              const tourEnd = new Date(tour.end_date)
              const contractStart = new Date(contract.start_date)
              const contractEnd = new Date(contract.end_date)
              return contractStart <= tourEnd && contractEnd >= tourStart
            })
            if (matchingTour) {
              selectedTourId = matchingTour.id
            }
          }
        }
        
        setFormData(prev => ({
          ...prev,
          ...data,
          tour_id: selectedTourId || prev.tour_id,
          // Set suggested quantity - will be limited by contract remaining rooms
          quantity: 0 // User must enter this based on remaining rooms shown
        }))
        setIsCreateOpen(true)
        sessionStorage.removeItem('prefillListingFromRate')
        toast.success('Listing form pre-filled from rate!', {
          description: selectedTourId 
            ? 'Tour auto-selected. Adjust quantity and create.'
            : 'Please select a tour and adjust quantity.',
          duration: 5000
        })
      } catch (error) {
        console.error('Failed to parse prefill data:', error)
      }
    }
  }, [contracts, tours])

  // Get selected tour
  const selectedTour = useMemo(() => 
    tours.find(t => t.id === formData.tour_id),
    [tours, formData.tour_id]
  )

  // Filter contracts that overlap with tour dates
  const availableContracts = useMemo(() => {
    if (!selectedTour) return []
    
    return contracts.filter(contract => {
      const tourStart = new Date(selectedTour.start_date)
      const tourEnd = new Date(selectedTour.end_date)
      const contractStart = new Date(contract.start_date)
      const contractEnd = new Date(contract.end_date)
      
      // Contract must overlap with tour dates
      return contractStart <= tourEnd && contractEnd >= tourStart
    })
  }, [selectedTour, contracts])

  // Get selected contract (for inventory) or hotel (for buy-to-order)
  const selectedContract = useMemo(() =>
    formData.purchase_type === 'inventory' ? contracts.find(c => c.id === formData.contract_id) : undefined,
    [contracts, formData.contract_id, formData.purchase_type]
  )

  const selectedHotel = useMemo(() => 
    formData.purchase_type === 'buy_to_order' ? hotels.find(h => h.id === formData.hotel_id) : undefined,
    [hotels, formData.hotel_id, formData.purchase_type]
  )
  
  // Note: Room allocation now handled by Stock, not Listings

  // Get room groups from selected source (contract's hotel or direct hotel)
  const availableRoomGroups = useMemo(() => {
    if (formData.purchase_type === 'inventory' && selectedContract) {
      const hotel = hotels.find(h => h.id === selectedContract.hotel_id)
      return hotel?.room_groups || []
    } else if (formData.purchase_type === 'buy_to_order' && selectedHotel) {
      return selectedHotel.room_groups || []
    }
    return []
  }, [formData.purchase_type, selectedContract, selectedHotel, hotels])

  // Get available stocks for selected contract and room type
  const availableStocks = useMemo(() => {
    if (!formData.contract_id || !formData.room_group_id) return []
    return stocks.filter(s => s.contract_id === formData.contract_id && s.room_group_id === formData.room_group_id)
  }, [formData.contract_id, formData.room_group_id, stocks])

  // Note: Pricing handled by Rates, not Listings

  const columns = [
    { header: 'ID', accessor: 'id', width: 60 },
    { header: 'Tour', accessor: 'tourName' },
    { header: 'Source', accessor: 'sourceDisplay' },
    { header: 'Room', accessor: 'roomName' },
    { header: 'Type', accessor: 'purchase_type', format: 'badge' as const },
    { header: 'Actions', accessor: 'actions', type: 'actions' as const, actions: ['view', 'edit', 'delete'] },
  ]

  // Add calculated fields to listings
  const listingsWithCalculations = useMemo(() => 
    listings.map(listing => ({
      ...listing,
      sourceDisplay: listing.purchase_type === 'inventory' ? (listing.contractName || 'Contract') : (listing.hotelName || 'Hotel')
    })),
    [listings]
  )

  const handleCreate = () => {
    // Validation
    if (!formData.tour_id) {
      toast.error('Please select a tour')
      return
    }
    if (formData.purchase_type === 'inventory' && !formData.contract_id) {
      toast.error('Please select a contract for inventory listings')
      return
    }
    if (formData.purchase_type === 'buy_to_order' && !formData.hotel_id) {
      toast.error('Please select a hotel for buy-to-order listings')
      return
    }
    if (!formData.room_group_id) {
      toast.error('Please select a room type')
      return
    }
    // Note: quantity/cost/price handled via Stock and Rates; listing is product wrapper
    addListing(formData)
    toast.success('Listing created successfully')
    setIsCreateOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      tour_id: 0,
      contract_id: 0,
      hotel_id: 0,
      room_group_id: '',
      stock_id: 0,
      purchase_type: 'inventory',
      cost_price: 0,
      selling_price: 0,
      commission_rate: 0.20,
      shoulder_night_margin: 0.25,
      quantity: 0,
      sold: 0,
    })
  }

  const handleEdit = (listing: Listing) => {
    setEditingListing(listing)
    setFormData({
      tour_id: listing.tour_id,
      contract_id: listing.contract_id || 0,
      hotel_id: listing.hotel_id || 0,
      room_group_id: listing.room_group_id,
      stock_id: listing.stock_id || 0,
      purchase_type: listing.purchase_type,
      cost_price: listing.cost_price,
      selling_price: listing.selling_price,
      commission_rate: listing.commission_rate || 0.20,
      shoulder_night_margin: listing.shoulder_night_margin || 0.25,
      quantity: listing.quantity,
      sold: listing.sold,
    })
    setIsEditOpen(true)
  }

  const handleUpdate = () => {
    if (!editingListing) return
    
    // Validation
    if (!formData.tour_id) {
      toast.error('Please select a tour')
      return
    }
    if (formData.purchase_type === 'inventory' && !formData.contract_id) {
      toast.error('Please select a contract for inventory listings')
      return
    }
    if (formData.purchase_type === 'buy_to_order' && !formData.hotel_id) {
      toast.error('Please select a hotel for buy-to-order listings')
      return
    }
    if (!formData.room_group_id) {
      toast.error('Please select a room type')
      return
    }
    // No quantity/cost/price edits here
    updateListing(editingListing.id, formData)
    toast.success('Listing updated successfully')
    setIsEditOpen(false)
    setEditingListing(null)
    resetForm()
  }

  const handleDelete = (listing: Listing) => {
    if (confirm(`Are you sure you want to delete this listing?`)) {
      deleteListing(listing.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Listings</h1>
          <p className="text-muted-foreground mt-1">Allocate room inventory to tours</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Listing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Listing</DialogTitle>
              <DialogDescription>
                Allocate rooms from a contract to a tour for sale.
              </DialogDescription>
            </DialogHeader>

            {/* Tour Information Card */}
            {selectedTour && (
              <Card className="bg-muted/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Tour Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tour:</span>
                      <p className="font-medium">{selectedTour.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dates:</span>
                      <p className="font-medium">{selectedTour.start_date} to {selectedTour.end_date}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contract Information Card */}
            {selectedContract && (
              <Card className="bg-muted/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Contract Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Hotel:</span>
                      <p className="font-medium">{selectedContract.hotelName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Base Rate:</span>
                      <p className="font-medium">{selectedContract.base_rate} {selectedContract.currency}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Period:</span>
                      <p className="font-medium">{selectedContract.start_date} to {selectedContract.end_date}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Rooms:</span>
                      <p className="font-medium">{selectedContract.total_rooms}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warning if no contracts available */}
            {selectedTour && availableContracts.length === 0 && (
              <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-orange-900 dark:text-orange-100">No contracts available for this tour</p>
                      <p className="text-orange-700 dark:text-orange-200 mt-1">
                        There are no hotel contracts that overlap with the tour dates ({selectedTour.start_date} to {selectedTour.end_date}).
                        Please create a contract that covers these dates.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 py-4">
              <Accordion type="multiple" defaultValue={["tour-source", "room-details"]} className="w-full">
                {/* Tour & Source Section */}
                <AccordionItem value="tour-source">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      Tour & Source
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="grid gap-2">
                        <Label htmlFor="tour_id">Tour *</Label>
                        <Select
                          value={formData.tour_id.toString()}
                          onValueChange={(value) => {
                          setFormData({ 
                            ...formData, 
                            tour_id: parseInt(value),
                            contract_id: 0,
                            room_group_id: '',
                          })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a tour" />
                          </SelectTrigger>
                          <SelectContent>
                            {tours.map((tour) => (
                              <SelectItem key={tour.id} value={tour.id.toString()}>
                                {tour.name} ({tour.start_date} to {tour.end_date})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Select the tour this inventory is for
                        </p>
                      </div>

              {/* Conditional: Contract for Inventory, Hotel for Buy-to-Order */}
              {formData.purchase_type === 'inventory' ? (
                <div className="grid gap-2">
                  <Label htmlFor="contract_id">Contract *</Label>
                  <Select
                    value={formData.contract_id.toString()}
                    onValueChange={(value) => {
                      setFormData({ 
                        ...formData, 
                        contract_id: parseInt(value),
                        room_group_id: '',
                      })
                    }}
                    disabled={!selectedTour}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        selectedTour 
                          ? availableContracts.length > 0 
                            ? "Select a contract" 
                            : "No contracts available for tour dates"
                          : "Select a tour first"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableContracts.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id.toString()}>
                          {contract.contract_name} - {contract.hotelName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Pre-negotiated contract with committed rooms
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="hotel_id">Hotel *</Label>
                  <Select
                    value={formData.hotel_id.toString()}
                    onValueChange={(value) => {
                      setFormData({ 
                        ...formData, 
                        hotel_id: parseInt(value),
                        room_group_id: '',
                      })
                    }}
                    disabled={!selectedTour}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        selectedTour ? "Select a hotel" : "Select a tour first"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {hotels.map((hotel) => (
                        <SelectItem key={hotel.id} value={hotel.id.toString()}>
                          {hotel.name} - {hotel.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    No contract needed - will purchase on-demand as booked
                  </p>
                </div>
              )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Room Details Section */}
                <AccordionItem value="room-details">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4" />
                      Room Details
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="grid gap-2">
                        <Label htmlFor="room_group_id">Room Type *</Label>
                <Select
                  value={formData.room_group_id}
                  onValueChange={(value) => setFormData({ ...formData, room_group_id: value })}
                  disabled={formData.purchase_type === 'inventory' ? !selectedContract : !selectedHotel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      (formData.purchase_type === 'inventory' ? selectedContract : selectedHotel)
                        ? "Select a room type" 
                        : formData.purchase_type === 'inventory' ? "Select a contract first" : "Select a hotel first"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoomGroups.map((roomGroup) => (
                      <SelectItem key={roomGroup.id} value={roomGroup.id}>
                        {roomGroup.room_type} (Capacity: {roomGroup.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                      <div className="grid gap-2">
                        <Label htmlFor="stock_id">Stock (optional for inventory)</Label>
                        <Select
                          value={String(formData.stock_id || '')}
                          onValueChange={(value) => setFormData({ ...formData, stock_id: parseInt(value) || 0 })}
                          disabled={formData.purchase_type !== 'inventory'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an allotment (if any)" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStocks.map((s) => (
                              <SelectItem key={s.id} value={s.id.toString()}>
                                {s.roomName} • Qty {s.quantity}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Pricing and occupancy/board will be chosen during booking via rate plans.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                
              </Accordion>

              {/* Note: Sold quantities tracked via Stock and Bookings, not Listings */}
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
                  !formData.room_group_id ||
                  (formData.purchase_type === 'inventory' ? !formData.contract_id : !formData.hotel_id)
                }
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        title="Tour Room Inventory"
        columns={columns}
        data={listingsWithCalculations}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchable
      />

      {/* Edit Dialog - Similar structure */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
            <DialogDescription>Update listing information.</DialogDescription>
          </DialogHeader>

          {selectedTour && (
            <Card className="bg-muted/50">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Tour: {selectedTour.name}
                </CardTitle>
              </CardHeader>
            </Card>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-tour_id">Tour *</Label>
              <Select
                value={formData.tour_id.toString()}
                onValueChange={(value) => {
                  setFormData({ 
                    ...formData, 
                    tour_id: parseInt(value),
                    contract_id: 0,
                    room_group_id: '',
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tour" />
                </SelectTrigger>
                <SelectContent>
                  {tours.map((tour) => (
                    <SelectItem key={tour.id} value={tour.id.toString()}>
                      {tour.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-contract_id">Contract *</Label>
              <Select
                value={formData.contract_id.toString()}
                onValueChange={(value) => {
                  setFormData({ 
                    ...formData, 
                    contract_id: parseInt(value),
                    room_group_id: '',
                  })
                }}
                disabled={!selectedTour}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contract" />
                </SelectTrigger>
                <SelectContent>
                  {availableContracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id.toString()}>
                      {contract.contract_name} - {contract.hotelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-room_group_id">Room Type *</Label>
              <Select
                value={formData.room_group_id}
                onValueChange={(value) => setFormData({ ...formData, room_group_id: value })}
                disabled={!selectedContract}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a room type" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoomGroups.map((roomGroup) => (
                    <SelectItem key={roomGroup.id} value={roomGroup.id}>
                      {roomGroup.room_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Note: Occupancy, quantity, pricing handled by Rates and Stock */}

            <div className="grid gap-2">
              <Label htmlFor="edit-purchase_type">Purchase Type *</Label>
              <Select
                value={formData.purchase_type}
                onValueChange={(value: 'inventory' | 'buy_to_order') => setFormData({ ...formData, purchase_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="buy_to_order">Buy to Order</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditOpen(false)
              setEditingListing(null)
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



