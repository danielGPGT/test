import { createContext, useContext, useState, ReactNode } from 'react'

// Types
export interface Tour {
  id: number
  name: string
  start_date: string
  end_date: string
  description: string
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
  additional_cost: number // Additional cost per night on top of base rate
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
  contract_id: number
  contractName: string
  room_group_id: string // References hotel.room_groups[].id
  roomName: string
  occupancy_type: OccupancyType
  board_type: BoardType // Meal plan included
  rate: number // Net rate including board
  // Tax rate and currency inherited from contract, but can be overridden
  tax_rate?: number
  currency?: string
}

export interface Listing {
  id: number
  tour_id: number
  tourName: string
  // For inventory: references contract (pre-negotiated)
  // For buy-to-order: optional (or references expected pricing hotel)
  contract_id?: number
  contractName?: string
  // For buy-to-order: specify hotel directly
  hotel_id?: number
  hotelName?: string
  room_group_id: string // References hotel.room_groups[].id
  roomName: string
  occupancy_type: OccupancyType
  board_type: BoardType
  quantity: number
  purchase_type: 'inventory' | 'buy_to_order'
  // Pricing breakdown
  cost_price: number // For inventory: from contract. For buy-to-order: estimated/expected
  selling_price: number // What customer pays
  commission_rate?: number // Your markup on base nights (percentage, e.g., 0.15 = 15%)
  shoulder_night_margin?: number // Your markup on shoulder nights (percentage, e.g., 0.25 = 25%)
  sold: number
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

export interface Booking {
  id: number
  listing_id: number
  tourName: string
  contractName: string
  roomName: string
  occupancy_type: OccupancyType
  purchase_type: 'inventory' | 'buy_to_order'
  customer_name: string
  customer_email: string
  // Date-based booking
  check_in_date: string // ISO format date
  check_out_date: string // ISO format date
  quantity: number // Number of rooms
  nights: number // Calculated: number of nights
  // Pricing breakdown
  nightly_rates?: number[] // Rate for each night [night1, night2, ...]
  total_price: number
  booking_date: string
  status: 'confirmed' | 'pending' | 'cancelled'
  purchase_status?: 'not_required' | 'pending_purchase' | 'purchased' | 'failed'
  // Purchase order details (for buy-to-order)
  purchase_order?: {
    assigned_to?: string
    hotel_contact?: string
    purchase_date?: string
    hotel_confirmation?: string
    cost_per_room?: number
    total_cost?: number
    notes?: string
  }
}

interface DataContextType {
  summary: Summary
  tours: Tour[]
  hotels: Hotel[]
  contracts: Contract[]
  rates: Rate[]
  listings: Listing[]
  bookings: Booking[]
  recentActivity: Activity[]
  hotelLocations: string[]
  addTour: (tour: Omit<Tour, 'id'>) => void
  updateTour: (id: number, tour: Partial<Tour>) => void
  deleteTour: (id: number) => void
  addHotel: (hotel: Omit<Hotel, 'id'>) => void
  updateHotel: (id: number, hotel: Partial<Hotel>) => void
  deleteHotel: (id: number) => void
  addContract: (contract: Omit<Contract, 'id'>) => void
  updateContract: (id: number, contract: Partial<Contract>) => void
  deleteContract: (id: number) => void
  addRate: (rate: Omit<Rate, 'id' | 'contractName' | 'roomName'>) => void
  updateRate: (id: number, rate: Partial<Rate>) => void
  deleteRate: (id: number) => void
  addListing: (listing: Omit<Listing, 'id' | 'tourName' | 'contractName' | 'roomName'>) => void
  updateListing: (id: number, listing: Partial<Listing>) => void
  deleteListing: (id: number) => void
  addBooking: (booking: Omit<Booking, 'id' | 'tourName' | 'contractName' | 'roomName' | 'occupancy_type' | 'purchase_type' | 'booking_date' | 'status' | 'purchase_status' | 'purchase_order'>) => void
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
    {
      id: 1,
      contract_id: 1,
      contractName: "May 2025 Block",
      room_group_id: "rg-1",
      roomName: "Standard Double",
      occupancy_type: "single" as const,
      board_type: "bed_breakfast" as const,
      rate: 100,
    },
    {
      id: 2,
      contract_id: 1,
      contractName: "May 2025 Block",
      room_group_id: "rg-1",
      roomName: "Standard Double",
      occupancy_type: "double" as const,
      board_type: "bed_breakfast" as const,
      rate: 130,
    },
    {
      id: 3,
      contract_id: 1,
      contractName: "May 2025 Block",
      room_group_id: "rg-1",
      roomName: "Standard Double",
      occupancy_type: "triple" as const,
      board_type: "bed_breakfast" as const,
      rate: 150,
    },
    {
      id: 4,
      contract_id: 1,
      contractName: "May 2025 Block",
      room_group_id: "rg-1",
      roomName: "Standard Double",
      occupancy_type: "double" as const,
      board_type: "half_board" as const,
      rate: 160,
    }
  ],
  listings: [
    {
      id: 1,
      tour_id: 1,
      tourName: "Spring in Paris",
      contract_id: 1,
      contractName: "May 2025 Block",
      room_group_id: "rg-1",
      roomName: "Standard Double",
      occupancy_type: "double" as const,
      board_type: "bed_breakfast" as const,
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
      occupancy_type: "double" as const,
      board_type: "bed_breakfast" as const,
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
      occupancy_type: "single" as const,
      board_type: "bed_breakfast" as const,
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
      listing_id: 1,
      tourName: "Spring in Paris",
      contractName: "May 2025 Block",
      roomName: "Standard Double",
      occupancy_type: "double" as const,
      purchase_type: "inventory" as const,
      customer_name: "John Smith",
      customer_email: "john.smith@example.com",
      check_in_date: "2025-05-05",
      check_out_date: "2025-05-07",
      quantity: 2,
      nights: 2,
      nightly_rates: [140, 140], // 2 nights at contract rate
      total_price: 280,
      booking_date: "2025-01-15",
      status: "confirmed" as const,
      purchase_status: "not_required" as const,
    }
  ]
}

// LocalStorage keys
const STORAGE_KEYS = {
  tours: 'tours-inventory-tours',
  hotels: 'tours-inventory-hotels',
  contracts: 'tours-inventory-contracts',
  rates: 'tours-inventory-rates',
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
  const [listings, setListingsState] = useState<Listing[]>(() => loadFromStorage(STORAGE_KEYS.listings, initialData.listings))
  const [bookings, setBookingsState] = useState<Booking[]>(() => loadFromStorage(STORAGE_KEYS.bookings, initialData.bookings))

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
  const addContract = (contract: Omit<Contract, 'id'>) => {
    const hotel = hotels.find(h => h.id === contract.hotel_id)
    const newContract = { 
      ...contract, 
      id: Math.max(...contracts.map(c => c.id), 0) + 1,
      hotelName: hotel?.name || ''
    }
    setContracts([...contracts, newContract])
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
    const hotel = hotels.find(h => h.id === contract?.hotel_id)
    const roomGroup = hotel?.room_groups.find(rg => rg.id === rate.room_group_id)
    
    const newRate = { 
      ...rate, 
      id: Math.max(...rates.map(r => r.id), 0) + 1,
      contractName: contract?.contract_name || '',
      roomName: roomGroup?.room_type || '',
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
        const hotel = hotels.find(h => h.id === contract?.hotel_id)
        const roomGroup = hotel?.room_groups.find(rg => rg.id === (rate.room_group_id || r.room_group_id))
        
        return { 
          ...r, 
          ...rate,
          contractName: contract?.contract_name || r.contractName,
          roomName: roomGroup?.room_type || r.roomName,
        }
      }
      return r
    }))
  }

  const deleteRate = (id: number) => {
    setRates(rates.filter(r => r.id !== id))
  }

  // Listing CRUD
  const addListing = (listing: Omit<Listing, 'id' | 'tourName' | 'contractName' | 'hotelName' | 'roomName'>) => {
    const tour = tours.find(t => t.id === listing.tour_id)
    
    // For inventory: get info from contract
    // For buy-to-order: get info from hotel directly
    let hotel: Hotel | undefined
    let contract: Contract | undefined
    
    if (listing.purchase_type === 'inventory' && listing.contract_id) {
      contract = contracts.find(c => c.id === listing.contract_id)
      hotel = hotels.find(h => h.id === contract?.hotel_id)
    } else if (listing.purchase_type === 'buy_to_order' && listing.hotel_id) {
      hotel = hotels.find(h => h.id === listing.hotel_id)
    }
    
    const roomGroup = hotel?.room_groups.find(rg => rg.id === listing.room_group_id)
    
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
  const addBooking = (booking: Omit<Booking, 'id' | 'tourName' | 'contractName' | 'roomName' | 'occupancy_type' | 'purchase_type' | 'booking_date' | 'status' | 'purchase_status' | 'hotel_confirmation'>) => {
    const listing = listings.find(l => l.id === booking.listing_id)
    if (!listing) {
      alert('Listing not found')
      return
    }

    // Check availability (strict for inventory, flexible for buy-to-order)
    const available = listing.quantity - listing.sold
    
    if (listing.purchase_type === 'inventory') {
      // Inventory: Hard limit
      if (booking.quantity > available) {
        alert(`Only ${available} rooms available in inventory!`)
        return
      }
    } else {
      // Buy-to-order: Soft warning if exceeding target
      if (booking.quantity > available && available > 0) {
        // Target exceeded but allow it (flexible capacity)
        console.log(`INFO: Buy-to-order booking exceeds target allocation:
        Target: ${listing.quantity}
        Already sold: ${listing.sold}
        This booking: ${booking.quantity}
        New total: ${listing.sold + booking.quantity}
        Overage: ${(listing.sold + booking.quantity) - listing.quantity}`)
      }
    }

    // Determine purchase status based on listing type
    let purchaseStatus: 'not_required' | 'pending_purchase' | 'purchased' = 'not_required'
    let bookingStatus: 'confirmed' | 'pending' = 'confirmed'
    
    if (listing.purchase_type === 'buy_to_order') {
      purchaseStatus = 'pending_purchase'
      bookingStatus = 'pending' // Pending until operations purchases rooms
      
      // Notify operations team (console log simulates notification)
      console.log(`OPERATIONS ALERT - ACTION REQUIRED:
      ==========================================
      BUY-TO-ORDER BOOKING CREATED
      
      CUSTOMER: ${booking.customer_name}
      TOUR: ${listing.tourName || 'N/A'}
      HOTEL: ${listing.hotelName || 'N/A'}
      ROOM: ${listing.roomName} (${listing.occupancy_type})
      QUANTITY: ${booking.quantity} rooms
      SELLING PRICE: ${booking.total_price} (total to customer)
      
      ACTION: Operations team must purchase these 
              ${booking.quantity} rooms from the hotel.
      
      Next Steps:
      1. Contact hotel to purchase rooms
      2. Enter purchase details in system
      3. Confirm booking once purchased
      ==========================================`)
    }

    const newBooking: Booking = {
      ...booking,
      id: Math.max(...bookings.map(b => b.id), 0) + 1,
      tourName: listing.tourName,
      contractName: listing.contractName,
      roomName: listing.roomName,
      occupancy_type: listing.occupancy_type,
      purchase_type: listing.purchase_type,
      booking_date: new Date().toISOString().split('T')[0],
      status: bookingStatus,
      purchase_status: purchaseStatus,
    }
    
    setBookings([...bookings, newBooking])
    
    // Update listing sold count
    setListings(listings.map(l => 
      l.id === booking.listing_id 
        ? { ...l, sold: l.sold + booking.quantity }
        : l
    ))

    // Show appropriate message
    if (listing.purchase_type === 'buy_to_order') {
      alert(`Booking created!\n\nOPERATIONS TEAM NOTIFIED\n\nBooking Status: PENDING\nPurchase Status: Awaiting purchase\n\nThe operations team has been notified to purchase these rooms from the hotel. The booking will be confirmed once rooms are purchased.`)
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
    if (!booking || booking.purchase_type !== 'buy_to_order') return

    const totalCost = purchaseDetails.cost_per_room * booking.quantity
    const purchaseDate = new Date().toISOString().split('T')[0]

    setBookings(bookings.map(b => 
      b.id === bookingId 
        ? { 
            ...b, 
            status: 'confirmed' as const,
            purchase_status: 'purchased' as const,
            purchase_order: {
              assigned_to: purchaseDetails.assigned_to,
              hotel_contact: purchaseDetails.hotel_contact,
              purchase_date: purchaseDate,
              hotel_confirmation: purchaseDetails.hotel_confirmation,
              cost_per_room: purchaseDetails.cost_per_room,
              total_cost: totalCost,
              notes: purchaseDetails.notes || ''
            }
          }
        : b
    ))

    console.log(`PURCHASE RECORDED:
    Booking ID: ${bookingId}
    Purchased By: ${purchaseDetails.assigned_to}
    Hotel Confirmation: ${purchaseDetails.hotel_confirmation}
    Cost: ${totalCost} (${purchaseDetails.cost_per_room} × ${booking.quantity})
    Profit Margin: ${booking.total_price - totalCost}
    `)
  }

  const cancelBooking = (id: number) => {
    const booking = bookings.find(b => b.id === id)
    if (!booking) return

    // Return quantity to listing
    setListings(listings.map(l => 
      l.id === booking.listing_id 
        ? { ...l, sold: l.sold - booking.quantity }
        : l
    ))

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
      console.log('All data reset to initial state')
    }
  }

  const value = {
    summary: initialData.summary,
    tours,
    hotels,
    contracts,
    rates,
    listings,
    bookings,
    recentActivity: initialData.recentActivity,
    hotelLocations: initialData.hotelLocations,
    addTour,
    updateTour,
    deleteTour,
    addHotel,
    updateHotel,
    deleteHotel,
    addContract,
    updateContract,
    deleteContract,
    addRate,
    updateRate,
    deleteRate,
    addListing,
    updateListing,
    deleteListing,
    addBooking,
    updateBooking,
    cancelBooking,
    recordPurchaseDetails,
    resetAllData,
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

