
import React from 'react';
import { ReceiptText, Check, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookedBet } from "@/types/user";
import { useUser } from "@/contexts/UserContext";
import { useState } from 'react';

interface BookedBetsReceiptProps {
  bookedBets: BookedBet[];
  teamAName: string;
  teamBName: string;
  title?: string;
  nextGameBets?: BookedBet[];
}

const BookedBetsReceipt: React.FC<BookedBetsReceiptProps> = ({ 
  bookedBets, 
  teamAName = "Player A", 
  teamBName = "Player B",
  title = "BOOKED BETS",
  nextGameBets = []
}) => {
  const { getUserById } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Combine current and next game booked bets with status
  const currentGameBets = bookedBets.map(bet => ({ ...bet, isCurrentGame: true }));
  const nextGameBetsWithStatus = nextGameBets.map(bet => ({ ...bet, isCurrentGame: false }));
  const allBookedBets = [...currentGameBets, ...nextGameBetsWithStatus];

  if (allBookedBets.length === 0) {
    return null;
  }

  if (isHidden) {
    return (
      <div 
        className="fixed right-4 bottom-4 bg-black p-2 rounded-full shadow-lg cursor-pointer z-50 border border-[#1EAEDB]/40"
        onClick={() => setIsHidden(false)}
      >
        <ReceiptText className="h-6 w-6 text-[#00FFFF]" />
      </div>
    );
  }

  return (
    <div className={`fixed right-0 bottom-0 transition-all duration-300 ${isCollapsed ? 'h-10' : 'h-auto max-h-[40vh]'} w-auto max-w-[300px] bg-black/90 backdrop-blur-md border-t-2 border-l-2 border-[#1EAEDB]/50 rounded-tl-2xl px-3 py-2 z-50 shadow-lg`}>
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <ReceiptText className="h-4 w-4 text-[#00FFFF] mr-1" />
            <h3 className="text-[#00FFFF] font-bold text-sm">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-white text-xs">
              {allBookedBets.length} booked
            </div>
            <div 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              {isCollapsed ? (
                <div className="rounded-full bg-[#1EAEDB]/30 p-1">
                  <Check className="h-4 w-4" />
                </div>
              ) : (
                <div className="rounded-full bg-gray-800 p-1">
                  <X className="h-4 w-4" />
                </div>
              )}
            </div>
            <div
              onClick={() => setIsHidden(true)}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <div className="rounded-full bg-gray-800 p-1">
                <X className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
        
        {!isCollapsed && (
          <div className="max-h-[35vh] overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-[#1EAEDB] scrollbar-thumb-rounded-full hover:scrollbar-thumb-[#00FFFF] transition-colors">
            <div className="flex flex-col gap-1 pr-2">
              {allBookedBets.map((bet) => {
                const userA = getUserById(bet.userIdA);
                const userB = getUserById(bet.userIdB);
                
                return (
                  <Card 
                    key={`${bet.idA}-${bet.idB}`} 
                    className="min-w-[200px] rounded-lg bg-black border border-gray-700 shadow-md hover:shadow-[#00FFFF]/20 transition-all"
                  >
                    <CardHeader className="py-1 px-2 bg-gradient-to-r from-[#1EAEDB]/30 to-[#00FF00]/30 rounded-t-lg">
                      <CardTitle className="text-xs flex items-center justify-between">
                        <div className="flex items-center">
                          <Check className="h-3 w-3 text-[#00FFFF] mr-1" />
                          #{bet.idA} + #{bet.idB}
                        </div>
                        {bet.isCurrentGame ? (
                          <span className="text-[#a3e635] font-bold text-xs bg-black/50 px-1 py-0.5 rounded">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-[#1EAEDB] font-bold text-xs bg-black/50 px-1 py-0.5 rounded">
                            NEXT
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 text-xs">
                      <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                        <div className="text-[#00FFFF] font-semibold text-xs">{teamAName}</div>
                        <div className="text-[#00FF00] font-semibold text-xs">{teamBName}</div>
                        
                        <div className="text-white text-xs truncate">
                          {userA?.name || 'User'}
                        </div>
                        <div className="text-white text-xs truncate">
                          {userB?.name || 'User'}
                        </div>
                        
                        <div className="text-white font-bold text-xs">
                          {bet.amount} COINS
                        </div>
                        <div className="text-white font-bold text-xs">
                          {bet.amount} COINS
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookedBetsReceipt;
