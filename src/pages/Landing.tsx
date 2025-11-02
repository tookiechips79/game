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
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/pool-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        position: 'relative'
      }}
    >
      {/* Overlay for readability */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(5, 34, 64, 0.5)', zIndex: 1 }}></div>
      
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
            <Link to="/about">
              <Button variant="ghost" style={{ color: '#95deff' }} className="hover:bg-[#004b6b]/70">
                About
              </Button>
            </Link>
            <Link to="/features">
              <Button variant="ghost" style={{ color: '#95deff' }} className="hover:bg-[#004b6b]/70">
                Features
              </Button>
            </Link>
            <Link to="/faq">
              <Button variant="ghost" style={{ color: '#95deff' }} className="hover:bg-[#004b6b]/70">
                FAQ
              </Button>
            </Link>
            
            {currentUser ? (
              <>
                <div className="hidden md:flex items-center rounded-full pl-3 pr-1 py-1 mr-2" style={{ backgroundColor: 'rgba(0, 75, 107, 0.7)' }}>
                  <span className="mr-2" style={{ color: '#fa1593' }}>{currentUser.name}</span>
                  <div className="rounded-full h-7 w-7 flex items-center justify-center" style={{ backgroundColor: '#fa1593' }}>
                    <User size={16} style={{ color: 'white' }} />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="hover:bg-red-900/50"
                  style={{ borderColor: '#fa1593', color: '#fa1593' }}
                  onClick={handleLogout}
                >
                  <LogOut size={18} className="mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" style={{ borderColor: '#fa1593', color: '#fa1593' }} className="hover:bg-[#fa1593]/20" onClick={openLoginModal}>
                  <LogIn size={18} className="mr-2" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
              </>
            )}
            
            <Link to="/betting-queue">
              <Button className="font-bold flex items-center gap-2" style={{ backgroundColor: '#fa1593', color: 'white' }}>
                <Ticket size={18} />
                <span className="hidden sm:inline">Rotation</span>
              </Button>
            </Link>
            <Link to="/one-pocket-arena">
              <Button className="font-bold flex items-center gap-2" style={{ backgroundColor: '#95deff', color: '#052240' }}>
                <Trophy size={18} />
                <span className="hidden sm:inline">One Pocket</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <div className="container mx-auto pt-8 pb-12 px-4 relative z-10">
        {/* Hero Content */}
        <div className="flex flex-col md:flex-row items-center gap-12 mb-20">
          <div className="flex-1">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              The Ultimate <span style={{ color: '#95deff' }}>Betting</span> Experience
            </h1>
            <p className="text-xl mb-8" style={{ color: '#95deff' }}>
              Join Game Bird for the most exciting peer-to-peer betting platform. 
              Create a free account to view live scoreboards and betting queues. 
              Subscribe to place bets and win real coins!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {currentUser ? (
                <Button 
                  className="font-bold px-6 py-6 text-lg w-full sm:w-auto"
                  style={{ backgroundColor: '#fa1593', color: 'white' }}
                  onClick={() => navigate('/betting-queue')}
                >
                  Start Betting Now <Ticket className="ml-2" />
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Link to="/member-signup">
                    <Button 
                      className="font-bold px-6 py-6 text-lg w-full sm:w-auto"
                      style={{ backgroundColor: '#fa1593', color: 'white' }}
                    >
                      Sign Up & Start Betting <LogIn className="ml-2" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline"
                    className="px-6 py-6 text-lg w-full sm:w-auto"
                    style={{ borderColor: '#95deff', color: '#95deff' }}
                    onClick={openLoginModal}
                  >
                    Log In <LogIn className="ml-2" />
                  </Button>
                </div>
              )}
              <Link to="/features">
                <Button variant="outline" className="px-6 py-6 text-lg w-full sm:w-auto" style={{ borderColor: '#95deff', color: '#95deff' }}>
                  Learn More
                </Button>
              </Link>
            </div>
            
            {!currentUser && (
              <div className="mt-6 flex items-center">
                <span className="mr-3" style={{ color: '#95deff' }}>Or sign up with:</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-full h-8 w-8 p-0 mr-2"
                  style={{ borderColor: '#95deff', color: '#95deff' }}
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
                  className="rounded-full h-8 w-8 p-0"
                  style={{ borderColor: '#95deff', color: '#95deff' }}
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
              className="w-full max-w-md drop-shadow-[0_0_20px_rgba(149,222,255,0.4)]"
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center text-white mb-12">
              Why Choose <span style={{ color: '#95deff' }}>Game Bird</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-white shadow-xl transition-all duration-300" style={{ backgroundColor: 'rgba(0, 75, 107, 0.7)', borderColor: '#95deff' }}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full p-3 mb-4" style={{ backgroundColor: '#fa1593' }}>
                      <DollarSign size={32} style={{ color: 'white' }} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Instant Matching</h3>
                    <p style={{ color: '#95deff' }}>
                      Our smart algorithm instantly matches your bets with other players for quick, seamless transactions.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="text-white shadow-xl transition-all duration-300" style={{ backgroundColor: 'rgba(0, 75, 107, 0.7)', borderColor: '#95deff' }}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full p-3 mb-4" style={{ backgroundColor: '#fa1593' }}>
                      <Users size={32} style={{ color: 'white' }} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Peer-to-Peer</h3>
                    <p style={{ color: '#95deff' }}>
                      Bet directly against other players, not the house. Create and join betting pools with friends.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="text-white shadow-xl transition-all duration-300" style={{ backgroundColor: 'rgba(0, 75, 107, 0.7)', borderColor: '#95deff' }}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full p-3 mb-4" style={{ backgroundColor: '#fa1593' }}>
                      <BadgeCheck size={32} style={{ color: 'white' }} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Secure Platform</h3>
                    <p style={{ color: '#95deff' }}>
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
            <p className="text-xl max-w-full mx-auto" style={{ color: '#95deff' }}>
              Start with a free account to explore, then upgrade to place bets and win real coins
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-full mx-auto">
            {/* Free Access */}
            <Card className="text-white shadow-xl transition-all duration-300" style={{ backgroundColor: 'rgba(0, 75, 107, 0.7)', borderColor: '#95deff' }}>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="rounded-full p-4 mb-4 mx-auto w-16 h-16 flex items-center justify-center" style={{ backgroundColor: '#95deff' }}>
                    <Eye size={32} style={{ color: '#052240' }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Free Access</h3>
                  <p className="text-3xl font-bold mb-2" style={{ color: '#95deff' }}>$0</p>
                  <p className="text-gray-300">Perfect for getting started</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center" style={{ color: '#95deff' }}>
                    <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                    View live scoreboard
                  </li>
                  <li className="flex items-center" style={{ color: '#95deff' }}>
                    <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                    Watch betting queues
                  </li>
                  <li className="flex items-center" style={{ color: '#95deff' }}>
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
                    <Button className="w-full font-bold" style={{ backgroundColor: '#95deff', color: '#052240' }}>
                      Get Free Access
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Premium Access */}
            <Card className="text-white shadow-xl transition-all duration-300 relative" style={{ backgroundColor: 'rgba(0, 75, 107, 0.7)', borderColor: '#fa1593' }}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="px-4 py-1 rounded-full text-sm font-bold" style={{ backgroundColor: '#fa1593', color: 'white' }}>
                  Most Popular
                </span>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="rounded-full p-4 mb-4 mx-auto w-16 h-16 flex items-center justify-center" style={{ backgroundColor: '#fa1593' }}>
                    <Trophy size={32} style={{ color: 'white' }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Premium Access</h3>
                  <p className="text-3xl font-bold mb-2" style={{ color: '#fa1593' }}>$20/month</p>
                  <p className="text-gray-300">Full betting experience</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center" style={{ color: '#95deff' }}>
                    <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                    Everything in Free Access
                  </li>
                  <li className="flex items-center" style={{ color: '#95deff' }}>
                    <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                    Place unlimited bets
                  </li>
                  <li className="flex items-center" style={{ color: '#95deff' }}>
                    <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                    Win real coins
                  </li>
                  <li className="flex items-center" style={{ color: '#95deff' }}>
                    <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                    Cash out winnings
                  </li>
                </ul>
                
                {!currentUser ? (
                  <Link to="/member-signup" className="block">
                    <Button className="w-full font-bold" style={{ backgroundColor: '#fa1593', color: 'white' }}>
                      Sign Up & Subscribe
                    </Button>
                  </Link>
                ) : (
                  <Link to="/subscription" className="block">
                    <Button className="w-full font-bold" style={{ backgroundColor: '#fa1593', color: 'white' }}>
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
          <div className="rounded-xl p-8 flex flex-col md:flex-row items-center justify-between" style={{ backgroundColor: 'rgba(0, 75, 107, 0.7)', borderColor: '#95deff', borderWidth: '1px' }}>
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
              <p className="max-w-xl" style={{ color: '#95deff' }}>
                Join thousands of players already using Game Bird. Create your free account today!
              </p>
            </div>
            {currentUser ? (
              <Link to="/betting-queue" className="mt-6 md:mt-0">
                <Button className="font-bold px-8 py-6 text-lg flex items-center gap-2" style={{ backgroundColor: '#fa1593', color: 'white' }}>
                  <Ticket size={20} />
                  Open Betting
                </Button>
              </Link>
            ) : (
              <Link to="/member-signup" className="mt-6 md:mt-0">
                <Button className="font-bold px-8 py-6 text-lg flex items-center gap-2" style={{ backgroundColor: '#fa1593', color: 'white' }}>
                  <LogIn size={20} />
                  Get Started Free
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-white py-12" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-2 mb-6 md:mb-0">
                <img 
                  src="/lovable-uploads/4dfcf9c9-cbb9-4a75-94ab-bcdb38a8091e.png" 
                  alt="Game Bird Logo" 
                  className="w-10 h-10 object-contain"
                />
                <span className="text-xl font-bold" style={{ color: '#95deff' }}>Game Bird</span>
              </div>
              <div className="flex gap-8">
                <div>
                  <h3 className="font-bold mb-2" style={{ color: '#fa1593' }}>Platform</h3>
                  <ul className="space-y-1">
                    <li><a href="#" style={{ color: '#95deff' }}>How it works</a></li>
                    <li><a href="#" style={{ color: '#95deff' }}>Features</a></li>
                    <li><a href="#" style={{ color: '#95deff' }}>Security</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-2" style={{ color: '#fa1593' }}>Company</h3>
                  <ul className="space-y-1">
                    <li><a href="#" style={{ color: '#95deff' }}>About us</a></li>
                    <li><a href="#" style={{ color: '#95deff' }}>Contact</a></li>
                    <li><a href="#" style={{ color: '#95deff' }}>Careers</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-2" style={{ color: '#fa1593' }}>Legal</h3>
                  <ul className="space-y-1">
                    <li><a href="#" style={{ color: '#95deff' }}>Terms</a></li>
                    <li><a href="#" style={{ color: '#95deff' }}>Privacy</a></li>
                    <li><a href="#" style={{ color: '#95deff' }}>Cookies</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t mt-8 pt-8 text-center" style={{ borderColor: '#004b6b', color: '#95deff' }}>
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
