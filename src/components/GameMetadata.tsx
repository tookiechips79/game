
import React from "react";
import GameHeader from "@/components/GameHeader";
import { TimerProps } from "@/utils/timerUtils";

interface GameMetadataProps extends TimerProps {
  gameLabel: string;
  showControls: boolean;
}

const GameMetadata: React.FC<GameMetadataProps> = ({
  gameLabel,
  timer,
  isTimerRunning,
  showControls,
  toggleTimer,
  resetTimer
}) => {
  return (
    <GameHeader
      gameLabel={gameLabel}
      timer={timer}
      isTimerRunning={isTimerRunning}
      showControls={showControls}
      toggleTimer={toggleTimer}
      resetTimer={resetTimer}
    />
  );
};

export default GameMetadata;
