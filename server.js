import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

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
  transports: ['polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true,
  maxHttpBufferSize: 1e6,
  serveClient: false,
  connectTimeout: 60000,
  perMessageDeflate: false
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
    isRunning: false
  },
  'one_pocket': {
    interval: null,
    startTime: null,
    accumulatedTime: 0,
    isRunning: false
  }
};

function getArenaTimer(arenaId = 'default') {
  if (!arenaTimers[arenaId]) {
    arenaTimers[arenaId] = {
      interval: null,
      startTime: null,
      accumulatedTime: 0,
      isRunning: false
    };
  }
  return arenaTimers[arenaId];
}

function startServerTimer(arenaId = 'default') {
  const timer = getArenaTimer(arenaId);
  const arenaState = getGameState(arenaId);
  
  if (timer.interval) {
    clearInterval(timer.interval);
  }
  
  timer.startTime = Date.now();
  timer.isRunning = true;
  arenaState.isTimerRunning = true;
  
  timer.interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
    arenaState.timerSeconds = timer.accumulatedTime + elapsed;
    
    // Broadcast timer update only to this arena's room
    io.to(`arena:${arenaId}`).emit('timer-update', {
      isTimerRunning: arenaState.isTimerRunning,
      timerSeconds: arenaState.timerSeconds
    });
  }, 1000);
}

function stopServerTimer(arenaId = 'default') {
  const timer = getArenaTimer(arenaId);
  const arenaState = getGameState(arenaId);
  
  if (timer.interval) {
    clearInterval(timer.interval);
    timer.interval = null;
  }
  
  // Accumulate the elapsed time when pausing
  if (timer.startTime !== null) {
    const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
    timer.accumulatedTime += elapsed;
    timer.startTime = null;
  }
  
  timer.isRunning = false;
  arenaState.isTimerRunning = false;
  
  // Broadcast timer stop only to this arena's room
  io.to(`arena:${arenaId}`).emit('timer-update', {
    isTimerRunning: false,
    timerSeconds: arenaState.timerSeconds
  });
}

function resetServerTimer(arenaId = 'default') {
  stopServerTimer(arenaId);
  const timer = getArenaTimer(arenaId);
  const arenaState = getGameState(arenaId);
  
  timer.accumulatedTime = 0;
  arenaState.timerSeconds = 0;
  
  // Broadcast timer reset only to this arena's room
  io.to(`arena:${arenaId}`).emit('timer-update', {
    isTimerRunning: false,
    timerSeconds: 0
  });
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
  console.log(`📍 [CONNECTION] Handshake headers:`, JSON.stringify(socket.handshake.headers));
  
  // Track arena but DON'T join any room yet - wait for set-arena
  let currentArenaId = 'default';
  let arenaIdentified = false;
  socketArenaMap.set(socket.id, currentArenaId);
  
  // DO NOT join any room here - wait for set-arena to identify arena first
  
  // Handle arena identification from client - THIS MUST HAPPEN FIRST
  socket.on('set-arena', (data) => {
    const newArenaId = data.arenaId || 'default';
    
    // If arena is being changed and we were previously in a room, leave it
    if (arenaIdentified && currentArenaId !== newArenaId) {
      socket.leave(`arena:${currentArenaId}`);
      console.log(`🔓 [ARENA] Socket ${socket.id} left arena: ${currentArenaId}`);
    }
    
    socketArenaMap.set(socket.id, newArenaId);
    currentArenaId = newArenaId;
    
    // NOW join the arena-specific room
    socket.join(`arena:${newArenaId}`);
    arenaIdentified = true;
    console.log(`🎯 [ARENA] Socket ${socket.id} identified and joined arena: ${newArenaId} (room: arena:${newArenaId})`);
    
    // SEND INITIAL DATA ONLY AFTER ARENA IS IDENTIFIED AND ROOM IS JOINED
    try {
      const arenaState = getGameState(currentArenaId);
      console.log(`📤 [EMIT 1] About to emit game-state-update for arena '${currentArenaId}'`);
      // Emit initial game state with arena ID
      const gameStateData = { ...arenaState, arenaId: currentArenaId };
      console.log(`📤 [DEBUG] Game state data arenaId: ${gameStateData.arenaId}`);
      socket.emit('game-state-update', gameStateData);
      console.log(`✅ [EMIT 1] game-state-update emitted`);
      
      // Emit connected users coins
      const coinsData = calculateConnectedUsersCoins();
      const coinsDataWithArena = { ...coinsData, arenaId: currentArenaId };
      console.log(`📤 [DEBUG] Coins data arenaId: ${coinsDataWithArena.arenaId}`);
      socket.emit('connected-users-coins-update', coinsDataWithArena);
      console.log(`✅ [EMIT 2] connected-users-coins-update emitted`);
      
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
      console.log(`📤 [DEBUG] Bet data arenaId: ${betData.arenaId}`);
      socket.emit('bet-update', betData);
      console.log(`✅ [EMIT 3] bet-update emitted with queues`);
      
      console.log(`📤 [ARENA] Initial data sent to ${socket.id} for arena '${currentArenaId}'`);
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
  
  // Handle bet updates from clients
  socket.on('bet-update', (betData) => {
    const { arenaId = 'default', ...actualBetData } = betData;
    console.log(`📥 Received bet update for arena '${arenaId}':`, actualBetData);
    
    if (isListenersPaused) {
      console.log('⏸️ SERVER: Skipping bet-update broadcast - listeners paused');
      return;
    }
    
    const arenaState = getGameState(arenaId);
    
    if (actualBetData.teamAQueue) arenaState.teamAQueue = actualBetData.teamAQueue;
    if (actualBetData.teamBQueue) arenaState.teamBQueue = actualBetData.teamBQueue;
    if (actualBetData.bookedBets) arenaState.bookedBets = actualBetData.bookedBets;
    if (actualBetData.nextGameBets) arenaState.nextGameBets = actualBetData.nextGameBets;
    if (actualBetData.nextTeamAQueue) arenaState.nextTeamAQueue = actualBetData.nextTeamAQueue;
    if (actualBetData.nextTeamBQueue) arenaState.nextTeamBQueue = actualBetData.nextTeamBQueue;
    if (actualBetData.totalBookedAmount !== undefined) arenaState.totalBookedAmount = actualBetData.totalBookedAmount;
    if (actualBetData.nextTotalBookedAmount !== undefined) arenaState.nextTotalBookedAmount = actualBetData.nextTotalBookedAmount;
    
    // Broadcast ONLY to the specific arena's room
    io.to(`arena:${arenaId}`).emit('bet-update', actualBetData);
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
    Object.assign(arenaState, actualGameState);
    
    // Broadcast ONLY to the specific arena's room
    io.to(`arena:${arenaId}`).emit('game-state-update', actualGameState);
    console.log(`📤 Broadcasted game-state-update to arena '${arenaId}'`);
  });
  
  // Handle timer updates
  socket.on('timer-update', (timerData) => {
    const { arenaId = 'default', ...actualTimerData } = timerData;
    console.log(`📥 Received timer update for arena '${arenaId}':`, actualTimerData);
    
    const arenaState = getGameState(arenaId);
    arenaState.isTimerRunning = actualTimerData.isTimerRunning;
    arenaState.timerSeconds = actualTimerData.timerSeconds;
    
    // Broadcast ONLY to the specific arena's room
    io.to(`arena:${arenaId}`).emit('timer-update', actualTimerData);
    console.log(`📤 Broadcasted timer-update to arena '${arenaId}'`);
  });
  
  // Handle timer heartbeat requests
  socket.on('timer-heartbeat', () => {
    // Send current server timer state to requesting client
    const arenaId = socketArenaMap.get(socket.id) || 'default';
    const arenaState = getGameState(arenaId);
    socket.emit('timer-update', {
      isTimerRunning: arenaState.isTimerRunning,
      timerSeconds: arenaState.timerSeconds
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
    io.to(`arena:${arenaId}`).emit('receive-game-history-from-clients', {
      from: 'server',
      requestId: requestId,
      arenaId: arenaId
    });
  });
  
  // Handle game history responses from clients
  socket.on('provide-game-history', (data) => {
    const arenaId = data?.arenaId || 'default';
    console.log(`📥 [P2P] Client providing game history for arena '${arenaId}': ${data.history.length} records`);
    // This is handled by individual clients, no broadcast needed
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Remove user from connected users and update coins
    const disconnectedUser = connectedUsers.get(socket.id);
    if (disconnectedUser) {
      console.log(`User ${disconnectedUser.name} disconnected, removing from connected users`);
      connectedUsers.delete(socket.id);
      
      // Broadcast updated connected users coins to all clients
      const coinsData = calculateConnectedUsersCoins();
      io.emit('connected-users-coins-update', coinsData);
      console.log(`📊 Connected users coins after disconnect: ${coinsData.totalCoins} coins from ${coinsData.connectedUserCount} users`);
    }
  });
});

// API endpoint to get current game state
app.get('/api/game-state', (req, res) => {
  res.json(serverGameState);
});

// API endpoint to get connected users debug info
app.get('/api/connected-users', (req, res) => {
  const coinsData = calculateConnectedUsersCoins();
  res.json({
    connectedUsers: Array.from(connectedUsers.entries()).map(([socketId, userData]) => ({
      socketId,
      userId: userData.userId,
      name: userData.name,
      credits: userData.credits,
      loginTime: userData.loginTime,
      age: userData.loginTime ? Date.now() - userData.loginTime : 0
    })),
    summary: coinsData
  });
});

// API endpoint to reset game state
app.post('/api/reset-game', (req, res) => {
  serverGameState = {
    teamAQueue: [],
    teamBQueue: [],
    bookedBets: [],
    nextGameBets: [],
    teamAScore: 0,
    teamBScore: 0,
    isTimerRunning: false,
    timerSeconds: 0,
    gameInfo: {
      teamAName: "Team A",
      teamBName: "Team B",
      gameTitle: "Game Bird",
      gameDescription: "Place your bets!"
    },
    isGameActive: false,
    winner: null,
    lastUpdated: Date.now()
  };
  
  // Broadcast reset to all clients
  io.emit('game-state-update', serverGameState);
  
  res.json({ success: true, message: 'Game state reset' });
});

// Serve the main app for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 PWA accessible at: http://localhost:${PORT}`);
  console.log(`📱 Mobile access: http://192.168.4.83:${PORT}`);
  console.log(`🌐 Socket.IO server ready for real-time sync`);
  console.log(`📱 Mobile users: Tap "Advanced" → "Proceed to site" if you see security warning`);
});
