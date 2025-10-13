// Plugin Registry - Central registry for all inventory type plugins
import type { ContractPlugin, InventoryTypeId } from './types';

class PluginRegistry {
  private plugins = new Map<InventoryTypeId, ContractPlugin>();

  register(plugin: ContractPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  getPlugin(typeId: InventoryTypeId): ContractPlugin | undefined {
    return this.plugins.get(typeId);
  }

  getAllPlugins(): ContractPlugin[] {
    return Array.from(this.plugins.values());
  }

  hasPlugin(typeId: InventoryTypeId): boolean {
    return this.plugins.has(typeId);
  }

  getSupportedTypes(): InventoryTypeId[] {
    return Array.from(this.plugins.keys());
  }
}

// Global registry instance
export const pluginRegistry = new PluginRegistry();

// Helper functions
export function registerPlugin(plugin: ContractPlugin): void {
  pluginRegistry.register(plugin);
}

export function getPlugin(typeId: InventoryTypeId): ContractPlugin | undefined {
  return pluginRegistry.getPlugin(typeId);
}

export function hasPlugin(typeId: InventoryTypeId): boolean {
  return pluginRegistry.hasPlugin(typeId);
}

export function getAllPlugins(): ContractPlugin[] {
  return pluginRegistry.getAllPlugins();
}

export function getSupportedInventoryTypes(): InventoryTypeId[] {
  return pluginRegistry.getSupportedTypes();
}
