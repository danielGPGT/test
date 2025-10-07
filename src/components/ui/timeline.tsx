import { Activity } from '@/contexts/data-context'
import { cn } from '@/lib/utils'

interface TimelineProps {
  items: Activity[]
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="h-2 w-2 rounded-full bg-primary" />
            {index < items.length - 1 && (
              <div className="h-full w-px bg-border mt-2" />
            )}
          </div>
          <div className={cn("flex-1 pb-4", index === items.length - 1 && "pb-0")}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                {item.time}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

