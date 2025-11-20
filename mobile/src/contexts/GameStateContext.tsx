import React, { createContext, useContext, useState } from 'react';

interface GameState {
  arenaId: string;
  currentGameNumber: number;
  teamAName: string;
  teamBName: string;
  teamAGames: number;
  teamBGames: number;
  teamABalls: number;
  teamBBalls: number;
  teamAHasBreak: boolean;
}

interface GameStateContextType {
  gameState: GameState;
  updateGameState: (updates: Partial<GameState>) => void;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

const defaultGameState: GameState = {
  arenaId: 'one_pocket',
  currentGameNumber: 1,
  teamAName: 'Team A',
  teamBName: 'Team B',
  teamAGames: 0,
  teamBGames: 0,
  teamABalls: 0,
  teamBBalls: 0,
  teamAHasBreak: true,
};

export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);

  const updateGameState = (updates: Partial<GameState>) => {
    setGameState((prev) => ({ ...prev, ...updates }));
  };

  return (
    <GameStateContext.Provider value={{ gameState, updateGameState }}>
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within GameStateProvider');
  }
  return context;
};

