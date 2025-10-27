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
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (betHistory.length === 0) {
    return (
      <Card className="mb-8 rounded-2xl border-2 overflow-hidden shadow-[0_0_30px_rgba(250,21,147,0.8)]" style={{ backgroundColor: '#052240', borderColor: '#fa1593' }}>
        <CardHeader className="pb-2 cursor-pointer" style={{ background: 'linear-gradient(to right, #fa1593, #004b6b)' }} onClick={() => setIsCollapsed(!isCollapsed)}>
          <CardTitle className="text-2xl text-center flex items-center justify-between text-white">
            <div className="flex items-center">
              <History className="h-6 w-6 mr-2" style={{ color: '#95deff' }} />
              BET LEDGER
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
          <CardContent className="text-center py-8 text-white">
            <p>No bet history recorded yet. Complete a game to see results here.</p>
          </CardContent>
        )}
      </Card>
    );
  }
  
  return (
    <Card className="mb-8 rounded-2xl overflow-hidden border-2 shadow-[0_0_30px_rgba(250,21,147,0.8)]" style={{ backgroundColor: '#052240', borderColor: '#fa1593' }}>
      <CardHeader 
        className="pb-2 cursor-pointer"
        style={{ background: 'linear-gradient(to right, #fa1593, #004b6b)' }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <CardTitle className="text-2xl text-center flex items-center justify-between text-white">
          <div className="flex items-center">
            <History className="h-6 w-6 mr-2" style={{ color: '#95deff' }} />
            BET LEDGER
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
            className="rounded-xl overflow-hidden transition-all duration-300"
            style={{
              backgroundColor: '#052240',
              border: `1px solid ${record.winningTeam === 'A' ? '#95deff' : '#fa1593'}30`,
              borderLeft: `4px solid ${record.winningTeam === 'A' ? '#95deff' : '#fa1593'}`
            }}
          >
            <div 
              className="p-4 cursor-pointer"
              onClick={() => toggleRecordExpansion(record.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div style={{ 
                    backgroundColor: record.winningTeam === 'A' ? '#95deff20' : '#fa159320',
                    padding: '8px',
                    borderRadius: '9999px'
                  }}>
                    <Trophy style={{ 
                      width: '20px',
                      height: '20px',
                      color: record.winningTeam === 'A' ? '#95deff' : '#fa1593'
                    }} />
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      Game #{record.gameNumber}: {record.winningTeam === 'A' ? teamAName : teamBName} Won
                    </div>
                    <div className="text-sm text-gray-300 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {record.timestamp && record.timestamp > 0 ? formatDistanceToNow(record.timestamp, { addSuffix: true }) : 'Unknown time'}
                      <span className="mx-2">•</span>
                      <span style={{ color: '#95deff' }} className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Duration: {formatDuration(record.duration || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="font-medium text-white">{record.totalAmount || 0} Credits</div>
                    <div className="text-sm text-gray-300">{(record.bets?.teamA?.length || 0) + (record.bets?.teamB?.length || 0)} Bets</div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                  >
                    {expandedRecords.has(record.id) ? (
                      <ArrowUp className="h-4 w-4" style={{ color: '#95deff' }} />
                    ) : (
                      <ArrowDown className="h-4 w-4" style={{ color: '#95deff' }} />
                    )}
                  </Button>
                </div>
              </div>
              
              {expandedRecords.has(record.id) && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(149, 222, 255, 0.2)' }}>
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div className="rounded-lg p-3" style={{ backgroundColor: '#004b6b', border: '1px solid #95deff40' }}>
                      <div className="text-sm text-gray-300 mb-1">Ball Count</div>
                      <div className="flex justify-between">
                        <div>
                          <span className="font-medium mr-2" style={{ color: '#95deff' }}>{teamAName}:</span>
                          <span className="text-white">{record.teamABalls || 0}</span>
                        </div>
                        <div>
                          <span className="font-medium mr-2" style={{ color: '#fa1593' }}>{teamBName}:</span>
                          <span className="text-white">{record.teamBBalls || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg p-3" style={{ backgroundColor: '#004b6b', border: '1px solid #fa159340' }}>
                      <div className="text-sm text-gray-300 mb-1">Breaker</div>
                      <div className="flex items-center">
                        <Circle style={{ 
                          width: '12px',
                          height: '12px',
                          marginRight: '8px',
                          color: record.breakingTeam === 'A' ? '#95deff' : '#fa1593',
                          fill: 'currentColor'
                        }} />
                        <span className="font-medium" style={{ color: record.breakingTeam === 'A' ? '#95deff' : '#fa1593' }}>
                          {record.breakingTeam === 'A' ? teamAName : record.breakingTeam === 'B' ? teamBName : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg p-3" style={{ 
                      backgroundColor: '#004b6b',
                      borderLeft: record.winningTeam === 'A' ? '2px solid #95deff' : 'none'
                    }}>
                      <div className="flex items-center mb-2">
                        <div className="p-1 rounded-md mr-2" style={{ backgroundColor: '#95deff20' }}>
                          <Users className="h-4 w-4" style={{ color: '#95deff' }} />
                        </div>
                        <span className="font-medium" style={{ color: '#95deff' }}>{teamAName} Bettors</span>
                      </div>
                      
                      {record.bets.teamA.length > 0 ? (
                        <div className="space-y-2">
                          {record.bets.teamA.map((bet, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-md" style={{ backgroundColor: '#003d52' }}>
                              <span className="text-sm text-white">{bet.userName}</span>
                              <div className="flex items-center">
                                <span className="text-sm mr-2 text-white">{bet.amount}</span>
                                {bet.won ? (
                                  <div style={{ backgroundColor: '#00AA0020', padding: '4px', borderRadius: '9999px' }}>
                                    <Coins className="h-3 w-3" style={{ color: '#00AA00' }} />
                                  </div>
                                ) : (
                                  <div style={{ backgroundColor: '#FF000020', padding: '4px', borderRadius: '9999px' }}>
                                    <Coins className="h-3 w-3" style={{ color: '#FF0000' }} />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm italic text-gray-400 text-center py-2">
                          No bets on {teamAName}
                        </div>
                      )}
                    </div>
                    
                    <div className="rounded-lg p-3" style={{ 
                      backgroundColor: '#004b6b',
                      borderLeft: record.winningTeam === 'B' ? '2px solid #fa1593' : 'none'
                    }}>
                      <div className="flex items-center mb-2">
                        <div className="p-1 rounded-md mr-2" style={{ backgroundColor: '#fa159320' }}>
                          <Users className="h-4 w-4" style={{ color: '#fa1593' }} />
                        </div>
                        <span className="font-medium" style={{ color: '#fa1593' }}>{teamBName} Bettors</span>
                      </div>
                      
                      {record.bets.teamB.length > 0 ? (
                        <div className="space-y-2">
                          {record.bets.teamB.map((bet, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-md" style={{ backgroundColor: '#003d52' }}>
                              <span className="text-sm text-white">{bet.userName}</span>
                              <div className="flex items-center">
                                <span className="text-sm mr-2 text-white">{bet.amount}</span>
                                {bet.won ? (
                                  <div style={{ backgroundColor: '#00AA0020', padding: '4px', borderRadius: '9999px' }}>
                                    <Coins className="h-3 w-3" style={{ color: '#00AA00' }} />
                                  </div>
                                ) : (
                                  <div style={{ backgroundColor: '#FF000020', padding: '4px', borderRadius: '9999px' }}>
                                    <Coins className="h-3 w-3" style={{ color: '#FF0000' }} />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm italic text-gray-400 text-center py-2">
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
