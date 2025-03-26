
import React from "react";
import BirdButton from "./BirdButton";
import { toast } from "sonner";

const BirdButtonDemo = () => {
  const handleBet = (amount: number) => {
    toast.success(`Placed bet of ${amount} COINS`, {
      description: "Your bet has been successfully placed."
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-8">
      <h2 className="text-2xl font-bold mb-4">Bet Buttons</h2>
      
      <div className="flex flex-wrap gap-6 justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="font-medium">Small Bet (10 COINS)</span>
          <BirdButton 
            variant="pink" 
            amount={10} 
            onClick={() => handleBet(10)} 
          />
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <span className="font-medium">Medium Bet (50 COINS)</span>
          <BirdButton 
            variant="blue" 
            amount={50} 
            onClick={() => handleBet(50)} 
          />
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <span className="font-medium">Large Bet (100 COINS)</span>
          <BirdButton 
            variant="yellow" 
            amount={100} 
            onClick={() => handleBet(100)} 
          />
        </div>
      </div>
    </div>
  );
};

export default BirdButtonDemo;
