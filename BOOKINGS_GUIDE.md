# Bookings Guide

## Overview

The Bookings feature allows you to sell rooms and see immediate impacts on inventory. When you create a booking, the listing's `sold` count increases and `available` inventory decreases automatically.

## How It Works

### Real-Time Inventory Updates

```
Before Booking:
Listing: 80 total rooms, 33 sold, 47 available

Create Booking: 2 rooms

After Booking:
Listing: 80 total rooms, 35 sold, 45 available ← Updated instantly!
```

### The Booking Flow

1. **Select a Tour**
   - Choose which tour the customer is booking
   - System shows tour dates and description

2. **Choose Room Type & Occupancy**
   - **Only listings with available inventory are shown**
   - Displays: Room type, occupancy, price, available count
   - Shows listing details (contract, type, etc.)

3. **Enter Quantity**
   - How many rooms to book
   - System validates against available inventory
   - Can't exceed available rooms

4. **Customer Information**
   - Customer name
   - Customer email

5. **Confirm Booking**
   - System calculates total price
   - Creates booking record
   - **Updates listing's sold count**
   - Shows success confirmation

## Features

### Availability Validation

The system prevents overbooking:
```typescript
Available rooms: 47
Trying to book: 50
Result: ❌ "Only 47 rooms available!"
```

### Real-Time Statistics

The bookings page shows:
- **Total Bookings**: Count of confirmed bookings
- **Total Revenue**: Sum of all confirmed booking prices
- **Rooms Booked**: Total rooms sold across all bookings

### Booking Status

Each booking has a status:
- **Confirmed** ✅ (green badge): Active booking, inventory allocated
- **Pending** 🟡 (yellow badge): Awaiting confirmation
- **Cancelled** ❌ (red badge): Booking cancelled, inventory returned

### Cancellations

You can cancel bookings:
1. Click "View" actions on a booking
2. Confirm cancellation
3. **Rooms are returned to inventory** (sold count decreases)
4. Booking status changed to "cancelled"

```
Before Cancel:
Listing: 80 total, 35 sold, 45 available

Cancel Booking: 2 rooms

After Cancel:
Listing: 80 total, 33 sold, 47 available ← Rooms returned!
```

## Example Workflow

### Scenario: Selling rooms for "Spring in Paris"

**Step 1: View Available Inventory**
Go to Listings page:
- "Spring in Paris" - Standard Double - Double occupancy
- 80 total rooms
- 33 sold
- **47 available**
- Price: 140 EUR

**Step 2: Create Booking**
Go to Bookings page → "New Booking"

1. Select Tour: "Spring in Paris"
2. Select Room: "Standard Double - Double (140 EUR • 47 available)"
3. Quantity: 3 rooms
4. Customer: "Jane Doe"
5. Email: "jane.doe@example.com"
6. **Total Price: 420 EUR** (3 × 140)
7. Click "Confirm Booking"

**Step 3: See Immediate Impact**

✅ Booking created:
- ID: #2
- Status: Confirmed
- Customer: Jane Doe
- Rooms: 3
- Total: 420 EUR

📊 Inventory Updated:
Go back to Listings page:
- 80 total rooms
- **36 sold** (was 33, now 33 + 3)
- **44 available** (was 47, now 47 - 3)

**Step 4: Check Statistics**
On Bookings page, statistics update:
- Total Bookings: 2 (was 1, now 2)
- Total Revenue: 700 EUR (was 280, now 280 + 420)
- Rooms Booked: 5 (was 2, now 2 + 3)

## Smart Filtering

### Only Shows Available Inventory

If a listing is sold out:
```
Listing: 20 rooms total, 20 sold, 0 available
Result: Won't appear in booking form dropdown
```

### Tour-Based Filtering

Listings are filtered by selected tour:
```
Selected Tour: "Spring in Paris"

Shows:
✅ Listing 1: Spring in Paris - Standard Double - Double
✅ Listing 2: Spring in Paris - Standard Double - Single
✅ Listing 3: Spring in Paris - Deluxe Suite - Double

Doesn't Show:
❌ Listing 4: Autumn in Rome - Standard Room - Double
```

## Booking Form Features

### Live Preview
As you fill the form:
- **Selected Room Card**: Shows room details, price, availability
- **Total Price Calculator**: Updates as you change quantity
- **Availability Warning**: Shows max rooms available

### Validation
The form validates:
- ✅ Tour selected
- ✅ Room/listing selected
- ✅ Quantity > 0 and ≤ available
- ✅ Customer name provided
- ✅ Valid email format

### Information Cards

**Tour Information Card:**
- Tour name
- Tour dates
- Number of available listings

**Selected Room Card:**
- Room type
- Occupancy type
- Price per room
- Available rooms
- Contract name
- Purchase type (Inventory/Buy-to-Order)
- **Live total price calculation**

## Business Impact

### Track Sales Performance
- Which tours are selling best?
- Which room types are most popular?
- Which occupancy levels are preferred?
- Revenue trends over time

### Manage Inventory
- See real-time availability
- Prevent overbooking
- Track utilization rates
- Identify slow-moving inventory

### Customer Management
- Customer booking history
- Email for communications
- Booking status tracking
- Cancellation management

## Tips

1. **Check Listings First**: Before booking, verify listings exist for your tours
2. **Monitor Availability**: Use the Available column in Listings to track inventory
3. **Create Test Bookings**: Try creating and cancelling bookings to see the effects
4. **Watch Statistics**: The stat cards update instantly with each booking
5. **Cancellations**: Remember cancelled bookings return inventory

## Technical Details

### Database Impact
```typescript
addBooking() {
  1. Validate availability
  2. Create booking record
  3. Update listing.sold += quantity  ← Automatic
  4. Return success
}

cancelBooking() {
  1. Find booking
  2. Update listing.sold -= quantity  ← Automatic
  3. Mark booking as cancelled
}
```

### Data Consistency
The system ensures:
- Sold count never exceeds quantity
- Available is always (quantity - sold)
- Cancellations properly return inventory
- No overbooking possible

## Next Steps

After mastering bookings:
1. Create more listings for different room types
2. Add multiple occupancy options per tour
3. Experiment with inventory vs buy-to-order
4. Track which listings sell fastest
5. Use data to optimize pricing

---

**Remember:** Every booking you create immediately affects inventory. Check the Listings page before and after booking to see the real-time updates!

