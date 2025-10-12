# 🎯 **Allocation Pool - Step-by-Step Example**

## Your Exact Scenario: Double Room with 3 Price Periods

You asked:
> "Let's say we have different rates for a double room:
> - **Base contracted dates** (Dec 4-8): **£200/night**
> - **Dates before** (Dec 2-3): **£180/night**  
> - **Dates after** (Dec 9+): **£290/night**
> How would we enter that into our system?"

Here's exactly how to do it:

---

## 📋 **Step 1: Create the Main Contract**

Go to **Inventory → Hotels → Add Contract**

```
CONTRACT DETAILS:
Hotel: Grand Hotel
Contract Name: "Grand Hotel December 2025"
Supplier: Direct
Start Date: 2025-12-02  ← Earliest date (includes pre-shoulder)
End Date: 2025-12-15     ← Latest date (includes post-shoulder)
Currency: GBP

ROOM ALLOCATIONS:
Room Type: Double Room
Quantity: 10
Label: "December Block"
Allocation Pool ID: "grand-dec-2025-double"  ← KEY! This is new!

PRICING STRATEGY: Per Occupancy
Occupancy Rates:
- Double: £200  ← Main period rate

BOARD OPTIONS:
- Bed & Breakfast: £15 per person per night
```

**Click Save** → System auto-generates rates with `allocation_pool_id: "grand-dec-2025-double"`

---

## 📋 **Step 2: Edit Main Rate Validity**

The auto-generated rate covers Dec 2-15 (full contract period). We need to restrict it to Dec 4-8 only.

Go to **Inventory → Hotels → Grand Hotel December 2025 → Rates Tab**

Find the rate:
```
Rate: Double Room, Double Occupancy, Bed & Breakfast
Base Rate: £200
```

**Click Edit** and update:
```
Valid From: 2025-12-04  ← Add this
Valid To: 2025-12-08    ← Add this

(Leave everything else as-is, including allocation_pool_id)
```

**Click Save**

---

## 📋 **Step 3: Create Pre-Shoulder Rate (Dec 2-3)**

Go to **Inventory → Hotels → Grand Hotel December 2025**

**Click "Add Rate"** (not "Add Contract")

```
RATE DETAILS:
Link to Contract: Grand Hotel December 2025
Hotel: Grand Hotel
Room Type: Double Room
Occupancy: Double
Board Type: Bed & Breakfast

PRICING:
Base Rate: £180  ← Lower pre-shoulder rate
Board Cost: £15

VALIDITY DATES:
Valid From: 2025-12-02
Valid To: 2025-12-03

ALLOCATION POOL:
Allocation Pool ID: "grand-dec-2025-double"  ← MUST MATCH!

SHOULDER SETTINGS:
Is Shoulder Rate: ✅ Yes
Shoulder Type: Pre
Linked Main Rate: [Select the £200 rate from dropdown]

STATUS:
Active: ✅ Yes
```

**Click Save**

---

## 📋 **Step 4: Create Post-Shoulder Rate (Dec 9-15)**

**Click "Add Rate"** again

```
RATE DETAILS:
Link to Contract: Grand Hotel December 2025
Hotel: Grand Hotel
Room Type: Double Room
Occupancy: Double
Board Type: Bed & Breakfast

PRICING:
Base Rate: £290  ← Higher post-shoulder rate
Board Cost: £15

VALIDITY DATES:
Valid From: 2025-12-09
Valid To: 2025-12-15

ALLOCATION POOL:
Allocation Pool ID: "grand-dec-2025-double"  ← MUST MATCH!

SHOULDER SETTINGS:
Is Shoulder Rate: ✅ Yes
Shoulder Type: Post
Linked Main Rate: [Select the £200 rate from dropdown]

STATUS:
Active: ✅ Yes
```

**Click Save**

---

## ✅ **Step 5: Verify Your Setup**

Go to **Inventory → Hotels → Grand Hotel December 2025 → Rates Tab**

You should now see:

```
📊 Allocation Pool: grand-dec-2025-double
   Total Allocation: 10 rooms
   Currently Booked: 0 rooms
   Available: 10 rooms

RATES:
┌────────────────────────────────────────────────────────────┐
│ 🏨 Double Room - Double Occupancy - Bed & Breakfast        │
├────────────────────────────────────────────────────────────┤
│ Pre-Shoulder (Dec 2-3)                                     │
│ £180/night + £15 board                                     │
│ Pool: grand-dec-2025-double                                │
├────────────────────────────────────────────────────────────┤
│ Main Period (Dec 4-8)                                      │
│ £200/night + £15 board                                     │
│ Pool: grand-dec-2025-double                                │
├────────────────────────────────────────────────────────────┤
│ Post-Shoulder (Dec 9-15)                                   │
│ £290/night + £15 board                                     │
│ Pool: grand-dec-2025-double                                │
└────────────────────────────────────────────────────────────┘
```

---

## 🎟️ **Step 6: Test a Booking**

Go to **Bookings → Create Booking**

```
Check-in: 2025-12-02
Check-out: 2025-12-09  (7 nights total)

Available Rates:
┌────────────────────────────────────────────────────────┐
│ Grand Hotel - Double Room                              │
│ Double Occupancy - Bed & Breakfast                    │
│                                                        │
│ Price Breakdown:                                       │
│ Dec 2-3 (2 nights): 2 × £180 = £360                  │
│ Dec 4-8 (5 nights): 5 × £200 = £1,000                │
│ ─────────────────────────────────────────────         │
│ Subtotal (7 nights): £1,360                           │
│ Board (2 pax × 7 nights × £15): £210                 │
│ Total: £1,570                                          │
│                                                        │
│ Available: 10 rooms                                    │
│ [Add to Cart]                                          │
└────────────────────────────────────────────────────────┘
```

**Click "Add to Cart"** → Complete booking

---

## 🔍 **How the System Knows It's Only 1 Room**

### **Behind the Scenes:**

```typescript
// Step 1: Customer searches Dec 2-9
checkIn: "2025-12-02"
checkOut: "2025-12-09"

// Step 2: System finds ALL rates covering this period
Found rates:
- Rate 1: Dec 2-3, £180, pool: "grand-dec-2025-double"
- Rate 2: Dec 4-8, £200, pool: "grand-dec-2025-double"

// Step 3: System checks POOL availability (not individual rates!)
Pool ID: "grand-dec-2025-double"

// Find allocation for this pool
Allocation: {
  room_group_ids: ["double-room-id"],
  quantity: 10,  ← Total rooms for the ENTIRE pool
  allocation_pool_id: "grand-dec-2025-double"
}

// Count bookings across ALL rates in this pool
Booked rooms = bookings
  .filter(booking => booking.rate.allocation_pool_id === "grand-dec-2025-double")
  .sum(quantity)
  
// Result: 0 booked, 10 available

// Step 4: System calculates price across BOTH rates
Price calculation:
- Dec 2-3: 2 nights × £180 = £360
- Dec 4-8: 5 nights × £200 = £1,000
- Total: £1,360 (+ board)

// Step 5: Customer books 1 room
System creates ONE booking:
{
  room_type: "Double Room",
  quantity: 1,  ← ONE room
  nights: 7,
  rate_ids: [1, 2],  ← References BOTH rates
  allocation_pool_id: "grand-dec-2025-double",
  total: £1,570
}

// Step 6: Inventory updated
Pool: "grand-dec-2025-double"
- Total: 10 rooms
- Booked: 1 room  ← System knows it's ONE room, not TWO!
- Available: 9 rooms
```

**🎯 The pool ID is the key!** All rates with the same `allocation_pool_id` share the same physical inventory.

---

## 🚨 **Common Mistakes to Avoid**

### **❌ Mistake 1: Forgetting to Add Pool ID**

```
Rate 1: allocation_pool_id = "grand-dec-2025-double" ✅
Rate 2: allocation_pool_id = undefined  ❌ MISSING!

Result: System thinks these are separate allocations
```

### **❌ Mistake 2: Typos in Pool ID**

```
Allocation: allocation_pool_id = "grand-dec-2025-double"
Rate 1: allocation_pool_id = "grand-dec-2025-double" ✅
Rate 2: allocation_pool_id = "grand-dec-2025-Double" ❌ Capital D!

Result: Rate 2 not linked to pool (case-sensitive!)
```

### **❌ Mistake 3: Overlapping Date Ranges**

```
Rate 1: Dec 2-5, £180
Rate 2: Dec 4-8, £200  ❌ Dec 4-5 overlap!

Result: System won't know which rate to use for Dec 4-5
```

**Fix**: Ensure dates don't overlap
```
Rate 1: Dec 2-3, £180 ✅
Rate 2: Dec 4-8, £200 ✅
```

---

## 🎉 **Summary**

**Q: How does the system know it's only 1 room?**

**A: The `allocation_pool_id` links all rates to the same physical inventory!**

```
Without Pool ID:
- Rate 1 (Dec 2-3): 10 rooms
- Rate 2 (Dec 4-8): 10 rooms  
- Total: 20 rooms ❌ WRONG!

With Pool ID "grand-dec-2025-double":
- Rate 1 (Dec 2-3): references pool ──┐
- Rate 2 (Dec 4-8): references pool ──┼→ Pool: 10 total rooms ✅
- Rate 3 (Dec 9-15): references pool ─┘
```

**Your system now handles this enterprise-level functionality perfectly!** 🚀

