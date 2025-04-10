import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Coins, CreditCard, Shield, Zap, DollarSign, CreditCard as CreditCardIcon } from "lucide-react";
import { toast } from "sonner";

const PaymentPage = () => {
  const { currentUser, addCredits } = useUser();
  const navigate = useNavigate();
  
  const [subscriptionSelected, setSubscriptionSelected] = useState<boolean>(false);
  const [reloadAmount, setReloadAmount] = useState<number>(20);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'subscription' | 'reload'>('subscription');

  const subscriptionPrice = 20;
  const monthlyCoins = 200;

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Add space after every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as MM/YY
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    
    return digits;
  };

  const handleReloadAmountChange = (amount: number) => {
    setReloadAmount(amount);
    setPaymentMode('reload');
  };

  const handleSubscriptionSelect = () => {
    setSubscriptionSelected(!subscriptionSelected);
    setPaymentMode('subscription');
  };

  // Sample test card numbers
  const testCards = [
    { name: "Valid Card", number: "4242 4242 4242 4242", expiry: "12/25", cvv: "123" },
    { name: "Decline", number: "4000 0000 0000 0002", expiry: "12/25", cvv: "123" }
  ];

  const fillTestCard = (card: { number: string, expiry: string, cvv: string }) => {
    setCardNumber(card.number);
    setExpiryDate(card.expiry);
    setCvv(card.cvv);
    setName("Test User");
    setBillingAddress("123 Test St, Test City, TS 12345");
    toast.info("Test card applied", {
      description: "You can now process a test payment"
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!cardNumber || !expiryDate || !cvv || !name) {
      toast.error("Please fill in all payment details");
      return;
    }

    if (paymentMode === 'subscription' && !subscriptionSelected) {
      toast.error("Please select the subscription plan");
      return;
    }

    if (paymentMode === 'reload' && (!reloadAmount || reloadAmount < 5)) {
      toast.error("Please enter a valid reload amount (minimum $5)");
      return;
    }

    // Check if user is selected
    if (!currentUser) {
      toast.error("Please select a user first", {
        description: "Go to the betting page to select a user before making a purchase."
      });
      return;
    }

    // Simulate payment processing
    setIsProcessing(true);
    
    setTimeout(() => {
      if (currentUser) {
        if (paymentMode === 'subscription') {
          // Add subscription without free coins
          toast.success("Subscription Active!", {
            description: `Your monthly subscription is now active for ${currentUser.name}.`
          });
        } else {
          // Add reload credits
          addCredits(currentUser.id, reloadAmount);
          
          toast.success("Coins Added!", {
            description: `${reloadAmount} coins have been added to ${currentUser.name}'s account.`
          });
        }
        
        // Navigate to betting after successful payment
        setTimeout(() => {
          navigate("/betting");
        }, 2000);
      }
      
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#a3e635]">Gamebird Membership</h1>
          {currentUser && (
            <div className="bg-[#a3e635]/20 p-2 rounded-lg">
              <span className="text-[#a3e635] font-bold">Current User: {currentUser.name} ({currentUser.credits} coins)</span>
            </div>
          )}
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Become a Member777</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Subscribe to our platform to access all betting features and reload your coins anytime.
            </p>
            {!currentUser && (
              <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg inline-block">
                <p className="text-red-300">Please select a user from the betting page first</p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/betting")}
                  className="mt-2 border-red-500 text-red-300 hover:bg-red-950"
                >
                  Go to Betting
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Subscription Plan */}
            <Card className={`w-full h-full ${subscriptionSelected ? 'bg-[#a3e635]/10 border-[#a3e635] border-2' : 'bg-gray-900 border-gray-800'}`}>
              <CardHeader className={`${subscriptionSelected ? 'bg-[#a3e635]/20' : ''}`}>
                <CardTitle className="flex justify-between items-center">
                  <span>Monthly Membership</span>
                </CardTitle>
                <CardDescription className="flex items-end gap-1 mt-2">
                  <span className="text-2xl font-bold text-white">${subscriptionPrice}</span>
                  <span className="text-gray-400">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-300 mb-4">Full access to all betting features</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 mt-0.5 text-[#a3e635]" />
                    <span className="text-sm">Live betting on all matches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 mt-0.5 text-[#a3e635]" />
                    <span className="text-sm">Complete betting history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 mt-0.5 text-[#a3e635]" />
                    <span className="text-sm">Priority customer support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 mt-0.5 text-[#a3e635]" />
                    <span className="text-sm">Required to place bets</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSubscriptionSelect} 
                  variant={subscriptionSelected ? "lime" : "outline"}
                  className="w-full"
                >
                  {subscriptionSelected ? "Selected" : "Select"}
                </Button>
              </CardFooter>
            </Card>

            {/* Reload Coins */}
            <Card className={`w-full h-full ${paymentMode === 'reload' ? 'bg-[#a3e635]/10 border-[#a3e635] border-2' : 'bg-gray-900 border-gray-800'}`}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Reload Coins</span>
                  <Coins className="h-5 w-5 text-[#a3e635]" />
                </CardTitle>
                <CardDescription className="flex items-end gap-1 mt-2">
                  <span className="text-2xl font-bold text-white">${reloadAmount}</span>
                  <span className="text-gray-400">= {reloadAmount} coins</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-300 mb-4">Add more coins to your account anytime</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleReloadAmountChange(10)}
                      className={`${reloadAmount === 10 && paymentMode === 'reload' ? 'bg-[#a3e635] text-black' : 'bg-gray-800 text-white'} border-gray-700`}
                    >
                      $10
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleReloadAmountChange(20)}
                      className={`${reloadAmount === 20 && paymentMode === 'reload' ? 'bg-[#a3e635] text-black' : 'bg-gray-800 text-white'} border-gray-700`}
                    >
                      $20
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleReloadAmountChange(50)}
                      className={`${reloadAmount === 50 && paymentMode === 'reload' ? 'bg-[#a3e635] text-black' : 'bg-gray-800 text-white'} border-gray-700`}
                    >
                      $50
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleReloadAmountChange(100)}
                      className={`${reloadAmount === 100 && paymentMode === 'reload' ? 'bg-[#a3e635] text-black' : 'bg-gray-800 text-white'} border-gray-700`}
                    >
                      $100
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleReloadAmountChange(200)}
                      className={`${reloadAmount === 200 && paymentMode === 'reload' ? 'bg-[#a3e635] text-black' : 'bg-gray-800 text-white'} border-gray-700`}
                    >
                      $200
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <Label htmlFor="customAmount" className="mr-2">Custom:</Label>
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="customAmount"
                        type="number" 
                        min="5"
                        value={reloadAmount}
                        onChange={(e) => handleReloadAmountChange(Number(e.target.value))}
                        className="pl-10 bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-gray-400 w-full text-center">1:1 exchange rate - $1 = 1 coin</p>
              </CardFooter>
            </Card>
          </div>
          
          {/* Payment Information */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 flex justify-between items-center">
              <span>Payment Information</span>
              <div className="space-x-2">
                {testCards.map((card, index) => (
                  <Button 
                    key={index}
                    size="sm" 
                    variant="outline" 
                    onClick={() => fillTestCard(card)}
                    className="text-xs bg-gray-800 hover:bg-gray-700 border-gray-700"
                  >
                    {card.name}
                  </Button>
                ))}
              </div>
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        className="pl-10 bg-gray-800 border-gray-700"
                        required
                      />
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                        maxLength={5}
                        className="bg-gray-800 border-gray-700"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <div className="relative">
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                          maxLength={3}
                          className="pl-10 bg-gray-800 border-gray-700"
                          required
                        />
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="name">Cardholder Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="billingAddress">Billing Address</Label>
                    <Textarea
                      id="billingAddress"
                      placeholder="Enter your billing address"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      className="h-[120px] bg-gray-800 border-gray-700"
                    />
                  </div>
                  
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h4 className="text-lg font-bold text-white mb-2">Order Summary</h4>
                    {paymentMode === 'subscription' ? (
                      <>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-300">Monthly Membership</span>
                          <span>${subscriptionPrice}/month</span>
                        </div>
                        <div className="border-t border-gray-700 my-2 pt-2 flex justify-between font-bold">
                          <span>Total</span>
                          <span>${subscriptionPrice}/month</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-300">Coin Reload</span>
                          <span>${reloadAmount}</span>
                        </div>
                        <div className="flex justify-between mb-2 text-[#a3e635]">
                          <span className="flex items-center gap-1">
                            <Coins className="h-4 w-4" />
                            Added Coins
                          </span>
                          <span>{reloadAmount} coins</span>
                        </div>
                        <div className="border-t border-gray-700 my-2 pt-2 flex justify-between font-bold">
                          <span>Total</span>
                          <span>${reloadAmount}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mr-2"
                  onClick={() => navigate("/betting")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="lime"
                  className="min-w-[150px]"
                  disabled={isProcessing || !currentUser}
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-pulse">Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="h-4 w-4 mr-1" />
                      {paymentMode === 'subscription' ? 'Subscribe Now' : 'Purchase Coins'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
          
          <div className="text-center text-sm text-gray-400">
            <p className="mb-2">
              By proceeding, you agree to our Terms of Service and Privacy Policy.
            </p>
            <p>
              A valid subscription is required to place bets on our platform.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;
