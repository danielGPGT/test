// 🎯 UNIFIED INVENTORY TYPE SYSTEM
// This file defines the polymorphic data structures for the unified inventory system
// Replaces separate Hotel and ServiceInventoryType models

// ============================================================================
// CORE TYPES
// ============================================================================

// Inventory item types - covers ALL your inventory needs
export type InventoryItemType = 
  | 'hotel'           // Hotel rooms and accommodations
  | 'ticket'          // Event tickets, venue tickets, attraction tickets
  | 'transfer'        // Airport transfers, ground transportation
  | 'activity'        // Tours, excursions, experiences
  | 'meal'            // Standalone meal packages, dining experiences
  | 'venue'           // Stadiums, arenas, conference centers
  | 'transport'       // Long-distance transport (trains, flights, coaches)
  | 'experience'      // Special experiences, VIP packages
  | 'other'           // Miscellaneous services

export type PricingMode = 'per_occupancy' | 'per_unit' | 'per_person' | 'per_vehicle' | 'per_group' | 'flat_rate' | 'tiered'
export type OccupancyType = 'single' | 'double' | 'triple' | 'quad'
export type BoardType = 'room_only' | 'bed_breakfast' | 'half_board' | 'full_board' | 'all_inclusive'
export type ServiceCategory = 'transfer' | 'activity' | 'ticket' | 'meal' | 'venue_hire' | 'guide_services' | 'equipment_rental' | 'other'
export type ServiceDirection = 'inbound' | 'outbound' | 'round_trip' | 'one_way'
export type ContractPricingStrategy = 'per_occupancy' | 'per_unit' | 'flat_rate' | 'tiered'

// Day of week for conditions and availability
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

// ============================================================================
// TIME-BASED SCHEDULING SYSTEM
// ============================================================================

export interface TimeSlot {
  id: string
  start_time: string        // "09:00"
  end_time: string          // "17:00"
  duration_minutes: number  // 480
  max_capacity?: number     // Optional capacity per slot
  is_available?: boolean    // Can be disabled
}

export interface ScheduleConfig {
  // For activities, tours, meals, shows
  has_time_slots: boolean
  time_slots: TimeSlot[]
  
  // Duration for time-based services
  duration_hours?: number
  duration_minutes?: number
  
  // Flexible timing options
  flexible_start?: boolean  // Can start at any time within a range
  start_time_range?: {
    earliest: string        // "08:00"
    latest: string          // "18:00"
  }
  
  // Booking intervals (for guided tours, meals)
  booking_interval_minutes?: number  // 30, 60, 120
}

// ============================================================================
// GROUP SIZE PRICING SYSTEM
// ============================================================================

export interface GroupPricingTier {
  min_pax: number
  max_pax?: number
  price_per_person: number
  total_price?: number      // Optional fixed price for the group
  description?: string      // "Small group (1-4)", "Medium group (5-10)"
}

export interface GroupPricingConfig {
  // Enable group pricing
  has_group_pricing: boolean
  
  // Group size constraints
  minimum_group_size?: number
  maximum_group_size?: number
  
  // Pricing tiers
  pricing_tiers: GroupPricingTier[]
  
  // Pricing behavior
  pricing_mode: 'per_person' | 'per_group' | 'tiered'
  
  // Special pricing
  single_supplement?: number    // Extra charge for single occupancy
  child_discount_percentage?: number
  senior_discount_percentage?: number
}

// ============================================================================
// CAPACITY & AVAILABILITY MANAGEMENT
// ============================================================================

export interface CapacityConfig {
  // Total capacity
  total_capacity: number
  current_bookings: number
  available_spots: number
  
  // Overbooking settings
  overbooking_allowed: boolean
  overbooking_limit: number
  overbooking_buffer: number
  
  // Availability tracking
  real_time_availability: boolean
  availability_update_frequency: 'immediate' | 'hourly' | 'daily'
  
  // Capacity constraints
  minimum_booking_size?: number
  maximum_booking_size?: number
  
  // Waitlist settings
  waitlist_enabled: boolean
  waitlist_max_size?: number
}

export interface AvailabilityStatus {
  status: 'available' | 'limited' | 'full' | 'waitlist' | 'closed'
  spots_remaining: number
  next_available_date?: string
  waitlist_position?: number
}

// ============================================================================
// DYNAMIC CHARGES SYSTEM
// ============================================================================

export type ChargeType = 
  | 'tax'                    // Government taxes (VAT, sales tax, tourism tax)
  | 'fee'                    // Service fees, booking fees, platform fees
  | 'commission'             // Supplier discounts, agent commissions
  | 'discount'               // Volume discounts, early bird, promotional
  | 'surcharge'              // Peak season, weekend, holiday surcharges
  | 'deposit'                // Deposit requirements
  | 'penalty'                // Late payment, cancellation penalties
  | 'gratuity'               // Tips, service charges
  | 'insurance'              // Optional or mandatory insurance
  | 'other'                  // Custom charges

export type CalculationType =
  | 'percentage'             // % of base price
  | 'fixed_amount'           // Fixed amount (e.g., $50)
  | 'per_person'             // Amount × number of people
  | 'per_person_per_night'   // Amount × people × nights
  | 'per_unit'               // Amount × quantity
  | 'per_unit_per_day'       // Amount × quantity × days
  | 'tiered'                 // Based on volume/quantity tiers
  | 'formula'                // Custom calculation (advanced)

export type AppliedTo =
  | 'base_price'             // Applied to base rate only
  | 'subtotal'               // Applied after other charges
  | 'total'                  // Applied to final total
  | 'specific_charge'        // Applied to another charge (tax on tax)

export type ChargeDirection =
  | 'add'                    // Increases price (taxes, fees)
  | 'subtract'               // Decreases price (discounts, commissions)

export type ChargeTiming =
  | 'immediate'              // Applied at booking time
  | 'on_confirmation'        // Applied when booking confirmed
  | 'on_payment'             // Applied when payment received
  | 'on_service_date'        // Applied on service delivery
  | 'custom_date'            // Applied on a specific date

export type ConditionType =
  | 'date_range'             // Apply only in specific date range
  | 'day_of_week'            // Apply on specific days (M,T,W,T,F,S,S)
  | 'season'                 // Apply in specific season
  | 'quantity'               // Apply based on quantity
  | 'nights'                 // Apply based on number of nights
  | 'lead_time'              // Apply based on booking lead time
  | 'customer_type'          // Apply for specific customer types
  | 'item_type'              // Apply for specific inventory types
  | 'category'               // Apply for specific categories
  | 'occupancy'              // Apply for specific occupancy
  | 'board_type'             // Apply for specific board types
  | 'tour'                   // Apply for specific tours
  | 'custom'                 // Custom condition

export interface DynamicCharge {
  id: string
  
  // Basic info
  charge_name: string
  charge_type: ChargeType
  description?: string
  
  // Calculation
  calculation_type: CalculationType
  calculation_config: CalculationConfig
  
  // Application
  applied_to: AppliedTo
  direction: ChargeDirection
  timing: ChargeTiming
  
  // Conditions (when does this charge apply?)
  conditions?: ChargeCondition[]
  
  // Display & Accounting
  display_in_breakdown: boolean      // Show in price breakdown to customer?
  include_in_selling_price: boolean  // Include in quoted price or add later?
  tax_exempt: boolean                // Is this charge itself tax-exempt?
  accounting_code?: string           // For financial reporting
  
  // Status
  mandatory: boolean                 // Must be applied (e.g., government tax)
  active: boolean
  
  // Order of application (lower numbers applied first)
  application_order?: number
}

export interface CalculationConfig {
  // For percentage
  percentage?: number  // e.g., 0.2 for 20%
  
  // For fixed amounts
  fixed_amount?: number
  
  // For per-person/per-unit
  amount_per_unit?: number
  
  // For tiered pricing
  tiers?: ChargeTier[]
  
  // For formula-based (advanced)
  formula?: string  // e.g., "base_price * 0.1 + 5 if nights > 3"
  
  // Minimum/maximum bounds
  min_amount?: number
  max_amount?: number
  
  // Rounding
  round_to?: number  // e.g., 0.01 for cents, 1 for whole dollars
  
  // Compound settings
  compound?: boolean  // If true, applies to running total; if false, to original base
}

export interface ChargeTier {
  min_value: number      // Minimum quantity/amount for this tier
  max_value?: number     // Maximum (optional, last tier is unlimited)
  rate: number           // Rate for this tier
  calculation_type: 'percentage' | 'fixed_amount' | 'per_unit'
}

export interface ChargeCondition {
  condition_type: ConditionType
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal' | 'between' | 'in' | 'not_in'
  value: any
  value_max?: any  // For 'between' operator
}

// Helper type for day of week selection (M,T,W,T,F,S,S)
export interface DayOfWeekSelection {
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
}

// ============================================================================
// INVENTORY ITEM (Replaces Hotel + ServiceInventoryType)
// ============================================================================

export interface InventoryItem {
  id: number
  
  // Type discriminator
  item_type: InventoryItemType
  
  // Common fields (all inventory types)
  name: string
  location?: string
  description?: string
  
  // Categories (polymorphic - room groups, service categories, venue sections, etc.)
  categories: ItemCategory[]
  
  // Type-specific metadata
  metadata: ItemMetadata
  
  // Status
  active: boolean
  
  // Timestamps
  created_at?: string
  updated_at?: string
}

// Polymorphic metadata based on item_type
export interface ItemMetadata {
  // For hotels (item_type === 'hotel')
  star_rating?: number
  city?: string
  country?: string
  address?: string
  
  // For tickets (item_type === 'ticket')
  event_type?: 'sports' | 'concert' | 'theater' | 'festival' | 'conference' | 'attraction' | 'other'
  venue_name?: string
  event_name?: string
  
  // For transfers (item_type === 'transfer')
  transfer_type?: 'airport' | 'hotel' | 'venue' | 'station' | 'other'
  default_routes?: Array<{ from: string; to: string }>
  
  // For activities (item_type === 'activity')
  activity_type?: 'tour' | 'excursion' | 'adventure' | 'cultural' | 'educational' | 'other'
  duration?: string  // e.g., "2 hours", "Full day"
  difficulty?: 'easy' | 'moderate' | 'challenging'
  
  // For meals (item_type === 'meal')
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'gala' | 'reception' | 'buffet' | 'other'
  cuisine_type?: string
  dietary_options?: string[]
  
  // For venues (item_type === 'venue')
  venue_type?: 'stadium' | 'arena' | 'theater' | 'conference' | 'banquet' | 'other'
  total_capacity?: number
  
  // For transport (item_type === 'transport')
  transport_type?: 'bus' | 'coach' | 'train' | 'flight' | 'van' | 'car' | 'boat' | 'helicopter'
  
  // For experiences (item_type === 'experience')
  experience_type?: 'vip' | 'exclusive' | 'luxury' | 'adventure' | 'cultural' | 'other'
  exclusivity_level?: 'standard' | 'premium' | 'vip' | 'ultra_vip'
  
  // Common contact info
  contact_info?: {
    phone?: string
    email?: string
    website?: string
  }
  
  // Common additional fields
  provider_name?: string
  operating_hours?: string
  seasonal?: boolean
  requires_booking_lead_time?: string  // e.g., "24 hours", "7 days"
}

// ============================================================================
// ITEM CATEGORY (Replaces RoomGroup + ServiceCategoryItem)
// ============================================================================

export interface ItemCategory {
  id: string
  item_id: number
  
  // Basic info
  category_name: string
  description?: string
  features?: string
  
  // Capacity/sizing information (polymorphic)
  capacity_info: CapacityInfo
  
  // Pricing behavior (polymorphic)
  pricing_behavior: PricingBehavior
  
  // Display order
  sort_order?: number
}

export interface CapacityInfo {
  // For hotel rooms (item_type === 'hotel')
  max_occupancy?: number
  
  // For vehicles/transport (item_type === 'transport' or service transfers)
  max_pax?: number
  min_pax?: number
  
  // For venue sections (item_type === 'venue')
  section_capacity?: number
  
  // For other services
  recommended_group_size?: number
}

export interface PricingBehavior {
  // How this category is priced
  pricing_mode: PricingMode
  
  // For hotels with per_occupancy pricing
  occupancy_types?: OccupancyType[]
  
  // For hotels with meal plans
  board_options?: BoardType[]
  
  // For directional services (transfers, etc.)
  directional?: boolean
  directions?: ServiceDirection[]
  
  // For tiered pricing
  supports_volume_discounts?: boolean
}

// ============================================================================
// UNIFIED CONTRACT (Replaces Contract + ServiceContract)
// ============================================================================

export interface UnifiedContract {
  id: number
  
  // Links
  supplier_id: number
  supplierName: string
  item_id: number
  itemName: string
  item_type: InventoryItemType  // Denormalized for quick filtering
  tour_ids?: number[]
  tourNames?: string[]
  
  // Basic info
  contract_name: string
  valid_from: string
  valid_to: string
  currency: string
  
  // Note: Allocations moved to separate system - see Allocation interface
  
  // Pricing strategy
  pricing_strategy: ContractPricingStrategy
  
  // Default rates (for allocation-level overrides)
  default_rates?: DefaultRates
  
  // Dynamic charges system (NEW - replaces simple markup/tax fields)
  dynamic_charges: DynamicCharge[]
  
  // DEPRECATED: Legacy pricing fields (kept for backward compatibility)
  // Use dynamic_charges instead for new contracts
  markup_percentage?: number
  tax_rate?: number
  service_fee?: number
  
  // Hotel-specific costs (only populated if item_type === 'hotel')
  // DEPRECATED: Use dynamic_charges for more flexibility
  hotel_costs?: HotelCosts
  
  // Constraints
  days_of_week?: Record<string, boolean>
  min_nights?: number
  max_nights?: number
  
  // Policies
  attrition_stages?: AttritionStage[]
  cancellation_stages?: CancellationStage[]
  payment_schedule?: PaymentSchedule[]
  contracted_payment_total?: number
  adjusted_payment_total?: number
  adjustment_notes?: string
  
  // Notes
  cancellation_policy?: string
  notes?: string
  
  // Plugin-specific metadata (for storing type-specific data)
  hotel_meta?: {
    total_rooms?: number
    base_rate?: number
    room_allocations?: any[]
    occupancy_rates?: any[]
    notes?: string
  }
  
  // Status
  active: boolean
  
  // Timestamps
  created_at?: string
  updated_at?: string
}

// ============================================================================
// STANDALONE ALLOCATION (Separate from contracts)
// ============================================================================

export interface Allocation {
  id: number
  
  // Links
  item_id: number
  itemName: string
  item_type: InventoryItemType
  contract_id?: number  // Optional link to contract
  contractName?: string
  supplier_id: number
  supplierName: string
  tour_ids?: number[]
  tourNames?: string[]
  
  // Allocation details
  category_ids: string[]  // Which categories are allocated
  quantity: number        // Total quantity allocated
  
  // Pool management
  allocation_pool_id: string  // Required - links to pool for capacity tracking
  
  // Label and description
  label: string
  description?: string
  
  // Validity period (can be different from contract)
  valid_from: string
  valid_to: string
  
  // Status
  active: boolean
  
  // Timestamps
  created_at?: string
  updated_at?: string
}

// Legacy interface - to be deprecated
export interface UnifiedAllocation {
  // Categories (can be multiple for shared pools - e.g., "Run of House")
  category_ids: string[]
  
  // Quantity
  quantity: number
  
  // Pool ID (enables cross-contract and cross-rate inventory sharing)
  allocation_pool_id?: string
  
  // Label (e.g., "Run of House", "F1 Weekend Block", "Premium Package")
  label?: string
  
  // Rate overrides (optional - specific to this allocation)
  rate_overrides?: RateOverrides
}

export interface DefaultRates {
  // For per_occupancy pricing strategy
  occupancy_rates?: OccupancyRate[]
  
  // For per_unit/flat_rate pricing strategy
  base_rate?: number
}

export interface RateOverrides {
  // For per_occupancy strategy
  occupancy_rates?: OccupancyRate[]
  
  // For flat/per_unit strategy
  base_rate?: number
}

export interface OccupancyRate {
  occupancy_type: OccupancyType
  rate: number
}

export interface HotelCosts {
  // Per-person per-night tax
  city_tax_per_person_per_night?: number
  
  // Per-room per-night fee
  resort_fee_per_night?: number
  
  // Percentage discount from supplier (reduces cost)
  supplier_commission_rate?: number
  
  // Board/meal options (per person per night)
  board_options?: BoardOption[]
}

export interface BoardOption {
  board_type: BoardType
  additional_cost: number  // Per person per night
}

export interface AttritionStage {
  date: string
  release_percentage: number
  releasable_rooms?: number
}

export interface CancellationStage {
  cutoff_date: string
  penalty_percentage: number
  penalty_description?: string
}

export interface PaymentSchedule {
  payment_date: string
  amount_due: number
  paid: boolean
  paid_date?: string
  notes?: string
}

// ============================================================================
// UNIFIED RATE (Replaces Rate + ServiceRate)
// ============================================================================

export interface UnifiedRate {
  id: number
  
  // Links
  contract_id?: number  // Optional for buy-to-order
  contractName?: string
  item_id: number
  itemName: string
  item_type: InventoryItemType  // Denormalized for quick filtering
  category_id: string
  categoryName: string
  tour_id?: number
  tourName?: string
  
  // Pool assignment (enables inventory sharing)
  allocation_pool_id?: string
  
  // Base pricing
  base_rate: number
  selling_price: number  // Calculated: varies by type
  currency: string
  
  // Dynamic charges (rate-level overrides/additions)
  dynamic_charges?: DynamicCharge[]  // Optional: supplements or overrides contract charges
  
  // DEPRECATED: Legacy pricing field (kept for backward compatibility)
  markup_percentage?: number
  
  // Inventory tracking
  inventory_type: 'contract' | 'buy_to_order'
  allocated_quantity?: number  // Total allocated (if contract)
  available_quantity?: number  // Currently available (if contract)
  booked_quantity?: number     // Currently booked
  
  // Type-specific details (polymorphic)
  rate_details: RateDetails
  
  // Cost overrides (for buy-to-order or rate-level overrides)
  cost_overrides?: CostOverrides
  
  // Validity
  valid_from: string
  valid_to: string
  
  // Constraints
  min_nights?: number
  max_nights?: number
  days_of_week?: Record<string, boolean>
  
  // Status
  active: boolean
  inactive_reason?: string
  
  // Metadata
  estimated_costs?: boolean  // True for buy-to-order
  
  // Timestamps
  created_at?: string
  updated_at?: string
}

export interface RateDetails {
  // For hotels (item_type === 'hotel')
  occupancy_type?: OccupancyType
  board_type?: BoardType
  board_cost?: number  // Total board cost per room per night (already multiplied by occupancy)
  board_included?: boolean  // If true, board_cost is included in selling price
  
  // For directional services (transfers, etc.)
  direction?: ServiceDirection
  paired_rate_id?: number  // Link to return journey (for round trips)
  
  // For tiered pricing
  volume_tiers?: VolumeTier[]
  
  // For per-unit pricing (service-specific)
  pricing_unit?: 'per_person' | 'per_vehicle' | 'per_group' | 'flat_rate'
  
  // NEW: Time-based scheduling
  schedule_config?: ScheduleConfig
  
  // NEW: Group size pricing
  group_pricing?: GroupPricingConfig
  
  // NEW: Capacity management
  capacity_config?: CapacityConfig
}

export interface VolumeTier {
  min_quantity: number
  max_quantity?: number
  rate: number
  discount_percentage?: number
}

export interface CostOverrides {
  // Flag to enable overrides
  override_costs?: boolean
  
  // Common costs
  tax_rate?: number
  service_fee?: number
  
  // Hotel-specific costs
  city_tax_per_person_per_night?: number
  resort_fee_per_night?: number
  supplier_commission_rate?: number
  board_cost?: number  // Override board cost for this specific rate
}

// ============================================================================
// HELPER TYPES & UTILITIES
// ============================================================================

export interface InventoryItemFilter {
  item_type?: InventoryItemType | 'all'
  tour_id?: number | 'all'
  supplier_id?: number | 'all'
  active?: boolean | 'all'
  search_term?: string
}

export interface UnifiedContractFilter {
  item_type?: InventoryItemType | 'all'
  supplier_id?: number | 'all'
  tour_id?: number | 'all'
  active?: boolean | 'all'
  search_term?: string
}

export interface UnifiedRateFilter {
  item_type?: InventoryItemType | 'all'
  tour_id?: number | 'all'
  active?: boolean | 'all'
  inventory_type?: 'contract' | 'buy_to_order' | 'all'
  search_term?: string
}

// Type guards
export function isHotelItem(item: InventoryItem): boolean {
  return item.item_type === 'hotel'
}

export function isServiceItem(item: InventoryItem): boolean {
  return ['ticket', 'transfer', 'activity', 'meal', 'venue', 'transport', 'experience', 'other'].includes(item.item_type)
}

export function isVenueItem(item: InventoryItem): boolean {
  return item.item_type === 'venue'
}

export function hasHotelCosts(contract: UnifiedContract): contract is UnifiedContract & { hotel_costs: HotelCosts } {
  return contract.item_type === 'hotel' && !!contract.hotel_costs
}

export function hasHotelDetails(rate: UnifiedRate): boolean {
  return rate.item_type === 'hotel' && !!(rate.rate_details.occupancy_type && rate.rate_details.board_type)
}

export function hasServiceDirection(rate: UnifiedRate): boolean {
  return ['ticket', 'transfer', 'activity', 'meal', 'venue', 'transport', 'experience', 'other'].includes(rate.item_type) && !!rate.rate_details.direction
}

// Display helpers
export const ITEM_TYPE_LABELS: Record<InventoryItemType, string> = {
  hotel: 'Hotel',
  ticket: 'Ticket',
  transfer: 'Transfer',
  activity: 'Activity',
  meal: 'Meal',
  venue: 'Venue',
  transport: 'Transport',
  experience: 'Experience',
  other: 'Other Service'
}

export const ITEM_TYPE_ICONS: Record<InventoryItemType, string> = {
  hotel: 'Building2',       // Hotel building icon
  ticket: 'Ticket',         // Ticket icon
  transfer: 'Car',          // Car/vehicle icon
  activity: 'Compass',      // Activity/exploration icon
  meal: 'Utensils',         // Meal/dining icon
  venue: 'MapPin',          // Venue/location icon
  transport: 'Truck',       // Transport/logistics icon
  experience: 'Sparkles',   // Premium experience icon
  other: 'Package'          // Generic package icon
}

export const ITEM_TYPE_DESCRIPTIONS: Record<InventoryItemType, string> = {
  hotel: 'Hotel accommodations and room inventory',
  ticket: 'Event tickets, venue passes, and attraction entries',
  transfer: 'Airport transfers and ground transportation',
  activity: 'Tours, excursions, and guided activities',
  meal: 'Dining experiences and meal packages',
  venue: 'Venue hire and event space rental',
  transport: 'Long-distance transport (trains, flights, coaches)',
  experience: 'Special VIP packages and exclusive experiences',
  other: 'Miscellaneous services and add-ons'
}

export const PRICING_MODE_LABELS: Record<PricingMode, string> = {
  per_occupancy: 'Per Occupancy',
  per_unit: 'Per Unit',
  per_person: 'Per Person',
  per_vehicle: 'Per Vehicle',
  per_group: 'Per Group',
  flat_rate: 'Flat Rate',
  tiered: 'Tiered'
}

export const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  room_only: 'Room Only',
  bed_breakfast: 'Bed & Breakfast',
  half_board: 'Half Board',
  full_board: 'Full Board',
  all_inclusive: 'All-Inclusive'
}

export const DIRECTION_LABELS: Record<ServiceDirection, string> = {
  inbound: 'Inbound',
  outbound: 'Outbound',
  round_trip: 'Round Trip',
  one_way: 'One Way'
}

// ============================================================================
// DYNAMIC CHARGES - LABELS & HELPERS
// ============================================================================

export const CHARGE_TYPE_LABELS: Record<ChargeType, string> = {
  tax: 'Tax',
  fee: 'Fee',
  commission: 'Commission',
  discount: 'Discount',
  surcharge: 'Surcharge',
  deposit: 'Deposit',
  penalty: 'Penalty',
  gratuity: 'Gratuity',
  insurance: 'Insurance',
  other: 'Other'
}

export const CALCULATION_TYPE_LABELS: Record<CalculationType, string> = {
  percentage: 'Percentage',
  fixed_amount: 'Fixed Amount',
  per_person: 'Per Person',
  per_person_per_night: 'Per Person Per Night',
  per_unit: 'Per Unit',
  per_unit_per_day: 'Per Unit Per Day',
  tiered: 'Tiered/Volume Based',
  formula: 'Custom Formula'
}

export const APPLIED_TO_LABELS: Record<AppliedTo, string> = {
  base_price: 'Base Price',
  subtotal: 'Subtotal (after other charges)',
  total: 'Total (final)',
  specific_charge: 'Specific Charge'
}

export const CHARGE_DIRECTION_LABELS: Record<ChargeDirection, string> = {
  add: 'Add (increases price)',
  subtract: 'Subtract (decreases price)'
}

export const CHARGE_TIMING_LABELS: Record<ChargeTiming, string> = {
  immediate: 'Immediate (at booking)',
  on_confirmation: 'On Confirmation',
  on_payment: 'On Payment',
  on_service_date: 'On Service Date',
  custom_date: 'Custom Date'
}

export const CONDITION_TYPE_LABELS: Record<ConditionType, string> = {
  date_range: 'Date Range',
  day_of_week: 'Day of Week',
  season: 'Season',
  quantity: 'Quantity',
  nights: 'Number of Nights',
  lead_time: 'Booking Lead Time',
  customer_type: 'Customer Type',
  item_type: 'Item Type',
  category: 'Category',
  occupancy: 'Occupancy',
  board_type: 'Board Type',
  tour: 'Tour',
  custom: 'Custom'
}

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
}

export const DAY_OF_WEEK_SHORT: Record<DayOfWeek, string> = {
  monday: 'M',
  tuesday: 'T',
  wednesday: 'W',
  thursday: 'T',
  friday: 'F',
  saturday: 'S',
  sunday: 'S'
}

// Helper to get day of week from date
export function getDayOfWeek(date: Date): DayOfWeek {
  const dayIndex = date.getDay() // 0 = Sunday, 1 = Monday, ...
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[dayIndex]
}

// Helper to check if a date matches day of week condition
export function matchesDayOfWeek(date: Date, allowedDays: DayOfWeek[]): boolean {
  const dayOfWeek = getDayOfWeek(date)
  return allowedDays.includes(dayOfWeek)
}

// Helper to convert DayOfWeekSelection to array
export function daySelectionToArray(selection: DayOfWeekSelection): DayOfWeek[] {
  const days: DayOfWeek[] = []
  if (selection.monday) days.push('monday')
  if (selection.tuesday) days.push('tuesday')
  if (selection.wednesday) days.push('wednesday')
  if (selection.thursday) days.push('thursday')
  if (selection.friday) days.push('friday')
  if (selection.saturday) days.push('saturday')
  if (selection.sunday) days.push('sunday')
  return days
}

// Helper to convert array to DayOfWeekSelection
export function arrayToDaySelection(days: DayOfWeek[]): DayOfWeekSelection {
  return {
    monday: days.includes('monday'),
    tuesday: days.includes('tuesday'),
    wednesday: days.includes('wednesday'),
    thursday: days.includes('thursday'),
    friday: days.includes('friday'),
    saturday: days.includes('saturday'),
    sunday: days.includes('sunday')
  }
}

// Helper to convert Record<string, boolean> to DayOfWeekSelection
export function recordToDaySelection(record?: Record<string, boolean>): DayOfWeekSelection {
  if (!record) {
    return {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    }
  }
  return {
    monday: record['monday'] !== false,
    tuesday: record['tuesday'] !== false,
    wednesday: record['wednesday'] !== false,
    thursday: record['thursday'] !== false,
    friday: record['friday'] !== false,
    saturday: record['saturday'] !== false,
    sunday: record['sunday'] !== false
  }
}

// Helper to convert DayOfWeekSelection to Record<string, boolean>
export function daySelectionToRecord(selection: DayOfWeekSelection): Record<string, boolean> {
  return {
    monday: selection.monday,
    tuesday: selection.tuesday,
    wednesday: selection.wednesday,
    thursday: selection.thursday,
    friday: selection.friday,
    saturday: selection.saturday,
    sunday: selection.sunday
  }
}

// ============================================================================
// POOL-CENTRIC CAPACITY MANAGEMENT
// ============================================================================

export interface DailyAvailability {
  date: string                   // "2024-04-04"
  total_capacity: number         // 1 (from pool)
  booked_quantity: number        // 1 (from bookings)
  available_quantity: number     // 0 (calculated)
  booking_ids: string[]          // ["BOOK-12345"]
}

export interface PoolBooking {
  id: string
  pool_id: string
  
  // Booking details
  check_in: string               // "2024-04-04"
  check_out: string              // "2024-04-11"
  nights: number                 // 7
  guests: number                 // 2
  
  // Rate information (for pricing)
  rate_ids: number[]             // Which rates this booking uses
  total_amount: number           // €1,350
  
  // Booking management
  booking_reference: string      // "BOOK-12345"
  status: 'confirmed' | 'pending' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface AllocationPoolCapacity {
  pool_id: string
  item_id: number
  item_name: string
  item_type: InventoryItemType
  
  // Physical capacity (from allocations)
  total_capacity: number                    // 1 room, 100 seats, etc.
  
  // Current bookings (from pool bookings)
  current_bookings: number                  // Total bookings in pool
  available_spots: number                   // Calculated: total - current
  
  // Date-aware tracking
  daily_availability: Record<string, DailyAvailability>
  
  // Pool settings
  allows_overbooking: boolean
  overbooking_limit?: number
  waitlist_enabled: boolean
  waitlist_max_size?: number
  
  // Booking constraints
  minimum_booking_size?: number
  maximum_booking_size?: number
  minimum_nights?: number
  maximum_nights?: number
  
  // Status
  status: 'healthy' | 'warning' | 'critical' | 'overbooked'
  peak_occupancy_date?: string              // Date with highest occupancy
  last_updated: string
}

export interface RateCapacitySettings {
  rate_id: number
  pool_id: string
  
  // Optional rate-specific limits
  max_bookings_per_rate?: number           // "This rate can only book 20 of the 100 pool seats"
  rate_current_bookings: number            // How many bookings this specific rate has
  
  // Rate-specific constraints
  rate_minimum_guests?: number
  rate_maximum_guests?: number
  
  // Inherits from pool by default
  // Can override pool settings if needed
}

// ============================================================================
// NEW FEATURE LABELS & HELPERS
// ============================================================================


export const AVAILABILITY_STATUS_LABELS = {
  available: 'Available',
  limited: 'Limited Spots',
  full: 'Full',
  waitlist: 'Waitlist Only',
  closed: 'Closed'
} as const

export const AVAILABILITY_STATUS_COLORS = {
  available: 'bg-green-100 text-green-800',
  limited: 'bg-yellow-100 text-yellow-800',
  full: 'bg-red-100 text-red-800',
  waitlist: 'bg-orange-100 text-orange-800',
  closed: 'bg-gray-100 text-gray-800'
} as const

// Helper functions for new features
export function calculateAvailableSpots(capacityConfig: CapacityConfig): number {
  const { total_capacity, current_bookings, overbooking_allowed, overbooking_limit } = capacityConfig
  const maxCapacity = overbooking_allowed ? total_capacity + overbooking_limit : total_capacity
  return Math.max(0, maxCapacity - current_bookings)
}

export function getAvailabilityStatus(capacityConfig: CapacityConfig): AvailabilityStatus {
  const availableSpots = calculateAvailableSpots(capacityConfig)
  const { waitlist_enabled, waitlist_max_size } = capacityConfig
  
  if (availableSpots <= 0) {
    if (waitlist_enabled && waitlist_max_size && waitlist_max_size > 0) {
      return {
        status: 'waitlist',
        spots_remaining: 0,
        waitlist_position: Math.min(waitlist_max_size, Math.abs(availableSpots))
      }
    }
    return { status: 'full', spots_remaining: 0 }
  }
  
  if (availableSpots <= 5) {
    return { status: 'limited', spots_remaining: availableSpots }
  }
  
  return { status: 'available', spots_remaining: availableSpots }
}

export function formatTimeSlot(timeSlot: TimeSlot): string {
  return `${timeSlot.start_time} - ${timeSlot.end_time}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export function getGroupPricingForPax(groupPricing: GroupPricingConfig, pax: number): GroupPricingTier | null {
  if (!groupPricing.has_group_pricing || !groupPricing.pricing_tiers.length) {
    return null
  }
  
  return groupPricing.pricing_tiers.find(tier => 
    pax >= tier.min_pax && (tier.max_pax === undefined || pax <= tier.max_pax)
  ) || null
}

// ============================================================================
// POOL CAPACITY HELPER FUNCTIONS
// ============================================================================

export function generateBookingReference(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `BOOK-${timestamp}-${random}`.toUpperCase()
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getDateRange(checkIn: string, checkOut: string): string[] {
  const dates: string[] = []
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  
  for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
    dates.push(date.toISOString().split('T')[0])
  }
  
  return dates
}

export function isDateInRange(date: string, checkIn: string, checkOut: string): boolean {
  const checkDate = new Date(date)
  const startDate = new Date(checkIn)
  const endDate = new Date(checkOut)
  
  return checkDate >= startDate && checkDate < endDate
}

export function calculatePoolStatus(pool: AllocationPoolCapacity): 'healthy' | 'warning' | 'critical' | 'overbooked' {
  if (pool.current_bookings > pool.total_capacity + (pool.overbooking_limit || 0)) {
    return 'overbooked'
  }
  
  const utilization = pool.total_capacity > 0 ? (pool.current_bookings / pool.total_capacity) * 100 : 0
  
  if (utilization >= 90) {
    return 'critical'
  } else if (utilization >= 75) {
    return 'warning'
  } else {
    return 'healthy'
  }
}

export function checkDailyAvailability(
  pool: AllocationPoolCapacity,
  checkIn: string,
  checkOut: string
): boolean {
  const requestedDates = getDateRange(checkIn, checkOut)
  
  for (const date of requestedDates) {
    const daily = pool.daily_availability[date]
    if (!daily) {
      // No bookings for this date, check against total capacity
      const maxCapacity = pool.total_capacity + (pool.overbooking_limit || 0)
      if (maxCapacity <= 0) {
        return false
      }
    } else if (daily.available_quantity <= 0) {
      return false
    }
  }
  
  return true
}

export function calculatePeakOccupancyDate(pool: AllocationPoolCapacity): string | undefined {
  let peakDate: string | undefined
  let maxOccupancy = 0
  
  Object.entries(pool.daily_availability).forEach(([date, daily]) => {
    if (daily.booked_quantity > maxOccupancy) {
      maxOccupancy = daily.booked_quantity
      peakDate = date
    }
  })
  
  return peakDate
}


