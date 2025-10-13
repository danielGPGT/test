// Universal Core Types - Shared across all inventory types
// This is the stable foundation that never changes

export type InventoryTypeId = 
  | 'accommodation_room' 
  | 'event_ticket' 
  | 'transfer' 
  | 'activity'
  | 'meal'
  | 'venue'
  | 'transport';

// Core Entities (shared DB tables)
export interface Supplier {
  id: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  name: string;
  resource_type: InventoryTypeId;
  location?: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  resource_id: string;
  name: string;
  description?: string;
  product_meta: Record<string, any>; // Type-specific fields
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  supplier_id: string;
  contract_name: string;
  currency: string;
  valid_from: string;
  valid_to: string;
  priority: number; // Higher = more important
  timezone: string; // Timezone for cut-offs, SLA, attrition
  terms: string;
  plugin_meta: Record<string, any>; // Type-specific contract data
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  product_id: string;
  contract_id: string;
  channel?: string; // 'direct', 'ota', 'agent', etc.
  fulfilment_type: 'immediate' | 'confirmed' | 'guaranteed';
  offer_meta: Record<string, any>; // Type-specific offer data
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RateBand {
  id: string;
  offer_id: string;
  name: string;
  valid_from: string;
  valid_to: string;
  days_of_week: number[]; // [1,2,3,4,5,6,7] for Mon-Sun
  time_slots?: string[]; // ['09:00', '14:00'] for time-based inventory
  unit: 'per_unit' | 'per_person' | 'per_room' | 'per_vehicle';
  base_price: number;
  pricing_meta: Record<string, any>; // Type-specific pricing data
  allocation_pool_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AllocationPool {
  id: string;
  name: string;
  resource_id: string;
  pool_type: 'shared' | 'dedicated';
  total_capacity: number;
  pool_meta: Record<string, any>; // Type-specific pool data
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Allocation {
  id: string;
  allocation_pool_id: string;
  offer_id: string;
  quantity: number;
  valid_from: string;
  valid_to: string;
  allocation_meta: Record<string, any>; // Type-specific allocation data
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Hold {
  id: string;
  allocation_pool_id: string;
  quantity: number;
  valid_from: string;
  valid_to: string;
  hold_type: 'soft' | 'firm';
  expires_at: string;
  customer_id?: string;
  hold_meta: Record<string, any>; // Type-specific hold data
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  hold_id?: string; // Optional - bookings can be direct
  allocation_pool_id: string;
  quantity: number;
  valid_from: string;
  valid_to: string;
  customer_id: string;
  booking_meta: Record<string, any>; // Type-specific booking data
  status: 'confirmed' | 'cancelled' | 'no_show' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface StockLedger {
  id: string;
  allocation_pool_id: string;
  transaction_type: 'allocation' | 'hold' | 'booking' | 'release' | 'adjustment';
  quantity: number;
  reference_id: string; // ID of the allocation/hold/booking that caused this
  reference_type: 'allocation' | 'hold' | 'booking' | 'manual';
  notes?: string;
  created_at: string;
}

// Pricing Context for plugin calculators
export interface PricingContext {
  rateBand: RateBand;
  unit: string;
  pricingMeta: Record<string, any>;
  stayNights?: Date[];
  pax?: {
    adults: number;
    children: number[];
  };
  extras?: Record<string, any>;
}

// Availability Context for plugin calculators
export interface AvailabilityContext {
  allocationPool: AllocationPool;
  dateRange: {
    from: Date;
    to: Date;
  };
  granularity: 'date' | 'datetime' | 'segment';
  filters?: Record<string, any>;
}

// Plugin Interface
export interface ContractPlugin {
  id: InventoryTypeId;
  label: string;
  description: string;
  
  // Schema validation
  schema: any; // Zod schema for contracts.plugin_meta
  ratePricingSchema?: any; // Zod schema for rate_bands[*].pricing_meta
  
  // UI Components
  ContractForm: React.FC<ContractFormProps>;
  RateMetaForm?: React.FC<RateMetaFormProps>;
  ProductForm?: React.FC<ProductFormProps>;
  
  // Business Logic
  availabilityGranularity: 'date' | 'datetime' | 'segment';
  priceCalculator: (ctx: PricingContext) => number | { nightly: number[]; total: number };
  availabilityCalculator?: (ctx: AvailabilityContext) => Promise<number>;
  
  // Optional helpers
  simulators?: {
    allocationHints?: (product: Product, contract: Contract) => Allocation[];
  };
}

// Plugin Form Props
export interface ContractFormProps {
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  contract?: Contract;
  product?: Product;
}

export interface RateMetaFormProps {
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  rateBand?: RateBand;
  product?: Product;
}

export interface ProductFormProps {
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  product?: Product;
  resource?: Resource;
}

// Core Service Interfaces
export interface CoreServices {
  // Suppliers
  createSupplier: (data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => Promise<Supplier>;
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<Supplier>;
  deleteSupplier: (id: string) => Promise<void>;
  getSuppliers: () => Promise<Supplier[]>;
  
  // Resources
  createResource: (data: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) => Promise<Resource>;
  updateResource: (id: string, data: Partial<Resource>) => Promise<Resource>;
  deleteResource: (id: string) => Promise<void>;
  getResources: () => Promise<Resource[]>;
  
  // Products
  createProduct: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  getProducts: () => Promise<Product[]>;
  
  // Contracts
  createContract: (data: Omit<Contract, 'id' | 'created_at' | 'updated_at'>) => Promise<Contract>;
  updateContract: (id: string, data: Partial<Contract>) => Promise<Contract>;
  deleteContract: (id: string) => Promise<void>;
  getContracts: () => Promise<Contract[]>;
  
  // Offers
  createOffer: (data: Omit<Offer, 'id' | 'created_at' | 'updated_at'>) => Promise<Offer>;
  updateOffer: (id: string, data: Partial<Offer>) => Promise<Offer>;
  deleteOffer: (id: string) => Promise<void>;
  getOffers: () => Promise<Offer[]>;
  
  // Rate Bands
  createRateBand: (data: Omit<RateBand, 'id' | 'created_at' | 'updated_at'>) => Promise<RateBand>;
  updateRateBand: (id: string, data: Partial<RateBand>) => Promise<RateBand>;
  deleteRateBand: (id: string) => Promise<void>;
  getRateBands: () => Promise<RateBand[]>;
  
  // Allocation Pools
  createAllocationPool: (data: Omit<AllocationPool, 'id' | 'created_at' | 'updated_at'>) => Promise<AllocationPool>;
  updateAllocationPool: (id: string, data: Partial<AllocationPool>) => Promise<AllocationPool>;
  deleteAllocationPool: (id: string) => Promise<void>;
  getAllocationPools: () => Promise<AllocationPool[]>;
  
  // Allocations
  createAllocation: (data: Omit<Allocation, 'id' | 'created_at' | 'updated_at'>) => Promise<Allocation>;
  updateAllocation: (id: string, data: Partial<Allocation>) => Promise<Allocation>;
  deleteAllocation: (id: string) => Promise<void>;
  getAllocations: () => Promise<Allocation[]>;
  
  // Holds
  createHold: (data: Omit<Hold, 'id' | 'created_at' | 'updated_at'>) => Promise<Hold>;
  updateHold: (id: string, data: Partial<Hold>) => Promise<Hold>;
  deleteHold: (id: string) => Promise<void>;
  getHolds: () => Promise<Hold[]>;
  
  // Bookings
  createBooking: (data: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => Promise<Booking>;
  updateBooking: (id: string, data: Partial<Booking>) => Promise<Booking>;
  deleteBooking: (id: string) => Promise<void>;
  getBookings: () => Promise<Booking[]>;
  
  // Stock Ledger
  getStockLedger: (allocationPoolId: string) => Promise<StockLedger[]>;
  
  // Pricing & Availability
  calculatePrice: (ctx: PricingContext) => Promise<number | { nightly: number[]; total: number }>;
  checkAvailability: (ctx: AvailabilityContext) => Promise<number>;
}
