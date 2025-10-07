# Setup Instructions

## Quick Start

Follow these steps to get the application running:

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React & React DOM
- React Router DOM
- Tailwind CSS & plugins
- Radix UI components
- Lucide React icons
- TypeScript & Vite

### 2. Start Development Server

```bash
npm run dev
```

The application will start on `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
```

### 4. Preview Production Build

```bash
npm run preview
```

## What's Included

### Pages (All Fully Functional)

1. **Dashboard** (`/`)
   - 3 statistics cards (Active Tours, Available Rooms, Upcoming Contracts)
   - Recent Activity timeline

2. **Tours** (`/tours`)
   - Searchable data table with pagination
   - Create/Edit/Delete functionality
   - Fields: Name, Start Date, End Date, Description

3. **Hotels** (`/hotels`)
   - Full CRUD operations with **embedded room type management**
   - Fields: Name, Location, City, Country, Star Rating, Phone, Email, Description
   - **Room Groups (JSONB)**: Define room types directly on hotel
     - Add/remove room types inline when creating/editing hotels
     - Each room group: Room Type, Capacity, Description, Features
   - Hotels table shows room type count

4. **Contracts** (`/contracts`)
   - Hotel contract management
   - Fields: Hotel, Contract Name, Dates, Rooms, Base Rate, Currency, Tax, Notes

5. **Rates** (`/rates`)
   - Room rate configuration with multi-occupancy support
   - Rates are derived from contracts (inherit currency, tax rate, and dates)
   - Fields: Contract, Room Type (from hotel's room_groups), Occupancy Type (Single/Double/Triple/Quad), Rate
   - Auto-populates contract details when selected
   - Shows room types from contract's hotel's room_groups

6. **Listings** (`/listings`)
   - **THE KEY LINK: Allocates room inventory to specific tours**
   - Smart filtering: only shows contracts overlapping with tour dates
   - Auto-populates prices from rates
   - Fields: Tour, Contract, Room Type (from hotel's room_groups), Occupancy, Quantity/Target, Type, Price, Sold
   - **Inventory**: Quantity = hard limit, Available = strict count
   - **Buy-to-Order**: Quantity = soft target, Available = "flexible" (can exceed!)

7. **Bookings** (`/bookings`)
   - **Book rooms and see inventory update in real-time!**
   - Select a tour, choose available rooms, enter customer details
   - **Inventory bookings**: Instantly confirmed (strict quantity limit)
   - **Buy-to-Order bookings**: Pending until operations purchases (flexible - can exceed target!)
   - Purchase form tracks: who purchased, hotel contact, cost, profit margin
   - Automatically updates listing's "sold" count and "available" inventory
   - Supports cancellations (returns rooms to inventory)
   - Shows booking statistics: total bookings, revenue, rooms sold

8. **Reports** (`/reports`)
   - Placeholder page for future analytics

### Features

✅ Modern, responsive UI with shadcn/ui components
✅ Light/Dark mode toggle (click moon/sun icon in header)
✅ Side navigation with active state
✅ Breadcrumb navigation in header
✅ User menu dropdown
✅ Notifications button
✅ Searchable data tables with pagination
✅ Modal forms for all CRUD operations
✅ Data validation
✅ Formatted display (dates, currency, percentages)
✅ Badge formatting for listing types
✅ Confirmation dialogs for delete operations
✅ Relationship management between entities
✅ Fully typed with TypeScript
✅ Mock data that persists during session

### Architecture

- **React 18** with hooks and functional components
- **TypeScript** for type safety
- **Vite** for fast development and building
- **React Router v6** for navigation
- **Context API** for state management (mock data)
- **Tailwind CSS** for styling
- **shadcn/ui** for accessible UI components
- **Radix UI** for headless component primitives

### Key Files

- `src/App.tsx` - Main app with routing
- `src/contexts/data-context.tsx` - Mock data and CRUD operations
- `src/components/layout/` - Layout components
- `src/components/ui/` - Reusable UI components
- `src/pages/` - Page components
- `tailwind.config.js` - Tailwind configuration
- `vite.config.ts` - Vite configuration

## Next Steps

To connect to a real backend:

1. Replace the mock data context in `src/contexts/data-context.tsx` with API calls
2. Add authentication/authorization
3. Implement the Reports page with actual analytics
4. Add form validation with a library like Zod or Yup
5. Add loading states and error handling
6. Implement export functionality (CSV, PDF)
7. Add data filtering and advanced search
8. Implement real-time updates with WebSockets

## Troubleshooting

**Port already in use:**
```bash
npm run dev -- --port 3000
```

**Clear node_modules and reinstall:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Build errors:**
Make sure you're using Node.js 16 or higher:
```bash
node --version
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

Enjoy building with your Tours Inventory Management System! 🚀

