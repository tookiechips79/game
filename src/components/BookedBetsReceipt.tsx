
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
    <div className={`fixed right-0 bottom-0 transition-all duration-300 ${isCollapsed ? 'h-10' : 'h-auto max-h-[40vh]'} w-auto max-w-[300px] backdrop-blur-md border-t-2 border-l-2 rounded-tl-2xl px-3 py-2 z-50 shadow-lg`} style={{ backgroundColor: 'rgba(236, 72, 153, 0.2)', borderColor: '#fa1593' }}>
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <ReceiptText className="h-4 w-4 mr-1" style={{ color: '#fa1593' }} />
            <h3 className="font-bold text-sm" style={{ color: 'black', textShadow: '0 0 15px rgba(250, 21, 147, 0.8)' }}>{title} - MY BETS</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs" style={{ color: '#95deff' }}>
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
                    className="min-w-[200px] rounded-lg shadow-md hover:shadow-pink-600/20 transition-all"
                    style={{ backgroundColor: 'rgba(236, 72, 153, 0.2)', borderColor: '#fa1593' }}
                  >
                    <CardHeader className="py-1 px-2 rounded-t-lg" style={{ background: 'linear-gradient(to right, rgba(250, 21, 147, 0.3), rgba(236, 72, 153, 0.2))' }}>
                      <CardTitle className="text-xs flex items-center justify-between">
                        <div className="flex items-center">
                          <Check className="h-3 w-3 mr-1" style={{ color: '#fa1593' }} />
                          #{bet.idA} + #{bet.idB}
                        </div>
                        {bet.isCurrentGame ? (
                          <span className="font-bold text-xs px-1 py-0.5 rounded" style={{ color: '#fa1593', backgroundColor: 'rgba(250, 21, 147, 0.2)' }}>
                            ACTIVE
                          </span>
                        ) : (
                          <span className="font-bold text-xs px-1 py-0.5 rounded" style={{ color: '#fa1593', backgroundColor: 'rgba(250, 21, 147, 0.2)' }}>
                            NEXT
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 text-xs">
                      <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                        <div className="font-semibold text-xs" style={{ color: '#95deff' }}>{teamAName}</div>
                        <div className="font-semibold text-xs" style={{ color: '#fa1593' }}>{teamBName}</div>
                        
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
