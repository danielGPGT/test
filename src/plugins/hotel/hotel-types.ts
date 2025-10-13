// Hotel Plugin - Type Definitions
// Extends the core unified types with hotel-specific fields

// Import core types first
import type { OccupancyType, BoardType } from '@/contexts/data-context'

export interface HotelContractMeta {
  // Hotel-specific contract metadata
  room_allocations: HotelRoomAllocation[]
  attrition_rules?: {
    attrition_date: string
    attrition_percentage: number
  }
  cancellation_rules?: {
    cancellation_date: string
    cancellation_penalty: number
    cancellation_description?: string
  }
  payment_terms?: {
    payment_date: string
    payment_amount: number
  }
  board_types: BoardType[] // Which board types this contract supports
}

export interface HotelRoomAllocation {
  room_group_ids: string[] // References hotel.room_groups[].id - can be multiple for shared pools
  quantity: number // Number of rooms allocated (shared across all room types in this allocation)
  occupancy_rates?: OccupancyRate[] // Optional: specific occupancy rates for this allocation
  base_rate?: number // Optional: flat rate for this allocation (overrides contract base_rate)
  label?: string // Optional label for the allocation (e.g., "Run of House", "Suites")
  allocation_pool_id?: string // Optional: ID linking multiple rates to the same physical room inventory
}

export interface OccupancyRate {
  occupancy_type: OccupancyType
  rate: number // Base rate for this occupancy
}

export interface HotelRateMeta {
  // Hotel-specific rate metadata
  room_group_id: string // References hotel.room_groups[].id
  occupancy_type: OccupancyType // Single, Double, Triple, or Quad
  board_type: BoardType // Meal plan included
  allocation_pool_id?: string // Links multiple rates to the same physical room inventory
  shoulder_rates?: {
    shoulder_start: string
    shoulder_end: string
    shoulder_percentage: number // e.g., 1.2 for 20% premium
  }
  city_resort_fees?: {
    city_fee: number
    resort_fee: number
    tax_rate: number
  }
}

// Re-export core types for convenience
export type { OccupancyType, BoardType }

// Hotel-specific board types (simplified from the full BoardType)
export type HotelBoardType = 'bb' | 'hb' | 'fb' | 'ai'

// Map to full BoardType for compatibility
export const BOARD_TYPE_MAP: Record<HotelBoardType, BoardType> = {
  bb: 'bed_breakfast',
  hb: 'half_board', 
  fb: 'full_board',
  ai: 'all_inclusive'
}
