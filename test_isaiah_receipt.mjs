import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testIsaiahReceipt() {
  try {
    console.log('🧪 Creating test bet receipt for Isaiah...\n');
    
    // Isaiah's ID from the API response
    const isaiahId = 'user-1764131013219-6xf9nf90d';
    
    // Insert a WIN bet receipt
    const result1 = await pool.query(`
      INSERT INTO bet_receipts (
        receipt_id, user_id, user_name, arena_id, game_number, team_side, 
        team_name, opponent_name, winning_team, amount, won, transaction_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (receipt_id) DO NOTHING
      RETURNING *;
    `, [
      `receipt-isaiah-001-${Date.now()}`,
      isaiahId,
      'Isaiah',
      'one_pocket',
      1,
      'A',
      'Team A',
      'Team B',
      'A',
      100,
      true,
      'bet'
    ]);
    
    console.log('✅ WIN bet inserted for Isaiah');
    
    // Insert a LOSS bet receipt
    const result2 = await pool.query(`
      INSERT INTO bet_receipts (
        receipt_id, user_id, user_name, arena_id, game_number, team_side, 
        team_name, opponent_name, winning_team, amount, won, transaction_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (receipt_id) DO NOTHING
      RETURNING *;
    `, [
      `receipt-isaiah-002-${Date.now()}`,
      isaiahId,
      'Isaiah',
      'one_pocket',
      2,
      'B',
      'Team B',
      'Team A',
      'A',
      50,
      false,
      'bet'
    ]);
    
    console.log('✅ LOSS bet inserted for Isaiah');
    
    // Verify
    const countResult = await pool.query(`
      SELECT COUNT(*) as count FROM bet_receipts 
      WHERE user_id = $1 AND arena_id = 'one_pocket'
    `, [isaiahId]);
    
    console.log(`\n✅ Isaiah now has ${countResult.rows[0].count} bet receipts in database`);
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testIsaiahReceipt();
