
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { GameStateProvider } from "@/contexts/GameStateContext";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import PaymentPage from "./pages/Payment";
import UserSettings from "./pages/UserSettings";
import ReloadCoinsPage from "./pages/ReloadCoins";
import SignupPage from "./pages/Signup";
import MemberSignupPage from "./pages/MemberSignup";
import FeaturesPage from "./pages/Features";
import AboutPage from "./pages/About";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <GameStateProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/member-signup" element={<MemberSignupPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/betting-queue" element={<Index />} />
              <Route path="/subscription" element={<PaymentPage />} />
              <Route path="/user-settings" element={<UserSettings />} />
              <Route path="/reload-coins" element={<ReloadCoinsPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </GameStateProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
