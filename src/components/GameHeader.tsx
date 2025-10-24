
import React from "react";
import GameTimer from "@/components/GameTimer";
import { Button } from "@/components/ui/button";
import { Unlock } from "lucide-react";

interface GameHeaderProps {
  gameLabel: string;
  timer: number;
  isTimerRunning: boolean;
  showControls: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
}

const GameHeader = ({ 
  gameLabel, 
  timer, 
  isTimerRunning, 
  showControls, 
  onStart,
  onPause,
  onReset,
  isAdmin = false,
  onToggleAdmin
}: GameHeaderProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 flex flex-col items-center z-20 pt-4">
      <div className="flex flex-col items-center space-y-3">
        <div className="px-4 py-1 rounded-xl mb-1">
          <span className="text-3xl font-bold text-[#fa1593] drop-shadow-[0_0_8px_rgba(250,21,147,0.7)]">
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
        <Button
          variant="outline"
          size="sm"
          className={`text-xs ${
            isAdmin ? 'text-white hover:bg-opacity-90' : ''
          }`}
          style={isAdmin ? { backgroundColor: '#fa1593', borderColor: '#fa1593' } : { borderColor: '#fa1593', color: '#95deff' }}
          onClick={() => {
            if (onToggleAdmin) {
              onToggleAdmin();
            }
          }}
        >
          <Unlock className="h-3 w-3 mr-1" />
          {isAdmin ? 'Admin' : 'Admin'}
        </Button>
      </div>
    </div>
  );
};

export default GameHeader;
