import { useState, useMemo } from 'react'
import { useData, Payment, PaymentStatus, PaymentMethod } from '@/contexts/data-context'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable } from '@/components/ui/data-table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge'
import { Plus, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  partial: 'Partial',
  overdue: 'Overdue'
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  credit_card: 'Credit Card',
  check: 'Check',
  cash: 'Cash',
  other: 'Other'
}

export function Payments() {
  const { payments, suppliers, bookings, contracts, addPayment, updatePayment, deletePayment, recordPayment } = useData()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [_recordingPayment, setRecordingPayment] = useState<Payment | null>(null)
  
  // Filters
  const [filterSupplier, setFilterSupplier] = useState<string>('all')
  const [filterContract, setFilterContract] = useState<string>('all')
  
  const [paymentForm, setPaymentForm] = useState<Omit<Payment, 'id' | 'supplierName' | 'contractName' | 'created_date'>>({
    payment_type: 'contract',
    supplier_id: 0,
    description: '',
    contract_id: undefined,
    booking_ids: [],
    amount: 0,
    currency: 'EUR',
    due_date: '',
    payment_date: undefined,
    status: 'pending',
    payment_method: undefined,
    reference_number: '',
    notes: ''
  })

  const [_recordForm, setRecordForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer' as PaymentMethod,
    reference_number: ''
  })

  // Update payment status based on due date
  const getPaymentStatus = (payment: Payment): PaymentStatus => {
    if (payment.status === 'paid') return 'paid'
    
    const today = new Date().toISOString().split('T')[0]
    if (payment.due_date < today) {
      return 'overdue'
    }
    
    return 'pending'
  }

  const handleOpenDialog = (payment?: Payment) => {
    if (payment) {
      setEditingPayment(payment)
      setPaymentForm({
        payment_type: payment.payment_type,
        supplier_id: payment.supplier_id,
        description: payment.description || '',
        contract_id: payment.contract_id,
        booking_ids: payment.booking_ids || [],
        amount: payment.amount,
        currency: payment.currency,
        due_date: payment.due_date,
        payment_date: payment.payment_date,
        status: payment.status,
        payment_method: payment.payment_method,
        reference_number: payment.reference_number || '',
        notes: payment.notes || ''
      })
    } else {
      setEditingPayment(null)
      setPaymentForm({
        payment_type: 'contract',
        supplier_id: 0,
        description: '',
        contract_id: undefined,
        booking_ids: [],
        amount: 0,
        currency: 'EUR',
        due_date: '',
        payment_date: undefined,
        status: 'pending',
        payment_method: undefined,
        reference_number: '',
        notes: ''
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!paymentForm.supplier_id || !paymentForm.amount || !paymentForm.due_date) {
      toast.error('Please fill in supplier, amount, and due date')
      return
    }
    
    if (paymentForm.payment_type === 'contract' && !paymentForm.contract_id) {
      toast.error('Please select a contract for contract payment')
      return
    }

    if (editingPayment) {
      updatePayment(editingPayment.id, paymentForm)
      toast.success('Payment updated!')
    } else {
      addPayment(paymentForm)
      toast.success('Payment created!')
    }

    setIsDialogOpen(false)
  }

  const handleDelete = (payment: Payment) => {
    if (payment.status === 'paid') {
      if (!confirm(`This payment has been marked as paid. Delete anyway?`)) {
        return
      }
    }

    if (confirm(`Delete payment of ${formatCurrency(payment.amount)}?`)) {
      deletePayment(payment.id)
      toast.success('Payment deleted')
    }
  }

  const _handleRecordPayment = (payment: Payment) => {
    setRecordingPayment(payment)
    setRecordForm({
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer',
      reference_number: ''
    })
    setIsRecordPaymentOpen(true)
  }

  const handleConfirmRecordPayment = () => {
    if (!_recordingPayment) return
    
    recordPayment(
      _recordingPayment.id,
      _recordForm.payment_date,
      _recordForm.payment_method,
      _recordForm.reference_number
    )
    
    toast.success('Payment recorded!')
    setIsRecordPaymentOpen(false)
    setRecordingPayment(null)
  }
  
  // Suppress unused variable warnings
  void _handleRecordPayment

  // Calculate contracts with outstanding payments
  const contractsWithOutstanding = useMemo(() => {
    return contracts.filter(contract => {
      const contractTotal = contract.adjusted_payment_total || contract.contracted_payment_total || 0
      if (contractTotal === 0) return false
      
      const contractPayments = payments.filter(p => p.contract_id === contract.id && p.status === 'paid')
      const totalPaid = contractPayments.reduce((sum, p) => sum + p.amount, 0)
      
      return totalPaid < contractTotal
    })
  }, [contracts, payments])

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      if (filterSupplier !== 'all' && payment.supplier_id.toString() !== filterSupplier) {
        return false
      }
      if (filterContract !== 'all' && payment.contract_id?.toString() !== filterContract) {
        return false
      }
      return true
    })
  }, [payments, filterSupplier, filterContract])

  // Prepare table data from filtered payments
  const tableData = filteredPayments.map(payment => {
    const supplier = suppliers.find(s => s.id === payment.supplier_id)
    const actualStatus = getPaymentStatus(payment)
    const linkedBookings = payment.booking_ids ? bookings.filter(b => payment.booking_ids!.includes(b.id)) : []
    
    // For contract payments, show contract info
    const displayInfo = payment.payment_type === 'contract'
      ? payment.contractName || 'Contract Payment'
      : linkedBookings.map(b => `BK${b.id.toString().padStart(4, '0')}`).join(', ')
    
    return {
      ...payment,
      actualStatus,
      supplierType: supplier?.type || 'other',
      paymentTypeLabel: payment.payment_type === 'contract' ? 'Contract' : 'Bookings',
      displayInfo,
      formattedAmount: formatCurrency(payment.amount),
      statusLabel: PAYMENT_STATUS_LABELS[actualStatus]
    }
  })

  const columns = [
    { header: 'Description', accessor: 'description' },
    { header: 'Type', accessor: 'paymentTypeLabel', format: 'badge' as const },
    { header: 'Supplier', accessor: 'supplierName' },
    { header: 'For', accessor: 'displayInfo' },
    { header: 'Amount', accessor: 'formattedAmount' },
    { header: 'Due Date', accessor: 'due_date', format: 'date' as const },
    { header: 'Paid Date', accessor: 'payment_date', format: 'date' as const },
    { header: 'Status', accessor: 'statusLabel', format: 'badge' as const },
    { header: 'Reference', accessor: 'reference_number' },
    { header: 'Actions', accessor: 'actions', type: 'actions' as const, actions: ['edit', 'delete'] },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supplier Payments</h1>
          <p className="text-muted-foreground mt-1">
            Track contractual obligations and actual payments
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Payment
        </Button>
      </div>

      {/* Filters & Stats Combined */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="text-xs">Filter by Supplier</Label>
              <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Filter by Contract</Label>
              <Select 
                value={filterContract} 
                onValueChange={setFilterContract}
                disabled={filterSupplier === 'all'}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Contracts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contracts</SelectItem>
                  {contracts
                    .filter(c => c.supplier_id && (filterSupplier === 'all' || c.supplier_id.toString() === filterSupplier))
                    .map(contract => (
                      <SelectItem key={contract.id} value={contract.id.toString()}>
                        {contract.contract_name} - {contract.hotelName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {(filterSupplier !== 'all' || filterContract !== 'all') && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterSupplier('all')
                    setFilterContract('all')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {/* Inline Stats */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{contractsWithOutstanding.length}</span> contracts with outstanding payments
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Show which contracts are outstanding
                const contractList = contractsWithOutstanding
                  .map(c => `• ${c.contract_name} (${c.supplierName})`)
                  .join('\n')
                
                if (contractsWithOutstanding.length > 0) {
                  alert(`Outstanding Contracts:\n\n${contractList}`)
                } else {
                  alert('No outstanding contracts')
                }
              }}
            >
              View Outstanding
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contract Payment Progress - Only show when specific contract is filtered */}
      {filterContract !== 'all' && (() => {
        const contract = contracts.find(c => c.id.toString() === filterContract)
        if (!contract || (contract.contracted_payment_total || 0) === 0) return null
        
        const contractPayments = payments.filter(p => p.contract_id === contract.id)
        const paidPayments = contractPayments.filter(p => p.status === 'paid')
        const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0)
        
        const contractTotal = contract.adjusted_payment_total || contract.contracted_payment_total || 0
        const remaining = contractTotal - totalPaid
        const percentPaid = contractTotal > 0 ? (totalPaid / contractTotal) * 100 : 0
        
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">{contract.contract_name}</p>
                  <p className="text-xs text-muted-foreground">{contract.supplierName} • {contract.hotelName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(totalPaid)} / {formatCurrency(contractTotal)}</p>
                  <p className="text-xs text-muted-foreground">{percentPaid.toFixed(0)}% paid</p>
                </div>
              </div>
              
              {remaining > 0 && (
                <Badge variant="secondary" className="mt-2">
                  Outstanding: {formatCurrency(remaining)}
                </Badge>
              )}
              
              {contract.adjusted_payment_total && contract.adjusted_payment_total !== (contract.contracted_payment_total || 0) && (
                <Accordion type="single" collapsible className="mt-3">
                  <AccordionItem value="adjustment" className="border-none">
                    <AccordionTrigger className="py-2 text-xs hover:no-underline">
                      <span className="text-muted-foreground">Contract Adjustment Details</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 text-xs pt-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Original:</span>
                          <span>{formatCurrency(contract.contracted_payment_total || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Adjusted:</span>
                          <span className="font-medium">{formatCurrency(contract.adjusted_payment_total)}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Difference:</span>
                          <span className={contract.adjusted_payment_total < (contract.contracted_payment_total || 0) ? 'text-green-600' : 'text-destructive'}>
                            {contract.adjusted_payment_total < (contract.contracted_payment_total || 0) ? '-' : '+'}
                            {formatCurrency(Math.abs(contract.adjusted_payment_total - (contract.contracted_payment_total || 0)))}
                          </span>
                        </div>
                        {contract.adjustment_notes && (
                          <p className="text-muted-foreground italic mt-2">{contract.adjustment_notes}</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </CardContent>
          </Card>
        )
      })()}

      {/* Actual Payments Table */}
      <DataTable
        title="Actual Payments"
        columns={columns}
        data={tableData}
        onEdit={(item) => handleOpenDialog(item as unknown as Payment)}
        onDelete={(item) => handleDelete(item as unknown as Payment)}
        searchable
        pageSize={15}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? 'Edit Payment' : 'Add Payment'}
            </DialogTitle>
            <DialogDescription>
              {editingPayment ? 'Update payment details' : 'Create a new supplier payment'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Payment Type */}
            <div>
              <Label>Payment Type *</Label>
              <Select
                value={paymentForm.payment_type}
                onValueChange={(value) => setPaymentForm({ 
                  ...paymentForm, 
                  payment_type: value as 'contract' | 'booking',
                  contract_id: undefined,
                  booking_ids: []
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contract Payment (Deposit/Balance)</SelectItem>
                  <SelectItem value="booking">Per-Booking Payment (Freesale)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {paymentForm.payment_type === 'contract' 
                  ? 'Payment towards a contract commitment (e.g., deposit, final balance)'
                  : 'Payment for specific bookings (freesale/ad-hoc)'}
              </p>
            </div>

            {/* Supplier */}
            <div>
              <Label>Supplier *</Label>
              <Select
                value={paymentForm.supplier_id.toString()}
                onValueChange={(value) => {
                  const supplierId = parseInt(value)
                  const supplier = suppliers.find(s => s.id === supplierId)
                  setPaymentForm({
                    ...paymentForm,
                    supplier_id: supplierId,
                    currency: supplier?.default_currency || 'EUR'
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.filter(s => s.active).map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contract Payment Fields */}
            {paymentForm.payment_type === 'contract' && (
              <>
                <div>
                  <Label>Contract *</Label>
                  <Select
                    value={paymentForm.contract_id?.toString() || ''}
                    onValueChange={(value) => {
                      const contractId = parseInt(value)
                      const contract = contracts.find(c => c.id === contractId)
                      setPaymentForm({
                        ...paymentForm,
                        contract_id: contractId,
                        currency: contract?.currency || 'EUR'
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contract" />
                    </SelectTrigger>
                    <SelectContent>
                      {contracts
                        .filter(c => c.supplier_id === paymentForm.supplier_id)
                        .map(contract => {
                          // Show payment progress for this contract
                          const contractPayments = payments.filter(p => p.contract_id === contract.id && p.status === 'paid')
                          const totalPaid = contractPayments.reduce((sum, p) => sum + p.amount, 0)
                          
                          return (
                            <SelectItem key={contract.id} value={contract.id.toString()}>
                              {contract.contract_name} - {contract.hotelName}
                              {totalPaid > 0 && ` (Paid: ${formatCurrency(totalPaid)})`}
                            </SelectItem>
                          )
                        })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div>
                  <Label>Payment Description</Label>
                  <Select
                    value={paymentForm.description}
                    onValueChange={(value) => setPaymentForm({ ...paymentForm, description: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Deposit">Deposit</SelectItem>
                      <SelectItem value="1st Installment">1st Installment</SelectItem>
                      <SelectItem value="2nd Installment">2nd Installment</SelectItem>
                      <SelectItem value="3rd Installment">3rd Installment</SelectItem>
                      <SelectItem value="Final Balance">Final Balance</SelectItem>
                      <SelectItem value="Full Payment">Full Payment</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Contract Payment Schedule Reference */}
                {paymentForm.contract_id && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium">Contract Payment Schedule (Reference)</p>
                    </div>
                    {(() => {
                      const contract = contracts.find(c => c.id === paymentForm.contract_id)
                      if (!contract?.payment_schedule || contract.payment_schedule.length === 0) {
                        return <p className="text-xs text-muted-foreground">No payment schedule defined in contract</p>
                      }
                      
                      return (
                        <div className="space-y-2">
                          {contract.payment_schedule.map((schedule, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs p-2 bg-white dark:bg-card rounded border">
                              <div>
                                <span className="font-medium">{formatCurrency(schedule.amount_due)}</span>
                                <span className="text-muted-foreground ml-2">due {schedule.payment_date}</span>
                                {schedule.paid && <span className="text-green-600 ml-2">✓ Paid</span>}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs"
                                onClick={() => setPaymentForm({
                                  ...paymentForm,
                                  amount: schedule.amount_due,
                                  due_date: schedule.payment_date,
                                  description: idx === 0 ? 'Deposit' : 
                                               idx === contract.payment_schedule!.length - 1 ? 'Final Balance' : 
                                               `${idx + 1}${idx === 0 ? 'st' : idx === 1 ? 'nd' : idx === 2 ? 'rd' : 'th'} Installment`
                                })}
                              >
                                Use This
                              </Button>
                            </div>
                          ))}
                          <p className="text-xs text-muted-foreground italic mt-2">
                            💡 Click "Use This" to quick-fill from contract schedule, or enter custom amounts below
                          </p>
                        </div>
                      )
                    })()}
                  </div>
                )}

              </>
            )}

            {/* Booking Payment Fields */}
            {paymentForm.payment_type === 'booking' && (
              <div>
                <Label>Related Bookings *</Label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                  {paymentForm.supplier_id > 0 ? (
                    bookings
                      .filter(b => b.status !== 'cancelled')
                      .filter(b => {
                        // Filter bookings that have rooms from this supplier
                        return b.rooms && b.rooms.some(room => {
                          const roomContract = contracts.find(c => c.contract_name === room.contractName)
                          return roomContract?.supplier_id === paymentForm.supplier_id
                        })
                      })
                      .map(booking => (
                        <div key={booking.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`payment-booking-${booking.id}`}
                            checked={paymentForm.booking_ids?.includes(booking.id) || false}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setPaymentForm({
                                  ...paymentForm,
                                  booking_ids: [...(paymentForm.booking_ids || []), booking.id]
                                })
                              } else {
                                setPaymentForm({
                                  ...paymentForm,
                                  booking_ids: (paymentForm.booking_ids || []).filter(id => id !== booking.id)
                                })
                              }
                            }}
                          />
                          <label
                            htmlFor={`payment-booking-${booking.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            BK{booking.id.toString().padStart(4, '0')} - {booking.customer_name} ({booking.tourName})
                          </label>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a supplier first</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Currency</Label>
                <Select
                  value={paymentForm.currency}
                  onValueChange={(value) => setPaymentForm({ ...paymentForm, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CHF">CHF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={paymentForm.due_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, due_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={paymentForm.status}
                onValueChange={(value) => setPaymentForm({ ...paymentForm, status: value as PaymentStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentForm.status === 'paid' && (
              <>
                <div>
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={paymentForm.payment_date || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Payment Method</Label>
                  <Select
                    value={paymentForm.payment_method || 'bank_transfer'}
                    onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_method: value as PaymentMethod })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Reference Number</Label>
                  <Input
                    value={paymentForm.reference_number}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                    placeholder="Transaction ID, check #, etc."
                  />
                </div>
              </>
            )}

            <div>
              <Label>Notes</Label>
              <Textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingPayment ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isRecordPaymentOpen} onOpenChange={setIsRecordPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Mark payment as paid and record transaction details
            </DialogDescription>
          </DialogHeader>

          {_recordingPayment && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Payment to: {_recordingPayment.supplierName}</p>
                <p className="text-lg font-bold mt-1">{formatCurrency(_recordingPayment.amount)}</p>
                <p className="text-xs text-muted-foreground mt-1">Due: {_recordingPayment.due_date}</p>
              </div>

              <div>
                <Label>Payment Date *</Label>
                <Input
                  type="date"
                  value={_recordForm.payment_date}
                  onChange={(e) => setRecordForm({ ..._recordForm, payment_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Payment Method *</Label>
                <Select
                  value={_recordForm.payment_method}
                  onValueChange={(value) => setRecordForm({ ..._recordForm, payment_method: value as PaymentMethod })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Reference Number</Label>
                <Input
                  value={_recordForm.reference_number}
                  onChange={(e) => setRecordForm({ ..._recordForm, reference_number: e.target.value })}
                  placeholder="Transaction ID, check #, etc."
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsRecordPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRecordPayment}>
              Record Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

