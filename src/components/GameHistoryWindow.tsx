import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Coins, Clock, Trash2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { formatDuration } from "date-fns";
import { toast } from "sonner";

const GameHistoryWindow: React.FC = () => {
  const { betHistory, resetBetHistory, isAdmin } = useUser();

  const getRecentGames = () => {
    return betHistory.slice(0, 5); // Show last 5 games
  };

  const recentGames = getRecentGames();

  const handleClearHistory = () => {
    if (isAdmin) {
      resetBetHistory();
      toast.success("Game History Cleared", {
        description: "All game history has been reset"
      });
    } else {
      toast.error("Admin Access Required", {
        description: "Only administrators can clear game history"
      });
    }
  };

  return (
    <Card className="glass-card border-2 border-[#F97316] overflow-hidden shadow-[0_0_20px_rgba(249,115,22,0.6)] mb-6 hover:shadow-[0_0_25px_rgba(249,115,22,0.7)] rounded-2xl">
      <CardHeader className="py-3 px-4 bg-gradient-to-r from-[#F97316]/30 to-[#FBBF24]/30 rounded-t-2xl">
        <CardTitle className="text-lg font-bold text-white text-center flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-[#FBBF24]" />
            GAME HISTORY
          </div>
          {isAdmin && recentGames.length > 0 && (
            <Button
              onClick={handleClearHistory}
              variant="outline"
              size="sm"
              className="bg-red-600/20 border-red-500 text-red-300 hover:bg-red-600/30 hover:text-red-200 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {recentGames.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">No games played yet</p>
            <p className="text-gray-500 text-xs mt-1">Game history will appear here</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-[#F97316] scrollbar-thumb-rounded-full hover:scrollbar-thumb-[#FBBF24] transition-colors">
            {recentGames.slice().reverse().map((game) => (
              <div 
                key={game.id} 
                className="bg-gray-800/30 rounded-lg p-2 hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      game.winningTeam === 'A' 
                        ? 'bg-[#1EAEDB]' 
                        : game.winningTeam === 'B' 
                        ? 'bg-[#a3e635]' 
                        : 'bg-[#FBBF24]'
                    }`} />
                    <div className="flex flex-col">
                      <span className="text-white text-sm">
                        Game#{game.gameNumber} {game.winningTeam === 'A' ? game.teamAName : game.winningTeam === 'B' ? game.teamBName : 'Tie'}
                      </span>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>Break: {game.breakingTeam === 'A' ? game.teamAName : game.teamBName}</span>
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
                      <div className="bg-gray-700/50 rounded w-8 h-8 flex items-center justify-center">
                        <span className="text-gray-300 text-sm font-mono">
                          {game.teamABalls || 0}
                        </span>
                      </div>
                      <div className="bg-gray-700/50 rounded w-8 h-8 flex items-center justify-center">
                        <span className="text-gray-300 text-sm font-mono">
                          {game.teamBBalls || 0}
                        </span>
                      </div>
                    </div>
                    <div className="bg-[#F97316]/20 rounded w-8 h-8 flex items-center justify-center">
                      <span className="text-[#FBBF24] text-sm font-semibold">
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
