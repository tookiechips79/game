
import React, { useState } from "react";
import { UserBetReceipt } from "@/types/user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Calendar, ReceiptText, ChevronDown, ChevronUp, Circle, User } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserBetReceiptsProps {
  receipts: UserBetReceipt[];
  teamAName?: string;
  teamBName?: string;
  alwaysVisible?: boolean;
}

const UserBetReceipts: React.FC<UserBetReceiptsProps> = ({ 
  receipts, 
  teamAName = "Player A",
  teamBName = "Player B",
  alwaysVisible = true
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  return (
    <div className="w-full">
      <div 
        className="flex justify-between items-center mb-3 cursor-pointer p-2 rounded-lg border"
        style={{ backgroundColor: '#052240', borderColor: '#95deff' }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center">
          <ReceiptText className="h-5 w-5 mr-2" style={{ color: '#fa1593' }} />
          <h3 className="font-bold text-white">Bet Receipts ({receipts.length})</h3>
        </div>
        <div style={{ color: '#fa1593' }}>
          {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {receipts.length === 0 ? (
            <div className="text-center py-6 flex flex-col items-center text-white">
              <ReceiptText className="h-10 w-10 mb-2 opacity-50" style={{ color: '#95deff' }} />
              <p>No bet receipts found</p>
              {alwaysVisible && (
                <p className="mt-2 text-sm text-white">
                  Your bet history will appear here after you place bets
                </p>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {receipts.map((receipt) => (
                  <Card 
                    key={receipt.id}
                    className={`border rounded-xl ${
                      receipt.won 
                        ? 'bg-green-950/30 border-green-800/50' 
                        : 'bg-red-950/30 border-red-800/50'
                    } hover:shadow-lg transition-all duration-300`}
                    style={{ backgroundColor: '#052240', borderColor: receipt.teamSide === 'A' ? '#95deff' : '#fa1593' }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{
                            backgroundColor: receipt.teamSide === 'A' ? '#95deff/20' : '#fa1593/20',
                            color: receipt.teamSide === 'A' ? '#95deff' : '#fa1593',
                            borderColor: receipt.teamSide === 'A' ? '#95deff/50' : '#fa1593/50'
                          }}
                        >
                          {receipt.teamSide === 'A' ? teamAName : teamBName}
                        </Badge>
                        <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${
                          receipt.won 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {receipt.won ? '+' : '-'}{receipt.amount} coins
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 mb-2">
                        <User className="h-4 w-4" style={{ color: '#fa1593' }} />
                        <span className="text-white">{receipt.userName}</span>
                      </div>
                      
                      <div className="text-sm mb-1">
                        <span style={{ color: '#fa1593' }}>Game #{receipt.gameNumber}:</span>{' '}
                        <span className="text-white">
                          {receipt.teamSide === 'A' ? teamAName : teamBName} vs {receipt.teamSide === 'A' ? teamBName : teamAName}
                        </span>
                      </div>
                      
                      <div className="text-sm mb-3">
                        <span style={{ color: '#fa1593' }}>Winner:</span>{' '}
                        <span style={{ color: receipt.winningTeam === 'A' ? '#95deff' : '#fa1593' }}>
                          {receipt.winningTeam === 'A' ? teamAName : teamBName}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-xs text-white">
                        <div className="flex items-center">
                          <Trophy className="h-3 w-3 mr-1" style={{ color: '#fa1593' }} />
                          {receipt.won ? 'Win' : 'Loss'} #{receipt.id.substring(0, 8)}...
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" style={{ color: '#fa1593' }} />
                          {format(new Date(receipt.timestamp), "h:mm a")}
                          <Calendar className="h-3 w-3 mx-1" style={{ color: '#fa1593' }} />
                          {format(new Date(receipt.timestamp), "MMM d, yyyy")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </>
      )}
    </div>
  );
};

export default UserBetReceipts;
