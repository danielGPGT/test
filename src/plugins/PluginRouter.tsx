import { InventoryItem } from '@/types/unified-inventory'

// Import plugins
import { HotelRateForm } from './hotel'

// Generic fallback components
import { UnifiedContractForm } from '@/components/unified-inventory/forms/unified-contract-form'
import { UnifiedRateFormEnhanced } from '@/components/unified-inventory/forms/unified-rate-form-enhanced'

interface PluginRouterProps {
  type: 'contract' | 'rate'
  item: InventoryItem
  onSave: (data: any) => void
  onCancel: () => void
  // Optional props with defaults
  suppliers?: Array<{ id: number; name: string }>
  tours?: Array<{ id: number; name: string }>
  contracts?: Array<any>
  allocations?: Array<any>
  [key: string]: any // Allow additional props to be passed through
}

export function PluginRouter({ type, item, suppliers = [], tours = [], contracts = [], allocations = [], ...props }: PluginRouterProps) {
  const itemType = item.item_type

  // Route to appropriate plugin based on inventory type
  switch (itemType) {
    case 'hotel':
      if (type === 'contract') {
        // Use new plugin system instead
        return <div>Hotel plugin loaded via new system</div>
      } else if (type === 'rate') {
        return <HotelRateForm item={item} contracts={contracts} {...props} />
      }
      break

    // Future plugins can be added here
    // case 'event':
    //   return <EventPlugin type={type} item={item} {...props} />
    // case 'transfer':
    //   return <TransferPlugin type={type} item={item} {...props} />
    // case 'meal':
    //   return <MealPlugin type={type} item={item} {...props} />

    default:
      // Fallback to generic unified forms
      if (type === 'contract') {
        // Add required fields for UnifiedContractForm
        const suppliersWithActive = suppliers.map(s => ({ ...s, active: true }))
        const toursWithDates = tours.map(t => ({ ...t, start_date: '2024-01-01', end_date: '2024-12-31' }))
        return <UnifiedContractForm item={item} suppliers={suppliersWithActive} tours={toursWithDates} {...props} />
      } else if (type === 'rate') {
        return <UnifiedRateFormEnhanced item={item} tours={tours} allocations={allocations} {...props} />
      }
      break
  }

  // This should never be reached, but provides a fallback
  return (
    <div className="p-4 text-center text-muted-foreground">
      <p>No plugin available for inventory type: {itemType}</p>
    </div>
  )
}

// Helper function to check if a plugin exists for an inventory type
export function hasPluginForType(itemType: string): boolean {
  switch (itemType) {
    case 'hotel':
      return true
    // Add other plugin types as they're implemented
    default:
      return false
  }
}

// Helper function to get plugin info
export function getPluginInfo(itemType: string) {
  switch (itemType) {
    case 'hotel':
      return {
        name: 'Hotel Plugin',
        version: '1.0.0',
        features: [
          'Room allocations with shared pools',
          'Occupancy-based pricing',
          'Board type variations',
          'Automatic rate generation'
        ]
      }
    default:
      return {
        name: 'Generic Plugin',
        version: '1.0.0',
        features: ['Basic contract and rate management']
      }
  }
}
