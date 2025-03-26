
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Coins, Trophy, UserRound, ChevronDown, ChevronUp, EyeOff, Settings } from "lucide-react";
import { User } from "@/types/user";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface UserWidgetProps {
  user: User;
  activeBetAmount: number;
  bookedAmount?: number;
  isActive?: boolean;
  hideCredits?: boolean;
}

const UserWidget: React.FC<UserWidgetProps> = ({ 
  user, 
  activeBetAmount,
  bookedAmount = 0,
  isActive = false,
  hideCredits = false
}) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [isHidden, setIsHidden] = useState<boolean>(false);

  const availableCredits = user.credits;
  const totalCredits = availableCredits + bookedAmount + (activeBetAmount - bookedAmount);
  const percentage = totalCredits > 0 ? Math.round((bookedAmount / totalCredits) * 100) : 0;
  
  const lastActivity = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (isHidden) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full bg-[#a3e635]/50 border-[#a3e635]/50 hover:bg-[#a3e635]/40"
        onClick={() => setIsHidden(false)}
      >
        <div className="relative">
          <Wallet className="h-4 w-4 mr-2" />
          <span className="absolute -top-2 -right-2 text-[0.65rem] font-bold bg-black text-[#a3e635] rounded-full px-1">
            {totalCredits}
          </span>
        </div>
        Show Wallet
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="bg-gray-800/90 border-2 border-[#a3e635]/50 w-52 flex flex-col items-center justify-between cursor-pointer hover:bg-gray-800/95 transition-colors rounded-xl overflow-hidden shadow-lg">
            <CardContent className="p-0 flex flex-col items-center justify-between w-full h-full relative">
              <div className="absolute inset-0 flex flex-col justify-end">
                <div
                  className="bg-[#a3e635]/20 w-full transition-all duration-300 ease-in-out"
                  style={{ height: `${percentage}%` }}
                ></div>
              </div>
              
              <div className="z-10 flex flex-col items-center justify-between w-full h-full">
                <div 
                  className="w-full bg-gradient-to-r from-[#a3e635]/80 to-[#a3e635] py-2 text-center flex items-center justify-between px-3 cursor-pointer"
                  onClick={() => setExpanded(!expanded)}
                >
                  <div className="flex items-center">
                    <div className="relative mr-1">
                      <Wallet className="h-4 w-4 text-black" />
                      <span className="absolute -top-2 -right-2 text-[0.65rem] font-bold bg-black text-[#a3e635] rounded-full px-1">
                        {totalCredits}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-black">WALLET</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-black hover:text-black hover:bg-[#a3e635]/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsHidden(true);
                      }}
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-black" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-black" />
                    )}
                  </div>
                </div>
                
                {expanded && (
                  <>
                    <div className="bg-gray-700/70 rounded-full p-1.5 w-16 h-16 flex items-center justify-center mt-2">
                      <UserRound className="h-10 w-10 text-gray-300" />
                    </div>
                    
                    <div className="text-md font-bold text-white truncate max-w-full">
                      {user.name.substring(0, 12)}{user.name.length > 12 ? ".." : ""}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-x-2 w-full px-3 my-1">
                      <div className="flex flex-col items-center bg-gray-700/30 p-1 rounded">
                        <Wallet className="h-4 w-4 text-[#a3e635]" />
                        <span className="text-[#a3e635] text-xs font-bold">{availableCredits}</span>
                        <span className="text-[#a3e635] text-[0.6rem]">Available</span>
                      </div>
                      
                      <div className="flex flex-col items-center bg-gray-700/30 p-1 rounded">
                        <Coins className="h-4 w-4 text-[#a3e635]" />
                        <span className="text-[#a3e635] text-xs font-bold">{bookedAmount}</span>
                        <span className="text-[#a3e635] text-[0.6rem]">Booked</span>
                      </div>
                      
                      <div className="flex flex-col items-center bg-gray-700/30 p-1 rounded">
                        <Trophy className="h-4 w-4 text-[#a3e635]" />
                        <span className="text-[#a3e635] text-xs font-bold">{totalCredits}</span>
                        <span className="text-[#a3e635] text-[0.6rem]">Total</span>
                      </div>
                    </div>

                    <div className="w-full px-2 flex space-x-2 mb-2">
                      <Link to="/subscription" className="flex-1">
                        <Button variant="lime" size="sm" className="w-full text-xs">
                          Get Coins
                        </Button>
                      </Link>
                      <Link to="/user-settings" className="flex-shrink-0">
                        <Button variant="outline" size="sm" className="bg-gray-700/50 border-gray-600 hover:bg-gray-700">
                          <Settings className="h-4 w-4 text-[#a3e635]" />
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
                
                <div className="w-full px-2 py-2 bg-[#a3e635]/50 text-center">
                  {!hideCredits ? (
                    <div className="flex justify-between items-center px-2">
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-medium text-black">Available:</span>
                        <span className="text-lg font-bold text-black">{availableCredits}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-medium text-black">Total:</span>
                        <span className="text-lg font-bold text-black">{totalCredits}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xl font-bold text-black">*** COINS</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-gray-800 text-white border-gray-700">
          <div className="p-2">
            <div className="font-bold">{user.name}</div>
            {!hideCredits ? (
              <>
                <div className="text-sm flex items-center">
                  <Wallet className="h-3.5 w-3.5 text-[#a3e635] mr-1" />
                  <span>Available: <span className="text-[#a3e635] font-bold">{availableCredits}</span> COINS</span>
                </div>
                <div className="text-sm flex items-center">
                  <Coins className="h-3.5 w-3.5 text-[#a3e635] mr-1" />
                  <span>Matched Bets: <span className="text-[#a3e635] font-bold">{bookedAmount}</span> COINS</span>
                </div>
                {activeBetAmount > bookedAmount && (
                  <div className="text-sm flex items-center">
                    <Coins className="h-3.5 w-3.5 text-gray-400 mr-1" />
                    <span>Unmatched Bets: <span className="text-gray-400 font-bold">{activeBetAmount - bookedAmount}</span> COINS</span>
                  </div>
                )}
                <div className="text-sm flex items-center">
                  <Trophy className="h-3.5 w-3.5 text-[#a3e635] mr-1" />
                  <span>Total Worth: <span className="text-[#a3e635] font-bold">{totalCredits}</span> COINS</span>
                </div>
              </>
            ) : (
              <div className="text-sm">Credit information hidden</div>
            )}
            <div className="text-xs text-gray-400 mt-1">Last active: {lastActivity}</div>
            <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between">
              <Link to="/subscription" className="text-xs text-[#a3e635] hover:underline">
                Get more coins
              </Link>
              <Link to="/user-settings" className="text-xs text-[#a3e635] hover:underline flex items-center">
                <Settings className="h-3 w-3 mr-1" />
                Settings
              </Link>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default UserWidget;
