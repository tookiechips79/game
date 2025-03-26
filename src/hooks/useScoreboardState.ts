
import { useState, useEffect } from 'react';

interface UseScoreboardStateProps {
  teamAName?: string;
  teamAGames: number;
  teamABalls: number;
  teamBName?: string;
  teamBGames: number;
  teamBBalls: number;
  teamAHasBreak?: boolean;
  gameLabel?: string;
  currentGameNumber?: number;
  timer: number;
  resetTimer: () => void;
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
}

export const useScoreboardState = ({
  teamAHasBreak = true,
  gameLabel = "GAME*",
  currentGameNumber = 1,
  teamAGames = 0,
  teamBGames = 0,
  teamABalls,
  teamBBalls,
  timer,
  resetTimer,
  onBreakChange,
  onTeamAGameWin,
  onTeamBGameWin,
  onGameLabelChange,
  onCurrentGameNumberChange,
  onTeamABallsChange,
  onTeamBBallsChange,
  onTeamAGamesChange,
  onTeamBGamesChange
}: UseScoreboardStateProps) => {
  const [localBreak, setLocalBreak] = useState<boolean>(teamAHasBreak);
  const [localGameLabel, setLocalGameLabel] = useState<string>(gameLabel);
  const [localGameNumber, setLocalGameNumber] = useState<number>(currentGameNumber);
  
  const [teamAWinConfirmOpen, setTeamAWinConfirmOpen] = useState<boolean>(false);
  const [teamBWinConfirmOpen, setTeamBWinConfirmOpen] = useState<boolean>(false);
  
  const [isMatchStarted, setIsMatchStarted] = useState<boolean>(false);
  
  const [localTeamAGames, setLocalTeamAGames] = useState<number>(teamAGames);
  const [localTeamBGames, setLocalTeamBGames] = useState<number>(teamBGames);
  
  useEffect(() => {
    setLocalBreak(teamAHasBreak);
  }, [teamAHasBreak]);
  
  useEffect(() => {
    setLocalGameLabel(gameLabel);
  }, [gameLabel]);
  
  useEffect(() => {
    setLocalGameNumber(currentGameNumber);
  }, [currentGameNumber]);
  
  useEffect(() => {
    setLocalTeamAGames(teamAGames);
  }, [teamAGames]);
  
  useEffect(() => {
    setLocalTeamBGames(teamBGames);
  }, [teamBGames]);
  
  useEffect(() => {
    if (isMatchStarted) {
      const newGameLabel = `GAME ${localGameNumber}`;
      if (onGameLabelChange) {
        onGameLabelChange(newGameLabel);
      } else {
        setLocalGameLabel(newGameLabel);
      }
    }
  }, [localGameNumber, isMatchStarted, onGameLabelChange]);
  
  const displayBreak = onBreakChange !== undefined ? teamAHasBreak : localBreak;
  const displayGameLabel = onGameLabelChange !== undefined ? gameLabel : localGameLabel;
  
  const startMatch = () => {
    setIsMatchStarted(true);
    
    const initialGameNumber = onCurrentGameNumberChange ? currentGameNumber : 1;
    setLocalGameNumber(initialGameNumber);
    
    resetTimer();
    
    const newGameLabel = `GAME ${initialGameNumber}`;
    if (onGameLabelChange) {
      onGameLabelChange(newGameLabel);
    } else {
      setLocalGameLabel(newGameLabel);
    }
  };
  
  const handleTeamAWin = () => {
    if (onTeamAGameWin) {
      onTeamAGameWin(timer);
    }
    
    handleBreakChange(!displayBreak);
    
    const nextGameNumber = localGameNumber + 1;
    if (onCurrentGameNumberChange) {
      onCurrentGameNumberChange(nextGameNumber);
    } else {
      setLocalGameNumber(nextGameNumber);
    }
    
    resetTimer();
  };
  
  const handleTeamBWin = () => {
    if (onTeamBGameWin) {
      onTeamBGameWin(timer);
    }
    
    handleBreakChange(!displayBreak);
    
    const nextGameNumber = localGameNumber + 1;
    if (onCurrentGameNumberChange) {
      onCurrentGameNumberChange(nextGameNumber);
    } else {
      setLocalGameNumber(nextGameNumber);
    }
    
    resetTimer();
  };
  
  const handleBreakChange = (hasBreak: boolean) => {
    if (onBreakChange) {
      onBreakChange(hasBreak);
    } else {
      setLocalBreak(hasBreak);
    }
  };
  
  const handleTeamABallIncrement = () => {
    if (onTeamABallsChange) {
      onTeamABallsChange(teamABalls + 1);
    }
  };
  
  const handleTeamABallDecrement = () => {
    if (onTeamABallsChange) {
      onTeamABallsChange(teamABalls - 1); // Remove Math.max to allow negative values
    }
  };
  
  const handleTeamBBallIncrement = () => {
    if (onTeamBBallsChange) {
      onTeamBBallsChange(teamBBalls + 1);
    }
  };
  
  const handleTeamBBallDecrement = () => {
    if (onTeamBBallsChange) {
      onTeamBBallsChange(teamBBalls - 1); // Remove Math.max to allow negative values
    }
  };
  
  const handleTeamAGameIncrement = () => {
    const newGameCount = localTeamAGames + 1;
    if (onTeamAGamesChange) {
      onTeamAGamesChange(newGameCount);
    } else {
      setLocalTeamAGames(newGameCount);
    }
  };
  
  const handleTeamAGameDecrement = () => {
    if (localTeamAGames > 0) {
      const newGameCount = localTeamAGames - 1;
      if (onTeamAGamesChange) {
        onTeamAGamesChange(newGameCount);
      } else {
        setLocalTeamAGames(newGameCount);
      }
    }
  };
  
  const handleTeamBGameIncrement = () => {
    const newGameCount = localTeamBGames + 1;
    if (onTeamBGamesChange) {
      onTeamBGamesChange(newGameCount);
    } else {
      setLocalTeamBGames(newGameCount);
    }
  };
  
  const handleTeamBGameDecrement = () => {
    if (localTeamBGames > 0) {
      const newGameCount = localTeamBGames - 1;
      if (onTeamBGamesChange) {
        onTeamBGamesChange(newGameCount);
      } else {
        setLocalTeamBGames(newGameCount);
      }
    }
  };
  
  const displayTeamAGames = onTeamAGamesChange !== undefined ? teamAGames : localTeamAGames;
  const displayTeamBGames = onTeamBGamesChange !== undefined ? teamBGames : localTeamBGames;

  return {
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
  };
};
