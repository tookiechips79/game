import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Trophy, 
  Users, 
  CreditCard, 
  Shield, 
  Clock, 
  Target, 
  TrendingUp, 
  Eye, 
  CheckCircle, 
  Star,
  Zap,
  DollarSign,
  Gamepad2,
  BarChart3,
  Wallet,
  Lock,
  Unlock,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Settings,
  User,
  LogIn
} from "lucide-react";

const FeaturesPage = () => {
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#052240' }}>
      {/* Header */}
      <div className="border-b py-4" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ color: '#fa1593' }}
                  className="hover:bg-transparent"
                >
                  <Home className="h-4 w-4 mr-2" style={{ color: '#fa1593' }} />
                  Home
                </Button>
              </Link>
              <div className="h-6 w-px" style={{ backgroundColor: '#95deff' }} />
              <div className="flex items-center space-x-2">
                <Trophy className="h-6 w-6" style={{ color: '#fa1593' }} />
                <h1 className="text-2xl font-bold text-white">Platform Features</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link to="/member-signup">
                <Button style={{ backgroundColor: '#fa1593', color: 'white' }} className="font-bold hover:opacity-90">
                  <LogIn className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#fa1593' }}>
            How Game Bird Platform Works
          </h2>
          <p className="text-xl max-w-3xl mx-auto" style={{ color: '#95deff' }}>
            A comprehensive guide to understanding our betting platform, from account creation to winning real coins
          </p>
        </div>

        {/* Platform Overview */}
        <div className="mb-16">
          <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2" style={{ color: '#fa1593' }}>
                <Gamepad2 className="h-6 w-6" />
                Platform Overview
              </CardTitle>
              <CardDescription style={{ color: '#95deff' }}>
                Game Bird is a real-time betting platform where users can place bets on live games and win real coins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }}>
                    <Users className="h-8 w-8" style={{ color: '#fa1593' }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">User Management</h3>
                  <p style={{ color: '#95deff' }}>Create accounts, manage credits, and track betting history</p>
                </div>
                <div className="text-center">
                  <div className="p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }}>
                    <Target className="h-8 w-8" style={{ color: '#fa1593' }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Live Betting</h3>
                  <p style={{ color: '#95deff' }}>Place bets on current and upcoming games in real-time</p>
                </div>
                <div className="text-center">
                  <div className="p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }}>
                    <DollarSign className="h-8 w-8" style={{ color: '#fa1593' }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Real Coins</h3>
                  <p style={{ color: '#95deff' }}>Win actual coins that can be cashed out to your wallet</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center" style={{ color: '#fa1593' }}>Getting Started</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader className="text-center">
                <div className="p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }}>
                  <User className="h-6 w-6" style={{ color: '#fa1593' }} />
                </div>
                <CardTitle className="text-lg text-white">1. Create Account</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm" style={{ color: '#95deff' }}>
                  Sign up with your details or use Google/Apple login. All new accounts start with 0 credits and inactive membership.
                </p>
              </CardContent>
            </Card>

            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader className="text-center">
                <div className="p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }}>
                  <Eye className="h-6 w-6" style={{ color: '#fa1593' }} />
                </div>
                <CardTitle className="text-lg text-white">2. View Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm" style={{ color: '#95deff' }}>
                  Browse the scoreboard and betting queues. You can view all games and betting activity without membership.
                </p>
              </CardContent>
            </Card>

            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader className="text-center">
                <div className="p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }}>
                  <CreditCard className="h-6 w-6" style={{ color: '#fa1593' }} />
                </div>
                <CardTitle className="text-lg text-white">3. Subscribe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm" style={{ color: '#95deff' }}>
                  Purchase a $20/month subscription to activate your membership and start placing bets.
                </p>
              </CardContent>
            </Card>

            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader className="text-center">
                <div className="p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }}>
                  <Target className="h-6 w-6" style={{ color: '#fa1593' }} />
                </div>
                <CardTitle className="text-lg text-white">4. Start Betting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm" style={{ color: '#95deff' }}>
                  Place bets on current and next games. Win real coins and cash out your winnings.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Core Features */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center" style={{ color: '#fa1593' }}>Core Features</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Real-time Scoreboard */}
            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2" style={{ color: '#fa1593' }}>
                  <BarChart3 className="h-5 w-5" />
                  Real-time Scoreboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Live game scores and statistics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Current and next game information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Team names and game status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Accessible to all users (free and premium)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Betting System */}
            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2" style={{ color: '#fa1593' }}>
                  <Target className="h-5 w-5" />
                  Betting System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Multiple bet denominations (10, 50, 100 Sweep Coins)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Current game and next game betting queues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Automatic bet matching and booking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Real-time bet status updates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* User Management */}
            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2" style={{ color: '#fa1593' }}>
                  <Users className="h-5 w-5" />
                  Bet Tracking & Transparency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Complete bet receipts for every transaction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Immutable bet ledger ensuring full transparency</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Complete game/transaction history for record keeping</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Financial System */}
            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2" style={{ color: '#fa1593' }}>
                  <Wallet className="h-5 w-5" />
                  Financial System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Credit-based betting system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Real Sweep Coins winnings and cashouts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Transaction history tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Secure payment processing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Membership Tiers */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center" style={{ color: '#fa1593' }}>Membership Tiers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Access */}
            <Card className="border relative" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2" style={{ color: '#95deff' }}>
                  <Eye className="h-5 w-5" />
                  Free Access
                </CardTitle>
                <CardDescription style={{ color: '#95deff' }}>
                  Basic platform access for viewing and learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">View real-time scoreboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Browse betting queues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">View game information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-red-400 mt-1 flex-shrink-0" />
                    <span style={{ color: '#95deff' }}>Cannot place bets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-red-400 mt-1 flex-shrink-0" />
                    <span style={{ color: '#95deff' }}>Cannot win coins</span>
                  </li>
                </ul>
                <Badge variant="outline" style={{ borderColor: '#95deff', color: '#95deff' }}>
                  $0/month
                </Badge>
              </CardContent>
            </Card>

            {/* Premium Access */}
            <Card className="border relative" style={{ backgroundColor: '#004b6b', borderColor: '#fa1593' }}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge style={{ backgroundColor: '#fa1593', color: 'white' }} className="px-4 py-1">
                  Most Popular
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2" style={{ color: '#fa1593' }}>
                  <Trophy className="h-5 w-5" />
                  Premium Access
                </CardTitle>
                <CardDescription style={{ color: '#95deff' }}>
                  Full betting experience with real coins winnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Everything in Free Access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Place unlimited bets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Win real coins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Cash out winnings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-white">Full transaction history</span>
                  </li>
                </ul>
                <Badge variant="outline" style={{ borderColor: '#fa1593', color: '#fa1593' }}>
                  $20/month
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How Betting Works */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center" style={{ color: '#fa1593' }}>How Betting Works</h3>
          <div className="space-y-8">
            {/* Step 1 */}
            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0" style={{ backgroundColor: '#fa1593', color: 'white' }}>
                    1
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2" style={{ color: '#fa1593' }}>Select Your Bet Amount</h4>
                    <p className="mb-3" style={{ color: '#95deff' }}>
                      Choose from 10, 50, or 100 Sweep Coins. Each denomination has its own betting button with hover tooltips showing the exact amount.
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="outline" style={{ borderColor: '#fa1593', color: '#fa1593' }}>10 Sweep Coins</Badge>
                      <Badge variant="outline" style={{ borderColor: '#fa1593', color: '#fa1593' }}>50 Sweep Coins</Badge>
                      <Badge variant="outline" style={{ borderColor: '#fa1593', color: '#fa1593' }}>100 Sweep Coins</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0" style={{ backgroundColor: '#fa1593', color: 'white' }}>
                    2
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2" style={{ color: '#fa1593' }}>Choose Your Team</h4>
                    <p className="mb-3" style={{ color: '#95deff' }}>
                      Click on the betting button for either Team A or Team B. You can bet on the current game or the next upcoming game.
                    </p>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(5, 34, 64, 0.5)' }}>
                      <p className="text-sm" style={{ color: '#95deff' }}>
                        <strong>Current Game:</strong> Live game in progress<br/>
                        <strong>Next Game:</strong> Upcoming game in the queue
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0" style={{ backgroundColor: '#fa1593', color: 'white' }}>
                    3
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2" style={{ color: '#fa1593' }}>Automatic Matching</h4>
                    <p className="mb-3" style={{ color: '#95deff' }}>
                      Your bet is automatically matched with other users' bets on the opposing team. The system ensures fair matching and real-time updates.
                    </p>
                    <div className="flex gap-2">
                      <Badge className="bg-green-500/20 text-green-400">Matched</Badge>
                      <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>
                      <Badge className="bg-blue-500/20 text-blue-400">Booked</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0" style={{ backgroundColor: '#fa1593', color: 'white' }}>
                    4
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2" style={{ color: '#fa1593' }}>Win or Lose</h4>
                    <p className="mb-3" style={{ color: '#95deff' }}>
                      When the game ends, winning bets automatically receive their winnings. Losing bets are deducted from your account.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/30">
                        <h5 className="font-semibold text-green-400 mb-1">Win</h5>
                        <p className="text-sm text-white">Receive your bet amount + winnings</p>
                      </div>
                      <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/30">
                        <h5 className="font-semibold text-red-400 mb-1">Lose</h5>
                        <p className="text-sm text-white">Bet amount deducted from account</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="border" style={{ backgroundColor: 'rgba(250, 21, 147, 0.1)', borderColor: '#fa1593' }}>
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#fa1593' }}>Ready to Start Betting?</h3>
              <p className="mb-6 max-w-2xl mx-auto" style={{ color: '#95deff' }}>
                Join thousands of users who are already winning real coins on Game Bird. 
                Create your account today and start your betting journey!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/member-signup">
                  <Button style={{ backgroundColor: '#fa1593', color: 'white' }} className="font-bold px-8 py-3 hover:opacity-90">
                    <User className="h-4 w-4 mr-2" />
                    Create Account
                  </Button>
                </Link>
                <Link to="/betting-queue">
                  <Button variant="outline" style={{ borderColor: '#95deff', color: '#95deff' }} className="px-8 py-3 hover:bg-[#95deff] hover:text-[#052240]">
                    <Eye className="h-4 w-4 mr-2" />
                    View Platform
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
