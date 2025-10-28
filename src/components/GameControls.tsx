
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { TimerProps } from "@/utils/timerUtils";

interface GameControlsProps extends TimerProps {
  showControls: boolean;
  isMatchStarted: boolean;
  startMatch: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  adminLocked?: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({
  showControls,
  isMatchStarted,
  startMatch,
  timer,
  isTimerRunning,
  toggleTimer,
  onStart,
  onPause,
  onReset,
  resetTimer,
  adminLocked
}) => {
  // Debug: Log what we receive
  console.log('🎮 [GameControls] Rendered with:', { adminLocked, isMatchStarted, showControls });
  
  // If admin is locked, don't show any controls at all
  if (adminLocked === true) {
    console.log('🎮 [GameControls] Admin is LOCKED, returning null');
    return null;
  }

  // Show START MATCH button when match hasn't started
  if (!isMatchStarted) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
        <div className="flex flex-col items-center gap-6 backdrop-blur-sm bg-black/40 p-8 rounded-2xl">
          <Button 
            onClick={startMatch}
            className="bg-[#a3e635] hover:bg-[#a3e635]/80 text-black font-bold px-12 py-8 text-2xl rounded-xl shadow-lg"
          >
            START MATCH
          </Button>
          
          {/* Timer and controls */}
          {showControls && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-4xl font-bold text-[#fa1593] font-mono">
                {String(Math.floor(timer / 60)).padStart(2, '0')}:
                {String(timer % 60).padStart(2, '0')}
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={onStart || toggleTimer}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-[#fa1593] hover:text-white hover:bg-[#fa1593]/30"
                >
                  <Play className="h-5 w-5" />
                </Button>
                
                <Button
                  onClick={onPause || toggleTimer}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-[#fa1593] hover:text-white hover:bg-[#fa1593]/30"
                >
                  <Pause className="h-5 w-5" />
                </Button>
                
                <Button
                  onClick={onReset || resetTimer}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-[#fa1593] hover:text-white hover:bg-[#fa1593]/30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return null;
};

export default GameControls;
