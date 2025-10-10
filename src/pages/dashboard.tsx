import { useMemo } from 'react'
import { Calendar, Bed, Briefcase, TrendingUp, DollarSign, ShoppingCart, Hotel } from 'lucide-react'
import { StatsCard } from '@/components/ui/stats-card'
import { Timeline } from '@/components/ui/timeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/data-context'
import { formatCurrency } from '@/lib/utils'

export function Dashboard() {
  const { summary, recentActivity, bookings, tours, contracts, rates, hotels } = useData()

  // Calculate financial metrics
  const metrics = useMemo(() => {
    // Total revenue from confirmed bookings
    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.total_price, 0)

    // Total rooms allocated across all contracts
    const totalAllocated = contracts.reduce((sum, c) => 
      sum + (c.room_allocations?.reduce((roomSum, alloc) => roomSum + alloc.quantity, 0) || 0), 0
    )

    // Total rooms booked
    const totalBooked = bookings
      .filter(b => b.status !== 'cancelled' && b.rooms)
      .flatMap(b => b.rooms)
      .reduce((sum, r) => sum + r.quantity, 0)

    // Inventory utilization
    const utilization = totalAllocated > 0 ? (totalBooked / totalAllocated) * 100 : 0

    // Calculate profit from bookings (estimate based on 60% markup)
    // In real system, you'd track actual costs
    const estimatedCost = totalRevenue / 1.6 // Reverse 60% markup
    const estimatedProfit = totalRevenue - estimatedCost
    const avgMargin = totalRevenue > 0 ? ((estimatedProfit / totalRevenue) * 100) : 0

    // Pending purchases count - check for buy_to_order rooms in bookings
    const pendingPurchases = bookings.filter(b => 
      b.status === 'pending' && b.rooms?.some(r => r.purchase_type === 'buy_to_order')
    ).length

    // Active contracts (not expired)
    const today = new Date().toISOString().split('T')[0]
    const activeContracts = contracts.filter(c => c.end_date >= today).length

    return {
      totalRevenue,
      estimatedProfit,
      avgMargin,
      utilization,
      pendingPurchases,
      totalAllocated,
      totalBooked,
      activeContracts
    }
  }, [bookings, contracts])

  // Top performing tours (based on bookings)
  const topTours = useMemo(() => {
    const tourStats = tours.map(tour => {
      const tourBookings = bookings.filter(b => b.tour_id === tour.id && b.status === 'confirmed')
      const revenue = tourBookings.reduce((sum, b) => sum + b.total_price, 0)
      const roomCount = tourBookings.flatMap(b => b.rooms || []).reduce((sum, r) => sum + r.quantity, 0)
      
      return {
        id: tour.id,
        name: tour.name,
        revenue,
        bookingCount: tourBookings.length,
        roomCount
      }
    })
      .filter(t => t.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
    
    return tourStats
  }, [tours, bookings])

  return (
    <div className="space-y-6">
      {/* Primary Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Active Tours"
          value={summary.activeToursCount}
          icon={Calendar}
          description={`${tours.length} total tours`}
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={DollarSign}
          description="From confirmed bookings"
        />
        <StatsCard
          title="Estimated Profit"
          value={formatCurrency(metrics.estimatedProfit)}
          icon={TrendingUp}
          description={`${metrics.avgMargin.toFixed(1)}% avg margin`}
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Utilization</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.utilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalBooked} / {metrics.totalAllocated} rooms booked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeContracts}</div>
            <p className="text-xs text-muted-foreground">
              Currently valid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hotels</CardTitle>
            <Hotel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hotels.length}</div>
            <p className="text-xs text-muted-foreground">
              In system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingPurchases}</div>
            <p className="text-xs text-muted-foreground">
              Buy-to-order awaiting action
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Performing Tours */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Tours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTours.map((tour, index) => (
                <div key={tour.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tour.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tour.bookingCount} booking{tour.bookingCount !== 1 ? 's' : ''} • {tour.roomCount} room{tour.roomCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      {formatCurrency(tour.revenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      revenue
                    </p>
                  </div>
                </div>
              ))}
              {topTours.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sales yet. Create bookings to see performance data.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline items={recentActivity} />
          </CardContent>
        </Card>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Contracts:</span>
                <Badge>{contracts.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Contracts:</span>
                <Badge variant="default">{metrics.activeContracts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Confirmed Bookings:</span>
                <Badge variant="default">{bookings.filter(b => b.status === 'confirmed').length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Bookings:</span>
                <Badge variant="secondary">{bookings.filter(b => b.status === 'pending').length}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Hotels:</span>
                <Badge variant="outline">{hotels.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Available Rates:</span>
                <Badge variant="outline">{rates.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Allocated Rooms:</span>
                <Badge variant="outline">{metrics.totalAllocated}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Margin:</span>
                <Badge variant="outline" className="text-green-600">{metrics.avgMargin.toFixed(1)}%</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
