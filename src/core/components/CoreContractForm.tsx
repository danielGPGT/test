import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { FileText, DollarSign, AlertTriangle } from 'lucide-react';
import type { Contract, Supplier, Resource } from '../types';
import type { ContractPlugin } from '../types';

interface CoreContractFormProps {
  contract?: Contract;
  suppliers: Supplier[];
  resources: Resource[];
  onSave: (data: Contract) => void;
  onCancel: () => void;
  plugin?: ContractPlugin;
}

export function CoreContractForm({ 
  contract, 
  suppliers, 
  onSave, 
  onCancel,
  plugin 
}: CoreContractFormProps) {
  const [formData, setFormData] = useState({
    supplier_id: contract?.supplier_id || '',
    contract_name: contract?.contract_name || '',
    currency: contract?.currency || 'GBP',
    valid_from: contract?.valid_from || '',
    valid_to: contract?.valid_to || '',
    priority: contract?.priority || 1,
    timezone: contract?.timezone || 'UTC',
    terms: contract?.terms || '',
    plugin_meta: contract?.plugin_meta || {},
    active: contract?.active ?? true
  });


  const handleSave = () => {
    // Basic validation
    if (!formData.contract_name || !formData.supplier_id || !formData.currency || !formData.valid_from || !formData.valid_to) {
      alert('Please fill in all required fields.');
      return;
    }

    // Date validation
    if (new Date(formData.valid_from) >= new Date(formData.valid_to)) {
      alert('Valid To date must be after Valid From date.');
      return;
    }

    // Priority validation
    if (formData.priority < 1 || formData.priority > 10) {
      alert('Priority must be between 1 and 10.');
      return;
    }

    const contractData: Contract = {
      ...formData,
      plugin_meta: formData.plugin_meta,
      id: contract?.id || '',
      created_at: contract?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onSave(contractData);
  };

  const updatePluginMeta = (value: Record<string, any>) => {
    setFormData(prev => ({
      ...prev,
      plugin_meta: {
        ...prev.plugin_meta,
        ...value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          {contract ? 'Edit Contract' : 'Create Contract'}
          {plugin && <Badge variant="secondary" className="ml-2">{plugin.label}</Badge>}
        </h2>
      </div>

      <Accordion type="multiple" defaultValue={["basics", "plugin", "terms"]}>
        {/* Core Basics */}
        <AccordionItem value="basics">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contract Basics
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_name">Contract Name *</Label>
                  <Input
                    id="contract_name"
                    value={formData.contract_name}
                    onChange={(e) => setFormData({ ...formData, contract_name: e.target.value })}
                    placeholder="e.g., Summer 2024 Hotel Contract"
                  />
                  <p className="text-xs text-muted-foreground">
                    Internal reference name for this contract
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Hotel or supplier providing the accommodation
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Valid From</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valid To</Label>
                  <Input
                    type="date"
                    value={formData.valid_to}
                    onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Time Zone</Label>
                  <Select
                    value={formData.timezone || 'UTC'}
                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    value={formData.priority || 1}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: !!checked })}
                />
                <Label htmlFor="active">Active Contract</Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Terms & Conditions */}
        <AccordionItem value="terms">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Terms & Conditions
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="terms">Contract Terms</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Contract terms, conditions, special requirements..."
                  rows={6}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Plugin-Specific Fields */}
        {plugin && (
          <AccordionItem value="plugin">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {plugin.label} Settings
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2">
                <plugin.ContractForm
                  value={formData.plugin_meta}
                  onChange={updatePluginMeta}
                  contract={contract}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Save/Cancel Buttons at the bottom */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Contract
        </Button>
      </div>
    </div>
  );
}
