# Bet Receipts Deduplication Fix

## Problem
When bets were processed, the same receipts were being recorded multiple times:
- Each matched bet showed as both a WIN and LOSS for the same user (duplicates)
- Bet receipts would not stay visible after bets were processed

## Root Cause
The system was creating receipts in two places for the same game:

1. **Local receipt creation** (in `addBetHistoryRecord()`):
   - When a game was added locally, receipts were created immediately
   - These were also emitted to the server

2. **Server broadcast receipt creation** (in `handleGameHistoryUpdate()`):
   - The server would broadcast the game back to all clients
   - Clients would receive it and create receipts AGAIN from the same game data

This resulted in **duplicate receipts** for each game.

## Solution
Implemented a **deduplication tracking system** that:

### 1. Added Deduplication Tracker
```typescript
const gamesWithReceiptsCreatedRef = useRef<Set<number>>(new Set());
```
- A Set that tracks which game numbers have already had receipts created
- Prevents the same game from creating receipts twice

### 2. Modified `addBetHistoryRecord()`
- **Before**: Called `addUserBetReceipt()` but this was being duplicated on server broadcast
- **After**: Now creates receipts immediately for local feedback, then marks the game in the deduplication set
- This ensures users see receipts instantly after bets are processed

### 3. Modified `handleGameHistoryUpdate()`
- **Before**: Always created receipts from server game data
- **After**: First checks if the game is already in the deduplication set
- If the game was already processed locally, it skips receipt creation
- This prevents duplicate receipts when the server broadcast arrives

### 4. Updated `resetBetHistory()`
- Clears the deduplication tracker when game history is cleared
- Ensures a fresh state for new games

## How It Works

**For a single matched bet between User A and User B:**

### User A (betting on winning team)
1. Game is added locally → receipt created with `won: true` (marked as processed)
2. Game is broadcast back from server → receipt creation skipped (already processed)
3. Result: **Exactly 1 WIN receipt** (not 2, not both win and loss)

### User B (betting on losing team)
1. Game is added locally → receipt created with `won: false` (marked as processed)
2. Game is broadcast back from server → receipt creation skipped (already processed)
3. Result: **Exactly 1 LOSS receipt** (not 2, not both win and loss)

## Benefits
✅ Receipts appear immediately after bet processing (instant feedback)
✅ No duplicate receipts when server broadcast arrives
✅ Each user sees exactly 1 receipt per matched bet (either win or loss, not both)
✅ Receipts stay visible after bets are processed
✅ Works reliably with server-side deduplication

## Files Modified
- `/src/contexts/UserContext.tsx`
  - Line 78: Added `gamesWithReceiptsCreatedRef` tracker
  - Lines 1029-1086: Updated `addBetHistoryRecord()` with deduplication
  - Lines 346-349: Updated `handleGameHistoryUpdate()` with deduplication check
  - Lines 1050-1051: Updated `resetBetHistory()` to clear tracker

