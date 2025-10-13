import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type {
  InventoryItem,
  UnifiedContract,
  UnifiedRate,
  Allocation,
  AllocationPoolCapacity,
  PoolBooking,
  RateCapacitySettings,
} from '@/types/unified-inventory'

// Types
export interface TourComponent {
  id: number
  tour_id: number
  component_type: 'accommodation' | 'transfer' | 'activity' | 'meal' | 'ticket' | 'other'
  
  // For accommodation components
  hotel_id?: number
  room_group_id?: string
  check_in_day: number              // Day number in tour (1, 2, 3, etc.)
  nights?: number
  board_type?: BoardType
  
  // Pricing (per couple - 2 people)
  pricing_mode: 'use_contract' | 'fixed_price' | 'use_service_inventory'
  fixed_cost_per_couple?: number
  fixed_sell_per_couple?: number
  
  // For service components (transfers, tickets, activities, meals)
  service_inventory_id?: number      // Link to ServiceInventory (if using inventory)
  service_name?: string              // Custom name (if not using inventory or override)
  provider?: string
  cost_per_couple?: number           // Manual pricing (if fixed_price mode)
  sell_per_couple?: number
  inventory_source?: 'contract' | 'buy_to_order'  // How this service will be sourced
  quantity_per_booking?: number      // e.g., 2 tickets per couple, 1 transfer per group
  pricing_unit?: 'per_person' | 'per_vehicle' | 'per_group' | 'flat_rate'  // How pricing is calculated
  
  // Package structure
  included_in_base_price: boolean
  optional_supplement_per_couple?: number
  
  // Display
  label: string
  description?: string
}

export interface Tour {
  id: number
  name: string
  start_date: string
  end_date: string
  description: string
  components?: TourComponent[]
  base_price_per_couple?: number
}

export interface RoomGroup {
  id: string
  room_type: string
  capacity: number
  description?: string
  features?: string
}

export interface Hotel {
  id: number
  name: string
  location: string
  description: string
  address?: string
  city?: string
  country?: string
  star_rating?: number
  phone?: string
  email?: string
  room_groups: RoomGroup[]
}

export interface BoardOption {
  board_type: BoardType
  additional_cost: number // Additional cost per PERSON per night
}

export interface AttritionStage {
  date: string // ISO date
  release_percentage: number // Percentage of rooms that can be released (e.g., 0.10 = 10%)
  releasable_rooms?: number // Calculated dynamically from allocated rooms
}

export interface CancellationStage {
  cutoff_date: string // ISO date
  penalty_percentage: number // Charge if cancelled (e.g., 0.50 = 50% of total)
  penalty_description?: string // e.g., "50% of total contract value"
}

export interface PaymentSchedule {
  payment_date: string // ISO date
  amount_due: number // Amount due on this date
  paid: boolean // Whether payment has been made
  paid_date?: string // When payment was actually made
  notes?: string
}

export interface RoomAllocation {
  room_group_ids: string[] // References hotel.room_groups[].id - can be multiple for shared pools (e.g., "Run of House")
  quantity: number // Number of rooms allocated (shared across all room types in this allocation)
  occupancy_rates?: OccupancyRate[] // Optional: specific occupancy rates for this allocation (overrides contract defaults)
  base_rate?: number // Optional: flat rate for this allocation (overrides contract base_rate for flat rate strategy)
  label?: string // Optional label for the allocation (e.g., "Run of House", "Suites")
  allocation_pool_id?: string // Optional: ID linking multiple rates to the same physical room inventory
}

export interface OccupancyRate {
  occupancy_type: OccupancyType
  rate: number // Base rate for this occupancy
}

export type SupplierType = 'direct' | 'dmc' | 'wholesaler' | 'bedbank' | 'consolidator' | 'other'

export interface Supplier {
  id: number
  name: string
  type: SupplierType
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  payment_terms?: string // e.g., "Net 30", "Prepayment", "Pay on Check-in"
  default_currency?: string
  website?: string
  notes?: string
  active: boolean
}

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'overdue'
export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'check' | 'cash' | 'other'
export type PaymentType = 'contract' | 'booking' // Contract payment vs per-booking payment

export type ServiceCategory = 'transfer' | 'activity' | 'ticket' | 'meal' | 'other'
export type ServiceRequestStatus = 'pending_details' | 'pending_booking' | 'confirmed' | 'completed' | 'cancelled'
export type ServicePricingUnit = 'per_person' | 'per_vehicle' | 'per_group' | 'flat_rate'
export type ServiceDirection = 'one_way' | 'inbound' | 'outbound' | 'round_trip'

// Service Inventory Type (like Hotel entity)
// e.g., "F1 Grand Prix Tickets", "Airport Transfers", "Circuit Transfers"
// Generic and reusable across tours - tour linking happens at contract/rate level
export interface ServiceInventoryType {
  id: number
  name: string // e.g., "F1 Grand Prix Tickets", "Airport Transfers" (generic, reusable)
  category: ServiceCategory // Main category: transfer, ticket, activity, meal, other
  location?: string // e.g., "Abu Dhabi, UAE" or leave generic
  description?: string
  service_categories: ServiceCategoryItem[] // Like room_groups in Hotel (e.g., "Grandstand", "VIP Lounge", "Paddock Club")
  active: boolean
}

// Service Category Item (like RoomGroup)
// e.g., "Grandstand - Main Straight", "Private Sedan", "Shared Shuttle"
export interface ServiceCategoryItem {
  id: string
  category_name: string // e.g., "Grandstand - Main Straight", "Private Sedan Transfer"
  pricing_unit: ServicePricingUnit // How this service is priced
  description?: string
  features?: string
  min_pax?: number
  max_pax?: number
}

// Service Contract (like hotel Contract)
export interface ServiceContract {
  id: number
  supplier_id: number
  supplierName: string
  inventory_type_id: number // Link to ServiceInventoryType (like hotel_id)
  inventoryTypeName: string
  tour_id?: number // OPTIONAL - link to specific tour (e.g., Abu Dhabi F1 GP 2025)
  tourName?: string // Auto-populated from tour
  contract_name: string
  
  // Date range
  valid_from: string // ISO date
  valid_to: string // ISO date
  
  // Allocation (for contracted services - like room_allocations)
  service_allocations: ServiceAllocation[]
  
  // Pricing
  pricing_strategy: 'per_unit' | 'tiered' // per_unit = flat rate, tiered = volume discounts
  markup_percentage: number // e.g., 0.60 = 60% markup
  tax_rate?: number // e.g., 0.05 = 5% VAT
  service_fee?: number // Fixed fee per booking
  
  // Payment tracking
  contracted_payment_total?: number
  adjusted_payment_total?: number
  adjustment_notes?: string
  payment_schedule?: PaymentSchedule[]
  
  // Terms
  cancellation_policy?: string
  notes?: string
  active: boolean
}

// Service Allocation (like RoomAllocation)
export interface ServiceAllocation {
  category_ids: string[] // References inventory_type.service_categories[].id
  quantity: number // Number of units allocated (e.g., 100 shuttle seats, 50 tickets)
  base_rate?: number // Base cost per unit for this allocation (optional - can set per category in rates)
  label?: string // e.g., "F1 Weekend Block", "December Shuttles"
}

// Service Rate (like hotel Rate - generated from contracts or manual for buy-to-order)
export interface ServiceRate {
  id: number
  contract_id?: number // Optional - null if buy-to-order estimate
  contractName?: string
  inventory_type_id: number // Link to ServiceInventoryType (like hotel_id)
  inventoryTypeName: string
  category_id: string // Link to ServiceCategoryItem (like room_group_id)
  categoryName: string
  tour_id?: number // OPTIONAL - link to tour (inherits from contract, or manual for buy-to-order)
  tourName?: string // Auto-populated
  
  // Pricing
  base_rate: number // Base cost per unit
  pricing_unit: ServicePricingUnit // Inherited from category
  markup_percentage: number
  selling_price: number // Calculated: base_rate * (1 + markup)
  currency: string
  
  // Direction (for transfers and other directional services)
  direction?: ServiceDirection // e.g., 'inbound', 'outbound', 'round_trip', 'one_way'
  paired_rate_id?: number // Optional: link to return journey rate
  
  // Inventory tracking (only for contracted services)
  inventory_type: 'contract' | 'buy_to_order'
  allocated_quantity?: number // Total allocated (if contract)
  available_quantity?: number // Currently available (if contract)
  
  // Validity
  valid_from: string
  valid_to: string
  
  // Day-of-week availability (MWTTFSS)
  days_of_week?: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
  
  // Status
  active: boolean
  inactive_reason?: string
}

export interface ServiceRequest {
  id: number
  booking_id: number
  bookingRef: string
  customerName: string
  service_type: ServiceCategory
  service_name: string
  description?: string
  
  // Service-specific details (filled by operations)
  details?: {
    // For transfers
    from?: string
    to?: string
    date?: string
    time?: string
    flight_number?: string
    vehicle_type?: string // "Private Sedan", "Shared Shuttle", "Minibus"
    
    // For activities/tickets
    venue?: string
    event_date?: string
    event_time?: string
    ticket_type?: string
    quantity?: number
    
    // Common
    pax_count?: number
    special_requirements?: string
  }
  
  // Operations & Costs
  status: ServiceRequestStatus
  supplier_id?: number
  supplierName?: string
  estimated_cost?: number
  actual_cost?: number
  confirmation_number?: string
  notes?: string
  
  // Dates
  created_date: string
  updated_date?: string
}

export interface Payment {
  id: number
  payment_type: PaymentType
  supplier_id: number
  supplierName: string
  description?: string // e.g., "Deposit", "2nd Installment", "Final Balance"
  
  // For contract payments
  contract_id?: number
  contractName?: string
  
  // For booking payments
  booking_ids?: number[] // Which bookings this payment covers
  
  // Payment details
  amount: number // Actual amount being paid (this specific payment)
  currency: string
  due_date: string // ISO date - when payment is due
  payment_date?: string // ISO date - when actually paid
  status: PaymentStatus
  payment_method?: PaymentMethod
  reference_number?: string // Bank ref, check #, transaction ID
  notes?: string
  created_date: string // When payment record was created
}

export interface Contract {
  id: number
  supplier_id: number
  supplierName: string
  hotel_id: number
  hotelName: string
  contract_name: string
  start_date: string
  end_date: string
  total_rooms: number
  base_rate: number
  currency: string
  
  // Payment adjustments (for attrition/cancellations)
  adjusted_payment_total?: number // Adjusted amount after releases/cancellations
  adjustment_notes?: string // Why the adjustment was made
  
  // TOUR LINKING (optional - link contract to specific tours)
  tour_ids?: number[] // Optional: link to specific tours
  
  // ROOM ALLOCATIONS (replaces Stock entity)
  room_allocations?: RoomAllocation[] // Allocated rooms per room type
  
  // OCCUPANCY PRICING STRATEGY
  pricing_strategy?: 'per_occupancy' | 'flat_rate' // How rates vary by occupancy
  occupancy_rates?: OccupancyRate[] // If per_occupancy, rates for each occupancy type
  
  // MARKUP SETTINGS
  markup_percentage?: number // Default markup for regular nights (e.g., 0.60 = 60%)
  
  // Stay restrictions
  days_of_week?: {
    mon: boolean
    tue: boolean
    wed: boolean
    thu: boolean
    fri: boolean
    sat: boolean
    sun: boolean
  }
  min_nights?: number
  max_nights?: number
  // Tax and fees
  tax_rate?: number // VAT/Sales tax (percentage, e.g., 0.12 = 12%)
  city_tax_per_person_per_night?: number // Mandatory city tax (fixed amount)
  resort_fee_per_night?: number // Resort/facility fee per room per night
  // Commission
  supplier_commission_rate?: number // What hotel/supplier charges you (percentage)
  // Board/Meal plan options
  board_options?: BoardOption[] // Available board types and their costs
  // Shoulder nights are now handled as separate rates with is_shoulder flag
  // Attrition (room reduction stages)
  attrition_stages?: AttritionStage[] // Dates when rooms can be released with penalties
  // Cancellation (full cancellation penalties)
  cancellation_stages?: CancellationStage[] // Penalty charges if contract fully cancelled
  // Payment tracking
  contracted_payment_total?: number // Total contracted amount to pay hotel
  payment_schedule?: PaymentSchedule[] // Payment dates and amounts
  notes?: string
}

export type OccupancyType = 'single' | 'double' | 'triple' | 'quad'
export type BoardType = 'room_only' | 'bed_breakfast' | 'half_board' | 'full_board' | 'all_inclusive'

export type ShoulderType = 'none' | 'pre' | 'post'

export interface Rate {
  id: number
  contract_id?: number // Optional for buy-to-order rates
  contractName?: string
  hotel_id?: number // For buy-to-order rates without contract
  hotelName?: string
  tour_id?: number // Optional: link rate to specific tour (for buy-to-order or contract rates)
  tourName?: string // Auto-populated from tour
  room_group_id: string // References hotel.room_groups[].id
  roomName: string
  occupancy_type: OccupancyType // Single, Double, Triple, or Quad
  board_type: BoardType // Meal plan included
  
  // ALLOCATION POOL (for multi-rate periods)
  allocation_pool_id?: string // Links multiple rates to the same physical room inventory
  
  // RATE STRUCTURE
  rate: number // Base room rate for this occupancy
  board_cost?: number // Board cost (per person per night for contract, total for buy-to-order)
  
  // SHOULDER NIGHT SUPPORT (NEW: Separate rate approach)
  is_shoulder?: boolean // Flag indicating this is a shoulder rate
  shoulder_type?: ShoulderType // Type of shoulder rate (pre/post/none)
  linked_main_rate_id?: number // Optional: link to the main rate this shoulders
  
  // STATUS
  active?: boolean // Whether this rate is available for booking (default: true)
  inactive_reason?: string // Optional reason for inactivity
  
  // VALIDITY & RESTRICTIONS
  valid_from?: string // Validity start date (required for buy-to-order and shoulder rates)
  valid_to?: string // Validity end date (required for buy-to-order and shoulder rates)
  min_nights?: number // Minimum nights (overrides contract, required for buy-to-order)
  max_nights?: number // Maximum nights (overrides contract, required for buy-to-order)
  estimated_costs?: boolean // Flag to indicate this is an estimated rate
  
  // Shoulder nights are now handled as separate rates with is_shoulder flag
  
  // RATE-LEVEL COSTS (per room per night, unless specified)
  // For contract rates: optional overrides
  // For buy-to-order rates: required estimated costs
  tax_rate?: number // VAT/Sales tax
  city_tax_per_person_per_night?: number // City tax per person
  resort_fee_per_night?: number // Resort fee per room
  supplier_commission_rate?: number // Commission rate (expected discount)
  
  // MARKUP SETTINGS
  markup_percentage?: number // Default markup for regular nights (e.g., 0.60 = 60%)
  
  // Other
  currency?: string
  board_included?: boolean // Deprecated - kept for backwards compatibility
}

export interface Listing {
  id: number
  tour_id: number
  tourName: string
  
  // SIMPLIFIED: Just link tour to contract OR hotel
  contract_id?: number // For inventory (pre-contracted)
  contractName?: string
  hotel_id?: number // For buy-to-order (ad-hoc)
  hotelName?: string
  
  room_group_id: string // Which room type from the hotel
  roomName: string
  purchase_type: 'inventory' | 'buy_to_order'
  
  // Legacy fields (kept for backwards compatibility, not used in new flow)
  stock_id?: number
  quantity?: number
  cost_price?: number
  selling_price?: number
  commission_rate?: number
  shoulder_night_margin?: number
  markup_percentage?: number
  markup_type?: 'percentage' | 'fixed'
  markup_fixed_amount?: number
  sold?: number
}

/**
 * @deprecated Stock entity has been merged into Contract.room_allocations
 * This interface is kept for backward compatibility only
 */
export interface Stock {
  id: number
  contract_id: number
  room_group_id: string
  roomName: string
  quantity: number
  notes?: string
}

export interface Activity {
  title: string
  description: string
  time: string
}

export interface Summary {
  activeToursCount: number
  availableRoomsCount: number
  upcomingContractsCount: number
}

export interface BookingRoom {
  listing_id: number
  rate_id: number
  hotelName: string
  roomName: string
  contractName: string
  occupancy_type: OccupancyType
  board_type: BoardType
  purchase_type: 'inventory' | 'buy_to_order'
  quantity: number // Number of this specific room type
  guests_count?: number // Number of guests in this room
  price_per_room: number // Price per room for the entire stay
  total_price: number // quantity × price_per_room
  estimated_cost_per_room?: number // Estimated cost per room (for buy-to-order variance tracking)
  // Purchase status for this room (for buy-to-order)
  purchase_status?: 'not_required' | 'pending_purchase' | 'purchased' | 'failed'
  purchase_order?: {
    assigned_to?: string
    hotel_contact?: string
    purchase_date?: string
    hotel_confirmation?: string
    cost_per_room?: number
    total_cost?: number
    notes?: string
  }
  // Payment tracking
  payment_status?: 'not_required' | 'pending' | 'paid' | 'partial' | 'overdue'
  payment_ids?: number[] // IDs of payments that cover this room
  // Conversion tracking
  original_purchase_type?: 'buy_to_order'
  converted_from_buy_to_order?: boolean
  conversion_date?: string
  conversion_notes?: string
}

export interface Booking {
  id: number
  tour_id: number
  tourName: string
  customer_name: string
  customer_email: string
  customer_phone: string
  // Date-based booking
  check_in_date: string // ISO format date
  check_out_date: string // ISO format date
  nights: number // Calculated: number of nights
  // Rooms in this booking
  rooms: BookingRoom[]
  // Pricing
  total_price: number // Sum of all rooms
  booking_date: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

interface DataContextType {
  summary: Summary
  tours: Tour[]
  tourComponents: TourComponent[]
  hotels: Hotel[]
  suppliers: Supplier[]
  contracts: Contract[]
  rates: Rate[]
  stocks: Stock[]
  listings: Listing[]
  bookings: Booking[]
  payments: Payment[]
  serviceRequests: ServiceRequest[]
  serviceInventoryTypes: ServiceInventoryType[]
  serviceContracts: ServiceContract[]
  serviceRates: ServiceRate[]
  recentActivity: Activity[]
  hotelLocations: string[]
  addTour: (tour: Omit<Tour, 'id'>) => void
  updateTour: (id: number, tour: Partial<Tour>) => void
  deleteTour: (id: number) => void
  addTourComponent: (component: Omit<TourComponent, 'id'>) => void
  updateTourComponent: (id: number, component: Partial<TourComponent>) => void
  deleteTourComponent: (id: number) => void
  addHotel: (hotel: Omit<Hotel, 'id'>) => void
  updateHotel: (id: number, hotel: Partial<Hotel>) => void
  deleteHotel: (id: number) => void
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void
  updateSupplier: (id: number, supplier: Partial<Supplier>) => void
  deleteSupplier: (id: number) => void
  addPayment: (payment: Omit<Payment, 'id' | 'supplierName' | 'contractName' | 'created_date'>) => void
  updatePayment: (id: number, payment: Partial<Payment>) => void
  deletePayment: (id: number) => void
  recordPayment: (paymentId: number, paymentDate: string, paymentMethod: PaymentMethod, referenceNumber?: string) => void
  addServiceRequest: (request: Omit<ServiceRequest, 'id' | 'bookingRef' | 'customerName' | 'created_date'>) => void
  updateServiceRequest: (id: number, request: Partial<ServiceRequest>) => void
  deleteServiceRequest: (id: number) => void
  addServiceInventoryType: (inventoryType: Omit<ServiceInventoryType, 'id'>) => void
  updateServiceInventoryType: (id: number, inventoryType: Partial<ServiceInventoryType>) => void
  deleteServiceInventoryType: (id: number) => void
  addServiceContract: (contract: Omit<ServiceContract, 'id' | 'supplierName' | 'inventoryTypeName' | 'tourName'>) => void
  updateServiceContract: (id: number, contract: Partial<ServiceContract>) => void
  deleteServiceContract: (id: number) => void
  addServiceRate: (rate: Omit<ServiceRate, 'id' | 'contractName' | 'inventoryTypeName' | 'categoryName' | 'selling_price' | 'tourName'>) => void
  updateServiceRate: (id: number, rate: Partial<ServiceRate>) => void
  deleteServiceRate: (id: number) => void
  addContract: (contract: Omit<Contract, 'id' | 'hotelName' | 'supplierName'>) => void
  updateContract: (id: number, contract: Partial<Contract>) => void
  deleteContract: (id: number) => void
  addRate: (rate: Omit<Rate, 'id' | 'contractName' | 'roomName'>) => void
  updateRate: (id: number, rate: Partial<Rate>) => void
  deleteRate: (id: number) => void
  addStock: (stock: Omit<Stock, 'id' | 'roomName'>) => void
  updateStock: (id: number, stock: Partial<Stock>) => void
  deleteStock: (id: number) => void
  addListing: (listing: Omit<Listing, 'id' | 'tourName' | 'contractName' | 'roomName'>) => void
  updateListing: (id: number, listing: Partial<Listing>) => void
  deleteListing: (id: number) => void
  addBooking: (booking: Omit<Booking, 'id' | 'tourName' | 'booking_date' | 'status'>) => void
  updateBooking: (id: number, booking: Partial<Booking>) => void
  cancelBooking: (id: number) => void
  recordPurchaseDetails: (bookingId: number, purchaseDetails: {
    assigned_to: string
    hotel_contact: string
    hotel_confirmation: string
    cost_per_room: number
    notes?: string
  }) => void
  resetAllData: () => void
  
  // Buy-to-Order Conversion Functions
  detectBuyToOrderConversions: (contract: Contract) => ConversionCandidate[]
  convertBuyToOrderBooking: (bookingId: number, contractId: number, notes?: string) => void
  convertBuyToOrderRoom: (bookingId: number, roomIndex: number, contractId: number, notes?: string) => boolean
  getConversionHistory: () => ConversionHistory[]
  
  // NEW: Unified Inventory System
  inventoryItems: InventoryItem[]
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'created_at'>) => InventoryItem
  updateInventoryItem: (id: number, updates: Partial<InventoryItem>) => void
  deleteInventoryItem: (id: number) => void
  unifiedContracts: UnifiedContract[]
  addUnifiedContract: (contract: Omit<UnifiedContract, 'id' | 'itemName' | 'supplierName' | 'item_type' | 'tourNames' | 'created_at'>) => UnifiedContract
  updateUnifiedContract: (id: number, updates: Partial<UnifiedContract>) => void
  deleteUnifiedContract: (id: number) => void
  unifiedRates: UnifiedRate[]
  addUnifiedRate: (rate: Omit<UnifiedRate, 'id' | 'selling_price' | 'itemName' | 'categoryName' | 'contractName' | 'item_type' | 'tourName' | 'created_at'>) => UnifiedRate
  updateUnifiedRate: (id: number, updates: Partial<UnifiedRate>) => void
  deleteUnifiedRate: (id: number) => void
  
  // NEW: Standalone allocations
  allocations: Allocation[]
  setAllocations: (allocations: Allocation[]) => void
  addAllocation: (allocation: Omit<Allocation, 'id' | 'itemName' | 'supplierName' | 'contractName' | 'tourNames' | 'created_at'>) => Allocation
  updateAllocation: (id: number, updates: Partial<Allocation>) => void
  deleteAllocation: (id: number) => void
  
  // NEW: Pool-centric capacity management
  allocationPoolCapacity: AllocationPoolCapacity[]
  setAllocationPoolCapacity: (pools: AllocationPoolCapacity[]) => void
  addAllocationPoolCapacity: (pool: Omit<AllocationPoolCapacity, 'id' | 'last_updated'>) => AllocationPoolCapacity
  updateAllocationPoolCapacity: (poolId: string, updates: Partial<AllocationPoolCapacity>) => void
  deleteAllocationPoolCapacity: (poolId: string) => void
  poolBookings: PoolBooking[]
  addPoolBooking: (booking: Omit<PoolBooking, 'id' | 'created_at' | 'updated_at'>) => PoolBooking
  updatePoolBooking: (id: string, updates: Partial<PoolBooking>) => void
  deletePoolBooking: (id: string) => void
  rateCapacitySettings: RateCapacitySettings[]
  addRateCapacitySettings: (settings: Omit<RateCapacitySettings, 'id'>) => RateCapacitySettings
  updateRateCapacitySettings: (rateId: number, updates: Partial<RateCapacitySettings>) => void
  deleteRateCapacitySettings: (rateId: number) => void
}

export interface ConversionCandidate {
  bookingId: number
  customerName: string
  customerEmail: string
  tourName: string
  checkInDate: string
  checkOutDate: string
  rooms: Array<{
    roomName: string
    occupancy_type: OccupancyType
    board_type: BoardType
    quantity: number
    originalPrice: number
    newContractRate: number
    priceDifference: number
    rateId: number
  }>
  totalOriginalPrice: number
  totalNewPrice: number
  totalSavings: number
  canConvert: boolean
  reason?: string
}

export interface ConversionHistory {
  id: number
  bookingId: number
  customerName: string
  contractId: number
  contractName: string
  conversionDate: string
  originalPrice: number
  newPrice: number
  savings: number
  notes?: string
}

const DataContext = createContext<DataContextType | undefined>(undefined)

// Initial mock data
const initialData = {
  summary: {
    activeToursCount: 12,
    availableRoomsCount: 64,
    upcomingContractsCount: 3
  },
  tours: [
    {
      id: 1,
      name: "Spring in Paris",
      start_date: "2025-05-05",
      end_date: "2025-05-09",
      description: "Enjoy the blossoms and culture of Paris in early May."
    },
    {
      id: 2,
      name: "Autumn in Rome",
      start_date: "2025-10-15",
      end_date: "2025-10-20",
      description: "Discover the history and cuisine of Rome in the fall."
    },
    {
      id: 3,
      name: "Abu Dhabi F1 Grand Prix 2025",
      start_date: "2025-12-04",
      end_date: "2025-12-08",
      description: "Experience the thrill of Formula 1 at Yas Marina Circuit with 4 nights accommodation, airport transfers, circuit transfers, and 3-day F1 tickets."
    }
  ],
  payments: [],
  serviceInventoryTypes: [
    // F1 Grand Prix Tickets (Generic - reusable across all F1 events)
    {
      id: 1,
      name: "F1 Grand Prix Tickets",
      category: "ticket" as const,
      location: "Various F1 Circuits",
      description: "Official F1 Grand Prix tickets for all seating sections (reusable across all F1 events)",
      service_categories: [
        {
          id: "f1-grandstand",
          category_name: "Grandstand - Main Straight",
          pricing_unit: "per_person" as const,
          description: "3-day pass with excellent track views",
          features: "Track view, F1 village access, big screen"
        },
        {
          id: "f1-vip",
          category_name: "VIP Lounge",
          pricing_unit: "per_person" as const,
          description: "Premium lounge with hospitality",
          features: "Lounge access, catering, open bar, pit walk"
        },
        {
          id: "f1-paddock",
          category_name: "Paddock Club",
          pricing_unit: "per_person" as const,
          description: "Ultimate F1 experience with paddock access",
          features: "Paddock access, gourmet dining, driver meet & greet, pit lane walk",
          min_pax: 1,
          max_pax: 10
        }
      ],
      active: true
    },
    // Circuit Transfers (Generic - reusable for F1/concerts/events at Yas Marina)
    {
      id: 2,
      name: "Yas Marina Circuit Transfers",
      category: "transfer" as const,
      location: "Abu Dhabi, UAE",
      description: "Shuttle services between hotels and Yas Marina Circuit (reusable for F1, concerts, events)",
      service_categories: [
        {
          id: "circuit-shared",
          category_name: "Shared Shuttle Service",
          pricing_unit: "per_person" as const,
          description: "Scheduled shuttle service, multiple pickup points",
          features: "Air-conditioned coach, 15-min frequency",
          min_pax: 1,
          max_pax: 50
        },
        {
          id: "circuit-private",
          category_name: "Private Transfer",
          pricing_unit: "per_vehicle" as const,
          description: "Private car service, door-to-door",
          features: "Luxury sedan, professional driver, flexible timing",
          min_pax: 1,
          max_pax: 4
        }
      ],
      active: true
    },
    // Airport Transfers (Generic - reusable across all UAE tours)
    {
      id: 3,
      name: "Abu Dhabi Airport Transfers",
      category: "transfer" as const,
      location: "Abu Dhabi, UAE",
      description: "Airport transfer services for all UAE tours (book via AtoB/Uber closer to date)",
      service_categories: [
        {
          id: "airport-private",
          category_name: "Private Sedan",
          pricing_unit: "per_vehicle" as const,
          description: "Private sedan for airport transfers",
          features: "Sedan, air-conditioned, meet & greet",
          min_pax: 1,
          max_pax: 3
        },
        {
          id: "airport-luxury",
          category_name: "Luxury SUV",
          pricing_unit: "per_vehicle" as const,
          description: "Premium SUV for airport transfers",
          features: "Luxury SUV, air-conditioned, meet & greet, WiFi",
          min_pax: 1,
          max_pax: 5
        }
      ],
      active: true
    }
  ],
  serviceContracts: [
    // F1 Abu Dhabi 2025 - Grandstand Tickets Contract (pre-purchased 50 tickets)
    {
      id: 1,
      supplier_id: 7,
      supplierName: "F1 Experiences Middle East",
      inventory_type_id: 1,
      inventoryTypeName: "F1 Grand Prix Tickets",
      tour_id: 3, // Linked to "Abu Dhabi F1 Grand Prix 2025"
      tourName: "Abu Dhabi F1 Grand Prix 2025",
      contract_name: "F1 Abu Dhabi 2025 - Grandstand Block",
      valid_from: "2025-12-05",
      valid_to: "2025-12-07",
      service_allocations: [
        {
          category_ids: ["f1-grandstand"],
          quantity: 50,
          base_rate: 400,
          label: "Grandstand Main Straight - F1 Weekend"
        }
      ],
      pricing_strategy: "per_unit" as const,
      markup_percentage: 0.50, // 50% markup
      tax_rate: 0.05, // 5% VAT
      contracted_payment_total: 20000, // 50 tickets × $400
      payment_schedule: [
        { payment_date: "2025-06-01", amount_due: 10000, paid: false, notes: "Deposit 50%" },
        { payment_date: "2025-11-01", amount_due: 10000, paid: false, notes: "Final balance" }
      ],
      notes: "50 Grandstand tickets for F1 weekend, issued 30 days before event",
      active: true
    },
    // F1 Abu Dhabi 2025 - Circuit Shuttle Contract (pre-purchased 100 seats)
    {
      id: 2,
      supplier_id: 6,
      supplierName: "UAE Premium Transfers",
      inventory_type_id: 2,
      inventoryTypeName: "Yas Marina Circuit Transfers",
      tour_id: 3, // Linked to "Abu Dhabi F1 Grand Prix 2025"
      tourName: "Abu Dhabi F1 Grand Prix 2025",
      contract_name: "F1 Abu Dhabi 2025 - Shuttle Block",
      valid_from: "2025-12-06",
      valid_to: "2025-12-07",
      service_allocations: [
        {
          category_ids: ["circuit-shared"],
          quantity: 100,
          base_rate: 30,
          label: "Circuit Shuttle - Saturday & Sunday"
        }
      ],
      pricing_strategy: "per_unit" as const,
      markup_percentage: 0.40, // 40% markup
      contracted_payment_total: 3000, // 100 seats × $30
      payment_schedule: [
        { payment_date: "2025-11-15", amount_due: 3000, paid: false, notes: "Full prepayment" }
      ],
      notes: "100 shuttle seats for Saturday and Sunday, round trip service",
      active: true
    }
  ],
  serviceRates: [
    // F1 Abu Dhabi 2025 - Grandstand Tickets (Contract-based)
    {
      id: 1,
      contract_id: 1,
      contractName: "F1 Abu Dhabi 2025 - Grandstand Block",
      inventory_type_id: 1,
      inventoryTypeName: "F1 Grand Prix Tickets",
      category_id: "f1-grandstand",
      categoryName: "Grandstand - Main Straight",
      tour_id: 3, // Inherited from contract
      tourName: "Abu Dhabi F1 Grand Prix 2025",
      base_rate: 400,
      pricing_unit: "per_person" as const,
      markup_percentage: 0.50,
      selling_price: 600, // $400 × 1.5
      currency: "USD",
      inventory_type: "contract" as const,
      allocated_quantity: 50,
      available_quantity: 28, // 22 sold
      valid_from: "2025-12-05",
      valid_to: "2025-12-07",
      days_of_week: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: true,
        sunday: true
      },
      active: true
    },
    // F1 Abu Dhabi 2025 - VIP Lounge (Buy-to-Order, no contract)
    {
      id: 2,
      contract_id: undefined,
      contractName: "",
      inventory_type_id: 1,
      inventoryTypeName: "F1 Grand Prix Tickets",
      category_id: "f1-vip",
      categoryName: "VIP Lounge",
      tour_id: 3, // Manually set for Abu Dhabi F1 2025
      tourName: "Abu Dhabi F1 Grand Prix 2025",
      base_rate: 1500,
      pricing_unit: "per_person" as const,
      markup_percentage: 0.40,
      selling_price: 2100,
      currency: "USD",
      inventory_type: "buy_to_order" as const,
      valid_from: "2025-12-05",
      valid_to: "2025-12-07",
      days_of_week: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: true,
        sunday: true
      },
      active: true
    },
    // F1 Abu Dhabi 2025 - Paddock Club (Buy-to-Order, no contract - exclusive)
    {
      id: 3,
      contract_id: undefined,
      contractName: "",
      inventory_type_id: 1,
      inventoryTypeName: "F1 Grand Prix Tickets",
      category_id: "f1-paddock",
      categoryName: "Paddock Club",
      tour_id: 3, // Manually set for Abu Dhabi F1 2025
      tourName: "Abu Dhabi F1 Grand Prix 2025",
      base_rate: 2500,
      pricing_unit: "per_person" as const,
      markup_percentage: 0.30,
      selling_price: 3250,
      currency: "USD",
      inventory_type: "buy_to_order" as const,
      valid_from: "2025-12-05",
      valid_to: "2025-12-07",
      days_of_week: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: true,
        sunday: true
      },
      active: true
    },
    // F1 Abu Dhabi 2025 - Circuit Shuttle (Contract-based, round trip)
    {
      id: 4,
      contract_id: 2,
      contractName: "F1 Abu Dhabi 2025 - Shuttle Block",
      inventory_type_id: 2,
      inventoryTypeName: "Yas Marina Circuit Transfers",
      category_id: "circuit-shared",
      categoryName: "Shared Shuttle Service",
      tour_id: 3, // Inherited from contract
      tourName: "Abu Dhabi F1 Grand Prix 2025",
      direction: "round_trip" as const, // Includes both ways to/from circuit
      base_rate: 30,
      pricing_unit: "per_person" as const,
      markup_percentage: 0.40,
      selling_price: 42,
      currency: "AED",
      inventory_type: "contract" as const,
      allocated_quantity: 100,
      available_quantity: 73, // 27 sold
      valid_from: "2025-12-06",
      valid_to: "2025-12-07",
      days_of_week: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: true,
        sunday: true
      },
      active: true
    },
    // F1 Abu Dhabi 2025 - Circuit Private Transfer (Buy-to-Order, round trip)
    {
      id: 5,
      contract_id: undefined,
      contractName: "",
      inventory_type_id: 2,
      inventoryTypeName: "Yas Marina Circuit Transfers",
      category_id: "circuit-private",
      categoryName: "Private Transfer",
      tour_id: 3, // Manually set for Abu Dhabi F1 2025
      tourName: "Abu Dhabi F1 Grand Prix 2025",
      direction: "round_trip" as const, // Round trip to/from circuit
      base_rate: 60,
      pricing_unit: "per_vehicle" as const,
      markup_percentage: 0.50,
      selling_price: 90,
      currency: "AED",
      inventory_type: "buy_to_order" as const,
      valid_from: "2025-12-06",
      valid_to: "2025-12-07",
      days_of_week: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: true,
        sunday: true
      },
      active: true
    },
    // Airport Transfer - Private Sedan - Arrival (Buy-to-Order, no contract, no tour - generic)
    {
      id: 6,
      contract_id: undefined,
      contractName: "",
      inventory_type_id: 3,
      inventoryTypeName: "Abu Dhabi Airport Transfers",
      category_id: "airport-private",
      categoryName: "Private Sedan",
      tour_id: undefined, // Generic - usable across all tours
      tourName: undefined,
      direction: "inbound" as const,
      paired_rate_id: 8, // Linked to departure transfer
      base_rate: 80,
      pricing_unit: "per_vehicle" as const,
      markup_percentage: 0.50,
      selling_price: 120,
      currency: "AED",
      inventory_type: "buy_to_order" as const,
      valid_from: "2025-12-01",
      valid_to: "2025-12-31",
      days_of_week: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true
      },
      active: true
    },
    // Airport Transfer - Luxury SUV - Arrival (Buy-to-Order, generic)
    {
      id: 7,
      contract_id: undefined,
      contractName: "",
      inventory_type_id: 3,
      inventoryTypeName: "Abu Dhabi Airport Transfers",
      category_id: "airport-luxury",
      categoryName: "Luxury SUV",
      tour_id: undefined, // Generic - usable across all tours
      tourName: undefined,
      direction: "inbound" as const,
      paired_rate_id: 9, // Linked to departure transfer
      base_rate: 150,
      pricing_unit: "per_vehicle" as const,
      markup_percentage: 0.40,
      selling_price: 210,
      currency: "AED",
      inventory_type: "buy_to_order" as const,
      valid_from: "2025-12-01",
      valid_to: "2025-12-31",
      days_of_week: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true
      },
      active: true
    },
    // Airport Transfer - Private Sedan - Departure (paired with id: 6)
    {
      id: 8,
      contract_id: undefined,
      contractName: "",
      inventory_type_id: 3,
      inventoryTypeName: "Abu Dhabi Airport Transfers",
      category_id: "airport-private",
      categoryName: "Private Sedan",
      tour_id: undefined,
      tourName: undefined,
      direction: "outbound" as const,
      paired_rate_id: 6, // Linked to arrival transfer
      base_rate: 80,
      pricing_unit: "per_vehicle" as const,
      markup_percentage: 0.50,
      selling_price: 120,
      currency: "AED",
      inventory_type: "buy_to_order" as const,
      valid_from: "2025-12-01",
      valid_to: "2025-12-31",
      days_of_week: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true
      },
      active: true
    },
    // Airport Transfer - Luxury SUV - Departure (paired with id: 7)
    {
      id: 9,
      contract_id: undefined,
      contractName: "",
      inventory_type_id: 3,
      inventoryTypeName: "Abu Dhabi Airport Transfers",
      category_id: "airport-luxury",
      categoryName: "Luxury SUV",
      tour_id: undefined,
      tourName: undefined,
      direction: "outbound" as const,
      paired_rate_id: 7, // Linked to arrival transfer
      base_rate: 150,
      pricing_unit: "per_vehicle" as const,
      markup_percentage: 0.40,
      selling_price: 210,
      currency: "AED",
      inventory_type: "buy_to_order" as const,
      valid_from: "2025-12-01",
      valid_to: "2025-12-31",
      days_of_week: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true
      },
      active: true
    }
  ],
  suppliers: [
    {
      id: 1,
      name: "Direct - Hotel Le Champs",
      type: "direct" as const,
      contact_name: "Pierre Dubois",
      contact_email: "reservations@hotellechamps.fr",
      contact_phone: "+33 1 42 65 78 90",
      payment_terms: "Net 30",
      default_currency: "EUR",
      website: "www.hotellechamps.fr",
      notes: "Direct contract with hotel, preferred partner",
      active: true
    },
    {
      id: 2,
      name: "Direct - Roma Palace",
      type: "direct" as const,
      contact_name: "Marco Rossi",
      contact_email: "booking@romapalace.it",
      contact_phone: "+39 06 678 90 12",
      payment_terms: "Prepayment",
      default_currency: "EUR",
      website: "www.romapalace.it",
      notes: "Direct contract, requires prepayment",
      active: true
    },
    {
      id: 3,
      name: "Hotelbeds",
      type: "bedbank" as const,
      contact_name: "Sarah Johnson",
      contact_email: "partners@hotelbeds.com",
      contact_phone: "+1 305 555 0123",
      payment_terms: "Net 45",
      default_currency: "USD",
      website: "www.hotelbeds.com",
      notes: "Global bedbank, good rates for volume",
      active: true
    },
    {
      id: 4,
      name: "Paris DMC Services",
      type: "dmc" as const,
      contact_name: "Amelie Laurent",
      contact_email: "contracts@parisdmc.fr",
      contact_phone: "+33 1 55 67 89 01",
      payment_terms: "Net 30",
      default_currency: "EUR",
      website: "www.parisdmc.fr",
      notes: "Local DMC for Paris, excellent service",
      active: true
    },
    {
      id: 5,
      name: "Yas Island Hotels",
      type: "direct" as const,
      contact_name: "Ahmed Al Mansouri",
      contact_email: "reservations@yashotels.ae",
      contact_phone: "+971 2 656 0000",
      payment_terms: "Net 30",
      default_currency: "AED",
      website: "www.yashotels.ae",
      notes: "Direct contract for Yas Island properties",
      active: true
    },
    {
      id: 6,
      name: "UAE Premium Transfers",
      type: "dmc" as const,
      contact_name: "Mohammed Hassan",
      contact_email: "bookings@uaetransfers.ae",
      contact_phone: "+971 50 123 4567",
      payment_terms: "Prepayment",
      default_currency: "AED",
      website: "www.uaetransfers.ae",
      notes: "Premium transfer services in Abu Dhabi and Dubai",
      active: true
    },
    {
      id: 7,
      name: "F1 Experiences Middle East",
      type: "consolidator" as const,
      contact_name: "Sarah Williams",
      contact_email: "partners@f1experiences.com",
      contact_phone: "+44 20 7123 4567",
      payment_terms: "Net 60",
      default_currency: "USD",
      website: "www.f1experiences.com",
      notes: "Official F1 ticket and hospitality provider",
      active: true
    }
  ],
  hotels: [
    {
      id: 1,
      name: "Hotel Le Champs",
      location: "Paris, FR",
      city: "Paris",
      country: "France",
      description: "Boutique hotel near the Champs‑Élysées.",
      star_rating: 4,
      room_groups: [
        {
          id: "rg-1",
          room_type: "Standard Double",
          capacity: 2,
          description: "Cozy room with two beds.",
          features: "Wi‑Fi, TV, minibar"
        },
        {
          id: "rg-2",
          room_type: "Deluxe Suite",
          capacity: 4,
          description: "Spacious suite with living area.",
          features: "Wi‑Fi, TV, minibar, kitchenette, balcony"
        }
      ]
    },
    {
      id: 2,
      name: "Roma Palace",
      location: "Rome, IT",
      city: "Rome",
      country: "Italy",
      description: "Luxury hotel in the heart of Rome.",
      star_rating: 5,
      room_groups: [
        {
          id: "rg-3",
          room_type: "Classic Room",
          capacity: 2,
          description: "Elegant room with city views.",
          features: "Wi‑Fi, TV, minibar, safe"
        }
      ]
    },
    {
      id: 4,
      name: "Yas Hotel Abu Dhabi",
      location: "Abu Dhabi, AE",
      city: "Abu Dhabi",
      country: "United Arab Emirates",
      description: "Iconic 5-star hotel on Yas Island, straddling the F1 circuit with direct access to Yas Marina Circuit.",
      star_rating: 5,
      room_groups: [
        {
          id: "rg-yas-1",
          room_type: "Superior Room",
          capacity: 2,
          description: "Modern room with marina or track views, king or twin beds.",
          features: "Wi-Fi, smart TV, minibar, safe, coffee machine, rain shower"
        },
        {
          id: "rg-yas-2",
          room_type: "Deluxe Room Track View",
          capacity: 2,
          description: "Premium room with direct views of the F1 circuit.",
          features: "Wi-Fi, smart TV, minibar, safe, Nespresso machine, premium bathroom amenities, balcony"
        }
      ]
    }
  ],
  contracts: [
    {
      id: 1,
      supplier_id: 1,
      supplierName: "Direct - Hotel Le Champs",
      hotel_id: 1,
      hotelName: "Hotel Le Champs",
      contract_name: "May 2025 Block",
      start_date: "2025-05-05",
      end_date: "2025-05-09",
      total_rooms: 100,
      base_rate: 120,
      currency: "EUR",
      // Room allocations (merged from Stock)
      room_allocations: [
        { 
          room_group_ids: ["rg-1"], 
          quantity: 60,
          // Can optionally override occupancy rates per allocation:
          // occupancy_rates: [
          //   { occupancy_type: 'single', rate: 90 },
          //   { occupancy_type: 'double', rate: 120 },
          //   { occupancy_type: 'triple', rate: 140 }
          // ]
        },
        { 
          room_group_ids: ["rg-2"], 
          quantity: 40
        }
      ],
      // Occupancy pricing strategy
      pricing_strategy: "per_occupancy" as const,
      occupancy_rates: [
        { occupancy_type: "single" as const, rate: 100 },
        { occupancy_type: "double" as const, rate: 130 },
        { occupancy_type: "triple" as const, rate: 150 }
      ],
      // Markup settings
      markup_percentage: 0.60,
      shoulder_markup_percentage: 0.30,
      days_of_week: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
      min_nights: 1,
      max_nights: 14,
      tax_rate: 0.10, // 10% VAT
      city_tax_per_person_per_night: 2.50, // 2.50 EUR per person per night
      resort_fee_per_night: 5.00, // 5 EUR per room per night
      supplier_commission_rate: 0.15, // 15% commission to hotel
      // Board/Meal plan options
      board_options: [
        { board_type: "room_only" as const, additional_cost: 0 },
        { board_type: "bed_breakfast" as const, additional_cost: 15 },
        { board_type: "half_board" as const, additional_cost: 35 },
        { board_type: "full_board" as const, additional_cost: 50 },
        { board_type: "all_inclusive" as const, additional_cost: 80 }
      ],
      // Shoulder night rates (base rate for shoulder periods)
      pre_shoulder_rates: [110, 105, 100], // May 4, May 3, May 2
      post_shoulder_rates: [130, 125, 135], // May 10, May 11, May 12
      // Attrition stages
      attrition_stages: [
        { date: "2025-03-01", release_percentage: 0.10 }, // Can release 10% by March 1
        { date: "2025-04-01", release_percentage: 0.05 }, // Can release 5% more by April 1
      ],
      // Cancellation policy
      cancellation_stages: [
        { cutoff_date: "2025-02-01", penalty_percentage: 0.25, penalty_description: "25% of total value" },
        { cutoff_date: "2025-03-15", penalty_percentage: 0.50, penalty_description: "50% of total value" },
        { cutoff_date: "2025-04-20", penalty_percentage: 1.00, penalty_description: "100% of total value (no refund)" },
      ],
      // Payment tracking
      contracted_payment_total: 12000, // Total contracted to pay hotel
      payment_schedule: [
        { payment_date: "2025-01-15", amount_due: 5000, paid: true, paid_date: "2025-01-14" },
        { payment_date: "2025-03-01", amount_due: 4000, paid: false },
        { payment_date: "2025-04-15", amount_due: 3000, paid: false },
      ],
      notes: "Spring seasonal rates with shoulder night pricing and meal plan options."
    }
  ],
  rates: [
    // These will be auto-generated from contract when created
    // Keeping sample data for reference
    {
      id: 1,
      contract_id: 1,
      contractName: "May 2025 Block",
      room_group_id: "rg-1",
      roomName: "Standard Double",
      occupancy_type: "single" as const,
      board_type: "bed_breakfast" as const,
      rate: 100, // Base room rate for single occupancy
      board_cost: 15, // Per person per night
      board_included: true,
      markup_percentage: 0.60,
      shoulder_markup_percentage: 0.30,
      currency: "EUR"
    },
    {
      id: 2,
      contract_id: 1,
      contractName: "May 2025 Block",
      room_group_id: "rg-1",
      roomName: "Standard Double",
      occupancy_type: "double" as const,
      board_type: "bed_breakfast" as const,
      rate: 130, // Base room rate for double occupancy
      board_cost: 15, // Per person per night
      board_included: true,
      markup_percentage: 0.60,
      shoulder_markup_percentage: 0.30,
      currency: "EUR"
    },
    {
      id: 3,
      contract_id: 1,
      contractName: "May 2025 Block",
      room_group_id: "rg-1",
      roomName: "Standard Double",
      occupancy_type: "triple" as const,
      board_type: "bed_breakfast" as const,
      rate: 150, // Base room rate for triple occupancy
      board_cost: 15, // Per person per night
      board_included: true,
      markup_percentage: 0.60,
      shoulder_markup_percentage: 0.30,
      currency: "EUR"
    },
    {
      id: 4,
      contract_id: 1,
      contractName: "May 2025 Block",
      room_group_id: "rg-1",
      roomName: "Standard Double",
      occupancy_type: "double" as const,
      board_type: "half_board" as const,
      rate: 160, // Base room rate for double occupancy
      board_cost: 35, // Per person per night (half board)
      board_included: true,
      markup_percentage: 0.60,
      shoulder_markup_percentage: 0.30,
      currency: "EUR"
    }
  ],
  stocks: [], // Deprecated - now managed in Contract.room_allocations
  listings: [
    {
      id: 1,
      tour_id: 1,
      tourName: "Spring in Paris",
      contract_id: 1,
      contractName: "May 2025 Block",
      room_group_id: "rg-1",
      roomName: "Standard Double",
      quantity: 80,
      purchase_type: "inventory" as const,
      cost_price: 130, // Net rate from contract
      selling_price: 165, // What customer pays
      commission_rate: 0.20, // 20% markup on base nights
      shoulder_night_margin: 0.25, // 25% markup on shoulder nights
      sold: 33
    },
    {
      id: 2,
      tour_id: 1,
      tourName: "Spring in Paris",
      hotel_id: 1, // Buy-to-order references hotel directly, not contract
      hotelName: "Hotel Le Champs",
      room_group_id: "rg-1",
      roomName: "Standard Double",
      quantity: 20, // Soft target for buy-to-order
      purchase_type: "buy_to_order" as const,
      cost_price: 135, // Estimated cost (will vary when actually purchased)
      selling_price: 180,
      commission_rate: 0.25, // 25% markup for buy-to-order flexibility
      shoulder_night_margin: 0.30, // 30% markup on shoulder nights
      sold: 0
    },
    {
      id: 3,
      tour_id: 1,
      tourName: "Spring in Paris",
      contract_id: 1,
      contractName: "May 2025 Block",
      room_group_id: "rg-1",
      roomName: "Standard Double",
      quantity: 20,
      purchase_type: "inventory" as const,
      cost_price: 100,
      selling_price: 125,
      commission_rate: 0.20,
      shoulder_night_margin: 0.22, // 22% markup on shoulder nights
      sold: 5
    }
  ],
  recentActivity: [
    { title: "New Tour Created", description: "Spring in Paris tour added by admin.", time: "2025-01-02 10:00" },
    { title: "Contract Updated", description: "May 2025 Block contract rates updated.", time: "2025-01-01 16:30" },
    { title: "Listing Sold", description: "5 rooms sold for May 2025 Block.", time: "2024-12-31 19:45" }
  ],
  hotelLocations: [
    "Paris, FR",
    "Rome, IT",
    "London, UK",
    "Abu Dhabi, AE"
  ],
  bookings: [
    {
      id: 1,
      tour_id: 1,
      tourName: "Spring in Paris",
      customer_name: "John Smith",
      customer_email: "john.smith@example.com",
      customer_phone: "+1 555-123-4567",
      check_in_date: "2025-05-05",
      check_out_date: "2025-05-07",
      nights: 2,
      rooms: [
        {
          listing_id: 1,
          rate_id: 1,
          hotelName: "Grand Hotel Paris",
          roomName: "Standard Double",
          contractName: "May 2025 Block",
          occupancy_type: "double" as const,
          board_type: "bed_breakfast" as const,
          purchase_type: "inventory" as const,
          quantity: 2,
          price_per_room: 140,
          total_price: 280,
          purchase_status: "not_required" as const,
        }
      ],
      total_price: 280,
      booking_date: "2025-01-15",
      status: "confirmed" as const,
    },
    {
      id: 2,
      tour_id: 3,
      tourName: "Abu Dhabi F1 Grand Prix 2025",
      customer_name: "Michael Rodriguez",
      customer_email: "michael.rodriguez@example.com",
      customer_phone: "+1 555-987-6543",
      check_in_date: "2025-12-04",
      check_out_date: "2025-12-08",
      nights: 4,
      rooms: [
        {
          listing_id: 0,
          rate_id: 0,
          hotelName: "Yas Hotel Abu Dhabi",
          roomName: "Deluxe Room Track View",
          contractName: "F1 Weekend Block",
          occupancy_type: "double" as const,
          board_type: "bed_breakfast" as const,
          purchase_type: "inventory" as const,
          quantity: 1,
          price_per_room: 450,
          total_price: 1800,
          purchase_status: "not_required" as const,
          guests_count: 2
        }
      ],
      total_price: 3750, // Hotel (1800) + Transfers (370) + Tickets (1200) + margin
      booking_date: "2025-01-20",
      status: "confirmed" as const,
    }
  ],
  serviceRequests: [
    // Mock service requests for F1 tour booking
    {
      id: 1,
      booking_id: 2,
      bookingRef: 'BK-2025-002',
      customerName: 'Michael Rodriguez',
      service_type: 'transfer' as const,
      service_name: 'Airport Transfer - Arrival (Abu Dhabi Airport to Yas Hotel)',
      description: 'Private transfer from airport to hotel',
      details: {
        from: 'Abu Dhabi International Airport',
        to: 'Yas Hotel Abu Dhabi',
        date: '2025-12-04',
        time: '14:30',
        flight_number: 'EY123',
        vehicle_type: 'Private Sedan',
        pax_count: 2,
        special_requirements: ''
      },
      status: 'pending_details' as const,
      supplier_id: 6,
      supplierName: 'UAE Premium Transfers',
      estimated_cost: 80,
      created_date: '2025-01-20',
      notes: ''
    },
    {
      id: 2,
      booking_id: 2,
      bookingRef: 'BK-2025-002',
      customerName: 'Michael Rodriguez',
      service_type: 'transfer' as const,
      service_name: 'Airport Transfer - Departure (Yas Hotel to Abu Dhabi Airport)',
      description: 'Private transfer from hotel to airport',
      details: {
        from: 'Yas Hotel Abu Dhabi',
        to: 'Abu Dhabi International Airport',
        date: '2025-12-08',
        time: '',
        flight_number: '',
        vehicle_type: 'Private Sedan',
        pax_count: 2,
        special_requirements: ''
      },
      status: 'pending_details' as const,
      supplier_id: 6,
      supplierName: 'UAE Premium Transfers',
      estimated_cost: 80,
      created_date: '2025-01-20',
      notes: 'Flight details pending - customer will provide closer to date'
    },
    {
      id: 3,
      booking_id: 2,
      bookingRef: 'BK-2025-002',
      customerName: 'Michael Rodriguez',
      service_type: 'transfer' as const,
      service_name: 'Circuit Transfer - Saturday (Hotel to Yas Marina Circuit)',
      description: 'Round trip transfer to F1 circuit for qualifying',
      details: {
        from: 'Yas Hotel Abu Dhabi',
        to: 'Yas Marina Circuit',
        date: '2025-12-06',
        time: '12:00',
        vehicle_type: 'Private Sedan',
        pax_count: 2,
        special_requirements: 'VIP entrance preferred'
      },
      status: 'confirmed' as const,
      supplier_id: 6,
      supplierName: 'UAE Premium Transfers',
      estimated_cost: 40,
      actual_cost: 35,
      confirmation_number: 'UAE-TRF-12345',
      created_date: '2025-01-20',
      updated_date: '2025-01-22',
      notes: 'Confirmed with supplier - driver will wait at hotel lobby'
    },
    {
      id: 4,
      booking_id: 2,
      bookingRef: 'BK-2025-002',
      customerName: 'Michael Rodriguez',
      service_type: 'transfer' as const,
      service_name: 'Circuit Transfer - Sunday (Hotel to Yas Marina Circuit)',
      description: 'Round trip transfer to F1 circuit for race day',
      details: {
        from: 'Yas Hotel Abu Dhabi',
        to: 'Yas Marina Circuit',
        date: '2025-12-07',
        time: '11:00',
        vehicle_type: 'Private Sedan',
        pax_count: 2,
        special_requirements: 'Race day - early pickup requested'
      },
      status: 'pending_booking' as const,
      supplier_id: 6,
      supplierName: 'UAE Premium Transfers',
      estimated_cost: 40,
      created_date: '2025-01-20',
      notes: 'Awaiting supplier confirmation for race day'
    },
    {
      id: 5,
      booking_id: 2,
      bookingRef: 'BK-2025-002',
      customerName: 'Michael Rodriguez',
      service_type: 'ticket' as const,
      service_name: 'F1 Abu Dhabi GP - 3-Day Grandstand Ticket (Fri-Sat-Sun)',
      description: 'F1 event tickets for 3 days including Friday practice, Saturday qualifying, and Sunday race',
      details: {
        venue: 'Yas Marina Circuit',
        event_date: '2025-12-05',
        event_time: '13:00',
        ticket_type: 'Grandstand - Main Straight',
        quantity: 2,
        pax_count: 2,
        special_requirements: 'Seats together preferred'
      },
      status: 'pending_booking' as const,
      supplier_id: 7,
      supplierName: 'F1 Experiences Middle East',
      estimated_cost: 800,
      created_date: '2025-01-20',
      notes: 'Tickets to be issued 30 days before event'
    }
  ],
  tourComponents: [
    // Abu Dhabi F1 Grand Prix 2025 Components
    {
      id: 1,
      tour_id: 3,
      component_type: "accommodation" as const,
      hotel_id: 4,
      room_group_id: "rg-yas-2",
      check_in_day: 1, // Dec 4, 2025 (tour start)
      nights: 4,
      board_type: "bed_breakfast" as const,
      pricing_mode: "use_contract" as const,
      included_in_base_price: true,
      label: "Yas Hotel Abu Dhabi - Track View"
    },
    {
      id: 2,
      tour_id: 3,
      component_type: "transfer" as const,
      service_name: "Airport Transfer - Arrival (Abu Dhabi Airport to Yas Hotel)",
      provider: "UAE Premium Transfers",
      check_in_day: 1, // Dec 4, 2025
      pricing_mode: "fixed_price" as const,
      cost_per_couple: 80, // AED 80 per couple (one-way)
      sell_per_couple: 120, // AED 120 per couple
      inventory_source: "buy_to_order" as const,
      quantity_per_booking: 1, // 1 vehicle per couple
      pricing_unit: "per_vehicle" as const,
      included_in_base_price: true,
      label: "Airport Transfer - Arrival"
    },
    {
      id: 3,
      tour_id: 3,
      component_type: "transfer" as const,
      service_name: "Airport Transfer - Departure (Yas Hotel to Abu Dhabi Airport)",
      provider: "UAE Premium Transfers",
      check_in_day: 5, // Dec 8, 2025 (checkout day)
      pricing_mode: "fixed_price" as const,
      cost_per_couple: 80,
      sell_per_couple: 120,
      inventory_source: "buy_to_order" as const,
      quantity_per_booking: 1,
      pricing_unit: "per_vehicle" as const,
      included_in_base_price: true,
      label: "Airport Transfer - Departure"
    },
    {
      id: 4,
      tour_id: 3,
      component_type: "transfer" as const,
      service_name: "Circuit Transfer - Saturday (Hotel to Yas Marina Circuit)",
      provider: "UAE Premium Transfers",
      check_in_day: 3, // Dec 6, 2025 (Saturday)
      pricing_mode: "fixed_price" as const,
      cost_per_couple: 40, // Round trip
      sell_per_couple: 65,
      inventory_source: "buy_to_order" as const,
      quantity_per_booking: 1,
      pricing_unit: "per_vehicle" as const,
      included_in_base_price: true,
      label: "Circuit Transfer - Saturday (Qualifying)"
    },
    {
      id: 5,
      tour_id: 3,
      component_type: "transfer" as const,
      service_name: "Circuit Transfer - Sunday (Hotel to Yas Marina Circuit)",
      provider: "UAE Premium Transfers",
      check_in_day: 4, // Dec 7, 2025 (Sunday - Race Day)
      pricing_mode: "fixed_price" as const,
      cost_per_couple: 40,
      sell_per_couple: 65,
      inventory_source: "buy_to_order" as const,
      quantity_per_booking: 1,
      pricing_unit: "per_vehicle" as const,
      included_in_base_price: true,
      label: "Circuit Transfer - Sunday (Race Day)"
    },
    {
      id: 6,
      tour_id: 3,
      component_type: "ticket" as const,
      service_name: "F1 Abu Dhabi GP - 3-Day Grandstand Ticket (Fri-Sat-Sun)",
      provider: "F1 Experiences Middle East",
      check_in_day: 2, // Dec 5, 2025 (Friday - event starts)
      pricing_mode: "fixed_price" as const,
      cost_per_couple: 800, // USD 800 for 2 tickets (3-day pass)
      sell_per_couple: 1200, // USD 1200 for 2 tickets
      inventory_source: "buy_to_order" as const,
      quantity_per_booking: 2, // 2 tickets per couple
      pricing_unit: "per_person" as const,
      included_in_base_price: true,
      label: "F1 Grandstand Tickets - 3 Days"
    }
  ]
}

// LocalStorage keys
const STORAGE_KEYS = {
  tours: 'tours-inventory-tours',
  hotels: 'tours-inventory-hotels',
  suppliers: 'tours-inventory-suppliers',
  contracts: 'tours-inventory-contracts',
  rates: 'tours-inventory-rates',
  stocks: 'tours-inventory-stocks',
  listings: 'tours-inventory-listings',
  bookings: 'tours-inventory-bookings',
  payments: 'tours-inventory-payments',
  serviceRequests: 'tours-inventory-service-requests',
  serviceInventoryTypes: 'tours-inventory-service-inventory-types',
  serviceContracts: 'tours-inventory-service-contracts',
  serviceRates: 'tours-inventory-service-rates',
  // NEW: Unified inventory system
  inventoryItems: 'tours-inventory-unified-items',
  unifiedContracts: 'tours-inventory-unified-contracts',
  unifiedRates: 'tours-inventory-unified-rates',
  allocations: 'tours-inventory-allocations',
  // NEW: Pool-centric capacity management
  allocationPoolCapacity: 'tours-inventory-pool-capacity',
  poolBookings: 'tours-inventory-pool-bookings',
  rateCapacitySettings: 'tours-inventory-rate-capacity-settings',
}

// Load from localStorage with fallback
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

// Save to localStorage
function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [tours, setToursState] = useState<Tour[]>(() => loadFromStorage(STORAGE_KEYS.tours, initialData.tours))
  const [hotels, setHotelsState] = useState<Hotel[]>(() => loadFromStorage(STORAGE_KEYS.hotels, initialData.hotels))
  const [suppliers, setSuppliersState] = useState<Supplier[]>(() => loadFromStorage(STORAGE_KEYS.suppliers, initialData.suppliers))
  const [contracts, setContractsState] = useState<Contract[]>(() => loadFromStorage(STORAGE_KEYS.contracts, initialData.contracts))
  const [rates, setRatesState] = useState<Rate[]>(() => loadFromStorage(STORAGE_KEYS.rates, initialData.rates))
  // Stock state deprecated - keeping for backward compatibility but returning empty array
  const [stocks] = useState<Stock[]>([])
  const [listings, setListingsState] = useState<Listing[]>(() => loadFromStorage(STORAGE_KEYS.listings, initialData.listings))
  const [bookings, setBookingsState] = useState<Booking[]>(() => loadFromStorage(STORAGE_KEYS.bookings, initialData.bookings))
  const [payments, setPaymentsState] = useState<Payment[]>(() => loadFromStorage(STORAGE_KEYS.payments, initialData.payments))
  const [serviceRequests, setServiceRequestsState] = useState<ServiceRequest[]>(() => loadFromStorage(STORAGE_KEYS.serviceRequests, initialData.serviceRequests))
  const [serviceInventoryTypes, setServiceInventoryTypesState] = useState<ServiceInventoryType[]>(() => loadFromStorage(STORAGE_KEYS.serviceInventoryTypes, initialData.serviceInventoryTypes))
  const [serviceContracts, setServiceContractsState] = useState<ServiceContract[]>(() => loadFromStorage(STORAGE_KEYS.serviceContracts, initialData.serviceContracts))
  const [serviceRates, setServiceRatesState] = useState<ServiceRate[]>(() => loadFromStorage(STORAGE_KEYS.serviceRates, initialData.serviceRates))
  const [conversionHistory, setConversionHistory] = useState<ConversionHistory[]>([])
  const [tourComponents, setTourComponentsState] = useState<TourComponent[]>(() => loadFromStorage('tourComponents', initialData.tourComponents))
  
  // NEW: Unified inventory system state
  const [inventoryItems, setInventoryItemsState] = useState<InventoryItem[]>(() => loadFromStorage(STORAGE_KEYS.inventoryItems, []))
  const [unifiedContracts, setUnifiedContractsState] = useState<UnifiedContract[]>(() => loadFromStorage(STORAGE_KEYS.unifiedContracts, []))
  const [unifiedRates, setUnifiedRatesState] = useState<UnifiedRate[]>(() => loadFromStorage(STORAGE_KEYS.unifiedRates, []))
  const [allocations, setAllocationsState] = useState<Allocation[]>(() => loadFromStorage(STORAGE_KEYS.allocations, []))
  
  // NEW: Pool-centric capacity management state
  const [allocationPoolCapacity, setAllocationPoolCapacityState] = useState<AllocationPoolCapacity[]>(() => loadFromStorage(STORAGE_KEYS.allocationPoolCapacity, []))
  const [poolBookings, setPoolBookingsState] = useState<PoolBooking[]>(() => loadFromStorage(STORAGE_KEYS.poolBookings, []))
  const [rateCapacitySettings, setRateCapacitySettingsState] = useState<RateCapacitySettings[]>(() => loadFromStorage(STORAGE_KEYS.rateCapacitySettings, []))

  // Fix existing rates that are missing roomName or hotelName (migration)
  useEffect(() => {
    let needsUpdate = false
    const updatedRates = rates.map(rate => {
      if (!rate.roomName || !rate.hotelName) {
        const contract = contracts.find(c => c.id === rate.contract_id)
        const hotel = hotels.find(h => h.id === (rate.hotel_id || contract?.hotel_id))
        const roomGroup = hotel?.room_groups.find(rg => rg.id === rate.room_group_id)
        
        if ((roomGroup && !rate.roomName) || (hotel && !rate.hotelName)) {
          needsUpdate = true
          return {
            ...rate,
            roomName: rate.roomName || roomGroup?.room_type || '',
            hotelName: rate.hotelName || hotel?.name || ''
          }
        }
      }
      return rate
    })
    
    if (needsUpdate) {
      console.log('Migrating rates: adding missing roomName and hotelName')
      setRates(updatedRates)
    }
  }, []) // Run once on mount

  // Wrapper functions that persist to localStorage
  const setTours = (data: Tour[] | ((prev: Tour[]) => Tour[])) => {
    setToursState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.tours, next)
      return next
    })
  }

  const setHotels = (data: Hotel[] | ((prev: Hotel[]) => Hotel[])) => {
    setHotelsState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.hotels, next)
      return next
    })
  }

  const setSuppliers = (data: Supplier[] | ((prev: Supplier[]) => Supplier[])) => {
    setSuppliersState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.suppliers, next)
      return next
    })
  }

  const setContracts = (data: Contract[] | ((prev: Contract[]) => Contract[])) => {
    setContractsState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.contracts, next)
      return next
    })
  }

  const setRates = (data: Rate[] | ((prev: Rate[]) => Rate[])) => {
    setRatesState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.rates, next)
      return next
    })
  }

  // setStocks deprecated - no-op function for backward compatibility
  const _setStocks = (_data: Stock[] | ((prev: Stock[]) => Stock[])) => {
    console.warn('setStocks is deprecated. Stocks are now managed in Contract.room_allocations')
  }
  // Suppress unused variable warning
  void _setStocks

  const setListings = (data: Listing[] | ((prev: Listing[]) => Listing[])) => {
    setListingsState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.listings, next)
      return next
    })
  }

  const setBookings = (data: Booking[] | ((prev: Booking[]) => Booking[])) => {
    setBookingsState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.bookings, next)
      return next
    })
  }

  const setPayments = (data: Payment[] | ((prev: Payment[]) => Payment[])) => {
    setPaymentsState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.payments, next)
      return next
    })
  }

  const setServiceRequests = (data: ServiceRequest[] | ((prev: ServiceRequest[]) => ServiceRequest[])) => {
    setServiceRequestsState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.serviceRequests, next)
      return next
    })
  }

  const setServiceInventoryTypes = (data: ServiceInventoryType[] | ((prev: ServiceInventoryType[]) => ServiceInventoryType[])) => {
    setServiceInventoryTypesState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.serviceInventoryTypes, next)
      return next
    })
  }

  const setServiceContracts = (data: ServiceContract[] | ((prev: ServiceContract[]) => ServiceContract[])) => {
    setServiceContractsState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.serviceContracts, next)
      return next
    })
  }

  const setServiceRates = (data: ServiceRate[] | ((prev: ServiceRate[]) => ServiceRate[])) => {
    setServiceRatesState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.serviceRates, next)
      return next
    })
  }

  const setTourComponents = (data: TourComponent[] | ((prev: TourComponent[]) => TourComponent[])) => {
    setTourComponentsState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage('tourComponents', next)
      return next
    })
  }

  // NEW: Unified inventory wrapper functions
  const setInventoryItems = (data: InventoryItem[] | ((prev: InventoryItem[]) => InventoryItem[])) => {
    setInventoryItemsState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.inventoryItems, next)
      return next
    })
  }

  const setUnifiedContracts = (data: UnifiedContract[] | ((prev: UnifiedContract[]) => UnifiedContract[])) => {
    setUnifiedContractsState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.unifiedContracts, next)
      return next
    })
  }

  const setUnifiedRates = (data: UnifiedRate[] | ((prev: UnifiedRate[]) => UnifiedRate[])) => {
    setUnifiedRatesState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.unifiedRates, next)
      return next
    })
  }

  const setAllocations = (data: Allocation[] | ((prev: Allocation[]) => Allocation[])) => {
    setAllocationsState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.allocations, next)
      return next
    })
  }

  // NEW: Pool-centric capacity management setters
  const setAllocationPoolCapacity = (data: AllocationPoolCapacity[] | ((prev: AllocationPoolCapacity[]) => AllocationPoolCapacity[])) => {
    setAllocationPoolCapacityState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.allocationPoolCapacity, next)
      return next
    })
  }

  const setPoolBookings = (data: PoolBooking[] | ((prev: PoolBooking[]) => PoolBooking[])) => {
    setPoolBookingsState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.poolBookings, next)
      return next
    })
  }

  const setRateCapacitySettings = (data: RateCapacitySettings[] | ((prev: RateCapacitySettings[]) => RateCapacitySettings[])) => {
    setRateCapacitySettingsState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage(STORAGE_KEYS.rateCapacitySettings, next)
      return next
    })
  }

  // ============================================================================
  // UNIFIED INVENTORY CRUD METHODS
  // ============================================================================

  // Inventory Item CRUD
  const addInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'created_at'>) => {
    const newId = Math.max(...inventoryItems.map(i => i.id), 0) + 1
    
    const newItem: InventoryItem = {
      ...itemData,
      id: newId,
      created_at: new Date().toISOString(),
      active: itemData.active !== undefined ? itemData.active : true,
      // Fix: Ensure all categories have correct item_id
      categories: itemData.categories.map(cat => ({
        ...cat,
        item_id: newId
      }))
    }
    
    setInventoryItems([...inventoryItems, newItem])
    console.log(`✅ Created ${newItem.item_type} inventory item:`, newItem.name)
    return newItem
  }

  const updateInventoryItem = (id: number, updates: Partial<InventoryItem>) => {
    setInventoryItems(prevItems =>
      prevItems.map(item =>
        item.id === id
          ? { ...item, ...updates, updated_at: new Date().toISOString() }
          : item
      )
    )
    console.log(`✅ Updated inventory item:`, id)
  }

  const deleteInventoryItem = (id: number) => {
    const item = inventoryItems.find(i => i.id === id)
    
    // Check for dependencies
    const hasContracts = unifiedContracts.some(c => c.item_id === id)
    if (hasContracts) {
      throw new Error('Cannot delete inventory item with existing contracts')
    }
    
    setInventoryItems(prevItems => prevItems.filter(i => i.id !== id))
    console.log(`🗑️ Deleted ${item?.item_type} inventory item:`, item?.name)
  }

  // Unified Contract CRUD
  const addUnifiedContract = (contractData: Omit<UnifiedContract, 'id' | 'itemName' | 'supplierName' | 'item_type' | 'tourNames' | 'created_at'>) => {
    const item = inventoryItems.find(i => i.id === contractData.item_id)
    const supplier = suppliers.find(s => s.id === contractData.supplier_id)
    const tourNames = contractData.tour_ids?.map(tourId => 
      tours.find(t => t.id === tourId)?.name || ''
    ).filter(Boolean)
    
    const newContract: UnifiedContract = {
      ...contractData,
      id: Math.max(...unifiedContracts.map(c => c.id), 0) + 1,
      itemName: item?.name || '',
      supplierName: supplier?.name || '',
      item_type: item?.item_type || 'other',
      tourNames,
      created_at: new Date().toISOString(),
      active: contractData.active !== undefined ? contractData.active : true
    }
    
    setUnifiedContracts([...unifiedContracts, newContract])
    console.log(`✅ Created ${newContract.item_type} contract:`, newContract.contract_name)
    return newContract
  }

  const updateUnifiedContract = (id: number, updates: Partial<UnifiedContract>) => {
    setUnifiedContracts(prevContracts =>
      prevContracts.map(contract => {
        if (contract.id !== id) return contract
        
        // Update denormalized fields if references changed
        const item = updates.item_id ? inventoryItems.find(i => i.id === updates.item_id) : undefined
        const supplier = updates.supplier_id ? suppliers.find(s => s.id === updates.supplier_id) : undefined
        const tourNames = updates.tour_ids?.map(tourId =>
          tours.find(t => t.id === tourId)?.name || ''
        ).filter(Boolean)
        
        return {
          ...contract,
          ...updates,
          ...(item && { itemName: item.name, item_type: item.item_type }),
          ...(supplier && { supplierName: supplier.name }),
          ...(tourNames && { tourNames }),
          updated_at: new Date().toISOString()
        }
      })
    )
    console.log(`✅ Updated unified contract:`, id)
  }

  const deleteUnifiedContract = (id: number) => {
    const contract = unifiedContracts.find(c => c.id === id)
    
    // Check for dependencies
    const hasRates = unifiedRates.some(r => r.contract_id === id)
    if (hasRates) {
      throw new Error('Cannot delete contract with existing rates')
    }
    
    setUnifiedContracts(prevContracts => prevContracts.filter(c => c.id !== id))
    console.log(`🗑️ Deleted unified contract:`, contract?.contract_name)
  }

  // Unified Rate CRUD
  const addUnifiedRate = (rateData: Omit<UnifiedRate, 'id' | 'selling_price' | 'itemName' | 'categoryName' | 'contractName' | 'item_type' | 'tourName' | 'created_at'>) => {
    const item = inventoryItems.find(i => i.id === rateData.item_id)
    const contract = rateData.contract_id
      ? unifiedContracts.find(c => c.id === rateData.contract_id)
      : undefined
    const category = item?.categories.find(c => c.id === rateData.category_id)
    const tour = rateData.tour_id ? tours.find(t => t.id === rateData.tour_id) : undefined
    
    // Calculate selling price
    const sellingPrice = rateData.base_rate * (1 + (rateData.markup_percentage || 0))
    
    const newRate: UnifiedRate = {
      ...rateData,
      id: Math.max(...unifiedRates.map(r => r.id), 0) + 1,
      selling_price: sellingPrice,
      itemName: item?.name || '',
      categoryName: category?.category_name || '',
      contractName: contract?.contract_name,
      item_type: item?.item_type || 'other',
      tourName: tour?.name,
      created_at: new Date().toISOString(),
      active: rateData.active !== undefined ? rateData.active : true
    }
    
    setUnifiedRates([...unifiedRates, newRate])
    console.log(`✅ Created ${newRate.item_type} rate for ${newRate.categoryName} @ ${newRate.currency} ${newRate.base_rate}`)
    return newRate
  }

  const updateUnifiedRate = (id: number, updates: Partial<UnifiedRate>) => {
    setUnifiedRates(prevRates =>
      prevRates.map(rate => {
        if (rate.id !== id) return rate
        
        const updated = { ...rate, ...updates, updated_at: new Date().toISOString() }
        
        // Recalculate selling price if base_rate or markup changed
        if (updates.base_rate !== undefined || updates.markup_percentage !== undefined) {
          updated.selling_price = updated.base_rate * (1 + (updated.markup_percentage || 0))
        }
        
        // Update denormalized fields if references changed
        const item = updates.item_id ? inventoryItems.find(i => i.id === updates.item_id) : undefined
        const contract = updates.contract_id ? unifiedContracts.find(c => c.id === updates.contract_id) : undefined
        const category = item?.categories.find(c => c.id === (updates.category_id || rate.category_id))
        const tour = updates.tour_id ? tours.find(t => t.id === updates.tour_id) : undefined
        
        if (item) {
          updated.itemName = item.name
          updated.item_type = item.item_type
        }
        if (contract) {
          updated.contractName = contract.contract_name
        }
        if (category) {
          updated.categoryName = category.category_name
        }
        if (tour) {
          updated.tourName = tour.name
        }
        
        return updated
      })
    )
    console.log(`✅ Updated unified rate:`, id)
  }

  const deleteUnifiedRate = (id: number) => {
    const rate = unifiedRates.find(r => r.id === id)
    setUnifiedRates(prevRates => prevRates.filter(r => r.id !== id))
    console.log(`🗑️ Deleted ${rate?.item_type} rate:`, rate?.categoryName)
  }

  // ============================================================================
  // ALLOCATION CRUD METHODS
  // ============================================================================

  const addAllocation = (allocationData: Omit<Allocation, 'id' | 'itemName' | 'supplierName' | 'contractName' | 'tourNames' | 'created_at'>) => {
    const item = inventoryItems.find(i => i.id === allocationData.item_id)
    const supplier = suppliers.find(s => s.id === allocationData.supplier_id)
    const contract = allocationData.contract_id ? unifiedContracts.find(c => c.id === allocationData.contract_id) : null
    const tourNames = allocationData.tour_ids?.map(tourId => 
      tours.find(t => t.id === tourId)?.name || ''
    ).filter(Boolean)
    
    const newAllocation: Allocation = {
      ...allocationData,
      id: Math.max(...allocations.map(a => a.id), 0) + 1,
      itemName: item?.name || '',
      supplierName: supplier?.name || '',
      contractName: contract?.contract_name || '',
      tourNames,
      created_at: new Date().toISOString(),
      active: allocationData.active !== undefined ? allocationData.active : true
    }
    
    setAllocations([...allocations, newAllocation])
    console.log(`✅ Created allocation:`, newAllocation.label)
    return newAllocation
  }

  const updateAllocation = (id: number, updates: Partial<Allocation>) => {
    setAllocations(prevAllocations =>
      prevAllocations.map(allocation => {
        if (allocation.id !== id) return allocation
        
        // Update denormalized fields if references changed
        const item = inventoryItems.find(i => i.id === (updates.item_id || allocation.item_id))
        const supplier = suppliers.find(s => s.id === (updates.supplier_id || allocation.supplier_id))
        const contract = (updates.contract_id || allocation.contract_id) ? 
          unifiedContracts.find(c => c.id === (updates.contract_id || allocation.contract_id)) : null
        const tourNames = (updates.tour_ids || allocation.tour_ids)?.map(tourId => 
          tours.find(t => t.id === tourId)?.name || ''
        ).filter(Boolean)
        
        return {
          ...allocation,
          ...updates,
          itemName: item?.name || allocation.itemName,
          supplierName: supplier?.name || allocation.supplierName,
          contractName: contract?.contract_name || allocation.contractName,
          tourNames,
          updated_at: new Date().toISOString()
        }
      })
    )
    console.log(`✅ Updated allocation:`, id)
  }

  const deleteAllocation = (id: number) => {
    const allocation = allocations.find(a => a.id === id)
    setAllocations(prevAllocations => prevAllocations.filter(a => a.id !== id))
    console.log(`🗑️ Deleted allocation:`, allocation?.label)
  }

  // ============================================================================
  // POOL CAPACITY MANAGEMENT CRUD METHODS
  // ============================================================================

  // AllocationPoolCapacity CRUD
  const addAllocationPoolCapacity = (poolData: Omit<AllocationPoolCapacity, 'last_updated'>) => {
    const newPool: AllocationPoolCapacity = {
      ...poolData,
      last_updated: new Date().toISOString()
    }
    setAllocationPoolCapacity(prev => [...prev, newPool])
    console.log(`✅ Created pool capacity: ${newPool.pool_id}`)
    return newPool
  }

  const updateAllocationPoolCapacity = (poolId: string, updates: Partial<AllocationPoolCapacity>) => {
    setAllocationPoolCapacity(prevPools =>
      prevPools.map(pool => {
        if (pool.pool_id !== poolId) return pool
        const updated = { ...pool, ...updates, last_updated: new Date().toISOString() }
        console.log(`📝 Updated pool capacity: ${poolId}`)
        return updated
      })
    )
  }

  const deleteAllocationPoolCapacity = (poolId: string) => {
    const pool = allocationPoolCapacity.find(p => p.pool_id === poolId)
    setAllocationPoolCapacity(prev => prev.filter(p => p.pool_id !== poolId))
    console.log(`🗑️ Deleted pool capacity:`, pool?.pool_id)
  }

  // PoolBooking CRUD
  const addPoolBooking = (bookingData: Omit<PoolBooking, 'id' | 'created_at' | 'updated_at'>) => {
    const newBooking: PoolBooking = {
      ...bookingData,
      id: `booking-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setPoolBookings(prev => [...prev, newBooking])
    console.log(`✅ Created pool booking: ${newBooking.booking_reference}`)
    return newBooking
  }

  const updatePoolBooking = (id: string, updates: Partial<PoolBooking>) => {
    setPoolBookings(prevBookings =>
      prevBookings.map(booking => {
        if (booking.id !== id) return booking
        const updated = { ...booking, ...updates, updated_at: new Date().toISOString() }
        console.log(`📝 Updated pool booking: ${booking.booking_reference}`)
        return updated
      })
    )
  }

  const deletePoolBooking = (id: string) => {
    const booking = poolBookings.find(b => b.id === id)
    setPoolBookings(prev => prev.filter(b => b.id !== id))
    console.log(`🗑️ Deleted pool booking:`, booking?.booking_reference)
  }

  // RateCapacitySettings CRUD
  const addRateCapacitySettings = (settingsData: Omit<RateCapacitySettings, 'id'>) => {
    const newSettings: RateCapacitySettings = {
      ...settingsData
    }
    setRateCapacitySettings(prev => [...prev, newSettings])
    console.log(`✅ Created rate capacity settings for rate: ${newSettings.rate_id}`)
    return newSettings
  }

  const updateRateCapacitySettings = (rateId: number, updates: Partial<RateCapacitySettings>) => {
    setRateCapacitySettings(prevSettings =>
      prevSettings.map(settings => {
        if (settings.rate_id !== rateId) return settings
        const updated = { ...settings, ...updates }
        console.log(`📝 Updated rate capacity settings for rate: ${rateId}`)
        return updated
      })
    )
  }

  const deleteRateCapacitySettings = (rateId: number) => {
    setRateCapacitySettings(prev => prev.filter(s => s.rate_id !== rateId))
    console.log(`🗑️ Deleted rate capacity settings for rate: ${rateId}`)
  }

  // Tour CRUD
  const addTour = (tour: Omit<Tour, 'id'>) => {
    const newTour = { ...tour, id: Math.max(...tours.map(t => t.id), 0) + 1 }
    setTours([...tours, newTour])
  }

  const updateTour = (id: number, tour: Partial<Tour>) => {
    setTours(tours.map(t => t.id === id ? { ...t, ...tour } : t))
  }

  const deleteTour = (id: number) => {
    setTours(tours.filter(t => t.id !== id))
    // Also delete all components for this tour
    setTourComponents(tourComponents.filter(c => c.tour_id !== id))
  }

  // Tour Component CRUD
  const addTourComponent = (component: Omit<TourComponent, 'id'>) => {
    const newComponent = { ...component, id: Math.max(...tourComponents.map(c => c.id), 0) + 1 }
    setTourComponents([...tourComponents, newComponent])
  }

  const updateTourComponent = (id: number, component: Partial<TourComponent>) => {
    setTourComponents(tourComponents.map(c => c.id === id ? { ...c, ...component } : c))
  }

  const deleteTourComponent = (id: number) => {
    setTourComponents(tourComponents.filter(c => c.id !== id))
  }

  // Hotel CRUD
  const addHotel = (hotel: Omit<Hotel, 'id'>) => {
    const newHotel = { ...hotel, id: Math.max(...hotels.map(h => h.id), 0) + 1 }
    setHotels([...hotels, newHotel])
  }

  const updateHotel = (id: number, hotel: Partial<Hotel>) => {
    setHotels(hotels.map(h => h.id === id ? { ...h, ...hotel } : h))
  }

  const deleteHotel = (id: number) => {
    setHotels(hotels.filter(h => h.id !== id))
  }

  // Supplier CRUD
  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier = { ...supplier, id: Math.max(...suppliers.map(s => s.id), 0) + 1 }
    setSuppliers([...suppliers, newSupplier])
  }

  const updateSupplier = (id: number, supplier: Partial<Supplier>) => {
    setSuppliers(suppliers.map(s => s.id === id ? { ...s, ...supplier } : s))
  }

  const deleteSupplier = (id: number) => {
    setSuppliers(suppliers.filter(s => s.id !== id))
  }

  // Payment CRUD
  const addPayment = (payment: Omit<Payment, 'id' | 'supplierName' | 'contractName' | 'created_date'>) => {
    const supplier = suppliers.find(s => s.id === payment.supplier_id)
    const contract = payment.contract_id ? contracts.find(c => c.id === payment.contract_id) : null
    
    const newPayment: Payment = {
      ...payment,
      id: Math.max(...payments.map(p => p.id), 0) + 1,
      supplierName: supplier?.name || '',
      contractName: contract?.contract_name,
      created_date: new Date().toISOString().split('T')[0]
    }
    setPayments([...payments, newPayment])
    
    // NOTE: We do NOT auto-update booking payment status here
    // Payment status is tracked separately and updated manually
    // This gives flexibility for partial payments, renegotiated terms, etc.
  }

  const updatePayment = (id: number, payment: Partial<Payment>) => {
    setPayments(payments.map(p => p.id === id ? { ...p, ...payment } : p))
    
    // NOTE: Payment status updates are manual, not automatic
    // This allows for flexible payment arrangements
  }

  const deletePayment = (id: number) => {
    // Simply delete the payment record
    // No automatic status updates to bookings
    setPayments(payments.filter(p => p.id !== id))
  }

  const recordPayment = (paymentId: number, paymentDate: string, paymentMethod: PaymentMethod, referenceNumber?: string) => {
    updatePayment(paymentId, {
      payment_date: paymentDate,
      payment_method: paymentMethod,
      reference_number: referenceNumber,
      status: 'paid'
    })
  }

  // Service Request CRUD
  const addServiceRequest = (request: Omit<ServiceRequest, 'id' | 'bookingRef' | 'customerName' | 'created_date'>) => {
    const booking = bookings.find(b => b.id === request.booking_id)
    const newRequest: ServiceRequest = {
      ...request,
      id: Math.max(...serviceRequests.map(sr => sr.id), 0) + 1,
      bookingRef: `BK${request.booking_id.toString().padStart(4, '0')}`,
      customerName: booking?.customer_name || '',
      created_date: new Date().toISOString().split('T')[0]
    }
    setServiceRequests([...serviceRequests, newRequest])
  }

  const updateServiceRequest = (id: number, request: Partial<ServiceRequest>) => {
    setServiceRequests(serviceRequests.map(sr => sr.id === id ? { ...sr, ...request } : sr))
  }

  const deleteServiceRequest = (id: number) => {
    setServiceRequests(serviceRequests.filter(sr => sr.id !== id))
  }

  // Service Inventory Type CRUD (like Hotel CRUD)
  const addServiceInventoryType = (inventoryType: Omit<ServiceInventoryType, 'id'>) => {
    const newInventoryType: ServiceInventoryType = {
      ...inventoryType,
      id: Math.max(...serviceInventoryTypes.map(sit => sit.id), 0) + 1
    }
    setServiceInventoryTypes([...serviceInventoryTypes, newInventoryType])
  }

  const updateServiceInventoryType = (id: number, inventoryType: Partial<ServiceInventoryType>) => {
    setServiceInventoryTypes(serviceInventoryTypes.map(sit => 
      sit.id === id ? { ...sit, ...inventoryType } : sit
    ))
  }

  const deleteServiceInventoryType = (id: number) => {
    setServiceInventoryTypes(serviceInventoryTypes.filter(sit => sit.id !== id))
  }

  // Service Contract CRUD
  const addServiceContract = (contract: Omit<ServiceContract, 'id' | 'supplierName' | 'inventoryTypeName' | 'tourName'>) => {
    const supplier = suppliers.find(s => s.id === contract.supplier_id)
    const inventoryType = serviceInventoryTypes.find(sit => sit.id === contract.inventory_type_id)
    const tour = contract.tour_id ? tours.find(t => t.id === contract.tour_id) : null
    const newContract: ServiceContract = {
      ...contract,
      id: Math.max(...serviceContracts.map(sc => sc.id), 0) + 1,
      supplierName: supplier?.name || '',
      inventoryTypeName: inventoryType?.name || '',
      tourName: tour?.name || undefined
    }
    setServiceContracts([...serviceContracts, newContract])
  }

  const updateServiceContract = (id: number, contract: Partial<ServiceContract>) => {
    setServiceContracts(serviceContracts.map(sc => {
      if (sc.id === id) {
        const updated = { ...sc, ...contract }
        // Update names if IDs changed
        if (contract.supplier_id) {
          const supplier = suppliers.find(s => s.id === contract.supplier_id)
          updated.supplierName = supplier?.name || updated.supplierName
        }
        if (contract.inventory_type_id) {
          const inventoryType = serviceInventoryTypes.find(sit => sit.id === contract.inventory_type_id)
          updated.inventoryTypeName = inventoryType?.name || updated.inventoryTypeName
        }
        if (contract.tour_id !== undefined) {
          const tour = contract.tour_id ? tours.find(t => t.id === contract.tour_id) : null
          updated.tourName = tour?.name || undefined
        }
        return updated
      }
      return sc
    }))
  }

  const deleteServiceContract = (id: number) => {
    setServiceContracts(serviceContracts.filter(sc => sc.id !== id))
  }

  // Service Rate CRUD
  const addServiceRate = (rate: Omit<ServiceRate, 'id' | 'contractName' | 'inventoryTypeName' | 'categoryName' | 'selling_price' | 'tourName'>) => {
    const contract = rate.contract_id ? serviceContracts.find(sc => sc.id === rate.contract_id) : null
    const inventoryType = serviceInventoryTypes.find(sit => sit.id === rate.inventory_type_id)
    const category = inventoryType?.service_categories.find(sc => sc.id === rate.category_id)
    const tour = rate.tour_id ? tours.find(t => t.id === rate.tour_id) : (contract?.tour_id ? tours.find(t => t.id === contract.tour_id) : null)
    
    setServiceRates(prevRates => {
      const newRate: ServiceRate = {
        ...rate,
        id: Math.max(...prevRates.map(sr => sr.id), 0) + 1,
        contractName: contract?.contract_name || '',
        inventoryTypeName: inventoryType?.name || '',
        categoryName: category?.category_name || '',
        tourName: tour?.name || undefined,
        selling_price: rate.base_rate * (1 + rate.markup_percentage)
      }
      
      return [...prevRates, newRate]
    })
  }

  const updateServiceRate = (id: number, rate: Partial<ServiceRate>) => {
    setServiceRates(serviceRates.map(sr => {
      if (sr.id === id) {
        const updated = { ...sr, ...rate }
        // Recalculate selling price if base_rate or markup changed
        if (rate.base_rate !== undefined || rate.markup_percentage !== undefined) {
          updated.selling_price = (updated.base_rate || sr.base_rate) * (1 + (updated.markup_percentage ?? sr.markup_percentage))
        }
        // Update names if IDs changed
        if (rate.contract_id !== undefined) {
          const contract = rate.contract_id ? serviceContracts.find(sc => sc.id === rate.contract_id) : null
          updated.contractName = contract?.contract_name || ''
          // Inherit tour from contract if not manually set
          if (!rate.tour_id && contract?.tour_id) {
            const tour = tours.find(t => t.id === contract.tour_id)
            updated.tour_id = contract.tour_id
            updated.tourName = tour?.name || undefined
          }
        }
        if (rate.inventory_type_id) {
          const inventoryType = serviceInventoryTypes.find(sit => sit.id === rate.inventory_type_id)
          updated.inventoryTypeName = inventoryType?.name || updated.inventoryTypeName
        }
        if (rate.category_id) {
          const inventoryType = serviceInventoryTypes.find(sit => sit.id === updated.inventory_type_id || sr.inventory_type_id)
          const category = inventoryType?.service_categories.find(sc => sc.id === rate.category_id)
          updated.categoryName = category?.category_name || updated.categoryName
        }
        if (rate.tour_id !== undefined) {
          const tour = rate.tour_id ? tours.find(t => t.id === rate.tour_id) : null
          updated.tourName = tour?.name || undefined
        }
        return updated
      }
      return sr
    }))
  }

  const deleteServiceRate = (id: number) => {
    setServiceRates(serviceRates.filter(sr => sr.id !== id))
  }

  // Contract CRUD
  const addContract = (contract: Omit<Contract, 'id' | 'hotelName' | 'supplierName'>) => {
    const hotel = hotels.find(h => h.id === contract.hotel_id)
    const supplier = suppliers.find(s => s.id === contract.supplier_id)
    const newContract = { 
      ...contract, 
      id: Math.max(...contracts.map(c => c.id), 0) + 1,
      hotelName: hotel?.name || '',
      supplierName: supplier?.name || ''
    }
  console.log('addContract - Saving contract with tour_ids:', newContract.tour_ids)
    setContracts([...contracts, newContract])
    
    // AUTO-GENERATE RATES
    autoGenerateRates(newContract as Contract, hotel)
  }
  
  // Auto-generate rates for a contract
  const autoGenerateRates = (contract: Contract, hotel?: Hotel) => {
    if (!hotel) hotel = hotels.find(h => h.id === contract.hotel_id)
    if (!hotel) return
    
    const newRates: Rate[] = []
    const baseId = Math.max(...rates.map(r => r.id), 0) + 1
    let currentId = baseId
    
    // Determine which occupancies to create
    const occupanciesToCreate: Array<{occupancy: OccupancyType, rate: number}> = []
    
    if (contract.pricing_strategy === 'flat_rate') {
      // Flat rate: create only double occupancy (standard)
      occupanciesToCreate.push({ occupancy: 'double', rate: contract.base_rate })
    } else {
      // Per occupancy: create rates for each specified occupancy
      if (contract.occupancy_rates && contract.occupancy_rates.length > 0) {
        contract.occupancy_rates.forEach(occRate => {
          occupanciesToCreate.push({ occupancy: occRate.occupancy_type, rate: occRate.rate })
        })
      } else {
        // Fallback: create double occupancy only
        occupanciesToCreate.push({ occupancy: 'double', rate: contract.base_rate })
      }
    }
    
    // For each room allocation
    const roomAllocations = contract.room_allocations || []
    roomAllocations.forEach(allocation => {
      // Check if this allocation has custom rates
      const hasAllocationRates = allocation.occupancy_rates && allocation.occupancy_rates.length > 0
      const hasAllocationBaseRate = allocation.base_rate !== undefined
      
      // Determine which occupancy rates to use
      let adjustedOccupancies = occupanciesToCreate
      if (hasAllocationRates) {
        // Per-occupancy strategy: Use allocation-specific occupancy rates, falling back to contract rates if not specified
        adjustedOccupancies = occupanciesToCreate.map(({occupancy, rate: contractRate}) => {
          // Look for allocation-specific rate for this occupancy
          const allocationRate = allocation.occupancy_rates!.find(r => r.occupancy_type === occupancy)
          return {
            occupancy,
            rate: allocationRate ? allocationRate.rate : contractRate // Use allocation rate if available, else contract rate
          }
        })
      } else if (hasAllocationBaseRate && contract.pricing_strategy === 'flat_rate') {
        // Flat rate strategy: Use allocation-specific base rate for ALL occupancies
        // Generate all possible occupancies (single, double, triple, quad) with same price
        const allOccupancies: OccupancyType[] = ['single', 'double', 'triple', 'quad']
        adjustedOccupancies = allOccupancies.map(occupancy => ({
          occupancy,
          rate: allocation.base_rate!
        }))
      }
      
      // Handle multiple room types in a shared allocation pool
      allocation.room_group_ids.forEach(roomGroupId => {
        const roomGroup = hotel!.room_groups.find(rg => rg.id === roomGroupId)
        if (!roomGroup) return
        
        // For each board option
        const boardOptions = contract.board_options || [{ board_type: 'room_only' as BoardType, additional_cost: 0 }]
        boardOptions.forEach(boardOption => {
          
          // For each occupancy
          adjustedOccupancies.forEach(({occupancy, rate: occupancyRate}) => {
            const newRate: Rate = {
              id: currentId++,
              contract_id: contract.id,
              contractName: contract.contract_name,
              room_group_id: roomGroupId,
              roomName: roomGroup.room_type,
              occupancy_type: occupancy,
              board_type: boardOption.board_type,
              allocation_pool_id: allocation.allocation_pool_id, // Link to shared pool if specified
              rate: occupancyRate, // Base room rate for this occupancy (now uses allocation override if set)
              board_cost: boardOption.additional_cost, // Per person per night
              board_included: true, // Board from contract
              markup_percentage: contract.markup_percentage || 0.60,
              // shoulder_markup_percentage removed - shoulder rates are now separate
              currency: contract.currency,
              active: true, // Default to active
            }
          newRates.push(newRate)
        })
      })
      })
    })
    
    if (newRates.length > 0) {
      setRates([...rates, ...newRates])
      console.log(`✅ Auto-generated ${newRates.length} rates for contract ${contract.contract_name}`)
    }
  }

  const updateContract = (id: number, contract: Partial<Contract>) => {
    setContracts(contracts.map(c => c.id === id ? { ...c, ...contract } : c))
  }

  const deleteContract = (id: number) => {
    setContracts(contracts.filter(c => c.id !== id))
  }

  // Room groups are now managed as part of hotels
  // No separate room CRUD needed

  // Rate CRUD
  const addRate = (rate: Omit<Rate, 'id' | 'contractName' | 'roomName' | 'tourName'>) => {
    const contract = contracts.find(c => c.id === rate.contract_id)
    const tour = tours.find(t => t.id === rate.tour_id)
    // For buy-to-order rates, get hotel directly; for contract rates, get via contract
    const hotel = hotels.find(h => h.id === (rate.hotel_id || contract?.hotel_id))
    const roomGroup = hotel?.room_groups.find(rg => rg.id === rate.room_group_id)
    
    const newRate = { 
      ...rate, 
      id: Math.max(...rates.map(r => r.id), 0) + 1,
      contractName: contract?.contract_name || '',
      roomName: roomGroup?.room_type || '',
      hotelName: hotel?.name || '', // Add hotelName for buy-to-order rates
      tourName: tour?.name || '', // Add tourName
      // Inherit from contract if not specified
      currency: rate.currency || contract?.currency,
      tax_rate: rate.tax_rate !== undefined ? rate.tax_rate : contract?.tax_rate,
      active: rate.active !== undefined ? rate.active : true, // Default to active
    }
    setRates([...rates, newRate as Rate])
  }

  const updateRate = (id: number, rate: Partial<Rate>) => {
    setRates(rates.map(r => {
      if (r.id === id) {
        const contract = contracts.find(c => c.id === (rate.contract_id || r.contract_id))
        const tour = tours.find(t => t.id === (rate.tour_id || r.tour_id))
        // For buy-to-order rates, get hotel directly; for contract rates, get via contract
        const hotel = hotels.find(h => h.id === (rate.hotel_id || r.hotel_id || contract?.hotel_id))
        const roomGroup = hotel?.room_groups.find(rg => rg.id === (rate.room_group_id || r.room_group_id))
        
        return { 
          ...r, 
          ...rate,
          contractName: contract?.contract_name || r.contractName,
          roomName: roomGroup?.room_type || r.roomName,
          hotelName: hotel?.name || r.hotelName || '', // Add hotelName for buy-to-order rates
          tourName: tour?.name || r.tourName || '', // Add tourName
        }
      }
      return r
    }))
  }

  const deleteRate = (id: number) => {
    setRates(rates.filter(r => r.id !== id))
  }

  // Stock CRUD - Deprecated (use Contract.room_allocations instead)
  /**
   * @deprecated Use updateContract() with room_allocations instead
   */
  const addStock = (_stock: Omit<Stock, 'id' | 'roomName'>) => {
    console.warn('addStock is deprecated. Use updateContract() with room_allocations instead.')
  }

  /**
   * @deprecated Use updateContract() with room_allocations instead
   */
  const updateStock = (_id: number, _stock: Partial<Stock>) => {
    console.warn('updateStock is deprecated. Use updateContract() with room_allocations instead.')
  }

  /**
   * @deprecated Use updateContract() with room_allocations instead
   */
  const deleteStock = (_id: number) => {
    console.warn('deleteStock is deprecated. Use updateContract() with room_allocations instead.')
  }

  // Listing CRUD
  const addListing = (listing: Omit<Listing, 'id' | 'tourName' | 'contractName' | 'hotelName' | 'roomName'>) => {
    const tour = tours.find(t => t.id === listing.tour_id)
    
    // For inventory: get info from contract
    // For buy-to-order: get info from hotel directly
    let hotel: Hotel | undefined
    let contract: Contract | undefined
    let stockRecord: Stock | undefined
    
    if (listing.purchase_type === 'inventory') {
      if (listing.stock_id) {
        stockRecord = stocks.find(s => s.id === listing.stock_id)
        const contractIdFromStock = stockRecord ? stockRecord.contract_id : undefined
        if (contractIdFromStock !== undefined) {
          contract = contracts.find(c => c.id === contractIdFromStock)
        }
      } else if (listing.contract_id) {
        contract = contracts.find(c => c.id === listing.contract_id)
      }
      hotel = hotels.find(h => h.id === contract?.hotel_id)
    } else if (listing.purchase_type === 'buy_to_order' && listing.hotel_id) {
      hotel = hotels.find(h => h.id === listing.hotel_id)
    }
    
    const targetRoomGroupId = stockRecord && stockRecord.room_group_id ? stockRecord.room_group_id : listing.room_group_id
    const roomGroup = hotel?.room_groups.find(rg => rg.id === targetRoomGroupId)
    
    const newListing = { 
      ...listing, 
      id: Math.max(...listings.map(l => l.id), 0) + 1,
      tourName: tour?.name || '',
      contractName: contract?.contract_name,
      hotelName: hotel?.name,
      roomName: roomGroup?.room_type || ''
    }
    setListings([...listings, newListing as Listing])
  }

  const updateListing = (id: number, listing: Partial<Listing>) => {
    setListings(listings.map(l => {
      if (l.id === id) {
        const tour = tours.find(t => t.id === (listing.tour_id || l.tour_id))
        const contract = contracts.find(c => c.id === (listing.contract_id || l.contract_id))
        const hotel = hotels.find(h => h.id === contract?.hotel_id)
        const roomGroup = hotel?.room_groups.find(rg => rg.id === (listing.room_group_id || l.room_group_id))
        
        return {
          ...l,
          ...listing,
          tourName: tour?.name || l.tourName,
          contractName: contract?.contract_name || l.contractName,
          roomName: roomGroup?.room_type || l.roomName,
        }
      }
      return l
    }))
  }

  const deleteListing = (id: number) => {
    setListings(listings.filter(l => l.id !== id))
  }

  // Booking CRUD
  const addBooking = (booking: Omit<Booking, 'id' | 'tourName' | 'booking_date' | 'status'>) => {
    const tour = tours.find(t => t.id === booking.tour_id)
    if (!tour) {
      alert('Tour not found')
      return
    }

    // Check availability for each room
    for (const room of booking.rooms) {
      // NEW SYSTEM: If listing_id is 0, use rate-based validation
      if (room.listing_id === 0) {
        // Get rate and contract from rate_id
        const rate = rates.find(r => r.id === room.rate_id)
        if (!rate) {
          console.warn(`Rate ${room.rate_id} not found, skipping availability check`)
          continue
        }

        const contract = contracts.find(c => c.id === rate.contract_id)
        if (!contract) {
          console.warn(`Contract for rate ${room.rate_id} not found, skipping availability check`)
          continue
        }

        // Check availability from contract allocations
        if (room.purchase_type === 'inventory') {
          const allocation = contract.room_allocations?.find(a => a.room_group_ids.includes(rate.room_group_id))
          
          if (allocation) {
            // Calculate already booked rooms for this rate
            const sold = bookings
              .filter(b => b.status !== 'cancelled' && b.rooms && b.rooms.length > 0)
              .flatMap(b => b.rooms)
              .filter(r => r.rate_id === room.rate_id)
              .reduce((sum, r) => sum + r.quantity, 0)
            const available = allocation.quantity - sold
            
            if (room.quantity > available) {
              alert(`Only ${available} ${room.roomName} available in inventory!`)
              return
            }
          }
        }
        continue
      }

      // OLD SYSTEM: Use listing-based validation
      const listing = listings.find(l => l.id === room.listing_id)
      if (!listing) {
        alert(`Listing not found for ${room.roomName}`)
        return
      }

      // Check availability for inventory items (from contract allocations)
      if (listing.purchase_type === 'inventory' && listing.contract_id) {
        const contract = contracts.find(c => c.id === listing.contract_id)
        const allocation = contract?.room_allocations?.find(a => a.room_group_ids.includes(listing.room_group_id))
        
        if (allocation) {
          const sold = bookings
            .filter(b => b.status !== 'cancelled' && b.rooms && b.rooms.length > 0)
            .flatMap(b => b.rooms)
            .filter(r => r.listing_id === listing.id)
            .reduce((sum, r) => sum + r.quantity, 0)
          const available = allocation.quantity - sold
          
          if (room.quantity > available) {
            alert(`Only ${available} ${room.roomName} available in inventory!`)
            return
          }
        }
      }
    }

    // Determine overall booking status
    let bookingStatus: 'confirmed' | 'pending' = 'confirmed'
    const hasBuyToOrder = booking.rooms.some(r => r.purchase_type === 'buy_to_order')
    
    if (hasBuyToOrder) {
      bookingStatus = 'pending'
      console.log(`OPERATIONS ALERT - BUY-TO-ORDER BOOKING CREATED
      Customer: ${booking.customer_name}
      Tour: ${tour.name}
      Rooms: ${booking.rooms.map(r => `${r.quantity}× ${r.roomName} (${r.occupancy_type})`).join(', ')}
      Total: ${booking.total_price}
      `)
    }

    const newBooking: Booking = {
      ...booking,
      id: Math.max(...bookings.map(b => b.id), 0) + 1,
      tourName: tour.name,
      booking_date: new Date().toISOString().split('T')[0],
      status: bookingStatus,
    }
    
    setBookings([...bookings, newBooking])
    
    if (hasBuyToOrder) {
      alert(`Booking created!\n\nOPERATIONS TEAM NOTIFIED\n\nSome rooms require purchase from hotel.`)
    }
  }

  const updateBooking = (id: number, booking: Partial<Booking>) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, ...booking } : b))
  }

  // Record purchase details for buy-to-order bookings
  const recordPurchaseDetails = (
    bookingId: number, 
    purchaseDetails: {
      assigned_to: string
      hotel_contact: string
      hotel_confirmation: string
      cost_per_room: number
      notes?: string
    }
  ) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (!booking) return

    // Update all buy-to-order rooms with purchase details
    const updatedBooking = {
      ...booking,
      status: 'confirmed' as const,
      rooms: booking.rooms?.map(room => {
        if (room.purchase_type === 'buy_to_order' && room.purchase_status === 'pending_purchase') {
          return {
            ...room,
            purchase_status: 'purchased' as const,
            purchase_order: {
              assigned_to: purchaseDetails.assigned_to,
              hotel_contact: purchaseDetails.hotel_contact,
              purchase_date: new Date().toISOString().split('T')[0],
              hotel_confirmation: purchaseDetails.hotel_confirmation,
              cost_per_room: purchaseDetails.cost_per_room,
              total_cost: purchaseDetails.cost_per_room * room.quantity,
              notes: purchaseDetails.notes,
            }
          }
        }
        return room
      }) || []
    }

    setBookings(bookings.map(b => 
      b.id === bookingId ? updatedBooking : b
    ))

    console.log(`✅ PURCHASE RECORDED for booking ${bookingId}`, purchaseDetails)
  }

  const cancelBooking = (id: number) => {
    const booking = bookings.find(b => b.id === id)
    if (!booking) return

    // Note: Inventory tracking is now done via stock, not listings
    // Rooms will be automatically available when booking is cancelled

    // Mark as cancelled
    setBookings(bookings.map(b => 
      b.id === id ? { ...b, status: 'cancelled' as const } : b
    ))
  }

  // Reset all data to initial state
  const resetAllData = () => {
    if (confirm('WARNING: This will delete ALL data and reset to initial state. Are you sure?')) {
      setTours(initialData.tours)
      setHotels(initialData.hotels)
      setContracts(initialData.contracts)
      setRates(initialData.rates)
      setListings(initialData.listings)
      setBookings(initialData.bookings)
      setConversionHistory([])
      console.log('All data reset to initial state')
    }
  }

  // Buy-to-Order Conversion Functions
  const detectBuyToOrderConversions = (contract: Contract): ConversionCandidate[] => {
    const candidates: ConversionCandidate[] = []
    
    // Find all buy-to-order bookings that could potentially be converted
    const buyToOrderBookings = bookings.filter(booking => 
      booking.status !== 'cancelled' &&
      booking.rooms?.some(room => room.purchase_type === 'buy_to_order')
    )
    
    for (const booking of buyToOrderBookings) {
      const conversionRooms: ConversionCandidate['rooms'] = []
      let totalOriginalPrice = 0
      let totalNewPrice = 0
      
      for (const room of booking.rooms || []) {
        if (room.purchase_type !== 'buy_to_order') continue
        
        // Find matching rate in the new contract
        const matchingRate = rates.find(rate => 
          rate.contract_id === contract.id &&
          rate.room_group_id === room.rate_id.toString() &&
          rate.occupancy_type === room.occupancy_type &&
          rate.board_type === room.board_type
        )
        
        if (matchingRate) {
          // Calculate new price using the contract rate
          const newPrice = matchingRate.rate * getNights(booking.check_in_date, booking.check_out_date)
          const priceDifference = room.price_per_room - newPrice
          
          conversionRooms.push({
            roomName: room.roomName,
            occupancy_type: room.occupancy_type,
            board_type: room.board_type,
            quantity: room.quantity,
            originalPrice: room.price_per_room,
            newContractRate: newPrice,
            priceDifference,
            rateId: matchingRate.id
          })
          
          totalOriginalPrice += room.price_per_room * room.quantity
          totalNewPrice += newPrice * room.quantity
        }
      }
      
      if (conversionRooms.length > 0) {
        const totalSavings = totalOriginalPrice - totalNewPrice
        candidates.push({
          bookingId: booking.id,
          customerName: booking.customer_name,
          customerEmail: booking.customer_email,
          tourName: booking.tourName,
          checkInDate: booking.check_in_date,
          checkOutDate: booking.check_out_date,
          rooms: conversionRooms,
          totalOriginalPrice,
          totalNewPrice,
          totalSavings,
          canConvert: true,
          reason: totalSavings > 0 ? 
            `Can save €${totalSavings.toFixed(2)} and convert to guaranteed inventory` :
            `Can convert to guaranteed inventory (rate difference: €${Math.abs(totalSavings).toFixed(2)})`
        })
      }
    }
    
    return candidates
  }

  const convertBuyToOrderBooking = (bookingId: number, contractId: number, notes?: string) => {
    const booking = bookings.find(b => b.id === bookingId)
    const contract = contracts.find(c => c.id === contractId)
    
    if (!booking || !contract) return
    
    // Update booking rooms to use contract inventory instead of buy-to-order
    const updatedRooms = booking.rooms?.map(room => {
      if (room.purchase_type === 'buy_to_order') {
        return {
          ...room,
          purchase_type: 'inventory' as const,
          original_purchase_type: 'buy_to_order' as const,
          converted_from_buy_to_order: true,
          conversion_date: new Date().toISOString(),
          conversion_notes: notes
        }
      }
      return room
    })
    
    // Update the booking
    setBookings(bookings.map(b => 
      b.id === bookingId 
        ? { ...b, rooms: updatedRooms }
        : b
    ))
    
    // Record conversion history
    const totalOriginalPrice = booking.rooms?.reduce((sum, room) => 
      room.purchase_type === 'buy_to_order' ? sum + room.total_price : sum, 0
    ) || 0
    
    const totalNewPrice = updatedRooms?.reduce((sum, room) => 
      room.original_purchase_type === 'buy_to_order' ? sum + room.total_price : sum, 0
    ) || 0
    
    const conversionRecord: ConversionHistory = {
      id: Date.now(),
      bookingId,
      customerName: booking.customer_name,
      contractId,
      contractName: contract.contract_name,
      conversionDate: new Date().toISOString(),
      originalPrice: totalOriginalPrice,
      newPrice: totalNewPrice,
      savings: totalOriginalPrice - totalNewPrice,
      notes
    }
    
    setConversionHistory(prev => [...prev, conversionRecord])
  }

  const convertBuyToOrderRoom = (bookingId: number, roomIndex: number, contractId: number, notes?: string): boolean => {
    const booking = bookings.find(b => b.id === bookingId)
    const contract = contracts.find(c => c.id === contractId)
    
    if (!booking || !contract) {
      console.error('Booking or contract not found', { bookingId, contractId })
      return false
    }
    
    if (!booking.rooms || roomIndex >= booking.rooms.length) {
      console.error('Invalid room index', { roomIndex, totalRooms: booking.rooms?.length })
      return false
    }
    
    const room = booking.rooms[roomIndex]
    
    if (room.purchase_type !== 'buy_to_order') {
      console.error('Room is not buy-to-order', { roomType: room.purchase_type })
      return false
    }
    
    if (room.converted_from_buy_to_order) {
      console.error('Room already converted')
      return false
    }
    
    // Create updated rooms array with the specific room converted
    const updatedRooms = booking.rooms.map((r, idx) => {
      if (idx === roomIndex) {
        return {
          ...r,
          purchase_type: 'inventory' as const,
          original_purchase_type: 'buy_to_order' as const,
          converted_from_buy_to_order: true,
          conversion_date: new Date().toISOString(),
          conversion_notes: notes,
          contractName: contract.contract_name // Update contract name for display
        }
      }
      return r
    })
    
    // Update the booking with new rooms array
    setBookings(prev => prev.map(b => 
      b.id === bookingId 
        ? { ...b, rooms: updatedRooms }
        : b
    ))
    
    // Record conversion history
    const conversionRecord: ConversionHistory = {
      id: Date.now(),
      bookingId,
      customerName: booking.customer_name,
      contractId,
      contractName: contract.contract_name,
      conversionDate: new Date().toISOString(),
      originalPrice: room.total_price,
      newPrice: room.total_price, // Price stays the same!
      savings: 0, // No price change
      notes
    }
    
    setConversionHistory(prev => [...prev, conversionRecord])
    
    console.log('Room converted successfully', { bookingId, roomIndex, contractId })
    return true
  }

  const getConversionHistory = (): ConversionHistory[] => {
    return conversionHistory
  }

  // Helper function to calculate nights
  const getNights = (checkIn: string, checkOut: string): number => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  const value: DataContextType = {
    summary: initialData.summary,
    tours,
    tourComponents,
    hotels,
    suppliers,
    contracts,
    rates,
    stocks,
    listings,
    bookings,
    payments,
    serviceRequests,
    serviceInventoryTypes,
    serviceContracts,
    serviceRates,
    recentActivity: initialData.recentActivity,
    hotelLocations: initialData.hotelLocations,
    addTour,
    updateTour,
    deleteTour,
    addTourComponent,
    updateTourComponent,
    deleteTourComponent,
    addHotel,
    updateHotel,
    deleteHotel,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addPayment,
    updatePayment,
    deletePayment,
    recordPayment,
    addServiceRequest,
    updateServiceRequest,
    deleteServiceRequest,
    addServiceInventoryType,
    updateServiceInventoryType,
    deleteServiceInventoryType,
    addServiceContract,
    updateServiceContract,
    deleteServiceContract,
    addServiceRate,
    updateServiceRate,
    deleteServiceRate,
    addContract,
    updateContract,
    deleteContract,
    addRate,
    updateRate,
    deleteRate,
    addStock,
    updateStock,
    deleteStock,
    addListing,
    updateListing,
    deleteListing,
    addBooking,
    updateBooking,
    cancelBooking,
    recordPurchaseDetails,
    resetAllData,
    detectBuyToOrderConversions,
    convertBuyToOrderBooking,
    convertBuyToOrderRoom,
    getConversionHistory,
    // NEW: Unified inventory system
    inventoryItems,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    unifiedContracts,
    addUnifiedContract,
    updateUnifiedContract,
    deleteUnifiedContract,
    unifiedRates,
    addUnifiedRate,
    updateUnifiedRate,
    deleteUnifiedRate,
    // NEW: Standalone allocations
    allocations,
    setAllocations,
    addAllocation,
    updateAllocation,
    deleteAllocation,
    // NEW: Pool-centric capacity management
    allocationPoolCapacity,
    setAllocationPoolCapacity,
    addAllocationPoolCapacity,
    updateAllocationPoolCapacity,
    deleteAllocationPoolCapacity,
    poolBookings,
    addPoolBooking,
    updatePoolBooking,
    deletePoolBooking,
    rateCapacitySettings,
    addRateCapacitySettings,
    updateRateCapacitySettings,
    deleteRateCapacitySettings,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

