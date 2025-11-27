# Account Tab Win/Loss Record Sync

## Problem
The Account tab and Bet History tab were showing **different** win/loss statistics:

- **Account Tab**: Displayed `currentUser.wins` and `currentUser.losses` 
  - These were stored on the User object
  - May not have been updated correctly

- **Bet History Tab**: Calculated wins/losses dynamically from actual bet records
  - Based on `HardLedgerBetHistory`
  - Showed accurate count of matched bets

This created confusion because users saw different numbers in different tabs.

## Solution
Modified the Account tab to calculate win/loss statistics **the same way** as the Bet History tab:

### Key Changes in `/src/pages/UserSettings.tsx`:

#### 1. Added `useMemo` for Calculation (Line 2)
```typescript
import React, { useState, useMemo } from "react";
```

#### 2. Added `getHardLedgerBetHistory` to hooks (Line 30)
```typescript
const { currentUser, setCurrentUser, getHardLedgerBetHistory } = useUser();
```

#### 3. Created `betStats` calculation (Lines 42-84)
```typescript
const betStats = useMemo(() => {
  const hardLedgerHistory = getHardLedgerBetHistory();
  let totalWins = 0;
  let totalLosses = 0;
  let totalBets = 0;
  let winAmount = 0;
  let lossAmount = 0;

  // Calculate from actual matched bets
  hardLedgerHistory.forEach(game => {
    const matchedTeamABets = game.bets.teamA.filter(
      bet => bet.userId === currentUser.id && bet.booked
    );
    const matchedTeamBBets = game.bets.teamB.filter(
      bet => bet.userId === currentUser.id && bet.booked
    );
    
    const allUserBets = [...matchedTeamABets, ...matchedTeamBBets];
    
    if (allUserBets.length > 0) {
      // Count result
      const wonOnTeamA = game.winningTeam === 'A' && matchedTeamABets.length > 0;
      const wonOnTeamB = game.winningTeam === 'B' && matchedTeamBBets.length > 0;
      const betAmount = allUserBets.reduce((sum, bet) => sum + bet.amount, 0);

      if (wonOnTeamA || wonOnTeamB) {
        totalWins++;
        winAmount += betAmount;
      } else {
        totalLosses++;
        lossAmount += betAmount;
      }
    }
  });

  return {
    wins: totalWins,
    losses: totalLosses,
    totalBets,
    winRate: totalWins + totalLosses > 0 ? 
      Math.round((totalWins / (totalWins + totalLosses)) * 100) : 0,
    winAmount,
    lossAmount
  };
}, [currentUser.id, getHardLedgerBetHistory()]);
```

#### 4. Updated Account Tab Display (Lines 178-201)
```typescript
<div>
  <h3 className="mb-1">Win/Loss Record</h3>
  <p className="text-xl font-medium">
    <span style={{ color: '#00FF00' }}>{betStats.wins} Wins</span>
    / <span style={{ color: '#FF0000' }}>{betStats.losses} Losses</span>
  </p>
</div>

<div>
  <h3 className="mb-1">Win Rate</h3>
  <p className="text-xl font-medium">{betStats.winRate}%</p>
</div>

<div>
  <h3 className="mb-1">Total Matched Bets</h3>
  <p className="text-xl font-medium">{betStats.totalBets}</p>
</div>

<div>
  <h3 className="mb-1">Win/Loss Amount</h3>
  <p className="text-xl font-medium">
    <span style={{ color: '#00FF00' }}>+{betStats.winAmount}</span>
    / <span style={{ color: '#FF0000' }}>-{betStats.lossAmount}</span>
  </p>
</div>
```

## What's Displayed Now

### Account Tab Shows:
1. **Win/Loss Record** - Exact number of matched wins and losses
   - Color coded: Green for wins, Red for losses
2. **Win Rate** - Percentage of wins (same calculation as Bet History)
3. **Total Matched Bets** - Total number of resolved bets
4. **Win/Loss Amount** - Total coins won and lost

### Bet History Tab Shows:
- Detailed breakdown of each game
- Ability to filter by wins, losses, or all
- Individual game records with amounts and teams

## How Wins/Losses Are Counted

**For each game, a user has ONE record:**
- ✅ Matched bets on both Team A and Team B are counted
- ✅ Only matched bets count (unmatched bets are excluded)
- ✅ User either won or lost the matched bets
- ✅ If user won on ANY matched bet, the game counts as a WIN
- ✅ If user lost on ALL matched bets, the game counts as a LOSS

## Benefits

✅ **Consistent Data**: Both tabs show the same calculations  
✅ **Accurate Count**: Based on actual matched bet records  
✅ **Additional Metrics**: Shows total matched bets and coin amounts  
✅ **Real-time Updates**: Calculations update as new bets are processed  
✅ **Color Coded**: Easy to see wins (green) vs losses (red)  

## Memoization Performance

The `betStats` calculation uses `useMemo` to:
- Avoid recalculation on every render
- Only recalculate when `currentUser.id` changes or `getHardLedgerBetHistory()` returns different data
- Keep the UI responsive

## Files Modified
- `/src/pages/UserSettings.tsx`
  - Lines 2, 30: Added imports
  - Lines 42-84: Added betStats calculation
  - Lines 178-201: Updated Account tab display


