
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronDown, ChevronUp, CircleDollarSign, 
  Receipt, EyeOff, ReceiptText
} from "lucide-react";
import { User, UserBetReceipt, Bet } from "@/types/user";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface UserBetHistoryWidgetProps {
  user: User;
  betReceipts: UserBetReceipt[];
  activeBets: { teamA: Bet[], teamB: Bet[] };
  teamAName?: string;
  teamBName?: string;
  alwaysVisible?: boolean;
}

const UserBetHistoryWidget: React.FC<UserBetHistoryWidgetProps> = ({ 
  user, 
  betReceipts, 
  activeBets,
  teamAName = "Player A",
  teamBName = "Player B",
  alwaysVisible = true
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(false);
  
  // Calculate stats
  const totalBets = betReceipts.length;
  const wins = betReceipts.filter(receipt => receipt.won).length;
  const losses = betReceipts.filter(receipt => !receipt.won).length;
  const winRate = totalBets > 0 ? Math.round((wins / totalBets) * 100) : 0;
  
  // Count active bets
  const bookedBetsA = activeBets.teamA.filter(bet => bet.booked);
  const bookedBetsB = activeBets.teamB.filter(bet => bet.booked);
  const totalActiveBets = bookedBetsA.length + bookedBetsB.length;
  
  // Check if we should display the widget
  const shouldDisplay = alwaysVisible || totalBets > 0 || totalActiveBets > 0;
  
  if (!shouldDisplay) {
    return null;
  }
  
  if (isHidden) {
    return (
      <div
        className="w-full bg-[#a3e635]/50 border border-[#a3e635]/50 hover:bg-[#a3e635]/40 text-center py-2 px-4 rounded-md cursor-pointer flex items-center justify-center"
        onClick={() => setIsHidden(false)}
      >
        <Receipt className="h-4 w-4 mr-2" />
        <span>Show User Receipts</span>
      </div>
    );
  }
  
  return (
    <Card className="bg-[#a3e635]/90 border border-[#a3e635]/70 overflow-hidden transition-all duration-300 w-52 shadow-lg rounded-xl">
      <CardContent className="p-0">
        {/* Header */}
        <div 
          className="p-3 bg-gradient-to-r from-[#a3e635]/80 to-[#a3e635] cursor-pointer flex items-center justify-between rounded-t-xl"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center">
            <Receipt className="h-5 w-5 text-black mr-2" />
            <h3 className="font-bold text-black">User Receipts</h3>
          </div>
          <div className="flex items-center space-x-1">
            <div
              className="h-6 w-6 text-black hover:text-black hover:bg-[#a3e635]/50 rounded-full flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                setIsHidden(true);
              }}
            >
              <EyeOff className="h-4 w-4" />
            </div>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-black" />
            ) : (
              <ChevronDown className="h-5 w-5 text-black" />
            )}
          </div>
        </div>
        
        {/* Summary Stats (Always visible) */}
        <div className="p-3 bg-[#a3e635]/40">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="flex flex-col items-center justify-center bg-[#a3e635]/30 p-2 rounded-md">
              <span className="text-xs text-black">Total Bets</span>
              <span className="text-lg font-bold text-black">{totalBets}</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-[#a3e635]/30 p-2 rounded-md">
              <span className="text-xs text-black">Active Bets</span>
              <span className="text-lg font-bold text-black">{totalActiveBets}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-[#a3e635]/20 p-2 rounded-md">
            <div className="flex items-center">
              <span className="text-green-700 font-semibold">{wins} wins</span>
            </div>
            <div className="text-black font-semibold">
              {winRate}%
            </div>
            <div className="flex items-center">
              <span className="text-red-700 font-semibold">{losses} losses</span>
            </div>
          </div>
        </div>
        
        {/* Expanded content */}
        {expanded && (
          <div className="bg-[#a3e635]/20 rounded-b-xl">
            {/* Recent Bet Receipts Section */}
            {betReceipts.length > 0 ? (
              <div className="p-3">
                <h4 className="font-semibold text-black mb-2 flex items-center">
                  <ReceiptText className="h-4 w-4 mr-1" />
                  Recent Bet Receipts
                </h4>
                <ScrollArea className="h-36 pr-2">
                  <div className="space-y-2">
                    {betReceipts.map(receipt => (
                      <div 
                        key={receipt.id} 
                        className={`p-2 ${
                          receipt.teamSide === 'A' 
                            ? 'bg-[#1EAEDB]/50 border border-[#1EAEDB]/50' 
                            : 'bg-green-600/50 border border-green-600/50'
                        } rounded-md`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <Badge 
                            variant="outline" 
                            className={`${
                              receipt.teamSide === 'A' 
                                ? 'bg-[#1EAEDB]/70 text-black border-[#1EAEDB]/70' 
                                : 'bg-green-600/70 text-black border-green-600/70'
                            }`}
                          >
                            {receipt.teamSide === 'A' ? teamAName : teamBName}
                          </Badge>
                          <Badge 
                            className={receipt.won 
                              ? 'bg-green-700 text-green-100' 
                              : 'bg-red-700 text-red-100'
                            }
                          >
                            {receipt.won ? 'Won' : 'Lost'} {receipt.amount}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-black">Game #{receipt.gameNumber}</span>
                          <div>
                            <Badge variant="outline" className="bg-black/20 text-black border-black/30">
                              {format(new Date(receipt.timestamp), "MM/dd • h:mm a")}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : alwaysVisible ? (
              <div className="p-3 text-center text-black">
                <p>No bet receipts</p>
                <p className="mt-1 text-xs text-gray-700">Your bet history will appear here</p>
              </div>
            ) : (
              <div className="p-3 text-center text-black">
                <p>No bet receipts</p>
              </div>
            )}
            
            {/* Active Bets Section - Only shown if there are active bets */}
            {totalActiveBets > 0 && (
              <div className="p-3 border-t border-[#a3e635]/50">
                <h4 className="font-semibold text-black mb-2 flex items-center">
                  <CircleDollarSign className="h-4 w-4 mr-1" />
                  Active Matched Bets
                </h4>
                <div className="text-sm text-center text-black p-2 bg-[#a3e635]/30 rounded-md">
                  {totalActiveBets} active bet{totalActiveBets !== 1 ? 's' : ''} in progress
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserBetHistoryWidget;
