import React, { useState } from 'react';
import { useUser } from "@/contexts/UserContext";
import { useGameState } from "@/contexts/GameStateContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface SimulationLog {
  step: string;
  details: string;
  timestamp: number;
}

const BettingSimulator = () => {
  const { users, deductCredits, addCredits, systemHealthCheck } = useUser();
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const addLog = (step: string, details: string) => {
    const newLog = { step, details, timestamp: Date.now() };
    setLogs(prev => [...prev, newLog]);
    console.log(`[${step}] ${details}`);
  };

  // Helper to get fresh user data from the users array
  const getLatestUserBalance = (userId: string) => {
    return users.find(u => u.id === userId)?.credits || 0;
  };

  const runSimulation = async () => {
    try {
      setRunning(true);
      setLogs([]);
      setResults(null);

      // Get test users from the latest users array
      const currentUsers = [...users]; // Get fresh copy
      let testUser1 = currentUsers.find(u => u.name === "Admin");
      let testUser2 = currentUsers.find(u => u.name !== "Admin");

      if (!testUser1 || !testUser2) {
        toast.error("Need at least 2 users to simulate");
        setRunning(false);
        return;
      }

      addLog("SETUP", `Starting simulation with ${testUser1.name} and ${testUser2.name}`);

      // Take snapshot of initial state (refresh users from context to get latest)
      testUser1 = users.find(u => u.name === "Admin")!;
      testUser2 = users.find(u => u.name !== "Admin")!;
      
      const initialSnapshot = {
        user1: { name: testUser1.name, credits: testUser1.credits },
        user2: { name: testUser2.name, credits: testUser2.credits },
        totalInitial: testUser1.credits + testUser2.credits
      };

      addLog("SNAPSHOT", `Initial - ${testUser1.name}: ${testUser1.credits}, ${testUser2.name}: ${testUser2.credits}, Total: ${initialSnapshot.totalInitial}`);

      // Simulate 5 games
      for (let gameNum = 1; gameNum <= 5; gameNum++) {
        addLog(`GAME-${gameNum}`, `Starting Game #${gameNum}`);

        // Define bets for this game (3 different bet amounts)
        const betAmounts = [100, 50, 75];
        const teamAWins = gameNum % 2 === 1; // Alternate winner
        const winningTeam = teamAWins ? 'A' : 'B';

        // Simulate bet placement
        const placedBets: Array<{ user: string; team: string; amount: number }> = [];

        for (let i = 0; i < betAmounts.length; i++) {
          const amount = betAmounts[i];
          
          // User 1 bets on Team A
          const user1BalanceBefore = getLatestUserBalance(testUser1.id);
          const deducted1 = await deductCredits(testUser1.id, amount);
          if (deducted1) {
            placedBets.push({ user: testUser1.name, team: 'A', amount });
            // Wait for state to update
            await new Promise(resolve => setTimeout(resolve, 50));
            const user1BalanceAfter = getLatestUserBalance(testUser1.id);
            addLog(`BET-PLACED`, `${testUser1.name} bets ${amount} on Team A (${user1BalanceBefore} → ${user1BalanceAfter})`);
          }

          // User 2 bets on Team B
          const user2BalanceBefore = getLatestUserBalance(testUser2.id);
          const deducted2 = await deductCredits(testUser2.id, amount);
          if (deducted2) {
            placedBets.push({ user: testUser2.name, team: 'B', amount });
            // Wait for state to update
            await new Promise(resolve => setTimeout(resolve, 50));
            const user2BalanceAfter = getLatestUserBalance(testUser2.id);
            addLog(`BET-PLACED`, `${testUser2.name} bets ${amount} on Team B (${user2BalanceBefore} → ${user2BalanceAfter})`);
          }
        }

        const totalBetAmount = placedBets.reduce((s, b) => s + b.amount, 0);
        addLog(`GAME-${gameNum}`, `Total bets placed: ${placedBets.length} bets, ${totalBetAmount} coins deducted from players`);
        
        // Log current balances after bets (read fresh from users array)
        const user1AfterBets = getLatestUserBalance(testUser1.id);
        const user2AfterBets = getLatestUserBalance(testUser2.id);
        addLog(`GAME-${gameNum}-BALANCE`, `After bets - ${testUser1.name}: ${user1AfterBets}, ${testUser2.name}: ${user2AfterBets}, Total: ${user1AfterBets + user2AfterBets}`);

        // Simulate game result
        addLog(`GAME-${gameNum}-RESULT`, `Game #${gameNum}: ${winningTeam} wins! Processing bets...`);

        // Calculate payouts
        // Key: Loser's coins are ALREADY deducted. Winner gets their bet back + loser's bet
        if (teamAWins) {
          // User 1 wins (Team A wins)
          let totalWinnings = 0;
          for (const amount of betAmounts) {
            addCredits(testUser1.id, amount * 2, false, `game_${gameNum}_win`);
            totalWinnings += amount * 2;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
          const user1FinalBalance = getLatestUserBalance(testUser1.id);
          addLog(`PAYOUT-${gameNum}`, `${testUser1.name} wins ${totalWinnings} coins (new balance: ${user1FinalBalance})`);
        } else {
          // User 2 wins (Team B wins)
          let totalWinnings = 0;
          for (const amount of betAmounts) {
            addCredits(testUser2.id, amount * 2, false, `game_${gameNum}_win`);
            totalWinnings += amount * 2;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
          const user2FinalBalance = getLatestUserBalance(testUser2.id);
          addLog(`PAYOUT-${gameNum}`, `${testUser2.name} wins ${totalWinnings} coins (new balance: ${user2FinalBalance})`);
        }

        // Delay before next game
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      addLog("SIMULATION", "All 5 games completed!");

      // Refresh user data and take final snapshot
      await new Promise(resolve => setTimeout(resolve, 1000));

      const finalUser1 = users.find(u => u.id === testUser1.id);
      const finalUser2 = users.find(u => u.id === testUser2.id);

      const finalSnapshot = {
        user1: { name: finalUser1?.name, credits: finalUser1?.credits },
        user2: { name: finalUser2?.name, credits: finalUser2?.credits },
        totalFinal: (finalUser1?.credits || 0) + (finalUser2?.credits || 0)
      };

      addLog("FINAL-SNAPSHOT", `Final - ${finalUser1?.name}: ${finalUser1?.credits}, ${finalUser2?.name}: ${finalUser2?.credits}, Total: ${finalSnapshot.totalFinal}`);

      // Compare and verify
      const difference = finalSnapshot.totalFinal - initialSnapshot.totalInitial;
      const balances = difference === 0 ? "✅ BALANCED" : "❌ MISMATCH";

      addLog("VERIFICATION", `Initial Total: ${initialSnapshot.totalInitial} | Final Total: ${finalSnapshot.totalFinal} | Difference: ${difference} | ${balances}`);

      const simulationResults = {
        initial: initialSnapshot,
        final: finalSnapshot,
        difference,
        balanced: difference === 0,
        games: 5,
        betsPerGame: 6, // 3 amounts × 2 users
        totalBets: 30
      };

      setResults(simulationResults);
      toast.success("Simulation completed! Check results below.");

    } catch (error) {
      console.error("Simulation error:", error);
      addLog("ERROR", String(error));
      toast.error("Simulation failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-2 text-[#95deff]">🎮 Betting Simulator</h1>
      <p className="text-gray-400 mb-8">Simulate 5 games with 3 different bet amounts per user and verify totals</p>

      <Button
        onClick={runSimulation}
        disabled={running}
        className="mb-8 bg-gradient-to-r from-[#fa1593] to-[#fa1593]/80 hover:from-[#fa1593]/90 hover:to-[#fa1593]/70 disabled:opacity-50"
      >
        {running ? "🔄 Running Simulation..." : "▶️ Start Simulation"}
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Results Summary */}
        {results && (
          <>
            <Card className="border-2 border-[#95deff] bg-gray-900">
              <CardHeader>
                <CardTitle className="text-[#95deff]">📊 Initial State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>{results.initial.user1.name}</span>
                  <span className="text-green-400 font-bold">{results.initial.user1.credits}</span>
                </div>
                <div className="flex justify-between">
                  <span>{results.initial.user2.name}</span>
                  <span className="text-green-400 font-bold">{results.initial.user2.credits}</span>
                </div>
                <div className="border-t border-[#95deff]/30 pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-[#95deff]">{results.initial.totalInitial}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#95deff] bg-gray-900">
              <CardHeader>
                <CardTitle className="text-[#95deff]">📊 Final State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>{results.final.user1.name}</span>
                  <span className="text-blue-400 font-bold">{results.final.user1.credits}</span>
                </div>
                <div className="flex justify-between">
                  <span>{results.final.user2.name}</span>
                  <span className="text-blue-400 font-bold">{results.final.user2.credits}</span>
                </div>
                <div className="border-t border-[#95deff]/30 pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-[#95deff]">{results.final.totalFinal}</span>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 ${results.balanced ? 'border-green-500' : 'border-red-500'} bg-gray-900`}>
              <CardHeader>
                <CardTitle className={results.balanced ? 'text-green-400' : 'text-red-400'}>
                  {results.balanced ? '✅ RESULT' : '❌ RESULT'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Difference</span>
                  <span className={results.balanced ? 'text-green-400' : 'text-red-400'} >
                    {results.difference}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className={results.balanced ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                    {results.balanced ? 'BALANCED ✓' : 'MISMATCH ✗'}
                  </span>
                </div>
                <div className="border-t border-[#95deff]/30 pt-3 text-xs text-gray-400">
                  {results.games} games × {results.betsPerGame} bets = {results.totalBets} total bets
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Simulation Log */}
      <Card className="border-2 border-[#95deff] bg-gray-900">
        <CardHeader>
          <CardTitle className="text-[#95deff]">📋 Simulation Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">Click "Start Simulation" to begin...</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="flex gap-3 text-gray-300">
                  <span className="text-[#fa1593] font-bold min-w-fit">[{log.step}]</span>
                  <span className="text-gray-400">{log.details}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BettingSimulator;

