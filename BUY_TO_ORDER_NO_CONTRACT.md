# Buy-to-Order: No Pre-Negotiated Contract

## Key Insight

For **buy-to-order** listings, there's NO pre-negotiated contract because you're purchasing rooms on-demand as they're booked.

## The Difference

### Inventory Listings
```
REQUIRES contract ✅
Why? You've pre-purchased a room block
Contract defines: committed rooms, negotiated rates, terms

Example:
Contract: "May 2025 Block"
- 100 rooms committed
- 120 EUR base rate
- Dates: May 5-9
- Terms agreed in advance

Listing:
✓ Must reference this contract
✓ Cost price from contract rate
✓ Limited to contract quantity
```

### Buy-to-Order Listings
```
NO contract needed ❌
Why? You'll purchase individual rooms when booked
Just need: hotel, expected price, tour dates

Example:
Hotel: "Hotel Le Champs"
- Expected cost: ~135 EUR (market rate)
- Will negotiate per booking
- No commitment

Listing:
✓ References hotel (not contract)
✓ Cost price is ESTIMATED
✓ Unlimited capacity
✓ Actual cost entered when purchased
```

## Data Structure

### Inventory Listing
```typescript
{
  tour_id: 1,
  purchase_type: "inventory",
  contract_id: 1,          // ✅ Required
  contractName: "May 2025 Block",
  room_group_id: "rg-1",
  cost_price: 130,         // From contract rate
  selling_price: 165,
  quantity: 80             // Hard limit
}
```

### Buy-to-Order Listing
```typescript
{
  tour_id: 1,
  purchase_type: "buy_to_order",
  hotel_id: 1,             // ✅ Hotel instead of contract
  hotelName: "Hotel Le Champs",
  room_group_id: "rg-1",
  cost_price: 135,         // ESTIMATED (not contractual)
  selling_price: 180,
  quantity: 20             // Soft target (flexible)
}
```

## Why This Makes Sense

### Inventory
1. You pre-negotiate bulk rates
2. Sign a contract
3. Commit to a room block
4. Get discounted pricing
5. Must sell within contract dates
6. **Contract is the source of truth**

### Buy-to-Order
1. You have a hotel relationship
2. Know approximate market rates
3. NO commitment
4. Purchase at spot rates
5. Can sell anytime (subject to hotel availability)
6. **Hotel is the reference, not contract**

## Listing Form Changes

### Creating Inventory Listing
```
✓ Select Tour
✓ Select Contract (must overlap with tour dates)
  → Auto-fills: hotel, dates, base rate
✓ Select room type (from contract's hotel)
✓ Set occupancy & board
✓ Cost from contract rate
✓ Hard quantity limit
```

### Creating Buy-to-Order Listing
```
✓ Select Tour
✓ Select Hotel (any hotel you work with)
  → No contract needed!
✓ Select room type (from hotel's room_groups)
✓ Set occupancy & board
✓ Enter ESTIMATED cost (market rate guess)
✓ Soft quantity target
```

## Benefits of This Approach

### 1. Realistic
Buy-to-order in real world = no contracts, just hotel relationships

### 2. Flexible
- Not limited by contract dates
- Can sell anytime
- Purchase at current market rates

### 3. Simpler
- No need to create fake contracts for buy-to-order
- Just select hotel and estimate costs

### 4. Accurate
- Cost price is clearly "estimated"
- Actual cost recorded when purchased
- Real profit calculated after purchase

## Purchase Recording

When operations team purchases buy-to-order rooms:

```
Listing (Estimate):
  Hotel: Hotel Le Champs
  Estimated Cost: 135 EUR

Purchase Details (Actual):
  Hotel Contact: Marie Dupont
  Actual Cost: 140 EUR
  Hotel Confirmation: HTL-12345

Result:
  Expected Profit: 45 EUR (180 - 135)
  Actual Profit: 40 EUR (180 - 140)
  Variance: -5 EUR (paid 5 more than expected)
```

This shows the reality of buy-to-order pricing!

## UI Updates Needed

### Listings Form

**When purchase_type = "inventory":**
- Show: Contract dropdown (required)
- Hide: Hotel dropdown
- Label: "Cost Price (from contract)"
- Validation: Must have contract

**When purchase_type = "buy_to_order":**
- Show: Hotel dropdown (required)
- Hide: Contract dropdown
- Label: "Estimated Cost Price"
- Validation: Must have hotel
- Note: "Actual cost will be recorded when purchased"

### Listings Table

**Display Logic:**
- Inventory: Show contractName
- Buy-to-Order: Show hotelName
- Column header: "Source" (Contract or Hotel)

## Example Setup

### Inventory Path
```
1. Create contract with Hotel Le Champs (May 5-9)
2. Create rate: Double + B&B = 130 EUR
3. Create inventory listing:
   ✓ Tour: Spring in Paris
   ✓ Contract: May 2025 Block ← From contract
   ✓ Room: Standard Double (auto-filtered)
   ✓ Cost: 130 EUR (from contract rate)
   ✓ Quantity: 80 (hard limit)
```

### Buy-to-Order Path
```
1. Know you can buy from Hotel Le Champs
2. Check their market rates (~135 EUR for Double B&B)
3. Create buy-to-order listing:
   ✓ Tour: Spring in Paris
   ✓ Hotel: Hotel Le Champs ← Direct hotel reference
   ✓ Room: Standard Double (from hotel's room_groups)
   ✓ Estimated Cost: 135 EUR (your guess)
   ✓ Selling: 180 EUR
   ✓ Target: 20 (flexible)
```

Later when sold:
```
4. Customer books buy-to-order room
5. Operations contacts hotel
6. Hotel quotes: 140 EUR (5 more than expected!)
7. Operations enters actual: 140 EUR
8. System shows: Expected 135, Actual 140, Variance -5
```

## Summary

**Key Change:**
- **Inventory** = Contract required (pre-negotiated block)
- **Buy-to-Order** = Hotel required (on-demand purchasing)

**Why:**
- Matches real-world operations
- Buy-to-order = no commitment = no contract
- Estimated costs vs actual costs properly distinguished

**Impact:**
- More realistic data model
- Clearer distinction between models
- Better tracking of estimate vs actual

---

This makes buy-to-order truly flexible - no contract commitments, just hotel relationships and market rate estimates!

