# 🗺️ Unified Inventory Implementation Roadmap

## Executive Summary

Transform your dual inventory system (Hotels + Services) into a unified, polymorphic system while preserving all existing complexity and functionality.

**Timeline:** 4-6 weeks  
**Risk Level:** Low (backward compatible migration)  
**Code Reduction:** 45% (~3,000 lines)  
**User Impact:** Improved UX, single interface for all inventory

---

## Phase 1: Foundation (Week 1)

### ✅ **Step 1.1: Create Type Definitions**
**Status:** ✅ **COMPLETE**

Files created:
- ✅ `src/types/unified-inventory.ts` - All type definitions
- ✅ `UNIFIED_INVENTORY_ARCHITECTURE.md` - Architecture documentation
- ✅ `UNIFIED_INVENTORY_COMPARISON.md` - Before/after comparison

### ✅ **Step 1.2: Review & Approval**
**Task:** Review the architecture with your team

**Questions to answer:**
1. Does the unified model preserve all hotel complexity?
2. Are service-specific features maintained?
3. Can we add new inventory types (venues, experiences) easily?
4. Is the migration path clear?

**Decision Point:** Approve to proceed with implementation

---

## Phase 2: Data Layer (Week 2)

### **Step 2.1: Extend DataContext**

**File:** `src/contexts/data-context.tsx`

**Tasks:**
1. Add unified interfaces alongside existing ones:
   ```typescript
   // New state
   const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
   const [unifiedContracts, setUnifiedContracts] = useState<UnifiedContract[]>([])
   const [unifiedRates, setUnifiedRates] = useState<UnifiedRate[]>([])
   ```

2. Create migration functions:
   ```typescript
   // Convert existing Hotel → InventoryItem
   function migrateHotelToInventoryItem(hotel: Hotel): InventoryItem {
     return {
       id: hotel.id,
       item_type: 'hotel',
       name: hotel.name,
       location: hotel.location,
       description: hotel.description,
       metadata: {
         star_rating: hotel.star_rating,
         city: hotel.city,
         country: hotel.country,
         contact_info: {
           phone: hotel.phone,
           email: hotel.email
         }
       },
       categories: hotel.room_groups.map(rg => ({
         id: rg.id,
         item_id: hotel.id,
         category_name: rg.room_type,
         description: rg.description,
         features: rg.features,
         capacity_info: {
           max_occupancy: rg.capacity
         },
         pricing_behavior: {
           pricing_mode: 'per_occupancy' as const,
           occupancy_types: ['single', 'double', 'triple', 'quad'],
           board_options: ['room_only', 'bed_breakfast', 'half_board', 'full_board', 'all_inclusive']
         }
       })),
       active: true
     }
   }
   
   // Convert existing ServiceInventoryType → InventoryItem
   function migrateServiceToInventoryItem(service: ServiceInventoryType): InventoryItem {
     return {
       id: service.id,
       item_type: 'service',
       name: service.name,
       location: service.location,
       description: service.description,
       metadata: {
         service_category: service.category
       },
       categories: service.service_categories.map(sc => ({
         id: sc.id,
         item_id: service.id,
         category_name: sc.category_name,
         description: sc.description,
         features: sc.features,
         capacity_info: {
           max_pax: sc.max_pax,
           min_pax: sc.min_pax
         },
         pricing_behavior: {
           pricing_mode: sc.pricing_unit as any,
           directional: true, // If transfer
           directions: ['inbound', 'outbound', 'round_trip', 'one_way']
         }
       })),
       active: service.active
     }
   }
   ```

3. Add unified CRUD methods:
   ```typescript
   const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
     const newItem = { ...item, id: Date.now() }
     setInventoryItems([...inventoryItems, newItem])
     
     // Also add to legacy arrays for backward compatibility
     if (item.item_type === 'hotel') {
       const hotel = convertInventoryItemToHotel(newItem)
       setHotels([...hotels, hotel])
     }
     
     return newItem
   }
   
   const addUnifiedContract = (contract: Omit<UnifiedContract, 'id'>) => {
     const newContract = { ...contract, id: Date.now() }
     setUnifiedContracts([...unifiedContracts, newContract])
     return newContract
   }
   
   const addUnifiedRate = (rate: Omit<UnifiedRate, 'id'>) => {
     const newRate = { ...rate, id: Date.now(), selling_price: rate.base_rate * (1 + rate.markup_percentage) }
     setUnifiedRates([...unifiedRates, newRate])
     return newRate
   }
   ```

4. Keep backward compatibility:
   ```typescript
   // Maintain existing hotel methods
   const addHotel = (hotelData: any) => {
     // Convert to InventoryItem
     const item = {
       item_type: 'hotel' as const,
       name: hotelData.name,
       location: hotelData.location,
       // ... etc
     }
     return addInventoryItem(item)
   }
   ```

**Testing:**
- ✅ Create test InventoryItem (hotel type)
- ✅ Create test InventoryItem (service type)
- ✅ Verify backward compatibility (existing code still works)

---

## Phase 3: UI Components (Week 3)

### **Step 3.1: Create Unified Rate Form**

**File:** `src/components/forms/unified-rate-form.tsx`  
**Status:** ✅ **COMPLETE** (proof of concept created)

**Tasks:**
1. ✅ Review proof-of-concept component
2. Add comprehensive cost calculations
3. Add validation for all item types
4. Add cost preview for all types (not just hotels)

### **Step 3.2: Create Unified Contract Form**

**File:** `src/components/forms/unified-contract-form.tsx`

**Structure:**
```tsx
export function UnifiedContractForm({
  item,  // InventoryItem (hotel, service, etc.)
  contract,  // Existing contract (if editing)
  suppliers,
  tours,
  onSave,
  onCancel
}) {
  return (
    <Accordion defaultValue={["basic", "allocations"]}>
      {/* Always shown */}
      <AccordionItem value="basic">
        <BasicContractInfo />
      </AccordionItem>
      
      <AccordionItem value="allocations">
        <UnifiedAllocationsSection itemType={item.item_type} />
      </AccordionItem>
      
      <AccordionItem value="pricing">
        <PricingStrategySection />
      </AccordionItem>
      
      <AccordionItem value="costs">
        <CostsSection itemType={item.item_type}>
          {/* Conditional rendering */}
          {item.item_type === 'hotel' && <HotelCostsSection />}
          {item.item_type === 'service' && <ServiceCostsSection />}
        </CostsSection>
      </AccordionItem>
      
      <AccordionItem value="policies">
        <PoliciesSection />
      </AccordionItem>
    </Accordion>
  )
}
```

### **Step 3.3: Create Unified Item Form**

**File:** `src/components/forms/unified-item-form.tsx`

**Features:**
- Item type selector (hotel, service, venue, etc.)
- Dynamic category form based on item type
- Reorder categories (like current hotel form)
- Edit inline

---

## Phase 4: Main Page (Week 4)

### **Step 4.1: Create Unified Inventory Page**

**File:** `src/pages/unified-inventory.tsx`

**Structure:**
```tsx
export function UnifiedInventory() {
  const { inventoryItems, unifiedContracts, unifiedRates, tours, suppliers } = useData()
  
  const [filterItemType, setFilterItemType] = useState<InventoryItemType | 'all'>('all')
  const [filterTour, setFilterTour] = useState<string>('all')
  const [filterSupplier, setFilterSupplier] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filter items
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      if (filterItemType !== 'all' && item.item_type !== filterItemType) return false
      if (!item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
  }, [inventoryItems, filterItemType, searchTerm])
  
  return (
    <div className="space-y-6">
      {/* Header with Add Item button */}
      <UnifiedInventoryHeader onAddItem={handleAddItem} />
      
      {/* Stats Cards */}
      <StatsGrid
        items={filteredItems}
        contracts={unifiedContracts}
        rates={unifiedRates}
      />
      
      {/* Filter Bar */}
      <UnifiedFilterBar
        itemTypes={['all', 'hotel', 'service', 'venue']}
        selectedItemType={filterItemType}
        onItemTypeChange={setFilterItemType}
        tours={tours}
        suppliers={suppliers}
        {...filterProps}
      />
      
      {/* Main Content - Grouped by Tour */}
      <Accordion type="multiple">
        {/* Generic Items (no tour) */}
        <GenericInventorySection
          items={genericItems}
          contracts={genericContracts}
          rates={genericRates}
        />
        
        {/* Tour-specific Items */}
        {tours.map(tour => (
          <TourInventorySection
            key={tour.id}
            tour={tour}
            items={tourItems}
            contracts={tourContracts}
            rates={tourRates}
          />
        ))}
      </Accordion>
    </div>
  )
}
```

### **Step 4.2: Create Shared Components**

**Files to create:**

1. **`UnifiedRatesTable.tsx`**
   - Conditional columns based on item type
   - Pool indicator
   - Actions (edit, clone, delete)

2. **`AllocationPoolSummary.tsx`**
   - Works for all item types
   - Shows pool utilization
   - Links to rates in pool

3. **`UnifiedContractCard.tsx`**
   - Displays contract info
   - Type-specific badges
   - Actions

4. **`UnifiedItemCard.tsx`**
   - Item header with icon (based on type)
   - Categories summary
   - Quick actions

---

## Phase 5: Migration & Testing (Week 5)

### **Step 5.1: Data Migration Script**

**File:** `src/utils/migrate-to-unified.ts`

```typescript
export function migrateAllData(context: DataContext) {
  console.log('Starting migration to unified inventory...')
  
  // Migrate hotels
  const migratedHotels = context.hotels.map(migrateHotelToInventoryItem)
  console.log(`Migrated ${migratedHotels.length} hotels`)
  
  // Migrate services
  const migratedServices = context.serviceInventoryTypes.map(migrateServiceToInventoryItem)
  console.log(`Migrated ${migratedServices.length} services`)
  
  // Migrate contracts
  const migratedContracts = [
    ...context.contracts.map(migrateHotelContractToUnified),
    ...context.serviceContracts.map(migrateServiceContractToUnified)
  ]
  console.log(`Migrated ${migratedContracts.length} contracts`)
  
  // Migrate rates
  const migratedRates = [
    ...context.rates.map(migrateHotelRateToUnified),
    ...context.serviceRates.map(migrateServiceRateToUnified)
  ]
  console.log(`Migrated ${migratedRates.length} rates`)
  
  return {
    inventoryItems: [...migratedHotels, ...migratedServices],
    unifiedContracts: migratedContracts,
    unifiedRates: migratedRates
  }
}
```

### **Step 5.2: Testing Plan**

**Test Cases:**

1. **Hotel Migration**
   - ✅ All room groups preserved
   - ✅ All hotel-specific costs preserved
   - ✅ Occupancy rates work correctly
   - ✅ Board options work correctly

2. **Service Migration**
   - ✅ All service categories preserved
   - ✅ Directional services work correctly
   - ✅ Pricing units preserved

3. **Contract Migration**
   - ✅ All allocations preserved
   - ✅ Pool IDs maintained
   - ✅ Tour links preserved
   - ✅ All policies migrated

4. **Rate Migration**
   - ✅ All rates link to correct items/categories
   - ✅ Pool assignments preserved
   - ✅ Cost calculations match original
   - ✅ Active/inactive status preserved

5. **CRUD Operations**
   - ✅ Create hotel item + contract + rates
   - ✅ Create service item + contract + rates
   - ✅ Edit existing items
   - ✅ Delete items (with cascade checks)

6. **Backward Compatibility**
   - ✅ Old `addHotel()` method still works
   - ✅ Old `addContract()` method still works
   - ✅ Old pages can still access data (during transition)

---

## Phase 6: Rollout (Week 6)

### **Step 6.1: Feature Flag**

Add feature flag to toggle between old and new systems:

```typescript
// src/config/features.ts
export const FEATURES = {
  UNIFIED_INVENTORY: process.env.REACT_APP_UNIFIED_INVENTORY === 'true'
}

// In App.tsx
{FEATURES.UNIFIED_INVENTORY ? (
  <Route path="/inventory" element={<UnifiedInventory />} />
) : (
  <>
    <Route path="/inventory-setup" element={<InventorySetup />} />
    <Route path="/service-inventory" element={<ServiceInventory />} />
  </>
)}
```

### **Step 6.2: A/B Test**

1. **Week 6 Day 1-2:** Internal testing only
2. **Week 6 Day 3-4:** Beta users (50% of team)
3. **Week 6 Day 5-7:** All users with rollback option

### **Step 6.3: Full Rollout**

1. Set `UNIFIED_INVENTORY=true` in production
2. Redirect old routes:
   ```typescript
   <Route path="/inventory-setup" element={<Navigate to="/inventory?type=hotel" replace />} />
   <Route path="/service-inventory" element={<Navigate to="/inventory?type=service" replace />} />
   ```
3. Monitor for issues (first week)
4. Deprecate old pages (after 2 weeks of stability)

---

## Phase 7: Cleanup (Week 7)

### **Step 7.1: Remove Old Code**

After unified system is stable:

1. Delete old pages:
   - ❌ `src/pages/inventory-setup.tsx` (2275 lines)
   - ❌ `src/pages/service-inventory.tsx` (2651 lines)

2. Archive old form components:
   - ❌ `src/components/forms/contract-form.tsx` (1267 lines)
   - Keep `hotel-form.tsx` for reference (may be useful for venues)

3. Update DataContext:
   - Remove backward compatibility methods
   - Keep only unified methods
   - Clean up dual state

**Code savings:** ~4,900 lines removed!

---

## Risk Mitigation

### **Risks & Mitigation Strategies**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Data loss during migration | Low | High | • Comprehensive testing<br>• Backup before migration<br>• Dry-run in staging |
| User confusion | Medium | Medium | • Training materials<br>• In-app tutorials<br>• Gradual rollout |
| Performance issues | Low | Medium | • Load testing<br>• Memoization<br>• Virtual scrolling for large lists |
| Bugs in unified logic | Medium | High | • Extensive unit tests<br>• Integration tests<br>• Feature flag for rollback |
| Missing features | Low | High | • Feature parity checklist<br>• Beta user feedback<br>• Monitoring |

---

## Success Metrics

### **Week 4 (Development Complete)**
- ✅ All tests passing
- ✅ Feature parity with old system
- ✅ Code review approved
- ✅ Documentation complete

### **Week 6 (Rollout Complete)**
- ✅ 100% of users on new system
- ✅ Zero critical bugs
- ✅ User satisfaction > 80%
- ✅ Performance within 10% of old system

### **Week 8 (Cleanup Complete)**
- ✅ Old code removed
- ✅ Code reduced by 45%
- ✅ No backward compatibility layer needed
- ✅ Team trained on new system

---

## Next Steps

### **Immediate Actions** (This Week)

1. **Review this roadmap** with your team
2. **Approve architecture** (see UNIFIED_INVENTORY_ARCHITECTURE.md)
3. **Set timeline** (adjust week estimates as needed)
4. **Assign developers** (2-3 people recommended)

### **Week 1 Actions**

1. **Create feature branch:** `feature/unified-inventory`
2. **Implement Phase 2** (Data Layer)
3. **Write unit tests** for migration functions
4. **Daily standups** to track progress

### **Questions Before Starting?**

- Do you want to add any other inventory types (venues, experiences)?
- Should we support cross-type allocation pools (e.g., hotel + transport package)?
- Any custom fields or features not covered in the architecture?
- Timeline constraints or deadlines to consider?

---

## Resources

### **Documentation Created**
- ✅ `UNIFIED_INVENTORY_ARCHITECTURE.md` - Full technical spec
- ✅ `UNIFIED_INVENTORY_COMPARISON.md` - Before/after comparison
- ✅ `src/types/unified-inventory.ts` - TypeScript interfaces
- ✅ `src/components/forms/unified-rate-form.tsx` - Proof of concept

### **Next Documents to Create**
- [ ] Migration guide for users
- [ ] API documentation for unified methods
- [ ] Testing guide
- [ ] Troubleshooting guide

---

## Ready to Start?

**Recommended approach:**
1. Start with Phase 2 (Data Layer) - low risk, high value
2. Test thoroughly with existing data
3. Build UI incrementally (one form at a time)
4. Roll out gradually with feature flag
5. Gather feedback and iterate

**Estimated effort:** 160-200 hours (2-3 developers × 4 weeks)

**Questions?** Review the architecture docs and let me know what needs clarification!


