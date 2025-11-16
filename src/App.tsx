
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, HashRouter, useLocation, useNavigate } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { GameStateProvider } from "@/contexts/GameStateContext";
import Index from "./pages/Index";
import OnePocketArena from "./pages/OnePocketArena";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import PaymentPage from "./pages/Payment";
import UserSettings from "./pages/UserSettings";
import ReloadCoinsPage from "./pages/ReloadCoins";
import SignupPage from "./pages/Signup";
import MemberSignupPage from "./pages/MemberSignup";
import FeaturesPage from "./pages/Features";
import AboutPage from "./pages/About";
import FAQPage from "./pages/FAQ";
import "./App.css";

const queryClient = new QueryClient();

// Quick access arena selector component
const ArenaSelector = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Don't show on landing or other non-arena pages
  const isArenasPage = currentPath === "/" || currentPath === "/betting-queue" || currentPath === "/one-pocket-arena";
  
  if (!isArenasPage) return null;

  const handleRotationArena = () => {
    // Mute sounds BEFORE navigation
    (window as any).__MUTE_SOUNDS = true;
    setTimeout(() => {
      (window as any).__MUTE_SOUNDS = false;
    }, 10000);
    navigate("/betting-queue");
  };

  const handleOnePocketArena = () => {
    // Mute sounds BEFORE navigation
    (window as any).__MUTE_SOUNDS = true;
    setTimeout(() => {
      (window as any).__MUTE_SOUNDS = false;
    }, 10000);
    navigate("/one-pocket-arena");
  };

  const isRotation = currentPath === "/" || currentPath === "/betting-queue";
  const isOnePocket = currentPath === "/one-pocket-arena";

  return (
    <div className="fixed bottom-6 left-6 flex gap-2 z-50">
      {/* Rotation Arena Button - HIDDEN */}
      {/* <button
        onDoubleClick={handleRotationArena}
        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
          isRotation
            ? "bg-gradient-to-br from-[#00FF00] to-[#00FFCC] text-black ring-2 ring-[#00FF00]"
            : "bg-gradient-to-br from-[#00FF00] to-[#00FFCC] text-black"
        }`}
        title="Rotation Arena (9 Ball) - Double Click to Switch"
      >
        <span className="text-sm">9</span>
      </button> */}

      {/* One Pocket Arena Button */}
      <button
        onDoubleClick={handleOnePocketArena}
        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
          isOnePocket
            ? "bg-gradient-to-br from-[#00FF00] to-[#00FFCC] text-black ring-2 ring-[#00FF00]"
            : "bg-gradient-to-br from-[#00FF00] to-[#00FFCC] text-black"
        }`}
        title="One Pocket Arena - Double Click to Switch"
      >
        <span className="text-xs">1P</span>
      </button>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <GameStateProvider>
            <Routes>
              {/* Main landing page - keep accessible */}
              <Route path="/" element={<Landing />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/member-signup" element={<MemberSignupPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/about" element={<AboutPage />} />
              {/* 9-BALL ARENA HIDDEN - Redirect betting arena routes to 1-Pocket only */}
              <Route path="/betting-queue" element={<OnePocketArena />} />
              <Route path="/one-pocket-arena" element={<OnePocketArena />} />
              <Route path="/subscription" element={<PaymentPage />} />
              <Route path="/user-settings" element={<UserSettings />} />
              <Route path="/reload-coins" element={<ReloadCoinsPage />} />
              <Route path="/faq" element={<FAQPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ArenaSelector />
          </GameStateProvider>
        </HashRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
