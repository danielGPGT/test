# 💰 Dynamic Charges System - Architecture Proposal

## Overview
A flexible, enterprise-level system to handle all types of charges, taxes, fees, discounts, and commissions across all inventory types.

## Problem Statement
Current system has:
- ✅ Basic tax_rate, service_fee, supplier_commission in contracts
- ✅ Hotel-specific: city_tax_per_person_per_night, resort_fee_per_night
- ❌ No support for complex, conditional charges
- ❌ No support for tiered/volume-based fees
- ❌ No support for seasonal adjustments
- ❌ No support for customer-type specific pricing
- ❌ Limited flexibility for service-specific charges

## Proposed Solution: `DynamicCharge` Array

### Core Concept
Add a `dynamic_charges` array to:
1. **Contract level** - Applies to all rates under this contract
2. **Rate level** - Applies only to this specific rate (overrides contract)

### Type Definitions

```typescript
// ============================================================================
// DYNAMIC CHARGE TYPES
// ============================================================================

export type ChargeType = 
  | 'tax'                    // Government taxes (VAT, sales tax, tourism tax)
  | 'fee'                    // Service fees, booking fees, platform fees
  | 'commission'             // Supplier discounts, agent commissions
  | 'discount'               // Volume discounts, early bird, promotional
  | 'surcharge'              // Peak season, weekend, holiday surcharges
  | 'deposit'                // Deposit requirements
  | 'penalty'                // Late payment, cancellation penalties
  | 'gratuity'               // Tips, service charges
  | 'insurance'              // Optional or mandatory insurance
  | 'other'                  // Custom charges

export type CalculationType =
  | 'percentage'             // % of base price
  | 'fixed_amount'           // Fixed amount (e.g., $50)
  | 'per_person'             // Amount × number of people
  | 'per_person_per_night'   // Amount × people × nights
  | 'per_unit'               // Amount × quantity
  | 'per_unit_per_day'       // Amount × quantity × days
  | 'tiered'                 // Based on volume/quantity tiers
  | 'formula'                // Custom calculation (advanced)

export type AppliedTo =
  | 'base_price'             // Applied to base rate only
  | 'subtotal'               // Applied after other charges
  | 'total'                  // Applied to final total
  | 'specific_charge'        // Applied to another charge (tax on tax)

export type ChargeDirection =
  | 'add'                    // Increases price (taxes, fees)
  | 'subtract'               // Decreases price (discounts, commissions)

export type ChargeTiming =
  | 'immediate'              // Applied at booking time
  | 'on_confirmation'        // Applied when booking confirmed
  | 'on_payment'             // Applied when payment received
  | 'on_service_date'        // Applied on service delivery
  | 'custom_date'            // Applied on a specific date

export interface DynamicCharge {
  id: string
  
  // Basic info
  charge_name: string
  charge_type: ChargeType
  description?: string
  
  // Calculation
  calculation_type: CalculationType
  calculation_config: CalculationConfig
  
  // Application
  applied_to: AppliedTo
  direction: ChargeDirection
  timing: ChargeTiming
  
  // Conditions (when does this charge apply?)
  conditions?: ChargeCondition[]
  
  // Display & Accounting
  display_in_breakdown: boolean      // Show in price breakdown to customer?
  include_in_selling_price: boolean  // Include in quoted price or add later?
  tax_exempt: boolean                // Is this charge itself tax-exempt?
  accounting_code?: string           // For financial reporting
  
  // Status
  mandatory: boolean                 // Must be applied (e.g., government tax)
  active: boolean
}

export interface CalculationConfig {
  // For percentage
  percentage?: number  // e.g., 0.2 for 20%
  
  // For fixed amounts
  fixed_amount?: number
  
  // For per-person/per-unit
  amount_per_unit?: number
  
  // For tiered pricing
  tiers?: ChargeTier[]
  
  // For formula-based (advanced)
  formula?: string  // e.g., "base_price * 0.1 + 5 if nights > 3"
  
  // Minimum/maximum bounds
  min_amount?: number
  max_amount?: number
  
  // Rounding
  round_to?: number  // e.g., 0.01 for cents, 1 for whole dollars
}

export interface ChargeTier {
  min_value: number      // Minimum quantity/amount for this tier
  max_value?: number     // Maximum (optional, last tier is unlimited)
  rate: number           // Rate for this tier
  calculation_type: 'percentage' | 'fixed_amount' | 'per_unit'
}

export interface ChargeCondition {
  condition_type: ConditionType
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in'
  value: any
  value_max?: any  // For 'between' operator
}

export type ConditionType =
  | 'date_range'             // Apply only in specific date range
  | 'day_of_week'            // Apply on specific days
  | 'season'                 // Apply in specific season
  | 'quantity'               // Apply based on quantity
  | 'nights'                 // Apply based on number of nights
  | 'lead_time'              // Apply based on booking lead time
  | 'customer_type'          // Apply for specific customer types
  | 'item_type'              // Apply for specific inventory types
  | 'category'               // Apply for specific categories
  | 'occupancy'              // Apply for specific occupancy
  | 'board_type'             // Apply for specific board types
  | 'custom'                 // Custom condition

// ============================================================================
// UPDATED INTERFACES
// ============================================================================

export interface UnifiedContract {
  // ... existing fields ...
  
  // REPLACE these simple fields:
  // markup_percentage: number
  // tax_rate?: number
  // service_fee?: number
  
  // WITH:
  dynamic_charges: DynamicCharge[]
  
  // Keep hotel_costs for backward compatibility, but deprecate
  hotel_costs?: HotelCosts  // @deprecated - use dynamic_charges instead
}

export interface UnifiedRate {
  // ... existing fields ...
  
  // Add rate-level charge overrides
  dynamic_charges?: DynamicCharge[]  // Overrides or supplements contract charges
  
  // Keep cost_overrides for backward compatibility
  cost_overrides?: CostOverrides  // @deprecated
}
```

## Example Use Cases

### Example 1: Hotel with Complex Charges
```typescript
{
  contract_name: "Marriott Dubai - F1 Weekend",
  dynamic_charges: [
    {
      id: "ch-1",
      charge_name: "Base Markup",
      charge_type: "commission",
      calculation_type: "percentage",
      calculation_config: { percentage: 0.25 },  // 25% markup
      applied_to: "base_price",
      direction: "add",
      timing: "immediate",
      display_in_breakdown: false,
      include_in_selling_price: true,
      tax_exempt: false,
      mandatory: true,
      active: true
    },
    {
      id: "ch-2",
      charge_name: "UAE VAT",
      charge_type: "tax",
      calculation_type: "percentage",
      calculation_config: { percentage: 0.05 },  // 5% VAT
      applied_to: "subtotal",
      direction: "add",
      timing: "immediate",
      display_in_breakdown: true,
      include_in_selling_price: true,
      tax_exempt: false,
      mandatory: true,
      active: true
    },
    {
      id: "ch-3",
      charge_name: "Dubai Tourism Dirham",
      charge_type: "tax",
      calculation_type: "per_person_per_night",
      calculation_config: { 
        amount_per_unit: 20,  // AED 20 per person per night
        max_amount: 200       // Capped at AED 200
      },
      applied_to: "base_price",
      direction: "add",
      timing: "on_service_date",
      display_in_breakdown: true,
      include_in_selling_price: false,  // Pay on checkout
      tax_exempt: true,
      mandatory: true,
      active: true
    },
    {
      id: "ch-4",
      charge_name: "Supplier Commission",
      charge_type: "commission",
      calculation_type: "percentage",
      calculation_config: { percentage: 0.12 },  // 12% discount from hotel
      applied_to: "base_price",
      direction: "subtract",
      timing: "immediate",
      display_in_breakdown: false,  // Internal cost reduction
      include_in_selling_price: false,
      tax_exempt: false,
      mandatory: true,
      active: true
    },
    {
      id: "ch-5",
      charge_name: "Weekend Surcharge",
      charge_type: "surcharge",
      calculation_type: "percentage",
      calculation_config: { percentage: 0.15 },  // 15% weekend surcharge
      applied_to: "base_price",
      direction: "add",
      timing: "immediate",
      conditions: [
        {
          condition_type: "day_of_week",
          operator: "in",
          value: ["friday", "saturday"]
        }
      ],
      display_in_breakdown: true,
      include_in_selling_price: true,
      tax_exempt: false,
      mandatory: true,
      active: true
    },
    {
      id: "ch-6",
      charge_name: "Early Bird Discount",
      charge_type: "discount",
      calculation_type: "percentage",
      calculation_config: { percentage: 0.10 },  // 10% discount
      applied_to: "base_price",
      direction: "subtract",
      timing: "immediate",
      conditions: [
        {
          condition_type: "lead_time",
          operator: "greater_than",
          value: 60  // 60 days before arrival
        }
      ],
      display_in_breakdown: true,
      include_in_selling_price: true,
      tax_exempt: false,
      mandatory: false,
      active: true
    }
  ]
}
```

### Example 2: Transfer with Volume Discount
```typescript
{
  item_name: "Airport Transfer - Dubai",
  dynamic_charges: [
    {
      id: "ch-1",
      charge_name: "Base Markup",
      charge_type: "commission",
      calculation_type: "percentage",
      calculation_config: { percentage: 0.35 },
      applied_to: "base_price",
      direction: "add",
      timing: "immediate",
      display_in_breakdown: false,
      include_in_selling_price: true,
      tax_exempt: false,
      mandatory: true,
      active: true
    },
    {
      id: "ch-2",
      charge_name: "Volume Discount",
      charge_type: "discount",
      calculation_type: "tiered",
      calculation_config: {
        tiers: [
          { min_value: 1, max_value: 5, rate: 0, calculation_type: "percentage" },      // 0% for 1-5 vehicles
          { min_value: 6, max_value: 10, rate: 0.05, calculation_type: "percentage" },  // 5% for 6-10
          { min_value: 11, max_value: 20, rate: 0.10, calculation_type: "percentage" }, // 10% for 11-20
          { min_value: 21, rate: 0.15, calculation_type: "percentage" }                  // 15% for 21+
        ]
      },
      applied_to: "base_price",
      direction: "subtract",
      timing: "immediate",
      display_in_breakdown: true,
      include_in_selling_price: true,
      tax_exempt: false,
      mandatory: false,
      active: true
    },
    {
      id: "ch-3",
      charge_name: "Salik (Toll)",
      charge_type: "fee",
      calculation_type: "per_unit",
      calculation_config: { 
        amount_per_unit: 5  // AED 5 per vehicle
      },
      applied_to: "base_price",
      direction: "add",
      timing: "on_service_date",
      display_in_breakdown: true,
      include_in_selling_price: false,
      tax_exempt: true,
      mandatory: true,
      active: true
    }
  ]
}
```

### Example 3: F1 Ticket with Seasonal Pricing
```typescript
{
  item_name: "F1 Abu Dhabi - Grandstand Tickets",
  dynamic_charges: [
    {
      id: "ch-1",
      charge_name: "Base Markup",
      charge_type: "commission",
      calculation_type: "percentage",
      calculation_config: { percentage: 0.40 },  // 40% markup
      applied_to: "base_price",
      direction: "add",
      timing: "immediate",
      display_in_breakdown: false,
      include_in_selling_price: true,
      tax_exempt: false,
      mandatory: true,
      active: true
    },
    {
      id: "ch-2",
      charge_name: "Peak Season Surcharge",
      charge_type: "surcharge",
      calculation_type: "percentage",
      calculation_config: { percentage: 0.20 },  // 20% surcharge
      applied_to: "base_price",
      direction: "add",
      timing: "immediate",
      conditions: [
        {
          condition_type: "date_range",
          operator: "between",
          value: "2025-10-01",
          value_max: "2025-12-10"  // Race season
        }
      ],
      display_in_breakdown: true,
      include_in_selling_price: true,
      tax_exempt: false,
      mandatory: true,
      active: true
    },
    {
      id: "ch-3",
      charge_name: "Service Fee",
      charge_type: "fee",
      calculation_type: "per_person",
      calculation_config: { 
        amount_per_unit: 50,  // AED 50 per ticket
        max_amount: 500       // Cap at AED 500
      },
      applied_to: "base_price",
      direction: "add",
      timing: "immediate",
      display_in_breakdown: true,
      include_in_selling_price: true,
      tax_exempt: false,
      mandatory: true,
      active: true
    },
    {
      id: "ch-4",
      charge_name: "Group Booking Discount",
      charge_type: "discount",
      calculation_type: "tiered",
      calculation_config: {
        tiers: [
          { min_value: 1, max_value: 9, rate: 0, calculation_type: "percentage" },
          { min_value: 10, max_value: 19, rate: 0.08, calculation_type: "percentage" },
          { min_value: 20, max_value: 49, rate: 0.12, calculation_type: "percentage" },
          { min_value: 50, rate: 0.15, calculation_type: "percentage" }
        ]
      },
      applied_to: "base_price",
      direction: "subtract",
      timing: "immediate",
      display_in_breakdown: true,
      include_in_selling_price: true,
      tax_exempt: false,
      mandatory: false,
      active: true
    }
  ]
}
```

## Price Calculation Engine

### New Pricing Function
```typescript
export interface PriceBreakdownItem {
  charge_id: string
  charge_name: string
  charge_type: ChargeType
  amount: number
  direction: ChargeDirection
  calculation_details: string  // Human-readable explanation
}

export interface DetailedPriceBreakdown {
  // Base
  base_rate: number
  quantity: number
  nights?: number
  people?: number
  
  // All charges
  charges: PriceBreakdownItem[]
  
  // Subtotals
  subtotal_before_tax: number
  total_taxes: number
  total_fees: number
  total_discounts: number
  total_commissions_received: number  // Supplier discounts
  
  // Final
  cost_price: number           // What you pay supplier
  selling_price: number        // What customer pays you
  profit: number               // Selling - Cost
  profit_margin_percentage: number
}

export function calculateDetailedPrice(
  base_rate: number,
  dynamic_charges: DynamicCharge[],
  context: PricingContext
): DetailedPriceBreakdown {
  // Implementation would:
  // 1. Filter charges based on conditions
  // 2. Sort charges by application order
  // 3. Apply each charge sequentially
  // 4. Track all calculations
  // 5. Return detailed breakdown
}

export interface PricingContext {
  quantity: number
  nights?: number
  people?: number
  booking_date: Date
  service_date: Date
  item_type: InventoryItemType
  category_id?: string
  occupancy_type?: OccupancyType
  board_type?: BoardType
  customer_type?: string
  // ... other contextual data
}
```

## Migration Strategy

### Phase 1: Add without breaking (BACKWARD COMPATIBLE)
1. Add `dynamic_charges` field to contracts and rates
2. Keep existing fields (`markup_percentage`, `tax_rate`, etc.)
3. Create helper function to migrate old format to new format
4. UI supports both old and new systems

### Phase 2: Gradual migration
1. Build UI for managing dynamic charges
2. Migrate existing contracts one by one
3. Show side-by-side comparison during migration

### Phase 3: Deprecate old fields
1. Mark old fields as deprecated
2. Remove from UI (but keep in data model for backward compat)
3. Eventually remove from database

## Benefits

✅ **Flexibility**: Handle any type of charge with any calculation method  
✅ **Scalability**: Add new charge types without code changes  
✅ **Transparency**: Clear breakdown of all costs for customers and accounting  
✅ **Automation**: Conditional charges apply automatically based on context  
✅ **Compliance**: Separate tax vs non-tax charges for reporting  
✅ **Business Rules**: Volume discounts, seasonal pricing, etc. without custom code  
✅ **Multi-currency**: Works with any currency  
✅ **Audit Trail**: Each charge has ID and can be tracked  

## Next Steps

Would you like me to:
1. ✅ Implement the TypeScript types in `src/types/unified-inventory.ts`?
2. ✅ Create the pricing calculation engine in `src/lib/pricing.ts`?
3. ✅ Build a UI component for managing dynamic charges?
4. ✅ Create migration helpers for existing data?
5. ✅ Add validation rules?

Let me know and I'll proceed!

