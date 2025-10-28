
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ConfirmDialog";
import BreakIndicator from "@/components/BreakIndicator";
import TeamScoreSection from "@/components/TeamScoreSection";
import GameControls from "@/components/GameControls";
import GameMetadata from "@/components/GameMetadata";
import GameTimer from "@/components/GameTimer";
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
  adminLocked?: boolean;
  setAdminLocked?: (locked: boolean) => void;
  adminModalRef?: React.RefObject<{ openModal: () => void }>;
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
  // Timer props
  timerSeconds?: number;
  isTimerRunning?: boolean;
  onTimerStart?: () => void;
  onTimerPause?: () => void;
  onTimerReset?: () => void;
  // Admin panel props
  onToggleAdmin?: () => void;
  onToggleAgent?: () => void;
}

const ScoreBoard = (props: ScoreBoardProps) => {
  const {
    timerSeconds = 0,
    isTimerRunning = false,
    onTimerStart,
    onTimerPause,
    onTimerReset
  } = props;
  
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
    timer: timerSeconds,
    isTimerRunning: isTimerRunning,
    resetTimer: onTimerReset,
    startTimer: onTimerStart,
    resetTimerOnMatchStart: props.onTimerReset
  });
  
  const showControls = true; // Always show controls (START MATCH button should always be visible)
  
  // Disable controls if admin mode is locked
  const controlsDisabled = props.adminLocked === true;
  
  // Process game wins
  const processTeamAWin = () => {
    handleTeamAWin();
  };
  
  const processTeamBWin = () => {
    handleTeamBWin();
  };
  
  return (
    <>
      <ScoreboardMainDisplay 
        {...props}
        displayBreak={displayBreak}
        displayGameLabel={displayGameLabel}
        displayTeamAGames={displayTeamAGames}
        displayTeamBGames={displayTeamBGames}
        isMatchStarted={isMatchStarted}
        showControls={showControls}
        controlsDisabled={controlsDisabled}
        adminLocked={props.adminLocked}
        setAdminLocked={props.setAdminLocked}
        adminModalRef={props.adminModalRef}
        timer={timerSeconds}
        isTimerRunning={isTimerRunning}
        onStart={onTimerStart}
        onPause={onTimerPause}
        onReset={onTimerReset}
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
        isAdmin={props.isAdmin}
        isAgent={props.isAgent}
        onToggleAdmin={props.onToggleAdmin}
        onToggleAgent={props.onToggleAgent}
      />
      
      {showControls && isMatchStarted && (
        <GameControls
          showControls={showControls}
          isMatchStarted={isMatchStarted}
          startMatch={startMatch}
          timer={timerSeconds}
          isTimerRunning={isTimerRunning}
          onStart={onTimerStart}
          onPause={onTimerPause}
          onReset={onTimerReset}
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
