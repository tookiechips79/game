
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-r from-[#052240] to-[#004b6b] border-2 border-[#fa1593] rounded-2xl shadow-[0_0_30px_rgba(250,21,147,0.6)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">{title}</DialogTitle>
          <DialogDescription className="text-[#95deff]">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 justify-end mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-[#004b6b] text-[#95deff] hover:bg-[#004b6b]/80 border-[#95deff] rounded-xl"
          >
            {cancelText}
          </Button>
          <Button
            variant="pink"
            onClick={handleConfirm}
            className="bg-gradient-to-r from-[#fa1593] to-[#fa1593]/80 text-white rounded-xl hover:from-[#fa1593]/90 hover:to-[#fa1593]/70 shadow-[0_0_15px_rgba(250,21,147,0.6)] transition-all duration-300"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
