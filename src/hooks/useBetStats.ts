import { useMemo } from 'react';
import { useUser } from '@/contexts/UserContext';

/**
 * ✅ SINGLE SOURCE OF TRUTH for bet statistics
 * Used by both Account tab and Bet History tab to ensure consistency
 */
export const useBetStats = (userId: string) => {
  const { getHardLedgerBetHistory } = useUser();
  const hardLedgerHistory = getHardLedgerBetHistory();

  return useMemo(() => {
    console.log(`📊 [useBetStats] Calculating for userId: ${userId}, total history length: ${hardLedgerHistory.length}`);
    
    // First, filter to only games where user has bets (same as HardLedgerBetHistory)
    const userBetHistory = hardLedgerHistory.filter(game => {
      const hasTeamABet = game.bets.teamA.some(bet => bet.userId === userId);
      const hasTeamBBet = game.bets.teamB.some(bet => bet.userId === userId);
      return hasTeamABet || hasTeamBBet;
    });
    
    console.log(`📊 [useBetStats] Filtered to ${userBetHistory.length} games with user's bets`);

    let totalBets = 0;
    let totalWon = 0;
    let totalLost = 0;
    let totalAmount = 0;
    let totalWonAmount = 0;
    let totalLostAmount = 0;

    userBetHistory.forEach(game => {
      // Get user's bets in this game
      const userTeamABets = game.bets.teamA.filter(bet => bet.userId === userId);
      const userTeamBBets = game.bets.teamB.filter(bet => bet.userId === userId);

      // Filter for matched bets only
      const matchedTeamABets = userTeamABets.filter(bet => bet.booked);
      const matchedTeamBBets = userTeamBBets.filter(bet => bet.booked);

      const allUserBets = [...userTeamABets, ...userTeamBBets];
      const matchedBets = [...matchedTeamABets, ...matchedTeamBBets];

      // Count all bets (matched and unmatched)
      totalBets += allUserBets.length;
      totalAmount += allUserBets.reduce((sum, bet) => sum + bet.amount, 0);

      // Only count wins/losses for matched bets
      if (matchedBets.length > 0) {
        const wonOnTeamA = game.winningTeam === 'A' && matchedTeamABets.length > 0;
        const wonOnTeamB = game.winningTeam === 'B' && matchedTeamBBets.length > 0;

        if (wonOnTeamA || wonOnTeamB) {
          totalWon++;
          totalWonAmount += matchedBets.reduce((sum, bet) => sum + bet.amount, 0);
        } else {
          totalLost++;
          totalLostAmount += matchedBets.reduce((sum, bet) => sum + bet.amount, 0);
        }
      }
    });

    console.log(`📊 [useBetStats] Final Results - Won: ${totalWon}, Lost: ${totalLost}, Total Bets: ${totalBets}`);

    return {
      totalBets,
      totalWon,
      totalLost,
      totalAmount,
      totalWonAmount,
      totalLostAmount,
      winRate: totalWon + totalLost > 0 ? ((totalWon / (totalWon + totalLost)) * 100).toFixed(1) : '0.0'
    };
  }, [userId, hardLedgerHistory.length]);
};

