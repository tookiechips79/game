
import React from "react";
import GameTimer from "@/components/GameTimer";
import LiveIndicator from "@/components/LiveIndicator";
import { Button } from "@/components/ui/button";
import { Unlock, Lock } from "lucide-react";

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
  adminLocked?: boolean;
  setAdminLocked?: (locked: boolean) => void;
  adminModalRef?: React.RefObject<{ openModal: () => void }>;
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
  onToggleAdmin,
  adminLocked,
  setAdminLocked,
  adminModalRef
}: GameHeaderProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 flex items-start justify-between z-50 pt-4 px-4 pointer-events-none">
      {/* Left side - empty for balance */}
      <div className="w-24"></div>
      
      {/* Center - Game info */}
      <div className="flex flex-col items-center space-y-3 pointer-events-auto">
        {/* Live Indicator */}
        <LiveIndicator isLive={isTimerRunning} />
        
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
      </div>
      
      {/* Right side - Admin button - ALWAYS VISIBLE AND ACCESSIBLE */}
      <div className="flex justify-end w-32 pointer-events-auto">
        <Button
          variant="outline"
          size="sm"
          className={`text-xs whitespace-nowrap font-semibold ${
            isAdmin ? 'text-white hover:bg-opacity-90' : ''
          }`}
          style={isAdmin ? { backgroundColor: '#fa1593', borderColor: '#fa1593' } : { borderColor: '#fa1593', color: '#95deff' }}
          onClick={() => {
            console.log('🔐 [GameHeader] Admin button clicked, isAdmin:', isAdmin, 'adminLocked:', adminLocked);
            if (isAdmin) {
              // If admin is active, lock it (disable admin mode)
              console.log('🔐 [GameHeader] Admin is active, LOCKING admin mode');
              // First, lock the admin
              if (setAdminLocked) {
                setAdminLocked(true);
              }
              // Then toggle admin mode OFF
              if (onToggleAdmin) {
                onToggleAdmin();
              }
            } else {
              // If admin is not active, open password modal to unlock
              console.log('🔐 [GameHeader] Admin is not active, opening password modal to UNLOCK');
              if (adminModalRef?.current) {
                adminModalRef.current.openModal();
              }
            }
          }}
        >
          {isAdmin ? (
            <>
              <Lock className="h-4 w-4 mr-1" />
              Lock
            </>
          ) : (
            <>
              <Unlock className="h-4 w-4 mr-1" />
              Unlock
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default GameHeader;
