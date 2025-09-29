import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Coins, CreditCard, Zap, DollarSign, User, Wallet, Home } from "lucide-react";
import { toast } from "sonner";

const ReloadCoinsPage = () => {
  const { currentUser, addCredits, users } = useUser();
  const navigate = useNavigate();
  
  const [reloadAmount, setReloadAmount] = useState<number>(20);
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || "");
  const [isProcessing, setIsProcessing] = useState(false);

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  const handleReloadAmountChange = (amount: number) => {
    setReloadAmount(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    if (!reloadAmount || reloadAmount < 1) {
      toast.error("Please enter a valid reload amount (minimum 1 coin)");
      return;
    }

    // Simulate payment processing
    setIsProcessing(true);
    
    setTimeout(() => {
      // Add reload credits
      addCredits(selectedUserId, reloadAmount, true);
      
      toast.success("Coins Reloaded!", {
        description: `${reloadAmount} coins have been added to the selected account.`
      });
      
      setIsProcessing(false);
      
      // Reset form
      setReloadAmount(20);
    }, 1500);
  };

  const selectedUser = users.find(user => user.id === selectedUserId);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a192f] to-[#1a2332] border-b border-[#F97316]/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#F97316] hover:text-[#FBBF24] hover:bg-[#F97316]/10"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/betting-queue")}
                className="text-[#F97316] hover:text-[#FBBF24] hover:bg-[#F97316]/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Betting
              </Button>
              <div className="h-6 w-px bg-[#F97316]/30" />
              <div className="flex items-center space-x-2">
                <Coins className="h-6 w-6 text-[#F97316]" />
                <h1 className="text-2xl font-bold text-white">Reload Coins</h1>
              </div>
            </div>
            
            {currentUser && (
              <div className="flex items-center space-x-3 bg-[#F97316]/20 px-4 py-2 rounded-full">
                <User className="h-4 w-4 text-[#F97316]" />
                <span className="text-[#F97316] font-medium">{currentUser.name}</span>
                <div className="flex items-center space-x-1">
                  <Wallet className="h-4 w-4 text-[#F97316]" />
                  <span className="text-white font-bold">{currentUser.credits}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card border-[#F97316]/50 bg-[#0a192f]/70 shadow-lg rounded-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold text-[#F97316] flex items-center justify-center space-x-3">
                <Coins className="h-8 w-8" />
                <span>Reload Coins</span>
              </CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                Add coins to any user account instantly
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Selection */}
                <div className="space-y-2">
                  <Label htmlFor="user" className="text-[#F97316] font-medium">
                    Select User
                  </Label>
                  <select
                    id="user"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all"
                  >
                    <option value="">Choose a user...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.credits} coins)
                      </option>
                    ))}
                  </select>
                  {selectedUser && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <User className="h-4 w-4" />
                      <span>Current balance: {selectedUser.credits} coins</span>
                    </div>
                  )}
                </div>

                {/* Amount Selection */}
                <div className="space-y-4">
                  <Label className="text-[#F97316] font-medium">
                    Reload Amount
                  </Label>
                  
                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant={reloadAmount === amount ? "default" : "outline"}
                        onClick={() => handleReloadAmountChange(amount)}
                        className={`h-12 font-bold transition-all ${
                          reloadAmount === amount
                            ? "bg-[#F97316] text-black hover:bg-[#FBBF24]"
                            : "border-[#F97316]/50 text-[#F97316] hover:bg-[#F97316]/10"
                        }`}
                      >
                        <Coins className="h-4 w-4 mr-2" />
                        {amount}
                      </Button>
                    ))}
                  </div>

                  {/* Custom Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="customAmount" className="text-gray-300">
                      Or enter custom amount:
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="customAmount"
                        type="number"
                        min="1"
                        value={reloadAmount}
                        onChange={(e) => setReloadAmount(Number(e.target.value))}
                        className="pl-10 bg-gray-800/50 border-gray-600 text-white focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>
                </div>

                {/* Reload Summary */}
                {selectedUser && reloadAmount > 0 && (
                  <div className="bg-[#F97316]/10 border border-[#F97316]/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#F97316] font-medium">Reload Summary</p>
                        <p className="text-gray-300 text-sm">
                          Adding {reloadAmount} coins to {selectedUser.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-lg">
                          {selectedUser.credits} → {selectedUser.credits + reloadAmount}
                        </p>
                        <p className="text-[#F97316] text-sm">coins</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!selectedUserId || !reloadAmount || isProcessing}
                  className="w-full h-14 bg-[#F97316] hover:bg-[#FBBF24] text-black font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Reload Coins</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 glass-card border-[#1EAEDB]/50 bg-[#0a192f]/50 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="bg-[#1EAEDB]/20 p-2 rounded-lg">
                  <CreditCard className="h-5 w-5 text-[#1EAEDB]" />
                </div>
                <div>
                  <h3 className="text-[#1EAEDB] font-medium mb-2">Instant Reload</h3>
                  <p className="text-gray-300 text-sm">
                    Coins are added instantly to the selected account. No payment processing required for admin reloads.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReloadCoinsPage;
