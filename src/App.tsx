import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { DataProvider } from '@/contexts/data-context'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Toaster } from '@/components/ui/sonner'
import { Dashboard } from '@/pages/dashboard'
import { Tours } from '@/pages/tours'

import { InventoryManagement } from '@/pages/inventory-management'
import { ServiceProviders } from '@/pages/service-providers'
import { Hotels } from '@/pages/hotels'
import { Operations } from '@/pages/operations'
import { Bookings } from '@/pages/bookings'

import { BookingsCreate } from '@/pages/bookings-create'
import { RoomingList } from '@/pages/rooming-list'
import { Suppliers } from '@/pages/suppliers'
import { Payments } from '@/pages/payments'
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

              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="service-providers" element={<ServiceProviders />} />
              <Route path="hotels" element={<Hotels />} />
              <Route path="operations" element={<Operations />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="payments" element={<Payments />} />
              <Route path="bookings" element={<Bookings />} />

              <Route path="bookings/create" element={<BookingsCreate />} />
              <Route path="rooming-list" element={<RoomingList />} />
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

