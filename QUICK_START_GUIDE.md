# Quick Start Guide

## How to Set Up Tour Inventory

Follow these steps in order:

### 1. Create a Tour
**Page:** Tours → "New Tour"

```
Name: Spring in Paris
Start Date: 2025-05-05
End Date: 2025-05-09
Description: Enjoy the blossoms and culture of Paris
```

### 2. Create a Hotel (if needed)
**Page:** Hotels → "New Hotel"

```
Name: Hotel Le Champs
Location: Paris, FR
Description: Boutique hotel near the Champs-Élysées
```

### 3. Define Room Types (on Hotel)
**Page:** Hotels → Edit "Hotel Le Champs"

In the Room Types section:
```
Add Room Type:
- Room Type: Standard Double
- Capacity: 2
- Description: Cozy room with two beds
- Features: Wi-Fi, TV, minibar
[+ Add Room Type]

Add another:
- Room Type: Deluxe Suite
- Capacity: 4
- Features: Wi-Fi, TV, minibar, kitchenette, balcony
[+ Add Room Type]
```

Room types are stored in hotel's `room_groups` JSONB field.

### 4. Create a Contract
**Page:** Contracts → "New Contract"

```
Hotel: Hotel Le Champs
Contract Name: May 2025 Block
Start Date: 2025-05-05 (must overlap with tour!)
End Date: 2025-05-09
Total Rooms: 100
Base Rate: 120
Currency: EUR
Tax Rate: 12 (12%)
```

**Important:** Contract dates must overlap with tour dates!

### 5. Create Rates
**Page:** Rates → "New Rate"

Create multiple rates for different occupancy levels:

```
Contract: May 2025 Block (auto-shows hotel and dates)
Room Type: Standard Double (auto-filtered by hotel)
Occupancy: Single
Rate: 100 EUR (inherits currency from contract)
```

```
Contract: May 2025 Block
Room Type: Standard Double
Occupancy: Double
Rate: 130 EUR
```

```
Contract: May 2025 Block
Room Type: Standard Double
Occupancy: Triple
Rate: 150 EUR
```

### 6. Create Listings (Allocate to Tour!)
**Page:** Listings → "New Listing"

This is where you connect tours to room inventory!

```
Tour: Spring in Paris
Contract: May 2025 Block (auto-filtered to show only contracts overlapping tour dates!)
Room Type: Standard Double (auto-filtered to show only rooms from contract's hotel!)
Occupancy: Double (auto-populates price from rate: 130 EUR)
Quantity: 80
Purchase Type: Inventory
Price: 140 (your selling price - can add markup)
Sold: 0
```

**Result:** You now have 80 "Standard Double" rooms with double occupancy allocated to the "Spring in Paris" tour, priced at 140 EUR each!

## Key Concepts

### Smart Filtering

1. **Listings → Contracts**: Only contracts that overlap with the tour's dates
2. **Listings → Rooms**: Only rooms from the selected contract's hotel
3. **Listings → Price**: Auto-populated from the rate for that occupancy

### The Data Flow

```
Tour (Spring in Paris)
  ↓
Listing (allocates inventory)
  ↓
Contract (May 2025 Block)
  ↓
Room (Standard Double)
  ↓
Rate (Double: 130 EUR)
```

### Two Purchase Types

- **Inventory**: Pre-purchased rooms (committed)
- **Buy-to-Order**: Purchase only when sold (flexible)

## Common Tasks

### Add more inventory to a tour
Create another listing linking the same tour to more rooms

### Sell different room types for a tour
Create multiple listings with different room types

### Handle single travelers
Create a listing with "Single" occupancy at a different price

### Use multiple hotels for one tour
Create contracts with different hotels, then create listings from each

## Navigation

- **Dashboard**: Overview and recent activity
- **Tours**: Manage tour packages
- **Hotels**: Hotel directory
- **Contracts**: Hotel agreements
- **Rooms**: Room types by hotel
- **Rates**: Pricing by occupancy (per contract)
- **Listings**: **← The key! Links tours to inventory**
- **Reports**: Analytics (placeholder)

## Tips

1. **Start with tours** - Know what you're selling
2. **Create contracts** that cover tour dates
3. **Set up room types** for each hotel
4. **Configure rates** for each occupancy level
5. **Create listings** to allocate inventory to tours

## Example: Complete Setup

See `TOUR_INVENTORY_FLOW.md` for a detailed example of setting up a complete tour with multiple room types, occupancies, and inventory types.

## Questions?

- **Q: Why can't I see my contract when creating a listing?**
  - A: The contract dates must overlap with the tour dates
  
- **Q: Why can't I see my room when creating a listing?**
  - A: The room must belong to the contract's hotel
  
- **Q: Where does the price come from?**
  - A: It auto-populates from the rate, but you can adjust it (add markup)
  
- **Q: What's the difference between Inventory and Buy-to-Order?**
  - A: Inventory = pre-purchased, Buy-to-Order = purchase when sold

