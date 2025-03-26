
import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, ReceiptText, EyeOff } from "lucide-react";
import { UserBetReceipt } from "@/types/user";
import UserBetReceipts from "./UserBetReceipts";
import { Button } from "@/components/ui/button";

interface BetReceiptsLedgerProps {
  isAdmin?: boolean;
  teamAName?: string;
  teamBName?: string;
  alwaysVisible?: boolean;
}

const BetReceiptsLedger: React.FC<BetReceiptsLedgerProps> = ({ 
  isAdmin = false,
  teamAName = "Player A",
  teamBName = "Player B",
  alwaysVisible = true
}) => {
  const { currentUser, users, getUserBetReceipts } = useUser();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    currentUser ? currentUser.id : null
  );
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(false);
  
  // Get all users who have bet receipts
  const usersWithReceipts = users.filter(user => 
    getUserBetReceipts(user.id).length > 0
  );
  
  // Get the selected user's receipts
  const selectedUserReceipts = selectedUserId 
    ? getUserBetReceipts(selectedUserId)
    : currentUser ? getUserBetReceipts(currentUser.id) : [];
  
  // Filter receipts by team
  const teamAReceipts = selectedUserReceipts.filter(
    receipt => receipt.teamSide === 'A'
  );
  
  const teamBReceipts = selectedUserReceipts.filter(
    receipt => receipt.teamSide === 'B'
  );
  
  // Group by wins and losses
  const winReceipts = selectedUserReceipts.filter(receipt => receipt.won);
  const lossReceipts = selectedUserReceipts.filter(receipt => !receipt.won);
  
  if (isHidden) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed right-4 bottom-4 bg-[#F97316]/80 text-black hover:bg-[#F97316]"
        onClick={() => setIsHidden(false)}
      >
        <ReceiptText className="h-5 w-5" />
      </Button>
    );
  }
  
  // Don't show anything if there are no receipts and not set to always visible
  if (!alwaysVisible && selectedUserReceipts.length === 0) {
    return null;
  }
  
  return (
    <Card className="bg-gray-800/70 border-gray-700 mb-8 rounded-2xl overflow-hidden">
      <CardHeader 
        className="pb-2 bg-gradient-to-r from-[#F97316]/90 to-[#F97316] cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <CardTitle className="text-2xl text-center text-black font-bold flex items-center">
          <ReceiptText className="h-6 w-6 mr-2" />
          Bet Receipts
          <span className="ml-2 text-sm bg-black/20 px-2 py-1 rounded-full">
            {selectedUserReceipts.length}
          </span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsHidden(true);
            }}
            className="text-gray-800 hover:text-black transition-colors"
          >
            <div className="rounded-full bg-gray-800/20 p-1">
              <EyeOff className="h-4 w-4" />
            </div>
          </button>
          {isCollapsed ? (
            <ChevronDown className="h-6 w-6 text-black" />
          ) : (
            <ChevronUp className="h-6 w-6 text-black" />
          )}
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="p-4">
          {isAdmin && (
            <div className="mb-4">
              <select
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(e.target.value || null)}
                className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600"
              >
                <option value="">Select a user</option>
                {usersWithReceipts.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-700 rounded-xl mb-4">
              <TabsTrigger value="all" className="rounded-lg">All Bets</TabsTrigger>
              <TabsTrigger value="teamA" className="rounded-lg">{teamAName}</TabsTrigger>
              <TabsTrigger value="teamB" className="rounded-lg">{teamBName}</TabsTrigger>
              <TabsTrigger value="wins" className="rounded-lg">Wins/Losses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <UserBetReceipts 
                receipts={selectedUserReceipts} 
                teamAName={teamAName}
                teamBName={teamBName}
                alwaysVisible={alwaysVisible}
              />
            </TabsContent>
            
            <TabsContent value="teamA" className="mt-0">
              <UserBetReceipts 
                receipts={teamAReceipts} 
                teamAName={teamAName}
                teamBName={teamBName}
                alwaysVisible={alwaysVisible}
              />
            </TabsContent>
            
            <TabsContent value="teamB" className="mt-0">
              <UserBetReceipts 
                receipts={teamBReceipts} 
                teamAName={teamAName}
                teamBName={teamBName}
                alwaysVisible={alwaysVisible}
              />
            </TabsContent>
            
            <TabsContent value="wins" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-green-400 mb-3 flex items-center justify-center">
                    Wins
                  </h3>
                  <UserBetReceipts 
                    receipts={winReceipts} 
                    teamAName={teamAName}
                    teamBName={teamBName}
                    alwaysVisible={alwaysVisible}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-red-400 mb-3 flex items-center justify-center">
                    Losses
                  </h3>
                  <UserBetReceipts 
                    receipts={lossReceipts} 
                    teamAName={teamAName}
                    teamBName={teamBName}
                    alwaysVisible={alwaysVisible}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
};

export default BetReceiptsLedger;
