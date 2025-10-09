import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { DataProvider } from '@/contexts/data-context'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Toaster } from '@/components/ui/sonner'
import { Dashboard } from '@/pages/dashboard'
import { Tours } from '@/pages/tours'
import { Hotels } from '@/pages/hotels'
import { Contracts } from '@/pages/contracts'
import { Rates } from '@/pages/rates'
import { InventorySetup } from '@/pages/inventory-setup'
import { Listings } from '@/pages/listings'
import { Bookings } from '@/pages/bookings'
import { BookingsNew } from '@/pages/bookings-new'
import { BookingsCreate } from '@/pages/bookings-create'
import { Reports } from '@/pages/reports'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="tours-inventory-theme">
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="tours" element={<Tours />} />
              <Route path="hotels" element={<Hotels />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="rates" element={<Rates />} />
              <Route path="inventory" element={<InventorySetup />} />
              <Route path="listings" element={<Listings />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="bookings-new" element={<BookingsNew />} />
              <Route path="bookings/create" element={<BookingsCreate />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </DataProvider>
    </ThemeProvider>
  )
}

export default App

