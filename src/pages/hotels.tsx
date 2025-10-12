import { useState, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, Building2, Mail, Phone, Star } from 'lucide-react'
import { useData, RoomGroup } from '@/contexts/data-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { HotelForm } from '@/components/forms/hotel-form'
import { toast } from 'sonner'

export function Hotels() {
  const { hotels, addHotel, updateHotel, deleteHotel } = useData()
  
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHotel, setEditingHotel] = useState<any | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const [hotelForm, setHotelForm] = useState({
    name: '',
    location: '',
    city: '',
    country: '',
    star_rating: 3,
    phone: '',
    email: '',
    description: '',
    room_groups: [] as RoomGroup[]
  })
  
  const [roomGroupForm, setRoomGroupForm] = useState({
    room_type: '',
    capacity: 2,
    description: '',
    features: ''
  })

  // Filter and paginate hotels
  const { filteredHotels, totalPages, totalFiltered } = useMemo(() => {
    const filtered = hotels.filter(hotel =>
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hotel.city && hotel.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (hotel.country && hotel.country.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedHotels = filtered.slice(startIndex, endIndex)
    
    return {
      filteredHotels: paginatedHotels,
      totalPages,
      totalFiltered: filtered.length
    }
  }, [hotels, searchTerm, currentPage, itemsPerPage])

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  // Stats
  const stats = useMemo(() => {
    const total = hotels.length
    const withEmail = hotels.filter(h => h.email).length
    const withPhone = hotels.filter(h => h.phone).length
    const highRated = hotels.filter(h => (h.star_rating || 0) >= 4).length
    
    return { total, withEmail, withPhone, highRated }
  }, [hotels])

  const handleOpenDialog = (hotel?: any) => {
    if (hotel) {
      setEditingHotel(hotel)
      setHotelForm({
        name: hotel.name,
        location: hotel.location,
        city: hotel.city || '',
        country: hotel.country || '',
        star_rating: hotel.star_rating || 3,
        phone: hotel.phone || '',
        email: hotel.email || '',
        description: hotel.description,
        room_groups: hotel.room_groups || []
      })
    } else {
      setEditingHotel(null)
      setHotelForm({
        name: '',
        location: '',
        city: '',
        country: '',
        star_rating: 3,
        phone: '',
        email: '',
        description: '',
        room_groups: []
      })
    }
    setIsDialogOpen(true)
  }

  const handleSaveHotel = () => {
    if (!hotelForm.name || !hotelForm.location) {
      toast.error('Please fill in required fields')
      return
    }

    if (editingHotel) {
      updateHotel(editingHotel.id, hotelForm)
      toast.success('Hotel updated!')
    } else {
      addHotel(hotelForm)
      toast.success('Hotel created!')
    }
    
    setIsDialogOpen(false)
    setEditingHotel(null)
  }

  const addRoomGroup = () => {
    if (!roomGroupForm.room_type || !roomGroupForm.capacity) {
      toast.error('Please fill in room type and capacity')
      return
    }

    const newRoomGroup: RoomGroup = {
      id: `room-${Date.now()}`,
      room_type: roomGroupForm.room_type,
      capacity: roomGroupForm.capacity,
      description: roomGroupForm.description,
      features: roomGroupForm.features
    }

    setHotelForm(prev => ({
      ...prev,
      room_groups: [...prev.room_groups, newRoomGroup]
    }))

    setRoomGroupForm({
      room_type: '',
      capacity: 2,
      description: '',
      features: ''
    })
  }

  const removeRoomGroup = (id: string) => {
    setHotelForm(prev => ({
      ...prev,
      room_groups: prev.room_groups.filter(rg => rg.id !== id)
    }))
  }

  const handleDeleteHotel = (hotel: any) => {
    if (confirm(`Are you sure you want to delete "${hotel.name}"? This action cannot be undone.`)) {
      deleteHotel(hotel.id)
      toast.success('Hotel deleted!')
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hotels</h1>
          <p className="text-muted-foreground mt-1">
            Manage hotel properties and room configurations
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          New Hotel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hotels</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Email</p>
                <p className="text-2xl font-bold text-green-600">{stats.withEmail}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-green-600"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Phone</p>
                <p className="text-2xl font-bold text-blue-600">{stats.withPhone}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">4+ Stars</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.highRated}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-yellow-600"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search hotels..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {totalFiltered} of {hotels.length} hotels
        </div>
      </div>

      {/* Hotels Table */}
      <Card>
        <CardContent className="p-0">
          {filteredHotels.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {searchTerm ? 'No hotels found matching your search.' : 'No hotels yet. Click "New Hotel" to create one.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Location</th>
                    <th className="p-3 font-medium">City, Country</th>
                    <th className="p-3 font-medium">Rating</th>
                    <th className="p-3 font-medium">Contact</th>
                    <th className="p-3 font-medium">Room Types</th>
                    <th className="p-3 font-medium w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHotels.map(hotel => (
                    <tr key={hotel.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">{hotel.name}</div>
                        {hotel.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {hotel.description}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-sm">{hotel.location}</td>
                      <td className="p-3 text-sm">
                        {hotel.city && hotel.country ? `${hotel.city}, ${hotel.country}` : '-'}
                      </td>
                      <td className="p-3">
                        {hotel.star_rating ? (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              {hotel.star_rating}
                            </div>
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        <div className="space-y-1">
                          {hotel.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {hotel.email}
                            </div>
                          )}
                          {hotel.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {hotel.phone}
                            </div>
                          )}
                          {!hotel.email && !hotel.phone && <span className="text-muted-foreground">-</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        {hotel.room_groups && hotel.room_groups.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {hotel.room_groups.slice(0, 2).map((room, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {room.room_type}
                              </Badge>
                            ))}
                            {hotel.room_groups.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{hotel.room_groups.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDialog(hotel)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteHotel(hotel)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalFiltered)} of {totalFiltered} hotels
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Hotel Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingHotel ? 'Edit Hotel' : 'Add New Hotel'}</DialogTitle>
            <DialogDescription>
              {editingHotel ? 'Update hotel information and room types' : 'Enter hotel details and configure room types'}
            </DialogDescription>
          </DialogHeader>
          
          <HotelForm
            formData={hotelForm}
            setFormData={setHotelForm}
            roomGroupForm={roomGroupForm}
            setRoomGroupForm={setRoomGroupForm}
            addRoomGroup={addRoomGroup}
            removeRoomGroup={removeRoomGroup}
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveHotel}>
              {editingHotel ? 'Update Hotel' : 'Create Hotel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
