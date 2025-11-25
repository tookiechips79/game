
import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, ReceiptText, EyeOff, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { UserBetReceipt } from "@/types/user";
import UserBetReceipts from "./UserBetReceipts";
import UserDropdown from "./UserDropdown";
import { socketIOService } from "@/services/socketIOService";

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
  const { currentUser, users, getUserBetReceipts, clearBettingQueueReceipts, isUsersLoaded } = useUser();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    currentUser ? currentUser.id : null
  );
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(false);
  
  const handleClearReceipts = () => {
    if (!isAdmin) {
      toast.error("Admin Access Required", {
        description: "Only administrators can clear bet receipts"
      });
      return;
    }
    
    if (window.confirm('Are you sure you want to clear all bet receipts? This action cannot be undone.')) {
      clearBettingQueueReceipts();
      toast.success("Bet Receipts Cleared", {
        description: "All bet receipts have been cleared",
        className: "custom-toast-success"
      });
    }
  };
  
  const handleRefreshReceipts = () => {
    console.log(`🔄 [BET-RECEIPTS] Browser refresh requested`);
    toast.success("Refreshing page...", {
      description: "Browser will refresh in a moment",
      className: "custom-toast-success"
    });
    // Refresh the browser after a short delay to show the toast
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  
  // Get all users who have bet receipts
  const usersWithReceipts = users.filter(user => 
    getUserBetReceipts(user.id).length > 0
  );
  
  // For non-admin users, always show their own receipts
  // For admin users, show selected user's receipts or current user's if none selected
  // ✅ SECURITY: Non-admin users can NEVER see other users' receipts
  const selectedUserReceipts = isAdmin 
    ? (selectedUserId ? getUserBetReceipts(selectedUserId) : currentUser ? getUserBetReceipts(currentUser.id) : [])
    : (currentUser ? getUserBetReceipts(currentUser.id) : []);
  
  // ✅ SECURITY: For non-admin users, force their own ID to be selected
  // This prevents any possibility of viewing other users' receipts via URL manipulation or developer tools
  const displayedUserId = isAdmin ? selectedUserId : currentUser?.id;
  
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
        className="fixed right-4 bottom-4 text-white hover:bg-opacity-90"
        style={{ backgroundColor: '#95deff', borderColor: '#95deff' }}
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
    <Card className="mb-8 rounded-2xl overflow-hidden border-2 shadow-[0_0_30px_rgba(250,21,147,0.8)]" style={{ backgroundColor: '#052240', borderColor: '#fa1593' }}>
      <CardHeader 
        className="pb-2 cursor-pointer flex flex-row items-center justify-between"
        style={{ background: 'linear-gradient(to right, #fa1593, #004b6b)' }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <CardTitle className="text-2xl text-center font-bold flex items-center text-white">
          <ReceiptText className="h-6 w-6 mr-2" style={{ color: '#95deff' }} />
          BET RECEIPTS
          <span className="ml-2 text-sm px-2 py-1 rounded-full text-white" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
            {selectedUserReceipts.length}
          </span>
        </CardTitle>
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRefreshReceipts();
            }}
            className="transition-colors hover:opacity-80"
            style={{ color: '#95deff' }}
            title="Refresh bet receipts"
          >
            <div className="rounded-full p-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              <RefreshCw className="h-4 w-4" />
            </div>
          </button>
          
          {/* Hide Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsHidden(true);
            }}
            className="transition-colors"
            style={{ color: '#95deff' }}
          >
            <div className="rounded-full p-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              <EyeOff className="h-4 w-4" />
            </div>
          </button>
          {isCollapsed ? (
            <ChevronDown className="h-6 w-6 text-white" />
          ) : (
            <ChevronUp className="h-6 w-6 text-white" />
          )}
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="p-4">
          {isAdmin && (
            <div className="mb-4 space-y-3">
              {/* ✅ SECURITY: UserDropdown only shown to admin users */}
              <UserDropdown
                selectedUserId={selectedUserId || ''}
                onUserChange={(userId) => {
                  // ✅ SECURITY: Admin can select any user to view their receipts
                  setSelectedUserId(userId || null);
                }}
                placeholder="Select a user to view receipts"
                showCredits={false}
                showMembership={false}
              />
              
              {isAdmin && (
                <Button
                  onClick={handleClearReceipts}
                  variant="outline"
                  size="sm"
                  className="w-full text-white transition-colors"
                  style={{ backgroundColor: '#fa1593', borderColor: '#fa1593' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(250, 21, 147, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fa1593';
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Bet Receipts
                </Button>
              )}
            </div>
          )}
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-xl mb-4" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <TabsTrigger value="all" className="rounded-lg text-white">All Bets</TabsTrigger>
              <TabsTrigger value="teamA" className="rounded-lg text-white">{teamAName}</TabsTrigger>
              <TabsTrigger value="teamB" className="rounded-lg text-white">{teamBName}</TabsTrigger>
              <TabsTrigger value="wins" className="rounded-lg text-white">Wins/Losses</TabsTrigger>
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
                  <h3 className="text-xl font-semibold mb-3 flex items-center justify-center text-white">
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
                  <h3 className="text-xl font-semibold mb-3 flex items-center justify-center text-white">
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
