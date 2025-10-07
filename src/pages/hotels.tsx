import { useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useData, Hotel, RoomGroup } from '@/contexts/data-context'
import { Plus, Trash2, Building2 } from 'lucide-react'
import { toast } from 'sonner'

// Hotel Form Component (moved outside to prevent re-creation on each render)
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

const HotelForm = ({ formData, setFormData, roomGroupForm, setRoomGroupForm, addRoomGroup, removeRoomGroup }: HotelFormProps) => (
  <>
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
                    placeholder="Features (e.g., Wi-Fi, TV, minibar)"
                    value={roomGroupForm.features}
                    onChange={(e) => setRoomGroupForm({ ...roomGroupForm, features: e.target.value })}
                  />
                  <Button type="button" variant="outline" onClick={addRoomGroup} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Room Type
                  </Button>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  </>
)

export function Hotels() {
  const { hotels, addHotel, updateHotel, deleteHotel } = useData()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    city: '',
    country: '',
    description: '',
    star_rating: 0,
    phone: '',
    email: '',
    room_groups: [] as RoomGroup[],
  })

  const [roomGroupForm, setRoomGroupForm] = useState({
    room_type: '',
    capacity: 2,
    description: '',
    features: '',
  })

  const columns = [
    { header: 'ID', accessor: 'id', width: 60 },
    { header: 'Name', accessor: 'name' },
    { header: 'Location', accessor: 'location' },
    { header: 'Star Rating', accessor: 'star_rating' },
    { header: 'Room Types', accessor: 'room_groups_count' },
    { header: 'Description', accessor: 'description', truncate: true },
    { header: 'Actions', accessor: 'actions', type: 'actions' as const, actions: ['view', 'edit', 'delete'] },
  ]

  // Transform hotels data to include room groups count
  const hotelsWithCount = hotels.map(h => ({
    ...h,
    room_groups_count: h.room_groups?.length || 0
  }))

  const addRoomGroup = () => {
    if (!roomGroupForm.room_type) {
      alert('Please enter a room type')
      return
    }

    const newRoomGroup: RoomGroup = {
      id: `rg-${Date.now()}`,
      ...roomGroupForm
    }

    setFormData({
      ...formData,
      room_groups: [...formData.room_groups, newRoomGroup]
    })

    setRoomGroupForm({
      room_type: '',
      capacity: 2,
      description: '',
      features: '',
    })
  }

  const removeRoomGroup = (id: string) => {
    setFormData({
      ...formData,
      room_groups: formData.room_groups.filter(rg => rg.id !== id)
    })
  }

  const handleCreate = () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter a hotel name')
      return
    }
    if (!formData.location.trim()) {
      toast.error('Please enter a location')
      return
    }
    if (formData.room_groups.length === 0) {
      toast.error('Please add at least one room type')
      return
    }
    
    addHotel(formData)
    toast.success('Hotel created successfully')
    setIsCreateOpen(false)
    setFormData({
      name: '',
      location: '',
      city: '',
      country: '',
      description: '',
      star_rating: 0,
      phone: '',
      email: '',
      room_groups: [],
    })
  }

  const handleEdit = (hotel: Hotel) => {
    setEditingHotel(hotel)
    setFormData({
      name: hotel.name,
      location: hotel.location,
      city: hotel.city || '',
      country: hotel.country || '',
      description: hotel.description,
      star_rating: hotel.star_rating || 0,
      phone: hotel.phone || '',
      email: hotel.email || '',
      room_groups: hotel.room_groups || [],
    })
    setIsEditOpen(true)
  }

  const handleUpdate = () => {
    if (!editingHotel) return
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter a hotel name')
      return
    }
    if (!formData.location.trim()) {
      toast.error('Please enter a location')
      return
    }
    if (formData.room_groups.length === 0) {
      toast.error('Please add at least one room type')
      return
    }
    
    updateHotel(editingHotel.id, formData)
    toast.success('Hotel updated successfully')
    setIsEditOpen(false)
    setEditingHotel(null)
    setFormData({
      name: '',
      location: '',
      city: '',
      country: '',
      description: '',
      star_rating: 0,
      phone: '',
      email: '',
      room_groups: [],
    })
  }

  const handleDelete = (hotel: Hotel) => {
    if (confirm(`Are you sure you want to delete "${hotel.name}"?`)) {
      deleteHotel(hotel.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Hotels</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Hotel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create Hotel</DialogTitle>
              <DialogDescription>Add a new hotel with room types.</DialogDescription>
            </DialogHeader>
            <HotelForm 
              formData={formData}
              setFormData={setFormData}
              roomGroupForm={roomGroupForm}
              setRoomGroupForm={setRoomGroupForm}
              addRoomGroup={addRoomGroup}
              removeRoomGroup={removeRoomGroup}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        title="Hotels"
        columns={columns}
        data={hotelsWithCount}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchable
      />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Hotel</DialogTitle>
              <DialogDescription>Update hotel information and room types.</DialogDescription>
            </DialogHeader>
            <HotelForm 
              formData={formData}
              setFormData={setFormData}
              roomGroupForm={roomGroupForm}
              setRoomGroupForm={setRoomGroupForm}
              addRoomGroup={addRoomGroup}
              removeRoomGroup={removeRoomGroup}
            />
            <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
