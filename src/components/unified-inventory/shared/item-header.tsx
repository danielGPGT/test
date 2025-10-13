/**
 * ITEM HEADER
 * Header component for inventory items with actions
 * Polymorphic icon based on item type
 */

import { Button } from '@/components/ui/button'
import { Pencil, Plus, Package } from 'lucide-react'
import type { InventoryItem } from '@/types/unified-inventory'
import { ITEM_TYPE_LABELS } from '@/types/unified-inventory'
import { ItemTypeBadge } from './item-type-badge'

interface ItemHeaderProps {
  item: InventoryItem
  contractCount: number
  rateCount: number
  onEditItem: (item: InventoryItem) => void
  onAddContract: (item: InventoryItem) => void
  onAddBuyToOrderRate: (item: InventoryItem) => void
  onManageAllocation?: (item: InventoryItem) => void
}

export function ItemHeader({
  item,
  contractCount,
  rateCount,
  onEditItem,
  onAddContract,
  onAddBuyToOrderRate,
  onManageAllocation
}: ItemHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <ItemTypeBadge itemType={item.item_type} />
        <div>
          <h3 className="font-bold text-base">{item.name}</h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {item.location && (
              <>
                <span>{item.location}</span>
                <span>•</span>
              </>
            )}
            <span>{contractCount} contract{contractCount !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span>{rateCount} rate{rateCount !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span>{item.categories.length} categor{item.categories.length !== 1 ? 'ies' : 'y'}</span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEditItem(item)}
        >
          <Pencil className="h-3 w-3 mr-1" />
          Edit {ITEM_TYPE_LABELS[item.item_type] || 'Item'}
        </Button>
        <Button
          size="sm"
          variant="default"
          onClick={() => onAddContract(item)}
        >
          <Plus className="h-3 w-3 mr-1" />
          New Contract
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddBuyToOrderRate(item)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Buy-to-Order Rate
        </Button>
        {onManageAllocation && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onManageAllocation(item)}
          >
            <Package className="h-3 w-3 mr-1" />
            Pools
          </Button>
        )}
      </div>
    </div>
  )
}

