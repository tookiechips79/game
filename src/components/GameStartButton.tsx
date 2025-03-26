
import React from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

interface GameStartButtonProps {
  onClick: () => void;
}

const GameStartButton = ({ onClick }: GameStartButtonProps) => {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
      <Button 
        onClick={onClick}
        className="px-6 py-3 text-lg font-bold bg-gradient-to-r from-[#F97316] to-[#F97316]/80 text-white rounded-xl hover:from-[#F97316]/90 hover:to-[#F97316]/70 shadow-[0_0_15px_rgba(249,115,22,0.7)] transition-all duration-300 flex items-center gap-2"
      >
        <PlayCircle className="h-6 w-6" /> Start Match
      </Button>
    </div>
  );
};

export default GameStartButton;
