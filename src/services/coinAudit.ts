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

class CoinAuditService {
  private snapshots: Map<string, CoinSnapshot[]> = new Map();
  private gameAudits: Map<string, GameAudit> = new Map();

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
        `   ❌ ERROR: System created ${audit.createdCoins} coins!`
      );
    }

    if (audit.winnerGain !== audit.loserLoss) {
      console.error(
        `   ❌ ERROR: Winner gain (${audit.winnerGain}) ≠ Loser loss (${audit.loserLoss})`
      );
    }

    console.log('');
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
   * Clear all audit data (use cautiously)
   */
  clearAuditData(): void {
    this.snapshots.clear();
    this.gameAudits.clear();
    console.log('🧹 [COIN-AUDIT] All audit data cleared');
  }
}

// Export singleton instance
export const coinAuditService = new CoinAuditService();

