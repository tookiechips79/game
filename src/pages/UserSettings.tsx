
import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Receipt, 
  History,
  CreditCard, 
  Settings, 
  LogOut,
  BadgeAlert,
  ShieldAlert,
  Clock,
  Wallet,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import UserTransactionHistory from "@/components/UserTransactionHistory";
import UserMembershipStatus from "@/components/UserMembershipStatus";
import AdminUserSelector from "@/components/AdminUserSelector";
import UserWalletCashout from "@/components/UserWalletCashout";
import HardLedgerBetHistory from "@/components/HardLedgerBetHistory";

const UserSettings = () => {
  const { currentUser, setCurrentUser } = useUser();
  const navigate = useNavigate();
  const [isAdmin] = useState(
    currentUser?.name?.toLowerCase() === "admin"
  );

  // If no user is logged in, redirect to landing page
  if (!currentUser) {
    navigate("/");
    return null;
  }

  const handleLogout = () => {
    setCurrentUser(null);
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#052240' }}>
      {/* Header */}
      <div className="border-b py-4" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:text-[#fa1593]"
                style={{ color: '#fa1593' }}
              >
                <Home className="h-4 w-4 mr-2" style={{ color: '#fa1593' }} />
                Home
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/betting-queue")}
              className="text-white"
              style={{ color: '#95deff' }}
            >
              <ArrowLeft className="h-5 w-5" style={{ color: '#95deff' }} />
            </Button>
            <h1 className="text-xl font-bold" style={{ color: '#fa1593' }}>Account Settings</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400" style={{ color: '#95deff' }}>
              {currentUser.name}
            </span>
            <div className="p-2 rounded-xl font-bold" style={{ backgroundColor: '#95deff', color: '#052240' }}>
              {currentUser.credits} COINS
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {isAdmin && (
          <AdminUserSelector />
        )}
        
        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
            <TabsTrigger value="wallet" className="flex items-center gap-2 text-white">
              <Wallet className="h-4 w-4" style={{ color: '#95deff' }} />
              <span className="hidden sm:inline">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="bets" className="flex items-center gap-2 text-white">
              <Receipt className="h-4 w-4" style={{ color: '#95deff' }} />
              <span className="hidden sm:inline">Bet History</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2 text-white">
              <CreditCard className="h-4 w-4" style={{ color: '#95deff' }} />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="membership" className="flex items-center gap-2 text-white">
              <BadgeAlert className="h-4 w-4" style={{ color: '#95deff' }} />
              <span className="hidden sm:inline">Membership</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Wallet Tab */}
          <TabsContent value="wallet">
            <Card className="border-2" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2" style={{ color: '#fa1593' }}>
                  <Wallet className="h-5 w-5" style={{ color: '#fa1593' }} />
                  Wallet & Cashout
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UserWalletCashout userId={currentUser.id} />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Bet History Tab */}
          <TabsContent value="bets">
            <Card className="border-2" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2" style={{ color: '#fa1593' }}>
                  <History className="h-5 w-5" style={{ color: '#fa1593' }} />
                  {isAdmin ? "All Users Bet History" : "Bet History"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HardLedgerBetHistory 
                  userId={currentUser.id} 
                  isAdmin={isAdmin}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="border-2" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2" style={{ color: '#fa1593' }}>
                  <CreditCard className="h-5 w-5" style={{ color: '#fa1593' }} />
                  {isAdmin ? "All Users Transaction History" : "Transaction History"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UserTransactionHistory 
                  userId={currentUser.id} 
                  transactionType="coins"
                  isAdmin={isAdmin}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Membership Tab */}
          <TabsContent value="membership">
            <Card className="border-2" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2" style={{ color: '#fa1593' }}>
                  <BadgeAlert className="h-5 w-5" style={{ color: '#fa1593' }} />
                  Membership Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UserMembershipStatus userId={currentUser.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserSettings;
