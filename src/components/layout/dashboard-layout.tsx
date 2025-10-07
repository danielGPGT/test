import { Outlet } from 'react-router-dom'
import { SideNav } from './side-nav'
import { Header } from './header'
import { Footer } from './footer'

export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Side Navigation */}
      <SideNav />
      
      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <Outlet />
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

