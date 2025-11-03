
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BreakIndicator from "@/components/BreakIndicator";
import TeamScoreSection from "@/components/TeamScoreSection";
import GameControls from "@/components/GameControls";
import GameMetadata from "@/components/GameMetadata";
import CompactAdminWidget from "@/components/CompactAdminWidget";

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
  controlsDisabled?: boolean;
  adminLocked?: boolean;
  setAdminLocked?: (locked: boolean) => void;
  adminModalRef?: React.RefObject<{ openModal: () => void }>;
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
  adminLocked?: boolean;
  setAdminLocked?: (locked: boolean) => void;
  adminModalRef?: React.RefObject<HTMLDivElement>;
  teamAPlayerImageUrl?: string;
  teamBPlayerImageUrl?: string;
  showBallCount?: boolean;
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
  onToggleAgent,
  adminLocked,
  setAdminLocked,
  adminModalRef,
  teamAPlayerImageUrl,
  teamBPlayerImageUrl,
  showBallCount = true,
  disableGameAnimation = false
}) => {
  return (
    <>
      {/* CompactAdminWidget Portal - render at root to allow modals to display properly */}
      <CompactAdminWidget
        ref={adminModalRef}
        isAdmin={isAdmin}
        isAgent={isAgent}
        onToggleAdmin={onToggleAdmin}
        setAdminLocked={setAdminLocked}
        adminLocked={adminLocked}
      />
      
      <div className="relative">
        
      <Card className="glass-card overflow-hidden rounded-3xl relative mb-8" style={{ 
        backgroundColor: '#052240',
        boxShadow: isTimerRunning ? '0 0 40px rgba(149, 222, 255, 1), 0 0 60px rgba(149, 222, 255, 0.6)' : 'none'
      }}>
        <CardContent className="p-0 relative">
          <div className="grid grid-cols-2 divide-x" style={{ borderColor: '#750037' }}>
            {showControls && !isMatchStarted && !adminLocked && (
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
                  adminLocked={adminLocked}
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
              adminLocked={adminLocked}
              setAdminLocked={setAdminLocked}
              adminModalRef={adminModalRef}
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
                adminLocked={adminLocked}
                playerImageUrl={teamAPlayerImageUrl}
                position="40% center"
                showBallCount={showBallCount}
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
                adminLocked={adminLocked}
                playerImageUrl={teamBPlayerImageUrl}
                position="55% 55%"
                showBallCount={showBallCount}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default ScoreboardMainDisplay;
