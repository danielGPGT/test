// Hotel Plugin - Rate Generation Logic
// Automatically generates rates from room allocations in hotel contracts

import { HotelRoomAllocation, HotelBoardType } from './hotel-types'
import { InventoryItem } from '@/types/unified-inventory'

export interface GeneratedHotelRate {
  // Core rate fields
  contract_id: number
  item_id: number
  itemName: string
  item_type: 'hotel'
  category_id: string
  categoryName: string
  supplier_id: number
  supplierName: string
  tour_ids?: number[]
  tourNames?: string[]
  
  // Pricing
  base_rate: number
  markup_percentage: number
  selling_price: number
  
  // Hotel-specific fields
  occupancy_type: 'single' | 'double' | 'triple' | 'quad'
  board_type: HotelBoardType
  allocation_pool_id?: string
  
  // Dates and validity
  valid_from: string
  valid_to: string
  days_of_week: number[]
  active: boolean
  
  // Rate details (hotel-specific)
  rate_details: {
    room_type: string
    occupancy_type: string
    board_type: string
    pricing_unit: 'per_room_per_night'
    capacity_info: {
      min_occupancy: number
      max_occupancy: number
    }
  }
}

export class HotelRateGenerator {
  private item: InventoryItem
  private contract: {
    id: number
    contract_name: string
    supplier_id: number
    supplierName: string
    tour_ids?: number[]
    tourNames?: string[]
    valid_from: string
    valid_to: string
    markup_percentage: number
    days_of_week: number[]
  }

  constructor(
    item: InventoryItem,
    contract: {
      id: number
      contract_name: string
      supplier_id: number
      supplierName: string
      tour_ids?: number[]
      tourNames?: string[]
      valid_from: string
      valid_to: string
      markup_percentage: number
      days_of_week: number[]
    }
  ) {
    this.item = item
    this.contract = contract
  }

  /**
   * Generate rates from room allocations
   * Creates one rate per room group × occupancy type × board type combination
   */
  generateRatesFromAllocations(allocations: HotelRoomAllocation[]): GeneratedHotelRate[] {
    const generatedRates: GeneratedHotelRate[] = []
    
    // Board types to generate rates for
    const boardTypes: HotelBoardType[] = ['bb', 'hb', 'fb', 'ai']
    
    for (const allocation of allocations) {
      // Generate rates for each room group in this allocation
      for (const roomGroupId of allocation.room_group_ids) {
        const roomGroup = this.item.categories.find(cat => cat.id === roomGroupId)
        if (!roomGroup) continue
        
        // If allocation has specific occupancy rates, use those
        if (allocation.occupancy_rates && allocation.occupancy_rates.length > 0) {
          for (const occupancyRate of allocation.occupancy_rates) {
            for (const boardType of boardTypes) {
              const baseRate = occupancyRate.rate
              const sellingPrice = baseRate * (1 + this.contract.markup_percentage)
              
              generatedRates.push({
                contract_id: this.contract.id,
                item_id: this.item.id,
                itemName: this.item.name,
                item_type: 'hotel',
                category_id: roomGroupId,
                categoryName: roomGroup.category_name,
                supplier_id: this.contract.supplier_id,
                supplierName: this.contract.supplierName,
                tour_ids: this.contract.tour_ids,
                tourNames: this.contract.tourNames,
                
                base_rate: baseRate,
                markup_percentage: this.contract.markup_percentage,
                selling_price: sellingPrice,
                
                occupancy_type: occupancyRate.occupancy_type,
                board_type: boardType,
                allocation_pool_id: allocation.allocation_pool_id,
                
                valid_from: this.contract.valid_from,
                valid_to: this.contract.valid_to,
                days_of_week: this.contract.days_of_week,
                active: true,
                
                rate_details: {
                  room_type: roomGroup.category_name,
                  occupancy_type: occupancyRate.occupancy_type,
                  board_type: boardType,
                  pricing_unit: 'per_room_per_night',
                  capacity_info: {
                    min_occupancy: this.getMinOccupancy(occupancyRate.occupancy_type),
                    max_occupancy: this.getMaxOccupancy(occupancyRate.occupancy_type)
                  }
                }
              })
            }
          }
        } else {
          // Use default rates if no specific occupancy rates defined
          const defaultOccupancyTypes: Array<'single' | 'double' | 'triple' | 'quad'> = ['single', 'double', 'triple', 'quad']
          
          for (const occupancyType of defaultOccupancyTypes) {
            for (const boardType of boardTypes) {
              // Use allocation base_rate or a default rate
              const baseRate = allocation.base_rate || 100 // Default base rate
              const sellingPrice = baseRate * (1 + this.contract.markup_percentage)
              
              generatedRates.push({
                contract_id: this.contract.id,
                item_id: this.item.id,
                itemName: this.item.name,
                item_type: 'hotel',
                category_id: roomGroupId,
                categoryName: roomGroup.category_name,
                supplier_id: this.contract.supplier_id,
                supplierName: this.contract.supplierName,
                tour_ids: this.contract.tour_ids,
                tourNames: this.contract.tourNames,
                
                base_rate: baseRate,
                markup_percentage: this.contract.markup_percentage,
                selling_price: sellingPrice,
                
                occupancy_type: occupancyType,
                board_type: boardType,
                allocation_pool_id: allocation.allocation_pool_id,
                
                valid_from: this.contract.valid_from,
                valid_to: this.contract.valid_to,
                days_of_week: this.contract.days_of_week,
                active: true,
                
                rate_details: {
                  room_type: roomGroup.category_name,
                  occupancy_type: occupancyType,
                  board_type: boardType,
                  pricing_unit: 'per_room_per_night',
                  capacity_info: {
                    min_occupancy: this.getMinOccupancy(occupancyType),
                    max_occupancy: this.getMaxOccupancy(occupancyType)
                  }
                }
              })
            }
          }
        }
      }
    }
    
    return generatedRates
  }

  /**
   * Get minimum occupancy for a given occupancy type
   */
  private getMinOccupancy(occupancyType: string): number {
    switch (occupancyType) {
      case 'single': return 1
      case 'double': return 2
      case 'triple': return 3
      case 'quad': return 4
      default: return 1
    }
  }

  /**
   * Get maximum occupancy for a given occupancy type
   */
  private getMaxOccupancy(occupancyType: string): number {
    switch (occupancyType) {
      case 'single': return 1
      case 'double': return 2
      case 'triple': return 3
      case 'quad': return 4
      default: return 2
    }
  }

  /**
   * Generate rates with custom parameters
   * Allows for more granular control over rate generation
   */
  generateCustomRates(
    roomGroupIds: string[],
    occupancyTypes: Array<'single' | 'double' | 'triple' | 'quad'>,
    boardTypes: HotelBoardType[],
    baseRates: { [key: string]: number }, // occupancy_type -> base_rate mapping
    allocationPoolId?: string
  ): GeneratedHotelRate[] {
    const generatedRates: GeneratedHotelRate[] = []
    
    for (const roomGroupId of roomGroupIds) {
      const roomGroup = this.item.categories.find(cat => cat.id === roomGroupId)
      if (!roomGroup) continue
      
      for (const occupancyType of occupancyTypes) {
        for (const boardType of boardTypes) {
          const baseRate = baseRates[occupancyType] || 100
          const sellingPrice = baseRate * (1 + this.contract.markup_percentage)
          
          generatedRates.push({
            contract_id: this.contract.id,
            item_id: this.item.id,
            itemName: this.item.name,
            item_type: 'hotel',
            category_id: roomGroupId,
            categoryName: roomGroup.category_name,
            supplier_id: this.contract.supplier_id,
            supplierName: this.contract.supplierName,
            tour_ids: this.contract.tour_ids,
            tourNames: this.contract.tourNames,
            
            base_rate: baseRate,
            markup_percentage: this.contract.markup_percentage,
            selling_price: sellingPrice,
            
            occupancy_type: occupancyType,
            board_type: boardType,
            allocation_pool_id: allocationPoolId,
            
            valid_from: this.contract.valid_from,
            valid_to: this.contract.valid_to,
            days_of_week: this.contract.days_of_week,
            active: true,
            
            rate_details: {
              room_type: roomGroup.category_name,
              occupancy_type: occupancyType,
              board_type: boardType,
              pricing_unit: 'per_room_per_night',
              capacity_info: {
                min_occupancy: this.getMinOccupancy(occupancyType),
                max_occupancy: this.getMaxOccupancy(occupancyType)
              }
            }
          })
        }
      }
    }
    
    return generatedRates
  }
}

/**
 * Utility function to generate hotel rates from allocations
 */
export function generateHotelRatesFromAllocations(
  item: InventoryItem,
  contract: {
    id: number
    contract_name: string
    supplier_id: number
    supplierName: string
    tour_ids?: number[]
    tourNames?: string[]
    valid_from: string
    valid_to: string
    markup_percentage: number
    days_of_week: number[]
  },
  allocations: HotelRoomAllocation[]
): GeneratedHotelRate[] {
  const generator = new HotelRateGenerator(item, contract)
  return generator.generateRatesFromAllocations(allocations)
}
