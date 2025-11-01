import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Coins, CreditCard, Shield, Zap, DollarSign, CreditCard as CreditCardIcon, Home } from "lucide-react";
import { toast } from "sonner";

const PaymentPage = () => {
  const { currentUser, addCredits, activateMembership } = useUser();
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
      description: "You can now process a test payment",
      className: "custom-toast-success"
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!cardNumber || !expiryDate || !cvv || !name) {
      toast.error("Please fill in all payment details", {
        className: "custom-toast-error"
      });
      return;
    }

    if (paymentMode === 'subscription' && !subscriptionSelected) {
      toast.error("Please select the subscription plan", {
        className: "custom-toast-error"
      });
      return;
    }

    if (paymentMode === 'reload' && (!reloadAmount || reloadAmount < 5)) {
      toast.error("Please enter a valid reload amount (minimum $5)", {
        className: "custom-toast-error"
      });
      return;
    }

    // Check if user is selected
    if (!currentUser) {
      toast.error("Please select a user first", {
        description: "Go to the betting page to select a user before making a purchase.",
        className: "custom-toast-error"
      });
      return;
    }

    // Simulate payment processing
    setIsProcessing(true);
    
    setTimeout(() => {
      if (currentUser) {
        if (paymentMode === 'subscription') {
          // Activate membership
          activateMembership(currentUser.id);
        } else {
          // Add reload credits
          addCredits(currentUser.id, reloadAmount);
          
          toast.success("Coins Added!", {
            description: `${reloadAmount} coins have been added to ${currentUser.name}'s account.`,
            className: "custom-toast-success"
          });
        }
        
        // Navigate to betting after successful payment
        setTimeout(() => {
          navigate("/betting-queue");
        }, 2000);
      }
      
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-opacity-20"
                style={{ color: '#95deff' }}
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold" style={{ color: '#95deff' }}>Gamebird Membership</h1>
          </div>
          {currentUser && (
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(149, 222, 255, 0.2)' }}>
              <span className="font-bold" style={{ color: '#95deff' }}>Current User: {currentUser.name} ({currentUser.credits} coins)</span>
            </div>
          )}
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Become a Member</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Subscribe to our platform to access all betting features and reload your coins anytime.
            </p>
            {!currentUser && (
              <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg inline-block">
                <p className="text-red-300">Please select a user from the betting page first</p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/betting-queue")}
                  className="mt-2 border-red-500 text-red-300 hover:bg-red-950"
                >
                  Go to Betting
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Subscription Plan */}
            <Card className={`w-full h-full ${subscriptionSelected ? 'border-2' : 'bg-gray-900 border-gray-800'}`}
              style={subscriptionSelected ? { backgroundColor: 'rgba(149, 222, 255, 0.1)', borderColor: '#95deff' } : {}}
            >
              <CardHeader className={subscriptionSelected ? '' : ''}
                style={subscriptionSelected ? { backgroundColor: 'rgba(149, 222, 255, 0.2)' } : {}}
              >
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
                    <CheckCircle className="h-5 w-5 mt-0.5" style={{ color: '#95deff' }} />
                    <span className="text-sm">Live betting on all matches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 mt-0.5" style={{ color: '#95deff' }} />
                    <span className="text-sm">Complete betting history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 mt-0.5" style={{ color: '#95deff' }} />
                    <span className="text-sm">Priority customer support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 mt-0.5" style={{ color: '#95deff' }} />
                    <span className="text-sm">Required to place bets</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSubscriptionSelect} 
                  variant="outline"
                  className="w-full"
                  style={subscriptionSelected ? { backgroundColor: '#95deff', color: '#052240', borderColor: '#95deff' } : { borderColor: 'rgba(149, 222, 255, 0.5)', color: '#95deff' }}
                >
                  {subscriptionSelected ? "Selected" : "Select"}
                </Button>
              </CardFooter>
            </Card>

            {/* Reload Coins */}
            <Card className={`w-full h-full ${paymentMode === 'reload' ? 'border-2' : 'bg-gray-900 border-gray-800'}`}
              style={paymentMode === 'reload' ? { backgroundColor: 'rgba(149, 222, 255, 0.1)', borderColor: '#95deff' } : {}}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Reload Coins</span>
                  <Coins className="h-5 w-5" style={{ color: '#95deff' }} />
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
                      className="border-gray-700"
                      style={reloadAmount === 10 && paymentMode === 'reload' ? { backgroundColor: '#95deff', color: '#052240', borderColor: '#95deff' } : {}}
                    >
                      $10
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleReloadAmountChange(20)}
                      className="border-gray-700"
                      style={reloadAmount === 20 && paymentMode === 'reload' ? { backgroundColor: '#95deff', color: '#052240', borderColor: '#95deff' } : {}}
                    >
                      $20
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleReloadAmountChange(50)}
                      className="border-gray-700"
                      style={reloadAmount === 50 && paymentMode === 'reload' ? { backgroundColor: '#95deff', color: '#052240', borderColor: '#95deff' } : {}}
                    >
                      $50
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleReloadAmountChange(100)}
                      className="border-gray-700"
                      style={reloadAmount === 100 && paymentMode === 'reload' ? { backgroundColor: '#95deff', color: '#052240', borderColor: '#95deff' } : {}}
                    >
                      $100
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleReloadAmountChange(200)}
                      className="border-gray-700"
                      style={reloadAmount === 200 && paymentMode === 'reload' ? { backgroundColor: '#95deff', color: '#052240', borderColor: '#95deff' } : {}}
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
                        <div className="flex justify-between mb-2" style={{ color: '#95deff' }}>
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
                  onClick={() => navigate("/betting-queue")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="min-w-[150px]"
                  style={{ backgroundColor: '#95deff', color: '#052240' }}
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
          
          {/* Venmo QR Code Section */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: '#95deff' }}>Alternative Payment Methods</h3>
            
            {/* Instructions */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8">
              <h4 className="text-lg font-semibold mb-3" style={{ color: '#95deff' }}>📝 Payment Instructions</h4>
              <p className="text-gray-300 mb-3">
                When paying via QR code, please include a note with your payment specifying:
              </p>
              <div className="bg-black/50 p-4 rounded-lg mb-3">
                <p className="text-sm font-mono" style={{ color: '#95deff' }}>
                  <strong>Format:</strong> username-amount
                </p>
                <p className="text-sm font-mono mt-2" style={{ color: '#95deff' }}>
                  <strong>Example:</strong> john_doe-1000
                </p>
              </div>
              <p className="text-sm text-gray-400">
                This helps us verify your payment and instantly credit your Sweep Coins!
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Venmo Card */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
                <h4 className="text-xl font-bold mb-4 text-center" style={{ color: '#95deff' }}>Venmo</h4>
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <img 
                      src="/venmo.png" 
                      alt="Venmo QR Code"
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-400 text-center">@gamebird2025</p>
                </div>
              </div>

              {/* Zelle Card */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
                <h4 className="text-xl font-bold mb-4 text-center" style={{ color: '#95deff' }}>Zelle</h4>
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <img 
                      src="/zelle.png" 
                      alt="Zelle QR Code"
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-400 text-center">Zelle Tag: gamebird</p>
                  <p className="text-sm text-gray-400 text-center">Email: gamebird2025@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;
