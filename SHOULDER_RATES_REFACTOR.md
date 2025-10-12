# Shoulder Rates Refactor - Separate Rate Approach

## ✅ **Complete! Shoulder Nights Now Separate Rates**

Shoulder nights are no longer stored as arrays in rates. They are now **independent Rate entities** with proper validity periods, making them enterprise-grade and scalable.

---

## 🎯 **The Change**

### **Before (Array-Based - Deprecated):**
```typescript
Rate {
  rate: 300,
  pre_shoulder_rates: [250, 220, 200],   // Day -1, -2, -3
  post_shoulder_rates: [250, 220, 200],  // Day +1, +2, +3
  markup_percentage: 0.60,
  shoulder_markup_percentage: 0.30
}
```

**Problems:**
- ❌ Limited flexibility
- ❌ Hard to manage array indices
- ❌ Can't have different board types for shoulders
- ❌ Complex booking logic
- ❌ No separate availability tracking

### **After (Separate Rates - NEW):**
```typescript
// Main contract rate
Rate {
  id: 1,
  contract_id: 1,
  room_group_id: "deluxe",
  valid_from: "2025-12-04",
  valid_to: "2025-12-08",
  rate: 300,
  is_shoulder: false,          // ✅ NEW
  shoulder_type: "none",       // ✅ NEW
  markup_percentage: 0.60
}

// Pre-shoulder rate (separate entity)
Rate {
  id: 2,
  contract_id: 1,
  room_group_id: "deluxe",
  valid_from: "2025-12-01",    // 3 days before
  valid_to: "2025-12-03",
  rate: 250,
  is_shoulder: true,           // ✅ NEW
  shoulder_type: "pre",        // ✅ NEW
  linked_main_rate_id: 1,      // ✅ Optional link
  markup_percentage: 0.30      // Lower markup
}

// Post-shoulder rate (separate entity)
Rate {
  id: 3,
  contract_id: 1,
  room_group_id: "deluxe",
  valid_from: "2025-12-09",    // Day after contract
  valid_to: "2025-12-12",
  rate: 250,
  is_shoulder: true,           // ✅ NEW
  shoulder_type: "post",       // ✅ NEW
  linked_main_rate_id: 1,      // ✅ Optional link
  markup_percentage: 0.30
}
```

---

## 🏗️ **What Was Implemented**

### **1. New Rate Interface Fields**

```typescript
export type ShoulderType = 'none' | 'pre' | 'post'

export interface Rate {
  // ... existing fields ...
  
  // NEW: Shoulder night support
  is_shoulder?: boolean           // Flag indicating this is a shoulder rate
  shoulder_type?: ShoulderType    // Type: none/pre/post
  linked_main_rate_id?: number    // Optional: link to main rate
  
  // LEGACY: Kept for backward compatibility
  pre_shoulder_rates?: number[]   // Deprecated
  post_shoulder_rates?: number[]  // Deprecated
}
```

### **2. Shoulder Type Selector in Rate Form**

**New dropdown after Tour linking:**
```
┌─────────────────────────────────────────┐
│ Shoulder Rate Type                      │
│ [Regular Rate (Not Shoulder)     ▼]    │
│                                          │
│ Options:                                 │
│ - Regular Rate (Not Shoulder)           │
│ - Pre-Shoulder (Before Contract)        │
│ - Post-Shoulder (After Contract)        │
└─────────────────────────────────────────┘
```

**Smart help text:**
- Regular: "This is a regular rate for the main contract period"
- Pre: "📅 Pre-shoulder rates apply to nights BEFORE the contract validity period"
- Post: "📅 Post-shoulder rates apply to nights AFTER the contract validity period"

### **3. Shoulder Badges in Rates Table**

**Rates table now shows shoulder badges:**
```
┌────────────────────────────────────────────────────────┐
│ Room Type              │ Source        │ Board │ ...   │
├────────────────────────────────────────────────────────┤
│ Deluxe Suite           │ May Contract  │ BB    │ ...   │
│ Deluxe Suite 📅 Pre-   │ May Contract  │ BB    │ ...   │
│ Standard Room 📅 Post- │ Buy-to-Order  │ HB    │ ...   │
└────────────────────────────────────────────────────────┘
```

**Visual indicators:**
- 🔵 **Pre-shoulder**: Blue badge "📅 Pre-Shoulder"
- 🟣 **Post-shoulder**: Purple badge "📅 Post-Shoulder"
- ⚪ **Regular**: No badge

---

## ✨ **Benefits**

### **1. Enterprise Flexibility**
- ✅ Each shoulder period is a real, manageable rate
- ✅ Can have different board types per shoulder
- ✅ Different occupancies for shoulder nights
- ✅ Independent pricing and markup
- ✅ Separate availability tracking

### **2. Better UX**
- ✅ Create shoulder rates like any other rate
- ✅ See all rates (main + shoulder) in one table
- ✅ Filter by validity dates
- ✅ Clear visual distinction with badges
- ✅ Edit shoulder rates independently

### **3. Simplified Data Model**
- ✅ No special array logic
- ✅ Standard validity date handling
- ✅ Works with existing booking system
- ✅ Easy to understand and maintain

### **4. Scalable Architecture**
- ✅ Easy to add mid-season rates, holiday rates
- ✅ No special cases in code
- ✅ Future-proof design
- ✅ Backward compatible (legacy arrays still work)

---

## 🔄 **How It Works**

### **Creating a Shoulder Rate:**

1. **Create Main Rate First:**
   - Contract period: Dec 4-8, 2025
   - Rate: €300
   - Shoulder Type: **Regular Rate (Not Shoulder)**
   - Markup: 60%

2. **Create Pre-Shoulder Rate:**
   - Validity: Dec 1-3, 2025 (before contract)
   - Rate: €250
   - Shoulder Type: **Pre-Shoulder (Before Contract)**
   - Markup: 30% (lower for shoulder)
   - Optional: Link to main rate ID

3. **Create Post-Shoulder Rate:**
   - Validity: Dec 9-12, 2025 (after contract)
   - Rate: €250
   - Shoulder Type: **Post-Shoulder (After Contract)**
   - Markup: 30%
   - Optional: Link to main rate ID

### **Booking System:**
- Automatically picks the right rate based on date
- Shoulder rates appear in searches for their validity periods
- No special logic needed
- Works seamlessly with existing code

---

## 📊 **Visual Example**

**May 2025 Contract:**
```
Contract: May 1-31, 2025
- Main Rate: €300 (60% markup)
- Pre-Shoulder: Apr 28-30 @ €250 (30% markup)
- Post-Shoulder: Jun 1-5 @ €250 (30% markup)
```

**Rates Table Display:**
```
┌──────────────────────────────────────────────────────────────┐
│ Room Type         │ Source        │ Valid Dates  │ Rate │ ... │
├──────────────────────────────────────────────────────────────┤
│ Deluxe 📅 Pre-    │ May Contract  │ Apr 28-30    │ €250 │     │
│ Deluxe            │ May Contract  │ May 1-31     │ €300 │     │
│ Deluxe 📅 Post-   │ May Contract  │ Jun 1-5      │ €250 │     │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 **Backward Compatibility**

### **Legacy Arrays Still Work:**
- `pre_shoulder_rates` and `post_shoulder_rates` arrays preserved
- Existing rates with arrays still function
- Can be migrated gradually
- No breaking changes

### **Migration Path:**
1. New rates use shoulder_type approach
2. Old rates continue working with arrays
3. Eventually migrate old rates to new approach
4. Remove legacy arrays in future version

---

## 🎯 **Use Cases**

### **Scenario 1: Standard Shoulder Nights**
```
F1 Abu Dhabi GP Contract: Dec 5-7
- Main rate: €500/night (race weekend)
- Pre-shoulder: Dec 3-4 @ €300 (before event)
- Post-shoulder: Dec 8-9 @ €300 (after event)
```

### **Scenario 2: Different Board for Shoulder**
```
Main rate: Half Board @ €400
Pre-shoulder: Room Only @ €250  
(Maybe kitchen closed before event)
```

### **Scenario 3: Complex Shoulder Periods**
```
High Season: Jul 1-31 @ €500
Pre-shoulder: Jun 15-30 @ €400
Early shoulder: Jun 1-14 @ €350
Post-shoulder: Aug 1-15 @ €400
Late shoulder: Aug 16-31 @ €350
```

Each is a separate rate with its own validity period!

---

## 🚀 **Try It Now:**

1. **Navigate to Inventory Management → Hotels**
2. **Expand a tour and find a hotel**
3. **Click "New Rate" on a contract** (or "Buy-to-Order Rate")
4. **Fill in the form:**
   - Room Type: Deluxe Suite
   - Occupancy: Double
   - Board: Bed & Breakfast
   - **Shoulder Type: Pre-Shoulder** ← NEW!
   - Valid From: 3 days before contract
   - Valid To: 1 day before contract
   - Rate: €250
   - Markup: 30%
5. **Save**
6. **See the rate in the table with 📅 Pre-Shoulder badge!**

---

## ✅ **What's Working:**

1. ✅ **New shoulder_type field** in Rate interface
2. ✅ **Shoulder type selector** in rate dialog
3. ✅ **Visual badges** in rates table (blue for pre, purple for post)
4. ✅ **Legacy arrays preserved** for backward compatibility
5. ✅ **Booking system compatible** (no changes needed)
6. ✅ **Full flexibility** - create shoulder rates as needed

---

## 📝 **Next Steps (Future):**

1. **Helper function** - "Create shoulder rates" button to auto-generate pre/post
2. **Linked rates UI** - Show connected main/shoulder rates visually
3. **Bulk shoulder creation** - Generate shoulders for multiple rates at once
4. **Migration tool** - Convert old array-based shoulders to separate rates
5. **Reporting** - Shoulder night occupancy and revenue reports

---

**Shoulder nights are now enterprise-grade!** 🎉

**Dev server at http://localhost:5174/** - Try creating a shoulder rate!
