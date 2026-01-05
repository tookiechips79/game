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
   * Recovery function: Attempt to fix balance inconsistencies
   */
  recoverBalanceInconsistency(
    gameId: string,
    users: any[],
    expectedDifference: number = 0
  ): { recovered: boolean; adjustments: any[] } {
    const audit = this.gameAudits.get(gameId);
    if (!audit) {
      console.error(`🚨 [RECOVERY] No audit found for game ${gameId}`);
      return { recovered: false, adjustments: [] };
    }

    const adjustments: any[] = [];
    const actualDifference = audit.coinDifference;

    // If the difference is not what we expected, we need to adjust
    if (actualDifference !== expectedDifference) {
      console.log(`🔧 [RECOVERY] Attempting to recover game ${gameId}`);
      console.log(`   Expected difference: ${expectedDifference}`);
      console.log(`   Actual difference: ${actualDifference}`);
      console.log(`   Coins created/lost: ${actualDifference - expectedDifference}`);

      // Find the user with the largest balance (likely the winner) to adjust
      let winnerUser = null;
      let maxBalance = 0;

      users.forEach(user => {
        if (user.credits > maxBalance) {
          maxBalance = user.credits;
          winnerUser = user;
        }
      });

      if (winnerUser && actualDifference > expectedDifference) {
        // Coins were created - reduce winner's balance
        const adjustment = actualDifference - expectedDifference;
        winnerUser.credits -= adjustment;

        adjustments.push({
          userId: winnerUser.id,
          userName: winnerUser.name,
          type: 'recovery_adjustment',
          amount: -adjustment,
          reason: `Recovered ${adjustment} coins created in game ${gameId}`
        });

        console.log(`✅ [RECOVERY] Reduced ${winnerUser.name}'s balance by ${adjustment} coins`);
      }

      // Re-verify the audit
      const postRecoverySnapshot = this.takeSnapshot(
        users,
        'post-recovery',
        `Game ${gameId} after recovery`,
        audit.arenaId
      );

      const newDifference = postRecoverySnapshot.totalCoins - audit.preGameSnapshot.totalCoins;

      if (newDifference === expectedDifference) {
        console.log(`✅ [RECOVERY] Successfully recovered game ${gameId}`);
        return { recovered: true, adjustments };
      } else {
        console.error(`❌ [RECOVERY] Recovery failed for game ${gameId}`);
        return { recovered: false, adjustments };
      }
    }

    console.log(`✅ [RECOVERY] No recovery needed for game ${gameId}`);
    return { recovered: true, adjustments: [] };
  }

  /**
   * Get recovery recommendations for unbalanced games
   */
  getRecoveryRecommendations(arenaId?: string): {
    gameId: string;
    issue: string;
    recommendedAction: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[] {
    const audits = arenaId
      ? this.getArenaAudits(arenaId)
      : Array.from(this.gameAudits.values());

    const recommendations: any[] = [];

    audits.forEach(audit => {
      if (!audit.isBalanced) {
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
        let recommendedAction = '';

        if (audit.createdCoins > 100) {
          severity = 'critical';
          recommendedAction = `Immediately investigate game ${audit.gameId} - ${audit.createdCoins} coins created`;
        } else if (audit.createdCoins > 50) {
          severity = 'high';
          recommendedAction = `Review game ${audit.gameId} - ${audit.createdCoins} coins created`;
        } else if (audit.createdCoins > 10) {
          severity = 'medium';
          recommendedAction = `Monitor game ${audit.gameId} - ${audit.createdCoins} coins created`;
        } else {
          severity = 'low';
          recommendedAction = `Log game ${audit.gameId} - ${audit.createdCoins} coins created`;
        }

        recommendations.push({
          gameId: audit.gameId,
          issue: `${audit.createdCoins} coins created`,
          recommendedAction,
          severity
        });
      }

      if (audit.winnerGain !== audit.loserLoss) {
        recommendations.push({
          gameId: audit.gameId,
          issue: `Winner gain (${audit.winnerGain}) ≠ Loser loss (${audit.loserLoss})`,
          recommendedAction: `Critical: Investigate payout calculation for game ${audit.gameId}`,
          severity: 'critical'
        });
      }
    });

    return recommendations.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * System health check - comprehensive validation
   */
  performSystemHealthCheck(arenaId?: string): {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
    summary: {
      totalGames: number;
      balancedGames: number;
      unbalancedGames: number;
      totalCoinsCreated: number;
      recentTransactions: number;
      lastAuditTime: number;
    };
  } {
    const summary = this.getAuditSummary(arenaId);
    const recommendations = this.getRecoveryRecommendations(arenaId);
    const issues: string[] = [];

    // Check for critical issues
    if (summary.unbalancedGames > 0) {
      issues.push(`${summary.unbalancedGames} games are unbalanced`);
    }

    if (summary.totalCoinsCreated > 0) {
      issues.push(`${summary.totalCoinsCreated} coins have been created/lost in the system`);
    }

    // Check recent transaction volume
    const recentTransactions = this.transactionLog.filter(t =>
      Date.now() - t.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    ).length;

    // Check last audit time
    const audits = arenaId ? this.getArenaAudits(arenaId) : Array.from(this.gameAudits.values());
    const lastAuditTime = audits.length > 0
      ? Math.max(...audits.map(a => a.postGameSnapshot.timestamp))
      : 0;

    const healthy = issues.length === 0;

    return {
      healthy,
      issues,
      recommendations: recommendations.map(r => r.recommendedAction),
      summary: {
        ...summary,
        recentTransactions,
        lastAuditTime
      }
    };
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

