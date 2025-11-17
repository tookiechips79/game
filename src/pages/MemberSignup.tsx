import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  UserPlus, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Shield, 
  CreditCard, 
  Trophy,
  User,
  Lock,
  Mail,
  Phone,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const MemberSignupPage = () => {
  const { addUser, setCurrentUser, getAllUsers, socialLogin } = useUser();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    
    // Preferences
    marketingConsent: false,
    agreeToTerms: false,
    agreeToPrivacy: false,
    ageVerification: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) {
      toast.error("Please enter your first name");
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error("Please enter your last name");
      return false;
    }
    if (!formData.username.trim()) {
      toast.error("Please enter a username");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter your email address");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }
    if (!formData.password.trim()) {
      toast.error("Please enter a password");
      return false;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    
    // Check if username already exists
    const users = getAllUsers();
    const userExists = users.some(u => 
      u.name.toLowerCase() === formData.username.toLowerCase()
    );
    
    if (userExists) {
      toast.error("Username already taken. Please choose a different username.");
      return false;
    }
    
    return true;
  };


  const validateStep2 = () => {
    if (!formData.agreeToTerms) {
      toast.error("You must agree to the Terms of Service");
      return false;
    }
    if (!formData.agreeToPrivacy) {
      toast.error("You must agree to the Privacy Policy");
      return false;
    }
    if (!formData.ageVerification) {
      toast.error("You must verify that you are at least 18 years old");
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create new user with full name via server
      const fullName = `${formData.firstName} ${formData.lastName}`;
      const newUser = await addUser(fullName, formData.password);
      
      // Set as current user
      setCurrentUser(newUser);
      
      toast.success("Account Created Successfully!", {
        description: `Welcome to Game Bird, ${fullName}! You can view the scoreboard and betting queues, but need to subscribe to place bets.`,
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

  const handleSocialLogin = (provider: "google" | "apple") => {
    try {
      const newUser = socialLogin(provider);
      
      toast.success("Account Created Successfully!", {
        description: `Welcome to Game Bird, ${newUser.name}! You can view the scoreboard and betting queues, but need to subscribe to place bets.`,
        duration: 5000,
      });
      
      // Navigate to betting queue
      setTimeout(() => {
        navigate("/betting-queue");
      }, 2000);
      
    } catch (error) {
      toast.error("Social Login Failed", {
        description: error instanceof Error ? error.message : "An error occurred during social login",
      });
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#95deff' }}>Basic Information</h2>
        <p className="text-gray-300">Let's start with your basic details</p>
      </div>

      {/* Social Login Options */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black px-2 text-gray-400">Or continue with</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-full bg-white hover:bg-gray-50 text-black border-gray-300"
            onClick={() => handleSocialLogin("google")}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="w-full bg-black hover:bg-gray-900 text-white border-gray-600"
            onClick={() => handleSocialLogin("apple")}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Continue with Apple
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="font-medium" style={{ color: '#95deff' }}>
            First Name *
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-600 text-white"
              style={{ focusBorderColor: '#95deff', focusRingColor: 'rgba(149, 222, 255, 0.2)' }}
              placeholder="Enter your first name"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="font-medium" style={{ color: '#95deff' }}>
            Last Name *
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-600 text-white"
              style={{ focusBorderColor: '#95deff', focusRingColor: 'rgba(149, 222, 255, 0.2)' }}
              placeholder="Enter your last name"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username" className="font-medium" style={{ color: '#95deff' }}>
          Username *
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange("username", e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-600 text-white"
            style={{ focusBorderColor: '#95deff', focusRingColor: 'rgba(149, 222, 255, 0.2)' }}
            placeholder="Choose a unique username"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="font-medium" style={{ color: '#95deff' }}>
          Email Address *
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-600 text-white"
            style={{ focusBorderColor: '#95deff', focusRingColor: 'rgba(149, 222, 255, 0.2)' }}
            placeholder="your@email.com"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="font-medium" style={{ color: '#95deff' }}>
          Phone Number *
        </Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-600 text-white"
            style={{ focusBorderColor: '#95deff', focusRingColor: 'rgba(149, 222, 255, 0.2)' }}
            placeholder="(555) 123-4567"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="font-medium" style={{ color: '#95deff' }}>
            Password *
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="pl-10 pr-10 bg-gray-800/50 border-gray-600 text-white"
              style={{ focusBorderColor: '#95deff', focusRingColor: 'rgba(149, 222, 255, 0.2)' }}
              placeholder="Create a strong password"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="font-medium" style={{ color: '#95deff' }}>
            Confirm Password *
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              className="pl-10 pr-10 bg-gray-800/50 border-gray-600 text-white"
              style={{ focusBorderColor: '#95deff', focusRingColor: 'rgba(149, 222, 255, 0.2)' }}
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
      </div>
    </div>
  );


  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#95deff' }}>Terms & Verification</h2>
        <p className="text-gray-300">Please review and accept our terms</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="ageVerification"
            checked={formData.ageVerification}
            onCheckedChange={(checked) => handleInputChange("ageVerification", checked as boolean)}
            className="mt-1"
            style={{ borderColor: '#95deff', ...(formData.ageVerification && { backgroundColor: '#95deff' }) }}
          />
          <Label htmlFor="ageVerification" className="text-sm text-gray-300">
            I confirm that I am at least 18 years old and legally allowed to participate in betting activities *
          </Label>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="agreeToTerms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
            className="mt-1"
            style={{ borderColor: '#95deff', ...(formData.agreeToTerms && { backgroundColor: '#95deff' }) }}
          />
          <Label htmlFor="agreeToTerms" className="text-sm text-gray-300">
            I agree to the{" "}
            <Link to="/terms" className="hover:underline" style={{ color: '#95deff' }}>
              Terms of Service
            </Link>{" "}
            and understand the betting rules and regulations *
          </Label>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="agreeToPrivacy"
            checked={formData.agreeToPrivacy}
            onCheckedChange={(checked) => handleInputChange("agreeToPrivacy", checked as boolean)}
            className="mt-1"
            style={{ borderColor: '#95deff', ...(formData.agreeToPrivacy && { backgroundColor: '#95deff' }) }}
          />
          <Label htmlFor="agreeToPrivacy" className="text-sm text-gray-300">
            I agree to the{" "}
            <Link to="/privacy" className="hover:underline" style={{ color: '#95deff' }}>
              Privacy Policy
            </Link>{" "}
            and consent to the processing of my personal data *
          </Label>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="marketingConsent"
            checked={formData.marketingConsent}
            onCheckedChange={(checked) => handleInputChange("marketingConsent", checked as boolean)}
            className="mt-1"
            style={{ borderColor: '#95deff', ...(formData.marketingConsent && { backgroundColor: '#95deff' }) }}
          />
          <Label htmlFor="marketingConsent" className="text-sm text-gray-300">
            I would like to receive promotional emails and updates about new features (optional)
          </Label>
        </div>
      </div>

      <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(149, 222, 255, 0.1)', borderColor: 'rgba(149, 222, 255, 0.3)', borderWidth: '1px' }}>
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
          <div>
            <h3 className="font-medium mb-2" style={{ color: '#95deff' }}>Important Notice</h3>
            <p className="text-gray-300 text-sm">
              By creating an account, you acknowledge that you understand the risks associated with betting and 
              that you are responsible for your own actions. Please bet responsibly and within your means.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a192f] to-[#1a2332] border-b" style={{ borderColor: 'rgba(149, 222, 255, 0.3)' }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-6 w-6" style={{ color: '#95deff' }} />
                <h1 className="text-2xl font-bold text-white">Member Registration</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-300">Step {currentStep} of {totalSteps}</span>
              <div className="flex space-x-1">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i + 1 <= currentStep ? "" : "bg-gray-600"
                    }`}
                    style={i + 1 <= currentStep ? { backgroundColor: '#95deff' } : {}}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card shadow-lg rounded-2xl" style={{ borderColor: 'rgba(149, 222, 255, 0.5)', backgroundColor: 'rgba(10, 25, 47, 0.7)' }}>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold flex items-center justify-center space-x-3" style={{ color: '#95deff' }}>
                <Shield className="h-8 w-8" />
                <span>Complete Registration</span>
              </CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                Fill out all required information to access the platform
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className="hover:bg-opacity-20"
                    style={{ borderColor: 'rgba(149, 222, 255, 0.5)', color: '#95deff' }}
                  >
                    Previous
                  </Button>

                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="font-bold"
                      style={{ backgroundColor: '#95deff', color: '#052240' }}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="font-bold px-8"
                      style={{ backgroundColor: '#95deff', color: '#052240' }}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5" />
                          <span>Complete Registration</span>
                        </div>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Benefits Card */}
          <Card className="mt-6 glass-card shadow-lg rounded-2xl" style={{ borderColor: 'rgba(149, 222, 255, 0.5)', backgroundColor: 'rgba(10, 25, 47, 0.5)' }}>
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Trophy className="h-5 w-5 mt-1 flex-shrink-0" style={{ color: '#95deff' }} />
                <div>
                  <h3 className="font-medium mb-2" style={{ color: '#95deff' }}>What You Get After Registration</h3>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Access to live scoreboard and betting queues</li>
                    <li>• View real-time game progress and betting activity</li>
                    <li>• Option to subscribe for full betting capabilities</li>
                    <li>• Secure account with encrypted data protection</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberSignupPage;
