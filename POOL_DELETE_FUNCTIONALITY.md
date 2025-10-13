# 🗑️ **Pool Delete Functionality - ADDED**

## **✅ What We Added**

### **1. Delete Pool Handler**
```typescript
const handleDeletePool = (poolId: string) => {
  // Check if pool has bookings
  const pool = allocationPoolCapacity.find(p => p.pool_id === poolId)
  if (pool && pool.current_bookings > 0) {
    toast.error(`Cannot delete pool "${poolId}" - it has ${pool.current_bookings} bookings`)
    return
  }
  
  // Check if pool is referenced by any rates
  const ratesUsingPool = unifiedRates.filter(r => r.allocation_pool_id === poolId)
  if (ratesUsingPool.length > 0) {
    toast.error(`Cannot delete pool "${poolId}" - it's used by ${ratesUsingPool.length} rates`)
    return
  }
  
  if (confirm(`Delete pool "${poolId}"? This action cannot be undone.`)) {
    deleteAllocationPoolCapacity(poolId)
    toast.success(`Pool "${poolId}" deleted`)
  }
}
```

### **2. Delete Button in Pool Cards**
Added a red trash icon button next to the "Manage" button in each pool card:
```tsx
<Button 
  size="sm" 
  variant="ghost" 
  onClick={() => handleDeletePool(pool.pool_id)}
  className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
>
  <Trash2 className="h-3 w-3" />
</Button>
```

### **3. Safety Checks**
- **Bookings Check**: Cannot delete pools with existing bookings
- **Rates Check**: Cannot delete pools that are referenced by rates
- **Confirmation Dialog**: User must confirm deletion

---

## **🎯 How It Works**

### **Pool Card Layout:**
```
┌─────────────────────────────────────────────────┐
│ summer-2025-pool-1  [healthy]  [Manage] [🗑️]   │
├─────────────────────────────────────────────────┤
│ Allocations:                                    │
│   Standard Double Room: 20                     │
│   Standard Twin Room: 10                       │
│   Total Allocated: 30                          │
├─────────────────────────────────────────────────┤
│ 25 available  85.2% utilized                   │
└─────────────────────────────────────────────────┘
```

### **Delete Process:**
1. **Click Trash Icon** → Safety checks run
2. **If Safe** → Confirmation dialog appears
3. **Confirm** → Pool deleted with success message
4. **If Unsafe** → Error message explains why

---

## **🛡️ Safety Features**

### **Prevents Deletion If:**
- ✅ Pool has bookings (`current_bookings > 0`)
- ✅ Pool is referenced by rates (`allocation_pool_id` matches)
- ✅ User doesn't confirm deletion

### **Error Messages:**
```
❌ Cannot delete pool "summer-pool" - it has 5 bookings
❌ Cannot delete pool "summer-pool" - it's used by 3 rates
```

### **Success Message:**
```
✅ Pool "summer-pool" deleted
```

---

## **🚀 Usage**

### **To Delete a Pool:**
1. Navigate to Unified Inventory
2. Find the item with the pool you want to delete
3. Look for the pools section
4. Click the red trash icon (🗑️) next to the pool
5. Confirm deletion if prompted

### **Pool Will NOT Delete If:**
- It has any bookings
- It's linked to any rates
- You cancel the confirmation

### **Pool WILL Delete If:**
- It has no bookings
- It's not linked to any rates
- You confirm the deletion

---

## **🔧 Technical Details**

### **Required Imports:**
```typescript
import { Trash2 } from 'lucide-react'
```

### **Required Data Context:**
```typescript
const {
  allocationPoolCapacity,
  deleteAllocationPoolCapacity,
  unifiedRates
} = useData()
```

### **Button Styling:**
- Red color (`text-red-600`)
- Hover effects (`hover:text-red-700 hover:bg-red-50`)
- Small size (`h-6 px-2 text-xs`)
- Ghost variant for subtle appearance

Now you can safely delete pools that aren't being used! 🗑️
