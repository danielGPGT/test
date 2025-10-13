/**
 * UNIFIED FILTER BAR
 * Reusable filter component for unified inventory
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Calendar, Package, Filter } from 'lucide-react'
import { ITEM_TYPE_LABELS } from '@/types/unified-inventory'

interface FilterBarProps {
  // Filter values
  itemTypeFilter: string
  tourFilter: string
  supplierFilter: string
  statusFilter: string
  searchTerm: string
  
  // Data for dropdowns
  tours: Array<{ id: number; name: string }>
  suppliers: Array<{ id: number; name: string }>
  
  // Change handlers
  onItemTypeChange: (value: string) => void
  onTourChange: (value: string) => void
  onSupplierChange: (value: string) => void
  onStatusChange: (value: string) => void
  onSearchChange: (value: string) => void
  onClearFilters: () => void
  
  // Results count
  resultsCount?: { items?: number; contracts?: number; rates?: number }
}

export function FilterBar({
  itemTypeFilter,
  tourFilter,
  supplierFilter,
  statusFilter,
  searchTerm,
  tours,
  suppliers,
  onItemTypeChange,
  onTourChange,
  onSupplierChange,
  onStatusChange,
  onSearchChange,
  onClearFilters,
  resultsCount
}: FilterBarProps) {
  const itemTypes: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'All Types' },
    { value: 'hotel', label: ITEM_TYPE_LABELS.hotel },
    { value: 'ticket', label: ITEM_TYPE_LABELS.ticket },
    { value: 'transfer', label: ITEM_TYPE_LABELS.transfer },
    { value: 'activity', label: ITEM_TYPE_LABELS.activity },
    { value: 'meal', label: ITEM_TYPE_LABELS.meal },
    { value: 'venue', label: ITEM_TYPE_LABELS.venue },
    { value: 'transport', label: ITEM_TYPE_LABELS.transport },
    { value: 'experience', label: ITEM_TYPE_LABELS.experience },
    { value: 'other', label: ITEM_TYPE_LABELS.other },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4">
        {/* Item Type Filter */}
        <div className="grid gap-2">
          <Label className="text-xs font-medium flex items-center gap-2">
            <Filter className="h-3 w-3" />
            Item Type
          </Label>
          <Select value={itemTypeFilter} onValueChange={onItemTypeChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Search */}
        <div className="grid gap-2">
          <Label className="text-xs font-medium flex items-center gap-2">
            <Search className="h-3 w-3" />
            Search
          </Label>
          <Input
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9"
          />
        </div>
        
        {/* Tour Filter */}
        <div className="grid gap-2">
          <Label className="text-xs font-medium flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            Tour / Event
          </Label>
          <Select value={tourFilter} onValueChange={onTourChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tours</SelectItem>
              {tours.map(tour => (
                <SelectItem key={tour.id} value={tour.id.toString()}>
                  {tour.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Supplier Filter */}
        <div className="grid gap-2">
          <Label className="text-xs font-medium flex items-center gap-2">
            <Package className="h-3 w-3" />
            Supplier
          </Label>
          <Select value={supplierFilter} onValueChange={onSupplierChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers.map(supplier => (
                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Status Filter */}
        <div className="grid gap-2">
          <Label className="text-xs font-medium flex items-center gap-2">
            <Filter className="h-3 w-3" />
            Status
          </Label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Results Summary & Clear */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="text-xs text-muted-foreground">
          {resultsCount && (
            <>
              {resultsCount.items !== undefined && `${resultsCount.items} items`}
              {resultsCount.contracts !== undefined && ` • ${resultsCount.contracts} contracts`}
              {resultsCount.rates !== undefined && ` • ${resultsCount.rates} rates`}
            </>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearFilters}
        >
          Clear Filters
        </Button>
      </div>
    </div>
  )
}

