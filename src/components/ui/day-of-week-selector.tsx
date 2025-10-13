/**
 * DAY OF WEEK SELECTOR
 * Interactive M,T,W,T,F,S,S selector component
 * Used for conditions, availability, and scheduling
 */

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DayOfWeek, DayOfWeekSelection } from '@/types/unified-inventory'
import { DAY_OF_WEEK_SHORT, DAY_OF_WEEK_LABELS } from '@/types/unified-inventory'

interface DayOfWeekSelectorProps {
  value: DayOfWeekSelection
  onChange: (value: DayOfWeekSelection) => void
  disabled?: boolean
  className?: string
  label?: string
  required?: boolean
}

export function DayOfWeekSelector({
  value,
  onChange,
  disabled = false,
  className,
  label,
  required = false
}: DayOfWeekSelectorProps) {
  // Safety check for undefined/null value
  if (!value) {
    value = {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    }
  }
  const days: Array<{ key: keyof DayOfWeekSelection; day: DayOfWeek; label: string; short: string }> = [
    { key: 'monday', day: 'monday', label: DAY_OF_WEEK_LABELS.monday, short: DAY_OF_WEEK_SHORT.monday },
    { key: 'tuesday', day: 'tuesday', label: DAY_OF_WEEK_LABELS.tuesday, short: DAY_OF_WEEK_SHORT.tuesday },
    { key: 'wednesday', day: 'wednesday', label: DAY_OF_WEEK_LABELS.wednesday, short: DAY_OF_WEEK_SHORT.wednesday },
    { key: 'thursday', day: 'thursday', label: DAY_OF_WEEK_LABELS.thursday, short: DAY_OF_WEEK_SHORT.thursday },
    { key: 'friday', day: 'friday', label: DAY_OF_WEEK_LABELS.friday, short: DAY_OF_WEEK_SHORT.friday },
    { key: 'saturday', day: 'saturday', label: DAY_OF_WEEK_LABELS.saturday, short: DAY_OF_WEEK_SHORT.saturday },
    { key: 'sunday', day: 'sunday', label: DAY_OF_WEEK_LABELS.sunday, short: DAY_OF_WEEK_SHORT.sunday }
  ]

  const toggleDay = (dayKey: keyof DayOfWeekSelection) => {
    if (disabled) return
    onChange({
      ...value,
      [dayKey]: !value[dayKey]
    })
  }

  const selectAll = () => {
    if (disabled) return
    onChange({
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    })
  }

  const selectNone = () => {
    if (disabled) return
    onChange({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    })
  }

  const selectWeekdays = () => {
    if (disabled) return
    onChange({
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    })
  }

  const selectWeekend = () => {
    if (disabled) return
    onChange({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: true,
      sunday: true
    })
  }

  const selectedCount = Object.values(value).filter(Boolean).length

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      {/* Day buttons */}
      <div className="flex gap-1">
        {days.map(({ key, label: fullLabel, short }) => (
          <Button
            key={key}
            type="button"
            variant={value[key] ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'flex-1 min-w-[40px] h-10 font-semibold transition-colors',
              value[key] && 'bg-primary text-primary-foreground hover:bg-primary/90',
              !value[key] && 'hover:bg-muted'
            )}
            onClick={() => toggleDay(key)}
            disabled={disabled}
            title={fullLabel}
          >
            {short}
          </Button>
        ))}
      </div>

      {/* Quick select buttons */}
      <div className="flex gap-2 text-xs">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={selectAll}
          disabled={disabled}
        >
          All Days
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={selectWeekdays}
          disabled={disabled}
        >
          Weekdays
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={selectWeekend}
          disabled={disabled}
        >
          Weekend
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={selectNone}
          disabled={disabled}
        >
          None
        </Button>
      </div>

      {/* Selected count indicator */}
      {selectedCount > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedCount} {selectedCount === 1 ? 'day' : 'days'} selected
        </div>
      )}
    </div>
  )
}

/**
 * Compact version with just the day buttons
 */
export function DayOfWeekSelectorCompact({
  value,
  onChange,
  disabled = false,
  className
}: Omit<DayOfWeekSelectorProps, 'label' | 'required'>) {
  const days: Array<{ key: keyof DayOfWeekSelection; short: string }> = [
    { key: 'monday', short: 'M' },
    { key: 'tuesday', short: 'T' },
    { key: 'wednesday', short: 'W' },
    { key: 'thursday', short: 'T' },
    { key: 'friday', short: 'F' },
    { key: 'saturday', short: 'S' },
    { key: 'sunday', short: 'S' }
  ]

  const toggleDay = (dayKey: keyof DayOfWeekSelection) => {
    if (disabled) return
    onChange({
      ...value,
      [dayKey]: !value[dayKey]
    })
  }

  return (
    <div className={cn('inline-flex gap-1', className)}>
      {days.map(({ key, short }) => (
        <button
          key={key}
          type="button"
          className={cn(
            'w-8 h-8 rounded text-xs font-semibold transition-colors',
            value[key] 
              ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() => toggleDay(key)}
          disabled={disabled}
        >
          {short}
        </button>
      ))}
    </div>
  )
}

