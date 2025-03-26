
import React from "react";
import { Star } from "lucide-react";

interface BreakIndicatorProps {
  hasBreak: boolean;
  color: string;
  side?: 'A' | 'B';
}

const BreakIndicator = ({ hasBreak, color, side = 'A' }: BreakIndicatorProps) => {
  if (!hasBreak) return null;
  
  const positionClass = side === 'A' 
    ? "top-2 left-2" 
    : "top-2 right-2";
  
  return (
    <div className={`absolute ${positionClass} z-10`}>
      <div className="relative">
        <Star className={`h-8 w-8`} style={{ color, fill: `${color}80` }} />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">B</span>
        <div className="absolute inset-0 -z-10 animate-pulse rounded-full blur-md" style={{ backgroundColor: `${color}50` }}></div>
      </div>
    </div>
  );
};

export default BreakIndicator;
