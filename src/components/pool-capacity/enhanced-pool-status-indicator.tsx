/**
 * ENHANCED POOL STATUS INDICATOR
 * Shows real-time pool capacity and availability status
 */

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Package, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  Eye,
  Edit
} from 'lucide-react'
import { useData } from '@/contexts/data-context'
import type { AllocationPoolCapacity } from '@/types/unified-inventory'
import { getPoolUtilizationStats } from '@/lib/pool-capacity-helpers'

interface EnhancedPoolStatusIndicatorProps {
  poolId: string
  compact?: boolean
  showBookings?: boolean
  onViewBookings?: (poolId: string) => void
  onEditPool?: (pool: AllocationPoolCapacity) => void
}

export function EnhancedPoolStatusIndicator({ 
  poolId, 
  compact = false, 
  showBookings = false,
  onViewBookings,
  onEditPool 
}: EnhancedPoolStatusIndicatorProps) {
  const { allocationPoolCapacity, poolBookings } = useData()

  // Get pool data
  const pool = useMemo(() => {
    return allocationPoolCapacity.find(p => p.pool_id === poolId)
  }, [allocationPoolCapacity, poolId])

  // Get recent bookings
  const recentBookings = useMemo(() => {
    if (!pool || !showBookings) return []
    
    return poolBookings
      .filter(booking => booking.pool_id === poolId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }, [poolBookings, poolId, showBookings])

  // Calculate utilization stats
  const utilization = useMemo(() => {
    if (!pool) return null
    return getPoolUtilizationStats(pool)
  }, [pool])

  if (!pool) {
    return (
      <Card className={compact ? 'p-3' : 'p-4'}>
        <CardContent className={compact ? 'p-0' : 'p-0'}>
          <div className="text-center text-muted-foreground">
            <Package className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Pool not found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'overbooked': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 90) return 'bg-orange-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
        <div className="flex items-center gap-1">
          {getStatusIcon(pool.status)}
          <span className="text-xs font-medium capitalize">{pool.status}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {pool.current_bookings}/{pool.total_capacity}
        </div>
        <div className="w-16">
          <Progress 
            value={utilization?.utilizationPercentage || 0} 
            className="h-1"
          />
        </div>
      </div>
    )
  }

  return (
    <Card className="p-4">
      <CardContent className="p-0">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">{pool.pool_id}</h3>
                <p className="text-sm text-muted-foreground">{pool.item_name}</p>
              </div>
            </div>
            <Badge variant="outline" className={getStatusColor(pool.status)}>
              {getStatusIcon(pool.status)}
              <span className="ml-1 capitalize">{pool.status}</span>
            </Badge>
          </div>

          {/* Capacity Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{pool.total_capacity}</div>
              <div className="text-xs text-muted-foreground">Total Capacity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{pool.current_bookings}</div>
              <div className="text-xs text-muted-foreground">Current Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{pool.available_spots}</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
          </div>

          {/* Utilization Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Utilization</span>
              <span className="font-medium">{utilization?.utilizationPercentage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={utilization?.utilizationPercentage || 0} 
              className={`h-2 ${getProgressColor(utilization?.utilizationPercentage || 0)}`}
            />
          </div>

          {/* Quick Stats */}
          {utilization && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>Peak: {utilization.peakOccupancy}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Days: {utilization.totalDays}</span>
              </div>
            </div>
          )}

          {/* Recent Bookings */}
          {showBookings && recentBookings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Recent Bookings</h4>
                {onViewBookings && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewBookings(poolId)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View All
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                {recentBookings.map(booking => (
                  <div key={booking.id} className="flex items-center justify-between text-xs">
                    <span>{booking.booking_reference}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {booking.status}
                      </Badge>
                      <span className="text-muted-foreground">
                        {new Date(booking.check_in).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {onViewBookings && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewBookings(poolId)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Bookings
              </Button>
            )}
            {onEditPool && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditPool(pool)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit Pool
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
