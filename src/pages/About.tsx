import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Shield, 
  Clock, 
  Users, 
  DollarSign, 
  Smartphone, 
  Laptop, 
  Trophy, 
  Zap, 
  CheckCircle, 
  Star,
  Target,
  Gamepad2,
  CreditCard,
  Lock,
  Globe,
  TrendingUp,
  Award,
  Coins,
  UserCheck
} from "lucide-react";

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a192f] via-[#0f2a3d] to-[#143a4e] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a192f] to-[#1a2332] border-b border-[#F97316]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-[#1EAEDB] to-[#00FFFF] rounded-lg p-2">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">About Our Platform</h1>
            </div>
            <Link to="/">
              <Button variant="ghost" className="text-[#F97316] hover:text-[#FBBF24] hover:bg-[#F97316]/10">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            The Future of
            <span className="bg-gradient-to-r from-[#F97316] to-[#FBBF24] bg-clip-text text-transparent"> Pool Betting</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Experience the most advanced, secure, and user-friendly pool betting platform. 
            Bet on matches in person or from anywhere, with guaranteed payouts and real-time updates.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="outline" className="border-[#F97316] text-[#F97316] px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              Secure & Trusted
            </Badge>
            <Badge variant="outline" className="border-[#1EAEDB] text-[#1EAEDB] px-4 py-2">
              <Clock className="h-4 w-4 mr-2" />
              Real-Time Updates
            </Badge>
            <Badge variant="outline" className="border-[#a3e635] text-[#a3e635] px-4 py-2">
              <DollarSign className="h-4 w-4 mr-2" />
              Guaranteed Payouts
            </Badge>
          </div>
        </div>

        {/* What We Offer */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">What We Offer</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-card border-2 border-[#F97316] hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-all duration-300">
              <CardHeader className="text-center">
                <div className="bg-[#F97316] rounded-full p-3 w-fit mx-auto mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Flexible Betting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-center">
                  Bet on pool matches either in person at the venue or from the convenience of your computer. 
                  No more worrying about getting paid on your bets - we guarantee all payouts.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-2 border-[#1EAEDB] hover:shadow-[0_0_20px_rgba(30,174,219,0.5)] transition-all duration-300">
              <CardHeader className="text-center">
                <div className="bg-[#1EAEDB] rounded-full p-3 w-fit mx-auto mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">In-Game Betting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-center">
                  Place bets in the middle of games! Our real-time system allows you to bet on live matches 
                  as they unfold, adding excitement to every shot.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-2 border-[#a3e635] hover:shadow-[0_0_20px_rgba(163,230,53,0.5)] transition-all duration-300">
              <CardHeader className="text-center">
                <div className="bg-[#a3e635] rounded-full p-3 w-fit mx-auto mb-4">
                  <Zap className="h-6 w-6 text-black" />
                </div>
                <CardTitle className="text-white">Instant Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-center">
                  Anyone can bet on any side and can quit at any time. No long-term commitments, 
                  no complicated signup processes - just pure betting excitement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Key Benefits</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-[#F97316] rounded-full p-2 flex-shrink-0">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Guaranteed Payouts</h3>
                  <p className="text-gray-300">
                    Never worry about getting paid on your winning bets. Our platform ensures all payouts are processed 
                    automatically and securely.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-[#1EAEDB] rounded-full p-2 flex-shrink-0">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Real-Time Updates</h3>
                  <p className="text-gray-300">
                    Get instant updates on match progress, scores, and betting cues. 
                    Stay connected to the action with live synchronization across all devices.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-[#a3e635] rounded-full p-2 flex-shrink-0">
                  <Smartphone className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Mobile & Desktop Access</h3>
                  <p className="text-gray-300">
                    Access the platform from any device - your phone, tablet, or computer. 
                    Responsive design ensures optimal experience everywhere.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-[#FBBF24] rounded-full p-2 flex-shrink-0">
                  <Coins className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Digital Currency System</h3>
                  <p className="text-gray-300">
                    Use our secure digital coin system for all transactions. 
                    Easy to manage, track, and transfer between users.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-[#F97316] rounded-full p-2 flex-shrink-0">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">User-Friendly Interface</h3>
                  <p className="text-gray-300">
                    Intuitive design makes betting simple and enjoyable. 
                    Clear visual indicators, easy navigation, and helpful tooltips guide you through every step.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-[#1EAEDB] rounded-full p-2 flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Live Betting Opportunities</h3>
                  <p className="text-gray-300">
                    Bet on matches as they happen! Our in-game betting feature allows you to place wagers 
                    during live matches, maximizing your opportunities.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-[#a3e635] rounded-full p-2 flex-shrink-0">
                  <Lock className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
                  <p className="text-gray-300">
                    Your data and transactions are protected with enterprise-grade security. 
                    Private betting history and secure account management.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-[#FBBF24] rounded-full p-2 flex-shrink-0">
                  <Award className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Fair Play Guaranteed</h3>
                  <p className="text-gray-300">
                    Transparent betting system with clear rules and fair odds. 
                    No hidden fees, no manipulation - just honest, exciting betting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="glass-card border-2 border-[#F97316] text-center">
              <CardHeader>
                <div className="bg-[#F97316] rounded-full p-3 w-fit mx-auto mb-4">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <CardTitle className="text-white">Sign Up</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Create your account in seconds. Choose between free access or premium membership.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-2 border-[#1EAEDB] text-center">
              <CardHeader>
                <div className="bg-[#1EAEDB] rounded-full p-3 w-fit mx-auto mb-4">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <CardTitle className="text-white">Get Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Load your account with digital coins. Admin can reload credits for any user.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-2 border-[#a3e635] text-center">
              <CardHeader>
                <div className="bg-[#a3e635] rounded-full p-3 w-fit mx-auto mb-4">
                  <span className="text-black font-bold text-xl">3</span>
                </div>
                <CardTitle className="text-white">Place Bets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Bet on current or next games. Watch your bets get matched in real-time.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-2 border-[#FBBF24] text-center">
              <CardHeader>
                <div className="bg-[#FBBF24] rounded-full p-3 w-fit mx-auto mb-4">
                  <span className="text-black font-bold text-xl">4</span>
                </div>
                <CardTitle className="text-white">Win & Collect</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Automatic payouts for winning bets. Track your history and earnings.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Platform Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Platform Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-card border border-gray-600">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Gamepad2 className="h-6 w-6 text-[#F97316]" />
                  <h3 className="text-lg font-semibold text-white">Live Scoreboard</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  Real-time score tracking with game timer and match statistics.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border border-gray-600">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="h-6 w-6 text-[#1EAEDB]" />
                  <h3 className="text-lg font-semibold text-white">User Management</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  Easy user creation, switching, and account management.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border border-gray-600">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CreditCard className="h-6 w-6 text-[#a3e635]" />
                  <h3 className="text-lg font-semibold text-white">Transaction History</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  Complete record of all bets, wins, and credit transactions.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border border-gray-600">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Globe className="h-6 w-6 text-[#FBBF24]" />
                  <h3 className="text-lg font-semibold text-white">Multi-Device Sync</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  Synchronized experience across all devices and browsers.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border border-gray-600">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Star className="h-6 w-6 text-[#F97316]" />
                  <h3 className="text-lg font-semibold text-white">Admin Controls</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  Comprehensive admin tools for managing games and users.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border border-gray-600">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-[#1EAEDB]" />
                  <h3 className="text-lg font-semibold text-white">Bet Matching</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  Automatic bet matching system with real-time updates.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="glass-card border-2 border-[#F97316] max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Betting?</h2>
              <p className="text-gray-300 mb-6">
                Join the most advanced pool betting platform and experience the future of sports betting.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/member-signup">
                  <Button className="bg-gradient-to-r from-[#F97316] to-[#FBBF24] text-white hover:from-[#F97316]/90 hover:to-[#FBBF24]/90">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Sign Up Now
                  </Button>
                </Link>
                <Link to="/features">
                  <Button variant="outline" className="border-[#1EAEDB] text-[#1EAEDB] hover:bg-[#1EAEDB] hover:text-white">
                    <Star className="h-4 w-4 mr-2" />
                    View Features
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

export default AboutPage;
