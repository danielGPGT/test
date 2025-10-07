# Comprehensive Pricing Structure

## Overview

The system now handles all real-world hotel pricing components:
- **Base Rate** - The core room rate
- **Board Types** - Meal plan inclusions
- **Taxes** - VAT/Sales tax and city taxes
- **Fees** - Resort fees, facility charges
- **Commission** - Supplier commission and your markup

## Where Each Component Lives

### 📋 Contract Level
```typescript
{
  base_rate: 120,              // Base room rate
  currency: "EUR",
  tax_rate: 0.10,              // VAT/Sales tax (10%)
  city_tax_per_person_per_night: 2.50,  // Government city tax
  resort_fee_per_night: 5.00,  // Hotel facility fee
  supplier_commission_rate: 0.15  // What hotel charges you (15%)
}
```

**Why here?** These are negotiated in the contract and apply to all rates under that contract.

### 💰 Rate Level
```typescript
{
  room_group_id: "rg-1",
  occupancy_type: "double",
  board_type: "bed_breakfast",   // Meal plan
  rate: 130                      // Net rate including board
}
```

**Why here?** Rates vary by occupancy AND board type (different meal plans = different prices).

### 📝 Listing Level
```typescript
{
  cost_price: 130,        // What you pay (from rate)
  selling_price: 165,     // What customer pays
  commission_rate: 0.20   // Your markup (20%)
}
```

**Why here?** This is your pricing strategy for selling to customers.

## Pricing Components Explained

### 1. Base Rate (Contract)
The starting point for all calculations.

```
Example: 120 EUR per room per night
```

### 2. Board Type (Rate)
Meal plans affect the rate:

| Board Type | Code | Meals Included | Typical Addition |
|------------|------|----------------|------------------|
| Room Only | RO | None | Base |
| Bed & Breakfast | B&B | Breakfast | +15-25 EUR |
| Half Board | HB | Breakfast + Dinner | +30-40 EUR |
| Full Board | FB | All 3 meals | +45-60 EUR |
| All-Inclusive | AI | All meals + drinks | +80-120 EUR |

**Example:**
```
Room Only: 120 EUR
B&B: 140 EUR (+20)
Half Board: 160 EUR (+40)
Full Board: 175 EUR (+55)
All-Inclusive: 210 EUR (+90)
```

### 3. VAT/Sales Tax (Contract)
Percentage tax on the room rate.

```
Base Rate: 130 EUR
VAT (10%): 13 EUR
Subtotal: 143 EUR
```

### 4. City Tax (Contract)
Fixed amount per person per night (government mandated).

```
City Tax: 2.50 EUR per person per night
Occupancy: Double (2 people)
Nights: 4
City Tax Total: 2.50 × 2 × 4 = 20 EUR
```

### 5. Resort Fee (Contract)
Fixed amount per room per night.

```
Resort Fee: 5 EUR per room per night
Nights: 4
Resort Fee Total: 5 × 4 = 20 EUR
```

### 6. Supplier Commission (Contract)
What the hotel/supplier charges you.

```
Base Rate: 130 EUR
Supplier Commission (15%): 19.50 EUR
Your Cost: 149.50 EUR
```

### 7. Your Commission (Listing)
What you markup to customer.

```
Cost Price: 149.50 EUR
Your Commission (20%): 29.90 EUR
Selling Price: 179.40 EUR
```

## Complete Pricing Example

### Contract Setup:
```
Hotel: Hotel Le Champs
Base Rate: 120 EUR
Currency: EUR
VAT: 10%
City Tax: 2.50 EUR per person per night
Resort Fee: 5 EUR per night
Supplier Commission: 15%
```

### Rate Setup:
```
Room: Standard Double
Occupancy: Double (2 people)
Board: Bed & Breakfast
Rate: 130 EUR (includes breakfast for 2)
```

### Cost Calculation (per night):
```
Base Rate (B&B): 130.00 EUR
Resort Fee: 5.00 EUR
───────────────────────
Subtotal: 135.00 EUR
VAT (10%): 13.50 EUR
City Tax (2.50×2): 5.00 EUR
───────────────────────
Total Before Commission: 153.50 EUR
Supplier Commission (15%): 19.50 EUR
───────────────────────
YOUR COST: 173.00 EUR per night
```

### Listing Setup (4-night tour):
```
Cost Price: 173 EUR × 4 = 692 EUR
Your Commission: 20%
Selling Price: 692 × 1.20 = 830.40 EUR

Breakdown:
- Customer Pays: 830.40 EUR
- Your Cost: 692.00 EUR
- Your Profit: 138.40 EUR
- Profit Margin: 16.67%
```

## UI Features

### Contract Form

New fields in contract creation:
```
┌────────────────────────────────────────┐
│ Base Rate: [120] EUR                   │
│ Currency: [EUR ▼]                      │
│                                        │
│ VAT/Sales Tax Rate (%): [10]          │
│                                        │
│ City Tax (per person/night): [2.50]   │
│ → Mandatory government tax             │
│                                        │
│ Resort Fee (per room/night): [5.00]   │
│ → Additional hotel charges             │
│                                        │
│ Supplier Commission (%): [15]          │
│ → Commission charged by hotel          │
└────────────────────────────────────────┘
```

### Rate Form

Now includes board type:
```
Occupancy: [Double ▼]
Board/Meal Plan: [Bed & Breakfast ▼]
  - Room Only (no meals)
  - Bed & Breakfast
  - Half Board (B + D)
  - Full Board (B, L, D)
  - All-Inclusive

Rate: [130] EUR
```

### Listings Form

Shows cost breakdown and profit:
```
Commission/Markup (%): [20]
  → Your profit margin on top of cost

Cost Price: [130] (auto-fills from rate)
  → What you pay

Selling Price: [156] (auto-calculated)
  → What customer pays

┌────────────────────────────────────┐
│ Cost Price: 130.00 EUR             │
│ Selling Price: 156.00 EUR          │
│ Profit per Room: 26.00 EUR ✅      │
│ Profit Margin: 16.7%               │
└────────────────────────────────────┘
```

### Listings Table

New columns show financial performance:
```
ID | Room | Occ | Board | Target | Type | Cost | Sell | Margin | Sold
1  | Std  | Dbl | B&B   | 80     | Inv  | 130  | 165  | 26(16%)| 33
2  | Std  | Dbl | B&B   | 20     | BTO  | 130  | 180  | 50(28%)| 0
```

## Board Type Badges

Tables show abbreviated board types:
- **RO** - Room Only
- **B&B** - Bed & Breakfast
- **HB** - Half Board
- **FB** - Full Board
- **AI** - All-Inclusive

## Auto-Calculations

### 1. Rate Selection Auto-Fills Cost
```
Select: Double occupancy + B&B
→ System finds matching rate: 130 EUR
→ Auto-fills cost_price: 130
```

### 2. Commission Auto-Calculates Selling Price
```
Cost Price: 130 EUR
Commission: 20%
→ Auto-calculates: 130 × 1.20 = 156 EUR
```

### 3. Profit Calculations
```
Selling Price: 165 EUR
Cost Price: 130 EUR
→ Profit: 35 EUR
→ Margin: 21.2%
```

## Business Scenarios

### Scenario 1: Different Board Types, Same Room

```
Standard Double - Double Occupancy

Rate 1: Room Only = 110 EUR
  Listing: Cost 110, Sell 140, Profit 30 (21%)

Rate 2: B&B = 130 EUR
  Listing: Cost 130, Sell 165, Profit 35 (21%)

Rate 3: Half Board = 160 EUR
  Listing: Cost 160, Sell 200, Profit 40 (20%)

Rate 4: All-Inclusive = 210 EUR
  Listing: Cost 210, Sell 260, Profit 50 (19%)
```

Customers can choose meal plan that suits them!

### Scenario 2: City Tax Impact

```
Without City Tax:
Cost: 130 EUR
Selling: 156 EUR
Profit: 26 EUR

With City Tax (2.50×2×4 nights = 20 EUR):
Cost: 150 EUR (130 + 20)
Selling: 180 EUR (adjust pricing)
Profit: 30 EUR
```

City tax reduces margin if not accounted for!

### Scenario 3: Resort Fee Impact

```
Without Resort Fee:
Rate: 130 EUR
Cost: 130 EUR

With Resort Fee (5 EUR × 4 nights = 20 EUR):
Rate: 130 EUR
Resort Fee: 20 EUR
Total Cost: 150 EUR
```

Must include in cost calculations!

## Key Features

### ✅ Complete Cost Tracking
- Base rates from contracts
- All taxes and fees included
- Supplier commissions tracked
- Your markup controlled

### ✅ Profit Visibility
- See profit per room
- See profit margin percentage
- Compare across listings
- Optimize pricing strategy

### ✅ Board Type Flexibility
- Offer multiple meal plans
- Different prices per plan
- Customer choice
- Higher margins on premium boards

### ✅ Auto-Calculations
- Cost pulls from rate
- Selling price auto-calculates from commission
- Profit displayed in real-time
- No manual math needed

## Best Practices

### 1. Contract Setup
```
✅ Enter all fees honestly (city tax, resort fee)
✅ Include supplier commission if applicable
✅ Use realistic VAT rates
✅ Update when fees change
```

### 2. Rate Creation
```
✅ Create rates for all board types you offer
✅ Price higher boards appropriately
✅ Minimum: Room Only + B&B
✅ Consider your market (leisure vs business)
```

### 3. Listing Pricing
```
✅ Start with 15-25% commission for inventory
✅ Add 5-10% more for buy-to-order
✅ Check profit margins before confirming
✅ Adjust if margin too thin or too high
```

### 4. Monitoring
```
✅ Review profit margins regularly
✅ Compare cost vs selling across listings
✅ Identify best-performing products
✅ Adjust pricing as needed
```

## Integration with Buy-to-Order

When recording purchase details for buy-to-order:
```
Listing Cost Price: 130 EUR (expected)
Actual Hotel Cost: 135 EUR (what you paid)
Selling Price: 165 EUR
Actual Profit: 30 EUR (vs expected 35 EUR)
```

The purchase form lets you enter actual cost, showing real profit!

## Summary

**The system now tracks:**

1. **Contract Level**:
   - Base rate, currency
   - VAT, city tax, resort fee
   - Supplier commission

2. **Rate Level**:
   - Occupancy type
   - **Board type** (meal plans)
   - Net rate (includes board)

3. **Listing Level**:
   - Cost price (from rate + fees)
   - Selling price (cost + your markup)
   - Commission rate (your margin)
   - **Live profit calculations**

4. **Buy-to-Order Purchase**:
   - Record actual hotel cost
   - See real profit margin
   - Compare expected vs actual

This provides complete financial visibility and control over your tour inventory pricing! 💰

---

**Try it:** Create a contract with all fees, then create rates with different board types, then see how listings auto-calculate profit margins!

