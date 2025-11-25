/**
 * PostgreSQL Database Module
 * Handles all database operations for users and credits
 * 
 * STUB VERSION: Provides graceful fallback when PostgreSQL is not configured
 */

// Attempt to import pg if available
let Pool = null;
try {
  const pgModule = await import('pg');
  Pool = pgModule.Pool;
} catch (error) {
  console.warn('⚠️ [DB] pg module not available, using stub mode');
}

// Database connection pool (stub)
// Only create pool if both pg module is available AND DATABASE_URL is set
const pool = (Pool && process.env.DATABASE_URL) ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
}) : null;

// Log connection
if (pool) {
  pool.on('connect', () => {
    console.log('✅ [DB] Connected to PostgreSQL');
  });

  pool.on('error', (err) => {
    console.error('❌ [DB] Unexpected error on idle client:', err);
  });
}

// IN-MEMORY STORAGE (Stub Mode)
// When PostgreSQL is not available, store data in memory
const inMemoryGameHistory = {}; // { arenaId: [games] }
const inMemoryBetReceipts = []; // In-memory storage for bet receipts

/**
 * Initialize database tables (create if not exists)
 */
async function initializeDatabase() {
  if (!pool) {
    console.warn('⚠️ [DB] PostgreSQL not configured, skipping initialization');
    return;
  }

  try {
    console.log('📡 [DB] Initializing database tables...');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        membershipStatus VARCHAR(50) DEFAULT 'inactive',
        subscriptionDate BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ [DB] Users table ready');

    // Credits table (balance per user)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS credits (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(10, 2) DEFAULT 1000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ [DB] Credits table ready');

    // Transactions table (immutable ledger)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        old_balance DECIMAL(10, 2),
        new_balance DECIMAL(10, 2),
        reason TEXT,
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
    `);
    console.log('✅ [DB] Transactions table ready');

    // Game History table - immutable record of all games
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_history (
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
        bets_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_game_history_arena_id ON game_history(arena_id);
      CREATE INDEX IF NOT EXISTS idx_game_history_game_number ON game_history(game_number);
      CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at);
    `);
    console.log('✅ [DB] Game History table ready');

    // Create Bet Receipts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bet_receipts (
        id SERIAL PRIMARY KEY,
        receipt_id VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        user_name VARCHAR(255),
        arena_id VARCHAR(50) NOT NULL DEFAULT 'default',
        game_number INTEGER NOT NULL,
        team_side VARCHAR(1) NOT NULL,
        team_name VARCHAR(255),
        opponent_name VARCHAR(255),
        winning_team VARCHAR(1),
        amount DECIMAL(10, 2) NOT NULL,
        won BOOLEAN DEFAULT FALSE,
        transaction_type VARCHAR(50) DEFAULT 'bet',
        game_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_bet_receipts_user_id ON bet_receipts(user_id);
      CREATE INDEX IF NOT EXISTS idx_bet_receipts_arena_id ON bet_receipts(arena_id);
      CREATE INDEX IF NOT EXISTS idx_bet_receipts_created_at ON bet_receipts(created_at);
      CREATE INDEX IF NOT EXISTS idx_bet_receipts_game_number ON bet_receipts(game_number);
    `);
    console.log('✅ [DB] Bet Receipts table ready');

    // Create default admin user
    await createOrUpdateUser('admin-default', 'Admin', 'admin', 1000);
    console.log('✅ [DB] Admin user ensured');

    console.log('✅ [DB] Database initialization complete');
  } catch (error) {
    console.error('❌ [DB] Error initializing database:', error);
    throw error;
  }
}

/**
 * Create or update a user
 */
async function createOrUpdateUser(userId, name, password, initialCredits = 1000) {
  if (!pool) {
    console.warn('⚠️ [DB] PostgreSQL not configured, skipping user creation');
    return { id: userId, name, password };
  }

  try {
    // Check if user exists
    const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length > 0) {
      console.log(`ℹ️ [DB] User already exists: ${userId}`);
      return { id: userId, name, password };
    }

    // Create new user
    await pool.query(
      'INSERT INTO users (id, name, password) VALUES ($1, $2, $3)',
      [userId, name, password]
    );

    // Create credit entry
    await pool.query(
      'INSERT INTO credits (user_id, balance) VALUES ($1, $2)',
      [userId, initialCredits]
    );

    // Record initial transaction
    await pool.query(
      `INSERT INTO transactions (user_id, type, amount, old_balance, new_balance, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, 'admin_add', initialCredits, 0, initialCredits, 'Initial account balance']
    );

    console.log(`✅ [DB] User created: ${userId} with ${initialCredits} credits`);
    return { id: userId, name, password };
  } catch (error) {
    if (error.code === '23505') {
      console.log(`ℹ️ [DB] User already exists: ${userId}`);
      return { id: userId, name, password };
    }
    console.error('❌ [DB] Error creating user:', error);
    throw error;
  }
}

/**
 * Get user by ID
 */
async function getUserById(userId) {
  if (!pool) {
    console.warn('⚠️ [DB] PostgreSQL not configured, returning null');
    return null;
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.password, u.wins, u.losses, u.membershipStatus, u.subscriptionDate,
              c.balance as credits
       FROM users u
       LEFT JOIN credits c ON u.id = c.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      password: row.password,
      credits: parseFloat(row.credits) || 1000,
      wins: row.wins,
      losses: row.losses,
      membershipStatus: row.membershipStatus,
      subscriptionDate: row.subscriptionDate,
    };
  } catch (error) {
    console.error('❌ [DB] Error getting user:', error);
    throw error;
  }
}

/**
 * Get user by name and password (authentication)
 */
async function authenticateUser(name, password) {
  if (!pool) {
    console.warn('⚠️ [DB] PostgreSQL not configured, returning null');
    return null;
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.password, u.wins, u.losses, u.membershipStatus, u.subscriptionDate,
              c.balance as credits
       FROM users u
       LEFT JOIN credits c ON u.id = c.user_id
       WHERE u.name = $1 AND u.password = $2`,
      [name, password]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      password: row.password,
      credits: parseFloat(row.credits) || 1000,
      wins: row.wins,
      losses: row.losses,
      membershipStatus: row.membershipStatus,
      subscriptionDate: row.subscriptionDate,
    };
  } catch (error) {
    console.error('❌ [DB] Error authenticating user:', error);
    throw error;
  }
}

/**
 * Get all users
 */
async function getAllUsers() {
  if (!pool) {
    console.warn('⚠️ [DB] PostgreSQL not configured, returning empty array');
    return [];
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.password, u.wins, u.losses, u.membershipStatus, u.subscriptionDate,
              c.balance as credits
       FROM users u
       LEFT JOIN credits c ON u.id = c.user_id
       ORDER BY u.created_at`
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      password: row.password,
      credits: parseFloat(row.credits) || 1000,
      wins: row.wins,
      losses: row.losses,
      membershipStatus: row.membershipStatus,
      subscriptionDate: row.subscriptionDate,
    }));
  } catch (error) {
    console.error('❌ [DB] Error getting all users:', error);
    throw error;
  }
}

/**
 * Get user's balance
 */
async function getUserBalance(userId) {
  if (!pool) {
    console.warn('⚠️ [DB] PostgreSQL not configured, returning default 1000');
    return 1000;
  }

  try {
    const result = await pool.query(
      'SELECT balance FROM credits WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Check if user exists first (foreign key constraint)
      const userExists = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );

      if (userExists.rows.length === 0) {
        console.warn(`⚠️ [DB] User does not exist: ${userId}, returning default 1000`);
        return 1000;
      }

      // User exists, initialize credits
      await pool.query(
        'INSERT INTO credits (user_id, balance) VALUES ($1, $2)',
        [userId, 1000]
      );
      return 1000;
    }

    return parseFloat(result.rows[0].balance);
  } catch (error) {
    console.error('❌ [DB] Error getting user balance:', error);
    throw error;
  }
}

/**
 * Add transaction (immutable ledger entry)
 */
async function addTransaction(userId, type, amount, reason = '', adminNotes = '') {
  if (!pool) {
    console.warn('⚠️ [DB] PostgreSQL not configured, skipping transaction');
    return null;
  }

  try {
    // Ensure user exists
    await createOrUpdateUser(userId, `User-${userId}`, 'default');

    // Get current balance
    const currentBalance = await getUserBalance(userId);
    const newBalance = currentBalance + amount;

    // Prevent negative balance
    if (newBalance < 0) {
      console.warn(`⚠️ [DB] Insufficient balance for ${userId}: current=${currentBalance}, requested=${amount}`);
      return null;
    }

    // Update balance
    await pool.query(
      'UPDATE credits SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [newBalance, userId]
    );

    // Record transaction
    const transactionResult = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, old_balance, new_balance, reason, admin_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, type, amount, currentBalance, newBalance, reason, adminNotes]
    );

    console.log(
      `💰 [DB] Transaction recorded: ${userId} ${type} ${amount} (${currentBalance} → ${newBalance})`
    );

    return transactionResult.rows[0];
  } catch (error) {
    console.error('❌ [DB] Error adding transaction:', error);
    throw error;
  }
}

/**
 * Get user's transaction history
 */
async function getUserTransactionHistory(userId) {
  if (!pool) {
    console.warn('⚠️ [DB] PostgreSQL not configured, returning empty array');
    return [];
  }

  try {
    const result = await pool.query(
      `SELECT id, type, amount, old_balance, new_balance, reason, admin_notes, created_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error('❌ [DB] Error getting transaction history:', error);
    throw error;
  }
}

/**
 * Update user stats (wins/losses)
 */
async function updateUserStats(userId, wins, losses) {
  if (!pool) {
    console.warn('⚠️ [DB] PostgreSQL not configured, skipping stats update');
    return;
  }

  try {
    await pool.query(
      'UPDATE users SET wins = $1, losses = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [wins, losses, userId]
    );

    console.log(`✅ [DB] Updated stats for ${userId}: wins=${wins}, losses=${losses}`);
  } catch (error) {
    console.error('❌ [DB] Error updating user stats:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  if (!pool) {
    console.warn('⚠️ [DB] PostgreSQL not configured, returning zero stats');
    return { users: 0, transactions: 0, totalCredits: 0 };
  }

  try {
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const transactionsCount = await pool.query('SELECT COUNT(*) as count FROM transactions');
    const totalCredits = await pool.query('SELECT SUM(balance) as total FROM credits');

    return {
      users: parseInt(usersCount.rows[0].count),
      transactions: parseInt(transactionsCount.rows[0].count),
      totalCredits: parseFloat(totalCredits.rows[0].total) || 0,
    };
  } catch (error) {
    console.error('❌ [DB] Error getting stats:', error);
    throw error;
  }
}

/**
 * Add game history record
 */
async function addGameHistory(gameHistoryRecord) {
  const gameId = `game-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const arenaId = gameHistoryRecord.arenaId || 'default';
  
  if (!pool) {
    // Stub mode: store in memory
    if (!inMemoryGameHistory[arenaId]) {
      inMemoryGameHistory[arenaId] = [];
    }
    
    const gameRecord = {
      id: Date.now(), // Simulated ID
      game_id: gameId,
      arena_id: arenaId,
      game_number: gameHistoryRecord.gameNumber || 0,
      team_a_name: gameHistoryRecord.teamAName || 'Team A',
      team_b_name: gameHistoryRecord.teamBName || 'Team B',
      team_a_score: gameHistoryRecord.teamAScore || 0,
      team_b_score: gameHistoryRecord.teamBScore || 0,
      winning_team: gameHistoryRecord.winningTeam || null,
      team_a_balls: gameHistoryRecord.teamABalls || 0,
      team_b_balls: gameHistoryRecord.teamBBalls || 0,
      breaking_team: gameHistoryRecord.breakingTeam || 'A',
      duration: gameHistoryRecord.duration || 0,
      total_amount: gameHistoryRecord.totalAmount || 0,
      bets_data: gameHistoryRecord.bets || {},
      created_at: new Date().toISOString()
    };
    
    inMemoryGameHistory[arenaId].unshift(gameRecord); // Add to front
    console.log(`✅ [DB] Added game history (IN-MEMORY): ${gameId} to arena '${arenaId}'`);
    return gameRecord;
  }

  try {
    const result = await pool.query(`
      INSERT INTO game_history (
        game_id, arena_id, game_number, team_a_name, team_b_name,
        team_a_score, team_b_score, winning_team, team_a_balls, team_b_balls,
        breaking_team, duration, total_amount, bets_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `, [
      gameId, arenaId, gameHistoryRecord.gameNumber || 0,
      gameHistoryRecord.teamAName || 'Team A',
      gameHistoryRecord.teamBName || 'Team B',
      gameHistoryRecord.teamAScore || 0,
      gameHistoryRecord.teamBScore || 0,
      gameHistoryRecord.winningTeam || null,
      gameHistoryRecord.teamABalls || 0,
      gameHistoryRecord.teamBBalls || 0,
      gameHistoryRecord.breakingTeam || 'A',
      gameHistoryRecord.duration || 0,
      gameHistoryRecord.totalAmount || 0,
      JSON.stringify(gameHistoryRecord.bets || {})
    ]);

    console.log(`✅ [DB] Added game history (PostgreSQL): ${gameId} to arena '${arenaId}'`);
    return result.rows[0];
  } catch (error) {
    console.error('❌ [DB] Error adding game history:', error);
    throw error;
  }
}

/**
 * Get game history for an arena
 */
async function getGameHistory(arenaId = 'default', limit = 100) {
  if (!pool) {
    // Stub mode: return from memory
    const games = inMemoryGameHistory[arenaId] || [];
    console.log(`✅ [DB] Retrieved ${games.length} games from arena '${arenaId}' (IN-MEMORY)`);
    return games.slice(0, limit).map(row => ({
      id: row.game_id || row.id,
      gameNumber: row.game_number || row.gameNumber,
      teamAName: row.team_a_name || row.teamAName,
      teamBName: row.team_b_name || row.teamBName,
      teamAScore: row.team_a_score || row.teamAScore,
      teamBScore: row.team_b_score || row.teamBScore,
      winningTeam: row.winning_team || row.winningTeam,
      teamABalls: row.team_a_balls || row.teamABalls,
      teamBBalls: row.team_b_balls || row.teamBBalls,
      breakingTeam: row.breaking_team || row.breakingTeam,
      duration: row.duration,
      totalAmount: row.total_amount || row.totalAmount || 0,  // ✅ Include totalAmount!
      arenaId: row.arena_id || row.arenaId,
      bets: typeof (row.bets_data || row.bets) === 'string' ? JSON.parse(row.bets_data || row.bets) : (row.bets_data || row.bets),
      timestamp: row.timestamp || new Date(row.created_at).getTime()
    }));
  }

  try {
    const result = await pool.query(
      'SELECT * FROM game_history WHERE arena_id = $1 ORDER BY created_at DESC LIMIT $2',
      [arenaId, limit]
    );

    console.log(`✅ [DB] Retrieved ${result.rows.length} games from arena '${arenaId}' (PostgreSQL)`);
    
    // Convert database row format to client format (snake_case to camelCase)
    return result.rows.map(row => ({
      id: row.game_id,
      gameNumber: row.game_number,
      teamAName: row.team_a_name,
      teamBName: row.team_b_name,
      teamAScore: row.team_a_score,
      teamBScore: row.team_b_score,
      winningTeam: row.winning_team,
      teamABalls: row.team_a_balls,
      teamBBalls: row.team_b_balls,
      breakingTeam: row.breaking_team,
      duration: row.duration,
      totalAmount: parseFloat(row.total_amount) || 0,  // ✅ Include totalAmount!
      arenaId: row.arena_id,
      bets: typeof row.bets_data === 'string' ? JSON.parse(row.bets_data) : row.bets_data,
      timestamp: new Date(row.created_at).getTime()
    }));
  } catch (error) {
    console.error('❌ [DB] Error getting game history:', error);
    throw error;
  }
}

/**
 * Clear game history for an arena
 */
async function clearGameHistory(arenaId = 'default') {
  if (!pool) {
    // Stub mode: clear from memory
    const count = (inMemoryGameHistory[arenaId] || []).length;
    inMemoryGameHistory[arenaId] = [];
    console.log(`✅ [DB] Cleared ${count} games from arena '${arenaId}' (IN-MEMORY)`);
    return count;
  }

  try {
    const result = await pool.query(
      'DELETE FROM game_history WHERE arena_id = $1',
      [arenaId]
    );

    console.log(`✅ [DB] Cleared ${result.rowCount} games from arena '${arenaId}' (PostgreSQL)`);
    return result.rowCount;
  } catch (error) {
    console.error('❌ [DB] Error clearing game history:', error);
    throw error;
  }
}

/**
 * Add a bet receipt to the database
 */
async function addBetReceipt(receiptData) {
  if (!pool) {
    // Stub mode: store in memory
    const receipt = {
      ...receiptData,
      id: receiptData.id || `bet-receipt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
    inMemoryBetReceipts.push(receipt);
    console.log(`✅ [DB] Bet receipt added to memory storage`);
    return receipt;
  }

  try {
    const result = await pool.query(`
      INSERT INTO bet_receipts (
        receipt_id, user_id, user_name, arena_id, game_number, team_side, 
        team_name, opponent_name, winning_team, amount, won, transaction_type, game_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (receipt_id) DO NOTHING
      RETURNING *;
    `, [
      receiptData.id,
      receiptData.userId,
      receiptData.userName,
      receiptData.arenaId || 'default',
      receiptData.gameNumber,
      receiptData.teamSide,
      receiptData.teamName,
      receiptData.opponentName,
      receiptData.winningTeam || null,
      receiptData.amount,
      receiptData.won || false,
      receiptData.transactionType || 'bet',
      JSON.stringify({
        teamAName: receiptData.teamAName,
        teamBName: receiptData.teamBName,
        teamAScore: receiptData.teamAScore,
        teamBScore: receiptData.teamBScore,
        winningTeam: receiptData.winningTeam,
        duration: receiptData.duration,
        timestamp: receiptData.timestamp
      })
    ]);

    if (result.rows.length > 0) {
      console.log(`✅ [DB] Bet receipt added for user ${receiptData.userId} on game #${receiptData.gameNumber}`);
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error('❌ [DB] Error adding bet receipt:', error);
    throw error;
  }
}

/**
 * Get bet receipts for a user
 */
async function getBetReceipts(userId, arenaId = 'default', limit = 250) {
  if (!pool) {
    // Stub mode: filter from memory
    return inMemoryBetReceipts
      .filter(r => r.userId === userId && r.arenaId === arenaId)
      .sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp))
      .slice(0, limit);
  }

  try {
    const result = await pool.query(`
      SELECT * FROM bet_receipts 
      WHERE user_id = $1 AND arena_id = $2 
      ORDER BY created_at DESC 
      LIMIT $3
    `, [userId, arenaId, limit]);

    console.log(`✅ [DB] Retrieved ${result.rows.length} bet receipts for user ${userId}`);
    return result.rows;
  } catch (error) {
    console.error('❌ [DB] Error getting bet receipts:', error);
    throw error;
  }
}

/**
 * Get all bet receipts for an arena (for broadcasts)
 */
async function getArenaAllBetReceipts(arenaId = 'default', limit = 250) {
  if (!pool) {
    // Stub mode: filter from memory
    return inMemoryBetReceipts
      .filter(r => r.arenaId === arenaId)
      .sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp))
      .slice(0, limit);
  }

  try {
    const result = await pool.query(`
      SELECT * FROM bet_receipts 
      WHERE arena_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `, [arenaId, limit]);

    console.log(`✅ [DB] Retrieved ${result.rows.length} bet receipts from arena ${arenaId}`);
    return result.rows;
  } catch (error) {
    console.error('❌ [DB] Error getting arena bet receipts:', error);
    throw error;
  }
}

/**
 * Clear all bet receipts for a user
 */
async function clearUserBetReceipts(userId) {
  if (!pool) {
    // Stub mode: remove from memory
    const originalLength = inMemoryBetReceipts.length;
    inMemoryBetReceipts = inMemoryBetReceipts.filter(r => r.userId !== userId);
    const clearedCount = originalLength - inMemoryBetReceipts.length;
    console.log(`✅ [DB] Cleared ${clearedCount} bet receipts for user ${userId} (IN-MEMORY)`);
    return clearedCount;
  }

  try {
    const result = await pool.query(
      'DELETE FROM bet_receipts WHERE user_id = $1',
      [userId]
    );

    console.log(`✅ [DB] Cleared ${result.rowCount} bet receipts for user ${userId}`);
    return result.rowCount;
  } catch (error) {
    console.error('❌ [DB] Error clearing user bet receipts:', error);
    throw error;
  }
}

export {
  pool,
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
  addBetReceipt,
  getBetReceipts,
  getArenaAllBetReceipts,
  clearUserBetReceipts,
};

