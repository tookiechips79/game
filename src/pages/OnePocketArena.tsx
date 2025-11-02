import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, Zap, Coins, CheckSquare, Unlock, 
  Wallet, TimerReset, ReceiptText, SkipForward, ArrowDownUp, ArrowDown, Trash2
} from "lucide-react";
import NumericAnimation from "@/components/NumericAnimation";
import ScoreBoard from "@/components/ScoreBoard";
import GameDescription from "@/components/GameDescription";
import UserCreditSystem, { UserSelector } from "@/components/UserCreditSystem";
import UserWidgetsContainer from "@/components/UserWidgetsContainer";
import BookedBetsReceipt from "@/components/BookedBetsReceipt";
import BetLedger from "@/components/BetLedger";
import BetReceiptsLedger from "@/components/BetReceiptsLedger";
import BirdButton from "@/components/BirdButton";
import GameInfoWindow from "@/components/GameInfoWindow";
import GameHistoryWindow from "@/components/GameHistoryWindow";
import { useUser } from "@/contexts/UserContext";
import { useGameState } from "@/contexts/GameStateContext";
import { Bet, BookedBet, ConfirmationState } from "@/types/user";
import { socketIOService } from "@/services/socketIOService";
import { useSound } from "@/hooks/use-sound";

// ============================================================================
// ONE POCKET ARENA - COMPLETELY SEPARATE BETTING ARENA WITH OWN DATA
// Set window.__ARENA_ID to 'one_pocket' so GameStateContext uses separate storage
// ============================================================================

(window as any).__ARENA_ID = 'one_pocket';

const OnePocketArena = () => {

        {/* Arena Navigation */}
        <div className="flex gap-4 mb-6 justify-center">
          <Link to="/betting-queue">
            <Button 
              variant="outline"
              className="px-6 py-2"
              style={{ borderColor: '#95deff', color: '#95deff' }}
            >
              🎱 9 Ball Arena
            </Button>
          </Link>
          <Button 
            variant="default"
            className="px-6 py-2"
            style={{ backgroundColor: '#fa1593', color: '#fff' }}
          >
            🎯 One Pocket Arena
          </Button>
        </div>
