# Timer Implementation Reference

**Status**: ✅ Working Correctly - Last Verified: November 2, 2025

## Overview
This document describes the current working timer implementation that persists across browser closures, resets only when games are won, and maintains accuracy across arena-isolated sessions.

## Key Features
- ✅ **Persistent**: Timer continues running even when browser closes/reconnects
- ✅ **Accurate**: Server-authoritative timing using continuous elapsed time calculation
- ✅ **Auto-Reset on Game Win**: Timer automatically resets to 0 when a new game starts
- ✅ **Arena-Isolated**: Each arena (Rotation Arena / One Pocket Arena) has independent timers
- ✅ **No Manual Reset**: Timer only resets when admin clicks "Win Game" button (triggers game win detection)

## Server-Side Implementation (`server.js`)

### Timer State Structure
```javascript
let arenaTimers = {
  'default': {
    interval: null,
    startTime: null,
    accumulatedTime: 0,
    isRunning: false,
    continuousStartTime: null  // CRITICAL: Never cleared except on explicit reset
  },
  'one_pocket': {
    interval: null,
    startTime: null,
    accumulatedTime: 0,
    isRunning: false,
    continuousStartTime: null
  }
};
```

### Key Server Functions

#### `startServerTimer(arenaId)`
- Sets `continuousStartTime` to `Date.now()`
- Sets `isRunning = true`
- Starts interval to broadcast timer updates

#### `stopServerTimer(arenaId)`
- Clears interval WITHOUT resetting timer
- Sets `isRunning = false`
- Preserves `continuousStartTime` for resume capability

#### `resetServerTimer(arenaId)`
- **ONLY called when game is won** (detected via `currentGameNumber` increase)
- Resets `continuousStartTime = null`
- Resets `accumulatedTime = 0`
- Resets `isTimerRunning = false`
- **Emits timer-update to clients** with `timerSeconds: 0`

### Game Win Detection
```javascript
socket.on('game-state-update', (gameStateData) => {
  const { arenaId = 'default', ...actualGameState } = gameStateData;
  const arenaState = getGameState(arenaId);
  
  // Detect if a game was won (currentGameNumber increased)
  const gameWonDetected = actualGameState.currentGameNumber && 
                         actualGameState.currentGameNumber > arenaState.currentGameNumber;
  
  Object.assign(arenaState, actualGameState);
  
  // If a game was won, reset the timer
  if (gameWonDetected) {
    console.log(`🏆 [GAME WON] Game ${actualGameState.currentGameNumber} started - resetting timer for arena '${arenaId}'`);
    resetServerTimer(arenaId);
  }
});
```

### Initial Timer Emission (`set-arena` handler)
```javascript
socket.on('set-arena', (data) => {
  const currentArenaId = data.arenaId || 'default';
  const timer = getArenaTimer(currentArenaId);
  
  // Calculate elapsed time from continuousStartTime
  const currentElapsed = timer.continuousStartTime 
    ? Math.floor((Date.now() - timer.continuousStartTime) / 1000)
    : 0;
  
  socket.emit('timer-update', {
    isTimerRunning: timer.isRunning,
    timerSeconds: currentElapsed,
    serverStartTime: timer.startTime,
    accumulatedTime: currentElapsed,
    arenaId: currentArenaId
  });
});
```

## Client-Side Implementation (`GameStateContext.tsx`)

### Timer Update Effect
```javascript
useEffect(() => {
  let rafId: number | null = null;
  let lastSecond: number = -1;
  
  // Only run if timer is running
  if (getCurrentGameState().isTimerRunning) {
    const startTime = Date.now();
    const startSeconds = getCurrentGameState().timerSeconds;
    
    const updateTimer = () => {
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - startTime) / 1000);
      const newSeconds = startSeconds + elapsed;
      
      // Only update state when second changes (reduces re-renders)
      if (newSeconds !== lastSecond) {
        lastSecond = newSeconds;
        setCurrentGameState(prev => ({
          ...prev,
          timerSeconds: newSeconds
        }));
      }
      
      rafId = requestAnimationFrame(updateTimer);
    };
    
    rafId = requestAnimationFrame(updateTimer);
  } else {
    lastSecond = -1;
  }
  
  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  };
}, [getCurrentGameState().isTimerRunning, getCurrentGameState().timerSeconds]);
```

### Socket Listener for Timer Updates
```javascript
socketIOService.onTimerUpdate((timerData: TimerSyncData) => {
  validateArenaAndUpdate(timerData.arenaId, () => {
    console.log('📥 Received timer update from server:', timerData);
    
    // Set flag to prevent local timer conflicts
    isReceivingServerUpdate.current = true;
    
    setCurrentGameState(prevState => ({
      ...prevState,
      isTimerRunning: timerData.isTimerRunning,
      timerSeconds: timerData.timerSeconds
    }));
    
    isReceivingServerUpdate.current = false;
  });
});
```

## Critical Design Decisions

### Why `continuousStartTime` is NEVER Cleared (Except on Reset)
- **Server maintains ground truth**: The server calculates elapsed time from when the timer first started
- **Prevents desynchronization**: Clearing this value would cause the timer to jump or reset unintentionally
- **Ensures persistence**: When a client reconnects, the server calculates how much time has actually elapsed

### Why `requestAnimationFrame` on Client
- **Smooth updates**: No discrete jumps like with `setInterval(1000)`
- **Accurate timing**: Uses `Date.now()` delta calculations
- **Performance**: Only updates state when seconds change

### Why Game Win Detection on Server
- **Single source of truth**: Only server decides when timer resets
- **Prevents cheating**: Client cannot manipulate timer reset
- **Consistent across clients**: All clients see timer reset at exact same moment

## Testing Checklist

When testing timer functionality:
- [ ] Start timer, let it run 10+ seconds
- [ ] Close browser tab completely (not just refresh)
- [ ] Wait 5+ seconds before reopening
- [ ] Timer should show correct elapsed time (not 0)
- [ ] Click "Win Game" button
- [ ] Timer should reset to 0 immediately
- [ ] Click start timer again
- [ ] Timer should count from 0 correctly

## Log Indicators

When checking server logs, look for:
- `✅ [EMIT TIMER] timer-update emitted with elapsed time: XXs` - Normal operation
- `🏆 [GAME WON] Game X started - resetting timer` - Game win detected
- `📤 [TIMER RESET] timer-update emitted with timerSeconds: 0` - Timer reset confirmed
- `📥 Received timer update for arena` - Client received server update

## Related Files

- **Server**: `/server.js` (lines ~160-280 for timer management)
- **Client Context**: `/src/contexts/GameStateContext.tsx` (timer useEffect and socket listener)
- **Services**: `/src/services/socketIOService.ts` (timer event handlers)
- **Pages**: `/src/pages/Index.tsx`, `/src/pages/OnePocketArena.tsx` (win button handlers)

## Future Enhancements

If timer needs modification in future:
1. **Do NOT clear `continuousStartTime`** unless explicitly resetting timer
2. **Always calculate elapsed from server**: Trust server more than client
3. **Test with browser closure**: The ultimate test is closing/reopening browser
4. **Check arena isolation**: Ensure both arenas maintain independent timers
5. **Verify game win detection**: Test that currentGameNumber increase triggers reset
