# 🔧 **Split-Stay Booking - Critical Missing Feature**

## 🎯 **The Problem**

**Current System**: Only shows rates where the ENTIRE booking period fits within ONE rate's validity dates.

**What This Means**:
```
Scenario: Customer wants Dec 2-8 (6 nights)

Your Rates:
- Pre-shoulder: Dec 2-3 (£180)
- Main period: Dec 4-8 (£200)

Current Result:
❌ NO RATES SHOWN
❌ Customer can't book
❌ Revenue lost!

Why?
- Dec 2-8 doesn't fit entirely in Dec 2-3 ❌
- Dec 2-8 doesn't fit entirely in Dec 4-8 ❌
- System filters out both rates
```

---

## ✅ **Industry Standard Solution: Split-Stay Booking**

### **What Should Happen**:

```
Customer books Dec 2-8 (6 nights):

Step 1: Find ALL rates that cover ANY part of the booking
✅ Rate 1: Dec 2-3 (covers days 1-2)
✅ Rate 2: Dec 4-8 (covers days 3-6)

Step 2: Validate coverage is complete
✅ Dec 2: Covered by Rate 1
✅ Dec 3: Covered by Rate 1
✅ Dec 4: Covered by Rate 2
✅ Dec 5: Covered by Rate 2
✅ Dec 6: Covered by Rate 2
✅ Dec 7: Covered by Rate 2
✅ Dec 8: Check-out (not counted)

Step 3: Calculate price
Night 1 (Dec 2): £180 (Rate 1)
Night 2 (Dec 3): £180 (Rate 1)
Night 3 (Dec 4): £200 (Rate 2)
Night 4 (Dec 5): £200 (Rate 2)
Night 5 (Dec 6): £200 (Rate 2)
Night 6 (Dec 7): £200 (Rate 2)
Total: 2×£180 + 4×£200 = £1,160

Step 4: Check pool availability
Pool: dec-2025-double-pool
- Total: 10 rooms
- Booked: 3 rooms
- Available: 7 rooms ✅

Step 5: Create booking
Booking: {
  check_in: "2025-12-02",
  check_out: "2025-12-08",
  rate_ids: [1, 2], // Both rates!
  allocation_pool_id: "dec-2025-double-pool",
  price_breakdown: [
    { rate_id: 1, nights: 2, price_per_night: 180, total: 360 },
    { rate_id: 2, nights: 4, price_per_night: 200, total: 800 }
  ],
  total_price: 1160,
  quantity: 1
}

Step 6: Update inventory
Pool: dec-2025-double-pool
- Booked: 4 rooms (was 3, now 4)
- Available: 6 rooms
```

---

## 🔧 **Implementation Requirements**

### **Phase 1: Rate Discovery (Change Filtering Logic)**

**File**: `src/pages/bookings-create.tsx`

**Current (Lines 489-490)**:
```typescript
// ❌ WRONG: Only shows rates that FULLY contain the booking
if (rateStart > end || rateEnd < start) return null
```

**Should Be**:
```typescript
// ✅ CORRECT: Show rates that have ANY overlap with booking
// Rate overlaps if it starts before booking ends AND ends after booking starts
const hasOverlap = rateStart <= end && rateEnd >= start
if (!hasOverlap) return null
```

**But wait!** This is more complex because we also need to:
1. Check if the ENTIRE booking period is covered
2. Group rates by room type + pool
3. Calculate multi-rate pricing
4. Validate no gaps in coverage

---

### **Phase 2: Multi-Rate Price Calculation**

**New Function Needed**:

```typescript
function calculateSplitStayPrice(
  checkIn: string,
  checkOut: string,
  rates: Rate[],
  occupancy: OccupancyType,
  boardType: BoardType
): {
  isFullyCovered: boolean
  gaps: Array<{ start: string, end: string }>
  priceBreakdown: Array<{
    rate_id: number
    date_start: string
    date_end: string
    nights: number
    rate_per_night: number
    board_cost_per_night: number
    total: number
  }>
  totalPrice: number
  allocationPoolId?: string
} {
  // 1. Sort rates by date
  const sortedRates = rates.sort((a, b) => 
    new Date(a.valid_from!).getTime() - new Date(b.valid_from!).getTime()
  )
  
  // 2. Build day-by-day rate assignment
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  const nightRates: Array<{ date: string, rate: Rate | null }> = []
  
  for (let i = 0; i < nights; i++) {
    const currentDate = new Date(start)
    currentDate.setDate(currentDate.getDate() + i)
    const dateStr = currentDate.toISOString().split('T')[0]
    
    // Find rate covering this date
    const applicableRate = sortedRates.find(rate => {
      const rateStart = new Date(rate.valid_from!)
      const rateEnd = new Date(rate.valid_to!)
      return currentDate >= rateStart && currentDate < rateEnd
    })
    
    nightRates.push({ date: dateStr, rate: applicableRate || null })
  }
  
  // 3. Check for gaps
  const gaps: Array<{ start: string, end: string }> = []
  let gapStart: string | null = null
  
  nightRates.forEach(({ date, rate }) => {
    if (!rate && !gapStart) {
      gapStart = date
    } else if (rate && gapStart) {
      gaps.push({ start: gapStart, end: date })
      gapStart = null
    }
  })
  
  const isFullyCovered = gaps.length === 0
  
  // 4. Calculate price breakdown
  const priceBreakdown: any[] = []
  let currentRateId: number | null = null
  let currentNights = 0
  let currentStartDate = ''
  
  nightRates.forEach(({ date, rate }, index) => {
    if (!rate) return
    
    if (rate.id !== currentRateId) {
      // New rate period
      if (currentRateId !== null) {
        // Save previous period
        const previousRate = sortedRates.find(r => r.id === currentRateId)!
        priceBreakdown.push({
          rate_id: currentRateId,
          date_start: currentStartDate,
          date_end: nightRates[index - 1].date,
          nights: currentNights,
          rate_per_night: previousRate.rate,
          board_cost_per_night: previousRate.board_cost || 0,
          total: currentNights * (previousRate.rate + (previousRate.board_cost || 0))
        })
      }
      
      currentRateId = rate.id
      currentNights = 1
      currentStartDate = date
    } else {
      currentNights++
    }
    
    // Last night
    if (index === nightRates.length - 1) {
      priceBreakdown.push({
        rate_id: currentRateId,
        date_start: currentStartDate,
        date_end: date,
        nights: currentNights,
        rate_per_night: rate.rate,
        board_cost_per_night: rate.board_cost || 0,
        total: currentNights * (rate.rate + (rate.board_cost || 0))
      })
    }
  })
  
  const totalPrice = priceBreakdown.reduce((sum, item) => sum + item.total, 0)
  
  // Get allocation pool ID (should be same for all rates)
  const allocationPoolId = rates[0]?.allocation_pool_id
  
  return {
    isFullyCovered,
    gaps,
    priceBreakdown,
    totalPrice,
    allocationPoolId
  }
}
```

---

### **Phase 3: Enhanced UI Display**

**Current**: Single rate shown in booking table

**Should Be**: Multi-rate breakdown shown

```
┌─────────────────────────────────────────────────────────┐
│ GRAND HOTEL - Double Room                               │
│ Double Occupancy - Bed & Breakfast                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📅 MULTI-RATE BOOKING (6 nights)                        │
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Dec 2-3 (2 nights)                                │   │
│ │ Pre-Shoulder Rate                                 │   │
│ │ £180/night + £15 board                            │   │
│ │ Subtotal: £390                                    │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Dec 4-8 (4 nights)                                │   │
│ │ Main Period Rate                                  │   │
│ │ £200/night + £15 board                            │   │
│ │ Subtotal: £860                                    │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ ──────────────────────────────────────────────────      │
│ Total (6 nights): £1,250                                │
│                                                         │
│ Pool: dec-2025-double-pool                              │
│ Available: 7/10 rooms                                   │
│                                                         │
│ Quantity: [1  ▼]              [Add to Cart]             │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ **Current Workaround (Until Split-Stay Implemented)**

### **Customer Must Book in Separate Segments**:

```
Scenario: Want to book Dec 2-8

Workaround:
1. Book Dec 2-3 separately (pre-shoulder)
   → 1 room, 2 nights, £180/night = £360
   
2. Book Dec 4-8 separately (main period)
   → 1 room, 4 nights, £200/night = £800
   
Total: 2 separate bookings
Price: £360 + £800 = £1,160 ✅ (correct)

Problems:
❌ Customer has 2 booking references
❌ More admin work
❌ Confusing customer experience
❌ Not enterprise-grade
```

---

## 🚀 **Recommended Implementation**

### **Option 1: Full Split-Stay (Complex but Best UX)**

**Effort**: 2-3 days
**Complexity**: High
**UX**: Excellent
**Industry Standard**: Yes (Opera, Protel, Mews all support this)

**Features**:
- ✅ Customer books once for entire period
- ✅ System automatically detects multiple rates
- ✅ Calculates correct price per night
- ✅ Shows breakdown in booking
- ✅ Single booking reference
- ✅ Pool inventory correctly tracked

---

### **Option 2: Pool-Based Rate Selection (Simpler)**

**Effort**: 4-6 hours
**Complexity**: Medium
**UX**: Good
**Industry Standard**: Partial

**How It Works**:
```
When customer selects dates Dec 2-8:

System shows:
┌─────────────────────────────────────────────────────────┐
│ GRAND HOTEL - Double Room (Pool-Based Rates)            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🔗 Pool: dec-2025-double-pool                           │
│ Your dates span multiple rate periods:                  │
│                                                         │
│ Select rate period to book:                             │
│                                                         │
│ ○ Dec 2-3 ONLY (2 nights) - £180/night                 │
│   Pre-shoulder rate • Pool: dec-2025-double-pool        │
│                                                         │
│ ○ Dec 4-8 ONLY (4 nights) - £200/night                 │
│   Main period rate • Pool: dec-2025-double-pool         │
│                                                         │
│ ● Book Both Periods (6 nights) - £1,160 total          │
│   Split-stay: 2 nights @ £180 + 4 nights @ £200        │
│   Pool: dec-2025-double-pool                            │
│   (Creates 2 linked bookings)                           │
│                                                         │
│ [Add to Cart]                                           │
└─────────────────────────────────────────────────────────┘
```

**Pros**:
- ✅ Faster to implement
- ✅ Clear choice for customer
- ✅ Handles pool inventory correctly
- ✅ Can create linked bookings

**Cons**:
- ⚠️ Requires customer to explicitly choose "Book Both"
- ⚠️ Creates multiple booking records (linked)

---

### **Option 3: Manual Booking (Current Workaround)**

**Effort**: 0 hours (already works this way)
**Complexity**: Low
**UX**: Poor
**Industry Standard**: No

Customer must make 2 separate bookings.

---

## 🎯 **Recommended Approach**

### **Implement Option 2 First (Pool-Based Rate Selection)**

**Why?**
1. ✅ Faster to implement (4-6 hours vs 2-3 days)
2. ✅ Solves 80% of the problem
3. ✅ Works with allocation pools perfectly
4. ✅ Can be enhanced to Option 1 later

**Then later**: Upgrade to Option 1 (Full Split-Stay) when time permits

---

## 🔧 **Option 2 Implementation (Quick Fix)**

### **Step 1: Change Rate Filtering (Lines 489-490)**

```typescript
// Before:
if (rateStart > end || rateEnd < start) return null

// After:
// Check if rate has ANY overlap with booking period
const hasOverlap = rateStart <= end && rateEnd >= start
if (!hasOverlap) return null
```

---

### **Step 2: Group Rates by Pool**

```typescript
// After getting all overlapping rates, group by pool
const ratesByPool = useMemo(() => {
  const grouped = new Map<string, {
    poolId: string
    rates: typeof availableRates
    hotel: any
    roomType: string
    totalNightsCovered: number
    hasCoverageGaps: boolean
    estimatedTotal: number
  }>()
  
  availableRates.forEach(rateItem => {
    const poolId = rateItem.rate.allocation_pool_id || `individual-${rateItem.rate.id}`
    
    if (!grouped.has(poolId)) {
      grouped.set(poolId, {
        poolId,
        rates: [],
        hotel: rateItem.hotel,
        roomType: rateItem.rate.roomName,
        totalNightsCovered: 0,
        hasCoverageGaps: false,
        estimatedTotal: 0
      })
    }
    
    grouped.get(poolId)!.rates.push(rateItem)
  })
  
  // Calculate coverage for each pool
  grouped.forEach(pool => {
    const coverage = calculateCoverage(pool.rates, checkInDate, checkOutDate)
    pool.totalNightsCovered = coverage.nightsCovered
    pool.hasCoverageGaps = coverage.hasGaps
    pool.estimatedTotal = coverage.totalPrice
  })
  
  return grouped
}, [availableRates, checkInDate, checkOutDate])
```

---

### **Step 3: Enhanced Booking UI**

```tsx
{Array.from(ratesByPool.values()).map(pool => (
  <Card key={pool.poolId}>
    <CardContent>
      <div className="font-medium">{pool.hotel.name} - {pool.roomType}</div>
      
      {pool.rates.length > 1 ? (
        // Multi-rate booking
        <>
          <Badge>Multi-Rate Booking</Badge>
          <div className="space-y-2 mt-2">
            {pool.rates.map(rateItem => {
              const nightsForThisRate = calculateNightsInPeriod(
                checkInDate, 
                checkOutDate, 
                rateItem.rate.valid_from,
                rateItem.rate.valid_to
              )
              
              return (
                <div key={rateItem.rate.id} className="text-xs bg-muted p-2 rounded">
                  <div>{rateItem.rate.valid_from} to {rateItem.rate.valid_to}</div>
                  <div>{nightsForThisRate} nights × {rateItem.rate.rate} = {nightsForThisRate * rateItem.rate.rate}</div>
                </div>
              )
            })}
          </div>
          
          {pool.hasCoverageGaps && (
            <Alert variant="destructive">
              ⚠️ Some nights not covered by rates
            </Alert>
          )}
          
          <div className="mt-2">
            <strong>Total: {formatCurrency(pool.estimatedTotal)}</strong>
          </div>
        </>
      ) : (
        // Single rate booking (current behavior)
        <>
          <div>{pool.rates[0].rate.rate}/night</div>
          <div>Total: {formatCurrency(pool.estimatedTotal)}</div>
        </>
      )}
      
      <Button onClick={() => addToCart(pool)}>Add to Cart</Button>
    </CardContent>
  </Card>
))}
```

---

## ⏰ **Implementation Time Estimate**

### **Quick Fix (Option 2)**:

```
Task 1: Change rate filtering (1 hour)
├─ Update availableRates filter logic
└─ Test with multi-rate dates

Task 2: Add multi-rate grouping (2 hours)
├─ Group rates by pool
├─ Calculate coverage
└─ Detect gaps

Task 3: Enhanced UI display (2 hours)
├─ Show rate breakdown
├─ Display total price
└─ Add gap warnings

Task 4: Update cart logic (1 hour)
├─ Store multiple rate_ids
├─ Track allocation_pool_id
└─ Update inventory correctly

TOTAL: 4-6 hours
```

---

## 🎯 **Decision Point**

**Option A: Implement Now (Recommended)**
- ✅ Fix critical booking flow issue
- ✅ Enable multi-period bookings
- ✅ Unlock value of allocation pools
- ✅ 4-6 hours investment

**Option B: Leave as Workaround**
- ⚠️ Customers must make multiple bookings
- ⚠️ Pool feature underutilized
- ⚠️ Not competitive with industry standards
- ⚠️ Revenue lost from complex bookings

---

## 🚨 **Critical Issue Summary**

**Current State**:
```
✅ Allocation pools: Implemented
✅ Multi-rate pricing: Data model ready
✅ Inventory tracking: Works correctly
❌ Booking UI: Can't handle split-stay bookings
❌ Customer Experience: Must book multiple times
```

**Impact**:
```
Without split-stay booking:
- Customer books Dec 2-8 → NO RATES SHOWN ❌
- Lost booking opportunity
- Poor customer experience
- Allocation pool value limited

With split-stay booking:
- Customer books Dec 2-8 → MULTI-RATE OPTIONS SHOWN ✅
- Automatic price calculation
- Single booking process
- Full allocation pool value realized
```

---

## 💡 **My Recommendation**

**Implement Option 2 (Pool-Based Multi-Rate Booking) immediately.**

This is **blocking** the allocation pool feature from being useful. Without it:
- Customers can't actually book across shoulder night periods
- Your allocation pool work is 50% complete
- System not competitive with industry standards

**Would you like me to implement Option 2 now?** It's 4-6 hours of work but unlocks the full value of allocation pools and makes the system truly enterprise-grade. 🚀

