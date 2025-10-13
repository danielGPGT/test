# 🚀 Quick Start: Building Your Unified Inventory System

## What We're Building

**ONE inventory system** that handles:
- 🏨 Hotels (rooms, occupancy, board types)
- 🎫 Tickets (events, venues, attractions)
- 🚗 Transfers (airport, ground transport)
- 🧭 Activities (tours, excursions)
- 🍽️ Meals (dining packages, galas)
- 🏟️ Venues (event spaces)
- ✈️ Transport (trains, flights, coaches)
- ✨ Experiences (VIP packages)
- 📦 Other (miscellaneous services)

---

## ✅ Phase 1: Foundation (COMPLETE!)

**What's Done:**
- ✅ Type definitions created (`src/types/unified-inventory.ts`)
- ✅ 9 inventory types defined
- ✅ Polymorphic data structures ready
- ✅ Example documentation created
- ✅ Architecture fully documented

**Files Created:**
- ✅ `src/types/unified-inventory.ts` - Core types
- ✅ `UNIFIED_INVENTORY_ARCHITECTURE.md` - Technical design
- ✅ `UNIFIED_INVENTORY_EXAMPLES.md` - Real-world examples
- ✅ `UNIFIED_INVENTORY_ROADMAP.md` - Implementation plan
- ✅ `UNIFIED_INVENTORY_SUMMARY.md` - Executive summary

---

## 🔄 Phase 2: Data Layer (NEXT STEP)

### Step 2.1: Extend DataContext

**File to modify:** `src/contexts/data-context.tsx`

**Add these imports:**

```typescript
import type {
  InventoryItem,
  UnifiedContract,
  UnifiedRate,
  InventoryItemType
} from '@/types/unified-inventory'
```

**Add new state:**

```typescript
// New unified inventory state
const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
const [unifiedContracts, setUnifiedContracts] = useState<UnifiedContract[]>([])
const [unifiedRates, setUnifiedRates] = useState<UnifiedRate[]>([])
```

**Add CRUD methods:**

```typescript
// ============================================================================
// UNIFIED INVENTORY METHODS
// ============================================================================

const addInventoryItem = (itemData: Omit<InventoryItem, 'id'>) => {
  const newItem: InventoryItem = {
    ...itemData,
    id: Date.now(),
    created_at: new Date().toISOString()
  }
  
  setInventoryItems(prev => [...prev, newItem])
  
  // Backward compatibility: if hotel, also add to hotels array
  if (newItem.item_type === 'hotel') {
    const hotel = convertInventoryItemToHotel(newItem)
    setHotels(prev => [...prev, hotel])
  }
  
  return newItem
}

const updateInventoryItem = (id: number, updates: Partial<InventoryItem>) => {
  setInventoryItems(prev =>
    prev.map(item =>
      item.id === id
        ? { ...item, ...updates, updated_at: new Date().toISOString() }
        : item
    )
  )
  
  // Backward compatibility for hotels
  if (updates.item_type === 'hotel' || inventoryItems.find(i => i.id === id)?.item_type === 'hotel') {
    const updatedItem = inventoryItems.find(i => i.id === id)
    if (updatedItem) {
      const hotel = convertInventoryItemToHotel({ ...updatedItem, ...updates })
      setHotels(prev => prev.map(h => h.id === id ? hotel : h))
    }
  }
}

const deleteInventoryItem = (id: number) => {
  const item = inventoryItems.find(i => i.id === id)
  
  // Check for dependencies
  const hasContracts = unifiedContracts.some(c => c.item_id === id)
  if (hasContracts) {
    throw new Error('Cannot delete item with existing contracts')
  }
  
  setInventoryItems(prev => prev.filter(i => i.id !== id))
  
  // Backward compatibility
  if (item?.item_type === 'hotel') {
    setHotels(prev => prev.filter(h => h.id !== id))
  }
}

// Unified Contract Methods
const addUnifiedContract = (contractData: Omit<UnifiedContract, 'id'>) => {
  const item = inventoryItems.find(i => i.id === contractData.item_id)
  const supplier = suppliers.find(s => s.id === contractData.supplier_id)
  
  const newContract: UnifiedContract = {
    ...contractData,
    id: Date.now(),
    itemName: item?.name || '',
    supplierName: supplier?.name || '',
    item_type: item?.item_type || 'other',
    created_at: new Date().toISOString()
  }
  
  setUnifiedContracts(prev => [...prev, newContract])
  return newContract
}

const updateUnifiedContract = (id: number, updates: Partial<UnifiedContract>) => {
  setUnifiedContracts(prev =>
    prev.map(contract =>
      contract.id === id
        ? { ...contract, ...updates, updated_at: new Date().toISOString() }
        : contract
    )
  )
}

const deleteUnifiedContract = (id: number) => {
  // Check for dependencies
  const hasRates = unifiedRates.some(r => r.contract_id === id)
  if (hasRates) {
    throw new Error('Cannot delete contract with existing rates')
  }
  
  setUnifiedContracts(prev => prev.filter(c => c.id !== id))
}

// Unified Rate Methods
const addUnifiedRate = (rateData: Omit<UnifiedRate, 'id' | 'selling_price'>) => {
  const item = inventoryItems.find(i => i.id === rateData.item_id)
  const contract = rateData.contract_id
    ? unifiedContracts.find(c => c.id === rateData.contract_id)
    : undefined
  const category = item?.categories.find(c => c.id === rateData.category_id)
  
  const sellingPrice = rateData.base_rate * (1 + rateData.markup_percentage)
  
  const newRate: UnifiedRate = {
    ...rateData,
    id: Date.now(),
    selling_price: sellingPrice,
    itemName: item?.name || '',
    categoryName: category?.category_name || '',
    contractName: contract?.contract_name,
    item_type: item?.item_type || 'other',
    created_at: new Date().toISOString()
  }
  
  setUnifiedRates(prev => [...prev, newRate])
  return newRate
}

const updateUnifiedRate = (id: number, updates: Partial<UnifiedRate>) => {
  setUnifiedRates(prev =>
    prev.map(rate => {
      if (rate.id !== id) return rate
      
      const updated = { ...rate, ...updates, updated_at: new Date().toISOString() }
      
      // Recalculate selling price if base_rate or markup changed
      if (updates.base_rate !== undefined || updates.markup_percentage !== undefined) {
        updated.selling_price = updated.base_rate * (1 + updated.markup_percentage)
      }
      
      return updated
    })
  )
}

const deleteUnifiedRate = (id: number) => {
  setUnifiedRates(prev => prev.filter(r => r.id !== id))
}
```

**Helper conversion functions:**

```typescript
// Convert InventoryItem (hotel type) → Hotel (for backward compatibility)
function convertInventoryItemToHotel(item: InventoryItem): Hotel {
  if (item.item_type !== 'hotel') {
    throw new Error('Item is not a hotel')
  }
  
  return {
    id: item.id,
    name: item.name,
    location: item.location || '',
    description: item.description || '',
    city: item.metadata.city,
    country: item.metadata.country,
    star_rating: item.metadata.star_rating,
    phone: item.metadata.contact_info?.phone,
    email: item.metadata.contact_info?.email,
    room_groups: item.categories.map(cat => ({
      id: cat.id,
      room_type: cat.category_name,
      capacity: cat.capacity_info.max_occupancy || 2,
      description: cat.description,
      features: cat.features
    }))
  }
}

// Convert Hotel → InventoryItem
function convertHotelToInventoryItem(hotel: Hotel): InventoryItem {
  return {
    id: hotel.id,
    item_type: 'hotel',
    name: hotel.name,
    location: hotel.location,
    description: hotel.description,
    metadata: {
      star_rating: hotel.star_rating,
      city: hotel.city,
      country: hotel.country,
      contact_info: {
        phone: hotel.phone,
        email: hotel.email
      }
    },
    categories: hotel.room_groups.map(rg => ({
      id: rg.id,
      item_id: hotel.id,
      category_name: rg.room_type,
      description: rg.description,
      features: rg.features,
      capacity_info: {
        max_occupancy: rg.capacity
      },
      pricing_behavior: {
        pricing_mode: 'per_occupancy',
        occupancy_types: ['single', 'double', 'triple', 'quad'],
        board_options: ['room_only', 'bed_breakfast', 'half_board', 'full_board', 'all_inclusive']
      }
    })),
    active: true
  }
}
```

**Export new methods in context:**

```typescript
return (
  <DataContext.Provider value={{
    // Existing methods...
    hotels, addHotel, updateHotel, deleteHotel,
    contracts, addContract, updateContract, deleteContract,
    rates, addRate, updateRate, deleteRate,
    
    // NEW: Unified inventory methods
    inventoryItems,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    
    unifiedContracts,
    addUnifiedContract,
    updateUnifiedContract,
    deleteUnifiedContract,
    
    unifiedRates,
    addUnifiedRate,
    updateUnifiedRate,
    deleteUnifiedRate,
  }}>
    {children}
  </DataContext.Provider>
)
```

---

## ⚡ Quick Test

**Test that it works:**

```typescript
// In your console or a test component:

const { addInventoryItem, addUnifiedContract, addUnifiedRate } = useData()

// 1. Create a ticket inventory
const ticketItem = addInventoryItem({
  item_type: 'ticket',
  name: 'F1 Grand Prix Tickets',
  location: 'Yas Marina Circuit',
  description: 'Official F1 tickets',
  metadata: {
    event_type: 'sports',
    event_name: 'Abu Dhabi GP 2025'
  },
  categories: [
    {
      id: 'ticket-grandstand',
      category_name: 'Main Grandstand',
      capacity_info: { section_capacity: 500 },
      pricing_behavior: { pricing_mode: 'per_person' }
    }
  ],
  active: true
})

console.log('Created ticket item:', ticketItem)

// 2. Create a contract
const contract = addUnifiedContract({
  item_id: ticketItem.id,
  supplier_id: 1,  // Existing supplier
  contract_name: 'F1 Tickets Block',
  valid_from: '2025-11-28',
  valid_to: '2025-11-30',
  currency: 'AED',
  allocations: [
    {
      category_ids: ['ticket-grandstand'],
      quantity: 100,
      allocation_pool_id: 'f1-main-pool'
    }
  ],
  pricing_strategy: 'per_unit',
  markup_percentage: 0.40,
  active: true
})

console.log('Created contract:', contract)

// 3. Create a rate
const rate = addUnifiedRate({
  item_id: ticketItem.id,
  category_id: 'ticket-grandstand',
  contract_id: contract.id,
  allocation_pool_id: 'f1-main-pool',
  base_rate: 1200,
  markup_percentage: 0.40,
  currency: 'AED',
  inventory_type: 'contract',
  rate_details: {
    pricing_unit: 'per_person'
  },
  valid_from: '2025-11-28',
  valid_to: '2025-11-30',
  active: true
})

console.log('Created rate:', rate)
console.log('Selling price:', rate.selling_price)  // Should be 1680 (1200 × 1.40)
```

**Expected output:**
```
Created ticket item: { id: 1234, item_type: 'ticket', name: 'F1 Grand Prix Tickets', ... }
Created contract: { id: 5678, contract_name: 'F1 Tickets Block', item_type: 'ticket', ... }
Created rate: { id: 9012, base_rate: 1200, selling_price: 1680, ... }
```

✅ **If this works, Phase 2 is complete!**

---

## 🎨 Phase 3: UI Components (After Phase 2)

**Create these components:**

1. **Unified Item Form** - Type selector + dynamic fields
2. **Unified Contract Form** - Adapts to item type
3. **Unified Rate Form** - Polymorphic (already have proof-of-concept!)
4. **Unified Inventory Page** - Main page with filters

**See:** `UNIFIED_INVENTORY_ROADMAP.md` for detailed steps

---

## 📊 Migration Plan

**When ready to migrate existing data:**

```typescript
// Run once to migrate all hotels
hotels.forEach(hotel => {
  const item = convertHotelToInventoryItem(hotel)
  addInventoryItem(item)
})

// Contracts and rates will need custom migration
// See migration scripts in roadmap
```

---

## 🎯 Success Criteria

**Phase 2 Complete When:**
- ✅ Can create inventory items of any type
- ✅ Can create contracts for any item type
- ✅ Can create rates for any item type
- ✅ Backward compatibility maintained (old hotel methods work)
- ✅ Data persists correctly

---

## 🚀 Next Steps

1. **Implement Phase 2** (Data Layer) - This guide
2. **Test with console** - Create ticket, transfer, activity
3. **Build UI forms** - Start with unified rate form
4. **Create main page** - Unified inventory page
5. **Migrate data** - Convert existing hotels/services
6. **Deploy** - Gradual rollout with feature flag

---

## 💡 Pro Tips

### **Start Small**
- Implement data layer first
- Test thoroughly with console
- Build one UI component at a time
- Add one inventory type at a time (hotels → tickets → transfers)

### **Maintain Backward Compatibility**
- Keep old `addHotel()` working during transition
- Old pages can still use old methods
- Migrate gradually, not all at once

### **Use Feature Flags**
```typescript
const FEATURES = {
  UNIFIED_INVENTORY: process.env.REACT_APP_UNIFIED === 'true'
}

// In routes
{FEATURES.UNIFIED_INVENTORY ? (
  <Route path="/inventory" element={<UnifiedInventory />} />
) : (
  <Route path="/inventory-setup" element={<InventorySetup />} />
)}
```

---

## 📞 Need Help?

**Common Issues:**

**Q: TypeScript errors?**  
A: Make sure `src/types/unified-inventory.ts` is imported correctly

**Q: Data not persisting?**  
A: Check localStorage in browser DevTools

**Q: Backward compatibility broken?**  
A: Check conversion functions (`convertHotelToInventoryItem`)

---

## 📚 Reference Documents

- **Architecture:** `UNIFIED_INVENTORY_ARCHITECTURE.md`
- **Examples:** `UNIFIED_INVENTORY_EXAMPLES.md`  
- **Full Roadmap:** `UNIFIED_INVENTORY_ROADMAP.md`
- **Summary:** `UNIFIED_INVENTORY_SUMMARY.md`

---

## ✅ Ready to Start?

**Execute Phase 2 now:**

1. Open `src/contexts/data-context.tsx`
2. Add imports from `src/types/unified-inventory.ts`
3. Add new state variables
4. Add CRUD methods (copy from this guide)
5. Add conversion functions
6. Export new methods
7. Test in console

**Estimated time:** 2-3 hours

**Let's build this! 🚀**


