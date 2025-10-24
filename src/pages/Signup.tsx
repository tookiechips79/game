import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  UserPlus, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Shield, 
  CreditCard, 
  Trophy,
  Home,
  User,
  Lock
} from "lucide-react";
import { toast } from "sonner";

const SignupPage = () => {
  const { addUser, setCurrentUser, getAllUsers } = useUser();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    email: "",
    agreeToTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter a valid name");
      return;
    }
    
    if (!formData.password.trim()) {
      toast.error("Please enter a password");
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (!formData.agreeToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }
    
    // Check if user already exists
    const users = getAllUsers();
    const userExists = users.some(u => 
      u.name.toLowerCase() === formData.name.toLowerCase()
    );
    
    if (userExists) {
      toast.error("Username already taken. Please choose a different name.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new user
      const newUser = addUser(formData.name.trim(), formData.password);
      
      // Set as current user
      setCurrentUser(newUser);
      
      toast.success("Account Created Successfully!", {
        description: `Welcome to Game Bird, ${newUser.name}! You can now access the scoreboard and betting queue.`,
        duration: 5000,
      });
      
      // Navigate to betting queue
      setTimeout(() => {
        navigate("/betting-queue");
      }, 2000);
      
    } catch (error) {
      toast.error("Signup Failed", {
        description: error instanceof Error ? error.message : "An error occurred during signup",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a192f] to-[#1a2332] border-b border-[#F97316]/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#F97316] hover:text-[#FBBF24] hover:bg-[#F97316]/10"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <div className="h-6 w-px bg-[#F97316]/30" />
              <div className="flex items-center space-x-2">
                <UserPlus className="h-6 w-6 text-[#F97316]" />
                <h1 className="text-2xl font-bold text-white">Create Account</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Signup Form */}
            <div className="space-y-6">
              <Card className="glass-card border-[#F97316]/50 bg-[#0a192f]/70 shadow-lg rounded-2xl">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-3xl font-bold text-[#F97316] flex items-center justify-center space-x-3">
                    <UserPlus className="h-8 w-8" />
                    <span>Join Game Bird</span>
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-lg">
                    Create your account and start your betting journey
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[#F97316] font-medium">
                        Username
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="pl-10 bg-gray-800/50 border-gray-600 text-white focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
                          placeholder="Choose a username"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[#F97316] font-medium">
                        Email (Optional)
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="bg-gray-800/50 border-gray-600 text-white focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
                        placeholder="your@email.com"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-[#F97316] font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className="pl-10 pr-10 bg-gray-800/50 border-gray-600 text-white focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
                          placeholder="Create a password"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-[#F97316] font-medium">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          className="pl-10 pr-10 bg-gray-800/50 border-gray-600 text-white focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
                          placeholder="Confirm your password"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Terms Agreement */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                        className="border-[#F97316] data-[state=checked]:bg-[#F97316] data-[state=checked]:border-[#F97316]"
                      />
                      <Label htmlFor="terms" className="text-sm text-gray-300">
                        I agree to the{" "}
                        <Link to="/terms" className="text-[#F97316] hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy" className="text-[#F97316] hover:underline">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-14 bg-[#F97316] hover:bg-[#FBBF24] text-black font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <UserPlus className="h-5 w-5" />
                          <span>Create Account</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Benefits Section */}
            <div className="space-y-6">
              <Card className="glass-card border-[#1EAEDB]/50 bg-[#0a192f]/50 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-[#1EAEDB] flex items-center space-x-2">
                    <Trophy className="h-6 w-6" />
                    <span>What You Get</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-[#a3e635] mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-[#a3e635] font-medium">Free Access</h3>
                      <p className="text-gray-300 text-sm">
                        View live scoreboard and betting queues without any cost
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-[#a3e635] mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-[#a3e635] font-medium">Real-time Updates</h3>
                      <p className="text-gray-300 text-sm">
                        Watch live game scores and betting activity as it happens
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-[#a3e635] mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-[#a3e635] font-medium">Secure Platform</h3>
                      <p className="text-gray-300 text-sm">
                        Your account and data are protected with industry-standard security
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-[#F97316]/50 bg-[#0a192f]/50 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-[#F97316] flex items-center space-x-2">
                    <CreditCard className="h-6 w-6" />
                    <span>Ready to Bet?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-[#F97316] mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-[#F97316] font-medium">Subscribe to Bet</h3>
                      <p className="text-gray-300 text-sm">
                        Purchase coins to place bets and participate in the action
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Trophy className="h-5 w-5 text-[#F97316] mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-[#F97316] font-medium">Win Real Coins</h3>
                      <p className="text-gray-300 text-sm">
                        Cash out your winnings and track your betting history
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Link to="/subscription">
                      <Button className="w-full bg-[#F97316] hover:bg-[#FBBF24] text-black font-bold">
                        View Subscription Plans
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-gray-300">
                  Already have an account?{" "}
                  <Link to="/" className="text-[#F97316] hover:text-[#FBBF24] font-medium">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
