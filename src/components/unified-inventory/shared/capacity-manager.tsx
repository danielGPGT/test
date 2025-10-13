/**
 * CAPACITY MANAGER
 * Component for managing capacity and availability tracking
 */

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import type { CapacityConfig } from '@/types/unified-inventory'
import { 
  AVAILABILITY_STATUS_LABELS, 
  AVAILABILITY_STATUS_COLORS,
  calculateAvailableSpots,
  getAvailabilityStatus 
} from '@/types/unified-inventory'

interface CapacityManagerProps {
  capacityConfig: CapacityConfig
  onChange: (config: CapacityConfig) => void
  compact?: boolean
}

export function CapacityManager({ capacityConfig, onChange, compact = false }: CapacityManagerProps) {
  const updateCapacityProperty = (key: keyof CapacityConfig, value: any) => {
    onChange({
      ...capacityConfig,
      [key]: value
    })
  }

  const availabilityStatus = getAvailabilityStatus(capacityConfig)

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Capacity Tracking</Label>
          <Switch
            checked={capacityConfig.real_time_availability}
            onCheckedChange={(checked) => updateCapacityProperty('real_time_availability', checked)}
          />
        </div>

        {capacityConfig.real_time_availability && (
          <div className="space-y-2">
            {/* Capacity inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Total Capacity</Label>
                <Input
                  type="number"
                  min="1"
                  value={capacityConfig.total_capacity}
                  onChange={(e) => updateCapacityProperty('total_capacity', parseInt(e.target.value) || 0)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Current Bookings</Label>
                <Input
                  type="number"
                  min="0"
                  value={capacityConfig.current_bookings}
                  onChange={(e) => updateCapacityProperty('current_bookings', parseInt(e.target.value) || 0)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Availability status */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                <span className="text-xs">
                  {calculateAvailableSpots(capacityConfig)} spots available
                </span>
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs ${AVAILABILITY_STATUS_COLORS[availabilityStatus.status]}`}
              >
                {AVAILABILITY_STATUS_LABELS[availabilityStatus.status]}
              </Badge>
            </div>

            {/* Overbooking toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-xs">Allow Overbooking</Label>
              <Switch
                checked={capacityConfig.overbooking_allowed}
                onCheckedChange={(checked) => updateCapacityProperty('overbooking_allowed', checked)}
              />
            </div>

            {capacityConfig.overbooking_allowed && (
              <div>
                <Label className="text-xs">Overbooking Limit</Label>
                <Input
                  type="number"
                  min="0"
                  value={capacityConfig.overbooking_limit}
                  onChange={(e) => updateCapacityProperty('overbooking_limit', parseInt(e.target.value) || 0)}
                  className="text-sm"
                  placeholder="e.g., 5"
                />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Capacity & Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Real-time availability toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Enable Real-Time Availability</Label>
          <Switch
            checked={capacityConfig.real_time_availability}
            onCheckedChange={(checked) => updateCapacityProperty('real_time_availability', checked)}
          />
        </div>

        {capacityConfig.real_time_availability && (
          <>
            {/* Current capacity status */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">Current Status</h4>
                <Badge className={AVAILABILITY_STATUS_COLORS[availabilityStatus.status]}>
                  {AVAILABILITY_STATUS_LABELS[availabilityStatus.status]}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{capacityConfig.total_capacity}</div>
                  <div className="text-gray-500">Total Capacity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{capacityConfig.current_bookings}</div>
                  <div className="text-gray-500">Booked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{calculateAvailableSpots(capacityConfig)}</div>
                  <div className="text-gray-500">Available</div>
                </div>
              </div>
              {availabilityStatus.waitlist_position && (
                <div className="mt-2 text-sm text-orange-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Waitlist position: #{availabilityStatus.waitlist_position}
                </div>
              )}
            </div>

            {/* Capacity settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Total Capacity</Label>
                <Input
                  type="number"
                  min="1"
                  value={capacityConfig.total_capacity}
                  onChange={(e) => updateCapacityProperty('total_capacity', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 50"
                />
              </div>
              <div>
                <Label className="text-sm">Current Bookings</Label>
                <Input
                  type="number"
                  min="0"
                  value={capacityConfig.current_bookings}
                  onChange={(e) => updateCapacityProperty('current_bookings', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 12"
                />
              </div>
            </div>

            {/* Booking size constraints */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Minimum Booking Size</Label>
                <Input
                  type="number"
                  min="1"
                  value={capacityConfig.minimum_booking_size || ''}
                  onChange={(e) => updateCapacityProperty('minimum_booking_size', parseInt(e.target.value) || undefined)}
                  placeholder="e.g., 2"
                />
              </div>
              <div>
                <Label className="text-sm">Maximum Booking Size</Label>
                <Input
                  type="number"
                  min="1"
                  value={capacityConfig.maximum_booking_size || ''}
                  onChange={(e) => updateCapacityProperty('maximum_booking_size', parseInt(e.target.value) || undefined)}
                  placeholder="e.g., 10"
                />
              </div>
            </div>

            {/* Overbooking settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Allow Overbooking</Label>
                <Switch
                  checked={capacityConfig.overbooking_allowed}
                  onCheckedChange={(checked) => updateCapacityProperty('overbooking_allowed', checked)}
                />
              </div>

              {capacityConfig.overbooking_allowed && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Overbooking Limit</Label>
                    <Input
                      type="number"
                      min="0"
                      value={capacityConfig.overbooking_limit}
                      onChange={(e) => updateCapacityProperty('overbooking_limit', parseInt(e.target.value) || 0)}
                      placeholder="e.g., 5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Overbooking Buffer</Label>
                    <Input
                      type="number"
                      min="0"
                      value={capacityConfig.overbooking_buffer}
                      onChange={(e) => updateCapacityProperty('overbooking_buffer', parseInt(e.target.value) || 0)}
                      placeholder="e.g., 2"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Update frequency */}
            <div>
              <Label className="text-sm">Availability Update Frequency</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['immediate', 'hourly', 'daily'] as const).map((frequency) => (
                  <Button
                    key={frequency}
                    variant={capacityConfig.availability_update_frequency === frequency ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateCapacityProperty('availability_update_frequency', frequency)}
                    className="text-xs"
                  >
                    {frequency === 'immediate' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {frequency === 'hourly' && <Clock className="h-3 w-3 mr-1" />}
                    {frequency === 'daily' && <Clock className="h-3 w-3 mr-1" />}
                    {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Waitlist settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Enable Waitlist</Label>
                <Switch
                  checked={capacityConfig.waitlist_enabled}
                  onCheckedChange={(checked) => updateCapacityProperty('waitlist_enabled', checked)}
                />
              </div>

              {capacityConfig.waitlist_enabled && (
                <div>
                  <Label className="text-sm">Maximum Waitlist Size</Label>
                  <Input
                    type="number"
                    min="1"
                    value={capacityConfig.waitlist_max_size || ''}
                    onChange={(e) => updateCapacityProperty('waitlist_max_size', parseInt(e.target.value) || undefined)}
                    placeholder="e.g., 20"
                  />
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
