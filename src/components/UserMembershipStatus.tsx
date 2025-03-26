
import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BadgeCheck, 
  BadgeAlert, 
  Clock, 
  CreditCard, 
  Calendar, 
  AlertCircle,
  ShieldAlert,
  Check
} from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format, addMonths } from "date-fns";
import { Link } from "react-router-dom";

// In a real app, these would come from a database
// For demonstration, we'll create a mock membership that starts from today
const mockMembership = {
  isActive: true,
  startDate: Date.now(),
  nextBillingDate: addMonths(new Date(), 1).getTime(),
  plan: "Monthly",
  price: 20,
  autoRenew: true
};

interface UserMembershipStatusProps {
  userId: string;
}

const UserMembershipStatus: React.FC<UserMembershipStatusProps> = ({ userId }) => {
  const { getUserById } = useUser();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [membership, setMembership] = useState(mockMembership);
  
  const user = getUserById(userId);
  
  if (!user) {
    return <div>User not found</div>;
  }
  
  const handleCancelMembership = () => {
    // In a real app, this would call an API to cancel the subscription
    setMembership({
      ...membership,
      isActive: false,
      autoRenew: false
    });
    
    toast.success("Membership Cancelled", {
      description: "Your membership will remain active until the end of the current billing period."
    });
    
    setCancelDialogOpen(false);
  };
  
  const handleReactivate = () => {
    // In a real app, this would call an API to reactivate the subscription
    setMembership({
      ...membership,
      isActive: true,
      autoRenew: true
    });
    
    toast.success("Membership Reactivated", {
      description: "Your membership has been successfully reactivated."
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Membership Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Membership Status</h3>
            {membership.isActive ? (
              <Badge variant="outline" className="bg-green-900/50 text-green-400 border-green-600">
                <BadgeCheck className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-900/50 text-red-400 border-red-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-400">
                <Calendar className="h-5 w-5 mr-2" />
                Start Date
              </div>
              <div className="font-medium">
                {format(new Date(membership.startDate), "MMMM d, yyyy")}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-400">
                <Clock className="h-5 w-5 mr-2" />
                Next Billing
              </div>
              <div className="font-medium">
                {format(new Date(membership.nextBillingDate), "MMMM d, yyyy")}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-400">
                <CreditCard className="h-5 w-5 mr-2" />
                Plan
              </div>
              <div className="font-medium">
                {membership.plan} (${membership.price}/month)
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-400">
                <BadgeAlert className="h-5 w-5 mr-2" />
                Auto-Renew
              </div>
              <Badge variant={membership.autoRenew ? "outline" : "secondary"} className={
                membership.autoRenew 
                  ? "bg-blue-900/50 text-blue-400 border-blue-600" 
                  : "bg-gray-700 text-gray-300"
              }>
                {membership.autoRenew ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
          
          <div className="mt-6">
            {membership.isActive ? (
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel Membership
              </Button>
            ) : (
              <Button 
                variant="default" 
                className="w-full bg-[#a3e635] hover:bg-[#a3e635]/90 text-black"
                onClick={handleReactivate}
              >
                Reactivate Membership
              </Button>
            )}
          </div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Membership Benefits</h3>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="mt-1 mr-3 bg-[#a3e635]/20 p-1 rounded-full">
                <Check className="h-4 w-4 text-[#a3e635]" />
              </div>
              <div>
                <p className="font-medium">Full Betting Access</p>
                <p className="text-sm text-gray-400">Place bets on all games without restrictions</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mt-1 mr-3 bg-[#a3e635]/20 p-1 rounded-full">
                <Check className="h-4 w-4 text-[#a3e635]" />
              </div>
              <div>
                <p className="font-medium">Complete Transaction History</p>
                <p className="text-sm text-gray-400">Track all your betting activity and coin purchases</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mt-1 mr-3 bg-[#a3e635]/20 p-1 rounded-full">
                <Check className="h-4 w-4 text-[#a3e635]" />
              </div>
              <div>
                <p className="font-medium">Premium Customer Support</p>
                <p className="text-sm text-gray-400">Get priority assistance for any issues</p>
              </div>
            </div>
            
            {!membership.isActive && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <ShieldAlert className="h-5 w-5" />
                  <p className="font-bold">Membership Required</p>
                </div>
                <p className="text-sm text-gray-300 mb-4">
                  Your membership is currently inactive. You won't be able to place bets until you reactivate your subscription.
                </p>
                <Link to="/subscription">
                  <Button 
                    variant="default" 
                    className="w-full bg-[#a3e635] hover:bg-[#a3e635]/90 text-black"
                  >
                    View Subscription Plans
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Cancel Membership Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Membership?</AlertDialogTitle>
            <AlertDialogDescription>
              Your membership will remain active until the end of the current billing period 
              ({format(new Date(membership.nextBillingDate), "MMMM d, yyyy")}). 
              After that date, you will no longer be able to place bets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 text-white">
              Keep Membership
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelMembership}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserMembershipStatus;
