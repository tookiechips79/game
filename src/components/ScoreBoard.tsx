
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import ConfirmDialog from "@/components/ConfirmDialog";
import BreakIndicator from "@/components/BreakIndicator";
import TeamScoreSection from "@/components/TeamScoreSection";
import GameControls from "@/components/GameControls";
import GameMetadata from "@/components/GameMetadata";
import LiveIndicator from "@/components/LiveIndicator";
import { useGameTimer } from "@/utils/timerUtils";
import { useScoreboardState } from "@/hooks/useScoreboardState";
import ScoreboardMainDisplay from "@/components/ScoreboardMainDisplay";
import ScoreboardConfirmDialogs from "@/components/ScoreboardConfirmDialogs";

interface ScoreBoardProps {
  teamAName?: string;
  teamAGames: number;
  teamABalls: number;
  teamBName?: string;
  teamBGames: number;
  teamBBalls: number;
  teamAHasBreak?: boolean;
  isAdmin?: boolean;
  isAgent?: boolean;
  gameLabel?: string;
  currentGameNumber?: number;
  onTeamANameChange?: (name: string) => void;
  onTeamBNameChange?: (name: string) => void;
  onBreakChange?: (teamAHasBreak: boolean) => void;
  onTeamAGameWin?: (duration: number) => void;
  onTeamBGameWin?: (duration: number) => void;
  onGameLabelChange?: (label: string) => void;
  onCurrentGameNumberChange?: (gameNumber: number) => void;
  onTeamABallsChange?: (balls: number) => void;
  onTeamBBallsChange?: (balls: number) => void;
  onTeamAGamesChange?: (games: number) => void;
  onTeamBGamesChange?: (games: number) => void;
  onDeleteUnmatchedBets?: () => void;
}

const ScoreBoard = (props: ScoreBoardProps) => {
  const {
    timer,
    isTimerRunning,
    toggleTimer,
    resetTimer
  } = useGameTimer(0);
  
  const {
    teamAWinConfirmOpen,
    teamBWinConfirmOpen,
    setTeamAWinConfirmOpen,
    setTeamBWinConfirmOpen,
    isMatchStarted,
    displayBreak,
    displayGameLabel,
    displayTeamAGames,
    displayTeamBGames,
    startMatch,
    handleTeamAWin,
    handleTeamBWin,
    handleBreakChange,
    handleTeamABallIncrement,
    handleTeamABallDecrement,
    handleTeamBBallIncrement,
    handleTeamBBallDecrement,
    handleTeamAGameIncrement,
    handleTeamAGameDecrement,
    handleTeamBGameIncrement,
    handleTeamBGameDecrement
  } = useScoreboardState({
    ...props,
    timer,
    resetTimer
  });
  
  const showControls = props.isAdmin || props.isAgent;
  
  // Process game wins with proper refund handling
  const processTeamAWin = () => {
    if (props.onDeleteUnmatchedBets) {
      // Make sure to properly handle unmatched bets first
      props.onDeleteUnmatchedBets();
    }
    // Then process the win
    handleTeamAWin();
  };
  
  const processTeamBWin = () => {
    if (props.onDeleteUnmatchedBets) {
      // Make sure to properly handle unmatched bets first
      props.onDeleteUnmatchedBets();
    }
    // Then process the win
    handleTeamBWin();
  };
  
  return (
    <>
      <LiveIndicator isLive={isTimerRunning} />
      
      <ScoreboardMainDisplay 
        {...props}
        displayBreak={displayBreak}
        displayGameLabel={displayGameLabel}
        displayTeamAGames={displayTeamAGames}
        displayTeamBGames={displayTeamBGames}
        isMatchStarted={isMatchStarted}
        showControls={showControls}
        timer={timer}
        isTimerRunning={isTimerRunning}
        toggleTimer={toggleTimer}
        resetTimer={resetTimer}
        startMatch={startMatch}
        handleBreakChange={handleBreakChange}
        handleTeamABallIncrement={handleTeamABallIncrement}
        handleTeamABallDecrement={handleTeamABallDecrement}
        handleTeamBBallIncrement={handleTeamBBallIncrement}
        handleTeamBBallDecrement={handleTeamBBallDecrement}
        handleTeamAGameIncrement={handleTeamAGameIncrement}
        handleTeamAGameDecrement={handleTeamAGameDecrement}
        handleTeamBGameIncrement={handleTeamBGameIncrement}
        handleTeamBGameDecrement={handleTeamBGameDecrement}
        setTeamAWinConfirmOpen={setTeamAWinConfirmOpen}
        setTeamBWinConfirmOpen={setTeamBWinConfirmOpen}
      />
      
      {showControls && isMatchStarted && (
        <GameControls
          showControls={showControls}
          isMatchStarted={isMatchStarted}
          startMatch={startMatch}
          onTeamAWinOpen={() => setTeamAWinConfirmOpen(true)}
          onTeamBWinOpen={() => setTeamBWinConfirmOpen(true)}
          teamAName={props.teamAName || "TEAM A"}
          teamBName={props.teamBName || "TEAM B"}
          timer={timer}
          isTimerRunning={isTimerRunning}
          toggleTimer={toggleTimer}
          resetTimer={resetTimer}
        />
      )}
      
      <ScoreboardConfirmDialogs
        teamAWinConfirmOpen={teamAWinConfirmOpen}
        teamBWinConfirmOpen={teamBWinConfirmOpen}
        setTeamAWinConfirmOpen={setTeamAWinConfirmOpen}
        setTeamBWinConfirmOpen={setTeamBWinConfirmOpen}
        handleTeamAWin={processTeamAWin}
        handleTeamBWin={processTeamBWin}
        teamAName={props.teamAName || "TEAM A"}
        teamBName={props.teamBName || "TEAM B"}
      />
    </>
  );
};

export default ScoreBoard;
