import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Database module (PostgreSQL)
import {
  initializeDatabase,
  createOrUpdateUser,
  getUserById,
  authenticateUser,
  getAllUsers,
  getUserBalance,
  addTransaction,
  getUserTransactionHistory,
  updateUserStats,
  getDatabaseStats,
  addGameHistory,
  getGameHistory,
  clearGameHistory,
} from './src/db/database.js';

// Deployment version: 3
// Force Render to redeploy with fresh instance

/*
🎯 ARENA INDEPENDENCE GUARANTEE
================================
Each arena (default, one_pocket, etc.) maintains COMPLETELY INDEPENDENT state:

✅ Server-Side:
- arenaGameStates = { 'default': {...}, 'one_pocket': {...} }
- Each arena has its own game counts, scores, balls, bets, timers
- Updates to one arena do NOT affect other arenas
- Broadcasts use io.to(`arena:${arenaId}`) for arena-specific delivery

✅ Client-Side:
- gameStateDefault and gameStateOnePocket are separate React states
- setCurrentGameState() only updates the current arena's state
- validateArenaAndUpdate() ensures only matching arena data is processed
- Socket listeners check arena ID before updating state

✅ Communication:
- Every Socket.IO message includes arenaId
- Server broadcasts ONLY to specific arena room
- Clients validate arena ID before accepting updates

RESULT: If you change Rotation arena scores to 10-5, One Pocket arena will 
        still have its own independent scores (e.g., 3-2). Switching between
        arenas will ALWAYS show the correct data for that arena.
*/

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

app.use(express.json());

// 💰 CREDIT LEDGER SYSTEM - Server-Authoritative
// Every credit transaction is permanently recorded
// ============================================================================
// 💰 CREDIT SYSTEM - NOW USING POSTGRESQL DATABASE
// ============================================================================
// 
// All credit functions are now provided by ./src/db/database.js:
//   • addTransaction(userId, type, amount, reason, adminNotes)
//   • getUserBalance(userId)
//   • getUserTransactionHistory(userId)
//   • createOrUpdateUser(userId, name, password, initialCredits)
//   • updateUserStats(userId, wins, losses)
//
// These functions handle BOTH in-memory (fallback) and PostgreSQL (primary)
// ============================================================================

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

// SPA routing: serve index.html for all non-API routes (use middleware instead of app.get)
app.use((req, res, next) => {
  // Don't serve index.html for API or Socket.IO routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io')) {
    return next();
  }
  
  // For all other routes, serve index.html (SPA routing)
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) {
      res.status(500).json({ error: 'Could not serve index.html' });
    }
  });
});

// 👥 SERVER-SIDE USER STORAGE
// Store all users on server (shared across all browsers/devices)
// ============================================================================
// 👥 USER MANAGEMENT - NOW USING POSTGRESQL DATABASE
// ============================================================================
// 
// User functions are now provided by ./src/db/database.js
// This module handles:
//   • createOrUpdateUser(userId, name, password, initialCredits)
//   • getUserById(userId)
//   • authenticateUser(name, password)
//   • getAllUsers()
//   • updateUserStats(userId, wins, losses)
//
// All user data is now persistent in PostgreSQL!
// ============================================================================

// 🎯 Arena Labels for clear differentiation in logs
const getArenaLabel = (arenaId) => {
  if (arenaId === 'one_pocket') return '🎯 [1-POCKET]';
  return '🎱 [9-BALL]';
};

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
async function calculateConnectedUsersCoins() {
  let totalCoins = 0;
  let connectedUserCount = 0;
  const connectedUsersData = [];
  
  // Clean up stale entries (older than 5 minutes)
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes
  
  connectedUsers.forEach((userData, socketId) => {
    if (userData.loginTime && (now - userData.loginTime) > staleThreshold) {
      console.log(`🧹 Removing stale user ${userData.name} (${socketId})`);
      connectedUsers.delete(socketId);
    }
  });
  
  // For each connected user, fetch CURRENT balance from database
  for (const [socketId, userData] of connectedUsers) {
    try {
      // Get current balance from database (not from stored value)
      let currentBalance = userData.credits || 0;
      
      if (db && typeof db.getUserBalance === 'function') {
        const balance = await db.getUserBalance(userData.userId);
        currentBalance = balance || 0;
      }
      
      totalCoins += currentBalance;
      connectedUserCount++;
      
      connectedUsersData.push({
        socketId,
        userId: userData.userId,
        name: userData.name,
        credits: currentBalance
      });
    } catch (err) {
      console.error(`❌ Error fetching balance for ${userData.name}:`, err);
      // Fall back to stored value
      totalCoins += userData.credits || 0;
      connectedUserCount++;
      connectedUsersData.push(userData);
    }
  }
  
  return {
    totalCoins,
    connectedUserCount,
    connectedUsers: connectedUsersData
  };
}

// Periodic cleanup and sync of stale connections
setInterval(async () => {
  try {
    const coinsData = await calculateConnectedUsersCoins();
    if (coinsData.connectedUserCount > 0) {
      console.log(`🧹 Periodic sync: ${coinsData.connectedUserCount} users, ${coinsData.totalCoins} coins`);
      io.emit('connected-users-coins-update', coinsData);
    }
  } catch (err) {
    console.error('❌ Error in periodic cleanup:', err);
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

// 💰 CREDIT API ENDPOINTS
// Get user balance
app.get('/api/credits/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const balance = await getUserBalance(userId);
    
    // 📊 LOG ALL BALANCE FETCHES
    console.log(`📡 [CREDITS-GET] Fetching balance for ${userId}: ${balance}`);
    
    res.json({ userId, balance });
  } catch (error) {
    console.error(`❌ [CREDITS-GET] Error fetching balance:`, error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// Get user transaction history
app.get('/api/credits/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await getUserTransactionHistory(userId);
    res.json({ userId, transactions });
  } catch (error) {
    console.error(`❌ [TRANSACTIONS-GET] Error fetching transactions:`, error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Add credits (admin only, or system operations)
app.post('/api/credits/:userId/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason = '', adminNotes = '' } = req.body;
    
    if (!amount || amount <= 0) {
      console.warn(`⚠️ [CREDITS-ADD] Invalid amount: ${amount}`);
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const oldBalance = await getUserBalance(userId);
    console.log(`💰 [CREDITS-ADD] Adding ${amount} to ${userId} (old balance: ${oldBalance}, reason: ${reason})`);
    
    const transaction = await addTransaction(userId, 'admin_add', amount, reason, adminNotes);
    
    if (!transaction) {
      console.warn(`⚠️ [CREDITS-ADD] Transaction failed for ${userId}`);
      return res.status(400).json({ error: 'Could not process transaction' });
    }
    
    const newBalance = await getUserBalance(userId);
    console.log(`✅ [CREDITS-ADD] Success: ${userId} balance updated ${oldBalance} → ${newBalance}`);
    
    res.json({ success: true, transaction, newBalance });
  } catch (error) {
    console.error(`❌ [CREDITS-ADD] Error:`, error);
    res.status(500).json({ error: 'Failed to add credits' });
  }
});

// Place bet (deduct credits)
app.post('/api/credits/:userId/bet', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, betDetails = '' } = req.body;
    
    if (!amount || amount <= 0) {
      console.warn(`⚠️ [CREDITS-BET] Invalid bet amount: ${amount}`);
      return res.status(400).json({ error: 'Invalid bet amount' });
    }
    
    const oldBalance = await getUserBalance(userId);
    console.log(`💰 [CREDITS-BET] Placing bet: userId=${userId}, amount=${amount}, oldBalance=${oldBalance}`);
    
    const transaction = await addTransaction(userId, 'bet_placed', -amount, betDetails);
    
    if (!transaction) {
      console.warn(`⚠️ [CREDITS-BET] Insufficient balance: ${userId} only has ${oldBalance}`);
      return res.status(400).json({ error: 'Insufficient credits' });
    }
    
    const newBalance = await getUserBalance(userId);
    console.log(`✅ [CREDITS-BET] Success: ${userId} balance updated ${oldBalance} → ${newBalance}`);
    
    res.json({ success: true, transaction, newBalance });
  } catch (error) {
    console.error(`❌ [CREDITS-BET] Error:`, error);
    res.status(500).json({ error: 'Failed to place bet' });
  }
});

// Refund bet
app.post('/api/credits/:userId/refund', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason = '' } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid refund amount' });
    }
    
    const transaction = await addTransaction(userId, 'bet_refunded', amount, reason);
    
    if (!transaction) {
      return res.status(400).json({ error: 'Could not process refund' });
    }
    
    const newBalance = await getUserBalance(userId);
    res.json({ success: true, transaction, newBalance });
  } catch (error) {
    console.error(`❌ [CREDITS-REFUND] Error:`, error);
    res.status(500).json({ error: 'Failed to refund bet' });
  }
});

// Win bet (add credits)
app.post('/api/credits/:userId/win', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, betDetails = '' } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid win amount' });
    }
    
    const transaction = await addTransaction(userId, 'bet_won', amount, betDetails);
    
    if (!transaction) {
      return res.status(400).json({ error: 'Could not process win' });
    }
    
    const newBalance = await getUserBalance(userId);
    res.json({ success: true, transaction, newBalance });
  } catch (error) {
    console.error(`❌ [CREDITS-WIN] Error:`, error);
    res.status(500).json({ error: 'Failed to process win' });
  }
});

// Cashout (deduct credits)
app.post('/api/credits/:userId/cashout', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid cashout amount' });
    }
    
    const transaction = await addTransaction(userId, 'cashout', -amount, 'User cashout');
    
    if (!transaction) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }
    
    const newBalance = await getUserBalance(userId);
    res.json({ success: true, transaction, newBalance });
  } catch (error) {
    console.error(`❌ [CREDITS-CASHOUT] Error:`, error);
    res.status(500).json({ error: 'Failed to process cashout' });
  }
});

// Get all user credits (admin view)
app.get('/api/credits-admin/all', (req, res) => {
  const allUsers = Object.entries(creditLedger).map(([userId, data]) => ({
    userId,
    balance: data.balance,
    transactionCount: data.transactions.length
  }));
  res.json(allUsers);
});

// ============================================================================
// 👥 USER MANAGEMENT API ENDPOINTS
// ============================================================================

// Get all users (shared across all devices)
app.get('/api/users', async (req, res) => {
  try {
    console.log(`📡 [USERS-GET] Fetching all users...`);
    
    const allUsers = await getAllUsers();
    
    // Fetch credits for each user from database
    const users = await Promise.all(allUsers.map(async (u) => {
      const userBalance = await getUserBalance(u.id);
      const userObj = {
        id: u.id,
        name: u.name,
        credits: userBalance || u.credits || 0,
        wins: u.wins || 0,
        losses: u.losses || 0,
        membershipStatus: u.membershipStatus || 'free',
        subscriptionDate: u.subscriptionDate
      };
      
      console.log(`✅ [USERS-GET] ${u.name} (${u.id}): credits=${userObj.credits}`);
      return userObj;
    }));
    
    console.log(`📋 [USERS] Returning ${users.length} users with verified credits`);
    res.json(users);
  } catch (error) {
    console.error(`❌ [USERS-GET] Error fetching users:`, error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📡 [USER-GET] Fetching user: ${userId}`);
    
    const user = await getUserById(userId);
    
    if (!user) {
      console.warn(`⚠️ [USER-GET] User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Get credits from database (source of truth)
    const userCredits = await getUserBalance(userId);
    
    console.log(`✅ [USER-GET] ${user.name} (${userId}): credits=${userCredits}`);

    res.json({
      id: user.id,
      name: user.name,
      credits: userCredits || user.credits || 0,
      wins: user.wins || 0,
      losses: user.losses || 0,
      membershipStatus: user.membershipStatus || 'free',
      subscriptionDate: user.subscriptionDate
    });
  } catch (error) {
    console.error(`❌ [USER-GET] Error fetching user:`, error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user
app.post('/api/users', async (req, res) => {
  try {
    const { name, password, initialCredits = 0 } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password required' });
    }

    const newUser = await createOrUpdateUser(name, password, initialCredits);
    
    if (!newUser) {
      return res.status(400).json({ error: 'User already exists or creation failed' });
    }

    res.json({
      id: newUser.id,
      name: newUser.name,
      credits: newUser.credits || initialCredits,
      wins: newUser.wins || 0,
      losses: newUser.losses || 0,
      membershipStatus: newUser.membershipStatus || 'free',
      subscriptionDate: newUser.subscriptionDate
    });
  } catch (error) {
    console.error(`❌ [USER-CREATE] Error:`, error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Authenticate user (login)
app.post('/api/users/auth', async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password required' });
    }

    const user = await authenticateUser(name, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get credits from database (source of truth)
    const userCredits = await getUserBalance(user.id);

    res.json({
      id: user.id,
      name: user.name,
      credits: userCredits || user.credits || 0,
      wins: user.wins || 0,
      losses: user.losses || 0,
      membershipStatus: user.membershipStatus || 'free',
      subscriptionDate: user.subscriptionDate
    });
  } catch (error) {
    console.error(`❌ [USER-AUTH] Error:`, error);
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
});

// Update user (admin only)
app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { wins, losses } = req.body;

    // Update user stats if provided
    if (wins !== undefined || losses !== undefined) {
      await updateUserStats(userId, wins, losses);
      console.log(`✅ [USER-UPDATE] Updated stats for ${userId}`);
    }

    // Fetch and return updated user
    const updatedUser = await getUserById(userId);
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userCredits = await getUserBalance(userId);

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      credits: userCredits || updatedUser.credits || 0,
      wins: updatedUser.wins,
      losses: updatedUser.losses,
      membershipStatus: updatedUser.membershipStatus,
      subscriptionDate: updatedUser.subscriptionDate
    });
  } catch (error) {
    console.error(`❌ [USER-UPDATE] Error:`, error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/*
================================
GAME HISTORY API ENDPOINTS
================================
*/

// Get game history for an arena
app.get('/api/games/history/:arenaId', async (req, res) => {
  try {
    const { arenaId } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const history = await getGameHistory(arenaId, limit);
    
    res.json({
      arenaId,
      count: history.length,
      games: history
    });
    
    console.log(`✅ [GAME-HISTORY] Fetched ${history.length} games for arena '${arenaId}'`);
  } catch (error) {
    console.error(`❌ [GAME-HISTORY] Error fetching history:`, error);
    res.status(500).json({ error: 'Failed to fetch game history' });
  }
});

// Add new game to history
app.post('/api/games/history', async (req, res) => {
  try {
    const gameHistoryRecord = req.body;

    if (!gameHistoryRecord) {
      return res.status(400).json({ error: 'Game history record required' });
    }

    const savedGame = await addGameHistory(gameHistoryRecord);
    
    if (!savedGame) {
      return res.status(500).json({ error: 'Failed to save game history' });
    }

    const arenaId = gameHistoryRecord.arenaId || 'default';
    console.log(`✅ [GAME-HISTORY] Saved game for arena '${arenaId}'`);
    
    res.status(201).json({
      success: true,
      gameId: savedGame.game_id,
      arenaId: savedGame.arena_id,
      gameNumber: savedGame.game_number,
      message: 'Game history saved successfully'
    });
  } catch (error) {
    console.error(`❌ [GAME-HISTORY] Error saving game:`, error);
    res.status(500).json({ error: 'Failed to save game history' });
  }
});

// Clear game history for an arena
app.delete('/api/games/history/:arenaId', async (req, res) => {
  try {
    const { arenaId } = req.params;

    const deletedCount = await clearGameHistory(arenaId);
    
    console.log(`✅ [GAME-HISTORY] Cleared ${deletedCount} games from arena '${arenaId}'`);
    
    res.json({
      success: true,
      arenaId,
      deletedCount,
      message: `Cleared ${deletedCount} games from arena '${arenaId}'`
    });
  } catch (error) {
    console.error(`❌ [GAME-HISTORY] Error clearing history:`, error);
    res.status(500).json({ error: 'Failed to clear game history' });
  }
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
  socket.on('set-arena', async (data) => {
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
      const coinsData = await calculateConnectedUsersCoins();
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
      
      // 🎯 NEW: Send complete arena state snapshot when arena changes
      // This ensures client gets ALL data from server as source of truth
      socket.emit('arena-state-snapshot', {
        arenaId: currentArenaId,
        gameState: {
          teamAGames: arenaState.teamAScore,
          teamBGames: arenaState.teamBScore,
          teamABalls: arenaState.teamABalls,
          teamBBalls: arenaState.teamBBalls,
          currentGameNumber: arenaState.currentGameNumber,
          teamAHasBreak: arenaState.teamAHasBreak,
          teamAQueue: arenaState.teamAQueue,
          teamBQueue: arenaState.teamBQueue,
          bookedBets: arenaState.bookedBets,
          nextTeamAQueue: arenaState.nextTeamAQueue,
          nextTeamBQueue: arenaState.nextTeamBQueue,
          nextBookedBets: arenaState.nextGameBets,
          totalBookedAmount: arenaState.totalBookedAmount,
          nextTotalBookedAmount: arenaState.nextTotalBookedAmount,
          isGameActive: arenaState.isGameActive,
          winner: arenaState.winner,
          gameInfo: arenaState.gameInfo
        },
        timestamp: Date.now()
      });
      console.log(`📡 [ARENA-SWITCH] Sent complete arena state snapshot to ${socket.id}`);
      
      // 🎮 NEW: Send game history when client joins arena
      try {
        const gameHistory = await getGameHistory(currentArenaId, 100);
        socket.emit('game-history-update', {
          arenaId: currentArenaId,
          games: gameHistory,
          timestamp: Date.now()
        });
        console.log(`✅ [GAME-HISTORY] Sent ${gameHistory.length} games to socket ${socket.id} on arena join`);
      } catch (error) {
        console.error(`❌ [GAME-HISTORY] Error fetching history on set-arena:`, error);
      }
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
  socket.on('request-game-state', async (data) => {
    const arenaId = data?.arenaId || currentArenaId;
    const arenaState = getGameState(arenaId);
    console.log(`📥 [REQUEST] Game state requested by ${socket.id} for arena '${arenaId}'`);
    socket.emit('game-state-update', { ...arenaState, arenaId });
    const coinsData = await calculateConnectedUsersCoins();
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
  socket.on('user-login', async (userData) => {
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
    const coinsData = await calculateConnectedUsersCoins();
    io.emit('connected-users-coins-update', coinsData);
    console.log(`📊 Connected users coins: ${coinsData.totalCoins} coins from ${coinsData.connectedUserCount} users`);
  });

  // Handle user logout - remove from connected users tracking
  socket.on('user-logout', async (userData) => {
    console.log(`User logged out: ${userData.name} (${userData.id})`);
    const existingUser = connectedUsers.get(socket.id);
    if (existingUser && existingUser.userId === userData.id) {
      connectedUsers.delete(socket.id);
      
      // Broadcast updated connected users coins to all clients
      const coinsData = await calculateConnectedUsersCoins();
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
    // 🎯 ARENA INDEPENDENCE: Only sending to arena '${arenaId}', not affecting other arenas
    io.to(`arena:${arenaId}`).emit('bet-update', data);
    console.log(`📤 [ARENA-INDEPENDENT] Broadcasted bet-update to arena '${arenaId}' ONLY`);
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
    const arenaLabel = getArenaLabel(arenaId);
    console.log(`📥 ${arenaLabel} Received game state update:`, actualGameState);
    
    const arenaState = getGameState(arenaId);
    
    // 🎯 ARENA INDEPENDENCE CHECK
    // Verify we're updating the correct arena
    const allArenaKeys = Object.keys(arenaGameStates);
    const allLabels = allArenaKeys.map(id => getArenaLabel(id)).join(' | ');
    console.log(`🏟️ [ARENA CHECK] Active arenas: ${allLabels} → Updating: ${arenaLabel}`);
    
    // Detect if a game was won (currentGameNumber increased)
    const gameWonDetected = actualGameState.currentGameNumber && 
                           actualGameState.currentGameNumber > arenaState.currentGameNumber;
    
    // Update server's game state with new values (ONLY for this arena)
    Object.assign(arenaState, actualGameState);
    console.log(`✅ ${arenaLabel} Updated. Other arenas isolated.`);
    
    // If a game was won, reset the timer
    if (gameWonDetected) {
      console.log(`🏆 ${arenaLabel} Game ${actualGameState.currentGameNumber} won - resetting timer`);
      resetServerTimer(arenaId);
    }
    
    // Broadcast the COMPLETE updated game state to ALL clients in the arena (like bet-update does)
    // This ensures all devices have identical data, even if they miss some intermediate updates
    io.to(`arena:${arenaId}`).emit('game-state-update', { ...arenaState, arenaId });
    console.log(`📤 ${arenaLabel} Broadcasted game-state-update`);
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
    
    // Broadcast to ALL clients in the SAME ARENA (including sender) for consistency
    io.to(`arena:${arenaId}`).emit('break-status-update', { ...data, arenaId });
    console.log(`📤 Broadcasted break-status-update to arena '${arenaId}'`);
  });

  // BET HISTORY IS NOW COMPLETELY LOCAL - NO SERVER SYNC
  // Removed game history update handler to prevent external clearing
  // Bet history is now a permanent, immutable ledger on each client

  // Handle total booked coins updates
  socket.on('total-booked-coins-update', (data) => {
    console.log('Received total booked coins update:', data);
    const arenaId = data.arenaId || 'default';
    const arenaState = getGameState(arenaId);
    if (data.totalBookedAmount !== undefined) arenaState.totalBookedAmount = data.totalBookedAmount;
    if (data.nextTotalBookedAmount !== undefined) arenaState.nextTotalBookedAmount = data.nextTotalBookedAmount;
    arenaState.lastUpdated = Date.now();
    
    // Broadcast to ALL clients in the SAME ARENA (including sender) for consistency
    io.to(`arena:${arenaId}`).emit('total-booked-coins-update', { 
      totalBookedAmount: arenaState.totalBookedAmount,
      nextTotalBookedAmount: arenaState.nextTotalBookedAmount,
      arenaId
    });
    console.log(`📤 Broadcasted total-booked-coins-update to arena '${arenaId}'`);
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
  socket.on('request-connected-users-data', async () => {
    console.log('Received connected users data request');
    
    // Force cleanup of stale connections before calculating
    const coinsData = await calculateConnectedUsersCoins();
    
    // Send to requesting client
    socket.emit('connected-users-coins-update', coinsData);
    
    // Also broadcast to all clients to ensure everyone has the latest data
    io.emit('connected-users-coins-update', coinsData);
    
    console.log(`📊 Sent connected users data: ${coinsData.totalCoins} coins from ${coinsData.connectedUserCount} users`);
  });

  // Handle clear all data - broadcast to ALL clients in the arena
  socket.on('clear-all-data', (data) => {
    const arenaId = data?.arenaId || 'default';
    console.log(`🗑️ [CLEAR-DATA] Received clear command for arena '${arenaId}' from socket ${socket.id}`);
    
    // Broadcast to ALL clients in this arena (including sender)
    console.log(`📡 [CLEAR-DATA] Broadcasting clear-all-data to arena '${arenaId}'`);
    io.to(`arena:${arenaId}`).emit('clear-all-data', data);
    
    console.log(`✅ [CLEAR-DATA] Clear command sent to all clients in arena '${arenaId}'`);
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
    console.log(`📥 [ARENA-INDEPENDENT] Received score update for arena '${arenaId}':`, actualScoreData);
    
    const arenaState = getGameState(arenaId);
    if (actualScoreData.teamAScore !== undefined) arenaState.teamAScore = actualScoreData.teamAScore;
    if (actualScoreData.teamBScore !== undefined) arenaState.teamBScore = actualScoreData.teamBScore;
    
    // Broadcast the COMPLETE updated scores to ALL clients in the arena (ONLY this arena)
    io.to(`arena:${arenaId}`).emit('score-update', { 
      teamAScore: arenaState.teamAScore, 
      teamBScore: arenaState.teamBScore,
      arenaId 
    });
    console.log(`📤 [ARENA-INDEPENDENT] Broadcasted score-update to arena '${arenaId}' ONLY`);
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

  /*
  ================================
  GAME HISTORY SOCKET.IO EVENTS
  ================================
  Real-time synchronization of game history across all clients in an arena
  */

  // Request game history for an arena
  socket.on('request-game-history', async (data) => {
    const arenaId = data?.arenaId || 'default';
    try {
      const gameHistory = await getGameHistory(arenaId, 100);
      console.log(`✅ [GAME-HISTORY] Sending ${gameHistory.length} games to socket ${socket.id} for arena '${arenaId}'`);
      socket.emit('game-history-update', {
        arenaId,
        games: gameHistory,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`❌ [GAME-HISTORY] Error fetching game history:`, error);
      socket.emit('game-history-error', { error: 'Failed to fetch game history' });
    }
  });

  // Broadcast new game to all clients in the arena
  socket.on('new-game-added', async (data) => {
    const arenaId = data?.arenaId || 'default';
    const gameHistoryRecord = data?.gameHistoryRecord;

    console.log(`📥 [GAME-HISTORY] Received 'new-game-added' event for arena '${arenaId}'`);
    console.log(`   Full data:`, JSON.stringify(data, null, 2));
    console.log(`   gameHistoryRecord:`, gameHistoryRecord);

    try {
      // 🎮 CRITICAL: Validate game data before saving
      if (!gameHistoryRecord || gameHistoryRecord.gameNumber === undefined) {
        console.warn(`⚠️ [GAME-HISTORY] Invalid game data received - missing gameNumber`);
        console.warn(`   gameHistoryRecord:`, gameHistoryRecord);
        console.warn(`   gameNumber value:`, gameHistoryRecord?.gameNumber);
        socket.emit('game-history-error', { error: 'Invalid game data' });
        return;
      }

      // Save to database
      const savedGame = await addGameHistory(gameHistoryRecord);
      
      console.log(`✅ [GAME-HISTORY] New game saved for arena '${arenaId}' - Game ID: ${savedGame.game_id}, Game #${savedGame.game_number}`);
      
      // 🎮 BROADCAST TO ALL CLIENTS (like game-state-update does)
      // This ensures all clients see the same data immediately
      io.to(`arena:${arenaId}`).emit('game-added', {
        arenaId,
        game: savedGame,
        timestamp: Date.now()
      });

      // 🎮 ALSO SEND COMPLETE GAME HISTORY (like game-state does)
      // This ensures all clients have the authoritative full history from server
      const completeHistory = await getGameHistory(arenaId, 100);
      io.to(`arena:${arenaId}`).emit('game-history-update', {
        arenaId,
        games: completeHistory,
        timestamp: Date.now()
      });

      console.log(`📢 [GAME-HISTORY] Broadcasted new game + complete history to ALL clients in arena '${arenaId}'`);
    } catch (error) {
      console.error(`❌ [GAME-HISTORY] Error adding game:`, error);
      socket.emit('game-history-error', { error: 'Failed to add game' });
    }
  });

  // Clear game history for an arena
  socket.on('clear-game-history', async (data) => {
    const arenaId = data?.arenaId || 'default';

    try {
      const deletedCount = await clearGameHistory(arenaId);
      
      console.log(`✅ [GAME-HISTORY] Cleared ${deletedCount} games from arena '${arenaId}'`);
      
      // Broadcast to ALL clients in this arena
      io.to(`arena:${arenaId}`).emit('game-history-cleared', {
        arenaId,
        deletedCount,
        timestamp: Date.now()
      });

      // 🎮 ALSO SEND EMPTY HISTORY SYNC (authoritative confirmation)
      io.to(`arena:${arenaId}`).emit('game-history-update', {
        arenaId,
        games: [],
        timestamp: Date.now()
      });

      console.log(`📢 [GAME-HISTORY] Broadcasted clear + empty history sync to arena '${arenaId}'`);
    } catch (error) {
      console.error(`❌ [GAME-HISTORY] Error clearing history:`, error);
      socket.emit('game-history-error', { error: 'Failed to clear game history' });
    }
  });

});


// Start server - listen on 0.0.0.0 for external connections (required for Render deployment)
const PORT = process.env.PORT || 3001;

// Initialize database and start server
async function startServer() {
  try {
    // Initialize PostgreSQL database
    if (process.env.DATABASE_URL) {
      console.log('🚀 [SERVER] Initializing PostgreSQL database...');
      await initializeDatabase();
      console.log('✅ [DATABASE] Ready for operations');
    } else {
      console.warn('⚠️ [SERVER] DATABASE_URL not set - using in-memory storage (data will be lost on restart)');
      console.warn('   Set DATABASE_URL environment variable to enable persistence');
    }

    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🎮 Game Bird server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ [SERVER] Failed to start:', error);
    process.exit(1);
  }
}

// Start the server
startServer();