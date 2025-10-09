# ✅ Buy-to-Order Rates & Validity Dates - Implementation

## 🎯 What You Requested

1. **Validity dates on rates** - Check-in/out dates filled from contract
2. **Buy-to-order rates** - Show only if room type has no inventory

---

## ✅ Feature 1: Rate Validity Dates

### **Purpose:**
Allow rates to have their own validity period within a contract, useful for:
- 🌞 **Seasonal pricing** (summer vs winter rates)
- 🎉 **Event pricing** (conferences, holidays)
- 📅 **Early bird / last-minute** periods
- 🎁 **Special promotions** for specific dates

---

### **How It Works:**

#### **1. Added to Rate Form (Inventory Setup)**

**Location:** When creating/editing rates in inventory setup

**Fields Added:**
```tsx
┌─────────────────────────────────────┐
│ 📅 Valid From    │ 📅 Valid To      │
│ [Sep 4, 2026]    │ [Sep 7, 2026]    │
│ Contract: Sep 4  │ Contract: Sep 7  │
└─────────────────────────────────────┘

This rate will only be available for bookings 
within these dates. Defaults to contract period.
```

**Features:**
- ✅ Defaults to contract start/end dates
- ✅ Shows contract dates below for reference
- ✅ Min date validation (`valid_to` must be >= `valid_from`)
- ✅ Optional (empty = uses contract dates)

---

#### **2. Stored in Rate Object**

```typescript
interface Rate {
  ...
  valid_from?: string  // e.g., "2026-09-04"
  valid_to?: string    // e.g., "2026-09-07"
  ...
}
```

---

#### **3. Used in Booking Availability Check**

**Before (Wrong):**
```typescript
// Always used contract dates
const contractStart = new Date(contract.start_date)
const contractEnd = new Date(contract.end_date)

if (contractStart > end || contractEnd < start) return null
```

**After (Correct):**
```typescript
// Use rate dates if specified, otherwise fall back to contract
const rateStart = rate.valid_from 
  ? new Date(rate.valid_from) 
  : new Date(contract.start_date)
  
const rateEnd = rate.valid_to 
  ? new Date(rate.valid_to) 
  : new Date(contract.end_date)

// Only show if booking falls within rate's validity
if (rateStart > end || rateEnd < start) return null
```

---

### **Example Use Cases:**

#### **Scenario 1: Summer vs Winter Rates**

**Contract:**
- Period: Jan 1, 2026 - Dec 31, 2026 (full year)
- Base rate: €100/night

**Rates Created:**
- **Winter Rate** (double, B&B)
  - Valid: Jan 1 - Apr 30
  - Rate: €80/night
  
- **Summer Rate** (double, B&B)
  - Valid: May 1 - Sep 30
  - Rate: €150/night
  
- **Autumn Rate** (double, B&B)
  - Valid: Oct 1 - Dec 31
  - Rate: €90/night

**Result:**
- Booking for July 15 → Only sees Summer Rate (€150)
- Booking for Feb 20 → Only sees Winter Rate (€80)
- Booking crossing seasons → Sees both! ✓

---

#### **Scenario 2: Conference Event**

**Contract:**
- Period: Jan 1 - Dec 31, 2026

**Rates:**
- **Standard Rate** (double, B&B)
  - Valid: (empty - defaults to contract)
  - Rate: €100/night
  
- **Conference Rate** (double, B&B)
  - Valid: Sep 15 - Sep 20 (conference week)
  - Rate: €250/night

**Result:**
- Booking for Sep 17 → Sees both rates, can choose
- Booking for Oct 5 → Only sees Standard Rate

---

## ✅ Feature 2: Buy-to-Order Rates (Fallback)

### **Logic:**

```
For each room type:
  1. Check if inventory exists → Show inventory rates ✓
  2. If NO inventory → Show buy-to-order rates ✓
  3. Never show both (inventory takes priority)
```

---

### **How It Works:**

#### **Step 1: Collect Inventory Rates**
```typescript
// Get all contract-based rates with allocations
const inventoryRates = rates
  .filter(rate => has contract AND has allocation)
  .map(rate => ({ ...rate, isBuyToOrder: false }))
```

#### **Step 2: Track Which Room Types Have Inventory**
```typescript
// Create a set of room types WITH inventory
const roomTypesWithInventory = new Set()
inventoryRates.forEach(item => {
  const key = `${hotelId}-${roomGroupId}`
  roomTypesWithInventory.add(key)
})
```

#### **Step 3: Add Buy-to-Order for Missing Types**
```typescript
// Get buy-to-order rates (hotel_id, no contract_id)
const buyToOrderRates = rates
  .filter(rate => rate.hotel_id && !rate.contract_id)
  .filter(rate => {
    const key = `${hotelId}-${roomGroupId}`
    // ONLY if this room type has NO inventory!
    return !roomTypesWithInventory.has(key)
  })
  .map(rate => ({ ...rate, isBuyToOrder: true, available: 999 }))
```

#### **Step 4: Combine**
```typescript
return [...inventoryRates, ...buyToOrderRates]
```

---

### **Visual Indicators:**

#### **In Contract Selection:**
```
┌──────────────────────────────────────┐
│ ✓ Summer Contract [Best]             │
│   €450  60%  20 avail                │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│   Buy-to-Order [Buy-to-Order]        │ ← Orange badge
│   €500  60%  999 avail (flexible)    │
└──────────────────────────────────────┘
```

#### **In Cart:**
```
┌──────────────────────────────────────┐
│ Standard Double Room                  │ ← Orange background
│ NH Collection City Life               │
│ [B&B] [double] [Buy-to-Order]        │ ← Orange badge
│ [Qty: 2]                     €1,197  │
└──────────────────────────────────────┘
```

**Styling:**
- 🟠 **Orange border** on cart item
- 🟠 **Orange background** (light)
- 🟠 **Orange "Buy-to-Order" badge**
- 📝 **Toast notification** warns about ops team confirmation

---

### **Booking Creation:**

When booking contains buy-to-order:
```typescript
{
  purchase_type: 'buy_to_order',
  purchase_status: 'pending_purchase',  // ← Requires ops action
  ...
}
```

**Toast message:**
```
✓ Added 2× Standard Double (double) to cart - Buy-to-Order
  This will require purchase confirmation from operations team
```

---

## 📊 Priority Logic

### **Example: Same Room Type**

**Setup:**
- Hotel: Hilton Budapest
- Room: Standard Double

**Rates:**
- Contract A: 20 available (inventory)
- Buy-to-Order: Flexible capacity

**Result:**
```
Booking form shows:
  ✓ Contract A: 20 available
  ✗ Buy-to-Order: HIDDEN (inventory exists!)
```

**When inventory runs out:**
```
Booking form shows:
  ✓ Buy-to-Order: 999 available  ← Now visible!
```

---

## 🎨 Visual Design

### **Buy-to-Order Badge:**
```tsx
<Badge 
  variant="outline" 
  className="border-orange-500 text-orange-600"
>
  Buy-to-Order
</Badge>
```

### **Cart Item (Buy-to-Order):**
```tsx
<div className="bg-orange-50/50 border-orange-200">
  {/* Orange-tinted background */}
</div>
```

---

## 🔧 Technical Implementation

### **Files Modified:**

1. **`src/pages/inventory-setup.tsx`**
   - ✅ Added `valid_from` and `valid_to` to rate form state
   - ✅ Added date input fields in rate dialog
   - ✅ Auto-fill from contract dates
   - ✅ Save dates to rate object

2. **`src/pages/bookings-create.tsx`**
   - ✅ Check rate validity dates when filtering
   - ✅ Include buy-to-order rates as fallback
   - ✅ Mock contract for buy-to-order pricing
   - ✅ Visual indicators (badges, colors)
   - ✅ Proper purchase_type and purchase_status

3. **`src/pages/bookings-new.tsx`**
   - ✅ Same validity date check logic

4. **`src/contexts/data-context.tsx`**
   - ✅ Already had `valid_from` and `valid_to` fields!

---

## 📋 Complete Flow

### **Creating a Rate:**

1. Select contract
2. Click "+ Add Rate"
3. **Validity dates auto-fill from contract**
4. Adjust dates if needed (e.g., seasonal pricing)
5. Set occupancy, board type, base rate
6. Save → Rate only valid for specified period

---

### **Booking with Validity:**

1. Select tour & dates (e.g., July 15-20)
2. Browse rooms
3. **Only see rates valid for those dates**
4. If rate valid Jun 1 - Jun 30 → HIDDEN
5. If rate valid Jul 1 - Aug 31 → VISIBLE ✓

---

### **Buy-to-Order Fallback:**

**If no inventory:**
```
1. Check: Standard Double has inventory? NO
2. Show: Buy-to-Order rates for Standard Double
3. Badge: Orange "Buy-to-Order" visible
4. Add to cart: Orange background in cart
5. Create booking: purchase_status = 'pending_purchase'
6. Operations team: Receives notification to purchase
```

---

## 🧪 Testing Scenarios

### **Test 1: Validity Dates**

**Setup:**
- Contract: Sep 1 - Sep 30
- Rate A: Sep 1 - Sep 15 (€100)
- Rate B: Sep 16 - Sep 30 (€150)

**Test:**
- Book Sep 5-8 → See only Rate A ✓
- Book Sep 18-20 → See only Rate B ✓
- Book Sep 13-17 → See BOTH rates ✓

---

### **Test 2: Buy-to-Order Fallback**

**Setup:**
- Standard Double: 20 inventory (Contract A)
- Deluxe Suite: NO inventory, only buy-to-order

**Test:**
- Browse rooms → Standard Double shows Contract A
- Browse rooms → Deluxe Suite shows Buy-to-Order ✓
- Book all 20 Standard Doubles
- Browse again → Standard Double NOW shows Buy-to-Order ✓

---

### **Test 3: Visual Indicators**

**Test:**
- Add buy-to-order to cart
- Check cart item has orange background ✓
- Check "Buy-to-Order" badge visible ✓
- Check toast mentions ops team ✓

---

## ✨ Summary

**Added Features:**
1. ✅ **Validity dates** on rates (valid_from, valid_to)
2. ✅ **Auto-fill** from contract dates
3. ✅ **Date-based filtering** in bookings
4. ✅ **Buy-to-order fallback** when no inventory
5. ✅ **Visual indicators** (orange badges, backgrounds)
6. ✅ **Proper purchase tracking** (pending_purchase status)

**Benefits:**
- 🎯 Flexible pricing by date range
- 📦 Inventory first, buy-to-order fallback
- 👁️ Clear visual distinction
- ✅ Operations team knows what needs purchasing

**Your booking system now supports seasonal pricing and buy-to-order fallback!** 🎉

