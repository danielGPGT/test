/**
 * ALLOCATION MANAGEMENT HELPERS
 * Utilities for managing and analyzing allocation pools
 */

import type { UnifiedContract, UnifiedRate, InventoryItem, Allocation } from '@/types/unified-inventory'

export interface AllocationPoolData {
  pool_id: string
  label: string
  item_id: number
  item_name: string
  item_type: string
  
  // Contracts contributing to this pool
  contracts: Array<{
    contract_id: number
    contract_name: string
    supplier_name: string
    quantity: number
    valid_from: string
    valid_to: string
  }>
  
  // Rates drawing from this pool
  rates: Array<{
    rate_id: number
    rate_name: string
    tour_name?: string
    category_name: string
    booked_quantity: number
  }>
  
  // Totals
  total_allocated: number
  total_booked: number
  total_available: number
  utilization_percentage: number
  
  // Status
  status: 'healthy' | 'warning' | 'critical' | 'overbooked'
}

export interface ContractAllocationSummary {
  contract_id: number
  contract_name: string
  supplier_name: string
  item_name: string
  item_type: string
  valid_from: string
  valid_to: string
  
  allocations: Array<{
    pool_id?: string
    label?: string
    category_names: string[]
    quantity: number
    booked: number
    available: number
  }>
  
  total_allocated: number
  total_booked: number
  total_available: number
}

/**
 * Aggregate all allocation pools from contracts and rates
 */
export function aggregateAllocationPools(
  _contracts: UnifiedContract[],
  _rates: UnifiedRate[],
  _items: InventoryItem[],
  allocations: Allocation[]
): AllocationPoolData[] {
  // Group allocations by pool ID
  const poolGroups = new Map<string, Allocation[]>()
  
  allocations.forEach(allocation => {
    if (allocation.allocation_pool_id) {
      if (!poolGroups.has(allocation.allocation_pool_id)) {
        poolGroups.set(allocation.allocation_pool_id, [])
      }
      poolGroups.get(allocation.allocation_pool_id)!.push(allocation)
    }
  })
  
  // Convert to AllocationPoolData
  const poolData: AllocationPoolData[] = []
  
  poolGroups.forEach((poolAllocations, poolId) => {
    const firstAllocation = poolAllocations[0]
    const item = _items.find(i => i.id === firstAllocation.item_id)
    
    if (!item) return
    
    // Get rates using this pool
    const poolRates = _rates.filter(r => r.allocation_pool_id === poolId)
    
    // Transform contracts data
    const contractsData = poolAllocations
      .filter(a => a.contract_id)
      .map(a => {
        const contract = _contracts.find(c => c.id === a.contract_id)
        return contract ? {
          contract_id: contract.id,
          contract_name: contract.contract_name,
          supplier_name: contract.supplierName,
          quantity: a.quantity,
          valid_from: a.valid_from,
          valid_to: a.valid_to
        } : null
      })
      .filter(Boolean) as Array<{
        contract_id: number
        contract_name: string
        supplier_name: string
        quantity: number
        valid_from: string
        valid_to: string
      }>
    
    // Transform rates data
    const ratesData = poolRates.map(rate => ({
      rate_id: rate.id,
      rate_name: `Rate ${rate.id} - ${rate.categoryName}`,
      tour_name: rate.tourName,
      category_name: rate.categoryName || 'Unknown',
      booked_quantity: 0 // TODO: Get actual bookings when booking system is implemented
    }))
    
    // Calculate total allocated quantity
    const totalAllocated = poolAllocations.reduce((sum, a) => sum + a.quantity, 0)
    
    poolData.push({
      pool_id: poolId,
      label: `Pool ${poolId}`,
      item_id: item.id,
      item_name: item.name,
      item_type: item.item_type,
      contracts: contractsData,
      rates: ratesData,
      total_allocated: totalAllocated,
      total_booked: 0, // TODO: Calculate when booking system is implemented
      total_available: totalAllocated, // TODO: Subtract bookings when booking system is implemented
      utilization_percentage: 0, // TODO: Calculate when booking system is implemented
      status: 'healthy' as const // TODO: Calculate based on utilization
    })
  })
  
  return poolData
}

/**
 * Get contract allocation summaries
 */
export function getContractAllocationSummaries(
  _contracts: UnifiedContract[],
  _rates: UnifiedRate[],
  _items: InventoryItem[],
  allocations: Allocation[]
): ContractAllocationSummary[] {
  const summaries: ContractAllocationSummary[] = []
  
  _contracts.forEach(contract => {
    // Get allocations for this contract
    const contractAllocations = allocations.filter(a => a.contract_id === contract.id)
    
    if (contractAllocations.length === 0) return
    
    // Get item for this contract
    const item = _items.find(i => i.id === contract.item_id)
    if (!item) return
    
    // Calculate totals
    const totalAllocated = contractAllocations.reduce((sum, a) => sum + a.quantity, 0)
    
    // Transform allocations data
    const allocationsData = contractAllocations.map(allocation => ({
      pool_id: allocation.allocation_pool_id,
      label: allocation.label,
      category_names: allocation.category_ids.map(id => {
        const category = item.categories.find(c => c.id === id)
        return category?.category_name || id
      }),
      quantity: allocation.quantity,
      booked: 0, // TODO: Get actual bookings when booking system is implemented
      available: allocation.quantity // TODO: Subtract bookings when booking system is implemented
    }))
    
    summaries.push({
      contract_id: contract.id,
      contract_name: contract.contract_name,
      supplier_name: contract.supplierName,
      item_name: item.name,
      item_type: item.item_type,
      valid_from: contract.valid_from,
      valid_to: contract.valid_to,
      allocations: allocationsData,
      total_allocated: totalAllocated,
      total_booked: 0, // TODO: Calculate when booking system is implemented
      total_available: totalAllocated // TODO: Subtract bookings when booking system is implemented
    })
  })
  
  return summaries
}

/**
 * Get allocation statistics
 */
export function getAllocationStats(pools: AllocationPoolData[]) {
  return {
    total_pools: pools.length,
    total_allocated: pools.reduce((sum, p) => sum + p.total_allocated, 0),
    total_booked: pools.reduce((sum, p) => sum + p.total_booked, 0),
    total_available: pools.reduce((sum, p) => sum + p.total_available, 0),
    avg_utilization: pools.length > 0
      ? pools.reduce((sum, p) => sum + p.utilization_percentage, 0) / pools.length
      : 0,
    healthy_pools: pools.filter(p => p.status === 'healthy').length,
    warning_pools: pools.filter(p => p.status === 'warning').length,
    critical_pools: pools.filter(p => p.status === 'critical').length,
    overbooked_pools: pools.filter(p => p.status === 'overbooked').length
  }
}

/**
 * Find potential allocation conflicts
 */
export function findAllocationConflicts(pools: AllocationPoolData[]) {
  return pools.filter(pool => pool.status === 'overbooked' || pool.status === 'critical')
}

