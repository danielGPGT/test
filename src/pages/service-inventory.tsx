import { useState, useMemo } from 'react'
import { useData } from '@/contexts/data-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { StatsCard } from '@/components/ui/stats-card'
import { 
  Plus, 
  FileText, 
  DollarSign,
  Trash2,
  Package,
  Calendar,
  Percent
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

export function ServiceInventoryNew() {
  const {
    serviceInventoryTypes,
    serviceContracts,
    serviceRates,
    suppliers,
    tours,
    addServiceContract,
    updateServiceContract,
    deleteServiceContract,
    addServiceRate,
    updateServiceRate,
    deleteServiceRate
  } = useData()

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<any | null>(null)
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<any | null>(null)
  
  // Filters
  const [filterSupplier, setFilterSupplier] = useState<string>('all')
  const [filterInventoryType, setFilterInventoryType] = useState<string>('contract')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [contractForm, setContractForm] = useState({
    supplier_id: 0,
    inventory_type_id: 0,
    tour_id: undefined as number | undefined,
    contract_name: '',
    valid_from: '',
    valid_to: '',
    service_allocations: [] as any[],
    pricing_strategy: 'per_unit' as 'per_unit' | 'tiered',
    markup_percentage: 0.60,
    tax_rate: 0,
    service_fee: 0,
    contracted_payment_total: 0,
    payment_schedule: [] as any[],
    cancellation_policy: '',
    notes: '',
    active: true
  })

  const [allocationForm, setAllocationForm] = useState({
    category_ids: [] as string[],
    quantity: 0,
    base_rate: 0,
    label: ''
  })

  const [rateForm, setRateForm] = useState({
    contract_id: undefined as number | undefined,
    inventory_type_id: 0,
    category_id: '',
    tour_id: undefined as number | undefined,
    direction: undefined as 'one_way' | 'inbound' | 'outbound' | 'round_trip' | undefined,
    paired_rate_id: undefined as number | undefined,
    base_rate: 0,
    markup_percentage: 0.60,
    currency: 'USD',
    inventory_type: 'buy_to_order' as 'contract' | 'buy_to_order',
    allocated_quantity: undefined as number | undefined,
    available_quantity: undefined as number | undefined,
    valid_from: '',
    valid_to: '',
    days_of_week: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    },
    active: true,
    inactive_reason: ''
  })

  // Stats
  const stats = useMemo(() => {
    const totalContracts = serviceContracts.length
    const activeContracts = serviceContracts.filter(c => c.active).length
    const totalRates = serviceRates.length
    const activeRates = serviceRates.filter(r => r.active).length
    const contractedServices = serviceRates.filter(r => r.inventory_type === 'contract').length
    const buyToOrderServices = serviceRates.filter(r => r.inventory_type === 'buy_to_order').length

    return {
      totalContracts,
      activeContracts,
      totalRates,
      activeRates,
      contractedServices,
      buyToOrderServices
    }
  }, [serviceContracts, serviceRates])

  const handleOpenContractDialog = (inventoryTypeId?: number, contract?: any) => {
    if (contract) {
      setEditingContract(contract)
      setContractForm({
        supplier_id: contract.supplier_id,
        inventory_type_id: contract.inventory_type_id,
        tour_id: contract.tour_id,
        contract_name: contract.contract_name,
        valid_from: contract.valid_from,
        valid_to: contract.valid_to,
        service_allocations: contract.service_allocations || [],
        pricing_strategy: contract.pricing_strategy,
        markup_percentage: contract.markup_percentage,
        tax_rate: contract.tax_rate || 0,
        service_fee: contract.service_fee || 0,
        contracted_payment_total: contract.contracted_payment_total || 0,
        payment_schedule: contract.payment_schedule || [],
        cancellation_policy: contract.cancellation_policy || '',
        notes: contract.notes || '',
        active: contract.active
      })
    } else {
      setEditingContract(null)
      setContractForm({
        supplier_id: 0,
        inventory_type_id: inventoryTypeId || 0,
        tour_id: undefined,
        contract_name: '',
        valid_from: '',
        valid_to: '',
        service_allocations: [],
        pricing_strategy: 'per_unit',
        markup_percentage: 0.50,
        tax_rate: 0,
        service_fee: 0,
        contracted_payment_total: 0,
        payment_schedule: [],
        cancellation_policy: '',
        notes: '',
        active: true
      })
    }
    setIsContractDialogOpen(true)
  }

  const handleSaveContract = () => {
    if (!contractForm.supplier_id || !contractForm.inventory_type_id || !contractForm.contract_name) {
      toast.error('Please fill in required fields')
      return
    }

    if (editingContract) {
      updateServiceContract(editingContract.id, contractForm)
      toast.success('Service contract updated!')
    } else {
      addServiceContract(contractForm)
      toast.success('Service contract created!')
    }

    setIsContractDialogOpen(false)
  }

  const handleDeleteContract = (contract: any) => {
    if (confirm(`Delete contract "${contract.contract_name}"?`)) {
      deleteServiceContract(contract.id)
      toast.success('Contract deleted')
    }
  }

  const handleAddAllocation = () => {
    if (allocationForm.category_ids.length === 0 || !allocationForm.quantity || !allocationForm.base_rate) {
      toast.error('Please fill in all allocation fields')
      return
    }

    setContractForm({
      ...contractForm,
      service_allocations: [...contractForm.service_allocations, { ...allocationForm }]
    })

    setAllocationForm({
      category_ids: [],
      quantity: 0,
      base_rate: 0,
      label: ''
    })

    toast.success('Allocation added')
  }

  const handleRemoveAllocation = (index: number) => {
    setContractForm({
      ...contractForm,
      service_allocations: contractForm.service_allocations.filter((_: any, i: number) => i !== index)
    })
  }

  const handleOpenRateDialog = (rate?: any, inventoryTypeId?: number) => {
    if (rate) {
      setEditingRate(rate)
      setRateForm({
        contract_id: rate.contract_id,
        inventory_type_id: rate.inventory_type_id,
        category_id: rate.category_id,
        tour_id: rate.tour_id,
        direction: rate.direction,
        paired_rate_id: rate.paired_rate_id,
        base_rate: rate.base_rate,
        markup_percentage: rate.markup_percentage,
        currency: rate.currency,
        inventory_type: rate.inventory_type,
        allocated_quantity: rate.allocated_quantity,
        available_quantity: rate.available_quantity,
        valid_from: rate.valid_from,
        valid_to: rate.valid_to,
        days_of_week: rate.days_of_week || {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: true
        },
        active: rate.active,
        inactive_reason: rate.inactive_reason || ''
      })
    } else {
      setEditingRate(null)
      setRateForm({
        contract_id: undefined,
        inventory_type_id: inventoryTypeId || 0,
        category_id: '',
        tour_id: undefined,
        direction: undefined,
        paired_rate_id: undefined,
        base_rate: 0,
        markup_percentage: 0.60,
        currency: 'USD',
        inventory_type: 'buy_to_order',
        allocated_quantity: undefined,
        available_quantity: undefined,
        valid_from: '',
        valid_to: '',
        days_of_week: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: true
        },
        active: true,
        inactive_reason: ''
      })
    }
    setIsRateDialogOpen(true)
  }

  const handleSaveRate = () => {
    if (!rateForm.inventory_type_id || !rateForm.category_id || !rateForm.base_rate) {
      toast.error('Please fill in required fields')
      return
    }

    // Get pricing unit from category
    const inventoryType = serviceInventoryTypes.find(t => t.id === rateForm.inventory_type_id)
    const category = inventoryType?.service_categories.find(c => c.id === rateForm.category_id)

    if (editingRate) {
      updateServiceRate(editingRate.id, {
        ...rateForm,
        pricing_unit: category?.pricing_unit || 'per_person'
      })
      toast.success('Service rate updated!')
    } else {
      addServiceRate({
        ...rateForm,
        pricing_unit: category?.pricing_unit || 'per_person'
      })
      toast.success('Service rate created!')
    }

    setIsRateDialogOpen(false)
  }

  const handleDeleteRate = (rate: any) => {
    if (confirm(`Delete rate for "${rate.categoryName}"?`)) {
      deleteServiceRate(rate.id)
      toast.success('Rate deleted')
    }
  }

  const handleToggleRateStatus = (rate: any) => {
    updateServiceRate(rate.id, { active: !rate.active })
    toast.success(rate.active ? 'Rate deactivated' : 'Rate activated')
  }

  // Filter rates based on filters
  const filteredServiceRates = useMemo(() => {
    return serviceRates.filter(rate => {
      const contract = serviceContracts.find(c => c.id === rate.contract_id)
      
      const matchesSupplier = filterSupplier === 'all' || 
        (contract && contract.supplier_id.toString() === filterSupplier)
      const matchesInventoryType = filterInventoryType === 'all' || rate.inventory_type === filterInventoryType
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && rate.active) ||
        (filterStatus === 'inactive' && !rate.active)
      const matchesSearch = searchTerm === '' || 
        rate.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rate.inventoryTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rate.contractName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSupplier && matchesInventoryType && matchesStatus && matchesSearch
    })
  }, [serviceRates, serviceContracts, filterSupplier, filterInventoryType, filterStatus, searchTerm])

  // Filter contracts
  const filteredServiceContracts = useMemo(() => {
    return serviceContracts.filter(contract => {
      const matchesSupplier = filterSupplier === 'all' || contract.supplier_id.toString() === filterSupplier
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && contract.active) ||
        (filterStatus === 'inactive' && !contract.active)
      const matchesSearch = searchTerm === '' || 
        contract.contract_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.inventoryTypeName.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSupplier && matchesStatus && matchesSearch
    })
  }, [serviceContracts, filterSupplier, filterStatus, searchTerm])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Service Inventory</h1>
        <p className="text-muted-foreground mt-1">
          Manage service contracts, rates, and availability
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4">
        <StatsCard
          title="Contracts"
          value={stats.totalContracts}
          icon={FileText}
        />
        <StatsCard
          title="Rates"
          value={stats.totalRates}
          icon={DollarSign}
        />
        <StatsCard
          title="With Contract"
          value={stats.contractedServices}
          icon={FileText}
        />
        <StatsCard
          title="Buy-to-Order"
          value={stats.buyToOrderServices}
          icon={Package}
        />
        <StatsCard
          title="Inventory Types"
          value={serviceInventoryTypes.length}
          icon={Package}
        />
        <StatsCard
          title="Categories"
          value={serviceInventoryTypes.reduce((sum, t) => sum + (t.service_categories?.length || 0), 0)}
          icon={Package}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="grid gap-2">
                <Label>Inventory Type</Label>
                <Select
                  value={selectedTypeId?.toString() || 'all'}
                  onValueChange={(value) => setSelectedTypeId(value === 'all' ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Inventory Types</SelectItem>
                    {serviceInventoryTypes.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Supplier</Label>
                <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.filter(s => s.active).map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Inventory Type</Label>
                <Select value={filterInventoryType} onValueChange={setFilterInventoryType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="contract">Contract Only</SelectItem>
                    <SelectItem value="buy_to_order">Buy-to-Order Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Search</Label>
              <Input
                placeholder="Search contracts, rates, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {(filterSupplier !== 'all' || filterInventoryType !== 'contract' || filterStatus !== 'all' || searchTerm || selectedTypeId) && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredServiceRates.length} rates, {filteredServiceContracts.length} contracts
                </p>
                <div className="flex gap-2">
                  {selectedTypeId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenContractDialog(selectedTypeId)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      New Contract
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedTypeId(null)
                      setFilterSupplier('all')
                      setFilterInventoryType('contract')
                      setFilterStatus('all')
                      setSearchTerm('')
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Service Inventory Types */}
      {serviceInventoryTypes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No service inventory types yet. Go to <strong>Service Types</strong> to create one.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {serviceInventoryTypes
            .filter(type => !selectedTypeId || type.id === selectedTypeId)
            .map((inventoryType: any) => {
              const typeContracts = serviceContracts.filter(c => c.inventory_type_id === inventoryType.id)
              const typeRates = serviceRates.filter(r => r.inventory_type_id === inventoryType.id)

              return (
                <AccordionItem
                  key={inventoryType.id}
                  value={`type-${inventoryType.id}`}
                  className="border rounded-lg bg-card"
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                        <div className="text-left">
                          <div className="font-semibold">{inventoryType.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{inventoryType.service_categories?.length || 0} categories</span>
                          <span>•</span>
                          <span>{typeContracts.length} contracts</span>
                          <span>•</span>
                          <span>{typeRates.filter((r: any) => r.active).length}/{typeRates.length} active rates</span>
                        </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {typeContracts.length > 0 && (
                          <Badge style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                            {typeContracts.length} {typeContracts.length === 1 ? 'contract' : 'contracts'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4 pt-2">
                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenContractDialog(inventoryType.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          New Contract
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRateDialog(undefined, inventoryType.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          New Rate (Buy-to-Order)
                        </Button>
                      </div>

                      {/* Contracts */}
                      {typeContracts.filter((c: any) => filteredServiceContracts.some((fc: any) => fc.id === c.id)).length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">
                            Contracts ({typeContracts.filter((c: any) => filteredServiceContracts.some((fc: any) => fc.id === c.id)).length})
                          </h4>
                          {typeContracts.filter((c: any) => filteredServiceContracts.some((fc: any) => fc.id === c.id)).map((contract: any) => (
                            <div
                              key={contract.id}
                              className="border rounded-lg p-3"
                              style={{ backgroundColor: contract.active ? 'transparent' : 'hsl(var(--muted) / 0.3)' }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">{contract.contract_name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {contract.supplierName}
                                    </Badge>
                                    {!contract.active && (
                                      <Badge variant="secondary">Inactive</Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {contract.valid_from} → {contract.valid_to}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Percent className="h-3 w-3" />
                                      {(contract.markup_percentage * 100).toFixed(0)}% markup
                                    </span>
                                    {contract.service_allocations?.length > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{contract.service_allocations.length} {contract.service_allocations.length === 1 ? 'allocation' : 'allocations'}</span>
                                      </>
                                    )}
                                  </div>
                                  {contract.service_allocations && contract.service_allocations.length > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {contract.service_allocations.map((alloc: any, idx: number) => (
                                        <div key={idx}>
                                          {alloc.label || 'Allocation'}: {alloc.quantity} units @ {formatCurrency(alloc.base_rate || 0)}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenContractDialog(undefined, contract)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteContract(contract)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Rates */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">
                            Rates ({typeRates.filter((r: any) => filteredServiceRates.some((fr: any) => fr.id === r.id)).length} shown)
                          </h4>
                          <div className="text-xs text-muted-foreground">
                            {typeRates.filter((r: any) => r.inventory_type === 'contract' && filteredServiceRates.some((fr: any) => fr.id === r.id)).length} contract • {typeRates.filter((r: any) => r.inventory_type === 'buy_to_order' && filteredServiceRates.some((fr: any) => fr.id === r.id)).length} buy-to-order
                          </div>
                        </div>

                        {typeRates.filter((r: any) => filteredServiceRates.some((fr: any) => fr.id === r.id)).length > 0 ? (
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead style={{ backgroundColor: 'hsl(var(--muted))' }}>
                                <tr>
                                  <th className="text-left p-3 font-medium">Category</th>
                                  <th className="text-left p-3 font-medium">Type</th>
                                  <th className="text-left p-3 font-medium">Cost</th>
                                  <th className="text-left p-3 font-medium">Sell</th>
                                  <th className="text-left p-3 font-medium">Margin</th>
                                  <th className="text-left p-3 font-medium">Available</th>
                                  <th className="text-left p-3 font-medium">Status</th>
                                  <th className="text-center p-3 font-medium w-24">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {typeRates.filter((r: any) => filteredServiceRates.some((fr: any) => fr.id === r.id)).map((rate: any, idx: number) => {
                                  const margin = rate.selling_price - rate.base_rate
                                  const marginPercent = (margin / rate.base_rate) * 100

                                  return (
                                    <tr
                                      key={rate.id}
                                      className={rate.active ? '' : 'opacity-50'}
                                      style={{
                                        borderTop: idx > 0 ? '1px solid hsl(var(--border))' : 'none',
                                        backgroundColor: !rate.active ? 'hsl(var(--muted) / 0.3)' : 'transparent'
                                      }}
                                    >
                                      <td className="p-3">
                                        <div className="font-medium">{rate.categoryName}</div>
                                        {rate.contractName && (
                                          <div className="text-xs text-muted-foreground">{rate.contractName}</div>
                                        )}
                                      </td>
                                      <td className="p-3">
                                        <Badge
                                          variant={rate.inventory_type === 'contract' ? 'default' : 'outline'}
                                          className="text-xs"
                                        >
                                          {rate.inventory_type === 'contract' ? 'Contract' : 'Buy-to-Order'}
                                        </Badge>
                                      </td>
                                      <td className="p-3">{formatCurrency(rate.base_rate)}</td>
                                      <td className="p-3">{formatCurrency(rate.selling_price)}</td>
                                      <td className="p-3">
                                        <span style={{ color: 'hsl(var(--primary))' }}>
                                          {formatCurrency(margin)} ({marginPercent.toFixed(0)}%)
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        {rate.inventory_type === 'contract' ? (
                                          <span>{rate.available_quantity || 0}/{rate.allocated_quantity || 0}</span>
                                        ) : (
                                          <span className="text-muted-foreground">Unlimited</span>
                                        )}
                                      </td>
                                      <td className="p-3">
                                        <button
                                          onClick={() => handleToggleRateStatus(rate)}
                                          className="text-xs hover:underline"
                                        >
                                          {rate.active ? (
                                            <span style={{ color: 'hsl(var(--primary))' }}>✓ Active</span>
                                          ) : (
                                            <span className="text-muted-foreground">Inactive</span>
                                          )}
                                        </button>
                                      </td>
                                      <td className="p-3 text-center">
                                        <div className="flex justify-center gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleOpenRateDialog(rate)}
                                          >
                                            Edit
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteRate(rate)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                            No rates created yet. Create a contract or add buy-to-order rates.
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
        </Accordion>
      )}

      {/* Create/Edit Contract Dialog */}
      <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContract ? 'Edit' : 'Create'} Service Contract</DialogTitle>
            <DialogDescription>
              Manage contract details, allocations, and pricing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Contract Name *</Label>
                <Input
                  value={contractForm.contract_name}
                  onChange={(e) => setContractForm({ ...contractForm, contract_name: e.target.value })}
                  placeholder="e.g., F1 Weekend - Grandstand Block"
                />
              </div>

              <div className="grid gap-2">
                <Label>Supplier *</Label>
                <Select
                  value={contractForm.supplier_id.toString()}
                  onValueChange={(value) => setContractForm({ ...contractForm, supplier_id: parseInt(value) })}
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
            </div>

            <div className="grid gap-2">
              <Label>Inventory Type *</Label>
              <Select
                value={contractForm.inventory_type_id.toString()}
                onValueChange={(value) => setContractForm({ ...contractForm, inventory_type_id: parseInt(value) })}
                disabled={!!editingContract}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select inventory type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceInventoryTypes.map(type => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Link to Tour (Optional)</Label>
              <Select
                value={contractForm.tour_id?.toString() || 'none'}
                onValueChange={(value) => setContractForm({ ...contractForm, tour_id: value === 'none' ? undefined : parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific tour (Generic)</SelectItem>
                  {tours.map(tour => (
                    <SelectItem key={tour.id} value={tour.id.toString()}>
                      {tour.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Link this contract to a specific tour (e.g., F1 Abu Dhabi 2025) or leave generic
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Valid From *</Label>
                <Input
                  type="date"
                  value={contractForm.valid_from}
                  onChange={(e) => setContractForm({ ...contractForm, valid_from: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Valid To *</Label>
                <Input
                  type="date"
                  value={contractForm.valid_to}
                  onChange={(e) => setContractForm({ ...contractForm, valid_to: e.target.value })}
                />
              </div>
            </div>

            {/* Allocations */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium">Service Allocations</h4>
              
              {contractForm.service_allocations.length > 0 && (
                <div className="space-y-2">
                  {contractForm.service_allocations.map((alloc: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                      <div>
                        <div className="font-medium">{alloc.label || `Allocation ${idx + 1}`}</div>
                        <div className="text-xs text-muted-foreground">
                          {alloc.quantity} units @ {formatCurrency(alloc.base_rate || 0)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveAllocation(idx)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {contractForm.inventory_type_id > 0 && (
                <div className="p-3 border rounded-lg space-y-3" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                  <p className="text-sm font-medium">Add Allocation</p>
                  
                  <div className="grid gap-2">
                    <Label>Service Categories *</Label>
                    <Select
                      value={allocationForm.category_ids[0] || ''}
                      onValueChange={(value) => setAllocationForm({ ...allocationForm, category_ids: [value] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceInventoryTypes
                          .find(t => t.id === contractForm.inventory_type_id)
                          ?.service_categories.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.category_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="grid gap-2">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={allocationForm.quantity || ''}
                        onChange={(e) => setAllocationForm({ ...allocationForm, quantity: parseInt(e.target.value) || 0 })}
                        placeholder="e.g., 50"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Base Rate *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={allocationForm.base_rate || ''}
                        onChange={(e) => setAllocationForm({ ...allocationForm, base_rate: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Label</Label>
                      <Input
                        value={allocationForm.label}
                        onChange={(e) => setAllocationForm({ ...allocationForm, label: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <Button size="sm" onClick={handleAddAllocation}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Allocation
                  </Button>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium">Pricing & Fees</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Markup % *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={(contractForm.markup_percentage * 100).toFixed(0)}
                    onChange={(e) => setContractForm({ ...contractForm, markup_percentage: parseFloat(e.target.value) / 100 || 0 })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Tax Rate %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={contractForm.tax_rate ? (contractForm.tax_rate * 100).toFixed(0) : ''}
                    onChange={(e) => setContractForm({ ...contractForm, tax_rate: e.target.value ? parseFloat(e.target.value) / 100 : 0 })}
                    placeholder="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Service Fee</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={contractForm.service_fee || ''}
                    onChange={(e) => setContractForm({ ...contractForm, service_fee: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={contractForm.notes}
                onChange={(e) => setContractForm({ ...contractForm, notes: e.target.value })}
                placeholder="Contract notes, special terms..."
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="contract-active"
                checked={contractForm.active}
                onCheckedChange={(checked) => setContractForm({ ...contractForm, active: !!checked })}
              />
              <label htmlFor="contract-active" className="text-sm font-medium cursor-pointer">
                Active
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContractDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveContract}>
              {editingContract ? 'Update' : 'Create'} Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Rate Dialog */}
      <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRate ? 'Edit' : 'Create'} Service Rate</DialogTitle>
            <DialogDescription>
              Set pricing for a service category (contract-based or buy-to-order estimate)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Inventory Type *</Label>
                <Select
                  value={rateForm.inventory_type_id.toString()}
                  onValueChange={(value) => setRateForm({ ...rateForm, inventory_type_id: parseInt(value), category_id: '' })}
                  disabled={!!editingRate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select inventory type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceInventoryTypes.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Service Category *</Label>
                <Select
                  value={rateForm.category_id}
                  onValueChange={(value) => setRateForm({ ...rateForm, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceInventoryTypes
                      .find(t => t.id === rateForm.inventory_type_id)
                      ?.service_categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.category_name} ({cat.pricing_unit})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Contract (Optional)</Label>
              <Select
                value={rateForm.contract_id?.toString() || 'none'}
                onValueChange={(value) => {
                  const contractId = value === 'none' ? undefined : parseInt(value)
                  const contract = contractId ? serviceContracts.find(c => c.id === contractId) : null
                  setRateForm({ 
                    ...rateForm, 
                    contract_id: contractId,
                    inventory_type: value === 'none' ? 'buy_to_order' : 'contract',
                    tour_id: contract?.tour_id || rateForm.tour_id // Inherit tour from contract if available
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Contract (Buy-to-Order)</SelectItem>
                  {serviceContracts
                    .filter(c => c.inventory_type_id === rateForm.inventory_type_id)
                    .map(contract => (
                      <SelectItem key={contract.id} value={contract.id.toString()}>
                        {contract.contract_name} {contract.tourName && `(${contract.tourName})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Link to a contract for inventory tracking, or leave as buy-to-order for estimates
              </p>
            </div>

            {/* Tour Link (for buy-to-order rates) */}
            {!rateForm.contract_id && (
              <div className="grid gap-2">
                <Label>Link to Tour (Optional)</Label>
                <Select
                  value={rateForm.tour_id?.toString() || 'none'}
                  onValueChange={(value) => setRateForm({ ...rateForm, tour_id: value === 'none' ? undefined : parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific tour (Generic)</SelectItem>
                    {tours.map(tour => (
                      <SelectItem key={tour.id} value={tour.id.toString()}>
                        {tour.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  For buy-to-order rates, you can link to a specific tour or leave generic
                </p>
              </div>
            )}

            {rateForm.contract_id && (
              <div className="p-3 rounded-lg text-xs text-muted-foreground" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                {rateForm.tour_id ? (
                  <span>✓ Tour linked from contract: <strong>{tours.find(t => t.id === rateForm.tour_id)?.name}</strong></span>
                ) : (
                  <span>This rate inherits tour link from the contract (if any)</span>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Base Rate *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={rateForm.base_rate || ''}
                  onChange={(e) => setRateForm({ ...rateForm, base_rate: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label>Markup % *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={(rateForm.markup_percentage * 100).toFixed(0)}
                  onChange={(e) => setRateForm({ ...rateForm, markup_percentage: parseFloat(e.target.value) / 100 || 0 })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Currency</Label>
                <Select
                  value={rateForm.currency}
                  onValueChange={(value) => setRateForm({ ...rateForm, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selling Price Preview */}
            {rateForm.base_rate > 0 && (
              <div className="p-3 border rounded-lg" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                <div className="flex justify-between text-sm">
                  <span>Selling Price:</span>
                  <span className="font-bold">
                    {formatCurrency(rateForm.base_rate * (1 + rateForm.markup_percentage))}
                    <span className="text-xs text-muted-foreground ml-2">
                      (Margin: {formatCurrency(rateForm.base_rate * rateForm.markup_percentage)})
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Inventory Tracking (if contract) */}
            {rateForm.contract_id && (
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium text-sm">Inventory Tracking</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Allocated Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={rateForm.allocated_quantity || ''}
                      onChange={(e) => setRateForm({ 
                        ...rateForm, 
                        allocated_quantity: parseInt(e.target.value) || undefined,
                        available_quantity: parseInt(e.target.value) || undefined
                      })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Currently Available</Label>
                    <Input
                      type="number"
                      min={0}
                      value={rateForm.available_quantity || ''}
                      onChange={(e) => setRateForm({ ...rateForm, available_quantity: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Valid From *</Label>
                <Input
                  type="date"
                  value={rateForm.valid_from}
                  onChange={(e) => setRateForm({ ...rateForm, valid_from: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Valid To *</Label>
                <Input
                  type="date"
                  value={rateForm.valid_to}
                  onChange={(e) => setRateForm({ ...rateForm, valid_to: e.target.value })}
                />
              </div>
            </div>

            {/* Days of Week (MWTTFSS) */}
            <div className="grid gap-2">
              <Label>Days Available</Label>
              <div className="flex items-center gap-2 p-3 rounded-md" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                {[
                  { key: 'monday' as const, label: 'M' },
                  { key: 'tuesday' as const, label: 'T' },
                  { key: 'wednesday' as const, label: 'W' },
                  { key: 'thursday' as const, label: 'T' },
                  { key: 'friday' as const, label: 'F' },
                  { key: 'saturday' as const, label: 'S' },
                  { key: 'sunday' as const, label: 'S' }
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={rateForm.days_of_week[key]}
                      onChange={(e) => setRateForm({
                        ...rateForm,
                        days_of_week: {
                          ...rateForm.days_of_week,
                          [key]: e.target.checked
                        }
                      })}
                      className="w-4 h-4"
                    />
                    <span className="text-xs font-medium">{label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Select which days this rate is available
              </p>
            </div>

            {/* Direction (for transfers) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Direction (Optional)</Label>
                <Select
                  value={rateForm.direction || 'none'}
                  onValueChange={(value) => setRateForm({ ...rateForm, direction: value === 'none' ? undefined : value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    <SelectItem value="one_way">One Way</SelectItem>
                    <SelectItem value="inbound">Inbound (Arrival)</SelectItem>
                    <SelectItem value="outbound">Outbound (Departure)</SelectItem>
                    <SelectItem value="round_trip">Round Trip (Both Ways)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  For transfers: specify if this is arrival, departure, or round-trip
                </p>
              </div>

              {(rateForm.direction === 'inbound' || rateForm.direction === 'outbound') && (
                <div className="grid gap-2">
                  <Label>Paired Rate (Optional)</Label>
                  <Select
                    value={rateForm.paired_rate_id?.toString() || 'none'}
                    onValueChange={(value) => setRateForm({ ...rateForm, paired_rate_id: value === 'none' ? undefined : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No pairing</SelectItem>
                      {serviceRates
                        .filter(r => 
                          r.id !== editingRate?.id && 
                          r.inventory_type_id === rateForm.inventory_type_id &&
                          r.category_id === rateForm.category_id &&
                          r.direction && r.direction !== rateForm.direction
                        )
                        .map(rate => (
                          <SelectItem key={rate.id} value={rate.id.toString()}>
                            {rate.categoryName} ({rate.direction})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Link to return transfer for easy booking
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rate-active"
                checked={rateForm.active}
                onCheckedChange={(checked) => setRateForm({ ...rateForm, active: !!checked })}
              />
              <label htmlFor="rate-active" className="text-sm font-medium cursor-pointer">
                Active (available for bookings)
              </label>
            </div>

            {!rateForm.active && (
              <div className="grid gap-2">
                <Label>Inactive Reason</Label>
                <Input
                  value={rateForm.inactive_reason}
                  onChange={(e) => setRateForm({ ...rateForm, inactive_reason: e.target.value })}
                  placeholder="e.g., Sold out, Temporarily unavailable"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRate}>
              {editingRate ? 'Update' : 'Create'} Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

