# Testing Guide - Grouped Contract Selection

## 🧪 How to Test the New Feature

### Prerequisites
1. Have at least one tour created
2. Have at least one hotel with room groups
3. Have multiple contracts for the same hotel
4. Have rates created for those contracts with the same room type

---

## 📋 Test Scenarios

### Scenario 1: Basic Grouping Test

**Setup:**
1. Create 3 contracts for the same hotel (e.g., "Hilton Budapest")
   - Contract A: Summer 2024 (base rate: €90)
   - Contract B: Premium (base rate: €120)
   - Contract C: Flex Deal (base rate: €100)

2. Create rates for "Standard Double" room in all 3 contracts
   - All with board type "Bed & Breakfast"
   - All with occupancy "double"

3. Set up inventory allocations:
   - Contract A: 5 rooms
   - Contract B: 3 rooms
   - Contract C: 10 rooms

**Expected Result:**
✅ Should see ONE card titled "Hilton Budapest - Standard Double Room"
✅ Should show "18 total available across 3 contracts"
✅ Should list all 3 contracts inside the card
✅ Contract A should be selected by default (if it has best margin)

---

### Scenario 2: Contract Comparison Test

**What to Check:**

Each contract option should display:
- ✅ Contract name (e.g., "Summer 2024")
- ✅ Cost per room (calculated for 5 nights)
- ✅ Sell price per room (cost × 1.6)
- ✅ Margin (sell - cost)
- ✅ Margin percentage
- ✅ Available quantity
- ✅ Board type badge
- ✅ Commission rate (if > 0)

**Badges to verify:**
- ⭐ "Best Margin" on the contract with highest profit
- 💰 "Lowest Cost" on the cheapest contract (if different from best margin)

---

### Scenario 3: Selection & Pricing Test

**Steps:**
1. Open booking dialog
2. Select a tour
3. Choose dates (e.g., 5 nights)
4. Navigate to "Shop" step
5. Find a grouped room card
6. Click on different contract options

**Expected Behavior:**
✅ Clicking a contract highlights it (blue border, checkmark)
✅ Price summary updates immediately
✅ Shows selected contract name in summary
✅ Cost, Sell, and Margin all update

**Try changing:**
- Occupancy (single → double → triple)
  - ✅ Prices should recalculate
  - ✅ Margin should update
  
- Quantity (1 → 2 → 3)
  - ✅ Total price should multiply
  - ✅ Margin should multiply
  - ✅ Can't exceed available quantity

---

### Scenario 4: Add to Cart Test

**Steps:**
1. Select a contract (e.g., Contract A)
2. Set occupancy (e.g., double)
3. Set quantity (e.g., 2)
4. Click "Add to Cart"

**Expected:**
✅ Item added to cart
✅ Toast notification shows
✅ Cart counter updates
✅ Can view cart in Step 3

**In Cart, verify:**
✅ Room name correct
✅ Hotel name correct
✅ Occupancy shown (e.g., "double")
✅ Quantity correct
✅ Price matches what was shown
✅ Contract name stored (check in booking details)

---

### Scenario 5: Multiple Room Types Test

**Setup:**
Create rates for different room types:
- Standard Double
- Deluxe Double
- Suite

**Expected:**
✅ Each room type gets its own grouped card
✅ Cards sorted by hotel name, then room name
✅ No mixing of different room types
✅ Grouping only applies to identical rooms

---

### Scenario 6: Single Contract Test

**Setup:**
- Create a room type that only has 1 contract

**Expected:**
✅ Still shows grouped card (consistent UI)
✅ Only one contract option listed
✅ Still shows availability, pricing, etc.
✅ No "Best Margin" badge (only one option)

---

### Scenario 7: Filtering Test

**Steps:**
1. Apply occupancy filter (e.g., "Double only")
2. Apply board type filter (e.g., "B&B only")

**Expected:**
✅ Only matching rates shown
✅ Grouping still works
✅ Total availability reflects filtered results
✅ Filters apply across all contracts

---

### Scenario 8: Commission Display Test

**Setup:**
- Set supplier_commission_rate on contracts:
  - Contract A: 15% (0.15)
  - Contract B: 0%
  - Contract C: 20% (0.20)

**Expected:**
✅ Contract A shows "💵 15% commission"
✅ Contract B shows no commission badge
✅ Contract C shows "💵 20% commission"
✅ Commission shown in green

---

### Scenario 9: Complete Booking Flow Test

**Full End-to-End:**

1. **Tour Selection**
   - ✅ Select tour
   - ✅ Choose dates
   - ✅ Nights calculated correctly

2. **Shopping**
   - ✅ See grouped rooms
   - ✅ Compare contracts
   - ✅ Select best margin contract
   - ✅ Set occupancy & quantity
   - ✅ Add to cart (2-3 different room types)

3. **Cart Review**
   - ✅ All items shown
   - ✅ Correct prices
   - ✅ Can adjust quantities
   - ✅ Can remove items
   - ✅ Total calculated correctly

4. **Checkout**
   - ✅ Enter customer details
   - ✅ Review summary
   - ✅ Confirm booking
   - ✅ Booking created successfully

5. **Verify Booking**
   - ✅ Appears in bookings table
   - ✅ View booking details
   - ✅ Shows correct rooms
   - ✅ Shows correct contracts
   - ✅ Shows correct prices
   - ✅ Inventory deducted

---

## 🐛 Common Issues & Solutions

### Issue 1: Contracts not grouping
**Symptom:** Multiple cards for same room type

**Check:**
- Room group IDs match exactly
- Hotel IDs match exactly
- Both hotel and room must be identical to group

**Solution:**
- Verify rates have same `room_group_id`
- Verify contracts have same `hotel_id`

---

### Issue 2: Prices seem wrong
**Symptom:** Cost/Sell/Margin don't match expectations

**Check:**
- Board costs added correctly?
- Number of nights correct?
- Occupancy affects city tax (per person)
- Resort fees added?
- Commission deducted?

**Solution:**
- Check contract tax settings
- Verify board options are configured
- Check rate has correct board_type

---

### Issue 3: "Best Margin" on wrong contract
**Symptom:** Badge on contract with lower margin

**Check:**
- Calculation is: (Sell - Cost)
- Not margin percentage
- Based on double occupancy for comparison

**Solution:**
- Verify it's comparing absolute margin (€), not %
- Check calculations with different occupancies

---

### Issue 4: Quantity limited incorrectly
**Symptom:** Can't book more rooms than one contract

**Check:**
- Quantity is limited to SELECTED contract
- Not total availability

**Expected:**
- If Contract A selected (5 available), max qty = 5
- If Contract C selected (10 available), max qty = 10
- This is correct behavior - you can't book more than one contract provides

---

### Issue 5: Commission not showing
**Symptom:** No commission badge visible

**Check:**
- supplier_commission_rate > 0 on contract?
- Value is decimal (0.15 for 15%)

**Solution:**
- Set commission on contract
- Value between 0 and 1 (e.g., 0.20 for 20%)

---

## ✅ Acceptance Criteria

The feature is working correctly if:

1. ✅ Multiple contracts for same room type are grouped
2. ✅ All contracts visible within the group
3. ✅ Margins calculated and displayed correctly
4. ✅ Best margin contract highlighted
5. ✅ Contract selection changes pricing
6. ✅ Can add to cart with selected contract
7. ✅ Cart shows correct contract info
8. ✅ Booking creates with correct contract reference
9. ✅ Inventory deducted from correct contract
10. ✅ UI is clean and professional
11. ✅ No duplicate room cards
12. ✅ Total availability shown accurately

---

## 📸 Visual Checklist

When viewing a grouped rate card, you should see:

```
Header Section:
  ✅ Hotel name - Room name
  ✅ Total availability count
  ✅ Number of contracts

Contract Options:
  ✅ Each contract in a selectable box
  ✅ Selected contract has blue border + checkmark
  ✅ Cost, Sell, Margin displayed
  ✅ Badges (Best Margin, Lowest Cost)
  ✅ Availability per contract
  ✅ Board type icon/text
  ✅ Commission if applicable

Controls:
  ✅ Occupancy dropdown
  ✅ Quantity input (limited to selected contract)

Summary:
  ✅ Quantity × nights × occupancy
  ✅ Selected contract name
  ✅ Total sell price (large, primary color)
  ✅ Total cost (smaller, muted)
  ✅ Total margin (green)

Button:
  ✅ "Add to Cart" button
  ✅ Shopping cart icon
```

---

## 🎯 Performance Test

**With many contracts:**
- Create 10+ contracts for same room type
- Expected: Still groups into one card
- Check: Scrollable contract list (max-height: 264px)
- Performance: Should render smoothly

---

## 📊 Data Validation Test

**After booking, verify database:**

```javascript
// Booking should have:
{
  rooms: [
    {
      rate_id: 123,              // ✅ Specific rate ID
      contract_id: 456,          // ✅ Optional but useful
      contractName: "Summer 2024", // ✅ For display
      quantity: 2,               // ✅ Correct quantity
      occupancy_type: "double",  // ✅ Correct occupancy
      price_per_room: 720,       // ✅ Sell price (not cost!)
      total_price: 1440          // ✅ price_per_room × quantity
    }
  ],
  total_price: 1440              // ✅ Sum of all room totals
}
```

---

## 🎓 Training Notes for Sales Team

**What changed:**
1. Same rooms now grouped together
2. Can see all contract options
3. Margins displayed automatically
4. Choose which contract to use

**How to use:**
1. Find room type you need
2. Compare the contracts shown
3. Look for ⭐ Best Margin badge
4. Consider availability too
5. Select the contract you want
6. Set occupancy and quantity
7. Add to cart

**Pro tips:**
- ⭐ badge = highest profit
- 💰 badge = lowest cost (better if client is price-sensitive)
- Green commission = extra savings on that contract
- Total availability shown at top

**When to pick which:**
- Best margin → Standard bookings
- Lowest cost → Price-sensitive clients
- Specific contract → Strategic reasons (hit minimums, better terms, VIP clients)

---

## ✨ Success!

If all tests pass, you now have a professional sales tool that:
- Groups duplicate rooms intelligently
- Shows all contract options clearly
- Calculates margins automatically
- Helps sales team make informed decisions
- Provides full transparency
- Maintains clean, organized UI

**Ready for your sales team to use! 🎉**

