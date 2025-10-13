/**
 * POOL STATUS INDICATOR
 * Shows live pool availability when creating/editing a rate
 * Helps prevent overbooking
 */

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Package, AlertTriangle, CheckCircle } from 'lucide-react'
import { useData } from '@/contexts/data-context'
import { aggregateAllocationPools } from '@/lib/allocation-helpers'
import { cn } from '@/lib/utils'

interface PoolStatusIndicatorProps {
  poolId: string
  contractId?: number
  className?: string
}

export function PoolStatusIndicator({ poolId, className }: PoolStatusIndicatorProps) {
  const { unifiedContracts, unifiedRates, inventoryItems, allocations } = useData()
  
  const poolData = useMemo(() => {
    const pools = aggregateAllocationPools(unifiedContracts, unifiedRates, inventoryItems, allocations)
    return pools.find(p => p.pool_id === poolId)
  }, [unifiedContracts, unifiedRates, inventoryItems, allocations, poolId])
  
  if (!poolData) {
    return (
      <div className={cn("text-xs text-muted-foreground flex items-center gap-1", className)}>
        <Package className="h-3 w-3" />
        Pool: {poolId}
      </div>
    )
  }
  
  const getStatusColor = () => {
    if (poolData.status === 'overbooked') return 'text-red-600 bg-red-50 border-red-200'
    if (poolData.status === 'critical') return 'text-orange-600 bg-orange-50 border-orange-200'
    if (poolData.status === 'warning') return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }
  
  const getStatusIcon = () => {
    if (poolData.status === 'overbooked' || poolData.status === 'critical') {
      return <AlertTriangle className="h-3 w-3" />
    }
    return <CheckCircle className="h-3 w-3" />
  }
  
  return (
    <div className={cn("border rounded-lg p-2", getStatusColor(), className)}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {getStatusIcon()}
          <span className="text-xs font-medium">{poolData.label || poolData.pool_id}</span>
        </div>
        <Badge variant="outline" className="text-xs h-4 px-1.5">
          {poolData.utilization_percentage.toFixed(0)}%
        </Badge>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <span>Available: <span className="font-bold">{poolData.total_available}</span> of {poolData.total_allocated}</span>
        <span className="text-muted-foreground">{poolData.rates.length} rates</span>
      </div>
      
      {/* Mini progress bar */}
      <div className="mt-1.5 h-1 bg-background/50 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all",
            poolData.status === 'overbooked' ? "bg-red-500" :
            poolData.status === 'critical' ? "bg-orange-500" :
            poolData.status === 'warning' ? "bg-yellow-500" :
            "bg-green-500"
          )}
          style={{ width: `${Math.min(poolData.utilization_percentage, 100)}%` }}
        />
      </div>
      
      {/* Warning message */}
      {(poolData.status === 'critical' || poolData.status === 'overbooked') && (
        <div className="mt-1.5 text-xs font-medium">
          {poolData.status === 'overbooked' 
            ? '⚠️ Pool is overbooked!' 
            : '⚠️ Pool almost full - check availability'}
        </div>
      )}
    </div>
  )
}

