/**
 * POOL CAPACITY MANAGEMENT PAGE
 * Main page for managing allocation pool capacity and bookings
 */

import { useState, useEffect } from 'react'
import { PoolCapacityDashboard, PoolBookingManager } from '@/components/pool-capacity'
import type { AllocationPoolCapacity } from '@/types/unified-inventory'
import { useData } from '@/contexts/data-context'
import { calculatePoolCapacity } from '@/lib/pool-capacity-helpers'

export function PoolCapacityManagement() {
  const { 
    allocationPoolCapacity, 
    poolBookings, 
    unifiedContracts, 
    inventoryItems,
    setAllocationPoolCapacity,
    addAllocationPoolCapacity
  } = useData()
  
  const [selectedPool, setSelectedPool] = useState<AllocationPoolCapacity | null>(null)
  const [editingPool, setEditingPool] = useState<AllocationPoolCapacity | null>(null)

  // Initialize pool capacity from existing contracts and clean up duplicates
  useEffect(() => {
    if (unifiedContracts.length > 0) {
      console.log('🔄 Checking pool capacity initialization...')
      
      // First, clean up any duplicates
      const uniquePools = new Map<string, AllocationPoolCapacity>()
      allocationPoolCapacity.forEach(pool => {
        if (!uniquePools.has(pool.pool_id)) {
          uniquePools.set(pool.pool_id, pool)
        }
      })
      
      const cleanedPools = Array.from(uniquePools.values())
      const hadDuplicates = cleanedPools.length !== allocationPoolCapacity.length
      
      if (hadDuplicates) {
        console.log(`🔧 Found ${allocationPoolCapacity.length - cleanedPools.length} duplicate pools, cleaning up...`)
        setAllocationPoolCapacity(cleanedPools)
        console.log(`✅ Cleaned up duplicates, now have ${cleanedPools.length} unique pools`)
      }
      
      // Calculate what pools should exist from contracts
      const calculatedPools = calculatePoolCapacity(unifiedContracts, poolBookings, inventoryItems)
      
      // Check if we need to add any missing pools
      const existingPoolIds = new Set(cleanedPools.map(p => p.pool_id))
      const newPools = calculatedPools.filter(pool => !existingPoolIds.has(pool.pool_id))
      
      if (newPools.length > 0) {
        console.log(`🔄 Adding ${newPools.length} missing pools...`)
        newPools.forEach(pool => {
          addAllocationPoolCapacity(pool)
        })
        console.log(`✅ Added ${newPools.length} new pools from existing contracts`)
      } else if (cleanedPools.length === 0 && calculatedPools.length > 0) {
        console.log(`🔄 Initializing ${calculatedPools.length} pools from existing contracts...`)
        calculatedPools.forEach(pool => {
          addAllocationPoolCapacity(pool)
        })
        console.log(`✅ Initialized ${calculatedPools.length} pools from existing contracts`)
      }
    }
  }, [unifiedContracts.length, poolBookings.length, inventoryItems.length, setAllocationPoolCapacity, addAllocationPoolCapacity])

  const handleViewBookings = (poolId: string) => {
    // Find the pool and set it as selected
    // This would be handled by the dashboard component
    console.log('View bookings for pool:', poolId)
  }

  const handleCreateBooking = (poolId: string) => {
    // Open booking creation dialog
    console.log('Create booking for pool:', poolId)
  }

  const handleEditPool = (pool: AllocationPoolCapacity) => {
    setEditingPool(pool)
  }

  const handleCloseBookings = () => {
    setSelectedPool(null)
  }

  if (selectedPool) {
    return (
      <PoolBookingManager
        pool={selectedPool}
        onClose={handleCloseBookings}
      />
    )
  }

  return (
    <div className="container mx-auto p-6">
      <PoolCapacityDashboard
        onEditPool={handleEditPool}
        onViewBookings={handleViewBookings}
        onCreateBooking={handleCreateBooking}
      />
      
      {/* Pool Edit Dialog would go here */}
      {editingPool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Pool: {editingPool.pool_id}</h3>
            <p className="text-muted-foreground mb-4">
              Pool editing functionality would be implemented here.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingPool(null)}
                className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
