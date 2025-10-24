import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Trophy,
  CalendarClock,
  Shield,
  Lock
} from "lucide-react";
import { BetHistoryRecord } from "@/types/user";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HardLedgerBetHistoryProps {
  userId: string;
  isAdmin?: boolean;
}

const HardLedgerBetHistory: React.FC<HardLedgerBetHistoryProps> = ({ 
  userId, 
  isAdmin = false 
}) => {
  const { getHardLedgerBetHistory, getUserById, getAllUsers } = useUser();
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');
  
  // Get the immutable hard ledger bet history
  const hardLedgerHistory = getHardLedgerBetHistory();
  const allUsers = getAllUsers();
  
  // Filter bet history for the specific user (if not admin)
  const userBetHistory = isAdmin 
    ? hardLedgerHistory 
    : hardLedgerHistory.filter(game => {
        // Check if user has any bets in this game (both booked and unbooked)
        const hasTeamABet = game.bets.teamA.some(bet => bet.userId === userId);
        const hasTeamBBet = game.bets.teamB.some(bet => bet.userId === userId);
        return hasTeamABet || hasTeamBBet;
      });
  
  const filteredHistory = userBetHistory.filter(game => {
    if (filter === 'all') return true;
    if (filter === 'wins') {
      // Check if user won this game (only counts matched bets)
      const matchedTeamABets = game.bets.teamA.filter(bet => bet.userId === userId && bet.booked);
      const matchedTeamBBets = game.bets.teamB.filter(bet => bet.userId === userId && bet.booked);
      
      const wonOnTeamA = game.winningTeam === 'A' && matchedTeamABets.length > 0;
      const wonOnTeamB = game.winningTeam === 'B' && matchedTeamBBets.length > 0;
      
      return wonOnTeamA || wonOnTeamB;
    }
    if (filter === 'losses') {
      // Check if user lost this game (only counts matched bets)
      const matchedTeamABets = game.bets.teamA.filter(bet => bet.userId === userId && bet.booked);
      const matchedTeamBBets = game.bets.teamB.filter(bet => bet.userId === userId && bet.booked);
      
      const lostOnTeamA = game.winningTeam === 'B' && matchedTeamABets.length > 0;
      const lostOnTeamB = game.winningTeam === 'A' && matchedTeamBBets.length > 0;
      
      return lostOnTeamA || lostOnTeamB;
    }
    return true;
  });
  
  // Calculate summary statistics
  const calculateStats = () => {
    let totalBets = 0;
    let totalWon = 0;
    let totalLost = 0;
    let totalAmount = 0;
    let totalWonAmount = 0;
    let totalLostAmount = 0;
    
    filteredHistory.forEach(game => {
      const matchedTeamABets = game.bets.teamA.filter(bet => bet.userId === userId && bet.booked);
      const matchedTeamBBets = game.bets.teamB.filter(bet => bet.userId === userId && bet.booked);
      
      const allUserBets = [...game.bets.teamA.filter(bet => bet.userId === userId), ...game.bets.teamB.filter(bet => bet.userId === userId)];
      const matchedBets = [...matchedTeamABets, ...matchedTeamBBets];
      
      totalBets += allUserBets.length;
      totalAmount += allUserBets.reduce((sum, bet) => sum + bet.amount, 0);
      
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
    
    return {
      totalBets,
      totalWon,
      totalLost,
      totalAmount,
      totalWonAmount,
      totalLostAmount,
      winRate: totalWon + totalLost > 0 ? ((totalWon / (totalWon + totalLost)) * 100).toFixed(1) : '0.0'
    };
  };
  
  const stats = calculateStats();
  
  const getUserBetAmount = (game: BetHistoryRecord, userId: string) => {
    // Calculate total amount from ALL bets by this user (not just the first one)
    const teamABets = game.bets.teamA.filter(bet => bet.userId === userId);
    const teamBBets = game.bets.teamB.filter(bet => bet.userId === userId);
    
    const teamATotal = teamABets.reduce((total, bet) => total + bet.amount, 0);
    const teamBTotal = teamBBets.reduce((total, bet) => total + bet.amount, 0);
    
    return teamATotal + teamBTotal;
  };
  
  const getUserBetDetails = (game: BetHistoryRecord, userId: string) => {
    // Get ALL bets by this user (not just the first one)
    const teamABets = game.bets.teamA.filter(bet => bet.userId === userId);
    const teamBBets = game.bets.teamB.filter(bet => bet.userId === userId);
    
    const details = [];
    
    // Add all Team A bets
    if (teamABets.length > 0) {
      const teamATotal = teamABets.reduce((total, bet) => total + bet.amount, 0);
      const matchedCount = teamABets.filter(bet => bet.booked).length;
      const unmatchedCount = teamABets.length - matchedCount;
      
      let teamADetail = `${teamATotal} on ${game.teamAName}`;
      if (matchedCount > 0 && unmatchedCount > 0) {
        teamADetail += ` (${matchedCount} matched, ${unmatchedCount} unmatched)`;
      } else if (matchedCount > 0) {
        teamADetail += ` (${matchedCount} matched)`;
      } else if (unmatchedCount > 0) {
        teamADetail += ` (${unmatchedCount} unmatched)`;
      }
      
      details.push(teamADetail);
    }
    
    // Add all Team B bets
    if (teamBBets.length > 0) {
      const teamBTotal = teamBBets.reduce((total, bet) => total + bet.amount, 0);
      const matchedCount = teamBBets.filter(bet => bet.booked).length;
      const unmatchedCount = teamBBets.length - matchedCount;
      
      let teamBDetail = `${teamBTotal} on ${game.teamBName}`;
      if (matchedCount > 0 && unmatchedCount > 0) {
        teamBDetail += ` (${matchedCount} matched, ${unmatchedCount} unmatched)`;
      } else if (matchedCount > 0) {
        teamBDetail += ` (${matchedCount} matched)`;
      } else if (unmatchedCount > 0) {
        teamBDetail += ` (${unmatchedCount} unmatched)`;
      }
      
      details.push(teamBDetail);
    }
    
    return details.join(', ');
  };
  
  const getUserResult = (game: BetHistoryRecord, userId: string) => {
    // Check ALL matched bets by this user (not just the first one)
    const matchedTeamABets = game.bets.teamA.filter(bet => bet.userId === userId && bet.booked);
    const matchedTeamBBets = game.bets.teamB.filter(bet => bet.userId === userId && bet.booked);
    
    if (matchedTeamABets.length === 0 && matchedTeamBBets.length === 0) {
      return 'No Matched Bets';
    }
    
    // Check if user won any matched bets
    const wonOnTeamA = game.winningTeam === 'A' && matchedTeamABets.length > 0;
    const wonOnTeamB = game.winningTeam === 'B' && matchedTeamBBets.length > 0;
    
    if (wonOnTeamA || wonOnTeamB) {
      return 'Won';
    }
    
    // Check if user lost any matched bets
    const lostOnTeamA = game.winningTeam === 'B' && matchedTeamABets.length > 0;
    const lostOnTeamB = game.winningTeam === 'A' && matchedTeamBBets.length > 0;
    
    if (lostOnTeamA || lostOnTeamB) {
      return 'Lost';
    }
    
    return 'No Result';
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" style={{ color: '#95deff' }} />
          <Shield className="h-5 w-5" style={{ color: '#fa1593' }} />
          <span style={{ color: '#95deff' }}>
            Hard Ledger: {filteredHistory.length} {filteredHistory.length === 1 ? 'game' : 'games'} (Immutable)
          </span>
        </div>
        
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as any)}
        >
          <SelectTrigger className="w-[200px] border-2" style={{ backgroundColor: '#052240', borderColor: '#95deff' }}>
            <SelectValue placeholder="Filter games" />
          </SelectTrigger>
          <SelectContent className="border-2" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
            <SelectItem value="all" className="text-white">All Games</SelectItem>
            <SelectItem value="wins" className="text-white">Wins Only</SelectItem>
            <SelectItem value="losses" className="text-white">Losses Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Statistics Summary */}
      {filteredHistory.length > 0 && (
        <Card className="border-2 p-4" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div style={{ color: '#95deff' }}>Total Bets</div>
              <div className="font-bold" style={{ color: '#fa1593' }}>{stats.totalBets}</div>
            </div>
            <div className="text-center">
              <div style={{ color: '#95deff' }}>Total Amount</div>
              <div className="font-bold" style={{ color: '#fa1593' }}>{stats.totalAmount} COINS</div>
            </div>
            <div className="text-center">
              <div style={{ color: '#95deff' }}>Win Rate</div>
              <div className="font-bold text-green-400">{stats.winRate}%</div>
            </div>
            <div className="text-center">
              <div style={{ color: '#95deff' }}>Games</div>
              <div className="font-bold" style={{ color: '#fa1593' }}>{stats.totalWon}W / {stats.totalLost}L</div>
            </div>
          </div>
        </Card>
      )}
      
      {filteredHistory.length > 0 ? (
        <Card className="border-2 overflow-hidden" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader style={{ backgroundColor: '#052240' }}>
                <TableRow style={{ borderColor: '#95deff' }}>
                  <TableHead className="w-[80px] text-white">Game #</TableHead>
                  <TableHead className="w-[120px] text-white">Teams</TableHead>
                  <TableHead className="w-[80px] text-white">Score</TableHead>
                  {isAdmin && <TableHead className="w-[120px] text-white">User</TableHead>}
                  <TableHead className="w-[100px] text-white">Bet Details</TableHead>
                  <TableHead className="w-[80px] text-white">Total</TableHead>
                  <TableHead className="w-[80px] text-white">Result</TableHead>
                  <TableHead className="text-right text-white">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((game) => (
                  <TableRow key={game.id} className="hover:opacity-80" style={{ backgroundColor: '#004b6b' }}>
                    <TableCell className="font-medium" style={{ color: '#95deff' }}>
                      #{game.gameNumber}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div style={{ color: '#95deff' }}>{game.teamAName}</div>
                        <div style={{ color: '#95deff' }}>vs</div>
                        <div style={{ color: '#fa1593' }}>{game.teamBName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-bold">
                        <div style={{ color: '#95deff' }}>{game.teamAScore}</div>
                        <div style={{ color: '#95deff' }}>-</div>
                        <div style={{ color: '#fa1593' }}>{game.teamBScore}</div>
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="font-medium" style={{ color: '#95deff' }}>
                        {(() => {
                          // Get the first user ID from the bets
                          const firstBet = [...game.bets.teamA, ...game.bets.teamB][0];
                          return firstBet ? getUserById(firstBet.userId)?.username || 'Unknown' : 'No User';
                        })()}
                      </TableCell>
                    )}
                    <TableCell className="text-sm text-white">
                      <div className="max-w-[200px] truncate" title={getUserBetDetails(game, userId)}>
                        {getUserBetDetails(game, userId)}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold" style={{ color: '#fa1593' }}>
                      {getUserBetAmount(game, userId)} COINS
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${
                        getUserResult(game, userId) === 'Won' ? 'text-green-400' :
                        getUserResult(game, userId) === 'Lost' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        <Trophy className="h-4 w-4" />
                        {getUserResult(game, userId)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right" style={{ color: '#95deff' }}>
                      {format(new Date(game.timestamp), "MMM d, yyyy h:mm a")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
          <Lock className="h-12 w-12 mx-auto mb-4 opacity-30" style={{ color: '#95deff' }} />
          <p className="text-lg" style={{ color: '#95deff' }}>No bet history found</p>
          <p className="text-sm mt-2 text-white">Bet history will appear here as games are completed.</p>
          <p className="text-xs mt-1" style={{ color: '#95deff' }}>This is a permanent, immutable ledger.</p>
        </div>
      )}
    </div>
  );
};

export default HardLedgerBetHistory;
