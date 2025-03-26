
import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import UserWidget from "./UserWidget";
import AdminWidget from "./AdminWidget";
import UserBetHistoryWidget from "./UserBetHistoryWidget";
import { Bet } from "@/types/user";
import { EyeOff, PanelLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  const [activeTab, setActiveTab] = useState("wallet");

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
      {/* Admin Widget - Top Right */}
      <div className="fixed z-10 right-0 top-0 px-2 py-4">
        <AdminWidget 
          onToggleAdmin={toggleAdminMode} 
          isAdmin={isAdmin}
          isAgent={isAgent}
          onToggleAgent={toggleAgentMode}
        />
      </div>

      {/* User Widgets - Left Side */}
      <div className="fixed z-10 left-0 top-0 h-full px-2 py-4 flex flex-col gap-3 justify-start items-start max-w-[220px] overflow-y-auto custom-scrollbar">
        <div className="self-end mb-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-gray-800/80 border-gray-700 hover:bg-gray-700"
            onClick={() => setIsHidden(true)}
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
        
        {currentUser && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-2 bg-gray-800/80 border border-gray-700">
              <TabsTrigger value="wallet" className="data-[state=active]:bg-[#a3e635] data-[state=active]:text-black">
                Wallet
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-[#a3e635] data-[state=active]:text-black">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="wallet" className="mt-0">
              <UserWidget
                key={currentUser.id}
                user={currentUser}
                activeBetAmount={userBetAmounts.get(currentUser.id) || 0}
                bookedAmount={calculateBookedAmount(currentUser.id)}
                isActive={true}
                hideCredits={isAgent && !isAdmin}
              />
              
              <UserBetHistoryWidget 
                user={currentUser}
                betReceipts={getUserBetReceipts(currentUser.id)}
                activeBets={{
                  teamA: teamAQueue.filter(bet => bet.userId === currentUser.id),
                  teamB: teamBQueue.filter(bet => bet.userId === currentUser.id)
                }}
                teamAName={teamAName}
                teamBName={teamBName}
                alwaysVisible={true}
              />
            </TabsContent>
            
            <TabsContent value="settings" className="mt-0">
              <div className="bg-gray-800/90 border-2 border-[#a3e635]/50 w-full rounded-xl overflow-hidden shadow-lg">
                <div className="w-full bg-gradient-to-r from-[#a3e635]/80 to-[#a3e635] py-2 text-center">
                  <span className="text-sm font-bold text-black flex items-center justify-center">
                    <Settings className="h-4 w-4 mr-1" />
                    USER SETTINGS
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <p className="text-sm text-[#a3e635]">Manage your account settings</p>
                  <Link to="/user-settings" className="w-full">
                    <Button variant="lime" size="sm" className="w-full">
                      <Settings className="h-4 w-4 mr-1" />
                      Open Settings
                    </Button>
                  </Link>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
};

export default UserWidgetsContainer;
