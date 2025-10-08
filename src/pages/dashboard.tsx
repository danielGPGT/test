import { useMemo } from 'react'
import { Calendar, Bed, Briefcase, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react'
import { StatsCard } from '@/components/ui/stats-card'
import { Timeline } from '@/components/ui/timeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/data-context'
import { formatCurrency } from '@/lib/utils'

export function Dashboard() {
  const { summary, recentActivity, listings, bookings, tours } = useData()

  // Calculate financial metrics
  const metrics = useMemo(() => {
    // Total revenue from confirmed bookings
    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.total_price, 0)

    // Total inventory value (cost)
    const totalInventoryCost = listings
      .filter(l => l.purchase_type === 'inventory')
      .reduce((sum, l) => sum + ((l.cost_price || 0) * (l.quantity || 0)), 0)

    // Potential revenue from all unsold inventory
    const potentialRevenue = listings
      .reduce((sum, l) => sum + ((l.selling_price || 0) * ((l.quantity || 0) - (l.sold || 0))), 0)

    // Actual profit from sold rooms
    const actualProfit = listings
      .reduce((sum, l) => sum + (((l.selling_price || 0) - (l.cost_price || 0)) * (l.sold || 0)), 0)

    // Average margin across all listings
    const avgMargin = listings.length > 0
      ? listings.reduce((sum, l) => {
          const sellingPrice = l.selling_price || 0
          const costPrice = l.cost_price || 0
          const margin = sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0
          return sum + margin
        }, 0) / listings.length
      : 0

    // Inventory utilization
    const totalAllocated = listings.reduce((sum, l) => sum + (l.quantity || 0), 0)
    const totalSold = listings.reduce((sum, l) => sum + (l.sold || 0), 0)
    const utilization = totalAllocated > 0 ? (totalSold / totalAllocated) * 100 : 0

    // Pending purchases count - check for buy_to_order rooms in bookings
    const pendingPurchases = bookings.filter(b => 
      b.status === 'pending' && b.rooms.some(r => r.purchase_type === 'buy_to_order')
    ).length

    return {
      totalRevenue,
      totalInventoryCost,
      potentialRevenue,
      actualProfit,
      avgMargin,
      utilization,
      pendingPurchases,
      totalAllocated,
      totalSold
    }
  }, [bookings, listings])

  // Top performing listings
  const topListings = useMemo(() => {
    return [...listings]
      .map(l => ({
        ...l,
        revenue: (l.selling_price || 0) * (l.sold || 0),
        profit: ((l.selling_price || 0) - (l.cost_price || 0)) * (l.sold || 0),
        utilization: (l.quantity || 0) > 0 ? ((l.sold || 0) / (l.quantity || 0)) * 100 : 0
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5)
  }, [listings])

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
          title="Actual Profit"
          value={formatCurrency(metrics.actualProfit)}
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
              {metrics.totalSold} / {metrics.totalAllocated} rooms sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.potentialRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From unsold inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalInventoryCost)}</div>
            <p className="text-xs text-muted-foreground">
              Pre-purchased inventory cost
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
        {/* Top Performing Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topListings.map((listing, index) => (
                <div key={listing.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{listing.tourName}</p>
                      <p className="text-xs text-muted-foreground">
                        {listing.roomName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      {formatCurrency(listing.profit)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {listing.sold} sold ({listing.utilization.toFixed(0)}%)
                    </p>
                  </div>
                </div>
              ))}
              {topListings.length === 0 && (
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

      {/* Purchase Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inventory Listings:</span>
                <Badge>{listings.filter(l => l.purchase_type === 'inventory').length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Buy-to-Order Listings:</span>
                <Badge variant="secondary">{listings.filter(l => l.purchase_type === 'buy_to_order').length}</Badge>
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
                <span className="text-sm text-muted-foreground">Total Rooms Available:</span>
                <Badge variant="outline">{listings.length} listings</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inventory Rooms:</span>
                <Badge variant="outline">{listings.filter(l => l.purchase_type === 'inventory').reduce((sum, l) => sum + (l.quantity || 0), 0)} rooms</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Profit Margin:</span>
                <Badge variant="outline" className="text-green-600">{metrics.avgMargin.toFixed(1)}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Listings:</span>
                <Badge variant="outline">{listings.length}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
