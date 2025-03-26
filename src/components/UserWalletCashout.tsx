
import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, ArrowDownToLine, RefreshCw, DollarSign } from "lucide-react";
import { toast } from "sonner";

const UserWalletCashout: React.FC<{ userId: string }> = ({ userId }) => {
  const { currentUser, processCashout } = useUser();
  const [cashoutAmount, setCashoutAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleCashoutSubmit = () => {
    if (!currentUser) return;
    
    setIsProcessing(true);
    
    // Simulate a network delay
    setTimeout(() => {
      const success = processCashout(userId, cashoutAmount);
      if (success) {
        setCashoutAmount(0);
      }
      setIsProcessing(false);
    }, 1500);
  };

  const handleMaxAmount = () => {
    if (currentUser) {
      setCashoutAmount(currentUser.credits);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Wallet Balance Card */}
      <Card className="bg-gray-800/70 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#a3e635]" />
            Your Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700">
              <div className="flex justify-between items-center">
                <div className="text-gray-400">Available Balance</div>
                <div className="text-[#a3e635] text-3xl font-bold">
                  {currentUser.credits} <span className="text-lg">COINS</span>
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t border-gray-700 flex justify-between items-center">
                <div className="text-sm text-gray-400">Win/Loss Record</div>
                <div className="text-sm">
                  <span className="text-green-400">{currentUser.wins} W</span>
                  {" / "}
                  <span className="text-red-400">{currentUser.losses} L</span>
                  {" — "}
                  <span className="text-white">
                    {currentUser.wins + currentUser.losses > 0 
                      ? Math.round((currentUser.wins / (currentUser.wins + currentUser.losses)) * 100) 
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cashout Card */}
      <Card className="bg-gray-800/70 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-[#F97316]" />
            Cashout Funds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm text-gray-400">Cashout Amount</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={cashoutAmount || ''}
                  onChange={(e) => setCashoutAmount(Number(e.target.value))}
                  min={0}
                  max={currentUser.credits}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter amount"
                  disabled={isProcessing}
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleMaxAmount}
                  className="bg-gray-700 border-gray-600 text-white"
                  disabled={isProcessing}
                >
                  <DollarSign className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCashoutAmount(50)}
                className={`${cashoutAmount === 50 ? 'bg-[#F97316] text-black' : 'bg-gray-700 text-white'} border-gray-600 rounded-lg`}
                disabled={isProcessing || currentUser.credits < 50}
              >
                50
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCashoutAmount(100)}
                className={`${cashoutAmount === 100 ? 'bg-[#F97316] text-black' : 'bg-gray-700 text-white'} border-gray-600 rounded-lg`}
                disabled={isProcessing || currentUser.credits < 100}
              >
                100
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCashoutAmount(200)}
                className={`${cashoutAmount === 200 ? 'bg-[#F97316] text-black' : 'bg-gray-700 text-white'} border-gray-600 rounded-lg`}
                disabled={isProcessing || currentUser.credits < 200}
              >
                200
              </Button>
            </div>
            
            <Button 
              onClick={handleCashoutSubmit} 
              className="w-full bg-[#F97316] hover:bg-[#F97316]/90 text-black"
              disabled={isProcessing || !cashoutAmount || cashoutAmount <= 0 || cashoutAmount > currentUser.credits}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Cashout Now"
              )}
            </Button>
            
            <div className="text-xs text-gray-400 mt-2">
              Note: Cashouts will be processed according to our terms and conditions.
              The equivalent cash value will be sent to your registered payment method.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserWalletCashout;
