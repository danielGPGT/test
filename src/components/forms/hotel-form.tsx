import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Building2, Trash2, Pencil, Save, X, Bed, Home, Star, Crown, ChevronUp, ChevronDown } from 'lucide-react'
import { RoomGroup } from '@/contexts/data-context'
import { toast } from 'sonner'

// Smart icon detection based on room type name
function getRoomIcon(roomType: string) {
  const lowerType = roomType.toLowerCase()
  
  if (lowerType.includes('suite') || lowerType.includes('presidential')) {
    return Crown // Luxury suites
  }
  if (lowerType.includes('deluxe') || lowerType.includes('premium') || lowerType.includes('executive')) {
    return Star // Premium rooms
  }
  if (lowerType.includes('standard') || lowerType.includes('classic') || lowerType.includes('superior')) {
    return Home // Standard rooms
  }
  
  return Bed // Default for all other types
}

interface HotelFormProps {
  formData: {
    name: string
    location: string
    city: string
    country: string
    star_rating: number
    phone: string
    email: string
    description: string
    room_groups: RoomGroup[]
  }
  setFormData: (data: any) => void
  roomGroupForm: {
    room_type: string
    capacity: number
    description: string
    features: string
  }
  setRoomGroupForm: (data: any) => void
  addRoomGroup: () => void
  removeRoomGroup: (id: string) => void
}

export function HotelForm({ 
  formData, 
  setFormData, 
  roomGroupForm, 
  setRoomGroupForm, 
  addRoomGroup, 
  removeRoomGroup 
}: HotelFormProps) {
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<RoomGroup | null>(null)

  const handleEditRoom = (room: RoomGroup) => {
    setEditingRoomId(room.id)
    setEditForm({ ...room })
  }

  const handleSaveEdit = () => {
    if (!editForm || !editingRoomId) return
    
    // Check for duplicates (excluding current room being edited)
    if (checkDuplicateRoomType(editForm.room_type, editingRoomId)) {
      toast.error('A room type with this name already exists')
      return
    }
    
    setFormData({
      ...formData,
      room_groups: formData.room_groups.map(rg => 
        rg.id === editingRoomId ? editForm : rg
      )
    })
    
    setEditingRoomId(null)
    setEditForm(null)
    toast.success('Room type updated')
  }

  const handleCancelEdit = () => {
    setEditingRoomId(null)
    setEditForm(null)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newRoomGroups = [...formData.room_groups]
    const temp = newRoomGroups[index]
    newRoomGroups[index] = newRoomGroups[index - 1]
    newRoomGroups[index - 1] = temp
    setFormData({ ...formData, room_groups: newRoomGroups })
    toast.success('Room type moved up')
  }

  const handleMoveDown = (index: number) => {
    if (index === formData.room_groups.length - 1) return
    const newRoomGroups = [...formData.room_groups]
    const temp = newRoomGroups[index]
    newRoomGroups[index] = newRoomGroups[index + 1]
    newRoomGroups[index + 1] = temp
    setFormData({ ...formData, room_groups: newRoomGroups })
    toast.success('Room type moved down')
  }

  const checkDuplicateRoomType = (roomType: string, excludeId?: string): boolean => {
    return formData.room_groups.some(rg => 
      rg.room_type.toLowerCase() === roomType.toLowerCase() && rg.id !== excludeId
    )
  }

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Hotel Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="e.g., Paris, FR"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="star_rating">Star Rating</Label>
          <Input
            id="star_rating"
            type="number"
            min="1"
            max="5"
            value={formData.star_rating}
            onChange={(e) => setFormData({ ...formData, star_rating: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      {/* Room Groups Section */}
      <Accordion type="single" collapsible defaultValue="room-types" className="w-full">
        <AccordionItem value="room-types">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Room Types
              {formData.room_groups.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {formData.room_groups.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {/* Existing Room Groups */}
              {formData.room_groups.length > 0 && (
                <div className="space-y-2">
                  {formData.room_groups.map((rg, index) => {
                    const RoomIcon = getRoomIcon(rg.room_type)
                    
                    return (
                    <div key={rg.id} className="p-3 bg-muted/50 rounded-md border">
                      {editingRoomId === rg.id && editForm ? (
                        /* Edit Mode */
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Room Type *"
                              value={editForm.room_type}
                              onChange={(e) => setEditForm({ ...editForm, room_type: e.target.value })}
                            />
                            <Input
                              type="number"
                              placeholder="Capacity"
                              min={1}
                              max={10}
                              value={editForm.capacity}
                              onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 2 })}
                            />
                          </div>
                          <Input
                            placeholder="Description"
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          />
                          <Input
                            placeholder="Features (e.g., WiFi, AC, TV)"
                            value={editForm.features || ''}
                            onChange={(e) => setEditForm({ ...editForm, features: e.target.value })}
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={!editForm.room_type}
                              className="flex-1"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save Changes
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div className="flex items-start gap-2">
                          {/* Reorder Buttons */}
                          {formData.room_groups.length > 1 && (
                            <div className="flex flex-col gap-0.5 pt-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveUp(index)
                                }}
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveDown(index)
                                }}
                                disabled={index === formData.room_groups.length - 1}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <RoomIcon className="h-4 w-4 text-primary" />
                              <Badge variant="outline" className="font-medium">{rg.room_type}</Badge>
                              <Badge variant="secondary" className="text-xs">
                                {rg.capacity === 1 ? '1 person' : `${rg.capacity} people`}
                              </Badge>
                            </div>
                            {rg.description && (
                              <p className="text-xs text-muted-foreground mt-1.5">{rg.description}</p>
                            )}
                            {rg.features && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <span className="font-medium">Features:</span> {rg.features}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditRoom(rg)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => removeRoomGroup(rg.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    )
                  })}
                </div>
              )}

              {/* Add Room Group */}
              <div className="space-y-3 p-3 bg-background rounded-md border border-dashed">
                <p className="text-sm font-medium">Add Room Type</p>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Room Type *"
                      value={roomGroupForm.room_type}
                      onChange={(e) => setRoomGroupForm({ ...roomGroupForm, room_type: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Capacity"
                      value={roomGroupForm.capacity}
                      onChange={(e) => setRoomGroupForm({ ...roomGroupForm, capacity: parseInt(e.target.value) || 2 })}
                    />
                  </div>
                  <Input
                    placeholder="Description"
                    value={roomGroupForm.description}
                    onChange={(e) => setRoomGroupForm({ ...roomGroupForm, description: e.target.value })}
                  />
                  <Input
                    placeholder="Features (e.g., WiFi, AC, TV)"
                    value={roomGroupForm.features}
                    onChange={(e) => setRoomGroupForm({ ...roomGroupForm, features: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRoomGroup}
                    disabled={!roomGroupForm.room_type}
                  >
                    <Building2 className="h-3 w-3 mr-1" />
                    Add Room Type
                  </Button>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

