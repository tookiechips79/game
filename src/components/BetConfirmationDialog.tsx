
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
      <DialogContent className="bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 border-2 border-[#a3e635]/50 shadow-xl shadow-[#a3e635]/20 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#a3e635]">Confirm Your Bet</DialogTitle>
          <DialogDescription asChild>
            <div>
              <div className="text-base font-medium text-white">
                Are you sure you want to place a bet of {amount} COINS on {team}?
              </div>
              
              {isNextGame && (
                <div className="mt-2 p-2 bg-[#a3e635]/20 rounded-lg border border-[#a3e635]/50 flex items-center text-[#a3e635]">
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
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600 rounded-xl"
          >
            <XCircle className="mr-2 h-4 w-4 text-red-500" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="confirm"
            className="rounded-xl bg-[#a3e635] hover:bg-[#a3e635]/80 text-black"
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
