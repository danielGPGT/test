/**
 * UNIFIED INVENTORY PAGE - REDESIGNED UX/UI
 * Modern minimal design with left panel + right tabs
 * Clean, intuitive navigation with low page real estate
 */

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Package, Trash2, Edit, FileText, Building2, Ticket, Car, Compass, Utensils, MapPin, Truck, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useData } from '@/contexts/data-context'
import type { InventoryItem, UnifiedContract, UnifiedRate, Allocation } from '@/types/unified-inventory'
import { ITEM_TYPE_LABELS } from '@/types/unified-inventory'

// Icon mapping for item types
const ITEM_ICONS = {
  hotel: Building2,
  ticket: Ticket,
  transfer: Car,
  activity: Compass,
  meal: Utensils,
  venue: MapPin,
  transport: Truck,
  experience: Sparkles,
  other: Package
}

// Import forms
import {
  UnifiedItemForm
} from '@/components/unified-inventory/forms'

// Import plugin system
import '@/plugins' // Load all plugins
import { CoreContractForm } from '@/core/components/CoreContractForm'
import { CoreRateForm } from '@/core/components/CoreRateForm'
import { getPlugin } from '@/core/plugin-registry'

// Map old item types to new plugin IDs
const getPluginForItemType = (itemType: string) => {
  const pluginMap: Record<string, string> = {
    'hotel': 'accommodation_room',
    'transfer': 'transfer',
    'event': 'event_ticket',
    'activity': 'activity',
    'meal': 'meal',
    'venue': 'venue',
    'transport': 'transport'
  }
  return pluginMap[itemType] || null
}

export function UnifiedInventoryRedesigned() {
  const {
    inventoryItems,
    unifiedContracts,
    unifiedRates,
    allocations,
    suppliers,
    allocationPoolCapacity,
    addInventoryItem,
    updateInventoryItem,
    addUnifiedContract,
    updateUnifiedContract,
    deleteUnifiedContract,
    addUnifiedRate,
    updateUnifiedRate,
    deleteUnifiedRate,
    addAllocation,
    updateAllocation,
    deleteAllocation,
    addAllocationPoolCapacity,
    updateAllocationPoolCapacity,
    deleteAllocationPoolCapacity
  } = useData()

  // Dialog state
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>()
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<UnifiedContract | undefined>()
  const [selectedItemForContract, setSelectedItemForContract] = useState<InventoryItem | undefined>()
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<UnifiedRate | undefined>()
  const [selectedItemForRate, setSelectedItemForRate] = useState<InventoryItem | undefined>()
  
  // Allocation management states
  const [isAllocationCreateDialogOpen, setIsAllocationCreateDialogOpen] = useState(false)
  const [editingAllocation, setEditingAllocation] = useState<Allocation | undefined>()
  const [selectedItemForAllocationCreate, setSelectedItemForAllocationCreate] = useState<InventoryItem | undefined>()
  
  // Pool management states
  const [isPoolManagementDialogOpen, setIsPoolManagementDialogOpen] = useState(false)
  const [selectedPoolForManagement, setSelectedPoolForManagement] = useState<typeof allocationPoolCapacity[0] | undefined>()
  
  
  // Selected item for right panel
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>()

  // Filters
  const [filterItemType, setFilterItemType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Filtered data
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      const matchesType = filterItemType === 'all' || item.item_type === filterItemType
      const matchesSearch = !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesType && matchesSearch
    })
  }, [inventoryItems, filterItemType, searchTerm])

  // Helper functions for allocations
  const getItemAllocations = (itemId: number): Allocation[] => {
    return allocations.filter(a => a.item_id === itemId)
  }

  const getItemPools = (itemId: number) => {
    return allocationPoolCapacity.filter(p => p.item_id === itemId)
  }

  // Handlers - Item
  const handleOpenItemDialog = (item?: InventoryItem) => {
    setEditingItem(item)
    setIsItemDialogOpen(true)
  }

  const handleSaveItem = (itemData: Omit<InventoryItem, 'id' | 'created_at'>) => {
    if (editingItem) {
      updateInventoryItem(editingItem.id, itemData)
      toast.success(`${itemData.item_type} updated!`)
    } else {
      addInventoryItem(itemData)
      toast.success(`${itemData.item_type} created!`)
    }
    setIsItemDialogOpen(false)
    setEditingItem(undefined)
  }

  // Handlers - Contract
  const handleOpenContractDialog = (item: InventoryItem, contract?: UnifiedContract) => {
    setSelectedItemForContract(item)
    setEditingContract(contract)
    setIsContractDialogOpen(true)
  }

  const handleSaveContract = (contractData: Partial<UnifiedContract>) => {
    if (editingContract) {
      updateUnifiedContract(editingContract.id, contractData)
      toast.success('Contract updated!')
    } else {
      addUnifiedContract(contractData as any)
      toast.success('✅ Contract created!')
    }
    setIsContractDialogOpen(false)
    setEditingContract(undefined)
    setSelectedItemForContract(undefined)
  }

  // Adapter function to convert core Contract to UnifiedContract
  const handleSaveCoreContract = (coreContract: any) => {
    // Convert core Contract to UnifiedContract format
    const pluginMeta = coreContract.plugin_meta || {}
    
    const unifiedContract: Partial<UnifiedContract> = {
      contract_name: coreContract.contract_name,
      supplier_id: parseInt(coreContract.supplier_id),
      supplierName: suppliers.find(s => s.id.toString() === coreContract.supplier_id)?.name || 'Unknown Supplier',
      item_id: selectedItemForContract?.id || 0,
      itemName: selectedItemForContract?.name || 'Unknown Item',
      item_type: selectedItemForContract?.item_type || 'hotel',
      valid_from: coreContract.valid_from,
      valid_to: coreContract.valid_to,
      currency: coreContract.currency,
      active: coreContract.active,
      days_of_week: coreContract.plugin_meta?.days_of_week || { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
      
      // Map hotel-specific fields from plugin_meta to UnifiedContract fields
      pricing_strategy: pluginMeta.pricing_strategy || 'per_occupancy',
      markup_percentage: pluginMeta.markup_percentage,
      tax_rate: pluginMeta.tax_rate,
      min_nights: pluginMeta.min_nights,
      max_nights: pluginMeta.max_nights,
      contracted_payment_total: pluginMeta.contracted_payment_total,
      
      // Hotel-specific costs (legacy fields)
      hotel_costs: {
        city_tax_per_person_per_night: pluginMeta.city_tax_per_person_per_night,
        resort_fee_per_night: pluginMeta.resort_fee_per_night,
        supplier_commission_rate: pluginMeta.supplier_commission_rate,
        board_options: pluginMeta.board_options
      },
      
      // Complex hotel fields
      attrition_stages: pluginMeta.attrition_stages,
      cancellation_stages: pluginMeta.cancellation_stages,
      payment_schedule: pluginMeta.payment_schedule,
      
      // Store hotel-specific data in custom fields (we'll add these to the interface if needed)
      // For now, store in a way that can be accessed later
      hotel_meta: {
        total_rooms: pluginMeta.total_rooms,
        base_rate: pluginMeta.base_rate,
        room_allocations: pluginMeta.room_allocations,
        occupancy_rates: pluginMeta.occupancy_rates,
        notes: pluginMeta.notes
      }
    }
    
    handleSaveContract(unifiedContract)
  }

  const handleDeleteContract = (contract: UnifiedContract) => {
    const contractRates = unifiedRates.filter(r => r.contract_id === contract.id)
    if (contractRates.length > 0) {
      toast.error(`Cannot delete contract with ${contractRates.length} rates`)
      return
    }
    
    if (confirm(`Delete contract "${contract.contract_name}"?`)) {
      deleteUnifiedContract(contract.id)
      toast.success('Contract deleted')
    }
  }


  // Handlers - Rate
  const handleOpenRateDialog = (item: InventoryItem, rate?: UnifiedRate) => {
    setSelectedItemForRate(item)
    setEditingRate(rate)
    setIsRateDialogOpen(true)
  }


  const handleSaveRate = (rateData: any) => {
    // Convert core rate data to UnifiedRate format
    const pluginMeta = rateData.plugin_meta || {}
    const selectedContract = unifiedContracts.find(c => c.id.toString() === rateData.contract_id)
    
    const unifiedRate: Partial<UnifiedRate> = {
      category_id: rateData.category_id || '',
      categoryName: selectedItemForRate?.categories?.find(c => c.id.toString() === rateData.category_id)?.category_name || 'Unknown Category',
      contract_id: rateData.contract_id ? parseInt(rateData.contract_id) : undefined,
      contractName: selectedContract?.contract_name || undefined,
      item_id: selectedItemForRate?.id || 0,
      itemName: selectedItemForRate?.name || 'Unknown Item',
      item_type: selectedItemForRate?.item_type || 'hotel',
      inventory_type: rateData.inventory_type || 'buy_to_order',
      base_rate: rateData.base_rate || 0,
      selling_price: rateData.base_rate || 0, // For now, same as base rate
      currency: rateData.currency || 'GBP',
      valid_from: rateData.valid_from || '',
      valid_to: rateData.valid_to || '',
      days_of_week: rateData.days_of_week || { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
      active: rateData.active !== false,
      allocation_pool_id: pluginMeta.allocation_pool_id,
      
      // Map hotel-specific fields from plugin_meta to UnifiedRate fields
      rate_details: {
        // Hotel-specific details
        ...(selectedItemForRate?.item_type === 'hotel' && {
          occupancy_type: pluginMeta.occupancy_type || 'double',
          board_type: pluginMeta.board_type || 'bed_breakfast',
          board_cost: pluginMeta.board_cost || 0,
          board_included: pluginMeta.contract_linked || false
        }),
        // Service-specific details
        ...(selectedItemForRate?.item_type !== 'hotel' && {
          pricing_unit: 'per_person'
        })
      }
    }

    if (editingRate) {
      updateUnifiedRate(editingRate.id, unifiedRate)
      toast.success('Rate updated!')
    } else {
      addUnifiedRate(unifiedRate as any)
      toast.success('✅ Rate created!')
    }
    setIsRateDialogOpen(false)
    setEditingRate(undefined)
    setSelectedItemForRate(undefined)
  }

  const handleDeleteRate = (rate: UnifiedRate) => {
    if (confirm(`Delete rate "${rate.categoryName}"?`)) {
      deleteUnifiedRate(rate.id)
      toast.success('Rate deleted')
    }
  }

  // Handlers - Allocation
  const handleCreateAllocation = (item: InventoryItem) => {
    setSelectedItemForAllocationCreate(item)
    setIsAllocationCreateDialogOpen(true)
  }

  const handleSaveAllocation = (allocationData: Omit<Allocation, 'id' | 'itemName' | 'supplierName' | 'contractName' | 'tourNames' | 'created_at'>) => {
    if (editingAllocation) {
      // Update the allocation
      updateAllocation(editingAllocation.id, allocationData)
      
      // Update the corresponding pool capacity
      const existingPool = allocationPoolCapacity.find(p => p.pool_id === allocationData.allocation_pool_id)
      if (existingPool) {
        const currentBookings = existingPool.total_capacity - existingPool.available_spots
        const newAvailableSpots = Math.max(0, allocationData.quantity - currentBookings)
        
        updateAllocationPoolCapacity(existingPool.pool_id, {
          total_capacity: allocationData.quantity,
          available_spots: newAvailableSpots,
          item_name: allocationData.item_id ? inventoryItems.find(i => i.id === allocationData.item_id)?.name || 'Unknown Item' : 'Unknown Item'
        })
      }
      
      toast.success('Allocation and pool updated!')
    } else {
      // Create the allocation
      addAllocation(allocationData)
      
      // Auto-generate pool from allocation
      const existingPool = allocationPoolCapacity.find(p => p.pool_id === allocationData.allocation_pool_id)
      if (!existingPool) {
        const poolData = {
          pool_id: allocationData.allocation_pool_id,
          item_id: allocationData.item_id,
          item_name: allocationData.item_id ? inventoryItems.find(i => i.id === allocationData.item_id)?.name || 'Unknown Item' : 'Unknown Item',
          item_type: allocationData.item_type,
          total_capacity: allocationData.quantity,
          available_spots: allocationData.quantity, // Start with full capacity
          current_bookings: 0,
          daily_availability: {},
          allows_overbooking: false,
          waitlist_enabled: false,
          status: 'healthy' as const
        }
        addAllocationPoolCapacity(poolData)
      }
      
      toast.success('✅ Allocation and pool created!')
    }
    setIsAllocationCreateDialogOpen(false)
    setEditingAllocation(undefined)
    setSelectedItemForAllocationCreate(undefined)
  }

  const handleEditAllocation = (allocation: Allocation) => {
    setEditingAllocation(allocation)
    const item = inventoryItems.find(i => i.id === allocation.item_id)
    setSelectedItemForAllocationCreate(item)
    setIsAllocationCreateDialogOpen(true)
  }

  const handleDeleteAllocation = (allocation: Allocation) => {
    if (confirm(`Delete allocation "${allocation.label}"?`)) {
      // Check if pool is used by any rates
      const ratesUsingPool = unifiedRates.filter(r => r.allocation_pool_id === allocation.allocation_pool_id)
      if (ratesUsingPool.length > 0) {
        toast.error(`Cannot delete allocation - pool is used by ${ratesUsingPool.length} rates`)
        return
      }
      
      // Check if pool has bookings
      const pool = allocationPoolCapacity.find(p => p.pool_id === allocation.allocation_pool_id)
      if (pool && pool.available_spots < pool.total_capacity) {
        toast.error('Cannot delete allocation - pool has bookings')
        return
      }
      
      // Delete the allocation
      deleteAllocation(allocation.id)
      
      // Delete the corresponding pool
      if (pool) {
        deleteAllocationPoolCapacity(pool.pool_id)
      }
      
      toast.success('Allocation and pool deleted')
    }
  }

  // Handlers - Pool Management
  const handleOpenPoolManagement = (pool: typeof allocationPoolCapacity[0]) => {
    setSelectedPoolForManagement(pool)
    setIsPoolManagementDialogOpen(true)
  }

  const handleUpdatePoolSettings = (updates: Partial<typeof allocationPoolCapacity[0]>) => {
    if (selectedPoolForManagement) {
      updateAllocationPoolCapacity(selectedPoolForManagement.pool_id, updates)
      toast.success('Pool settings updated!')
      setIsPoolManagementDialogOpen(false)
      setSelectedPoolForManagement(undefined)
    }
  }

  const handleAdjustPoolCapacity = (newAvailableSpots: number) => {
    if (selectedPoolForManagement) {
      if (newAvailableSpots > selectedPoolForManagement.total_capacity) {
        toast.error('Available spots cannot exceed total capacity')
        return
      }
      
      updateAllocationPoolCapacity(selectedPoolForManagement.pool_id, {
        available_spots: newAvailableSpots,
        current_bookings: selectedPoolForManagement.total_capacity - newAvailableSpots
      })
      
      toast.success('Pool capacity adjusted!')
      setIsPoolManagementDialogOpen(false)
      setSelectedPoolForManagement(undefined)
    }
  }


  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div>
          <h2 className="text-xl font-semibold">Unified Inventory</h2>
          <p className="text-xs text-muted-foreground">
            Manage all inventory types: hotels, tickets, transfers, activities
          </p>
        </div>
        <Button onClick={() => handleOpenItemDialog()} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Inventory Items */}
        <div className="w-80 border-r bg-muted/20 flex flex-col">
          {/* Stats Summary */}
          <div className="p-3 border-b bg-background">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <div className="font-semibold text-sm">{inventoryItems.length}</div>
                <div className="text-muted-foreground">Items</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm">{unifiedRates.length}</div>
                <div className="text-muted-foreground">Rates</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-3 border-b bg-background">
            <div className="space-y-2">
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-xs"
              />
              <Select value={filterItemType} onValueChange={setFilterItemType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(ITEM_TYPE_LABELS).map(([type, label]) => (
                    <SelectItem key={type} value={type}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Inventory Items List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {filteredItems.map(item => {
                const Icon = ITEM_ICONS[item.item_type]
                const isSelected = selectedItem?.id === item.id
                
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium text-sm truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs opacity-75">
                      <span>{ITEM_TYPE_LABELS[item.item_type]}</span>
                      <span>{item.categories.length} categories</span>
                    </div>
                    <div className="flex items-center justify-between text-xs opacity-75 mt-1">
                      <span>
                        {unifiedContracts.filter(c => c.item_id === item.id).length} contracts
                      </span>
                      <span>
                        {unifiedRates.filter(r => r.item_id === item.id).length} rates
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Panel - Details */}
        <div className="flex-1 flex flex-col">
          {selectedItem ? (
            <>
              {/* Item Header */}
              <div className="p-4 border-b bg-background">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = ITEM_ICONS[selectedItem.item_type]
                      return <Icon className="h-5 w-5" />
                    })()}
                    <div>
                      <h3 className="font-semibold">{selectedItem.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {ITEM_TYPE_LABELS[selectedItem.item_type]} • {selectedItem.categories.length} categories
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleOpenItemDialog(selectedItem)}
                  >
                    Edit Item
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="contracts" className="h-full flex flex-col">
                  <div className="border-b bg-background">
                    <div className="flex items-center px-4">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="contracts" className="text-xs">
                          Contracts ({unifiedContracts.filter(c => c.item_id === selectedItem.id).length})
                        </TabsTrigger>
                        <TabsTrigger value="rates" className="text-xs">
                          Rates ({unifiedRates.filter(r => r.item_id === selectedItem.id).length})
                        </TabsTrigger>
                        <TabsTrigger value="allocations" className="text-xs">
                          Allocations ({getItemAllocations(selectedItem.id).length})
                        </TabsTrigger>
                        <TabsTrigger value="pools" className="text-xs">
                          Pools ({getItemPools(selectedItem.id).length})
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto p-3">
                    <TabsContent value="contracts" className="mt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">Contracts</h4>
                          <Button 
                            size="sm" 
                            onClick={() => handleOpenContractDialog(selectedItem)}
                            className="h-7 px-3 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        
                        {unifiedContracts.filter(c => c.item_id === selectedItem.id).length > 0 ? (
                          <div className="border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-12 gap-2 p-2 bg-muted/50 text-xs font-medium border-b">
                              <div className="col-span-3">Contract Name</div>
                              <div className="col-span-2">Supplier</div>
                              <div className="col-span-3">Valid Period</div>
                              <div className="col-span-4 text-right">Actions</div>
                            </div>
                            {unifiedContracts.filter(c => c.item_id === selectedItem.id).map(contract => (
                              <div key={contract.id} className="grid grid-cols-12 gap-2 p-2 border-b last:border-b-0 hover:bg-muted/20">
                                <div className="col-span-3 flex items-center gap-2">
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm truncate">{contract.contract_name}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-sm">{contract.supplierName}</span>
                                </div>
                                <div className="col-span-3 text-xs text-muted-foreground">
                                  {contract.valid_from} to {contract.valid_to}
                                </div>
                                <div className="col-span-4 flex items-center justify-end gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => handleOpenContractDialog(selectedItem, contract)} className="h-6 w-6 p-0">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteContract(contract)} className="h-6 w-6 p-0 text-red-600 hover:text-red-700">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            No contracts yet. Add your first contract to get started.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="rates" className="mt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">Rates</h4>
                          <Button 
                            size="sm" 
                            onClick={() => handleOpenRateDialog(selectedItem)}
                            className="h-7 px-3 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        
                         {unifiedRates.filter(r => r.item_id === selectedItem.id).length > 0 ? (
                           <div className="border rounded-lg overflow-hidden">
                             <div className="overflow-x-auto">
                               <table className="w-full text-sm">
                                 <thead className="bg-muted">
                                   <tr>
                                     <th className="text-left p-2 font-semibold text-xs uppercase tracking-wide">
                                       Category
                                     </th>
                                     <th className="text-left p-2 font-semibold text-xs uppercase tracking-wide">
                                       Source
                                     </th>
                                     {selectedItem.item_type === 'hotel' && (
                                       <>
                                         <th className="text-center p-2 font-semibold text-xs uppercase tracking-wide">
                                           Occupancy
                                         </th>
                                         <th className="text-center p-2 font-semibold text-xs uppercase tracking-wide">
                                           Board
                                         </th>
                                       </>
                                     )}
                                     {selectedItem.item_type === 'transfer' && (
                                       <th className="text-center p-2 font-semibold text-xs uppercase tracking-wide">
                                         Direction
                                       </th>
                                     )}
                                     <th className="text-left p-2 font-semibold text-xs uppercase tracking-wide">
                                       Pool
                                     </th>
                                     <th className="text-left p-2 font-semibold text-xs uppercase tracking-wide">
                                       Valid Dates
                                     </th>
                                     <th className="text-left p-2 font-semibold text-xs uppercase tracking-wide">
                                       Valid Days
                                     </th>
                                     <th className="text-right p-2 font-semibold text-xs uppercase tracking-wide">
                                       Base Price
                                     </th>
                                     <th className="text-right p-2 font-semibold text-xs uppercase tracking-wide">
                                       Markup
                                     </th>
                                     <th className="text-right p-2 font-semibold text-xs uppercase tracking-wide">
                                       Selling Price
                                     </th>
                                     <th className="text-center p-2 font-semibold text-xs uppercase tracking-wide">
                                       Status
                                     </th>
                                     <th className="text-center p-2 font-semibold text-xs uppercase tracking-wide">
                                       Actions
                                     </th>
                                   </tr>
                                 </thead>
                                 <tbody>
                                   {unifiedRates.filter(r => r.item_id === selectedItem.id).map((rate) => (
                                     <tr
                                       key={rate.id}
                                       className={`${rate.active ? 'hover:bg-muted/30' : 'opacity-50'} transition-colors`}
                                       
                                     >
                                       <td className="p-2">
                                         <div className="font-medium text-xs">{rate.categoryName || 'Unknown'}</div>
                                       </td>
                                       
                                       <td className="p-2">
                                         <Badge variant={rate.inventory_type === 'contract' ? 'default' : 'secondary'} className="text-xs">
                                           {rate.inventory_type === 'contract' ? 
                                             `${rate.contractName || 'Unknown Contract'} - ${(() => {
                                               const contract = unifiedContracts.find(c => c.id === rate.contract_id)
                                               return contract?.supplierName || 'Unknown Supplier'
                                             })()}` : 
                                             'Buy-to-Order'
                                           }
                                         </Badge>
                                       </td>
                                       
                                       {/* Hotel-specific columns */}
                                       {selectedItem.item_type === 'hotel' && (
                                         <>
                                           <td className="p-2 text-center">
                                             {rate.rate_details?.occupancy_type ? (
                                               <Badge variant="outline" className="text-xs">
                                                 {rate.rate_details.occupancy_type}
                                               </Badge>
                                             ) : (
                                               <span className="text-xs text-muted-foreground">-</span>
                                             )}
                                           </td>
                                           <td className="p-2 text-center">
                                             {rate.rate_details?.board_type ? (
                                               <span className="text-xs">{rate.rate_details.board_type}</span>
                                             ) : (
                                               <span className="text-xs text-muted-foreground">-</span>
                                             )}
                                           </td>
                                         </>
                                       )}
                                       
                                       {/* Transfer-specific columns */}
                                       {selectedItem.item_type === 'transfer' && (
                                         <td className="p-2 text-center">
                                           {rate.rate_details?.direction ? (
                                             <Badge variant="outline" className="text-xs">
                                               {rate.rate_details.direction}
                                             </Badge>
                                           ) : (
                                             <span className="text-xs text-muted-foreground">-</span>
                                           )}
                                         </td>
                                       )}
                                       
                                       <td className="p-2">
                                         {rate.allocation_pool_id ? (
                                           <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                             <Package className="h-3 w-3 mr-1" />
                                             {rate.allocation_pool_id}
                                           </Badge>
                                         ) : (
                                           <span className="text-xs text-muted-foreground">-</span>
                                         )}
                                       </td>
                                       
                                       <td className="p-2">
                                         {rate.valid_from && rate.valid_to ? (
                                           <div className="text-xs">
                                             <div>{new Date(rate.valid_from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                                             <div className="text-muted-foreground">
                                               to {new Date(rate.valid_to).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                             </div>
                                           </div>
                                         ) : (
                                           <span className="text-xs text-muted-foreground">-</span>
                                         )}
                                       </td>
                                       
                                       <td className="p-2">
                                         <span className="text-xs text-muted-foreground">
                                           {rate.days_of_week ? Object.values(rate.days_of_week).filter(Boolean).length : 0} days
                                         </span>
                                       </td>
                                       
                                       <td className="p-2 text-right font-mono text-xs text-muted-foreground">
                                         {rate.base_rate.toFixed(2)} {rate.currency}
                                       </td>
                                       
                                       <td className="p-2 text-right">
                                         {rate.markup_percentage ? (
                                           <div className="font-medium text-xs text-primary">
                                             {((rate.markup_percentage) * 100).toFixed(0)}%
                                           </div>
                                         ) : (
                                           <span className="text-xs text-muted-foreground">-</span>
                                         )}
                                       </td>
                                       
                                       <td className="p-2 text-right font-semibold text-xs">
                                         {rate.selling_price.toFixed(2)} {rate.currency}
                                       </td>
                                       
                                       <td className="p-2 text-center">
                                         {rate.active ? (
                                           <Badge className="text-xs bg-green-500 text-white">
                                             Active
                                           </Badge>
                                         ) : (
                                           <Badge variant="secondary" className="text-xs">
                                             Inactive
                                           </Badge>
                                         )}
                                       </td>
                                       
                                       <td className="p-2">
                                         <div className="flex justify-center gap-1">
                                           <Button
                                             size="sm"
                                             variant="ghost"
                                             onClick={() => handleOpenRateDialog(selectedItem, rate)}
                                             className="h-5 w-5 p-0"
                                             title="Edit rate"
                                           >
                                             <Edit className="h-3 w-3" />
                                           </Button>
                                           <Button
                                             size="sm"
                                             variant="ghost"
                                             onClick={() => handleDeleteRate(rate)}
                                             className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                                             title="Delete rate"
                                           >
                                             <Trash2 className="h-3 w-3" />
                                           </Button>
                                         </div>
                                       </td>
                                     </tr>
                                   ))}
                                 </tbody>
                               </table>
                             </div>
                           </div>
                        ) : (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            No rates yet. Add your first rate to get started.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="allocations" className="mt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">Allocations</h4>
                          <Button 
                            size="sm" 
                            onClick={() => handleCreateAllocation(selectedItem)}
                            className="h-7 px-3 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        
                        {getItemAllocations(selectedItem.id).length > 0 ? (
                          <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-muted">
                                  <tr>
                                    <th className="text-left p-2 font-semibold text-xs uppercase tracking-wide">Label</th>
                                    <th className="text-left p-2 font-semibold text-xs uppercase tracking-wide">Supplier</th>
                                    <th className="text-center p-2 font-semibold text-xs uppercase tracking-wide">Quantity</th>
                                    <th className="text-left p-2 font-semibold text-xs uppercase tracking-wide">Categories</th>
                                    <th className="text-left p-2 font-semibold text-xs uppercase tracking-wide">Pool</th>
                                    <th className="text-left p-2 font-semibold text-xs uppercase tracking-wide">Valid Period</th>
                                    <th className="text-center p-2 font-semibold text-xs uppercase tracking-wide">Status</th>
                                    <th className="text-center p-2 font-semibold text-xs uppercase tracking-wide">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {getItemAllocations(selectedItem.id).map((allocation) => {
                                    const supplier = suppliers.find(s => s.id === allocation.supplier_id)
                                    const pool = allocationPoolCapacity.find(p => p.pool_id === allocation.allocation_pool_id)
                                    const today = new Date()
                                    const validFrom = allocation.valid_from ? new Date(allocation.valid_from) : null
                                    const validTo = allocation.valid_to ? new Date(allocation.valid_to) : null
                                    
                                    const isActive = allocation.active && 
                                      (!validFrom || validFrom <= today) && 
                                      (!validTo || validTo >= today)
                                    
                                    return (
                                      <tr
                                        key={allocation.id}
                                        className={`${isActive ? 'hover:bg-muted/30' : 'opacity-50'} transition-colors`}
                                      >
                                        <td className="p-2">
                                          <div className="flex items-center gap-2">
                                            <Package className="h-3 w-3 text-muted-foreground" />
                                            <div>
                                              <div className="font-medium text-xs">{allocation.label}</div>
                                              {allocation.description && (
                                                <div className="text-xs text-muted-foreground truncate max-w-32">
                                                  {allocation.description}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        
                                        <td className="p-2">
                                          <div className="text-xs">
                                            {supplier ? supplier.name : 'Unknown Supplier'}
                                          </div>
                                        </td>
                                        
                                        <td className="p-2 text-center">
                                          <Badge variant="outline" className="text-xs">
                                            {allocation.quantity} units
                                          </Badge>
                                        </td>
                                        
                                        <td className="p-2">
                                          <div className="flex flex-wrap gap-1">
                                            {allocation.category_ids.map(categoryId => {
                                              const category = selectedItem.categories.find(c => c.id === categoryId)
                                              return category ? (
                                                <Badge key={categoryId} variant="secondary" className="text-xs">
                                                  {category.category_name}
                                                </Badge>
                                              ) : null
                                            })}
                                          </div>
                                        </td>
                                        
                                        <td className="p-2">
                                          <div className="flex items-center gap-1">
                                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                              <Package className="h-3 w-3 mr-1" />
                                              {allocation.allocation_pool_id}
                                            </Badge>
                                            {pool && (
                                              <span className="text-xs text-muted-foreground">
                                                ({pool.available_spots}/{pool.total_capacity})
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        
                                        <td className="p-2">
                                          <div className="text-xs">
                                            <div>{new Date(allocation.valid_from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                                            <div className="text-muted-foreground">
                                              to {new Date(allocation.valid_to).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                          </div>
                                        </td>
                                        
                                        <td className="p-2 text-center">
                                          {isActive ? (
                                            <Badge className="text-xs bg-green-500 text-white">
                                              Active
                                            </Badge>
                                          ) : (
                                            <div className="space-y-1">
                                              <Badge variant="secondary" className="text-xs">
                                                Inactive
                                              </Badge>
                                              <div className="text-xs text-muted-foreground">
                                                {!allocation.active ? 'Disabled' :
                                                 validFrom && validFrom > today ? 'Future' :
                                                 validTo && validTo < today ? 'Expired' : 'Invalid dates'}
                                              </div>
                                            </div>
                                          )}
                                        </td>
                                        
                                        <td className="p-2">
                                          <div className="flex justify-center gap-1">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleEditAllocation(allocation)}
                                              className="h-5 w-5 p-0"
                                              title="Edit allocation"
                                            >
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleDeleteAllocation(allocation)}
                                              className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                                              title="Delete allocation"
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
                          </div>
                        ) : (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            No allocations yet. Add your first allocation to get started.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="pools" className="mt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">Pools</h4>
                          <Badge variant="outline" className="text-xs">
                            {getItemPools(selectedItem.id).length} pools
                          </Badge>
                        </div>
                        
                        {getItemPools(selectedItem.id).length > 0 ? (
                          <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-muted">
                                  <tr>
                                    <th className="text-left p-2 font-semibold text-xs uppercase tracking-wide">Pool ID</th>
                                    <th className="text-center p-2 font-semibold text-xs uppercase tracking-wide">Total Capacity</th>
                                    <th className="text-center p-2 font-semibold text-xs uppercase tracking-wide">Available</th>
                                    <th className="text-center p-2 font-semibold text-xs uppercase tracking-wide">Booked</th>
                                    <th className="text-center p-2 font-semibold text-xs uppercase tracking-wide">Utilization</th>
                                    <th className="text-center p-2 font-semibold text-xs uppercase tracking-wide">Status</th>
                                    <th className="text-left p-2 font-semibold text-xs uppercase tracking-wide">Rates Using</th>
                                    <th className="text-center p-2 font-semibold text-xs uppercase tracking-wide">Manage</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {getItemPools(selectedItem.id).map((pool) => {
                                    const utilization = pool.total_capacity > 0 ? ((pool.total_capacity - pool.available_spots) / pool.total_capacity) * 100 : 0
                                    const booked = pool.total_capacity - pool.available_spots
                                    const ratesUsingPool = unifiedRates.filter(r => r.item_id === selectedItem.id && r.allocation_pool_id === pool.pool_id)
                                    
                                    return (
                                      <tr
                                        key={pool.pool_id}
                                        className="hover:bg-muted/30 transition-colors"
                                      >
                                        <td className="p-2">
                                          <div className="flex items-center gap-2">
                                            <Package className="h-3 w-3 text-muted-foreground" />
                                            <div>
                                              <div className="font-medium text-xs">{pool.pool_id}</div>
                                              <div className="text-xs text-muted-foreground">
                                                {pool.item_name || selectedItem.name}
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        
                                        <td className="p-2 text-center">
                                          <span className="text-sm font-medium">{pool.total_capacity}</span>
                                        </td>
                                        
                                        <td className="p-2 text-center">
                                          <Badge 
                                            variant={pool.available_spots > 10 ? 'default' : pool.available_spots > 0 ? 'secondary' : 'destructive'}
                                            className="text-xs"
                                          >
                                            {pool.available_spots}
                                          </Badge>
                                        </td>
                                        
                                        <td className="p-2 text-center">
                                          <span className="text-sm text-muted-foreground">{booked}</span>
                                        </td>
                                        
                                        <td className="p-2">
                                          <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-muted rounded-full h-2">
                                              <div 
                                                className={`h-2 rounded-full transition-all ${
                                                  utilization < 70 ? 'bg-green-500' : 
                                                  utilization < 90 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                                style={{ width: `${Math.min(utilization, 100)}%` }}
                                              />
                                            </div>
                                            <span className="text-xs text-muted-foreground font-medium min-w-8">
                                              {utilization.toFixed(0)}%
                                            </span>
                                          </div>
                                        </td>
                                        
                                        <td className="p-2 text-center">
                                          <Badge 
                                            variant={pool.status === 'healthy' ? 'default' : pool.status === 'warning' ? 'secondary' : 'destructive'} 
                                            className="text-xs"
                                          >
                                            {pool.status === 'healthy' ? '✓ Healthy' : 
                                             pool.status === 'warning' ? '⚠ Warning' : '✗ Critical'}
                                          </Badge>
                                        </td>
                                        
                                        <td className="p-2">
                                          <div className="flex flex-wrap gap-1">
                                            {ratesUsingPool.slice(0, 2).map(rate => (
                                              <Badge key={rate.id} variant="outline" className="text-xs">
                                                {rate.categoryName}
                                              </Badge>
                                            ))}
                                            {ratesUsingPool.length > 2 && (
                                              <Badge variant="outline" className="text-xs">
                                                +{ratesUsingPool.length - 2} more
                                              </Badge>
                                            )}
                                            {ratesUsingPool.length === 0 && (
                                              <span className="text-xs text-muted-foreground">No rates</span>
                                            )}
                                          </div>
                                        </td>
                                        
                                        <td className="p-2 text-center">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleOpenPoolManagement(pool)}
                                            className="h-7 px-2 text-xs"
                                          >
                                            Manage
                                          </Button>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="mb-2">No pools yet</p>
                            <p className="text-xs">Create allocations to automatically generate pools</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select an inventory item</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose an item from the left panel to view contracts, rates, and allocations
                </p>
                <Button onClick={() => handleOpenItemDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {isItemDialogOpen && (
        <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Inventory Item' : 'Create Inventory Item'}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update inventory item details' : 'Create a new inventory item'}
              </DialogDescription>
            </DialogHeader>
            <UnifiedItemForm
              item={editingItem}
              onSave={handleSaveItem}
              onCancel={() => {
                setIsItemDialogOpen(false)
                setEditingItem(undefined)
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {isContractDialogOpen && selectedItemForContract && (
        <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContract ? 'Edit Contract' : 'Create Contract'}
              </DialogTitle>
              <DialogDescription>
                {editingContract ? 'Update contract details' : `Create contract for ${selectedItemForContract.name}`}
              </DialogDescription>
            </DialogHeader>
            <CoreContractForm
              contract={editingContract ? {
                id: editingContract.id.toString(),
                supplier_id: editingContract.supplier_id.toString(),
                contract_name: editingContract.contract_name,
                currency: editingContract.currency,
                valid_from: editingContract.valid_from,
                valid_to: editingContract.valid_to,
                priority: 1,
                timezone: 'UTC',
                terms: '',
                plugin_meta: {
                  days_of_week: editingContract.days_of_week,
                  total_rooms: editingContract.hotel_meta?.total_rooms || 0,
                  base_rate: editingContract.hotel_meta?.base_rate || 0,
                  tax_rate: editingContract.tax_rate || 0,
                  city_tax_per_person_per_night: editingContract.hotel_costs?.city_tax_per_person_per_night || 0,
                  resort_fee_per_night: editingContract.hotel_costs?.resort_fee_per_night || 0,
                  supplier_commission_rate: editingContract.hotel_costs?.supplier_commission_rate || 0,
                  min_nights: editingContract.min_nights || 1,
                  max_nights: editingContract.max_nights || 30,
                  contracted_payment_total: editingContract.contracted_payment_total || 0,
                  notes: editingContract.hotel_meta?.notes || '',
                  // Hotel-specific complex fields
                  pricing_strategy: editingContract.pricing_strategy || 'per_occupancy',
                  occupancy_rates: editingContract.hotel_meta?.occupancy_rates || [],
                  markup_percentage: editingContract.markup_percentage || 0.6,
                  board_options: editingContract.hotel_costs?.board_options || [],
                  attrition_stages: editingContract.attrition_stages || [],
                  cancellation_stages: editingContract.cancellation_stages || [],
                  payment_schedule: editingContract.payment_schedule || [],
                  room_allocations: editingContract.hotel_meta?.room_allocations || []
                },
                active: editingContract.active,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } : undefined}
              suppliers={suppliers.map(s => ({
                id: s.id.toString(),
                name: s.name,
                contact_email: '',
                contact_phone: '',
                address: '',
                active: s.active,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }))}
              resources={[]}
              onSave={handleSaveCoreContract}
              onCancel={() => {
                setIsContractDialogOpen(false)
                setEditingContract(undefined)
                setSelectedItemForContract(undefined)
              }}
              plugin={getPlugin(getPluginForItemType(selectedItemForContract.item_type) as any)}
            />
          </DialogContent>
        </Dialog>
      )}

      {isRateDialogOpen && selectedItemForRate && (
        <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRate ? 'Edit Rate' : 'Create Rate'}
              </DialogTitle>
              <DialogDescription>
                {editingRate ? 'Update rate details' : `Create rate for ${selectedItemForRate.name}`}
              </DialogDescription>
            </DialogHeader>
            <CoreRateForm
              rate={editingRate ? {
                rate_name: editingRate.categoryName || '',
                category_id: editingRate.category_id || '',
                contract_id: editingRate.contract_id?.toString() || '',
                inventory_type: editingRate.inventory_type || 'buy_to_order',
                base_rate: editingRate.base_rate || 0,
                currency: editingRate.currency || 'GBP',
                valid_from: editingRate.valid_from || '',
                valid_to: editingRate.valid_to || '',
                days_of_week: editingRate.days_of_week || { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
                active: editingRate.active !== false,
                plugin_meta: {
                  occupancy_type: editingRate.rate_details?.occupancy_type || 'double',
                  board_type: editingRate.rate_details?.board_type || 'bed_breakfast',
                  board_cost: editingRate.rate_details?.board_cost || 0,
                  allocation_pool_id: editingRate.allocation_pool_id || '',
                  contract_linked: editingRate.inventory_type === 'contract'
                }
              } : undefined}
              contracts={unifiedContracts.filter(c => c.item_id === selectedItemForRate.id)}
              onSave={handleSaveRate}
              onCancel={() => {
                setIsRateDialogOpen(false)
                setEditingRate(undefined)
                setSelectedItemForRate(undefined)
              }}
              plugin={getPlugin(getPluginForItemType(selectedItemForRate.item_type) as any)}
              selectedItem={selectedItemForRate}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Allocation Form Dialog */}
      {selectedItemForAllocationCreate && (
        <Dialog open={isAllocationCreateDialogOpen} onOpenChange={setIsAllocationCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAllocation ? 'Edit Allocation' : 'Create Allocation'}
              </DialogTitle>
              <DialogDescription>
                {editingAllocation ? 'Update allocation details' : `Create new allocation for ${selectedItemForAllocationCreate.name}`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Label *</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded text-sm"
                    placeholder="e.g., Main Block, Weekend Package"
                    defaultValue={editingAllocation?.label || ''}
                    id="allocation-label"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Quantity *</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border rounded text-sm"
                    placeholder="Number of units"
                    defaultValue={editingAllocation?.quantity || ''}
                    id="allocation-quantity"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Categories *</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {selectedItemForAllocationCreate.categories.map(category => (
                    <label key={category.id} className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        className="rounded"
                        defaultChecked={editingAllocation?.category_ids.includes(category.id) || false}
                        data-category-id={category.id}
                      />
                      {category.category_name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Supplier *</label>
                  <select className="w-full p-2 border rounded text-sm" id="allocation-supplier">
                    <option value="">Select supplier</option>
                    {suppliers.map(supplier => (
                      <option 
                        key={supplier.id} 
                        value={supplier.id}
                        selected={editingAllocation?.supplier_id === supplier.id}
                      >
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Pool ID *</label>
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded text-sm"
                      placeholder="e.g., summer-main-pool"
                      defaultValue={editingAllocation?.allocation_pool_id || ''}
                      id="allocation-pool-id"
                    />
                    <div className="text-xs text-muted-foreground">
                      💡 Tip: Use descriptive names like "{selectedItemForAllocationCreate.name.toLowerCase().replace(/\s+/g, '-')}-main-pool"
                    </div>
                    {/* Show existing pools for this item */}
                    {getItemPools(selectedItemForAllocationCreate.id).length > 0 && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Existing pools:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {getItemPools(selectedItemForAllocationCreate.id).map(pool => (
                            <button
                              key={pool.pool_id}
                              type="button"
                              className="px-2 py-1 bg-muted hover:bg-muted/80 rounded text-xs transition-colors"
                              onClick={() => {
                                const input = document.getElementById('allocation-pool-id') as HTMLInputElement
                                if (input) input.value = pool.pool_id
                              }}
                            >
                              {pool.pool_id}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Valid From *</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded text-sm"
                    defaultValue={editingAllocation?.valid_from || new Date().toISOString().split('T')[0]}
                    id="allocation-valid-from"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    💡 Defaults to today
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Valid To *</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded text-sm"
                    defaultValue={editingAllocation?.valid_to || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    id="allocation-valid-to"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    💡 Defaults to 1 year from today
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  className="w-full p-2 border rounded text-sm"
                  placeholder="Optional description"
                  defaultValue={editingAllocation?.description || ''}
                  id="allocation-description"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAllocationCreateDialogOpen(false)
                    setEditingAllocation(undefined)
                    setSelectedItemForAllocationCreate(undefined)
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    // Get form values
                    const label = (document.getElementById('allocation-label') as HTMLInputElement)?.value
                    const quantity = parseInt((document.getElementById('allocation-quantity') as HTMLInputElement)?.value || '0')
                    const supplierId = parseInt((document.getElementById('allocation-supplier') as HTMLSelectElement)?.value || '0')
                    const poolId = (document.getElementById('allocation-pool-id') as HTMLInputElement)?.value
                    const validFrom = (document.getElementById('allocation-valid-from') as HTMLInputElement)?.value
                    const validTo = (document.getElementById('allocation-valid-to') as HTMLInputElement)?.value
                    const description = (document.getElementById('allocation-description') as HTMLTextAreaElement)?.value

                    // Get selected categories
                    const categoryCheckboxes = document.querySelectorAll('input[data-category-id]:checked')
                    const categoryIds = Array.from(categoryCheckboxes).map(cb => (cb as HTMLInputElement).dataset.categoryId || '')

                    // Validation
                    if (!label || !quantity || !supplierId || !poolId || !validFrom || !validTo || categoryIds.length === 0) {
                      toast.error('Please fill in all required fields')
                      return
                    }

                    const allocationData = {
                      item_id: selectedItemForAllocationCreate.id,
                      item_type: selectedItemForAllocationCreate.item_type,
                      supplier_id: supplierId,
                      category_ids: categoryIds,
                      quantity,
                      allocation_pool_id: poolId,
                      label,
                      description,
                      valid_from: validFrom,
                      valid_to: validTo,
                      active: true
                    }

                    handleSaveAllocation(allocationData)
                  }}
                >
                  {editingAllocation ? 'Update' : 'Create'} Allocation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Pool Management Dialog */}
      {isPoolManagementDialogOpen && selectedPoolForManagement && (
        <Dialog open={isPoolManagementDialogOpen} onOpenChange={setIsPoolManagementDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Pool: {selectedPoolForManagement.pool_id}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Pool Overview */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Total Capacity</div>
                  <div className="text-lg font-semibold">{selectedPoolForManagement.total_capacity}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Available Spots</div>
                  <div className="text-lg font-semibold">{selectedPoolForManagement.available_spots}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Current Bookings</div>
                  <div className="text-lg font-semibold">{selectedPoolForManagement.current_bookings}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Utilization</div>
                  <div className="text-lg font-semibold">
                    {selectedPoolForManagement.total_capacity > 0 
                      ? (((selectedPoolForManagement.total_capacity - selectedPoolForManagement.available_spots) / selectedPoolForManagement.total_capacity) * 100).toFixed(0)
                      : 0}%
                  </div>
                </div>
              </div>

              {/* Pool Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pool Settings</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Pool Status</label>
                    <Select 
                      defaultValue={selectedPoolForManagement.status}
                      onValueChange={(value) => handleUpdatePoolSettings({ status: value as any })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="healthy">✓ Healthy</SelectItem>
                        <SelectItem value="warning">⚠ Warning</SelectItem>
                        <SelectItem value="critical">✗ Critical</SelectItem>
                        <SelectItem value="overbooked">📈 Overbooked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Allows Overbooking</label>
                    <Select 
                      defaultValue={selectedPoolForManagement.allows_overbooking ? 'true' : 'false'}
                      onValueChange={(value) => handleUpdatePoolSettings({ allows_overbooking: value === 'true' })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Waitlist Enabled</label>
                    <Select 
                      defaultValue={selectedPoolForManagement.waitlist_enabled ? 'true' : 'false'}
                      onValueChange={(value) => handleUpdatePoolSettings({ waitlist_enabled: value === 'true' })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Capacity Adjustment */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Capacity Adjustment</h3>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800 mb-2">
                    ⚠️ Use this to correct inventory discrepancies or handle physical inventory changes
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Available Spots:</label>
                    <Input
                      type="number"
                      defaultValue={selectedPoolForManagement.available_spots}
                      min="0"
                      max={selectedPoolForManagement.total_capacity}
                      className="w-20"
                      id="pool-available-spots"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => {
                        const newSpots = parseInt((document.getElementById('pool-available-spots') as HTMLInputElement)?.value || '0')
                        handleAdjustPoolCapacity(newSpots)
                      }}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </div>

              {/* Connected Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Connected Items</h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Allocations</div>
                    <div className="space-y-1">
                      {allocations
                        .filter(a => a.allocation_pool_id === selectedPoolForManagement.pool_id)
                        .map(allocation => (
                          <div key={allocation.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <div>
                              <div className="text-sm font-medium">{allocation.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {allocation.quantity} units • {allocation.valid_from} to {allocation.valid_to}
                              </div>
                            </div>
                            <Badge variant={allocation.active ? 'default' : 'secondary'} className="text-xs">
                              {allocation.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Rates Using This Pool</div>
                    <div className="space-y-1">
                      {unifiedRates
                        .filter(r => r.allocation_pool_id === selectedPoolForManagement.pool_id)
                        .map(rate => (
                          <div key={rate.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <div>
                              <div className="text-sm font-medium">{rate.categoryName}</div>
                              <div className="text-xs text-muted-foreground">
                                {rate.inventory_type === 'contract' ? 'Contract' : 'Buy-to-Order'} • 
                                £{rate.selling_price?.toFixed(2) || 'N/A'}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {rate.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPoolManagementDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}
