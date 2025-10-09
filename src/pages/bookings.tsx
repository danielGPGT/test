import { useState, useMemo } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { BOARD_TYPE_LABELS } from '@/lib/pricing'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData, Booking, OccupancyType } from '@/contexts/data-context'
import { Plus, AlertCircle, Users, FileText, CheckCircle, RefreshCw } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { formatCurrency } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function Bookings() {
  const navigate = useNavigate()
  const { bookings, tours, listings, rates, contracts, hotels, addBooking, cancelBooking, recordPurchaseDetails, convertBuyToOrderRoom } = useData()
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false)
  const [selectedBookingForPurchase, setSelectedBookingForPurchase] = useState<Booking | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null)
  const [isConversionOpen, setIsConversionOpen] = useState(false)
  const [selectedRoomForConversion, setSelectedRoomForConversion] = useState<any>(null)
  const [selectedContractId, setSelectedContractId] = useState<number>(0)
  const [formData, setFormData] = useState({
    tour_id: 0,
    listing_id: 0,
    rate_id: 0, // New field for rate selection
    occupancy_type: 'double' as OccupancyType, // Selected occupancy type
    // New booking controls
    check_in_date: '',
    check_out_date: '',
    adults: 2,
    children: 0,
    // Customer + rooms
    customer_name: '',
    customer_email: '',
    quantity: 1,
    // Second room (optional)
    second_listing_id: 0,
    second_rate_id: 0,
    second_quantity: 0,
    second_occupancy_type: 'double' as OccupancyType,
  })

  const [purchaseFormData, setPurchaseFormData] = useState({
    assigned_to: '',
    hotel_contact: '',
    hotel_confirmation: '',
    cost_per_room: 0,
    notes: '',
  })

  // Get selected tour
  const selectedTour = useMemo(() => 
    tours.find(t => t.id === formData.tour_id),
    [tours, formData.tour_id]
  )

  // Derived check-in/out: default to tour dates if not set
  const effectiveCheckIn = formData.check_in_date || selectedTour?.start_date || ''
  const effectiveCheckOut = formData.check_out_date || selectedTour?.end_date || ''

  // Get available listings for selected tour
  const availableListings = useMemo(() => {
    if (!selectedTour) return []
    
    return listings
      .filter(l => l.tour_id === selectedTour.id)
      .map(l => {
        // For inventory listings, check availability from contract room allocations
        if (l.purchase_type === 'inventory' && l.contract_id) {
          const contract = contracts.find(c => c.id === l.contract_id)
          const allocation = contract?.room_allocations?.find(a => a.room_group_ids.includes(l.room_group_id))
          
          // Calculate sold rooms for this listing
          const sold = bookings
            .filter(b => b.status !== 'cancelled' && b.rooms && b.rooms.length > 0)
            .flatMap(b => b.rooms)
            .filter(r => r.listing_id === l.id)
            .reduce((sum, r) => sum + r.quantity, 0)
          
          return {
            ...l,
            available: allocation ? allocation.quantity - sold : 0
          }
        }
        // For buy-to-order, always show (flexible)
        return {
          ...l,
          available: 999 // Large number to indicate flexible capacity
        }
      })
      .filter(l => {
        // Inventory: must have availability
        if (l.purchase_type === 'inventory') {
          return l.available > 0
        }
        // Buy-to-order: always show (flexible capacity)
        return true
      })
  }, [selectedTour, listings, contracts, bookings])

  // Get selected listing
  const selectedListing = useMemo(() => 
    availableListings.find(l => l.id === formData.listing_id),
    [availableListings, formData.listing_id]
  )

  // Get available rates for selected listing (all occupancies)
  const availableRates = useMemo(() => {
    if (!selectedListing) return []
    
    // For inventory listings: find rates that match the listing's contract and room group
    if (selectedListing.purchase_type === 'inventory' && selectedListing.contract_id) {
      return rates.filter(rate => 
        rate.contract_id === selectedListing.contract_id && 
        rate.room_group_id === selectedListing.room_group_id
      )
    }
    
    // For buy-to-order listings: find rates for the hotel and room group
    if (selectedListing.purchase_type === 'buy_to_order' && selectedListing.hotel_id) {
      return rates.filter(rate => {
        // Match room type
        if (rate.room_group_id !== selectedListing.room_group_id) return false
        
        // Include hotel-based buy-to-order rates
        if (rate.hotel_id === selectedListing.hotel_id) return true
        
        // Also include contract rates for this hotel (fallback)
        if (rate.contract_id) {
          const contract = contracts.find(c => c.id === rate.contract_id)
          return contract && contract.hotel_id === selectedListing.hotel_id
        }
        
        return false
      })
    }
    
    return []
  }, [selectedListing, rates, contracts])

  // Get selected rate
  const selectedRate = useMemo(() => 
    availableRates.find(r => r.id === formData.rate_id),
    [availableRates, formData.rate_id]
  )

  // Get unique occupancy types available for selected listing and board type
  const _availableOccupancies = useMemo(() => {
    if (!selectedRate) return []
    
    // Find all rates with the same contract, room, and board
    const matchingRates = availableRates.filter(r => 
      r.contract_id === selectedRate.contract_id &&
      r.room_group_id === selectedRate.room_group_id &&
      r.board_type === selectedRate.board_type
    )
    
    return matchingRates.map(r => ({
      occupancy: r.occupancy_type,
      rate: r,
      price: r.rate
    }))
  }, [selectedRate, availableRates])

  // Get available listings for second room (include same room type - allows same room with different occupancy)
  const availableSecondListings = useMemo(() => {
    if (!selectedListing) return []
    
    console.log('📋 Available second listings:', availableListings.length, 'listings')
    
    // Allow same room type (e.g., Standard Double) so you can book Double + Single of same room
    return availableListings
  }, [availableListings, selectedListing])

  // Get selected second listing
  const selectedSecondListing = useMemo(() => 
    availableSecondListings.find(l => l.id === formData.second_listing_id),
    [availableSecondListings, formData.second_listing_id]
  )

  // Get available rates for second listing (all occupancies)
  const availableSecondRates = useMemo(() => {
    if (!selectedSecondListing) return []
    
    // For inventory listings: find rates that match the listing's contract and room group
    if (selectedSecondListing.purchase_type === 'inventory' && selectedSecondListing.contract_id) {
      return rates.filter(rate => 
        rate.contract_id === selectedSecondListing.contract_id && 
        rate.room_group_id === selectedSecondListing.room_group_id
      )
    }
    
    // For buy-to-order listings: find rates for the hotel and room group
    if (selectedSecondListing.purchase_type === 'buy_to_order' && selectedSecondListing.hotel_id) {
      return rates.filter(rate => {
        // Match room type
        if (rate.room_group_id !== selectedSecondListing.room_group_id) return false
        
        // Include hotel-based buy-to-order rates
        if (rate.hotel_id === selectedSecondListing.hotel_id) return true
        
        // Also include contract rates for this hotel (fallback)
        if (rate.contract_id) {
          const contract = contracts.find(c => c.id === rate.contract_id)
          return contract && contract.hotel_id === selectedSecondListing.hotel_id
        }
        
        return false
      })
    }
    
    return []
  }, [selectedSecondListing, rates, contracts])

  // Get selected second rate
  const selectedSecondRate = useMemo(() => 
    availableSecondRates.find(r => r.id === formData.second_rate_id),
    [availableSecondRates, formData.second_rate_id]
  )

  // Get available occupancies for second room
  const _availableSecondOccupancies = useMemo(() => {
    if (!selectedSecondRate) return []
    
    const matchingRates = availableSecondRates.filter(r => 
      r.contract_id === selectedSecondRate.contract_id &&
      r.room_group_id === selectedSecondRate.room_group_id &&
      r.board_type === selectedSecondRate.board_type
    )
    
    return matchingRates.map(r => ({
      occupancy: r.occupancy_type,
      rate: r,
      price: r.rate
    }))
  }, [selectedSecondRate, availableSecondRates])

  // Get selected contract for pricing calculations
  const selectedContract = useMemo(() => {
    if (!selectedListing) return null
    
    if (selectedListing.purchase_type === 'inventory' && selectedListing.contract_id) {
      return contracts.find(c => c.id === selectedListing.contract_id)
    }
    
    // For buy-to-order with rate that has contract_id, use that contract
    if (selectedRate && selectedRate.contract_id) {
      return contracts.find(c => c.id === selectedRate.contract_id)
    }
    
    // For buy-to-order with hotel-based rate (no contract), create mock contract from rate
    if (selectedRate && selectedRate.hotel_id) {
      return {
        id: 0,
        hotel_id: selectedRate.hotel_id,
        hotelName: selectedRate.hotelName || '',
        contract_name: 'Buy-to-Order',
        start_date: '',
        end_date: '',
        total_rooms: 999,
        base_rate: selectedRate.rate,
        currency: selectedRate.currency || 'EUR',
        tax_rate: selectedRate.tax_rate || 0,
        city_tax_per_person_per_night: selectedRate.city_tax_per_person_per_night || 0,
        resort_fee_per_night: selectedRate.resort_fee_per_night || 0,
        supplier_commission_rate: selectedRate.supplier_commission_rate || 0,
        board_options: [],
      } as any
    }
    
    return null
  }, [selectedListing, selectedRate, contracts])

  // Calculate detailed price breakdown for a single room type
  const calculateRoomPrice = (rate: any, contract: any, quantity: number, occupancy: OccupancyType) => {
    if (!rate || !contract || quantity <= 0) return { total: 0, breakdown: null }

    const checkInDate = new Date(effectiveCheckIn)
    const checkOutDate = new Date(effectiveCheckOut)
    const contractStartDate = new Date(contract.start_date)
    const contractEndDate = new Date(contract.end_date)
    
    // Calculate number of nights
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Night-by-night breakdown
    const nightlyBreakdown: Array<{
      date: string
      type: 'contract' | 'pre_shoulder' | 'post_shoulder'
      rate: number
      baseRate: number
      boardCost: number
    }> = []
    
    // Rate is already for the correct occupancy type (no calculation needed!)
    const roomRate = rate.rate
    
    // Determine board cost based on rate structure
    const peoplePerRoom = occupancy === 'single' ? 1 : occupancy === 'double' ? 2 : occupancy === 'triple' ? 3 : 4
    let boardCostPerNight = 0
    
    if (rate.board_included) {
      // Get board cost from contract (per person per night)
      const boardOption = contract.board_options?.find((b: any) => b.board_type === rate.board_type)
      if (boardOption) {
        boardCostPerNight = boardOption.additional_cost * peoplePerRoom // Multiply by occupancy!
      }
    } else if (rate.board_cost) {
      // Board cost override (total per room)
      boardCostPerNight = rate.board_cost
    }
    
    let totalRoomRateBeforeCommission = 0
    
    // Calculate base price for each night
    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkInDate)
      currentDate.setDate(currentDate.getDate() + i)
      
      let nightlyRate = roomRate // Base rate for this occupancy
      let nightType: 'contract' | 'pre_shoulder' | 'post_shoulder' = 'contract'
      
      // Check if this is a shoulder night
      if (currentDate < contractStartDate) {
        // Pre-shoulder night
        const daysBefore = Math.ceil((contractStartDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
        if (contract.pre_shoulder_rates && contract.pre_shoulder_rates[daysBefore - 1]) {
          nightlyRate = contract.pre_shoulder_rates[daysBefore - 1]
          nightType = 'pre_shoulder'
        }
      } else if (currentDate > contractEndDate) {
        // Post-shoulder night
        const daysAfter = Math.ceil((currentDate.getTime() - contractEndDate.getTime()) / (1000 * 60 * 60 * 24))
        if (contract.post_shoulder_rates && contract.post_shoulder_rates[daysAfter - 1]) {
          nightlyRate = contract.post_shoulder_rates[daysAfter - 1]
          nightType = 'post_shoulder'
        }
      }
      
      totalRoomRateBeforeCommission += nightlyRate
      
      nightlyBreakdown.push({
        date: currentDate.toISOString().split('T')[0],
        type: nightType,
        rate: nightlyRate + boardCostPerNight, // Total including board if separate
        baseRate: nightlyRate,
        boardCost: boardCostPerNight
      })
    }
    
    // Now calculate per-room costs
    const totalBaseRateForAllNights = totalRoomRateBeforeCommission // Base room rate for all nights
    const totalBoardCostForAllNights = boardCostPerNight * nights // Separate board cost
    const totalRoomRate = totalBaseRateForAllNights + totalBoardCostForAllNights // Total including board
    
    // Use rate-level costs if available, otherwise fall back to contract
    const commissionRate = rate.supplier_commission_rate !== undefined ? rate.supplier_commission_rate : (contract.supplier_commission_rate || 0)
    const taxRate = rate.tax_rate !== undefined ? rate.tax_rate : (contract.tax_rate || 0)
    const cityTaxPerPerson = rate.city_tax_per_person_per_night !== undefined ? rate.city_tax_per_person_per_night : (contract.city_tax_per_person_per_night || 0)
    const resortFeePerNight = rate.resort_fee_per_night !== undefined ? rate.resort_fee_per_night : (contract.resort_fee_per_night || 0)
    
    // Debug logging
    console.log('💰 BOOKING CALCULATION DEBUG:', {
      occupancy,
      peoplePerRoom,
      rate: {
        occupancy_type: rate.occupancy_type,
        rate: rate.rate,
        board_included: rate.board_included,
        board_cost: rate.board_cost,
        city_tax_per_person_per_night: rate.city_tax_per_person_per_night,
      },
      contract: {
        city_tax_per_person_per_night: contract.city_tax_per_person_per_night,
      },
      calculated: {
        cityTaxPerPerson,
        cityTaxTotal: cityTaxPerPerson * peoplePerRoom * nights,
        boardCostPerNight,
      }
    })
    
    // Supplier commission (only on BASE rate, not board)
    const commissionPerRoom = totalBaseRateForAllNights * commissionRate
    
    // Net rate after commission
    const netBaseRatePerRoom = totalBaseRateForAllNights - commissionPerRoom
    const netTotalRatePerRoom = netBaseRatePerRoom + totalBoardCostForAllNights
    
    // Resort fee per room
    const resortFeePerRoom = resortFeePerNight * nights
    
    // Subtotal before VAT (per room)
    const subtotalBeforeVATPerRoom = netTotalRatePerRoom + resortFeePerRoom
    
    // VAT on subtotal (per room)
    const vatPerRoom = subtotalBeforeVATPerRoom * taxRate
    
    // City tax per room (based on actual occupancy)
    const cityTaxPerRoom = cityTaxPerPerson * peoplePerRoom * nights
    
    // Total cost per room
    const totalCostPerRoom = subtotalBeforeVATPerRoom + vatPerRoom + cityTaxPerRoom
    
    // Calculate selling prices with markup
    const markupPercentage = rate.markup_percentage ?? 0.60 // Default 60%
    const shoulderMarkupPercentage = rate.shoulder_markup_percentage ?? 0.30 // Default 30%
    
    // Calculate number of regular vs shoulder nights
    const regularNights = nightlyBreakdown.filter(n => n.type === 'contract').length
    const shoulderNights = nightlyBreakdown.filter(n => n.type !== 'contract').length
    
    // Apply different markup to regular and shoulder nights
    const costPerRegularNight = regularNights > 0 ? (totalCostPerRoom / nights) : 0
    const costPerShoulderNight = shoulderNights > 0 ? (totalCostPerRoom / nights) : 0
    
    const sellingPriceRegularNights = costPerRegularNight * regularNights * (1 + markupPercentage)
    const sellingPriceShoulderNights = costPerShoulderNight * shoulderNights * (1 + shoulderMarkupPercentage)
    const totalSellingPricePerRoom = sellingPriceRegularNights + sellingPriceShoulderNights
    
    // Apply quantity
    const breakdown = {
      nights,
      quantity,
      nightlyBreakdown,
      regularNights,
      shoulderNights,
      // Per room calculations
      perRoom: {
        baseRate: totalBaseRateForAllNights,
        boardCost: totalBoardCostForAllNights,
        totalRoomRate: totalRoomRate,
        commission: commissionPerRoom,
        netBaseRate: netBaseRatePerRoom,
        netTotalRate: netTotalRatePerRoom,
        resortFee: resortFeePerRoom,
        subtotalBeforeVAT: subtotalBeforeVATPerRoom,
        vat: vatPerRoom,
        cityTax: cityTaxPerRoom,
        totalCost: totalCostPerRoom,
        sellingPrice: totalSellingPricePerRoom,
        markup: totalSellingPricePerRoom - totalCostPerRoom
      },
      // Total for all rooms
      total: {
        baseRate: totalBaseRateForAllNights * quantity,
        boardCost: totalBoardCostForAllNights * quantity,
        totalRoomRate: totalRoomRate * quantity,
        commission: commissionPerRoom * quantity,
        netBaseRate: netBaseRatePerRoom * quantity,
        netTotalRate: netTotalRatePerRoom * quantity,
        resortFee: resortFeePerRoom * quantity,
        subtotalBeforeVAT: subtotalBeforeVATPerRoom * quantity,
        vat: vatPerRoom * quantity,
        cityTax: cityTaxPerRoom * quantity,
        totalCost: totalCostPerRoom * quantity,
        sellingPrice: totalSellingPricePerRoom * quantity,
        markup: (totalSellingPricePerRoom - totalCostPerRoom) * quantity
      },
      contractInfo: {
        commissionRate: commissionRate,
        taxRate: taxRate,
        cityTaxPerPersonPerNight: cityTaxPerPerson,
        resortFeePerNight: resortFeePerNight
      },
      markupInfo: {
        regularMarkup: markupPercentage,
        shoulderMarkup: shoulderMarkupPercentage
      }
    }
    
    return { total: totalCostPerRoom * quantity, breakdown }
  }

  // Calculate total price including both rooms
  const _priceCalculation = useMemo(() => {
    if (!selectedRate || !selectedContract || !selectedTour || formData.quantity <= 0) {
      return { total: 0, firstRoom: null, secondRoom: null }
    }

    const firstRoom = calculateRoomPrice(selectedRate, selectedContract, formData.quantity, formData.occupancy_type)
    let secondRoom = null
    
    // Add second room if selected
    if (selectedSecondRate && selectedSecondListing && formData.second_quantity > 0) {
      const secondContract = selectedSecondListing.purchase_type === 'inventory' && selectedSecondListing.contract_id
        ? contracts.find(c => c.id === selectedSecondListing.contract_id)
        : contracts.find(c => c.hotel_id === selectedSecondListing.hotel_id)
      
      if (secondContract) {
        secondRoom = calculateRoomPrice(selectedSecondRate, secondContract, formData.second_quantity, formData.second_occupancy_type)
      }
    }
    
    return {
      total: firstRoom.total + (secondRoom?.total || 0),
      firstRoom: firstRoom.breakdown,
      secondRoom: secondRoom?.breakdown || null
    }
  }, [selectedRate, selectedContract, selectedTour, formData.quantity, formData.occupancy_type, selectedSecondRate, selectedSecondListing, formData.second_quantity, formData.second_occupancy_type, effectiveCheckIn, effectiveCheckOut, contracts])

  // Transform bookings for table display (flatten rooms for display)
  const bookingsTableData = useMemo(() => 
    bookings
      .filter(booking => booking.rooms && booking.rooms.length > 0) // Filter out bookings without rooms array
      .map(booking => ({
        ...booking,
        // Show summary of rooms with hotel
        roomsSummary: booking.rooms.map(r => `${r.quantity}× ${r.hotelName} - ${r.roomName} (${r.occupancy_type})`).join(' + '),
        totalRoomCount: booking.rooms.reduce((sum, r) => sum + r.quantity, 0),
        totalGuests: booking.rooms.reduce((sum, r) => {
          const people = r.occupancy_type === 'single' ? 1 : r.occupancy_type === 'double' ? 2 : r.occupancy_type === 'triple' ? 3 : 4
          return sum + (people * r.quantity)
        }, 0),
      })),
    [bookings]
  )

  const columns = [
    { header: 'ID', accessor: 'id', width: 60 },
    { 
      header: 'Status', 
      accessor: 'status',
      format: 'badge' as const,
    },
    { header: 'Tour', accessor: 'tourName' },
    { header: 'Rooms', accessor: 'roomsSummary', truncate: true },
    { header: '# Rooms', accessor: 'totalRoomCount' },
    { header: 'Guests', accessor: 'totalGuests' },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Email', accessor: 'customer_email', truncate: true },
    { header: 'Total Price', accessor: 'total_price', format: 'currency' as const },
    { header: 'Booking Date', accessor: 'booking_date', format: 'date' as const },
    { header: 'Actions', accessor: 'actions', type: 'actions' as const, actions: ['view', 'delete'] },
  ]

  const _handleCreate = () => {
    if (!selectedListing || !selectedRate || !selectedContract || !selectedTour) return

    // Calculate number of nights
    const checkInDate = new Date(effectiveCheckIn)
    const checkOutDate = new Date(effectiveCheckOut)
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

    // Build rooms array
    const rooms: any[] = []

    // First room
    const firstRoomCalc = calculateRoomPrice(selectedRate, selectedContract, formData.quantity, formData.occupancy_type)
    if (!firstRoomCalc.breakdown) {
      alert('Error calculating room price')
      return
    }
    
    const firstHotel = selectedListing.purchase_type === 'inventory' && selectedListing.hotel_id
      ? hotels.find(h => h.id === selectedListing.hotel_id)
      : null
    
    rooms.push({
      listing_id: formData.listing_id,
      rate_id: formData.rate_id,
      hotelName: firstHotel?.name || selectedListing.hotelName || 'Unknown Hotel',
      roomName: selectedListing.roomName,
      contractName: selectedContract.contract_name,
      occupancy_type: formData.occupancy_type,
      board_type: selectedRate.board_type,
      purchase_type: selectedListing.purchase_type,
      quantity: formData.quantity,
      price_per_room: firstRoomCalc.breakdown.perRoom.sellingPrice, // Use selling price
      total_price: firstRoomCalc.breakdown.total.sellingPrice, // Use selling price
      purchase_status: selectedListing.purchase_type === 'buy_to_order' ? 'pending_purchase' : 'not_required',
    })

    // Second room (if selected)
    if (selectedSecondRate && selectedSecondListing && formData.second_quantity > 0) {
      const secondContract = selectedSecondListing.purchase_type === 'inventory' && selectedSecondListing.contract_id
        ? contracts.find(c => c.id === selectedSecondListing.contract_id)
        : contracts.find(c => c.hotel_id === selectedSecondListing.hotel_id)
      
      if (secondContract) {
        const secondRoomCalc = calculateRoomPrice(selectedSecondRate, secondContract, formData.second_quantity, formData.second_occupancy_type)
        if (!secondRoomCalc.breakdown) {
          alert('Error calculating second room price')
          return
        }
        
        const secondHotel = selectedSecondListing.purchase_type === 'inventory' && selectedSecondListing.hotel_id
          ? hotels.find(h => h.id === selectedSecondListing.hotel_id)
          : null
        
        rooms.push({
          listing_id: formData.second_listing_id,
          rate_id: formData.second_rate_id,
          hotelName: secondHotel?.name || selectedSecondListing.hotelName || 'Unknown Hotel',
          roomName: selectedSecondListing.roomName,
          contractName: secondContract.contract_name,
          occupancy_type: formData.second_occupancy_type,
          board_type: selectedSecondRate.board_type,
          purchase_type: selectedSecondListing.purchase_type,
          quantity: formData.second_quantity,
          price_per_room: secondRoomCalc.breakdown.perRoom.sellingPrice, // Use selling price
          total_price: secondRoomCalc.breakdown.total.sellingPrice, // Use selling price
          purchase_status: selectedSecondListing.purchase_type === 'buy_to_order' ? 'pending_purchase' : 'not_required',
        })
      }
    }

    // Create single booking with multiple rooms - total is selling price to client
    const totalPrice = rooms.reduce((sum, room) => sum + room.total_price, 0)
    
    console.log('✅ Creating booking with rooms:', rooms)
    
    addBooking({
      tour_id: formData.tour_id,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          check_in_date: effectiveCheckIn,
          check_out_date: effectiveCheckOut,
          nights: nights,
      rooms: rooms,
      total_price: totalPrice,
        })

    // Dialog navigation removed - now using dedicated page
    resetForm()
  }
  
  // Suppress unused variable warnings (old booking dialog code kept for reference)
  void _availableOccupancies
  void _availableSecondOccupancies
  void _priceCalculation
  void _handleCreate

  const resetForm = () => {
    setFormData({
      tour_id: 0,
      listing_id: 0,
      rate_id: 0,
      occupancy_type: 'double',
      check_in_date: '',
      check_out_date: '',
      adults: 2,
      children: 0,
      customer_name: '',
      customer_email: '',
      quantity: 1,
      // Second room (optional)
      second_listing_id: 0,
      second_rate_id: 0,
      second_quantity: 0,
      second_occupancy_type: 'double',
    })
  }

  const handleView = (booking: Booking) => {
    setViewingBooking(booking)
    setIsViewOpen(true)
  }

  const handleCancel = (booking: Booking) => {
    if (booking.status === 'cancelled') {
      alert('This booking is already cancelled')
      return
    }

    if (!booking.rooms || booking.rooms.length === 0) {
      alert('This booking has no rooms')
      return
    }

    const totalRooms = booking.rooms.reduce((sum, r) => sum + r.quantity, 0)
    if (confirm(`Cancel booking for ${booking.customer_name}? This will return ${totalRooms} room(s) to inventory.`)) {
      cancelBooking(booking.id)
    }
  }

  const handleOpenPurchaseForm = (booking: Booking) => {
    if (!booking.rooms || booking.rooms.length === 0) {
      alert('This booking has no rooms')
      return
    }

    const hasBuyToOrder = booking.rooms.some(r => r.purchase_type === 'buy_to_order')
    if (!hasBuyToOrder) {
      alert('This booking doesn\'t require purchase entry')
      return
    }

    const allPurchased = booking.rooms.every(r => r.purchase_type !== 'buy_to_order' || r.purchase_status === 'purchased')
    if (allPurchased) {
      alert('Purchase details already entered for all rooms')
      return
    }

    setSelectedBookingForPurchase(booking)
    setPurchaseFormData({
      assigned_to: '',
      hotel_contact: '',
      hotel_confirmation: '',
      cost_per_room: 0,
      notes: '',
    })
    setIsPurchaseFormOpen(true)
  }

  const handleSubmitPurchase = () => {
    if (!selectedBookingForPurchase) return

    if (!purchaseFormData.assigned_to || !purchaseFormData.hotel_contact || 
        !purchaseFormData.hotel_confirmation || purchaseFormData.cost_per_room <= 0) {
      alert('Please fill in all required fields')
      return
    }

    recordPurchaseDetails(selectedBookingForPurchase.id, purchaseFormData)
    setIsPurchaseFormOpen(false)
    setSelectedBookingForPurchase(null)
    
    alert(`✅ Purchase recorded successfully!\n\nBooking Status: CONFIRMED`)
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const confirmed = bookings.filter(b => b.status === 'confirmed').length
    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.total_price, 0)
    const totalRooms = bookings
      .filter(b => b.status === 'confirmed' && b.rooms && b.rooms.length > 0)
      .flatMap(b => b.rooms)
      .reduce((sum, r) => sum + r.quantity, 0)

    return { confirmed, totalRevenue, totalRooms }
  }, [bookings])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground mt-1">Book rooms and see real-time inventory updates</p>
        </div>
        <Button onClick={() => navigate('/bookings/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Booking
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground">Confirmed bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From confirmed bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rooms Booked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRooms}</div>
            <p className="text-xs text-muted-foreground">Total rooms sold</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Buy-to-Order Bookings Alert */}
      {bookings.some(b => b.rooms && b.rooms.some(r => r.purchase_type === 'buy_to_order' && r.purchase_status === 'pending_purchase')) && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                  Pending Hotel Purchases
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-200 mt-1">
                  You have buy-to-order bookings that need rooms purchased from the hotel. 
                  Operations team must contact the hotel and enter purchase details.
                </p>
                <div className="mt-3 space-y-2">
                  {bookings
                    .filter(b => b.rooms && b.rooms.some(r => r.purchase_type === 'buy_to_order' && r.purchase_status === 'pending_purchase'))
                    .map(booking => (
                      <div key={booking.id} className="flex items-center justify-between bg-background/50 rounded-md p-2">
                        <div className="text-sm">
                          <span className="font-medium">Booking #{booking.id}</span>
                          {' - '}
                          {booking.customer_name} 
                          {' - '}
                          {booking.rooms.map(r => `${r.quantity}× ${r.hotelName} - ${r.roomName} (${r.occupancy_type})`).join(' + ')}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleOpenPurchaseForm(booking)}
                          variant="default"
                        >
                          Enter Purchase Details
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings Table */}
      <DataTable
        title="All Bookings"
        columns={columns}
        data={bookingsTableData}
        searchable
        onView={handleView}
        onDelete={handleCancel}
      />

      {/* Purchase Details Form Dialog */}
      <Dialog open={isPurchaseFormOpen} onOpenChange={setIsPurchaseFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enter Purchase Details</DialogTitle>
            <DialogDescription>
              Record the details of your hotel room purchase for this booking.
            </DialogDescription>
          </DialogHeader>

          {selectedBookingForPurchase && (
            <>
              {/* Booking Summary */}
              <Card className="bg-muted/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Customer:</span>
                      <p className="font-medium">{selectedBookingForPurchase.customer_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tour:</span>
                      <p className="font-medium">{selectedBookingForPurchase.tourName}</p>
                    </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Selling Price (Total):</span>
                        <p className="font-medium text-green-600">{formatCurrency(selectedBookingForPurchase.total_price)}</p>
                    </div>
                    </div>
                    <div className="border-t pt-2">
                      <p className="text-xs text-muted-foreground mb-2">Rooms to Purchase:</p>
                      {selectedBookingForPurchase.rooms.map((room, idx) => (
                        <div key={idx} className="text-sm flex justify-between py-1 border-b last:border-0">
                          <span>{room.quantity}× {room.roomName} ({room.occupancy_type})</span>
                          <Badge variant={room.purchase_status === 'pending_purchase' ? 'destructive' : 'default'} className="text-xs">
                            {room.purchase_status}
                          </Badge>
                    </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Form */}
              <div className="grid gap-4 py-4">
                <Accordion type="multiple" defaultValue={["team-info", "purchase-details"]} className="w-full">
                  {/* Team Information Section */}
                  <AccordionItem value="team-info">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Team & Hotel Contact
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="grid gap-2">
                          <Label htmlFor="assigned_to">
                            Purchased By (Operations Team Member) *
                          </Label>
                          <Input
                            id="assigned_to"
                            value={purchaseFormData.assigned_to}
                            onChange={(e) => setPurchaseFormData({ ...purchaseFormData, assigned_to: e.target.value })}
                            placeholder="e.g., John Smith"
                          />
                          <p className="text-xs text-muted-foreground">
                            Who from your team purchased these rooms?
                          </p>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="hotel_contact">Hotel Contact Person *</Label>
                          <Input
                            id="hotel_contact"
                            value={purchaseFormData.hotel_contact}
                            onChange={(e) => setPurchaseFormData({ ...purchaseFormData, hotel_contact: e.target.value })}
                            placeholder="e.g., Marie Dupont"
                          />
                          <p className="text-xs text-muted-foreground">
                            Who at the hotel did you work with?
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Purchase Details Section */}
                  <AccordionItem value="purchase-details">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Purchase Details & Costs
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="grid gap-2">
                          <Label htmlFor="hotel_confirmation">Hotel Confirmation Number *</Label>
                          <Input
                            id="hotel_confirmation"
                            value={purchaseFormData.hotel_confirmation}
                            onChange={(e) => setPurchaseFormData({ ...purchaseFormData, hotel_confirmation: e.target.value })}
                            placeholder="e.g., HTL-2025-12345"
                          />
                          <p className="text-xs text-muted-foreground">
                            The confirmation number provided by the hotel
                          </p>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="cost_per_room">Cost Per Room (from hotel) *</Label>
                          <Input
                            id="cost_per_room"
                            type="number"
                            step="0.01"
                            min="0"
                            value={purchaseFormData.cost_per_room}
                            onChange={(e) => setPurchaseFormData({ ...purchaseFormData, cost_per_room: parseFloat(e.target.value) || 0 })}
                            placeholder="e.g., 130.00"
                          />
                          {purchaseFormData.cost_per_room > 0 && (
                            <div className="text-sm space-y-1">
                              <p className="text-muted-foreground">
                                <strong>Note:</strong> Purchase details feature being updated for new room structure
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            value={purchaseFormData.notes}
                            onChange={(e) => setPurchaseFormData({ ...purchaseFormData, notes: e.target.value })}
                            placeholder="Any additional notes about this purchase..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPurchaseFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitPurchase}>
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Booking Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details - #{viewingBooking?.id}</DialogTitle>
            <DialogDescription>
              Complete booking information and cost breakdown
            </DialogDescription>
          </DialogHeader>

          {viewingBooking && (
            <div className="space-y-4">
              {/* Customer & Tour Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{viewingBooking.customer_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{viewingBooking.customer_email}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Booking Information</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <p><Badge variant={viewingBooking.status === 'confirmed' ? 'default' : viewingBooking.status === 'cancelled' ? 'destructive' : 'secondary'}>{viewingBooking.status}</Badge></p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Rooms:</span>
                      <p className="font-medium">{viewingBooking.rooms.reduce((sum, r) => sum + r.quantity, 0)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Guests:</span>
                      <p className="font-medium">
                        {viewingBooking.rooms.reduce((sum, r) => {
                          const people = r.occupancy_type === 'single' ? 1 : r.occupancy_type === 'double' ? 2 : r.occupancy_type === 'triple' ? 3 : 4
                          return sum + (people * r.quantity)
                        }, 0)} people
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Booking Date:</span>
                      <p className="font-medium">{viewingBooking.booking_date}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stay Details */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Stay Details</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tour:</span>
                      <p className="font-medium">{viewingBooking.tourName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check-in:</span>
                      <p className="font-medium">{viewingBooking.check_in_date}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check-out:</span>
                      <p className="font-medium">{viewingBooking.check_out_date}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nights:</span>
                      <p className="font-medium">{viewingBooking.nights}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rooms */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Rooms ({viewingBooking.rooms.length})</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-3">
                    {viewingBooking.rooms.map((room, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-primary">{room.hotelName}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium">{room.roomName}</span>
                            <Badge variant="secondary" className="text-xs">
                              {room.occupancy_type === 'single' ? '1p' : room.occupancy_type === 'double' ? '2p' : room.occupancy_type === 'triple' ? '3p' : '4p'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {BOARD_TYPE_LABELS[room.board_type]}
                            </Badge>
                          </div>
                          <span className="font-semibold">{formatCurrency(room.total_price)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>Contract: {room.contractName}</div>
                          <div>Quantity: {room.quantity} room{room.quantity > 1 ? 's' : ''}</div>
                          <div>Type: <Badge variant={room.purchase_type === 'inventory' ? 'default' : 'secondary'} className="text-xs">{room.purchase_type}</Badge></div>
                          <div>Per Room: {formatCurrency(room.price_per_room)}</div>
                        </div>
                        
                        {/* Conversion Button for Buy-to-Order */}
                        {room.purchase_type === 'buy_to_order' && !room.converted_from_buy_to_order && (
                          <div className="mt-3 pt-3 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs flex items-center justify-center gap-2"
                              onClick={() => {
                                setSelectedRoomForConversion({ ...room, bookingId: viewingBooking.id, roomIndex: idx })
                                setIsConversionOpen(true)
                              }}
                            >
                              <RefreshCw className="h-3 w-3" />
                              Convert to Contract Inventory
                            </Button>
                          </div>
                        )}
                        
                        {/* Converted Badge */}
                        {room.converted_from_buy_to_order && (
                          <div className="mt-3 pt-3 border-t">
                            <Badge variant="default" className="text-xs flex items-center gap-1 w-full justify-center">
                              <CheckCircle className="h-3 w-3" />
                              Converted to Contract Inventory
                            </Badge>
                            {room.conversion_date && (
                              <p className="text-[10px] text-muted-foreground mt-1 text-center">
                                Converted on {new Date(room.conversion_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Pricing Summary</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2">
                    {viewingBooking.rooms.map((room, idx) => (
                      <div key={idx} className="flex justify-between text-sm border-b pb-2 last:border-0">
                        <span className="text-muted-foreground">
                          {room.quantity}× {room.roomName} ({room.occupancy_type})
                        </span>
                        <span className="font-medium">{formatCurrency(room.total_price)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total Price:</span>
                      <span className="text-primary">{formatCurrency(viewingBooking.total_price)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Details (if buy-to-order) */}
              {viewingBooking.rooms.some(r => r.purchase_type === 'buy_to_order' && r.purchase_order) && (
                <Card className="border-orange-200">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Purchase Details</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-3">
                      {viewingBooking.rooms
                        .filter(r => r.purchase_type === 'buy_to_order' && r.purchase_order)
                        .map((room, idx) => (
                          <div key={idx} className="p-3 border rounded">
                            <div className="font-medium mb-2">{room.roomName} ({room.occupancy_type})</div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Purchased By:</span>
                                <p className="font-medium">{room.purchase_order?.assigned_to || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Hotel Contact:</span>
                                <p className="font-medium">{room.purchase_order?.hotel_contact || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Confirmation #:</span>
                                <p className="font-medium">{room.purchase_order?.hotel_confirmation || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Cost Per Room:</span>
                                <p className="font-medium">{room.purchase_order?.cost_per_room ? formatCurrency(room.purchase_order.cost_per_room) : 'N/A'}</p>
                              </div>
                              {room.purchase_order?.notes && (
                                <div className="col-span-2">
                                  <span className="text-muted-foreground">Notes:</span>
                                  <p className="font-medium text-xs">{room.purchase_order.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Conversion Dialog */}
      <Dialog open={isConversionOpen} onOpenChange={setIsConversionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              Convert Buy-to-Order to Contract Inventory
            </DialogTitle>
            <DialogDescription>
              Select a contract to convert this buy-to-order room to guaranteed inventory.
              Customer price will remain unchanged.
            </DialogDescription>
          </DialogHeader>

          {selectedRoomForConversion && (
            <div className="space-y-4">
              {/* Room Details */}
              <Card className="border-blue-200">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Room Details</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hotel:</span>
                      <span className="font-medium">{selectedRoomForConversion.hotelName}</span>
    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room:</span>
                      <span className="font-medium">{selectedRoomForConversion.roomName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Occupancy:</span>
                      <span className="font-medium">{selectedRoomForConversion.occupancy_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Board:</span>
                      <span className="font-medium">{BOARD_TYPE_LABELS[selectedRoomForConversion.board_type]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-medium">{selectedRoomForConversion.quantity} room(s)</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Customer Price:</span>
                      <span className="font-bold text-primary">{formatCurrency(selectedRoomForConversion.total_price)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contract Selection */}
              <div className="space-y-2">
                <Label htmlFor="contract-select">Select Contract *</Label>
                <Select
                  value={selectedContractId.toString()}
                  onValueChange={(value) => setSelectedContractId(parseInt(value))}
                >
                  <SelectTrigger id="contract-select">
                    <SelectValue placeholder="Choose a contract..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      // Find the rate for this room to get the correct hotel_id
                      const roomRate = rates.find(r => r.id === selectedRoomForConversion.rate_id)
                      
                      // Try multiple ways to find the hotel_id
                      let hotelId = roomRate?.hotel_id || 
                                   contracts.find(c => c.id === roomRate?.contract_id)?.hotel_id
                      
                      // Fallback: if still no hotelId, try to find by hotel name
                      if (!hotelId && selectedRoomForConversion.hotelName) {
                        const hotel = hotels.find(h => h.name === selectedRoomForConversion.hotelName)
                        hotelId = hotel?.id
                      }
                      
                      // Filter contracts by the actual hotel_id
                      const availableContracts = contracts.filter(c => c.hotel_id === hotelId)
                      
                      if (!hotelId || availableContracts.length === 0) {
                        return (
                          <SelectItem value="0" disabled>
                            No contracts found for this hotel
                          </SelectItem>
                        )
                      }
                      
                      // Calculate availability for each contract
                      return availableContracts.map(contract => {
                        // Get room_group_id - try multiple methods
                        let roomGroupId = roomRate?.room_group_id
                        
                        // Fallback: If rate not found, try to find room_group_id by room name
                        if (!roomGroupId && hotelId && selectedRoomForConversion.roomName) {
                          const hotel = hotels.find(h => h.id === hotelId)
                          const roomGroup = hotel?.room_groups.find(rg => 
                            rg.room_type === selectedRoomForConversion.roomName
                          )
                          roomGroupId = roomGroup?.id
                        }
                        
                        // Find allocation for this room type
                        const allocation = contract.room_allocations?.find(a => 
                          roomGroupId && a.room_group_ids.includes(roomGroupId)
                        )
                        
                        // Calculate booked rooms from this allocation
                        let bookedRooms = 0
                        if (allocation) {
                          bookedRooms = bookings
                            .filter(b => b.status !== 'cancelled' && b.rooms && b.rooms.length > 0)
                            .flatMap(b => b.rooms)
                            .filter(r => {
                              if (!r || !r.rate_id) return false
                              const bookedRate = rates.find(rt => rt.id === r.rate_id)
                              return bookedRate &&
                                     bookedRate.contract_id === contract.id &&
                                     allocation.room_group_ids.includes(bookedRate.room_group_id)
                            })
                            .reduce((sum, r) => sum + r.quantity, 0)
                        }
                        
                        const available = allocation ? allocation.quantity - bookedRooms : 0
                        const hasAvailability = available > 0
                        
                        return (
                          <SelectItem 
                            key={contract.id} 
                            value={contract.id.toString()}
                            disabled={!hasAvailability}
                          >
                            {contract.contract_name} ({contract.start_date} - {contract.end_date})
                            {allocation && (
                              <span className={hasAvailability ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                                • {available} available
                              </span>
                            )}
                            {!allocation && <span className="text-gray-500 ml-2">• No allocation</span>}
                          </SelectItem>
                        )
                      })
                    })()}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  💡 Only showing contracts for {selectedRoomForConversion.hotelName}
                </p>
              </div>

              {/* Important Note */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <strong>Customer Price Protection:</strong> The customer will continue to pay{' '}
                    <strong>{formatCurrency(selectedRoomForConversion.total_price)}</strong>.
                    This conversion only changes the booking from buy-to-order to contract inventory.
                    Any rate difference will be absorbed by the business.
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConversionOpen(false)
                setSelectedContractId(0)
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedContractId}
              onClick={() => {
                if (selectedRoomForConversion && selectedContractId && selectedRoomForConversion.roomIndex !== undefined) {
                  const contract = contracts.find(c => c.id === selectedContractId)
                  const success = convertBuyToOrderRoom(
                    selectedRoomForConversion.bookingId,
                    selectedRoomForConversion.roomIndex,
                    selectedContractId,
                    `Manually converted to ${contract?.contract_name} - Customer price unchanged at ${formatCurrency(selectedRoomForConversion.total_price)}`
                  )
                  
                  if (success) {
                    toast.success('Room converted to contract inventory successfully!')
                    setIsConversionOpen(false)
                    setSelectedContractId(0)
                    setSelectedRoomForConversion(null)
                    
                    // Force refresh the booking view
                    setTimeout(() => {
                      const updatedBooking = bookings.find(b => b.id === selectedRoomForConversion.bookingId)
                      if (updatedBooking) {
                        setViewingBooking(updatedBooking)
                      }
                    }, 100)
                  } else {
                    toast.error('Failed to convert room. Please try again.')
                  }
                }
              }}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Convert to Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


