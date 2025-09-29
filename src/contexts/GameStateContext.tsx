import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Bet, BookedBet } from '@/types/user';

interface GameState {
  // Team Information
  teamAName: string;
  teamBName: string;
  teamAGames: number;
  teamABalls: number;
  teamBGames: number;
  teamBBalls: number;
  teamAHasBreak: boolean;
  gameLabel: string;
  currentGameNumber: number;
  gameDescription: string;
  
  // Betting Cues
  teamAQueue: Bet[];
  teamBQueue: Bet[];
  nextTeamAQueue: Bet[];
  nextTeamBQueue: Bet[];
  
  // Booked Bets
  bookedBets: BookedBet[];
  totalBookedAmount: number;
  nextBookedBets: BookedBet[];
  nextTotalBookedAmount: number;
  
  // Bet Management
  betCounter: number;
  colorIndex: number;
  
  // Timer (synchronized across browsers)
  timerSeconds: number;
  isTimerRunning: boolean;
  timerStartTime: number | null;
}

interface LocalAdminState {
  // Admin Controls (Local to each browser)
  isAdminMode: boolean;
  isAgentMode: boolean;
}

interface GameStateContextType {
  gameState: GameState;
  updateGameState: (updates: Partial<GameState>) => void;
  resetGameState: () => void;
  isAdmin: boolean;
  // Local admin state (not synchronized)
  localAdminState: LocalAdminState;
  updateLocalAdminState: (updates: Partial<LocalAdminState>) => void;
  // Timer controls (admin only)
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setTimer: (seconds: number) => void;
  // Auto-reset timer functions
  resetTimerOnMatchStart: () => void;
  resetTimerOnGameWin: () => void;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

const GAME_STATE_STORAGE_KEY = "betting_app_game_state";
const LOCAL_ADMIN_STORAGE_KEY = "betting_app_local_admin_state";

const defaultGameState: GameState = {
  // Team Information
  teamAName: "Player A",
  teamBName: "Player B",
  teamAGames: 0,
  teamABalls: 0,
  teamBGames: 0,
  teamBBalls: 0,
  teamAHasBreak: true,
  gameLabel: "GAME*",
  currentGameNumber: 1,
  gameDescription: "",
  
  // Betting Cues
  teamAQueue: [],
  teamBQueue: [],
  nextTeamAQueue: [],
  nextTeamBQueue: [],
  
  // Booked Bets
  bookedBets: [],
  totalBookedAmount: 0,
  nextBookedBets: [],
  nextTotalBookedAmount: 0,
  
  // Bet Management
  betCounter: 1,
  colorIndex: 0,
  
  // Timer (synchronized across browsers)
  timerSeconds: 0,
  isTimerRunning: false,
  timerStartTime: null,
};

const defaultLocalAdminState: LocalAdminState = {
  // Admin Controls (Local to each browser)
  isAdminMode: false,
  isAgentMode: false,
};

export const GameStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [localAdminState, setLocalAdminState] = useState<LocalAdminState>(defaultLocalAdminState);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load game state from localStorage on mount
  useEffect(() => {
    const storedGameState = localStorage.getItem(GAME_STATE_STORAGE_KEY);
    if (storedGameState) {
      try {
        const parsedState = JSON.parse(storedGameState);
        setGameState(parsedState);
      } catch (error) {
        console.error('Error parsing stored game state:', error);
        setGameState(defaultGameState);
      }
    }
  }, []);

  // Load local admin state from localStorage on mount (separate from game state)
  useEffect(() => {
    const storedLocalAdminState = localStorage.getItem(LOCAL_ADMIN_STORAGE_KEY);
    if (storedLocalAdminState) {
      try {
        const parsedState = JSON.parse(storedLocalAdminState);
        setLocalAdminState(parsedState);
      } catch (error) {
        console.error('Error parsing stored local admin state:', error);
        setLocalAdminState(defaultLocalAdminState);
      }
    }
  }, []);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  // Save local admin state to localStorage whenever it changes (separate from game state)
  useEffect(() => {
    localStorage.setItem(LOCAL_ADMIN_STORAGE_KEY, JSON.stringify(localAdminState));
  }, [localAdminState]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === GAME_STATE_STORAGE_KEY && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          setGameState(newState);
        } catch (error) {
          console.error('Error parsing updated game state:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = () => {
      const currentUser = localStorage.getItem('betting_app_current_user');
      if (currentUser) {
        try {
          const user = JSON.parse(currentUser);
          setIsAdmin(user?.name?.toLowerCase() === 'admin');
        } catch (error) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
    
    // Listen for user changes
    const handleUserChange = () => checkAdminStatus();
    window.addEventListener('storage', handleUserChange);
    
    return () => window.removeEventListener('storage', handleUserChange);
  }, []);

  // Ultra-robust timer effect - uses Web Worker for maximum accuracy
  useEffect(() => {
    if (gameState.isTimerRunning) {
      const startTime = Date.now();
      const startSeconds = gameState.timerSeconds;
      
      // Create a Web Worker for accurate timing
      const workerCode = `
        let intervalId;
        let startTime = ${startTime};
        let startSeconds = ${startSeconds};
        
        function updateTimer() {
          const currentTime = Date.now();
          const elapsed = Math.floor((currentTime - startTime) / 1000);
          const newSeconds = startSeconds + elapsed;
          
          self.postMessage({ type: 'TICK', seconds: newSeconds });
        }
        
        self.onmessage = function(e) {
          if (e.data.type === 'START') {
            startTime = e.data.startTime;
            startSeconds = e.data.startSeconds;
            intervalId = setInterval(updateTimer, 1000);
          } else if (e.data.type === 'STOP') {
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      
      worker.postMessage({ 
        type: 'START', 
        startTime, 
        startSeconds 
      });
      
      worker.onmessage = (e) => {
        if (e.data.type === 'TICK') {
          setGameState(prev => ({
            ...prev,
            timerSeconds: e.data.seconds
          }));
        }
      };
      
      // Store worker for cleanup
      (timerIntervalRef as any).worker = worker;
    } else {
      if ((timerIntervalRef as any).worker) {
        (timerIntervalRef as any).worker.postMessage({ type: 'STOP' });
        (timerIntervalRef as any).worker.terminate();
        (timerIntervalRef as any).worker = null;
      }
    }

    return () => {
      if ((timerIntervalRef as any).worker) {
        (timerIntervalRef as any).worker.postMessage({ type: 'STOP' });
        (timerIntervalRef as any).worker.terminate();
        (timerIntervalRef as any).worker = null;
      }
    };
  }, [gameState.isTimerRunning]);

  // Handle visibility changes to ensure timer accuracy when tab becomes active again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (gameState.isTimerRunning && !document.hidden) {
        // Tab became visible again, restart timer to ensure accuracy
        if ((timerIntervalRef as any).worker) {
          (timerIntervalRef as any).worker.postMessage({ type: 'STOP' });
          (timerIntervalRef as any).worker.terminate();
        }
        
        const startTime = Date.now();
        const startSeconds = gameState.timerSeconds;
        
        // Create new worker
        const workerCode = `
          let intervalId;
          let startTime = ${startTime};
          let startSeconds = ${startSeconds};
          
          function updateTimer() {
            const currentTime = Date.now();
            const elapsed = Math.floor((currentTime - startTime) / 1000);
            const newSeconds = startSeconds + elapsed;
            
            self.postMessage({ type: 'TICK', seconds: newSeconds });
          }
          
          self.onmessage = function(e) {
            if (e.data.type === 'START') {
              startTime = e.data.startTime;
              startSeconds = e.data.startSeconds;
              intervalId = setInterval(updateTimer, 1000);
            } else if (e.data.type === 'STOP') {
              if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
              }
            }
          };
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        
        worker.postMessage({ 
          type: 'START', 
          startTime, 
          startSeconds 
        });
        
        worker.onmessage = (e) => {
          if (e.data.type === 'TICK') {
            setGameState(prev => ({
              ...prev,
              timerSeconds: e.data.seconds
            }));
          }
        };
        
        (timerIntervalRef as any).worker = worker;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gameState.isTimerRunning, gameState.timerSeconds]);

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState(prevState => {
      const newState = { ...prevState, ...updates };
      
      // Update game label when game number changes
      if (updates.currentGameNumber !== undefined) {
        newState.gameLabel = `GAME ${updates.currentGameNumber}`;
      }
      
      return newState;
    });
  }, []);

  const updateLocalAdminState = (updates: Partial<LocalAdminState>) => {
    setLocalAdminState(prevState => ({ ...prevState, ...updates }));
  };

  const resetGameState = () => {
    setGameState(defaultGameState);
  };

  // Timer control functions (admin only)
  const startTimer = () => {
    if (!isAdmin) return;
    
    // Force start timer - clear any existing interval first
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    updateGameState({
      isTimerRunning: true
    });
  };

  const pauseTimer = () => {
    if (!isAdmin) return;
    
    // Force stop timer - terminate worker
    if ((timerIntervalRef as any).worker) {
      (timerIntervalRef as any).worker.postMessage({ type: 'STOP' });
      (timerIntervalRef as any).worker.terminate();
      (timerIntervalRef as any).worker = null;
    }
    
    updateGameState({
      isTimerRunning: false
    });
  };

  const resetTimer = () => {
    if (!isAdmin) return;
    
    // Force stop and reset timer
    if ((timerIntervalRef as any).worker) {
      (timerIntervalRef as any).worker.postMessage({ type: 'STOP' });
      (timerIntervalRef as any).worker.terminate();
      (timerIntervalRef as any).worker = null;
    }
    
    updateGameState({
      timerSeconds: 0,
      isTimerRunning: false
    });
  };

  const setTimer = (seconds: number) => {
    if (!isAdmin) return;
    
    // Force stop timer when setting new value
    if ((timerIntervalRef as any).worker) {
      (timerIntervalRef as any).worker.postMessage({ type: 'STOP' });
      (timerIntervalRef as any).worker.terminate();
      (timerIntervalRef as any).worker = null;
    }
    
    updateGameState({
      timerSeconds: seconds,
      isTimerRunning: false
    });
  };

  // Auto-reset timer when match starts or game is won
  const resetTimerOnMatchStart = () => {
    // Force stop timer
    if ((timerIntervalRef as any).worker) {
      (timerIntervalRef as any).worker.postMessage({ type: 'STOP' });
      (timerIntervalRef as any).worker.terminate();
      (timerIntervalRef as any).worker = null;
    }
    
    updateGameState({
      timerSeconds: 0,
      isTimerRunning: false
    });
  };

  const resetTimerOnGameWin = () => {
    // Force stop timer
    if ((timerIntervalRef as any).worker) {
      (timerIntervalRef as any).worker.postMessage({ type: 'STOP' });
      (timerIntervalRef as any).worker.terminate();
      (timerIntervalRef as any).worker = null;
    }
    
    updateGameState({
      timerSeconds: 0,
      isTimerRunning: false
    });
  };

  const value: GameStateContextType = {
    gameState,
    updateGameState,
    resetGameState,
    isAdmin,
    localAdminState,
    updateLocalAdminState,
    startTimer,
    pauseTimer,
    resetTimer,
    setTimer,
    resetTimerOnMatchStart,
    resetTimerOnGameWin,
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = (): GameStateContextType => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};
