
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BreakIndicator from "@/components/BreakIndicator";
import TeamScoreSection from "@/components/TeamScoreSection";
import GameControls from "@/components/GameControls";
import GameMetadata from "@/components/GameMetadata";
import CompactAdminWidget from "@/components/CompactAdminWidget";
import { Coins } from "lucide-react";
import { Link } from "react-router-dom";

interface ScoreboardMainDisplayProps {
  teamAName?: string;
  teamAGames: number;
  teamABalls: number;
  teamBName?: string;
  teamBGames: number;
  teamBBalls: number;
  displayBreak: boolean;
  displayGameLabel: string;
  displayTeamAGames: number;
  displayTeamBGames: number;
  isMatchStarted: boolean;
  showControls: boolean;
  timer: number;
  isTimerRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  startMatch: () => void;
  handleBreakChange: (hasBreak: boolean) => void;
  handleTeamABallIncrement: () => void;
  handleTeamABallDecrement: () => void;
  handleTeamBBallIncrement: () => void;
  handleTeamBBallDecrement: () => void;
  handleTeamAGameIncrement: () => void;
  handleTeamAGameDecrement: () => void;
  handleTeamBGameIncrement: () => void;
  handleTeamBGameDecrement: () => void;
  setTeamAWinConfirmOpen: (open: boolean) => void;
  setTeamBWinConfirmOpen: (open: boolean) => void;
  onTeamANameChange?: (name: string) => void;
  onTeamBNameChange?: (name: string) => void;
  // Admin panel props
  isAdmin?: boolean;
  isAgent?: boolean;
  onToggleAdmin?: () => void;
  onToggleAgent?: () => void;
}

const ScoreboardMainDisplay: React.FC<ScoreboardMainDisplayProps> = ({
  teamAName = "TEAM A",
  teamABalls,
  teamBName = "TEAM B",
  teamBBalls,
  displayBreak,
  displayGameLabel,
  displayTeamAGames,
  displayTeamBGames,
  isMatchStarted,
  showControls,
  timer,
  isTimerRunning,
  onStart,
  onPause,
  onReset,
  startMatch,
  handleBreakChange,
  handleTeamABallIncrement,
  handleTeamABallDecrement,
  handleTeamBBallIncrement,
  handleTeamBBallDecrement,
  handleTeamAGameIncrement,
  handleTeamAGameDecrement,
  handleTeamBGameIncrement,
  handleTeamBGameDecrement,
  setTeamAWinConfirmOpen,
  setTeamBWinConfirmOpen,
  onTeamANameChange,
  onTeamBNameChange,
  isAdmin = false,
  isAgent = false,
  onToggleAdmin,
  onToggleAgent
}) => {
  // Force re-render for Chrome compatibility when scoreboard data changes
  const [renderKey, setRenderKey] = useState(0);
  
  useEffect(() => {
    // Force re-render when critical scoreboard data changes to fix Chrome glitching
    setRenderKey(prev => prev + 1);
  }, [teamABalls, teamBBalls, displayTeamAGames, displayTeamBGames, displayBreak]);
  
  return (
    <div className="relative">
      {/* Admin Panel */}
      {(isAdmin || isAgent) && (
        <div className="mb-4">
          <CompactAdminWidget
            isAdmin={isAdmin}
            isAgent={isAgent}
          />
        </div>
      )}
      
      <Card key={renderKey} className="glass-card border-2 overflow-hidden shadow-[0_0_30px_rgba(250,21,147,0.8)] mb-8 hover:shadow-[0_0_40px_rgba(250,21,147,1)] rounded-3xl relative" style={{ borderColor: '#fa1593', backgroundColor: '#052240' }}>
        {isAdmin && (
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2 pointer-events-auto">
            <Link to="/reload-coins">
              <Button 
                variant="outline" 
                size="sm"
                className="hover:text-white"
                style={{ borderColor: '#95deff', color: '#95deff' }}
              >
                <Coins className="h-4 w-4 mr-2" />
                Reload Coins
              </Button>
            </Link>
          </div>
        )}
        
        <CardContent className="p-0 relative">
          <div className="grid grid-cols-2 divide-x" style={{ borderColor: '#750037' }}>
            {showControls && !isMatchStarted && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
                <GameControls
                  showControls={showControls}
                  isMatchStarted={isMatchStarted}
                  startMatch={startMatch}
                  timer={timer}
                  isTimerRunning={isTimerRunning}
                  onStart={onStart}
                  onPause={onPause}
                  onReset={onReset}
                />
              </div>
            )}
            
            <GameMetadata
              gameLabel={displayGameLabel}
              timer={timer}
              isTimerRunning={isTimerRunning}
              showControls={showControls}
              onStart={onStart}
              onPause={onPause}
              onReset={onReset}
              isAdmin={isAdmin}
              onToggleAdmin={onToggleAdmin}
            />
            
            <div className="relative" style={{ backgroundColor: '#004b6b' }}>
              {displayBreak && <BreakIndicator hasBreak={true} color="#95deff" side="A" />}
              
              <TeamScoreSection
                teamName={teamAName}
                games={displayTeamAGames}
                balls={teamABalls}
                hasBreak={displayBreak}
                showControls={showControls}
                isMatchStarted={isMatchStarted}
                color="#95deff"
                onBreakChange={() => handleBreakChange(true)}
                onWinConfirmOpen={() => setTeamAWinConfirmOpen(true)}
                onBallIncrement={handleTeamABallIncrement}
                onBallDecrement={handleTeamABallDecrement}
                onGameIncrement={handleTeamAGameIncrement}
                onGameDecrement={handleTeamAGameDecrement}
                onNameChange={onTeamANameChange}
              />
            </div>
            
            <div className="relative" style={{ backgroundColor: '#750037' }}>
              {!displayBreak && <BreakIndicator hasBreak={true} color="#fa1593" side="B" />}
              
              <TeamScoreSection
                teamName={teamBName}
                games={displayTeamBGames}
                balls={teamBBalls}
                hasBreak={!displayBreak}
                showControls={showControls}
                isMatchStarted={isMatchStarted}
                color="#fa1593"
                onBreakChange={() => handleBreakChange(false)}
                onWinConfirmOpen={() => setTeamBWinConfirmOpen(true)}
                onBallIncrement={handleTeamBBallIncrement}
                onBallDecrement={handleTeamBBallDecrement}
                onGameIncrement={handleTeamBGameIncrement}
                onGameDecrement={handleTeamBGameDecrement}
                onNameChange={onTeamBNameChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScoreboardMainDisplay;
