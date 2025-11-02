import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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

// Get arena ID from window object (set by OnePocketArena.tsx)
const getArenaId = () => {
  return (window as any).__ARENA_ID || 'default';
};

// Use functions to get storage keys dynamically
const getGameStateStorageKey = () => `betting_app_game_state_${getArenaId()}`;
const getLocalAdminStorageKey = () => `betting_app_local_admin_state_${getArenaId()}`;

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
  const location = useLocation();
  const { betHistory, userBetReceipts } = useUser();
  
  // Separate state for each arena
  const [gameStateDefault, setGameStateDefault] = useState<GameState>(defaultGameState);
  const [gameStateOnePocket, setGameStateOnePocket] = useState<GameState>(defaultGameState);
  const [localAdminStateDefault, setLocalAdminStateDefault] = useState<LocalAdminState>({ isAdminMode: false, isAgentMode: false });
  const [localAdminStateOnePocket, setLocalAdminStateOnePocket] = useState<LocalAdminState>({ isAdminMode: false, isAgentMode: false });

  // Get the current arena ID from the location hash
  const getArenaIdFromRoute = () => {
    if (window.location.hash.includes('/one-pocket-arena')) {
      return 'one_pocket';
    }
    return 'default';
  };

  const currentArenaId = getArenaIdFromRoute();

  // Helper function to get the correct state object for the current arena
  const getCurrentGameState = () => {
    return currentArenaId === 'one_pocket' ? gameStateOnePocket : gameStateDefault;
  };

  const getCurrentLocalAdminState = () => {
    return currentArenaId === 'one_pocket' ? localAdminStateOnePocket : localAdminStateDefault;
  };

  // Helper function to set state for the current arena
  const setCurrentGameState = (state: GameState) => {
    if (currentArenaId === 'one_pocket') {
      setGameStateOnePocket(state);
    } else {
      setGameStateDefault(state);
    }
  };

  const setCurrentLocalAdminState = (state: LocalAdminState) => {
    if (currentArenaId === 'one_pocket') {
      setLocalAdminStateOnePocket(state);
    } else {
      setLocalAdminStateDefault(state);
    }
  };
  
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to track if we're receiving server updates to prevent local timer conflicts
  const isReceivingServerUpdate = useRef(false);
  
  // Load game state from localStorage on mount
  useEffect(() => {
    const storageKey = `betting_app_game_state_${currentArenaId}`;
    console.log(`🎯 [GameStateContext] Loading state for arena: "${currentArenaId}"`);
    const storedGameState = localStorage.getItem(storageKey);
    if (storedGameState) {
      try {
        const parsedState = JSON.parse(storedGameState);
        setCurrentGameState(parsedState);
      } catch (error) {
        console.error('Error parsing stored game state:', error);
      setCurrentGameState(defaultGameState);
      }
    }
  }, [currentArenaId]);

  // Load local admin state from localStorage on mount (separate from game state)
  useEffect(() => {
    const storageKey = `betting_app_local_admin_state_${currentArenaId}`;
    const storedLocalAdminState = localStorage.getItem(storageKey);
    if (storedLocalAdminState) {
      try {
        const parsedState = JSON.parse(storedLocalAdminState);
        // IMPORTANT: Always reset isAdminMode to false on page load to require password entry
        // But preserve isAgentMode if it was previously set
        setCurrentLocalAdminState({
          ...parsedState,
          isAdminMode: false  // Always require password on page reload
        });
      } catch (error) {
        console.error('Error parsing stored local admin state:', error);
        setCurrentLocalAdminState(defaultLocalAdminState);
      }
    }
  }, [currentArenaId]);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    const storageKey = `betting_app_game_state_${currentArenaId}`;
    localStorage.setItem(storageKey, JSON.stringify(getCurrentGameState()));
  }, [getCurrentGameState(), currentArenaId]);

  // Save local admin state to localStorage whenever it changes (separate from game state)
  useEffect(() => {
    const storageKey = `betting_app_local_admin_state_${currentArenaId}`;
    // Only persist isAgentMode, NOT isAdminMode (admin mode requires password every time)
    const stateToSave = {
      isAdminMode: false,  // Never save admin mode - must re-authenticate
      isAgentMode: getCurrentLocalAdminState().isAgentMode  // Keep agent mode preference
    };
    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
  }, [getCurrentLocalAdminState(), currentArenaId]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const expectedKey = `betting_app_game_state_${currentArenaId}`;
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === expectedKey && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          setCurrentGameState(newState);
        } catch (error) {
          console.error('Error parsing updated game state:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentArenaId]);

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

    // Helper to validate arena before processing update
    const validateArenaAndUpdate = (incomingArenaId: string, updateProcessor: () => void) => {
      console.log(`🎯 [ARENA VALIDATION] Current arena: ${currentArenaId}, Incoming arena: ${incomingArenaId}`);
      // Only process if the incoming data is for the current arena
      if (incomingArenaId === currentArenaId) {
        console.log(`✅ [ARENA VALIDATION] Arena matches! Processing update...`);
        updateProcessor();
      } else {
        console.log(`❌ [ARENA VALIDATION] Arena mismatch! Ignoring update for ${incomingArenaId}`);
      }
    };

    // Listen for bet updates from other clients
    socketIOService.onBetUpdate((betData: BetSyncData) => {
      validateArenaAndUpdate(betData.arenaId, () => {
        try {
          console.log('📥 Received bet update from server:', betData);
          console.log('📥 Current state before update:', {
            teamAQueueLength: getCurrentGameState().teamAQueue.length,
            teamBQueueLength: getCurrentGameState().teamBQueue.length,
            bookedBetsLength: getCurrentGameState().bookedBets.length
          });
          
          setCurrentGameState(prevState => {
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
            
            if (betData.totalBookedAmount !== undefined) {
              console.log('📥 Updating totalBookedAmount:', betData.totalBookedAmount);
              newState.totalBookedAmount = betData.totalBookedAmount;
              hasUpdates = true;
            }
            
            if (betData.nextTotalBookedAmount !== undefined) {
              console.log('📥 Updating nextTotalBookedAmount:', betData.nextTotalBookedAmount);
              newState.nextTotalBookedAmount = betData.nextTotalBookedAmount;
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
        } catch (err) {
          console.error('❌ Error processing bet update:', err);
        }
      });
    });

    // Listen for game state updates from other clients
    socketIOService.onGameStateUpdate((gameStateData: GameStateSyncData) => {
      validateArenaAndUpdate(gameStateData.arenaId, () => {
        console.log('📥 Received game state update from server:', gameStateData);
        
        setCurrentGameState(prevState => {
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
            newState.gameLabel = `GAME ${gameStateData.currentGameNumber}`;
            hasUpdates = true;
            console.log('📥 Updated currentGameNumber to:', gameStateData.currentGameNumber);
          }
          if (gameStateData.teamAHasBreak !== undefined) {
            newState.teamAHasBreak = gameStateData.teamAHasBreak;
            hasUpdates = true;
            console.log('📥 Updated teamAHasBreak to:', gameStateData.teamAHasBreak);
          }
          if (gameStateData.isGameActive !== undefined) {
            newState.isGameActive = gameStateData.isGameActive;
            hasUpdates = true;
          }
          if (gameStateData.winner !== undefined) {
            newState.winner = gameStateData.winner;
            hasUpdates = true;
          }
          
          return hasUpdates ? newState : prevState;
        });
      });
    });

    // Listen for timer updates from other clients
    socketIOService.onTimerUpdate((timerData: TimerSyncData) => {
      validateArenaAndUpdate(timerData.arenaId, () => {
        console.log('📥 Received timer update from server:', timerData);
        
        // Set flag to prevent local timer conflicts
        isReceivingServerUpdate.current = true;
        
        // Stop local timer when receiving server update to prevent drift
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        setCurrentGameState(prevState => ({
          ...prevState,
          isTimerRunning: timerData.isTimerRunning,
          timerSeconds: timerData.timerSeconds
        }));
        
        // Reset flag after a short delay
        setTimeout(() => {
          isReceivingServerUpdate.current = false;
        }, 100);
      });
    });

    // Listen for dedicated break status updates
    socketIOService.onBreakStatusUpdate((data: { teamAHasBreak: boolean }) => {
      validateArenaAndUpdate(data.arenaId, () => {
        console.log('📥 Received dedicated break status update:', data);
        setCurrentGameState(prevState => ({
          ...prevState,
          teamAHasBreak: data.teamAHasBreak
        }));
      });
    });

    // Listen for total booked coins updates
    socketIOService.onTotalBookedCoinsUpdate((data: { totalBookedAmount: number, nextTotalBookedAmount: number }) => {
      validateArenaAndUpdate(data.arenaId, () => {
        console.log('📥 Received total booked coins update:', data);
        setCurrentGameState(prevState => ({
          ...prevState,
          totalBookedAmount: data.totalBookedAmount,
          nextTotalBookedAmount: data.nextTotalBookedAmount
        }));
      });
    });

    // Listen for score updates from other clients
    socketIOService.onScoreUpdate((scoreData: ScoreSyncData) => {
      validateArenaAndUpdate(scoreData.arenaId, () => {
        console.log('📥 Received score update from server:', scoreData);
        
        setCurrentGameState(prevState => ({
          ...prevState,
          teamAGames: scoreData.teamAScore,
          teamBGames: scoreData.teamBScore
        }));
      });
    });

    return () => {
      // Cleanup: disconnect when component unmounts
      socketIOService.disconnect();
    };
  }, [currentArenaId]);

  // Server-authoritative timer effect for perfect synchronization
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    // Only run local timer if we're not receiving server updates
    if (getCurrentGameState().isTimerRunning && !isReceivingServerUpdate.current) {
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
  }, [getCurrentGameState().isTimerRunning]);

  // Handle visibility changes to ensure timer accuracy when tab becomes active again (mobile-friendly)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (getCurrentGameState().isTimerRunning && !document.hidden && !isReceivingServerUpdate.current) {
        // Tab became visible again, restart timer to ensure accuracy
        console.log('📱 App became visible, restarting timer for accuracy');
        
        // Clear existing timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        // Restart timer with current state
        const startTime = Date.now();
        const startSeconds = getCurrentGameState().timerSeconds;
        
        const intervalId = setInterval(() => {
            const currentTime = Date.now();
            const elapsed = Math.floor((currentTime - startTime) / 1000);
            const newSeconds = startSeconds + elapsed;
            
          setCurrentGameState(prev => {
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
  }, [getCurrentGameState().isTimerRunning, getCurrentGameState().timerSeconds]);

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setCurrentGameState(prevState => {
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
    setCurrentLocalAdminState(prevState => ({ ...prevState, ...updates }));
  };

  const resetGameState = () => {
    setCurrentGameState(defaultGameState);
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
    gameState: getCurrentGameState(),
    updateGameState,
    resetGameState,
    isAdmin,
    localAdminState: getCurrentLocalAdminState(),
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
