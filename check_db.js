const db = require('./src/db/database.js');

async function checkDB() {
  try {
    // Check game history
    console.log('\n🔍 Checking Game History Table...');
    const pool = db.getPool();
    const historyResult = await pool.query(
      "SELECT COUNT(*) as count, arena_id FROM game_history GROUP BY arena_id;"
    );
    console.log('Game History by Arena:', historyResult.rows);

    // Check bet receipts
    console.log('\n🔍 Checking Bet Receipts Table...');
    const receiptsResult = await pool.query(
      "SELECT COUNT(*) as count, arena_id FROM bet_receipts GROUP BY arena_id;"
    );
    console.log('Bet Receipts by Arena:', receiptsResult.rows);

    // Check one_pocket receipts
    console.log('\n🔍 Checking one_pocket receipts in detail...');
    const oneReceipts = await pool.query(
      "SELECT id, user_id, bet_amount, won, arena_id FROM bet_receipts WHERE arena_id = 'one_pocket' LIMIT 5;"
    );
    console.log('One Pocket Receipts Sample:', oneReceipts.rows);

    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDB();
