import { useState, useMemo } from 'react'
import { Building2, Ticket, Car, Bus, Utensils, Gift, Package } from 'lucide-react'
import { useData } from '@/contexts/data-context'

// Import existing pages as components
import { InventorySetup } from './inventory-setup'
import { ServiceInventoryNew } from './service-inventory'

// Icon mapping for service categories
const getCategoryIcon = (category: string) => {
  const lowerCategory = category.toLowerCase()
  if (lowerCategory.includes('ticket')) return Ticket
  if (lowerCategory.includes('transfer')) return Car
  if (lowerCategory.includes('transport')) return Bus
  if (lowerCategory.includes('meal') || lowerCategory.includes('food')) return Utensils
  if (lowerCategory.includes('activity')) return Gift
  return Package
}

export function InventoryManagement() {
  const { serviceInventoryTypes } = useData()
  const [activeTab, setActiveTab] = useState<string>('hotels')

  // Generate tabs: Hotels first, then all service inventory types
  const tabs = useMemo(() => {
    const allTabs = [
      {
        id: 'hotels',
        label: 'Hotels',
        icon: Building2,
        type: 'hotels' as const
      },
      ...serviceInventoryTypes.map(serviceType => ({
        id: `service-${serviceType.id}`,
        label: serviceType.name,
        icon: getCategoryIcon(serviceType.category),
        type: 'service' as const,
        serviceTypeId: serviceType.id
      }))
    ]
    return allTabs
  }, [serviceInventoryTypes])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage all your inventory, contracts, and rates in one place
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
                  border-b-2 -mb-[1px] whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'hotels' && <InventorySetup hideHeader={true} />}
        {tabs
          .filter(tab => tab.type === 'service')
          .map(tab => (
            activeTab === tab.id && (
              <ServiceInventoryNew 
                key={tab.id} 
                selectedTypeId={tab.serviceTypeId}
              />
            )
          ))
        }
      </div>
    </div>
  )
}

