/**
 * POOL CAPACITY MANAGEMENT HELPERS
 * Core logic for pool-centric capacity management
 */

import type { 
  UnifiedContract, 
  UnifiedRate, 
  InventoryItem,
  AllocationPoolCapacity,
  PoolBooking,
  RateCapacitySettings
} from '@/types/unified-inventory'
import {
  calculatePoolStatus,
  checkDailyAvailability,
  calculatePeakOccupancyDate,
  getDateRange,
  generateBookingReference,
  calculateNights
} from '@/types/unified-inventory'

/**
 * Calculate pool capacity from contracts and bookings
 */
export function calculatePoolCapacity(
  _contracts: UnifiedContract[],
  _poolBookings: PoolBooking[],
  _items: InventoryItem[]
): AllocationPoolCapacity[] {
  // const poolsMap = new Map<string, AllocationPoolCapacity>()
  
  // TODO: Implement with separate allocation system
  return []
}

/**
 * Check if dates are available for booking
 */
export function checkPoolAvailability(
  poolId: string,
  checkIn: string,
  checkOut: string,
  pools: AllocationPoolCapacity[]
): { available: boolean; reason?: string } {
  const pool = pools.find(p => p.pool_id === poolId)
  if (!pool) {
    return { available: false, reason: 'Pool not found' }
  }
  
  // Check if pool allows overbooking
  // const maxCapacity = pool.total_capacity + (pool.overbooking_limit || 0)
  
  // Check daily availability
  const available = checkDailyAvailability(pool, checkIn, checkOut)
  if (!available) {
    return { available: false, reason: 'No availability for selected dates' }
  }
  
  // Check minimum/maximum nights
  const nights = calculateNights(checkIn, checkOut)
  if (pool.minimum_nights && nights < pool.minimum_nights) {
    return { 
      available: false, 
      reason: `Minimum ${pool.minimum_nights} nights required` 
    }
  }
  if (pool.maximum_nights && nights > pool.maximum_nights) {
    return { 
      available: false, 
      reason: `Maximum ${pool.maximum_nights} nights allowed` 
    }
  }
  
  return { available: true }
}

/**
 * Create a new pool booking
 */
export function createPoolBooking(
  poolId: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  rateIds: number[],
  totalAmount: number,
  pools: AllocationPoolCapacity[]
): PoolBooking {
  const pool = pools.find(p => p.pool_id === poolId)
  if (!pool) {
    throw new Error('Pool not found')
  }
  
  const availability = checkPoolAvailability(poolId, checkIn, checkOut, pools)
  if (!availability.available) {
    throw new Error(availability.reason || 'Booking not available')
  }
  
  const nights = calculateNights(checkIn, checkOut)
  
  return {
    id: `booking-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    pool_id: poolId,
    check_in: checkIn,
    check_out: checkOut,
    nights,
    guests,
    rate_ids: rateIds,
    total_amount: totalAmount,
    booking_reference: generateBookingReference(),
    status: 'confirmed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * Update pool capacity after booking changes
 */
export function updatePoolCapacityAfterBooking(
  pool: AllocationPoolCapacity,
  booking: PoolBooking,
  action: 'add' | 'update' | 'remove'
): AllocationPoolCapacity {
  const updatedPool = { ...pool }
  const dates = getDateRange(booking.check_in, booking.check_out)
  
  dates.forEach(date => {
    if (!updatedPool.daily_availability[date]) {
      updatedPool.daily_availability[date] = {
        date,
        total_capacity: updatedPool.total_capacity,
        booked_quantity: 0,
        available_quantity: updatedPool.total_capacity,
        booking_ids: []
      }
    }
    
    const daily = updatedPool.daily_availability[date]
    
    switch (action) {
      case 'add':
        daily.booked_quantity += 1
        daily.booking_ids.push(booking.id)
        break
      case 'remove':
        daily.booked_quantity = Math.max(0, daily.booked_quantity - 1)
        daily.booking_ids = daily.booking_ids.filter(id => id !== booking.id)
        break
      case 'update':
        // For updates, we need to recalculate from all current bookings
        // This would be handled by recalculating the entire pool
        break
    }
    
    daily.available_quantity = daily.total_capacity - daily.booked_quantity
  })
  
  // Recalculate pool status
  updatedPool.current_bookings = Object.values(updatedPool.daily_availability)
    .reduce((sum, daily) => sum + daily.booked_quantity, 0) / 
    Math.max(1, Object.keys(updatedPool.daily_availability).length)
  
  updatedPool.available_spots = updatedPool.total_capacity - updatedPool.current_bookings
  updatedPool.status = calculatePoolStatus(updatedPool)
  updatedPool.peak_occupancy_date = calculatePeakOccupancyDate(updatedPool)
  updatedPool.last_updated = new Date().toISOString()
  
  return updatedPool
}

/**
 * Get rate capacity settings for a specific rate
 */
export function getRateCapacitySettings(
  rateId: number,
  poolId: string,
  rates: UnifiedRate[]
): RateCapacitySettings {
  const rate = rates.find(r => r.id === rateId)
  if (!rate) {
    throw new Error('Rate not found')
  }
  
  return {
    rate_id: rateId,
    pool_id: poolId,
    max_bookings_per_rate: undefined, // Can be set per rate if needed
    rate_current_bookings: 0, // Would be calculated from pool bookings
    rate_minimum_guests: undefined,
    rate_maximum_guests: undefined
  }
}

/**
 * Calculate multi-rate pricing for a booking
 */
export function calculateMultiRatePricing(
  rateIds: number[],
  checkIn: string,
  checkOut: string,
  rates: UnifiedRate[]
): number {
  const dates = getDateRange(checkIn, checkOut)
  let totalAmount = 0
  
  dates.forEach(() => {
    const rate = rates.find(r => rateIds.includes(r.id))
    if (rate) {
      totalAmount += rate.selling_price
    }
  })
  
  return totalAmount
}

/**
 * Get pool utilization statistics
 */
export function getPoolUtilizationStats(pool: AllocationPoolCapacity) {
  const totalDays = Object.keys(pool.daily_availability).length
  const totalBookedDays = Object.values(pool.daily_availability)
    .reduce((sum, daily) => sum + daily.booked_quantity, 0)
  
  const avgOccupancy = totalDays > 0 ? totalBookedDays / totalDays : 0
  const peakOccupancy = Math.max(...Object.values(pool.daily_availability)
    .map(daily => daily.booked_quantity), 0)
  
  return {
    totalDays,
    totalBookedDays,
    avgOccupancy,
    peakOccupancy,
    utilizationPercentage: pool.total_capacity > 0 ? (avgOccupancy / pool.total_capacity) * 100 : 0
  }
}
