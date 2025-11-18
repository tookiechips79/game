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
const pool = Pool ? new Pool({
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
      // Initialize if not exists
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
};

