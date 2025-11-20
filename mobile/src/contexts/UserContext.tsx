import React, { createContext, useContext, useState } from 'react';

interface User {
  id: string;
  name: string;
  password: string;
  credits: number;
  isMember: boolean;
}

interface BetHistoryRecord {
  id: string;
  gameNumber: number;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  winningTeam: 'A' | 'B';
  totalAmount: number;
  timestamp: number;
}

interface UserContextType {
  currentUser: User | null;
  betHistory: BetHistoryRecord[];
  authenticateUser: (name: string, password: string) => User | null;
  addBetHistoryRecord: (record: any) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [betHistory, setBetHistory] = useState<BetHistoryRecord[]>([]);

  const authenticateUser = (name: string, password: string): User | null => {
    // Mock authentication - in production, connect to backend
    const user: User = {
      id: `user-${Date.now()}`,
      name,
      password,
      credits: 1000,
      isMember: false,
    };
    setCurrentUser(user);
    return user;
  };

  const addBetHistoryRecord = (record: any) => {
    const newRecord: BetHistoryRecord = {
      id: `game-${Date.now()}`,
      ...record,
      timestamp: Date.now(),
    };
    setBetHistory([newRecord, ...betHistory]);
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        betHistory,
        authenticateUser,
        addBetHistoryRecord,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

