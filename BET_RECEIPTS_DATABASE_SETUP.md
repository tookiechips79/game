# Bet Receipts Database & Socket.IO Integration

## Overview
This document describes the implementation of server-side bet receipts persistence using PostgreSQL and real-time synchronization via Socket.IO, mirroring the game history system.

## Architecture

### 1. Database Layer (`src/db/database.js`)

#### New Table: `bet_receipts`
```sql
CREATE TABLE IF NOT EXISTS bet_receipts (
  id SERIAL PRIMARY KEY,
  receipt_id VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  arena_id VARCHAR(50) NOT NULL DEFAULT 'default',
  game_number INTEGER NOT NULL,
  team_side VARCHAR(1) NOT NULL,
  team_name VARCHAR(255),
  opponent_name VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  won BOOLEAN DEFAULT FALSE,
  transaction_type VARCHAR(50) DEFAULT 'bet',
  user_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### New Functions Exported:
- **`addBetReceipt(receiptData)`** - Saves a single bet receipt to the database
  - Automatically detects PostgreSQL vs stub mode
  - Returns the saved receipt record
  
- **`getBetReceipts(userId, arenaId, limit)`** - Retrieves receipts for a specific user
  - Defaults to 'default' arena
  - Limits results to 250 by default
  
- **`getArenaAllBetReceipts(arenaId, limit)`** - Retrieves all receipts for an arena
  - Used for displaying all bets in an arena (optional feature)
  
- **`clearUserBetReceipts(userId)`** - Deletes all receipts for a user
  - Supports both PostgreSQL and stub mode

### 2. Server Layer (`server.js`)

#### New Imports
```javascript
import {
  addBetReceipt,
  getBetReceipts,
  getArenaAllBetReceipts,
  clearUserBetReceipts,
} from './src/db/database.js';
```

#### Enhanced Bet Receipts Socket Handler
The existing `bet-receipts-update` handler now:
- Saves each receipt to the database before broadcasting
- Validates receipt data
- Logs success/failure

#### New Socket.IO Events

**Request Events:**
- `request-bet-receipts` - Client requests user's receipts
  - Payload: `{ userId, arenaId }`
  - Response: `bet-receipts-data` event with receipts array

- `request-arena-bet-receipts` - Client requests all arena receipts
  - Payload: `{ arenaId }`
  - Response: `arena-bet-receipts-data` event

- `clear-user-bet-receipts` - Client requests to clear receipts
  - Payload: `{ userId, arenaId }`
  - Broadcast: `bet-receipts-cleared` event

**Response Events:**
- `bet-receipts-data` - Server sends user's receipts
- `arena-bet-receipts-data` - Server sends arena receipts
- `bet-receipts-cleared` - Server notifies of cleared receipts
- `bet-receipts-error` - Error occurred during operation

#### New REST API Endpoints

**GET `/api/bet-receipts/:userId`**
- Query params: `?arenaId=default&limit=250`
- Returns: `{ userId, arenaId, betReceipts, count }`

**GET `/api/bet-receipts-arena/:arenaId`**
- Query params: `?limit=250`
- Returns: `{ arenaId, betReceipts, count }`

**POST `/api/bet-receipts`**
- Body: Receipt object (same structure as client)
- Returns: `{ success, receipt }` or `{ success, message }` if duplicate

**POST `/api/bet-receipts/:userId/clear`**
- Returns: `{ success, userId, deletedCount }`

### 3. Socket Service (`src/services/socketIOService.ts`)

#### New Methods

**Request Methods:**
- `requestBetReceipts(userId, arenaId?)` - Request user's receipts from server
- `requestArenaBetReceipts(arenaId?)` - Request all arena receipts
- `clearUserBetReceipts(userId, arenaId?)` - Request to clear user's receipts

**Listener Methods:**
- `onBetReceiptsData(callback)` - Listen for user receipts data
- `onArenaBetReceiptsData(callback)` - Listen for arena receipts
- `onBetReceiptsCleared(callback)` - Listen for clear event
- `onBetReceiptsError(callback)` - Listen for errors

**Cleanup Methods:**
- `offBetReceiptsData()`
- `offArenaBetReceiptsData()`
- `offBetReceiptsCleared()`
- `offBetReceiptsError()`

### 4. Frontend Context (`src/contexts/UserContext.tsx`)

#### New Listeners Setup
Added in the main Socket.IO setup useEffect:
- `socketIOService.onBetReceiptsData()` - Handles receipts from server
- `socketIOService.onArenaBetReceiptsData()` - Handles arena receipts
- `socketIOService.onBetReceiptsCleared()` - Handles clear confirmations
- `socketIOService.onBetReceiptsError()` - Handles errors

#### User Change Effect
Added automatic bet receipts request when `currentUser` changes:
```javascript
if (socketIOService.isSocketConnected()) {
  socketIOService.requestBetReceipts(currentUser.id);
}
```

#### Listener Cleanup
Updated cleanup function to remove all new listeners

## Data Flow

### Creating a Bet Receipt
1. **Client** calls `addUserBetReceipt(receipt)`
2. **Client** emits `bet-receipts-update` with receipt array
3. **Server** receives event and saves each receipt to database
4. **Server** broadcasts updated receipts to all clients in the arena
5. **All Clients** receive the broadcast and update their state

### Loading Bet Receipts
1. **Client** connects or user changes
2. **Client** calls `requestBetReceipts(userId)`
3. **Server** queries database for user's receipts
4. **Server** emits `bet-receipts-data` with receipts
5. **Client** receives and updates state with server data

### Clearing Receipts
1. **Client** calls `clearUserBetReceipts(userId)`
2. **Server** deletes from database
3. **Server** broadcasts `bet-receipts-cleared` event
4. **All Clients** clear their local receipts state

## Database Stub Mode
When `DATABASE_URL` is not set, all functions fall back to in-memory storage:
- `inMemoryBetReceipts` array stores receipts
- Data persists only during server runtime
- On server restart, in-memory data is lost

## Usage Example

### On Component Mount (Frontend)
```javascript
useEffect(() => {
  if (currentUser) {
    socketIOService.requestBetReceipts(currentUser.id);
  }
}, [currentUser]);

// Listen for receipts
socketIOService.onBetReceiptsData((data) => {
  console.log(`Received ${data.betReceipts.length} receipts`);
  setUserBetReceipts(data.betReceipts);
});
```

### Adding a Receipt
```javascript
const newReceipt = {
  id: `receipt-${Date.now()}`,
  userId: currentUser.id,
  gameNumber: 42,
  teamSide: 'A',
  teamName: 'Team A',
  opponentName: 'Team B',
  amount: 100,
  won: true,
  userName: currentUser.name
};

addUserBetReceipt(newReceipt);
// Automatically synced to database and other clients
```

## Security Considerations

1. **Validation**: Server validates receipt data before saving
2. **User Isolation**: Receipts filtered by `user_id` in queries
3. **Arena Independence**: Each arena maintains separate receipt data
4. **Duplicate Prevention**: `receipt_id` is unique to prevent double-saves

## Performance Optimizations

1. **Pagination**: Receipts limited to 250 per request (configurable)
2. **Indexing**: Database indexes on `user_id`, `arena_id`, `created_at`
3. **Batch Operations**: Multiple receipts can be saved in one request
4. **Connection Pooling**: PostgreSQL uses connection pooling for efficiency

## Testing

To test the bet receipts system:

### API Testing
```bash
# Get user's receipts
curl http://localhost:3001/api/bet-receipts/admin-1234

# Get all arena receipts
curl http://localhost:3001/api/bet-receipts-arena/default

# Add a receipt
curl -X POST http://localhost:3001/api/bet-receipts \
  -H "Content-Type: application/json" \
  -d '{
    "id": "receipt-123",
    "userId": "admin-1234",
    "gameNumber": 42,
    "teamSide": "A",
    "teamName": "Team A",
    "opponentName": "Team B",
    "amount": 100,
    "won": true,
    "userName": "Admin"
  }'

# Clear user's receipts
curl -X POST http://localhost:3001/api/bet-receipts/admin-1234/clear
```

### Socket.IO Testing
1. Open browser console
2. Connect two browser instances
3. In browser 1: Add a bet
4. Check both browsers see the receipt immediately
5. Refresh one browser - receipt should reload from database

## Future Enhancements

1. **Pagination API**: Implement offset/limit for large receipt sets
2. **Filtering**: Filter receipts by date range, game number, team, etc.
3. **Export**: Download receipts as CSV/PDF
4. **Analytics**: Calculate statistics (win rate, total bets, etc.)
5. **Archive**: Move old receipts to archive table for performance

