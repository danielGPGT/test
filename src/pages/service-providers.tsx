import { useState, useMemo } from 'react'
import { useData, ServiceCategory, ServicePricingUnit } from '@/contexts/data-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/ui/stats-card'
import { 
  Plus, 
  Car, 
  Ticket, 
  PartyPopper, 
  UtensilsCrossed, 
  Package,
  Trash2,
  MapPin,
  Pencil
} from 'lucide-react'
import { toast } from 'sonner'

const CATEGORY_ICONS: Record<ServiceCategory, any> = {
  transfer: Car,
  ticket: Ticket,
  activity: PartyPopper,
  meal: UtensilsCrossed,
  other: Package
}

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  transfer: 'Transfers',
  ticket: 'Tickets & Events',
  activity: 'Activities & Tours',
  meal: 'Meals & Dining',
  other: 'Other Services'
}


export function ServiceProviders() {
  const { 
    serviceInventoryTypes, 
    addServiceInventoryType, 
    updateServiceInventoryType, 
    deleteServiceInventoryType
  } = useData()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<any>(null)
  const [isServiceTypeOpen, setIsServiceTypeOpen] = useState(false)
  const [managingProvider, setManagingProvider] = useState<any>(null)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  
  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [providerForm, setProviderForm] = useState({
    name: '',
    category: 'transfer' as ServiceCategory,
    location: '',
    description: '',
    service_categories: [] as any[],
    active: true
  })

  const [serviceCategoryForm, setServiceCategoryForm] = useState({
    id: '',
    category_name: '',
    pricing_unit: 'per_person' as ServicePricingUnit,
    description: '',
    features: '',
    min_pax: undefined as number | undefined,
    max_pax: undefined as number | undefined
  })

  const handleCreateProvider = () => {
    if (!providerForm.name) {
      toast.error('Please fill in required fields')
      return
    }

    addServiceInventoryType(providerForm)
    toast.success('Service inventory type created!')
    setIsCreateOpen(false)
    resetProviderForm()
  }

  const handleUpdateProvider = () => {
    if (!editingProvider) return
    
    updateServiceInventoryType(editingProvider.id, providerForm)
    toast.success('Service inventory type updated!')
    setIsEditOpen(false)
    setEditingProvider(null)
    resetProviderForm()
  }

  const handleDeleteProvider = (provider: any) => {
    if (confirm(`Delete ${provider.name}? This will also delete all associated service categories.`)) {
      deleteServiceInventoryType(provider.id)
      toast.success('Service inventory type deleted')
    }
  }

  const handleOpenEdit = (provider: any) => {
    setEditingProvider(provider)
    setProviderForm({
      name: provider.name,
      category: provider.category,
      location: provider.location || '',
      description: provider.description || '',
      service_categories: provider.service_categories || [],
      active: provider.active
    })
    setIsEditOpen(true)
  }

  const handleManageServiceTypes = (provider: any) => {
    setManagingProvider(provider)
    setProviderForm({
      ...providerForm,
      service_categories: provider.service_categories || []
    })
  }

  const handleOpenEditCategory = (category: any) => {
    setEditingCategory(category)
    setServiceCategoryForm({
      id: category.id,
      category_name: category.category_name,
      pricing_unit: category.pricing_unit,
      description: category.description || '',
      features: category.features || '',
      min_pax: category.min_pax,
      max_pax: category.max_pax
    })
    setIsServiceTypeOpen(true)
  }

  const handleAddServiceCategory = () => {
    if (!serviceCategoryForm.category_name) {
      toast.error('Please enter a category name')
      return
    }

    if (editingCategory) {
      // Update existing category
      const updatedCategories = providerForm.service_categories.map((sc: any) =>
        sc.id === editingCategory.id ? { ...serviceCategoryForm } : sc
      )

      setProviderForm({
        ...providerForm,
        service_categories: updatedCategories
      })

      if (managingProvider) {
        updateServiceInventoryType(managingProvider.id, {
          service_categories: updatedCategories
        })
        toast.success('Service category updated!')
        setManagingProvider({
          ...managingProvider,
          service_categories: updatedCategories
        })
      }
    } else {
      // Add new category
      const newCategory = {
        ...serviceCategoryForm,
        id: serviceCategoryForm.id || `sc-${Date.now()}`
      }

      setProviderForm({
        ...providerForm,
        service_categories: [...providerForm.service_categories, newCategory]
      })

      if (managingProvider) {
        updateServiceInventoryType(managingProvider.id, {
          service_categories: [...providerForm.service_categories, newCategory]
        })
        toast.success('Service category added!')
        setManagingProvider({
          ...managingProvider,
          service_categories: [...providerForm.service_categories, newCategory]
        })
      }
    }

    setIsServiceTypeOpen(false)
    setEditingCategory(null)
    resetServiceCategoryForm()
  }

  const handleDeleteServiceCategory = (categoryId: string) => {
    const updatedCategories = providerForm.service_categories.filter((sc: any) => sc.id !== categoryId)
    
    setProviderForm({
      ...providerForm,
      service_categories: updatedCategories
    })

    if (managingProvider) {
      updateServiceInventoryType(managingProvider.id, {
        service_categories: updatedCategories
      })
      toast.success('Service category removed')
      setManagingProvider({
        ...managingProvider,
        service_categories: updatedCategories
      })
    }
  }

  const resetProviderForm = () => {
    setProviderForm({
      name: '',
      category: 'transfer',
      location: '',
      description: '',
      service_categories: [],
      active: true
    })
  }

  const resetServiceCategoryForm = () => {
    setServiceCategoryForm({
      id: '',
      category_name: '',
      pricing_unit: 'per_person',
      description: '',
      features: '',
      min_pax: undefined,
      max_pax: undefined
    })
  }

  // Filter inventory types
  const filteredInventoryTypes = useMemo(() => {
    return serviceInventoryTypes.filter((inventoryType: any) => {
      const matchesCategory = filterCategory === 'all' || inventoryType.category === filterCategory
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && inventoryType.active) ||
        (filterStatus === 'inactive' && !inventoryType.active)
      const matchesSearch = searchTerm === '' || 
        inventoryType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inventoryType.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inventoryType.location?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesCategory && matchesStatus && matchesSearch
    })
  }, [serviceInventoryTypes, filterCategory, filterStatus, searchTerm])

  // Group inventory types by category
  const typesByCategory: Record<string, any[]> = {}
  filteredInventoryTypes.forEach((inventoryType: any) => {
    const cat = inventoryType.category as string
    if (!typesByCategory[cat]) typesByCategory[cat] = []
    typesByCategory[cat].push(inventoryType)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Inventory Types</h1>
          <p className="text-muted-foreground mt-1">
            Manage service inventory types and categories (like hotels and room types)
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Inventory Type
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          title="Inventory Types"
          value={serviceInventoryTypes.length}
          icon={Package}
        />
        <StatsCard
          title="Active"
          value={serviceInventoryTypes.filter((p: any) => p.active).length}
          icon={Package}
        />
        <StatsCard
          title="Total Categories"
          value={serviceInventoryTypes.reduce((sum: number, p: any) => sum + (p.service_categories?.length || 0), 0)}
          icon={Package}
        />
        <StatsCard
          title="Category Types"
          value={Object.keys(typesByCategory).length}
          icon={Package}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(Object.keys(CATEGORY_LABELS) as ServiceCategory[]).map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Search</Label>
              <Input
                placeholder="Search name, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {(filterCategory !== 'all' || filterStatus !== 'all' || searchTerm) && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredInventoryTypes.length} of {serviceInventoryTypes.length} inventory types
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFilterCategory('all')
                  setFilterStatus('all')
                  setSearchTerm('')
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Inventory Types */}
      {filteredInventoryTypes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No service inventory types yet. Click "New Inventory Type" to get started.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {filteredInventoryTypes.map((inventoryType: any) => {
            const Icon = CATEGORY_ICONS[inventoryType.category as ServiceCategory] || Package
            const categoryCount = inventoryType.service_categories?.length || 0

            return (
              <AccordionItem 
                key={inventoryType.id} 
                value={`type-${inventoryType.id}`}
                className="border rounded-lg bg-card"
              >
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                      <div className="text-left">
                        <div className="font-semibold">{inventoryType.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {CATEGORY_LABELS[inventoryType.category as ServiceCategory]}
                          </Badge>
                          {inventoryType.location && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {inventoryType.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                        {categoryCount} {categoryCount === 1 ? 'category' : 'categories'}
                      </Badge>
                      {!inventoryType.active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    {/* Description */}
                    {inventoryType.description && (
                      <p className="text-sm text-muted-foreground">{inventoryType.description}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(inventoryType)}
                      >
                        Edit Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleManageServiceTypes(inventoryType)
                          setIsServiceTypeOpen(true)
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Category
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteProvider(inventoryType)}
                        className="ml-auto"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>

                    {/* Service Categories Table */}
                    {inventoryType.service_categories && inventoryType.service_categories.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead style={{ backgroundColor: 'hsl(var(--muted))' }}>
                            <tr>
                              <th className="text-left p-3 font-medium">Category Name</th>
                              <th className="text-left p-3 font-medium">Pricing Unit</th>
                              <th className="text-left p-3 font-medium">Capacity</th>
                              <th className="text-left p-3 font-medium">Features</th>
                              <th className="text-center p-3 font-medium w-20">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inventoryType.service_categories.map((sc: any, idx: number) => (
                              <tr 
                                key={sc.id}
                                style={{ 
                                  borderTop: idx > 0 ? '1px solid hsl(var(--border))' : 'none'
                                }}
                              >
                                <td className="p-3">
                                  <div className="font-medium">{sc.category_name}</div>
                                  {sc.description && (
                                    <div className="text-xs text-muted-foreground">{sc.description}</div>
                                  )}
                                </td>
                                <td className="p-3">
                                  <Badge variant="outline" className="text-xs">
                                    {sc.pricing_unit.replace('_', ' ')}
                                  </Badge>
                                </td>
                                <td className="p-3 text-muted-foreground">
                                  {sc.min_pax && sc.max_pax ? `${sc.min_pax}-${sc.max_pax} pax` :
                                   sc.min_pax ? `Min ${sc.min_pax} pax` :
                                   sc.max_pax ? `Max ${sc.max_pax} pax` : '-'}
                                </td>
                                <td className="p-3 text-xs text-muted-foreground">
                                  {sc.features || '-'}
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex justify-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        handleManageServiceTypes(inventoryType)
                                        handleOpenEditCategory(sc)
                                      }}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        handleManageServiceTypes(inventoryType)
                                        handleDeleteServiceCategory(sc.id)
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {(!inventoryType.service_categories || inventoryType.service_categories.length === 0) && (
                      <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                        No service categories added yet. Click "Add Category" to create one.
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      {/* Create Inventory Type Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Service Inventory Type</DialogTitle>
            <DialogDescription>
              Add a new service inventory type (e.g., "F1 Tickets", "Airport Transfers")
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Inventory Type Name *</Label>
              <Input
                value={providerForm.name}
                onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                placeholder="e.g., F1 Abu Dhabi GP Tickets, Yas Circuit Transfers"
              />
              <p className="text-xs text-muted-foreground">
                Descriptive name for this type of service (like a hotel name)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category *</Label>
                <Select
                  value={providerForm.category}
                  onValueChange={(value) => setProviderForm({ ...providerForm, category: value as ServiceCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABELS) as ServiceCategory[]).map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Location</Label>
                <Input
                  value={providerForm.location}
                  onChange={(e) => setProviderForm({ ...providerForm, location: e.target.value })}
                  placeholder="e.g., Abu Dhabi, UAE (or leave generic)"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={providerForm.description}
                onChange={(e) => setProviderForm({ ...providerForm, description: e.target.value })}
                placeholder="Generic description - tours are linked at contract/rate level..."
                rows={2}
              />
              <p className="text-xs text-muted-foreground italic">
                Note: This inventory type is reusable. Link to specific tours when creating contracts/rates.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={providerForm.active}
                onChange={(e) => setProviderForm({ ...providerForm, active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="active" className="text-sm font-medium">
                Active
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateProvider}>Create Inventory Type</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Inventory Type Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service Inventory Type</DialogTitle>
            <DialogDescription>
              Update service inventory type details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Inventory Type Name *</Label>
              <Input
                value={providerForm.name}
                onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Suppliers will be linked when creating contracts
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Category *</Label>
              <Select
                value={providerForm.category}
                onValueChange={(value) => setProviderForm({ ...providerForm, category: value as ServiceCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABELS) as ServiceCategory[]).map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Location</Label>
              <Input
                value={providerForm.location}
                onChange={(e) => setProviderForm({ ...providerForm, location: e.target.value })}
                placeholder="e.g., Abu Dhabi, UAE (or leave generic)"
              />
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={providerForm.description}
                onChange={(e) => setProviderForm({ ...providerForm, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={providerForm.active}
                onChange={(e) => setProviderForm({ ...providerForm, active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="edit-active" className="text-sm font-medium">
                Active
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateProvider}>Update Inventory Type</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Service Category Dialog */}
      <Dialog open={isServiceTypeOpen} onOpenChange={(open) => {
        setIsServiceTypeOpen(open)
        if (!open) {
          setEditingCategory(null)
          resetServiceCategoryForm()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit' : 'Add'} Service Category</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update' : 'Add a new'} service category to {managingProvider?.name || 'this inventory type'} (like {editingCategory ? 'editing' : 'adding'} a room type)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Category Name *</Label>
              <Input
                value={serviceCategoryForm.category_name}
                onChange={(e) => setServiceCategoryForm({ ...serviceCategoryForm, category_name: e.target.value })}
                placeholder="e.g., Grandstand - Main Straight, Private Sedan, Shared Shuttle"
              />
            </div>

            <div className="grid gap-2">
              <Label>Pricing Unit *</Label>
              <Select
                value={serviceCategoryForm.pricing_unit}
                onValueChange={(value) => setServiceCategoryForm({ ...serviceCategoryForm, pricing_unit: value as ServicePricingUnit })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_person">Per Person</SelectItem>
                  <SelectItem value="per_vehicle">Per Vehicle</SelectItem>
                  <SelectItem value="per_group">Per Group</SelectItem>
                  <SelectItem value="flat_rate">Flat Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Min Passengers</Label>
                <Input
                  type="number"
                  min={1}
                  value={serviceCategoryForm.min_pax || ''}
                  onChange={(e) => setServiceCategoryForm({ ...serviceCategoryForm, min_pax: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Optional"
                />
              </div>

              <div className="grid gap-2">
                <Label>Max Passengers</Label>
                <Input
                  type="number"
                  min={1}
                  value={serviceCategoryForm.max_pax || ''}
                  onChange={(e) => setServiceCategoryForm({ ...serviceCategoryForm, max_pax: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={serviceCategoryForm.description}
                onChange={(e) => setServiceCategoryForm({ ...serviceCategoryForm, description: e.target.value })}
                placeholder="Category details..."
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Features</Label>
              <Input
                value={serviceCategoryForm.features}
                onChange={(e) => setServiceCategoryForm({ ...serviceCategoryForm, features: e.target.value })}
                placeholder="e.g., Air-conditioned, WiFi, Professional driver"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsServiceTypeOpen(false)
              setEditingCategory(null)
              resetServiceCategoryForm()
            }}>Cancel</Button>
            <Button onClick={handleAddServiceCategory}>
              {editingCategory ? 'Update' : 'Add'} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

