/**
 * QUICK TRANSFER FORM
 * Fast buy-to-order transfer creation (no contract needed)
 * For ad-hoc transfers where logistics arranged closer to event
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { DayOfWeekSelector } from '@/components/ui/day-of-week-selector'
import { recordToDaySelection, daySelectionToRecord } from '@/types/unified-inventory'
import { ArrowRight, ArrowLeft, ArrowLeftRight, Zap } from 'lucide-react'
import type { InventoryItem, ServiceDirection } from '@/types/unified-inventory'

interface QuickTransferFormProps {
  item: InventoryItem
  onSave: (rateData: any) => void
  onCancel: () => void
}

export function QuickTransferForm({ item, onSave, onCancel }: QuickTransferFormProps) {
  const [direction, setDirection] = useState<ServiceDirection>('inbound')
  const [serviceDate, setServiceDate] = useState('')
  const [route, setRoute] = useState({ from: '', to: '' })
  const [vehicles, setVehicles] = useState(1)
  const [costPerVehicle, setCostPerVehicle] = useState(0)
  const [markupPercentage, setMarkupPercentage] = useState(50)
  const [daysOfWeek, setDaysOfWeek] = useState(recordToDaySelection({}))

  const sellingPrice = costPerVehicle * (1 + markupPercentage / 100)
  const totalCost = costPerVehicle * vehicles
  const totalSelling = sellingPrice * vehicles
  const totalProfit = totalSelling - totalCost

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const rateData = {
      item_id: item.id,
      category_id: item.categories[0]?.id,
      inventory_type: 'buy_to_order',
      base_rate: costPerVehicle,
      markup_percentage: markupPercentage / 100,
      currency: 'AED',
      valid_from: serviceDate,
      valid_to: serviceDate,
      days_of_week: daySelectionToRecord(daysOfWeek),
      active: true,
      estimated_costs: true,
      rate_details: {
        direction,
        pricing_unit: 'per_vehicle',
        route_info: route
      }
    }

    onSave(rateData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b">
        <Zap className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-semibold">Quick Transfer</h3>
          <p className="text-xs text-muted-foreground">Ad-hoc transfer pricing (buy-to-order)</p>
        </div>
      </div>

      {/* Direction */}
      <div className="space-y-2">
        <Label className="text-sm">Direction *</Label>
        <Select value={direction} onValueChange={(v) => setDirection(v as ServiceDirection)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inbound">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-3 w-3 text-green-600" />
                <span>Inbound (Airport → Hotel)</span>
              </div>
            </SelectItem>
            <SelectItem value="outbound">
              <div className="flex items-center gap-2">
                <ArrowLeft className="h-3 w-3 text-blue-600" />
                <span>Outbound (Hotel → Airport)</span>
              </div>
            </SelectItem>
            <SelectItem value="round_trip">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-3 w-3 text-purple-600" />
                <span>Round Trip (Both Ways)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Route */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm">From *</Label>
          <Input
            value={route.from}
            onChange={(e) => setRoute(prev => ({ ...prev, from: e.target.value }))}
            placeholder="e.g., DXB Airport"
            className="h-9 text-sm"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">To *</Label>
          <Input
            value={route.to}
            onChange={(e) => setRoute(prev => ({ ...prev, to: e.target.value }))}
            placeholder="e.g., Atlantis Hotel"
            className="h-9 text-sm"
            required
          />
        </div>
      </div>

      {/* Date & Vehicles */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm">Service Date *</Label>
          <Input
            type="date"
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
            className="h-9 text-sm"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Vehicles *</Label>
          <Input
            type="number"
            min="1"
            value={vehicles}
            onChange={(e) => setVehicles(parseInt(e.target.value) || 1)}
            className="h-9 text-sm"
            required
          />
        </div>
      </div>

      {/* Days of Week */}
      <div className="space-y-2">
        <Label className="text-sm">Valid Days of Week</Label>
        <DayOfWeekSelector
          value={daysOfWeek}
          onChange={setDaysOfWeek}
        />
        <p className="text-xs text-muted-foreground">
          Select which days this rate is valid (leave all unchecked for any day)
        </p>
      </div>

      {/* Pricing */}
      <Card className="bg-muted/30">
        <CardContent className="p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Cost/Vehicle *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={costPerVehicle}
                onChange={(e) => setCostPerVehicle(parseFloat(e.target.value) || 0)}
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Markup (%)</Label>
              <Input
                type="number"
                min="0"
                value={markupPercentage}
                onChange={(e) => setMarkupPercentage(parseFloat(e.target.value) || 0)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Price Summary */}
          <div className="border-t pt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selling Price/Vehicle:</span>
              <span className="font-bold">AED {sellingPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-primary">
              <span>Total ({vehicles} vehicle{vehicles > 1 ? 's' : ''}):</span>
              <span>AED {totalSelling.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Your Profit:</span>
              <span className="text-green-600 font-medium">AED {totalProfit.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-9">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 h-9">
          Create Transfer
        </Button>
      </div>
    </form>
  )
}

