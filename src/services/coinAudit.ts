/**
 * Coin Audit Service
 * Tracks total system coins before/after each game to ensure perfect conservation
 */

export interface CoinSnapshot {
  timestamp: number;
  totalCoins: number;
  userCount: number;
  userBalances: { [userId: string]: number };
  phase: 'pre-game' | 'bets-placed' | 'bets-matched' | 'post-game';
  description: string;
  arenaId: string;
}

export interface GameAudit {
  gameId: string;
  arenaId: string;
  preGameSnapshot: CoinSnapshot;
  postGameSnapshot: CoinSnapshot;
  coinDifference: number;
  isBalanced: boolean;
  betsProcessed: {
    matched: number;
    unmatchedRefunded: number;
    totalAmount: number;
  };
  winnerGain: number;
  loserLoss: number;
  createdCoins: number; // Should ALWAYS be 0
}

export interface CreditTransaction {
  id: string; // Unique transaction ID
  timestamp: number;
  userId: string;
  userName: string;
  type: 'bet_deducted' | 'credits_added' | 'bet_refund' | 'win_payout' | 'cashout' | 'subscription' | 'system_audit' | 'coin_loss_detected';
  amount: number; // Positive for additions, negative for deductions (though typically stored as absolute value and type indicates direction)
  newBalance: number; // User's balance AFTER this transaction
  gameNumber?: number; // Optional game number if related to a game
  betId?: string; // Optional bet ID if related to a bet
  details?: string; // Additional human-readable details
}

class CoinAuditService {
  private snapshots: Map<string, CoinSnapshot[]> = new Map();
  private gameAudits: Map<string, GameAudit> = new Map();
  private transactionLog: CreditTransaction[] = [];

  /**
   * Create a snapshot of all user balances
   */
  takeSnapshot(
    users: any[],
    phase: 'pre-game' | 'bets-placed' | 'bets-matched' | 'post-game',
    description: string,
    arenaId: string
  ): CoinSnapshot {
    const userBalances: { [userId: string]: number } = {};
    let totalCoins = 0;

    users.forEach(user => {
      userBalances[user.id] = user.credits || 0;
      totalCoins += user.credits || 0;
    });

    const snapshot: CoinSnapshot = {
      timestamp: Date.now(),
      totalCoins,
      userCount: users.length,
      userBalances,
      phase,
      description,
      arenaId,
    };

    console.log(`📊 [COIN-AUDIT] Snapshot (${phase}): ${description}`);
    console.log(`   Total coins: ${totalCoins} across ${users.length} users`);

    // Store snapshot
    if (!this.snapshots.has(arenaId)) {
      this.snapshots.set(arenaId, []);
    }
    this.snapshots.get(arenaId)!.push(snapshot);

    return snapshot;
  }

  /**
   * Begin audit for a game - takes pre-game snapshot
   */
  startGameAudit(
    gameId: string,
    arenaId: string,
    users: any[]
  ): CoinSnapshot {
    return this.takeSnapshot(
      users,
      'pre-game',
      `Game ${gameId} starting`,
      arenaId
    );
  }

  /**
   * End audit for a game - takes post-game snapshot and compares
   */
  endGameAudit(
    gameId: string,
    arenaId: string,
    users: any[],
    betsProcessed: {
      matched: number;
      unmatchedRefunded: number;
      totalAmount: number;
    },
    winnerGain: number,
    loserLoss: number
  ): GameAudit {
    const postGameSnapshot = this.takeSnapshot(
      users,
      'post-game',
      `Game ${gameId} ended`,
      arenaId
    );

    // Get pre-game snapshot
    const snapshots = this.snapshots.get(arenaId) || [];
    const preGameSnapshot = snapshots[snapshots.length - 2] || snapshots[0];

    // Calculate differences
    const coinDifference =
      postGameSnapshot.totalCoins - preGameSnapshot.totalCoins;
    const createdCoins = Math.max(0, coinDifference);

    const audit: GameAudit = {
      gameId,
      arenaId,
      preGameSnapshot,
      postGameSnapshot,
      coinDifference,
      isBalanced: coinDifference === 0,
      betsProcessed,
      winnerGain,
      loserLoss,
      createdCoins,
    };

    // Store audit
    this.gameAudits.set(gameId, audit);

    // Log audit result
    this.logAuditResult(audit);

    return audit;
  }

  /**
   * Check if winner gain matches loser loss
   */
  private logAuditResult(audit: GameAudit): void {
    const status = audit.isBalanced ? '✅ BALANCED' : '❌ UNBALANCED';

    console.log(`\n🎮 [GAME-AUDIT] Game ${audit.gameId} ${status}`);
    console.log(`   Pre-game total:  ${audit.preGameSnapshot.totalCoins} coins`);
    console.log(
      `   Post-game total: ${audit.postGameSnapshot.totalCoins} coins`
    );
    console.log(`   Difference:      ${audit.coinDifference} coins`);
    console.log(`   Winner gain:     ${audit.winnerGain} coins`);
    console.log(`   Loser loss:      ${audit.loserLoss} coins`);
    console.log(`   Coins created:   ${audit.createdCoins} coins`);

    if (!audit.isBalanced) {
      console.error(
        `   ❌ CRITICAL ERROR: System created ${audit.createdCoins} coins!`
      );
      console.error(`   ❌ FAILSAFE TRIGGERED: Coin conservation violated!`);
    }

    if (audit.winnerGain !== audit.loserLoss) {
      console.error(
        `   ❌ CRITICAL ERROR: Winner gain (${audit.winnerGain}) ≠ Loser loss (${audit.loserLoss})`
      );
    }

    console.log('');
  }

  /**
   * Verify game audit and raise error if not balanced (failsafe)
   */
  verifyGameAudit(gameId: string): boolean {
    const audit = this.gameAudits.get(gameId);
    if (!audit) {
      console.warn(`⚠️ [COIN-AUDIT] No audit found for game ${gameId}`);
      return false;
    }

    const isValid = audit.isBalanced && audit.winnerGain === audit.loserLoss;

    if (!isValid) {
      const errorMsg = `🚨 [FAILSAFE] Coin mismatch detected in game ${gameId}:
        - Balanced: ${audit.isBalanced} (difference: ${audit.coinDifference})
        - Winner gain: ${audit.winnerGain}, Loser loss: ${audit.loserLoss}
        - Coins created: ${audit.createdCoins}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    console.log(`✅ [FAILSAFE] Game ${gameId} audit verified - coins are balanced`);
    return true;
  }

  /**
   * Get all audits for an arena
   */
  getArenaAudits(arenaId: string): GameAudit[] {
    const audits: GameAudit[] = [];
    this.gameAudits.forEach(audit => {
      if (audit.arenaId === arenaId) {
        audits.push(audit);
      }
    });
    return audits;
  }

  /**
   * Get audit summary
   */
  getAuditSummary(arenaId?: string): {
    totalGames: number;
    balancedGames: number;
    unbalancedGames: number;
    totalCoinsCreated: number;
    issues: string[];
  } {
    const audits = arenaId
      ? this.getArenaAudits(arenaId)
      : Array.from(this.gameAudits.values());

    const issues: string[] = [];
    let totalCoinsCreated = 0;

    audits.forEach(audit => {
      if (!audit.isBalanced) {
        issues.push(
          `Game ${audit.gameId}: Created ${audit.createdCoins} coins`
        );
        totalCoinsCreated += audit.createdCoins;
      }

      if (audit.winnerGain !== audit.loserLoss) {
        issues.push(
          `Game ${audit.gameId}: Winner gain (${audit.winnerGain}) ≠ Loser loss (${audit.loserLoss})`
        );
      }
    });

    return {
      totalGames: audits.length,
      balancedGames: audits.filter(a => a.isBalanced).length,
      unbalancedGames: audits.filter(a => !a.isBalanced).length,
      totalCoinsCreated,
      issues,
    };
  }

  /**
   * Export audit data for analysis
   */
  exportAuditData(arenaId?: string): string {
    const audits = arenaId
      ? this.getArenaAudits(arenaId)
      : Array.from(this.gameAudits.values());

    const summary = this.getAuditSummary(arenaId);

    let csv =
      'Game ID,Arena,Pre-Game Total,Post-Game Total,Difference,Balanced,Winner Gain,Loser Loss,Coins Created\n';

    audits.forEach(audit => {
      csv += `${audit.gameId},${audit.arenaId},${audit.preGameSnapshot.totalCoins},${audit.postGameSnapshot.totalCoins},${audit.coinDifference},${audit.isBalanced ? 'YES' : 'NO'},${audit.winnerGain},${audit.loserLoss},${audit.createdCoins}\n`;
    });

    csv += '\n\nSUMMARY\n';
    csv += `Total Games,${summary.totalGames}\n`;
    csv += `Balanced Games,${summary.balancedGames}\n`;
    csv += `Unbalanced Games,${summary.unbalancedGames}\n`;
    csv += `Total Coins Created,${summary.totalCoinsCreated}\n`;

    if (summary.issues.length > 0) {
      csv += '\n\nISSUES\n';
      summary.issues.forEach(issue => {
        csv += `"${issue}"\n`;
      });
    }

    return csv;
  }

  /**
   * Get snapshots for an arena
   */
  getSnapshots(arenaId: string): CoinSnapshot[] {
    return this.snapshots.get(arenaId) || [];
  }

  /**
   * Get last game audit for an arena
   */
  getLastGameAudit(arenaId: string): GameAudit | null {
    const audits = this.getArenaAudits(arenaId);
    return audits.length > 0 ? audits[audits.length - 1] : null;
  }

  /**
   * Get current total coins for an arena (from last snapshot)
   */
  getCurrentTotalCoins(arenaId: string): number {
    const snapshots = this.snapshots.get(arenaId) || [];
    if (snapshots.length === 0) return 0;
    return snapshots[snapshots.length - 1].totalCoins;
  }

  /**
   * Log a credit transaction for detailed tracking
   */
  logCreditTransaction(
    userId: string,
    userName: string,
    type: CreditTransaction['type'],
    amount: number,
    newBalance: number,
    gameNumber?: number,
    betId?: string,
    details?: string
  ): void {
    const transaction: CreditTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      userId,
      userName,
      type,
      amount,
      newBalance,
      gameNumber,
      betId,
      details
    };
    this.transactionLog.push(transaction);
    console.log(`💸 [TRANSACTION] ${type} for ${userName} (${userId}): ${amount} coins. New balance: ${newBalance}. Game: ${gameNumber || 'N/A'}, Bet: ${betId || 'N/A'}`);
  }

  /**
   * Get transaction log for debugging
   */
  getTransactionLog(gameId?: number): CreditTransaction[] {
    if (gameId) {
      return this.transactionLog.filter(t => t.gameNumber === gameId);
    }
    return this.transactionLog;
  }

  /**
   * Clear all audit data (use cautiously)
   */
  clearAuditData(): void {
    this.snapshots.clear();
    this.gameAudits.clear();
    this.transactionLog = [];
    console.log('🧹 [COIN-AUDIT] All audit data cleared');
  }
}

// Export singleton instance
export const coinAuditService = new CoinAuditService();

