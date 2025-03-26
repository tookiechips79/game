import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, Zap, Coins, CheckSquare, Lock, Unlock, 
  Wallet, TimerReset, ReceiptText, SkipForward, ArrowDownUp, ArrowDown
} from "lucide-react";
import NumericAnimation from "@/components/NumericAnimation";
import ScoreBoard from "@/components/ScoreBoard";
import BetConfirmationDialog from "@/components/BetConfirmationDialog";
import GameDescription from "@/components/GameDescription";
import UserCreditSystem, { UserSelector } from "@/components/UserCreditSystem";
import UserWidgetsContainer from "@/components/UserWidgetsContainer";
import BookedBetsReceipt from "@/components/BookedBetsReceipt";
import BetLedger from "@/components/BetLedger";
import BetReceiptsLedger from "@/components/BetReceiptsLedger";
import BirdButton from "@/components/BirdButton";
import { useUser } from "@/contexts/UserContext";
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
  
  const [teamAQueue, setTeamAQueue] = useState<Bet[]>([]);
  const [teamBQueue, setTeamBQueue] = useState<Bet[]>([]);
  const [betId, setBetId] = useState<string>("");
  const [bookedBets, setBookedBets] = useState<BookedBet[]>([]);
  const [totalBookedAmount, setTotalBookedAmount] = useState<number>(0);

  const [nextTeamAQueue, setNextTeamAQueue] = useState<Bet[]>([]);
  const [nextTeamBQueue, setNextTeamBQueue] = useState<Bet[]>([]);
  const [nextBookedBets, setNextBookedBets] = useState<BookedBet[]>([]);
  const [nextTotalBookedAmount, setNextTotalBookedAmount] = useState<number>(0);
  
  const [teamAName, setTeamAName] = useState<string>("Player A");
  const [teamBName, setTeamBName] = useState<string>("Player B");
  const [teamAGames, setTeamAGames] = useState<number>(0);
  const [teamABalls, setTeamABalls] = useState<number>(0);
  const [teamBGames, setTeamBGames] = useState<number>(0);
  const [teamBBalls, setTeamBBalls] = useState<number>(0);
  const [teamAHasBreak, setTeamAHasBreak] = useState<boolean>(true);
  const [gameLabel, setGameLabel] = useState<string>("GAME*");
  const [currentGameNumber, setCurrentGameNumber] = useState<number>(1);
  
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isAgentMode, setIsAgentMode] = useState<boolean>(false);
  
  const betColors = ["#00FF00", "#00FFFF", "#FF00FF", "#FFFF00", "#1EAEDB"];
  const [colorIndex, setColorIndex] = useState<number>(0);
  const [betCounter, setBetCounter] = useState<number>(1);
  
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    team: '',
    teamSide: null,
    amount: 0,
    isNextGame: false
  });

  const [gameDescription, setGameDescription] = useState<string>("");

  const generateBetId = () => {
    const newId = betCounter;
    setBetCounter(prev => prev + 1);
    return newId;
  };

  const playSound = (soundType: string) => {
    console.log(`Playing sound: ${soundType}`);
  };

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
    if (!isAdminMode) {
      toast.success("Admin Mode Activated", {
        description: "You now have access to admin controls",
      });
    }
  };

  const toggleAgentMode = () => {
    setIsAgentMode(!isAgentMode);
    if (!isAgentMode) {
      toast.success("Agent Mode Activated", {
        description: "You now have access to game controls",
      });
    } else {
      toast.info("Agent Mode Deactivated");
    }
  };

  const moveBetsToNextGame = () => {
    if (!teamAQueue.length && !teamBQueue.length) {
      toast.error("No Bets to Move", {
        description: "There are no current bets to move to the next game"
      });
      return;
    }

    setNextTeamAQueue([...nextTeamAQueue, ...teamAQueue]);
    setNextTeamBQueue([...nextTeamBQueue, ...teamBQueue]);
    setNextBookedBets([...nextBookedBets, ...bookedBets]);
    setNextTotalBookedAmount(prev => prev + totalBookedAmount);

    setTeamAQueue([]);
    setTeamBQueue([]);
    setBookedBets([]);
    setTotalBookedAmount(0);

    toast.success("Bets Moved to Next Game", {
      description: "All current bets have been moved to the next game"
    });
  };

  const moveBetsToCurrentGame = () => {
    if (!nextTeamAQueue.length && !nextTeamBQueue.length) {
      toast.error("No Bets to Move", {
        description: "There are no next-game bets to move to the current game"
      });
      return;
    }

    setTeamAQueue([...teamAQueue, ...nextTeamAQueue]);
    setTeamBQueue([...teamBQueue, ...nextTeamBQueue]);
    setBookedBets([...bookedBets, ...nextBookedBets]);
    setTotalBookedAmount(prev => prev + nextTotalBookedAmount);

    setNextTeamAQueue([]);
    setNextTeamBQueue([]);
    setNextBookedBets([]);
    setNextTotalBookedAmount(0);

    toast.success("Bets Moved to Current Game", {
      description: "All next-game bets have been moved to the current game"
    });
  };

  const handleTeamAWin = (duration: number) => {
    setTeamAGames(prev => prev + 1);
    setTeamABalls(0); // Reset Team A ball count to zero
    setTeamBBalls(0); // Reset Team B ball count to zero
    
    setTeamAHasBreak(!teamAHasBreak);
    
    toast.success(`${teamAName} Wins!`, {
      description: `${teamAName} has won a game`,
    });

    processBetsForGameWin('A', duration);
    
    setCurrentGameNumber(prev => prev + 1);
    
    playSound("win");
  };

  const handleTeamBWin = (duration: number) => {
    setTeamBGames(prev => prev + 1);
    setTeamABalls(0); // Reset Team A ball count to zero
    setTeamBBalls(0); // Reset Team B ball count to zero
    
    setTeamAHasBreak(!teamAHasBreak);
    
    toast.success(`${teamBName} Wins!`, {
      description: `${teamBName} has won a game`,
    });

    processBetsForGameWin('B', duration);
    
    setCurrentGameNumber(prev => prev + 1);
    
    playSound("win");
  };
  
  const processBetsForGameWin = (winningTeam: 'A' | 'B', duration: number) => {
    const teamABets = teamAQueue.map(bet => {
      const user = getUserById(bet.userId);
      return {
        userId: bet.userId,
        userName: user?.name || 'Unknown',
        amount: bet.amount,
        won: winningTeam === 'A',
        booked: bet.booked
      };
    });
    
    const teamBBets = teamBQueue.map(bet => {
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
              description: `Bet on ${teamAName} paid off!`
            });
            
            toast.error(`${userB.name} Lost ${bet.amount} COINS`, {
              description: `Bet on ${teamBName} didn't win.`
            });
          } else {
            addCredits(userB.id, bet.amount * 2);
            incrementWins(userB.id);
            incrementLosses(userA.id);
            
            toast.success(`${userB.name} Won ${bet.amount} COINS`, {
              description: `Bet on ${teamBName} paid off!`
            });
            
            toast.error(`${userA.name} Lost ${bet.amount} COINS`, {
              description: `Bet on ${teamAName} didn't win.`
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
    
    setTeamAQueue([]);
    setTeamBQueue([]);
    setBookedBets([]);
    setTotalBookedAmount(0);
    
    setNextTeamAQueue([]);
    setNextTeamBQueue([]);
    setNextBookedBets([]);
    setNextTotalBookedAmount(0);
    
    setTimeout(() => {
      setTeamAQueue(nextMatchedBetsA);
      setTeamBQueue(nextMatchedBetsB);
      setBookedBets(nextMatchedBooked);
      setTotalBookedAmount(nextTotal);
      
      if (nextMatchedBetsA.length > 0 || nextMatchedBetsB.length > 0) {
        toast.success("Next Game Matched Bets Moved to Current Game", {
          description: "All matched bets for the next game are now active for the current game"
        });
      }
    }, 100);
    
    setBetCounter(1);
    
    toast.success("All Bets Processed", {
      description: "A new betting round can begin"
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
          description: `Unmatched bet #${bet.id} refunded`
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
          description: `Unmatched next game bet #${bet.id} refunded`
        });
      }
    });
    
    const matchedBetsA = teamAQueue.filter(bet => bet.booked);
    const matchedBetsB = teamBQueue.filter(bet => bet.booked);
    
    setTeamAQueue(matchedBetsA);
    setTeamBQueue(matchedBetsB);
    
    const nextMatchedBetsA = nextTeamAQueue.filter(bet => bet.booked);
    const nextMatchedBetsB = nextTeamBQueue.filter(bet => bet.booked);
    setNextTeamAQueue(nextMatchedBetsA);
    setNextTeamBQueue(nextMatchedBetsB);
    
    const totalUnmatchedBets = allUnmatchedBets.length + allUnmatchedNextBets.length;
    if (totalUnmatchedBets > 0) {
      console.log(`Refunded ${totalUnmatchedBets} unmatched bets for a total of ${totalRefunded} COINS`);
      toast.success(`${totalUnmatchedBets} Unmatched Bets Refunded (${totalRefunded} COINS)`, {
        description: "COINS have been returned to users and unmatched bets removed"
      });
    } else {
      toast.info("No Unmatched Bets Found", {
        description: "All current bets are already matched"
      });
    }
  };
  
  const handleConfirmBet = () => {
    if (!confirmation.teamSide || confirmation.amount <= 0) return;
    
    if (!currentUser) {
      toast.error("No User Selected", {
        description: "Please select or create a user first",
        duration: 4500,
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
        setNextTeamAQueue(prev => [...prev, bet]);
        const updatedAQueue = [...nextTeamAQueue, bet];
        bookNextGameBets(updatedAQueue, nextTeamBQueue);
      } else {
        setNextTeamBQueue(prev => [...prev, bet]);
        const updatedBQueue = [...nextTeamBQueue, bet];
        bookNextGameBets(nextTeamAQueue, updatedBQueue);
      }
    } else {
      if (confirmation.teamSide === 'A') {
        setTeamAQueue(prev => [...prev, bet]);
        const updatedAQueue = [...teamAQueue, bet];
        bookBets(updatedAQueue, teamBQueue);
      } else {
        setTeamBQueue(prev => [...prev, bet]);
        const updatedBQueue = [...teamBQueue, bet];
        bookBets(teamAQueue, updatedBQueue);
      }
    }
    
    closeBetConfirmation();
  };

  const showBetConfirmation = (team: 'A' | 'B', amount: number, isNextGame: boolean = false) => {
    if (!currentUser) {
      toast.error("No User Selected", {
        description: "Please select or create a user first",
        duration: 4500,
      });
      return;
    }
    
    if (currentUser.credits === 0) {
      toast.error("Zero Credits", {
        description: "You have zero credits. Please ask admin to reload your account.",
        icon: <Wallet className="h-5 w-5 text-red-500" />,
        duration: 5000,
      });
      return;
    }
    
    if (currentUser.credits < amount) {
      toast.error("Insufficient Credits", {
        description: `You need ${amount} credits to place this bet. Please ask admin to reload your account.`,
        icon: <Wallet className="h-5 w-5 text-red-500" />,
        duration: 5000,
      });
      return;
    }
    
    setConfirmation({
      isOpen: true,
      team: team === 'A' ? teamAName : teamBName,
      teamSide: team,
      amount,
      isNextGame
    });
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
          
          toast.success("Bet Booked!", {
            description: `Bet #${newAQueue[i].id} booked with Bet #${newBQueue[matchIndex].id} for ${newAQueue[i].amount}`,
            duration: 4500,
          });
          
          playSound("match");
        }
      }
    }

    setTeamAQueue(newAQueue);
    setTeamBQueue(newBQueue);
    setBookedBets(newBookedBets);
    setTotalBookedAmount(newTotalAmount);
    setColorIndex(newColorIndex);
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
          
          toast.success("Next Game Bet Booked!", {
            description: `Next Game Bet #${newAQueue[i].id} booked with Bet #${newBQueue[matchIndex].id} for ${newAQueue[i].amount}`,
            duration: 4500,
          });
          
          playSound("match");
        }
      }
    }

    setNextTeamAQueue(newAQueue);
    setNextTeamBQueue(newBQueue);
    setNextBookedBets(newBookedBets);
    setNextTotalBookedAmount(newTotalAmount);
    setColorIndex(newColorIndex);
  };

  const deleteBet = () => {
    if (!betId) {
      toast.error("Error", {
        description: "Please enter a valid Bet ID",
      });
      return;
    }

    const id = parseInt(betId);
    let betDeleted = false;
    
    const deletedBetA = teamAQueue.find(bet => bet.id === id);
    if (deletedBetA) {
      const newTeamAQueue = teamAQueue.filter(bet => bet.id !== id);
      setTeamAQueue(newTeamAQueue);
      
      if (deletedBetA.booked) {
        const matchedBookedBet = bookedBets.find(bookedBet => bookedBet.idA === id);
        if (matchedBookedBet) {
          const newTeamBQueue = teamBQueue.map(bet => {
            if (bet.id === matchedBookedBet.idB) {
              return { ...bet, color: null, booked: false };
            }
            return bet;
          });
          setTeamBQueue(newTeamBQueue);
          
          const newBookedBets = bookedBets.filter(bookedBet => bookedBet.idA !== id);
          setBookedBets(newBookedBets);
          
          setTotalBookedAmount(prev => prev - matchedBookedBet.amount);
        }
      }
      
      betDeleted = true;
    }
    
    const deletedBetB = teamBQueue.find(bet => bet.id === id);
    if (deletedBetB && !betDeleted) {
      const newTeamBQueue = teamBQueue.filter(bet => bet.id !== id);
      setTeamBQueue(newTeamBQueue);
      
      if (deletedBetB.booked) {
        const matchedBookedBet = bookedBets.find(bookedBet => bookedBet.idB === id);
        if (matchedBookedBet) {
          const newTeamAQueue = teamAQueue.map(bet => {
            if (bet.id === matchedBookedBet.idA) {
              return { ...bet, color: null, booked: false };
            }
            return bet;
          });
          setTeamAQueue(newTeamAQueue);
          
          const newBookedBets = bookedBets.filter(bookedBet => bookedBet.idB !== id);
          setBookedBets(newBookedBets);
          
          setTotalBookedAmount(prev => prev - matchedBookedBet.amount);
        }
      }
      
      betDeleted = true;
    }
    
    if (!betDeleted) {
      const deletedNextBetA = nextTeamAQueue.find(bet => bet.id === id);
      if (deletedNextBetA) {
        const newNextTeamAQueue = nextTeamAQueue.filter(bet => bet.id !== id);
        setNextTeamAQueue(newNextTeamAQueue);
        
        if (deletedNextBetA.booked) {
          const matchedBookedBet = nextBookedBets.find(bookedBet => bookedBet.idA === id);
          if (matchedBookedBet) {
            const newNextTeamBQueue = nextTeamBQueue.map(bet => {
              if (bet.id === matchedBookedBet.idB) {
                return { ...bet, color: null, booked: false };
              }
              return bet;
            });
            setNextTeamBQueue(newNextTeamBQueue);
            
            const newNextBookedBets = nextBookedBets.filter(bookedBet => bookedBet.idA !== id);
            setNextBookedBets(newNextBookedBets);
            
            setNextTotalBookedAmount(prev => prev - matchedBookedBet.amount);
          }
        }
        
        betDeleted = true;
      }
      
      const deletedNextBetB = nextTeamBQueue.find(bet => bet.id === id);
      if (deletedNextBetB && !betDeleted) {
        const newNextTeamBQueue = nextTeamBQueue.filter(bet => bet.id !== id);
        setNextTeamBQueue(newNextTeamBQueue);
        
        if (deletedNextBetB.booked) {
          const matchedBookedBet = nextBookedBets.find(bookedBet => bookedBet.idB === id);
          if (matchedBookedBet) {
            const newNextTeamAQueue = nextTeamAQueue.map(bet => {
              if (bet.id === matchedBookedBet.idA) {
                return { ...bet, color: null, booked: false };
              }
              return bet;
            });
            setNextTeamAQueue(newNextTeamAQueue);
            
            const newNextBookedBets = nextBookedBets.filter(bookedBet => bookedBet.idB !== id);
            setNextBookedBets(newNextBookedBets);
            
            setNextTotalBookedAmount(prev => prev - matchedBookedBet.amount);
          }
        }
        
        betDeleted = true;
      }
    }
    
    if (betDeleted) {
      toast.success("Bet Deleted", {
        description: `Bet #${id} was deleted successfully`,
      });
      
      playSound("delete");
      setBetId("");
    } else {
      toast.error("Error", {
        description: `No bet found with ID ${id}`,
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
    setTeamABalls(balls);
  };
  
  const handleTeamBBallsChange = (balls: number) => {
    setTeamBBalls(balls);
  };

  const handleTeamAGamesChange = (games: number) => {
    setTeamAGames(games);
  };
  
  const handleTeamBGamesChange = (games: number) => {
    setTeamBGames(games);
  };

  useEffect(() => {
    setGameLabel(`GAME ${currentGameNumber}`);
  }, [currentGameNumber]);

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
            <Button 
              variant="outline" 
              className="border-[#F97316]/50 text-[#F97316] hover:bg-[#F97316]/20 hover:text-[#FBBF24]"
              onClick={handleResetHistory}
            >
              <TimerReset className="h-4 w-4 mr-2" />
              Reset History
            </Button>
          )}
        </div>
        
        <BetConfirmationDialog
          isOpen={confirmation.isOpen}
          onClose={closeBetConfirmation}
          onConfirm={handleConfirmBet}
          team={confirmation.team || ''}
          amount={confirmation.amount}
          isNextGame={confirmation.isNextGame}
        />

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
          onDescriptionChange={setGameDescription} 
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
          gameLabel={gameLabel}
          currentGameNumber={currentGameNumber}
          onTeamANameChange={setTeamAName}
          onTeamBNameChange={setTeamBName}
          onBreakChange={setTeamAHasBreak}
          onTeamAGameWin={handleTeamAWin}
          onTeamBGameWin={handleTeamBWin}
          onGameLabelChange={setGameLabel}
          onCurrentGameNumberChange={setCurrentGameNumber}
          onTeamABallsChange={handleTeamABallsChange}
          onTeamBBallsChange={handleTeamBBallsChange}
          onTeamAGamesChange={handleTeamAGamesChange}
          onTeamBGamesChange={handleTeamBGamesChange}
          onDeleteUnmatchedBets={deleteUnmatchedBets}
        />

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
                                {!bet.booked ? (
                                  <span className="ml-2 px-2 py-0.5 bg-[#F97316]/70 text-xs rounded-xl text-black">OPEN</span>
                                ) : (
                                  <span className="ml-2 px-2 py-0.5 bg-black/30 text-xs rounded-xl flex items-center text-white">
                                    <CheckSquare className="w-3 h-3 mr-1" /> BOOKED
                                  </span>
                                )}
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
                                {!bet.booked ? (
                                  <span className="ml-2 px-2 py-0.5 bg-[#F97316]/70 text-xs rounded-xl text-black">OPEN</span>
                                ) : (
                                  <span className="ml-2 px-2 py-0.5 bg-black/30 text-xs rounded-xl flex items-center text-white">
                                    <CheckSquare className="w-3 h-3 mr-1" /> BOOKED
                                  </span>
                                )}
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
                                {!bet.booked ? (
                                  <span className="ml-2 px-2 py-0.5 bg-[#F97316]/70 text-xs rounded-xl text-black">OPEN</span>
                                ) : (
                                  <span className="ml-2 px-2 py-0.5 bg-black/30 text-xs rounded-xl flex items-center text-white">
                                    <CheckSquare className="w-3 h-3 mr-1" /> BOOKED
                                  </span>
                                )}
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
                                {!bet.booked ? (
                                  <span className="ml-2 px-2 py-0.5 bg-[#F97316]/70 text-xs rounded-xl text-black">OPEN</span>
                                ) : (
                                  <span className="ml-2 px-2 py-0.5 bg-black/30 text-xs rounded-xl flex items-center text-white">
                                    <CheckSquare className="w-3 h-3 mr-1" /> BOOKED
                                  </span>
                                )}
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
