
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
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
  adminLocked?: boolean;
  setAdminLocked?: (locked: boolean) => void;
  adminModalRef?: React.RefObject<{ openModal: () => void }>;
}

const GameMetadata: React.FC<GameMetadataProps> = ({
  gameLabel,
  timer,
  isTimerRunning,
  showControls,
  onStart,
  onPause,
  onReset,
  isAdmin = false,
  onToggleAdmin,
  adminLocked,
  setAdminLocked,
  adminModalRef
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
      isAdmin={isAdmin}
      onToggleAdmin={onToggleAdmin}
      adminLocked={adminLocked}
      setAdminLocked={setAdminLocked}
      adminModalRef={adminModalRef}
    />
  );
};

export default GameMetadata;
