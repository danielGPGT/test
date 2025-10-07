import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <p className="text-sm text-muted-foreground">
          © 2025 Acme Tours Inventory Management
        </p>
        <div className="flex gap-4">
          <Link
            to="/terms"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms
          </Link>
          <Link
            to="/privacy"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}

