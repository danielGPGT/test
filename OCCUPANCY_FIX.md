# ✅ Occupancy Dropdown Fix

## 🐛 Issue Identified

The occupancy dropdown was showing a **fixed list** of options (single/double/triple/quad) regardless of what rates were actually available.

**Problem:**
```typescript
// OLD - WRONG
<SelectContent>
  <SelectItem value="single">Single</SelectItem>
  <SelectItem value="double">Double</SelectItem>
  <SelectItem value="triple">Triple</SelectItem>
  <SelectItem value="quad">Quad</SelectItem>
</SelectContent>
```

If you only had rates for "double" occupancy, it would still show single/triple/quad options that couldn't be used!

---

## ✅ Solution Implemented

Now the occupancy dropdown is **dynamic** and only shows occupancy types that exist in the actual rates.

### **1. Extract Available Occupancies**

```typescript
// Get available occupancy types from rates
const availableOccupancies = useMemo(() => {
  const occupancies = new Set<OccupancyType>()
  roomGroup.rates.forEach(r => occupancies.add(r.rate.occupancy_type))
  return Array.from(occupancies).sort()
}, [roomGroup.rates])
```

**Logic:**
- Scan all rates for this room group
- Collect unique occupancy types
- Sort them (double, quad, single, triple alphabetically)
- Return as array

---

### **2. Dynamic Dropdown Options**

```typescript
<SelectContent>
  {availableOccupancies.map(occ => (
    <SelectItem key={occ} value={occ} className="text-xs capitalize">
      {occ} {occ === 'single' && '(1p)'}
      {occ === 'double' && '(2p)'}
      {occ === 'triple' && '(3p)'}
      {occ === 'quad' && '(4p)'}
    </SelectItem>
  ))}
</SelectContent>
```

**Result:**
- Only shows occupancy types that have actual rates
- Shows person count hint (1p, 2p, 3p, 4p)
- If only double exists, only shows double!

---

### **3. Filter Contracts by Occupancy**

When user changes occupancy, contract options are **recalculated** to only show contracts that have rates for that occupancy:

```typescript
// Calculate contract options based on selected occupancy
const contractOptions = useMemo(() => {
  return roomGroup.rates
    .filter(rateItem => rateItem.rate.occupancy_type === selectedOcc) // ← Filter by occupancy
    .map(rateItem => {
      // Calculate cost/sell/margin for this occupancy
      const breakdown = calculatePriceBreakdown(baseRate, contract, selectedOcc, nights, boardCost)
      // ...
    })
    .sort((a, b) => b.marginPerRoom - a.marginPerRoom)
}, [roomGroup.rates, nights, selectedOcc]) // ← Recalcs when occupancy changes
```

**Logic:**
1. When occupancy changes to "triple"
2. Filter rates to only show those with occupancy_type="triple"
3. Recalculate pricing for triple occupancy
4. Show only contracts that have triple rates
5. Sort by best margin for triple

---

### **4. Auto-Switch Contract on Occupancy Change**

```typescript
// Set default selected rate when contract options change or occupancy changes
useEffect(() => {
  if (contractOptions.length > 0) {
    // If current selection is not in the list, select the first one
    const isValid = contractOptions.some(opt => opt.rate.id === selectedRateId)
    if (!isValid) {
      setSelectedRateId(contractOptions[0].rate.id) // ← Auto-select best margin
    }
  }
}, [contractOptions, selectedRateId])
```

**Behavior:**
- User selects Contract A (double)
- User changes occupancy to "triple"
- Contract A doesn't have triple rates
- System automatically switches to first contract with triple rates
- Smooth experience!

---

## 🎯 Examples

### **Example 1: Only Double Available**

**Rates in system:**
- Contract A: Double only
- Contract B: Double only
- Contract C: Double only

**Dropdown shows:**
```
✓ Double (2p)
```
**That's it!** No single/triple/quad options shown.

---

### **Example 2: Double and Triple**

**Rates in system:**
- Contract A: Double, Triple
- Contract B: Double only
- Contract C: Triple only

**Dropdown shows:**
```
✓ Double (2p)
✓ Triple (3p)
```

**When "Double" selected:**
- Shows: Contract A, Contract B ✓
- Hides: Contract C (no double rate)

**When "Triple" selected:**
- Shows: Contract A, Contract C ✓
- Hides: Contract B (no triple rate)

---

### **Example 3: All Occupancies**

**Rates in system:**
- Contract A: Single, Double, Triple, Quad

**Dropdown shows:**
```
✓ Double (2p)
✓ Quad (4p)
✓ Single (1p)
✓ Triple (3p)
```
(Alphabetically sorted)

All contracts show for any selection since Contract A has all occupancies.

---

## 📊 Technical Details

### **State Management:**

```typescript
// Available occupancies (derived from rates)
const availableOccupancies = useMemo(...)

// Current selected occupancy (user choice)
const [selectedOcc, setSelectedOcc] = useState(availableOccupancies[0] || 'double')

// Contract options filtered by occupancy
const contractOptions = useMemo(() => 
  roomGroup.rates.filter(r => r.occupancy_type === selectedOcc)
  ...
, [roomGroup.rates, nights, selectedOcc])

// Auto-select valid contract when occupancy changes
useEffect(() => { ... }, [contractOptions, selectedRateId])
```

### **Data Flow:**

```
1. Room rates loaded
   ↓
2. Extract unique occupancies
   ↓
3. Default to first available (usually 'double')
   ↓
4. Calculate contract options for that occupancy
   ↓
5. User changes occupancy dropdown
   ↓
6. Recalculate contract options for new occupancy
   ↓
7. Auto-select best margin contract if current invalid
   ↓
8. Update prices based on new occupancy
```

---

## ✅ Benefits

### **1. No Invalid Options**
- Can't select occupancy that doesn't exist
- No confusing empty states
- Clean UX

### **2. Dynamic Pricing**
- Prices recalculate for each occupancy
- Margins update correctly
- Shows true cost for selected occupancy

### **3. Smart Contract Filtering**
- Only shows contracts with selected occupancy
- Auto-switches to valid contract
- Always shows best margin first

### **4. Clear Labeling**
- Shows person count (1p, 2p, 3p, 4p)
- Capitalized text
- Compact display

---

## 🧪 Testing

### **Test Case 1: Single Occupancy Only**

Setup:
- Create rates for double occupancy only

Expected:
- ✅ Dropdown shows only "double (2p)"
- ✅ Cannot select other occupancies
- ✅ All contracts visible

---

### **Test Case 2: Change Occupancy**

Setup:
- Contract A: double, triple
- Contract B: double only
- Start with double selected, Contract B chosen

Actions:
1. Change occupancy to triple

Expected:
- ✅ Contract list updates
- ✅ Contract B disappears (no triple)
- ✅ Contract A auto-selected
- ✅ Prices recalculate for triple
- ✅ Margin updates

---

### **Test Case 3: Mixed Occupancies**

Setup:
- Contract A: single, double
- Contract B: triple, quad
- Contract C: double, triple

Actions:
1. Select "double" - see Contracts A, C
2. Select "triple" - see Contracts B, C
3. Select "single" - see Contract A
4. Select "quad" - see Contract B

Expected:
- ✅ Contract visibility changes correctly
- ✅ Prices accurate for each occupancy
- ✅ Best margin highlighted per occupancy

---

## 🎉 Summary

**Fixed Issues:**
✅ Occupancy dropdown now shows only available options
✅ Contract list filters based on occupancy
✅ Pricing recalculates per occupancy
✅ Auto-switches to valid contract
✅ No more invalid selections

**User Experience:**
✅ Clear, unambiguous options
✅ Smart auto-selection
✅ Accurate pricing
✅ Professional behavior

**The occupancy dropdown is now intelligent and user-friendly!** 🎊

