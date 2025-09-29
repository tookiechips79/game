
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";

interface GameDescriptionProps {
  isAdmin: boolean;
  initialDescription?: string;
  onDescriptionChange?: (description: string) => void;
}

interface GameMetadata {
  playerA: string;
  playerB: string;
  spot: string;
  amountBet: string;
  location: string;
  raceTo: string;
}

const GameDescription: React.FC<GameDescriptionProps> = ({
  isAdmin = false,
  initialDescription = "",
  onDescriptionChange,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  
  // Use the synchronized description from props instead of local state
  const description = initialDescription;
  
  // Initialize metadata from description if available
  const parseInitialMetadata = (): GameMetadata => {
    try {
      // Try to parse the description as JSON
      const parsed = JSON.parse(description);
      if (parsed && typeof parsed === 'object') {
        return {
          playerA: parsed.playerA || '',
          playerB: parsed.playerB || '',
          spot: parsed.spot || '',
          amountBet: parsed.amountBet || '',
          location: parsed.location || '',
          raceTo: parsed.raceTo || ''
        };
      }
    } catch (e) {
      // If parsing fails, it's a simple string description
    }
    
    // Default empty values
    return {
      playerA: '',
      playerB: '',
      spot: '',
      amountBet: '',
      location: '',
      raceTo: ''
    };
  };
  
  const [metadata, setMetadata] = useState<GameMetadata>(parseInitialMetadata());
  
  // Update metadata when description changes (for real-time sync)
  useEffect(() => {
    setMetadata(parseInitialMetadata());
  }, [description]);
  
  const handleSave = () => {
    // Create a formatted description from the metadata with *** separators
    const formattedDescription = `${metadata.playerA} vs ${metadata.playerB} *** ${metadata.spot} *** Race to ${metadata.raceTo} *** $${metadata.amountBet} *** ${metadata.location}`;
    
    // Save the formatted string to the synchronized state
    if (onDescriptionChange) {
      onDescriptionChange(formattedDescription);
    }
    
    setIsEditing(false);
  };

  useEffect(() => {
    if (!description || isEditing) return;
    
    const scrollAnimation = () => {
      if (scrollerRef.current) {
        scrollerRef.current.scrollLeft += 1;
        
        if (scrollerRef.current.scrollLeft >= scrollerRef.current.scrollWidth / 3) {
          requestAnimationFrame(() => {
            if (scrollerRef.current) {
              scrollerRef.current.style.scrollBehavior = 'auto';
              scrollerRef.current.scrollLeft = 0;
              setTimeout(() => {
                if (scrollerRef.current) {
                  scrollerRef.current.style.scrollBehavior = 'smooth';
                }
              }, 50);
            }
          });
        }
      }
    };

    const animationInterval = setInterval(scrollAnimation, 20);
    
    return () => clearInterval(animationInterval);
  }, [description, isEditing]);
  
  return (
    <Card className="glass-card border-2 border-[#a3e635] overflow-hidden shadow-xl mb-6 hover:shadow-[#a3e635]/30 rounded-2xl transition-all">
      <CardContent className="p-4">
        {isAdmin && isEditing ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Player A</label>
                <Input
                  value={metadata.playerA}
                  onChange={(e) => setMetadata({...metadata, playerA: e.target.value})}
                  placeholder="Player A name"
                  className="bg-gray-700/70 border-gray-600 text-white focus:border-[#FF00FF] focus:ring-[#FF00FF]/20 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Player B</label>
                <Input
                  value={metadata.playerB}
                  onChange={(e) => setMetadata({...metadata, playerB: e.target.value})}
                  placeholder="Player B name"
                  className="bg-gray-700/70 border-gray-600 text-white focus:border-[#FF00FF] focus:ring-[#FF00FF]/20 rounded-xl"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Spot</label>
                <Input
                  value={metadata.spot}
                  onChange={(e) => setMetadata({...metadata, spot: e.target.value})}
                  placeholder="Game spot (e.g. 8-ball, 9-ball)"
                  className="bg-gray-700/70 border-gray-600 text-white focus:border-[#FF00FF] focus:ring-[#FF00FF]/20 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Race To</label>
                <Input
                  value={metadata.raceTo}
                  onChange={(e) => setMetadata({...metadata, raceTo: e.target.value})}
                  placeholder="Race to (e.g. 5)"
                  className="bg-gray-700/70 border-gray-600 text-white focus:border-[#FF00FF] focus:ring-[#FF00FF]/20 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Amount Bet</label>
                <Input
                  value={metadata.amountBet}
                  onChange={(e) => setMetadata({...metadata, amountBet: e.target.value})}
                  placeholder="Amount (e.g. 100)"
                  className="bg-gray-700/70 border-gray-600 text-white focus:border-[#FF00FF] focus:ring-[#FF00FF]/20 rounded-xl"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Location</label>
              <Input
                value={metadata.location}
                onChange={(e) => setMetadata({...metadata, location: e.target.value})}
                placeholder="Location"
                className="bg-gray-700/70 border-gray-600 text-white focus:border-[#FF00FF] focus:ring-[#FF00FF]/20 rounded-xl"
              />
            </div>
            
            <div className="flex gap-2 justify-end mt-2">
              <Button 
                onClick={handleSave} 
                className="bg-gradient-to-r from-[#FF00FF] to-[#990099] hover:from-[#FF00FF]/90 hover:to-[#990099]/90 text-white rounded-xl"
              >
                Save
              </Button>
              <Button 
                onClick={() => setIsEditing(false)} 
                variant="outline" 
                className="bg-gray-700 text-white hover:bg-gray-600 rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            {description ? (
              <div 
                ref={scrollerRef}
                className="overflow-x-hidden py-2 whitespace-nowrap"
                style={{ 
                  scrollBehavior: 'smooth', 
                  msOverflowStyle: 'none', 
                  scrollbarWidth: 'none' 
                }}
              >
                <div className="inline-block">
                  <span className="font-extrabold text-xl md:text-2xl uppercase tracking-wider bg-gradient-to-r from-[#a3e635] via-white to-[#a3e635] text-transparent bg-clip-text animate-pulse">
                    {description.toUpperCase()}
                  </span>
                  <span className="font-extrabold text-xl md:text-2xl uppercase tracking-wider bg-gradient-to-r from-[#a3e635] via-white to-[#a3e635] text-transparent bg-clip-text animate-pulse ml-16">
                    {description.toUpperCase()}
                  </span>
                  <span className="font-extrabold text-xl md:text-2xl uppercase tracking-wider bg-gradient-to-r from-[#a3e635] via-white to-[#a3e635] text-transparent bg-clip-text animate-pulse ml-16">
                    {description.toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-400 italic">
                {isAdmin ? "Click edit to add a game description" : "No game description available"}
              </p>
            )}
            
            {isAdmin && !isEditing && (
              <Button 
                onClick={() => setIsEditing(true)} 
                variant="outline" 
                size="sm" 
                className="absolute right-0 top-0 bg-gray-700/70 text-[#a3e635] hover:bg-gray-700 hover:text-[#a3e635]/80 rounded-xl"
              >
                Edit
              </Button>
            )}
            
            {description && !isAdmin && (
              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2">
                <Info className="h-5 w-5 text-[#a3e635]" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GameDescription;
