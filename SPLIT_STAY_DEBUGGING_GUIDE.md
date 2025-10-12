# 🔍 **Split-Stay Booking - Debugging Guide**

## 🎯 **How to Test & Debug**

The system now has console logging to help debug split-stay pricing. Here's what to look for:

---

## 🧪 **Test Scenario**

### **Setup Required**:

1. **Create a contract with pool**:
   - Pool ID: `test-dec-2025`
   - Dates: Dec 4-8
   - Rate: £200/night
   - Allocation: 10 rooms

2. **Create shoulder rate with SAME pool**:
   - Pool ID: `test-dec-2025` (MUST MATCH!)
   - Dates: Dec 2-3
   - Rate: £180/night

3. **Verify in Inventory page**:
   - You should see "📦 Allocation Pools (1)"
   - Pool card shows: "test-dec-2025 • 1-2 contracts • 4-8 rates"
   - Rates table shows pool badge for both rates

---

## 🔍 **Console Logs to Check**

### **When you select dates Dec 2-8 in booking page**:

**Log 1: Pool Detection**
```javascript
🔍 Multi-rate pool detected: test-dec-2025 with 2 rates
```
**✅ GOOD**: System found the pool with 2 rates
**❌ BAD**: If you don't see this, rates don't have matching pool IDs

---

**Log 2: Booking Dates**
```javascript
📅 Booking dates: 2025-12-02 to 2025-12-08
```
**✅ GOOD**: Dates are correct

---

**Log 3: Pool Rates**
```javascript
🎫 Pool rates: [
  { id: 15, dates: "2025-12-02 to 2025-12-03", price: 180 },
  { id: 12, dates: "2025-12-04 to 2025-12-08", price: 200 }
]
```
**✅ GOOD**: Both rates have proper validity dates
**❌ BAD**: If dates are "N/A to N/A", rates don't have valid_from/valid_to set

---

**Log 4: Split-Stay Calculation**
```javascript
💰 Split-stay calculation result: {
  isFullyCovered: true,
  gaps: [],
  breakdown: [
    {
      rate: {...},
      dateStart: "2025-12-02",
      dateEnd: "2025-12-03",
      nights: 2,
      pricePerNight: 180,
      subtotal: 360
    },
    {
      rate: {...},
      dateStart: "2025-12-04",
      dateEnd: "2025-12-07",
      nights: 4,
      pricePerNight: 200,
      subtotal: 800
    }
  ],
  totalNights: 6,
  totalPrice: 1160
}
```
**✅ GOOD**: 
- `isFullyCovered: true` (all nights covered)
- `gaps: []` (no missing dates)
- `breakdown` has 2 entries (2 rate periods)
- `totalPrice: 1160` (360 + 800)

**❌ BAD**:
- `isFullyCovered: false` → Gap in coverage
- `gaps: [...]` → Missing dates
- `breakdown: []` → No rates matched
- `totalPrice: 0` → Calculation failed

---

**Log 5: Multi-Rate Option Creation**
```javascript
✅ Creating multi-rate option: {
  costPerRoom: 1160,
  sellPerRoom: 1856,
  breakdown: [...]
}
```
**✅ GOOD**: Multi-rate option being created
**❌ BAD**: If you see this instead:
```javascript
⚠️ Split-stay not fully covered or no breakdown: {
  isFullyCovered: false,
  breakdownLength: 0,
  gaps: [...]
}
```

---

## 🐛 **Common Issues & Fixes**

### **Issue 1: "No multi-rate option shown"**

**Check**:
- [ ] Do both rates have the SAME `allocation_pool_id`?
- [ ] Are both rates active?
- [ ] Do dates overlap with booking period?
- [ ] Are both rates for the same occupancy?
- [ ] Are both rates for the same board type?

**Console Check**:
```
Look for: "🔍 Multi-rate pool detected"
- If missing: Rates don't share pool ID
- If shows 1 rate: Only one rate has pool ID
```

---

### **Issue 2: "Price is wrong"**

**Check**:
- [ ] Are `valid_from` and `valid_to` set on both rates?
- [ ] Are the base rates correct (£180 and £200)?
- [ ] Is board cost included?

**Console Check**:
```
Look at: "💰 Split-stay calculation result"
- Check breakdown array
- Verify nights count per period
- Verify pricePerNight
- Verify subtotals
```

---

### **Issue 3: "isFullyCovered: false"**

**Possible Causes**:
1. **Gap in dates**: Dec 2-3 and Dec 5-8 (missing Dec 4!)
2. **Wrong date format**: Dates not ISO format
3. **Timezone issues**: Date comparison off by 1 day

**Console Check**:
```
Look at: "gaps" array
- If not empty: Shows which dates are missing
- Example: [{ start: "2025-12-04", end: "2025-12-04" }]
```

**Fix**: Create rate for missing dates or adjust validity periods

---

### **Issue 4: "Rates not showing at all"**

**Check**:
- [ ] Did you select a tour?
- [ ] Are rates linked to that tour (or generic)?
- [ ] Are rates active?
- [ ] Do rate dates overlap with check-in/check-out?

**Console Check**:
```
Check browser console for:
"🔍 Multi-rate pool detected"

If missing:
- Rates filtered out before pool detection
- Check tour linking
- Check active status
```

---

## 🎯 **Expected Behavior Per Scenario**

### **Scenario A: Perfect Setup**
```
Rates:
- Dec 2-3: £180, Pool: test-pool
- Dec 4-8: £200, Pool: test-pool

Booking: Dec 2-8

Expected Console Logs:
✅ Multi-rate pool detected: test-pool with 2 rates
✅ isFullyCovered: true
✅ gaps: []
✅ breakdown: [2 entries]
✅ totalPrice: 1160 (2×180 + 4×200)
✅ Creating multi-rate option

Expected UI:
✅ Dropdown shows: "🔗 Multi-Rate (Pool: test-pool) (2 rates)"
✅ Price shows: £1,856 (1160 × 1.6 markup)
✅ Label shows: "🔗 Multi-rate (2 periods)"
```

---

### **Scenario B: Gap in Coverage**
```
Rates:
- Dec 2-3: £180, Pool: test-pool
- Dec 6-8: £200, Pool: test-pool (missing Dec 4-5!)

Booking: Dec 2-8

Expected Console Logs:
✅ Multi-rate pool detected: test-pool with 2 rates
❌ isFullyCovered: false
❌ gaps: [{ start: "2025-12-04", end: "2025-12-05" }]
⚠️ Split-stay not fully covered

Expected UI:
❌ No multi-rate option shown
✅ Individual rates shown separately
```

---

### **Scenario C: Different Pool IDs**
```
Rates:
- Dec 2-3: £180, Pool: "pool-a"
- Dec 4-8: £200, Pool: "pool-b" (DIFFERENT!)

Booking: Dec 2-8

Expected Console Logs:
❌ No "Multi-rate pool detected" log
(System sees them as separate pools)

Expected UI:
❌ No multi-rate option
✅ Two separate contract options shown
```

---

### **Scenario D: No Pool IDs**
```
Rates:
- Dec 2-3: £180, Pool: undefined
- Dec 4-8: £200, Pool: undefined

Booking: Dec 2-8

Expected Console Logs:
❌ No "Multi-rate pool detected" log
(Rates without pools can't be combined)

Expected UI:
❌ No multi-rate option
✅ Rates shown individually (if they fit)
```

---

## 🔧 **Troubleshooting Steps**

### **Step 1: Verify Pool Setup**
```
1. Go to Inventory → Hotels
2. Expand your tour/generic section
3. Look for "📦 Allocation Pools"
4. Verify:
   - Pool card exists
   - Shows correct number of contracts and rates
   - Pool ID is what you expect
```

### **Step 2: Check Rate Validity Dates**
```
1. In Inventory → Hotels
2. Find the "All Rates" table
3. Look at your rates
4. Verify:
   - Pool column shows SAME pool ID for both rates
   - Dates are set (not blank)
   - Dates don't have gaps
```

### **Step 3: Test in Booking Page**
```
1. Bookings → Create Booking
2. Select tour
3. Set check-in/check-out to span both periods
4. Open browser console (F12)
5. Look for console logs starting with:
   🔍, 📅, 🎫, 💰, ✅, or ⚠️
```

### **Step 4: Verify Multi-Rate Option**
```
1. Find your hotel in booking list
2. Look at Contract dropdown
3. Expected to see:
   "⭐ 🔗 Multi-Rate (Pool: ...) (2 rates)"
   
If not there:
- Check console logs
- Verify pool IDs match
- Check date coverage
```

---

## 📊 **Quick Checklist**

Before reporting an issue, verify:

- [ ] Both rates have allocation_pool_id set
- [ ] Both rates have the SAME allocation_pool_id
- [ ] Both rates have valid_from and valid_to dates set
- [ ] Dates cover the entire booking period (no gaps)
- [ ] Both rates are active
- [ ] Both rates are for same occupancy type
- [ ] Both rates are for same board type
- [ ] Rates are linked to selected tour (or generic)
- [ ] Browser console shows pool detection logs

---

## 🎉 **Success Indicators**

**You'll know it's working when**:

✅ Console shows: "✅ Creating multi-rate option"
✅ Dropdown shows: "🔗 Multi-Rate" option with star
✅ Price shows correct total (sum of all periods)
✅ Price label shows: "🔗 Multi-rate (X periods)"

---

**Use the console logs to diagnose exactly where the issue is, then we can fix it!** 🔍

