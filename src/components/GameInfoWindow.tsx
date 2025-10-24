import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, Coins, RefreshCw } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { socketIOService } from "@/services/socketIOService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GameInfoWindowProps {
  teamAQueue: any[];
  teamBQueue: any[];
  nextTeamAQueue: any[];
  nextTeamBQueue: any[];
}

const GameInfoWindow: React.FC<GameInfoWindowProps> = ({
  teamAQueue,
  teamBQueue,
  nextTeamAQueue,
  nextTeamBQueue
}) => {
  const { connectedUsersCoins, currentUser } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Use connected users data for real-time room statistics
  const usersInRoom = connectedUsersCoins.connectedUserCount;
  const totalCoinsInRoom = connectedUsersCoins.totalCoins;

  // Refresh connected users data
  const handleRefresh = () => {
    if (socketIOService.isSocketConnected()) {
      setIsRefreshing(true);
      
      // Request fresh connected users data from server
      console.log('🔄 Refreshing connected users data');
      socketIOService.requestConnectedUsersData();
      
      // Show immediate feedback
      toast.success("Refreshing Data...", {
        description: "Requesting latest user count and coins total"
      });
      
      // Reset refreshing state and show success after a short delay
      setTimeout(() => {
        setIsRefreshing(false);
        setLastRefreshTime(new Date());
        toast.success("Data Refreshed", {
          description: `${usersInRoom} users, ${totalCoinsInRoom.toLocaleString()} coins`
        });
      }, 1000);
    } else {
      toast.error("Unable to Refresh", {
        description: "Please ensure you're connected to the server"
      });
    }
  };

  return (
    <Card className="glass-card border-2 overflow-hidden shadow-[0_0_30px_rgba(250,21,147,0.8)] mb-6 hover:shadow-[0_0_40px_rgba(250,21,147,1)] rounded-3xl" style={{ borderColor: '#fa1593', backgroundColor: '#052240' }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-2 gap-4 flex-1">
            {/* Users in Room */}
            <div className="flex items-center justify-center rounded-xl p-3 border" style={{ backgroundColor: '#750037', borderColor: '#750037' }}>
              <div className="flex items-center space-x-3">
                <div className="rounded-full p-2" style={{ backgroundColor: '#750037' }}>
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {usersInRoom}
                  </div>
                  <div className="text-xs text-white uppercase tracking-wider">
                    Users in Room
                  </div>
                </div>
              </div>
            </div>

            {/* Total Coins in Room */}
            <div className="flex items-center justify-center rounded-xl p-3 border" style={{ backgroundColor: '#750037', borderColor: '#750037' }}>
              <div className="flex items-center space-x-3">
                <div className="rounded-full p-2" style={{ backgroundColor: '#750037' }}>
                  <Coins className="h-5 w-5 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {totalCoinsInRoom.toLocaleString()}
                  </div>
                  <div className="text-xs text-white uppercase tracking-wider">
                    Coins in Room
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Small Refresh Button */}
          <div className="ml-4">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0 transition-all duration-200 rounded-lg disabled:opacity-50"
              style={{ backgroundColor: '#fa1593', borderColor: '#fa1593' }}
            >
              <RefreshCw className={`h-4 w-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameInfoWindow;

