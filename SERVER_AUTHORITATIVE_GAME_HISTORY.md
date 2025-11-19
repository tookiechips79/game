# Server-Authoritative Game History Implementation

## Overview

Game history has been fully migrated from client-side (localStorage) to a **server-authoritative database model** with real-time Socket.IO synchronization. Games are now:
- ✅ Persisted in PostgreSQL database (permanent)
- ✅ Synchronized across all connected clients in real-time
- ✅ Arena-independent (separate history per betting arena)
- ✅ Backed by localStorage for offline support

---

## Architecture

### Three-Layer Data Model

```
LAYER 1: DATABASE (PostgreSQL)
├── game_history table
├── Indexed by: arena_id, game_number, created_at
└── Source of truth for all games

LAYER 2: SERVER (Socket.IO)
├── API endpoints for CRUD operations
├── Broadcasting events to all clients
├── Arena-specific rooms for filtering
└── Real-time synchronization hub

LAYER 3: CLIENT (React)
├── Local state (React state)
├── Cache layer (localStorage)
├── Socket.IO listeners
└── Real-time updates from server
```

---

## Database Schema

### `game_history` Table

```sql
CREATE TABLE game_history (
  id SERIAL PRIMARY KEY,
  game_id VARCHAR(255) UNIQUE NOT NULL,
  arena_id VARCHAR(50) NOT NULL DEFAULT 'default',
  game_number INTEGER NOT NULL,
  team_a_name VARCHAR(255),
  team_b_name VARCHAR(255),
  team_a_score INTEGER DEFAULT 0,
  team_b_score INTEGER DEFAULT 0,
  winning_team VARCHAR(1),
  team_a_balls INTEGER,
  team_b_balls INTEGER,
  breaking_team VARCHAR(1),
  duration INTEGER,
  total_amount DECIMAL(10, 2),
  bets_data JSONB,  -- Full bet details stored as JSON
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_game_history_arena_id ON game_history(arena_id);
CREATE INDEX idx_game_history_game_number ON game_history(game_number);
CREATE INDEX idx_game_history_created_at ON game_history(created_at);
```

---

## API Endpoints

### `GET /api/games/history/:arenaId?limit=100`

Fetch game history for a specific arena.

**Response:**
```json
{
  "arenaId": "default",
  "count": 25,
  "games": [
    {
      "id": 142,
      "game_id": "game-1700000000000-abc123",
      "arena_id": "default",
      "game_number": 42,
      "team_a_name": "Team A",
      "team_b_name": "Team B",
      "team_a_score": 1,
      "team_b_score": 0,
      "winning_team": "A",
      "total_amount": 500,
      "bets_data": {...},
      "created_at": "2024-11-19T10:30:00Z"
    }
    // ... more games
  ]
}
```

### `POST /api/games/history`

Add a new game to history.

**Request:**
```json
{
  "gameNumber": 42,
  "teamAName": "Team A",
  "teamBName": "Team B",
  "teamAScore": 1,
  "teamBScore": 0,
  "winningTeam": "A",
  "teamABalls": 5,
  "teamBBalls": 9,
  "breakingTeam": "A",
  "duration": 1200,
  "totalAmount": 500,
  "bets": {...},
  "arenaId": "default"
}
```

**Response:**
```json
{
  "success": true,
  "gameId": "game-1700000000000-abc123",
  "arenaId": "default",
  "gameNumber": 42,
  "message": "Game history saved successfully"
}
```

### `DELETE /api/games/history/:arenaId`

Clear all game history for an arena.

**Response:**
```json
{
  "success": true,
  "arenaId": "default",
  "deletedCount": 25,
  "message": "Cleared 25 games from arena 'default'"
}
```

---

## Socket.IO Events

### Client → Server

#### `request-game-history`
Request complete game history from server.

```typescript
socketIOService.emitRequestGameHistory(arenaId);
```

#### `new-game-added`
Send a new game record to be saved and broadcast.

```typescript
socketIOService.emitNewGameAdded(gameHistoryRecord);
```

#### `clear-game-history`
Request to clear all game history for an arena.

```typescript
socketIOService.emitClearGameHistory(arenaId);
```

---

### Server → Client

#### `game-history-update`
Send array of games to client (on request or arena join).

```typescript
// Received as:
{
  arenaId: "default",
  games: [/* array of game records */],
  timestamp: 1700000000000
}
```

Listener:
```typescript
socketIOService.onGameHistoryUpdate((data) => {
  // Update local history with data.games
});
```

#### `game-added`
Real-time broadcast when a new game is added (received by ALL clients).

```typescript
// Received as:
{
  arenaId: "default",
  game: {/* new game record */},
  timestamp: 1700000000000
}
```

Listener:
```typescript
socketIOService.onGameAdded((data) => {
  // Add new game to local history
});
```

#### `game-history-cleared`
Real-time broadcast when history is cleared (received by ALL clients).

```typescript
// Received as:
{
  arenaId: "default",
  deletedCount: 25,
  timestamp: 1700000000000
}
```

Listener:
```typescript
socketIOService.onGameHistoryCleared((data) => {
  // Clear local history
});
```

#### `game-history-error`
Error response from server.

```typescript
{
  error: "Failed to save game history"
}
```

---

## Client Implementation

### Data Flow

```
Game Ends
    ↓
addBetHistoryRecord() called
    ↓
├─ Save to localStorage (local cache)
├─ Update React state
│  ├─ setImmutableBetHistory([...])
│  └─ Triggers useEffect to save to localStorage
│
└─ Send to server
   └─ emitNewGameAdded(gameHistoryRecord)
       └─ Server saves to PostgreSQL
           └─ Server broadcasts 'game-added' to ALL clients
               ├─ Client 1 receives 'game-added'
               ├─ Client 2 receives 'game-added'
               └─ Client N receives 'game-added'
                   └─ All update local history
                       └─ Real-time sync complete! ✅
```

### Key Methods in `UserContext`

#### `addBetHistoryRecord(record)`
```typescript
// Saves game to localStorage and sends to server
// Server broadcasts to all clients
// All clients update in real-time
```

#### `resetBetHistory()`
```typescript
// Clears both localStorage and server database
// Broadcasts clear to all clients
// All clients clear their history
```

### Listeners in `UserContext`

```typescript
// Receive array of games from server (on arena join)
socketIOService.onGameHistoryUpdate((data) => {
  // Load complete game history
});

// Receive individual games as they're added (real-time)
socketIOService.onGameAdded((data) => {
  // Add new game to local history
});

// Receive clear command (real-time)
socketIOService.onGameHistoryCleared((data) => {
  // Clear local history
});
```

---

## Arena Independence

Each arena maintains completely independent game history:

```
Arena: "default" (1-Pocket)
├── Game History Table
└── Stores all 1-pocket games

Arena: "nine_ball"
├── Game History Table
└── Stores all 9-ball games

Arena: "custom"
├── Game History Table
└── Stores all custom arena games
```

**Key Guarantee:**
- Games from arena A do NOT appear in arena B's history
- Clearing arena A history does NOT affect arena B
- Each client only sees history for their current arena

---

## Testing

### Test 1: Add Game on One Browser, See on Another

```
Browser 1: End a game (game added to DB, broadcasts game-added)
Browser 2: Game appears instantly in history ✅
Browser 3: Game appears instantly in history ✅
```

### Test 2: Clear History, Sync Across All

```
Browser 1: Click "Clear History" (emitClearGameHistory)
Server: Deletes from DB, broadcasts game-history-cleared
Browser 1: History cleared ✅
Browser 2: History cleared ✅
Browser 3: History cleared ✅
```

### Test 3: Arena Independence

```
Browser 1: Switch to Arena A (receives history for A)
Browser 1: Add game to Arena A
Browser 1: Switch to Arena B (receives history for B)
        → Arena B history unchanged ✅
Browser 1: Switch back to Arena A (receives updated history with new game) ✅
```

### Test 4: Persistence

```
Browser 1: Add 5 games to Arena A
Browser 1: Close and reopen browser
         → Games restored from localStorage + server ✅
Server: Restart server
Browser 1: Refresh page
         → Games restored from PostgreSQL ✅
```

---

## Advantages

| Feature | Before (localStorage) | After (Server-Authoritative) |
|---------|-----------------|--------------------------|
| **Persistence** | Lost on browser clear | ✅ Permanent in PostgreSQL |
| **Cross-Browser Sync** | Manual P2P via Socket.IO | ✅ Real-time via server |
| **Cross-Device** | No sync | ✅ Full sync across devices |
| **Offline** | Limited (localStorage) | ✅ localStorage + server |
| **Scalability** | Single browser | ✅ Multiple browsers/devices |
| **Data Integrity** | Risk of loss | ✅ ACID guarantees |
| **Server Authority** | Client-side | ✅ Single source of truth |
| **Clear Operations** | Only on local machine | ✅ Broadcasts to all |

---

## Migration Path

Game history is now **dual-write** for backward compatibility:

1. **Write to localStorage** (for offline support)
2. **Write to server** (for persistence)
3. **Receive from server** (on startup, on arena join)
4. **Broadcast to all clients** (real-time updates)

This ensures:
- ✅ Offline functionality
- ✅ Fast local access
- ✅ Real-time sync
- ✅ Permanent persistence

---

## Future Enhancements

1. **Pagination**: Load games in batches (50 at a time)
2. **Filtering**: By date, team, arena, user
3. **Compression**: Archive old games (>30 days)
4. **Analytics**: Game statistics, win rates, trends
5. **Export**: CSV/PDF reports of game history
6. **Replay**: Store detailed move-by-move data

---

## Troubleshooting

### Issue: Games not syncing across browsers

**Check:**
1. Server is running (`npm run server`)
2. Socket.IO connected (check browser console)
3. Arena IDs match (both browsers same arena)
4. Check server logs for `[GAME-HISTORY]` messages

### Issue: Games disappearing after refresh

**Check:**
1. PostgreSQL is running (if DATABASE_URL set)
2. localStorage not being cleared (check localStorage in DevTools)
3. Server game-history-update event is firing (check console)

### Issue: Clear not working on all clients

**Check:**
1. All clients in same arena room (`arena:default`)
2. Socket.IO broadcast working (check server logs)
3. `onGameHistoryCleared` listener is registered

---

## Code References

- **Database**: `src/db/database.js`
- **Server API**: `server.js` (lines 805-876)
- **Socket.IO Events**: `server.js` (lines 1407-1470)
- **Client Integration**: `src/contexts/UserContext.tsx`
- **Socket Service**: `src/services/socketIOService.ts` (lines 626-741)

---

## Summary

Game history is now fully **server-authoritative** with:
- ✅ PostgreSQL persistence
- ✅ Real-time Socket.IO sync
- ✅ Cross-browser/device support
- ✅ Arena independence
- ✅ Offline localStorage backup
- ✅ Broadcast to all connected clients

**Result:** Complete game history synchronization across all devices with permanent database storage.

