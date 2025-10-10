# Abu Dhabi F1 Grand Prix Package - Service Request Workflow

## 🏎️ Tour Package: "Abu Dhabi F1 Grand Prix 2025"

**Dates:** December 4-8, 2025 (Thu - Mon)  
**Price:** €2,850 per couple

---

## 📦 What's Included (Tour Components):

### 1. **Accommodation** ✓ (Existing System)
```javascript
{
  component_type: 'accommodation',
  hotel_id: TBD,
  check_in_day: 1,  // Day 1 (Dec 4)
  nights: 4,
  board_type: 'bed_breakfast',
  pricing_mode: 'use_contract',  // Or buy-to-order
  included_in_base_price: true
}
```

### 2. **Airport Transfer - Arrival** ⚡ NEW
```javascript
{
  component_type: 'transfer',
  service_name: 'Airport Transfer - Arrival',
  description: 'Transfer from airport to hotel on arrival',
  pricing_mode: 'fixed_price',
  fixed_cost_per_couple: 50,   // Estimated
  fixed_sell_per_couple: 80,
  included_in_base_price: true,
  
  // NO ROUTE DETAILS YET!
  // Operations fills in after booking
}
```

### 3. **Airport Transfer - Departure** ⚡ NEW
```javascript
{
  component_type: 'transfer',
  service_name: 'Airport Transfer - Departure',
  description: 'Transfer from hotel to airport on departure',
  pricing_mode: 'fixed_price',
  fixed_cost_per_couple: 50,
  fixed_sell_per_couple: 80,
  included_in_base_price: true
}
```

### 4. **Circuit Transfer - Saturday** ⚡ NEW
```javascript
{
  component_type: 'transfer',
  service_name: 'Circuit Transfer - Saturday',
  description: 'Return transfer to Yas Marina Circuit',
  pricing_mode: 'fixed_price',
  fixed_cost_per_couple: 30,
  fixed_sell_per_couple: 50,
  included_in_base_price: true,
  
  // NOTE: Can be sold per seat OR per vehicle
  // Operations decides based on group size
}
```

### 5. **Circuit Transfer - Sunday** ⚡ NEW
```javascript
{
  component_type: 'transfer',
  service_name: 'Circuit Transfer - Sunday',
  description: 'Return transfer to Yas Marina Circuit',
  pricing_mode: 'fixed_price',
  fixed_cost_per_couple: 30,
  fixed_sell_per_couple: 50,
  included_in_base_price: true
}
```

### 6. **F1 3-Day Ticket** ⚡ NEW
```javascript
{
  component_type: 'activity',  // Or 'ticket'
  service_name: 'F1 3-Day Grandstand Ticket',
  description: 'Friday Practice + Saturday Qualifying + Sunday Race',
  pricing_mode: 'fixed_price',
  fixed_cost_per_couple: 800,   // What you pay to supplier
  fixed_sell_per_couple: 1200,  // What you charge client
  included_in_base_price: true
}
```

---

## 🔄 Complete Workflow:

### **PHASE 1: Customer Books the Tour**

**Input:**
- Select: "Abu Dhabi F1 Grand Prix 2025"
- Guests: 2 adults (John & Jane Smith)
- Email: john@example.com
- Phone: +44 7700 900000

**System Creates:**

#### Booking:
```
BK0043 - John & Jane Smith
Tour: Abu Dhabi F1 Grand Prix 2025
Dates: Dec 4-8, 2025
Total: €2,850
Status: Confirmed
```

#### Hotel Room Booking:
```
1× Double Room (4 nights)
Hotel: TBD (buy-to-order or from inventory)
Status: Pending Purchase
```

#### Service Requests (Auto-Generated):
```
SR001: Airport Transfer - Arrival
  Status: pending_details
  Need: Flight number, arrival time, terminal
  
SR002: Airport Transfer - Departure
  Status: pending_details
  Need: Flight number, departure time, terminal
  
SR003: Circuit Transfer - Saturday
  Status: pending_details
  Need: Hotel location, departure time preference
  
SR004: Circuit Transfer - Sunday
  Status: pending_details
  Need: Hotel location, departure time preference
  
SR005: F1 3-Day Ticket
  Status: pending_booking
  Pax: 2
  Cost estimate: €800
```

---

### **PHASE 2: Operations Team (Post-Booking)**

#### Operations Dashboard Shows:
```
📋 Pending Service Requests (5)

BK0043 - John & Jane Smith - Abu Dhabi F1 GP

⚠️ NEEDS DETAILS:
□ Airport Transfer - Arrival (Need flight info)
□ Airport Transfer - Departure (Need flight info)
□ Circuit Transfer - Sat (Need hotel assignment)
□ Circuit Transfer - Sun (Need hotel assignment)

⏳ READY TO BOOK:
□ F1 3-Day Ticket (2 pax)
```

#### Operations fills in details:
```
SR001: Airport Transfer - Arrival
  ✏️ Fill Details:
     From: Dubai International Airport (DXB)
     To: Jumeirah Beach Hotel (now we know which hotel!)
     Date: Dec 4, 2025
     Time: 14:30
     Flight: EK015
     Pax: 2
     Vehicle: Private Sedan
  
  💰 Get Quote from DMC:
     Supplier: Dubai DMC Services
     Quote: €60 (vs €50 estimated)
     Confirmation: DMC-12345
  
  ✅ Status: Confirmed
```

---

### **PHASE 3: Financial Tracking**

#### Service Costs:
```
SR001: Airport Transfer - Arrival
  Estimated: €50 → Actual: €60 (⚠️ +€10)
  
SR002: Airport Transfer - Departure
  Estimated: €50 → Actual: €55 (⚠️ +€5)
  
SR003 & SR004: Circuit Transfers
  Estimated: €60 total → Actual: €70 (shared shuttle)
  
SR005: F1 Tickets
  Estimated: €800 → Actual: €820 (⚠️ +€20)
  
Total Service Costs:
  Estimated: €960
  Actual: €1,005
  Variance: -€45 (over budget)
```

#### Payment to Suppliers:
```
Payment 1: Dubai DMC Services
  - Airport transfers: €115
  - Circuit transfers: €70
  Total: €185
  
Payment 2: F1 Ticket Agency
  - 2× 3-day tickets: €820
```

---

## 🎯 Key Benefits of This Approach:

### ✅ **Selling Phase:**
- Package looks complete to customer
- Estimated pricing included
- No need for specific details

### ✅ **Operations Phase:**
- Clear list of what needs details
- Easy form to fill in specifics
- Track estimated vs actual costs
- Link to suppliers
- Get confirmations

### ✅ **Financial Phase:**
- Track all service costs
- See variances
- Link to payment system
- Full audit trail

---

## 💡 What Operations Dashboard Would Show:

```
┌─────────────────────────────────────────────────────┐
│ Operations Dashboard                                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 🔴 Pending Details (4)                              │
│ ├─ BK0043: Airport Transfer Arrival (Need flight)   │
│ ├─ BK0043: Airport Transfer Departure (Need flight) │
│ ├─ BK0043: Circuit Transfer Sat (Need hotel)        │
│ └─ BK0043: Circuit Transfer Sun (Need hotel)        │
│                                                      │
│ 🟡 Ready to Book (1)                                │
│ └─ BK0043: F1 Tickets (2 pax) - €800 est.          │
│                                                      │
│ 🟢 Confirmed (0)                                    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Next Steps:

1. **Create "Operations" page** - Manage all service requests
2. **Auto-generate requests** - When booking is created from tour
3. **Details form** - Easy form per service type
4. **Supplier booking** - Link to suppliers, track costs
5. **Manifest** - Like rooming list but for all services

**Ready to implement this?**

