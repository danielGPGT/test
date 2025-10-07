# Tours Inventory Management System

A modern, full-featured tours inventory management application built with React, Vite, TypeScript, and shadcn/ui.

## Features

- 📊 **Dashboard** - Overview of active tours, available rooms, and upcoming contracts with recent activity timeline
- 🗓️ **Tours Management** - Create, edit, and manage tour packages
- 🏨 **Hotels Management** - Maintain hotel information with embedded room types (room_groups)
- 📋 **Contracts** - Hotel agreements with base rates, taxes (VAT, city tax), fees (resort fee), and supplier commission
- 💰 **Rates** - Multi-occupancy AND board type pricing (Room Only, B&B, Half Board, Full Board, All-Inclusive)
- 📝 **Listings** - Allocate inventory to tours with full pricing breakdown (cost, selling price, profit margin)
- 🛒 **Bookings** - Book rooms and see real-time inventory updates (inventory = instant, buy-to-order = operations workflow)
- 📈 **Reports** - Analytics and reporting dashboard (placeholder)

## Tech Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **UI Library:** shadcn/ui (Radix UI + Tailwind CSS)
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **State Management:** React Context API

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components (DashboardLayout, SideNav, Header, Footer)
│   ├── ui/              # Reusable UI components (shadcn/ui)
│   └── theme-provider.tsx
├── contexts/
│   └── data-context.tsx # Mock data and CRUD operations
├── lib/
│   └── utils.ts         # Utility functions
├── pages/               # Page components
│   ├── dashboard.tsx
│   ├── tours.tsx
│   ├── hotels.tsx
│   ├── contracts.tsx
│   ├── rooms.tsx
│   ├── rates.tsx
│   ├── listings.tsx
│   └── reports.tsx
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## Features in Detail

### Dashboard
- Statistics cards showing active tours, available rooms, and upcoming contracts
- Recent activity timeline with system updates

### Data Management
- Full CRUD operations for all entities (Tours, Hotels, Contracts, Rooms, Rates, Listings)
- Searchable and paginated data tables
- Modal forms for creating and editing records
- Relationship management between entities (e.g., rooms belong to hotels, rates belong to contracts)

### UI/UX
- Clean, modern interface with shadcn/ui components
- Light/Dark mode support
- Responsive design
- Accessible components built on Radix UI
- Intuitive navigation with active state indicators
- Confirmation dialogs for destructive actions

## Mock Data

The application uses a context-based mock data layer that simulates a backend API. All changes are stored in memory and will reset on page refresh.

To connect to a real backend, replace the `DataProvider` in `src/contexts/data-context.tsx` with API calls to your backend service.

## Customization

### Theme Colors

The primary color is set to blue. To change it, modify the CSS variables in `src/index.css`:

```css
:root {
  --primary: 217.2 91.2% 59.8%; /* Blue */
}
```

### Adding New Pages

1. Create a new page component in `src/pages/`
2. Add a route in `src/App.tsx`
3. Add a navigation item in `src/components/layout/side-nav.tsx`

## License

MIT

