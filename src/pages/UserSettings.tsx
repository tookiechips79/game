
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:text-[#a3e635] hover:bg-[#a3e635]/10"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/betting-queue")}
              className="text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Account Settings</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400">
              {currentUser.name}
            </span>
            <div className="bg-[#a3e635]/20 p-2 rounded-xl text-[#a3e635] font-bold">
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
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="bets" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Bet History</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="membership" className="flex items-center gap-2">
              <BadgeAlert className="h-4 w-4" />
              <span className="hidden sm:inline">Membership</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Account Tab */}
          <TabsContent value="account">
            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-gray-400 mb-1">Username</h3>
                    <p className="text-xl font-medium">{currentUser.name}</p>
                  </div>
                  <div>
                    <h3 className="text-gray-400 mb-1">Current Balance</h3>
                    <p className="text-xl font-medium text-[#a3e635]">{currentUser.credits} COINS</p>
                  </div>
                  <div>
                    <h3 className="text-gray-400 mb-1">Win/Loss Record</h3>
                    <p className="text-xl font-medium">
                      <span className="text-green-400">{currentUser.wins} Wins</span>{" "}
                      / <span className="text-red-400">{currentUser.losses} Losses</span>
                    </p>
                  </div>
                  <div>
                    <h3 className="text-gray-400 mb-1">Win Rate</h3>
                    <p className="text-xl font-medium">
                      {currentUser.wins + currentUser.losses > 0 
                        ? Math.round((currentUser.wins / (currentUser.wins + currentUser.losses)) * 100) 
                        : 0}%
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-700">
                  <Button onClick={handleLogout} variant="destructive" className="w-full md:w-auto">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Wallet Tab */}
          <TabsContent value="wallet">
            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-[#F97316]" />
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
            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <History className="h-5 w-5" />
                  {isAdmin ? "All Users Bet History" : "Bet History"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UserTransactionHistory 
                  userId={currentUser.id} 
                  transactionType="bets"
                  isAdmin={isAdmin}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
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
            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BadgeAlert className="h-5 w-5" />
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
