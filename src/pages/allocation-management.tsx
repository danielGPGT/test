/**
 * ALLOCATION MANAGEMENT PAGE
 * Compact, scalable view for managing hundreds/thousands of allocation pools
 * Optimized for performance and minimal screen real estate
 */

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Package, 
  AlertTriangle, 
  Search,
  ChevronDown,
  ChevronUp,
  Edit
} from 'lucide-react'
import { useData } from '@/contexts/data-context'
import {
  aggregateAllocationPools,
  getContractAllocationSummaries,
  getAllocationStats,
  findAllocationConflicts,
  type AllocationPoolData,
  type ContractAllocationSummary
} from '@/lib/allocation-helpers'
import { ITEM_TYPE_LABELS } from '@/types/unified-inventory'
import { cn } from '@/lib/utils'
import { PoolEditDialog } from '@/components/allocation/pool-edit-dialog'

export function AllocationManagement() {
  const { unifiedContracts, unifiedRates, inventoryItems, allocations } = useData()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterItemType, setFilterItemType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'pools' | 'contracts'>('pools')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  
  // Pool editing
  const [editingPool, setEditingPool] = useState<AllocationPoolData | null>(null)
  
  // Aggregate pools
  const allPools = useMemo(() => 
    aggregateAllocationPools(unifiedContracts, unifiedRates, inventoryItems, allocations),
    [unifiedContracts, unifiedRates, inventoryItems, allocations]
  )
  
  // Contract summaries
  const contractSummaries = useMemo(() =>
    getContractAllocationSummaries(unifiedContracts, unifiedRates, inventoryItems, allocations),
    [unifiedContracts, unifiedRates, inventoryItems, allocations]
  )
  
  // Statistics
  const stats = useMemo(() => getAllocationStats(allPools), [allPools])
  
  // Conflicts
  const conflicts = useMemo(() => findAllocationConflicts(allPools), [allPools])
  
  // Filtered pools
  const filteredPools = useMemo(() => {
    return allPools.filter(pool => {
      const matchesSearch = searchTerm === '' || 
        pool.pool_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.item_name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || pool.status === filterStatus
      const matchesType = filterItemType === 'all' || pool.item_type === filterItemType
      
      return matchesSearch && matchesStatus && matchesType
    })
  }, [allPools, searchTerm, filterStatus, filterItemType])
  
  // Filtered contracts
  const filteredContracts = useMemo(() => {
    return contractSummaries.filter(contract => {
      const matchesSearch = searchTerm === '' ||
        contract.contract_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.item_name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = filterItemType === 'all' || contract.item_type === filterItemType
      
      return matchesSearch && matchesType
    })
  }, [contractSummaries, searchTerm, filterItemType])

  // Pagination
  const paginatedPools = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredPools.slice(start, end)
  }, [filteredPools, currentPage])
  
  const totalPages = Math.ceil(filteredPools.length / itemsPerPage)

  return (
    <div className="space-y-4 p-6">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Allocation Pools</h1>
          <p className="text-sm text-muted-foreground">
            {stats.total_pools} pools • {stats.total_allocated} units • {stats.avg_utilization.toFixed(0)}% utilized
          </p>
        </div>
        {conflicts.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {conflicts.length} Need Attention
          </Badge>
        )}
      </div>

      {/* Compact Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card border rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Pools</div>
          <div className="text-lg font-bold">{stats.total_pools}</div>
        </div>
        <div className="bg-card border rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Allocated</div>
          <div className="text-lg font-bold">{stats.total_allocated}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {stats.total_booked} booked
          </div>
        </div>
        <div className="bg-card border rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Utilization</div>
          <div className={cn(
            "text-lg font-bold",
            stats.avg_utilization > 90 ? "text-red-600" :
            stats.avg_utilization > 75 ? "text-yellow-600" :
            ""
          )}>{stats.avg_utilization.toFixed(0)}%</div>
        </div>
        <div className="bg-card border rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Issues</div>
          <div className="text-lg font-bold text-red-600">
            {stats.critical_pools + stats.overbooked_pools}
          </div>
        </div>
      </div>

      {/* Compact Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <div className="flex-1">
            <span className="text-sm font-medium text-red-900">
              {conflicts.length} pool{conflicts.length > 1 ? 's' : ''} need attention:
            </span>
            <span className="text-xs text-red-700 ml-2">
              {conflicts.slice(0, 3).map(p => p.label || p.pool_id).join(', ')}
              {conflicts.length > 3 && ` +${conflicts.length - 3} more`}
            </span>
          </div>
        </div>
      )}

      {/* Compact Filters Bar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'pools' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('pools')}
            className="h-8 text-xs"
          >
            Pools
          </Button>
          <Button
            variant={viewMode === 'contracts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('contracts')}
            className="h-8 text-xs"
          >
            Contracts
          </Button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-7 text-sm"
          />
        </div>

        {viewMode === 'pools' && (
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="overbooked">Overbooked</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select value={filterItemType} onValueChange={setFilterItemType}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="text-xs text-muted-foreground">
          {filteredPools.length} of {allPools.length}
        </div>
      </div>

      {/* Main Content - Compact List */}
      {viewMode === 'pools' ? (
        <>
          {paginatedPools.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No pools found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1.5">
              {paginatedPools.map(pool => (
                <CompactPoolRow 
                  key={pool.pool_id} 
                  pool={pool} 
                  onEdit={() => setEditingPool(pool)}
                />
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages} ({filteredPools.length} pools)
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-7 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-7 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-1.5">
          {filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No contracts found</p>
              </CardContent>
            </Card>
          ) : (
            filteredContracts.map(contract => (
              <CompactContractRow key={contract.contract_id} contract={contract} />
            ))
          )}
        </div>
      )}
      
      {/* Pool Edit Dialog */}
      {editingPool && (
        <PoolEditDialog
          pool={editingPool}
          open={!!editingPool}
          onOpenChange={(open) => !open && setEditingPool(null)}
        />
      )}
    </div>
  )
}

// Compact Pool Row Component
function CompactPoolRow({ pool, onEdit }: { pool: AllocationPoolData; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false)
  
  const getStatusDot = () => {
    switch (pool.status) {
      case 'healthy': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-orange-500'
      case 'overbooked': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }
  
  return (
    <div className="bg-card border rounded-lg hover:border-primary/50 transition-colors">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-2 flex items-center gap-3 text-left"
      >
        {/* Status Dot */}
        <div className={cn("w-2 h-2 rounded-full", getStatusDot())} />
        
        {/* Pool Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{pool.label || pool.pool_id}</span>
            <span className="text-xs text-muted-foreground">• {pool.item_name}</span>
          </div>
        </div>
        
        {/* Utilization Bar */}
        <div className="w-32">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                pool.status === 'overbooked' ? "bg-red-500" :
                pool.status === 'critical' ? "bg-orange-500" :
                pool.status === 'warning' ? "bg-yellow-500" :
                "bg-primary"
              )}
              style={{ width: `${Math.min(pool.utilization_percentage, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Stats */}
        <div className="text-right text-xs">
          <div className="font-bold">{pool.utilization_percentage.toFixed(0)}%</div>
          <div className="text-muted-foreground">{pool.total_booked}/{pool.total_allocated}</div>
        </div>
        
        {/* Edit Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="h-7 w-7 p-0"
        >
          <Edit className="h-3 w-3" />
        </Button>
        
        {/* Expand Icon */}
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      
      {/* Expanded Details */}
      {expanded && (
        <div className="px-3 pb-2 pt-1 border-t space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Contracts:</span> <span className="font-medium">{pool.contracts.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Rates:</span> <span className="font-medium">{pool.rates.length}</span>
            </div>
          </div>
          
          {pool.contracts.length > 0 && (
            <div className="space-y-1">
              {pool.contracts.map((contract, idx) => (
                <div key={idx} className="text-xs flex justify-between bg-muted/50 p-1.5 rounded">
                  <span className="truncate">{contract.contract_name}</span>
                  <span className="font-medium">{contract.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Compact Contract Row Component
function CompactContractRow({ contract }: { contract: ContractAllocationSummary }) {
  const [expanded, setExpanded] = useState(false)
  
  const utilization = contract.total_allocated > 0 
    ? (contract.total_booked / contract.total_allocated) * 100 
    : 0
  
  return (
    <div className="bg-card border rounded-lg hover:border-primary/50 transition-colors">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-2 flex items-center gap-3 text-left"
      >
        {/* Contract Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{contract.contract_name}</span>
            <span className="text-xs text-muted-foreground">• {contract.supplier_name}</span>
          </div>
        </div>
        
        {/* Utilization Bar */}
        <div className="w-32">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Stats */}
        <div className="text-right text-xs">
          <div className="font-bold">{utilization.toFixed(0)}%</div>
          <div className="text-muted-foreground">{contract.total_booked}/{contract.total_allocated}</div>
        </div>
        
        {/* Expand Icon */}
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      
      {/* Expanded Details */}
      {expanded && (
        <div className="px-3 pb-2 pt-1 border-t space-y-1">
          {contract.allocations.map((alloc, idx) => (
            <div key={idx} className="text-xs flex justify-between items-center bg-muted/50 p-1.5 rounded">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {alloc.pool_id && (
                  <Badge variant="secondary" className="text-xs h-4 px-1.5">
                    {alloc.pool_id}
                  </Badge>
                )}
                <span className="truncate">{alloc.category_names.join(', ')}</span>
              </div>
              <span className="font-medium">{alloc.booked}/{alloc.quantity}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

