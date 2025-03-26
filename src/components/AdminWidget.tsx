
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, ShieldCheck, UserCog, ChevronDown, ChevronUp, EyeOff } from "lucide-react";

interface AdminWidgetProps {
  isAdmin: boolean;
  isAgent?: boolean;
  onToggleAdmin: () => void;
  onToggleAgent?: () => void;
}

const AdminWidget: React.FC<AdminWidgetProps> = ({
  isAdmin,
  isAgent = false,
  onToggleAdmin,
  onToggleAgent
}) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [isHidden, setIsHidden] = useState<boolean>(false);
  
  if (isHidden) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70"
        onClick={() => setIsHidden(false)}
      >
        <ShieldCheck className="h-4 w-4 mr-2" />
        Show Admin Panel
      </Button>
    );
  }

  return (
    <Card className="bg-gray-800/90 border border-gray-700 w-52 hover:bg-gray-800 transition-colors rounded-xl overflow-hidden shadow-[0_0_15px_rgba(249,115,22,0.3)]">
      <CardContent className="p-0">
        {/* Header */}
        <div 
          className="p-3 bg-gradient-to-r from-gray-800 to-gray-700 cursor-pointer flex items-center justify-between rounded-t-xl"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center">
            <ShieldCheck className="h-5 w-5 text-[#F97316] mr-2" />
            <h3 className="font-bold text-white">Admin Panel</h3>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-300 hover:text-white hover:bg-gray-700/50"
              onClick={(e) => {
                e.stopPropagation();
                setIsHidden(true);
              }}
            >
              <EyeOff className="h-4 w-4" />
            </Button>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-300" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-300" />
            )}
          </div>
        </div>
        
        {/* Content */}
        {expanded && (
          <div className="p-3 space-y-2">
            <Button
              onClick={onToggleAdmin}
              variant="outline"
              size="sm"
              className={`w-full flex items-center gap-2 rounded-lg ${isAdmin ? 'bg-[#F97316] hover:bg-[#F97316]/90 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              {isAdmin ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {isAdmin ? "Exit Admin Mode" : "Admin Mode"}
            </Button>
            
            {onToggleAgent && (
              <Button
                onClick={onToggleAgent}
                variant="outline"
                size="sm"
                className={`w-full flex items-center gap-2 rounded-lg ${isAgent ? 'bg-[#a3e635] hover:bg-[#a3e635]/90 text-black' : 'bg-gray-700 text-gray-300'}`}
              >
                <UserCog className="h-4 w-4" />
                {isAgent ? "Exit Agent Mode" : "Agent Mode"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminWidget;
