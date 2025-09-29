
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import BreakIndicator from "@/components/BreakIndicator";
import TeamScoreSection from "@/components/TeamScoreSection";
import GameControls from "@/components/GameControls";
import GameMetadata from "@/components/GameMetadata";

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
  onTeamBNameChange
}) => {
  return (
    <div className="relative">
      <Card className="glass-card border-2 border-[#F97316] overflow-hidden shadow-[0_0_20px_rgba(249,115,22,0.6)] mb-8 hover:shadow-[0_0_25px_rgba(249,115,22,0.7)] rounded-2xl">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 divide-x divide-gray-700 relative">
            {showControls && !isMatchStarted && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
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
            />
            
            <div className="relative">
              {displayBreak && <BreakIndicator hasBreak={true} color="#1EAEDB" side="A" />}
              
              <TeamScoreSection
                teamName={teamAName}
                games={displayTeamAGames}
                balls={teamABalls}
                hasBreak={displayBreak}
                showControls={showControls}
                isMatchStarted={isMatchStarted}
                color="#1EAEDB"
                onBreakChange={() => handleBreakChange(true)}
                onWinConfirmOpen={() => setTeamAWinConfirmOpen(true)}
                onBallIncrement={handleTeamABallIncrement}
                onBallDecrement={handleTeamABallDecrement}
                onGameIncrement={handleTeamAGameIncrement}
                onGameDecrement={handleTeamAGameDecrement}
                onNameChange={onTeamANameChange}
              />
            </div>
            
            <div className="relative">
              {!displayBreak && <BreakIndicator hasBreak={true} color="#a3e635" side="B" />}
              
              <TeamScoreSection
                teamName={teamBName}
                games={displayTeamBGames}
                balls={teamBBalls}
                hasBreak={!displayBreak}
                showControls={showControls}
                isMatchStarted={isMatchStarted}
                color="#a3e635"
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
