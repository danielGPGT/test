import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calculator, Home, Receipt, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function PricingCalculator() {
  const [calc, setCalc] = useState({
    baseRate: 130,
    occupancy: 2,
    nights: 4,
    vat: 10,
    cityTaxPerPerson: 2.50,
    resortFeePerNight: 5,
    supplierCommission: 15,
    yourCommission: 20,
  })

  // Calculations
  const people = calc.occupancy
  const resortFeesTotal = calc.resortFeePerNight * calc.nights
  const subtotal = (calc.baseRate * calc.nights) + resortFeesTotal
  const vat = subtotal * (calc.vat / 100)
  const cityTax = calc.cityTaxPerPerson * people * calc.nights
  const supplierCommission = (calc.baseRate * calc.nights) * (calc.supplierCommission / 100)
  const totalCost = subtotal + vat + cityTax + supplierCommission
  const sellingPrice = totalCost * (1 + calc.yourCommission / 100)
  const profit = sellingPrice - totalCost
  const profitMargin = (profit / sellingPrice) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Pricing Calculator
        </CardTitle>
        <CardDescription>
          Calculate total costs, selling price, and profit margins
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Inputs */}
          <div>
            <Accordion type="multiple" defaultValue={["basic-details", "taxes-fees", "commissions"]} className="w-full">
              {/* Basic Details */}
              <AccordionItem value="basic-details">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Basic Details
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <div className="grid gap-2">
                      <Label htmlFor="calc-base-rate">Base Rate (per night)</Label>
                      <Input
                        id="calc-base-rate"
                        type="number"
                        step="0.01"
                        value={calc.baseRate}
                        onChange={(e) => setCalc({ ...calc, baseRate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-2">
                        <Label htmlFor="calc-occupancy">Occupancy</Label>
                        <Select
                          value={calc.occupancy.toString()}
                          onValueChange={(value) => setCalc({ ...calc, occupancy: parseInt(value) })}
                        >
                          <SelectTrigger id="calc-occupancy">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Single (1)</SelectItem>
                            <SelectItem value="2">Double (2)</SelectItem>
                            <SelectItem value="3">Triple (3)</SelectItem>
                            <SelectItem value="4">Quad (4)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="calc-nights">Nights</Label>
                        <Input
                          id="calc-nights"
                          type="number"
                          value={calc.nights}
                          onChange={(e) => setCalc({ ...calc, nights: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Taxes & Fees */}
              <AccordionItem value="taxes-fees">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Taxes & Fees
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <div className="grid gap-2">
                      <Label htmlFor="calc-vat">VAT (%)</Label>
                      <Input
                        id="calc-vat"
                        type="number"
                        step="0.1"
                        value={calc.vat}
                        onChange={(e) => setCalc({ ...calc, vat: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="calc-city-tax">City Tax (per person/night)</Label>
                      <Input
                        id="calc-city-tax"
                        type="number"
                        step="0.01"
                        value={calc.cityTaxPerPerson}
                        onChange={(e) => setCalc({ ...calc, cityTaxPerPerson: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="calc-resort-fee">Resort Fee (per night)</Label>
                      <Input
                        id="calc-resort-fee"
                        type="number"
                        step="0.01"
                        value={calc.resortFeePerNight}
                        onChange={(e) => setCalc({ ...calc, resortFeePerNight: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Commissions */}
              <AccordionItem value="commissions">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Commissions
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <div className="grid gap-2">
                      <Label htmlFor="calc-supplier">Supplier Commission (%)</Label>
                      <Input
                        id="calc-supplier"
                        type="number"
                        step="0.1"
                        value={calc.supplierCommission}
                        onChange={(e) => setCalc({ ...calc, supplierCommission: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="calc-your">Your Commission (%)</Label>
                      <Input
                        id="calc-your"
                        type="number"
                        step="0.1"
                        value={calc.yourCommission}
                        onChange={(e) => setCalc({ ...calc, yourCommission: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Results */}
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <h4 className="font-semibold text-sm">Cost Breakdown</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Rate × Nights:</span>
                  <span>{formatCurrency(calc.baseRate * calc.nights)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resort Fees:</span>
                  <span>{formatCurrency(resortFeesTotal)}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT ({calc.vat}%):</span>
                  <span>{formatCurrency(vat)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">City Tax ({people}p × {calc.nights}n):</span>
                  <span>{formatCurrency(cityTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier Comm ({calc.supplierCommission}%):</span>
                  <span>{formatCurrency(supplierCommission)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total Cost:</span>
                  <span className="text-red-600">{formatCurrency(totalCost)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-primary/5 p-4 space-y-2">
              <h4 className="font-semibold text-sm">Selling Price</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Cost:</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Comm ({calc.yourCommission}%):</span>
                  <span>{formatCurrency(profit)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Selling Price:</span>
                  <span className="text-primary">{formatCurrency(sellingPrice)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-green-50 dark:bg-green-950 p-4 space-y-2">
              <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">Your Profit</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-green-900 dark:text-green-100">
                  <span>Profit per Booking:</span>
                  <span className="font-bold text-lg">{formatCurrency(profit)}</span>
                </div>
                <div className="flex justify-between text-green-700 dark:text-green-200">
                  <span>Profit Margin:</span>
                  <Badge variant="outline" className="text-green-600">
                    {profitMargin.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

