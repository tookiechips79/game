import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ChevronUp, ChevronDown, EyeOff } from "lucide-react";
import UserCreditSystem from "@/components/UserCreditSystem";
import AdminUserSelector from "@/components/AdminUserSelector";

interface CompactAdminWidgetProps {
  isAdmin: boolean;
  isAgent?: boolean;
}

const CompactAdminWidget: React.FC<CompactAdminWidgetProps> = ({
  isAdmin,
  isAgent = false
}) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [isHidden, setIsHidden] = useState<boolean>(false);

  if (isHidden) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full text-white hover:bg-opacity-90"
        style={{ backgroundColor: '#fa1593', borderColor: '#fa1593' }}
        onClick={() => setIsHidden(false)}
      >
        <ShieldCheck className="h-4 w-4 mr-2 text-white" />
        Show Admin Panel
      </Button>
    );
  }

  return (
    <Card className="w-full hover:bg-opacity-90 transition-colors rounded-xl overflow-hidden shadow-[0_0_15px_rgba(149,222,255,0.3)]" style={{ borderColor: '#95deff', backgroundColor: '#004b6b' }}>
      <CardContent className="p-0">
        {/* Header */}
        <div
          className="p-2 cursor-pointer flex items-center justify-between rounded-t-xl"
          style={{ background: 'linear-gradient(to right, #95deff, #004b6b)' }}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center">
            <ShieldCheck className="h-4 w-4 text-white mr-2" />
            <h3 className="font-bold text-white text-sm">Admin Panel</h3>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-white hover:text-white hover:bg-opacity-80"
              style={{ backgroundColor: 'transparent' }}
              onClick={(e) => {
                e.stopPropagation();
                setIsHidden(true);
              }}
            >
              <EyeOff className="h-3 w-3" />
            </Button>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-white" />
            ) : (
              <ChevronDown className="h-4 w-4 text-white" />
            )}
          </div>
        </div>

        {/* Content */}
        {expanded && (
          <div className="p-3 space-y-2" style={{ backgroundColor: '#004b6b' }}>
            <AdminUserSelector isAdmin={isAdmin} isAgent={isAgent} />
            <UserCreditSystem isAdmin={isAdmin} isAgent={isAgent} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompactAdminWidget;
