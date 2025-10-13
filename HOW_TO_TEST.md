# 🧪 How to Test Your Unified Inventory System

## ✅ Test Component Added!

The test component is now live at the bottom of your **Hotel Inventory** page.

---

## 🚀 Step-by-Step Testing Guide

### **Step 1: Open Your App**

If your dev server isn't running:
```bash
npm run dev
```

### **Step 2: Navigate to Hotel Inventory**

Go to: **http://localhost:5173/inventory-setup**

Or click "Hotel Inventory" in your navigation menu.

### **Step 3: Scroll to Bottom**

You'll see a new section with:
```
🧪 Unified Inventory System Tests
```

It shows:
- **Inventory Items** count (blue card)
- **Contracts** count (green card)
- **Rates** count (purple card)

### **Step 4: Run Tests**

Click the big button:
```
▶️ Run All Tests
```

### **Step 5: Watch the Magic! ✨**

The test will:
1. ✅ Create **F1 Grand Prix Tickets** inventory
2. ✅ Create **Airport Transfers** inventory
3. ✅ Create **Ticket Contract** with allocation pools
4. ✅ Create **Ticket Rate** with auto-calculated price
5. ✅ Create **Buy-to-Order Transfer Rate**

You'll see results like:
```
✅ Test 1: Creating ticket inventory...
✅ Created ticket item: Abu Dhabi F1 Grand Prix Tickets (ID: 1)
✅ Test 2: Creating transfer inventory...
✅ Created transfer item: Airport Transfers (ID: 2)
✅ Test 3: Creating contract for tickets...
✅ Created contract: F1 Tickets Block 2025 (ID: 1)
✅ Test 4: Creating rate for tickets...
✅ Created rate: Main Grandstand @ AED 1200 → AED 1680
✅ Test 5: Creating buy-to-order transfer rate...
✅ Created buy-to-order transfer: Private Sedan @ AED 150 → AED 225
🎉 All tests passed!
📊 Summary: 2 items, 1 contracts, 2 rates
```

### **Step 6: View Created Data**

Scroll down in the test component to see:
- **Items:** What inventory was created
- **Contracts:** What contracts were created
- **Rates:** What rates were created with prices

---

## 🔍 What to Look For

### **✅ Success Indicators:**

1. **Stats Update**
   - Inventory Items: 2
   - Contracts: 1
   - Rates: 2

2. **Test Results Show Green Checkmarks**
   - All lines start with ✅
   - No ❌ errors

3. **Data Persists After Refresh**
   - Refresh the page (F5)
   - Numbers stay the same!
   - Data is saved in localStorage

4. **Selling Prices Calculated**
   - Ticket: AED 1200 → AED 1680 (40% markup)
   - Transfer: AED 150 → AED 225 (50% markup)

5. **Console Logs (F12)**
   ```
   ✅ Created ticket inventory item: Abu Dhabi F1 Grand Prix Tickets
   ✅ Created ticket contract: F1 Tickets Block 2025
   ✅ Created ticket rate for Main Grandstand @ AED 1200
   ```

---

## 🧹 Cleaning Up Test Data

After testing, click:
```
🗑️ Clear Test Data
```

This removes all unified inventory test data and refreshes the page.

**Note:** This only clears unified inventory data, not your existing hotels/contracts!

---

## 🎯 What You Just Tested

### **1. Multi-Type Inventory**
Created 2 different inventory types in one system:
- 🎫 Tickets (events)
- 🚗 Transfers (transportation)

### **2. Contracts with Allocation Pools**
Created a contract with:
- 100 tickets allocated
- Pool ID: `f1-main-pool`
- Shareable across multiple rates

### **3. Contract-Based Rates**
Ticket rate:
- Linked to contract
- Uses allocation pool
- Auto-calculated selling price

### **4. Buy-to-Order Rates**
Transfer rate:
- No contract needed
- Estimated costs
- Still auto-calculates price

### **5. Persistence**
All data saved to localStorage:
- `tours-inventory-unified-items`
- `tours-inventory-unified-contracts`
- `tours-inventory-unified-rates`

---

## 🎨 Try Creating Your Own!

### **Example: Activity Tour**

Open browser console (F12) and try:

```javascript
// Get the hooks (if using React DevTools)
// Or create in a component:
const { addInventoryItem, addUnifiedRate } = useData()

// Create city tour
const tour = addInventoryItem({
  item_type: 'activity',
  name: 'Abu Dhabi City Tour',
  location: 'Abu Dhabi',
  description: 'Guided city tour',
  metadata: {
    activity_type: 'tour',
    duration: '4 hours',
    difficulty: 'easy'
  },
  categories: [{
    id: 'half-day',
    item_id: 0,
    category_name: 'Half-Day City Tour',
    description: 'Sheikh Zayed Mosque, Heritage Village',
    capacity_info: { recommended_group_size: 15 },
    pricing_behavior: { 
      pricing_mode: 'per_person',
      supports_volume_discounts: true
    }
  }],
  active: true
})

// Create rate with volume discount
const tourRate = addUnifiedRate({
  item_id: tour.id,
  category_id: 'half-day',
  base_rate: 80,
  markup_percentage: 0.60,
  currency: 'AED',
  inventory_type: 'buy_to_order',
  rate_details: {
    pricing_unit: 'per_person',
    volume_tiers: [
      { min_quantity: 1, max_quantity: 9, rate: 80 },
      { min_quantity: 10, max_quantity: 19, rate: 70 },
      { min_quantity: 20, rate: 60 }
    ]
  },
  valid_from: '2025-09-01',
  valid_to: '2026-04-30',
  active: true
})

console.log('Created tour:', tour)
console.log('Created rate:', tourRate)
```

---

## 📊 Where Is the Data?

### **Browser DevTools (F12)**

**1. Application Tab → Local Storage:**
```
tours-inventory-unified-items      ← All inventory items
tours-inventory-unified-contracts  ← All contracts
tours-inventory-unified-rates      ← All rates
```

**2. Console Tab:**
See all creation/update/delete logs

**3. React DevTools → Components → DataProvider:**
View live state:
- `inventoryItems`
- `unifiedContracts`
- `unifiedRates`

---

## ❓ Troubleshooting

### **Q: Test component doesn't show**
**A:** Check:
1. You're on `/inventory-setup` page
2. Scroll all the way to bottom
3. Component is after all the hotel inventory sections

### **Q: Tests fail with errors**
**A:** Check console (F12) for error details. Common issues:
- No suppliers exist (create one first)
- Browser doesn't support localStorage
- TypeScript compilation errors

### **Q: Data doesn't persist**
**A:** 
1. Check browser localStorage isn't disabled
2. Try incognito mode to test fresh
3. Check console for storage errors

### **Q: Can't see created items in main inventory**
**A:** 
That's expected! Unified inventory is separate from the old hotel system (for now). In Phase 3, we'll build the UI to view/edit this data.

For now, you can view it in:
- Test component's "Current Unified Inventory" section
- Browser localStorage
- React DevTools

---

## ✅ Success Checklist

After running tests, you should have:

- [x] 2 inventory items created (ticket + transfer)
- [x] 1 contract created (tickets)
- [x] 2 rates created (ticket + transfer)
- [x] Auto-calculated selling prices
- [x] Data persists after refresh
- [x] No console errors
- [x] Test results show all ✅ green checkmarks

---

## 🎉 Next Steps

### **You've Proven:**
✅ Unified inventory data layer works!  
✅ Can create any inventory type  
✅ Contracts work for all types  
✅ Rates auto-calculate prices  
✅ Allocation pools work  
✅ Buy-to-order works  
✅ Data persists  

### **Ready for Phase 3?**
Build the UI so users can:
- Create inventory items visually
- Create contracts with a form
- Create rates with a form
- View everything in a beautiful interface

---

## 🚀 You're Ready!

The test proves your unified inventory system is **working perfectly**!

Want to build the UI next? Just ask! 🎨


