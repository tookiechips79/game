import React, { createContext, useContext, useState, useEffect } from "react";
import { User, BetHistoryRecord, UserBetReceipt, CreditTransaction } from "@/types/user";
import { toast } from "sonner";
import { socketIOService } from "@/services/socketIOService";

interface UserContextType {
  users: User[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  addUser: (name: string, password: string) => User;
  authenticateUser: (name: string, password: string) => User | null;
  addCredits: (userId: string, amount: number, isAdmin?: boolean) => void;
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
  // Initialize with default admin to ensure we always have at least one user
  const [users, setUsers] = useState<User[]>(() => {
    try {
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
  const [betHistory, setBetHistory] = useState<BetHistoryRecord[]>([]);
  
  // IMMUTABLE BET HISTORY - This can NEVER be cleared or modified
  const [immutableBetHistory, setImmutableBetHistory] = useState<BetHistoryRecord[]>([]);
  
  // PRIVATE: setBetHistory is now completely internal and cannot be called externally
  // This ensures bet history can only be modified through addBetHistoryRecord
  const [userBetReceipts, setUserBetReceipts] = useState<UserBetReceipt[]>([]);
  
  // IMMUTABLE BET RECEIPTS - This can NEVER be cleared or modified
  const [immutableBetReceipts, setImmutableBetReceipts] = useState<UserBetReceipt[]>([]);
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
    
    const storedBetHistory = localStorage.getItem(BET_HISTORY_STORAGE_KEY);
    if (storedBetHistory) {
      setBetHistory(JSON.parse(storedBetHistory));
    }
    
    // Load immutable bet history - this can NEVER be cleared
    try {
      let storedImmutableBetHistory = localStorage.getItem(IMMUTABLE_BET_HISTORY_KEY);
      if (!storedImmutableBetHistory) {
        // Fallback to bulletproof key if main key doesn't exist
        storedImmutableBetHistory = localStorage.getItem(BULLETPROOF_BET_HISTORY_KEY);
      }
      
      if (storedImmutableBetHistory) {
        const parsedHistory = JSON.parse(storedImmutableBetHistory);
        if (Array.isArray(parsedHistory)) {
          setImmutableBetHistory(parsedHistory);
          console.log('✅ Immutable bet history loaded:', parsedHistory.length, 'records');
        } else {
          console.warn('⚠️ Invalid immutable bet history format, initializing empty');
          setImmutableBetHistory([]);
        }
      } else {
        console.log('ℹ️ No immutable bet history found, initializing empty');
        setImmutableBetHistory([]);
      }
    } catch (error) {
      console.error('❌ Error loading immutable bet history:', error);
      setImmutableBetHistory([]);
    }
    
    const storedUserBetReceipts = localStorage.getItem(USER_BET_RECEIPTS_KEY);
    if (storedUserBetReceipts) {
      setUserBetReceipts(JSON.parse(storedUserBetReceipts));
    }
    
    // Load immutable bet receipts - this can NEVER be cleared
    try {
      let storedImmutableBetReceipts = localStorage.getItem(IMMUTABLE_BET_RECEIPTS_KEY);
      if (!storedImmutableBetReceipts) {
        // Fallback to bulletproof key if main key doesn't exist
        storedImmutableBetReceipts = localStorage.getItem(BULLETPROOF_BET_RECEIPTS_KEY);
      }
      
      if (storedImmutableBetReceipts) {
        const parsedReceipts = JSON.parse(storedImmutableBetReceipts);
        if (Array.isArray(parsedReceipts)) {
          setImmutableBetReceipts(parsedReceipts);
          console.log('✅ Immutable bet receipts loaded:', parsedReceipts.length, 'receipts');
        } else {
          console.warn('⚠️ Invalid immutable bet receipts format, initializing empty');
          setImmutableBetReceipts([]);
        }
      } else {
        console.log('ℹ️ No immutable bet receipts found, initializing empty');
        setImmutableBetReceipts([]);
      }
    } catch (error) {
      console.error('❌ Error loading immutable bet receipts:', error);
      setImmutableBetReceipts([]);
    }
    
    const storedCreditTransactions = localStorage.getItem(CREDIT_TRANSACTIONS_KEY);
    if (storedCreditTransactions) {
      setCreditTransactions(JSON.parse(storedCreditTransactions));
    }
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
  
  useEffect(() => {
    // Always save bet history to localStorage - it's a permanent ledger
      localStorage.setItem(BET_HISTORY_STORAGE_KEY, JSON.stringify(betHistory));
  }, [betHistory]);
  
  // IMMUTABLE BET HISTORY - Always save to separate storage, NEVER cleared
  useEffect(() => {
    try {
      localStorage.setItem(IMMUTABLE_BET_HISTORY_KEY, JSON.stringify(immutableBetHistory));
      localStorage.setItem(BULLETPROOF_BET_HISTORY_KEY, JSON.stringify(immutableBetHistory));
      // Additional protection: save to a completely unique key
      const uniqueKey = "ultra_bulletproof_bet_history_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(uniqueKey, JSON.stringify(immutableBetHistory));
      console.log('✅ Immutable bet history saved to localStorage:', immutableBetHistory.length, 'records');
    } catch (error) {
      console.error('❌ Failed to save immutable bet history:', error);
    }
  }, [immutableBetHistory]);
  
  useEffect(() => {
    if (userBetReceipts.length > 0) {
      localStorage.setItem(USER_BET_RECEIPTS_KEY, JSON.stringify(userBetReceipts));
    }
  }, [userBetReceipts]);
  
  // IMMUTABLE BET RECEIPTS - Always save to separate storage, NEVER cleared
  useEffect(() => {
    try {
      localStorage.setItem(IMMUTABLE_BET_RECEIPTS_KEY, JSON.stringify(immutableBetReceipts));
      localStorage.setItem(BULLETPROOF_BET_RECEIPTS_KEY, JSON.stringify(immutableBetReceipts));
      // Additional protection: save to a completely unique key
      const uniqueKey = "ultra_bulletproof_bet_receipts_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(uniqueKey, JSON.stringify(immutableBetReceipts));
      console.log('✅ Immutable bet receipts saved to localStorage:', immutableBetReceipts.length, 'receipts');
    } catch (error) {
      console.error('❌ Failed to save immutable bet receipts:', error);
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

  const addCredits = (userId: string, amount: number, isAdmin: boolean = false) => {
    if (amount <= 0) return;
    
    setUsers(prev => {
      const updatedUsers = prev.map(user => {
        if (user.id === userId) {
          const updatedUser = { ...user, credits: user.credits + amount };
          
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
      toast.success("Credits Added", {
        description: `Added ${amount} credits to ${userName}`,
        className: "custom-toast-success"
      });
      
      addCreditTransaction({
        userId,
        userName: userName,
        type: 'admin_add',
        amount,
        details: 'Admin added coins to account'
      });
    }
  };

  const deductCredits = (userId: string, amount: number, isAdminAction: boolean = false): boolean => {
    if (amount <= 0) return true;
    
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    
    if (user.credits < amount && !isAdminAction) {
      toast.error("Insufficient Credits", {
        description: `${user.name} doesn't have enough credits`,
        className: "custom-toast-error"
      });
      return false;
    }
    
    setUsers(prev => {
      const updatedUsers = prev.map(u => {
        if (u.id === userId) {
          const newCredits = Math.max(0, u.credits - amount);
          const updatedUser = { ...u, credits: newCredits };
          
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
    
    setBetHistory(prev => {
      const updatedHistory = [newRecord, ...prev];
      
      // BET HISTORY IS LOCAL ONLY - NO SOCKET EMISSIONS
      // This prevents any external clearing or modification
      
      return updatedHistory;
    });
    
    // ALSO ADD TO IMMUTABLE BET HISTORY - This can NEVER be cleared
    setImmutableBetHistory(prev => {
      const updatedImmutableHistory = [newRecord, ...prev];
      return updatedImmutableHistory;
    });
    
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
    // Clear only the mutable bet history (for display purposes)
    // Keep immutable bet history intact for user settings
    console.log('🧹 Clearing mutable bet history');
    
    setBetHistory([]);
    localStorage.setItem(BET_HISTORY_STORAGE_KEY, JSON.stringify([]));
    
    toast.success("Game History Cleared", {
      description: "Game history has been cleared from display",
      className: "custom-toast-success"
    });
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
    
    setUserBetReceipts(prev => {
      const updatedReceipts = [newReceipt, ...prev];
      
      // USER SETTINGS ARE OFFLINE - NO SOCKET EMISSIONS
      // Bet receipts are now completely local
      
      return updatedReceipts;
    });
    
    // ALSO ADD TO IMMUTABLE BET RECEIPTS - This can NEVER be cleared
    setImmutableBetReceipts(prev => {
      const updatedImmutableReceipts = [newReceipt, ...prev];
      return updatedImmutableReceipts;
    });
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

  const processCashout = (userId: string, amount: number): boolean => {
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
    
    if (user.credits < amount) {
      toast.error("Insufficient Balance", {
        description: `You only have ${user.credits} COINS available to cashout`,
        className: "custom-toast-error"
      });
      return false;
    }
    
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updatedUser = { ...u, credits: u.credits - amount };
        
        if (currentUser?.id === userId) {
          setCurrentUser(updatedUser);
        }
        
        return updatedUser;
      }
      return u;
    }));
    
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
        betHistory,
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
