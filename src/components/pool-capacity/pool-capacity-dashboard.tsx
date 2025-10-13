/**
 * POOL CAPACITY DASHBOARD
 * Main dashboard for managing pool capacity and bookings
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Package, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Search,
  Plus,
  Eye,
  Edit,
  BarChart3
} from 'lucide-react'
import { useData } from '@/contexts/data-context'
import type { AllocationPoolCapacity } from '@/types/unified-inventory'
import { getPoolUtilizationStats } from '@/lib/pool-capacity-helpers'
import { PoolCreationDialog } from './pool-creation-dialog'
import { PoolEditDialog } from './pool-edit-dialog'
import { CategoryPoolOverview } from './category-pool-overview'

interface PoolCapacityDashboardProps {
  onEditPool?: (pool: AllocationPoolCapacity) => void
  onViewBookings?: (poolId: string) => void
  onCreateBooking?: (poolId: string) => void
}

export function PoolCapacityDashboard({ 
  onViewBookings, 
  onCreateBooking 
}: PoolCapacityDashboardProps) {
  const { allocationPoolCapacity, setAllocationPoolCapacity, addAllocationPoolCapacity, updateAllocationPoolCapacity, inventoryItems } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPool, setEditingPool] = useState<AllocationPoolCapacity | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null)

  // Filter pools
  const filteredPools = useMemo(() => {
    return allocationPoolCapacity.filter(pool => {
      const matchesSearch = pool.pool_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pool.item_name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || pool.status === statusFilter
      const matchesItemType = itemTypeFilter === 'all' || pool.item_type === itemTypeFilter
      
      return matchesSearch && matchesStatus && matchesItemType
    })
  }, [allocationPoolCapacity, searchTerm, statusFilter, itemTypeFilter])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = allocationPoolCapacity.length
    const healthy = allocationPoolCapacity.filter(p => p.status === 'healthy').length
    const warning = allocationPoolCapacity.filter(p => p.status === 'warning').length
    const critical = allocationPoolCapacity.filter(p => p.status === 'critical').length
    const overbooked = allocationPoolCapacity.filter(p => p.status === 'overbooked').length
    
    const totalCapacity = allocationPoolCapacity.reduce((sum, p) => sum + p.total_capacity, 0)
    const totalBookings = allocationPoolCapacity.reduce((sum, p) => sum + p.current_bookings, 0)
    const totalAvailable = totalCapacity - totalBookings
    
    return {
      total,
      healthy,
      warning,
      critical,
      overbooked,
      totalCapacity,
      totalBookings,
      totalAvailable,
      utilizationPercentage: totalCapacity > 0 ? (totalBookings / totalCapacity) * 100 : 0
    }
  }, [allocationPoolCapacity])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'critical': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'overbooked': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'critical': return <AlertTriangle className="w-4 h-4" />
      case 'overbooked': return <AlertTriangle className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const handleCleanupDuplicates = () => {
    // Clean up any duplicates
    const uniquePools = new Map<string, AllocationPoolCapacity>()
    allocationPoolCapacity.forEach(pool => {
      if (!uniquePools.has(pool.pool_id)) {
        uniquePools.set(pool.pool_id, pool)
      }
    })
    
    const cleanedPools = Array.from(uniquePools.values())
    const hadDuplicates = cleanedPools.length !== allocationPoolCapacity.length
    
    if (hadDuplicates) {
      setAllocationPoolCapacity(cleanedPools)
      console.log(`✅ Cleaned up ${allocationPoolCapacity.length - cleanedPools.length} duplicate pools`)
    } else {
      console.log('✅ No duplicates found')
    }
  }

  const handleCreatePool = (poolData: Omit<AllocationPoolCapacity, 'last_updated'>) => {
    addAllocationPoolCapacity(poolData)
    setIsCreateDialogOpen(false)
  }

  const handleEditPool = (pool: AllocationPoolCapacity) => {
    setEditingPool(pool)
  }

  const handleSavePool = (poolId: string, updates: Partial<AllocationPoolCapacity>) => {
    updateAllocationPoolCapacity(poolId, updates)
    setEditingPool(null)
  }

  // const handleDeletePool = (poolId: string) => {
  //   if (confirm('Are you sure you want to delete this pool? This action cannot be undone.')) {
  //     deleteAllocationPoolCapacity(poolId)
  //   }
  // }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pool Capacity Management</h1>
          <p className="text-muted-foreground">
            Manage allocation pools and track capacity across all inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCleanupDuplicates}>
            Clean Duplicates
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Pool
          </Button>
        </div>
      </div>

      {/* Item Selection for Category Overview */}
      {selectedItemId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Category & Pool Overview
              {selectedPoolId && (
                <Badge variant="secondary" className="mr-2">
                  Pool: {selectedPoolId}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => {
                setSelectedItemId(null)
                setSelectedPoolId(null)
              }}>
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPoolOverview 
              item={inventoryItems.find(i => i.id === selectedItemId)!} 
              selectedPoolId={selectedPoolId || undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pools</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold">{stats.totalCapacity}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Bookings</p>
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilization</p>
                <p className="text-2xl font-bold">{stats.utilizationPercentage.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={getStatusColor('healthy')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Healthy</p>
                <p className="text-xl font-bold">{stats.healthy}</p>
              </div>
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className={getStatusColor('warning')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Warning</p>
                <p className="text-xl font-bold">{stats.warning}</p>
              </div>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className={getStatusColor('critical')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Critical</p>
                <p className="text-xl font-bold">{stats.critical}</p>
              </div>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className={getStatusColor('overbooked')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Overbooked</p>
                <p className="text-xl font-bold">{stats.overbooked}</p>
              </div>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search pools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="overbooked">Overbooked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hotel">Hotels</SelectItem>
                <SelectItem value="ticket">Tickets</SelectItem>
                <SelectItem value="transfer">Transfers</SelectItem>
                <SelectItem value="activity">Activities</SelectItem>
                <SelectItem value="meal">Meals</SelectItem>
                <SelectItem value="venue">Venues</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="experience">Experiences</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pools Table */}
      <Card>
        <CardHeader>
          <CardTitle>Allocation Pools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPools.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pools found matching your criteria</p>
              </div>
            ) : (
              filteredPools.map((pool) => {
                const utilization = getPoolUtilizationStats(pool)
                return (
                  <div
                    key={pool.pool_id}
                    className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className={getStatusColor(pool.status)}>
                            {getStatusIcon(pool.status)}
                            <span className="ml-1 capitalize">{pool.status}</span>
                          </Badge>
                          <h3 className="font-semibold">{pool.pool_id}</h3>
                          <Badge variant="secondary">{pool.item_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {pool.item_name}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Capacity:</span>
                            <span className="ml-1 font-medium">{pool.total_capacity}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Current Bookings:</span>
                            <span className="ml-1 font-medium">{pool.current_bookings}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Available:</span>
                            <span className="ml-1 font-medium">{pool.available_spots}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Utilization:</span>
                            <span className="ml-1 font-medium">{utilization.utilizationPercentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewBookings?.(pool.pool_id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Bookings
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCreateBooking?.(pool.pool_id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Book
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItemId(pool.item_id)
                            setSelectedPoolId(pool.pool_id)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Categories
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPool(pool)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PoolCreationDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSave={handleCreatePool}
      />

      <PoolEditDialog
        pool={editingPool}
        open={!!editingPool}
        onClose={() => setEditingPool(null)}
        onSave={handleSavePool}
      />
    </div>
  )
}
