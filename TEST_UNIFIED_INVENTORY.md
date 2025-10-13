# ✅ Testing Your New Unified Inventory System

## Phase 2 Complete! 🎉

Your DataContext now supports the unified inventory system. Let's test it!

---

## How to Test (In Browser Console)

### Step 1: Open Your App

```bash
npm run dev
```

Navigate to any page in your app (e.g., `http://localhost:5173/inventory-setup`)

### Step 2: Open Browser Console

Press `F12` or right-click → Inspect → Console tab

---

## Test 1: Create a Ticket Inventory

```javascript
// Get the data context
const { addInventoryItem, inventoryItems } = window.__reactContext || {}

// Create F1 Grand Prix Tickets
const ticketItem = addInventoryItem({
  item_type: 'ticket',
  name: 'Abu Dhabi F1 Grand Prix Tickets',
  location: 'Yas Marina Circuit, Abu Dhabi',
  description: 'Official Formula 1 race weekend tickets',
  metadata: {
    event_type: 'sports',
    event_name: 'Abu Dhabi Grand Prix 2025',
    venue_name: 'Yas Marina Circuit',
    provider_name: 'Yas Marina Circuit',
    requires_booking_lead_time: '7 days'
  },
  categories: [
    {
      id: 'ticket-grandstand',
      item_id: 0, // Will be set automatically
      category_name: 'Main Grandstand - 3 Day Pass',
      description: 'Premium grandstand seating for all 3 days',
      capacity_info: {
        section_capacity: 500
      },
      pricing_behavior: {
        pricing_mode: 'per_person'
      }
    },
    {
      id: 'ticket-paddock',
      item_id: 0,
      category_name: 'Paddock Club - Race Day',
      description: 'VIP hospitality with pit lane access',
      capacity_info: {
        section_capacity: 100
      },
      pricing_behavior: {
        pricing_mode: 'per_person'
      }
    }
  ],
  active: true
})

console.log('✅ Created ticket inventory:', ticketItem)
console.log('📊 Total inventory items:', inventoryItems.length)
```

**Expected Output:**
```
✅ Created ticket inventory item: Abu Dhabi F1 Grand Prix Tickets
{
  id: 1,
  item_type: 'ticket',
  name: 'Abu Dhabi F1 Grand Prix Tickets',
  location: 'Yas Marina Circuit, Abu Dhabi',
  categories: [...],
  active: true,
  created_at: '2025-01-15T10:30:00.000Z'
}
📊 Total inventory items: 1
```

---

## Test 2: Create a Transfer Inventory

```javascript
const transferItem = addInventoryItem({
  item_type: 'transfer',
  name: 'Abu Dhabi Airport Transfers',
  location: 'Abu Dhabi, UAE',
  description: 'Private and shared airport transfer services',
  metadata: {
    transfer_type: 'airport',
    default_routes: [
      { from: 'Abu Dhabi Airport', to: 'Yas Island Hotels' },
      { from: 'Abu Dhabi Airport', to: 'Yas Marina Circuit' }
    ],
    provider_name: 'UAE Transport Services'
  },
  categories: [
    {
      id: 'transfer-sedan',
      item_id: 0,
      category_name: 'Private Sedan (1-3 pax)',
      description: 'Private sedan with professional driver',
      capacity_info: {
        max_pax: 3,
        min_pax: 1
      },
      pricing_behavior: {
        pricing_mode: 'per_vehicle',
        directional: true,
        directions: ['inbound', 'outbound', 'round_trip']
      }
    }
  ],
  active: true
})

console.log('✅ Created transfer inventory:', transferItem)
```

---

## Test 3: Create a Contract for Tickets

```javascript
const { addUnifiedContract, unifiedContracts, suppliers } = window.__reactContext || {}

// First, make sure you have a supplier (use existing or create one)
console.log('Available suppliers:', suppliers)

const ticketContract = addUnifiedContract({
  item_id: ticketItem.id, // Link to the ticket item we created
  supplier_id: suppliers[0].id, // Use first supplier
  contract_name: 'F1 Tickets Block 2025',
  valid_from: '2025-11-28',
  valid_to: '2025-11-30',
  currency: 'AED',
  allocations: [
    {
      category_ids: ['ticket-grandstand'],
      quantity: 100, // 100 tickets allocated
      allocation_pool_id: 'f1-main-pool',
      label: 'Main Grandstand Block'
    },
    {
      category_ids: ['ticket-paddock'],
      quantity: 20, // 20 VIP tickets
      allocation_pool_id: 'f1-paddock-pool',
      label: 'Paddock Club Block'
    }
  ],
  pricing_strategy: 'per_unit',
  markup_percentage: 0.40,
  tax_rate: 0.05,
  active: true
})

console.log('✅ Created ticket contract:', ticketContract)
console.log('📊 Total unified contracts:', unifiedContracts.length)
```

**Expected Output:**
```
✅ Created ticket contract: F1 Tickets Block 2025
{
  id: 1,
  item_id: 1,
  item_type: 'ticket',
  itemName: 'Abu Dhabi F1 Grand Prix Tickets',
  supplierName: 'Abu Dhabi Hotels LLC',
  contract_name: 'F1 Tickets Block 2025',
  allocations: [...],
  active: true
}
📊 Total unified contracts: 1
```

---

## Test 4: Create a Rate for Tickets

```javascript
const { addUnifiedRate, unifiedRates } = window.__reactContext || {}

const ticketRate = addUnifiedRate({
  item_id: ticketItem.id,
  category_id: 'ticket-grandstand',
  contract_id: ticketContract.id,
  allocation_pool_id: 'f1-main-pool',
  base_rate: 1200, // AED 1,200 per person
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

console.log('✅ Created ticket rate:', ticketRate)
console.log('💰 Selling price:', ticketRate.selling_price) // Should be 1680 (1200 × 1.40)
console.log('📊 Total unified rates:', unifiedRates.length)
```

**Expected Output:**
```
✅ Created ticket rate for Main Grandstand - 3 Day Pass @ AED 1200
{
  id: 1,
  item_id: 1,
  item_type: 'ticket',
  category_id: 'ticket-grandstand',
  base_rate: 1200,
  markup_percentage: 0.40,
  selling_price: 1680, // Automatically calculated!
  currency: 'AED',
  ...
}
💰 Selling price: 1680
📊 Total unified rates: 1
```

---

## Test 5: Create a Buy-to-Order Transfer Rate

```javascript
// Buy-to-order rate (no contract)
const transferRate = addUnifiedRate({
  item_id: transferItem.id,
  category_id: 'transfer-sedan',
  contract_id: undefined, // No contract = buy-to-order
  base_rate: 150, // AED 150 per vehicle
  markup_percentage: 0.50,
  currency: 'AED',
  inventory_type: 'buy_to_order',
  rate_details: {
    direction: 'inbound',
    pricing_unit: 'per_vehicle'
  },
  valid_from: '2025-11-01',
  valid_to: '2025-12-31',
  active: true
})

console.log('✅ Created buy-to-order transfer rate:', transferRate)
console.log('💰 Selling price:', transferRate.selling_price) // Should be 225 (150 × 1.50)
```

---

## Test 6: View All Unified Inventory

```javascript
const { inventoryItems, unifiedContracts, unifiedRates } = window.__reactContext || {}

console.log('📦 INVENTORY SUMMARY')
console.log('==================')
console.log(`Total Items: ${inventoryItems.length}`)
inventoryItems.forEach(item => {
  console.log(`  - [${item.item_type}] ${item.name}`)
})

console.log(`\n📋 Total Contracts: ${unifiedContracts.length}`)
unifiedContracts.forEach(contract => {
  console.log(`  - [${contract.item_type}] ${contract.contract_name} (${contract.allocations.length} allocations)`)
})

console.log(`\n💰 Total Rates: ${unifiedRates.length}`)
unifiedRates.forEach(rate => {
  console.log(`  - [${rate.item_type}] ${rate.categoryName} @ ${rate.currency} ${rate.base_rate} → ${rate.selling_price}`)
})
```

---

## Test 7: Update a Rate

```javascript
const { updateUnifiedRate, unifiedRates } = window.__reactContext || {}

// Update the ticket rate's price
updateUnifiedRate(ticketRate.id, {
  base_rate: 1500, // Increase price
  markup_percentage: 0.45 // Increase markup
})

// View updated rate
const updatedRate = unifiedRates.find(r => r.id === ticketRate.id)
console.log('✅ Updated rate:', updatedRate)
console.log('💰 New selling price:', updatedRate.selling_price) // Should be 2175 (1500 × 1.45)
```

---

## Test 8: Test Persistence (Refresh Page)

```javascript
// Before refresh - note the data
console.log('Before refresh:')
console.log('Items:', inventoryItems.length)
console.log('Contracts:', unifiedContracts.length)
console.log('Rates:', unifiedRates.length)

// Now refresh the page (F5)
// Then run:
const { inventoryItems, unifiedContracts, unifiedRates } = window.__reactContext || {}
console.log('After refresh:')
console.log('Items:', inventoryItems.length) // Should be same!
console.log('Contracts:', unifiedContracts.length) // Should be same!
console.log('Rates:', unifiedRates.length) // Should be same!
```

**Expected:** All data persists in localStorage! ✅

---

## Alternative: Test in React Component

Create a test component to use the hooks properly:

```typescript
// Test component - add this to any page temporarily
import { useData } from '@/contexts/data-context'

export function TestUnifiedInventory() {
  const { 
    addInventoryItem, 
    addUnifiedContract, 
    addUnifiedRate,
    inventoryItems,
    unifiedContracts,
    unifiedRates 
  } = useData()
  
  const runTests = () => {
    // Create ticket inventory
    const ticketItem = addInventoryItem({
      item_type: 'ticket',
      name: 'F1 GP Tickets',
      location: 'Yas Marina',
      description: 'Official tickets',
      metadata: {
        event_type: 'sports'
      },
      categories: [{
        id: 'grandstand',
        item_id: 0,
        category_name: 'Grandstand',
        capacity_info: { section_capacity: 500 },
        pricing_behavior: { pricing_mode: 'per_person' }
      }],
      active: true
    })
    
    console.log('✅ Created:', ticketItem)
    console.log('📊 Stats:', {
      items: inventoryItems.length,
      contracts: unifiedContracts.length,
      rates: unifiedRates.length
    })
  }
  
  return (
    <div>
      <button onClick={runTests}>Run Unified Inventory Tests</button>
      <pre>{JSON.stringify({ inventoryItems, unifiedContracts, unifiedRates }, null, 2)}</pre>
    </div>
  )
}
```

---

## Success Criteria ✅

**Phase 2 is successful if:**

1. ✅ Can create inventory items of any type (ticket, transfer, activity, etc.)
2. ✅ Can create contracts linked to inventory items
3. ✅ Can create rates linked to contracts
4. ✅ Can create buy-to-order rates (no contract)
5. ✅ Selling price is calculated automatically
6. ✅ Data persists after page refresh (localStorage)
7. ✅ Console logs show success messages
8. ✅ No TypeScript errors
9. ✅ All denormalized fields populated correctly (itemName, categoryName, etc.)

---

## What's Working Now

✅ **Data Layer Complete:**
- `inventoryItems[]` - All inventory types (hotel, ticket, transfer, etc.)
- `unifiedContracts[]` - Contracts for any inventory type
- `unifiedRates[]` - Rates for any inventory type

✅ **CRUD Operations:**
- `addInventoryItem()` - Create hotels, tickets, transfers, etc.
- `addUnifiedContract()` - Create contracts with allocations + pools
- `addUnifiedRate()` - Create rates with auto-calculated selling price
- `updateXXX()` - Update any entity
- `deleteXXX()` - Delete with dependency checking

✅ **Features:**
- Automatic ID generation
- Timestamp tracking (created_at, updated_at)
- Denormalized fields (itemName, categoryName, etc.)
- Dependency checking (can't delete if has children)
- localStorage persistence
- Console logging for debugging

---

## Next Steps

### Option 1: Build UI Forms (Phase 3)
Now that data layer works, create:
1. Unified Item Form - Create any inventory type
2. Unified Contract Form - Create contracts
3. Unified Rate Form - Create rates

### Option 2: Keep Testing
Try creating:
- Activity inventory (tours, excursions)
- Meal inventory (dining packages)
- Venue inventory (event spaces)
- Experience inventory (VIP packages)

### Option 3: Migrate Existing Data
Convert your existing hotels to unified inventory items

---

## Troubleshooting

**Q: Console shows "Cannot access 'addInventoryItem' before initialization"**  
A: The data context isn't exposed to window. Add to your test component instead.

**Q: Data doesn't persist after refresh**  
A: Check browser localStorage (F12 → Application → Local Storage)

**Q: TypeScript errors**  
A: Run `npm run build` to check for type errors

**Q: How do I see the data?**  
A: Use React DevTools (Components tab → find DataProvider)

---

## You're Ready for Phase 3! 🚀

Your unified inventory system now supports:
- 🏨 Hotels
- 🎫 Tickets  
- 🚗 Transfers
- 🧭 Activities
- 🍽️ Meals
- 🏟️ Venues
- ✈️ Transport
- ✨ Experiences
- 📦 Other

**Next:** Build the UI forms to make this accessible to users!


