/**
 * STATS GRID
 * Dashboard-style stats cards for unified inventory
 */

import { Card, CardContent } from '@/components/ui/card'
import { 
  Package, 
  FileText, 
  DollarSign, 
  CheckCircle2,
} from 'lucide-react'

interface StatsGridProps {
  totalItems: number
  totalContracts: number
  totalRates: number
  activeRates: number
  itemBreakdown?: Record<string, number>
}

export function StatsGrid({
  totalItems,
  totalContracts,
  totalRates,
  activeRates,
  itemBreakdown
}: StatsGridProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Inventory Items</p>
              <p className="text-2xl font-bold">{totalItems}</p>
              {itemBreakdown && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {Object.entries(itemBreakdown).map(([type, count]) => (
                    <span key={type} className="text-xs text-muted-foreground">
                      {count} {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Contracts</p>
              <p className="text-2xl font-bold">{totalContracts}</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Rates</p>
              <p className="text-2xl font-bold">{totalRates}</p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Rates</p>
              <p className="text-2xl font-bold">{activeRates}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

