
import React, { useEffect, useState, useRef } from 'react';

interface FlipCounterProps {
  value: number;
  color?: string;
  className?: string;
  fontClassName?: string;
}

const FlipCounter: React.FC<FlipCounterProps> = ({ 
  value, 
  color = 'white',
  className = '',
  fontClassName = ''
}) => {
  const [prevValue, setPrevValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const lastAnimationTimeRef = useRef<number>(0);
  
  useEffect(() => {
    // Always animate on value change, even if it's the same value as before
    const now = Date.now();
    const timeSinceLastAnimation = now - lastAnimationTimeRef.current;
    
    // Only start a new animation if the previous one finished (or it's been a while)
    if (timeSinceLastAnimation > 100) {
      setIsAnimating(true);
      lastAnimationTimeRef.current = now;
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setPrevValue(value);
      }, 750); // Slightly longer to ensure animation completes
      
      return () => clearTimeout(timer);
    }
  }, [value]); // Only depend on value changes
  
  return (
    <div className={`flip-counter relative ${className}`}>
      <div className="relative h-20 w-20 bg-black/50 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg border border-gray-800" style={{ perspective: '1200px' }}>
        {/* Static display when not animating */}
        {!isAnimating && (
          <div 
            className={`absolute inset-0 flex items-center justify-center ${fontClassName || 'text-5xl font-bold font-mono'}`}
            style={{ color: color }}
          >
            {value}
          </div>
        )}
        
        {/* Animating state */}
        {isAnimating && (
          <>
            {/* Old number (sliding up and out) */}
            <div className="absolute inset-0 slide-up-out flex items-center justify-center">
              <span className={`${fontClassName || 'text-5xl font-bold font-mono'}`} style={{ color: color }}>
                {prevValue}
              </span>
            </div>
            
            {/* New number (sliding down and in) */}
            <div className="absolute inset-0 slide-down-in flex items-center justify-center">
              <span className={`${fontClassName || 'text-5xl font-bold font-mono'}`} style={{ color: color }}>
                {value}
              </span>
            </div>
          </>
        )}
        
        {/* Reflection overlay */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
        
        {/* Bottom shadow */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-black/40"></div>
      </div>
    </div>
  );
};

export default FlipCounter;
