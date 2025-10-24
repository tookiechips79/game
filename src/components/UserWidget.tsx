
import React, { useState } from "react";
import { Wallet, Coins, Trophy, Settings, Receipt, CircleDollarSign, ChevronDown, ChevronUp, ReceiptText } from "lucide-react";
import { User, UserBetReceipt, Bet } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface UserWidgetProps {
  user: User;
  activeBetAmount: number;
  bookedAmount?: number;
  isActive?: boolean;
  hideCredits?: boolean;
  betReceipts?: UserBetReceipt[];
  activeBets?: { teamA: Bet[], teamB: Bet[] };
  teamAName?: string;
  teamBName?: string;
}

const UserWidget: React.FC<UserWidgetProps> = ({ 
  user, 
  activeBetAmount,
  bookedAmount = 0,
  isActive = false,
  hideCredits = false,
  betReceipts = [],
  activeBets = { teamA: [], teamB: [] },
  teamAName = "Player A",
  teamBName = "Player B"
}) => {
  const [receiptsExpanded, setReceiptsExpanded] = useState<boolean>(false);

  const availableCredits = user.credits;
  const totalCredits = availableCredits + bookedAmount + (activeBetAmount - bookedAmount);
  
  // Calculate bet receipts stats
  const totalBets = betReceipts.length;
  const wins = betReceipts.filter(receipt => receipt.won).length;
  const losses = betReceipts.filter(receipt => !receipt.won).length;
  const winRate = totalBets > 0 ? Math.round((wins / totalBets) * 100) : 0;
  
  // Count active bets
  const bookedBetsA = activeBets.teamA.filter(bet => bet.booked);
  const bookedBetsB = activeBets.teamB.filter(bet => bet.booked);
  const totalActiveBets = bookedBetsA.length + bookedBetsB.length;

  return (
    <div className="w-full">
      {/* Main Horizontal Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-3 md:space-y-0">
        {/* User Info */}
        <div className="flex items-center space-x-3">
          <div className="relative bg-gradient-to-br from-pink-600 via-rose-500 to-fuchsia-500 p-2 rounded-lg shadow-lg ring-2 ring-pink-500/50">
            <Wallet className="h-5 w-5 text-white" />
            <span className="absolute -top-1 -right-1 text-xs font-bold bg-white text-pink-600 rounded-full px-1.5 py-0.5 shadow-md">
                        {totalCredits}
                      </span>
                    </div>
          <div>
            <div className="text-sm font-bold text-white">{user.name}</div>
            <div className="text-xs text-pink-400 font-medium">Wallet</div>
                  </div>
                </div>
                
        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          {/* Available */}
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-pink-500/20 rounded-lg ring-1 ring-pink-500/30">
              <Wallet className="h-4 w-4 text-pink-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-pink-300">{availableCredits}</div>
              <div className="text-xs text-gray-400">Available</div>
            </div>
                    </div>
                    
          {/* Divider */}
          <div className="hidden md:block h-8 w-px bg-pink-500/30"></div>

          {/* Booked */}
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-pink-500/20 rounded-lg ring-1 ring-pink-500/30">
              <Coins className="h-4 w-4 text-pink-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-pink-300">{bookedAmount}</div>
              <div className="text-xs text-gray-400">Booked</div>
            </div>
                    </div>
                    
          {/* Divider */}
          <div className="hidden md:block h-8 w-px bg-pink-500/30"></div>

          {/* Total */}
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-pink-500/20 rounded-lg ring-1 ring-pink-500/30">
              <Trophy className="h-4 w-4 text-pink-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-pink-300">{totalCredits}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
                      </div>
                      
          {/* Divider */}
          <div className="hidden md:block h-8 w-px bg-pink-500/30"></div>

          {/* Bet Stats */}
          {(totalBets > 0 || totalActiveBets > 0) && (
            <>
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-pink-500/20 rounded-lg ring-1 ring-pink-500/30">
                  <Receipt className="h-4 w-4 text-pink-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-pink-300">{totalBets}</div>
                  <div className="text-xs text-gray-400">All Bets</div>
                </div>
                      </div>
                      
              <div className="hidden md:block h-8 w-px bg-pink-500/30"></div>

              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-pink-500/20 rounded-lg ring-1 ring-pink-500/30">
                  <CircleDollarSign className="h-4 w-4 text-pink-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-pink-300">{totalActiveBets}</div>
                  <div className="text-xs text-gray-400">Active</div>
                      </div>
                    </div>

              <div className="hidden md:block h-8 w-px bg-pink-500/30"></div>

              <div className="flex items-center space-x-2">
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg font-bold text-green-400">{wins}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-lg font-bold text-red-400">{losses}</span>
                  </div>
                  <div className="text-xs text-gray-400">{winRate}% Win Rate</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 md:ml-auto">
          <Link to="/subscription">
            <Button variant="lime" size="sm" className="text-xs font-semibold">
                          Get Coins
                        </Button>
                      </Link>
        </div>
                    </div>

      {/* Expandable Receipts Section */}
      {(betReceipts.length > 0 || totalActiveBets > 0) && (
        <div className="mt-3 pt-3 border-t border-pink-500/30">
          {/* Header */}
          <div 
            className="cursor-pointer flex items-center justify-between hover:bg-pink-500/10 rounded-lg p-2 transition-all"
            onClick={() => setReceiptsExpanded(!receiptsExpanded)}
          >
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-pink-500/20 rounded-lg ring-1 ring-pink-500/30">
                <Receipt className="h-4 w-4 text-pink-400" />
                      </div>
              <h3 className="font-bold text-white text-sm">Bet Receipts</h3>
                      </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-400">{totalBets}</span>
                  <span className="text-gray-500">Bets</span>
                    </div>
                <div className="flex items-center space-x-1">
                  <span className="text-green-400 font-semibold">{wins}W</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-red-400 font-semibold">{losses}L</span>
                </div>
              </div>
              {receiptsExpanded ? (
                <ChevronUp className="h-4 w-4 text-pink-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-pink-400" />
              )}
            </div>
          </div>
          
          {/* Expanded content */}
          {receiptsExpanded && (
            <div className="mt-3">
              {/* Recent Bet Receipts */}
              {betReceipts.length > 0 ? (
                <div>
                  <h4 className="font-semibold text-pink-300 mb-2 flex items-center text-xs">
                    <ReceiptText className="h-3 w-3 mr-1" />
                    Recent Bet Receipts
                  </h4>
                  <ScrollArea className="h-48 pr-2">
                    <div className="space-y-2">
                      {betReceipts.slice(0, 10).map(receipt => (
                        <div 
                          key={receipt.id} 
                          className={`p-2 ${
                            receipt.teamSide === 'A' 
                              ? 'bg-[#1EAEDB]/10 border border-[#1EAEDB]/30' 
                              : 'bg-green-600/10 border border-green-600/30'
                          } rounded-lg hover:bg-opacity-20 transition-all`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <Badge 
                              variant="outline" 
                              className={`${
                                receipt.teamSide === 'A' 
                                  ? 'bg-[#1EAEDB]/20 text-[#1EAEDB] border-[#1EAEDB]/50' 
                                  : 'bg-green-600/20 text-green-500 border-green-600/50'
                              } text-xs`}
                            >
                              {receipt.teamSide === 'A' ? teamAName : teamBName}
                            </Badge>
                            <Badge 
                              className={`${
                                receipt.won 
                                  ? 'bg-green-700/80 text-green-100' 
                                  : 'bg-red-700/80 text-red-100'
                              } text-xs`}
                            >
                              {receipt.won ? '✓ Won' : '✗ Lost'} {receipt.amount}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Game #{receipt.gameNumber}</span>
                            <Badge variant="outline" className="bg-gray-800/50 text-gray-400 border-gray-700 text-xs">
                              {format(new Date(receipt.timestamp), "MM/dd • h:mm a")}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="p-3 text-center text-gray-400">
                  <p className="text-sm">No bet receipts</p>
                  <p className="mt-1 text-xs text-gray-500">Your bet history will appear here</p>
                </div>
              )}
              
              {/* Active Bets Section */}
              {totalActiveBets > 0 && (
                <div className="mt-3 pt-3 border-t border-pink-500/30">
                  <h4 className="font-semibold text-pink-300 mb-2 flex items-center text-xs">
                    <CircleDollarSign className="h-3 w-3 mr-1" />
                    Active Matched Bets
                  </h4>
                  <div className="text-sm text-center text-pink-300 p-2 bg-pink-500/10 rounded-lg border border-pink-500/30">
                    {totalActiveBets} active bet{totalActiveBets !== 1 ? 's' : ''} in progress
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
          </div>
  );
};

export default UserWidget;
