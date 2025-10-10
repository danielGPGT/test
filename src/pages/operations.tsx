import { useState, useMemo } from 'react'
import { useData } from '@/contexts/data-context'
import { Button } from '@/components/ui/button'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { 
  Package, 
  Car, 
  Ticket, 
  PartyPopper, 
  UtensilsCrossed,
  Calendar,
  User,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

const SERVICE_TYPE_ICONS: Record<string, any> = {
  transfer: Car,
  ticket: Ticket,
  activity: PartyPopper,
  meal: UtensilsCrossed,
  other: Package
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  transfer: 'Transfer',
  ticket: 'Ticket / Event',
  activity: 'Activity / Tour',
  meal: 'Meal',
  other: 'Other Service'
}

export function Operations() {
  const { 
    serviceRequests, 
    updateServiceRequest, 
    bookings, 
    tours,
    suppliers 
  } = useData()

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [detailsForm, setDetailsForm] = useState({
    details: {
      from: '',
      to: '',
      date: '',
      time: '',
      flight_number: '',
      venue: '',
      event_date: '',
      event_time: '',
      ticket_type: '',
      quantity: 0,
      special_requirements: ''
    },
    supplier_id: 0,
    confirmation_number: '',
    actual_cost: 0,
    notes: ''
  })

  // Filter service requests
  const filteredRequests = useMemo(() => {
    return serviceRequests.filter(req => {
      const matchesStatus = filterStatus === 'all' || req.status === filterStatus
      const matchesType = filterType === 'all' || req.service_type === filterType
      const booking = bookings.find(b => b.id === req.booking_id)
      const tour = tours.find(t => t.id === booking?.tour_id)
      const matchesSearch = searchTerm === '' || 
        req.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking?.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour?.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesStatus && matchesType && matchesSearch
    })
  }, [serviceRequests, filterStatus, filterType, searchTerm, bookings, tours])

  // Stats
  const stats = useMemo(() => {
    return {
      total: serviceRequests.length,
      pending: serviceRequests.filter(r => r.status === 'pending_details' || r.status === 'pending_booking').length,
      confirmed: serviceRequests.filter(r => r.status === 'confirmed').length,
      completed: serviceRequests.filter(r => r.status === 'completed').length,
    }
  }, [serviceRequests])

  const handleOpenDetails = (request: any) => {
    setSelectedRequest(request)
    setDetailsForm({
      details: request.details || {
        from: '',
        to: '',
        date: '',
        time: '',
        flight_number: '',
        venue: '',
        event_date: '',
        event_time: '',
        ticket_type: '',
        quantity: 0,
        special_requirements: ''
      },
      supplier_id: request.supplier_id || 0,
      confirmation_number: request.confirmation_number || '',
      actual_cost: request.actual_cost || request.estimated_cost || 0,
      notes: request.notes || ''
    })
    setIsDetailsOpen(true)
  }

  const handleSaveDetails = () => {
    if (!selectedRequest) return

    updateServiceRequest(selectedRequest.id, {
      details: detailsForm.details,
      supplier_id: detailsForm.supplier_id || undefined,
      confirmation_number: detailsForm.confirmation_number,
      actual_cost: detailsForm.actual_cost,
      notes: detailsForm.notes,
      status: detailsForm.confirmation_number ? 'confirmed' : selectedRequest.status
    })

    toast.success('Service request updated')
    setIsDetailsOpen(false)
  }

  const handleMarkComplete = (request: any) => {
    updateServiceRequest(request.id, { status: 'completed' })
    toast.success('Service marked as completed')
  }

  // Prepare table data
  const tableData = filteredRequests.map(request => {
    const booking = bookings.find(b => b.id === request.booking_id)
    const tour = tours.find(t => t.id === booking?.tour_id)
    const supplier = suppliers.find(s => s.id === request.supplier_id)
    
    const costVariance = request.actual_cost && request.estimated_cost 
      ? request.actual_cost - request.estimated_cost 
      : 0
    
    // Get service date from details
    const serviceDate = request.details?.date || request.details?.event_date || '-'

    return {
      ...request,
      tourName: tour?.name || 'Unknown Tour',
      customerName: booking?.customer_name || 'Unknown',
      supplierName: supplier?.name || 'Not assigned',
      serviceDate: serviceDate,
      serviceTypeLabel: SERVICE_TYPE_LABELS[request.service_type] || request.service_type,
      statusLabel: request.status.replace('_', ' '),
      costInfo: request.actual_cost 
        ? `${formatCurrency(request.actual_cost)} ${costVariance !== 0 ? `(${costVariance > 0 ? '+' : ''}${formatCurrency(costVariance)})` : ''}` 
        : formatCurrency(request.estimated_cost || 0),
      varianceColor: costVariance < 0 ? 'text-green-600' : costVariance > 0 ? 'text-red-600' : 'text-gray-600'
    }
  })

  const columns = [
    { header: 'Type', accessor: 'serviceTypeLabel', format: 'badge' as const },
    { header: 'Service', accessor: 'service_name' },
    { header: 'Tour', accessor: 'tourName' },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Date', accessor: 'serviceDate', format: 'date' as const },
    { header: 'Supplier', accessor: 'supplierName' },
    { header: 'Cost', accessor: 'costInfo' },
    { header: 'Status', accessor: 'statusLabel', format: 'badge' as const },
    { header: 'Actions', accessor: 'actions', type: 'actions' as const, actions: ['edit'] },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operations</h1>
          <p className="text-muted-foreground mt-1">
            Manage service requests, confirmations, and supplier bookings
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_details">Pending Details</SelectItem>
                  <SelectItem value="pending_booking">Pending Booking</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Service Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="transfer">Transfers</SelectItem>
                  <SelectItem value="ticket">Tickets</SelectItem>
                  <SelectItem value="activity">Activities</SelectItem>
                  <SelectItem value="meal">Meals</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Search</Label>
              <Input
                placeholder="Search customer, tour, service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Requests Table */}
      <DataTable
        title="Service Requests"
        columns={columns}
        data={tableData}
        onEdit={(item) => handleOpenDetails(item as any)}
        searchable={false}
        pageSize={15}
      />

      {/* Service Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Request Details</DialogTitle>
            <DialogDescription>
              Manage service details, supplier booking, and confirmation
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Service Info */}
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Service</p>
                      <p className="font-medium flex items-center gap-2 mt-1">
                        {(() => {
                          const Icon = SERVICE_TYPE_ICONS[selectedRequest.service_type] || Package
                          return <Icon className="h-4 w-4" />
                        })()}
                        {selectedRequest.service_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium mt-1">
                        <Badge variant="outline">{SERVICE_TYPE_LABELS[selectedRequest.service_type]}</Badge>
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-medium flex items-center gap-2 mt-1">
                        <User className="h-4 w-4" />
                        {bookings.find(b => b.id === selectedRequest.booking_id)?.customer_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tour</p>
                      <p className="font-medium flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {tours.find(t => t.id === bookings.find(b => b.id === selectedRequest.booking_id)?.tour_id)?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Service Date</p>
                      <p className="font-medium flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4" />
                        {selectedRequest.details?.date || selectedRequest.details?.event_date || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-medium mt-1">{selectedRequest.details?.quantity || 1}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Estimated Cost</p>
                      <p className="font-medium flex items-center gap-2 mt-1">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(selectedRequest.estimated_cost || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium mt-1">
                        <Badge variant={
                          selectedRequest.status === 'completed' ? 'default' :
                          selectedRequest.status === 'confirmed' ? 'secondary' :
                          'outline'
                        }>
                          {selectedRequest.status}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Editable Details */}
              <div className="space-y-3">
                <h3 className="font-medium">Service Details</h3>
                
                {selectedRequest?.service_type === 'transfer' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>From</Label>
                      <Input
                        value={detailsForm.details.from}
                        onChange={(e) => setDetailsForm({ ...detailsForm, details: { ...detailsForm.details, from: e.target.value } })}
                        placeholder="e.g., Abu Dhabi Airport"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>To</Label>
                      <Input
                        value={detailsForm.details.to}
                        onChange={(e) => setDetailsForm({ ...detailsForm, details: { ...detailsForm.details, to: e.target.value } })}
                        placeholder="e.g., Yas Hotel"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Flight Number</Label>
                      <Input
                        value={detailsForm.details.flight_number}
                        onChange={(e) => setDetailsForm({ ...detailsForm, details: { ...detailsForm.details, flight_number: e.target.value } })}
                        placeholder="e.g., EY123"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Pickup Time</Label>
                      <Input
                        type="time"
                        value={detailsForm.details.time}
                        onChange={(e) => setDetailsForm({ ...detailsForm, details: { ...detailsForm.details, time: e.target.value } })}
                      />
                    </div>
                  </div>
                )}
                
                {(selectedRequest?.service_type === 'ticket' || selectedRequest?.service_type === 'activity') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Venue</Label>
                      <Input
                        value={detailsForm.details.venue}
                        onChange={(e) => setDetailsForm({ ...detailsForm, details: { ...detailsForm.details, venue: e.target.value } })}
                        placeholder="e.g., Yas Marina Circuit"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Event Date</Label>
                      <Input
                        type="date"
                        value={detailsForm.details.event_date}
                        onChange={(e) => setDetailsForm({ ...detailsForm, details: { ...detailsForm.details, event_date: e.target.value } })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Event Time</Label>
                      <Input
                        type="time"
                        value={detailsForm.details.event_time}
                        onChange={(e) => setDetailsForm({ ...detailsForm, details: { ...detailsForm.details, event_time: e.target.value } })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Ticket Type</Label>
                      <Input
                        value={detailsForm.details.ticket_type}
                        onChange={(e) => setDetailsForm({ ...detailsForm, details: { ...detailsForm.details, ticket_type: e.target.value } })}
                        placeholder="e.g., Grandstand"
                      />
                    </div>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label>Special Requirements</Label>
                  <Textarea
                    value={detailsForm.details.special_requirements}
                    onChange={(e) => setDetailsForm({ ...detailsForm, details: { ...detailsForm.details, special_requirements: e.target.value } })}
                    placeholder="Any special requests or requirements..."
                    rows={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Assign Supplier</Label>
                  <Select
                    value={detailsForm.supplier_id.toString()}
                    onValueChange={(value) => setDetailsForm({ ...detailsForm, supplier_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Not assigned yet</SelectItem>
                      {suppliers.filter(s => s.active).map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name} ({supplier.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Confirmation Number</Label>
                    <Input
                      value={detailsForm.confirmation_number}
                      onChange={(e) => setDetailsForm({ ...detailsForm, confirmation_number: e.target.value })}
                      placeholder="e.g., CONF-12345"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supplier's booking confirmation
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label>Actual Cost</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={detailsForm.actual_cost}
                      onChange={(e) => setDetailsForm({ ...detailsForm, actual_cost: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Final cost from supplier
                    </p>
                  </div>
                </div>

                {/* Cost Variance */}
                {detailsForm.actual_cost > 0 && selectedRequest.estimated_cost && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Cost Variance:</span>
                      <span className={
                        detailsForm.actual_cost < selectedRequest.estimated_cost 
                          ? 'text-green-600 font-medium' 
                          : detailsForm.actual_cost > selectedRequest.estimated_cost
                          ? 'text-red-600 font-medium'
                          : 'font-medium'
                      }>
                        {detailsForm.actual_cost < selectedRequest.estimated_cost ? '↓ ' : detailsForm.actual_cost > selectedRequest.estimated_cost ? '↑ ' : ''}
                        {formatCurrency(Math.abs(detailsForm.actual_cost - selectedRequest.estimated_cost))}
                        {' '}
                        ({(((detailsForm.actual_cost - selectedRequest.estimated_cost) / selectedRequest.estimated_cost) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label>Internal Notes</Label>
                  <Textarea
                    value={detailsForm.notes}
                    onChange={(e) => setDetailsForm({ ...detailsForm, notes: e.target.value })}
                    placeholder="Internal notes, special requirements, issues..."
                    rows={2}
                  />
                </div>

                {/* Quick Actions */}
                {selectedRequest.status === 'confirmed' && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        handleMarkComplete(selectedRequest)
                        setIsDetailsOpen(false)
                      }}
                      className="w-full"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark as Completed
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDetails}>
              Save Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

