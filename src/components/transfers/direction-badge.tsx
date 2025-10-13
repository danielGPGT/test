/**
 * DIRECTION BADGE
 * Visual indicator for transfer directions
 * Shows icons and color-coding
 */

import { Badge } from '@/components/ui/badge'
import { ArrowRight, ArrowLeft, ArrowLeftRight, MoveRight } from 'lucide-react'
import type { ServiceDirection } from '@/types/unified-inventory'
import { cn } from '@/lib/utils'

interface DirectionBadgeProps {
  direction: ServiceDirection
  showLabel?: boolean
  className?: string
  compact?: boolean
}

export function DirectionBadge({ 
  direction, 
  showLabel = true, 
  className,
  compact = false 
}: DirectionBadgeProps) {
  const getDirectionConfig = () => {
    switch (direction) {
      case 'inbound':
        return {
          icon: ArrowRight,
          color: 'bg-green-100 text-green-700 border-green-300',
          label: 'Inbound'
        }
      case 'outbound':
        return {
          icon: ArrowLeft,
          color: 'bg-blue-100 text-blue-700 border-blue-300',
          label: 'Outbound'
        }
      case 'round_trip':
        return {
          icon: ArrowLeftRight,
          color: 'bg-purple-100 text-purple-700 border-purple-300',
          label: 'Round Trip'
        }
      case 'one_way':
      default:
        return {
          icon: MoveRight,
          color: 'bg-gray-100 text-gray-700 border-gray-300',
          label: 'One Way'
        }
    }
  }

  const config = getDirectionConfig()
  const Icon = config.icon

  if (compact) {
    return (
      <div className={cn("inline-flex items-center gap-1", className)}>
        <Icon className="h-3 w-3" />
        {showLabel && <span className="text-xs">{config.label}</span>}
      </div>
    )
  }

  return (
    <Badge variant="outline" className={cn("text-xs", config.color, className)}>
      <Icon className="h-3 w-3 mr-1" />
      {showLabel && config.label}
    </Badge>
  )
}

/**
 * Direction icon only (no badge wrapper)
 */
export function DirectionIcon({ direction, className }: { direction: ServiceDirection; className?: string }) {
  const getIcon = () => {
    switch (direction) {
      case 'inbound': return ArrowRight
      case 'outbound': return ArrowLeft
      case 'round_trip': return ArrowLeftRight
      default: return MoveRight
    }
  }

  const Icon = getIcon()
  return <Icon className={className} />
}

