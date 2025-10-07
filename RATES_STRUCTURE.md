# Rates Structure Documentation

## Overview

The rates system has been designed to properly reflect hotel industry practices where rates are derived from contracts and vary based on room occupancy.

## Key Concepts

### 1. Contracts Define Base Information

Contracts are the foundation of the rate structure and contain:
- **Hotel**: Which hotel the contract is with
- **Base Rate**: The baseline rate for rooms
- **Currency**: The currency for all rates under this contract (EUR, USD, GBP)
- **Tax Rate**: The tax percentage applied to rates
- **Contract Period**: Start and end dates that define the contract validity

### 2. Rates Are Contract-Specific

Each rate record:
- **Belongs to a Contract**: Inherits currency, tax rate, and validity period
- **Applies to a Room Type**: Specific room within the contract's hotel
- **Has an Occupancy Type**: Single, Double, Triple, or Quad
- **Specifies a Rate Amount**: Can be same as or different from the base rate

### 3. Multi-Occupancy Support

Hotels typically charge different rates based on how many people occupy a room:

- **Single Occupancy**: 1 person (typically lower rate)
- **Double Occupancy**: 2 people (standard rate)
- **Triple Occupancy**: 3 people (higher rate)
- **Quad Occupancy**: 4 people (highest rate)

### Example Structure

```
Contract: "May 2025 Block" - Hotel Le Champs
├── Base Rate: 120 EUR
├── Currency: EUR
├── Tax Rate: 12%
└── Rates:
    ├── Standard Double Room - Single: 100 EUR
    ├── Standard Double Room - Double: 130 EUR
    └── Standard Double Room - Triple: 150 EUR
```

## Creating Rates

### Step-by-Step Process

1. **Select a Contract**
   - Choose the contract that governs this rate
   - Contract information is displayed (hotel, base rate, tax, currency, dates)
   
2. **Select a Room Type**
   - Only rooms from the contract's hotel are available
   - Helps ensure consistency and prevents errors
   
3. **Choose Occupancy Type**
   - Single, Double, Triple, or Quad
   - Different occupancy = different rate for same room
   
4. **Set the Rate Amount**
   - Enter the rate for this specific occupancy
   - Contract's base rate is shown as reference
   - Currency is inherited from contract

## Why This Structure?

### Business Logic Alignment

1. **Contract-Driven**: In the hotel industry, rates are negotiated as part of contracts
2. **Flexibility**: Each room type can have different rates per occupancy
3. **Consistency**: Currency and tax rates are maintained at contract level
4. **Scalability**: Easy to add seasonal variations or special rates

### Technical Benefits

1. **Data Integrity**: Relationships between contracts, hotels, rooms, and rates are maintained
2. **Reduced Redundancy**: Tax rates and currency don't need to be entered per rate
3. **Easier Updates**: Changing a contract's tax rate can cascade to all its rates
4. **Better Filtering**: Rooms are automatically filtered by contract's hotel

## Data Flow

```
Contract (Base Info)
    ↓
Filters Rooms (by hotel)
    ↓
Rate (Contract + Room + Occupancy)
    ↓
Listing (Inventory based on rates)
```

## Best Practices

1. **Create contracts first** with accurate base rates and currencies
2. **Set up room types** for each hotel before creating rates
3. **Create rates for common occupancies** (at minimum: single and double)
4. **Use base rate as reference** when setting occupancy-specific rates
5. **Maintain consistency** - rates should logically increase with occupancy

## Future Enhancements

Potential additions to the rates system:
- Season-based rate multipliers
- Date-specific rate overrides
- Bulk rate creation (create all occupancy types at once)
- Rate history and audit trail
- Promotional rate types
- Child/adult occupancy variations

