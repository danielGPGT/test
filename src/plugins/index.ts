// Plugin System - Main Entry Point
// This file imports all plugins to register them with the plugin registry

// Import all plugins (they self-register)
import './accommodation-room';

// Re-export plugin registry functions for convenience
export { 
  pluginRegistry, 
  registerPlugin, 
  getPlugin, 
  hasPlugin, 
  getAllPlugins, 
  getSupportedInventoryTypes 
} from '@/core/plugin-registry';

// Re-export core types
export type {
  InventoryTypeId,
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
  AvailabilityContext,
  ContractPlugin,
  ContractFormProps,
  RateMetaFormProps,
  ProductFormProps,
  CoreServices
} from '@/core/types';

// Re-export core services
export { coreServices } from '@/core/services';
