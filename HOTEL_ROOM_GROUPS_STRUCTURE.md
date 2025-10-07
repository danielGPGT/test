# Hotel Room Groups Structure

## Overview

Room types are stored as a **JSONB field** (`room_groups`) directly on the Hotels table, not as a separate entity. This aligns with the database schema and provides a more natural data model.

## Why Room Groups on Hotels?

### Traditional Approach (Separate Table)
```
❌ Hotels Table → Rooms Table (separate)
❌ More joins needed
❌ More complex queries
❌ Two separate management UIs
```

### Room Groups Approach (JSONB)
```
✅ Hotels Table with room_groups JSONB field
✅ Room types embedded in hotel record
✅ Simpler queries (no joins)
✅ Manage room types inline with hotel
✅ Better data locality
```

## Data Structure

### Hotel with Room Groups

```typescript
{
  id: 1,
  name: "Hotel Le Champs",
  location: "Paris, FR",
  city: "Paris",
  country: "France",
  description: "Boutique hotel near the Champs-Élysées",
  star_rating: 4,
  phone: "+33 1 23 45 67 89",
  email: "info@lechamps.com",
  room_groups: [  // ← JSONB field
    {
      id: "rg-1",
      room_type: "Standard Double",
      capacity: 2,
      description: "Cozy room with two beds",
      features: "Wi-Fi, TV, minibar"
    },
    {
      id: "rg-2",
      room_type: "Deluxe Suite",
      capacity: 4,
      description: "Spacious suite with living area",
      features: "Wi-Fi, TV, minibar, kitchenette, balcony"
    },
    {
      id: "rg-3",
      room_type: "Executive Room",
      capacity: 2,
      description: "Business-class room",
      features: "Wi-Fi, TV, minibar, work desk, coffee machine"
    }
  ]
}
```

### RoomGroup Interface

```typescript
interface RoomGroup {
  id: string          // Unique ID (e.g., "rg-1")
  room_type: string   // "Standard Double", "Deluxe Suite", etc.
  capacity: number    // Maximum occupancy
  description?: string
  features?: string   // Comma-separated or text
}
```

## Hotel Management UI

### Creating/Editing Hotels

When you create or edit a hotel, you can manage room types inline:

**Hotel Form Sections:**
1. Basic Info (name, location, city, country)
2. Details (star rating, phone, email)
3. Description
4. **Room Types** (embedded management)

**Room Types Section:**
```
┌─────────────────────────────────────┐
│ Room Types                          │
├─────────────────────────────────────┤
│                                     │
│ [Standard Double]  Capacity: 2      │
│ Cozy room with two beds             │
│ Features: Wi-Fi, TV, minibar        │
│                            [Remove] │
│                                     │
│ [Deluxe Suite]  Capacity: 4         │
│ Spacious suite with living area     │
│ Features: Wi-Fi, TV, minibar...     │
│                            [Remove] │
├─────────────────────────────────────┤
│ Add Room Type                       │
│                                     │
│ Room Type: [_________] Capacity: [] │
│ Description: [___________________]  │
│ Features: [_______________________] │
│                                     │
│               [+ Add Room Type]     │
└─────────────────────────────────────┘
```

### Add Room Type

While creating/editing a hotel:
1. Fill in room type details (type, capacity, description, features)
2. Click "Add Room Type"
3. Room type added to list
4. Can add multiple room types
5. Can remove any room type
6. Save hotel with all room types at once

## How Other Entities Reference Room Types

### Rates Reference Room Groups

```typescript
{
  id: 1,
  contract_id: 1,
  room_group_id: "rg-1",  // ← References hotel.room_groups[].id
  occupancy_type: "double",
  rate: 130
}
```

When selecting room type in Rates form:
1. Select contract
2. System finds contract's hotel
3. Shows hotel's room_groups in dropdown
4. User selects room group by ID

### Listings Reference Room Groups

```typescript
{
  id: 1,
  tour_id: 1,
  contract_id: 1,
  room_group_id: "rg-1",  // ← References hotel.room_groups[].id
  occupancy_type: "double",
  quantity: 80,
  price: 140
}
```

Same pattern - room types come from contract's hotel's room_groups.

## Benefits

### 1. Data Locality
All hotel information in one place:
```
Hotel → room_groups are right there
No need to query separate table
```

### 2. Simpler Queries
```javascript
// Old way (separate rooms table)
const rooms = await db.rooms.find({ hotel_id: hotelId })

// New way (JSONB field)
const rooms = hotel.room_groups
```

### 3. Atomic Updates
```javascript
// Update hotel and room types in one transaction
await db.hotels.update(hotelId, {
  name: "Updated Name",
  room_groups: updatedRoomGroups
})
```

### 4. Better UI/UX
- Manage everything hotel-related in one form
- See all room types when viewing a hotel
- No context switching between pages

### 5. JSONB Benefits
- Flexible schema
- Can add fields to room groups without migrations
- Fast indexing (`GIN` index on room_groups)
- Query within JSONB if needed

## Database Schema Match

This structure matches your PostgreSQL schema:

```sql
create table public.rh_hotels (
  id text not null,
  name text null,
  city text null,
  country text null,
  room_groups jsonb null,  -- ← JSONB field for room types
  ...
  constraint rh_hotels_pkey primary key (id)
);

create index rh_hotels_room_groups_idx 
  on public.rh_hotels using gin (room_groups);
```

## Example Workflows

### Creating a New Hotel with Room Types

1. **Click "New Hotel"**
2. **Fill basic info:**
   - Name: "Hotel Le Champs"
   - City: "Paris"
   - Country: "France"
   - Star Rating: 4

3. **Add room types:**
   - Room Type: "Standard Double", Capacity: 2
   - Click "Add Room Type"
   - Room Type: "Deluxe Suite", Capacity: 4
   - Click "Add Room Type"

4. **Click "Create"**
   - Hotel saved with 2 room types embedded

### Editing Hotel Room Types

1. **Edit hotel**
2. **See existing room types listed**
3. **Can remove any room type** (click trash icon)
4. **Can add new room types**
5. **Save** - all room types updated atomically

### Using Room Types in Rates

1. **Create rate**
2. **Select contract** (e.g., "May 2025 Block" at Hotel Le Champs)
3. **Room Type dropdown shows:** Hotel Le Champs' room_groups
   - Standard Double (Capacity: 2)
   - Deluxe Suite (Capacity: 4)
4. **Select room type**
5. **Set occupancy and rate**

## Migration from Old Structure

If you had separate Rooms table:

**Old:**
```typescript
rooms: [
  { id: 1, hotel_id: 1, room_type: "Standard Double", capacity: 2 }
]
```

**New:**
```typescript
hotels: [
  {
    id: 1,
    name: "Hotel",
    room_groups: [
      { id: "rg-1", room_type: "Standard Double", capacity: 2 }
    ]
  }
]
```

**Update references:**
- `room_id` → `room_group_id` (string instead of number)
- Join through contract's hotel instead of separate rooms table

## UI Updates

### Hotels Table

New column: **Room Types** (count)
```
ID | Name            | Location   | Star | Room Types | Actions
1  | Hotel Le Champs | Paris, FR  | 4★   | 2          | [Edit][Delete]
```

Shows how many room types each hotel has.

### Hotels Form

Embedded room groups management:
- List of existing room types (with remove buttons)
- Form to add new room types
- All saved together with hotel

### Rates/Listings Forms

When selecting room type:
- Dropdown populated from `contract.hotel.room_groups`
- Shows room type name and capacity
- References room_group_id (string)

## Summary

**Key Changes:**
- ✅ Room types are now `room_groups` JSONB field on hotels
- ✅ Managed inline when creating/editing hotels
- ✅ Referenced by `room_group_id` (string) instead of `room_id` (number)
- ✅ No separate Rooms page/table
- ✅ Simpler data model, better data locality
- ✅ Matches your PostgreSQL schema exactly

**Benefits:**
- Cleaner data model
- Easier to manage (one place)
- Better performance (no joins)
- Flexible schema (JSONB)
- Matches industry standard hotel data structures

---

**To try it:** Edit a hotel and add/remove room types to see the inline management!

