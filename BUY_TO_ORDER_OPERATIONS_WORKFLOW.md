# Buy-to-Order Operations Workflow

## Overview

When a customer books a **buy-to-order** room, the system notifies your **operations team** that they need to purchase those rooms from the hotel. This document explains the complete internal workflow.

## The Problem Buy-to-Order Solves

**Pre-purchased Inventory (Traditional):**
- ❌ Pay for rooms upfront
- ❌ Risk of unsold inventory
- ❌ Capital tied up

**Buy-to-Order (Modern):**
- ✅ Only purchase rooms when customers book
- ✅ No unsold inventory risk
- ✅ Better cash flow
- ⚠️ Requires operations team to handle purchases

## Complete Workflow

### Step 1: Customer Books Buy-to-Order Room

**User Action:** Create booking from buy-to-order listing

**System Actions:**
1. Creates booking with status: **PENDING** 🟡
2. Sets purchase_status: **pending_purchase**
3. Updates listing sold count
4. **Notifies operations team** (console alert)
5. Shows alert: "Operations team notified"

**Console Output:**
```
📋 OPERATIONS ALERT - ACTION REQUIRED:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛒 BUY-TO-ORDER BOOKING CREATED

CUSTOMER: Jane Doe
TOUR: Spring in Paris
CONTRACT: May 2025 Block
ROOM: Standard Double (double)
QUANTITY: 3 rooms
SELLING PRICE: 450 EUR (total to customer)

⚠️  ACTION: Operations team must purchase these 
    3 rooms from the hotel.

📞 Next Steps:
1. Contact hotel to purchase rooms
2. Enter purchase details in system
3. Confirm booking once purchased
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 2: Operations Team Sees Pending Alert

**When:** Immediately on Bookings page

**Visual:** Orange alert banner appears

```
┌──────────────────────────────────────────┐
│ 🟠 Pending Hotel Purchases               │
│                                          │
│ You have buy-to-order bookings that need │
│ rooms purchased from the hotel.          │
│ Operations team must contact the hotel   │
│ and enter purchase details.              │
│                                          │
│ Booking #2 - Jane Doe - 3 × Standard... │
│            [Enter Purchase Details] ←    │
└──────────────────────────────────────────┘
```

### Step 3: Operations Team Purchases from Hotel

**Real-World Actions:**
1. Operations team member contacts hotel
2. Requests 3 × Standard Double rooms for May 5-9
3. Negotiates price with hotel
4. Hotel confirms availability and price
5. Hotel provides confirmation number
6. Operations team notes who they worked with

### Step 4: Enter Purchase Details in System

**User Action:** Click "Enter Purchase Details"

**Purchase Form Fields:**

**Required:**
- **Purchased By**: Operations team member name (e.g., "John Smith")
- **Hotel Contact**: Who at the hotel (e.g., "Marie Dupont")
- **Hotel Confirmation**: Confirmation number (e.g., "HTL-2025-12345")
- **Cost Per Room**: What hotel charged (e.g., 130 EUR)

**Optional:**
- **Notes**: Any additional details

**Live Calculations:**
- Total Cost: cost_per_room × quantity
- **Profit Margin**: selling_price - total_cost
- Warning if negative margin!

### Step 5: System Confirms Purchase

**After Submitting:**
- Booking status: PENDING → **CONFIRMED** ✅
- Purchase status: pending_purchase → **PURCHASED**
- Stores all purchase details
- Calculates profit margin
- Shows success message

**Stored Data:**
```typescript
purchase_order: {
  assigned_to: "John Smith"
  hotel_contact: "Marie Dupont"
  purchase_date: "2025-10-06"
  hotel_confirmation: "HTL-2025-12345"
  cost_per_room: 130
  total_cost: 390 (130 × 3)
  notes: "Negotiated 10% discount"
}
```

**Console Output:**
```
✅ PURCHASE RECORDED:
Booking ID: 2
Purchased By: John Smith
Hotel Confirmation: HTL-2025-12345
Cost: 390 EUR (130 × 3)
Profit Margin: 60 EUR
```

## Purchase Form Features

### Booking Summary Card

Shows context for the purchase:
- Customer name
- Tour name
- Room type & occupancy
- Quantity needed
- **Selling price** (what customer paid)

### Live Profit Calculation

As you enter cost per room:
```
Cost Per Room: 130 EUR

Total Cost: 390 EUR (130 × 3)
Profit Margin: 60 EUR ✅
```

### Negative Margin Warning

If cost exceeds selling price:
```
┌────────────────────────────────────┐
│ ⚠️  Warning: Negative Margin        │
│                                    │
│ The cost from the hotel (450 EUR)  │
│ exceeds your selling price         │
│ (420 EUR). You will lose 30 EUR    │
│ on this booking.                   │
└────────────────────────────────────┘
```

### Validation

Form validates:
- All required fields filled
- Cost per room > 0
- Can't submit without all details
- Can't enter twice for same booking

## Example: Complete Workflow

### Initial State
```
Listing:
- Type: Buy-to-Order
- Quantity: 20
- Sold: 0
- Price: 150 EUR per room
```

### 1. Customer Books
```
Customer: Jane Doe
Email: jane@example.com
Quantity: 3 rooms
Total: 450 EUR

→ Creates booking #2
→ Status: PENDING 🟡
→ Purchase Status: pending_purchase
→ Listing sold: 0 → 3
```

### 2. Operations Alert
```
🟠 Pending Hotel Purchases
Booking #2 - Jane Doe - 3 × Standard Double
                  [Enter Purchase Details]
```

### 3. Ops Team Contacts Hotel
```
Phone: +33 1 23 45 67 89
Contact: Marie Dupont (Sales Manager)
Request: 3 × Standard Double, May 5-9, double occupancy
Hotel Response: "Yes, available at 130 EUR per room"
Confirmation: HTL-2025-12345
```

### 4. Enter in System
```
Form Data:
✓ Purchased By: John Smith
✓ Hotel Contact: Marie Dupont
✓ Hotel Confirmation: HTL-2025-12345
✓ Cost Per Room: 130 EUR
✓ Notes: "Negotiated from 140 EUR, 10% discount"

Calculations:
Total Cost: 390 EUR
Selling Price: 450 EUR
Profit: 60 EUR ✅
```

### 5. Confirmed!
```
Booking #2:
- Status: CONFIRMED ✅
- Purchase Status: purchased
- Total Revenue: 450 EUR
- Total Cost: 390 EUR
- Profit: 60 EUR
- Hotel Conf: HTL-2025-12345
```

## Key Benefits

### 1. Complete Audit Trail
Every purchase tracked:
- Who bought it (operations team member)
- Who they worked with (hotel contact)
- What it cost (actual hotel price)
- Confirmation number
- Date purchased
- Any notes

### 2. Profit Visibility
See real profit margins:
- Selling price (what customer pays)
- Cost price (what hotel charges)
- **Actual profit** per booking

### 3. Negative Margin Protection
System warns if:
- Hotel charges more than selling price
- Shows exact loss amount
- Helps avoid unprofitable bookings

### 4. Team Accountability
Track:
- Which team member made purchase
- Who they dealt with at hotel
- Performance by team member

### 5. Better Pricing Decisions
Historical data shows:
- Typical hotel costs
- Average profit margins
- Which hotels/rooms most profitable

## Reports You Can Generate

With this data, you can analyze:

**By Operations Team:**
- Who purchases most efficiently?
- Average profit margins by team member
- Response time to pending purchases

**By Hotel:**
- Which hotels easiest to work with?
- Average cost vs selling price by hotel
- Which hotels most profitable?

**By Tour/Room Type:**
- Most profitable room types
- Best margin tours
- Optimal pricing strategies

## Integration Points

For real-world use, integrate:

**Notification System:**
```javascript
if (listing.purchase_type === 'buy_to_order') {
  // Send email to operations team
  await emailService.send({
    to: 'operations@company.com',
    subject: `ACTION REQUIRED: Purchase ${quantity} rooms`,
    template: 'buy-to-order-alert',
    data: { booking, listing, customer }
  })
  
  // Send Slack notification
  await slackService.postMessage({
    channel: '#operations',
    text: `🛒 New buy-to-order booking needs purchase`
  })
}
```

**Purchase Recording:**
```javascript
// Store in database with full audit trail
await db.bookings.update(bookingId, {
  status: 'confirmed',
  purchase_order: {
    ...purchaseDetails,
    recorded_at: new Date(),
    ip_address: request.ip
  }
})

// Log for compliance/audit
await auditLog.create({
  action: 'purchase_recorded',
  user_id: currentUser.id,
  booking_id: bookingId,
  details: purchaseDetails
})
```

## Best Practices

### For Operations Team

1. **Check regularly** - Log into system frequently to see pending purchases
2. **Act quickly** - Purchase rooms as soon as booking comes in
3. **Negotiate** - Try to get best price from hotel
4. **Document** - Enter detailed notes about each purchase
5. **Track contacts** - Build relationships with hotel contacts

### For Pricing

1. **Build in margin** - Price buy-to-order higher than expected cost
2. **Know your costs** - Understand typical hotel rates
3. **Monitor margins** - Review profit reports regularly
4. **Adjust pricing** - If margins too thin, increase listing prices

### For Management

1. **Set targets** - Minimum profit margin thresholds
2. **Review weekly** - Check pending purchases list
3. **Analyze performance** - Which team members most efficient?
4. **Optimize pricing** - Use historical data to price better

## Comparison with Inventory

| Aspect | Inventory | Buy-to-Order |
|--------|-----------|--------------|
| **Upfront Cost** | Yes - pay before selling | No - pay after selling |
| **Risk** | Unsold inventory | Hotel may charge more |
| **Status** | Confirmed instantly | Pending until purchased |
| **Operations Work** | None | Must contact hotel & enter details |
| **Profit Margin** | Known upfront | Known after purchase |
| **Cash Flow** | Negative initially | Positive (customer pays first) |
| **Best For** | Core inventory | Overflow/flexible capacity |

## Summary

**Buy-to-Order is an operations workflow:**

1. Customer books → Operations notified
2. Operations contacts hotel → Purchases rooms
3. Operations enters details → System records purchase
4. Booking confirmed → Profit calculated
5. Data available → For analysis & improvement

**Key Advantage:** Only buy what you sell!

**Key Requirement:** Operations team must be responsive and enter purchase details promptly.

---

**Next Steps:** Try booking a buy-to-order room and walking through the complete workflow to see how it works!

