
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PlayerAvatarProps {
  playerName: string;
  className?: string;
  imageUrl?: string;
  position?: string;
}

const PlayerAvatar = React.memo(({ playerName, className, imageUrl, position = '70% center' }: PlayerAvatarProps) => {
  return (
    <div className={`w-40 h-56 mb-3 border-2 border-[#fa1593] shadow-[0_0_15px_rgba(250,21,147,0.5)] flex-shrink-0 overflow-hidden ${className || ""}`}>
      <img 
        src={imageUrl || "/lovable-uploads/default-profile.png"} 
        alt={playerName}
        className="object-cover w-full h-full"
        style={{ objectPosition: position }}
      />
    </div>
  );
});

PlayerAvatar.displayName = "PlayerAvatar";

export default PlayerAvatar;
