
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PlayerAvatarProps {
  playerName: string;
  className?: string;
}

const PlayerAvatar = ({ playerName, className }: PlayerAvatarProps) => {
  return (
    <Avatar className={`w-20 h-20 mb-3 border-2 border-[#F97316] shadow-[0_0_15px_rgba(249,115,22,0.5)] ${className || ""}`}>
      <AvatarImage 
        src="/lovable-uploads/default-profile.png" 
        alt={playerName}
        className="object-cover"
      />
      <AvatarFallback className="bg-[#F97316]/30 text-white text-lg">
        {playerName.substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

export default PlayerAvatar;
