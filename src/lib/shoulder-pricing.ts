import { Contract } from '@/contexts/data-context'

/**
 * Calculate nightly rates including shoulder nights
 * @param checkIn - Check-in date (ISO string)
 * @param checkOut - Check-out date (ISO string)
 * @param baseRate - Base rate per night during contract period
 * @param contract - Contract with start/end dates and shoulder rates
 * @returns Array of nightly rates [night1, night2, night3, ...]
 */
export function calculateNightlyRates(
  checkIn: string,
  checkOut: string,
  baseRate: number,
  contract: Contract
): { nightly_rates: number[]; nights: number; total: number; shoulder_nights: number; base_nights: number } {
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const contractStart = new Date(contract.start_date)
  const contractEnd = new Date(contract.end_date)
  
  // Calculate number of nights
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
  
  const nightlyRates: number[] = []
  let shoulderNightCount = 0
  
  // Iterate through each night
  for (let i = 0; i < nights; i++) {
    const currentNight = new Date(checkInDate)
    currentNight.setDate(currentNight.getDate() + i)
    
    // Check if night is before contract period (pre-shoulder)
    if (currentNight < contractStart) {
      const daysBeforeContract = Math.ceil((contractStart.getTime() - currentNight.getTime()) / (1000 * 60 * 60 * 24))
      const shoulderIndex = daysBeforeContract - 1
      
      if (contract.pre_shoulder_rates && contract.pre_shoulder_rates[shoulderIndex] !== undefined) {
        nightlyRates.push(contract.pre_shoulder_rates[shoulderIndex])
        shoulderNightCount++
      } else {
        // No shoulder rate defined, use base rate
        nightlyRates.push(baseRate)
      }
    }
    // Check if night is after contract period (post-shoulder)
    else if (currentNight > contractEnd) {
      const daysAfterContract = Math.ceil((currentNight.getTime() - contractEnd.getTime()) / (1000 * 60 * 60 * 24))
      const shoulderIndex = daysAfterContract - 1
      
      if (contract.post_shoulder_rates && contract.post_shoulder_rates[shoulderIndex] !== undefined) {
        nightlyRates.push(contract.post_shoulder_rates[shoulderIndex])
        shoulderNightCount++
      } else {
        // No shoulder rate defined, use base rate
        nightlyRates.push(baseRate)
      }
    }
    // Night is within contract period
    else {
      nightlyRates.push(baseRate)
    }
  }
  
  const total = nightlyRates.reduce((sum, rate) => sum + rate, 0)
  const baseNightCount = nights - shoulderNightCount
  
  return {
    nightly_rates: nightlyRates,
    nights,
    total,
    shoulder_nights: shoulderNightCount,
    base_nights: baseNightCount
  }
}

/**
 * Format nightly rates for display
 */
export function formatNightlyBreakdown(
  checkIn: string,
  nightlyRates: number[],
  contractStart: string,
  contractEnd: string
): { date: string; rate: number; type: 'pre-shoulder' | 'contract' | 'post-shoulder' }[] {
  const checkInDate = new Date(checkIn)
  const contractStartDate = new Date(contractStart)
  const contractEndDate = new Date(contractEnd)
  
  return nightlyRates.map((rate, index) => {
    const nightDate = new Date(checkInDate)
    nightDate.setDate(nightDate.getDate() + index)
    
    let type: 'pre-shoulder' | 'contract' | 'post-shoulder'
    if (nightDate < contractStartDate) {
      type = 'pre-shoulder'
    } else if (nightDate > contractEndDate) {
      type = 'post-shoulder'
    } else {
      type = 'contract'
    }
    
    return {
      date: nightDate.toISOString().split('T')[0],
      rate,
      type
    }
  })
}

/**
 * Check if booking dates are valid for a contract
 */
export function validateBookingDates(
  checkIn: string,
  checkOut: string,
  contract: Contract
): { valid: boolean; error?: string } {
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const contractStart = new Date(contract.start_date)
  const contractEnd = new Date(contract.end_date)
  
  // Check-out must be after check-in
  if (checkOutDate <= checkInDate) {
    return { valid: false, error: 'Check-out date must be after check-in date' }
  }
  
  // Calculate maximum allowed pre/post shoulder nights
  const maxPreShoulder = contract.pre_shoulder_rates?.length || 0
  const maxPostShoulder = contract.post_shoulder_rates?.length || 0
  
  // Check if check-in is too early
  if (maxPreShoulder > 0 && checkInDate < contractStart) {
    const daysBeforeContract = Math.ceil((contractStart.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysBeforeContract > maxPreShoulder) {
      return {
        valid: false,
        error: `Check-in can be at most ${maxPreShoulder} days before contract start (${contract.start_date})`
      }
    }
  } else if (maxPreShoulder === 0 && checkInDate < contractStart) {
    return {
      valid: false,
      error: `Check-in must be on or after contract start date (${contract.start_date}). No pre-shoulder nights available.`
    }
  }
  
  // Check if check-out is too late
  if (maxPostShoulder > 0 && checkOutDate > contractEnd) {
    const daysAfterContract = Math.ceil((checkOutDate.getTime() - contractEnd.getTime()) / (1000 * 60 * 60 * 24))
    if (daysAfterContract > maxPostShoulder) {
      return {
        valid: false,
        error: `Check-out can be at most ${maxPostShoulder} days after contract end (${contract.end_date})`
      }
    }
  } else if (maxPostShoulder === 0 && checkOutDate > contractEnd) {
    return {
      valid: false,
      error: `Check-out must be on or before contract end date (${contract.end_date}). No post-shoulder nights available.`
      }
  }
  
  return { valid: true }
}

/**
 * Calculate selling prices with different margins for base vs shoulder nights
 */
export function calculateSellingPricesWithShoulderMargin(
  nightlyRates: { date: string; rate: number; type: 'pre-shoulder' | 'contract' | 'post-shoulder' }[],
  baseNightMargin: number,
  shoulderNightMargin: number
): {
  nightly_selling_prices: number[]
  total_cost: number
  total_selling: number
  total_profit: number
  breakdown: {
    base_nights_cost: number
    base_nights_selling: number
    shoulder_nights_cost: number
    shoulder_nights_selling: number
  }
} {
  let baseNightsCost = 0
  let shoulderNightsCost = 0
  const nightlySellingPrices: number[] = []
  
  nightlyRates.forEach(({ rate, type }) => {
    const margin = type === 'contract' ? baseNightMargin : shoulderNightMargin
    const sellingPrice = rate * (1 + margin)
    nightlySellingPrices.push(sellingPrice)
    
    if (type === 'contract') {
      baseNightsCost += rate
    } else {
      shoulderNightsCost += rate
    }
  })
  
  const baseNightsSelling = baseNightsCost * (1 + baseNightMargin)
  const shoulderNightsSelling = shoulderNightsCost * (1 + shoulderNightMargin)
  const totalCost = baseNightsCost + shoulderNightsCost
  const totalSelling = baseNightsSelling + shoulderNightsSelling
  const totalProfit = totalSelling - totalCost
  
  return {
    nightly_selling_prices: nightlySellingPrices,
    total_cost: totalCost,
    total_selling: totalSelling,
    total_profit: totalProfit,
    breakdown: {
      base_nights_cost: baseNightsCost,
      base_nights_selling: baseNightsSelling,
      shoulder_nights_cost: shoulderNightsCost,
      shoulder_nights_selling: shoulderNightsSelling
    }
  }
}

