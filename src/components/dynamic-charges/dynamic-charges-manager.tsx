/**
 * DYNAMIC CHARGES MANAGER
 * Displays, adds, edits, and manages all dynamic charges for a contract or rate
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DynamicChargeFormSimple } from './dynamic-charge-form-simple'
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import type { DynamicCharge, ChargeType } from '@/types/unified-inventory'
import { CHARGE_TYPE_LABELS, CALCULATION_TYPE_LABELS } from '@/types/unified-inventory'
import { cn } from '@/lib/utils'

interface DynamicChargesManagerProps {
  charges: DynamicCharge[]
  onChange: (charges: DynamicCharge[]) => void
  disabled?: boolean
  title?: string
  description?: string
  compact?: boolean
}

export function DynamicChargesManager({
  charges,
  onChange,
  disabled = false,
  title = 'Dynamic Charges',
  description = 'Manage taxes, fees, discounts, commissions, and surcharges',
  compact = false
}: DynamicChargesManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCharge, setEditingCharge] = useState<DynamicCharge | undefined>()
  const [expandedCharges, setExpandedCharges] = useState<Set<string>>(new Set())

  const handleAdd = () => {
    setEditingCharge(undefined)
    setIsDialogOpen(true)
  }

  const handleEdit = (charge: DynamicCharge) => {
    setEditingCharge(charge)
    setIsDialogOpen(true)
  }

  const handleSave = (charge: DynamicCharge) => {
    if (editingCharge) {
      // Update existing
      onChange(charges.map(c => c.id === charge.id ? charge : c))
    } else {
      // Add new
      onChange([...charges, charge])
    }
    setIsDialogOpen(false)
    setEditingCharge(undefined)
  }

  const handleDelete = (chargeId: string) => {
    if (confirm('Are you sure you want to delete this charge?')) {
      onChange(charges.filter(c => c.id !== chargeId))
    }
  }

  const handleToggleExpand = (chargeId: string) => {
    setExpandedCharges(prev => {
      const next = new Set(prev)
      if (next.has(chargeId)) {
        next.delete(chargeId)
      } else {
        next.add(chargeId)
      }
      return next
    })
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newCharges = [...charges]
    const temp = newCharges[index - 1]
    newCharges[index - 1] = newCharges[index]
    newCharges[index] = temp
    onChange(newCharges.map((c, i) => ({ ...c, application_order: i })))
  }

  const handleMoveDown = (index: number) => {
    if (index === charges.length - 1) return
    const newCharges = [...charges]
    const temp = newCharges[index + 1]
    newCharges[index + 1] = newCharges[index]
    newCharges[index] = temp
    onChange(newCharges.map((c, i) => ({ ...c, application_order: i })))
  }

  const groupedCharges = charges.reduce((acc, charge) => {
    const type = charge.charge_type
    if (!acc[type]) acc[type] = []
    acc[type].push(charge)
    return acc
  }, {} as Record<ChargeType, DynamicCharge[]>)

  return (
    <Card className={cn(compact && "border-0 shadow-none")}>
      {!compact && title && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={cn(compact && "text-sm")}>{title}</CardTitle>
              {description && <CardDescription className={cn(compact && "text-xs")}>{description}</CardDescription>}
            </div>
            <Button onClick={handleAdd} disabled={disabled} size={compact ? "sm" : "sm"}>
              <Plus className={cn("h-4 w-4", !compact && "mr-2")} />
              {!compact && "Add Charge"}
            </Button>
          </div>
        </CardHeader>
      )}
      {compact && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">
            {charges.length} {charges.length === 1 ? 'charge' : 'charges'} configured
          </span>
          <Button onClick={handleAdd} disabled={disabled} size="sm" variant="outline">
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      )}
      <CardContent className={cn(compact && "p-0")}>
        {charges.length === 0 ? (
          <div className={cn(
            "text-center text-muted-foreground",
            compact ? "py-4" : "py-8"
          )}>
            <AlertCircle className={cn(
              "mx-auto mb-2 opacity-50",
              compact ? "h-8 w-8" : "h-12 w-12 mb-3"
            )} />
            <p className={cn("font-medium", compact && "text-xs")}>No charges defined</p>
            {!compact && <p className="text-sm">Add your first charge to get started</p>}
          </div>
        ) : (
          <div className={cn("space-y-4", compact && "space-y-2")}>
            {/* Summary by type - hide in compact mode */}
            {!compact && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {Object.entries(groupedCharges).map(([type, chargesOfType]) => (
                  <div key={type} className="text-center p-2 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground">{CHARGE_TYPE_LABELS[type as ChargeType]}</div>
                    <div className="text-lg font-semibold">{chargesOfType.length}</div>
                  </div>
                ))}
              </div>
            )}

            {/* All charges list */}
            <div className={cn("space-y-2", compact && "space-y-1.5")}>
              {charges.map((charge, index) => (
                <ChargeCard
                  key={charge.id}
                  charge={charge}
                  index={index}
                  totalCount={charges.length}
                  expanded={expandedCharges.has(charge.id)}
                  onToggleExpand={() => handleToggleExpand(charge.id)}
                  onEdit={() => handleEdit(charge)}
                  onDelete={() => handleDelete(charge.id)}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  disabled={disabled}
                  compact={compact}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Dialog for add/edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingCharge ? 'Edit Charge' : 'Add Charge'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingCharge ? 'Update the charge details' : 'Create a new charge'}
            </DialogDescription>
          </DialogHeader>
          <DynamicChargeFormSimple
            charge={editingCharge}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// Charge Card Component
function ChargeCard({
  charge,
  index,
  totalCount,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  disabled,
  compact = false
}: {
  charge: DynamicCharge
  index: number
  totalCount: number
  expanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  disabled: boolean
  compact?: boolean
}) {
  const getChargeIcon = () => {
    if (charge.direction === 'add') {
      return <TrendingUp className="h-4 w-4 text-red-500" />
    } else {
      return <TrendingDown className="h-4 w-4 text-green-500" />
    }
  }

  const getChargeColor = () => {
    switch (charge.charge_type) {
      case 'tax': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'fee': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'commission': return 'bg-green-100 text-green-800 border-green-200'
      case 'discount': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'surcharge': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card className={cn(
      'border-l-4 transition-all', 
      charge.active ? '' : 'opacity-60',
      compact && 'border-l-2'
    )}>
      <div className={cn("p-3", compact && "p-2")}>
        <div className="flex items-center justify-between gap-3">
          {/* Left side: charge info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {getChargeIcon()}
              <Badge variant="outline" className={cn(getChargeColor(), compact && "text-xs py-0 h-5")}>
                {CHARGE_TYPE_LABELS[charge.charge_type]}
              </Badge>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("font-medium truncate", compact && "text-sm")}>{charge.charge_name}</span>
                {!charge.active && <Badge variant="secondary" className={cn(compact && "text-xs h-4")}>Inactive</Badge>}
                {charge.mandatory && <Badge variant="default" className={cn(compact && "text-xs h-4")}>Mandatory</Badge>}
              </div>
              <div className={cn("text-sm text-muted-foreground truncate", compact && "text-xs")}>
                {CALCULATION_TYPE_LABELS[charge.calculation_type]}
                {charge.calculation_type === 'percentage' && charge.calculation_config.percentage && 
                  ` (${(charge.calculation_config.percentage * 100).toFixed(1)}%)`}
                {charge.calculation_type === 'fixed_amount' && charge.calculation_config.fixed_amount && 
                  ` (${charge.calculation_config.fixed_amount})`}
                {charge.conditions && charge.conditions.length > 0 && 
                  ` • ${charge.conditions.length} condition${charge.conditions.length > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>

          {/* Right side: actions */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="h-8 w-8 p-0"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onEdit}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={disabled}
              className="h-8 w-8 p-0 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t space-y-2 text-sm">
            {charge.description && (
              <div>
                <span className="font-medium">Description:</span> {charge.description}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-medium">Applied to:</span> {charge.applied_to}</div>
              <div><span className="font-medium">Direction:</span> {charge.direction}</div>
              <div><span className="font-medium">Timing:</span> {charge.timing}</div>
              <div><span className="font-medium">Display:</span> {charge.display_in_breakdown ? 'Yes' : 'No'}</div>
            </div>
            {charge.accounting_code && (
              <div><span className="font-medium">Accounting Code:</span> {charge.accounting_code}</div>
            )}
            {charge.conditions && charge.conditions.length > 0 && (
              <div>
                <span className="font-medium">Conditions:</span>
                <ul className="list-disc list-inside ml-2">
                  {charge.conditions.map((cond, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground">
                      {cond.condition_type} {cond.operator} {JSON.stringify(cond.value)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Order controls */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onMoveUp}
                disabled={disabled || index === 0}
              >
                Move Up
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onMoveDown}
                disabled={disabled || index === totalCount - 1}
              >
                Move Down
              </Button>
              <span className="text-xs text-muted-foreground self-center">
                Order: {index + 1} of {totalCount}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

