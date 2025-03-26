
import React, { useEffect, useState } from 'react';

interface NumericAnimationProps {
  value: number;
  duration?: number;
  className?: string;
  withGlow?: boolean;
}

const NumericAnimation: React.FC<NumericAnimationProps> = ({ 
  value, 
  duration = 800, 
  className = "",
  withGlow = false
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    // Don't animate on initial render if value is 0
    if (value === 0 && displayValue === 0) return;
    
    let startValue = displayValue;
    const endValue = value;
    const difference = endValue - startValue;
    const startTime = performance.now();
    
    const animateValue = (timestamp: number) => {
      const runtime = timestamp - startTime;
      const progress = Math.min(runtime / duration, 1);
      
      // Easing function for a more natural animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentValue = Math.round(startValue + difference * easeOutQuart);
      setDisplayValue(currentValue);
      
      if (runtime < duration) {
        requestAnimationFrame(animateValue);
      } else {
        setDisplayValue(endValue);
      }
    };
    
    requestAnimationFrame(animateValue);
  }, [value, duration]);
  
  return (
    <span className={`inline-block transition-all text-black font-bold ${withGlow ? 'text-shadow-glow' : ''} ${className}`}>
      {displayValue.toLocaleString()}
    </span>
  );
};

export default NumericAnimation;
