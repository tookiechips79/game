# 💰 Credit System Testing Guide

## Quick Start

### 1. Start the Servers
```bash
cd /Users/randallpaguio/Desktop/MAIN!!!!!!!!
npm run dev        # Frontend on :5173
npm run server     # Backend on :3001 (in another terminal)
```

### 2. Access the Application
```
Frontend: http://localhost:5173
Audit Dashboard: http://localhost:5173/#/credit-audit
API: http://localhost:3001
```

## Testing Scenarios

### Scenario 1: Check User Balance
**Test:** Retrieve balance for a user

```bash
# Get balance
curl http://localhost:3001/api/credits/user123

# Expected Response:
{
  "userId": "user123",
  "balance": 1000
}
```

### Scenario 2: View Transaction History
**Test:** View all transactions for a user

```bash
# Get history
curl http://localhost:3001/api/credits/user123/history

# Expected Response:
{
  "userId": "user123",
  "transactions": [
    {
      "type": "admin_add",
      "amount": 1000,
      "oldBalance": 0,
      "newBalance": 1000,
      "timestamp": 1700000000000,
      "reason": "Initial account balance",
      "adminNotes": "System initialization"
    }
  ]
}
```

### Scenario 3: Place a Bet (Deduct Credits)
**Test:** Deduct credits for bet placement

```bash
# Place bet for 100 coins
curl -X POST http://localhost:3001/api/credits/user123/bet \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "betDetails": "Test bet on Team A"
  }'

# Expected Response:
{
  "success": true,
  "transaction": {
    "type": "bet_placed",
    "amount": -100,
    "oldBalance": 1000,
    "newBalance": 900,
    "timestamp": 1700000005000,
    "reason": "Test bet on Team A"
  },
  "newBalance": 900
}

# Verify in history:
curl http://localhost:3001/api/credits/user123/history
# Should show 2 transactions: initial 1000, then bet -100
```

### Scenario 4: Insufficient Funds
**Test:** Try to place bet with insufficient balance

```bash
# Try to place bet for 1000 coins (only have 900)
curl -X POST http://localhost:3001/api/credits/user123/bet \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "betDetails": "Over-bet test"
  }'

# Expected Response (400 error):
{
  "error": "Insufficient credits"
}

# Balance should still be 900
curl http://localhost:3001/api/credits/user123
# { "userId": "user123", "balance": 900 }
```

### Scenario 5: Refund Bet
**Test:** Return credits via bet refund

```bash
# Refund 100 coins
curl -X POST http://localhost:3001/api/credits/user123/refund \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "reason": "Bad pool shot - refund player"
  }'

# Expected Response:
{
  "success": true,
  "transaction": {
    "type": "bet_refund",
    "amount": 100,
    "oldBalance": 900,
    "newBalance": 1000,
    "timestamp": 1700000010000,
    "reason": "Bad pool shot - refund player"
  },
  "newBalance": 1000
}

# Balance back to 1000
curl http://localhost:3001/api/credits/user123
# { "userId": "user123", "balance": 1000 }
```

### Scenario 6: Add Credits (Admin)
**Test:** Admin manually adds credits

```bash
# Admin adds 500 coins
curl -X POST http://localhost:3001/api/credits/user123/add \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "reason": "admin_add",
    "adminNotes": "Weekly bonus for top player"
  }'

# Expected Response:
{
  "success": true,
  "transaction": {
    "type": "admin_add",
    "amount": 500,
    "oldBalance": 1000,
    "newBalance": 1500,
    "timestamp": 1700000015000,
    "reason": "admin_add",
    "adminNotes": "Weekly bonus for top player"
  },
  "newBalance": 1500
}
```

### Scenario 7: Process Cashout
**Test:** User cashes out coins

```bash
# Cashout 300 coins
curl -X POST http://localhost:3001/api/credits/user123/cashout \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 300
  }'

# Expected Response:
{
  "success": true,
  "transaction": {
    "type": "cashout",
    "amount": -300,
    "oldBalance": 1500,
    "newBalance": 1200,
    "timestamp": 1700000020000,
    "reason": "User cashout"
  },
  "newBalance": 1200
}

# Balance reduced
curl http://localhost:3001/api/credits/user123
# { "userId": "user123", "balance": 1200 }
```

### Scenario 8: View Audit Report
**Test:** Generate and view audit report

In UI: `http://localhost:5173/#/credit-audit`

1. Enter user ID: `user123`
2. Click "View Audit"
3. Verify:
   - Current Balance: 1200
   - Expected Balance: 1200 (based on all transactions)
   - Balance Accurate: ✅ Yes
   - Total Income: 2500 (1000 initial + 500 admin + 1000 refund)
   - Total Outcome: 400 (100 bet + 300 cashout)
   - Calculation: 2500 - 400 = 2100... wait that's wrong
   
Let me recalculate:
- Initial: +1000
- Bet placed: -100 
- Refund: +100
- Admin add: +500
- Cashout: -300
- Total: 1000 - 100 + 100 + 500 - 300 = 1200 ✅

Income: 1000 + 100 + 500 = 1600
Outcome: 100 + 300 = 400
Net: 1600 - 400 = 1200 ✅

## Audit Dashboard Testing

### Test 1: Balance Validation
**Steps:**
1. Go to `http://localhost:5173/#/credit-audit`
2. Enter: `user123`
3. Click: "View Audit"

**Expected:**
- ✅ Balance Accurate
- Current Balance = Expected Balance
- Discrepancy = 0

### Test 2: Transaction Chain Integrity
**Verify:** Every transaction links correctly

**In audit report:**
- Show all transactions in order
- Each transaction shows: type, amount, oldBalance, newBalance
- newBalance of transaction N = oldBalance of transaction N+1
- All balances >= 0

### Test 3: Cash Flow Categories
**Expected breakdown:**
- Reload Coins: 0 (user hasn't reloaded)
- Admin Added: 1 (500 coins)
- Bets Placed: 1 (100 coins)
- Bets Won: 0 (no wins yet)
- Bets Refunded: 1 (100 coins)
- Cashouts: 1 (300 coins)

### Test 4: Suspicious Activity Detection
**Current test user:** No suspicious activity
- No negative balances ✓
- No large transactions > 10000 ✓
- No calculation mismatches ✓

## Client-Side Integration Testing

### Test 1: Place Bet via UI
**Steps:**
1. Open app: `http://localhost:5173`
2. Place bet (varies by page)
3. Check:
   - Balance decreases
   - Transaction appears in history
   - Server call successful (check Network tab)

### Test 2: Multi-Device Sync
**Steps:**
1. Open `http://localhost:5173` in Browser A
2. Open `http://localhost:5173` in Browser B
3. Place bet in Browser A
4. Refresh Browser B
5. **Expected:** Browser B shows updated balance

**Why it works:**
- Both browsers fetch balance from same server
- Server is source of truth
- No local caching

### Test 3: Error Handling
**Steps:**
1. Manually set balance to 50 in Database (TODO when DB added)
2. Try to place bet for 100
3. **Expected:**
   - Error toast shown
   - Balance not deducted
   - Server rejects operation

## Performance Testing

### Test 1: Multiple Transactions
**Test:**
```bash
# Place 10 bets in succession
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/credits/user123/bet \
    -H "Content-Type: application/json" \
    -d "{ \"amount\": 10, \"betDetails\": \"Bet $i\" }"
  sleep 0.1
done
```

**Expected:**
- All 10 succeed
- Balance: 1200 - 100 = 1100
- All 10 transactions logged

### Test 2: Concurrent Operations
**Test:**
```bash
# Send 5 requests simultaneously (background)
for i in {1..5}; do
  curl -X POST http://localhost:3001/api/credits/user123/bet \
    -H "Content-Type: application/json" \
    -d "{ \"amount\": 5 }" &
done
wait

# Check final balance
curl http://localhost:3001/api/credits/user123
```

**Expected:**
- All 5 succeed (if balance sufficient)
- No race conditions
- Balance accurate: 1200 - 25 = 1175

## Verification Checklist

After implementing credit system:

- [ ] `POST /api/credits/:userId/add` works
- [ ] `POST /api/credits/:userId/bet` works
- [ ] `POST /api/credits/:userId/refund` works
- [ ] `POST /api/credits/:userId/cashout` works
- [ ] `GET /api/credits/:userId` returns accurate balance
- [ ] `GET /api/credits/:userId/history` shows all transactions
- [ ] Negative balance rejected
- [ ] Insufficient funds rejected
- [ ] Audit dashboard loads
- [ ] Audit report accurate
- [ ] Transaction chain valid
- [ ] Client integrations working
- [ ] Multi-device sync working
- [ ] Error handling correct
- [ ] Performance acceptable

## Common Issues & Fixes

### Issue: "Cannot GET /api/credits/..."
**Fix:**
- Check server running: `curl http://localhost:3001/health`
- Check route exists in `server.js`
- Restart server if needed

### Issue: CORS errors
**Fix:**
- Check CORS config in `server.js` (should allow all for dev)
- Restart server
- Check browser console for specific error

### Issue: Balance not updating
**Fix:**
- Check network request succeeded (Network tab)
- Check response contains `newBalance`
- Check client code calls `setUsers()`
- Refresh page

### Issue: Audit report says "Discrepancy"
**Fix:**
- This should never happen in normal operation
- Check server logs for errors
- Verify all transactions in history
- Contact developer

## Summary

✅ Credit system is fully tested when:
1. All API endpoints respond correctly
2. Balances are accurate across all operations
3. Audit dashboard validates all transactions
4. Transaction chains are unbroken
5. No negative balances possible
6. Insufficient funds properly rejected
7. Multi-device sync works
8. Error handling is correct
9. Performance is acceptable
10. All client integrations working

