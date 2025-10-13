import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/data-context'
import { Check, AlertCircle } from 'lucide-react'

/**
 * TEST COMPONENT: Unified Inventory System
 * 
 * Add this to any page to test the new unified inventory features!
 * 
 * Example:
 * import { TestUnifiedInventory } from '@/components/test-unified-inventory'
 * 
 * Then add to your page:
 * <TestUnifiedInventory />
 */

export function TestUnifiedInventory() {
  const {
    inventoryItems,
    unifiedContracts,
    unifiedRates,
    addInventoryItem,
    addUnifiedContract,
    addUnifiedRate,
    suppliers,
  } = useData()

  const [testResults, setTestResults] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (message: string, isSuccess = true) => {
    const prefix = isSuccess ? '✅' : '❌'
    setTestResults(prev => [...prev, `${prefix} ${message}`])
    console.log(`${prefix} ${message}`)
  }

  const runTests = async () => {
    setIsRunning(true)
    setTestResults([])
    
    try {
      // Test 1: Create Ticket Inventory
      addResult('Test 1: Creating ticket inventory...')
      const ticketItem = addInventoryItem({
        item_type: 'ticket',
        name: 'Abu Dhabi F1 Grand Prix Tickets',
        location: 'Yas Marina Circuit',
        description: 'Official F1 race tickets',
        metadata: {
          event_type: 'sports',
          event_name: 'Abu Dhabi GP 2025',
          venue_name: 'Yas Marina Circuit',
        },
        categories: [
          {
            id: 'ticket-grandstand',
            item_id: 0,
            category_name: 'Main Grandstand',
            description: '3-day pass',
            capacity_info: { section_capacity: 500 },
            pricing_behavior: { pricing_mode: 'per_person' }
          }
        ],
        active: true
      })
      addResult(`Created ticket item: ${ticketItem.name} (ID: ${ticketItem.id})`)

      // Test 2: Create Transfer Inventory
      addResult('Test 2: Creating transfer inventory...')
      const transferItem = addInventoryItem({
        item_type: 'transfer',
        name: 'Airport Transfers',
        location: 'Abu Dhabi',
        description: 'Private transfers',
        metadata: {
          transfer_type: 'airport',
          provider_name: 'UAE Transport'
        },
        categories: [
          {
            id: 'transfer-sedan',
            item_id: 0,
            category_name: 'Private Sedan',
            description: '1-3 passengers',
            capacity_info: { max_pax: 3, min_pax: 1 },
            pricing_behavior: {
              pricing_mode: 'per_vehicle',
              directional: true,
              directions: ['inbound', 'outbound', 'round_trip']
            }
          }
        ],
        active: true
      })
      addResult(`Created transfer item: ${transferItem.name} (ID: ${transferItem.id})`)

      // Test 3: Create Contract (if supplier exists)
      if (suppliers.length > 0) {
        addResult('Test 3: Creating contract for tickets...')
        const contract = addUnifiedContract({
          item_id: ticketItem.id,
          supplier_id: suppliers[0].id,
          contract_name: 'F1 Tickets Block 2025',
          valid_from: '2025-11-28',
          valid_to: '2025-11-30',
          currency: 'AED',
          pricing_strategy: 'per_unit',
          markup_percentage: 0.40,
          tax_rate: 0.05,
          dynamic_charges: [],
          active: true
        })
        addResult(`Created contract: ${contract.contract_name} (ID: ${contract.id})`)

        // Test 4: Create Rate
        addResult('Test 4: Creating rate for tickets...')
        const rate = addUnifiedRate({
          item_id: ticketItem.id,
          category_id: 'ticket-grandstand',
          contract_id: contract.id,
          allocation_pool_id: 'f1-main-pool',
          base_rate: 1200,
          markup_percentage: 0.40,
          currency: 'AED',
          inventory_type: 'contract',
          rate_details: { pricing_unit: 'per_person' },
          valid_from: '2025-11-28',
          valid_to: '2025-11-30',
          active: true
        })
        addResult(`Created rate: ${rate.categoryName} @ AED ${rate.base_rate} → AED ${rate.selling_price}`)
      } else {
        addResult('Test 3: Skipped (no suppliers found)', false)
      }

      // Test 5: Create Buy-to-Order Transfer Rate
      addResult('Test 5: Creating buy-to-order transfer rate...')
      const transferRate = addUnifiedRate({
        item_id: transferItem.id,
        category_id: 'transfer-sedan',
        contract_id: undefined,
        base_rate: 150,
        markup_percentage: 0.50,
        currency: 'AED',
        inventory_type: 'buy_to_order',
        rate_details: {
          direction: 'inbound',
          pricing_unit: 'per_vehicle'
        },
        valid_from: '2025-11-01',
        valid_to: '2025-12-31',
        active: true
      })
      addResult(`Created buy-to-order transfer: ${transferRate.categoryName} @ AED ${transferRate.base_rate} → AED ${transferRate.selling_price}`)

      addResult('🎉 All tests passed!')
      addResult(`📊 Summary: ${inventoryItems.length} items, ${unifiedContracts.length} contracts, ${unifiedRates.length} rates`)

    } catch (error) {
      addResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, false)
    } finally {
      setIsRunning(false)
    }
  }

  const clearData = () => {
    if (confirm('Clear all test data from unified inventory?')) {
      localStorage.removeItem('tours-inventory-unified-items')
      localStorage.removeItem('tours-inventory-unified-contracts')
      localStorage.removeItem('tours-inventory-unified-rates')
      window.location.reload()
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Unified Inventory System Tests
        </CardTitle>
        <CardDescription>
          Test the new unified inventory system that handles hotels, tickets, transfers, activities, and more!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {inventoryItems.length}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Inventory Items</div>
            <div className="text-xs text-muted-foreground mt-1">
              {inventoryItems.map(i => i.item_type).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'None'}
            </div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {unifiedContracts.length}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Contracts</div>
            <div className="text-xs text-muted-foreground mt-1">
              contracts
            </div>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {unifiedRates.length}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Rates</div>
            <div className="text-xs text-muted-foreground mt-1">
              {unifiedRates.filter(r => r.active).length} active
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={runTests}
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? 'Running Tests...' : '▶️ Run All Tests'}
          </Button>
          <Button
            variant="outline"
            onClick={clearData}
            disabled={inventoryItems.length === 0 && unifiedContracts.length === 0 && unifiedRates.length === 0}
          >
            🗑️ Clear Test Data
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              Test Results
              {testResults.some(r => r.startsWith('❌')) ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </h4>
            <div className="space-y-1 font-mono text-xs">
              {testResults.map((result, i) => (
                <div
                  key={i}
                  className={result.startsWith('✅') ? 'text-green-600' : result.startsWith('❌') ? 'text-destructive' : ''}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Data */}
        {(inventoryItems.length > 0 || unifiedContracts.length > 0 || unifiedRates.length > 0) && (
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold">Current Unified Inventory</h4>
            
            {inventoryItems.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Items:</div>
                <div className="space-y-1">
                  {inventoryItems.map(item => (
                    <div key={item.id} className="text-xs flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.item_type}
                      </Badge>
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">({item.categories.length} categories)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unifiedContracts.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Contracts:</div>
                <div className="space-y-1">
                  {unifiedContracts.map(contract => (
                    <div key={contract.id} className="text-xs flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {contract.item_type}
                      </Badge>
                      <span>{contract.contract_name}</span>
                      <span className="text-muted-foreground">
                        (contract)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unifiedRates.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Rates:</div>
                <div className="space-y-1">
                  {unifiedRates.map(rate => (
                    <div key={rate.id} className="text-xs flex items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        {rate.item_type}
                      </Badge>
                      <span>{rate.categoryName}</span>
                      <span className="text-muted-foreground">
                        {rate.currency} {rate.base_rate} → {rate.selling_price}
                      </span>
                      {rate.allocation_pool_id && (
                        <Badge variant="outline" className="text-xs">
                          Pool: {rate.allocation_pool_id}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded">
          <strong>💡 What's Being Tested:</strong>
          <ul className="mt-2 space-y-1 ml-4 list-disc">
            <li>Creating ticket inventory (F1 Grand Prix)</li>
            <li>Creating transfer inventory (Airport transfers)</li>
            <li>Creating contracts with allocation pools</li>
            <li>Creating contract-based rates</li>
            <li>Creating buy-to-order rates (no contract)</li>
            <li>Automatic selling price calculation</li>
            <li>localStorage persistence</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

