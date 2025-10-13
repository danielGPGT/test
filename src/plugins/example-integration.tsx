// Example: How to integrate Hotel Plugin into Unified Inventory
// This shows how the plugin architecture works in practice

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PluginRouter } from './PluginRouter'
import { HotelContractForm } from './hotel'
import type { InventoryItem } from '@/types/unified-inventory'

// Example usage in unified-inventory-redesigned.tsx
export function ExamplePluginIntegration() {
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  // Example hotel item
  const exampleHotelItem: InventoryItem = {
    id: 1,
    name: "Grand Hotel Budapest",
    item_type: "hotel",
    description: "Luxury hotel in the heart of Budapest",
    location: "Budapest, Hungary",
    metadata: {
      star_rating: 5,
      city: "Budapest",
      country: "Hungary"
    },
    categories: [
      {
        id: "std-double",
        item_id: 1,
        category_name: "Standard Double",
        capacity_info: { max_occupancy: 2 },
        pricing_behavior: { pricing_mode: "per_unit" }
      },
      {
        id: "std-twin", 
        item_id: 1,
        category_name: "Standard Twin",
        capacity_info: { max_occupancy: 2 },
        pricing_behavior: { pricing_mode: "per_unit" }
      },
      {
        id: "suite",
        item_id: 1,
        category_name: "Junior Suite",
        capacity_info: { max_occupancy: 4 },
        pricing_behavior: { pricing_mode: "per_unit" }
      }
    ],
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const handleOpenContractDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsContractDialogOpen(true)
  }

  const handleSaveContract = (contractData: any) => {
    console.log('Saving contract:', contractData)
    // Here you would call your data context methods
    // addUnifiedContract(contractData)
    setIsContractDialogOpen(false)
  }

  const handleCreateAllocations = (contractId: number, allocations: any[]) => {
    console.log('Creating allocations:', { contractId, allocations })
    // Here you would call your allocation methods
    // allocations.forEach(allocation => addAllocation(allocation))
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Plugin Integration Example</h2>
      
      <div className="space-y-4">
        <p className="text-muted-foreground">
          This example shows how the Hotel Plugin integrates with the unified inventory system.
        </p>
        
        <Button onClick={() => handleOpenContractDialog(exampleHotelItem)}>
          Open Hotel Contract Form
        </Button>
        
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">What happens when you click the button:</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• PluginRouter detects item_type = "hotel"</li>
            <li>• Routes to HotelContractForm plugin</li>
            <li>• Shows hotel-specific fields: room allocations, occupancy rates, board types</li>
            <li>• Generates rates automatically from allocations</li>
            <li>• Creates standalone allocation records</li>
          </ul>
        </div>
      </div>

      {/* Contract Dialog using Plugin Router */}
      <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? `Add Contract - ${selectedItem.name}` : 'Add Contract'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <PluginRouter
              type="contract"
              item={selectedItem}
              suppliers={[
                { id: 1, name: "Hotel Supplier A" },
                { id: 2, name: "Hotel Supplier B" }
              ]}
              onSave={handleSaveContract}
              onCancel={() => setIsContractDialogOpen(false)}
              onCreateAllocations={handleCreateAllocations}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Alternative: Direct plugin usage (without router)
export function DirectPluginUsage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const exampleHotelItem: InventoryItem = {
    id: 1,
    name: "Example Hotel",
    item_type: "hotel",
    description: "Example hotel for direct plugin usage",
    location: "Example City",
    metadata: {
      star_rating: 4,
      city: "Example City",
      country: "Example Country"
    },
    categories: [
      {
        id: "room1",
        item_id: 1,
        category_name: "Standard Room",
        capacity_info: { max_occupancy: 2 },
        pricing_behavior: { pricing_mode: "per_unit" }
      }
    ],
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Direct Plugin Usage</h2>
      
      <Button onClick={() => setIsDialogOpen(true)}>
        Use Hotel Plugin Directly
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Direct Hotel Plugin Usage</DialogTitle>
          </DialogHeader>
          
          <HotelContractForm
            item={exampleHotelItem}
            suppliers={[{ id: 1, name: "Direct Supplier" }]}
            onSave={(data) => {
              console.log('Direct save:', data)
              setIsDialogOpen(false)
            }}
            onCancel={() => setIsDialogOpen(false)}
            onCreateAllocations={(contractId, allocations) => {
              console.log('Direct allocations:', { contractId, allocations })
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
