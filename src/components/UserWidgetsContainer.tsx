
import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import UserWidget from "./UserWidget";
import { Bet } from "@/types/user";
import { EyeOff, PanelLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface UserWidgetsContainerProps {
  userBetAmounts: Map<string, number>;
  bookedBets: any[];
  nextBookedBets?: any[];
  isAdmin: boolean;
  isAgent?: boolean;
  toggleAdminMode: () => void;
  toggleAgentMode?: () => void;
  teamAQueue: Bet[];
  teamBQueue: Bet[];
  teamAName?: string;
  teamBName?: string;
  teamABalls?: number;
  teamBBalls?: number;
}

const UserWidgetsContainer: React.FC<UserWidgetsContainerProps> = ({
  userBetAmounts,
  bookedBets,
  nextBookedBets = [],
  isAdmin,
  isAgent = false,
  toggleAdminMode,
  toggleAgentMode,
  teamAQueue,
  teamBQueue,
  teamAName = "Player A",
  teamBName = "Player B",
  teamABalls = 0,
  teamBBalls = 0
}) => {
  const { currentUser, getUserBetReceipts } = useUser();
  const [isHidden, setIsHidden] = useState(false);

  // Calculate booked amount for current user
  const calculateBookedAmount = (userId: string) => {
    let amount = 0;
    const allBookedBets = [...bookedBets, ...(nextBookedBets || [])];
    
    if (allBookedBets && allBookedBets.length > 0) {
      allBookedBets.forEach(bet => {
        if (bet.userIdA === userId || bet.userIdB === userId) {
          amount += bet.amount;
        }
      });
    }
    return amount;
  };

  if (isHidden) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-50 bg-gray-800 text-white hover:bg-gray-700"
        onClick={() => setIsHidden(false)}
      >
        <PanelLeft className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <>
      {/* User Widgets - Top Bar */}
      <div className="fixed z-10 top-0 left-0 right-0 bg-gradient-to-r from-pink-900/80 via-rose-900/80 to-fuchsia-900/80 backdrop-blur-sm border-b border-pink-500/30 overflow-x-auto">
        <div className="px-2 md:px-4 py-2 md:py-3 min-w-full">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-0">
            {currentUser && (
              <div className="flex items-start space-x-4 flex-1 min-w-0">
                <UserWidget
                  key={currentUser.id}
                  user={currentUser}
                  activeBetAmount={userBetAmounts.get(currentUser.id) || 0}
                  bookedAmount={calculateBookedAmount(currentUser.id)}
                  isActive={true}
                  hideCredits={isAgent && !isAdmin}
                  betReceipts={getUserBetReceipts(currentUser.id)}
                  activeBets={{
                    teamA: teamAQueue.filter(bet => bet.userId === currentUser.id),
                    teamB: teamBQueue.filter(bet => bet.userId === currentUser.id)
                  }}
                  teamAName={teamAName}
                  teamBName={teamBName}
                />
              </div>
            )}
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Link to="/user-settings">
                <Button variant="outline" size="sm" className="bg-pink-800/50 border-pink-600/50 hover:bg-pink-700/50">
                  <Settings className="h-4 w-4 text-pink-300" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-pink-400 hover:text-pink-300 hover:bg-pink-500/20"
                onClick={() => setIsHidden(true)}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserWidgetsContainer;
