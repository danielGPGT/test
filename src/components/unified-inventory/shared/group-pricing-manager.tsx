/**
 * GROUP PRICING MANAGER
 * Component for managing group size pricing tiers
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus, Users, TrendingDown } from 'lucide-react'
import type { GroupPricingConfig, GroupPricingTier } from '@/types/unified-inventory'
import { PRICING_MODE_LABELS } from '@/types/unified-inventory'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface GroupPricingManagerProps {
  groupPricing: GroupPricingConfig
  onChange: (config: GroupPricingConfig) => void
  compact?: boolean
}

export function GroupPricingManager({ groupPricing, onChange, compact = false }: GroupPricingManagerProps) {
  const [newTier, setNewTier] = useState({
    min_pax: '',
    max_pax: '',
    price_per_person: '',
    description: ''
  })

  const addPricingTier = () => {
    if (!newTier.min_pax || !newTier.price_per_person) return

    const tier: GroupPricingTier = {
      min_pax: parseInt(newTier.min_pax),
      max_pax: newTier.max_pax ? parseInt(newTier.max_pax) : undefined,
      price_per_person: parseFloat(newTier.price_per_person),
      description: newTier.description || undefined
    }

    // Validate tier doesn't overlap with existing ones
    const hasOverlap = groupPricing.pricing_tiers.some(existingTier => {
      const newMin = tier.min_pax
      const newMax = tier.max_pax || Infinity
      const existingMin = existingTier.min_pax
      const existingMax = existingTier.max_pax || Infinity

      return (newMin <= existingMax && newMax >= existingMin)
    })

    if (hasOverlap) {
      alert('This pricing tier overlaps with an existing tier. Please adjust the group size range.')
      return
    }

    onChange({
      ...groupPricing,
      pricing_tiers: [...groupPricing.pricing_tiers, tier].sort((a, b) => a.min_pax - b.min_pax)
    })

    // Reset form
    setNewTier({
      min_pax: '',
      max_pax: '',
      price_per_person: '',
      description: ''
    })
  }

  const removePricingTier = (index: number) => {
    const newTiers = groupPricing.pricing_tiers.filter((_, i) => i !== index)
    onChange({
      ...groupPricing,
      pricing_tiers: newTiers
    })
  }

  const updateGroupPricingProperty = (key: keyof GroupPricingConfig, value: any) => {
    onChange({
      ...groupPricing,
      [key]: value
    })
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Group Pricing</Label>
          <Switch
            checked={groupPricing.has_group_pricing}
            onCheckedChange={(checked) => updateGroupPricingProperty('has_group_pricing', checked)}
          />
        </div>

        {groupPricing.has_group_pricing && (
          <div className="space-y-2">
            {/* Group size constraints */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Min Group</Label>
                <Input
                  type="number"
                  min="1"
                  value={groupPricing.minimum_group_size || ''}
                  onChange={(e) => updateGroupPricingProperty('minimum_group_size', parseInt(e.target.value) || undefined)}
                  className="text-sm"
                  placeholder="2"
                />
              </div>
              <div>
                <Label className="text-xs">Max Group</Label>
                <Input
                  type="number"
                  min="1"
                  value={groupPricing.maximum_group_size || ''}
                  onChange={(e) => updateGroupPricingProperty('maximum_group_size', parseInt(e.target.value) || undefined)}
                  className="text-sm"
                  placeholder="20"
                />
              </div>
            </div>

            {/* Quick add tier */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs">Min Pax</Label>
                <Input
                  type="number"
                  min="1"
                  value={newTier.min_pax}
                  onChange={(e) => setNewTier({ ...newTier, min_pax: e.target.value })}
                  className="text-sm"
                  placeholder="1"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Max Pax</Label>
                <Input
                  type="number"
                  min="1"
                  value={newTier.max_pax}
                  onChange={(e) => setNewTier({ ...newTier, max_pax: e.target.value })}
                  className="text-sm"
                  placeholder="4"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Price/Person</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newTier.price_per_person}
                  onChange={(e) => setNewTier({ ...newTier, price_per_person: e.target.value })}
                  className="text-sm"
                  placeholder="150"
                />
              </div>
              <Button onClick={addPricingTier} size="sm" className="text-xs">
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Pricing tiers list */}
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {groupPricing.pricing_tiers.map((tier, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    <span>{tier.min_pax}-{tier.max_pax || '∞'} pax</span>
                    <TrendingDown className="h-3 w-3" />
                    <span className="font-medium">€{tier.price_per_person}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePricingTier(index)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
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
          <Users className="h-5 w-5" />
          Group Size Pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable group pricing */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Enable Group Pricing</Label>
          <Switch
            checked={groupPricing.has_group_pricing}
            onCheckedChange={(checked) => updateGroupPricingProperty('has_group_pricing', checked)}
          />
        </div>

        {groupPricing.has_group_pricing && (
          <>
            {/* Pricing mode */}
            <div>
              <Label className="text-sm">Pricing Mode</Label>
              <Select
                value={groupPricing.pricing_mode}
                onValueChange={(value: 'per_person' | 'per_group' | 'tiered') => 
                  updateGroupPricingProperty('pricing_mode', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_person">Per Person</SelectItem>
                  <SelectItem value="per_group">Per Group</SelectItem>
                  <SelectItem value="tiered">Tiered Pricing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group size constraints */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Minimum Group Size</Label>
                <Input
                  type="number"
                  min="1"
                  value={groupPricing.minimum_group_size || ''}
                  onChange={(e) => updateGroupPricingProperty('minimum_group_size', parseInt(e.target.value) || undefined)}
                  placeholder="e.g., 2"
                />
              </div>
              <div>
                <Label className="text-sm">Maximum Group Size</Label>
                <Input
                  type="number"
                  min="1"
                  value={groupPricing.maximum_group_size || ''}
                  onChange={(e) => updateGroupPricingProperty('maximum_group_size', parseInt(e.target.value) || undefined)}
                  placeholder="e.g., 20"
                />
              </div>
            </div>

            {/* Special pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm">Single Supplement</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={groupPricing.single_supplement || ''}
                  onChange={(e) => updateGroupPricingProperty('single_supplement', parseFloat(e.target.value) || undefined)}
                  placeholder="e.g., 50"
                />
              </div>
              <div>
                <Label className="text-sm">Child Discount (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={groupPricing.child_discount_percentage || ''}
                  onChange={(e) => updateGroupPricingProperty('child_discount_percentage', parseFloat(e.target.value) || undefined)}
                  placeholder="e.g., 25"
                />
              </div>
              <div>
                <Label className="text-sm">Senior Discount (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={groupPricing.senior_discount_percentage || ''}
                  onChange={(e) => updateGroupPricingProperty('senior_discount_percentage', parseFloat(e.target.value) || undefined)}
                  placeholder="e.g., 10"
                />
              </div>
            </div>

            {/* Add new pricing tier */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">Add Pricing Tier</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Minimum Pax</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newTier.min_pax}
                    onChange={(e) => setNewTier({ ...newTier, min_pax: e.target.value })}
                    placeholder="e.g., 1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Maximum Pax (Optional)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newTier.max_pax}
                    onChange={(e) => setNewTier({ ...newTier, max_pax: e.target.value })}
                    placeholder="e.g., 4 (leave empty for unlimited)"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Price Per Person</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newTier.price_per_person}
                    onChange={(e) => setNewTier({ ...newTier, price_per_person: e.target.value })}
                    placeholder="e.g., 150.00"
                  />
                </div>
                <div>
                  <Label className="text-xs">Description (Optional)</Label>
                  <Input
                    value={newTier.description}
                    onChange={(e) => setNewTier({ ...newTier, description: e.target.value })}
                    placeholder="e.g., Small Group (1-4)"
                  />
                </div>
              </div>
              <Button onClick={addPricingTier} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Pricing Tier
              </Button>
            </div>

            {/* Pricing tiers list */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Current Pricing Tiers</h4>
              {groupPricing.pricing_tiers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No pricing tiers configured. Add tiers above to enable group pricing.
                </p>
              ) : (
                <div className="space-y-2">
                  {groupPricing.pricing_tiers.map((tier, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium text-sm">
                            {tier.min_pax} - {tier.max_pax || '∞'} people
                            {tier.description && ` (${tier.description})`}
                          </div>
                          <div className="text-xs text-gray-500">
                            €{tier.price_per_person} per person
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {PRICING_MODE_LABELS[groupPricing.pricing_mode]}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePricingTier(index)}
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
