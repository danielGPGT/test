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
import { useData, Listing, OccupancyType, BoardType } from '@/contexts/data-context'
import { Plus, Info, AlertCircle, Ticket, BedDouble, DollarSign, Package } from 'lucide-react'
import { BOARD_TYPE_LABELS, calculateSellingPrice, calculatePriceBreakdown } from '@/lib/pricing'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from 'sonner'

export function Listings() {
  const { listings, tours, contracts, hotels, rates, addListing, updateListing, deleteListing } = useData()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingListing, setEditingListing] = useState<Listing | null>(null)
  const [formData, setFormData] = useState({
    tour_id: 0,
    contract_id: 0,
    hotel_id: 0,
    room_group_id: '',
    occupancy_type: 'double' as OccupancyType,
    board_type: 'bed_breakfast' as BoardType,
    quantity: 0,
    purchase_type: 'inventory' as 'inventory' | 'buy_to_order',
    cost_price: 0,
    selling_price: 0,
    commission_rate: 0.20,
    shoulder_night_margin: 0.25, // Default 25% for shoulder nights
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
  
  // Calculate rooms already allocated from this contract
  const contractRoomsAllocated = useMemo(() => {
    if (!selectedContract) return 0
    
    return listings
      .filter(l => 
        l.contract_id === selectedContract.id && 
        l.id !== editingListing?.id // Exclude current listing when editing
      )
      .reduce((sum, l) => sum + l.quantity, 0)
  }, [selectedContract, listings, editingListing])
  
  // Calculate remaining rooms available in contract
  const contractRoomsRemaining = useMemo(() => {
    if (!selectedContract) return 0
    return selectedContract.total_rooms - contractRoomsAllocated
  }, [selectedContract, contractRoomsAllocated])

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

  // Get available rates for selected room group and contract
  const availableRates = useMemo(() => {
    if (!formData.contract_id || !formData.room_group_id) return []
    return rates.filter(r => 
      r.contract_id === formData.contract_id && 
      r.room_group_id === formData.room_group_id
    )
  }, [formData.contract_id, formData.room_group_id, rates])

  // Auto-populate cost price from rate when occupancy and board type selected
  useEffect(() => {
    if (formData.occupancy_type && formData.board_type && availableRates.length > 0 && selectedContract) {
      const matchingRate = availableRates.find(r => 
        r.occupancy_type === formData.occupancy_type &&
        r.board_type === formData.board_type
      )
      if (matchingRate && formData.cost_price === 0) {
        // Calculate full cost including taxes, fees, and commissions
        const breakdown = calculatePriceBreakdown(
          matchingRate.rate,
          selectedContract,
          formData.occupancy_type,
          1 // per night
        )
        const costPrice = breakdown.totalCost
        const sellingPrice = calculateSellingPrice(costPrice, formData.commission_rate)
        setFormData(prev => ({ 
          ...prev, 
          cost_price: costPrice,
          selling_price: sellingPrice
        }))
      }
    }
  }, [formData.occupancy_type, formData.board_type, availableRates, formData.cost_price, formData.commission_rate, selectedContract])

  // Auto-update selling price when cost or commission changes
  useEffect(() => {
    if (formData.cost_price > 0 && formData.commission_rate >= 0) {
      const newSellingPrice = calculateSellingPrice(formData.cost_price, formData.commission_rate)
      if (Math.abs(newSellingPrice - formData.selling_price) > 0.01) {
        setFormData(prev => ({ ...prev, selling_price: newSellingPrice }))
      }
    }
  }, [formData.cost_price, formData.commission_rate, formData.selling_price])

  const columns = [
    { header: 'ID', accessor: 'id', width: 60 },
    { header: 'Tour', accessor: 'tourName' },
    { header: 'Source', accessor: 'sourceDisplay' }, // Contract or Hotel
    { header: 'Room', accessor: 'roomName' },
    { header: 'Occ', accessor: 'occupancy_type', format: 'badge' as const },
    { header: 'Board', accessor: 'board_type', format: 'badge' as const },
    { header: 'Target', accessor: 'quantity' },
    { header: 'Type', accessor: 'purchase_type', format: 'badge' as const },
    { header: 'Cost', accessor: 'cost_price', format: 'currency' as const },
    { header: 'Sell', accessor: 'selling_price', format: 'currency' as const },
    { header: 'Margin', accessor: 'profit' },
    { header: 'Sold', accessor: 'sold' },
    { header: 'Avail', accessor: 'availableDisplay' },
    { header: 'Actions', accessor: 'actions', type: 'actions' as const, actions: ['view', 'edit', 'delete'] },
  ]

  // Add calculated fields to listings
  const listingsWithCalculations = useMemo(() => 
    listings.map(listing => {
      const available = listing.quantity - listing.sold
      const profit = listing.selling_price - listing.cost_price
      const profitDisplay = `${profit.toFixed(2)} (${((profit / listing.selling_price) * 100).toFixed(0)}%)`
      const sourceDisplay = listing.purchase_type === 'inventory' 
        ? (listing.contractName || 'Contract')
        : (listing.hotelName || 'Hotel')
      
      return {
        ...listing,
        available: available,
        availableDisplay: listing.purchase_type === 'buy_to_order' 
          ? `${available} (flex)` 
          : available.toString(),
        profit: profitDisplay,
        sourceDisplay: sourceDisplay
      }
    }),
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
    if (formData.quantity <= 0) {
      toast.error('Please enter a quantity')
      return
    }
    
    // Check if quantity exceeds contract remaining rooms for inventory
    if (formData.purchase_type === 'inventory' && selectedContract) {
      if (formData.quantity > contractRoomsRemaining) {
        toast.error(`Only ${contractRoomsRemaining} rooms remaining in this contract (${contractRoomsAllocated} already allocated of ${selectedContract.total_rooms} total)`)
        return
      }
    }
    
    if (formData.selling_price <= 0) {
      toast.error('Please enter a selling price')
      return
    }
    
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
      occupancy_type: 'double',
      board_type: 'bed_breakfast',
      quantity: 0,
      purchase_type: 'inventory',
      cost_price: 0,
      selling_price: 0,
      commission_rate: 0.20,
      shoulder_night_margin: 0.25,
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
      occupancy_type: listing.occupancy_type,
      board_type: listing.board_type,
      quantity: listing.quantity,
      purchase_type: listing.purchase_type,
      cost_price: listing.cost_price,
      selling_price: listing.selling_price,
      commission_rate: listing.commission_rate || 0.20,
      shoulder_night_margin: listing.shoulder_night_margin || 0.25,
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
    if (formData.quantity <= 0) {
      toast.error('Please enter a quantity')
      return
    }
    
    // Check if quantity exceeds contract remaining rooms for inventory
    if (formData.purchase_type === 'inventory' && selectedContract) {
      if (formData.quantity > contractRoomsRemaining) {
        toast.error(`Only ${contractRoomsRemaining} rooms remaining in this contract (${contractRoomsAllocated} already allocated of ${selectedContract.total_rooms} total)`)
        return
      }
    }
    
    if (formData.selling_price <= 0) {
      toast.error('Please enter a selling price')
      return
    }
    
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
              <Accordion type="multiple" defaultValue={["tour-source", "room-details", "pricing", "inventory"]} className="w-full">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="occupancy_type">Occupancy *</Label>
                  <Select
                    value={formData.occupancy_type}
                    onValueChange={(value: OccupancyType) => setFormData({ ...formData, occupancy_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                      <SelectItem value="triple">Triple</SelectItem>
                      <SelectItem value="quad">Quad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="board_type">Board/Meals *</Label>
                  <Select
                    value={formData.board_type}
                    onValueChange={(value: BoardType) => setFormData({ ...formData, board_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="room_only">Room Only</SelectItem>
                      <SelectItem value="bed_breakfast">B&B</SelectItem>
                      <SelectItem value="half_board">Half Board</SelectItem>
                      <SelectItem value="full_board">Full Board</SelectItem>
                      <SelectItem value="all_inclusive">All-Inclusive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {availableRates.length > 0 
                          ? 'Pricing will auto-populate from matching rate'
                          : 'Create rates for this room and contract first'}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Inventory Settings Section */}
                <AccordionItem value="inventory">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Inventory Settings
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="grid gap-2">
                        <Label htmlFor="quantity">
                          {formData.purchase_type === 'inventory' ? 'Quantity *' : 'Target Quantity *'}
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                          max={formData.purchase_type === 'inventory' && selectedContract ? contractRoomsRemaining : undefined}
                        />
                        {formData.purchase_type === 'inventory' && selectedContract && (
                          <div className="space-y-1">
                            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              Contract: {selectedContract.total_rooms} total | {contractRoomsAllocated} allocated | {contractRoomsRemaining} remaining
                            </p>
                            {contractRoomsRemaining === 0 && (
                              <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                No rooms remaining in this contract
                              </p>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formData.purchase_type === 'inventory' 
                            ? 'Exact number of pre-purchased rooms (hard limit)'
                            : 'Target allocation - can sell more as buy-to-order is flexible'}
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="purchase_type">Purchase Type *</Label>
                        <Select
                          value={formData.purchase_type}
                          onValueChange={(value: 'inventory' | 'buy_to_order') => setFormData({ ...formData, purchase_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inventory">
                              <div>
                                <p className="font-medium">Inventory</p>
                                <p className="text-xs text-muted-foreground">Pre-purchased - exact quantity limit</p>
                              </div>
                            </SelectItem>
                            <SelectItem value="buy_to_order">
                              <div>
                                <p className="font-medium">Buy to Order</p>
                                <p className="text-xs text-muted-foreground">Purchase when sold - flexible capacity</p>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {formData.purchase_type === 'inventory' 
                            ? (
                              <>
                                <AlertCircle className="h-3 w-3 text-orange-500" />
                                Inventory has strict quantity limits
                              </>
                            )
                            : (
                              <>
                                <Info className="h-3 w-3 text-blue-500" />
                                Buy-to-order allows selling beyond target quantity
                              </>
                            )}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Pricing & Commission Section */}
                <AccordionItem value="pricing">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pricing & Commission
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="commission_rate">Base Nights Markup (%)</Label>
                          <Input
                            id="commission_rate"
                            type="number"
                            step="0.01"
                            value={formData.commission_rate * 100}
                            onChange={(e) => setFormData({ ...formData, commission_rate: (parseFloat(e.target.value) || 0) / 100 })}
                            placeholder="e.g., 20 for 20%"
                          />
                          <p className="text-xs text-muted-foreground">
                            Markup on contract period nights
                          </p>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="shoulder_margin">Shoulder Nights Markup (%)</Label>
                          <Input
                            id="shoulder_margin"
                            type="number"
                            step="0.01"
                            value={formData.shoulder_night_margin * 100}
                            onChange={(e) => setFormData({ ...formData, shoulder_night_margin: (parseFloat(e.target.value) || 0) / 100 })}
                            placeholder="e.g., 25 for 25%"
                          />
                          <p className="text-xs text-muted-foreground">
                            Markup on pre/post shoulder nights
                          </p>
                        </div>
                      </div>
                      
                      {/* Shoulder Night Pricing Info */}
                      {selectedContract && (selectedContract.pre_shoulder_rates?.length || 0) + (selectedContract.post_shoulder_rates?.length || 0) > 0 && (
                        <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                          <CardContent className="pt-3 pb-3">
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-purple-600 mt-0.5" />
                              <div className="text-xs space-y-1">
                                <p className="font-medium text-purple-900 dark:text-purple-100">
                                  Shoulder Night Pricing Available
                                </p>
                                <div className="text-purple-700 dark:text-purple-200">
                                  {selectedContract.pre_shoulder_rates && selectedContract.pre_shoulder_rates.length > 0 && (
                                    <p>• Pre-shoulder: {selectedContract.pre_shoulder_rates.length} nights before contract</p>
                                  )}
                                  {selectedContract.post_shoulder_rates && selectedContract.post_shoulder_rates.length > 0 && (
                                    <p>• Post-shoulder: {selectedContract.post_shoulder_rates.length} nights after contract</p>
                                  )}
                                  <p className="mt-1">
                                    Base nights: {(formData.commission_rate * 100).toFixed(0)}% markup | 
                                    Shoulder nights: {(formData.shoulder_night_margin * 100).toFixed(0)}% markup
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="cost_price">
                            {formData.purchase_type === 'inventory' ? 'Cost Price' : 'Estimated Cost'} (EUR)
                          </Label>
                          <Input
                            id="cost_price"
                            type="number"
                            step="0.01"
                            value={formData.cost_price}
                            onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                            placeholder={formData.purchase_type === 'inventory' ? "Auto-fills from rate" : "Enter estimated cost"}
                          />
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {formData.purchase_type === 'inventory' 
                              ? 'Actual cost from contract rate'
                              : (
                                <>
                                  <AlertCircle className="h-3 w-3 text-orange-500" />
                                  Estimated - actual cost entered when purchased
                                </>
                              )}
                          </p>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="selling_price">Selling Price (EUR) *</Label>
                          <Input
                            id="selling_price"
                            type="number"
                            step="0.01"
                            value={formData.selling_price}
                            onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                            placeholder="Auto-calculated"
                          />
                          <p className="text-xs text-muted-foreground">
                            What customer pays
                          </p>
                        </div>
                      </div>

                      {formData.cost_price > 0 && formData.selling_price > 0 && (
                        <Card className="bg-muted/50">
                          <CardContent className="pt-4">
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>{formData.purchase_type === 'inventory' ? 'Cost Price:' : 'Estimated Cost:'}  </span>
                                <span className="font-medium">{formData.cost_price.toFixed(2)} EUR</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Selling Price:</span>
                                <span className="font-medium">{formData.selling_price.toFixed(2)} EUR</span>
                              </div>
                              <div className="border-t pt-1 flex justify-between">
                                <span className="font-medium">{formData.purchase_type === 'inventory' ? 'Profit:' : 'Expected Profit:'}  </span>
                                <span className={`font-bold ${formData.selling_price > formData.cost_price ? 'text-green-600' : 'text-red-600'}`}>
                                  {(formData.selling_price - formData.cost_price).toFixed(2)} EUR
                                </span>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Profit Margin:</span>
                                <span>{(((formData.selling_price - formData.cost_price) / formData.selling_price) * 100).toFixed(1)}%</span>
                              </div>
                              {formData.purchase_type === 'buy_to_order' && (
                                <p className="text-xs text-orange-600 dark:text-orange-400 pt-1 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Estimated - actual profit calculated when purchased
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="grid gap-2 mt-4">
                <Label htmlFor="sold">Already Sold</Label>
                <Input
                  id="sold"
                  type="number"
                  value={formData.sold}
                  onChange={(e) => setFormData({ ...formData, sold: parseInt(e.target.value) || 0 })}
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
                  !formData.room_group_id || 
                  formData.quantity === 0 ||
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

            <div className="grid gap-2">
              <Label htmlFor="edit-occupancy_type">Occupancy Type *</Label>
              <Select
                value={formData.occupancy_type}
                onValueChange={(value: OccupancyType) => setFormData({ ...formData, occupancy_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                  <SelectItem value="triple">Triple</SelectItem>
                  <SelectItem value="quad">Quad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-quantity">Quantity *</Label>
              <Input
                id="edit-quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              />
            </div>

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

            <div className="grid gap-2">
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-sold">Sold</Label>
              <Input
                id="edit-sold"
                type="number"
                value={formData.sold}
                onChange={(e) => setFormData({ ...formData, sold: parseInt(e.target.value) || 0 })}
              />
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
