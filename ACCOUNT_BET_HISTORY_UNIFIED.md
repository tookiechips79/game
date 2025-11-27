# Account Tab & Bet History Tab - Unified Data

## Solution: Single Source of Truth

Instead of duplicating calculation logic, created a **reusable custom hook** that both tabs use.

### What Changed

#### 1. Created `useBetStats` Hook
**File**: `/src/hooks/useBetStats.ts` (NEW)

```typescript
export const useBetStats = (userId: string) => {
  const { getHardLedgerBetHistory } = useUser();

  return useMemo(() => {
    const hardLedgerHistory = getHardLedgerBetHistory();
    // Calculate all stats (totalWon, totalLost, winRate, etc.)
    // Returns consistent data
  }, [userId]);
};
```

**Single Source of Truth:**
- One calculation logic
- Used by both Account tab and Bet History tab
- Easy to update in one place

#### 2. Updated UserSettings.tsx
**File**: `/src/pages/UserSettings.tsx`

```typescript
// Before: Complex calculation logic copied in
const betStats = useMemo(() => {
  // 50+ lines of calculation
}, [currentUser.id]);

// After: Simple hook
const betStats = useBetStats(currentUser.id);
```

**Benefits:**
- Removed ~50 lines of duplication
- Much cleaner code
- Guaranteed to match Bet History tab

#### 3. Account Tab Display
Now uses data from the same hook:

```typescript
<div>
  <h3>Win/Loss Record</h3>
  <p>{betStats.totalWon} Wins / {betStats.totalLost} Losses</p>
</div>

<div>
  <h3>Win Rate</h3>
  <p>{betStats.winRate}%</p>
</div>

<div>
  <h3>Total Bets</h3>
  <p>{betStats.totalBets}</p>
</div>

<div>
  <h3>Win/Loss Amount</h3>
  <p>+{betStats.totalWonAmount} / -{betStats.totalLostAmount}</p>
</div>
```

## What Gets Displayed

Both Account Tab and Bet History Tab now show:

| Metric | Value |
|--------|-------|
| **Win/Loss Record** | Exact number of matched wins and losses |
| **Win Rate** | Percentage (e.g., 62.5%) |
| **Total Bets** | Count of all bets (matched + unmatched) |
| **Win/Loss Amount** | Coins won (+) and lost (-) on matched bets |

## How It Works

### Calculation (in `useBetStats`)
```
For each game:
  1. Get user's bets (both teams)
  2. Filter for matched bets (booked = true)
  3. Count:
     - totalBets: All bets
     - totalWon/Lost: Only matched bets outcomes
     - totalWonAmount/Lost: Coin amounts from matched bets
     - winRate: totalWon / (totalWon + totalLost) * 100
```

### Usage
```typescript
// Account tab
const betStats = useBetStats(currentUser.id);
// Display: {betStats.totalWon} Wins

// Bet History tab (could also use it)
const betStats = useBetStats(userId);
// Same calculation, same result
```

## Architecture Benefits

✅ **DRY Principle**: No code duplication  
✅ **Single Source of Truth**: One calculation logic  
✅ **Easy Updates**: Change logic once, affects everywhere  
✅ **Consistent**: Both tabs guaranteed to match  
✅ **Maintainable**: Clear, focused code  
✅ **Testable**: Hook is easy to unit test  
✅ **Reusable**: Other components can use the same hook  

## Files Modified

1. **Created**: `/src/hooks/useBetStats.ts` (NEW)
   - Reusable hook for bet statistics calculation
   - Single source of truth

2. **Modified**: `/src/pages/UserSettings.tsx`
   - Removed ~50 lines of calculation
   - Added import for `useBetStats`
   - Changed to: `const betStats = useBetStats(currentUser.id);`
   - Updated display to use hook data

## Performance

- **Memoization**: Hook uses `useMemo` to avoid recalculation
- **Dependencies**: Only recalculates when `userId` changes
- **Optimized**: No unnecessary renders or calculations

## Testing

To verify both tabs match:
1. Go to Account tab → See Win/Loss Record
2. Go to Bet History tab → See Win/Loss statistics
3. ✅ Numbers should be identical

