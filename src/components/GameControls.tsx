
import React from "react";
import { Button } from "@/components/ui/button";
import { TimerProps } from "@/utils/timerUtils";

interface GameControlsProps extends TimerProps {
  showControls: boolean;
  isMatchStarted: boolean;
  startMatch: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  showControls,
  isMatchStarted,
  startMatch,
  timer,
  isTimerRunning,
  toggleTimer,
  resetTimer
}) => {
  if (!showControls) return null;
  
  if (!isMatchStarted) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
        <Button 
          onClick={startMatch}
          className="bg-[#a3e635] hover:bg-[#a3e635]/80 text-black font-bold px-8 py-6 text-lg rounded-xl"
        >
          START MATCH
        </Button>
      </div>
    );
  }
  
  return null;
};

export default GameControls;
