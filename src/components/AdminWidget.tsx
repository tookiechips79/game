
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
        className="w-full bg-purple-600 border-purple-600 text-white hover:bg-purple-700"
        onClick={() => setIsHidden(false)}
      >
        <ShieldCheck className="h-4 w-4 mr-2" />
        Show Admin Panel
      </Button>
    );
  }

  return (
    <Card className="bg-gray-900 border-2 border-purple-600 w-52 hover:border-purple-700 transition-colors rounded-xl overflow-hidden shadow-[0_0_15px_rgba(147,51,234,0.3)]">
      <CardContent className="p-0">
        {/* Header */}
        <div 
          className="p-3 bg-gradient-to-r from-purple-600 to-purple-500 cursor-pointer flex items-center justify-between rounded-t-xl"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center">
            <ShieldCheck className="h-5 w-5 text-white mr-2" />
            <h3 className="font-bold text-white">Admin Panel</h3>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:text-white hover:bg-purple-700"
              onClick={(e) => {
                e.stopPropagation();
                setIsHidden(true);
              }}
            >
              <EyeOff className="h-4 w-4" />
            </Button>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-white" />
            ) : (
              <ChevronDown className="h-5 w-5 text-white" />
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
              className={`w-full flex items-center gap-2 rounded-lg ${isAdmin ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600' : 'bg-gray-800 text-gray-300 border-gray-700'}`}
            >
              {isAdmin ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {isAdmin ? "Exit Admin Mode" : "Admin Mode"}
            </Button>
            
            {onToggleAgent && (
              <Button
                onClick={onToggleAgent}
                variant="outline"
                size="sm"
                className={`w-full flex items-center gap-2 rounded-lg ${isAgent ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' : 'bg-gray-800 text-gray-300 border-gray-700'}`}
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
