import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Deployment version: 4
// Force Render to rebuild with fresh dist files

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ [GLOBAL] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [GLOBAL] Unhandled Rejection:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// CORS configuration for Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
    allowedHeaders: "*"
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 45000,
  pingInterval: 20000,
  allowEIO3: true,
  maxHttpBufferSize: 1e6,
  serveClient: false,
  connectTimeout: 60000,
  perMessageDeflate: false,
  upgrade: true,
  upgradeTimeout: 10000
});

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["*"],
  credentials: false
}));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`📨 [HTTP] ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Cache-busting headers for assets
app.use((req, res, next) => {
  // Force no-cache for HTML and service worker
  if (req.path === '/' || req.path === '/index.html' || req.path === '/sw.js') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } 
  // Long cache for assets with hashes
  else if (req.path.startsWith('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Socket.IO endpoint (explicit for better compatibility)
app.get('/socket.io/', (req, res) => {
  res.json({ status: 'Socket.IO server is ready' });
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve static files from public directory (for test pages)
app.use(express.static(path.join(__dirname, 'public')));

// SPA routing: serve index.html for all routes (Express will match in order)
// This must come AFTER all other routes (static files, API, socket.io, health, etc.)
app.get(/.*/, (req, res) => {
  // CRITICAL: Don't serve index.html for these:
  // - API routes
  // - Socket.IO routes
  // - Asset files (JS, CSS, images, fonts)
  // - Files with extensions
  if (req.path.startsWith('/api/') || 
      req.path.startsWith('/socket.io') ||
      req.path.includes('.') ||  // Files with extensions (assets)
      req.path.startsWith('/assets/')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  
  // Serve index.html for all other routes (SPA routing)
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Store game state on server - now with arena separation
const createDefaultGameState = () => ({
  teamAQueue: [],
  teamBQueue: [],
  bookedBets: [],
  nextGameBets: [],
  nextTeamAQueue: [],
  nextTeamBQueue: [],
  teamAScore: 0,
  teamBScore: 0,
  teamABalls: 0,
  teamBBalls: 0,
  isTimerRunning: false,
  timerSeconds: 0,
  currentGameNumber: 1,
  teamAHasBreak: true,
  totalBookedAmount: 0,
  nextTotalBookedAmount: 0,
  users: [],
  gameInfo: {
    teamAName: "Team A",
    teamBName: "Team B",
    gameTitle: "Game Bird",
    gameDescription: "Place your bets!"
  },
  isGameActive: false,
  winner: null
});

// Map to store game state for each arena
let arenaGameStates = {
  'default': createDefaultGameState(),
  'one_pocket': createDefaultGameState()
};

// Track which arena each socket belongs to
const socketArenaMap = new Map();

const getGameState = (arenaId = 'default') => {
  if (!arenaGameStates[arenaId]) {
    console.log(`🆕 Creating new arena state for: ${arenaId}`);
    arenaGameStates[arenaId] = createDefaultGameState();
  }
  return arenaGameStates[arenaId];
};

let serverGameState = getGameState('default');

// Track connected users and their credits
let connectedUsers = new Map(); // socketId -> { userId, credits, name }

// Flag to pause broadcasting during clear operations
let isListenersPaused = false;

// Calculate total coins from connected users
function calculateConnectedUsersCoins() {
  let totalCoins = 0;
  let connectedUserCount = 0;
  
  // Clean up stale entries (older than 5 minutes)
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes
  
  connectedUsers.forEach((userData, socketId) => {
    if (userData.loginTime && (now - userData.loginTime) > staleThreshold) {
      console.log(`🧹 Removing stale user ${userData.name} (${socketId})`);
      connectedUsers.delete(socketId);
    }
  });
  
  connectedUsers.forEach((userData) => {
    totalCoins += userData.credits || 0;
    connectedUserCount++;
  });
  
  return {
    totalCoins,
    connectedUserCount,
    connectedUsers: Array.from(connectedUsers.values())
  };
}

// Periodic cleanup of stale connections
setInterval(() => {
  const coinsData = calculateConnectedUsersCoins();
  if (coinsData.connectedUserCount > 0) {
    console.log(`🧹 Periodic cleanup: ${coinsData.connectedUserCount} users, ${coinsData.totalCoins} coins`);
    io.emit('connected-users-coins-update', coinsData);
  }
}, 30000); // Every 30 seconds

// Server timer management - now per-arena
let arenaTimers = {
  'default': {
    interval: null,
    startTime: null,
    accumulatedTime: 0,
    isRunning: false,
    continuousStartTime: null  // Track when timer started continuously (never reset)
  },
  'one_pocket': {
    interval: null,
    startTime: null,
    accumulatedTime: 0,
    isRunning: false,
    continuousStartTime: null  // Track when timer started continuously (never reset)
  }
};

function getArenaTimer(arenaId = 'default') {
  if (!arenaTimers[arenaId]) {
    arenaTimers[arenaId] = {
      interval: null,
      startTime: null,
      accumulatedTime: 0,
      isRunning: false,
      continuousStartTime: null
    };
  }
  return arenaTimers[arenaId];
}

function startServerTimer(arenaId = 'default') {
  const timer = getArenaTimer(arenaId);
  const arenaState = getGameState(arenaId);
  
  console.log(`⏱️ [START TIMER] Called for arena '${arenaId}', timer.isRunning=${timer.isRunning}`);
  
  if (timer.interval) {
    clearInterval(timer.interval);
    console.log(`⏱️ [START TIMER] Cleared existing interval`);
  }
  
  // If this is the first time starting, record the continuous start time
  if (!timer.continuousStartTime) {
    timer.continuousStartTime = Date.now();
    console.log(`⏱️ [START TIMER] Set continuousStartTime to now`);
  }
  
  timer.startTime = Date.now();
  timer.isRunning = true;
  arenaState.isTimerRunning = true;
  console.log(`⏱️ [START TIMER] Timer state updated: isRunning=true`);
  
  // OPTIMIZED: Reduce broadcast frequency from 1s to 500ms
  // Only broadcast when timer is actually running
  let lastBroadcastTime = Date.now();
  let broadcastCount = 0;
  timer.interval = setInterval(() => {
    // Only broadcast if enough time has passed (delta-based sending)
    const now = Date.now();
    if (now - lastBroadcastTime >= 500) {
      const totalElapsed = Math.floor((Date.now() - timer.continuousStartTime) / 1000);
      broadcastCount++;
      
      io.to(`arena:${arenaId}`).emit('timer-update', {
        isTimerRunning: arenaState.isTimerRunning,
        timerSeconds: totalElapsed,
        serverStartTime: timer.startTime,
        accumulatedTime: totalElapsed,
        arenaId: arenaId
      });
      
      console.log(`📤 [TIMER BROADCAST #${broadcastCount}] Arena '${arenaId}': timerSeconds=${totalElapsed}, isRunning=${arenaState.isTimerRunning}`);
      lastBroadcastTime = now;
    }
  }, 500); // Check every 500ms instead of 1000ms
  
  console.log(`⏱️ [START TIMER] Interval set for arena '${arenaId}'`);
}

function stopServerTimer(arenaId = 'default') {
  const timer = getArenaTimer(arenaId);
  const arenaState = getGameState(arenaId);
  
  if (timer.interval) {
    clearInterval(timer.interval);
    timer.interval = null;
  }
  
  // Calculate current total time but don't reset anything
  const totalElapsed = timer.continuousStartTime 
    ? Math.floor((Date.now() - timer.continuousStartTime) / 1000)
    : timer.accumulatedTime;
  
  timer.isRunning = false;
  arenaState.isTimerRunning = false;
  
  // Broadcast timer stop only to this arena's room
  io.to(`arena:${arenaId}`).emit('timer-update', {
    isTimerRunning: false,
    timerSeconds: totalElapsed,
    serverStartTime: null,
    accumulatedTime: totalElapsed,
    arenaId: arenaId
  });
}

function resetServerTimer(arenaId = 'default') {
  const timer = getArenaTimer(arenaId);
  const arenaState = getGameState(arenaId);
  
  // Only reset if admin explicitly calls this - NOT on game win
  if (timer.interval) {
    clearInterval(timer.interval);
    timer.interval = null;
  }
  
  // ONLY reset these three things - the timer should NEVER auto-reset
  timer.accumulatedTime = 0;
  timer.continuousStartTime = null;  // Reset the continuous tracking
  timer.startTime = null;
  timer.isRunning = false;
  arenaState.isTimerRunning = false;
  arenaState.timerSeconds = 0;
  
  // Broadcast timer reset to clients for this arena
  io.to(`arena:${arenaId}`).emit('timer-update', {
    isTimerRunning: false,
    timerSeconds: 0,
    serverStartTime: null,
    accumulatedTime: 0,
    arenaId: arenaId
  });
  console.log(`📤 [TIMER RESET] timer-update emitted with timerSeconds: 0 for arena '${arenaId}'`);
}

// Socket.IO middleware to log and accept all connections
io.use((socket, next) => {
  console.log('🔌 [MIDDLEWARE] Connection attempt from origin:', socket.handshake.headers.origin);
  console.log('📦 [MIDDLEWARE] EIO:', socket.handshake.query.EIO);
  console.log('📦 [MIDDLEWARE] Transport:', socket.handshake.query.transport);
  console.log('✅ [MIDDLEWARE] Calling next() to accept connection');
  
  // Accept all connections - no auth needed
  try {
    next();
    console.log('✅ [MIDDLEWARE] next() completed successfully');
  } catch (error) {
    console.error('❌ [MIDDLEWARE] Error in next():', error.message);
    next(error);
  }
});

// Socket.IO error handler
io.engine.on('connection_error', (err) => {
  console.error('❌ [ENGINE] Connection error:', err.code, err.message);
});

io.engine.on('parse_error', (err) => {
  console.error('❌ [ENGINE] Parse error:', err);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ [CONNECTION] Socket connected: ${socket.id}`);
  
  // Track arena but DON'T join any room yet - wait for set-arena
  let currentArenaId = 'default';
  let arenaIdentified = false;
  socketArenaMap.set(socket.id, currentArenaId);
  
  // THROTTLING: Prevent event flooding - track last emit times per socket
  const emitThrottle = {
    betUpdate: 0,
    gameState: 0,
    timer: 0
  };
  const THROTTLE_DELAY = 50; // ms - only emit once per 50ms
  
  const shouldThrottle = (type) => {
    const now = Date.now();
    if (now - emitThrottle[type] >= THROTTLE_DELAY) {
      emitThrottle[type] = now;
      return false;
    }
    return true;
  };
  
  // DO NOT join any room here - wait for set-arena to identify arena first
  
  // Handle arena identification from client - THIS MUST HAPPEN FIRST
  socket.on('set-arena', (data) => {
    const newArenaId = data.arenaId || 'default';
    
    console.log(`🏟️ [SET-ARENA] Socket ${socket.id} requesting arena '${newArenaId}'`);
    
    // If arena is being changed and we were previously in a room, leave it
    if (arenaIdentified && currentArenaId !== newArenaId) {
      socket.leave(`arena:${currentArenaId}`);
      console.log(`🏟️ [SET-ARENA] Left old arena room '${currentArenaId}'`);
    }
    
    socketArenaMap.set(socket.id, newArenaId);
    currentArenaId = newArenaId;
    
    // NOW join the arena-specific room
    socket.join(`arena:${newArenaId}`);
    console.log(`🏟️ [SET-ARENA] Joined arena room '${newArenaId}'. Current rooms: ${JSON.stringify(socket.rooms)}`);
    arenaIdentified = true;
    
    // SEND INITIAL DATA ONLY AFTER ARENA IS IDENTIFIED AND ROOM IS JOINED
    try {
      const arenaState = getGameState(currentArenaId);
      const timer = getArenaTimer(currentArenaId);
      
      // Emit initial game state with arena ID
      const gameStateData = { ...arenaState, arenaId: currentArenaId };
      socket.emit('game-state-update', gameStateData);
      
      // Emit initial timer state with server's authoritative start time
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
      
      // Emit connected users coins
      const coinsData = calculateConnectedUsersCoins();
      socket.emit('connected-users-coins-update', { ...coinsData, arenaId: currentArenaId });
      
      // Emit initial bet data with arena ID
      const betData = {
        arenaId: currentArenaId,
        teamAQueue: arenaState.teamAQueue,
        teamBQueue: arenaState.teamBQueue,
        bookedBets: arenaState.bookedBets,
        nextGameBets: arenaState.nextGameBets,
        nextTeamAQueue: arenaState.nextTeamAQueue,
        nextTeamBQueue: arenaState.nextTeamBQueue
      };
      socket.emit('bet-update', betData);
    } catch (error) {
      console.error(`❌ [ARENA] Error sending initial data to ${socket.id}:`, error.message);
    }
  });
  
  // Handle any socket errors
  socket.on('error', (error) => {
    console.error(`❌ [SOCKET ERROR] ${socket.id}:`, error);
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 [DISCONNECT] Socket disconnected: ${socket.id}`);
    socketArenaMap.delete(socket.id);
  });

  // Handle game state requests from new clients
  socket.on('request-game-state', (data) => {
    const arenaId = data?.arenaId || currentArenaId;
    const arenaState = getGameState(arenaId);
    console.log(`📥 [REQUEST] Game state requested by ${socket.id} for arena '${arenaId}'`);
    socket.emit('game-state-update', { ...arenaState, arenaId });
    const coinsData = calculateConnectedUsersCoins();
    socket.emit('connected-users-coins-update', { ...coinsData, arenaId });
    
    // Also send current bets for the arena
    const arenaGameState = getGameState(arenaId);
    socket.emit('bet-update', {
      teamAQueue: arenaGameState.teamAQueue || [],
      teamBQueue: arenaGameState.teamBQueue || [],
      bookedBets: arenaGameState.bookedBets || [],
      nextGameBets: arenaGameState.nextBookedBets || [],
      nextTeamAQueue: arenaGameState.nextTeamAQueue || [],
      nextTeamBQueue: arenaGameState.nextTeamBQueue || [],
      arenaId
    });
    
    console.log(`📤 [RESPONSE] Game state sent to ${socket.id}`);
  });
  
  // Handle user login/selection - track connected users
  socket.on('user-login', (userData) => {
    console.log(`User logged in: ${userData.name} (${userData.id}) with ${userData.credits} coins`);
    
    // Remove any existing user for this socket first
    const existingUser = connectedUsers.get(socket.id);
    if (existingUser) {
      console.log(`Removing existing user ${existingUser.name} for socket ${socket.id}`);
      connectedUsers.delete(socket.id);
    }
    
    // Add the new user
    connectedUsers.set(socket.id, {
      userId: userData.id,
      name: userData.name,
      credits: userData.credits,
      socketId: socket.id,
      loginTime: Date.now()
    });
    
    // Broadcast updated connected users coins to all clients
    const coinsData = calculateConnectedUsersCoins();
    io.emit('connected-users-coins-update', coinsData);
    console.log(`📊 Connected users coins: ${coinsData.totalCoins} coins from ${coinsData.connectedUserCount} users`);
  });

  // Handle user logout - remove from connected users tracking
  socket.on('user-logout', (userData) => {
    console.log(`User logged out: ${userData.name} (${userData.id})`);
    const existingUser = connectedUsers.get(socket.id);
    if (existingUser && existingUser.userId === userData.id) {
      connectedUsers.delete(socket.id);
      
      // Broadcast updated connected users coins to all clients
      const coinsData = calculateConnectedUsersCoins();
      io.emit('connected-users-coins-update', coinsData);
      console.log(`📊 Connected users coins after logout: ${coinsData.totalCoins} coins from ${coinsData.connectedUserCount} users`);
    } else {
      console.log(`⚠️ Logout event for user ${userData.name} but socket ${socket.id} has different user:`, existingUser?.name || 'none');
    }
  });
  
  // Handle bet updates - sync betting queues across all clients
  socket.on('bet-update', (data) => {
    const arenaId = data?.arenaId || 'default';
    const arenaState = getGameState(arenaId);
    
    console.log(`📥 Received bet update for arena '${arenaId}':`, {
      teamAQueue: data.teamAQueue?.length,
      teamBQueue: data.teamBQueue?.length,
      bookedBets: data.bookedBets?.length,
      nextTeamAQueue: data.nextTeamAQueue?.length,
      nextTeamBQueue: data.nextTeamBQueue?.length,
      nextGameBets: data.nextGameBets?.length
    });
    
    // Update the arena's game state with the new bet data
    if (data.teamAQueue !== undefined) arenaState.teamAQueue = data.teamAQueue;
    if (data.teamBQueue !== undefined) arenaState.teamBQueue = data.teamBQueue;
    if (data.bookedBets !== undefined) arenaState.bookedBets = data.bookedBets;
    if (data.nextTeamAQueue !== undefined) arenaState.nextTeamAQueue = data.nextTeamAQueue;
    if (data.nextTeamBQueue !== undefined) arenaState.nextTeamBQueue = data.nextTeamBQueue;
    if (data.nextGameBets !== undefined) arenaState.nextGameBets = data.nextGameBets;
    if (data.totalBookedAmount !== undefined) arenaState.totalBookedAmount = data.totalBookedAmount;
    if (data.nextTotalBookedAmount !== undefined) arenaState.nextTotalBookedAmount = data.nextTotalBookedAmount;
    
    arenaState.lastUpdated = Date.now();
    
    // Broadcast the bet update to ALL clients in the SAME ARENA (including sender)
    io.to(`arena:${arenaId}`).emit('bet-update', data);
    console.log(`📤 Broadcasted bet-update to arena '${arenaId}'`);
  });
  
  // Handle game history updates - sync across all clients
  socket.on('game-history-update', (data) => {
    console.log('📥 Received game history update:', data.gameHistory?.length, 'entries');
    
    // SKIP if listeners are paused (during clear)
    if (isListenersPaused) {
      console.log('⏸️ SERVER: Skipping game-history-update broadcast - listeners paused');
      return;
    }
    
    const arenaId = data.arenaId || 'default';
    const arenaState = getGameState(arenaId);
    arenaState.gameHistory = data.gameHistory || [];
    arenaState.lastUpdated = Date.now();
    
    // Broadcast to all OTHER clients in the SAME ARENA
    socket.to(`arena:${arenaId}`).emit('game-history-update', data);
    console.log(`📤 Broadcasted game history to arena '${arenaId}'`);
  });

  // Handle bet receipts updates - sync across all clients
  socket.on('bet-receipts-update', (data) => {
    console.log('📥 Received bet receipts update:', data.betReceipts?.length, 'entries');
    
    // SKIP if listeners are paused (during clear)
    if (isListenersPaused) {
      console.log('⏸️ SERVER: Skipping bet-receipts-update broadcast - listeners paused');
      return;
    }
    
    const arenaId = data.arenaId || 'default';
    const arenaState = getGameState(arenaId);
    arenaState.betReceipts = data.betReceipts || [];
    arenaState.lastUpdated = Date.now();
    
    // Broadcast to all OTHER clients in the SAME ARENA
    socket.to(`arena:${arenaId}`).emit('bet-receipts-update', data);
    console.log(`📤 Broadcasted bet receipts to arena '${arenaId}'`);
  });
  
  // Handle game state updates
  socket.on('game-state-update', (gameStateData) => {
    const { arenaId = 'default', ...actualGameState } = gameStateData;
    console.log(`📥 Received game state update for arena '${arenaId}':`, actualGameState);
    
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
    
    // Broadcast ONLY to the specific arena's room - INCLUDE arenaId
    io.to(`arena:${arenaId}`).emit('game-state-update', { ...actualGameState, arenaId });
    console.log(`📤 Broadcasted game-state-update to arena '${arenaId}'`);
  });
  
  // Handle timer updates
  socket.on('timer-update', (timerData) => {
    const { arenaId = 'default', ...actualTimerData } = timerData;
    console.log(`📥 Received timer update for arena '${arenaId}':`, actualTimerData);
    
    const arenaState = getGameState(arenaId);
    const timer = getArenaTimer(arenaId);
    
    // If timer is being started, ensure continuousStartTime is set
    if (actualTimerData.isTimerRunning && !timer.isRunning) {
      startServerTimer(arenaId);
    }
    // If timer is being paused, ensure it stops but keeps accumulated time
    else if (!actualTimerData.isTimerRunning && timer.isRunning) {
      stopServerTimer(arenaId);
    }
    // If timer was already running, nothing to do - server maintains its own time
  });
  
  // Handle timer heartbeat requests
  socket.on('timer-heartbeat', () => {
    // Send current server timer state to requesting client
    const arenaId = socketArenaMap.get(socket.id) || 'default';
    const arenaState = getGameState(arenaId);
    const timer = getArenaTimer(arenaId);
    
    // Calculate current elapsed time from continuous start
    const currentElapsed = timer.continuousStartTime 
      ? Math.floor((Date.now() - timer.continuousStartTime) / 1000)
      : 0;
    
    socket.emit('timer-update', {
      isTimerRunning: timer.isRunning,
      timerSeconds: currentElapsed,
      serverStartTime: timer.startTime,
      accumulatedTime: currentElapsed,
      arenaId: arenaId
    });
  });

  // Handle dedicated break status updates
  socket.on('break-status-update', (data) => {
    console.log('Received dedicated break status update:', data);
    const arenaId = data.arenaId || 'default';
    const arenaState = getGameState(arenaId);
    arenaState.teamAHasBreak = data.teamAHasBreak;
    arenaState.lastUpdated = Date.now();
    
    // Broadcast to all other clients in the SAME ARENA
    socket.to(`arena:${arenaId}`).emit('break-status-update', data);
  });

  // BET HISTORY IS NOW COMPLETELY LOCAL - NO SERVER SYNC
  // Removed game history update handler to prevent external clearing
  // Bet history is now a permanent, immutable ledger on each client

  // Handle total booked coins updates
  socket.on('total-booked-coins-update', (data) => {
    console.log('Received total booked coins update:', data);
    const arenaId = data.arenaId || 'default';
    const arenaState = getGameState(arenaId);
    arenaState.totalBookedAmount = data.totalBookedAmount;
    arenaState.nextTotalBookedAmount = data.nextTotalBookedAmount;
    arenaState.lastUpdated = Date.now();
    
    // Broadcast to all other clients in the SAME ARENA
    socket.to(`arena:${arenaId}`).emit('total-booked-coins-update', data);
  });

  // BET RECEIPTS ARE NOW COMPLETELY LOCAL - NO SERVER SYNC
  // Removed bet receipts update handler to prevent external clearing
  // Bet receipts are now a permanent, immutable ledger on each client

  // Handle sound events - broadcast to all clients in the arena
  socket.on('play-sound', (data) => {
    const arenaId = data?.arenaId || 'default';
    console.log(`🔊 Sound event '${data.soundType}' for arena '${arenaId}'`);
    // Broadcast sound to ALL clients in the same arena (including sender)
    io.to(`arena:${arenaId}`).emit('play-sound', data);
  });

  // Handle user wallet updates
  socket.on('user-wallet-update', (data) => {
    const arenaId = data?.arenaId || 'default';
    console.log(`💰 User wallet update for arena '${arenaId}':`, data);
    // Broadcast ONLY to the specific arena
    io.to(`arena:${arenaId}`).emit('user-wallet-update', data);
  });
  
  // Handle wallet data requests
  socket.on('request-wallet-data', () => {
    console.log('Received wallet data request');
    // Send current wallet data to requesting client
    socket.emit('wallet-data-response', { users: serverGameState.users });
  });

  // Handle connected users data requests
  socket.on('request-connected-users-data', () => {
    console.log('Received connected users data request');
    
    // Force cleanup of stale connections before calculating
    const coinsData = calculateConnectedUsersCoins();
    
    // Send to requesting client
    socket.emit('connected-users-coins-update', coinsData);
    
    // Also broadcast to all clients to ensure everyone has the latest data
    io.emit('connected-users-coins-update', coinsData);
    
    console.log(`📊 Sent connected users data: ${coinsData.totalCoins} coins from ${coinsData.connectedUserCount} users`);
  });

  // Handle clear all data
  socket.on('clear-all-data', (data) => {
    const arenaId = data?.arenaId || 'default';
    console.log(`🗑️ Clear all data for arena '${arenaId}'`);
    isListenersPaused = true;
    // Broadcast ONLY to the specific arena
    io.to(`arena:${arenaId}`).emit('clear-all-data', data);
  });
  
  // Handle pause listeners
  socket.on('pause-listeners', (data) => {
    const arenaId = data?.arenaId || 'default';
    console.log(`⏸️ Pause listeners for arena '${arenaId}'`);
    isListenersPaused = true;
    // Broadcast ONLY to the specific arena
    io.to(`arena:${arenaId}`).emit('pause-listeners', data);
  });
  
  // Handle resume listeners
  socket.on('resume-listeners', (data) => {
    const arenaId = data?.arenaId || 'default';
    console.log(`▶️ Resume listeners for arena '${arenaId}'`);
    isListenersPaused = false;
    // Broadcast ONLY to the specific arena
    io.to(`arena:${arenaId}`).emit('resume-listeners', data);
  });
  
  // Handle score updates
  socket.on('score-update', (scoreData) => {
    const { arenaId = 'default', ...actualScoreData } = scoreData;
    console.log(`📥 Received score update for arena '${arenaId}':`, actualScoreData);
    
    const arenaState = getGameState(arenaId);
    arenaState.teamAScore = actualScoreData.teamAScore;
    arenaState.teamBScore = actualScoreData.teamBScore;
    
    // Broadcast ONLY to the specific arena's room
    io.to(`arena:${arenaId}`).emit('score-update', actualScoreData);
    console.log(`📤 Broadcasted score-update to arena '${arenaId}'`);
  });
  
  // Handle test messages
  socket.on('test-message', (data) => {
    console.log('📥 Received test message:', data);
    socket.emit('test-response', {
      message: 'Hello from server!',
      timestamp: new Date().toISOString(),
      serverId: socket.id,
      originalData: data
    });
  });

  // Handle peer-to-peer game history requests
  socket.on('request-game-history-from-clients', (data) => {
    const arenaId = data?.arenaId || 'default';
    const requestId = data?.requestId || `request-${Date.now()}`;
    console.log(`📨 [P2P] Server requesting game history for arena '${arenaId}' (requestId: ${requestId})`);
    // Broadcast ONLY to the specific arena
    io.to(`arena:${arenaId}`).emit('request-game-history-from-clients', {
      requestId,
      arenaId,
      serverId: socket.id,
      originalData: data
    });
  });

  // Handle sound events - broadcast to all clients in the arena
  socket.on('play-sound', (data) => {
    const arenaId = data?.arenaId || 'default';
    console.log(`🔊 Sound event '${data.soundType}' for arena '${arenaId}'`);
    // Broadcast sound to ALL clients in the same arena (including sender)
    io.to(`arena:${arenaId}`).emit('play-sound', data);
  });

  // Handle team names updates - broadcast to all clients in the arena
  socket.on('team-names-update', (data) => {
    const arenaId = data?.arenaId || 'default';
    console.log(`👥 [TEAM NAMES UPDATE] Arena '${arenaId}': ${data.teamAName} vs ${data.teamBName}`);
    // Broadcast to ALL clients in the same arena
    io.to(`arena:${arenaId}`).emit('team-names-update', data);
  });

  // Handle admin state updates - broadcast to all clients in the arena
  socket.on('admin-state-update', (data) => {
    const arenaId = data?.arenaId || 'default';
    console.log(`⚙️ [ADMIN STATE UPDATE] Arena '${arenaId}'`);
    // Broadcast to ALL clients in the same arena
    io.to(`arena:${arenaId}`).emit('admin-state-update', data);
  });

  // Handle full state sync - broadcast to all clients in the arena
  socket.on('full-state-sync', (data) => {
    const arenaId = data?.arenaId || 'default';
    console.log(`📡 [FULL STATE SYNC] Arena '${arenaId}' - syncing complete game state`);
    // Broadcast to ALL clients in the same arena (excluding sender)
    socket.broadcast.to(`arena:${arenaId}`).emit('full-state-sync', data);
  });
});

// Start server - listen on 0.0.0.0 for external connections (required for Render deployment)
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Game Bird server running on port ${PORT}`);
});