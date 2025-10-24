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
    <div className="min-h-screen" style={{ backgroundColor: '#052240' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#004b6b', borderBottom: '1px solid #95deff' }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ color: '#95deff' }}
                  className="hover:bg-[#004b6b]/70"
                >
                  <Home className="h-4 w-4 mr-2" />
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
                <Button style={{ backgroundColor: '#fa1593', color: 'white' }} className="hover:opacity-90">
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
            A comprehensive guide to understanding our betting platform, from account creation to winning real money
          </p>
        </div>

        {/* Platform Overview */}
        <div className="mb-16">
          <Card style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }} className="backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl style={{ color: '#fa1593' }} flex items-center gap-2">
                <Gamepad2 className="h-6 w-6" />
                Platform Overview
              </CardTitle>
              <CardDescription className="text-gray-300">
                Game Bird is a real-time betting platform where users can place bets on live games and win real money
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }} p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 style={{ color: '#fa1593' }}" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">User Management</h3>
                  <p className="text-gray-400">Create accounts, manage credits, and track betting history</p>
                </div>
                <div className="text-center">
                  <div className="style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }} p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Target className="h-8 w-8 style={{ color: '#fa1593' }}" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Live Betting</h3>
                  <p className="text-gray-400">Place bets on current and upcoming games in real-time</p>
                </div>
                <div className="text-center">
                  <div className="style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }} p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <DollarSign className="h-8 w-8 style={{ color: '#fa1593' }}" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Real Money</h3>
                  <p className="text-gray-400">Win actual money that can be cashed out to your wallet</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center style={{ color: '#fa1593' }}">Getting Started</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }} className="backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }} p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <User className="h-6 w-6 style={{ color: '#fa1593' }}" />
                </div>
                <CardTitle className="text-lg">1. Create Account</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">
                  Sign up with your details or use Google/Apple login. All new accounts start with 0 credits and inactive membership.
                </p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }} className="backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }} p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Eye className="h-6 w-6 style={{ color: '#fa1593' }}" />
                </div>
                <CardTitle className="text-lg">2. View Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">
                  Browse the scoreboard and betting queues. You can view all games and betting activity without membership.
                </p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }} className="backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }} p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 style={{ color: '#fa1593' }}" />
                </div>
                <CardTitle className="text-lg">3. Subscribe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">
                  Purchase a $20/month subscription to activate your membership and start placing bets.
                </p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }} className="backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="style={{ backgroundColor: 'rgba(250, 21, 147, 0.2)' }} p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Target className="h-6 w-6 style={{ color: '#fa1593' }}" />
                </div>
                <CardTitle className="text-lg">4. Start Betting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">
                  Place bets on current and next games. Win real money and cash out your winnings.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Core Features */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center style={{ color: '#fa1593' }}">Core Features</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Real-time Scoreboard */}
            <Card style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }} className="backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl style={{ color: '#fa1593' }} flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Real-time Scoreboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Live game scores and statistics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Current and next game information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Team names and game status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Accessible to all users (free and premium)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Betting System */}
            <Card style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }} className="backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl style={{ color: '#fa1593' }} flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Betting System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Multiple bet denominations (10, 20, 50, 100 coins)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Current game and next game betting queues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Automatic bet matching and booking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Real-time bet status updates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* User Management */}
            <Card style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }} className="backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl style={{ color: '#fa1593' }} flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Multiple user accounts support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Admin user with special privileges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Credit management and reloading</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Membership status tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Financial System */}
            <Card style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }} className="backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl style={{ color: '#fa1593' }} flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Financial System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Credit-based betting system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Real money winnings and cashouts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Transaction history tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Admin credit management tools</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Membership Tiers */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center style={{ color: '#fa1593' }}">Membership Tiers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Access */}
            <Card className="bg-[#0a192f]/70 border-[#1EAEDB]/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-[#1EAEDB] flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Free Access
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Basic platform access for viewing and learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">View real-time scoreboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Browse betting queues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">View game information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-red-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-400">Cannot place bets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-red-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-400">Cannot win money</span>
                  </li>
                </ul>
                <Badge variant="outline" className="border-[#1EAEDB] text-[#1EAEDB]">
                  $0/month
                </Badge>
              </CardContent>
            </Card>

            {/* Premium Access */}
            <Card className="style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }} backdrop-blur-sm relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="style={{ backgroundColor: '#fa1593', color: 'white' }} px-4 py-1">
                  Most Popular
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl style={{ color: '#fa1593' }} flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Premium Access
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Full betting experience with real money winnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Everything in Free Access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Place unlimited bets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Win real money</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Cash out winnings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">Full transaction history</span>
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
          <h3 className="text-3xl font-bold mb-8 text-center style={{ color: '#fa1593' }}">How Betting Works</h3>
          <div className="space-y-8">
            {/* Step 1 */}
            <Card style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }} className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="style={{ backgroundColor: '#fa1593', color: 'white' }} rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2" style={{ color: '#fa1593' }}>Select Your Bet Amount</h4>
                    <p className="text-gray-300 mb-3">
                      Choose from 10, 20, 50, or 100 coins. Each denomination has its own betting button with hover tooltips showing the exact amount.
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="outline" style={{ borderColor: '#fa1593', color: '#fa1593' }}>10 Coins</Badge>
                      <Badge variant="outline" style={{ borderColor: '#fa1593', color: '#fa1593' }}>20 Coins</Badge>
                      <Badge variant="outline" style={{ borderColor: '#fa1593', color: '#fa1593' }}>50 Coins</Badge>
                      <Badge variant="outline" style={{ borderColor: '#fa1593', color: '#fa1593' }}>100 Coins</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }} className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="style={{ backgroundColor: '#fa1593', color: 'white' }} rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2" style={{ color: '#fa1593' }}>Choose Your Team</h4>
                    <p className="text-gray-300 mb-3">
                      Click on the betting button for either Team A or Team B. You can bet on the current game or the next upcoming game.
                    </p>
                    <div className="bg-gray-800/50 p-3 rounded-lg">
                      <p className="text-sm text-gray-400">
                        <strong>Current Game:</strong> Live game in progress<br/>
                        <strong>Next Game:</strong> Upcoming game in the queue
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }} className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="style={{ backgroundColor: '#fa1593', color: 'white' }} rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2" style={{ color: '#fa1593' }}>Automatic Matching</h4>
                    <p className="text-gray-300 mb-3">
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
            <Card style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }} className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="style={{ backgroundColor: '#fa1593', color: 'white' }} rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2" style={{ color: '#fa1593' }}>Win or Lose</h4>
                    <p className="text-gray-300 mb-3">
                      When the game ends, winning bets automatically receive their winnings. Losing bets are deducted from your account.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/30">
                        <h5 className="font-semibold text-green-400 mb-1">Win</h5>
                        <p className="text-sm text-gray-300">Receive your bet amount + winnings</p>
                      </div>
                      <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/30">
                        <h5 className="font-semibold text-red-400 mb-1">Lose</h5>
                        <p className="text-sm text-gray-300">Bet amount deducted from account</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Admin Features */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center style={{ color: '#fa1593' }}">Admin Features</h3>
          <Card style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }} className="backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl style={{ color: '#fa1593' }} flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Administrative Tools
              </CardTitle>
              <CardDescription className="text-gray-300">
                Special features available to admin users for platform management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold style={{ color: '#fa1593' }} flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    User Management
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>• Create and manage user accounts</li>
                    <li>• View all user betting history</li>
                    <li>• Monitor user credit balances</li>
                    <li>• Reset user statistics</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold style={{ color: '#fa1593' }} flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Credit Management
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>• Reload credits for any user</li>
                    <li>• Deduct credits when needed</li>
                    <li>• View all credit transactions</li>
                    <li>• Monitor platform revenue</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold style={{ color: '#fa1593' }} flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Platform Control
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>• Start and stop games</li>
                    <li>• Reset betting queues</li>
                    <li>• View platform statistics</li>
                    <li>• Manage game settings</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card style={{ background: 'linear-gradient(to right, rgba(250, 21, 147, 0.2), rgba(149, 222, 255, 0.2))', borderColor: '#fa1593' }} className="backdrop-blur-sm">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#fa1593' }}>Ready to Start Betting?</h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Join thousands of users who are already winning real money on Game Bird. 
                Create your account today and start your betting journey!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/member-signup">
                  <Button className="style={{ backgroundColor: '#fa1593', color: 'white' }} className="hover:opacity-90" text-black font-bold px-8 py-3">
                    <User className="h-4 w-4 mr-2" />
                    Create Account
                  </Button>
                </Link>
                <Link to="/betting-queue">
                  <Button variant="outline" style={{ borderColor: '#fa1593', color: '#fa1593' }} className="hover:bg-[#fa1593]/20 px-8 py-3">
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
