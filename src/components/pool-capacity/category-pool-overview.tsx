/**
 * CATEGORY & POOL OVERVIEW
 * Shows how categories, allocations, and pools work together
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useData } from '@/contexts/data-context'
import type { InventoryItem } from '@/types/unified-inventory'

interface CategoryPoolOverviewProps {
  item: InventoryItem
  selectedPoolId?: string
}

export function CategoryPoolOverview({ item, selectedPoolId }: CategoryPoolOverviewProps) {
  const { unifiedContracts, allocationPoolCapacity, unifiedRates } = useData()

  // Get contracts for this item
  const itemContracts = unifiedContracts.filter(c => c.item_id === item.id)
  
  // Get pools for this item (filter by selected pool if provided)
  const itemPools = allocationPoolCapacity.filter(p => 
    p.item_id === item.id && 
    (!selectedPoolId || p.pool_id === selectedPoolId)
  )
  
  // Get rates for this item
  const itemRates = unifiedRates.filter(r => r.item_id === item.id)

  // Calculate category usage with shared pool logic
  const categoryUsage = useMemo(() => {
    // First, get all categories that are actually allocated in contracts
    const allocatedCategories = new Set<string>()
    
    // TODO: Get allocated categories from separate allocation system
    // itemContracts.forEach(contract => {
    //   contract.allocations?.forEach(allocation => {
    //     // If we're filtering by pool, only include allocations for that pool
    //     if (selectedPoolId && allocation.allocation_pool_id !== selectedPoolId) {
    //       return
    //     }
    //     allocation.category_ids.forEach(categoryId => {
    //       allocatedCategories.add(categoryId)
    //     })
    //   })
    // })
    
    // Only show categories that are actually allocated
    const relevantCategories = item.categories.filter(category => 
      allocatedCategories.has(category.id)
    )
    
    return relevantCategories.map(category => {
      // TODO: Find allocations using this category from separate allocation system
      const allocationsUsingCategory: any[] = []
      
      // Find rates using this category
      const ratesUsingCategory = itemRates.filter(rate => rate.category_id === category.id)
      
      // Get pool IDs used by this category
      const poolIds = [...new Set(allocationsUsingCategory.map(a => a.allocation_pool_id).filter(Boolean))]
      
      // For shared pools, calculate capacity differently
      let totalAllocated = 0
      let totalBooked = 0
      let available = 0
      let utilizationPercentage = 0
      
      if (poolIds.length > 0) {
        // Shared pool logic: capacity is per pool, not per category
        poolIds.forEach(poolId => {
          const pool = itemPools.find(p => p.pool_id === poolId)
          if (pool) {
            // For shared pools, each category can use the full pool capacity
            totalAllocated += pool.total_capacity
            totalBooked += pool.current_bookings
            available += pool.available_spots
            utilizationPercentage = pool.total_capacity > 0 ? (pool.current_bookings / pool.total_capacity) * 100 : 0
          }
        })
      } else {
        // Legacy logic for non-pooled allocations
        totalAllocated = allocationsUsingCategory.reduce((sum, allocation) => sum + allocation.quantity, 0)
        totalBooked = ratesUsingCategory.reduce((sum, rate) => sum + (rate.booked_quantity || 0), 0)
        available = totalAllocated - totalBooked
        utilizationPercentage = totalAllocated > 0 ? (totalBooked / totalAllocated) * 100 : 0
      }
      
      return {
        category,
        totalAllocated,
        totalBooked,
        available,
        utilizationPercentage,
        poolIds,
        allocationsCount: allocationsUsingCategory.length,
        ratesCount: ratesUsingCategory.length,
        isSharedPool: poolIds.length > 0
      }
    })
  }, [item.categories, itemContracts, itemRates, itemPools])

  // Calculate pool usage
  const poolUsage = useMemo(() => {
    return itemPools.map(pool => {
      // Find contracts using this pool
      // TODO: Get contracts using this pool from separate allocation system
      const contractsUsingPool: any[] = []
      
      // Find rates using this pool
      const ratesUsingPool = itemRates.filter(rate => rate.allocation_pool_id === pool.pool_id)
      
      // Calculate total booked across all rates using this pool
      const totalBooked = ratesUsingPool.reduce((sum, rate) => sum + (rate.booked_quantity || 0), 0)
      
      return {
        pool,
        contractsCount: contractsUsingPool.length,
        ratesCount: ratesUsingPool.length,
        utilizationPercentage: pool.total_capacity > 0 ? (totalBooked / pool.total_capacity) * 100 : 0
      }
    })
  }, [itemPools, itemContracts, itemRates])

  return (
    <div className="space-y-6">
      {/* Categories Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 Categories Overview
            <Badge variant="outline">{item.categories.length} categories</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryUsage.map(({ category, totalAllocated, totalBooked, available, utilizationPercentage, poolIds, allocationsCount, ratesCount, isSharedPool }) => (
              <div key={category.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{category.category_name}</h4>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {category.capacity_info.max_occupancy && (
                        <Badge variant="secondary" className="text-xs">
                          Max: {category.capacity_info.max_occupancy} people
                        </Badge>
                      )}
                      {category.capacity_info.max_pax && (
                        <Badge variant="secondary" className="text-xs">
                          {category.capacity_info.min_pax}-{category.capacity_info.max_pax} pax
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {category.pricing_behavior.pricing_mode}
                      </Badge>
                      {isSharedPool && (
                        <Badge variant="default" className="text-xs">
                          🔄 Shared Pool
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {totalBooked} / {totalAllocated} booked
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {available} available
                    </div>
                    {isSharedPool && (
                      <div className="text-xs text-blue-600 mt-1">
                        ⚠️ Shared with other categories
                      </div>
                    )}
                  </div>
                </div>
                
                <Progress value={utilizationPercentage} className="mb-3" />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <div>
                    {allocationsCount} allocations • {ratesCount} rates
                  </div>
                  <div>
                    {poolIds.length > 0 && (
                      <span>Pools: {poolIds.join(', ')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pools Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏊 Pool Overview
            <Badge variant="outline">{itemPools.length} pools</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {poolUsage.map(({ pool, contractsCount, ratesCount, utilizationPercentage }) => (
              <div key={pool.pool_id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{pool.pool_id}</h4>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {pool.status}
                      </Badge>
                      {pool.allows_overbooking && (
                        <Badge variant="secondary" className="text-xs">
                          Overbooking: {pool.overbooking_limit}
                        </Badge>
                      )}
                      {pool.waitlist_enabled && (
                        <Badge variant="secondary" className="text-xs">
                          Waitlist: {pool.waitlist_max_size}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {pool.current_bookings} / {pool.total_capacity} booked
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pool.available_spots} available
                    </div>
                  </div>
                </div>
                
                <Progress value={utilizationPercentage} className="mb-3" />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <div>
                    {contractsCount} contracts • {ratesCount} rates
                  </div>
                  <div>
                    {pool.minimum_booking_size && (
                      <span>Min: {pool.minimum_booking_size}</span>
                    )}
                    {pool.maximum_booking_size && (
                      <span> • Max: {pool.maximum_booking_size}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{item.categories.length}</div>
              <div className="text-xs text-muted-foreground">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{itemContracts.length}</div>
              <div className="text-xs text-muted-foreground">Contracts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{itemPools.length}</div>
              <div className="text-xs text-muted-foreground">Pools</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{itemRates.length}</div>
              <div className="text-xs text-muted-foreground">Rates</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
