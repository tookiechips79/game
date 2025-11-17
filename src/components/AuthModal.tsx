import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/contexts/UserContext";
import { CheckCircle, User, Lock, LogIn, UserPlus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = "login",
}) => {
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { setCurrentUser, addUser, getAllUsers, authenticateUser } = useUser();

  const handleSocialLogin = (provider: "google" | "apple") => {
    setIsLoading(true);
    
    setTimeout(async () => {
      setIsLoading(false);
      
      const randomName = `${provider}User${Math.floor(Math.random() * 1000)}`;
      const randomPassword = Math.random().toString(36).substring(2, 15);
      
      const users = getAllUsers();
      let user = users.find(u => u.name.toLowerCase() === randomName.toLowerCase());
      
      if (!user) {
        try {
          // 👤 Create user via server
          user = await addUser(randomName, randomPassword);
          toast.success(`${provider} Account Created`, {
            description: `New account created via ${provider}`,
            className: "custom-toast-success"
          });
        } catch (error) {
          toast.error(`${provider} Sign-up Failed`, {
            description: error instanceof Error ? error.message : "An error occurred",
            className: "custom-toast-error"
          });
          return;
        }
      }
      
      if (user) {
        setCurrentUser(user);
        toast.success(`${provider} Login Successful`, {
          description: `Logged in as ${user.name}`,
          className: "custom-toast-success"
        });
        onClose();
      }
    }, 1500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginName.trim() || !loginPassword.trim()) {
      toast.error("Login failed", {
        description: "Please enter both username and password.",
        className: "custom-toast-error"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 👤 Authenticate via server
      const user = await authenticateUser(loginName, loginPassword);
      
      if (user) {
        setCurrentUser(user);
        toast.success("Welcome back!", {
          description: `Logged in as ${user.name} (Credits: ${user.credits})`,
          className: "custom-toast-success"
        });
        onClose();
      } else {
        toast.error("Login failed", {
          description: "Invalid username or password. Please try again.",
          className: "custom-toast-error"
        });
      }
    } catch (error) {
      console.error('❌ [AUTH] Login error:', error);
      toast.error("Login error", {
        description: "An error occurred during login. Please try again.",
        className: "custom-toast-error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerName.trim()) {
      toast.error("Registration failed", {
        description: "Please enter a valid name.",
        className: "custom-toast-error"
      });
      return;
    }
    
    if (!registerPassword.trim()) {
      toast.error("Registration failed", {
        description: "Please enter a valid password.",
        className: "custom-toast-error"
      });
      return;
    }
    
    if (registerPassword !== confirmPassword) {
      toast.error("Registration failed", {
        description: "Passwords do not match.",
        className: "custom-toast-error"
      });
      return;
    }
    
    setIsLoading(true);
    
    const users = getAllUsers();
    const userExists = users.some(u => 
      u.name.toLowerCase() === registerName.toLowerCase()
    );
    
    if (userExists) {
      setIsLoading(false);
      toast.error("Registration failed", {
        description: "This name is already taken. Please try another name.",
        className: "custom-toast-error"
      });
      return;
    }
    
    try {
      // 👤 Create user via server
      const newUser = await addUser(registerName, registerPassword);
      setRegistered(true);
      
      setTimeout(() => {
        setCurrentUser(newUser);
        onClose();
        toast.success("Welcome to Game Bird!", {
          description: `Your account has been created and you're now logged in.`,
          className: "custom-toast-success"
        });
      }, 1500);
    } catch (error) {
      toast.error("Registration failed", {
        description: error instanceof Error ? error.message : "An error occurred during registration.",
        className: "custom-toast-error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: "login" | "register") => {
    setActiveTab(tab);
    setRegistered(false);
  };

  const togglePasswordVisibility = (field: 'login' | 'register' | 'confirm') => {
    if (field === 'login') {
      setShowLoginPassword(!showLoginPassword);
    } else if (field === 'register') {
      setShowRegisterPassword(!showRegisterPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center mb-2">
            {activeTab === "login" ? "Welcome Back" : "Create Account"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {activeTab === "login"
              ? "Sign in to your Game Bird account"
              : "Join Game Bird betting community today"}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue={defaultTab}
          value={activeTab}
          onValueChange={(v) => handleTabChange(v as "login" | "register")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            {!isLoading ? (
              <>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Your username"
                        value={loginName}
                        onChange={(e) => setLoginName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-3 text-muted-foreground"
                        onClick={() => togglePasswordVisibility('login')}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    <LogIn className="mr-2 h-4 w-4" /> Sign In
                  </Button>
                </form>
                
                <div className="relative my-4">
                  <Separator className="my-4" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-background px-2 text-muted-foreground text-sm">or continue with</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleSocialLogin("google")} 
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 488 512">
                      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
                    </svg>
                    Google
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleSocialLogin("apple")} 
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 384 512">
                      <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                    </svg>
                    Apple
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-8 space-y-4">
                <div className="animate-pulse">
                  <LogIn className="h-12 w-12 text-primary" />
                </div>
                <p>Signing you in...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            {!isLoading && !registered ? (
              <>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Choose a username"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-3 text-muted-foreground"
                        onClick={() => togglePasswordVisibility('register')}
                      >
                        {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-3 text-muted-foreground"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" /> Create Account
                  </Button>
                </form>
                
                <div className="relative my-4">
                  <Separator className="my-4" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-background px-2 text-muted-foreground text-sm">or sign up with</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleSocialLogin("google")} 
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 488 512">
                      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
                    </svg>
                    Google
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleSocialLogin("apple")} 
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 384 512">
                      <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                    </svg>
                    Apple
                  </Button>
                </div>
              </>
            ) : registered ? (
              <div className="flex flex-col items-center py-8 space-y-4">
                <CheckCircle className="h-12 w-12" style={{ color: '#00FF00' }} />
                <p className="text-center">
                  Account created successfully! Logging you in...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 space-y-4">
                <div className="animate-pulse">
                  <UserPlus className="h-12 w-12 text-primary" />
                </div>
                <p>Creating your account...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
