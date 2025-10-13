import React, { useState } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Receipt, Building2, DollarSign as DollarIcon, Trash2, FileText } from 'lucide-react';
import type { ContractPlugin, ContractFormProps, RateMetaFormProps, PricingContext } from '@/core/types';

// Hotel-specific schemas
const HotelContractSchema = z.object({
  // Commercial & Fulfilment
  channels_allowed: z.array(z.enum(['web', 'b2b', 'internal'])).optional().default(['web', 'b2b']),
  active: z.boolean().optional().default(true),
  stop_sell: z.boolean().optional().default(false),
  sell_cutoff_hours: z.number().min(0).optional().default(24),
  fulfilment_strategy: z.enum(['instant', 'on_request', 'buy_to_order']).optional().default('instant'),
  sla_hours: z.number().min(0).optional().default(24),
  granularity: z.enum(['date', 'datetime', 'segment']).optional().default('date'),
  default_min_nights: z.number().min(1).optional().default(1),
  default_max_nights: z.number().min(1).optional().default(30),
  geo_restriction: z.enum(['none', 'whitelist', 'blacklist']).optional().default('none'),
  
  // Taxes, Fees & Supplier Economics
  supplier_commission_rate: z.number().min(0).max(1).optional().default(0),
  supplier_vat_rate: z.number().min(0).max(1).optional().default(0),
  city_tax: z.object({
    mode: z.enum(['per_person_per_night', 'per_room_per_night']),
    amount: z.number().min(0),
    age_bands: z.array(z.object({
      min_age: z.number().min(0),
      max_age: z.number().min(0),
      rate: z.number().min(0)
    })).optional(),
    caps: z.object({
      max_per_night: z.number().min(0).optional(),
      max_per_stay: z.number().min(0).optional()
    }).optional(),
    payable_by: z.enum(['property', 'us'])
  }).optional(),
  resort_fee: z.object({
    amount: z.number().min(0),
    taxable: z.boolean().optional().default(false),
    payable_by: z.enum(['property', 'us'])
  }).optional(),
  default_markup_percentage: z.number().min(0).max(1).optional(),
  
  // Accommodation Defaults (Plugin)
  default_included_board: z.enum(['room_only', 'bed_breakfast', 'half_board', 'full_board', 'all_inclusive']).optional().default('bed_breakfast'),
  base_occupancy: z.number().min(1).optional().default(2),
  max_occupancy: z.number().min(1).optional().default(4),
  
  // Attrition & Cancellation
  attrition_stages: z.array(z.object({
    date: z.string(),
    release_percentage: z.number().min(0).max(100)
  })).optional().default([]),
  cancellation_stages: z.array(z.object({
    cutoff_date: z.string(),
    penalty_mode: z.enum(['percentage', 'first_n_nights', 'fixed_amount']),
    penalty_value: z.number().min(0),
    description: z.string().optional()
  })).optional().default([]),
  no_show_policy: z.object({
    penalty_percentage: z.number().min(0).max(100),
    description: z.string().optional()
  }).optional(),
  
  // Payments (Finance)
  contracted_payment_total: z.number().min(0).optional(),
  payment_schedule: z.array(z.object({
    payment_date: z.string(),
    amount_due: z.number().min(0),
    paid: z.boolean().default(false),
    paid_date: z.string().optional()
  })).optional().default([]),
  
  // Notes
  internal_notes: z.string().optional().default('')
});

const HotelRatePricingSchema = z.object({
  // Occupancy-based pricing
  occupancy_type: z.enum(['single', 'double', 'triple', 'quad']),
  
  // Board basis
  board_type: z.enum(['room_only', 'bed_breakfast', 'half_board', 'full_board', 'all_inclusive']),
  
  // Base pricing
  base_rate: z.number().min(0),
  board_cost: z.number().min(0).optional().default(0),
  
  // Pricing modifiers
  single_supplement: z.number().min(0).optional().default(0),
  child_discount: z.number().min(0).max(100).optional().default(0),
  senior_discount: z.number().min(0).max(100).optional().default(0),
  
  // Room and allocation
  room_group_id: z.string().optional(),
  allocation_pool_id: z.string().optional(),
  rate_notes: z.string().optional(),
  contract_linked: z.boolean().optional().default(false),
  
  // Stay requirements
  min_nights: z.number().min(1).optional(),
  max_nights: z.number().min(1).optional(),
  
  // Seasonal modifiers
  seasonal_modifiers: z.array(z.object({
    name: z.string(),
    date_from: z.string(),
    date_to: z.string(),
    multiplier: z.number().min(0)
  })).optional().default([])
});

// Hotel Contract Form Component
const HotelContractForm: React.FC<ContractFormProps> = ({ value, onChange }) => {
  const [formData, setFormData] = useState(value);

  React.useEffect(() => {
    setFormData(value);
  }, [value]);

  const updateField = (field: string, newValue: any) => {
    const updated = { ...formData, [field]: newValue };
    setFormData(updated);
    onChange(updated);
  };

  // State for form inputs
  const [attritionDateInput, setAttritionDateInput] = useState('');
  const [attritionPercentInput, setAttritionPercentInput] = useState('');
  const [cancellationDateInput, setCancellationDateInput] = useState('');
  const [cancellationModeInput, setCancellationModeInput] = useState('percentage');
  const [cancellationValueInput, setCancellationValueInput] = useState('');
  const [cancellationDescInput, setCancellationDescInput] = useState('');
  const [paymentDateInput, setPaymentDateInput] = useState('');
  const [paymentAmountInput, setPaymentAmountInput] = useState('');

  return (
    <div className="space-y-6">
      {/* Commercial & Fulfilment */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Commercial & Fulfilment
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Channels Allowed</Label>
            <div className="flex gap-2">
              {['web', 'b2b', 'internal'].map((channel) => (
                <label key={channel} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.channels_allowed?.includes(channel) || false}
                    onChange={(e) => {
                      const current = formData.channels_allowed || [];
                      if (e.target.checked) {
                        updateField('channels_allowed', [...current, channel]);
                      } else {
                        updateField('channels_allowed', current.filter((c: string) => c !== channel));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm capitalize">{channel}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fulfilment Strategy</Label>
            <Select
              value={formData.fulfilment_strategy || 'instant'}
              onValueChange={(value) => updateField('fulfilment_strategy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant Confirmation</SelectItem>
                <SelectItem value="on_request">On Request</SelectItem>
                <SelectItem value="buy_to_order">Buy-to-Order</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Controls - Grouped Together */}
        <div className="space-y-4 border-t pt-4">
          <h5 className="font-medium text-sm">Status Controls</h5>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active !== false}
                onChange={(e) => updateField('active', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="active">Active Contract</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="stop_sell"
                checked={formData.stop_sell || false}
                onChange={(e) => updateField('stop_sell', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="stop_sell">Stop-sell Enabled</Label>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Active: Contract can be used for new bookings. Stop-sell: Automatically stop selling when capacity is low.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sell_cutoff_hours">Sell Cutoff (hours)</Label>
            <Input
              id="sell_cutoff_hours"
              type="number"
              min="0"
              value={formData.sell_cutoff_hours || ''}
              onChange={(e) => updateField('sell_cutoff_hours', parseInt(e.target.value) || 24)}
              placeholder="24"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sla_hours">SLA (hours)</Label>
            <Input
              id="sla_hours"
              type="number"
              min="0"
              value={formData.sla_hours || ''}
              onChange={(e) => updateField('sla_hours', parseInt(e.target.value) || 24)}
              placeholder="24"
            />
          </div>
          <div className="space-y-2">
            <Label>Granularity</Label>
            <Select
              value={formData.granularity || 'date'}
              onValueChange={(value) => updateField('granularity', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="datetime">Date & Time</SelectItem>
                <SelectItem value="segment">Segment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="default_min_nights">Default Min Nights</Label>
            <Input
              id="default_min_nights"
              type="number"
              min="1"
              value={formData.default_min_nights || ''}
              onChange={(e) => updateField('default_min_nights', parseInt(e.target.value) || 1)}
              placeholder="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_max_nights">Default Max Nights</Label>
            <Input
              id="default_max_nights"
              type="number"
              min="1"
              value={formData.default_max_nights || ''}
              onChange={(e) => updateField('default_max_nights', parseInt(e.target.value) || 30)}
              placeholder="30"
            />
          </div>
        </div>

        {/* Geo Restriction (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="geo_restriction">Channels Geo Restriction (Optional)</Label>
          <Select
            value={formData.geo_restriction || 'none'}
            onValueChange={(value) => updateField('geo_restriction', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No restriction</SelectItem>
              <SelectItem value="whitelist">Sell only to specific countries</SelectItem>
              <SelectItem value="blacklist">Avoid specific countries</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Optional: Restrict selling to/from certain markets based on customer location.
          </p>
        </div>

      </div>

      {/* Taxes, Fees & Supplier Economics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Taxes, Fees & Supplier Economics
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="supplier_commission_rate">Supplier Commission/Discount (%)</Label>
            <Input
              id="supplier_commission_rate"
              type="number"
              step="0.1"
              value={formData.supplier_commission_rate ? (formData.supplier_commission_rate * 100) : ''}
              onChange={(e) => updateField('supplier_commission_rate', (parseFloat(e.target.value) || 0) / 100)}
              placeholder="e.g., 15"
            />
            <p className="text-xs text-muted-foreground">Commission/discount you receive from hotel</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_vat_rate">Supplier VAT on Cost (%)</Label>
            <Input
              id="supplier_vat_rate"
              type="number"
              step="0.1"
              value={formData.supplier_vat_rate ? (formData.supplier_vat_rate * 100) : ''}
              onChange={(e) => updateField('supplier_vat_rate', (parseFloat(e.target.value) || 0) / 100)}
              placeholder="e.g., 10"
            />
            <p className="text-xs text-muted-foreground">VAT on your cost, not customer VAT</p>
          </div>
        </div>

        {/* City Tax */}
        <div className="space-y-3 p-3 bg-muted/30 rounded-md border">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">City/Accommodation Tax</Label>
              {formData.city_tax && (
                <div className="text-xs text-muted-foreground mt-1">
                  <Badge variant="outline" className="text-xs">
                    {formData.city_tax.amount} {formData.currency || 'GBP'} {formData.city_tax.mode === 'per_person_per_night' ? 'pppn' : 'prpn'}, payable at {formData.city_tax.payable_by === 'property' ? 'property' : 'included in our price'}
                  </Badge>
                </div>
              )}
            </div>
            {!formData.city_tax ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateField('city_tax', {
                  mode: 'per_person_per_night',
                  amount: 0,
                  payable_by: 'property'
                })}
              >
                Configure
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateField('city_tax', null)}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
          {formData.city_tax && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Mode</Label>
                  <Select
                    value={formData.city_tax.mode || 'per_person_per_night'}
                    onValueChange={(value) => updateField('city_tax', { ...formData.city_tax, mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_person_per_night">Per Person Per Night</SelectItem>
                      <SelectItem value="per_room_per_night">Per Room Per Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.city_tax.amount || ''}
                    onChange={(e) => updateField('city_tax', { ...formData.city_tax, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 2.50"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Payable By</Label>
                <Select
                  value={formData.city_tax.payable_by || 'property'}
                  onValueChange={(value) => updateField('city_tax', { ...formData.city_tax, payable_by: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="property">Property (Guest pays directly)</SelectItem>
                    <SelectItem value="us">Us (Included in our price)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Resort Fee */}
        <div className="space-y-3 p-3 bg-muted/30 rounded-md border">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Resort/Facility Fee</Label>
              {formData.resort_fee && (
                <div className="text-xs text-muted-foreground mt-1">
                  <Badge variant="outline" className="text-xs">
                    {formData.resort_fee.amount} {formData.currency || 'GBP'} prpn{formData.resort_fee.taxable && ' (taxable)'}, payable at {formData.resort_fee.payable_by === 'property' ? 'property' : 'included in our price'}
                  </Badge>
                </div>
              )}
            </div>
            {!formData.resort_fee ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateField('resort_fee', {
                  amount: 0,
                  taxable: false,
                  payable_by: 'property'
                })}
              >
                Configure
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateField('resort_fee', null)}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
          {formData.resort_fee && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Amount (per room per night)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.resort_fee.amount || ''}
                    onChange={(e) => updateField('resort_fee', { ...formData.resort_fee, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 5.00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Payable By</Label>
                  <Select
                    value={formData.resort_fee.payable_by || 'property'}
                    onValueChange={(value) => updateField('resort_fee', { ...formData.resort_fee, payable_by: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="property">Property (Guest pays directly)</SelectItem>
                      <SelectItem value="us">Us (Included in our price)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="resort_fee_taxable"
                  checked={formData.resort_fee.taxable || false}
                  onChange={(e) => updateField('resort_fee', { ...formData.resort_fee, taxable: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="resort_fee_taxable">Taxable</Label>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="default_markup_percentage">Default Markup (%) <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input
            id="default_markup_percentage"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.default_markup_percentage ? (formData.default_markup_percentage * 100) : ''}
            onChange={(e) => updateField('default_markup_percentage', (parseFloat(e.target.value) || 0) / 100)}
            placeholder="e.g., 20"
          />
          <p className="text-xs text-muted-foreground">
            Optional: Global default used by pricing engine when a rate doesn't specify markup. Leave empty if rates define their own markup.
          </p>
        </div>
      </div>

      {/* Accommodation Defaults */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Accommodation Defaults
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="default_included_board">Default Included Board</Label>
            <Select
              value={formData.default_included_board || 'bed_breakfast'}
              onValueChange={(value) => updateField('default_included_board', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="room_only">Room Only</SelectItem>
                <SelectItem value="bed_breakfast">Bed & Breakfast</SelectItem>
                <SelectItem value="half_board">Half Board</SelectItem>
                <SelectItem value="full_board">Full Board</SelectItem>
                <SelectItem value="all_inclusive">All Inclusive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="base_occupancy">Base Occupancy</Label>
            <Input
              id="base_occupancy"
              type="number"
              min="1"
              value={formData.base_occupancy || ''}
              onChange={(e) => updateField('base_occupancy', parseInt(e.target.value) || 2)}
              placeholder="2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_occupancy">Max Occupancy</Label>
            <Input
              id="max_occupancy"
              type="number"
              min="1"
              value={formData.max_occupancy || ''}
              onChange={(e) => updateField('max_occupancy', parseInt(e.target.value) || 4)}
              placeholder="4"
            />
          </div>
        </div>
      </div>

      {/* Attrition & Cancellation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Attrition & Cancellation
        </h3>
        
        {/* Attrition Stages */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Attrition Stages</Label>
          {formData.attrition_stages?.length > 0 && (
            <div className="space-y-2">
              {formData.attrition_stages.map((stage: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-md border border-orange-200">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{stage.date}</Badge>
                    <span className="font-medium">Release {stage.release_percentage}%</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newStages = [...(formData.attrition_stages || [])];
                      newStages.splice(index, 1);
                      updateField('attrition_stages', newStages);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="Attrition date"
              value={attritionDateInput}
              onChange={(e) => setAttritionDateInput(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="Release %"
              value={attritionPercentInput}
              onChange={(e) => setAttritionPercentInput(e.target.value)}
              className="w-[120px]"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (attritionDateInput && attritionPercentInput) {
                  updateField('attrition_stages', [
                    ...(formData.attrition_stages || []),
                    {
                      date: attritionDateInput,
                      release_percentage: parseInt(attritionPercentInput)
                    }
                  ]);
                  setAttritionDateInput('');
                  setAttritionPercentInput('');
                }
              }}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Cancellation Stages */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Cancellation Stages</Label>
          {formData.cancellation_stages?.length > 0 && (
            <div className="space-y-2">
              {formData.cancellation_stages.map((stage: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{stage.cutoff_date}</Badge>
                    <span className="font-medium text-red-700 dark:text-red-400">
                      {stage.penalty_mode === 'percentage' ? `${stage.penalty_value}%` : 
                       stage.penalty_mode === 'first_n_nights' ? `First ${stage.penalty_value} nights` :
                       `Fixed ${stage.penalty_value}`}
                    </span>
                    {stage.description && (
                      <span className="text-muted-foreground">- {stage.description}</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newStages = [...(formData.cancellation_stages || [])];
                      newStages.splice(index, 1);
                      updateField('cancellation_stages', newStages);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="Cutoff date"
              value={cancellationDateInput}
              onChange={(e) => setCancellationDateInput(e.target.value)}
              className="flex-1"
            />
            <Select
              value={cancellationModeInput}
              onValueChange={(value) => setCancellationModeInput(value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="first_n_nights">First N Nights</SelectItem>
                <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              step="0.01"
              placeholder="Value"
              value={cancellationValueInput}
              onChange={(e) => setCancellationValueInput(e.target.value)}
              className="w-[120px]"
            />
            <Input
              placeholder="Description"
              value={cancellationDescInput}
              onChange={(e) => setCancellationDescInput(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (cancellationDateInput && cancellationValueInput) {
                  updateField('cancellation_stages', [
                    ...(formData.cancellation_stages || []),
                    {
                      cutoff_date: cancellationDateInput,
                      penalty_mode: cancellationModeInput,
                      penalty_value: parseFloat(cancellationValueInput),
                      description: cancellationDescInput
                    }
                  ]);
                  setCancellationDateInput('');
                  setCancellationValueInput('');
                  setCancellationDescInput('');
                }
              }}
            >
              Add
            </Button>
          </div>
        </div>

        {/* No-Show Policy */}
        <div className="space-y-3 p-3 bg-muted/30 rounded-md border">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">No-Show Policy</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateField('no_show_policy', {
                penalty_percentage: 100,
                description: 'Full penalty for no-show'
              })}
            >
              Configure
            </Button>
          </div>
          {formData.no_show_policy && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.no_show_policy.penalty_percentage || ''}
                  onChange={(e) => updateField('no_show_policy', { 
                    ...formData.no_show_policy, 
                    penalty_percentage: parseInt(e.target.value) || 100 
                  })}
                  placeholder="Penalty %"
                />
                <Input
                  value={formData.no_show_policy.description || ''}
                  onChange={(e) => updateField('no_show_policy', { 
                    ...formData.no_show_policy, 
                    description: e.target.value 
                  })}
                  placeholder="Description"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DollarIcon className="h-5 w-5" />
          Payments
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="contracted_payment_total">Contracted Payment Total</Label>
          <Input
            id="contracted_payment_total"
            type="number"
            step="0.01"
            value={formData.contracted_payment_total || ''}
            onChange={(e) => updateField('contracted_payment_total', parseFloat(e.target.value) || 0)}
            placeholder="e.g., 12000"
          />
        </div>

        {formData.payment_schedule?.length > 0 && (
          <div className="space-y-2">
            {formData.payment_schedule.map((payment: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200">
                <div className="flex items-center gap-3 flex-1">
                  <Badge variant={payment.paid ? "default" : "outline"}>
                    {payment.payment_date}
                  </Badge>
                  <span className="font-medium">{payment.amount_due}</span>
                  {payment.paid && payment.paid_date && (
                    <span className="text-xs text-green-600">Paid {payment.paid_date}</span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newSchedule = [...(formData.payment_schedule || [])];
                    newSchedule.splice(index, 1);
                    updateField('payment_schedule', newSchedule);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            type="date"
            placeholder="Payment date"
            value={paymentDateInput}
            onChange={(e) => setPaymentDateInput(e.target.value)}
            className="flex-1"
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={paymentAmountInput}
            onChange={(e) => setPaymentAmountInput(e.target.value)}
            className="w-[150px]"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (paymentDateInput && paymentAmountInput) {
                updateField('payment_schedule', [
                  ...(formData.payment_schedule || []),
                  {
                    payment_date: paymentDateInput,
                    amount_due: parseFloat(paymentAmountInput),
                    paid: false
                  }
                ]);
                setPaymentDateInput('');
                setPaymentAmountInput('');
              }
            }}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="internal_notes">Internal Notes</Label>
        <Textarea
          id="internal_notes"
          value={formData.internal_notes || ''}
          onChange={(e) => updateField('internal_notes', e.target.value)}
          placeholder="Internal notes about this contract"
          rows={3}
        />
      </div>
    </div>
  );
};

// Hotel Rate Meta Form Component (simplified for the refactor)
const HotelRateMetaForm: React.FC<RateMetaFormProps> = ({ value, onChange }) => {
  const [formData, setFormData] = React.useState(value);

  React.useEffect(() => {
    setFormData(value);
  }, [value]);

  const updateField = (field: string, newValue: any) => {
    const updated = { ...formData, [field]: newValue };
    setFormData(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Hotel Rate Configuration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="occupancy_type">Occupancy Type *</Label>
          <Select
            value={formData.occupancy_type || 'double'}
            onValueChange={(value) => updateField('occupancy_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single (1 person)</SelectItem>
              <SelectItem value="double">Double (2 people)</SelectItem>
              <SelectItem value="triple">Triple (3 people)</SelectItem>
              <SelectItem value="quad">Quad (4 people)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="board_type">Board Type *</Label>
          <Select
            value={formData.board_type || 'bed_breakfast'}
            onValueChange={(value) => updateField('board_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="room_only">Room Only</SelectItem>
              <SelectItem value="bed_breakfast">Bed & Breakfast</SelectItem>
              <SelectItem value="half_board">Half Board</SelectItem>
              <SelectItem value="full_board">Full Board</SelectItem>
              <SelectItem value="all_inclusive">All Inclusive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Base Rate Configuration */}
      <div className="space-y-2">
        <Label htmlFor="base_rate">Base Rate (per room per night) *</Label>
        <Input
          id="base_rate"
          type="number"
          step="0.01"
          value={formData.base_rate || ''}
          onChange={(e) => updateField('base_rate', parseFloat(e.target.value) || 0)}
          placeholder="e.g., 120.00"
        />
        <p className="text-xs text-muted-foreground">
          {formData.occupancy_type === 'single' ? 'Rate for 1 person' : 
           formData.occupancy_type === 'double' ? 'Rate for 2 people' : 
           formData.occupancy_type === 'triple' ? 'Rate for 3 people' : 'Rate for 4 people'} - Base room rate before board costs
        </p>
      </div>

      {/* Buy-to-Order Board Cost (only shown when not linked to contract) */}
      {!formData.contract_linked && (
        <div className="space-y-2">
          <Label htmlFor="board_cost">Board Cost (per person per night)</Label>
          <Input
            id="board_cost"
            type="number"
            step="0.01"
            value={formData.board_cost || ''}
            onChange={(e) => updateField('board_cost', parseFloat(e.target.value) || 0)}
            placeholder="e.g., 15.00"
          />
          <p className="text-xs text-muted-foreground">
            Additional cost per person for {formData.board_type?.replace('_', ' ') || 'board type'} 
            {formData.occupancy_type && ` × ${formData.occupancy_type === 'single' ? '1' : formData.occupancy_type === 'double' ? '2' : formData.occupancy_type === 'triple' ? '3' : '4'} people`}
          </p>
        </div>
      )}

      {/* Rate Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="single_supplement">Single Supplement</Label>
          <Input
            id="single_supplement"
            type="number"
            step="0.01"
            value={formData.single_supplement || ''}
            onChange={(e) => updateField('single_supplement', parseFloat(e.target.value) || 0)}
            placeholder="e.g., 50.00"
          />
          <p className="text-xs text-muted-foreground">
            Additional cost when single person uses double room
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="child_discount">Child Discount (%)</Label>
          <Input
            id="child_discount"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.child_discount || ''}
            onChange={(e) => updateField('child_discount', parseFloat(e.target.value) || 0)}
            placeholder="e.g., 25.0"
          />
          <p className="text-xs text-muted-foreground">
            Percentage discount for child rates
          </p>
        </div>
      </div>

      {/* Room Group Selection */}
      <div className="space-y-2">
        <Label htmlFor="room_group_id">Room Category</Label>
        <Select
          value={formData.room_group_id || ''}
          onValueChange={(value) => updateField('room_group_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select room category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="deluxe">Deluxe</SelectItem>
            <SelectItem value="superior">Superior</SelectItem>
            <SelectItem value="suite">Suite</SelectItem>
            <SelectItem value="presidential">Presidential</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Room category/type this rate applies to
        </p>
      </div>

      {/* Allocation Pool Link */}
      <div className="space-y-2">
        <Label htmlFor="allocation_pool_id">Allocation Pool ID</Label>
        <Input
          id="allocation_pool_id"
          type="text"
          value={formData.allocation_pool_id || ''}
          onChange={(e) => updateField('allocation_pool_id', e.target.value)}
          placeholder="e.g., dec-2025-double-pool"
        />
        <p className="text-xs text-muted-foreground">
          Optional: Link to allocation pool for inventory management
        </p>
      </div>

      {/* Rate Notes */}
      <div className="space-y-2">
        <Label htmlFor="rate_notes">Rate Notes</Label>
        <Textarea
          id="rate_notes"
          value={formData.rate_notes || ''}
          onChange={(e) => updateField('rate_notes', e.target.value)}
          placeholder="Special conditions, restrictions, or notes for this rate..."
          rows={3}
        />
      </div>
    </div>
  );
};

// Hotel price calculator
const calculateHotelPrice = (ctx: PricingContext): number | { nightly: number[]; total: number } => {
  const { rateBand, pricingMeta, stayNights, pax } = ctx;
  // Simplified calculation for demonstration
  let price = rateBand.base_price;

  if (pricingMeta.markup_percentage) {
    price *= (1 + pricingMeta.markup_percentage);
  }
  if (pricingMeta.single_supplement && pax && pax.adults === 1) {
    price += pricingMeta.single_supplement;
  }

  if (stayNights && stayNights.length > 0) {
    const nightlyPrices = stayNights.map(() => price); // Simple for now
    return { nightly: nightlyPrices, total: nightlyPrices.reduce((sum, p) => sum + p, 0) };
  }

  return price;
};

export const HotelPlugin: ContractPlugin = {
  id: 'accommodation_room',
  label: 'Accommodation Room',
  description: 'Hotel accommodation contract and rate management',
  schema: HotelContractSchema,
  ratePricingSchema: HotelRatePricingSchema,
  ContractForm: HotelContractForm,
  RateMetaForm: HotelRateMetaForm,
  availabilityGranularity: 'date',
  priceCalculator: calculateHotelPrice,
  simulators: {
    allocationHints: () => {
      // Suggest room allocations based on product and contract
      return [];
    }
  }
};
