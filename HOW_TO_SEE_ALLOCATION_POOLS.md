# 🔍 **How to See Allocation Pools - Quick Guide**

## ⚠️ **Why You Can't See Pools Yet**

**The pool cards will ONLY appear if you have contracts with `allocation_pool_id` set!**

Currently, your existing contracts probably don't have pool IDs, so the section is hidden.

---

## 🎯 **How to Test & See Pools**

### **Step 1: Create a Test Contract with Pool ID**

1. **Navigate**: `Inventory → Hotels`
2. **Expand** any tour accordion (or "Generic Hotels")
3. **Click**: "Add Contract" for any hotel
4. **Fill in** basic details:
   - Hotel: (select any)
   - Contract Name: "Test Pool Contract"
   - Dates: Any dates
   - Supplier: (select any)

5. **Scroll down to "Room Allocations"** accordion
6. **Expand** it
7. **Select** a room type (check the box)
8. **Fill in**:
   - Label: "Test Allocation"
   - Quantity: 10
   - **Allocation Pool ID**: `test-pool-2025` ✨ ← THIS IS KEY!

9. **Click**: "Add Allocation"
10. **Scroll down** to pricing/board options
11. **Fill those** in (or use defaults)
12. **Click**: "Save Contract"

---

### **Step 2: View the Pool Card**

1. **Go back** to the inventory page
2. **Expand** the same tour/generic section
3. **You should now see**:

```
┌─────────────────────────────────────────────────────────┐
│ 🏨 [HOTEL NAME]                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📦 Allocation Pools (1) ✨ ← THIS APPEARS!              │
│ ┌───────────────────────────────────────────────────┐   │
│ │ test-pool-2025                                    │   │
│ │ 1 contract • 4 rates          10/10 available     │   │
│ │ [░░░░░░░░░░░░░░░░░░░░░░] 0% utilized              │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ 📋 Contracts (1)                                        │
│ └─ Test Pool Contract [Edit] [Clone] [Rate]            │
│                                                         │
│ 💰 All Rates (4)                                        │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Room  │Source│Pool         │Board│Occ│Rate│...   │   │
│ ├───────────────────────────────────────────────────┤   │
│ │ Double│Test  │📦 test-pool │ BB  │Dbl│...│...    │   │
│ │ Double│Test  │📦 test-pool │ BB  │Sgl│...│...    │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

### **Step 3: Add Shoulder Rates to the Pool**

1. **Click**: "Add Rate" button
2. **Fill in**:
   - Room Type: (same as before)
   - Occupancy: Double
   - Board Type: Bed & Breakfast
   - Base Rate: 150 (different price!)
   - **Allocation Pool ID**: Select `test-pool-2025` from dropdown ✨
   - Valid From: (earlier date)
   - Valid To: (earlier date)

3. **Click**: "Save"

4. **Go back** and you'll see:

```
┌─────────────────────────────────────────────────────────┐
│ 📦 Allocation Pools (1)                                 │
│ ┌───────────────────────────────────────────────────┐   │
│ │ test-pool-2025                                    │   │
│ │ 1 contract • 5 rates ← Now 5!   10/10 available   │   │
│ │ [░░░░░░░░░░░░░░░░░░░░░░] 0% utilized              │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**And in the rates table**:

```
┌───────────────────────────────────────────────────────┐
│ Room  │Source│Pool         │Board│Occ│Rate│...       │
├───────────────────────────────────────────────────────┤
│ Double│Test  │📦 test-pool │ BB  │Dbl│£200│...       │
│ Double│Test  │📦 test-pool │ BB  │Dbl│£150│... ← NEW!│
│ Double│Test  │📦 test-pool │ BB  │Sgl│...│...       │
└───────────────────────────────────────────────────────┘

✅ Both rates show the SAME pool badge!
```

---

## 📍 **Where to Find Pool Features**

### **1. Pool Cards**
**Location**: Top of each hotel section (below hotel header, above contracts)
**Shows**: Pool ID, utilization bar, stats
**Condition**: Only appears if hotel has contracts with pool IDs

### **2. Pool Column in Rates Table**
**Location**: Rates table (new column between "Source" and "Board")
**Shows**: Pool badge or "-" if no pool
**Always visible**: Yes (column always there)

### **3. Pool Field in Contract Form**
**Location**: Contract dialog → Room Allocations accordion → Add Allocation section
**Field**: "Allocation Pool ID (for multi-rate periods)"
**Type**: Text input

### **4. Pool Dropdown in Rate Form**
**Location**: Rate dialog → After "Tour" field
**Field**: "Allocation Pool ID"
**Type**: Dropdown (if contract has pools) or text input

---

## 🎯 **Real-World Example to Test**

### **Create Monaco GP Multi-Period Pricing**

#### **Step 1: Main Contract**
```
Contract: "Monaco GP Main Event"
Dates: May 22-25, 2026
Room Allocation:
  - Deluxe Double: 10 rooms
  - Pool ID: "monaco-gp-2026-deluxe" ✨
```

#### **Step 2: Pre-Event Contract**
```
Contract: "Monaco GP Pre-Event"
Dates: May 20-21, 2026
Room Allocation:
  - Deluxe Double: 10 rooms
  - Pool ID: "monaco-gp-2026-deluxe" ✨ (SAME!)
```

#### **Step 3: View Results**
```
Inventory page will show:

📦 Allocation Pools (1)
┌───────────────────────────────────────────────────┐
│ monaco-gp-2026-deluxe                             │
│ 2 contracts • 8 rates         10/10 available     │
│ [░░░░░░░░░░░░░░░░░░░░░░] 0% utilized              │
└───────────────────────────────────────────────────┘

💰 All Rates (8)
Pool column will show:
- 4 rates with "📦 monaco-gp-2026-deluxe" (from pre-event)
- 4 rates with "📦 monaco-gp-2026-deluxe" (from main event)
→ All 8 rates share the same 10 rooms! ✅
```

---

## ✅ **Checklist: Am I Seeing Pools?**

- [ ] I created a contract
- [ ] I expanded "Room Allocations" accordion in contract form
- [ ] I added a room allocation
- [ ] I filled in "Allocation Pool ID" field
- [ ] I saved the contract
- [ ] I went back to Inventory page
- [ ] I expanded the correct tour/generic section
- [ ] I can see the hotel

**If all checked**: You should see "📦 Allocation Pools (1)" section!

**If you still don't see it**:
- Check: Did you refresh the page?
- Check: Is the pool ID field filled? (not empty)
- Check: Are you looking at the right hotel/tour section?

---

## 🎨 **Visual Guide**

### **BEFORE Creating Pool**:
```
🏨 Grand Hotel
├─ 📋 Contracts (1)
│  └─ My Contract
└─ 💰 All Rates (4)
```

### **AFTER Creating Pool**:
```
🏨 Grand Hotel
├─ 📦 Allocation Pools (1) ✨ NEW!
│  └─ [Pool card with utilization bar]
├─ 📋 Contracts (1)
│  └─ My Contract
└─ 💰 All Rates (4)
   └─ Pool column shows pool badges ✨ NEW!
```

---

## 🚀 **Quick Test (30 seconds)**

```bash
1. Inventory → Hotels
2. Expand any tour
3. Click "Add Contract"
4. Fill minimal details
5. Room Allocations → Add allocation
6. Pool ID: "quick-test"
7. Save
8. Go back
9. ✅ See pool card appear!
```

**That's it! The pools are there, they just need contracts with pool IDs to show up!** 🎉

