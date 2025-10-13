# 🎯 Unified Inventory System - Real-World Examples

## All Inventory Types Supported

Your unified system can now handle **9 different inventory types** through ONE interface:

1. 🏨 **Hotels** - Rooms and accommodations
2. 🎫 **Tickets** - Events, venues, attractions
3. 🚗 **Transfers** - Airport and ground transportation
4. 🧭 **Activities** - Tours, excursions, experiences
5. 🍽️ **Meals** - Dining packages and events
6. 🏟️ **Venues** - Event space rental
7. ✈️ **Transport** - Trains, flights, coaches
8. ✨ **Experiences** - VIP and exclusive packages
9. 📦 **Other** - Miscellaneous services

---

## Example 1: 🏨 Hotel (Current System)

### Inventory Item
```typescript
{
  id: 1,
  item_type: 'hotel',
  name: 'Grand Hyatt Abu Dhabi',
  location: 'Abu Dhabi, UAE',
  description: '5-star luxury hotel on the corniche',
  
  metadata: {
    star_rating: 5,
    city: 'Abu Dhabi',
    country: 'UAE',
    address: 'West Corniche Road',
    contact_info: {
      phone: '+971 2 510 1234',
      email: 'abudhabi@hyatt.com',
      website: 'https://hyatt.com/abudhabi'
    }
  },
  
  categories: [
    {
      id: 'rg-1',
      category_name: 'Deluxe Room',
      capacity_info: { max_occupancy: 2 },
      pricing_behavior: {
        pricing_mode: 'per_occupancy',
        occupancy_types: ['single', 'double'],
        board_options: ['room_only', 'bed_breakfast', 'half_board']
      }
    },
    {
      id: 'rg-2',
      category_name: 'Executive Suite',
      capacity_info: { max_occupancy: 4 },
      pricing_behavior: {
        pricing_mode: 'per_occupancy',
        occupancy_types: ['double', 'triple', 'quad'],
        board_options: ['bed_breakfast', 'half_board', 'full_board']
      }
    }
  ],
  
  active: true
}
```

### Contract
```typescript
{
  id: 101,
  item_id: 1,
  item_type: 'hotel',
  contract_name: 'F1 Weekend Block 2025',
  tour_ids: [5],  // Abu Dhabi F1 GP 2025
  
  allocations: [
    {
      category_ids: ['rg-1', 'rg-2'],  // Run of House
      quantity: 50,
      allocation_pool_id: 'f1-weekend-pool',
      label: 'Run of House - F1 Block'
    }
  ],
  
  hotel_costs: {
    city_tax_per_person_per_night: 15,  // AED 15 per person
    resort_fee_per_night: 0,
    supplier_commission_rate: 0.10,
    board_options: [
      { board_type: 'bed_breakfast', additional_cost: 45 },  // AED 45 per person
      { board_type: 'half_board', additional_cost: 95 }
    ]
  }
}
```

### Rate
```typescript
{
  id: 1001,
  item_id: 1,
  category_id: 'rg-1',
  contract_id: 101,
  allocation_pool_id: 'f1-weekend-pool',
  
  base_rate: 800,  // AED 800 per night
  currency: 'AED',
  
  rate_details: {
    occupancy_type: 'double',
    board_type: 'bed_breakfast',
    board_cost: 90,  // 45 × 2 people
    board_included: true
  },
  
  valid_from: '2025-11-28',
  valid_to: '2025-12-01',
  min_nights: 3,
  
  active: true
}
```

---

## Example 2: 🎫 F1 Grand Prix Tickets

### Inventory Item
```typescript
{
  id: 2,
  item_type: 'ticket',
  name: 'Abu Dhabi F1 Grand Prix Tickets',
  location: 'Yas Marina Circuit, Abu Dhabi',
  description: 'Official F1 race weekend tickets',
  
  metadata: {
    event_type: 'sports',
    venue_name: 'Yas Marina Circuit',
    event_name: 'Abu Dhabi Grand Prix 2025',
    provider_name: 'Yas Marina Circuit',
    requires_booking_lead_time: '7 days'
  },
  
  categories: [
    {
      id: 'ticket-1',
      category_name: 'Main Grandstand - 3 Day Pass',
      description: 'Premium grandstand seating for all 3 days',
      capacity_info: {
        section_capacity: 500
      },
      pricing_behavior: {
        pricing_mode: 'per_person',
        supports_volume_discounts: true
      }
    },
    {
      id: 'ticket-2',
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
}
```

### Contract
```typescript
{
  id: 102,
  item_id: 2,
  item_type: 'ticket',
  contract_name: 'F1 Tickets Block 2025',
  tour_ids: [5],
  
  allocations: [
    {
      category_ids: ['ticket-1'],
      quantity: 100,  // 100 tickets allocated
      allocation_pool_id: 'f1-tickets-main-grandstand',
      label: 'Main Grandstand Block'
    },
    {
      category_ids: ['ticket-2'],
      quantity: 20,  // 20 VIP tickets
      allocation_pool_id: 'f1-tickets-paddock',
      label: 'Paddock Club Block'
    }
  ],
  
  pricing_strategy: 'per_unit',
  markup_percentage: 0.40,  // 40% markup
  tax_rate: 0.05  // 5% VAT
}
```

### Rate
```typescript
{
  id: 1002,
  item_id: 2,
  category_id: 'ticket-1',
  contract_id: 102,
  allocation_pool_id: 'f1-tickets-main-grandstand',
  
  base_rate: 1200,  // AED 1,200 per person
  markup_percentage: 0.40,
  selling_price: 1680,  // 1200 × 1.40
  currency: 'AED',
  
  rate_details: {
    pricing_unit: 'per_person'
  },
  
  valid_from: '2025-11-28',
  valid_to: '2025-11-30',
  
  active: true
}
```

---

## Example 3: 🚗 Airport Transfers

### Inventory Item
```typescript
{
  id: 3,
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
      id: 'transfer-1',
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
    },
    {
      id: 'transfer-2',
      category_name: 'Shared Shuttle (per person)',
      description: 'Shared shuttle service - scheduled departures',
      capacity_info: {
        max_pax: 15,
        min_pax: 1
      },
      pricing_behavior: {
        pricing_mode: 'per_person',
        directional: true,
        directions: ['inbound', 'outbound', 'round_trip']
      }
    }
  ],
  
  active: true
}
```

### Rate (Buy-to-Order, No Contract)
```typescript
{
  id: 1003,
  item_id: 3,
  category_id: 'transfer-1',
  contract_id: undefined,  // No contract - buy to order
  
  base_rate: 150,  // AED 150 per vehicle
  markup_percentage: 0.50,
  selling_price: 225,
  currency: 'AED',
  inventory_type: 'buy_to_order',
  
  rate_details: {
    direction: 'inbound',
    pricing_unit: 'per_vehicle',
    paired_rate_id: 1004  // Links to outbound transfer
  },
  
  valid_from: '2025-11-01',
  valid_to: '2025-12-31',
  
  active: true
}
```

---

## Example 4: 🧭 City Tour Activity

### Inventory Item
```typescript
{
  id: 4,
  item_type: 'activity',
  name: 'Abu Dhabi City Tours',
  location: 'Abu Dhabi, UAE',
  description: 'Guided city tours and experiences',
  
  metadata: {
    activity_type: 'tour',
    duration: '4 hours',
    difficulty: 'easy',
    provider_name: 'Abu Dhabi Tours LLC',
    requires_booking_lead_time: '24 hours'
  },
  
  categories: [
    {
      id: 'activity-1',
      category_name: 'Half-Day City Tour',
      description: 'Sheikh Zayed Mosque, Heritage Village, Corniche',
      capacity_info: {
        recommended_group_size: 15
      },
      pricing_behavior: {
        pricing_mode: 'per_person',
        supports_volume_discounts: true
      }
    },
    {
      id: 'activity-2',
      category_name: 'Desert Safari Experience',
      description: 'Dune bashing, camel riding, BBQ dinner',
      capacity_info: {
        recommended_group_size: 20
      },
      pricing_behavior: {
        pricing_mode: 'per_person'
      }
    }
  ],
  
  active: true
}
```

### Rate
```typescript
{
  id: 1005,
  item_id: 4,
  category_id: 'activity-1',
  
  base_rate: 80,  // AED 80 per person
  markup_percentage: 0.60,
  selling_price: 128,
  currency: 'AED',
  inventory_type: 'buy_to_order',
  
  rate_details: {
    pricing_unit: 'per_person',
    volume_tiers: [
      { min_quantity: 1, max_quantity: 9, rate: 80 },
      { min_quantity: 10, max_quantity: 19, rate: 70, discount_percentage: 0.125 },
      { min_quantity: 20, rate: 60, discount_percentage: 0.25 }
    ]
  },
  
  valid_from: '2025-09-01',
  valid_to: '2026-04-30',
  
  active: true
}
```

---

## Example 5: 🍽️ Gala Dinner

### Inventory Item
```typescript
{
  id: 5,
  item_type: 'meal',
  name: 'F1 Gala Dinner Events',
  location: 'Various Venues, Abu Dhabi',
  description: 'Premium dining experiences for F1 weekend',
  
  metadata: {
    meal_type: 'gala',
    cuisine_type: 'International',
    dietary_options: ['vegetarian', 'vegan', 'halal', 'gluten-free'],
    provider_name: 'Premium Events Catering'
  },
  
  categories: [
    {
      id: 'meal-1',
      category_name: 'Yas Marina Circuit Gala Dinner',
      description: 'Exclusive trackside dining experience',
      features: 'Live entertainment, open bar, 5-course meal',
      capacity_info: {
        section_capacity: 200
      },
      pricing_behavior: {
        pricing_mode: 'per_person'
      }
    }
  ],
  
  active: true
}
```

---

## Example 6: 🏟️ Venue Hire

### Inventory Item
```typescript
{
  id: 6,
  item_type: 'venue',
  name: 'Conference & Event Spaces',
  location: 'Abu Dhabi, UAE',
  
  metadata: {
    venue_type: 'conference',
    total_capacity: 500
  },
  
  categories: [
    {
      id: 'venue-1',
      category_name: 'Grand Ballroom',
      capacity_info: {
        section_capacity: 500
      },
      pricing_behavior: {
        pricing_mode: 'flat_rate'  // Per event, not per person
      }
    }
  ]
}
```

---

## How It All Works Together

### Same Form, Different Behavior

When creating a rate, the form **adapts** based on item type:

```typescript
// The form reads item.item_type and shows/hides fields

{item.item_type === 'hotel' && (
  <>
    <OccupancySelector />      // Single, Double, Triple, Quad
    <BoardTypeSelector />       // Room Only, B&B, Half Board, etc.
    <HotelCostsSection />       // City tax, resort fee
  </>
)}

{item.item_type === 'ticket' && (
  <>
    <QuantityInput />           // Number of tickets
    <SectionSelector />         // Grandstand, VIP, etc.
    <PricingUnit>Per Person</PricingUnit>
  </>
)}

{item.item_type === 'transfer' && (
  <>
    <DirectionSelector />       // Inbound, Outbound, Round Trip
    <VehicleTypeDisplay />      // From category
    <PricingUnit>Per Vehicle</PricingUnit>
    <PairedRateSelector />      // Link to return journey
  </>
)}

{item.item_type === 'activity' && (
  <>
    <DurationDisplay />         // From metadata
    <DifficultyBadge />         // From metadata
    <VolumeTiersInput />        // Group discounts
    <PricingUnit>Per Person</PricingUnit>
  </>
)}

{/* Common fields for ALL types */}
<AllocationPoolInput />         // Works for everything!
<TourLinkingSelector />         // Works for everything!
<ValidityDates />               // Works for everything!
<MarkupPercentage />            // Works for everything!
```

---

## Allocation Pool Magic

**Same pool across different types!**

```typescript
// Hotel rate in pool
{
  item_type: 'hotel',
  allocation_pool_id: 'f1-premium-package',
  allocated_quantity: 50  // 50 rooms
}

// Ticket rate in SAME pool
{
  item_type: 'ticket',
  allocation_pool_id: 'f1-premium-package',
  allocated_quantity: 50  // 50 tickets (tied to hotel rooms!)
}

// Transfer rate in SAME pool
{
  item_type: 'transfer',
  allocation_pool_id: 'f1-premium-package',
  allocated_quantity: 50  // 50 transfers (one per room!)
}

// Result: Book one package = books hotel + ticket + transfer from shared pool!
```

---

## Unified Rates Table

**One table shows all inventory types:**

| Type | Category | Details | Pool | Valid Dates | Base Rate | Markup | Status |
|------|----------|---------|------|-------------|-----------|--------|--------|
| 🏨 Hotel | Deluxe Room | Double, B&B | f1-pool | Nov 28 - Dec 1 | AED 800 | 60% | Active |
| 🎫 Ticket | Main Stand | Per Person | f1-pool | Nov 28-30 | AED 1,200 | 40% | Active |
| 🚗 Transfer | Private Sedan | Inbound | - | Nov 1 - Dec 31 | AED 150 | 50% | Active |
| 🧭 Activity | City Tour | Per Person | - | Sep 1 - Apr 30 | AED 80 | 60% | Active |

**Same table, different columns shown based on type!**

---

## Benefits

✅ **Hotels** keep all their complexity (occupancy, board, taxes)  
✅ **Tickets** get allocation pools (wasn't possible before!)  
✅ **Transfers** get contract-based pricing (wasn't possible before!)  
✅ **Activities** get pool-based inventory (new capability!)  
✅ **Everything** uses same forms, same workflow, same UX  
✅ **Cross-type packages** possible (hotel + ticket + transfer)

---

## Next: Implementation

Ready to build this? Start with:

1. ✅ Type definitions (DONE - `src/types/unified-inventory.ts`)
2. Data layer (add to DataContext)
3. Unified forms (item, contract, rate)
4. Main page (unified inventory)
5. Migration (convert existing hotels/services)

See `UNIFIED_INVENTORY_ROADMAP.md` for detailed implementation plan!


