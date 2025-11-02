import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, Zap, Coins, CheckSquare, Unlock, 
  Wallet, TimerReset, ReceiptText, SkipForward, ArrowDownUp, ArrowDown, Trash2
} from "lucide-react";
import NumericAnimation from "@/components/NumericAnimation";
import ScoreBoard from "@/components/ScoreBoard";
import GameDescription from "@/components/GameDescription";
import UserCreditSystem, { UserSelector } from "@/components/UserCreditSystem";
import UserWidgetsContainer from "@/components/UserWidgetsContainer";
import BookedBetsReceipt from "@/components/BookedBetsReceipt";
import BetLedger from "@/components/BetLedger";
import BetReceiptsLedger from "@/components/BetReceiptsLedger";
import BirdButton from "@/components/BirdButton";
import GameInfoWindow from "@/components/GameInfoWindow";
import GameHistoryWindow from "@/components/GameHistoryWindow";
import { useUser } from "@/contexts/UserContext";
import { Bet, BookedBet, ConfirmationState } from "@/types/user";
import { socketIOService } from "@/services/socketIOService";
import { useSound } from "@/hooks/use-sound";

// Arena-specific storage keys for One Pocket Arena
const ARENA_ID = 'one-pocket';
const ARENA_GAME_STATE_KEY = `betting_app_game_state_${ARENA_ID}`;
const ARENA_ADMIN_STATE_KEY = `betting_app_local_admin_state_${ARENA_ID}`;

// Default game state
const defaultGameState = {
  teamAName: "Team A",
  teamBName: "Team B",
  teamAGames: 0,
  teamABalls: 0,
  teamBGames: 0,
  teamBBalls: 0,
  teamAHasBreak: true,
  gameLabel: "GAME*",
  currentGameNumber: 1,
  gameDescription: "",
  teamAQueue: [],
  teamBQueue: [],
  nextTeamAQueue: [],
  nextTeamBQueue: [],
  bookedBets: [],
  totalBookedAmount: 0,
  nextBookedBets: [],
  nextTotalBookedAmount: 0,
  betCounter: 1,
  colorIndex: 0,
  timerSeconds: 0,
  isTimerRunning: false,
  timerStartTime: null,
};

const defaultAdminState = {
  isAdminMode: false,
  isAgentMode: false,
};

const OnePocketArena = () => {
  const { 
    currentUser, 
    deductCredits, 
    addCredits, 
    getUserById, 
    addBetHistoryRecord, 
    incrementWins, 
    incrementLosses,
    clearBettingQueueReceipts,
    userBetReceipts,
    betHistory
  } = useUser();
  
  // Arena-specific state (isolated from main betting queue)
  const [gameState, setGameState] = useState(defaultGameState);
  const [localAdminState, setLocalAdminState] = useState(defaultAdminState);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLocked, setAdminLocked] = useState(true);
  const [isMatchStarted, setIsMatchStarted] = useState(false);
  const [gameDescription, setGameDescription] = useState("");
  
  // Sound effect for bet placement
  const { play: playSilverSound } = useSound('/silver.mp3', { volume: 0.8 });
  
  // Load arena-specific state from localStorage on mount
  useEffect(() => {
    const storedGameState = localStorage.getItem(ARENA_GAME_STATE_KEY);
    const storedAdminState = localStorage.getItem(ARENA_ADMIN_STATE_KEY);
    
    if (storedGameState) {
      try {
        setGameState(JSON.parse(storedGameState));
      } catch (e) {
        console.error('Error loading One Pocket Arena game state:', e);
      }
    }
    
    if (storedAdminState) {
      try {
        const parsed = JSON.parse(storedAdminState);
        setLocalAdminState({ ...parsed, isAdminMode: false });
      } catch (e) {
        console.error('Error loading One Pocket Arena admin state:', e);
      }
    }
  }, []);
  
  // Save arena-specific state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(ARENA_GAME_STATE_KEY, JSON.stringify(gameState));
  }, [gameState]);
  
  useEffect(() => {
    localStorage.setItem(ARENA_ADMIN_STATE_KEY, JSON.stringify(localAdminState));
  }, [localAdminState]);
  
  // Extract state from local game state
  const {
    teamAQueue,
    teamBQueue,
    nextTeamAQueue,
    nextTeamBQueue,
    bookedBets,
    totalBookedAmount,
    nextBookedBets,
    nextTotalBookedAmount,
    teamAGames,
    teamBGames,
    teamABalls,
    teamBBalls,
    teamAHasBreak,
    timerSeconds,
    isTimerRunning,
  } = gameState;
  
  const updateGameState = (updates: Partial<typeof defaultGameState>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  };
  
  const updateAdminState = (updates: Partial<typeof defaultAdminState>) => {
    setLocalAdminState(prev => ({ ...prev, ...updates }));
  };
  
  // Betting logic
  const placeBet = (side: 'A' | 'B', amount: number) => {
    if (!currentUser) {
      toast.error("Please log in to place a bet");
      return;
    }

    if (currentUser.sweepCoins < amount) {
      toast.error("Insufficient balance");
      return;
    }

    const newBet: Bet = {
      id: Math.random(),
      amount,
      color: null,
      booked: false,
      userId: currentUser.id,
      teamSide: side,
    };

    const newQueue = side === 'A' ? [...teamAQueue, newBet] : [...teamBQueue, newBet];
    
    updateGameState(
      side === 'A' 
        ? { teamAQueue: newQueue }
        : { teamBQueue: newQueue }
    );

    playSilverSound();
    toast.success(`${amount} Sweep Coins bet on Team ${side}`);
  };
  
  return (
    <div className="min-h-screen bg-black p-4 md:p-8 pt-32 relative">
      <div className="max-w-6xl mx-auto relative z-10">
        <Link to="/betting-queue">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to 9 Ball Arena
          </Button>
        </Link>
        
        <h1 className="text-4xl font-bold text-white mb-6">One Pocket Arena</h1>
        
        <UserWidgetsContainer currentUser={currentUser} />
        
        {/* Quick Bet Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
          {[10, 50, 100, 200].map(amount => (
            <div key={amount} className="flex gap-2">
              <Button 
                onClick={() => placeBet('A', amount)}
                className="flex-1"
                style={{ backgroundColor: '#95deff', color: '#000' }}
              >
                Team A ${amount}
              </Button>
              <Button 
                onClick={() => placeBet('B', amount)}
                className="flex-1"
                style={{ backgroundColor: '#fa1593', color: '#fff' }}
              >
                Team B ${amount}
              </Button>
            </div>
          ))}
        </div>
        
        {/* Betting Queues */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card style={{ borderColor: '#95deff', backgroundColor: '#052240' }}>
            <CardHeader>
              <CardTitle style={{ color: '#95deff' }}>Team A Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teamAQueue.map(bet => (
                  <div key={bet.id} className="text-white">
                    {bet.amount} coins from {getUserById(bet.userId)?.name || 'Unknown'}
                  </div>
                ))}
                {teamAQueue.length === 0 && <p className="text-gray-400">No bets</p>}
              </div>
            </CardContent>
          </Card>
          
          <Card style={{ borderColor: '#fa1593', backgroundColor: '#052240' }}>
            <CardHeader>
              <CardTitle style={{ color: '#fa1593' }}>Team B Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teamBQueue.map(bet => (
                  <div key={bet.id} className="text-white">
                    {bet.amount} coins from {getUserById(bet.userId)?.name || 'Unknown'}
                  </div>
                ))}
                {teamBQueue.length === 0 && <p className="text-gray-400">No bets</p>}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Booked Bets */}
        <BookedBetsReceipt 
          bookedBets={bookedBets}
          totalBookedAmount={totalBookedAmount}
        />
        
        {/* Scoreboard */}
        <ScoreBoard 
          isAdmin={isAdmin}
          onToggleAdmin={() => setIsAdmin(!isAdmin)}
          adminLocked={adminLocked}
          setAdminLocked={setAdminLocked}
        />
      </div>
    </div>
  );
};

export default OnePocketArena;
