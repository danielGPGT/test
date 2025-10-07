import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Building2, 
  FileText, 
  DollarSign, 
  Plus, 
  Pencil, 
  Trash2,
  Star,
  MapPin,
  Calendar,
  Bed,
  Users
} from 'lucide-react'
import { useData, Hotel, Contract, Rate, OccupancyType, BoardType } from '@/contexts/data-context'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { BOARD_TYPE_LABELS } from '@/lib/pricing'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from 'sonner'

export function InventorySetup() {
  const { 
    hotels, 
    contracts, 
    rates,
    addHotel,
    updateHotel,
    deleteHotel,
    addContract,
    updateContract,
    deleteContract,
    addRate,
    updateRate,
    deleteRate
  } = useData()
  
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null)
  
  // Dialog states
  const [isHotelDialogOpen, setIsHotelDialogOpen] = useState(false)
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false)
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false)
  
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [editingRate, setEditingRate] = useState<Rate | null>(null)

  // Get selected entities
  const selectedHotel = useMemo(() => 
    hotels.find(h => h.id === selectedHotelId),
    [hotels, selectedHotelId]
  )

  const hotelContracts = useMemo(() => 
    selectedHotelId ? contracts.filter(c => c.hotel_id === selectedHotelId) : [],
    [contracts, selectedHotelId]
  )

  const selectedContract = useMemo(() =>
    hotelContracts.find(c => c.id === selectedContractId),
    [hotelContracts, selectedContractId]
  )

  const contractRates = useMemo(() =>
    selectedContractId ? rates.filter(r => r.contract_id === selectedContractId) : [],
    [rates, selectedContractId]
  )

  // Stats
  const hotelStats = useMemo(() => {
    return hotels.map(h => ({
      hotel: h,
      contractCount: contracts.filter(c => c.hotel_id === h.id).length,
      roomGroupCount: h.room_groups?.length || 0
    }))
  }, [hotels, contracts])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Setup</h1>
          <p className="text-muted-foreground mt-1">
            Manage hotels, contracts, and pricing in one place
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-240px)]">
        {/* Left Panel: Hotels */}
        <Card className="col-span-3 flex flex-col">
          <CardHeader className="flex-none">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Hotels
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => {
                toast.info('Hotel Management', {
                  description: 'Please use the Hotels page from the main menu for full hotel management.',
                  duration: 3000
                })
              }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="space-y-2">
              {hotelStats.map(({ hotel, contractCount, roomGroupCount }) => (
                <div
                  key={hotel.id}
                  onClick={() => {
                    setSelectedHotelId(hotel.id)
                    setSelectedContractId(null)
                  }}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                    selectedHotelId === hotel.id && "bg-accent border-primary"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{hotel.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {hotel.star_rating && (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: hotel.star_rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {hotel.location}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {contractCount} contracts
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {roomGroupCount} room types
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {hotels.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hotels yet. Click + to add one.
                </p>
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        {/* Middle Panel: Contracts */}
        <Card className="col-span-4 flex flex-col">
          <CardHeader className="flex-none">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {selectedHotel ? `Contracts - ${selectedHotel.name}` : 'Contracts'}
              </CardTitle>
              {selectedHotel && (
                <Button size="sm" variant="outline" onClick={() => {
                  toast.info('Contract Management', {
                    description: 'Please use the Contracts page from the main menu to add/edit contracts with shoulder night pricing.',
                    duration: 3000
                  })
                }}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="space-y-2">
              {selectedHotel ? (
                hotelContracts.length > 0 ? (
                  hotelContracts.map((contract) => (
                    <div
                      key={contract.id}
                      onClick={() => setSelectedContractId(contract.id)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                        selectedContractId === contract.id && "bg-accent border-primary"
                      )}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="font-medium">{contract.contract_name}</p>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6"
                              onClick={() => {
                                toast.info('Edit Contract', {
                                  description: 'Please use the Contracts page from the main menu to edit this contract.',
                                  duration: 3000
                                })
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6"
                              onClick={() => {
                                if (confirm(`Delete contract "${contract.contract_name}"?`)) {
                                  deleteContract(contract.id)
                                  toast.success('Contract deleted')
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3 w-3" />
                            Base: {formatCurrency(contract.base_rate)} {contract.currency}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Bed className="h-3 w-3" />
                            {contract.total_rooms} total rooms
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {contract.tax_rate && (
                            <Badge variant="secondary" className="text-xs">
                              VAT {(contract.tax_rate * 100).toFixed(0)}%
                            </Badge>
                          )}
                          {contract.city_tax_per_person_per_night && (
                            <Badge variant="secondary" className="text-xs">
                              City Tax {contract.city_tax_per_person_per_night}€
                            </Badge>
                          )}
                          {contract.resort_fee_per_night && (
                            <Badge variant="secondary" className="text-xs">
                              Resort {contract.resort_fee_per_night}€
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No contracts for this hotel
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => {
                        toast.info('Contract Management', {
                          description: 'Please use the Contracts page from the main menu to create contracts.',
                          duration: 3000
                        })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Contract
                    </Button>
                  </div>
                )
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select a hotel to view contracts
                </p>
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        {/* Right Panel: Rates */}
        <Card className="col-span-5 flex flex-col">
          <CardHeader className="flex-none">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {selectedContract ? `Rates - ${selectedContract.contract_name}` : 'Rates'}
              </CardTitle>
              {selectedContract && (
                <Button size="sm" variant="outline" onClick={() => {
                  toast.info('Rate Management', {
                    description: 'Please use the Rates page from the main menu to configure rates.',
                    duration: 3000
                  })
                }}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent>
              {selectedContract ? (
                <>
                  <Accordion type="multiple" defaultValue={["contract-details", "rates"]} className="w-full">
                    {/* Contract Details Section */}
                    <AccordionItem value="contract-details">
                      <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Contract Details
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Base Rate:</span>
                              <p className="font-medium">{formatCurrency(selectedContract.base_rate)} {selectedContract.currency}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total Rooms:</span>
                              <p className="font-medium">{selectedContract.total_rooms}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Period:</span>
                              <p className="font-medium text-xs">{formatDate(selectedContract.start_date)} to {formatDate(selectedContract.end_date)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Currency:</span>
                              <p className="font-medium">{selectedContract.currency}</p>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Rates Section */}
                    <AccordionItem value="rates">
                      <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Rates
                          {contractRates.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {contractRates.length}
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {contractRates.length > 0 ? (
                    <div className="space-y-2">
                      {contractRates.map((rate) => (
                        <div
                          key={rate.id}
                          className="p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm">{rate.roomName}</p>
                                <Badge variant="outline" className="text-xs">
                                  {rate.occupancy_type}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {BOARD_TYPE_LABELS[rate.board_type] || rate.board_type}
                                </Badge>
                              </div>
                              <p className="text-lg font-bold text-primary">
                                {formatCurrency(rate.rate)} {selectedContract.currency}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7"
                                onClick={() => {
                                  toast.info('Edit Rate', {
                                    description: 'Please use the Rates page from the main menu to edit this rate.',
                                    duration: 3000
                                  })
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7"
                                onClick={() => {
                                  if (confirm(`Delete rate for ${rate.roomName}?`)) {
                                    deleteRate(rate.id)
                                    toast.success('Rate deleted')
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No rates configured
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => {
                          toast.info('Rate Management', {
                            description: 'Please use the Rates page from the main menu to create rates.',
                            duration: 3000
                          })
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Rate
                      </Button>
                    </div>
                  )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </>
              ) : selectedHotel ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select a contract to view rates
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select a hotel and contract to view rates
                </p>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>

      {/* Quick Actions Bar */}
      {selectedHotel && (
        <Card className="bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium">
                  Selected: <span className="text-primary">{selectedHotel.name}</span>
                  {selectedContract && (
                    <> → <span className="text-primary">{selectedContract.contract_name}</span></>
                  )}
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {hotelContracts.length} contracts • {contractRates.length} rates configured
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  View Hotel Details
                </Button>
                {selectedContract && (
                  <Button size="sm" variant="outline">
                    View Contract Details
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

