# Inventory vs Buy-to-Order: Key Differences

## The Fundamental Difference

### Inventory
```
You OWN the rooms upfront
→ Fixed, limited capacity
→ Hard limit on bookings
→ "Available" = Real physical rooms you have
```

### Buy-to-Order
```
You PURCHASE rooms as you sell them
→ Flexible, unlimited capacity*
→ No hard limit on bookings
→ "Quantity" = Target allocation, not a limit
```

**The key insight:** Buy-to-order can theoretically sell unlimited rooms (as long as the hotel keeps confirming), while inventory is strictly limited to what you pre-purchased.

## Quantity Field Meaning

### For Inventory Listings

**"Quantity" = Exact Room Count**
```
Quantity: 80
Meaning: You own exactly 80 rooms
Sold: 35
Available: 45
Can book: Maximum 45 more rooms (HARD LIMIT)
```

**Example:**
- You pre-purchased 80 rooms from hotel
- Paid upfront for all 80
- You CANNOT sell more than 80
- When sold = 80, you're done (sold out)

### For Buy-to-Order Listings

**"Quantity" = Target Allocation (Soft Target)**
```
Quantity: 20
Meaning: You're targeting to sell 20 rooms
Sold: 25
Available: -5 (exceeded target!)
Can book: ∞ Unlimited (as long as hotel confirms)
```

**Example:**
- You set a target of 20 rooms
- But you can sell 25, 30, 50, or more!
- You purchase each room as it's booked
- Target is for planning, not enforcement

## UI Indicators

### Listings Table

| Type | Quantity Column | Available Column | Meaning |
|------|----------------|------------------|---------|
| **Inventory** | Quantity: 80 | Available: 45 | Hard: can't exceed 80 total |
| **Buy-to-Order** | Target Qty: 20 | Available: 15 **(flexible)** | Soft: target 20 but can exceed |

### Bookings Form

**When selecting a listing:**

**Inventory:**
```
Standard Double - Double
140 EUR • 45 available
             ↑ Hard limit
```

**Buy-to-Order:**
```
Standard Double - Double  
150 EUR • 25 sold (flexible)
             ↑ Shows sold count, no limit
```

**When entering quantity:**

**Inventory:**
```
Number of Rooms: [___]
Maximum: 45 rooms available (hard limit)
          ↑ Can't exceed this
```

**Buy-to-Order:**
```
Number of Rooms: [___]
Target remaining: 15 (flexible - can exceed for buy-to-order)
                      ↑ Can go over this
```

## Booking Validation

### Inventory Booking

```javascript
Available: 45
Trying to book: 50
Result: ❌ "Only 45 rooms available in inventory!"
        BLOCKS the booking
```

Hard validation - cannot proceed.

### Buy-to-Order Booking

```javascript
Target: 20
Sold: 15
Available: 5
Trying to book: 10

Console Log:
ℹ️ Buy-to-order booking exceeds target allocation:
  Target: 20
  Already sold: 15
  This booking: 10
  New total: 25
  Overage: 5

Result: ✅ Booking proceeds
        (No hard limit, logs for tracking)
```

Soft validation - allows booking with informational log.

## Business Scenarios

### Scenario 1: Conservative Buy-to-Order

```
Listing Setup:
- Type: Buy-to-Order
- Target Quantity: 20
- Sold: 0

Philosophy:
"We want to sell around 20 rooms, but if demand is higher, 
we can keep selling as long as the hotel confirms"

Reality:
- Sell 15: ✅ Under target
- Sell 20: ✅ At target  
- Sell 30: ✅ Above target (flexible!)
```

### Scenario 2: Unlimited Buy-to-Order

```
Listing Setup:
- Type: Buy-to-Order
- Target Quantity: 9999
- Sold: 0

Philosophy:
"Sell as many as we can, hotel likely has capacity"

Reality:
- Target is essentially "unlimited"
- Keep selling until hotel says no
- Each booking triggers purchase workflow
```

### Scenario 3: Mixed Strategy

```
Tour: Spring in Paris

Listing 1: INVENTORY
- Quantity: 80 (HARD LIMIT)
- Price: 140 EUR
- Sell first (lower price)
- When sold out = STOP

Listing 2: BUY-TO-ORDER
- Target: 20 (FLEXIBLE)
- Price: 150 EUR
- Sell when inventory gone
- Can exceed 20 if demand high
```

## When to Use Each

### Use Inventory When:
- ✅ You negotiated a great rate
- ✅ High confidence you'll sell all rooms
- ✅ You want guaranteed capacity
- ✅ Hotel requires upfront commitment
- ✅ Pricing strategy: lower price, higher volume

### Use Buy-to-Order When:
- ✅ Uncertain demand
- ✅ Overflow capacity beyond inventory
- ✅ Testing new tours/markets
- ✅ Minimize upfront risk
- ✅ Pricing strategy: higher price, pay as you go

## System Behavior Summary

| Aspect | Inventory | Buy-to-Order |
|--------|-----------|--------------|
| **Quantity Meaning** | Exact room count | Target allocation |
| **Limit Type** | Hard limit | Soft target |
| **Can Exceed Quantity?** | ❌ No | ✅ Yes |
| **Validation** | Strict blocking | Info logging only |
| **Available Display** | "45" | "15 (flexible)" |
| **Dropdown Filter** | Hidden if 0 available | Always shown |
| **Input Max** | Available count | No max |
| **When Sold Out** | Cannot book more | Can continue booking |
| **Best For** | Core capacity | Overflow/flexible |

## Practical Example

### Setup:
```
Tour: Spring in Paris (100 expected guests)

Strategy:
1. Buy 80 rooms inventory at 130 EUR (core capacity)
2. Set 40 buy-to-order target at 150 EUR (overflow)
```

### Sales Flow:
```
Sell 1-80: From inventory (140 EUR)
  ↓ Inventory sold out
Sell 81-120: From buy-to-order (150 EUR)
  ↓ Exceeded target (40), but allowed!
Sell 121+: Still from buy-to-order (150 EUR)
  ↓ Can keep going as long as hotel confirms
```

### Result:
```
Inventory:
- Target: 80
- Sold: 80 (sold out) ✅
- Revenue: 11,200 EUR
- Status: SOLD OUT, cannot book more

Buy-to-Order:
- Target: 40
- Sold: 60 (exceeded target by 20!)
- Revenue: 9,000 EUR
- Status: Can still sell more!

Total:
- Sold: 140 rooms (40 above initial plan!)
- Revenue: 20,200 EUR
- Flexibility allowed capturing extra demand ✨
```

## Important Notes

1. **Target vs Limit**:
   - Inventory quantity = LIMIT (can't exceed)
   - Buy-to-order quantity = TARGET (can exceed)

2. **Always Show Buy-to-Order**:
   - Buy-to-order listings never "hide" when target reached
   - Inventory listings hide when sold out

3. **Flexible Capacity**:
   - Buy-to-order = on-demand purchasing
   - As long as hotel confirms, you can keep selling

4. **Operations Workload**:
   - More buy-to-order sales = more purchase requests
   - Operations team must be able to handle volume

5. **Risk Management**:
   - Hotel might eventually say "no availability"
   - Set realistic targets based on hotel size
   - Monitor hotel response rates

## Configuration Tips

### Setting Buy-to-Order Quantities

**Conservative:**
```
Target: 20 rooms
Realistic: Will sell 15-25
Hotel has: 50+ rooms available
Risk: Low
```

**Moderate:**
```
Target: 50 rooms
Realistic: Will sell 40-70
Hotel has: 100 rooms available
Risk: Medium
```

**Aggressive:**
```
Target: 9999 rooms
Realistic: Unknown, testing demand
Hotel has: 200 rooms available
Risk: Higher (but flexible)
```

**Best Practice:**
Set target based on:
- Expected demand
- Hotel's total capacity
- Your operations team's bandwidth
- Pricing strategy

But remember: it's just a target, not a limit! ✨

---

**Key Takeaway:** Buy-to-order's "quantity" is a planning target, not an enforcement limit. This gives you unlimited flexibility to capture demand!

