# 🐛 CRITICAL BUGS FIXED - Pricing & Availability

## ⚠️ Two Major Issues Found & Fixed

You were absolutely right to flag these! I found **TWO critical bugs** that were causing incorrect prices and availability numbers.

---

## 🐛 **BUG #1: Availability Double-Counting**

### **The Problem:**

**Your contract:**
- Total rooms: 30
- Room allocations:
  - Standard Double: 20 rooms
  - Standard Twin: 10 rooms

**What the booking form showed:**
- Standard Double: **40 available** ❌
- Standard Twin: **20 available** ❌
- **Total: 60 rooms** ❌

**You only have 30 rooms in the contract!**

---

### **Root Cause:**

Different occupancy types for the **same room** share the **same allocation pool**:

```typescript
Room: "Standard Double"
├─ Double occupancy (2p) - Rate ID: 1
├─ Single occupancy (1p) - Rate ID: 2
└─ Both use the SAME allocation of 20 rooms!
```

**Before (WRONG):**
```typescript
// Line 427 - We were SUMMING availabilities
roomGroup.totalAvailable += item.available

// If both rates show 20 available:
double (2p): 20 available
single (1p): 20 available
Total shown: 20 + 20 = 40 ❌ WRONG!
```

The booking code was calculating availability **per rate**, but each rate would get the full allocation:
- Double rate: 20 available (from 20 allocation)
- Single rate: 20 available (from SAME 20 allocation)
- System added: 40 total! ❌

---

### **The Fix:**

**1. Calculate availability at ROOM GROUP level** (lines 354-369):

```typescript
// OLD - Calculated per rate
const booked = bookings
  .filter(r => r.rate_id === rate.id)  // ❌ Only this specific rate
  .reduce((sum, r) => sum + r.quantity, 0)

// NEW - Calculate for entire room group
const bookedForRoomGroup = bookings
  .filter(r => {
    const bookedRate = rates.find(rt => rt.id === r.rate_id)
    // ✓ Count ALL bookings for this contract + room group (any occupancy!)
    return bookedRate && 
           bookedRate.contract_id === contract.id && 
           bookedRate.room_group_id === rate.room_group_id
  })
  .reduce((sum, r) => sum + r.quantity, 0)

const available = allocation.quantity - bookedForRoomGroup
```

**Now ALL rates for same room type show the SAME shared availability!**

**2. Don't sum in grouping** (line 430):

```typescript
// OLD
roomGroup.totalAvailable += item.available  // ❌ Summed duplicates

// NEW
roomGroup.totalAvailable = Math.max(roomGroup.totalAvailable, item.available)
// ✓ Takes max (all rates have same value now anyway)
```

---

### **Result:**

**Now correctly shows:**
- Standard Double: **20 available** ✓ (shared across 2p and 1p)
- Standard Twin: **10 available** ✓
- **Total: 30 rooms** ✓

**Matches your contract!**

---

## 🐛 **BUG #2: Pricing Function Mixed Per-Night and Total Values**

### **The Problem:**

The `calculatePriceBreakdown` function was mixing per-night and all-nights values, causing incorrect calculations:

```typescript
// BEFORE (WRONG)
const supplierCommission = baseRate * commissionRate  // ← Per night only!
const netRate = baseRate - supplierCommission         // ← Per night
const totalNetRate = netRate + boardCost              // ← Per night
const subtotal = totalNetRate + resortFee             // ← MIXED! netRate is per night, resortFee is for all nights!
const vat = subtotal * taxRate                        // ← VAT on mixed value!
const totalCost = subtotal + vat + cityTax            // ← Incorrect!
```

**What was happening:**
- Base rate: €337.65 **per night**
- Commission applied: Only to 1 night
- Then added to fees for ALL nights
- Result: Wrong total!

---

### **The Fix:**

**Properly multiply EVERYTHING by nights:**

```typescript
// STEP 1: Calculate per-night values
const commissionPerNight = baseRatePerNight * commissionRate
const netRatePerNight = baseRatePerNight - commissionPerNight

// STEP 2: Multiply by nights FIRST, then combine
const totalBaseRate = baseRatePerNight * nights
const totalBoardCost = boardCostPerNight * nights
const supplierCommission = commissionPerNight * nights
const netRate = netRatePerNight * nights  // ← Now for all nights

const cityTax = cityTaxPerPerson * people * nights  // ← For all nights
const resortFee = resortFeePerNight * nights        // ← For all nights

// Now everything is for ALL nights!
const subtotal = netRate + totalBoardCost + resortFee  // ✓ Consistent
const vat = subtotal * taxRate                          // ✓ Correct
const totalCost = subtotal + vat + cityTax              // ✓ Correct
```

---

### **Example Calculation:**

**Your scenario: 3 nights, double occupancy**
- Base rate: €337.65/night
- City tax: €6.07 (I'll assume this is total per person per night or similar)
- No commission, no resort fee for this example

**Before Fix (WRONG):**
```
Commission: €337.65 × 0 = €0 (per night only!)
Net rate: €337.65 - €0 = €337.65 (per night)
Resort fee: €0 × 3 = €0
Subtotal: €337.65 + €0 = €337.65 (per night, not multiplied!)
VAT: €337.65 × 0 = €0
City tax: €6.07 × 2 × 3 = €36.42
Total: €337.65 + €0 + €36.42 = €374.07
```

**This is WRONG because the base rate wasn't multiplied by 3 nights!**

**After Fix (CORRECT):**
```
Commission per night: €337.65 × 0 = €0
Net rate per night: €337.65 - €0 = €337.65

Total base rate: €337.65 × 3 = €1,012.95  ← Multiplied by nights!
Total board cost: €0 × 3 = €0
Commission for all nights: €0 × 3 = €0
Net rate for all nights: €337.65 × 3 = €1,012.95

City tax: €6.07 × 2 × 3 = €36.42 (assuming €6.07 is per person per night)
Resort fee: €0
Subtotal: €1,012.95 + €0 + €0 = €1,012.95
VAT: €1,012.95 × 0 = €0 (if no VAT)
Total: €1,012.95 + €0 + €36.42 = €1,049.37 ✓
```

**Now matches the expected €349.79/night × 3 = €1,049.37!**

---

## 📊 Summary of Fixes

### **File: `src/lib/pricing.ts`**

**Changed:**
- ✅ Renamed parameter to `baseRatePerNight` (clarity)
- ✅ Renamed parameter to `boardCostPerNight` (clarity)
- ✅ Multiply base rate by nights BEFORE combining with other costs
- ✅ Multiply commission by nights
- ✅ All values now consistently for entire stay

---

### **File: `src/pages/bookings-new.tsx`**

**Changed:**
- ✅ Calculate availability at **room group level** (lines 354-369)
  - Count ALL bookings for room group (all occupancies)
  - All rates show same shared availability
  
- ✅ Use `Math.max` instead of `+=` for totalAvailable (line 430)
  - No longer sums duplicate availabilities
  - Takes the shared pool value

- ✅ Remove `* nights` from cost calculations (lines 88, 127, 437, 479)
  - Already handled in `calculatePriceBreakdown`
  - No double multiplication

---

## ✅ Results

### **Before (WRONG):**

**Availability:**
- Standard Double: 40 available (20 + 20 double-count)
- Total: 60 rooms (contract only has 30!)

**Pricing (3 nights):**
- Cost shown: €374.07 (only €124.69/night - missing base rate multiplication!)
- OR if we had the double-nights bug: €1,049.37 × 3 = €3,148.11 (insane!)

---

### **After (CORRECT):**

**Availability:**
- Standard Double: 20 available ✓
- Standard Twin: 10 available ✓
- Total: 30 rooms ✓ (matches contract!)

**Pricing (3 nights):**
- Base: €337.65 × 3 = €1,012.95
- Taxes: ~€36.42
- **Total: ~€1,049.37** ✓
- Matches: €349.79/night × 3 ✓

---

## 🧪 Testing

Try these scenarios now:

### **Test 1: Availability**
1. Create contract with 30 total rooms
2. Add allocation: Standard Double = 20 rooms
3. Create rates for double (2p) and single (1p)
4. Open booking form
5. **Expected:** Shows "20 available" for Standard Double ✓

### **Test 2: Shared Pool**
1. Book 5 double occupancy rooms
2. Refresh booking form
3. **Expected:** 
   - Double (2p): Shows 15 available
   - Single (1p): Shows 15 available (same pool!)
   - Total for room: 15 ✓

### **Test 3: Pricing**
1. Create rate: €100/night base
2. Add city tax: €2/person/night
3. Book 3 nights, double occupancy
4. **Expected cost:**
   - Base: €100 × 3 = €300
   - City tax: €2 × 2 × 3 = €12
   - Total: €312 ✓

---

## 🎉 Summary

**Fixed Issues:**
1. ✅ Availability no longer double-counts shared rooms
2. ✅ Base rate properly multiplied by nights
3. ✅ All pricing components calculated for entire stay
4. ✅ Consistent "for all nights" calculations
5. ✅ Build passes with no errors

**Your pricing and availability are now ACCURATE!** 🎊

**Files Modified:**
- ✅ `src/lib/pricing.ts` - Fixed calculation logic
- ✅ `src/pages/bookings-new.tsx` - Fixed availability tracking

**Test your bookings now - the prices should be correct!**

