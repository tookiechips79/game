
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
import { Link, useNavigate } from "react-router-dom";

// Membership data based on user's actual status

interface UserMembershipStatusProps {
  userId: string;
}

const UserMembershipStatus: React.FC<UserMembershipStatusProps> = ({ userId }) => {
  const { getUserById } = useUser();
  const navigate = useNavigate();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  const user = getUserById(userId);
  
  // Create membership data based on user's actual status
  const membership = {
    isActive: user?.membershipStatus === 'active',
    startDate: user?.subscriptionDate || null,
    nextBillingDate: user?.subscriptionDate ? addMonths(new Date(user.subscriptionDate), 1).getTime() : null,
    plan: "Monthly",
    price: 20,
    autoRenew: true
  };
  
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
    // Redirect to subscription page to reactivate membership
    navigate("/subscription");
  };
  
  return (
    <div className="space-y-6">
      {/* Membership Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-2 rounded-xl p-6" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold" style={{ color: '#fa1593' }}>Membership Status</h3>
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
              <div className="flex items-center" style={{ color: '#95deff' }}>
                <Calendar className="h-5 w-5 mr-2" />
                Start Date
              </div>
              <div className="font-medium text-white">
                {format(new Date(membership.startDate), "MMMM d, yyyy")}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ color: '#95deff' }}>
                <Clock className="h-5 w-5 mr-2" />
                Next Billing
              </div>
              <div className="font-medium text-white">
                {format(new Date(membership.nextBillingDate), "MMMM d, yyyy")}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ color: '#95deff' }}>
                <CreditCard className="h-5 w-5 mr-2" />
                Plan
              </div>
              <div className="font-medium text-white">
                {membership.plan} (${membership.price}/month)
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ color: '#95deff' }}>
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
                style={{ backgroundColor: '#fa1593' }}
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel Membership
              </Button>
            ) : (
              <Button 
                variant="default" 
                className="w-full text-white"
                style={{ backgroundColor: '#fa1593' }}
                onClick={handleReactivate}
              >
                Reactivate Membership
              </Button>
            )}
          </div>
        </div>
        
        <div className="border-2 rounded-xl p-6" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
          <h3 className="text-xl font-bold mb-4" style={{ color: '#fa1593' }}>Membership Benefits</h3>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="mt-1 mr-3 p-1 rounded-full" style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }}>
                <Check className="h-4 w-4" style={{ color: '#fa1593' }} />
              </div>
              <div>
                <p className="font-medium text-white">Full Betting Access</p>
                <p className="text-sm" style={{ color: '#95deff' }}>Place bets on all games without restrictions</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mt-1 mr-3 p-1 rounded-full" style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }}>
                <Check className="h-4 w-4" style={{ color: '#fa1593' }} />
              </div>
              <div>
                <p className="font-medium text-white">Complete Transaction History</p>
                <p className="text-sm" style={{ color: '#95deff' }}>Track all your betting activity and coin purchases</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mt-1 mr-3 p-1 rounded-full" style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }}>
                <Check className="h-4 w-4" style={{ color: '#fa1593' }} />
              </div>
              <div>
                <p className="font-medium text-white">Premium Customer Support</p>
                <p className="text-sm" style={{ color: '#95deff' }}>Get priority assistance for any issues</p>
              </div>
            </div>
            
            {!membership.isActive && (
              <div className="mt-6 p-4 border-2 rounded-lg" style={{ backgroundColor: 'rgba(117, 0, 55, 0.2)', borderColor: '#fa1593' }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: '#fa1593' }}>
                  <ShieldAlert className="h-5 w-5" />
                  <p className="font-bold">Membership Required</p>
                </div>
                <p className="text-sm text-white mb-4">
                  Your membership is currently inactive. You won't be able to place bets until you reactivate your subscription.
                </p>
                <Link to="/subscription">
                  <Button 
                    variant="default" 
                    className="w-full text-white"
                    style={{ backgroundColor: '#fa1593' }}
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
        <AlertDialogContent className="border-2" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: '#fa1593' }}>Cancel Membership?</AlertDialogTitle>
            <AlertDialogDescription className="text-white">
              Your membership will remain active until the end of the current billing period 
              ({format(new Date(membership.nextBillingDate), "MMMM d, yyyy")}). 
              After that date, you will no longer be able to place bets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-white" style={{ backgroundColor: '#052240' }}>
              Keep Membership
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelMembership}
              className="text-white"
              style={{ backgroundColor: '#fa1593' }}
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
