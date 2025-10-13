/**
 * ALLOCATION POOL CARD
 * Reusable component to display allocation pool information
 * Works for all inventory types (hotels, tickets, transfers, etc.)
 */

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package } from 'lucide-react'

interface AllocationPoolCardProps {
  poolId: string
  totalAllocation: number
  booked: number
  contractCount: number
  rateCount: number
  itemType?: string
}

export function AllocationPoolCard({
  poolId,
  totalAllocation,
  booked,
  contractCount,
  rateCount,
  itemType
}: AllocationPoolCardProps) {
  const available = totalAllocation - booked
  const utilization = totalAllocation > 0 ? (booked / totalAllocation) * 100 : 0

  return (
    <Card className="bg-accent/30 border-accent">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
              <Package className="h-3 w-3 mr-1" />
              {poolId}
            </Badge>
            {itemType && (
              <Badge variant="outline" className="text-xs">
                {itemType}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {contractCount} contract{contractCount !== 1 ? 's' : ''} • {rateCount} rate{rateCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-xs font-medium">
            {available}/{totalAllocation} available
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              utilization < 30 ? 'bg-green-500' : 
              utilization < 70 ? 'bg-yellow-500' : 
              'bg-destructive'
            }`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
        
        <div className="text-xs text-muted-foreground mt-1">
          {utilization.toFixed(0)}% utilized
          {booked > 0 && ` • ${booked} booked`}
        </div>
      </CardContent>
    </Card>
  )
}

