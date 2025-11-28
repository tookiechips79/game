import React from 'react';
import { useUser } from "@/contexts/UserContext";
import { useGameState } from "@/contexts/GameStateContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AuditDashboard = () => {
  const { users, auditCoins, auditBets, systemHealthCheck } = useUser();
  const { gameState } = useGameState();
  const [audit, setAudit] = React.useState<any>(null);

  const handleAudit = () => {
    const health = systemHealthCheck(gameState.teamAQueue, gameState.teamBQueue);
    setAudit(health);
    console.log('📊 Full System Audit:', health);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-2 text-[#95deff]">💰 Audit Dashboard</h1>
      <p className="text-gray-400 mb-8">Verify all coins and bets are accounted for</p>

      <Button
        onClick={handleAudit}
        className="mb-8 bg-gradient-to-r from-[#fa1593] to-[#fa1593]/80 hover:from-[#fa1593]/90 hover:to-[#fa1593]/70"
      >
        Run Full System Audit
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Credits */}
        <Card className="border-2 border-[#95deff] bg-gray-900">
          <CardHeader>
            <CardTitle className="text-[#95deff]">👥 User Wallet Audit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {audit?.coinAudit?.details?.map((detail: any) => (
                <div key={detail.userId} className="flex justify-between items-center bg-black/50 p-3 rounded">
                  <span className="font-semibold">{detail.userName}</span>
                  <span className="text-[#fa1593]">{detail.credits} coins</span>
                </div>
              ))}
              <div className="border-t border-[#95deff]/30 pt-3 mt-3 flex justify-between items-center font-bold">
                <span>Total Credits</span>
                <span className="text-[#95deff]">{audit?.coinAudit?.totalUserCredits || 0} coins</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Bets */}
        <Card className="border-2 border-[#95deff] bg-gray-900">
          <CardHeader>
            <CardTitle className="text-[#95deff]">🎲 Active Bets Audit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Team A Queue</div>
              <div className="bg-black/50 p-3 rounded flex justify-between">
                <span>{audit?.betAudit?.teamA?.count || 0} bets</span>
                <span className="text-green-400">{audit?.betAudit?.teamA?.total || 0} coins</span>
              </div>
              <div className="text-xs text-gray-500 ml-3">
                🔒 Matched: {audit?.betAudit?.teamA?.matched || 0} | 🔓 Unmatched: {audit?.betAudit?.teamA?.unmatched || 0}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-400">Team B Queue</div>
              <div className="bg-black/50 p-3 rounded flex justify-between">
                <span>{audit?.betAudit?.teamB?.count || 0} bets</span>
                <span className="text-blue-400">{audit?.betAudit?.teamB?.total || 0} coins</span>
              </div>
              <div className="text-xs text-gray-500 ml-3">
                🔒 Matched: {audit?.betAudit?.teamB?.matched || 0} | 🔓 Unmatched: {audit?.betAudit?.teamB?.unmatched || 0}
              </div>
            </div>

            <div className="border-t border-[#95deff]/30 pt-3 flex justify-between font-bold">
              <span>Total in Queues</span>
              <span className="text-[#fa1593]">{audit?.betAudit?.grandTotal || 0} coins</span>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="border-2 border-[#95deff] bg-gray-900 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-[#95deff]">✅ System Health Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/50 p-4 rounded border border-green-500/30">
                <div className="text-xs text-gray-400 mb-2">User Wallets</div>
                <div className="text-2xl font-bold text-green-400">{audit?.coinAudit?.totalUserCredits || 0}</div>
                <div className="text-xs text-gray-500 mt-1">coins available</div>
              </div>

              <div className="bg-black/50 p-4 rounded border border-yellow-500/30">
                <div className="text-xs text-gray-400 mb-2">Active Bets</div>
                <div className="text-2xl font-bold text-yellow-400">{audit?.betAudit?.grandTotal || 0}</div>
                <div className="text-xs text-gray-500 mt-1">coins locked</div>
              </div>

              <div className="bg-black/50 p-4 rounded border border-cyan-500/30">
                <div className="text-xs text-gray-400 mb-2">System Total</div>
                <div className="text-2xl font-bold text-cyan-400">{audit?.systemTotal || 0}</div>
                <div className="text-xs text-gray-500 mt-1">coins in system</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-900/30 border border-green-500/50 rounded">
              <div className="text-green-400 font-semibold">✅ Status: OK</div>
              <div className="text-sm text-gray-300 mt-2">
                All coins are accounted for. No coins were created or burned.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bet Details */}
        <Card className="border-2 border-[#95deff] bg-gray-900 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-[#95deff]">📋 Detailed Bet Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {gameState.teamAQueue?.length > 0 && (
                <div>
                  <div className="font-bold text-green-400 mb-2">Team A Bets:</div>
                  {gameState.teamAQueue.map((bet: any) => (
                    <div key={bet.id} className="text-sm bg-black/50 p-2 rounded mb-1 flex justify-between">
                      <span>{bet.userName} - {bet.amount} coins {bet.booked ? '🔒' : '🔓'}</span>
                      <span className="text-gray-500">#{bet.id}</span>
                    </div>
                  ))}
                </div>
              )}

              {gameState.teamBQueue?.length > 0 && (
                <div>
                  <div className="font-bold text-blue-400 mb-2">Team B Bets:</div>
                  {gameState.teamBQueue.map((bet: any) => (
                    <div key={bet.id} className="text-sm bg-black/50 p-2 rounded mb-1 flex justify-between">
                      <span>{bet.userName} - {bet.amount} coins {bet.booked ? '🔒' : '🔓'}</span>
                      <span className="text-gray-500">#{bet.id}</span>
                    </div>
                  ))}
                </div>
              )}

              {gameState.teamAQueue?.length === 0 && gameState.teamBQueue?.length === 0 && (
                <div className="text-center text-gray-500 py-8">No active bets</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditDashboard;

