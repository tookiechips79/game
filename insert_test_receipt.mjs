import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function insertTestReceipt() {
  try {
    console.log('📡 Connecting to Render PostgreSQL...');
    
    // Insert a WIN
    const result = await pool.query(`
      INSERT INTO bet_receipts (
        receipt_id, user_id, user_name, arena_id, game_number, team_side, 
        team_name, opponent_name, winning_team, amount, won, transaction_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (receipt_id) DO NOTHING
      RETURNING *;
    `, [
      `receipt-111-001-${Date.now()}`,  // receipt_id
      '111',                             // user_id
      'Robert',                          // user_name
      'one_pocket',                      // arena_id
      1,                                 // game_number
      'A',                               // team_side
      'Player A',                        // team_name
      'Player B',                        // opponent_name
      'A',                               // winning_team
      100,                               // amount
      true,                              // won
      'bet'                              // transaction_type
    ]);
    
    console.log('✅ Test WIN receipt inserted:', result.rows[0]?.receipt_id);
    
    // Insert a LOSS
    const result2 = await pool.query(`
      INSERT INTO bet_receipts (
        receipt_id, user_id, user_name, arena_id, game_number, team_side, 
        team_name, opponent_name, winning_team, amount, won, transaction_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (receipt_id) DO NOTHING
      RETURNING *;
    `, [
      `receipt-111-002-${Date.now()}`,  // receipt_id
      '111',                             // user_id
      'Robert',                          // user_name
      'one_pocket',                      // arena_id
      2,                                 // game_number
      'B',                               // team_side
      'Player X',                        // team_name
      'Player Y',                        // opponent_name
      'A',                               // winning_team
      50,                                // amount
      false,                             // won
      'bet'                              // transaction_type
    ]);
    
    console.log('✅ Test LOSS receipt inserted:', result2.rows[0]?.receipt_id);
    
    // Verify counts
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM bet_receipts WHERE user_id = '111' AND arena_id = 'one_pocket';
    `);
    console.log(`\n✅ User 111 now has ${countResult.rows[0].count} receipts in one_pocket`);
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertTestReceipt();
