
import React from 'react';
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Wallet } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

interface BetConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  team: string;
  amount: number;
  isNextGame?: boolean;
}

const BetConfirmationDialog: React.FC<BetConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  team,
  amount,
  isNextGame = false
}) => {
  const { currentUser } = useUser();
  
  const handleConfirm = () => {
    if (!currentUser) {
      toast.error("No User Selected", {
        description: "Please select or create a user first",
        duration: 4000,
        id: "no-user-error", // Add unique ID to prevent duplicates
      });
      onClose();
      return;
    }
    
    if (currentUser.credits < amount) {
      // Enhanced message for zero credits vs insufficient credits
      if (currentUser.credits === 0) {
        toast.error("Zero Credits", {
          description: "You have zero credits. Please ask admin to reload your account.",
          icon: <Wallet className="h-5 w-5 text-red-500" />,
          duration: 5000,
          id: "zero-credits-error", // Add unique ID to prevent duplicates
        });
      } else {
        toast.error("Insufficient Credits", {
          description: `You need ${amount} COINS to place this bet. Please ask admin to reload your account.`,
          icon: <Wallet className="h-5 w-5 text-red-500" />,
          duration: 5000,
          id: "insufficient-credits-error", // Add unique ID to prevent duplicates
        });
      }
      onClose();
      return;
    }
    
    // Call onConfirm and close the dialog immediately
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="bg-gradient-to-r from-[#052240] to-[#004b6b] border-2 border-[#fa1593] shadow-[0_0_30px_rgba(250,21,147,0.6)] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Confirm Your Bet</DialogTitle>
          <DialogDescription asChild>
            <div>
              <div className="text-base font-medium text-[#95deff]">
                Are you sure you want to place a bet of {amount} Sweep Coins on {team}?
              </div>
              
              {isNextGame && (
                <div className="mt-2 p-2 bg-[#95deff]/20 rounded-lg border border-[#95deff]/50 flex items-center text-[#95deff]">
                  Note: This bet is for the next game, not the current one.
                </div>
              )}
              
              {currentUser && currentUser.credits === 0 && (
                <div className="mt-2 p-2 bg-red-500/20 rounded-lg border border-red-500/50 flex items-center text-red-300">
                  <Wallet className="h-4 w-4 mr-2" />
                  Warning: You have zero credits. Please ask admin to reload your account.
                </div>
              )}
              
              {currentUser && currentUser.credits > 0 && currentUser.credits < amount && (
                <div className="mt-2 p-2 bg-red-500/20 rounded-lg border border-red-500/50 flex items-center text-red-300">
                  <Wallet className="h-4 w-4 mr-2" />
                  Warning: You don't have enough credits. Please ask admin to reload your account.
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center gap-4 mt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-[#004b6b] text-[#95deff] hover:bg-[#004b6b]/80 border-[#95deff] rounded-xl"
          >
            <XCircle className="mr-2 h-4 w-4 text-red-400" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="confirm"
            className="rounded-xl bg-gradient-to-r from-[#fa1593] to-[#fa1593]/80 hover:from-[#fa1593]/90 hover:to-[#fa1593]/70 text-white shadow-[0_0_15px_rgba(250,21,147,0.6)]"
            disabled={currentUser?.credits ? currentUser.credits < amount : true}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Confirm Bet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BetConfirmationDialog;
