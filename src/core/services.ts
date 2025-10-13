// Core Services - Shared business logic across all inventory types
import type { 
  CoreServices, 
  Supplier, 
  Resource, 
  Product, 
  Contract, 
  Offer, 
  RateBand, 
  AllocationPool, 
  Allocation, 
  Hold, 
  Booking, 
  StockLedger,
  PricingContext,
  AvailabilityContext
} from './types';
import { getPlugin } from './plugin-registry';

// In-memory storage for demo purposes
// In production, this would be replaced with actual database calls
class CoreServicesImpl implements CoreServices {
  private suppliers: Supplier[] = [];
  private resources: Resource[] = [];
  private products: Product[] = [];
  private contracts: Contract[] = [];
  private offers: Offer[] = [];
  private rateBands: RateBand[] = [];
  private allocationPools: AllocationPool[] = [];
  private allocations: Allocation[] = [];
  private holds: Hold[] = [];
  private bookings: Booking[] = [];
  private stockLedger: StockLedger[] = [];

  // Suppliers
  async createSupplier(data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    const supplier: Supplier = {
      ...data,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.suppliers.push(supplier);
    return supplier;
  }

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
    const index = this.suppliers.findIndex(s => s.id === id);
    if (index === -1) throw new Error(`Supplier ${id} not found`);
    
    this.suppliers[index] = {
      ...this.suppliers[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return this.suppliers[index];
  }

  async deleteSupplier(id: string): Promise<void> {
    const index = this.suppliers.findIndex(s => s.id === id);
    if (index === -1) throw new Error(`Supplier ${id} not found`);
    this.suppliers.splice(index, 1);
  }

  async getSuppliers(): Promise<Supplier[]> {
    return [...this.suppliers];
  }

  // Resources
  async createResource(data: Omit<Resource, 'id' | 'created_at' | 'updated_at'>): Promise<Resource> {
    const resource: Resource = {
      ...data,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.resources.push(resource);
    return resource;
  }

  async updateResource(id: string, data: Partial<Resource>): Promise<Resource> {
    const index = this.resources.findIndex(r => r.id === id);
    if (index === -1) throw new Error(`Resource ${id} not found`);
    
    this.resources[index] = {
      ...this.resources[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return this.resources[index];
  }

  async deleteResource(id: string): Promise<void> {
    const index = this.resources.findIndex(r => r.id === id);
    if (index === -1) throw new Error(`Resource ${id} not found`);
    this.resources.splice(index, 1);
  }

  async getResources(): Promise<Resource[]> {
    return [...this.resources];
  }

  // Products
  async createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const product: Product = {
      ...data,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.products.push(product);
    return product;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`Product ${id} not found`);
    
    this.products[index] = {
      ...this.products[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return this.products[index];
  }

  async deleteProduct(id: string): Promise<void> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`Product ${id} not found`);
    this.products.splice(index, 1);
  }

  async getProducts(): Promise<Product[]> {
    return [...this.products];
  }

  // Contracts
  async createContract(data: Omit<Contract, 'id' | 'created_at' | 'updated_at'>): Promise<Contract> {
    const contract: Contract = {
      ...data,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.contracts.push(contract);
    return contract;
  }

  async updateContract(id: string, data: Partial<Contract>): Promise<Contract> {
    const index = this.contracts.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Contract ${id} not found`);
    
    this.contracts[index] = {
      ...this.contracts[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return this.contracts[index];
  }

  async deleteContract(id: string): Promise<void> {
    const index = this.contracts.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Contract ${id} not found`);
    this.contracts.splice(index, 1);
  }

  async getContracts(): Promise<Contract[]> {
    return [...this.contracts];
  }

  // Offers
  async createOffer(data: Omit<Offer, 'id' | 'created_at' | 'updated_at'>): Promise<Offer> {
    const offer: Offer = {
      ...data,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.offers.push(offer);
    return offer;
  }

  async updateOffer(id: string, data: Partial<Offer>): Promise<Offer> {
    const index = this.offers.findIndex(o => o.id === id);
    if (index === -1) throw new Error(`Offer ${id} not found`);
    
    this.offers[index] = {
      ...this.offers[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return this.offers[index];
  }

  async deleteOffer(id: string): Promise<void> {
    const index = this.offers.findIndex(o => o.id === id);
    if (index === -1) throw new Error(`Offer ${id} not found`);
    this.offers.splice(index, 1);
  }

  async getOffers(): Promise<Offer[]> {
    return [...this.offers];
  }

  // Rate Bands
  async createRateBand(data: Omit<RateBand, 'id' | 'created_at' | 'updated_at'>): Promise<RateBand> {
    const rateBand: RateBand = {
      ...data,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.rateBands.push(rateBand);
    return rateBand;
  }

  async updateRateBand(id: string, data: Partial<RateBand>): Promise<RateBand> {
    const index = this.rateBands.findIndex(r => r.id === id);
    if (index === -1) throw new Error(`RateBand ${id} not found`);
    
    this.rateBands[index] = {
      ...this.rateBands[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return this.rateBands[index];
  }

  async deleteRateBand(id: string): Promise<void> {
    const index = this.rateBands.findIndex(r => r.id === id);
    if (index === -1) throw new Error(`RateBand ${id} not found`);
    this.rateBands.splice(index, 1);
  }

  async getRateBands(): Promise<RateBand[]> {
    return [...this.rateBands];
  }

  // Allocation Pools
  async createAllocationPool(data: Omit<AllocationPool, 'id' | 'created_at' | 'updated_at'>): Promise<AllocationPool> {
    const pool: AllocationPool = {
      ...data,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.allocationPools.push(pool);
    return pool;
  }

  async updateAllocationPool(id: string, data: Partial<AllocationPool>): Promise<AllocationPool> {
    const index = this.allocationPools.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`AllocationPool ${id} not found`);
    
    this.allocationPools[index] = {
      ...this.allocationPools[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return this.allocationPools[index];
  }

  async deleteAllocationPool(id: string): Promise<void> {
    const index = this.allocationPools.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`AllocationPool ${id} not found`);
    this.allocationPools.splice(index, 1);
  }

  async getAllocationPools(): Promise<AllocationPool[]> {
    return [...this.allocationPools];
  }

  // Allocations
  async createAllocation(data: Omit<Allocation, 'id' | 'created_at' | 'updated_at'>): Promise<Allocation> {
    const allocation: Allocation = {
      ...data,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.allocations.push(allocation);
    
    // Update stock ledger
    await this.addStockLedgerEntry({
      allocation_pool_id: data.allocation_pool_id,
      transaction_type: 'allocation',
      quantity: data.quantity,
      reference_id: allocation.id,
      reference_type: 'allocation',
      notes: 'Allocation created'
    });
    
    return allocation;
  }

  async updateAllocation(id: string, data: Partial<Allocation>): Promise<Allocation> {
    const index = this.allocations.findIndex(a => a.id === id);
    if (index === -1) throw new Error(`Allocation ${id} not found`);
    
    const oldQuantity = this.allocations[index].quantity;
    this.allocations[index] = {
      ...this.allocations[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    
    // Update stock ledger if quantity changed
    if (data.quantity !== undefined && data.quantity !== oldQuantity) {
      const quantityDiff = data.quantity - oldQuantity;
      await this.addStockLedgerEntry({
        allocation_pool_id: this.allocations[index].allocation_pool_id,
        transaction_type: 'adjustment',
        quantity: quantityDiff,
        reference_id: id,
        reference_type: 'allocation',
        notes: 'Allocation quantity updated'
      });
    }
    
    return this.allocations[index];
  }

  async deleteAllocation(id: string): Promise<void> {
    const index = this.allocations.findIndex(a => a.id === id);
    if (index === -1) throw new Error(`Allocation ${id} not found`);
    
    const allocation = this.allocations[index];
    
    // Update stock ledger
    await this.addStockLedgerEntry({
      allocation_pool_id: allocation.allocation_pool_id,
      transaction_type: 'release',
      quantity: -allocation.quantity,
      reference_id: id,
      reference_type: 'allocation',
      notes: 'Allocation deleted'
    });
    
    this.allocations.splice(index, 1);
  }

  async getAllocations(): Promise<Allocation[]> {
    return [...this.allocations];
  }

  // Holds
  async createHold(data: Omit<Hold, 'id' | 'created_at' | 'updated_at'>): Promise<Hold> {
    const hold: Hold = {
      ...data,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.holds.push(hold);
    
    // Update stock ledger
    await this.addStockLedgerEntry({
      allocation_pool_id: data.allocation_pool_id,
      transaction_type: 'hold',
      quantity: -data.quantity, // Negative because it reduces available stock
      reference_id: hold.id,
      reference_type: 'hold',
      notes: 'Hold created'
    });
    
    return hold;
  }

  async updateHold(id: string, data: Partial<Hold>): Promise<Hold> {
    const index = this.holds.findIndex(h => h.id === id);
    if (index === -1) throw new Error(`Hold ${id} not found`);
    
    this.holds[index] = {
      ...this.holds[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return this.holds[index];
  }

  async deleteHold(id: string): Promise<void> {
    const index = this.holds.findIndex(h => h.id === id);
    if (index === -1) throw new Error(`Hold ${id} not found`);
    
    const hold = this.holds[index];
    
    // Update stock ledger - release the hold
    await this.addStockLedgerEntry({
      allocation_pool_id: hold.allocation_pool_id,
      transaction_type: 'release',
      quantity: hold.quantity, // Positive because it increases available stock
      reference_id: id,
      reference_type: 'hold',
      notes: 'Hold released'
    });
    
    this.holds.splice(index, 1);
  }

  async getHolds(): Promise<Hold[]> {
    return [...this.holds];
  }

  // Bookings
  async createBooking(data: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
    const booking: Booking = {
      ...data,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.bookings.push(booking);
    
    // If booking was created from a hold, release the hold
    if (data.hold_id) {
      await this.deleteHold(data.hold_id);
    } else {
      // Direct booking - update stock ledger
      await this.addStockLedgerEntry({
        allocation_pool_id: data.allocation_pool_id,
        transaction_type: 'booking',
        quantity: -data.quantity, // Negative because it reduces available stock
        reference_id: booking.id,
        reference_type: 'booking',
        notes: 'Direct booking created'
      });
    }
    
    return booking;
  }

  async updateBooking(id: string, data: Partial<Booking>): Promise<Booking> {
    const index = this.bookings.findIndex(b => b.id === id);
    if (index === -1) throw new Error(`Booking ${id} not found`);
    
    this.bookings[index] = {
      ...this.bookings[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return this.bookings[index];
  }

  async deleteBooking(id: string): Promise<void> {
    const index = this.bookings.findIndex(b => b.id === id);
    if (index === -1) throw new Error(`Booking ${id} not found`);
    
    const booking = this.bookings[index];
    
    // Update stock ledger - release the booking
    await this.addStockLedgerEntry({
      allocation_pool_id: booking.allocation_pool_id,
      transaction_type: 'release',
      quantity: booking.quantity, // Positive because it increases available stock
      reference_id: id,
      reference_type: 'booking',
      notes: 'Booking cancelled'
    });
    
    this.bookings.splice(index, 1);
  }

  async getBookings(): Promise<Booking[]> {
    return [...this.bookings];
  }

  // Stock Ledger
  async getStockLedger(allocationPoolId: string): Promise<StockLedger[]> {
    return this.stockLedger.filter(entry => entry.allocation_pool_id === allocationPoolId);
  }

  // Pricing & Availability
  async calculatePrice(ctx: PricingContext): Promise<number | { nightly: number[]; total: number }> {
    // Find the product to get the resource type
    const offer = this.offers.find(o => o.id === ctx.rateBand.offer_id);
    if (!offer) throw new Error(`Offer ${ctx.rateBand.offer_id} not found`);
    
    const product = this.products.find(p => p.id === offer.product_id);
    if (!product) throw new Error(`Product ${offer.product_id} not found`);
    
    const resource = this.resources.find(r => r.id === product.resource_id);
    if (!resource) throw new Error(`Resource ${product.resource_id} not found`);
    
    // Get the plugin for this resource type
    const plugin = getPlugin(resource.resource_type);
    if (!plugin) throw new Error(`No plugin found for resource type ${resource.resource_type}`);
    
    // Use plugin's price calculator
    return plugin.priceCalculator(ctx);
  }

  async checkAvailability(ctx: AvailabilityContext): Promise<number> {
    // Get the plugin for this resource type
    const pool = this.allocationPools.find(p => p.id === ctx.allocationPool.id);
    if (!pool) throw new Error(`AllocationPool ${ctx.allocationPool.id} not found`);
    
    const resource = this.resources.find(r => r.id === pool.resource_id);
    if (!resource) throw new Error(`Resource ${pool.resource_id} not found`);
    
    const plugin = getPlugin(resource.resource_type);
    if (!plugin) throw new Error(`No plugin found for resource type ${resource.resource_type}`);
    
    // Use plugin's availability calculator if available, otherwise calculate manually
    if (plugin.availabilityCalculator) {
      return await plugin.availabilityCalculator(ctx);
    }
    
    // Fallback to manual calculation
    return this.calculateAvailabilityManually(ctx);
  }

  // Private helper methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private async addStockLedgerEntry(data: Omit<StockLedger, 'id' | 'created_at'>): Promise<void> {
    const entry: StockLedger = {
      ...data,
      id: this.generateId(),
      created_at: new Date().toISOString(),
    };
    this.stockLedger.push(entry);
  }

  private calculateAvailabilityManually(ctx: AvailabilityContext): number {
    const poolId = ctx.allocationPool.id;
    
    // Get all relevant ledger entries for this pool
    const relevantEntries = this.stockLedger.filter(entry => 
      entry.allocation_pool_id === poolId
    );
    
    // Calculate total capacity from allocations
    const totalCapacity = relevantEntries
      .filter(entry => entry.transaction_type === 'allocation')
      .reduce((sum, entry) => sum + entry.quantity, 0);
    
    // Calculate total held/booked stock
    const totalHeld = relevantEntries
      .filter(entry => ['hold', 'booking'].includes(entry.transaction_type))
      .reduce((sum, entry) => sum + Math.abs(entry.quantity), 0);
    
    return totalCapacity - totalHeld;
  }
}

// Export singleton instance
export const coreServices = new CoreServicesImpl();
