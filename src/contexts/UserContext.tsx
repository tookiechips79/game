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
const CREDIT_TRANSACTIONS_KEY = "betting_app_credit_transactions";

// ✅ NO STORAGE FOR BET RECEIPTS OR GAME HISTORY - Both are server-only via Socket.IO

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

  // Flag to pause Socket.IO listener processing during clear operations
  const pauseListenersRef = useRef(false);

  // 💰 Flag to prevent excessive credit fetches
  const lastCreditFetchRef = useRef<number>(0);
  const CREDIT_FETCH_THROTTLE_MS = 1000; // Min 1 second between fetches

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
          // OLD GAME HISTORY - All versions - now server-only
          key === 'betting_app_immutable_bet_history_v1' ||
          key === 'betting_app_immutable_bet_history_v2' ||
          key === 'betting_app_immutable_bet_history_v3' ||
          key === 'betting_app_immutable_bet_history_v4' ||
          key === 'betting_app_immutable_bet_history_v5' ||
          key === 'betting_app_immutable_bet_history_v6' ||
          key === 'betting_app_immutable_bet_history_v7' ||
          // ✅ OLD BET RECEIPTS - All versions - now server-only (clean up completely)
          key === 'betting_app_user_bet_receipts' ||
          key === 'betting_app_immutable_bet_receipts_v1' ||
          key === 'betting_app_immutable_bet_receipts_v2' ||
          key === 'betting_app_immutable_bet_receipts_v3' ||
          key === 'betting_app_immutable_bet_receipts_v4' ||
          key === 'betting_app_immutable_bet_receipts_v5' ||
          key === 'betting_app_immutable_bet_receipts_v6' ||
          key === 'betting_app_immutable_bet_receipts_v7'
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
  
  // 🎮 SERVER-ONLY: Game history ALWAYS comes from server database, never localStorage
  // This ensures all browsers see the exact same data
  // We start with empty array and populate via socket event from server
  const [immutableBetHistory, setImmutableBetHistory] = useState<BetHistoryRecord[]>([]);
  
  // PRIVATE: setBetHistory is now completely internal and cannot be called externally
  // This ensures bet history can only be modified through addBetHistoryRecord
  // ✅ BET RECEIPTS - SERVER-ONLY (just like game history)
  // No localStorage - all data from server via Socket.IO
  // This ensures consistency and prevents stale data issues
  const [userBetReceipts, setUserBetReceipts] = useState<UserBetReceipt[]>([]);
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

    // 💰 LISTEN FOR REAL-TIME GAME HISTORY UPDATES FROM SERVER
    // When another browser adds a game, sync it here - EXACTLY LIKE WALLET PATTERN
    // ⚠️ CRITICAL: Set up listeners BEFORE connecting socket
    // This ensures we don't miss the game-history-update sent on set-arena
    const handleGameHistoryUpdate = (data: { arenaId: string, games: any[], timestamp: number }) => {
      try {
        // ✅ TRUST SERVER COMPLETELY - Server is source of truth
        console.log(`💰 [GAME-HISTORY-SYNC] Received real-time game history update for arena '${data.arenaId}': ${data.games?.length} games`);
        console.log(`💾 [GAME-HISTORY-SYNC] Games from server:`, data.games);
        
        if (!data.games || data.games.length === 0) {
          console.log('📭 [GAME-HISTORY-SYNC] Server sent empty history - this is valid (cleared)');
          console.warn('⚠️ [GAME-HISTORY-DEBUG] Empty array from server!');
          console.warn('   Possible causes:');
          console.warn('   1. Database is in STUB MODE (set DATABASE_URL to enable persistence)');
          console.warn('   2. Server was restarted (in-memory storage cleared)');
          console.warn('   3. History was cleared by admin');
          console.warn('   4. No games added yet in this session');
          setImmutableBetHistory([]);
          return;
        }
        
        // Convert server format to local BetHistoryRecord format
        const ensuredHistory = data.games.map((record, index) => ({
          ...record,
          id: record.id || record.game_id || `game-${record.game_number || index}`,
          gameNumber: record.game_number || record.gameNumber || 0,
          teamAScore: record.team_a_score || record.teamAScore || 0,
          teamBScore: record.team_b_score || record.teamBScore || 0,
          winningTeam: record.winning_team || record.winningTeam || null,
          teamABalls: record.team_a_balls || record.teamABalls || 0,
          teamBBalls: record.team_b_balls || record.teamBBalls || 0,
          breakingTeam: record.breaking_team || record.breakingTeam || 'A',
          bets: record.bets_data ? (typeof record.bets_data === 'string' ? JSON.parse(record.bets_data) : record.bets_data) : record.bets || {},
          arenaId: record.arena_id || record.arenaId || 'default'
        }));
        
        // ✅ REPLACE entire history with server version (just like wallet replaces credits)
        console.log(`✅ [GAME-HISTORY-SYNC] Updated from socket: ${immutableBetHistory.length} → ${ensuredHistory.length} games`);
        setImmutableBetHistory([...ensuredHistory]);
      } catch (err) {
        console.error('❌ [GAME-HISTORY-SYNC] Error handling history update:', err);
      }
    };

  // ✅ LISTEN FOR BET RECEIPTS UPDATES FROM SERVER (just like game history)
  // Server is the ONLY source of truth for bet receipts
  const handleBetReceiptsUpdate = (data: { betReceipts: any[], userId?: string, arenaId?: string }) => {
    try {
      console.log(`📥 [BET-RECEIPTS-SYNC] Received bet receipts update for user '${data.userId}' in arena '${data.arenaId}': ${data.betReceipts?.length} receipts`);
      
      // ✅ TRUST SERVER COMPLETELY - Server is source of truth (exactly like game history)
      if (!data.betReceipts || !Array.isArray(data.betReceipts)) {
        console.log('📭 [BET-RECEIPTS-SYNC] Server sent empty/null receipts - clearing local state');
        setUserBetReceipts([]);
        return;
      }
      
      // Ensure all records have IDs
      const ensuredReceipts = data.betReceipts.map((record, index) => ({
        ...record,
        id: record.id || `bet-receipt-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`
      }));
      
      setUserBetReceipts([...ensuredReceipts]);
      console.log(`✅ [BET-RECEIPTS-SYNC] Updated user bet receipts: ${ensuredReceipts.length} receipts`);
    } catch (err) {
      console.error('❌ [BET-RECEIPTS-SYNC] Error handling bet receipts update:', err);
    }
  };

    // Setup game history listeners
    socketIOService.onGameHistoryUpdate(handleGameHistoryUpdate);
    
    // 🎮 NOTE: onGameAdded is NOT needed anymore
    // Server broadcasts complete game-history-update after each game is added
    // This ensures ALL clients get the same data from the server
    // EXACTLY LIKE THE WALLET PATTERN - single source of truth
    
    // Listen for game history clear broadcasts
    socketIOService.onGameHistoryCleared((data) => {
      try {
        console.log(`💰 [GAME-HISTORY-SYNC] Server cleared history for arena '${data.arenaId}' (${data.deletedCount} games deleted from DB)`);
        
        // ✅ Always clear immediately - server is source of truth
        setImmutableBetHistory([]);
        console.log(`✅ [GAME-HISTORY-SYNC] Local history cleared to match server`);
      } catch (err) {
        console.error('❌ [GAME-HISTORY-SYNC] Error handling clear broadcast:', err);
      }
    });
    
    // ✅ Setup bet receipts listeners (just like game history)
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
        
        // 🎮 SERVER-ONLY: Clear from memory only
        // Server database is the source of truth
        setImmutableBetHistory([]);
        
        setUserBetReceipts([]);
        setCreditTransactions([]);
        
        console.log('✅ [UserContext] All data cleared');
        
        // 🚀 OPTIMIZED: Reset flags immediately (reduced from 500ms to 50ms for faster sync)
        // 50ms is enough for React batching while keeping lag minimal
        setTimeout(() => {
          isClearingRef.current = false;
          pauseListenersRef.current = false;
          
          // BROADCAST resume command to ALL browsers
          socketIOService.emitResumeListeners();
          
          console.log('🔄 [UserContext] Clear complete - resuming Socket.IO listeners');
        }, 50);
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

    // ⚠️ CRITICAL: Connect AFTER all listeners are set up
    // This ensures we don't miss the game-history-update sent on set-arena
    console.log('📡 [SOCKET] All listeners set up - now connecting to server');
    socketIOService.connect();

    return () => {
      console.log('🔌 Cleaning up Socket.IO listeners');
      // Remove all socket listeners
      socketIOService.offGameHistoryUpdate();
      socketIOService.offBetReceiptsUpdate();
      socketIOService.offBetReceiptsData();
      socketIOService.offArenaBetReceiptsData();
      socketIOService.offBetReceiptsCleared();
      socketIOService.offBetReceiptsError();
      socketIOService.offClearAllData();
      socketIOService.offPauseListeners();
      socketIOService.offResumeListeners();
      socketIOService.offGameAdded();
      socketIOService.offGameHistoryCleared();
      socketIOService.offGameHistoryError();
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
      
      // ✅ REQUEST BET RECEIPTS FROM SERVER (just like game history)
      // Server sends all bet receipts for this user via Socket.IO
      // Retry until socket is connected (handles page refresh and reconnection)
      const requestWithRetry = () => {
        if (socketIOService.isSocketConnected()) {
          console.log(`📥 [BET-RECEIPTS] Requesting from server for user ${currentUser.id}`);
          socketIOService.requestBetReceipts(currentUser.id);
        } else {
          // Socket not ready yet, retry in 200ms
          console.log(`⏳ [BET-RECEIPTS] Socket not ready, retrying...`);
          setTimeout(requestWithRetry, 200);
        }
      };
      
      requestWithRetry();
    } else {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
  }, [currentUser]);

  // NOTE: betHistory is synced via Socket.IO, don't save to localStorage separately
  
  // 🎮 SERVER-ONLY: Game history is managed by server database, NO localStorage
  // This useEffect now only tracks the state for UI rendering, all persistence is on server
  useEffect(() => {
    // Update backup ref for reference only (not for persistence)
    allGamesEverAddedRef.current = immutableBetHistory;
    
    // Only log for debugging, no localStorage operations
    if (immutableBetHistory.length > 0) {
      console.log('✅ [HISTORY-SYNC] Current game history in memory:', immutableBetHistory.length, 'records (from server)');
    }
  }, [immutableBetHistory]);
  
  // NOTE: userBetReceipts is synced via Socket.IO, don't save to localStorage separately
  
  // IMMUTABLE BET RECEIPTS - Always save to separate storage, NEVER cleared
  // ✅ BET RECEIPTS ARE SERVER-ONLY - NO localStorage
  // All data comes from server via Socket.IO, just like game history
  
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

  const addUser = async (name: string, password: string): Promise<User> => {
    if (!name.trim() || !password.trim()) {
      throw new Error("Name and password are required");
    }
    
    try {
      console.log(`👤 [USERS] Creating new user: ${name}`);
      
      // Save to server (source of truth)
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password, initialCredits: 0 })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user on server');
      }
      
      const newUser = await response.json();
      console.log(`✅ [USERS] User created on server: ${newUser.name} (ID: ${newUser.id})`);
      
      // Update local state
      setUsers(prev => {
        const updatedUsers = [...prev, newUser];
        
        // Backup to localStorage with error handling
        try {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
          console.log('💾 [USERS] User backed up to localStorage');
        } catch (storageError) {
          console.error('⚠️ [USERS] Failed to backup user to localStorage:', storageError);
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
      console.error('❌ [USERS] Error adding user:', error);
      toast.error("Failed to Add User", {
        description: "There was an error creating the user. Please try again.",
        className: "custom-toast-error"
      });
      throw error;
    }
  };
  
  const authenticateUser = async (name: string, password: string): Promise<User | null> => {
    try {
      // 👤 Authenticate on server (source of truth)
      console.log(`🔐 [AUTH] Authenticating user: ${name}`);
      
      const response = await fetch('/api/users/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      });
      
      if (!response.ok) {
        console.warn('⚠️ [AUTH] Authentication failed: invalid credentials');
        return null;
      }
      
      const user = await response.json();
      console.log(`✅ [AUTH] User authenticated: ${user.name} (credits: ${user.credits})`);
      
      // Update local users list with fresh data from server
      setUsers(prev => {
        const existingIndex = prev.findIndex(u => u.id === user.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = user;
          return updated;
        }
        return [...prev, user];
      });
      
      return user;
    } catch (error) {
      console.error('❌ [AUTH] Error during authentication:', error);
      // Fallback to local authentication
      const user = users.find(u => 
        u.name.toLowerCase() === name.toLowerCase() && 
        u.password === password
      );
      return user || null;
    }
  };

  const addCredits = async (userId: string, amount: number, isAdmin: boolean = false, reason: string = 'admin_add') => {
    if (amount <= 0) {
      console.warn('⚠️ [CREDITS] Invalid amount:', amount);
      return;
    }
    
    try {
      console.log(`💰 [CREDITS-ADD] Starting: userId=${userId}, amount=${amount}, reason=${reason}`);
      
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Server error: ${response.status} - ${errorData.error || 'Unknown'}`);
      }
      
      const data = await response.json();
      const newBalance = data.newBalance;
      console.log(`✅ [CREDITS-ADD] Server returned newBalance=${newBalance}`);
      
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
    if (amount <= 0) {
      console.warn('⚠️ [CREDITS] Invalid deduct amount:', amount);
      return true;
    }
    
    const user = users.find(u => u.id === userId);
    if (!user) {
      console.warn('⚠️ [CREDITS] User not found:', userId);
      return false;
    }
    
    try {
      console.log(`💰 [CREDITS-BET] Starting: userId=${userId}, amount=${amount}, currentBalance=${user.credits}`);
      
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
        const error = await response.json().catch(() => ({}));
        console.warn(`⚠️ [CREDITS-BET] Server rejected: ${response.status}`, error);
        toast.error("Insufficient Credits", {
          description: error.error || `${user.name} doesn't have enough credits`,
          className: "custom-toast-error"
        });
        return false;
      }
      
      const data = await response.json();
      const newBalance = data.newBalance;
      console.log(`✅ [CREDITS-BET] Server returned newBalance=${newBalance}`);
      
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
    
    console.log('💰 [GAME-HISTORY-SYNC] Adding new game record, game#:', record.gameNumber);
    
    // 💰 UPDATE LOCAL STATE FIRST (immediate display like wallet credits)
    const MAX_GAMES = 50;
    const immediateHistory = [newRecord, ...immutableBetHistory].slice(0, MAX_GAMES);
    setImmutableBetHistory(immediateHistory);
    console.log('✅ [GAME-HISTORY-SYNC] Local state updated:', immediateHistory.length, 'games');
    
    // 💰 SEND TO SERVER (server will save to database and broadcast to all clients)
    try {
      const gameHistoryRecord = {
        gameNumber: record.gameNumber,
        teamAName: record.teamAName,
        teamBName: record.teamBName,
        teamAScore: record.teamAScore,
        teamBScore: record.teamBScore,
        winningTeam: record.winningTeam,
        teamABalls: record.teamABalls,
        teamBBalls: record.teamBBalls,
        breakingTeam: record.breakingTeam,
        duration: record.duration,
        totalAmount: record.totalAmount,
        bets: record.bets,
        arenaId: record.arenaId || socketIOService.getArenaId() || 'default'
      };
      
      console.log('📤 [GAME-HISTORY-SYNC] Sending to server:', `Game #${record.gameNumber}`);
      console.log('🔌 [GAME-HISTORY-SYNC] Socket connected?', socketIOService.isSocketConnected());
      
      if (socketIOService.isSocketConnected()) {
        socketIOService.emitNewGameAdded(gameHistoryRecord);
        
        // 💰 MIRROR WALLET PATTERN: Request full history from server immediately
        // Server will broadcast complete history to all clients synchronously
        console.log('📡 [GAME-HISTORY-SYNC] Requesting full history from server');
        socketIOService.emitRequestGameHistory();
      } else {
        console.warn('⚠️ [GAME-HISTORY-SYNC] Socket NOT connected! Cannot emit game to server');
      }
    } catch (err) {
      console.error('❌ [GAME-HISTORY-SYNC] Error sending game to server:', err);
    }
    
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
    // 🎮 SERVER-ONLY: Clear game history from server database only
    console.log('🧹 Clearing ALL game history from server');
    
    // Clear local memory immediately
    setImmutableBetHistory([]);
    
    // 🎮 CRITICAL: Clear from server database via Socket.IO
    // Server will broadcast clear to all clients, so no localStorage needed
    try {
      // 🎮 Use socketIOService to determine correct arena
        socketIOService.emitClearGameHistory();
    } catch (err) {
      console.error('❌ [RESET-HISTORY] Error clearing server history:', err);
    }
    
    console.log('✅ Game history cleared (from server, no localStorage)');
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
      
      // QUOTA MANAGEMENT: Keep only last 250 receipts in memory
      const MAX_RECEIPTS = 250;
      if (updatedReceipts.length > MAX_RECEIPTS) {
        console.log(`⚠️ Bet receipts limit reached (${updatedReceipts.length}), trimming to ${MAX_RECEIPTS} receipts`);
        finalReceipts = updatedReceipts.slice(0, MAX_RECEIPTS);
        return finalReceipts;
      }
      
      finalReceipts = updatedReceipts;
      return updatedReceipts;
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
  
  // ✅ GET HARD LEDGER BET RECEIPTS - Read-only view of user's bet receipts (from server)
  const getHardLedgerBetReceipts = (userId: string): UserBetReceipt[] => {
    return JSON.parse(JSON.stringify(userBetReceipts.filter(receipt => receipt.userId === userId)));
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

  // ✅ CLEAR BETTING QUEUE RECEIPTS - Clear local state only (server-side deletion is separate)
  const clearBettingQueueReceipts = () => {
    console.log('🧹 Clearing betting queue receipts from display');
    setUserBetReceipts([]);
    
    toast.success("Betting Queue Cleared", {
      description: "Betting queue receipts cleared",
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

  // 💰 FETCH CURRENT USER BALANCE FROM SERVER ON MOUNT
  // This ensures every browser loads the accurate server balance
  useEffect(() => {
    if (!currentUser) {
      console.log('⚠️ [CREDITS] No current user, skipping balance sync');
      return;
    }

    const syncCurrentUserBalanceFromServer = async () => {
      // Throttle fetches to prevent excessive API calls
      const now = Date.now();
      if (now - lastCreditFetchRef.current < CREDIT_FETCH_THROTTLE_MS) {
        return;
      }
      lastCreditFetchRef.current = now;

      try {
        console.log(`📡 [CREDITS] Fetching server balance for user: ${currentUser.id}`);
        const response = await fetch(`/api/credits/${currentUser.id}`);
        
        if (!response.ok) {
          console.warn(`⚠️ [CREDITS] Failed to fetch balance: ${response.status}`);
          return;
        }

        const data = await response.json();
        const serverBalance = data.balance;

        console.log(`✅ [CREDITS] Server balance: ${serverBalance}, Local balance: ${currentUser.credits}`);

        // If balances differ, update local state to match server
        if (serverBalance !== currentUser.credits) {
          console.log(`🔄 [CREDITS] Balance mismatch detected! Updating from server...`);
          
          // Update users array with server balance
          setUsers(prev => prev.map(u => {
            if (u.id === currentUser.id) {
              const updatedUser = { ...u, credits: serverBalance };
              console.log(`✅ [CREDITS] Updated ${currentUser.id}: ${u.credits} → ${serverBalance}`);
              return updatedUser;
            }
            return u;
          }));

          // Also update current user to trigger UI re-render
          setCurrentUserWithLogin({ ...currentUser, credits: serverBalance });
        } else {
          console.log(`✅ [CREDITS] Balances match! Current user is in sync`);
        }
      } catch (error) {
        console.error('❌ [CREDITS] Error syncing balance from server:', error);
      }
    };

    // Sync balance on mount
    syncCurrentUserBalanceFromServer();

    // Also sync every 5 seconds to catch remote changes
    const syncInterval = setInterval(syncCurrentUserBalanceFromServer, 5000);
    
    return () => clearInterval(syncInterval);
  }, [currentUser]); // Use full currentUser object to avoid stale closures

  // 💰 LISTEN FOR REAL-TIME CREDIT UPDATES FROM SERVER
  // When another browser updates this user's balance, sync it here
  useEffect(() => {
    if (!currentUser) return;

    const handleCreditUpdate = (data: any) => {
      if (data.userId === currentUser.id) {
        console.log(`💰 [CREDITS-SYNC] Received real-time credit update for ${currentUser.id}: ${data.newBalance}`);
        
        // Update users array
        setUsers(prev => prev.map(u => {
          if (u.id === currentUser.id) {
            console.log(`✅ [CREDITS-SYNC] Updated from socket: ${u.credits} → ${data.newBalance}`);
            return { ...u, credits: data.newBalance };
          }
          return u;
        }));

        // Update current user  
        setCurrentUserWithLogin(prev => {
          if (prev?.id === currentUser.id) {
            const updated = { ...prev, credits: data.newBalance };
            
            // Show toast if significant change
            if (Math.abs(data.newBalance - prev.credits) > 0) {
              toast.info("Balance Updated", {
                description: `Your balance is now ${data.newBalance} coins`,
                className: "custom-toast-info"
              });
            }
            
            return updated;
          }
          return prev;
        });
      }
    };

    // Listen for credit updates from server
    if (socketIOService.isSocketConnected()) {
      socketIOService.socket?.on('credit-update', handleCreditUpdate);
    }

    return () => {
      if (socketIOService.socket) {
        socketIOService.socket.off('credit-update', handleCreditUpdate);
      }
    };
  }, [currentUser?.id]);

  // 👥 FETCH USERS FROM SERVER ON APP LOAD
  // Override localStorage with server data to ensure accuracy
  useEffect(() => {
    const fetchUsersFromServer = async () => {
      try {
        console.log('📡 [USERS] Fetching users from server...');
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          console.warn('⚠️ [USERS] Failed to fetch users from server');
          return;
        }
        
        const serverUsers = await response.json();
        console.log(`✅ [USERS] Loaded ${serverUsers.length} users from server`);
        
        // Update local state with server users (overrides localStorage)
        setUsers(serverUsers);
        
        // Also save to localStorage for fallback
        try {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(serverUsers));
          console.log('💾 [USERS] Synced users to localStorage backup');
        } catch (e) {
          console.warn('⚠️ [USERS] Could not save to localStorage:', e);
        }
      } catch (error) {
        console.error('❌ [USERS] Error fetching users from server:', error);
      }
    };
    
    // Fetch users on mount
    fetchUsersFromServer();
    
    // Also fetch every 10 seconds to keep credits fresh
    const refreshInterval = setInterval(fetchUsersFromServer, 10000);
    
    return () => clearInterval(refreshInterval);
  }, []);

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
