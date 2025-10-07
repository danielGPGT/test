# Tour Inventory Flow

## Overview

This document explains how tours connect to room inventory through the complete data flow in the system.

## The Complete Data Flow

```
Tours (Packages to sell)
  ↓
Contracts (Hotel agreements with date ranges)
  ↓
Room Groups (Room types defined on hotels)
  ↓
Rates (Pricing per occupancy level)
  ↓
Listings (Allocate rooms to specific tours)
  ↓
Sales (Customers book from listings)
```

## Entities and Relationships

### 1. Tours
**What they are:** Tour packages that customers book (e.g., "Spring in Paris")

**Key fields:**
- Name
- Start Date
- End Date
- Description

**Example:**
```
Tour: "Spring in Paris"
- Dates: May 5-9, 2025
- Description: "Enjoy the blossoms and culture of Paris in early May"
```

### 2. Hotels
**What they are:** Properties where guests stay

**Key fields:**
- Name
- Location
- Description

### 3. Contracts
**What they are:** Agreements with hotels for room blocks during specific periods

**Key fields:**
- Hotel
- Contract Name
- Start/End Dates (validity period)
- Total Rooms (how many rooms in the block)
- Base Rate
- Currency
- Tax Rate

**Important:** Contracts define a date range. Only contracts that **overlap** with a tour's dates can be used for that tour.

**Example:**
```
Contract: "May 2025 Block"
- Hotel: Hotel Le Champs
- Dates: May 5-9, 2025
- Total Rooms: 100
- Base Rate: 120 EUR
- Currency: EUR
- Tax Rate: 12%
```

### 4. Rates
**What they are:** Pricing for specific room types under a contract, by occupancy

**Key fields:**
- Contract
- Room Type
- Occupancy Type (Single/Double/Triple/Quad)
- Rate Amount

**Inheritance:** Rates inherit currency and tax rate from their contract

**Example:**
```
Rates for "Standard Double" under "May 2025 Block":
- Single Occupancy: 100 EUR
- Double Occupancy: 130 EUR
- Triple Occupancy: 150 EUR
```

### 5. Listings (The Critical Link!)
**What they are:** Allocations of room inventory to specific tours

**Key fields:**
- **Tour** (which tour this inventory is for)
- Contract (where the rooms come from)
- Room Type (from hotel's room_groups)
- Occupancy Type
- Quantity (how many rooms - hard limit for inventory, soft target for buy-to-order)
- Purchase Type (Inventory vs Buy-to-Order)
- Price (selling price to customers)
- Sold (how many have been booked)

**This is where tours connect to rooms!**

**Example:**
```
Listing:
- Tour: "Spring in Paris"
- Contract: "May 2025 Block"
- Room: "Standard Double"
- Occupancy: Double
- Quantity: 80 rooms
- Type: Inventory
- Price: 140 EUR (markup from 130 EUR cost)
- Sold: 35
- Available: 45
```

## How to Set Up Tour Inventory

### Step-by-Step Process

1. **Create the Tour**
   ```
   Name: "Spring in Paris"
   Dates: May 5-9, 2025
   ```

2. **Create a Contract** (or use existing)
   ```
   Hotel: Hotel Le Champs
   Dates: May 5-9, 2025 (must overlap with tour!)
   Base Rate: 120 EUR
   Currency: EUR
   ```

3. **Create Room Types** (or use existing)
   ```
   Hotel: Hotel Le Champs
   Type: "Standard Double"
   Capacity: 2
   ```

4. **Create Rates** for the room under the contract
   ```
   Contract: "May 2025 Block"
   Room: "Standard Double"
   Single: 100 EUR
   Double: 130 EUR
   Triple: 150 EUR
   ```

5. **Create Listings** - Allocate rooms to the tour
   ```
   Tour: "Spring in Paris"
   Contract: "May 2025 Block" (auto-filtered by tour dates!)
   Room: "Standard Double" (auto-filtered by contract's hotel!)
   Occupancy: Double (auto-populates price from rate!)
   Quantity: 80
   Type: Inventory
   Price: 140 EUR (your selling price)
   ```

## Smart Filtering in Listings

When creating a listing, the system intelligently filters options:

### 1. Contract Filtering
**Only shows contracts that overlap with the tour dates**

Example:
- Tour: May 5-9, 2025
- Contract A: May 1-10, 2025 ✅ Shows (overlaps)
- Contract B: April 15-30, 2025 ❌ Hidden (doesn't overlap)
- Contract C: May 8-15, 2025 ✅ Shows (overlaps)

### 2. Room Filtering
**Only shows rooms from the selected contract's hotel**

This prevents mistakes like selecting a room from the wrong hotel.

### 3. Rate Auto-Population
**Automatically suggests price from the configured rate**

When you select an occupancy type, the system:
1. Finds the rate for that contract + room + occupancy
2. Auto-fills the price field
3. You can adjust the price (add markup) before creating

## Purchase Types

### Inventory
- Pre-purchased room block
- Rooms are committed/paid for upfront
- Typical for guaranteed tour inventory

### Buy-to-Order
- Rooms purchased only when sold
- More flexible but potentially higher cost
- Good for overflow capacity

## Business Logic

### Date Overlap Validation
A listing can only use contracts whose dates overlap with the tour dates. This ensures you're only selling rooms you actually have available during the tour.

### Availability Tracking
- **Quantity**: Total rooms allocated
- **Sold**: How many have been booked
- **Available**: Quantity - Sold

### Pricing Strategy
- **Cost Rate**: From the rate table (what you pay the hotel)
- **Selling Price**: In the listing (what you charge customers)
- **Margin**: Selling Price - Cost Rate

## Example: Complete Tour Setup

Let's sell rooms for "Spring in Paris":

### 1. Tour
```
Name: Spring in Paris
Dates: May 5-9, 2025
```

### 2. Contract
```
Hotel: Hotel Le Champs
Dates: May 5-9, 2025
Base Rate: 120 EUR
Currency: EUR
Total Rooms: 100
```

### 3. Room Groups (on Hotel)
```
Hotel: Hotel Le Champs
Room Groups:
  - Standard Double (Capacity: 2)
  - Deluxe Suite (Capacity: 4)
```
Room types are stored in hotel's `room_groups` JSONB field.

### 4. Rates (under contract)
```
Standard Double - Single: 100 EUR
Standard Double - Double: 130 EUR
Standard Double - Triple: 150 EUR
```

### 5. Listings (allocate to tour)

**Listing 1: Pre-purchased inventory**
```
Tour: Spring in Paris
Contract: May 2025 Block
Room: Standard Double
Occupancy: Double
Quantity: 80
Type: Inventory
Cost: 130 EUR (from rate)
Price: 140 EUR (10 EUR markup)
Sold: 35
Available: 45
```

**Listing 2: Flexible overflow**
```
Tour: Spring in Paris
Contract: May 2025 Block
Room: Standard Double
Occupancy: Double
Quantity: 20
Type: Buy-to-Order
Cost: 130 EUR
Price: 150 EUR (20 EUR markup for flexibility)
Sold: 0
Available: 20
```

**Listing 3: Single occupancy option**
```
Tour: Spring in Paris
Contract: May 2025 Block
Room: Standard Double
Occupancy: Single
Quantity: 20
Type: Inventory
Cost: 100 EUR
Price: 120 EUR
Sold: 5
Available: 15
```

## Benefits of This Structure

1. **Data Integrity**: Tours can only use contracts with matching dates
2. **Accuracy**: Rooms are automatically filtered by hotel
3. **Efficiency**: Prices auto-populate from rates
4. **Flexibility**: Multiple occupancy options per tour
5. **Tracking**: Clear inventory and sales tracking
6. **Pricing Control**: Set different selling prices from cost rates
7. **Inventory Types**: Mix pre-purchased and buy-to-order inventory

## Common Scenarios

### Scenario 1: Selling Multiple Room Types
Create separate listings for each room type:
- Standard Double - Double occupancy
- Deluxe Suite - Double occupancy
- Standard Double - Single occupancy (for solo travelers)

### Scenario 2: Multiple Hotels per Tour
1. Create contracts with Hotel A and Hotel B
2. Create listings from Hotel A's contract
3. Create listings from Hotel B's contract
4. All link to the same tour

### Scenario 3: Extending a Tour
If tour dates extend beyond a contract:
1. Create a second contract covering the extended dates
2. Create listings from the new contract
3. Both contracts link to the same tour

## Reports & Analytics (Future)

With this structure, you can analyze:
- Inventory utilization per tour
- Room type popularity by tour
- Profit margins (selling price vs cost rate)
- Occupancy mix (single vs double vs triple)
- Inventory vs buy-to-order performance
- Hotel performance by tour

## Summary

**The key insight:** Listings are the bridge between tours (what you sell) and contracts (what you have). By requiring listings to specify a tour, we ensure every piece of inventory is allocated to a specific tour package, enabling accurate inventory management and sales tracking.

