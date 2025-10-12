# 🏢 **Allocation Pools - Multiple Suppliers Strategy**

## 🎯 **The Question**

> "What if I get multiple double rooms from different suppliers and contracts at different rates? What would you do with allocation?"

---

## ✅ **ANSWER: Separate Pools Per Supplier/Contract**

### **Golden Rule:**

**"Different suppliers/rates for the same period = Different allocation pools"**

---

## 📋 **Complete Real-World Example**

### **Scenario: Summer Season in Budapest**

**Hotel**: Grand Hotel Budapest
**Room Type**: Deluxe Double Room  
**Season**: Summer 2025 (June 1 - August 31)

**Your Supplier Agreements:**

| Supplier | Rooms | Rate | Payment Terms | Cancellation |
|----------|-------|------|---------------|--------------|
| DMC Hungary | 30 | €150 | Net 30 | 14 days |
| Bedbank Europe | 40 | €160 | Net 60 | 7 days |
| Direct Hotel | 20 | €140 | Net 45 | 21 days |
| **TOTAL** | **90** | - | - | - |

---

## 🔧 **How to Set This Up**

### **Contract 1: DMC Hungary**

```
Navigate: Inventory → Hotels → Add Contract

BASIC DETAILS:
Hotel: Grand Hotel Budapest
Supplier: DMC Hungary
Contract Name: "Summer 2025 - DMC Hungary"
Start Date: 2025-06-01
End Date: 2025-08-31

ROOM ALLOCATION:
☑ Deluxe Double Room
Quantity: 30
Label: "DMC Hungary Block"
Pool ID: "summer-2025-dmc-hungary-double" ✨

PRICING:
Strategy: Per Occupancy
- Single: €120
- Double: €150

BOARD OPTIONS:
- Bed & Breakfast: €15
- Half Board: €30

[Save Contract]
```

**Result**: 
- ✅ Pool created: `summer-2025-dmc-hungary-double`
- ✅ Allocation: 30 rooms
- ✅ Auto-generates 4 rates (Single BB, Single HB, Double BB, Double HB)

---

### **Contract 2: Bedbank Europe**

```
BASIC DETAILS:
Hotel: Grand Hotel Budapest
Supplier: Bedbank Europe
Contract Name: "Summer 2025 - Bedbank"
Start Date: 2025-06-01
End Date: 2025-08-31

ROOM ALLOCATION:
☑ Deluxe Double Room
Quantity: 40
Label: "Bedbank Block"
Pool ID: "summer-2025-bedbank-double" ✨ DIFFERENT!

PRICING:
Strategy: Per Occupancy
- Single: €130
- Double: €160

BOARD OPTIONS:
- Bed & Breakfast: €15
- Half Board: €30

[Save Contract]
```

**Result**:
- ✅ Pool created: `summer-2025-bedbank-double`
- ✅ Allocation: 40 rooms (separate from DMC)
- ✅ Auto-generates 4 rates

---

### **Contract 3: Direct Hotel**

```
BASIC DETAILS:
Hotel: Grand Hotel Budapest
Supplier: Direct Hotel
Contract Name: "Summer 2025 - Direct"
Start Date: 2025-06-01
End Date: 2025-08-31

ROOM ALLOCATION:
☑ Deluxe Double Room
Quantity: 20
Label: "Direct Allocation"
Pool ID: "summer-2025-direct-double" ✨ DIFFERENT!

PRICING:
Strategy: Per Occupancy
- Single: €110
- Double: €140

BOARD OPTIONS:
- Bed & Breakfast: €15
- Half Board: €30

[Save Contract]
```

**Result**:
- ✅ Pool created: `summer-2025-direct-double`
- ✅ Allocation: 20 rooms (separate from DMC and Bedbank)
- ✅ Auto-generates 4 rates

---

## 📊 **Your Inventory Page Will Show**

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏨 GRAND HOTEL BUDAPEST                                         │
│ Tour: Summer 2025                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 📦 Allocation Pools (3)                                          │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ summer-2025-dmc-hungary-double                               ││
│ │ 1 contract • 4 rates                      18/30 available    ││
│ │ [████████████████░░░░░░░░░░░░] 40% utilized                 ││
│ │ Revenue: €27,000 / €67,500 forecast (40%)                    ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ summer-2025-bedbank-double                                   ││
│ │ 1 contract • 4 rates                      32/40 available    ││
│ │ [████████░░░░░░░░░░░░░░░░░░░] 20% utilized                  ││
│ │ Revenue: €12,800 / €64,000 forecast (20%)                    ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ summer-2025-direct-double                                    ││
│ │ 1 contract • 4 rates                       2/20 available    ││
│ │ [████████████████████████████████████░░] 90% utilized 🔴    ││
│ │ Revenue: €25,200 / €28,000 forecast (90%)                    ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ 💡 INSIGHTS:                                                     │
│ • Direct Hotel performing best (90% sold, cheapest rate)        │
│ • Bedbank underperforming (20% sold, highest rate)             │
│ • Consider: Promote DMC rates or adjust Bedbank pricing         │
│                                                                  │
│ 📋 Contracts (3)                                                 │
│ ├─ Summer 2025 - DMC Hungary                                    │
│ ├─ Summer 2025 - Bedbank                                        │
│ └─ Summer 2025 - Direct                                         │
│                                                                  │
│ 💰 All Rates (12 total)                                          │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Room  │Supplier   │Pool              │Board│Occ│Rate │...│  │
│ ├────────────────────────────────────────────────────────────┤  │
│ │ Deluxe│DMC Hungary│📦 dmc-hungary... │ BB  │Dbl│€150 │...│  │
│ │ Deluxe│DMC Hungary│📦 dmc-hungary... │ HB  │Dbl│€150 │...│  │
│ │ Deluxe│Bedbank    │📦 bedbank...     │ BB  │Dbl│€160 │...│  │
│ │ Deluxe│Bedbank    │📦 bedbank...     │ HB  │Dbl│€160 │...│  │
│ │ Deluxe│Direct     │📦 direct...      │ BB  │Dbl│€140 │...│  │
│ │ Deluxe│Direct     │📦 direct...      │ HB  │Dbl│€140 │...│  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ✅ Easy to see: 3 separate pools, independent tracking          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎟️ **Booking Process**

### **Customer Books Summer 2025**

```
Booking Page Shows:

┌─────────────────────────────────────────────────────────┐
│ GRAND HOTEL BUDAPEST - Deluxe Double Room               │
│ Double Occupancy - Bed & Breakfast                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ SELECT SUPPLIER:                                        │
│                                                         │
│ ○ Direct Hotel - €140/night ⭐ BEST VALUE              │
│   Available: 2 rooms remaining                          │
│   Pool: summer-2025-direct-double                       │
│                                                         │
│ ● DMC Hungary - €150/night                             │
│   Available: 18 rooms                                   │
│   Pool: summer-2025-dmc-hungary-double                  │
│                                                         │
│ ○ Bedbank Europe - €160/night                          │
│   Available: 32 rooms                                   │
│   Pool: summer-2025-bedbank-double                      │
│                                                         │
│ [Add to Cart]                                           │
└─────────────────────────────────────────────────────────┘
```

**System Logic**:
1. Shows all available suppliers for same room type/dates
2. Customer chooses based on price/availability
3. Booking deducted from selected supplier's pool only
4. Other suppliers unaffected

---

## 🔄 **When Pools Get Complex**

### **Scenario: Supplier with Multiple Contracts**

**What if Supplier A has 3 different contracts with different rates?**

```
Supplier: DMC Hungary (Same supplier!)

Contract 1: Early Bird (Jan-Mar, €120, 20 rooms)
Pool: "q1-2025-dmc-hungary-double"

Contract 2: Peak Season (Apr-Jun, €180, 30 rooms)
Pool: "q2-2025-dmc-hungary-double"

Contract 3: Summer (Jul-Sep, €150, 25 rooms)
Pool: "q3-2025-dmc-hungary-double"

✅ Different pools because different CONTRACT PERIODS
✅ Same supplier but different commercial terms per period
```

---

## 🤝 **When to Use Shared Pools (Same Supplier)**

### **Scenario: Supplier A with Shoulder Nights**

**This is the ONLY time you share pools across contracts:**

```
Supplier: DMC Hungary (Same supplier, same commercial agreement)

Main Contract: Peak Period
- Dates: May 22-25
- Rate: €200
- Allocation: 30 rooms
- Pool: "monaco-gp-2026-dmc-hungary-double" ✅

Pre-Event Add-On: Shoulder Nights
- Dates: May 20-21
- Rate: €150
- Allocation: 30 rooms (SAME 30 rooms!)
- Pool: "monaco-gp-2026-dmc-hungary-double" ✅ SHARED!

Post-Event Add-On: Shoulder Nights
- Dates: May 26-27
- Rate: €120
- Allocation: 30 rooms (SAME 30 rooms!)
- Pool: "monaco-gp-2026-dmc-hungary-double" ✅ SHARED!

Why share?
✅ Same supplier
✅ Same physical allocation (30 rooms)
✅ Just different pricing periods (shoulder vs peak)
✅ All part of same commercial agreement
```

---

## 📊 **Decision Matrix**

### **Should I Share or Separate Pools?**

| Factor | Same Pool | Separate Pools |
|--------|-----------|----------------|
| **Supplier** | Must be SAME | DIFFERENT suppliers |
| **Commercial Terms** | Must be SAME | DIFFERENT terms |
| **Time Period** | Can be different (shoulder nights) | Overlapping or same |
| **Rates** | Can be different (period pricing) | Different |
| **Physical Rooms** | Must be SAME rooms | Can be same or different |

### **Examples:**

**Scenario A: Different Suppliers, Same Period**
```
Supplier A: Jun-Aug, €150, 30 rooms
Supplier B: Jun-Aug, €160, 40 rooms
→ SEPARATE POOLS ✅
```

**Scenario B: Same Supplier, Different Periods**
```
DMC Hungary: May 20-21, €150, 30 rooms (pre)
DMC Hungary: May 22-25, €200, 30 rooms (main)
→ SHARED POOL ✅ (if same 30 rooms)
→ SEPARATE POOLS ✅ (if different allocations)
```

**Scenario C: Same Supplier, Different Hotels**
```
DMC Hungary: Hotel A, €150, 30 rooms
DMC Hungary: Hotel B, €160, 20 rooms
→ SEPARATE POOLS ✅ (different physical properties)
```

---

## 💡 **Best Practices**

### **1. Clear Naming Convention**

```
Format: {season}-{year}-{supplier-code}-{room-type}

Examples:
✅ summer-2025-dmc-hungary-double
✅ summer-2025-bedbank-europe-double
✅ summer-2025-direct-hotel-double
✅ q1-2026-wholesaler-abc-suite

Avoid:
❌ pool1, pool2, pool3 (not descriptive)
❌ budapest-rooms (which supplier?)
❌ summer (which year? which supplier?)
```

### **2. Document in Contract Notes**

```
Contract Notes:
"Pool: summer-2025-dmc-hungary-double
Allocation: 30 rooms from total 100-room hotel
Payment: Net 30 days
Cancellation: 14 days notice
ROE: €1 = HUF 380 (locked)"
```

### **3. Track Supplier Performance**

```
Monthly Review:
- Which supplier sold fastest?
- Which had best margin?
- Which needed most support?
- Which to prioritize next season?

With separate pools: Easy to analyze!
```

---

## 🎯 **Advanced: Dynamic Allocation Strategy**

### **Scenario: Smart Inventory Management**

You have 3 suppliers for 90 rooms total. How to maximize profit?

**Strategy 1: Waterfall (Sell Cheapest First)**

```
Priority 1: Direct Hotel (€140) - Sell first
→ When sold out, move to...

Priority 2: DMC Hungary (€150) - Sell second  
→ When sold out, move to...

Priority 3: Bedbank (€160) - Sell last

Benefit: Maximize bookings by showing best price first
```

**Strategy 2: Reverse Waterfall (Sell Highest First)**

```
Priority 1: Bedbank (€160) - Sell first
→ When demand is high, maximize revenue

Priority 2: DMC Hungary (€150) - Sell second
→ When Bedbank sold out

Priority 3: Direct Hotel (€140) - Sell last
→ Safety net allocation

Benefit: Maximize revenue per booking
```

**Strategy 3: Balanced**

```
Show all 3 options, let customer choose:
- Budget travelers pick Direct (€140)
- Mid-tier pick DMC (€150)
- Premium customers pick Bedbank (€160)

Benefit: Customer choice + optimal sell-through
```

---

## 📊 **Pool Analytics (Per Supplier)**

### **What You Can Track:**

```
┌─────────────────────────────────────────────────────────┐
│ SUPPLIER PERFORMANCE COMPARISON                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ DMC Hungary (Pool: summer-2025-dmc-hungary-double)     │
│ ├─ Allocation: 30 rooms                                 │
│ ├─ Booked: 12 rooms (40%)                               │
│ ├─ Revenue: €27,000                                     │
│ ├─ Avg rate: €150                                       │
│ └─ Lead time: 45 days                                   │
│                                                         │
│ Bedbank Europe (Pool: summer-2025-bedbank-double)      │
│ ├─ Allocation: 40 rooms                                 │
│ ├─ Booked: 8 rooms (20%)                                │
│ ├─ Revenue: €12,800                                     │
│ ├─ Avg rate: €160                                       │
│ └─ Lead time: 30 days                                   │
│                                                         │
│ Direct Hotel (Pool: summer-2025-direct-double)          │
│ ├─ Allocation: 20 rooms                                 │
│ ├─ Booked: 18 rooms (90%) 🔥                            │
│ ├─ Revenue: €25,200                                     │
│ ├─ Avg rate: €140                                       │
│ └─ Lead time: 60 days                                   │
│                                                         │
│ 💡 INSIGHT:                                             │
│ Direct Hotel (cheapest) selling fastest!                │
│ Consider: Increase allocation with Direct for next year │
│                                                         │
│ 📊 TOTAL ACROSS ALL POOLS:                              │
│ • 90 rooms allocated                                    │
│ • 38 rooms booked (42% overall utilization)             │
│ • €65,000 revenue                                       │
│ • Forecast: €159,500 at 100%                            │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ **Common Mistakes to Avoid**

### **❌ Mistake 1: Sharing Pool Across Suppliers**

```
DON'T DO THIS:

Contract 1 (Supplier A): 30 rooms
Contract 2 (Supplier B): 40 rooms
Pool ID: "summer-2025-double" ← SAME POOL!

Problem:
- System thinks you have 70 rooms total ❌
- But suppliers have separate agreements!
- Can't track which supplier's rooms are sold
- Invoice reconciliation impossible
- Contract disputes likely
```

### **❌ Mistake 2: Not Including Supplier in Pool Name**

```
DON'T DO THIS:

Pool ID: "summer-2025-double"

Problem:
- Which supplier is this?
- Have to look up contracts to find out
- Confusing when you have 5 suppliers
- Hard to manage

DO THIS:

Pool ID: "summer-2025-dmc-hungary-double" ✅
```

### **❌ Mistake 3: Mixing Contract Types**

```
DON'T DO THIS:

Contract 1: Guaranteed (must pay for 30 rooms)
Contract 2: On Request (only pay for sold rooms)
Pool ID: "summer-2025-double" ← SAME POOL!

Problem:
- Different commercial risk profiles
- Different payment obligations
- Can't track financial liability correctly
```

---

## ✅ **Correct Multi-Supplier Setup Checklist**

### **For Each Supplier:**

- [ ] Create separate contract
- [ ] Use unique pool ID including supplier name
- [ ] Set correct allocation quantity
- [ ] Document supplier terms in notes
- [ ] Verify rates auto-generated correctly
- [ ] Check pool card appears on inventory page
- [ ] Confirm pool badge shows in rates table

### **Cross-Supplier Validation:**

- [ ] Pool IDs are unique per supplier
- [ ] No pools shared across different suppliers
- [ ] Total allocations make sense (not exceeding hotel capacity)
- [ ] Can distinguish suppliers easily in UI
- [ ] Revenue tracking works per supplier

---

## 🎉 **Summary**

### **Q: Multiple suppliers with different rates?**

**A: Create SEPARATE allocation pools per supplier!**

```
One Supplier = One Pool (for that period)

Example:
├─ Supplier A → Pool A (30 rooms)
├─ Supplier B → Pool B (40 rooms)
└─ Supplier C → Pool C (20 rooms)

Total: 90 rooms across 3 independent pools ✅
```

### **Exception: Share Pools For:**
- ✅ Same supplier, different pricing periods (shoulder nights)
- ✅ Same supplier, same allocation, different date ranges

### **Never Share Pools For:**
- ❌ Different suppliers (even same period)
- ❌ Different commercial terms
- ❌ Different contract types (guaranteed vs on-request)
- ❌ Different risk profiles

---

**This approach gives you:**
- ✅ Clear supplier separation
- ✅ Independent inventory tracking
- ✅ Easy performance comparison
- ✅ Accurate invoice reconciliation
- ✅ Professional operations

**Exactly how enterprise tour operators manage multi-supplier inventory!** 🏆

