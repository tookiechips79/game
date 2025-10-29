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
      {/* Sticky Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b" style={{ backgroundColor: '#004b6b', borderColor: '#95deff', backdropFilter: 'blur(10px)' }}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/4dfcf9c9-cbb9-4a75-94ab-bcdb38a8091e.png" 
              alt="Game Bird Logo" 
              className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(149,222,255,0.3)]"
            />
            <span className="text-xl font-bold" style={{ color: '#95deff', textShadow: '0 0 10px rgba(149, 222, 255, 0.5)' }}>Game Bird</span>
          </div>
          <div className="flex gap-4 items-center">
            <Link to="/">
              <Button variant="ghost" style={{ color: '#95deff' }} className="hover:bg-[#004b6b]/70">
                Home
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost" style={{ color: '#95deff' }} className="hover:bg-[#004b6b]/70">
                About
              </Button>
            </Link>
            <Link to="/faq">
              <Button variant="ghost" style={{ color: '#95deff' }} className="hover:bg-[#004b6b]/70">
                FAQ
              </Button>
            </Link>
            <Link to="/betting-queue">
              <Button className="font-bold flex items-center gap-2" style={{ backgroundColor: '#fa1593', color: 'white' }}>
                Betting
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#fa1593' }}>
            How Game Bird Platform Works
          </h2>
          <p className="text-xl max-w-3xl mx-auto" style={{ color: '#95deff' }}>
            A comprehensive guide to understanding our betting platform, from account creation to winning sweep coins
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
                Game Bird is a real-time betting platform where users can place bets on live games and win sweep coins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }}>
                    <BarChart3 className="h-8 w-8" style={{ color: '#fa1593' }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">Real-time Scoreboard</h3>
                  <p style={{ color: '#95deff' }}>Live game scores, team statistics, and game status updates in real-time</p>
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
                <CardTitle className="text-lg text-white">1. Access the Betting Queue </CardTitle>
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
                  Place bets on current and next games. Win sweep coins and cash out your winnings.
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
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">Live game scores and statistics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">Current and next game information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">Team names and game status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
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
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">Multiple bet denominations (10, 50, 100 Sweep Coins)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">Current game and next game betting queues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">Automatic bet matching and booking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
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
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">Complete bet receipts for every transaction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">Immutable bet ledger ensuring full transparency</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
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
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">Credit-based betting system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">Real Sweep Coins winnings and cashouts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">Transaction history tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
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
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">View real-time scoreboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">Browse betting queues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">View game information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lock className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#fa1593' }} />
                    <span style={{ color: '#95deff' }}>Cannot place bets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lock className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#fa1593' }} />
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
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">Everything in Free Access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">Place unlimited bets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">Win real coins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                    <span className="text-white">Cash out winnings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
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
                    <h4 className="text-xl font-semibold mb-2" style={{ color: '#fa1593' }}>Choose Your Player</h4>
                    <p className="mb-3" style={{ color: '#95deff' }}>
                      Click on the betting button for either Player A or Player B. You can bet on the current game or the next upcoming game in the queue.
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
                    <h4 className="text-xl font-semibold mb-2" style={{ color: '#fa1593' }}>Priority-Based Automatic Matching</h4>
                    <p className="mb-3" style={{ color: '#95deff' }}>
                      Your bet enters a queue and is automatically matched using a fair, priority-based system that respects the order bets were placed. The system instantly matches your bet with the first available bet of the same amount on the opposing team.
                    </p>
                    <div className="space-y-2 mb-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(5, 34, 64, 0.5)' }}>
                      <p className="text-sm" style={{ color: '#95deff' }}>
                        <strong>How It Works:</strong>
                      </p>
                      <ul className="text-sm space-y-1" style={{ color: '#95deff' }}>
                        <li>✓ Bets are matched in FIRST-IN, FIRST-OUT (FIFO) order</li>
                        <li>✓ Your bet matches with the first open bet of the same amount on the opposing team</li>
                        <li>✓ If no matching bet exists, your bet waits in the queue</li>
                        <li>✓ Once matched, both bets are locked in and marked as "Booked"</li>
                        <li>✓ Matching respects both time priority AND bet amount for fairness</li>
                      </ul>
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
                      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'rgba(149, 222, 255, 0.1)', borderColor: '#95deff' }}>
                        <h5 className="font-semibold mb-1" style={{ color: '#95deff' }}>Win</h5>
                        <p className="text-sm text-white">Receive your bet amount + winnings</p>
                      </div>
                      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'rgba(250, 21, 147, 0.1)', borderColor: '#fa1593' }}>
                        <h5 className="font-semibold mb-1" style={{ color: '#fa1593' }}>Lose</h5>
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
