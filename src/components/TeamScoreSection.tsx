
import React, { useState, useEffect } from "react";
import { Trophy, Circle, PlusCircle, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import FlipCounter from "@/components/FlipCounter";
import { Award } from "lucide-react";
import PlayerAvatar from "@/components/PlayerAvatar";

interface TeamScoreSectionProps {
  teamName: string;
  games: number;
  balls: number;
  hasBreak: boolean;
  showControls: boolean;
  isMatchStarted: boolean;
  color: string;
  onBreakChange: () => void;
  onWinConfirmOpen: () => void;
  onBallIncrement: () => void;
  onBallDecrement: () => void;
  onGameIncrement: () => void;
  onGameDecrement: () => void;
  onNameChange?: (name: string) => void;
}

const TeamScoreSection = ({
  teamName,
  games,
  balls,
  hasBreak,
  showControls,
  isMatchStarted,
  color,
  onBreakChange,
  onWinConfirmOpen,
  onBallIncrement,
  onBallDecrement,
  onGameIncrement,
  onGameDecrement,
  onNameChange
}: TeamScoreSectionProps) => {  
  // Force re-render for Chrome compatibility
  const [renderKey, setRenderKey] = useState(0);
  
  useEffect(() => {
    // Force re-render when balls or games change to fix Chrome glitching
    setRenderKey(prev => prev + 1);
  }, [balls, games]);
  
  return (
    <div key={renderKey} className={`col-span-1 p-4 pt-24 bg-gradient-to-r from-[${color}]/30 to-[${color}]/20 relative rounded-l-2xl`}>
      <div className="flex flex-col items-center justify-center mb-2 mt-8">
        <PlayerAvatar playerName={teamName} />
        
        {showControls && onNameChange ? (
          <input
            type="text"
            value={teamName}
            onChange={(e) => onNameChange(e.target.value)}
            className="text-xl font-bold bg-transparent border-b border-[#fa1593]/50 text-center focus:outline-none focus:border-[#fa1593] text-white"
          />
        ) : (
          <span className="text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(250,21,147,0.7)]">{teamName}</span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-3">
        <div className="bg-[#1EAEDB] rounded-2xl p-3 flex flex-col items-center transition-all hover:bg-[#1EAEDB]/90 shadow-[0_0_15px_rgba(30,174,219,0.5)]">
          <div className="flex items-center justify-center mb-1">
            <Trophy className="h-5 w-5 text-gray-900 mr-1" />
            <span className="text-xs font-medium text-gray-900">GAMES</span>
          </div>
          <div className="flex justify-center">
            <FlipCounter value={games} color="white" />
          </div>
          
          {showControls && (
            <div className="flex space-x-2 mt-2">
              <Button
                onClick={onGameDecrement}
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-gray-800/80 border-gray-700 hover:bg-gray-700 text-[#1EAEDB]"
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
              <Button
                onClick={onGameIncrement}
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-gray-800/80 border-gray-700 hover:bg-gray-700 text-[#1EAEDB]"
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="bg-[#1EAEDB] rounded-2xl p-3 flex flex-col items-center transition-all hover:bg-[#1EAEDB]/90 shadow-[0_0_15px_rgba(30,174,219,0.5)]">
          <div className="flex items-center justify-center mb-1">
            <Circle className="h-5 w-5 text-gray-900 mr-1 fill-gray-900" />
            <span className="text-xs font-medium text-gray-900">BALLS</span>
          </div>
          <div className="flex justify-center">
            <FlipCounter value={balls} color="white" />
          </div>
          
          {showControls && (
            <div className="flex space-x-2 mt-2">
              <Button
                onClick={onBallDecrement}
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-gray-800/80 border-gray-700 hover:bg-gray-700 text-[#1EAEDB]"
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
              <Button
                onClick={onBallIncrement}
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-gray-800/80 border-gray-700 hover:bg-gray-700 text-[#1EAEDB]"
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {showControls && isMatchStarted && (
        <div className="mt-4 flex justify-center space-x-2">
          <button 
            onClick={onBreakChange}
            className={`px-3 py-1 text-sm rounded-xl text-white transition-colors shadow-md`}
            style={{ backgroundColor: hasBreak ? '#fa1593' : '#6b7280' }}
          >
            Has Break
          </button>
          
          <Button 
            onClick={onWinConfirmOpen}
            className="px-3 py-1 text-sm rounded-xl text-white transition-all duration-300"
            style={{ backgroundColor: '#fa1593' }}
          >
            <Award className="h-4 w-4 mr-1" /> Win Game
          </Button>
        </div>
      )}
    </div>
  );
};

export default TeamScoreSection;
