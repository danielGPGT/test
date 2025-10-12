# 🎨 **Allocation Pool System - UI Implementation Guide**

## ✅ **What's Been Implemented**

The allocation pool system is now **fully integrated into the UI**! Here's what was added:

---

## 🔧 **1. Contract Form - Room Allocation Section**

### **Location**: When creating/editing a hotel contract

### **New Field**: `Allocation Pool ID`

```
┌─────────────────────────────────────────────────────────┐
│ Add Room Allocation                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ☑ Select Room Types                                    │
│   ☑ Double Room    ☑ Twin Room    □ Suite             │
│                                                         │
│ Label (optional):          Quantity *:                 │
│ [December Block    ]       [10          ]              │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│                                                         │
│ Allocation Pool ID (for multi-rate periods)            │
│ [dec-2025-double-pool                                ] │
│ Optional: Use same Pool ID across contracts to share   │
│ inventory (e.g., for shoulder nights)                  │
│                                                         │
│                           [Add Allocation]              │
└─────────────────────────────────────────────────────────┘
```

### **How It Appears After Adding**:

```
┌─────────────────────────────────────────────────────────┐
│ Room Allocations                                     2  │
├─────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐  │
│ │ December Block  Pool: dec-2025-double-pool        │  │
│ │ Double Room  10 rooms (shared)                 [×]│  │
│ │ Using contract default rates                      │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 **2. Rate Form - Shoulder Rate Section**

### **Location**: When creating shoulder rates manually

### **New Field**: `Allocation Pool ID` (appears when shoulder type is selected)

```
┌─────────────────────────────────────────────────────────┐
│ Create Rate                                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Shoulder Rate Type:                                    │
│ [Pre-Shoulder (Before Contract)       ▼]              │
│ 📅 Pre-shoulder rates apply to nights BEFORE the       │
│ contract validity period                                │
│                                                         │
│ ──────────────────────────────────────────────────────  │
│                                                         │
│ 📦 Allocation Pool ID                                   │
│ [dec-2025-double-pool                                ] │
│                                                         │
│ 🔗 Important: To share inventory with main contract    │
│ rates, enter the SAME Pool ID from the contract        │
│ allocation. This ensures shoulder and main rates       │
│ share the same physical rooms.                         │
│                                                         │
│ ⚠️ Without a Pool ID, this rate will NOT share         │
│ inventory with other rates (separate allocation         │
│ tracking)                                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 **3. Complete Step-by-Step UI Workflow**

### **Your Exact Scenario: Double Room with 3 Price Periods**

#### **Step 1: Create Main Contract**

1. **Navigate**: Inventory → Hotels → [Select Hotel] → Add Contract
2. **Fill Contract Details**:
   - Hotel: Grand Hotel
   - Contract Name: "December 2025"
   - Start Date: 2025-12-02
   - End Date: 2025-12-15
   - Pricing Strategy: Per Occupancy
   - Occupancy Rates: Double = £200

3. **Add Room Allocation**:
   - ☑ Check: Double Room
   - Label: "December Block"
   - Quantity: **10**
   - **Allocation Pool ID**: `dec-2025-double-pool` ✨ ← KEY!
   - Click "Add Allocation"

4. **Add Board Option**:
   - Board Type: Bed & Breakfast
   - Cost: £15

5. **Click**: Save Contract

**Result**: System auto-generates rates with pool ID `dec-2025-double-pool`

---

#### **Step 2: Edit Main Rate Validity (Dec 4-8 only)**

1. **Navigate**: Inventory → Hotels → December 2025 → Rates Table
2. **Find**: Rate for Double Room, Double Occupancy, B&B (£200)
3. **Click**: Edit (pencil icon)
4. **Update**:
   - Valid From: 2025-12-04
   - Valid To: 2025-12-08
   - (Leave Pool ID as-is)
5. **Click**: Save

---

#### **Step 3: Create Pre-Shoulder Rate (Dec 2-3)**

1. **Click**: "Add Rate" button
2. **Fill Form**:
   - Room Type: Double Room
   - Occupancy: Double
   - Board Type: Bed & Breakfast
   - **Base Rate**: **£180** ← Lower price!
   - Board Cost: £15
   - **Shoulder Type**: **Pre-Shoulder** ✨
   - **Allocation Pool ID**: `dec-2025-double-pool` ✨ ← SAME AS CONTRACT!
   - Valid From: 2025-12-02
   - Valid To: 2025-12-03
   - Min Nights: 1
   - Max Nights: 14
   - Active: ☑ Yes

3. **Click**: Save

**You'll see the warning**:
```
🔗 Important: To share inventory with main contract rates,
   enter the SAME Pool ID from the contract allocation.
```

**You'll also see**:
```
✓ Pool ID matches contract! This rate will share the
  same 10 physical rooms.
```

---

#### **Step 4: Create Post-Shoulder Rate (Dec 9-15)**

1. **Click**: "Add Rate" button
2. **Fill Form**:
   - Room Type: Double Room
   - Occupancy: Double
   - Board Type: Bed & Breakfast
   - **Base Rate**: **£290** ← Higher price!
   - Board Cost: £15
   - **Shoulder Type**: **Post-Shoulder** ✨
   - **Allocation Pool ID**: `dec-2025-double-pool` ✨ ← SAME AS CONTRACT!
   - Valid From: 2025-12-09
   - Valid To: 2025-12-15
   - Min Nights: 1
   - Max Nights: 14
   - Active: ☑ Yes

3. **Click**: Save

---

#### **Step 5: Verify Your Setup**

**Navigate**: Inventory → Hotels → December 2025

**You should see**:

```
┌─────────────────────────────────────────────────────────┐
│ GRAND HOTEL                                             │
│ Contract: December 2025                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📦 Allocation Pool: dec-2025-double-pool                │
│    Total: 10 rooms | Booked: 0 | Available: 10         │
│                                                         │
│ ──────────────────────────────────────────────────────  │
│                                                         │
│ ALL RATES FOR DOUBLE ROOM - DOUBLE OCCUPANCY - B&B     │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Dec 2-3 (Pre-Shoulder)           Pool: dec-2025  │  │
│ │ £180/night + £15 board                           │  │
│ │ Min: 1 | Max: 14 nights              [Edit] [×]  │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Dec 4-8 (Main Period)                Pool: dec-2025││
│ │ £200/night + £15 board                           │  │
│ │ Min: 1 | Max: 14 nights              [Edit] [×]  │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Dec 9-15 (Post-Shoulder)             Pool: dec-2025││
│ │ £290/night + £15 board                           │  │
│ │ Min: 1 | Max: 14 nights              [Edit] [×]  │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ ✅ All 3 rates share the same 10 rooms!                │
└─────────────────────────────────────────────────────────┘
```

---

## 🎟️ **6. Testing a Booking**

1. **Navigate**: Bookings → Create Booking
2. **Select**:
   - Tour: (Select your tour)
   - Check-in: 2025-12-02
   - Check-out: 2025-12-09 (7 nights)

3. **You'll see**:

```
┌─────────────────────────────────────────────────────────┐
│ GRAND HOTEL - Double Room                               │
│ Double Occupancy - Bed & Breakfast                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Price Breakdown (7 nights):                            │
│ ───────────────────────────────────────────────────     │
│ Dec 2-3 (2 nights):   2 × £180 = £360                 │
│ Dec 4-8 (5 nights):   5 × £200 = £1,000               │
│ ───────────────────────────────────────────────────     │
│ Room Subtotal:                    £1,360               │
│ Board (2 pax × 7 nights × £15):  £210                 │
│ ───────────────────────────────────────────────────     │
│ Total:                            £1,570               │
│                                                         │
│ Available: 10 rooms                                     │
│                                                         │
│ Quantity: [1  ▼]                    [Add to Cart]      │
└─────────────────────────────────────────────────────────┘
```

4. **Click**: Add to Cart
5. **Complete Booking**

**Result**: System books **1 room** from the pool, inventory updates correctly!

---

## ⚠️ **Important UI Indicators**

### **Visual Feedback in the UI**:

#### **1. Pool ID Badge (Contract Allocations)**
```
December Block  Pool: dec-2025-double-pool
Double Room  10 rooms (shared)
```

#### **2. Warning When Missing Pool ID**
```
⚠️ Without a Pool ID, this rate will NOT share inventory
   with other rates (separate allocation tracking)
```

#### **3. Success Indicator**
```
✓ Pool ID matches contract! Sharing 10 rooms with
  other rates in pool: dec-2025-double-pool
```

---

## 🎯 **Quick Reference: Field Locations**

| What | Where | Field Name |
|------|-------|------------|
| **Set Pool ID** | Contract Form → Room Allocations | `Allocation Pool ID` |
| **Use Pool ID** | Rate Form → (appears when Shoulder Type ≠ Regular) | `Allocation Pool ID` |
| **View Pool** | Inventory Setup → Contract Card | Badge shows pool ID |
| **Check Availability** | Rates Table | Shows pool allocation status |

---

## 🚨 **Common UI Issues & Solutions**

### **Issue 1: Can't Find Pool ID Field in Rate Form**

**Cause**: Field only appears for shoulder rates

**Solution**: 
1. Set "Shoulder Rate Type" to "Pre-Shoulder" or "Post-Shoulder"
2. Pool ID field will appear below

---

### **Issue 2: Pool ID Not Showing in Contract**

**Cause**: You created the allocation before the UI update

**Solution**:
1. Edit the contract
2. Remove the allocation
3. Re-add it with the Pool ID field filled in

---

### **Issue 3: Rates Not Sharing Inventory**

**Check List**:
- [ ] Pool IDs match EXACTLY (case-sensitive!)
- [ ] Pool ID was set in contract allocation
- [ ] Pool ID was set in all shoulder rates
- [ ] No typos in pool ID

---

## 🎓 **Summary**

✅ **Contract Form**: Add Pool ID when creating room allocations
✅ **Rate Form**: Pool ID field appears for shoulder rates
✅ **Visual Feedback**: Badges show pool IDs throughout UI
✅ **Warnings**: System alerts if Pool ID is missing
✅ **Validation**: Real-time checks ensure pool IDs match

**You now have a complete, user-friendly UI for managing allocation pools!** 🎉

