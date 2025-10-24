
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
      <Card className="border-2" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#fa1593' }}>
            <Wallet className="h-5 w-5" style={{ color: '#fa1593' }} />
            Your Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="p-6 rounded-xl border-2" style={{ backgroundColor: '#052240', borderColor: '#95deff' }}>
              <div className="flex justify-between items-center">
                <div style={{ color: '#95deff' }}>Available Balance</div>
                <div className="text-3xl font-bold" style={{ color: '#fa1593' }}>
                  {currentUser.credits} <span className="text-lg">COINS</span>
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t flex justify-between items-center" style={{ borderColor: '#750037' }}>
                <div className="text-sm" style={{ color: '#95deff' }}>Win/Loss Record</div>
                <div className="text-sm">
                  <span style={{ color: '#95deff' }}>{currentUser.wins} W</span>
                  {" / "}
                  <span style={{ color: '#fa1593' }}>{currentUser.losses} L</span>
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
      <Card className="border-2" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#fa1593' }}>
            <ArrowDownToLine className="h-5 w-5" style={{ color: '#fa1593' }} />
            Cashout Funds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm" style={{ color: '#95deff' }}>Cashout Amount</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={cashoutAmount || ''}
                  onChange={(e) => setCashoutAmount(Number(e.target.value))}
                  min={0}
                  max={currentUser.credits}
                  className="border-2 text-white"
                  style={{ backgroundColor: '#052240', borderColor: '#95deff' }}
                  placeholder="Enter amount"
                  disabled={isProcessing}
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleMaxAmount}
                  className="border-2 text-white"
                  style={{ backgroundColor: '#052240', borderColor: '#95deff' }}
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
                className={`border-2 rounded-lg ${cashoutAmount === 50 ? 'text-white' : 'text-white'}`}
                style={cashoutAmount === 50 ? { backgroundColor: '#fa1593', borderColor: '#fa1593' } : { backgroundColor: '#052240', borderColor: '#95deff' }}
                disabled={isProcessing || currentUser.credits < 50}
              >
                50
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCashoutAmount(100)}
                className={`border-2 rounded-lg ${cashoutAmount === 100 ? 'text-white' : 'text-white'}`}
                style={cashoutAmount === 100 ? { backgroundColor: '#fa1593', borderColor: '#fa1593' } : { backgroundColor: '#052240', borderColor: '#95deff' }}
                disabled={isProcessing || currentUser.credits < 100}
              >
                100
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCashoutAmount(200)}
                className={`border-2 rounded-lg ${cashoutAmount === 200 ? 'text-white' : 'text-white'}`}
                style={cashoutAmount === 200 ? { backgroundColor: '#fa1593', borderColor: '#fa1593' } : { backgroundColor: '#052240', borderColor: '#95deff' }}
                disabled={isProcessing || currentUser.credits < 200}
              >
                200
              </Button>
            </div>
            
            <Button 
              onClick={handleCashoutSubmit} 
              className="w-full text-white"
              style={{ backgroundColor: '#fa1593' }}
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
            
            <div className="text-xs mt-2" style={{ color: '#95deff' }}>
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
