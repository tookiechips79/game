import React, { createContext, useContext, useState, useEffect } from "react";
import { User, BetHistoryRecord, UserBetReceipt, CreditTransaction } from "@/types/user";
import { toast } from "sonner";

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
  incrementWins: (userId: string) => void;
  incrementLosses: (userId: string) => void;
  socialLogin: (provider: "google" | "apple") => User;
  userBetReceipts: UserBetReceipt[];
  addUserBetReceipt: (receipt: Omit<UserBetReceipt, "id" | "timestamp">) => void;
  getUserBetReceipts: (userId: string) => UserBetReceipt[];
  processCashout: (userId: string, amount: number) => boolean;
  creditTransactions: CreditTransaction[];
  getCreditTransactions: (userId: string) => CreditTransaction[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USERS_STORAGE_KEY = "betting_app_users";
const CURRENT_USER_STORAGE_KEY = "betting_app_current_user";
const BET_HISTORY_STORAGE_KEY = "betting_app_bet_history";
const USER_BET_RECEIPTS_KEY = "betting_app_user_bet_receipts";
const CREDIT_TRANSACTIONS_KEY = "betting_app_credit_transactions";

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [betHistory, setBetHistory] = useState<BetHistoryRecord[]>([]);
  const [userBetReceipts, setUserBetReceipts] = useState<UserBetReceipt[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);

  useEffect(() => {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      const defaultAdmin: User = {
        id: "admin-" + Date.now(),
        name: "Admin",
        credits: 1000,
        password: "admin",
        wins: 0,
        losses: 0
      };
      setUsers([defaultAdmin]);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([defaultAdmin]));
    }

    const storedCurrentUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (storedCurrentUser) {
      setCurrentUser(JSON.parse(storedCurrentUser));
    }
    
    const storedBetHistory = localStorage.getItem(BET_HISTORY_STORAGE_KEY);
    if (storedBetHistory) {
      setBetHistory(JSON.parse(storedBetHistory));
    }
    
    const storedUserBetReceipts = localStorage.getItem(USER_BET_RECEIPTS_KEY);
    if (storedUserBetReceipts) {
      setUserBetReceipts(JSON.parse(storedUserBetReceipts));
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
    if (betHistory.length > 0) {
      localStorage.setItem(BET_HISTORY_STORAGE_KEY, JSON.stringify(betHistory));
    }
  }, [betHistory]);
  
  useEffect(() => {
    if (userBetReceipts.length > 0) {
      localStorage.setItem(USER_BET_RECEIPTS_KEY, JSON.stringify(userBetReceipts));
    }
  }, [userBetReceipts]);
  
  useEffect(() => {
    if (creditTransactions.length > 0) {
      localStorage.setItem(CREDIT_TRANSACTIONS_KEY, JSON.stringify(creditTransactions));
    }
  }, [creditTransactions]);

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

  const addUser = (name: string, password: string): User => {
    if (!name.trim() || !password.trim()) {
      throw new Error("Name and password are required");
    }
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      credits: 0,
      password,
      wins: 0,
      losses: 0
    };
    
    setUsers(prev => [...prev, newUser]);
    toast.success("User Added", {
      description: `User "${name}" has been created`
    });
    
    return newUser;
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
    
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        const updatedUser = { ...user, credits: user.credits + amount };
        
        if (currentUser?.id === userId) {
          setCurrentUser(updatedUser);
        }
        
        return updatedUser;
      }
      return user;
    }));
    
    const userName = users.find(u => u.id === userId)?.name || userId;
    
    if (isAdmin) {
      toast.success("Credits Added", {
        description: `Added ${amount} credits to ${userName}`
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
        description: `${user.name} doesn't have enough credits`
      });
      return false;
    }
    
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newCredits = Math.max(0, u.credits - amount);
        const updatedUser = { ...u, credits: newCredits };
        
        if (currentUser?.id === userId) {
          setCurrentUser(updatedUser);
        }
        
        return updatedUser;
      }
      return u;
    }));
    
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
    
    setBetHistory(prev => [newRecord, ...prev]);
    
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
    });
  };
  
  const resetBetHistory = () => {
    setBetHistory([]);
    localStorage.removeItem(BET_HISTORY_STORAGE_KEY);
    toast.success("History Reset", {
      description: "All game history has been cleared",
    });
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
    
    setUserBetReceipts(prev => [newReceipt, ...prev]);
  };
  
  const getUserBetReceipts = (userId: string) => {
    return userBetReceipts.filter(receipt => receipt.userId === userId);
  };

  const socialLogin = (provider: "google" | "apple"): User => {
    const userId = `${provider}-user-${Date.now()}`;
    const userName = `${provider}User${Math.floor(Math.random() * 1000)}`;
    const randomPassword = Math.random().toString(36).substring(2, 15);
    
    const newUser: User = {
      id: userId,
      name: userName,
      credits: 100,
      password: randomPassword,
      wins: 0,
      losses: 0
    };
    
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    
    toast.success(`${provider} Login Successful`, {
      description: `Logged in as ${userName} with 100 bonus credits!`
    });
    
    return newUser;
  };

  const processCashout = (userId: string, amount: number): boolean => {
    if (amount <= 0) {
      toast.error("Invalid Amount", {
        description: "Please enter a valid amount greater than 0"
      });
      return false;
    }
    
    const user = users.find(u => u.id === userId);
    if (!user) {
      toast.error("User Not Found", {
        description: "Could not find user account"
      });
      return false;
    }
    
    if (user.credits < amount) {
      toast.error("Insufficient Balance", {
        description: `You only have ${user.credits} COINS available to cashout`
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
      description: `${amount} COINS have been cashed out from your account`
    });
    
    return true;
  };

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        setCurrentUser,
        addUser,
        authenticateUser,
        addCredits,
        deductCredits,
        getUserById,
        getAllUsers,
        betHistory,
        addBetHistoryRecord,
        resetBetHistory,
        incrementWins,
        incrementLosses,
        socialLogin,
        userBetReceipts,
        addUserBetReceipt,
        getUserBetReceipts,
        processCashout,
        creditTransactions,
        getCreditTransactions,
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
