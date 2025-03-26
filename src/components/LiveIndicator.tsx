
import React from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  isLive: boolean;
}

const LiveIndicator: React.FC<LiveIndicatorProps> = ({ isLive }) => {
  return (
    <div className="flex items-center gap-3 justify-center my-4">
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
        isLive ? "bg-[#ea384c] shadow-[0_0_15px_rgba(234,56,76,0.8)]" : "bg-gray-500"
      )}>
        <Play fill="white" size={18} className="ml-1 text-white" />
      </div>
      <span className={cn(
        "text-2xl font-bold uppercase tracking-wider transition-all duration-500",
        isLive 
          ? "text-[#ea384c] animate-[pulse_3s_ease-in-out_infinite] drop-shadow-[0_0_10px_rgba(234,56,76,0.8)]" 
          : "text-gray-500"
      )}>
        LIVE
      </span>
    </div>
  );
};

export default LiveIndicator;
