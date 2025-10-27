
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
  const { getUserById, currentUser } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Filter booked bets to only show current user's bets
  const userCurrentGameBets = bookedBets.filter(bet => 
    bet.userIdA === currentUser?.id || bet.userIdB === currentUser?.id
  ).map(bet => ({ ...bet, isCurrentGame: true }));
  
  const userNextGameBets = nextGameBets.filter(bet => 
    bet.userIdA === currentUser?.id || bet.userIdB === currentUser?.id
  ).map(bet => ({ ...bet, isCurrentGame: false }));
  
  const allBookedBets = [...userCurrentGameBets, ...userNextGameBets];

  if (allBookedBets.length === 0) {
    return null;
  }

  if (isHidden) {
    return (
      <div 
        className="fixed right-4 bottom-4 p-2 rounded-full shadow-lg cursor-pointer z-50"
        style={{ backgroundColor: '#fa1593', borderColor: '#fa1593' }}
        onClick={() => setIsHidden(false)}
      >
        <ReceiptText className="h-6 w-6 text-white" />
      </div>
    );
  }

  return (
    <div className={`fixed right-0 bottom-0 transition-all duration-300 ${isCollapsed ? 'h-10' : 'h-auto max-h-[40vh]'} w-auto max-w-[300px] backdrop-blur-md border-t-2 border-l-2 rounded-tl-2xl px-3 py-2 z-50 shadow-[0_0_30px_rgba(250,21,147,0.8)]`} style={{ backgroundColor: '#052240', borderColor: '#fa1593' }}>
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <ReceiptText className="h-4 w-4 mr-1" style={{ color: '#95deff' }} />
            <h3 className="font-bold text-sm text-white">{title} - MY BETS</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-white">
              {allBookedBets.length} booked
            </div>
            <div 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="transition-colors cursor-pointer"
              style={{ color: '#95deff' }}
            >
              {isCollapsed ? (
                <div className="rounded-full p-1" style={{ backgroundColor: 'rgba(250, 21, 147, 0.3)' }}>
                  <Check className="h-4 w-4" />
                </div>
              ) : (
                <div className="rounded-full p-1" style={{ backgroundColor: 'rgba(250, 21, 147, 0.3)' }}>
                  <X className="h-4 w-4" />
                </div>
              )}
            </div>
            <div
              onClick={() => setIsHidden(true)}
              className="transition-colors cursor-pointer"
              style={{ color: '#95deff' }}
            >
              <div className="rounded-full p-1" style={{ backgroundColor: 'rgba(250, 21, 147, 0.3)' }}>
                <X className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
        
        {!isCollapsed && (
          <div className="max-h-[35vh] overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-rounded-full hover:scrollbar-thumb-pink-400 transition-colors" style={{ scrollbarThumbColor: '#fa1593' }}>
            <div className="flex flex-col gap-1 pr-2">
              {allBookedBets.map((bet) => {
                const userA = getUserById(bet.userIdA);
                const userB = getUserById(bet.userIdB);
                
                return (
                  <Card 
                    key={`${bet.idA}-${bet.idB}`} 
                    className="min-w-[200px] rounded-lg border-2 shadow-md hover:shadow-pink-600/40 transition-all"
                    style={{ backgroundColor: '#004b6b', borderColor: '#fa1593' }}
                  >
                    <CardHeader className="py-1 px-2 rounded-t-lg" style={{ background: 'linear-gradient(to right, #fa1593, #004b6b)' }}>
                      <CardTitle className="text-xs flex items-center justify-between text-white">
                        <div className="flex items-center">
                          <Check className="h-3 w-3 mr-1" style={{ color: '#95deff' }} />
                          #{bet.idA} + #{bet.idB}
                        </div>
                        {bet.isCurrentGame ? (
                          <span className="font-bold text-xs px-1 py-0.5 rounded text-white" style={{ backgroundColor: 'rgba(149, 222, 255, 0.2)' }}>
                            ACTIVE
                          </span>
                        ) : (
                          <span className="font-bold text-xs px-1 py-0.5 rounded text-white" style={{ backgroundColor: 'rgba(149, 222, 255, 0.2)' }}>
                            NEXT
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 text-xs">
                      <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                        <div className="font-semibold text-xs text-white">{teamAName}</div>
                        <div className="font-semibold text-xs text-white">{teamBName}</div>
                        
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
