import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, Coins } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

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
  const { getAllUsers } = useUser();

  // Calculate total users in the room
  const allUsers = getAllUsers();
  const usersInRoom = allUsers.length;

  // Calculate total coins in room (all user accounts)
  const calculateTotalCoinsInRoom = () => {
    return allUsers.reduce((total, user) => total + user.credits, 0);
  };

  const totalCoinsInRoom = calculateTotalCoinsInRoom();

  return (
    <Card className="glass-card border-2 border-[#1EAEDB] overflow-hidden shadow-[0_0_20px_rgba(30,174,219,0.6)] mb-6 hover:shadow-[0_0_25px_rgba(30,174,219,0.7)] rounded-2xl">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Users in Room */}
          <div className="flex items-center justify-center bg-gradient-to-r from-[#1EAEDB]/20 to-[#1EAEDB]/10 rounded-xl p-3 border border-[#1EAEDB]/30">
            <div className="flex items-center space-x-3">
              <div className="bg-[#1EAEDB] rounded-full p-2">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#1EAEDB]">
                  {usersInRoom}
                </div>
                <div className="text-xs text-gray-300 uppercase tracking-wider">
                  Users in Room
                </div>
              </div>
            </div>
          </div>

          {/* Total Coins in Room */}
          <div className="flex items-center justify-center bg-gradient-to-r from-[#a3e635]/20 to-[#a3e635]/10 rounded-xl p-3 border border-[#a3e635]/30">
            <div className="flex items-center space-x-3">
              <div className="bg-[#a3e635] rounded-full p-2">
                <Coins className="h-5 w-5 text-black" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#a3e635]">
                  {totalCoinsInRoom.toLocaleString()}
                </div>
                <div className="text-xs text-gray-300 uppercase tracking-wider">
                  Coins in Room
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameInfoWindow;
