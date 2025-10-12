# 🏊 **Allocation Pool System - Complete Guide**

## 📋 **What is an Allocation Pool?**

An **Allocation Pool** allows multiple rates (with different prices and date ranges) to share the **same physical room inventory**. This is essential for handling:

- **Shoulder nights** (pre/post tour nights at different prices)
- **Peak vs off-peak pricing** (same room, different dates, different prices)
- **Multi-period contracts** (one contract, multiple rate periods)

---

## 🎯 **The Problem It Solves**

### **❌ WITHOUT Allocation Pools:**

```
Scenario: 10 Double Rooms, 3 different price periods

Contract 1: Dec 2-3 (Pre-shoulder) - £180/night
- Allocation: 10 rooms

Contract 2: Dec 4-8 (Main) - £200/night  
- Allocation: 10 rooms

Contract 3: Dec 9-15 (Post-shoulder) - £290/night
- Allocation: 10 rooms

❌ System thinks you have 30 rooms total (10+10+10)
❌ Can overbook by 200%!
❌ Customer booking Dec 2-8 must make 2 separate bookings
```

### **✅ WITH Allocation Pools:**

```
Scenario: 10 Double Rooms, 3 different price periods

Contract: "December 2025"
- Room Allocation:
  - Room Type: Double Room
  - Quantity: 10
  - Pool ID: "dec-2025-double-pool"

Rate 1: Dec 2-3 (Pre) - £180/night
- Pool ID: "dec-2025-double-pool"

Rate 2: Dec 4-8 (Main) - £200/night
- Pool ID: "dec-2025-double-pool"

Rate 3: Dec 9-15 (Post) - £290/night
- Pool ID: "dec-2025-double-pool"

✅ All 3 rates share the same 10 rooms
✅ System correctly tracks 10 total rooms
✅ No overbooking possible
✅ Customer booking Dec 2-8 gets automatic price calculation
```

---

## 🔧 **How to Use Allocation Pools**

### **Step 1: Create Main Contract with Pool ID**

```typescript
Contract: "December 2025"
{
  hotel_id: 5,
  contract_name: "Grand Hotel December 2025",
  start_date: "2025-12-02",  // Earliest date
  end_date: "2025-12-15",    // Latest date
  room_allocations: [
    {
      room_group_ids: ["double-room-id"],
      quantity: 10,
      allocation_pool_id: "dec-2025-double-pool"  // ← KEY!
    }
  ],
  pricing_strategy: "per_occupancy",
  occupancy_rates: [
    { occupancy_type: "double", rate: 200 }  // Main period rate
  ],
  board_options: [
    { board_type: "bed_breakfast", additional_cost: 15 }
  ]
}
```

**Result**: System auto-generates rates with `allocation_pool_id: "dec-2025-double-pool"`

---

### **Step 2: Create Shoulder Rates (Manually)**

Since auto-generation uses contract dates, create shoulder rates manually:

#### **Pre-Shoulder Rate (Dec 2-3)**

```typescript
Rate: {
  contract_id: 101,  // Link to main contract
  hotel_id: 5,
  room_group_id: "double-room-id",
  occupancy_type: "double",
  board_type: "bed_breakfast",
  allocation_pool_id: "dec-2025-double-pool",  // ← SAME POOL!
  rate: 180,  // Lower rate for pre-shoulder
  board_cost: 15,
  valid_from: "2025-12-02",
  valid_to: "2025-12-03",
  is_shoulder: true,
  shoulder_type: "pre",
  linked_main_rate_id: 1,  // Optional: link to main rate
  active: true
}
```

#### **Post-Shoulder Rate (Dec 9-15)**

```typescript
Rate: {
  contract_id: 101,  // Link to main contract
  hotel_id: 5,
  room_group_id: "double-room-id",
  occupancy_type: "double",
  board_type: "bed_breakfast",
  allocation_pool_id: "dec-2025-double-pool",  // ← SAME POOL!
  rate: 290,  // Higher rate for post-shoulder
  board_cost: 15,
  valid_from: "2025-12-09",
  valid_to: "2025-12-15",
  is_shoulder: true,
  shoulder_type: "post",
  linked_main_rate_id: 1,  // Optional: link to main rate
  active: true
}
```

---

### **Step 3: Update Main Rate Validity (Optional)**

If you want to restrict the main rate to only Dec 4-8:

```typescript
// Edit the auto-generated main rate:
Rate ID: 1
{
  valid_from: "2025-12-04",  // Add validity dates
  valid_to: "2025-12-08",
  // ... rest stays the same
}
```

---

## 📊 **How It Works: Booking Logic**

### **Scenario: Customer books Dec 2-8 (6 nights)**

```typescript
// Step 1: System finds all rates covering Dec 2-8
Found Rates:
- Rate 1 (Pre-shoulder): Dec 2-3, £180, pool: "dec-2025-double-pool"
- Rate 2 (Main): Dec 4-8, £200, pool: "dec-2025-double-pool"

// Step 2: System checks POOL availability (not individual rates)
Pool: "dec-2025-double-pool"
- Total allocation: 10 rooms
- Already booked: 3 rooms (across ALL rates in this pool)
- Available: 7 rooms ✅

// Step 3: System calculates multi-rate price
Booking: Dec 2-8 (6 nights)
- Dec 2-3: 2 nights × £180 = £360
- Dec 4-8: 4 nights × £200 = £800
- Total: £1,160

// Step 4: System creates ONE booking
Booking:
- Room: 1× Double Room
- Nights: 6
- Rate IDs: [1, 2]  // References both rates
- Total: £1,160
- Status: Confirmed

// Step 5: Inventory updated
Pool: "dec-2025-double-pool"
- Total: 10 rooms
- Booked: 4 rooms (3 previous + 1 new)
- Available: 6 rooms
```

---

## 🎯 **Real-World Examples**

### **Example 1: F1 Race Weekend**

```typescript
// Hungarian Grand Prix 2026

Contract: {
  contract_name: "HUN GP 2026",
  start_date: "2026-07-30",  // 2 days before
  end_date: "2026-08-03",    // 1 day after
  room_allocations: [
    {
      room_group_ids: ["deluxe-double"],
      quantity: 20,
      allocation_pool_id: "hun-gp-2026-deluxe"
    }
  ]
}

// Pre-event (Thu-Fri)
Rate 1: {
  valid_from: "2026-07-30",
  valid_to: "2026-07-31",
  rate: 150,
  allocation_pool_id: "hun-gp-2026-deluxe",
  is_shoulder: true,
  shoulder_type: "pre"
}

// Race weekend (Fri-Sat-Sun)
Rate 2: {
  valid_from: "2026-08-01",
  valid_to: "2026-08-02",
  rate: 350,  // Peak pricing!
  allocation_pool_id: "hun-gp-2026-deluxe"
}

// Post-event (Mon)
Rate 3: {
  valid_from: "2026-08-03",
  valid_to: "2026-08-03",
  rate: 120,
  allocation_pool_id: "hun-gp-2026-deluxe",
  is_shoulder: true,
  shoulder_type: "post"
}

Result:
- 20 rooms shared across all 3 rates
- Customers booking Thu-Mon pay different rates per night
- No overbooking risk
```

---

### **Example 2: Seasonal Pricing**

```typescript
// Summer Season with Weekly Changes

Contract: {
  contract_name: "Summer 2025",
  start_date: "2025-06-01",
  end_date: "2025-08-31",
  room_allocations: [
    {
      room_group_ids: ["standard-double"],
      quantity: 50,
      allocation_pool_id: "summer-2025-standard"
    }
  ]
}

// Early Summer (Lower demand)
Rate 1: {
  valid_from: "2025-06-01",
  valid_to: "2025-06-30",
  rate: 180,
  allocation_pool_id: "summer-2025-standard"
}

// Peak Summer (High demand)
Rate 2: {
  valid_from: "2025-07-01",
  valid_to: "2025-08-15",
  rate: 250,
  allocation_pool_id: "summer-2025-standard"
}

// Late Summer (Lower demand)
Rate 3: {
  valid_from: "2025-08-16",
  valid_to: "2025-08-31",
  rate: 190,
  allocation_pool_id: "summer-2025-standard"
}

Result:
- 50 rooms shared across entire summer
- Pricing changes automatically based on dates
- Single contract, multiple pricing tiers
```

---

## 🚨 **Important Rules**

### **Rule 1: Pool IDs Must Match Exactly**

```typescript
// ❌ WRONG - Pool IDs don't match
Rate 1: { allocation_pool_id: "dec-pool" }
Rate 2: { allocation_pool_id: "Dec-Pool" }  // Different!

// ✅ CORRECT - Exact match
Rate 1: { allocation_pool_id: "dec-2025-double-pool" }
Rate 2: { allocation_pool_id: "dec-2025-double-pool" }
```

### **Rule 2: One Pool Per Room Type**

```typescript
// ❌ WRONG - Mixing room types in one pool
allocation_pool_id: "december-all-rooms"  // Don't do this!
- Double Room → uses this pool
- Suite → uses this pool  // Different physical rooms!

// ✅ CORRECT - Separate pools per room type
allocation_pool_id: "dec-2025-double-pool"  // Doubles only
allocation_pool_id: "dec-2025-suite-pool"   // Suites only
```

### **Rule 3: Pool ID Naming Convention**

**Recommended format**: `{event}-{year}-{room-type}-pool`

```typescript
// ✅ GOOD
"monaco-gp-2025-deluxe-pool"
"summer-2025-standard-pool"
"christmas-2025-suite-pool"

// ❌ BAD (too vague)
"pool1"
"rooms"
"december"
```

---

## 💡 **Best Practices**

### **1. Use Descriptive Pool IDs**

```typescript
// ✅ Clear and descriptive
allocation_pool_id: "abu-dhabi-gp-2025-4star-double"

// ❌ Unclear
allocation_pool_id: "pool17"
```

### **2. Document Your Pools**

Add notes to contracts:

```typescript
Contract: {
  contract_name: "Abu Dhabi GP 2025",
  notes: "Pool ID: abu-dhabi-gp-2025-4star-double - Shared across pre/main/post rates"
}
```

### **3. Create All Rates Together**

When setting up multi-period pricing:
1. Create main contract with pool ID
2. Immediately create all shoulder/alternate rates
3. Test booking across periods

### **4. Validate Before Publishing**

```typescript
// Check that all rates for a period share the same pool
Rates for Dec 2025:
- Rate 1: pool ID = "dec-2025-double-pool" ✅
- Rate 2: pool ID = "dec-2025-double-pool" ✅
- Rate 3: pool ID = "dec-2025-double-pool" ✅
```

---

## 🔍 **Troubleshooting**

### **Problem: Overbooking Still Happening**

**Cause**: Rates don't have matching `allocation_pool_id`

**Solution**:
```typescript
// Check all rates for the same room/period
SELECT * FROM rates WHERE room_group_id = "double-room-id"

// Ensure allocation_pool_id matches:
Rate 1: allocation_pool_id = "dec-pool"
Rate 2: allocation_pool_id = null  // ❌ Missing!

// Fix: Add pool ID to Rate 2
```

### **Problem: Rates Not Showing for Certain Dates**

**Cause**: `valid_from`/`valid_to` dates don't cover full range

**Solution**:
```typescript
// Check date coverage
Contract dates: Dec 2-15
Rate 1: Dec 2-3 ✅
Rate 2: Dec 4-8 ✅
Rate 3: Dec 12-15 ❌ Missing Dec 9-11!

// Fix: Create missing rate for Dec 9-11
```

### **Problem: Wrong Price Calculated**

**Cause**: Multiple rates overlap same dates

**Solution**:
```typescript
// Check for overlapping validity periods
Rate 1: Dec 2-8 (£180)
Rate 2: Dec 4-12 (£200)  // ❌ Overlaps Dec 4-8!

// Fix: Adjust validity dates
Rate 1: Dec 2-3 (£180)
Rate 2: Dec 4-12 (£200)
```

---

## 📈 **Performance Considerations**

### **Indexing (Future: When Connected to Database)**

```sql
-- Index on allocation_pool_id for fast lookups
CREATE INDEX idx_rates_pool ON rates(allocation_pool_id);

-- Index on dates for availability checks
CREATE INDEX idx_rates_dates ON rates(valid_from, valid_to);
```

### **Caching (Future Enhancement)**

```typescript
// Cache pool availability calculations
const poolAvailabilityCache = new Map<string, number>()

function getPoolAvailability(poolId: string): number {
  if (poolAvailabilityCache.has(poolId)) {
    return poolAvailabilityCache.get(poolId)!
  }
  
  const availability = calculatePoolAvailability(poolId)
  poolAvailabilityCache.set(poolId, availability)
  return availability
}
```

---

## 🎓 **Summary**

✅ **Allocation Pools** = Multiple rates share the same physical inventory
✅ **Use Case** = Different prices for different date ranges (same rooms)
✅ **Setup** = Add `allocation_pool_id` to contract allocation
✅ **Benefit** = No overbooking + automatic multi-rate pricing
✅ **Industry Standard** = How Opera, Protel, Mews, and all major PMS systems work

**Your system now supports enterprise-level multi-period rate management!** 🎉

