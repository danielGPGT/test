import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils'

interface Column {
  header: string
  accessor: string
  width?: number
  format?: 'date' | 'currency' | 'percentage' | 'badge'
  truncate?: boolean
  type?: 'actions'
  actions?: string[]
}

interface DataTableProps<T> {
  title: string
  columns: Column[]
  data: T[]
  onView?: (item: T) => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  searchable?: boolean
  pageSize?: number
}

export function DataTable<T extends Record<string, any>>({
  title,
  columns,
  data,
  onView,
  onEdit,
  onDelete,
  searchable = false,
  pageSize = 10,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data

    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  }, [data, searchQuery])

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredData.slice(startIndex, startIndex + pageSize)
  }, [filteredData, currentPage, pageSize])

  const totalPages = Math.ceil(filteredData.length / pageSize)

  const formatValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return '-'

    switch (format) {
      case 'date':
        return formatDate(value)
      case 'currency':
        return formatCurrency(value)
      case 'percentage':
        return formatPercentage(value)
      case 'badge':
        // Handle different badge types
        let variant: 'default' | 'secondary' | 'outline' | 'destructive' = 'default'
        let displayValue = value
        
        // Booking status
        if (value === 'confirmed') {
          variant = 'default'
          displayValue = 'Confirmed'
        } else if (value === 'pending') {
          variant = 'secondary'
          displayValue = 'Pending'
        } else if (value === 'cancelled') {
          variant = 'destructive'
          displayValue = 'Cancelled'
        }
        // Occupancy types
        else if (['single', 'double', 'triple', 'quad'].includes(value)) {
          variant = 'outline'
          displayValue = value.charAt(0).toUpperCase() + value.slice(1)
        }
        // Board types
        else if (['room_only', 'bed_breakfast', 'half_board', 'full_board', 'all_inclusive'].includes(value)) {
          variant = 'outline'
          const labels: Record<string, string> = {
            room_only: 'RO',
            bed_breakfast: 'B&B',
            half_board: 'HB',
            full_board: 'FB',
            all_inclusive: 'AI'
          }
          displayValue = labels[value] || value
        }
        // Purchase types
        else if (value === 'inventory') {
          variant = 'default'
        } else if (value === 'buy_to_order') {
          variant = 'secondary'
          displayValue = 'Buy to Order'
        }
        
        return (
          <Badge variant={variant}>
            {displayValue}
          </Badge>
        )
      default:
        return value
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {searchable && (
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-8"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.accessor}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((column) => (
                      <TableCell key={column.accessor}>
                        {column.type === 'actions' ? (
                          <div className="flex gap-2">
                            {column.actions?.includes('view') && onView && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onView(row)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {column.actions?.includes('edit') && onEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(row)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {column.actions?.includes('delete') && onDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(row)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div
                            className={
                              column.truncate
                                ? 'max-w-[200px] truncate'
                                : undefined
                            }
                            title={column.truncate ? row[column.accessor] : undefined}
                          >
                            {formatValue(row[column.accessor], column.format)}
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({filteredData.length} total)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

