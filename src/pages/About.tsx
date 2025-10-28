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
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage: 'url(/111.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        position: 'relative'
      }}
    >
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(5, 34, 64, 0.5)', zIndex: 1 }}></div>
      {/* Header */}
      <div className="border-b py-4 relative z-10" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="rounded-lg p-2" style={{ backgroundColor: '#95deff' }}>
              <Trophy className="h-6 w-6" style={{ color: '#052240' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#fa1593' }}>About Our Platform</h1>
          </div>
          <Link to="/">
            <Button variant="ghost" className="hover:bg-transparent" style={{ color: '#fa1593' }}>
              <Home className="h-4 w-4 mr-2" style={{ color: '#fa1593' }} />
              Home
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            The Future of
            <span style={{ color: '#fa1593' }}> Pool Betting</span>
          </h1>
          <p className="text-xl text-white max-w-3xl mx-auto mb-8" style={{ color: '#95deff' }}>
            Experience the most advanced, secure, and user-friendly pool betting platform. 
            Bet on matches in person or from anywhere, with guaranteed payouts and real-time updates.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="outline" className="px-4 py-2" style={{ borderColor: '#fa1593', color: '#fa1593' }}>
              <Shield className="h-4 w-4 mr-2" style={{ color: '#fa1593' }} />
              Secure & Trusted
            </Badge>
            <Badge variant="outline" className="px-4 py-2" style={{ borderColor: '#95deff', color: '#95deff' }}>
              <Clock className="h-4 w-4 mr-2" style={{ color: '#95deff' }} />
              Real-Time Updates
            </Badge>
            <Badge variant="outline" className="px-4 py-2" style={{ borderColor: '#fa1593', color: '#fa1593' }}>
              <DollarSign className="h-4 w-4 mr-2" style={{ color: '#fa1593' }} />
              Guaranteed Payouts
            </Badge>
          </div>
        </div>

        {/* What We Offer */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">What We Offer</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 transition-all duration-300" style={{ backgroundColor: '#004b6b', borderColor: '#fa1593' }}>
              <CardHeader className="text-center">
                <div className="rounded-full p-3 w-fit mx-auto mb-4" style={{ backgroundColor: '#fa1593' }}>
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Flexible Betting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white text-center" style={{ color: '#95deff' }}>
                  Bet on pool matches either in person at the venue or from the convenience of your computer. 
                  No more worrying about getting paid on your bets - we guarantee all payouts.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 transition-all duration-300" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader className="text-center">
                <div className="rounded-full p-3 w-fit mx-auto mb-4" style={{ backgroundColor: '#95deff' }}>
                  <Target className="h-6 w-6" style={{ color: '#052240' }} />
                </div>
                <CardTitle className="text-white">In-Game Betting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white text-center" style={{ color: '#95deff' }}>
                  Place bets in the middle of games! Our real-time system allows you to bet on live matches 
                  as they unfold, adding excitement to every shot.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 transition-all duration-300" style={{ backgroundColor: '#004b6b', borderColor: '#fa1593' }}>
              <CardHeader className="text-center">
                <div className="rounded-full p-3 w-fit mx-auto mb-4" style={{ backgroundColor: '#fa1593' }}>
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Instant Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white text-center" style={{ color: '#95deff' }}>
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
                <div className="rounded-full p-2 flex-shrink-0" style={{ backgroundColor: '#fa1593' }}>
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Guaranteed Payouts</h3>
                  <p className="text-white" style={{ color: '#95deff' }}>
                    Never worry about getting paid on your winning bets. Our platform ensures all payouts are processed 
                    automatically and securely.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="rounded-full p-2 flex-shrink-0" style={{ backgroundColor: '#95deff' }}>
                  <Clock className="h-5 w-5" style={{ color: '#052240' }} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Real-Time Updates</h3>
                  <p className="text-white" style={{ color: '#95deff' }}>
                    Get instant updates on match progress, scores, and betting queues. 
                    Stay connected to the action with live synchronization across all devices.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="rounded-full p-2 flex-shrink-0" style={{ backgroundColor: '#fa1593' }}>
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Mobile & Desktop Access</h3>
                  <p className="text-white" style={{ color: '#95deff' }}>
                    Access the platform from any device - your phone, tablet, or computer. 
                    Responsive design ensures optimal experience everywhere.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="rounded-full p-2 flex-shrink-0" style={{ backgroundColor: '#95deff' }}>
                  <Coins className="h-5 w-5" style={{ color: '#052240' }} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Digital Currency System</h3>
                  <p className="text-white" style={{ color: '#95deff' }}>
                    Use our secure digital Sweep Coins system for all transactions. 
                    Easy to manage, track, and transfer between users.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="rounded-full p-2 flex-shrink-0" style={{ backgroundColor: '#fa1593' }}>
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">User-Friendly Interface</h3>
                  <p className="text-white" style={{ color: '#95deff' }}>
                    Intuitive design makes betting simple and enjoyable. 
                    Clear visual indicators, easy navigation, and helpful tooltips guide you through every step.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="rounded-full p-2 flex-shrink-0" style={{ backgroundColor: '#95deff' }}>
                  <TrendingUp className="h-5 w-5" style={{ color: '#052240' }} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Live Betting Opportunities</h3>
                  <p className="text-white" style={{ color: '#95deff' }}>
                    Bet on matches as they happen! Our in-game betting feature allows you to place wagers 
                    during live matches, maximizing your opportunities.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="rounded-full p-2 flex-shrink-0" style={{ backgroundColor: '#fa1593' }}>
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
                  <p className="text-white" style={{ color: '#95deff' }}>
                    Your data and transactions are protected with enterprise-grade security. 
                    Private betting history and secure account management.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="rounded-full p-2 flex-shrink-0" style={{ backgroundColor: '#95deff' }}>
                  <Award className="h-5 w-5" style={{ color: '#052240' }} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Fair Play Guaranteed</h3>
                  <p className="text-white" style={{ color: '#95deff' }}>
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
            <Card className="border-2 text-center" style={{ backgroundColor: '#004b6b', borderColor: '#fa1593' }}>
              <CardHeader>
                <div className="rounded-full p-3 w-fit mx-auto mb-4" style={{ backgroundColor: '#fa1593' }}>
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <CardTitle className="text-white">Sign Up</CardTitle>
              </CardHeader>
              <CardContent>
                <p style={{ color: '#95deff' }}>
                  Create your account in seconds. Choose between free access or premium membership.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 text-center" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader>
                <div className="rounded-full p-3 w-fit mx-auto mb-4" style={{ backgroundColor: '#95deff' }}>
                  <span style={{ color: '#052240' }} className="font-bold text-xl">2</span>
                </div>
                <CardTitle className="text-white">Get Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <p style={{ color: '#95deff' }}>
                  Load your account with Sweep Coins. Admin can reload credits for any user.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 text-center" style={{ backgroundColor: '#004b6b', borderColor: '#fa1593' }}>
              <CardHeader>
                <div className="rounded-full p-3 w-fit mx-auto mb-4" style={{ backgroundColor: '#fa1593' }}>
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <CardTitle className="text-white">Place Bets</CardTitle>
              </CardHeader>
              <CardContent>
                <p style={{ color: '#95deff' }}>
                  Bet on current or next games. Watch your bets get matched in real-time.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 text-center" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardHeader>
                <div className="rounded-full p-3 w-fit mx-auto mb-4" style={{ backgroundColor: '#95deff' }}>
                  <span style={{ color: '#052240' }} className="font-bold text-xl">4</span>
                </div>
                <CardTitle className="text-white">Win & Collect</CardTitle>
              </CardHeader>
              <CardContent>
                <p style={{ color: '#95deff' }}>
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
            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Gamepad2 className="h-6 w-6" style={{ color: '#fa1593' }} />
                  <h3 className="text-lg font-semibold text-white">Live Scoreboard</h3>
                </div>
                <p className="text-sm" style={{ color: '#95deff' }}>
                  Real-time score tracking with game timer and match statistics.
                </p>
              </CardContent>
            </Card>

            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="h-6 w-6" style={{ color: '#95deff' }} />
                  <h3 className="text-lg font-semibold text-white">User Management</h3>
                </div>
                <p className="text-sm" style={{ color: '#95deff' }}>
                  Easy user creation, switching, and account management.
                </p>
              </CardContent>
            </Card>

            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CreditCard className="h-6 w-6" style={{ color: '#fa1593' }} />
                  <h3 className="text-lg font-semibold text-white">Transaction History</h3>
                </div>
                <p className="text-sm" style={{ color: '#95deff' }}>
                  Complete record of all bets, wins, and credit transactions.
                </p>
              </CardContent>
            </Card>

            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Globe className="h-6 w-6" style={{ color: '#95deff' }} />
                  <h3 className="text-lg font-semibold text-white">Multi-Device Sync</h3>
                </div>
                <p className="text-sm" style={{ color: '#95deff' }}>
                  Synchronized experience across all devices and browsers.
                </p>
              </CardContent>
            </Card>

            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Star className="h-6 w-6" style={{ color: '#fa1593' }} />
                  <h3 className="text-lg font-semibold text-white">Admin Controls</h3>
                </div>
                <p className="text-sm" style={{ color: '#95deff' }}>
                  Comprehensive admin tools for managing games and users.
                </p>
              </CardContent>
            </Card>

            <Card className="border" style={{ backgroundColor: '#004b6b', borderColor: '#95deff' }}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="h-6 w-6" style={{ color: '#95deff' }} />
                  <h3 className="text-lg font-semibold text-white">Bet Matching</h3>
                </div>
                <p className="text-sm" style={{ color: '#95deff' }}>
                  Automatic bet matching system with real-time updates.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="border-2 max-w-2xl mx-auto" style={{ backgroundColor: '#004b6b', borderColor: '#fa1593' }}>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Betting?</h2>
              <p className="mb-6" style={{ color: '#95deff' }}>
                Join the most advanced pool betting platform and experience the future of sports betting.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/member-signup">
                  <Button style={{ backgroundColor: '#fa1593', color: 'white' }} className="hover:opacity-90">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Sign Up Now
                  </Button>
                </Link>
                <Link to="/features">
                  <Button variant="outline" style={{ borderColor: '#95deff', color: '#95deff' }} className="hover:bg-[#95deff] hover:text-[#052240]">
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
