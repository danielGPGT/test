import { useState, useMemo } from 'react'
import { useData } from '@/contexts/data-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Building2, 
  DollarSign, 
  Printer,
  FileText,
  BedDouble,
  UtensilsCrossed,
  Download
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { BOARD_TYPE_LABELS } from '@/lib/pricing'

interface RoomingListEntry {
  bookingId: number
  bookingRef: string
  bookingStatus: 'confirmed' | 'pending' | 'cancelled'
  guestName: string
  guestEmail: string
  guestPhone: string
  hotelName: string
  hotelId: number
  supplierName?: string
  contractName?: string
  roomType: string
  occupancyType: string
  boardType: string
  checkInDate: string
  checkOutDate: string
  nights: number
  quantity: number
  guestsCount?: number
  costPerRoom: number
  totalCost: number
  purchaseType: 'inventory' | 'buy_to_order'
  purchaseStatus?: string
  paymentStatus?: string
  tourName: string
  hotelConfirmation?: string
}

export function RoomingList() {
  const { bookings, hotels, tours, rates, contracts } = useData()
  
  // Filters
  const [filterHotel, setFilterHotel] = useState<string>('all')
  const [filterTour, setFilterTour] = useState<string>('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [searchGuest, setSearchGuest] = useState('')
  const [showPending, setShowPending] = useState(true)
  const [showCancelled, setShowCancelled] = useState(false)

  // Generate rooming list entries
  const roomingEntries = useMemo(() => {
    const entries: RoomingListEntry[] = []
    
    bookings.forEach(booking => {
      // Filter by booking status
      if (booking.status === 'cancelled' && !showCancelled) {
        return
      }
      if (booking.status === 'pending' && !showPending) {
        return
      }
      
      const tour = tours.find(t => t.id === booking.tour_id)
      
      // Safety check: ensure rooms array exists
      if (!booking.rooms || !Array.isArray(booking.rooms)) {
        return
      }
      
      booking.rooms.forEach(room => {
        // For buy-to-order, use actual cost if purchased, otherwise estimated cost
        let costPerRoom = 0
        if (room.purchase_type === 'buy_to_order') {
          if (room.purchase_order?.cost_per_room) {
            costPerRoom = room.purchase_order.cost_per_room
          } else if (room.estimated_cost_per_room) {
            costPerRoom = room.estimated_cost_per_room
          }
        } else {
          // For inventory, use estimated cost (what we owe the supplier)
          costPerRoom = room.estimated_cost_per_room || 0
        }
        
        const hotel = hotels.find(h => h.name === room.hotelName)
        
        // Get supplier and contract info
        const rate = rates.find(r => r.id === room.rate_id)
        const contract = rate ? contracts.find(c => c.id === rate.contract_id) : null
        
        entries.push({
          bookingId: booking.id,
          bookingRef: `BK${booking.id.toString().padStart(4, '0')}`,
          bookingStatus: booking.status,
          guestName: booking.customer_name,
          guestEmail: booking.customer_email,
          guestPhone: booking.customer_phone,
          hotelName: room.hotelName,
          hotelId: hotel?.id || 0,
          supplierName: contract?.supplierName,
          contractName: room.contractName || contract?.contract_name,
          roomType: room.roomName,
          occupancyType: room.occupancy_type,
          boardType: room.board_type,
          checkInDate: booking.check_in_date,
          checkOutDate: booking.check_out_date,
          nights: booking.nights,
          quantity: room.quantity,
          guestsCount: room.guests_count,
          costPerRoom,
          totalCost: costPerRoom * room.quantity,
          purchaseType: room.purchase_type,
          purchaseStatus: room.purchase_status,
          paymentStatus: room.payment_status,
          tourName: tour?.name || 'Unknown Tour',
          hotelConfirmation: room.purchase_order?.hotel_confirmation
        })
      })
    })
    
    return entries
  }, [bookings, tours, hotels, rates, contracts, showPending, showCancelled])

  // Apply filters
  const filteredEntries = useMemo(() => {
    return roomingEntries.filter(entry => {
      // Hotel filter
      if (filterHotel !== 'all' && entry.hotelId.toString() !== filterHotel) {
        return false
      }
      
      // Tour filter
      if (filterTour !== 'all' && entry.tourName !== filterTour) {
        return false
      }
      
      // Date from filter
      if (filterDateFrom && entry.checkInDate < filterDateFrom) {
        return false
      }
      
      // Date to filter
      if (filterDateTo && entry.checkInDate > filterDateTo) {
        return false
      }
      
      // Guest search
      if (searchGuest && !entry.guestName.toLowerCase().includes(searchGuest.toLowerCase())) {
        return false
      }
      
      return true
    })
  }, [roomingEntries, filterHotel, filterTour, filterDateFrom, filterDateTo, searchGuest])

  // Group by hotel
  const entriesByHotel = useMemo(() => {
    const grouped = new Map<string, RoomingListEntry[]>()
    
    filteredEntries.forEach(entry => {
      const existing = grouped.get(entry.hotelName) || []
      grouped.set(entry.hotelName, [...existing, entry])
    })
    
    // Sort entries within each hotel by check-in date
    grouped.forEach((entries) => {
      entries.sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))
    })
    
    return grouped
  }, [filteredEntries])

  // Calculate totals
  const totals = useMemo(() => {
    const totalRooms = filteredEntries.reduce((sum, e) => sum + e.quantity, 0)
    const totalCost = filteredEntries.reduce((sum, e) => sum + e.totalCost, 0)
    
    return { totalRooms, totalCost }
  }, [filteredEntries])

  // Get unique values for filters
  const uniqueHotels = useMemo(() => {
    const hotelMap = new Map<number, string>()
    roomingEntries.forEach(e => {
      if (!hotelMap.has(e.hotelId)) {
        hotelMap.set(e.hotelId, e.hotelName)
      }
    })
    return Array.from(hotelMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [roomingEntries])

  const uniqueTours = useMemo(() => {
    return Array.from(new Set(roomingEntries.map(e => e.tourName)))
      .sort()
  }, [roomingEntries])

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    // Create CSV content
    const headers = [
      'Booking Ref',
      'Booking Status',
      'Guest Name',
      'Guest Email',
      'Guest Phone',
      'Hotel',
      'Room Type',
      'Occupancy',
      'Guests Count',
      'Board',
      'Check-In',
      'Check-Out',
      'Nights',
      'Rooms',
      'Cost/Room',
      'Total Cost',
      'Purchase Type',
      'Purchase Status',
      'Hotel Confirmation'
    ]
    
    const rows = filteredEntries.map(e => [
      e.bookingRef,
      e.bookingStatus,
      e.guestName,
      e.guestEmail,
      e.guestPhone,
      e.hotelName,
      e.roomType,
      e.occupancyType,
      e.guestsCount || '',
      BOARD_TYPE_LABELS[e.boardType] || e.boardType,
      e.checkInDate,
      e.checkOutDate,
      e.nights,
      e.quantity,
      e.costPerRoom.toFixed(2),
      e.totalCost.toFixed(2),
      e.purchaseType,
      e.purchaseStatus || 'N/A',
      e.hotelConfirmation || ''
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rooming-list-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Rooming List</h1>
          <p className="text-muted-foreground mt-1">
            Guest assignments and supplier costs by hotel
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label>Hotel</Label>
              <Select value={filterHotel} onValueChange={setFilterHotel}>
                <SelectTrigger>
                  <SelectValue placeholder="All Hotels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hotels</SelectItem>
                  {uniqueHotels.map(hotel => (
                    <SelectItem key={hotel.id} value={hotel.id.toString()}>
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tour</Label>
              <Select value={filterTour} onValueChange={setFilterTour}>
                <SelectTrigger>
                  <SelectValue placeholder="All Tours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tours</SelectItem>
                  {uniqueTours.map(tour => (
                    <SelectItem key={tour} value={tour}>
                      {tour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Check-in From</Label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label>Check-in To</Label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>

            <div>
              <Label>Search Guest</Label>
              <Input
                type="text"
                placeholder="Guest name..."
                value={searchGuest}
                onChange={(e) => setSearchGuest(e.target.value)}
              />
            </div>
          </div>

          {/* Booking Status Filters */}
          <div className="mt-4 pt-4 border-t">
            <Label className="text-sm font-medium mb-3 block">Booking Status</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-pending"
                  checked={showPending}
                  onCheckedChange={(checked) => setShowPending(checked as boolean)}
                />
                <label
                  htmlFor="show-pending"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Show Pending Bookings
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-cancelled"
                  checked={showCancelled}
                  onCheckedChange={(checked) => setShowCancelled(checked as boolean)}
                />
                <label
                  htmlFor="show-cancelled"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Show Cancelled Bookings
                </label>
              </div>
            </div>
          </div>

          {(filterHotel !== 'all' || filterTour !== 'all' || filterDateFrom || filterDateTo || searchGuest || !showPending || showCancelled) && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterHotel('all')
                  setFilterTour('all')
                  setFilterDateFrom('')
                  setFilterDateTo('')
                  setSearchGuest('')
                  setShowPending(true)
                  setShowCancelled(false)
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hotels</p>
                <p className="text-2xl font-bold">{entriesByHotel.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <BedDouble className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Rooms</p>
                <p className="text-2xl font-bold">{totals.totalRooms}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Supplier Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.totalCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rooming List by Hotel */}
      {entriesByHotel.size === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No rooming list entries found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredEntries.length === 0 && bookings.length > 0
                ? 'Try adjusting your filters'
                : 'Create some bookings to see them here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(entriesByHotel.entries()).map(([hotelName, entries]) => {
            const hotelTotal = entries.reduce((sum, e) => sum + e.totalCost, 0)
            const hotelRooms = entries.reduce((sum, e) => sum + e.quantity, 0)
            
            return (
              <Card key={hotelName} className="print:break-inside-avoid">
                <CardHeader className="bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-primary" />
                      <CardTitle>{hotelName}</CardTitle>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="secondary">
                        {hotelRooms} {hotelRooms === 1 ? 'Room' : 'Rooms'}
                      </Badge>
                      <Badge variant="default">
                        Total: {formatCurrency(hotelTotal)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr className="text-xs">
                          <th className="text-left p-3 font-medium">Booking</th>
                          <th className="text-left p-3 font-medium">Guest</th>
                          <th className="text-left p-3 font-medium">Room Type</th>
                          <th className="text-left p-3 font-medium">Occ.</th>
                          <th className="text-center p-3 font-medium">Guests</th>
                          <th className="text-left p-3 font-medium">Board</th>
                          <th className="text-left p-3 font-medium">Check-In</th>
                          <th className="text-left p-3 font-medium">Check-Out</th>
                          <th className="text-center p-3 font-medium">Nights</th>
                          <th className="text-center p-3 font-medium">Rooms</th>
                          <th className="text-right p-3 font-medium">Cost/Room</th>
                          <th className="text-right p-3 font-medium">Total Cost</th>
                          <th className="text-left p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {entries.map((entry, idx) => (
                          <tr key={idx} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <div>
                                <div className="font-medium text-sm">{entry.bookingRef}</div>
                                <div className="text-xs text-muted-foreground">{entry.tourName}</div>
                                {entry.supplierName && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    via {entry.supplierName}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div>
                                <div className="font-medium text-sm">{entry.guestName}</div>
                                <div className="text-xs text-muted-foreground">{entry.guestEmail}</div>
                                <div className="text-xs text-muted-foreground">{entry.guestPhone}</div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="text-sm">{entry.roomType}</span>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-xs">
                                {entry.occupancyType}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-sm font-medium">{entry.guestsCount || '-'}</span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1 text-sm">
                                <UtensilsCrossed className="w-3 h-3" />
                                {BOARD_TYPE_LABELS[entry.boardType] || entry.boardType}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">{new Date(entry.checkInDate).toLocaleDateString()}</div>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">{new Date(entry.checkOutDate).toLocaleDateString()}</div>
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-sm">{entry.nights}</span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-medium text-sm">{entry.quantity}</span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="font-medium text-sm">{formatCurrency(entry.costPerRoom)}</span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="font-semibold text-sm">{formatCurrency(entry.totalCost)}</span>
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                {/* Booking Status */}
                                <Badge 
                                  variant={
                                    entry.bookingStatus === 'confirmed' ? 'default' : 
                                    entry.bookingStatus === 'pending' ? 'secondary' : 
                                    'destructive'
                                  }
                                  className="text-xs block w-fit"
                                >
                                  {entry.bookingStatus === 'confirmed' && '✓ Confirmed'}
                                  {entry.bookingStatus === 'pending' && '⏳ Pending'}
                                  {entry.bookingStatus === 'cancelled' && '✕ Cancelled'}
                                </Badge>
                                
                                {/* Payment Status */}
                                {entry.paymentStatus && (
                                  <Badge 
                                    variant={
                                      entry.paymentStatus === 'paid' ? 'default' : 
                                      entry.paymentStatus === 'overdue' ? 'destructive' : 
                                      'secondary'
                                    }
                                    className="text-xs block w-fit"
                                  >
                                    {entry.paymentStatus === 'paid' && '💰 Paid'}
                                    {entry.paymentStatus === 'pending' && '⏳ Payment Due'}
                                    {entry.paymentStatus === 'overdue' && '⚠️ Overdue'}
                                    {entry.paymentStatus === 'partial' && '½ Partial'}
                                  </Badge>
                                )}
                                
                                {/* Purchase Type/Status */}
                                {entry.purchaseType === 'buy_to_order' && (
                                  <>
                                    <Badge 
                                      variant={entry.purchaseStatus === 'purchased' ? 'outline' : 'secondary'}
                                      className="text-xs block w-fit"
                                    >
                                      {entry.purchaseStatus === 'purchased' ? 'Purchased' : 'Buy-to-Order'}
                                    </Badge>
                                    {entry.hotelConfirmation && (
                                      <div className="text-xs text-muted-foreground">
                                        Conf: {entry.hotelConfirmation}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/50 border-t-2">
                        <tr className="font-semibold">
                          <td colSpan={8} className="p-3 text-right">Hotel Subtotal:</td>
                          <td className="p-3 text-center">{hotelRooms}</td>
                          <td className="p-3"></td>
                          <td className="p-3 text-right">{formatCurrency(hotelTotal)}</td>
                          <td className="p-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Grand Total */}
          {entriesByHotel.size > 1 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Grand Total (All Hotels)</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {entriesByHotel.size} hotels • {totals.totalRooms} rooms
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{formatCurrency(totals.totalCost)}</p>
                    <p className="text-sm text-muted-foreground">Total Supplier Cost</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Print-only header */}
      <div className="hidden print:block fixed top-0 left-0 right-0 bg-white p-4 border-b">
        <h1 className="text-2xl font-bold">Rooming List</h1>
        <p className="text-sm text-muted-foreground">
          Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}

