/**
 * POOL BOOKING MANAGER
 * Manage bookings for a specific allocation pool
 */

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import { useData } from '@/contexts/data-context'
import type { PoolBooking, AllocationPoolCapacity } from '@/types/unified-inventory'
import { formatCurrency } from '@/lib/utils'
import { calculateNights } from '@/types/unified-inventory'

interface PoolBookingManagerProps {
  pool: AllocationPoolCapacity
  onClose?: () => void
}

export function PoolBookingManager({ pool, onClose }: PoolBookingManagerProps) {
  const { poolBookings: allPoolBookings, addPoolBooking, updatePoolBooking, deletePoolBooking } = useData()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<PoolBooking | null>(null)

  // Get bookings for this pool
  const poolBookings = useMemo(() => {
    return allPoolBookings.filter(booking => booking.pool_id === pool.pool_id)
  }, [allPoolBookings, pool.pool_id])

  // Group bookings by status
  const bookingsByStatus = useMemo(() => {
    const grouped = {
      confirmed: [] as PoolBooking[],
      pending: [] as PoolBooking[],
      cancelled: [] as PoolBooking[]
    }
    
    poolBookings.forEach(booking => {
      grouped[booking.status].push(booking)
    })
    
    return grouped
  }, [poolBookings])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="w-4 h-4" />
      case 'pending': return <AlertTriangle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleCreateBooking = (bookingData: Omit<PoolBooking, 'id' | 'pool_id' | 'created_at' | 'updated_at'>) => {
    addPoolBooking({
      ...bookingData,
      pool_id: pool.pool_id
    })
    setIsCreateDialogOpen(false)
  }

  const handleUpdateBooking = (bookingId: string, updates: Partial<PoolBooking>) => {
    updatePoolBooking(bookingId, updates)
    setEditingBooking(null)
  }

  const handleDeleteBooking = (bookingId: string) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      deletePoolBooking(bookingId)
    }
  }

  const BookingCard = ({ booking }: { booking: PoolBooking }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className={getStatusColor(booking.status)}>
                {getStatusIcon(booking.status)}
                <span className="ml-1 capitalize">{booking.status}</span>
              </Badge>
              <h4 className="font-semibold">{booking.booking_reference}</h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span>{formatDate(booking.check_in)} - {formatDate(booking.check_out)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{booking.nights} nights</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{booking.guests} guests</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatCurrency(booking.total_amount, 'EUR')}</span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Created: {formatDate(booking.created_at)}
              {booking.updated_at !== booking.created_at && (
                <span className="ml-2">• Updated: {formatDate(booking.updated_at)}</span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingBooking(booking)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteBooking(booking.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Pool Bookings: {pool.pool_id}</h2>
          <p className="text-muted-foreground">{pool.item_name}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Booking</DialogTitle>
              </DialogHeader>
              <BookingForm
                pool={pool}
                onSubmit={handleCreateBooking}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Pool Info */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Capacity:</span>
              <span className="ml-1 font-medium">{pool.total_capacity}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Current Bookings:</span>
              <span className="ml-1 font-medium">{pool.current_bookings}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Available:</span>
              <span className="ml-1 font-medium">{pool.available_spots}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline" className={`ml-1 ${getStatusColor(pool.status)}`}>
                {getStatusIcon(pool.status)}
                <span className="ml-1 capitalize">{pool.status}</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings by Status */}
      <div className="space-y-6">
        {Object.entries(bookingsByStatus).map(([status, bookings]) => (
          <div key={status}>
            <h3 className="text-lg font-semibold mb-3 capitalize flex items-center gap-2">
              {getStatusIcon(status)}
              {status} Bookings ({bookings.length})
            </h3>
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No {status} bookings</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Booking Dialog */}
      {editingBooking && (
        <Dialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Booking: {editingBooking.booking_reference}</DialogTitle>
            </DialogHeader>
            <BookingForm
              pool={pool}
              booking={editingBooking}
              onSubmit={(updates) => handleUpdateBooking(editingBooking.id, updates)}
              onCancel={() => setEditingBooking(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Booking Form Component
interface BookingFormProps {
  pool: AllocationPoolCapacity
  booking?: PoolBooking
  onSubmit: (data: any) => void
  onCancel: () => void
}

function BookingForm({ booking, onSubmit, onCancel }: BookingFormProps) {
  const [formData, setFormData] = useState({
    check_in: booking?.check_in || '',
    check_out: booking?.check_out || '',
    guests: booking?.guests || 1,
    rate_ids: booking?.rate_ids || [],
    total_amount: booking?.total_amount || 0,
    status: booking?.status || 'confirmed' as const
  })

  const nights = formData.check_in && formData.check_out 
    ? calculateNights(formData.check_in, formData.check_out)
    : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      nights
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="check_in">Check In</Label>
          <Input
            id="check_in"
            type="date"
            value={formData.check_in}
            onChange={(e) => setFormData(prev => ({ ...prev, check_in: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="check_out">Check Out</Label>
          <Input
            id="check_out"
            type="date"
            value={formData.check_out}
            onChange={(e) => setFormData(prev => ({ ...prev, check_out: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="guests">Guests</Label>
          <Input
            id="guests"
            type="number"
            min="1"
            value={formData.guests}
            onChange={(e) => setFormData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="nights">Nights</Label>
          <Input
            id="nights"
            type="number"
            value={nights}
            disabled
            className="bg-muted"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="total_amount">Total Amount</Label>
          <Input
            id="total_amount"
            type="number"
            step="0.01"
            value={formData.total_amount}
            onChange={(e) => setFormData(prev => ({ ...prev, total_amount: parseFloat(e.target.value) }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {booking ? 'Update Booking' : 'Create Booking'}
        </Button>
      </div>
    </form>
  )
}
