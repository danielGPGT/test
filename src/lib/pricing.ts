import { Contract, OccupancyType, Rate } from '@/contexts/data-context'

export interface PriceBreakdown {
  baseRate: number
  cityTax: number
  resortFee: number
  vat: number
  supplierCommission: number
  subtotal: number
  totalCost: number
}

export function calculatePriceBreakdown(
  baseRate: number,
  contract: Contract,
  occupancy: OccupancyType,
  nights: number = 1,
  boardCost: number = 0,
  rate?: Rate // Optional rate object for rate-level overrides
): PriceBreakdown {
  // Determine number of people based on occupancy
  const people = occupancy === 'single' ? 1 : occupancy === 'double' ? 2 : occupancy === 'triple' ? 3 : 4

  // Use rate-level costs if provided, otherwise fall back to contract
  const taxRate = rate?.tax_rate !== undefined ? rate.tax_rate : (contract.tax_rate || 0)
  const cityTaxPerPerson = rate?.city_tax_per_person_per_night !== undefined ? rate.city_tax_per_person_per_night : (contract.city_tax_per_person_per_night || 0)
  const resortFeePerNight = rate?.resort_fee_per_night !== undefined ? rate.resort_fee_per_night : (contract.resort_fee_per_night || 0)
  const commissionRate = rate?.supplier_commission_rate !== undefined ? rate.supplier_commission_rate : (contract.supplier_commission_rate || 0)

  // Base calculations
  const cityTax = cityTaxPerPerson * people * nights
  const resortFee = resortFeePerNight * nights
  
  // Supplier commission (discount you receive from hotel) - applied to base rate only
  const supplierCommission = baseRate * commissionRate
  
  // Net rate after commission (commission only applies to base rate, not board costs)
  const netRate = baseRate - supplierCommission
  
  // Add board cost (no commission on board costs)
  const totalNetRate = netRate + boardCost
  
  // Subtotal before VAT (net rate + board cost + resort fee)
  const subtotal = totalNetRate + resortFee
  
  // VAT on subtotal (city tax usually not included in VAT base)
  const vat = subtotal * taxRate
  
  // Total cost to you
  const totalCost = subtotal + vat + cityTax

  return {
    baseRate: baseRate + boardCost, // Show total rate in breakdown
    cityTax,
    resortFee,
    vat,
    supplierCommission,
    subtotal,
    totalCost
  }
}

export function calculateSellingPrice(
  costPrice: number,
  commissionRate: number
): number {
  // Selling price = cost + (cost * commission_rate)
  return costPrice * (1 + commissionRate)
}

export function calculateProfit(
  sellingPrice: number,
  costPrice: number
): number {
  return sellingPrice - costPrice
}

export function calculateProfitMargin(
  sellingPrice: number,
  costPrice: number
): number {
  if (sellingPrice === 0) return 0
  return ((sellingPrice - costPrice) / sellingPrice) * 100
}

export const BOARD_TYPE_LABELS: Record<string, string> = {
  room_only: 'Room Only',
  bed_breakfast: 'Bed & Breakfast',
  half_board: 'Half Board',
  full_board: 'Full Board',
  all_inclusive: 'All-Inclusive'
}

export const BOARD_TYPE_DESCRIPTIONS: Record<string, string> = {
  room_only: 'No meals included',
  bed_breakfast: 'Breakfast included',
  half_board: 'Breakfast + Dinner',
  full_board: 'All meals (B, L, D)',
  all_inclusive: 'All meals + drinks'
}


