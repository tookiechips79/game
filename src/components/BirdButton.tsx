import React from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";

export type BirdButtonVariant = "red" | "yellow" | "blue" | "pink";

interface BirdButtonProps extends Omit<ButtonProps, "variant"> {
  variant?: BirdButtonVariant;
  amount: number;
  onClick: () => void;
}

const BirdButton = ({
  variant = "red",
  amount,
  onClick,
  className,
  ...props
}: BirdButtonProps) => {
  // Use the yellow styling for all variants but keep the specific images
  const baseClasses = "bg-[#FEF7CD] hover:bg-[#FEF7CD]/90 text-black border-2 border-black/20 shadow-[0_0_15px_rgba(254,247,205,0.7)]";

  return (
    <Button
      className={cn(
        "relative rounded-full p-5 min-w-[100px] font-bold flex flex-col items-center justify-center gap-1 transition-all duration-300",
        baseClasses,
        className
      )}
      onClick={onClick}
      {...props}
    >
      <div className="relative w-10 h-10 mb-1">
        {variant === "yellow" ? (
          <img 
            src="/lovable-uploads/06326b27-1096-4c03-8281-991f2f5e699c.png" 
            alt="Yellow bird" 
            className="w-full h-full object-contain" 
          />
        ) : variant === "pink" ? (
          <img 
            src="/lovable-uploads/16d7d356-c89e-4caa-aebe-6bfd0786785b.png" 
            alt="Pink bird" 
            className="w-full h-full object-contain" 
          />
        ) : variant === "blue" ? (
          <img 
            src="/lovable-uploads/3a50ed04-00c0-47ff-b0ab-21359376a5d5.png" 
            alt="Blue bird" 
            className="w-full h-full object-contain" 
          />
        ) : (
          <img 
            src="/lovable-uploads/a6cebd3f-dc72-4298-a961-a44287d2f143.png" 
            alt="Bird logo" 
            className="w-full h-full object-contain"
          />
        )}
      </div>
    </Button>
  );
};

export default BirdButton;
