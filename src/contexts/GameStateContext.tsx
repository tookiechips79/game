import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Bet, BookedBet } from '@/types/user';
import { socketIOService, BetSyncData, GameStateSyncData, TimerSyncData, ScoreSyncData } from '@/services/socketIOService';
import { useUser } from './UserContext';
import { debounce } from '@/utils/timerUtils';

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
  arenaId?: string; // Add arenaId to GameState interface
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

const defaultGameStateOnePocket: GameState = {
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

// LocalStorage keys for persistence
const STORAGE_KEY_ONE_POCKET_ARENA = 'gameState_one_pocket_arena';
const STORAGE_KEY_ADMIN_ONE_POCKET = 'adminState_one_pocket_arena';
const STORAGE_KEY_ADMIN_DEFAULT = 'adminState_default_arena';

// Helper to save state to localStorage
const saveGameStateToStorage = (arenaId: string, state: GameState) => {
  const key = STORAGE_KEY_ONE_POCKET_ARENA;
  try {
    // Only store critical fields to reduce size
    // IMPORTANT: Do NOT save timer state - timers should reset on page load
    const toStore = {
      teamAName: state.teamAName,
      teamBName: state.teamBName,
      teamAGames: state.teamAGames,
      teamBGames: state.teamBGames,
      teamABalls: state.teamABalls,
      teamBBalls: state.teamBBalls,
      teamAHasBreak: state.teamAHasBreak,
      currentGameNumber: state.currentGameNumber,
      gameDescription: state.gameDescription,
      // DO NOT SAVE TIMER: timerSeconds, isTimerRunning - these should reset on refresh
      betCounter: state.betCounter,
      colorIndex: state.colorIndex,
      // Betting queues
      teamAQueue: state.teamAQueue,
      teamBQueue: state.teamBQueue,
      bookedBets: state.bookedBets,
      nextTeamAQueue: state.nextTeamAQueue,
      nextTeamBQueue: state.nextTeamBQueue,
      nextBookedBets: state.nextBookedBets,
      totalBookedAmount: state.totalBookedAmount,
      nextTotalBookedAmount: state.nextTotalBookedAmount
    };
    localStorage.setItem(key, JSON.stringify(toStore));
    
    // VERIFY: Log what was actually saved
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log(`💾 [SAVE] Arena "${arenaId}" saved to localStorage:`, {
        key,
        teamAQueueLength: parsed.teamAQueue?.length || 0,
        teamBQueueLength: parsed.teamBQueue?.length || 0,
        bookedBetsLength: parsed.bookedBets?.length || 0,
        teamAGames: parsed.teamAGames,
        teamBGames: parsed.teamBGames,
        sizeKB: (saved.length / 1024).toFixed(2)
      });
    }
  } catch (error) {
    console.error(`Failed to save game state to localStorage for arena ${arenaId}:`, error);
  }
};

// Helper to load state from localStorage
const loadGameStateFromStorage = (arenaId: string): GameState => {
  const key = STORAGE_KEY_ONE_POCKET_ARENA;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultGameState, ...parsed };
    }
  } catch (error) {
    console.error(`Failed to load game state from localStorage for arena ${arenaId}:`, error);
  }
  return defaultGameState;
};

// Helper to load admin state from localStorage
const loadAdminStateFromStorage = (arenaId: string): LocalAdminState => {
  const key = arenaId === 'one_pocket' ? STORAGE_KEY_ADMIN_ONE_POCKET : STORAGE_KEY_ADMIN_DEFAULT;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error(`Failed to load admin state from localStorage for arena ${arenaId}:`, error);
  }
  return defaultLocalAdminState;
};

// Helper to save admin state to localStorage
const saveAdminStateToStorage = (arenaId: string, state: LocalAdminState) => {
  const key = arenaId === 'one_pocket' ? STORAGE_KEY_ADMIN_ONE_POCKET : STORAGE_KEY_ADMIN_DEFAULT;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error(`Failed to save admin state to localStorage for arena ${arenaId}:`, error);
  }
};

export const GameStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { betHistory, userBetReceipts } = useUser();
  
  // Single arena state (one_pocket only)
  // FULL SERVER-AUTHORITATIVE MODEL: Initialize with defaults, server will send actual state
  const [gameStateOnePocket, setGameStateOnePocket] = useState<GameState>(defaultGameStateOnePocket);
  const [localAdminStateOnePocket, setLocalAdminStateOnePocket] = useState<LocalAdminState>(() => loadAdminStateFromStorage('one_pocket'));

  // Single arena: one_pocket
  const currentArenaId = 'one_pocket';

  // Helper function to get the correct state object for the current arena
  const getCurrentGameState = () => {
    return gameStateOnePocket;
  };

  const getCurrentLocalAdminState = () => {
    return localAdminStateOnePocket;
  };

  // Helper function to set state for the current arena
  const setCurrentGameState = (state: GameState) => {
    setGameStateOnePocket(state);
  };

  const setCurrentLocalAdminState = (state: LocalAdminState) => {
    setLocalAdminStateOnePocket(state);
  };
  
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
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

  // SMART FALLBACK: Keep localStorage saves as backup ONLY
  // Primary: Server is source of truth
  // Fallback (if server doesn't respond): Use localStorage to prevent black screen
  // This ensures good UX while maintaining server-authoritative architecture
  
  // Only save as fallback for emergency scenarios
  useEffect(() => {
    if (gameStateOnePocket && gameStateOnePocket.teamAName !== "Player A") {
      // Only save if state has actual data (not defaults)
      saveGameStateToStorage('one_pocket', gameStateOnePocket);
    }
  }, [gameStateOnePocket]);

  // CROSS-TAB SYNC: Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key) return;
      
      // Load game state if it changed in another tab
      if (event.key === STORAGE_KEY_ONE_POCKET_ARENA && currentArenaId === 'one_pocket') {
        try {
          const newState = JSON.parse(event.newValue || '{}');
          setGameStateOnePocket(prev => ({ ...prev, ...newState }));
        } catch (e) {
          console.error('Failed to sync game state from other tab:', e);
        }
      }
      
      // Load admin state if it changed in another tab
      if (event.key === STORAGE_KEY_ADMIN_DEFAULT && currentArenaId === 'default') {
        try {
          const newState = JSON.parse(event.newValue || '{}');
          setLocalAdminStateDefault(newState);
        } catch (e) {
          console.error('Failed to sync admin state from other tab:', e);
        }
      }
      
      if (event.key === STORAGE_KEY_ADMIN_ONE_POCKET && currentArenaId === 'one_pocket') {
        try {
          const newState = JSON.parse(event.newValue || '{}');
          setLocalAdminStateOnePocket(newState);
        } catch (e) {
          console.error('Failed to sync admin state from other tab:', e);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentArenaId]);

  // RECOVERY: When tab becomes visible again, request fresh state from server
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab is now visible - request fresh state from server to ensure sync
        socketIOService.requestGameState();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Request latest game state from server when arena changes
  useEffect(() => {
    const requestGameState = () => {
      console.log(`📤 [ARENA SWITCH] Requesting game state for arena: "${currentArenaId}" - forcing server sync`);
      socketIOService.requestGameState();
    };

    // Request immediately when arena changes to get fresh server state
    // Don't rely on stale localStorage data
    requestGameState();
    
    // Also request after a small delay to handle socket reconnection
    const timer = setTimeout(requestGameState, 100);
    return () => clearTimeout(timer);
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
    const getArenaLabel = (arenaId: string) => {
      return arenaId === 'one_pocket' ? '🎯 [1-POCKET]' : '🎱 [9-BALL]';
    };
    
    const validateArenaAndUpdate = (incomingArenaId: string, updateProcessor: () => void) => {
      const currentLabel = getArenaLabel(currentArenaId);
      const incomingLabel = getArenaLabel(incomingArenaId);
      console.log(`🎯 [ARENA VALIDATION] Current: ${currentLabel}, Incoming: ${incomingLabel}`);
      // Only process if the incoming data is for the current arena
      if (incomingArenaId === currentArenaId) {
        console.log(`✅ [ARENA VALIDATION] ${currentLabel} matches! Processing update...`);
        updateProcessor();
      } else {
        console.log(`❌ [ARENA VALIDATION] ${currentLabel} != ${incomingLabel}. Ignoring update!`);
      }
    };

    // Listen for bet updates from other clients
    socketIOService.onBetUpdate((betData: BetSyncData) => {
      validateArenaAndUpdate(betData.arenaId, () => {
        try {
          console.log('📥 Received bet update from server:', betData);
          
          setCurrentGameState(prevState => {
            const newState = { ...prevState };
            let hasUpdates = false;
            
            // SMART MERGE: Only accept server updates that have actual data
            // Prevent empty server state from overwriting good local data
            
            if (betData.teamAQueue !== undefined && betData.teamAQueue.length > 0) {
              newState.teamAQueue = betData.teamAQueue;
              hasUpdates = true;
            } else if (betData.teamAQueue !== undefined && betData.teamAQueue.length === 0 && prevState.teamAQueue.length > 0) {
              // Don't overwrite local bets with empty array from server
              // Keep local data if server sends nothing
              console.log('⚠️ Server sent empty teamAQueue, keeping local data');
            } else if (betData.teamAQueue !== undefined) {
              newState.teamAQueue = betData.teamAQueue;
              hasUpdates = true;
            }
            
            if (betData.teamBQueue !== undefined && betData.teamBQueue.length > 0) {
              newState.teamBQueue = betData.teamBQueue;
              hasUpdates = true;
            } else if (betData.teamBQueue !== undefined && betData.teamBQueue.length === 0 && prevState.teamBQueue.length > 0) {
              console.log('⚠️ Server sent empty teamBQueue, keeping local data');
            } else if (betData.teamBQueue !== undefined) {
              newState.teamBQueue = betData.teamBQueue;
              hasUpdates = true;
            }
            
            if (betData.bookedBets !== undefined && betData.bookedBets.length > 0) {
              newState.bookedBets = betData.bookedBets;
              hasUpdates = true;
            } else if (betData.bookedBets !== undefined && betData.bookedBets.length === 0 && prevState.bookedBets.length > 0) {
              console.log('⚠️ Server sent empty bookedBets, keeping local data');
            } else if (betData.bookedBets !== undefined) {
              newState.bookedBets = betData.bookedBets;
              hasUpdates = true;
            }
            
            if (betData.nextGameBets !== undefined) {
              newState.nextBookedBets = betData.nextGameBets;
              hasUpdates = true;
            }
            if (betData.nextTeamAQueue !== undefined) {
              newState.nextTeamAQueue = betData.nextTeamAQueue;
              hasUpdates = true;
            }
            if (betData.nextTeamBQueue !== undefined) {
              newState.nextTeamBQueue = betData.nextTeamBQueue;
              hasUpdates = true;
            }
            
            if (betData.totalBookedAmount !== undefined) {
              newState.totalBookedAmount = betData.totalBookedAmount;
              hasUpdates = true;
            }
            
            if (betData.nextTotalBookedAmount !== undefined) {
              newState.nextTotalBookedAmount = betData.nextTotalBookedAmount;
              hasUpdates = true;
            }
            
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
        
        setCurrentGameState(prevState => ({
          ...prevState,
          isTimerRunning: timerData.isTimerRunning,
          timerSeconds: timerData.timerSeconds
        }));
        
        isReceivingServerUpdate.current = false;
      });
    });

    // Listen for dedicated break status updates
    socketIOService.onBreakStatusUpdate((data: { teamAHasBreak: boolean, arenaId?: string }) => {
      validateArenaAndUpdate(data.arenaId, () => {
        console.log('📥 Received dedicated break status update:', data);
        setCurrentGameState(prevState => ({
          ...prevState,
          teamAHasBreak: data.teamAHasBreak
        }));
      });
    });

    // Listen for total booked coins updates
    socketIOService.onTotalBookedCoinsUpdate((data: { totalBookedAmount: number, nextTotalBookedAmount: number, arenaId?: string }) => {
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
        console.log(`   Will update teamAGames to ${scoreData.teamAScore}, teamBGames to ${scoreData.teamBScore}`);
        
        setCurrentGameState(prevState => {
          console.log('   Current state before update - A: ', prevState.teamAGames, ', B: ', prevState.teamBGames);
          const newState = {
            ...prevState,
            teamAGames: scoreData.teamAScore,
            teamBGames: scoreData.teamBScore
          };
          console.log('   New state after update - A: ', newState.teamAGames, ', B: ', newState.teamBGames);
          return newState;
        });
      });
    });

    // Listen for sound events from other clients
    socketIOService.onSoundEvent((soundData) => {
      validateArenaAndUpdate(soundData.arenaId, () => {
        console.log(`🔊 Playing sound '${soundData.soundType}' from arena '${soundData.arenaId}'`);
        // Import and play the sound based on soundType
        // This will be handled by emitting a custom event that components can listen to
        window.dispatchEvent(new CustomEvent('playSound', { detail: { soundType: soundData.soundType } }));
      });
    });

    // CRITICAL: Listen for game state updates from server (new browser sync)
    if (socketIOService.socket) {
      socketIOService.socket.off('game-state-update');
      socketIOService.socket.on('game-state-update', (data) => {
        console.log('📥 [GAME STATE UPDATE] Received from server:', data);
        validateArenaAndUpdate(data.arenaId, () => {
          setCurrentGameState(prevState => ({
            ...prevState,
            ...data
          }));
        });
      });
    }

    // CRITICAL: Listen for bet updates from server (new browser sync)
    if (socketIOService.socket) {
      socketIOService.socket.off('bet-update');
      socketIOService.socket.on('bet-update', (data) => {
        console.log('📥 [BET UPDATE] Received from server:', data);
        validateArenaAndUpdate(data.arenaId, () => {
          setCurrentGameState(prevState => ({
            ...prevState,
            teamAQueue: data.teamAQueue || prevState.teamAQueue,
            teamBQueue: data.teamBQueue || prevState.teamBQueue,
            bookedBets: data.bookedBets || prevState.bookedBets,
            nextTeamAQueue: data.nextTeamAQueue || prevState.nextTeamAQueue,
            nextTeamBQueue: data.nextTeamBQueue || prevState.nextTeamBQueue,
            nextBookedBets: data.nextGameBets || prevState.nextBookedBets
          }));
        });
      });
    }

    // Listen for team names updates from other devices (CROSS-DEVICE SYNC)
    socketIOService.onTeamNamesUpdate((teamNamesData) => {
      validateArenaAndUpdate(teamNamesData.arenaId, () => {
        console.log(`👥 [CROSS-DEVICE SYNC] Received team names update: ${teamNamesData.teamAName} vs ${teamNamesData.teamBName}`);
        setCurrentGameState(prevState => ({
          ...prevState,
          teamAName: teamNamesData.teamAName,
          teamBName: teamNamesData.teamBName
        }));
      });
    });

    // Listen for admin state updates from other devices (CROSS-DEVICE SYNC)
    socketIOService.onAdminStateUpdate((adminStateData) => {
      validateArenaAndUpdate(adminStateData.arenaId, () => {
        console.log(`⚙️ [CROSS-DEVICE SYNC] Received admin state update for arena '${adminStateData.arenaId}'`);
        setCurrentLocalAdminState(adminStateData.adminState);
      });
    });

    // 🎯 NEW: Listen for complete arena state snapshot when switching arenas
    // This is the PRIMARY listener for ensuring all data comes from server
    socketIOService.onArenaStateSnapshot((snapshotData) => {
      validateArenaAndUpdate(snapshotData.arenaId, () => {
        console.log(`📡 [ARENA-STATE-SNAPSHOT] Received complete state snapshot for arena '${snapshotData.arenaId}':`, snapshotData.gameState);
        
        // Replace ENTIRE game state with server's snapshot
        // This ensures we have authoritative data from server
        const { gameState } = snapshotData;
        
        setCurrentGameState(prevState => ({
          ...prevState,
          // Game counts and scores
          teamAGames: gameState.teamAGames !== undefined ? gameState.teamAGames : prevState.teamAGames,
          teamBGames: gameState.teamBGames !== undefined ? gameState.teamBGames : prevState.teamBGames,
          teamABalls: gameState.teamABalls !== undefined ? gameState.teamABalls : prevState.teamABalls,
          teamBBalls: gameState.teamBBalls !== undefined ? gameState.teamBBalls : prevState.teamBBalls,
          currentGameNumber: gameState.currentGameNumber !== undefined ? gameState.currentGameNumber : prevState.currentGameNumber,
          teamAHasBreak: gameState.teamAHasBreak !== undefined ? gameState.teamAHasBreak : prevState.teamAHasBreak,
          // Betting queues
          teamAQueue: gameState.teamAQueue || prevState.teamAQueue,
          teamBQueue: gameState.teamBQueue || prevState.teamBQueue,
          bookedBets: gameState.bookedBets || prevState.bookedBets,
          nextTeamAQueue: gameState.nextTeamAQueue || prevState.nextTeamAQueue,
          nextTeamBQueue: gameState.nextTeamBQueue || prevState.nextTeamBQueue,
          nextBookedBets: gameState.nextBookedBets || prevState.nextBookedBets,
          // Coin totals
          totalBookedAmount: gameState.totalBookedAmount !== undefined ? gameState.totalBookedAmount : prevState.totalBookedAmount,
          nextTotalBookedAmount: gameState.nextTotalBookedAmount !== undefined ? gameState.nextTotalBookedAmount : prevState.nextTotalBookedAmount,
          // Game state
          isGameActive: gameState.isGameActive !== undefined ? gameState.isGameActive : prevState.isGameActive,
          winner: gameState.winner !== undefined ? gameState.winner : prevState.winner,
          gameLabel: gameState.currentGameNumber !== undefined ? `GAME ${gameState.currentGameNumber}` : prevState.gameLabel,
          // Game info
          teamAName: gameState.gameInfo?.teamAName || prevState.teamAName,
          teamBName: gameState.gameInfo?.teamBName || prevState.teamBName,
          gameDescription: gameState.gameInfo?.gameDescription || prevState.gameDescription
        }));
        
        console.log(`✅ [ARENA-STATE-SNAPSHOT] Updated entire game state from server snapshot`);
      });
    });

    // REQUEST INITIAL STATE IMMEDIATELY on connection
    // This is critical for mobile devices to get fresh data
    socketIOService.requestGameState();
    
    console.log('📡 [INIT] Requested initial game state on connection');

    // FALLBACK: If server doesn't respond within 3 seconds, use localStorage to prevent black screen
    const fallbackTimer = setTimeout(() => {
      console.warn('⚠️ [FALLBACK] Server did not respond within 3 seconds, loading from localStorage as fallback');
      const storedDefault = localStorage.getItem('game_state_default');
      const storedOnePocket = localStorage.getItem('game_state_one_pocket');
      
      if (storedDefault) {
        try {
          setCurrentGameState(JSON.parse(storedDefault));
          console.log('📦 Loaded default arena from localStorage fallback');
        } catch (e) {
          console.error('Error parsing localStorage fallback:', e);
        }
      }
      
      if (storedOnePocket) {
        try {
          const parsed = JSON.parse(storedOnePocket);
          setCurrentGameState(parsed);
          console.log('📦 Loaded one-pocket arena from localStorage fallback');
        } catch (e) {
          console.error('Error parsing localStorage fallback:', e);
        }
      }
    }, 3000);

    return () => {
      // 🎯 CRITICAL CLEANUP: Remove ALL listeners when arena changes or component unmounts
      // This prevents cross-arena contamination where old listeners still fire for new arena
      console.log(`🧹 [ARENA CLEANUP] Cleaning up all Socket.IO listeners`);
      clearTimeout(fallbackTimer);
      
      // Use proper cleanup methods to ensure complete removal
      socketIOService.offBetUpdate();
      socketIOService.offGameStateUpdate();
      socketIOService.offTimerUpdate();
      socketIOService.offScoreUpdate();
      socketIOService.offTeamNamesUpdate();
      socketIOService.offAdminStateUpdate();
      socketIOService.offArenaStateSnapshot();
      socketIOService.offBreakStatusUpdate();
      socketIOService.offTotalBookedCoinsUpdate();
    };
  }, [currentArenaId]);

  // SIMPLIFIED TIMER: Server is source of truth
  // Client just displays what server sends, no complex logic
  // This eliminates all refresh/persistence issues
  useEffect(() => {
    // Timer updates are handled by the onTimerUpdate listener above
    // Server broadcasts updates, client just displays them
    // No local animation needed - server handles time calculation
  }, []);

  // Handle visibility changes to ensure timer accuracy when tab becomes active again (mobile-friendly)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentState = gameStateOnePocket;
      if (currentState.isTimerRunning && !document.hidden) {
        // Tab became visible again - timer will automatically resume with requestAnimationFrame
        console.log('📱 App became visible, timer continues with requestAnimationFrame');
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
  }, [currentArenaId, gameStateOnePocket.isTimerRunning]);

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setCurrentGameState(prevState => {
      const newState = { ...prevState, ...updates };
      
      // Update game label when game number changes
      if (updates.currentGameNumber !== undefined) {
        newState.gameLabel = `GAME ${updates.currentGameNumber}`;
      }
      
      // Emit changes to other clients via Socket.IO (optimized - batched & debounced)
      if (socketIOService.isSocketConnected()) {
        // Batch and debounce all socket emissions to reduce network traffic
        const emitBatchedUpdates = debounce(() => {
          // Emit bet-related updates
          if (updates.teamAQueue !== undefined || updates.teamBQueue !== undefined || updates.bookedBets !== undefined || updates.nextBookedBets !== undefined || updates.nextTeamAQueue !== undefined || updates.nextTeamBQueue !== undefined) {
            const betData: BetSyncData = {};
            if (updates.teamAQueue !== undefined) betData.teamAQueue = updates.teamAQueue;
            if (updates.teamBQueue !== undefined) betData.teamBQueue = updates.teamBQueue;
            if (updates.bookedBets !== undefined) betData.bookedBets = updates.bookedBets;
            if (updates.nextBookedBets !== undefined) betData.nextGameBets = updates.nextBookedBets;
            if (updates.nextTeamAQueue !== undefined) betData.nextTeamAQueue = updates.nextTeamAQueue;
            if (updates.nextTeamBQueue !== undefined) betData.nextTeamBQueue = updates.nextTeamBQueue;
            socketIOService.emitBetUpdate(betData);
          }
          
          // Emit total booked coins updates
          if (updates.totalBookedAmount !== undefined || updates.nextTotalBookedAmount !== undefined) {
            socketIOService.emitTotalBookedCoinsUpdate(
              updates.totalBookedAmount !== undefined ? updates.totalBookedAmount : newState.totalBookedAmount,
              updates.nextTotalBookedAmount !== undefined ? updates.nextTotalBookedAmount : newState.nextTotalBookedAmount
            );
          }
          
          // Emit game state updates (scores, balls, etc.) - BATCHED
          if (updates.teamAGames !== undefined ||
              updates.teamBGames !== undefined ||
              updates.teamABalls !== undefined || updates.teamBBalls !== undefined ||
              updates.isGameActive !== undefined || updates.winner !== undefined ||
              updates.currentGameNumber !== undefined ||
              updates.teamAHasBreak !== undefined ||
              updates.teamAName || updates.teamBName || updates.gameDescription) {
            const gameStateData: GameStateSyncData = {};
            if (updates.teamAGames !== undefined) gameStateData.teamAScore = updates.teamAGames;
            if (updates.teamBGames !== undefined) gameStateData.teamBScore = updates.teamBGames;
            if (updates.teamABalls !== undefined) gameStateData.teamABalls = updates.teamABalls;
            if (updates.teamBBalls !== undefined) gameStateData.teamBBalls = updates.teamBBalls;
            if (updates.isGameActive !== undefined) gameStateData.isGameActive = updates.isGameActive;
            if (updates.winner !== undefined) gameStateData.winner = updates.winner;
            if (updates.currentGameNumber !== undefined) gameStateData.currentGameNumber = updates.currentGameNumber;
            if (updates.teamAHasBreak !== undefined) {
              gameStateData.teamAHasBreak = updates.teamAHasBreak;
              socketIOService.emitBreakStatusUpdate(updates.teamAHasBreak);
            }
            if (updates.teamAName || updates.teamBName || updates.gameDescription) {
              gameStateData.gameInfo = {
                teamAName: updates.teamAName || prevState.teamAName,
                teamBName: updates.teamBName || prevState.teamBName,
                gameTitle: "Game Bird",
                gameDescription: updates.gameDescription || prevState.gameDescription
              };
              
              // EMIT TEAM NAMES SEPARATELY FOR CROSS-DEVICE SYNC
              if (updates.teamAName || updates.teamBName) {
                socketIOService.emitTeamNamesUpdate(
                  updates.teamAName || prevState.teamAName,
                  updates.teamBName || prevState.teamBName
                );
              }
            }
            
            // 🎯 DEBUG: Log which arena is emitting updates
            const getArenaLabel = (arenaId: string) => arenaId === 'one_pocket' ? '🎯 [1-POCKET]' : '🎱 [9-BALL]';
            const arenaLabel = getArenaLabel(currentArenaId);
            console.log(`🔴 [EMIT] ${arenaLabel} updateGameState is emitting updates:`, { 
              teamAGames: updates.teamAGames, 
              teamBGames: updates.teamBGames,
              teamABalls: updates.teamABalls,
              teamBBalls: updates.teamBBalls,
              currentArenaId
            });
            
            socketIOService.emitGameStateUpdate(gameStateData);
            socketIOService.emitScoreUpdate({
              teamAScore: updates.teamAGames !== undefined ? updates.teamAGames : prevState.teamAGames,
              teamBScore: updates.teamBGames !== undefined ? updates.teamBGames : prevState.teamBGames
            });
          }
        }, 50); // Debounce all emissions by 50ms for batching
        
        emitBatchedUpdates();
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
    console.log('🕐 [TIMER START] Starting timer - BEGIN');
    console.log('🕐 [TIMER START] Current state:', {
      isTimerRunning: getCurrentGameState().isTimerRunning,
      timerSeconds: getCurrentGameState().timerSeconds
    });
    console.log('🕐 [TIMER START] Socket connected?', socketIOService.isSocketConnected());
    
    // Update local state
    updateGameState({
      isTimerRunning: true
    });
    
    console.log('🕐 [TIMER START] Updated game state, emitting to server');
    // Explicitly emit to server to start timer immediately
    Promise.resolve().then(() => {
      const state = getCurrentGameState();
      console.log('🕐 [TIMER START] About to emit - timerSeconds:', state.timerSeconds);
      console.log('🕐 [TIMER START] Socket connection status:', socketIOService.isSocketConnected());
      
      socketIOService.emitTimerUpdate({
        isTimerRunning: true,
        timerSeconds: state.timerSeconds
      });
      
      console.log('🕐 [TIMER START] Emission complete!');
    });
  };

  const pauseTimer = () => {
    console.log('⏸️ [TIMER PAUSE] Pausing timer - BEGIN');
    console.log('⏸️ [TIMER PAUSE] Current state:', {
      isTimerRunning: getCurrentGameState().isTimerRunning,
      timerSeconds: getCurrentGameState().timerSeconds
    });
    console.log('⏸️ [TIMER PAUSE] Socket connected?', socketIOService.isSocketConnected());
    
    // Update local state
    updateGameState({
      isTimerRunning: false
    });
    
    console.log('⏸️ [TIMER PAUSE] Updated game state, emitting to server');
    // Explicitly emit to server to pause timer immediately
    Promise.resolve().then(() => {
      const state = getCurrentGameState();
      console.log('⏸️ [TIMER PAUSE] About to emit - timerSeconds:', state.timerSeconds);
      
      socketIOService.emitTimerUpdate({
        isTimerRunning: false,
        timerSeconds: state.timerSeconds
      });
      
      console.log('⏸️ [TIMER PAUSE] Emission complete!');
    });
  };

  const resetTimer = () => {
    console.log('🔄 [TIMER RESET] Resetting timer - BEGIN');
    console.log('🔄 [TIMER RESET] Current state:', {
      isTimerRunning: getCurrentGameState().isTimerRunning,
      timerSeconds: getCurrentGameState().timerSeconds
    });
    console.log('🔄 [TIMER RESET] Socket connected?', socketIOService.isSocketConnected());
    
    // Update local state
    updateGameState({
      timerSeconds: 0,
      isTimerRunning: false
    });
    
    console.log('🔄 [TIMER RESET] Updated game state, emitting to server');
    // Explicitly emit to server to reset timer immediately
    Promise.resolve().then(() => {
      const state = getCurrentGameState();
      console.log('🔄 [TIMER RESET] About to emit - resetting to 0');
      
      socketIOService.emitTimerUpdate({
        isTimerRunning: false,
        timerSeconds: 0
      });
      
      console.log('🔄 [TIMER RESET] Emission complete!');
    });
  };

  const setTimer = (seconds: number) => {
    // Clear interval when setting new value
    // The timer is now managed by requestAnimationFrame in the useEffect hook
    
    updateGameState({
      timerSeconds: seconds,
      isTimerRunning: false
    });
  };

  // Auto-reset timer when match starts or game is won
  const resetTimerOnMatchStart = () => {
    // Clear interval
    // The timer is now managed by requestAnimationFrame in the useEffect hook
    
    updateGameState({
      timerSeconds: 0,
      isTimerRunning: false
    });
  };

  const resetTimerOnGameWin = () => {
    console.log('🏆 Resetting timer on game win');
    // Clear interval
    // The timer is now managed by requestAnimationFrame in the useEffect hook
    
    updateGameState({
      timerSeconds: 0,
      isTimerRunning: false
    });
  };

  const value: GameStateContextType = useMemo(() => ({
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
  }), [
    gameStateOnePocket.teamAGames, 
    gameStateOnePocket.teamBGames,
    gameStateOnePocket.teamAQueue,
    gameStateOnePocket.teamBQueue,
    gameStateOnePocket.bookedBets,
    gameStateOnePocket.nextTeamAQueue,
    gameStateOnePocket.nextTeamBQueue,
    gameStateOnePocket, 
    localAdminStateOnePocket, 
    isAdmin, 
    currentArenaId
  ]);

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
