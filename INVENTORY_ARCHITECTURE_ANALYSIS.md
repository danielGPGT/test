# Deep Dive: Hotel vs Service Inventory Architecture

**Date**: October 12, 2025  
**Question**: Should we unify Hotels and Services into ONE inventory management system, or keep them separate?

---

## 📊 Current Architecture Comparison

### **HOTELS System**

```
Hotel (Inventory Entity)
├── Hotel Details (name, location, star rating, etc.)
└── room_groups[] (RoomGroup)
    ├── room_type (e.g., "Deluxe Room", "Suite")
    ├── capacity
    ├── description
    └── features

Contract (Supplier Agreement)
├── supplier_id → Supplier
├── hotel_id → Hotel
├── contract_name
├── start_date / end_date
├── total_rooms
├── base_rate
├── room_allocations[] (RoomAllocation)
│   ├── room_group_ids[] (which room types)
│   ├── quantity (how many rooms)
│   ├── occupancy_rates[] (optional override)
│   └── base_rate (optional override)
├── pricing_strategy: 'per_occupancy' | 'flat_rate'
├── occupancy_rates[] (OccupancyRate)
│   ├── occupancy_type: 'single' | 'double' | 'triple' | 'quad'
│   └── rate (price for this occupancy)
├── markup_percentage
├── shoulder_markup_percentage
├── days_of_week {mon, tue, wed, thu, fri, sat, sun}
├── min_nights / max_nights
├── tax_rate, city_tax_per_person_per_night, resort_fee_per_night
├── supplier_commission_rate
├── board_options[] (BoardOption)
│   ├── board_type: 'room_only' | 'bed_breakfast' | 'half_board' | 'full_board' | 'all_inclusive'
│   └── additional_cost (per person per night)
├── pre_shoulder_rates[], post_shoulder_rates[] (arrays of rates)
├── attrition_stages[] (room release schedule)
├── cancellation_stages[] (penalty schedule)
├── contracted_payment_total
├── payment_schedule[]
└── tour_ids[] (OPTIONAL - link to specific tours)

Rate (Auto-generated from Contract OR manual for buy-to-order)
├── contract_id (optional - null if buy-to-order)
├── hotel_id (for buy-to-order)
├── room_group_id → RoomGroup
├── occupancy_type: 'single' | 'double' | 'triple' | 'quad'
├── board_type: 'room_only' | 'bed_breakfast' | etc.
├── rate (base rate per room per night)
├── board_cost (additional board cost)
├── active / inactive_reason
├── valid_from / valid_to (required for buy-to-order)
├── min_nights / max_nights (overrides contract)
├── pre_shoulder_rates[], post_shoulder_rates[]
├── tax_rate, city_tax, resort_fee, supplier_commission_rate
├── markup_percentage, shoulder_markup_percentage
└── currency
```

**Key Hotel-Specific Features:**
- ✅ **Occupancy Types**: Single, Double, Triple, Quad (people per room)
- ✅ **Board Types**: Meal plans (room only, B&B, half board, full board, all-inclusive)
- ✅ **Shoulder Rates**: Pre/post contract period pricing
- ✅ **Night-based Pricing**: Per room per night
- ✅ **City Tax per Person per Night**: Hospitality-specific tax
- ✅ **Resort Fees**: Hotel-specific charges
- ✅ **Min/Max Nights**: Stay restrictions

---

### **SERVICES System**

```
ServiceInventoryType (Inventory Entity)
├── name (e.g., "F1 Grand Prix Tickets", "Airport Transfers")
├── category: 'transfer' | 'activity' | 'ticket' | 'meal' | 'other'
├── location
├── description
├── active
└── service_categories[] (ServiceCategoryItem)
    ├── category_name (e.g., "Grandstand - Main Straight", "Private Sedan")
    ├── pricing_unit: 'per_person' | 'per_vehicle' | 'per_group' | 'flat_rate'
    ├── description
    ├── features
    ├── min_pax / max_pax

ServiceContract (Supplier Agreement)
├── supplier_id → Supplier
├── inventory_type_id → ServiceInventoryType
├── contract_name
├── valid_from / valid_to
├── service_allocations[] (ServiceAllocation)
│   ├── category_ids[] (which service categories)
│   ├── quantity (how many units)
│   ├── base_rate (optional)
│   └── label
├── pricing_strategy: 'per_unit' | 'tiered'
├── markup_percentage
├── tax_rate
├── service_fee
├── contracted_payment_total
├── adjusted_payment_total
├── adjustment_notes
├── payment_schedule[]
├── cancellation_policy
├── active
└── tour_id (OPTIONAL - link to specific tour)

ServiceRate (Generated from Contract OR manual for buy-to-order)
├── contract_id (optional - null if buy-to-order)
├── inventory_type_id → ServiceInventoryType
├── category_id → ServiceCategoryItem
├── tour_id (OPTIONAL - inherits from contract or manual)
├── base_rate (cost per unit)
├── pricing_unit: 'per_person' | 'per_vehicle' | 'per_group' | 'flat_rate'
├── markup_percentage
├── selling_price (calculated: base_rate * (1 + markup))
├── currency
├── direction: 'one_way' | 'inbound' | 'outbound' | 'round_trip' (optional)
├── paired_rate_id (optional - link to return journey)
├── inventory_type: 'contract' | 'buy_to_order'
├── allocated_quantity, available_quantity (if contract)
├── valid_from / valid_to
├── days_of_week {monday, tuesday, wednesday, thursday, friday, saturday, sunday}
├── active / inactive_reason
```

**Key Service-Specific Features:**
- ✅ **Pricing Unit**: Per person, per vehicle, per group, flat rate
- ✅ **Direction**: Inbound/outbound/round-trip (for transfers)
- ✅ **Paired Rates**: Link return journeys
- ✅ **Service Category**: transfer, ticket, activity, meal, other
- ✅ **Unit-based Pricing**: Not night-based
- ✅ **Min/Max Pax**: Passenger constraints

---

## 🔍 Detailed Comparison

| Aspect | Hotels | Services | Common? |
|--------|--------|----------|---------|
| **Inventory Entity** | Hotel → RoomGroup | ServiceInventoryType → ServiceCategoryItem | ✅ YES (structure similar) |
| **Contract Entity** | Contract | ServiceContract | ✅ YES (structure similar) |
| **Rate Entity** | Rate | ServiceRate | ✅ YES (structure similar) |
| **Supplier Linking** | ✅ supplier_id | ✅ supplier_id | ✅ YES |
| **Tour Linking** | ✅ tour_ids[] (optional) | ✅ tour_id (optional) | ✅ YES |
| **Allocations** | room_allocations[] | service_allocations[] | ✅ YES (concept same) |
| **Pricing Strategy** | per_occupancy / flat_rate | per_unit / tiered | ⚠️ SIMILAR but different |
| **Markup** | ✅ markup_percentage | ✅ markup_percentage | ✅ YES |
| **Tax** | ✅ tax_rate | ✅ tax_rate | ✅ YES |
| **Payment Schedule** | ✅ payment_schedule[] | ✅ payment_schedule[] | ✅ YES |
| **Valid Dates** | start_date / end_date | valid_from / valid_to | ✅ YES |
| **Days of Week** | ✅ {mon,tue,wed...} | ✅ {monday,tuesday...} | ✅ YES |
| **Active Status** | (implied) | ✅ active | ✅ YES |
| **Buy-to-Order** | ✅ Rate without contract_id | ✅ ServiceRate without contract_id | ✅ YES |
| | | | |
| **Occupancy Types** | ✅ single/double/triple/quad | ❌ N/A | ❌ HOTEL-ONLY |
| **Board Types** | ✅ Meal plans | ❌ N/A | ❌ HOTEL-ONLY |
| **Shoulder Rates** | ✅ Pre/post arrays | ❌ N/A | ❌ HOTEL-ONLY |
| **Night-based Pricing** | ✅ Per room per night | ❌ N/A | ❌ HOTEL-ONLY |
| **City Tax per Person** | ✅ Per person per night | ❌ N/A | ❌ HOTEL-ONLY |
| **Resort Fees** | ✅ Per room per night | ❌ N/A | ❌ HOTEL-ONLY |
| **Min/Max Nights** | ✅ Stay restrictions | ❌ N/A | ❌ HOTEL-ONLY |
| **Attrition Stages** | ✅ Room release schedule | ❌ N/A | ❌ HOTEL-ONLY |
| **Cancellation Stages** | ✅ Penalty schedule | ❌ N/A | ❌ HOTEL-ONLY |
| | | | |
| **Pricing Unit** | ❌ N/A | ✅ per_person/per_vehicle/per_group/flat_rate | ❌ SERVICE-ONLY |
| **Direction** | ❌ N/A | ✅ inbound/outbound/round_trip | ❌ SERVICE-ONLY |
| **Paired Rates** | ❌ N/A | ✅ paired_rate_id | ❌ SERVICE-ONLY |
| **Service Category** | ❌ N/A | ✅ transfer/ticket/activity/meal | ❌ SERVICE-ONLY |
| **Min/Max Pax** | ❌ N/A | ✅ Passenger constraints | ❌ SERVICE-ONLY |

---

## 🤔 Analysis: Should We Unify?

### **Option A: Unified System** ❌

Create ONE `InventoryType` entity that handles both hotels and services.

#### **Potential Structure:**
```typescript
export interface InventoryType {
  id: number
  type: 'hotel' | 'service'  // 👈 Discriminator
  name: string
  category?: ServiceCategory  // Only for services
  location?: string
  description?: string
  
  // Common sub-items (polymorphic)
  items: InventoryItem[]  // Could be RoomGroup OR ServiceCategoryItem
  
  // Hotel-specific
  star_rating?: number
  phone?: string
  email?: string
  
  active: boolean
}

export interface InventoryItem {
  id: string
  name: string
  
  // Hotel-specific (RoomGroup)
  capacity?: number  // Only for rooms
  
  // Service-specific (ServiceCategoryItem)
  pricing_unit?: ServicePricingUnit  // Only for services
  min_pax?: number
  max_pax?: number
  
  description?: string
  features?: string
}

export interface UnifiedContract {
  id: number
  supplier_id: number
  inventory_type_id: number  // Links to InventoryType
  contract_name: string
  
  start_date: string  // or valid_from
  end_date: string    // or valid_to
  
  // Allocations (polymorphic)
  allocations: Allocation[]  // Could be RoomAllocation OR ServiceAllocation
  
  // Pricing (polymorphic)
  pricing_strategy: 'per_occupancy' | 'flat_rate' | 'per_unit' | 'tiered'
  
  // Hotel-specific
  occupancy_rates?: OccupancyRate[]
  board_options?: BoardOption[]
  shoulder_rates?: number[]
  attrition_stages?: AttritionStage[]
  cancellation_stages?: CancellationStage[]
  min_nights?: number
  max_nights?: number
  city_tax_per_person_per_night?: number
  resort_fee_per_night?: number
  
  // Service-specific
  service_fee?: number
  
  // Common
  markup_percentage: number
  tax_rate?: number
  payment_schedule?: PaymentSchedule[]
  tour_ids?: number[]  // or tour_id
  notes?: string
  active: boolean
}

export interface UnifiedRate {
  id: number
  contract_id?: number
  inventory_type_id: number
  item_id: string  // room_group_id OR category_id
  
  // Hotel-specific
  occupancy_type?: OccupancyType
  board_type?: BoardType
  board_cost?: number
  pre_shoulder_rates?: number[]
  post_shoulder_rates?: number[]
  city_tax_per_person_per_night?: number
  resort_fee_per_night?: number
  
  // Service-specific
  pricing_unit?: ServicePricingUnit
  direction?: ServiceDirection
  paired_rate_id?: number
  allocated_quantity?: number
  available_quantity?: number
  
  // Common
  rate: number  // or base_rate
  selling_price?: number
  markup_percentage: number
  tax_rate?: number
  currency: string
  valid_from: string
  valid_to: string
  days_of_week?: DaysOfWeek
  active: boolean
  inactive_reason?: string
}
```

#### **✅ Pros of Unification:**
1. **Single codebase** for inventory management
2. **Reusable UI components** (one contract form, one rate form)
3. **Unified filtering/search** across all inventory
4. **Single CRUD logic** (addInventoryType, addContract, addRate)
5. **Easier to add new inventory types** in future (e.g., flights, car rentals)
6. **Consistent data structure** and patterns

#### **❌ Cons of Unification:**
1. **Massive complexity** in contracts and rates (too many optional fields)
2. **Type safety suffers** (TypeScript can't enforce hotel-only fields)
3. **UI becomes bloated** (forms with conditional fields everywhere)
4. **Business logic complexity** (constant if/else checks for type)
5. **Hard to maintain** (changes to one type affect the other)
6. **Confusing for developers** (what fields apply to what?)
7. **Poor separation of concerns** (hotels and services are fundamentally different)
8. **Database schema issues** (many nullable columns)
9. **Query performance** (filtering by type adds overhead)
10. **Domain modeling** violates single responsibility principle

**Example of code ugliness:**
```typescript
// 😱 This is a nightmare to work with
if (inventoryType.type === 'hotel') {
  if (contract.pricing_strategy === 'per_occupancy') {
    if (rate.occupancy_type === 'double') {
      const boardCost = rate.board_cost || 0
      const cityTax = (rate.city_tax_per_person_per_night || 0) * guestCount
      // ... more hotel logic
    }
  }
} else if (inventoryType.type === 'service') {
  if (rate.pricing_unit === 'per_vehicle') {
    if (rate.direction === 'inbound') {
      // ... transfer logic
    }
  }
}

// VS clean separation:
// Hotel-specific logic in hotel modules
// Service-specific logic in service modules
```

---

### **Option B: Separate Systems (Current)** ✅ RECOMMENDED

Keep Hotels and Services as separate entities with parallel structures.

#### **✅ Pros of Separation:**
1. **Clean domain separation** (hotels are hotels, services are services)
2. **Type safety** (TypeScript enforces correct fields for each)
3. **Simpler code** (no type checking everywhere)
4. **Easier to understand** (clear mental model)
5. **Specialized UI** (hotel forms optimized for hotels, service forms for services)
6. **Better performance** (smaller, focused queries)
7. **Easier to test** (isolated test suites)
8. **Team specialization** (different devs can own different areas)
9. **Less coupling** (changes to hotels don't affect services)
10. **Industry standard** (hotels and services are managed separately in most systems)

#### **❌ Cons of Separation:**
1. **Some code duplication** (contract/rate CRUD logic similar)
2. **Two management pages** (Hotels vs Services)
3. **Can't search across both** in one go (need separate searches)

#### **✅ Mitigation for Code Duplication:**
You can still abstract common patterns WITHOUT merging types:

```typescript
// Shared utility functions
function validateDateRange(start: string, end: string): boolean { ... }
function calculateMarkup(base: number, markup: number): number { ... }
function formatAllocation(allocation: any): string { ... }

// Shared UI components
<DateRangePicker />
<MarkupInput />
<PaymentScheduleBuilder />
<AllocationTable />

// Generic CRUD hooks (with types)
function useInventoryCRUD<T extends Hotel | ServiceInventoryType>() { ... }
function useContractCRUD<T extends Contract | ServiceContract>() { ... }
```

---

## 💡 **Recommendation: KEEP SEPARATE** ✅

### **Why Separation is Better:**

1. **Hotels and Services are FUNDAMENTALLY different business domains:**
   - Hotels sell **time** (nights in a room)
   - Services sell **units** (tickets, transfers, activities)
   - Different pricing models (night-based vs unit-based)
   - Different operational workflows
   - Different guest expectations

2. **The differences outweigh the similarities:**
   - YES, both have contracts, suppliers, rates, allocations
   - BUT hotels have occupancy, board types, shoulder rates, attrition, night restrictions
   - AND services have pricing units, directions, paired rates, pax constraints
   - Forcing them together creates a **"god object"** anti-pattern

3. **Current architecture is GOOD:**
   - Clean separation of concerns
   - Type-safe
   - Easy to maintain
   - Industry-standard approach
   - Scalable (can add more service types easily)

4. **Real-world parallel:**
   - Booking.com: Hotels are separate from Activities/Tours
   - Expedia: Hotels, Flights, Cars, Activities all separate
   - Airbnb: Stays vs Experiences (separate)
   - **No major travel platform unifies accommodation with services**

---

## 🎯 **What You CAN Unify** (Best of Both Worlds)

Instead of merging the types, unify the **PATTERNS** and **SHARED CONCERNS**:

### **1. Unified Booking Interface**
```typescript
// User books both hotels AND services in ONE booking
interface Booking {
  id: number
  tour_id: number
  customer_name: string
  rooms: BookingRoom[]        // Hotel rooms
  service_items: BookingServiceItem[]  // Services
  total_price: number
}
```
✅ **This is what we need to implement!**

### **2. Shared UI Components**
- `<ContractCard>` (works for both)
- `<RateTable>` (adapts to hotel or service)
- `<AllocationManager>` (generic)
- `<PaymentSchedule>` (shared)
- `<SupplierSelect>` (shared)

### **3. Shared Utilities**
- `validateDates()`
- `calculateMarkup()`
- `formatCurrency()`
- `checkAvailability()`

### **4. Unified Operations Workflow**
- Operations page shows BOTH hotel bookings AND service requests
- Unified purchase order system for buy-to-order (both hotels and services)
- Unified payment tracking

### **5. Unified Reporting**
- Total revenue (hotels + services)
- Margin analysis (across all inventory)
- Supplier spending (for all contracts)

---

## 📋 **Action Plan: Keep Separate, Improve Integration**

### **Phase 1: Complete Service Booking** (Immediate)
1. ✅ Service management is built (DONE)
2. ❌ Add `service_items` to Booking interface (TODO)
3. ❌ Save services when creating booking (TODO)
4. ❌ Display services in booking details (TODO)

### **Phase 2: Unified Operations** (Next)
1. Operations page shows both rooms AND services
2. Buy-to-order workflow for both
3. Confirmation tracking for both

### **Phase 3: Shared Components** (Future)
1. Extract common UI patterns
2. Create shared utility library
3. Unified reporting dashboard

### **Phase 4: Advanced Features** (Future)
1. Packages (pre-bundled hotel + services)
2. Smart recommendations (suggest services for hotel bookings)
3. Cross-inventory pricing rules

---

## ✅ **Final Verdict**

**KEEP HOTELS AND SERVICES SEPARATE** ✅

**Reasoning:**
- Hotels and services are different business domains
- Current architecture is clean and maintainable
- Unification would create complexity without real benefits
- Industry standard is separate management
- You can still unify at the **booking** and **operations** level

**Next Step:**
Fix the critical bug where services aren't saved to bookings, then improve integration points (operations, reporting, booking display).

---

**In summary**: Your instinct to question the architecture is good, but in this case, **separation is the right choice**. The apparent duplication is actually **appropriate domain modeling**, not a design flaw. What you want is **better integration**, not **merging the types**.

