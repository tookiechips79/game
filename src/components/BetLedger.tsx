import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { BetHistoryRecord } from "@/types/user";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Clock, ArrowDown, ArrowUp, Coins, Circle, History, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BetLedgerProps {
  isAdmin?: boolean;
  teamAName?: string;
  teamBName?: string;
}

const BetLedger: React.FC<BetLedgerProps> = ({ 
  isAdmin = false, 
  teamAName = "Player A", 
  teamBName = "Player B" 
}) => {
  const { betHistory, getUserById } = useUser();
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  
  const toggleRecordExpansion = (recordId: string) => {
    const newExpandedRecords = new Set(expandedRecords);
    if (newExpandedRecords.has(recordId)) {
      newExpandedRecords.delete(recordId);
    } else {
      newExpandedRecords.add(recordId);
    }
    setExpandedRecords(newExpandedRecords);
  };
  
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (betHistory.length === 0) {
    return (
      <Card className="mb-8 rounded-2xl" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
        <CardHeader className="pb-2 cursor-pointer" style={{ background: 'linear-gradient(to right, #95deff, #004b6b)' }} onClick={() => setIsCollapsed(!isCollapsed)}>
          <CardTitle className="text-2xl text-center flex items-center justify-between" style={{ color: 'black', textShadow: '0 0 15px rgba(250, 21, 147, 0.8)' }}>
            <div className="flex items-center">
              <History className="h-6 w-6 mr-2" style={{ color: 'black', filter: 'drop-shadow(0 0 10px rgba(250, 21, 147, 0.8))' }} />
              Game History
            </div>
            <div>
              {isCollapsed ? (
                <ChevronDown className="h-6 w-6 text-white" />
              ) : (
                <ChevronUp className="h-6 w-6 text-white" />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        {!isCollapsed && (
          <CardContent className="text-center py-8" style={{ color: '#95deff' }}>
            <p>No bet history recorded yet. Complete a game to see results here.</p>
          </CardContent>
        )}
      </Card>
    );
  }
  
  return (
    <Card className="mb-8 rounded-2xl overflow-hidden" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
      <CardHeader 
        className="pb-2 cursor-pointer"
        style={{ background: 'linear-gradient(to right, #95deff, #004b6b)' }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <CardTitle className="text-2xl text-center flex items-center justify-between" style={{ color: 'black', textShadow: '0 0 15px rgba(250, 21, 147, 0.8)' }}>
          <div className="flex items-center">
            <History className="h-6 w-6 mr-2" style={{ color: 'black', filter: 'drop-shadow(0 0 10px rgba(250, 21, 147, 0.8))' }} />
            Game History
          </div>
          <div>
            {isCollapsed ? (
              <ChevronDown className="h-6 w-6 text-white" />
            ) : (
              <ChevronUp className="h-6 w-6 text-white" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="p-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-xl mb-4" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <TabsTrigger value="all" className="rounded-lg text-white">All Games</TabsTrigger>
              <TabsTrigger value="teamA" className="rounded-lg text-white">Wins by {teamAName}</TabsTrigger>
              <TabsTrigger value="teamB" className="rounded-lg text-white">Wins by {teamBName}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              {renderBetHistory(betHistory)}
            </TabsContent>
            
            <TabsContent value="teamA" className="mt-0">
              {renderBetHistory(betHistory.filter(record => record.winningTeam === 'A'))}
            </TabsContent>
            
            <TabsContent value="teamB" className="mt-0">
              {renderBetHistory(betHistory.filter(record => record.winningTeam === 'B'))}
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
  
  function renderBetHistory(records: BetHistoryRecord[]) {
    return (
      <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
        {records.map((record) => (
          <div 
            key={record.id} 
            className="bg-gray-700/50 rounded-xl border border-gray-600 overflow-hidden transition-all duration-300"
          >
            <div 
              className={`p-4 cursor-pointer ${record.winningTeam === 'A' ? 'border-l-4 border-blue-600' : 'border-l-4 border-purple-600'}`}
              onClick={() => toggleRecordExpansion(record.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${record.winningTeam === 'A' ? 'bg-blue-600/20' : 'bg-purple-600/20'}`}>
                    <Trophy className={`h-5 w-5 ${record.winningTeam === 'A' ? 'text-blue-400' : 'text-purple-400'}`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-200">
                      Game #{record.gameNumber}: {record.winningTeam === 'A' ? teamAName : teamBName} Won
                    </div>
                    <div className="text-sm text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(record.timestamp, { addSuffix: true })}
                      <span className="mx-2">•</span>
                      <span className="text-amber-400/90 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Duration: {formatDuration(record.duration)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="font-medium text-gray-200">{record.totalAmount} Credits</div>
                    <div className="text-sm text-gray-400">{record.bets.teamA.length + record.bets.teamB.length} Bets</div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                  >
                    {expandedRecords.has(record.id) ? (
                      <ArrowUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              
              {expandedRecords.has(record.id) && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700">
                      <div className="text-sm text-gray-400 mb-1">Ball Count</div>
                      <div className="flex justify-between">
                        <div>
                          <span className="font-medium text-blue-400 mr-2">{teamAName}:</span>
                          <span className="text-white">{record.teamABalls}</span>
                        </div>
                        <div>
                          <span className="font-medium text-purple-400 mr-2">{teamBName}:</span>
                          <span className="text-white">{record.teamBBalls}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700">
                      <div className="text-sm text-gray-400 mb-1">Breaker</div>
                      <div className="flex items-center">
                        <Circle className={`h-3 w-3 mr-2 ${record.breakingTeam === 'A' ? 'text-blue-400' : 'text-purple-400'}`} fill="currentColor" />
                        <span className={`font-medium ${record.breakingTeam === 'A' ? 'text-blue-400' : 'text-purple-400'}`}>
                          {record.breakingTeam === 'A' ? teamAName : teamBName}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`bg-gray-800/50 rounded-lg p-3 ${record.winningTeam === 'A' ? 'border-l-2 border-blue-600' : ''}`}>
                      <div className="flex items-center mb-2">
                        <div className="p-1 rounded-md bg-blue-600/20 mr-2">
                          <Users className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="font-medium text-blue-400">{teamAName} Bettors</span>
                      </div>
                      
                      {record.bets.teamA.length > 0 ? (
                        <div className="space-y-2">
                          {record.bets.teamA.map((bet, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-gray-700/30 p-2 rounded-md">
                              <span className="text-sm text-gray-300">{bet.userName}</span>
                              <div className="flex items-center">
                                <span className="text-sm mr-2">{bet.amount}</span>
                                {bet.won ? (
                                  <div className="bg-green-500/20 p-1 rounded-full">
                                    <Coins className="h-3 w-3 text-green-500" />
                                  </div>
                                ) : (
                                  <div className="bg-red-500/20 p-1 rounded-full">
                                    <Coins className="h-3 w-3 text-red-500" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm italic text-gray-500 text-center py-2">
                          No bets on {teamAName}
                        </div>
                      )}
                    </div>
                    
                    <div className={`bg-gray-800/50 rounded-lg p-3 ${record.winningTeam === 'B' ? 'border-l-2 border-purple-600' : ''}`}>
                      <div className="flex items-center mb-2">
                        <div className="p-1 rounded-md bg-purple-600/20 mr-2">
                          <Users className="h-4 w-4 text-purple-400" />
                        </div>
                        <span className="font-medium text-purple-400">{teamBName} Bettors</span>
                      </div>
                      
                      {record.bets.teamB.length > 0 ? (
                        <div className="space-y-2">
                          {record.bets.teamB.map((bet, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-gray-700/30 p-2 rounded-md">
                              <span className="text-sm text-gray-300">{bet.userName}</span>
                              <div className="flex items-center">
                                <span className="text-sm mr-2">{bet.amount}</span>
                                {bet.won ? (
                                  <div className="bg-green-500/20 p-1 rounded-full">
                                    <Coins className="h-3 w-3 text-green-500" />
                                  </div>
                                ) : (
                                  <div className="bg-red-500/20 p-1 rounded-full">
                                    <Coins className="h-3 w-3 text-red-500" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm italic text-gray-500 text-center py-2">
                          No bets on {teamBName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
};

export default BetLedger;
