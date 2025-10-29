
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PlayerAvatarProps {
  playerName: string;
  className?: string;
  imageUrl?: string;
}

const PlayerAvatar = ({ playerName, className, imageUrl }: PlayerAvatarProps) => {
  return (
    <Avatar className={`w-20 h-20 mb-3 border-2 border-[#fa1593] shadow-[0_0_15px_rgba(250,21,147,0.5)] ${className || ""}`}>
      <AvatarImage 
        src={imageUrl || "/lovable-uploads/default-profile.png"} 
        alt={playerName}
        className="object-cover"
      />
      <AvatarFallback className="bg-[#fa1593]/30 text-white text-lg">
        {playerName.substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

export default PlayerAvatar;
