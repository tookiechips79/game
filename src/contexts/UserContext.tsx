import React, { createContext, useContext, useState, useEffect } from "react";
import { User, BetHistoryRecord, UserBetReceipt, CreditTransaction } from "@/types/user";
import { toast } from "sonner";
import { socketIOService } from "@/services/socketIOService";
import { useRef } from "react";

interface UserContextType {
  users: User[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  addUser: (name: string, password: string) => User;
  authenticateUser: (name: string, password: string) => User | null;
  addCredits: (userId: string, amount: number, isAdmin?: boolean, reason?: string) => void;
  deductCredits: (userId: string, amount: number, isAdminAction?: boolean) => boolean;
  getUserById: (id: string) => User | undefined;
  getAllUsers: () => User[];
  betHistory: BetHistoryRecord[];
  addBetHistoryRecord: (record: Omit<BetHistoryRecord, "id" | "timestamp">) => void;
  resetBetHistory: () => void;
  // REMOVED: setBetHistory - bet history is now completely immutable
  getHardLedgerBetHistory: () => BetHistoryRecord[];
  incrementWins: (userId: string) => void;
  incrementLosses: (userId: string) => void;
  socialLogin: (provider: "google" | "apple") => User;
  userBetReceipts: UserBetReceipt[];
  addUserBetReceipt: (receipt: Omit<UserBetReceipt, "id" | "timestamp">) => void;
  getUserBetReceipts: (userId: string) => UserBetReceipt[];
  getHardLedgerBetReceipts: (userId: string) => UserBetReceipt[];
  resetBetReceipts: () => void;
  clearBettingQueueReceipts: () => void;
  processCashout: (userId: string, amount: number) => boolean;
  creditTransactions: CreditTransaction[];
  getCreditTransactions: (userId: string) => CreditTransaction[];
  activateMembership: (userId: string) => void;
  isUsersLoaded: boolean;
  connectedUsersCoins: { totalCoins: number; connectedUserCount: number; connectedUsers: any[] };
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USERS_STORAGE_KEY = "betting_app_users";
const CURRENT_USER_STORAGE_KEY = "betting_app_current_user";
const BET_HISTORY_STORAGE_KEY = "betting_app_bet_history";
const IMMUTABLE_BET_HISTORY_KEY = "betting_app_immutable_bet_history_v7"; // Separate immutable storage with version
const USER_BET_RECEIPTS_KEY = "betting_app_user_bet_receipts";
const IMMUTABLE_BET_RECEIPTS_KEY = "betting_app_immutable_bet_receipts_v7"; // Separate immutable storage with version
const CREDIT_TRANSACTIONS_KEY = "betting_app_credit_transactions";

// BULLETPROOF PROTECTION: Additional isolated keys that old code cannot access
const BULLETPROOF_BET_HISTORY_KEY = "bulletproof_bet_history_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
const BULLETPROOF_BET_RECEIPTS_KEY = "bulletproof_bet_receipts_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

// Create a default admin user
const createDefaultAdmin = (): User => ({
  id: "admin-" + Date.now(),
  name: "Admin",
  credits: 1000,
  password: "admin",
  wins: 0,
  losses: 0,
  membershipStatus: 'active',
  subscriptionDate: Date.now()
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // *** MOVE ALL useRef DECLARATIONS HERE - FIRST, BEFORE ANY useState ***
  // Flag to prevent emitting history updates during clear operations
  const isClearingRef = useRef(false);

  // Flag to prevent re-emitting data that came FROM the socket listener
  const isUpdatingFromSocketRef = useRef(false);

  // Flag to pause Socket.IO listener processing during clear operations
  const pauseListenersRef = useRef(false);

  // Flag to track if we've loaded initial data from localStorage
  const isInitialLoadRef = useRef(false);

  // Flag to prevent re-emitting bet receipts updates during clear operations
  const hasReceivedFirstBetReceiptsUpdateRef = useRef(false);

  // CRITICAL: Backup tracking of all games ever added - prevents loss during rapid adds
  // This ref maintains a complete history that acts as a safety net
  const allGamesEverAddedRef = useRef<BetHistoryRecord[]>([]);

  // *** NOW - STATE DECLARATIONS COME HERE ***
  // Initialize with default admin to ensure we always have at least one user
  const [users, setUsers] = useState<User[]>(() => {
    try {
      // CLEANUP: Remove old/unused localStorage keys to free up space
      console.log('🧹 Cleaning up old localStorage keys...');
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('ultra_bulletproof_') ||
          key.includes('bulletproof_') ||
          key === BET_HISTORY_STORAGE_KEY || // Old mutable bet history
          key === USER_BET_RECEIPTS_KEY ||  // Old mutable receipts
          // OLD VERSIONS - but NOT the current v7 keys!
          key === 'betting_app_immutable_bet_history_v1' ||
          key === 'betting_app_immutable_bet_history_v2' ||
          key === 'betting_app_immutable_bet_history_v3' ||
          key === 'betting_app_immutable_bet_history_v4' ||
          key === 'betting_app_immutable_bet_history_v5' ||
          key === 'betting_app_immutable_bet_history_v6' ||
          key === 'betting_app_immutable_bet_receipts_v1' ||
          key === 'betting_app_immutable_bet_receipts_v2' ||
          key === 'betting_app_immutable_bet_receipts_v3' ||
          key === 'betting_app_immutable_bet_receipts_v4' ||
          key === 'betting_app_immutable_bet_receipts_v5' ||
          key === 'betting_app_immutable_bet_receipts_v6'
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed old key: ${key}`);
      });
      
      if (keysToRemove.length > 0) {
        console.log(`✅ Cleaned up ${keysToRemove.length} old keys, freed up space!`);
      }
      
      // Now load users
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
          return parsedUsers;
        }
      }
    } catch (error) {
      console.error('Error loading initial users:', error);
    }
    // Fallback to default admin
    const defaultAdmin = createDefaultAdmin();
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([defaultAdmin]));
    return [defaultAdmin];
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // SINGLE SOURCE OF TRUTH: Use only immutableBetHistory for all game history
  // Load from localStorage synchronously on mount to ensure data exists BEFORE socket connects
  const [immutableBetHistory, setImmutableBetHistory] = useState<BetHistoryRecord[]>(() => {
    try {
      const stored = localStorage.getItem(IMMUTABLE_BET_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('✅ [INIT] Bet history initialized from localStorage:', parsed.length, 'records');
          // CRITICAL: Mark as initial load IMMEDIATELY so guards activate BEFORE socket messages arrive
          isInitialLoadRef.current = true;
          return parsed;
        }
      }
    } catch (error) {
      console.error('❌ [INIT] Error loading immutable bet history:', error);
    }
    return [];
  });
  
  // PRIVATE: setBetHistory is now completely internal and cannot be called externally
  // This ensures bet history can only be modified through addBetHistoryRecord
  const [userBetReceipts, setUserBetReceipts] = useState<UserBetReceipt[]>([]);
  
  // IMMUTABLE BET RECEIPTS - This can NEVER be cleared or modified
  // Load from localStorage synchronously on mount to ensure data exists BEFORE socket connects
  const [immutableBetReceipts, setImmutableBetReceipts] = useState<UserBetReceipt[]>(() => {
    try {
      const stored = localStorage.getItem(IMMUTABLE_BET_RECEIPTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('✅ [INIT] Bet receipts initialized from localStorage:', parsed.length, 'receipts');
          // CRITICAL: Mark as first update received so guards activate BEFORE socket messages arrive
          hasReceivedFirstBetReceiptsUpdateRef.current = true;
          return parsed;
        }
      }
    } catch (error) {
      console.error('❌ [INIT] Error loading immutable bet receipts:', error);
    }
    return [];
  });
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [isUsersLoaded, setIsUsersLoaded] = useState<boolean>(true); // Start as true since we initialize with users
  const [connectedUsersCoins, setConnectedUsersCoins] = useState<{ totalCoins: number; connectedUserCount: number; connectedUsers: any[] }>({ totalCoins: 0, connectedUserCount: 0, connectedUsers: [] });

  // Custom setCurrentUser that emits user login/logout events
  const setCurrentUserWithLogin = (user: User | null) => {
    // Prevent rapid login/logout events
    const now = Date.now();
    const lastLoginTime = (setCurrentUserWithLogin as any).lastLoginTime || 0;
    if (now - lastLoginTime < 100) { // 100ms debounce
      console.log('🚫 Debouncing rapid user change, ignoring');
      return;
    }
    (setCurrentUserWithLogin as any).lastLoginTime = now;
    
    // If there was a previous user, emit logout event
    if (currentUser && socketIOService.isSocketConnected()) {
      console.log('📤 Emitting user logout for connected users tracking:', currentUser.name, 'with', currentUser.credits, 'coins');
      socketIOService.emitUserLogout({
        id: currentUser.id,
        name: currentUser.name,
        credits: currentUser.credits
      });
    }
    
    setCurrentUser(user);
    
    // Emit user login event to server for connected users tracking
    if (user && socketIOService.isSocketConnected()) {
      console.log('📤 Emitting user login for connected users tracking:', user.name, 'with', user.credits, 'coins');
      socketIOService.emitUserLogin({
        id: user.id,
        name: user.name,
        credits: user.credits
      });
    }
  };

  useEffect(() => {
    const loadUsers = () => {
      try {
        // CLEANUP: Remove old/unused localStorage keys to free up space
        console.log('🧹 Cleaning up old localStorage keys...');
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.includes('ultra_bulletproof_') ||
            key.includes('bulletproof_') ||
            key === BET_HISTORY_STORAGE_KEY || // Old mutable bet history
            key === USER_BET_RECEIPTS_KEY      // Old mutable receipts
          )) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          console.log(`🗑️ Removed old key: ${key}`);
        });
        
        if (keysToRemove.length > 0) {
          console.log(`✅ Cleaned up ${keysToRemove.length} old keys`);
        }
        
        // Now load users
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
          const parsedUsers = JSON.parse(storedUsers);
          
          // Validate that parsedUsers is an array
          if (!Array.isArray(parsedUsers)) {
            throw new Error('Invalid users data format');
          }
          
          // Migrate existing users to include membership status
          const migratedUsers = parsedUsers.map((user: any) => {
            // If user doesn't have membershipStatus, set it based on whether they're admin
            if (!user.membershipStatus) {
              return {
                ...user,
                membershipStatus: user.name.toLowerCase() === 'admin' ? 'active' : 'inactive',
                subscriptionDate: user.name.toLowerCase() === 'admin' ? Date.now() : undefined
              };
            }
            return user;
          });
          
          setUsers(migratedUsers);
          setIsUsersLoaded(true);
          
          // Update localStorage with migrated users
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(migratedUsers));
          console.log('✅ Users loaded from localStorage:', migratedUsers.length, 'users');
        } else {
          // Create default admin if no users exist
          const defaultAdmin = createDefaultAdmin();
          setUsers([defaultAdmin]);
          setIsUsersLoaded(true);
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([defaultAdmin]));
          console.log('✅ Default admin created');
        }
      } catch (error) {
        console.error('❌ Error loading users from localStorage:', error);
        
        // Fallback: Create a default admin
        const defaultAdmin = createDefaultAdmin();
        setUsers([defaultAdmin]);
        setIsUsersLoaded(true);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([defaultAdmin]));
        console.log('✅ Fallback admin created after error');
      }
    };

    loadUsers();

    const storedCurrentUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (storedCurrentUser) {
      const currentUserData = JSON.parse(storedCurrentUser);
      // Ensure current user has membership status
      if (!currentUserData.membershipStatus) {
        const updatedCurrentUser = {
          ...currentUserData,
          membershipStatus: currentUserData.name.toLowerCase() === 'admin' ? 'active' : 'inactive',
          subscriptionDate: currentUserData.name.toLowerCase() === 'admin' ? Date.now() : undefined
        };
        setCurrentUser(updatedCurrentUser);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedCurrentUser));
      } else {
        setCurrentUser(currentUserData);
      }
    }
    
    const storedCreditTransactions = localStorage.getItem(CREDIT_TRANSACTIONS_KEY);
    if (storedCreditTransactions) {
      setCreditTransactions(JSON.parse(storedCreditTransactions));
    }
  }, []);

  // Socket.IO listeners for game history and bet receipts real-time sync
  useEffect(() => {
    console.log('🔌 Setting up Socket.IO listeners');
    socketIOService.connect();

    // Listen for game history from other clients (peer-to-peer)
    socketIOService.onReceiveGameHistoryFromClients((data) => {
      try {
        console.log('📥 [PEER-HISTORY] Received history from peers:', data.gameHistory?.length, 'records');
        // ALWAYS accept peer data - it's from real clients, not the empty server!
        if (Array.isArray(data.gameHistory) && data.gameHistory.length > 0) {
          const ensuredHistory = data.gameHistory.map((record, index) => ({
            ...record,
            id: record.id || `bet-history-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`
          }));
          
          // Update state and localStorage with peer data - BYPASS ALL GUARDS
          console.log('✅ [PEER-HISTORY] Accepting peer data, updating state and localStorage');
          setImmutableBetHistory([...ensuredHistory]);
          localStorage.setItem(IMMUTABLE_BET_HISTORY_KEY, JSON.stringify(ensuredHistory));
          console.log('✅ [PEER-HISTORY] Updated game history from peers and saved to localStorage');
          isInitialLoadRef.current = true; // Mark as loaded so guards don't interfere
        }
      } catch (err) {
        console.error('❌ Error handling peer history:', err);
      }
    });

    // Listen for when OTHER clients request our game history and share it with them
    socketIOService.onClientRequestsGameHistory((data) => {
      try {
        console.log('🚀 [PEER-SHARE] Another client requested our game history, sharing:', immutableBetHistory.length, 'records');
        if (immutableBetHistory.length > 0) {
          // Share our local game history with the requesting client
          socketIOService.sendGameHistoryToClient(immutableBetHistory);
        }
      } catch (err) {
        console.error('❌ Error sharing game history with peer:', err);
      }
    });

    // Request game history from other connected clients (BEFORE server sends empty)
    setTimeout(() => {
      console.log('🔍 [PEER-REQUEST] Requesting game history from other connected clients...');
      socketIOService.requestGameHistoryFromClients();
    }, 200);

    // Listen for game history updates from other clients
    const handleGameHistoryUpdate = (data: { gameHistory: any[] }) => {
      try {
        console.log(`[HISTORY_LISTENER] Received update:`, {
          receivedLength: data.gameHistory?.length,
          currentStateLength: immutableBetHistory.length,
          dataType: typeof data.gameHistory,
          isArray: Array.isArray(data.gameHistory),
          isEmpty: data.gameHistory?.length === 0
        });
        console.log(`  pauseListenersRef=${pauseListenersRef.current}, isClearingRef=${isClearingRef.current}, isInitialLoadRef=${isInitialLoadRef.current}`);
        
        // HARD RULE: NEVER accept empty arrays from server - they kill the history!
        if (!data.gameHistory || data.gameHistory.length === 0) {
          console.warn('⚠️ [HISTORY_LISTENER] BLOCKED: Server sent empty/null array - NEVER accepting empty history!');
          console.warn('   This is a hard rule - game history is protected');
          return; // NEVER accept empty history
        }
        
        // PAUSE listeners during clearing - completely ignore all updates
        if (pauseListenersRef.current) {
          console.log('⏸️ [UserContext] Listeners paused, ignoring history update');
          return;
        }
        
        // IGNORE updates during clearing to prevent re-population
        if (isClearingRef.current) {
          console.log('⏭️ [UserContext] Ignoring history update during clear operation');
          return;
        }
        
        // PROTECT local data on initial load - only update if server has more/different data
        if (isInitialLoadRef.current && immutableBetHistory.length > 0) {
          console.log('🛡️ [UserContext] Local data already loaded, checking if server has newer data');
          if (data.gameHistory?.length <= immutableBetHistory.length) {
            console.log('✅ [UserContext] Local data is same or more recent, preserving local data');
            return; // Keep local data
          }
        }
        
        console.log('📥 [UserContext] Game history update ACCEPTED:', data.gameHistory?.length, 'entries');
        if (Array.isArray(data.gameHistory) && data.gameHistory.length > 0) {
          console.log('📝 [UserContext] Setting betHistory and immutableBetHistory');
          
          // Ensure all records have unique IDs
          const ensuredHistory = data.gameHistory.map((record, index) => ({
            ...record,
            id: record.id || `bet-history-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`
          }));
          
          // Update state - the useEffect will automatically save to localStorage
          setImmutableBetHistory([...ensuredHistory]); // Use spread for new reference
          console.log('✅ [UserContext] States updated from socket, useEffect will save to localStorage');
        }
      } catch (err) {
        console.error('❌ Error handling game history update:', err);
      }
    };

  // Listen for bet receipts updates from other clients
    const handleBetReceiptsUpdate = (data: { betReceipts: any[] }) => {
      try {
        console.log(`[RECEIPTS_LISTENER] Received update:`, {
          receivedLength: data.betReceipts?.length,
          currentStateLength: immutableBetReceipts.length,
          isEmpty: data.betReceipts?.length === 0
        });
        
        // HARD RULE: NEVER accept empty arrays from server - they kill the receipts!
        if (!data.betReceipts || data.betReceipts.length === 0) {
          console.warn('⚠️ [RECEIPTS_LISTENER] BLOCKED: Server sent empty/null array - NEVER accepting empty receipts!');
          console.warn('   This is a hard rule - bet receipts are protected');
          return; // NEVER accept empty receipts
        }
        
        // PAUSE listeners during clearing - completely ignore all updates
        if (pauseListenersRef.current) {
          console.log('⏸️ [UserContext] Listeners paused, ignoring receipts update');
          return;
        }
        
        // IGNORE updates during clearing to prevent re-population
        if (isClearingRef.current) {
          console.log('⏭️ [UserContext] Ignoring receipts update during clear operation');
          return;
        }
        
        // PROTECT local data on initial load - only update if server has more/different data
        if (isInitialLoadRef.current && immutableBetReceipts.length > 0) {
          console.log('🛡️ [UserContext] Local receipts already loaded, checking if server has newer data');
          if (data.betReceipts?.length <= immutableBetReceipts.length) {
            console.log('✅ [UserContext] Local receipts are same or more recent, preserving local data');
            return; // Keep local data
          }
        }
        
        console.log('📥 [UserContext] Bet receipts update received:', data.betReceipts?.length, 'entries');
        if (Array.isArray(data.betReceipts)) {
          console.log('📝 [UserContext] Setting userBetReceipts and immutableBetReceipts');
          
          // Ensure all records have unique IDs
          const ensuredReceipts = data.betReceipts.map((record, index) => ({
            ...record,
            id: record.id || `bet-receipt-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`
          }));
          
          // SET FLAG to prevent re-emitting this data back to socket
          isUpdatingFromSocketRef.current = true;
          setUserBetReceipts([...ensuredReceipts]); // Use spread for new reference
          setImmutableBetReceipts([...ensuredReceipts]);
          console.log('✅ [UserContext] States updated from socket, component will re-render');
          
          // Reset flag after state updates settle
          setTimeout(() => {
            isUpdatingFromSocketRef.current = false;
          }, 50);
        }
      } catch (err) {
        console.error('❌ Error handling bet receipts update:', err);
      }
    };

    socketIOService.onGameHistoryUpdate(handleGameHistoryUpdate);
    socketIOService.onBetReceiptsUpdate(handleBetReceiptsUpdate);

    // Listen for clear all data command from admin
    socketIOService.onClearAllData(() => {
      try {
        console.log('🧹 [UserContext] Clearing all data due to admin command');
        
        // BROADCAST pause command to ALL browsers first (including this one)
        socketIOService.emitPauseListeners();
        
        // PAUSE all Socket.IO listeners on this browser too
        pauseListenersRef.current = true;
        console.log('⏸️ [UserContext] Pausing Socket.IO listeners during clear');
        
        // Set flag to prevent emitting during clear
        isClearingRef.current = true;
        
        setImmutableBetHistory([]);
        localStorage.removeItem(IMMUTABLE_BET_HISTORY_KEY);
        localStorage.removeItem(BULLETPROOF_BET_HISTORY_KEY);
        
        setUserBetReceipts([]);
        localStorage.removeItem(USER_BET_RECEIPTS_KEY);
        localStorage.removeItem(IMMUTABLE_BET_RECEIPTS_KEY);
        localStorage.removeItem(BULLETPROOF_BET_RECEIPTS_KEY);
        
        setCreditTransactions([]);
        localStorage.removeItem(CREDIT_TRANSACTIONS_KEY);
        
        console.log('✅ [UserContext] All data cleared');
        
        // Reset flags after a longer delay (500ms) to allow all React state updates and re-renders to complete
        // This prevents the listeners from processing incoming updates during the clear cascade
        setTimeout(() => {
          isClearingRef.current = false;
          pauseListenersRef.current = false;
          
          // BROADCAST resume command to ALL browsers
          socketIOService.emitResumeListeners();
          
          console.log('🔄 [UserContext] Clear complete - resuming Socket.IO listeners');
        }, 500);
      } catch (err) {
        console.error('❌ Error clearing all data:', err);
        isClearingRef.current = false;
        pauseListenersRef.current = false;
      }
    });

    // Listen for pause command from other browsers
    socketIOService.onPauseListeners(() => {
      console.log('⏸️ [UserContext] Pausing listeners due to remote pause command');
      pauseListenersRef.current = true;
    });

    // Listen for resume command from other browsers
    socketIOService.onResumeListeners(() => {
      console.log('▶️ [UserContext] Resuming listeners due to remote resume command');
      pauseListenersRef.current = false;
    });

    return () => {
      console.log('🔌 Cleaning up Socket.IO listeners');
      // CRITICAL: Remove all socket listeners to prevent duplicates and stale closures
      socketIOService.offGameHistoryUpdate();
      socketIOService.offBetReceiptsUpdate();
      socketIOService.offClearAllData();
      socketIOService.offPauseListeners();
      socketIOService.offResumeListeners();
      socketIOService.offClientRequestsGameHistory();
      socketIOService.offReceiveGameHistoryFromClients();
    };
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users]);

  useEffect(() => {
      if (currentUser) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
  }, [currentUser]);

  // NOTE: betHistory is synced via Socket.IO, don't save to localStorage separately
  
  // IMMUTABLE BET HISTORY - Always save to separate storage, NEVER cleared
  useEffect(() => {
    // COMPLETELY SKIP during clearing - don't even save to localStorage
    if (isClearingRef.current) {
      console.log('⏭️ Skipping history useEffect during clear operation');
      return;
    }
    
    // IMPORTANT: Always save to localStorage, regardless of where the update came from
    // Whether from local addBetHistoryRecord or from socket listeners, we MUST persist it
    try {
      // Update backup ref for safety
      allGamesEverAddedRef.current = immutableBetHistory;
      
      // Only save to main key to conserve storage space
      const serialized = JSON.stringify(immutableBetHistory);
      localStorage.setItem(IMMUTABLE_BET_HISTORY_KEY, serialized);
      console.log('✅ Immutable bet history saved to localStorage:', immutableBetHistory.length, 'records');
      console.log('   📦 Stored data size:', (serialized.length / 1024).toFixed(2), 'KB');
      console.log('   🔑 Storage key:', IMMUTABLE_BET_HISTORY_KEY);
      console.log('   🔄 Backup ref updated with:', immutableBetHistory.length, 'records');
      
      // DEBUG: Verify it was actually saved
      const verify = localStorage.getItem(IMMUTABLE_BET_HISTORY_KEY);
      if (verify) {
        const verifiedCount = JSON.parse(verify).length;
        if (verifiedCount === immutableBetHistory.length) {
          console.log('   ✔️ Verified: All', verifiedCount, 'records persisted');
        } else {
          console.error('   ❌ MISMATCH: Expected', immutableBetHistory.length, 'but found', verifiedCount);
        }
      } else {
        console.error('   ❌ ERROR: Data NOT found in localStorage after saving!');
      }
      
      // NOTE: DO NOT EMIT HERE - emit only happens in addBetHistoryRecord (the SOURCE)
      // This prevents re-emit loops from Socket.IO listener updates
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('❌ localStorage quota exceeded! Clearing old data...');
        // If quota exceeded, trim more aggressively and retry
        const trimmedHistory = immutableBetHistory.slice(0, 50);
        try {
          allGamesEverAddedRef.current = trimmedHistory;
          localStorage.setItem(IMMUTABLE_BET_HISTORY_KEY, JSON.stringify(trimmedHistory));
          console.log('✅ Recovered by trimming to 50 records');
        } catch (retryError) {
          console.error('❌ Still failed after trimming:', retryError);
        }
      } else {
        console.error('❌ Failed to save immutable bet history:', error);
      }
    }
  }, [immutableBetHistory]);
  
  // NOTE: userBetReceipts is synced via Socket.IO, don't save to localStorage separately
  
  // IMMUTABLE BET RECEIPTS - Always save to separate storage, NEVER cleared
  useEffect(() => {
    // COMPLETELY SKIP during clearing - don't even save to localStorage
    if (isClearingRef.current) {
      console.log('⏭️ Skipping receipts useEffect during clear operation');
      return;
    }
    
    // IMPORTANT: Always save to localStorage, regardless of where the update came from
    // Whether from local addUserBetReceipt or from socket listeners, we MUST persist it
    try {
      // Only save to main key to conserve storage space
      localStorage.setItem(IMMUTABLE_BET_RECEIPTS_KEY, JSON.stringify(immutableBetReceipts));
      console.log('✅ Immutable bet receipts saved to localStorage:', immutableBetReceipts.length, 'receipts');
      
      // NOTE: DO NOT EMIT HERE - emit only happens in addUserBetReceipt (the SOURCE)
      // This prevents re-emit loops from Socket.IO listener updates
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('❌ localStorage quota exceeded! Clearing old data...');
        // If quota exceeded, trim more aggressively and retry
        const trimmedReceipts = immutableBetReceipts.slice(0, 250);
        try {
          localStorage.setItem(IMMUTABLE_BET_RECEIPTS_KEY, JSON.stringify(trimmedReceipts));
          console.log('✅ Recovered by trimming to 250 receipts');
        } catch (retryError) {
          console.error('❌ Still failed after trimming:', retryError);
        }
      } else {
        console.error('❌ Failed to save immutable bet receipts:', error);
      }
    }
  }, [immutableBetReceipts]);
  
  useEffect(() => {
    if (creditTransactions.length > 0) {
      localStorage.setItem(CREDIT_TRANSACTIONS_KEY, JSON.stringify(creditTransactions));
    }
  }, [creditTransactions]);

  // USER SETTINGS ARE COMPLETELY OFFLINE - NO SOCKET UPDATES
  // Removed all socket handlers to prevent any external modifications
  // User settings (bet history, receipts, transactions) are now completely local

  const addCreditTransaction = (transaction: Omit<CreditTransaction, "id" | "timestamp">) => {
    const newTransaction: CreditTransaction = {
      ...transaction,
      id: `credit-tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now()
    };
    
    setCreditTransactions(prev => [newTransaction, ...prev]);
  };
  
  const getCreditTransactions = (userId: string) => {
    return creditTransactions.filter(tx => tx.userId === userId);
  };

  const activateMembership = (userId: string) => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        const updatedUser = { 
          ...user, 
          membershipStatus: 'active' as const,
          subscriptionDate: Date.now()
        };
        
        if (currentUser?.id === userId) {
          setCurrentUser(updatedUser);
        }
        
        return updatedUser;
      }
      return user;
    }));
    
    const userName = users.find(u => u.id === userId)?.name || userId;
    
    toast.success("Membership Activated!", {
      description: `${userName}'s membership is now active. They can now place bets.`,
      className: "custom-toast-success"
    });
    
    addCreditTransaction({
      userId,
      userName: userName,
      type: 'subscription',
      amount: 0,
      details: 'Membership activated - subscription purchased'
    });
  };

  const addUser = (name: string, password: string): User => {
    if (!name.trim() || !password.trim()) {
      throw new Error("Name and password are required");
    }
    
    try {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        credits: 0,
        password,
        wins: 0,
        losses: 0,
        membershipStatus: 'inactive'
      };
      
      setUsers(prev => {
        const updatedUsers = [...prev, newUser];
        
        // Backup to localStorage with error handling
        try {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
          console.log('✅ User added and backed up to localStorage');
        } catch (storageError) {
          console.error('❌ Failed to backup user to localStorage:', storageError);
          // Continue anyway - the user is still added to state
        }
        
        return updatedUsers;
      });
      
      toast.success("User Added", {
        description: `User "${name}" has been created`,
        className: "custom-toast-success"
      });
      
      return newUser;
    } catch (error) {
      console.error('❌ Error adding user:', error);
      toast.error("Failed to Add User", {
        description: "There was an error creating the user. Please try again.",
        className: "custom-toast-error"
      });
      throw error;
    }
  };
  
  const authenticateUser = (name: string, password: string): User | null => {
    const user = users.find(u => 
      u.name.toLowerCase() === name.toLowerCase() && 
      u.password === password
    );
    return user || null;
  };

  const addCredits = async (userId: string, amount: number, isAdmin: boolean = false, reason: string = 'admin_add') => {
    if (amount <= 0) return;
    
    try {
      // 💰 Call server API instead of modifying local state
      // Server is authoritative - it validates, processes, and records the transaction
      const response = await fetch(`/api/credits/${userId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          reason: isAdmin ? reason : 'system_operation',
          adminNotes: isAdmin ? `Admin action: ${reason}` : ''
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add credits on server');
      }
      
      const data = await response.json();
      const newBalance = data.newBalance;
      
      // Update local state with server-confirmed balance
      setUsers(prev => {
        const updatedUsers = prev.map(user => {
          if (user.id === userId) {
            const updatedUser = { ...user, credits: newBalance };
            if (currentUser?.id === userId) {
              setCurrentUser(updatedUser);
            }
            return updatedUser;
          }
          return user;
        });
        
        // Emit wallet update for connected users coin counter
        if (socketIOService.isSocketConnected()) {
          socketIOService.emitUserWalletUpdate(updatedUsers);
        }
        
        return updatedUsers;
      });
      
      const userName = users.find(u => u.id === userId)?.name || userId;
      
      if (isAdmin) {
        // Determine toast message based on reason
        let toastTitle = "Credits Added";
        let toastDescription = `Added ${amount} credits to ${userName}`;
        let transactionType: 'admin_add' | 'bet_refund' = 'admin_add';
        
        if (reason === 'bet_refund') {
          toastTitle = "Bet Refunded";
          toastDescription = `Refunded ${amount} credits to ${userName}`;
          transactionType = 'bet_refund';
        }
        
        toast.success(toastTitle, {
          description: toastDescription,
          className: "custom-toast-success"
        });
        
        // Record in credit transactions
        addCreditTransaction({
          userId,
          userName: userName,
          type: transactionType,
          amount,
          details: reason === 'bet_refund' ? 'Bet refunded' : 'Admin added coins to account'
        });
      }
    } catch (error) {
      console.error('❌ [CREDITS] Error adding credits:', error);
      toast.error("Error", {
        description: "Failed to add credits - server operation failed",
        className: "custom-toast-error"
      });
    }
  };

  const deductCredits = async (userId: string, amount: number, isAdminAction: boolean = false): Promise<boolean> => {
    if (amount <= 0) return true;
    
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    
    try {
      // 💰 Call server API to validate and deduct credits
      // Server checks balance before allowing deduction
      const response = await fetch(`/api/credits/${userId}/bet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          betDetails: isAdminAction ? 'Admin deducted' : 'Bet placed'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        toast.error("Insufficient Credits", {
          description: error.error || `${user.name} doesn't have enough credits`,
          className: "custom-toast-error"
        });
        return false;
      }
      
      const data = await response.json();
      const newBalance = data.newBalance;
      
      // Update local state with server-confirmed balance
      setUsers(prev => {
        const updatedUsers = prev.map(u => {
          if (u.id === userId) {
            const updatedUser = { ...u, credits: newBalance };
            if (currentUser?.id === userId) {
              setCurrentUser(updatedUser);
            }
            return updatedUser;
          }
          return u;
        });
        
        // Emit wallet update for connected users coin counter
        if (socketIOService.isSocketConnected()) {
          socketIOService.emitUserWalletUpdate(updatedUsers);
        }
        
        return updatedUsers;
      });
      
      if (isAdminAction) {
        addCreditTransaction({
          userId,
          userName: user.name,
          type: 'admin_deduct',
          amount,
          details: 'Admin removed coins from account'
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ [CREDITS] Error deducting credits:', error);
      toast.error("Error", {
        description: "Failed to process deduction - server operation failed",
        className: "custom-toast-error"
      });
      return false;
    }
  };

  const incrementWins = (userId: string) => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        const updatedUser = { ...user, wins: (user.wins || 0) + 1 };
        
        if (currentUser?.id === userId) {
          setCurrentUser(updatedUser);
        }
        
        return updatedUser;
      }
      return user;
    }));
  };

  const incrementLosses = (userId: string) => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        const updatedUser = { ...user, losses: (user.losses || 0) + 1 };
        
        if (currentUser?.id === userId) {
          setCurrentUser(updatedUser);
        }
        
        return updatedUser;
      }
      return user;
    }));
  };

  const getUserById = (id: string) => {
    return users.find(user => user.id === id);
  };

  const getAllUsers = () => {
    return [...users];
  };
  
  const addBetHistoryRecord = (record: Omit<BetHistoryRecord, "id" | "timestamp">) => {
    const newRecord: BetHistoryRecord = {
      ...record,
      id: `bet-history-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now()
    };
    
    console.log('🎮 [addBetHistoryRecord] Adding new game record, game#:', record.gameNumber);
    
    // CRITICAL FIX: Always read from localStorage instead of closure to prevent loss during rapid adds
    // This ensures we get the LATEST data, not stale closure data
    let currentHistoryFromStorage: BetHistoryRecord[] = [];
    try {
      const stored = localStorage.getItem(IMMUTABLE_BET_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          currentHistoryFromStorage = parsed;
          console.log('📖 [addBetHistoryRecord] Read from localStorage:', currentHistoryFromStorage.length, 'existing records');
        }
      }
    } catch (err) {
      console.error('❌ Error reading from localStorage:', err);
      // Fallback: use the ref backup
      currentHistoryFromStorage = allGamesEverAddedRef.current;
      console.log('⚠️ [addBetHistoryRecord] Using backup ref instead, length:', currentHistoryFromStorage.length);
    }
    
    // Combine new record with what we just read from storage
    const MAX_GAMES = 50;
    const immediateHistory = [newRecord, ...currentHistoryFromStorage].slice(0, MAX_GAMES);
    
    console.log('📊 [addBetHistoryRecord] After adding, total will be:', immediateHistory.length, 'records');
    
    // Update backup ref immediately
    allGamesEverAddedRef.current = immediateHistory;
    
    setImmutableBetHistory(prev => {
      const updatedImmutableHistory = [newRecord, ...prev];
      if (updatedImmutableHistory.length > MAX_GAMES) {
        return updatedImmutableHistory.slice(0, MAX_GAMES);
      }
      return updatedImmutableHistory;
    });
    
    // IMMEDIATELY SAVE TO LOCALSTORAGE with the complete calculated history from storage
    // This ensures we never lose games even if state updates are slow
    localStorage.setItem(IMMUTABLE_BET_HISTORY_KEY, JSON.stringify(immediateHistory));
    console.log('💾 [addBetHistoryRecord] SAVED to localStorage:', immediateHistory.length, 'records');
    console.log('   📦 Data IDs:', immediateHistory.map(r => r.id));
    
    // Verify it was saved correctly
    const verified = localStorage.getItem(IMMUTABLE_BET_HISTORY_KEY);
    if (verified) {
      const parsed = JSON.parse(verified);
      if (parsed.length === immediateHistory.length) {
        console.log('✅ [addBetHistoryRecord] Verified in localStorage:', parsed.length, 'records');
      } else {
        console.error('❌ [addBetHistoryRecord] VERIFICATION FAILED! Expected:', immediateHistory.length, 'Got:', parsed.length);
      }
    } else {
      console.error('❌ [addBetHistoryRecord] Failed to read back from localStorage!');
    }
    
    // EMIT IMMEDIATELY with the complete calculated history
    setTimeout(() => {
      if (pauseListenersRef.current) {
        console.log('⏸️ [addBetHistoryRecord] Skipping emit - listeners are paused');
        return;
      }
      
      try {
        console.log('📤 [addBetHistoryRecord] Emitting history to server and peers');
        socketIOService.emitGameHistoryUpdate(immediateHistory);
      } catch (err) {
        console.error('❌ Error emitting game history:', err);
      }
    }, 0);
    
    const gameNumber = record.gameNumber;
    
    record.bets.teamA.forEach(bet => {
      if (bet.booked) {
        addUserBetReceipt({
          userId: bet.userId,
          userName: bet.userName,
          gameNumber,
          teamName: record.teamAName,
          opponentName: record.teamBName,
          amount: bet.amount,
          won: bet.won,
          teamSide: 'A',
          winningTeam: record.winningTeam
        });
      }
    });
    
    record.bets.teamB.forEach(bet => {
      if (bet.booked) {
        addUserBetReceipt({
          userId: bet.userId,
          userName: bet.userName,
          gameNumber,
          teamName: record.teamBName,
          opponentName: record.teamAName,
          amount: bet.amount,
          won: bet.won,
          teamSide: 'B',
          winningTeam: record.winningTeam
        });
      }
    });
    
    toast.success("Game Results Recorded", {
      description: `Results for game #${record.gameNumber} have been saved in history`,
      className: "custom-toast-success"
    });
  };
  
  const resetBetHistory = () => {
    // Clear ALL bet history - both mutable and immutable
    console.log('🧹 Clearing ALL bet history (mutable and immutable)');
    
    // Clear mutable bet history
    setImmutableBetHistory([]);
    localStorage.removeItem(IMMUTABLE_BET_HISTORY_KEY);
    localStorage.removeItem(BULLETPROOF_BET_HISTORY_KEY);
    
    console.log('✅ All bet history cleared');
  };

  // HARD LEDGER - Read-only bet history for settings
  // This provides a completely immutable view of bet history
  const getHardLedgerBetHistory = (): BetHistoryRecord[] => {
    // Return a deep copy of the IMMUTABLE bet history to prevent any modifications
    return JSON.parse(JSON.stringify(immutableBetHistory));
  };
  
  const addUserBetReceipt = (receipt: Omit<UserBetReceipt, "id" | "timestamp">) => {
    if (receipt.transactionType === 'admin_add' || 
        receipt.transactionType === 'admin_deduct' || 
        receipt.transactionType === 'cashout') {
      return;
    }
    
    const newReceipt: UserBetReceipt = {
      ...receipt,
      id: `user-bet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      transactionType: receipt.transactionType || 'bet'
    };
    
    let finalReceipts: UserBetReceipt[] = [];
    
    setUserBetReceipts(prev => {
      const updatedReceipts = [newReceipt, ...prev];
      
      // QUOTA MANAGEMENT: Keep only last 500 receipts to prevent localStorage overflow
      const MAX_RECEIPTS = 250;
      if (updatedReceipts.length > MAX_RECEIPTS) {
        console.log(`⚠️ Bet receipts limit reached (${updatedReceipts.length}), trimming to ${MAX_RECEIPTS} receipts`);
        finalReceipts = updatedReceipts.slice(0, MAX_RECEIPTS);
        return finalReceipts;
      }
      
      finalReceipts = updatedReceipts;
      return updatedReceipts;
    });
    
    // ALSO ADD TO IMMUTABLE BET RECEIPTS - This can NEVER be cleared
    setImmutableBetReceipts(prev => {
      const updatedImmutableReceipts = [newReceipt, ...prev];
      
      // QUOTA MANAGEMENT: Keep only last 500 receipts to prevent localStorage overflow
      const MAX_RECEIPTS = 250;
      if (updatedImmutableReceipts.length > MAX_RECEIPTS) {
        console.log(`⚠️ Immutable receipts limit reached (${updatedImmutableReceipts.length}), trimming to ${MAX_RECEIPTS} receipts`);
        return updatedImmutableReceipts.slice(0, MAX_RECEIPTS);
      }
      
      return updatedImmutableReceipts;
    });
    
    // EMIT IMMEDIATELY with the new receipt (don't wait for useEffect)
    // This is the SOURCE of truth - emit only when data is created locally
    setTimeout(() => {
      // DO NOT EMIT if listeners are paused (during clear operation)
      if (pauseListenersRef.current) {
        console.log('⏸️ [addUserBetReceipt] Skipping emit - listeners are paused');
        return;
      }
      
      // Use the new receipt with current userBetReceipts at the time of emit
      let receiptsToEmit = [newReceipt, ...userBetReceipts];
      if (receiptsToEmit.length > 250) {
        receiptsToEmit = receiptsToEmit.slice(0, 250);
      }
      try {
        console.log('📤 [addUserBetReceipt] Emitting new receipt to all clients immediately');
        socketIOService.emitBetReceiptsUpdate(receiptsToEmit);
      } catch (err) {
        console.error('❌ Error emitting bet receipts:', err);
      }
    }, 0);
  };
  
  const getUserBetReceipts = (userId: string) => {
    return userBetReceipts.filter(receipt => receipt.userId === userId);
  };
  
  // HARD LEDGER - Read-only bet receipts for settings
  // This provides a completely immutable view of bet receipts
  const getHardLedgerBetReceipts = (userId: string): UserBetReceipt[] => {
    // Return a deep copy of the IMMUTABLE bet receipts to prevent any modifications
    return JSON.parse(JSON.stringify(immutableBetReceipts.filter(receipt => receipt.userId === userId)));
  };

  const resetBetReceipts = () => {
    // BET RECEIPTS ARE COMPLETELY IMMUTABLE - NEVER CLEAR THEM
    // This function does NOTHING to ensure bet receipts are never deleted
    console.log('⚠️ Attempt to clear bet receipts BLOCKED - bet receipts are completely immutable');
    
    toast.error("Bet Receipts Protected", {
      description: "Bet receipts cannot be cleared - they're a permanent, immutable ledger",
      className: "custom-toast-error"
    });
    
    // DO NOTHING - No clearing, no modifications, no external interference
    // Even if old code tries to clear, this function will not execute any clearing logic
    // Multiple layers of protection ensure data is never lost
    return;
  };

  // CLEAR BETTING QUEUE RECEIPTS ONLY - This clears the mutable receipts for betting queue display
  const clearBettingQueueReceipts = () => {
    console.log('🧹 Clearing betting queue receipts (mutable only)');
    console.log('🧹 Current userBetReceipts length:', userBetReceipts.length);
    
    // Clear the mutable receipts array
    setUserBetReceipts([]);
    
    // Clear localStorage for mutable receipts
    localStorage.removeItem(USER_BET_RECEIPTS_KEY);
    
    // Also clear the immutable receipts for betting queue display (but keep user settings)
    setImmutableBetReceipts([]);
    localStorage.removeItem(IMMUTABLE_BET_RECEIPTS_KEY);
    localStorage.removeItem(BULLETPROOF_BET_RECEIPTS_KEY);
    
    console.log('🧹 All betting queue receipts cleared (mutable and immutable)');
    
    toast.success("Betting Queue Cleared", {
      description: "All betting queue receipts have been cleared",
      className: "custom-toast-success"
    });
  };

  const socialLogin = (provider: "google" | "apple"): User => {
    const userId = `${provider}-user-${Date.now()}`;
    const userName = `${provider}User${Math.floor(Math.random() * 1000)}`;
    const randomPassword = Math.random().toString(36).substring(2, 15);
    
    const newUser: User = {
      id: userId,
      name: userName,
      credits: 0,
      password: randomPassword,
      wins: 0,
      losses: 0,
      membershipStatus: 'inactive'
    };
    
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    
    toast.success(`${provider} Login Successful`, {
      description: `Logged in as ${userName}! You can view the scoreboard and betting queues, but need to subscribe to place bets.`,
      className: "custom-toast-success"
    });
    
    return newUser;
  };

  const processCashout = async (userId: string, amount: number): Promise<boolean> => {
    if (amount <= 0) {
      toast.error("Invalid Amount", {
        description: "Please enter a valid amount greater than 0",
        className: "custom-toast-error"
      });
      return false;
    }
    
    const user = users.find(u => u.id === userId);
    if (!user) {
      toast.error("User Not Found", {
        description: "Could not find user account",
        className: "custom-toast-error"
      });
      return false;
    }
    
    try {
      // 💰 Call server API to process cashout
      const response = await fetch(`/api/credits/${userId}/cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      
      if (!response.ok) {
        const error = await response.json();
        toast.error("Cashout Failed", {
          description: error.error || 'Insufficient balance or server error',
          className: "custom-toast-error"
        });
        return false;
      }
      
      const data = await response.json();
      const newBalance = data.newBalance;
      
      // Update local state with server-confirmed balance
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          const updatedUser = { ...u, credits: newBalance };
          if (currentUser?.id === userId) {
            setCurrentUser(updatedUser);
          }
          return updatedUser;
        }
        return u;
      }));
      
      // Record cashout in transaction history
      addCreditTransaction({
        userId: userId,
        userName: user.name,
        type: 'cashout',
        amount,
        details: 'Cashed out coins from wallet'
      });
      
      toast.success("Cashout Successful", {
        description: `${amount} COINS have been cashed out from your account`,
        className: "custom-toast-success"
      });
      
      return true;
    } catch (error) {
      console.error('❌ [CREDITS] Error processing cashout:', error);
      toast.error("Cashout Failed", {
        description: "Server error - please try again later",
        className: "custom-toast-error"
      });
      return false;
    }
  };

  // Socket listener for connected users coins updates
  useEffect(() => {
    // Set up the listener once
    socketIOService.onConnectedUsersCoinsUpdate((data) => {
      console.log('📊 Received connected users coins update:', data);
      setConnectedUsersCoins(data);
    });
    
    // Request initial data
    if (socketIOService.isSocketConnected()) {
      socketIOService.requestConnectedUsersData();
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        setCurrentUser: setCurrentUserWithLogin,
        addUser,
        authenticateUser,
        addCredits,
        deductCredits,
        getUserById,
        getAllUsers,
        betHistory: immutableBetHistory, // Expose immutableBetHistory as betHistory
        addBetHistoryRecord,
        resetBetHistory,
        getHardLedgerBetHistory,
        incrementWins,
        incrementLosses,
        socialLogin,
        userBetReceipts,
        addUserBetReceipt,
        getUserBetReceipts,
        getHardLedgerBetReceipts,
        resetBetReceipts,
        clearBettingQueueReceipts,
        processCashout,
        creditTransactions,
        getCreditTransactions,
        activateMembership,
        isUsersLoaded,
        connectedUsersCoins,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
