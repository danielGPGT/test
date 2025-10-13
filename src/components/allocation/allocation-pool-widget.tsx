/**
 * ALLOCATION POOL WIDGET
 * Quick access widget showing allocation pool summary
 * Can be embedded in inventory or contract pages
 */

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, AlertTriangle } from 'lucide-react'
import { useData } from '@/contexts/data-context'
import { useNavigate } from 'react-router-dom'
import {
  aggregateAllocationPools,
  getAllocationStats,
  findAllocationConflicts,
} from '@/lib/allocation-helpers'
import { cn } from '@/lib/utils'

interface AllocationPoolWidgetProps {
  itemId?: number
  contractId?: number
  compact?: boolean
}

export function AllocationPoolWidget({ itemId, contractId, compact = false }: AllocationPoolWidgetProps) {
  const { unifiedContracts, unifiedRates, inventoryItems, allocations } = useData()
  const navigate = useNavigate()
  
  // Filter data based on props
  const filteredContracts = useMemo(() => {
    if (contractId) {
      return unifiedContracts.filter(c => c.id === contractId)
    }
    if (itemId) {
      return unifiedContracts.filter(c => c.item_id === itemId)
    }
    return unifiedContracts
  }, [unifiedContracts, itemId, contractId])
  
  const filteredRates = useMemo(() => {
    if (contractId) {
      return unifiedRates.filter(r => r.contract_id === contractId)
    }
    if (itemId) {
      return unifiedRates.filter(r => r.item_id === itemId)
    }
    return unifiedRates
  }, [unifiedRates, itemId, contractId])
  
  const pools = useMemo(() => 
    aggregateAllocationPools(filteredContracts, filteredRates, inventoryItems, allocations),
    [filteredContracts, filteredRates, inventoryItems, allocations]
  )
  
  const stats = useMemo(() => getAllocationStats(pools), [pools])
  const conflicts = useMemo(() => findAllocationConflicts(pools), [pools])
  
  if (pools.length === 0) {
    return null
  }
  
  if (compact) {
    return (
      <div className="bg-card border rounded-lg p-2 flex items-center justify-between hover:border-primary/50 transition-colors">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <div className="text-sm">
            <span className="font-medium">{pools.length}</span>
            <span className="text-muted-foreground ml-1">
              • {stats.total_allocated} units • {stats.avg_utilization.toFixed(0)}%
            </span>
          </div>
        </div>
        
        {conflicts.length > 0 && (
          <Badge variant="destructive" className="text-xs h-5">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {conflicts.length}
          </Badge>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/allocation-management')}
          className="h-6 px-2 text-xs"
        >
          View →
        </Button>
      </div>
    )
  }
  
  return (
    <Card>
      <CardContent className="p-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">
              {pools.length} Pool{pools.length > 1 ? 's' : ''}
            </span>
            {conflicts.length > 0 && (
              <Badge variant="destructive" className="text-xs h-4 px-1.5">
                {conflicts.length}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/allocation-management')}
            className="h-6 px-2 text-xs"
          >
            View All →
          </Button>
        </div>
        
        {/* Inline Stats */}
        <div className="flex gap-3 mb-2 text-xs text-muted-foreground">
          <span>{stats.total_allocated} allocated</span>
          <span>•</span>
          <span>{stats.total_booked} booked</span>
          <span>•</span>
          <span className={cn(
            "font-medium",
            stats.avg_utilization > 90 ? "text-red-600" :
            stats.avg_utilization > 75 ? "text-yellow-600" :
            ""
          )}>{stats.avg_utilization.toFixed(0)}% used</span>
        </div>
        
        {/* Compact Pool List */}
        <div className="space-y-1">
          {pools.slice(0, 5).map(pool => {
            const getStatusColor = () => {
              switch (pool.status) {
                case 'overbooked': return 'bg-red-500'
                case 'critical': return 'bg-orange-500'
                case 'warning': return 'bg-yellow-500'
                default: return 'bg-primary'
              }
            }
            
            return (
              <div key={pool.pool_id} className="flex items-center gap-2 text-xs">
                <div className="flex-1 min-w-0 truncate">{pool.label || pool.pool_id}</div>
                <div className="w-20 flex items-center gap-1">
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all", getStatusColor())}
                      style={{ width: `${Math.min(pool.utilization_percentage, 100)}%` }}
                    />
                  </div>
                  <span className="font-medium text-xs w-8 text-right">
                    {pool.utilization_percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            )
          })}
          
          {pools.length > 5 && (
            <div className="text-center text-xs text-muted-foreground pt-0.5">
              +{pools.length - 5} more
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

