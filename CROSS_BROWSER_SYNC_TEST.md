# ✅ Cross-Browser Credit Sync - Testing Guide

## What Was Fixed

**Problem:** Credit balances weren't syncing across browsers
- Browser A places bet → Balance updates in A only
- Browser B doesn't see the change
- Refreshing B shows correct balance (from server)

**Solution:** Implemented real-time cross-browser sync
- Server broadcasts credit updates to all clients
- Clients listen for real-time updates
- Fallback: Sync every 5 seconds

## Testing Procedure

### Test 1: Real-Time Sync (Instant)

**Setup:**
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev

# Browser 1: http://localhost:5173
# Browser 2: http://localhost:5173 (same or different computer)
```

**Steps:**
1. Open app in Browser A, login as user
2. Open app in Browser B, login as **same user**
3. Note balance in both: Should be **same value**
4. In Browser A: Place a bet for 100 coins
5. Watch Browser B: Balance should update **instantly** (< 1 second)

**Expected:**
- ✅ Balance decreases in A immediately
- ✅ Balance decreases in B immediately (no refresh needed)
- ✅ Both show same value
- ✅ Toast appears in B: "Balance Updated"

**Console Output (Browser B):**
```
📡 [CREDITS] Fetching server balance for user: user123
✅ [CREDITS] Server balance: 900, Local balance: 900
💰 [CREDITS-SYNC] Received real-time credit update for user123: 900
✅ [CREDITS-SYNC] Updated from socket: 900 → 900
```

### Test 2: Fallback Sync (Every 5 seconds)

**Purpose:** Verify fallback sync when Socket.IO doesn't work

**Steps:**
1. Open Browser A and Browser B (same user)
2. Manually change server balance (via API):
   ```bash
   curl -X POST http://localhost:3001/api/credits/user123/add \
     -H "Content-Type: application/json" \
     -d '{"amount": 500}'
   ```
3. Wait 5 seconds
4. Watch Browser B: Balance should update

**Expected:**
- ✅ Browser B balance updates after ~5 seconds
- ✅ No refresh needed
- ✅ Auto-sync working

### Test 3: Multiple Operations

**Steps:**
1. Browser A and B open with same user
2. Place multiple bets rapidly in A
   - Bet 100, Bet 50, Bet 25
3. Watch B: All updates appear

**Expected:**
- ✅ Each bet reflected in B instantly
- ✅ Final balance correct
- ✅ No missed updates

### Test 4: Page Refresh

**Steps:**
1. Place bet in Browser A (balance: 900)
2. Refresh Browser B
3. Check balance displayed

**Expected:**
- ✅ Server balance fetched on load
- ✅ Displays correct balance (900)
- ✅ No stale data from localStorage

### Test 5: Multi-Device Sync

**Setup:**
- Computer: http://localhost:5173 (Browser A)
- Mobile (same network): http://192.168.x.x:5173 (Browser B)
- Both logged in as same user

**Steps:**
1. Place bet on Computer
2. Watch Mobile: Balance updates
3. Place bet on Mobile
4. Watch Computer: Balance updates

**Expected:**
- ✅ Both devices stay in sync
- ✅ Real-time updates across network
- ✅ All Socket.IO events working

### Test 6: Admin Operations

**Setup:**
- Browser A: Regular user
- Browser B: Admin or separate admin client

**Steps:**
1. Admin adds credits via API/dashboard
2. User's Browser A shows update instantly

**Steps:**
```bash
# Add credits as admin
curl -X POST http://localhost:3001/api/credits/user123/add \
  -H "Content-Type: application/json" \
  -d '{"amount": 500, "reason": "admin_add"}'
```

**Expected in Browser A:**
- ✅ Balance updates immediately (via Socket.IO)
- ✅ Toast: "Balance Updated: 1500 coins"

### Test 7: Error Handling

**Steps:**
1. Stop server while browsers are open
2. Try to place bet
3. Start server again

**Expected:**
- ✅ Bet fails with error message
- ✅ Balance doesn't change
- ✅ No false positives when server comes back

## Console Logs to Check

### On Mount (Browser loads)
```
📡 [CREDITS] Fetching server balance for user: user123
✅ [CREDITS] Server balance: 1000, Local balance: 1000
✅ [CREDITS] Balances match! Current user is in sync
```

### On Real-Time Update (Another browser places bet)
```
💰 [CREDITS-SYNC] Received real-time credit update for user123: 900
✅ [CREDITS-SYNC] Updated from socket: 1000 → 900
```

### On Fallback Sync (Every 5 seconds)
```
📡 [CREDITS] Fetching server balance for user: user123
✅ [CREDITS] Server balance: 900, Local balance: 900
✅ [CREDITS] Balances match! Current user is in sync
```

## Server Logs to Check

### When Transaction Occurs
```
💰 [CREDITS] user123: bet_placed | Amount: -100 | New Balance: 900
📡 [CREDITS-BROADCAST] Emitted credit-update for user123: 900
```

## Verification Checklist

- [ ] Balance is same across browsers on load
- [ ] Real-time update works (< 1 second)
- [ ] Fallback sync works (5 second check)
- [ ] Refresh shows correct balance
- [ ] Multiple operations sync correctly
- [ ] Mobile and desktop stay in sync
- [ ] Admin operations sync correctly
- [ ] Error handling works
- [ ] Console logs show operations
- [ ] Toast notifications appear
- [ ] UI updates smoothly

## Quick Test Script

```bash
# Terminal 1: Start backend
npm run server

# Terminal 2: Start frontend
npm run dev

# Terminal 3: Test API calls
# Window 1: http://localhost:5173 (Browser A)
# Window 2: http://localhost:5173 (Browser B)

# Place a bet in Browser A via UI
# Check if Browser B balance updates instantly

# Or test via API:
curl -X POST http://localhost:3001/api/credits/user123/bet \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'

# Monitor both browser consoles for sync logs
```

## What to Look For

### Good Signs ✅
- Balance same across all browsers
- Updates appear instantly
- No page refresh needed
- Console shows sync operations
- Toast notifications appear
- UI updates smoothly

### Bad Signs ❌
- Balance differs between browsers
- Requires refresh to see update
- No console logs
- Toast doesn't appear
- UI doesn't update
- Logs show errors

## Debugging

### If sync not working:

1. **Check console logs:**
   ```
   🔍 Look for: 
   - [CREDITS] messages
   - [CREDITS-SYNC] messages
   - [CREDITS-BROADCAST] messages
   ```

2. **Check Network tab:**
   ```
   - Look for credit-update Socket.IO events
   - Check /api/credits requests
   - Verify no CORS errors
   ```

3. **Check server logs:**
   ```
   - Look for [CREDITS] messages
   - Look for [CREDITS-BROADCAST] messages
   - Check for errors
   ```

4. **Restart if needed:**
   ```
   npm run server  # Restart backend
   npm run dev     # Restart frontend
   ```

## Success Criteria

✅ System passes all 7 tests
✅ All console logs show expected output
✅ No errors in console
✅ Balances stay synchronized
✅ Real-time updates < 1 second
✅ Fallback sync every 5 seconds
✅ Cross-device sync working
✅ Multiple browsers stay in sync

---

**Status:** Ready for testing

**Related:** Cross-browser credit sync implementation
**Commit:** FIX: Implement real-time credit balance sync across browsers

