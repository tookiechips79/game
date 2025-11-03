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
import { useGameState } from "@/contexts/GameStateContext";
import { Bet, BookedBet, ConfirmationState } from "@/types/user";
import { socketIOService } from "@/services/socketIOService";
import { useSound } from "@/hooks/use-sound";

// ============================================================================
// 9 BALL ARENA - DEFAULT BETTING QUEUE
// This arena syncs only with itself, not with the One Pocket Arena
// ============================================================================

const Index = () => {
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
  
  const { gameState, updateGameState, isAdmin, localAdminState, updateLocalAdminState, startTimer, pauseTimer, resetTimer, setTimer, resetTimerOnMatchStart, resetTimerOnGameWin } = useGameState();
  
  // Sound effect for bet placement
  const { play: playSilverSound } = useSound('/silver.mp3', { volume: 0.8 });
  
  // Extract state from gameState context
  const {
    teamAQueue,
    teamBQueue,
    nextTeamAQueue,
    nextTeamBQueue,
    bookedBets,
    totalBookedAmount,
    nextBookedBets,
    nextTotalBookedAmount,
    teamAName,
    teamBName,
    teamAGames,
    teamABalls,
    teamBGames,
    teamBBalls,
    teamAHasBreak,
    gameLabel,
    currentGameNumber,
    gameDescription,
    betCounter,
    colorIndex,
    timerSeconds,
    isTimerRunning,
    timerStartTime
  } = gameState;

  // Extract local admin state (not synchronized)
  const { isAdminMode, isAgentMode } = localAdminState;
  
  const [betId, setBetId] = useState<string>("");
  
  // Track admin lock state - when true, scoreboard and controls are disabled
  const [adminLocked, setAdminLocked] = useState<boolean>(true);
  
  // Ref to access CompactAdminWidget's openModal method
  const adminModalRef = useRef<{ openModal: () => void }>(null);
  
  const betColors = ["#00FF00", "#00FFFF", "#FF00FF", "#FFFF00", "#1EAEDB"];
  
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    team: '',
    teamSide: null,
    amount: 0,
    isNextGame: false
  });

  // Log betting queue changes for debugging
  useEffect(() => {
    console.log(`💰 [BET QUEUE] Team A Queue: ${teamAQueue.length} bets`, teamAQueue);
    console.log(`💰 [BET QUEUE] Team B Queue: ${teamBQueue.length} bets`, teamBQueue);
  }, [teamAQueue, teamBQueue]);

  // Listen for sound events from other clients
  useEffect(() => {
    const handlePlaySound = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { soundType } = customEvent.detail;
      console.log(`🔊 [SOUND EVENT] Playing sound: ${soundType}`);
      if (soundType === "placeBet") {
        playSilverSound();
      }
    };

    window.addEventListener('playSound', handlePlaySound);
    return () => {
      window.removeEventListener('playSound', handlePlaySound);
    };
  }, [playSilverSound]);

  const generateBetId = () => {
    // Generate a 7-digit unique ID using counter + random number
    const random = Math.floor(Math.random() * 1000);
    const paddedCounter = betCounter.toString().padStart(4, '0');
    const newId = parseInt(`${paddedCounter}${random.toString().padStart(3, '0')}`);
    updateGameState({ betCounter: betCounter + 1 });
    return newId;
  };

  const playSound = (soundType: string) => {
    if (soundType === "placeBet") {
      playSilverSound();
      // Broadcast sound event to all connected clients
      socketIOService.emitSoundEvent("placeBet");
    }
  };

  const toggleAdminMode = () => {
    // Password is now handled in AdminWidget, so we just toggle the state
    updateLocalAdminState({ isAdminMode: !isAdminMode });
  };

  const toggleAgentMode = () => {
    updateLocalAdminState({ isAgentMode: !isAgentMode });
    if (!isAgentMode) {
      toast.success("Agent Mode Activated", {
        description: "You now have access to game controls",
        className: "custom-toast-success",
      });
    } else {
      toast.info("Agent Mode Deactivated", {
        className: "custom-toast-success",
      });
    }
  };

  const moveBetsToNextGame = () => {
    if (!teamAQueue.length && !teamBQueue.length) {
      toast.error("No Bets to Move", {
        description: "There are no current bets to move to the next game",
        className: "custom-toast-error",
      });
      return;
    }

    updateGameState({
      nextTeamAQueue: [...nextTeamAQueue, ...teamAQueue],
      nextTeamBQueue: [...nextTeamBQueue, ...teamBQueue],
      nextBookedBets: [...nextBookedBets, ...bookedBets],
      nextTotalBookedAmount: nextTotalBookedAmount + totalBookedAmount,
      teamAQueue: [],
      teamBQueue: [],
      bookedBets: [],
      totalBookedAmount: 0
    });

    toast.success("Bets Moved to Next Game", {
      description: "All current bets have been moved to the next game",
      className: "custom-toast-success",
    });
  };

  const moveBetsToCurrentGame = () => {
    if (!nextTeamAQueue.length && !nextTeamBQueue.length) {
      toast.error("No Bets to Move", {
        description: "There are no next-game bets to move to the current game",
        className: "custom-toast-error",
      });
      return;
    }

    updateGameState({
      teamAQueue: [...teamAQueue, ...nextTeamAQueue],
      teamBQueue: [...teamBQueue, ...nextTeamBQueue],
      bookedBets: [...bookedBets, ...nextBookedBets],
      totalBookedAmount: totalBookedAmount + nextTotalBookedAmount,
      nextTeamAQueue: [],
      nextTeamBQueue: [],
      nextBookedBets: [],
      nextTotalBookedAmount: 0
    });

    toast.success("Bets Moved to Current Game", {
      description: "All next-game bets have been moved to the current game",
      className: "custom-toast-success",
    });
  };

  const handleTeamAWin = (duration: number) => {
    console.log('🏆 [handleTeamAWin] WIN BUTTON CLICKED FOR TEAM A!');
    // Pause timer when game is won (don't reset it)
    pauseTimer();
    
    toast.success(`${teamAName} Wins!`, {
      description: `${teamAName} has won a game`,
      className: "custom-toast-success",
    });

    // Process bets FIRST before incrementing game counter
    processBetsForGameWin('A', duration);
    
    // Increment game counter and game number AFTER bets are processed
    // Using 500ms to ensure all bet processing is complete
    setTimeout(() => {
      console.log('🏆 [handleTeamAWin] Incrementing game counter after bet processing');
      console.log(`   Previous: teamAGames=${teamAGames}, currentGameNumber=${currentGameNumber}`);
      console.log(`   About to call updateGameState with: { teamAGames: ${teamAGames + 1}, currentGameNumber: ${currentGameNumber + 1} }`);
      updateGameState({
        teamAGames: teamAGames + 1,
        teamABalls: 0,
        teamBBalls: 0,
        teamAHasBreak: !teamAHasBreak,
        currentGameNumber: currentGameNumber + 1
      });
      console.log(`   Updated: teamAGames=${teamAGames + 1}, currentGameNumber=${currentGameNumber + 1}`);
    }, 500);
    
    // Timer will be controlled by admin (pause/resume/reset)
    
    playSound("win");
  };

  const handleTeamBWin = (duration: number) => {
    console.log('🏆 [handleTeamBWin] WIN BUTTON CLICKED FOR TEAM B!');
    // Pause timer when game is won (don't reset it)
    pauseTimer();
    
    toast.success(`${teamBName} Wins!`, {
      description: `${teamBName} has won a game`,
      className: "custom-toast-success",
    });

    // Process bets FIRST before incrementing game counter
    processBetsForGameWin('B', duration);
    
    // Increment game counter and game number AFTER bets are processed
    // Using 500ms to ensure all bet processing is complete
    setTimeout(() => {
      console.log('🏆 [handleTeamBWin] Incrementing game counter after bet processing');
      console.log(`   Previous: teamBGames=${teamBGames}, currentGameNumber=${currentGameNumber}`);
      console.log(`   About to call updateGameState with: { teamBGames: ${teamBGames + 1}, currentGameNumber: ${currentGameNumber + 1} }`);
      updateGameState({
        teamBGames: teamBGames + 1,
        teamABalls: 0,
        teamBBalls: 0,
        teamAHasBreak: !teamAHasBreak,
        currentGameNumber: currentGameNumber + 1
      });
      console.log(`   Updated: teamBGames=${teamBGames + 1}, currentGameNumber=${currentGameNumber + 1}`);
    }, 500);
    
    // Timer will be controlled by admin (pause/resume/reset)
    
    playSound("win");
  };
  
  const processBetsForGameWin = (winningTeam: 'A' | 'B', duration: number) => {
    // Include ALL bets (both booked and unbooked) in game history for accurate tracking
    const teamABets = teamAQueue.map(bet => {
      const user = getUserById(bet.userId);
      return {
        userId: bet.userId,
        userName: bet.userName || user?.name || 'User',
        amount: bet.amount,
        won: winningTeam === 'A',
        booked: bet.booked
      };
    });
    
    const teamBBets = teamBQueue.map(bet => {
      const user = getUserById(bet.userId);
      return {
        userId: bet.userId,
        userName: bet.userName || user?.name || 'User',
        amount: bet.amount,
        won: winningTeam === 'B',
        booked: bet.booked
      };
    });
    
    // Calculate accurate total amount for this specific game
    const gameTotalAmount = [...teamABets, ...teamBBets].reduce((total, bet) => total + bet.amount, 0);
    
    const gameHistoryRecord = {
      gameNumber: currentGameNumber,
      teamAName,
      teamBName,
      teamAScore: winningTeam === 'A' ? 1 : 0,
      teamBScore: winningTeam === 'B' ? 1 : 0,
      winningTeam,
      teamABalls,
      teamBBalls,
      breakingTeam: (teamAHasBreak ? 'A' : 'B') as 'A' | 'B',
      duration,
      bets: {
        teamA: teamABets,
        teamB: teamBBets
      },
      totalAmount: gameTotalAmount
    };
    
    addBetHistoryRecord(gameHistoryRecord);
    
    if (bookedBets.length > 0) {
      let totalProcessed = 0;
      
      bookedBets.forEach(bet => {
        const userA = getUserById(bet.userIdA);
        const userB = getUserById(bet.userIdB);
        
        if (userA && userB) {
          totalProcessed += bet.amount * 2;
          
          if (winningTeam === 'A') {
            addCredits(userA.id, bet.amount * 2);
            incrementWins(userA.id);
            incrementLosses(userB.id);
            
            toast.success(`${userA.name} Won ${bet.amount} COINS`, {
              description: `Bet on ${teamAName} paid off!`,
              className: "custom-toast-success",
            });
            
            toast.error(`${userB.name} Lost ${bet.amount} COINS`, {
              description: `Bet on ${teamBName} didn't win.`,
              className: "custom-toast-error",
            });
          } else {
            addCredits(userB.id, bet.amount * 2);
            incrementWins(userB.id);
            incrementLosses(userA.id);
            
            toast.success(`${userB.name} Won ${bet.amount} COINS`, {
              description: `Bet on ${teamBName} paid off!`,
              className: "custom-toast-success",
            });
            
            toast.error(`${userA.name} Lost ${bet.amount} COINS`, {
              description: `Bet on ${teamAName} didn't win.`,
              className: "custom-toast-error",
            });
          }
        }
      });
      
      console.log(`Total matched bets processed: ${totalProcessed} COINS`);
    }
    
    const nextMatchedBetsA = nextTeamAQueue.filter(bet => bet.booked);
    const nextMatchedBetsB = nextTeamBQueue.filter(bet => bet.booked);
    const nextMatchedBooked = [...nextBookedBets];
    const nextTotal = nextTotalBookedAmount;
    
    updateGameState({
      teamAQueue: [],
      teamBQueue: [],
      bookedBets: [],
      totalBookedAmount: 0,
      nextTeamAQueue: [],
      nextTeamBQueue: [],
      nextBookedBets: [],
      nextTotalBookedAmount: 0
    });
    
    setTimeout(() => {
      updateGameState({
        teamAQueue: nextMatchedBetsA,
        teamBQueue: nextMatchedBetsB,
        bookedBets: nextMatchedBooked,
        totalBookedAmount: nextTotal
      });
      
      if (nextMatchedBetsA.length > 0 || nextMatchedBetsB.length > 0) {
        toast.success("Next Game Matched Bets Moved to Current Game", {
          description: "All matched bets for the next game are now active for the current game",
          className: "custom-toast-success",
        });
      }
    }, 100);
    
    updateGameState({ betCounter: 1 });
    
    toast.success("All Bets Processed", {
      description: "A new betting round can begin",
      className: "custom-toast-success",
    });
    
    // NOTE: Game history is already emitted from addBetHistoryRecord(), don't duplicate here
    // Only emit the bet state clearing so other clients clear their queues
    console.log('📤 [processBetsForGameWin] Emitting cleared bet queues to all clients');
    try {
      socketIOService.emitBetUpdate({
        teamAQueue: [],
        teamBQueue: [],
        bookedBets: [],
        totalBookedAmount: 0,
        nextGameBets: [],
        nextTeamAQueue: [],
        nextTeamBQueue: [],
        nextTotalBookedAmount: 0
      });
    } catch (err) {
      console.error('❌ Error emitting bet update:', err);
    }
  };

  const deleteUnmatchedBets = () => {
    const unmatchedBetsA = teamAQueue.filter(bet => !bet.booked);
    const unmatchedBetsB = teamBQueue.filter(bet => !bet.booked);
    const allUnmatchedBets = [...unmatchedBetsA, ...unmatchedBetsB];
    
    let totalRefunded = 0;
    
    allUnmatchedBets.forEach(bet => {
      const user = getUserById(bet.userId);
      if (user) {
        addCredits(user.id, bet.amount);
        totalRefunded += bet.amount;
        
        toast.info(`Returned ${bet.amount} COINS to ${user.name}`, {
          description: `Unmatched bet #${bet.id} refunded`,
          className: "custom-toast-success",
        });
      }
    });
    
    const unmatchedNextBetsA = nextTeamAQueue.filter(bet => !bet.booked);
    const unmatchedNextBetsB = nextTeamBQueue.filter(bet => !bet.booked);
    const allUnmatchedNextBets = [...unmatchedNextBetsA, ...unmatchedNextBetsB];
    
    allUnmatchedNextBets.forEach(bet => {
      const user = getUserById(bet.userId);
      if (user) {
        addCredits(user.id, bet.amount);
        totalRefunded += bet.amount;
        
        toast.info(`Returned ${bet.amount} COINS to ${user.name}`, {
          description: `Unmatched next game bet #${bet.id} refunded`,
          className: "custom-toast-success",
        });
      }
    });
    
    const matchedBetsA = teamAQueue.filter(bet => bet.booked);
    const matchedBetsB = teamBQueue.filter(bet => bet.booked);
    
    const nextMatchedBetsA = nextTeamAQueue.filter(bet => bet.booked);
    const nextMatchedBetsB = nextTeamBQueue.filter(bet => bet.booked);
    
    updateGameState({
      teamAQueue: matchedBetsA,
      teamBQueue: matchedBetsB,
      nextTeamAQueue: nextMatchedBetsA,
      nextTeamBQueue: nextMatchedBetsB
    });
    
    const totalUnmatchedBets = allUnmatchedBets.length + allUnmatchedNextBets.length;
    if (totalUnmatchedBets > 0) {
      console.log(`Refunded ${totalUnmatchedBets} unmatched bets for a total of ${totalRefunded} COINS`);
      toast.success(`${totalUnmatchedBets} Unmatched Bets Refunded (${totalRefunded} COINS)`, {
        description: "COINS have been returned to users and unmatched bets removed",
        className: "custom-toast-success",
      });
    } else {
      toast.info("No Unmatched Bets Found", {
        description: "All current bets are already matched",
        className: "custom-toast-success",
      });
    }
  };
  
  const handleConfirmBet = () => {
    if (!confirmation.teamSide || confirmation.amount <= 0) return;
    
    if (!currentUser) {
      toast.error("No User Selected", {
        description: "Please select or create a user first",
        duration: 4500,
        className: "custom-toast-error",
      });
      closeBetConfirmation();
      return;
    }
    
    if (!deductCredits(currentUser.id, confirmation.amount)) {
      closeBetConfirmation();
      return;
    }
    
    playSound("placeBet");

    const betId = generateBetId();
    const bet: Bet = { 
      id: betId, 
      amount: confirmation.amount, 
      color: null, 
      booked: false,
      userId: currentUser.id,
      userName: currentUser.name,
      teamSide: confirmation.teamSide
    };

    if (confirmation.isNextGame) {
      if (confirmation.teamSide === 'A') {
        const updatedAQueue = [...nextTeamAQueue, bet];
        updateGameState({ nextTeamAQueue: updatedAQueue });
        bookNextGameBets(updatedAQueue, nextTeamBQueue);
      } else {
        const updatedBQueue = [...nextTeamBQueue, bet];
        updateGameState({ nextTeamBQueue: updatedBQueue });
        bookNextGameBets(nextTeamAQueue, updatedBQueue);
      }
    } else {
      if (confirmation.teamSide === 'A') {
        const updatedAQueue = [...teamAQueue, bet];
        console.log('🎲 [placeBet] Placing bet on Team A:', bet);
        console.log('🎲 [placeBet] New Team A Queue length:', updatedAQueue.length);
        updateGameState({ teamAQueue: updatedAQueue });
        bookBets(updatedAQueue, teamBQueue);
      } else {
        const updatedBQueue = [...teamBQueue, bet];
        console.log('🎲 [placeBet] Placing bet on Team B:', bet);
        console.log('🎲 [placeBet] New Team B Queue length:', updatedBQueue.length);
        updateGameState({ teamBQueue: updatedBQueue });
        bookBets(teamAQueue, updatedBQueue);
      }
    }
    
    // Show success message
    toast.success("Bet Placed!", {
      description: `${confirmation.amount} COINS bet on ${confirmation.teamSide === 'A' ? teamAName : teamBName}`,
      duration: 2000,
      className: "custom-toast-success",
    });
    
    closeBetConfirmation();
  };

  const showBetConfirmation = (team: 'A' | 'B', amount: number, isNextGame: boolean = false) => {
    if (!currentUser) {
      toast.error("No User Selected", {
        description: "Please select or create a user first",
        duration: 4500,
        className: "custom-toast-error",
      });
      return;
    }

    
    if (currentUser.credits === 0) {
      toast.error("Zero Credits", {
        description: "You have zero credits. Please ask admin to reload your account.",
        icon: <Wallet className="h-5 w-5 text-red-500" />,
        duration: 5000,
        className: "custom-toast-error",
      });
      return;
    }
    
    if (currentUser.credits < amount) {
      toast.error("Insufficient Credits", {
        description: `You need ${amount} credits to place this bet. Please ask admin to reload your account.`,
        icon: <Wallet className="h-5 w-5 text-red-500" />,
        duration: 5000,
        className: "custom-toast-error",
      });
      return;
    }
    
    // Directly place the bet without confirmation dialog
    const betId = generateBetId();
    const bet: Bet = { 
      id: betId, 
      amount: amount, 
      color: null, 
      booked: false,
      userId: currentUser.id,
      teamSide: team
    };

    playSound("placeBet");

    if (isNextGame) {
      if (team === 'A') {
        const updatedAQueue = [...nextTeamAQueue, bet];
        console.log('🎲 [placeBet] Adding bet to nextTeamAQueue:', bet, 'New queue length:', updatedAQueue.length);
        bookNextGameBets(updatedAQueue, nextTeamBQueue);
      } else {
        const updatedBQueue = [...nextTeamBQueue, bet];
        console.log('🎲 [placeBet] Adding bet to nextTeamBQueue:', bet, 'New queue length:', updatedBQueue.length);
        bookNextGameBets(nextTeamAQueue, updatedBQueue);
      }
    } else {
      if (team === 'A') {
        const updatedAQueue = [...teamAQueue, bet];
        console.log('🎲 [placeBet] Adding bet to teamAQueue:', bet, 'New queue length:', updatedAQueue.length);
        bookBets(updatedAQueue, teamBQueue);
      } else {
        const updatedBQueue = [...teamBQueue, bet];
        console.log('🎲 [placeBet] Adding bet to teamBQueue:', bet, 'New queue length:', updatedBQueue.length);
        bookBets(teamAQueue, updatedBQueue);
      }
    }

    // Deduct credits
    deductCredits(currentUser.id, amount);

  };

  const closeBetConfirmation = () => {
    setConfirmation({
      isOpen: false,
      team: '',
      teamSide: null,
      amount: 0,
      isNextGame: false
    });
  };

  const bookBets = (aQueue: Bet[] = teamAQueue, bQueue: Bet[] = teamBQueue) => {
    const newAQueue = [...aQueue];
    const newBQueue = [...bQueue];
    let newBookedBets = [...bookedBets];
    let newTotalAmount = totalBookedAmount;
    let newColorIndex = colorIndex;

    for (let i = 0; i < newAQueue.length; i++) {
      if (!newAQueue[i].booked) {
        const matchIndex = newBQueue.findIndex(bBet => !bBet.booked && bBet.amount === newAQueue[i].amount);
        
        if (matchIndex !== -1) {
          const assignedColor = betColors[newColorIndex % betColors.length];
          
          // Determine which bet was placed first (lower ID = placed first)
          // Use the first-placed bet's ID as the master ID
          const teamAId = newAQueue[i].id;
          const teamBId = newBQueue[matchIndex].id;
          const masterId = teamAId < teamBId ? teamAId : teamBId;
          
          newAQueue[i].color = assignedColor;
          newAQueue[i].booked = true;
          newBQueue[matchIndex].color = assignedColor;
          newBQueue[matchIndex].booked = true;
          
          // Make both bets use the master ID (first-placed bet's ID)
          newAQueue[i].id = masterId;
          newBQueue[matchIndex].id = masterId;
          newColorIndex++;

          newBookedBets.push({ 
            idA: masterId, 
            idB: masterId, // Use the same ID for both (first-placed bet's ID)
            amount: newAQueue[i].amount,
            userIdA: newAQueue[i].userId,
            userIdB: newBQueue[matchIndex].userId
          });
          
          newTotalAmount += newAQueue[i].amount;
          
          // Bet booked successfully - no toast notification
          
          playSound("match");
        }
      }
    }

    updateGameState({
      teamAQueue: newAQueue,
      teamBQueue: newBQueue,
      bookedBets: newBookedBets,
      totalBookedAmount: newTotalAmount,
      colorIndex: newColorIndex
    });
  };

  const bookNextGameBets = (aQueue: Bet[] = nextTeamAQueue, bQueue: Bet[] = nextTeamBQueue) => {
    const newAQueue = [...aQueue];
    const newBQueue = [...bQueue];
    let newBookedBets = [...nextBookedBets];
    let newTotalAmount = nextTotalBookedAmount;
    let newColorIndex = colorIndex;

    for (let i = 0; i < newAQueue.length; i++) {
      if (!newAQueue[i].booked) {
        const matchIndex = newBQueue.findIndex(bBet => !bBet.booked && bBet.amount === newAQueue[i].amount);
        
        if (matchIndex !== -1) {
          const assignedColor = betColors[newColorIndex % betColors.length];
          
          // Determine which bet was placed first (lower ID = placed first)
          // Use the first-placed bet's ID as the master ID
          const teamAId = newAQueue[i].id;
          const teamBId = newBQueue[matchIndex].id;
          const masterId = teamAId < teamBId ? teamAId : teamBId;
          
          newAQueue[i].color = assignedColor;
          newAQueue[i].booked = true;
          newBQueue[matchIndex].color = assignedColor;
          newBQueue[matchIndex].booked = true;
          
          // Make both bets use the master ID (first-placed bet's ID)
          newAQueue[i].id = masterId;
          newBQueue[matchIndex].id = masterId;
          newColorIndex++;

          newBookedBets.push({ 
            idA: masterId, 
            idB: masterId, // Use the same ID for both (first-placed bet's ID)
            amount: newAQueue[i].amount,
            userIdA: newAQueue[i].userId,
            userIdB: newBQueue[matchIndex].userId
          });
          
          newTotalAmount += newAQueue[i].amount;
          
          // Next game bet booked successfully - no toast notification
          
          playSound("match");
        }
      }
    }

    updateGameState({
      nextTeamAQueue: newAQueue,
      nextTeamBQueue: newBQueue,
      nextBookedBets: newBookedBets,
      nextTotalBookedAmount: newTotalAmount,
      colorIndex: newColorIndex
    });
  };

  const deleteOpenBet = (betId: number, isNextGame: boolean = false) => {
    if (!currentUser) {
      toast.error("Cannot Delete Bet", {
        description: "You must be logged in to delete bets",
        duration: 3000,
        className: "custom-toast-error",
      });
      return;
    }

    let betDeleted = false;
    let deletedBet: Bet | undefined;
    
    if (isNextGame) {
      // Check next game queues
      deletedBet = nextTeamAQueue.find(bet => bet.id === betId);
      if (deletedBet && !deletedBet.booked && deletedBet.userId === currentUser.id) {
        const newNextTeamAQueue = nextTeamAQueue.filter(bet => bet.id !== betId);
        updateGameState({ nextTeamAQueue: newNextTeamAQueue });
        betDeleted = true;
      }
      
      if (!betDeleted) {
        deletedBet = nextTeamBQueue.find(bet => bet.id === betId);
        if (deletedBet && !deletedBet.booked && deletedBet.userId === currentUser.id) {
          const newNextTeamBQueue = nextTeamBQueue.filter(bet => bet.id !== betId);
          updateGameState({ nextTeamBQueue: newNextTeamBQueue });
          betDeleted = true;
        }
      }
    } else {
      // Check current game queues
      deletedBet = teamAQueue.find(bet => bet.id === betId);
      if (deletedBet && !deletedBet.booked && deletedBet.userId === currentUser.id) {
        const newTeamAQueue = teamAQueue.filter(bet => bet.id !== betId);
        updateGameState({ teamAQueue: newTeamAQueue });
        betDeleted = true;
      }
      
      if (!betDeleted) {
        deletedBet = teamBQueue.find(bet => bet.id === betId);
        if (deletedBet && !deletedBet.booked && deletedBet.userId === currentUser.id) {
          const newTeamBQueue = teamBQueue.filter(bet => bet.id !== betId);
          updateGameState({ teamBQueue: newTeamBQueue });
          betDeleted = true;
        }
      }
    }
    
    if (betDeleted && deletedBet) {
      // Refund credits to the user
      addCredits(deletedBet.userId, deletedBet.amount, true);
      
      // Bet deleted successfully - no toast notification
    } else {
      toast.error("Cannot Delete Bet", {
        description: "Bet not found, already booked/matched, or you don't have permission to delete this bet",
        duration: 3000,
        className: "custom-toast-error",
      });
    }
  };

  const deleteBet = () => {
    if (!betId) {
      toast.error("Error", {
        description: "Please enter a valid Bet ID",
        className: "custom-toast-error",
      });
      return;
    }

    const id = parseInt(betId);
    let betDeleted = false;
    
    const deletedBetA = teamAQueue.find(bet => bet.id === id);
    if (deletedBetA) {
      const newTeamAQueue = teamAQueue.filter(bet => bet.id !== id);
      updateGameState({ teamAQueue: newTeamAQueue });
      
      if (deletedBetA.booked) {
        const matchedBookedBet = bookedBets.find(bookedBet => bookedBet.idA === id);
        if (matchedBookedBet) {
          const newTeamBQueue = teamBQueue.map(bet => {
            if (bet.id === matchedBookedBet.idB) {
              return { ...bet, color: null, booked: false };
            }
            return bet;
          });
          const newBookedBets = bookedBets.filter(bookedBet => bookedBet.idA !== id);
          
          updateGameState({
            teamBQueue: newTeamBQueue,
            bookedBets: newBookedBets,
            totalBookedAmount: totalBookedAmount - matchedBookedBet.amount
          });
        }
      }
      
      betDeleted = true;
    }
    
    const deletedBetB = teamBQueue.find(bet => bet.id === id);
    if (deletedBetB && !betDeleted) {
      const newTeamBQueue = teamBQueue.filter(bet => bet.id !== id);
      updateGameState({ teamBQueue: newTeamBQueue });
      
      if (deletedBetB.booked) {
        const matchedBookedBet = bookedBets.find(bookedBet => bookedBet.idB === id);
        if (matchedBookedBet) {
          const newTeamAQueue = teamAQueue.map(bet => {
            if (bet.id === matchedBookedBet.idA) {
              return { ...bet, color: null, booked: false };
            }
            return bet;
          });
          const newBookedBets = bookedBets.filter(bookedBet => bookedBet.idB !== id);
          
          updateGameState({
            teamAQueue: newTeamAQueue,
            bookedBets: newBookedBets,
            totalBookedAmount: totalBookedAmount - matchedBookedBet.amount
          });
        }
      }
      
      betDeleted = true;
    }
    
    if (!betDeleted) {
      const deletedNextBetA = nextTeamAQueue.find(bet => bet.id === id);
      if (deletedNextBetA) {
        const newNextTeamAQueue = nextTeamAQueue.filter(bet => bet.id !== id);
        updateGameState({ nextTeamAQueue: newNextTeamAQueue });
        
        if (deletedNextBetA.booked) {
          const matchedBookedBet = nextBookedBets.find(bookedBet => bookedBet.idA === id);
          if (matchedBookedBet) {
            const newNextTeamBQueue = nextTeamBQueue.map(bet => {
              if (bet.id === matchedBookedBet.idB) {
                return { ...bet, color: null, booked: false };
              }
              return bet;
            });
            const newNextBookedBets = nextBookedBets.filter(bookedBet => bookedBet.idA !== id);
            
            updateGameState({
              nextTeamBQueue: newNextTeamBQueue,
              nextBookedBets: newNextBookedBets,
              nextTotalBookedAmount: nextTotalBookedAmount - matchedBookedBet.amount
            });
          }
        }
        
        betDeleted = true;
      }
      
      const deletedNextBetB = nextTeamBQueue.find(bet => bet.id === id);
      if (deletedNextBetB && !betDeleted) {
        const newNextTeamBQueue = nextTeamBQueue.filter(bet => bet.id !== id);
        updateGameState({ nextTeamBQueue: newNextTeamBQueue });
        
        if (deletedNextBetB.booked) {
          const matchedBookedBet = nextBookedBets.find(bookedBet => bookedBet.idB === id);
          if (matchedBookedBet) {
            const newNextTeamAQueue = nextTeamAQueue.map(bet => {
              if (bet.id === matchedBookedBet.idA) {
                return { ...bet, color: null, booked: false };
              }
              return bet;
            });
            const newNextBookedBets = nextBookedBets.filter(bookedBet => bookedBet.idB !== id);
            
            updateGameState({
              nextTeamAQueue: newNextTeamAQueue,
              nextBookedBets: newNextBookedBets,
              nextTotalBookedAmount: nextTotalBookedAmount - matchedBookedBet.amount
            });
          }
        }
        
        betDeleted = true;
      }
    }
    
    if (betDeleted) {
      // Bet deleted successfully - no toast notification
      playSound("delete");
      setBetId("");
    } else {
      toast.error("Error", {
        description: `No bet found with ID ${id}`,
        className: "custom-toast-error",
      });
    }
  };

  const countBookedBets = () => {
    return bookedBets.length;
  };

  const countNextGameBookedBets = () => {
    return nextBookedBets.length;
  };

  const [userBetAmounts, setUserBetAmounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    // Set page title to identify this as 9 Ball Arena
    document.title = '9 Ball Arena - Betting Queue';
    
    const newUserBetAmounts = new Map<string, number>();
    
    teamAQueue.forEach(bet => {
      const current = newUserBetAmounts.get(bet.userId) || 0;
      newUserBetAmounts.set(bet.userId, current + bet.amount);
    });
    
    teamBQueue.forEach(bet => {
      const current = newUserBetAmounts.get(bet.userId) || 0;
      newUserBetAmounts.set(bet.userId, current + bet.amount);
    });
    
    nextTeamAQueue.forEach(bet => {
      const current = newUserBetAmounts.get(bet.userId) || 0;
      newUserBetAmounts.set(bet.userId, current + bet.amount);
    });
    
    nextTeamBQueue.forEach(bet => {
      const current = newUserBetAmounts.get(bet.userId) || 0;
      newUserBetAmounts.set(bet.userId, current + bet.amount);
    });
    
    setUserBetAmounts(newUserBetAmounts);
  }, [teamAQueue, teamBQueue, nextTeamAQueue, nextTeamBQueue]);

  const handleTeamABallsChange = (balls: number) => {
    updateGameState({ teamABalls: balls });
  };
  
  const handleTeamBBallsChange = (balls: number) => {
    updateGameState({ teamBBalls: balls });
  };

  const handleTeamAGamesChange = (games: number) => {
    updateGameState({ teamAGames: games });
  };
  
  const handleTeamBGamesChange = (games: number) => {
    updateGameState({ teamBGames: games });
  };


  return (
    <div className="min-h-screen bg-black p-4 md:p-8 pt-32 relative">
      
      <div className="max-w-full mx-auto relative z-10">
        <UserWidgetsContainer 
          userBetAmounts={userBetAmounts} 
          bookedBets={bookedBets}
          nextBookedBets={nextBookedBets}
          isAdmin={isAdminMode}
          isAgent={isAgentMode}
          toggleAdminMode={toggleAdminMode}
          toggleAgentMode={toggleAgentMode}
          teamAQueue={teamAQueue}
          teamBQueue={teamBQueue}
          teamAName={teamAName}
          teamBName={teamBName}
          teamABalls={teamABalls}
          teamBBalls={teamBBalls}
        />
        
        <div className="mb-4 flex justify-between items-center">
          <Link to="/" className="inline-flex items-center transition-colors" style={{ color: '#95deff' }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </div>
        
        <div className="w-full max-w-md mx-auto mb-8">
          <img 
            src="/lovable-uploads/4dfcf9c9-cbb9-4a75-94ab-bcdb38a8091e.png" 
            alt="Game Bird Logo" 
            className="w-full h-40 object-contain drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]" 
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6" style={{ color: '#95deff', textShadow: '0 0 15px rgba(149, 222, 255, 0.8)' }}>Rotation Arena</h1>

        <UserCreditSystem isAdmin={isAdminMode} />

        {/* Game Info Window */}
        <GameInfoWindow 
          teamAQueue={teamAQueue}
          teamBQueue={teamBQueue}
          nextTeamAQueue={nextTeamAQueue}
          nextTeamBQueue={nextTeamBQueue}
        />

        {/* Realtime Scoreboard Header */}
        <div className="text-center mb-6">
          <h2 className="font-bold text-2xl uppercase tracking-wider" style={{ color: '#95deff' }}>
            REALTIME SCOREBOARD
          </h2>
        </div>

        <GameDescription 
          isAdmin={isAdminMode || isAgentMode} 
          initialDescription={gameDescription} 
          onDescriptionChange={(desc) => updateGameState({ gameDescription: desc })} 
        />

        <ScoreBoard 
          teamAName={teamAName}
          teamAGames={teamAGames}
          teamABalls={teamABalls}
          teamBName={teamBName}
          teamBGames={teamBGames}
          teamBBalls={teamBBalls}
          teamAHasBreak={teamAHasBreak}
          isAdmin={isAdminMode}
          isAgent={isAgentMode}
          adminLocked={adminLocked}
          setAdminLocked={setAdminLocked}
          adminModalRef={adminModalRef}
          gameLabel={gameLabel}
          currentGameNumber={currentGameNumber}
          onTeamANameChange={(name) => updateGameState({ teamAName: name })}
          onTeamBNameChange={(name) => updateGameState({ teamBName: name })}
          onBreakChange={(hasBreak) => updateGameState({ teamAHasBreak: hasBreak })}
          onTeamAGameWin={handleTeamAWin}
          onTeamBGameWin={handleTeamBWin}
          onGameLabelChange={(label) => updateGameState({ gameLabel: label })}
          onCurrentGameNumberChange={(num) => updateGameState({ currentGameNumber: num })}
          onTeamABallsChange={handleTeamABallsChange}
          onTeamBBallsChange={handleTeamBBallsChange}
          onTeamAGamesChange={handleTeamAGamesChange}
          onTeamBGamesChange={handleTeamBGamesChange}
          timerSeconds={timerSeconds}
          isTimerRunning={isTimerRunning}
          onTimerStart={startTimer}
          onTimerPause={pauseTimer}
          onTimerReset={resetTimer}
          onToggleAdmin={toggleAdminMode}
          onToggleAgent={toggleAgentMode}
          teamAPlayerImageUrl="/lovable-uploads/alex.png"
          teamBPlayerImageUrl="/lovable-uploads/shane.png"
          showBallCount={false}
        />

        {/* Game History Window */}
        <GameHistoryWindow />

        {/* Betting Queue Header */}
        <div className="text-center mb-6">
          <h2 className="font-bold text-2xl uppercase tracking-wider" style={{ color: '#95deff' }}>
            BETTING QUEUE
          </h2>
        </div>

        <div className="mb-8">
          <Card className="glass-card backdrop-blur-sm shadow-lg rounded-2xl transition-all duration-300 mb-4 hover:shadow-[0_0_15px_rgba(250,21,147,0.3)]" style={{ borderColor: '#fa1593', backgroundColor: '#004b6b' }}>
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="p-3 rounded-2xl mr-4" style={{ backgroundColor: '#fa1593' }}>
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white">Game {currentGameNumber} Bets</h3>
                  <p style={{ color: '#95deff' }}>{countBookedBets()} booked bets</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="p-3 rounded-2xl mr-4" style={{ backgroundColor: '#fa1593' }}>
                  <Coins className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white">Total Booked</h3>
                  <p className="text-2xl font-bold text-white">
                    <NumericAnimation 
                      value={totalBookedAmount} 
                      className="text-4xl transition-all duration-500"
                      withGlow={true}
                    /> <span>COINS</span>
                  </p>
                </div>
              </div>
              
              {isAgentMode && (
                <Button 
                  variant="outline" 
                  className="hover:text-white"
                  style={{ borderColor: '#fa1593', color: '#fa1593' }}
                  onClick={moveBetsToNextGame}
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Move to Next Game
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="glass-card overflow-hidden shadow-lg transform transition-all rounded-2xl" style={{ backgroundColor: '#052240', boxShadow: '0 0 30px rgba(149, 222, 255, 0.8)' }}>
              <CardHeader className="p-4 rounded-t-2xl" style={{ background: 'linear-gradient(to right, #95deff, #004b6b)' }}>
                <CardTitle className="text-center text-2xl text-white">{teamAName}</CardTitle>
              </CardHeader>
              <CardContent className="p-4" style={{ backgroundColor: '#052240' }}>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <BirdButton 
                    variant="pink" 
                    amount={10} 
                    onClick={() => showBetConfirmation('A', 10)}
                    disabled={!currentUser}
                  />
                  <BirdButton 
                    variant="blue" 
                    amount={50} 
                    onClick={() => showBetConfirmation('A', 50)}
                    disabled={!currentUser}
                  />
                  <BirdButton
                    variant="yellow"
                    amount={100}
                    onClick={() => showBetConfirmation('A', 100)}
                    disabled={!currentUser}
                  />
                </div>
                
                <div className="relative">
                  <div className="w-full mb-1 sticky top-0 z-10 rounded-xl" style={{ backgroundColor: '#95deff' }}>
                    <div className="grid grid-cols-3 py-2">
                      <div className="text-center text-white font-medium">Bet ID</div>
                      <div className="text-center text-white font-medium">User</div>
                      <div className="text-center text-white font-medium">Amount</div>
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {teamAQueue.length > 0 ? (
                      <div>
                        {teamAQueue.map((bet) => {
                          const betUser = getUserById(bet.userId);
                          return (
                            <div 
                              key={bet.id} 
                              style={{ 
                                backgroundColor: bet.booked ? bet.color : (bet.color ? `${bet.color}DD` : 'rgba(31, 41, 55, 0.7)'),
                                transition: 'all 0.3s ease',
                                borderLeft: bet.booked ? `4px solid ${bet.color}` : 'none'
                              }}
                              className="grid grid-cols-3 py-2 mb-1 rounded-xl hover:brightness-110"
                            >
                              <div className={`text-center font-medium ${bet.booked ? 'text-black' : 'text-white'}`}>
                                #{bet.id}
                              </div>
                              <div className={`text-center font-medium ${bet.booked ? 'text-black' : 'text-white'} truncate`}>
                                {bet.userName || betUser?.name || 'User'}
                              </div>
                              <div className={`text-center flex justify-between items-center px-2 ${bet.booked ? 'text-black font-bold' : 'text-white'}`}>
                                {bet.amount} COINS
                                <div className="flex items-center gap-2">
                                      {!bet.booked ? (
                                    <>
                                      <span className="px-2 py-0.5 text-xs rounded-xl text-white" style={{ backgroundColor: '#95deff' }}>OPEN</span>
                                      {currentUser && bet.userId === currentUser.id && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 transition-colors"
                                          style={{ color: '#fa1593' }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.color = '#fa1593';
                                            e.currentTarget.style.backgroundColor = 'rgba(250, 21, 147, 0.2)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.color = '#fa1593';
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                          }}
                                          onClick={() => deleteOpenBet(bet.id, false)}
                                          title="Delete your open bet"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-black/30 text-xs rounded-xl flex items-center text-white">
                                      <CheckSquare className="w-3 h-3 mr-1" /> BOOKED
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-8">No active bets</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card overflow-hidden shadow-lg transform transition-all rounded-2xl" style={{ backgroundColor: '#052240', boxShadow: '0 0 30px rgba(250, 21, 147, 0.8)' }}>
              <CardHeader className="p-4 rounded-t-2xl" style={{ background: 'linear-gradient(to right, #fa1593, #004b6b)' }}>
                <CardTitle className="text-center text-2xl text-white">{teamBName}</CardTitle>
              </CardHeader>
              <CardContent className="p-4" style={{ backgroundColor: '#052240' }}>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <BirdButton 
                    variant="pink" 
                    amount={10} 
                    onClick={() => showBetConfirmation('B', 10)}
                    disabled={!currentUser}
                  />
                  <BirdButton 
                    variant="blue" 
                    amount={50} 
                    onClick={() => showBetConfirmation('B', 50)}
                    disabled={!currentUser}
                  />
                  <BirdButton
                    variant="yellow"
                    amount={100}
                    onClick={() => showBetConfirmation('B', 100)}
                    disabled={!currentUser}
                  />
                </div>
                
                <div className="relative">
                  <div className="w-full mb-1 sticky top-0 z-10 rounded-xl" style={{ backgroundColor: '#fa1593' }}>
                    <div className="grid grid-cols-3 py-2">
                      <div className="text-center text-white font-medium">Bet ID</div>
                      <div className="text-center text-white font-medium">User</div>
                      <div className="text-center text-white font-medium">Amount</div>
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {teamBQueue.length > 0 ? (
                      <div>
                        {teamBQueue.map((bet) => {
                          const betUser = getUserById(bet.userId);
                          return (
                            <div 
                              key={bet.id} 
                              style={{ 
                                backgroundColor: bet.booked ? bet.color : (bet.color ? `${bet.color}DD` : 'rgba(31, 41, 55, 0.7)'),
                                transition: 'all 0.3s ease',
                                borderLeft: bet.booked ? `4px solid ${bet.color}` : 'none'
                              }}
                              className="grid grid-cols-3 py-2 mb-1 rounded-xl hover:brightness-110"
                            >
                              <div className={`text-center font-medium ${bet.booked ? 'text-black' : 'text-white'}`}>
                                #{bet.id}
                              </div>
                              <div className={`text-center font-medium ${bet.booked ? 'text-black' : 'text-white'} truncate`}>
                                {bet.userName || betUser?.name || 'User'}
                              </div>
                              <div className={`text-center flex justify-between items-center px-2 ${bet.booked ? 'text-black font-bold' : 'text-white'}`}>
                                {bet.amount} COINS
                                <div className="flex items-center gap-2">
                                  {!bet.booked ? (
                                    <>
                                      <span className="px-2 py-0.5 text-xs rounded-xl text-white" style={{ backgroundColor: '#fa1593' }}>OPEN</span>
                                      {currentUser && bet.userId === currentUser.id && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 transition-colors"
                                          style={{ color: '#fa1593' }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.color = '#fa1593';
                                            e.currentTarget.style.backgroundColor = 'rgba(250, 21, 147, 0.2)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.color = '#fa1593';
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                          }}
                                          onClick={() => deleteOpenBet(bet.id, false)}
                                          title="Delete your open bet"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-black/30 text-xs rounded-xl flex items-center text-white">
                                      <CheckSquare className="w-3 h-3 mr-1" /> BOOKED
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-8">No active bets</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Current Game Betting Queue Information */}
        <div className="text-center mb-6">
          <p className="font-medium text-lg" style={{ color: '#95deff' }}>
            *** BETS ARE HIGHLIGHTED ONCE MATCHED ***
          </p>
        </div>
        
        <div className="mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="p-3 rounded-2xl flex items-center animate-bounce" style={{ backgroundColor: '#fa1593' }}>
              <span className="text-white font-bold text-lg mr-2">BET NEXT GAME</span>
              <ArrowDown className="h-6 w-6 text-white" />
            </div>
          </div>

          <Card className="glass-card backdrop-blur-sm shadow-lg rounded-2xl transition-all duration-300 mb-4 hover:shadow-[0_0_15px_rgba(250,21,147,0.3)]" style={{ borderColor: '#fa1593', backgroundColor: '#004b6b' }}>
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="p-3 rounded-2xl mr-4" style={{ backgroundColor: '#fa1593' }}>
                  <SkipForward className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white">Game {currentGameNumber + 1} Bets</h3>
                  <p style={{ color: '#95deff' }}>{countNextGameBookedBets()} booked bets</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="p-3 rounded-2xl mr-4" style={{ backgroundColor: '#fa1593' }}>
                  <Coins className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white">Total Booked</h3>
                  <p className="text-2xl font-bold text-white">
                    <NumericAnimation 
                      value={nextTotalBookedAmount} 
                      className="text-4xl transition-all duration-500"
                      withGlow={true}
                    /> <span>COINS</span>
                  </p>
                </div>
              </div>
              
              {isAgentMode && (
                <Button 
                  variant="outline" 
                  className="hover:text-white"
                  style={{ borderColor: '#fa1593', color: '#fa1593' }}
                  onClick={moveBetsToCurrentGame}
                >
                  <ArrowDownUp className="h-4 w-4 mr-2" />
                  Move to Current Game
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="glass-card overflow-hidden shadow-lg transform transition-all rounded-2xl" style={{ backgroundColor: '#052240', boxShadow: '0 0 30px rgba(149, 222, 255, 0.8)' }}>
              <CardHeader className="p-4 rounded-t-2xl" style={{ background: 'linear-gradient(to right, #95deff, #004b6b)' }}>
                <CardTitle className="text-center text-2xl text-white">{teamAName} (Next Game)</CardTitle>
              </CardHeader>
              <CardContent className="p-4" style={{ backgroundColor: '#052240' }}>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <BirdButton 
                    variant="pink" 
                    amount={10} 
                    onClick={() => showBetConfirmation('A', 10, true)}
                    disabled={!currentUser}
                  />
                  <BirdButton 
                    variant="blue" 
                    amount={50} 
                    onClick={() => showBetConfirmation('A', 50, true)}
                    disabled={!currentUser}
                  />
                  <BirdButton
                    variant="yellow"
                    amount={100}
                    onClick={() => showBetConfirmation('A', 100, true)}
                    disabled={!currentUser}
                  />
                </div>
                
                <div className="relative">
                  <div className="w-full mb-1 sticky top-0 z-10 rounded-xl" style={{ backgroundColor: '#95deff' }}>
                    <div className="grid grid-cols-3 py-2">
                      <div className="text-center text-white font-medium">Bet ID</div>
                      <div className="text-center text-white font-medium">User</div>
                      <div className="text-center text-white font-medium">Amount</div>
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {nextTeamAQueue.length > 0 ? (
                      <div>
                        {nextTeamAQueue.map((bet) => {
                          const betUser = getUserById(bet.userId);
                          return (
                            <div 
                              key={bet.id} 
                              style={{ 
                                backgroundColor: bet.booked ? bet.color : (bet.color ? `${bet.color}DD` : 'rgba(31, 41, 55, 0.7)'),
                                transition: 'all 0.3s ease',
                                borderLeft: bet.booked ? `4px solid ${bet.color}` : 'none'
                              }}
                              className="grid grid-cols-3 py-2 mb-1 rounded-xl hover:brightness-110"
                            >
                              <div className={`text-center font-medium ${bet.booked ? 'text-black' : 'text-white'}`}>
                                #{bet.id}
                              </div>
                              <div className={`text-center font-medium ${bet.booked ? 'text-black' : 'text-white'} truncate`}>
                                {bet.userName || betUser?.name || 'User'}
                              </div>
                              <div className={`text-center flex justify-between items-center px-2 ${bet.booked ? 'text-black font-bold' : 'text-white'}`}>
                                {bet.amount} COINS
                                <div className="flex items-center gap-2">
                                  {!bet.booked ? (
                                    <>
                                      <span className="px-2 py-0.5 text-xs rounded-xl text-white" style={{ backgroundColor: '#95deff' }}>OPEN</span>
                                      {currentUser && bet.userId === currentUser.id && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 transition-colors"
                                          style={{ color: '#fa1593' }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.color = '#fa1593';
                                            e.currentTarget.style.backgroundColor = 'rgba(250, 21, 147, 0.2)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.color = '#fa1593';
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                          }}
                                          onClick={() => deleteOpenBet(bet.id, true)}
                                          title="Delete your open bet"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-black/30 text-xs rounded-xl flex items-center text-white">
                                      <CheckSquare className="w-3 h-3 mr-1" /> BOOKED
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-8">No active bets</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card overflow-hidden shadow-lg transform transition-all rounded-2xl" style={{ backgroundColor: '#052240', boxShadow: '0 0 30px rgba(250, 21, 147, 0.8)' }}>
              <CardHeader className="p-4 rounded-t-2xl" style={{ background: 'linear-gradient(to right, #fa1593, #004b6b)' }}>
                <CardTitle className="text-center text-2xl text-white">{teamBName} (Next Game)</CardTitle>
              </CardHeader>
              <CardContent className="p-4" style={{ backgroundColor: '#052240' }}>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <BirdButton 
                    variant="pink" 
                    amount={10} 
                    onClick={() => showBetConfirmation('B', 10, true)}
                    disabled={!currentUser}
                  />
                  <BirdButton 
                    variant="blue" 
                    amount={50} 
                    onClick={() => showBetConfirmation('B', 50, true)}
                    disabled={!currentUser}
                  />
                  <BirdButton
                    variant="yellow"
                    amount={100}
                    onClick={() => showBetConfirmation('B', 100, true)}
                    disabled={!currentUser}
                  />
                </div>
                
                <div className="relative">
                  <div className="w-full mb-1 sticky top-0 z-10 rounded-xl" style={{ backgroundColor: '#fa1593' }}>
                    <div className="grid grid-cols-3 py-2">
                      <div className="text-center text-white font-medium">Bet ID</div>
                      <div className="text-center text-white font-medium">User</div>
                      <div className="text-center text-white font-medium">Amount</div>
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {nextTeamBQueue.length > 0 ? (
                      <div>
                        {nextTeamBQueue.map((bet) => {
                          const betUser = getUserById(bet.userId);
                          return (
                            <div 
                              key={bet.id} 
                              style={{ 
                                backgroundColor: bet.booked ? bet.color : (bet.color ? `${bet.color}DD` : 'rgba(31, 41, 55, 0.7)'),
                                transition: 'all 0.3s ease',
                                borderLeft: bet.booked ? `4px solid ${bet.color}` : 'none'
                              }}
                              className="grid grid-cols-3 py-2 mb-1 rounded-xl hover:brightness-110"
                            >
                              <div className={`text-center font-medium ${bet.booked ? 'text-black' : 'text-white'}`}>
                                #{bet.id}
                              </div>
                              <div className={`text-center font-medium ${bet.booked ? 'text-black' : 'text-white'} truncate`}>
                                {bet.userName || betUser?.name || 'User'}
                              </div>
                              <div className={`text-center flex justify-between items-center px-2 ${bet.booked ? 'text-black font-bold' : 'text-white'}`}>
                                {bet.amount} COINS
                                <div className="flex items-center gap-2">
                                  {!bet.booked ? (
                                    <>
                                      <span className="px-2 py-0.5 text-xs rounded-xl text-white" style={{ backgroundColor: '#fa1593' }}>OPEN</span>
                                      {currentUser && bet.userId === currentUser.id && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 transition-colors"
                                          style={{ color: '#fa1593' }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.color = '#fa1593';
                                            e.currentTarget.style.backgroundColor = 'rgba(250, 21, 147, 0.2)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.color = '#fa1593';
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                          }}
                                          onClick={() => deleteOpenBet(bet.id, true)}
                                          title="Delete your open bet"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-black/30 text-xs rounded-xl flex items-center text-white">
                                      <CheckSquare className="w-3 h-3 mr-1" /> BOOKED
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-8">No active bets</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Betting Queue Information */}
        <div className="text-center mb-6">
          <p className="font-medium text-lg" style={{ color: '#95deff' }}>
            *** BETS ARE HIGHLIGHTED ONCE MATCHED ***
          </p>
        </div>

        <BookedBetsReceipt 
          bookedBets={bookedBets} 
          teamAName={teamAName} 
          teamBName={teamBName} 
          title="BOOKED BETS"
          nextGameBets={nextBookedBets}
        />
        
        <BetReceiptsLedger 
          isAdmin={isAdminMode}
          teamAName={teamAName}
          teamBName={teamBName}
        />
        
        <BetLedger 
          isAdmin={isAdminMode}
          teamAName={teamAName}
          teamBName={teamBName}
        />
      </div>
    </div>
  );
};

export default Index;
