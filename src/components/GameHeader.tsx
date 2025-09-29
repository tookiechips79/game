
import React from "react";
import GameTimer from "@/components/GameTimer";

interface GameHeaderProps {
  gameLabel: string;
  timer: number;
  isTimerRunning: boolean;
  showControls: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const GameHeader = ({ 
  gameLabel, 
  timer, 
  isTimerRunning, 
  showControls, 
  onStart,
  onPause,
  onReset
}: GameHeaderProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 flex flex-col items-center z-20 pt-4">
      <div className="flex flex-col items-center space-y-3">
        <div className="px-4 py-1 rounded-xl mb-1">
          <span className="text-3xl font-bold text-[#a3e635] drop-shadow-[0_0_8px_rgba(163,230,53,0.7)] scoreboard-gradient-text">
            {gameLabel}
          </span>
        </div>
        <GameTimer 
          timer={timer}
          isTimerRunning={isTimerRunning}
          showControls={showControls}
          onStart={onStart}
          onPause={onPause}
          onReset={onReset}
        />
      </div>
    </div>
  );
};

export default GameHeader;
