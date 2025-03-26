
import React from 'react';
import { ReceiptText, Check, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookedBet } from "@/types/user";
import { useUser } from "@/contexts/UserContext";
import { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Combine current and next game booked bets
  const allBookedBets = [...bookedBets, ...nextGameBets];

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
    <div className={`fixed right-0 bottom-0 transition-all duration-300 ${isCollapsed ? 'h-12' : 'h-auto max-h-[30vh]'} w-auto max-w-[350px] bg-black/90 backdrop-blur-md border-t-2 border-l-2 border-[#1EAEDB]/50 rounded-tl-2xl px-4 py-3 z-50 shadow-lg`}>
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <ReceiptText className="h-5 w-5 text-[#00FFFF] mr-2" />
            <h3 className="text-[#00FFFF] font-bold">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-white text-sm">
              {allBookedBets.length} booked {allBookedBets.length === 1 ? 'bet' : 'bets'}
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
          <ScrollArea className="max-h-[25vh] pb-2">
            <div className="flex flex-col gap-2">
              {allBookedBets.map((bet) => {
                const userA = getUserById(bet.userIdA);
                const userB = getUserById(bet.userIdB);
                
                return (
                  <Card 
                    key={`${bet.idA}-${bet.idB}`} 
                    className="min-w-[250px] rounded-xl bg-black border border-gray-700 shadow-md hover:shadow-[#00FFFF]/20 transition-all"
                  >
                    <CardHeader className="py-2 px-3 bg-gradient-to-r from-[#1EAEDB]/30 to-[#00FF00]/30 rounded-t-xl">
                      <CardTitle className="text-sm flex items-center">
                        <Check className="h-4 w-4 text-[#00FFFF] mr-1" />
                        Bet #{bet.idA} + #{bet.idB}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 text-sm">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <div className="text-[#00FFFF] font-semibold">{teamAName}</div>
                        <div className="text-[#00FF00] font-semibold">{teamBName}</div>
                        
                        <div className="text-white flex items-center gap-1">
                          <span className="text-gray-400">User:</span> 
                          {userA?.name || 'User'}
                        </div>
                        <div className="text-white flex items-center gap-1">
                          <span className="text-gray-400">User:</span> 
                          {userB?.name || 'User'}
                        </div>
                        
                        <div className="text-white font-bold flex items-center gap-1">
                          <span className="text-gray-400">Bet:</span>
                          {bet.amount} COINS
                        </div>
                        <div className="text-white font-bold flex items-center gap-1">
                          <span className="text-gray-400">Bet:</span>
                          {bet.amount} COINS
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default BookedBetsReceipt;
