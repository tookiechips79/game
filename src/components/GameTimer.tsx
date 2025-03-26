
import React from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameTimerProps {
  timer: number;
  isTimerRunning: boolean;
  showControls: boolean;
  toggleTimer: () => void;
  resetTimer: () => void;
}

const GameTimer = ({ 
  timer, 
  isTimerRunning, 
  showControls, 
  toggleTimer, 
  resetTimer 
}: GameTimerProps) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-1 bg-black/40 backdrop-blur-sm px-4 py-1 rounded-full">
      <Clock className="h-5 w-5 text-[#a3e635]" />
      <div 
        className={`text-3xl font-bold text-[#a3e635] drop-shadow-[0_0_8px_rgba(163,230,53,0.7)] scoreboard-gradient-text ${!isTimerRunning ? 'animate-pulse' : ''}`}
        onClick={showControls ? toggleTimer : undefined}
      >
        {formatTime(timer)}
      </div>
      {showControls && (
        <Button 
          onClick={resetTimer} 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 p-0 text-[#a3e635] hover:text-white hover:bg-[#a3e635]/30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
        </Button>
      )}
    </div>
  );
};

export default GameTimer;
