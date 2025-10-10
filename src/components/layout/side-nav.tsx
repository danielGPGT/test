import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Calendar, 
  Building2,
  FileText,
  DollarSign,
  Warehouse,
  List,
  ShoppingCart,
  BarChart,
  ShoppingBag,
  Users,
  Truck,
  CreditCard,
  Package,
  ClipboardList
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap = {
  dashboard: LayoutDashboard,
  calendar: Calendar,
  building: Building2,
  'file-text': FileText,
  'dollar-sign': DollarSign,
  warehouse: Warehouse,
  package: Package,
  'clipboard-list': ClipboardList,
  truck: Truck,
  'credit-card': CreditCard,
  list: List,
  'shopping-cart': ShoppingCart,
  'shopping-bag': ShoppingBag,
  'bar-chart': BarChart,
  users: Users,
}

interface NavItem {
  title: string
  icon: keyof typeof iconMap
  route: string
}

const navItems: NavItem[] = [
  { title: "Dashboard", icon: "dashboard", route: "/" },
  { title: "Tours", icon: "calendar", route: "/tours" },
  { title: "Inventory Setup", icon: "warehouse", route: "/inventory" },
  { title: "Service Types", icon: "package", route: "/service-providers" },
  { title: "Service Inventory", icon: "warehouse", route: "/service-inventory" },
  { title: "Operations", icon: "clipboard-list", route: "/operations" },
  { title: "Suppliers", icon: "truck", route: "/suppliers" },
  { title: "Payments", icon: "credit-card", route: "/payments" },
  { title: "Create Booking", icon: "shopping-cart", route: "/bookings/create" },
  { title: "Bookings", icon: "shopping-bag", route: "/bookings" },
  { title: "Rooming List", icon: "users", route: "/rooming-list" },
  { title: "Reports", icon: "bar-chart", route: "/reports" }
]

export function SideNav() {
  const location = useLocation()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">Acme Tours</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive = location.pathname === item.route
          
          return (
            <Link
              key={item.route}
              to={item.route}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

