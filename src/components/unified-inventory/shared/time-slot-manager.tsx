/**
 * TIME SLOT MANAGER
 * Component for managing time slots for activities, tours, meals, shows
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus, Clock, Users } from 'lucide-react'
import type { TimeSlot, ScheduleConfig } from '@/types/unified-inventory'
import { formatTimeSlot, formatDuration } from '@/types/unified-inventory'

interface TimeSlotManagerProps {
  scheduleConfig: ScheduleConfig
  onChange: (config: ScheduleConfig) => void
  compact?: boolean
}

export function TimeSlotManager({ scheduleConfig, onChange, compact = false }: TimeSlotManagerProps) {
  const [newSlot, setNewSlot] = useState({
    start_time: '',
    end_time: '',
    max_capacity: '',
    is_available: true
  })

  const addTimeSlot = () => {
    if (!newSlot.start_time || !newSlot.end_time) return

    const startMinutes = timeToMinutes(newSlot.start_time)
    const endMinutes = timeToMinutes(newSlot.end_time)
    const duration = endMinutes - startMinutes

    if (duration <= 0) return

    const slot: TimeSlot = {
      id: `slot-${Date.now()}`,
      start_time: newSlot.start_time,
      end_time: newSlot.end_time,
      duration_minutes: duration,
      max_capacity: newSlot.max_capacity ? parseInt(newSlot.max_capacity) : undefined,
      is_available: newSlot.is_available
    }

    onChange({
      ...scheduleConfig,
      time_slots: [...scheduleConfig.time_slots, slot]
    })

    // Reset form
    setNewSlot({
      start_time: '',
      end_time: '',
      max_capacity: '',
      is_available: true
    })
  }

  const removeTimeSlot = (slotId: string) => {
    onChange({
      ...scheduleConfig,
      time_slots: scheduleConfig.time_slots.filter(slot => slot.id !== slotId)
    })
  }

  const toggleSlotAvailability = (slotId: string) => {
    onChange({
      ...scheduleConfig,
      time_slots: scheduleConfig.time_slots.map(slot =>
        slot.id === slotId ? { ...slot, is_available: !slot.is_available } : slot
      )
    })
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const updateScheduleProperty = (key: keyof ScheduleConfig, value: any) => {
    onChange({
      ...scheduleConfig,
      [key]: value
    })
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Time Slots</Label>
          <Switch
            checked={scheduleConfig.has_time_slots}
            onCheckedChange={(checked) => updateScheduleProperty('has_time_slots', checked)}
          />
        </div>

        {scheduleConfig.has_time_slots && (
          <div className="space-y-2">
            {/* Quick add form */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs">Start Time</Label>
                <Input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">End Time</Label>
                <Input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                  className="text-sm"
                />
              </div>
              <Button onClick={addTimeSlot} size="sm" className="text-xs">
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Time slots list */}
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {scheduleConfig.time_slots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeSlot(slot)}</span>
                    <span className="text-gray-500">({formatDuration(slot.duration_minutes)})</span>
                    {slot.max_capacity && (
                      <>
                        <Users className="h-3 w-3" />
                        <span>{slot.max_capacity}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={slot.is_available ? 'default' : 'secondary'} className="text-xs">
                      {slot.is_available ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTimeSlot(slot.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time-Based Scheduling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable time slots */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Enable Time Slots</Label>
          <Switch
            checked={scheduleConfig.has_time_slots}
            onCheckedChange={(checked) => updateScheduleProperty('has_time_slots', checked)}
          />
        </div>

        {scheduleConfig.has_time_slots && (
          <>
            {/* Duration settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Duration (Hours)</Label>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  value={scheduleConfig.duration_hours || ''}
                  onChange={(e) => updateScheduleProperty('duration_hours', parseInt(e.target.value) || undefined)}
                  placeholder="e.g., 4"
                />
              </div>
              <div>
                <Label className="text-sm">Booking Interval (Minutes)</Label>
                <Input
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={scheduleConfig.booking_interval_minutes || ''}
                  onChange={(e) => updateScheduleProperty('booking_interval_minutes', parseInt(e.target.value) || undefined)}
                  placeholder="e.g., 30"
                />
              </div>
            </div>

            {/* Add new time slot */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">Add Time Slot</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Start Time</Label>
                  <Input
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">End Time</Label>
                  <Input
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Max Capacity (Optional)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newSlot.max_capacity}
                    onChange={(e) => setNewSlot({ ...newSlot, max_capacity: e.target.value })}
                    placeholder="e.g., 20"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newSlot.is_available}
                    onCheckedChange={(checked) => setNewSlot({ ...newSlot, is_available: checked })}
                  />
                  <Label className="text-xs">Available</Label>
                </div>
              </div>
              <Button onClick={addTimeSlot} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Time Slot
              </Button>
            </div>

            {/* Time slots list */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Current Time Slots</h4>
              {scheduleConfig.time_slots.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No time slots configured. Add slots above to enable time-based scheduling.
                </p>
              ) : (
                <div className="space-y-2">
                  {scheduleConfig.time_slots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium text-sm">{formatTimeSlot(slot)}</div>
                          <div className="text-xs text-gray-500">
                            Duration: {formatDuration(slot.duration_minutes)}
                            {slot.max_capacity && ` • Max Capacity: ${slot.max_capacity}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={slot.is_available}
                          onCheckedChange={() => toggleSlotAvailability(slot.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeSlot(slot.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
