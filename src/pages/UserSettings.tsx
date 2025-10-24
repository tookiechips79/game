
import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Receipt, 
  User, 
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
        
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
            <TabsTrigger value="account" className="flex items-center gap-2 text-white">
              <User className="h-4 w-4" style={{ color: '#95deff' }} />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
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
          
          {/* Account Tab */}
          <TabsContent value="account">
            <Card className="border-2" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader>
                <CardTitle className="text-2xl" style={{ color: '#fa1593' }}>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="mb-1" style={{ color: '#95deff' }}>Username</h3>
                    <p className="text-xl font-medium text-white">{currentUser.name}</p>
                  </div>
                  <div>
                    <h3 className="mb-1" style={{ color: '#95deff' }}>Current Balance</h3>
                    <p className="text-xl font-medium" style={{ color: '#fa1593' }}>{currentUser.credits} COINS</p>
                  </div>
                  <div>
                    <h3 className="mb-1" style={{ color: '#95deff' }}>Win/Loss Record</h3>
                    <p className="text-xl font-medium text-white">
                      <span style={{ color: '#95deff' }}>{currentUser.wins} Wins</span>{" "}
                      / <span style={{ color: '#fa1593' }}>{currentUser.losses} Losses</span>
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-1" style={{ color: '#95deff' }}>Win Rate</h3>
                    <p className="text-xl font-medium text-white">
                      {currentUser.wins + currentUser.losses > 0 
                        ? Math.round((currentUser.wins / (currentUser.wins + currentUser.losses)) * 100) 
                        : 0}%
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t" style={{ borderColor: '#750037' }}>
                  <Button onClick={handleLogout} variant="destructive" className="w-full md:w-auto" style={{ backgroundColor: '#fa1593' }}>
                    <LogOut className="h-4 w-4 mr-2" style={{ color: 'white' }} />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
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
