/**
 * ITEM TYPE BADGE
 * Shows inventory item type with appropriate icon and color
 */

import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Ticket, 
  Car, 
  Compass, 
  Utensils, 
  MapPin, 
  Truck, 
  Sparkles, 
  Package 
} from 'lucide-react'
import type { InventoryItemType } from '@/types/unified-inventory'
import { ITEM_TYPE_LABELS } from '@/types/unified-inventory'

interface ItemTypeBadgeProps {
  itemType: InventoryItemType
  showIcon?: boolean
  variant?: 'default' | 'secondary' | 'outline'
  className?: string
}

const ICON_MAP: Record<InventoryItemType, any> = {
  hotel: Building2,
  ticket: Ticket,
  transfer: Car,
  activity: Compass,
  meal: Utensils,
  venue: MapPin,
  transport: Truck,
  experience: Sparkles,
  other: Package
}

const COLOR_MAP: Record<InventoryItemType, string> = {
  hotel: 'bg-blue-100 text-blue-800 border-blue-200',
  ticket: 'bg-purple-100 text-purple-800 border-purple-200',
  transfer: 'bg-green-100 text-green-800 border-green-200',
  activity: 'bg-orange-100 text-orange-800 border-orange-200',
  meal: 'bg-pink-100 text-pink-800 border-pink-200',
  venue: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  transport: 'bg-teal-100 text-teal-800 border-teal-200',
  experience: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200'
}

export function ItemTypeBadge({ 
  itemType, 
  showIcon = true, 
  variant = 'secondary',
  className = '' 
}: ItemTypeBadgeProps) {
  const Icon = ICON_MAP[itemType]
  const colorClass = variant === 'secondary' ? COLOR_MAP[itemType] : ''

  return (
    <Badge variant={variant} className={`text-xs ${colorClass} ${className}`}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {ITEM_TYPE_LABELS[itemType]}
    </Badge>
  )
}

