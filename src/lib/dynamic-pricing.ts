/**
 * DYNAMIC PRICING ENGINE
 * Calculates prices with support for complex, conditional charges
 * Handles taxes, fees, discounts, commissions, surcharges, etc.
 */

import type {
  DynamicCharge,
  ChargeCondition,
  ChargeTier,
  DayOfWeek,
  InventoryItemType,
  OccupancyType,
  BoardType,
  ChargeDirection
} from '@/types/unified-inventory'
import { getDayOfWeek, matchesDayOfWeek } from '@/types/unified-inventory'

// ============================================================================
// TYPES
// ============================================================================

export interface PricingContext {
  // Core values
  base_rate: number
  quantity: number
  
  // Time-based
  booking_date: Date
  service_date: Date
  nights?: number
  days?: number
  
  // Item details
  item_type: InventoryItemType
  category_id?: string
  
  // Hotel-specific
  occupancy_type?: OccupancyType
  board_type?: BoardType
  people?: number
  
  // Service-specific
  vehicle_count?: number
  group_size?: number
  
  // Customer
  customer_type?: string
  
  // Tour
  tour_id?: number
  
  // Custom data
  custom_data?: Record<string, any>
}

export interface PriceBreakdownItem {
  charge_id: string
  charge_name: string
  charge_type: string
  amount: number
  direction: ChargeDirection
  calculation_details: string
  applied_to_amount: number
  conditions_met: boolean
  skipped_reason?: string
}

export interface DetailedPriceBreakdown {
  // Input
  base_rate: number
  quantity: number
  nights?: number
  people?: number
  
  // All charges (in order of application)
  charges: PriceBreakdownItem[]
  
  // Subtotals
  subtotal_before_tax: number
  total_taxes: number
  total_fees: number
  total_discounts: number
  total_surcharges: number
  total_commissions_received: number  // Supplier discounts (reduce your cost)
  total_commissions_paid: number      // Agent commissions (reduce your profit)
  
  // Final totals
  cost_price: number           // What you pay supplier
  selling_price: number        // What customer pays you
  profit: number               // Selling - Cost
  profit_margin_percentage: number
  
  // Detailed tracking
  running_total_log: Array<{
    step: number
    charge_name: string
    amount_before: number
    charge_amount: number
    amount_after: number
  }>
}

// ============================================================================
// MAIN PRICING FUNCTION
// ============================================================================

export function calculateDetailedPrice(
  base_rate: number,
  charges: DynamicCharge[],
  context: PricingContext
): DetailedPriceBreakdown {
  // Initialize totals
  let currentBasePrice = base_rate
  let currentSubtotal = base_rate
  let currentTotal = base_rate
  
  const appliedCharges: PriceBreakdownItem[] = []
  const runningLog: Array<{ step: number; charge_name: string; amount_before: number; charge_amount: number; amount_after: number }> = []
  
  // Sort charges by application order
  const sortedCharges = [...charges].sort((a, b) => (a.application_order || 999) - (b.application_order || 999))
  
  // Filter and apply each charge
  sortedCharges.forEach((charge, index) => {
    if (!charge.active) return
    
    // Check if conditions are met
    const conditionsMet = evaluateConditions(charge.conditions || [], context)
    
    if (!conditionsMet.allMet) {
      appliedCharges.push({
        charge_id: charge.id,
        charge_name: charge.charge_name,
        charge_type: charge.charge_type,
        amount: 0,
        direction: charge.direction,
        calculation_details: 'Conditions not met',
        applied_to_amount: 0,
        conditions_met: false,
        skipped_reason: conditionsMet.reason
      })
      return
    }
    
    // Determine what amount to apply the charge to
    let appliedToAmount = 0
    switch (charge.applied_to) {
      case 'base_price':
        appliedToAmount = currentBasePrice
        break
      case 'subtotal':
        appliedToAmount = currentSubtotal
        break
      case 'total':
        appliedToAmount = currentTotal
        break
      case 'specific_charge':
        // TODO: Implement applying to specific charges
        appliedToAmount = currentTotal
        break
    }
    
    // Calculate charge amount
    const chargeResult = calculateChargeAmount(
      charge,
      appliedToAmount,
      context
    )
    
    // Track before state
    const amountBefore = currentTotal
    
    // Apply charge to running total
    if (charge.direction === 'add') {
      currentTotal += chargeResult.amount
      if (charge.applied_to === 'base_price' || charge.applied_to === 'subtotal') {
        currentSubtotal += chargeResult.amount
      }
    } else {
      currentTotal -= chargeResult.amount
      if (charge.applied_to === 'base_price' || charge.applied_to === 'subtotal') {
        currentSubtotal -= chargeResult.amount
      }
    }
    
    // Log the application
    runningLog.push({
      step: index + 1,
      charge_name: charge.charge_name,
      amount_before: amountBefore,
      charge_amount: charge.direction === 'add' ? chargeResult.amount : -chargeResult.amount,
      amount_after: currentTotal
    })
    
    // Add to applied charges
    appliedCharges.push({
      charge_id: charge.id,
      charge_name: charge.charge_name,
      charge_type: charge.charge_type,
      amount: chargeResult.amount,
      direction: charge.direction,
      calculation_details: chargeResult.details,
      applied_to_amount: appliedToAmount,
      conditions_met: true
    })
  })
  
  // Calculate aggregated totals
  const totalTaxes = appliedCharges
    .filter(c => c.charge_type === 'tax' && c.direction === 'add')
    .reduce((sum, c) => sum + c.amount, 0)
  
  const totalFees = appliedCharges
    .filter(c => c.charge_type === 'fee' && c.direction === 'add')
    .reduce((sum, c) => sum + c.amount, 0)
  
  const totalDiscounts = appliedCharges
    .filter(c => c.charge_type === 'discount' && c.direction === 'subtract')
    .reduce((sum, c) => sum + c.amount, 0)
  
  const totalSurcharges = appliedCharges
    .filter(c => c.charge_type === 'surcharge' && c.direction === 'add')
    .reduce((sum, c) => sum + c.amount, 0)
  
  const totalCommissionsReceived = appliedCharges
    .filter(c => c.charge_type === 'commission' && c.direction === 'subtract')
    .reduce((sum, c) => sum + c.amount, 0)
  
  const totalCommissionsPaid = appliedCharges
    .filter(c => c.charge_type === 'commission' && c.direction === 'add')
    .reduce((sum, c) => sum + c.amount, 0)
  
  // Calculate cost vs selling price
  // Cost = what you pay (base rate - commissions received)
  // Selling = what customer pays (total after all charges)
  const cost_price = base_rate - totalCommissionsReceived
  const selling_price = currentTotal
  const profit = selling_price - cost_price
  const profit_margin = selling_price > 0 ? (profit / selling_price) * 100 : 0
  
  return {
    base_rate,
    quantity: context.quantity,
    nights: context.nights,
    people: context.people,
    charges: appliedCharges,
    subtotal_before_tax: currentSubtotal - totalTaxes,
    total_taxes: totalTaxes,
    total_fees: totalFees,
    total_discounts: totalDiscounts,
    total_surcharges: totalSurcharges,
    total_commissions_received: totalCommissionsReceived,
    total_commissions_paid: totalCommissionsPaid,
    cost_price,
    selling_price,
    profit,
    profit_margin_percentage: profit_margin,
    running_total_log: runningLog
  }
}

// ============================================================================
// CHARGE CALCULATION
// ============================================================================

function calculateChargeAmount(
  charge: DynamicCharge,
  appliedToAmount: number,
  context: PricingContext
): { amount: number; details: string } {
  const config = charge.calculation_config
  let amount = 0
  let details = ''
  
  switch (charge.calculation_type) {
    case 'percentage':
      amount = appliedToAmount * (config.percentage || 0)
      details = `${(config.percentage || 0) * 100}% of ${appliedToAmount.toFixed(2)}`
      break
      
    case 'fixed_amount':
      amount = config.fixed_amount || 0
      details = `Fixed amount: ${amount.toFixed(2)}`
      break
      
    case 'per_person':
      amount = (config.amount_per_unit || 0) * (context.people || 1) * context.quantity
      details = `${config.amount_per_unit} × ${context.people || 1} people × ${context.quantity} units`
      break
      
    case 'per_person_per_night':
      amount = (config.amount_per_unit || 0) * (context.people || 1) * (context.nights || 1) * context.quantity
      details = `${config.amount_per_unit} × ${context.people || 1} people × ${context.nights || 1} nights × ${context.quantity} units`
      break
      
    case 'per_unit':
      amount = (config.amount_per_unit || 0) * context.quantity
      details = `${config.amount_per_unit} × ${context.quantity} units`
      break
      
    case 'per_unit_per_day':
      amount = (config.amount_per_unit || 0) * context.quantity * (context.days || context.nights || 1)
      details = `${config.amount_per_unit} × ${context.quantity} units × ${context.days || context.nights || 1} days`
      break
      
    case 'tiered':
      const tierResult = calculateTieredCharge(config.tiers || [], context.quantity, appliedToAmount)
      amount = tierResult.amount
      details = tierResult.details
      break
      
    case 'formula':
      // TODO: Implement formula-based calculation
      amount = 0
      details = 'Formula-based (not yet implemented)'
      break
  }
  
  // Apply min/max bounds
  if (config.min_amount !== undefined && amount < config.min_amount) {
    details += ` (capped to minimum: ${config.min_amount})`
    amount = config.min_amount
  }
  if (config.max_amount !== undefined && amount > config.max_amount) {
    details += ` (capped to maximum: ${config.max_amount})`
    amount = config.max_amount
  }
  
  // Apply rounding
  if (config.round_to !== undefined) {
    amount = Math.round(amount / config.round_to) * config.round_to
  }
  
  return { amount, details }
}

function calculateTieredCharge(
  tiers: ChargeTier[],
  quantity: number,
  appliedToAmount: number
): { amount: number; details: string } {
  // Find the applicable tier
  const tier = tiers.find(t => 
    quantity >= t.min_value && (t.max_value === undefined || quantity <= t.max_value)
  )
  
  if (!tier) {
    return { amount: 0, details: 'No matching tier found' }
  }
  
  let amount = 0
  let details = ''
  
  switch (tier.calculation_type) {
    case 'percentage':
      amount = appliedToAmount * tier.rate
      details = `Tier: ${tier.min_value}-${tier.max_value || '∞'}, ${tier.rate * 100}% of ${appliedToAmount.toFixed(2)}`
      break
    case 'fixed_amount':
      amount = tier.rate
      details = `Tier: ${tier.min_value}-${tier.max_value || '∞'}, Fixed: ${tier.rate}`
      break
    case 'per_unit':
      amount = tier.rate * quantity
      details = `Tier: ${tier.min_value}-${tier.max_value || '∞'}, ${tier.rate} × ${quantity}`
      break
  }
  
  return { amount, details }
}

// ============================================================================
// CONDITION EVALUATION
// ============================================================================

function evaluateConditions(
  conditions: ChargeCondition[],
  context: PricingContext
): { allMet: boolean; reason?: string } {
  if (conditions.length === 0) {
    return { allMet: true }
  }
  
  for (const condition of conditions) {
    const result = evaluateSingleCondition(condition, context)
    if (!result.met) {
      return { allMet: false, reason: result.reason }
    }
  }
  
  return { allMet: true }
}

function evaluateSingleCondition(
  condition: ChargeCondition,
  context: PricingContext
): { met: boolean; reason?: string } {
  switch (condition.condition_type) {
    case 'date_range':
      return evaluateDateRange(condition, context)
    case 'day_of_week':
      return evaluateDayOfWeek(condition, context)
    case 'quantity':
      return evaluateNumericCondition(condition, context.quantity)
    case 'nights':
      return evaluateNumericCondition(condition, context.nights || 0)
    case 'lead_time':
      return evaluateLeadTime(condition, context)
    case 'item_type':
      return evaluateEquals(condition, context.item_type)
    case 'occupancy':
      return evaluateEquals(condition, context.occupancy_type)
    case 'board_type':
      return evaluateEquals(condition, context.board_type)
    case 'tour':
      return evaluateEquals(condition, context.tour_id)
    default:
      return { met: true }
  }
}

function evaluateDateRange(
  condition: ChargeCondition,
  context: PricingContext
): { met: boolean; reason?: string } {
  const serviceDate = context.service_date
  const start = new Date(condition.value)
  const end = condition.value_max ? new Date(condition.value_max) : new Date(condition.value)
  
  if (condition.operator === 'between') {
    const met = serviceDate >= start && serviceDate <= end
    return {
      met,
      reason: met ? undefined : `Service date ${serviceDate.toLocaleDateString()} not in range ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
    }
  }
  
  return { met: true }
}

function evaluateDayOfWeek(
  condition: ChargeCondition,
  context: PricingContext
): { met: boolean; reason?: string } {
  const serviceDayOfWeek = getDayOfWeek(context.service_date)
  const allowedDays = condition.value as DayOfWeek[]
  const met = matchesDayOfWeek(context.service_date, allowedDays)
  
  return {
    met,
    reason: met ? undefined : `Day ${serviceDayOfWeek} not in allowed days: ${allowedDays.join(', ')}`
  }
}

function evaluateNumericCondition(
  condition: ChargeCondition,
  value: number
): { met: boolean; reason?: string } {
  let met = false
  
  switch (condition.operator) {
    case 'equals':
      met = value === condition.value
      break
    case 'not_equals':
      met = value !== condition.value
      break
    case 'greater_than':
      met = value > condition.value
      break
    case 'less_than':
      met = value < condition.value
      break
    case 'greater_or_equal':
      met = value >= condition.value
      break
    case 'less_or_equal':
      met = value <= condition.value
      break
    case 'between':
      met = value >= condition.value && value <= (condition.value_max || condition.value)
      break
  }
  
  return {
    met,
    reason: met ? undefined : `Value ${value} does not meet condition ${condition.operator} ${condition.value}`
  }
}

function evaluateLeadTime(
  condition: ChargeCondition,
  context: PricingContext
): { met: boolean; reason?: string } {
  const daysDifference = Math.floor(
    (context.service_date.getTime() - context.booking_date.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  return evaluateNumericCondition(condition, daysDifference)
}

function evaluateEquals(
  condition: ChargeCondition,
  value: any
): { met: boolean; reason?: string } {
  let met = false
  
  switch (condition.operator) {
    case 'equals':
      met = value === condition.value
      break
    case 'not_equals':
      met = value !== condition.value
      break
    case 'in':
      met = Array.isArray(condition.value) && condition.value.includes(value)
      break
    case 'not_in':
      met = Array.isArray(condition.value) && !condition.value.includes(value)
      break
  }
  
  return {
    met,
    reason: met ? undefined : `Value ${value} does not meet condition ${condition.operator} ${JSON.stringify(condition.value)}`
  }
}

// ============================================================================
// MIGRATION HELPERS (BACKWARD COMPATIBILITY)
// ============================================================================

/**
 * Converts legacy contract fields to dynamic charges
 * Helps migrate old data to new system
 */
export function legacyToCharges(legacy: {
  markup_percentage?: number
  tax_rate?: number
  service_fee?: number
  supplier_commission_rate?: number
  city_tax_per_person_per_night?: number
  resort_fee_per_night?: number
}): DynamicCharge[] {
  const charges: DynamicCharge[] = []
  let order = 0
  
  // Supplier commission (applies first, reduces cost)
  if (legacy.supplier_commission_rate) {
    charges.push({
      id: `legacy-supplier-commission-${Date.now()}`,
      charge_name: 'Supplier Commission',
      charge_type: 'commission',
      description: 'Discount from supplier (migrated from legacy field)',
      calculation_type: 'percentage',
      calculation_config: {
        percentage: legacy.supplier_commission_rate
      },
      applied_to: 'base_price',
      direction: 'subtract',
      timing: 'immediate',
      conditions: [],
      display_in_breakdown: false,
      include_in_selling_price: false,
      tax_exempt: false,
      mandatory: true,
      active: true,
      application_order: order++
    })
  }
  
  // Markup (your profit margin)
  if (legacy.markup_percentage) {
    charges.push({
      id: `legacy-markup-${Date.now()}`,
      charge_name: 'Markup',
      charge_type: 'commission',
      description: 'Profit margin (migrated from legacy field)',
      calculation_type: 'percentage',
      calculation_config: {
        percentage: legacy.markup_percentage
      },
      applied_to: 'base_price',
      direction: 'add',
      timing: 'immediate',
      conditions: [],
      display_in_breakdown: false,
      include_in_selling_price: true,
      tax_exempt: false,
      mandatory: true,
      active: true,
      application_order: order++
    })
  }
  
  // Service fee
  if (legacy.service_fee) {
    charges.push({
      id: `legacy-service-fee-${Date.now()}`,
      charge_name: 'Service Fee',
      charge_type: 'fee',
      description: 'Service fee (migrated from legacy field)',
      calculation_type: 'fixed_amount',
      calculation_config: {
        fixed_amount: legacy.service_fee
      },
      applied_to: 'subtotal',
      direction: 'add',
      timing: 'immediate',
      conditions: [],
      display_in_breakdown: true,
      include_in_selling_price: true,
      tax_exempt: false,
      mandatory: true,
      active: true,
      application_order: order++
    })
  }
  
  // Tax (VAT, sales tax, etc.)
  if (legacy.tax_rate) {
    charges.push({
      id: `legacy-tax-${Date.now()}`,
      charge_name: 'Tax (VAT)',
      charge_type: 'tax',
      description: 'Government tax (migrated from legacy field)',
      calculation_type: 'percentage',
      calculation_config: {
        percentage: legacy.tax_rate
      },
      applied_to: 'subtotal',
      direction: 'add',
      timing: 'immediate',
      conditions: [],
      display_in_breakdown: true,
      include_in_selling_price: true,
      tax_exempt: false,
      mandatory: true,
      active: true,
      application_order: order++
    })
  }
  
  // City tax (per person per night)
  if (legacy.city_tax_per_person_per_night) {
    charges.push({
      id: `legacy-city-tax-${Date.now()}`,
      charge_name: 'City Tax',
      charge_type: 'tax',
      description: 'City/tourism tax (migrated from legacy field)',
      calculation_type: 'per_person_per_night',
      calculation_config: {
        amount_per_unit: legacy.city_tax_per_person_per_night
      },
      applied_to: 'base_price',
      direction: 'add',
      timing: 'on_service_date',
      conditions: [],
      display_in_breakdown: true,
      include_in_selling_price: false,
      tax_exempt: true,
      mandatory: true,
      active: true,
      application_order: order++
    })
  }
  
  // Resort fee
  if (legacy.resort_fee_per_night) {
    charges.push({
      id: `legacy-resort-fee-${Date.now()}`,
      charge_name: 'Resort Fee',
      charge_type: 'fee',
      description: 'Resort/facilities fee (migrated from legacy field)',
      calculation_type: 'per_unit_per_day',
      calculation_config: {
        amount_per_unit: legacy.resort_fee_per_night
      },
      applied_to: 'base_price',
      direction: 'add',
      timing: 'immediate',
      conditions: [],
      display_in_breakdown: true,
      include_in_selling_price: true,
      tax_exempt: false,
      mandatory: true,
      active: true,
      application_order: order++
    })
  }
  
  return charges
}

