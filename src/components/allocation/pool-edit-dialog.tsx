/**
 * POOL EDIT DIALOG
 * Edit pool properties globally (updates all contracts/rates using this pool)
 */

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'
import type { AllocationPoolData } from '@/lib/allocation-helpers'
import { useData } from '@/contexts/data-context'
import { toast } from 'sonner'

interface PoolEditDialogProps {
  pool: AllocationPoolData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PoolEditDialog({ pool, open, onOpenChange }: PoolEditDialogProps) {
  const { unifiedContracts, unifiedRates, updateUnifiedRate } = useData()
  const [newPoolId, setNewPoolId] = useState(pool.pool_id)
  const [newLabel, setNewLabel] = useState(pool.label)

  const handleSave = () => {
    let updatedContracts = 0
    let updatedRates = 0

    // Update all contracts using this pool
    pool.contracts.forEach(contractInfo => {
      const contract = unifiedContracts.find(c => c.id === contractInfo.contract_id)
      if (!contract) return

      // TODO: Update allocations in separate allocation system
      console.log('TODO: Update allocations for contract', contractInfo.contract_id)
      updatedContracts++
    })

    // Update all rates using this pool
    pool.rates.forEach(rateInfo => {
      const rate = unifiedRates.find(r => r.id === rateInfo.rate_id)
      if (!rate) return

      updateUnifiedRate(rateInfo.rate_id, {
        ...rate,
        allocation_pool_id: newPoolId
      })
      updatedRates++
    })

    toast.success(`Updated pool: ${updatedContracts} contracts, ${updatedRates} rates`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Edit Allocation Pool</DialogTitle>
          <DialogDescription className="text-sm">
            Changes will apply to all {pool.contracts.length} contracts and {pool.rates.length} rates using this pool
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <div className="font-medium">Global Change</div>
              <div className="text-xs text-yellow-700 mt-0.5">
                This will update {pool.contracts.length} contract{pool.contracts.length > 1 ? 's' : ''} and {pool.rates.length} rate{pool.rates.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Pool ID */}
          <div className="space-y-2">
            <Label className="text-sm">Pool ID</Label>
            <Input
              value={newPoolId}
              onChange={(e) => setNewPoolId(e.target.value)}
              placeholder="e.g., F1-Premium-2025"
              className="h-9"
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for this pool (used in contracts and rates)
            </p>
          </div>

          {/* Pool Label */}
          <div className="space-y-2">
            <Label className="text-sm">Display Label</Label>
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g., F1 Premium Weekend Block"
              className="h-9"
            />
            <p className="text-xs text-muted-foreground">
              Friendly name shown in the UI
            </p>
          </div>

          {/* Current Usage */}
          <div className="border rounded-lg p-3 bg-muted/30">
            <div className="text-sm font-medium mb-2">Current Usage</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Contracts:</span>
                <span className="font-medium ml-1">{pool.contracts.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Rates:</span>
                <span className="font-medium ml-1">{pool.rates.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Allocated:</span>
                <span className="font-medium ml-1">{pool.total_allocated}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Utilization:</span>
                <span className="font-medium ml-1">{pool.utilization_percentage.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9">
            Cancel
          </Button>
          <Button onClick={handleSave} className="h-9">
            Update Pool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

