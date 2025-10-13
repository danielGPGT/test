/**
 * CONTRACT CARD
 * Compact display for contracts with quick actions
 * Works for all inventory types
 */

import { Button } from '@/components/ui/button'
import { Pencil, Copy, Trash2, Plus } from 'lucide-react'
import type { UnifiedContract } from '@/types/unified-inventory'
import { ItemTypeBadge } from './item-type-badge'

interface ContractCardProps {
  contract: UnifiedContract
  rateCount: number
  onEdit: (contract: UnifiedContract) => void
  onClone: (contract: UnifiedContract) => void
  onDelete: (contract: UnifiedContract) => void
  onAddRate: (contract: UnifiedContract) => void
}

export function ContractCard({
  contract,
  rateCount,
  onEdit,
  onClone,
  onDelete,
  onAddRate
}: ContractCardProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <ItemTypeBadge itemType={contract.item_type} showIcon={false} />
          <span className="font-medium text-sm">{contract.contract_name}</span>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
          <span>{contract.supplierName}</span>
          <span>•</span>
          <span>{rateCount} rate{rateCount !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span>{((contract.markup_percentage || 0) * 100).toFixed(0)}% markup</span>
          {contract.tourNames && contract.tourNames.length > 0 && (
            <>
              <span>•</span>
              <span className="text-primary">{contract.tourNames.join(', ')}</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(contract)}
        >
          <Pencil className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onClone(contract)}
        >
          <Copy className="h-3 w-3 mr-1" />
          Clone
        </Button>
        <Button
          size="sm"
          variant="default"
          onClick={() => onAddRate(contract)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Rate
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(contract)}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

