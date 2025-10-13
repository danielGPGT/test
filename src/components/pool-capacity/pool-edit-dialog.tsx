/**
 * POOL EDIT DIALOG
 * Edit existing allocation pools
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/data-context'
import type { AllocationPoolCapacity } from '@/types/unified-inventory'

interface PoolEditDialogProps {
  pool: AllocationPoolCapacity | null
  open: boolean
  onClose: () => void
  onSave: (poolId: string, updates: Partial<AllocationPoolCapacity>) => void
}

export function PoolEditDialog({ pool, open, onClose, onSave }: PoolEditDialogProps) {
  const { unifiedRates } = useData()
  const [formData, setFormData] = useState({
    pool_id: '',
    item_name: '',
    item_type: '',
    total_capacity: 0,
    allows_overbooking: false,
    overbooking_limit: 0,
    waitlist_enabled: false,
    waitlist_max_size: 0,
    minimum_booking_size: undefined as number | undefined,
    maximum_booking_size: undefined as number | undefined,
    minimum_nights: undefined as number | undefined,
    maximum_nights: undefined as number | undefined
  })

  // Update form data when pool changes
  useEffect(() => {
    if (pool) {
      setFormData({
        pool_id: pool.pool_id,
        item_name: pool.item_name,
        item_type: pool.item_type,
        total_capacity: pool.total_capacity,
        allows_overbooking: pool.allows_overbooking,
        overbooking_limit: pool.overbooking_limit || 0,
        waitlist_enabled: pool.waitlist_enabled,
        waitlist_max_size: pool.waitlist_max_size || 0,
        minimum_booking_size: pool.minimum_booking_size,
        maximum_booking_size: pool.maximum_booking_size,
        minimum_nights: pool.minimum_nights,
        maximum_nights: pool.maximum_nights
      })
    }
  }, [pool])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pool) return

    const updates: Partial<AllocationPoolCapacity> = {
      total_capacity: formData.total_capacity,
      allows_overbooking: formData.allows_overbooking,
      overbooking_limit: formData.overbooking_limit,
      waitlist_enabled: formData.waitlist_enabled,
      waitlist_max_size: formData.waitlist_max_size,
      minimum_booking_size: formData.minimum_booking_size,
      maximum_booking_size: formData.maximum_booking_size,
      minimum_nights: formData.minimum_nights,
      maximum_nights: formData.maximum_nights
    }

    onSave(pool.pool_id, updates)
    onClose()
  }

  // Get contracts and rates using this pool
  // TODO: Get contracts using this pool from separate allocation system
  const contractsUsingPool: any[] = []
  
  const ratesUsingPool = unifiedRates.filter(rate => 
    rate.allocation_pool_id === pool?.pool_id
  )

  if (!pool) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pool: {pool.pool_id}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pool Information (Read-only) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pool Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pool ID</Label>
                <Input value={formData.pool_id} disabled className="bg-muted" />
              </div>
              
              <div>
                <Label>Item Type</Label>
                <Input value={formData.item_type} disabled className="bg-muted" />
              </div>
            </div>
            
            <div>
              <Label>Item Name</Label>
              <Input value={formData.item_name} disabled className="bg-muted" />
            </div>
          </div>

          {/* Usage Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Usage</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contracts Using This Pool</Label>
                <div className="p-2 bg-muted rounded-md">
                  <Badge variant="outline">{contractsUsingPool.length} contracts</Badge>
                </div>
              </div>
              
              <div>
                <Label>Rates Using This Pool</Label>
                <div className="p-2 bg-muted rounded-md">
                  <Badge variant="outline">{ratesUsingPool.length} rates</Badge>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Current Bookings</Label>
                <div className="p-2 bg-muted rounded-md text-center">
                  <span className="text-lg font-semibold">{pool.current_bookings}</span>
                </div>
              </div>
              
              <div>
                <Label>Available Spots</Label>
                <div className="p-2 bg-muted rounded-md text-center">
                  <span className="text-lg font-semibold">{pool.available_spots}</span>
                </div>
              </div>
              
              <div>
                <Label>Status</Label>
                <div className="p-2 bg-muted rounded-md text-center">
                  <Badge variant="outline" className="capitalize">{pool.status}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Capacity Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Capacity Settings</h3>
            
            <div>
              <Label htmlFor="total_capacity">Total Capacity</Label>
              <Input
                id="total_capacity"
                type="number"
                min="1"
                value={formData.total_capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, total_capacity: parseInt(e.target.value) }))}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Warning: Changing capacity may affect existing contracts and rates
              </p>
            </div>
          </div>

          {/* Overbooking Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Overbooking Settings</h3>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="allows_overbooking"
                checked={formData.allows_overbooking}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allows_overbooking: checked }))}
              />
              <Label htmlFor="allows_overbooking">Allow Overbooking</Label>
            </div>
            
            {formData.allows_overbooking && (
              <div>
                <Label htmlFor="overbooking_limit">Overbooking Limit</Label>
                <Input
                  id="overbooking_limit"
                  type="number"
                  min="0"
                  value={formData.overbooking_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, overbooking_limit: parseInt(e.target.value) }))}
                  placeholder="e.g., 5"
                />
              </div>
            )}
          </div>

          {/* Waitlist Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Waitlist Settings</h3>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="waitlist_enabled"
                checked={formData.waitlist_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, waitlist_enabled: checked }))}
              />
              <Label htmlFor="waitlist_enabled">Enable Waitlist</Label>
            </div>
            
            {formData.waitlist_enabled && (
              <div>
                <Label htmlFor="waitlist_max_size">Maximum Waitlist Size</Label>
                <Input
                  id="waitlist_max_size"
                  type="number"
                  min="1"
                  value={formData.waitlist_max_size}
                  onChange={(e) => setFormData(prev => ({ ...prev, waitlist_max_size: parseInt(e.target.value) }))}
                  placeholder="e.g., 20"
                />
              </div>
            )}
          </div>

          {/* Booking Constraints */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Booking Constraints</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minimum_booking_size">Minimum Booking Size</Label>
                <Input
                  id="minimum_booking_size"
                  type="number"
                  min="1"
                  value={formData.minimum_booking_size || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    minimum_booking_size: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="Optional"
                />
              </div>
              
              <div>
                <Label htmlFor="maximum_booking_size">Maximum Booking Size</Label>
                <Input
                  id="maximum_booking_size"
                  type="number"
                  min="1"
                  value={formData.maximum_booking_size || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    maximum_booking_size: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="Optional"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minimum_nights">Minimum Nights</Label>
                <Input
                  id="minimum_nights"
                  type="number"
                  min="1"
                  value={formData.minimum_nights || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    minimum_nights: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="Optional"
                />
              </div>
              
              <div>
                <Label htmlFor="maximum_nights">Maximum Nights</Label>
                <Input
                  id="maximum_nights"
                  type="number"
                  min="1"
                  value={formData.maximum_nights || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    maximum_nights: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
