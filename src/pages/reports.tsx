import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PricingCalculator } from '@/components/pricing-calculator'

export function Reports() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Reports & Tools</h1>
      
      {/* Pricing Calculator */}
      <PricingCalculator />
      
      <Card>
        <CardHeader>
          <CardTitle>Future Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Additional reports and analytics can include:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li>Revenue reports by tour, hotel, or time period</li>
            <li>Occupancy rates and availability statistics</li>
            <li>Contract performance metrics</li>
            <li>Board type popularity analysis</li>
            <li>Profit margin trends</li>
            <li>Inventory vs buy-to-order performance comparison</li>
            <li>Sales trends and forecasting</li>
            <li>Export functionality for financial data</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

