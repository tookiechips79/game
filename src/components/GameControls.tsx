
import React from "react";
import { Button } from "@/components/ui/button";
import { TimerProps } from "@/utils/timerUtils";

interface GameControlsProps extends TimerProps {
  showControls: boolean;
  isMatchStarted: boolean;
  startMatch: () => void;
  onTeamAWinOpen: () => void;
  onTeamBWinOpen: () => void;
  teamAName: string;
  teamBName: string;
}

const GameControls: React.FC<GameControlsProps> = ({
  showControls,
  isMatchStarted,
  startMatch,
  onTeamAWinOpen,
  onTeamBWinOpen,
  teamAName,
  teamBName,
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
  
  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
      <Button
        variant="default"
        className="bg-[#1EAEDB] hover:bg-[#1EAEDB]/80 text-white rounded-xl"
        onClick={onTeamAWinOpen}
      >
        Declare {teamAName} Winner
      </Button>
      <Button
        variant="default"
        className="bg-[#a3e635] hover:bg-[#a3e635]/80 text-black rounded-xl"
        onClick={onTeamBWinOpen}
      >
        Declare {teamBName} Winner
      </Button>
    </div>
  );
};

export default GameControls;
