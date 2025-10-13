/**
 * POOL CREATION DIALOG
 * Create new allocation pools manually
 */

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useData } from '@/contexts/data-context'
import type { AllocationPoolCapacity, InventoryItemType } from '@/types/unified-inventory'
import { ITEM_TYPE_LABELS } from '@/types/unified-inventory'

interface PoolCreationDialogProps {
  open: boolean
  onClose: () => void
  onSave: (pool: Omit<AllocationPoolCapacity, 'last_updated'>) => void
}

export function PoolCreationDialog({ open, onClose, onSave }: PoolCreationDialogProps) {
  const { inventoryItems } = useData()
  const [formData, setFormData] = useState({
    pool_id: '',
    item_id: 0,
    item_name: '',
    item_type: 'hotel' as InventoryItemType,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.pool_id || !formData.item_id || formData.total_capacity <= 0) {
      alert('Please fill in all required fields')
      return
    }

    const newPool: Omit<AllocationPoolCapacity, 'last_updated'> = {
      pool_id: formData.pool_id,
      item_id: formData.item_id,
      item_name: formData.item_name,
      item_type: formData.item_type,
      total_capacity: formData.total_capacity,
      current_bookings: 0,
      available_spots: formData.total_capacity,
      daily_availability: {},
      allows_overbooking: formData.allows_overbooking,
      overbooking_limit: formData.overbooking_limit,
      waitlist_enabled: formData.waitlist_enabled,
      waitlist_max_size: formData.waitlist_max_size,
      minimum_booking_size: formData.minimum_booking_size,
      maximum_booking_size: formData.maximum_booking_size,
      minimum_nights: formData.minimum_nights,
      maximum_nights: formData.maximum_nights,
      status: 'healthy'
    }

    onSave(newPool)
    onClose()
    
    // Reset form
    setFormData({
      pool_id: '',
      item_id: 0,
      item_name: '',
      item_type: 'hotel',
      total_capacity: 0,
      allows_overbooking: false,
      overbooking_limit: 0,
      waitlist_enabled: false,
      waitlist_max_size: 0,
      minimum_booking_size: undefined,
      maximum_booking_size: undefined,
      minimum_nights: undefined,
      maximum_nights: undefined
    })
  }

  const handleItemChange = (itemId: string) => {
    const item = inventoryItems.find(i => i.id === parseInt(itemId))
    if (item) {
      setFormData(prev => ({
        ...prev,
        item_id: item.id,
        item_name: item.name,
        item_type: item.item_type
      }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Allocation Pool</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pool_id">Pool ID *</Label>
                <Input
                  id="pool_id"
                  value={formData.pool_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, pool_id: e.target.value }))}
                  placeholder="e.g., hotel-rooms-pool"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="item_id">Inventory Item *</Label>
                <Select value={formData.item_id.toString()} onValueChange={handleItemChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select inventory item" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map(item => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name} ({ITEM_TYPE_LABELS[item.item_type]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="total_capacity">Total Capacity *</Label>
              <Input
                id="total_capacity"
                type="number"
                min="1"
                value={formData.total_capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, total_capacity: parseInt(e.target.value) }))}
                placeholder="e.g., 50"
                required
              />
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
              Create Pool
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
