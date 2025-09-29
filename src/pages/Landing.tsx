import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, DollarSign, Users, BadgeCheck, Ticket, LogIn, LogOut, User, Eye, Trophy, CheckCircle, X } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import AuthModal from "@/components/AuthModal";

const Landing = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [defaultAuthTab, setDefaultAuthTab] = useState<"login" | "register">("login");
  const { currentUser, setCurrentUser } = useUser();
  const navigate = useNavigate();

  const openLoginModal = () => {
    setDefaultAuthTab("login");
    setAuthModalOpen(true);
  };


  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a192f] via-[#0f2a3d] to-[#143a4e]">
      {/* Hero Section */}
      <div className="container mx-auto pt-8 pb-12 px-4">
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/4dfcf9c9-cbb9-4a75-94ab-bcdb38a8091e.png" 
              alt="Game Bird Logo" 
              className="w-16 h-16 object-contain drop-shadow-[0_0_10px_rgba(0,255,150,0.3)]"
            />
            <span className="text-2xl font-bold text-[#1EAEDB] drop-shadow-[0_0_10px_rgba(30,174,219,0.3)]">Game Bird</span>
          </div>
          <div className="flex gap-4 items-center">
            <Link to="/about">
              <Button variant="ghost" className="text-[#1EAEDB] hover:text-[#33C3F0] hover:bg-[#143a4e]/70">
                About
              </Button>
            </Link>
            <Link to="/features">
              <Button variant="ghost" className="text-[#1EAEDB] hover:text-[#33C3F0] hover:bg-[#143a4e]/70">
                Features
              </Button>
            </Link>
            
            {currentUser ? (
              <>
                <div className="hidden md:flex items-center bg-[#143a4e]/70 rounded-full pl-3 pr-1 py-1 mr-2">
                  <span className="text-[#F97316] mr-2">{currentUser.name}</span>
                  <div className="bg-[#F97316] text-black rounded-full h-7 w-7 flex items-center justify-center">
                    <User size={16} />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="border-red-400 text-red-300 hover:bg-red-900/50 hover:text-red-200"
                  onClick={handleLogout}
                >
                  <LogOut size={18} className="mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="border-[#F97316] text-[#F97316] hover:bg-[#F97316]/20" onClick={openLoginModal}>
                  <LogIn size={18} className="mr-2" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
              </>
            )}
            
            <Link to="/betting-queue">
              <Button className="bg-[#F97316] hover:bg-[#F97316]/80 text-black font-bold flex items-center gap-2">
                <Ticket size={18} />
                <span className="hidden sm:inline">Betting</span>
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="flex flex-col md:flex-row items-center gap-12 mb-20">
          <div className="flex-1">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              The Ultimate <span className="text-[#33C3F0]">Betting</span> Experience
            </h1>
            <p className="text-xl text-[#a3e635] mb-8">
              Join Game Bird for the most exciting peer-to-peer betting platform. 
              Create a free account to view live scoreboards and betting cues. 
              Subscribe to place bets and win real money!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {currentUser ? (
                <Button 
                  className="bg-gradient-to-r from-[#F97316] to-[#FBBF24] hover:from-[#F97316]/90 hover:to-[#FBBF24]/90 text-black font-bold px-6 py-6 text-lg w-full sm:w-auto"
                  onClick={() => navigate('/betting-queue')}
                >
                  Start Betting Now <Ticket className="ml-2" />
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Link to="/member-signup">
                    <Button 
                      className="bg-gradient-to-r from-[#F97316] to-[#FBBF24] hover:from-[#F97316]/90 hover:to-[#FBBF24]/90 text-black font-bold px-6 py-6 text-lg w-full sm:w-auto"
                    >
                      Sign Up & Start Betting <LogIn className="ml-2" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline"
                    className="border-[#1EAEDB] text-[#1EAEDB] hover:bg-[#1EAEDB]/20 px-6 py-6 text-lg w-full sm:w-auto"
                    onClick={openLoginModal}
                  >
                    Log In <LogIn className="ml-2" />
                  </Button>
                </div>
              )}
              <Button variant="outline" className="border-[#1EAEDB] text-[#1EAEDB] hover:bg-[#1EAEDB]/20 px-6 py-6 text-lg w-full sm:w-auto">
                Learn More
              </Button>
            </div>
            
            {!currentUser && (
              <div className="mt-6 flex items-center">
                <span className="text-[#a3e635] mr-3">Or sign up with:</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-full border-[#1EAEDB] text-[#1EAEDB] h-8 w-8 p-0 mr-2"
                  onClick={() => {
                    setDefaultAuthTab("register");
                    setAuthModalOpen(true);
                    setTimeout(() => {
                      const googleBtn = document.querySelector('[data-provider="google"]') as HTMLButtonElement;
                      if (googleBtn) googleBtn.click();
                    }, 500);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
                  </svg>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-full border-[#1EAEDB] text-[#1EAEDB] h-8 w-8 p-0"
                  onClick={() => {
                    setDefaultAuthTab("register");
                    setAuthModalOpen(true);
                    setTimeout(() => {
                      const appleBtn = document.querySelector('[data-provider="apple"]') as HTMLButtonElement;
                      if (appleBtn) appleBtn.click();
                    }, 500);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 384 512">
                    <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 flex justify-center">
            <img 
              src="/lovable-uploads/4dfcf9c9-cbb9-4a75-94ab-bcdb38a8091e.png" 
              alt="Game Bird Logo" 
              className="w-full max-w-md drop-shadow-[0_0_20px_rgba(163,230,53,0.4)]"
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-black/30 backdrop-blur-sm py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center text-white mb-12">
              Why Choose <span className="text-[#33C3F0]">Game Bird</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-[#0a192f]/70 border-[#33C3F0]/30 backdrop-blur-sm text-white shadow-xl hover:shadow-[0_0_15px_rgba(30,174,219,0.3)] transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-[#F97316] p-3 mb-4">
                      <DollarSign size={32} className="text-[#0a192f]" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Instant Matching</h3>
                    <p className="text-[#a3e635]">
                      Our smart algorithm instantly matches your bets with other players for quick, seamless transactions.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-[#0a192f]/70 border-[#33C3F0]/30 backdrop-blur-sm text-white shadow-xl hover:shadow-[0_0_15px_rgba(30,174,219,0.3)] transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-[#F97316] p-3 mb-4">
                      <Users size={32} className="text-[#0a192f]" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Peer-to-Peer</h3>
                    <p className="text-[#a3e635]">
                      Bet directly against other players, not the house. Create and join betting pools with friends.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-[#0a192f]/70 border-[#33C3F0]/30 backdrop-blur-sm text-white shadow-xl hover:shadow-[0_0_15px_rgba(30,174,219,0.3)] transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-[#F97316] p-3 mb-4">
                      <BadgeCheck size={32} className="text-[#0a192f]" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Secure Platform</h3>
                    <p className="text-[#a3e635]">
                      Your transactions and data are protected with state-of-the-art security measures.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Access Levels Section */}
        <div className="container mx-auto py-20 px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Choose Your Access Level</h2>
            <p className="text-xl text-[#a3e635] max-w-3xl mx-auto">
              Start with a free account to explore, then upgrade to place bets and win real money
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Access */}
            <Card className="bg-[#0a192f]/70 border-[#1EAEDB]/30 backdrop-blur-sm text-white shadow-xl hover:shadow-[0_0_15px_rgba(30,174,219,0.3)] transition-all duration-300">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="rounded-full bg-[#1EAEDB] p-4 mb-4 mx-auto w-16 h-16 flex items-center justify-center">
                    <Eye size={32} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Free Access</h3>
                  <p className="text-3xl font-bold text-[#1EAEDB] mb-2">$0</p>
                  <p className="text-gray-300">Perfect for getting started</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-[#a3e635]">
                    <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                    View live scoreboard
                  </li>
                  <li className="flex items-center text-[#a3e635]">
                    <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                    Watch betting cues
                  </li>
                  <li className="flex items-center text-[#a3e635]">
                    <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                    Track game progress
                  </li>
                  <li className="flex items-center text-gray-400">
                    <X size={20} className="mr-3 flex-shrink-0" />
                    Place bets (requires subscription)
                  </li>
                </ul>
                
                {!currentUser && (
                  <Link to="/member-signup" className="block">
                    <Button className="w-full bg-[#1EAEDB] hover:bg-[#33C3F0] text-white font-bold">
                      Get Free Access
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Premium Access */}
            <Card className="bg-[#0a192f]/70 border-[#F97316]/30 backdrop-blur-sm text-white shadow-xl hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all duration-300 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#F97316] text-black px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </span>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="rounded-full bg-[#F97316] p-4 mb-4 mx-auto w-16 h-16 flex items-center justify-center">
                    <Trophy size={32} className="text-black" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Premium Access</h3>
                  <p className="text-3xl font-bold text-[#F97316] mb-2">$20/month</p>
                  <p className="text-gray-300">Full betting experience</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-[#a3e635]">
                    <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                    Everything in Free Access
                  </li>
                  <li className="flex items-center text-[#a3e635]">
                    <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                    Place unlimited bets
                  </li>
                  <li className="flex items-center text-[#a3e635]">
                    <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                    Win real money
                  </li>
                  <li className="flex items-center text-[#a3e635]">
                    <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                    Cash out winnings
                  </li>
                </ul>
                
                {!currentUser ? (
                  <Link to="/member-signup" className="block">
                    <Button className="w-full bg-[#F97316] hover:bg-[#FBBF24] text-black font-bold">
                      Sign Up & Subscribe
                    </Button>
                  </Link>
                ) : (
                  <Link to="/subscription" className="block">
                    <Button className="w-full bg-[#F97316] hover:bg-[#FBBF24] text-black font-bold">
                      Subscribe Now
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto py-20 px-4">
          <div className="bg-[#0a192f]/70 border border-[#33C3F0]/30 backdrop-blur-sm rounded-xl p-8 flex flex-col md:flex-row items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
              <p className="text-[#a3e635] max-w-xl">
                Join thousands of players already using Game Bird. Create your free account today!
              </p>
            </div>
            {currentUser ? (
              <Link to="/betting-queue" className="mt-6 md:mt-0">
                <Button className="bg-gradient-to-r from-[#F97316] to-[#FBBF24] hover:from-[#F97316]/90 hover:to-[#FBBF24]/90 text-black font-bold px-8 py-6 text-lg flex items-center gap-2">
                  <Ticket size={20} />
                  Open Betting
                </Button>
              </Link>
            ) : (
              <Link to="/member-signup" className="mt-6 md:mt-0">
                <Button className="bg-gradient-to-r from-[#F97316] to-[#FBBF24] hover:from-[#F97316]/90 hover:to-[#FBBF24]/90 text-black font-bold px-8 py-6 text-lg flex items-center gap-2">
                  <LogIn size={20} />
                  Get Started Free
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-black/50 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-2 mb-6 md:mb-0">
                <img 
                  src="/lovable-uploads/4dfcf9c9-cbb9-4a75-94ab-bcdb38a8091e.png" 
                  alt="Game Bird Logo" 
                  className="w-10 h-10 object-contain"
                />
                <span className="text-xl font-bold text-[#1EAEDB]">Game Bird</span>
              </div>
              <div className="flex gap-8">
                <div>
                  <h3 className="font-bold mb-2 text-[#F97316]">Platform</h3>
                  <ul className="space-y-1">
                    <li><a href="#" className="hover:text-[#33C3F0]">How it works</a></li>
                    <li><a href="#" className="hover:text-[#33C3F0]">Features</a></li>
                    <li><a href="#" className="hover:text-[#33C3F0]">Security</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-2 text-[#F97316]">Company</h3>
                  <ul className="space-y-1">
                    <li><a href="#" className="hover:text-[#33C3F0]">About us</a></li>
                    <li><a href="#" className="hover:text-[#33C3F0]">Contact</a></li>
                    <li><a href="#" className="hover:text-[#33C3F0]">Careers</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-2 text-[#F97316]">Legal</h3>
                  <ul className="space-y-1">
                    <li><a href="#" className="hover:text-[#33C3F0]">Terms</a></li>
                    <li><a href="#" className="hover:text-[#33C3F0]">Privacy</a></li>
                    <li><a href="#" className="hover:text-[#33C3F0]">Cookies</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-[#143a4e] mt-8 pt-8 text-center text-[#a3e635]">
              &copy; {new Date().getFullYear()} Game Bird. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        defaultTab={defaultAuthTab}
      />
    </div>
  );
};

export default Landing;
