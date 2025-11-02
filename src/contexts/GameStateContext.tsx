import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Bet, BookedBet } from '@/types/user';
import { socketIOService, BetSyncData, GameStateSyncData, TimerSyncData, ScoreSyncData } from '@/services/socketIOService';
import { useUser } from './UserContext';

// Get arena from URL or default to 'default'
const getArena = (): string => {
  try {
    const url = new URL(window.location.href);
    const hash = url.hash;
    if (hash.includes('9-ball')) return '9-ball';
    if (hash.includes('one-pocket')) return 'one-pocket';
    if (hash.includes('8-ball')) return '8-ball';
  } catch (e) {
    // Fallback if URL parsing fails
  }
  return 'default';
};

const currentArena = getArena();

// Import arena context from BettingArenas
let useArena: (() => string) | undefined;
try {
  const arenaModule = require('@/pages/BettingArenas');
  useArena = arenaModule.useArena;
} catch (e) {
  // Context not available, use default arena
}

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

const GAME_STATE_STORAGE_KEY = `betting_app_game_state_${currentArena}`;
const LOCAL_ADMIN_STORAGE_KEY = `betting_app_local_admin_state_${currentArena}`;

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
        // IMPORTANT: Always reset isAdminMode to false on page load to require password entry
        // But preserve isAgentMode if it was previously set
        setLocalAdminState({
          ...parsedState,
          isAdminMode: false  // Always require password on page reload
        });
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
    // Only persist isAgentMode, NOT isAdminMode (admin mode requires password every time)
    const stateToSave = {
      isAdminMode: false,  // Never save admin mode - must re-authenticate
      isAgentMode: localAdminState.isAgentMode  // Keep agent mode preference
    };
    localStorage.setItem(LOCAL_ADMIN_STORAGE_KEY, JSON.stringify(stateToSave));
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
      try {
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
          newState.gameLabel = `