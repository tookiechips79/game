
import React from "react";
import GameHeader from "@/components/GameHeader";
import { TimerProps } from "@/utils/timerUtils";

interface GameMetadataProps {
  gameLabel: string;
  timer: number;
  isTimerRunning: boolean;
  showControls: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const GameMetadata: React.FC<GameMetadataProps> = ({
  gameLabel,
  timer,
  isTimerRunning,
  showControls,
  onStart,
  onPause,
  onReset
}) => {
  return (
    <GameHeader
      gameLabel={gameLabel}
      timer={timer}
      isTimerRunning={isTimerRunning}
      showControls={showControls}
      onStart={onStart}
      onPause={onPause}
      onReset={onReset}
    />
  );
};

export default GameMetadata;
