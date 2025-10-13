/**
 * UNIFIED INVENTORY PAGE
 * Enterprise-level inventory management for ALL types
 * Handles: Hotels, Tickets, Transfers, Activities, Meals, Venues, Transport, Experiences, Other
 */

import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Calendar, FileText, DollarSign, Package, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useData } from '@/contexts/data-context'
import type { InventoryItem, UnifiedContract, UnifiedRate, Allocation, InventoryItemType } from '@/types/unified-inventory'
import { ITEM_TYPE_LABELS, ITEM_TYPE_ICONS } from '@/types/unified-inventory'

// Import shared components
import {
  StatsGrid,
  FilterBar,
  ItemHeader,
  ContractCard,
  UnifiedRatesTable,
} from '@/components/unified-inventory/shared'

// Import allocation widgets
import { AllocationPoolWidget } from '@/components/allocation'
import { PoolCreationDialog } from '@/components/pool-capacity'
// Remove compact import - we'll add pools inline


// Import forms
import {
  UnifiedItemForm,
  UnifiedContractForm,
  UnifiedRateFormEnhanced
} from '@/components/unified-inventory/forms'

export function UnifiedInventory() {
  const {
    inventoryItems,
    unifiedContracts,
    unifiedRates,
    allocations,
    suppliers,
    tours,
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
    addAllocationPoolCapacity
    // deleteAllocationPoolCapacity
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
  const [selectedContractForRate, setSelectedContractForRate] = useState<UnifiedContract | undefined>()
  
  // Pool management states
  const [isPoolCreateDialogOpen, setIsPoolCreateDialogOpen] = useState(false)
  // const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false)
  // const [selectedItemForAllocation, setSelectedItemForAllocation] = useState<InventoryItem | undefined>()
  // const [selectedPoolForAllocation, setSelectedPoolForAllocation] = useState<any>(undefined)
  
  // Allocation management states
  const [isAllocationCreateDialogOpen, setIsAllocationCreateDialogOpen] = useState(false)
  const [editingAllocation, setEditingAllocation] = useState<Allocation | undefined>()
  const [selectedItemForAllocationCreate, setSelectedItemForAllocationCreate] = useState<InventoryItem | undefined>()
  
  // Selected item for right panel (unused in old version)
  // const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>()

  // Filters
  const [filterItemType, setFilterItemType] = useState<string>('all')
  const [filterTour, setFilterTour] = useState<string>('all')
  const [filterSupplier, setFilterSupplier] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
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

  const filteredContracts = useMemo(() => {
    return unifiedContracts.filter(contract => {
      const matchesSupplier = filterSupplier === 'all' || contract.supplier_id.toString() === filterSupplier
      const matchesTour = filterTour === 'all' || contract.tour_ids?.includes(parseInt(filterTour))
      const matchesType = filterItemType === 'all' || contract.item_type === filterItemType
      const matchesSearch = !searchTerm ||
        contract.contract_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSupplier && matchesTour && matchesType && matchesSearch
    })
  }, [unifiedContracts, filterSupplier, filterTour, filterItemType, searchTerm])

  const filteredRates = useMemo(() => {
    return unifiedRates.filter(rate => {
      const matchesTour = filterTour === 'all' || rate.tour_id?.toString() === filterTour
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && rate.active) ||
        (filterStatus === 'inactive' && !rate.active)
      const matchesType = filterItemType === 'all' || rate.item_type === filterItemType
      const matchesSearch = !searchTerm ||
        rate.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rate.itemName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesTour && matchesStatus && matchesType && matchesSearch
    })
  }, [unifiedRates, filterTour, filterStatus, filterItemType, searchTerm])

  // Stats
  const stats = useMemo(() => {
    const itemBreakdown: Record<string, number> = {}
    inventoryItems.forEach(item => {
      itemBreakdown[item.item_type] = (itemBreakdown[item.item_type] || 0) + 1
    })

    return {
      totalItems: inventoryItems.length,
      totalContracts: unifiedContracts.length,
      totalRates: unifiedRates.length,
      activeRates: unifiedRates.filter(r => r.active).length,
      itemBreakdown
    }
  }, [inventoryItems, unifiedContracts, unifiedRates])
  
  // Compute which accordion sections should be open by default
  useMemo(() => {
    const sections: string[] = []
    
    // Always open generic if it has items/contracts/rates
    const hasGenericData = filteredItems.length > 0 || 
      filteredContracts.some(c => !c.tour_ids || c.tour_ids.length === 0) ||
      filteredRates.some(r => {
        const contract = unifiedContracts.find(c => c.id === r.contract_id)
        return !contract?.tour_ids || contract.tour_ids.length === 0
      })
    
    if (hasGenericData) {
      sections.push('generic')
    }
    
    // Open tour sections that have contracts or rates
    tours.forEach(tour => {
      const hasTourData = filteredContracts.some(c => c.tour_ids?.includes(tour.id)) ||
        filteredRates.some(r => r.tour_id === tour.id)
      if (hasTourData) {
        sections.push(`tour-${tour.id}`)
      }
    })
    
    return sections
  }, [filteredItems, filteredContracts, filteredRates, tours, unifiedContracts])

  // Helper functions for allocations
  const getItemAllocations = (itemId: number): Allocation[] => {
    return allocations.filter(a => a.item_id === itemId)
  }

  const getItemPools = (itemId: number) => {
    return allocationPoolCapacity.filter(p => p.item_id === itemId)
  }

  const getPoolAllocations = (poolId: string): Allocation[] => {
    return allocations.filter(a => a.allocation_pool_id === poolId)
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
      if (contractData.tour_ids && contractData.tour_ids.length > 0) {
        const tourNames = contractData.tour_ids.map(id => tours.find(t => t.id === id)?.name).filter(Boolean).join(', ')
        toast.success(`✅ Contract created! Look in: ${tourNames}`, { duration: 5000 })
      } else {
        toast.success('✅ Contract created! Look in: Generic Inventory section', { duration: 5000 })
      }
    }
    setIsContractDialogOpen(false)
    setEditingContract(undefined)
    setSelectedItemForContract(undefined)
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

  const handleCloneContract = (contract: UnifiedContract) => {
    const item = inventoryItems.find(i => i.id === contract.item_id)
    if (!item) return
    
    setSelectedItemForContract(item)
    setEditingContract(undefined)
    setIsContractDialogOpen(true)
    
    // Pre-fill with cloned data (will be handled by form component)
    toast.info('Review and update dates before saving', { duration: 5000 })
  }

  // Handlers - Rate
  const handleOpenRateDialog = (item: InventoryItem, rate?: UnifiedRate, contract?: UnifiedContract) => {
    setSelectedItemForRate(item)
    setSelectedContractForRate(contract)
    setEditingRate(rate)
    setIsRateDialogOpen(true)
  }


  const handleSaveRate = (rateData: any) => {
    if (editingRate) {
      updateUnifiedRate(editingRate.id, rateData)
      toast.success('Rate updated!')
    } else {
      addUnifiedRate(rateData)
      toast.success('Rate created!')
    }
    setIsRateDialogOpen(false)
    setEditingRate(undefined)
    setSelectedItemForRate(undefined)
    setSelectedContractForRate(undefined)
  }

  const handleDeleteRate = (rate: UnifiedRate) => {
    if (confirm(`Delete rate for "${rate.categoryName}"?`)) {
      deleteUnifiedRate(rate.id)
      toast.success('Rate deleted')
    }
  }

  const handleCloneRate = (rate: UnifiedRate) => {
    const item = inventoryItems.find(i => i.id === rate.item_id)
    const contract = rate.contract_id ? unifiedContracts.find(c => c.id === rate.contract_id) : undefined
    
    if (!item) return
    
    setSelectedItemForRate(item)
    setSelectedContractForRate(contract)
    setEditingRate(undefined)  // Not editing, creating new
    setIsRateDialogOpen(true)
    
    toast.info('Enter base rate and dates for the cloned rate', { duration: 3000 })
  }

  // Handlers - Pool Management
  const handleCreatePool = (poolData: any) => {
    addAllocationPoolCapacity(poolData)
    setIsPoolCreateDialogOpen(false)
    toast.success('Pool created!')
  }

  // const handleDeletePool = (poolId: string) => {
  //   // Check if pool has bookings
  //   const pool = allocationPoolCapacity.find(p => p.pool_id === poolId)
  //   if (pool && pool.current_bookings > 0) {
  //     toast.error(`Cannot delete pool "${poolId}" - it has ${pool.current_bookings} bookings`)
  //     return
  //   }
  //   
  //   // Check if pool is referenced by any rates
  //   const ratesUsingPool = unifiedRates.filter(r => r.allocation_pool_id === poolId)
  //   if (ratesUsingPool.length > 0) {
  //     toast.error(`Cannot delete pool "${poolId}" - it's used by ${ratesUsingPool.length} rates`)
  //     return
  //   }
  //   
  //   if (confirm(`Delete pool "${poolId}"? This action cannot be undone.`)) {
  //     deleteAllocationPoolCapacity(poolId)
  //     toast.success(`Pool "${poolId}" deleted`)
  //   }
  // }

  // const handleOpenAllocationDialog = (item: InventoryItem, pool: any) => {
  //   setSelectedItemForAllocation(item)
  //   setSelectedPoolForAllocation(pool)
  //   setIsAllocationDialogOpen(true)
  // }

  // Handlers - Allocation Management
  const handleCreateAllocation = (item: InventoryItem) => {
    setSelectedItemForAllocationCreate(item)
    setIsAllocationCreateDialogOpen(true)
  }

  const handleSaveAllocation = (allocationData: Omit<Allocation, 'id' | 'itemName' | 'supplierName' | 'contractName' | 'tourNames' | 'created_at'>) => {
    if (editingAllocation) {
      updateAllocation(editingAllocation.id, allocationData)
      toast.success('Allocation updated!')
    } else {
      addAllocation(allocationData)
      toast.success('Allocation created!')
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
      deleteAllocation(allocation.id)
      toast.success('Allocation deleted')
    }
  }

  // const handleEditPool = (pool: any) => {
  //   setEditingPool(pool)
  // }

  // const handleSavePool = (poolId: string, updates: any) => {
  //   updateAllocationPoolCapacity(poolId, updates)
  //   setEditingPool(null)
  //   toast.success('Pool updated!')
  // }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Unified Inventory</h2>
          <p className="text-sm text-muted-foreground">
            Manage all inventory types: hotels, tickets, transfers, activities, and more
          </p>
        </div>
        <Button onClick={() => handleOpenItemDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Inventory Item
        </Button>
      </div>

      {/* Stats Grid */}
      <StatsGrid
        totalItems={stats.totalItems}
        totalContracts={stats.totalContracts}
        totalRates={stats.totalRates}
        activeRates={stats.activeRates}
        itemBreakdown={stats.itemBreakdown}
      />

      {/* Allocation Pool Widget */}
      <AllocationPoolWidget />

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <FilterBar
            itemTypeFilter={filterItemType}
            tourFilter={filterTour}
            supplierFilter={filterSupplier}
            statusFilter={filterStatus}
            searchTerm={searchTerm}
            tours={tours}
            suppliers={suppliers}
            onItemTypeChange={setFilterItemType}
            onTourChange={setFilterTour}
            onSupplierChange={setFilterSupplier}
            onStatusChange={setFilterStatus}
            onSearchChange={setSearchTerm}
            onClearFilters={() => {
              setFilterItemType('all')
              setFilterTour('all')
              setFilterSupplier('all')
              setFilterStatus('all')
              setSearchTerm('')
            }}
            resultsCount={{
              items: filteredItems.length,
              contracts: filteredContracts.length,
              rates: filteredRates.length
            }}
          />
        </CardContent>
      </Card>

      {/* Main Content */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-lg font-semibold mb-2">No inventory items yet</p>
            <p className="text-sm mb-4">
              Create your first inventory item to get started
            </p>
            <Button onClick={() => handleOpenItemDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Inventory Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* All Items (when "All Tours" is selected) */}
          {(() => {
            // Show all items when "All Tours" is selected
            if (filterTour !== 'all') return null

            // Group items by type for better organization
            const groupedItems = filteredItems.reduce((acc, item) => {
              if (!acc[item.item_type]) {
                acc[item.item_type] = []
              }
              acc[item.item_type].push(item)
              return acc
            }, {} as Record<string, typeof filteredItems>)

            return Object.entries(groupedItems).map(([itemType, items]) => (
              <Card key={itemType} className="border-2" style={{ borderColor: 'hsl(var(--primary) / 0.2)' }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between w-full pb-2">
                    <div className="flex items-center gap-3">
                      {React.createElement(ITEM_TYPE_ICONS[itemType as InventoryItemType] || Package, { className: "h-5 w-5 text-primary" })}
                      <div className="text-left">
                        <div className="font-bold text-base">{ITEM_TYPE_LABELS[itemType as InventoryItemType] || itemType}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{items.length} items</span>
                          <span>•</span>
                          <span>{filteredContracts.filter(c => c.item_type === itemType).length} contracts</span>
                          <span>•</span>
                          <span>{filteredRates.filter(r => r.item_type === itemType).length} rates</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {items.map(item => {
                      const itemContracts = filteredContracts.filter(c => c.item_id === item.id)
                      const itemRates = filteredRates.filter(r => r.item_id === item.id)

                      return (
                        <div key={item.id} className="border rounded-lg p-4">
                          <ItemHeader
                            item={item}
                            contractCount={itemContracts.length}
                            rateCount={itemRates.length}
                            onEditItem={handleOpenItemDialog}
                            onAddContract={(item) => handleOpenContractDialog(item)}
                            onAddBuyToOrderRate={(item) => handleOpenRateDialog(item)}
                          />


                          {itemContracts.length > 0 && (
                            <div className="space-y-2 mb-4">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Contracts ({itemContracts.length})
                              </h4>
                              <div className="grid gap-2">
                                {itemContracts.map(contract => (
                                  <ContractCard
                                    key={contract.id}
                                    contract={contract}
                                    rateCount={itemRates.filter(r => r.contract_id === contract.id).length}
                                    onEdit={handleOpenContractDialog.bind(null, item)}
                                    onClone={handleCloneContract}
                                    onDelete={handleDeleteContract}
                                    onAddRate={() => handleOpenRateDialog(item, undefined, contract)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Allocation Management Section */}
                          {(() => {
                            const itemAllocations = getItemAllocations(item.id)
                            const itemPools = getItemPools(item.id)
                            
                            return (
                              <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Package className="h-4 w-4 text-blue-500" />
                                    Allocations & Pools ({itemAllocations.length} allocations, {itemPools.length} pools)
                                  </h4>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleCreateAllocation(item)}
                                    className="h-7 px-3 text-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Allocation
                                  </Button>
                                </div>

                                {/* Allocations List */}
                                {itemAllocations.length > 0 && (
                                  <div className="space-y-2">
                                    {itemAllocations.map(allocation => {
                                      const pool = itemPools.find(p => p.pool_id === allocation.allocation_pool_id)
                                      // const supplier = suppliers.find(s => s.id === allocation.supplier_id)
                                      
                                      return (
                                        <div key={allocation.id} className="p-3 border rounded-lg bg-card">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-sm">{allocation.label}</span>
                                              <Badge variant="outline" className="text-xs">
                                                {allocation.quantity} units
                                              </Badge>
                                              {allocation.allocation_pool_id && (
                                                <Badge variant="secondary" className="text-xs">
                                                  Pool: {allocation.allocation_pool_id}
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                onClick={() => handleEditAllocation(allocation)}
                                                className="h-6 px-2 text-xs"
                                              >
                                                Edit
                                              </Button>
                                              <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                onClick={() => handleDeleteAllocation(allocation)}
                                                className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                          
                                          <div className="text-xs text-muted-foreground space-y-1">
                                            <div className="flex justify-between">
                                              <span>Categories:</span>
                                              <span>{allocation.category_ids.map(id => {
                                                const cat = item.categories.find(c => c.id === id)
                                                return cat?.category_name || id
                                              }).join(', ')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Supplier:</span>
                                              <span>{allocation.supplierName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Validity:</span>
                                              <span>{allocation.valid_from} to {allocation.valid_to}</span>
                                            </div>
                                            {pool && (
                                              <div className="flex justify-between">
                                                <span>Pool Status:</span>
                                                <Badge variant={pool.status === 'healthy' ? 'default' : 'destructive'} className="text-xs">
                                                  {pool.status}
                                                </Badge>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}

                                {/* Pools Overview */}
                                {itemPools.length > 0 && (
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-xs text-muted-foreground">Pools Overview:</h5>
                                    {itemPools.map(pool => {
                                      const poolAllocations = getPoolAllocations(pool.pool_id)
                                      const utilization = pool.total_capacity > 0 ? (pool.current_bookings / pool.total_capacity) * 100 : 0
                                      
                                      return (
                                        <div key={pool.pool_id} className="p-2 border rounded bg-muted/20 text-xs">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium">{pool.pool_id}</span>
                                            <div className="flex items-center gap-2">
                                              <span>{pool.available_spots} available</span>
                                              <span className="text-muted-foreground">{utilization.toFixed(1)}% utilized</span>
                                              <Badge variant={pool.status === 'healthy' ? 'default' : 'destructive'} className="text-xs">
                                                {pool.status}
                                              </Badge>
                                            </div>
                                          </div>
                                          {poolAllocations.length > 0 && (
                                            <div className="mt-1 text-muted-foreground">
                                              {poolAllocations.length} allocation{poolAllocations.length !== 1 ? 's' : ''}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}

                                {/* Empty State */}
                                {itemAllocations.length === 0 && itemPools.length === 0 && (
                                  <div className="p-4 border-2 border-dashed rounded-lg text-center text-sm text-muted-foreground">
                                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No allocations or pools yet</p>
                                    <p className="text-xs">Create allocations to manage inventory capacity</p>
                                  </div>
                                )}
                              </div>
                            )
                          })()}

                          {itemRates.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-primary" />
                                Rates ({itemRates.length})
                              </h4>
                              <UnifiedRatesTable
                                rates={itemRates}
                                itemType={item.item_type}
                                showSource={true}
                                onEdit={(rate) => handleOpenRateDialog(item, rate)}
                                onClone={handleCloneRate}
                                onDelete={handleDeleteRate}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          })()}

          {/* Tour filter view: show flat list of items/contracts/rates associated with the selected tour */}
          {filterTour !== 'all' && (() => {
            const tourId = parseInt(filterTour)
            const tour = tours.find(t => t.id === tourId)
            const tourContracts = unifiedContracts.filter(c => c.tour_ids?.includes(tourId))
            const tourRates = unifiedRates.filter(r => r.tour_id === tourId || (r.contract_id && tourContracts.some(c => c.id === r.contract_id)))
            const itemsForTour = inventoryItems.filter(item => tourContracts.some(c => c.item_id === item.id) || tourRates.some(r => r.item_id === item.id))

            return (
              <Card className="border-2" style={{ borderColor: 'hsl(var(--primary) / 0.2)' }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between w-full pb-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-bold text-base">{tour?.name || `Tour #${tourId}`}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{tourContracts.length} contracts</span>
                          <span>•</span>
                          <span>{tourRates.length} rates</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {itemsForTour.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No inventory linked to this tour yet</div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      {itemsForTour.map(item => {
                        const itemContracts = tourContracts.filter(c => c.item_id === item.id)
                        const itemRates = tourRates.filter(r => r.item_id === item.id)

                        return (
                          <div key={item.id} className="border rounded-lg p-4">
                            <ItemHeader
                              item={item}
                              contractCount={itemContracts.length}
                              rateCount={itemRates.length}
                              onEditItem={handleOpenItemDialog}
                              onAddContract={(item) => handleOpenContractDialog(item)}
                              onAddBuyToOrderRate={(item) => handleOpenRateDialog(item)}
                            />

                            {itemContracts.length > 0 && (
                              <div className="space-y-2 mb-4">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Contracts ({itemContracts.length})
                                </h4>
                                <div className="grid gap-2">
                                  {itemContracts.map(contract => (
                                    <ContractCard
                                      key={contract.id}
                                      contract={contract}
                                      rateCount={itemRates.filter(r => r.contract_id === contract.id).length}
                                      onEdit={handleOpenContractDialog.bind(null, item)}
                                      onClone={handleCloneContract}
                                      onDelete={handleDeleteContract}
                                      onAddRate={() => handleOpenRateDialog(item, undefined, contract)}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {itemRates.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-primary" />
                                  Rates ({itemRates.length})
                                </h4>
                                <UnifiedRatesTable
                                  rates={itemRates}
                                  itemType={item.item_type}
                                  showSource={true}
                                  onEdit={(rate) => handleOpenRateDialog(item, rate)}
                                  onClone={handleCloneRate}
                                  onDelete={handleDeleteRate}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })()}
        </div>
      )}

      {/* Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem 
                ? 'Update item information and categories' 
                : 'Create a new inventory item (hotel, ticket, transfer, etc.)'}
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

      {/* Contract Dialog */}
      <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContract ? 'Edit Contract' : 'Add New Contract'}
            </DialogTitle>
            <DialogDescription>
              {selectedItemForContract && `${selectedItemForContract.name} • ${editingContract ? 'Update' : 'Configure'} contract terms and pricing`}
            </DialogDescription>
          </DialogHeader>
          {selectedItemForContract && (
            <UnifiedContractForm
              item={selectedItemForContract}
              contract={editingContract}
              suppliers={suppliers}
              tours={tours}
              onSave={handleSaveContract}
              onCancel={() => {
                setIsContractDialogOpen(false)
                setEditingContract(undefined)
                setSelectedItemForContract(undefined)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Rate Dialog */}
      <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRate ? 'Edit Rate' : 'Create Rate'}
            </DialogTitle>
            <DialogDescription>
              {selectedItemForRate && `${selectedItemForRate.name}`}
            </DialogDescription>
          </DialogHeader>
          {selectedItemForRate && (
            <UnifiedRateFormEnhanced
              item={selectedItemForRate}
              contract={selectedContractForRate}
              existingRate={editingRate}
              tours={tours}
              existingRates={unifiedRates.filter(r => r.item_id === selectedItemForRate.id)}
              allocations={allocations}
              onSave={handleSaveRate}
              onCancel={() => {
                setIsRateDialogOpen(false)
                setEditingRate(undefined)
                setSelectedItemForRate(undefined)
                setSelectedContractForRate(undefined)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Pool Creation Dialog */}
      <PoolCreationDialog
        open={isPoolCreateDialogOpen}
        onClose={() => setIsPoolCreateDialogOpen(false)}
        onSave={handleCreatePool}
      />

      {/* Old allocation management dialog removed */}

      {/* Allocation Form Dialog */}
      {selectedItemForAllocationCreate && (
        <Dialog open={isAllocationCreateDialogOpen} onOpenChange={setIsAllocationCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
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
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded text-sm"
                    placeholder="e.g., f1-main-pool"
                    defaultValue={editingAllocation?.allocation_pool_id || ''}
                    id="allocation-pool-id"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Valid From *</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded text-sm"
                    defaultValue={editingAllocation?.valid_from || ''}
                    id="allocation-valid-from"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Valid To *</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded text-sm"
                    defaultValue={editingAllocation?.valid_to || ''}
                    id="allocation-valid-to"
                  />
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

      {/* Pool Edit Dialog - Commented out for now */}
      {/* <PoolEditDialog
        pool={editingPool}
        open={!!editingPool}
        onClose={() => setEditingPool(null)}
        onSave={handleSavePool}
      /> */}

    </div>
  )
}

