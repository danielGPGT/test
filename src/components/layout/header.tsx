import { useLocation, Link } from 'react-router-dom'
import { Bell, User, Settings, LogOut, Moon, Sun, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/theme-provider'
import { useData } from '@/contexts/data-context'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/tours': 'Tours',
  '/hotels': 'Hotels',
  '/contracts': 'Contracts',
  '/rates': 'Rates',
  '/inventory': 'Inventory Setup',
  '/listings': 'Listings',
  '/bookings': 'Bookings',
  '/reports': 'Reports',
}

export function Header() {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const { resetAllData } = useData()
  const currentPage = routeTitles[location.pathname] || 'Dashboard'

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    ...(location.pathname !== '/' ? [{ label: currentPage, path: location.pathname }] : [])
  ]

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center">
              {index > 0 && <span className="mx-2 text-muted-foreground">/</span>}
              <Link
                to={crumb.path}
                className={cn(
                  "hover:text-foreground transition-colors",
                  index === breadcrumbs.length - 1
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {crumb.label}
              </Link>
            </div>
          ))}
        </nav>

        {/* Right side - User menu, notifications, theme toggle */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  resetAllData()
                  toast.success('Data reset to initial state')
                }}
                className="text-orange-600"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                <span>Reset All Data</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

