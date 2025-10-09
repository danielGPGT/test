import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Types
export interface TourComponent {
  id: number
  tour_id: number
  component_type: 'accommodation' | 'transfer' | 'activity' | 'meal'
  
  // For accommodation components
  hotel_id?: number
  room_group_id?: string
  check_in_day: number              // Day number in tour (1, 2, 3, etc.)
  nights?: number
  board_type?: BoardType
  
  // Pricing (per couple - 2 people)
  pricing_mode: 'use_contract' | 'fixed_price'
  fixed_cost_per_couple?: number
  fixed_sell_per_couple?: number
  
  // For non-accommodation components
  service_name?: string
  provider?: string
  cost_per_couple?: number
  sell_per_couple?: number
  
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
}

export interface OccupancyRate {
  occupancy_type: OccupancyType
  rate: number // Base rate for this occupancy
}

export interface Contract {
  id: number
  hotel_id: number
  hotelName: string
  contract_name: string
  start_date: string
  end_date: string
  total_rooms: number
  base_rate: number
  currency: string
  
  // TOUR LINKING (optional - link contract to specific tours)
  tour_ids?: number[] // Optional: link to specific tours
  
  // ROOM ALLOCATIONS (replaces Stock entity)
  room_allocations?: RoomAllocation[] // Allocated rooms per room type
  
  // OCCUPANCY PRICING STRATEGY
  pricing_strategy?: 'per_occupancy' | 'flat_rate' // How rates vary by occupancy
  occupancy_rates?: OccupancyRate[] // If per_occupancy, rates for each occupancy type
  
  // MARKUP SETTINGS
  markup_percentage?: number // Default markup for regular nights (e.g., 0.60 = 60%)
  shoulder_markup_percentage?: number // Markup for shoulder nights (e.g., 0.30 = 30%)
  
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
  // Shoulder night rates
  pre_shoulder_rates?: number[] // [day-1, day-2, day-3...] Index 0 = night before start_date
  post_shoulder_rates?: number[] // [day+1, day+2, day+3...] Index 0 = night after end_date
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

export interface Rate {
  id: number
  contract_id?: number // Optional for buy-to-order rates
  contractName?: string
  hotel_id?: number // For buy-to-order rates without contract
  hotelName?: string
  room_group_id: string // References hotel.room_groups[].id
  roomName: string
  occupancy_type: OccupancyType // Single, Double, Triple, or Quad
  board_type: BoardType // Meal plan included
  
  // RATE STRUCTURE
  rate: number // Base room rate for this occupancy
  board_cost?: number // Board cost (per person per night for contract, total for buy-to-order)
  
  // VALIDITY & RESTRICTIONS
  valid_from?: string // Validity start date (required for buy-to-order)
  valid_to?: string // Validity end date (required for buy-to-order)
  min_nights?: number // Minimum nights (overrides contract, required for buy-to-order)
  max_nights?: number // Maximum nights (overrides contract, required for buy-to-order)
  estimated_costs?: boolean // Flag to indicate this is an estimated rate
  
  // SHOULDER NIGHT RATES (per occupancy)
  pre_shoulder_rates?: number[] // Rates for nights before validity period [day-1, day-2, ...]
  post_shoulder_rates?: number[] // Rates for nights after validity period [day+1, day+2, ...]
  
  // RATE-LEVEL COSTS (per room per night, unless specified)
  // For contract rates: optional overrides
  // For buy-to-order rates: required estimated costs
  tax_rate?: number // VAT/Sales tax
  city_tax_per_person_per_night?: number // City tax per person
  resort_fee_per_night?: number // Resort fee per room
  supplier_commission_rate?: number // Commission rate (expected discount)
  
  // MARKUP SETTINGS
  markup_percentage?: number // Default markup for regular nights (e.g., 0.60 = 60%)
  shoulder_markup_percentage?: number // Markup for shoulder nights (e.g., 0.30 = 30%)
  
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
  price_per_room: number // Price per room for the entire stay
  total_price: number // quantity × price_per_room
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
  contracts: Contract[]
  rates: Rate[]
  stocks: Stock[]
  listings: Listing[]
  bookings: Booking[]
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
  addContract: (contract: Omit<Contract, 'id' | 'hotelName'>) => void
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
    }
  ],
  contracts: [
    {
      id: 1,
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
    "London, UK"
  ],
  bookings: [
    {
      id: 1,
      tour_id: 1,
      tourName: "Spring in Paris",
      customer_name: "John Smith",
      customer_email: "john.smith@example.com",
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
    }
  ]
}

// LocalStorage keys
const STORAGE_KEYS = {
  tours: 'tours-inventory-tours',
  hotels: 'tours-inventory-hotels',
  contracts: 'tours-inventory-contracts',
  rates: 'tours-inventory-rates',
  stocks: 'tours-inventory-stocks',
  listings: 'tours-inventory-listings',
  bookings: 'tours-inventory-bookings',
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
  const [contracts, setContractsState] = useState<Contract[]>(() => loadFromStorage(STORAGE_KEYS.contracts, initialData.contracts))
  const [rates, setRatesState] = useState<Rate[]>(() => loadFromStorage(STORAGE_KEYS.rates, initialData.rates))
  // Stock state deprecated - keeping for backward compatibility but returning empty array
  const [stocks] = useState<Stock[]>([])
  const [listings, setListingsState] = useState<Listing[]>(() => loadFromStorage(STORAGE_KEYS.listings, initialData.listings))
  const [bookings, setBookingsState] = useState<Booking[]>(() => loadFromStorage(STORAGE_KEYS.bookings, initialData.bookings))
  const [conversionHistory, setConversionHistory] = useState<ConversionHistory[]>([])
  const [tourComponents, setTourComponentsState] = useState<TourComponent[]>(() => loadFromStorage('tourComponents', []))

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

  const setTourComponents = (data: TourComponent[] | ((prev: TourComponent[]) => TourComponent[])) => {
    setTourComponentsState(prev => {
      const next = typeof data === 'function' ? data(prev) : data
      saveToStorage('tourComponents', next)
      return next
    })
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

  // Contract CRUD
  const addContract = (contract: Omit<Contract, 'id' | 'hotelName'>) => {
    const hotel = hotels.find(h => h.id === contract.hotel_id)
    const newContract = { 
      ...contract, 
      id: Math.max(...contracts.map(c => c.id), 0) + 1,
      hotelName: hotel?.name || ''
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
              rate: occupancyRate, // Base room rate for this occupancy (now uses allocation override if set)
              board_cost: boardOption.additional_cost, // Per person per night
              board_included: true, // Board from contract
              markup_percentage: contract.markup_percentage || 0.60,
              shoulder_markup_percentage: contract.shoulder_markup_percentage || 0.30,
              currency: contract.currency,
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
  const addRate = (rate: Omit<Rate, 'id' | 'contractName' | 'roomName'>) => {
    const contract = contracts.find(c => c.id === rate.contract_id)
    // For buy-to-order rates, get hotel directly; for contract rates, get via contract
    const hotel = hotels.find(h => h.id === (rate.hotel_id || contract?.hotel_id))
    const roomGroup = hotel?.room_groups.find(rg => rg.id === rate.room_group_id)
    
    const newRate = { 
      ...rate, 
      id: Math.max(...rates.map(r => r.id), 0) + 1,
      contractName: contract?.contract_name || '',
      roomName: roomGroup?.room_type || '',
      hotelName: hotel?.name || '', // Add hotelName for buy-to-order rates
      // Inherit from contract if not specified
      currency: rate.currency || contract?.currency,
      tax_rate: rate.tax_rate !== undefined ? rate.tax_rate : contract?.tax_rate,
    }
    setRates([...rates, newRate as Rate])
  }

  const updateRate = (id: number, rate: Partial<Rate>) => {
    setRates(rates.map(r => {
      if (r.id === id) {
        const contract = contracts.find(c => c.id === (rate.contract_id || r.contract_id))
        // For buy-to-order rates, get hotel directly; for contract rates, get via contract
        const hotel = hotels.find(h => h.id === (rate.hotel_id || r.hotel_id || contract?.hotel_id))
        const roomGroup = hotel?.room_groups.find(rg => rg.id === (rate.room_group_id || r.room_group_id))
        
        return { 
          ...r, 
          ...rate,
          contractName: contract?.contract_name || r.contractName,
          roomName: roomGroup?.room_type || r.roomName,
          hotelName: hotel?.name || r.hotelName || '', // Add hotelName for buy-to-order rates
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
    _purchaseDetails: {
      assigned_to: string
      hotel_contact: string
      hotel_confirmation: string
      cost_per_room: number
      notes?: string
    }
  ) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (!booking) return

    // TODO: Update for new room-based structure to use _purchaseDetails
    setBookings(bookings.map(b => 
      b.id === bookingId 
        ? { ...b, status: 'confirmed' as const }
        : b
    ))

    console.log(`PURCHASE RECORDED for booking ${bookingId}`)
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
    contracts,
    rates,
    stocks,
    listings,
    bookings,
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

