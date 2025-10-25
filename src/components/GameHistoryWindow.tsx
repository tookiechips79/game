import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Coins, Clock, Trash2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useGameState } from "@/contexts/GameStateContext";
import { formatDuration } from "date-fns";
import { toast } from "sonner";
import { socketIOService } from "@/services/socketIOService";

const GameHistoryWindow: React.FC = () => {
  const { betHistory, resetBetHistory } = useUser();
  const { isAdmin, resetGameState } = useGameState();

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear the game history and reset all bets? This action cannot be undone.')) {
      // Clear both game history and betting queues
      resetBetHistory();
      resetGameState();
      
      // Emit empty history via Socket.IO so other browsers also clear
      try {
        socketIOService.emitGameHistoryUpdate([]);
        socketIOService.emitBetUpdate({
          teamAQueue: [],
          teamBQueue: [],
          bookedBets: [],
          totalBookedAmount: 0,
          nextGameBets: [],
          nextTeamAQueue: [],
          nextTeamBQueue: [],
          nextTotalBookedAmount: 0
        });
      } catch (err) {
        console.error('Error emitting clear via Socket.IO:', err);
      }
      
      toast.success("Game History and Bets Cleared", {
        description: "Game history has been cleared and all betting queues have been reset",
        className: "custom-toast-success"
      });
    }
  };

  const getRecentGames = () => {
    return betHistory; // Show all games instead of just 5
  };

  const recentGames = getRecentGames();

  return (
    <Card className="glass-card border-2 overflow-hidden shadow-[0_0_30px_rgba(149,222,255,0.8)] mb-6 hover:shadow-[0_0_40px_rgba(149,222,255,1)] rounded-3xl" style={{ borderColor: '#95deff', backgroundColor: '#004b6b' }}>
      <CardHeader className="py-3 px-4 rounded-t-3xl" style={{ background: 'linear-gradient(to right, #95deff, #004b6b)' }}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center" style={{ color: 'black', textShadow: '0 0 15px rgba(250, 21, 147, 0.8)' }}>
            <div className="flex items-center">
              <Trophy className="h-5 w-5 mr-2" style={{ color: 'black', filter: 'drop-shadow(0 0 10px rgba(250, 21, 147, 0.8))' }} />
              GAME HISTORY
            </div>
          </CardTitle>
          {isAdmin && (
            <Button
              onClick={handleClearHistory}
              variant="outline"
              size="sm"
              disabled={recentGames.length === 0}
              className="text-white transition-colors"
              style={{ 
                backgroundColor: recentGames.length === 0 ? '#fa1593' : '#fa1593',
                borderColor: '#fa1593',
                opacity: recentGames.length === 0 ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (recentGames.length > 0) {
                  e.currentTarget.style.backgroundColor = 'rgba(250, 21, 147, 0.8)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fa1593';
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear History
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {recentGames.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4" style={{ color: '#95deff' }} />
            <p className="text-sm" style={{ color: '#95deff' }}>No games played yet</p>
            <p className="text-xs mt-1" style={{ color: '#052240' }}>Game history will appear here</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-rounded-full hover:scrollbar-thumb-blue-400 transition-colors" style={{ scrollbarThumbColor: '#95deff' }}>
            {recentGames.slice().reverse().map((game, index) => (
              <div 
                key={game.id || `game-${game.gameNumber}-${index}`} 
                className="rounded-lg p-2 hover:bg-opacity-50 transition-colors"
                style={{ backgroundColor: 'rgba(0, 75, 107, 0.2)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      game.winningTeam === 'A' 
                        ? 'bg-[#95deff]' 
                        : game.winningTeam === 'B' 
                        ? 'bg-[#fa1593]' 
                        : 'bg-[#052240]'
                    }`} />
                    <div className="flex flex-col">
                      <span className="text-sm" style={{ color: '#95deff' }}>
                        Game#{game.gameNumber} {game.winningTeam === 'A' ? game.teamAName : game.winningTeam === 'B' ? game.teamBName : 'Tie'}
                      </span>
                      <div className="flex items-center space-x-2 text-xs" style={{ color: '#95deff' }}>
                        <span>Break: {game.breakingTeam === 'A' ? game.teamAName : game.breakingTeam === 'B' ? game.teamBName : 'Unknown'}</span>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration({ minutes: Math.floor((game.duration || 0) / 60), seconds: (game.duration || 0) % 60 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="rounded w-8 h-8 flex items-center justify-center" style={{ backgroundColor: '#004b6b' }}>
                        <span className="text-sm font-mono" style={{ color: '#95deff' }}>
                          {game.teamABalls || 0}
                        </span>
                      </div>
                      <div className="rounded w-8 h-8 flex items-center justify-center" style={{ backgroundColor: '#750037' }}>
                        <span className="text-sm font-mono" style={{ color: '#fa1593' }}>
                          {game.teamBBalls || 0}
                        </span>
                      </div>
                    </div>
                    <div className="rounded w-8 h-8 flex items-center justify-center" style={{ backgroundColor: '#95deff' }}>
                      <span className="text-sm font-semibold" style={{ color: '#052240' }}>
                        {game.totalAmount?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GameHistoryWindow;
