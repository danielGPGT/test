/**
 * UNIFIED RATES TABLE
 * Polymorphic table that displays rates for any inventory type
 * Conditionally shows type-specific columns
 */

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Pencil, Copy, Trash2, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { BOARD_TYPE_LABELS, formatTimeSlot } from '@/types/unified-inventory'
import type { UnifiedRate, InventoryItemType } from '@/types/unified-inventory'
import { ItemTypeBadge } from './item-type-badge'
import { DirectionBadge } from '@/components/transfers'

interface UnifiedRatesTableProps {
  rates: UnifiedRate[]
  itemType?: InventoryItemType  // If showing single item type
  showItemType?: boolean  // Show item type column
  showSource?: boolean  // Show contract/buy-to-order source
  onEdit: (rate: UnifiedRate) => void
  onClone: (rate: UnifiedRate) => void
  onDelete: (rate: UnifiedRate) => void
}

// Helper function to format valid days
const formatValidDays = (daysOfWeek: any) => {
  if (!daysOfWeek) return 'All Days'
  
  const days = []
  if (daysOfWeek.monday) days.push('Mon')
  if (daysOfWeek.tuesday) days.push('Tue')
  if (daysOfWeek.wednesday) days.push('Wed')
  if (daysOfWeek.thursday) days.push('Thu')
  if (daysOfWeek.friday) days.push('Fri')
  if (daysOfWeek.saturday) days.push('Sat')
  if (daysOfWeek.sunday) days.push('Sun')
  
  // If all 7 days are selected, show "All Days"
  if (days.length === 7) return 'All Days'
  
  // Otherwise show the selected days
  return days.join(', ')
}

export function UnifiedRatesTable({
  rates,
  itemType,
  showItemType = false,
  showSource = true,
  onEdit,
  onClone,
  onDelete
}: UnifiedRatesTableProps) {
  if (rates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No rates found
        </CardContent>
      </Card>
    )
  }

  // Determine which type-specific columns to show
  const hasHotels = !itemType || itemType === 'hotel' || rates.some(r => r.item_type === 'hotel')
  const hasTransfers = !itemType || itemType === 'transfer' || rates.some(r => r.item_type === 'transfer')
  
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}>
              <tr>
                {showItemType && (
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">
                    Type
                  </th>
                )}
                <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">
                  Category
                </th>
                {showSource && (
                  <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">
                    Source
                  </th>
                )}
                {hasHotels && (
                  <>
                    <th className="text-center p-3 font-semibold text-xs uppercase tracking-wide">
                      Occupancy
                    </th>
                    <th className="text-center p-3 font-semibold text-xs uppercase tracking-wide">
                      Board
                    </th>
                  </>
                )}
                {hasTransfers && (
                  <th className="text-center p-3 font-semibold text-xs uppercase tracking-wide">
                    Direction
                  </th>
                )}
                <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">
                  Pool
                </th>
                <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">
                  Valid Dates
                </th>
                <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">
                  Valid Days
                </th>
                <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">
                  Time Slots
                </th>
                <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">
                  Group Pricing
                </th>
                <th className="text-left p-3 font-semibold text-xs uppercase tracking-wide">
                  Pool Status
                </th>
                <th className="text-right p-3 font-semibold text-xs uppercase tracking-wide">
                  Base Rate
                </th>
                <th className="text-right p-3 font-semibold text-xs uppercase tracking-wide">
                  Markup
                </th>
                <th className="text-right p-3 font-semibold text-xs uppercase tracking-wide">
                  Selling Price
                </th>
                <th className="text-center p-3 font-semibold text-xs uppercase tracking-wide">
                  Status
                </th>
                <th className="text-center p-3 font-semibold text-xs uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate, idx) => (
                <tr
                  key={rate.id}
                  className={`${rate.active ? 'hover:bg-muted/30' : 'opacity-50'} transition-colors`}
                  style={{ borderTop: idx > 0 ? '1px solid hsl(var(--border))' : 'none' }}
                >
                  {showItemType && (
                    <td className="p-3">
                      <ItemTypeBadge itemType={rate.item_type} />
                    </td>
                  )}
                  
                  <td className="p-3">
                    <div className="font-medium">{rate.categoryName || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{rate.itemName}</div>
                  </td>
                  
                  {showSource && (
                    <td className="p-3">
                      {rate.contractName ? (
                        <div>
                          <div className="font-medium text-xs">{rate.contractName}</div>
                          <div className="text-xs text-muted-foreground">Contract</div>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Buy-to-Order
                        </Badge>
                      )}
                    </td>
                  )}
                  
                  {hasHotels && (
                    <>
                      <td className="p-3 text-center">
                        {rate.item_type === 'hotel' && rate.rate_details?.occupancy_type ? (
                          <Badge variant="outline" className="text-xs">
                            {rate.rate_details.occupancy_type}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {rate.item_type === 'hotel' && rate.rate_details?.board_type ? (
                          <div className="text-xs">{BOARD_TYPE_LABELS[rate.rate_details.board_type]}</div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </>
                  )}
                  
                  {hasTransfers && (
                    <td className="p-3 text-center">
                      {rate.item_type === 'transfer' && rate.rate_details?.direction ? (
                        <DirectionBadge direction={rate.rate_details.direction} compact={true} />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  )}
                  
                  <td className="p-3">
                    {rate.allocation_pool_id ? (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                        <Package className="h-3 w-3 mr-1" />
                        {rate.allocation_pool_id}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  
                  <td className="p-3">
                    {rate.valid_from && rate.valid_to ? (
                      <div className="text-xs">
                        <div>{new Date(rate.valid_from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                        <div className="text-muted-foreground">
                          to {new Date(rate.valid_to).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  
                  <td className="p-3">
                    <span className="text-xs text-muted-foreground">
                      {formatValidDays(rate.days_of_week)}
                    </span>
                  </td>
                  
                  {/* Time Slots */}
                  <td className="p-3">
                    {rate.rate_details?.schedule_config?.has_time_slots && rate.rate_details.schedule_config.time_slots.length > 0 ? (
                      <div className="text-xs">
                        {rate.rate_details.schedule_config.time_slots.slice(0, 2).map((slot, idx) => (
                          <div key={idx} className="text-muted-foreground">
                            {formatTimeSlot(slot)}
                          </div>
                        ))}
                        {rate.rate_details.schedule_config.time_slots.length > 2 && (
                          <div className="text-muted-foreground">
                            +{rate.rate_details.schedule_config.time_slots.length - 2} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  
                  {/* Group Pricing */}
                  <td className="p-3">
                    {rate.rate_details?.group_pricing?.has_group_pricing && rate.rate_details.group_pricing.pricing_tiers.length > 0 ? (
                      <div className="text-xs">
                        <div className="text-muted-foreground">
                          {rate.rate_details.group_pricing.pricing_tiers.length} tiers
                        </div>
                        <div className="text-muted-foreground">
                          {rate.rate_details.group_pricing.pricing_mode === 'per_person' ? 'Per Person' : 
                           rate.rate_details.group_pricing.pricing_mode === 'per_group' ? 'Per Group' : 'Tiered'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  
                  {/* Pool Status */}
                  <td className="p-3">
                    {rate.allocation_pool_id ? (
                      <div className="text-xs">
                        <div className="text-muted-foreground">
                          Pool: {rate.allocation_pool_id}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Pool Managed
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No Pool</span>
                    )}
                  </td>
                  
                  <td className="p-3 text-right font-mono text-muted-foreground">
                    {formatCurrency(rate.base_rate, rate.currency)}
                  </td>
                  
                  <td className="p-3 text-right">
                    <div className="font-medium" style={{ color: 'hsl(var(--primary))' }}>
                      {((rate.markup_percentage || 0) * 100).toFixed(0)}%
                    </div>
                  </td>
                  
                  <td className="p-3 text-right font-semibold">
                    {formatCurrency(rate.selling_price, rate.currency)}
                  </td>
                  
                  <td className="p-3 text-center">
                    {rate.active ? (
                      <Badge className="text-xs bg-green-500 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </td>
                  
                  <td className="p-3">
                    <div className="flex justify-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(rate)}
                        title="Edit rate"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onClone(rate)}
                        title="Clone rate"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(rate)}
                        title="Delete rate"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

