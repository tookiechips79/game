import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, Zap, Coins, CheckSquare, Lock, Unlock, 
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

const Index = () => {
  const { 
    currentUser, 
    deductCredits, 
    addCredits, 
    getUserById, 
    addBetHistoryRecord, 
    incrementWins, 
    incrementLosses,
    resetBetHistory 
  } = useUser();
  
  const { gameState, updateGameState, isAdmin, localAdminState, updateLocalAdminState, startTimer, pauseTimer, resetTimer, setTimer, resetTimerOnMatchStart, resetTimerOnGameWin } = useGameState();
  
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
  
  const betColors = ["#00FF00", "#00FFFF", "#FF00FF", "#FFFF00", "#1EAEDB"];
  
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    team: '',
    teamSide: null,
    amount: 0,
    isNextGame: false
  });

  const generateBetId = () => {
    // Generate a 7-digit unique ID using counter + random number
    const random = Math.floor(Math.random() * 1000);
    const paddedCounter = betCounter.toString().padStart(4, '0');
    const newId = parseInt(`${paddedCounter}${random.toString().padStart(3, '0')}`);
    updateGameState({ betCounter: betCounter + 1 });
    return newId;
  };

  const playSound = (soundType: string) => {
    console.log(`Playing sound: ${soundType}`);
  };

  const toggleAdminMode = () => {
    updateLocalAdminState({ isAdminMode: !isAdminMode });
    if (!isAdminMode) {
      toast.success("Admin Mode Activated", {
        description: "You now have access to admin controls",
        className: "custom-toast-success",
      });
    }
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
    updateGameState({
      teamAGames: teamAGames + 1,
      teamABalls: 0,
      teamBBalls: 0,
      teamAHasBreak: !teamAHasBreak,
      currentGameNumber: currentGameNumber + 1
    });
    
    toast.success(`${teamAName} Wins!`, {
      description: `${teamAName} has won a game`,
      className: "custom-toast-success",
    });

    processBetsForGameWin('A', duration);
    
    // Reset timer when game is won
    resetTimerOnGameWin();
    
    playSound("win");
  };

  const handleTeamBWin = (duration: number) => {
    updateGameState({
      teamBGames: teamBGames + 1,
      teamABalls: 0,
      teamBBalls: 0,
      teamAHasBreak: !teamAHasBreak,
      currentGameNumber: currentGameNumber + 1
    });
    
    toast.success(`${teamBName} Wins!`, {
      description: `${teamBName} has won a game`,
      className: "custom-toast-success",
    });

    processBetsForGameWin('B', duration);
    
    // Reset timer when game is won
    resetTimerOnGameWin();
    
    playSound("win");
  };
  
  const processBetsForGameWin = (winningTeam: 'A' | 'B', duration: number) => {
    // Only include booked bets in game history
    const teamABets = teamAQueue
      .filter(bet => bet.booked)
      .map(bet => {
        const user = getUserById(bet.userId);
        return {
          userId: bet.userId,
          userName: user?.name || 'Unknown',
          amount: bet.amount,
          won: winningTeam === 'A',
          booked: bet.booked
        };
      });
    
    const teamBBets = teamBQueue
      .filter(bet => bet.booked)
      .map(bet => {
        const user = getUserById(bet.userId);
        return {
          userId: bet.userId,
          userName: user?.name || 'Unknown',
          amount: bet.amount,
          won: winningTeam === 'B',
          booked: bet.booked
        };
      });
    
    addBetHistoryRecord({
      gameNumber: teamAGames + teamBGames + 1,
      teamAName,
      teamBName,
      teamAScore: winningTeam === 'A' ? 1 : 0,
      teamBScore: winningTeam === 'B' ? 1 : 0,
      winningTeam,
      teamABalls,
      teamBBalls,
      breakingTeam: teamAHasBreak ? 'A' : 'B',
      duration,
      bets: {
        teamA: teamABets,
        teamB: teamBBets
      },
      totalAmount: totalBookedAmount
    });
    
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
        updateGameState({ teamAQueue: updatedAQueue });
        bookBets(updatedAQueue, teamBQueue);
      } else {
        const updatedBQueue = [...teamBQueue, bet];
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

    if (currentUser.membershipStatus === 'inactive') {
      toast.error("Membership Required", {
        description: "You need an active subscription to place bets. Please subscribe to activate your membership.",
        icon: <Lock className="h-5 w-5 text-red-500" />,
        duration: 5000,
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
        updateGameState({ nextTeamAQueue: updatedAQueue });
        bookNextGameBets(updatedAQueue, nextTeamBQueue);
      } else {
        const updatedBQueue = [...nextTeamBQueue, bet];
        updateGameState({ nextTeamBQueue: updatedBQueue });
        bookNextGameBets(nextTeamAQueue, updatedBQueue);
      }
    } else {
      if (team === 'A') {
        const updatedAQueue = [...teamAQueue, bet];
        updateGameState({ teamAQueue: updatedAQueue });
        bookBets(updatedAQueue, teamBQueue);
      } else {
        const updatedBQueue = [...teamBQueue, bet];
        updateGameState({ teamBQueue: updatedBQueue });
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
    const newBookedBets = [...bookedBets];
    const newTotalAmount = totalBookedAmount;
    const newColorIndex = colorIndex;

    for (let i = 0; i < newAQueue.length; i++) {
      if (!newAQueue[i].booked) {
        const matchIndex = newBQueue.findIndex(bBet => !bBet.booked && bBet.amount === newAQueue[i].amount);
        
        if (matchIndex !== -1) {
          const assignedColor = betColors[newColorIndex % betColors.length];
          newAQueue[i].color = assignedColor;
          newAQueue[i].booked = true;
          newBQueue[matchIndex].color = assignedColor;
          newBQueue[matchIndex].booked = true;
          newColorIndex++;

          newBookedBets.push({ 
            idA: newAQueue[i].id, 
            idB: newBQueue[matchIndex].id, 
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
    const newColorIndex = colorIndex;

    for (let i = 0; i < newAQueue.length; i++) {
      if (!newAQueue[i].booked) {
        const matchIndex = newBQueue.findIndex(bBet => !bBet.booked && bBet.amount === newAQueue[i].amount);
        
        if (matchIndex !== -1) {
          const assignedColor = betColors[newColorIndex % betColors.length];
          newAQueue[i].color = assignedColor;
          newAQueue[i].booked = true;
          newBQueue[matchIndex].color = assignedColor;
          newBQueue[matchIndex].booked = true;
          newColorIndex++;

          newBookedBets.push({ 
            idA: newAQueue[i].id, 
            idB: newBQueue[matchIndex].id, 
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

  const handleResetHistory = () => {
    if (confirm("Are you sure you want to reset the betting history? This cannot be undone.")) {
      resetBetHistory();
    }
  };

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
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
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
          <Link to="/" className="inline-flex items-center text-[#F97316] hover:text-[#FBBF24] transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
          
          {isAdminMode && (
            <div className="flex space-x-2">
              <Link to="/reload-coins">
                <Button 
                  variant="outline" 
                  className="border-[#1EAEDB]/50 text-[#1EAEDB] hover:bg-[#1EAEDB]/20 hover:text-[#33C3F0]"
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Reload Coins
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="border-[#F97316]/50 text-[#F97316] hover:bg-[#F97316]/20 hover:text-[#FBBF24]"
                onClick={handleResetHistory}
              >
                <TimerReset className="h-4 w-4 mr-2" />
                Reset History
              </Button>
            </div>
          )}
        </div>
        

        <div className="w-full max-w-md mx-auto mb-8">
          <img 
            src="/lovable-uploads/4dfcf9c9-cbb9-4a75-94ab-bcdb38a8091e.png" 
            alt="Game Bird Logo" 
            className="w-full h-40 object-contain drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]" 
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6 bg-gradient-to-r from-[#F97316] via-[#FBBF24] to-[#F59E0B] bg-clip-text text-transparent drop-shadow-lg">Betting</h1>

        <UserCreditSystem isAdmin={isAdminMode} />

        <GameDescription 
          isAdmin={isAdminMode || isAgentMode} 
          initialDescription={gameDescription} 
          onDescriptionChange={(desc) => updateGameState({ gameDescription: desc })} 
        />

        {/* Game Info Window */}
        <GameInfoWindow 
          teamAQueue={teamAQueue}
          teamBQueue={teamBQueue}
          nextTeamAQueue={nextTeamAQueue}
          nextTeamBQueue={nextTeamBQueue}
        />

        {/* Realtime Scoreboard Header */}
        <div className="text-center mb-6">
          <h2 className="text-[#a3e635] font-bold text-2xl uppercase tracking-wider">
            REALTIME SCOREBOARD
          </h2>
        </div>

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
          onDeleteUnmatchedBets={deleteUnmatchedBets}
          timerSeconds={timerSeconds}
          isTimerRunning={isTimerRunning}
          onTimerStart={startTimer}
          onTimerPause={pauseTimer}
          onTimerReset={resetTimer}
        />

        {/* Game History Window */}
        <GameHistoryWindow />

        {/* Betting Cue Header */}
        <div className="text-center mb-6">
          <h2 className="text-[#a3e635] font-bold text-2xl uppercase tracking-wider">
            BETTING CUE
          </h2>
        </div>

        <div className="mb-8">
          <Card className="glass-card border-[#F97316]/30 backdrop-blur-sm bg-[#0a192f]/70 shadow-lg rounded-2xl transition-all duration-300 mb-4 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-[#F97316]/20 p-3 rounded-2xl mr-4">
                  <Zap className="h-8 w-8 text-[#F97316]" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white">Game {currentGameNumber} Bets</h3>
                  <p className="text-[#a3e635]">{countBookedBets()} booked bets</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-[#F97316]/20 p-3 rounded-2xl mr-4">
                  <Coins className="h-8 w-8 text-[#F97316]" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white">Total Booked</h3>
                  <p className="text-2xl font-bold">
                    <NumericAnimation 
                      value={totalBookedAmount} 
                      className="text-4xl transition-all duration-500 text-[#F97316]"
                      withGlow={true}
                    /> <span className="text-[#F97316]">COINS</span>
                  </p>
                </div>
              </div>
              
              {isAgentMode && (
                <Button 
                  variant="outline" 
                  className="border-[#F97316]/50 text-[#F97316] hover:bg-[#F97316]/20 hover:text-[#FBBF24]"
                  onClick={moveBetsToNextGame}
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Move to Next Game
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="glass-card border-[#F97316]/50 bg-[#0a192f]/70 overflow-hidden shadow-lg transform transition-all hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:border-[#F97316]/60 rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-[#F97316] to-[#FBBF24] p-4 rounded-t-2xl">
                <CardTitle className="text-center text-2xl text-black">{teamAName}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 bg-[#0f2a3d]/70">
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
                  <div className="bg-[#F97316]/70 w-full mb-1 sticky top-0 z-10 rounded-xl">
                    <div className="grid grid-cols-3 py-2">
                      <div className="text-center text-black font-medium">Bet ID</div>
                      <div className="text-center text-black font-medium">User</div>
                      <div className="text-center text-black font-medium">Amount</div>
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
                                backgroundColor: bet.color ? `${bet.color}DD` : 'rgba(31, 41, 55, 0.7)',
                                transition: 'all 0.3s ease',
                                borderLeft: bet.booked ? `4px solid ${bet.color}` : 'none'
                              }}
                              className="grid grid-cols-3 py-2 mb-1 rounded-xl hover:brightness-110"
                            >
                              <div className={`text-center font-medium ${bet.booked ? 'text-black' : 'text-white'}`}>
                                #{bet.id}
                              </div>
                              <div className={`text-center font-medium ${bet.booked ? 'text-black' : 'text-white'} truncate`}>
                                {betUser?.name || 'Unknown'}
                              </div>
                              <div className={`text-center flex justify-between items-center px-2 ${bet.booked ? 'text-black font-bold' : 'text-white'}`}>
                                {bet.amount} COINS
                                <div className="flex items-center gap-2">
                                  {!bet.booked ? (
                                    <>
                                      <span className="px-2 py-0.5 bg-[#F97316]/70 text-xs rounded-xl text-black">OPEN</span>
                                      {currentUser && bet.userId === currentUser.id && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
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

            <Card className="glass-card border-[#F97316]/50 bg-[#0a192f]/70 overflow-hidden shadow-lg transform transition-all hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:border-[#F97316]/60 rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-[#F97316] to-[#FBBF24] p-4 rounded-t-2xl">
                <CardTitle className="text-center text-2xl text-black">{teamBName}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 bg-[#0f2a3d]/70">
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
                  <div className="bg-[#F97316]/70 w-full mb-1 sticky top-0 z-10 rounded-xl">
                    <div className="grid grid-cols-3 py-2">
                      <div className="text-center text-black font-medium">Bet ID</div>
                      <div className="text-center text-black font-medium">User</div>
                      <div className="text-center text-black font-medium">Amount</div>
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
                                backgroundColor: bet.color ? `${bet.color}DD` : 'rgba(31, 41, 55, 0.7)',
                                transition: 'all 0.3s ease',
                                borderLeft: bet.booked ? `4px solid ${bet.color}` : 'none'
                              }}
                              className="grid grid-cols-3 py-2 mb-1 rounded-xl hover:brightness-110"
                            >
                              <div className={`text-center font-medium ${bet.booked ? 'text-black' : 'text-white'}`}>
                                #{bet.id}
                              </div>
                              <div className={`text-center font-medium ${bet.booked ? 'text-black' : 'text-white'} truncate`}>
                                {betUser?.name || 'Unknown'}
                              </div>
                              <div className={`text-center flex justify-between items-center px-2 ${bet.booked ? 'text-black font-bold' : 'text-white'}`}>
                                {bet.amount} COINS
                                <div className="flex items-center gap-2">
                                  {!bet.booked ? (
                                    <>
                                      <span className="px-2 py-0.5 bg-[#F97316]/70 text-xs rounded-xl text-black">OPEN</span>
                                      {currentUser && bet.userId === currentUser.id && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
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

        {/* Current Game Betting Cue Information */}
        <div className="text-center mb-6">
          <p className="text-[#a3e635] font-medium text-lg">
            *** BETS ARE HIGHLIGHTED ONCE MATCHED ***
          </p>
        </div>
        
        <div className="mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="bg-[#a3e635] p-3 rounded-2xl flex items-center animate-bounce">
              <span className="text-black font-bold text-lg mr-2">BET NEXT GAME</span>
              <ArrowDown className="h-6 w-6 text-black" />
            </div>
          </div>

          <Card className="glass-card border-[#F97316]/30 backdrop-blur-sm bg-[#0a192f]/70 shadow-lg rounded-2xl transition-all duration-300 mb-4 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-[#F97316]/20 p-3 rounded-2xl mr-4">
                  <SkipForward className="h-8 w-8 text-[#F97316]" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white">Game {currentGameNumber + 1} Bets</h3>
                  <p className="text-[#a3e635]">{countNextGameBookedBets()} booked bets</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-[#F97316]/20 p-3 rounded-2xl mr-4">
                  <Coins className="h-8 w-8 text-[#F97316]" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white">Total Booked</h3>
                  <p className="text-2xl font-bold">
                    <NumericAnimation 
                      value={nextTotalBookedAmount} 
                      className="text-4xl transition-all duration-500 text-[#F97316]"
                      withGlow={true}
                    /> <span className="text-[#F97316]">COINS</span>
                  </p>
                </div>
              </div>
              
              {isAgentMode && (
                <Button 
                  variant="outline" 
                  className="border-[#F97316]/50 text-[#F97316] hover:bg-[#F97316]/20 hover:text-[#FBBF24]"
                  onClick={moveBetsToCurrentGame}
                >
                  <ArrowDownUp className="h-4 w-4 mr-2" />
                  Move to Current Game
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="glass-card border-[#F97316]/50 bg-[#0a192f]/70 overflow-hidden shadow-lg transform transition-all hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:border-[#F97316]/60 rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-[#F97316] to-[#FBBF24] p-4 rounded-t-2xl">
                <CardTitle className="text-center text-2xl text-black">{teamAName} (Next Game)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 bg-[#0f2a3d]/70">
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
                  <div className="bg-[#F97316]/70 w-full mb-1 sticky top-0 z-10 rounded-xl">
                    <div className="grid grid-cols-3 py-2">
                      <div className="text-center text-black font-medium">Bet ID</div>
                      <div className="text-center text-black font-medium">User</div>
                      <div className="text-center text-black font-medium">Amount</div>
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
                                backgroundColor: bet.color ? `${bet.color}DD` : 'rgba(31, 41, 55, 0.7)',
                                transition: 'all 0.3s ease',
                                borderLeft: bet.booked ? `4px solid ${bet.color}` : 'none'
                              }}
                              className="grid grid-cols-3 py-2 mb-1 rounded-xl hover:brightness-110"
                            >
                              <div className={`text-center font-medium ${bet.booked ? 'text-black' : 'text-white'}`}>
                                #{bet.id}
                              </div>
                              <div className={`text-center font-medium ${bet.booked ? 'text-black' : 'text-white'} truncate`}>
                                {betUser?.name || 'Unknown'}
                              </div>
                              <div className={`text-center flex justify-between items-center px-2 ${bet.booked ? 'text-black font-bold' : 'text-white'}`}>
                                {bet.amount} COINS
                                <div className="flex items-center gap-2">
                                  {!bet.booked ? (
                                    <>
                                      <span className="px-2 py-0.5 bg-[#F97316]/70 text-xs rounded-xl text-black">OPEN</span>
                                      {currentUser && bet.userId === currentUser.id && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
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

            <Card className="glass-card border-[#F97316]/50 bg-[#0a192f]/70 overflow-hidden shadow-lg transform transition-all hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:border-[#F97316]/60 rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-[#F97316] to-[#FBBF24] p-4 rounded-t-2xl">
                <CardTitle className="text-center text-2xl text-black">{teamBName} (Next Game)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 bg-[#0f2a3d]/70">
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
                  <div className="bg-[#F97316]/70 w-full mb-1 sticky top-0 z-10 rounded-xl">
                    <div className="grid grid-cols-3 py-2">
                      <div className="text-center text-black font-medium">Bet ID</div>
                      <div className="text-center text-black font-medium">User</div>
                      <div className="text-center text-black font-medium">Amount</div>
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
                                backgroundColor: bet.color ? `${bet.color}DD` : 'rgba(31, 41, 55, 0.7)',
                                transition: 'all 0.3s ease',
                                borderLeft: bet.booked ? `4px solid ${bet.color}` : 'none'
                              }}
                              className="grid grid-cols-3 py-2 mb-1 rounded-xl hover:brightness-110"
                            >
                              <div className={`text-center font-medium ${bet.booked ? 'text-black' : 'text-white'}`}>
                                #{bet.id}
                              </div>
                              <div className={`text-center font-medium ${bet.booked ? 'text-black' : 'text-white'} truncate`}>
                                {betUser?.name || 'Unknown'}
                              </div>
                              <div className={`text-center flex justify-between items-center px-2 ${bet.booked ? 'text-black font-bold' : 'text-white'}`}>
                                {bet.amount} COINS
                                <div className="flex items-center gap-2">
                                  {!bet.booked ? (
                                    <>
                                      <span className="px-2 py-0.5 bg-[#F97316]/70 text-xs rounded-xl text-black">OPEN</span>
                                      {currentUser && bet.userId === currentUser.id && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
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

        {/* Betting Cue Information */}
        <div className="text-center mb-6">
          <p className="text-[#a3e635] font-medium text-lg">
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
