// Quick script to test bet receipt creation via the server API
// This simulates what happens when a game is won

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';

async function testBetReceipt() {
  try {
    // First, let's manually create a bet receipt for Isaiah
    console.log('🧪 Testing bet receipt system for Isaiah...\n');
    
    // We need to use the server's internal Socket.IO or REST API
    // Since we don't have a direct REST endpoint, let's at least verify Isaiah exists
    
    const usersResponse = await fetch(`${API_URL}/api/users`);
    const users = await usersResponse.json();
    
    console.log('📋 Available users:');
    users.forEach(u => console.log(`  - ${u.name} (ID: ${u.id}, Credits: ${u.credits})`));
    
    const isaiah = users.find(u => u.name === 'Isaiah');
    if (isaiah) {
      console.log(`\n✅ Found Isaiah! ID: ${isaiah.id}`);
      console.log(`\n📊 Isaiah's details:`);
      console.log(`  Name: ${isaiah.name}`);
      console.log(`  ID: ${isaiah.id}`);
      console.log(`  Credits: ${isaiah.credits}`);
    } else {
      console.log('\n❌ Isaiah not found');
    }
    
    // Check bet receipts for Isaiah (would need the actual userId)
    if (isaiah) {
      try {
        const receiptsResponse = await fetch(`${API_URL}/api/bet-receipts/${isaiah.id}`);
        if (receiptsResponse.ok) {
          const receipts = await receiptsResponse.json();
          console.log(`\n📥 Bet receipts for Isaiah: ${receipts.length}`);
          if (receipts.length > 0) {
            console.log('Receipts:');
            receipts.forEach(r => console.log(`  - Game ${r.gameNumber}: ${r.amount} coins, Won: ${r.won}`));
          }
        }
      } catch (err) {
        console.log('\nℹ️ Could not fetch receipts (API might not support direct fetch)');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBetReceipt();
