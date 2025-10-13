// Hotel Plugin - Main Export File
// Provides a clean interface for the hotel inventory type

export { HotelContractForm } from './HotelContractForm'
export { HotelRateForm } from './HotelRateForm'
export { HotelRateGenerator, generateHotelRatesFromAllocations } from './HotelRateGenerator'

// Export types
export type {
  HotelContractMeta,
  HotelRoomAllocation,
  OccupancyRate,
  HotelBoardType,
  OccupancyType
} from './hotel-types'

export type { GeneratedHotelRate } from './HotelRateGenerator'

// Plugin metadata
export const HOTEL_PLUGIN_INFO = {
  name: 'Hotel Plugin',
  version: '1.0.0',
  description: 'Specialized plugin for hotel inventory management',
  features: [
    'Room allocations with shared pools',
    'Occupancy-based pricing (single, double, triple, quad)',
    'Board type variations (BB, HB, FB, AI)',
    'Automatic rate generation from allocations',
    'Attrition and cancellation rules',
    'Payment terms management'
  ],
  supportedInventoryTypes: ['hotel']
} as const
