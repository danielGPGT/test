import { Contract, OccupancyType } from '@/contexts/data-context'

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
  nights: number = 1
): PriceBreakdown {
  // Determine number of people based on occupancy
  const people = occupancy === 'single' ? 1 : occupancy === 'double' ? 2 : occupancy === 'triple' ? 3 : 4

  // Base calculations
  const cityTax = (contract.city_tax_per_person_per_night || 0) * people * nights
  const resortFee = (contract.resort_fee_per_night || 0) * nights
  
  // Subtotal before VAT
  const subtotal = baseRate + resortFee
  
  // VAT on subtotal (city tax usually not included in VAT base)
  const vat = subtotal * (contract.tax_rate || 0)
  
  // Supplier commission on base rate
  const supplierCommission = baseRate * (contract.supplier_commission_rate || 0)
  
  // Total cost to you
  const totalCost = subtotal + vat + cityTax + supplierCommission

  return {
    baseRate,
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

