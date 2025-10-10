import { useState, useMemo } from 'react'
import { useData, Supplier, SupplierType } from '@/contexts/data-context'
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
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable } from '@/components/ui/data-table'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

const SUPPLIER_TYPE_LABELS: Record<SupplierType, string> = {
  direct: 'Direct',
  dmc: 'DMC',
  wholesaler: 'Wholesaler',
  bedbank: 'Bedbank',
  consolidator: 'Consolidator',
  other: 'Other'
}

export function Suppliers() {
  const { suppliers, contracts, bookings, payments, addSupplier, updateSupplier, deleteSupplier } = useData()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierForm, setSupplierForm] = useState<Omit<Supplier, 'id'>>({
    name: '',
    type: 'direct',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    payment_terms: 'Net 30',
    default_currency: 'EUR',
    website: '',
    notes: '',
    active: true
  })

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setSupplierForm({
        name: supplier.name,
        type: supplier.type,
        contact_name: supplier.contact_name || '',
        contact_email: supplier.contact_email || '',
        contact_phone: supplier.contact_phone || '',
        payment_terms: supplier.payment_terms || 'Net 30',
        default_currency: supplier.default_currency || 'EUR',
        website: supplier.website || '',
        notes: supplier.notes || '',
        active: supplier.active
      })
    } else {
      setEditingSupplier(null)
      setSupplierForm({
        name: '',
        type: 'direct',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        payment_terms: 'Net 30',
        default_currency: 'EUR',
        website: '',
        notes: '',
        active: true
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!supplierForm.name || !supplierForm.type) {
      toast.error('Please enter supplier name and type')
      return
    }

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierForm)
      toast.success('Supplier updated!')
    } else {
      addSupplier(supplierForm)
      toast.success('Supplier created!')
    }

    setIsDialogOpen(false)
  }

  const handleDelete = (supplier: Supplier) => {
    const supplierContracts = contracts.filter(c => c.supplier_id === supplier.id)
    if (supplierContracts.length > 0) {
      toast.error(`Cannot delete supplier with ${supplierContracts.length} active contract(s)`)
      return
    }

    if (confirm(`Delete ${supplier.name}?`)) {
      deleteSupplier(supplier.id)
      toast.success('Supplier deleted')
    }
  }

  // Calculate supplier balances
  const supplierBalances = useMemo(() => {
    return suppliers.map(supplier => {
      // Get all bookings with rooms from this supplier
      const supplierBookings = bookings.filter(booking => 
        booking.status !== 'cancelled' &&
        booking.rooms &&
        Array.isArray(booking.rooms) &&
        booking.rooms.some(room => {
          // Find contract for this room to check supplier
          const roomContract = contracts.find(c => c.contract_name === room.contractName)
          return roomContract?.supplier_id === supplier.id
        })
      )
      
      // Calculate total owed to this supplier
      const totalOwed = supplierBookings.reduce((sum, booking) => {
        const supplierRooms = booking.rooms.filter(room => {
          const roomContract = contracts.find(c => c.contract_name === room.contractName)
          return roomContract?.supplier_id === supplier.id
        })
        
        return sum + supplierRooms.reduce((roomSum, room) => 
          roomSum + ((room.estimated_cost_per_room || 0) * room.quantity), 0
        )
      }, 0)
      
      // Calculate total paid to this supplier
      const totalPaid = payments
        .filter(p => p.supplier_id === supplier.id && p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0)
      
      const outstanding = totalOwed - totalPaid
      
      return {
        supplierId: supplier.id,
        totalOwed,
        totalPaid,
        outstanding
      }
    })
  }, [suppliers, bookings, contracts, payments])

  // Prepare data with contract count and formatted type
  const tableData = suppliers.map(supplier => {
    const balance = supplierBalances.find(b => b.supplierId === supplier.id)
    
    return {
      ...supplier,
      typeLabel: SUPPLIER_TYPE_LABELS[supplier.type],
      contractCount: contracts.filter(c => c.supplier_id === supplier.id).length,
      statusLabel: supplier.active ? 'Active' : 'Inactive',
      outstandingBalance: balance?.outstanding || 0,
      formattedOutstanding: formatCurrency(balance?.outstanding || 0)
    }
  })

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Type', accessor: 'typeLabel', format: 'badge' as const },
    { header: 'Contact', accessor: 'contact_name' },
    { header: 'Email', accessor: 'contact_email' },
    { header: 'Payment Terms', accessor: 'payment_terms' },
    { header: 'Contracts', accessor: 'contractCount' },
    { header: 'Outstanding', accessor: 'formattedOutstanding' },
    { header: 'Status', accessor: 'statusLabel', format: 'badge' as const },
    { header: 'Actions', accessor: 'actions', type: 'actions' as const, actions: ['edit', 'delete'] },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground mt-1">
            Manage suppliers, DMCs, and bedbanks
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Table */}
      <DataTable
        title="Suppliers"
        columns={columns}
        data={tableData}
        onEdit={(item) => handleOpenDialog(item as unknown as Supplier)}
        onDelete={(item) => handleDelete(item as unknown as Supplier)}
        searchable
        pageSize={10}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier ? 'Update supplier details' : 'Create a new supplier'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Supplier Name *</Label>
              <Input
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                placeholder="e.g., Hotelbeds, Grand Hotel Direct"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type *</Label>
                <Select
                  value={supplierForm.type}
                  onValueChange={(value) => setSupplierForm({ ...supplierForm, type: value as SupplierType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SUPPLIER_TYPE_LABELS) as SupplierType[]).map(type => (
                      <SelectItem key={type} value={type}>
                        {SUPPLIER_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Currency</Label>
                <Select
                  value={supplierForm.default_currency}
                  onValueChange={(value) => setSupplierForm({ ...supplierForm, default_currency: value })}
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
              <Label>Contact Name</Label>
              <Input
                value={supplierForm.contact_name}
                onChange={(e) => setSupplierForm({ ...supplierForm, contact_name: e.target.value })}
                placeholder="Contact person"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={supplierForm.contact_email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact_email: e.target.value })}
                  placeholder="contact@supplier.com"
                />
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={supplierForm.contact_phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact_phone: e.target.value })}
                  placeholder="+1 555-123-4567"
                />
              </div>
            </div>

            <div>
              <Label>Website</Label>
              <Input
                value={supplierForm.website}
                onChange={(e) => setSupplierForm({ ...supplierForm, website: e.target.value })}
                placeholder="www.supplier.com"
              />
            </div>

            <div>
              <Label>Payment Terms</Label>
              <Select
                value={supplierForm.payment_terms}
                onValueChange={(value) => setSupplierForm({ ...supplierForm, payment_terms: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prepayment">Prepayment</SelectItem>
                  <SelectItem value="Pay on Check-in">Pay on Check-in</SelectItem>
                  <SelectItem value="Net 7">Net 7</SelectItem>
                  <SelectItem value="Net 15">Net 15</SelectItem>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 45">Net 45</SelectItem>
                  <SelectItem value="Net 60">Net 60</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={supplierForm.notes}
                onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={supplierForm.active}
                onCheckedChange={(checked) => setSupplierForm({ ...supplierForm, active: checked as boolean })}
              />
              <label htmlFor="active" className="text-sm font-medium">
                Active supplier
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingSupplier ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
