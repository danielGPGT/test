/**
 * UNIFIED ITEM FORM
 * Polymorphic form for creating/editing ANY inventory type
 * Adapts fields based on item_type selection
 */

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import type { InventoryItem, InventoryItemType, ItemCategory } from '@/types/unified-inventory'
import { ITEM_TYPE_LABELS, ITEM_TYPE_DESCRIPTIONS } from '@/types/unified-inventory'

interface UnifiedItemFormProps {
  item?: InventoryItem  // If editing
  onSave: (data: Omit<InventoryItem, 'id' | 'created_at'>) => void
  onCancel: () => void
}

export function UnifiedItemForm({ item, onSave, onCancel }: UnifiedItemFormProps) {
  const [formData, setFormData] = useState<Omit<InventoryItem, 'id' | 'created_at'>>({
    item_type: 'hotel',
    name: '',
    location: '',
    description: '',
    metadata: {},
    categories: [],
    active: true
  })

  const [categoryForm, setCategoryForm] = useState<Partial<ItemCategory>>({
    category_name: '',
    description: '',
    features: '',
    capacity_info: {},
    pricing_behavior: { pricing_mode: 'per_unit' }
  })

  // Load existing item data
  useEffect(() => {
    if (item) {
      setFormData(item)
    }
  }, [item])

  const updateField = (field: keyof Omit<InventoryItem, 'id' | 'created_at'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateMetadata = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value }
    }))
  }

  const addCategory = () => {
    if (!categoryForm.category_name) {
      toast.error('Please enter a category name')
      return
    }

    const newCategory: ItemCategory = {
      id: `cat-${Date.now()}`,
      item_id: 0,  // Will be set when item is saved
      category_name: categoryForm.category_name,
      description: categoryForm.description,
      features: categoryForm.features,
      capacity_info: categoryForm.capacity_info || {},
      pricing_behavior: categoryForm.pricing_behavior || { pricing_mode: 'per_unit' }
    }

    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }))

    // Reset form
    setCategoryForm({
      category_name: '',
      description: '',
      features: '',
      capacity_info: {},
      pricing_behavior: { pricing_mode: 'per_unit' }
    })

    toast.success('Category added')
  }

  const removeCategory = (id: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id)
    }))
  }

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCategories = [...formData.categories]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newCategories.length) return
    
    const temp = newCategories[index]
    newCategories[index] = newCategories[targetIndex]
    newCategories[targetIndex] = temp
    
    setFormData(prev => ({ ...prev, categories: newCategories }))
  }

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error('Please enter a name')
      return
    }
    
    if (formData.categories.length === 0) {
      toast.error('Please add at least one category')
      return
    }

    onSave(formData)
  }

  return (
    <div className="space-y-4">
      {/* Item Type Selection */}
      {!item && (
        <div className="grid gap-2 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
          <Label>Inventory Type *</Label>
          <Select
            value={formData.item_type}
            onValueChange={(value: InventoryItemType) => updateField('item_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ITEM_TYPE_LABELS) as InventoryItemType[]).map(type => (
                <SelectItem key={type} value={type}>
                  {ITEM_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {ITEM_TYPE_DESCRIPTIONS[formData.item_type]}
          </p>
        </div>
      )}

      {/* Basic Information */}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder={`e.g., ${formData.item_type === 'hotel' ? 'Grand Hyatt Abu Dhabi' : formData.item_type === 'ticket' ? 'F1 Grand Prix Tickets' : formData.item_type === 'transfer' ? 'Airport Transfers' : 'Service Name'}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="e.g., Abu Dhabi, UAE"
            />
          </div>
          
          {formData.item_type === 'hotel' && (
            <div className="grid gap-2">
              <Label>Star Rating</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={formData.metadata.star_rating || ''}
                onChange={(e) => updateMetadata('star_rating', parseInt(e.target.value) || 0)}
              />
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Type-Specific Metadata */}
      {formData.item_type === 'ticket' && (
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="grid gap-2">
            <Label className="text-xs">Event Type</Label>
            <Select
              value={formData.metadata.event_type || 'other'}
              onValueChange={(value) => updateMetadata('event_type', value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="concert">Concert</SelectItem>
                <SelectItem value="theater">Theater</SelectItem>
                <SelectItem value="festival">Festival</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="attraction">Attraction</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">Venue Name</Label>
            <Input
              className="h-9"
              value={formData.metadata.venue_name || ''}
              onChange={(e) => updateMetadata('venue_name', e.target.value)}
              placeholder="e.g., Yas Marina Circuit"
            />
          </div>
        </div>
      )}

      {formData.item_type === 'activity' && (
        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="grid gap-2">
            <Label className="text-xs">Activity Type</Label>
            <Select
              value={formData.metadata.activity_type || 'tour'}
              onValueChange={(value) => updateMetadata('activity_type', value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tour">Tour</SelectItem>
                <SelectItem value="excursion">Excursion</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">Duration</Label>
            <Input
              className="h-9"
              value={formData.metadata.duration || ''}
              onChange={(e) => updateMetadata('duration', e.target.value)}
              placeholder="e.g., 4 hours"
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">Difficulty</Label>
            <Select
              value={formData.metadata.difficulty || 'easy'}
              onValueChange={(value) => updateMetadata('difficulty', value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="challenging">Challenging</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Categories Section */}
      <Accordion type="single" collapsible defaultValue="categories" className="border rounded-lg">
        <AccordionItem value="categories" className="border-0">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                Categories ({formData.categories.length})
              </span>
              {formData.categories.length === 0 && (
                <Badge variant="destructive" className="text-xs">Required</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                {formData.item_type === 'hotel' && 'Define room types (e.g., Deluxe Room, Suite)'}
                {formData.item_type === 'ticket' && 'Define ticket sections (e.g., Grandstand, VIP)'}
                {formData.item_type === 'transfer' && 'Define vehicle types (e.g., Sedan, Van)'}
                {formData.item_type === 'activity' && 'Define tour types (e.g., Half-Day, Full-Day)'}
                {!['hotel', 'ticket', 'transfer', 'activity'].includes(formData.item_type) && 'Define service categories'}
              </p>

              {/* Existing Categories */}
              {formData.categories.map((category, index) => (
                <div key={category.id} className="p-3 bg-muted/50 rounded-md border flex items-start gap-2">
                  {/* Reorder buttons */}
                  {formData.categories.length > 1 && (
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0"
                        onClick={() => moveCategory(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0"
                        onClick={() => moveCategory(index, 'down')}
                        disabled={index === formData.categories.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="font-medium">{category.category_name}</div>
                    {category.description && (
                      <div className="text-xs text-muted-foreground mt-1">{category.description}</div>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {category.capacity_info.max_occupancy && (
                        <Badge variant="secondary" className="text-xs">
                          Max: {category.capacity_info.max_occupancy} people
                        </Badge>
                      )}
                      {category.capacity_info.max_pax && (
                        <Badge variant="secondary" className="text-xs">
                          {category.capacity_info.min_pax}-{category.capacity_info.max_pax} pax
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {category.pricing_behavior.pricing_mode}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeCategory(category.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {/* Add Category Form */}
              <div className="p-3 bg-background rounded-md border border-dashed space-y-3">
                <p className="text-sm font-medium">Add Category</p>
                
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder={`Category name (e.g., ${
                        formData.item_type === 'hotel' ? 'Deluxe Room' :
                        formData.item_type === 'ticket' ? 'Grandstand Section' :
                        formData.item_type === 'transfer' ? 'Private Sedan' :
                        'Category Name'
                      })`}
                      value={categoryForm.category_name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, category_name: e.target.value }))}
                    />
                    
                    {/* Hotel: Max Occupancy */}
                    {formData.item_type === 'hotel' && (
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        placeholder="Max occupancy"
                        value={categoryForm.capacity_info?.max_occupancy || ''}
                        onChange={(e) => setCategoryForm(prev => ({
                          ...prev,
                          capacity_info: { ...prev.capacity_info, max_occupancy: parseInt(e.target.value) || 2 }
                        }))}
                      />
                    )}
                    
                    {/* Transfer/Activity: Pax Range */}
                    {(formData.item_type === 'transfer' || formData.item_type === 'activity') && (
                      <>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Min pax"
                          value={categoryForm.capacity_info?.min_pax || ''}
                          onChange={(e) => setCategoryForm(prev => ({
                            ...prev,
                            capacity_info: { ...prev.capacity_info, min_pax: parseInt(e.target.value) || 1 }
                          }))}
                        />
                      </>
                    )}
                  </div>

                  {(formData.item_type === 'transfer' || formData.item_type === 'activity') && (
                    <Input
                      type="number"
                      min="1"
                      placeholder="Max pax"
                      value={categoryForm.capacity_info?.max_pax || ''}
                      onChange={(e) => setCategoryForm(prev => ({
                        ...prev,
                        capacity_info: { ...prev.capacity_info, max_pax: parseInt(e.target.value) || 10 }
                      }))}
                    />
                  )}

                  <Input
                    placeholder="Description (optional)"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  />

                  <div className="grid gap-2">
                    <Label className="text-xs">Pricing Mode</Label>
                    <Select
                      value={categoryForm.pricing_behavior?.pricing_mode || 'per_unit'}
                      onValueChange={(value: any) => setCategoryForm(prev => ({
                        ...prev,
                        pricing_behavior: { ...prev.pricing_behavior, pricing_mode: value }
                      }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.item_type === 'hotel' && (
                          <SelectItem value="per_occupancy">Per Occupancy (Hotel Rooms)</SelectItem>
                        )}
                        <SelectItem value="per_person">Per Person</SelectItem>
                        <SelectItem value="per_unit">Per Unit</SelectItem>
                        <SelectItem value="per_vehicle">Per Vehicle</SelectItem>
                        <SelectItem value="per_group">Per Group</SelectItem>
                        <SelectItem value="flat_rate">Flat Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCategory}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Category
                  </Button>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          {item ? 'Update' : 'Create'} {ITEM_TYPE_LABELS[formData.item_type]}
        </Button>
      </div>
    </div>
  )
}

