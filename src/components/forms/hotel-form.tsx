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
import { Building2, Trash2 } from 'lucide-react'
import { RoomGroup } from '@/contexts/data-context'

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
                  {formData.room_groups.map((rg) => (
                    <div key={rg.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-md border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{rg.room_type}</Badge>
                          <span className="text-sm text-muted-foreground">Capacity: {rg.capacity}</span>
                        </div>
                        {rg.description && (
                          <p className="text-xs text-muted-foreground mt-1">{rg.description}</p>
                        )}
                        {rg.features && (
                          <p className="text-xs text-muted-foreground mt-1">Features: {rg.features}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRoomGroup(rg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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

