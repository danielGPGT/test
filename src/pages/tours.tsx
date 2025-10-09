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
import { useData, Tour, BoardType } from '@/contexts/data-context'
import { Plus, Hotel, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export function Tours() {
  const { tours, addTour, updateTour, deleteTour, tourComponents, addTourComponent, deleteTourComponent, hotels } = useData()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTour, setEditingTour] = useState<Tour | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewingTour, setViewingTour] = useState<Tour | null>(null)
  const [isComponentOpen, setIsComponentOpen] = useState(false)
  const [componentForm, setComponentForm] = useState({
    hotel_id: 0,
    room_group_id: '',
    check_in_day: 1,
    nights: 1,
    board_type: 'bed_breakfast' as BoardType,
    pricing_mode: 'use_contract' as 'use_contract' | 'fixed_price',
    included_in_base_price: true,
    label: '',
  })
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    description: '',
  })

  const columns = [
    { header: 'ID', accessor: 'id', width: 60 },
    { header: 'Name', accessor: 'name' },
    { header: 'Start Date', accessor: 'start_date', format: 'date' as const },
    { header: 'End Date', accessor: 'end_date', format: 'date' as const },
    { header: 'Description', accessor: 'description', truncate: true },
    { header: 'Actions', accessor: 'actions', type: 'actions' as const, actions: ['view', 'edit', 'delete'] },
  ]

  const handleCreate = () => {
    addTour(formData)
    setIsCreateOpen(false)
    setFormData({ name: '', start_date: '', end_date: '', description: '' })
  }

  const handleEdit = (tour: Tour) => {
    setEditingTour(tour)
    setFormData({
      name: tour.name,
      start_date: tour.start_date,
      end_date: tour.end_date,
      description: tour.description,
    })
    setIsEditOpen(true)
  }

  const handleUpdate = () => {
    if (editingTour) {
      updateTour(editingTour.id, formData)
      setIsEditOpen(false)
      setEditingTour(null)
      setFormData({ name: '', start_date: '', end_date: '', description: '' })
    }
  }

  const handleView = (tour: Tour) => {
    setViewingTour(tour)
    setIsViewOpen(true)
  }

  const handleDelete = (tour: Tour) => {
    if (confirm(`Are you sure you want to delete "${tour.name}"?`)) {
      deleteTour(tour.id)
    }
  }

  const handleAddComponent = () => {
    if (!viewingTour) return
    
    addTourComponent({
      tour_id: viewingTour.id,
      component_type: 'accommodation',
      check_in_day: componentForm.check_in_day,
      nights: componentForm.nights,
      hotel_id: componentForm.hotel_id,
      room_group_id: componentForm.room_group_id,
      board_type: componentForm.board_type,
      pricing_mode: componentForm.pricing_mode,
      included_in_base_price: componentForm.included_in_base_price,
      label: componentForm.label
    })
    
    toast.success('Component added to tour')
    setIsComponentOpen(false)
    setComponentForm({
      hotel_id: 0,
      room_group_id: '',
      check_in_day: 1,
      nights: 1,
      board_type: 'bed_breakfast',
      pricing_mode: 'use_contract',
      included_in_base_price: true,
      label: '',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tours</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Tour
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tour</DialogTitle>
              <DialogDescription>Add a new tour to the system.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tour Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
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
            </div>
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
        title="Tours"
        columns={columns}
        data={tours}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchable
      />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tour</DialogTitle>
            <DialogDescription>Update tour information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Tour Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-start_date">Start Date *</Label>
              <Input
                id="edit-start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-end_date">End Date *</Label>
              <Input
                id="edit-end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Tour & Components Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingTour?.name} - Package Components</DialogTitle>
            <DialogDescription>
              Manage accommodation and service components for this tour package (per couple)
            </DialogDescription>
          </DialogHeader>

          {viewingTour && (
            <div className="space-y-4">
              {/* Tour Info */}
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Dates:</span> {viewingTour.start_date} - {viewingTour.end_date}</div>
                    <div><span className="text-muted-foreground">Components:</span> {tourComponents.filter((c: any) => c.tour_id === viewingTour.id).length}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Components List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Tour Components</h3>
                  <Button size="sm" onClick={() => setIsComponentOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Hotel Stay
                  </Button>
                </div>

                {tourComponents.filter((c: any) => c.tour_id === viewingTour.id).length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No components added yet. Click "Add Hotel Stay" to build your package.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {tourComponents
                      .filter((c: any) => c.tour_id === viewingTour.id)
                      .sort((a: any, b: any) => a.check_in_day - b.check_in_day)
                      .map((component: any) => {
                        const hotel = hotels.find(h => h.id === component.hotel_id)
                        const roomGroup = hotel?.room_groups?.find(rg => rg.id === component.room_group_id)
                        
                        return (
                          <Card key={component.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="py-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <Hotel className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium">{component.label || hotel?.name}</span>
                                    {component.included_in_base_price ? (
                                      <Badge variant="default" className="text-xs">Included</Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <div>📍 {hotel?.name} - {roomGroup?.room_type || 'Double Room'}</div>
                                    <div>📅 Day {component.check_in_day} • {component.nights} night{component.nights !== 1 ? 's' : ''} • {component.board_type?.replace('_', ' ')}</div>
                                    <div>💰 Pricing: {component.pricing_mode === 'use_contract' ? 'Uses contract rates' : 'Fixed price'}</div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('Remove this component?')) {
                                      deleteTourComponent(component.id)
                                      toast.info('Component removed')
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Component Dialog */}
      <Dialog open={isComponentOpen} onOpenChange={setIsComponentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Hotel Stay Component</DialogTitle>
            <DialogDescription>Add accommodation to {viewingTour?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Label *</Label>
              <Input
                value={componentForm.label}
                onChange={(e) => setComponentForm({ ...componentForm, label: e.target.value })}
                placeholder="e.g., Paris City Center Hotel"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Check-in Day *</Label>
                <Input
                  type="number"
                  min={1}
                  value={componentForm.check_in_day}
                  onChange={(e) => setComponentForm({ ...componentForm, check_in_day: parseInt(e.target.value) || 1 })}
                />
                <p className="text-xs text-muted-foreground">Day 1, Day 2, etc.</p>
              </div>
              <div className="grid gap-2">
                <Label>Nights *</Label>
                <Input
                  type="number"
                  min={1}
                  value={componentForm.nights}
                  onChange={(e) => setComponentForm({ ...componentForm, nights: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Hotel *</Label>
              <Select
                value={componentForm.hotel_id.toString()}
                onValueChange={(value) => setComponentForm({ ...componentForm, hotel_id: parseInt(value), room_group_id: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map(hotel => (
                    <SelectItem key={hotel.id} value={hotel.id.toString()}>
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {componentForm.hotel_id > 0 && (
              <div className="grid gap-2">
                <Label>Room Type *</Label>
                <Select
                  value={componentForm.room_group_id}
                  onValueChange={(value) => setComponentForm({ ...componentForm, room_group_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.find(h => h.id === componentForm.hotel_id)?.room_groups?.map(rg => (
                      <SelectItem key={rg.id} value={rg.id}>
                        {rg.room_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Board Type *</Label>
              <Select
                value={componentForm.board_type}
                onValueChange={(value: BoardType) => setComponentForm({ ...componentForm, board_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="room_only">Room Only</SelectItem>
                  <SelectItem value="bed_breakfast">Bed & Breakfast</SelectItem>
                  <SelectItem value="half_board">Half Board</SelectItem>
                  <SelectItem value="full_board">Full Board</SelectItem>
                  <SelectItem value="all_inclusive">All Inclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-blue-900">
                💡 <strong>Per Couple Pricing:</strong> System will use your contract rates at booking time (always double occupancy for 2 people)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComponentOpen(false)}>Cancel</Button>
            <Button onClick={handleAddComponent} disabled={!componentForm.hotel_id || !componentForm.room_group_id || !componentForm.label}>
              Add Component
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DataTable
        title="Tours"
        columns={columns}
        data={tours}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}

