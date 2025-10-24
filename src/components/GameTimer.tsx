
import React from "react";
import { Clock, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameTimerProps {
  timer: number;
  isTimerRunning: boolean;
  showControls: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const GameTimer = ({ 
  timer, 
  isTimerRunning, 
  showControls, 
  onStart,
  onPause,
  onReset
}: GameTimerProps) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartClick = () => {
    onStart();
  };

  const handlePauseClick = () => {
    onPause();
  };

  const handleResetClick = () => {
    onReset();
  };

  return (
    <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
      <Clock className="h-5 w-5 text-[#fa1593]" />
      <div 
        className={`text-3xl font-bold text-[#fa1593] drop-shadow-[0_0_8px_rgba(250,21,147,0.7)] ${!isTimerRunning ? 'animate-pulse' : ''}`}
      >
        {formatTime(timer)}
      </div>
      {showControls && (
        <div className="flex items-center space-x-1">
          <Button 
            onClick={isTimerRunning ? handlePauseClick : handleStartClick}
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 p-0 text-[#fa1593] hover:text-white hover:bg-[#fa1593]/30"
          >
            {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button 
            onClick={handleResetClick} 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 p-0 text-[#fa1593] hover:text-white hover:bg-[#fa1593]/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameTimer;
