import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Bet, BookedBet } from '@/types/user';
import { socketIOService, BetSyncData, GameStateSyncData, TimerSyncData, ScoreSyncData } from '@/services/socketIOService';
import { useUser } from './UserContext';

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
  
  // Betting Queues
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
  
  // Betting Queues
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
  // Ref to track if we're receiving server updates to prevent local timer conflicts
  const isReceivingServerUpdate = useRef(false);
  
  // Get UserContext functions for game history sync
  const { } = useUser();

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

  // Socket.IO real-time synchronization
  useEffect(() => {
    // Connect to Socket.IO server
    socketIOService.connect();

    // Listen for bet updates from other clients
    socketIOService.onBetUpdate((betData: BetSyncData) => {
      console.log('📥 Received bet update from server:', betData);
      console.log('📥 Current state before update:', {
        teamAQueueLength: gameState.teamAQueue.length,
        teamBQueueLength: gameState.teamBQueue.length,
        bookedBetsLength: gameState.bookedBets.length
      });
      
      setGameState(prevState => {
        const newState = { ...prevState };
        let hasUpdates = false;
        
        // Always update queues when received to ensure highlighting syncs
        if (betData.teamAQueue) {
          console.log('📥 Updating teamAQueue:', betData.teamAQueue);
          newState.teamAQueue = betData.teamAQueue;
          hasUpdates = true;
        }
        if (betData.teamBQueue) {
          console.log('📥 Updating teamBQueue:', betData.teamBQueue);
          newState.teamBQueue = betData.teamBQueue;
          hasUpdates = true;
        }
        if (betData.bookedBets) {
          console.log('📥 Updating bookedBets:', betData.bookedBets);
          newState.bookedBets = betData.bookedBets;
          hasUpdates = true;
        }
        if (betData.nextGameBets) {
          console.log('📥 Updating nextBookedBets:', betData.nextGameBets);
          newState.nextBookedBets = betData.nextGameBets;
          hasUpdates = true;
        }
        if (betData.nextTeamAQueue) {
          console.log('📥 Updating nextTeamAQueue:', betData.nextTeamAQueue);
          newState.nextTeamAQueue = betData.nextTeamAQueue;
          hasUpdates = true;
        }
        if (betData.nextTeamBQueue) {
          console.log('📥 Updating nextTeamBQueue:', betData.nextTeamBQueue);
          newState.nextTeamBQueue = betData.nextTeamBQueue;
          hasUpdates = true;
        }
        
        if (hasUpdates) {
          console.log('📥 State updated successfully with bet data');
        } else {
          console.log('📥 No updates applied from bet data');
        }
        
        console.log('📥 New state after update:', {
          teamAQueueLength: newState.teamAQueue.length,
          teamBQueueLength: newState.teamBQueue.length,
          bookedBetsLength: newState.bookedBets.length
        });
        
        return newState;
      });
    });

    // Listen for game state updates from other clients
    socketIOService.onGameStateUpdate((gameStateData: GameStateSyncData) => {
      console.log('📥 Received game state update from server:', gameStateData);
      
      setGameState(prevState => {
        const newState = { ...prevState };
        let hasUpdates = false;
        
        if (gameStateData.teamAScore !== undefined) {
          newState.teamAGames = gameStateData.teamAScore;
          hasUpdates = true;
          console.log('📥 Updated teamAGames to:', gameStateData.teamAScore);
        }
        if (gameStateData.teamBScore !== undefined) {
          newState.teamBGames = gameStateData.teamBScore;
          hasUpdates = true;
          console.log('📥 Updated teamBGames to:', gameStateData.teamBScore);
        }
        if (gameStateData.teamABalls !== undefined) {
          newState.teamABalls = gameStateData.teamABalls;
          hasUpdates = true;
          console.log('📥 Updated teamABalls to:', gameStateData.teamABalls);
        }
        if (gameStateData.teamBBalls !== undefined) {
          newState.teamBBalls = gameStateData.teamBBalls;
          hasUpdates = true;
          console.log('📥 Updated teamBBalls to:', gameStateData.teamBBalls);
        }
        if (gameStateData.currentGameNumber !== undefined) {
          newState.currentGameNumber = gameStateData.currentGameNumber;
          newState.gameLabel = `GAME ${gameStateData.currentGameNumber}`; // Update game label when game number changes
          hasUpdates = true;
          console.log('📥 Updated currentGameNumber to:', gameStateData.currentGameNumber);
        }
        if (gameStateData.teamAHasBreak !== undefined) {
          newState.teamAHasBreak = gameStateData.teamAHasBreak;
          hasUpdates = true;
          console.log('📥 Break status update received, updating teamAHasBreak to:', gameStateData.teamAHasBreak);
          console.log('📥 Current break status before update:', prevState.teamAHasBreak);
          console.log('📥 New break status after update:', newState.teamAHasBreak);
          console.log('📥 Full game state data received:', gameStateData);
        }
        if (gameStateData.isGameActive !== undefined) {
          newState.isGameActive = gameStateData.isGameActive;
          hasUpdates = true;
        }
        if (gameStateData.winner !== undefined) {
          newState.winner = gameStateData.winner;
          hasUpdates = true;
        }
        if (gameStateData.gameInfo) {
          newState.teamAName = gameStateData.gameInfo.teamAName;
          newState.teamBName = gameStateData.gameInfo.teamBName;
          newState.gameDescription = gameStateData.gameInfo.gameDescription;
          hasUpdates = true;
        }
        // REMOVED: Game history sync - bet history is now completely local and immutable
        // No external updates can modify bet history
        
        if (hasUpdates) {
          console.log('📥 Game state updated successfully:', {
            teamAGames: newState.teamAGames,
            teamBGames: newState.teamBGames,
            teamABalls: newState.teamABalls,
            teamBBalls: newState.teamBBalls
          });
        }
        
        return newState;
      });
    });

    // Listen for timer updates from other clients
    socketIOService.onTimerUpdate((timerData: TimerSyncData) => {
      console.log('📥 Received timer update from server:', timerData);
      
      // Set flag to prevent local timer conflicts
      isReceivingServerUpdate.current = true;
      
      // Stop local timer when receiving server update to prevent drift
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      setGameState(prevState => ({
        ...prevState,
        isTimerRunning: timerData.isTimerRunning,
        timerSeconds: timerData.timerSeconds
      }));
      
      // Reset flag after a short delay
      setTimeout(() => {
        isReceivingServerUpdate.current = false;
      }, 100);
    });

    // Listen for dedicated break status updates
    socketIOService.onBreakStatusUpdate((data: { teamAHasBreak: boolean }) => {
      console.log('📥 Received dedicated break status update:', data);
      setGameState(prevState => ({
        ...prevState,
        teamAHasBreak: data.teamAHasBreak
      }));
    });

    // Listen for total booked coins updates
    socketIOService.onTotalBookedCoinsUpdate((data: { totalBookedAmount: number, nextTotalBookedAmount: number }) => {
      console.log('📥 Received total booked coins update:', data);
      setGameState(prevState => ({
        ...prevState,
        totalBookedAmount: data.totalBookedAmount,
        nextTotalBookedAmount: data.nextTotalBookedAmount
      }));
    });

    // Listen for score updates from other clients
    socketIOService.onScoreUpdate((scoreData: ScoreSyncData) => {
      console.log('📥 Received score update from server:', scoreData);
      
      setGameState(prevState => ({
        ...prevState,
        teamAGames: scoreData.teamAScore,
        teamBGames: scoreData.teamBScore
      }));
    });

    return () => {
      // Cleanup: disconnect when component unmounts
      socketIOService.disconnect();
    };
  }, []);

  // Server-authoritative timer effect for perfect synchronization
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    // Only run local timer if we're not receiving server updates
    if (gameState.isTimerRunning && !isReceivingServerUpdate.current) {
      // Request server time every second to stay synchronized
      intervalId = setInterval(() => {
        // Emit timer heartbeat to get server's current time
        socketIOService.emitTimerHeartbeat();
      }, 1000);
      
      // Store interval for cleanup
      timerIntervalRef.current = intervalId;
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [gameState.isTimerRunning]);

  // Handle visibility changes to ensure timer accuracy when tab becomes active again (mobile-friendly)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (gameState.isTimerRunning && !document.hidden && !isReceivingServerUpdate.current) {
        // Tab became visible again, restart timer to ensure accuracy
        console.log('📱 App became visible, restarting timer for accuracy');
        
        // Clear existing timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        // Restart timer with current state
        const startTime = Date.now();
        const startSeconds = gameState.timerSeconds;
        
        const intervalId = setInterval(() => {
            const currentTime = Date.now();
            const elapsed = Math.floor((currentTime - startTime) / 1000);
            const newSeconds = startSeconds + elapsed;
            
          setGameState(prev => {
            if (prev.timerSeconds !== newSeconds) {
              return {
                ...prev,
                timerSeconds: newSeconds
              };
            }
            return prev;
          });
        }, 1000);
        
        timerIntervalRef.current = intervalId;
      } else if (document.hidden) {
        console.log('📱 App went to background, timer will continue');
      }
    };

    // Add event listeners for mobile app lifecycle
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Mobile-specific events
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('blur', () => {
      console.log('📱 Window lost focus');
    });
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('blur', () => {});
    };
  }, [gameState.isTimerRunning, gameState.timerSeconds]);

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState(prevState => {
      const newState = { ...prevState, ...updates };
      
      // Update game label when game number changes
      if (updates.currentGameNumber !== undefined) {
        newState.gameLabel = `GAME ${updates.currentGameNumber}`;
      }
      
      // Emit changes to other clients via Socket.IO
      if (socketIOService.isSocketConnected()) {
        console.log('📤 Socket.IO connected, emitting updates:', updates);
        
        // Emit bet-related updates
        if (updates.teamAQueue || updates.teamBQueue || updates.bookedBets || updates.nextBookedBets || updates.nextTeamAQueue || updates.nextTeamBQueue) {
          const betData: BetSyncData = {};
          if (updates.teamAQueue) betData.teamAQueue = updates.teamAQueue;
          if (updates.teamBQueue) betData.teamBQueue = updates.teamBQueue;
          if (updates.bookedBets) betData.bookedBets = updates.bookedBets;
          if (updates.nextBookedBets) betData.nextGameBets = updates.nextBookedBets;
          if (updates.nextTeamAQueue) betData.nextTeamAQueue = updates.nextTeamAQueue;
          if (updates.nextTeamBQueue) betData.nextTeamBQueue = updates.nextTeamBQueue;
          
          console.log('📤 Emitting bet update:', betData);
          console.log('📤 Sample bet with userName:', betData.teamAQueue?.[0] || betData.teamBQueue?.[0]);
          socketIOService.emitBetUpdate(betData);
        }
        
        // Emit total booked coins updates
        if (updates.totalBookedAmount !== undefined || updates.nextTotalBookedAmount !== undefined) {
          const totalBookedAmount = updates.totalBookedAmount !== undefined ? updates.totalBookedAmount : newState.totalBookedAmount;
          const nextTotalBookedAmount = updates.nextTotalBookedAmount !== undefined ? updates.nextTotalBookedAmount : newState.nextTotalBookedAmount;
          
          console.log('📤 Emitting total booked coins update:', { totalBookedAmount, nextTotalBookedAmount });
          socketIOService.emitTotalBookedCoinsUpdate(totalBookedAmount, nextTotalBookedAmount);
        }
        
        // Emit game state updates
        if (updates.teamAGames !== undefined || updates.teamBGames !== undefined || 
            updates.teamABalls !== undefined || updates.teamBBalls !== undefined ||
            updates.isGameActive !== undefined || updates.winner !== undefined ||
            updates.currentGameNumber !== undefined || // Added game number to condition
            updates.teamAHasBreak !== undefined || // Added break status to condition
            updates.teamAName || updates.teamBName || updates.gameDescription) {
          const gameStateData: GameStateSyncData = {};
          if (updates.teamAGames !== undefined) gameStateData.teamAScore = updates.teamAGames;
          if (updates.teamBGames !== undefined) gameStateData.teamBScore = updates.teamBGames;
          if (updates.teamABalls !== undefined) gameStateData.teamABalls = updates.teamABalls;
          if (updates.teamBBalls !== undefined) gameStateData.teamBBalls = updates.teamBBalls;
          if (updates.isGameActive !== undefined) gameStateData.isGameActive = updates.isGameActive;
          if (updates.winner !== undefined) gameStateData.winner = updates.winner;
          if (updates.currentGameNumber !== undefined) gameStateData.currentGameNumber = updates.currentGameNumber; // Added game number emission
          if (updates.teamAHasBreak !== undefined) {
            gameStateData.teamAHasBreak = updates.teamAHasBreak; // Added break status emission
            console.log('📤 Break status change detected, emitting:', updates.teamAHasBreak);
            // Also emit dedicated break status update
            socketIOService.emitBreakStatusUpdate(updates.teamAHasBreak);
          }
          if (updates.teamAName || updates.teamBName || updates.gameDescription) {
            gameStateData.gameInfo = {
              teamAName: updates.teamAName || prevState.teamAName,
              teamBName: updates.teamBName || prevState.teamBName,
              gameTitle: "Game Bird",
              gameDescription: updates.gameDescription || prevState.gameDescription
            };
          }
          
          console.log('📤 Emitting game state update:', gameStateData);
          socketIOService.emitGameStateUpdate(gameStateData);
        }
        
        // Emit timer updates
        if (updates.isTimerRunning !== undefined || updates.timerSeconds !== undefined) {
          const timerData: TimerSyncData = {
            isTimerRunning: updates.isTimerRunning !== undefined ? updates.isTimerRunning : prevState.isTimerRunning,
            timerSeconds: updates.timerSeconds !== undefined ? updates.timerSeconds : prevState.timerSeconds
          };
          
          socketIOService.emitTimerUpdate(timerData);
        }
        
        // Emit score updates
        if (updates.teamAGames !== undefined || updates.teamBGames !== undefined) {
          const scoreData: ScoreSyncData = {
            teamAScore: updates.teamAGames !== undefined ? updates.teamAGames : prevState.teamAGames,
            teamBScore: updates.teamBGames !== undefined ? updates.teamBGames : prevState.teamBGames
          };
          
          socketIOService.emitScoreUpdate(scoreData);
        }
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
    console.log('🕐 Starting timer');
    // Clear any existing interval first
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    updateGameState({
      isTimerRunning: true
    });
  };

  const pauseTimer = () => {
    console.log('⏸️ Pausing timer');
    // Clear interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    updateGameState({
      isTimerRunning: false
    });
  };

  const resetTimer = () => {
    console.log('🔄 Resetting timer');
    // Clear interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    updateGameState({
      timerSeconds: 0,
      isTimerRunning: false
    });
  };

  const setTimer = (seconds: number) => {
    // Clear interval when setting new value
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    updateGameState({
      timerSeconds: seconds,
      isTimerRunning: false
    });
  };

  // Auto-reset timer when match starts or game is won
  const resetTimerOnMatchStart = () => {
    // Clear interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    updateGameState({
      timerSeconds: 0,
      isTimerRunning: false
    });
  };

  const resetTimerOnGameWin = () => {
    console.log('🏆 Resetting timer on game win');
    // Clear interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
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
