/**
 * ALLOCATION STATS BADGE
 * Tiny inline badge showing allocation status
 * Perfect for inline display in lists or cards
 */

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Package, AlertTriangle } from 'lucide-react'
import { useData } from '@/contexts/data-context'
import { aggregateAllocationPools, getAllocationStats } from '@/lib/allocation-helpers'

interface AllocationStatsBadgeProps {
  itemId?: number
  contractId?: number
  showDetails?: boolean
}

export function AllocationStatsBadge({ itemId, contractId, showDetails = false }: AllocationStatsBadgeProps) {
  const { unifiedContracts, unifiedRates, inventoryItems, allocations } = useData()
  
  const filteredContracts = useMemo(() => {
    if (contractId) {
      return unifiedContracts.filter(c => c.id === contractId)
    }
    if (itemId) {
      return unifiedContracts.filter(c => c.item_id === itemId)
    }
    return []
  }, [unifiedContracts, itemId, contractId])
  
  const filteredRates = useMemo(() => {
    if (contractId) {
      return unifiedRates.filter(r => r.contract_id === contractId)
    }
    if (itemId) {
      return unifiedRates.filter(r => r.item_id === itemId)
    }
    return []
  }, [unifiedRates, itemId, contractId])
  
  const pools = useMemo(() => 
    aggregateAllocationPools(filteredContracts, filteredRates, inventoryItems, allocations),
    [filteredContracts, filteredRates, inventoryItems, allocations]
  )
  
  const stats = useMemo(() => getAllocationStats(pools), [pools])
  
  if (pools.length === 0) {
    return null
  }
  
  const hasIssues = stats.critical_pools > 0 || stats.overbooked_pools > 0
  
  if (!showDetails) {
    return (
      <Badge 
        variant={hasIssues ? "destructive" : "secondary"}
        className="text-xs"
      >
        <Package className="h-3 w-3 mr-1" />
        {pools.length} Pool{pools.length > 1 ? 's' : ''}
        {hasIssues && <AlertTriangle className="h-3 w-3 ml-1" />}
      </Badge>
    )
  }
  
  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-xs">
        <Package className="h-3 w-3 mr-1" />
        {pools.length}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {stats.total_allocated} units • {stats.avg_utilization.toFixed(0)}% used
      </span>
      {hasIssues && (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {stats.critical_pools + stats.overbooked_pools}
        </Badge>
      )}
    </div>
  )
}

